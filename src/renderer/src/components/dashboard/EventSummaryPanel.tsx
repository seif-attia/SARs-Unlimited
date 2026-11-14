import React from 'react'
import { ArrowUpRight, Columns, MapPin, PanelRightClose, X } from 'lucide-react'
import type {
  DateFilterMode,
  EventRecord,
  HoveredLocationInfo,
  PhenomenonDefinition
} from '../../types/phenomenon'

export interface EventSummaryPanelProps {
  selectedPhenomenon: PhenomenonDefinition
  events: EventRecord[]
  selectedEvent: EventRecord | null
  onSelectEvent: (event: EventRecord) => void
  onOpenReport: (event: EventRecord) => void
  onOpenMedia: (event: EventRecord) => void
  hoveredLocation: HoveredLocationInfo | null
  lockedRegionId: string | null
  onClearLockedRegion: () => void
  dateFilterMode: DateFilterMode
  onResetDateFilterMode: () => void
  selectedDate: string
  onHide: () => void
  embedded?: boolean
}

export const EventSummaryPanel: React.FC<EventSummaryPanelProps> = ({
  selectedPhenomenon,
  events,
  selectedEvent,
  onSelectEvent,
  onOpenReport,
  onOpenMedia,
  hoveredLocation,
  lockedRegionId,
  onClearLockedRegion,
  dateFilterMode,
  onResetDateFilterMode,
  selectedDate,
  onHide,
  embedded = false
}) => {
  const showHoveredBadge =
    hoveredLocation !== null &&
    (hoveredLocation.state === 'AMAZON LOCATION' ||
      hoveredLocation.state === 'GLOBAL LOCATION')

  return (
    <aside
      className={embedded ? 'sars-tab-pane sars-summary-pane' : 'sars-panel sars-right-panel'}
      aria-label="Storytelling and Event Summary Panel"
    >
      {!embedded && (
        <div className="sars-panel__header">
          <h2 className="sars-panel__title">SUMMARY</h2>
          <button
            type="button"
            className="sars-hide-btn"
            onClick={onHide}
            title="Hide Event Summary Panel"
          >
            <PanelRightClose size={12} />
            <span>Hide</span>
          </button>
        </div>
      )}

      {/* Active Geographic / Date Filter Badges */}
      {(lockedRegionId || dateFilterMode !== 'all_period' || showHoveredBadge) && (
        <div className="sars-summary-active-filters">
          {lockedRegionId && (
            <span className="sars-filter-chip">
              <MapPin size={10} />
              <span>Region: {lockedRegionId}</span>
              <button type="button" onClick={onClearLockedRegion} title="Clear region lock">
                <X size={10} />
              </button>
            </span>
          )}
          {dateFilterMode !== 'all_period' && (
            <span className="sars-filter-chip">
              <span>
                Filter: {dateFilterMode === 'year' ? selectedDate.slice(0, 4) : selectedDate}
              </span>
              <button type="button" onClick={onResetDateFilterMode} title="Show all 2015–2026">
                <X size={10} />
              </button>
            </span>
          )}
          {showHoveredBadge && hoveredLocation && (
            <span className="sars-filter-chip sars-filter-chip--live">
              <MapPin size={10} />
              <span>{hoveredLocation.regionName}</span>
            </span>
          )}
        </div>
      )}

      {/* Scrollable Event Cards List */}
      <div className="sars-event-list" role="list">
        {events.length === 0 ? (
          <div className="sars-empty-events">
            <div className="sars-empty-events__title">
              No recorded event for this phenomenon during the selected period.
            </div>
            <div className="sars-empty-events__sub">
              Selected phenomenon: <strong>{selectedPhenomenon.displayName}</strong> (
              {selectedDate}). Try switching timeline filter to full 2015–2026 window or selecting
              another phenomenon.
            </div>
            {dateFilterMode !== 'all_period' && (
              <button
                type="button"
                className="sars-event-action-btn"
                onClick={onResetDateFilterMode}
              >
                Show Full 2015–2026 Archive
              </button>
            )}
          </div>
        ) : (
          events.map((ev) => {
            const isSelected = selectedEvent?.eventId === ev.eventId
            return (
              <article
                key={ev.eventId}
                role="listitem"
                className={`sars-event-card ${isSelected ? 'is-selected' : ''}`}
                onClick={() => onSelectEvent(ev)}
              >
                <div className="sars-event-card__title-row">
                  <h3 className="sars-event-card__title">{ev.eventName}</h3>
                </div>

                <div className="sars-event-card__meta">
                  {ev.displayDate} · {ev.magnitude ?? ev.headlineMetric}
                </div>

                <p className="sars-event-card__desc">{ev.summary}</p>

                <div
                  className="sars-event-card__actions"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    className="sars-event-action-btn"
                    onClick={() => {
                      onSelectEvent(ev)
                      onOpenReport(ev)
                    }}
                    title="Open full scientific incident report & SAR methodology"
                  >
                    <span>Report</span>
                    <ArrowUpRight size={12} />
                  </button>

                  <button
                    type="button"
                    className="sars-event-action-btn"
                    onClick={() => {
                      onSelectEvent(ev)
                      onOpenMedia(ev)
                    }}
                    title="Open interactive before/after SAR comparator, physics & media"
                  >
                    <Columns size={11} />
                    <span>Compare</span>
                  </button>
                </div>
              </article>
            )
          })
        )}
      </div>

      <div className="sars-panel__footer-note">
        Scroll to read more · click an incident to fly the globe there
      </div>
    </aside>
  )
}
