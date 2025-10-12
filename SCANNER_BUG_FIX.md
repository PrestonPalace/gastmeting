# Bug Fix: Background NFC Scanner Interference

## 🐛 The Problem

The background NFC scanner was causing issues:

1. **Old data persisting** - When scanning during check-in flow, previous data wasn't cleared
2. **Scanner active during check-in** - NFC was active on guest type/visitor count screens
3. **Double scanning** - Scanning same tag twice caused checkout then immediate check-in

## ✅ The Fixes

### 1. **Step-Based Scan Blocking**
```typescript
// Only allow scans on 'scan' or 'success' steps
if (step !== 'scan' && step !== 'success') {
  console.log('Scan blocked - currently on step:', step);
  return;
}
```

**Result:** NFC scanner is **completely disabled** on guest-type and visitor-count screens.

---

### 2. **Processing Flag to Prevent Double Scans**
```typescript
const [isProcessing, setIsProcessing] = useState(false);

if (isProcessing) {
  console.log('Already processing a scan, ignoring...');
  return;
}
```

**Result:** Can't scan twice in rapid succession - prevents checkout → immediate check-in bug.

---

### 3. **Data Reset on New Scan from Success Screen**
```typescript
if (step === 'success') {
  // Coming from success screen - reset everything for new scan
  setGuestType(null);
  setAdults(0);
  setChildren(0);
  setError('');
}
```

**Result:** Each new scan starts with fresh, clean data.

---

### 4. **3-Second Wait Enforcement**
```typescript
// In SuccessScreen - NFC only activates after timer completes
timerRef.current = setTimeout(() => {
  setNfcReady(true);
  if (onScanReady) {
    startNFCScanning();
  }
}, 3000); // MUST wait 3 seconds
```

**Result:** Background scanner only activates **after** the 3-second countdown.

---

### 5. **Immediate Disable After Scan**
```typescript
if (nfcReady && isScanning && onScanReady) {
  setIsScanning(false);
  setNfcReady(false); // Disable immediately to prevent double scans
  onScanReady(serialNumber);
}
```

**Result:** As soon as a tag is scanned, the background scanner disables itself.

---

### 6. **Cleanup on Component Unmount**
```typescript
return () => {
  if (timerRef.current) clearTimeout(timerRef.current);
  if (ndefReaderRef.current) ndefReaderRef.current = null;
  setNfcReady(false);
  setIsScanning(false);
};
```

**Result:** When leaving success screen, all NFC scanning stops completely.

---

## 📊 Flow Chart: When NFC is Active

```
┌─────────────────────┐
│  SCAN SCREEN        │  ✅ NFC Active (manual button)
└─────────────────────┘
         ↓
    Scan Tag #1
         ↓
┌─────────────────────┐
│  GUEST TYPE         │  ❌ NFC BLOCKED
└─────────────────────┘
         ↓
┌─────────────────────┐
│  VISITOR COUNT      │  ❌ NFC BLOCKED
└─────────────────────┘
         ↓
┌─────────────────────┐
│  SUCCESS SCREEN     │  ⏳ Wait 3 seconds...
│  (0-3 seconds)      │  ❌ NFC BLOCKED
└─────────────────────┘
         ↓
┌─────────────────────┐
│  SUCCESS SCREEN     │  ✅ NFC Active (background)
│  (after 3 seconds)  │  🟢 "Klaar voor volgende scan"
└─────────────────────┘
         ↓
    Scan Tag #2
         ↓
    (Scanner disables immediately)
         ↓
┌─────────────────────┐
│  SUCCESS SCREEN     │  ⏳ Wait 3 seconds...
│  (new scan)         │  ❌ NFC BLOCKED
└─────────────────────┘
```

---

## 🎯 Test Scenarios (All Should Work Now)

### Scenario 1: Normal Check-in
```
✅ Scan tag → Guest type → Visitor count → Success
   No interference from background scanner
```

### Scenario 2: Multiple Checkouts
```
✅ Scan tag #1 → Auto checkout → Success → Wait 3s → 
   🟢 Ready → Scan tag #2 → Auto checkout → Success
```

### Scenario 3: Rapid Scanning (Should Be Prevented)
```
✅ Scan tag #1 → Processing... (isProcessing=true)
   ❌ Scan tag #2 → BLOCKED (already processing)
   ✅ First scan completes normally
```

### Scenario 4: Scanning During Check-in
```
✅ Scan tag #1 → Goes to guest type
   ❌ Try to scan tag #2 → BLOCKED (step !== 'scan' or 'success')
   ✅ Complete check-in for tag #1
```

### Scenario 5: Manual Back Button
```
✅ Success screen → Click "Terug naar scan"
   ✅ Timer cleared
   ✅ NFC scanner stopped
   ✅ Clean scan screen
```

---

## 🔒 Safety Checks Summary

| Check | Purpose | Where |
|-------|---------|-------|
| `step !== 'scan' && step !== 'success'` | Block scans during check-in flow | `handleNFCScan()` |
| `isProcessing` | Prevent double scans | `handleNFCScan()` |
| `nfcReady` | Ensure 3-second wait completed | `SuccessScreen` |
| Data reset on new scan | Clear old data | `handleNFCScan()` |
| Immediate disable after scan | Prevent rapid re-scanning | `SuccessScreen` event handler |
| Cleanup on unmount | Stop scanner when leaving | `useEffect` cleanup |

---

## 📁 Files Modified

1. **src/app/page.tsx**
   - Added `isProcessing` state
   - Added step-based scan blocking
   - Added data reset on new scan from success screen
   - Added try/catch error handling

2. **src/components/SuccessScreen.tsx**
   - Enhanced cleanup in useEffect
   - Added double-check in `startNFCScanning()`
   - Immediate disable after successful scan
   - Improved `handleManualBack()` cleanup

---

## 🚀 Deploy

```bash
git add .
git commit -m "Fix background NFC scanner interference - add guards and state checks"
git push origin master
```

**All scanning issues should be resolved!** ✨
