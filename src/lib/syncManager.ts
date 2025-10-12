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
          console.log(`🔄 Will retry operation ${operation.id} (attempt ${operation.retries}/${MAX_RETRIES})`);
          await db.updateSyncOperation(operation);
        }
      }
    }
    
    // Double-check queue is empty after processing
    const remainingQueue = await db.getSyncQueue();
    if (remainingQueue.length > 0) {
      console.log(`⚠️ ${remainingQueue.length} operations still in queue (failed or retrying)`);
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
   * Only updates if queue is empty to avoid overwriting pending changes
   * Applies cleanup logic to ensure only ONE active session per tag
   */
  private async fetchServerData(): Promise<void> {
    console.log('📥 Fetching latest data from server...');
    
    // Check if there are still pending operations
    const pendingQueue = await db.getSyncQueue();
    if (pendingQueue.length > 0) {
      console.log(`⚠️ Skipping server fetch - ${pendingQueue.length} operations still pending`);
      return;
    }
    
    const response = await this.apiRequest('/api/scans', 'GET');
    const serverScans: Scan[] = response.scans || [];
    
    console.log(`📥 Received ${serverScans.length} scans from server`);
    
    // CLEANUP: Ensure only ONE active session per tag
    const cleanedScans = this.cleanupDuplicateActiveSessions(serverScans);
    
    if (cleanedScans.cleanupsNeeded.length > 0) {
      console.warn(`🧹 Server data cleanup: Found ${cleanedScans.cleanupsNeeded.length} duplicate active sessions`);
      
      // Send cleanup operations back to server
      for (const scan of cleanedScans.cleanupsNeeded) {
        try {
          await this.apiRequest(`/api/scans/${scan.id}`, 'PATCH', { endTime: scan.endTime });
          console.log(`✅ Closed duplicate session on server: ${scan.id}`);
        } catch (error) {
          console.error(`❌ Failed to close duplicate on server: ${scan.id}`, error);
        }
      }
    }
    
    // Update local cache with cleaned data
    await db.saveScans(cleanedScans.scans);
    
    console.log(`✅ Updated local cache with ${cleanedScans.scans.length} scans (${cleanedScans.cleanupsNeeded.length} duplicates cleaned)`);
  }

  /**
   * Clean up duplicate active sessions - keep only the most recent per tag
   */
  private cleanupDuplicateActiveSessions(scans: Scan[]): { scans: Scan[], cleanupsNeeded: Scan[] } {
    const activeByTag = new Map<string, Scan[]>();
    const closedScans: Scan[] = [];
    const cleanupsNeeded: Scan[] = [];
    
    // Group active sessions by tagId
    for (const scan of scans) {
      if (scan.endTime) {
        closedScans.push(scan);
      } else {
        const existing = activeByTag.get(scan.tagId) || [];
        existing.push(scan);
        activeByTag.set(scan.tagId, existing);
      }
    }
    
    // For each tag with multiple active sessions, keep only the most recent
    const cleanedActiveScans: Scan[] = [];
    for (const [tagId, activeSessions] of activeByTag.entries()) {
      if (activeSessions.length === 1) {
        cleanedActiveScans.push(activeSessions[0]);
      } else {
        // Sort by entryTime descending (most recent first)
        const sorted = activeSessions.sort((a, b) => 
          new Date(b.entryTime).getTime() - new Date(a.entryTime).getTime()
        );
        
        // Keep the most recent
        const [mostRecent, ...duplicates] = sorted;
        cleanedActiveScans.push(mostRecent);
        
        console.warn(`⚠️ Tag ${tagId}: Keeping session ${mostRecent.id}, closing ${duplicates.length} duplicate(s)`);
        
        // Mark duplicates for closure
        const now = new Date().toISOString();
        for (const duplicate of duplicates) {
          const closedDuplicate: Scan = { ...duplicate, endTime: now };
          closedScans.push(closedDuplicate);
          cleanupsNeeded.push(closedDuplicate);
        }
      }
    }
    
    return {
      scans: [...closedScans, ...cleanedActiveScans],
      cleanupsNeeded
    };
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
