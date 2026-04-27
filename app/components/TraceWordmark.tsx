'use client';

import Image from 'next/image';
import { asset } from '../lib/asset';

interface Props {
  /** Pixel height of the rendered logo. Width follows the file's aspect ratio. */
  size?: number;
  /** Which surface this sits on — picks the right pre-built SVG. */
  tone?: 'light' | 'dark';
  /** Render the symbol/mark only (no wordmark text). */
  markOnly?: boolean;
}

// Wordmarks are 360×120 (aspect 3:1). Mark is 120×120 (aspect 1:1).
const WORDMARK_ASPECT = 360 / 120;

export default function TraceWordmark({ size = 22, tone = 'dark', markOnly = false }: Props) {
  if (markOnly) {
    return (
      <Image
        src={asset('/assets/mark-only.svg')}
        alt="Trace"
        width={size}
        height={size}
        priority
        style={{ height: size, width: size, userSelect: 'none' }}
      />
    );
  }

  const src = tone === 'light'
    ? asset('/assets/logo-on-light.svg')
    : asset('/assets/logo-on-dark.svg');
  const width = Math.round(size * WORDMARK_ASPECT);

  return (
    <Image
      src={src}
      alt="Trace"
      width={width}
      height={size}
      priority
      style={{ height: size, width, userSelect: 'none' }}
    />
  );
}
