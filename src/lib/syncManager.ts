/**
 * Sync Manager - Handles background synchronization with server
 * Implements offline-first architecture with automatic retry
 */

import { db, type SyncOperation } from './db';
import type { Scan } from '@/types/scan';

const MAX_RETRIES = 5;
const RETRY_DELAY = 2000; // 2 seconds
const SYNC_INTERVAL = 10000; // Check every 10 seconds

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline';

class SyncManager {
  private syncInterval: NodeJS.Timeout | null = null;
  private isSyncing = false;
  private listeners: Set<(status: SyncStatus, pendingCount: number) => void> = new Set();

  /**
   * Start automatic background sync
   */
  startAutoSync() {
    if (this.syncInterval) return;

    console.log('🔄 Starting auto-sync...');
    
    // Initial sync
    this.sync();

    // Regular sync checks
    this.syncInterval = setInterval(() => {
      this.sync();
    }, SYNC_INTERVAL);

    // Sync when coming back online
    window.addEventListener('online', () => {
      console.log('📶 Connection restored - triggering sync');
      this.sync();
    });
  }

  /**
   * Stop automatic sync
   */
  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Add listener for sync status changes
   */
  onStatusChange(callback: (status: SyncStatus, pendingCount: number) => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(status: SyncStatus, pendingCount: number) {
    this.listeners.forEach(callback => callback(status, pendingCount));
  }

  /**
   * Main sync function
   */
  async sync(): Promise<boolean> {
    if (this.isSyncing) {
      console.log('⏭️ Sync already in progress, skipping...');
      return false;
    }

    if (!navigator.onLine) {
      console.log('📴 Offline - skipping sync');
      this.notifyListeners('offline', await this.getPendingCount());
      return false;
    }

    this.isSyncing = true;
    this.notifyListeners('syncing', await this.getPendingCount());

    try {
      // Step 1: Process sync queue (local changes → server)
      await this.processSyncQueue();

      // Step 2: Fetch latest data from server
      await this.fetchServerData();

      this.notifyListeners('idle', 0);
      return true;
    } catch (error) {
      console.error('❌ Sync failed:', error);
      this.notifyListeners('error', await this.getPendingCount());
      return false;
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Process all pending operations in sync queue
   */
  private async processSyncQueue(): Promise<void> {
    const queue = await db.getSyncQueue();
    
    if (queue.length === 0) {
      console.log('✅ Sync queue empty');
      return;
    }

    console.log(`📤 Processing ${queue.length} pending operations...`);

    for (const operation of queue) {
      try {
        await this.processOperation(operation);
        await db.removeFromSyncQueue(operation.id);
        console.log(`✅ Synced operation: ${operation.type} ${operation.scanId}`);
      } catch (error) {
        console.error(`❌ Failed to sync operation ${operation.id}:`, error);
        
        // Increment retry count
        operation.retries++;
        
        if (operation.retries >= MAX_RETRIES) {
          console.error(`🚫 Max retries reached for operation ${operation.id}, removing from queue`);
          await db.removeFromSyncQueue(operation.id);
        } else {
          await db.updateSyncOperation(operation);
        }
      }
    }
  }

  /**
   * Process a single sync operation
   */
  private async processOperation(operation: SyncOperation): Promise<void> {
    const { type, scanId, data } = operation;

    switch (type) {
      case 'create':
        if (!data) throw new Error('No data for create operation');
        await this.apiRequest('/api/scans', 'POST', data);
        break;

      case 'update':
        if (!data) throw new Error('No data for update operation');
        await this.apiRequest(`/api/scans/${scanId}`, 'PATCH', data);
        break;

      case 'delete':
        await this.apiRequest(`/api/scans/${scanId}`, 'DELETE');
        break;
    }
  }

  /**
   * Fetch latest data from server and update local cache
   */
  private async fetchServerData(): Promise<void> {
    console.log('📥 Fetching latest data from server...');
    
    const response = await this.apiRequest('/api/scans', 'GET');
    const scans: Scan[] = response.scans || [];
    
    // Update local cache with server data
    await db.saveScans(scans);
    
    console.log(`✅ Updated local cache with ${scans.length} scans`);
  }

  /**
   * Helper for API requests with timeout
   */
  private async apiRequest(url: string, method: string, body?: any): Promise<any> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      const response = await fetch(url, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : {},
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Get count of pending operations
   */
  async getPendingCount(): Promise<number> {
    const queue = await db.getSyncQueue();
    return queue.length;
  }

  /**
   * Force immediate sync
   */
  async forceSyncNow(): Promise<boolean> {
    return this.sync();
  }
}

export const syncManager = new SyncManager();
