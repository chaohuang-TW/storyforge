import { describe, expect, it } from 'vitest'
import {
  createStoryBookmarkEnvelope,
  loadStoryBookmark,
  removeStoryBookmark,
  saveStoryBookmark,
  storyBookmarkKey,
  type StoryBookmarkIdentity,
} from './storyBookmark'
import type { RuntimeStorage } from './runtimeSave'

const identity: StoryBookmarkIdentity = {
  storyId: 'harbor-letter',
  storyVersion: '0.1.0',
  schemaVersion: '0.1',
}

const location = {
  documentId: 'story:harbor-letter',
  markerId: 'wind-path-heading',
  progress: 48,
}

class MemoryStorage implements RuntimeStorage {
  readonly values = new Map<string, string>()
  shouldThrowOnGet = false
  shouldThrowOnSet = false
  shouldThrowOnRemove = false

  getItem(key: string): string | null {
    if (this.shouldThrowOnGet) throw new Error('get failed')
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    if (this.shouldThrowOnSet) throw new Error('set failed')
    this.values.set(key, value)
  }

  removeItem(key: string): void {
    if (this.shouldThrowOnRemove) throw new Error('remove failed')
    this.values.delete(key)
  }
}

describe('story bookmark manager', () => {
  it('roundtrips one versioned Reader location per Story Pack', () => {
    const storage = new MemoryStorage()
    const envelope = createStoryBookmarkEnvelope(identity, location)

    expect(saveStoryBookmark(storage, envelope)).toEqual({ ok: true })
    expect([...storage.values.keys()]).toEqual([storyBookmarkKey(identity.storyId)])
    expect(loadStoryBookmark(storage, identity)).toEqual({ status: 'valid', envelope })
    expect(JSON.parse(storage.values.get(storyBookmarkKey(identity.storyId)) ?? '{}')).toEqual(envelope)
  })

  it('never serializes runtime, World State, Choice, content, or effect payloads', () => {
    const storage = new MemoryStorage()
    saveStoryBookmark(storage, createStoryBookmarkEnvelope(identity, location))
    const payload = JSON.parse(storage.values.get(storyBookmarkKey(identity.storyId)) ?? '{}')

    expect(payload).not.toHaveProperty('snapshot')
    expect(payload).not.toHaveProperty('worldState')
    expect(payload).not.toHaveProperty('choiceHistory')
    expect(payload).not.toHaveProperty('pendingChoiceNodeId')
    expect(payload).not.toHaveProperty('content')
    expect(payload).not.toHaveProperty('html')
    expect(payload).not.toHaveProperty('svg')
    expect(payload).not.toHaveProperty('effects')
    expect(Object.keys(payload)).toEqual(['formatVersion', 'storyId', 'storyVersion', 'schemaVersion', 'location'])
  })

  it.each([
    ['formatVersion', { formatVersion: 999 }, 'envelope'],
    ['storyId', { storyId: 'other-story' }, 'incompatible'],
    ['storyVersion', { storyVersion: '0.2.0' }, 'incompatible'],
    ['schemaVersion', { schemaVersion: '0.2' }, 'incompatible'],
  ])('rejects incompatible %s bookmarks', (_label, override, reason) => {
    const storage = new MemoryStorage()
    storage.values.set(
      storyBookmarkKey(identity.storyId),
      JSON.stringify({ ...createStoryBookmarkEnvelope(identity, location), ...override }),
    )

    expect(loadStoryBookmark(storage, identity)).toEqual({ status: 'invalid', reason })
    expect(storage.values.has(storyBookmarkKey(identity.storyId))).toBe(false)
  })

  it('removes malformed and structurally invalid payloads', () => {
    const storage = new MemoryStorage()
    const key = storyBookmarkKey(identity.storyId)
    storage.values.set(key, '{broken JSON !!!')
    expect(loadStoryBookmark(storage, identity)).toEqual({ status: 'invalid', reason: 'malformed' })
    expect(storage.values.has(key)).toBe(false)

    storage.values.set(key, JSON.stringify({ formatVersion: 1, storyId: identity.storyId }))
    expect(loadStoryBookmark(storage, identity)).toEqual({ status: 'invalid', reason: 'envelope' })
    expect(storage.values.has(key)).toBe(false)
  })

  it('reports get, set, and remove storage failures without throwing', () => {
    const storage = new MemoryStorage()
    storage.shouldThrowOnGet = true
    expect(loadStoryBookmark(storage, identity)).toEqual({ status: 'error' })

    storage.shouldThrowOnGet = false
    storage.shouldThrowOnSet = true
    expect(saveStoryBookmark(storage, createStoryBookmarkEnvelope(identity, location))).toEqual({ ok: false })

    storage.shouldThrowOnSet = false
    storage.shouldThrowOnRemove = true
    expect(removeStoryBookmark(storage, identity.storyId)).toBe(false)
  })

  it('removes a bookmark through the encoded per-story key', () => {
    const storage = new MemoryStorage()
    saveStoryBookmark(storage, createStoryBookmarkEnvelope(identity, location))
    expect(removeStoryBookmark(storage, identity.storyId)).toBe(true)
    expect(storage.values.has(storyBookmarkKey(identity.storyId))).toBe(false)
  })
})
