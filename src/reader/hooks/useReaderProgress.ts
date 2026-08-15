import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import type { ReaderPosition } from '../types/reader'

export const readerPositionKey = (documentId: string) => `storyforge.reader.position.${documentId}`

function readPosition(documentId: string): ReaderPosition | null {
  try {
    const stored = window.localStorage.getItem(readerPositionKey(documentId))
    if (!stored) return null

    const position = JSON.parse(stored) as Partial<ReaderPosition>
    if (position.documentId !== documentId || typeof position.progress !== 'number') return null

    return {
      documentId,
      progress: Math.min(100, Math.max(0, position.progress)),
      updatedAt: typeof position.updatedAt === 'string' ? position.updatedAt : new Date().toISOString(),
    }
  } catch {
    return null
  }
}

export function useReaderProgress(documentId: string, contentRef: RefObject<HTMLElement | null>) {
  const initialPosition = useMemo(() => readPosition(documentId), [documentId])
  const skipInitialWrite = useRef(Boolean(initialPosition))
  const endIsVisible = useRef(false)
  const [progress, setProgress] = useState(0)
  const [resumeAvailable, setResumeAvailable] = useState(
    Boolean(initialPosition && initialPosition.progress >= 5 && initialPosition.progress < 98),
  )

  useEffect(() => {
    const content = contentRef.current
    if (!content || typeof IntersectionObserver === 'undefined') return

    const markers = Array.from(content.querySelectorAll<HTMLElement>('[data-reader-progress-marker]'))
    if (markers.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (endIsVisible.current) return
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (!visible) return

        const index = Number((visible.target as HTMLElement).dataset.readerProgressMarker ?? 0)
        setProgress(Math.round((index / Math.max(1, markers.length - 1)) * 100))
      },
      { rootMargin: '-18% 0px -68% 0px', threshold: [0, 0.25, 0.75] },
    )

    const endObserver = new IntersectionObserver(
      (entries) => {
        endIsVisible.current = entries.some((entry) => entry.isIntersecting)
        if (endIsVisible.current) setProgress(100)
      },
      { threshold: 0.5 },
    )

    markers.forEach((marker) => observer.observe(marker))
    endObserver.observe(markers[markers.length - 1])
    return () => {
      observer.disconnect()
      endObserver.disconnect()
    }
  }, [contentRef])

  useEffect(() => {
    if (skipInitialWrite.current) {
      skipInitialWrite.current = false
      return
    }
    const position: ReaderPosition = { documentId, progress, updatedAt: new Date().toISOString() }
    window.localStorage.setItem(readerPositionKey(documentId), JSON.stringify(position))
  }, [documentId, progress])

  const resume = useCallback(() => {
    if (!initialPosition) return
    const scrollableDistance = document.documentElement.scrollHeight - window.innerHeight
    window.scrollTo({ top: scrollableDistance * (initialPosition.progress / 100), behavior: 'auto' })
    setProgress(initialPosition.progress)
    setResumeAvailable(false)
  }, [initialPosition])

  const dismissResume = useCallback(() => setResumeAvailable(false), [])

  return { progress, resumeAvailable, resume, dismissResume }
}
