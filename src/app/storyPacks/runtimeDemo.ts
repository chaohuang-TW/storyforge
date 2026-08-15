import manifest from '../../../stories/runtime-demo/manifest.json'
import chapter01 from '../../../stories/runtime-demo/nodes/chapter-01.json'
import ending from '../../../stories/runtime-demo/nodes/ending.json'
import prologue from '../../../stories/runtime-demo/nodes/prologue.json'
import mistPath from '../../../stories/runtime-demo/assets/mist-path.svg'
import type { StoryPackSource } from '../../engine/story/types'

export const runtimeDemoPack: StoryPackSource = {
  manifest,
  nodes: [prologue, chapter01, ending],
  assets: { 'mist-path': mistPath },
}
