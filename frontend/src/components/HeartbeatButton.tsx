'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Heart } from 'lucide-react';
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
    <div className="relative flex flex-col items-center gap-4">
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: -10 }}
            exit={{ opacity: 0, y: -30 }}
            className="absolute -top-16 text-success font-bold text-lg"
          >
            Heartbeat Recorded!
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={handleClick}
        disabled={disabled || pressing}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`relative w-48 h-48 rounded-full flex flex-col items-center justify-center gap-2 text-white font-bold text-lg transition-all cursor-pointer ${
          disabled
            ? 'bg-subtle/30 cursor-not-allowed'
            : warning
            ? 'bg-gradient-to-br from-amber-500 to-orange-600 pulse-amber'
            : success
            ? 'bg-gradient-to-br from-emerald-400 to-green-600'
            : 'bg-gradient-to-br from-green-500 to-emerald-600 pulse-green'
        }`}
      >
        <motion.div
          animate={!disabled ? { scale: [1, 1.2, 1] } : {}}
          transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
        >
          <Heart size={40} fill="white" />
        </motion.div>
        <span className="text-sm font-semibold tracking-wide uppercase">
          {pressing ? 'Sending...' : success ? 'Confirmed!' : "I'm Still Here"}
        </span>
      </motion.button>

      <p className="text-sm text-subtle text-center max-w-xs">
        Press to send your heartbeat and confirm you are still in control of your vault.
      </p>
    </div>
  );
}
