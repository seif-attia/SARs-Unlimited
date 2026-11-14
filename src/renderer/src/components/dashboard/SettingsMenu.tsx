import React, { useEffect, useRef, useState } from 'react'
import { ChevronDown, RefreshCw, RotateCcw, Settings } from 'lucide-react'
import type { WidgetVisibilityState } from '../../types/phenomenon'

export interface SettingsMenuProps {
  // Earth Visualization settings (Protected existing GlobeViewer states)
  showTerrain: boolean
  onToggleTerrain: () => void
  darkMode: boolean // Earth at Night (VIIRS City Lights)
  onToggleDarkMode: () => void
  showLabels: boolean
  onToggleLabels: () => void
  showAtmosphere: boolean
  onToggleAtmosphere: () => void
  autoRotate: boolean
  onToggleAutoRotate: () => void
  showBasinProgression: boolean
  onToggleBasinProgression: () => void
  showEventPins: boolean
  onToggleEventPins: () => void
  sarOverlayOpacity: number
  onChangeSarOverlayOpacity: (opacity: number) => void

  // Interface Settings (Separate from Earth at Night)
  uiLightTheme: boolean
  onToggleUiLightTheme: () => void
  widgetVisibility: WidgetVisibilityState
  onToggleWidget: (widget: keyof WidgetVisibilityState) => void
  onRestoreAllWidgets: () => void

  // HUD Visibility Settings
  showTelemetryHud: boolean
  onToggleTelemetryHud: () => void
  showNavigationControls: boolean
  onToggleNavigationControls: () => void
  showBottomMapBar: boolean
  onToggleBottomMapBar: () => void
  showScaleLegend: boolean
  onToggleScaleLegend: () => void
  showCursorTooltip: boolean
  onToggleCursorTooltip: () => void

  // Actions & Custom Backend
  isRefreshing: boolean
  onRefreshImagery: () => void
  onResetOrbitView: () => void
  customApiBaseUrl: string
  onChangeCustomApiBaseUrl: (url: string) => void
  onApplyCustomApiBaseUrl: () => void
  backendConnected: boolean | null
  customOverlayUrl: string
  onChangeCustomOverlayUrl: (url: string) => void
  onLoadCustomOverlay: () => void
  onClearCustomOverlay: () => void
  customOverlayActive: boolean
  customOverlayLoading: boolean
  customOverlayStatus: string | null
  onToggleLegacyDemoOverlay: () => void
  legacyDemoOverlayActive: boolean
}

