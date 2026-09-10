"use client";

import { useEffect, useRef } from "react";
import { TUNE, retune } from "@/lib/edition";

/* ── v15 HALFTONE FIELD — the page's living surface ──────────
   a plate of printed ink dots. move across it and the dots
   scatter like iron filings, then spring home. every few
   seconds a slow scan column passes: dots swell as it goes
   and a handful print in vermilion. quiet, tactile, cheap —
   one 2d canvas, no webgl, spring physics only. */

interface Dot {
  hx: number; // home
  hy: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  seed: number;
  signal: boolean; // prints in vermilion
}

const GAP = 15; // px between dots
const BASE_R = 1.15;

export default function HalftoneField({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    retune();
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let dpr = 1;
    let dots: Dot[] = [];
    let raf = 0;
    let running = true;

    const pointer = { x: -9999, y: -9999, active: false };

    const build = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (w === 0 || h === 0) return;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      dots = [];
      const cols = Math.ceil(w / GAP) + 1;
      const rows = Math.ceil(h / GAP) + 1;
      const ox = (w - (cols - 1) * GAP) / 2;
      const oy = (h - (rows - 1) * GAP) / 2;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const hx = ox + c * GAP + (r % 2 ? GAP / 2 : 0);
          const hy = oy + r * GAP;
          const seed = Math.random();
          dots.push({
            hx,
            hy,
            x: hx,
            y: hy,
            vx: 0,
            vy: 0,
            seed,
            signal: seed > 0.986,
          });
        }
      }
      // assign to outer scope
      size.w = w;
      size.h = h;
      size.dpr = dpr;
    };

    const size = { w: 0, h: 0, dpr: 1 };

    const ro = new ResizeObserver(build);
    ro.observe(canvas);
    build();

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
      pointer.active = true;
    };
    const onLeave = () => {
      pointer.active = false;
      pointer.x = -9999;
      pointer.y = -9999;
    };
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerdown", onMove);
    canvas.addEventListener("pointerleave", onLeave);

    let t0 = performance.now();
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (!running || document.hidden || size.w === 0) return;
      const dt = Math.min(0.05, (now - t0) / 1000);
      t0 = now;
      const t = now / 1000;

      const { w, h, dpr } = size;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      /* scan column — one slow pass every ~8s */
      const period = 8;
      const scanX = ((t % period) / period) * (w + 260) - 130;
      const scanW = 90;

      const pushR = TUNE.cloudPushRadius;
      const pushF = TUNE.cloudPushForce;

      for (const d of dots) {
        /* gentle idle wave — the plate breathes */
        const wave =
          0.75 +
          0.25 * Math.sin(d.hx * 0.012 + t * 0.7) * Math.cos(d.hy * 0.017 - t * 0.45);

        /* pointer scatter */
        if (pointer.active) {
          const dx = d.x - pointer.x;
          const dy = d.y - pointer.y;
          const dist = Math.hypot(dx, dy);
          if (dist < pushR && dist > 0.01) {
            const f = ((pushR - dist) / pushR) * pushF * 26;
            d.vx += (dx / dist) * f * dt * 60;
            d.vy += (dy / dist) * f * dt * 60;
          }
        }

        /* spring home */
        d.vx += (d.hx - d.x) * 0.055;
        d.vy += (d.hy - d.y) * 0.055;
        d.vx *= 0.86;
        d.vy *= 0.86;
        d.x += d.vx;
        d.y += d.vy;

        /* scan swell */
        const nearScan = Math.max(0, 1 - Math.abs(d.hx - scanX) / scanW);
        const r = (BASE_R + nearScan * 1.9) * wave;

        if (nearScan > 0.75 && d.seed > 0.72) {
          ctx.fillStyle = `rgba(212, 73, 31, ${0.5 + 0.4 * nearScan})`;
        } else if (d.signal) {
          ctx.fillStyle = "rgba(212, 73, 31, 0.85)";
        } else {
          ctx.fillStyle = `rgba(23, 21, 14, ${0.24 + 0.5 * wave * (0.5 + nearScan * 0.5)})`;
        }
        ctx.beginPath();
        ctx.arc(d.x, d.y, r, 0, 6.2832);
        ctx.fill();
      }
    };
    raf = requestAnimationFrame(frame);

    const onVis = () => {
      t0 = performance.now();
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerdown", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      className={className}
      style={{ touchAction: "none" }}
      aria-hidden
    />
  );
}
