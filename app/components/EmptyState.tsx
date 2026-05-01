'use client';

import { useState, useRef } from 'react';
import { UploadIcon } from './Icons';
import { SAMPLES, SampleKey } from '../lib/samples';

const PALETTE_PREVIEW: Record<SampleKey, string> = {
  geometric: '#a78bfa',
  monogram: '#ec4899',
  icon: '#10b981',
  star: '#fbbf24',
};

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
      }}
    >
      {/* Ambient halos — stronger presence */}
      <div style={{ position: 'absolute', width: 800, height: 600, left: '-15%', top: '-25%', background: 'radial-gradient(ellipse, rgba(167,139,250,0.35) 0%, transparent 65%)', filter: 'blur(60px)', pointerEvents: 'none' }}/>
      <div style={{ position: 'absolute', width: 800, height: 600, right: '-15%', bottom: '-25%', background: 'radial-gradient(ellipse, rgba(251,207,232,0.35) 0%, transparent 65%)', filter: 'blur(60px)', pointerEvents: 'none' }}/>
      <div style={{ position: 'absolute', width: 400, height: 400, left: '50%', top: '50%', transform: 'translate(-50%,-50%)', background: 'radial-gradient(ellipse, rgba(124,58,237,0.06) 0%, transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none' }}/>

      <input
        ref={inputRef}
        type="file"
        accept=".svg"
        style={{ display: 'none' }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
      />

      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', maxWidth: 720 }}>
        <h1
          style={{
            fontFamily: 'var(--font-instrument-serif), serif',
            fontStyle: 'italic',
            fontSize: 58,
            fontWeight: 400,
            margin: '0 0 14px',
            letterSpacing: -1.4,
            lineHeight: 1.04,
            color: '#0a0a14',
          }}
        >
          animate{' '}
          <span
            style={{
              background: 'linear-gradient(135deg,#7c3aed 20%,#ec4899 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            logos
          </span>{' '}
          like they breathe
        </h1>
        <p style={{ fontSize: 15, color: '#525252', maxWidth: 460, margin: '0 0 36px', lineHeight: 1.6 }}>
          Drop an SVG and Trace will draw it stroke-by-stroke, then export to CSS, Lottie, or Python.
        </p>

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            const file = e.dataTransfer.files[0];
            if (file) handleFile(file);
            else onSamplePick('geometric');
          }}
          onClick={() => inputRef.current?.click()}
          style={{
            width: 540,
            padding: '36px 32px',
            border: `1.5px dashed ${drag ? '#7c3aed' : 'rgba(124,58,237,0.3)'}`,
            borderRadius: 22,
            background: drag
              ? 'rgba(124,58,237,0.06)'
              : 'rgba(255,255,255,0.75)',
            backdropFilter: 'blur(16px)',
            boxShadow: drag
              ? '0 0 0 4px rgba(124,58,237,0.08), 0 12px 32px rgba(124,58,237,0.1)'
              : '0 1px 3px rgba(0,0,0,0.03), 0 16px 40px rgba(0,0,0,0.05)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 14,
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.16,1,0.3,1)',
          }}
        >
          <div style={{
            width: 60,
            height: 60,
            borderRadius: 16,
            background: drag
              ? 'linear-gradient(135deg, rgba(124,58,237,0.18), rgba(236,72,153,0.18))'
              : 'linear-gradient(135deg, rgba(124,58,237,0.09), rgba(236,72,153,0.09))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#7c3aed',
            transition: 'all 0.2s',
          }}>
            <UploadIcon />
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#0a0a14' }}>Drop your SVG here</div>
          <div style={{ fontSize: 12.5, color: '#71717a' }}>or click to browse · max 2 MB · single file</div>
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '28px 0 16px' }}>
          <span style={{ height: 1, width: 64, background: 'rgba(15,23,42,0.08)' }}/>
          <span style={{ fontSize: 11, color: '#a1a1aa', fontFamily: 'var(--font-geist-mono), monospace', textTransform: 'uppercase', letterSpacing: 1.5 }}>or try a sample</span>
          <span style={{ height: 1, width: 64, background: 'rgba(15,23,42,0.08)' }}/>
        </div>

        {/* Sample pickers */}
        <div style={{ display: 'flex', gap: 10 }}>
          {(Object.keys(SAMPLES) as SampleKey[]).map((k) => {
            const hovered = hoveredSample === k;
            return (
              <button
                key={k}
                onClick={() => onSamplePick(k)}
                onMouseEnter={() => setHoveredSample(k)}
                onMouseLeave={() => setHoveredSample(null)}
                style={{
                  padding: '10px 16px',
                  background: '#fff',
                  border: `1px solid ${hovered ? 'rgba(124,58,237,0.35)' : 'rgba(15,23,42,0.09)'}`,
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  boxShadow: hovered
                    ? '0 4px 16px rgba(124,58,237,0.12), 0 1px 3px rgba(0,0,0,0.04)'
                    : '0 1px 2px rgba(0,0,0,0.04)',
                  transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
                  transition: 'all 0.18s cubic-bezier(0.16,1,0.3,1)',
                }}
              >
                <span style={{ width: 34, height: 34, background: '#0d0b18', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                  <svg width="22" height="22" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"
                    dangerouslySetInnerHTML={{ __html: extractSvgInner(SAMPLES[k].svg) }}
                  />
                </span>
                <span style={{ fontSize: 12.5, color: hovered ? '#7c3aed' : '#3f3f46', fontWeight: 500, transition: 'color 0.15s' }}>{SAMPLES[k].name}</span>
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
