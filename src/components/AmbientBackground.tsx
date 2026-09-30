import React from 'react';

export const AmbientBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
      {/* Deep velvet obsidian foundation */}
      <div className="absolute inset-0 bg-[#080410]" />

      {/* Layer 1: Sleek flowing fluid purple orbs with smooth continuous movement */}
      <div
        className="ambient-orb-1 absolute -top-48 -left-36 w-[680px] h-[680px] rounded-full blur-[140px]"
        style={{
          background: 'radial-gradient(circle, rgba(147, 51, 234, 0.35) 0%, rgba(109, 40, 217, 0.2) 45%, transparent 70%)',
        }}
      />
      <div
        className="ambient-orb-2 absolute top-1/4 -right-40 w-[720px] h-[720px] rounded-full blur-[150px]"
        style={{
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.28) 0%, rgba(79, 70, 229, 0.18) 50%, transparent 70%)',
        }}
      />
      <div
        className="ambient-orb-3 absolute -bottom-48 left-1/3 w-[780px] h-[780px] rounded-full blur-[160px]"
        style={{
          background: 'radial-gradient(circle, rgba(126, 34, 206, 0.25) 0%, rgba(147, 51, 234, 0.15) 50%, transparent 70%)',
        }}
      />
      <div
        className="ambient-orb-4 absolute top-2/3 -left-32 w-[600px] h-[600px] rounded-full blur-[130px]"
        style={{
          background: 'radial-gradient(circle, rgba(192, 132, 252, 0.2) 0%, rgba(88, 28, 135, 0.25) 50%, transparent 70%)',
        }}
      />

      {/* Layer 2: Sleek ambient wave band */}
      <div
        className="ambient-wave absolute top-1/2 left-0 right-0 h-64 -translate-y-1/2 blur-[100px]"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(147, 51, 234, 0.12) 30%, rgba(168, 85, 247, 0.16) 70%, transparent 100%)',
        }}
      />

      {/* Layer 3: Subtle tactile micro-mesh texture for high-tech sleek finish */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `radial-gradient(rgba(226, 210, 255, 0.9) 1px, transparent 1px)`,
          backgroundSize: '32px 32px',
        }}
      />

      {/* Layer 4: Text Readability Contrast Guard (Soft radial vignette protecting foreground copy) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(8, 4, 16, 0.65) 100%)',
        }}
      />
    </div>
  );
};
