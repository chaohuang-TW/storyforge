# StoryForge

**A Web Interactive Novel Engine**

Status: **Phase 0 — Foundation**

StoryForge is a reading-first, static web foundation for a future interactive
novel engine. Phase 0 establishes engineering boundaries and delivery quality;
it does not implement a reader, story engine, story schema, choices, saves, or
any Story Pack.

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

## Current scope and next phase

This repository is intentionally limited to Phase 0. A later, explicitly
approved phase may introduce product capabilities while preserving the
architecture documented here.
