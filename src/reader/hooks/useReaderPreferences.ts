import { useEffect, useState } from 'react'
import type { ReaderFontSize, ReaderLineHeight, ReaderPreferences, ReaderTheme } from '../types/reader'

export const READER_PREFERENCES_KEY = 'storyforge.reader.preferences'

export const defaultReaderPreferences: ReaderPreferences = {
  fontSize: 'standard',
  lineHeight: 'standard',
  theme: 'system',
}

const fontSizes: ReaderFontSize[] = ['small', 'standard', 'large', 'x-large']
const lineHeights: ReaderLineHeight[] = ['compact', 'standard', 'relaxed']
const themes: ReaderTheme[] = ['system', 'light', 'dark']

function readPreferences(): ReaderPreferences {
  try {
    const stored = window.localStorage.getItem(READER_PREFERENCES_KEY)
    if (!stored) return defaultReaderPreferences

    const candidate = JSON.parse(stored) as Partial<ReaderPreferences>
    return {
      fontSize: fontSizes.includes(candidate.fontSize as ReaderFontSize)
        ? (candidate.fontSize as ReaderFontSize)
        : defaultReaderPreferences.fontSize,
      lineHeight: lineHeights.includes(candidate.lineHeight as ReaderLineHeight)
        ? (candidate.lineHeight as ReaderLineHeight)
        : defaultReaderPreferences.lineHeight,
      theme: themes.includes(candidate.theme as ReaderTheme)
        ? (candidate.theme as ReaderTheme)
        : defaultReaderPreferences.theme,
    }
  } catch {
    return defaultReaderPreferences
  }
}

export function useReaderPreferences() {
  const [preferences, setPreferences] = useState<ReaderPreferences>(readPreferences)

  useEffect(() => {
    window.localStorage.setItem(READER_PREFERENCES_KEY, JSON.stringify(preferences))
  }, [preferences])

  return { preferences, setPreferences }
}
