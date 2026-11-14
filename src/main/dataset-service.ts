import { app } from 'electron'
import { existsSync, readFileSync } from 'fs'
import { join, normalize, resolve } from 'path'

let cachedDataset: unknown | null = null
const assetDataUrlCache = new Map<string, string>()

function resolveDataDir(): string {
  const candidates = [
    join(app.getAppPath(), 'data'),
    join(__dirname, '../../data'),
    join(process.resourcesPath, 'data')
  ]
  for (const dir of candidates) {
    if (existsSync(join(dir, 'amazon_sar_2020_2026.json'))) {
      return dir
    }
  }
  throw new Error(
    `Offline SAR dataset not found in data/amazon_sar_2020_2026.json (checked: ${candidates.join(', ')})`
  )
}

export function getDataset(): unknown {
  if (cachedDataset !== null) return cachedDataset
  const dataDir = resolveDataDir()
  const raw = readFileSync(join(dataDir, 'amazon_sar_2020_2026.json'), 'utf-8')
  cachedDataset = JSON.parse(raw)
  return cachedDataset
}

export function getAssetDataUrl(relPath: string): string {
  const cleanRel = normalize(relPath).replace(/^(\.\.(\/|\\|$))+/, '')
  const cached = assetDataUrlCache.get(cleanRel)
  if (cached) return cached

  const dataDir = resolveDataDir()
  const absPath = resolve(dataDir, cleanRel)
  if (!absPath.startsWith(resolve(dataDir))) {
    throw new Error(`Invalid asset path outside data directory: ${relPath}`)
  }
  if (!existsSync(absPath)) {
    throw new Error(`SAR overlay asset missing: ${absPath}`)
  }

  const ext = absPath.toLowerCase().endsWith('.jpg') ? 'image/jpeg' : 'image/png'
  const b64 = readFileSync(absPath).toString('base64')
  const dataUrl = `data:${ext};base64,${b64}`
  assetDataUrlCache.set(cleanRel, dataUrl)
  return dataUrl
}
