'use client';

import { useState, useEffect, useRef } from 'react';
import { CloseIcon, CopyIcon } from './Icons';
import type { PathItem, Anim } from '../lib/types';

interface Props {
  paths: PathItem[];
  anim: Anim;
  fileName: string;         // e.g. "mylogo.svg"
  originalSvg: string;      // raw SVG text (unmodified)
  bgColor: string;          // '#rrggbb' or 'transparent'
  format: '1:1' | '16:9' | '9:16';
  onClose: () => void;
}

type Tab = 'css' | 'python' | 'lottie' | 'video';
type Quality = 'm' | 'h' | 'k';
type JobStatus = 'idle' | 'queued' | 'running' | 'done' | 'failed';

// ── Helpers ───────────────────────────────────────────────────

function baseName(fileName: string): string {
  return fileName.replace(/\.svg$/i, '') || 'logo';
}

function formatDimensions(format: '1:1' | '16:9' | '9:16'): [number, number] {
  if (format === '16:9') return [1920, 1080];
  if (format === '9:16') return [1080, 1920];
  return [1080, 1080];
}

// ── Code generators ───────────────────────────────────────────

function generateCSS(paths: PathItem[], anim: Anim): string {
  const visible = paths.filter((p) => p.visible);
  const { drawDur, fillStart, stagger, hold } = anim;

  const keyframes = visible.map((p, i) => {
    const delay = i * stagger;
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
    draw-${i} ${drawDur.toFixed(2)}s ease-in-out ${delay.toFixed(2)}s forwards,
    fill-${i} 0.6s ease-in-out ${(delay + fillStart).toFixed(2)}s forwards;
}`;
  }).join('\n\n');

  const totalDur = (drawDur + (visible.length - 1) * stagger + hold).toFixed(2);

  return `/* Trace — Generated CSS Animation
 * Total duration: ${totalDur}s
 */

${keyframes}`;
}

function generatePython(
  paths: PathItem[],
  anim: Anim,
  fileName: string,
  bgColor: string,
  format: '1:1' | '16:9' | '9:16',
): string {
  const { drawDur, fillStart, stagger, hold } = anim;
  const n = paths.filter((p) => p.visible).length;
  const [w, h] = formatDimensions(format);
  const base = baseName(fileName);
  const transparent = bgColor === 'transparent';

  const bgLine = transparent
    ? `# Transparent background — render with: manim -qh --transparent --format mov logo_animation.py LogoAnimation`
    : `config.background_color = "${bgColor}"`;

  return `from manim import *

# Render: manim -pqh logo_animation.py LogoAnimation
${transparent ? '# For transparent bg: manim -qh --transparent --format mov logo_animation.py LogoAnimation' : ''}

config.pixel_width  = ${w}
config.pixel_height = ${h}
config.frame_rate   = 60

SVG_FILE     = "${base}.svg"
LOGO_WIDTH   = 6.0      # Manim scene units
STROKE_COLOR = "#FFFFFF"
STROKE_WIDTH = 1.5

DRAW_TIME    = ${drawDur.toFixed(2)}      # seconds — stroke draw phase
LAG_RATIO    = ${n > 1 ? (stagger / drawDur).toFixed(2) : '0.00'}      # stagger between paths
FILL_TIME    = 0.60      # seconds — fill reveal phase
WAIT_BETWEEN = ${fillStart.toFixed(2)}      # pause between phases
WAIT_END     = ${hold.toFixed(2)}      # hold at end

${bgLine}


class LogoAnimation(Scene):
    def construct(self):
        svg = SVGMobject(SVG_FILE).scale_to_fit_width(LOGO_WIDTH)

        parts     = svg.family_members_with_points()
        originals = [(m.get_fill_color(), m.get_fill_opacity()) for m in parts]

        for mob in parts:
            mob.set_fill(opacity=0)
            mob.set_stroke(color=STROKE_COLOR, width=STROKE_WIDTH, opacity=1)

        # Phase 1 — draw outlines
        self.play(
            AnimationGroup(*[Create(m) for m in parts], lag_ratio=LAG_RATIO),
            run_time=DRAW_TIME,
        )
        self.wait(WAIT_BETWEEN)

        # Phase 2 — reveal colours
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
    v: '5.7.4', fr: fps, ip: 0, op: totalFrames, w: 200, h: 200,
    nm: 'Trace Animation', ddd: 0, assets: [],
    layers: visible.map((p, i) => {
      const startFrame = Math.round(i * stagger * fps);
      const endFrame   = Math.round((i * stagger + drawDur) * fps);
      return {
        ddd: 0, ind: i + 1, ty: 4, nm: p.name, ip: 0, op: totalFrames, st: 0,
        shapes: [
          { ty: 'sh', nm: 'Path', d: 1, ks: { a: 0, k: { i: [], o: [], v: [], c: false } } },
          { ty: 'st', nm: 'Stroke', c: { a: 0, k: hexToLottieColor(p.stroke) }, o: { a: 0, k: 100 }, w: { a: 0, k: p.strokeWidth }, lc: 2, lj: 2, ml: 4 },
          { ty: 'tm', nm: 'Trim', s: { a: 0, k: 0 }, e: { a: 1, k: [
            { t: startFrame, s: [0], e: [100], i: { x: [0.42], y: [1] }, o: { x: [0.58], y: [0] } },
            { t: endFrame,   s: [100] },
          ]}, o: { a: 0, k: 0 }, m: 1 },
        ],
        ks: { o: { a: 0, k: 100 }, r: { a: 0, k: 0 }, p: { a: 0, k: [0,0,0] }, a: { a: 0, k: [0,0,0] }, s: { a: 0, k: [100,100,100] } },
      };
    }),
  };
  return JSON.stringify(lottie, null, 2);
}

function hexToLottieColor(hex: string): number[] {
  const c = hex.replace('#', '');
  return [parseInt(c.slice(0,2),16)/255, parseInt(c.slice(2,4),16)/255, parseInt(c.slice(4,6),16)/255, 1];
}

// ── Syntax highlighting ───────────────────────────────────────

const KW  = new Set(['from','import','class','def','for','in','if','else','return','self','True','False','None','zip','not','and','or','lambda','while','with','as']);
const CLS = new Set(['Scene','SVGMobject','AnimationGroup','Create','config']);
const FN  = new Set(['construct','set_fill','set_stroke','scale_to_fit_width','family_members_with_points','get_fill_color','get_fill_opacity','play','wait','animate','zip','range']);
function esc(s: string) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function tokenizePython(src: string): string {
  let out = '', i = 0;
  while (i < src.length) {
    const ch = src[i];
    if (ch === '#') { let j=i; while(j<src.length&&src[j]!=='\n')j++; out+=`<span class="t-cm">${esc(src.slice(i,j))}</span>`; i=j; continue; }
    if (ch==='"'||ch==="'") { let j=i+1; while(j<src.length){if(src[j]==='\\'){j+=2;continue;}if(src[j]===ch){j++;break;}j++;} out+=`<span class="t-str">${esc(src.slice(i,j))}</span>`; i=j; continue; }
    if (/\d/.test(ch)) { let j=i; while(j<src.length&&/[\d.]/.test(src[j]))j++; out+=`<span class="t-num">${esc(src.slice(i,j))}</span>`; i=j; continue; }
    if (/[a-zA-Z_]/.test(ch)) { let j=i; while(j<src.length&&/\w/.test(src[j]))j++; const w=src.slice(i,j); if(KW.has(w))out+=`<span class="t-kw">${esc(w)}</span>`; else if(CLS.has(w))out+=`<span class="t-cls">${esc(w)}</span>`; else if(FN.has(w))out+=`<span class="t-fn">${esc(w)}</span>`; else out+=esc(w); i=j; continue; }
    out+=esc(ch); i++;
  }
  return out;
}

function tokenizeCSS(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, m=>`<span class="t-cm">${esc(m)}</span>`)
    .replace(/([\w-]+)\s*:/g, (_,p)=>`<span class="t-fn">${esc(p)}</span>:`)
    .replace(/@[\w-]+/g, m=>`<span class="t-kw">${esc(m)}</span>`)
    .replace(/'[^']*'|"[^"]*"/g, m=>`<span class="t-str">${esc(m)}</span>`);
}

// ── Video tab ─────────────────────────────────────────────────

const QUALITY_OPTS: { label: string; value: Quality; res: string }[] = [
  { label: '720p',  value: 'm', res: '1280×720' },
  { label: '1080p', value: 'h', res: '1920×1080' },
  { label: '4K',    value: 'k', res: '3840×2160' },
];

function VideoTab({
  paths, anim, fileName, originalSvg, bgColor, format,
}: {
  paths: PathItem[];
  anim: Anim;
  fileName: string;
  originalSvg: string;
  bgColor: string;
  format: '1:1' | '16:9' | '9:16';
}) {
  const [backendUrl, setBackendUrl] = useState('http://localhost:8000');
  const [quality, setQuality] = useState<Quality>('h');
  const [fps, setFps] = useState<25 | 60>(60);
  const [backendOk, setBackendOk] = useState<boolean | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatus>('idle');
  const [jobProgress, setJobProgress] = useState(0);
  const [jobError, setJobError] = useState('');
  const [jobId, setJobId] = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const transparent = bgColor === 'transparent';
  const base = baseName(fileName);
  const pyScript = generatePython(paths, anim, fileName, bgColor, format);

  // ── Backend health check
  const checkBackend = async () => {
    setBackendOk(null);
    try {
      const r = await fetch(`${backendUrl}/health`, { signal: AbortSignal.timeout(3000) });
      setBackendOk(r.ok);
    } catch {
      setBackendOk(false);
    }
  };

  useEffect(() => { checkBackend(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Polling
  const startPolling = (id: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const r = await fetch(`${backendUrl}/jobs/${id}`);
        if (!r.ok) return;
        const data = await r.json();
        setJobProgress(data.progress ?? 0);
        if (data.status === 'done') {
          setJobStatus('done');
          stopPolling();
        } else if (data.status === 'failed') {
          setJobStatus('failed');
          setJobError(data.error ?? 'Unknown error');
          stopPolling();
        } else {
          setJobStatus(data.status === 'queued' ? 'queued' : 'running');
        }
      } catch {
        // network blip — keep polling
      }
    }, 2000);
  };

  const stopPolling = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  };

  useEffect(() => () => stopPolling(), []);

  // ── Download zip (py + svg)
  const handleDownloadZip = async () => {
    try {
      const r = await fetch(`${backendUrl}/zip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ svg_content: originalSvg, python_script: pyScript, file_name: base }),
      });
      if (!r.ok) throw new Error(await r.text());
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${base}_animation.zip`; a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(`ZIP failed: ${err instanceof Error ? err.message : err}`);
    }
  };

  // ── Render
  const handleRender = async () => {
    setJobStatus('queued');
    setJobProgress(0);
    setJobError('');
    setJobId('');
    stopPolling();
    try {
      const r = await fetch(`${backendUrl}/render`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          svg_content: originalSvg,
          python_script: pyScript,
          file_name: base,
          quality,
          fps,
          transparent,
        }),
      });
      if (!r.ok) throw new Error(await r.text());
      const { job_id } = await r.json();
      setJobId(job_id);
      startPolling(job_id);
    } catch (err) {
      setJobStatus('failed');
      setJobError(err instanceof Error ? err.message : String(err));
    }
  };

  // ── Download rendered video
  const handleDownloadVideo = () => {
    if (!jobId) return;
    const ext = transparent ? 'mov' : 'mp4';
    const a = document.createElement('a');
    a.href = `${backendUrl}/jobs/${jobId}/download`;
    a.download = `logo_animation.${ext}`;
    a.click();
  };

  // Shared styles
  const S = {
    label: { fontSize: 11, color: 'rgba(240,238,255,0.35)', fontFamily: 'var(--font-geist-mono), monospace', textTransform: 'uppercase' as const, letterSpacing: 0.8, marginBottom: 6 },
    row: { display: 'flex', gap: 8 },
    card: { padding: '14px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, display: 'flex', flexDirection: 'column' as const, gap: 10 },
    segBtn: (on: boolean) => ({
      flex: 1, padding: '7px 0', borderRadius: 8, fontSize: 12,
      fontWeight: on ? 600 : 400,
      background: on ? '#7c3aed' : 'rgba(255,255,255,0.06)',
      color: on ? '#fff' : 'rgba(240,238,255,0.45)',
      border: `1px solid ${on ? 'transparent' : 'rgba(255,255,255,0.08)'}`,
      cursor: 'pointer', transition: 'all 0.15s',
      boxShadow: on ? '0 0 12px rgba(124,58,237,0.35)' : 'none',
    }),
    input: {
      flex: 1, padding: '8px 12px',
      background: 'rgba(255,255,255,0.06)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 8, fontSize: 12,
      color: '#f0eeff', fontFamily: 'var(--font-geist-mono), monospace',
      outline: 'none',
    },
  };

  const isRendering = jobStatus === 'queued' || jobStatus === 'running';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '20px 24px', overflowY: 'auto', flex: 1 }}>

      {/* Backend URL */}
      <div style={S.card}>
        <div style={S.label}>Backend URL</div>
        <div style={S.row}>
          <input
            value={backendUrl}
            onChange={(e) => { setBackendUrl(e.target.value); setBackendOk(null); }}
            style={S.input}
            placeholder="http://localhost:8000"
            spellCheck={false}
          />
          <button
            onClick={checkBackend}
            style={{ padding: '8px 14px', borderRadius: 8, fontSize: 12, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(240,238,255,0.6)', cursor: 'pointer', whiteSpace: 'nowrap' as const }}
          >
            Test
          </button>
        </div>
        {backendOk === true && (
          <div style={{ fontSize: 11.5, color: '#10b981', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: 99, background: '#10b981', flexShrink: 0 }} />
            Backend connected
          </div>
        )}
        {backendOk === false && (
          <div style={{ fontSize: 11.5, color: '#f87171' }}>
            Cannot reach backend — make sure Docker is running:
            <code style={{ display: 'block', marginTop: 4, padding: '4px 8px', background: 'rgba(0,0,0,0.3)', borderRadius: 5, fontSize: 10.5, color: 'rgba(240,238,255,0.55)' }}>
              cd backend && docker compose up --build
            </code>
          </div>
        )}
      </div>

      {/* Quality */}
      <div>
        <div style={S.label}>Quality</div>
        <div style={S.row}>
          {QUALITY_OPTS.map((q) => (
            <button key={q.value} onClick={() => setQuality(q.value)} style={S.segBtn(quality === q.value)}>
              {q.label}
              <div style={{ fontSize: 9.5, opacity: 0.6, marginTop: 2 }}>{q.res}</div>
            </button>
          ))}
        </div>
      </div>

      {/* FPS + background info */}
      <div style={S.row}>
        <div style={{ flex: 1 }}>
          <div style={S.label}>Frame rate</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {([25, 60] as const).map((f) => (
              <button key={f} onClick={() => setFps(f)} style={{ ...S.segBtn(fps === f), flex: 1 }}>
                {f} fps
              </button>
            ))}
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={S.label}>Background</div>
          <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 12, color: 'rgba(240,238,255,0.55)', display: 'flex', alignItems: 'center', gap: 8 }}>
            {transparent ? (
              <>
                <span style={{ fontSize: 14 }}>◻</span> Transparent (.mov)
              </>
            ) : (
              <>
                <span style={{ width: 14, height: 14, borderRadius: 3, background: bgColor, border: '1px solid rgba(255,255,255,0.15)', flexShrink: 0 }} />
                {bgColor}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={handleDownloadZip}
          disabled={isRendering}
          style={{
            flex: 1, padding: '10px 0',
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 10, fontSize: 12.5, color: 'rgba(240,238,255,0.7)',
            cursor: 'pointer', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
          }}
        >
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M2 13h12M8 2v8m0 0-3-3m3 3 3-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Download .zip
          <span style={{ fontSize: 9.5, opacity: 0.45, marginLeft: 2 }}>py + svg</span>
        </button>

        {jobStatus === 'done' ? (
          <button
            onClick={handleDownloadVideo}
            style={{
              flex: 1, padding: '10px 0',
              background: '#10b981', border: 'none',
              borderRadius: 10, fontSize: 12.5, fontWeight: 600, color: '#fff',
              cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              boxShadow: '0 0 20px rgba(16,185,129,0.4)',
            }}
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M2 13h12M8 2v8m0 0-3-3m3 3 3-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Download video
            <span style={{ fontSize: 9.5, opacity: 0.75 }}>{transparent ? '.mov' : '.mp4'}</span>
          </button>
        ) : (
          <button
            onClick={handleRender}
            disabled={isRendering}
            style={{
              flex: 1, padding: '10px 0',
              background: isRendering ? 'rgba(124,58,237,0.4)' : '#7c3aed',
              border: 'none',
              borderRadius: 10, fontSize: 12.5, fontWeight: 600, color: '#fff',
              cursor: isRendering ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              boxShadow: isRendering ? 'none' : '0 0 20px rgba(124,58,237,0.45)',
              transition: 'all 0.15s',
            }}
          >
            {isRendering ? (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
                  <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.25)" strokeWidth="2.5"/>
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
                Rendering…
              </>
            ) : (
              <>
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M5 3l9 5-9 5V3z" fill="currentColor"/></svg>
                Render &amp; Download
              </>
            )}
          </button>
        )}
      </div>

      {/* Progress */}
      {(isRendering || jobStatus === 'done' || jobStatus === 'failed') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'rgba(240,238,255,0.35)', fontFamily: 'var(--font-geist-mono), monospace' }}>
            <span>
              {jobStatus === 'queued' && 'Queued…'}
              {jobStatus === 'running' && 'Rendering with Manim…'}
              {jobStatus === 'done' && 'Done — ready to download'}
              {jobStatus === 'failed' && 'Render failed'}
            </span>
            <span>{jobProgress}%</span>
          </div>
          <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${jobProgress}%`,
                background: jobStatus === 'failed' ? '#ef4444' : jobStatus === 'done' ? '#10b981' : 'linear-gradient(90deg,#7c3aed,#a855f7)',
                borderRadius: 99,
                transition: 'width 0.4s ease, background 0.3s',
              }}
            />
          </div>
          {jobStatus === 'failed' && jobError && (
            <pre style={{ margin: 0, fontSize: 10, color: '#f87171', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '8px 10px', overflowX: 'auto', maxHeight: 120, fontFamily: 'var(--font-geist-mono), monospace', lineHeight: 1.5 }}>
              {jobError}
            </pre>
          )}
          {jobStatus === 'done' && (
            <button
              onClick={handleRender}
              style={{ alignSelf: 'flex-start', fontSize: 11.5, color: 'rgba(240,238,255,0.35)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline', textDecorationStyle: 'dotted', fontFamily: 'inherit' }}
            >
              Re-render
            </button>
          )}
        </div>
      )}

      {/* Setup instructions */}
      <div style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10 }}>
        <div style={{ fontSize: 11, color: 'rgba(240,238,255,0.3)', fontFamily: 'var(--font-geist-mono), monospace', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 }}>Quick start</div>
        <pre style={{ margin: 0, fontSize: 10.5, color: 'rgba(240,238,255,0.4)', fontFamily: 'var(--font-geist-mono), monospace', lineHeight: 1.6, whiteSpace: 'pre-wrap' as const }}>
          {`# In WSL / Docker Desktop:
cd logo-animator/backend
docker compose up --build`}
        </pre>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────

