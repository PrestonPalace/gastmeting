import type { Scan, ScanRequest, CheckoutRequest } from '@/types/scan';
import { db, type SyncOperation } from './db';
import { syncManager } from './syncManager';

/**
 * Offline-first API Service for managing scan data
 * Uses IndexedDB for local storage and syncs with server when online
 */
export class ScanService {
  private static readonly API_BASE = '/api/scans';
  private static isInitialized = false;

  /**
   * Initialize the service (must be called on app start)
   */
  static async init(): Promise<void> {
    if (this.isInitialized) return;
    
    console.log('🚀 Initializing ScanService with offline support...');
    
    try {
      // Initialize IndexedDB
      await db.init();
      
      // Start background sync
      syncManager.startAutoSync();
      
      // Try initial sync if online
      if (navigator.onLine) {
        await syncManager.sync();
      }
      
      this.isInitialized = true;
      console.log('✅ ScanService initialized');
    } catch (error) {
      console.error('❌ Failed to initialize ScanService:', error);
      // Continue anyway - we can work offline
      this.isInitialized = true;
    }
  }

  /**
   * Get all scans (from local cache)
   */
  static async getAllScans(): Promise<Scan[]> {
    await this.ensureInitialized();
    
    try {
      // Always read from local cache
      const scans = await db.getAllScans();
      console.log(`📖 Retrieved ${scans.length} scans from local cache`);
      
      // Trigger background sync (non-blocking)
      syncManager.sync().catch(err => console.error('Background sync failed:', err));
      
      return scans;
    } catch (error) {
      console.error('Failed to get scans from cache:', error);
      return [];
    }
  }

