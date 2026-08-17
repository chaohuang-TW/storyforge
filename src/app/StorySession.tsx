import { useEffect, useState } from 'react'
import { storyNodesToReaderDocument } from '../engine/adapters/storyToReader'
import { createStoryRuntime } from '../engine/runtime/storyRuntime'
import type { LoadedStory } from '../engine/story/types'
import {
  createRuntimeSaveEnvelope,
  getBrowserRuntimeStorage,
  loadRuntimeSave,
  removeRuntimeSave,
  saveRuntimeSave,
  type RuntimeStorage,
} from '../persistence/runtimeSave'
import {
  createStoryBookmarkEnvelope,
  loadStoryBookmark,
  removeStoryBookmark,
  saveStoryBookmark,
  type StoryBookmarkEnvelope,
} from '../persistence/storyBookmark'
import { BookReader } from '../reader/components/BookReader'
import { removeReadingPosition } from '../reader/hooks/useReaderProgress'
import { getReaderStartLocation, isReaderLocationValid } from '../reader/navigation'
import type { ReaderLocation } from '../reader/types/reader'
import { ChoicePrompt } from './components/ChoicePrompt'

type StorySessionProps = {
  story: LoadedStory
}

type RuntimeSession = {
  runtime: ReturnType<typeof createStoryRuntime>
  storage: RuntimeStorage | null
  storageUnavailable: boolean
  bookmark: StoryBookmarkEnvelope | null
  bookmarkUnavailable: boolean
}

function storyIdentity(story: LoadedStory) {
  return {
    storyId: story.manifest.id,
    storyVersion: story.manifest.version,
    schemaVersion: story.manifest.schemaVersion,
  }
}

function initializeRuntimeSession(story: LoadedStory): RuntimeSession {
  const storage = getBrowserRuntimeStorage()
  if (!storage) {
    return {
      runtime: createStoryRuntime(story),
      storage,
      storageUnavailable: true,
      bookmark: null,
      bookmarkUnavailable: true,
    }
  }

  const identity = storyIdentity(story)
  const saved = loadRuntimeSave(storage, identity)
  let runtime = createStoryRuntime(story)
  if (saved.status === 'valid') {
    try {
      runtime = createStoryRuntime(story, { snapshot: saved.envelope.snapshot })
    } catch {
      removeRuntimeSave(storage, story.manifest.id)
    }
  }

  const bookmarkResult = loadStoryBookmark(storage, identity)
  return {
    runtime,
    storage,
    storageUnavailable: saved.status === 'error',
    bookmark: bookmarkResult.status === 'valid' ? bookmarkResult.envelope : null,
    bookmarkUnavailable: bookmarkResult.status === 'error',
  }
}

