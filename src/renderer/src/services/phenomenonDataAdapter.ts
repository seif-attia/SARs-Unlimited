import { ALL_PHENOMENON_SLOTS } from '../data/phenomenonCatalog'
import type {
  DatasetStatus,
  EventRecord,
  GeoJsonPolygon,
  HoveredLocationInfo,
  MediaAsset,
  MetricCardItem,
  PhenomenonDefinition,
  ScientificExplanationContent,
  StatisticsPanelData,
  TimeSeriesChartPoint,
  YearlyEventCountPoint
} from '../types/phenomenon'
import type {
  AmazonEvent,
  AmazonPhenomenon,
  AmazonSarDataset,
  DatasetSource,
  SarOverlayLayer,
  StudyRegion,
  TimelineMonthPoint
} from '../types/sar'
import { PREDEFINED_STUDY_AREAS } from './sarsDataApi'

export interface AdaptedSarPlatformData {
  dataset: AmazonSarDataset
  phenomena: PhenomenonDefinition[]
  events: EventRecord[]
  months: TimelineMonthPoint[]
  regions: Record<string, StudyRegion>
  sources: DatasetSource[]
  status: DatasetStatus
}

function bboxToGeoJsonPolygon(bbox: [number, number, number, number]): GeoJsonPolygon {
  const [west, south, east, north] = bbox
  return {
    type: 'Polygon',
    coordinates: [
      [
        [west, south],
        [east, south],
        [east, north],
        [west, north],
        [west, south]
      ]
    ]
  }
}

/**
 * Ray-casting point-in-polygon check for [lon, lat] against a polygon coordinate ring.
 */
export function isPointInPolygonRing(
  lon: number,
  lat: number,
  ring: [number, number][]
): boolean {
  if (!ring || ring.length < 3) return false
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0]
    const yi = ring[i][1]
    const xj = ring[j][0]
    const yj = ring[j][1]

    const intersect =
      yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi + 1e-12) + xi
    if (intersect) inside = !inside
  }
  return inside
}

export function isPointInBbox(
  lon: number,
  lat: number,
  bbox: [number, number, number, number],
  padDeg = 0
): boolean {
  if (!Array.isArray(bbox) || bbox.length !== 4) return false
  const [west, south, east, north] = bbox
  return (
    lon >= west - padDeg &&
    lon <= east + padDeg &&
    lat >= south - padDeg &&
    lat <= north + padDeg
  )
}

/**
 * Map verified crisis event IDs to their primary and secondary Phenomenon slots.
 */
const EVENT_TO_PHENOMENON_MAP: Record<string, { primary: string; additional: string[] }> = {
  turkiye_insar_2023: {
    primary: 'global-pheno-1',
    additional: ['global-pheno-6']
  },
  lapalma_volcano_2021: {
    primary: 'global-pheno-1',
    additional: ['global-pheno-6']
  },
  pakistan_flood_2022: {
    primary: 'global-pheno-2',
    additional: ['global-pheno-6']
  },
  brazil_rs_flood_2024: {
    primary: 'global-pheno-2',
    additional: ['global-pheno-6']
  },
  larsen_c_a68_2017: {
    primary: 'global-pheno-3',
    additional: ['global-pheno-6']
  },
  antarctic_sea_ice_2023: {
    primary: 'global-pheno-3',
    additional: ['global-pheno-6']
  },
  aus_fires_2020: {
    primary: 'global-pheno-4',
    additional: ['global-pheno-6']
  },
  canada_boreal_2023: {
    primary: 'global-pheno-4',
    additional: ['global-pheno-6']
  },
  mauritius_spill_2020: {
    primary: 'global-pheno-5',
    additional: ['global-pheno-6']
  },
  el_nino_drought_2015: {
    primary: 'amazon-pheno-7',
    additional: ['amazon-pheno-3', 'amazon-pheno-6']
  },
  amazon_fire_surge_2019: {
    primary: 'amazon-pheno-4',
    additional: ['amazon-pheno-5']
  },
  manaus_flood_2021: {
    primary: 'amazon-pheno-2',
    additional: ['amazon-pheno-1', 'amazon-pheno-8']
  },
  severe_drought_2023: {
    primary: 'amazon-pheno-7',
    additional: ['amazon-pheno-3', 'amazon-pheno-6']
  },
  drought_fires_2024: {
    primary: 'amazon-pheno-5',
    additional: ['amazon-pheno-3', 'amazon-pheno-4', 'amazon-pheno-6', 'amazon-pheno-7']
  },
  nisar_lband_2026: {
    primary: 'amazon-pheno-8',
    additional: ['amazon-pheno-1', 'amazon-pheno-2', 'amazon-pheno-4']
  }
}

/**
 * Verified event metadata from docs/SAR_EARTH_AND_AMAZON_ENCYCLOPEDIA.md (no fabricated numbers).
 */
