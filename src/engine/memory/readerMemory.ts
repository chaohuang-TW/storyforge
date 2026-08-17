import { StoryRuntimeError } from '../runtime/errors'
import type { ReaderMemory } from './types'

export function createReaderMemory(): ReaderMemory {
  return {}
}

export function validateReaderMemory(value: unknown): asserts value is ReaderMemory {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new StoryRuntimeError('Reader Memory must be an object')
  }

  for (const [key, memoryValue] of Object.entries(value)) {
    if (key.length === 0) throw new StoryRuntimeError('Reader Memory keys must be non-empty strings')
    if (memoryValue !== true) throw new StoryRuntimeError(`Reader Memory key "${key}" must contain true`)
  }
}

export function copyReaderMemory(memory: ReaderMemory): ReaderMemory {
  validateReaderMemory(memory)
  return { ...memory }
}

export function remember(memory: ReaderMemory, key: string): ReaderMemory {
  if (typeof key !== 'string' || key.length === 0) {
    throw new StoryRuntimeError('Reader Memory key must be a non-empty string')
  }
  return { ...copyReaderMemory(memory), [key]: true }
}

export function readerRemembers(memory: ReaderMemory, key: string): boolean {
  if (typeof key !== 'string' || key.length === 0) {
    throw new StoryRuntimeError('Reader Memory key must be a non-empty string')
  }
  return memory[key] === true
}
