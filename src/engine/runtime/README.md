# Story Runtime

`createStoryRuntime` is UI-free and deterministic. It starts at `entryNode`,
advances through validated Story Graph edges, and exposes every visited
renderable node in order. Conditional and Choice nodes are non-rendered control
nodes. A Pending Choice pauses normal `advance()` until `choose()` commits one
currently available option.

Node effects execute exactly once on entry. Conditional branches evaluate
against the latest in-memory World State, and `getWorldState()` returns a
defensive copy. Choice commitment applies Choice Effects before conditional
routing, builds the complete next snapshot before mutation, and records
`nodeId + choiceId` in a defensive in-memory history. A committed choice cannot
be reselected in the active runtime. Direct Choice entry is not supported in
Phase 3B.

Runtime state is currently in-memory only. Cross-reload persistence is not yet
implemented, so reloading creates a fresh runtime.