export const SettingsMenu: React.FC<SettingsMenuProps> = ({
  showTerrain,
  onToggleTerrain,
  darkMode,
  onToggleDarkMode,
  showLabels,
  onToggleLabels,
  showAtmosphere,
  onToggleAtmosphere,
  autoRotate,
  onToggleAutoRotate,
  showBasinProgression,
  onToggleBasinProgression,
  showEventPins,
  onToggleEventPins,
  sarOverlayOpacity,
  onChangeSarOverlayOpacity,
  uiLightTheme,
  onToggleUiLightTheme,
  widgetVisibility,
  onToggleWidget,
  onRestoreAllWidgets,
  showTelemetryHud,
  onToggleTelemetryHud,
  showNavigationControls,
  onToggleNavigationControls,
  showBottomMapBar,
  onToggleBottomMapBar,
  showScaleLegend,
  onToggleScaleLegend,
  showCursorTooltip,
  onToggleCursorTooltip,
  isRefreshing,
  onRefreshImagery,
  onResetOrbitView,
  customApiBaseUrl,
  onChangeCustomApiBaseUrl,
  onApplyCustomApiBaseUrl,
  backendConnected,
  customOverlayUrl,
  onChangeCustomOverlayUrl,
  onLoadCustomOverlay,
  onClearCustomOverlay,
  customOverlayActive,
  customOverlayLoading,
  customOverlayStatus,
  onToggleLegacyDemoOverlay,
  legacyDemoOverlayActive
}) => {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    const handleOutside = (e: MouseEvent): void => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    window.addEventListener('mousedown', handleOutside)
    return () => window.removeEventListener('mousedown', handleOutside)
  }, [open])

  return (
    <div className="sars-settings-wrapper" ref={ref}>
      <button
        type="button"
        className={`sars-nav-pill ${open ? 'is-open' : ''}`}
        onClick={() => setOpen((p) => !p)}
        title="Earth Visualization, Interface & HUD Settings"
      >
        <Settings size={13} className="sars-nav-pill__icon" />
        <span>Settings</span>
        <ChevronDown size={13} className={`sars-nav-pill__caret ${open ? 'is-open' : ''}`} />
      </button>

      {open && (
        <div className="sars-dropdown-popover sars-settings-popover" role="dialog" aria-label="Settings">
          <div className="sars-settings-grid">
            {/* Section 1: Earth Visualization */}
            <div className="sars-settings-section">
              <div className="sars-settings-section__title">EARTH VISUALIZATION</div>

              <label className="sars-toggle-row">
                <span>Topography (SRTM Hillshade)</span>
                <input type="checkbox" checked={showTerrain} onChange={onToggleTerrain} />
              </label>

              <label className="sars-toggle-row">
                <span>Earth at Night (VIIRS City Lights)</span>
                <input type="checkbox" checked={darkMode} onChange={onToggleDarkMode} />
              </label>

              <label className="sars-toggle-row">
                <span>Borders &amp; Place Labels</span>
                <input type="checkbox" checked={showLabels} onChange={onToggleLabels} />
              </label>

              <label className="sars-toggle-row">
                <span>3D Atmosphere &amp; Sky</span>
                <input type="checkbox" checked={showAtmosphere} onChange={onToggleAtmosphere} />
              </label>

              <label className="sars-toggle-row">
                <span>Orbital Auto-Rotation</span>
                <input type="checkbox" checked={autoRotate} onChange={onToggleAutoRotate} />
              </label>

              <label className="sars-toggle-row">
                <span>Amazon Monthly SAR Progression</span>
                <input
                  type="checkbox"
                  checked={showBasinProgression}
                  onChange={onToggleBasinProgression}
                />
              </label>

              <label className="sars-toggle-row">
                <span>On-Globe Event Callout Pins</span>
                <input type="checkbox" checked={showEventPins} onChange={onToggleEventPins} />
              </label>

              <div className="sars-slider-row">
                <div className="sars-slider-row__head">
                  <span>SAR Overlay Opacity</span>
                  <span>{Math.round(sarOverlayOpacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={0.15}
                  max={1}
                  step={0.05}
                  value={sarOverlayOpacity}
                  onChange={(e) => onChangeSarOverlayOpacity(parseFloat(e.target.value))}
                />
              </div>

              <div className="sars-settings-actions">
                <button
                  type="button"
                  className="sars-btn-subtle"
                  onClick={onRefreshImagery}
                  disabled={isRefreshing}
                >
                  <RefreshCw size={12} className={isRefreshing ? 'spin' : ''} />
                  <span>{isRefreshing ? 'Refreshing…' : 'Refresh Satellite Imagery'}</span>
                </button>
                <button type="button" className="sars-btn-subtle" onClick={onResetOrbitView}>
                  <RotateCcw size={12} />
                  <span>Reset Orbital View</span>
                </button>
              </div>
            </div>

            {/* Section 2: Interface & Dashboard Widgets */}
            <div className="sars-settings-section">
              <div className="sars-settings-section__title">INTERFACE &amp; WIDGETS</div>

              <label className="sars-toggle-row">
                <span>High-Contrast Light Glass UI</span>
                <input type="checkbox" checked={uiLightTheme} onChange={onToggleUiLightTheme} />
              </label>

              <label className="sars-toggle-row">
                <span>Historical Timeline Bar</span>
                <input
                  type="checkbox"
                  checked={widgetVisibility.timeline}
                  onChange={() => onToggleWidget('timeline')}
                />
              </label>

              <label className="sars-toggle-row">
                <span>Left Statistics Panel</span>
                <input
                  type="checkbox"
                  checked={widgetVisibility.statistics}
                  onChange={() => onToggleWidget('statistics')}
                />
              </label>

              <label className="sars-toggle-row">
                <span>Right Event Summary Panel</span>
                <input
                  type="checkbox"
                  checked={widgetVisibility.eventSummary}
                  onChange={() => onToggleWidget('eventSummary')}
                />
              </label>

              <label className="sars-toggle-row">
                <span>Bottom Scientific Explanation</span>
                <input
                  type="checkbox"
                  checked={widgetVisibility.scientificExplanation}
                  onChange={() => onToggleWidget('scientificExplanation')}
                />
              </label>

              <button
                type="button"
                className="sars-btn-subtle"
                onClick={onRestoreAllWidgets}
              >
                Restore All Dashboard Panels
              </button>

              <div className="sars-settings-section__title" style={{ marginTop: 10 }}>
                HUD &amp; TELEMETRY VISIBILITY
              </div>

              <label className="sars-toggle-row">
                <span>Header Camera Telemetry</span>
                <input type="checkbox" checked={showTelemetryHud} onChange={onToggleTelemetryHud} />
              </label>

              <label className="sars-toggle-row">
                <span>Cursor Geographic Inspector</span>
                <input
                  type="checkbox"
                  checked={showCursorTooltip}
                  onChange={onToggleCursorTooltip}
                />
              </label>

              <label className="sars-toggle-row">
                <span>Floating Zoom / Compass Controls</span>
                <input
                  type="checkbox"
                  checked={showNavigationControls}
                  onChange={onToggleNavigationControls}
                />
              </label>

              <label className="sars-toggle-row">
                <span>Legacy Map Mode Dock</span>
                <input type="checkbox" checked={showBottomMapBar} onChange={onToggleBottomMapBar} />
              </label>

              <label className="sars-toggle-row">
                <span>Altitude &amp; SAR Scale Legend</span>
                <input type="checkbox" checked={showScaleLegend} onChange={onToggleScaleLegend} />
              </label>
            </div>
          </div>

          {/* Section 3: External SARs-Data API / Calibration Demo Fallback */}
          <div className="sars-settings-footer">
            <div className="sars-settings-footer__row">
              <span className="sars-settings-section__title" style={{ margin: 0 }}>
                LIVE SARS-DATA BACKEND API ({backendConnected ? 'ONLINE' : 'OFFLINE ARCHIVE MODE'})
              </span>
              <button
                type="button"
                className={`sars-btn-subtle ${legacyDemoOverlayActive ? 'is-active' : ''}`}
                onClick={onToggleLegacyDemoOverlay}
                title="Toggle synthetic local calibration overlay (labeled as DEMO DATA)"
              >
                {legacyDemoOverlayActive
                  ? 'Disable Synthetic Demo Layer'
                  : 'Test Synthetic Demo Layer'}
              </button>
            </div>
            <div className="sars-settings-api-input">
              <input
                type="text"
                placeholder="http://localhost:8000"
                value={customApiBaseUrl}
                onChange={(e) => onChangeCustomApiBaseUrl(e.target.value)}
              />
              <button type="button" className="sars-btn-subtle" onClick={onApplyCustomApiBaseUrl}>
                Connect API
              </button>
            </div>

            <div className="sars-settings-custom-feed">
              <div className="sars-settings-footer__row">
                <span className="sars-settings-section__title" style={{ margin: 0 }}>
                  CUSTOM API OVERLAY FEED ({customOverlayActive ? 'OVERLAY ACTIVE' : 'IDLE'})
                </span>
                {customOverlayActive && (
                  <button
                    type="button"
                    className="sars-btn-subtle is-active"
                    onClick={onClearCustomOverlay}
                    title="Remove custom API overlay from the 3D Earth"
                  >
                    Clear Overlay
                  </button>
                )}
              </div>
              <div className="sars-settings-api-input">
                <input
                  type="text"
                  placeholder="https://.../tiles/{z}/{x}/{y}.png, .geojson, .png, or API URL"
                  value={customOverlayUrl}
                  onChange={(e) => onChangeCustomOverlayUrl(e.target.value)}
                />
                <button
                  type="button"
                  className="sars-btn-subtle"
                  onClick={onLoadCustomOverlay}
                  disabled={customOverlayLoading || !customOverlayUrl.trim()}
                >
                  {customOverlayLoading
                    ? 'Loading…'
                    : customOverlayActive
                      ? 'Reload Overlay'
                      : 'Load Overlay'}
                </button>
              </div>
              {customOverlayStatus && (
                <div className="sars-settings-custom-feed__status">{customOverlayStatus}</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
