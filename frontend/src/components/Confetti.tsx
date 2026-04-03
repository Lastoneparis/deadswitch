'use client';

import { useEffect, useState } from 'react';

const colors = ['#22c55e', '#3b82f6', '#d4a76a', '#f59e0b', '#a855f7', '#ec4899'];

interface Piece {
  id: number;
  left: string;
  color: string;
  delay: string;
  size: number;
}

export default function Confetti({ active }: { active: boolean }) {
  const [pieces, setPieces] = useState<Piece[]>([]);

  useEffect(() => {
    if (active) {
      const newPieces: Piece[] = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: `${Math.random() * 1}s`,
        size: 6 + Math.random() * 8,
      }));
      setPieces(newPieces);
      const timer = setTimeout(() => setPieces([]), 3500);
      return () => clearTimeout(timer);
    }
  }, [active]);

  if (!pieces.length) return null;

  return (
    <>
      {pieces.map((p) => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: p.left,
            backgroundColor: p.color,
            animationDelay: p.delay,
            width: p.size,
            height: p.size,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
          }}
        />
      ))}
    </>
  );
}
