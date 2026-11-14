/**
 * Client service for the BESO47/SARs-Data FastAPI backend (https://github.com/BESO47/SARs-Data)
 * plus Universal Custom API Link auto-detection (XYZ Tiles, GeoJSON FeatureCollection,
 * single CesiumLayerResponse endpoint, or full SARs-Data base URL).
 */

export type SarsDatasetId = 'flood' | 'nisar' | 'forest' | 'rainfall'

export type RegionId = 'madeira' | 'mamiraua' | 'xingu' | 'purus' | 'amazon_basin'

export interface StudyArea {
  region_id: RegionId
  name: string
  country: string
  state: string
  description: string
  bbox: [number, number, number, number] // [min_lon, min_lat, max_lon, max_lat]
  center: [number, number] // [lon, lat]
  typical_flood_season: string
  area_km2: number
}

export interface LegendItem {
  code: number | string
  label: string
  color_hex: string
  description: string
}

export interface LayerLegend {
  title: string
  unit?: string
  items: LegendItem[]
}

export interface CesiumLayerResponse {
  layer_id: string
  dataset: string
  title: string
  source: string
  layer_type: 'xyz_tiles' | 'geojson' | 'cog_tiles' | 'hybrid'
  observation_start: string
  observation_end: string
  tile_url_template: string | null
  geojson?: Record<string, unknown> | null
  DataUrlFallback?: string // Generated RGBA PNG data URL when FastAPI server is offline
  bbox: [number, number, number, number]
  default_opacity: number
  z_index: number
  legend: LayerLegend
  status: 'available' | 'demo' | 'processing' | 'failed'
}

export interface SarsBackendStatus {
  online: boolean
  baseUrl: string
  modeLabel: string
  version?: string
  isCustomDirectUrl?: boolean
}

// Exact predefined Amazon Basin study areas from BESO47/SARs-Data (backend/app/core/regions.py)
export const PREDEFINED_STUDY_AREAS: Record<RegionId, StudyArea> = {
  madeira: {
    region_id: 'madeira',
    name: 'Middle Madeira River & Humaitá Floodplain',
    country: 'Brazil',
    state: 'Amazonas / Rondônia',
    description:
      'Major Amazon tributary featuring seasonal várzea inundation and active riparian forest disturbance along BR-319 and Humaitá.',
    bbox: [-63.2, -7.8, -62.4, -7.1],
    center: [-62.8, -7.45],
    typical_flood_season: 'February–May',
    area_km2: 6842.5
  },
  mamiraua: {
    region_id: 'mamiraua',
    name: 'Mamirauá Sustainable Development Reserve (Solimões–Japurá)',
    country: 'Brazil',
    state: 'Amazonas',
    description:
      'Largest flooded forest (várzea) reserve in the central Amazon, prime reference site for L-band & C-band SAR double-bounce flooded vegetation analysis.',
    bbox: [-65.3, -3.25, -64.55, -2.65],
    center: [-64.925, -2.95],
    typical_flood_season: 'April–July',
    area_km2: 5534.8
  },
  xingu: {
    region_id: 'xingu',
    name: 'Lower Xingu & Altamira Hydrological Corridor',
    country: 'Brazil',
    state: 'Pará',
    description:
      'Eastern Amazon basin experiencing intense forest disturbance pressure alongside complex seasonal river fluctuations.',
    bbox: [-52.6, -3.65, -51.85, -2.95],
    center: [-52.225, -3.3],
    typical_flood_season: 'February–May',
    area_km2: 6458.1
  },
  purus: {
    region_id: 'purus',
    name: 'Lower Purus & Beruri Floodplain',
    country: 'Brazil',
    state: 'Amazonas',
    description:
      'Meandering white-water river floodplain with extensive seasonal open-water and macrophyte/igapó inundation dynamics.',
    bbox: [-61.65, -4.3, -60.95, -3.65],
    center: [-61.3, -3.975],
    typical_flood_season: 'March–July',
    area_km2: 5592.4
  },
  amazon_basin: {
    region_id: 'amazon_basin',
    name: 'Amazon Basin (General Monitoring Envelope)',
    country: 'Multi-national',
    state: 'Amazonia',
    description: 'Continental bounding envelope of the greater Amazon River Basin.',
    bbox: [-80.0, -20.0, -44.0, 9.0],
    center: [-62.0, -5.5],
    typical_flood_season: 'Variable by sub-basin',
    area_km2: 6150000.0
  }
}

