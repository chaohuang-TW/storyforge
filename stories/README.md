# Story Packs

Each Story Pack owns its content and assets. The Phase 3A shape extends the
Phase 2 pack with optional node effects and invisible conditional routing:

```text
story-pack/
├── manifest.json
├── nodes/
└── assets/
```

`runtime-demo` is an Engine integration fixture, not a product story. Packs
depend on the Engine; Engine modules must never import a specific pack.

Example conditional routing node:

```json
{
  "id": "path-check",
  "type": "conditional",
  "branches": [
    {
      "when": { "type": "hasFlag", "key": "signal-seen" },
      "next": "signal-path"
    }
  ],
  "fallback": "normal-path"
}
```
