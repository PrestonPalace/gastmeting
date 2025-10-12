'use client';

import { useState, useEffect } from 'react';
import { Scan, Users, User, Baby, CheckCircle, ArrowLeft, Radio } from 'lucide-react';

type GuestType = 'hotelgast' | 'daggast' | 'zwembadgast' | null;
type Step = 'scan' | 'check-status' | 'guest-type' | 'visitor-count' | 'success';

export default function Home() {
  const [step, setStep] = useState<Step>('scan');
  const [nfcId, setNfcId] = useState<string>('');
  const [guestType, setGuestType] = useState<GuestType>(null);
  const [adults, setAdults] = useState(0);
  const [children, setChildren] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>('');
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  useEffect(() => {
    // Check if Web NFC is supported
    if ('NDEFReader' in window) {
      console.log('Web NFC is supported');
    } else {
      console.warn('Web NFC is not supported on this device/browser');
    }
  }, []);

  const startNfcScan = async () => {
    setError('');
    setIsScanning(true);

    try {

      // @ts-ignore - NDEFReader is not in TypeScript definitions yet
      const ndef = new window.NDEFReader();
      
      // Set up event listeners BEFORE calling scan
      ndef.addEventListener('readingerror', () => {
        setError('Fout bij het lezen van de armband. Probeer het opnieuw.');
        setIsScanning(false);
      });

      ndef.addEventListener('reading', ({ serialNumber }: any) => {
        console.log('NFC tag detected:', serialNumber);
        setNfcId(serialNumber);
        setIsScanning(false);
        setStep('check-status');
        checkScanStatus(serialNumber);
      });

      // Now call scan - this will trigger the permission prompt
      await ndef.scan();
      console.log('NFC scan started successfully');
      
    } catch (error: any) {
      console.error('NFC Error:', error);
      
      // Handle specific error cases
      if (error.name === 'NotAllowedError') {
        setError('NFC toegang geweigerd. Geef toestemming in de browser en probeer opnieuw.');
      } else if (error.name === 'NotSupportedError') {
        setError('NFC wordt niet ondersteund op dit apparaat.');
      } else {
        setError('NFC scannen mislukt. Zorg dat NFC is ingeschakeld in de apparaat instellingen en probeer opnieuw.');
      }
      
      setIsScanning(false);
    }
  };

  const checkScanStatus = async (id: string) => {
    try {
      const response = await fetch(`/api/scans?id=${encodeURIComponent(id)}`);
      
      if (response.ok) {
        const scan = await response.json();
        if (scan && !scan.endTime) {
          // Active scan exists, this is checkout
          setIsCheckingOut(true);
          await handleCheckout(id);
        } else {
          // No active scan, proceed to check-in
          setIsCheckingOut(false);
          setStep('guest-type');
        }
      } else {
        // No active scan found, proceed to check-in
        setIsCheckingOut(false);
        setStep('guest-type');
      }
    } catch (err) {
      console.error('Error checking scan status:', err);
      // On error, assume check-in
      setIsCheckingOut(false);
      setStep('guest-type');
    }
  };

  const handleCheckout = async (id: string) => {
    try {
      const response = await fetch('/api/scans', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (response.ok) {
        setStep('success');
        setTimeout(() => resetFlow(), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Fout bij uitchecken');
        setTimeout(() => resetFlow(), 3000);
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError('Fout bij uitchecken');
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
      const response = await fetch('/api/scans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: nfcId,
          type: guestType,
          adults,
          children,
        }),
      });

      if (response.ok) {
        setStep('success');
        setTimeout(() => resetFlow(), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Fout bij opslaan');
      }
    } catch (err) {
      console.error('Submit error:', err);
      setError('Fout bij opslaan van gegevens');
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

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-[var(--error)] rounded-lg text-white">
            <p className="font-semibold text-center mb-2">{error}</p>
            {(error.includes('ingeschakeld') || error.includes('mislukt')) && (
              <div className="text-sm mt-3 p-3 bg-white/10 rounded">
                <p className="font-semibold mb-2">Controleer de volgende stappen:</p>
                <ol className="list-decimal list-inside space-y-1 text-left">
                  <li>Open de Instellingen van uw apparaat</li>
                  <li>Zoek naar "NFC" of "Verbonden apparaten"</li>
                  <li>Schakel NFC in</li>
                  <li>Kom terug naar deze app en probeer opnieuw</li>
                </ol>
              </div>
            )}
            {error.includes('toegang geweigerd') && (
              <div className="text-sm mt-3 p-3 bg-white/10 rounded">
                <p className="text-left">Druk opnieuw op "Start Scan" en geef toestemming wanneer de browser hierom vraagt.</p>
              </div>
            )}
          </div>
        )}

        {/* Step: NFC Scan */}
        {step === 'scan' && (
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
            <button
              onClick={startNfcScan}
              disabled={isScanning}
              className="btn-primary w-full text-xl disabled:opacity-50"
            >
              {isScanning ? 'Scannen...' : 'Start Scan'}
            </button>
          </div>
        )}

        {/* Step: Guest Type Selection */}
        {step === 'guest-type' && (
          <div className="card animate-slide-in">
            <button
              onClick={() => setStep('scan')}
              className="btn-back mb-6 flex items-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Terug
            </button>
            <h2 className="text-3xl font-bold mb-8 text-center">
              Wat voor type gast is dit?
            </h2>
            <div className="space-y-4">
              <button
                onClick={() => handleGuestTypeSelect('hotelgast')}
                className="guest-type-btn w-full flex items-center justify-center gap-3"
              >
                <Users className="w-6 h-6" />
                <span className="text-xl">Hotelgast</span>
              </button>
              <button
                onClick={() => handleGuestTypeSelect('daggast')}
                className="guest-type-btn w-full flex items-center justify-center gap-3"
              >
                <User className="w-6 h-6" />
                <span className="text-xl">Daggast</span>
              </button>
              <button
                onClick={() => handleGuestTypeSelect('zwembadgast')}
                className="guest-type-btn w-full flex items-center justify-center gap-3"
              >
                <Radio className="w-6 h-6" />
                <span className="text-xl">Zwembadgast</span>
              </button>
            </div>
          </div>
        )}

        {/* Step: Visitor Count */}
        {step === 'visitor-count' && (
          <div className="card animate-slide-in">
            <button
              onClick={() => setStep('guest-type')}
              className="btn-back mb-6 flex items-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Terug
            </button>
            <h2 className="text-3xl font-bold mb-8 text-center">
              Wie zijn er?
            </h2>
            
            {/* Adults Counter */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <User className="w-8 h-8 text-[var(--secondary)]" />
                  <span className="text-2xl font-semibold">Volwassenen</span>
                </div>
                <span className="text-3xl font-bold text-[var(--accent)]">{adults}</span>
              </div>
              <div className="flex items-center justify-center gap-6">
                <button
                  onClick={() => setAdults(Math.max(0, adults - 1))}
                  className="counter-btn"
                  disabled={adults === 0}
                >
                  -
                </button>
                <span className="text-4xl font-bold w-20 text-center">{adults}</span>
                <button
                  onClick={() => setAdults(adults + 1)}
                  className="counter-btn"
                >
                  +
                </button>
              </div>
            </div>

            {/* Children Counter */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Baby className="w-8 h-8 text-[var(--secondary)]" />
                  <span className="text-2xl font-semibold">Kinderen</span>
                </div>
                <span className="text-3xl font-bold text-[var(--accent)]">{children}</span>
              </div>
              <div className="flex items-center justify-center gap-6">
                <button
                  onClick={() => setChildren(Math.max(0, children - 1))}
                  className="counter-btn"
                  disabled={children === 0}
                >
                  -
                </button>
                <span className="text-4xl font-bold w-20 text-center">{children}</span>
                <button
                  onClick={() => setChildren(children + 1)}
                  className="counter-btn"
                >
                  +
                </button>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={adults === 0 && children === 0}
              className="btn-primary w-full text-xl disabled:opacity-50"
            >
              Bevestigen
            </button>
          </div>
        )}

        {/* Step: Success */}
        {step === 'success' && (
          <div className="card text-center animate-fade-in">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-32 h-32 bg-[var(--success)] rounded-full mb-6">
                <CheckCircle className="w-16 h-16 text-white" />
              </div>
              <h2 className="text-3xl font-bold mb-4">
                {isCheckingOut ? 'Uitgecheckt!' : 'Ingecheckt!'}
              </h2>
              <p className="text-lg text-white/80">
                {isCheckingOut 
                  ? 'De gast is succesvol uitgecheckt'
                  : 'De gegevens zijn succesvol opgeslagen'}
              </p>
            </div>
          </div>
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

