'use client';

import { ArrowLeft, Users, User, Radio } from 'lucide-react';

type GuestType = 'hotelgast' | 'daggast' | 'zwembadgast';

interface GuestTypeSelectorProps {
  onSelectType: (type: GuestType) => void;
  selectedType: GuestType | null;
  onBack: () => void;
  onContinue: () => void;
}

export default function GuestTypeSelector({ onSelectType, selectedType, onBack, onContinue }: GuestTypeSelectorProps) {
  return (
    <div className="card animate-slide-in">
      <button
        onClick={onBack}
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
          onClick={() => onSelectType('hotelgast')}
          className={`guest-type-btn w-full flex items-center justify-center gap-3 ${
            selectedType === 'hotelgast' ? 'ring-4 ring-green-500 bg-green-900/30' : ''
          }`}
        >
          <Users className="w-6 h-6" />
          <span className="text-xl">Hotelgast</span>
          {selectedType === 'hotelgast' && <span className="ml-auto">✓</span>}
        </button>
        <button
          onClick={() => onSelectType('daggast')}
          className={`guest-type-btn w-full flex items-center justify-center gap-3 ${
            selectedType === 'daggast' ? 'ring-4 ring-green-500 bg-green-900/30' : ''
          }`}
        >
          <User className="w-6 h-6" />
          <span className="text-xl">Daggast</span>
          {selectedType === 'daggast' && <span className="ml-auto">✓</span>}
        </button>
        <button
          onClick={() => onSelectType('zwembadgast')}
          className={`guest-type-btn w-full flex items-center justify-center gap-3 ${
            selectedType === 'zwembadgast' ? 'ring-4 ring-green-500 bg-green-900/30' : ''
          }`}
        >
          <Radio className="w-6 h-6" />
          <span className="text-xl">Zwembadgast</span>
          {selectedType === 'zwembadgast' && <span className="ml-auto">✓</span>}
        </button>
      </div>

      {selectedType && (
        <button
          onClick={onContinue}
          className="btn-primary w-full mt-6"
        >
          Doorgaan →
        </button>
      )}
    </div>
  );
}
