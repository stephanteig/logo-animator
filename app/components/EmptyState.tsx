'use client';

import { useState, useRef } from 'react';
import { UploadIcon } from './Icons';
import { SAMPLES, SampleKey } from '../lib/samples';

interface Props {
  onSamplePick: (key: SampleKey) => void;
  onFileDrop: (svgText: string, fileName: string) => void;
}

export default function EmptyState({ onSamplePick, onFileDrop }: Props) {
  const [drag, setDrag] = useState(false);
  const [hoveredSample, setHoveredSample] = useState<SampleKey | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.name.endsWith('.svg')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) onFileDrop(text, file.name);
    };
    reader.readAsText(file);
  };

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        position: 'relative',
        overflow: 'hidden',
        background: '#08060e',
      }}
    >
      {/* Ambient orbs */}
      <div style={{ position: 'absolute', width: 640, height: 640, left: '-15%', top: '-25%', background: 'radial-gradient(circle, rgba(124,58,237,0.22) 0%, rgba(109,40,217,0.06) 45%, transparent 68%)', filter: 'blur(24px)', pointerEvents: 'none', borderRadius: '50%' }} />
      <div style={{ position: 'absolute', width: 460, height: 460, right: '-10%', bottom: '-20%', background: 'radial-gradient(circle, rgba(79,70,229,0.17) 0%, transparent 70%)', filter: 'blur(18px)', pointerEvents: 'none', borderRadius: '50%' }} />
      <div style={{ position: 'absolute', width: 200, height: 200, left: '60%', top: '35%', background: 'radial-gradient(circle, rgba(167,139,250,0.1) 0%, transparent 70%)', filter: 'blur(10px)', pointerEvents: 'none', borderRadius: '50%' }} />

      <input
        ref={inputRef}
        type="file"
        accept=".svg"
        style={{ display: 'none' }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
      />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', maxWidth: 680 }}>

        {/* Headline */}
        <h1
          style={{
            fontFamily: 'var(--font-instrument-serif), serif',
            fontStyle: 'italic',
            fontSize: 58,
            fontWeight: 400,
            margin: '0 0 12px',
            letterSpacing: -1.4,
            lineHeight: 1.04,
            color: '#f0eeff',
          }}
        >
          animate{' '}
          <span
            style={{
              background: 'linear-gradient(135deg, #ede9fe 0%, #c4b5fd 38%, #8b5cf6 72%, #7c3aed 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            logos
          </span>{' '}
          like they breathe
        </h1>

        <p style={{ fontSize: 14.5, color: 'rgba(240,238,255,0.4)', maxWidth: 440, margin: '0 0 36px', lineHeight: 1.6 }}>
          Drop an SVG and Trace will draw it stroke-by-stroke, then export to CSS, Lottie, or Python.
        </p>

        {/* Glass drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            const file = e.dataTransfer.files[0];
            if (file) handleFile(file);
          }}
          onClick={() => inputRef.current?.click()}
          style={{
            width: 480,
            padding: '36px 32px',
            border: `1.5px dashed ${drag ? 'rgba(124,58,237,0.65)' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: 16,
            background: drag ? 'rgba(124,58,237,0.065)' : 'rgba(255,255,255,0.015)',
            boxShadow: drag
              ? '0 0 0 1px rgba(124,58,237,0.18), inset 0 0 28px rgba(124,58,237,0.035)'
              : '0 24px 64px rgba(0,0,0,0.45)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 14,
            cursor: 'pointer',
            transition: 'all 0.22s cubic-bezier(0.16,1,0.3,1)',
          }}
        >
          <div style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            background: drag ? 'rgba(124,58,237,0.2)' : 'rgba(124,58,237,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#a78bfa',
            transition: 'all 0.2s',
          }}>
            <UploadIcon />
          </div>
          <div style={{ fontSize: 14, fontWeight: 500, color: 'rgba(240,238,255,0.75)' }}>Drop your SVG here</div>
          <div style={{ fontSize: 12, color: 'rgba(240,238,255,0.3)' }}>or click to browse · max 2 MB · single file</div>
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '28px 0 16px' }}>
          <span style={{ height: 1, width: 56, background: 'rgba(255,255,255,0.07)' }} />
          <span style={{ fontSize: 10.5, color: 'rgba(240,238,255,0.25)', fontFamily: 'var(--font-geist-mono), monospace', textTransform: 'uppercase', letterSpacing: 1.5 }}>or try a sample</span>
          <span style={{ height: 1, width: 56, background: 'rgba(255,255,255,0.07)' }} />
        </div>

        {/* Sample pickers */}
        <div style={{ display: 'flex', gap: 8 }}>
          {(Object.keys(SAMPLES) as SampleKey[]).map((k) => {
            const hovered = hoveredSample === k;
            return (
              <button
                key={k}
                onClick={() => onSamplePick(k)}
                onMouseEnter={() => setHoveredSample(k)}
                onMouseLeave={() => setHoveredSample(null)}
                style={{
                  padding: '9px 14px',
                  background: hovered ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${hovered ? 'rgba(124,58,237,0.45)' : 'rgba(255,255,255,0.07)'}`,
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  boxShadow: hovered ? '0 0 0 1px rgba(124,58,237,0.2), 0 8px 24px rgba(124,58,237,0.12)' : 'none',
                  transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
                  transition: 'all 0.18s cubic-bezier(0.16,1,0.3,1)',
                }}
              >
                <span style={{ width: 32, height: 32, background: '#0d0b18', borderRadius: 7, border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                  <svg width="22" height="22" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"
                    dangerouslySetInnerHTML={{ __html: extractSvgInner(SAMPLES[k].svg) }}
                  />
                </span>
                <span style={{ fontSize: 12.5, color: hovered ? '#c4b5fd' : 'rgba(240,238,255,0.55)', fontWeight: 500, transition: 'color 0.15s' }}>{SAMPLES[k].name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function extractSvgInner(svgStr: string): string {
  const match = svgStr.match(/<svg[^>]*>([\s\S]*)<\/svg>/i);
  return match?.[1] ?? '';
}
