'use client';

import { motion } from 'framer-motion';
import { Shield, Heart, Clock, UserCheck, ArrowRight, Link as LinkIcon } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getStats } from '@/lib/api';

const steps = [
  {
    icon: Shield,
    title: 'Set Up',
    description: 'Connect your wallet, add a beneficiary address, and deposit your funds into a secure vault.',
    color: 'text-primary',
    bg: 'bg-primary/15',
  },
  {
    icon: Heart,
    title: 'Stay Active',
    description: 'Sign a heartbeat periodically to prove you are alive and in control. Simple as one click.',
    color: 'text-success',
    bg: 'bg-success/15',
  },
  {
    icon: Clock,
    title: 'Protected',
    description: 'If you stop checking in, Chainlink Automation triggers recovery. Your heir claims with World ID.',
    color: 'text-gold',
    bg: 'bg-gold/15',
  },
];

const sponsors = [
  { name: 'Chainlink' },
  { name: 'World' },
  { name: 'Ledger' },
  { name: '0G' },
  { name: 'ENS' },
  { name: 'Flare' },
];

export default function Home() {
  const [stats, setStats] = useState({ vaults: 12, protected: '42.5', heartbeats: 156 });

  useEffect(() => {
    getStats()
      .then((s) => setStats(s))
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-20 py-10">
      {/* Hero */}
      <section className="text-center space-y-8 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
            <LinkIcon size={14} />
            ETHGlobal Cannes 2026
          </div>

          <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
            Your Crypto Shouldn&apos;t{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-gold">
              Die With You
            </span>
          </h1>

          <p className="text-xl text-muted mt-6 max-w-2xl mx-auto leading-relaxed">
            Decentralized inheritance for the blockchain era.
            If you stop checking in, your family recovers your funds.
            Chainlink-automated. World ID-verified. On-chain.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            href="/create"
            className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-primary hover:bg-primary/90 text-white font-semibold text-lg transition-all hover:shadow-lg hover:shadow-primary/25"
          >
            Create Your Vault
            <ArrowRight size={20} />
          </Link>
          <Link
            href="/claim"
            className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-card border border-border hover:border-gold/50 text-foreground font-semibold text-lg transition-all"
          >
            <UserCheck size={20} className="text-gold" />
            I&apos;m a Beneficiary
          </Link>
        </motion.div>
      </section>

      {/* 3 Steps */}
      <section>
        <h2 className="text-center text-2xl font-bold mb-10">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 * i }}
                className="bg-card border border-border rounded-2xl p-8 text-center space-y-4 hover:border-primary/30 transition-colors"
              >
                <div className={`w-16 h-16 rounded-2xl ${step.bg} flex items-center justify-center mx-auto`}>
                  <Icon size={28} className={step.color} />
                </div>
                <div className="text-xs font-bold text-subtle tracking-widest uppercase">
                  Step {i + 1}
                </div>
                <h3 className="text-xl font-bold">{step.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{step.description}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Stats Bar */}
      <section>
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="grid grid-cols-3 divide-x divide-border text-center">
            <div>
              <p className="text-3xl font-bold text-primary">{stats.vaults}</p>
              <p className="text-sm text-subtle mt-1">Vaults Created</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-success">{stats.protected} ETH</p>
              <p className="text-sm text-subtle mt-1">Protected</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-gold">{stats.heartbeats}</p>
              <p className="text-sm text-subtle mt-1">Heartbeats</p>
            </div>
          </div>
        </div>
      </section>

      {/* Sponsors */}
      <section className="text-center space-y-6">
        <p className="text-sm text-subtle uppercase tracking-widest font-medium">Built With</p>
        <div className="flex flex-wrap items-center justify-center gap-8">
          {sponsors.map((s) => (
            <div
              key={s.name}
              className="px-6 py-3 rounded-xl bg-card border border-border text-muted text-sm font-medium hover:border-primary/30 transition-colors"
            >
              {s.name}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
