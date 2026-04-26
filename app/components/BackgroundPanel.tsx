'use client';

import { useState, useEffect } from 'react';

const PRESETS: { id: string; label: string; value: string; swatch: string }[] = [
  { id: 'transparent', label: 'Transparent', value: 'transparent', swatch: 'checker' },
  { id: 'dark', label: 'Dark', value: '#0d0b18', swatch: '#0d0b18' },
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
    if (/^#[0-9a-fA-F]{6}$/.test(v.startsWith('#') ? v : `#${v}`)) {
      onChange(upper);
    }
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
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 10px',
                  background: active ? '#fafafa' : '#fff',
                  border: `1px solid ${active ? '#a78bfa' : '#ededed'}`,
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: 12,
                  color: '#0a0a14',
                  fontWeight: active ? 500 : 400,
                  textAlign: 'left',
                }}
              >
                <span
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 4,
                    flexShrink: 0,
                    border: '1px solid rgba(0,0,0,0.08)',
                    ...(p.swatch === 'checker'
                      ? {
                          background:
                            'repeating-conic-gradient(#555 0% 25%, #222 0% 50%) 0/10px 10px',
                        }
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
            <label
              style={{ cursor: 'pointer', position: 'relative', display: 'inline-block', flexShrink: 0 }}
              title="Open color picker"
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: bgColor,
                  border: '2px solid #ededed',
                  boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)',
                }}
              />
              <input
                type="color"
                value={bgColor.toLowerCase()}
                onChange={(e) => onChange(e.target.value.toUpperCase())}
                style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
              />
            </label>
            <input
              type="text"
              value={hexInput}
              onChange={(e) => setCustom(e.target.value)}
              maxLength={7}
              style={{
                flex: 1,
                padding: '6px 10px',
                fontFamily: 'var(--font-geist-mono), monospace',
                fontSize: 12,
                border: '1px solid #ededed',
                borderRadius: 8,
                textTransform: 'uppercase',
                background: '#fafafa',
                color: '#0a0a14',
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
            background: 'rgba(124,58,237,0.06)',
            border: '1px solid rgba(124,58,237,0.18)',
            borderRadius: 8,
            fontSize: 11.5,
            color: '#3f3f46',
            lineHeight: 1.4,
          }}
        >
          Transparent canvas — exports preserve alpha. Use MOV / Lottie when you wire up render.
        </div>
      )}
    </div>
  );
}
