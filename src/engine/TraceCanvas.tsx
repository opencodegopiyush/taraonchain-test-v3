"use client";

import { useEffect, useRef } from "react";
import { useStore } from "@/lib/store";
import { retune } from "@/lib/edition";
import { NODE_COLORS, SCENE_BG } from "@/lib/palette";
import type { CaseFile } from "@/lib/types";
import {
  camBasis,
  chapterEdgeSet,
  chapterFocusSet,
  project,
  type Cam,
  type Proj,
} from "./trace";

/* ── TraceCanvas — v19 "NIGHT SHIFT" ─────────────────────────
   the motion budget, enforced in code:

   · RENDER-ON-DEMAND — the rAF loop starts only when something
     can change (drag, pinch, wheel, chapter ease, selection,
     resize) and STOPS the moment the camera settles. a graph
     you're not touching costs zero draws, zero GPU, zero watts.
     v14/v15 redrew the full plate every frame forever; this is
     the single biggest fix for the "laggy" report.
   · FLAT PRINT RENDERING — no trails, no flow packets, no
     halos, no ripples, no vignette, no per-frame gradients,
     no grid dots. each node is one flat disc + one ring; each
     edge one line. dozens of draws per frame, not thousands.
   · NO IDLE MOTION — no drift, no orbit. the figure holds
     still like a plate in a printed dossier; you hold the
     lens. interaction math (orbit / pinch / tap / authored
     chapter cameras) is untouched from v14. */

interface Hit {
  id: string;
  x: number;
  y: number;
  r: number;
}

/* camera settled thresholds — below these the plate is at rest */
const EPS = {
  tx: 0.002,
  radius: 0.004,
  angle: 0.0004,
};

