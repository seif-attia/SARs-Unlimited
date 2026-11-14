import React from 'react'
import { PanelBottomClose } from 'lucide-react'
import type {
  EventRecord,
  PhenomenonDefinition,
  ScientificExplanationContent
} from '../../types/phenomenon'
import { SarPenetrationDiagram } from './SarPenetrationDiagram'

export interface ScientificExplanationPanelProps {
  phenomenon: PhenomenonDefinition
  selectedEvent: EventRecord | null
  explanation: ScientificExplanationContent
  onHide: () => void
}

export const ScientificExplanationPanel: React.FC<ScientificExplanationPanelProps> = ({
  phenomenon,
  selectedEvent,
  explanation,
  onHide
}) => {
  const headerKicker = `PHENOMENON · ${phenomenon.scientificTitle}`
  const sensorBadge = selectedEvent
    ? `${selectedEvent.satelliteMetadata.sensor.toUpperCase()} · ${selectedEvent.satelliteMetadata.polarization.toUpperCase()}`
    : phenomenon.defaultSensorBadge

  return (
    <section
      className="sars-panel sars-bottom-panel"
      aria-label="Scientific Phenomenon Explanation Panel"
    >
      {/* Top Bar matching screenshot: PHENOMENON · SURFACE DEFORMATION on left, SENTINEL-1 · INSAR + Hide on right */}
      <div className="sars-bottom-panel__header">
        <div className="sars-bottom-panel__header-left">
          <span className="sars-bottom-panel__kicker">{headerKicker}</span>
        </div>

        <div className="sars-bottom-panel__header-right">
          <span className="sars-bottom-panel__sensor">{sensorBadge}</span>
          <button
            type="button"
            className="sars-hide-btn"
            onClick={onHide}
            title="Hide Scientific Explanation Panel"
          >
            <PanelBottomClose size={12} />
            <span>Hide</span>
          </button>
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
          <SarPenetrationDiagram compact />
        </div>

        <div className="sars-explanation-col">
          <h3 className="sars-explanation-col__title">
            How to read the overlay &amp; Impact
          </h3>
          <p className="sars-explanation-col__body">
            {explanation.environmentalAndHumanImpact.overlayReadingGuide}{' '}
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
