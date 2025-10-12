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
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(SCANS_STORE, 'readwrite');
      const store = transaction.objectStore(SCANS_STORE);
      const request = store.put(scan);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async saveScans(scans: Scan[]): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(SCANS_STORE, 'readwrite');
      const store = transaction.objectStore(SCANS_STORE);

      // Clear and replace - data is already cleaned by syncManager
      const clearRequest = store.clear();
      
      clearRequest.onsuccess = () => {
        if (scans.length === 0) {
          resolve();
          return;
        }

        let pending = scans.length;
        scans.forEach(scan => {
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
