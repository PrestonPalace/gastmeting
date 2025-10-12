'use client';

import { useState, useEffect } from 'react';
import { Wifi, WifiOff, Cloud, CloudOff, RefreshCw, AlertCircle } from 'lucide-react';
import { ScanService } from '@/lib/scanService';
import type { SyncStatus } from '@/lib/syncManager';

export default function SyncStatusBar() {
  const [isOnline, setIsOnline] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    // Check initial online status
    setIsOnline(navigator.onLine);

    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Subscribe to sync status updates
    const syncManager = ScanService.getSyncManager();
    const unsubscribe = syncManager.onStatusChange((status, pending) => {
      setSyncStatus(status);
      setPendingCount(pending);
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribe();
    };
  }, []);

  const getStatusIcon = () => {
    if (!isOnline) {
      return <WifiOff className="w-4 h-4" />;
    }

    switch (syncStatus) {
      case 'syncing':
        return <RefreshCw className="w-4 h-4 animate-spin" />;
      case 'error':
        return <AlertCircle className="w-4 h-4" />;
      case 'offline':
        return <CloudOff className="w-4 h-4" />;
      default:
        return isOnline ? <Cloud className="w-4 h-4" /> : <CloudOff className="w-4 h-4" />;
    }
  };

  const getStatusText = () => {
    if (!isOnline) {
      return 'Offline';
    }

    switch (syncStatus) {
      case 'syncing':
        return 'Synchroniseren...';
      case 'error':
        return 'Sync fout';
      case 'offline':
        return 'Offline';
      default:
        return pendingCount > 0 ? `${pendingCount} wijzigingen wachten` : 'Gesynchroniseerd';
    }
  };

  const getStatusColor = () => {
    if (!isOnline) {
      return 'bg-yellow-600/90';
    }

    switch (syncStatus) {
      case 'syncing':
        return 'bg-blue-600/90';
      case 'error':
        return 'bg-red-600/90';
      case 'offline':
        return 'bg-yellow-600/90';
      default:
        return pendingCount > 0 ? 'bg-orange-600/90' : 'bg-green-600/90';
    }
  };

  return (
    <div 
      className={`fixed top-4 right-4 ${getStatusColor()} text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 text-sm font-medium z-50 transition-all duration-300`}
    >
      {getStatusIcon()}
      <span>{getStatusText()}</span>
      
      {!isOnline && (
        <Wifi className="w-4 h-4 opacity-50" />
      )}
    </div>
  );
}
