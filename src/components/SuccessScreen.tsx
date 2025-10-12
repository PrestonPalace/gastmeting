'use client';

import { useEffect, useRef, useState } from 'react';
import { CheckCircle, Users, Clock, User, Radio } from 'lucide-react';
import type { Scan } from '@/types/scan';

interface SuccessScreenProps {
  isCheckout: boolean;
  activeScan: Scan | null;
  onBack: () => void;
}

export default function SuccessScreen({ isCheckout, activeScan, onBack }: SuccessScreenProps) {
  const [autoReturnCountdown, setAutoReturnCountdown] = useState(5);
  const [shouldAutoReturn, setShouldAutoReturn] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastScanTimeRef = useRef(Date.now());

  // Reset timer when component mounts or when a new scan happens
  useEffect(() => {
    lastScanTimeRef.current = Date.now();
    setAutoReturnCountdown(5);
    setShouldAutoReturn(true);
  }, [activeScan?.id]);

  // Auto-return countdown (only if not manually navigated back)
  useEffect(() => {
    if (!shouldAutoReturn) return;

    timerRef.current = setInterval(() => {
      setAutoReturnCountdown((prev) => {
        if (prev <= 1) {
          onBack();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [shouldAutoReturn, onBack]);

  const handleManualBack = () => {
    setShouldAutoReturn(false); // Stop auto-return
    if (timerRef.current) clearInterval(timerRef.current);
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
        <div className="inline-flex items-center justify-center w-32 h-32 bg-[var(--success)] rounded-full mb-6">
          <CheckCircle className="w-16 h-16 text-white" />
        </div>
        
        <h2 className="text-3xl font-bold mb-4">
          {isCheckout ? 'Uitgecheckt!' : 'Ingecheckt!'}
        </h2>
        <p className="text-lg text-white/80 mb-4">
          {isCheckout 
            ? 'De gast is succesvol uitgecheckt'
            : 'De gegevens zijn succesvol opgeslagen'}
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
                <p className="font-mono text-sm">{activeScan.id}</p>
              </div>
            </div>
          </div>
        )}

        <p className="text-sm text-white/60 mb-4">
          Automatisch terug in {autoReturnCountdown} seconden...
        </p>

        {/* Manual Back Button */}
        <button
          onClick={handleManualBack}
          className="btn-secondary w-full"
        >
          Terug naar scan
        </button>
      </div>
    </div>
  );
}
