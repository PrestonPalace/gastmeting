'use client';

import { useEffect, useRef, useState } from 'react';
import { CheckCircle, Users, Clock, User, Radio, Scan as ScanIcon } from 'lucide-react';
import type { Scan } from '@/types/scan';

interface SuccessScreenProps {
  isCheckout: boolean;
  activeScan: Scan | null;
  onBack: () => void;
  onScanReady?: (serialNumber: string) => void;
  interactionLocked?: boolean;
}

export default function SuccessScreen({ 
  isCheckout, 
  activeScan, 
  onBack,
  onScanReady,
  interactionLocked = false
}: SuccessScreenProps) {
  const [nfcReady, setNfcReady] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const ndefReaderRef = useRef<any>(null);

  // Activate NFC after 3 seconds
  useEffect(() => {
    // Reset state when component mounts with new scan
    setNfcReady(false);
    setIsScanning(false);
    
    // Clear any existing reader
    if (ndefReaderRef.current) {
      ndefReaderRef.current = null;
    }

    // Wait 3 seconds before enabling NFC
    timerRef.current = setTimeout(() => {
      console.log('3 seconds passed - activating NFC scanner');
      setNfcReady(true);
      // Start scanning only after setting ready state
      if (onScanReady) {
        startNFCScanning();
      }
    }, 3000);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      // Cleanup NFC reader on unmount
      if (ndefReaderRef.current) {
        try {
          // Stop scanning if possible
          ndefReaderRef.current = null;
        } catch (err) {
          console.error('Error cleaning up NFC reader:', err);
        }
      }
      setNfcReady(false);
      setIsScanning(false);
    };
  }, [activeScan?.id]);

  const startNFCScanning = async () => {
    if (!('NDEFReader' in window)) {
      return; // NFC not supported
    }

    // Double-check we're ready and not locked
    if (!nfcReady || interactionLocked) {
      console.log('NFC scanning prevented - not ready or locked');
      return;
    }

    setIsScanning(true);

    try {
      // @ts-ignore
      const ndef = new window.NDEFReader();
      ndefReaderRef.current = ndef;

      ndef.addEventListener('reading', ({ serialNumber }: any) => {
        console.log('Background NFC scan:', serialNumber);
        
        // Only process if we're still ready and scanning
        if (nfcReady && isScanning && onScanReady) {
          setIsScanning(false);
          setNfcReady(false); // Disable immediately to prevent double scans
          onScanReady(serialNumber);
        }
      });

      ndef.addEventListener('readingerror', () => {
        console.error('Background NFC read error');
        setIsScanning(false);
      });

      await ndef.scan();
      console.log('Background NFC scanning active');
    } catch (err) {
      console.error('Background NFC scan failed:', err);
      setIsScanning(false);
      setNfcReady(false);
    }
  };

  const handleManualBack = () => {
    // Stop everything
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    // Disable NFC scanning
    setNfcReady(false);
    setIsScanning(false);
    
    // Clear reader reference
    if (ndefReaderRef.current) {
      ndefReaderRef.current = null;
    }
    
    onBack();
  };

  // Format guest type in Dutch
  const getGuestTypeLabel = (type: string) => {
    switch (type) {
      case 'hotelgast': return 'Hotelgast';
      case 'daggast': return 'Daggast';
      case 'zwembadgast': return 'Zwembadgast';
      default: return type;
    }
  };

  // Format date/time
  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' });
  };

  // Calculate duration
  const getDuration = (start: string, end?: string | null) => {
    const startTime = new Date(start).getTime();
    const endTime = end ? new Date(end).getTime() : Date.now();
    const durationMs = endTime - startTime;
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}u ${minutes}m`;
  };

  return (
    <div className="card text-center animate-fade-in">
      <div className="mb-6">
        <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full mb-6 ${
          isCheckout ? 'bg-red-600' : 'bg-green-600'
        }`}>
          <CheckCircle className="w-16 h-16 text-white" />
        </div>
        
        <h2 className={`text-3xl font-bold mb-4 ${
          isCheckout ? 'text-red-400' : 'text-green-400'
        }`}>
          {isCheckout ? '🚪 Uitgecheckt!' : '✅ Ingecheckt!'}
        </h2>
        <p className="text-lg text-white/80 mb-4">
          {isCheckout 
            ? 'De gast heeft het zwembad verlaten'
            : 'De gast is succesvol ingecheckt'}
        </p>

        {activeScan && (
          <div className="bg-white/10 rounded-lg p-6 mb-4 text-left">
            <h3 className="font-bold text-lg mb-4 text-[var(--accent)]">Scan Informatie</h3>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[var(--secondary)] rounded-full flex items-center justify-center">
                  {activeScan.type === 'hotelgast' && <Users className="w-5 h-5" />}
                  {activeScan.type === 'daggast' && <User className="w-5 h-5" />}
                  {activeScan.type === 'zwembadgast' && <Radio className="w-5 h-5" />}
                </div>
                <div>
                  <p className="text-sm text-white/60">Type</p>
                  <p className="font-semibold">{getGuestTypeLabel(activeScan.type)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[var(--secondary)] rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-white/60">Aantal personen</p>
                  <p className="font-semibold">
                    {activeScan.adults} Volwassene{activeScan.adults !== 1 ? 'n' : ''} + {' '}
                    {activeScan.children} Kind{activeScan.children !== 1 ? 'eren' : ''}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[var(--secondary)] rounded-full flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-white/60">Ingecheckt om</p>
                  <p className="font-semibold">
                    {formatTime(activeScan.entryTime)} - {formatDate(activeScan.entryTime)}
                  </p>
                </div>
              </div>

              {isCheckout && activeScan.endTime && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[var(--accent)] rounded-full flex items-center justify-center">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm text-white/60">Totale duur</p>
                    <p className="font-semibold">{getDuration(activeScan.entryTime, activeScan.endTime)}</p>
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-white/20">
                <p className="text-sm text-white/60">Tag ID</p>
                <p className="font-mono text-sm">{activeScan.tagId}</p>
              </div>
              
              <div className="pt-2">
                <p className="text-xs text-white/40">Session ID</p>
                <p className="font-mono text-xs text-white/60">{activeScan.id}</p>
              </div>
            </div>
          </div>
        )}

        {/* NFC Ready Indicator */}
        {nfcReady && !interactionLocked && (
          <div className="mb-4 p-4 bg-green-900/30 border-2 border-green-500 rounded-lg">
            <div className="flex items-center justify-center gap-3">
              <div className="relative">
                <ScanIcon className="w-6 h-6 text-green-400" />
                {isScanning && (
                  <div className="absolute inset-0 rounded-full border-2 border-green-400/30 border-t-green-400 animate-spin"></div>
                )}
              </div>
              <p className="text-green-200 font-semibold">
                {isScanning ? 'Klaar voor volgende scan...' : 'Scan opnieuw actief'}
              </p>
            </div>
          </div>
        )}

        {(!nfcReady || interactionLocked) && (
          <p className="text-sm text-white/60 mb-4">
            {interactionLocked ? '⏳ Wacht 3 seconden...' : 'Scanner wordt actief in 3 seconden...'}
          </p>
        )}

        {/* Manual Back Button */}
        <button
          onClick={handleManualBack}
          disabled={interactionLocked}
          className={`w-full ${
            interactionLocked 
              ? 'btn bg-gray-600 cursor-not-allowed opacity-50' 
              : 'btn-secondary'
          }`}
        >
          {interactionLocked ? '⏳ Even wachten... (3s)' : 'Terug naar scan'}
        </button>
        
        {interactionLocked && (
          <p className="text-sm text-yellow-400 mt-3">
            Je kunt over een paar seconden verder...
          </p>
        )}
      </div>
    </div>
  );
}
