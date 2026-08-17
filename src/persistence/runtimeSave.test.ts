import { describe, expect, it } from 'vitest'
import type { StoryRuntimeSnapshot } from '../engine/runtime/runtimeSnapshot'
import {
  createRuntimeSaveEnvelope,
  loadRuntimeSave,
  runtimeStorageKey,
  saveRuntimeSave,
  type RuntimeSaveIdentity,
  type RuntimeStorage,
} from './runtimeSave'

const identity: RuntimeSaveIdentity = {
  storyId: 'test-story',
  storyVersion: '0.1.0',
  schemaVersion: '0.1',
}

const snapshot: StoryRuntimeSnapshot = {
  currentNodeId: 'wind-path',
  visibleNodeIds: ['prologue', 'chapter-01', 'wind-path'],
  worldState: { 'state-key': true },
  choiceHistory: [{ nodeId: 'choice-node', choiceId: 'choice-id' }],
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

describe('runtime persistence save manager', () => {
  it('roundtrips a versioned envelope under a generic per-story key', () => {
    const storage = new MemoryStorage()
    const envelope = createRuntimeSaveEnvelope(identity, snapshot)

    expect(saveRuntimeSave(storage, envelope)).toEqual({ ok: true })
    expect([...storage.values.keys()]).toEqual([runtimeStorageKey(identity.storyId)])
    expect(loadRuntimeSave(storage, identity)).toEqual({ status: 'valid', envelope })
    expect(JSON.parse(storage.values.get(runtimeStorageKey(identity.storyId)) ?? '{}')).toMatchObject({
      formatVersion: 1,
      storyId: 'test-story',
      storyVersion: '0.1.0',
      schemaVersion: '0.1',
    })
  })

  it('keeps different Story Pack saves isolated', () => {
    const storage = new MemoryStorage()
    const otherIdentity = { ...identity, storyId: 'other-story' }
    saveRuntimeSave(storage, createRuntimeSaveEnvelope(identity, snapshot))
    saveRuntimeSave(storage, createRuntimeSaveEnvelope(otherIdentity, snapshot))

    expect(storage.values.size).toBe(2)
    expect(loadRuntimeSave(storage, identity).status).toBe('valid')
    expect(loadRuntimeSave(storage, otherIdentity).status).toBe('valid')
  })

  it('removes malformed JSON and invalid envelopes without throwing', () => {
    const storage = new MemoryStorage()
    const key = runtimeStorageKey(identity.storyId)
    storage.values.set(key, '{broken JSON !!!')

    expect(loadRuntimeSave(storage, identity)).toEqual({ status: 'invalid', reason: 'malformed' })
    expect(storage.values.has(key)).toBe(false)

    storage.values.set(key, JSON.stringify({ formatVersion: 1, storyId: identity.storyId }))
    expect(loadRuntimeSave(storage, identity)).toEqual({ status: 'invalid', reason: 'envelope' })
    expect(storage.values.has(key)).toBe(false)
  })

  it.each([
    ['formatVersion', { formatVersion: 999 }, 'envelope'],
    ['storyId', { storyId: 'other-story' }, 'incompatible'],
    ['storyVersion', { storyVersion: '0.2.0' }, 'incompatible'],
    ['schemaVersion', { schemaVersion: '0.2' }, 'incompatible'],
  ])('rejects incompatible %s saves', (_label, override, reason) => {
    const storage = new MemoryStorage()
    const envelope = { ...createRuntimeSaveEnvelope(identity, snapshot), ...override }
    storage.values.set(runtimeStorageKey(identity.storyId), JSON.stringify(envelope))

    const result = loadRuntimeSave(storage, identity)
    expect(result).toEqual({ status: 'invalid', reason })
    expect(storage.values.has(runtimeStorageKey(identity.storyId))).toBe(false)
  })

  it('reports storage read and write failures without throwing', () => {
    const storage = new MemoryStorage()
    storage.shouldThrowOnGet = true
    expect(loadRuntimeSave(storage, identity)).toEqual({ status: 'error' })

    storage.shouldThrowOnGet = false
    storage.shouldThrowOnSet = true
    expect(saveRuntimeSave(storage, createRuntimeSaveEnvelope(identity, snapshot))).toEqual({ ok: false })
  })
})
