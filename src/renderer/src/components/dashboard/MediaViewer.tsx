import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Bar,
  BarChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import {
  ArrowLeftRight,
  BookOpen,
  Calendar,
  Columns,
  Crosshair,
  ExternalLink,
  Film,
  Globe2,
  Layers,
  MapPin,
  Maximize2,
  Pause,
  Play,
  Radar,
  Upload,
  Volume2,
  VolumeX,
  X
} from 'lucide-react'
import type { EventRecord } from '../../types/phenomenon'
import type { LegendEntry, SarOverlayLayer } from '../../types/sar'
import { loadSarAssetDataUrl } from '../../services/phenomenonDataService'
import { classifyRadarPixel, type ProbeReading } from '../SarStoryCard'
import { SarPenetrationDiagram } from './SarPenetrationDiagram'

export type MediaTab = 'overview' | 'comparator' | 'layers_physics' | 'video_sources'

export interface MediaViewerProps {
  event: EventRecord | null
  onClose: () => void
  initialTab?: MediaTab
  onSelectLayerOnGlobe?: (layerId: string) => void
}

function stripHexAnnotations(text: string): string {
  return text.replace(/\s*\(#[0-9a-fA-F]{3,8}\)/g, '')
}

interface SwatchPillsProps {
  entries: LegendEntry[]
  compact?: boolean
}

const SwatchPills: React.FC<SwatchPillsProps> = ({ entries, compact = false }) => {
  if (entries.length === 0) return null
  return (
    <div className={`sars-swatch-pills ${compact ? 'is-compact' : ''}`}>
      {entries.map((entry, idx) => (
        <span key={`${entry.color}-${idx}`} className="sars-swatch-pill">
          <span
            className="sars-swatch-pill__dot"
            style={{ background: entry.color }}
            aria-hidden="true"
          />
          <span className="sars-swatch-pill__label">{entry.label}</span>
        </span>
      ))}
    </div>
  )
}

function isOverlayMaskLayer(layer: SarOverlayLayer | null): boolean {
  if (!layer) return false
  return (
    layer.role === 'change' ||
    layer.role === 'classification' ||
    layer.role === 'thermal' ||
    layer.id === 'crisis_tur_dmg'
  )
}

function pickDefaultLayerPair(layers: SarOverlayLayer[]): [string, string] {
  if (layers.length === 0) return ['', '']
  if (layers.length === 1) return [layers[0].id, layers[0].id]

  const beforeLayer = layers.find((l) => l.role === 'before')
  const afterLayer = layers.find((l) => l.role === 'after')
  if (beforeLayer && afterLayer) {
    return [beforeLayer.id, afterLayer.id]
  }

  const baseLayer = layers.find((l) => l.role === 'after' || l.role === 'backscatter')
  const comparisonLayer = layers.find(
    (l) =>
      l.id !== baseLayer?.id &&
      (l.role === 'change' ||
        l.role === 'classification' ||
        l.role === 'cband_compare' ||
        l.role === 'polarization')
  )
  if (baseLayer && comparisonLayer) {
    return [baseLayer.id, comparisonLayer.id]
  }

  return [layers[0].id, layers[1].id]
}

function populateProbeCanvas(
  url: string | undefined,
  canvasRef: React.MutableRefObject<HTMLCanvasElement | null>
): () => void {
  let cancelled = false
  if (!url) {
    canvasRef.current = null
    return () => {
      cancelled = true
    }
  }
  const img = new Image()
  img.onload = () => {
    if (cancelled) return
    const c = document.createElement('canvas')
    c.width = 64
    c.height = 64
    const ctx2d = c.getContext('2d')
    if (ctx2d) {
      ctx2d.drawImage(img, 0, 0, 64, 64)
      canvasRef.current = c
    }
  }
  img.src = url
  return () => {
    cancelled = true
  }
}

interface ComparatorSideCardProps {
  sideLabel: 'LAYER A · LEFT' | 'LAYER B · RIGHT'
  accentClass: 'is-left' | 'is-right'
  layer: SarOverlayLayer | null
  underlayLayer: SarOverlayLayer | null
}

const ComparatorSideCard: React.FC<ComparatorSideCardProps> = ({
  sideLabel,
  accentClass,
  layer,
  underlayLayer
}) => {
  if (!layer) return <div className="sars-comparator-side-card" />

  const statsEntries = Object.entries(layer.stats ?? {}).slice(0, 4)

  return (
    <div className={`sars-comparator-side-card ${accentClass}`}>
      <div className="sars-comparator-side-card__head">
        <span className="sars-comparator-side-card__side">{sideLabel}</span>
        <span className="sars-comparator-side-card__role">{layer.role}</span>
      </div>

      <h4 className="sars-comparator-side-card__title">{layer.title}</h4>

      <div className="sars-comparator-side-card__meta">
        <span>{layer.sensor}</span>
        <span>
          {layer.band} · Pol: <strong>{layer.polarization}</strong>
        </span>
        <span>Acquired: {layer.acquisition_date}</span>
      </div>

      {underlayLayer && (
        <div className="sars-comparator-side-card__underlay-note">
          <Layers size={11} />
          <span>Context underlay: {underlayLayer.polarization} radar backscatter</span>
        </div>
      )}

      {layer.legend.length > 0 && (
        <div className="sars-comparator-side-card__legend">
          <div className="sars-comparator-side-card__subhead">Color Key</div>
          <div className="sars-colorbar__legend-list">
            {layer.legend.map((entry, idx) => (
              <div key={`${entry.color}-${idx}`} className="sars-colorbar__legend-item">
                <span
                  className="sars-colorbar__swatch"
                  style={{ background: entry.color }}
                  aria-hidden="true"
                />
                <span className="sars-colorbar__legend-label">{entry.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {statsEntries.length > 0 && (
        <div className="sars-comparator-side-card__stats">
          <div className="sars-comparator-side-card__subhead">Measured Telemetry</div>
          <div className="sars-stat-chips">
            {statsEntries.map(([k, v]) => (
              <div key={k} className="sars-stat-chip">
                <strong>{k.replace(/_/g, ' ')}:</strong> <span>{String(v)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export const MediaViewer: React.FC<MediaViewerProps> = ({
  event,
  onClose,
  initialTab = 'comparator',
  onSelectLayerOnGlobe
}) => {
  const [activeTab, setActiveTab] = useState<MediaTab>(initialTab)
  const [layerUrls, setLayerUrls] = useState<Record<string, string>>({})
  const [leftLayerId, setLeftLayerId] = useState<string>('')
  const [rightLayerId, setRightLayerId] = useState<string>('')
  const [splitPercent, setSplitPercent] = useState<number>(50)
  const [isDraggingSplit, setIsDraggingSplit] = useState<boolean>(false)
  const [probeReadout, setProbeReadout] = useState<{
    xPct: number
    yPct: number
    reading: ProbeReading
    layerLabel: string
  } | null>(null)
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const isDraggingSplitRef = useRef<boolean>(false)
  const leftCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const rightCanvasRef = useRef<HTMLCanvasElement | null>(null)

  // HTML5 Video Player state
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [customVideoUrl, setCustomVideoUrl] = useState<string | null>(null)
  const [customVideoName, setCustomVideoName] = useState<string>('')
  const [isPlayingVideo, setIsPlayingVideo] = useState<boolean>(false)
  const [isMuted, setIsMuted] = useState<boolean>(false)
  const [videoProgress, setVideoProgress] = useState<number>(0)

  useEffect(() => {
    if (!event) return
    setActiveTab(initialTab)
    const [defaultLeft, defaultRight] = pickDefaultLayerPair(event.layers)
    setLeftLayerId(defaultLeft)
    setRightLayerId(defaultRight)
    setSplitPercent(50)
    setProbeReadout(null)
    isDraggingSplitRef.current = false
    setIsDraggingSplit(false)

    let cancelled = false
    const loadAll = async (): Promise<void> => {
      const urls: Record<string, string> = {}
      for (const layer of event.layers) {
        const u = await loadSarAssetDataUrl(layer.asset_path)
        if (u && !cancelled) {
          urls[layer.id] = u
        }
      }
      if (!cancelled) {
        setLayerUrls(urls)
      }
    }
    loadAll()
    return () => {
      cancelled = true
    }
  }, [event, initialTab])

  useEffect(() => {
    const url = leftLayerId ? layerUrls[leftLayerId] : undefined
    return populateProbeCanvas(url, leftCanvasRef)
  }, [layerUrls, leftLayerId])

  useEffect(() => {
    const url = rightLayerId ? layerUrls[rightLayerId] : undefined
    return populateProbeCanvas(url, rightCanvasRef)
  }, [layerUrls, rightLayerId])

  useEffect(() => {
    return () => {
      if (customVideoUrl) {
        URL.revokeObjectURL(customVideoUrl)
      }
    }
  }, [customVideoUrl])

  useEffect(() => {
    if (!event) return
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [event, onClose])

  const leftLayer = useMemo(
    () => (event ? event.layers.find((l) => l.id === leftLayerId) ?? event.layers[0] ?? null : null),
    [event, leftLayerId]
  )
  const rightLayer = useMemo(
    () =>
      event
        ? event.layers.find((l) => l.id === rightLayerId) ??
          event.layers[1] ??
          event.layers[0] ??
          null
        : null,
    [event, rightLayerId]
  )

  const baseBackscatterLayer = useMemo(
    () =>
      event?.layers.find(
        (l) => l.role === 'after' || l.role === 'before' || l.role === 'backscatter'
      ) ?? null,
    [event]
  )

  const leftUnderlayLayer =
    leftLayer &&
    isOverlayMaskLayer(leftLayer) &&
    baseBackscatterLayer &&
    baseBackscatterLayer.id !== leftLayer.id
      ? baseBackscatterLayer
      : null

  const rightUnderlayLayer =
    rightLayer &&
    isOverlayMaskLayer(rightLayer) &&
    baseBackscatterLayer &&
    baseBackscatterLayer.id !== rightLayer.id
      ? baseBackscatterLayer
      : null

  const updateProbeAtNormalizedPoint = useCallback(
    (nx: number, ny: number, activeSplitPct: number) => {
      if (!event) return
      const xPct = nx * 100
      const yPct = ny * 100
      const isLeft = xPct <= activeSplitPct
      const activeL = isLeft ? leftLayer : rightLayer
      const probeCanvas = isLeft ? leftCanvasRef.current : rightCanvasRef.current
      if (!activeL) return

      let reading: ProbeReading = {
        dbText: 'Loading...',
        regime: `${activeL.polarization} · ${activeL.sensor}`,
        color: '#38bdf8'
      }
      if (probeCanvas) {
        const ctx2d = probeCanvas.getContext('2d')
        if (ctx2d) {
          const px = Math.min(probeCanvas.width - 1, Math.floor(nx * probeCanvas.width))
          const py = Math.min(probeCanvas.height - 1, Math.floor(ny * probeCanvas.height))
          const d = ctx2d.getImageData(px, py, 1, 1).data
          reading = classifyRadarPixel(d[0], d[1], d[2], d[3], event.eventId)
        }
      }
      setProbeReadout({
        xPct,
        yPct,
        reading,
        layerLabel: `${activeL.polarization} (${activeL.title})`
      })
    },
    [event, leftLayer, rightLayer]
  )

  const getNormalizedPointer = useCallback((clientX: number, clientY: number) => {
    const el = viewportRef.current
    if (!el) return null
    const rect = el.getBoundingClientRect()
    const nx = Math.max(0, Math.min(1, (clientX - rect.left) / Math.max(1, rect.width)))
    const ny = Math.max(0, Math.min(1, (clientY - rect.top) / Math.max(1, rect.height)))
    return { nx, ny }
  }, [])

  const handleViewportPointerDown = (e: React.PointerEvent<HTMLDivElement>): void => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    const pos = getNormalizedPointer(e.clientX, e.clientY)
    if (!pos) return
    e.currentTarget.setPointerCapture(e.pointerId)
    isDraggingSplitRef.current = true
    setIsDraggingSplit(true)
    const nextSplit = pos.nx * 100
    setSplitPercent(nextSplit)
    updateProbeAtNormalizedPoint(pos.nx, pos.ny, nextSplit)
  }

  const handleViewportPointerMove = (e: React.PointerEvent<HTMLDivElement>): void => {
    const pos = getNormalizedPointer(e.clientX, e.clientY)
    if (!pos) return
    let activeSplit = splitPercent
    if (isDraggingSplitRef.current) {
      activeSplit = pos.nx * 100
      setSplitPercent(activeSplit)
    }
    updateProbeAtNormalizedPoint(pos.nx, pos.ny, activeSplit)
  }

  const handleViewportPointerUp = (e: React.PointerEvent<HTMLDivElement>): void => {
    if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
    isDraggingSplitRef.current = false
    setIsDraggingSplit(false)
  }

  const handleViewportKeyDown = (e: React.KeyboardEvent<HTMLDivElement>): void => {
    const step = e.shiftKey ? 5 : 2
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      setSplitPercent((prev) => Math.max(0, prev - step))
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      setSplitPercent((prev) => Math.min(100, prev + step))
    }
  }

  const handleSwapLayers = (): void => {
    setLeftLayerId(rightLayer?.id ?? '')
    setRightLayerId(leftLayer?.id ?? '')
    setProbeReadout(null)
  }

  const handleOpenLayerInComparator = (layer: SarOverlayLayer): void => {
    if (!event) return
    const [defaultLeft, defaultRight] = pickDefaultLayerPair(event.layers)
    if (layer.role === 'before') {
      const pairRight =
        event.layers.find((l) => l.id !== layer.id && l.role === 'after')?.id ??
        (defaultRight !== layer.id ? defaultRight : defaultLeft)
      setLeftLayerId(layer.id)
      setRightLayerId(pairRight)
    } else {
      const pairLeft =
        event.layers.find((l) => l.id !== layer.id && l.role === 'before')?.id ??
        (baseBackscatterLayer && baseBackscatterLayer.id !== layer.id
          ? baseBackscatterLayer.id
          : defaultLeft !== layer.id
            ? defaultLeft
            : defaultRight)
      setLeftLayerId(pairLeft)
      setRightLayerId(layer.id)
    }
    setSplitPercent(50)
    setProbeReadout(null)
    setActiveTab('comparator')
  }

  if (!event) return null

  const primaryLayer =
    event.layers.find((l) => l.id === event.defaultLayerId) ?? event.layers[0] ?? null
  const primaryUnderlayLayer =
    primaryLayer &&
    isOverlayMaskLayer(primaryLayer) &&
    baseBackscatterLayer &&
    baseBackscatterLayer.id !== primaryLayer.id
      ? baseBackscatterLayer
      : null
  const histogramData = event.comparisonPair?.histogram ?? []
  const exp = event.scientificExplanation

  const handleSelectLocalVideo = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0]
    if (!file) return
    if (customVideoUrl) {
      URL.revokeObjectURL(customVideoUrl)
    }
    const url = URL.createObjectURL(file)
    setCustomVideoUrl(url)
    setCustomVideoName(file.name)
    setIsPlayingVideo(false)
    setVideoProgress(0)
  }

  const togglePlayVideo = (): void => {
    const vid = videoRef.current
    if (!vid) return
    if (vid.paused) {
      vid.play()
      setIsPlayingVideo(true)
    } else {
      vid.pause()
      setIsPlayingVideo(false)
    }
  }

  const toggleMuteVideo = (): void => {
    const vid = videoRef.current
    if (!vid) return
    vid.muted = !vid.muted
    setIsMuted(vid.muted)
  }

  const requestVideoFullscreen = (): void => {
    const vid = videoRef.current
    if (vid && vid.requestFullscreen) {
      vid.requestFullscreen()
    }
  }

  return (
    <div className="sars-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="sars-modal-window sars-media-modal sars-dossier-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sars-modal-header sars-dossier-header">
          <div className="sars-modal-header__left">
            <span className="sars-modal-badge">
              <Radar size={12} />
              <span>SCIENTIFIC INCIDENT DOSSIER · {event.provenance}</span>
            </span>
            <h2 className="sars-modal-title">{event.eventName}</h2>
            <div className="sars-modal-subtitle">
              <span>
                <MapPin size={12} /> {event.regionName}, {event.country} (
                {event.latitude.toFixed(2)}°, {event.longitude.toFixed(2)}°)
              </span>
              <span>
                <Calendar size={12} /> {event.displayDate} · Timeline: {event.eventDate}
              </span>
              <span>
                <Radar size={12} /> {event.satelliteMetadata.sensor} ·{' '}
                {event.satelliteMetadata.band} ({event.satelliteMetadata.polarization})
              </span>
            </div>
          </div>

          <button
            type="button"
            className="sars-modal-close"
            onClick={onClose}
            title="Close Incident Dossier (Esc)"
          >
            <X size={16} />
          </button>
        </div>

        {/* Unified 4-Tab Navigation Strip */}
        <div className="sars-dossier-tabs-bar" role="tablist" aria-label="Incident Dossier Sections">
          <div className="sars-media-tabs">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'overview'}
              className={`sars-media-tab ${activeTab === 'overview' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <BookOpen size={13} />
              <span>Overview &amp; Key Findings</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'comparator'}
              className={`sars-media-tab ${activeTab === 'comparator' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('comparator')}
            >
              <Columns size={13} />
              <span>Before / After Split</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'layers_physics'}
              className={`sars-media-tab ${activeTab === 'layers_physics' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('layers_physics')}
            >
              <Layers size={13} />
              <span>SAR Layers &amp; Physics ({event.layers.length})</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'video_sources'}
              className={`sars-media-tab ${activeTab === 'video_sources' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('video_sources')}
            >
              <Film size={13} />
              <span>Video &amp; Sources</span>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="sars-modal-body">
          {activeTab === 'overview' && (
            <div className="sars-dossier-overview">
              {/* Top 4 Scannable Metrics */}
              <div className="sars-report-metrics-grid">
                <div className="sars-report-stat-box">
                  <span className="sars-report-stat-box__label">HEADLINE METRIC</span>
                  <span className="sars-report-stat-box__value">{event.headlineMetric}</span>
                </div>
                <div className="sars-report-stat-box">
                  <span className="sars-report-stat-box__label">PEAK MAGNITUDE / STAGE</span>
                  <span className="sars-report-stat-box__value">
                    {event.magnitude ?? event.headlineMetric}
                  </span>
                </div>
                <div className="sars-report-stat-box">
                  <span className="sars-report-stat-box__label">SAR SIGNATURE / SHIFT</span>
                  <span className="sars-report-stat-box__value">
                    {event.severity ?? 'Validated Anomaly'}
                  </span>
                </div>
                <div className="sars-report-stat-box">
                  <span className="sars-report-stat-box__label">AFFECTED EXTENT</span>
                  <span className="sars-report-stat-box__value">
                    {event.affectedArea ?? 'Regional AOI'}
                  </span>
                </div>
              </div>

              {/* Main 2-Column Content: Left Visual + Right Executive Findings */}
              <div className="sars-dossier-overview-grid">
                <div className="sars-report-card sars-dossier-preview-card">
                  <div className="sars-dossier-card-head">
                    <h3 className="sars-report-section-title">Featured SAR Product</h3>
                    {primaryLayer && (
                      <span className="sars-dossier-role-pill">{primaryLayer.role}</span>
                    )}
                  </div>

                  {primaryLayer ? (
                    <>
                      <div className="sars-dossier-preview__stage">
                        {primaryUnderlayLayer && layerUrls[primaryUnderlayLayer.id] && (
                          <img
                            src={layerUrls[primaryUnderlayLayer.id]}
                            alt={`${primaryUnderlayLayer.title} context underlay`}
                            className="sars-dossier-preview__underlay"
                            draggable={false}
                          />
                        )}
                        {layerUrls[primaryLayer.id] ? (
                          <img
                            src={layerUrls[primaryLayer.id]}
                            alt={primaryLayer.title}
                            className="sars-dossier-preview__img"
                            draggable={false}
                          />
                        ) : (
                          <div className="sars-report-layer-item__placeholder">
                            Loading SAR Raster…
                          </div>
                        )}
                      </div>

                      <div className="sars-dossier-preview__meta">
                        <div className="sars-report-layer-item__title">{primaryLayer.title}</div>
                        <p className="sars-report-layer-item__desc">
                          {primaryLayer.sensor} · {primaryLayer.band} · Pol:{' '}
                          <strong>{primaryLayer.polarization}</strong> · Acquired:{' '}
                          {primaryLayer.acquisition_date}
                        </p>
                      </div>

                      {primaryLayer.legend.length > 0 ? (
                        <div className="sars-dossier-preview__legend">
                          <span className="sars-comparator-side-card__subhead">Color Key</span>
                          <SwatchPills entries={primaryLayer.legend} />
                        </div>
                      ) : (
                        <p className="sars-report-paragraph">
                          {stripHexAnnotations(
                            exp.environmentalAndHumanImpact.overlayReadingGuide
                          )}
                        </p>
                      )}

                      <div className="sars-dossier-preview__actions">
                        <button
                          type="button"
                          className="sars-event-action-btn is-primary"
                          onClick={() => setActiveTab('comparator')}
                        >
                          <Columns size={13} />
                          <span>Compare Before / After</span>
                        </button>
                        {onSelectLayerOnGlobe && (
                          <button
                            type="button"
                            className="sars-event-action-btn"
                            onClick={() => {
                              onSelectLayerOnGlobe(primaryLayer.id)
                              onClose()
                            }}
                          >
                            <Globe2 size={13} />
                            <span>Activate on 3D Globe</span>
                          </button>
                        )}
                      </div>
                    </>
                  ) : (
                    <p className="sars-report-paragraph">
                      No raster preview available for this event.
                    </p>
                  )}
                </div>

                <div className="sars-dossier-right-col">
                  <div className="sars-report-card">
                    <h3 className="sars-report-section-title">What Happened &amp; Key Findings</h3>
                    <p className="sars-report-paragraph">{exp.whatHappened.description}</p>
                    <div className="sars-dossier-finding-callout">
                      <strong>Key SAR Observation:</strong> {exp.whatHappened.observations}
                    </div>
                  </div>

                  <div className="sars-report-card">
                    <h3 className="sars-report-section-title">Primary Drivers &amp; Context</h3>
                    <div className="sars-dossier-drivers-grid">
                      <div className="sars-dossier-driver-box">
                        <span className="sars-dossier-driver-box__label">Natural Driver</span>
                        <p>{event.causes.naturalDriver}</p>
                      </div>
                      <div className="sars-dossier-driver-box">
                        <span className="sars-dossier-driver-box__label">
                          Human &amp; Infrastructure Context
                        </span>
                        <p>{event.causes.humanDriver}</p>
                      </div>
                    </div>
                    <p className="sars-report-paragraph sars-dossier-impact-line">
                      <strong>Impact:</strong> {event.impacts.environmentalImpact}
                    </p>
                  </div>

                  <div className="sars-report-card">
                    <h3 className="sars-report-section-title">
                      Radar Backscatter Shift ({event.comparisonPair?.before_label ?? 'Before'}{' '}
                      vs. {event.comparisonPair?.after_label ?? 'After'})
                    </h3>
                    {histogramData.length > 0 ? (
                      <div style={{ width: '100%', height: 170 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={histogramData}
                            margin={{ top: 8, right: 12, left: -18, bottom: 4 }}
                          >
                            <XAxis
                              dataKey="range_db"
                              tick={{ fill: 'rgba(210, 224, 245, 0.65)', fontSize: 10 }}
                            />
                            <YAxis
                              tick={{ fill: 'rgba(210, 224, 245, 0.5)', fontSize: 10 }}
                              width={35}
                            />
                            <Tooltip
                              contentStyle={{
                                background: 'rgba(13, 18, 28, 0.96)',
                                border: '1px solid rgba(148, 179, 228, 0.3)',
                                borderRadius: '8px',
                                fontSize: '11px'
                              }}
                            />
                            <Legend wrapperStyle={{ fontSize: '11px' }} />
                            <Bar
                              dataKey="before_pct"
                              name={event.comparisonPair?.before_label ?? 'Baseline (%)'}
                              fill="#64748b"
                              radius={[3, 3, 0, 0]}
                              isAnimationActive={false}
                            />
                            <Bar
                              dataKey="after_pct"
                              name={event.comparisonPair?.after_label ?? 'Event Peak (%)'}
                              fill="#60a5fa"
                              radius={[3, 3, 0, 0]}
                              isAnimationActive={false}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <p className="sars-report-paragraph">
                        No backscatter histogram recorded for this event.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'comparator' && (
            <div className="sars-comparator-view">
              <div className="sars-comparator-controls">
                <div className="sars-comparator-select-group">
                  <label>Left Layer (A):</label>
                  <select
                    className="sars-select-input"
                    value={leftLayer?.id ?? ''}
                    onChange={(e) => setLeftLayerId(e.target.value)}
                  >
                    {event.layers.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.title} ({l.polarization})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sars-comparator-slider-group">
                  <div className="sars-comparator-slider-head">
                    <span>Split Wipe: {Math.round(splitPercent)}%</span>
                    <button
                      type="button"
                      className="sars-comparator-swap-btn"
                      onClick={handleSwapLayers}
                      title="Swap Left (A) and Right (B) layers"
                    >
                      <ArrowLeftRight size={11} />
                      <span>Swap A ⇄ B</span>
                    </button>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={0.5}
                    value={splitPercent}
                    onChange={(e) => setSplitPercent(parseFloat(e.target.value))}
                    aria-label="Before and after split wipe percentage"
                  />
                </div>

                <div className="sars-comparator-select-group">
                  <label>Right Layer (B):</label>
                  <select
                    className="sars-select-input"
                    value={rightLayer?.id ?? ''}
                    onChange={(e) => setRightLayerId(e.target.value)}
                  >
                    {event.layers.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.title} ({l.polarization})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 3-Column Stage: Left Metadata/Legend | 1:1 Direct-Drag Viewport | Right Metadata/Legend */}
              <div className="sars-comparator-stage">
                <ComparatorSideCard
                  sideLabel="LAYER A · LEFT"
                  accentClass="is-left"
                  layer={leftLayer}
                  underlayLayer={leftUnderlayLayer}
                />

                <div
                  ref={viewportRef}
                  tabIndex={0}
                  role="slider"
                  aria-label="Interactive Before and After SAR Comparison Slider"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(splitPercent)}
                  className={`sars-comparator-viewport ${isDraggingSplit ? 'is-dragging' : ''}`}
                  onPointerDown={handleViewportPointerDown}
                  onPointerMove={handleViewportPointerMove}
                  onPointerUp={handleViewportPointerUp}
                  onPointerCancel={handleViewportPointerUp}
                  onPointerLeave={() => {
                    if (!isDraggingSplitRef.current) {
                      setProbeReadout(null)
                    }
                  }}
                  onKeyDown={handleViewportKeyDown}
                >
                  {/* Left Half (Clipped strictly to 0 .. splitPercent%) */}
                  <div
                    className="sars-comparator-half"
                    style={{ clipPath: `inset(0 ${100 - splitPercent}% 0 0)` }}
                  >
                    {leftUnderlayLayer && layerUrls[leftUnderlayLayer.id] && (
                      <img
                        src={layerUrls[leftUnderlayLayer.id]}
                        alt=""
                        aria-hidden="true"
                        className="sars-comparator-img sars-comparator-img--underlay"
                        draggable={false}
                      />
                    )}
                    {leftLayer && layerUrls[leftLayer.id] && (
                      <img
                        src={layerUrls[leftLayer.id]}
                        alt={leftLayer.title}
                        className="sars-comparator-img"
                        draggable={false}
                      />
                    )}
                  </div>

                  {/* Right Half (Clipped strictly to splitPercent% .. 100%) */}
                  <div
                    className="sars-comparator-half"
                    style={{ clipPath: `inset(0 0 0 ${splitPercent}%)` }}
                  >
                    {rightUnderlayLayer && layerUrls[rightUnderlayLayer.id] && (
                      <img
                        src={layerUrls[rightUnderlayLayer.id]}
                        alt=""
                        aria-hidden="true"
                        className="sars-comparator-img sars-comparator-img--underlay"
                        draggable={false}
                      />
                    )}
                    {rightLayer && layerUrls[rightLayer.id] && (
                      <img
                        src={layerUrls[rightLayer.id]}
                        alt={rightLayer.title}
                        className="sars-comparator-img"
                        draggable={false}
                      />
                    )}
                  </div>

                  {/* On-Image Divider Line & Handle */}
                  <div
                    className={`sars-comparator-divider ${isDraggingSplit ? 'is-dragging' : ''}`}
                    style={{ left: `${splitPercent}%` }}
                  >
                    <span className="sars-comparator-divider__handle">⇔</span>
                  </div>

                  {/* Live Pixel Probe Reticle */}
                  {probeReadout && (
                    <span
                      className="sars-comparator-crosshair-dot"
                      style={{
                        left: `${probeReadout.xPct}%`,
                        top: `${probeReadout.yPct}%`,
                        borderColor: probeReadout.reading.color
                      }}
                    />
                  )}

                  <span className="sars-comparator-corner-tag sars-comparator-corner-tag--left">
                    A · {leftLayer?.polarization}
                  </span>
                  <span className="sars-comparator-corner-tag sars-comparator-corner-tag--right">
                    B · {rightLayer?.polarization}
                  </span>

                  <div className="sars-comparator-probe">
                    {probeReadout ? (
                      <>
                        <Crosshair size={12} style={{ color: probeReadout.reading.color }} />
                        <strong>{probeReadout.reading.dbText}</strong>
                        <span> · {probeReadout.reading.regime}</span>
                      </>
                    ) : (
                      <span>Click &amp; drag directly on image to wipe · Hover to probe dB</span>
                    )}
                  </div>
                </div>

                <ComparatorSideCard
                  sideLabel="LAYER B · RIGHT"
                  accentClass="is-right"
                  layer={rightLayer}
                  underlayLayer={rightUnderlayLayer}
                />
              </div>

              <p className="sars-comparator-caption">
                Click or drag directly across the SAR scene (or use Left/Right arrow keys) to wipe
                between layers. Hover anywhere on the raster to inspect local backscatter / phase
                values.
              </p>
            </div>
          )}

          {activeTab === 'layers_physics' && (
            <div className="sars-dossier-layers-physics">
              <div className="sars-report-card">
                <div className="sars-dossier-card-head">
                  <h3 className="sars-report-section-title">
                    <Layers size={14} /> Georeferenced SAR Overlay Products ({event.layers.length}{' '}
                    Layers)
                  </h3>
                </div>
                <div className="sars-dossier-layers-grid">
                  {event.layers.map((layer) => {
                    const imgUrl = layerUrls[layer.id]
                    const cardUnderlay =
                      isOverlayMaskLayer(layer) &&
                      baseBackscatterLayer &&
                      baseBackscatterLayer.id !== layer.id
                        ? baseBackscatterLayer
                        : null
                    const statEntries = Object.entries(layer.stats ?? {}).slice(0, 3)

                    return (
                      <div key={layer.id} className="sars-dossier-layer-card">
                        <div className="sars-dossier-layer-card__preview">
                          {cardUnderlay && layerUrls[cardUnderlay.id] && (
                            <img
                              src={layerUrls[cardUnderlay.id]}
                              alt={`${cardUnderlay.title} underlay`}
                              className="sars-dossier-layer-card__underlay"
                              draggable={false}
                            />
                          )}
                          {imgUrl ? (
                            <img
                              src={imgUrl}
                              alt={layer.title}
                              className="sars-dossier-layer-card__img"
                              draggable={false}
                            />
                          ) : (
                            <div className="sars-report-layer-item__placeholder">
                              Loading SAR Raster…
                            </div>
                          )}
                        </div>

                        <div className="sars-dossier-layer-card__body">
                          <div className="sars-dossier-layer-card__head">
                            <span className="sars-report-layer-item__title">{layer.title}</span>
                            <span className="sars-dossier-role-pill">{layer.role}</span>
                          </div>
                          <p className="sars-report-layer-item__desc">
                            {layer.sensor} · {layer.band} · Pol: <strong>{layer.polarization}</strong>{' '}
                            · {layer.acquisition_date}
                          </p>

                          <SwatchPills entries={layer.legend} compact />

                          {statEntries.length > 0 && (
                            <div className="sars-stat-chips">
                              {statEntries.map(([k, v]) => (
                                <div key={k} className="sars-stat-chip">
                                  <strong>{k.replace(/_/g, ' ')}:</strong>{' '}
                                  <span>{String(v)}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="sars-dossier-layer-card__actions">
                            <button
                              type="button"
                              className="sars-event-action-btn"
                              onClick={() => handleOpenLayerInComparator(layer)}
                            >
                              <Columns size={12} />
                              <span>Open in Split-Screen</span>
                            </button>
                            {onSelectLayerOnGlobe && (
                              <button
                                type="button"
                                className="sars-event-action-btn is-primary"
                                onClick={() => {
                                  onSelectLayerOnGlobe(layer.id)
                                  onClose()
                                }}
                              >
                                <Globe2 size={12} />
                                <span>Show on 3D Globe</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="sars-report-card sars-dossier-physics-section">
                <h3 className="sars-report-section-title">
                  <Radar size={14} /> SAR Electromagnetic Physics &amp; Wavelength Penetration
                </h3>
                <div className="sars-dossier-physics-grid">
                  <div className="sars-dossier-physics-box">
                    <h4>Primary Detection Mechanism</h4>
                    <p>{exp.whySarDetectsIt.primaryMechanism}</p>
                  </div>
                  <div className="sars-dossier-physics-box">
                    <h4>Roughness, Backscatter &amp; Moisture</h4>
                    <p>{exp.whySarDetectsIt.roughnessAndBackscatter}</p>
                    <p className="sars-dossier-physics-sub">{exp.whySarDetectsIt.dielectricAndMoisture}</p>
                  </div>
                  <div className="sars-dossier-physics-box">
                    <h4>Polarization &amp; Wavelength</h4>
                    <p>{exp.whySarDetectsIt.polarizationAndWavelength}</p>
                  </div>
                </div>
                <SarPenetrationDiagram />
              </div>
            </div>
          )}

          {activeTab === 'video_sources' && (
            <div className="sars-dossier-video-sources">
              <div className="sars-video-view">
                {customVideoUrl ? (
                  <div className="sars-video-player-container">
                    <video
                      ref={videoRef}
                      src={customVideoUrl}
                      className="sars-video-element"
                      onTimeUpdate={(e) => {
                        const el = e.currentTarget
                        if (el.duration > 0) {
                          setVideoProgress((el.currentTime / el.duration) * 100)
                        }
                      }}
                      onEnded={() => setIsPlayingVideo(false)}
                    />
                    <div className="sars-video-controls-bar">
                      <button
                        type="button"
                        className="sars-event-action-btn"
                        onClick={togglePlayVideo}
                      >
                        {isPlayingVideo ? <Pause size={13} /> : <Play size={13} />}
                        <span>{isPlayingVideo ? 'Pause' : 'Play'}</span>
                      </button>

                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={0.5}
                        value={videoProgress}
                        onChange={(e) => {
                          const vid = videoRef.current
                          const pct = parseFloat(e.target.value)
                          setVideoProgress(pct)
                          if (vid && vid.duration > 0) {
                            vid.currentTime = (pct / 100) * vid.duration
                          }
                        }}
                        className="sars-video-seek"
                      />

                      <button
                        type="button"
                        className="sars-event-action-btn"
                        onClick={toggleMuteVideo}
                      >
                        {isMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
                      </button>

                      <button
                        type="button"
                        className="sars-event-action-btn"
                        onClick={requestVideoFullscreen}
                      >
                        <Maximize2 size={13} />
                      </button>
                    </div>
                    <div className="sars-video-file-meta">
                      Playing local file: <strong>{customVideoName}</strong>
                    </div>
                  </div>
                ) : (
                  <div className="sars-video-unavailable-box">
                    <Film size={26} />
                    <h3>Video demonstration not yet bundled for this event</h3>
                    <p>
                      Load a local MP4/WebM time-lapse for <strong>{event.eventName}</strong> or
                      compare the verified before/after SAR rasters interactively.
                    </p>
                    <div className="sars-video-unavailable-actions">
                      <label className="sars-upload-video-btn">
                        <Upload size={13} />
                        <span>Load Local MP4 / WebM Video</span>
                        <input
                          type="file"
                          accept="video/mp4,video/webm,video/ogg"
                          onChange={handleSelectLocalVideo}
                          style={{ display: 'none' }}
                        />
                      </label>
                      <button
                        type="button"
                        className="sars-event-action-btn"
                        onClick={() => setActiveTab('comparator')}
                      >
                        <Columns size={13} />
                        <span>Open Before / After Split-Screen</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="sars-report-card">
                <h3 className="sars-report-section-title">
                  Verified Satellite Granules &amp; Scientific References
                </h3>
                <div className="sars-report-granules">
                  <strong>Mission &amp; Sensor:</strong> {event.satelliteMetadata.mission} ·{' '}
                  {event.satelliteMetadata.sensor} ({event.satelliteMetadata.band},{' '}
                  {event.satelliteMetadata.polarization},{' '}
                  {event.satelliteMetadata.resolution})
                </div>
                <div className="sars-report-granules">
                  <strong>Primary Granule:</strong>{' '}
                  <code>{event.satelliteMetadata.granuleId}</code> ·{' '}
                  <strong>Period:</strong> {event.processingMetadata.observationPeriod}
                </div>
                <p className="sars-report-paragraph sars-dossier-methodology-line">
                  <strong>Methodology:</strong> {event.processingMetadata.methodology}
                </p>
                <div className="sars-report-sources">
                  {event.sources.map((src) => (
                    <div key={src.id} className="sars-report-source-item">
                      <div className="sars-report-source-item__title">{src.title}</div>
                      <div className="sars-report-source-item__citation">
                        Publisher: {src.publisher} (Accessed {src.accessed})
                      </div>
                      {src.url && (
                        <a
                          href={src.url}
                          target="_blank"
                          rel="noreferrer"
                          className="sars-report-source-item__link"
                        >
                          <span>{src.url}</span>
                          <ExternalLink size={11} />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
