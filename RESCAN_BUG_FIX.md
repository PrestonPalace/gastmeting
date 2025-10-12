# Re-scan After Checkout Bug Fix

## Problem
When checking someone out and then immediately rescanning their band while connected to WiFi, the system would check them out AGAIN instead of starting a new check-in flow.

## Root Cause
The issue was a **race condition** in the sync process:

### Before Fix
```
1. User checks out person A
2. Local cache updated: scan.endTime = now
3. Sync triggered in background
4. User rescans person A's band
5. Background sync fetches server data
   ↓
   Server still has old data (checkout not processed yet)
   ↓
   Server returns scan WITHOUT endTime
   ↓
   Local cache OVERWRITTEN with old server data
   ↓
6. checkActiveScan() finds scan without endTime
7. System thinks person is still active → checkout AGAIN ❌
```

## Solution
Implemented **queue-aware sync** with two safeguards:

### Fix 1: Skip Server Fetch If Queue Not Empty
**File**: `src/lib/syncManager.ts`

```typescript
private async fetchServerData(): Promise<void> {
  // Check if there are still pending operations
  const pendingQueue = await db.getSyncQueue();
  if (pendingQueue.length > 0) {
    console.log(`⚠️ Skipping server fetch - ${pendingQueue.length} operations still pending`);
    return; // DON'T overwrite local cache if we have pending changes
  }
  
  // Only fetch if queue is fully processed
  const response = await this.apiRequest('/api/scans', 'GET');
  const scans: Scan[] = response.scans || [];
  await db.saveScans(scans);
}
```

### Fix 2: Enhanced Logging
Added detailed logging to track scan state:

```typescript
static async checkActiveScan(id: string) {
  const scan = await this.getScanById(id);
  console.log(`🔍 Checking scan ${id}:`, scan ? `Found with endTime=${scan.endTime}` : 'Not found');
  
  if (scan && !scan.endTime) {
    console.log(`✅ Scan ${id} is ACTIVE`);
    return { isActive: true, scan };
  }
  
  console.log(`❌ Scan ${id} is NOT active`);
  return { isActive: false };
}
```

## How It Works Now

### Correct Flow After Fix
```
1. User checks out person A
2. Local cache updated: scan.endTime = now
3. Checkout queued for sync
4. Background sync starts
   ↓
   Step 1: Process queue → Send checkout to server ✓
   ↓
   Step 2: Check queue → Still has items? → Skip server fetch ✓
   ↓
5. User rescans person A's band
6. checkActiveScan() reads local cache
   ↓
   Finds scan WITH endTime
   ↓
7. Returns isActive: false
8. System starts NEW check-in flow ✓
```

## Timeline Protection

The system has multiple layers of protection:

### Layer 1: Interaction Lock (3 seconds)
```typescript
// After checkout
setInteractionLocked(true);
setTimeout(() => {
  setInteractionLocked(false);
}, 3000);
```
Prevents ANY interaction for 3 seconds after checkout.

### Layer 2: NFC Delay (3 seconds)
```typescript
// On success screen
setTimeout(() => {
  setNfcReady(true);
  startNFCScanning();
}, 3000);
```
NFC scanner only activates 3 seconds after reaching success screen.

### Layer 3: Queue-Aware Sync (NEW)
```typescript
// In syncManager
if (pendingQueue.length > 0) {
  return; // Don't overwrite local cache
}
```
Server data only updates cache when queue is empty.

### Total Protection
- **6 seconds minimum** between checkout and next scan
- **Queue must be empty** before server can overwrite cache
- **Local cache is source of truth** for pending operations

## Testing

### Test Scenario 1: Quick Re-scan (Within 6 seconds)
```
1. Check out person A
2. Try to rescan immediately
   → Blocked by interaction lock ✓
3. Wait 3 seconds
4. Try to rescan
   → Blocked by NFC delay ✓
5. Wait another 3 seconds (6 total)
6. Rescan person A
   → Starts new check-in flow ✓
```

### Test Scenario 2: Re-scan After 6 Seconds
```
1. Check out person A
2. Wait 6+ seconds
3. Rescan person A
4. checkActiveScan() reads local cache
   → Finds endTime
   → Returns isActive: false
   → Starts new check-in flow ✓
```

### Test Scenario 3: Slow Network
```
1. Check out person A
2. Network slow, sync takes 5 seconds
3. During sync, try to rescan
   → Blocked by locks (first 6 seconds)
4. After 7 seconds, rescan
   → Sync still processing queue
   → Server fetch skipped (queue not empty)
   → Local cache preserved with endTime
   → Starts new check-in flow ✓
```

## Verification

### Console Logs to Watch For

**Correct behavior:**
```
💾 Updated scan in local cache: ABC123
📤 Queued checkout operation for sync
📤 Processing 1 pending operations...
✅ Synced operation: update ABC123
✅ Sync queue empty
📥 Fetching latest data from server...
✅ Updated local cache with X scans
🔍 Checking scan ABC123: Found with endTime=2025-10-12T...
❌ Scan ABC123 is NOT active (has endTime)
```

**Wrong behavior (old bug):**
```
💾 Updated scan in local cache: ABC123
📥 Fetching latest data from server... ← TOO EARLY!
✅ Updated local cache with X scans ← OVERWRITES!
🔍 Checking scan ABC123: Found with endTime=null ← OLD DATA!
✅ Scan ABC123 is ACTIVE ← BUG!
```

## Edge Cases Handled

### Case 1: Multiple Pending Operations
- Sync processes ALL operations in queue
- Only fetches from server when queue completely empty
- Local changes always preserved until confirmed synced

### Case 2: Sync Failure
- Failed operations stay in queue
- Server fetch skipped while retrying
- Local cache remains authoritative

### Case 3: Offline Then Online
- Offline: All operations queued
- Online: Process entire queue first
- Only then fetch server data

## Performance Impact

### Before
- ❌ Race condition possible
- ❌ Could overwrite local changes
- ❌ Re-scan could fail

### After
- ✅ No race condition
- ✅ Local changes protected
- ✅ Re-scan works correctly
- ✅ Negligible performance impact (just queue check)

## Summary

The bug is fixed with a simple but effective approach:
1. **Never overwrite local cache if queue has pending items**
2. **Always process queue before fetching server data**
3. **Add logging to track scan state**
4. **Rely on existing 6-second delay as additional protection**

This ensures that after checkout, the local cache always has the correct `endTime`, and rescanning properly starts a new check-in flow instead of attempting another checkout.
