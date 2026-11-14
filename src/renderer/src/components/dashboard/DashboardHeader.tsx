import React from 'react'
import { Radar, Sparkles } from 'lucide-react'
import type {
  DatasetStatus,
  PhenomenonDefinition,
  WidgetVisibilityState
} from '../../types/phenomenon'
import { CategoriesMenu, PhenomenonMenu } from './PhenomenonMenu'
import { SettingsMenu, type SettingsMenuProps } from './SettingsMenu'
import { WidgetVisibilityControl } from './WidgetVisibilityControl'

export interface DashboardHeaderProps {
  globalPhenomena: PhenomenonDefinition[]
  amazonPhenomena: PhenomenonDefinition[]
  selectedPhenomenon: PhenomenonDefinition
  onSelectPhenomenon: (id: string) => void
  lockedRegionId: string | null
  onSelectAmazonRegion: (regionId: string | null) => void
  studyRegionOptions: Array<{ id: string; name: string }>
  isAiSidebarOpen: boolean
  onToggleAiSidebar: () => void
  showTelemetryHud: boolean
  cameraTelemetry: {
    lat: string
    lon: string
    alt: string
    heading: number
  }
  datasetStatus: DatasetStatus
  widgetVisibility: WidgetVisibilityState
  onToggleWidget: (widget: keyof WidgetVisibilityState) => void
  settingsProps: SettingsMenuProps
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  globalPhenomena,
  amazonPhenomena,
  selectedPhenomenon,
  onSelectPhenomenon,
  lockedRegionId,
  onSelectAmazonRegion,
  studyRegionOptions,
  isAiSidebarOpen,
  onToggleAiSidebar,
  showTelemetryHud,
  cameraTelemetry,
  datasetStatus,
  widgetVisibility,
  onToggleWidget,
  settingsProps
}) => {
  return (
    <header className="sars-top-header" role="banner">
      {/* LEFT: Brand Identity + Phenomenon Menu + Settings + Restore Pills */}
      <div className="sars-top-header__left">
        <div className="sars-brand">
          <span className="sars-brand__pulse" aria-hidden="true">
            <Radar size={14} />
          </span>
          <span className="sars-brand__title">SARS UNLIMITED</span>
        </div>

        <PhenomenonMenu
          globalPhenomena={globalPhenomena}
          amazonPhenomena={amazonPhenomena}
          selectedPhenomenon={selectedPhenomenon}
          onSelectPhenomenon={onSelectPhenomenon}
          onSelectAmazonRegion={onSelectAmazonRegion}
          lockedRegionId={lockedRegionId}
          studyRegionOptions={studyRegionOptions}
        />

        <CategoriesMenu
          selectedPhenomenon={selectedPhenomenon}
          onSelectPhenomenon={onSelectPhenomenon}
        />

        <WidgetVisibilityControl
          widgetVisibility={widgetVisibility}
          onToggleWidget={onToggleWidget}
        />

        <SettingsMenu {...settingsProps} />
      </div>

      {/* RIGHT: Demo Status, Telemetry & Local AI Ask for Help Button */}
      <div className="sars-top-header__right">
        {datasetStatus === 'DEMO' && (
          <div
            className="sars-demo-badge"
            title="Synthetic local demonstration overlay active — not genuine scientific SAR observations"
          >
            DEMO DATA — NOT SCIENTIFIC OBSERVATIONS
          </div>
        )}

        {showTelemetryHud && (
          <div className="sars-telemetry-pill" title="Camera Orbital Telemetry">
            <span>{cameraTelemetry.lat}</span>
            <span>{cameraTelemetry.lon}</span>
            <span className="sars-telemetry-pill__alt">{cameraTelemetry.alt}</span>
          </div>
        )}

        <button
          type="button"
          className={`sars-ask-help-btn ${isAiSidebarOpen ? 'is-active' : ''}`}
          onClick={onToggleAiSidebar}
          aria-expanded={isAiSidebarOpen}
          title="Open Local AI Assistant (Qwen2.5-3B-Instruct via WebLLM)"
        >
          <Sparkles size={14} className="sars-ask-help-btn__icon" />
          <span>Ask for help</span>
        </button>
      </div>
    </header>
  )
}
