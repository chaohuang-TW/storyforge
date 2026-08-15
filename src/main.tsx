import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App'
import './styles/global.css'
import './styles/tokens.css'
import './styles/reader.css'

const root = document.getElementById('root')

if (!root) {
  throw new Error('StoryForge root element was not found.')
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
