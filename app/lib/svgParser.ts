import type { PathItem } from './types';

const SVG_NS = 'http://www.w3.org/2000/svg';
const ANIMATABLE = ['path', 'line', 'polyline', 'polygon', 'rect', 'circle', 'ellipse'];

/* ─────────────────────────────────────────────────────────────
 * Resolve <use xlink:href="#id"> by inlining the referenced
 * element's children. Handles both <symbol> and arbitrary node
 * targets. Iterates because resolved trees can contain more <use>.
 * ────────────────────────────────────────────────────────────*/
function resolveUseElements(doc: Document, root: Element) {
  for (let pass = 0; pass < 4; pass++) {
    const useEls = Array.from(root.querySelectorAll('use'));
    if (useEls.length === 0) return;
    let resolved = 0;
    for (const useEl of useEls) {
      const href =
        useEl.getAttribute('href') ||
        useEl.getAttribute('xlink:href') ||
        useEl.getAttributeNS('http://www.w3.org/1999/xlink', 'href');
      if (!href || !href.startsWith('#')) continue;
      const target = doc.getElementById(href.slice(1));
      if (!target) continue;

      const x = parseFloat(useEl.getAttribute('x') || '0');
      const y = parseFloat(useEl.getAttribute('y') || '0');
      const useTransform = useEl.getAttribute('transform') || '';

      // Wrap the inlined content in a <g> so we can apply the use's
      // transform/x/y without disturbing the source.
      const g = doc.createElementNS(SVG_NS, 'g');
      const tParts = [useTransform, x || y ? `translate(${x} ${y})` : ''].filter(Boolean);
      if (tParts.length) g.setAttribute('transform', tParts.join(' '));

      const tag = target.tagName.toLowerCase();
      if (tag === 'symbol' || tag === 'svg') {
        // Lift the children of the symbol into the <g>
        Array.from(target.children).forEach((child) => g.appendChild(child.cloneNode(true)));
      } else {
        g.appendChild(target.cloneNode(true));
      }
      useEl.replaceWith(g);
      resolved++;
    }
    if (resolved === 0) return;
  }
}

/* ─────────────────────────────────────────────────────────────
 * Move children of <defs>/<symbol> out is NOT what we want — we
 * just want to ignore them when listing animatable paths. Helper.
 * ────────────────────────────────────────────────────────────*/
function isInsideDefs(el: Element): boolean {
  let p: Element | null = el.parentElement;
  while (p) {
    const tag = p.tagName.toLowerCase();
    if (tag === 'defs' || tag === 'symbol' || tag === 'clippath' || tag === 'mask') return true;
    p = p.parentElement;
  }
  return false;
}

