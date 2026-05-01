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
          if (next >= totalDur) {
            next = totalDur;
            setPlaying(false);
          }
        } else if (loop === 'loop') {
          if (next >= totalDur) next = 0;
        } else {
          if (next >= totalDur) {
            next = totalDur;
            setDirection(-1);
          } else if (next <= 0) {
            next = 0;
            setDirection(1);
          }
        }
        return next;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, loop, direction, totalDur]);

  // ── Keyboard (F10) ──────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;

      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setShowKbd((s) => !s);
      } else if (e.key === ' ') {
        e.preventDefault();
        setPlaying((p) => !p);
      } else if (e.key === 'r' || e.key === 'R') {
        setElapsed(0);
        setDirection(1);
        setPlaying(true);
      } else if (e.key === 'l' || e.key === 'L') {
        setLoop((m) => (m === 'once' ? 'loop' : m === 'loop' ? 'pingpong' : 'once'));
      } else if (e.key === 's' || e.key === 'S') {
        setSplit((s) => !s);
      } else if (e.key === '1') {
        setFormat('1:1');
      } else if (e.key === '2') {
        setFormat('16:9');
      } else if (e.key === '3') {
        setFormat('9:16');
      } else if (e.key === 'ArrowLeft') {
        setElapsed((t) => Math.max(0, t - (e.shiftKey ? t : 0.1)));
      } else if (e.key === 'ArrowRight') {
        setElapsed((t) => Math.min(totalDur, t + (e.shiftKey ? totalDur - t : 0.1)));
      } else if (e.key === 'Escape') {
        setShowKbd(false);
        setShowExport(false);
      } else if ((e.metaKey || e.ctrlKey) && (e.key === 'e' || e.key === 'E')) {
        e.preventDefault();
        setShowExport(true);
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'Backspace') {
        e.preventDefault();
        clearFile();
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
      const clamped = Math.max(0, Math.min(1, x));
      setElapsed(clamped * totalDur);
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

  // Empty state branch
  if (!fileLoaded) {
    return (
      <div style={{ width: '100%', height: '100vh', minHeight: 760, background: '#fff', fontFamily: 'var(--font-geist-sans)', display: 'flex', flexDirection: 'column' }}>
        <HeroBand>
          <TraceWordmark />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-geist-mono), monospace' }}>no file</span>
        </HeroBand>
        <EmptyState onSamplePick={loadSample} onFileDrop={loadSVGText} />
        {showKbd && <KeyboardOverlay onClose={() => setShowKbd(false)} />}
      </div>
    );
  }

  // Editor — compute the preview box from the actual aspect ratio so 1:1,
  // 16:9, and 9:16 each render at their true proportions.
  const PREVIEW_MAX_W = 640;
  const PREVIEW_MAX_H = 540;
  const ratio = format === '16:9' ? 16 / 9 : format === '9:16' ? 9 / 16 : 1;
  // Fit inside (PREVIEW_MAX_W × PREVIEW_MAX_H), preserving the ratio.
  let previewBoxW = PREVIEW_MAX_W;
  let previewBoxH = previewBoxW / ratio;
  if (previewBoxH > PREVIEW_MAX_H) {
    previewBoxH = PREVIEW_MAX_H;
    previewBoxW = previewBoxH * ratio;
  }
  previewBoxW = Math.round(previewBoxW);
  previewBoxH = Math.round(previewBoxH);

  // The dimension label shown in the corner. Uses a canonical 1080-line frame
  // size for each ratio so users see the actual export size.
  const previewW = format === '16:9' ? 1920 : format === '9:16' ? 1080 : 1080;
  const previewH = format === '16:9' ? 1080 : format === '9:16' ? 1920 : 1080;

  const cur = elapsed.toFixed(2);
  const dur = totalDur.toFixed(2);
  const scrubPct = totalDur > 0 ? (elapsed / totalDur) * 100 : 0;

  return (
    <div style={{ width: '100%', height: '100vh', minHeight: 760, background: '#fafafa', color: '#0a0a14', fontFamily: 'var(--font-geist-sans)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <HeroBand>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <TraceWordmark />
          <nav style={{ display: 'flex', gap: 2, fontSize: 12.5 }}>
            {([
              ['animation', 'Animation'],
              ['stroke', 'Stroke'],
              ['background', 'Background'],
            ] as const).map(([id, label]) => {
              const active = tab === id;
              return (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  style={{
                    padding: '5px 11px',
                    borderRadius: 7,
                    color: active ? '#fff' : 'rgba(255,255,255,0.65)',
                    background: active ? 'rgba(255,255,255,0.15)' : 'transparent',
                    fontWeight: active ? 500 : 400,
                    cursor: 'pointer',
                    border: 'none',
                    fontFamily: 'inherit',
                    fontSize: 12.5,
                  }}
                >
                  {label}
                </button>
              );
            })}
          </nav>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-geist-mono), monospace' }}>
            {fileName} · {paths.length} paths
          </span>
          <button
            onClick={() => setShowKbd(true)}
            title="Keyboard shortcuts (?)"
            style={{ width: 30, height: 30, background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 7, fontSize: 11, fontFamily: 'var(--font-geist-mono), monospace', cursor: 'pointer' }}
          >
            ?
          </button>
          <button
            onClick={clearFile}
            style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.18)', padding: '6px 14px', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}
          >
            New
          </button>
          <button
            onClick={() => setShowExport(true)}
            style={{ background: '#fff', color: '#0a0814', border: 'none', padding: '7px 18px', borderRadius: 9, fontSize: 12.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
          >
            <DownloadIcon /> Export
          </button>
        </div>
      </HeroBand>

      <div style={{ flex: 1, display: 'flex', background: '#fff', overflow: 'hidden' }}>
        <aside style={{ width: 308, padding: '18px 18px', borderRight: '1px solid rgba(15,23,42,0.07)', display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto', flexShrink: 0, background: '#fdfdfe' }}>
          {tab === 'animation' && (
            <>
              {/* Smart defaults */}
              <div style={{ padding: '12px 14px', background: smartDefaults ? 'linear-gradient(135deg, rgba(124,58,237,0.05), rgba(236,72,153,0.05))' : 'rgba(15,23,42,0.02)', border: `1px solid ${smartDefaults ? 'rgba(124,58,237,0.2)' : 'rgba(15,23,42,0.07)'}`, borderRadius: 12 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: smartDefaults ? '#7c3aed' : '#3f3f46' }}>
                      <SparkleIcon /> Smart defaults
                    </div>
                    <div style={{ fontSize: 11, color: '#71717a', marginTop: 3, lineHeight: 1.4 }}>Auto-tune timing per file</div>
                  </div>
                  <button
                    onClick={() => onToggleSmartDefaults(!smartDefaults)}
                    style={{ width: 36, height: 22, borderRadius: 99, background: smartDefaults ? 'linear-gradient(135deg,#7c3aed,#a855f7)' : '#d4d4d8', border: 'none', position: 'relative', cursor: 'pointer', flexShrink: 0, boxShadow: smartDefaults ? '0 2px 6px rgba(124,58,237,0.35)' : 'none', transition: 'all 0.2s' }}
                  >
                    <span style={{ position: 'absolute', top: 3, left: smartDefaults ? 17 : 3, width: 16, height: 16, borderRadius: 99, background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.2)', transition: 'left 0.18s cubic-bezier(0.16,1,0.3,1)' }} />
                  </button>
                </div>
              </div>

              {/* Format */}
              <div>
                <div className="mono-label" style={{ marginBottom: 10 }}>Format</div>
                <div style={{ display: 'flex', padding: 3, background: 'rgba(15,23,42,0.04)', borderRadius: 10, gap: 2 }}>
                  {(['1:1', '16:9', '9:16'] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setFormat(r)}
                      style={{
                        flex: 1,
                        padding: '6px 0',
                        fontSize: 12,
                        background: format === r ? '#fff' : 'transparent',
                        borderRadius: 8,
                        color: format === r ? '#0a0a14' : '#71717a',
                        border: 'none',
                        fontWeight: 500,
                        boxShadow: format === r ? '0 1px 3px rgba(0,0,0,0.08), 0 0 0 0.5px rgba(15,23,42,0.06)' : 'none',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        transition: 'all 0.15s',
                      }}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <PathList paths={paths} onChange={setPaths} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="mono-label">Timing</div>
                <TraceSlider label="Stroke draw" displayVal={`${drawDur.toFixed(2)}s`} value={drawDur} min={0.3} max={6} onChange={setDrawDur} />
                <TraceSlider label="Fill bloom" displayVal={`${fillStart.toFixed(2)}s`} value={fillStart} min={0} max={3} onChange={setFillStart} />
                <TraceSlider label="Path stagger" displayVal={`${stagger.toFixed(2)}s`} value={stagger} min={0} max={1} onChange={setStagger} />
                <TraceSlider label="Hold at end" displayVal={`${hold.toFixed(2)}s`} value={hold} min={0} max={3} onChange={setHold} />
              </div>
            </>
          )}

          {tab === 'stroke' && (
            <StrokePanel
              paths={paths}
              onChange={setPaths}
              strokeWidthOverride={strokeWidthOverride}
              onStrokeWidthChange={setStrokeWidthOverride}
            />
          )}

          {tab === 'background' && (
            <BackgroundPanel bgColor={bgColor} onChange={setBgColor} />
          )}
        </aside>

        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div className="workspace-grid" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', background: '#fafafa' }}>
            <div className="badge-glass" style={{ position: 'absolute', top: 14, left: 18 }}>
              <span style={{ width: 7, height: 7, borderRadius: 99, background: '#10b981', boxShadow: '0 0 0 2.5px rgba(16,185,129,0.22)' }} />
              <span style={{ fontSize: 11.5, color: '#3f3f46', fontWeight: 500 }}>Live preview</span>
            </div>
            <div className="badge-glass" style={{ position: 'absolute', top: 14, right: 18, fontFamily: 'var(--font-geist-mono), monospace' }}>
              <span style={{ fontSize: 11.5, color: '#71717a' }}>{previewW} × {previewH}</span>
            </div>

            {!split && (
              <div style={{ width: previewBoxW, height: previewBoxH }}>
                <AnimatedPreview
                  paths={paths}
                  svgMarkup={svgMarkup}
                  elapsed={elapsed}
                  drawDur={drawDur}
                  fillStart={fillStart}
                  stagger={stagger}
                  bgColor={bgColor}
                  strokeWidthOverride={strokeWidthOverride}
                />
              </div>
            )}

            {split && (
              <div style={{ position: 'relative', width: previewBoxW, height: previewBoxH, borderRadius: 18, overflow: 'hidden', background: '#0d0b18' }}>
                <div style={{ position: 'absolute', inset: 0 }}>
                  <AnimatedPreview
                    paths={paths}
                    svgMarkup={svgMarkup}
                    elapsed={elapsed}
                    drawDur={drawDur}
                    fillStart={fillStart}
                    stagger={stagger}
                    bgColor={bgColor}
                    strokeWidthOverride={strokeWidthOverride}
                    showHalo={false}
                  />
                </div>
                <div style={{ position: 'absolute', inset: 0, clipPath: `inset(0 ${100 - splitPos}% 0 0)`, background: bgColor === 'transparent' ? '#0d0b18' : bgColor }}>
                  <AnimatedPreview
                    paths={paths}
                    svgMarkup={svgMarkup}
                    elapsed={totalDur}
                    drawDur={drawDur}
                    fillStart={fillStart}
                    stagger={stagger}
                    bgColor={bgColor}
                    strokeWidthOverride={strokeWidthOverride}
                    frozen
                    desaturate
                    showHalo={false}
                  />
                </div>
                <div style={{ position: 'absolute', top: 12, left: 12, padding: '4px 9px', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', borderRadius: 6, fontSize: 10, fontFamily: 'var(--font-geist-mono), monospace', color: '#fff', textTransform: 'uppercase', letterSpacing: 1 }}>
                  Original
                </div>
                <div style={{ position: 'absolute', top: 12, right: 12, padding: '4px 9px', background: 'rgba(124,58,237,0.6)', backdropFilter: 'blur(8px)', borderRadius: 6, fontSize: 10, fontFamily: 'var(--font-geist-mono), monospace', color: '#fff', textTransform: 'uppercase', letterSpacing: 1 }}>
                  Animated
                </div>
                <div
                  onMouseDown={(e) => {
                    e.preventDefault();
                    const parent = e.currentTarget.parentElement!;
                    const rect = parent.getBoundingClientRect();
                    const onMove = (ev: MouseEvent) => {
                      const pct = ((ev.clientX - rect.left) / rect.width) * 100;
                      setSplitPos(Math.max(5, Math.min(95, pct)));
                    };
                    const onUp = () => {
                      window.removeEventListener('mousemove', onMove);
                      window.removeEventListener('mouseup', onUp);
                    };
                    window.addEventListener('mousemove', onMove);
                    window.addEventListener('mouseup', onUp);
                  }}
                  style={{ position: 'absolute', top: 0, bottom: 0, left: `${splitPos}%`, width: 2, background: '#fff', cursor: 'ew-resize' }}
                >
                  <div style={{ position: 'absolute', top: '50%', left: -16, width: 34, height: 34, borderRadius: 99, background: '#fff', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', fontSize: 12, color: '#0a0a14', fontWeight: 700 }}>
                    ⇆
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => setSplit(!split)}
              title="Split compare (S)"
              style={{
                position: 'absolute',
                bottom: 16,
                right: 18,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 13px',
                background: split ? 'linear-gradient(135deg,#7c3aed,#a855f7)' : 'rgba(255,255,255,0.85)',
                color: split ? '#fff' : '#3f3f46',
                border: `1px solid ${split ? 'transparent' : 'rgba(15,23,42,0.1)'}`,
                borderRadius: 9,
                fontSize: 11.5,
                fontFamily: 'inherit',
                cursor: 'pointer',
                fontWeight: 500,
                backdropFilter: split ? 'none' : 'blur(8px)',
                boxShadow: split ? '0 4px 14px rgba(124,58,237,0.35)' : '0 2px 8px rgba(0,0,0,0.07)',
                transition: 'all 0.18s cubic-bezier(0.16,1,0.3,1)',
              }}
            >
              <SplitIcon /> {split ? 'Single' : 'Split'}
            </button>
          </div>

          {/* Scrub bar */}
          <div style={{ padding: '14px 24px 6px', borderTop: '1px solid rgba(15,23,42,0.07)', background: '#fff' }}>
            <div ref={barRef} onMouseDown={startScrub} style={{ height: 32, position: 'relative', cursor: 'pointer', userSelect: 'none' }}>
              <div style={{ position: 'absolute', left: 0, right: 0, top: 0, display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-geist-mono), monospace', fontSize: 9.5, color: '#a1a1aa' }}>
                <span>0.0s</span>
                <span>{(totalDur * 0.25).toFixed(1)}s</span>
                <span>{(totalDur * 0.5).toFixed(1)}s</span>
                <span>{(totalDur * 0.75).toFixed(1)}s</span>
                <span>{totalDur.toFixed(1)}s</span>
              </div>
              <div style={{ position: 'absolute', left: 0, right: 0, top: 19, height: 6, background: 'rgba(15,23,42,0.07)', borderRadius: 99 }}>
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${scrubPct}%`, background: 'linear-gradient(90deg,#7c3aed,#ec4899)', borderRadius: 99 }} />
              </div>
              <div style={{ position: 'absolute', left: `calc(${scrubPct}% - 9px)`, top: 13, width: 18, height: 20, borderRadius: 5, background: '#fff', border: '2px solid #7c3aed', boxShadow: '0 2px 8px rgba(124,58,237,0.35), 0 0 0 3px rgba(124,58,237,0.1)' }} />
            </div>
          </div>

          <div style={{ padding: '6px 22px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                onClick={() => {
                  if (elapsed >= totalDur) setElapsed(0);
                  setPlaying((p) => !p);
                  setDirection(1);
                }}
                style={{ width: 36, height: 36, background: 'linear-gradient(135deg,#7c3aed,#ec4899)', border: 'none', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer', boxShadow: '0 4px 14px rgba(124,58,237,0.38)', transition: 'box-shadow 0.15s' }}
              >
                {playing ? <PauseIcon /> : <PlayIcon />}
              </button>
              <span style={{ color: '#71717a', fontFamily: 'var(--font-geist-mono), monospace', fontSize: 11.5 }}>
                {cur}s / {dur}s
              </span>
            </div>

            <div style={{ display: 'flex', padding: 3, background: 'rgba(15,23,42,0.04)', borderRadius: 10, gap: 2 }}>
              {[
                { id: 'once', icon: <OnceIcon />, label: 'Once' },
                { id: 'loop', icon: <LoopIcon />, label: 'Loop' },
                { id: 'pingpong', icon: <PingpongIcon />, label: 'Ping-pong' },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setLoop(m.id as LoopMode)}
                  style={{
                    padding: '5px 11px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    background: loop === m.id ? '#fff' : 'transparent',
                    border: 'none',
                    borderRadius: 8,
                    color: loop === m.id ? '#0a0a14' : '#71717a',
                    fontWeight: loop === m.id ? 500 : 400,
                    fontSize: 11,
                    fontFamily: 'inherit',
                    cursor: 'pointer',
                    boxShadow: loop === m.id ? '0 1px 3px rgba(0,0,0,0.08), 0 0 0 0.5px rgba(15,23,42,0.06)' : 'none',
                    transition: 'all 0.15s',
                  }}
                >
                  {m.icon} {m.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                setElapsed(0);
                setDirection(1);
                setPlaying(true);
              }}
              style={{ background: '#fff', border: '1px solid rgba(15,23,42,0.1)', color: '#3f3f46', padding: '7px 14px', borderRadius: 8, fontSize: 11.5, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}
            >
              <ReplayIcon /> Replay
            </button>
          </div>
        </main>
      </div>

      {showKbd && <KeyboardOverlay onClose={() => setShowKbd(false)} />}
      {showExport && (
        <ExportModal
          paths={paths}
          anim={{ drawDur, fillStart, hold, stagger }}
          fileName={fileName}
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  );
}
