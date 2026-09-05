"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { CASE } from "@/lib/case-data";
import { NODE_COLORS } from "@/lib/palette";
import { useStore } from "@/lib/store";
import { nodePositions, dragState, getGlowTexture, NODE_VERT, NODE_FRAG } from "./shared";

interface NodeEntry {
  id: string;
  base: THREE.Vector3;
  radius: number;
  color: THREE.Color;
  phase: number;
  amp: number;
  hasObserved: boolean;
  key: boolean;
}

export function Nodes() {
  const group = useRef<THREE.Group>(null);
  const ringSel = useRef<THREE.Mesh>(null);
  const ringHover = useRef<THREE.Mesh>(null);

  const entries = useMemo<NodeEntry[]>(() => {
    const incident = new Map<string, Set<string>>();
    for (const e of CASE.edges) {
      for (const [a, b, ep] of [
        [e.source, e.target, e.epistemic],
        [e.target, e.source, e.epistemic],
      ] as const) {
        if (!incident.has(a)) incident.set(a, new Set());
        incident.get(a)!.add(ep);
      }
    }
    return CASE.nodes.map((n, i) => ({
      id: n.id,
      base: new THREE.Vector3(...n.pos),
      radius: n.size ?? 0.8,
      color: new THREE.Color(NODE_COLORS[n.kind]),
      phase: i * 1.7,
      amp: 0.16 + (n.size ?? 0.8) * 0.12,
      hasObserved: incident.get(n.id)?.has("observed") ?? false,
      key: !!n.key,
    }));
  }, []);

  const mats = useRef<(THREE.ShaderMaterial | null)[]>([]);
  const glows = useRef<(THREE.Sprite | null)[]>([]);
  const cores = useRef<(THREE.Mesh | null)[]>([]);
  const meshes = useRef<(THREE.Mesh | null)[]>([]);

  const glowTexture = useMemo(() => getGlowTexture(), []);

  /* v2 — staged entrance: entities materialize one after another when
     the workspace opens, instead of all at once. respect, not noise:
     each node grows in over ~0.55s, offset by 45ms. */
  const spawn = useMemo(() => entries.map((_, i) => i * 0.045), [entries]);
  const elapsed = useRef(0);
  /* v2 — chapter pulse: when a chapter opens, its focus entities take
     one breath of extra light that decays in about a second. */
  const pulse = useRef({ chapter: -1, t: 1e3 });

  useEffect(() => {
    // prime positions before the first edges frame
    for (const en of entries) nodePositions.set(en.id, en.base.clone());
  }, [entries]);

  useEffect(() => {
    document.body.style.cursor = "auto";
    const unsub = useStore.subscribe((s) => {
      document.body.style.cursor = s.hoveredNodeId ? "pointer" : "auto";
    });
    return () => {
      unsub();
      document.body.style.cursor = "auto";
    };
  }, []);

  const focusSet = useMemo(() => new Set(CASE.chapters[0].focus), []);

  useFrame(({ clock, camera }, dt) => {
    const t = clock.elapsedTime;
    const { chapter, selectedNodeId, hoveredNodeId, factsOnly, introDismissed } = useStore.getState();
    const focus = introDismissed ? new Set(CASE.chapters[chapter].focus) : focusSet;
    const focusEmpty = focus.size === 0;
    const incidentSel = selectedNodeId
      ? new Set([selectedNodeId, ...CASE.edges.filter((e) => e.source === selectedNodeId || e.target === selectedNodeId).flatMap((e) => [e.source, e.target])])
      : null;

    /* v2 timers — spawn clock + chapter-pulse decay */
    elapsed.current += dt;
    if (introDismissed && pulse.current.chapter !== chapter) {
      pulse.current.chapter = chapter;
      pulse.current.t = 0;
    }
    pulse.current.t += dt;
    const pk = Math.exp(-pulse.current.t * 3.2); /* 1 → 0 in ~1s */

    for (let i = 0; i < entries.length; i++) {
      const en = entries[i];
      const mesh = meshes.current[i];
      const mat = mats.current[i];
      const glow = glows.current[i];
      const core = cores.current[i];
      if (!mesh || !mat || !glow || !core) continue;

      /* ambient drift */
      const p = mesh.position;
      p.set(
        en.base.x + Math.sin(t * 0.32 + en.phase) * en.amp,
        en.base.y + Math.sin(t * 0.26 + en.phase * 2.1) * en.amp * 0.7,
        en.base.z + Math.cos(t * 0.22 + en.phase * 0.7) * en.amp * 0.55,
      );
      nodePositions.set(en.id, p);

      /* state-driven opacity */
      let target = 0.95;
      if (!focusEmpty) target = focus.has(en.id) ? 1 : 0.3;
      if (incidentSel) target = incidentSel.has(en.id) ? 1 : 0.2;
      if (factsOnly && !en.hasObserved) target = Math.min(target, 0.26);
      if (en.id === hoveredNodeId) target = 1;
      /* v2 — fade in with the staged entrance */
      const sk = Math.min(1, Math.max(0, (elapsed.current - spawn[i]) / 0.55));
      const sIn = sk * sk * (3 - 2 * sk); /* smoothstep */
      target *= 0.04 + 0.96 * sIn;
      const u = mat.uniforms.uOpacity as { value: number };
      u.value += (target - u.value) * Math.min(1, dt * 7);
      (mat.uniforms.uTime as { value: number }).value = t;

      /* pulsing scale for key entities, hover/selected feedback */
      let scale = en.radius * (0.001 + 0.999 * sIn);
      if (en.key) scale *= 1 + 0.028 * Math.sin(t * 1.5 + en.phase);
      if (en.id === hoveredNodeId) scale *= 1.09;
      if (en.id === selectedNodeId) scale *= 1.14;
      /* v2 — one-time chapter pulse on this chapter's focus entities */
      if (!focusEmpty && focus.has(en.id)) scale *= 1 + 0.15 * pk;
      mesh.scale.setScalar(scale);

      const glowMat = glow.material as THREE.SpriteMaterial;
      const glowTarget =
        en.id === hoveredNodeId || en.id === selectedNodeId
          ? 0.34
          : !focusEmpty && focus.has(en.id)
            ? 0.24
            : incidentSel && incidentSel.has(en.id)
              ? 0.24
              : 0.09;
      /* v2 — halo flares briefly with the chapter pulse */
      const gt = glowTarget + (focusEmpty ? 0 : focus.has(en.id) ? 0.3 * pk : 0);
      glowMat.opacity += (gt - glowMat.opacity) * Math.min(1, dt * 7);
    }

    /* rings */
    const cam = camera;
    if (ringSel.current) {
      const vis = !!selectedNodeId && nodePositions.has(selectedNodeId);
      ringSel.current.visible = vis;
      if (vis && selectedNodeId) {
        const p = nodePositions.get(selectedNodeId)!;
        ringSel.current.position.copy(p);
        ringSel.current.quaternion.copy(cam.quaternion);
        const en = entries.find((e) => e.id === selectedNodeId);
        const s = (en?.radius ?? 1) * (1.7 + 0.05 * Math.sin(t * 2.2));
        ringSel.current.scale.setScalar(s);
      }
    }
    if (ringHover.current) {
      const vis = !!hoveredNodeId && hoveredNodeId !== selectedNodeId && nodePositions.has(hoveredNodeId);
      ringHover.current.visible = vis;
      if (vis && hoveredNodeId) {
        const p = nodePositions.get(hoveredNodeId)!;
        ringHover.current.position.copy(p);
        ringHover.current.quaternion.copy(cam.quaternion);
        const en = entries.find((e) => e.id === hoveredNodeId);
        ringHover.current.scale.setScalar((en?.radius ?? 1) * 1.55);
      }
    }
  });

  const onOver = (id: string) => (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    useStore.getState().hoverNode(id);
  };
  const onOut = (id: string) => (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (useStore.getState().hoveredNodeId === id) useStore.getState().hoverNode(null);
  };
  const onClick = (id: string) => (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (dragState.moved) return;
    useStore.getState().selectNode(id);
  };

  return (
    <group ref={group}>
      {entries.map((en, i) => (
        <group key={en.id}>
          <mesh
            ref={(m) => {
              meshes.current[i] = m;
            }}
            position={en.base}
            scale={en.radius}
            onPointerOver={onOver(en.id)}
            onPointerOut={onOut(en.id)}
            onClick={onClick(en.id)}
          >
            <sphereGeometry args={[1, 26, 26]} />
            <shaderMaterial
              ref={(m) => {
                mats.current[i] = m;
              }}
              vertexShader={NODE_VERT}
              fragmentShader={NODE_FRAG}
              transparent
              depthWrite={false}
              uniforms={{
                uColor: { value: en.color },
                uOpacity: { value: 0.95 },
                uTime: { value: 0 },
              }}
            />
          </mesh>
          {/* luminous nucleus */}
          <mesh
            ref={(m) => {
              cores.current[i] = m;
            }}
            position={en.base}
            scale={en.radius * 0.32}
          >
            <sphereGeometry args={[1, 12, 12]} />
            <meshBasicMaterial color={en.color} transparent opacity={0.85} blending={THREE.AdditiveBlending} depthWrite={false} />
          </mesh>
          {/* soft halo */}
          <sprite
            ref={(s) => {
              glows.current[i] = s;
            }}
            position={en.base}
            scale={en.radius * 3.9}
          >
            <spriteMaterial
              map={glowTexture}
              color={en.color}
              transparent
              opacity={0.09}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </sprite>
        </group>
      ))}

      {/* selection ring */}
      <mesh ref={ringSel} visible={false}>
        <ringGeometry args={[0.94, 1.0, 64]} />
        <meshBasicMaterial color="#e3b95c" transparent opacity={0.85} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      {/* hover ring */}
      <mesh ref={ringHover} visible={false}>
        <ringGeometry args={[0.965, 1.0, 48]} />
        <meshBasicMaterial color="#f2ead8" transparent opacity={0.4} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  );
}
