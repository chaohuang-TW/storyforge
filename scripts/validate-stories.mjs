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
  try {
    if (!statSync(root).isDirectory()) throw new Error(`Story asset root is not a directory: ${root}`)
  } catch (error) {
    if (error?.code === 'ENOENT') return []
    throw error
  }

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

export function canonicalAssetKey(assetRoot, filePath) {
  const relativePath = posixPath(relative(assetRoot, filePath))
  const extension = extname(relativePath)
  return extension ? relativePath.slice(0, -extension.length) : relativePath
}

function assetMap(packRoot, assetRoot, assetFiles) {
  const assets = {}
  const pathsByKey = new Map()
  for (const filePath of assetFiles) {
    const key = canonicalAssetKey(assetRoot, filePath)
    const relativeFilePath = posixPath(relative(packRoot, filePath))
    const paths = pathsByKey.get(key) ?? []
    paths.push(relativeFilePath)
    pathsByKey.set(key, paths)
    if (!Object.hasOwn(assets, key)) assets[key] = relativeFilePath
  }

  const collisions = [...pathsByKey.entries()]
    .filter(([, paths]) => paths.length > 1)
    .map(([key, paths]) => ({ key, paths }))
  return { assets, collisions }
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
  const { assets, collisions } = assetMap(packRoot, assetRoot, assetFiles)
  return {
    source: { manifest, nodes, assets },
    manifestPath,
    nodeFiles,
    assetFiles,
    assetCollisions: collisions,
  }
}

function sortIssues(issues) {
  return [...issues].sort((left, right) =>
    (left.path ?? '').localeCompare(right.path ?? '') ||
    (left.nodeId ?? '').localeCompare(right.nodeId ?? '') ||
    left.code.localeCompare(right.code) ||
    left.message.localeCompare(right.message),
  )
}

function collisionIssues(collisions) {
  return collisions.map(({ key, paths }) => ({
    code: 'ASSET_KEY_COLLISION',
    path: `assets/${key}`,
    message: `Multiple physical assets resolve to the logical key "${key}": ${paths.join(', ')}`,
  }))
}

function formatIssue(issue) {
  const location = [issue.nodeId ? `node: ${issue.nodeId}` : '', issue.path ? `path: ${issue.path}` : '']
    .filter(Boolean)
    .join('\n')
  return `[${issue.code}]\n${location ? `${location}\n` : ''}${issue.message}`
}

export function validateStoryDirectory(packRoot) {
  const loaded = loadStoryPackDirectory(packRoot)
  const validationIssues = sortIssues([
    ...validateStoryPack(loaded.source).issues,
    ...collisionIssues(loaded.assetCollisions),
  ])
  const result = { valid: validationIssues.length === 0, issues: validationIssues }
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
        output.log(`  nodes: ${validated.summary.nodes}`)
        output.log(`  endings: ${validated.summary.endings}`)
        output.log(`  assets: ${validated.summary.assets}`)
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
