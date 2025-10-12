import { head, put, del } from '@vercel/blob';
import type { GuestData } from '../types';

const BLOB_PATHNAME = 'guest-entries.json';

export async function loadGuests(): Promise<GuestData[]> {
  try {
    // Check if the blob exists and get its URL
    const details = await head(BLOB_PATHNAME);
    const res = await fetch(details.url, { cache: 'no-store' });
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
