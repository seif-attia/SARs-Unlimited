export interface OverlayLegendSwatch {
  color: string
  label: string
}

export interface CustomOverlaySuggestion {
  id: string
  title: string
  shortLabel: string
  category: string
  sensorBadge: string
  url: string
  maximumLevel?: number
  whatItRepresents: string
  scientificPhenomena: string
  readingGuide: string
  legend: OverlayLegendSwatch[]
  dataProvenance: string
}

export const CUSTOM_OVERLAY_SUGGESTIONS: CustomOverlaySuggestion[] = [
  {
    id: 'opera_dswx_s1',
    title: 'NASA JPL OPERA Sentinel-1 Surface Water Extent (DSWx-S1)',
    shortLabel: 'OPERA Sentinel-1 Water Extent',
    category: 'SAR Hydrology',
    sensorBadge: 'SENTINEL-1 · C-BAND SAR · DSWX',
    url: 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/OPERA_L3_Dynamic_Surface_Water_Extent-Sentinel-1/default/default/GoogleMapsCompatible_Level12/{z}/{y}/{x}.png',
    maximumLevel: 12,
    whatItRepresents:
      'Near-real-time 30-meter global Dynamic Surface Water Extent derived directly from Sentinel-1 C-band Synthetic Aperture Radar (VV and VH dual-polarization backscatter), mapped in Web Mercator (EPSG:3857) over landmasses.',
    scientificPhenomena:
      'Monitors open rivers, seasonal tropical floodplain inundation, reservoir expansion, and storm-driven flash flooding regardless of dense cloud cover or darkness. Smooth open water acts as a specular reflector that bounces C-band radar energy away from the sensor, producing a sharp dark backscatter signature (-18 to -26 dB) while flooded vegetation exhibits enhanced double-bounce scattering.',
    readingGuide:
      'Blue tones identify confident open surface water; dark teal and cyan mark inundated wetlands and flooded emergent vegetation; terrain-masked shadows appear muted where steep topography blocks radar line-of-sight.',
    legend: [
      { color: '#1d4ed8', label: 'Open Surface Water (Specular SAR Return)' },
      { color: '#06b6d4', label: 'Inundated / Flooded Vegetation (Double-Bounce)' },
      { color: '#64748b', label: 'Radar Shadow / High-Slope Mask' }
    ],
    dataProvenance:
      'NASA JPL OPERA L3 DSWx-S1 · Sentinel-1A/C C-band IW GRD (30 m posting, EPSG:3857 Level 12)'
  },
  {
    id: 'opera_dist_ann',
    title: 'NASA JPL OPERA Global Vegetation & Wildfire Disturbance (DIST-ANN)',
    shortLabel: 'OPERA Annual Land Disturbance',
    category: 'Wildfires & Deforestation',
    sensorBadge: 'OPERA · HLS / SENTINEL-2 · DIST-ANN',
    url: 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/OPERA_L3_DIST-ANN-HLS_Color_Index/default/default/GoogleMapsCompatible_Level12/{z}/{y}/{x}.png',
    maximumLevel: 12,
    whatItRepresents:
      'Annual global land-surface vegetation loss and fire-scar disturbance index derived from Harmonized Landsat and Sentinel-2 (HLS) observations at 30-meter resolution, highlighting deforestation fronts, burn scars, and structural land clearing.',
    scientificPhenomena:
      'Captures canopy removal, wildfire burn severity, logging road networks, and agricultural clearing across the Amazon, boreal forests, and savannas. Serves as a direct optical/SWIR validation cross-check for Sentinel-1/ALOS-2/NISAR L-band cross-pol HV biomass and canopy coherence loss.',
    readingGuide:
      'Warm orange, magenta, and red pixels indicate confirmed high-magnitude vegetation disturbance and burn scars during the annual cycle; amber and yellow mark partial canopy degradation or ongoing clearing.',
    legend: [
      { color: '#ef4444', label: 'High-Confidence Confirmed Vegetation Loss / Burn Scar' },
      { color: '#f97316', label: 'Moderate / Ongoing Canopy Disturbance' },
      { color: '#facc15', label: 'Provisional Early Surface Change' }
    ],
    dataProvenance:
      'NASA JPL OPERA L3 DIST-ANN-HLS · Harmonized Landsat-8/9 & Sentinel-2A/B (30 m, EPSG:3857 Level 12)'
  },
  {
    id: 'imerg_precipitation',
    title: 'NASA GPM IMERG Global Precipitation Rate',
    shortLabel: 'GPM IMERG Precipitation Rate',
    category: 'Hydrology & Storms',
    sensorBadge: 'GPM CORE · MICROWAVE + IR · IMERG',
    url: 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/IMERG_Precipitation_Rate/default/default/GoogleMapsCompatible_Level6/{z}/{y}/{x}.png',
    maximumLevel: 6,
    whatItRepresents:
      'Gap-free global liquid and frozen surface precipitation rate (mm/hr) combining passive microwave radiometers across the GPM constellation with geostationary infrared cloud-top calibration.',
    scientificPhenomena:
      'Identifies atmospheric rivers, tropical cyclone rainbands, ITCZ convective clusters, and extreme monsoon downpours that trigger riverine floods and rainfall-induced landslides. High-intensity convective rain (> 15 mm/hr) can also attenuate X-band and C-band SAR pulses through hydrometeor volume scattering and surface capillary wave roughening.',
    readingGuide:
      'Green and cyan tones indicate light stratiform rainfall (0.5–3 mm/hr); yellow and orange indicate moderate-to-heavy convective bands (5–20 mm/hr); red and magenta mark extreme core rain cells (> 30 mm/hr).',
    legend: [
      { color: '#22d3ee', label: 'Light Stratiform Precipitation (0.5–3 mm/hr)' },
      { color: '#facc15', label: 'Moderate Convective Rainfall (3–15 mm/hr)' },
      { color: '#ef4444', label: 'Heavy Convective Rainband (15–35 mm/hr)' },
      { color: '#d946ef', label: 'Extreme Cyclone / Atmospheric River Core (> 35 mm/hr)' }
    ],
    dataProvenance:
      'NASA / JAXA Global Precipitation Measurement (GPM) IMERG V07 · 0.1° global grid (EPSG:3857 Level 6)'
  },
  {
    id: 'smap_soil_moisture',
    title: 'NASA SMAP L3 L-Band Passive Global Soil Moisture',
    shortLabel: 'SMAP L-Band Soil Moisture',
    category: 'Hydrology & Soil Dielectric',
    sensorBadge: 'SMAP · L-BAND 1.41 GHZ · PASSIVE RADIOMETER',
    url: 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/SMAP_L3_Passive_Day_Soil_Moisture/default/default/GoogleMapsCompatible_Level6/{z}/{y}/{x}.png',
    maximumLevel: 6,
    whatItRepresents:
      'Volumetric topsoil moisture content (cm³/cm³ in the upper 5 cm layer) measured at L-band (1.41 GHz) by NASA Soil Moisture Active Passive (SMAP) radiometer across global continents.',
    scientificPhenomena:
      'Because liquid water raises the relative dielectric constant of dry soil from ~3 to > 30, L-band brightness temperature and L-band SAR backscatter (such as NISAR) respond directly to soil wetness and freeze/thaw state. Elevated antecedent soil moisture strongly preconditions watersheds for runoff flooding and hillslope liquefaction.',
    readingGuide:
      'Pale yellow and amber indicate arid soils (< 0.10 m³/m³); olive and green show moderate soil moisture (0.15–0.30 m³/m³); deep teal and navy indicate near-saturated soils (> 0.35 m³/m³) prone to runoff.',
    legend: [
      { color: '#fde047', label: 'Dry / Arid Topsoil (< 0.10 m³/m³)' },
      { color: '#4ade80', label: 'Moderate Moisture (0.15–0.30 m³/m³)' },
      { color: '#0284c7', label: 'Saturated Soil / High Dielectric (> 0.35 m³/m³)' }
    ],
    dataProvenance:
      'NASA SMAP L3 Radiometer Global Daily 36 km EASE-Grid Soil Moisture (EPSG:3857 Level 6)'
  },
  {
    id: 'ghrsst_mur_sst',
    title: 'NASA GHRSST L4 MUR Global Sea Surface Temperature',
    shortLabel: 'GHRSST L4 Sea Surface Temp',
    category: 'Marine & Climate',
    sensorBadge: 'GHRSST · MUR L4 MULTI-SENSOR · 1 KM',
    url: 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/GHRSST_L4_MUR_Sea_Surface_Temperature/default/default/GoogleMapsCompatible_Level7/{z}/{y}/{x}.png',
    maximumLevel: 7,
    whatItRepresents:
      'Cloud-free, gap-filled Level-4 Multi-scale Ultra-high Resolution (MUR) foundation Sea Surface Temperature (°C) blended across MODIS, VIIRS, AMSR2 microwave radiometers, and drifting ocean buoys.',
    scientificPhenomena:
      'Resolves oceanic eddies, western boundary currents (Gulf Stream, Kuroshio, Agulhas), coastal upwelling plumes, and El Niño / La Niña equatorial thermal anomalies. Thermal fronts modify marine boundary-layer wind stress, producing sharp ocean roughness signatures in Sentinel-1 SAR wave-mode imagery.',
    readingGuide:
      'Deep violet and cobalt mark cold polar waters (-2 to 6 °C); teal and green indicate temperate seas (10–20 °C); yellow, orange, and crimson depict warm tropical waters and heat-flux corridors (24–32 °C).',
    legend: [
      { color: '#3b82f6', label: 'Polar / Subpolar Cold Waters (-2 °C to 6 °C)' },
      { color: '#10b981', label: 'Temperate Fronts & Upwelling (10 °C to 20 °C)' },
      { color: '#f97316', label: 'Tropical / Cyclone Heat Reservoir (25 °C to 32 °C)' }
    ],
    dataProvenance:
      'NASA JPL PO.DAAC GHRSST Level 4 MUR Global 0.01° Foundation SST (EPSG:3857 Level 7)'
  },
  {
    id: 'ghrsst_sea_ice',
    title: 'NASA GHRSST L4 MUR Polar Sea Ice Concentration',
    shortLabel: 'Polar Sea Ice Concentration',
    category: 'Cryosphere & Ice',
    sensorBadge: 'GHRSST · PASSIVE MICROWAVE ICE FRACTION',
    url: 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/GHRSST_L4_MUR_Sea_Ice_Concentration/default/default/GoogleMapsCompatible_Level7/{z}/{y}/{x}.png',
    maximumLevel: 7,
    whatItRepresents:
      'Daily gap-free sea ice area fraction (0%–100%) across Arctic and Antarctic waters synthesized from passive microwave brightness temperatures alongside MUR sea surface analyses.',
    scientificPhenomena:
      'Tracks seasonal freeze-up, marginal ice zone retreat, coastal polynyas, and ice-edge breakup during polar night and persistent clouds. Pairs directly with dual-pol Sentinel-1 EW SAR sea-ice classification (multiyear deformed ice vs. smooth first-year floes and open leads).',
    readingGuide:
      'Translucent pale blue highlights thin or fractured marginal ice (15%–50% concentration); crisp cyan-white and pure white indicate consolidated pack ice (80%–100% cover).',
    legend: [
      { color: '#38bdf8', label: 'Marginal Ice Zone / Fractured Leads (15%–50%)' },
      { color: '#bae6fd', label: 'Moderate Pack Concentration (50%–85%)' },
      { color: '#f8fafc', label: 'Consolidated Polar Pack Ice (85%–100%)' }
    ],
    dataProvenance:
      'NASA JPL GHRSST L4 MUR Sea Ice Fraction · OSI SAF / NSIDC Microwave Composite (EPSG:3857 Level 7)'
  },
  {
    id: 'aster_gdem_relief',
    title: 'NASA ASTER Global Digital Elevation Color Index',
    shortLabel: 'ASTER Global Elevation Relief',
    category: 'Topography & Deformation',
    sensorBadge: 'ASTER GDEM · STEREO VNIR · 30 M',
    url: 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/ASTER_GDEM_Color_Index/default/default/GoogleMapsCompatible_Level12/{z}/{y}/{x}.png',
    maximumLevel: 12,
    whatItRepresents:
      'Continuous global continental hypsometric elevation index (83°S to 83°N at 1 arc-second / ~30 m native posting) built from millions of stereo Terra ASTER VNIR image pairs, transparent over oceans.',
    scientificPhenomena:
      'Defines topographic relief needed to simulate and remove topographic phase in InSAR interferograms, correct SAR foreshortening and layover geometry in alpine terrain, and assess basin gradients controlling floodwater accumulation and coseismic landslide susceptibility.',
    readingGuide:
      'Blue-teal indicates coastal plains near sea level (0–50 m); green marks lowlands and sedimentary basins (50–500 m); yellow and ochre denote highlands (500–2,000 m); brown and white depict high mountain belts (> 2,500 m).',
    legend: [
      { color: '#0ea5e9', label: 'Coastal Lowlands & River Basins (< 50 m)' },
      { color: '#22c55e', label: 'Interior Plains & Valleys (50–500 m)' },
      { color: '#eab308', label: 'Plateaus & Highlands (500–2,000 m)' },
      { color: '#a16207', label: 'Orogenic Belts & Peaks (> 2,500 m)' }
    ],
    dataProvenance:
      'NASA / METI ASTER Global Digital Elevation Model V3 (GDEM · 30 m global land posting, EPSG:3857 Level 12)'
  },
  {
    id: 'usgs_earthquakes_45',
    title: 'USGS Global Tectonic Earthquakes (M4.5+ Past 30 Days)',
    shortLabel: 'USGS Live M4.5+ Earthquakes',
    category: 'Tectonic Deformation',
    sensorBadge: 'USGS NEIC · LIVE WGS84 GEOJSON FEED',
    url: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_month.geojson',
    whatItRepresents:
      'Live global vector feed of all Moment Magnitude 4.5 and greater earthquakes recorded over the past 30 days by the USGS National Earthquake Information Center, plotted in native WGS84 geographic coordinates.',
    scientificPhenomena:
      'Highlights active subduction zones, continental strike-slip faults, and shallow crustal ruptures where Sentinel-1 and NISAR InSAR track millimeter-to-meter coseismic ground displacement, fault slip distribution, and postseismic afterslip.',
    readingGuide:
      'Each WGS84 point pin marks a seismic epicenter recorded within the last 30 days, aligned directly to active plate boundaries and nearby InSAR deformation study sites.',
    legend: [
      { color: '#f97316', label: 'M4.5+ Epicenter (Past 30 Days · WGS84 Point)' },
      { color: '#38bdf8', label: 'Active Plate Boundary / Fault Vector Envelope' }
    ],
    dataProvenance:
      'USGS Earthquake Hazards Program · Live GeoJSON Summary Feed (WGS84 / EPSG:4326)'
  }
]

function normalizeOverlayUrl(url: string): string {
  return url.trim()
}

export function findCustomOverlaySuggestionByUrl(url: string): CustomOverlaySuggestion | null {
  const normalized = normalizeOverlayUrl(url)
  if (!normalized) return null
  return (
    CUSTOM_OVERLAY_SUGGESTIONS.find((item) => normalizeOverlayUrl(item.url) === normalized) ?? null
  )
}
