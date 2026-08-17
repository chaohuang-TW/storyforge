import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { tmpdir } from 'node:os'
import { describe, expect, it } from 'vitest'
import { canonicalAssetKey, loadStoryPackDirectory, runStoryValidation } from './validate-stories.mjs'

function writePack(root, name, nodes, entryNode = 'start', options = {}) {
  const packRoot = join(root, name)
  mkdirSync(join(packRoot, 'nodes'), { recursive: true })
  if (options.createAssetsDir !== false) mkdirSync(join(packRoot, 'assets'), { recursive: true })
  writeFileSync(join(packRoot, 'manifest.json'), JSON.stringify({
    id: name,
    title: name,
    version: '0.1.0',
    schemaVersion: '0.1',
    language: 'zh-TW',
    entryNode,
  }))
  nodes.forEach((node, index) => writeFileSync(join(packRoot, 'nodes', `${String(index).padStart(2, '0')}.json`), JSON.stringify(node)))
  for (const assetPath of options.assetFiles ?? []) {
    const filePath = join(packRoot, 'assets', assetPath)
    mkdirSync(dirname(filePath), { recursive: true })
    writeFileSync(filePath, 'asset')
  }
}

function outputCapture() {
  const lines = []
  return { output: { log: (line) => lines.push(String(line)) }, lines }
}

