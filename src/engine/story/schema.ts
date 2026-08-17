import type {
  Condition,
  ChoiceStoryNode,
  ConditionalStoryNode,
  EndingStoryNode,
  Effect,
  NarrativeStoryNode,
  StoryContent,
  StoryManifest,
  StoryNode,
  StoryChoice,
} from './types'
import type { StateValue } from '../causality/types'

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

function stateValue(value: unknown, label: string): StateValue {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value
  if (typeof value === 'number' && Number.isFinite(value)) return value
  throw new StoryLoadError(`${label} must be a JSON-safe primitive value`)
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

export function parseCondition(value: unknown, label = 'condition'): Condition {
  const source = record(value, label)
  const type = string(source.type, `${label}.type`)

  switch (type) {
    case 'equals':
      return { type, key: string(source.key, `${label}.key`), value: stateValue(source.value, `${label}.value`) }
    case 'notEquals':
      return { type, key: string(source.key, `${label}.key`), value: stateValue(source.value, `${label}.value`) }
    case 'greaterThan':
    case 'greaterThanOrEqual':
    case 'lessThan':
    case 'lessThanOrEqual':
      return { type, key: string(source.key, `${label}.key`), value: number(source.value, `${label}.value`) }
    case 'exists':
      return { type, key: string(source.key, `${label}.key`) }
    case 'notExists':
      return { type, key: string(source.key, `${label}.key`) }
    case 'hasFlag':
      return { type, key: string(source.key, `${label}.key`) }
    case 'notFlag':
      return { type, key: string(source.key, `${label}.key`) }
    case 'readerRemembers':
      return { type, key: string(source.key, `${label}.key`) }
    case 'all':
    case 'any': {
      if (!Array.isArray(source.conditions) || source.conditions.length === 0) {
        throw new StoryLoadError(`${label}.conditions must contain at least one condition`)
      }
      return { type, conditions: source.conditions.map((nested, index) => parseCondition(nested, `${label}.conditions[${index}]`)) }
    }
    default:
      throw new StoryLoadError(`Unsupported condition type: ${type}`)
  }
}

export function parseEffect(value: unknown, label = 'effect'): Effect {
  const source = record(value, label)
  const type = string(source.type, `${label}.type`)

  switch (type) {
    case 'set':
      return { type, key: string(source.key, `${label}.key`), value: stateValue(source.value, `${label}.value`) }
    case 'increment':
    case 'decrement':
      return {
        type,
        key: string(source.key, `${label}.key`),
        amount: source.amount === undefined ? undefined : number(source.amount, `${label}.amount`),
      }
    case 'setFlag':
      return { type, key: string(source.key, `${label}.key`) }
    case 'clearFlag':
      return { type, key: string(source.key, `${label}.key`) }
    case 'remember':
      return { type, key: string(source.key, `${label}.key`) }
    default:
      throw new StoryLoadError(`Unsupported effect type: ${type}`)
  }
}

function parseEffects(value: unknown, label: string): Effect[] | undefined {
  if (value === undefined) return undefined
  if (!Array.isArray(value)) throw new StoryLoadError(`${label} must be an array`)
  return value.map((effect, index) => parseEffect(effect, `${label}[${index}]`))
}

function parseChoiceConditions(value: unknown, label: string): Condition[] | undefined {
  if (value === undefined) return undefined
  if (!Array.isArray(value) || value.length === 0) {
    throw new StoryLoadError(`${label} must contain at least one condition`)
  }
  return value.map((condition, index) => parseCondition(condition, `${label}[${index}]`))
}

function parseStoryChoice(value: unknown, nodeId: string, index: number): StoryChoice {
  const label = `Choice node ${nodeId}.choices[${index}]`
  const source = record(value, label)
  return {
    id: string(source.id, `${label}.id`),
    label: string(source.label, `${label}.label`),
    conditions: parseChoiceConditions(source.conditions, `${label}.conditions`),
    effects: parseEffects(source.effects, `${label}.effects`),
    next: string(source.next, `${label}.next`),
  }
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
  const type = string(source.type, 'node.type')

  if (type === 'narrative') {
    const title = optionalString(source.title, 'node.title')
    const content = parseContentList(source.content)
    return { id, type, title, content, effects: parseEffects(source.effects, `node ${id}.effects`), next: string(source.next, `node ${id}.next`) } satisfies NarrativeStoryNode
  }
  if (type === 'ending') {
    const title = optionalString(source.title, 'node.title')
    const content = parseContentList(source.content)
    if ('next' in source) throw new StoryLoadError(`Ending node ${id} must not define next`)
    return { id, type, title, content, effects: parseEffects(source.effects, `node ${id}.effects`) } satisfies EndingStoryNode
  }
  if (type === 'conditional') {
    if ('content' in source) throw new StoryLoadError(`Conditional node ${id} must not define content`)
    if ('effects' in source) throw new StoryLoadError(`Conditional node ${id} must not define effects`)
    if ('title' in source) throw new StoryLoadError(`Conditional node ${id} must not define title`)
    if ('next' in source) throw new StoryLoadError(`Conditional node ${id} must not define next`)
    if (!Array.isArray(source.branches) || source.branches.length === 0) {
      throw new StoryLoadError(`Conditional node ${id}.branches must contain at least one branch`)
    }
    const branches = source.branches.map((branch, index) => {
      const parsed = record(branch, `node ${id}.branches[${index}]`)
      return {
        when: parseCondition(parsed.when, `node ${id}.branches[${index}].when`),
        next: string(parsed.next, `node ${id}.branches[${index}].next`),
      }
    })
    const parsedNode: ConditionalStoryNode = {
      id,
      type,
      branches,
      fallback: string(source.fallback, `node ${id}.fallback`),
    }
    return parsedNode
  }
  if (type === 'choice') {
    for (const forbiddenField of ['content', 'effects', 'title', 'next'] as const) {
      if (forbiddenField in source) throw new StoryLoadError(`Choice node ${id} must not define ${forbiddenField}`)
    }
    if (!Array.isArray(source.choices) || source.choices.length === 0) {
      throw new StoryLoadError(`Choice node ${id}.choices must contain at least one choice`)
    }
    const choices = source.choices.map((choice, index) => parseStoryChoice(choice, id, index))
    const choiceIds = new Set<string>()
    for (const choice of choices) {
      if (choiceIds.has(choice.id)) {
        throw new StoryLoadError(`Choice node ${id} has duplicate choice id: ${choice.id}`)
      }
      choiceIds.add(choice.id)
    }
    return {
      id,
      type,
      prompt: optionalString(source.prompt, `Choice node ${id}.prompt`),
      choices,
    } satisfies ChoiceStoryNode
  }
  throw new StoryLoadError(`Unsupported story node type: ${type}`)
}
