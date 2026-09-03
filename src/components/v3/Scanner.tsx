"use client";

import { useEffect, useRef } from "react";

/* ── the scanner — v3 landing strip ───────────────────────────
   a 2d canvas: lanes of value packets drifting left to right,
   the way raw mempool traffic feels. most packets are quiet bone
   dots; a few carry value (teal) and every so often one is
   flagged (amber) and burns a trail. tap anywhere on the strip
   to inject a burst of packets into the nearest lane.
   deliberately NOT three.js — light enough to run full-speed on
   any phone, and a different visual language from the 3d scenes. */

const BONE = "232, 228, 218";
const TEAL = "63, 207, 164";
const AMBER = "232, 163, 61";

type Packet = {
  lane: number;
  x: number;
  v: number; /* px/s */
  kind: 0 | 1 | 2; /* bone | value | flagged */
  trail: number; /* 0..1 trail energy */
};

export function Scanner({ height = 72 }: { height?: number }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let dpr = 1;
    let raf = 0;
    let running = true;
    const packets: Packet[] = [];
    const flashes: { lane: number; x: number; age: number }[] = [];
    let last = performance.now();

    const resize = () => {
      const r = wrap.getBoundingClientRect();
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = Math.max(1, Math.floor(r.width));
      h = Math.max(1, Math.floor(r.height));
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const laneY = (lane: number) => 8 + lane * 16 + 8;

    const spawn = (lane?: number, kind: Packet["kind"] = 0, fast = false) => {
      const l = lane ?? Math.floor(Math.random() * Math.max(1, Math.floor(h / 16)));
      packets.push({
        lane: l,
        x: -14,
        v: fast ? 150 + Math.random() * 90 : 16 + Math.random() * 26,
        kind,
        trail: kind === 2 ? 1 : 0,
      });
    };

    /* seed the traffic so it never starts empty */
    const seed = () => {
      packets.length = 0;
      const lanes = Math.max(2, Math.floor(h / 16));
      for (let i = 0; i < w / 9; i++) {
        spawn(Math.floor(Math.random() * lanes), Math.random() > 0.86 ? 1 : 0);
        const p = packets[packets.length - 1];
        p.x = Math.random() * w;
      }
    };

    const tick = (now: number) => {
      if (!running) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const lanes = Math.max(2, Math.floor(h / 16));

      /* ambient spawns */
      if (Math.random() < dt * 5) spawn(undefined, Math.random() > 0.82 ? 1 : 0);
      if (Math.random() < dt * 0.5) spawn(undefined, 2);

      ctx.clearRect(0, 0, w, h);

      /* lane hairlines */
      ctx.strokeStyle = `rgba(${BONE}, 0.05)`;
      ctx.lineWidth = 1;
      for (let l = 0; l < lanes; l++) {
        const y = laneY(l);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      /* lane flashes (tap feedback) */
      for (let i = flashes.length - 1; i >= 0; i--) {
        const f = flashes[i];
        f.age += dt;
        if (f.age > 0.9) {
          flashes.splice(i, 1);
          continue;
        }
        const k = 1 - f.age / 0.9;
        const y = laneY(f.lane);
        const grad = ctx.createLinearGradient(f.x - 140, 0, f.x + 60, 0);
        grad.addColorStop(0, `rgba(${AMBER}, 0)`);
        grad.addColorStop(1, `rgba(${AMBER}, ${0.22 * k})`);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(Math.max(0, f.x - 140), y);
        ctx.lineTo(Math.min(w, f.x + 60), y);
        ctx.stroke();
      }

      /* packets */
      for (let i = packets.length - 1; i >= 0; i--) {
        const p = packets[i];
        p.x += p.v * dt;
        if (p.x > w + 16) {
          packets.splice(i, 1);
          continue;
        }
        const y = laneY(p.lane);
        if (p.kind === 2) {
          /* flagged — amber with burning trail */
          p.trail = Math.max(0.25, p.trail - dt * 0.35);
          const grad = ctx.createLinearGradient(p.x - 90, 0, p.x, 0);
          grad.addColorStop(0, `rgba(${AMBER}, 0)`);
          grad.addColorStop(1, `rgba(${AMBER}, ${0.5 * p.trail})`);
          ctx.strokeStyle = grad;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(p.x - 90, y);
          ctx.lineTo(p.x, y);
          ctx.stroke();
          ctx.fillStyle = `rgba(${AMBER}, 0.95)`;
          ctx.fillRect(p.x - 2.5, y - 2.5, 5, 5);
        } else {
          const col = p.kind === 1 ? TEAL : BONE;
          const a = p.kind === 1 ? 0.75 : 0.34;
          ctx.fillStyle = `rgba(${col}, ${a})`;
          ctx.fillRect(p.x - 1.5, y - 1.5, 3, 3);
          if (p.kind === 1) {
            ctx.fillStyle = `rgba(${TEAL}, 0.12)`;
            ctx.fillRect(p.x - 5, y - 5, 10, 10);
          }
        }
      }
      raf = requestAnimationFrame(tick);
    };

    const onVis = () => {
      running = document.visibilityState === "visible";
      if (running) {
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
    };

    const onTap = (e: PointerEvent) => {
      const r = wrap.getBoundingClientRect();
      if (e.clientY < r.top || e.clientY > r.bottom) return;
      const lanes = Math.max(2, Math.floor(h / 16));
      const lane = Math.min(lanes - 1, Math.max(0, Math.floor((e.clientY - r.top) / 16)));
      flashes.push({ lane, x: e.clientX - r.left, age: 0 });
      for (let i = 0; i < 5; i++) spawn(lane, i === 0 ? 2 : Math.random() > 0.5 ? 1 : 0, true);
    };

    resize();
    seed();
    raf = requestAnimationFrame(tick);
    const ro = new ResizeObserver(() => {
      resize();
      seed();
    });
    ro.observe(wrap);
    document.addEventListener("visibilitychange", onVis);
    wrap.addEventListener("pointerdown", onTap);
    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      wrap.removeEventListener("pointerdown", onTap);
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      className="relative w-full cursor-crosshair overflow-hidden"
      style={{ height }}
      aria-hidden
    >
      <canvas ref={canvasRef} className="block" />
    </div>
  );
}
