"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { getGlowTexture, damp } from "./shared";

/* ── the landing scene — "follow the chain" ────────────────────
   a forged chain-link ribbon sweeping through the dark, value
   pulses travelling its length. drag to orbit (desktop mouse or
   touch — vertical touch still scrolls the page), tap a link to
   fire a value burst along the chain, flick for momentum, and
   the camera recedes as you scroll down into the case files.
   deliberately NOT the transaction graph: different geometry,
   different mood, its own interaction.                            */

const AMBER = new THREE.Color("#a78bfa");
const TEAL = new THREE.Color("#53d6ee");
const BONE = new THREE.Color("#e6eaf4");

/* scroll coupling — the landing overlay publishes its progress
   (0 at the hero, 1 deep in the case files) via a DOM event */
const scrollState = { p: 0 };

/* drag sway — the whole chain leans with your drag and eases back */
const swayState = { v: 0 };

/* hover state — desktop mouse position in ndc, for the reticle */
const hoverState = { ndc: new THREE.Vector2(), active: false };

/* v2 test build — forced mobile-friendly. a phone has no hover and no
   cursor, so the scene must stay alive on its own: periodic ambient
   value pulses fire from random links whether or not anyone touches
   the screen. desktop gets the same life, slower and rarer. */
const IS_TOUCH =
  typeof window !== "undefined" &&
  ("ontouchstart" in window || (navigator.maxTouchPoints ?? 0) > 0);
const ambient = { next: 2.4 };

function useChainCurve() {
  return useMemo(
    () =>
      new THREE.CatmullRomCurve3(
        [
          new THREE.Vector3(-34, -9, -6),
          new THREE.Vector3(-20, -3, 4),
          new THREE.Vector3(-7, 2, -5),
          new THREE.Vector3(4, 6.5, 3),
          new THREE.Vector3(15, 3, -4),
          new THREE.Vector3(26, -2.5, 2),
          new THREE.Vector3(36, 3, -2),
        ],
        false,
        "catmullrom",
        0.6,
      ),
    [],
  );
}

/* the chain itself — alternating torus links riding the curve */
function ChainLinks({ curve, count }: { curve: THREE.CatmullRomCurve3; count: number }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const group = useRef<THREE.Group>(null);

  const links = useMemo(() => {
    const out: { pos: THREE.Vector3; quat: THREE.Quaternion; hot: boolean; phase: number }[] = [];
    for (let i = 0; i < count; i++) {
      const t = i / count;
      const pos = curve.getPointAt(t);
      const tan = curve.getTangentAt(t);
      const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), tan);
      const roll = new THREE.Quaternion().setFromAxisAngle(tan, (i % 2) * Math.PI * 0.5);
      quat.multiply(roll);
      out.push({ pos, quat, hot: i % 17 === 3, phase: i * 0.7 });
    }
    return out;
  }, [curve, count]);

  const steel = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#232a27",
        metalness: 0.72,
        roughness: 0.34,
        emissive: new THREE.Color("#101513"),
      }),
    [],
  );
  const hotMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#2a2318",
        metalness: 0.6,
        roughness: 0.3,
        emissive: AMBER,
        emissiveIntensity: 0.55,
      }),
    [],
  );

  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime;
    const m = mesh.current;
    if (!m) return;
    /* age the ripples */
    for (const w of wavePool) {
      if (!w.active) continue;
      w.age += dt;
      if (w.age > WAVE_LIFE) w.active = false;
    }
    const dummy = new THREE.Object3D();
    for (let i = 0; i < links.length; i++) {
      const l = links[i];
      dummy.position.copy(l.pos);
      dummy.quaternion.copy(l.quat);
      const breathe = 1 + Math.sin(t * 0.9 + l.phase) * 0.035;
      /* ripple swell — gaussian bump where each wave front passes */
      let swell = 0;
      for (const w of wavePool) {
        if (!w.active) continue;
        let d = Math.abs(i / links.length - w.t0);
        if (d > 0.5) d = 1 - d;
        const front = w.age * WAVE_SPEED;
        const g = Math.exp(-((d - front) * (d - front)) / (2 * WAVE_SIGMA * WAVE_SIGMA));
        swell += g * (1 - w.age / WAVE_LIFE);
      }
      const s = breathe * (1 + swell * 0.55);
      dummy.scale.setScalar(s);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
    if (group.current) {
      group.current.rotation.y = Math.sin(t * 0.05) * 0.06 + swayState.v;
      swayState.v = damp(swayState.v, 0, 1.8, dt);
      /* slow vertical drift — the whole chain breathes (v2) */
      group.current.position.y = Math.sin(t * 0.16) * 0.55;
    }
  });

  return (
    <group ref={group}>
      <instancedMesh ref={mesh} args={[undefined, undefined, count]} material={steel}>
        <torusGeometry args={[0.62, 0.17, 14, 40]} />
      </instancedMesh>
      {/* a few hot links in amber — every 17th link carries value */}
      {links.map((l, i) =>
        l.hot ? (
          <mesh key={i} position={l.pos} quaternion={l.quat} material={hotMat}>
            <torusGeometry args={[0.62, 0.17, 14, 40]} />
          </mesh>
        ) : null,
      )}
    </group>
  );
}

