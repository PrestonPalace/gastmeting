'use client';

import { useState } from 'react';
import { Scan } from 'lucide-react';
import { NFCReader } from '@/lib/nfc';

interface NFCScannerProps {
  onScanSuccess: (serialNumber: string) => void;
  onScanError?: (error: string) => void;
  currentId?: string;
  onContinue?: () => void;
}

export default function NFCScanner({ onScanSuccess, onScanError, currentId, onContinue }: NFCScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>('');

  const handleStartScan = async () => {
    console.log('Start Scan button clicked');
    setError('');
    setIsScanning(true);

    // Check support first
    if (!('NDEFReader' in window)) {
      const errorMsg = 'NFC wordt niet ondersteund op dit apparaat. Gebruik Chrome of Edge op Android.';
      setError(errorMsg);
      setIsScanning(false);
      if (onScanError) onScanError(errorMsg);
      return;
    }

    try {
      // Create NDEFReader - MUST use window.NDEFReader
      // @ts-ignore
      const ndef = new window.NDEFReader();
      console.log('NDEFReader created');

      // Set up event listeners BEFORE calling scan
      ndef.addEventListener('readingerror', () => {
        console.log('NFC read error');
        const errorMsg = 'Kan NFC tag niet lezen. Probeer opnieuw.';
        setError(errorMsg);
        setIsScanning(false);
        if (onScanError) onScanError(errorMsg);
      });

      ndef.addEventListener('reading', ({ message, serialNumber }: any) => {
        console.log('NFC tag read:', serialNumber);
        setIsScanning(false);
        onScanSuccess(serialNumber);
      });

      // CRITICAL: Call scan() DIRECTLY in the click handler
      // This is required for the permission prompt to work
      await ndef.scan();
      console.log('NFC scan started successfully - waiting for tag...');

    } catch (err: any) {
      console.error('NFC Error:', err);
      let errorMsg = 'NFC scannen mislukt.';
      
      if (err.name === 'NotAllowedError') {
        errorMsg = 'NFC toegang geweigerd. Geef toestemming in de browser en probeer opnieuw.';
      } else if (err.name === 'NotSupportedError') {
        errorMsg = 'NFC wordt niet ondersteund op dit apparaat.';
      } else if (err.message) {
        errorMsg = err.message;
      }
      
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

      {/* Show current ID and continue button if scanned */}
      {currentId && !isScanning && (
        <div className="mt-6 p-4 bg-green-900/30 border border-green-500 rounded-lg">
          <p className="text-green-200 mb-3">
            ✓ Tag gescand: <span className="font-mono font-bold">{currentId}</span>
          </p>
          <button
            onClick={onContinue}
            className="btn-primary w-full bg-green-600 hover:bg-green-700"
          >
            Doorgaan →
          </button>
        </div>
      )}
    </div>
  );
}
