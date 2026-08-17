import { describe, expect, it } from 'vitest'
import {
  createReaderMemoryEnvelope,
  loadReaderMemory,
  readerMemoryKey,
  saveReaderMemory,
  type ReaderMemoryIdentity,
  type ReaderMemoryStorage,
} from './readerMemory'

const identity: ReaderMemoryIdentity = {
  storyId: 'memory/story',
  storyVersion: '0.1.0',
  schemaVersion: '0.1',
}

class MemoryStorage implements ReaderMemoryStorage {
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

describe('Reader Memory persistence', () => {
  it('uses the encoded per-story key and roundtrips a versioned envelope', () => {
    const storage = new MemoryStorage()
    const envelope = createReaderMemoryEnvelope(identity, { 'saw-signal': true })

    expect(saveReaderMemory(storage, envelope)).toEqual({ ok: true })
    expect([...storage.values.keys()]).toEqual([readerMemoryKey(identity.storyId)])
    expect(loadReaderMemory(storage, identity)).toEqual({ status: 'valid', envelope })
  })

  it('returns fresh memory for missing, malformed, invalid, or incompatible saves', () => {
    const storage = new MemoryStorage()
    const key = readerMemoryKey(identity.storyId)
    expect(loadReaderMemory(storage, identity)).toEqual({ status: 'none' })

    storage.values.set(key, '{broken')
    expect(loadReaderMemory(storage, identity)).toEqual({ status: 'invalid', reason: 'malformed' })
    expect(storage.values.has(key)).toBe(false)

    for (const memory of [{ known: false }, { known: 3 }, { '': true }]) {
      storage.values.set(key, JSON.stringify({ ...createReaderMemoryEnvelope(identity, {}), memory }))
      expect(loadReaderMemory(storage, identity)).toEqual({ status: 'invalid', reason: 'envelope' })
      expect(storage.values.has(key)).toBe(false)
    }

    storage.values.set(key, JSON.stringify({ ...createReaderMemoryEnvelope(identity, { known: true }), storyVersion: '0.2.0' }))
    expect(loadReaderMemory(storage, identity)).toEqual({ status: 'invalid', reason: 'incompatible' })
    expect(storage.values.has(key)).toBe(false)
  })

  it('reports storage failures without throwing', () => {
    const storage = new MemoryStorage()
    storage.shouldThrowOnGet = true
    expect(loadReaderMemory(storage, identity)).toEqual({ status: 'error' })

    storage.shouldThrowOnGet = false
    storage.shouldThrowOnSet = true
    expect(saveReaderMemory(storage, createReaderMemoryEnvelope(identity, { known: true }))).toEqual({ ok: false })
  })
})
