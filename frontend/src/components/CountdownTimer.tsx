'use client';

import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  targetDate: Date;
  totalDays: number;
}

export default function CountdownTimer({ targetDate, totalDays }: CountdownTimerProps) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const diff = targetDate.getTime() - now.getTime();
  const totalMs = totalDays * 24 * 60 * 60 * 1000;
  const progress = Math.max(0, Math.min(1, diff / totalMs));
  const expired = diff <= 0;

  const days = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  const hours = Math.max(0, Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
  const minutes = Math.max(0, Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)));
  const seconds = Math.max(0, Math.floor((diff % (1000 * 60)) / 1000));

  const color = expired
    ? 'text-danger'
    : progress < 0.25
    ? 'text-danger'
    : progress < 0.5
    ? 'text-warning'
    : 'text-success';

  const barColor = expired
    ? 'bg-danger'
    : progress < 0.25
    ? 'bg-danger'
    : progress < 0.5
    ? 'bg-warning'
    : 'bg-success';

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Clock size={16} className={color} />
        <span className="text-sm text-muted">Time until recovery mode</span>
      </div>

      <div className={`text-3xl font-bold font-mono ${color}`}>
        {expired ? (
          'EXPIRED'
        ) : (
          <>
            {days}d {String(hours).padStart(2, '0')}h{' '}
            {String(minutes).padStart(2, '0')}m{' '}
            {String(seconds).padStart(2, '0')}s
          </>
        )}
      </div>

      <div className="w-full h-2 bg-border rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${barColor}`}
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </div>
  );
}
