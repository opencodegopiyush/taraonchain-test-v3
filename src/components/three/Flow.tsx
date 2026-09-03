"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { CASE } from "@/lib/case-data";
import { EPI_COLORS } from "@/lib/palette";
import { useStore } from "@/lib/store";
import { nodePositions } from "./shared";

const PARTICLE_VERT = /* glsl */ `
  attribute float aSize;
  attribute vec3 aColor;
  attribute float aFade;
  varying vec3 vColor;
  varying float vFade;
  uniform float uOpacity;
  void main() {
    vColor = aColor;
    vFade = aFade;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * (150.0 / max(1.0, -mv.z));
    gl_Position = projectionMatrix * mv;
  }
`;

const PARTICLE_FRAG = /* glsl */ `
  varying vec3 vColor;
  varying float vFade;
  uniform float uOpacity;
  void main() {
    float r = length(gl_PointCoord - vec2(0.5));
    float a = smoothstep(0.5, 0.06, r);
    float i = a * vFade * uOpacity;
    gl_FragColor = vec4(vColor * i, i);
  }
`;

interface FlowAlloc {
  edgeIdx: number[];
  offsets: number[];
  speeds: number[];
  count: number;
}

export function Flow() {
  const pointsRef = useRef<THREE.Points>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const activeEdges = useActiveEdgeList();
  const flowPaused = useStore((s) => s.flowPaused);
  const chapter = useStore((s) => s.chapter);

  /* v2 — value surge: opening a chapter pushes the flow a little
     harder for about a second, then it settles back to cruise. */
  const lastChapter = useRef(chapter);
  const surge = useRef(0);
  if (lastChapter.current !== chapter) {
    lastChapter.current = chapter;
    surge.current = 1;
  }

  const alloc = useMemo<FlowAlloc>(() => {
    const edgeIdx: number[] = [];
    const offsets: number[] = [];
    const speeds: number[] = [];
    activeEdges.forEach((_, i) => {
      const e = activeEdges[i];
      const n = Math.min(6, Math.max(2, Math.round(2 + e.value / 380)));
      for (let k = 0; k < n; k++) {
        edgeIdx.push(i);
        offsets.push((k + Math.random() * 0.5) / n);
        speeds.push(0.055 + Math.random() * 0.02);
      }
    });
    return { edgeIdx, offsets, speeds, count: edgeIdx.length };
  }, [activeEdges]);

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(alloc.count * 3), 3));
    const colors = new Float32Array(alloc.count * 3);
    const sizes = new Float32Array(alloc.count);
    const fades = new Float32Array(alloc.count);
    alloc.edgeIdx.forEach((ei, j) => {
      const c = new THREE.Color(EPI_COLORS[activeEdges[ei].epistemic]);
      colors[j * 3] = c.r;
      colors[j * 3 + 1] = c.g;
      colors[j * 3 + 2] = c.b;
      sizes[j] = 2.1 + Math.random() * 1.3;
      fades[j] = 0.85 + Math.random() * 0.15;
    });
    g.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
    g.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    g.setAttribute("aFade", new THREE.BufferAttribute(fades, 1));
    return g;
  }, [alloc, activeEdges]);

  useFrame(({ clock }, dt) => {
    if (!matRef.current) return;
    const uo = matRef.current.uniforms.uOpacity as { value: number };
    const target = flowPaused ? 0 : 1;
    uo.value += (target - uo.value) * 0.08;

    surge.current = Math.max(0, surge.current - dt * 0.85);
    const boost = 1 + surge.current * surge.current * 1.15; /* ease-out surge */

    const pos = geo.getAttribute("position") as THREE.BufferAttribute;
    const t = clock.elapsedTime;
    for (let j = 0; j < alloc.count; j++) {
      const e = activeEdges[alloc.edgeIdx[j]];
      const a = nodePositions.get(e.source);
      const b = nodePositions.get(e.target);
      if (!a || !b) continue;
      const s = flowPaused ? 0 : alloc.speeds[j] * boost;
      const f = (t * s + alloc.offsets[j]) % 1;
      /* ease so particles decelerate into the target node */
      const fe = f < 0.5 ? 2 * f * f : 1 - Math.pow(-2 * f + 2, 2) / 2;
      pos.setXYZ(j, a.x + (b.x - a.x) * fe, a.y + (b.y - a.y) * fe, a.z + (b.z - a.z) * fe);
    }
    pos.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} geometry={geo} frustumCulled={false}>
      <shaderMaterial
        ref={matRef}
        vertexShader={PARTICLE_VERT}
        fragmentShader={PARTICLE_FRAG}
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        uniforms={{ uOpacity: { value: 1 } }}
      />
    </points>
  );
}

/* ── ambient dust field ── */

const DUST_VERT = /* glsl */ `
  attribute float aSize;
  attribute float aAlpha;
  varying float vAlpha;
  void main() {
    vAlpha = aAlpha;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * (120.0 / max(1.0, -mv.z));
    gl_Position = projectionMatrix * mv;
  }
`;

const DUST_FRAG = /* glsl */ `
  varying float vAlpha;
  void main() {
    float r = length(gl_PointCoord - vec2(0.5));
    float a = smoothstep(0.5, 0.1, r);
    gl_FragColor = vec4(vec3(0.42, 0.5, 0.47) * a * vAlpha, a * vAlpha);
  }
`;

export function Dust() {
  const ref = useRef<THREE.Points>(null);
  const geo = useMemo(() => {
    const N = 420;
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(N * 3);
    const sizes = new Float32Array(N);
    const alphas = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 130;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 56 + 4;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 80 - 6;
      sizes[i] = 0.7 + Math.random() * 1.4;
      alphas[i] = 0.1 + Math.random() * 0.3;
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    g.setAttribute("aAlpha", new THREE.BufferAttribute(alphas, 1));
    return g;
  }, []);

  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.y = clock.elapsedTime * 0.004;
  });

  return (
    <points ref={ref} geometry={geo} frustumCulled={false}>
      <shaderMaterial
        vertexShader={DUST_VERT}
        fragmentShader={DUST_FRAG}
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

/* reactive active-edge list — mirrors the logic in Edges.tsx */
function useActiveEdgeList(): typeof CASE.edges {
  const chapter = useStore((s) => s.chapter);
  const selectedNodeId = useStore((s) => s.selectedNodeId);
  const introDismissed = useStore((s) => s.introDismissed);
  return useMemo(() => {
    if (selectedNodeId) {
      return CASE.edges.filter((e) => e.source === selectedNodeId || e.target === selectedNodeId);
    }
    if (!introDismissed) return [];
    const ch = CASE.chapters[chapter];
    const set = new Map(ch.edges.map((id) => [id, true]));
    return CASE.edges.filter((e) => set.has(e.id));
  }, [chapter, selectedNodeId, introDismissed]);
}
