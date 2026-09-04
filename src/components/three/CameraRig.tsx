"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { useStore, rigBus, type CameraCommand } from "@/lib/store";
import { CASE } from "@/lib/case-data";
import { nodePositions, dragState, easeInOutCubic, damp } from "./shared";

const MIN_PHI = 0.3;
const MAX_PHI = 1.52;
const MIN_R = 7;
const MAX_R = 72;

interface SphericalState {
  target: THREE.Vector3;
  theta: number;
  phi: number;
  radius: number;
}

export function CameraRig() {
  const camera = useThree((s) => s.camera);
  const gl = useThree((s) => s.gl);
  const size = useThree((s) => s.size);

  /* portrait / squarish viewports need a wider framing */
  const frameMult =
    size.width / Math.max(1, size.height) < 0.9
      ? 1.5
      : size.width / Math.max(1, size.height) < 1.3
        ? 1.18
        : 1;

  const initSpherical = (): SphericalState => ({
    target: new THREE.Vector3(-2, 1, -1),
    theta: 1.05,
    phi: 1.04,
    radius: 68,
  });
  const cur = useRef<SphericalState>(initSpherical());
  const goal = useRef<SphericalState>(initSpherical());
  const tween = useRef<{ from: SphericalState; to: SphericalState; start: number; dur: number } | null>(null);
  const lastInteract = useRef(0);
  const camCmd = useStore((s) => s.camera);
  const introDismissed = useStore((s) => s.introDismissed);

  /* chapter / intro camera commands */
  useEffect(() => {
    if (!camCmd || camCmd.seq === 0) return;
    const from = { ...cur.current, target: cur.current.target.clone() };
    const to: SphericalState = {
      target: new THREE.Vector3(...camCmd.target),
      theta: camCmd.theta,
      phi: camCmd.phi,
      radius: Math.min(84, camCmd.radius * frameMult),
    };
    /* take the short way around */
    to.theta = from.theta + shortestAngle(from.theta, to.theta);
    tween.current = { from, to, start: performance.now() / 1000, dur: camCmd.duration / 1000 };
    lastInteract.current = performance.now() / 1000;
  }, [camCmd, frameMult]);

  /* imperative orbit / zoom / refocus via rig bus */
  useEffect(() => {
    const listener = (e: { type: string; dTheta?: number; dPhi?: number; factor?: number; nodeId?: string; radius?: number }) => {
      lastInteract.current = performance.now() / 1000;
      tween.current = null;
      if (e.type === "orbit") {
        goal.current.theta += e.dTheta ?? 0;
        goal.current.phi = THREE.MathUtils.clamp(goal.current.phi + (e.dPhi ?? 0), MIN_PHI, MAX_PHI);
      } else if (e.type === "zoom") {
        goal.current.radius = THREE.MathUtils.clamp(goal.current.radius * (e.factor ?? 1), MIN_R, MAX_R);
      } else if (e.type === "refocus" && e.nodeId) {
        const p = nodePositions.get(e.nodeId);
        if (p) {
          const from = { ...cur.current, target: cur.current.target.clone() };
          const to: SphericalState = {
            target: p.clone(),
            theta: cur.current.theta,
            phi: cur.current.phi,
            radius: e.radius ?? Math.min(cur.current.radius, 14),
          };
          tween.current = { from, to, start: performance.now() / 1000, dur: 1.4 };
        }
      }
    };
    rigBus.listeners.add(listener);
    return () => {
      rigBus.listeners.delete(listener);
    };
  }, []);

  /* pointer + wheel controls */
  useEffect(() => {
    const el = gl.domElement;
    const pointers = new Map<number, { x: number; y: number }>();
    let pinchDist = 0;

    const onDown = (e: PointerEvent) => {
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      dragState.down = true;
      dragState.moved = false;
      dragState.x = e.clientX;
      dragState.y = e.clientY;
      tween.current = null;
      lastInteract.current = performance.now() / 1000;
      el.setPointerCapture?.(e.pointerId);
    };

    const onMove = (e: PointerEvent) => {
      if (!pointers.has(e.pointerId)) return;
      const prev = pointers.get(e.pointerId)!;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (pointers.size === 2) {
        const pts = [...pointers.values()];
        const d = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        if (pinchDist > 0) {
          goal.current.radius = THREE.MathUtils.clamp(goal.current.radius * (pinchDist / Math.max(1, d)), MIN_R, MAX_R);
        }
        pinchDist = d;
        dragState.moved = true;
        return;
      }

      const dx = e.clientX - prev.x;
      const dy = e.clientY - prev.y;
      if (Math.abs(e.clientX - dragState.x) + Math.abs(e.clientY - dragState.y) > 6) dragState.moved = true;
      if (dragState.moved && dragState.down) {
        goal.current.theta -= dx * 0.0042;
        goal.current.phi = THREE.MathUtils.clamp(goal.current.phi - dy * 0.0042, MIN_PHI, MAX_PHI);
        lastInteract.current = performance.now() / 1000;
      }
    };

    const onUp = (e: PointerEvent) => {
      pointers.delete(e.pointerId);
      if (pointers.size < 2) pinchDist = 0;
      if (pointers.size === 0) dragState.down = false;
      setTimeout(() => {
        if (!dragState.down) dragState.moved = false;
      }, 60);
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      tween.current = null;
      goal.current.radius = THREE.MathUtils.clamp(goal.current.radius * (1 + e.deltaY * 0.0011), MIN_R, MAX_R);
      lastInteract.current = performance.now() / 1000;
    };

    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      el.removeEventListener("wheel", onWheel);
    };
  }, [gl]);

  /* intro idle drift */
  useEffect(() => {
    if (introDismissed) return;
    const id = setInterval(() => {
      if (!useStore.getState().introDismissed) goal.current.theta += 0.0022;
    }, 32);
    return () => clearInterval(id);
  }, [introDismissed]);

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const now = performance.now() / 1000;

    if (tween.current) {
      const { from, to, start, dur } = tween.current;
      const s = easeInOutCubic(Math.min(1, (now - start) / dur));
      cur.current.target.lerpVectors(from.target, to.target, s);
      cur.current.theta = THREE.MathUtils.lerp(from.theta, to.theta, s);
      cur.current.phi = THREE.MathUtils.lerp(from.phi, to.phi, s);
      cur.current.radius = THREE.MathUtils.lerp(from.radius, to.radius, s);
      if (s >= 1) {
        tween.current = null;
        goal.current = { target: to.target.clone(), theta: to.theta, phi: to.phi, radius: to.radius };
      }
    } else {
      /* gentle cinematic drift when idle */
      if (introDismissed && now - lastInteract.current > 6) goal.current.theta += dt * 0.0075;
      const k = 5.5;
      cur.current.target.x = damp(cur.current.target.x, goal.current.target.x, k, dt);
      cur.current.target.y = damp(cur.current.target.y, goal.current.target.y, k, dt);
      cur.current.target.z = damp(cur.current.target.z, goal.current.target.z, k, dt);
      cur.current.theta = damp(cur.current.theta, goal.current.theta, k, dt);
      cur.current.phi = damp(cur.current.phi, goal.current.phi, k, dt);
      cur.current.radius = damp(cur.current.radius, goal.current.radius, k, dt);
    }

    const { target, theta, phi, radius } = cur.current;
    const sp = Math.sin(phi);
    camera.position.set(
      target.x + radius * sp * Math.cos(theta),
      target.y + radius * Math.cos(phi),
      target.z + radius * sp * Math.sin(theta),
    );
    camera.lookAt(target);
  });

  return null;
}

function shortestAngle(from: number, to: number): number {
  let d = (to - from) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}
