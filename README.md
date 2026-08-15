# StoryForge

**A Web Interactive Novel Engine**

Status: **Phase 2 — Story Runtime (development)**

StoryForge is a reading-first Web Interactive Novel Engine. Phase 2 adds a
Story Manifest, Narrative and Ending nodes, a static Story Loader, a linear
runtime, and a Story-to-Reader adapter. The Reader remains continuous and
mobile-first.

Choice, Condition, Effect, World State, Reader Memory, Runtime Save, and
branching remain intentionally out of scope.

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

This branch is intentionally limited to the Book Reader. See the [Reader
boundary](src/reader/README.md). Later phases may supply content to the Reader,
but the Reader remains independent of narrative progression and causality.
