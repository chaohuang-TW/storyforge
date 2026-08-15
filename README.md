# StoryForge

**A Web Interactive Novel Engine**

Status: **Phase 3B — Choice & Causal Commit (development)**

StoryForge is a reading-first Web Interactive Novel Engine. Completed phases:
Phase 0 — Foundation, Phase 1 — Book Reader, Phase 2 — Story Runtime, and Phase
3A — Causality Foundation. Phase 3B development adds Choice Story Nodes,
conditional Choice availability, Choice Effects, atomic causal commit,
in-memory Choice History, an inline Choice UI, and session-level
irreversibility. The Reader remains continuous and mobile-first.

Phase 3B guarantees irreversible choice commitment within the active runtime.
Cross-reload persistence remains out of scope. Reader Memory, New Game+,
Journey81, and Phase 3C extended playable content are not implemented. See
[the causality foundation](src/engine/causality/README.md).

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
the active runtime. Reloading resets the story runtime; reading position does
not persist Choice, World State, Choice History, or the Runtime cursor.
