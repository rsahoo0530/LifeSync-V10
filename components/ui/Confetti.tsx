
import React, { useEffect, useState } from 'react';

export const Confetti: React.FC<{ trigger: boolean, type?: 'sparkle' | 'fireworks' }> = ({ trigger, type = 'sparkle' }) => {
  const [particles, setParticles] = useState<{id: number, x: number, y: number, color: string, tx: string, ty: string}[]>([]);

  useEffect(() => {
    if (trigger) {
      const colors = ['#6366f1', '#a855f7', '#ec4899', '#facc15', '#22c55e', '#ffffff'];
      const count = type === 'fireworks' ? 100 : 40;
      const newParticles = Array.from({ length: count }).map((_, i) => {
        const angle = Math.random() * Math.PI * 2;
        const radius = type === 'fireworks' ? (Math.random() * 400 + 100) : (Math.random() * 200 + 50);
        return {
            id: Math.random(),
            x: 50,
            y: 50,
            color: colors[Math.floor(Math.random() * colors.length)],
            tx: `${Math.cos(angle) * radius}px`,
            ty: `${Math.sin(angle) * radius}px`
        };
      });
      setParticles(newParticles);
      setTimeout(() => setParticles([]), 1500);
    }
  }, [trigger, type]);

  if (particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] flex items-center justify-center overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute w-2 h-2 rounded-full"
          style={{
            backgroundColor: p.color,
            left: '50%',
            top: '50%',
            '--tx': p.tx,
            '--ty': p.ty,
            opacity: 0,
            animation: `explode 1.2s cubic-bezier(0, .9, .57, 1) forwards`
          } as any}
        />
      ))}
      <style>{`
        @keyframes explode {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          60% { opacity: 1; }
          100% { transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(0); opacity: 0; }
        }
      `}</style>
    </div>
  );
};
