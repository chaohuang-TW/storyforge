import type { ReaderLocation } from '../reader/types/reader'

interface BookmarkStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export type StoryBookmarkIdentity = {
  storyId: string
  storyVersion: string
  schemaVersion: string
}

export type StoryBookmarkEnvelope = StoryBookmarkIdentity & {
  formatVersion: 1
  location: ReaderLocation
}

export type StoryBookmarkLoadResult =
  | { status: 'none' }
  | { status: 'valid'; envelope: StoryBookmarkEnvelope }
  | { status: 'invalid'; reason: 'malformed' | 'envelope' | 'incompatible' }
  | { status: 'error' }

export type StoryBookmarkWriteResult = { ok: true } | { ok: false }

export function storyBookmarkKey(storyId: string): string {
  return `storyforge.bookmark.${encodeURIComponent(storyId)}`
}

export function createStoryBookmarkEnvelope(
  identity: StoryBookmarkIdentity,
  location: ReaderLocation,
): StoryBookmarkEnvelope {
  return {
    formatVersion: 1,
    storyId: identity.storyId,
    storyVersion: identity.storyVersion,
    schemaVersion: identity.schemaVersion,
    location: { ...location },
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isReaderLocation(value: unknown): value is ReaderLocation {
  if (!isRecord(value)) return false
  return (
    typeof value.documentId === 'string' &&
    typeof value.markerId === 'string' &&
    typeof value.progress === 'number' &&
    Number.isFinite(value.progress) &&
    value.progress >= 0 &&
    value.progress <= 100
  )
}

function isStoryBookmarkEnvelope(value: unknown): value is StoryBookmarkEnvelope {
  if (!isRecord(value)) return false
  if ('readerMemory' in value || 'memory' in value) return false
  return (
    value.formatVersion === 1 &&
    typeof value.storyId === 'string' &&
    typeof value.storyVersion === 'string' &&
    typeof value.schemaVersion === 'string' &&
    isReaderLocation(value.location)
  )
}

function discardBookmark(storage: BookmarkStorage, key: string): void {
  try {
    storage.removeItem(key)
  } catch {
    // A corrupt bookmark must never block the Reader from starting.
  }
}

export function loadStoryBookmark(
  storage: BookmarkStorage,
  identity: StoryBookmarkIdentity,
): StoryBookmarkLoadResult {
  const key = storyBookmarkKey(identity.storyId)
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
    discardBookmark(storage, key)
    return { status: 'invalid', reason: 'malformed' }
  }
  if (!isStoryBookmarkEnvelope(parsed)) {
    discardBookmark(storage, key)
    return { status: 'invalid', reason: 'envelope' }
  }
  if (
    parsed.storyId !== identity.storyId ||
    parsed.storyVersion !== identity.storyVersion ||
    parsed.schemaVersion !== identity.schemaVersion
  ) {
    discardBookmark(storage, key)
    return { status: 'invalid', reason: 'incompatible' }
  }
  return { status: 'valid', envelope: parsed }
}

export function saveStoryBookmark(
  storage: BookmarkStorage,
  envelope: StoryBookmarkEnvelope,
): StoryBookmarkWriteResult {
  try {
    storage.setItem(storyBookmarkKey(envelope.storyId), JSON.stringify(envelope))
    return { ok: true }
  } catch {
    return { ok: false }
  }
}

export function removeStoryBookmark(storage: BookmarkStorage, storyId: string): boolean {
  try {
    storage.removeItem(storyBookmarkKey(storyId))
    return true
  } catch {
    return false
  }
}
