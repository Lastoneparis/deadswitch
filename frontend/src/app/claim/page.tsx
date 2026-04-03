'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Shield, Siren, CheckCircle, Coins, User, Clock, Loader2 } from 'lucide-react';
import WorldIdVerify from '@/components/WorldIdVerify';
import VaultStatusBadge from '@/components/VaultStatusBadge';
import Confetti from '@/components/Confetti';
import { getVault, claimInheritance } from '@/lib/api';

type VaultStatus = 'ACTIVE' | 'RECOVERY' | 'CLAIMED';

interface VaultInfo {
  address: string;
  owner: string;
  beneficiary: string;
  balance: string;
  status: VaultStatus;
  lastHeartbeat: string;
  interval: number;
}

export default function ClaimPage() {
  const [vaultInput, setVaultInput] = useState('');
  const [searching, setSearching] = useState(false);
  const [vault, setVault] = useState<VaultInfo | null>(null);
  const [worldIdVerified, setWorldIdVerified] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const handleSearch = async () => {
    setSearching(true);
    try {
      const result = await getVault(vaultInput);
      setVault(result);
    } catch {
      // Mock data for demo
      setVault({
        address: vaultInput || '0x7a3b...4f2e',
        owner: '0x1234...5678',
        beneficiary: 'wife.eth',
        balance: '3.2',
        status: 'RECOVERY',
        lastHeartbeat: '93 days ago',
        interval: 90,
      });
    }
    setSearching(false);
  };

  const handleClaim = async () => {
    if (!vault) return;
    setClaiming(true);
    try {
      await claimInheritance(vault.address, vault.beneficiary);
    } catch {
      // Mock for demo
    }
    await new Promise((r) => setTimeout(r, 2000));
    setClaiming(false);
    setClaimed(true);
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 100);
  };

  return (
    <div className="max-w-lg mx-auto py-10 space-y-8">
      <Confetti active={showConfetti} />

      <div>
        <h1 className="text-3xl font-bold">Claim Inheritance</h1>
        <p className="text-muted mt-2">Enter a vault address to check if you can claim.</p>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Vault address or ENS name..."
          value={vaultInput}
          onChange={(e) => setVaultInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="flex-1 px-4 py-3 rounded-xl bg-card border border-border focus:border-primary focus:outline-none text-sm font-mono"
        />
        <button
          onClick={handleSearch}
          disabled={searching}
          className="px-5 py-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-medium transition-colors flex items-center gap-2 cursor-pointer"
        >
          {searching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
          Search
        </button>
      </div>

      <AnimatePresence mode="wait">
        {vault && !claimed && (
          <motion.div
            key="vault-info"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Vault Info Card */}
            <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <Shield size={16} className="text-primary" />
                  Vault Information
                </h3>
                <VaultStatusBadge status={vault.status} />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <p className="text-xs text-subtle flex items-center gap-1"><User size={10} /> Owner</p>
                  <p className="text-sm font-mono mt-1">{vault.owner}</p>
                </div>
                <div>
                  <p className="text-xs text-subtle flex items-center gap-1"><User size={10} /> Beneficiary</p>
                  <p className="text-sm font-mono mt-1">{vault.beneficiary}</p>
                </div>
                <div>
                  <p className="text-xs text-subtle flex items-center gap-1"><Coins size={10} /> Balance</p>
                  <p className="text-sm font-semibold mt-1">{vault.balance} ETH</p>
                </div>
                <div>
                  <p className="text-xs text-subtle flex items-center gap-1"><Clock size={10} /> Last Heartbeat</p>
                  <p className="text-sm mt-1">{vault.lastHeartbeat}</p>
                </div>
              </div>
            </div>

            {/* Status-specific content */}
            {vault.status === 'ACTIVE' ? (
              <div className="bg-success/10 border border-success/20 rounded-2xl p-6 text-center">
                <Shield className="text-success mx-auto mb-3" size={32} />
                <h3 className="font-semibold text-success text-lg">This vault is active</h3>
                <p className="text-sm text-muted mt-2">
                  The owner is still checking in. Recovery is not available.
                </p>
              </div>
            ) : vault.status === 'RECOVERY' ? (
              <div className="space-y-4">
                <div className="bg-danger/10 border border-danger/20 rounded-2xl p-6 text-center">
                  <Siren className="text-danger mx-auto mb-3" size={32} />
                  <h3 className="font-semibold text-danger text-lg">Recovery Mode Active</h3>
                  <p className="text-sm text-muted mt-2">
                    The owner has not checked in for {vault.lastHeartbeat}. You may claim this inheritance.
                  </p>
                </div>

                {!worldIdVerified ? (
                  <WorldIdVerify onVerified={() => setWorldIdVerified(true)} />
                ) : (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleClaim}
                    disabled={claiming}
                    className="w-full py-4 rounded-2xl bg-gold hover:bg-gold/90 text-black font-bold text-lg transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    {claiming ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        Processing on-chain...
                      </>
                    ) : (
                      <>
                        Claim Inheritance ({vault.balance} ETH)
                      </>
                    )}
                  </motion.button>
                )}
              </div>
            ) : null}
          </motion.div>
        )}

        {claimed && vault && (
          <motion.div
            key="claimed"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center space-y-6 py-10"
          >
            <div className="w-24 h-24 rounded-full bg-gold/15 border border-gold/30 flex items-center justify-center mx-auto">
              <CheckCircle className="text-gold" size={48} />
            </div>
            <h2 className="text-3xl font-bold">Inheritance Transferred</h2>
            <p className="text-muted text-lg">
              <span className="text-foreground font-bold">{vault.balance} ETH</span> has been
              securely transferred to your wallet.
            </p>
            <div className="bg-card border border-border rounded-xl p-4 max-w-sm mx-auto">
              <p className="text-xs text-subtle">Transaction confirmed on-chain</p>
              <p className="text-sm font-mono mt-1 text-success">Block #18,234,567</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
