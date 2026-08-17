import { describe, expect, it } from 'vitest'
import { runtimeDemoPack } from '../../app/storyPacks/runtimeDemo'
import type { StoryPackSource } from './types'
import { validateStoryPack } from './validator'

const manifest = (entryNode = 'start') => ({
  id: 'fixture-story',
  title: 'Fixture Story',
  version: '0.1.0',
  schemaVersion: '0.1',
  language: 'zh-TW',
  entryNode,
})

const paragraph = (id: string) => ({ id: `${id}-content`, type: 'paragraph', text: id })
const illustration = (asset: string) => ({ id: 'illustration', type: 'illustration', asset, alt: asset, width: 1, height: 1 })
const narrative = (id: string, next: string, content: unknown[] = [paragraph(id)]) => ({ id, type: 'narrative', content, next })
const ending = (id = 'ending') => ({ id, type: 'ending', content: [paragraph(id)] })
const source = (nodes: unknown[], entryNode = 'start', assets?: Record<string, string>): StoryPackSource => ({
  manifest: manifest(entryNode),
  nodes,
  assets,
})

const codes = (pack: StoryPackSource) => validateStoryPack(pack).issues.map((validationIssue) => validationIssue.code)

describe('Story Pack validator', () => {
  it('accepts the current production Story Pack', () => {
    const result = validateStoryPack(runtimeDemoPack)

    expect(result).toEqual({ valid: true, issues: [] })
  })

  it('rejects duplicate node IDs', () => {
    expect(codes(source([narrative('start', 'ending'), ending(), ending('start')]))).toContain('DUPLICATE_NODE_ID')
  })

  it('rejects a missing manifest entry node', () => {
    expect(codes(source([ending()], 'missing-entry'))).toContain('ENTRY_NOT_FOUND')
  })

  it('rejects a missing narrative target', () => {
    const result = validateStoryPack(source([narrative('start', 'missing-target'), ending()]))

    expect(result.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'TARGET_NOT_FOUND', nodeId: 'start', path: 'nodes.start.next' }),
    ]))
  })

  it('rejects every missing Choice target', () => {
    const pack = source([
      {
        id: 'start',
        type: 'choice',
        choices: [
          { id: 'first', label: 'First', next: 'missing-first' },
          { id: 'second', label: 'Second', next: 'missing-second' },
        ],
      },
      ending(),
    ])

    const result = validateStoryPack(pack)
    expect(result.issues.filter((validationIssue) => validationIssue.code === 'TARGET_NOT_FOUND')).toHaveLength(2)
    expect(result.issues.map((validationIssue) => validationIssue.path)).toEqual(expect.arrayContaining([
      'nodes.start.choices[0].next',
      'nodes.start.choices[1].next',
    ]))
  })

  it('rejects missing Conditional branch and fallback targets', () => {
    const pack = source([
      {
        id: 'start',
        type: 'conditional',
        branches: [{ when: { type: 'exists', key: 'ready' }, next: 'missing-branch' }],
        fallback: 'missing-fallback',
      },
      ending(),
    ])

    const result = validateStoryPack(pack)
    expect(result.issues.filter((validationIssue) => validationIssue.code === 'TARGET_NOT_FOUND')).toHaveLength(2)
  })

  it('rejects unreachable nodes', () => {
    const result = validateStoryPack(source([narrative('start', 'ending'), ending(), ending('orphan-node')]))

    expect(result.issues).toContainEqual(expect.objectContaining({ code: 'NODE_UNREACHABLE', nodeId: 'orphan-node' }))
  })

  it('rejects structural cycles without hanging', () => {
    const result = validateStoryPack(source([narrative('start', 'middle'), narrative('middle', 'last'), narrative('last', 'start')]))

    expect(result.issues).toContainEqual(expect.objectContaining({ code: 'GRAPH_CYCLE' }))
    expect(result.issues).toContainEqual(expect.objectContaining({ code: 'NO_REACHABLE_ENDING' }))
    expect(result.issues.find((validationIssue) => validationIssue.code === 'GRAPH_CYCLE')?.message).toContain('start')
  })

  it('rejects non-ending dead ends', () => {
    const result = validateStoryPack(source([narrative('start', 'missing')]))

    expect(result.issues).toContainEqual(expect.objectContaining({ code: 'NON_ENDING_DEAD_END', nodeId: 'start' }))
  })

  it('requires a structurally reachable ending', () => {
    const result = validateStoryPack(source([narrative('start', 'middle'), narrative('middle', 'start')]))

    expect(result.issues).toContainEqual(expect.objectContaining({ code: 'NO_REACHABLE_ENDING' }))
  })

  it('rejects a missing exact Story asset key', () => {
    const result = validateStoryPack(source([narrative('start', 'ending', [illustration('missing')]), ending()], 'start', { present: '/whatever' }))

    expect(result.issues).toContainEqual(expect.objectContaining({ code: 'ASSET_NOT_FOUND', path: 'nodes.start.content[0].asset' }))
  })

  it('accepts an exact Runtime asset key', () => {
    const result = validateStoryPack(source([narrative('start', 'ending', [illustration('foo')]), ending()], 'start', { foo: '/resolved/foo.svg' }))

    expect(result).toEqual({ valid: true, issues: [] })
  })

  it('rejects a physical-file extension alias', () => {
    const result = validateStoryPack(source([narrative('start', 'ending', [illustration('foo.svg')]), ending()], 'start', { foo: '/resolved/foo.svg' }))

    expect(result.issues).toContainEqual(expect.objectContaining({ code: 'ASSET_NOT_FOUND' }))
  })

  it('does not fall back to a filename or stem from another logical key', () => {
    const result = validateStoryPack(source([narrative('start', 'ending', [illustration('foo')]), ending()], 'start', { 'chapter/foo': '/resolved/foo.svg' }))

    expect(result.issues).toContainEqual(expect.objectContaining({ code: 'ASSET_NOT_FOUND' }))
  })

  it('rejects a URL-looking key when it is absent from the asset map', () => {
    const result = validateStoryPack(source([narrative('start', 'ending', [illustration('https://example.com/foo.png')]), ending()], 'start', {}))

    expect(result.issues).toContainEqual(expect.objectContaining({ code: 'ASSET_NOT_FOUND' }))
  })

  it('accepts an exact URL-looking logical key when Runtime can resolve it', () => {
    const result = validateStoryPack(source(
      [narrative('start', 'ending', [illustration('https://example.com/foo.png')]), ending()],
      'start',
      { 'https://example.com/foo.png': '/resolved/runtime-value' },
    ))

    expect(result).toEqual({ valid: true, issues: [] })
  })

  it('rejects Story-local asset path escape', () => {
    const content = [{ id: 'illustration', type: 'illustration', asset: '../../README.md', alt: 'Escape', width: 1, height: 1 }]
    const result = validateStoryPack(source([narrative('start', 'ending', content), ending()], 'start', { 'README.md': '/resolved/README.md' }))

    expect(result.issues).toContainEqual(expect.objectContaining({ code: 'ASSET_PATH_ESCAPE' }))
  })

  it('rejects invalid Conditions and Effects through the existing schema parser', () => {
    const invalidCondition = source([{
      id: 'start',
      type: 'choice',
      choices: [{ id: 'choice', label: 'Choice', conditions: [{ type: 'unknown' }], next: 'ending' }],
    }, ending()])
    const invalidEffect = source([narrative('start', 'ending', [paragraph('start')]), ending()])
    ;(invalidEffect.nodes[0] as Record<string, unknown>).effects = [{ type: 'unlock', key: 'secret' }]

    expect(codes(invalidCondition)).toContain('SCHEMA_INVALID')
    expect(codes(invalidEffect)).toContain('SCHEMA_INVALID')
  })

  it('rejects unsupported schema versions', () => {
    const pack = source([ending()])
    ;(pack.manifest as Record<string, unknown>).schemaVersion = '999'

    expect(codes(pack)).toContain('SCHEMA_VERSION_UNSUPPORTED')
  })

  it('orders identical diagnostics deterministically', () => {
    const pack = source([narrative('start', 'missing'), ending('orphan')])

    expect(validateStoryPack(pack)).toEqual(validateStoryPack(pack))
  })
})
