'use client';

import { motion } from 'framer-motion';
import { GuestType } from '../types';
import { BuildingOffice2Icon, SunIcon, SwatchIcon } from '@heroicons/react/24/outline';

interface GuestTypeSelectorProps {
  onTypeSelected: (type: GuestType) => void;
}

const guestTypes = [
  {
    type: 'hotelgast' as GuestType,
    label: 'Hotelgast',
  description: 'Gasten met overnachting',
  icon: 'hotel',
    color: 'from-primary to-primary-light',
  },
  {
    type: 'daggast' as GuestType,
    label: 'Daggast',
  description: 'Gasten voor een dagbezoek',
  icon: 'day',
    color: 'from-secondary to-secondary-light',
  },
  {
    type: 'zwembadgast' as GuestType,
    label: 'Zwembadgast',
  description: 'Alleen zwembadtoegang',
  icon: 'pool',
    color: 'from-accent to-accent-dark',
  },
];

export default function GuestTypeSelector({ onTypeSelected }: GuestTypeSelectorProps) {
  return (
    <div className="p-8 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h2 className="text-3xl font-bold text-white mb-4">
          Kies type gast
        </h2>
        <p className="text-white/80 text-lg">
          Selecteer het juiste gasttype voor registratie
        </p>
      </motion.div>

      <div className="grid gap-6">
        {guestTypes.map((guest, index) => (
          <motion.button
            key={guest.type}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => onTypeSelected(guest.type)}
            className={`w-full p-6 rounded-2xl text-white font-semibold text-left relative overflow-hidden group hover:scale-[1.02] transition-transform duration-200`}
            style={{
              background: guest.type === 'hotelgast' 
                ? 'linear-gradient(135deg, var(--primary), var(--primary-light))'
                : guest.type === 'daggast'
                ? 'linear-gradient(135deg, var(--secondary), var(--secondary-light))'
                : 'linear-gradient(135deg, var(--accent), var(--accent-dark))'
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="w-full h-full bg-white/20 rounded-full transform -translate-x-1/2 -translate-y-1/2 scale-150"></div>
            </div>

            <div className="relative flex items-center">
              {/* Icon */}
              <div className="mr-4 bg-white/20 rounded-full w-16 h-16 flex items-center justify-center">
                {guest.icon === 'hotel' && (<BuildingOffice2Icon className="w-8 h-8 text-white" />)}
                {guest.icon === 'day' && (<SunIcon className="w-8 h-8 text-white" />)}
                {guest.icon === 'pool' && (<SwatchIcon className="w-8 h-8 text-white" />)}
              </div>

              {/* Content */}
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-1 text-white">
                  {guest.label}
                </h3>
                <p className="text-white/80 text-sm">
                  {guest.description}
                </p>
              </div>

              {/* Arrow */}
              <motion.div className="ml-4 text-white/80" animate={{ x: 0 }} whileHover={{ x: 5 }} transition={{ duration: 0.2 }}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                  <path fillRule="evenodd" d="M4.5 12a.75.75 0 0 1 .75-.75h11.69l-3.22-3.22a.75.75 0 1 1 1.06-1.06l4.5 4.5a.75.75 0 0 1 0 1.06l-4.5 4.5a.75.75 0 1 1-1.06-1.06l3.22-3.22H5.25A.75.75 0 0 1 4.5 12Z" clipRule="evenodd" />
                </svg>
              </motion.div>
            </div>

            {/* Hover Effect */}
            <motion.div
              className="absolute inset-0 bg-white/10 rounded-2xl"
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            />
          </motion.button>
        ))}
      </div>

      {/* Progress Indicator */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-8 flex justify-center items-center space-x-2">
        <div className="w-3 h-3 rounded-full bg-white/40"></div>
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--secondary)' }}></div>
        <div className="w-3 h-3 rounded-full bg-white/40"></div>
      </motion.div>
    </div>
  );
}