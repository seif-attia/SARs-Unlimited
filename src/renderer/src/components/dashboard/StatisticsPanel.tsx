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
import type { EventRecord, MetricCardItem, StatisticsPanelData } from '../../types/phenomenon'

export interface StatisticsPanelProps {
  statistics: StatisticsPanelData
  selectedEvent: EventRecord | null
  activeEventLayer: SarOverlayLayer | null
  onSelectEventLayer: (layerId: string) => void
  sarOverlayOpacity: number
  onChangeSarOverlayOpacity: (opacity: number) => void
  onHide: () => void
}

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

function formatCompactAxisTick(value: number): string {
  const abs = Math.abs(value)
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `${Math.round(value / 1_000)}k`
  return String(value)
}

function isCompactMetricCard(card: MetricCardItem): boolean {
  return (
    card.value.length <= 8 &&
    card.label.length <= 13 &&
    (card.subtext?.length ?? 0) <= 22
  )
}

const CHART_TOOLTIP_STYLE: React.CSSProperties = {
  background: 'rgba(13, 18, 28, 0.95)',
  border: '1px solid rgba(148, 179, 228, 0.25)',
  borderRadius: '8px',
  fontSize: '11px',
  color: '#f1f5f9'
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
  const hasHistogram = Boolean(statistics.histogramSeries?.bins?.length)
  const hasSeasonal = Boolean(statistics.seasonalSeries?.length)
  const hasS1Scenes = statistics.yearlySeries.some((pt) => (pt.s1Scenes ?? 0) > 0)
  const hasNisarScenes = statistics.yearlySeries.some((pt) => (pt.nisarScenes ?? 0) > 0)
  const hasSecondarySeries =
    Boolean(statistics.secondarySecondaryLabel) &&
    statistics.timeSeries.some((pt) => typeof pt.secondaryValue === 'number')

  const [seasonalMetric, setSeasonalMetric] = useState<SeasonalMetricKey>(() =>
    inferSeasonalMetric(statistics.contextLabel)
  )

  useEffect(() => {
    setSeasonalMetric(inferSeasonalMetric(statistics.contextLabel))
  }, [selectedEvent?.eventId, statistics.contextLabel])

  // Pair cards 0 and 1 on the top row only if both are compact; all detailed or subsequent cards span full width.
  const canPairFirstTwo =
    statistics.topMetrics.length >= 2 &&
    isCompactMetricCard(statistics.topMetrics[0]) &&
    isCompactMetricCard(statistics.topMetrics[1])

  // Compare primary vs secondary line magnitudes so wildly different units use a dedicated right axis.
  const useDualSecondaryAxis = (() => {
    if (!hasSecondarySeries) return false
    if (statistics.secondaryChartUnit === '%') return false
    const maxPrimary = Math.max(
      1,
      ...statistics.timeSeries.map((pt) => Math.abs(pt.primaryValue))
    )
    const maxSecondary = Math.max(
      1,
      ...statistics.timeSeries.map((pt) => Math.abs(pt.secondaryValue ?? 0))
    )
    const ratio = Math.max(maxPrimary / maxSecondary, maxSecondary / maxPrimary)
    return ratio > 2.5
  })()

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

      {/* Full wrapped context subtitle so selected phenomenon/event is never clipped */}
      {statistics.contextLabel && (
        <div className="sars-stats-context-banner">{statistics.contextLabel}</div>
      )}

      {/* All Metric Cards (expanded vertically, full multi-line text wrapping) */}
      <div className="sars-metric-cards">
        {statistics.topMetrics.map((card, index) => {
          const isWide = !(canPairFirstTwo && index < 2)
          return (
            <div
              key={card.id}
              className={`sars-metric-card ${isWide ? 'sars-metric-card--wide' : ''} ${
                card.highlight ? 'is-highlight' : ''
              }`}
            >
              <div className="sars-metric-card__label">{card.label}</div>
              <div className="sars-metric-card__value">{card.value}</div>
              {card.subtext && <div className="sars-metric-card__sub">{card.subtext}</div>}
            </div>
          )
        })}
      </div>

      {/* Chart 1: Yearly Events & SAR Scene Acquisitions (2015–2026) */}
      {statistics.yearlySeries.length > 0 && (
        <div className="sars-chart-box">
          <div className="sars-chart-box__header">
            <span className="sars-chart-box__title">{statistics.primaryChartTitle}</span>
          </div>
          <div className="sars-chart-legend-mini">
            <span className="sars-chart-legend-item">
              <i className="sars-legend-swatch" style={{ background: '#f8fafc' }} />
              Events (left)
            </span>
            {hasS1Scenes && (
              <span className="sars-chart-legend-item">
                <i className="sars-legend-swatch" style={{ background: '#38bdf8' }} />
                Sentinel-1 (right)
              </span>
            )}
            {hasNisarScenes && (
              <span className="sars-chart-legend-item">
                <i className="sars-legend-swatch" style={{ background: '#a78bfa' }} />
                NISAR (right)
              </span>
            )}
          </div>
          <div className="sars-chart-box__canvas">
            <ResponsiveContainer width="100%" height={158}>
              <BarChart
                data={statistics.yearlySeries}
                margin={{ top: 8, right: 4, left: 0, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
                <XAxis
                  dataKey="year"
                  tick={{ fill: 'rgba(210, 224, 245, 0.72)', fontSize: 9 }}
                  axisLine={false}
                  tickLine={false}
                  interval={1}
                />
                <YAxis
                  yAxisId="events"
                  allowDecimals={false}
                  tick={{ fill: 'rgba(248, 250, 252, 0.68)', fontSize: 9 }}
                  axisLine={false}
                  tickLine={false}
                  width={26}
                />
                {(hasS1Scenes || hasNisarScenes) && (
                  <YAxis
                    yAxisId="scenes"
                    orientation="right"
                    tick={{ fill: 'rgba(56, 189, 248, 0.75)', fontSize: 9 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={formatCompactAxisTick}
                    width={32}
                  />
                )}
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.06)' }} contentStyle={CHART_TOOLTIP_STYLE} />
                <Bar
                  yAxisId="events"
                  dataKey="events"
                  name="Events"
                  fill="#f8fafc"
                  radius={[3, 3, 0, 0]}
                  isAnimationActive={false}
                />
                {hasS1Scenes && (
                  <Bar
                    yAxisId="scenes"
                    stackId="scenes"
                    dataKey="s1Scenes"
                    name="Sentinel-1 Scenes"
                    fill="#38bdf8"
                    fillOpacity={0.65}
                    isAnimationActive={false}
                  />
                )}
                {hasNisarScenes && (
                  <Bar
                    yAxisId="scenes"
                    stackId="scenes"
                    dataKey="nisarScenes"
                    name="NISAR Scenes"
                    fill="#a78bfa"
                    radius={[3, 3, 0, 0]}
                    isAnimationActive={false}
                  />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Chart 2 (Expanded Vertical Section): Before / Peak Backscatter (dB) Histogram */}
      {hasHistogram && statistics.histogramSeries && (
        <div className="sars-chart-box">
          <div className="sars-chart-box__header">
            <span className="sars-chart-box__title">Backscatter Distribution (σ⁰ dB)</span>
          </div>
          <div className="sars-chart-submeta">
            <span className="sars-chart-delta">{statistics.histogramSeries.deltaSummary}</span>
            <div className="sars-chart-legend-mini">
              <span className="sars-chart-legend-item">
                <i className="sars-legend-swatch" style={{ background: '#64748b' }} />
                {statistics.histogramSeries.beforeLabel}
              </span>
              <span
                className="sars-chart-legend-item"
                style={{ color: selectedEvent?.accentColor ?? '#38bdf8' }}
              >
                <i
                  className="sars-legend-swatch"
                  style={{ background: selectedEvent?.accentColor ?? '#38bdf8' }}
                />
                {statistics.histogramSeries.afterLabel}
              </span>
            </div>
          </div>
          <div className="sars-chart-box__canvas">
            <ResponsiveContainer width="100%" height={162}>
              <BarChart
                data={statistics.histogramSeries.bins}
                margin={{ top: 8, right: 8, left: 0, bottom: 14 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
                <XAxis
                  dataKey="range_db"
                  tick={{ fill: 'rgba(210, 224, 245, 0.72)', fontSize: 8.5 }}
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                  angle={-22}
                  textAnchor="end"
                  height={32}
                />
                <YAxis
                  tick={{ fill: 'rgba(210, 224, 245, 0.65)', fontSize: 9 }}
                  axisLine={false}
                  tickLine={false}
                  unit="%"
                  width={34}
                />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.06)' }} contentStyle={CHART_TOOLTIP_STYLE} />
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
          </div>
        </div>
      )}

      {/* Chart 3 (Expanded Vertical Section): 12-Month Seasonal Climatology Pulse */}
      {hasSeasonal && statistics.seasonalSeries && (
        <div className="sars-chart-box">
          <div className="sars-chart-box__header sars-chart-box__header--with-tabs">
            <span className="sars-chart-box__title">12-Month Seasonal Climatology Pulse</span>
          </div>
          <div className="sars-chart-submeta">
            <span className="sars-chart-delta">2015–2026 monthly climatology</span>
            <div className="sars-chart-tabs">
              {(
                [
                  ['discharge_m3s', 'Flow (m³/s)'],
                  ['fire_hotspots', 'Fire Hotspots'],
                  ['precip_mm', 'Precip (mm)']
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
          <div className="sars-chart-box__canvas">
            <ResponsiveContainer width="100%" height={156}>
              <BarChart
                data={statistics.seasonalSeries}
                margin={{ top: 8, right: 8, left: 0, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: 'rgba(210, 224, 245, 0.72)', fontSize: 9 }}
                  axisLine={false}
                  tickLine={false}
                  interval={1}
                />
                <YAxis
                  tick={{ fill: 'rgba(210, 224, 245, 0.65)', fontSize: 9 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={formatCompactAxisTick}
                  width={36}
                />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.06)' }} contentStyle={CHART_TOOLTIP_STYLE} />
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
          </div>
        </div>
      )}

      {/* Chart 4: Secondary Line Chart (Backscatter Profile / Multi-Series Hydrological Time-Series) */}
      {statistics.timeSeries.length > 0 && (
        <div className="sars-chart-box">
          <div className="sars-chart-box__header">
            <span className="sars-chart-box__title">{statistics.secondaryChartTitle}</span>
          </div>
          <div className="sars-chart-legend-mini">
            <span className="sars-chart-legend-item">
              <i className="sars-legend-swatch" style={{ background: '#60a5fa' }} />
              {statistics.secondaryPrimaryLabel}
              {useDualSecondaryAxis ? ' (left)' : ''}
            </span>
            {hasSecondarySeries && statistics.secondarySecondaryLabel && (
              <span className="sars-chart-legend-item" style={{ color: '#fbbf24' }}>
                <i className="sars-legend-swatch" style={{ background: '#f59e0b' }} />
                {statistics.secondarySecondaryLabel}
                {useDualSecondaryAxis ? ' (right)' : ''}
              </span>
            )}
          </div>
          <div className="sars-chart-box__canvas">
            <ResponsiveContainer width="100%" height={158}>
              <LineChart
                data={statistics.timeSeries}
                margin={{ top: 8, right: 6, left: 0, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: 'rgba(210, 224, 245, 0.72)', fontSize: 9 }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  yAxisId="primary"
                  tick={{ fill: 'rgba(147, 197, 253, 0.85)', fontSize: 9 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={formatCompactAxisTick}
                  width={36}
                />
                {useDualSecondaryAxis && (
                  <YAxis
                    yAxisId="secondary"
                    orientation="right"
                    tick={{ fill: 'rgba(251, 191, 36, 0.85)', fontSize: 9 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={formatCompactAxisTick}
                    width={32}
                  />
                )}
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                <Line
                  yAxisId="primary"
                  type="monotone"
                  dataKey="primaryValue"
                  name={statistics.secondaryPrimaryLabel}
                  stroke="#60a5fa"
                  strokeWidth={2}
                  dot={{ r: 2, fill: '#93c5fd' }}
                  isAnimationActive={false}
                />
                {hasSecondarySeries && statistics.secondarySecondaryLabel && (
                  <Line
                    yAxisId={useDualSecondaryAxis ? 'secondary' : 'primary'}
                    type="monotone"
                    dataKey="secondaryValue"
                    name={statistics.secondarySecondaryLabel}
                    stroke="#f59e0b"
                    strokeWidth={1.75}
                    dot={false}
                    isAnimationActive={false}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Active Event SAR Layer Selector, Full Vertical Legend & Telemetry Stats */}
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
          {activeEventLayer && (
            <div className="sars-layer-meta-line">
              {activeEventLayer.sensor} · {activeEventLayer.band} · {activeEventLayer.polarization} ·{' '}
              {activeEventLayer.acquisition_date}
            </div>
          )}
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
              <div className="sars-colorbar__legend-list">
                {activeEventLayer.legend.map((entry, idx) => (
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
          {activeEventLayer && Object.keys(activeEventLayer.stats).length > 0 && (
            <div className="sars-stat-chips">
              {Object.entries(activeEventLayer.stats).map(([k, v]) => (
                <div key={k} className="sars-stat-chip">
                  <strong>{k.replace(/_/g, ' ')}:</strong> <span>{String(v)}</span>
                </div>
              ))}
            </div>
          )}
          {activeEventLayer?.granule_id && (
            <div className="sars-granule-tag">
              <Satellite size={11} className="sars-granule-tag__icon" />
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
