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
      {/* Ambient halos */}
      <div style={{ position: 'absolute', width: 700, height: 500, left: '-10%', top: '-20%', background: 'radial-gradient(ellipse, rgba(196,181,253,0.4) 0%, transparent 60%)', filter: 'blur(80px)', pointerEvents: 'none' }}/>
      <div style={{ position: 'absolute', width: 700, height: 500, right: '-10%', bottom: '-20%', background: 'radial-gradient(ellipse, rgba(251,207,232,0.4) 0%, transparent 60%)', filter: 'blur(80px)', pointerEvents: 'none' }}/>

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
            fontSize: 56,
            fontWeight: 400,
            margin: '0 0 12px',
            letterSpacing: -1.2,
            lineHeight: 1.05,
            color: '#0a0a14',
          }}
        >
          animate{' '}
          <span
            style={{
              background: 'linear-gradient(135deg,#7c3aed,#ec4899)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            logos
          </span>{' '}
          like they breathe
        </h1>
        <p style={{ fontSize: 15, color: '#525252', maxWidth: 460, margin: '0 0 32px', lineHeight: 1.5 }}>
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
            width: 520,
            padding: 32,
            border: `2px dashed ${drag ? '#7c3aed' : 'rgba(124,58,237,0.4)'}`,
            borderRadius: 18,
            background: drag ? 'rgba(124,58,237,0.05)' : 'rgba(255,255,255,0.6)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 14,
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          <div style={{ width: 56, height: 56, borderRadius: 14, background: 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(236,72,153,0.1))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed' }}>
            <UploadIcon />
          </div>
          <div style={{ fontSize: 15, fontWeight: 500, color: '#0a0a14' }}>Drop your SVG here</div>
          <div style={{ fontSize: 12, color: '#71717a' }}>or click to browse · max 2MB · single file</div>
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '28px 0 14px' }}>
          <span style={{ height: 1, width: 60, background: '#ededed' }}/>
          <span style={{ fontSize: 11, color: '#a1a1aa', fontFamily: 'var(--font-geist-mono), monospace', textTransform: 'uppercase', letterSpacing: 1.4 }}>or try a sample</span>
          <span style={{ height: 1, width: 60, background: '#ededed' }}/>
        </div>

        {/* Sample pickers */}
        <div style={{ display: 'flex', gap: 10 }}>
          {(Object.keys(SAMPLES) as SampleKey[]).map((k) => (
            <button
              key={k}
              onClick={() => onSamplePick(k)}
              style={{
                padding: '10px 14px',
                background: '#fff',
                border: '1px solid #ededed',
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'border-color 0.15s',
              }}
            >
              <span style={{ width: 32, height: 32, background: '#0d0b18', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {/* Mini preview */}
                <svg width="22" height="22" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"
                  dangerouslySetInnerHTML={{ __html: extractSvgInner(SAMPLES[k].svg) }}
                />
              </span>
              <span style={{ fontSize: 12, color: '#3f3f46', fontWeight: 500 }}>{SAMPLES[k].name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function extractSvgInner(svgStr: string): string {
  const match = svgStr.match(/<svg[^>]*>([\s\S]*)<\/svg>/i);
  return match?.[1] ?? '';
}
