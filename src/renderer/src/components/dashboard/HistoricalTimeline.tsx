import React, { useMemo } from 'react'
import { ChevronLeft, ChevronRight, Filter, Pause, Play, X } from 'lucide-react'
import type { EventRecord } from '../../types/phenomenon'
import type { TimelineSelectionState } from '../../hooks/useTimelineSelection'

export interface HistoricalTimelineProps {
  timeline: TimelineSelectionState
  phenomenonEvents: EventRecord[]
  allEvents: EventRecord[]
  selectedEvent: EventRecord | null
  hasLeftPanel?: boolean
  onSelectEvent: (ev: EventRecord) => void
  onStartPlayback?: () => void
  onStopTour: () => void
  onHideTimeline: () => void
}

const YEAR_TICKS = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026]
const MONTH_NAMES = [
  'JAN',
  'FEB',
  'MAR',
  'APR',
  'MAY',
  'JUN',
  'JUL',
  'AUG',
  'SEP',
  'OCT',
  'NOV',
  'DEC'
]

function formatActiveMonthLabel(yyyyMm: string): string {
  const year = yyyyMm.slice(0, 4)
  const monthIdx = parseInt(yyyyMm.slice(5, 7), 10) - 1
  const mon = MONTH_NAMES[monthIdx] ?? ''
  return mon ? `${mon} ${year}` : yyyyMm
}

