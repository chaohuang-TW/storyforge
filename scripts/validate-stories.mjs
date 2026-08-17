import { readdirSync, readFileSync, statSync } from 'node:fs'
import { basename, extname, join, relative, resolve, sep } from 'node:path'
import { pathToFileURL } from 'node:url'
import { validateStoryPack } from '../src/engine/story/validator.ts'

function jsonFile(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, 'utf8'))
  } catch (error) {
    if (error instanceof Error) error.path = filePath
    throw error
  }
}

function posixPath(filePath) {
  return filePath.split(sep).join('/')
}

function filesUnder(root) {
  const files = []
  const visit = (directory) => {
    for (const entry of readdirSync(directory, { withFileTypes: true }).sort((left, right) => left.name.localeCompare(right.name))) {
      const entryPath = join(directory, entry.name)
      if (entry.isDirectory()) visit(entryPath)
      else if (entry.isFile()) files.push(entryPath)
    }
  }
  visit(root)
  return files.sort((left, right) => left.localeCompare(right))
}

function assetAliases(packRoot, assetRoot, filePath) {
  const relativeToPack = posixPath(relative(packRoot, filePath))
  const relativeToAssets = posixPath(relative(assetRoot, filePath))
  const fileName = basename(filePath)
  const stem = fileName.slice(0, -extname(fileName).length)
  return [relativeToPack, relativeToAssets, fileName, stem]
}

export function discoverStoryPacks(storiesRoot) {
  return readdirSync(storiesRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(storiesRoot, entry.name))
    .filter((packRoot) => {
      try {
        return statSync(join(packRoot, 'manifest.json')).isFile()
      } catch {
        return false
      }
    })
    .sort((left, right) => posixPath(left).localeCompare(posixPath(right)))
}

export function loadStoryPackDirectory(packRoot) {
  const manifestPath = join(packRoot, 'manifest.json')
  const nodesRoot = join(packRoot, 'nodes')
  const assetRoot = join(packRoot, 'assets')
  const manifest = jsonFile(manifestPath)
  const nodeFiles = readdirSync(nodesRoot, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
    .map((entry) => join(nodesRoot, entry.name))
    .sort((left, right) => posixPath(left).localeCompare(posixPath(right)))
  const nodes = nodeFiles.map((filePath) => jsonFile(filePath))
  const assetFiles = filesUnder(assetRoot)
  const assets = {}
  for (const filePath of assetFiles) {
    for (const alias of assetAliases(packRoot, assetRoot, filePath)) assets[alias] = posixPath(relative(packRoot, filePath))
  }
  return {
    source: { manifest, nodes, assets },
    manifestPath,
    nodeFiles,
    assetFiles,
  }
}

function formatIssue(issue) {
  const location = [issue.nodeId ? `node: ${issue.nodeId}` : '', issue.path ? `path: ${issue.path}` : '']
    .filter(Boolean)
    .join('\n')
  return `[${issue.code}]\n${location ? `${location}\n` : ''}${issue.message}`
}

export function validateStoryDirectory(packRoot) {
  const loaded = loadStoryPackDirectory(packRoot)
  const result = validateStoryPack(loaded.source, { assetPaths: new Set(Object.keys(loaded.source.assets)) })
  const storyId = loaded.source.manifest && typeof loaded.source.manifest.id === 'string'
    ? loaded.source.manifest.id
    : basename(packRoot)
  const endingCount = loaded.source.nodes.filter((node) => node && typeof node === 'object' && node.type === 'ending').length
  return {
    ...loaded,
    result,
    storyId,
    summary: { nodes: loaded.source.nodes.length, endings: endingCount, assets: loaded.assetFiles.length },
  }
}

export function runStoryValidation(storiesRoot = resolve(process.cwd(), 'stories'), output = console) {
  const packs = discoverStoryPacks(storiesRoot)
  const failures = []
  output.log('StoryForge Story Validator')
  output.log('')

  for (const packRoot of packs) {
    const packName = basename(packRoot)
    try {
      const validated = validateStoryDirectory(packRoot)
      if (validated.result.valid) {
        output.log(`PASS ${validated.storyId}`)
        output.log(`  nodes: ${validated.summary.nodes}`)
        output.log(`  endings: ${validated.summary.endings}`)
        output.log(`  assets: ${validated.summary.assets}`)
      } else {
        failures.push(...validated.result.issues)
        output.log(`FAIL ${validated.storyId}`)
        for (const validationIssue of validated.result.issues) {
          output.log(`\n${formatIssue(validationIssue)}`)
        }
      }
      output.log('')
    } catch (error) {
      const file = error?.path ?? join(packRoot, 'manifest.json')
      const message = error instanceof Error ? error.message : String(error)
      failures.push({ code: 'SCHEMA_INVALID', message, path: posixPath(relative(packRoot, file)) })
      output.log(`FAIL ${packName}`)
      output.log(`\n[SCHEMA_INVALID]\nfile: ${posixPath(relative(packRoot, file))}\n${message}`)
      output.log('')
    }
  }

  if (failures.length > 0) {
    output.log(`Story validation failed: ${failures.length} errors.`)
    return 1
  }
  output.log(`Validated ${packs.length} Story Pack${packs.length === 1 ? '' : 's'}.`)
  output.log('0 errors.')
  return 0
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href
if (isMain) {
  try {
    process.exitCode = runStoryValidation(process.argv[2] ? resolve(process.argv[2]) : undefined)
  } catch (error) {
    console.error(`Story validation failed: ${error instanceof Error ? error.message : String(error)}`)
    process.exitCode = 1
  }
}
