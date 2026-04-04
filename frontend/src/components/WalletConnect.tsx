'use client';

import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { Wallet, LogOut, ChevronDown, AlertTriangle, X } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function WalletConnect() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const [showMenu, setShowMenu] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showBrowserModal, setShowBrowserModal] = useState(false);

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

  const handleConnect = () => {
    // Check if any wallet is injected in the browser
    if (typeof window !== 'undefined' && !(window as any).ethereum) {
      setShowBrowserModal(true);
      return;
    }
    if (connectors[0]) {
      connect({ connector: connectors[0] });
    } else {
      setShowBrowserModal(true);
    }
  };

  return (
    <>
      <button
        onClick={handleConnect}
        disabled={isPending}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-black text-sm font-semibold transition-colors disabled:opacity-50"
      >
        <Wallet size={16} />
        {isPending ? 'Connecting...' : 'Connect Wallet'}
      </button>

      {/* No wallet detected modal */}
      {showBrowserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setShowBrowserModal(false)}>
          <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-warning/15 flex items-center justify-center shrink-0">
                  <AlertTriangle size={18} className="text-warning" />
                </div>
                <div>
                  <h3 className="font-bold">No Wallet Detected</h3>
                  <p className="text-xs text-subtle">Browser extension required</p>
                </div>
              </div>
              <button onClick={() => setShowBrowserModal(false)} className="text-subtle hover:text-foreground">
                <X size={18} />
              </button>
            </div>

            <p className="text-sm text-muted">
              DeadSwitch requires a browser wallet extension to sign transactions. Here are your options:
            </p>

            <div className="space-y-3">
              <a
                href="https://metamask.io/download/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-xl bg-background border border-border hover:border-primary/50 transition-colors"
              >
                <div>
                  <p className="text-sm font-semibold">MetaMask</p>
                  <p className="text-xs text-subtle">Chrome · Brave · Firefox · Edge</p>
                </div>
                <span className="text-xs text-primary">Install →</span>
              </a>

              <a
                href="https://rainbow.me/extension"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-xl bg-background border border-border hover:border-primary/50 transition-colors"
              >
                <div>
                  <p className="text-sm font-semibold">Rainbow</p>
                  <p className="text-xs text-subtle">Chrome · Brave · Safari · Arc</p>
                </div>
                <span className="text-xs text-primary">Install →</span>
              </a>

              <a
                href="https://www.coinbase.com/wallet/downloads"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-xl bg-background border border-border hover:border-primary/50 transition-colors"
              >
                <div>
                  <p className="text-sm font-semibold">Coinbase Wallet</p>
                  <p className="text-xs text-subtle">Chrome · Brave · Safari</p>
                </div>
                <span className="text-xs text-primary">Install →</span>
              </a>
            </div>

            <div className="bg-warning/5 border border-warning/20 rounded-xl p-3">
              <p className="text-xs text-muted">
                <span className="text-warning font-semibold">Safari users:</span> MetaMask doesn't support Safari.
                Use <span className="font-semibold">Rainbow</span> or <span className="font-semibold">Coinbase Wallet</span> extensions, or switch to <span className="font-semibold">Chrome/Brave/Arc</span>.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
