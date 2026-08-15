# Engine boundary

StoryForge Engine owns generic story data, loading, state-aware runtime
traversal, asset references, and adaptation into Reader presentation data.
Phase 3A adds World State, Conditions, Effects, and invisible Conditional Nodes.

It must not know Journey81, Wukong, TangSeng, Baigujing, Tribulation, or any
specific work, character, setting, or plot. This is a permanent architectural
constraint: Story Packs depend on the Engine; the Engine never depends on one.
The current core does not include Choice, irreversible commit, Reader Memory,
or persistence. See `causality/`, `story/`, `story-loader/`, `runtime/`, and
`adapters/`.
