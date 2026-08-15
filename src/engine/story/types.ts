export type StoryManifest = {
  id: string
  title: string
  version: string
  schemaVersion: '0.1'
  language: string
  entryNode: string
}

type StoryContentBase = {
  id: string
}

export type StoryHeading = StoryContentBase & {
  type: 'heading'
  level: 2 | 3
  text: string
  kicker?: string
}

export type StoryParagraph = StoryContentBase & { type: 'paragraph'; text: string }
export type StoryDialogue = StoryContentBase & { type: 'dialogue'; lines: string[] }
export type StoryIllustration = StoryContentBase & {
  type: 'illustration'
  asset: string
  alt: string
  caption?: string
  variant?: 'normal' | 'full-bleed'
  width: number
  height: number
}
export type StoryQuote = StoryContentBase & { type: 'quote'; text: string; attribution?: string }
export type StoryDivider = StoryContentBase & { type: 'divider' }

export type StoryContent =
  | StoryHeading
  | StoryParagraph
  | StoryDialogue
  | StoryIllustration
  | StoryQuote
  | StoryDivider

export type { Condition, Effect, StateValue, WorldState } from '../causality/types'
import type { Condition, Effect, WorldState } from '../causality/types'

export type NarrativeStoryNode = {
  id: string
  type: 'narrative'
  title?: string
  content: StoryContent[]
  effects?: Effect[]
  next: string
}

export type EndingStoryNode = {
  id: string
  type: 'ending'
  title?: string
  content: StoryContent[]
  effects?: Effect[]
}

export type ConditionalBranch = {
  when: Condition
  next: string
}

export type ConditionalStoryNode = {
  id: string
  type: 'conditional'
  branches: ConditionalBranch[]
  fallback: string
}

export type StoryChoice = {
  id: string
  label: string
  conditions?: Condition[]
  effects?: Effect[]
  next: string
}

export type ChoiceStoryNode = {
  id: string
  type: 'choice'
  prompt?: string
  choices: StoryChoice[]
}

export type StoryNode = NarrativeStoryNode | ChoiceStoryNode | ConditionalStoryNode | EndingStoryNode
export type RenderableStoryNode = NarrativeStoryNode | EndingStoryNode

export type StoryPackSource = {
  manifest: unknown
  nodes: unknown[]
  assets?: Record<string, string>
}

export type LoadedStory = {
  manifest: StoryManifest
  nodes: Map<string, StoryNode>
  assets: Map<string, string>
}

export type StoryRuntimeState = {
  currentNodeId: string
  worldState: WorldState
  pendingChoiceNodeId?: string
}
