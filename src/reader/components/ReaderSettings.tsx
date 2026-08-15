import { useEffect, useRef } from 'react'
import type { ReaderPreferences } from '../types/reader'

type ReaderSettingsProps = {
  open: boolean
  preferences: ReaderPreferences
  onChange: (preferences: ReaderPreferences) => void
  onClose: () => void
}

const fontSizeOptions = [
  { value: 'small', label: '小' },
  { value: 'standard', label: '標準' },
  { value: 'large', label: '大' },
  { value: 'x-large', label: '特大' },
] as const

const lineHeightOptions = [
  { value: 'compact', label: '緊湊' },
  { value: 'standard', label: '標準' },
  { value: 'relaxed', label: '寬鬆' },
] as const

const themeOptions = [
  { value: 'system', label: '系統' },
  { value: 'light', label: '淺色' },
  { value: 'dark', label: '深色' },
] as const

export function ReaderSettings({ open, preferences, onChange, onClose }: ReaderSettingsProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return

    const previousFocus = document.activeElement as HTMLElement | null
    closeRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }

      if (event.key !== 'Tab' || !panelRef.current) return
      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>('button, input:not([disabled]), [tabindex]:not([tabindex="-1"])'),
      )
      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      previousFocus?.focus()
    }
  }, [onClose, open])

  if (!open) return null

  return (
    <div
      className="reader-settings-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        ref={panelRef}
        className="reader-settings"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reader-settings-title"
      >
        <div className="reader-settings__header">
          <div>
            <h2 id="reader-settings-title">閱讀設定</h2>
            <p>調整只會儲存在這個瀏覽器。</p>
          </div>
          <button ref={closeRef} className="reader-settings__close" type="button" onClick={onClose}>
            關閉
          </button>
        </div>

        <fieldset>
          <legend>字級</legend>
          <div className="reader-settings__options reader-settings__options--four">
            {fontSizeOptions.map((option) => (
              <label key={option.value}>
                <input
                  type="radio"
                  name="reader-font-size"
                  value={option.value}
                  checked={preferences.fontSize === option.value}
                  onChange={() => onChange({ ...preferences, fontSize: option.value })}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend>行距</legend>
          <div className="reader-settings__options">
            {lineHeightOptions.map((option) => (
              <label key={option.value}>
                <input
                  type="radio"
                  name="reader-line-height"
                  value={option.value}
                  checked={preferences.lineHeight === option.value}
                  onChange={() => onChange({ ...preferences, lineHeight: option.value })}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend>主題</legend>
          <div className="reader-settings__options">
            {themeOptions.map((option) => (
              <label key={option.value}>
                <input
                  type="radio"
                  name="reader-theme"
                  value={option.value}
                  checked={preferences.theme === option.value}
                  onChange={() => onChange({ ...preferences, theme: option.value })}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>
    </div>
  )
}