/* value pulses travelling the chain */
function FlowPulses({ curve, count }: { curve: THREE.CatmullRomCurve3; count: number }) {
  const tex = useMemo(() => getGlowTexture(), []);
  const refs = useRef<(THREE.Sprite | null)[]>([]);
  const seeds = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        speed: 0.014 + Math.random() * 0.02,
        offset: i / count + Math.random() * 0.04,
        scale: 1.6 + Math.random() * 2.6,
        amber: Math.random() > 0.45,
      })),
    [count],
  );

  useFrame((_, dt) => {
    seeds.forEach((s, i) => {
      const sp = refs.current[i];
      if (!sp) return;
      s.offset = (s.offset + s.speed * dt) % 1;
      sp.position.copy(curve.getPointAt(s.offset));
    });
  });

  return (
    <>
      {seeds.map((s, i) => (
        <sprite
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          scale={s.scale}
        >
          <spriteMaterial
            map={tex}
            color={s.amber ? AMBER : TEAL}
            transparent
            opacity={0.85}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </sprite>
      ))}
    </>
  );
}

/* tap bursts — a tap anywhere near the chain fires bright value
   pulses that race along it from the nearest link, and sends a
   physical ripple wave through the links themselves. the pools
   live at module level: the landing scene is a singleton, and the
   slots are mutated every frame by design. */
type Burst = { t: number; speed: number; life: number; scale: number; active: boolean };
const BURST_SLOTS = 8;
const burstPool: Burst[] = Array.from({ length: BURST_SLOTS }, () => ({
  t: 0,
  speed: 0.12,
  life: 0,
  scale: 2.2,
  active: false,
}));

/* ripple waves — impact rings that travel the chain from the link
   you touched; ChainLinks reads this pool to swell the steel */
type Wave = { t0: number; age: number; active: boolean };
const WAVE_SLOTS = 4;
const wavePool: Wave[] = Array.from({ length: WAVE_SLOTS }, () => ({
  t0: 0,
  age: 0,
  active: false,
}));
const WAVE_SPEED = 0.42; /* curve-lengths per second — slightly snappier in v2 */
const WAVE_SIGMA = 0.05;
const WAVE_LIFE = 2.4;

/* ambient life — the landing never sits still, even untouched.
   every few seconds a value pulse races the chain and a physical
   ripple swells the links. more frequent on touch devices. */
function AmbientLife() {
  useFrame((_, dt) => {
    ambient.next -= dt;
    if (ambient.next > 0) return;
    ambient.next = IS_TOUCH ? 5 + Math.random() * 2.5 : 7.5 + Math.random() * 4;
    spawnBurst(Math.random());
    if (IS_TOUCH && Math.random() > 0.55) spawnBurst(Math.random());
  });
  return null;
}

