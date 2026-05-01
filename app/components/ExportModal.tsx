'use client';

import { useState } from 'react';
import { CloseIcon, CopyIcon } from './Icons';
import type { PathItem, Anim } from '../lib/types';

interface Props {
  paths: PathItem[];
  anim: Anim;
  fileName: string;
  onClose: () => void;
}

type Tab = 'css' | 'python' | 'lottie';

// ── Code generators ──────────────────────────────────────────

function generateCSS(paths: PathItem[], anim: Anim): string {
  const visible = paths.filter((p) => p.visible);
  const { drawDur, fillStart, stagger, hold } = anim;

  const keyframes = visible.map((p, i) => {
    const delay = i * stagger;
    const drawEnd = drawDur;
    const fillDelay = fillStart;
    return `/* Path: ${p.name} */
@keyframes draw-${i} {
  0%   { stroke-dashoffset: var(--path-len-${i}); }
  100% { stroke-dashoffset: 0; }
}
@keyframes fill-${i} {
  0%   { fill-opacity: 0; }
  100% { fill-opacity: 1; }
}

.path-${i} {
  stroke-dasharray: var(--path-len-${i});
  stroke-dashoffset: var(--path-len-${i});
  fill-opacity: 0;
  animation:
    draw-${i} ${drawEnd.toFixed(2)}s ease-in-out ${delay.toFixed(2)}s forwards,
    fill-${i} 0.6s ease-in-out ${(delay + fillStart).toFixed(2)}s forwards;
}`;
  }).join('\n\n');

  return `/* Trace — Generated CSS Animation
 * File: ${fileName(paths)}
 * Total duration: ${(drawDur + (visible.length - 1) * stagger + hold).toFixed(2)}s
 */

${keyframes}`;
}

function fileName(paths: PathItem[]): string {
  return 'logo.svg';
}

function generatePython(paths: PathItem[], anim: Anim, fileName: string): string {
  const { drawDur, fillStart, stagger, hold } = anim;
  const n = paths.filter((p) => p.visible).length;
  return `from manim import *

# Render: manim -pqh logo_animation.py LogoAnimation

config.pixel_width  = 1920
config.pixel_height = 1080
config.frame_rate   = 25

SVG_FILE     = "${fileName}"
LOGO_WIDTH   = 4.0      # Manim scene units
STROKE_COLOR = "#FFFFFF"
STROKE_WIDTH = 1.5

DRAW_TIME    = ${drawDur.toFixed(2)}      # seconds — phase 1
LAG_RATIO    = ${n > 1 ? (stagger / drawDur).toFixed(2) : '0.00'}      # stagger between paths
FILL_TIME    = 0.60      # seconds — phase 2
WAIT_BETWEEN = ${fillStart.toFixed(2)}      # pause between phases
WAIT_END     = ${hold.toFixed(2)}      # hold at end


class LogoAnimation(Scene):
    def construct(self):
        svg = SVGMobject(SVG_FILE).scale_to_fit_width(LOGO_WIDTH)

        parts     = svg.family_members_with_points()
        originals = [(m.get_fill_color(), m.get_fill_opacity()) for m in parts]

        for mob in parts:
            mob.set_fill(opacity=0)
            mob.set_stroke(color=STROKE_COLOR, width=STROKE_WIDTH, opacity=1)

        # Phase 1 — draw outlines sequentially
        self.play(
            AnimationGroup(*[Create(m) for m in parts], lag_ratio=LAG_RATIO),
            run_time=DRAW_TIME,
        )
        self.wait(WAIT_BETWEEN)

        # Phase 2 — reveal colours, fade strokes
        self.play(
            *[
                m.animate.set_fill(c, opacity=o).set_stroke(opacity=0)
                for m, (c, o) in zip(parts, originals)
            ],
            run_time=FILL_TIME,
        )
        self.wait(WAIT_END)`;
}

