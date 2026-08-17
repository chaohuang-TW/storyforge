# StoryForge

**A Web Interactive Novel Engine**

Status: **Phase 4A — Runtime Persistence (development)**

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

Phase 4A development adds automatic Runtime Persistence per Story Pack in
LocalStorage. Reloading or reopening restores committed World State, visible
narrative, pending Choice, current Runtime position, and Choice History before
the Reader renders.

Phase 4A guarantees that the active story run continues across normal reload
and close/reopen when LocalStorage is available. Incompatible or corrupt saves
start a fresh runtime; Phase 4A does not implement save migrations. Reader
Memory, New Game+, Bookmark, cloud save, multiple save slots, and Journey81
are not implemented. See [the
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
the active runtime; persistence is owned by the separate `src/persistence/`
boundary. Reading position and preferences remain separate Reader state and do
not determine story fate.

The following remain intentionally out of scope:

- Reader Memory
- New Game+
- Bookmark
- Cloud save
- Multiple save slots
- Journey81
