import { loadStory } from '../engine/story-loader/loadStory'
import { StorySession } from './StorySession'
import { journey81Pack } from './storyPacks/journey81'

const journey81Story = loadStory(journey81Pack)

export function App() {
  return <StorySession story={journey81Story} />
}
