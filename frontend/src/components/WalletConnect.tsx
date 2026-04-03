'use client';

import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { Wallet, LogOut, ChevronDown } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function WalletConnect() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const [showMenu, setShowMenu] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Prevent hydration mismatch — render connect button on server, real state on client
  if (!mounted) {
    return (
      <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-medium transition-colors">
        <Wallet size={16} />
        Connect Wallet
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

  return (
    <button
      onClick={() => connect({ connector: connectors[0] })}
      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-medium transition-colors"
    >
      <Wallet size={16} />
      Connect Wallet
    </button>
  );
}
