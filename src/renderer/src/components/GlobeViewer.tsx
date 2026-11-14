import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as Cesium from 'cesium'
import 'cesium/Build/Cesium/Widgets/widgets.css'
import {
  BarChart3,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Compass,
  Info,
  Layers,
  Moon,
  Mountain,
  Orbit,
  PanelLeftClose,
  Play,
  RefreshCw,
  RotateCcw,
  X,
  ZoomIn,
  ZoomOut
} from 'lucide-react'
import { usePhenomenonContext } from '../hooks/usePhenomenonContext'
import { useGlobeLocationPicking } from '../hooks/useGlobeLocationPicking'
import { loadSarAssetDataUrl } from '../services/phenomenonDataService'
import { attachDynamicDesertNightSky } from '../services/celestialSkyEngine'
import { findCustomOverlaySuggestionByUrl } from '../data/customOverlaySuggestions'
import {
  checkSarsBackendHealth,
  fetchCustomDirectEndpointLayer,
  PREDEFINED_STUDY_AREAS,
  renderSarsDataOverlayPng
} from '../services/sarsDataApi'
import {
  checkLmStudioConnection,
  LM_STUDIO_DEFAULT_URL,
  normalizeLmStudioBaseUrl
} from '../services/lmStudioService'
import type { EventRecord, WidgetVisibilityState } from '../types/phenomenon'
import { DashboardHeader } from './dashboard/DashboardHeader'
import { HistoricalTimeline } from './dashboard/HistoricalTimeline'
import { StatisticsPanel } from './dashboard/StatisticsPanel'
import { EventSummaryPanel } from './dashboard/EventSummaryPanel'
import { ScientificExplanationPanel } from './dashboard/ScientificExplanationPanel'
import { ReportViewer } from './dashboard/ReportViewer'
import { MediaViewer } from './dashboard/MediaViewer'
import { AiHelpSidebar } from './dashboard/AiHelpSidebar'

export interface CameraTelemetry {
  lat: number
  lon: number
  cameraAltKm: number
  pitchDeg: number
}

const DEFAULT_ORBIT_VIEW = {
  lon: 30.8,
  lat: 26.5,
  height: 12_500_000
}

function createEsriDiscardPolicy(
  service: string,
  level: number,
  cacheBust?: number
): Cesium.TileDiscardPolicy {
  const query = cacheBust ? `?t=${cacheBust}` : ''
  return new Cesium.DiscardMissingTileImagePolicy({
    missingImageUrl: `https://services.arcgisonline.com/ArcGIS/rest/services/${service}/MapServer/tile/${level}/0/0${query}`,
    pixelsToCheck: [
      new Cesium.Cartesian2(0, 0),
      new Cesium.Cartesian2(200, 20),
      new Cesium.Cartesian2(20, 200),
      new Cesium.Cartesian2(80, 110),
      new Cesium.Cartesian2(160, 130)
    ],
    disableCheckIfAllPixelsAreTransparent: true
  })
}

function createOpticalSatelliteProvider(cacheBust?: number): Cesium.ImageryProvider {
  const query = cacheBust ? `?t=${cacheBust}` : ''
  return new Cesium.UrlTemplateImageryProvider({
    url: `https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}${query}`,
    maximumLevel: 19,
    tileDiscardPolicy: createEsriDiscardPolicy('World_Imagery', 19, cacheBust),
    credit: 'Esri World Imagery'
  })
}

async function createPolarCapProvider(
  pole: 'north' | 'south',
  cacheBust?: number
): Promise<Cesium.SingleTileImageryProvider> {
  const z = 3
  const tileCount = 1 << z // 8 tiles across 360°
  const tileSize = 256
  const width = tileCount * tileSize // 2048px
  const height = 256
  const yMerc = pole === 'north' ? 0 : tileCount - 1
  const query = cacheBust ? `?t=${cacheBust}` : ''

  const fallbackRgb = pole === 'north' ? [11, 53, 77] : [232, 238, 242]

  const loadEdgeRow = (x: number): Promise<Uint8ClampedArray | null> =>
    new Promise((resolve) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        const tmp = document.createElement('canvas')
        tmp.width = tileSize
        tmp.height = 1
        const tctx = tmp.getContext('2d')
        if (!tctx) {
          resolve(null)
          return
        }
        const sy = pole === 'north' ? 0 : img.height - 1
        tctx.drawImage(img, 0, sy, img.width, 1, 0, 0, tileSize, 1)
        resolve(tctx.getImageData(0, 0, tileSize, 1).data)
      }
      img.onerror = () => resolve(null)
      img.src = `https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${yMerc}/${x}${query}`
    })

  const rows = await Promise.all(Array.from({ length: tileCount }, (_, x) => loadEdgeRow(x)))

  const edge = new Uint8ClampedArray(width * 4)
  let sumR = 0
  let sumG = 0
  let sumB = 0
  let validCount = 0

  for (let tx = 0; tx < tileCount; tx++) {
    const row = rows[tx]
    for (let px = 0; px < tileSize; px++) {
      const dst = (tx * tileSize + px) * 4
      if (row) {
        const src = px * 4
        edge[dst] = row[src]
        edge[dst + 1] = row[src + 1]
        edge[dst + 2] = row[src + 2]
        edge[dst + 3] = 255
        sumR += row[src]
        sumG += row[src + 1]
        sumB += row[src + 2]
        validCount++
      } else {
        edge[dst] = fallbackRgb[0]
        edge[dst + 1] = fallbackRgb[1]
        edge[dst + 2] = fallbackRgb[2]
        edge[dst + 3] = 255
      }
    }
  }

  const avgR = validCount > 0 ? sumR / validCount : fallbackRgb[0]
  const avgG = validCount > 0 ? sumG / validCount : fallbackRgb[1]
  const avgB = validCount > 0 ? sumB / validCount : fallbackRgb[2]

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  const imgData = ctx.createImageData(width, height)
  const out = imgData.data

  // Smoothly blend from the exact ±85.0511° edge colors to the mean pole color at ±90°
  const seamRow = pole === 'north' ? height - 3 : 2
  for (let y = 0; y < height; y++) {
    const u =
      pole === 'north'
        ? y >= seamRow
          ? 0
          : (seamRow - y) / seamRow
        : y <= seamRow
          ? 0
          : (y - seamRow) / (height - 1 - seamRow)

    // Smooth ease-out curve so variations fade gently without pie-slice rays
    const t = 1 - Math.pow(1 - u, 2.2)

    for (let x = 0; x < width; x++) {
      const eIdx = x * 4
      const oIdx = (y * width + x) * 4
      out[oIdx] = Math.round(edge[eIdx] * (1 - t) + avgR * t)
      out[oIdx + 1] = Math.round(edge[eIdx + 1] * (1 - t) + avgG * t)
      out[oIdx + 2] = Math.round(edge[eIdx + 2] * (1 - t) + avgB * t)
      out[oIdx + 3] = 255
    }
  }
  ctx.putImageData(imgData, 0, 0)

  const rectangle =
    pole === 'north'
      ? Cesium.Rectangle.fromDegrees(-180, 85.0, 180, 90.0)
      : Cesium.Rectangle.fromDegrees(-180, -90.0, 180, -85.0)

  return Cesium.SingleTileImageryProvider.fromUrl(canvas.toDataURL('image/png'), {
    rectangle,
    credit: 'Esri World Imagery'
  })
}

function createBordersProvider(cacheBust?: number): Cesium.ImageryProvider {
  const query = cacheBust ? `?t=${cacheBust}` : ''
  return new Cesium.UrlTemplateImageryProvider({
    url: `https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}${query}`,
    maximumLevel: 18,
    tileDiscardPolicy: createEsriDiscardPolicy(
      'Reference/World_Boundaries_and_Places',
      18,
      cacheBust
    )
  })
}

function createNightLightsProvider(cacheBust?: number): Cesium.ImageryProvider {
  const query = cacheBust ? `?t=${cacheBust}` : ''
  return new Cesium.UrlTemplateImageryProvider({
    url: `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_CityLights_2012/default/default/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpg${query}`,
    maximumLevel: 8,
    credit: 'NASA Earth at Night (VIIRS)'
  })
}

const SRTM_TOPOGRAPHY_URL =
  'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/SRTM_Color_Index/default/default/GoogleMapsCompatible_Level12/{z}/{y}/{x}.png'

function createSrtmTopographyProvider(cacheBust?: number): Cesium.ImageryProvider {
  const query = cacheBust ? `?t=${cacheBust}` : ''
  return new Cesium.UrlTemplateImageryProvider({
    url: `${SRTM_TOPOGRAPHY_URL}${query}`,
    maximumLevel: 11,
    credit: 'NASA SRTM Radar Topography'
  })
}

