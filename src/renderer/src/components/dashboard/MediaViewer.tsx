import React, { useEffect, useRef, useState } from 'react'
import {
  Columns,
  Crosshair,
  Film,
  Image as ImageIcon,
  Maximize2,
  Pause,
  Play,
  Upload,
  Volume2,
  VolumeX,
  X
} from 'lucide-react'
import type { EventRecord } from '../../types/phenomenon'
import { loadSarAssetDataUrl } from '../../services/phenomenonDataService'
import { classifyRadarPixel, type ProbeReading } from '../SarStoryCard'

export interface MediaViewerProps {
  event: EventRecord | null
  onClose: () => void
}

type MediaTab = 'comparator' | 'video' | 'gallery'

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

export const MediaViewer: React.FC<MediaViewerProps> = ({ event, onClose }) => {
  const [activeTab, setActiveTab] = useState<MediaTab>('comparator')
  const [layerUrls, setLayerUrls] = useState<Record<string, string>>({})
  const [leftLayerId, setLeftLayerId] = useState<string>('')
  const [rightLayerId, setRightLayerId] = useState<string>('')
  const [splitPercent, setSplitPercent] = useState<number>(50)
  const [probeReadout, setProbeReadout] = useState<{
    xPct: number
    yPct: number
    reading: ProbeReading
    layerLabel: string
  } | null>(null)
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
    const firstId = event.layers[0]?.id ?? ''
    const secondId = event.layers[1]?.id ?? event.layers[0]?.id ?? ''
    setLeftLayerId(firstId)
    setRightLayerId(secondId)
    setProbeReadout(null)

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
  }, [event])

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

  if (!event) return null

  const leftLayer = event.layers.find((l) => l.id === leftLayerId) ?? event.layers[0] ?? null
  const rightLayer =
    event.layers.find((l) => l.id === rightLayerId) ??
    event.layers[1] ??
    event.layers[0] ??
    null

  const handleComparatorMouseMove = (e: React.MouseEvent<HTMLDivElement>): void => {
    const rect = e.currentTarget.getBoundingClientRect()
    const nx = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const ny = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height))
    const xPct = nx * 100
    const yPct = ny * 100
    const isLeft = xPct <= splitPercent
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
  }

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
        className="sars-modal-window sars-media-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sars-modal-header">
          <div className="sars-modal-header__left">
            <span className="sars-modal-badge">
              <Film size={12} />
              <span>MULTIMEDIA &amp; INTERACTIVE SAR DEMONSTRATION</span>
            </span>
            <h2 className="sars-modal-title">{event.eventName}</h2>
          </div>

          {/* Mode Tabs */}
          <div className="sars-media-tabs">
            <button
              type="button"
              className={`sars-media-tab ${activeTab === 'comparator' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('comparator')}
            >
              <Columns size={13} />
              <span>Interactive SAR Split-Screen</span>
            </button>
            <button
              type="button"
              className={`sars-media-tab ${activeTab === 'video' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('video')}
            >
              <Film size={13} />
              <span>MP4 Video Player</span>
            </button>
            <button
              type="button"
              className={`sars-media-tab ${activeTab === 'gallery' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('gallery')}
            >
              <ImageIcon size={13} />
              <span>SAR Raster Lightbox ({event.layers.length})</span>
            </button>
          </div>

          <button
            type="button"
            className="sars-modal-close"
            onClick={onClose}
            title="Close Media Viewer (Esc)"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="sars-modal-body">
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
                  <span>Split Wipe: {Math.round(splitPercent)}%</span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={splitPercent}
                    onChange={(e) => setSplitPercent(parseFloat(e.target.value))}
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

              {/* Split-Screen Canvas */}
              <div
                className="sars-comparator-stage"
                onMouseMove={handleComparatorMouseMove}
                onMouseLeave={() => setProbeReadout(null)}
              >
                {rightLayer && layerUrls[rightLayer.id] && (
                  <img
                    src={layerUrls[rightLayer.id]}
                    alt={rightLayer.title}
                    className="sars-comparator-img sars-comparator-img--right"
                    draggable={false}
                  />
                )}

                {leftLayer && layerUrls[leftLayer.id] && (
                  <img
                    src={layerUrls[leftLayer.id]}
                    alt={leftLayer.title}
                    className="sars-comparator-img sars-comparator-img--left"
                    style={{ clipPath: `inset(0 ${100 - splitPercent}% 0 0)` }}
                    draggable={false}
                  />
                )}

                <div
                  className="sars-comparator-divider"
                  style={{ left: `${splitPercent}%` }}
                >
                  <span className="sars-comparator-divider__handle">⇔</span>
                </div>

                <span className="sars-comparator-corner-tag sars-comparator-corner-tag--left">
                  A: {leftLayer?.title}
                </span>
                <span className="sars-comparator-corner-tag sars-comparator-corner-tag--right">
                  B: {rightLayer?.title}
                </span>

                {probeReadout && (
                  <div className="sars-comparator-probe">
                    <Crosshair size={12} style={{ color: probeReadout.reading.color }} />
                    <strong>{probeReadout.reading.dbText}</strong>
                    <span> · {probeReadout.reading.regime}</span>
                    <span> · {probeReadout.layerLabel}</span>
                  </div>
                )}
              </div>

              <p className="sars-comparator-caption">
                Drag the slider to compare multi-polarization or interferometric SAR layers side by
                side. Hover over the radar scene to inspect local backscatter / phase values.
              </p>
            </div>
          )}

          {activeTab === 'video' && (
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
                  <Film size={28} />
                  <h3>Video demonstration not yet available for this event.</h3>
                  <p>
                    No external MP4 file is currently bundled for{' '}
                    <strong>{event.eventName}</strong>. You can attach a local MP4/WebM
                    demonstration video below or inspect the verified multi-layer radar rasters in
                    the <strong>Interactive SAR Split-Screen</strong> tab.
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
                      Switch to Interactive SAR Split-Screen Demo
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'gallery' && (
            <div className="sars-gallery-grid">
              {event.layers.map((layer) => (
                <div key={layer.id} className="sars-gallery-card">
                  <div className="sars-gallery-card__img-wrap">
                    {layerUrls[layer.id] ? (
                      <img src={layerUrls[layer.id]} alt={layer.title} />
                    ) : (
                      <div className="sars-report-layer-item__placeholder">Loading…</div>
                    )}
                  </div>
                  <div className="sars-gallery-card__meta">
                    <h4>{layer.title}</h4>
                    <p>
                      {layer.sensor} · {layer.band} · Pol: {layer.polarization} ·{' '}
                      {layer.acquisition_date}
                    </p>
                    {layer.legend.length > 0 && (
                      <div className="sars-colorbar">
                        <div
                          className="sars-colorbar__gradient"
                          style={{
                            background: `linear-gradient(90deg, ${layer.legend
                              .map((s) => s.color)
                              .join(', ')})`
                          }}
                        />
                        <div className="sars-colorbar__labels">
                          <span>{layer.legend[0]?.label}</span>
                          <span>{layer.polarization}</span>
                          <span>{layer.legend[layer.legend.length - 1]?.label}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
