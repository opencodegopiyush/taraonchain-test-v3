/* ── v15 SINGLE BUILD — one binary, auto-tuned at runtime ───
   the web/mobile split is gone: the app detects the device on
   mount and applies the matching tuning table in place. canvas
   engines read TUNE every frame, so they pick the change up
   live. same case file, same report, same colours — every
   device gets the pacing that suits it. */

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
  chip: "V15 · CLEAN ROOM",
  /* hero trail */
  heroBubbles: 20,
  heroTrailLen: 15,
  heroTrailAlpha: 0.38,
  heroConstellation: 132,
  heroPushRadius: 150,
  heroPushForce: 0.7,
  /* desk comet trails */
  deskTrailLen: 19,
  deskTrailAlpha: 0.52, // clearly visible on big screens
  deskTrailWidth: 0.72,
  /* desk idle motion */
  idleDelay: 3500, // ms before the scene starts breathing
  orbitSpeed: 0.016, // rad/s idle orbit — clearly alive
  driftAmp: 1.55, // organic bubble wander multiplier
  driftSpeed: 1.3,
  speed: 1.0,
  hoverFx: true,
  /* evidence cloud */
  cloudParticles: 2400,
  cloudPushRadius: 150,
  cloudPushForce: 0.55,
};

const MOBILE_TUNE: Tune = {
  chip: "V15 · CLEAN ROOM",
  heroBubbles: 13,
  heroTrailLen: 11,
  heroTrailAlpha: 0.55, // brighter — small screens need it
  heroConstellation: 118,
  heroPushRadius: 140,
  heroPushForce: 0.85, // finger scatter feels stronger
  deskTrailLen: 13,
  deskTrailAlpha: 0.46, // full brightness — never faint on a phone
  deskTrailWidth: 0.66,
  idleDelay: 12000, // phones keep the calm v6 feel
  orbitSpeed: 0.006,
  driftAmp: 1.0,
  driftSpeed: 1.0,
  speed: 0.85, // faster-feeling reveals on small screens
  hoverFx: false,
  /* evidence cloud */
  cloudParticles: 1400,
  cloudPushRadius: 140,
  cloudPushForce: 0.85, // finger scatter feels stronger
};

/* live tuning — mutated IN PLACE by retune() so per-frame
   readers (TraceCanvas, HalftoneField) always see current values.
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
