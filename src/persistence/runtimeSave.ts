import type { StoryRuntimeSnapshot } from '../engine/runtime/runtimeSnapshot'

export interface RuntimeStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export type RuntimeSaveIdentity = {
  storyId: string
  storyVersion: string
  schemaVersion: string
}

export type RuntimeSaveEnvelope = RuntimeSaveIdentity & {
  formatVersion: 1
  snapshot: StoryRuntimeSnapshot
}

export type RuntimeSaveLoadResult =
  | { status: 'none' }
  | { status: 'valid'; envelope: RuntimeSaveEnvelope }
  | { status: 'invalid'; reason: 'malformed' | 'envelope' | 'incompatible' }
  | { status: 'error' }

export type RuntimeSaveWriteResult = { ok: true } | { ok: false }

export function runtimeStorageKey(storyId: string): string {
  return `storyforge.runtime.${encodeURIComponent(storyId)}`
}

export function createRuntimeSaveEnvelope(
  identity: RuntimeSaveIdentity,
  snapshot: StoryRuntimeSnapshot,
): RuntimeSaveEnvelope {
  return {
    formatVersion: 1,
    storyId: identity.storyId,
    storyVersion: identity.storyVersion,
    schemaVersion: identity.schemaVersion,
    snapshot,
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function hasBasicSnapshotShape(value: unknown): boolean {
  if (!isRecord(value)) return false
  return (
    typeof value.currentNodeId === 'string' &&
    Array.isArray(value.visibleNodeIds) &&
    value.visibleNodeIds.every((nodeId) => typeof nodeId === 'string') &&
    isRecord(value.worldState) &&
    Array.isArray(value.choiceHistory)
  )
}

function isRuntimeSaveEnvelope(value: unknown): value is RuntimeSaveEnvelope {
  if (!isRecord(value)) return false
  return (
    value.formatVersion === 1 &&
    typeof value.storyId === 'string' &&
    typeof value.storyVersion === 'string' &&
    typeof value.schemaVersion === 'string' &&
    hasBasicSnapshotShape(value.snapshot)
  )
}

function discardSave(storage: RuntimeStorage, key: string): void {
  try {
    storage.removeItem(key)
  } catch {
    // A corrupt save should never prevent a fresh runtime from starting.
  }
}

export function loadRuntimeSave(storage: RuntimeStorage, identity: RuntimeSaveIdentity): RuntimeSaveLoadResult {
  const key = runtimeStorageKey(identity.storyId)
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
    discardSave(storage, key)
    return { status: 'invalid', reason: 'malformed' }
  }
  if (!isRuntimeSaveEnvelope(parsed)) {
    discardSave(storage, key)
    return { status: 'invalid', reason: 'envelope' }
  }
  if (
    parsed.storyId !== identity.storyId ||
    parsed.storyVersion !== identity.storyVersion ||
    parsed.schemaVersion !== identity.schemaVersion
  ) {
    discardSave(storage, key)
    return { status: 'invalid', reason: 'incompatible' }
  }
  return { status: 'valid', envelope: parsed }
}

export function saveRuntimeSave(storage: RuntimeStorage, envelope: RuntimeSaveEnvelope): RuntimeSaveWriteResult {
  try {
    storage.setItem(runtimeStorageKey(envelope.storyId), JSON.stringify(envelope))
    return { ok: true }
  } catch {
    return { ok: false }
  }
}

export function getBrowserRuntimeStorage(): RuntimeStorage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage
  } catch {
    return null
  }
}
