import type { ReaderBlock, ReaderDocument } from '../../reader/types/reader'
import type { LoadedStory, StoryContent, StoryNode } from '../story/types'

export function storyContentToReaderBlock(content: StoryContent, assets: Map<string, string>): ReaderBlock {
  switch (content.type) {
    case 'heading':
      return { id: content.id, type: content.type, level: content.level, text: content.text, kicker: content.kicker }
    case 'paragraph':
      return { id: content.id, type: content.type, text: content.text }
    case 'dialogue':
      return { id: content.id, type: content.type, lines: content.lines }
    case 'illustration': {
      const src = assets.get(content.asset)
      if (!src) throw new Error(`Story asset is not available: ${content.asset}`)
      return { id: content.id, type: content.type, src, alt: content.alt, caption: content.caption, variant: content.variant, width: content.width, height: content.height }
    }
    case 'quote':
      return { id: content.id, type: content.type, text: content.text, attribution: content.attribution }
    case 'divider':
      return { id: content.id, type: content.type }
  }
}

export function storyNodesToReaderDocument(story: LoadedStory, nodes: StoryNode[]): ReaderDocument {
  const currentNode = nodes[nodes.length - 1]
  return {
    id: `story:${story.manifest.id}`,
    title: story.manifest.title,
    chapterLabel: currentNode?.title ?? story.manifest.title,
    blocks: nodes.flatMap((node) => node.content.map((content) => storyContentToReaderBlock(content, story.assets))),
  }
}
