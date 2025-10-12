# Persistent Storage Troubleshooting Guide

## 🔍 Current Setup

Your Coolify configuration:
```
Volume Name: scan-data
Source Path: /data
Destination Path: /app/data
```

This looks correct! ✅

## 📊 How to Debug Storage Issues

### Step 1: Check Storage Status

Visit the debug endpoint in your browser:
```
https://your-domain.com/api/debug
```

You should see JSON output like this:

**✅ Working correctly:**
```json
{
  "nodeEnv": "production",
  "dataDir": "/app/data",
  "directoryExists": true,
  "filesInDirectory": ["scans.json"],
  "fileExists": true,
  "canWrite": true,
  "scansCount": 5
}
```

**❌ Problem - Directory doesn't exist:**
```json
{
  "directoryExists": false,
  "directoryError": "ENOENT: no such file or directory"
}
```
**Solution:** Volume not mounted. Check Coolify storage settings.

**❌ Problem - Can't write:**
```json
{
  "directoryExists": true,
  "canWrite": false,
  "writeError": "EACCES: permission denied"
}
```
**Solution:** Permission issue. Container needs write access to `/app/data`.

### Step 2: Check Coolify Logs

1. In Coolify, go to your application
2. Click on **"Logs"** or **"Deployment Logs"**
3. Look for these messages:

**Good signs:**
```
Environment: production
Data directory: /app/data
Data directory exists: /app/data
Successfully wrote 1 scans to file: /app/data/scans.json
File size: 234 bytes
```

**Bad signs:**
```
Error writing scans file: EACCES: permission denied
Error creating scan: Failed to write file
```

### Step 3: Verify Volume Mount

In Coolify, check that:
1. ✅ Storage tab shows the volume
2. ✅ Destination path is `/app/data` (not `/data`)
3. ✅ Volume is active/enabled
4. ✅ Application has been redeployed after adding volume

## 🛠️ Common Issues & Solutions

### Issue 1: "No data is being saved"

**Diagnosis:**
- Scans appear to work
- Success screen shows
- But data disappears after container restart

**Solution:**
1. Verify volume is mounted at `/app/data`
2. Redeploy the application
3. Test by creating a scan
4. Check `/api/debug` endpoint
5. Restart container and check again

### Issue 2: "Permission denied errors"

**Diagnosis:**
- Logs show `EACCES` or permission errors
- `/api/debug` shows `canWrite: false`

**Solution:**

**Option A: Using Docker Volume (Recommended)**
```
Volume Name: scan-data
Source Path: (leave empty)
Destination Path: /app/data
```
Coolify manages permissions automatically.

**Option B: Using Bind Mount**
If using a host directory, set proper permissions:
```bash
# On the Coolify host server
sudo mkdir -p /data/scans
sudo chown -R 1000:1000 /data/scans
sudo chmod -R 755 /data/scans
```

Then in Coolify:
```
Source Path: /data/scans
Destination Path: /app/data
```

### Issue 3: "File exists but data is lost on redeploy"

**Diagnosis:**
- Data saves correctly
- But disappears when you redeploy

**Cause:** Volume not properly configured before first deployment.

**Solution:**
1. Stop the application
2. Configure the volume
3. Start/deploy the application
4. Verify with `/api/debug`

### Issue 4: "Cannot find /app/data directory"

**Diagnosis:**
- Logs show directory doesn't exist
- `/api/debug` shows `directoryExists: false`

**Solution:**
The app tries to create it automatically, but if that fails:

1. **In Coolify**, ensure volume is added BEFORE deploying
2. **Or** use Coolify's terminal to manually create:
   ```bash
   mkdir -p /app/data
   chmod 755 /app/data
   ```

## 📋 Verification Checklist

Use this checklist to verify storage is working:

- [ ] Volume added in Coolify Storage tab
- [ ] Destination path is `/app/data`
- [ ] Application redeployed after adding volume
- [ ] `/api/debug` shows `directoryExists: true`
- [ ] `/api/debug` shows `canWrite: true`
- [ ] Create a test scan via the app
- [ ] `/api/debug` shows `scansCount: 1` or higher
- [ ] `/api/scans` returns the scan data
- [ ] Restart container
- [ ] Data still exists after restart
- [ ] Redeploy application
- [ ] Data still exists after redeploy

## 🔧 Manual Data Inspection

### View the data file directly:

**In Coolify Terminal:**
1. Go to your application in Coolify
2. Click **"Terminal"** or **"Shell"**
3. Run these commands:

```bash
# Check if directory exists
ls -la /app/data

# Check if file exists
ls -la /app/data/scans.json

# View file contents
cat /app/data/scans.json

# Check file permissions
stat /app/data/scans.json
```

**Expected output:**
```bash
$ ls -la /app/data
total 8
drwxr-xr-x 2 root root 4096 Oct 12 10:30 .
drwxr-xr-x 1 root root 4096 Oct 12 10:25 ..
-rw-r--r-- 1 root root  234 Oct 12 10:31 scans.json

$ cat /app/data/scans.json
[
  {
    "id": "04:a8:52:ca:70:1d:90",
    "type": "hotelgast",
    "adults": 2,
    "children": 1,
    "entryTime": "2025-10-12T10:30:00.000Z",
    "endTime": null
  }
]
```

## 🎯 Recommended Configuration

For Coolify, use this configuration:

### Docker Volume (Easiest)
```
Volume Name: scan-data
Source Path: (leave empty - let Coolify manage it)
Destination Path: /app/data
Type: Volume
```

**Pros:**
- ✅ Coolify manages permissions
- ✅ Automatic backups possible
- ✅ Portable across hosts

### Bind Mount (Advanced)
```
Volume Name: scan-data  
Source Path: /var/lib/coolify/data/riviera-scans
Destination Path: /app/data
Type: Bind
```

**Pros:**
- ✅ Easy to access from host
- ✅ Easy to backup manually
- ⚠️ Requires manual permission setup

## 📊 Testing Procedure

1. **Deploy the app** with volume configured
2. **Visit** `https://your-domain.com/api/debug`
3. **Verify** response shows:
   ```json
   { "canWrite": true, "directoryExists": true }
   ```
4. **Scan an NFC tag** and complete check-in
5. **Visit** `https://your-domain.com/api/scans`
6. **Verify** your scan appears in the array
7. **Visit** `https://your-domain.com/api/debug` again
8. **Verify** `scansCount` increased
9. **Restart** the container in Coolify
10. **Visit** `https://your-domain.com/api/scans` again
11. **Verify** data is still there ✅

## 🆘 Still Not Working?

If data still isn't persisting after following this guide:

1. **Share the output** of `https://your-domain.com/api/debug`
2. **Share the deployment logs** from Coolify
3. **Check Coolify storage tab** - is the volume showing as mounted?
4. **Try removing and re-adding** the volume, then redeploy

## 📝 Example: Working Setup

Here's a confirmed working configuration:

**Coolify Settings:**
- Build Pack: Nixpacks
- Port: 3000
- Base Directory: /

**Storage:**
- Volume Name: `riviera-scan-data`
- Source: (empty - Docker volume)
- Destination: `/app/data`

**Environment:**
- `NODE_ENV=production` (set automatically by Coolify)

**After deployment:**
- `/api/debug` shows `canWrite: true`
- Scans persist across restarts
- File visible in container: `/app/data/scans.json`

---

**Need help?** Check the Coolify logs and `/api/debug` endpoint first!
