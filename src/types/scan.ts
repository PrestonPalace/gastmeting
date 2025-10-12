export type GuestType = 'hotelgast' | 'daggast' | 'zwembadgast';

export interface Scan {
  id: string;
  type: GuestType;
  adults: number;
  children: number;
  entryTime: string;
  endTime: string | null;
}

export interface ScanRequest {
  id: string;
  type: GuestType;
  adults: number;
  children: number;
}

export interface CheckoutRequest {
  id: string;
}
