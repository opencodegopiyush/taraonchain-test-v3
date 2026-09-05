# taraonchain

**On-chain investigations by Vedika** — a dark, mobile-first platform where every
published investigation opens as the same explorable 3D transaction trail:
follow the money chapter by chapter, inspect every wallet, read the report.

One rule runs through everything: **every claim is labeled** — what was
observed on-chain, what was assessed, what remains unknown.

## What's inside

- Interactive 3D trail engine (react-three-fiber): nodes, edges, animated value
  flows, chapter camera keyframes, drag-to-orbit
- Chapter-driven narrative walkthrough with an epistemic ledger
  (observed / assessed / unknown + confidence)
- Full case report per investigation: method, findings, asset status,
  evidence index, limitations, source note
- Hidden case-template admin plus a REST endpoint so a publishing agent can
  add investigations autonomously
- Investigations persist in PostgreSQL — they survive every redeploy

## Stack

Next.js 16 · React 19 · Tailwind 4 · three.js / @react-three/fiber ·
Prisma · PostgreSQL · zustand

## Run locally

```bash
npm install
cp .env.example .env      # fill DATABASE_URL (any Postgres) + the three secrets
npm run dev               # http://localhost:3000
```

## Deploy to Vercel

Full walkthrough in **[DEPLOY.md](./DEPLOY.md)** — GitHub import → Vercel
Postgres → env vars → deploy → domain. Every push to `main` rebuilds and
redeploys the site automatically.

## Publishing investigations

An investigation is a JSON dossier (any number of chapters, findings,
evidence rows — and optionally a hand-authored 3D graph with node positions
and per-chapter cameras; without one, a trail is synthesized automatically).
Two ways in:

- **Agent API** — `POST /api/agent/publish` with the `x-agent-key` header;
  full contract in **[AGENT_API.md](./AGENT_API.md)**
- **Hidden admin UI** — `/admin?door=<ADMIN_DOOR>` (plain 404 without the door)

Sourcing rule: dossiers contain only what the underlying report states —
no invented figures, no filler.

## Structure

```
src/
  app/                   routes (landing, admin, API)
  components/three/      3D trail engine
  components/chrome/     narrative panel, inspector, rails, dock
  components/overlays/   landing, report, cases, dossier reader
  lib/                   dossier schema → CaseFile compiler, store, auth
prisma/                  schema (Investigation model)
scripts/                 seed + runnable agent-publish example
```
