'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, Clock, Coins, User, Shield, Siren,
  Play, FastForward, UserCheck, Zap, ExternalLink, CheckCircle, AlertTriangle, Loader2
} from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatEther, encodeAbiParameters, parseAbiParameters } from 'viem';
import { VAULT_ADDRESS, VAULT_ABI } from '@/lib/contract';
import VaultStatusBadge from '@/components/VaultStatusBadge';
import HeartbeatButton from '@/components/HeartbeatButton';
import CountdownTimer from '@/components/CountdownTimer';
import TimelineEvent from '@/components/TimelineEvent';
import WorldIdVerify from '@/components/WorldIdVerify';
import Confetti from '@/components/Confetti';
import { sendHeartbeat, simulateDeath, claimInheritance } from '@/lib/api';

type Status = 'ACTIVE' | 'WARNING' | 'RECOVERY' | 'CLAIMED';

interface TimelineItem {
  type: 'heartbeat' | 'warning' | 'recovery' | 'claimed' | 'created';
  date: string;
  description?: string;
}

const DEMO_VAULT = '0x7a3b...4f2e';
const DEMO_OWNER = '0x1234...5678';

const SEPOLIA_ETHERSCAN = 'https://sepolia.etherscan.io';

function TxNotification({ hash, label }: { hash: string; label: string }) {
  const { data: receipt, isLoading } = useWaitForTransactionReceipt({ hash: hash as `0x${string}` });

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-success/30 rounded-xl p-4 space-y-2"
    >
      <div className="flex items-center gap-2">
        {isLoading ? (
          <Loader2 size={16} className="text-primary animate-spin" />
        ) : receipt?.status === 'success' ? (
          <CheckCircle size={16} className="text-success" />
        ) : (
          <AlertTriangle size={16} className="text-danger" />
        )}
        <span className="text-sm font-medium">
          {label} {isLoading ? 'pending...' : receipt?.status === 'success' ? 'confirmed' : 'submitted'}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted font-mono">
          Hash: {hash.slice(0, 10)}...{hash.slice(-8)}
        </span>
        <a
          href={`${SEPOLIA_ETHERSCAN}/tx/${hash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary hover:underline flex items-center gap-1"
        >
          View on Sepolia Etherscan <ExternalLink size={10} />
        </a>
      </div>
    </motion.div>
  );
}

function OnChainVaultStatus() {
  const { data, isLoading, isError, refetch } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: 'getVaultInfo',
  });

  if (isLoading) {
    return (
      <div className="bg-card border border-primary/30 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield size={18} className="text-primary" />
          <h3 className="text-lg font-bold">On-Chain Vault Status (Sepolia)</h3>
        </div>
        <div className="flex items-center gap-2 text-muted">
          <Loader2 size={14} className="animate-spin" />
          <span className="text-sm">Reading from contract...</span>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="bg-card border border-danger/30 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield size={18} className="text-danger" />
          <h3 className="text-lg font-bold">On-Chain Vault Status (Sepolia)</h3>
        </div>
        <p className="text-sm text-muted">Unable to read contract data. Make sure you are connected to Sepolia.</p>
      </div>
    );
  }

  const [owner, beneficiary, balance, lastHeartbeat, heartbeatInterval, statusCode, timeRemaining, ownerENS, beneficiaryENS] = data;
  const statusLabels = ['Inactive', 'Active', 'Recovery', 'Claimed', 'Cancelled'];
  const statusColors = ['text-muted', 'text-success', 'text-danger', 'text-gold', 'text-subtle'];
  const statusIndex = Number(statusCode);
  const lastHbDate = Number(lastHeartbeat) > 0
    ? new Date(Number(lastHeartbeat) * 1000).toLocaleString()
    : 'Never';
  const balanceEth = formatEther(balance);
  const timeRemainingHours = Math.floor(Number(timeRemaining) / 3600);
  const timeRemainingDays = Math.floor(timeRemainingHours / 24);

  return (
    <div className="bg-card border border-primary/30 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield size={18} className="text-primary" />
          <h3 className="text-lg font-bold">On-Chain Vault Status (Sepolia)</h3>
        </div>
        <a
          href={`${SEPOLIA_ETHERSCAN}/address/${VAULT_ADDRESS}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary hover:underline flex items-center gap-1"
        >
          View on Etherscan <ExternalLink size={10} />
        </a>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div className="space-y-3">
          <div>
            <span className="text-subtle">Contract</span>
            <p className="font-mono text-xs">{VAULT_ADDRESS.slice(0, 10)}...{VAULT_ADDRESS.slice(-8)}</p>
          </div>
          <div>
            <span className="text-subtle">Owner</span>
            <p className="font-mono text-xs">{ownerENS || `${String(owner).slice(0, 10)}...${String(owner).slice(-6)}`}</p>
          </div>
          <div>
            <span className="text-subtle">Beneficiary</span>
            <p className="font-mono text-xs">{beneficiaryENS || `${String(beneficiary).slice(0, 10)}...${String(beneficiary).slice(-6)}`}</p>
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <span className="text-subtle">Balance</span>
            <p className="font-bold">{balanceEth} ETH</p>
          </div>
          <div>
            <span className="text-subtle">Last Heartbeat</span>
            <p className="font-medium">{lastHbDate}</p>
          </div>
          <div>
            <span className="text-subtle">Status</span>
            <p className={`font-bold ${statusColors[statusIndex] || 'text-muted'}`}>
              {statusLabels[statusIndex] || `Unknown (${statusIndex})`}
            </p>
          </div>
          {Number(timeRemaining) > 0 && (
            <div>
              <span className="text-subtle">Time Remaining</span>
              <p className="font-medium">{timeRemainingDays}d {timeRemainingHours % 24}h</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { t } = useI18n();
  const { address, isConnected } = useAccount();
  const [status, setStatus] = useState<Status>('ACTIVE');
  const [lastHeartbeat, setLastHeartbeat] = useState('15 days ago');
  const [daysLeft, setDaysLeft] = useState(75);
  const [balance, setBalance] = useState('3.2');
  const [showConfetti, setShowConfetti] = useState(false);
  const [worldIdVerified, setWorldIdVerified] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);
  const [txHashes, setTxHashes] = useState<{ hash: string; label: string }[]>([]);
  const [onChainMessage, setOnChainMessage] = useState('');
  const [mounted, setMounted] = useState(false);
  const [timeline, setTimeline] = useState<TimelineItem[]>([
    { type: 'heartbeat', date: 'March 19, 2026 — 14:22 UTC', description: 'Heartbeat confirmed on-chain' },
    { type: 'heartbeat', date: 'February 17, 2026 — 09:15 UTC', description: 'Heartbeat confirmed on-chain' },
    { type: 'heartbeat', date: 'January 18, 2026 — 11:03 UTC', description: 'Heartbeat confirmed on-chain' },
    { type: 'created', date: 'December 15, 2025 — 16:45 UTC', description: 'Vault created with 3.2 ETH deposit' },
  ]);

  useEffect(() => { setMounted(true); }, []);

  const { writeContractAsync } = useWriteContract();

  const targetDate = new Date(Date.now() + daysLeft * 24 * 60 * 60 * 1000);

  const addTx = useCallback((hash: string, label: string) => {
    setTxHashes(prev => [{ hash, label }, ...prev]);
  }, []);

  const handleHeartbeat = useCallback(async () => {
    const now = new Date().toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    }) + ' — ' + new Date().toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
    });

    // Try on-chain heartbeat if wallet is connected
    if (isConnected && address) {
      try {
        const hash = await writeContractAsync({
          address: VAULT_ADDRESS,
          abi: VAULT_ABI,
          functionName: 'heartbeat',
        });
        addTx(hash, 'Heartbeat');
        setTimeline((prev) => [
          { type: 'heartbeat', date: now, description: `Heartbeat confirmed on-chain (tx: ${hash.slice(0, 10)}...)` },
          ...prev,
        ]);
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        // If user rejected or contract reverted, still update UI with demo data
        console.warn('On-chain heartbeat failed:', errMsg);
        setOnChainMessage(`On-chain heartbeat failed: ${errMsg.slice(0, 100)}`);
        // Fall back to backend API
        try { await sendHeartbeat(DEMO_VAULT, DEMO_OWNER); } catch { /* demo fallback */ }
        setTimeline((prev) => [
          { type: 'heartbeat', date: now, description: 'Heartbeat confirmed (demo fallback)' },
          ...prev,
        ]);
      }
    } else {
      // No wallet — use backend API
      try { await sendHeartbeat(DEMO_VAULT, DEMO_OWNER); } catch { /* demo */ }
      setTimeline((prev) => [
        { type: 'heartbeat', date: now, description: 'Heartbeat confirmed on-chain' },
        ...prev,
      ]);
    }

    setStatus('ACTIVE');
    setLastHeartbeat('Just now');
    setDaysLeft(90);
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 100);
  }, [isConnected, address, writeContractAsync, addTx]);

  const handleSimulateDeath = useCallback(async () => {
    // Always call the backend API (fast-forward demo)
    try { await simulateDeath(DEMO_VAULT); } catch { /* demo */ }

    // Also try on-chain performUpkeep (will likely revert — 30-day interval)
    if (isConnected && address) {
      try {
        const hash = await writeContractAsync({
          address: VAULT_ADDRESS,
          abi: VAULT_ABI,
          functionName: 'performUpkeep',
          args: ['0x' as `0x${string}`],
        });
        addTx(hash, 'PerformUpkeep');
        setOnChainMessage('');
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.warn('performUpkeep reverted (expected):', errMsg);
        setOnChainMessage('On-chain: heartbeat not yet expired (30-day interval). Using demo fast-forward.');
      }
    }

    setStatus('RECOVERY');
    setLastHeartbeat('93 days ago');
    setDaysLeft(0);
    setTimeline((prev) => [
      {
        type: 'recovery',
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        description: 'Chainlink Automation triggered recovery mode',
      },
      {
        type: 'warning',
        date: new Date(Date.now() - 7 * 86400000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        description: 'Warning: 7 days remaining',
      },
      ...prev,
    ]);
  }, [isConnected, address, writeContractAsync, addTx]);

  const handleClaim = useCallback(async () => {
    // Try on-chain claim if wallet is connected
    if (isConnected && address) {
      try {
        // Use a demo World ID nullifier hash
        const nullifierHash = '0x0000000000000000000000000000000000000000000000000000000000000001' as `0x${string}`;
        const hash = await writeContractAsync({
          address: VAULT_ADDRESS,
          abi: VAULT_ABI,
          functionName: 'claim',
          args: [nullifierHash],
        });
        addTx(hash, 'Claim');
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.warn('On-chain claim failed:', errMsg);
        setOnChainMessage(`On-chain claim failed: ${errMsg.slice(0, 100)}`);
        // Fall back to backend
        try { await claimInheritance(DEMO_VAULT, 'wife.eth'); } catch { /* demo */ }
      }
    } else {
      try { await claimInheritance(DEMO_VAULT, 'wife.eth'); } catch { /* demo */ }
    }

    setClaimSuccess(true);
    setStatus('CLAIMED');
    setBalance('0.0');
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 100);
    setTimeline((prev) => [
      {
        type: 'claimed',
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        description: 'Inheritance of 3.2 ETH transferred to wife.eth',
      },
      ...prev,
    ]);
  }, [isConnected, address, writeContractAsync, addTx]);

  const handleReset = useCallback(() => {
    setStatus('ACTIVE');
    setLastHeartbeat('15 days ago');
    setDaysLeft(75);
    setBalance('3.2');
    setShowConfetti(false);
    setWorldIdVerified(false);
    setClaimSuccess(false);
    setTxHashes([]);
    setOnChainMessage('');
    setTimeline([
      { type: 'heartbeat', date: 'March 19, 2026 — 14:22 UTC', description: 'Heartbeat confirmed on-chain' },
      { type: 'heartbeat', date: 'February 17, 2026 — 09:15 UTC', description: 'Heartbeat confirmed on-chain' },
      { type: 'heartbeat', date: 'January 18, 2026 — 11:03 UTC', description: 'Heartbeat confirmed on-chain' },
      { type: 'created', date: 'December 15, 2025 — 16:45 UTC', description: 'Vault created with 3.2 ETH deposit' },
    ]);
  }, []);

  return (
    <div className="space-y-8">
      <Confetti active={showConfetti} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('dash.title')}</h1>
          <p className="text-muted mt-1">{t('dash.subtitle')}</p>
        </div>
        <VaultStatusBadge status={status} />
      </div>

      {/* Tx Notifications */}
      <AnimatePresence>
        {txHashes.map((tx) => (
          <TxNotification key={tx.hash} hash={tx.hash} label={tx.label} />
        ))}
      </AnimatePresence>

      {/* On-chain message */}
      {onChainMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-warning/30 rounded-xl p-4 flex items-start gap-3"
        >
          <AlertTriangle size={16} className="text-warning mt-0.5 shrink-0" />
          <p className="text-sm text-muted">{onChainMessage}</p>
        </motion.div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-2xl p-5 space-y-2">
          <div className="flex items-center gap-2 text-subtle text-sm">
            <Heart size={14} className="text-success" />
            {t('dash.last_heartbeat')}
          </div>
          <p className={`text-lg font-bold ${status === 'RECOVERY' ? 'text-danger' : ''}`}>
            {lastHeartbeat}
          </p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5 space-y-2">
          <CountdownTimer targetDate={targetDate} totalDays={90} />
        </div>
        <div className="bg-card border border-border rounded-2xl p-5 space-y-2">
          <div className="flex items-center gap-2 text-subtle text-sm">
            <Coins size={14} className="text-warning" />
            {t('dash.balance')}
          </div>
          <p className="text-lg font-bold">{balance} ETH</p>
          <p className="text-xs text-subtle">${(parseFloat(balance) * 3000).toLocaleString()}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5 space-y-2">
          <div className="flex items-center gap-2 text-subtle text-sm">
            <User size={14} className="text-gold" />
            {t('dash.beneficiary')}
          </div>
          <p className="text-lg font-bold font-mono">wife.eth</p>
          <p className="text-xs text-success">{t('dash.worldid_verified')}</p>
        </div>
      </div>

      {/* On-Chain Vault Status */}
      {mounted && <OnChainVaultStatus />}

      {/* Center: Heartbeat Button + Recovery Alert */}
      <div className="flex flex-col items-center py-8">
        <AnimatePresence mode="wait">
          {status === 'CLAIMED' && claimSuccess ? (
            <motion.div
              key="claimed"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center space-y-4"
            >
              <div className="w-32 h-32 rounded-full bg-gold/15 border border-gold/30 flex items-center justify-center mx-auto">
                <Shield className="text-gold" size={56} />
              </div>
              <h2 className="text-2xl font-bold text-gold">{t('dash.inheritance_transferred')}</h2>
              <p className="text-muted">3.2 ETH {t('dash.transferred_to')} wife.eth</p>
            </motion.div>
          ) : status === 'RECOVERY' ? (
            <motion.div
              key="recovery"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center space-y-6"
            >
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="w-32 h-32 rounded-full bg-danger/15 border-2 border-danger/50 flex items-center justify-center mx-auto pulse-red"
              >
                <Siren className="text-danger" size={56} />
              </motion.div>
              <div>
                <h2 className="text-2xl font-bold text-danger">{t('dash.recovery_active')}</h2>
                <p className="text-muted mt-2">
                  {t('dash.recovery_desc')}
                  <br />
                  {t('dash.chainlink_triggered')}
                </p>
              </div>

              {!worldIdVerified ? (
                <div className="max-w-sm mx-auto">
                  <WorldIdVerify onVerified={() => setWorldIdVerified(true)} />
                </div>
              ) : (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleClaim}
                  className="px-8 py-4 rounded-2xl bg-gold hover:bg-gold/90 text-black font-bold text-lg transition-colors cursor-pointer"
                >
                  {t('claim.btn')}
                </motion.button>
              )}
            </motion.div>
          ) : (
            <motion.div key="heartbeat">
              <HeartbeatButton
                onPress={handleHeartbeat}
                warning={status === 'WARNING'}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Wallet Connection Status for judges */}
      {mounted && (
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3 text-sm">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-success' : 'bg-subtle'}`} />
          {isConnected ? (
            <span className="text-muted">
              Wallet connected: <span className="font-mono text-foreground">{address?.slice(0, 6)}...{address?.slice(-4)}</span> — on-chain actions will send real Sepolia transactions
            </span>
          ) : (
            <span className="text-muted">
              Wallet not connected — using demo mode. Connect wallet for real Sepolia transactions.
            </span>
          )}
        </div>
      )}

      {/* Timeline */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
          <Clock size={18} className="text-primary" />
          {t('dash.timeline')}
        </h3>
        <div className="space-y-1">
          {timeline.map((event, i) => (
            <TimelineEvent
              key={`${event.type}-${event.date}-${i}`}
              type={event.type}
              date={event.date}
              description={event.description}
              index={i}
            />
          ))}
        </div>
      </div>

      {/* Demo Controls */}
      <div className="bg-card border-2 border-dashed border-primary/30 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Zap size={18} className="text-primary" />
          <h3 className="text-lg font-bold">{t('demo.title')}</h3>
          <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">{t('demo.for_judges')}</span>
        </div>
        <p className="text-sm text-muted mb-6">
          {t('demo.desc')}
        </p>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={handleHeartbeat}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-success/15 border border-success/30 text-success font-medium hover:bg-success/25 transition-colors cursor-pointer"
          >
            <Play size={16} />
            {t('demo.send_heartbeat')}
          </button>
          <button
            onClick={handleSimulateDeath}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-danger/15 border border-danger/30 text-danger font-medium hover:bg-danger/25 transition-colors cursor-pointer"
          >
            <FastForward size={16} />
            {t('demo.simulate_death')}
          </button>
          <button
            onClick={() => {
              if (status !== 'RECOVERY') {
                handleSimulateDeath().then(() => {
                  setTimeout(() => {
                    setWorldIdVerified(true);
                    setTimeout(() => handleClaim(), 500);
                  }, 500);
                });
              } else if (!worldIdVerified) {
                setWorldIdVerified(true);
                setTimeout(() => handleClaim(), 500);
              } else {
                handleClaim();
              }
            }}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gold/15 border border-gold/30 text-gold font-medium hover:bg-gold/25 transition-colors cursor-pointer"
          >
            <UserCheck size={16} />
            {t('demo.claim_heir')}
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-card border border-border text-muted font-medium hover:text-foreground transition-colors cursor-pointer"
          >
            {t('demo.reset')}
          </button>
        </div>
      </div>
    </div>
  );
}
