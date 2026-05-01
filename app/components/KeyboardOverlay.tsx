'use client';

import { KeyboardIcon, CloseIcon } from './Icons';

interface Props {
  onClose: () => void;
}

const kbdStyle: React.CSSProperties = {
  fontFamily: 'var(--font-geist-mono), monospace',
  fontSize: 10.5,
  padding: '2px 7px',
  background: '#f4f4f5',
  border: '1px solid rgba(15,23,42,0.12)',
  borderBottom: '2px solid rgba(15,23,42,0.18)',
  borderRadius: 5,
  color: '#0a0a14',
  minWidth: 22,
  textAlign: 'center' as const,
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
        background: 'rgba(10,10,20,0.5)',
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
          width: 620,
          background: '#fff',
          borderRadius: 20,
          boxShadow: '0 50px 120px -20px rgba(0,0,0,0.3), 0 0 0 1px rgba(15,23,42,0.06)',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(15,23,42,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, color: '#0a0a14' }}>
              <KeyboardIcon /> Keyboard shortcuts
            </div>
            <div style={{ fontSize: 11.5, color: '#71717a', marginTop: 4 }}>
              Press <span style={kbdStyle}>?</span> any time to toggle
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ width: 30, height: 30, borderRadius: 8, background: '#f4f4f5', border: '1px solid rgba(15,23,42,0.08)', cursor: 'pointer', color: '#71717a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <CloseIcon />
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>
          {groups.map((g, gi) => (
            <div key={g.title} style={{ padding: '18px 20px', borderRight: gi < 2 ? '1px solid rgba(15,23,42,0.06)' : 'none' }}>
              <div style={{ fontSize: 10.5, letterSpacing: 1.3, textTransform: 'uppercase', color: '#a1a1aa', fontWeight: 600, marginBottom: 14, fontFamily: 'var(--font-geist-mono), monospace' }}>
                {g.title}
              </div>
              {g.items.map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: 12, color: '#3f3f46' }}>{v}</span>
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
