import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Activity,
  Crosshair,
  Droplets,
  Flame,
  Layers,
  Radio,
  Satellite,
  SlidersHorizontal,
  Waves,
  X
} from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { AmazonEvent, AmazonPhenomenon, SarOverlayLayer } from '../types/sar'

interface SarStoryCardProps {
  mode: 'phenomenon' | 'event'
  phenomenon: AmazonPhenomenon | null
  event: AmazonEvent | null
  activeLayer: SarOverlayLayer | null
  overlayOpacity: number
  onSelectLayer: (layer: SarOverlayLayer) => void
  onChangeOpacity: (alpha: number) => void
  onClose: () => void
}

interface ProbeReading {
  dbText: string
  regime: string
  color: string
}

function classifyRadarPixel(
  r: number,
  g: number,
  b: number,
  a: number,
  eventId?: string
): ProbeReading {
  if (a < 18) {
    return {
      dbText: 'No change mask',
      regime: 'Unchanged canopy / transparent ocean background',
      color: '#94a3b8'
    }
  }
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  if (Math.abs(r - g) < 16 && Math.abs(g - b) < 16) {
    const db = (-22.0 + lum * 18.0).toFixed(1)
    const reg =
      lum < 0.3
        ? 'Smooth Specular Water / Burn Scar'
        : lum > 0.72
          ? 'Bright Trunk/Urban Double-Bounce'
          : 'Diffuse Forest Canopy Volume Scattering'
    return { dbText: `${db} dB`, regime: reg, color: lum < 0.3 ? '#38bdf8' : '#e2e8f0' }
  }
  if (b > r + 40 && g > 145) {
    return {
      dbText: '-18.5 dB',
      regime:
        eventId === 'antarctic_sea_ice_2023' || eventId === 'larsen_c_a68_2017'
          ? 'Open Rift / Marginal Sea-Ice Water'
          : 'Specular Floodwater Mirror (εr ≈ 80)',
      color: '#22d3ee'
    }
  }
  if (g > r + 35 && g > 165 && b < 185) {
    return {
      dbText: '-3.8 dB',
      regime: 'Flooded Forest Trunk–Water Double-Bounce',
      color: '#00e676'
    }
  }
  if (r > 180 && g < 155 && b < 135) {
    if (eventId === 'lapalma_volcano_2021') {
      return {
        dbText: '+3.6 ΔdB',
        regime: 'Jagged Cooling Aa-Basalt Lava Delta',
        color: '#f97316'
      }
    }
    return {
      dbText: '-15.8 dB',
      regime: 'Canopy Volume Loss / Burn & Clearing Scar',
      color: '#f43f5e'
    }
  }
  if (b > 160 && r > 125 && g < 145) {
    return {
      dbText: '-18.8 dB',
      regime:
        eventId === 'mauritius_spill_2020'
          ? 'Oil-Damped Capillary Bragg Slick'
          : 'L-Band Sub-Canopy / InSAR Phase Zone',
      color: '#c084fc'
    }
  }
  const estDb = (-19.0 + lum * 15.0).toFixed(1)
  return {
    dbText: `${estDb} dB`,
    regime: 'Dihedral / Mixed Backscatter Regime',
    color: '#fbbf24'
  }
}

