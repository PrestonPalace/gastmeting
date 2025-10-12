import { head, put, del } from '@vercel/blob';
import type { GuestData } from '../types';

const BLOB_PATHNAME = 'guest-entries.json';

export async function loadGuests(opts?: { bust?: boolean }): Promise<GuestData[]> {
  try {
    // Check if the blob exists and get its URL
    const details = await head(BLOB_PATHNAME);
    const url = opts?.bust ? `${details.url}?v=${Date.now()}` : details.url;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = (await res.json()) as unknown;
    if (Array.isArray(data)) return data as GuestData[];
    return [];
  } catch (err: any) {
    // If blob not found, return empty dataset
    return [];
  }
}

export async function saveGuests(guests: GuestData[]): Promise<void> {
  const body = JSON.stringify(guests);
  // Ensure we can overwrite by deleting existing blob first (no-op if it doesn't exist)
  try { await del(BLOB_PATHNAME); } catch {}
  await put(BLOB_PATHNAME, body, {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    cacheControlMaxAge: 60, // keep updates reasonably fresh
  });
}

export async function blobExists(): Promise<boolean> {
  try {
    await head(BLOB_PATHNAME);
    return true;
  } catch {
    return false;
  }
}

// Enforces: fetch latest -> delete file -> mutate -> recreate file -> verify
export async function rewriteGuests(
  mutate: (current: GuestData[]) => GuestData[],
  verify?: (finalList: GuestData[]) => boolean | Promise<boolean>
): Promise<{ guests: GuestData[]; verified: boolean } > {
  // Fetch latest with cache-bust
  const current = await loadGuests({ bust: true });
  // Delete existing blob (ignore errors)
  try { await del(BLOB_PATHNAME); } catch {}
  // Mutate
  const next = mutate(current);
  // Recreate file
  await put(BLOB_PATHNAME, JSON.stringify(next), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    cacheControlMaxAge: 60,
  });
  // Verify with small retry loop
  let verified = false;
  const attempts = 3;
  for (let i = 0; i < attempts; i++) {
    const latest = await loadGuests({ bust: true });
    if (verify) {
      // custom verify predicate
      // eslint-disable-next-line no-await-in-loop
      verified = await verify(latest);
    } else {
      // default: list length matches
      verified = latest.length === next.length;
    }
    if (verified) break;
    // small backoff
    // eslint-disable-next-line no-await-in-loop
    await new Promise((r) => setTimeout(r, 250));
  }
  return { guests: next, verified };
}
