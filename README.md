# Riviera Zwembad - NFC Scanner Application

A Next.js web application for scanning NFC wristbands at Preston Palace Almelo's Riviera Swimming Pool.

## Features

- **NFC Scanning**: Uses Web NFC API to read wristband IDs
- **Guest Type Classification**: Hotelgast, Daggast, or Zwembadgast
- **Visitor Counting**: Track adults and children
- **Check-in/Check-out**: Automatic detection of entry vs exit scans
- **Data Storage**: JSON file-based storage with timestamps
- **Employee-Friendly UI**: Large buttons, clear flow, easy navigation

## Technology Stack

- **Framework**: Next.js 15.5.4
- **Styling**: Tailwind CSS 4
- **Icons**: Lucide React
- **Runtime**: Node.js
- **Deployment**: Coolify with Nixpacks

## Color Scheme

Preston Palace Riviera brand colors:
- Primary: `#072B31` (Dark teal)
- Secondary: `#49C5B1` (Turquoise)
- Accent: `#EFBE7D` (Gold)
- Success: `#2A9D8F` (Success green)
- Error: `#E76F51` (Error red)

## User Flow

1. **Scan**: Employee scans the NFC wristband
2. **Detection**: System checks if this is entry or exit
   - If existing active scan → Checkout
   - If no active scan → Check-in
3. **Guest Type** (Check-in only): Select Hotelgast, Daggast, or Zwembadgast
4. **Visitor Count** (Check-in only): Count adults and children
5. **Success**: Confirmation message with auto-redirect

## API Endpoints

### `GET /api/scans`
Retrieve all scans or a specific scan by ID.

**Query Parameters:**
- `id` (optional): NFC wristband ID

**Response:**
```json
[
  {
    "id": "04:a8:52:ca:70:1d:90",
    "type": "hotelgast",
    "adults": 2,
    "children": 1,
    "entryTime": "2025-10-12T10:00:00.000Z",
    "endTime": null
  }
]
```

### `POST /api/scans`
Create a new scan entry (check-in).

**Body:**
```json
{
  "id": "04:a8:52:ca:70:1d:90",
  "type": "hotelgast",
  "adults": 2,
  "children": 1
}
```

### `PATCH /api/scans`
Update scan with exit time (check-out).

**Body:**
```json
{
  "id": "04:a8:52:ca:70:1d:90"
}
```

## Development

### Prerequisites

- Node.js 20+
- npm or yarn
- NFC-enabled Android device for testing (with Chrome/Edge)

### Installation

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

**Note**: NFC functionality requires HTTPS and won't work in local development without proper SSL setup.

### Build

```bash
npm run build
```

### Start Production Server

```bash
npm run start
```

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed Coolify deployment instructions.

**Key Requirements:**
- Persistent storage mounted at `/app/data`
- HTTPS enabled (automatic with Coolify)
- Port 3000
- Nixpacks build pack

## NFC Requirements

The Web NFC API requires:
- Android device with NFC hardware
- Chrome or Edge browser
- HTTPS connection
- User permission grant

**Supported Devices:**
- Android 7.0+ with NFC
- Tablets with NFC capability

**Not Supported:**
- iOS devices (Web NFC not available)
- Desktop browsers (no NFC hardware)

## Data Storage

Scan data is stored in `/app/data/scans.json` with the following structure:

```json
[
  {
    "id": "04:a8:52:ca:70:1d:90",
    "type": "hotelgast",
    "adults": 2,
    "children": 1,
    "entryTime": "2025-10-12T10:00:00.000Z",
    "endTime": "2025-10-12T14:30:00.000Z"
  }
]
```

## Project Structure

```
gastmeting/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── scans/
│   │   │       └── route.ts      # API endpoints
│   │   ├── globals.css           # Custom styling
│   │   ├── layout.tsx            # Root layout
│   │   └── page.tsx              # Main application
│   └── ...
├── data/
│   └── scans.json               # Scan data (auto-created)
├── DEPLOYMENT.md                # Deployment guide
└── package.json
```

## License

Proprietary - Preston Palace Almelo

## Support

For issues or questions, contact the Preston Palace IT department.

