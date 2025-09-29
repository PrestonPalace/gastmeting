export type GuestType = 'hotelgast' | 'daggast' | 'zwembadgast';

export interface GuestData {
  id: string;
  type: GuestType;
  adults: number;
  children: number;
  entryTime: string;
  endTime?: string;
  duration?: number; // Duration in milliseconds
}

export interface NFCDevice {
  id: string;
  serialNumber?: string;
  message?: any;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  isCheckout?: boolean;
  recentCheckout?: boolean;
}