const VERIFIED_EVENT_METRICS: Record<
  string,
  { magnitude?: string; severity?: string; affectedArea?: string; country: string }
> = {
  turkiye_insar_2023: {
    magnitude: 'Mw 7.8 / 4.2 m Slip',
    severity: '28.44% |ΔVV| Disruption',
    affectedArea: '~300 km Fault Zone',
    country: 'Türkiye / Syria'
  },
  lapalma_volcano_2021: {
    magnitude: 'VEI 3 · 85-Day Eruption',
    severity: '+2.18% Rough Aa-Lava',
    affectedArea: '14.3% Tephra Blanket',
    country: 'Spain (Canary Islands)'
  },
  pakistan_flood_2022: {
    magnitude: '+14.0% New Inundation',
    severity: 'VV ≤ -15 dB Specular',
    affectedArea: '~100 km Wide Inland Sea',
    country: 'Pakistan (Sindh)'
  },
  brazil_rs_flood_2024: {
    magnitude: '+14.3% Delta Submerged',
    severity: '+8.18% Urban Double-Bounce',
    affectedArea: 'Guaíba Basin / Porto Alegre',
    country: 'Brazil (Rio Grande do Sul)'
  },
  larsen_c_a68_2017: {
    magnitude: '1 Trillion Tonnes (A-68)',
    severity: '13.94% Open Rift Lead',
    affectedArea: '~5,800 km² (~200 km)',
    country: 'Antarctica (Larsen C)'
  },
  antarctic_sea_ice_2023: {
    magnitude: '6σ Winter Anomaly',
    severity: '-15.15% Missing Pack Ice',
    affectedArea: '>1.6M km² Below Baseline',
    country: 'Antarctica (Weddell / Haakon VII)'
  },
  aus_fires_2020: {
    magnitude: '8.1% Severe Crown Scorch',
    severity: '8.0% Canopy Thinning',
    affectedArea: 'NSW Eucalyptus Belt',
    country: 'Australia (New South Wales)'
  },
  canada_boreal_2023: {
    magnitude: '3.67% Severe Taiga Burn',
    severity: '15.37% Moderate Scorch',
    affectedArea: '>15M ha National Season',
    country: 'Canada (Northern Quebec)'
  },
  mauritius_spill_2020: {
    magnitude: '>1,000 t Fuel Oil',
    severity: '5.08% Heavy Viscous Slick',
    affectedArea: '9.83% Bragg-Damped Sheen',
    country: 'Mauritius (Pointe d’Esny)'
  },
  el_nino_drought_2015: {
    magnitude: '15.48% Exposed Bars',
    severity: 'ΔVV ≥ +2 dB Roughness',
    affectedArea: '3,195.7 km² Manaus AOI',
    country: 'Brazil (Amazonas)'
  },
  amazon_fire_surge_2019: {
    magnitude: '23.47% Clear-Cut Loss',
    severity: '29.79% Edge Thinning',
    affectedArea: 'BR-163 Pará Corridor',
    country: 'Brazil (Pará)'
  },
  manaus_flood_2021: {
    magnitude: '30.02 m Crest (119-Yr Rec)',
    severity: '22.44% Open Water',
    affectedArea: '+4.34% New Flood / 0.99% Igapó',
    country: 'Brazil (Amazonas)'
  },
  severe_drought_2023: {
    magnitude: '12.70 m Stage · 39.1 °C',
    severity: '-13.45% Water Contraction',
    affectedArea: '921.7 km² Lake Tefé AOI',
    country: 'Brazil (Amazonas)'
  },
  drought_fires_2024: {
    magnitude: '12.66 m Stage · 5,144 Fires',
    severity: '4.22% ΔVH Canopy Loss',
    affectedArea: '48,828.5 km² Apuí–Lábrea',
    country: 'Brazil (Amazonas)'
  },
  nisar_lband_2026: {
    magnitude: '+5.01 dB HHHH/HVHV Gap',
    severity: '13.06% Flood Double-Bounce Δ',
    affectedArea: 'NISAR Track 140 Swath',
    country: 'Brazil (Amazonas)'
  }
}

