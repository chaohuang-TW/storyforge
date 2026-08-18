import manifest from '../../../stories/journey81/manifest.json'
import ending001 from '../../../stories/journey81/nodes/ending-001.json'
import prologue001 from '../../../stories/journey81/nodes/prologue-001.json'
import prologue002 from '../../../stories/journey81/nodes/prologue-002.json'
import west001 from '../../../stories/journey81/nodes/west-001.json'
import west002 from '../../../stories/journey81/nodes/west-002.json'
import westEchoRouter from '../../../stories/journey81/nodes/west-echo-router.json'
import westLightEcho from '../../../stories/journey81/nodes/west-light-echo.json'
import westMistEcho from '../../../stories/journey81/nodes/west-mist-echo.json'
import westRejoin from '../../../stories/journey81/nodes/west-rejoin.json'
import whitebone001 from '../../../stories/journey81/nodes/whitebone-001.json'
import whitebone002 from '../../../stories/journey81/nodes/whitebone-002.json'
import whiteboneCanon from '../../../stories/journey81/nodes/whitebone-canon.json'
import whiteboneChoice from '../../../stories/journey81/nodes/whitebone-choice.json'
import whiteboneFirstRejoin from '../../../stories/journey81/nodes/whitebone-first-rejoin.json'
import whiteboneLightDelay from '../../../stories/journey81/nodes/whitebone-light-delay.json'
import whiteboneMemory from '../../../stories/journey81/nodes/whitebone-memory.json'
import whiteboneMistDelay from '../../../stories/journey81/nodes/whitebone-mist-delay.json'
import whiteboneOutcomeCanon from '../../../stories/journey81/nodes/whitebone-outcome-canon.json'
import whiteboneOutcomeMemory from '../../../stories/journey81/nodes/whitebone-outcome-memory.json'
import whiteboneOutcomeRouter from '../../../stories/journey81/nodes/whitebone-outcome-router.json'
import whiteboneOutcomeWater from '../../../stories/journey81/nodes/whitebone-outcome-water.json'
import whiteboneRejoin from '../../../stories/journey81/nodes/whitebone-rejoin.json'
import whiteboneSecond from '../../../stories/journey81/nodes/whitebone-second.json'
import whiteboneThird from '../../../stories/journey81/nodes/whitebone-third.json'
import whiteboneTruth from '../../../stories/journey81/nodes/whitebone-truth.json'
import whiteboneWater from '../../../stories/journey81/nodes/whitebone-water.json'
import whiteboneWuxingRouter from '../../../stories/journey81/nodes/whitebone-wuxing-router.json'
import wuxing001 from '../../../stories/journey81/nodes/wuxing-001.json'
import wuxing002 from '../../../stories/journey81/nodes/wuxing-002.json'
import wuxingChoice from '../../../stories/journey81/nodes/wuxing-choice.json'
import wuxingLight from '../../../stories/journey81/nodes/wuxing-light.json'
import wuxingMist from '../../../stories/journey81/nodes/wuxing-mist.json'
import wuxingRelease from '../../../stories/journey81/nodes/wuxing-release.json'
import wuxingRejoin from '../../../stories/journey81/nodes/wuxing-rejoin.json'
import prologueInkSky from '../../../stories/journey81/assets/prologue-ink-sky.svg'
import wuxingMountain from '../../../stories/journey81/assets/wuxing-mountain.svg'
import wuxingEyes from '../../../stories/journey81/assets/wuxing-eyes.svg'
import wuxingReleaseAsset from '../../../stories/journey81/assets/wuxing-release.svg'
import westRoadDust from '../../../stories/journey81/assets/west-road-dust.svg'
import pilgrimFour from '../../../stories/journey81/assets/pilgrim-four.svg'
import whiteboneRidge from '../../../stories/journey81/assets/whitebone-ridge.svg'
import basketStream from '../../../stories/journey81/assets/basket-stream.svg'
import threeDisguises from '../../../stories/journey81/assets/three-disguises.svg'
import boneReflection from '../../../stories/journey81/assets/bone-reflection.svg'
import monkeyDeparture from '../../../stories/journey81/assets/monkey-departure.svg'
import westwardAfterglow from '../../../stories/journey81/assets/westward-afterglow.svg'
import type { StoryPackSource } from '../../engine/story/types'

export const journey81Pack: StoryPackSource = {
  manifest,
  nodes: [
    prologue001,
    prologue002,
    wuxing001,
    wuxing002,
    wuxingChoice,
    wuxingLight,
    wuxingMist,
    wuxingRejoin,
    wuxingRelease,
    west001,
    west002,
    westEchoRouter,
    westLightEcho,
    westMistEcho,
    westRejoin,
    whitebone001,
    whitebone002,
    whiteboneChoice,
    whiteboneCanon,
    whiteboneWater,
    whiteboneMemory,
    whiteboneFirstRejoin,
    whiteboneSecond,
    whiteboneWuxingRouter,
    whiteboneLightDelay,
    whiteboneMistDelay,
    whiteboneThird,
    whiteboneTruth,
    whiteboneOutcomeRouter,
    whiteboneOutcomeCanon,
    whiteboneOutcomeWater,
    whiteboneOutcomeMemory,
    whiteboneRejoin,
    ending001,
  ],
  assets: {
    'prologue-ink-sky': prologueInkSky,
    'wuxing-mountain': wuxingMountain,
    'wuxing-eyes': wuxingEyes,
    'wuxing-release': wuxingReleaseAsset,
    'west-road-dust': westRoadDust,
    'pilgrim-four': pilgrimFour,
    'whitebone-ridge': whiteboneRidge,
    'basket-stream': basketStream,
    'three-disguises': threeDisguises,
    'bone-reflection': boneReflection,
    'monkey-departure': monkeyDeparture,
    'westward-afterglow': westwardAfterglow,
  },
}
