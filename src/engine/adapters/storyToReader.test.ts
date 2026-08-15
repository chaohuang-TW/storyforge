import { describe, expect, it } from 'vitest'
import { loadStory } from '../story-loader/loadStory'
import type { RenderableStoryNode, StoryContent } from '../story/types'
import { storyContentToReaderBlock, storyNodesToReaderDocument } from './storyToReader'

const assets = new Map([['image', '/story-image.svg']])

const contents: StoryContent[] = [
  { id: 'heading', type: 'heading', level: 2, text: '標題' },
  { id: 'paragraph', type: 'paragraph', text: '正文' },
  { id: 'dialogue', type: 'dialogue', lines: ['對話'] },
  { id: 'illustration', type: 'illustration', asset: 'image', alt: '插圖', width: 100, height: 50 },
  { id: 'quote', type: 'quote', text: '引文' },
  { id: 'divider', type: 'divider' },
]

describe('Story-to-Reader adapter', () => {
  it('maps every StoryContent presentation type to its ReaderBlock equivalent', () => {
    expect(contents.map((content) => storyContentToReaderBlock(content, assets).type)).toEqual([
      'heading',
      'paragraph',
      'dialogue',
      'illustration',
      'quote',
      'divider',
    ])
    expect(storyContentToReaderBlock(contents[3], assets)).toMatchObject({ src: '/story-image.svg', alt: '插圖' })
  })

  it('combines multiple visible story nodes into one stable ReaderDocument', () => {
    const story = loadStory({
      manifest: { id: 'adapter-test', title: 'Adapter Test', version: '0.1.0', schemaVersion: '0.1', language: 'zh-TW', entryNode: 'one' },
      nodes: [
        { id: 'one', type: 'narrative', content: [contents[0]], next: 'two' },
        { id: 'two', type: 'ending', content: [contents[1]] },
      ],
      assets: { image: '/story-image.svg' },
    })
    const nodes = [story.nodes.get('one')!, story.nodes.get('two')!].filter(
      (node): node is RenderableStoryNode => node.type !== 'conditional',
    )
    const document = storyNodesToReaderDocument(story, nodes)

    expect(document.id).toBe('story:adapter-test')
    expect(document.subtitle).toBeUndefined()
    expect(document.blocks.map((block) => block.id)).toEqual(['heading', 'paragraph'])
  })
})
