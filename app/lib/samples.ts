export const SAMPLES = {
  geometric: {
    name: 'Geometric',
    svg: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <path id="triangle" d="M40 160 L100 40 L160 160" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  <path id="crossbar" d="M70 130 L130 130" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round"/>
  <circle id="inner-circle" cx="100" cy="100" r="22" fill="#a78bfa"/>
</svg>`,
  },
  monogram: {
    name: 'Monogram',
    svg: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <circle id="circle-frame" cx="100" cy="100" r="70" fill="none" stroke="#ffffff" stroke-width="3"/>
  <path id="letter-n" d="M70 130 L70 70 L130 130 L130 70" fill="none" stroke="#ec4899" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`,
  },
  icon: {
    name: 'Checkmark',
    svg: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <path id="check" d="M50 100 L85 135 L150 60" fill="none" stroke="#10b981" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`,
  },
  star: {
    name: 'Star burst',
    svg: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <path id="star-outline" d="M100 20 L120 80 L185 80 L132 118 L152 178 L100 140 L48 178 L68 118 L15 80 L80 80 Z" fill="none" stroke="#fbbf24" stroke-width="3" stroke-linejoin="round"/>
  <circle id="center-dot" cx="100" cy="100" r="14" fill="#fbbf24"/>
</svg>`,
  },
} as const;

export type SampleKey = keyof typeof SAMPLES;
