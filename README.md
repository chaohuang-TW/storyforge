# StoryForge

**A Web Interactive Novel Engine**

Status: **Phase 3A — Causality Foundation (complete)**

StoryForge is a reading-first Web Interactive Novel Engine. Completed phases:
Phase 0 — Foundation, Phase 1 — Book Reader, Phase 2 — Story Runtime, and Phase
3A — Causality Foundation. Phase 3A adds World State, a Condition Engine, an
Effect Engine, Conditional Story Nodes, state-aware Runtime routing, and the
finite-number World State invariant. The Reader remains continuous and
mobile-first.

Choice, causal commit, irreversible choice handling, Reader Memory, Runtime
persistence, and Journey81 remain intentionally out of scope. See [the
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

This release keeps the [Reader boundary](src/reader/README.md) independent of
World State, Conditions, Effects, and Conditional Story Nodes. Runtime state is
in-memory only; Choice, causal commit, irreversible choice handling, Reader
Memory, persistence, and Journey81 remain out of scope.
