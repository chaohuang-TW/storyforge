# Linear Story Runtime

`createStoryRuntime` is UI-free and deterministic. It starts at `entryNode`,
advances through a validated `next` link, and exposes every visited node in
order. Runtime persistence is intentionally out of scope until Phase 4.
