# Story Packs

Each Story Pack owns its content and assets. The v0.1 shape supports optional
node effects, invisible conditional routing, and non-rendered Choice boundaries:

```text
story-pack/
├── manifest.json
├── nodes/
└── assets/
```

Illustration assets belong to the Story Pack that declares them; the Engine
only validates and serves the generic asset reference. Branch-specific
illustrations are attached to branch-specific narrative nodes, so the App and
Reader do not contain story-path logic.

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

Example Choice node:

```json
{
  "id": "letter-choice",
  "type": "choice",
  "prompt": "門縫裡卡著一封沒有署名的信。",
  "choices": [
    {
      "id": "wind",
      "label": "讓風把信吹進屋內",
      "effects": [
        { "type": "setFlag", "key": "letter-entered" }
      ],
      "next": "wind-path"
    }
  ]
}
```

Each Choice item may define AND-combined `conditions`, `effects`, and one
`next` target. Choice IDs are unique within their containing Choice node.
