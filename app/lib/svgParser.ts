import type { PathItem } from './types';

function getAttr(el: Element, ...attrs: string[]): string {
  for (const a of attrs) {
    const v = el.getAttribute(a);
    if (v) return v;
  }
  return '';
}

function toPathD(el: Element): string {
  const tag = el.tagName.toLowerCase();
  if (tag === 'path') return el.getAttribute('d') || '';
  if (tag === 'line') {
    const x1 = el.getAttribute('x1') || '0';
    const y1 = el.getAttribute('y1') || '0';
    const x2 = el.getAttribute('x2') || '0';
    const y2 = el.getAttribute('y2') || '0';
    return `M${x1} ${y1} L${x2} ${y2}`;
  }
  if (tag === 'polyline' || tag === 'polygon') {
    const pts = (el.getAttribute('points') || '').trim().split(/[\s,]+/);
    const pairs: string[] = [];
    for (let i = 0; i < pts.length - 1; i += 2) {
      pairs.push(`${i === 0 ? 'M' : 'L'}${pts[i]} ${pts[i + 1]}`);
    }
    if (tag === 'polygon') pairs.push('Z');
    return pairs.join(' ');
  }
  if (tag === 'rect') {
    const x = parseFloat(el.getAttribute('x') || '0');
    const y = parseFloat(el.getAttribute('y') || '0');
    const w = parseFloat(el.getAttribute('width') || '0');
    const h = parseFloat(el.getAttribute('height') || '0');
    const rx = parseFloat(el.getAttribute('rx') || '0');
    const ry = parseFloat(el.getAttribute('ry') || el.getAttribute('rx') || '0');
    if (rx === 0 && ry === 0) {
      return `M${x} ${y} H${x + w} V${y + h} H${x} Z`;
    }
    return `M${x + rx} ${y} H${x + w - rx} Q${x + w} ${y} ${x + w} ${y + ry} V${y + h - ry} Q${x + w} ${y + h} ${x + w - rx} ${y + h} H${x + rx} Q${x} ${y + h} ${x} ${y + h - ry} V${y + ry} Q${x} ${y} ${x + rx} ${y} Z`;
  }
  if (tag === 'circle') {
    const cx = parseFloat(el.getAttribute('cx') || '0');
    const cy = parseFloat(el.getAttribute('cy') || '0');
    const r = parseFloat(el.getAttribute('r') || '0');
    return `M${cx - r} ${cy} A${r} ${r} 0 1 0 ${cx + r} ${cy} A${r} ${r} 0 1 0 ${cx - r} ${cy} Z`;
  }
  if (tag === 'ellipse') {
    const cx = parseFloat(el.getAttribute('cx') || '0');
    const cy = parseFloat(el.getAttribute('cy') || '0');
    const rx = parseFloat(el.getAttribute('rx') || '0');
    const ry = parseFloat(el.getAttribute('ry') || '0');
    return `M${cx - rx} ${cy} A${rx} ${ry} 0 1 0 ${cx + rx} ${cy} A${rx} ${ry} 0 1 0 ${cx - rx} ${cy} Z`;
  }
  return '';
}

function getName(el: Element, index: number): string {
  const id = el.getAttribute('id');
  if (id) return id.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const title = el.querySelector('title')?.textContent;
  if (title) return title;
  return `Path ${index + 1}`;
}

function getColor(el: Element, attr: 'stroke' | 'fill'): string {
  const styleAttr = (el as HTMLElement).style?.[attr] as string | undefined;
  const v = el.getAttribute(attr) || styleAttr || '';
  if (!v || v === 'none' || v === 'transparent') return attr === 'fill' ? 'none' : '#ffffff';
  return v;
}

function getStrokeWidth(el: Element): number {
  const styleAttr = (el as HTMLElement).style?.strokeWidth as string | undefined;
  const v = el.getAttribute('stroke-width') || styleAttr || '1';
  return parseFloat(v) || 1;
}

export function parseSVG(svgText: string): { paths: PathItem[]; viewBox: string } {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgText, 'image/svg+xml');
  const svgEl = doc.querySelector('svg');
  if (!svgEl) return { paths: [], viewBox: '0 0 200 200' };

  const viewBox = svgEl.getAttribute('viewBox') || '0 0 200 200';

  const elements = Array.from(
    svgEl.querySelectorAll('path, line, polyline, polygon, rect, circle, ellipse')
  ).filter(el => {
    // skip <defs>, <symbol> children
    let parent = el.parentElement;
    while (parent) {
      if (parent.tagName.toLowerCase() === 'defs' || parent.tagName.toLowerCase() === 'symbol') return false;
      parent = parent.parentElement;
    }
    return true;
  });

  const paths: PathItem[] = [];
  let idx = 0;
  for (const el of elements) {
    const d = toPathD(el);
    if (!d) continue;
    const stroke = getColor(el, 'stroke');
    const fill = getColor(el, 'fill');
    paths.push({
      id: `path-${idx}-${Date.now()}`,
      name: getName(el, idx),
      d,
      originalElement: el.tagName.toLowerCase(),
      stroke,
      fill,
      strokeWidth: getStrokeWidth(el),
      visible: true,
      order: idx,
      totalLength: 0, // computed client-side via SVGPathElement.getTotalLength()
    });
    idx++;
  }
  return { paths, viewBox };
}

export function applySmartDefaults(pathCount: number): { drawDur: number; stagger: number; fillStart: number; hold: number } {
  if (pathCount <= 1) return { drawDur: 1.8, stagger: 0, fillStart: 1.0, hold: 0.6 };
  if (pathCount <= 2) return { drawDur: 2.2, stagger: 0.18, fillStart: 1.0, hold: 0.6 };
  return { drawDur: 2.8, stagger: 0.18, fillStart: 1.0, hold: 0.6 };
}
