import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

function githubPagesBase(repository = process.env.GITHUB_REPOSITORY): string {
  if (!repository) return '/'

  const [owner, name] = repository.split('/')
  if (!owner || !name || name.toLowerCase() === `${owner.toLowerCase()}.github.io`) {
    return '/'
  }

  return `/${name}/`
}

export default defineConfig({
  base: githubPagesBase(),
  plugins: [react()],
})

export { githubPagesBase }
