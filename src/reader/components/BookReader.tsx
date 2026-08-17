import { useCallback, useRef, useState, type ReactNode } from 'react'
import type { ReaderDocument, ReaderLocation } from '../types/reader'
import { useReaderPreferences } from '../hooks/useReaderPreferences'
import { useReaderProgress } from '../hooks/useReaderProgress'
import { ReaderContentBlock } from './content/ReaderContentBlock'
import { ReaderHeader } from './ReaderHeader'
import { ReaderSettings } from './ReaderSettings'

type BookReaderProps = {
  document: ReaderDocument
  afterContent?: ReactNode
  endMessage?: string | null
  contentComplete?: boolean
  headerActions?: ReactNode
  onLocationChange?: (location: ReaderLocation) => void
  requestedLocation?: ReaderLocation | null
}

export function BookReader({
  document,
  afterContent,
  endMessage = '本篇示例閱讀完畢',
  contentComplete = true,
  headerActions,
  onLocationChange,
  requestedLocation,
}: BookReaderProps) {
  const contentRef = useRef<HTMLElement>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const { preferences, setPreferences } = useReaderPreferences()
  const { progress, resumeAvailable, resume, dismissResume } = useReaderProgress(
    document.id,
    contentRef,
    document.blocks.length,
    contentComplete,
    onLocationChange,
    requestedLocation,
  )
  const closeSettings = useCallback(() => setSettingsOpen(false), [])

  return (
    <div
      className="book-reader"
      data-font-size={preferences.fontSize}
      data-line-height={preferences.lineHeight}
      data-theme={preferences.theme}
    >
      <ReaderHeader
        chapterLabel={document.chapterLabel}
        progress={progress}
        onOpenSettings={() => setSettingsOpen(true)}
        actions={headerActions}
      />

      {resumeAvailable ? (
        <aside className="reader-resume" aria-label="上次閱讀位置">
          <p>這個瀏覽器保留了上次的閱讀位置。</p>
          <div>
            <button type="button" onClick={resume}>
              回到上次閱讀處
            </button>
            <button type="button" onClick={dismissResume}>
              關閉
            </button>
          </div>
        </aside>
      ) : null}

      <main className="reader-main" aria-labelledby="reader-title">
          <header className="reader-title-page" data-reader-progress-marker="0">
          <p className="reader-title-page__product">StoryForge</p>
          <h1 id="reader-title">{document.title}</h1>
          {document.subtitle ? <p className="reader-title-page__subtitle">{document.subtitle}</p> : null}
          <p className="reader-title-page__identity">Web Interactive Novel Engine</p>
        </header>

        <article ref={contentRef} className="reader-content">
          {document.blocks.map((block, index) => (
            <ReaderContentBlock key={block.id} block={block} progressIndex={index + 1} />
          ))}
          {afterContent}
          {endMessage ? (
            <p id="reader-end" className="reader-end" data-reader-progress-marker={document.blocks.length + 1}>
              {endMessage}
            </p>
          ) : (
            <div id="reader-end-marker" className="reader-end-marker" data-reader-progress-marker={document.blocks.length + 1} aria-hidden="true" />
          )}
        </article>
      </main>

      <ReaderSettings
        open={settingsOpen}
        preferences={preferences}
        onChange={setPreferences}
        onClose={closeSettings}
      />
    </div>
  )
}