export default function ExportModal({ paths, anim, fileName, originalSvg, bgColor, format, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('video');
  const [copied, setCopied] = useState(false);

  const visible = paths.filter((p) => p.visible);

  const codeForTab = (): string => {
    if (tab === 'css')    return generateCSS(paths, anim);
    if (tab === 'python') return generatePython(paths, anim, fileName, bgColor, format);
    if (tab === 'lottie') return generateLottie(paths, anim);
    return '';
  };

  const highlightCode = (code: string): string => {
    if (tab === 'python') return tokenizePython(code);
    if (tab === 'css')    return tokenizeCSS(code);
    return esc(code);
  };

  const code = tab !== 'video' ? codeForTab() : '';
  const highlighted = tab !== 'video' ? highlightCode(code) : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  const handleDownloadPy = () => {
    const py = generatePython(paths, anim, fileName, bgColor, format);
    const blob = new Blob([py], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'logo_animation.py'; a.click();
    URL.revokeObjectURL(url);
  };

  const TABS: { id: Tab; label: string }[] = [
    { id: 'video',  label: 'Video' },
    { id: 'css',    label: 'CSS @keyframes' },
    { id: 'python', label: 'Python (Manim)' },
    { id: 'lottie', label: 'Lottie JSON' },
  ];

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
    >
      <div
        className="modal-in"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 680, maxHeight: '92vh',
          background: 'rgba(14,10,24,0.97)',
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 20,
          boxShadow: '0 40px 100px rgba(0,0,0,0.78), 0 0 80px rgba(124,58,237,0.08)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#f0eeff' }}>Export</div>
            <div style={{ fontSize: 11.5, color: 'rgba(240,238,255,0.4)', marginTop: 2 }}>{visible.length} paths · {fileName}</div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', color: 'rgba(240,238,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CloseIcon />
          </button>
        </div>

        {/* Tabs */}
        <div style={{ padding: '10px 24px 0', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: '6px 14px', borderRadius: 8, fontSize: 12.5,
                fontWeight: tab === t.id ? 500 : 400,
                background: tab === t.id ? '#7c3aed' : 'transparent',
                color: tab === t.id ? '#fff' : 'rgba(240,238,255,0.45)',
                border: 'none', cursor: 'pointer', marginBottom: 10,
                boxShadow: tab === t.id ? '0 0 12px rgba(124,58,237,0.4)' : 'none',
                transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', gap: t.id === 'video' ? 5 : 0,
              }}
            >
              {t.id === 'video' && (
                <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M2 4h8a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zm9 2.5 4-2v7l-4-2V6.5z" fill="currentColor"/></svg>
              )}
              {t.label}
            </button>
          ))}
        </div>

        {/* Video tab */}
        {tab === 'video' && (
          <VideoTab
            paths={paths} anim={anim} fileName={fileName}
            originalSvg={originalSvg} bgColor={bgColor} format={format}
          />
        )}

        {/* Code tabs */}
        {tab !== 'video' && (
          <>
            <div style={{ flex: 1, overflowY: 'auto', background: 'rgba(5,3,10,0.92)' }}>
              <pre
                style={{ fontFamily: 'var(--font-geist-mono), monospace', fontSize: 11.5, lineHeight: 1.65, margin: 0, padding: '20px 24px', color: 'rgba(240,238,255,0.55)' }}
                dangerouslySetInnerHTML={{ __html: highlighted }}
              />
            </div>

            <div style={{ padding: '14px 24px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, flexShrink: 0 }}>
              {tab === 'python' && (
                <button
                  onClick={handleDownloadPy}
                  style={{ padding: '8px 18px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 9, fontSize: 12.5, color: 'rgba(240,238,255,0.45)', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M2 13h12M8 2v8m0 0-3-3m3 3 3-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  Download .py
                </button>
              )}
              <button onClick={onClose} style={{ padding: '8px 18px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 9, fontSize: 12.5, color: 'rgba(240,238,255,0.45)', cursor: 'pointer', fontFamily: 'inherit' }}>
                Close
              </button>
              <button
                onClick={handleCopy}
                style={{
                  padding: '8px 18px',
                  background: copied ? '#10b981' : '#7c3aed',
                  border: 'none', borderRadius: 9, fontSize: 12.5, fontWeight: 500, color: '#fff',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                  boxShadow: copied ? '0 0 16px rgba(16,185,129,0.4)' : '0 0 20px rgba(124,58,237,0.45)',
                  transition: 'all 0.2s', fontFamily: 'inherit',
                }}
              >
                <CopyIcon />
                {copied ? '✓ Copied!' : 'Copy code'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
