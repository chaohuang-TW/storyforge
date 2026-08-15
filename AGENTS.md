# StoryForge engineering principles

1. StoryForge is an e-book-like Web Interactive Novel Engine with future
   multiple stories, choices, causal state, and cross-run memory. Reading is
   the product core.
2. `Observer` is a Story/Narrative concept, never a Core Engine concept.
3. Future interaction follows: observers change conditions; characters decide
   actions. The Engine provides generic conditions, state, effects, and nodes.
4. World State and Reader Memory are distinct concepts; never collapse them
   into one state object.
5. Seen text may be paged back through; fate cannot be undone with Back. Save,
   navigation, choice, and history must preserve this rule.
6. Story Packs depend on StoryForge Engine. Engine must never depend on any
   Story Pack or know work-specific people, places, plots, or terms.
7. Mobile first: protect the Chinese long-form reading experience without
   sacrificing desktop usability.

Before changing this project, keep work inside the requested phase and do not
introduce a Story Engine, schema, runtime, Reader, Choice, Journey81, or other
product feature before it is requested.
