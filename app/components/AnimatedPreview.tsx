'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';
import type { PathItem } from '../lib/types';

function eased(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

function computePathState(
  elapsed: number,
  pathIndex: number,
  drawDur: number,
  fillStart: number,
  stagger: number,
) {
  const pathStart = pathIndex * stagger;
  const drawEnd = pathStart + drawDur;
  const drawProg =
    elapsed < pathStart ? 0 : elapsed >= drawEnd ? 1 : (elapsed - pathStart) / drawDur;

  const fillBegin = pathStart + fillStart;
  const fillBloomDur = 0.6;
  const fillProg =
    elapsed < fillBegin
      ? 0
      : elapsed >= fillBegin + fillBloomDur
      ? 1
      : (elapsed - fillBegin) / fillBloomDur;

  return {
    dashOffset: 1 - eased(drawProg),
    fillOpacity: eased(fillProg),
    strokeOpacity: Math.max(0, 1 - eased(fillProg)),
  };
}

interface Props {
  paths: PathItem[];
  svgMarkup: string;
  elapsed: number;
  drawDur: number;
  fillStart: number;
  stagger: number;
  frozen?: boolean;
  desaturate?: boolean;
  bgColor?: string;
  strokeWidthOverride?: number | null;
  showHalo?: boolean;
}

const useIsoLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export default function AnimatedPreview({
  paths,
  svgMarkup,
  elapsed,
  drawDur,
  fillStart,
  stagger,
  frozen = false,
  desaturate = false,
  bgColor = '#0d0b18',
  strokeWidthOverride = null,
  showHalo = true,
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const lengthsRef = useRef<Map<string, number>>(new Map());

  // Inject the SVG markup whenever it changes. Re-measure path lengths on
  // each fresh injection.
  useIsoLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    host.innerHTML = svgMarkup;
    const svg = host.querySelector('svg');
    if (svg) {
      svg.setAttribute('width', '100%');
      svg.setAttribute('height', '100%');
      svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      (svg as SVGElement).style.display = 'block';
    }
    // Measure
    const newLengths = new Map<string, number>();
    host.querySelectorAll<SVGGeometryElement>('[data-trace-id]').forEach((el) => {
      const id = el.getAttribute('data-trace-id');
      if (!id) return;
      let len = 0;
      try {
        len = typeof el.getTotalLength === 'function' ? el.getTotalLength() : 0;
      } catch {
        len = 0;
      }
      if (!Number.isFinite(len) || len <= 0) {
        // Fallback for shapes where getTotalLength fails
        try {
          const bb = el.getBBox();
          len = (bb.width + bb.height) * 2 || 1000;
        } catch {
          len = 1000;
        }
      }
      newLengths.set(id, len);
    });
    lengthsRef.current = newLengths;
  }, [svgMarkup]);

  // Apply animation state on every render. This runs after layout so the
  // freshly-injected SVG is already measured.
  useIsoLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const visiblePaths = paths.filter((p) => p.visible);
    const visibleIndex = new Map<string, number>();
    visiblePaths.forEach((p, i) => visibleIndex.set(p.id, i));

    paths.forEach((p) => {
      const el = host.querySelector<SVGElement>(
        `[data-trace-id="${CSS.escape(p.id)}"]`,
      );
      if (!el) return;

      // Visibility
      if (!p.visible) {
        el.style.display = 'none';
        return;
      }
      el.style.display = '';

      const visIdx = visibleIndex.get(p.id) ?? 0;
      const state = frozen
        ? {
            dashOffset: 0,
            fillOpacity: p.fill !== 'none' ? 1 : 0,
            strokeOpacity: p.fill === 'none' ? 1 : 0,
          }
        : computePathState(elapsed, visIdx, drawDur, fillStart, stagger);

      const len = lengthsRef.current.get(p.id) ?? 1000;
      const strokeW = strokeWidthOverride ?? p.strokeWidth ?? 1.5;

      // Override colors per current path metadata
      el.style.stroke = p.stroke !== 'none' ? p.stroke : 'none';
      el.style.fill = p.fill !== 'none' ? p.fill : 'none';
      el.style.strokeWidth = String(strokeW);
      el.style.strokeLinecap = 'round';
      el.style.strokeLinejoin = 'round';
      el.style.strokeOpacity =
        p.stroke !== 'none' ? String(state.strokeOpacity) : '0';
      el.style.fillOpacity = p.fill !== 'none' ? String(state.fillOpacity) : '0';
      el.style.strokeDasharray = String(len);
      el.style.strokeDashoffset = String(len * state.dashOffset);
    });
  });

  const isTransparent = bgColor === 'transparent';
  const checkerBg = isTransparent
    ? {
        backgroundColor: '#1c1c1c',
        backgroundImage:
          'linear-gradient(45deg, #2a2a2a 25%, transparent 25%), linear-gradient(-45deg, #2a2a2a 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #2a2a2a 75%), linear-gradient(-45deg, transparent 75%, #2a2a2a 75%)',
        backgroundSize: '16px 16px',
        backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0',
      }
    : { background: bgColor };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {showHalo && (
        <div
          style={{
            position: 'absolute',
            inset: -50,
            background:
              'conic-gradient(from 180deg at 50% 50%, #a78bfa, #ec4899, #f59e0b, #06b6d4, #a78bfa)',
            filter: 'blur(70px)',
            opacity: 0.3,
            borderRadius: '50%',
            pointerEvents: 'none',
          }}
        />
      )}
      <div
        style={{
          position: 'relative',
          ...checkerBg,
          borderRadius: 18,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)',
          overflow: 'hidden',
          width: '100%',
          height: '100%',
        }}
      >
        <div
          ref={hostRef}
          style={{
            width: '70%',
            height: '70%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            filter: desaturate ? 'saturate(0) brightness(0.7)' : undefined,
          }}
        />
      </div>
    </div>
  );
}
