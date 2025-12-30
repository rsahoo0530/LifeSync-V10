import React, { useEffect, useState } from 'react';

export const Confetti: React.FC<{ trigger: boolean }> = ({ trigger }) => {
  const [particles, setParticles] = useState<{id: number, x: number, y: number, color: string}[]>([]);

  useEffect(() => {
    if (trigger) {
      const colors = ['#6366f1', '#a855f7', '#ec4899', '#facc15', '#22c55e'];
      const newParticles = Array.from({ length: 50 }).map((_, i) => ({
        id: i,
        x: 50, // center
        y: 50, // center
        color: colors[Math.floor(Math.random() * colors.length)],
        angle: Math.random() * 360,
        velocity: Math.random() * 20 + 10
      }));
      setParticles(newParticles as any); // Type casting for simplicity in demo
      
      const timer = setTimeout(() => setParticles([]), 1000);
      return () => clearTimeout(timer);
    }
  }, [trigger]);

  if (particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] flex items-center justify-center overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute w-2 h-2 rounded-full animate-explosion"
          style={{
            backgroundColor: p.color,
            // Inline style animation for simple explosion effect
            transform: `translate(-50%, -50%)`,
            left: '50%',
            top: '50%',
            ['--tx' as any]: `${Math.cos(p.id) * 300}px`,
            ['--ty' as any]: `${Math.sin(p.id) * 300}px`,
            opacity: 0,
            animation: `explode 0.8s ease-out forwards`
          }}
        />
      ))}
      <style>{`
        @keyframes explode {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          100% { transform: translate(var(--tx), var(--ty)) scale(0); opacity: 0; }
        }
      `}</style>
    </div>
  );
};