"use client";

import { Canvas } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { Scene } from "./Scene";
import { useStore } from "@/lib/store";
import { SCENE_BG } from "@/lib/palette";
import { dragState } from "./shared";

export default function GraphCanvas() {
  const setGraphReady = useStore((s) => s.setGraphReady);

  return (
    <div className="canvas-wrap fixed inset-0 z-[1]">
      <Canvas
        dpr={[1, 1.8]}
        camera={{ fov: 42, near: 0.1, far: 420, position: [0, 12, 68] }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        onCreated={() => setGraphReady()}
        onPointerMissed={() => {
          if (!dragState.moved) useStore.getState().selectNode(null);
        }}
      >
        <color attach="background" args={[SCENE_BG]} />
        <fogExp2 attach="fog" args={[SCENE_BG, 0.0132]} />
        <Scene />
        <EffectComposer multisampling={0}>
          <Bloom mipmapBlur intensity={0.9} luminanceThreshold={0.24} luminanceSmoothing={0.28} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