function buildEventExplanation(
  evt: AmazonEvent,
  region: StudyRegion | undefined,
  sources: DatasetSource[]
): ScientificExplanationContent {
  const defaultLayer =
    evt.layers.find((l) => l.id === evt.default_layer_id) ?? evt.layers[0]
  const sourceIds = Array.from(new Set(evt.layers.map((l) => l.source_id)))
  const matchedSources = sources.filter((s) => sourceIds.includes(s.id))
  const sourceTitles =
    matchedSources.map((s) => s.title).join(' · ') ||
    'Copernicus Sentinel-1 RTC & NASA Earthdata Cloud'

  const legendSummary =
    defaultLayer?.legend
      ?.map((item) => `${item.label} (${item.color})`)
      .join(' · ') ?? 'See active radar overlay color key.'

  return {
    whatHappened: {
      description: evt.summary,
      when: `${evt.timing} (Timeline anchor: ${evt.timeline_month})`,
      where: `${region?.name ?? evt.name} (${evt.center[1].toFixed(2)}°, ${evt.center[0].toFixed(2)}°)`,
      observations: `${evt.headline_metric}. ${evt.comparison_pair?.delta_summary ?? ''}`
    },
    whySarDetectsIt: {
      primaryMechanism: evt.sar_physics.primary_sensitivity,
      roughnessAndBackscatter: evt.sar_physics.roughness_mechanism,
      dielectricAndMoisture: evt.sar_physics.dielectric_mechanism,
      polarizationAndWavelength: `${evt.sar_physics.polarization_note} ${evt.sar_physics.frequency_comparison}`
    },
    environmentalAndHumanImpact: {
      environmentalImpact: evt.drivers.natural_driver,
      humanAndInfrastructureImpact: evt.drivers.human_driver,
      naturalDriver: evt.drivers.natural_driver,
      humanDriver: evt.drivers.human_driver,
      geographicExtent: `Bounding Box [${evt.bbox.map((v) => v.toFixed(2)).join(', ')}]${region?.area_km2 ? ` · Study Area ${region.area_km2.toLocaleString()} km²` : ''}`,
      overlayReadingGuide: legendSummary
    },
    dataUsedAndMethodology: {
      satelliteMission: Array.from(new Set(evt.layers.map((l) => l.sensor))).join(' + '),
      sensorAndBand: Array.from(
        new Set(evt.layers.map((l) => `${l.band} (${l.polarization})`))
      ).join(' · '),
      acquisitionDates: Array.from(new Set(evt.layers.map((l) => l.acquisition_date))).join(', '),
      processingMethodology: `Radiometrically Terrain-Corrected (RTC) backscatter & change comparison (${evt.comparison_pair?.before_label ?? 'Baseline'} vs. ${evt.comparison_pair?.after_label ?? 'Event Peak'}).`,
      dataResolution: '10 m – 30 m geocoded SAR raster',
      observationPeriod: `${evt.timing} (within 2015–2026 validated archive)`,
      dataSource: sourceTitles,
      processingModel: defaultLayer?.granule_id ?? 'Validated SAR Granule Pipeline',
      granuleId: defaultLayer?.granule_id
    }
  }
}

function buildEventMediaAssets(
  evt: AmazonEvent,
  sources: DatasetSource[]
): MediaAsset[] {
  const assets: MediaAsset[] = []
  const primaryLayer =
    evt.layers.find((l) => l.id === evt.default_layer_id) ?? evt.layers[0]
  const secondaryLayer =
    evt.layers.find((l) => l.id !== primaryLayer?.id && (l.role === 'before' || l.role === 'after' || l.role === 'cband_compare' || l.role === 'polarization')) ??
    evt.layers.find((l) => l.id !== primaryLayer?.id)

  if (primaryLayer) {
    assets.push({
      id: `${evt.id}-live-swipe-demo`,
      title: `Interactive SAR Split-Screen Comparator: ${evt.name}`,
      type: 'comparison_swipe',
      assetPath: primaryLayer.asset_path,
      compareAssetPath: secondaryLayer?.asset_path ?? primaryLayer.asset_path,
      caption: `${evt.comparison_pair?.before_label ?? secondaryLayer?.title ?? 'Baseline'} ⟷ ${evt.comparison_pair?.after_label ?? primaryLayer.title} · ${evt.headline_metric}`,
      sensor: primaryLayer.sensor,
      band: primaryLayer.band,
      polarization: primaryLayer.polarization,
      acquisitionDate: primaryLayer.acquisition_date,
      granuleId: primaryLayer.granule_id,
      legend: primaryLayer.legend,
      stats: primaryLayer.stats,
      available: true
    })
  }

  for (const lyr of evt.layers) {
    assets.push({
      id: `${evt.id}-layer-${lyr.id}`,
      title: lyr.title,
      type: 'sar_raster',
      assetPath: lyr.asset_path,
      caption: `${lyr.sensor} · ${lyr.band} · Pol: ${lyr.polarization} · Acquired: ${lyr.acquisition_date} (${lyr.granule_id})`,
      sensor: lyr.sensor,
      band: lyr.band,
      polarization: lyr.polarization,
      acquisitionDate: lyr.acquisition_date,
      granuleId: lyr.granule_id,
      legend: lyr.legend,
      stats: lyr.stats,
      available: true
    })
  }

  const matchedSource = sources.find((s) => s.id === primaryLayer?.source_id)
  if (matchedSource?.url) {
    assets.push({
      id: `${evt.id}-source-link`,
      title: matchedSource.title,
      type: 'external_report',
      url: matchedSource.url,
      caption: `Publisher: ${matchedSource.publisher} (Accessed ${matchedSource.accessed})`,
      available: true
    })
  }

  return assets
}

