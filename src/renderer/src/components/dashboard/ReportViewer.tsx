import React, { useEffect, useState } from 'react'
import {
  Bar,
  BarChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import { BookOpen, Calendar, ExternalLink, Layers, MapPin, Radar, X } from 'lucide-react'
import type { EventRecord } from '../../types/phenomenon'
import { loadSarAssetDataUrl } from '../../services/phenomenonDataService'
import { SarPenetrationDiagram } from './SarPenetrationDiagram'

export interface ReportViewerProps {
  event: EventRecord | null
  onClose: () => void
  onSelectLayerOnGlobe: (layerId: string) => void
}

export const ReportViewer: React.FC<ReportViewerProps> = ({
  event,
  onClose,
  onSelectLayerOnGlobe
}) => {
  const [layerUrls, setLayerUrls] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!event) return
    let cancelled = false
    const loadAll = async (): Promise<void> => {
      const next: Record<string, string> = {}
      for (const layer of event.layers) {
        const url = await loadSarAssetDataUrl(layer.asset_path)
        if (url && !cancelled) {
          next[layer.id] = url
        }
      }
      if (!cancelled) {
        setLayerUrls(next)
      }
    }
    loadAll()
    return () => {
      cancelled = true
    }
  }, [event])

  useEffect(() => {
    if (!event) return
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [event, onClose])

  if (!event) return null

  const histogramData = event.comparisonPair?.histogram ?? []
  const exp = event.scientificExplanation

  return (
    <div className="sars-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="sars-modal-window sars-report-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="sars-modal-header">
          <div className="sars-modal-header__left">
            <span className="sars-modal-badge">
              <BookOpen size={12} />
              <span>SCIENTIFIC INCIDENT REPORT · {event.provenance}</span>
            </span>
            <h2 className="sars-modal-title">{event.eventName}</h2>
            <div className="sars-modal-subtitle">
              <span>
                <MapPin size={12} /> {event.regionName}, {event.country} (
                {event.latitude.toFixed(2)}°, {event.longitude.toFixed(2)}°)
              </span>
              <span>
                <Calendar size={12} /> {event.displayDate} (Timeline: {event.eventDate})
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
            title="Close Report (Esc)"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="sars-modal-body">
          {/* Top Summary Metrics Banner */}
          <div className="sars-report-metrics-grid">
            <div className="sars-report-stat-box">
              <span className="sars-report-stat-box__label">HEADLINE METRIC</span>
              <span className="sars-report-stat-box__value">{event.headlineMetric}</span>
            </div>
            <div className="sars-report-stat-box">
              <span className="sars-report-stat-box__label">MAGNITUDE / STAGE</span>
              <span className="sars-report-stat-box__value">
                {event.magnitude ?? event.headlineMetric}
              </span>
            </div>
            <div className="sars-report-stat-box">
              <span className="sars-report-stat-box__label">SEVERITY / SHIFT</span>
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

          {/* Two-Column Narrative & Physics */}
          <div className="sars-report-two-col">
            <div className="sars-report-card">
              <h3 className="sars-report-section-title">1. What Happened &amp; Observations</h3>
              <p className="sars-report-paragraph">{exp.whatHappened.description}</p>
              <p className="sars-report-paragraph">
                <strong>Key Observations:</strong> {exp.whatHappened.observations}
              </p>
            </div>

            <div className="sars-report-card">
              <h3 className="sars-report-section-title">
                2. SAR Electromagnetic Physics &amp; Detection Mechanism
              </h3>
              <p className="sars-report-paragraph">
                <strong>Primary Mechanism:</strong> {exp.whySarDetectsIt.primaryMechanism}
              </p>
              <p className="sars-report-paragraph">
                <strong>Roughness &amp; Backscatter:</strong>{' '}
                {exp.whySarDetectsIt.roughnessAndBackscatter}
              </p>
              <p className="sars-report-paragraph">
                <strong>Dielectric Constant &amp; Moisture:</strong>{' '}
                {exp.whySarDetectsIt.dielectricAndMoisture}
              </p>
              <p className="sars-report-paragraph">
                <strong>Polarization &amp; Wavelength:</strong>{' '}
                {exp.whySarDetectsIt.polarizationAndWavelength}
              </p>
              <SarPenetrationDiagram />
            </div>
          </div>

          {/* Drivers/Impacts & Backscatter Distribution */}
          <div className="sars-report-two-col">
            <div className="sars-report-card">
              <h3 className="sars-report-section-title">
                3. Environmental &amp; Human Drivers / Impact
              </h3>
              <p className="sars-report-paragraph">
                <strong>Natural Driver:</strong> {event.causes.naturalDriver}
              </p>
              <p className="sars-report-paragraph">
                <strong>Human &amp; Infrastructure Context:</strong> {event.causes.humanDriver}
              </p>
              <p className="sars-report-paragraph">
                <strong>Overlay Reading Guide:</strong>{' '}
                {exp.environmentalAndHumanImpact.overlayReadingGuide}
              </p>
            </div>

            <div className="sars-report-card">
              <h3 className="sars-report-section-title">
                4. Radar Backscatter Shift ({event.comparisonPair?.before_label ?? 'Before'} vs.{' '}
                {event.comparisonPair?.after_label ?? 'After'})
              </h3>
              {histogramData.length > 0 ? (
                <div style={{ width: '100%', height: 175 }}>
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

          {/* Georeferenced SAR Overlays Gallery */}
          <div className="sars-report-card">
            <h3 className="sars-report-section-title">
              <Layers size={14} /> 5. Georeferenced SAR Visualization Products ({event.layers.length}{' '}
              Layers)
            </h3>
            <div className="sars-report-layers-grid">
              {event.layers.map((layer) => {
                const imgUrl = layerUrls[layer.id]
                return (
                  <div key={layer.id} className="sars-report-layer-item">
                    <div className="sars-report-layer-item__preview">
                      {imgUrl ? (
                        <img src={imgUrl} alt={layer.title} />
                      ) : (
                        <div className="sars-report-layer-item__placeholder">
                          Loading SAR Raster…
                        </div>
                      )}
                    </div>
                    <div className="sars-report-layer-item__info">
                      <div className="sars-report-layer-item__title">{layer.title}</div>
                      <p className="sars-report-layer-item__desc">
                        {layer.sensor} · {layer.band} · Pol: {layer.polarization} · Acquired:{' '}
                        {layer.acquisition_date}
                      </p>
                      <button
                        type="button"
                        className="sars-event-action-btn"
                        onClick={() => {
                          onSelectLayerOnGlobe(layer.id)
                          onClose()
                        }}
                      >
                        Activate Layer on 3D Globe
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Provenance & Citations */}
          <div className="sars-report-card">
            <h3 className="sars-report-section-title">
              6. Verified Satellite Granules &amp; Scientific References
            </h3>
            <div className="sars-report-granules">
              <strong>Primary Granule:</strong>{' '}
              <code>{event.satelliteMetadata.granuleId}</code>
            </div>
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
      </div>
    </div>
  )
}
