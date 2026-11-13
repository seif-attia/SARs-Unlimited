import { useEffect, useRef, useState } from 'react'
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

const SRTM_TOPOGRAPHY_URL =
  'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/SRTM_Color_Index/default/default/GoogleMapsCompatible_Level12/{z}/{y}/{x}.png'

const SHADED_RELIEF_URL =
  'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/ASTER_GDEM_Color_Shaded_Relief/default/default/GoogleMapsCompatible_Level12/{z}/{y}/{x}.jpg'

function createOpticalSatelliteProvider(cacheBust?: number): Cesium.ImageryProvider {
  const query = cacheBust ? `?t=${cacheBust}` : ''
  return new Cesium.UrlTemplateImageryProvider({
    url: `https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}${query}`,
    maximumLevel: 17,
    credit: 'Esri World Imagery'
  })
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

  // Menu & Refresh state
  const [menuOpen, setMenuOpen] = useState<boolean>(false)
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false)

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
    if (labelsLayerRef.current && layers.contains(labelsLayerRef.current)) {
      layers.raiseToTop(labelsLayerRef.current)
    }
    viewer.scene.requestRender()
  }

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
    viewer.resolutionScale = 1.0

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
    globe.maximumScreenSpaceError = 3.0
    globe.tileCacheSize = 150
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
    <div className="globe-stage">
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
          </div>

          {/* Collapsible Checkbox Menu */}
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

          {/* Streamlined Quick Bar */}
          {showQuickBar && (
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

      {/* Compact Topography (Altitude) Scale Legend — only shown when a topography overlay is active */}
      {showAltitudeLegend && (showSrtmTopography || showShadedRelief) && (
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
