'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface InitialLoadingScreenProps {
  show?: boolean;
}

export const InitialLoadingScreen: React.FC<InitialLoadingScreenProps> = ({ 
  show = true 
}) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ 
            backdropFilter: 'blur(12px)',
            backgroundColor: 'rgba(0, 0, 0, 0.6)'
          }}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="bg-light-card/95 dark:bg-dark-card/95 rounded-3xl p-10 shadow-3d-light dark:shadow-3d-dark border border-light-border/20 dark:border-dark-border/20 backdrop-blur-xl max-w-sm w-full mx-4"
          >
            <div className="flex flex-col items-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center shadow-3d-light dark:shadow-3d-dark">
                <img
                  src="/logo/whisperrnote.png"
                  alt="WhisperNote logo"
                  className="w-16 h-16 rounded-full"
                />
              </div>

              <p className="text-sm font-medium uppercase tracking-[0.3em] text-foreground/70">
                Loading
              </p>

              <div className="w-32 h-2 rounded-full bg-light-border dark:bg-dark-border overflow-hidden">
                <motion.div
                  className="h-full bg-accent"
                  initial={{ width: "0%" }}
                  animate={{ width: ["0%", "100%", "0%"] }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};