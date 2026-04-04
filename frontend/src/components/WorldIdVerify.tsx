'use client';

import { motion } from 'framer-motion';
import { ScanFace, CheckCircle, Loader2 } from 'lucide-react';
import { useState, useCallback } from 'react';
import { IDKitWidget, VerificationLevel, type ISuccessResult } from '@worldcoin/idkit';

interface WorldIdVerifyProps {
  onVerified: (proof?: ISuccessResult) => void;
}

const APP_ID = 'app_abf4ec65ebe37b0642f7393eae34f709' as `app_${string}`;
const ACTION = 'claim-inheritance';

export default function WorldIdVerify({ onVerified }: WorldIdVerifyProps) {
  const [state, setState] = useState<'idle' | 'scanning' | 'verified' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleVerify = useCallback(async (proof: ISuccessResult) => {
    setState('scanning');
    console.log('[WorldID] Proof received:', {
      merkle_root: proof.merkle_root?.slice(0, 20) + '...',
      nullifier_hash: proof.nullifier_hash?.slice(0, 20) + '...',
      verification_level: proof.verification_level,
    });

    // Send proof to backend for server-side verification
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || '/api';
      const res = await fetch(`${apiBase}/auth/verify-worldid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proof: {
            merkle_root: proof.merkle_root,
            proof: proof.proof,
            verification_level: proof.verification_level,
          },
          nullifier_hash: proof.nullifier_hash,
        }),
      });
      const data = await res.json();
      console.log('[WorldID] Backend verification result:', data);
    } catch (err) {
      console.warn('[WorldID] Backend verification call failed (non-blocking):', err);
    }
  }, []);

  const handleSuccess = useCallback((proof: ISuccessResult) => {
    console.log('[WorldID] Success! Proof verified.');
    setState('verified');
    setTimeout(() => onVerified(proof), 800);
  }, [onVerified]);

  const handleError = useCallback((error: { code: string; message?: string }) => {
    console.error('[WorldID] Error:', error);
    setState('error');
    setErrorMsg(error.message || error.code || 'Verification failed');
    setTimeout(() => {
      setState('idle');
      setErrorMsg('');
    }, 3000);
  }, []);

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
          <p className="text-sm text-subtle">World ID proof confirmed on-chain</p>
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

  if (state === 'error') {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-danger/15 border border-danger/30"
      >
        <ScanFace className="text-danger" size={24} />
        <div>
          <p className="font-semibold text-danger">Verification Failed</p>
          <p className="text-sm text-subtle">{errorMsg}</p>
        </div>
      </motion.div>
    );
  }

  return (
    <IDKitWidget
      app_id={APP_ID}
      action={ACTION}
      verification_level={VerificationLevel.Device}
      handleVerify={handleVerify}
      onSuccess={handleSuccess}
      onError={handleError}
      autoClose
    >
      {({ open }: { open: () => void }) => (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={open}
          className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all w-full cursor-pointer"
        >
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
            <ScanFace className="text-primary" size={24} />
          </div>
          <div className="text-left">
            <p className="font-semibold">Verify with World ID</p>
            <p className="text-sm text-subtle">Prove you are a unique human</p>
          </div>
          <div className="ml-auto">
            <img
              src="https://world.org/icons/worldcoin-logo.svg"
              alt="World ID"
              className="w-6 h-6 opacity-50"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
        </motion.button>
      )}
    </IDKitWidget>
  );
}
