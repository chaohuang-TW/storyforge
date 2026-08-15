export type ReaderHeadingBlock = {
  id: string
  type: 'heading'
  level: 2 | 3
  text: string
  kicker?: string
}

export type ReaderParagraphBlock = {
  id: string
  type: 'paragraph'
  text: string
}

export type ReaderDialogueBlock = {
  id: string
  type: 'dialogue'
  lines: string[]
}

export type ReaderIllustrationBlock = {
  id: string
  type: 'illustration'
  src: string
  alt: string
  caption?: string
  variant?: 'normal' | 'full-bleed'
  width: number
  height: number
}

export type ReaderQuoteBlock = {
  id: string
  type: 'quote'
  text: string
  attribution?: string
}

export type ReaderDividerBlock = {
  id: string
  type: 'divider'
}

export type ReaderBlock =
  | ReaderHeadingBlock
  | ReaderParagraphBlock
  | ReaderDialogueBlock
  | ReaderIllustrationBlock
  | ReaderQuoteBlock
  | ReaderDividerBlock

export type ReaderDocument = {
  id: string
  title: string
  subtitle: string
  chapterLabel: string
  blocks: ReaderBlock[]
}

export type ReaderFontSize = 'small' | 'standard' | 'large' | 'x-large'
export type ReaderLineHeight = 'compact' | 'standard' | 'relaxed'
export type ReaderTheme = 'system' | 'light' | 'dark'

export type ReaderPreferences = {
  fontSize: ReaderFontSize
  lineHeight: ReaderLineHeight
  theme: ReaderTheme
}

export type ReaderPosition = {
  documentId: string
  progress: number
  updatedAt: string
}
