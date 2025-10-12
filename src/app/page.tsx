'use client';

import { useState, useEffect } from 'react';
import NFCScanner from '@/components/NFCScanner';
import GuestTypeSelector from '@/components/GuestTypeSelector';
import VisitorCountForm from '@/components/VisitorCountForm';
import SuccessScreen from '@/components/SuccessScreen';
import { ScanService } from '@/lib/scanService';
import type { GuestType, Scan } from '@/types/scan';

type Step = 'scan' | 'guest-type' | 'visitor-count' | 'success';

export default function Home() {
  const [step, setStep] = useState<Step>('scan');
  const [nfcId, setNfcId] = useState<string>('');
  const [guestType, setGuestType] = useState<GuestType | null>(null);
  const [adults, setAdults] = useState(0);
  const [children, setChildren] = useState(0);
  const [error, setError] = useState<string>('');
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [activeScan, setActiveScan] = useState<Scan | null>(null);
  
  // Debugging state
  const [allScans, setAllScans] = useState<Scan[]>([]);
  const [showDebug, setShowDebug] = useState(false);

  // Load all scans for debugging
  useEffect(() => {
    loadScans();
  }, [step]); // Reload when step changes

  const loadScans = async () => {
    try {
      const scans = await ScanService.getAllScans();
      setAllScans(scans);
    } catch (err) {
      console.error('Failed to load scans:', err);
    }
  };

  const handleNFCScan = async (serialNumber: string) => {
    setNfcId(serialNumber);
    
    // Check if this is a checkout or check-in
    const { isActive, scan } = await ScanService.checkActiveScan(serialNumber);
    
    if (isActive && scan) {
      // Checkout flow - AUTOMATICALLY checkout
      setIsCheckingOut(true);
      setActiveScan(scan);
      await handleCheckout(serialNumber);
      setStep('success');
    } else {
      // Check-in flow - AUTOMATICALLY go to guest type selection
      setIsCheckingOut(false);
      setActiveScan(null);
      setStep('guest-type');
    }
  };

  const handleCheckout = async (id: string) => {
    try {
      await ScanService.checkoutScan(id);
      // Success screen will stay, NFC will reactivate after 3 seconds
    } catch (err: any) {
      setError(err.message || 'Fout bij uitchecken');
    }
  };

  const handleGuestTypeSelect = (type: GuestType) => {
    setGuestType(type);
    // Don't auto-advance
  };

  const handleSubmit = async () => {
    if (!nfcId || !guestType) {
      setError('Ontbrekende gegevens');
      return;
    }

    try {
      const newScan = await ScanService.createScan({
        id: nfcId,
        type: guestType,
        adults,
        children,
      });

      setActiveScan(newScan);
      setStep('success');
      // Don't auto-return
    } catch (err: any) {
      setError(err.message || 'Fout bij opslaan van gegevens');
    }
  };

  const resetFlow = () => {
    setStep('scan');
    setNfcId('');
    setGuestType(null);
    setAdults(0);
    setChildren(0);
    setError('');
    setIsCheckingOut(false);
    setActiveScan(null);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Riviera Zwembad</h1>
          <p className="text-xl text-[var(--secondary)]">Preston Palace Almelo</p>
        </div>

        {/* Debug Toggle */}
        <div className="mb-4 text-center">
          <button
            onClick={() => setShowDebug(!showDebug)}
            className="text-sm text-gray-400 hover:text-white underline"
          >
            {showDebug ? 'Verberg debug info' : 'Toon debug info'}
          </button>
        </div>

        {/* Debug Section */}
        {showDebug && (
          <div className="mb-6 p-4 bg-black/30 rounded-lg text-sm">
            <h3 className="font-bold mb-2 text-accent">🐛 Debug Informatie</h3>
            <div className="space-y-1">
              <p><span className="text-secondary">Huidige scan ID:</span> {nfcId || '(geen)'}</p>
              <p><span className="text-secondary">Totaal scans:</span> {allScans.length}</p>
              <p><span className="text-secondary">Actieve scans:</span> {allScans.filter(s => !s.endTime).length}</p>
              <div className="mt-2">
                <p className="text-secondary font-semibold">Opgeslagen IDs:</p>
                <div className="max-h-32 overflow-y-auto mt-1 space-y-1">
                  {allScans.length === 0 ? (
                    <p className="text-gray-400 italic">Nog geen scans</p>
                  ) : (
                    allScans.map((scan, idx) => (
                      <div key={idx} className="text-xs bg-white/5 p-2 rounded">
                        <span className={scan.endTime ? 'text-gray-400' : 'text-green-400'}>
                          {scan.id}
                        </span>
                        {' - '}
                        <span className="text-gray-300">
                          {scan.type} ({scan.adults}V + {scan.children}K)
                        </span>
                        {!scan.endTime && <span className="text-green-400 ml-2">● ACTIEF</span>}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Global Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-[var(--error)] rounded-lg text-white text-center">
            {error}
            <button
              onClick={() => setError('')}
              className="ml-4 underline"
            >
              Sluiten
            </button>
          </div>
        )}

        {/* Step: NFC Scan */}
        {step === 'scan' && (
          <NFCScanner 
            onScanSuccess={handleNFCScan}
            onScanError={setError}
          />
        )}

        {/* Step: Guest Type Selection */}
        {step === 'guest-type' && (
          <GuestTypeSelector
            onSelectType={handleGuestTypeSelect}
            selectedType={guestType}
            onBack={() => setStep('scan')}
            onContinue={() => guestType && setStep('visitor-count')}
          />
        )}

        {/* Step: Visitor Count */}
        {step === 'visitor-count' && (
          <VisitorCountForm
            adults={adults}
            children={children}
            onAdultsChange={setAdults}
            onChildrenChange={setChildren}
            onSubmit={handleSubmit}
            onBack={() => setStep('guest-type')}
          />
        )}

        {/* Step: Success */}
        {step === 'success' && (
          <SuccessScreen 
            isCheckout={isCheckingOut}
            activeScan={activeScan}
            onBack={() => resetFlow()}
            onScanReady={handleNFCScan}
          />
        )}
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }

        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
