# Runtime Persistence

Phase 4A stores the active Story Runtime automatically in the browser's
`LocalStorage`. Phase 6A adds a separate Reader Memory envelope. The
persistence layer is generic: it knows a Story Pack's
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
- `storyBookmark.ts` stores one Reader Location per Story Pack. Bookmark
  persistence never stores Runtime Snapshot, World State, Choice History,
  pending Choice, story content, HTML/SVG, or Effects.
- `readerMemory.ts` stores only monotonic `Record<string, true>` knowledge flags
  at `storyforge.memory.<encodeURIComponent(storyId)>`. It has its own identity
  compatibility checks and corrupt-save fallback; it never appears in Runtime
  Snapshots, Runtime Saves, or Bookmarks.

Runtime Save and Reader Memory Save are separate persistence domains. After a
successful Runtime mutation, StorySession saves Reader Memory first and writes
the Runtime Snapshot only if that succeeds. A Memory write failure therefore
cannot leave Runtime ahead of Memory; if the Runtime write fails after Memory
succeeds, Memory may be ahead and the active session remains usable. A New Run
clears Reader position, Bookmark, and Runtime Save in the existing fail-fast
order while preserving the in-memory Reader Memory.

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

Cross-tab synchronization, cloud saves, manual save slots, manual load, New
Game+, and Journey81 remain outside this persistence boundary.

## Bookmark envelope and key

Phase 4B uses one replaceable Bookmark at:

```text
storyforge.bookmark.<encodeURIComponent(storyId)>
```

The envelope is deliberately small and versioned:

```json
{
  "formatVersion": 1,
  "storyId": "runtime-demo",
  "storyVersion": "0.1.0",
  "schemaVersion": "0.1",
  "location": {
    "documentId": "story:runtime-demo",
    "markerId": "chapter-heading",
    "progress": 42
  }
}
```

Bookmark identity must match the loaded Story Pack. Malformed or incompatible
Bookmarks are discarded without affecting Runtime restore. Updating or
returning to a Bookmark never changes fate; it only asks the generic Reader to
navigate to a saved location. A new run removes Bookmark, Reader position, and
Runtime save through their owning generic APIs, while preserving Reader
preferences.
