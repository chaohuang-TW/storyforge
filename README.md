# StoryForge

**A Web Interactive Novel Engine**

Status: **Phase 3C — Playable & Illustrated Vertical Slice (complete)**

StoryForge is a reading-first Web Interactive Novel Engine. Completed phases:
Phase 0 — Foundation, Phase 1 — Book Reader, Phase 2 — Story Runtime, Phase
3A — Causality Foundation, Phase 3B — Choice & Causal Commit, and Phase 3C —
Playable & Illustrated Vertical Slice. The Reader remains continuous and
mobile-first.

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

Phase 3C production supports the illustrated playable slice inside the existing
`runtime-demo` Story Pack:

- Illustrated Story Pack narrative
- Nine Story Pack-owned illustrations
- Branch-specific visual consequences
- Immediate causal consequences
- Delayed causal consequences
- Second causal intervention
- Branch → Consequence → Rejoin
- Four coherent causal combinations
- Shared ending

Phase 3B guarantees irreversible choice commitment within the active runtime.
Cross-reload Runtime persistence is not implemented. Reader Memory, New Game+,
and Journey81 are not implemented. See [the
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

This production branch keeps the [Reader boundary](src/reader/README.md)
independent of Choice, World State, Conditions, Effects, Conditional Story
Nodes, and Story Runtime. Choice commitments and Choice History exist only in
the active runtime. Reloading resets the runtime. Reading position does not
persist Choice, World State, Choice History, or the Runtime cursor.

The following remain intentionally out of scope:

- Cross-reload Runtime persistence
- Reader Memory
- New Game+
- Journey81