export const DATASET_LEGENDS: Record<SarsDatasetId, LayerLegend> = {
  flood: {
    title: 'Sentinel-1 C-Band SAR Flood & Water Classification (COPERNICUS/S1_GRD)',
    unit: '5-Class SAR Backscatter Classification',
    items: [
      {
        code: 1,
        label: 'open_water_inundation',
        color_hex: '#00E5FF',
        description: 'Seasonal open-water inundation (VH <= -17.5 dB & VV <= -12.0 dB specular drop)'
      },
      {
        code: 2,
        label: 'possible_flooded_vegetation',
        color_hex: '#00E676',
        description: 'Flooded várzea/igapó canopy (VV dihedral double-bounce increase >= +1.4 dB)'
      },
      {
        code: 3,
        label: 'permanent_water',
        color_hex: '#1565C0',
        description: 'Permanent river/lake channel (JRC Global Surface Water occurrence >= 80%)'
      },
      {
        code: 4,
        label: 'uncertain',
        color_hex: '#FFB300',
        description: 'Uncertain (steep slope > 5° radar shadow or borderline backscatter)'
      }
    ]
  },
  nisar: {
    title: 'NASA–ISRO NISAR L-Band (24 cm) Polarimetric Backscatter (GCOV)',
    unit: 'L-Band Gamma0 & Sub-Canopy Dihedral Indicator',
    items: [
      {
        code: 'lband_subcanopy_double_bounce_candidate',
        label: 'Sub-Canopy Dihedral Double-Bounce Candidate (HH Enhancement)',
        color_hex: '#7C4DFF',
        description: 'Strong L-band HH gamma0 (> -3.2 dB) penetrating dense forest canopy'
      },
      {
        code: 'lband_specular_low_backscatter',
        label: 'L-Band Specular Low-Backscatter Surface',
        color_hex: '#00B0FF',
        description: 'Low L-band HH and HV gamma0 (< -16.5 dB HH) over smooth open water'
      },
      {
        code: 'lband_volume_canopy_scattering',
        label: 'Upland Forest Volume Scattering',
        color_hex: '#2E7D32',
        description: 'Nominal Amazon terra firme forest L-band volume/trunk backscatter'
      }
    ]
  },
  forest: {
    title: 'Global Forest Watch Disturbance Alerts (RADD C-Band SAR & GLAD Optical)',
    unit: 'Canopy Disturbance Alert Confidence',
    items: [
      {
        code: 'wur_radd_alerts',
        label: 'WUR RADD Sentinel-1 C-Band Radar Canopy Alert (High Confidence)',
        color_hex: '#FF1744',
        description: 'All-weather C-band SAR forest canopy structural loss detection'
      },
      {
        code: 'umd_glad_sentinel2_alerts',
        label: 'UMD GLAD Sentinel-2 / Landsat Optical Alert',
        color_hex: '#FF9100',
        description: 'Multispectral optical canopy disturbance alert'
      }
    ]
  },
  rainfall: {
    title: 'NASA GPM IMERG V07 Integrated Rainfall Accumulation',
    unit: 'mm (sum of mm/hr * 0.5h granules)',
    items: [
      {
        code: 'high_rainfall',
        label: 'Heavy Convective Accumulation (> 280 mm)',
        color_hex: '#1A237E',
        description: 'Intense Amazon wet-season precipitation core'
      },
      {
        code: 'moderate_rainfall',
        label: 'Moderate Accumulation (140 – 280 mm)',
        color_hex: '#0288D1',
        description: 'Regional stratiform and convective rainfall'
      },
      {
        code: 'light_rainfall',
        label: 'Light Accumulation (< 140 mm)',
        color_hex: '#80DEEA',
        description: 'Lower precipitation envelope'
      }
    ]
  }
}

/**
 * Check if the BESO47/SARs-Data FastAPI backend is reachable at baseUrl,
 * or if the user entered a direct tile/GeoJSON/layer API URL.
 */
