export type LocalGuest = {
  id: string;
  entryTime: string;
  type: string;
  adults: number;
  children: number;
  endTime?: string;
  duration?: number;
};

const KEY = 'gastmeting.local.entries.v1';

export function getLocalEntries(): LocalGuest[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function setLocalEntries(entries: LocalGuest[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(entries));
  } catch {
    // ignore
  }
}

export function upsertLocalEntry(entry: LocalGuest) {
  const all = getLocalEntries();
  const idx = all.findIndex((e) => e.id === entry.id && !e.endTime);
  if (idx >= 0) {
    all[idx] = { ...all[idx], ...entry };
  } else {
    all.push(entry);
  }
  setLocalEntries(all);
}

export function markLocalCheckout(id: string, endTime: string, duration?: number) {
  const all = getLocalEntries();
  const idx = all.findIndex((e) => e.id === id && !e.endTime);
  if (idx >= 0) {
    all[idx] = { ...all[idx], endTime, duration };
  }
  setLocalEntries(all);
}

export function hasActiveLocal(id: string): boolean {
  return getLocalEntries().some((e) => e.id === id && !e.endTime);
}