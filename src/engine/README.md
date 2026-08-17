# Engine boundary

StoryForge Engine owns generic story data, loading, state-aware runtime
traversal, asset references, and adaptation into Reader presentation data.
Phase 3A adds World State, Conditions, Effects, and invisible Conditional Nodes.
Phase 3B adds Choice nodes as non-rendered runtime boundaries. Phase 6A adds
generic Reader Memory flags, the `readerRemembers` condition, and the
`remember` effect. Choice
commitment applies effects before resolving the next route, and the complete
commit is atomic.

It must not know Journey81, Wukong, TangSeng, Baigujing, Tribulation, or any
specific work, character, setting, or plot. This is a permanent architectural
constraint: Story Packs depend on the Engine; the Engine never depends on one.
Reader Memory is an Engine concept, but Reader UI state is not Reader Memory.
World State describes the current run and resets on New Run; Reader Memory is a
monotonic `Record<string, true>` that persists across runs. Runtime snapshots
contain only current-run state and never include Reader Memory. LocalStorage
serialization and restore lifecycle belong to the separate `src/persistence/`
boundary. See `causality/`, `memory/`, `story/`, `story-loader/`, `runtime/`,
and `adapters/`.