export default function TraceCanvas() {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    retune(); // pick desktop/mobile tuning before first frame
    const canvas = ref.current;
    if (!canvas) return;
    const ctx0 = canvas.getContext("2d", { alpha: false });
    if (!ctx0) return;
    const ctx = ctx0; // non-null from here into every closure

    const cf: CaseFile = useStore.getState().caseFile;
    const nodes = cf.nodes;
    const edges = cf.edges;

    /* id → node map (v14 drew with nodes.find per bubble per
       frame — O(n²). v16 looks up once, ever). */
    const nodeById = new Map(nodes.map((n) => [n.id, n]));

    const anim = {
      cam: null as Cam | null,
      goal: null as Cam | null,
      /* the authored camera each goal was contained from — kept so
         a plate resize (split drag, rotate) can re-contain from the
         authored framing instead of compounding zoom-outs */
      base: null as Cam | null,
      /* the user took the lens — containment stands down until the
         next authored camera so their zoom is never yanked back */
      userTouched: false,
      seqSeen: -1,
      selSeen: null as string | null,
      w: 0,
      h: 0,
      dpr: 1,
      hit: [] as Hit[],
      coarse: window.matchMedia("(pointer: coarse)").matches,
      focusSet: chapterFocusSet(cf, 0),
      edgeSet: chapterEdgeSet(cf, 0),
      chSeen: 0,
      dragging: false,
    };

    /* ── the visible band ──
       the plate prints its own furniture onto the canvas: the fig
       caption sits on the top edge, the chapter ruler owns the
       bottom strip. the figure is framed inside the band that is
       actually visible — this is the box the projection centers on
       and the box containment keeps every relevant bubble inside. */
    function safeBox() {
      const top = anim.coarse ? 64 : 46; // fig caption (two lines on touch)
      const bottom = 40; // the chapter ruler strip
      const side = 12;
      const bw = Math.max(60, anim.w - side * 2);
      const bh = Math.max(60, anim.h - top - bottom);
      return {
        x0: side,
        y0: top,
        x1: side + bw,
        y1: top + bh,
        ox: side + bw / 2,
        oy: top + bh / 2,
        fw: bw,
        fh: bh,
      };
    }

    /* ── containment — the authored camera is honoured, never
       hidden: chapter 01 is the establishing shot, so the WHOLE
       figure must sit on the plate; every other chapter must at
       least hold the actors it talks about. the pass only ever
       pulls the lens back — target, tilt and framing stay exactly
       as authored. the overflow shrinks monotonically as the lens
       pulls back, so the MINIMAL fitting radius is found by
       bisection — no over-zoom, ever. runs on every authored
       camera and again when the plate changes size. */
    function contain(c: Cam): Cam {
      if (anim.w < 80 || anim.h < 80) return c; // plate not measured yet
      const st = useStore.getState();
      const establishing = st.chapter === 0;
      const focus = chapterFocusSet(cf, st.chapter);
      const box = safeBox();
      const pad = 10;

      const overAt = (r: number): number => {
        const g: Cam = {
          target: [...c.target] as [number, number, number],
          radius: r,
          theta: c.theta,
          phi: c.phi,
        };
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        let seen = 0;
        for (const n of nodes) {
          if (!establishing && focus.size > 0 && !focus.has(n.id)) continue;
          const p = project(n.pos, g, anim.w, anim.h, box);
          if (!p) continue; // behind the lens — pulling back never fixes it
          seen++;
          const pr = Math.max(3.2, Math.min(26, (n.size ?? 0.9) * 0.5 * p.scale));
          if (p.x - pr < minX) minX = p.x - pr;
          if (p.x + pr > maxX) maxX = p.x + pr;
          if (p.y - pr < minY) minY = p.y - pr;
          if (p.y + pr + 15 > maxY) maxY = p.y + pr + 15; // + label strip
        }
        if (seen === 0) return 0;
        return Math.max(
          box.x0 - pad - minX,
          maxX - (box.x1 + pad),
          box.y0 - pad - minY,
          maxY - (box.y1 + pad),
          0,
        );
      };

      if (overAt(c.radius) <= 0) return c; // the authored framing already holds
      let lo = c.radius;
      let hi = Math.min(76, c.radius * 1.7);
      for (let i = 0; i < 10 && hi < 76 && overAt(hi) > 0; i++) hi = Math.min(76, hi * 1.7);
      for (let i = 0; i < 24; i++) {
        const mid = (lo + hi) / 2;
        if (overAt(mid) > 0) lo = mid;
        else hi = mid;
      }
      return {
        target: [...c.target] as [number, number, number],
        radius: hi,
        theta: c.theta,
        phi: c.phi,
      };
    }

    /* ── sizing ── */
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (w === 0 || h === 0) return;
      const grew = w !== anim.w || h !== anim.h;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      anim.w = w;
      anim.h = h;
      anim.dpr = dpr;
      /* the plate changed shape — re-fit the authored framing into
         the new band (the user's own zoom is left alone) */
      if (grew && anim.base && !anim.userTouched) {
        anim.goal = contain(anim.base);
      }
      kick();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    /* ── render-on-demand loop ── */
    let raf = 0;
    let running = false;
    let lastFrame = 0;

    function settled(): boolean {
      if (!anim.cam || !anim.goal) return true;
      const c = anim.cam;
      const g = anim.goal;
      return (
        !anim.dragging &&
        Math.abs(c.target[0] - g.target[0]) < EPS.tx &&
        Math.abs(c.target[1] - g.target[1]) < EPS.tx &&
        Math.abs(c.target[2] - g.target[2]) < EPS.tx &&
        Math.abs(c.radius - g.radius) < EPS.radius &&
        Math.abs(c.theta - g.theta) < EPS.angle &&
        Math.abs(c.phi - g.phi) < EPS.angle
      );
    }

    function loop(now: number) {
      if (!running) return;
      if (document.hidden || anim.w === 0) {
        running = false;
        return;
      }
      const dt = Math.min(0.05, (now - lastFrame) / 1000 || 0.016);
      lastFrame = now;
      syncStore();

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

      draw();

      if (settled()) {
        running = false; // the plate holds still — zero cost
        return;
      }
      raf = requestAnimationFrame(loop);
    }

    function kick() {
      if (running) return;
      running = true;
      lastFrame = performance.now();
      raf = requestAnimationFrame(loop);
    }

    /* ── store sync (imperative — no re-renders) ── */
    const syncStore = () => {
      const s = useStore.getState();
      if (s.camCmd && s.camCmd.seq !== anim.seqSeen) {
        anim.seqSeen = s.camCmd.seq;
        anim.userTouched = false; // a fresh authored frame owns the lens again
        anim.base = {
          target: [...s.camCmd.target] as [number, number, number],
          radius: s.camCmd.radius,
          theta: s.camCmd.theta,
          phi: s.camCmd.phi,
        };
        anim.goal = contain(anim.base);
        if (!anim.cam) anim.cam = { ...anim.goal };
        /* v14 fix retained: a chapter switch IS an interaction —
           the authored camera must survive the ease. */
        kick();
      }
      if (s.chapter !== undefined && s.chapter !== anim.chSeen) {
        /* chapter CHANGED — refresh focus/edge sets once. (never
           compare the Sets themselves: these helpers allocate a
           fresh Set per call, so identity is always unequal and
           the loop would never sleep.) */
        anim.chSeen = s.chapter;
        anim.focusSet = chapterFocusSet(cf, s.chapter);
        anim.edgeSet = chapterEdgeSet(cf, s.chapter);
        kick();
      }
      if (s.selectedNodeId !== anim.selSeen) {
        anim.selSeen = s.selectedNodeId;
        if (s.selectedNodeId) {
          const n = nodeById.get(s.selectedNodeId);
          if (n && anim.cam) {
            const radius = Math.min(anim.cam.radius, 13);
            /* layout test, not plate test: in the 50/50 desk the
               desktop plate is ~700px wide — only the VIEWPORT
               tells mobile from desktop (same rule as the seam) */
            const narrow = window.innerWidth < 1024;
            /* the view recenters the tapped bubble so the record
               can never hide it. touch layouts: the record lives in
               the report half — bias the frame upward for breathing
               room. desktop: the specimen card owns the plate's left
               strip, so the bubble is framed into the open band
               beside it. */
            const g: Cam = {
              target: [n.pos[0], n.pos[1] - (narrow ? 0.22 * radius : 0), n.pos[2]],
              radius,
              theta: anim.cam.theta,
              phi: anim.cam.phi,
            };
            if (!narrow) {
              const box = safeBox();
              const cardW = 376; // 340px card + margins
              const p0 = project(n.pos, g, anim.w, anim.h, box);
              if (p0 && box.x0 < cardW && box.x1 > cardW) {
                const want = cardW + (box.x1 - cardW) / 2;
                const dx = want - p0.x;
                if (Math.abs(dx) > 4 && p0.scale > 0) {
                  const rb = camBasis(g).r;
                  const k = dx / p0.scale;
                  g.target = [
                    g.target[0] - rb[0] * k,
                    g.target[1] - rb[1] * k,
                    g.target[2] - rb[2] * k,
                  ];
                }
              }
            }
            anim.goal = g;
          }
        }
        kick();
      }
    };
    const unsub = useStore.subscribe(syncStore);

    /* ── pointer interaction ── */
    const pointers = new Map<number, { x: number; y: number }>();
    let pinchDist = 0;
    let drag: { x: number; y: number; t: number; th: number; ph: number; moved: boolean } | null =
      null;
    let lastTap = 0;

    const onDown = (e: PointerEvent) => {
      anim.userTouched = true; // the lens is theirs now
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch {
        /* synthetic pointer — capture is optional */
      }
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        pinchDist = Math.hypot(a.x - b.x, a.y - b.y);
        drag = null;
      } else if (pointers.size === 1) {
        anim.dragging = true;
        drag = {
          x: e.clientX,
          y: e.clientY,
          t: performance.now(),
          th: anim.cam?.theta ?? 0,
          ph: anim.cam?.phi ?? 1.2,
          moved: false,
        };
      }
      kick();
    };

    const onMove = (e: PointerEvent) => {
      if (!pointers.has(e.pointerId)) return;
      const prev = pointers.get(e.pointerId)!;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

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
        kick();
        return;
      }

      if (!drag || !anim.cam || !anim.goal) return;
      const dx = e.clientX - drag.x;
      const dy = e.clientY - drag.y;
      if (Math.hypot(dx, dy) > 8) drag.moved = true;
      if (!drag.moved) return;
      /* v8 feel retained: lively but never twitchy */
      const th = clamp(drag.th - dx * 0.0068, -Math.PI * 4, Math.PI * 4);
      const ph = clamp(drag.ph - dy * 0.0055, 0.3, 2.55);
      anim.cam.theta = th;
      anim.cam.phi = ph;
      anim.goal.theta = th;
      anim.goal.phi = ph;
      kick();
    };

    const onUp = (e: PointerEvent) => {
      pointers.delete(e.pointerId);
      if (pointers.size < 2) pinchDist = 0;
      anim.dragging = pointers.size > 0;
      if (!drag) {
        kick();
        return;
      }
      const dt = performance.now() - drag.t;
      const tapped = !drag.moved && dt < 420;
      const isDouble = performance.now() - lastTap < 320;
      if (tapped) lastTap = performance.now();
      drag = null;
      kick();

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
      anim.userTouched = true;
      if (!anim.cam || !anim.goal) return;
      const r = clamp(anim.cam.radius * Math.exp(e.deltaY * 0.0011), 5, 58);
      anim.cam.radius = r;
      anim.goal.radius = r;
      kick();
    };

    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });

    /* ── flat print drawing — v19 night shift: bone strokes on
       the ink-black bench, hot signal for the active story ── */
    const INK = "236, 229, 220"; // bone
    const SIGNAL = "255, 82, 51"; // signal red

    const rgba = (rgb: string, a: number) => `rgba(${rgb}, ${a})`;

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

    function draw() {
      const cam = anim.cam;
      if (!cam) return;
      const { w, h } = anim;
      ctx.setTransform(anim.dpr, 0, 0, anim.dpr, 0, 0);

      /* backdrop */
      ctx.fillStyle = SCENE_BG;
      ctx.fillRect(0, 0, w, h);

      /* project — through the visible band, never the raw box:
         the caption and the ruler are plate furniture, and the
         figure must not print underneath either */
      const box = safeBox();
      const projs = new Map<string, Proj | null>();
      const order: { id: string; p: Proj; r: number }[] = [];
      anim.hit.length = 0;

      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const p = project(n.pos, cam, w, h, box); // no drift — the figure holds still
        projs.set(n.id, p);
        if (!p) continue;
        const base = (n.size ?? 0.9) * 0.5;
        const r = Math.max(3.2, Math.min(26, base * p.scale));
        order.push({ id: n.id, p, r });
      }
      order.sort((a, b) => b.p.depth - a.p.depth);

      /* edges — hairlines, solid signal for the active chapter */
      for (const e of edges) {
        const a = projs.get(e.source);
        const b = projs.get(e.target);
        if (!a || !b) continue;
        const active = anim.edgeSet.has(e.id);
        const touchSel = anim.selSeen === e.source || anim.selSeen === e.target;
        ctx.strokeStyle = active
          ? rgba(SIGNAL, 0.85)
          : touchSel
            ? rgba(INK, 0.5)
            : rgba(INK, 0.14);
        ctx.lineWidth = active ? 1.6 : touchSel ? 1.2 : 1;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }

      /* nodes — flat discs: filled when in focus, ghost outline
         when not. one arc, one stroke. no gradients anywhere. */
      for (const o of order) {
        const n = nodeById.get(o.id)!;
        const inFocus = anim.focusSet.size === 0 || anim.focusSet.has(n.id);
        const color = NODE_COLORS[n.kind];

        if (inFocus) {
          ctx.fillStyle = hexA(color, 0.96);
          ctx.beginPath();
          ctx.arc(o.p.x, o.p.y, o.r, 0, 6.2832);
          ctx.fill();
          ctx.strokeStyle = rgba(INK, 0.35);
          ctx.lineWidth = 1;
          ctx.stroke();
        } else {
          ctx.fillStyle = SCENE_BG;
          ctx.beginPath();
          ctx.arc(o.p.x, o.p.y, o.r, 0, 6.2832);
          ctx.fill();
          ctx.strokeStyle = hexA(color, 0.4);
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        /* selection — double blue ring */
        if (anim.selSeen === n.id) {
          ctx.strokeStyle = rgba(SIGNAL, 0.95);
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.arc(o.p.x, o.p.y, o.r + 5.5, 0, 6.2832);
          ctx.stroke();
          ctx.strokeStyle = rgba(SIGNAL, 0.35);
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(o.p.x, o.p.y, o.r + 10, 0, 6.2832);
          ctx.stroke();
        }

        anim.hit.push({ id: n.id, x: o.p.x, y: o.p.y, r: o.r });
      }

      /* labels — mono captions under the printed pins */
      const showAll = !anim.coarse;
      ctx.textAlign = "center";
      for (const o of order) {
        const n = nodeById.get(o.id)!;
        const inFocus = anim.focusSet.size === 0 || anim.focusSet.has(n.id);
        const want =
          anim.selSeen === n.id ||
          n.key ||
          (showAll && o.p.scale > 13) ||
          (inFocus && (anim.coarse ? o.r > 7 : o.p.scale > 9));
        if (!want) continue;
        const fs = Math.max(9, Math.min(12.5, o.r * 0.62 + 6));
        ctx.font = `500 ${fs}px "IBM Plex Mono", monospace`;
        ctx.fillStyle = rgba(INK, anim.selSeen === n.id ? 0.95 : inFocus ? 0.72 : 0.38);
        ctx.fillText(n.short, o.p.x, o.p.y + o.r + fs + 4);
      }
    }

    resize();
    syncStore();

    /* leave the desk → stop the loop for good */
    let prevView: string | null = useStore.getState().view;
    const unsubView = useStore.subscribe((s) => {
      if (s.view !== prevView) {
        prevView = s.view;
        if (s.view !== "desk") running = false;
      }
    });

    const onVis = () => {
      if (!document.hidden) kick();
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      unsub();
      unsubView();
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
      aria-label="Trace figure — drag to orbit, pinch to zoom, tap a node"
    />
  );
}

function clamp(v: number, a: number, b: number) {
  return Math.min(b, Math.max(a, v));
}
