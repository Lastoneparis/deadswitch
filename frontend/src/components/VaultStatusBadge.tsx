'use client';

import { motion } from 'framer-motion';
import { Shield, AlertTriangle, Siren, Award } from 'lucide-react';

type Status = 'ACTIVE' | 'WARNING' | 'RECOVERY' | 'CLAIMED';

const statusConfig: Record<Status, {
  label: string;
  color: string;
  bg: string;
  border: string;
  glow: string;
  icon: typeof Shield;
}> = {
  ACTIVE: {
    label: 'ACTIVE',
    color: 'text-success',
    bg: 'bg-success/15',
    border: 'border-success/30',
    glow: 'pulse-green',
    icon: Shield,
  },
  WARNING: {
    label: 'WARNING',
    color: 'text-warning',
    bg: 'bg-warning/15',
    border: 'border-warning/30',
    glow: 'pulse-amber',
    icon: AlertTriangle,
  },
  RECOVERY: {
    label: 'RECOVERY MODE',
    color: 'text-danger',
    bg: 'bg-danger/15',
    border: 'border-danger/30',
    glow: 'pulse-red',
    icon: Siren,
  },
  CLAIMED: {
    label: 'CLAIMED',
    color: 'text-gold',
    bg: 'bg-gold/15',
    border: 'border-gold/30',
    glow: '',
    icon: Award,
  },
};

export default function VaultStatusBadge({ status }: { status: Status }) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      key={status}
      className={`inline-flex items-center gap-3 px-6 py-3 rounded-2xl ${config.bg} border ${config.border} ${config.glow}`}
    >
      <Icon className={config.color} size={24} />
      <span className={`text-xl font-bold tracking-wider ${config.color}`}>
        {config.label}
      </span>
    </motion.div>
  );
}
