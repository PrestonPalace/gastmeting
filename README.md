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

## Storage (Vercel Blob)

This app stores guest entries as a single JSON file in [Vercel Blob](https://vercel.com/docs/vercel-blob): `guest-entries.json`.

- Required env var when not deployed on the same Vercel project as your Blob store: `BLOB_READ_WRITE_TOKEN`.
- On Vercel, create a Blob store in your Project > Storage, and Vercel will inject `BLOB_READ_WRITE_TOKEN` automatically. For local dev, run `vercel env pull` to sync envs.

### Local dev

1. Ensure you have a Blob store connected to your Vercel project. In the dashboard, Storage > Create > Blob.
2. Pull envs locally so the SDK can authenticate:

   - `vercel env pull` (requires Vercel CLI)

3. Run the dev server and test endpoints:

	- GET `/api/guests`
	- POST `/api/guests` with JSON body: `{ "action": "checkin", "id": "<nfc-id>", "type": "hotelgast", "adults": 2, "children": 1 }`
	- POST `/api/guests` with `{ "action": "checkout", "id": "<nfc-id>" }`
	- GET `/api/guests/check/<id>`

### Seed data (optional)

To initialize the store from `data/guest-entries.json`, call:

- POST `/api/guests/seed` (works in development by default). In production, set `SEED_KEY` and call `/api/guests/seed?key=YOUR_KEY`.

### Notes on caching

Blob reads are cached by Vercel and browsers. This app sets `cacheControlMaxAge: 60` when writing the JSON to reduce staleness. If you observe stale data, wait up to a minute or add a cache-busting query string when fetching.
