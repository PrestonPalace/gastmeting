'use client';

import { CheckCircle } from 'lucide-react';

interface SuccessScreenProps {
  isCheckout: boolean;
}

export default function SuccessScreen({ isCheckout }: SuccessScreenProps) {
  return (
    <div className="card text-center animate-fade-in">
      <div className="mb-6">
        <div className="inline-flex items-center justify-center w-32 h-32 bg-[var(--success)] rounded-full mb-6">
          <CheckCircle className="w-16 h-16 text-white" />
        </div>
        <h2 className="text-3xl font-bold mb-4">
          {isCheckout ? 'Uitgecheckt!' : 'Ingecheckt!'}
        </h2>
        <p className="text-lg text-white/80">
          {isCheckout 
            ? 'De gast is succesvol uitgecheckt'
            : 'De gegevens zijn succesvol opgeslagen'}
        </p>
      </div>
    </div>
  );
}
