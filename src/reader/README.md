# Book Reader boundary

The Reader owns how a document is read: continuous vertical layout,
presentation blocks, typography, themes, reading progress, and approximate
position restoration.

## Presentation model

`ReaderBlock` is a display-only union for headings, paragraphs, dialogue,
illustrations, quotes, and dividers. It describes what should appear on the
page, not how a narrative advances. The Phase 1 demo document is a fixture,
not a formal story schema.

## Browser storage

- `storyforge.reader.preferences` stores font size, line height, and theme.
- `storyforge.reader.position.<documentId>` stores approximate reading
  progress for one document.

These namespaces contain reader preferences and position only. They are not a
story save or cross-run narrative memory.

## Future integration boundary

A future Story Runtime may provide presentation content to the Reader. The
Reader itself must not understand Route, Choice, Condition, Effect, World
State, branching, or any work-specific narrative concept.
