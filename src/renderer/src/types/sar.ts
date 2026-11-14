export interface StudyRegion {
  id: string
  name: string
  country: string
  state: string
  bbox: [number, number, number, number]
  center: [number, number]
  river: string
  typical_flood_season: string
  typical_low_water_season: string
  why: string
  area_km2: number
}

export interface TimelineMonthPoint {
  month: string
  year: number
  month_num: number
  discharge_manaus_m3s: number
  discharge_porto_velho_m3s: number
  precip_mm: number
  fire_hotspots_amazon: number
  s1_scenes: number
  nisar_scenes: number
  active_phenomena: string[]
  event_id: string | null
  basin_overlay_path: string
  soil_moisture_idx: number
  flood_pulse_idx: number
  drought_fire_idx: number
  planet_overlay_path: string
  global_frozen_pct: number
  global_sea_ice_idx: number
}

export interface SarPhysicsSpec {
  primary_sensitivity: string
  roughness_mechanism: string
  dielectric_mechanism: string
  polarization_note: string
  frequency_comparison: string
}

export interface DriversSpec {
  natural_driver: string
  human_driver: string
}

export interface LegendEntry {
  label: string
  color: string
}

export interface SarOverlayLayer {
  id: string
  title: string
  role: string
  sensor: string
  band: string
  polarization: string
  acquisition_date: string
  granule_id: string
  asset_path: string
  bbox: [number, number, number, number]
  stats: Record<string, string | number>
  legend: LegendEntry[]
  source_id: string
}

export interface SeasonalRhythmPoint {
  month_num: number
  label: string
  discharge_m3s: number
  precip_mm: number
  fire_hotspots: number
}

export interface AmazonPhenomenon {
  id: string
  name: string
  typical_timing: string
  months: number[]
  peak_months: number[]
  color: string
  region_id: string
  bbox: [number, number, number, number]
  center: [number, number]
  summary: string
  sar_physics: SarPhysicsSpec
  drivers: DriversSpec
  default_layer_id: string
  layers: SarOverlayLayer[]
  seasonal_rhythm: SeasonalRhythmPoint[]
}

export interface HistogramBin {
  range_db: string
  mid_db: number
  before_pct: number
  after_pct: number
}

export interface ComparisonPair {
  before_label: string
  after_label: string
  delta_summary: string
  histogram: HistogramBin[]
}

export interface AmazonEvent {
  id: string
  scope?: 'amazon' | 'global'
  name: string
  timing: string
  timeline_month: string
  color: string
  region_id: string
  bbox: [number, number, number, number]
  center: [number, number]
  headline_metric: string
  summary: string
  sar_physics: SarPhysicsSpec
  drivers: DriversSpec
  default_layer_id: string
  comparison_pair: ComparisonPair
  layers: SarOverlayLayer[]
}

export interface DatasetSource {
  id: string
  title: string
  url: string
  publisher: string
  accessed: string
}

export interface AmazonSarDataset {
  schema_version: string
  title: string
  challenge_url: string
  generated_at: string
  temporal_range: {
    start: string
    end: string
    observed_end: string
  }
  planet_bbox?: [number, number, number, number]
  amazon_basin_bbox: [number, number, number, number]
  amazon_basin_outline: [number, number][]
  regions: Record<string, StudyRegion>
  timeline: {
    months: TimelineMonthPoint[]
  }
  phenomena: AmazonPhenomenon[]
  events: AmazonEvent[]
  sources: DatasetSource[]
}
