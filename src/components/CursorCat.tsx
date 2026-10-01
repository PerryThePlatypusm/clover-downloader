import React, { useEffect, useState } from 'react';

export const CursorCat: React.FC = () => {
  const [position, setPosition] = useState({ x: -100, y: -100 });
  const [isMoving, setIsMoving] = useState(false);
  const [facingRight, setFacingRight] = useState(true);

  useEffect(() => {
    let lastX = 0;
    let timeout: any = null;

    const handleMouseMove = (e: MouseEvent) => {
      if (window.innerWidth < 768) return;

      if (e.clientX > lastX) {
        setFacingRight(true);
      } else if (e.clientX < lastX) {
        setFacingRight(false);
      }
      lastX = e.clientX;

      setPosition({ x: e.clientX + 16, y: e.clientY + 16 });
      setIsMoving(true);

      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        setIsMoving(false);
      }, 150);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (timeout) clearTimeout(timeout);
    };
  }, []);

  if (position.x < 0 || (typeof window !== 'undefined' && window.innerWidth < 768)) return null;

  return (
    <div
      className="pointer-events-none fixed z-50 transition-transform duration-75 ease-out select-none hidden md:block"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: `scaleX(${facingRight ? 1 : -1})`,
      }}
    >
      <div className={`relative flex items-center justify-center w-10 h-10 rounded-xl bg-[#180f2d]/90 border-2 border-purple-500/80 shadow-xl shadow-purple-600/40 backdrop-blur-sm ${isMoving ? 'animate-bounce' : ''}`}>
        {/* Pixel Cat SVG matching uploaded image */}
        <svg viewBox="0 0 32 32" className="w-7 h-7" style={{ imageRendering: 'pixelated' }}>
          <rect x="8" y="14" width="16" height="10" fill="white" stroke="#5c4538" strokeWidth="1"/>
          <rect x="18" y="8" width="10" height="10" fill="white" stroke="#5c4538" strokeWidth="1"/>
          <polygon points="19,8 21,3 23,8" fill="white" stroke="#5c4538" strokeWidth="1"/>
          <polygon points="20,7 21,5 22,7" fill="#ffb6c1"/>
          <polygon points="25,9 27,4 29,9" fill="white" stroke="#5c4538" strokeWidth="1"/>
          <polygon points="26,8 27,6 28,8" fill="#ffb6c1"/>
          <rect x="20" y="11" width="1.5" height="1.5" fill="#5c4538"/>
          <rect x="26" y="11" width="1.5" height="1.5" fill="#5c4538"/>
          <rect x="21" y="13" width="2" height="1.5" fill="#ffb6c1"/>
          <rect x="20" y="13" width="2" height="2" fill="#ffb6c1" opacity="0.6"/>
          <rect x="25" y="13" width="2" height="2" fill="#ffb6c1" opacity="0.6"/>
          <rect x="15" y="21" width="4" height="3" fill="white" stroke="#5c4538" strokeWidth="1"/>
          <rect x="4" y="16" width="5" height="3" rx="1.5" fill="white" stroke="#5c4538" strokeWidth="1"/>
        </svg>
      </div>
    </div>
  );
};