function generateLottie(paths: PathItem[], anim: Anim): string {
  const { drawDur, stagger, hold } = anim;
  const visible = paths.filter((p) => p.visible);
  const totalDur = drawDur + (visible.length - 1) * stagger + hold;
  const fps = 60;
  const totalFrames = Math.round(totalDur * fps);

  const lottie = {
    v: '5.7.4',
    fr: fps,
    ip: 0,
    op: totalFrames,
    w: 200,
    h: 200,
    nm: 'Trace Animation',
    ddd: 0,
    assets: [],
    layers: visible.map((p, i) => {
      const delay = i * stagger;
      const startFrame = Math.round(delay * fps);
      const endFrame = Math.round((delay + drawDur) * fps);
      return {
        ddd: 0,
        ind: i + 1,
        ty: 4,
        nm: p.name,
        ip: 0,
        op: totalFrames,
        st: 0,
        shapes: [
          {
            ty: 'sh',
            nm: 'Path',
            d: 1,
            ks: { a: 0, k: { i: [], o: [], v: [], c: false } },
          },
          {
            ty: 'st',
            nm: 'Stroke',
            c: { a: 0, k: hexToLottieColor(p.stroke) },
            o: { a: 0, k: 100 },
            w: { a: 0, k: p.strokeWidth },
            lc: 2,
            lj: 2,
            ml: 4,
          },
          {
            ty: 'tm',
            nm: 'Trim',
            s: { a: 0, k: 0 },
            e: {
              a: 1,
              k: [
                { t: startFrame, s: [0], e: [100], i: { x: [0.42], y: [1] }, o: { x: [0.58], y: [0] } },
                { t: endFrame, s: [100] },
              ],
            },
            o: { a: 0, k: 0 },
            m: 1,
          },
        ],
        ks: { o: { a: 0, k: 100 }, r: { a: 0, k: 0 }, p: { a: 0, k: [0, 0, 0] }, a: { a: 0, k: [0, 0, 0] }, s: { a: 0, k: [100, 100, 100] } },
      };
    }),
  };

  return JSON.stringify(lottie, null, 2);
}

function hexToLottieColor(hex: string): number[] {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  return [r, g, b, 1];
}

// ── Syntax highlighting ──────────────────────────────────────

const KW = new Set(['from', 'import', 'class', 'def', 'for', 'in', 'if', 'else', 'return', 'self', 'True', 'False', 'None', 'zip', 'not', 'and', 'or', 'lambda', 'while', 'with', 'as']);
const CLS = new Set(['Scene', 'SVGMobject', 'AnimationGroup', 'Create', 'config']);
const FN = new Set(['construct', 'set_fill', 'set_stroke', 'scale_to_fit_width', 'family_members_with_points', 'get_fill_color', 'get_fill_opacity', 'play', 'wait', 'animate', 'zip', 'range']);

function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function tokenizePython(src: string): string {
  let out = '', i = 0;
  while (i < src.length) {
    const ch = src[i];
    if (ch === '#') {
      let j = i;
      while (j < src.length && src[j] !== '\n') j++;
      out += `<span class="t-cm">${esc(src.slice(i, j))}</span>`;
      i = j;
      continue;
    }
    if (ch === '"' || ch === "'") {
      let j = i + 1;
      while (j < src.length) {
        if (src[j] === '\\') { j += 2; continue; }
        if (src[j] === ch) { j++; break; }
        j++;
      }
      out += `<span class="t-str">${esc(src.slice(i, j))}</span>`;
      i = j;
      continue;
    }
    if (/\d/.test(ch)) {
      let j = i;
      while (j < src.length && /[\d.]/.test(src[j])) j++;
      out += `<span class="t-num">${esc(src.slice(i, j))}</span>`;
      i = j;
      continue;
    }
    if (/[a-zA-Z_]/.test(ch)) {
      let j = i;
      while (j < src.length && /\w/.test(src[j])) j++;
      const w = src.slice(i, j);
      if (KW.has(w)) out += `<span class="t-kw">${esc(w)}</span>`;
      else if (CLS.has(w)) out += `<span class="t-cls">${esc(w)}</span>`;
      else if (FN.has(w)) out += `<span class="t-fn">${esc(w)}</span>`;
      else out += esc(w);
      i = j;
      continue;
    }
    out += esc(ch);
    i++;
  }
  return out;
}

