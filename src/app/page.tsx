'use client';

import { useState, useEffect } from 'react';
import NFCScanner from '@/components/NFCScanner';
import GuestTypeSelector from '@/components/GuestTypeSelector';
import VisitorCountForm from '@/components/VisitorCountForm';
import SuccessScreen from '@/components/SuccessScreen';
import SyncStatusBar from '@/components/SyncStatusBar';
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
  const [isProcessing, setIsProcessing] = useState(false); // Prevent double scans
  const [interactionLocked, setInteractionLocked] = useState(false); // Prevent actions during 3-second delay
  
  // Debugging state
  const [allScans, setAllScans] = useState<Scan[]>([]);
  const [showDebug, setShowDebug] = useState(false);

  // Initialize offline support
  useEffect(() => {
    ScanService.init().catch(err => {
      console.error('Failed to initialize ScanService:', err);
    });
  }, []);

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
    // Block if interaction is locked (3-second delay)
    if (interactionLocked) {
      console.log('Scan blocked - interaction locked (3-second delay)');
      return;
    }
    
    // Prevent processing if already processing or not on scan/success step
    if (isProcessing) {
      console.log('Already processing a scan, ignoring...');
      return;
    }

    // Only allow scans from scan page or success page
    if (step !== 'scan' && step !== 'success') {
      console.log('Scan blocked - currently on step:', step);
      return;
    }

    setIsProcessing(true);
    
    // Reset previous data when scanning new tag
    if (step === 'success') {
      // Coming from success screen - reset everything for new scan
      setGuestType(null);
      setAdults(0);
      setChildren(0);
      setError('');
    }
    
    setNfcId(serialNumber);
    
    try {
      // Check if this is a checkout or check-in
      const { isActive, scan } = await ScanService.checkActiveScan(serialNumber);
      
      if (isActive && scan) {
        // Checkout flow - AUTOMATICALLY checkout
        setIsCheckingOut(true);
        setActiveScan(scan);
        await handleCheckout(serialNumber);
        // Lock interactions for 3 seconds
        setInteractionLocked(true);
        setTimeout(() => {
          console.log('Interaction lock released');
          setInteractionLocked(false);
        }, 3000);
        setStep('success');
      } else {
        // Check-in flow - AUTOMATICALLY go to guest type selection
        setIsCheckingOut(false);
        setActiveScan(null);
        // ALWAYS reset visitor counts for new check-in
        setAdults(0);
        setChildren(0);
        setStep('guest-type');
      }
    } catch (err: any) {
      setError(err.message || 'Fout bij scannen');
      setStep('scan');
    } finally {
      setIsProcessing(false);
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
    setIsProcessing(false);
    setInteractionLocked(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      {/* Sync Status Bar */}
      <SyncStatusBar />
      
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
              <p><span className="text-secondary">Totaal sessies:</span> {allScans.length}</p>
              <p><span className="text-secondary">Actieve sessies:</span> {allScans.filter(s => !s.endTime).length}</p>
              
              {/* Check for duplicate active sessions per tag */}
              {(() => {
                const activeByTag = allScans
                  .filter(s => !s.endTime)
                  .reduce((acc, scan) => {
                    if (!acc[scan.tagId]) acc[scan.tagId] = [];
                    acc[scan.tagId].push(scan);
                    return acc;
                  }, {} as Record<string, Scan[]>);
                
                const duplicates = Object.entries(activeByTag).filter(([_, scans]) => scans.length > 1);
                
                return duplicates.length > 0 && (
                  <div className="mt-2 p-2 bg-red-500/20 border border-red-500 rounded">
                    <p className="text-red-400 font-bold">⚠️ WAARSCHUWING: Meerdere actieve sessies gedetecteerd!</p>
                    {duplicates.map(([tagId, scans]) => (
                      <div key={tagId} className="mt-1 text-xs">
                        <span className="text-red-300">Tag {tagId}: {scans.length} actieve sessies</span>
                        {scans.map(s => (
                          <div key={s.id} className="ml-4 text-white/60">- Session: {s.id}</div>
                        ))}
                      </div>
                    ))}
                  </div>
                );
              })()}
              
              <div className="mt-2">
                <p className="text-secondary font-semibold">Sessies per Tag ID:</p>
                <div className="max-h-40 overflow-y-auto mt-1 space-y-2">
                  {allScans.length === 0 ? (
                    <p className="text-gray-400 italic">Nog geen scans</p>
                  ) : (
                    (() => {
                      // Group by tagId
                      const grouped = allScans.reduce((acc, scan) => {
                        if (!acc[scan.tagId]) acc[scan.tagId] = [];
                        acc[scan.tagId].push(scan);
                        return acc;
                      }, {} as Record<string, Scan[]>);
                      
                      return Object.entries(grouped).map(([tagId, scans]) => {
                        const activeCount = scans.filter(s => !s.endTime).length;
                        const hasMultipleActive = activeCount > 1;
                        
                        return (
                          <div key={tagId} className={`text-xs p-2 rounded ${hasMultipleActive ? 'bg-red-500/20 border border-red-500' : 'bg-white/5'}`}>
                            <div className="font-semibold">
                              <span className={activeCount > 0 ? 'text-green-400' : 'text-gray-400'}>
                                Tag: {tagId}
                              </span>
                              <span className="text-white/60 ml-2">
                                ({scans.length} sessie{scans.length !== 1 ? 's' : ''})
                              </span>
                              {activeCount > 0 && (
                                <span className={`ml-2 ${hasMultipleActive ? 'text-red-400 font-bold' : 'text-green-400'}`}>
                                  ● {activeCount} ACTIEF
                                </span>
                              )}
                            </div>
                            <div className="ml-2 mt-1 space-y-1">
                              {scans
                                .sort((a, b) => new Date(b.entryTime).getTime() - new Date(a.entryTime).getTime())
                                .map((scan, idx) => (
                                  <div key={scan.id} className={scan.endTime ? 'text-gray-500' : hasMultipleActive ? 'text-red-300' : 'text-white/80'}>
                                    {idx + 1}. {scan.type} ({scan.adults}V + {scan.children}K)
                                    {!scan.endTime ? ' [ACTIEF]' : ` [${new Date(scan.endTime).toLocaleTimeString('nl-NL')}]`}
                                    <div className="text-white/30 text-xs ml-2">
                                      {scan.id.substring(0, 30)}...
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>
                        );
                      });
                    })()
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
            interactionLocked={interactionLocked}
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