export async function checkSarsBackendHealth(inputUrl: string): Promise<SarsBackendStatus> {
  const trimmed = inputUrl.trim()

  // 1. Check if the user pasted a direct XYZ tile template URL ({z}/{x}/{y} or {z}/{y}/{x})
  if (trimmed.includes('{z}') && (trimmed.includes('{x}') || trimmed.includes('{y}'))) {
    return {
      online: true,
      baseUrl: trimmed,
      modeLabel: 'Direct XYZ Tile Stream Active',
      isCustomDirectUrl: true
    }
  }

  // 2. Check if the user pasted a specific API endpoint (e.g. /api/flood/layer, .geojson, .png)
  if (
    /\/api\/(flood|nisar|forest|rainfall|analysis|tiles)\b/i.test(trimmed) ||
    /\.(geojson|json|png|jpg|jpeg)(\?.*)?$/i.test(trimmed)
  ) {
    return {
      online: true,
      baseUrl: trimmed,
      modeLabel: 'Direct Custom Endpoint Active',
      isCustomDirectUrl: true
    }
  }

  // 3. Otherwise treat as a SARs-Data FastAPI root URL (e.g. http://localhost:8000)
  const cleanUrl = trimmed.replace(/\/+$/, '').replace(/\/api$/, '')
  try {
    const controller = new AbortController()
    const timer = window.setTimeout(() => controller.abort(), 1800)
    const resp = await fetch(`${cleanUrl}/api/health`, { signal: controller.signal })
    window.clearTimeout(timer)
    if (resp.ok) {
      const data = await resp.json()
      return {
        online: true,
        baseUrl: cleanUrl,
        modeLabel: `Live FastAPI (${data.service || 'Amazon Sentinel'})`,
        version: data.version,
        isCustomDirectUrl: false
      }
    }
  } catch {
    // Server offline -> use client-side calibrated SARs-Data engine
  }
  return {
    online: false,
    baseUrl: cleanUrl,
    modeLabel: 'SARs-Data Calibrated Reference Engine (Local)',
    isCustomDirectUrl: false
  }
}

/**
 * Exact port of BESO47/SARs-Data's deterministic SAR observation & tile renderer
 * (`backend/app/processing/sentinel1/preprocessing.py` & `backend/app/storage/manager.py`)
 * Generates a 256x256 RGBA PNG data URL for any study region and dataset.
 */
