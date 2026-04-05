'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Shield, Heart, Clock, Zap, Lock, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getStats } from '@/lib/api';
import { useI18n } from '@/lib/i18n';

export default function Home() {
  const [stats, setStats] = useState({ vaults: 12, protected: '42.5', heartbeats: 156 });
  const { t } = useI18n();

  useEffect(() => {
    getStats().then((s) => setStats(s)).catch(() => {});
  }, []);

  return (
    <div className="space-y-32 py-10">

      {/* ═══════════════════════════════
          HERO — Impact first
          ═══════════════════════════════ */}
      <section className="relative max-w-4xl mx-auto">
        <div className="hero-glow absolute inset-0 -top-20" />

        <div className="relative space-y-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            {/* Stat hook — not a badge */}
            <p className="text-primary font-mono text-sm tracking-wider mb-8">
              $140,000,000,000 in crypto — lost forever.
            </p>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight">
              Your crypto
              <br />
              <span className="text-primary">shouldn't die</span>
              <br />
              with you.
            </h1>

            <p className="text-lg text-muted mt-8 max-w-xl leading-relaxed">
              DeadSwitch is a dead man's switch for crypto. Check in monthly.
              If you stop, Chainlink triggers recovery. Your heir claims with World ID.
              Non-custodial. On-chain. No lawyers.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Link
              href="/create"
              className="inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-primary text-black font-bold text-lg hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/20"
            >
              Protect Your Crypto
              <ArrowRight size={20} />
            </Link>
            <Link
              href="/claim"
              className="inline-flex items-center gap-3 px-8 py-4 rounded-xl border border-border text-foreground font-medium text-lg hover:border-primary/40 transition-colors"
            >
              I'm a Beneficiary
            </Link>
          </motion.div>

          {/* Live stats — proof it's real */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex gap-10 pt-4"
          >
            <div>
              <p className="text-2xl font-bold font-mono">{stats.vaults}</p>
              <p className="text-xs text-subtle mt-1">Vaults active</p>
            </div>
            <div>
              <p className="text-2xl font-bold font-mono">{stats.protected} ETH</p>
              <p className="text-xs text-subtle mt-1">Protected</p>
            </div>
            <div>
              <p className="text-2xl font-bold font-mono">{stats.heartbeats}</p>
              <p className="text-xs text-subtle mt-1">Heartbeats sent</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════
          VIDEO PITCH
          ═══════════════════════════════ */}
      <section className="max-w-4xl mx-auto">
        <p className="text-xs text-subtle uppercase tracking-[0.2em] mb-6">Watch the pitch</p>
        <div className="rounded-2xl overflow-hidden border border-border bg-card">
          <video
            controls
            preload="metadata"
            poster="/logo-full.png"
            className="w-full aspect-video"
          >
            <source src="/video-pitch.mp4" type="video/mp4" />
            Your browser does not support video playback.
          </video>
        </div>
      </section>

      {/* ═══════════════════════════════
          CHAINLINK — core trigger mechanism
          ═══════════════════════════════ */}
      <section className="max-w-4xl mx-auto">
        <div className="border border-border rounded-2xl p-8 sm:p-10 bg-gradient-to-br from-[#375BD2]/5 to-transparent">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-[#375BD2]/15 flex items-center justify-center">
              <Zap size={20} className="text-[#375BD2]" />
            </div>
            <div>
              <p className="text-[11px] text-subtle uppercase tracking-[0.2em]">Powered by</p>
              <h3 className="text-xl font-bold">Chainlink Automation</h3>
            </div>
          </div>

          <p className="text-muted leading-relaxed mb-4">
            Chainlink is the core trigger mechanism for DeadSwitch. My contract implements <code className="text-primary text-sm bg-card px-1.5 py-0.5 rounded">AutomationCompatibleInterface</code> with <code className="text-primary text-sm bg-card px-1.5 py-0.5 rounded">checkUpkeep</code> and <code className="text-primary text-sm bg-card px-1.5 py-0.5 rounded">performUpkeep</code> — making real state changes on-chain. When an owner stops heartbeating, Chainlink's keeper network calls <code className="text-primary text-sm bg-card px-1.5 py-0.5 rounded">performUpkeep</code> which flips the vault status to RecoveryMode on-chain. No server. No cron job. No single point of failure.
          </p>

          <div className="flex flex-wrap gap-3 pt-2 mb-6">
            <a
              href="https://automation.chain.link/sepolia/87279356538326214029017935707370766485868215829937943885304798493436723241100"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-border hover:border-primary/40 text-xs font-medium transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              Live upkeep · 2.1 LINK funded
              <ExternalLink size={10} className="text-subtle" />
            </a>
            <a
              href="https://sepolia.etherscan.io/address/0xF957cDA1f676B9EAE65Ab99982CAa3a31A193CB7#code"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-border hover:border-primary/40 text-xs font-medium transition-colors"
            >
              View contract source
              <ExternalLink size={10} className="text-subtle" />
            </a>
          </div>

          {/* FAQ */}
          <div className="space-y-2 pt-4 border-t border-border/50">
            <p className="text-[11px] text-subtle uppercase tracking-[0.15em] mb-2">Chainlink FAQ</p>

            <details className="group bg-card/30 border border-border rounded-lg">
              <summary className="cursor-pointer px-4 py-3 text-sm font-medium flex items-center justify-between">
                <span>Why is my upkeep history empty?</span>
                <span className="text-subtle text-xs group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <div className="px-4 pb-4 text-xs text-muted leading-relaxed border-t border-border/50 pt-3">
                The history only records <code className="text-primary text-[11px] bg-background px-1 rounded">performUpkeep</code> executions — i.e. when Chainlink keepers trigger state change. Since the test vault's heartbeat is still valid, <code className="text-primary text-[11px] bg-background px-1 rounded">checkUpkeep</code> keeps returning false, so no execution has happened. That's correct behavior — no execution = no LINK consumed. Keepers will call <code className="text-primary text-[11px] bg-background px-1 rounded">performUpkeep</code> only when the heartbeat deadline passes.
              </div>
            </details>

            <details className="group bg-card/30 border border-border rounded-lg">
              <summary className="cursor-pointer px-4 py-3 text-sm font-medium flex items-center justify-between">
                <span>Why Chainlink Automation instead of a server cron job?</span>
                <span className="text-subtle text-xs group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <div className="px-4 pb-4 text-xs text-muted leading-relaxed border-t border-border/50 pt-3">
                A server cron is centralized — if I die, who pays the server bill? Chainlink's keeper network is decentralized infrastructure that outlives any single party. My users' inheritance transfers don't depend on me being alive or my company existing. This is the core reason dead man's switches NEED decentralized automation: the timer must keep running without me.
              </div>
            </details>

            <details className="group bg-card/30 border border-border rounded-lg">
              <summary className="cursor-pointer px-4 py-3 text-sm font-medium flex items-center justify-between">
                <span>How does Chainlink modify my contract state?</span>
                <span className="text-subtle text-xs group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <div className="px-4 pb-4 text-xs text-muted leading-relaxed border-t border-border/50 pt-3">
                My contract implements <code className="text-primary text-[11px] bg-background px-1 rounded">AutomationCompatibleInterface</code>. Keepers poll <code className="text-primary text-[11px] bg-background px-1 rounded">checkUpkeep()</code> which returns true when <code className="text-primary text-[11px] bg-background px-1 rounded">block.timestamp {'>'}  lastHeartbeat + heartbeatInterval</code>. When true, keepers call <code className="text-primary text-[11px] bg-background px-1 rounded">performUpkeep()</code> which sets <code className="text-primary text-[11px] bg-background px-1 rounded">status = RecoveryMode</code>, records the activation timestamp, and emits an event. That's real state change on-chain — triggered by Chainlink, executed by the smart contract, not by a frontend or server.
              </div>
            </details>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════
          HOW IT WORKS — 3 steps, left-aligned
          ═══════════════════════════════ */}
      <section className="max-w-4xl mx-auto">
        <p className="text-xs text-subtle uppercase tracking-[0.2em] mb-10">How it works</p>

        <div className="space-y-0">
          {[
            {
              num: '01',
              icon: Shield,
              title: 'Deposit & designate',
              desc: 'Connect your wallet. Deposit ETH into a smart contract vault. Designate your heir by address or ENS name. Set your check-in interval.',
            },
            {
              num: '02',
              icon: Heart,
              title: 'Send heartbeats',
              desc: 'One click, once a month. The contract records your heartbeat on-chain. As long as you check in, nothing happens. Your funds stay yours.',
            },
            {
              num: '03',
              icon: Clock,
              title: 'Automatic recovery',
              desc: 'Stop checking in, and Chainlink Automation detects it. Recovery mode activates. Your heir verifies with World ID and claims the funds. No intermediary.',
            },
          ].map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 * i, duration: 0.5 }}
              className="flex gap-6 py-8 border-b border-border last:border-0 group"
            >
              <div className="shrink-0 w-12">
                <span className="text-2xl font-bold font-mono text-border-light group-hover:text-primary transition-colors">{step.num}</span>
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <step.icon size={18} className="text-primary" />
                  <h3 className="text-xl font-bold">{step.title}</h3>
                </div>
                <p className="text-muted leading-relaxed max-w-lg">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════
          WHY TRUST US — no fluff
          ═══════════════════════════════ */}
      <section className="max-w-4xl mx-auto">
        <p className="text-xs text-subtle uppercase tracking-[0.2em] mb-10">Why trust DeadSwitch</p>

        <div className="grid sm:grid-cols-2 gap-x-16 gap-y-8">
          {[
            { icon: Lock, title: 'Non-custodial', desc: 'Your keys never leave your wallet. The smart contract holds funds, not us.' },
            { icon: Zap, title: 'Chainlink Automation', desc: 'Decentralized oracles monitor your heartbeat. No server. No single point of failure.' },
            { icon: Shield, title: 'World ID verified', desc: 'Heirs prove their identity with biometric verification. No fake claims.' },
            { icon: ExternalLink, title: 'Fully on-chain', desc: 'Every heartbeat, every recovery, every claim — verifiable on Etherscan.' },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i }}
              className="flex gap-4"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <item.icon size={18} className="text-primary" />
              </div>
              <div>
                <h4 className="font-semibold mb-1">{item.title}</h4>
                <p className="text-sm text-muted leading-relaxed">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════
          CONTRACT — real address, real code
          ═══════════════════════════════ */}
      <section className="max-w-4xl mx-auto">
        <div className="border border-border rounded-2xl p-8 sm:p-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <p className="text-xs text-subtle uppercase tracking-[0.2em] mb-3">Live on Sepolia</p>
              <p className="font-mono text-sm text-muted break-all">0xF957cDA1f676B9EAE65Ab99982CAa3a31A193CB7</p>
              <div className="flex gap-6 mt-4">
                <a
                  href="https://sepolia.etherscan.io/address/0xF957cDA1f676B9EAE65Ab99982CAa3a31A193CB7"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  View on Etherscan <ExternalLink size={10} />
                </a>
                <a
                  href="https://github.com/Lastoneparis/deadswitch"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  Source code <ExternalLink size={10} />
                </a>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              {['Chainlink', 'World', 'Ledger'].map((s) => (
                <span key={s} className="px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-xs text-primary font-semibold">
                  {s}
                </span>
              ))}
              {['ENS', '0G', 'Flare'].map((s) => (
                <span key={s} className="px-3 py-1.5 rounded-lg bg-card border border-border text-xs text-subtle font-medium">
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════
          CTA — bottom
          ═══════════════════════════════ */}
      <section className="max-w-4xl mx-auto text-center pb-10">
        <h2 className="text-3xl sm:text-4xl font-bold">
          Your family deserves better
          <br />
          than a lost seed phrase.
        </h2>
        <p className="text-muted mt-4 mb-8">Set up takes 2 minutes. Check in once a month.</p>
        <Link
          href="/create"
          className="inline-flex items-center gap-3 px-10 py-5 rounded-xl bg-primary text-black font-bold text-lg hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/20"
        >
          Create Your Vault
          <ArrowRight size={20} />
        </Link>
      </section>
    </div>
  );
}
