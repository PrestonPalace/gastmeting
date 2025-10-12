'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import NFCScanner from '../components/NFCScanner';
import GuestTypeSelector from '../components/GuestTypeSelector';
import GuestCountSelector from '../components/GuestCountSelector';
import CompletionScreen from '../components/CompletionScreen';
import { GuestType, GuestData } from '../types';
import { upsertLocalEntry, markLocalCheckout, hasActiveLocal } from '../lib/localStore';

type Step = 'scan' | 'type' | 'count' | 'complete';

export default function Home() {
  const [currentStep, setCurrentStep] = useState<Step>('scan');
  const [nfcId, setNfcId] = useState<string>('');
  const [guestType, setGuestType] = useState<GuestType | null>(null);
  const [adults, setAdults] = useState<number>(1);
  const [children, setChildren] = useState<number>(0);
  const [isExistingGuest, setIsExistingGuest] = useState<boolean>(false);
  const [warning, setWarning] = useState<string>('');

  const handleNFCScanned = (id: string, isCheckout: boolean = false) => {
    setNfcId(id);
    setIsExistingGuest(isCheckout);
    
    if (isCheckout) {
      // Handle checkout - this should complete immediately
      handleCheckout(id);
    } else {
      // New entry - proceed to type selection
      setCurrentStep('type');
    }
  };

  const handleCheckout = async (id: string) => {
    try {
      const response = await fetch('/api/guests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          action: 'checkout',
        }),
      });
      
      if (response.ok) {
        const res = await response.json();
        // Update local storage to mark checkout
        const endTime = res?.data?.endTime ?? new Date().toISOString();
        const duration = res?.data?.duration;
        markLocalCheckout(id, endTime, duration);
        // Verify server has active=false using forced check
        const verify = await fetch(`/api/guests/check/${encodeURIComponent(id)}?force=1`);
        const verifyJson = await verify.json();
        if (verifyJson?.isCheckout) {
          setWarning('Server still shows active after checkout. Please rescan or check connectivity.');
        }
        setCurrentStep('complete');
      }
    } catch (error) {
      console.error('Error during checkout:', error);
    }
  };

  const handleTypeSelected = (type: GuestType) => {
    setGuestType(type);
    setCurrentStep('count');
  };

  const handleCountSelected = async (adultCount: number, childrenCount: number) => {
    setAdults(adultCount);
    setChildren(childrenCount);

    // Submit the entry
    try {
      const guestData: Omit<GuestData, 'entryTime'> = {
        id: nfcId,
        type: guestType!,
        adults: adultCount,
        children: childrenCount,
      };

      const response = await fetch('/api/guests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...guestData,
          action: 'checkin',
        }),
      });

      if (response.ok) {
        const res = await response.json();
        // Optimistically add to local storage
        const entryTime = res?.data?.entryTime ?? new Date().toISOString();
        upsertLocalEntry({ ...guestData, entryTime });
        // Verify server acknowledges active using forced check
        const verify = await fetch(`/api/guests/check/${encodeURIComponent(nfcId)}?force=1`);
        const verifyJson = await verify.json();
        const serverActive = !!verifyJson?.isCheckout;
        const localActive = hasActiveLocal(nfcId);
        if (localActive && !serverActive) {
          setWarning('Gegevens lokaal opgeslagen maar niet bevestigd door server. Controleer internet en probeer opnieuw.');
        }
        setCurrentStep('complete');
      }
    } catch (error) {
      console.error('Error saving guest data:', error);
    }
  };

  const resetForm = () => {
    setCurrentStep('scan');
    setNfcId('');
    setGuestType(null);
    setAdults(1);
    setChildren(0);
    setIsExistingGuest(false);
    setWarning('');
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0
    })
  };

  const getStepDirection = (step: Step): number => {
    const steps: Step[] = ['scan', 'type', 'count', 'complete'];
    return steps.indexOf(step);
  };

  return (
    <main 
      className="min-h-screen flex items-center justify-center p-4" 
      style={{ 
        background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 50%, var(--secondary) 100%)'
      }}
    >
      <div className="w-full max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2">
            Riviera Zwembad – Gastregistratie
          </h1>
          <p className="text-white/80 text-lg">
            Voor medewerkers • Preston Palace Almelo
          </p>
        </motion.div>

        <div className="relative overflow-hidden rounded-2xl glass-effect min-h-[500px]">
          {warning && (
            <div className="absolute top-0 left-0 right-0 bg-yellow-500/80 text-black text-center p-2 z-10">
              {warning}
            </div>
          )}
          <AnimatePresence mode="wait" custom={getStepDirection(currentStep)}>
            {currentStep === 'scan' && (
              <motion.div
                key="scan"
                custom={getStepDirection(currentStep)}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: "spring", stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 }
                }}
              >
                <NFCScanner onNFCScanned={handleNFCScanned} />
              </motion.div>
            )}

            {currentStep === 'type' && (
              <motion.div
                key="type"
                custom={getStepDirection(currentStep)}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: "spring", stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 }
                }}
              >
                <GuestTypeSelector onTypeSelected={handleTypeSelected} />
              </motion.div>
            )}

            {currentStep === 'count' && (
              <motion.div
                key="count"
                custom={getStepDirection(currentStep)}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: "spring", stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 }
                }}
              >
                <GuestCountSelector
                  onCountSelected={handleCountSelected}
                  initialAdults={adults}
                  initialChildren={children}
                />
              </motion.div>
            )}

            {currentStep === 'complete' && (
              <motion.div
                key="complete"
                custom={getStepDirection(currentStep)}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: "spring", stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 }
                }}
              >
                <CompletionScreen
                  isCheckout={isExistingGuest}
                  onReset={resetForm}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}