export function adaptAmazonSarDataset(raw: unknown): AdaptedSarPlatformData {
  const ds = raw as AmazonSarDataset
  if (!ds || !Array.isArray(ds.events) || !Array.isArray(ds.phenomena) || !ds.timeline?.months) {
    throw new Error('Invalid or malformed SAR dataset structure')
  }

  const sourcePhenMap = new Map<string, AmazonPhenomenon>()
  for (const p of ds.phenomena) {
    sourcePhenMap.set(p.id, p)
  }

  // Adapt all 15 verified events into strongly-typed EventRecords
  const adaptedEvents: EventRecord[] = ds.events.map((evt) => {
    const mapping = EVENT_TO_PHENOMENON_MAP[evt.id] ?? {
      primary: evt.scope === 'global' ? 'global-pheno-6' : 'amazon-pheno-2',
      additional: []
    }
    const region = ds.regions[evt.region_id]
    const meta = VERIFIED_EVENT_METRICS[evt.id]
    const defaultLayer =
      evt.layers.find((l) => l.id === evt.default_layer_id) ?? evt.layers[0]

    // Merge all layer stats into measurements without inventing any values
    const measurements: Record<string, string | number> = {}
    for (const lyr of evt.layers) {
      if (lyr.stats) {
        for (const [k, v] of Object.entries(lyr.stats)) {
          measurements[k] = v
        }
      }
    }

    const sourceIds = Array.from(new Set(evt.layers.map((l) => l.source_id)))
    const matchedSources = ds.sources.filter((s) => sourceIds.includes(s.id))

    return {
      eventId: evt.id,
      phenomenonId: mapping.primary,
      additionalPhenomenonIds: mapping.additional,
      eventName: evt.name,
      eventDate: evt.timeline_month,
      displayDate: evt.timing,
      startDate: evt.timeline_month,
      endDate: evt.timeline_month,
      regionId: evt.region_id,
      country: meta?.country ?? region?.country ?? (evt.scope === 'global' ? 'Global' : 'Brazil'),
      regionName: region?.name ?? evt.name,
      latitude: evt.center[1],
      longitude: evt.center[0],
      geometry: bboxToGeoJsonPolygon(evt.bbox),
      boundingBox: evt.bbox,
      severity: meta?.severity,
      magnitude: meta?.magnitude,
      affectedArea:
        meta?.affectedArea ??
        (region?.area_km2 ? `${region.area_km2.toLocaleString()} km²` : undefined),
      headlineMetric: evt.headline_metric,
      summary: evt.summary,
      measurements,
      comparisonPair: evt.comparison_pair,
      scientificExplanation: buildEventExplanation(evt, region, ds.sources),
      causes: {
        naturalDriver: evt.drivers.natural_driver,
        humanDriver: evt.drivers.human_driver
      },
      impacts: {
        environmentalImpact: evt.drivers.natural_driver,
        humanAndInfrastructureImpact: evt.drivers.human_driver,
        geographicExtent:
          meta?.affectedArea ??
          (region?.area_km2 ? `${region.area_km2.toLocaleString()} km²` : 'Regional AOI')
      },
      satelliteMetadata: {
        mission: defaultLayer?.sensor ?? 'Sentinel-1',
        sensor: defaultLayer?.sensor ?? 'Sentinel-1 C-SAR',
        band: defaultLayer?.band ?? 'C-band (5.6 cm)',
        polarization: defaultLayer?.polarization ?? 'VV',
        granuleId: defaultLayer?.granule_id ?? 'Verified Granule',
        acquisitionDate: defaultLayer?.acquisition_date ?? evt.timeline_month,
        resolution: '10 m – 30 m RTC'
      },
      processingMetadata: {
        methodology: 'Radiometrically Terrain-Corrected (RTC) Backscatter & Change Detection',
        model: defaultLayer?.granule_id ?? 'SARs-Unlimited Schema 2.0',
        observationPeriod: evt.timing
      },
      reportUrl: matchedSources[0]?.url ?? ds.challenge_url,
      sources: matchedSources,
      mediaAssets: buildEventMediaAssets(evt, ds.sources),
      layers: evt.layers,
      defaultLayerId: evt.default_layer_id,
      dataSource: matchedSources.map((s) => s.publisher).join(' · ') || 'NASA / ESA / JAXA',
      provenance: `Verified Granule (${defaultLayer?.granule_id ?? evt.id})`,
      status: 'AVAILABLE',
      scope: evt.scope === 'global' ? 'global' : 'amazon',
      accentColor: evt.color
    }
  })

  // Enrich the 6 Global + 8 Amazon Phenomenon Definitions with layers and seasonal rhythms
  const adaptedPhenomena: PhenomenonDefinition[] = ALL_PHENOMENON_SLOTS.map((slot) => {
    const collectedLayers: SarOverlayLayer[] = []
    const seenLayerIds = new Set<string>()
    let seasonalRhythm = slot.seasonalRhythm

    for (const srcId of slot.sourcePhenomenonIds) {
      const srcPhen = sourcePhenMap.get(srcId)
      if (srcPhen) {
        if (!seasonalRhythm && srcPhen.seasonal_rhythm?.length) {
          seasonalRhythm = srcPhen.seasonal_rhythm
        }
        for (const lyr of srcPhen.layers) {
          if (!seenLayerIds.has(lyr.id)) {
            seenLayerIds.add(lyr.id)
            collectedLayers.push(lyr)
          }
        }
      }
    }

    for (const eid of slot.eventIds) {
      const evt = adaptedEvents.find((e) => e.eventId === eid)
      if (evt) {
        for (const lyr of evt.layers) {
          if (!seenLayerIds.has(lyr.id)) {
            seenLayerIds.add(lyr.id)
            collectedLayers.push(lyr)
          }
        }
      }
    }

    return {
      ...slot,
      layers: collectedLayers,
      defaultLayerId: collectedLayers[0]?.id,
      seasonalRhythm
    }
  })

  return {
    dataset: ds,
    phenomena: adaptedPhenomena,
    events: adaptedEvents,
    months: ds.timeline.months,
    regions: ds.regions,
    sources: ds.sources,
    status: 'AVAILABLE'
  }
}

