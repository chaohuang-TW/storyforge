type ReaderProgressProps = {
  progress: number
}

export function ReaderProgress({ progress }: ReaderProgressProps) {
  return (
    <div className="reader-progress">
      <progress aria-label="閱讀進度" max="100" value={progress} />
      <span aria-live="polite">{progress}%</span>
    </div>
  )
}
