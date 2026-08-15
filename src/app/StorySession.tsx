import { useState } from 'react'
import { storyNodesToReaderDocument } from '../engine/adapters/storyToReader'
import { createStoryRuntime } from '../engine/runtime/storyRuntime'
import type { LoadedStory } from '../engine/story/types'
import { BookReader } from '../reader/components/BookReader'

type StorySessionProps = {
  story: LoadedStory
}

export function StorySession({ story }: StorySessionProps) {
  const [runtime] = useState(() => createStoryRuntime(story))
  const [, setRevision] = useState(0)
  const visibleNodes = runtime.getVisibleNodes()
  const document = storyNodesToReaderDocument(story, visibleNodes)
  const ended = runtime.isEnding()

  const advance = () => {
    if (runtime.advance()) setRevision((value) => value + 1)
  }

  return (
    <BookReader
      document={document}
      endMessage={ended ? '閱讀完畢' : null}
      afterContent={
        ended ? null : (
          <section className="story-session__advance" aria-label="故事推進">
            <button type="button" onClick={advance}>
              繼續閱讀
            </button>
          </section>
        )
      }
    />
  )
}