export function SarStoryCard({
  mode,
  phenomenon,
  event,
  activeLayer,
  overlayOpacity,
  onSelectLayer,
  onChangeOpacity,
  onClose
}: SarStoryCardProps): React.JSX.Element | null {
  const item = mode === 'event' ? event : phenomenon
  const layers = useMemo(() => item?.layers ?? [], [item])
  const compareLayer = useMemo(() => {
    if (!activeLayer || layers.length < 2) return activeLayer
    const others = layers.filter((l) => l.id !== activeLayer.id)
    return (
      others.find((l) => l.role === 'before') ??
      others.find((l) => l.role === 'cband_compare') ??
      others.find((l) => l.role === 'polarization') ??
      others.find((l) => l.role === 'after' || l.role === 'backscatter') ??
      others[0]
    )
  }, [activeLayer, layers])

  const [splitPct, setSplitPct] = useState<number>(50)
  const [activeImgUrl, setActiveImgUrl] = useState<string | null>(null)
  const [compareImgUrl, setCompareImgUrl] = useState<string | null>(null)
  const [probe, setProbe] = useState<ProbeReading | null>(null)
  const probeCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const draggingSplitRef = useRef<boolean>(false)

  useEffect(() => {
    let alive = true
    const pRight = activeLayer?.asset_path
    const pLeft = compareLayer?.asset_path
    if (!pRight) {
      return () => {
        alive = false
      }
    }
    window.api
      ?.getAssetDataUrl(pRight)
      .then((url) => {
        if (!alive) return
        setActiveImgUrl(url)
        const img = new Image()
        img.onload = () => {
          const cv = document.createElement('canvas')
          cv.width = 64
          cv.height = 64
          const ctx = cv.getContext('2d')
          if (ctx) {
            ctx.drawImage(img, 0, 0, 64, 64)
            probeCanvasRef.current = cv
          }
        }
        img.src = url
      })
      .catch(() => {
        if (alive) setActiveImgUrl(null)
      })

    if (pLeft && pLeft !== pRight) {
      window.api
        ?.getAssetDataUrl(pLeft)
        .then((url) => {
          if (alive) setCompareImgUrl(url)
        })
        .catch(() => {
          if (alive) setCompareImgUrl(null)
        })
    } else if (pLeft === pRight) {
      window.api
        ?.getAssetDataUrl(pRight)
        .then((url) => {
          if (alive) setCompareImgUrl(url)
        })
        .catch(() => {
          if (alive) setCompareImgUrl(null)
        })
    }
    return () => {
      alive = false
    }
  }, [activeLayer?.asset_path, compareLayer?.asset_path])

  if (!item) return null

  const physics = item.sar_physics
  const drivers = item.drivers
  const accentColor = item.color

  const handleViewportPointer = (
    e: React.PointerEvent<HTMLDivElement>,
    updateSplit: boolean
  ): void => {
    const rect = e.currentTarget.getBoundingClientRect()
    const u = Math.min(1, Math.max(0, (e.clientX - rect.left) / Math.max(rect.width, 1)))
    const v = Math.min(1, Math.max(0, (e.clientY - rect.top) / Math.max(rect.height, 1)))
    if (updateSplit) {
      setSplitPct(Math.round(u * 100))
    }
    const cv = probeCanvasRef.current
    if (cv) {
      const ctx = cv.getContext('2d')
      if (ctx) {
        const px = Math.min(63, Math.max(0, Math.floor(u * 64)))
        const py = Math.min(63, Math.max(0, Math.floor(v * 64)))
        const data = ctx.getImageData(px, py, 1, 1).data
        setProbe(classifyRadarPixel(data[0], data[1], data[2], data[3], event?.id))
      }
    }
  }

  return (
    <aside
      className="sar-story-card"
      style={{ ['--story-accent' as string]: accentColor } as React.CSSProperties}
      aria-label="SAR Surface Change Inspector"
    >
      {/* Header */}
      <div className="story-header">
        <div className="story-kicker-row">
          <span className="story-kicker">
            <Radio size={12} />
            {mode === 'event'
              ? `${event?.scope === 'global' ? 'GLOBAL SAR CRISIS' : 'AMAZON ANCHOR EVENT'} · ${event?.timing}`
              : `SEASONAL PHENOMENON · ${phenomenon?.typical_timing}`}
          </span>
          <button
            type="button"
            className="story-close-btn"
            onClick={onClose}
            title="Close Inspector"
          >
            <X size={15} />
          </button>
        </div>
        <h2 className="story-title">{item.name}</h2>
        {mode === 'event' && event?.headline_metric && (
          <div className="story-headline-badge">{event.headline_metric}</div>
        )}
        <p className="story-summary">{item.summary}</p>
      </div>

      {/* Scrollable Body */}
      <div className="story-scroll">
        {/* 1. Interactive 3D Globe Layer / Polarization / Before-After Switcher */}
        <section className="story-block">
          <div className="story-block-head">
            <span>
              <Layers size={13} /> 3D GLOBE RADAR OVERLAY &amp; POLARIZATION
            </span>
            <span className="story-opacity-label">{Math.round(overlayOpacity * 100)}% Opacity</span>
          </div>

          <div className="story-layer-pills">
            {layers.map((lyr) => {
              const selected = activeLayer?.id === lyr.id
              return (
                <button
                  key={lyr.id}
                  type="button"
                  className={`story-layer-btn ${selected ? 'active' : ''}`}
                  onClick={() => onSelectLayer(lyr)}
                >
                  <div className="story-layer-top">
                    <span className="story-layer-badge">
                      {lyr.band.split(' ')[0]} · {lyr.polarization}
                    </span>
                    <span className="story-layer-date">{lyr.acquisition_date}</span>
                  </div>
                  <div className="story-layer-name">{lyr.title}</div>
                </button>
              )
            })}
          </div>

          <input
            type="range"
            className="glass-slider"
            min={0.1}
            max={1}
            step={0.05}
            value={overlayOpacity}
            onChange={(e) => onChangeOpacity(Number(e.target.value))}
            style={
              { ['--glass-fill' as string]: `${overlayOpacity * 100}%` } as React.CSSProperties
            }
            aria-label="SAR overlay opacity"
          />

          {/* Interactive Split-Screen Swipe Curtain & Live Radar dB Cursor Probe */}
          {activeLayer && activeImgUrl && (
            <div className="sar-lab-panel">
              <div className="sar-lab-head">
                <span>
                  <SlidersHorizontal size={11} /> SWIPE COMPARATOR &amp; RADAR dB PROBE
                </span>
                <span className="sar-lab-split-pct">{splitPct}% Split</span>
              </div>
              <div
                className="sar-swipe-box"
                onPointerDown={(e) => {
                  draggingSplitRef.current = true
                  handleViewportPointer(e, true)
                }}
                onPointerMove={(e) => handleViewportPointer(e, draggingSplitRef.current)}
                onPointerUp={() => {
                  draggingSplitRef.current = false
                }}
                onPointerLeave={() => {
                  draggingSplitRef.current = false
                  setProbe(null)
                }}
                title="Hover to probe backscatter dB · Drag horizontally to swipe comparison layers"
              >
                {compareImgUrl && (
                  <img
                    src={compareImgUrl}
                    alt={compareLayer?.title ?? 'Baseline layer'}
                    className="sar-swipe-img"
                    draggable={false}
                  />
                )}
                <img
                  src={activeImgUrl}
                  alt={activeLayer.title}
                  className="sar-swipe-img"
                  style={{ clipPath: `inset(0 0 0 ${splitPct}%)` }}
                  draggable={false}
                />
                <div className="sar-swipe-divider" style={{ left: `${splitPct}%` }}>
                  <span className="sar-swipe-handle">⟷</span>
                </div>
                <span className="sar-swipe-tag left">
                  {compareLayer && compareLayer.id !== activeLayer.id
                    ? `${compareLayer.band.split(' ')[0]} · ${compareLayer.role}`
                    : activeLayer.polarization}
                </span>
                <span className="sar-swipe-tag right">
                  {activeLayer.band.split(' ')[0]} · {activeLayer.polarization}
                </span>
                <div className="sar-probe-pill">
                  <Crosshair size={11} style={{ color: probe?.color ?? '#38bdf8' }} />
                  {probe ? (
                    <span>
                      <strong>{probe.dbText}</strong> · {probe.regime}
                    </span>
                  ) : (
                    <span>Hover image to probe dB &amp; scattering regime</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Active Layer Legend & Measured Stats */}
          {activeLayer && (
            <div className="story-legend-box">
              <div className="story-legend-items">
                {activeLayer.legend.map((entry) => (
                  <div key={entry.label} className="story-legend-row">
                    <span className="legend-dot" style={{ backgroundColor: entry.color }} />
                    <span>{entry.label}</span>
                  </div>
                ))}
              </div>
              {Object.keys(activeLayer.stats).length > 0 && (
                <div className="story-stat-chips">
                  {Object.entries(activeLayer.stats).map(([k, v]) => (
                    <span key={k} className="story-stat-chip">
                      <strong>{k.replace(/_/g, ' ')}:</strong> {String(v)}
                    </span>
                  ))}
                </div>
              )}
              <div className="story-granule-tag" title={activeLayer.granule_id}>
                <Satellite size={11} />
                <span>
                  {activeLayer.sensor} · {activeLayer.granule_id}
                </span>
              </div>
            </div>
          )}
        </section>

        {/* 2. Dancing with the SARs: Roughness & Dielectric Constant Physics */}
        <section className="story-block">
          <div className="story-block-head">
            <span>
              <Waves size={13} /> SAR PHYSICS: {physics.primary_sensitivity.toUpperCase()}
            </span>
          </div>

          <div className="physics-grid">
            <div className="physics-card">
              <div className="physics-label">Surface &amp; Volume Roughness</div>
              <p>{physics.roughness_mechanism}</p>
            </div>
            <div className="physics-card">
              <div className="physics-label">
                <Droplets size={11} /> Dielectric Constant (Water vs. Dry Biomass)
              </div>
              <p>{physics.dielectric_mechanism}</p>
            </div>
            <div className="physics-card">
              <div className="physics-label">
                Polarization &amp; Wavelength (L 24 cm vs. C 5.6 cm)
              </div>
              <p>
                {physics.polarization_note} {physics.frequency_comparison}
              </p>
              {/* C / S / L-Band Vegetation & Flood Penetration Diagram */}
              <svg
                viewBox="0 0 300 84"
                className="sar-penetration-svg"
                role="img"
                aria-label="C-band 5.6 cm, S-band 12 cm, and NISAR L-band 24 cm canopy penetration diagram"
              >
                <defs>
                  <linearGradient id="waterFloor" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#0284c7" stopOpacity="0.65" />
                    <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.85" />
                  </linearGradient>
                </defs>
                {/* Ground / floodwater layer */}
                <rect x="0" y="68" width="300" height="16" rx="3" fill="url(#waterFloor)" />
                <text x="8" y="79" fill="#ecfeff" fontSize="7.5" fontWeight="700">
                  SOIL / FLOODWATER (εr ≈ 80) · DOUBLE-BOUNCE CORNER
                </text>
                {/* Simplified forest trunks & crowns */}
                <rect x="74" y="34" width="6" height="34" fill="#92400e" />
                <ellipse cx="77" cy="30" rx="22" ry="14" fill="#10b981" fillOpacity="0.72" />
                <rect x="166" y="32" width="6" height="36" fill="#92400e" />
                <ellipse cx="169" cy="27" rx="24" ry="15" fill="#059669" fillOpacity="0.75" />
                <rect x="250" y="34" width="6" height="34" fill="#92400e" />
                <ellipse cx="253" cy="29" rx="21" ry="14" fill="#10b981" fillOpacity="0.7" />
                {/* C-band 5.6 cm */}
                <path
                  d="M28 8 L72 22 L38 16"
                  stroke="#38bdf8"
                  strokeWidth="1.8"
                  fill="none"
                  strokeDasharray="3 2"
                />
                <text x="14" y="13" fill="#38bdf8" fontSize="8" fontWeight="700">
                  C-Band (5.6 cm): Crown Leaves
                </text>
                {/* S-band 12 cm */}
                <path
                  d="M118 8 L164 38 L128 24"
                  stroke="#c084fc"
                  strokeWidth="1.8"
                  fill="none"
                  strokeDasharray="4 2"
                />
                <text x="116" y="13" fill="#c084fc" fontSize="8" fontWeight="700">
                  S-Band (12 cm): Branches
                </text>
                {/* L-band 24 cm */}
                <path
                  d="M214 8 L249 67 L256 48 L224 16"
                  stroke="#fbbf24"
                  strokeWidth="2.1"
                  fill="none"
                />
                <text x="206" y="13" fill="#fbbf24" fontSize="8" fontWeight="700">
                  L-Band (24 cm): Trunks+Water
                </text>
              </svg>
            </div>
          </div>
        </section>

        {/* 3. Quantitative Comparison Chart (Event Before/After Histogram OR Seasonal Rhythm) */}
        {mode === 'event' && event?.comparison_pair ? (
          <section className="story-block">
            <div className="story-block-head">
              <span>
                <Activity size={13} /> BEFORE VS. PEAK BACKSCATTER DISTRIBUTION
              </span>
            </div>
            <div className="story-delta-summary">{event.comparison_pair.delta_summary}</div>
            <div className="story-chart-caption">
              <span>■ {event.comparison_pair.before_label}</span>
              <span style={{ color: accentColor }}>■ {event.comparison_pair.after_label}</span>
            </div>
            <div className="story-chart-box">
              <ResponsiveContainer width="100%" height={145}>
                <BarChart
                  data={event.comparison_pair.histogram}
                  margin={{ top: 6, right: 4, left: -24, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="range_db" tick={{ fill: '#94a3b8', fontSize: 9 }} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 9 }} unit="%" />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(9,15,27,0.92)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '10px',
                      fontSize: '11px'
                    }}
                  />
                  <Bar
                    dataKey="before_pct"
                    name="Baseline / Cross-Pol"
                    fill="#64748b"
                    radius={[2, 2, 0, 0]}
                  />
                  <Bar
                    dataKey="after_pct"
                    name="Event / Co-Pol"
                    fill={accentColor}
                    radius={[2, 2, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        ) : (
          phenomenon?.seasonal_rhythm && (
            <section className="story-block">
              <div className="story-block-head">
                <span>
                  <Activity size={13} /> AMAZON ANNUAL RHYTHM (2015–2026 MEAN)
                </span>
              </div>
              <div className="story-chart-box">
                <ResponsiveContainer width="100%" height={145}>
                  <BarChart
                    data={phenomenon.seasonal_rhythm}
                    margin={{ top: 6, right: 4, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                    <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 9 }} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 9 }} />
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(9,15,27,0.92)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '10px',
                        fontSize: '11px'
                      }}
                    />
                    <Bar
                      dataKey={
                        phenomenon.id === 'fire_season' || phenomenon.id === 'clearing_land_opening'
                          ? 'fire_hotspots'
                          : 'discharge_m3s'
                      }
                      name={
                        phenomenon.id === 'fire_season' || phenomenon.id === 'clearing_land_opening'
                          ? 'FIRMS Fires'
                          : 'Discharge m³/s'
                      }
                      fill={accentColor}
                      radius={[3, 3, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          )
        )}

        {/* 4. Physical & Human Drivers */}
        <section className="story-block">
          <div className="story-block-head">
            <span>
              <Flame size={13} /> PHYSICAL &amp; HUMAN DRIVERS
            </span>
          </div>
          <div className="drivers-list">
            <div>
              <strong>Natural Driver:</strong> {drivers.natural_driver}
            </div>
            <div>
              <strong>Human Driver:</strong> {drivers.human_driver}
            </div>
          </div>
        </section>
      </div>
    </aside>
  )
}
