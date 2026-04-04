'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, PlusCircle, Key, BookOpen, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useI18n, LanguageSwitcher } from '@/lib/i18n';

function LogoIcon({ size = 18, className = '' }: { size?: number; className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    </svg>
  );
}

const navItems = [
  { href: '/', labelKey: 'nav.home', icon: LogoIcon },
  { href: '/dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard },
  { href: '/create', labelKey: 'nav.create', icon: PlusCircle },
  { href: '/claim', labelKey: 'nav.claim', icon: Key },
  { href: '/how-it-works', labelKey: 'nav.how', icon: BookOpen },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { t } = useI18n();

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
            <img src="/logo-icon.png" alt="DeadSwitch" className="w-10 h-10 rounded-xl" />
            <div>
              <h1 className="font-bold text-lg leading-tight">DeadSwitch</h1>
              <p className="text-xs text-subtle">{t('nav.subtitle')}</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ href, labelKey, icon: Icon }) => {
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
                {t(labelKey)}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 space-y-3 border-t border-border">
          <LanguageSwitcher />
          <div className="px-4 py-3 rounded-xl bg-primary/10 border border-primary/20">
            <p className="text-xs text-primary font-medium">{t('nav.hackathon')}</p>
            <p className="text-xs text-subtle mt-1">{t('nav.hackathon_sub')}</p>
          </div>
        </div>
      </aside>
    </>
  );
}
