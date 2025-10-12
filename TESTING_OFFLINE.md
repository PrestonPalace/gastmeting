# Testing the Offline Caching System

## Quick Test Guide

### 1. Test Online Operation (Baseline)
**Expected**: Everything should work as before, but faster

1. Open the app in browser
2. Check top-right corner - should show 🟢 "Gesynchroniseerd"
3. Scan NFC tag (or enter test ID)
4. Check-in completes instantly
5. Status briefly shows 🔵 "Synchroniseren..."
6. Status returns to 🟢 "Gesynchroniseerd"

✅ **Pass**: If check-in works and status updates

---

### 2. Test Offline Operation
**Expected**: App works without internet, queues changes

1. Open browser DevTools (F12)
2. Go to Network tab
3. Check "Offline" checkbox (simulates no connection)
4. Status bar should show 🟡 "Offline"
5. Scan NFC tag → Check-in
6. Operation completes instantly
7. Status shows 🟠 "1 wijzigingen wachten"
8. Scan another tag → Check-in again
9. Status shows 🟠 "2 wijzigingen wachten"

✅ **Pass**: If both check-ins work and counter increments

---

### 3. Test Auto-Sync on Reconnect
**Expected**: Queued operations sync automatically

1. With 2 pending changes from Test 2
2. Uncheck "Offline" in DevTools Network tab
3. Status should change to 🔵 "Synchroniseren..."
4. Wait 2-3 seconds
5. Status changes to 🟢 "Gesynchroniseerd"
6. Refresh page
7. Both check-ins should still be there

✅ **Pass**: If all operations synced and persisted

---

### 4. Test Background Sync Timer
**Expected**: Auto-sync runs every 10 seconds

1. Make sure you're online (🟢 status)
2. Open browser console
3. Watch for log messages: `"🔄 Starting auto-sync..."`
4. You should see sync checks every ~10 seconds
5. Check logs: `"✅ Sync queue empty"` or `"📤 Processing X pending operations..."`

✅ **Pass**: If logs appear regularly

---

### 5. Test Checkout Offline
**Expected**: Checkout works offline too

1. Go offline (DevTools → Network → Offline)
2. Scan an active tag (one that's checked in)
3. Checkout completes instantly
4. Status shows pending changes
5. Go back online
6. Checkout should sync to server

✅ **Pass**: If checkout works offline and syncs

---

### 6. Test Multiple Devices
**Expected**: Changes sync across devices

1. Open app on Device A (e.g., tablet)
2. Open app on Device B (e.g., phone/laptop)
3. On Device A: Check-in a guest
4. Wait 10 seconds for sync
5. On Device B: Refresh or wait for sync
6. Guest should appear on Device B

✅ **Pass**: If data appears on both devices

---

### 7. Test Data Persistence
**Expected**: Local cache survives page refresh

1. Make sure you're offline
2. Check-in 2-3 guests
3. Note the pending count
4. Refresh the page (F5)
5. Status should still show pending changes
6. Go to debug mode - scans should be there

✅ **Pass**: If data persists after refresh

---

### 8. Test IndexedDB Storage
**Expected**: Data is in IndexedDB

1. Open DevTools (F12)
2. Go to "Application" tab (Chrome) or "Storage" tab (Firefox)
3. Expand "IndexedDB"
4. Find "GastMetingDB"
5. Check "scans" object store - should have scan data
6. Check "syncQueue" object store - should show pending operations

✅ **Pass**: If database exists and contains data

---

## Common Test Scenarios

### Scenario: Low WiFi Area
**Simulation**: Throttle network to Slow 3G

1. DevTools → Network tab
2. Change "No throttling" to "Slow 3G"
3. Try check-in
4. Should complete instantly (from cache)
5. Sync happens in background

✅ **Pass**: If UI remains responsive

---

### Scenario: Intermittent Connection
**Simulation**: Toggle offline/online repeatedly

1. Check-in guest (online)
2. Go offline immediately
3. Check-in another guest
4. Go online for 2 seconds
5. Go offline again
6. Check-in another guest
7. Go online and wait
8. All 3 should eventually sync

✅ **Pass**: If all operations eventually sync

---

### Scenario: API Server Down
**Simulation**: API returns 500 errors

1. This is harder to simulate
2. Stop the server if running locally
3. Try operations
4. Should queue and retry
5. After 5 retries, operation removed

✅ **Pass**: If app doesn't crash

---

## Browser Console Logs

### Good Signs (Everything Working)
```
🚀 Initializing ScanService with offline support...
✅ ScanService initialized
📖 Retrieved 5 scans from local cache
🔄 Starting auto-sync...
✅ Sync queue empty
💾 Saved scan to local cache: ABC123
📤 Queued create operation for sync
📥 Fetching latest data from server...
✅ Updated local cache with 6 scans
✅ Synced operation: create ABC123
```

### Warning Signs (Needs Attention)
```
❌ Sync failed: NetworkError
⏭️ Sync already in progress, skipping...
📴 Offline - skipping sync
🚫 Max retries reached for operation xyz, removing from queue
```

---

## Troubleshooting

### Issue: "Cannot find module '@/lib/db'"
**Solution**: Make sure file exists at `src/lib/db.ts`

### Issue: "Failed to initialize database"
**Solution**: Check browser supports IndexedDB, not in private mode

### Issue: Status stuck on "Synchroniseren..."
**Solution**: Check browser console for errors, verify API is running

### Issue: Pending count increases but never syncs
**Solution**: Check network connection, verify server is accessible

---

## Performance Metrics to Check

### Response Times
- **Check-in (offline)**: < 100ms ✅
- **Check-in (online)**: < 200ms ✅
- **Checkout (offline)**: < 100ms ✅
- **Get all scans**: < 50ms ✅

### Sync Times
- **Empty queue**: < 500ms
- **1-5 operations**: < 2s
- **10+ operations**: < 5s

---

## Advanced Testing

### Test with Chrome DevTools Protocol
```javascript
// In browser console
// Check IndexedDB contents
const request = indexedDB.open('GastMetingDB');
request.onsuccess = (e) => {
  const db = e.target.result;
  console.log('Database:', db);
  console.log('Object stores:', db.objectStoreNames);
};

// Monitor network
window.addEventListener('online', () => console.log('🌐 Online'));
window.addEventListener('offline', () => console.log('📴 Offline'));
```

---

## Checklist for Production

Before deploying, verify:
- [ ] All 8 basic tests pass
- [ ] Status bar updates correctly
- [ ] Data persists across refreshes
- [ ] Multiple devices sync properly
- [ ] App works in airplane mode
- [ ] Console has no errors
- [ ] IndexedDB properly initialized
- [ ] Sync queue processes correctly
