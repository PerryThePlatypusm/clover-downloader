import React from 'react';

interface GlowBeamBoxProps {
  children: React.ReactNode;
  className?: string;
  innerClassName?: string;
}

export const GlowBeamBox: React.FC<GlowBeamBoxProps> = ({
  children,
  className = '',
  innerClassName = '',
}) => {
  return (
    <div className={`relative ${className}`}>
      {/* Outer Atmospheric Diffuse Glow (tracks continuously around perimeter like Google AI mode) */}
      <div className="absolute -inset-1 rounded-3xl overflow-hidden pointer-events-none blur-xl opacity-75">
        <div
          className="absolute -inset-[150%] glow-beam-rotate"
          style={{
            background:
              'conic-gradient(from 0deg at 50% 50%, transparent 0deg, rgba(168, 85, 247, 0.9) 55deg, rgba(52, 211, 153, 0.85) 115deg, rgba(99, 102, 241, 0.95) 180deg, rgba(236, 72, 153, 0.85) 245deg, transparent 310deg)',
          }}
        />
      </div>

      {/* Crisp Perimeter Border Beam */}
      <div className="relative p-[1.5px] rounded-3xl overflow-hidden shadow-2xl shadow-purple-950/50">
        <div
          className="absolute -inset-[150%] pointer-events-none glow-beam-rotate"
          style={{
            background:
              'conic-gradient(from 0deg at 50% 50%, transparent 0deg, rgba(192, 132, 252, 1) 55deg, rgba(52, 211, 153, 0.95) 115deg, rgba(129, 140, 248, 1) 180deg, rgba(244, 114, 182, 0.95) 245deg, transparent 310deg)',
          }}
        />

        {/* Inner Card Content Shield */}
        <div
          className={`relative rounded-[22.5px] bg-[#110a20]/95 backdrop-blur-2xl z-10 ${innerClassName}`}
        >
          {children}
        </div>
      </div>
    </div>
  );
};