export function GlobeViewer(): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const viewerRef = useRef<Cesium.Viewer | null>(null)

  // Protected Base ImageryLayer refs (Optical Satellite + Polar Caps are permanent; Topography, Labels & Dark Mode can be toggled)
  const northPolarLayerRef = useRef<Cesium.ImageryLayer | null>(null)
  const southPolarLayerRef = useRef<Cesium.ImageryLayer | null>(null)
  const satelliteLayerRef = useRef<Cesium.ImageryLayer | null>(null)
  const nightLightsLayerRef = useRef<Cesium.ImageryLayer | null>(null)
  const srtmLayerRef = useRef<Cesium.ImageryLayer | null>(null)
  const labelsLayerRef = useRef<Cesium.ImageryLayer | null>(null)

  // Additive SAR ImageryLayer refs (managed independently from base imagery layers)
  const sarBasinLayerRef = useRef<Cesium.ImageryLayer | null>(null)
  const basinProviderCacheRef = useRef<Map<string, Cesium.SingleTileImageryProvider>>(new Map())
  const basinReqSeqRef = useRef<number>(0)
  const sarEventLayerRef = useRef<Cesium.ImageryLayer | null>(null)
  const legacyDemoLayerRef = useRef<Cesium.ImageryLayer | null>(null)
  const customApiOverlayLayerRef = useRef<Cesium.ImageryLayer | null>(null)
  const customApiGeoJsonRef = useRef<Cesium.DataSource | null>(null)
  const eventEntitiesRef = useRef<Cesium.Entity[]>([])

  // Refresh state
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false)

  // Protected Earth visualization states
  const [showBorders, setShowBorders] = useState<boolean>(true)
  const [showTopography, setShowTopography] = useState<boolean>(false)
  const [darkMode, setDarkMode] = useState<boolean>(false) // Earth at Night (VIIRS City Lights)
  const [showAtmosphere, setShowAtmosphere] = useState<boolean>(false)
  const [autoRotate, setAutoRotate] = useState<boolean>(false)

  // Additive visualization & UI theme states (Separate from Earth at Night)
  const [uiLightTheme, setUiLightTheme] = useState<boolean>(false)
  const [showEventPins, setShowEventPins] = useState<boolean>(true)
  const [showCursorTooltip, setShowCursorTooltip] = useState<boolean>(true)

  // On-Screen HUD Controls visibility
  const [showTelemetryHud, setShowTelemetryHud] = useState<boolean>(true)
  const [showQuickBar, setShowQuickBar] = useState<boolean>(false)
  const [showAltitudeLegend, setShowAltitudeLegend] = useState<boolean>(true)
  const [showNavButtons, setShowNavButtons] = useState<boolean>(true)
  const [showControlsHint] = useState<boolean>(false)
  const [activeSidebarTab, setActiveSidebarTab] = useState<
    'statistics' | 'eventSummary' | 'scientificExplanation' | 'customOverlayExplanation'
  >('statistics')
  const [isAiSidebarOpen, setIsAiSidebarOpen] = useState<boolean>(false)

  // Custom SARs-Data API state (preserving sarsDataApi.ts integration)
  const [customApiBaseUrl, setCustomApiBaseUrl] = useState<string>('http://localhost:8000')
  const [backendConnected, setBackendConnected] = useState<boolean | null>(null)

  // Local AI Model (LM Studio) endpoint state
  const [localModelBaseUrl, setLocalModelBaseUrl] = useState<string>(LM_STUDIO_DEFAULT_URL)
  const [activeLocalModelBaseUrl, setActiveLocalModelBaseUrl] =
    useState<string>(LM_STUDIO_DEFAULT_URL)
  const [localModelConnected, setLocalModelConnected] = useState<boolean | null>(null)
  const [localModelChecking, setLocalModelChecking] = useState<boolean>(false)
  const [localModelStatus, setLocalModelStatus] = useState<string | null>(null)
  const [localModelRefreshToken, setLocalModelRefreshToken] = useState<number>(0)

  // Separate Custom API Overlay Feed state
  const [customOverlayUrl, setCustomOverlayUrl] = useState<string>('')
  const [activeCustomOverlayUrl, setActiveCustomOverlayUrl] = useState<string>('')
  const [customOverlayActive, setCustomOverlayActive] = useState<boolean>(false)
  const [customOverlayLoading, setCustomOverlayLoading] = useState<boolean>(false)
  const [customOverlayStatus, setCustomOverlayStatus] = useState<string | null>(null)

  const autoRotateRef = useRef<boolean>(false)
  const darkModeRef = useRef<boolean>(false)
  const userInteractingRef = useRef<boolean>(false)

  const [telemetry, setTelemetry] = useState<CameraTelemetry>({
    lat: DEFAULT_ORBIT_VIEW.lat,
    lon: DEFAULT_ORBIT_VIEW.lon,
    cameraAltKm: Math.round(DEFAULT_ORBIT_VIEW.height / 1000),
    pitchDeg: -90
  })

  // Master Phenomenon, Timeline & Synchronization Context
  const ctx = usePhenomenonContext()
  const {
    platformData,
    dataset,
    datasetStatus,
    isDemoFallbackActive,
    setIsDemoFallbackActive,
    globalPhenomena,
    amazonPhenomena,
    selectedPhenomenon,
    selectPhenomenonById,
    allEvents,
    filteredEvents,
    phenomenonEvents,
    selectedEvent,
    selectEvent,
    activeEventLayer,
    selectEventLayerById,
    sarOverlayOpacity,
    setSarOverlayOpacity,
    liveScope,
    showBasinProgression,
    toggleBasinProgression,
    activeSeasonalPhenomenonIds,
    isTouring,
    tourStopIdx,
    tourStopCount,
    toggleTour,
    stopTour,
    jumpTourStop,
    timeline,
    hoveredLocation,
    setHoveredLocation,
    lockedRegionId,
    setLockedRegionId,
    statistics,
    scientificExplanation,
    widgetVisibility,
    toggleWidget,
    setWidgetVisible,
    restoreAllWidgets,
    reportModalEvent,
    openReportModal,
    closeReportModal,
    mediaModalEvent,
    openMediaModal,
    closeMediaModal
  } = ctx

  const isSidebarVisible =
    widgetVisibility.statistics ||
    widgetVisibility.eventSummary ||
    widgetVisibility.scientificExplanation

  const handleHideSidebar = useCallback(() => {
    setWidgetVisible('statistics', false)
    setWidgetVisible('eventSummary', false)
    setWidgetVisible('scientificExplanation', false)
  }, [setWidgetVisible])

  const handleOpenSidebar = useCallback(() => {
    setWidgetVisible('statistics', true)
    setWidgetVisible('eventSummary', true)
    setWidgetVisible('scientificExplanation', true)
  }, [setWidgetVisible])

  const handleToggleWidgetTab = useCallback(
    (widget: keyof WidgetVisibilityState) => {
      if (widget === 'timeline') {
        toggleWidget('timeline')
        return
      }
      if (!isSidebarVisible || activeSidebarTab !== widget) {
        handleOpenSidebar()
        setActiveSidebarTab(widget)
        return
      }
      handleHideSidebar()
    },
    [isSidebarVisible, activeSidebarTab, toggleWidget, handleOpenSidebar, handleHideSidebar]
  )

  // Throttled 3D Earth cursor geographic picking
  const { hoveredLocation: pickedLocation } = useGlobeLocationPicking({
    viewerRef,
    userInteractingRef,
    platformData,
    selectedDate: timeline.selectedDate,
    enabled: showCursorTooltip
  })

  useEffect(() => {
    setHoveredLocation(pickedLocation)
  }, [pickedLocation, setHoveredLocation])

  // Check optional external SARs-Data API health once on startup
  useEffect(() => {
    checkSarsBackendHealth('http://localhost:8000')
      .then((res) => setBackendConnected(res.online))
      .catch(() => setBackendConnected(false))
  }, [])

  useEffect(() => {
    autoRotateRef.current = autoRotate
    const viewer = viewerRef.current
    if (viewer && !viewer.isDestroyed()) {
      viewer.scene.requestRenderMode = !autoRotate
      viewer.scene.requestRender()
    }
  }, [autoRotate])

  // Apply day or night tone to base satellite + polar cap layers
  const applyEarthDayNightStyle = (isNight: boolean): void => {
    const baseLayers = [
      northPolarLayerRef.current,
      southPolarLayerRef.current,
      satelliteLayerRef.current
    ]
    for (const layer of baseLayers) {
      if (!layer) continue
      if (isNight) {
        layer.brightness = 0.22
        layer.contrast = 1.3
        layer.saturation = 0.35
        layer.gamma = 0.78
      } else {
        layer.brightness = 1.0
        layer.contrast = 1.0
        layer.saturation = 1.0
        layer.gamma = 1.0
      }
    }
  }

  // Ensure proper layer stacking order without re-fetching existing layers
  const enforceLayerOrder = useCallback((viewer: Cesium.Viewer): void => {
    if (viewer.isDestroyed()) return
    const layers = viewer.imageryLayers
    if (northPolarLayerRef.current && layers.contains(northPolarLayerRef.current)) {
      layers.raiseToTop(northPolarLayerRef.current)
    }
    if (southPolarLayerRef.current && layers.contains(southPolarLayerRef.current)) {
      layers.raiseToTop(southPolarLayerRef.current)
    }
    if (satelliteLayerRef.current && layers.contains(satelliteLayerRef.current)) {
      layers.raiseToTop(satelliteLayerRef.current)
    }
    if (nightLightsLayerRef.current && layers.contains(nightLightsLayerRef.current)) {
      layers.raiseToTop(nightLightsLayerRef.current)
    }
    if (srtmLayerRef.current && layers.contains(srtmLayerRef.current)) {
      layers.raiseToTop(srtmLayerRef.current)
    }
    if (sarBasinLayerRef.current && layers.contains(sarBasinLayerRef.current)) {
      layers.raiseToTop(sarBasinLayerRef.current)
    }
    if (sarEventLayerRef.current && layers.contains(sarEventLayerRef.current)) {
      layers.raiseToTop(sarEventLayerRef.current)
    }
    if (legacyDemoLayerRef.current && layers.contains(legacyDemoLayerRef.current)) {
      layers.raiseToTop(legacyDemoLayerRef.current)
    }
    if (customApiOverlayLayerRef.current && layers.contains(customApiOverlayLayerRef.current)) {
      layers.raiseToTop(customApiOverlayLayerRef.current)
    }
    if (labelsLayerRef.current && layers.contains(labelsLayerRef.current)) {
      layers.raiseToTop(labelsLayerRef.current)
    }
    viewer.scene.requestRender()
  }, [])

  // PROTECTED CESIUM INITIALIZATION
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const viewer = new Cesium.Viewer(container, {
      baseLayer: false,
      baseLayerPicker: false,
      geocoder: false,
      homeButton: false,
      sceneModePicker: false,
      navigationHelpButton: false,
      animation: false,
      timeline: false,
      fullscreenButton: false,
      infoBox: false,
      selectionIndicator: false,
      creditContainer: document.createElement('div'),
      requestRenderMode: true,
      maximumRenderTimeChange: Number.POSITIVE_INFINITY,
      shouldAnimate: false,
      msaaSamples: 1,
      contextOptions: {
        webgl: {
          alpha: false,
          antialias: false,
          powerPreference: 'high-performance'
        }
      }
    })

    viewerRef.current = viewer
    viewer.resolutionScale = Math.min(window.devicePixelRatio || 1, 2)

    // 1. Seamless polar cap layers to eliminate Web Mercator ±85.05° pole circles
    createPolarCapProvider('north')
      .then((provider) => {
        if (!viewer.isDestroyed()) {
          northPolarLayerRef.current = viewer.imageryLayers.addImageryProvider(provider, 0)
          applyEarthDayNightStyle(darkModeRef.current)
          enforceLayerOrder(viewer)
        }
      })
      .catch(() => {})

    createPolarCapProvider('south')
      .then((provider) => {
        if (!viewer.isDestroyed()) {
          southPolarLayerRef.current = viewer.imageryLayers.addImageryProvider(provider, 0)
          applyEarthDayNightStyle(darkModeRef.current)
          enforceLayerOrder(viewer)
        }
      })
      .catch(() => {})

    // 2. Permanent Optical Satellite layer
    const satLayer = viewer.imageryLayers.addImageryProvider(createOpticalSatelliteProvider())
    satelliteLayerRef.current = satLayer

    // 3. Borders & Place Labels layer (ON by default, toggleable)
    const labelsLayer = viewer.imageryLayers.addImageryProvider(createBordersProvider())
    labelsLayer.alpha = 0.85
    labelsLayerRef.current = labelsLayer

    // Configure high-detail GPU & Tile Quadtree settings
    const { scene, camera } = viewer
    const { globe } = scene
    scene.backgroundColor = Cesium.Color.fromCssColorString('#03060f')
    scene.postProcessStages.fxaa.enabled = false
    scene.fog.enabled = false
    if (scene.skyAtmosphere) {
      scene.skyAtmosphere.show = false
    }
    if (scene.sun) scene.sun.show = false
    if (scene.moon) scene.moon.show = false
    const detachCelestialSky = attachDynamicDesertNightSky(viewer)

    globe.baseColor = Cesium.Color.fromCssColorString('#071226')
    globe.enableLighting = false
    globe.showGroundAtmosphere = false
    globe.maximumScreenSpaceError = 1.25
    globe.tileCacheSize = 500
    globe.preloadAncestors = false
    globe.preloadSiblings = false
    globe.loadingDescendantLimit = 20

    // Smooth 3D navigation
    const controller = scene.screenSpaceCameraController
    controller.enableInputs = true
    controller.enableZoom = true
    controller.enableRotate = true
    controller.enableTilt = true
    controller.enableLook = true
    controller.minimumZoomDistance = 150
    controller.maximumZoomDistance = 45_000_000
    controller.inertiaSpin = 0.88
    controller.inertiaZoom = 0.8

    // Initial orbital camera position
    camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(
        DEFAULT_ORBIT_VIEW.lon,
        DEFAULT_ORBIT_VIEW.lat,
        DEFAULT_ORBIT_VIEW.height
      ),
      orientation: {
        heading: 0,
        pitch: Cesium.Math.toRadians(-90),
        roll: 0
      }
    })

    // Pause auto-rotation when user interacts
    const handler = new Cesium.ScreenSpaceEventHandler(scene.canvas)
    handler.setInputAction(() => {
      userInteractingRef.current = true
      setAutoRotate(false)
    }, Cesium.ScreenSpaceEventType.LEFT_DOWN)
    handler.setInputAction(() => {
      userInteractingRef.current = false
    }, Cesium.ScreenSpaceEventType.LEFT_UP)
    handler.setInputAction(() => {
      setAutoRotate(false)
    }, Cesium.ScreenSpaceEventType.WHEEL)

    // Gentle orbital spin ONLY when autoRotate is enabled
    let lastTime = performance.now()
    const onPreUpdate = (): void => {
      if (!autoRotateRef.current || userInteractingRef.current) return
      const now = performance.now()
      const dt = Math.min((now - lastTime) / 1000, 0.1)
      lastTime = now
      camera.rotate(Cesium.Cartesian3.UNIT_Z, -0.035 * dt)
      scene.requestRender()
    }
    scene.preUpdate.addEventListener(onPreUpdate)

    // Throttled camera telemetry updates
    let lastTelemetryUpdate = 0
    const updateTelemetry = (): void => {
      const now = performance.now()
      if (now - lastTelemetryUpdate < 180) return
      lastTelemetryUpdate = now

      const cartographic = camera.positionCartographic
      if (!cartographic) return
      setTelemetry({
        lat: Number(Cesium.Math.toDegrees(cartographic.latitude).toFixed(4)),
        lon: Number(Cesium.Math.toDegrees(cartographic.longitude).toFixed(4)),
        cameraAltKm: Math.max(0.1, Number((cartographic.height / 1000).toFixed(1))),
        pitchDeg: Math.round(Cesium.Math.toDegrees(camera.pitch))
      })
    }
    camera.changed.addEventListener(updateTelemetry)
    camera.percentageChanged = 0.08

    return () => {
      detachCelestialSky()
      scene.preUpdate.removeEventListener(onPreUpdate)
      camera.changed.removeEventListener(updateTelemetry)
      handler.destroy()
      if (!viewer.isDestroyed()) {
        viewer.destroy()
      }
      viewerRef.current = null
    }
  }, [enforceLayerOrder])

  // ADDITIVE LAYER 1: Active Event Georeferenced SAR PNG Overlay
  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer || viewer.isDestroyed()) return

    let cancelled = false

    const applyEventOverlay = async (): Promise<void> => {
      if (!activeEventLayer) {
        if (sarEventLayerRef.current) {
          viewer.imageryLayers.remove(sarEventLayerRef.current, true)
          sarEventLayerRef.current = null
          viewer.scene.requestRender()
        }
        return
      }

      const dataUrl = await loadSarAssetDataUrl(activeEventLayer.asset_path)
      if (cancelled || viewer.isDestroyed()) return

      if (!dataUrl) {
        if (sarEventLayerRef.current) {
          viewer.imageryLayers.remove(sarEventLayerRef.current, true)
          sarEventLayerRef.current = null
          viewer.scene.requestRender()
        }
        return
      }

      const [west, south, east, north] = activeEventLayer.bbox
      const rect = Cesium.Rectangle.fromDegrees(west, south, east, north)

      try {
        const provider = await Cesium.SingleTileImageryProvider.fromUrl(dataUrl, {
          rectangle: rect,
          credit: `${activeEventLayer.sensor} (${activeEventLayer.title})`
        })
        if (cancelled || viewer.isDestroyed()) return

        if (sarEventLayerRef.current) {
          viewer.imageryLayers.remove(sarEventLayerRef.current, true)
          sarEventLayerRef.current = null
        }

        const added = viewer.imageryLayers.addImageryProvider(provider)
        added.alpha = sarOverlayOpacity
        sarEventLayerRef.current = added
        enforceLayerOrder(viewer)
      } catch (err) {
        console.warn('[GlobeViewer] Failed to drape event SAR layer:', err)
      }
    }

    applyEventOverlay()

    return () => {
      cancelled = true
    }
  }, [activeEventLayer, sarOverlayOpacity, enforceLayerOrder])

  // Update active SAR overlay opacity without recreating the layer
  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer || viewer.isDestroyed()) return
    if (sarEventLayerRef.current) {
      sarEventLayerRef.current.alpha = sarOverlayOpacity
    }
    if (sarBasinLayerRef.current) {
      sarBasinLayerRef.current.alpha = Math.min(0.85, sarOverlayOpacity)
    }
    if (legacyDemoLayerRef.current) {
      legacyDemoLayerRef.current.alpha = sarOverlayOpacity
    }
    if (customApiOverlayLayerRef.current) {
      customApiOverlayLayerRef.current.alpha = sarOverlayOpacity
    }
    viewer.scene.requestRender()
  }, [sarOverlayOpacity])

  // ADDITIVE LAYER 2: Global / Amazon Basin Monthly SAR Progression Overlay (2015–2026)
  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer || viewer.isDestroyed()) return

    const obs = timeline.selectedObservation
    const overlayRelPath =
      liveScope === 'planet'
        ? obs?.planet_overlay_path || obs?.basin_overlay_path
        : obs?.basin_overlay_path

    if (!showBasinProgression || !dataset || !overlayRelPath) {
      if (sarBasinLayerRef.current) {
        viewer.imageryLayers.remove(sarBasinLayerRef.current, false)
        sarBasinLayerRef.current = null
        viewer.scene.requestRender()
      }
      return
    }

    const reqSeq = ++basinReqSeqRef.current
    const bbox =
      liveScope === 'planet' && dataset.planet_bbox ? dataset.planet_bbox : dataset.amazon_basin_bbox
    const rect = Cesium.Rectangle.fromDegrees(bbox[0], bbox[1], bbox[2], bbox[3])
    const creditText =
      liveScope === 'planet'
        ? 'Global Sentinel-1 / SMAP Monthly SAR Composite'
        : 'Sentinel-1 Amazon Basin Monthly VH Composite'

    const loadProvider = async (
      cacheKey: string,
      relPath: string
    ): Promise<Cesium.SingleTileImageryProvider | null> => {
      const existing = basinProviderCacheRef.current.get(cacheKey)
      if (existing) return existing
      const dataUrl = await loadSarAssetDataUrl(relPath)
      if (!dataUrl || viewer.isDestroyed()) return null
      const provider = await Cesium.SingleTileImageryProvider.fromUrl(dataUrl, {
        rectangle: rect,
        credit: creditText
      })
      basinProviderCacheRef.current.set(cacheKey, provider)
      return provider
    }

    const applyFrame = async (): Promise<void> => {
      try {
        const provider = await loadProvider(`${liveScope}:${overlayRelPath}`, overlayRelPath)
        if (!provider || reqSeq !== basinReqSeqRef.current || viewer.isDestroyed()) return

        const prevLayer = sarBasinLayerRef.current
        const added = viewer.imageryLayers.addImageryProvider(provider)
        added.alpha = Math.min(0.85, sarOverlayOpacity)
        sarBasinLayerRef.current = added
        if (prevLayer && prevLayer !== added) {
          viewer.imageryLayers.remove(prevLayer, false)
        }
        enforceLayerOrder(viewer)
      } catch {
        // Ignore single frame failure
      }
    }

    void applyFrame()

    // Speculatively prefetch next 3 timeline months into cache
    const allMonths = timeline.months
    if (allMonths.length > 0) {
      for (const offset of [1, 2, 3]) {
        const nextIdx = (timeline.selectedMonthIndex + offset) % allMonths.length
        const nextPt = allMonths[nextIdx]
        const nextRel =
          liveScope === 'planet'
            ? nextPt?.planet_overlay_path || nextPt?.basin_overlay_path
            : nextPt?.basin_overlay_path
        if (nextRel) {
          void loadProvider(`${liveScope}:${nextRel}`, nextRel).catch(() => undefined)
        }
      }
    }
  }, [
    showBasinProgression,
    liveScope,
    dataset,
    timeline.selectedObservation,
    timeline.selectedMonthIndex,
    timeline.months,
    sarOverlayOpacity,
    enforceLayerOrder
  ])

  // ADDITIVE ENTITIES: Amazon Biome Outline, All 15 Event Callout Pins & Porto Velho Seasonal Pulse Pin
  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer || viewer.isDestroyed()) return

    for (const ent of eventEntitiesRef.current) {
      viewer.entities.remove(ent)
    }
    eventEntitiesRef.current = []

    if (dataset?.amazon_basin_outline && dataset.amazon_basin_outline.length >= 2) {
      const outlineEntity = viewer.entities.add({
        id: 'amazon-biome-outline',
        name: 'Amazon Biome Boundary',
        polyline: {
          positions: Cesium.Cartesian3.fromDegreesArray(dataset.amazon_basin_outline.flat()),
          width: 1.8,
          material: Cesium.Color.fromCssColorString('#38bdf8').withAlpha(0.42)
        }
      })
      eventEntitiesRef.current.push(outlineEntity)
    }

    if (showEventPins) {
      for (const ev of allEvents) {
        const isCurrent = selectedEvent?.eventId === ev.eventId
        const isPhenoMatch = phenomenonEvents.some((p) => p.eventId === ev.eventId)

        let pinLon = ev.longitude
        let pinLat = ev.latitude
        if (ev.eventId === 'nisar_lband_2026') {
          pinLon += 0.42
          pinLat += 0.28
        } else if (ev.eventId === 'el_nino_drought_2015') {
          pinLon -= 0.42
          pinLat -= 0.26
        }

        const pinHex = isCurrent ? '#60a5fa' : ev.accentColor || selectedPhenomenon.accentColor
        const entity = viewer.entities.add({
          id: `sar-event-pin-${ev.eventId}`,
          name: ev.eventName,
          position: Cesium.Cartesian3.fromDegrees(pinLon, pinLat, 1200),
          point: {
            pixelSize: isCurrent ? 12 : isPhenoMatch ? 9 : 7,
            color: Cesium.Color.fromCssColorString(pinHex).withAlpha(
              isCurrent || isPhenoMatch ? 1 : 0.85
            ),
            outlineColor: Cesium.Color.WHITE,
            outlineWidth: isCurrent ? 2.5 : isPhenoMatch ? 1.8 : 1.2,
            disableDepthTestDistance: Number.POSITIVE_INFINITY
          },
          label: {
            text: isCurrent
              ? `${ev.eventName}\n${ev.displayDate} · ${ev.magnitude ?? ev.headlineMetric}`
              : ev.eventName,
            font: isCurrent
              ? '600 12px Inter, system-ui, sans-serif'
              : '500 11px Inter, system-ui, sans-serif',
            fillColor: Cesium.Color.WHITE,
            outlineColor: Cesium.Color.fromCssColorString('#050914'),
            outlineWidth: 3,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            showBackground: true,
            backgroundColor: Cesium.Color.fromCssColorString(
              isCurrent ? 'rgba(20, 32, 54, 0.88)' : 'rgba(11, 17, 29, 0.72)'
            ),
            backgroundPadding: new Cesium.Cartesian2(10, 6),
            pixelOffset: new Cesium.Cartesian2(0, isCurrent ? 28 : -18),
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
            distanceDisplayCondition: new Cesium.DistanceDisplayCondition(
              0,
              isCurrent ? 22_000_000 : isPhenoMatch ? 16_000_000 : 7_500_000
            )
          }
        })
        eventEntitiesRef.current.push(entity)
      }

      if (dataset?.regions?.porto_velho) {
        const pv = dataset.regions.porto_velho
        const isFloodActive =
          activeSeasonalPhenomenonIds.includes('seasonal_flood') ||
          selectedPhenomenon.id === 'amazon_flood_pulse'
        const seasonalEntity = viewer.entities.add({
          id: 'phen-pin:seasonal_flood',
          name: 'Seasonal Amazon Flood Pulse (Porto Velho)',
          position: Cesium.Cartesian3.fromDegrees(pv.center[0], pv.center[1], 1200),
          point: {
            pixelSize: isFloodActive ? 11 : 7,
            color: Cesium.Color.fromCssColorString('#22d3ee').withAlpha(
              isFloodActive ? 1 : 0.78
            ),
            outlineColor: Cesium.Color.WHITE,
            outlineWidth: isFloodActive ? 2.2 : 1.2,
            disableDepthTestDistance: Number.POSITIVE_INFINITY
          },
          label: {
            text: isFloodActive
              ? 'Porto Velho · Active Seasonal Flood Pulse'
              : 'Porto Velho · Seasonal Flood Pulse',
            font: '500 11px Inter, system-ui, sans-serif',
            fillColor: Cesium.Color.fromCssColorString('#bae6fd'),
            outlineColor: Cesium.Color.fromCssColorString('#050914'),
            outlineWidth: 3,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            showBackground: true,
            backgroundColor: Cesium.Color.fromCssColorString('rgba(11, 17, 29, 0.72)'),
            backgroundPadding: new Cesium.Cartesian2(8, 5),
            pixelOffset: new Cesium.Cartesian2(0, 22),
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
            distanceDisplayCondition: new Cesium.DistanceDisplayCondition(
              0,
              isFloodActive ? 14_000_000 : 6_000_000
            )
          }
        })
        eventEntitiesRef.current.push(seasonalEntity)
      }
    }

    viewer.scene.requestRender()
  }, [
    dataset,
    allEvents,
    phenomenonEvents,
    selectedEvent,
    selectedPhenomenon,
    activeSeasonalPhenomenonIds,
    showEventPins
  ])

  // Fly camera to newly selected event when user clicks an incident or changes phenomenon
  const flyToEvent = useCallback((ev: EventRecord) => {
    const viewer = viewerRef.current
    if (!viewer || viewer.isDestroyed()) return
    setAutoRotate(false)

    const [west, south, east, north] = ev.boundingBox
    const spanDeg = Math.max(Math.abs(east - west), Math.abs(north - south), 0.5)
    const targetHeight = Math.max(220_000, Math.min(4_500_000, spanDeg * 240_000))

    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(ev.longitude, ev.latitude, targetHeight),
      orientation: {
        heading: 0,
        pitch: Cesium.Math.toRadians(-90),
        roll: 0
      },
      duration: 1.5
    })
  }, [])

  const flyToBbox = useCallback((bbox: [number, number, number, number]) => {
    const viewer = viewerRef.current
    if (!viewer || viewer.isDestroyed()) return
    setAutoRotate(false)
    const [west, south, east, north] = bbox
    const padLon = Math.max(2, (east - west) * 0.18)
    const padLat = Math.max(1.5, (north - south) * 0.18)
    viewer.camera.flyTo({
      destination: Cesium.Rectangle.fromDegrees(
        Math.max(-180, west - padLon),
        Math.max(-89.9, south - padLat),
        Math.min(180, east + padLon),
        Math.min(89.9, north + padLat)
      ),
      duration: 1.2
    })
  }, [])

  useEffect(() => {
    if (isTouring && selectedEvent) {
      flyToEvent(selectedEvent)
    }
  }, [isTouring, selectedEvent, flyToEvent])

  const handleUserSelectEvent = useCallback(
    (ev: EventRecord) => {
      restoreAllWidgets()
      selectEvent(ev)
      flyToEvent(ev)
    },
    [restoreAllWidgets, selectEvent, flyToEvent]
  )

  const handleUserSelectPhenomenon = useCallback(
    (id: string) => {
      restoreAllWidgets()
      selectPhenomenonById(id)
      const targetPheno = [...globalPhenomena, ...amazonPhenomena].find(
        (p) => p.id === id || p.sourcePhenomenonIds.includes(id)
      )
      if (!targetPheno) return
      const firstEv = allEvents.find(
        (ev) =>
          targetPheno.eventIds.includes(ev.eventId) ||
          ev.phenomenonId === targetPheno.id ||
          ev.additionalPhenomenonIds.includes(targetPheno.id)
      )
      if (firstEv) {
        flyToEvent(firstEv)
      } else if (targetPheno.geographicScope === 'amazon') {
        const viewer = viewerRef.current
        if (viewer && !viewer.isDestroyed()) {
          setAutoRotate(false)
          viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(
              targetPheno.defaultCenter[0],
              targetPheno.defaultCenter[1],
              3_200_000
            ),
            orientation: {
              heading: 0,
              pitch: Cesium.Math.toRadians(-90),
              roll: 0
            },
            duration: 1.5
          })
        }
      }
    },
    [
      restoreAllWidgets,
      selectPhenomenonById,
      globalPhenomena,
      amazonPhenomena,
      allEvents,
      flyToEvent
    ]
  )

  // Click on a globe event pin or seasonal pulse pin to select and focus it
  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer || viewer.isDestroyed()) return

    const clickHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)
    clickHandler.setInputAction((movement: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
      const picked = viewer.scene.pick(movement.position)
      if (Cesium.defined(picked) && picked.id instanceof Cesium.Entity) {
        const entityId = String(picked.id.id || '')
        if (entityId.startsWith('sar-event-pin-')) {
          const evId = entityId.replace('sar-event-pin-', '')
          const found = allEvents.find((e) => e.eventId === evId)
          if (found) {
            handleUserSelectEvent(found)
          }
        } else if (entityId === 'phen-pin:seasonal_flood') {
          handleUserSelectPhenomenon('amazon-pheno-2')
        }
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

    return () => {
      if (!clickHandler.isDestroyed()) {
        clickHandler.destroy()
      }
    }
  }, [allEvents, handleUserSelectEvent, handleUserSelectPhenomenon])

  // Toggle synthetic calibration demo layer from sarsDataApi.ts (explicitly flagged as DEMO)
  const handleToggleLegacyDemoOverlay = useCallback(async () => {
    const viewer = viewerRef.current
    if (!viewer || viewer.isDestroyed()) return

    if (legacyDemoLayerRef.current) {
      viewer.imageryLayers.remove(legacyDemoLayerRef.current, true)
      legacyDemoLayerRef.current = null
      setIsDemoFallbackActive(false)
      viewer.scene.requestRender()
      return
    }

    const dataUrl = renderSarsDataOverlayPng('flood', 'mamiraua', '2023-01', '2023-06')
    const [west, south, east, north] = PREDEFINED_STUDY_AREAS.mamiraua.bbox
    const provider = await Cesium.SingleTileImageryProvider.fromUrl(dataUrl, {
      rectangle: Cesium.Rectangle.fromDegrees(west, south, east, north),
      credit: 'DEMO SYNTHETIC CALIBRATION OVERLAY'
    })
    if (viewer.isDestroyed()) return
    const layer = viewer.imageryLayers.addImageryProvider(provider)
    layer.alpha = sarOverlayOpacity
    legacyDemoLayerRef.current = layer
    setIsDemoFallbackActive(true)
    enforceLayerOrder(viewer)
  }, [sarOverlayOpacity, setIsDemoFallbackActive, enforceLayerOrder])

  // Toggle Dark Mode (Earth at Night with VIIRS City Lights)
  const handleToggleDarkMode = (checked?: boolean): void => {
    const viewer = viewerRef.current
    if (!viewer || viewer.isDestroyed()) return
    const next = typeof checked === 'boolean' ? checked : !darkMode
    setDarkMode(next)
    darkModeRef.current = next

    applyEarthDayNightStyle(next)

    if (next && !nightLightsLayerRef.current) {
      const lightsLayer = viewer.imageryLayers.addImageryProvider(createNightLightsProvider())
      lightsLayer.colorToAlpha = Cesium.Color.BLACK
      lightsLayer.colorToAlphaThreshold = 0.12
      lightsLayer.brightness = 1.65
      lightsLayer.contrast = 1.25
      lightsLayer.alpha = 0.95
      nightLightsLayerRef.current = lightsLayer
      enforceLayerOrder(viewer)
    } else if (!next && nightLightsLayerRef.current) {
      viewer.imageryLayers.remove(nightLightsLayerRef.current, true)
      nightLightsLayerRef.current = null
      viewer.scene.requestRender()
    } else {
      viewer.scene.requestRender()
    }
  }

  // Toggle Topography (Altitude Color Heatmap)
  const handleToggleTopography = (checked?: boolean): void => {
    const viewer = viewerRef.current
    if (!viewer || viewer.isDestroyed()) return
    const next = typeof checked === 'boolean' ? checked : !showTopography
    setShowTopography(next)

    if (next && !srtmLayerRef.current) {
      const layer = viewer.imageryLayers.addImageryProvider(createSrtmTopographyProvider())
      layer.alpha = 0.65
      srtmLayerRef.current = layer
      enforceLayerOrder(viewer)
    } else if (!next && srtmLayerRef.current) {
      viewer.imageryLayers.remove(srtmLayerRef.current, true)
      srtmLayerRef.current = null
      viewer.scene.requestRender()
    }
  }

  // Toggle Borders & Place Labels
  const handleToggleBorders = (checked?: boolean): void => {
    const viewer = viewerRef.current
    if (!viewer || viewer.isDestroyed()) return
    const next = typeof checked === 'boolean' ? checked : !showBorders
    setShowBorders(next)

    if (next && !labelsLayerRef.current) {
      const layer = viewer.imageryLayers.addImageryProvider(createBordersProvider())
      layer.alpha = 0.85
      labelsLayerRef.current = layer
      enforceLayerOrder(viewer)
    } else if (!next && labelsLayerRef.current) {
      viewer.imageryLayers.remove(labelsLayerRef.current, true)
      labelsLayerRef.current = null
      viewer.scene.requestRender()
    }
  }

  // Toggle Atmosphere & Horizon Glow
  const handleToggleAtmosphere = (checked?: boolean): void => {
    const next = typeof checked === 'boolean' ? checked : !showAtmosphere
    setShowAtmosphere(next)
    const viewer = viewerRef.current
    if (!viewer || viewer.isDestroyed()) return
    viewer.scene.globe.showGroundAtmosphere = next
    if (viewer.scene.skyAtmosphere) {
      viewer.scene.skyAtmosphere.show = next
    }
    viewer.scene.fog.enabled = next
    viewer.scene.requestRender()
  }

  // Refresh Footage: Refreshes permanent satellite + polar caps and labels if enabled
  const handleRefreshFootage = (): void => {
    const viewer = viewerRef.current
    if (!viewer || viewer.isDestroyed()) return

    setIsRefreshing(true)
    const bust = Date.now()

    if (northPolarLayerRef.current) {
      viewer.imageryLayers.remove(northPolarLayerRef.current, true)
      northPolarLayerRef.current = null
    }
    if (southPolarLayerRef.current) {
      viewer.imageryLayers.remove(southPolarLayerRef.current, true)
      southPolarLayerRef.current = null
    }

    createPolarCapProvider('north', bust)
      .then((provider) => {
        if (!viewer.isDestroyed()) {
          northPolarLayerRef.current = viewer.imageryLayers.addImageryProvider(provider, 0)
          applyEarthDayNightStyle(darkModeRef.current)
          enforceLayerOrder(viewer)
        }
      })
      .catch(() => {})

    createPolarCapProvider('south', bust)
      .then((provider) => {
        if (!viewer.isDestroyed()) {
          southPolarLayerRef.current = viewer.imageryLayers.addImageryProvider(provider, 0)
          applyEarthDayNightStyle(darkModeRef.current)
          enforceLayerOrder(viewer)
        }
      })
      .catch(() => {})

    if (satelliteLayerRef.current) {
      viewer.imageryLayers.remove(satelliteLayerRef.current, true)
      satelliteLayerRef.current = viewer.imageryLayers.addImageryProvider(
        createOpticalSatelliteProvider(bust)
      )
      applyEarthDayNightStyle(darkModeRef.current)
    }

    if (nightLightsLayerRef.current) {
      viewer.imageryLayers.remove(nightLightsLayerRef.current, true)
      const freshLights = viewer.imageryLayers.addImageryProvider(createNightLightsProvider(bust))
      freshLights.colorToAlpha = Cesium.Color.BLACK
      freshLights.colorToAlphaThreshold = 0.12
      freshLights.brightness = 1.65
      freshLights.contrast = 1.25
      freshLights.alpha = 0.95
      nightLightsLayerRef.current = freshLights
    }

    if (srtmLayerRef.current) {
      viewer.imageryLayers.remove(srtmLayerRef.current, true)
      const freshSrtm = viewer.imageryLayers.addImageryProvider(createSrtmTopographyProvider(bust))
      freshSrtm.alpha = 0.65
      srtmLayerRef.current = freshSrtm
    }

    if (labelsLayerRef.current) {
      viewer.imageryLayers.remove(labelsLayerRef.current, true)
      const freshBorders = viewer.imageryLayers.addImageryProvider(createBordersProvider(bust))
      freshBorders.alpha = 0.85
      labelsLayerRef.current = freshBorders
    }

    enforceLayerOrder(viewer)

    window.setTimeout(() => {
      setIsRefreshing(false)
    }, 500)
  }

  const handleZoomIn = (): void => {
    const viewer = viewerRef.current
    if (!viewer) return
    setAutoRotate(false)
    const height = viewer.camera.positionCartographic.height
    viewer.camera.zoomIn(height * 0.35)
    viewer.scene.requestRender()
  }

  const handleZoomOut = (): void => {
    const viewer = viewerRef.current
    if (!viewer) return
    setAutoRotate(false)
    const height = viewer.camera.positionCartographic.height
    viewer.camera.zoomOut(Math.max(height * 0.45, 1000))
    viewer.scene.requestRender()
  }

  const handleResetOrbit = (): void => {
    const viewer = viewerRef.current
    if (!viewer) return
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(
        DEFAULT_ORBIT_VIEW.lon,
        DEFAULT_ORBIT_VIEW.lat,
        DEFAULT_ORBIT_VIEW.height
      ),
      orientation: {
        heading: 0,
        pitch: Cesium.Math.toRadians(-90),
        roll: 0
      },
      duration: 1.5
    })
  }

  const handleResetNorth = (): void => {
    const viewer = viewerRef.current
    if (!viewer) return
    const carto = viewer.camera.positionCartographic
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromRadians(carto.longitude, carto.latitude, carto.height),
      orientation: {
        heading: 0,
        pitch: viewer.camera.pitch,
        roll: 0
      },
      duration: 0.8
    })
  }

  const studyRegionOptions = useMemo(
    () =>
      Object.values(dataset?.regions ?? {}).map((r) => ({
        id: r.id,
        name: r.name
      })),
    [dataset]
  )

  const formattedTelemetry = useMemo(
    () => ({
      lat: `${telemetry.lat.toFixed(2)}°`,
      lon: `${telemetry.lon.toFixed(2)}°`,
      alt:
        telemetry.cameraAltKm >= 100
          ? `${Math.round(telemetry.cameraAltKm).toLocaleString()} km`
          : `${telemetry.cameraAltKm.toFixed(1)} km`,
      heading: telemetry.pitchDeg
    }),
    [telemetry]
  )

  const removeCustomOverlayLayers = useCallback((viewer: Cesium.Viewer) => {
    if (customApiOverlayLayerRef.current) {
      viewer.imageryLayers.remove(customApiOverlayLayerRef.current, true)
      customApiOverlayLayerRef.current = null
    }
    if (customApiGeoJsonRef.current) {
      viewer.dataSources.remove(customApiGeoJsonRef.current, true)
      customApiGeoJsonRef.current = null
    }
  }, [])

  const activeOverlaySuggestion = useMemo(
    () => findCustomOverlaySuggestionByUrl(activeCustomOverlayUrl),
    [activeCustomOverlayUrl]
  )

  const handleClearCustomOverlay = useCallback(() => {
    const viewer = viewerRef.current
    if (viewer && !viewer.isDestroyed()) {
      removeCustomOverlayLayers(viewer)
      viewer.scene.requestRender()
    }
    setCustomOverlayActive(false)
    setActiveCustomOverlayUrl('')
    setCustomOverlayStatus(null)
    setActiveSidebarTab((prev) => (prev === 'customOverlayExplanation' ? 'statistics' : prev))
  }, [removeCustomOverlayLayers])

  const handleLoadCustomOverlay = useCallback(
    async (urlOverride?: string) => {
      const viewer = viewerRef.current
      if (!viewer || viewer.isDestroyed()) return
      const targetUrl = (typeof urlOverride === 'string' ? urlOverride : customOverlayUrl).trim()
      if (!targetUrl) return

      const matchedSuggestion = findCustomOverlaySuggestionByUrl(targetUrl)

      setCustomOverlayLoading(true)
      setCustomOverlayStatus('Connecting to custom API endpoint…')

      try {
        const fallbackBbox = selectedEvent?.boundingBox ?? selectedPhenomenon.defaultBbox
        const layerSpec = await fetchCustomDirectEndpointLayer(targetUrl, fallbackBbox)
        if (viewer.isDestroyed()) return

        removeCustomOverlayLayers(viewer)

        if (layerSpec.tile_url_template) {
          const tileUrl = layerSpec.tile_url_template
          const gibsLevelMatch = tileUrl.match(/GoogleMapsCompatible_Level(\d+)/i)
          const parsedLevel = gibsLevelMatch ? parseInt(gibsLevelMatch[1], 10) : undefined
          const maxLevel = matchedSuggestion?.maximumLevel ?? parsedLevel
          const isWebMercator =
            /epsg3857|GoogleMapsCompatible/i.test(tileUrl) || tileUrl.includes('openseamap.org')
          const isEpsg4326 = /epsg4326/i.test(tileUrl)

          const provider = new Cesium.UrlTemplateImageryProvider({
            url: tileUrl,
            ...(typeof maxLevel === 'number' && Number.isFinite(maxLevel)
              ? { maximumLevel: maxLevel }
              : {}),
            ...(isEpsg4326
              ? { tilingScheme: new Cesium.GeographicTilingScheme() }
              : isWebMercator
                ? {
                    tilingScheme: new Cesium.WebMercatorTilingScheme(),
                    rectangle: Cesium.Rectangle.fromDegrees(-180, -85.05112878, 180, 85.05112878)
                  }
                : {}),
            credit: matchedSuggestion?.shortLabel || layerSpec.title || 'Custom API Overlay'
          })
          const layer = viewer.imageryLayers.addImageryProvider(provider)
          layer.alpha = sarOverlayOpacity
          if (/\.(jpe?g)(\?.*)?$/i.test(tileUrl)) {
            layer.colorToAlpha = Cesium.Color.BLACK
            layer.colorToAlphaThreshold = 0.04
          }
          customApiOverlayLayerRef.current = layer
        } else if (layerSpec.DataUrlFallback) {
          const [west, south, east, north] = layerSpec.bbox
          const provider = await Cesium.SingleTileImageryProvider.fromUrl(
            layerSpec.DataUrlFallback,
            {
              rectangle: Cesium.Rectangle.fromDegrees(west, south, east, north),
              credit: matchedSuggestion?.shortLabel || layerSpec.title || 'Custom API Overlay'
            }
          )
          if (viewer.isDestroyed()) return
          const layer = viewer.imageryLayers.addImageryProvider(provider)
          layer.alpha = sarOverlayOpacity
          customApiOverlayLayerRef.current = layer
        }

        if (layerSpec.geojson) {
          const ds = await Cesium.GeoJsonDataSource.load(layerSpec.geojson, {
            stroke: Cesium.Color.fromCssColorString('#38bdf8'),
            fill: Cesium.Color.fromCssColorString('#38bdf8').withAlpha(0.35),
            markerColor: Cesium.Color.fromCssColorString('#f97316'),
            markerSize: 22,
            clampToGround: true,
            strokeWidth: 2
          })
          if (viewer.isDestroyed()) return
          for (const entity of ds.entities.values) {
            if (entity.billboard) {
              entity.billboard = undefined
              entity.point = new Cesium.PointGraphics({
                pixelSize: 7,
                color: Cesium.Color.fromCssColorString('#f97316').withAlpha(0.92),
                outlineColor: Cesium.Color.WHITE,
                outlineWidth: 1.5,
                disableDepthTestDistance: Number.POSITIVE_INFINITY
              })
            }
          }
          await viewer.dataSources.add(ds)
          customApiGeoJsonRef.current = ds
        }

        enforceLayerOrder(viewer)
        if (Math.abs(layerSpec.bbox[2] - layerSpec.bbox[0]) < 300) {
          flyToBbox(layerSpec.bbox)
        }
        setActiveCustomOverlayUrl(targetUrl)
        setCustomOverlayActive(true)
        setCustomOverlayStatus(
          `Loaded: ${matchedSuggestion?.shortLabel || layerSpec.title} (${layerSpec.layer_type})`
        )
        handleOpenSidebar()
      } catch (err) {
        setCustomOverlayActive(false)
        setActiveCustomOverlayUrl('')
        setCustomOverlayStatus(
          `Failed to load custom API: ${err instanceof Error ? err.message : 'Unknown error'}`
        )
        setActiveSidebarTab((prev) => (prev === 'customOverlayExplanation' ? 'statistics' : prev))
      } finally {
        setCustomOverlayLoading(false)
      }
    },
    [
      customOverlayUrl,
      selectedEvent,
      selectedPhenomenon,
      sarOverlayOpacity,
      removeCustomOverlayLayers,
      enforceLayerOrder,
      flyToBbox,
      handleOpenSidebar
    ]
  )

  const handleApplyCustomApi = (): void => {
    checkSarsBackendHealth(customApiBaseUrl)
      .then((res) => setBackendConnected(res.online))
      .catch(() => setBackendConnected(false))
  }

  const handleApplyLocalModelUrl = (): void => {
    const normalized = normalizeLmStudioBaseUrl(localModelBaseUrl)
    setLocalModelBaseUrl(normalized)
    setActiveLocalModelBaseUrl(normalized)
    setLocalModelRefreshToken((n) => n + 1)
    setLocalModelChecking(true)
    setLocalModelStatus(`Connecting to ${normalized}…`)
    checkLmStudioConnection(normalized)
      .then((res) => {
        setLocalModelConnected(res.ok)
        if (res.ok) {
          setLocalModelStatus(
            `Connected to ${normalized}${res.activeModel ? ` (${res.activeModel})` : ''}`
          )
        } else {
          setLocalModelStatus(res.error || `Cannot reach LM Studio at ${normalized}`)
        }
      })
      .catch((err) => {
        setLocalModelConnected(false)
        setLocalModelStatus(err instanceof Error ? err.message : `Cannot reach ${normalized}`)
      })
      .finally(() => {
        setLocalModelChecking(false)
      })
  }

  return (
    <div className={`globe-stage ${uiLightTheme ? 'sars-theme-light' : 'sars-theme-dark'}`}>
      {/* Fullscreen 3D Cesium Canvas (dynamically shifted to stay centered in open view) */}
      <div
        ref={containerRef}
        className={`cesium-Viewport ${isSidebarVisible ? 'has-sidebar' : ''} ${
          widgetVisibility.timeline ? 'has-timeline' : ''
        }`}
      />

      {/* AREA A: TOP NAVIGATION HEADER */}
      <DashboardHeader
        globalPhenomena={globalPhenomena}
        amazonPhenomena={amazonPhenomena}
        selectedPhenomenon={selectedPhenomenon}
        onSelectPhenomenon={handleUserSelectPhenomenon}
        lockedRegionId={lockedRegionId}
        onSelectAmazonRegion={(regionId) => {
          setLockedRegionId(regionId)
          if (regionId) {
            restoreAllWidgets()
            const region = dataset?.regions?.[regionId]
            if (region?.bbox) {
              flyToBbox(region.bbox)
            }
          }
        }}
        studyRegionOptions={studyRegionOptions}
        isAiSidebarOpen={isAiSidebarOpen}
        onToggleAiSidebar={() => setIsAiSidebarOpen((p) => !p)}
        showTelemetryHud={showTelemetryHud}
        cameraTelemetry={formattedTelemetry}
        datasetStatus={datasetStatus}
        widgetVisibility={widgetVisibility}
        onToggleWidget={handleToggleWidgetTab}
        isTouring={isTouring}
        onToggleTour={toggleTour}
        settingsProps={{
          showTerrain: showTopography,
          onToggleTerrain: () => handleToggleTopography(),
          darkMode,
          onToggleDarkMode: () => handleToggleDarkMode(),
          showLabels: showBorders,
          onToggleLabels: () => handleToggleBorders(),
          showAtmosphere,
          onToggleAtmosphere: () => handleToggleAtmosphere(),
          autoRotate,
          onToggleAutoRotate: () => setAutoRotate((p) => !p),
          showBasinProgression,
          onToggleBasinProgression: toggleBasinProgression,
          showEventPins,
          onToggleEventPins: () => setShowEventPins((p) => !p),
          sarOverlayOpacity,
          onChangeSarOverlayOpacity: setSarOverlayOpacity,
          uiLightTheme,
          onToggleUiLightTheme: () => setUiLightTheme((p) => !p),
          widgetVisibility,
          onToggleWidget: handleToggleWidgetTab,
          onRestoreAllWidgets: restoreAllWidgets,
          showTelemetryHud,
          onToggleTelemetryHud: () => setShowTelemetryHud((p) => !p),
          showNavigationControls: showNavButtons,
          onToggleNavigationControls: () => setShowNavButtons((p) => !p),
          showBottomMapBar: showQuickBar,
          onToggleBottomMapBar: () => setShowQuickBar((p) => !p),
          showScaleLegend: showAltitudeLegend,
          onToggleScaleLegend: () => setShowAltitudeLegend((p) => !p),
          showCursorTooltip,
          onToggleCursorTooltip: () => setShowCursorTooltip((p) => !p),
          isRefreshing,
          onRefreshImagery: handleRefreshFootage,
          onResetOrbitView: handleResetOrbit,
          customApiBaseUrl,
          onChangeCustomApiBaseUrl: setCustomApiBaseUrl,
          onApplyCustomApiBaseUrl: handleApplyCustomApi,
          backendConnected,
          customOverlayUrl,
          onChangeCustomOverlayUrl: setCustomOverlayUrl,
          onLoadCustomOverlay: handleLoadCustomOverlay,
          onClearCustomOverlay: handleClearCustomOverlay,
          customOverlayActive,
          customOverlayLoading,
          customOverlayStatus,
          onToggleLegacyDemoOverlay: handleToggleLegacyDemoOverlay,
          legacyDemoOverlayActive: isDemoFallbackActive,
          localModelBaseUrl,
          onChangeLocalModelBaseUrl: setLocalModelBaseUrl,
          onApplyLocalModelBaseUrl: handleApplyLocalModelUrl,
          localModelConnected,
          localModelChecking,
          localModelStatus
        }}
      />

      {/* AREA B: HISTORICAL TIMELINE (JAN 2015 -> DEC 2026) */}
      {widgetVisibility.timeline && (
        <HistoricalTimeline
          timeline={timeline}
          phenomenonEvents={phenomenonEvents}
          allEvents={allEvents}
          selectedEvent={selectedEvent}
          hasLeftPanel={isSidebarVisible}
          hasRightPanel={isAiSidebarOpen}
          onSelectEvent={handleUserSelectEvent}
          onStartPlayback={() => {
            if (!showBasinProgression) toggleBasinProgression()
          }}
          onStopTour={stopTour}
          onHideTimeline={() => toggleWidget('timeline')}
        />
      )}

      {/* UNIFIED 3-TAB LEFT SIDEBAR: STATISTICS, SUMMARY / EVENTS & SCIENTIFIC EXPLANATION */}
      {isSidebarVisible && (
        <aside
          className="sars-panel sars-unified-sidebar"
          aria-label="SAR Analysis Sidebar (Statistics, Events and Explanation)"
        >
          <div className="sars-unified-sidebar__header">
            <div className="sars-unified-sidebar__tabs" role="tablist" aria-label="Sidebar Tabs">
              <button
                type="button"
                role="tab"
                aria-selected={activeSidebarTab === 'statistics'}
                className={`sars-unified-sidebar__tab ${
                  activeSidebarTab === 'statistics' ? 'is-active' : ''
                }`}
                onClick={() => setActiveSidebarTab('statistics')}
              >
                <BarChart3 size={13} />
                <span>Statistics</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeSidebarTab === 'eventSummary'}
                className={`sars-unified-sidebar__tab ${
                  activeSidebarTab === 'eventSummary' ? 'is-active' : ''
                }`}
                onClick={() => setActiveSidebarTab('eventSummary')}
              >
                <Layers size={13} />
                <span>Events</span>
                <span className="sars-unified-sidebar__count">{filteredEvents.length}</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeSidebarTab === 'scientificExplanation'}
                className={`sars-unified-sidebar__tab ${
                  activeSidebarTab === 'scientificExplanation' ? 'is-active' : ''
                }`}
                onClick={() => setActiveSidebarTab('scientificExplanation')}
              >
                <BookOpen size={13} />
                <span>Science</span>
              </button>
            </div>

            <button
              type="button"
              className="sars-hide-btn"
              onClick={handleHideSidebar}
              title="Hide Unified Left Sidebar"
            >
              <PanelLeftClose size={12} />
              <span>Hide</span>
            </button>
          </div>

          {customOverlayActive && (
            <div className="sars-unified-sidebar__subrow" role="tablist" aria-label="Custom Overlay Tabs">
              <button
                type="button"
                role="tab"
                aria-selected={activeSidebarTab === 'customOverlayExplanation'}
                className={`sars-unified-sidebar__tab sars-unified-sidebar__subtab ${
                  activeSidebarTab === 'customOverlayExplanation' ? 'is-active' : ''
                }`}
                onClick={() => setActiveSidebarTab('customOverlayExplanation')}
                title="Scientific explanation for the active Custom API overlay"
              >
                <Info size={13} />
                <span>Overlay Explanation</span>
              </button>
            </div>
          )}

          <div className="sars-unified-sidebar__body">
            {activeSidebarTab === 'statistics' && (
              <StatisticsPanel
                statistics={statistics}
                selectedEvent={selectedEvent}
                activeEventLayer={activeEventLayer}
                onSelectEventLayer={selectEventLayerById}
                sarOverlayOpacity={sarOverlayOpacity}
                onChangeSarOverlayOpacity={setSarOverlayOpacity}
                onHide={handleHideSidebar}
                embedded
              />
            )}

            {activeSidebarTab === 'eventSummary' && (
              <EventSummaryPanel
                selectedPhenomenon={selectedPhenomenon}
                events={filteredEvents}
                selectedEvent={selectedEvent}
                onSelectEvent={handleUserSelectEvent}
                onOpenReport={openReportModal}
                onOpenMedia={openMediaModal}
                hoveredLocation={hoveredLocation}
                lockedRegionId={lockedRegionId}
                onClearLockedRegion={() => setLockedRegionId(null)}
                dateFilterMode={timeline.dateFilterMode}
                onResetDateFilterMode={() => timeline.setDateFilterMode('all_period')}
                selectedDate={timeline.selectedDate}
                onHide={handleHideSidebar}
                embedded
              />
            )}

            {activeSidebarTab === 'scientificExplanation' && (
              <ScientificExplanationPanel
                phenomenon={selectedPhenomenon}
                selectedEvent={selectedEvent}
                activeEventLayer={activeEventLayer}
                explanation={scientificExplanation}
                onHide={handleHideSidebar}
                embedded
              />
            )}

            {activeSidebarTab === 'customOverlayExplanation' &&
              customOverlayActive &&
              (activeOverlaySuggestion ? (
                <section
                  className="sars-tab-pane sars-explanation-pane sars-custom-overlay-pane"
                  aria-label="Custom Overlay Scientific Explanation"
                >
                  <div className="sars-bottom-panel__header">
                    <div className="sars-bottom-panel__header-left">
                      <span className="sars-bottom-panel__kicker">
                        SUGGESTED OVERLAY · {activeOverlaySuggestion.category.toUpperCase()}
                      </span>
                    </div>
                    <div className="sars-bottom-panel__header-right">
                      <span className="sars-bottom-panel__sensor">
                        {activeOverlaySuggestion.sensorBadge}
                      </span>
                    </div>
                  </div>

                  <h3 className="sars-custom-overlay-pane__title">
                    {activeOverlaySuggestion.title}
                  </h3>

                  <div className="sars-bottom-panel__columns">
                    <div className="sars-explanation-col">
                      <h4 className="sars-explanation-col__title">What This Overlay Represents</h4>
                      <p className="sars-explanation-col__body">
                        {activeOverlaySuggestion.whatItRepresents}
                      </p>
                    </div>

                    <div className="sars-explanation-col">
                      <h4 className="sars-explanation-col__title">
                        Scientific Phenomena Shown
                      </h4>
                      <p className="sars-explanation-col__body">
                        {activeOverlaySuggestion.scientificPhenomena}
                      </p>
                    </div>

                    <div className="sars-explanation-col">
                      <h4 className="sars-explanation-col__title">How to Read the Overlay</h4>
                      <p className="sars-explanation-col__body">
                        {activeOverlaySuggestion.readingGuide}
                      </p>
                      {activeOverlaySuggestion.legend.length > 0 && (
                        <div className="sars-explanation-swatches" style={{ marginTop: 8 }}>
                          <div className="sars-swatch-pills is-compact">
                            {activeOverlaySuggestion.legend.map((swatch, idx) => (
                              <span key={`${swatch.color}-${idx}`} className="sars-swatch-pill">
                                <span
                                  className="sars-swatch-pill__dot"
                                  style={{ background: swatch.color }}
                                  aria-hidden="true"
                                />
                                <span className="sars-swatch-pill__label">{swatch.label}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="sars-explanation-col">
                      <h4 className="sars-explanation-col__title">Mission &amp; Data Provenance</h4>
                      <p className="sars-explanation-col__body">
                        {activeOverlaySuggestion.dataProvenance}
                      </p>
                    </div>
                  </div>
                </section>
              ) : (
                <div
                  className="sars-tab-pane sars-custom-overlay-pane is-blank"
                  aria-label="User Custom API Overlay Explanation"
                />
              ))}
          </div>
        </aside>
      )}

      {/* Persistent Left Edge Arrow Toggle for Opening / Collapsing the Side Menu */}
      <button
        type="button"
        className={`sars-sidebar-edge-arrow ${isSidebarVisible ? 'is-open' : 'is-closed'}`}
        onClick={isSidebarVisible ? handleHideSidebar : handleOpenSidebar}
        title={isSidebarVisible ? 'Collapse Side Menu' : 'Open Side Menu (Statistics, Events & Science)'}
        aria-label={isSidebarVisible ? 'Collapse Side Menu' : 'Open Side Menu'}
        aria-expanded={isSidebarVisible}
      >
        {isSidebarVisible ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </button>

      {/* FLOATING PLANET HOVER TELEMETRY PILL (NON-OVERLAPPING BOTTOM HUD) */}
      {showCursorTooltip &&
        hoveredLocation &&
        hoveredLocation.latitude !== null &&
        hoveredLocation.longitude !== null &&
        hoveredLocation.state !== 'OUTSIDE' && (
          <div
            className={`sars-planet-hover-hud ${isSidebarVisible ? 'has-sidebar' : ''} ${
              hoveredLocation.state === 'AMAZON LOCATION' ||
              hoveredLocation.state === 'GLOBAL LOCATION'
                ? 'is-matched'
                : ''
            }`}
            aria-live="polite"
          >
            <Compass size={13} className="sars-planet-hover-hud__icon" />
            <span className="sars-planet-hover-hud__state">{hoveredLocation.state}</span>
            <span className="sars-planet-hover-hud__sep">·</span>
            <span className="sars-planet-hover-hud__coords">
              {hoveredLocation.latitude.toFixed(2)}°, {hoveredLocation.longitude.toFixed(2)}°
            </span>
            {(hoveredLocation.regionName || hoveredLocation.statusMessage) && (
              <>
                <span className="sars-planet-hover-hud__sep">·</span>
                <span className="sars-planet-hover-hud__region">
                  {hoveredLocation.regionName
                    ? `${hoveredLocation.regionName}${
                        hoveredLocation.country ? `, ${hoveredLocation.country}` : ''
                      }`
                    : hoveredLocation.statusMessage}
                </span>
              </>
            )}
          </div>
        )}

      {/* Optional Quick Layer Switcher Bar (toggleable in Settings) */}
      {showQuickBar && (
        <div className={`hud-basemap-bar sars-floating-quickbar ${isSidebarVisible ? 'has-sidebar' : ''}`}>
          <Layers size={14} className="hud-icon-cyan" />
          <button
            type="button"
            className={`basemap-chip ${showTopography ? 'active' : ''}`}
            onClick={() => handleToggleTopography()}
            title="Toggle Altitude Color Topography Layer"
          >
            <Mountain
              size={13}
              style={{ display: 'inline', marginRight: 5, verticalAlign: '-2px' }}
            />
            Topography
          </button>
          <button
            type="button"
            className={`basemap-chip ${showBorders ? 'active' : ''}`}
            onClick={() => handleToggleBorders()}
          >
            Labels
          </button>
          <button
            type="button"
            className={`basemap-chip ${darkMode ? 'active' : ''}`}
            onClick={() => handleToggleDarkMode()}
            title="Toggle Earth Night Mode (VIIRS)"
          >
            <Moon size={13} style={{ display: 'inline', marginRight: 5, verticalAlign: '-2px' }} />
            Earth at Night
          </button>
        </div>
      )}

      {/* Compact Topography (Altitude) Scale Legend — shown when Topography is active */}
      {showAltitudeLegend && showTopography && (
        <aside
          className={`hud-legend-card sars-altitude-legend ${isSidebarVisible ? 'has-sidebar' : ''}`}
        >
          <div className="legend-header">
            <span>SRTM RADAR TOPOGRAPHY · ALTITUDE SCALE (METERS ASL)</span>
          </div>
          <div className="legend-items">
            <div className="legend-item-row">
              <span className="legend-swatch" style={{ backgroundColor: '#ffffff' }} />
              <span className="legend-label">&gt; 3,500 m · High Alpine / Mountain Peaks</span>
            </div>
            <div className="legend-item-row">
              <span className="legend-swatch" style={{ backgroundColor: '#b97a57' }} />
              <span className="legend-label">1,500 – 3,500 m · Mountain Ranges &amp; Plateaus</span>
            </div>
            <div className="legend-item-row">
              <span className="legend-swatch" style={{ backgroundColor: '#f5e663' }} />
              <span className="legend-label">500 – 1,500 m · Uplands &amp; Highlands</span>
            </div>
            <div className="legend-item-row">
              <span className="legend-swatch" style={{ backgroundColor: '#22b14c' }} />
              <span className="legend-label">50 – 500 m · Interior Plains &amp; Valleys</span>
            </div>
            <div className="legend-item-row">
              <span className="legend-swatch" style={{ backgroundColor: '#00a2e8' }} />
              <span className="legend-label">0 – 50 m · Coastal Lowlands &amp; River Deltas</span>
            </div>
          </div>
        </aside>
      )}

      {/* Fixed Bottom-Right Camera & Rotation Controls */}
      {showNavButtons && (
        <div
          className={`hud-nav-controls ${isAiSidebarOpen ? 'has-right-panel' : ''}`}
          role="group"
          aria-label="Camera and Rotation Controls"
        >
          <button
            type="button"
            className={`nav-btn nav-btn--rotate ${autoRotate ? 'active' : ''}`}
            onClick={() => setAutoRotate((prev) => !prev)}
            title="Toggle Orbital Auto-Rotation"
          >
            <Orbit size={15} />
            <span>{autoRotate ? 'Auto-Rotate On' : 'Auto-Rotate'}</span>
          </button>

          <div className="hud-nav-controls__row">
            <button
              type="button"
              className={`nav-btn ${isRefreshing ? 'active' : ''}`}
              onClick={handleRefreshFootage}
              title="Refresh Active Layers"
            >
              <RefreshCw size={16} className={isRefreshing ? 'spin-icon' : ''} />
            </button>
            <button type="button" className="nav-btn" onClick={handleZoomIn} title="Zoom In">
              <ZoomIn size={16} />
            </button>
            <button type="button" className="nav-btn" onClick={handleZoomOut} title="Zoom Out">
              <ZoomOut size={16} />
            </button>
            <button
              type="button"
              className="nav-btn"
              onClick={handleResetNorth}
              title="Align Heading North"
            >
              <Compass size={16} />
            </button>
            <button
              type="button"
              className="nav-btn"
              onClick={handleResetOrbit}
              title="Reset to Orbital View"
            >
              <RotateCcw size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Optional Mouse Navigation Hint */}
      {showControlsHint && (
        <div className={`hud-controls-hint ${isSidebarVisible ? 'has-sidebar' : ''}`}>
          <span>Left-Drag: Rotate / Pan</span>
          <span>·</span>
          <span>Scroll / Right-Drag: Zoom</span>
          <span>·</span>
          <span>Middle-Drag or Ctrl+Drag: 3D Tilt</span>
        </div>
      )}

      {/* FLOATING GUIDED TOUR HUD BANNER */}
      {isTouring && selectedEvent && (
        <div
          className={`sars-tour-banner ${isSidebarVisible ? 'has-sidebar' : ''}`}
          role="region"
          aria-label="Guided SAR Mission Tour"
        >
          <div className="sars-tour-banner__meta">
            <span className="sars-tour-banner__kicker">
              <Play size={11} />
              <span>
                GUIDED TOUR · STOP {tourStopIdx + 1} / {tourStopCount}
              </span>
            </span>
            <strong className="sars-tour-banner__title">{selectedEvent.eventName}</strong>
            <span className="sars-tour-banner__sub">
              {selectedEvent.displayDate} · {selectedEvent.headlineMetric}
            </span>
          </div>
          <div className="sars-tour-banner__actions">
            <button
              type="button"
              className="sars-tour-banner__btn"
              onClick={() => {
                const ev = jumpTourStop(tourStopIdx - 1)
                if (ev) flyToEvent(ev)
              }}
              title="Previous Tour Stop"
            >
              <ChevronLeft size={14} />
              <span>Prev</span>
            </button>
            <button
              type="button"
              className="sars-tour-banner__btn"
              onClick={() => {
                const ev = jumpTourStop(tourStopIdx + 1)
                if (ev) flyToEvent(ev)
              }}
              title="Next Tour Stop"
            >
              <span>Next</span>
              <ChevronRight size={14} />
            </button>
            <button
              type="button"
              className="sars-tour-banner__btn is-exit"
              onClick={stopTour}
              title="Exit Guided Tour"
            >
              <X size={13} />
              <span>Exit</span>
            </button>
          </div>
        </div>
      )}

      {/* RIGHT SIDEBAR: LOCAL AI ASSISTANT (LM STUDIO / QWEN2.5-3B-INSTRUCT) */}
      <AiHelpSidebar
        isOpen={isAiSidebarOpen}
        onClose={() => setIsAiSidebarOpen(false)}
        selectedPhenomenon={selectedPhenomenon}
        selectedEvent={selectedEvent}
        activeEventLayer={activeEventLayer}
        timeline={timeline}
        allEvents={allEvents}
        lmStudioBaseUrl={activeLocalModelBaseUrl}
        connectionRefreshToken={localModelRefreshToken}
        onConnectionStatusChange={setLocalModelConnected}
      />

      {/* SCIENTIFIC REPORT MODAL */}
      <ReportViewer
        event={reportModalEvent}
        onClose={closeReportModal}
        onSelectLayerOnGlobe={(layerId) => selectEventLayerById(layerId)}
      />

      {/* MULTIMEDIA / SPLIT-SCREEN COMPARATOR / VIDEO MODAL */}
      <MediaViewer
        event={mediaModalEvent}
        onClose={closeMediaModal}
        initialTab="comparator"
        onSelectLayerOnGlobe={(layerId) => selectEventLayerById(layerId)}
      />
    </div>
  )
}
