import { loadGuests } from '../../lib/blobStore';

export const dynamic = 'force-dynamic';

export default async function DataPage() {
  const guests = await loadGuests({ bust: true });
  return (
    <pre style={{ padding: 16, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
      {JSON.stringify(guests, null, 2)}
    </pre>
  );
}
