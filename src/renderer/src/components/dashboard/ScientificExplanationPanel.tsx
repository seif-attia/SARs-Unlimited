import React from 'react'
import { PanelBottomClose } from 'lucide-react'
import type {
  EventRecord,
  PhenomenonDefinition,
  ScientificExplanationContent
} from '../../types/phenomenon'
import type { SarOverlayLayer } from '../../types/sar'
import { SarPenetrationDiagram } from './SarPenetrationDiagram'

export interface ScientificExplanationPanelProps {
  phenomenon: PhenomenonDefinition
  selectedEvent: EventRecord | null
  activeEventLayer?: SarOverlayLayer | null
  explanation: ScientificExplanationContent
  onHide: () => void
  embedded?: boolean
}

export const ScientificExplanationPanel: React.FC<ScientificExplanationPanelProps> = ({
  phenomenon,
  selectedEvent,
  activeEventLayer,
  explanation,
  onHide,
  embedded = false
}) => {
  const headerKicker = `PHENOMENON · ${phenomenon.scientificTitle}`
  const sensorBadge = selectedEvent
    ? `${selectedEvent.satelliteMetadata.sensor.toUpperCase()} · ${selectedEvent.satelliteMetadata.polarization.toUpperCase()}`
    : phenomenon.defaultSensorBadge

  return (
    <section
      className={embedded ? 'sars-tab-pane sars-explanation-pane' : 'sars-panel sars-bottom-panel'}
      aria-label="Scientific Phenomenon Explanation Panel"
    >
      {/* Top Bar */}
      <div className="sars-bottom-panel__header">
        <div className="sars-bottom-panel__header-left">
          <span className="sars-bottom-panel__kicker">{headerKicker}</span>
        </div>

        <div className="sars-bottom-panel__header-right">
          <span className="sars-bottom-panel__sensor">{sensorBadge}</span>
          {!embedded && (
            <button
              type="button"
              className="sars-hide-btn"
              onClick={onHide}
              title="Hide Scientific Explanation Panel"
            >
              <PanelBottomClose size={12} />
              <span>Hide</span>
            </button>
          )}
        </div>
      </div>

      {/* 4 Scientific Columns matching Screenshot & Part 8 Specification */}
      <div className="sars-bottom-panel__columns">
        <div className="sars-explanation-col">
          <h3 className="sars-explanation-col__title">What happened</h3>
          <p className="sars-explanation-col__body">
            {explanation.whatHappened.description} ({explanation.whatHappened.observations})
          </p>
        </div>

        <div className="sars-explanation-col">
          <h3 className="sars-explanation-col__title">
            Why SAR sees it ({explanation.whySarDetectsIt.primaryMechanism})
          </h3>
          <p className="sars-explanation-col__body">
            {explanation.whySarDetectsIt.roughnessAndBackscatter}{' '}
            {explanation.whySarDetectsIt.dielectricAndMoisture}{' '}
            {explanation.whySarDetectsIt.polarizationAndWavelength}
          </p>
          <SarPenetrationDiagram compact={!embedded} />
        </div>

        <div className="sars-explanation-col">
          <h3 className="sars-explanation-col__title">
            How to read the overlay &amp; Impact
          </h3>
          {activeEventLayer && activeEventLayer.legend.length > 0 ? (
            <div className="sars-explanation-swatches">
              <div className="sars-swatch-pills is-compact">
                {activeEventLayer.legend.map((entry, idx) => (
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
            </div>
          ) : (
            <p className="sars-explanation-col__body">
              {explanation.environmentalAndHumanImpact.overlayReadingGuide.replace(
                /\s*\(#[0-9a-fA-F]{3,8}\)/g,
                ''
              )}
            </p>
          )}
          <p className="sars-explanation-col__body">
            {explanation.environmentalAndHumanImpact.environmentalImpact}
          </p>
        </div>

        <div className="sars-explanation-col">
          <h3 className="sars-explanation-col__title">Data used</h3>
          <p className="sars-explanation-col__body">
            {explanation.dataUsedAndMethodology.satelliteMission} (
            {explanation.dataUsedAndMethodology.sensorAndBand}) ·{' '}
            {explanation.dataUsedAndMethodology.processingMethodology}
          </p>
        </div>
      </div>
    </section>
  )
}
