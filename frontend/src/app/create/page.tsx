'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount, useDeployContract, useWaitForTransactionReceipt, useBalance } from 'wagmi';
import { parseEther, formatEther, keccak256, toBytes } from 'viem';
import {
  Wallet, User, Clock, Coins, CheckCircle, ArrowRight, ArrowLeft, Shield,
  Loader2, AlertTriangle, ExternalLink, XCircle
} from 'lucide-react';
import { VAULT_DEPLOY_ABI, VAULT_BYTECODE } from '@/lib/contract';
import { createVault, resolveENS } from '@/lib/api';
import Link from 'next/link';

const intervals = [
  { value: 30, label: '30 days', desc: 'Monthly check-in' },
  { value: 60, label: '60 days', desc: 'Every 2 months' },
  { value: 90, label: '90 days', desc: 'Quarterly check-in' },
];

export default function CreateVaultPage() {
  const { address, isConnected } = useAccount();
  const { data: balanceData } = useBalance({ address });
  const walletBalance = balanceData ? parseFloat(formatEther(balanceData.value)) : 0;
  const [step, setStep] = useState(1);
  const [beneficiary, setBeneficiary] = useState('');
  const [interval, setInterval] = useState(90);
  const [amount, setAmount] = useState('');
  const [deploying, setDeploying] = useState(false);
  const [deployed, setDeployed] = useState(false);
  const [vaultAddress, setVaultAddress] = useState('');

  // ENS resolution state
  const [ensStatus, setEnsStatus] = useState<'idle' | 'resolving' | 'resolved' | 'not_found' | 'error'>('idle');
  const [ensResolved, setEnsResolved] = useState<{ address: string; name: string } | null>(null);

  const totalSteps = 5;

  // Live ENS resolution with debounce
  useEffect(() => {
    if (!beneficiary.endsWith('.eth') || beneficiary.length < 5) {
      setEnsStatus('idle');
      setEnsResolved(null);
      return;
    }

    setEnsStatus('resolving');
    const timeout = setTimeout(async () => {
      try {
        const result = await resolveENS(beneficiary);
        if (result.resolved) {
          setEnsStatus('resolved');
          setEnsResolved({ address: result.address, name: result.name });
        } else {
          setEnsStatus('not_found');
          setEnsResolved(null);
        }
      } catch {
        setEnsStatus('error');
        setEnsResolved(null);
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [beneficiary]);

  const canProceed = () => {
    switch (step) {
      case 1: return isConnected;
      case 2: {
        // Valid if: resolved ENS, or valid 0x address
        if (beneficiary.endsWith('.eth')) return ensStatus === 'resolved';
        return beneficiary.startsWith('0x') && beneficiary.length >= 42;
      }
      case 3: return interval > 0;
      case 4: {
        const amt = parseFloat(amount);
        // Need amount > 0 AND (amount + 0.005 ETH buffer for gas) <= wallet balance
        return amt > 0 && amt + 0.005 <= walletBalance;
      }
      case 5: return true;
      default: return false;
    }
  };

  const [deployTxHash, setDeployTxHash] = useState<`0x${string}` | undefined>();
  const [deployError, setDeployError] = useState<string>('');
  const { deployContractAsync } = useDeployContract();

  const handleDeploy = async () => {
    setDeployError('');
    if (!address || !isConnected) {
      setDeployError('Wallet not connected. Please connect your wallet first.');
      return;
    }

    const beneficiaryAddr = ensResolved?.address || beneficiary;

    // Validate beneficiary is not self
    if (beneficiaryAddr.toLowerCase() === address.toLowerCase()) {
      setDeployError('Beneficiary cannot be your own wallet address. Enter a different address or ENS name.');
      return;
    }

    // Validate minimum interval (contract requires >= 30 days)
    if (interval < 30) {
      setDeployError('Heartbeat interval must be at least 30 days.');
      return;
    }

    // Validate sufficient balance (amount + gas buffer)
    const amt = parseFloat(amount);
    if (amt + 0.005 > walletBalance) {
      setDeployError(`Insufficient balance. You need ${amt} ETH + ~0.005 ETH for gas. Wallet has ${walletBalance.toFixed(4)} ETH.`);
      return;
    }

    setDeploying(true);
    try {
      const beneficiaryEns = ensResolved?.name || (beneficiary.endsWith('.eth') ? beneficiary : undefined);
      const heartbeatSecs = BigInt(interval * 86400);
      const worldIdNullifier = keccak256(toBytes(`deadswitch-${address}-${beneficiaryAddr}`));
      const depositWei = parseEther(amount);

      console.log('Deploying vault with:', {
        beneficiary: beneficiaryAddr,
        heartbeatSecs: heartbeatSecs.toString(),
        worldIdNullifier,
        depositWei: depositWei.toString(),
        from: address,
      });

      // This should trigger MetaMask popup
      const hash = await deployContractAsync({
        abi: VAULT_DEPLOY_ABI,
        bytecode: VAULT_BYTECODE,
        args: [
          beneficiaryAddr as `0x${string}`,
          heartbeatSecs,
          worldIdNullifier,
          '',
          beneficiaryEns || '',
        ],
        value: depositWei,
      });

      console.log('Deploy tx hash:', hash);
      setDeployTxHash(hash);

      // Register in backend database
      try {
        await createVault({
          owner_address: address,
          beneficiary_address: beneficiaryAddr,
          heartbeat_interval: interval * 86400,
          balance: parseFloat(amount),
          beneficiary_ens: beneficiaryEns,
          world_id_nullifier: worldIdNullifier,
          vault_address: hash,
        });
      } catch { /* non-blocking */ }

      setVaultAddress(hash);
      setDeployed(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('Deploy failed:', err);

      // User-friendly error messages
      if (msg.includes('User rejected') || msg.includes('User denied')) {
        setDeployError('Transaction rejected. You need to approve the transaction in MetaMask.');
      } else if (msg.includes('insufficient funds')) {
        setDeployError('Insufficient Sepolia ETH. Get testnet ETH from sepoliafaucet.com');
      } else if (msg.includes('chain')) {
        setDeployError('Wrong network. Please switch to Sepolia testnet in MetaMask.');
      } else {
        setDeployError(`Deploy failed: ${msg.slice(0, 150)}`);
      }
      setDeploying(false);
      return;
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
        <div className="bg-card border border-border rounded-2xl p-4 space-y-2">
          <p className="text-xs text-subtle mb-1">Deployment Transaction</p>
          <p className="font-mono text-xs break-all text-muted">{vaultAddress}</p>
          <a
            href={`https://sepolia.etherscan.io/tx/${vaultAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            View on Sepolia Etherscan <ExternalLink size={10} />
          </a>
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
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="0x... or ENS name (e.g., vitalik.eth)"
                  value={beneficiary}
                  onChange={(e) => setBeneficiary(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl bg-background border focus:outline-none text-sm font-mono transition-colors ${
                    ensStatus === 'resolved' ? 'border-success focus:border-success' :
                    ensStatus === 'not_found' ? 'border-danger focus:border-danger' :
                    'border-border focus:border-primary'
                  }`}
                />

                {/* ENS resolution feedback */}
                <AnimatePresence mode="wait">
                  {ensStatus === 'resolving' && (
                    <motion.div key="resolving" initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20">
                      <Loader2 size={14} className="text-primary animate-spin" />
                      <span className="text-xs text-primary">Resolving {beneficiary}...</span>
                    </motion.div>
                  )}

                  {ensStatus === 'resolved' && ensResolved && (
                    <motion.div key="resolved" initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-success/10 border border-success/20">
                      <CheckCircle size={14} className="text-success" />
                      <div className="flex-1 min-w-0">
                        <span className="text-xs text-success font-medium">{ensResolved.name} resolved</span>
                        <p className="text-[11px] text-muted font-mono truncate">{ensResolved.address}</p>
                      </div>
                    </motion.div>
                  )}

                  {ensStatus === 'not_found' && (
                    <motion.div key="not_found" initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="px-3 py-3 rounded-lg bg-danger/10 border border-danger/20 space-y-2">
                      <div className="flex items-center gap-2">
                        <XCircle size={14} className="text-danger" />
                        <span className="text-xs text-danger font-medium">ENS name not found</span>
                      </div>
                      <p className="text-[11px] text-muted">
                        "{beneficiary}" doesn't resolve to any address. Check the spelling or use a wallet address (0x...) instead.
                      </p>
                      <a
                        href="https://app.ens.domains"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
                      >
                        Register an ENS name <ExternalLink size={10} />
                      </a>
                    </motion.div>
                  )}

                  {ensStatus === 'error' && (
                    <motion.div key="error" initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-warning/10 border border-warning/20">
                      <AlertTriangle size={14} className="text-warning" />
                      <span className="text-xs text-warning">Could not resolve ENS. Try a 0x address instead.</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Hint for address format */}
                {beneficiary.length > 0 && !beneficiary.endsWith('.eth') && !beneficiary.startsWith('0x') && (
                  <p className="text-[11px] text-warning flex items-center gap-1">
                    <AlertTriangle size={10} />
                    Enter a wallet address (0x...) or ENS name (name.eth)
                  </p>
                )}
              </div>
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
              <div className="space-y-3">
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max={walletBalance}
                    placeholder="0.0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className={`w-full px-4 py-3 pr-16 rounded-xl bg-background border focus:outline-none text-2xl font-bold transition-colors ${
                      amount && parseFloat(amount) + 0.005 > walletBalance
                        ? 'border-danger focus:border-danger'
                        : 'border-border focus:border-primary'
                    }`}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted font-medium">ETH</span>
                </div>

                {/* Wallet balance display */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-subtle">
                    Wallet balance: <span className="font-mono text-muted">{walletBalance.toFixed(4)} ETH</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setAmount(Math.max(0, walletBalance - 0.01).toFixed(4))}
                    className="text-primary hover:underline font-medium"
                    disabled={walletBalance <= 0.01}
                  >
                    Use max (minus gas)
                  </button>
                </div>

                {/* Insufficient balance warning */}
                {amount && parseFloat(amount) > 0 && parseFloat(amount) + 0.005 > walletBalance && (
                  <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-danger/10 border border-danger/20">
                    <AlertTriangle size={14} className="text-danger mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-danger font-semibold">
                        Insufficient balance
                      </p>
                      <p className="text-[11px] text-muted mt-0.5">
                        You need {amount} ETH + ~0.005 ETH for gas. Your wallet has {walletBalance.toFixed(4)} ETH.
                        {walletBalance < 0.01 && (
                          <> Get Sepolia ETH from <a href="https://sepoliafaucet.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">sepoliafaucet.com</a></>
                        )}
                      </p>
                    </div>
                  </div>
                )}

                {/* Low balance warning */}
                {walletBalance > 0 && walletBalance < 0.02 && (
                  <p className="text-[11px] text-warning">
                    ⚠ Low wallet balance. Get more Sepolia ETH from <a href="https://sepoliafaucet.com" target="_blank" rel="noopener noreferrer" className="underline">sepoliafaucet.com</a>
                  </p>
                )}
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
                  <div className="text-right">
                    {ensResolved ? (
                      <>
                        <span className="text-sm font-semibold">{ensResolved.name}</span>
                        <p className="text-[11px] text-muted font-mono">{ensResolved.address.slice(0, 10)}...{ensResolved.address.slice(-6)}</p>
                      </>
                    ) : (
                      <span className="text-sm font-mono">{beneficiary}</span>
                    )}
                  </div>
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
            disabled={deploying || !isConnected}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-success hover:bg-success/90 text-white font-bold text-sm disabled:opacity-60 disabled:cursor-not-allowed transition-colors cursor-pointer"
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

      {/* Deploy error */}
      {deployError && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-danger/10 border border-danger/20">
          <AlertTriangle size={16} className="text-danger mt-0.5 shrink-0" />
          <p className="text-sm text-danger">{deployError}</p>
        </div>
      )}
    </div>
  );
}
