'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield, LayoutDashboard, PlusCircle, Key, BookOpen, Menu, X } from 'lucide-react';
import { useState } from 'react';

const nav = [
  { href: '/', label: 'Home', icon: Shield },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/create', label: 'Create Vault', icon: PlusCircle },
  { href: '/claim', label: 'Claim', icon: Key },
  { href: '/how-it-works', label: 'How It Works', icon: BookOpen },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg bg-card border border-border"
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-card border-r border-border z-40 flex flex-col transition-transform duration-200 ${
          open ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="p-6 border-b border-border">
          <Link href="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Shield className="text-primary" size={22} />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">DeadSwitch</h1>
              <p className="text-xs text-subtle">Crypto Inheritance</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'bg-primary/15 text-primary'
                    : 'text-muted hover:text-foreground hover:bg-white/5'
                }`}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="px-4 py-3 rounded-xl bg-primary/10 border border-primary/20">
            <p className="text-xs text-primary font-medium">ETHGlobal Cannes 2026</p>
            <p className="text-xs text-subtle mt-1">Hackathon Project</p>
          </div>
        </div>
      </aside>
    </>
  );
}