/**
 * Evaluate geographic location for a given (lon, lat) cursor position on the globe.
 * Uses the exact Amazon Basin polygon (`amazon_basin_outline`) first, then checks
 * sub-regions and global crisis regions.
 */
export function resolveGeographicCursorLocation(
  lon: number | null,
  lat: number | null,
  platformData: AdaptedSarPlatformData | null,
  selectedDate: string
): HoveredLocationInfo {
  if (lon === null || lat === null || !Number.isFinite(lon) || !Number.isFinite(lat)) {
    return {
      state: 'OUTSIDE',
      latitude: null,
      longitude: null,
      regionId: null,
      regionName: null,
      country: null,
      isAmazonBasin: false,
      boundaryPrecision: 'none',
      matchedEventIds: [],
      matchedPhenomenonIds: [],
      statusMessage: 'Move cursor over the 3D Earth to inspect geographic SAR regions.'
    }
  }

  if (!platformData) {
    return {
      state: 'NO DATA',
      latitude: lat,
      longitude: lon,
      regionId: null,
      regionName: null,
      country: null,
      isAmazonBasin: false,
      boundaryPrecision: 'none',
      matchedEventIds: [],
      matchedPhenomenonIds: [],
      statusMessage: 'Loading SAR dataset...'
    }
  }

  const { dataset, events, phenomena } = platformData

  // 1. Check specific study regions in dataset.regions (with small 1.8° hover tolerance for crisp UX at orbital zoom)
  let matchedRegion: StudyRegion | null = null
  let bestArea = Number.POSITIVE_INFINITY
  for (const reg of Object.values(dataset.regions)) {
    if (isPointInBbox(lon, lat, reg.bbox, 1.8)) {
      const span = Math.abs(reg.bbox[2] - reg.bbox[0]) * Math.abs(reg.bbox[3] - reg.bbox[1])
      if (span < bestArea) {
        bestArea = span
        matchedRegion = reg
      }
    }
  }

  // 2. Check predefined study areas from sarsDataApi.ts (madeira, mamiraua, xingu, purus)
  let predefinedMatchName: string | null = null
  let predefinedMatchId: string | null = null
  if (!matchedRegion) {
    for (const area of Object.values(PREDEFINED_STUDY_AREAS)) {
      if (area.region_id === 'amazon_basin') continue
      if (isPointInBbox(lon, lat, area.bbox, 1.2)) {
        predefinedMatchId = area.region_id
        predefinedMatchName = area.name
        break
      }
    }
  }

  // 3. Exact Polygon containment check against Amazon Basin Outline (`amazon_basin_outline`)
  const inAmazonPolygon = isPointInPolygonRing(lon, lat, dataset.amazon_basin_outline)

  if (matchedRegion) {
    const isGlobalRegion = matchedRegion.id.startsWith('global_') && matchedRegion.id !== 'global_amz_br163'
    const isAmazon = !isGlobalRegion || inAmazonPolygon

    const regionEvents = events.filter(
      (e) =>
        e.regionId === matchedRegion!.id ||
        isPointInBbox(lon, lat, e.boundingBox, 2.0)
    )
    const regionPhenomena = phenomena.filter(
      (p) =>
        p.associatedRegions.includes(matchedRegion!.id) ||
        (isAmazon && p.geographicScope === 'amazon')
    )

    return {
      state: isAmazon ? 'AMAZON LOCATION' : 'GLOBAL LOCATION',
      latitude: lat,
      longitude: lon,
      regionId: matchedRegion.id,
      regionName: matchedRegion.name,
      country: matchedRegion.country ?? (isAmazon ? 'Brazil / Amazonia' : 'Global Study Site'),
      isAmazonBasin: isAmazon,
      boundaryPrecision: inAmazonPolygon ? 'polygon' : 'bbox-approximate',
      matchedEventIds: regionEvents.map((e) => e.eventId),
      matchedPhenomenonIds: regionPhenomena.map((p) => p.id),
      statusMessage: `${matchedRegion.name} (${selectedDate})`
    }
  }

  if (predefinedMatchId && predefinedMatchName) {
    const amazonPhenomena = phenomena.filter((p) => p.geographicScope === 'amazon')
    return {
      state: 'AMAZON LOCATION',
      latitude: lat,
      longitude: lon,
      regionId: predefinedMatchId,
      regionName: predefinedMatchName,
      country: 'Brazil (Amazon Basin)',
      isAmazonBasin: true,
      boundaryPrecision: inAmazonPolygon ? 'polygon' : 'bbox-approximate',
      matchedEventIds: events.filter((e) => e.scope === 'amazon').map((e) => e.eventId),
      matchedPhenomenonIds: amazonPhenomena.map((p) => p.id),
      statusMessage: `${predefinedMatchName} · Approximate Study Envelope`
    }
  }

  if (inAmazonPolygon) {
    const amazonEvents = events.filter((e) => e.scope === 'amazon')
    const amazonPhenomena = phenomena.filter((p) => p.geographicScope === 'amazon')
    return {
      state: 'AMAZON LOCATION',
      latitude: lat,
      longitude: lon,
      regionId: 'amazon_basin',
      regionName: 'Amazon River Basin (Biome Polygon)',
      country: 'Amazonia (Multi-National)',
      isAmazonBasin: true,
      boundaryPrecision: 'polygon',
      matchedEventIds: amazonEvents.map((e) => e.eventId),
      matchedPhenomenonIds: amazonPhenomena.map((p) => p.id),
      statusMessage: `Amazon Rainforest Biome Polygon (${lat.toFixed(2)}°, ${lon.toFixed(2)}°)`
    }
  }

  // Outside Amazon and specific crisis boxes -> check high-latitude cryosphere or general planetary belt
  const absLat = Math.abs(lat)
  const zoneLabel =
    lat >= 60
      ? 'Arctic & Boreal Permafrost Belt'
      : lat <= -55
        ? 'Antarctic & Southern Ocean Cryosphere'
        : absLat <= 23.5
          ? 'Equatorial Hydro-Climate Belt'
          : 'Mid-Latitude Continental Zone'

  return {
    state: 'NO MATCH',
    latitude: lat,
    longitude: lon,
    regionId: null,
    regionName: zoneLabel,
    country: null,
    isAmazonBasin: false,
    boundaryPrecision: 'none',
    matchedEventIds: [],
    matchedPhenomenonIds: ['global-pheno-6'],
    statusMessage: `${zoneLabel} · Planetary SMAP/AMSR2 coverage active; no discrete crisis pin at cursor.`
  }
}

