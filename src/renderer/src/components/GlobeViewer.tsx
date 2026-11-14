import { useCallback, useEffect, useRef, useState } from 'react'
import * as Cesium from 'cesium'
import 'cesium/Build/Cesium/Widgets/widgets.css'
import {
  Compass,
  Globe,
  Layers,
  Menu,
  Mountain,
  Orbit,
  RefreshCw,
  RotateCcw,
  X,
  ZoomIn,
  ZoomOut
} from 'lucide-react'
import type { AmazonEvent, AmazonPhenomenon, AmazonSarDataset, SarOverlayLayer } from '../types/sar'
import { SarStoryCard } from './SarStoryCard'
import { TimelineBar } from './TimelineBar'

export interface CameraTelemetry {
  lat: number
  lon: number
  cameraAltKm: number
  pitchDeg: number
}

const DEFAULT_ORBIT_VIEW = {
  lon: -61.2,
  lat: -5.2,
  height: 4_800_000
}

const SRTM_TOPOGRAPHY_URL =
  'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/SRTM_Color_Index/default/default/GoogleMapsCompatible_Level12/{z}/{y}/{x}.png'

const SHADED_RELIEF_URL =
  'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/ASTER_GDEM_Color_Shaded_Relief/default/default/GoogleMapsCompatible_Level12/{z}/{y}/{x}.jpg'

// Remembers the Liquid Glass preference between launches (best-effort only).
const GLASS_STORAGE_KEY = 'sars.liquid-glass'
const GLASS_TINT_KEY = 'sars.liquid-glass-tint'

// iOS 27 exposes the Liquid Glass strength as a slider from ultra clear to
// fully tinted. Map that 0..1 position onto a translucent fill alpha.
const GLASS_ALPHA_MIN = 0.06
const GLASS_ALPHA_RANGE = 0.66

// ---------------------------------------------------------------------------
// Esri answers tiles outside an area's real coverage with a flat #CCCCCC
// bitmap reading "Map data not available". Instead of painting those grey
// squares, detect them and substitute the nearest real lower-level tile with
// its quadrant scaled up - so zooming in keeps the last available imagery on
// screen and simply draws nothing when there is none.
// ---------------------------------------------------------------------------

const PLACEHOLDER_GRAY = 204
const PLACEHOLDER_TOLERANCE = 8
const PLACEHOLDER_MAX_ANCESTOR_STEPS = 8

type ImageryRequestImage = (
  x: number,
  y: number,
  level: number,
  request?: Cesium.Request
) => Promise<Cesium.ImageryTypes> | undefined

let placeholderProbeCanvas: HTMLCanvasElement | null = null

function isPlaceholderTile(image: Cesium.ImageryTypes): boolean {
  try {
    if (!placeholderProbeCanvas) {
      placeholderProbeCanvas = document.createElement('canvas')
      placeholderProbeCanvas.width = 32
      placeholderProbeCanvas.height = 32
    }
    const context = placeholderProbeCanvas.getContext('2d', { willReadFrequently: true })
    if (!context) return false
    // The placeholder's text sits in the middle, so sample the top-left corner.
    context.clearRect(0, 0, 32, 32)
    context.drawImage(image as CanvasImageSource, 0, 0, 32, 32, 0, 0, 32, 32)
    const { data } = context.getImageData(0, 0, 32, 32)
    for (let i = 0; i < data.length; i += 4) {
      if (
        Math.abs(data[i] - PLACEHOLDER_GRAY) > PLACEHOLDER_TOLERANCE ||
        Math.abs(data[i + 1] - PLACEHOLDER_GRAY) > PLACEHOLDER_TOLERANCE ||
        Math.abs(data[i + 2] - PLACEHOLDER_GRAY) > PLACEHOLDER_TOLERANCE
      ) {
        return false
      }
    }
    return true
  } catch {
    // Tainted canvas or unsupported source: treat it as real imagery.
    return false
  }
}

function cropAncestorQuadrant(
  ancestor: Cesium.ImageryTypes,
  x: number,
  y: number,
  steps: number
): HTMLCanvasElement | null {
  const source = ancestor as CanvasImageSource & { width?: number; height?: number }
  const width = source.width || 256
  const height = source.height || 256
  const span = 1 << steps
  const cropWidth = width / span
  const cropHeight = height / span
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) return null
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  // Cesium loads imagery as bitmaps created with imageOrientation "flipY", so
  // row 0 is the southern edge and the quadrant index is mirrored vertically.
  context.drawImage(
    source,
    (x % span) * cropWidth,
    (span - 1 - (y % span)) * cropHeight,
    cropWidth,
    cropHeight,
    0,
    0,
    width,
    height
  )
  return canvas
}

function blankTile(): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  return canvas
}

// This provider hands Cesium ImageBitmaps. Returning a canvas instead would
// take a different upload path (WebGL honours UNPACK_FLIP_Y_WEBGL for DOM
// sources but ignores it for ImageBitmap), which renders the tile vertically
// mirrored. Keep the source type identical so substituted tiles orient exactly
// like the originals.
async function asImagerySource(
  canvas: HTMLCanvasElement,
  preferBitmap: boolean
): Promise<Cesium.ImageryTypes> {
  if (preferBitmap && typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(canvas)
    } catch {
      // Fall through and hand back the canvas.
    }
  }
  return canvas
}

