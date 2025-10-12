# Testing Checklist - Riviera Zwembad NFC Scanner

## 🧪 Pre-Deployment Testing

### Local Development
- [ ] Application builds successfully (`npm run build`)
- [ ] Development server runs (`npm run dev`)
- [ ] No TypeScript errors
- [ ] No linting errors
- [ ] All dependencies installed correctly

### API Endpoints
- [ ] `GET /api/scans` returns empty array initially
- [ ] `POST /api/scans` creates new scan entry
- [ ] `POST /api/scans` rejects duplicate active scans
- [ ] `PATCH /api/scans` updates scan with exit time
- [ ] `PATCH /api/scans` returns 404 for non-existent scans
- [ ] Data persists to `data/scans.json` file
- [ ] JSON file is created automatically if missing

## 📱 Production Testing (Coolify)

### Deployment
- [ ] Application deploys successfully on Coolify
- [ ] Nixpacks detects Next.js correctly
- [ ] Port 3000 is configured
- [ ] HTTPS is enabled
- [ ] Persistent storage mounted at `/app/data`
- [ ] Application starts without errors

### NFC Functionality (Android Tablet)
- [ ] NFC permission prompt appears
- [ ] NFC permission can be granted
- [ ] Scan button is clickable
- [ ] Scanning animation appears
- [ ] Wristband scan is detected
- [ ] Serial number is captured correctly
- [ ] Error handling works for failed scans

### Check-In Flow
- [ ] Start scan screen displays correctly
- [ ] NFC scan initiates properly
- [ ] Guest type selection screen appears
- [ ] All three guest types are clickable
- [ ] Visitor count screen appears
- [ ] Adult counter increments/decrements
- [ ] Children counter increments/decrements
- [ ] Counters cannot go below 0
- [ ] Submit button works
- [ ] Data is saved correctly
- [ ] Success screen appears
- [ ] Auto-redirect to start works (3 seconds)

### Check-Out Flow
- [ ] Scanning same wristband detects active scan
- [ ] Check-out happens automatically
- [ ] Exit time is recorded
- [ ] Success screen shows "Uitgecheckt!"
- [ ] Auto-redirect works

### UI/UX
- [ ] All text is in Dutch
- [ ] Colors match Preston Palace Riviera scheme
- [ ] Buttons are large and touch-friendly
- [ ] Icons display correctly (Lucide React)
- [ ] Back buttons work on all screens
- [ ] Animations are smooth
- [ ] Responsive on tablet screen sizes
- [ ] No emojis (only icons)

### Data Persistence
- [ ] Data survives application restart
- [ ] Data survives container restart
- [ ] Multiple scans accumulate correctly
- [ ] JSON file format is valid
- [ ] Timestamps are in ISO format
- [ ] All required fields are present

### Error Handling
- [ ] NFC not supported shows error message
- [ ] Failed scan shows error message
- [ ] Network errors show appropriate message
- [ ] Validation errors show clear messages
- [ ] All error messages are in Dutch

## 🔍 Edge Cases

### Unusual Scenarios
- [ ] Scanning a wristband that was never checked in (should create new entry)
- [ ] Scanning a wristband that was already checked out (should create new entry)
- [ ] Submitting with 0 adults and 0 children (should be disabled)
- [ ] Very long NFC IDs are handled correctly
- [ ] Special characters in NFC IDs work
- [ ] Rapid consecutive scans don't cause issues
- [ ] Offline mode error handling

### Data Integrity
- [ ] Concurrent scans don't corrupt data
- [ ] Large JSON files (100+ entries) load correctly
- [ ] Date/time is accurate (check timezone)
- [ ] Entry time always comes before exit time

## 📊 Performance

### Speed
- [ ] Scan detection is quick (<2 seconds)
- [ ] Page transitions are smooth
- [ ] API responses are fast (<500ms)
- [ ] No lag when incrementing counters
- [ ] Auto-redirect timing is accurate

### Resource Usage
- [ ] Application doesn't crash with many scans
- [ ] Memory usage is reasonable
- [ ] CPU usage is low during idle
- [ ] No memory leaks over time

## 🎓 User Acceptance Testing

### Employee Testing
- [ ] Employees understand the flow
- [ ] Buttons are easy to tap on tablet
- [ ] Text is readable from normal distance
- [ ] Instructions are clear
- [ ] Errors are understandable
- [ ] Back navigation is intuitive
- [ ] Overall satisfaction is high

### Real-World Usage
- [ ] Works in bright sunlight (outdoor pool)
- [ ] Works with wet hands/screens
- [ ] NFC reads through light water splash
- [ ] Performance during peak hours
- [ ] Battery drain is acceptable

## 🔧 Maintenance

### Backup & Recovery
- [ ] Data backup procedure documented
- [ ] Data can be restored from backup
- [ ] Persistent volume configuration verified
- [ ] Disaster recovery plan tested

### Monitoring
- [ ] Application logs are accessible
- [ ] Error logs are meaningful
- [ ] Deployment logs are clear
- [ ] Data file size monitoring

## ✅ Sign-Off

| Test Category | Status | Tester | Date | Notes |
|--------------|--------|---------|------|-------|
| Local Development | ⬜ | | | |
| API Endpoints | ⬜ | | | |
| Deployment | ⬜ | | | |
| NFC Functionality | ⬜ | | | |
| Check-In Flow | ⬜ | | | |
| Check-Out Flow | ⬜ | | | |
| UI/UX | ⬜ | | | |
| Data Persistence | ⬜ | | | |
| Error Handling | ⬜ | | | |
| Edge Cases | ⬜ | | | |
| Performance | ⬜ | | | |
| User Acceptance | ⬜ | | | |
| Maintenance | ⬜ | | | |

---

**Production Ready**: ⬜

**Approved By**: _________________

**Date**: _________________
