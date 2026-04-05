'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Shield, Siren, CheckCircle, Coins, User, Clock, Loader2, Wallet, AlertTriangle } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useAccount, useWriteContract } from 'wagmi';
import { VAULT_DEPLOY_ABI } from '@/lib/contract';
import WorldIdVerify from '@/components/WorldIdVerify';
import Confetti from '@/components/Confetti';
import { getVault, getHeirVaults, claimInheritance, searchVaultsByAddress, resolveENS, VaultData } from '@/lib/api';

export default function ClaimPage() {
  const { t } = useI18n();
  const { address, isConnected } = useAccount();
  const [vaultInput, setVaultInput] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [vault, setVault] = useState<VaultData | null>(null);
  const [heirVaults, setHeirVaults] = useState<VaultData[]>([]);
  const [worldIdVerified, setWorldIdVerified] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [loadingHeir, setLoadingHeir] = useState(false);
  const { writeContractAsync } = useWriteContract();

  // Auto-fetch vaults where connected wallet is beneficiary
  useEffect(() => {
    if (!isConnected || !address) {
      setHeirVaults([]);
      return;
    }
    setLoadingHeir(true);
    getHeirVaults(address)
      .then(({ vaults }) => {
        setHeirVaults(vaults.filter(v => v.status === 'recovery'));
        const recoveryVault = vaults.find(v => v.status === 'recovery');
        if (recoveryVault) setVault(recoveryVault);
      })
      .catch(() => {})
      .finally(() => setLoadingHeir(false));
  }, [isConnected, address]);

  const handleSearch = async () => {
    if (!vaultInput.trim()) return;
    setSearching(true);
    setSearchError('');
    setVault(null);

    try {
      // If it looks like a UUID, search by vault ID
      if (vaultInput.includes('-') && vaultInput.length > 30) {
        const result = await getVault(vaultInput.trim());
        setVault(result);
      }
      // If it looks like an ENS name, resolve then search by owner
      else if (vaultInput.endsWith('.eth')) {
        const resolved = await resolveENS(vaultInput.trim());
        if (resolved.resolved) {
          const { vaults } = await searchVaultsByAddress(resolved.address);
          if (vaults.length > 0) {
            const recovery = vaults.find(v => v.status === 'recovery');
            setVault(recovery || vaults[0]);
          } else {
            setSearchError(t('claim.no_vault_found') || 'No vault found for this address');
          }
        } else {
          setSearchError(t('claim.ens_not_found') || 'ENS name could not be resolved');
        }
      }
      // If it looks like an address (0x...), search by owner
      else if (vaultInput.startsWith('0x')) {
        const { vaults } = await searchVaultsByAddress(vaultInput.trim());
        if (vaults.length > 0) {
          const recovery = vaults.find(v => v.status === 'recovery');
          setVault(recovery || vaults[0]);
        } else {
          setSearchError(t('claim.no_vault_found') || 'No vault found for this address');
        }
      }
      // Otherwise try as vault ID
      else {
        const result = await getVault(vaultInput.trim());
        setVault(result);
      }
    } catch {
      setSearchError(t('claim.no_vault_found') || 'No vault found. Try an owner address, ENS name, or vault ID.');
    }
    setSearching(false);
  };

  const [claimError, setClaimError] = useState('');
  const handleClaim = async () => {
    if (!vault || !isConnected || !address) return;
    setClaiming(true);
    setClaimError('');

    let onChainSuccess = false;

    // Execute on-chain claim if vault has contract address + nullifier
    if (vault.vault_address && vault.world_id_nullifier) {
      try {
        await writeContractAsync({
          address: vault.vault_address as `0x${string}`,
          abi: VAULT_DEPLOY_ABI,
          functionName: 'claim',
          args: [vault.world_id_nullifier as `0x${string}`],
        });
        onChainSuccess = true;
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.warn('On-chain claim failed:', errMsg);
        setClaiming(false);

        if (errMsg.includes('User rejected') || errMsg.includes('User denied') || errMsg.includes('rejected the request')) {
          setClaimError('Transaction rejected in wallet');
          return;
        }
        if (errMsg.includes('insufficient funds')) {
          setClaimError('Insufficient Sepolia ETH for gas');
          return;
        }
        if (errMsg.includes('Recovery delay not elapsed')) {
          setClaimError('30-day recovery delay not yet passed (production safety feature)');
          return;
        }
        if (errMsg.includes('Not beneficiary')) {
          setClaimError('This wallet is not the designated beneficiary');
          return;
        }
        if (errMsg.includes('Vault not in recovery mode')) {
          setClaimError('Vault is not in recovery mode yet');
          return;
        }
        setClaimError(`On-chain claim failed: ${errMsg.slice(0, 100)}`);
        return;
      }
    }

    // Backend claim — only after on-chain succeeded OR no on-chain contract
    try { await claimInheritance(vault.id, address); } catch { /* fallback */ }

    setClaiming(false);
    setClaimed(true);
    if (onChainSuccess) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 100);
    }
  };

  const beneficiaryLabel = vault?.beneficiary_ens || (vault?.beneficiary_address ? `${vault.beneficiary_address.slice(0, 8)}...${vault.beneficiary_address.slice(-6)}` : '');
  const ownerLabel = vault?.owner_ens || (vault?.owner_address ? `${vault.owner_address.slice(0, 8)}...${vault.owner_address.slice(-6)}` : '');
  const lastHeartbeatLabel = vault ? `${Math.round((Date.now() / 1000 - vault.last_heartbeat) / 86400)} ${t('dash.days_ago')}` : '';

  return (
    <div className="max-w-lg mx-auto py-10 space-y-8">
      <Confetti active={showConfetti} />

      <div>
        <h1 className="text-3xl font-bold">{t('claim.title')}</h1>
        <p className="text-muted mt-2">{t('claim.subtitle')}</p>
      </div>

      {/* Instructional banner */}
      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
          <User size={16} className="text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-primary">For the beneficiary (heir)</p>
          <p className="text-xs text-muted mt-1 leading-relaxed">
            Connect the wallet that was designated as beneficiary. We'll auto-detect any
            vaults where you're the heir. Then verify your identity with World ID and claim
            the inheritance.
          </p>
        </div>
      </div>

      {/* Wallet requirement */}
      {!isConnected && (
        <div className="bg-warning/10 border border-warning/20 rounded-2xl p-5 flex items-start gap-3">
          <Wallet size={20} className="text-warning mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-warning">{t('claim.wallet_required')}</p>
            <p className="text-xs text-muted mt-1">{t('claim.wallet_required_desc')}</p>
          </div>
        </div>
      )}

      {/* Auto-detected heir vaults */}
      {isConnected && loadingHeir && (
        <div className="flex items-center gap-2 text-sm text-muted">
          <Loader2 size={14} className="animate-spin" />
          {t('claim.checking')}
        </div>
      )}

      {isConnected && !loadingHeir && heirVaults.length === 0 && !vault && (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-2">
          <div className="flex items-center gap-2">
            <Wallet size={18} className="text-subtle" />
            <p className="font-semibold text-sm">No claimable vaults found</p>
          </div>
          <p className="text-xs text-muted">
            This wallet ({address?.slice(0, 6)}...{address?.slice(-4)}) is not the beneficiary
            of any vault currently in recovery mode. Make sure you're connected to the right
            wallet — the one that was designated as heir when the vault was created.
          </p>
        </div>
      )}

      {isConnected && heirVaults.length > 0 && !vault && (
        <div className="bg-danger/10 border border-danger/20 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Siren size={18} className="text-danger" />
            <p className="font-semibold text-danger">{t('claim.claimable_found')}</p>
          </div>
          {heirVaults.map((v) => (
            <button key={v.id} onClick={() => setVault(v)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-card border border-border hover:border-danger/30 transition-colors cursor-pointer">
              <div className="text-left">
                <p className="text-sm font-medium">{t('claim.from')}: {v.owner_ens || `${v.owner_address.slice(0, 8)}...`}</p>
                <p className="text-xs text-muted">{t('claim.status_recovery')}</p>
              </div>
              <p className="text-lg font-bold">{v.balance} ETH</p>
            </button>
          ))}
        </div>
      )}

      {/* Manual search (advanced) */}
      <details className="group">
        <summary className="cursor-pointer text-xs text-subtle hover:text-muted transition-colors flex items-center gap-2 py-2">
          <span>Advanced: search by owner address or vault ID</span>
          <span className="text-[10px] text-subtle group-open:rotate-180 transition-transform">▼</span>
        </summary>
        <div className="space-y-2 mt-2">
          <p className="text-[11px] text-subtle">
            If you know the vault owner's address or the vault ID, you can look it up manually.
            Note: searching here does NOT automatically give you claim rights — you still need to
            be the designated beneficiary.
          </p>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Owner address (0x...) or ENS name"
              value={vaultInput}
              onChange={(e) => { setVaultInput(e.target.value); setSearchError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 px-4 py-3 rounded-xl bg-card border border-border focus:border-primary focus:outline-none text-sm font-mono"
            />
            <button onClick={handleSearch} disabled={searching}
              className="px-5 py-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-medium transition-colors flex items-center gap-2 cursor-pointer">
              {searching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              {t('claim.search')}
            </button>
          </div>
          {searchError && (
            <div className="flex items-center gap-2 text-sm text-danger">
              <AlertTriangle size={14} />
              {searchError}
            </div>
          )}
        </div>
      </details>

      <AnimatePresence mode="wait">
        {vault && !claimed && (
          <motion.div key="vault-info" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }} className="space-y-6">
            {/* Vault Info Card */}
            <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <Shield size={16} className="text-primary" />
                  {t('claim.vault_info')}
                </h3>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                  vault.status === 'active' ? 'bg-success/15 text-success' :
                  vault.status === 'recovery' ? 'bg-danger/15 text-danger' :
                  'bg-gold/15 text-gold'
                }`}>{vault.status}</span>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="min-w-0">
                  <p className="text-xs text-subtle flex items-center gap-1"><User size={10} /> {t('dash.owner')}</p>
                  <p className="text-sm font-mono mt-1 truncate">{ownerLabel}</p>
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-subtle flex items-center gap-1"><User size={10} /> {t('dash.beneficiary')}</p>
                  <p className="text-sm font-mono mt-1 truncate">{beneficiaryLabel}</p>
                </div>
                <div>
                  <p className="text-xs text-subtle flex items-center gap-1"><Coins size={10} /> {t('dash.balance')}</p>
                  <p className="text-sm font-semibold mt-1">{vault.balance} ETH</p>
                </div>
                <div>
                  <p className="text-xs text-subtle flex items-center gap-1"><Clock size={10} /> {t('dash.last_heartbeat')}</p>
                  <p className="text-sm mt-1">{lastHeartbeatLabel}</p>
                </div>
              </div>
            </div>

            {/* Status actions */}
            {vault.status === 'active' ? (
              <div className="bg-success/10 border border-success/20 rounded-2xl p-6 text-center">
                <Shield className="text-success mx-auto mb-3" size={32} />
                <h3 className="font-semibold text-success text-lg">{t('claim.active_msg')}</h3>
                <p className="text-sm text-muted mt-2">{t('claim.active_desc')}</p>
              </div>
            ) : vault.status === 'recovery' ? (
              <div className="space-y-4">
                <div className="bg-danger/10 border border-danger/20 rounded-2xl p-6 text-center">
                  <Siren className="text-danger mx-auto mb-3" size={32} />
                  <h3 className="font-semibold text-danger text-lg">{t('claim.recovery_msg')}</h3>
                  <p className="text-sm text-muted mt-2">{t('claim.recovery_desc')} {lastHeartbeatLabel}. {t('claim.recovery_claim')}</p>
                </div>

                {!isConnected ? (
                  <div className="bg-card border border-warning/20 rounded-2xl p-6 text-center space-y-3">
                    <Wallet size={28} className="text-warning mx-auto" />
                    <p className="font-semibold text-sm">{t('claim.connect_to_claim')}</p>
                    <p className="text-xs text-muted">{t('claim.connect_to_claim_desc')}</p>
                  </div>
                ) : address?.toLowerCase() !== vault.beneficiary_address.toLowerCase() ? (
                  <div className="bg-danger/10 border border-danger/30 rounded-2xl p-5 space-y-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={18} className="text-danger" />
                      <p className="font-semibold text-danger text-sm">Wrong wallet connected</p>
                    </div>
                    <p className="text-xs text-muted leading-relaxed">
                      Only the designated beneficiary can claim this vault. The smart contract enforces this
                      with <code className="text-[10px] bg-background px-1 py-0.5 rounded">onlyBeneficiary</code> — any other wallet will revert.
                    </p>
                    <div className="bg-background border border-border rounded-lg p-3 space-y-1.5 text-[11px] font-mono">
                      <div className="flex items-center gap-2">
                        <span className="text-subtle w-20">Expected:</span>
                        <span className="text-success">{vault.beneficiary_ens || vault.beneficiary_address.slice(0, 10) + '...' + vault.beneficiary_address.slice(-6)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-subtle w-20">You have:</span>
                        <span className="text-danger">{address?.slice(0, 10)}...{address?.slice(-6)}</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-muted">
                      Switch to the beneficiary wallet in MetaMask, then reload this page.
                    </p>
                  </div>
                ) : !worldIdVerified ? (
                  <div className="space-y-3">
                    <div className="bg-success/5 border border-success/20 rounded-xl p-3 flex items-start gap-2">
                      <CheckCircle size={14} className="text-success mt-0.5 shrink-0" />
                      <p className="text-xs text-muted">
                        <span className="text-success font-semibold">Beneficiary wallet confirmed.</span>
                        {' '}Now verify you're a real human with World ID.
                      </p>
                    </div>
                    <WorldIdVerify onVerified={() => setWorldIdVerified(true)} />
                  </div>
                ) : (
                  <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleClaim} disabled={claiming}
                    className="w-full py-4 rounded-2xl bg-gold hover:bg-gold/90 text-black font-bold text-lg transition-colors cursor-pointer flex items-center justify-center gap-2">
                    {claiming ? (
                      <><Loader2 size={20} className="animate-spin" /> {t('claim.processing')}</>
                    ) : (
                      <>{t('claim.btn')} ({vault.balance} ETH)</>
                    )}
                  </motion.button>
                )}
                {claimError && (
                  <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-danger/10 border border-danger/20 mt-3">
                    <AlertTriangle size={14} className="text-danger mt-0.5 shrink-0" />
                    <p className="text-sm text-danger">{claimError}</p>
                  </div>
                )}
              </div>
            ) : null}
          </motion.div>
        )}

        {claimed && vault && (
          <motion.div key="claimed" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="text-center space-y-6 py-10">
            <div className="w-24 h-24 rounded-full bg-gold/15 border border-gold/30 flex items-center justify-center mx-auto">
              <CheckCircle className="text-gold" size={48} />
            </div>
            <h2 className="text-3xl font-bold">{t('claim.success_title')}</h2>
            <p className="text-muted text-lg">
              <span className="text-foreground font-bold">{vault.balance} ETH</span> {t('claim.success_desc')}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
