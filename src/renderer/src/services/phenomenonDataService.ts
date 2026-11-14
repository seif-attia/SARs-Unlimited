import type { DatasetStatus } from '../types/phenomenon'
import {
  adaptAmazonSarDataset,
  type AdaptedSarPlatformData
} from './phenomenonDataAdapter'

let cachedPlatformData: AdaptedSarPlatformData | null = null
let cachedStatus: DatasetStatus = 'AVAILABLE'
let datasetPromise: Promise<{
  platformData: AdaptedSarPlatformData | null
  status: DatasetStatus
}> | null = null

const assetDataUrlCache = new Map<string, string>()
const assetPromiseCache = new Map<string, Promise<string | null>>()

/**
 * Loads and adapts the verified 2015–2026 NASA/ESA SAR dataset via Electron IPC
 * (`window.api.getDataset()`), falling back gracefully if unavailable.
 */
export async function loadVerifiedSarDataset(): Promise<{
  platformData: AdaptedSarPlatformData | null
  status: DatasetStatus
}> {
  if (cachedPlatformData) {
    return { platformData: cachedPlatformData, status: cachedStatus }
  }
  if (datasetPromise) {
    return datasetPromise
  }

  datasetPromise = (async () => {
    try {
      if (
        typeof window !== 'undefined' &&
        window.api &&
        typeof window.api.getDataset === 'function'
      ) {
        const raw = await window.api.getDataset()
        if (raw) {
          const adapted = adaptAmazonSarDataset(raw)
          cachedPlatformData = adapted
          cachedStatus = 'AVAILABLE'
          return { platformData: adapted, status: 'AVAILABLE' }
        }
      }
    } catch (err) {
      console.warn('[phenomenonDataService] IPC dataset load failed, attempting fetch fallback:', err)
    }

    try {
      const response = await fetch('/data/amazon_sar_2020_2026.json')
      if (response.ok) {
        const raw = await response.json()
        const adapted = adaptAmazonSarDataset(raw)
        cachedPlatformData = adapted
        cachedStatus = 'AVAILABLE'
        return { platformData: adapted, status: 'AVAILABLE' }
      }
    } catch {
      // Ignore fetch fallback failure
    }

    cachedStatus = 'NO DATA'
    return { platformData: null, status: 'NO DATA' }
  })()

  return datasetPromise
}

/**
 * Resolves a dataset-relative PNG asset path into a data URL via Electron IPC
 * with in-memory caching so Cesium imagery layers switch instantaneously.
 */
export async function loadSarAssetDataUrl(
  relPath: string | null | undefined
): Promise<string | null> {
  if (!relPath) return null
  const cleanKey = relPath.trim()
  if (!cleanKey) return null

  const existing = assetDataUrlCache.get(cleanKey)
  if (existing) return existing

  const pending = assetPromiseCache.get(cleanKey)
  if (pending) return pending

  const promise = (async () => {
    try {
      if (
        typeof window !== 'undefined' &&
        window.api &&
        typeof window.api.getAssetDataUrl === 'function'
      ) {
        const url = await window.api.getAssetDataUrl(cleanKey)
        if (url) {
          assetDataUrlCache.set(cleanKey, url)
          return url
        }
      }
    } catch (err) {
      console.warn(`[phenomenonDataService] Failed to load asset ${cleanKey}:`, err)
    } finally {
      assetPromiseCache.delete(cleanKey)
    }
    return null
  })()

  assetPromiseCache.set(cleanKey, promise)
  return promise
}

export function getCachedAssetDataUrl(relPath: string | null | undefined): string | null {
  if (!relPath) return null
  return assetDataUrlCache.get(relPath.trim()) ?? null
}
