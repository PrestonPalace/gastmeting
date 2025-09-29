'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RssIcon } from '@heroicons/react/24/outline';

interface NFCScannerProps {
  onNFCScanned: (id: string, isCheckout?: boolean) => void;
}

declare global {
  interface Window {
    NDEFReader?: any;
  }
}

export default function NFCScanner({ onNFCScanned }: NFCScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>('');
  const [nfcSupported, setNfcSupported] = useState<boolean>(true);

  useEffect(() => {
    // Check if NFC is supported
    if (!('NDEFReader' in window)) {
      setNfcSupported(false);
      setError('NFC wordt niet ondersteund op dit apparaat');
    }
  }, []);

  const startScanning = async () => {
    if (!nfcSupported) return;

    try {
      setIsScanning(true);
      setError('');

      if ('NDEFReader' in window) {
        const ndef = new window.NDEFReader();
        await ndef.scan();

        ndef.addEventListener('readingerror', () => {
          setError('Kan NFC tag niet lezen. Probeer opnieuw.');
          setIsScanning(false);
        });

        ndef.addEventListener('reading', ({ message, serialNumber }: any) => {
          setIsScanning(false);
          
          // Use the serial number as the ID
          const id = serialNumber || 'unknown';
          
          // Check if this is an existing guest (checkout)
          checkExistingGuest(id);
        });
      }
    } catch (error) {
      console.error('NFC Error:', error);
      setError('NFC scannen mislukt. Probeer opnieuw.');
      setIsScanning(false);
    }
  };

  const checkExistingGuest = async (id: string) => {
    try {
      // Check if guest already exists and needs checkout
      const response = await fetch(`/api/guests/check/${encodeURIComponent(id)}`);
      const data = await response.json();
      
      onNFCScanned(id, data.isCheckout);
    } catch (error) {
      console.error('Error checking guest:', error);
      // Default to check-in if check fails
      onNFCScanned(id, false);
    }
  };

  const simulateNFCScan = () => {
    // For testing purposes - simulate scanning the test ID
    const testId = '04:a8:52:ca:70:1d:90';
    checkExistingGuest(testId);
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center min-h-[500px]">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h2 className="text-3xl font-bold mb-2 text-white">
          Scan polsbandje
        </h2>
        <p className="text-white/80 text-lg mb-8">
          Houd het polsbandje bij de NFC-lezer om te starten
        </p>
      </motion.div>

      {/* NFC Scanner Circle */}
      <motion.div
        className={`relative w-64 h-64 rounded-full border-4 border-dashed flex items-center justify-center cursor-pointer mb-8 ${
          isScanning ? 'nfc-scanner' : 'hover:border-secondary-light'
        } ${!nfcSupported ? 'opacity-50 cursor-not-allowed' : ''}`}
        style={{
          borderColor: isScanning ? 'var(--secondary-light)' : 'var(--secondary)'
        }}
        onClick={nfcSupported ? startScanning : undefined}
        whileHover={nfcSupported ? { scale: 1.05 } : {}}
        whileTap={nfcSupported ? { scale: 0.95 } : {}}
      >
        {/* Scanner Icon */}
        <motion.div
          className="w-32 h-32 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'var(--secondary)' }}
          animate={isScanning ? { 
            scale: [1, 1.1, 1],
            backgroundColor: ['#49C5B1', '#5fd9c5', '#49C5B1']
          } : {}}
          transition={isScanning ? { 
            duration: 1.5, 
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut"
          } : {}}
        >
          <RssIcon className="w-16 h-16 text-white" />
        </motion.div>

        {/* Scanning Waves */}
        {isScanning && (
          <>
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-secondary"
              animate={{
                scale: [1, 1.3, 1.6],
                opacity: [0.8, 0.4, 0]
              }}
              transition={{
                duration: 2,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeOut"
              }}
            />
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-secondary-light"
              animate={{
                scale: [1, 1.2, 1.4],
                opacity: [0.6, 0.3, 0]
              }}
              transition={{
                duration: 2,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeOut",
                delay: 0.3
              }}
            />
          </>
        )}
      </motion.div>

      {/* Status Text */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-center"
      >
        {isScanning ? (
          <p className="text-white text-xl font-semibold">
            Bezig met scannen…
          </p>
        ) : error ? (
          <p className="text-error text-lg">
            {error}
          </p>
        ) : nfcSupported ? (
          <p className="text-white/80">
            Tik op de cirkel om de lezer te activeren
          </p>
        ) : (
          <p className="text-error">
            NFC wordt niet ondersteund
          </p>
        )}
      </motion.div>

      {/* Development Test Button */}
      {process.env.NODE_ENV === 'development' && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          onClick={simulateNFCScan}
          className="mt-8 px-6 py-2 bg-accent text-primary font-semibold rounded-lg hover:bg-accent-dark transition-colors"
        >
          Test Scan (Dev Only)
        </motion.button>
      )}
    </div>
  );
}