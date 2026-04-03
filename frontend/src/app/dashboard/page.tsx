'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, Clock, Coins, User, Shield, Siren,
  Play, FastForward, UserCheck, Zap
} from 'lucide-react';
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

export default function DashboardPage() {
  const [status, setStatus] = useState<Status>('ACTIVE');
  const [lastHeartbeat, setLastHeartbeat] = useState('15 days ago');
  const [daysLeft, setDaysLeft] = useState(75);
  const [balance, setBalance] = useState('3.2');
  const [showConfetti, setShowConfetti] = useState(false);
  const [worldIdVerified, setWorldIdVerified] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);
  const [timeline, setTimeline] = useState<TimelineItem[]>([
    { type: 'heartbeat', date: 'March 19, 2026 — 14:22 UTC', description: 'Heartbeat confirmed on-chain' },
    { type: 'heartbeat', date: 'February 17, 2026 — 09:15 UTC', description: 'Heartbeat confirmed on-chain' },
    { type: 'heartbeat', date: 'January 18, 2026 — 11:03 UTC', description: 'Heartbeat confirmed on-chain' },
    { type: 'created', date: 'December 15, 2025 — 16:45 UTC', description: 'Vault created with 3.2 ETH deposit' },
  ]);

  const targetDate = new Date(Date.now() + daysLeft * 24 * 60 * 60 * 1000);

  const handleHeartbeat = useCallback(async () => {
    try {
      await sendHeartbeat(DEMO_VAULT, DEMO_OWNER);
    } catch {
      // Mock for demo
    }
    const now = new Date().toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    }) + ' — ' + new Date().toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
    });

    setStatus('ACTIVE');
    setLastHeartbeat('Just now');
    setDaysLeft(90);
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 100);
    setTimeline((prev) => [
      { type: 'heartbeat', date: now, description: 'Heartbeat confirmed on-chain' },
      ...prev,
    ]);
  }, []);

  const handleSimulateDeath = useCallback(async () => {
    try {
      await simulateDeath(DEMO_VAULT);
    } catch {
      // Mock for demo
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
  }, []);

  const handleClaim = useCallback(async () => {
    try {
      await claimInheritance(DEMO_VAULT, 'wife.eth');
    } catch {
      // Mock for demo
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
  }, []);

  const handleReset = useCallback(() => {
    setStatus('ACTIVE');
    setLastHeartbeat('15 days ago');
    setDaysLeft(75);
    setBalance('3.2');
    setShowConfetti(false);
    setWorldIdVerified(false);
    setClaimSuccess(false);
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
          <h1 className="text-3xl font-bold">Vault Dashboard</h1>
          <p className="text-muted mt-1">Monitor and manage your inheritance vault</p>
        </div>
        <VaultStatusBadge status={status} />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-2xl p-5 space-y-2">
          <div className="flex items-center gap-2 text-subtle text-sm">
            <Heart size={14} className="text-success" />
            Last Heartbeat
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
            Balance
          </div>
          <p className="text-lg font-bold">{balance} ETH</p>
          <p className="text-xs text-subtle">${(parseFloat(balance) * 3000).toLocaleString()}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5 space-y-2">
          <div className="flex items-center gap-2 text-subtle text-sm">
            <User size={14} className="text-gold" />
            Beneficiary
          </div>
          <p className="text-lg font-bold font-mono">wife.eth</p>
          <p className="text-xs text-success">World ID verified</p>
        </div>
      </div>

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
              <h2 className="text-2xl font-bold text-gold">Inheritance Transferred</h2>
              <p className="text-muted">3.2 ETH has been securely transferred to wife.eth</p>
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
                <h2 className="text-2xl font-bold text-danger">RECOVERY MODE ACTIVE</h2>
                <p className="text-muted mt-2">
                  The vault owner has not checked in for 93 days.
                  <br />
                  Chainlink Automation has triggered recovery.
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
                  Claim Inheritance
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

      {/* Timeline */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
          <Clock size={18} className="text-primary" />
          Activity Timeline
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
          <h3 className="text-lg font-bold">Demo Controls</h3>
          <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">For Judges</span>
        </div>
        <p className="text-sm text-muted mb-6">
          Click these buttons to simulate the full lifecycle of a DeadSwitch vault.
        </p>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={handleHeartbeat}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-success/15 border border-success/30 text-success font-medium hover:bg-success/25 transition-colors cursor-pointer"
          >
            <Play size={16} />
            Send Heartbeat
          </button>
          <button
            onClick={handleSimulateDeath}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-danger/15 border border-danger/30 text-danger font-medium hover:bg-danger/25 transition-colors cursor-pointer"
          >
            <FastForward size={16} />
            Simulate Death (90 days)
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
            Claim as Heir
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-card border border-border text-muted font-medium hover:text-foreground transition-colors cursor-pointer"
          >
            Reset Demo
          </button>
        </div>
      </div>
    </div>
  );
}