describe('Story validator CLI', () => {
  it('derives one extensionless relative key per physical asset', () => {
    const assetRoot = join('/tmp', 'storyforge-assets')

    expect(canonicalAssetKey(assetRoot, join(assetRoot, 'foo.svg'))).toBe('foo')
    expect(canonicalAssetKey(assetRoot, join(assetRoot, 'chapter-a', 'temple-night.webp'))).toBe('chapter-a/temple-night')
  })

  it('discovers all packs and returns exit 0 for a valid directory', () => {
    const root = mkdtempSync(join(tmpdir(), 'storyforge-validator-valid-'))
    try {
      writePack(root, 'alpha-story', [
        { id: 'start', type: 'narrative', content: [{ id: 'start-text', type: 'paragraph', text: 'Start' }], next: 'ending' },
        { id: 'ending', type: 'ending', content: [{ id: 'ending-text', type: 'paragraph', text: 'End' }] },
      ])
      writePack(root, 'beta-story', [
        { id: 'start', type: 'narrative', content: [{ id: 'start-text', type: 'paragraph', text: 'Start' }], next: 'ending' },
        { id: 'ending', type: 'ending', content: [{ id: 'ending-text', type: 'paragraph', text: 'End' }] },
      ])
      const capture = outputCapture()

      expect(runStoryValidation(root, capture.output)).toBe(0)
      expect(capture.lines.join('\n')).toContain('Validated 2 Story Packs.')
      expect(capture.lines.join('\n')).toContain('PASS alpha-story')
      expect(capture.lines.join('\n')).toContain('PASS beta-story')
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  it('returns exit 1 and concise stable diagnostics for an invalid directory', () => {
    const root = mkdtempSync(join(tmpdir(), 'storyforge-validator-invalid-'))
    try {
      writePack(root, 'broken-story', [
        { id: 'start', type: 'narrative', content: [{ id: 'start-text', type: 'paragraph', text: 'Start' }], next: 'missing' },
      ])
      const capture = outputCapture()

      expect(runStoryValidation(root, capture.output)).toBe(1)
      expect(capture.lines.join('\n')).toContain('FAIL broken-story')
      expect(capture.lines.join('\n')).toContain('[TARGET_NOT_FOUND]')
      expect(capture.lines.join('\n')).toContain('Story validation failed:')
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  it('allows a text-only Story Pack without an assets directory', () => {
    const root = mkdtempSync(join(tmpdir(), 'storyforge-validator-text-'))
    try {
      writePack(root, 'text-story', [
        { id: 'start', type: 'narrative', content: [{ id: 'start-text', type: 'paragraph', text: 'Start' }], next: 'ending' },
        { id: 'ending', type: 'ending', content: [{ id: 'ending-text', type: 'paragraph', text: 'End' }] },
      ], 'start', { createAssetsDir: false })
      const capture = outputCapture()

      expect(runStoryValidation(root, capture.output)).toBe(0)
      expect(capture.lines.join('\n')).toContain('PASS text-story')
      expect(capture.lines.join('\n')).toContain('assets: 0')
      expect(loadStoryPackDirectory(join(root, 'text-story')).source.assets).toEqual({})
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  it('rejects a wrong logical key even when the physical file exists', () => {
    const root = mkdtempSync(join(tmpdir(), 'storyforge-validator-wrong-key-'))
    try {
      writePack(root, 'wrong-key-story', [
        { id: 'start', type: 'narrative', content: [{ id: 'illustration', type: 'illustration', asset: 'foo.svg', alt: 'Foo', width: 1, height: 1 }], next: 'ending' },
        { id: 'ending', type: 'ending', content: [{ id: 'ending-text', type: 'paragraph', text: 'End' }] },
      ], 'start', { assetFiles: ['foo.svg'] })
      const capture = outputCapture()

      expect(runStoryValidation(root, capture.output)).toBe(1)
      expect(capture.lines.join('\n')).toContain('[ASSET_NOT_FOUND]')
      expect(loadStoryPackDirectory(join(root, 'wrong-key-story')).source.assets).toEqual({ foo: 'assets/foo.svg' })
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  it('accepts the canonical logical key for a physical asset', () => {
    const root = mkdtempSync(join(tmpdir(), 'storyforge-validator-correct-key-'))
    try {
      writePack(root, 'correct-key-story', [
        { id: 'start', type: 'narrative', content: [{ id: 'illustration', type: 'illustration', asset: 'foo', alt: 'Foo', width: 1, height: 1 }], next: 'ending' },
        { id: 'ending', type: 'ending', content: [{ id: 'ending-text', type: 'paragraph', text: 'End' }] },
      ], 'start', { assetFiles: ['foo.svg'] })
      const capture = outputCapture()

      expect(runStoryValidation(root, capture.output)).toBe(0)
      expect(capture.lines.join('\n')).toContain('PASS correct-key-story')
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  it('rejects an illustration when the assets directory is absent', () => {
    const root = mkdtempSync(join(tmpdir(), 'storyforge-validator-no-assets-'))
    try {
      writePack(root, 'illustrated-story', [
        { id: 'start', type: 'narrative', content: [{ id: 'illustration', type: 'illustration', asset: 'foo', alt: 'Foo', width: 1, height: 1 }], next: 'ending' },
        { id: 'ending', type: 'ending', content: [{ id: 'ending-text', type: 'paragraph', text: 'End' }] },
      ], 'start', { createAssetsDir: false })
      const capture = outputCapture()

      expect(runStoryValidation(root, capture.output)).toBe(1)
      expect(capture.lines.join('\n')).toContain('[ASSET_NOT_FOUND]')
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  it('rejects canonical asset-key collisions without silently overwriting', () => {
    const root = mkdtempSync(join(tmpdir(), 'storyforge-validator-collision-'))
    try {
      writePack(root, 'collision-story', [
        { id: 'start', type: 'narrative', content: [{ id: 'illustration', type: 'illustration', asset: 'foo', alt: 'Foo', width: 1, height: 1 }], next: 'ending' },
        { id: 'ending', type: 'ending', content: [{ id: 'ending-text', type: 'paragraph', text: 'End' }] },
      ], 'start', { assetFiles: ['foo.svg', 'foo.png'] })
      const capture = outputCapture()

      expect(runStoryValidation(root, capture.output)).toBe(1)
      expect(capture.lines.join('\n')).toContain('[ASSET_KEY_COLLISION]')
      expect(capture.lines.join('\n')).toContain('assets: 2')
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
})
