'use client';

export default function TraceWordmark({ size = 18, color = '#fff' }: { size?: number; color?: string }) {
  const gradId = `tw-grad-${size}`;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        fontFamily: 'var(--font-geist-sans), system-ui',
        fontSize: size,
        fontWeight: 600,
        color,
        letterSpacing: -0.6,
        lineHeight: 1,
      }}
    >
      <span>tr</span>
      <svg
        width={size * 0.78}
        height={size * 0.78}
        viewBox="0 0 48 48"
        style={{ margin: '0 -1px' }}
      >
        <defs>
          <linearGradient id={gradId} x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
        </defs>
        <path
          d="M8 36 Q24 6, 40 36"
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth="5"
          strokeLinecap="round"
        />
        <circle cx="40" cy="36" r="4.5" fill="#ec4899" />
      </svg>
      <span>ce</span>
    </div>
  );
}
