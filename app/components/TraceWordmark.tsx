'use client';

import Image from 'next/image';
import { asset } from '../lib/asset';

interface Props {
  /** Pixel height of the rendered logo. Width follows the PNG aspect ratio. */
  size?: number;
  /**
   * Tone of the surface this lives on. The source PNG has a black wordmark on
   * transparent — fine on light surfaces. On dark we invert+hue-rotate so the
   * wordmark goes white while the violet→pink gradient stays roughly itself.
   */
  tone?: 'light' | 'dark';
}

// trace_logo@4x.png is 924×364 (231.61 × 91.03 viewBox at 4×). Aspect ratio ≈ 2.539.
const ASPECT = 924 / 364;

export default function TraceWordmark({ size = 22, tone = 'dark' }: Props) {
  const width = Math.round(size * ASPECT);
  return (
    <Image
      src={asset('/assets/trace_logo@4x.png')}
      alt="Trace"
      width={width}
      height={size}
      priority
      style={{
        height: size,
        width,
        // Invert + hue-rotate: black wordmark → white, gradient hues mostly preserved.
        filter: tone === 'dark' ? 'invert(1) hue-rotate(180deg)' : undefined,
        userSelect: 'none',
      }}
    />
  );
}
