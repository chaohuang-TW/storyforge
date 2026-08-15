import manifest from '../../../stories/runtime-demo/manifest.json'
import chapter01 from '../../../stories/runtime-demo/nodes/chapter-01.json'
import ending from '../../../stories/runtime-demo/nodes/ending.json'
import letterChoice from '../../../stories/runtime-demo/nodes/letter-choice.json'
import prologue from '../../../stories/runtime-demo/nodes/prologue.json'
import rainPath from '../../../stories/runtime-demo/nodes/rain-path.json'
import windPath from '../../../stories/runtime-demo/nodes/wind-path.json'
import mistPath from '../../../stories/runtime-demo/assets/mist-path.svg'
import type { StoryPackSource } from '../../engine/story/types'

export const runtimeDemoPack: StoryPackSource = {
  manifest,
  nodes: [prologue, chapter01, letterChoice, windPath, rainPath, ending],
  assets: { 'mist-path': mistPath },
}