function spawnBurst(t: number) {
  let made = 0;
  for (const b of burstPool) {
    if (b.active) continue;
    b.active = true;
    b.t = (t - made * 0.014 + 1) % 1;
    b.speed = 0.12 + made * 0.045;
    b.life = 1.6 + made * 0.25;
    b.scale = 2.6 - made * 0.6;
    made++;
    if (made >= 3) break;
  }
  /* the chain itself reacts — one ripple per tap */
  for (const w of wavePool) {
    if (w.active) continue;
    w.active = true;
    w.t0 = t;
    w.age = 0;
    break;
  }
}

function Bursts({ curve }: { curve: THREE.CatmullRomCurve3 }) {
  const tex = useMemo(() => getGlowTexture(), []);
  const refs = useRef<(THREE.Sprite | null)[]>([]);
  const mats = useRef<(THREE.SpriteMaterial | null)[]>([]);

  useFrame((_, dt) => {
    for (let i = 0; i < burstPool.length; i++) {
      const b = burstPool[i];
      const sp = refs.current[i];
      const mat = mats.current[i];
      if (!sp || !mat) continue;
      if (!b.active) {
        if (mat.opacity !== 0) mat.opacity = 0;
        continue;
      }
      b.t = (b.t + b.speed * dt) % 1;
      b.life -= dt;
      if (b.life <= 0) {
        b.active = false;
        mat.opacity = 0;
        continue;
      }
      sp.position.copy(curve.getPointAt(b.t));
      const k = Math.min(1, b.life / 1.2);
      mat.opacity = 0.95 * k;
      const s = b.scale * (1.3 - 0.4 * k);
      sp.scale.set(s, s, 1);
    }
  });

  return (
    <>
      {burstPool.map((_, i) => (
        <sprite
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          scale={0.001}
        >
          <spriteMaterial
            ref={(el) => {
              mats.current[i] = el;
            }}
            map={tex}
            color={i % 2 === 0 ? TEAL : AMBER}
            transparent
            opacity={0}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </sprite>
      ))}
    </>
  );
}

/* fine particle stream hugging the curve */
function Stream({ curve, count }: { curve: THREE.CatmullRomCurve3; count: number }) {
  const points = useRef<THREE.Points>(null);
  const tex = useMemo(() => getGlowTexture(), []);

  const geo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    return geo;
  }, [count]);

  const data = useRef(
    Array.from({ length: count }, () => ({
      t: Math.random(),
      speed: 0.008 + Math.random() * 0.025,
      off: new THREE.Vector3((Math.random() - 0.5) * 1.6, (Math.random() - 0.5) * 1.6, (Math.random() - 0.5) * 1.6),
    })),
  );

  useFrame((_, dt) => {
    const attr = geo.getAttribute("position") as THREE.BufferAttribute;
    for (let i = 0; i < data.current.length; i++) {
      const d = data.current[i];
      d.t = (d.t + d.speed * dt) % 1;
      const p = curve.getPointAt(d.t).add(d.off);
      attr.setXYZ(i, p.x, p.y, p.z);
    }
    attr.needsUpdate = true;
  });

  return (
    <points ref={points} geometry={geo}>
      <pointsMaterial
        map={tex}
        color={BONE}
        size={0.34}
        transparent
        opacity={0.5}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}

function Dust({ count }: { count: number }) {
  const tex = useMemo(() => getGlowTexture(), []);
  const geo = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 130;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 70;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 90;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [count]);
  return (
    <points geometry={geo}>
      <pointsMaterial map={tex} color="#5a615c" size={0.5} transparent opacity={0.32} depthWrite={false} sizeAttenuation />
    </points>
  );
}

/* cursor reticle — desktop only. a thin amber ring snaps to the
   chain link nearest the mouse and swells gently; the chain feels
   grabbable before you ever click. */
