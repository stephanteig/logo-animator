'use client';

interface Props {
  label: string;
  displayVal: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
}

export default function TraceSlider({ label, displayVal, value, min, max, step = 0.01, onChange }: Props) {
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: 11.5, marginBottom: 7 }}>
        <span style={{ color: 'rgba(240,238,255,0.45)' }}>{label}</span>
        <span style={{ fontFamily: 'var(--font-geist-mono), monospace', color: 'rgba(240,238,255,0.7)', fontSize: 10.5, fontWeight: 500 }}>
          {displayVal}
        </span>
      </div>
      <div style={{ position: 'relative', height: 14 }}>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 5, height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct}%`, background: 'linear-gradient(90deg,#7c3aed,#a855f7)', borderRadius: 99 }} />
        </div>
        <div
          style={{
            position: 'absolute',
            left: `calc(${pct}% - 6px)`,
            top: 1,
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: '#fff',
            boxShadow: '0 0 0 2px #7c3aed, 0 4px 12px rgba(124,58,237,0.5)',
            pointerEvents: 'none',
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer', margin: 0 }}
        />
      </div>
    </div>
  );
}
