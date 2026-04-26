'use client';

import { useEffect, useRef, useState, useLayoutEffect } from 'react';
import type { PathItem } from '../lib/types';

interface PathState {
  dashOffset: number;
  fillOpacity: number;
  strokeOpacity: number;
}

function computePathState(
  elapsed: number,
  pathIndex: number,
  totalPaths: number,
  drawDur: number,
  fillStart: number,
  stagger: number
): PathState {
  const pathStart = pathIndex * stagger;
  const drawEnd = pathStart + drawDur;

  const drawProg = elapsed < pathStart
    ? 0
    : elapsed >= drawEnd
    ? 1
    : (elapsed - pathStart) / drawDur;

  const fillBegin = pathStart + fillStart;
  const fillDur = 0.6;
  const fillProg = elapsed < fillBegin
    ? 0
    : elapsed >= fillBegin + fillDur
    ? 1
    : (elapsed - fillBegin) / fillDur;

  const eased = (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

  return {
    dashOffset: 1 - eased(drawProg),
    fillOpacity: eased(fillProg),
    strokeOpacity: Math.max(0, 1 - eased(fillProg)),
  };
}

interface Props {
  paths: PathItem[];
  elapsed: number;
  totalDur: number;
  drawDur: number;
  fillStart: number;
  stagger: number;
  viewBox: string;
  frozen?: boolean;
  desaturate?: boolean;
  bgColor?: string;
  strokeWidthOverride?: number | null;
  showHalo?: boolean;
}

// Use SSR-safe layout effect (useLayoutEffect runs only client-side; no-op SSR fallback).
const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export default function AnimatedPreview({
  paths,
  elapsed,
  totalDur,
  drawDur,
  fillStart,
  stagger,
  viewBox,
  frozen = false,
  desaturate = false,
  bgColor = '#0d0b18',
  strokeWidthOverride = null,
  showHalo = true,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  // Stored in state so a re-render is triggered as soon as lengths are measured.
  const [lengths, setLengths] = useState<Record<string, number>>({});

  const visiblePaths = paths.filter((p) => p.visible);

  // Measure path lengths after layout. Re-measures whenever the path set or
  // viewBox changes — both can change the underlying geometry.
  useIsoLayoutEffect(() => {
    if (!svgRef.current) return;
    const next: Record<string, number> = {};
    let changed = false;
    const pathEls = svgRef.current.querySelectorAll<SVGPathElement>('[data-path-id]');
    pathEls.forEach((el) => {
      const id = el.getAttribute('data-path-id');
      if (!id) return;
      let len = 0;
      try {
        len = el.getTotalLength();
      } catch {
        len = 0;
      }
      // Fall back to a non-zero placeholder so the dasharray maths produce
      // something visible if a malformed path can't be measured.
      if (!Number.isFinite(len) || len <= 0) len = 1000;
      next[id] = len;
      if (lengths[id] !== len) changed = true;
    });
    // Detect removed ids too.
    const oldKeys = Object.keys(lengths);
    if (oldKeys.length !== Object.keys(next).length) changed = true;
    if (changed) setLengths(next);
    // Intentionally only re-runs when path set / geometry changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paths, viewBox]);

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
        <div style={{
          position: 'absolute',
          inset: -50,
          background: 'conic-gradient(from 180deg at 50% 50%, #a78bfa, #ec4899, #f59e0b, #06b6d4, #a78bfa)',
          filter: 'blur(70px)',
          opacity: 0.3,
          borderRadius: '50%',
          pointerEvents: 'none',
        }}/>
      )}
      <div style={{
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
      }}>
        <svg
          ref={svgRef}
          viewBox={viewBox}
          preserveAspectRatio="xMidYMid meet"
          style={{
            width: '70%',
            height: '70%',
            filter: desaturate ? 'saturate(0) brightness(0.7)' : undefined,
          }}
          xmlns="http://www.w3.org/2000/svg"
        >
          {visiblePaths.map((p, i) => {
            const state = frozen
              ? { dashOffset: 0, fillOpacity: 1, strokeOpacity: p.fill !== 'none' ? 0 : 1 }
              : computePathState(elapsed, i, visiblePaths.length, drawDur, fillStart, stagger);

            // While we don't have a measured length yet, render the path WITHOUT
            // dasharray so it's visible by its fill (avoids a flash of empty
            // preview if measurement is slow or fails).
            const len = lengths[p.id];
            const measured = typeof len === 'number' && len > 0;

            const strokeWidth = strokeWidthOverride ?? p.strokeWidth ?? 2;
            const strokeColor = p.stroke !== 'none' ? p.stroke : 'none';
            const fillColor = p.fill !== 'none' ? p.fill : 'none';

            if (!measured) {
              return (
                <path
                  key={p.id}
                  data-path-id={p.id}
                  d={p.d}
                  fill={fillColor}
                  fillOpacity={fillColor === 'none' ? 0 : 1}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeOpacity={strokeColor === 'none' ? 0 : 1}
                />
              );
            }

            return (
              <path
                key={p.id}
                data-path-id={p.id}
                d={p.d}
                fill={state.fillOpacity > 0.01 && fillColor !== 'none' ? fillColor : 'none'}
                fillOpacity={fillColor !== 'none' ? state.fillOpacity : 0}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeOpacity={strokeColor !== 'none' ? state.strokeOpacity : 0}
                strokeDasharray={len}
                strokeDashoffset={len * state.dashOffset}
              />
            );
          })}
        </svg>
      </div>
    </div>
  );
}
