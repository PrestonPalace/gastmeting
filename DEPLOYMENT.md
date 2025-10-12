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

In your Coolify dashboard:

1. Navigate to your application
2. Go to **"Storage"** or **"Persistent Storage"** tab
3. Add a new volume with these settings:
   - **Name**: `scan-data`
   - **Source Path**: `/data` (or any path you prefer on the host)
   - **Destination Path**: `/app/data`
   - **Mount Type**: Bind Mount or Volume

This ensures that the `data/scans.json` file persists across deployments and container restarts.

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
