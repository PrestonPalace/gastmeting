export type GuestType = 'hotelgast' | 'daggast' | 'zwembadgast';

export interface Scan {
  id: string;           // Unique session ID (e.g., "ABC123-1728745200000")
  tagId: string;        // NFC tag ID (e.g., "ABC123")
  type: GuestType;
  adults: number;
  children: number;
  entryTime: string;
  endTime: string | null;
}

export interface ScanRequest {
  id: string;           // NFC tag ID
  type: GuestType;
  adults: number;
  children: number;
}

export interface CheckoutRequest {
  id: string;           // NFC tag ID
}
