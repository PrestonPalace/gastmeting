/**
 * NFC Library - Web NFC API Wrapper
 * Based on Google Chrome Web NFC samples
 * https://googlechrome.github.io/samples/web-nfc/
 */

export interface NFCReadResult {
  serialNumber: string;
  message?: any;
}

export type NFCErrorCallback = (error: string) => void;
export type NFCReadCallback = (result: NFCReadResult) => void;

declare global {
  interface Window {
    NDEFReader?: any;
  }
}

export class NFCReader {
  private ndef: any = null;
  private isScanning: boolean = false;

  /**
   * Check if Web NFC is supported on this device/browser
   */
  static isSupported(): boolean {
    return 'NDEFReader' in window;
  }

  /**
   * Start scanning for NFC tags
   * Based on Google Chrome sample implementation
   */
  async startScan(
    onRead: NFCReadCallback,
    onError: NFCErrorCallback
  ): Promise<void> {
    if (!NFCReader.isSupported()) {
      throw new Error('Web NFC is not supported on this device/browser');
    }

    if (this.isScanning) {
      throw new Error('Already scanning');
    }

    try {
      // Create NDEFReader instance
      this.ndef = new window.NDEFReader();

      // Set up error handler before scanning
      this.ndef.addEventListener('readingerror', () => {
        onError('Cannot read data from the NFC tag. Try another one?');
      });

      // Set up read handler before scanning
      this.ndef.addEventListener('reading', ({ message, serialNumber }: any) => {
        console.log('NFC tag detected:', serialNumber);
        onRead({
          serialNumber,
          message
        });
      });

      // Start scanning - this triggers permission prompt
      await this.ndef.scan();
      this.isScanning = true;
      console.log('NFC scan started successfully');

    } catch (error: any) {
      this.isScanning = false;
      
      // Handle specific error types
      if (error.name === 'NotAllowedError') {
        throw new Error('NFC toegang geweigerd. Geef toestemming en probeer opnieuw.');
      } else if (error.name === 'NotSupportedError') {
        throw new Error('NFC wordt niet ondersteund op dit apparaat.');
      } else {
        throw new Error(error.message || 'NFC scannen mislukt. Controleer of NFC is ingeschakeld.');
      }
    }
  }

  /**
   * Stop scanning for NFC tags
   */
  stopScan(): void {
    if (this.ndef && this.isScanning) {
      // Remove event listeners if needed
      this.isScanning = false;
      this.ndef = null;
    }
  }

  /**
   * Check if currently scanning
   */
  getIsScanning(): boolean {
    return this.isScanning;
  }
}

/**
 * Helper function to create a new NFC reader instance
 */
export function createNFCReader(): NFCReader {
  return new NFCReader();
}
