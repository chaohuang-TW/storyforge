import type {
  EndingStoryNode,
  NarrativeStoryNode,
  StoryContent,
  StoryManifest,
  StoryNode,
} from './types'

export class StoryLoadError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'StoryLoadError'
  }
}

type UnknownRecord = Record<string, unknown>

function record(value: unknown, label: string): UnknownRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new StoryLoadError(`${label} must be an object`)
  return value as UnknownRecord
}

function string(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.length === 0) throw new StoryLoadError(`${label} must be a non-empty string`)
  return value
}

function optionalString(value: unknown, label: string): string | undefined {
  if (value === undefined) return undefined
  return string(value, label)
}

function number(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new StoryLoadError(`${label} must be a number`)
  return value
}

function contentId(source: UnknownRecord, label: string) {
  return string(source.id, `${label}.id`)
}

function parseContent(value: unknown, index: number): StoryContent {
  const source = record(value, `content[${index}]`)
  const type = string(source.type, `content[${index}].type`)
  const id = contentId(source, `content[${index}]`)

  switch (type) {
    case 'heading': {
      const level = source.level
      if (level !== 2 && level !== 3) throw new StoryLoadError(`content[${index}].level must be 2 or 3`)
      return { id, type, level, text: string(source.text, `content[${index}].text`), kicker: optionalString(source.kicker, `content[${index}].kicker`) }
    }
    case 'paragraph':
      return { id, type, text: string(source.text, `content[${index}].text`) }
    case 'dialogue': {
      if (!Array.isArray(source.lines) || source.lines.some((line) => typeof line !== 'string')) {
        throw new StoryLoadError(`content[${index}].lines must be a string array`)
      }
      return { id, type, lines: source.lines }
    }
    case 'illustration': {
      const variant = source.variant
      if (variant !== undefined && variant !== 'normal' && variant !== 'full-bleed') {
        throw new StoryLoadError(`content[${index}].variant must be normal or full-bleed`)
      }
      return {
        id,
        type,
        asset: string(source.asset, `content[${index}].asset`),
        alt: string(source.alt, `content[${index}].alt`),
        caption: optionalString(source.caption, `content[${index}].caption`),
        variant,
        width: number(source.width, `content[${index}].width`),
        height: number(source.height, `content[${index}].height`),
      }
    }
    case 'quote':
      return { id, type, text: string(source.text, `content[${index}].text`), attribution: optionalString(source.attribution, `content[${index}].attribution`) }
    case 'divider':
      return { id, type }
    default:
      throw new StoryLoadError(`Unsupported story content type: ${type}`)
  }
}

function parseContentList(value: unknown): StoryContent[] {
  if (!Array.isArray(value)) throw new StoryLoadError('node.content must be an array')
  return value.map(parseContent)
}

export function parseStoryManifest(value: unknown): StoryManifest {
  const source = record(value, 'manifest')
  const id = string(source.id, 'manifest.id')
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) throw new StoryLoadError('manifest.id must be kebab-case')
  if (source.schemaVersion !== '0.1') throw new StoryLoadError('manifest.schemaVersion must be 0.1')
  return {
    id,
    title: string(source.title, 'manifest.title'),
    version: string(source.version, 'manifest.version'),
    schemaVersion: '0.1',
    language: string(source.language, 'manifest.language'),
    entryNode: string(source.entryNode, 'manifest.entryNode'),
  }
}

export function parseStoryNode(value: unknown): StoryNode {
  const source = record(value, 'node')
  const id = string(source.id, 'node.id')
  const title = optionalString(source.title, 'node.title')
  const content = parseContentList(source.content)
  const type = string(source.type, 'node.type')

  if (type === 'narrative') {
    return { id, type, title, content, next: string(source.next, `node ${id}.next`) } satisfies NarrativeStoryNode
  }
  if (type === 'ending') {
    if ('next' in source) throw new StoryLoadError(`Ending node ${id} must not define next`)
    return { id, type, title, content } satisfies EndingStoryNode
  }
  throw new StoryLoadError(`Unsupported story node type: ${type}`)
}
