'use client';

import { ArrowLeft, Users, User, Radio } from 'lucide-react';

type GuestType = 'hotelgast' | 'daggast' | 'zwembadgast';

interface GuestTypeSelectorProps {
  onSelectType: (type: GuestType) => void;
  onBack: () => void;
}

export default function GuestTypeSelector({ onSelectType, onBack }: GuestTypeSelectorProps) {
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
          className="guest-type-btn w-full flex items-center justify-center gap-3"
        >
          <Users className="w-6 h-6" />
          <span className="text-xl">Hotelgast</span>
        </button>
        <button
          onClick={() => onSelectType('daggast')}
          className="guest-type-btn w-full flex items-center justify-center gap-3"
        >
          <User className="w-6 h-6" />
          <span className="text-xl">Daggast</span>
        </button>
        <button
          onClick={() => onSelectType('zwembadgast')}
          className="guest-type-btn w-full flex items-center justify-center gap-3"
        >
          <Radio className="w-6 h-6" />
          <span className="text-xl">Zwembadgast</span>
        </button>
      </div>
    </div>
  );
}
