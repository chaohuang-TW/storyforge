import { describe, expect, it } from 'vitest'
import { copyReaderMemory, createReaderMemory, readerRemembers, remember, validateReaderMemory } from './readerMemory'

describe('Reader Memory', () => {
  it('starts empty and remembers immutable monotonic flags', () => {
    const memory = createReaderMemory()
    const remembered = remember(memory, 'saw-signal')

    expect(memory).toEqual({})
    expect(remembered).toEqual({ 'saw-signal': true })
    expect(remember(remembered, 'saw-signal')).toEqual(remembered)
    expect(readerRemembers(remembered, 'saw-signal')).toBe(true)
    expect(readerRemembers(remembered, 'missing')).toBe(false)
  })

  it('returns defensive copies and rejects non-flag values', () => {
    const memory = { known: true as const }
    const copy = copyReaderMemory(memory)
    copy.known = true
    expect(copy).not.toBe(memory)
    expect(memory).toEqual({ known: true })

    expect(() => validateReaderMemory({ known: false })).toThrow('must contain true')
    expect(() => validateReaderMemory({ known: 1 })).toThrow('must contain true')
    expect(() => validateReaderMemory({ '': true })).toThrow('non-empty')
    expect(() => remember(memory, '')).toThrow('non-empty')
  })
})
