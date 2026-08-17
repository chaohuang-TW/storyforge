# Runtime Persistence

Phase 4A stores the active Story Runtime automatically in the browser's
`LocalStorage`. The persistence layer is generic: it knows a Story Pack's
identity and serializable runtime snapshot, but it does not know story prose,
flags, illustrations, or route names.

## Responsibility

- `StoryRuntime` exports and restores a defensive `StoryRuntimeSnapshot`.
- `runtimeSave.ts` serializes a versioned envelope and owns the browser storage
  boundary.
- `StorySession` restores before its first render and saves after each
  successful `advance()` or `choose()` mutation.
- The Reader continues to own its existing preferences and reading-position
  storage. Runtime persistence never stores Reader position, rendered content,
  or transient UI feedback.

## Save envelope and key

Each Story Pack uses an independent key:

```text
storyforge.runtime.<encodeURIComponent(storyId)>
```

The envelope contains `formatVersion: 1`, `storyId`, `storyVersion`,
`schemaVersion`, and the runtime snapshot. The snapshot contains only the
current node ID, visible node IDs, World State, Choice History, and an optional
pending Choice node ID.

## Restore and compatibility

Startup chooses a valid restored runtime before the Reader renders. Existing
effects are not replayed; the saved World State is accepted as the completed
state. A save is accepted only when all envelope identity fields and the format
version match the loaded Story Pack. Phase 4A does not implement save
migrations. Incompatible runtime saves are invalidated and a fresh runtime
starts.

Malformed or structurally invalid saves are ignored and removed without a
fatal error. If storage is unavailable or a write fails, the active runtime
still commits in memory and the session exposes a polite, low-interference
warning that the causal state may be lost on reload.

Cross-tab synchronization, cloud saves, manual save slots, manual load, reset
or new-run UI, Bookmark, Reader Memory, New Game+, and Journey81 are outside
Phase 4A.