function getName(el: Element, index: number): string {
  const id = el.getAttribute('id');
  if (id) {
    return id
      .replace(/[-_]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }
  const titleEl = el.querySelector('title');
  if (titleEl?.textContent) return titleEl.textContent;
  return `Path ${index + 1}`;
}

/* Try to read the effective stroke / fill of an element, considering
 * (a) attribute, (b) inline style, (c) CSS rule from a <style> block
 * matched by class. Falls back to '' if unknown. */
function readPaintAttr(
  el: Element,
  attr: 'stroke' | 'fill',
  styleRules: StyleRules,
): string {
  // Attribute first
  const direct = el.getAttribute(attr);
  if (direct) return direct;
  // Inline style
  const styleAttr = el.getAttribute('style') || '';
  const inline = readStyleProp(styleAttr, attr);
  if (inline) return inline;
  // <style> block, by class
  const cls = el.getAttribute('class');
  if (cls) {
    for (const c of cls.split(/\s+/)) {
      const rule = styleRules.byClass.get(c);
      if (rule) {
        const v = readStyleProp(rule, attr);
        if (v) return v;
      }
    }
  }
  // <style> block, by tag
  const tagRule = styleRules.byTag.get(el.tagName.toLowerCase());
  if (tagRule) {
    const v = readStyleProp(tagRule, attr);
    if (v) return v;
  }
  return '';
}

function readStyleProp(styleStr: string, prop: string): string | null {
  // Match `prop: value;` ignoring whitespace
  const re = new RegExp(`(?:^|;|\\s)${prop}\\s*:\\s*([^;]+)`, 'i');
  const m = styleStr.match(re);
  return m ? m[1].trim() : null;
}

interface StyleRules {
  byClass: Map<string, string>;
  byTag: Map<string, string>;
}

function collectStyleRules(svgEl: Element): StyleRules {
  const out: StyleRules = { byClass: new Map(), byTag: new Map() };
  const styleEls = svgEl.querySelectorAll('style');
  styleEls.forEach((styleEl) => {
    const css = styleEl.textContent || '';
    // very simple parser: split on '}'
    css.split('}').forEach((block) => {
      const [selectorPart, body] = block.split('{');
      if (!selectorPart || !body) return;
      const selectors = selectorPart.split(',').map((s) => s.trim()).filter(Boolean);
      const rule = body.trim();
      for (const sel of selectors) {
        if (sel.startsWith('.')) {
          out.byClass.set(sel.slice(1), rule);
        } else if (/^[a-zA-Z][\w-]*$/.test(sel)) {
          out.byTag.set(sel.toLowerCase(), rule);
        }
        // ignore complex selectors
      }
    });
  });
  return out;
}

function normalizeColor(v: string, attr: 'stroke' | 'fill'): string {
  const t = v.trim().toLowerCase();
  if (!t || t === 'none' || t === 'transparent') {
    return attr === 'fill' ? 'none' : 'none';
  }
  // Accept hex, rgb(), named colors as-is. The browser will resolve them.
  return v.trim();
}

function readStrokeWidth(el: Element, styleRules: StyleRules): number {
  const direct = el.getAttribute('stroke-width');
  if (direct) {
    const n = parseFloat(direct);
    if (!isNaN(n)) return n;
  }
  const styleAttr = el.getAttribute('style') || '';
  const inline = readStyleProp(styleAttr, 'stroke-width');
  if (inline) {
    const n = parseFloat(inline);
    if (!isNaN(n)) return n;
  }
  const cls = el.getAttribute('class');
  if (cls) {
    for (const c of cls.split(/\s+/)) {
      const rule = styleRules.byClass.get(c);
      if (rule) {
        const v = readStyleProp(rule, 'stroke-width');
        if (v) {
          const n = parseFloat(v);
          if (!isNaN(n)) return n;
        }
      }
    }
  }
  return 1;
}

/* ─────────────────────────────────────────────────────────────
 * Public API
 * ────────────────────────────────────────────────────────────*/
export interface ParsedSVG {
  paths: PathItem[];
  viewBox: string;
  /** Modified SVG markup — has <use> resolved and data-trace-id added. */
  svgMarkup: string;
}

export function parseSVG(svgText: string): ParsedSVG {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgText, 'image/svg+xml');
  const parserError = doc.querySelector('parsererror');
  if (parserError) {
    return { paths: [], viewBox: '0 0 200 200', svgMarkup: '' };
  }
  const svgEl = doc.querySelector('svg');
  if (!svgEl) return { paths: [], viewBox: '0 0 200 200', svgMarkup: '' };

  // Inline <use> references
  resolveUseElements(doc, svgEl);

  // Determine viewBox — fall back to width/height or a sane default
  let viewBox = svgEl.getAttribute('viewBox');
  if (!viewBox) {
    const w = parseFloat(svgEl.getAttribute('width') || '0') || 200;
    const h = parseFloat(svgEl.getAttribute('height') || '0') || 200;
    viewBox = `0 0 ${w} ${h}`;
    svgEl.setAttribute('viewBox', viewBox);
  }

  // Strip explicit width/height so the host container controls sizing
  svgEl.removeAttribute('width');
  svgEl.removeAttribute('height');
  svgEl.setAttribute('preserveAspectRatio', 'xMidYMid meet');

  // Collect style rules so we can read class-based fills/strokes
  const styleRules = collectStyleRules(svgEl);

  // Find all animatable elements outside <defs>/<symbol>/<clipPath>/<mask>
  const elements = Array.from(svgEl.querySelectorAll(ANIMATABLE.join(','))).filter(
    (el) => !isInsideDefs(el),
  );

  // Tag each one with a stable data-trace-id and build metadata
  const paths: PathItem[] = elements.map((el, i) => {
    const id = `tp-${i}`;
    el.setAttribute('data-trace-id', id);

    const strokeRaw = readPaintAttr(el, 'stroke', styleRules);
    const fillRaw = readPaintAttr(el, 'fill', styleRules);
    const strokeColor = normalizeColor(strokeRaw, 'stroke');
    const fillColor = normalizeColor(fillRaw, 'fill');
    const strokeWidth = readStrokeWidth(el, styleRules);

    // Default: if neither stroke nor fill is set, treat as fill-only black.
    const finalFill = fillColor || (strokeColor === 'none' ? '#0a0a14' : 'none');
    const finalStroke = strokeColor || (fillColor === 'none' ? '#ffffff' : 'none');

    return {
      id,
      name: getName(el, i),
      d: el.getAttribute('d') || '',
      originalElement: el.tagName.toLowerCase(),
      stroke: finalStroke === 'none' ? '#ffffff' : finalStroke,
      fill: finalFill,
      strokeWidth: strokeWidth > 0 ? strokeWidth : 1.5,
      visible: true,
      order: i,
      totalLength: 0,
    };
  });

  return {
    paths,
    viewBox,
    svgMarkup: svgEl.outerHTML,
  };
}

export function applySmartDefaults(pathCount: number): {
  drawDur: number;
  stagger: number;
  fillStart: number;
  hold: number;
} {
  if (pathCount <= 1) return { drawDur: 1.8, stagger: 0, fillStart: 1.0, hold: 0.6 };
  if (pathCount <= 2) return { drawDur: 2.2, stagger: 0.18, fillStart: 1.0, hold: 0.6 };
  return { drawDur: 2.8, stagger: 0.18, fillStart: 1.0, hold: 0.6 };
}
