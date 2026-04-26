export type PathItem = {
  id: string;
  name: string;
  d: string;
  originalElement: string; // tag name
  stroke: string;
  fill: string;
  strokeWidth: number;
  visible: boolean;
  order: number;
  totalLength: number;
};

export type Anim = {
  drawDur: number;    // seconds, default 2.4
  fillStart: number;  // seconds after draw starts, default 1.0
  hold: number;       // seconds, default 0.6
  stagger: number;    // seconds between paths, default 0.18
};

export type LoopMode = 'once' | 'loop' | 'pingpong';

export type EditorState = {
  paths: PathItem[];
  anim: Anim;
  smartDefaults: boolean;
  loop: LoopMode;
  split: boolean;
  splitPos: number; // 0..1
  playing: boolean;
  elapsed: number;  // 0..totalDur
  format: '1:1' | '16:9' | '9:16';
  svgContent: string;
  svgViewBox: string;
  fileName: string;
};

export type SampleKey = 'geometric' | 'monogram' | 'icon' | 'star';
