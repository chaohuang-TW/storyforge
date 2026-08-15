# StoryForge

**A Web Interactive Novel Engine**

Status: **Phase 3C — Playable & Illustrated Vertical Slice (development)**

StoryForge is a reading-first Web Interactive Novel Engine. Completed phases:
Phase 0 — Foundation, Phase 1 — Book Reader, Phase 2 — Story Runtime, Phase
3A — Causality Foundation, and Phase 3B — Choice & Causal Commit. The Reader
remains continuous and mobile-first.

Phase 3B production supports:

- Choice Story Nodes
- Choice conditions
- Choice effects
- Atomic causal commit
- Choice → World State
- Choice → Conditional routing
- In-memory Choice History
- Inline Choice UI
- Session-level irreversible commitment

Phase 3C development adds the first illustrated playable slice inside the
existing `runtime-demo` Story Pack:

- Illustrated narrative nodes with branch-specific Story Pack assets
- Immediate wind/rain causal consequences followed by a shared narrative
- Delayed conditional consequences that remain invisible to the Reader UI
- A second intervention and Choice with branch consequences that rejoin
- An end-to-end route from first Choice to the shared `潮線之後` ending

Phase 3B guarantees irreversible choice commitment within the active runtime.
Cross-reload Runtime persistence is not implemented. Reader Memory, New Game+,
Journey81, and production release of the Phase 3C slice are not implemented. See [the
causality foundation](src/engine/causality/README.md).

## Tech stack

Node 24, npm, React, Vite, strict TypeScript, ESLint, Vitest, React Testing
Library, and Playwright (Chromium).

## Requirements

Node 24 (`.nvmrc`) and npm.

## Install

```bash
npm ci
npx playwright install chromium
```

## Development and verification

```bash
npm run dev
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
npm run check
```

Preview a production build with `npm run preview`.

## Architecture boundary

Story Packs depend on the generic Engine; the Engine never depends on a Story
Pack. See [the Engine boundary](src/engine/README.md) and [foundation
architecture](docs/architecture/foundation.md).

## GitHub Pages

The Pages workflow deploys `dist/` from `main`. Vite derives a project-pages
base path from `GITHUB_REPOSITORY`, while local development uses `/`.

## Current scope

This development branch keeps the [Reader boundary](src/reader/README.md)
independent of Choice, World State, Conditions, Effects, Conditional Story
Nodes, and Story Runtime. Choice commitments and Choice History exist only in
the active runtime. Reloading resets the runtime. Reading position does not
persist Choice, World State, Choice History, or the Runtime cursor.

The following remain intentionally out of scope:

- Cross-reload Runtime persistence
- Reader Memory
- New Game+
- Journey81
- Production release of the Phase 3C slice
