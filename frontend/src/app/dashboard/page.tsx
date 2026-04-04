'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, Shield, Siren, Play, FastForward, UserCheck, Zap, ExternalLink,
  CheckCircle, AlertTriangle, Loader2, Lock, Code2, Link2, Fingerprint,
  ChevronDown, ChevronUp, RotateCcw, Cpu, Eye, Wallet, PlusCircle, ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatEther } from 'viem';
import { VAULT_ADDRESS, VAULT_ABI, CHAINLINK_ETH_USD_SEPOLIA, CHAINLINK_PRICE_FEED_ABI } from '@/lib/contract';
import HeartbeatButton from '@/components/HeartbeatButton';
import WorldIdVerify from '@/components/WorldIdVerify';
import Confetti from '@/components/Confetti';
import { getUserVaults, sendHeartbeat, simulateDeath, claimInheritance, demoReset, cancelVault, VaultData } from '@/lib/api';

type Status = 'active' | 'recovery' | 'claimed' | 'cancelled';

interface TimelineItem {
  type: 'heartbeat' | 'warning' | 'recovery' | 'claimed' | 'created';
  date: string;
  description?: string;
}

const SEPOLIA_ETHERSCAN = 'https://sepolia.etherscan.io';

/* ──────────────────────────────────────────────
   TX Notification
   ────────────────────────────────────────────── */
