# Story Runtime

`createStoryRuntime` is UI-free and deterministic. It starts at `entryNode`,
advances through validated Story Graph edges, and exposes every visited
renderable node in order. Conditional and Choice nodes are non-rendered control
nodes. A Pending Choice pauses normal `advance()` until `choose()` commits one
currently available option.

Node effects execute exactly once on entry. Conditional branches evaluate
against the latest World State and separate Reader Memory. `getWorldState()`
and `getReaderMemory()` return defensive copies. Choice commitment applies
Choice Effects before conditional routing, builds the complete next snapshot before mutation, and records
`nodeId + choiceId` in a defensive in-memory history. A committed choice cannot
be reselected in the active runtime. Direct Choice entry is not supported in
Phase 3B.

Runtime state remains in-memory within the Engine. Cross-reload persistence is
not implemented in this module. `exportSnapshot()` returns the serializable current
node, visible node IDs, World State, Choice History, and pending Choice. Reader
Memory is deliberately not part of that snapshot; pass it separately through
`createStoryRuntime(story, { snapshot, readerMemory })`. Restore rebuilds
runtime bookkeeping without replaying completed node, Choice, or `remember`
effects. Browser storage remains outside the Engine in `src/persistence/`.
