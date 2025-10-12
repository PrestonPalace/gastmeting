/**
 * IndexedDB wrapper for local data storage
 * Provides offline-first data persistence
 */

import type { Scan } from '@/types/scan';

const DB_NAME = 'GastMetingDB';
const DB_VERSION = 1;
const SCANS_STORE = 'scans';
const SYNC_QUEUE_STORE = 'syncQueue';

export interface SyncOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  scanId: string;
  data?: Partial<Scan>;
  timestamp: number;
  retries: number;
}

class IndexedDBService {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create scans store
        if (!db.objectStoreNames.contains(SCANS_STORE)) {
          const scansStore = db.createObjectStore(SCANS_STORE, { keyPath: 'id' });
          scansStore.createIndex('endTime', 'endTime', { unique: false });
        }

        // Create sync queue store
        if (!db.objectStoreNames.contains(SYNC_QUEUE_STORE)) {
          const queueStore = db.createObjectStore(SYNC_QUEUE_STORE, { keyPath: 'id' });
          queueStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init();
    }
    if (!this.db) {
      throw new Error('Failed to initialize database');
    }
    return this.db;
  }

  // Scans operations
  async getAllScans(): Promise<Scan[]> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(SCANS_STORE, 'readonly');
      const store = transaction.objectStore(SCANS_STORE);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getScan(id: string): Promise<Scan | null> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(SCANS_STORE, 'readonly');
      const store = transaction.objectStore(SCANS_STORE);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async saveScan(scan: Scan): Promise<void> {
    const db = await this.ensureDB();
    
    // STRICT RULE ENFORCEMENT: Before saving ANY scan, ensure no duplicate active sessions exist
    const allScans = await this.getAllScans();
    
    // If this scan has no endTime (is active), close ALL other active sessions for this tag
    if (!scan.endTime) {
      const duplicates = allScans.filter(
        s => s.tagId === scan.tagId && s.id !== scan.id && !s.endTime
      );
      
      if (duplicates.length > 0) {
        console.warn(`🚨 ENFORCING RULE: Found ${duplicates.length} active session(s) for tag ${scan.tagId}. Force-closing them before saving new active session.`);
        
        const now = new Date().toISOString();
        for (const duplicate of duplicates) {
          duplicate.endTime = now;
          await this.forceSaveScan(duplicate); // Use internal method to avoid recursion
          console.log(`🔒 Force-closed duplicate: ${duplicate.id}`);
        }
      }
    }
    
    // STRICT RULE: Never allow reopening a closed session
    const existing = allScans.find(s => s.id === scan.id);
    if (existing && existing.endTime && !scan.endTime) {
      console.error(`🚫 BLOCKED: Attempt to reopen closed session ${scan.id}. Keeping it closed.`);
      scan.endTime = existing.endTime; // Force keep it closed
    }
    
    return this.forceSaveScan(scan);
  }
  
  // Internal method - direct save without validation (to avoid recursion)
  private async forceSaveScan(scan: Scan): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(SCANS_STORE, 'readwrite');
      const store = transaction.objectStore(SCANS_STORE);
      const request = store.put(scan);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async saveScans(scans: Scan[]): Promise<void> {
    // STRICT ENFORCEMENT: Clean incoming data before saving
    console.log(`🔍 Validating ${scans.length} scans before batch save...`);
    
    const cleanedScans = this.enforceActiveSessionRule(scans);
    
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(SCANS_STORE, 'readwrite');
      const store = transaction.objectStore(SCANS_STORE);

      // Clear and replace with CLEANED data
      const clearRequest = store.clear();
      
      clearRequest.onsuccess = () => {
        if (cleanedScans.length === 0) {
          resolve();
          return;
        }

        let pending = cleanedScans.length;
        cleanedScans.forEach(scan => {
          const request = store.put(scan);
          request.onsuccess = () => {
            pending--;
            if (pending === 0) resolve();
          };
          request.onerror = () => reject(request.error);
        });
      };
      
      clearRequest.onerror = () => reject(clearRequest.error);
    });
  }
  
  // Enforce rule: Only ONE active session per tagId
  private enforceActiveSessionRule(scans: Scan[]): Scan[] {
    const activeByTag = new Map<string, Scan[]>();
    const closedScans: Scan[] = [];
    let cleanupsPerformed = 0;
    
    // Separate active and closed scans
    for (const scan of scans) {
      if (scan.endTime) {
        closedScans.push(scan);
      } else {
        const existing = activeByTag.get(scan.tagId) || [];
        existing.push(scan);
        activeByTag.set(scan.tagId, existing);
      }
    }
    
    // For each tag, keep only the MOST RECENT active session
    const validActiveScans: Scan[] = [];
    const now = new Date().toISOString();
    
    for (const [tagId, activeSessions] of activeByTag.entries()) {
      if (activeSessions.length === 1) {
        validActiveScans.push(activeSessions[0]);
      } else {
        // Multiple active - ENFORCE RULE
        const sorted = activeSessions.sort((a, b) => 
          new Date(b.entryTime).getTime() - new Date(a.entryTime).getTime()
        );
        
        const [mostRecent, ...duplicates] = sorted;
        validActiveScans.push(mostRecent);
        
        console.warn(`🚨 RULE ENFORCEMENT: Tag ${tagId} has ${activeSessions.length} active sessions. Keeping newest, closing ${duplicates.length} old ones.`);
        
        for (const duplicate of duplicates) {
          closedScans.push({ ...duplicate, endTime: now });
          cleanupsPerformed++;
          console.log(`🔒 Auto-closed old session: ${duplicate.id}`);
        }
      }
    }
    
    if (cleanupsPerformed > 0) {
      console.warn(`✅ Batch validation: Closed ${cleanupsPerformed} duplicate active sessions`);
    }
    
    return [...closedScans, ...validActiveScans];
  }

  async deleteScan(id: string): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(SCANS_STORE, 'readwrite');
      const store = transaction.objectStore(SCANS_STORE);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Sync queue operations
  async addToSyncQueue(operation: SyncOperation): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(SYNC_QUEUE_STORE, 'readwrite');
      const store = transaction.objectStore(SYNC_QUEUE_STORE);
      const request = store.put(operation);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getSyncQueue(): Promise<SyncOperation[]> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(SYNC_QUEUE_STORE, 'readonly');
      const store = transaction.objectStore(SYNC_QUEUE_STORE);
      const index = store.index('timestamp');
      const request = index.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async removeFromSyncQueue(id: string): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(SYNC_QUEUE_STORE, 'readwrite');
      const store = transaction.objectStore(SYNC_QUEUE_STORE);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async updateSyncOperation(operation: SyncOperation): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(SYNC_QUEUE_STORE, 'readwrite');
      const store = transaction.objectStore(SYNC_QUEUE_STORE);
      const request = store.put(operation);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clearSyncQueue(): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(SYNC_QUEUE_STORE, 'readwrite');
      const store = transaction.objectStore(SYNC_QUEUE_STORE);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export const db = new IndexedDBService();