export function renderSarsDataOverlayPng(
  dataset: SarsDatasetId,
  regionId: RegionId,
  startDate: string,
  endDate: string
): string {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''

  const imgData = ctx.createImageData(size, size)
  const data = imgData.data

  const regionSeed =
    regionId.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0) * 31 +
    Number(startDate.replace(/-/g, '').slice(0, 8) || 20240301)
  const obsMonth = Number(startDate.slice(5, 7)) || 3
  const seasonalPulse = [2, 3, 4, 5, 6].includes(obsMonth) ? 1.0 : 0.45

  for (let r = 0; r < size; r++) {
    const ny = 1.0 - (2.0 * r) / (size - 1) // [+1 top, -1 bottom]
    for (let c = 0; c < size; c++) {
      const nx = (2.0 * c) / (size - 1) - 1.0 // [-1 left, +1 right]
      const idx = (r * size + c) * 4

      const riverCenterY = 0.18 * Math.sin(2.6 * nx + (regionSeed % 5) * 0.4) - 0.05 * nx
      const distToRiver = Math.abs(ny - riverCenterY)

      const tributaryDist = Math.abs(ny - 0.35 - 0.25 * Math.pow(nx + 0.3, 2))
      const effectiveDist = Math.min(distToRiver, tributaryDist * 1.35)

      const jrcOccurrence = Math.min(
        100.0,
        Math.max(0.0, 100.0 * Math.exp(-Math.pow(distToRiver / 0.095, 2.4)))
      )

      const slopeDeg = Math.min(
        22.0,
        Math.max(
          0.1,
          0.6 +
            8.5 * Math.pow(Math.max(effectiveDist - 0.36, 0.0), 1.4) +
            1.8 * Math.abs(Math.sin(4.0 * nx) * Math.cos(4.0 * ny))
        )
      )

      const canopyMask =
        jrcOccurrence < 65.0 && (effectiveDist > 0.11 || Math.sin(5.0 * nx + ny) > -0.4)

      const microWave = Math.sin(14.0 * nx + 9.0 * ny) * Math.cos(11.0 * ny - 7.0 * nx)

      if (dataset === 'flood') {
        if (jrcOccurrence >= 80.0) {
          data[idx] = 21
          data[idx + 1] = 101
          data[idx + 2] = 192
          data[idx + 3] = 225
        } else if (
          effectiveDist >= 0.085 &&
          effectiveDist <= 0.155 + 0.075 * seasonalPulse + 0.015 * microWave &&
          slopeDeg < 5.0
        ) {
          data[idx] = 0
          data[idx + 1] = 229
          data[idx + 2] = 255
          data[idx + 3] = 215
        } else if (
          canopyMask &&
          effectiveDist > 0.155 + 0.075 * seasonalPulse &&
          effectiveDist <= 0.255 + 0.105 * seasonalPulse + 0.02 * microWave &&
          slopeDeg < 5.0
        ) {
          data[idx] = 0
          data[idx + 1] = 230
          data[idx + 2] = 118
          data[idx + 3] = 210
        } else if (
          effectiveDist > 0.255 + 0.105 * seasonalPulse &&
          effectiveDist <= 0.295 + 0.105 * seasonalPulse &&
          microWave > 0.15
        ) {
          data[idx] = 255
          data[idx + 1] = 179
          data[idx + 2] = 0
          data[idx + 3] = 190
        } else {
          data[idx + 3] = 0
        }
      } else if (dataset === 'nisar') {
        let hhDb = -8.2 + 0.9 * Math.sin(3.0 * nx) * Math.cos(3.0 * ny)
        if (jrcOccurrence >= 80.0 || effectiveDist <= 0.12) {
          hhDb = -19.5
        } else if (effectiveDist <= 0.31 + 0.12 * seasonalPulse && slopeDeg < 5.5) {
          hhDb = -2.2 + 1.1 * microWave
        }
        const vmin = -24.0
        const vmax = -1.0
        const norm = Math.min(1.0, Math.max(0.0, (hhDb - vmin) / (vmax - vmin)))
        data[idx] = Math.round(40 + 180 * norm)
        data[idx + 1] = Math.round(180 - 90 * Math.abs(norm - 0.5))
        data[idx + 2] = Math.round(120 + 135 * norm)
        data[idx + 3] = 200
      } else if (dataset === 'forest') {
        const roadCorridor = Math.abs(ny + 0.28 * nx - 0.12) < 0.045
        const clearingPatch =
          effectiveDist > 0.22 &&
          effectiveDist < 0.48 &&
          Math.sin(19.0 * nx + (regionSeed % 7)) * Math.cos(17.0 * ny) > 0.62
        if ((roadCorridor && microWave > 0.1) || clearingPatch) {
          const isHigh = microWave > 0.35
          data[idx] = 255
          data[idx + 1] = isHigh ? 23 : 145
          data[idx + 2] = isHigh ? 68 : 0
          data[idx + 3] = 225
        } else {
          data[idx + 3] = 0
        }
      } else if (dataset === 'rainfall') {
        const norm = Math.min(
          1.0,
          Math.max(
            0.0,
            0.55 +
              0.3 * Math.sin(2.2 * nx + (endDate.charCodeAt(9) || 1)) +
              0.2 * Math.cos(2.5 * ny)
          )
        )
        data[idx] = Math.round(224 * (1.0 - norm) + 26 * norm)
        data[idx + 1] = Math.round(247 * (1.0 - norm) + 35 * norm)
        data[idx + 2] = Math.round(250 * (1.0 - norm * 0.4))
        data[idx + 3] = norm > 0.02 ? 185 : 0
      }
    }
  }

  ctx.putImageData(imgData, 0, 0)
  return canvas.toDataURL('image/png')
}

/**
 * Fetch a Cesium layer specification from the BESO47/SARs-Data backend
 * (`/api/{dataset}/layer`), falling back seamlessly to the local calibrated SARs-Data
 * generator if the FastAPI server is not running.
 */
export async function fetchSarsDatasetLayer(
  baseUrl: string,
  dataset: SarsDatasetId,
  regionId: RegionId,
  startDate: string,
  endDate: string
): Promise<CesiumLayerResponse> {
  const cleanUrl = baseUrl.trim().replace(/\/+$/, '').replace(/\/api$/, '')
  const region = PREDEFINED_STUDY_AREAS[regionId]

  try {
    const controller = new AbortController()
    const timer = window.setTimeout(() => controller.abort(), 2500)
    const params = new URLSearchParams({
      region_id: regionId,
      start_date: startDate,
      end_date: endDate
    })
    const resp = await fetch(`${cleanUrl}/api/${dataset}/layer?${params.toString()}`, {
      signal: controller.signal
    })
    window.clearTimeout(timer)

    if (resp.ok) {
      const json = (await resp.json()) as CesiumLayerResponse
      if (json.tile_url_template && json.tile_url_template.startsWith('/')) {
        json.tile_url_template = `${cleanUrl}${json.tile_url_template}`
      }
      return json
    }
  } catch {
    // Fallback to local calibrated SARs-Data generator below
  }

  return {
    layer_id: `${dataset}-${regionId}-${startDate}-${endDate}`,
    dataset,
    title: `${DATASET_LEGENDS[dataset].title} (${region.name})`,
    source: 'BESO47/SARs-Data Calibrated Pipeline',
    layer_type: 'hybrid',
    observation_start: startDate,
    observation_end: endDate,
    tile_url_template: null,
    DataUrlFallback: renderSarsDataOverlayPng(dataset, regionId, startDate, endDate),
    bbox: region.bbox,
    default_opacity: dataset === 'rainfall' ? 0.65 : 0.85,
    z_index: 10,
    legend: DATASET_LEGENDS[dataset],
    status: 'demo'
  }
}

