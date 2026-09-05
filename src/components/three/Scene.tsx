"use client";

import { Nodes } from "./Nodes";
import { Edges } from "./Edges";
import { Flow, Dust } from "./Flow";
import { CameraRig } from "./CameraRig";
import { Labels } from "./Labels";

export function Scene() {
  return (
    <>
      <CameraRig />
      <gridHelper
        args={[190, 38, 0x1a211e, 0x121715]}
        position={[0, -11.5, 0]}
        material-transparent
        material-opacity={0.13}
      />
      <Dust />
      <Edges />
      <Flow />
      <Nodes />
      <Labels />
    </>
  );
}
