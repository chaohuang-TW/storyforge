import manifest from '../../../stories/runtime-demo/manifest.json'
import afterSend from '../../../stories/runtime-demo/nodes/after-send.json'
import bellPath from '../../../stories/runtime-demo/nodes/bell-path.json'
import chapter01 from '../../../stories/runtime-demo/nodes/chapter-01.json'
import delayedLetterRoute from '../../../stories/runtime-demo/nodes/delayed-letter-route.json'
import delayedRain from '../../../stories/runtime-demo/nodes/delayed-rain.json'
import delayedWind from '../../../stories/runtime-demo/nodes/delayed-wind.json'
import ending from '../../../stories/runtime-demo/nodes/ending.json'
import ferryPath from '../../../stories/runtime-demo/nodes/ferry-path.json'
import letterChoice from '../../../stories/runtime-demo/nodes/letter-choice.json'
import prologue from '../../../stories/runtime-demo/nodes/prologue.json'
import rainPath from '../../../stories/runtime-demo/nodes/rain-path.json'
import secondChoice from '../../../stories/runtime-demo/nodes/second-choice.json'
import secondIntervention from '../../../stories/runtime-demo/nodes/second-intervention.json'
import windPath from '../../../stories/runtime-demo/nodes/wind-path.json'
import harborDawn from '../../../stories/runtime-demo/assets/harbor-dawn.svg'
import blueEnvelope from '../../../stories/runtime-demo/assets/blue-envelope.svg'
import delayedRainAsset from '../../../stories/runtime-demo/assets/delayed-rain.svg'
import delayedWindAsset from '../../../stories/runtime-demo/assets/delayed-wind.svg'
import endingTide from '../../../stories/runtime-demo/assets/ending-tide.svg'
import harborFerry from '../../../stories/runtime-demo/assets/harbor-ferry.svg'
import mistPath from '../../../stories/runtime-demo/assets/mist-path.svg'
import rainInk from '../../../stories/runtime-demo/assets/rain-ink.svg'
import windLetter from '../../../stories/runtime-demo/assets/wind-letter.svg'
import type { StoryPackSource } from '../../engine/story/types'

export const runtimeDemoPack: StoryPackSource = {
  manifest,
  nodes: [
    prologue,
    chapter01,
    letterChoice,
    windPath,
    rainPath,
    afterSend,
    delayedLetterRoute,
    delayedWind,
    delayedRain,
    secondIntervention,
    secondChoice,
    bellPath,
    ferryPath,
    ending,
  ],
  assets: {
    'harbor-dawn': harborDawn,
    'mist-path': mistPath,
    'blue-envelope': blueEnvelope,
    'wind-letter': windLetter,
    'rain-ink': rainInk,
    'delayed-wind': delayedWindAsset,
    'delayed-rain': delayedRainAsset,
    'harbor-ferry': harborFerry,
    'ending-tide': endingTide,
  },
}
