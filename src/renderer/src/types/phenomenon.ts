import type { ComparisonPair, LegendEntry, SarOverlayLayer, SeasonalRhythmPoint } from './sar'

export type DatasetStatus = 'AVAILABLE' | 'PROCESSING' | 'DEMO' | 'FAILED' | 'NO DATA'

export type GeographicScope = 'global' | 'amazon'

export type LocationMatchState =
  | 'GLOBAL LOCATION'
  | 'AMAZON LOCATION'
  | 'NO MATCH'
  | 'NO DATA'
  | 'OUTSIDE'

export interface GeoJsonPoint {
  type: 'Point'
  coordinates: [number, number]
}

export interface GeoJsonPolygon {
  type: 'Polygon'
  coordinates: [number, number][][]
}

export interface GeoJsonMultiPolygon {
  type: 'MultiPolygon'
  coordinates: [number, number][][][]
}

export type GeoJsonGeometry = GeoJsonPoint | GeoJsonPolygon | GeoJsonMultiPolygon

export interface MediaAsset {
  id: string
  title: string
  type: 'sar_raster' | 'comparison_swipe' | 'video' | 'image' | 'external_report'
  assetPath?: string
  compareAssetPath?: string
  url?: string
  caption: string
  sensor?: string
  band?: string
  polarization?: string
  acquisitionDate?: string
  granuleId?: string
  legend?: LegendEntry[]
  stats?: Record<string, string | number>
  available: boolean
}

export interface ScientificExplanationContent {
  whatHappened: {
    description: string
    when: string
    where: string
    observations: string
  }
  whySarDetectsIt: {
    primaryMechanism: string
    roughnessAndBackscatter: string
    dielectricAndMoisture: string
    polarizationAndWavelength: string
  }
  environmentalAndHumanImpact: {
    environmentalImpact: string
    humanAndInfrastructureImpact: string
    naturalDriver: string
    humanDriver: string
    geographicExtent: string
    overlayReadingGuide: string
  }
  dataUsedAndMethodology: {
    satelliteMission: string
    sensorAndBand: string
    acquisitionDates: string
    processingMethodology: string
    dataResolution: string
    observationPeriod: string
    dataSource: string
    processingModel: string
    granuleId?: string
  }
}

export interface MetricCardItem {
  id: string
  label: string
  value: string
  subtext?: string
  unit?: string
  highlight?: boolean
}

export interface YearlyEventCountPoint {
  year: string
  events: number
  s1Scenes?: number
  nisarScenes?: number
  highlight?: boolean
}

export interface TimeSeriesChartPoint {
  label: string
  date: string
  primaryValue: number
  secondaryValue?: number
}

export interface StatisticsPanelData {
  status: DatasetStatus
  isDemoData: boolean
  contextLabel: string
  topMetrics: MetricCardItem[]
  primaryChartTitle: string
  primaryChartType: 'events_per_year' | 'backscatter_histogram' | 'seasonal_rhythm'
  yearlySeries: YearlyEventCountPoint[]
  histogramSeries?: {
    beforeLabel: string
    afterLabel: string
    deltaSummary: string
    bins: { range_db: string; mid_db: number; before_pct: number; after_pct: number }[]
  }
  seasonalSeries?: SeasonalRhythmPoint[]
  secondaryChartTitle: string
  secondaryChartUnit: string
  secondaryPrimaryLabel: string
  secondarySecondaryLabel?: string
  timeSeries: TimeSeriesChartPoint[]
  footnote: string
}

export interface PhenomenonDefinition {
  id: string
  code: string // e.g. 'Pheno 1' .. 'Pheno 6' (Global) or 'Pheno 1' .. 'Pheno 8' (Amazon)
  shortLabel: string
  displayName: string
  scientificTitle: string
  description: string
  geographicScope: GeographicScope
  associatedRegions: string[]
  startDate: string
  endDate: string
  availableDatasets: string[]
  eventIds: string[]
  sourcePhenomenonIds: string[]
  accentColor: string
  defaultSensorBadge: string
  activeMonths?: number[]
  peakMonths?: number[]
  defaultBbox: [number, number, number, number]
  defaultCenter: [number, number]
  layers: SarOverlayLayer[]
  defaultLayerId?: string
  seasonalRhythm?: SeasonalRhythmPoint[]
  scientificExplanation: ScientificExplanationContent
  status: DatasetStatus
}

export interface EventRecord {
  eventId: string
  phenomenonId: string
  additionalPhenomenonIds: string[]
  eventName: string
  eventDate: string // YYYY-MM
  displayDate: string
  startDate?: string
  endDate?: string
  regionId: string
  country: string
  regionName: string
  latitude: number
  longitude: number
  geometry: GeoJsonGeometry
  boundingBox: [number, number, number, number]
  severity?: string
  magnitude?: string
  affectedArea?: string
  headlineMetric: string
  summary: string
  measurements: Record<string, string | number>
  comparisonPair?: ComparisonPair
  scientificExplanation: ScientificExplanationContent
  causes: {
    naturalDriver: string
    humanDriver: string
  }
  impacts: {
    environmentalImpact: string
    humanAndInfrastructureImpact: string
    geographicExtent: string
  }
  satelliteMetadata: {
    mission: string
    sensor: string
    band: string
    polarization: string
    granuleId: string
    acquisitionDate: string
    resolution: string
  }
  processingMetadata: {
    methodology: string
    model: string
    observationPeriod: string
  }
  reportUrl?: string
  sources: {
    id: string
    title: string
    url: string
    publisher: string
    accessed: string
  }[]
  mediaAssets: MediaAsset[]
  layers: SarOverlayLayer[]
  defaultLayerId: string
  dataSource: string
  provenance: string
  status: DatasetStatus
  scope: GeographicScope
  accentColor: string
}

export interface HoveredLocationInfo {
  state: LocationMatchState
  latitude: number | null
  longitude: number | null
  regionId: string | null
  regionName: string | null
  country: string | null
  isAmazonBasin: boolean
  boundaryPrecision: 'polygon' | 'bbox-approximate' | 'none'
  matchedEventIds: string[]
  matchedPhenomenonIds: string[]
  statusMessage: string
}

export type DateFilterMode = 'all_period' | 'exact_month' | 'year'

export interface WidgetVisibilityState {
  statistics: boolean
  eventSummary: boolean
  scientificExplanation: boolean
  timeline: boolean
}