/**
 * Compute synchronized StatisticsPanelData from the active context.
 * Uses ONLY actual fields from the dataset — never fabricates measurements.
 */
export function buildSynchronizedStatistics(params: {
  platformData: AdaptedSarPlatformData | null
  selectedPhenomenon: PhenomenonDefinition
  selectedEvent: EventRecord | null
  selectedMonth: TimelineMonthPoint | null
  filteredEvents: EventRecord[]
  phenomenonEvents: EventRecord[]
  isDemoFallback: boolean
}): StatisticsPanelData {
  const {
    platformData,
    selectedPhenomenon,
    selectedEvent,
    selectedMonth,
    filteredEvents,
    phenomenonEvents,
    isDemoFallback
  } = params

  if (!platformData) {
    return {
      status: 'NO DATA',
      isDemoData: false,
      contextLabel: 'Loading dataset...',
      topMetrics: [],
      primaryChartTitle: 'Events per year',
      primaryChartType: 'events_per_year',
      yearlySeries: [],
      secondaryChartTitle: 'Observation Series',
      secondaryChartUnit: '',
      secondaryPrimaryLabel: 'Series',
      timeSeries: [],
      footnote: 'Loading verified 2015–2026 SAR archive...'
    }
  }

  const { months } = platformData
  const selectedYear = selectedMonth ? String(selectedMonth.year) : '2026'

  // 1. Build Yearly Event & Scene Count series (2015–2026)
  const years = ['2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025', '2026']
  const yearlySeries: YearlyEventCountPoint[] = years.map((yr) => {
    const yrMonths = months.filter((m) => String(m.year) === yr)
    const evtCount = phenomenonEvents.filter((e) => e.eventDate.startsWith(yr)).length
    const s1Sum = yrMonths.reduce((acc, m) => acc + (m.s1_scenes || 0), 0)
    const nisarSum = yrMonths.reduce((acc, m) => acc + (m.nisar_scenes || 0), 0)
    return {
      year: yr,
      events: evtCount,
      s1Scenes: s1Sum,
      nisarScenes: nisarSum,
      highlight: yr === selectedYear
    }
  })

  // 2. Top Metrics — tailored strictly to actual verified fields of the selected event or phenomenon
  const topMetrics: MetricCardItem[] = []

  topMetrics.push({
    id: 'events-count',
    label: 'EVENTS',
    value: String(phenomenonEvents.length),
    subtext: `${filteredEvents.length} in current view`
  })

  if (selectedEvent) {
    if (selectedEvent.magnitude) {
      // Extract compact primary value if possible for clean big-number display like screenshot
      const magCompact =
        selectedEvent.eventId === 'turkiye_insar_2023'
          ? '7.8'
          : selectedEvent.eventId === 'manaus_flood_2021'
            ? '30.02 m'
            : selectedEvent.eventId === 'severe_drought_2023'
              ? '12.70 m'
              : selectedEvent.eventId === 'drought_fires_2024'
                ? '12.66 m'
                : selectedEvent.eventId === 'nisar_lband_2026'
                  ? '+5.01 dB'
                  : selectedEvent.magnitude.split('·')[0].trim()

      topMetrics.push({
        id: 'primary-magnitude',
        label:
          selectedEvent.eventId === 'turkiye_insar_2023'
            ? 'MAGNITUDE'
            : selectedEvent.eventId.includes('flood') || selectedEvent.eventId.includes('drought')
              ? 'RIVER / EXTENT'
              : 'PEAK METRIC',
        value: magCompact,
        subtext: selectedEvent.magnitude,
        highlight: true
      })
    }

    // Add up to 2 verified layer measurement stats from the active event
    const statEntries = Object.entries(selectedEvent.measurements).slice(0, 2)
    for (const [k, v] of statEntries) {
      const cleanLabel = k
        .replace(/_pct$/i, ' (%)')
        .replace(/_db$/i, ' (dB)')
        .replace(/_m$/i, ' (m)')
        .replace(/_/g, ' ')
        .toUpperCase()
      const formattedVal =
        typeof v === 'number'
          ? k.endsWith('_pct')
            ? `${v}%`
            : k.endsWith('_db')
              ? `${v} dB`
              : k.endsWith('_m')
                ? `${v} m`
                : v.toLocaleString()
          : String(v)
      topMetrics.push({
        id: `stat-${k}`,
        label: cleanLabel,
        value: formattedVal
      })
    }
  } else if (selectedMonth) {
    if (selectedPhenomenon.geographicScope === 'amazon') {
      topMetrics.push({
        id: 'manaus-q',
        label: 'MANAUS DISCHARGE',
        value: `${Math.round(selectedMonth.discharge_manaus_m3s / 1000)}k`,
        subtext: `${Math.round(selectedMonth.discharge_manaus_m3s).toLocaleString()} m³/s`,
        highlight: true
      })
      topMetrics.push({
        id: 'smap-moisture',
        label: 'SMAP MOISTURE',
        value: `${selectedMonth.soil_moisture_idx.toFixed(1)}%`,
        subtext: `Precip: ${selectedMonth.precip_mm.toFixed(0)} mm`
      })
      topMetrics.push({
        id: 'modis-fires',
        label: 'MODIS FIRES',
        value: selectedMonth.fire_hotspots_amazon.toLocaleString(),
        subtext: `S1 Scenes: ${selectedMonth.s1_scenes}`
      })
    } else {
      topMetrics.push({
        id: 'global-frozen',
        label: 'FROZEN LAND',
        value: `${selectedMonth.global_frozen_pct.toFixed(1)}%`,
        subtext: `Month: ${selectedMonth.month}`,
        highlight: true
      })
      topMetrics.push({
        id: 'sea-ice-idx',
        label: 'SEA-ICE INDEX',
        value: `${selectedMonth.global_sea_ice_idx.toFixed(1)}%`,
        subtext: `AMSR2 Cryosphere`
      })
      topMetrics.push({
        id: 'sar-acquisitions',
        label: 'S1 + NISAR SCENES',
        value: (selectedMonth.s1_scenes + selectedMonth.nisar_scenes).toLocaleString(),
        subtext: `NISAR: ${selectedMonth.nisar_scenes}`
      })
    }
  }

  // 3. Build Secondary Time-Series / Profile Chart based on active event or phenomenon
  const timeSeries: TimeSeriesChartPoint[] = []
  let secondaryChartTitle = 'Manaus Discharge (k m³/s · 2015–2026)'
  let secondaryChartUnit = 'k m³/s'
  let secondaryPrimaryLabel = 'Discharge (k m³/s)'
  let secondarySecondaryLabel: string | undefined = 'SMAP Soil Moisture (%)'

  if (selectedEvent?.comparisonPair?.histogram?.length) {
    // Derive cumulative/profile curve from the event's verified before/after backscatter distribution
    secondaryChartTitle =
      selectedEvent.eventId === 'turkiye_insar_2023' || selectedEvent.eventId === 'lapalma_volcano_2021'
        ? 'Radar Phase / Backscatter Profile (dB)'
        : `Backscatter Shift (${selectedEvent.comparisonPair.after_label})`
    secondaryChartUnit = '%'
    secondaryPrimaryLabel = selectedEvent.comparisonPair.after_label
    secondarySecondaryLabel = selectedEvent.comparisonPair.before_label

    for (const bin of selectedEvent.comparisonPair.histogram) {
      timeSeries.push({
        label: bin.range_db,
        date: `${bin.mid_db} dB`,
        primaryValue: bin.after_pct,
        secondaryValue: bin.before_pct
      })
    }
  } else {
    // Sample annual/semi-annual points across the 144-month timeline around selectedMonth
    const isFireOrClearing =
      selectedPhenomenon.id === 'amazon-pheno-4' ||
      selectedPhenomenon.id === 'amazon-pheno-5' ||
      selectedPhenomenon.id === 'global-pheno-4'
    const isCryosphere =
      selectedPhenomenon.id === 'global-pheno-3' ||
      selectedPhenomenon.id === 'global-pheno-6'

    if (isFireOrClearing) {
      secondaryChartTitle = 'Amazon Active Fire Hotspots (2015–2026)'
      secondaryChartUnit = 'fires'
      secondaryPrimaryLabel = 'MODIS Hotspots'
      secondarySecondaryLabel = 'Drought/Fire Index'
      for (let i = 0; i < months.length; i += 3) {
        const m = months[i]
        timeSeries.push({
          label: m.month,
          date: m.month,
          primaryValue: m.fire_hotspots_amazon,
          secondaryValue: m.drought_fire_idx
        })
      }
    } else if (isCryosphere) {
      secondaryChartTitle = 'Global Frozen Land & Sea-Ice Index (%)'
      secondaryChartUnit = '%'
      secondaryPrimaryLabel = 'Frozen Land (%)'
      secondarySecondaryLabel = 'Polar Sea-Ice (%)'
      for (let i = 0; i < months.length; i += 3) {
        const m = months[i]
        timeSeries.push({
          label: m.month,
          date: m.month,
          primaryValue: m.global_frozen_pct,
          secondaryValue: m.global_sea_ice_idx
        })
      }
    } else {
      secondaryChartTitle = 'Amazon Discharge (k m³/s) & Soil Moisture (%)'
      secondaryChartUnit = 'k m³/s'
      secondaryPrimaryLabel = 'Manaus Q (k m³/s)'
      secondarySecondaryLabel = 'SMAP Moisture (%)'
      for (let i = 0; i < months.length; i += 3) {
        const m = months[i]
        timeSeries.push({
          label: m.month,
          date: m.month,
          primaryValue: Number((m.discharge_manaus_m3s / 1000).toFixed(1)),
          secondaryValue: m.soil_moisture_idx
        })
      }
    }
  }

  return {
    status: isDemoFallback ? 'DEMO' : 'AVAILABLE',
    isDemoData: isDemoFallback,
    contextLabel: selectedEvent
      ? `${selectedEvent.eventName} (${selectedEvent.displayDate})`
      : `${selectedPhenomenon.displayName} (${selectedMonth?.month ?? '2015–2026'})`,
    topMetrics: topMetrics.slice(0, 4),
    primaryChartTitle: 'Events & SAR Acquisitions per Year',
    primaryChartType: 'events_per_year',
    yearlySeries,
    histogramSeries: selectedEvent?.comparisonPair
      ? {
          beforeLabel: selectedEvent.comparisonPair.before_label,
          afterLabel: selectedEvent.comparisonPair.after_label,
          deltaSummary: selectedEvent.comparisonPair.delta_summary,
          bins: selectedEvent.comparisonPair.histogram
        }
      : undefined,
    seasonalSeries: selectedPhenomenon.seasonalRhythm,
    secondaryChartTitle,
    secondaryChartUnit,
    secondaryPrimaryLabel,
    secondarySecondaryLabel,
    timeSeries,
    footnote: isDemoFallback
      ? 'DEMO DATA — NOT SCIENTIFIC OBSERVATIONS'
      : 'Verified observations · Copernicus Sentinel-1 / NASA-ISRO NISAR / OPERA / GloFAS'
  }
}