function withParentTileFallback(requestImage: ImageryRequestImage): ImageryRequestImage {
  return (x, y, level, request) => {
    const pending = requestImage(x, y, level, request)
    if (!pending) return pending
    return pending.then(async (image) => {
      if (!isPlaceholderTile(image)) return image

      const preferBitmap = typeof ImageBitmap !== 'undefined' && image instanceof ImageBitmap

      for (let steps = 1; steps <= PLACEHOLDER_MAX_ANCESTOR_STEPS; steps++) {
        const ancestorLevel = level - steps
        if (ancestorLevel < 0) break
        let ancestor: Cesium.ImageryTypes | undefined
        try {
          // Deliberately no request object: the ancestor is a separate,
          // browser-cached fetch and must not share this tile's cancellation.
          ancestor = await requestImage(x >> steps, y >> steps, ancestorLevel)
        } catch {
          continue
        }
        if (!ancestor) continue
        if (isPlaceholderTile(ancestor)) continue
        const patch = cropAncestorQuadrant(ancestor, x, y, steps)
        if (patch) return asImagerySource(patch, preferBitmap)
      }
      // Nothing real anywhere beneath: draw nothing at all.
      return asImagerySource(blankTile(), preferBitmap)
    })
  }
}

function createOpticalSatelliteProvider(cacheBust?: number): Cesium.ImageryProvider {
  const query = cacheBust ? `?t=${cacheBust}` : ''
  const provider = new Cesium.UrlTemplateImageryProvider({
    url: `https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}${query}`,
    // Deep levels hold real detail in cities; areas without coverage are
    // filtered out per tile by withParentTileFallback instead of being capped.
    maximumLevel: 20,
    credit: 'Esri World Imagery'
  })
  const requestImage = provider.requestImage.bind(provider) as ImageryRequestImage
  provider.requestImage = withParentTileFallback(requestImage)
  return provider
}

function createSrtmTopographyProvider(cacheBust?: number): Cesium.ImageryProvider {
  const query = cacheBust ? `?t=${cacheBust}` : ''
  return new Cesium.UrlTemplateImageryProvider({
    url: `${SRTM_TOPOGRAPHY_URL}${query}`,
    maximumLevel: 11,
    credit: 'NASA SRTM Radar Topography'
  })
}

function createShadedReliefProvider(cacheBust?: number): Cesium.ImageryProvider {
  const query = cacheBust ? `?t=${cacheBust}` : ''
  return new Cesium.UrlTemplateImageryProvider({
    url: `${SHADED_RELIEF_URL}${query}`,
    maximumLevel: 11,
    credit: 'NASA ASTER GDEM Shaded Relief'
  })
}

function createBordersProvider(cacheBust?: number): Cesium.ImageryProvider {
  const query = cacheBust ? `?t=${cacheBust}` : ''
  return new Cesium.UrlTemplateImageryProvider({
    url: `https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}${query}`,
    maximumLevel: 16
  })
}

