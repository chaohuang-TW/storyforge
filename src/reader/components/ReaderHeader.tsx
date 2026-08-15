import { ReaderProgress } from './ReaderProgress'

type ReaderHeaderProps = {
  chapterLabel: string
  progress: number
  onOpenSettings: () => void
}

export function ReaderHeader({ chapterLabel, progress, onOpenSettings }: ReaderHeaderProps) {
  return (
    <header className="reader-header">
      <div className="reader-header__inner">
        <a className="reader-header__brand" href="#reader-title" aria-label="StoryForge，回到文章開頭">
          StoryForge
        </a>
        <span className="reader-header__chapter" aria-hidden="true">
          {chapterLabel}
        </span>
        <button className="reader-header__settings" type="button" onClick={onOpenSettings}>
          閱讀設定
        </button>
      </div>
      <ReaderProgress progress={progress} />
    </header>
  )
}