function tokenizeCSS(src: string): string {
  // simple CSS highlight: property names in blue, values in green, comments gray
  return src
    .replace(/\/\*[\s\S]*?\*\//g, m => `<span class="t-cm">${esc(m)}</span>`)
    .replace(/([\w-]+)\s*:/g, (_, p) => `<span class="t-fn">${esc(p)}</span>:`)
    .replace(/@[\w-]+/g, m => `<span class="t-kw">${esc(m)}</span>`)
    .replace(/'[^']*'|"[^"]*"/g, m => `<span class="t-str">${esc(m)}</span>`);
}

// ── Component ────────────────────────────────────────────────

export default function ExportModal({ paths, anim, fileName, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('css');
  const [copied, setCopied] = useState(false);

  const visible = paths.filter((p) => p.visible);

  const code = tab === 'css'
    ? generateCSS(paths, anim)
    : tab === 'python'
    ? generatePython(paths, anim, fileName)
    : generateLottie(paths, anim);

  const highlighted = tab === 'python'
    ? tokenizePython(code)
    : tab === 'css'
    ? tokenizeCSS(code)
    : esc(code);

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const TABS: { id: Tab; label: string }[] = [
    { id: 'css', label: 'CSS @keyframes' },
    { id: 'python', label: 'Python (MoviePy)' },
    { id: 'lottie', label: 'Lottie JSON' },
  ];

  const COMING_SOON = ['MOV', 'GIF'];

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(10,10,20,0.55)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
    >
      <div
        className="modal-in"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 700,
          maxHeight: '90vh',
          background: '#fff',
          borderRadius: 20,
          boxShadow: '0 50px 120px -20px rgba(0,0,0,0.35), 0 0 0 1px rgba(15,23,42,0.06)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(15,23,42,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#0a0a14' }}>Export</div>
            <div style={{ fontSize: 11.5, color: '#71717a', marginTop: 2 }}>{visible.length} paths · {fileName}</div>
          </div>
          <button
            onClick={onClose}
            style={{ width: 30, height: 30, borderRadius: 8, background: '#f4f4f5', border: '1px solid rgba(15,23,42,0.08)', cursor: 'pointer', color: '#71717a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <CloseIcon />
          </button>
        </div>

        {/* Tabs + disabled formats */}
        <div style={{ padding: '12px 24px 0', borderBottom: '1px solid rgba(15,23,42,0.07)', display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                fontSize: 12.5,
                fontWeight: tab === t.id ? 500 : 400,
                background: tab === t.id ? 'linear-gradient(135deg,#a78bfa,#ec4899)' : 'transparent',
                color: tab === t.id ? '#fff' : '#71717a',
                border: 'none',
                cursor: 'pointer',
                marginBottom: 12,
                boxShadow: tab === t.id ? '0 2px 8px rgba(124,58,237,0.28)' : 'none',
                transition: 'all 0.15s',
              }}
            >
              {t.label}
            </button>
          ))}
          {COMING_SOON.map((f) => (
            <div
              key={f}
              style={{ padding: '6px 12px', borderRadius: 7, fontSize: 12.5, color: '#a1a1aa', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}
            >
              {f}
              <span style={{ fontSize: 9, padding: '1px 5px', background: '#f4f4f5', borderRadius: 4, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: 0.8 }}>soon</span>
            </div>
          ))}
        </div>

        {/* Code output */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 0 0 0', background: '#1a1a2e' }}>
          <pre
            style={{
              fontFamily: 'var(--font-geist-mono), monospace',
              fontSize: 11.5,
              lineHeight: 1.65,
              margin: 0,
              padding: '20px 24px',
              color: '#abb2bf',
            }}
            dangerouslySetInnerHTML={{ __html: highlighted }}
          />
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid rgba(15,23,42,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
          <button
            onClick={onClose}
            style={{ padding: '8px 18px', background: 'transparent', border: '1px solid rgba(15,23,42,0.1)', borderRadius: 9, fontSize: 12.5, color: '#71717a', cursor: 'pointer' }}
          >
            Close
          </button>
          <button
            onClick={handleCopy}
            style={{
              padding: '8px 18px',
              background: copied ? '#10b981' : 'linear-gradient(135deg,#7c3aed,#ec4899)',
              border: 'none',
              borderRadius: 9,
              fontSize: 12.5,
              fontWeight: 500,
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: copied ? '0 2px 8px rgba(16,185,129,0.3)' : '0 2px 8px rgba(124,58,237,0.3)',
              transition: 'all 0.2s',
            }}
          >
            <CopyIcon />
            {copied ? '✓ Copied!' : 'Copy code'}
          </button>
        </div>
      </div>
    </div>
  );
}
