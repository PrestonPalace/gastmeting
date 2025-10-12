'use client';

import { useState } from 'react';
import NFCScanner from '@/components/NFCScanner';
import GuestTypeSelector from '@/components/GuestTypeSelector';
import VisitorCountForm from '@/components/VisitorCountForm';
import SuccessScreen from '@/components/SuccessScreen';
import { ScanService } from '@/lib/scanService';
import type { GuestType } from '@/types/scan';

type Step = 'scan' | 'guest-type' | 'visitor-count' | 'success';

export default function Home() {
  const [step, setStep] = useState<Step>('scan');
  const [nfcId, setNfcId] = useState<string>('');
  const [guestType, setGuestType] = useState<GuestType | null>(null);
  const [adults, setAdults] = useState(0);
  const [children, setChildren] = useState(0);
  const [error, setError] = useState<string>('');
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const handleNFCScan = async (serialNumber: string) => {
    setNfcId(serialNumber);
    
    // Check if this is a checkout or check-in
    const { isActive } = await ScanService.checkActiveScan(serialNumber);
    
    if (isActive) {
      // Checkout flow
      setIsCheckingOut(true);
      await handleCheckout(serialNumber);
    } else {
      // Check-in flow
      setIsCheckingOut(false);
      setStep('guest-type');
    }
  };

  const handleCheckout = async (id: string) => {
    try {
      await ScanService.checkoutScan(id);
      setStep('success');
      setTimeout(() => resetFlow(), 3000);
    } catch (err: any) {
      setError(err.message || 'Fout bij uitchecken');
      setTimeout(() => resetFlow(), 3000);
    }
  };

  const handleGuestTypeSelect = (type: GuestType) => {
    setGuestType(type);
    setStep('visitor-count');
  };

  const handleSubmit = async () => {
    if (!nfcId || !guestType) {
      setError('Ontbrekende gegevens');
      return;
    }

    try {
      await ScanService.createScan({
        id: nfcId,
        type: guestType,
        adults,
        children,
      });

      setStep('success');
      setTimeout(() => resetFlow(), 3000);
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
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Riviera Zwembad</h1>
          <p className="text-xl text-[var(--secondary)]">Preston Palace Almelo</p>
        </div>

        {/* Global Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-[var(--error)] rounded-lg text-white text-center">
            {error}
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
            onBack={() => setStep('scan')}
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
          <SuccessScreen isCheckout={isCheckingOut} />
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
