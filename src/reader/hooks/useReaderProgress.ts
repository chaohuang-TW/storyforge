import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import type { ReaderLocation, ReaderPosition } from '../types/reader'

export const readerPositionKey = (documentId: string) => `storyforge.reader.position.${documentId}`

export function removeReadingPosition(documentId: string): boolean {
  try {
    window.localStorage.removeItem(readerPositionKey(documentId))
    return true
  } catch {
    return false
  }
}

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

export function useReaderProgress(
  documentId: string,
  contentRef: RefObject<HTMLElement | null>,
  contentRevision = 0,
  contentComplete = true,
  onLocationChange?: (location: ReaderLocation) => void,
  requestedLocation?: ReaderLocation | null,
) {
  const initialPosition = useMemo(() => readPosition(documentId), [documentId])
  const endIsVisible = useRef(false)
  const onLocationChangeRef = useRef(onLocationChange)
  const suppressNextPositionWrite = useRef(false)
  const requestedLocationRef = useRef<ReaderLocation | null>(null)
  const [progress, setProgress] = useState(0)
  const [resumeAvailable, setResumeAvailable] = useState(
    Boolean(initialPosition && initialPosition.progress >= 5 && initialPosition.progress < 98),
  )

  useEffect(() => {
    onLocationChangeRef.current = onLocationChange
  }, [onLocationChange])

  useEffect(() => {
    endIsVisible.current = false
    const content = contentRef.current
    if (!content || typeof IntersectionObserver === 'undefined') return

    const markers = Array.from(content.querySelectorAll<HTMLElement>('[data-reader-progress-marker]'))
    if (markers.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (contentComplete && endIsVisible.current) return
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (!visible) return

        const index = Number((visible.target as HTMLElement).dataset.readerProgressMarker ?? 0)
        const calculatedProgress = Math.round((index / Math.max(1, markers.length - 1)) * 100)
        const nextProgress = contentComplete ? calculatedProgress : Math.min(calculatedProgress, 99)
        setProgress(nextProgress)
        const markerId = (visible.target as HTMLElement).id
        if (markerId) {
          onLocationChangeRef.current?.({ documentId, markerId, progress: nextProgress })
        }
      },
      { rootMargin: '-18% 0px -68% 0px', threshold: [0, 0.25, 0.75] },
    )

    const endObserver = new IntersectionObserver(
      (entries) => {
        endIsVisible.current = entries.some((entry) => entry.isIntersecting)
        if (contentComplete && endIsVisible.current) setProgress(100)
      },
      { threshold: 0.5 },
    )

    markers.forEach((marker) => observer.observe(marker))
    endObserver.observe(markers[markers.length - 1])
    return () => {
      observer.disconnect()
      endObserver.disconnect()
    }
  }, [contentRef, contentRevision, contentComplete, documentId])

  useEffect(() => {
    if (!requestedLocation || requestedLocation.documentId !== documentId) return
    if (requestedLocationRef.current === requestedLocation) return
    requestedLocationRef.current = requestedLocation
    suppressNextPositionWrite.current = requestedLocation.progress === 0
  }, [documentId, requestedLocation])

  useEffect(() => {
    if (resumeAvailable) return

    if (suppressNextPositionWrite.current) {
      suppressNextPositionWrite.current = false
      return
    }

    const position: ReaderPosition = { documentId, progress, updatedAt: new Date().toISOString() }
    try {
      window.localStorage.setItem(readerPositionKey(documentId), JSON.stringify(position))
    } catch {
      // Reader position is best-effort and must never block reading.
    }
  }, [documentId, progress, resumeAvailable])

  useEffect(() => {
    if (!requestedLocation || requestedLocation.documentId !== documentId) return
    const content = contentRef.current
    const target = content
      ? Array.from(content.querySelectorAll<HTMLElement>('[data-reader-progress-marker]')).find(
          (marker) => marker.id === requestedLocation.markerId,
        )
      : null
    if (!target) return

    suppressNextPositionWrite.current = requestedLocation.progress === 0
    target.scrollIntoView?.({ behavior: 'auto', block: 'start' })
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1')
    target.focus({ preventScroll: true })
    setProgress(requestedLocation.progress)
    setResumeAvailable(false)
    onLocationChangeRef.current?.({ ...requestedLocation })
  }, [contentRef, documentId, requestedLocation])

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
