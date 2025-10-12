# 🚀 Quick Start: Fixing Storage in Coolify

## The Problem
Data is not persisting even with volume mount configured.

## The Solution (3 Options)

### ⭐ Option 1: File Mount (Most Reliable)

**Best if you have SSH access to your Coolify server**

1. SSH into your Coolify server and run:
   ```bash
   sudo mkdir -p /var/lib/coolify/storage
   sudo touch /var/lib/coolify/storage/riviera-scans.json
   echo "[]" | sudo tee /var/lib/coolify/storage/riviera-scans.json
   sudo chmod 666 /var/lib/coolify/storage/riviera-scans.json
   ```

2. In Coolify → Storage → Add Storage:
   ```
   Name: scans-file
   Source: /var/lib/coolify/storage/riviera-scans.json
   Destination: /app/data/scans.json
   Type: Bind Mount
   Is Directory: NO
   ```

3. Redeploy

4. Done! ✅

---

### 🎯 Option 2: Use Admin Page (Easiest - No SSH)

**Best if you don't have SSH access**

1. Keep your current volume configuration (or set it up):
   ```
   Source: (empty)
   Destination: /app/data
   Type: Volume
   ```

2. Deploy your app

3. Visit: `https://your-domain.com/admin`

4. Click "🚀 Initialize Storage"

5. Should show:
   ```json
   {
     "success": true,
     "steps": [
       "✅ Directory created: /app/data",
       "✅ File created: /app/data/scans.json",
       "✅ Write test successful"
     ]
   }
   ```

6. Done! ✅

---

### 🔧 Option 3: Browser Console Command

**If you prefer command line**

1. Visit your app in browser

2. Press F12 (open DevTools)

3. Go to Console tab

4. Run:
   ```javascript
   fetch('/api/init', { method: 'POST' })
     .then(r => r.json())
     .then(data => console.log(data))
   ```

5. Check the response

6. Done! ✅

---

## How to Verify It's Working

### Method 1: Visit Admin Page
```
https://your-domain.com/admin
```
Click "📊 Check Status" - should show everything as ✅

### Method 2: Visit Debug Endpoint
```
https://your-domain.com/api/debug
```
Should return:
```json
{
  "directoryExists": true,
  "fileExists": true,
  "canWrite": true,
  "scansCount": 0
}
```

### Method 3: Test a Scan
1. Scan an NFC wristband
2. Complete check-in
3. Visit `/api/scans` - should show your scan
4. In Coolify, restart the container
5. Visit `/api/scans` again - data should still be there!

---

## Still Not Working?

### Check 1: Coolify Logs
In Coolify → Logs, look for:
```
✅ Directory created: /app/data
✅ File created: /app/data/scans.json
```

### Check 2: Volume Configuration
In Coolify → Storage, verify:
- Destination is `/app/data` (not `/data`)
- Volume is enabled
- App was redeployed AFTER adding volume

### Check 3: Run Init Manually
Visit `/admin` and click "🚀 Initialize Storage"

---

## Admin Page Features

Visit `https://your-domain.com/admin` to access:

- **🚀 Initialize Storage** - Set up storage directory and file
- **📊 Check Status** - View current storage configuration
- **📋 View Scans** - See all stored scan data
- **🗑️ Clear All Data** - Delete all scans (⚠️ dangerous!)

---

## My Recommendation

1. **Try Option 2 first** (Admin Page) - easiest, no SSH needed
2. **If that fails**, try Option 1 (File Mount) - most reliable
3. **If still issues**, share the output from `/api/debug` with your developer

---

## Expected Results

After successful setup:

✅ `/api/debug` shows `"canWrite": true`  
✅ `/api/init` shows `"success": true`  
✅ Scans persist across container restarts  
✅ Scans persist across redeployments  
✅ File exists at `/app/data/scans.json` in container

---

**Questions?** Check `COOLIFY_STORAGE_OPTIONS.md` for detailed troubleshooting!
