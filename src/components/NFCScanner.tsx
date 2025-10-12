'use client';

import { useState } from 'react';
import { Scan } from 'lucide-react';
import { NFCReader } from '@/lib/nfc';

interface NFCScannerProps {
  onScanSuccess: (serialNumber: string) => void;
  onScanError?: (error: string) => void;
}

export default function NFCScanner({ onScanSuccess, onScanError }: NFCScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>('');

  const handleStartScan = async () => {
    setError('');
    setIsScanning(true);

    // Check support first
    if (!NFCReader.isSupported()) {
      const errorMsg = 'NFC wordt niet ondersteund op dit apparaat. Gebruik Chrome of Edge op Android.';
      setError(errorMsg);
      setIsScanning(false);
      if (onScanError) onScanError(errorMsg);
      return;
    }

    const reader = new NFCReader();

    try {
      await reader.startScan(
        // On successful read
        (result) => {
          console.log('NFC tag read:', result.serialNumber);
          setIsScanning(false);
          onScanSuccess(result.serialNumber);
        },
        // On read error
        (errorMessage) => {
          setError(errorMessage);
          setIsScanning(false);
          if (onScanError) onScanError(errorMessage);
        }
      );
    } catch (err: any) {
      const errorMsg = err.message || 'NFC scannen mislukt. Probeer opnieuw.';
      setError(errorMsg);
      setIsScanning(false);
      if (onScanError) onScanError(errorMsg);
    }
  };

  return (
    <div className="card text-center animate-fade-in">
      <div className="mb-8">
        <div className="inline-flex items-center justify-center w-32 h-32 bg-[var(--secondary)] rounded-full mb-6 relative">
          <Scan className="w-16 h-16 text-white" />
          {isScanning && (
            <div className="absolute inset-0 rounded-full border-4 border-white/30 border-t-white animate-spin"></div>
          )}
        </div>
        <h2 className="text-3xl font-bold mb-4">
          {isScanning ? 'Scanning...' : 'Scan NFC Armband'}
        </h2>
        <p className="text-lg text-white/80 mb-2">
          {isScanning 
            ? 'Houd de armband tegen de scanner'
            : 'Druk op de knop om te beginnen'}
        </p>
        {!isScanning && (
          <p className="text-sm text-white/60">
            Zorg dat NFC is ingeschakeld op dit apparaat
          </p>
        )}
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-[var(--error)] rounded-lg text-white text-sm">
          <p className="font-semibold mb-2">{error}</p>
          {(error.includes('ingeschakeld') || error.includes('mislukt')) && (
            <div className="mt-3 p-3 bg-white/10 rounded text-left">
              <p className="font-semibold mb-2">Controleer:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Open Instellingen</li>
                <li>Zoek naar "NFC"</li>
                <li>Schakel NFC in</li>
                <li>Probeer opnieuw</li>
              </ol>
            </div>
          )}
        </div>
      )}

      <button
        onClick={handleStartScan}
        disabled={isScanning}
        className="btn-primary w-full text-xl disabled:opacity-50"
      >
        {isScanning ? 'Scannen...' : 'Start Scan'}
      </button>
    </div>
  );
}