function Reticle({ curve }: { curve: THREE.CatmullRomCurve3 }) {
  const tex = useMemo(() => getGlowTexture(), []);
  const group = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Sprite>(null);
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const { camera } = useThree();
  const op = useRef(0);
  const zAxis = useMemo(() => new THREE.Vector3(0, 0, 1), []);

  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    let target = 0;
    if (hoverState.active) {
      raycaster.setFromCamera(hoverState.ndc, camera);
      let bestT = 0.5;
      let bestD = Infinity;
      for (let i = 0; i <= 160; i++) {
        const t = i / 160;
        const d = raycaster.ray.distanceToPoint(curve.getPointAt(t));
        if (d < bestD) {
          bestD = d;
          bestT = t;
        }
      }
      if (bestD < 7) {
        target = 1 - bestD / 7;
        g.position.copy(curve.getPointAt(bestT));
        g.quaternion.setFromUnitVectors(zAxis, curve.getTangentAt(bestT));
      }
    }
    op.current = damp(op.current, target, 8, dt);
    const mat = ringRef.current?.material as THREE.MeshBasicMaterial | undefined;
    if (mat) mat.opacity = op.current * 0.9;
    const gm = glowRef.current?.material as THREE.SpriteMaterial | undefined;
    if (gm) gm.opacity = op.current * 0.45;
    g.visible = op.current > 0.01;
    document.body.style.cursor = op.current > 0.4 ? "pointer" : "";
    if (g.visible) {
      const s = 1 + Math.sin(performance.now() / 310) * 0.08;
      ringRef.current?.scale.setScalar(s);
    }
  });

  return (
    <group ref={group} visible={false}>
      <mesh ref={ringRef}>
        <ringGeometry args={[0.84, 0.96, 40]} />
        <meshBasicMaterial
          color={AMBER}
          transparent
          opacity={0}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <sprite ref={glowRef} scale={1.5}>
        <spriteMaterial
          map={tex}
          color={AMBER}
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </sprite>
    </group>
  );
}

/* orbit rig — drag anywhere (except interactive elements) to rotate;
   idle drift when untouched; flick for momentum; tap fires a burst;
   touch: horizontal swipes orbit, vertical swipes scroll the page
   natively (pan-y). the camera recedes slightly as the visitor
   scrolls into the case files. */
function OrbitRig({
  children,
  curve,
  onTap,
}: {
  children: React.ReactNode;
  curve: THREE.CatmullRomCurve3;
  onTap: (t: number) => void;
}) {
  const { camera: cam } = useThree();
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const state = useRef({
    down: false,
    moved: false,
    x: 0,
    y: 0,
    vx: 0,
    theta: 0.16,
    phi: 0.06,
    tTheta: 0.16,
    tPhi: 0.06,
  });

  useEffect(() => {
    const s = state.current;
    const interactive = (t: EventTarget | null) =>
      t instanceof Element && !!t.closest("a, button, input, textarea, select, [role=\"button\"]");
    const onDown = (e: PointerEvent) => {
      if (interactive(e.target)) return;
      s.down = true;
      s.moved = false;
      s.vx = 0;
      s.x = e.clientX;
      s.y = e.clientY;
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "mouse") {
        hoverState.ndc.set(
          (e.clientX / window.innerWidth) * 2 - 1,
          -(e.clientY / window.innerHeight) * 2 + 1,
        );
        hoverState.active = true;
      }
      if (!s.down) return;
      const dx = e.clientX - s.x;
      const dy = e.clientY - s.y;
      if (Math.abs(dx) + Math.abs(dy) > 3) s.moved = true;
      s.x = e.clientX;
      s.y = e.clientY;
      s.vx = dx;
      /* touch orbits a touch more responsively than the mouse (v2) */
      s.tTheta += dx * (e.pointerType === "mouse" ? 0.0042 : 0.0062);
      swayState.v = THREE.MathUtils.clamp(dx * 0.0012, -0.06, 0.06);
      if (e.pointerType === "mouse") s.tPhi = THREE.MathUtils.clamp(s.tPhi + dy * 0.0028, -0.42, 0.42);
    };
    const onUp = (e: PointerEvent) => {
      if (!s.down) return;
      s.down = false;
      if (s.moved) {
        /* flick — leftover velocity keeps the orbit going, eased out by damping */
        s.tTheta += THREE.MathUtils.clamp(s.vx * 0.05, -0.85, 0.85);
        swayState.v = THREE.MathUtils.clamp(s.vx * 0.0011, -0.06, 0.06);
        return;
      }
      /* tap — fire a value burst from the chain link nearest the tap */
      const ndc = new THREE.Vector2(
        (e.clientX / window.innerWidth) * 2 - 1,
        -(e.clientY / window.innerHeight) * 2 + 1,
      );
      raycaster.setFromCamera(ndc, cam);
      let bestT = 0.5;
      let bestD = Infinity;
      for (let i = 0; i <= 180; i++) {
        const t = i / 180;
        const d = raycaster.ray.distanceToPoint(curve.getPointAt(t));
        if (d < bestD) {
          bestD = d;
          bestT = t;
        }
      }
      /* generous grab radius on touch — fingers are not cursors (v2) */
      const grab = e.pointerType === "mouse" ? 9 : 14;
      if (bestD < grab) onTap(bestT);
    };
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    const onLeave = () => {
      hoverState.active = false;
    };
    document.documentElement.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      document.body.style.cursor = "";
    };
  }, [cam, curve, onTap, raycaster]);

  const groupRef = useRef<THREE.Group>(null);
  const lastOrbit = useRef(0);

  useFrame(({ camera, clock }, dt) => {
    const s = state.current;
    if (!s.down) s.tTheta += dt * (IS_TOUCH ? 0.016 : 0.012); /* idle drift — a touch quicker on mobile (v2) */
    s.theta = damp(s.theta, s.tTheta, 4.2, dt);
    s.phi = damp(s.phi, s.tPhi, 4.2, dt);
    const r = 52 + scrollState.p * 9; /* recede into the dark as the case files rise */
    camera.position.set(
      Math.sin(s.theta) * r * Math.cos(s.phi),
      4 + Math.sin(s.phi) * r * 0.7 - scrollState.p * 2.5,
      Math.cos(s.theta) * r * Math.cos(s.phi),
    );
    camera.lookAt(0, 0.5 - scrollState.p * 1.5, 0);
    if (groupRef.current) groupRef.current.rotation.x = -scrollState.p * 0.05;
    /* publish the orbit heading to the dom — the landing readout */
    if (clock.elapsedTime - lastOrbit.current > 0.12) {
      lastOrbit.current = clock.elapsedTime;
      const deg = (((s.theta * 180) / Math.PI) % 360 + 360) % 360;
      window.dispatchEvent(new CustomEvent("tara-orbit", { detail: deg }));
    }
  });

  return <group ref={groupRef}>{children}</group>;
}

