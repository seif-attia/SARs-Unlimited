import { useEffect, useRef, useState } from 'react'
import * as Cesium from 'cesium'
import 'cesium/Build/Cesium/Widgets/widgets.css'
import { Compass, Globe, RotateCcw, Orbit, ZoomIn, ZoomOut } from 'lucide-react'

export interface CameraTelemetry {
  lat: number
  lon: number
  altitudeKm: number
  pitchDeg: number
  headingDeg: number
}

const DEFAULT_ORBIT_VIEW = {
  lon: 30.8, // Centered over Egypt / Nile Delta & East Mediterranean orbit
  lat: 26.5,
  height: 15_500_000 // 15,500 km orbital altitude
}

export function GlobeViewer(): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const viewerRef = useRef<Cesium.Viewer | null>(null)
  const [autoRotate, setAutoRotate] = useState<boolean>(true)
  const autoRotateRef = useRef<boolean>(true)
  const userInteractingRef = useRef<boolean>(false)

  const [telemetry, setTelemetry] = useState<CameraTelemetry>({
    lat: DEFAULT_ORBIT_VIEW.lat,
    lon: DEFAULT_ORBIT_VIEW.lon,
    altitudeKm: Math.round(DEFAULT_ORBIT_VIEW.height / 1000),
    pitchDeg: -90,
    headingDeg: 0
  })

  useEffect(() => {
    autoRotateRef.current = autoRotate
  }, [autoRotate])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Initialize Cesium Viewer with no default clutter widgets and no Ion token required
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
      creditContainer: document.createElement('div'), // Hide bottom credit bar clutter
      shouldAnimate: true,
      contextOptions: {
        webgl: {
          alpha: false,
          antialias: true,
          powerPreference: 'high-performance'
        }
      }
    })

    viewerRef.current = viewer

    // Load offline fallback globe texture immediately, then layer high-res Esri World Satellite Imagery
    Cesium.TileMapServiceImageryProvider.fromUrl(
      Cesium.buildModuleUrl('Assets/Textures/NaturalEarthII')
    )
      .then((naturalEarthProvider) => {
        if (!viewer.isDestroyed()) {
          viewer.imageryLayers.addImageryProvider(naturalEarthProvider)
        }
      })
      .catch(() => {
        // Ignore if fallback fails
      })

    Cesium.ArcGisMapServerImageryProvider.fromUrl(
      'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer'
    )
      .then((satelliteProvider) => {
        if (!viewer.isDestroyed()) {
          viewer.imageryLayers.addImageryProvider(satelliteProvider)
        }
      })
      .catch((err) => {
        console.warn('Satellite imagery fallback active:', err)
      })

    // Configure Deep Space & Atmosphere aesthetics
    const { scene, camera } = viewer
    const { globe } = scene
    scene.backgroundColor = Cesium.Color.fromCssColorString('#03060f')
    globe.baseColor = Cesium.Color.fromCssColorString('#071226')
    globe.enableLighting = false
    globe.showGroundAtmosphere = true
    if (scene.skyAtmosphere) {
      scene.skyAtmosphere.show = true
      scene.skyAtmosphere.hueShift = -0.03
      scene.skyAtmosphere.saturationShift = 0.1
      scene.skyAtmosphere.brightnessShift = 0.05
    }
    scene.fog.enabled = true
    scene.fog.density = 0.00015

    // Enable smooth 3D navigation (zoom, rotate, tilt, free look)
    const controller = scene.screenSpaceCameraController
    controller.enableInputs = true
    controller.enableZoom = true
    controller.enableRotate = true
    controller.enableTilt = true
    controller.enableLook = true
    controller.minimumZoomDistance = 150 // Allow zooming down to 150m above surface
    controller.maximumZoomDistance = 45_000_000 // Up to 45,000 km deep orbit
    controller.inertiaSpin = 0.92
    controller.inertiaZoom = 0.85

    // Set initial orbital camera position
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

    // Pause auto-rotation as soon as the user grabs or wheels the globe
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
    handler.setInputAction(() => {
      userInteractingRef.current = true
      setAutoRotate(false)
    }, Cesium.ScreenSpaceEventType.MIDDLE_DOWN)
    handler.setInputAction(() => {
      userInteractingRef.current = false
    }, Cesium.ScreenSpaceEventType.MIDDLE_UP)
    handler.setInputAction(() => {
      userInteractingRef.current = true
      setAutoRotate(false)
    }, Cesium.ScreenSpaceEventType.RIGHT_DOWN)
    handler.setInputAction(() => {
      userInteractingRef.current = false
    }, Cesium.ScreenSpaceEventType.RIGHT_UP)

    // Gentle orbital spin when autoRotate is enabled
    let lastTime = performance.now()
    const onPreUpdate = (): void => {
      const now = performance.now()
      const dt = (now - lastTime) / 1000
      lastTime = now
      if (autoRotateRef.current && !userInteractingRef.current) {
        camera.rotate(Cesium.Cartesian3.UNIT_Z, -0.035 * dt)
      }
    }
    scene.preUpdate.addEventListener(onPreUpdate)

    // Update live camera telemetry in HUD
    const updateTelemetry = (): void => {
      const cartographic = camera.positionCartographic
      if (!cartographic) return
      setTelemetry({
        lat: Number(Cesium.Math.toDegrees(cartographic.latitude).toFixed(4)),
        lon: Number(Cesium.Math.toDegrees(cartographic.longitude).toFixed(4)),
        altitudeKm: Math.max(0.1, Number((cartographic.height / 1000).toFixed(1))),
        pitchDeg: Math.round(Cesium.Math.toDegrees(camera.pitch)),
        headingDeg: Math.round(Cesium.Math.toDegrees(camera.heading))
      })
    }
    camera.changed.addEventListener(updateTelemetry)
    camera.percentageChanged = 0.01

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

  const handleZoomIn = (): void => {
    const viewer = viewerRef.current
    if (!viewer) return
    setAutoRotate(false)
    const height = viewer.camera.positionCartographic.height
    viewer.camera.zoomIn(height * 0.35)
  }

  const handleZoomOut = (): void => {
    const viewer = viewerRef.current
    if (!viewer) return
    setAutoRotate(false)
    const height = viewer.camera.positionCartographic.height
    viewer.camera.zoomOut(Math.max(height * 0.45, 1000))
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
      duration: 2.2
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
      duration: 1.0
    })
  }

  return (
    <div className="globe-stage">
      {/* Fullscreen 3D Cesium Canvas */}
      <div ref={containerRef} className="cesium-Viewport" />

      {/* Top-Left Brand / Telemetry Header */}
      <header className="hud-header">
        <div className="hud-brand">
          <div className="hud-badge">
            <Globe size={18} className="hud-icon-cyan" />
            <span>SARS UNLIMITED</span>
          </div>
          <span className="hud-subtitle">3D Earth SAR Orbital Explorer · CesiumJS Engine</span>
        </div>

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
              {telemetry.altitudeKm >= 100
                ? `${Math.round(telemetry.altitudeKm).toLocaleString()} km`
                : `${telemetry.altitudeKm.toFixed(1)} km`}
            </span>
          </div>
          <div className="telemetry-item">
            <span className="telemetry-label">PITCH</span>
            <span className="telemetry-value">{telemetry.pitchDeg}°</span>
          </div>
        </div>
      </header>

      {/* Bottom-Right Navigation Controls */}
      <div className="hud-nav-controls">
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

      {/* Bottom-Left Navigation Hint */}
      <div className="hud-controls-hint">
        <span>Left-Drag: Rotate / Pan</span>
        <span>·</span>
        <span>Scroll / Right-Drag: Zoom</span>
        <span>·</span>
        <span>Middle-Drag or Ctrl+Drag: 3D Tilt</span>
      </div>
    </div>
  )
}
