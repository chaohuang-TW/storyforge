import { describe, expect, it } from 'vitest'
import { getReaderStartLocation, isReaderLocationValid } from './navigation'
import type { ReaderDocument } from './types/reader'

const document: ReaderDocument = {
  id: 'story:test',
  title: '測試',
  chapterLabel: '第一章',
  blocks: [
    { id: 'intro', type: 'heading', level: 2, text: '開頭' },
    { id: 'copy', type: 'paragraph', text: '內容' },
  ],
}

describe('Reader location navigation', () => {
  it('creates a generic start location from the first content marker', () => {
    expect(getReaderStartLocation(document)).toEqual({ documentId: 'story:test', markerId: 'intro', progress: 0 })
  })

  it('validates document identity, marker identity, and finite progress', () => {
    expect(isReaderLocationValid(document, { documentId: 'story:test', markerId: 'copy', progress: 42 })).toBe(true)
    expect(isReaderLocationValid(document, { documentId: 'story:other', markerId: 'copy', progress: 42 })).toBe(false)
    expect(isReaderLocationValid(document, { documentId: 'story:test', markerId: 'missing', progress: 42 })).toBe(false)
    expect(isReaderLocationValid(document, { documentId: 'story:test', markerId: 'copy', progress: Number.NaN })).toBe(false)
  })
})
