# New User Flow - NFC Scan App

## 📱 Complete Flow Diagram

```
┌─────────────────────────────────────────────┐
│          START: Scan Page                   │
│  ┌───────────────────────────────────┐     │
│  │   [Debug Info Toggle]             │     │
│  │   🐛 Shows: Current ID, All scans │     │
│  └───────────────────────────────────┘     │
│                                             │
│  ┌───────────────────────────────────┐     │
│  │        📡 NFC Scanner              │     │
│  │    [Start Scan] button             │     │
│  └───────────────────────────────────┘     │
└─────────────────────────────────────────────┘
                    ↓
              Scan Tag
                    ↓
┌─────────────────────────────────────────────┐
│   ✅ Tag Scanned                            │
│   ID: 04:a8:52:ca:70:1d:90                  │
│   [Doorgaan →] button                       │
└─────────────────────────────────────────────┘
         ↙              ↘
    Click Doorgaan    Check if active?
         ↓                  ↓
         ↓             YES - Active Scan Found
         ↓                  ↓
         ↓          ┌──────────────────────────┐
         ↓          │  📋 CHECKOUT INFO SCREEN │
         ↓          │                          │
         ↓          │  Type: Hotelgast        │
         ↓          │  Personen: 2V + 1K      │
         ↓          │  Ingecheckt: 10:30      │
         ↓          │  Duur: 2u 15m           │
         ↓          │  Tag ID: 04:a8...       │
         ↓          │                          │
         ↓          │  [Uitchecken] button    │
         ↓          │  [Terug naar scan]      │
         ↓          └──────────────────────────┘
         ↓                  ↓
         ↓            Click Uitchecken
         ↓                  ↓
         ↓          ┌──────────────────────────┐
         ↓          │  ✅ UITGECHECKT!         │
         ↓          │  Totale duur: 2u 15m    │
         ↓          │  Auto-return in 5s...   │
         ↓          │  [Terug naar scan]      │
         ↓          └──────────────────────────┘
         ↓                  ↓
         ↓            Wait 5s OR click back
         ↓                  ↓
         └──────────────────┘
                    ↓
            Return to START
                    

    NO - New Check-in
         ↓
┌─────────────────────────────────────────────┐
│       SELECT GUEST TYPE                     │
│  ┌───────────────┐                          │
│  │ 👥 Hotelgast  │ ← Selected (green ring) │
│  │     ✓         │                          │
│  └───────────────┘                          │
│  ┌───────────────┐                          │
│  │ 👤 Daggast    │                          │
│  └───────────────┘                          │
│  ┌───────────────┐                          │
│  │ 📡 Zwembadgast│                          │
│  └───────────────┘                          │
│                                             │
│  [Terug] ←   [Doorgaan →]                  │
└─────────────────────────────────────────────┘
                    ↓
              Click Doorgaan
                    ↓
┌─────────────────────────────────────────────┐
│       VISITOR COUNT                         │
│                                             │
│  Volwassenen:  [−] 2 [+]                   │
│  Kinderen:     [−] 1 [+]                   │
│                                             │
│  [Terug] ←   [Opslaan]                     │
└─────────────────────────────────────────────┘
                    ↓
              Click Opslaan
                    ↓
┌─────────────────────────────────────────────┐
│  ✅ INGECHECKT!                             │
│  De gegevens zijn opgeslagen                │
│  Tag ID: 04:a8:52:ca:70:1d:90              │
│  Auto-return in 5s...                       │
│  [Terug naar scan]                          │
└─────────────────────────────────────────────┘
                    ↓
          Wait 5s OR click back
                    ↓
            Return to START
```

## 🎯 Key Improvements

### 1. **No More Auto-Advancing**
- Every step requires user confirmation
- Prevents accidental progression
- Allows users to review and change selections

### 2. **Visual Feedback**
- Scanned tag shows with green box
- Selected guest type shows green ring + checkmark
- Active scans show green dot in debug mode

### 3. **Rich Checkout Information**
```
When checking out, you see:

┌──────────────────────────────────┐
│ 📋 Scan Informatie               │
├──────────────────────────────────┤
│ Type:          👥 Hotelgast      │
│ Personen:      2V + 1K           │
│ Ingecheckt:    10:30 - 12 okt    │
│ Duur:          2u 15m            │
│ Tag ID:        04:a8:52:ca...    │
└──────────────────────────────────┘

[Uitchecken] [Terug naar scan]
```

### 4. **Smart Timer**
- 5-second countdown on success screens
- **Resets** when new tag is scanned
- **Stops** when user manually goes back
- **Stops** during checkout to prevent interruption

### 5. **Debug Mode**
```
Toggle: [Toon debug info]

🐛 Debug Informatie
Huidige scan ID: 04:a8:52:ca:70:1d:90
Totaal scans: 3
Actieve scans: 1

Opgeslagen IDs:
04:a8:52:ca:70:1d:90 - hotelgast (2V + 1K) ● ACTIEF
04:b9:63:db:81:2e:a1 - daggast (1V + 0K)
04:c0:74:ec:92:3f:b2 - zwembadgast (2V + 2K)
```

## 🔄 Comparison: Before vs After

### Before
```
Scan → Auto-advance
  ↓
Select Type → Auto-advance
  ↓
Enter Counts → Submit
  ↓
Success → Auto-return (3s)
```
**Problems:**
- Too fast, easy to make mistakes
- No time to review
- Minimal checkout information
- Can't cancel

### After
```
Scan → [Doorgaan →]
  ↓
Select Type → [Doorgaan →]
  ↓
Enter Counts → [Opslaan]
  ↓
Success/Info → [Terug] or wait 5s
```
**Benefits:**
- ✅ Full control at every step
- ✅ Can review before proceeding
- ✅ Rich checkout details
- ✅ Can go back anytime
- ✅ Debug mode for troubleshooting

## 📱 Mobile-Friendly
- Large touch targets
- Clear visual feedback
- Easy to read information
- Finger-friendly spacing

## 🎨 Color-Coded Actions
- **Green**: Success, Active, Continue
- **Blue/Teal**: Primary actions
- **Red**: Danger (Checkout)
- **Gray**: Secondary actions (Back)
- **Yellow/Gold**: Accent highlights

---

**Ready to deploy!** 🚀
