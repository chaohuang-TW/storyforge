# Story Runtime

`createStoryRuntime` is UI-free and deterministic. It starts at `entryNode`,
advances through validated Story Graph edges, and exposes every visited
renderable node in order. Conditional nodes are non-rendered control nodes.

Node effects execute exactly once on entry. Conditional branches evaluate
against the latest in-memory World State, and `getWorldState()` returns a
defensive copy. Runtime state is currently in-memory only; persistence remains
out of scope.
