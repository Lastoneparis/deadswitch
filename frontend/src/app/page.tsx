'use client';

import { motion } from 'framer-motion';
import { Shield, Heart, Clock, UserCheck, ArrowRight, Link as LinkIcon } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getStats } from '@/lib/api';
import { useI18n } from '@/lib/i18n';

const sponsors = [
  { name: 'Chainlink' },
  { name: 'World' },
  { name: 'Ledger' },
  { name: '0G' },
  { name: 'ENS' },
  { name: 'Flare' },
];

export default function Home() {
  const [stats, setStats] = useState({ vaults: 12, protected: '42.5', heartbeats: 156 });
  const { t } = useI18n();

  const steps = [
    {
      icon: Shield,
      titleKey: 'steps.setup_title',
      descKey: 'steps.setup_desc',
      color: 'text-primary',
      bg: 'bg-primary/15',
    },
    {
      icon: Heart,
      titleKey: 'steps.active_title',
      descKey: 'steps.active_desc',
      color: 'text-success',
      bg: 'bg-success/15',
    },
    {
      icon: Clock,
      titleKey: 'steps.protected_title',
      descKey: 'steps.protected_desc',
      color: 'text-gold',
      bg: 'bg-gold/15',
    },
  ];

  useEffect(() => {
    getStats()
      .then((s) => setStats(s))
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-20 py-10">
      {/* Hero */}
      <section className="text-center space-y-8 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
            <LinkIcon size={14} />
            {t('hero.badge')}
          </div>

          <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
            {t('hero.title_1')}{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-gold">
              {t('hero.title_2')}
            </span>
          </h1>

          <p className="text-xl text-muted mt-6 max-w-2xl mx-auto leading-relaxed">
            {t('hero.subtitle')}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            href="/create"
            className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-primary hover:bg-primary/90 text-white font-semibold text-lg transition-all hover:shadow-lg hover:shadow-primary/25"
          >
            {t('hero.cta_create')}
            <ArrowRight size={20} />
          </Link>
          <Link
            href="/claim"
            className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-card border border-border hover:border-gold/50 text-foreground font-semibold text-lg transition-all"
          >
            <UserCheck size={20} className="text-gold" />
            {t('hero.cta_beneficiary')}
          </Link>
        </motion.div>
      </section>

      {/* 3 Steps */}
      <section>
        <h2 className="text-center text-2xl font-bold mb-10">{t('steps.title')}</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.titleKey}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 * i }}
                className="bg-card border border-border rounded-2xl p-8 text-center space-y-4 hover:border-primary/30 transition-colors"
              >
                <div className={`w-16 h-16 rounded-2xl ${step.bg} flex items-center justify-center mx-auto`}>
                  <Icon size={28} className={step.color} />
                </div>
                <div className="text-xs font-bold text-subtle tracking-widest uppercase">
                  {t('steps.step')} {i + 1}
                </div>
                <h3 className="text-xl font-bold">{t(step.titleKey)}</h3>
                <p className="text-sm text-muted leading-relaxed">{t(step.descKey)}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Stats Bar */}
      <section>
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="grid grid-cols-3 divide-x divide-border text-center">
            <div>
              <p className="text-3xl font-bold text-primary">{stats.vaults}</p>
              <p className="text-sm text-subtle mt-1">{t('stats.vaults')}</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-success">{stats.protected} ETH</p>
              <p className="text-sm text-subtle mt-1">{t('stats.protected')}</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-gold">{stats.heartbeats}</p>
              <p className="text-sm text-subtle mt-1">{t('stats.heartbeats')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Sponsors */}
      <section className="text-center space-y-6">
        <p className="text-sm text-subtle uppercase tracking-widest font-medium">{t('stats.built_with')}</p>
        <div className="flex flex-wrap items-center justify-center gap-8">
          {sponsors.map((s) => (
            <div
              key={s.name}
              className="px-6 py-3 rounded-xl bg-card border border-border text-muted text-sm font-medium hover:border-primary/30 transition-colors"
            >
              {s.name}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
