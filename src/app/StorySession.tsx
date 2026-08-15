import { useState } from 'react'
import { storyNodesToReaderDocument } from '../engine/adapters/storyToReader'
import { createStoryRuntime } from '../engine/runtime/storyRuntime'
import type { LoadedStory } from '../engine/story/types'
import { BookReader } from '../reader/components/BookReader'
import { ChoicePrompt } from './components/ChoicePrompt'

type StorySessionProps = {
  story: LoadedStory
}

export function StorySession({ story }: StorySessionProps) {
  const [runtime] = useState(() => createStoryRuntime(story))
  const [, setRevision] = useState(0)
  const [causalFeedback, setCausalFeedback] = useState(false)
  const visibleNodes = runtime.getVisibleNodes()
  const document = storyNodesToReaderDocument(story, visibleNodes)
  const ended = runtime.isEnding()
  const pendingChoice = runtime.getPendingChoice()
  const choiceHistory = runtime.getChoiceHistory()

  const advance = () => {
    if (runtime.advance()) {
      setCausalFeedback(false)
      setRevision((value) => value + 1)
    }
  }

  const choose = (choiceId: string) => {
    if (runtime.choose(choiceId)) {
      setCausalFeedback(true)
      setRevision((value) => value + 1)
    }
  }

  const afterContent = (
    <>
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
