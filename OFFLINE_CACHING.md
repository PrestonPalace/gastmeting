# Offline-First Caching System

## Overview
The app now implements a robust **offline-first architecture** using IndexedDB for local storage and automatic background synchronization with the server. This ensures the app works perfectly even in low WiFi areas.

## Architecture

### 🗄️ Local Storage (IndexedDB)
- **Database**: `GastMetingDB`
- **Stores**:
  - `scans`: All scan data (check-ins and check-outs)
  - `syncQueue`: Pending operations that need to sync with server

### 🔄 Data Flow

```
┌─────────────────┐
│  User Action    │
│ (Check-in/out)  │
└────────┬────────┘
         │
         ▼
┌─────────────────────┐
│  Save to IndexedDB  │  ◄── Instant (works offline)
│    (Local Cache)    │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│   Add to Queue      │
│  (Sync Operation)   │
└────────┬────────────┘
         │
         ▼
    ┌────────┐
    │ Online?│
    └───┬────┘
        │
    Yes │         No
        ▼          ▼
   ┌────────┐  ┌────────┐
   │  Sync  │  │  Wait  │
   │  Now   │  │  ...   │
   └────────┘  └────┬───┘
                    │
                    ▼
              When online,
              auto-sync ✓
```

## Key Components

### 1. IndexedDB Service (`src/lib/db.ts`)
Handles all local data operations:
- ✅ `init()` - Initialize database
- ✅ `getAllScans()` - Get all scans from cache
- ✅ `getScan(id)` - Get specific scan
- ✅ `saveScan(scan)` - Save single scan
- ✅ `saveScans(scans)` - Bulk update from server
- ✅ `deleteScan(id)` - Remove scan
- ✅ `addToSyncQueue()` - Queue operation for sync
- ✅ `getSyncQueue()` - Get pending operations
- ✅ `removeFromSyncQueue()` - Remove completed operation

### 2. Sync Manager (`src/lib/syncManager.ts`)
Manages background synchronization:

#### Features
- **Auto-sync every 10 seconds** when online
- **Automatic retry** with exponential backoff (max 5 retries)
- **Online detection** - syncs immediately when connection restored
- **Status notifications** - broadcasts sync state to UI

#### Sync Process
1. **Process Queue**: Send pending local changes to server
2. **Fetch Data**: Get latest data from server
3. **Update Cache**: Replace local cache with server data (server is source of truth)

### 3. Updated Scan Service (`src/lib/scanService.ts`)
Now works offline-first:

#### `getAllScans()`
- Reads from **local cache only**
- Triggers background sync (non-blocking)
- Returns immediately (fast!)

#### `createScan()` (Check-in)
1. Create scan object with current timestamp
2. Save to local cache **immediately**
3. Add to sync queue
4. Trigger sync if online
5. Return scan (no waiting!)

#### `checkoutScan()` (Check-out)
1. Get scan from local cache
2. Add `endTime` timestamp
3. Update local cache **immediately**
4. Add to sync queue
5. Trigger sync if online
6. Return updated scan

### 4. Sync Status Bar (`src/components/SyncStatusBar.tsx`)
Visual indicator in top-right corner:

#### Status States
- 🟢 **Green** - "Gesynchroniseerd" (synced, no pending changes)
- 🟠 **Orange** - "X wijzigingen wachten" (X changes pending)
- 🔵 **Blue** - "Synchroniseren..." (syncing in progress)
- 🟡 **Yellow** - "Offline" (no internet connection)
- 🔴 **Red** - "Sync fout" (sync error occurred)

## Server Updates

### API Response Format
Changed `GET /api/scans` response:
```json
{
  "scans": [...]
}
```
Previously returned array directly. Now wrapped in object for consistency.

## User Experience

### ✅ What Works Offline
- ✅ Check-in guests
- ✅ Check-out guests
- ✅ View all scans (from cache)
- ✅ NFC scanning
- ✅ All UI interactions

### 🔄 What Happens When Offline
1. All operations save to local cache immediately
2. Changes queued for sync
3. Status bar shows "Offline" or "X wijzigingen wachten"
4. When connection restored:
   - Status bar shows "Synchroniseren..."
   - Queue is processed automatically
   - Server data updates local cache
   - Status changes to "Gesynchroniseerd"

### 🎯 Conflict Resolution
**Server is always the source of truth:**
1. Local changes sent to server first
2. Server processes and stores them
3. Client fetches fresh data from server
4. Local cache replaced with server data
5. This ensures consistency across all devices

## Testing Scenarios

### Scenario 1: Normal Operation (Online)
1. Scan NFC tag → Check-in
2. Saved locally + synced to server immediately
3. Status: "Gesynchroniseerd" 🟢

### Scenario 2: Offline Operation
1. Turn off WiFi
2. Status: "Offline" 🟡
3. Scan NFC tag → Check-in
4. Saved locally, queue shows "1 wijzigingen wachten" 🟠
5. Scan another tag → Check-in
6. Queue shows "2 wijzigingen wachten" 🟠

### Scenario 3: Coming Back Online
1. Turn on WiFi
2. Status: "Synchroniseren..." 🔵
3. Queue processed (2 operations sent to server)
4. Fresh data fetched from server
5. Status: "Gesynchroniseerd" 🟢
6. Both check-ins now visible on all devices

### Scenario 4: Failed Sync
1. Partial network failure (slow/unstable)
2. Sync fails for operation
3. Operation retried (up to 5 times)
4. If still failing, operation removed (prevents infinite loop)
5. Status: "Sync fout" 🔴

## Performance Benefits

### Before (Server-first)
- ❌ Required server connection for every action
- ❌ Slow in low WiFi areas (network latency)
- ❌ Failed completely when offline
- ❌ Poor UX with loading states

### After (Offline-first)
- ✅ **Instant response** (local cache)
- ✅ Works **completely offline**
- ✅ **Background sync** (non-blocking)
- ✅ **Excellent UX** (no waiting)
- ✅ **Reliable** in low WiFi areas

## Configuration

### Sync Settings (in `syncManager.ts`)
```typescript
const MAX_RETRIES = 5;        // Max retry attempts per operation
const RETRY_DELAY = 2000;     // 2 seconds between retries
const SYNC_INTERVAL = 10000;  // Check every 10 seconds
```

## Browser Support

### Requirements
- **IndexedDB** support (all modern browsers)
- **Service Worker** not required (we use active sync)

### Tested Browsers
- ✅ Chrome/Edge (Android, Desktop)
- ✅ Safari (iOS, macOS)
- ✅ Firefox

## Troubleshooting

### "Failed to initialize database"
- IndexedDB might be disabled in browser
- Private/Incognito mode might block IndexedDB
- Check browser console for details

### Pending operations not syncing
- Check network connection
- Verify API endpoint is accessible
- Check browser console for sync errors
- Operations auto-retry up to 5 times

### Cache not updating
- Background sync runs every 10 seconds
- Force sync by going offline then online
- Check SyncStatusBar for current status

## Future Enhancements

### Possible Improvements
- [ ] Service Worker for true background sync
- [ ] Push notifications for sync completion
- [ ] Manual sync button
- [ ] Sync conflict UI for manual resolution
- [ ] Export/import cache data
- [ ] Sync analytics dashboard
