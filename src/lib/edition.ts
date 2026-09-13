/* ── v19 "NIGHT SHIFT" SINGLE BUILD — one binary, auto-tuned ──────
   v16's law: the graph moves only when YOU move it. the
   tuning tables keep their shape (the engine still reads
   them) but every idle-animation knob is pinned to zero:
   no drift, no orbit, no comet trails. rendering is
   on-demand — a settled graph costs literally nothing. */

import { useEffect, useState } from "react";

export type DeviceClass = "desktop" | "mobile";

export type Tune = {
  chip: string;
  /* hero trail */
  heroBubbles: number;
  heroTrailLen: number;
  heroTrailAlpha: number;
  heroConstellation: number;
  heroPushRadius: number;
  heroPushForce: number;
  /* desk comet trails */
  deskTrailLen: number;
  deskTrailAlpha: number;
  deskTrailWidth: number;
  /* desk idle motion — comets need movement to exist */
  idleDelay: number;
  orbitSpeed: number;
  driftAmp: number;
  driftSpeed: number;
  /* motion */
  speed: number;
  hoverFx: boolean;
  /* evidence cloud band (v11) */
  cloudParticles: number;
  cloudPushRadius: number;
  cloudPushForce: number;
};

const DESKTOP_TUNE: Tune = {
  chip: "ZERO TELEMETRY",
  /* hero trail — retired, landing carries no canvas */
  heroBubbles: 0,
  heroTrailLen: 0,
  heroTrailAlpha: 0,
  heroConstellation: 0,
  heroPushRadius: 0,
  heroPushForce: 0,
  /* desk comet trails — retired by the motion budget */
  deskTrailLen: 0,
  deskTrailAlpha: 0,
  deskTrailWidth: 0,
  /* desk idle motion — pinned: the figure holds still */
  idleDelay: 2147483647, // never
  orbitSpeed: 0,
  driftAmp: 0,
  driftSpeed: 0,
  speed: 1.0,
  hoverFx: true,
  /* evidence cloud — retired */
  cloudParticles: 0,
  cloudPushRadius: 0,
  cloudPushForce: 0,
};

const MOBILE_TUNE: Tune = {
  chip: "ZERO TELEMETRY",
  heroBubbles: 0,
  heroTrailLen: 0,
  heroTrailAlpha: 0,
  heroConstellation: 0,
  heroPushRadius: 0,
  heroPushForce: 0,
  deskTrailLen: 0,
  deskTrailAlpha: 0,
  deskTrailWidth: 0,
  idleDelay: 2147483647, // never
  orbitSpeed: 0,
  driftAmp: 0,
  driftSpeed: 0,
  speed: 1.0,
  hoverFx: false,
  /* evidence cloud — retired */
  cloudParticles: 0,
  cloudPushRadius: 0,
  cloudPushForce: 0,
};

/* live tuning — mutated IN PLACE by retune() so per-frame
   readers (TraceCanvas) always see current values.
   server + first client render = desktop defaults. */
export const TUNE: Tune = { ...DESKTOP_TUNE };

/* coarse pointer, or touch on a small screen, or a mobile
   UA (belt-and-braces for odd webviews) → mobile tuning.
   a desktop with a touchscreen stays desktop. */
export function detectDevice(): DeviceClass {
  if (typeof window === "undefined") return "desktop";
  const coarse = window.matchMedia?.("(pointer: coarse)").matches ?? false;
  const touch = (navigator.maxTouchPoints ?? 0) > 0;
  const narrow = Math.min(window.innerWidth, window.innerHeight) <= 480;
  const uaMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  return coarse || (touch && narrow) || uaMobile ? "mobile" : "desktop";
}

/* apply the tuning for the detected device, in place. */
export function retune(): DeviceClass {
  const d = detectDevice();
  Object.assign(TUNE, d === "mobile" ? MOBILE_TUNE : DESKTOP_TUNE);
  return d;
}

/* react hook — flips hover-dependent UI after mount (and if the
   pointer class ever changes, e.g. a docked tablet). */
export function useDevice(): DeviceClass {
  const [d, setD] = useState<DeviceClass>("desktop");
  useEffect(() => {
    setD(retune());
    const mq = window.matchMedia("(pointer: coarse)");
    const onChange = () => setD(retune());
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);
  return d;
}
