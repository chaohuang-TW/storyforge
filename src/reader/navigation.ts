import type { ReaderDocument, ReaderLocation } from './types/reader'

export function getReaderStartLocation(document: ReaderDocument): ReaderLocation | null {
  const firstBlock = document.blocks[0]
  if (!firstBlock) return null
  return { documentId: document.id, markerId: firstBlock.id, progress: 0 }
}

export function isReaderLocationValid(document: ReaderDocument, location: ReaderLocation): boolean {
  return (
    location.documentId === document.id &&
    typeof location.markerId === 'string' &&
    document.blocks.some((block) => block.id === location.markerId) &&
    typeof location.progress === 'number' &&
    Number.isFinite(location.progress) &&
    location.progress >= 0 &&
    location.progress <= 100
  )
}
