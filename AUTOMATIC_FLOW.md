# Automatic Check-in/Check-out Flow

## 🔄 New Behavior (October 12, 2025)

### ✅ Automatic Checkout
**When scanning an already checked-in tag:**
1. Scan NFC tag
2. App detects: "This tag is already active"
3. **AUTOMATICALLY checks out the guest** ✨
4. Shows success screen with:
   - Guest information
   - Check-in time
   - Total duration
   - Number of people
5. Auto-returns to scan page after 5 seconds

**No manual confirmation needed!**

---

### ✅ Automatic Check-in Start
**When scanning a new/inactive tag:**
1. Scan NFC tag
2. App detects: "This tag is not active"
3. **AUTOMATICALLY goes to guest type selection** ✨
4. User selects guest type → clicks "Doorgaan"
5. User enters visitor count → clicks "Opslaan"
6. Shows success screen
7. Auto-returns to scan page after 5 seconds

**No manual "continue" button on scan page!**

---

## 📊 Complete Flow Diagram

```
┌─────────────────────────────────┐
│     SCAN NFC TAG                │
│     [Start Scan]                │
└─────────────────────────────────┘
              ↓
         Tag Scanned
              ↓
        Is tag active?
       ↙            ↘
    YES              NO
     ↓                ↓
┌─────────────┐  ┌──────────────────┐
│ CHECKOUT    │  │ CHECK-IN FLOW    │
│ (automatic) │  │ (automatic start)│
└─────────────┘  └──────────────────┘
     ↓                ↓
     ↓          Select Guest Type
     ↓                ↓
     ↓          [Doorgaan →]
     ↓                ↓
     ↓          Enter Visitor Count
     ↓                ↓
     ↓          [Opslaan]
     ↓                ↓
┌─────────────────────────────────┐
│   SUCCESS SCREEN                │
│   • Shows all details           │
│   • Auto-return in 5s           │
│   • [Terug naar scan] button    │
└─────────────────────────────────┘
              ↓
       Wait 5s OR Click
              ↓
        Back to START
```

---

## 🎯 Key Differences from Previous Version

### Before (Manual Mode):
```
Scan → Show ID → [Doorgaan →]
  ↓
Select Type → [Doorgaan →]
  ↓
Success
```

### Now (Automatic Mode):
```
Scan → AUTO ADVANCE → Select Type
  ↓                      ↓
AUTO CHECKOUT         [Doorgaan →]
  ↓                      ↓
Success                Success
```

---

## 💡 What's Automatic vs Manual

### 🤖 Automatic Actions:
- ✅ Detecting if tag is active or new
- ✅ Checking out active tags
- ✅ Advancing to guest type selection for new tags
- ✅ Returning to scan page after 5 seconds

### 👆 Manual Actions Required:
- Select guest type (Hotelgast/Daggast/Zwembadgast)
- Click "Doorgaan →" after selecting type
- Enter visitor counts
- Click "Opslaan" to save
- Optionally click "Terug naar scan" to skip 5s countdown

---

## 📱 User Experience

### For Check-out:
**Staff:** *Scans tag*
**App:** *Automatically checks out and shows details*
**Staff:** Sees confirmation, waits 5s or clicks back
**Total time:** ~3-5 seconds ⚡

### For Check-in:
**Staff:** *Scans tag*
**App:** *Automatically shows guest type selection*
**Staff:** Selects type → Enters counts → Saves
**App:** Shows success, auto-returns
**Total time:** ~15-20 seconds ⚡

---

## 🎨 Visual Indicators

### Success Screen for Checkout:
```
✅ Uitgecheckt!
De gast is succesvol uitgecheckt

┌─────────────────────────────┐
│ Scan Informatie             │
├─────────────────────────────┤
│ 👥 Type: Hotelgast          │
│ 👥 Personen: 2V + 1K        │
│ 🕐 Ingecheckt: 10:30        │
│ ⏱️ Totale duur: 2u 15m      │
│ 🏷️ Tag ID: 04:a8:52...     │
└─────────────────────────────┘

Automatisch terug in 5 seconden...

[Terug naar scan]
```

### Success Screen for Check-in:
```
✅ Ingecheckt!
De gegevens zijn succesvol opgeslagen

┌─────────────────────────────┐
│ Scan Informatie             │
├─────────────────────────────┤
│ 👥 Type: Daggast            │
│ 👥 Personen: 1V + 0K        │
│ 🕐 Ingecheckt: 14:23        │
│ 🏷️ Tag ID: 04:b9:63...     │
└─────────────────────────────┘

Automatisch terug in 5 seconden...

[Terug naar scan]
```

---

## 🐛 Debug Mode Still Available

Toggle "Toon debug info" to see:
- Current scanned tag ID
- All stored scans
- Active vs completed scans
- Guest details for each scan

---

## ✨ Benefits

1. **Faster checkout** - Just scan, done! ⚡
2. **Faster check-in start** - Auto-advances to first step
3. **Less confusion** - Clear automatic flow
4. **Still shows details** - All information visible on success screen
5. **Manual override** - Can click "Terug naar scan" anytime

---

**Perfect for busy pool reception desks!** 🏊‍♂️✨
