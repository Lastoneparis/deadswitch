'use client';

import { motion } from 'framer-motion';
import {
  Shield, Heart, Clock, Link as LinkIcon, ScanFace,
  Coins, ArrowDown, CheckCircle, Zap
} from 'lucide-react';

const flowSteps = [
  {
    icon: Shield,
    title: 'Vault Owner Creates Vault',
    description: 'Connects wallet, sets beneficiary address, deposits ETH, and chooses a heartbeat interval (30/60/90 days). Smart contract deploys on-chain.',
    color: 'text-primary',
    bg: 'bg-primary/15',
    border: 'border-primary/30',
  },
  {
    icon: Heart,
    title: 'Owner Sends Heartbeats',
    description: 'The owner periodically signs a transaction to prove they are alive and in control. Each heartbeat resets the countdown timer.',
    color: 'text-success',
    bg: 'bg-success/15',
    border: 'border-success/30',
  },
  {
    icon: Clock,
    title: 'Chainlink Monitors Deadlines',
    description: 'Chainlink Automation continuously monitors the vault. If the heartbeat deadline passes without a check-in, it triggers recovery mode.',
    color: 'text-warning',
    bg: 'bg-warning/15',
    border: 'border-warning/30',
  },
  {
    icon: Zap,
    title: 'Recovery Mode Activates',
    description: 'When the owner stops checking in, the vault enters RECOVERY MODE. The beneficiary is notified and can now initiate a claim.',
    color: 'text-danger',
    bg: 'bg-danger/15',
    border: 'border-danger/30',
  },
  {
    icon: ScanFace,
    title: 'World ID Verification',
    description: 'The beneficiary verifies their identity using World ID, proving they are a unique human and the rightful heir.',
    color: 'text-primary',
    bg: 'bg-primary/15',
    border: 'border-primary/30',
  },
  {
    icon: Coins,
    title: 'Inheritance Claimed',
    description: 'After verification, the smart contract releases all funds to the beneficiary. The inheritance is transferred on-chain, trustlessly.',
    color: 'text-gold',
    bg: 'bg-gold/15',
    border: 'border-gold/30',
  },
];

const techStack = [
  {
    name: 'Chainlink Automation',
    description: 'Monitors heartbeat deadlines and triggers recovery mode automatically, with no centralized server.',
    icon: LinkIcon,
  },
  {
    name: 'World ID',
    description: 'Sybil-resistant identity verification ensures only the real beneficiary can claim inheritance.',
    icon: ScanFace,
  },
  {
    name: 'Solidity Smart Contracts',
    description: 'All vault logic, deposits, heartbeats, and claims are handled entirely on-chain.',
    icon: Shield,
  },
  {
    name: 'ENS Resolution',
    description: 'Beneficiaries can be specified by ENS name (e.g., wife.eth) for human-readable addresses.',
    icon: CheckCircle,
  },
];

export default function HowItWorksPage() {
  return (
    <div className="space-y-16 py-10 max-w-3xl mx-auto">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">How DeadSwitch Works</h1>
        <p className="text-lg text-muted max-w-xl mx-auto">
          A decentralized dead man&apos;s switch for crypto inheritance.
          No lawyers. No custodians. Just smart contracts.
        </p>
      </div>

      {/* Flow Diagram */}
      <section className="space-y-2">
        {flowSteps.map((step, i) => {
          const Icon = step.icon;
          return (
            <div key={step.title}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`bg-card border ${step.border} rounded-2xl p-6 flex items-start gap-5`}
              >
                <div className={`w-14 h-14 rounded-2xl ${step.bg} flex items-center justify-center shrink-0`}>
                  <Icon size={26} className={step.color} />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-subtle tracking-widest">STEP {i + 1}</span>
                  </div>
                  <h3 className="text-lg font-bold mt-1">{step.title}</h3>
                  <p className="text-sm text-muted mt-2 leading-relaxed">{step.description}</p>
                </div>
              </motion.div>
              {i < flowSteps.length - 1 && (
                <div className="flex justify-center py-1">
                  <ArrowDown size={20} className="text-border" />
                </div>
              )}
            </div>
          );
        })}
      </section>

      {/* Tech Stack */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-center">Technology Stack</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {techStack.map((tech) => {
            const Icon = tech.icon;
            return (
              <motion.div
                key={tech.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card border border-border rounded-2xl p-5 space-y-3 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Icon size={18} className="text-primary" />
                  </div>
                  <h3 className="font-bold">{tech.name}</h3>
                </div>
                <p className="text-sm text-muted leading-relaxed">{tech.description}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="text-center bg-card border border-border rounded-2xl p-10 space-y-4">
        <h2 className="text-2xl font-bold">Ready to Protect Your Crypto Legacy?</h2>
        <p className="text-muted">Set up takes less than 2 minutes.</p>
        <a
          href="/create"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-primary hover:bg-primary/90 text-white font-semibold text-lg transition-all"
        >
          Create Your Vault
        </a>
      </section>
    </div>
  );
}
