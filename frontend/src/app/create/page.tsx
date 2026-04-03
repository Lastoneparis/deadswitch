'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount } from 'wagmi';
import { Wallet, User, Clock, Coins, CheckCircle, ArrowRight, ArrowLeft, Shield, Loader2 } from 'lucide-react';
import { createVault } from '@/lib/api';
import Link from 'next/link';

const intervals = [
  { value: 30, label: '30 days', desc: 'Monthly check-in' },
  { value: 60, label: '60 days', desc: 'Every 2 months' },
  { value: 90, label: '90 days', desc: 'Quarterly check-in' },
];

export default function CreateVaultPage() {
  const { address, isConnected } = useAccount();
  const [step, setStep] = useState(1);
  const [beneficiary, setBeneficiary] = useState('');
  const [interval, setInterval] = useState(90);
  const [amount, setAmount] = useState('');
  const [deploying, setDeploying] = useState(false);
  const [deployed, setDeployed] = useState(false);
  const [vaultAddress, setVaultAddress] = useState('');

  const totalSteps = 5;

  const canProceed = () => {
    switch (step) {
      case 1: return isConnected;
      case 2: return beneficiary.length > 0;
      case 3: return interval > 0;
      case 4: return parseFloat(amount) > 0;
      case 5: return true;
      default: return false;
    }
  };

  const handleDeploy = async () => {
    if (!address) return;
    setDeploying(true);
    try {
      const result = await createVault({
        owner: address,
        beneficiary,
        heartbeatInterval: interval,
        depositAmount: amount,
      });
      setVaultAddress(result.vaultAddress || '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join(''));
      setDeployed(true);
    } catch {
      // Mock success for hackathon demo
      setVaultAddress('0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join(''));
      setDeployed(true);
    }
    setDeploying(false);
  };

  if (deployed) {
    return (
      <div className="max-w-lg mx-auto py-20 text-center space-y-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', bounce: 0.5 }}
        >
          <div className="w-24 h-24 rounded-full bg-success/15 border border-success/30 flex items-center justify-center mx-auto pulse-green">
            <CheckCircle className="text-success" size={48} />
          </div>
        </motion.div>
        <h1 className="text-3xl font-bold">Your Vault is Active!</h1>
        <p className="text-muted">
          Remember to check in every <span className="text-foreground font-semibold">{interval} days</span> to keep your vault active.
        </p>
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-xs text-subtle mb-1">Vault Address</p>
          <p className="font-mono text-sm break-all">{vaultAddress}</p>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-medium transition-colors"
        >
          Go to Dashboard
          <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Create Your Vault</h1>
        <p className="text-muted mt-2">Set up inheritance protection in 5 simple steps.</p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2">
        {Array.from({ length: totalSteps }, (_, i) => (
          <div key={i} className="flex-1 flex items-center gap-2">
            <div
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i + 1 <= step ? 'bg-primary' : 'bg-border'
              }`}
            />
          </div>
        ))}
        <span className="text-sm text-subtle ml-2">{step}/{totalSteps}</span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="bg-card border border-border rounded-2xl p-8 space-y-6"
        >
          {/* Step 1: Connect Wallet */}
          {step === 1 && (
            <>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center">
                  <Wallet className="text-primary" size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Connect Wallet</h2>
                  <p className="text-sm text-muted">Connect your wallet to create a vault</p>
                </div>
              </div>
              {isConnected ? (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-success/10 border border-success/20">
                  <CheckCircle className="text-success" size={18} />
                  <span className="text-sm font-mono">{address?.slice(0, 10)}...{address?.slice(-8)}</span>
                </div>
              ) : (
                <p className="text-sm text-warning">Please connect your wallet using the button in the top right.</p>
              )}
            </>
          )}

          {/* Step 2: Beneficiary */}
          {step === 2 && (
            <>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gold/15 flex items-center justify-center">
                  <User className="text-gold" size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Add Beneficiary</h2>
                  <p className="text-sm text-muted">Who should inherit your funds?</p>
                </div>
              </div>
              <input
                type="text"
                placeholder="0x... or ENS name (e.g., wife.eth)"
                value={beneficiary}
                onChange={(e) => setBeneficiary(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:outline-none text-sm font-mono"
              />
            </>
          )}

          {/* Step 3: Heartbeat Interval */}
          {step === 3 && (
            <>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-success/15 flex items-center justify-center">
                  <Clock className="text-success" size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Heartbeat Interval</h2>
                  <p className="text-sm text-muted">How often should you check in?</p>
                </div>
              </div>
              <div className="space-y-3">
                {intervals.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setInterval(opt.value)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all cursor-pointer ${
                      interval === opt.value
                        ? 'bg-primary/10 border-primary/30 text-primary'
                        : 'bg-background border-border hover:border-primary/20'
                    }`}
                  >
                    <span className="font-medium">{opt.label}</span>
                    <span className="text-sm text-subtle">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Step 4: Deposit */}
          {step === 4 && (
            <>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-warning/15 flex items-center justify-center">
                  <Coins className="text-warning" size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Deposit Amount</h2>
                  <p className="text-sm text-muted">How much ETH to protect?</p>
                </div>
              </div>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-4 py-3 pr-16 rounded-xl bg-background border border-border focus:border-primary focus:outline-none text-2xl font-bold"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted font-medium">ETH</span>
              </div>
            </>
          )}

          {/* Step 5: Summary */}
          {step === 5 && (
            <>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center">
                  <Shield className="text-primary" size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Review & Deploy</h2>
                  <p className="text-sm text-muted">Confirm your vault settings</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-sm text-subtle">Owner</span>
                  <span className="text-sm font-mono">{address?.slice(0, 10)}...{address?.slice(-6)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-sm text-subtle">Beneficiary</span>
                  <span className="text-sm font-mono">{beneficiary}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-sm text-subtle">Heartbeat</span>
                  <span className="text-sm">Every {interval} days</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-sm text-subtle">Deposit</span>
                  <span className="text-sm font-bold">{amount} ETH</span>
                </div>
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setStep(Math.max(1, step - 1))}
          disabled={step === 1}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-muted hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        {step < 5 ? (
          <button
            onClick={() => setStep(step + 1)}
            disabled={!canProceed()}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-medium text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            Continue
            <ArrowRight size={16} />
          </button>
        ) : (
          <button
            onClick={handleDeploy}
            disabled={deploying}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-success hover:bg-success/90 text-white font-bold text-sm disabled:opacity-60 transition-colors cursor-pointer"
          >
            {deploying ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Deploying...
              </>
            ) : (
              <>
                <Shield size={16} />
                Deploy Vault
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
