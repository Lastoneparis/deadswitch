'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Check } from 'lucide-react';
import { useState } from 'react';

interface HeartbeatButtonProps {
  onPress: () => Promise<void>;
  disabled?: boolean;
  warning?: boolean;
}

export default function HeartbeatButton({ onPress, disabled, warning }: HeartbeatButtonProps) {
  const [pressing, setPressing] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleClick = async () => {
    if (pressing || disabled) return;
    setPressing(true);
    try {
      await onPress();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      // handled by parent
    } finally {
      setPressing(false);
    }
  };

  return (
    <div className="relative flex flex-col items-center gap-5">
      {/* Success feedback */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: -10, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.9 }}
            className="absolute -top-16 flex items-center gap-2 px-4 py-2 rounded-full bg-success/15 border border-success/30"
          >
            <Check size={16} className="text-success" />
            <span className="text-success font-bold text-sm">Alive Confirmed</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ripple rings */}
      <div className="relative">
        {!disabled && !success && (
          <>
            <motion.div
              className={`absolute inset-0 rounded-full border-2 ${warning ? 'border-warning/40' : 'border-success/30'}`}
              animate={{ scale: [1, 1.5], opacity: [0.4, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeOut' }}
            />
            <motion.div
              className={`absolute inset-0 rounded-full border-2 ${warning ? 'border-warning/30' : 'border-success/20'}`}
              animate={{ scale: [1, 1.5], opacity: [0.3, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeOut', delay: 1 }}
            />
          </>
        )}

        <motion.button
          onClick={handleClick}
          disabled={disabled || pressing}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.92 }}
          className={`relative w-52 h-52 rounded-full flex flex-col items-center justify-center gap-3 text-white font-bold text-lg transition-all cursor-pointer shadow-2xl ${
            disabled
              ? 'bg-subtle/30 cursor-not-allowed shadow-none'
              : warning
              ? 'bg-gradient-to-br from-amber-400 to-orange-600 pulse-amber'
              : success
              ? 'bg-gradient-to-br from-emerald-400 to-green-600'
              : 'bg-gradient-to-br from-green-400 to-emerald-600 pulse-green'
          }`}
        >
          <motion.div
            animate={!disabled && !success ? { scale: [1, 1.15, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
          >
            {success ? (
              <Check size={48} strokeWidth={3} />
            ) : (
              <Heart size={48} fill="white" />
            )}
          </motion.div>
          <span className="text-sm font-semibold tracking-widest uppercase">
            {pressing ? 'Sending...' : success ? 'Confirmed' : "I'm Still Here"}
          </span>
        </motion.button>
      </div>

      <p className="text-sm text-subtle text-center max-w-xs">
        Send your heartbeat to confirm you are still in control of your vault.
      </p>
    </div>
  );
}
