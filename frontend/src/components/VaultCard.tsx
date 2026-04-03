'use client';

import { Shield, User, Coins, Clock } from 'lucide-react';
import VaultStatusBadge from './VaultStatusBadge';

interface VaultCardProps {
  owner: string;
  beneficiary: string;
  balance: string;
  balanceUsd: string;
  status: 'ACTIVE' | 'WARNING' | 'RECOVERY' | 'CLAIMED';
  lastHeartbeat: string;
  worldIdVerified?: boolean;
}

export default function VaultCard({
  owner,
  beneficiary,
  balance,
  balanceUsd,
  status,
  lastHeartbeat,
  worldIdVerified,
}: VaultCardProps) {
  return (
    <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Shield size={18} className="text-primary" />
          Vault Overview
        </h3>
        <VaultStatusBadge status={status} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <p className="text-xs text-subtle flex items-center gap-1">
            <User size={12} /> Owner
          </p>
          <p className="text-sm font-mono">{owner}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-subtle flex items-center gap-1">
            <User size={12} /> Beneficiary
          </p>
          <p className="text-sm font-mono">
            {beneficiary}
            {worldIdVerified && (
              <span className="ml-2 text-xs text-success">World ID verified</span>
            )}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-subtle flex items-center gap-1">
            <Coins size={12} /> Balance
          </p>
          <p className="text-sm font-semibold">
            {balance} ETH <span className="text-subtle font-normal">({balanceUsd})</span>
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-subtle flex items-center gap-1">
            <Clock size={12} /> Last Heartbeat
          </p>
          <p className="text-sm">{lastHeartbeat}</p>
        </div>
      </div>
    </div>
  );
}
