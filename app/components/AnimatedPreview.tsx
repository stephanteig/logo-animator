'use client';

import { useEffect, useRef } from 'react';
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

  // stroke draw progress [0..1]
  const drawProg = elapsed < pathStart
    ? 0
    : elapsed >= drawEnd
    ? 1
    : (elapsed - pathStart) / drawDur;

  // fill bloom: starts at fillStart after this path's draw starts
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
  elapsed: number;       // current time in seconds
  totalDur: number;
  drawDur: number;
  fillStart: number;
  stagger: number;
  viewBox: string;
  frozen?: boolean;      // show fully drawn static (for split original)
  desaturate?: boolean;  // for split original
}

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
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const lengthCache = useRef<Map<string, number>>(new Map());

  // We render SVG paths inline with computed dash offsets based on elapsed
  const visiblePaths = paths.filter((p) => p.visible);

  // Get total length for each path (via getTotalLength from DOM ref)
  useEffect(() => {
    if (!svgRef.current) return;
    const pathEls = svgRef.current.querySelectorAll<SVGPathElement>('[data-path-id]');
    pathEls.forEach((el) => {
      const id = el.getAttribute('data-path-id')!;
      if (!lengthCache.current.has(id)) {
        try {
          lengthCache.current.set(id, el.getTotalLength());
        } catch {
          lengthCache.current.set(id, 500);
        }
      }
    });
  });

  return (
    <div style={{ position: 'relative' }}>
      {/* Conic halo */}
      <div style={{
        position: 'absolute',
        inset: -50,
        background: 'conic-gradient(from 180deg at 50% 50%, #a78bfa, #ec4899, #f59e0b, #06b6d4, #a78bfa)',
        filter: 'blur(70px)',
        opacity: 0.3,
        borderRadius: '50%',
        pointerEvents: 'none',
      }}/>
      <div style={{
        position: 'relative',
        background: '#0d0b18',
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
          style={{
            width: '60%',
            height: '60%',
            filter: desaturate ? 'saturate(0) brightness(0.7)' : undefined,
          }}
          xmlns="http://www.w3.org/2000/svg"
        >
          {visiblePaths.map((p, i) => {
            const state = frozen
              ? { dashOffset: 0, fillOpacity: 1, strokeOpacity: 0 }
              : computePathState(elapsed, i, visiblePaths.length, drawDur, fillStart, stagger);

            const len = lengthCache.current.get(p.id) ?? 500;
            const dashOffset = len * state.dashOffset;

            return (
              <path
                key={p.id}
                data-path-id={p.id}
                d={p.d}
                fill={state.fillOpacity > 0.01 && p.fill !== 'none' ? p.fill : 'none'}
                fillOpacity={p.fill !== 'none' ? state.fillOpacity : 0}
                stroke={p.stroke !== 'none' ? p.stroke : 'none'}
                strokeWidth={p.strokeWidth || 2}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeOpacity={state.strokeOpacity}
                strokeDasharray={len}
                strokeDashoffset={dashOffset}
              />
            );
          })}
        </svg>
      </div>
    </div>
  );
}
