"use client";

import { create } from "zustand";
import type { CaseFile, Epistemic } from "./types";
import { CASE, setActiveCase } from "./case-data";

const CHAPTER_COUNT = (cf: CaseFile) => cf.chapters.length;
const camOf = (cf: CaseFile, i: number) => cf.chapters[Math.min(cf.chapters.length - 1, Math.max(0, i))].camera;

export type Overlay = "report" | "method" | "cases" | null;

export interface CameraCommand {
  target: [number, number, number];
  radius: number;
  theta: number;
  phi: number;
  duration: number;
  seq: number;
}

interface AlluvialState {
  introDismissed: boolean;
  chapter: number;
  selectedNodeId: string | null;
  hoveredNodeId: string | null;
  factsOnly: boolean;
  flowPaused: boolean;
  legendOpen: boolean;
  overlay: Overlay;
  camera: CameraCommand | null;
  graphReady: boolean;
  caseFile: CaseFile;
  caseVersion: number;

  begin: () => void;
  home: () => void;
  loadCase: (cf: CaseFile) => void;
  setChapter: (i: number, animate?: boolean) => void;
  recenter: () => void;
  nextChapter: () => void;
  prevChapter: () => void;
  selectNode: (id: string | null) => void;
  hoverNode: (id: string | null) => void;
  toggleFactsOnly: () => void;
  toggleFlowPaused: () => void;
  setLegendOpen: (open: boolean) => void;
  setOverlay: (o: Overlay) => void;
  setGraphReady: () => void;
}

let seq = 1;
const cmd = (
  target: [number, number, number],
  radius: number,
  theta: number,
  phi: number,
  duration = 1800,
): CameraCommand => ({ target, radius, theta, phi, duration, seq: seq++ });

export const useStore = create<AlluvialState>((set, get) => ({
  introDismissed: false,
  chapter: 0,
  selectedNodeId: null,
  hoveredNodeId: null,
  factsOnly: false,
  flowPaused: false,
  legendOpen: false,
  overlay: null,
  camera: null,
  graphReady: false,
  caseFile: CASE,
  caseVersion: 0,

  begin: () => {
    const s = get();
    const c = camOf(s.caseFile, s.chapter);
    set({ introDismissed: true, camera: cmd(c.target, c.radius, c.theta, c.phi, 3200) });
  },
  /* wordmark click — back to the landing page from anywhere.
     closes overlays, drops selection and eases the camera back to the
     opening chapter keyframe (existing rig machinery, trail untouched) */
  home: () => {
    const c = camOf(get().caseFile, 0);
    set({
      introDismissed: false,
      overlay: null,
      chapter: 0,
      selectedNodeId: null,
      hoveredNodeId: null,
      camera: cmd(c.target, c.radius, c.theta, c.phi, 2400),
    });
  },
  /* open a published investigation — same workspace, new data.
     bumps caseVersion so the 3d subtree remounts against the new CASE */
  loadCase: (cf) => {
    setActiveCase(cf);
    const c = cf.chapters[0].camera;
    set((s) => ({
      caseFile: cf,
      caseVersion: s.caseVersion + 1,
      chapter: 0,
      selectedNodeId: null,
      hoveredNodeId: null,
      factsOnly: false,
      overlay: null,
      camera: cmd(c.target, c.radius, c.theta, c.phi, 2600),
    }));
  },
  setChapter: (i, animate = true) => {
    const s = get();
    const n = Math.min(CHAPTER_COUNT(s.caseFile) - 1, Math.max(0, i));
    const c = camOf(s.caseFile, n);
    set({
      chapter: n,
      selectedNodeId: null,
      camera: animate ? cmd(c.target, c.radius, c.theta, c.phi, 2000) : null,
    });
  },
  nextChapter: () => get().setChapter(get().chapter + 1),
  prevChapter: () => get().setChapter(get().chapter - 1),
  recenter: () => {
    const s = get();
    const c = camOf(s.caseFile, s.chapter);
    set({ selectedNodeId: null, camera: cmd(c.target, c.radius, c.theta, c.phi, 1600) });
  },
  selectNode: (id) => set({ selectedNodeId: id }),
  hoverNode: (id) => set({ hoveredNodeId: id }),
  toggleFactsOnly: () => set({ factsOnly: !get().factsOnly }),
  toggleFlowPaused: () => set({ flowPaused: !get().flowPaused }),
  setLegendOpen: (open) => set({ legendOpen: open }),
  setOverlay: (o) => set({ overlay: o }),
  setGraphReady: () => set({ graphReady: true }),
}));

/* camera keyframes come from the live case — no module-level table */

/* orbit / zoom are handled imperatively inside the camera rig via a
   lightweight event bus to avoid re-rendering the scene graph */
type RigEvent =
  | { type: "orbit"; dTheta: number; dPhi: number }
  | { type: "zoom"; factor: number }
  | { type: "refocus"; nodeId: string; radius?: number };

export const rigBus: { listeners: Set<(e: RigEvent) => void>; emit(e: RigEvent): void } = {
  listeners: new Set(),
  emit(e) {
    this.listeners.forEach((l) => l(e));
  },
};

export const EPISTEMIC_ORDER: Epistemic[] = ["observed", "assessed", "unknown"];
