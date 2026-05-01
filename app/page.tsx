'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import HeroBand from './components/HeroBand';
import TraceWordmark from './components/TraceWordmark';
import EmptyState from './components/EmptyState';
import PathList from './components/PathList';
import TraceSlider from './components/TraceSlider';
import KeyboardOverlay from './components/KeyboardOverlay';
import AnimatedPreview from './components/AnimatedPreview';
import ExportModal from './components/ExportModal';
import StrokePanel from './components/StrokePanel';
import BackgroundPanel from './components/BackgroundPanel';
import {
  DownloadIcon,
  PlayIcon,
  PauseIcon,
  ReplayIcon,
  SparkleIcon,
  OnceIcon,
  LoopIcon,
  PingpongIcon,
  SplitIcon,
} from './components/Icons';
import { SAMPLES, type SampleKey } from './lib/samples';
import { parseSVG, applySmartDefaults } from './lib/svgParser';
import type { PathItem, LoopMode } from './lib/types';

const FILL_BLOOM_DUR = 0.6;

// ── Shared style tokens ──────────────────────────────────────
const T = {
  textHi:    '#f0eeff',
  textMid:   'rgba(240,238,255,0.55)',
  textLo:    'rgba(240,238,255,0.25)',
  borderSub: 'rgba(255,255,255,0.07)',
  borderMed: 'rgba(255,255,255,0.13)',
  accent:    '#7c3aed',
  bgDeep:    '#08060e',
  bgPanel:   'rgba(8,6,14,0.55)',
};

