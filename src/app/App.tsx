import { loadStory } from '../engine/story-loader/loadStory'
import { StorySession } from './StorySession'
import { runtimeDemoPack } from './storyPacks/runtimeDemo'

const runtimeDemoStory = loadStory(runtimeDemoPack)

export function App() {
  return <StorySession story={runtimeDemoStory} />
}
