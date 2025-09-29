This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Database (MongoDB Atlas)

This app stores guest entries in MongoDB Atlas.

- Required env var: set `MONGODB_URI` in `.env.local` (already present). Optionally, set `MONGODB_DB` to override the default database name `gastmeting`.
- Collections: `guestEntries`

### Local dev

1. Ensure your Atlas cluster allows connections from your IP. In Atlas UI: Network Access > IP Access List > add your current IP or 0.0.0.0/0 for testing.
2. Run the dev server and test endpoints:
	 - GET `/api/guests`
	 - POST `/api/guests` with JSON body: `{ "action": "checkin", "id": "<nfc-id>", "type": "hotelgast", "adults": 2, "children": 1 }`
	 - POST `/api/guests` with `{ "action": "checkout", "id": "<nfc-id>" }`
	 - GET `/api/guests/check/<id>` to determine check-in vs checkout flow.

### Seed data (optional)

To import existing `data/guest-entries.json` into MongoDB, call:

- POST `/api/guests/seed` (works in development by default). In production, set `SEED_KEY` and call `/api/guests/seed?key=YOUR_KEY`.

### Troubleshooting connectivity

- ETIMEDOUT / MongoServerSelectionError:
	- Verify your Atlas Network Access IP allowlist includes your current IP or 0.0.0.0/0.
	- Ensure the username/password embedded in `MONGODB_URI` is correct and the user has rights.
	- If using Vercel, prefer the MongoDB Atlas Native Integration. It automatically manages `MONGODB_URI`, db user, and IP access for dynamic Vercel IPs. See: https://www.mongodb.com/docs/atlas/reference/partner-integrations/vercel/
	- If you manage Atlas manually for Vercel deployments, add 0.0.0.0/0 to the Atlas IP access list.
