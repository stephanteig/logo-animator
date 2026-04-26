'use client';

import { ReactNode } from 'react';

export default function HeroBand({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        height: 56,
        background: 'linear-gradient(135deg, #1e1b4b 0%, #4c1d95 35%, #831843 100%)',
        position: 'relative',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {/* Violet halo left */}
      <div
        style={{
          position: 'absolute',
          width: 700,
          height: 240,
          left: -100,
          top: -50,
          background: 'radial-gradient(ellipse, rgba(167,139,250,0.6) 0%, transparent 60%)',
          filter: 'blur(40px)',
          pointerEvents: 'none',
        }}
      />
      {/* Pink halo right */}
      <div
        style={{
          position: 'absolute',
          width: 700,
          height: 240,
          right: -100,
          top: -50,
          background: 'radial-gradient(ellipse, rgba(244,114,182,0.5) 0%, transparent 60%)',
          filter: 'blur(40px)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'relative',
          height: '100%',
          padding: '0 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        {children}
      </div>
    </div>
  );
}
