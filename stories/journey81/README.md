# 《西遊：八十一劫》Vertical Slice

## Story premise

你不在西遊記裡。但西遊記，會記得你做過的事。

這是一段從五行山走到白骨嶺的 20–30 分鐘繁體中文互動小說切片。觀者不進入場景、不替角色說話，也不替角色下命令；觀者只碰觸環境、資訊、時機與偶然，讓角色在新的條件下自己做決定。

## Vertical Slice scope

序章 → 五行山 → 西行 → 白骨精 → 中性的章末。五行山的微因會在白骨嶺延遲發生，白骨精的三種介入最後回到「悟空離開取經隊伍」這個共同宏觀狀態。

本 pack 是 Story Pack vertical slice，尚未接入 App default、Story selector 或瀏覽器 E2E。

## Character voice guide

- 唐僧：不是愚鈍或無條件相信誰；他缺少悟空的眼睛，也必須回答力量應如何使用。
- 孫悟空：能看穿妖氣、保護師父，但急、怒、自負，不一定願意解釋。
- 豬八戒：怕餓怕死、嘴快抱怨，卻懂凡人的恐懼，偶爾說出最不體面也最真實的話。
- 沙悟淨：少話、穩，透過觀看、記得與收拾維持存在感。
- 白骨精：不靠廉價的妖怪笑聲，而是閱讀慈悲、懷疑、飢餓與師徒裂縫。

## Observer rule

觀者只能改變條件，不能直接改寫人物意志。沒有觀者姓名、性別、肉身、直接對話或 Observer Awareness state。最多只留下環境中的一次輕微回望，不解釋它。

## World State keys

- `wuxing_first_touch`: `light` 或 `mist`，記錄五行山第一次接觸的微因。
- `whitebone_intervention`: `canon`、`water` 或 `memory`，記錄白骨嶺的介入條件。

## Reader Memory key

- `journey81.white-bone-truth`: 觀者曾親眼看見白骨精真正的骨相與破綻。
- 它不是完成旗標、路線、分數、結局、成就或周目計數。
- 記憶在 `whitebone-third` 真正讓白骨破綻被看見後才寫入；第一輪的 `memory` 選項因此隱藏，第二輪才顯示。

## Route matrix

| Run | 五行山 | 白骨精 | 結果 |
| --- | --- | --- | --- |
| 1 | light | canon | 正傳慣性：唐僧缺乏可共享證據 |
| 1 | light | water | 部分證據：唐僧知道事情有異 |
| 1 | mist | canon | 正傳慣性：唐僧記得聲音先於人影 |
| 1 | mist | water | 部分證據：唐僧從聲音與水痕理解不安 |
| 2+ | light / mist | memory | 記憶讓破綻提前成為可見資訊 |

每條路都經過 `whitebone-rejoin` 進入 `ending-001`；悟空都離開隊伍，但離開的理由不同。`memory` 不是 True Route 或最佳結局，而是知道更多之後的新因果可能。

## Micro-cause

五行山的 `wuxing-choice` 讓一線天光穿過雲縫，或讓山霧再停一刻。兩路在 `wuxing-rejoin` 匯合，但 `west-echo-router` 與 `whitebone-wuxing-router` 會讓那個細小差異在白骨嶺重新改變唐僧的猶豫理由。

## Delayed consequence

`wuxing_first_touch` 只影響 `west-light-echo` / `west-mist-echo` 與白骨嶺的 `whitebone-light-delay` / `whitebone-mist-delay`，不直接命令唐僧或悟空採取行動。

## Calamity intervention

白骨嶺的 `whitebone-choice` 提供「不動」的 canon 與讓山泉漫過竹籃底的 water。第二輪若持有 Reader Memory，才多出讓水光照進左腕、使骨相破綻提早被共享看見的 memory。三路都面對力量與慈悲的代價，並在共同宏觀狀態重聚。

## Rejoin rule

三條白骨結果都清楚寫出悟空離開取經隊伍，才進入中性章末「卷一・路還向西」。不使用 GOOD END、BAD END、TRUE END 或其他勝負標籤。

## Asset key list

`prologue-ink-sky`, `wuxing-mountain`, `wuxing-eyes`, `wuxing-release`, `west-road-dust`, `pilgrim-four`, `whitebone-ridge`, `basket-stream`, `three-disguises`, `bone-reflection`, `monkey-departure`, `westward-afterglow`。

所有 Illustration 使用 exact logical key 與有意義的繁中 alt；SVG 不含標題文字。

## Writing rules

繁體中文、臺灣自然語序；13 歲看得懂，30 歲仍有餘味。短段落、有畫面、有留白，不使用百科腔、古文炫技、網路梗、動漫台詞或手遊文案。暴力維持國中生可讀，不描寫血漿、內臟或肢解細節。旁白的「你」只指觀者，不替觀者決定感受。

## Out of scope

App default switch、Journey81 browser E2E、production deployment、Engine／Reader／Persistence 變更、New Game+、Observer Awareness system、run count、Story selector UI、白骨嶺之後章節、完整八十一劫長篇與 Phase 6B2。

## Human acceptance notes

Human acceptance should review:

- readability
- character voice
- causal legitimacy
- delayed consequence
- branch continuity
- Reader Memory payoff
- whether the observer feels present without becoming a character
