import { copyReaderMemory, validateReaderMemory } from '../engine/memory/readerMemory'
import type { ReaderMemory } from '../engine/memory/types'

export interface ReaderMemoryStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export type ReaderMemoryIdentity = {
  storyId: string
  storyVersion: string
  schemaVersion: string
}

export type ReaderMemoryEnvelope = ReaderMemoryIdentity & {
  formatVersion: 1
  memory: ReaderMemory
}

export type ReaderMemoryLoadResult =
  | { status: 'none' }
  | { status: 'valid'; envelope: ReaderMemoryEnvelope }
  | { status: 'invalid'; reason: 'malformed' | 'envelope' | 'incompatible' }
  | { status: 'error' }

export type ReaderMemoryWriteResult = { ok: true } | { ok: false }

export function readerMemoryKey(storyId: string): string {
  return `storyforge.memory.${encodeURIComponent(storyId)}`
}

export function createReaderMemoryEnvelope(
  identity: ReaderMemoryIdentity,
  memory: ReaderMemory,
): ReaderMemoryEnvelope {
  return {
    formatVersion: 1,
    storyId: identity.storyId,
    storyVersion: identity.storyVersion,
    schemaVersion: identity.schemaVersion,
    memory: copyReaderMemory(memory),
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isReaderMemoryEnvelope(value: unknown): value is ReaderMemoryEnvelope {
  if (!isRecord(value)) return false
  if (
    value.formatVersion !== 1 ||
    typeof value.storyId !== 'string' ||
    typeof value.storyVersion !== 'string' ||
    typeof value.schemaVersion !== 'string' ||
    !isRecord(value.memory)
  ) return false

  try {
    validateReaderMemory(value.memory)
  } catch {
    return false
  }
  return true
}

function discardMemory(storage: ReaderMemoryStorage, key: string): void {
  try {
    storage.removeItem(key)
  } catch {
    // Corrupt memory must never block a fresh Story runtime.
  }
}

export function loadReaderMemory(
  storage: ReaderMemoryStorage,
  identity: ReaderMemoryIdentity,
): ReaderMemoryLoadResult {
  const key = readerMemoryKey(identity.storyId)
  let raw: string | null
  try {
    raw = storage.getItem(key)
  } catch {
    return { status: 'error' }
  }
  if (raw === null) return { status: 'none' }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    discardMemory(storage, key)
    return { status: 'invalid', reason: 'malformed' }
  }
  if (!isReaderMemoryEnvelope(parsed)) {
    discardMemory(storage, key)
    return { status: 'invalid', reason: 'envelope' }
  }
  if (
    parsed.storyId !== identity.storyId ||
    parsed.storyVersion !== identity.storyVersion ||
    parsed.schemaVersion !== identity.schemaVersion
  ) {
    discardMemory(storage, key)
    return { status: 'invalid', reason: 'incompatible' }
  }

  return { status: 'valid', envelope: createReaderMemoryEnvelope(identity, parsed.memory) }
}

export function saveReaderMemory(
  storage: ReaderMemoryStorage,
  envelope: ReaderMemoryEnvelope,
): ReaderMemoryWriteResult {
  try {
    storage.setItem(readerMemoryKey(envelope.storyId), JSON.stringify(createReaderMemoryEnvelope(
      {
        storyId: envelope.storyId,
        storyVersion: envelope.storyVersion,
        schemaVersion: envelope.schemaVersion,
      },
      envelope.memory,
    )))
    return { ok: true }
  } catch {
    return { ok: false }
  }
}

export function getBrowserReaderMemoryStorage(): ReaderMemoryStorage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage
  } catch {
    return null
  }
}
