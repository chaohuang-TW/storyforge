import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { describe, expect, it } from 'vitest'
import { runStoryValidation } from './validate-stories.mjs'

function writePack(root, name, nodes, entryNode = 'start') {
  const packRoot = join(root, name)
  mkdirSync(join(packRoot, 'nodes'), { recursive: true })
  mkdirSync(join(packRoot, 'assets'), { recursive: true })
  writeFileSync(join(packRoot, 'manifest.json'), JSON.stringify({
    id: name,
    title: name,
    version: '0.1.0',
    schemaVersion: '0.1',
    language: 'zh-TW',
    entryNode,
  }))
  nodes.forEach((node, index) => writeFileSync(join(packRoot, 'nodes', `${String(index).padStart(2, '0')}.json`), JSON.stringify(node)))
}

function outputCapture() {
  const lines = []
  return { output: { log: (line) => lines.push(String(line)) }, lines }
}

describe('Story validator CLI', () => {
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
})
