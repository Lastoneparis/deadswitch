'use client';

import { motion } from 'framer-motion';
import { ScanFace, CheckCircle, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface WorldIdVerifyProps {
  onVerified: () => void;
}

export default function WorldIdVerify({ onVerified }: WorldIdVerifyProps) {
  const [state, setState] = useState<'idle' | 'scanning' | 'verified'>('idle');

  const handleVerify = async () => {
    setState('scanning');
    // Mock World ID verification for hackathon
    await new Promise((r) => setTimeout(r, 2500));
    setState('verified');
    setTimeout(() => onVerified(), 1000);
  };

  if (state === 'verified') {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-success/15 border border-success/30"
      >
        <CheckCircle className="text-success" size={24} />
        <div>
          <p className="font-semibold text-success">Identity Verified</p>
          <p className="text-sm text-subtle">World ID proof confirmed</p>
        </div>
      </motion.div>
    );
  }

  if (state === 'scanning') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-card border border-primary/30"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
        >
          <Loader2 size={48} className="text-primary" />
        </motion.div>
        <p className="text-muted">Verifying with World ID...</p>
        <div className="w-48 h-1 bg-border rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 2.5 }}
          />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleVerify}
      className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all w-full cursor-pointer"
    >
      <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
        <ScanFace className="text-primary" size={24} />
      </div>
      <div className="text-left">
        <p className="font-semibold">Verify with World ID</p>
        <p className="text-sm text-subtle">Prove you are a unique human</p>
      </div>
    </motion.button>
  );
}
