import { useState } from 'react';
                      import { motion } from 'framer-motion';
                      import { UsersIcon, UserGroupIcon } from '@heroicons/react/24/outline';

                      interface GuestCountSelectorProps {
                        onCountSelected: (adults: number, children: number) => void;
                        initialAdults?: number;
                        initialChildren?: number;
                      }

                      export default function GuestCountSelector({
                        onCountSelected,
                        initialAdults = 1,
                        initialChildren = 0,
                      }: GuestCountSelectorProps) {
                        const [adults, setAdults] = useState(initialAdults);
                        const [children, setChildren] = useState(initialChildren);

                        const incrementCount = (type: 'adults' | 'children') => {
                          if (type === 'adults') setAdults(adults + 1);
                          if (type === 'children') setChildren(children + 1);
                        };

                        const decrementCount = (type: 'adults' | 'children') => {
                          if (type === 'adults' && adults > 0) setAdults(adults - 1);
                          if (type === 'children' && children > 0) setChildren(children - 1);
                        };

                        const handleSubmit = () => onCountSelected(adults, children);

                        return (
                          <div className="p-8 text-center text-white">
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                              <h2 className="text-3xl font-bold mb-2">Aantallen controleren</h2>
                              <p className="text-white/80 text-lg">Vul het aantal volwassenen en kinderen in</p>
                            </motion.div>

                            <div className="space-y-8 mb-8">
                              {/* Adults Counter */}
                              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl p-6 shadow-lg" style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(6px)' }}>
                                <div className="flex items-center justify-between">
                                  <div className="text-left">
                                    <div className="flex items-center gap-2 mb-1">
                                      <UsersIcon className="w-7 h-7 text-white/90" />
                                      <h3 className="text-2xl font-bold">Volwassenen</h3>
                                    </div>
                                    <p className="text-white/70">18 jaar en ouder</p>
                                  </div>

                                  <div className="flex items-center space-x-4">
                                    <motion.button onClick={() => decrementCount('adults')} disabled={adults <= 0} className="w-12 h-12 rounded-full text-white text-2xl font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-colors" style={{ backgroundColor: 'var(--secondary)' }} whileHover={adults > 1 ? { scale: 1.1 } : {}} whileTap={adults > 1 ? { scale: 0.9 } : {}}>
                                      -
                                    </motion.button>

                                    <motion.div key={adults} initial={{ scale: 1.2 }} animate={{ scale: 1 }} className="text-4xl font-bold min-w-[60px] text-center">
                                      {adults}
                                    </motion.div>

                                    <motion.button onClick={() => incrementCount('adults')} className="w-12 h-12 rounded-full text-white text-2xl font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-colors" style={{ backgroundColor: 'var(--secondary)' }} whileHover={adults < 10 ? { scale: 1.1 } : {}} whileTap={adults < 10 ? { scale: 0.9 } : {}}>
                                      +
                                    </motion.button>
                                  </div>
                                </div>
                              </motion.div>

                              {/* Children Counter */}
                              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="rounded-2xl p-6 shadow-lg" style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(6px)' }}>
                                <div className="flex items-center justify-between">
                                  <div className="text-left">
                                    <div className="flex items-center gap-2 mb-1">
                                      <UserGroupIcon className="w-7 h-7 text-white/90" />
                                      <h3 className="text-2xl font-bold">Kinderen</h3>
                                    </div>
                                    <p className="text-white/70">Onder de 18 jaar</p>
                                  </div>

                                  <div className="flex items-center space-x-4">
                                    <motion.button onClick={() => decrementCount('children')} disabled={children <= 0} className="w-12 h-12 rounded-full text-white text-2xl font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-colors" style={{ backgroundColor: 'var(--accent)' }} whileHover={children > 0 ? { scale: 1.1 } : {}} whileTap={children > 0 ? { scale: 0.9 } : {}}>
                                      -
                                    </motion.button>

                                    <motion.div key={children} initial={{ scale: 1.2 }} animate={{ scale: 1 }} className="text-4xl font-bold min-w-[60px] text-center">
                                      {children}
                                    </motion.div>

                                    <motion.button onClick={() => incrementCount('children')} className="w-12 h-12 rounded-full text-white text-2xl font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-colors" style={{ backgroundColor: 'var(--accent)' }} whileHover={children < 10 ? { scale: 1.1 } : {}} whileTap={children < 10 ? { scale: 0.9 } : {}}>
                                      +
                                    </motion.button>
                                  </div>
                                </div>
                              </motion.div>
                            </div>

                            {/* Summary */}
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-xl p-4 mb-8" style={{ background: 'rgba(255,255,255,0.08)' }}>
                              <p className="text-white text-lg">
                                <span className="font-bold">Totaal: {adults + children} personen</span>
                                <br />
                                <span className="text-white/80 text-sm">{adults} volwassen{adults !== 1 ? 'en' : 'e'} • {children} kind{children !== 1 ? 'eren' : ''}</span>
                              </p>
                            </motion.div>

                            {/* Submit Button */}
                            <motion.button initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} onClick={handleSubmit} className="w-full py-4 text-white text-xl font-bold rounded-2xl hover:opacity-90 transition-colors shadow-lg" style={{ backgroundColor: 'var(--success)' }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                              Bevestigen
                            </motion.button>

                            {/* Progress Indicator */}
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-8 flex justify-center items-center space-x-2">
                              <div className="w-3 h-3 rounded-full bg-white/40"></div>
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--secondary)' }}></div>
                              <div className="w-3 h-3 rounded-full bg-white/40"></div>
                            </motion.div>
                          </div>
                        );
                      }