export default function LandingScene() {
  const curve = useChainCurve();
  /* lighter payload on small screens */
  const small = typeof window !== "undefined" && window.innerWidth < 640;
  const linkCount = small ? 92 : 128;
  const pulseCount = small ? 4 : 7;
  const streamCount = small ? 130 : 240;
  const dustCount = small ? 130 : 220;

  useEffect(() => {
    const onScroll = (e: Event) => {
      scrollState.p = (e as CustomEvent<number>).detail ?? 0;
    };
    window.addEventListener("tara-scroll", onScroll);
    return () => window.removeEventListener("tara-scroll", onScroll);
  }, []);

  return (
    <div className="fixed inset-0 z-0" style={{ touchAction: "pan-y" }} aria-hidden>
      <Canvas
        dpr={[1, small ? 1.5 : 1.8]}
        camera={{ fov: 44, near: 0.1, far: 300, position: [14, 6, 50] }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
      >
        <color attach="background" args={["#070911"]} />
        <fogExp2 attach="fog" args={["#070911", 0.0125]} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[18, 26, 12]} intensity={1.15} color="#dfe8ff" />
        <directionalLight position={[-16, -8, -14]} intensity={0.35} color="#53d6ee" />
        <OrbitRig curve={curve} onTap={spawnBurst}>
          <ChainLinks curve={curve} count={linkCount} />
          <FlowPulses curve={curve} count={pulseCount} />
          <Stream curve={curve} count={streamCount} />
          <Dust count={dustCount} />
          <Bursts curve={curve} />
          <Reticle curve={curve} />
          <AmbientLife />
        </OrbitRig>
        <EffectComposer multisampling={0}>
          <Bloom mipmapBlur intensity={small ? 0.88 : 0.72} luminanceThreshold={0.26} luminanceSmoothing={0.3} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
