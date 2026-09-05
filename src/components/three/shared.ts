import * as THREE from "three";

/* shared mutable state for the 3d scene (module singletons, client-only) */

/** live positions of every node, written by Nodes each frame, read by
    edges / particles / labels — avoids re-rendering the scene graph */
export const nodePositions = new Map<string, THREE.Vector3>();

/** drag bookkeeping shared between the camera rig and picking handlers */
export const dragState = { down: false, moved: false, x: 0, y: 0 };

let glowTex: THREE.Texture | null = null;
export function getGlowTexture(): THREE.Texture {
  if (glowTex) return glowTex;
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(255,255,255,0.85)");
  g.addColorStop(0.22, "rgba(255,255,255,0.28)");
  g.addColorStop(0.55, "rgba(255,255,255,0.06)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  glowTex = new THREE.CanvasTexture(canvas);
  return glowTex;
}

export const NODE_VERT = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

export const NODE_FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    float fres = pow(1.0 - abs(dot(normalize(vNormal), normalize(vView))), 2.4);
    vec3 col = uColor * 0.15 + uColor * fres * 1.08;
    col += uColor * 0.045 * (0.5 + 0.5 * sin(vNormal.y * 16.0 + uTime * 0.6));
    float a = (0.10 + fres * 0.92) * uOpacity;
    gl_FragColor = vec4(col, a);
  }
`;

export const easeInOutCubic = (x: number) =>
  x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;

export const damp = (cur: number, goal: number, lambda: number, dt: number) =>
  THREE.MathUtils.lerp(cur, goal, 1 - Math.exp(-lambda * dt));
