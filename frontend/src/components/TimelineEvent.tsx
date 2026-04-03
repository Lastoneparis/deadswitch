'use client';

import { motion } from 'framer-motion';
import { Heart, AlertTriangle, Siren, Award, Clock } from 'lucide-react';

type EventType = 'heartbeat' | 'warning' | 'recovery' | 'claimed' | 'created';

const eventConfig: Record<EventType, {
  icon: typeof Heart;
  color: string;
  bg: string;
  label: string;
}> = {
  heartbeat: { icon: Heart, color: 'text-success', bg: 'bg-success/15', label: 'Heartbeat Sent' },
  warning: { icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/15', label: 'Warning Triggered' },
  recovery: { icon: Siren, color: 'text-danger', bg: 'bg-danger/15', label: 'Recovery Mode' },
  claimed: { icon: Award, color: 'text-gold', bg: 'bg-gold/15', label: 'Inheritance Claimed' },
  created: { icon: Clock, color: 'text-primary', bg: 'bg-primary/15', label: 'Vault Created' },
};

interface TimelineEventProps {
  type: EventType;
  date: string;
  description?: string;
  index?: number;
}

export default function TimelineEvent({ type, date, description, index = 0 }: TimelineEventProps) {
  const config = eventConfig[type];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="flex items-start gap-4"
    >
      <div className="flex flex-col items-center">
        <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center`}>
          <Icon size={18} className={config.color} />
        </div>
        <div className="w-px h-8 bg-border" />
      </div>
      <div className="pt-1">
        <p className="font-medium text-sm">{config.label}</p>
        <p className="text-xs text-subtle">{date}</p>
        {description && <p className="text-xs text-muted mt-1">{description}</p>}
      </div>
    </motion.div>
  );
}