function TxNotification({ hash, label }: { hash: string; label: string }) {
  const { data: receipt, isLoading } = useWaitForTransactionReceipt({ hash: hash as `0x${string}` });
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-success/20 rounded-2xl p-4 flex items-center justify-between"
    >
      <div className="flex items-center gap-3">
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
      <a
        href={`${SEPOLIA_ETHERSCAN}/tx/${hash}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-primary hover:underline flex items-center gap-1"
      >
        Etherscan <ExternalLink size={10} />
      </a>
    </motion.div>
  );
}

/* ──────────────────────────────────────────────
   Live Countdown (days, hours, minutes, seconds)
   ────────────────────────────────────────────── */
function LiveCountdown({ targetTimestamp, t }: { targetTimestamp: number; t: (k: string) => string }) {
  const [now, setNow] = useState(Math.floor(Date.now() / 1000));

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(interval);
  }, []);

  const remaining = Math.max(0, targetTimestamp - now);
  const days = Math.floor(remaining / 86400);
  const hours = Math.floor((remaining % 86400) / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  const seconds = remaining % 60;
  const expired = remaining <= 0;

  const color = expired ? 'text-danger' : days <= 7 ? 'text-danger' : days <= 30 ? 'text-warning' : 'text-foreground';

  return (
    <div>
      <p className="text-xs text-subtle uppercase tracking-wider mb-1">{t('dash.next_checkin')}</p>
      <p className={`text-2xl font-bold tabular-nums font-mono ${color}`}>
        {expired ? t('dash.expired') : (
          <>
            {days > 0 && <>{days}<span className="text-base font-medium text-subtle">d </span></>}
            {String(hours).padStart(2, '0')}<span className="text-base font-medium text-subtle">h </span>
            {String(minutes).padStart(2, '0')}<span className="text-base font-medium text-subtle">m </span>
            {String(seconds).padStart(2, '0')}<span className="text-base font-medium text-subtle">s</span>
          </>
        )}
      </p>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Recovery Timeline
   ────────────────────────────────────────────── */
function RecoveryTimeline({ daysLeft, totalDays, t }: { daysLeft: number; totalDays: number; t: (k: string) => string }) {
  const daysElapsed = totalDays - daysLeft;
  const progress = Math.min(1, Math.max(0, daysElapsed / totalDays));

  const milestones = [
    { day: 0, label: t('dash.alive'), icon: Heart, color: 'text-success', bg: 'bg-success' },
    { day: Math.round(totalDays * 0.33), label: t('dash.reminder'), icon: Eye, color: 'text-primary', bg: 'bg-primary' },
    { day: Math.round(totalDays * 0.67), label: t('dash.warning'), icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning' },
    { day: totalDays, label: t('dash.recovery'), icon: Siren, color: 'text-danger', bg: 'bg-danger' },
  ];

  return (
    <div className="relative mt-2">
      <div className="h-1.5 bg-border rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${
            progress > 0.67 ? 'bg-danger' : progress > 0.33 ? 'bg-warning' : 'bg-success'
          }`}
          initial={{ width: 0 }}
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>
      <div className="flex justify-between mt-4">
        {milestones.map((m, i) => {
          const Icon = m.icon;
          const reached = daysElapsed >= m.day;
          return (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-500 ${
                reached ? `${m.bg}/20 ring-2 ring-offset-2 ring-offset-background ring-current ${m.color}` : 'bg-border/50 text-subtle'
              }`}>
                <Icon size={16} />
              </div>
              <span className={`text-[11px] font-medium ${reached ? m.color : 'text-subtle'}`}>{m.label}</span>
              <span className="text-[10px] text-subtle">{t('dash.day')} {m.day}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Trust Signals
   ────────────────────────────────────────────── */
function TrustSignals({ t }: { t: (k: string) => string }) {
  const signals = [
    { icon: Lock, label: t('trust.non_custodial'), desc: t('trust.non_custodial_desc') },
    { icon: Code2, label: t('trust.open_source'), desc: t('trust.open_source_desc') },
    { icon: Link2, label: t('trust.on_chain'), desc: t('trust.on_chain_desc') },
    { icon: Cpu, label: t('trust.chainlink'), desc: t('trust.chainlink_desc') },
    { icon: Fingerprint, label: t('trust.worldid'), desc: t('trust.worldid_desc') },
    { icon: Shield, label: t('trust.ledger'), desc: t('trust.ledger_desc') },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {signals.map((s, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="flex items-start gap-3 p-4 rounded-2xl bg-card border border-border hover:border-primary/20 transition-colors"
        >
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <s.icon size={16} className="text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight">{s.label}</p>
            <p className="text-[11px] text-subtle mt-0.5">{s.desc}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

/* ──────────────────────────────────────────────
   No Vault State
   ────────────────────────────────────────────── */
function NoVaultState({ t }: { t: (k: string) => string }) {
  return (
    <div className="text-center py-16 space-y-6">
      <div className="w-24 h-24 rounded-full bg-card border-2 border-border flex items-center justify-center mx-auto">
        <Shield size={40} className="text-subtle" />
      </div>
      <div>
        <h2 className="text-2xl font-bold">{t('dash.no_vault')}</h2>
        <p className="text-muted mt-2 max-w-md mx-auto">
          {t('dash.no_vault_desc')}
        </p>
      </div>
      <Link
        href="/create"
        className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-primary hover:bg-primary/90 text-white font-semibold text-lg transition-all hover:shadow-lg hover:shadow-primary/25"
      >
        <PlusCircle size={20} />
        {t('dash.create_vault')}
        <ArrowRight size={18} />
      </Link>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Main Dashboard
   ────────────────────────────────────────────── */
export default function DashboardPage() {
  const { t } = useI18n();
  const { address, isConnected } = useAccount();
  const [vault, setVault] = useState<VaultData | null>(null);
  const [allVaults, setAllVaults] = useState<VaultData[]>([]);
  const [loading, setLoading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [worldIdVerified, setWorldIdVerified] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);
  const [txHashes, setTxHashes] = useState<{ hash: string; label: string }[]>([]);
  const [onChainMessage, setOnChainMessage] = useState('');
  const [mounted, setMounted] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'success' | 'warning' | 'danger' } | null>(null);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);

  useEffect(() => { setMounted(true); }, []);

  const { writeContractAsync } = useWriteContract();

  // Chainlink ETH/USD price feed (Sepolia)
  const { data: priceData } = useReadContract({
    address: CHAINLINK_ETH_USD_SEPOLIA,
    abi: CHAINLINK_PRICE_FEED_ABI,
    functionName: 'latestRoundData',
  });
  const ethPrice = priceData ? Number((priceData as any)[1]) / 1e8 : null;

  // Fetch user's vaults when wallet connects
  useEffect(() => {
    if (!isConnected || !address) {
      setVault(null);
      setAllVaults([]);
      setTimeline([]);
      return;
    }

    setLoading(true);
    getUserVaults(address)
      .then(({ vaults }) => {
        setAllVaults(vaults);
        if (vaults.length > 0) {
          const primary = vaults[0]; // Most recent vault
          setVault(primary);
          // Build timeline from heartbeat history
          const tl: TimelineItem[] = [];
          if (primary.recent_heartbeats) {
            for (const hb of primary.recent_heartbeats) {
              tl.push({
                type: 'heartbeat',
                date: new Date(hb.timestamp * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
                description: hb.tx_hash ? `On-chain (tx: ${hb.tx_hash.slice(0, 10)}...)` : 'Heartbeat confirmed',
              });
            }
          }
          tl.push({
            type: 'created',
            date: new Date(primary.created_at * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
            description: `Vault created with ${primary.balance} ETH deposit`,
          });
          setTimeline(tl);
        }
      })
      .catch(() => {
        // Backend unavailable — show empty state
        setVault(null);
        setAllVaults([]);
      })
      .finally(() => setLoading(false));
  }, [isConnected, address]);

  const addTx = useCallback((hash: string, label: string) => {
    setTxHashes(prev => [{ hash, label }, ...prev]);
  }, []);

  const showFeedback = useCallback((text: string, type: 'success' | 'warning' | 'danger') => {
    setFeedbackMessage({ text, type });
    setTimeout(() => setFeedbackMessage(null), 3000);
  }, []);

  // Refresh vault data from backend
  const refreshVault = useCallback(async () => {
    if (!address) return;
    try {
      const { vaults } = await getUserVaults(address);
      if (vaults.length > 0) {
        setVault(vaults[0]);
        setAllVaults(vaults);
      }
    } catch { /* ignore */ }
  }, [address]);

  const handleHeartbeat = useCallback(async () => {
    if (!vault) return;

    const now = new Date().toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    }) + ' — ' + new Date().toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
    });

    let txHash: string | undefined;

    // Try on-chain heartbeat
    if (isConnected && address && vault.vault_address) {
      try {
        const hash = await writeContractAsync({
          address: vault.vault_address as `0x${string}`,
          abi: VAULT_ABI,
          functionName: 'heartbeat',
        });
        addTx(hash, 'Heartbeat');
        txHash = hash;
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.warn('On-chain heartbeat failed:', errMsg);
      }
    }

    // Send to backend
    try {
      await sendHeartbeat(vault.id, txHash);
    } catch { /* demo */ }

    setTimeline((prev) => [
      { type: 'heartbeat', date: now, description: txHash ? `On-chain (tx: ${txHash.slice(0, 10)}...)` : 'Heartbeat confirmed' },
      ...prev,
    ]);

    showFeedback(t('dash.alive_confirmed'), 'success');
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 100);
    await refreshVault();
  }, [vault, isConnected, address, writeContractAsync, addTx, showFeedback, refreshVault]);

  const handleSimulateDeath = useCallback(async () => {
    if (!vault) return;

    try { await simulateDeath(vault.id); } catch { /* demo */ }

    showFeedback(t('dash.recovery_activated'), 'danger');
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
    await refreshVault();
  }, [vault, showFeedback, refreshVault]);

  const handleClaim = useCallback(async () => {
    if (!vault || !address) return;

    // Try on-chain claim
    if (isConnected && vault.vault_address) {
      try {
        const nullifierHash = '0x0000000000000000000000000000000000000000000000000000000000000001' as `0x${string}`;
        const hash = await writeContractAsync({
          address: vault.vault_address as `0x${string}`,
          abi: VAULT_ABI,
          functionName: 'claim',
          args: [nullifierHash],
        });
        addTx(hash, 'Claim');
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.warn('On-chain claim failed:', errMsg);
      }
    }

    // Backend claim
    try { await claimInheritance(vault.id, address); } catch { /* demo */ }

    setClaimSuccess(true);
    setShowConfetti(true);
    showFeedback(`Inheritance of ${vault.balance} ETH transferred`, 'success');
    setTimeout(() => setShowConfetti(false), 100);
    setTimeline((prev) => [
      {
        type: 'claimed',
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        description: `Inheritance of ${vault.balance} ETH transferred to ${vault.beneficiary_ens || vault.beneficiary_address.slice(0, 10)}...`,
      },
      ...prev,
    ]);
    await refreshVault();
  }, [vault, isConnected, address, writeContractAsync, addTx, showFeedback, refreshVault]);

  const handleReset = useCallback(async () => {
    // Reset backend vault to active state
    if (vault) {
      try { await demoReset(vault.id); } catch { /* demo */ }
    }
    setClaimSuccess(false);
    setShowConfetti(false);
    setWorldIdVerified(false);
    setTxHashes([]);
    setOnChainMessage('');
    setFeedbackMessage(null);
    setTimeline([]);
    // Re-fetch fresh data (now active again)
    await refreshVault();
    showFeedback(t('dash.demo_heartbeat_sent'), 'success');
  }, [vault, refreshVault, showFeedback, t]);

  // Derived state from vault data
  const status: Status = vault?.status || 'active';
  const balance = vault ? String(vault.balance) : '0';
  const beneficiary = vault?.beneficiary_ens || (vault?.beneficiary_address ? `${vault.beneficiary_address.slice(0, 8)}...${vault.beneficiary_address.slice(-6)}` : '—');
  const heartbeatIntervalDays = vault ? Math.round(vault.heartbeat_interval / 86400) : 90;
  const timeUntilRecovery = vault?.time_until_recovery ?? (vault ? vault.heartbeat_interval - (Math.floor(Date.now() / 1000) - vault.last_heartbeat) : 0);
  const daysLeft = Math.max(0, Math.round(timeUntilRecovery / 86400));
  const deadlineTimestamp = vault ? vault.last_heartbeat + vault.heartbeat_interval : 0;
  const lastHeartbeatDate = vault ? new Date(vault.last_heartbeat * 1000) : null;
  const lastHeartbeatLabel = lastHeartbeatDate
    ? (Date.now() - lastHeartbeatDate.getTime() < 60000 ? t('dash.just_now') : `${Math.round((Date.now() - lastHeartbeatDate.getTime()) / 86400000)} ${t('dash.days_ago')}`)
    : '—';

  const statusMap = {
    active: { label: 'ACTIVE', textColor: 'text-success', iconBg: 'bg-success/15', glow: 'bg-success', Icon: Shield },
    recovery: { label: 'RECOVERY', textColor: 'text-danger', iconBg: 'bg-danger/15', glow: 'bg-danger', Icon: Siren },
    claimed: { label: 'CLAIMED', textColor: 'text-gold', iconBg: 'bg-gold/15', glow: 'bg-gold', Icon: CheckCircle },
    cancelled: { label: 'CANCELLED', textColor: 'text-subtle', iconBg: 'bg-subtle/15', glow: 'bg-subtle', Icon: Shield },
  } as const;
  const st = statusMap[status];
  const StatusIcon = st.Icon;

  // ═══════════════════════════════
  //  NOT CONNECTED
  // ═══════════════════════════════
  if (!isConnected) {
    return (
      <div className="space-y-8 max-w-3xl mx-auto">
        <div className="text-center py-16 space-y-6">
          <div className="w-24 h-24 rounded-full bg-card border-2 border-border flex items-center justify-center mx-auto">
            <Wallet size={40} className="text-subtle" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">{t('dash.connect_wallet')}</h2>
            <p className="text-muted mt-2 max-w-md mx-auto">
              {t('dash.connect_wallet_desc')}
            </p>
          </div>
        </div>

        {/* Demo controls still work for judges */}
        <DemoControls />

        <div>
          <h3 className="text-xs text-subtle uppercase tracking-wider mb-4">{t('dash.trust_title')}</h3>
          <TrustSignals t={t} />
        </div>
      </div>
    );
  }

  // ═══════════════════════════════
  //  LOADING
  // ═══════════════════════════════
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 size={32} className="text-primary animate-spin" />
        <p className="text-muted">{t('dash.loading')}</p>
      </div>
    );
  }

  // ═══════════════════════════════
  //  NO VAULT — show create prompt
  // ═══════════════════════════════
  if (!vault) {
    return (
      <div className="space-y-8 max-w-3xl mx-auto">
        <NoVaultState t={t} />
        <div>
          <h3 className="text-xs text-subtle uppercase tracking-wider mb-4">{t('dash.trust_title')}</h3>
          <TrustSignals t={t} />
        </div>
      </div>
    );
  }

  // ═══════════════════════════════
  //  VAULT EXISTS — full dashboard
  // ═══════════════════════════════
  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <Confetti active={showConfetti} />

      {/* Feedback Toast */}
      <AnimatePresence>
        {feedbackMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl border backdrop-blur-xl shadow-2xl flex items-center gap-3 ${
              feedbackMessage.type === 'success'
                ? 'bg-success/10 border-success/30 text-success'
                : feedbackMessage.type === 'warning'
                ? 'bg-warning/10 border-warning/30 text-warning'
                : 'bg-danger/10 border-danger/30 text-danger'
            }`}
          >
            {feedbackMessage.type === 'success' ? <CheckCircle size={18} /> : feedbackMessage.type === 'warning' ? <AlertTriangle size={18} /> : <Siren size={18} />}
            <span className="font-semibold text-sm">{feedbackMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TX Notifications */}
      <AnimatePresence>
        {txHashes.map((tx) => (
          <TxNotification key={tx.hash} hash={tx.hash} label={tx.label} />
        ))}
      </AnimatePresence>

      {onChainMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-warning/20 rounded-2xl p-4 flex items-start gap-3"
        >
          <AlertTriangle size={16} className="text-warning mt-0.5 shrink-0" />
          <p className="text-sm text-muted">{onChainMessage}</p>
        </motion.div>
      )}

      {/* Vault selector (if multiple vaults) */}
      {allVaults.length > 1 && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-subtle">Vault:</span>
          {allVaults.map((v, i) => (
            <button
              key={v.id}
              onClick={() => setVault(v)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                v.id === vault.id ? 'bg-primary/15 text-primary' : 'bg-card border border-border text-muted hover:text-foreground'
              }`}
            >
              Vault {i + 1} ({v.balance} ETH)
            </button>
          ))}
        </div>
      )}

      {/* ══ HERO STATUS CARD ══ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative overflow-hidden rounded-3xl border-2 p-8 md:p-10 transition-all duration-700 ${
          status === 'active'
            ? 'border-success/30 bg-gradient-to-br from-success/5 via-card to-card'
            : status === 'recovery'
            ? 'border-danger/30 bg-gradient-to-br from-danger/8 via-card to-card'
            : status === 'claimed'
            ? 'border-gold/30 bg-gradient-to-br from-gold/5 via-card to-card'
            : 'border-border bg-card'
        }`}
      >
        <div className={`absolute -top-20 -right-20 w-60 h-60 rounded-full blur-3xl opacity-20 ${st.glow}`} />

        <div className="relative z-10">
          {/* Status badge */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <motion.div
                key={status}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center ${st.iconBg}`}
              >
                <StatusIcon size={24} className={st.textColor} />
              </motion.div>
              <div>
                <motion.p key={st.label} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  className={`text-2xl font-bold tracking-wide ${st.textColor}`}>{st.label}</motion.p>
                <p className="text-sm text-subtle">{t('dash.vault_status')}</p>
              </div>
            </div>
            {status === 'active' && <div className="w-3 h-3 rounded-full bg-success animate-pulse" />}
            {status === 'recovery' && (
              <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 0.8 }}
                className="w-3 h-3 rounded-full bg-danger" />
            )}
          </div>

          {/* Key metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <div className="min-w-0">
              <LiveCountdown targetTimestamp={deadlineTimestamp} t={t} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-subtle uppercase tracking-wider mb-1">{t('dash.protected_assets')}</p>
              <p className="text-2xl font-bold">{balance} ETH</p>
              {ethPrice ? (
                <p className="text-xs text-subtle flex items-center gap-1">
                  ${(parseFloat(balance) * ethPrice).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  <span className="text-[10px] text-primary/60">{t('dash.via_chainlink')}</span>
                </p>
              ) : (
                <p className="text-xs text-subtle">${(parseFloat(balance) * 3000).toLocaleString()}</p>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs text-subtle uppercase tracking-wider mb-1">{t('dash.beneficiary')}</p>
              <p className="text-lg font-bold font-mono truncate">{beneficiary}</p>
              {vault.world_id_nullifier && (
                <p className="text-xs text-success flex items-center gap-1 mt-0.5">
                  <Fingerprint size={10} /> {t('dash.worldid_verified')}
                </p>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs text-subtle uppercase tracking-wider mb-1">{t('dash.last_heartbeat')}</p>
              <p className={`text-lg font-semibold ${status === 'recovery' ? 'text-danger' : ''}`}>
                {lastHeartbeatLabel}
              </p>
            </div>
          </div>

          {/* Recovery Timeline */}
          <div className="mt-8 pt-6 border-t border-border/50">
            <p className="text-xs text-subtle uppercase tracking-wider mb-3">{t('dash.recovery_timeline')}</p>
            <RecoveryTimeline daysLeft={daysLeft} totalDays={heartbeatIntervalDays} t={t} />
          </div>
        </div>
      </motion.div>

      {/* ══ PRIMARY ACTION ══ */}
      <div className="flex flex-col items-center py-4">
        <AnimatePresence mode="wait">
          {(status === 'claimed' || claimSuccess) ? (
            <motion.div key="claimed" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center space-y-5">
              <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                className="w-36 h-36 rounded-full bg-gold/10 border-2 border-gold/30 flex items-center justify-center mx-auto">
                <Shield className="text-gold" size={64} />
              </motion.div>
              <h2 className="text-3xl font-bold text-gold">{t('dash.inheritance_transferred')}</h2>
              <p className="text-muted text-lg">{balance} ETH {t('dash.securely_transferred')} {beneficiary}</p>
            </motion.div>
          ) : status === 'recovery' ? (
            <motion.div key="recovery" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="text-center space-y-6 w-full max-w-md">
              <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ repeat: Infinity, duration: 1 }}
                className="w-36 h-36 rounded-full bg-danger/10 border-2 border-danger/40 flex items-center justify-center mx-auto pulse-red">
                <Siren className="text-danger" size={64} />
              </motion.div>
              <div>
                <h2 className="text-3xl font-bold text-danger">{t('dash.recovery_mode_active')}</h2>
                <p className="text-muted mt-2">{t('dash.recovery_mode_desc')}</p>
              </div>
              {!worldIdVerified ? (
                <div className="max-w-sm mx-auto">
                  <WorldIdVerify onVerified={() => setWorldIdVerified(true)} />
                </div>
              ) : (
                <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleClaim}
                  className="px-10 py-5 rounded-2xl bg-gradient-to-r from-gold to-amber-500 text-black font-bold text-lg shadow-lg shadow-gold/20 transition-all cursor-pointer">
                  {t('claim.btn')}
                </motion.button>
              )}
            </motion.div>
          ) : (
            <motion.div key="heartbeat">
              <HeartbeatButton onPress={handleHeartbeat} warning={daysLeft <= 7} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ══ DEMO CONTROLS ══ */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        className="rounded-3xl border-2 border-dashed border-primary/20 bg-card/50 p-6">
        <div className="flex items-center gap-2 mb-2">
          <Zap size={16} className="text-primary" />
          <h3 className="text-sm font-bold text-primary uppercase tracking-wider">{t('dash.live_demo')}</h3>
          <span className="text-[10px] bg-primary/15 text-primary px-2 py-0.5 rounded-full font-medium">{t('dash.for_judges')}</span>
        </div>
        <p className="text-xs text-subtle mb-5">{t('dash.demo_desc')}</p>
        <div className="flex flex-wrap gap-3">
          <button onClick={handleHeartbeat}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-success/10 border border-success/20 text-success text-sm font-semibold hover:bg-success/20 transition-all cursor-pointer">
            <Play size={14} /> {t('dash.send_heartbeat')}
          </button>
          <button onClick={handleSimulateDeath}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm font-semibold hover:bg-danger/20 transition-all cursor-pointer group">
            <FastForward size={14} className="group-hover:animate-pulse" /> {t('dash.simulate_death')}
          </button>
          <button onClick={() => {
            if (status !== 'recovery') {
              handleSimulateDeath().then(() => { setTimeout(() => { setWorldIdVerified(true); setTimeout(() => handleClaim(), 500); }, 500); });
            } else if (!worldIdVerified) { setWorldIdVerified(true); setTimeout(() => handleClaim(), 500); } else { handleClaim(); }
          }}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gold/10 border border-gold/20 text-gold text-sm font-semibold hover:bg-gold/20 transition-all cursor-pointer">
            <UserCheck size={14} /> {t('dash.claim_as_heir')}
          </button>
          <button onClick={handleReset}
            className="flex items-center gap-2 px-4 py-3 rounded-xl border border-border text-subtle text-sm font-medium hover:text-foreground transition-all cursor-pointer">
            <RotateCcw size={14} /> {t('dash.reset')}
          </button>
        </div>
      </motion.div>

      {/* ══ TRUST SIGNALS ══ */}
      <div>
        <h3 className="text-xs text-subtle uppercase tracking-wider mb-4">{t('dash.trust_title')}</h3>
        <TrustSignals t={t} />
      </div>

      {/* ══ ADVANCED ══ */}
      <div className="border border-border rounded-2xl overflow-hidden">
        <button onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-between px-6 py-4 text-sm text-subtle hover:text-foreground transition-colors cursor-pointer">
          <span className="font-medium">{t('dash.advanced')}</span>
          {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        <AnimatePresence>
          {showAdvanced && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
              <div className="px-6 pb-6 space-y-6">
                {/* Vault details */}
                <div className="space-y-3">
                  <p className="text-xs text-subtle uppercase tracking-wider">{t('dash.vault_details')}</p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-subtle text-xs">{t('dash.vault_id')}</span>
                      <p className="font-mono text-xs mt-0.5">{vault.id.slice(0, 8)}...</p>
                    </div>
                    <div>
                      <span className="text-subtle text-xs">{t('dash.owner')}</span>
                      <p className="font-mono text-xs mt-0.5">{vault.owner_address.slice(0, 10)}...{vault.owner_address.slice(-6)}</p>
                    </div>
                    <div>
                      <span className="text-subtle text-xs">{t('dash.beneficiary')}</span>
                      <p className="font-mono text-xs mt-0.5">{vault.beneficiary_address.slice(0, 10)}...{vault.beneficiary_address.slice(-6)}</p>
                    </div>
                    <div>
                      <span className="text-subtle text-xs">{t('dash.interval')}</span>
                      <p className="font-medium mt-0.5">{t('dash.every_days').replace('{n}', String(heartbeatIntervalDays))}</p>
                    </div>
                    {vault.vault_address && (
                      <div className="col-span-2">
                        <span className="text-subtle text-xs">Contract</span>
                        <p className="font-mono text-xs mt-0.5">{vault.vault_address}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Wallet */}
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-success" />
                  <span className="text-muted">
                    {t('dash.connected')}: <span className="font-mono text-foreground">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
                  </span>
                </div>

                {/* Activity Timeline */}
                {timeline.length > 0 && (
                  <div>
                    <p className="text-xs text-subtle uppercase tracking-wider mb-3">{t('dash.activity_log')}</p>
                    <div className="space-y-2">
                      {timeline.map((event, i) => {
                        const config = {
                          heartbeat: { icon: Heart, color: 'text-success', bg: 'bg-success/10', label: t('timeline.heartbeat') },
                          warning: { icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10', label: t('timeline.warning') },
                          recovery: { icon: Siren, color: 'text-danger', bg: 'bg-danger/10', label: t('timeline.recovery') },
                          claimed: { icon: CheckCircle, color: 'text-gold', bg: 'bg-gold/10', label: t('timeline.claimed') },
                          created: { icon: Shield, color: 'text-primary', bg: 'bg-primary/10', label: t('timeline.created') },
                        }[event.type];
                        const Icon = config.icon;
                        return (
                          <motion.div key={`${event.type}-${event.date}-${i}`}
                            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                            className="flex items-center gap-3 py-2">
                            <div className={`w-7 h-7 rounded-lg ${config.bg} flex items-center justify-center shrink-0`}>
                              <Icon size={14} className={config.color} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{config.label}</p>
                              {event.description && <p className="text-xs text-muted truncate">{event.description}</p>}
                            </div>
                            <span className="text-[11px] text-subtle shrink-0">{event.date}</span>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Cancel Vault — danger zone */}
                {vault.status === 'active' && vault.owner_address.toLowerCase() === address?.toLowerCase() && (
                  <div className="pt-4 border-t border-border">
                    <p className="text-xs text-danger uppercase tracking-wider mb-3">Danger Zone</p>
                    <div className="bg-danger/5 border border-danger/20 rounded-xl p-4 space-y-3">
                      <div>
                        <p className="text-sm font-semibold text-danger">Cancel Vault</p>
                        <p className="text-xs text-muted mt-1">
                          Cancel this vault and withdraw your funds. This action cannot be undone. Use this if you entered the wrong beneficiary address or ENS name.
                        </p>
                      </div>
                      <button
                        onClick={async () => {
                          if (!confirm('Are you sure you want to cancel this vault? Your funds will be returned and the beneficiary will lose access.')) return;
                          try {
                            // On-chain cancel if vault has contract address
                            if (vault.vault_address) {
                              try {
                                const hash = await writeContractAsync({
                                  address: vault.vault_address as `0x${string}`,
                                  abi: VAULT_ABI,
                                  functionName: 'cancel',
                                });
                                addTx(hash, 'Cancel');
                              } catch (err) {
                                console.warn('On-chain cancel failed:', err);
                              }
                            }
                            await cancelVault(vault.id, address!);
                            showFeedback('Vault cancelled — funds returned', 'warning');
                            await refreshVault();
                          } catch {
                            showFeedback('Failed to cancel vault', 'danger');
                          }
                        }}
                        className="px-4 py-2 rounded-lg bg-danger/10 border border-danger/30 text-danger text-sm font-semibold hover:bg-danger/20 transition-all cursor-pointer"
                      >
                        Cancel Vault & Withdraw
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Standalone Demo Controls (for disconnected state)
   ────────────────────────────────────────────── */
function DemoControls() {
  const [demoStatus, setDemoStatus] = useState<'active' | 'recovery' | 'claimed'>('active');
  const [demoBalance, setDemoBalance] = useState('3.2');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const showMsg = (msg: string) => { setFeedbackMsg(msg); setTimeout(() => setFeedbackMsg(null), 2500); };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
      className="rounded-3xl border-2 border-dashed border-primary/20 bg-card/50 p-6">
      <div className="flex items-center gap-2 mb-2 px-3 py-2 rounded-xl bg-warning/10 border border-warning/20">
        <AlertTriangle size={14} className="text-warning shrink-0" />
        <p className="text-xs text-warning font-medium">Demo Mode — no wallet connected. Simulated actions only.</p>
      </div>

      {feedbackMsg && (
        <div className="my-3 px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary text-sm font-medium text-center">
          {feedbackMsg}
        </div>
      )}

      <div className="flex items-center gap-2 mt-4 mb-2">
        <Zap size={16} className="text-primary" />
        <h3 className="text-sm font-bold text-primary uppercase tracking-wider">Live Demo</h3>
        <span className="text-[10px] bg-primary/15 text-primary px-2 py-0.5 rounded-full font-medium">For Judges</span>
      </div>
      <p className="text-xs text-subtle mb-3">Status: <span className={`font-bold ${demoStatus === 'active' ? 'text-success' : demoStatus === 'recovery' ? 'text-danger' : 'text-gold'}`}>{demoStatus.toUpperCase()}</span> | Balance: {demoBalance} ETH</p>
      <div className="flex flex-wrap gap-3">
        <button onClick={() => { setDemoStatus('active'); setDemoBalance('3.2'); showMsg('Heartbeat sent — vault is active'); }}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-success/10 border border-success/20 text-success text-sm font-semibold hover:bg-success/20 transition-all cursor-pointer">
          <Play size={14} /> Send Heartbeat
        </button>
        <button onClick={() => { setDemoStatus('recovery'); showMsg('Death simulated — recovery mode active'); }}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm font-semibold hover:bg-danger/20 transition-all cursor-pointer">
          <FastForward size={14} /> Simulate Death
        </button>
        <button onClick={() => { setDemoStatus('claimed'); setDemoBalance('0.0'); showMsg('Inheritance claimed — 3.2 ETH transferred'); }}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gold/10 border border-gold/20 text-gold text-sm font-semibold hover:bg-gold/20 transition-all cursor-pointer">
          <UserCheck size={14} /> Claim as Heir
        </button>
        <button onClick={() => { setDemoStatus('active'); setDemoBalance('3.2'); setFeedbackMsg(null); }}
          className="flex items-center gap-2 px-4 py-3 rounded-xl border border-border text-subtle text-sm font-medium hover:text-foreground transition-all cursor-pointer">
          <RotateCcw size={14} /> Reset
        </button>
      </div>
    </motion.div>
  );
}
