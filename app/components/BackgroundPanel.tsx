'use client';

import { useState, useEffect } from 'react';

const PRESETS: { id: string; label: string; value: string; swatch: string }[] = [
  { id: 'transparent', label: 'Transparent', value: 'transparent', swatch: 'checker' },
  { id: 'dark',  label: 'Dark',  value: '#0d0b18', swatch: '#0d0b18' },
  { id: 'black', label: 'Black', value: '#000000', swatch: '#000000' },
  { id: 'white', label: 'White', value: '#ffffff', swatch: '#ffffff' },
];

interface Props {
  bgColor: string;
  onChange: (value: string) => void;
}

export default function BackgroundPanel({ bgColor, onChange }: Props) {
  const matchedPreset = PRESETS.find((p) => p.value.toLowerCase() === bgColor.toLowerCase());
  const isTransparent = bgColor === 'transparent';
  const [hexInput, setHexInput] = useState(isTransparent ? '#0D0B18' : bgColor.toUpperCase());

  useEffect(() => {
    if (!isTransparent) setHexInput(bgColor.toUpperCase());
  }, [bgColor, isTransparent]);

  const setCustom = (v: string) => {
    const upper = v.startsWith('#') ? v.toUpperCase() : `#${v.toUpperCase()}`;
    setHexInput(upper);
    if (/^#[0-9a-fA-F]{6}$/.test(v.startsWith('#') ? v : `#${v}`)) onChange(upper);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <div className="mono-label" style={{ marginBottom: 10 }}>Preset</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {PRESETS.map((p) => {
            const active = matchedPreset?.id === p.id;
            return (
              <button
                key={p.id}
                onClick={() => onChange(p.value)}
                className={`preset-btn${active ? ' active' : ''}`}
              >
                <span
                  style={{
                    width: 18, height: 18,
                    borderRadius: 4,
                    flexShrink: 0,
                    border: '1px solid rgba(255,255,255,0.12)',
                    ...(p.swatch === 'checker'
                      ? { background: 'repeating-conic-gradient(#555 0% 25%,#222 0% 50%) 0/8px 8px' }
                      : { background: p.swatch }),
                  }}
                />
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {!isTransparent && (
        <div>
          <div className="mono-label" style={{ marginBottom: 10 }}>Custom color</div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <label style={{ cursor: 'pointer', position: 'relative', display: 'inline-block', flexShrink: 0 }} title="Open color picker">
              <div
                style={{
                  width: 40, height: 40,
                  borderRadius: 12,
                  background: bgColor,
                  border: '2px solid rgba(255,255,255,0.15)',
                  boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)',
                }}
              />
              <input type="color" value={bgColor.toLowerCase()} onChange={(e) => onChange(e.target.value.toUpperCase())}
                style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
            </label>
            <input
              type="text"
              value={hexInput}
              onChange={(e) => setCustom(e.target.value)}
              maxLength={7}
              style={{
                flex: 1, padding: '7px 10px',
                fontFamily: 'var(--font-geist-mono), monospace',
                fontSize: 12,
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                textTransform: 'uppercase',
                background: 'rgba(255,255,255,0.05)',
                color: '#f0eeff',
                outline: 'none',
              }}
              placeholder="#0D0B18"
            />
          </div>
        </div>
      )}

      {isTransparent && (
        <div
          style={{
            padding: 10,
            background: 'rgba(59,130,246,0.08)',
            border: '1px solid rgba(59,130,246,0.22)',
            borderRadius: 9,
            fontSize: 11.5,
            color: 'rgba(147,197,253,0.8)',
            lineHeight: 1.5,
          }}
        >
          Transparent canvas — exports preserve alpha. Use MOV / Lottie when wiring up render.
        </div>
      )}
    </div>
  );
}
