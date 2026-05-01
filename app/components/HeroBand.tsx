'use client';

import { ReactNode } from 'react';

export default function HeroBand({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        height: 50,
        background: 'rgba(8,6,14,0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        position: 'relative',
        flexShrink: 0,
        zIndex: 10,
      }}
    >
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
