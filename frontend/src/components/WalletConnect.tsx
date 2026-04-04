'use client';

import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { Wallet, LogOut, ChevronDown, AlertTriangle } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function WalletConnect() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const [showMenu, setShowMenu] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) {
    return (
      <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-black text-sm font-semibold">
        <Wallet size={16} />
        Connect Wallet
      </button>
    );
  }

  // Connected but on wrong chain
  if (isConnected && chainId !== sepolia.id) {
    return (
      <button
        onClick={() => switchChain({ chainId: sepolia.id })}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-warning/10 border border-warning/30 text-warning text-sm font-semibold hover:bg-warning/20 transition-colors"
      >
        <AlertTriangle size={16} />
        Switch to Sepolia
      </button>
    );
  }

  if (isConnected && address) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors"
        >
          <div className="w-2 h-2 rounded-full bg-success" />
          <span className="text-sm font-mono">
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
          <ChevronDown size={14} className="text-subtle" />
        </button>
        {showMenu && (
          <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-xl shadow-xl p-2 z-50">
            <div className="px-3 py-2 text-xs text-subtle border-b border-border mb-2">
              Sepolia Testnet
            </div>
            <button
              onClick={() => { disconnect(); setShowMenu(false); }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-danger hover:bg-danger/10 rounded-lg transition-colors"
            >
              <LogOut size={14} />
              Disconnect
            </button>
          </div>
        )}
      </div>
    );
  }

  // Not connected — use injected connector (auto-detects MetaMask, Brave, etc.)
  return (
    <button
      onClick={() => {
        if (connectors[0]) {
          connect({ connector: connectors[0] });
        } else {
          alert('No wallet detected. Please install MetaMask.');
        }
      }}
      disabled={isPending}
      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-black text-sm font-semibold transition-colors disabled:opacity-50"
    >
      <Wallet size={16} />
      {isPending ? 'Connecting...' : 'Connect Wallet'}
    </button>
  );
}
