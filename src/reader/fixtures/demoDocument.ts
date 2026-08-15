import landscapeUrl from './reader-demo-landscape.jpg'
import type { ReaderDocument } from '../types/reader'

export const demoDocument: ReaderDocument = {
  id: 'phase-1-reader-demo',
  title: '潮汐線以北',
  subtitle: '一篇用來校準長文閱讀節奏的原創示例',
  chapterLabel: '第一章　微光',
  blocks: [
    {
      id: 'chapter-heading',
      type: 'heading',
      level: 2,
      kicker: '第一章',
      text: '風從沒有名字的方向來',
    },
    {
      id: 'opening-1',
      type: 'paragraph',
      text: '清晨的雨停在六點以前。窗沿還留著一圈細小水珠，遠處的街道已經醒了，聲音卻隔著薄霧，像從另一個房間傳來。',
    },
    {
      id: 'opening-2',
      type: 'paragraph',
      text: '我沿著堤岸往北走。潮水退得很慢，濕潤的石面映著天光，偶爾有一兩片葉子貼在縫隙裡。這條路沒有醒目的標誌，只在轉彎處放著一張褪色的長椅。',
    },
    {
      id: 'opening-3',
      type: 'paragraph',
      text: '長椅旁站著一位帶灰色雨傘的人。他沒有撐傘，只把傘尖輕輕點在地上，彷彿正在確認某個只有自己聽得見的節拍。',
    },
    {
      id: 'dialogue-1',
      type: 'dialogue',
      lines: ['「前面的路還通嗎？」', '「路一直都通。」他望向霧裡，「只是今天看得比較近。」'],
    },
    {
      id: 'opening-4',
      type: 'paragraph',
      text: '這回答不算清楚，我卻沒有再問。風把水面的細紋推向岸邊，遠方傳來列車通過鐵橋的聲音，短促，乾淨，隨即又被潮聲收走。',
    },
    {
      id: 'quote-1',
      type: 'quote',
      text: '有些地方不是因為遙遠而安靜，而是需要慢一點，才聽得見它原來的聲音。',
      attribution: '堤岸手記',
    },
    {
      id: 'opening-5',
      type: 'paragraph',
      text: '堤岸在前方收窄，兩側長著被雨洗亮的草。鞋底踩過濕土時發出輕微的聲響，每一步都不像前一步那麼急。城市仍在身後運轉，但那些催促人的聲音已經變得很小。',
    },
    {
      id: 'scene-divider',
      type: 'divider',
    },
    {
      id: 'section-heading',
      type: 'heading',
      level: 3,
      text: '霧裡的岔口',
    },
    {
      id: 'middle-1',
      type: 'paragraph',
      text: '岔口比記憶中更早出現。左邊沿著水走，右邊則進入一片低矮樹林。雨水從枝葉末端落下，沒有規律，卻讓林子顯得格外清醒。',
    },
    {
      id: 'middle-2',
      type: 'paragraph',
      text: '路旁有一塊沒有文字的木牌。它只留下日曬與潮氣的痕跡，像一本被翻閱很久的書，封面已經說不出原來的顏色。',
    },
    {
      id: 'landscape',
      type: 'illustration',
      src: landscapeUrl,
      alt: '層疊的灰藍山丘之間，一條淺色小徑蜿蜒伸向霧中的遠方',
      caption: '示例插圖：霧中的路徑，用來檢查響應式圖片與圖說排版。',
      variant: 'full-bleed',
      width: 1536,
      height: 1024,
    },
    {
      id: 'middle-3',
      type: 'paragraph',
      text: '我在木牌前停了一會兒。不是為了判斷方向，而是第一次注意到，自己已經很久沒有在無事發生的地方停下來。',
    },
    {
      id: 'dialogue-2',
      type: 'dialogue',
      lines: ['「你在等人嗎？」', '身後傳來剛才那個聲音。', '「沒有。我只是想看清楚這裡。」', '「那就別急著往前。」'],
    },
    {
      id: 'middle-4',
      type: 'paragraph',
      text: '帶傘的人走到岔口，沒有指向任何一邊。他把雨傘靠在木牌旁，低頭看了看鞋上的泥，神情平靜得像是已經來過很多次。',
    },
    {
      id: 'middle-5',
      type: 'paragraph',
      text: '霧在這時稍微散開。左邊的水面露出一段銀白，右邊的樹林也亮了起來。兩條路都沒有忽然變得明確，只是各自恢復了原本的樣子。',
    },
    {
      id: 'middle-6',
      type: 'paragraph',
      text: '我想起那些總被匆忙略過的細節：早餐店開門時升起的白煙，公車靠站前短短的一次減速，夜裡最後一戶熄燈的人。它們沒有要求被記住，卻一直構成日子的形狀。',
    },
    {
      id: 'second-divider',
      type: 'divider',
    },
    {
      id: 'closing-heading',
      type: 'heading',
      level: 3,
      text: '潮聲抵達以前',
    },
    {
      id: 'closing-1',
      type: 'paragraph',
      text: '最後，我沿著水邊繼續走。不是因為那條路比較正確，而是風從那裡帶來鹽的氣味。帶傘的人留在岔口，向我點了一次頭。',
    },
    {
      id: 'closing-2',
      type: 'paragraph',
      text: '日光逐漸穿過雲層，堤岸的輪廓從霧裡浮出來。原先模糊的遠景沒有變得陌生，反而像一封終於拆開的信，內容簡單，字跡清楚。',
    },
    {
      id: 'closing-3',
      type: 'paragraph',
      text: '走到下一座橋時，我回頭看了一眼。岔口已被樹影遮住，那把灰色雨傘仍靠在木牌旁，像替某個尚未抵達的人保留位置。',
    },
    {
      id: 'closing-4',
      type: 'paragraph',
      text: '潮聲在很遠的地方重新變得清晰。我沒有加快腳步，只把呼吸放慢，讓它與水面一同起伏。此刻沒有答案需要追趕，只有一條可以安靜走完的路。',
    },
    {
      id: 'closing-5',
      type: 'paragraph',
      text: '城市的鐘聲從南邊傳來，告訴我早晨已經過去。光落在石面上，水珠一顆接一顆消失。新的風越過堤岸，帶著尚未下完的雨，也帶著回程時可以慢慢想起的事。',
    },
  ],
}
