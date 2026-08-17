# StoryForge

**A Web Interactive Novel Engine**

Status: **Phase 4B — Bookmark & Run Lifecycle UX (development)**

StoryForge is a reading-first Web Interactive Novel Engine. Completed phases:
Phase 0 — Foundation, Phase 1 — Book Reader, Phase 2 — Story Runtime, Phase
3A — Causality Foundation, Phase 3B — Choice & Causal Commit, Phase 3C —
Illustrated Playable Slice, and Phase 4A — Runtime Persistence. The Reader
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

Phase 4A production supports automatic Runtime Persistence per Story Pack in
LocalStorage:

- Automatic per-story runtime saves with a versioned save envelope
- World State, visible narrative, current Runtime position, Choice History, and
  pending Choice restoration
- Ending restoration after reload
- Reload and close/reopen persistence without replaying completed effects
- Safe corrupt or incompatible save fallback
- Non-blocking Storage failure warning
- Reader preference and reading-position separation from story fate

Phase 4B development adds the first lifecycle controls without changing the
causal Engine or Story Pack schema:

- One per-story Bookmark containing only a generic Reader Location
- Bookmark save after a successful Runtime snapshot write
- Ending-only, two-step `開始新一輪` reset for Runtime save, Bookmark, and Reader position
- Reader preferences remain untouched by a new run

In normal LocalStorage conditions, committed causality, the currently visible
story, Choice History, pending Choice, and World State survive reload and
close/reopen. Restore does not re-apply completed node or Choice effects. See
[the causality foundation](src/engine/causality/README.md) and [the Runtime
Persistence boundary](src/persistence/README.md).

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

The [Reader boundary](src/reader/README.md) remains independent of Choice,
World State, Conditions, Effects, Conditional Story Nodes, and Story Runtime.
Runtime persistence is owned by the separate `src/persistence/` boundary and
restores committed story state without taking ownership of Reader UI state.
Reading position and preferences remain separate Reader state and do not
determine story fate. Bookmark navigation changes only the Reader viewport; it
cannot undo a Choice, World State effect, Runtime snapshot, or visible story.

The following remain intentionally out of scope:

- Reader Memory — NOT IMPLEMENTED
- New Game+ — NOT IMPLEMENTED
- Manual Save Slots — NOT IMPLEMENTED
- Manual Load — NOT IMPLEMENTED
- Cloud Save — NOT IMPLEMENTED
- Journey81 — NOT IMPLEMENTED
- Multiple Bookmarks, archive/history UI, achievements, account sync, and undo — NOT IMPLEMENTED
- Phase 5 — NOT STARTED
