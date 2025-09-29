'use client';

import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { CheckCircleIcon, ArrowUturnLeftIcon } from '@heroicons/react/24/solid';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

interface CompletionScreenProps {
  isCheckout?: boolean;
  onReset: () => void;
}

export default function CompletionScreen({ isCheckout = false, onReset }: CompletionScreenProps) {
  useEffect(() => {
    const timer = setTimeout(onReset, 5000);
    return () => clearTimeout(timer);
  }, [onReset]);

  return (
    <div className="p-8 text-center min-h-[500px] flex flex-col items-center justify-center text-white relative overflow-hidden">
      {/* Icon bubble */}
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }} className="mb-8">
        <div className="w-32 h-32 rounded-full flex items-center justify-center" style={{ backgroundColor: isCheckout ? 'var(--accent)' : 'var(--success)' }}>
          {isCheckout ? (
            <ArrowUturnLeftIcon className="w-16 h-16 text-white" />
          ) : (
            <CheckCircleIcon className="w-16 h-16 text-white" />
          )}
        </div>
      </motion.div>

      {/* Messages */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="mb-6">
        <h2 className="text-4xl font-bold mb-2">
          {isCheckout ? 'Uitcheck voltooid' : 'Incheck opgeslagen'}
        </h2>
        <p className="text-white/80 text-lg">
          {isCheckout ? 'Registratie afgesloten. Fijne dag!' : 'Registratie vastgelegd. Veel plezier!'}
        </p>
      </motion.div>

      {/* Countdown */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="rounded-xl p-4 mb-6" style={{ background: 'rgba(255,255,255,0.08)' }}>
        <p className="text-white">
          Automatisch terug naar scanner in
          <motion.span className="font-bold text-white ml-2" animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 1, repeat: 4 }}>
            5
          </motion.span>
          s
        </p>
      </motion.div>

      {/* Manual reset */}
      <motion.button initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} onClick={onReset} className="px-8 py-3 text-white text-lg font-semibold rounded-xl hover:opacity-90 transition-colors flex items-center gap-2" style={{ backgroundColor: 'var(--primary)' }}>
        <ArrowPathIcon className="w-5 h-5" />
        Terug naar scanner
      </motion.button>

      {/* Subtle background accents */}
      <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-10" style={{ backgroundColor: isCheckout ? 'var(--accent-dark)' : 'var(--success-light)' }} />
      <div className="absolute -bottom-10 -left-10 w-52 h-52 rounded-full opacity-10" style={{ backgroundColor: 'var(--secondary-light)' }} />
    </div>
  );
}