'use client';

import { useState } from 'react';
import TraceSlider from './TraceSlider';
import type { PathItem } from '../lib/types';

const PRESETS = [
  { hex: '#FFFFFF', name: 'White' },
  { hex: '#C0C0C0', name: 'Silver' },
  { hex: '#FFD700', name: 'Gold' },
  { hex: '#3B82F6', name: 'Blue' },
  { hex: '#EF4444', name: 'Red' },
  { hex: '#22C55E', name: 'Green' },
  { hex: '#A855F7', name: 'Purple' },
  { hex: '#F97316', name: 'Orange' },
];

interface Props {
  paths: PathItem[];
  onChange: (paths: PathItem[]) => void;
  strokeWidthOverride: number | null;
  onStrokeWidthChange: (v: number | null) => void;
}

export default function StrokePanel({ paths, onChange, strokeWidthOverride, onStrokeWidthChange }: Props) {
  const visibleStrokes = paths.filter((p) => p.visible).map((p) => p.stroke.toUpperCase());
  const uniform = visibleStrokes.length > 0 && visibleStrokes.every((s) => s === visibleStrokes[0]);
  const currentColor = uniform ? visibleStrokes[0] : '#FFFFFF';

  const [hexInput, setHexInput] = useState(currentColor);

  const setAllStrokes = (hex: string) => {
    const upper = hex.startsWith('#') ? hex.toUpperCase() : `#${hex.toUpperCase()}`;
    setHexInput(upper);
    onChange(paths.map((p) => ({ ...p, stroke: upper })));
  };

  const onHexInputChange = (v: string) => {
    setHexInput(v.toUpperCase());
    if (/^#[0-9a-fA-F]{6}$/.test(v)) setAllStrokes(v);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <div className="mono-label" style={{ marginBottom: 10 }}>Stroke color</div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
          <label style={{ cursor: 'pointer', position: 'relative', display: 'inline-block', flexShrink: 0 }} title="Open color picker">
            <div
              style={{
                width: 40, height: 40,
                borderRadius: 12,
                background: uniform ? currentColor : 'linear-gradient(135deg,#aaa 50%,#666 50%)',
                border: '2px solid rgba(255,255,255,0.15)',
                boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)',
                transition: 'transform 0.15s',
              }}
            />
            <input type="color" value={uniform ? currentColor.toLowerCase() : '#ffffff'} onChange={(e) => setAllStrokes(e.target.value)}
              style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
          </label>
          <input
            type="text"
            value={hexInput}
            onChange={(e) => onHexInputChange(e.target.value)}
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
            placeholder="#FFFFFF"
          />
        </div>

        {!uniform && (
          <div style={{ fontSize: 11, color: 'rgba(240,238,255,0.35)', marginBottom: 10, lineHeight: 1.4 }}>
            Paths use different colors. Pick one below to apply to all.
          </div>
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {PRESETS.map((p) => (
            <button
              key={p.hex}
              onClick={() => setAllStrokes(p.hex)}
              title={p.name}
              style={{
                width: 28, height: 28,
                borderRadius: 8,
                background: p.hex,
                border: `2px solid ${currentColor === p.hex ? '#7c3aed' : 'transparent'}`,
                boxShadow: `inset 0 0 0 1px rgba(0,0,0,0.2)${currentColor === p.hex ? ', 0 0 8px rgba(124,58,237,0.4)' : ''}`,
                cursor: 'pointer',
                padding: 0,
                transition: 'transform 0.1s',
              }}
            />
          ))}
        </div>
      </div>

      <div style={{ height: 1, background: 'rgba(255,255,255,0.07)' }} />

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span className="mono-label" style={{ fontSize: 10.5 }}>Stroke width</span>
          {strokeWidthOverride !== null && (
            <button onClick={() => onStrokeWidthChange(null)} style={{ fontSize: 10.5, color: '#a78bfa', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              reset to per-path
            </button>
          )}
        </div>
        <TraceSlider
          label={strokeWidthOverride === null ? 'Override (off — using per-path)' : 'Override all paths'}
          displayVal={strokeWidthOverride === null ? 'auto' : strokeWidthOverride.toFixed(1)}
          value={strokeWidthOverride ?? 2}
          min={0.5} max={12} step={0.5}
          onChange={(v) => onStrokeWidthChange(v)}
        />
      </div>
    </div>
  );
}
