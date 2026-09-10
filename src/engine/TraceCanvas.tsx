"use client";

import { useEffect, useRef } from "react";
import { useStore } from "@/lib/store";
import { TUNE, retune } from "@/lib/edition";
import { NODE_COLORS, SCENE_BG } from "@/lib/palette";
import type { CaseFile } from "@/lib/types";
import {
  chapterEdgeSet,
  chapterFocusSet,
  driftPos,
  hash01,
  project,
  type Cam,
  type Proj,
} from "./trace";

/* ── TraceCanvas — the bubble trail, guaranteed ──────────────
   software-rendered 2d canvas: perspective projection of the
   authored 3d graph, comet trails behind every drifting bubble,
   gold flow packets along active edges. runs on any phone —
   no webgl, no shaders, nothing to blacklist. */

interface TrailPt {
  x: number;
  y: number;
}
interface Ripple {
  x: number;
  y: number;
  t0: number;
}

const TRAIL_EVERY = 46; // ms between trail samples
const TRAIL_LEN = TUNE.deskTrailLen; // edition-tuned comet length

export default function TraceCanvas() {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    retune(); // v10: pick desktop/mobile tuning before first frame
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const cf: CaseFile = useStore.getState().caseFile;
    const nodes = cf.nodes;
    const edges = cf.edges;

    /* per-node stable randoms */
    const phases = nodes.map((n) => [
      hash01(n.id + "x"),
      hash01(n.id + "y"),
      hash01(n.id + "z"),
    ]);

    const anim = {
      cam: null as Cam | null,
      goal: null as Cam | null,
      seqSeen: -1,
      selSeen: null as string | null,
      trails: new Map<string, TrailPt[]>(),
      lastSample: 0,
      ripples: [] as Ripple[],
      simT: 0,
      lastFrame: performance.now(),
      lastInteract: 0,
      w: 0,
      h: 0,
      dpr: 1,
      hit: [] as { id: string; x: number; y: number; r: number }[],
      coarse: window.matchMedia("(pointer: coarse)").matches,
      focusSet: chapterFocusSet(cf, 0),
      edgeSet: chapterEdgeSet(cf, 0),
    };

    /* ── sizing ── */
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (w === 0 || h === 0) return;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      anim.w = w;
      anim.h = h;
      anim.dpr = dpr;
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    /* ── store sync (imperative — no re-renders) ── */
    const syncStore = () => {
      const s = useStore.getState();
      if (s.camCmd && s.camCmd.seq !== anim.seqSeen) {
        anim.seqSeen = s.camCmd.seq;
        anim.goal = {
          target: [...s.camCmd.target] as [number, number, number],
          radius: s.camCmd.radius,
          theta: s.camCmd.theta,
          phi: s.camCmd.phi,
        };
        if (!anim.cam) anim.cam = { ...anim.goal };
        /* v14 fix: a chapter switch IS an interaction. without this,
           the idle orbit's goal.theta = cam.theta ratchet swallowed the
           authored chapter theta before the ease could reach it —
           chapter cameras only ever worked for users mid-drag. */
        anim.lastInteract = performance.now();
      }
      if (s.chapter !== undefined) {
        anim.focusSet = chapterFocusSet(cf, s.chapter);
        anim.edgeSet = chapterEdgeSet(cf, s.chapter);
      }
      if (s.selectedNodeId !== anim.selSeen) {
        anim.selSeen = s.selectedNodeId;
        if (s.selectedNodeId) {
          const n = nodes.find((m) => m.id === s.selectedNodeId);
          if (n && anim.cam) {
            /* THE fix the old builds missed: the view recenters the
               tapped bubble so the info card can never hide it. on
               touch layouts the card sits at the bottom, so bias the
               frame upward — the bubble lands in the clear zone. */
            const upBias = anim.w < 1024 ? 0.22 : 0;
            anim.goal = {
              target: [n.pos[0], n.pos[1] - upBias * Math.min(anim.cam.radius, 13), n.pos[2]],
              radius: Math.min(anim.cam.radius, 13),
              theta: anim.cam.theta,
              phi: anim.cam.phi,
            };
          }
        }
      }
    };
    const unsub = useStore.subscribe(syncStore);
    syncStore();

    /* ── pointer interaction ── */
    const pointers = new Map<number, { x: number; y: number }>();
    let pinchDist = 0;
    let drag: { x: number; y: number; t: number; th: number; ph: number; moved: boolean } | null =
      null;
    let lastTap = 0;

    const interacted = () => (anim.lastInteract = performance.now());

    const onDown = (e: PointerEvent) => {
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch {
        /* synthetic pointer — capture is optional */
      }
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      interacted();
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        pinchDist = Math.hypot(a.x - b.x, a.y - b.y);
        drag = null;
      } else if (pointers.size === 1) {
        drag = {
          x: e.clientX,
          y: e.clientY,
          t: performance.now(),
          th: anim.cam?.theta ?? 0,
          ph: anim.cam?.phi ?? 1.2,
          moved: false,
        };
      }
    };

    const onMove = (e: PointerEvent) => {
      if (!pointers.has(e.pointerId)) return;
      const prev = pointers.get(e.pointerId)!;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      interacted();

      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinchDist > 0 && anim.cam && anim.goal && d > 0) {
          const f = pinchDist / d;
          const r = clamp(anim.cam.radius * f, 5, 58);
          anim.cam.radius = r;
          anim.goal.radius = r;
        }
        pinchDist = d;
        return;
      }

      if (!drag || !anim.cam || !anim.goal) return;
      const dx = e.clientX - drag.x;
      const dy = e.clientY - drag.y;
      if (Math.hypot(dx, dy) > 8) drag.moved = true;
      if (!drag.moved) return;
      /* v8 — drag feels slightly livelier: +31% rotation per
         pixel, camera eases to the goal a touch quicker. still
         smooth, never twitchy. */
      const th = clamp(drag.th - dx * 0.0068, -Math.PI * 4, Math.PI * 4);
      const ph = clamp(drag.ph - dy * 0.0055, 0.3, 2.55);
      anim.cam.theta = th;
      anim.cam.phi = ph;
      anim.goal.theta = th;
      anim.goal.phi = ph;
    };

    const onUp = (e: PointerEvent) => {
      pointers.delete(e.pointerId);
      if (pointers.size < 2) pinchDist = 0;
      if (!drag) return;
      const dt = performance.now() - drag.t;
      const tapped = !drag.moved && dt < 420;
      const isDouble = performance.now() - lastTap < 320;
      if (tapped) lastTap = performance.now();
      drag = null;

      if (isDouble && tapped) {
        useStore.getState().recenter();
        return;
      }
      if (!tapped) return;

      /* hit test against last projected positions */
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      let best: string | null = null;
      let bestD = Infinity;
      for (const h of anim.hit) {
        const d = Math.hypot(h.x - mx, h.y - my);
        if (d < Math.max(h.r + 16, 30) && d < bestD) {
          bestD = d;
          best = h.id;
        }
      }
      useStore.getState().selectNode(best);
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      interacted();
      if (!anim.cam || !anim.goal) return;
      const r = clamp(anim.cam.radius * Math.exp(e.deltaY * 0.0011), 5, 58);
      anim.cam.radius = r;
      anim.goal.radius = r;
    };

    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });

    /* ── draw helpers — v15 paper: ink stamps, graphite rules,
       vermilion signal. "lighter" only works on black; on paper
       trails multiply (ink absorbing into the page). ── */
    const INK = "23, 21, 14";
    const SIGNAL = "212, 73, 31";
    const EMBER = "122, 30, 18";

    const rgba = (rgb: string, a: number) => `rgba(${rgb}, ${a})`;

    function drawTrail(pts: TrailPt[], headR: number, rgb: string) {
      if (pts.length < 2) return;
      ctx.save();
      ctx.globalCompositeOperation = "multiply";
      ctx.lineCap = "round";
      for (let i = 1; i < pts.length; i++) {
        const k = i / pts.length; // 0 old → 1 new
        const a = TUNE.deskTrailAlpha * k * k;
        const w = Math.max(0.5, headR * TUNE.deskTrailWidth * k);
        ctx.strokeStyle = rgba(rgb, a);
        ctx.lineWidth = w;
        ctx.beginPath();
        ctx.moveTo(pts[i - 1].x, pts[i - 1].y);
        ctx.lineTo(pts[i].x, pts[i].y);
        ctx.stroke();
      }
      ctx.restore();
    }

    function drawBubble(p: Proj, r: number, color: string, dim: number) {
      /* printed stamp — flat ink-wash fill, one soft paper
         highlight upper-left, crisp ring. reads at every size. */
      ctx.fillStyle = hexA(color, Math.min(1, 0.86 * dim));
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, 6.2832);
      ctx.fill();
      const g = ctx.createRadialGradient(
        p.x - r * 0.34,
        p.y - r * 0.42,
        r * 0.04,
        p.x - r * 0.34,
        p.y - r * 0.42,
        r * 0.95,
      );
      g.addColorStop(0, `rgba(251, 250, 245, ${Math.min(1, 0.5 * dim)})`);
      g.addColorStop(1, "rgba(251, 250, 245, 0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, 6.2832);
      ctx.fill();
      ctx.strokeStyle = hexA(color, Math.min(1, 0.95 * dim));
      ctx.lineWidth = 1.1;
      ctx.stroke();
    }

    const hexCache = new Map<string, [number, number, number]>();
    function hexA(hex: string, a: number) {
      let c = hexCache.get(hex);
      if (!c) {
        const v = parseInt(hex.slice(1), 16);
        c = [(v >> 16) & 255, (v >> 8) & 255, v & 255];
        hexCache.set(hex, c);
      }
      return `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${a})`;
    }

    /* ── main loop ── */
    let raf = 0;
    let running = true;

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (!running || document.hidden || anim.w === 0) return;
      const dt = Math.min(0.05, (now - anim.lastFrame) / 1000);
      anim.lastFrame = now;
      syncStore();

      const paused = useStore.getState().paused;
      if (!paused) anim.simT += dt;

      /* idle slow orbit — the file never sits dead. v7: the web
         edition starts breathing sooner and a touch faster so the
         comet trails always have a path; mobile keeps the calm v6
         pacing that already worked there. */
      if (
        !paused &&
        !anim.selSeen &&
        now - anim.lastInteract > TUNE.idleDelay &&
        anim.cam &&
        anim.goal
      ) {
        anim.cam.theta += TUNE.orbitSpeed * dt;
        anim.goal.theta = anim.cam.theta;
      }

      /* ease cam → goal */
      if (anim.cam && anim.goal) {
        const k = 1 - Math.pow(0.0009, dt);
        anim.cam.target[0] += (anim.goal.target[0] - anim.cam.target[0]) * k;
        anim.cam.target[1] += (anim.goal.target[1] - anim.cam.target[1]) * k;
        anim.cam.target[2] += (anim.goal.target[2] - anim.cam.target[2]) * k;
        anim.cam.radius += (anim.goal.radius - anim.cam.radius) * k;
        anim.cam.theta += (anim.goal.theta - anim.cam.theta) * k;
        anim.cam.phi += (anim.goal.phi - anim.cam.phi) * k;
      }
      const cam = anim.cam;
      if (!cam) return;

      const { w, h } = anim;
      ctx.setTransform(anim.dpr, 0, 0, anim.dpr, 0, 0);

      /* backdrop */
      ctx.fillStyle = SCENE_BG;
      ctx.fillRect(0, 0, w, h);

      /* faint instrument grid — graphite pin-points */
      ctx.fillStyle = rgba(INK, 0.07);
      const gs = 46;
      const gx = ((cam.theta * 140) % gs + gs) % gs;
      const gy = ((cam.phi * 140) % gs + gs) % gs;
      for (let x = -gx; x < w; x += gs)
        for (let y = -gy; y < h; y += gs) ctx.fillRect(x, y, 1.5, 1.5);

      /* project */
      const t = anim.simT;
      const projs = new Map<string, Proj | null>();
      const order: { id: string; p: Proj; r: number }[] = [];
      anim.hit.length = 0;

      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const wp = driftPos(
          n.pos,
          t,
          phases[i][0],
          phases[i][1],
          phases[i][2],
          TUNE.driftAmp,
          TUNE.driftSpeed,
        );
        const p = project(wp, cam, w, h);
        projs.set(n.id, p);
        if (!p) continue;
        const base = (n.size ?? 0.9) * 0.5;
        const r = Math.max(3.2, Math.min(26, base * p.scale));
        order.push({ id: n.id, p, r });
      }
      order.sort((a, b) => b.p.depth - a.p.depth);

      /* edges */
      for (const e of edges) {
        const a = projs.get(e.source);
        const b = projs.get(e.target);
        if (!a || !b) continue;
        const active = anim.edgeSet.has(e.id);
        const touchSel = anim.selSeen === e.source || anim.selSeen === e.target;
        const alpha = active ? 0.62 : touchSel ? 0.45 : 0.15;
        ctx.strokeStyle = active ? rgba(SIGNAL, alpha) : rgba(INK, alpha);
        ctx.lineWidth = active || touchSel ? 1.4 : 1;
        if (active) {
          ctx.setLineDash([2.5, 6.5]);
          ctx.lineDashOffset = paused ? 0 : -t * 16;
        }
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
        ctx.setLineDash([]);

        /* flow packets along active edges */
        if (active && !paused && a.depth > 1 && b.depth > 1) {
          for (let k = 0; k < 2; k++) {
            const f = (t * 0.14 + k * 0.5 + hash01(e.id + k)) % 1;
            const fx = a.x + (b.x - a.x) * f;
            const fy = a.y + (b.y - a.y) * f;
            ctx.fillStyle = rgba(SIGNAL, 0.2);
            ctx.beginPath();
            ctx.arc(fx, fy, 4.5, 0, 6.2832);
            ctx.fill();
            ctx.fillStyle = rgba(SIGNAL, 0.9);
            ctx.beginPath();
            ctx.arc(fx, fy, 1.7, 0, 6.2832);
            ctx.fill();
          }
        }
      }

      /* trails — sample then draw */
      if (!paused && now - anim.lastSample > TRAIL_EVERY) {
        anim.lastSample = now;
        for (const o of order) {
          let tr = anim.trails.get(o.id);
          if (!tr) {
            tr = [];
            anim.trails.set(o.id, tr);
          }
          tr.push({ x: o.p.x, y: o.p.y });
          if (tr.length > TRAIL_LEN) tr.shift();
        }
      }
      const mixerRgb = EMBER;
      for (const o of order) {
        const n = nodes.find((m) => m.id === o.id)!;
        const tr = anim.trails.get(o.id);
        if (tr && tr.length > 1) {
          const rgb = n.kind === "mixer" ? mixerRgb : INK;
          drawTrail(tr, o.r, rgb);
        }
      }

      /* bubbles */
      for (const o of order) {
        const n = nodes.find((m) => m.id === o.id)!;
        const inFocus = anim.focusSet.size === 0 || anim.focusSet.has(n.id);
        const dim = inFocus ? 1 : 0.5;
        const color = NODE_COLORS[n.kind];

        /* under-tint — a whisper of colour in the paper */
        const gl = ctx.createRadialGradient(o.p.x, o.p.y, o.r * 0.4, o.p.x, o.p.y, o.r * 2.4);
        gl.addColorStop(0, hexA(color, 0.13 * dim));
        gl.addColorStop(1, hexA(color, 0));
        ctx.fillStyle = gl;
        ctx.beginPath();
        ctx.arc(o.p.x, o.p.y, o.r * 2.4, 0, 6.2832);
        ctx.fill();

        drawBubble(o.p, o.r, color, dim);

        /* focus halo */
        if (inFocus && anim.focusSet.size > 0) {
          ctx.strokeStyle = rgba(SIGNAL, 0.55);
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(o.p.x, o.p.y, o.r + 4.5, 0, 6.2832);
          ctx.stroke();
        }

        /* selection ring + ripple */
        if (anim.selSeen === n.id) {
          ctx.strokeStyle = rgba(SIGNAL, 0.95);
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.arc(o.p.x, o.p.y, o.r + 6.5, 0, 6.2832);
          ctx.stroke();
        }

        anim.hit.push({ id: n.id, x: o.p.x, y: o.p.y, r: o.r });
      }

      /* ripples */
      anim.ripples = anim.ripples.filter((rp) => now - rp.t0 < 700);
      for (const rp of anim.ripples) {
        const k = (now - rp.t0) / 700;
        ctx.strokeStyle = rgba(SIGNAL, 0.6 * (1 - k));
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(rp.x, rp.y, 8 + k * 46, 0, 6.2832);
        ctx.stroke();
      }

      /* labels */
      const showAll = !anim.coarse;
      ctx.textAlign = "center";
      for (const o of order) {
        const n = nodes.find((m) => m.id === o.id)!;
        const inFocus = anim.focusSet.size === 0 || anim.focusSet.has(n.id);
        const want =
          anim.selSeen === n.id ||
          n.key ||
          (showAll && o.p.scale > 13) ||
          (inFocus && (anim.coarse ? o.r > 7 : o.p.scale > 9));
        if (!want) continue;
        const fs = Math.max(9, Math.min(12.5, o.r * 0.62 + 6));
        ctx.font = `500 ${fs}px "IBM Plex Mono", monospace`;
        const la = anim.selSeen === n.id ? 0.95 : inFocus ? 0.72 : 0.38;
        ctx.fillStyle = rgba(INK, la);
        ctx.fillText(n.short, o.p.x, o.p.y + o.r + fs + 4);
      }

      /* paper edge shading — barely-there ink vignette */
      const vg = ctx.createRadialGradient(
        w / 2,
        h / 2,
        Math.min(w, h) * 0.42,
        w / 2,
        h / 2,
        Math.max(w, h) * 0.78,
      );
      vg.addColorStop(0, "rgba(23, 21, 14, 0)");
      vg.addColorStop(1, "rgba(23, 21, 14, 0.07)");
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, w, h);
    };

    raf = requestAnimationFrame(frame);

    /* spawn selection ripples on selection change */
    let prevSel: string | null = useStore.getState().selectedNodeId;
    const unsubSel = useStore.subscribe((s) => {
      if (s.selectedNodeId !== prevSel) {
        prevSel = s.selectedNodeId;
        if (s.selectedNodeId) {
          const hitp = anim.hit.find((hh) => hh.id === s.selectedNodeId);
          if (hitp) anim.ripples.push({ x: hitp.x, y: hitp.y, t0: performance.now() });
        }
      }
      if (s.view !== "desk") running = false;
    });

    const onVis = () => {
      anim.lastFrame = performance.now();
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      unsub();
      unsubSel();
      document.removeEventListener("visibilitychange", onVis);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      canvas.removeEventListener("wheel", onWheel);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      className="absolute inset-0 h-full w-full"
      style={{ touchAction: "none" }}
      aria-label="Trace viewport — drag to orbit, pinch to zoom, tap a bubble"
    />
  );
}

function clamp(v: number, a: number, b: number) {
  return Math.min(b, Math.max(a, v));
}
