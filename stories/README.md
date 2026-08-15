# Story Packs

Each Story Pack owns its content and assets. The minimal Phase 2 shape is:

```text
story-pack/
├── manifest.json
├── nodes/
└── assets/
```

`runtime-demo` is an Engine integration fixture, not a product story. Packs
depend on the Engine; Engine modules must never import a specific pack.
