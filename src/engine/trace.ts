import type { CaseFile } from "@/lib/types";

/* ── trace engine math ───────────────────────────────────────
   the case graph was authored in 3d (node.pos, chapter.camera
   keyframes). we honour it verbatim: a software perspective
   projection renders it to a 2d canvas — no webgl, no shader
   compilation, no postprocessing. if the browser can draw a
   circle, the bubbles and their trails are on screen. */

export interface Cam {
  target: [number, number, number];
  radius: number;
  theta: number;
  phi: number;
}

export interface Proj {
  x: number;
  y: number;
  depth: number;
  scale: number;
}

/* the screen-space box the figure is framed inside. the plate
   carries its own furniture (fig caption on the top edge, the
   chapter ruler on the bottom edge) — the projection centers
   the figure in the band that is actually visible, so no
   bubble ever prints under the chrome. null = full canvas. */
export interface ViewBox {
  ox: number; // center x of the visible band
  oy: number; // center y of the visible band
  fw: number; // framing width  — drives focal length
  fh: number; // framing height — drives focal length
}

type V3 = [number, number, number];

const sub3 = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot3 = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross3 = (a: V3, b: V3): V3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const norm3 = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};

export function camPos(c: Cam): V3 {
  const sp = Math.sin(c.phi);
  const cp = Math.cos(c.phi);
  const st = Math.sin(c.theta);
  const ct = Math.cos(c.theta);
  return [
    c.target[0] + c.radius * sp * st,
    c.target[1] + c.radius * cp,
    c.target[2] + c.radius * sp * ct,
  ];
}

/* the camera's orthonormal basis: forward (target − eye),
   right, and up. lets screen-space corrections be translated
   back into world-space target shifts. */
export function camBasis(c: Cam): { f: V3; r: V3; u: V3 } {
  const cp = camPos(c);
  const f = norm3(sub3(c.target, cp));
  let r = cross3(f, [0, 1, 0]);
  if (Math.hypot(r[0], r[1], r[2]) < 1e-4) r = [1, 0, 0];
  const rn = norm3(r);
  const u = cross3(rn, f);
  return { f, r: rn, u };
}

/* world → screen. null when the point is behind the camera. */
export function project(
  p: V3,
  cam: Cam,
  w: number,
  h: number,
  vb?: ViewBox,
): Proj | null {
  const cp = camPos(cam);
  const f = norm3(sub3(cam.target, cp));
  let r = cross3(f, [0, 1, 0]);
  if (Math.hypot(r[0], r[1], r[2]) < 1e-4) r = [1, 0, 0];
  const rn = norm3(r);
  const u = cross3(rn, f);
  const d = sub3(p, cp);
  const z = dot3(d, f);
  if (z < 0.6) return null;
  const x = dot3(d, rn);
  const y = dot3(d, u);
  const focal = Math.min(vb ? vb.fw : w, vb ? vb.fh : h) * 1.08;
  const s = focal / z;
  const cx = vb ? vb.ox : w / 2;
  const cy = vb ? vb.oy : h / 2;
  return { x: cx + x * s, y: cy - y * s, depth: z, scale: s };
}

/* deterministic 0..1 from a seed string — stable drift phases */
export function hash01(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return (h % 10000) / 10000;
}

/* gentle organic drift so bubbles feel alive and trails stay fed
   amp/spd let the web edition wander further (comets need motion) */
export function driftPos(
  base: V3,
  t: number,
  p1: number,
  p2: number,
  p3: number,
  amp = 1,
  spd = 1,
): V3 {
  return [
    base[0] + Math.sin(t * 0.31 * spd + p1 * 6.283) * 0.55 * amp,
    base[1] + Math.sin(t * 0.23 * spd + p2 * 6.283) * 0.5 * amp,
    base[2] + Math.cos(t * 0.27 * spd + p3 * 6.283) * 0.55 * amp,
  ];
}

export function chapterFocusSet(cf: CaseFile, i: number): Set<string> {
  return new Set(cf.chapters[Math.min(i, cf.chapters.length - 1)].focus);
}

export function chapterEdgeSet(cf: CaseFile, i: number): Set<string> {
  return new Set(cf.chapters[Math.min(i, cf.chapters.length - 1)].edges);
}