export function StorySession({ story }: StorySessionProps) {
  const [session] = useState(() => initializeRuntimeSession(story))
  const [runtime, setRuntime] = useState(() => session.runtime)
  const [, setRevision] = useState(0)
  const initialDocument = storyNodesToReaderDocument(story, session.runtime.getVisibleNodes())
  const [bookmark, setBookmark] = useState<StoryBookmarkEnvelope | null>(() =>
    session.bookmark && isReaderLocationValid(initialDocument, session.bookmark.location) ? session.bookmark : null,
  )
  const [readerLocation, setReaderLocation] = useState<ReaderLocation | null>(() => getReaderStartLocation(initialDocument))
  const [requestedLocation, setRequestedLocation] = useState<ReaderLocation | null>(null)
  const [causalFeedback, setCausalFeedback] = useState(false)
  const [persistenceWarning, setPersistenceWarning] = useState(session.storageUnavailable)
  const [bookmarkWarning, setBookmarkWarning] = useState(session.bookmarkUnavailable)
  const [bookmarkFeedback, setBookmarkFeedback] = useState(false)
  const [newRunConfirmOpen, setNewRunConfirmOpen] = useState(false)
  const [newRunWarning, setNewRunWarning] = useState(false)
  const { storage } = session
  const visibleNodes = runtime.getVisibleNodes()
  const document = storyNodesToReaderDocument(story, visibleNodes)
  const ended = runtime.isEnding()
  const pendingChoice = runtime.getPendingChoice()
  const choiceHistory = runtime.getChoiceHistory()
  const identity = storyIdentity(story)
  const bookmarkLocationValid = !session.bookmark || isReaderLocationValid(document, session.bookmark.location)

  useEffect(() => {
    if (session.bookmark && !bookmarkLocationValid && storage) {
      removeStoryBookmark(storage, story.manifest.id)
    }
  }, [bookmarkLocationValid, session.bookmark, storage, story.manifest.id])

  const persistRuntime = (): boolean => {
    if (!storage) {
      setPersistenceWarning(true)
      return false
    }
    const result = saveRuntimeSave(storage, createRuntimeSaveEnvelope(identity, runtime.exportSnapshot()))
    if (!result.ok) {
      setPersistenceWarning(true)
      return false
    }
    return true
  }

  const advance = () => {
    if (runtime.advance()) {
      persistRuntime()
      setCausalFeedback(false)
      setRevision((value) => value + 1)
    }
  }

  const choose = (choiceId: string) => {
    if (runtime.choose(choiceId)) {
      persistRuntime()
      setCausalFeedback(true)
      setRevision((value) => value + 1)
    }
  }

  const updateBookmark = () => {
    if (!storage) {
      setBookmarkWarning(true)
      return
    }
    const location = readerLocation && isReaderLocationValid(document, readerLocation)
      ? readerLocation
      : getReaderStartLocation(document)
    if (!location || !persistRuntime()) return

    const envelope = createStoryBookmarkEnvelope(identity, location)
    const result = saveStoryBookmark(storage, envelope)
    if (!result.ok) {
      setBookmarkWarning(true)
      return
    }
    setBookmark(envelope)
    setBookmarkWarning(false)
    setBookmarkFeedback(true)
  }

  const returnToBookmark = () => {
    if (bookmark) setRequestedLocation({ ...bookmark.location })
  }

  const confirmNewRun = () => {
    if (!removeReadingPosition(document.id)) {
      setNewRunWarning(true)
      return
    }
    if (!storage || !removeStoryBookmark(storage, story.manifest.id)) {
      setNewRunWarning(true)
      return
    }
    if (!removeRuntimeSave(storage, story.manifest.id)) {
      setNewRunWarning(true)
      return
    }

    const freshRuntime = createStoryRuntime(story)
    const freshDocument = storyNodesToReaderDocument(story, freshRuntime.getVisibleNodes())
    const startLocation = getReaderStartLocation(freshDocument)
    setRuntime(freshRuntime)
    setBookmark(null)
    setReaderLocation(startLocation)
    setRequestedLocation(startLocation ? { ...startLocation } : null)
    setCausalFeedback(false)
    setPersistenceWarning(false)
    setBookmarkWarning(false)
    setBookmarkFeedback(false)
    setNewRunWarning(false)
    setNewRunConfirmOpen(false)
    setRevision((value) => value + 1)
  }

  const headerActions = (
    <div className="story-session__bookmark-actions" aria-label="閱讀書籤">
      <button type="button" onClick={updateBookmark}>
        {bookmark ? '更新書籤' : '加入書籤'}
      </button>
      {bookmark ? (
        <button type="button" onClick={returnToBookmark}>
          回到書籤
        </button>
      ) : null}
    </div>
  )

  const newRunPanel = ended ? (
    <section className="story-session__new-run" aria-label="新一輪">
      {!newRunConfirmOpen ? (
        <button type="button" onClick={() => setNewRunConfirmOpen(true)}>
          開始新一輪
        </button>
      ) : (
        <>
          <p>這會清除目前這一輪的因果與書籤，從序章重新開始。閱讀偏好不受影響。</p>
          <div className="story-session__new-run-actions">
            <button type="button" onClick={() => setNewRunConfirmOpen(false)}>
              取消
            </button>
            <button type="button" onClick={confirmNewRun}>
              確認開始新一輪
            </button>
          </div>
        </>
      )}
      {newRunWarning ? (
        <p className="story-session__new-run-warning" aria-live="polite">
          目前無法開始新一輪，請確認瀏覽器儲存空間可用。
        </p>
      ) : null}
    </section>
  ) : null

  const afterContent = (
    <>
      {persistenceWarning ? (
        <p className="story-session__persistence-warning" aria-live="polite">
          此瀏覽器目前無法保存因果。重新整理後進度可能遺失。
        </p>
      ) : null}

      {bookmarkWarning ? (
        <p className="story-session__bookmark-warning" aria-live="polite">
          此瀏覽器目前無法保存書籤。
        </p>
      ) : null}

      {bookmarkFeedback ? (
        <p className="story-session__bookmark-feedback" aria-live="polite">
          書籤已更新。
        </p>
      ) : null}

      {causalFeedback ? (
        <p className="story-session__causal-feedback" aria-live="polite">
          因果已定。
        </p>
      ) : null}

      {pendingChoice ? (
        <ChoicePrompt
          choice={pendingChoice}
          showIrreversibilityNotice={choiceHistory.length === 0}
          onChoose={choose}
        />
      ) : ended ? newRunPanel : (
        <section className="story-session__advance" aria-label="故事推進">
          <button type="button" onClick={advance}>
            繼續閱讀
          </button>
        </section>
      )}
    </>
  )

  return (
    <BookReader
      document={document}
      endMessage={ended ? '閱讀完畢' : null}
      contentComplete={ended}
      afterContent={afterContent}
      headerActions={headerActions}
      onLocationChange={setReaderLocation}
      requestedLocation={requestedLocation}
    />
  )
}
