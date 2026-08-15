# StoryForge Foundation

## Position

StoryForge is a Web Interactive Novel Engine: reading is the product core, and
future interaction must not reduce reading to a wait for choices.

## Phase 0 choices

- Node 24 with npm and a committed lockfile.
- React, Vite, and strict TypeScript for a static-only web application.
- ESLint, Vitest + React Testing Library, and a Chromium Playwright smoke test.
- GitHub Pages deploys the `dist/` artifact from GitHub Actions.

## Boundaries

Engine capabilities are generic. Story Packs contain all work-specific
characters, narrative, and assets. The Engine never imports a Story Pack.
World State and Reader Memory remain distinct future concepts.

## Delivery constraints

The shell is mobile first, semantic, accessible, and uses system fonts. Phase
0 has no reader, story schema/runtime, choices, saves, Story Pack, backend, or
product simulation.