export default function Home() {
  const [paths, setPaths] = useState<PathItem[]>([]);
  const [svgMarkup, setSvgMarkup] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');

  const [drawDur, setDrawDur] = useState(2.4);
  const [fillStart, setFillStart] = useState(1.0);
  const [stagger, setStagger] = useState(0.18);
  const [hold, setHold] = useState(0.6);

  const [smartDefaults, setSmartDefaults] = useState(true);
  const [loop, setLoop] = useState<LoopMode>('once');
  const [split, setSplit] = useState(false);
  const [splitPos, setSplitPos] = useState(50);
  const [playing, setPlaying] = useState(false);
  const [direction, setDirection] = useState(1);
  const [elapsed, setElapsed] = useState(0);
  const [format, setFormat] = useState<'1:1' | '16:9' | '9:16'>('1:1');

  const [showKbd, setShowKbd] = useState(false);
  const [showExport, setShowExport] = useState(false);

  const [tab, setTab] = useState<'animation' | 'stroke' | 'background'>('animation');
  const [bgColor, setBgColor] = useState<string>('#0d0b18');
  const [strokeWidthOverride, setStrokeWidthOverride] = useState<number | null>(null);

  const visibleCount = paths.filter((p) => p.visible).length;
  const totalDur =
    drawDur + Math.max(0, visibleCount - 1) * stagger + Math.max(fillStart + FILL_BLOOM_DUR - drawDur, 0) + hold;

  const fileLoaded = paths.length > 0;

  // ── Loaders ─────────────────────────────────────────────────
  const loadSample = useCallback((key: SampleKey) => {
    const s = SAMPLES[key];
    const { paths: parsed, svgMarkup: markup } = parseSVG(s.svg);
    setPaths(parsed);
    setSvgMarkup(markup);
    setFileName(`${s.name.toLowerCase()}.svg`);
    if (smartDefaults) {
      const d = applySmartDefaults(parsed.length);
      setDrawDur(d.drawDur);
      setStagger(d.stagger);
      setFillStart(d.fillStart);
      setHold(d.hold);
    }
    setElapsed(0);
    setPlaying(true);
    setDirection(1);
  }, [smartDefaults]);

  const loadSVGText = useCallback((text: string, name: string) => {
    const { paths: parsed, svgMarkup: markup } = parseSVG(text);
    if (parsed.length === 0) return;
    setPaths(parsed);
    setSvgMarkup(markup);
    setFileName(name);
    if (smartDefaults) {
      const d = applySmartDefaults(parsed.length);
      setDrawDur(d.drawDur);
      setStagger(d.stagger);
      setFillStart(d.fillStart);
      setHold(d.hold);
    }
    setElapsed(0);
    setPlaying(true);
    setDirection(1);
  }, [smartDefaults]);

  const clearFile = () => {
    setPaths([]);
    setSvgMarkup('');
    setFileName('');
    setPlaying(false);
    setElapsed(0);
  };

  const onToggleSmartDefaults = (next: boolean) => {
    setSmartDefaults(next);
    if (next && paths.length > 0) {
      const d = applySmartDefaults(paths.length);
      setDrawDur(d.drawDur);
      setStagger(d.stagger);
      setFillStart(d.fillStart);
      setHold(d.hold);
    }
  };

  // ── Animation loop (RAF) ────────────────────────────────────
  useEffect(() => {
    if (!playing || totalDur <= 0) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      setElapsed((t) => {
        let next = t + dt * direction;
        if (loop === 'once') {
          if (next >= totalDur) { next = totalDur; setPlaying(false); }
        } else if (loop === 'loop') {
          if (next >= totalDur) next = 0;
        } else {
          if (next >= totalDur) { next = totalDur; setDirection(-1); }
          else if (next <= 0)   { next = 0; setDirection(1); }
        }
        return next;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, loop, direction, totalDur]);

  // ── Keyboard shortcuts ──────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;

      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault(); setShowKbd((s) => !s);
      } else if (e.key === ' ') {
        e.preventDefault(); setPlaying((p) => !p);
      } else if (e.key === 'r' || e.key === 'R') {
        setElapsed(0); setDirection(1); setPlaying(true);
      } else if (e.key === 'l' || e.key === 'L') {
        setLoop((m) => (m === 'once' ? 'loop' : m === 'loop' ? 'pingpong' : 'once'));
      } else if (e.key === 's' || e.key === 'S') {
        setSplit((s) => !s);
      } else if (e.key === '1') { setFormat('1:1');
      } else if (e.key === '2') { setFormat('16:9');
      } else if (e.key === '3') { setFormat('9:16');
      } else if (e.key === 'ArrowLeft') {
        setElapsed((t) => Math.max(0, t - (e.shiftKey ? t : 0.1)));
      } else if (e.key === 'ArrowRight') {
        setElapsed((t) => Math.min(totalDur, t + (e.shiftKey ? totalDur - t : 0.1)));
      } else if (e.key === 'Escape') {
        setShowKbd(false); setShowExport(false);
      } else if ((e.metaKey || e.ctrlKey) && (e.key === 'e' || e.key === 'E')) {
        e.preventDefault(); setShowExport(true);
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'Backspace') {
        e.preventDefault(); clearFile();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [totalDur]);

  // ── Scrubber ────────────────────────────────────────────────
  const barRef = useRef<HTMLDivElement>(null);
  const startScrub = (e: React.MouseEvent) => {
    e.preventDefault();
    setPlaying(false);
    if (!barRef.current) return;
    const rect = barRef.current.getBoundingClientRect();
    const update = (clientX: number) => {
      const x = (clientX - rect.left) / rect.width;
      setElapsed(Math.max(0, Math.min(1, x)) * totalDur);
    };
    update(e.clientX);
    const onMove = (ev: MouseEvent) => update(ev.clientX);
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  // ── Empty state ──────────────────────────────────────────────
  if (!fileLoaded) {
    return (
      <div style={{ width: '100%', height: '100vh', minHeight: 760, background: T.bgDeep, fontFamily: 'var(--font-geist-sans)', display: 'flex', flexDirection: 'column' }}>
        <HeroBand>
          <TraceWordmark />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => setShowKbd(true)}
              title="Keyboard shortcuts (?)"
              style={{ width: 28, height: 28, background: 'rgba(255,255,255,0.06)', color: T.textMid, border: `1px solid ${T.borderSub}`, borderRadius: 6, fontSize: 11, fontFamily: 'var(--font-geist-mono), monospace', cursor: 'pointer' }}
            >?</button>
          </div>
        </HeroBand>
        <EmptyState onSamplePick={loadSample} onFileDrop={loadSVGText} />
        {showKbd && <KeyboardOverlay onClose={() => setShowKbd(false)} />}
      </div>
    );
  }

  // ── Editor ───────────────────────────────────────────────────
  const PREVIEW_MAX_W = 640;
  const PREVIEW_MAX_H = 540;
  const ratio = format === '16:9' ? 16 / 9 : format === '9:16' ? 9 / 16 : 1;
  let previewBoxW = PREVIEW_MAX_W;
  let previewBoxH = previewBoxW / ratio;
  if (previewBoxH > PREVIEW_MAX_H) { previewBoxH = PREVIEW_MAX_H; previewBoxW = previewBoxH * ratio; }
  previewBoxW = Math.round(previewBoxW);
  previewBoxH = Math.round(previewBoxH);

  const previewW = format === '16:9' ? 1920 : format === '9:16' ? 1080 : 1080;
  const previewH = format === '16:9' ? 1080 : format === '9:16' ? 1920 : 1080;

  const cur = elapsed.toFixed(2);
  const dur = totalDur.toFixed(2);
  const scrubPct = totalDur > 0 ? (elapsed / totalDur) * 100 : 0;

  return (
    <div style={{ width: '100%', height: '100vh', minHeight: 760, background: T.bgDeep, color: T.textHi, fontFamily: 'var(--font-geist-sans)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ── Navbar ── */}
      <HeroBand>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <TraceWordmark />
          <nav style={{ display: 'flex', gap: 2, fontSize: 12.5 }}>
            {([
              ['animation', 'Animation'],
              ['stroke',    'Stroke'],
              ['background','Background'],
            ] as const).map(([id, label]) => {
              const active = tab === id;
              return (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: 7,
                    color: active ? '#fff' : T.textMid,
                    background: active ? 'rgba(124,58,237,0.7)' : 'transparent',
                    fontWeight: active ? 500 : 400,
                    cursor: 'pointer',
                    border: 'none',
                    fontFamily: 'inherit',
                    fontSize: 12.5,
                    boxShadow: active ? '0 0 10px rgba(124,58,237,0.35)' : 'none',
                    transition: 'all 0.15s',
                  }}
                >
                  {label}
                </button>
              );
            })}
          </nav>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: T.textLo, fontFamily: 'var(--font-geist-mono), monospace', background: 'rgba(255,255,255,0.05)', border: `1px solid ${T.borderSub}`, padding: '2px 9px', borderRadius: 6 }}>
            {fileName} · {paths.length} paths
          </span>
          <button
            onClick={() => setShowKbd(true)}
            title="Keyboard shortcuts (?)"
            style={{ width: 30, height: 30, background: 'rgba(255,255,255,0.06)', color: T.textMid, border: `1px solid ${T.borderSub}`, borderRadius: 7, fontSize: 11, fontFamily: 'var(--font-geist-mono), monospace', cursor: 'pointer' }}
          >?</button>
          <button
            onClick={clearFile}
            style={{ background: 'rgba(255,255,255,0.07)', color: T.textMid, border: `1px solid ${T.borderSub}`, padding: '6px 14px', borderRadius: 8, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}
          >New</button>
          <button
            onClick={() => setShowExport(true)}
            style={{ background: T.accent, color: '#fff', border: 'none', padding: '7px 18px', borderRadius: 9, fontSize: 12.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', boxShadow: '0 0 20px rgba(124,58,237,0.45), 0 2px 8px rgba(0,0,0,0.4)', fontFamily: 'inherit' }}
          >
            <DownloadIcon /> Export
          </button>
        </div>
      </HeroBand>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ── Sidebar ── */}
        <aside style={{ width: 300, padding: '16px 16px', borderRight: `1px solid ${T.borderSub}`, display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto', flexShrink: 0, background: T.bgPanel, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>

          {tab === 'animation' && (
            <>
              {/* Smart defaults toggle */}
              <div style={{ padding: '12px 14px', background: smartDefaults ? 'rgba(124,58,237,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${smartDefaults ? 'rgba(124,58,237,0.28)' : T.borderSub}`, borderRadius: 12 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: smartDefaults ? '#c4b5fd' : T.textMid }}>
                      <SparkleIcon /> Smart defaults
                    </div>
                    <div style={{ fontSize: 11, color: T.textLo, marginTop: 3, lineHeight: 1.4 }}>Auto-tune timing per file</div>
                  </div>
                  <button
                    onClick={() => onToggleSmartDefaults(!smartDefaults)}
                    style={{ width: 36, height: 22, borderRadius: 99, background: smartDefaults ? T.accent : 'rgba(255,255,255,0.12)', border: 'none', position: 'relative', cursor: 'pointer', flexShrink: 0, boxShadow: smartDefaults ? '0 0 10px rgba(124,58,237,0.45)' : 'none', transition: 'all 0.2s' }}
                  >
                    <span style={{ position: 'absolute', top: 3, left: smartDefaults ? 17 : 3, width: 16, height: 16, borderRadius: 99, background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.3)', transition: 'left 0.18s cubic-bezier(0.16,1,0.3,1)' }} />
                  </button>
                </div>
              </div>

              {/* Format */}
              <div>
                <div className="mono-label" style={{ marginBottom: 8 }}>Format</div>
                <div className="seg-ctrl">
                  {(['1:1', '16:9', '9:16'] as const).map((r) => (
                    <button key={r} onClick={() => setFormat(r)} className={`seg-btn${format === r ? ' on' : ''}`} style={{ flex: 1 }}>{r}</button>
                  ))}
                </div>
              </div>

              <PathList paths={paths} onChange={setPaths} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="mono-label">Timing</div>
                <TraceSlider label="Stroke draw"  displayVal={`${drawDur.toFixed(2)}s`}  value={drawDur}   min={0.3} max={6} onChange={setDrawDur} />
                <TraceSlider label="Fill bloom"   displayVal={`${fillStart.toFixed(2)}s`} value={fillStart} min={0}   max={3} onChange={setFillStart} />
                <TraceSlider label="Path stagger" displayVal={`${stagger.toFixed(2)}s`}   value={stagger}   min={0}   max={1} onChange={setStagger} />
                <TraceSlider label="Hold at end"  displayVal={`${hold.toFixed(2)}s`}      value={hold}      min={0}   max={3} onChange={setHold} />
              </div>
            </>
          )}

          {tab === 'stroke' && (
            <StrokePanel paths={paths} onChange={setPaths} strokeWidthOverride={strokeWidthOverride} onStrokeWidthChange={setStrokeWidthOverride} />
          )}

          {tab === 'background' && (
            <BackgroundPanel bgColor={bgColor} onChange={setBgColor} />
          )}
        </aside>

        {/* ── Main ── */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Preview area */}
          <div className="workspace-grid" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', background: T.bgDeep }}>

            {/* Live badge */}
            <div className="badge-glass" style={{ position: 'absolute', top: 14, left: 18 }}>
              <span style={{ width: 6, height: 6, borderRadius: 99, background: '#10b981', boxShadow: '0 0 0 2.5px rgba(16,185,129,0.2)' }} />
              <span style={{ fontSize: 11 }}>Live preview</span>
            </div>
            {/* Resolution badge */}
            <div className="badge-glass" style={{ position: 'absolute', top: 14, right: 18, fontFamily: 'var(--font-geist-mono), monospace' }}>
              <span style={{ fontSize: 10.5 }}>{previewW} × {previewH}</span>
            </div>

            {!split && (
              <div style={{ width: previewBoxW, height: previewBoxH }}>
                <AnimatedPreview paths={paths} svgMarkup={svgMarkup} elapsed={elapsed} drawDur={drawDur} fillStart={fillStart} stagger={stagger} bgColor={bgColor} strokeWidthOverride={strokeWidthOverride} />
              </div>
            )}

            {split && (
              <div style={{ position: 'relative', width: previewBoxW, height: previewBoxH, borderRadius: 18, overflow: 'hidden', background: '#0d0b18' }}>
                <div style={{ position: 'absolute', inset: 0 }}>
                  <AnimatedPreview paths={paths} svgMarkup={svgMarkup} elapsed={elapsed} drawDur={drawDur} fillStart={fillStart} stagger={stagger} bgColor={bgColor} strokeWidthOverride={strokeWidthOverride} showHalo={false} />
                </div>
                <div style={{ position: 'absolute', inset: 0, clipPath: `inset(0 ${100 - splitPos}% 0 0)`, background: bgColor === 'transparent' ? '#0d0b18' : bgColor }}>
                  <AnimatedPreview paths={paths} svgMarkup={svgMarkup} elapsed={totalDur} drawDur={drawDur} fillStart={fillStart} stagger={stagger} bgColor={bgColor} strokeWidthOverride={strokeWidthOverride} frozen desaturate showHalo={false} />
                </div>
                <div style={{ position: 'absolute', top: 12, left: 12, padding: '3px 8px', background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)', borderRadius: 5, fontSize: 9.5, fontFamily: 'var(--font-geist-mono), monospace', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 1 }}>Original</div>
                <div style={{ position: 'absolute', top: 12, right: 12, padding: '3px 8px', background: 'rgba(124,58,237,0.55)', backdropFilter: 'blur(8px)', borderRadius: 5, fontSize: 9.5, fontFamily: 'var(--font-geist-mono), monospace', color: '#fff', textTransform: 'uppercase', letterSpacing: 1 }}>Animated</div>
                {/* Drag handle */}
                <div
                  onMouseDown={(e) => {
                    e.preventDefault();
                    const parent = e.currentTarget.parentElement!;
                    const rect = parent.getBoundingClientRect();
                    const onMove = (ev: MouseEvent) => setSplitPos(Math.max(5, Math.min(95, ((ev.clientX - rect.left) / rect.width) * 100)));
                    const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
                    window.addEventListener('mousemove', onMove);
                    window.addEventListener('mouseup', onUp);
                  }}
                  style={{ position: 'absolute', top: 0, bottom: 0, left: `${splitPos}%`, width: 2, background: 'rgba(255,255,255,0.5)', cursor: 'ew-resize' }}
                >
                  <div style={{ position: 'absolute', top: '50%', left: -15, width: 30, height: 30, borderRadius: 99, background: '#fff', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.5)', fontSize: 11, color: '#0a0a14', fontWeight: 700 }}>⇆</div>
                </div>
              </div>
            )}

            {/* Split button */}
            <button
              onClick={() => setSplit(!split)}
              title="Split compare (S)"
              style={{
                position: 'absolute', bottom: 16, right: 18,
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 13px',
                background: split ? T.accent : 'rgba(255,255,255,0.07)',
                color: split ? '#fff' : T.textMid,
                border: `1px solid ${split ? 'transparent' : T.borderSub}`,
                borderRadius: 9, fontSize: 11.5, fontFamily: 'inherit',
                cursor: 'pointer', fontWeight: 500,
                backdropFilter: split ? 'none' : 'blur(8px)',
                boxShadow: split ? '0 0 16px rgba(124,58,237,0.45)' : '0 2px 8px rgba(0,0,0,0.3)',
                transition: 'all 0.18s cubic-bezier(0.16,1,0.3,1)',
              }}
            >
              <SplitIcon /> {split ? 'Single' : 'Split'}
            </button>
          </div>

          {/* ── Scrub bar ── */}
          <div style={{ padding: '14px 24px 6px', borderTop: `1px solid ${T.borderSub}`, background: 'rgba(8,6,14,0.7)', backdropFilter: 'blur(8px)' }}>
            <div ref={barRef} onMouseDown={startScrub} style={{ height: 32, position: 'relative', cursor: 'pointer', userSelect: 'none' }}>
              <div style={{ position: 'absolute', left: 0, right: 0, top: 0, display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-geist-mono), monospace', fontSize: 9, color: T.textLo }}>
                <span>0.0s</span>
                <span>{(totalDur * 0.25).toFixed(1)}s</span>
                <span>{(totalDur * 0.5).toFixed(1)}s</span>
                <span>{(totalDur * 0.75).toFixed(1)}s</span>
                <span>{totalDur.toFixed(1)}s</span>
              </div>
              <div style={{ position: 'absolute', left: 0, right: 0, top: 19, height: 5, background: 'rgba(255,255,255,0.08)', borderRadius: 99 }}>
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${scrubPct}%`, background: 'linear-gradient(90deg,#7c3aed,#a855f7)', borderRadius: 99 }} />
              </div>
              <div style={{ position: 'absolute', left: `calc(${scrubPct}% - 9px)`, top: 13, width: 18, height: 20, borderRadius: 5, background: '#fff', border: '2px solid #7c3aed', boxShadow: '0 2px 8px rgba(124,58,237,0.5), 0 0 0 3px rgba(124,58,237,0.15)' }} />
            </div>
          </div>

          {/* ── Transport controls ── */}
          <div style={{ padding: '6px 22px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(8,6,14,0.7)', backdropFilter: 'blur(8px)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                onClick={() => { if (elapsed >= totalDur) setElapsed(0); setPlaying((p) => !p); setDirection(1); }}
                style={{ width: 36, height: 36, background: T.accent, border: 'none', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer', boxShadow: '0 0 20px rgba(124,58,237,0.5), 0 2px 8px rgba(0,0,0,0.4)', transition: 'box-shadow 0.15s' }}
              >
                {playing ? <PauseIcon /> : <PlayIcon />}
              </button>
              <span style={{ color: T.textLo, fontFamily: 'var(--font-geist-mono), monospace', fontSize: 11.5 }}>
                {cur}s / {dur}s
              </span>
            </div>

            {/* Loop selector */}
            <div className="seg-ctrl">
              {[
                { id: 'once',     icon: <OnceIcon />,     label: 'Once' },
                { id: 'loop',     icon: <LoopIcon />,     label: 'Loop' },
                { id: 'pingpong', icon: <PingpongIcon />, label: 'Ping-pong' },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setLoop(m.id as LoopMode)}
                  className={`seg-btn${loop === m.id ? ' on' : ''}`}
                  style={{ padding: '5px 11px', display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}
                >
                  {m.icon} {m.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => { setElapsed(0); setDirection(1); setPlaying(true); }}
              style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${T.borderSub}`, color: T.textMid, padding: '7px 14px', borderRadius: 8, fontSize: 11.5, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              <ReplayIcon /> Replay
            </button>
          </div>
        </main>
      </div>

      {showKbd && <KeyboardOverlay onClose={() => setShowKbd(false)} />}
      {showExport && (
        <ExportModal paths={paths} anim={{ drawDur, fillStart, hold, stagger }} fileName={fileName} onClose={() => setShowExport(false)} />
      )}
    </div>
  );
}