/**
 * Resolve any custom URL pasted into the API URL input:
 * - Direct XYZ tile template ({z}/{x}/{y} or {z}/{y}/{x})
 * - Direct PNG/JPG image URL
 * - Direct CesiumLayerResponse JSON endpoint (/api/flood/layer?...)
 * - Direct GeoJSON FeatureCollection endpoint (/api/forest/alerts?...)
 */
export async function fetchCustomDirectEndpointLayer(
  customUrl: string,
  fallbackBbox: [number, number, number, number]
): Promise<CesiumLayerResponse> {
  const trimmed = customUrl.trim()
  if (!trimmed) {
    throw new Error('Enter a custom API, XYZ tile, GeoJSON, or image URL.')
  }

  const normalizeBbox = (candidate: unknown): [number, number, number, number] => {
    if (
      Array.isArray(candidate) &&
      candidate.length === 4 &&
      candidate.every((n) => typeof n === 'number' && Number.isFinite(n))
    ) {
      return candidate as [number, number, number, number]
    }
    return fallbackBbox
  }

  // 1. Direct XYZ tile URL template
  if (trimmed.includes('{z}') && (trimmed.includes('{x}') || trimmed.includes('{y}'))) {
    return {
      layer_id: `custom-xyz-${Date.now()}`,
      dataset: 'custom',
      title: 'Custom XYZ Tile Stream',
      source: trimmed,
      layer_type: 'xyz_tiles',
      observation_start: '',
      observation_end: '',
      tile_url_template: trimmed,
      bbox: [-180, -85, 180, 85],
      default_opacity: 0.88,
      z_index: 20,
      legend: {
        title: 'Custom XYZ Tile Layer',
        items: [
          {
            code: 'xyz',
            label: 'Active XYZ Tile Stream',
            color_hex: '#38BDF8',
            description: trimmed
          }
        ]
      },
      status: 'available'
    }
  }

  // 2. Direct single image URL (.png / .jpg / .webp) or data:image/ URI
  if (/^data:image\//i.test(trimmed) || /\.(png|jpg|jpeg|webp)(\?.*)?$/i.test(trimmed)) {
    return {
      layer_id: `custom-img-${Date.now()}`,
      dataset: 'custom',
      title: 'Custom Draped Image Overlay',
      source: trimmed.startsWith('data:') ? 'Inline Data Image' : trimmed,
      layer_type: 'hybrid',
      observation_start: '',
      observation_end: '',
      tile_url_template: null,
      DataUrlFallback: trimmed,
      bbox: fallbackBbox,
      default_opacity: 0.88,
      z_index: 20,
      legend: {
        title: 'Custom Image Overlay',
        items: [
          {
            code: 'img',
            label: 'Draped Georeferenced Image',
            color_hex: '#00E676',
            description: trimmed.startsWith('data:') ? 'Inline Data Image' : trimmed
          }
        ]
      },
      status: 'available'
    }
  }

  // 3. Fetch endpoint (if user entered /flood, /nisar, /forest, or /rainfall without /layer, fall back to /layer)
  let resolvedUrl = trimmed
  let resp = await fetch(resolvedUrl)
  if (!resp.ok && /\/(flood|nisar|forest|rainfall)\/?(\?.*)?$/i.test(trimmed)) {
    const withLayerPath = trimmed.replace(
      /\/(flood|nisar|forest|rainfall)\/?(\?.*)?$/i,
      '/$1/layer$2'
    )
    const retryResp = await fetch(withLayerPath)
    if (retryResp.ok) {
      resp = retryResp
      resolvedUrl = withLayerPath
    }
  }
  if (!resp.ok) {
    throw new Error(`HTTP ${resp.status} from ${resolvedUrl}`)
  }

  const contentType = resp.headers.get('content-type') || ''
  if (contentType.startsWith('image/')) {
    return {
      layer_id: `custom-img-${Date.now()}`,
      dataset: 'custom',
      title: 'Custom API Image Overlay',
      source: resolvedUrl,
      layer_type: 'hybrid',
      observation_start: '',
      observation_end: '',
      tile_url_template: null,
      DataUrlFallback: resolvedUrl,
      bbox: fallbackBbox,
      default_opacity: 0.88,
      z_index: 20,
      legend: {
        title: 'Custom API Image Overlay',
        items: [
          {
            code: 'img',
            label: 'Draped Georeferenced Image',
            color_hex: '#00E676',
            description: resolvedUrl
          }
        ]
      },
      status: 'available'
    }
  }

  const data = await resp.json()
  const parsedOrigin = new URL(resolvedUrl).origin
  const absolutize = (u: string): string => (u.startsWith('/') ? `${parsedOrigin}${u}` : u)

  // 3a. BESO47/SARs-Data CesiumLayerResponse
  if (
    data &&
    typeof data === 'object' &&
    ('layer_id' in data || 'tile_url_template' in data || 'DataUrlFallback' in data)
  ) {
    const layer = data as CesiumLayerResponse
    if (layer.tile_url_template) {
      layer.tile_url_template = absolutize(layer.tile_url_template)
    }
    if (layer.DataUrlFallback && layer.DataUrlFallback.startsWith('/')) {
      layer.DataUrlFallback = absolutize(layer.DataUrlFallback)
    }
    layer.bbox = normalizeBbox(layer.bbox)
    return layer
  }

  // 3b. GeoJSON FeatureCollection or single GeoJSON Feature
  const rawGeo =
    data?.type === 'FeatureCollection' || data?.type === 'Feature' ? data : data?.geojson
  if (rawGeo && (rawGeo.type === 'FeatureCollection' || rawGeo.type === 'Feature')) {
    const featureCollection =
      rawGeo.type === 'Feature'
        ? { type: 'FeatureCollection', bbox: rawGeo.bbox ?? data?.bbox, features: [rawGeo] }
        : rawGeo
    return {
      layer_id: `custom-geojson-${Date.now()}`,
      dataset: 'custom-geojson',
      title: data?.title || 'Custom GeoJSON Vector Layer',
      source: resolvedUrl,
      layer_type: 'geojson',
      observation_start: '',
      observation_end: '',
      tile_url_template: null,
      geojson: featureCollection,
      bbox: normalizeBbox(featureCollection.bbox ?? data?.bbox),
      default_opacity: 0.85,
      z_index: 20,
      legend: {
        title: 'Custom GeoJSON Features',
        items: [
          {
            code: 'feature',
            label: `GeoJSON Features (${featureCollection.features?.length ?? 0})`,
            color_hex: '#FF1744',
            description: resolvedUrl
          }
        ]
      },
      status: 'available'
    }
  }

  // 3c. Generic JSON descriptor containing tile_url / image_url / overlay_url / url
  const tileUrl = typeof data?.tile_url === 'string' ? data.tile_url : null
  const imageOrUrl =
    typeof data?.image_url === 'string'
      ? data.image_url
      : typeof data?.overlay_url === 'string'
        ? data.overlay_url
        : typeof data?.url === 'string'
          ? data.url
          : null

  if (tileUrl || imageOrUrl) {
    const candidate = absolutize(tileUrl || imageOrUrl!)
    const isXyz =
      Boolean(tileUrl) ||
      (candidate.includes('{z}') && (candidate.includes('{x}') || candidate.includes('{y}')))
    return {
      layer_id: `custom-api-${Date.now()}`,
      dataset: 'custom',
      title: typeof data?.title === 'string' ? data.title : 'Custom API Overlay',
      source: resolvedUrl,
      layer_type: isXyz ? 'xyz_tiles' : 'hybrid',
      observation_start: '',
      observation_end: '',
      tile_url_template: isXyz ? candidate : null,
      DataUrlFallback: isXyz ? undefined : candidate,
      bbox: normalizeBbox(data?.bbox),
      default_opacity: 0.88,
      z_index: 20,
      legend: {
        title: typeof data?.title === 'string' ? data.title : 'Custom API Overlay',
        items: [
          {
            code: isXyz ? 'xyz' : 'img',
            label: isXyz ? 'Custom API Tile Stream' : 'Custom API Image Overlay',
            color_hex: '#38BDF8',
            description: candidate
          }
        ]
      },
      status: 'available'
    }
  }

  throw new Error('Unrecognized JSON response format')
}
