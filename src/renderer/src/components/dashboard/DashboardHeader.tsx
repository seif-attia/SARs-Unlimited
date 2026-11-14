import React from 'react'
import { ArrowUp, Compass, Search, X } from 'lucide-react'
import sarsLogoImg from '../../assets/sars-logo.png'
import sarsUnlimitedImg from '../../assets/sars-unlimited.png'
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
  searchQuery: string
  onChangeSearchQuery: (q: string) => void
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
  isTouring: boolean
  onToggleTour: () => void
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
  searchQuery,
  onChangeSearchQuery,
  showTelemetryHud,
  cameraTelemetry,
  datasetStatus,
  widgetVisibility,
  onToggleWidget,
  isTouring,
  onToggleTour,
  settingsProps
}) => {
  return (
    <header className="sars-top-header" role="banner">
      {/* LEFT: Brand Identity + Phenomenon Menu + Settings + Restore Pills */}
      <div className="sars-top-header__left">
        <div className="sars-brand">
          <img
            src={sarsLogoImg}
            alt=""
            aria-hidden="true"
            className="sars-brand__logo"
            draggable={false}
          />
          <img
            src={sarsUnlimitedImg}
            alt="SARs Unlimited"
            className="sars-brand__wordmark"
            draggable={false}
          />
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

        <button
          type="button"
          className={`sars-nav-pill sars-tour-pill ${isTouring ? 'is-touring' : ''}`}
          onClick={onToggleTour}
          title="Auto-fly Guided Tour through 8 signature 2015–2026 global & Amazon SAR crises"
        >
          <Compass size={13} className="sars-nav-pill__icon" />
          <span>{isTouring ? 'Stop Tour' : 'Tour'}</span>
        </button>
      </div>

      {/* RIGHT: Demo Status, Telemetry & Search Box */}
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

        <div className="sars-search-box">
          <Search size={13} className="sars-search-box__icon" />
          <input
            type="text"
            className="sars-search-box__input"
            placeholder="Ask anything..."
            value={searchQuery}
            onChange={(e) => onChangeSearchQuery(e.target.value)}
            aria-label="Filter SAR events or regions"
          />
          {searchQuery ? (
            <button
              type="button"
              className="sars-search-box__clear"
              onClick={() => onChangeSearchQuery('')}
              title="Clear filter"
            >
              <X size={12} />
            </button>
          ) : (
            <span className="sars-search-box__submit" aria-hidden="true">
              <ArrowUp size={12} />
            </span>
          )}
        </div>
      </div>
    </header>
  )
}
