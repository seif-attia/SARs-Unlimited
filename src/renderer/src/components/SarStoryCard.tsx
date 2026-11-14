import { Activity, Droplets, Flame, Layers, Radio, Satellite, Waves, X } from 'lucide-react'
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
  if (!item) return null

  const layers = item.layers
  const physics = item.sar_physics
  const drivers = item.drivers
  const accentColor = item.color

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
                  <Activity size={13} /> AMAZON ANNUAL RHYTHM (2020–2026 MEAN)
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