  private static async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.init();
    }
  }

  /**
   * Get the most recent active scan for a tag ID
   */
  static async getActiveScanByTagId(tagId: string): Promise<Scan | null> {
    await this.ensureInitialized();
    
    try {
      const allScans = await db.getAllScans();
      // Find the most recent scan for this tag that has no endTime
      const activeScans = allScans
        .filter(scan => scan.tagId === tagId && !scan.endTime)
        .sort((a, b) => new Date(b.entryTime).getTime() - new Date(a.entryTime).getTime());
      
      return activeScans[0] || null;
    } catch (error) {
      console.error('Failed to get scan from cache:', error);
      return null;
    }
  }

  /**
   * Check if a tag has an active scan session (no endTime)
   * Includes cleanup of duplicate active sessions
   */
  static async checkActiveScan(tagId: string): Promise<{ isActive: boolean; scan?: Scan }> {
    await this.ensureInitialized();
    
    try {
      // Get ALL active sessions for this tag
      const allScans = await db.getAllScans();
      const activeScans = allScans
        .filter(scan => scan.tagId === tagId && !scan.endTime)
        .sort((a, b) => new Date(b.entryTime).getTime() - new Date(a.entryTime).getTime());
      
      // If multiple active sessions exist, close all except the most recent
      if (activeScans.length > 1) {
        console.warn(`⚠️ Found ${activeScans.length} active sessions for tag ${tagId}. Cleaning up duplicates...`);
        
        // Keep the most recent, close the rest
        const [mostRecent, ...duplicates] = activeScans;
        
        for (const duplicate of duplicates) {
          console.log(`🧹 Auto-closing duplicate session: ${duplicate.id}`);
          const closedScan: Scan = {
            ...duplicate,
            endTime: new Date().toISOString(),
          };
          await db.saveScan(closedScan);
          
          // Queue for sync
          const operation: SyncOperation = {
            id: `cleanup-${duplicate.id}-${Date.now()}`,
            type: 'update',
            scanId: duplicate.id,
            data: { endTime: closedScan.endTime },
            timestamp: Date.now(),
            retries: 0,
          };
          await db.addToSyncQueue(operation);
        }
        
        console.log(`✅ Kept most recent session: ${mostRecent.id}`);
        return { isActive: true, scan: mostRecent };
      }
      
      const scan = activeScans[0] || null;
      console.log(`🔍 Checking tag ${tagId}:`, scan ? `Found active session ${scan.id}` : 'No active session');
      
      if (scan) {
        console.log(`✅ Tag ${tagId} has ACTIVE session (no endTime)`);
        return { isActive: true, scan };
      }
      
      console.log(`❌ Tag ${tagId} has NO active session - will create new`);
      return { isActive: false };
    } catch (error) {
      console.error('Error checking active scan:', error);
      return { isActive: false };
    }
  }

  /**
   * Create a new scan session (check-in) - Works offline
   * Automatically closes any existing active sessions for this tag
   */
  static async createScan(data: ScanRequest): Promise<Scan> {
    await this.ensureInitialized();
    
    // PRE-CHECK: Close any existing active sessions for this tag
    console.log(`🔍 Pre-check: Looking for active sessions for tag ${data.id}...`);
    const allScans = await db.getAllScans();
    const existingActiveSessions = allScans.filter(
      scan => scan.tagId === data.id && !scan.endTime
    );
    
    if (existingActiveSessions.length > 0) {
      console.warn(`⚠️ Found ${existingActiveSessions.length} active session(s) for tag ${data.id}. Auto-closing before creating new session...`);
      
      for (const existingSession of existingActiveSessions) {
        console.log(`🧹 Auto-closing existing session: ${existingSession.id}`);
        const closedScan: Scan = {
          ...existingSession,
          endTime: new Date().toISOString(),
        };
        await db.saveScan(closedScan);
        
        // Queue for sync
        const operation: SyncOperation = {
          id: `auto-close-${existingSession.id}-${Date.now()}`,
          type: 'update',
          scanId: existingSession.id,
          data: { endTime: closedScan.endTime },
          timestamp: Date.now(),
          retries: 0,
        };
        await db.addToSyncQueue(operation);
      }
    }
    
    // Generate unique session ID: tagId-timestamp
    const sessionId = `${data.id}-${Date.now()}`;
    
    const newScan: Scan = {
      id: sessionId,        // Unique session ID
      tagId: data.id,       // NFC tag ID
      type: data.type,
      adults: data.adults,
      children: data.children,
      entryTime: new Date().toISOString(),
      endTime: null,
    };
    
    console.log(`📝 Creating new session: ${sessionId} for tag ${data.id}`);

    try {
      // Save to local cache immediately
      await db.saveScan(newScan);
      console.log('💾 Saved scan to local cache:', newScan.id);

      // Queue for sync
      const operation: SyncOperation = {
        id: `create-${newScan.id}-${Date.now()}`,
        type: 'create',
        scanId: newScan.id,
        data: newScan,
        timestamp: Date.now(),
        retries: 0,
      };
      
      await db.addToSyncQueue(operation);
      console.log('📤 Queued create operation for sync');

      // Try to sync immediately if online (non-blocking)
      if (navigator.onLine) {
        syncManager.sync().catch(err => console.error('Immediate sync failed:', err));
      }

      return newScan;
    } catch (error) {
      console.error('Failed to create scan:', error);
      throw new Error('Failed to save scan locally');
    }
  }

  /**
   * Update scan session with exit time (check-out) - Works offline
   * Always checks out the most recent active session only
   */
  static async checkoutScan(tagId: string): Promise<Scan> {
    await this.ensureInitialized();
    
    try {
      // PRE-CHECK: Get ALL active sessions for this tag and handle duplicates
      const allScans = await db.getAllScans();
      const activeScans = allScans
        .filter(scan => scan.tagId === tagId && !scan.endTime)
        .sort((a, b) => new Date(b.entryTime).getTime() - new Date(a.entryTime).getTime());
      
      if (activeScans.length === 0) {
        throw new Error('No active session found for this tag');
      }
      
      // Get the most recent active session
      const [mostRecentSession, ...olderSessions] = activeScans;
      
      // If there are duplicates, close them too (defensive cleanup)
      if (olderSessions.length > 0) {
        console.warn(`⚠️ Found ${olderSessions.length} older active session(s) for tag ${tagId}. Auto-closing them...`);
        
        for (const olderSession of olderSessions) {
          console.log(`🧹 Auto-closing older session: ${olderSession.id}`);
          const closedOlder: Scan = {
            ...olderSession,
            endTime: new Date().toISOString(),
          };
          await db.saveScan(closedOlder);
          
          // Queue for sync
          const operation: SyncOperation = {
            id: `cleanup-old-${olderSession.id}-${Date.now()}`,
            type: 'update',
            scanId: olderSession.id,
            data: { endTime: closedOlder.endTime },
            timestamp: Date.now(),
            retries: 0,
          };
          await db.addToSyncQueue(operation);
        }
      }
      
      console.log(`🚪 Checking out most recent session: ${mostRecentSession.id} for tag ${tagId}`);

      // Update the most recent session with end time
      const updatedScan: Scan = {
        ...mostRecentSession,
        endTime: new Date().toISOString(),
      };

      // Save to local cache immediately
      await db.saveScan(updatedScan);
      console.log('💾 Updated scan in local cache:', updatedScan.id);

      // Queue for sync
      const operation: SyncOperation = {
        id: `update-${updatedScan.id}-${Date.now()}`,
        type: 'update',
        scanId: updatedScan.id,
        data: { endTime: updatedScan.endTime },
        timestamp: Date.now(),
        retries: 0,
      };

      await db.addToSyncQueue(operation);
      console.log('📤 Queued checkout operation for sync');

      // Try to sync immediately if online (non-blocking)
      if (navigator.onLine) {
        syncManager.sync().catch(err => console.error('Immediate sync failed:', err));
      }

      return updatedScan;
    } catch (error) {
      console.error('Failed to checkout scan:', error);
      throw new Error('Failed to checkout scan locally');
    }
  }

  /**
   * Get sync status
   */
  static getSyncManager() {
    return syncManager;
  }
}
