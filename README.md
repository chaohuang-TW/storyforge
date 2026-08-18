# StoryForge

**A Web Interactive Novel Engine**

Status: **Phase 6B1 — Journey81 Story Pack (complete)**

StoryForge is a reading-first Web Interactive Novel Engine. Completed phases:

- Phase 0 — Foundation
- Phase 1 — Book Reader
- Phase 2 — Story Runtime
- Phase 3A — Causality Foundation
- Phase 3B — Choice & Causal Commit
- Phase 3C — Playable & Illustrated Vertical Slice
- Phase 4A — Runtime Persistence
- Phase 4B — Bookmark & Run Lifecycle UX
- Phase 5 — Story Validator
- Phase 6A — Reader Memory Foundation
- Phase 6B1 — Journey81 Story Pack

The Reader remains continuous and mobile-first.

Phase 6B1 implements the independent `stories/journey81/` Story Pack vertical
slice for 《西遊：八十一劫》. It is validated and testable through the generic
Engine without replacing the production `runtime-demo` App default. The
Journey81 Story Pack is implemented; the active Journey81 App is **NOT
IMPLEMENTED**. Journey81 browser E2E belongs to Phase 6B2, which is **NOT
STARTED**.

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

Phase 4B production adds lifecycle controls without changing the causal Engine
or Story Pack schema:

- One per-story Bookmark containing only a generic Reader Location
- Bookmark save after a successful Runtime snapshot write
- Bookmark navigation changes only the Reader viewport and never restores World State, Choice History, Runtime state, or a Choice
- Bookmark persistence across reload and close/reopen
- Ending-only, two-step `開始新一輪` reset for Runtime save, Bookmark, and Reader position
- Reader preferences remain untouched by a new run
- New Run cleanup is fail-fast: Reader position, then Bookmark, then Runtime save
- Runtime save is removed last; failed cleanup preserves the active run
- A second run can choose another route without cross-run memory

Bookmarks store a Reader location for the active run. Returning to a Bookmark
never restores earlier World State, Choice History, or Runtime state.

A new run is available after the ending and clears the active Runtime save,
Bookmark, and reading position while preserving Reader preferences and generic
Reader Memory. Phase 4B does not retain completed runs as loadable history.

Phase 6A Reader Memory is a monotonic `Record<string, true>` shared across
runs. `readerRemembers` conditions and `remember` effects are additive schema
`0.1` extensions. Reader Memory has a separate LocalStorage envelope and is
saved before Runtime Snapshot after each successful `advance` or `choose`.
World State still resets with a New Run; Runtime Snapshots and Bookmarks never
contain Reader Memory. The Reader UI remains unaware of these flags.

The persistence boundary stays explicit:

| Boundary | World State | Reader Memory |
| --- | --- | --- |
| Current run | YES | YES |
| New Run | RESET | PRESERVE |
| Runtime Snapshot | YES | NO |
| Runtime Save | YES | NO |
| Memory Save | NO | YES |
| Bookmark | NO | NO |
| Reader UI state | NO | NO |

## Story validation

The Story Validator runs independently of the Reader and Runtime and rejects
structurally invalid Story Packs before production build or deployment:

```text
Push
→ CI
→ lint
→ typecheck
→ test
→ Story Validate
→ build
→ E2E
→ Pages
```

Run it locally with:

```bash
npm run story:validate
```

Phase 5 production reuses the existing Story schema parser and validates:

- Story Pack schema validation and schema compatibility
- Duplicate node IDs and manifest entry validation
- Narrative, Choice, and Conditional target validation
- Structural reachability and unreachable node rejection
- Non-ending dead-end rejection
- Cycle rejection and reachable Ending requirement
- Exact Story asset-key validation and asset path escape rejection
- Canonical asset-key collision rejection
- Text-only Story Pack support
- Generic Story discovery and `npm run story:validate`
- CI Story Validate and GitHub Pages Story Validate gates

Reachability analysis is structural. It follows every declared graph edge and
does not attempt symbolic evaluation of all possible World State combinations.
The current Story graph contract is acyclic. Any structural cycle is a
validation error. Illustration assets are logical keys resolved through
`StoryPackSource.assets`. Validation uses exact key matching consistent with
Runtime `assets.get(key)`. The filesystem CLI derives one canonical
extensionless relative key per repository-local asset. Asset keys may not
escape the Story Pack root; the validator does not fetch network URLs or
bypass exact-key resolution for URL-looking references.

The validator is a read-only build-time check. It does not auto-fix Story Pack
files, execute Runtime choices, mutate World State, or run in the browser.

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

- New Game+ — NOT IMPLEMENTED
- Manual Save Slots — NOT IMPLEMENTED
- Manual Load — NOT IMPLEMENTED
- Cloud Save — NOT IMPLEMENTED
- Run archive/history — NOT IMPLEMENTED
- Achievements — NOT IMPLEMENTED
- Journey81 Story Pack — IMPLEMENTED
- Journey81 active App — NOT IMPLEMENTED
- Multiple Bookmarks — NOT IMPLEMENTED
- Story Studio — NOT IMPLEMENTED
- Graph Editor — NOT IMPLEMENTED
- AI authoring — NOT IMPLEMENTED
- Phase 6B1 — COMPLETE
- Phase 6B2 — NOT STARTED

Phase 6B1 does not include Journey81 browser E2E, a Story selector, an active
Journey81 App default, New Game+, run count, completed-run archives, memory UI,
memory journal, achievements, manual memory reset, cloud sync, accounts, or
Phase 6B2 work.
