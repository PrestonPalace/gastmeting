# Riviera Zwembad NFC Scanner - Deployment Guide

## Coolify Deployment with Nixpacks

This Next.js application is configured to deploy automatically on Coolify using Nixpacks.

### Coolify Configuration

#### 1. Build Pack Settings
- **Build Pack**: Nixpacks (auto-detected)
- **Base Directory**: `/` (root)
- **Port**: `3000` (default Next.js port)
- **Is it a static site?**: ❌ **NO** (this is a server-side application with API routes)

#### 2. Persistent Storage Configuration

**⚠️ CRITICAL**: You MUST configure persistent storage for the JSON data file.

Choose one of these options:

##### Option A: File Mount (Most Reliable - Recommended)

Mount the specific JSON file instead of the directory:

1. **On your Coolify server** (requires SSH access):
   ```bash
   sudo mkdir -p /var/lib/coolify/storage
   sudo touch /var/lib/coolify/storage/riviera-scans.json
   echo "[]" | sudo tee /var/lib/coolify/storage/riviera-scans.json
   sudo chmod 666 /var/lib/coolify/storage/riviera-scans.json
   ```

2. **In Coolify dashboard**:
   - Navigate to your application
   - Go to **"Storage"** tab
   - Click **"+ Add"**
   - Configure:
     ```
     Name: scans-file
     Source Path: /var/lib/coolify/storage/riviera-scans.json
     Destination Path: /app/data/scans.json
     Type: Bind Mount
     Is Directory: NO (unchecked)
     ```

3. Click **Save** and **Redeploy**

##### Option B: Directory Mount

Mount the entire data directory (requires initialization):

1. **In Coolify dashboard**:
   - Navigate to your application
   - Go to **"Storage"** tab
   - Click **"+ Add"**
   - Configure:
     ```
     Volume Name: scan-data
     Source Path: (leave empty for Docker volume)
     Destination Path: /app/data
     Type: Volume
     ```

2. Click **Save** and **Redeploy**

3. **Initialize storage** after deployment:
   - Open your app in browser
   - Press F12 (developer tools)
   - Go to Console tab
   - Run this:
     ```javascript
     fetch('/api/init', { method: 'POST' })
       .then(r => r.json())
       .then(console.log)
     ```
   - Should show `"success": true`

**Important Notes:**
- The destination path MUST be `/app/data` for directory mount
- The destination path MUST be `/app/data/scans.json` for file mount
- File mount is more reliable but requires SSH access
- Directory mount works but needs initialization via `/api/init`

#### 3. Verify Storage is Working

After deployment, check storage status:

1. **Visit the debug endpoint:**
   ```
   https://your-domain.com/api/debug
   ```

   Should show:
   ```json
   {
     "directoryExists": true,
     "fileExists": true,
     "canWrite": true,
     "scansCount": 0
   }
   ```

2. **If using directory mount**, initialize if needed:
   ```
   POST https://your-domain.com/api/init
   ```
   
   Browser console command:
   ```javascript
   fetch('/api/init', { method: 'POST' })
     .then(r => r.json())
     .then(data => console.log(data))
   ```

3. **Test persistence:**
   - Scan an NFC tag
   - Check `/api/scans` - should show your scan
   - Restart the container in Coolify
   - Check `/api/scans` again - data should still be there ✅
- ✅ Last scan data

If you see errors, check:
- Volume is mounted at `/app/data`
- Container has write permissions
- Volume has sufficient disk space

#### 3. Environment Variables

No specific environment variables are required for basic functionality. However, you can add:

```bash
NODE_ENV=production
```

### File Structure

The application stores scan data in:
```
/app/data/scans.json
```

This file is automatically created on the first scan if it doesn't exist.

### Data Format

Each scan entry follows this structure:

```json
{
  "id": "04:a8:52:ca:70:1d:90",
  "type": "hotelgast",
  "adults": 1,
  "children": 0,
  "entryTime": "2025-09-29T13:49:11.165Z",
  "endTime": "2025-09-29T13:49:19.781Z"
}
```

### Deployment Steps

1. **Push your code** to your Git repository
2. **Create a new resource** in Coolify
3. **Select your Git repository**
4. **Choose Nixpacks** as the build pack (usually auto-selected)
5. **Configure the port** to `3000`
6. **Add persistent storage** as described above
7. **Deploy** the application

### Important Notes

- **NFC Support**: The Web NFC API only works on:
  - Android devices with Chrome/Edge browser
  - Devices with NFC hardware
  - HTTPS connections (required for NFC API)
  
- **HTTPS**: Coolify automatically provides SSL certificates, which is required for the NFC Web API to work.

- **Data Backup**: Consider setting up regular backups of the `data` directory to prevent data loss.

### Troubleshooting

**NFC not working?**
- Ensure you're using HTTPS
- Check if the device has NFC hardware
- Make sure NFC is enabled in device settings
- Use Chrome or Edge browser on Android

**Data not persisting?**
- Verify persistent storage is configured correctly
- Check that the destination path is `/app/data`
- Ensure the volume is mounted before deployment

**API errors?**
- Check application logs in Coolify
- Verify the `data` directory has write permissions
- Ensure the container has enough disk space

### Local Development

To run locally:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

**Note**: NFC functionality will not work in local development without HTTPS. You can test the UI flow, but NFC scanning requires a production deployment with SSL.

### Production Checklist

- [ ] Persistent storage configured for `/app/data`
- [ ] HTTPS enabled (automatic with Coolify)
- [ ] Port set to 3000
- [ ] Build pack set to Nixpacks
- [ ] Repository connected and deployable
- [ ] NFC hardware available on the tablet
- [ ] Chrome/Edge browser installed on the tablet

## Support

For issues specific to:
- **Coolify**: Check Coolify documentation or support
- **NFC API**: See [Web NFC API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Web_NFC_API)
- **Application**: Contact the development team
