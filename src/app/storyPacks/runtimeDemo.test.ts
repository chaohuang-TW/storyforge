import { describe, expect, it } from 'vitest'
import { loadStory } from '../../engine/story-loader/loadStory'
import { createStoryRuntime } from '../../engine/runtime/storyRuntime'
import { runtimeDemoPack } from './runtimeDemo'

function reachDemoChoice() {
  const runtime = createStoryRuntime(loadStory(runtimeDemoPack))
  runtime.advance()
  runtime.advance()
  return runtime
}

describe('runtime-demo causal choices', () => {
  it('commits the wind Choice through Story Pack effects and routing', () => {
    const runtime = reachDemoChoice()

    runtime.choose('wind')

    expect(runtime.getWorldState()).toEqual({ 'letter-entered': true })
    expect(runtime.getCurrentNode().id).toBe('wind-path')
  })

  it('commits the rain Choice through Story Pack effects and routing', () => {
    const runtime = reachDemoChoice()

    runtime.choose('rain')

    expect(runtime.getWorldState()).toEqual({ 'ink-washed': true })
    expect(runtime.getCurrentNode().id).toBe('rain-path')
  })
})
