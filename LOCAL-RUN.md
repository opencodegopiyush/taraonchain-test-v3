# taraonchain — TEST BUILD (v3) · local run

This is the **test variant**, not the live site. The published GitHub repo is
untouched. Everything here is experimental: slightly different animations,
forced mobile-friendly motion, and a few engagement-focused UX details.
The S-0830 SHARAV investigation content is byte-for-byte identical to the
live site — nothing in the report was changed.

## Run it on Fedora (bash)

```bash
sudo dnf install nodejs npm     # if you don't have Node 20.9+ yet
unzip taraonchain-test-v2.zip
cd taraonchain-v2
bash run-local.sh
```

Then open **http://localhost:3000**.

`run-local.sh` does everything: installs dependencies, generates the Prisma
client, and starts the dev server. **No database is needed** — the SHARAV
investigation ships bundled inside the code, so the full 3D case file opens
even with zero setup.

## What is different in this test build

**Landing (forced mobile-friendly)**
- Ambient value pulses fire every few seconds on their own — the chain
  never sits still, with or without a cursor (more frequent on phones).
- Touch orbiting is more responsive and taps grab from farther away.
- The whole chain breathes with a slow vertical drift.
- Mobile-only swipe cue points to the case files, retires itself on scroll.
- Bloom is stronger on small screens so the dark scene keeps its depth.

**Investigation workspace (slightly more animation — not more noise)**
- Entities materialize one after another when a case opens (staged entrance).
- Each chapter change: focus entities take one breath of extra light, and
  the value flow surges for about a second before settling.
- Momentum readout — “38% REVIEWED” climbs as you walk the chapters.

**Engagement details (same palette, same report)**
- Archive telemetry counts up on arrival instead of sitting static.
- Case cards cascade in with a stagger.
- The final “Read the full case report” button breathes on the last chapter.
- Landing footer is marked `TEST BUILD · V2` so you can tell versions apart.

## Not changed
- The S-0830 SHARAV report content (verbatim, as published).
- The color palette, typography, and layout system.
- The frozen trail engine (Edges / Labels / CameraRig).
