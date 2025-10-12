# Coolify Storage Solutions for NFC Scan App

## 🔴 Current Problem
Data is not persisting across deployments/restarts even with volume mount configured.

## ✅ Solution Options

### Option 1: File Mount (Recommended for Coolify)

Instead of mounting a directory, mount the specific JSON file. This often works better with Coolify.

#### Steps:

1. **In Coolify**, go to your app → **Storage** tab

2. **Click "Add Storage"**

3. **Configure as follows:**
   ```
   Name: scans-file
   Source Path: /var/lib/coolify/storage/riviera-scans.json
   Destination Path: /app/data/scans.json
   Type: Bind Mount
   Is Directory: NO (unchecked)
   ```

4. **On your Coolify server**, create the file first:
   ```bash
   # SSH into your Coolify server
   sudo mkdir -p /var/lib/coolify/storage
   sudo touch /var/lib/coolify/storage/riviera-scans.json
   echo "[]" | sudo tee /var/lib/coolify/storage/riviera-scans.json
   sudo chmod 666 /var/lib/coolify/storage/riviera-scans.json
   ```

5. **Redeploy** your application in Coolify

6. **Test** by visiting `https://your-domain.com/api/debug`

#### Pros:
- ✅ More reliable than directory mounts
- ✅ File permissions easier to manage
- ✅ Exactly what you need (one file)

#### Cons:
- ⚠️ Need SSH access to Coolify server
- ⚠️ Must create file before first deployment

---

### Option 2: Use Initialization Endpoint (NEW!)

I just added a `/api/init` endpoint that will set up storage for you.

#### Steps:

1. **Keep your current volume configuration:**
   ```
   Source Path: /data (or leave empty)
   Destination Path: /app/data
   Type: Volume
   ```

2. **Deploy your app**

3. **Visit the initialization endpoint:**
   ```
   POST https://your-domain.com/api/init
   ```
   
   **Easy way to test with browser:**
   - Open browser dev tools (F12)
   - Go to Console tab
   - Run this:
   ```javascript
   fetch('/api/init', { method: 'POST' })
     .then(r => r.json())
     .then(console.log)
   ```

4. **Check the response** - it will show you exactly what happened:
   ```json
   {
     "success": true,
     "steps": [
       "✅ Directory exists: /app/data",
       "✅ File created: /app/data/scans.json",
       "✅ Write test successful",
       "✅ Read test successful"
     ],
     "errors": []
   }
   ```

5. **Now test the app** - scan an NFC tag

#### Pros:
- ✅ No SSH access needed
- ✅ Detailed diagnostics
- ✅ Can re-run anytime
- ✅ Works with existing volume

#### Cons:
- ⚠️ Public endpoint (anyone can call it, but it's safe)

---

### Option 3: Environment Variable Override

Allow configuring storage path via environment variable.

#### Steps:

1. **In Coolify**, go to **Environment Variables**

2. **Add this variable:**
   ```
   STORAGE_PATH=/app/data/scans.json
   ```

3. **Configure volume/file mount** to match this path

4. **Redeploy**

I can update the code to use this environment variable if you want this approach.

---

### Option 4: Use Coolify's Built-in Persistent Storage

Coolify has a special persistent storage feature for apps.

#### Steps:

1. **In Coolify**, go to your app settings

2. **Find "Persistent Storage"** section

3. **Enable it** and set:
   ```
   Path: /app/data
   ```

4. **Redeploy**

This uses Coolify's managed storage which should handle permissions automatically.

---

## 🔧 Immediate Action: Test Current Setup

Before trying new approaches, let's see what's actually happening:

### Step 1: Visit Debug Endpoint
```
https://your-domain.com/api/debug
```

Share the JSON output with me.

### Step 2: Initialize Storage
```
POST https://your-domain.com/api/init
```

To call this easily:
1. Open your app in browser
2. Press F12 (dev tools)
3. Go to Console
4. Paste this:
```javascript
fetch('/api/init', { method: 'POST' })
  .then(r => r.json())
  .then(data => {
    console.log('Initialization Result:', data);
    alert(data.success ? 'Storage initialized!' : 'Error: ' + data.errors.join(', '));
  });
```

### Step 3: Check Coolify Logs

Look for these log messages in Coolify:
```
=== STORAGE INITIALIZATION ===
Environment: production
Data directory: /app/data
✅ Directory created: /app/data
✅ File created: /app/data/scans.json
```

---

## 📊 Comparison Table

| Option | Difficulty | Reliability | Requires SSH | Coolify Native |
|--------|-----------|-------------|--------------|----------------|
| File Mount | Easy | ⭐⭐⭐⭐⭐ | Yes | Yes |
| Init Endpoint | Very Easy | ⭐⭐⭐⭐ | No | Yes |
| Volume Mount | Easy | ⭐⭐⭐ | No | Yes |
| Persistent Storage | Very Easy | ⭐⭐⭐⭐⭐ | No | Yes |

---

## 🎯 My Recommendation

**Try this order:**

1. **First**: Run `/api/init` endpoint (POST request)
   - See if it can create the file
   - Check what errors you get

2. **If that works**: Great! Data should persist now

3. **If that fails**: Try **File Mount** (Option 1)
   - More explicit control
   - Known to work well with Coolify

4. **If still issues**: Try **Coolify Persistent Storage** (Option 4)
   - Managed by Coolify
   - Least likely to have permission issues

---

## 🚨 Common Coolify Issues

### Issue: "Volume added after first deployment"
**Solution**: Delete the app in Coolify and recreate it WITH the volume from the start.

### Issue: "Permission denied"
**Solution**: Use Docker volume instead of bind mount, OR set permissions on host:
```bash
sudo chown -R 1000:1000 /path/to/data
sudo chmod -R 755 /path/to/data
```

### Issue: "File disappears after redeploy"
**Solution**: Volume must be configured BEFORE first deployment, or volume is mounted to wrong path.

---

## 📞 Next Steps

1. Try the `/api/init` endpoint first
2. Share the output with me
3. Based on that, we'll know which option to use

Let me know what you get from `/api/init`! 🔍