export function GlobeViewer(): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const viewerRef = useRef<Cesium.Viewer | null>(null)

  // Lazy-loaded ImageryLayer refs (null when unchecked -> 0 network/VRAM usage)
  const satelliteLayerRef = useRef<Cesium.ImageryLayer | null>(null)
  const srtmLayerRef = useRef<Cesium.ImageryLayer | null>(null)
  const reliefLayerRef = useRef<Cesium.ImageryLayer | null>(null)
  const labelsLayerRef = useRef<Cesium.ImageryLayer | null>(null)
  const sarOverlayLayerRef = useRef<Cesium.ImageryLayer | null>(null)
  const sarRequestSeqRef = useRef<number>(0)

  // Dancing with the SARs — Amazon 2020-2026 Offline Dataset & Story State
  const [sarDataset, setSarDataset] = useState<AmazonSarDataset | null>(null)
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number>(81) // 2026-10
  const [selectionMode, setSelectionMode] = useState<'phenomenon' | 'event' | null>(null)
  const [activePhenomenonId, setActivePhenomenonId] = useState<string | null>(null)
  const [activeEventId, setActiveEventId] = useState<string | null>(null)
  const [activeSarLayer, setActiveSarLayer] = useState<SarOverlayLayer | null>(null)
  const [overlayOpacity, setOverlayOpacity] = useState<number>(0.85)
  const overlayOpacityRef = useRef<number>(0.85)
  const selectEntityCallbackRef = useRef<(entityId: string) => void>(() => {})

  // Menu & Refresh state
  const [menuOpen, setMenuOpen] = useState<boolean>(false)
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false)

  // iOS Liquid Glass rendering. Backdrop blur has to read back the WebGL
  // canvas every time the camera moves, so it stays switchable for weak GPUs.
  const [glassEffects, setGlassEffects] = useState<boolean>(() => {
    try {
      return window.localStorage.getItem(GLASS_STORAGE_KEY) !== 'off'
    } catch {
      return true
    }
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(GLASS_STORAGE_KEY, glassEffects ? 'on' : 'off')
    } catch {
      // Storage unavailable (e.g. restricted file:// origin) — in-memory only.
    }
  }, [glassEffects])

  // 0 = Ultra Clear, 1 = Fully Tinted (iOS 27 transparency slider)
  const [glassTint, setGlassTint] = useState<number>(() => {
    try {
      const stored = window.localStorage.getItem(GLASS_TINT_KEY)
      const parsed = stored === null ? NaN : Number(stored)
      return Number.isFinite(parsed) ? Math.min(1, Math.max(0, parsed)) : 0.2
    } catch {
      return 0.2
    }
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(GLASS_TINT_KEY, String(glassTint))
    } catch {
      // Storage unavailable — in-memory only.
    }
  }, [glassTint])

  const glassAlpha = GLASS_ALPHA_MIN + glassTint * GLASS_ALPHA_RANGE
  const glassTintLabel = glassTint <= 0.02 ? 'Ultra Clear' : glassTint >= 0.98 ? 'Tinted' : 'Clear'

  // Lean default state: Only Optical Satellite is active at startup.
  const [showSatellite, setShowSatellite] = useState<boolean>(true)
  const [showSrtmTopography, setShowSrtmTopography] = useState<boolean>(false)
  const [showShadedRelief, setShowShadedRelief] = useState<boolean>(false)
  const [showBorders, setShowBorders] = useState<boolean>(false)
  const [showAtmosphere, setShowAtmosphere] = useState<boolean>(false)
  const [autoRotate, setAutoRotate] = useState<boolean>(false)

  // On-Screen HUD Controls visibility (Menu Checkboxes)
  const [showTelemetryHud, setShowTelemetryHud] = useState<boolean>(true)
  const [showQuickBar, setShowQuickBar] = useState<boolean>(true)
  const [showAltitudeLegend, setShowAltitudeLegend] = useState<boolean>(true)
  const [showNavButtons, setShowNavButtons] = useState<boolean>(true)
  const [showControlsHint, setShowControlsHint] = useState<boolean>(true)

  const autoRotateRef = useRef<boolean>(false)
  const userInteractingRef = useRef<boolean>(false)

  const [telemetry, setTelemetry] = useState<CameraTelemetry>({
    lat: DEFAULT_ORBIT_VIEW.lat,
    lon: DEFAULT_ORBIT_VIEW.lon,
    cameraAltKm: Math.round(DEFAULT_ORBIT_VIEW.height / 1000),
    pitchDeg: -90
  })

  useEffect(() => {
    autoRotateRef.current = autoRotate
    const viewer = viewerRef.current
    if (viewer && !viewer.isDestroyed()) {
      viewer.scene.requestRenderMode = !autoRotate
      viewer.scene.requestRender()
    }
  }, [autoRotate])

  // Ensure proper layer stacking order without re-fetching existing layers
  const enforceLayerOrder = (viewer: Cesium.Viewer): void => {
    if (viewer.isDestroyed()) return
    const layers = viewer.imageryLayers
    if (satelliteLayerRef.current && layers.contains(satelliteLayerRef.current)) {
      layers.raiseToTop(satelliteLayerRef.current)
    }
    if (reliefLayerRef.current && layers.contains(reliefLayerRef.current)) {
      layers.raiseToTop(reliefLayerRef.current)
    }
    if (srtmLayerRef.current && layers.contains(srtmLayerRef.current)) {
      layers.raiseToTop(srtmLayerRef.current)
    }
    if (sarOverlayLayerRef.current && layers.contains(sarOverlayLayerRef.current)) {
      layers.raiseToTop(sarOverlayLayerRef.current)
    }
    if (labelsLayerRef.current && layers.contains(labelsLayerRef.current)) {
      layers.raiseToTop(labelsLayerRef.current)
    }
    viewer.scene.requestRender()
  }

  // Fly smoothly to an AOI bbox on the 3D globe
  const flyToBbox = useCallback((bbox: [number, number, number, number]): void => {
    const viewer = viewerRef.current
    if (!viewer || viewer.isDestroyed()) return
    setAutoRotate(false)
    const [west, south, east, north] = bbox
    const padLon = Math.max(0.18, (east - west) * 0.45)
    const padLat = Math.max(0.18, (north - south) * 0.45)
    viewer.camera.flyTo({
      destination: Cesium.Rectangle.fromDegrees(
        west - padLon,
        south - padLat,
        east + padLon,
        north + padLat
      ),
      duration: 1.2
    })
  }, [])

  const handleSelectPhenomenon = useCallback(
    (phen: AmazonPhenomenon): void => {
      setSelectionMode('phenomenon')
      setActivePhenomenonId(phen.id)
      setActiveEventId(null)
      const def = phen.layers.find((l) => l.id === phen.default_layer_id) ?? phen.layers[0] ?? null
      setActiveSarLayer(def)
      if (sarDataset) {
        // Jump timeline to the peak month in 2025/2026 matching this seasonal phenomenon
        const targetPeak = phen.peak_months[0] ?? phen.months[0] ?? 6
        const targetYm =
          targetPeak === 12 ? '2025-12' : `2025-${String(targetPeak).padStart(2, '0')}`
        const mIdx = sarDataset.timeline.months.findIndex((m) => m.month === targetYm)
        if (mIdx >= 0) setSelectedMonthIndex(mIdx)
      }
      flyToBbox(def?.bbox ?? phen.bbox)
    },
    [flyToBbox, sarDataset]
  )

  const handleSelectEvent = useCallback(
    (evt: AmazonEvent): void => {
      setSelectionMode('event')
      setActiveEventId(evt.id)
      setActivePhenomenonId(null)
      const def = evt.layers.find((l) => l.id === evt.default_layer_id) ?? evt.layers[0] ?? null
      setActiveSarLayer(def)
      if (sarDataset) {
        const mIdx = sarDataset.timeline.months.findIndex((m) => m.month === evt.timeline_month)
        if (mIdx >= 0) setSelectedMonthIndex(mIdx)
      }
      flyToBbox(def?.bbox ?? evt.bbox)
    },
    [flyToBbox, sarDataset]
  )

  const handleSelectMonthIndex = useCallback(
    (idx: number): void => {
      setSelectedMonthIndex(idx)
      if (!sarDataset) return
      const pt = sarDataset.timeline.months[idx]
      if (!pt) return
      // In generic browsing mode, follow seasonal phenomenon transitions cleanly if user hasn't locked an event
      if (selectionMode !== 'event') {
        if (pt.event_id) {
          const evt = sarDataset.events.find((e) => e.id === pt.event_id)
          if (evt) {
            handleSelectEvent(evt)
            return
          }
        }
        const matchPhenId = pt.active_phenomena[0]
        if (matchPhenId && selectionMode === 'phenomenon' && activePhenomenonId !== matchPhenId) {
          const phen = sarDataset.phenomena.find((p) => p.id === matchPhenId)
          if (phen) {
            setActivePhenomenonId(phen.id)
            const def =
              phen.layers.find((l) => l.id === phen.default_layer_id) ?? phen.layers[0] ?? null
            setActiveSarLayer(def)
          }
        }
      }
    },
    [activePhenomenonId, handleSelectEvent, sarDataset, selectionMode]
  )

  const handleClearInspector = useCallback((): void => {
    setSelectionMode(null)
    setActivePhenomenonId(null)
    setActiveEventId(null)
    setActiveSarLayer(null)
  }, [])

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
      // Cesium ignores window.devicePixelRatio by default and draws the globe
      // at CSS resolution, which Windows then upscales and softens. Render at
      // native pixels instead so imagery stays sharp on scaled displays.
      useBrowserRecommendedResolution: false,
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
    // resolutionScale multiplies the device pixel ratio once the browser
    // resolution is bypassed; aim for native pixels, capped at 2x.
    const targetPixelRatio = Math.min(Math.max(window.devicePixelRatio, 1), 2)
    viewer.resolutionScale = targetPixelRatio / window.devicePixelRatio

    // 1. Offline low-res NaturalEarthII at index 0 (instant zero-network base texture)
    Cesium.TileMapServiceImageryProvider.fromUrl(
      Cesium.buildModuleUrl('Assets/Textures/NaturalEarthII')
    )
      .then((naturalEarthProvider) => {
        if (!viewer.isDestroyed()) {
          viewer.imageryLayers.addImageryProvider(naturalEarthProvider, 0)
          viewer.scene.requestRender()
        }
      })
      .catch(() => {
        // Ignore fallback error
      })

    // 2. Load ONLY the single primary Satellite layer at startup
    const satLayer = viewer.imageryLayers.addImageryProvider(createOpticalSatelliteProvider())
    satelliteLayerRef.current = satLayer

    // Configure lightweight GPU & Tile Quadtree settings
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

    globe.baseColor = Cesium.Color.fromCssColorString('#071226')
    globe.enableLighting = false
    globe.showGroundAtmosphere = false
    // Cesium's default 2.0 keeps tiles sharp when zoomed in; the previous 3.0
    // traded that detail away. A bigger cache holds the extra tiles while panning.
    globe.maximumScreenSpaceError = 2.0
    globe.tileCacheSize = 300
    globe.preloadAncestors = false
    globe.preloadSiblings = false
    globe.loadingDescendantLimit = 4

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

    handler.setInputAction((movement: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
      const picked = scene.pick(movement.position)
      if (Cesium.defined(picked) && picked.id && typeof picked.id.id === 'string') {
        selectEntityCallbackRef.current(picked.id.id)
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

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
      scene.preUpdate.removeEventListener(onPreUpdate)
      camera.changed.removeEventListener(updateTelemetry)
      handler.destroy()
      if (!viewer.isDestroyed()) {
        viewer.destroy()
      }
      viewerRef.current = null
    }
  }, [])

  // Load offline Amazon SAR 2020-2026 Atlas once via Electron IPC
  useEffect(() => {
    let active = true
    window.api
      ?.getDataset?.()
      .then((raw) => {
        if (!active) return
        setSarDataset(raw as AmazonSarDataset)
      })
      .catch((err) => {
        console.error('Failed to load offline SAR dataset:', err)
      })
    return () => {
      active = false
    }
  }, [])

  // Sync clickable 3D markers for the 4 Anchor Events + Madeira Porto Velho on the globe
  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer || viewer.isDestroyed() || !sarDataset) return

    selectEntityCallbackRef.current = (entityId: string) => {
      if (entityId.startsWith('evt-pin:')) {
        const eid = entityId.slice('evt-pin:'.length)
        const evt = sarDataset.events.find((e) => e.id === eid)
        if (evt) handleSelectEvent(evt)
      } else if (entityId === 'phen-pin:seasonal_flood') {
        const phen = sarDataset.phenomena.find((p) => p.id === 'seasonal_flood')
        if (phen) handleSelectPhenomenon(phen)
      }
    }

    viewer.entities.removeAll()

    for (const evt of sarDataset.events) {
      const col = Cesium.Color.fromCssColorString(evt.color)
      // Offset Manaus Nov 2026 NISAR pin slightly northeast so both Manaus Jun 2021 and NISAR 2026 dots are clickable
      const lonOffset = evt.id === 'nisar_lband_2026' ? 0.42 : 0
      const latOffset = evt.id === 'nisar_lband_2026' ? 0.28 : 0
      viewer.entities.add({
        id: `evt-pin:${evt.id}`,
        position: Cesium.Cartesian3.fromDegrees(
          evt.center[0] + lonOffset,
          evt.center[1] + latOffset
        ),
        point: {
          pixelSize: activeEventId === evt.id ? 14 : 10,
          color: col,
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2,
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        },
        label: {
          text: `${evt.timing} · ${evt.name}`,
          font: '600 11px Inter, system-ui, sans-serif',
          fillColor: Cesium.Color.WHITE,
          showBackground: true,
          backgroundColor: Cesium.Color.fromCssColorString('rgba(9, 15, 27, 0.82)'),
          backgroundPadding: new Cesium.Cartesian2(7, 4),
          pixelOffset: new Cesium.Cartesian2(0, -18),
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        }
      })
    }

    // Add Madeira River (Porto Velho) marker for Seasonal Flood / Low River Levels
    const madeira = sarDataset.regions['porto_velho']
    if (madeira) {
      viewer.entities.add({
        id: 'phen-pin:seasonal_flood',
        position: Cesium.Cartesian3.fromDegrees(madeira.center[0], madeira.center[1]),
        point: {
          pixelSize: 9,
          color: Cesium.Color.fromCssColorString('#38BDF8'),
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2,
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        },
        label: {
          text: 'Porto Velho · Madeira Flood (Mar–Apr)',
          font: '600 11px Inter, system-ui, sans-serif',
          fillColor: Cesium.Color.WHITE,
          showBackground: true,
          backgroundColor: Cesium.Color.fromCssColorString('rgba(9, 15, 27, 0.82)'),
          backgroundPadding: new Cesium.Cartesian2(7, 4),
          pixelOffset: new Cesium.Cartesian2(0, -18),
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        }
      })
    }

    viewer.scene.requestRender()
  }, [activeEventId, handleSelectEvent, handleSelectPhenomenon, sarDataset])

  // Drape the active georeferenced 256x256 SAR raster overlay onto the 3D globe
  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer || viewer.isDestroyed()) return

    if (sarOverlayLayerRef.current) {
      viewer.imageryLayers.remove(sarOverlayLayerRef.current, true)
      sarOverlayLayerRef.current = null
      viewer.scene.requestRender()
    }

    if (!activeSarLayer) return

    const reqId = ++sarRequestSeqRef.current
    const [west, south, east, north] = activeSarLayer.bbox

    window.api
      ?.getAssetDataUrl(activeSarLayer.asset_path)
      .then((dataUrl) =>
        Cesium.SingleTileImageryProvider.fromUrl(dataUrl, {
          rectangle: Cesium.Rectangle.fromDegrees(west, south, east, north)
        })
      )
      .then((provider) => {
        if (viewer.isDestroyed() || reqId !== sarRequestSeqRef.current) return
        const layer = viewer.imageryLayers.addImageryProvider(provider)
        layer.alpha = overlayOpacityRef.current
        sarOverlayLayerRef.current = layer
        enforceLayerOrder(viewer)
      })
      .catch((err) => {
        console.error('Failed to drape SAR overlay:', err)
      })
  }, [activeSarLayer])

  // Sync overlay alpha slider without recreating imagery provider
  useEffect(() => {
    overlayOpacityRef.current = overlayOpacity
    const viewer = viewerRef.current
    const layer = sarOverlayLayerRef.current
    if (viewer && !viewer.isDestroyed() && layer) {
      layer.alpha = overlayOpacity
      viewer.scene.requestRender()
    }
  }, [overlayOpacity])

  // Lazy-toggle Optical Satellite Imagery
  const handleToggleSatellite = (checked?: boolean): void => {
    const viewer = viewerRef.current
    if (!viewer || viewer.isDestroyed()) return
    const next = typeof checked === 'boolean' ? checked : !showSatellite
    setShowSatellite(next)

    if (next && !satelliteLayerRef.current) {
      satelliteLayerRef.current = viewer.imageryLayers.addImageryProvider(
        createOpticalSatelliteProvider()
      )
      enforceLayerOrder(viewer)
    } else if (!next && satelliteLayerRef.current) {
      viewer.imageryLayers.remove(satelliteLayerRef.current, true)
      satelliteLayerRef.current = null
      viewer.scene.requestRender()
    }
  }

  // Lazy-toggle NASA SRTM Radar Topography (only loads tiles when checked)
  const handleToggleSrtmTopography = (checked?: boolean): void => {
    const viewer = viewerRef.current
    if (!viewer || viewer.isDestroyed()) return
    const next = typeof checked === 'boolean' ? checked : !showSrtmTopography
    setShowSrtmTopography(next)

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

  // Lazy-toggle Topographic Shaded Relief (only loads tiles when checked)
  const handleToggleShadedRelief = (checked?: boolean): void => {
    const viewer = viewerRef.current
    if (!viewer || viewer.isDestroyed()) return
    const next = typeof checked === 'boolean' ? checked : !showShadedRelief
    setShowShadedRelief(next)

    if (next && !reliefLayerRef.current) {
      const layer = viewer.imageryLayers.addImageryProvider(createShadedReliefProvider())
      layer.alpha = 0.65
      reliefLayerRef.current = layer
      enforceLayerOrder(viewer)
    } else if (!next && reliefLayerRef.current) {
      viewer.imageryLayers.remove(reliefLayerRef.current, true)
      reliefLayerRef.current = null
      viewer.scene.requestRender()
    }
  }

  // Lazy-toggle Borders & Place Labels (only loads tiles when checked)
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
  const handleToggleAtmosphere = (checked: boolean): void => {
    setShowAtmosphere(checked)
    const viewer = viewerRef.current
    if (!viewer || viewer.isDestroyed()) return
    viewer.scene.globe.showGroundAtmosphere = checked
    if (viewer.scene.skyAtmosphere) {
      viewer.scene.skyAtmosphere.show = checked
    }
    viewer.scene.fog.enabled = checked
    viewer.scene.requestRender()
  }

  // Refresh Footage: Only refreshes whichever layers are currently enabled
  const handleRefreshFootage = (): void => {
    const viewer = viewerRef.current
    if (!viewer || viewer.isDestroyed()) return

    setIsRefreshing(true)
    const bust = Date.now()

    if (satelliteLayerRef.current) {
      viewer.imageryLayers.remove(satelliteLayerRef.current, true)
      satelliteLayerRef.current = viewer.imageryLayers.addImageryProvider(
        createOpticalSatelliteProvider(bust)
      )
    }

    if (reliefLayerRef.current) {
      viewer.imageryLayers.remove(reliefLayerRef.current, true)
      const freshRelief = viewer.imageryLayers.addImageryProvider(createShadedReliefProvider(bust))
      freshRelief.alpha = 0.65
      reliefLayerRef.current = freshRelief
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

  return (
    <div
      className={`globe-stage${glassEffects ? '' : ' glass-lite'}`}
      style={{ ['--glass-alpha-user' as string]: String(glassAlpha) } as React.CSSProperties}
    >
      {/* Fullscreen 3D Cesium Canvas */}
      <div ref={containerRef} className="cesium-Viewport" />

      {/* Top HUD Header */}
      <header className="hud-header">
        <div className="hud-left-group">
          <div className="hud-top-row">
            <div className="hud-brand">
              <div className="hud-badge">
                <Globe size={18} className="hud-icon-cyan" />
                <span>SARS UNLIMITED</span>
              </div>
              <span className="hud-subtitle">3D Earth SAR & Topography Explorer · CesiumJS</span>
            </div>

            {/* Menu & Refresh Footage Buttons */}
            <div className="hud-action-buttons">
              <button
                type="button"
                className={`hud-action-btn ${menuOpen ? 'active' : ''}`}
                onClick={() => setMenuOpen((prev) => !prev)}
                title="Open Controls & Topography Menu"
              >
                {menuOpen ? <X size={16} /> : <Menu size={16} />}
                <span>MENU</span>
              </button>

              <button
                type="button"
                className={`hud-action-btn ${isRefreshing ? 'active' : ''}`}
                onClick={handleRefreshFootage}
                title="Refresh Active Layers"
              >
                <RefreshCw size={16} className={isRefreshing ? 'spin-icon' : ''} />
                <span>REFRESH FOOTAGE</span>
              </button>
            </div>

            {/* Collapsible Checkbox Menu — anchored popover under the header row */}
            {menuOpen && (
              <div className="hud-menu-panel">
                <div className="menu-section">
                  <div className="menu-section-title">TOPOGRAPHY (ALTITUDE) & BASE LAYERS</div>

                  <label className="menu-checkbox-row">
                    <input
                      type="checkbox"
                      checked={showSrtmTopography}
                      onChange={(e) => handleToggleSrtmTopography(e.target.checked)}
                    />
                    <span>SRTM Radar Topography (Altitude Heatmap)</span>
                  </label>

                  <label className="menu-checkbox-row">
                    <input
                      type="checkbox"
                      checked={showShadedRelief}
                      onChange={(e) => handleToggleShadedRelief(e.target.checked)}
                    />
                    <span>ASTER Topographic Shaded Relief</span>
                  </label>

                  <label className="menu-checkbox-row">
                    <input
                      type="checkbox"
                      checked={showSatellite}
                      onChange={(e) => handleToggleSatellite(e.target.checked)}
                    />
                    <span>Optical Satellite Basemap</span>
                  </label>

                  <label className="menu-checkbox-row">
                    <input
                      type="checkbox"
                      checked={showBorders}
                      onChange={(e) => handleToggleBorders(e.target.checked)}
                    />
                    <span>Borders & Place Labels</span>
                  </label>

                  <label className="menu-checkbox-row">
                    <input
                      type="checkbox"
                      checked={showAtmosphere}
                      onChange={(e) => handleToggleAtmosphere(e.target.checked)}
                    />
                    <span>3D Atmosphere & Horizon Glow</span>
                  </label>

                  <label className="menu-checkbox-row">
                    <input
                      type="checkbox"
                      checked={autoRotate}
                      onChange={(e) => setAutoRotate(e.target.checked)}
                    />
                    <span>Orbital Auto-Rotation</span>
                  </label>
                </div>

                <div className="menu-divider" />

                <div className="menu-section">
                  <div className="menu-section-title">ON-SCREEN HUD CONTROLS</div>

                  <label className="menu-checkbox-row">
                    <input
                      type="checkbox"
                      checked={showTelemetryHud}
                      onChange={(e) => setShowTelemetryHud(e.target.checked)}
                    />
                    <span>Live Telemetry Bar (Lat / Lon / Altitude)</span>
                  </label>

                  <label className="menu-checkbox-row">
                    <input
                      type="checkbox"
                      checked={showQuickBar}
                      onChange={(e) => setShowQuickBar(e.target.checked)}
                    />
                    <span>Quick Layer Switcher Bar</span>
                  </label>

                  <label className="menu-checkbox-row">
                    <input
                      type="checkbox"
                      checked={showAltitudeLegend}
                      onChange={(e) => setShowAltitudeLegend(e.target.checked)}
                    />
                    <span>Topography Altitude Legend</span>
                  </label>

                  <label className="menu-checkbox-row">
                    <input
                      type="checkbox"
                      checked={showNavButtons}
                      onChange={(e) => setShowNavButtons(e.target.checked)}
                    />
                    <span>Camera Navigation Buttons (Bottom-Right)</span>
                  </label>

                  <label className="menu-checkbox-row">
                    <input
                      type="checkbox"
                      checked={showControlsHint}
                      onChange={(e) => setShowControlsHint(e.target.checked)}
                    />
                    <span>Mouse Navigation Hint Bar (Bottom-Left)</span>
                  </label>
                </div>

                <div className="menu-divider" />

                <div className="menu-section">
                  <div className="menu-section-title">APPEARANCE</div>

                  <div className="menu-slider-row">
                    <div className="menu-slider-head">
                      <span>Liquid Glass</span>
                      <span className="menu-slider-value">{glassTintLabel}</span>
                    </div>
                    <input
                      type="range"
                      className="glass-slider"
                      min={0}
                      max={1}
                      step={0.01}
                      value={glassTint}
                      onChange={(e) => setGlassTint(Number(e.target.value))}
                      style={
                        { ['--glass-fill' as string]: `${glassTint * 100}%` } as React.CSSProperties
                      }
                      aria-label="Liquid Glass transparency from ultra clear to fully tinted"
                    />
                  </div>

                  <label className="menu-checkbox-row">
                    <input
                      type="checkbox"
                      checked={glassEffects}
                      onChange={(e) => setGlassEffects(e.target.checked)}
                    />
                    <span>Backdrop Blur</span>
                  </label>
                </div>

                <div className="menu-divider" />

                <div className="menu-actions-row">
                  <button type="button" className="menu-action-btn" onClick={handleRefreshFootage}>
                    <RefreshCw size={14} className={isRefreshing ? 'spin-icon' : ''} />
                    <span>Refresh Active Layers</span>
                  </button>
                  <button type="button" className="menu-action-btn" onClick={handleResetOrbit}>
                    <RotateCcw size={14} />
                    <span>Reset Camera to Orbit</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Streamlined Quick Bar (the menu popover already exposes these toggles) */}
          {showQuickBar && !menuOpen && (
            <div className="hud-basemap-bar">
              <Mountain size={14} className="hud-icon-cyan" />
              <button
                type="button"
                className={`basemap-chip ${showSrtmTopography ? 'active' : ''}`}
                onClick={() => handleToggleSrtmTopography()}
                title="Lazy-load NASA SRTM Radar Topography (Color Altitude Index)"
              >
                SRTM Topography
              </button>
              <button
                type="button"
                className={`basemap-chip ${showShadedRelief ? 'active' : ''}`}
                onClick={() => handleToggleShadedRelief()}
                title="Lazy-load ASTER Topographic Shaded Relief"
              >
                Shaded Relief
              </button>
              <span className="chip-divider" />
              <Layers size={14} className="hud-icon-cyan" />
              <button
                type="button"
                className={`basemap-chip ${showSatellite ? 'active' : ''}`}
                onClick={() => handleToggleSatellite()}
              >
                Satellite
              </button>
              <button
                type="button"
                className={`basemap-chip ${showBorders ? 'active' : ''}`}
                onClick={() => handleToggleBorders()}
              >
                Labels
              </button>
            </div>
          )}
        </div>

        {/* Live Telemetry Bar */}
        {showTelemetryHud && (
          <div className="hud-telemetry">
            <div className="telemetry-item">
              <span className="telemetry-label">LAT</span>
              <span className="telemetry-value">{telemetry.lat.toFixed(3)}°</span>
            </div>
            <div className="telemetry-item">
              <span className="telemetry-label">LON</span>
              <span className="telemetry-value">{telemetry.lon.toFixed(3)}°</span>
            </div>
            <div className="telemetry-item">
              <span className="telemetry-label">ALTITUDE</span>
              <span className="telemetry-value">
                {telemetry.cameraAltKm >= 100
                  ? `${Math.round(telemetry.cameraAltKm).toLocaleString()} km`
                  : `${telemetry.cameraAltKm.toFixed(1)} km`}
              </span>
            </div>
            <div className="telemetry-item">
              <span className="telemetry-label">PITCH</span>
              <span className="telemetry-value">{telemetry.pitchDeg}°</span>
            </div>
          </div>
        )}
      </header>

      {/* Dancing with the SARs — Top Timeline Dock (Generic Phenomena + Event Dots) */}
      {sarDataset && (
        <TimelineBar
          months={sarDataset.timeline.months}
          phenomena={sarDataset.phenomena}
          events={sarDataset.events}
          selectedMonthIndex={selectedMonthIndex}
          activePhenomenonId={activePhenomenonId}
          activeEventId={activeEventId}
          onSelectMonthIndex={handleSelectMonthIndex}
          onSelectPhenomenon={handleSelectPhenomenon}
          onSelectEvent={handleSelectEvent}
          onFlyAmazonOverview={() => flyToBbox([-70.0, -12.0, -52.0, 1.5])}
        />
      )}

      {/* Right-Side Interactive SAR Physics & Story Inspector Card */}
      {sarDataset && selectionMode && (
        <SarStoryCard
          mode={selectionMode}
          phenomenon={
            activePhenomenonId
              ? (sarDataset.phenomena.find((p) => p.id === activePhenomenonId) ?? null)
              : null
          }
          event={
            activeEventId ? (sarDataset.events.find((e) => e.id === activeEventId) ?? null) : null
          }
          activeLayer={activeSarLayer}
          overlayOpacity={overlayOpacity}
          onSelectLayer={(layer) => {
            setActiveSarLayer(layer)
            flyToBbox(layer.bbox)
          }}
          onChangeOpacity={setOverlayOpacity}
          onClose={handleClearInspector}
        />
      )}

      {/* Compact Topography (Altitude) Scale Legend — only shown when a topography overlay is active */}
      {showAltitudeLegend && (showSrtmTopography || showShadedRelief) && !menuOpen && (
        <aside className="hud-legend-card">
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

      {/* Bottom-Right Navigation Controls */}
      {showNavButtons && (
        <div className="hud-nav-controls">
          <button
            type="button"
            className={`nav-btn ${isRefreshing ? 'active' : ''}`}
            onClick={handleRefreshFootage}
            title="Refresh Active Layers"
          >
            <RefreshCw size={18} className={isRefreshing ? 'spin-icon' : ''} />
          </button>
          <button
            type="button"
            className={`nav-btn ${autoRotate ? 'active' : ''}`}
            onClick={() => setAutoRotate((prev) => !prev)}
            title="Toggle Orbital Auto-Rotation"
          >
            <Orbit size={18} />
          </button>
          <button type="button" className="nav-btn" onClick={handleZoomIn} title="Zoom In">
            <ZoomIn size={18} />
          </button>
          <button type="button" className="nav-btn" onClick={handleZoomOut} title="Zoom Out">
            <ZoomOut size={18} />
          </button>
          <button
            type="button"
            className="nav-btn"
            onClick={handleResetNorth}
            title="Align Heading North"
          >
            <Compass size={18} />
          </button>
          <button
            type="button"
            className="nav-btn"
            onClick={handleResetOrbit}
            title="Reset to Orbital View"
          >
            <RotateCcw size={18} />
          </button>
        </div>
      )}

      {/* Bottom-Left Navigation Hint */}
      {showControlsHint && (
        <div className="hud-controls-hint">
          <span>Left-Drag: Rotate / Pan</span>
          <span>·</span>
          <span>Scroll / Right-Drag: Zoom</span>
          <span>·</span>
          <span>Middle-Drag or Ctrl+Drag: 3D Tilt</span>
        </div>
      )}
    </div>
  )
}
