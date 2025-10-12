# 3-Second Interaction Lock Feature

## Overview
Added a hard 3-second interaction lock that prevents ANY actions (NFC scans or button presses) immediately after checking out a guest. This prevents accidental immediate check-ins when checking out multiple people.

## Changes Made

### 1. New State Variable
- `interactionLocked`: Boolean state that blocks all interactions for 3 seconds after checkout

### 2. page.tsx Updates

#### State Addition
```typescript
const [interactionLocked, setInteractionLocked] = useState(false);
```

#### Lock Activation (on Checkout)
When a guest is checked out, the interaction lock is enabled for 3 seconds:
```typescript
setInteractionLocked(true);
setTimeout(() => {
  console.log('Interaction lock released');
  setInteractionLocked(false);
}, 3000);
```

#### NFC Scan Blocking
Added check at the start of `handleNFCScan`:
```typescript
if (interactionLocked) {
  console.log('Scan blocked - interaction locked (3-second delay)');
  return;
}
```

#### Reset Flow Update
Lock is cleared when returning to scan screen:
```typescript
setInteractionLocked(false);
```

### 3. SuccessScreen.tsx Updates

#### Props Interface
Added `interactionLocked` to props:
```typescript
interface SuccessScreenProps {
  interactionLocked?: boolean;
}
```

#### NFC Scanner Guard
Background NFC scanning is blocked during lock period:
```typescript
if (!nfcReady || interactionLocked) {
  console.log('NFC scanning prevented - not ready or locked');
  return;
}
```

#### UI Updates
1. **Back Button**: Disabled during lock with visual feedback
   - Shows "⏳ Even wachten... (3s)" instead of "Terug naar scan"
   - Grayed out and cursor disabled
   
2. **Status Messages**:
   - During lock: "⏳ Wacht 3 seconden..."
   - After lock + before NFC ready: "Scanner wordt actief in 3 seconden..."
   - When ready: Green box with "🔍 Scanner is actief"

3. **Helper Text**: Shows "Je kunt over een paar seconden verder..." during lock

### 4. Visual Distinction (Check-in vs Check-out)

#### Check-out (Red Theme)
- Red circular background (bg-red-600)
- Red text color (text-red-400)
- 🚪 Door emoji
- Message: "De gast heeft het zwembad verlaten"

#### Check-in (Green Theme)
- Green circular background (bg-green-600)
- Green text color (text-green-400)
- ✅ Checkmark emoji
- Message: "De gast is succesvol ingecheckt"

### 5. Visitor Count Reset
When starting a new check-in flow, visitor counts are always reset to 0:
```typescript
setAdults(0);
setChildren(0);
```

## User Flow

### Checkout Scenario
1. Guest scans wristband → System detects active scan
2. **Interaction lock activates for 3 seconds**
3. Success screen shows with DISABLED back button
4. NFC scanner is BLOCKED during 3 seconds
5. After 3 seconds:
   - Back button becomes active
   - 3-second NFC timer begins
   - After additional 3 seconds, NFC scanner activates

**Total wait time before next scan: 6 seconds**
- 3 seconds interaction lock
- 3 seconds NFC activation delay

### Check-in Scenario
1. Guest scans new wristband
2. **No interaction lock** (only for checkouts)
3. Flow continues normally to guest type selection
4. Visitor counts start at 0 (always fresh)

## Benefits
1. **Prevents accidental check-ins** after checkout operations
2. **Clear visual feedback** - users know they must wait
3. **Mandatory pause** - can't be bypassed by scanning or clicking
4. **Better UX** - distinct colors and icons for check-in vs checkout
5. **Fresh data** - visitor counts always reset for new check-ins

## Testing Checklist
- [ ] Check out guest → verify 3-second lock prevents button clicks
- [ ] Check out guest → verify NFC scanning blocked during lock
- [ ] Wait 3 seconds → verify back button becomes active
- [ ] Wait 6 seconds total → verify NFC scanner activates
- [ ] Check in guest → verify no lock (normal flow)
- [ ] Check in guest → verify visitor counts start at 0
- [ ] Verify red theme for checkout
- [ ] Verify green theme for check-in
