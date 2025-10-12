'use client';

import { ArrowLeft, User, Baby } from 'lucide-react';

interface VisitorCountFormProps {
  adults: number;
  children: number;
  onAdultsChange: (count: number) => void;
  onChildrenChange: (count: number) => void;
  onSubmit: () => void;
  onBack: () => void;
}

export default function VisitorCountForm({
  adults,
  children,
  onAdultsChange,
  onChildrenChange,
  onSubmit,
  onBack
}: VisitorCountFormProps) {
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
            onClick={() => onAdultsChange(Math.max(0, adults - 1))}
            className="counter-btn"
            disabled={adults === 0}
          >
            -
          </button>
          <span className="text-4xl font-bold w-20 text-center">{adults}</span>
          <button
            onClick={() => onAdultsChange(adults + 1)}
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
            onClick={() => onChildrenChange(Math.max(0, children - 1))}
            className="counter-btn"
            disabled={children === 0}
          >
            -
          </button>
          <span className="text-4xl font-bold w-20 text-center">{children}</span>
          <button
            onClick={() => onChildrenChange(children + 1)}
            className="counter-btn"
          >
            +
          </button>
        </div>
      </div>

      <button
        onClick={onSubmit}
        disabled={adults === 0 && children === 0}
        className="btn-primary w-full text-xl disabled:opacity-50"
      >
        Bevestigen
      </button>
    </div>
  );
}
