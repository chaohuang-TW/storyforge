import { useState } from 'react'
import { storyNodesToReaderDocument } from '../engine/adapters/storyToReader'
import { createStoryRuntime } from '../engine/runtime/storyRuntime'
import type { LoadedStory } from '../engine/story/types'
import {
  createRuntimeSaveEnvelope,
  getBrowserRuntimeStorage,
  loadRuntimeSave,
  runtimeStorageKey,
  saveRuntimeSave,
  type RuntimeStorage,
} from '../persistence/runtimeSave'
import { BookReader } from '../reader/components/BookReader'
import { ChoicePrompt } from './components/ChoicePrompt'

type StorySessionProps = {
  story: LoadedStory
}

type RuntimeSession = {
  runtime: ReturnType<typeof createStoryRuntime>
  storage: RuntimeStorage | null
  storageUnavailable: boolean
}

function initializeRuntimeSession(story: LoadedStory): RuntimeSession {
  const storage = getBrowserRuntimeStorage()
  if (!storage) {
    return { runtime: createStoryRuntime(story), storage, storageUnavailable: true }
  }

  const identity = {
    storyId: story.manifest.id,
    storyVersion: story.manifest.version,
    schemaVersion: story.manifest.schemaVersion,
  }
  const saved = loadRuntimeSave(storage, identity)
  if (saved.status === 'valid') {
    try {
      return { runtime: createStoryRuntime(story, { snapshot: saved.envelope.snapshot }), storage, storageUnavailable: false }
    } catch {
      try {
        storage.removeItem(runtimeStorageKey(story.manifest.id))
      } catch {
        // Invalid saves must not prevent a fresh runtime from starting.
      }
    }
  }

  return {
    runtime: createStoryRuntime(story),
    storage,
    storageUnavailable: saved.status === 'error',
  }
}

export function StorySession({ story }: StorySessionProps) {
  const [session] = useState(() => initializeRuntimeSession(story))
  const { runtime, storage } = session
  const [, setRevision] = useState(0)
  const [causalFeedback, setCausalFeedback] = useState(false)
  const [persistenceWarning, setPersistenceWarning] = useState(session.storageUnavailable)
  const visibleNodes = runtime.getVisibleNodes()
  const document = storyNodesToReaderDocument(story, visibleNodes)
  const ended = runtime.isEnding()
  const pendingChoice = runtime.getPendingChoice()
  const choiceHistory = runtime.getChoiceHistory()

  const persistRuntime = () => {
    if (!storage) {
      setPersistenceWarning(true)
      return
    }
    const result = saveRuntimeSave(
      storage,
      createRuntimeSaveEnvelope(
        {
          storyId: story.manifest.id,
          storyVersion: story.manifest.version,
          schemaVersion: story.manifest.schemaVersion,
        },
        runtime.exportSnapshot(),
      ),
    )
    if (!result.ok) setPersistenceWarning(true)
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

  const afterContent = (
    <>
      {persistenceWarning ? (
        <p className="story-session__persistence-warning" aria-live="polite">
          此瀏覽器目前無法保存因果。重新整理後進度可能遺失。
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
      ) : ended ? null : (
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
      afterContent={causalFeedback || pendingChoice || !ended ? afterContent : null}
    />
  )
}
