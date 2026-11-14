import React, { useEffect, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import { PanelLeftClose, Satellite } from 'lucide-react'
import type { SarOverlayLayer } from '../../types/sar'
import type { EventRecord, StatisticsPanelData } from '../../types/phenomenon'

export interface StatisticsPanelProps {
  statistics: StatisticsPanelData
  selectedEvent: EventRecord | null
  activeEventLayer: SarOverlayLayer | null
  onSelectEventLayer: (layerId: string) => void
  sarOverlayOpacity: number
  onChangeSarOverlayOpacity: (opacity: number) => void
  onHide: () => void
}

type PrimaryChartMode = 'yearly' | 'histogram' | 'seasonal'
type SeasonalMetricKey = 'discharge_m3s' | 'fire_hotspots' | 'precip_mm'

function inferSeasonalMetric(contextLabel: string): SeasonalMetricKey {
  const lower = contextLabel.toLowerCase()
  if (lower.includes('fire') || lower.includes('deforestation') || lower.includes('clearing')) {
    return 'fire_hotspots'
  }
  if (lower.includes('rain') || lower.includes('precip')) {
    return 'precip_mm'
  }
  return 'discharge_m3s'
}

export const StatisticsPanel: React.FC<StatisticsPanelProps> = ({
  statistics,
  selectedEvent,
  activeEventLayer,
  onSelectEventLayer,
  sarOverlayOpacity,
  onChangeSarOverlayOpacity,
  onHide
}) => {
  const firstTwoCards = statistics.topMetrics.slice(0, 2)
  const hasHistogram = Boolean(statistics.histogramSeries?.bins?.length)
  const hasSeasonal = Boolean(statistics.seasonalSeries?.length)

  const defaultChart1Mode: PrimaryChartMode =
    statistics.primaryChartType === 'backscatter_histogram' && hasHistogram
      ? 'histogram'
      : statistics.primaryChartType === 'seasonal_rhythm' && hasSeasonal
        ? 'seasonal'
        : 'yearly'

  const [chart1Mode, setChart1Mode] = useState<PrimaryChartMode>(defaultChart1Mode)
  const [seasonalMetric, setSeasonalMetric] = useState<SeasonalMetricKey>(() =>
    inferSeasonalMetric(statistics.contextLabel)
  )

  useEffect(() => {
    setChart1Mode(defaultChart1Mode)
    setSeasonalMetric(inferSeasonalMetric(statistics.contextLabel))
  }, [defaultChart1Mode, selectedEvent?.eventId, statistics.contextLabel])

  const effectiveChart1Mode: PrimaryChartMode =
    chart1Mode === 'histogram' && !hasHistogram
      ? defaultChart1Mode
      : chart1Mode === 'seasonal' && !hasSeasonal
        ? defaultChart1Mode
        : chart1Mode

  const chart1Title =
    effectiveChart1Mode === 'histogram'
      ? 'Before / Peak dB'
      : effectiveChart1Mode === 'seasonal'
        ? 'Annual Seasonal Pulse'
        : statistics.primaryChartTitle

  return (
    <aside className="sars-panel sars-left-panel" aria-label="Scientific Statistics Panel">
      {/* Header row matching screenshot: STATISTICS + Hide button */}
      <div className="sars-panel__header">
        <h2 className="sars-panel__title">STATISTICS</h2>
        <button
          type="button"
          className="sars-hide-btn"
          onClick={onHide}
          title="Hide Statistics Panel"
        >
          <PanelLeftClose size={12} />
          <span>Hide</span>
        </button>
      </div>

      {/* Top Two Headline Metric Cards matching screenshot */}
      <div className="sars-metric-cards">
        {firstTwoCards.map((card) => (
          <div key={card.id} className="sars-metric-card">
            <div className="sars-metric-card__label">{card.label}</div>
            <div className="sars-metric-card__value">{card.value}</div>
            {card.subtext && (
              <div className="sars-metric-card__sub" title={card.subtext}>
                {card.subtext}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Chart 1: Multi-mode Bar Chart (Yearly Events / Before-After dB Histogram / Seasonal Rhythm) */}
      <div className="sars-chart-box">
        <div className="sars-chart-box__header sars-chart-box__header--with-tabs">
          <span className="sars-chart-box__title">{chart1Title}</span>
          {(hasHistogram || hasSeasonal) && (
            <div className="sars-chart-tabs" role="tablist" aria-label="Chart view mode">
              <button
                type="button"
                className={`sars-chart-tab ${effectiveChart1Mode === 'yearly' ? 'is-active' : ''}`}
                onClick={() => setChart1Mode('yearly')}
              >
                Yearly
              </button>
              {hasHistogram && (
                <button
                  type="button"
                  className={`sars-chart-tab ${effectiveChart1Mode === 'histogram' ? 'is-active' : ''}`}
                  onClick={() => setChart1Mode('histogram')}
                >
                  dB Hist
                </button>
              )}
              {hasSeasonal && (
                <button
                  type="button"
                  className={`sars-chart-tab ${effectiveChart1Mode === 'seasonal' ? 'is-active' : ''}`}
                  onClick={() => setChart1Mode('seasonal')}
                >
                  Seasonal
                </button>
              )}
            </div>
          )}
        </div>

        {effectiveChart1Mode === 'histogram' && statistics.histogramSeries && (
          <div className="sars-chart-submeta">
            <span className="sars-chart-delta" title={statistics.histogramSeries.deltaSummary}>
              {statistics.histogramSeries.deltaSummary}
            </span>
            <span className="sars-chart-legend-mini">
              <span>■ {statistics.histogramSeries.beforeLabel}</span>
              <span style={{ color: selectedEvent?.accentColor ?? '#38bdf8' }}>
                ■ {statistics.histogramSeries.afterLabel}
              </span>
            </span>
          </div>
        )}

        {effectiveChart1Mode === 'seasonal' && hasSeasonal && (
          <div className="sars-chart-submeta">
            <span className="sars-chart-delta">2015–2026 monthly climatology</span>
            <div className="sars-chart-tabs">
              {(
                [
                  ['discharge_m3s', 'Flow'],
                  ['fire_hotspots', 'Fires'],
                  ['precip_mm', 'Rain']
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  className={`sars-chart-tab ${seasonalMetric === key ? 'is-active' : ''}`}
                  onClick={() => setSeasonalMetric(key)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="sars-chart-box__canvas">
          {effectiveChart1Mode === 'histogram' && statistics.histogramSeries ? (
            <ResponsiveContainer width="100%" height={116}>
              <BarChart
                data={statistics.histogramSeries.bins}
                margin={{ top: 6, right: 6, left: -24, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
                <XAxis
                  dataKey="range_db"
                  tick={{ fill: 'rgba(210, 224, 245, 0.62)', fontSize: 9 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: 'rgba(210, 224, 245, 0.45)', fontSize: 9 }}
                  axisLine={false}
                  tickLine={false}
                  unit="%"
                  width={30}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.06)' }}
                  contentStyle={{
                    background: 'rgba(13, 18, 28, 0.95)',
                    border: '1px solid rgba(148, 179, 228, 0.25)',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#f1f5f9'
                  }}
                />
                <Bar
                  dataKey="before_pct"
                  name={statistics.histogramSeries.beforeLabel}
                  fill="#64748b"
                  radius={[2, 2, 0, 0]}
                  isAnimationActive={false}
                />
                <Bar
                  dataKey="after_pct"
                  name={statistics.histogramSeries.afterLabel}
                  fill={selectedEvent?.accentColor ?? '#38bdf8'}
                  radius={[2, 2, 0, 0]}
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : effectiveChart1Mode === 'seasonal' && statistics.seasonalSeries ? (
            <ResponsiveContainer width="100%" height={116}>
              <BarChart
                data={statistics.seasonalSeries}
                margin={{ top: 6, right: 6, left: -18, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: 'rgba(210, 224, 245, 0.62)', fontSize: 9 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: 'rgba(210, 224, 245, 0.45)', fontSize: 9 }}
                  axisLine={false}
                  tickLine={false}
                  width={34}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.06)' }}
                  contentStyle={{
                    background: 'rgba(13, 18, 28, 0.95)',
                    border: '1px solid rgba(148, 179, 228, 0.25)',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#f1f5f9'
                  }}
                />
                <Bar
                  dataKey={seasonalMetric}
                  name={
                    seasonalMetric === 'fire_hotspots'
                      ? 'FIRMS Fires'
                      : seasonalMetric === 'precip_mm'
                        ? 'Precip (mm)'
                        : 'Discharge (m³/s)'
                  }
                  fill={
                    seasonalMetric === 'fire_hotspots'
                      ? '#f97316'
                      : seasonalMetric === 'precip_mm'
                        ? '#38bdf8'
                        : selectedEvent?.accentColor ?? '#22d3ee'
                  }
                  radius={[3, 3, 0, 0]}
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height={116}>
              <BarChart
                data={statistics.yearlySeries}
                margin={{ top: 8, right: 6, left: -24, bottom: 0 }}
              >
                <XAxis
                  dataKey="year"
                  tick={{ fill: 'rgba(210, 224, 245, 0.62)', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fill: 'rgba(210, 224, 245, 0.45)', fontSize: 9 }}
                  axisLine={false}
                  tickLine={false}
                  width={28}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.06)' }}
                  contentStyle={{
                    background: 'rgba(13, 18, 28, 0.95)',
                    border: '1px solid rgba(148, 179, 228, 0.25)',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#f1f5f9'
                  }}
                />
                <Bar
                  dataKey="events"
                  name="Events"
                  fill="#f8fafc"
                  radius={[4, 4, 2, 2]}
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Chart 2: Line Chart (Backscatter Profile / Hydrological Time-Series) */}
      <div className="sars-chart-box">
        <div className="sars-chart-box__header">
          <span className="sars-chart-box__title">{statistics.secondaryChartTitle}</span>
        </div>
        <div className="sars-chart-box__canvas">
          <ResponsiveContainer width="100%" height={112}>
            <LineChart
              data={statistics.timeSeries}
              margin={{ top: 8, right: 8, left: -22, bottom: 0 }}
            >
              <XAxis
                dataKey="label"
                tick={{ fill: 'rgba(210, 224, 245, 0.62)', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: 'rgba(210, 224, 245, 0.45)', fontSize: 9 }}
                axisLine={false}
                tickLine={false}
                width={30}
              />
              <Tooltip
                contentStyle={{
                  background: 'rgba(13, 18, 28, 0.95)',
                  border: '1px solid rgba(148, 179, 228, 0.25)',
                  borderRadius: '8px',
                  fontSize: '11px',
                  color: '#f1f5f9'
                }}
              />
              <Line
                type="monotone"
                dataKey="primaryValue"
                name={statistics.secondaryPrimaryLabel}
                stroke="#f8fafc"
                strokeWidth={2}
                dot={{ r: 2.2, fill: '#60a5fa' }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Active Event SAR Layer Selector & Legend */}
      {selectedEvent && selectedEvent.layers.length > 0 && (
        <div className="sars-layer-switcher">
          <div className="sars-layer-switcher__head">
            <span className="sars-layer-switcher__title">ACTIVE SAR OVERLAY</span>
            <span className="sars-layer-switcher__opacity">
              {Math.round(sarOverlayOpacity * 100)}%
            </span>
          </div>
          <div className="sars-layer-switcher__pills">
            {selectedEvent.layers.map((layer) => {
              const isAct = activeEventLayer?.id === layer.id
              return (
                <button
                  key={layer.id}
                  type="button"
                  className={`sars-layer-pill ${isAct ? 'is-active' : ''}`}
                  onClick={() => onSelectEventLayer(layer.id)}
                  title={`${layer.title} (${layer.sensor} · ${layer.polarization})`}
                >
                  {layer.title}
                </button>
              )
            })}
          </div>
          <input
            type="range"
            min={0.15}
            max={1}
            step={0.05}
            value={sarOverlayOpacity}
            onChange={(e) => onChangeSarOverlayOpacity(parseFloat(e.target.value))}
            className="sars-layer-opacity-slider"
            aria-label="SAR overlay opacity"
          />
          {activeEventLayer && activeEventLayer.legend.length > 0 && (
            <div className="sars-colorbar">
              <div
                className="sars-colorbar__gradient"
                style={{
                  background: `linear-gradient(90deg, ${activeEventLayer.legend
                    .map((s) => s.color)
                    .join(', ')})`
                }}
              />
              <div className="sars-colorbar__labels">
                <span>{activeEventLayer.legend[0]?.label}</span>
                <span>{activeEventLayer.polarization}</span>
                <span>
                  {activeEventLayer.legend[activeEventLayer.legend.length - 1]?.label}
                </span>
              </div>
            </div>
          )}
          {activeEventLayer && Object.keys(activeEventLayer.stats).length > 0 && (
            <div className="sars-stat-chips">
              {Object.entries(activeEventLayer.stats).map(([k, v]) => (
                <span key={k} className="sars-stat-chip">
                  <strong>{k.replace(/_/g, ' ')}:</strong> {String(v)}
                </span>
              ))}
            </div>
          )}
          {activeEventLayer?.granule_id && (
            <div className="sars-granule-tag" title={activeEventLayer.granule_id}>
              <Satellite size={11} />
              <span>
                {activeEventLayer.sensor} · {activeEventLayer.granule_id}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Provenance / Status Footer */}
      <div className="sars-panel__footer-note">{statistics.footnote}</div>
    </aside>
  )
}
