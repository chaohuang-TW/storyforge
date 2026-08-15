import { render, screen } from '@testing-library/react'
import { App } from './App'

describe('App foundation', () => {
  it('renders the StoryForge foundation shell', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: 'StoryForge' })).toBeInTheDocument()
    expect(screen.getByText('Web Interactive Novel Engine')).toBeInTheDocument()
    expect(screen.getByText('Phase 0 — Foundation')).toBeInTheDocument()
  })
})