export const HistoricalTimeline: React.FC<HistoricalTimelineProps> = ({
  timeline,
  phenomenonEvents,
  allEvents,
  selectedEvent,
  hasLeftPanel = false,
  onSelectEvent,
  onStartPlayback,
  onStopTour,
  onHideTimeline
}) => {
  const {
    months,
    selectedMonthIndex,
    selectedDate,
    selectedObservation,
    dateFilterMode,
    isPlaying,
    playbackSpeed,
    setSelectedMonthIndex,
    setDateFilterMode,
    setIsPlaying,
    cyclePlaybackSpeed,
    stepBackward,
    stepForward
  } = timeline

  const totalMax = Math.max(1, months.length - 1)
  const currentPercent = (selectedMonthIndex / totalMax) * 100

  const monthIndexMap = useMemo(() => {
    const map = new Map<string, number>()
    months.forEach((m, idx) => map.set(m.month, idx))
    return map
  }, [months])

  const phenomenonEventIdSet = useMemo(
    () => new Set(phenomenonEvents.map((e) => e.eventId)),
    [phenomenonEvents]
  )

  // Map crisis events cleanly onto the 2015–2026 timeline rail
  const eventPins = useMemo(() => {
    const sourceEvents = allEvents.length > 0 ? allEvents : phenomenonEvents
    const seenMonths = new Map<
      string,
      {
        monthIdx: number
        percent: number
        events: EventRecord[]
        label: string
        hasPhenoMatch: boolean
      }
    >()

    for (const ev of sourceEvents) {
      const mKey = ev.eventDate
      const idx = monthIndexMap.get(mKey)
      const resolvedIdx =
        idx !== undefined
          ? idx
          : Math.max(
              0,
              Math.min(
                months.length - 1,
                (parseInt(mKey.slice(0, 4), 10) - 2015) * 12 +
                  (parseInt(mKey.slice(5, 7), 10) - 1)
              )
            )
      const pct = (resolvedIdx / totalMax) * 100
      const existing = seenMonths.get(mKey)
      const isPhenoMatch = phenomenonEventIdSet.has(ev.eventId)
      if (existing) {
        existing.events.push(ev)
        existing.hasPhenoMatch = existing.hasPhenoMatch || isPhenoMatch
      } else {
        seenMonths.set(mKey, {
          monthIdx: resolvedIdx,
          percent: pct,
          events: [ev],
          label: ev.displayDate,
          hasPhenoMatch: isPhenoMatch
        })
      }
    }

    return Array.from(seenMonths.values()).sort((a, b) => a.monthIdx - b.monthIdx)
  }, [allEvents, phenomenonEvents, monthIndexMap, months.length, totalMax, phenomenonEventIdSet])

  const handleManualScrub = (idx: number): void => {
    onStopTour()
    setIsPlaying(false)
    setSelectedMonthIndex(idx)
  }

  return (
    <section
      className={`sars-timeline-bar ${hasLeftPanel ? 'has-left-panel' : ''}`}
      aria-label="Historical SAR Timeline (Jan 2015 - Dec 2026)"
    >
      <div className="sars-timeline-main-row">
        {/* Left: Transport Controls & Active Month Readout */}
        <div className="sars-timeline-bar__controls">
        <button
          type="button"
          className={`sars-timeline-icon-btn ${isPlaying ? 'is-playing' : ''}`}
          onClick={() => {
            onStopTour()
            if (!isPlaying) {
              onStartPlayback?.()
            }
            setIsPlaying((p) => !p)
          }}
          title={isPlaying ? 'Pause timeline playback' : 'Play 2015–2026 monthly timeline'}
        >
          {isPlaying ? <Pause size={12} /> : <Play size={12} />}
        </button>

        <button
          type="button"
          className="sars-timeline-icon-btn"
          onClick={() => {
            onStopTour()
            setIsPlaying(false)
            stepBackward()
          }}
          title="Previous month"
        >
          <ChevronLeft size={13} />
        </button>

        <button
          type="button"
          className="sars-timeline-icon-btn"
          onClick={() => {
            onStopTour()
            setIsPlaying(false)
            stepForward()
          }}
          title="Next month"
        >
          <ChevronRight size={13} />
        </button>

        <button
          type="button"
          className="sars-timeline-speed-btn"
          onClick={cyclePlaybackSpeed}
          title="Cycle playback speed (1x / 2x / 4x)"
        >
          {playbackSpeed}x
        </button>

        <div className="sars-timeline-active-readout">
          <span className="sars-timeline-active-readout__date">
            {formatActiveMonthLabel(selectedDate)}
          </span>
          <span className="sars-timeline-active-readout__meta">{selectedDate}</span>
        </div>
      </div>

      {/* Center: Spacious 2015–2026 Timeline Rail, Event Markers & Year Ticks */}
      <div className="sars-timeline-track-area">
        <div className="sars-timeline-rail">
          <div
            className="sars-timeline-progress-fill"
            style={{ width: `${currentPercent}%` }}
          />

          {/* Clickable Crisis Event Markers */}
          {eventPins.map((pin) => {
            const isSelectedPin = pin.events.some(
              (ev) => ev.eventId === selectedEvent?.eventId
            )
            const leadEvent = pin.events[0]
            const tooltipText =
              pin.events.length > 1
                ? `${pin.events.map((e) => e.eventName).join(' · ')} (${pin.label})`
                : `${leadEvent.eventName} (${pin.label})`
            const edgeClass =
              pin.percent < 14 ? 'is-near-left' : pin.percent > 86 ? 'is-near-right' : ''

            return (
              <button
                key={`${leadEvent.eventId}-${pin.monthIdx}`}
                type="button"
                className={`sars-timeline-event-tick ${isSelectedPin ? 'is-selected' : ''} ${
                  pin.hasPhenoMatch ? 'is-pheno' : 'is-other'
                } ${edgeClass}`}
                style={
                  {
                    left: `${pin.percent}%`,
                    ['--pin-color' as string]: leadEvent.accentColor
                  } as React.CSSProperties
                }
                onClick={() => {
                  onStopTour()
                  setSelectedMonthIndex(pin.monthIdx)
                  onSelectEvent(leadEvent)
                }}
                title={tooltipText}
              >
                <span className="sars-timeline-event-tick__bar" />
                <span className="sars-timeline-event-tick__label">{tooltipText}</span>
              </button>
            )
          })}

          <input
            type="range"
            min={0}
            max={totalMax}
            step={1}
            value={selectedMonthIndex}
            onChange={(e) => handleManualScrub(parseInt(e.target.value, 10))}
            className="sars-timeline-range-input"
            aria-label="Select month between January 2015 and December 2026"
          />
        </div>

        {/* Clean 2015–2026 Year Ticks */}
        <div className="sars-timeline-year-ticks">
          {YEAR_TICKS.map((yr) => {
            const idx = monthIndexMap.get(`${yr}-01`) ?? Math.round(((yr - 2015) / 11) * totalMax)
            const leftPct = (idx / totalMax) * 100
            const isActiveYear = selectedDate.startsWith(String(yr))
            return (
              <span
                key={yr}
                className={`sars-timeline-year-tick ${isActiveYear ? 'is-active' : ''}`}
                style={{ left: `${leftPct}%` }}
              >
                {yr}
              </span>
            )
          })}
        </div>
      </div>

      {/* Right: Date Filter Mode & Hide */}
      <div className="sars-timeline-bar__right">
        <button
          type="button"
          className={`sars-timeline-filter-btn ${
            dateFilterMode !== 'all_period' ? 'is-active' : ''
          }`}
          onClick={() =>
            setDateFilterMode(
              dateFilterMode === 'all_period'
                ? 'year'
                : dateFilterMode === 'year'
                  ? 'exact_month'
                  : 'all_period'
            )
          }
          title="Cycle event filter: All 2015–2026 → Selected Year → Exact Month"
        >
          <Filter size={11} />
          <span>
            {dateFilterMode === 'all_period'
              ? 'All 2015–2026'
              : dateFilterMode === 'year'
                ? `Year ${selectedDate.slice(0, 4)}`
                : selectedDate}
          </span>
        </button>

        <button
          type="button"
          className="sars-timeline-icon-btn"
          onClick={onHideTimeline}
          title="Hide timeline bar"
        >
          <X size={12} />
        </button>
      </div>
      </div>

      {/* Bottom Row: Color Key + Live Monthly Percentages */}
      {selectedObservation && (
        <div
          className="sars-timeline-live-readout"
          title="Active month hydrological, canopy, drought/fire & cryosphere indices"
        >
          <div className="sars-live-legend">
            <span className="sars-live-legend__item">
              <i className="leg-dot" style={{ backgroundColor: '#22D3EE' }} />
              <span>Flood / Water</span>
              <strong>{selectedObservation.flood_pulse_idx.toFixed(1)}%</strong>
            </span>
            <span className="sars-live-legend__item">
              <i className="leg-dot" style={{ backgroundColor: '#10B981' }} />
              <span>Canopy / Moisture</span>
              <strong>{selectedObservation.soil_moisture_idx.toFixed(1)}%</strong>
            </span>
            <span className="sars-live-legend__item">
              <i className="leg-dot" style={{ backgroundColor: '#F59E0B' }} />
              <span>Dry / Drought</span>
              <strong>{selectedObservation.drought_fire_idx.toFixed(1)}%</strong>
            </span>
            <span className="sars-live-legend__item">
              <i className="leg-dot" style={{ backgroundColor: '#FB7185' }} />
              <span>Fires</span>
              <strong>{selectedObservation.fire_hotspots_amazon.toLocaleString()}</strong>
            </span>
            <span className="sars-live-legend__item">
              <i className="leg-dot" style={{ backgroundColor: '#6366F1' }} />
              <span>Frozen Land</span>
              <strong>{(selectedObservation.global_frozen_pct ?? 0).toFixed(1)}%</strong>
            </span>
            <span className="sars-live-legend__item">
              <i className="leg-dot" style={{ backgroundColor: '#E0F2FE' }} />
              <span>Sea Ice</span>
              <strong>{(selectedObservation.global_sea_ice_idx ?? 0).toFixed(1)}%</strong>
            </span>
          </div>

          <div className="sars-live-metrics-line">
            <span>Flow: {(selectedObservation.discharge_manaus_m3s / 1000).toFixed(0)}k m³/s</span>
            {selectedObservation.nisar_scenes > 0 && (
              <>
                <span>·</span>
                <span className="sars-nisar-pill">NISAR: {selectedObservation.nisar_scenes}</span>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
