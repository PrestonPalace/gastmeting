import type { Scan, ScanRequest, CheckoutRequest } from '@/types/scan';

/**
 * API Service for managing scan data
 */
export class ScanService {
  private static readonly API_BASE = '/api/scans';

  /**
   * Get all scans
   */
  static async getAllScans(): Promise<Scan[]> {
    const response = await fetch(this.API_BASE);
    if (!response.ok) {
      throw new Error('Failed to fetch scans');
    }
    return response.json();
  }

  /**
   * Get a specific scan by ID
   */
  static async getScanById(id: string): Promise<Scan | null> {
    const response = await fetch(`${this.API_BASE}?id=${encodeURIComponent(id)}`);
    if (response.status === 404) {
      return null;
    }
    if (!response.ok) {
      throw new Error('Failed to fetch scan');
    }
    return response.json();
  }

  /**
   * Check if a scan is active (has no endTime)
   */
  static async checkActiveScan(id: string): Promise<{ isActive: boolean; scan?: Scan }> {
    try {
      const scan = await this.getScanById(id);
      if (scan && !scan.endTime) {
        return { isActive: true, scan };
      }
      return { isActive: false };
    } catch (error) {
      return { isActive: false };
    }
  }

  /**
   * Create a new scan (check-in)
   */
  static async createScan(data: ScanRequest): Promise<Scan> {
    const response = await fetch(this.API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create scan');
    }

    return response.json();
  }

  /**
   * Update scan with exit time (check-out)
   */
  static async checkoutScan(id: string): Promise<Scan> {
    const response = await fetch(this.API_BASE, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id } as CheckoutRequest),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to checkout scan');
    }

    return response.json();
  }
}
