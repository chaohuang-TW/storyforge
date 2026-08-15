# Engine boundary

StoryForge Engine owns generic story data, loading, linear runtime traversal,
asset references, and adaptation into Reader presentation data. Phase 2 adds a
minimal Story Manifest plus Narrative and Ending nodes only.

It must not know Journey81, Wukong, TangSeng, Baigujing, Tribulation, or any
specific work, character, setting, or plot. This is a permanent architectural
constraint: Story Packs depend on the Engine; the Engine never depends on one.
The current core does not include Choice, Condition, Effect, state, memory,
branching, or persistence. See `story/`, `story-loader/`, `runtime/`, and
`adapters/`.
