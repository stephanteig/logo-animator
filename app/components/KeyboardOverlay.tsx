'use client';

import { KeyboardIcon, CloseIcon } from './Icons';

interface Props {
  onClose: () => void;
}

const kbdStyle: React.CSSProperties = {
  fontFamily: 'var(--font-geist-mono), monospace',
  fontSize: 10.5,
  padding: '2px 6px',
  background: '#fafafa',
  border: '1px solid #ededed',
  borderBottom: '2px solid #ededed',
  borderRadius: 4,
  color: '#0a0a14',
  minWidth: 20,
  textAlign: 'center',
  display: 'inline-block',
};

const groups = [
  {
    title: 'Playback',
    items: [
      ['Space', 'Play / pause'],
      ['R', 'Replay from start'],
      ['← / →', 'Step ±0.1s'],
      ['⇧ ← / →', 'Jump to start / end'],
    ],
  },
  {
    title: 'File',
    items: [
      ['⌘ O', 'Open SVG'],
      ['⌘ E', 'Export'],
      ['⌘ ⇧ E', 'Re-export last'],
      ['⌘ ⌫', 'Clear file'],
    ],
  },
  {
    title: 'View',
    items: [
      ['1 / 2 / 3', 'Format 1:1 / 16:9 / 9:16'],
      ['L', 'Toggle loop mode'],
      ['S', 'Toggle split compare'],
      ['?', 'Toggle this overlay'],
    ],
  },
];

export default function KeyboardOverlay({ onClose }: Props) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(10,10,20,0.4)',
        backdropFilter: 'blur(2px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 600,
          background: '#fff',
          borderRadius: 16,
          boxShadow: '0 30px 80px -20px rgba(0,0,0,0.4)',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '18px 22px', borderBottom: '1px solid #f4f4f5', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 500 }}>
              <KeyboardIcon /> Keyboard shortcuts
            </div>
            <div style={{ fontSize: 11.5, color: '#71717a', marginTop: 4 }}>
              Press <span style={kbdStyle}>?</span> any time to toggle
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ width: 28, height: 28, borderRadius: 6, background: '#fafafa', border: '1px solid #ededed', cursor: 'pointer', color: '#71717a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <CloseIcon />
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>
          {groups.map((g, gi) => (
            <div key={g.title} style={{ padding: '16px 18px', borderRight: gi < 2 ? '1px solid #f4f4f5' : 'none' }}>
              <div style={{ fontSize: 10.5, letterSpacing: 1.3, textTransform: 'uppercase', color: '#a1a1aa', fontWeight: 600, marginBottom: 12, fontFamily: 'var(--font-geist-mono), monospace' }}>
                {g.title}
              </div>
              {g.items.map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 11.5, color: '#3f3f46' }}>{v}</span>
                  <span style={kbdStyle}>{k}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
