'use client';

import { Shield, Monitor, CheckCircle2 } from 'lucide-react';
import { useAccount } from 'wagmi';
import { useEffect, useState } from 'react';

interface LedgerStatusProps {
  context?: 'heartbeat' | 'claim';
}

export default function LedgerStatus({ context }: LedgerStatusProps) {
  const { isConnected, connector } = useAccount();
  const [isLedger, setIsLedger] = useState(false);

  useEffect(() => {
    if (connector) {
      const name = (connector.name || '').toLowerCase();
      setIsLedger(name.includes('ledger') || name.includes('hardware'));
    }
  }, [connector]);

  const clearSignMessages: Record<string, { title: string; screen: string[] }> = {
    heartbeat: {
      title: 'Heartbeat',
      screen: [
        'Send heartbeat — prove you are alive',
        'Vault Owner: [your address]',
        'Time: [current timestamp]',
        'Status: alive',
        'Contract: 0xF957...CB7',
        'Chain: Sepolia (11155111)',
      ],
    },
    claim: {
      title: 'Claim Inheritance',
      screen: [
        'Claim inheritance from vault',
        'World ID Proof: [nullifier]',
        'Contract: 0xF957...CB7',
        'Chain: Sepolia (11155111)',
      ],
    },
  };

  const current = context ? clearSignMessages[context] : null;

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Shield size={16} className={isLedger ? 'text-green-400' : 'text-zinc-500'} />
        <span className="text-sm font-medium">
          Ledger Clear Signing
        </span>
        {isLedger ? (
          <span className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
            Enabled
          </span>
        ) : (
          <span className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full bg-zinc-500/20 text-zinc-400 border border-zinc-500/30">
            {isConnected ? 'Software Wallet' : 'Not Connected'}
          </span>
        )}
      </div>

      {/* ERC-7730 metadata info */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 size={12} className="text-green-400" />
          <span className="text-xs text-zinc-300">ERC-7730 Clear Signing metadata served</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CheckCircle2 size={12} className="text-green-400" />
          <span className="text-xs text-zinc-400">Contract: 0xF957cDA1...CB7</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CheckCircle2 size={12} className="text-green-400" />
          <span className="text-xs text-zinc-400">Network: Sepolia</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CheckCircle2 size={12} className="text-green-400" />
          <span className="text-xs text-zinc-400">Ledger will display: &quot;Send heartbeat — prove you are alive&quot;</span>
        </div>
      </div>

      {current && (
        <div className="space-y-2">
          <p className="text-xs text-zinc-400">
            {isLedger ? 'Your Ledger will display:' : 'With a Ledger, you would see:'}
          </p>
          <div className="bg-black rounded-lg border border-zinc-700 p-3 space-y-1 font-mono">
            <div className="flex items-center gap-2 mb-2">
              <Monitor size={12} className="text-zinc-500" />
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Ledger Screen Preview</span>
            </div>
            {current.screen.map((line, i) => (
              <p key={i} className="text-xs text-green-400">{line}</p>
            ))}
          </div>
        </div>
      )}

      <p className="text-[11px] text-zinc-500">
        ERC-7730 metadata ensures human-readable transaction details on Ledger hardware wallets.
      </p>
    </div>
  );
}
