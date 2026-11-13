import { useEffect, useRef, useState } from 'react'
import * as Cesium from 'cesium'
import 'cesium/Build/Cesium/Widgets/widgets.css'
import {
  Compass,
  Globe,
  Layers,
  Menu,
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

function createOpticalSatelliteProvider(cacheBust?: number): Cesium.ImageryProvider {
  const query = cacheBust ? `?t=${cacheBust}` : ''
  return new Cesium.UrlTemplateImageryProvider({
    url: `https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}${query}`,
    maximumLevel: 19,
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

  const rows = await Promise.all(
    Array.from({ length: tileCount }, (_, x) => loadEdgeRow(x))
  )

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
    maximumLevel: 18
  })
}

export function GlobeViewer(): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const viewerRef = useRef<Cesium.Viewer | null>(null)

  // ImageryLayer refs (Optical Satellite + Polar Caps are permanent; Labels can be toggled)
  const northPolarLayerRef = useRef<Cesium.ImageryLayer | null>(null)
  const southPolarLayerRef = useRef<Cesium.ImageryLayer | null>(null)
  const satelliteLayerRef = useRef<Cesium.ImageryLayer | null>(null)
  const labelsLayerRef = useRef<Cesium.ImageryLayer | null>(null)

  // Menu & Refresh state
  const [menuOpen, setMenuOpen] = useState<boolean>(false)
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false)

  // Labels are ON by default and can be toggled off
  const [showBorders, setShowBorders] = useState<boolean>(true)
  const [showAtmosphere, setShowAtmosphere] = useState<boolean>(false)
  const [autoRotate, setAutoRotate] = useState<boolean>(false)

  // On-Screen HUD Controls visibility (Menu Checkboxes)
  const [showTelemetryHud, setShowTelemetryHud] = useState<boolean>(true)
  const [showQuickBar, setShowQuickBar] = useState<boolean>(true)
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
    if (northPolarLayerRef.current && layers.contains(northPolarLayerRef.current)) {
      layers.raiseToTop(northPolarLayerRef.current)
    }
    if (southPolarLayerRef.current && layers.contains(southPolarLayerRef.current)) {
      layers.raiseToTop(southPolarLayerRef.current)
    }
    if (satelliteLayerRef.current && layers.contains(satelliteLayerRef.current)) {
      layers.raiseToTop(satelliteLayerRef.current)
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
    viewer.resolutionScale = Math.min(window.devicePixelRatio || 1, 2)

    // 1. Seamless polar cap layers to eliminate Web Mercator ±85.05° pole circles
    createPolarCapProvider('north')
      .then((provider) => {
        if (!viewer.isDestroyed()) {
          northPolarLayerRef.current = viewer.imageryLayers.addImageryProvider(provider, 0)
          enforceLayerOrder(viewer)
        }
      })
      .catch(() => {})

    createPolarCapProvider('south')
      .then((provider) => {
        if (!viewer.isDestroyed()) {
          southPolarLayerRef.current = viewer.imageryLayers.addImageryProvider(provider, 0)
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
      scene.preUpdate.removeEventListener(onPreUpdate)
      camera.changed.removeEventListener(updateTelemetry)
      handler.destroy()
      if (!viewer.isDestroyed()) {
        viewer.destroy()
      }
      viewerRef.current = null
    }
  }, [])

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
          enforceLayerOrder(viewer)
        }
      })
      .catch(() => {})

    createPolarCapProvider('south', bust)
      .then((provider) => {
        if (!viewer.isDestroyed()) {
          southPolarLayerRef.current = viewer.imageryLayers.addImageryProvider(provider, 0)
          enforceLayerOrder(viewer)
        }
      })
      .catch(() => {})

    if (satelliteLayerRef.current) {
      viewer.imageryLayers.remove(satelliteLayerRef.current, true)
      satelliteLayerRef.current = viewer.imageryLayers.addImageryProvider(
        createOpticalSatelliteProvider(bust)
      )
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
                <div className="menu-section-title">MAP LAYERS &amp; VIEW</div>

                <label className="menu-checkbox-row">
                  <input
                    type="checkbox"
                    checked={showBorders}
                    onChange={(e) => handleToggleBorders(e.target.checked)}
                  />
                  <span>Borders &amp; Place Labels</span>
                </label>

                <label className="menu-checkbox-row">
                  <input
                    type="checkbox"
                    checked={showAtmosphere}
                    onChange={(e) => handleToggleAtmosphere(e.target.checked)}
                  />
                  <span>3D Atmosphere &amp; Horizon Glow</span>
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
              <Layers size={14} className="hud-icon-cyan" />
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
