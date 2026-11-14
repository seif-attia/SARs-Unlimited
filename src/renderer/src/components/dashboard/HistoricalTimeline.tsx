import React, { useMemo, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Compass,
  Filter,
  Globe,
  Pause,
  Play,
  Radio,
  Sparkles,
  X
} from 'lucide-react'
import type { EventRecord } from '../../types/phenomenon'
import type { TimelineSelectionState } from '../../hooks/useTimelineSelection'

export type TheaterTarget = 'planet' | 'amazon' | 'arctic' | 'antarctica' | 'monsoon'

export interface HistoricalTimelineProps {
  timeline: TimelineSelectionState
  phenomenonEvents: EventRecord[]
  allEvents: EventRecord[]
  selectedEvent: EventRecord | null
  liveScope: 'planet' | 'amazon'
  showBasinProgression: boolean
  isTouring: boolean
  onSelectEvent: (ev: EventRecord) => void
  onChangeLiveScope: (scope: 'planet' | 'amazon') => void
  onToggleBasinProgression: () => void
  onFlyTheater: (theater: TheaterTarget) => void
  onToggleTour: () => void
  onStopTour: () => void
  onHideTimeline: () => void
}

const YEAR_TICKS = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026]

export const HistoricalTimeline: React.FC<HistoricalTimelineProps> = ({
  timeline,
  phenomenonEvents,
  allEvents,
  selectedEvent,
  liveScope,
  showBasinProgression,
  isTouring,
  onSelectEvent,
  onChangeLiveScope,
  onToggleBasinProgression,
  onFlyTheater,
  onToggleTour,
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

  const [showAllEventsOnTimeline, setShowAllEventsOnTimeline] = useState<boolean>(true)

  const totalMax = Math.max(1, months.length - 1)
  const currentPercent = (selectedMonthIndex / totalMax) * 100

  const monthIndexMap = useMemo(() => {
    const map = new Map<string, number>()
    months.forEach((m, idx) => map.set(m.month, idx))
    return map
  }, [months])

  // Dual-trace normalized SVG sparklines across 144 months (2015–2026)
  const { primarySpark, secondarySpark } = useMemo(() => {
    const maxQ = Math.max(...months.map((m) => m.discharge_manaus_m3s || 1), 1)
    const maxFire = Math.max(...months.map((m) => m.fire_hotspots_amazon || 1), 1)

    const pPoints = months
      .map((m, idx) => {
        const x = (idx / totalMax) * 1000
        const norm =
          liveScope === 'planet'
            ? (m.global_sea_ice_idx ?? 50) / 100
            : (m.discharge_manaus_m3s || 0) / maxQ
        const y = 26 - Math.max(0.04, Math.min(0.96, norm)) * 22
        return `${x.toFixed(1)},${y.toFixed(1)}`
      })
      .join(' ')

    const sPoints = months
      .map((m, idx) => {
        const x = (idx / totalMax) * 1000
        const norm =
          liveScope === 'planet'
            ? (m.global_frozen_pct ?? 20) / 45
            : (m.fire_hotspots_amazon || 0) / maxFire
        const y = 26 - Math.max(0.04, Math.min(0.96, norm)) * 22
        return `${x.toFixed(1)},${y.toFixed(1)}`
      })
      .join(' ')

    return { primarySpark: pPoints, secondarySpark: sPoints }
  }, [months, totalMax, liveScope])

  const phenomenonEventIdSet = useMemo(
    () => new Set(phenomenonEvents.map((e) => e.eventId)),
    [phenomenonEvents]
  )

  // Map either all 15 crisis events or current phenomenon's events onto the timeline
  const eventPins = useMemo(() => {
    const sourceEvents = showAllEventsOnTimeline ? allEvents : phenomenonEvents
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
  }, [
    showAllEventsOnTimeline,
    allEvents,
    phenomenonEvents,
    monthIndexMap,
    months.length,
    totalMax,
    phenomenonEventIdSet
  ])

  const highlightSpan = useMemo(() => {
    const phenoPins = eventPins.filter((p) => p.hasPhenoMatch)
    const refPins = phenoPins.length > 0 ? phenoPins : eventPins
    if (refPins.length === 0) {
      const start = Math.max(0, currentPercent - 6)
      const end = Math.min(100, currentPercent + 6)
      return { left: start, width: Math.max(6, end - start) }
    }
    const minPct = Math.max(0, Math.min(...refPins.map((p) => p.percent), currentPercent) - 2.5)
    const maxPct = Math.min(100, Math.max(...refPins.map((p) => p.percent), currentPercent) + 2.5)
    return {
      left: minPct,
      width: Math.max(8, maxPct - minPct)
    }
  }, [eventPins, currentPercent])

  const handleManualScrub = (idx: number): void => {
    onStopTour()
    setIsPlaying(false)
    setSelectedMonthIndex(idx)
  }

  return (
    <section
      className="sars-timeline-bar"
      aria-label="Historical SAR Timeline (Jan 2015 - Dec 2026)"
    >
      {/* Row 1: Planet/Amazon Scope Switcher, Theaters, Guided Tour, Pin Filter & Hide */}
      <div className="sars-timeline-top-row">
        <div className="sars-timeline-scope-group" role="group" aria-label="Live progression scope">
          <button
            type="button"
            className={`sars-timeline-chip ${liveScope === 'planet' ? 'is-active' : ''}`}
            onClick={() => onChangeLiveScope('planet')}
            title="Show Whole-Planet 144-month (2015–2026) SMAP moisture, freeze/thaw, floodplains, fires & polar sea ice"
          >
            <Globe size={11} />
            <span>Planet Live</span>
          </button>
          <button
            type="button"
            className={`sars-timeline-chip ${liveScope === 'amazon' ? 'is-active' : ''}`}
            onClick={() => onChangeLiveScope('amazon')}
            title="Focus Whole-Amazon 144-month (2015–2026) SMAP + GloFAS + FIRMS hydrological cycle"
          >
            <Sparkles size={11} />
            <span>Amazon Live</span>
          </button>
          <button
            type="button"
            className="sars-timeline-chip"
            onClick={() => onFlyTheater('arctic')}
            title="Fly camera to Arctic Ocean sea-ice & boreal freeze/thaw belt"
          >
            <Compass size={11} />
            <span>Arctic</span>
          </button>
          <button
            type="button"
            className="sars-timeline-chip"
            onClick={() => onFlyTheater('antarctica')}
            title="Fly camera to Antarctica & Weddell Sea sea-ice belt"
          >
            <span>Antarctica</span>
          </button>
          <button
            type="button"
            className="sars-timeline-chip"
            onClick={() => onFlyTheater('monsoon')}
            title="Fly camera to South & Southeast Asia monsoon floodplains"
          >
            <span>Monsoon</span>
          </button>
          <button
            type="button"
            className="sars-timeline-chip"
            onClick={() => onFlyTheater('amazon')}
            title="Center camera on Amazon Rainforest study basin"
          >
            <span>Amazon</span>
          </button>
        </div>

        <div className="sars-timeline-actions-group">
          <button
            type="button"
            className={`sars-timeline-chip ${showBasinProgression ? 'is-live' : ''}`}
            onClick={onToggleBasinProgression}
            title="Toggle live 2015–2026 monthly surface-change progression overlay on 3D globe"
          >
            <Radio size={11} />
            <span>{showBasinProgression ? 'Live ON' : 'Live OFF'}</span>
          </button>

          <button
            type="button"
            className={`sars-timeline-chip ${isTouring ? 'is-touring' : ''}`}
            onClick={onToggleTour}
            title="Auto-fly Guided Tour through 8 signature 2015–2026 global & Amazon SAR crises"
          >
            <Compass size={11} />
            <span>{isTouring ? 'Stop Tour' : 'Guided Tour'}</span>
          </button>

          <button
            type="button"
            className={`sars-timeline-chip ${showAllEventsOnTimeline ? 'is-active' : ''}`}
            onClick={() => setShowAllEventsOnTimeline((prev) => !prev)}
            title="Toggle timeline event pins between all 15 crisis events or current phenomenon only"
          >
            <span>{showAllEventsOnTimeline ? 'All 15 Pins' : 'Pheno Pins'}</span>
          </button>

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
            title="Cycle event list filter: Full Window (2015–2026) → Selected Year → Exact Month"
          >
            <Filter size={11} />
            <span>
              {dateFilterMode === 'all_period'
                ? '2015–2026'
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

      {/* Row 2: Play/Speed/Step + Dual Sparkline Track with 2015–2026 Year Ticks & Event Pins + Live Readout */}
      <div className="sars-timeline-bottom-row">
        <div className="sars-timeline-bar__controls">
          <button
            type="button"
            className={`sars-timeline-icon-btn ${isPlaying ? 'is-playing' : ''}`}
            onClick={() => {
              onStopTour()
              if (!showBasinProgression) onToggleBasinProgression()
              setIsPlaying((p) => !p)
            }}
            title={isPlaying ? 'Pause monthly progression' : 'Play 2015–2026 monthly progression'}
          >
            {isPlaying ? <Pause size={12} /> : <Play size={12} />}
          </button>
          <button
            type="button"
            className="sars-timeline-speed-btn"
            onClick={cyclePlaybackSpeed}
            title="Cycle playback speed (1x / 2x / 4x)"
          >
            {playbackSpeed}x
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

          <div className="sars-timeline-active-readout">
            <span className="sars-timeline-active-readout__date">{selectedDate}</span>
            {selectedObservation && (
              <span className="sars-timeline-active-readout__meta">
                S1 {selectedObservation.s1_scenes} sc
              </span>
            )}
          </div>
        </div>

        {/* Main Horizontal Track with Dual Sparklines + 12 Year Ticks + Event Dots */}
        <div className="sars-timeline-track-area">
          <svg
            className="sars-timeline-sparkline"
            viewBox="0 0 1000 28"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <polyline
              fill="none"
              stroke={liveScope === 'planet' ? '#64d2ff' : '#22d3ee'}
              strokeWidth="1.45"
              strokeOpacity="0.62"
              points={primarySpark}
            />
            <polyline
              fill="none"
              stroke={liveScope === 'planet' ? '#818cf8' : '#fb7185'}
              strokeWidth="1.25"
              strokeOpacity="0.68"
              points={secondarySpark}
            />
          </svg>

          <div className="sars-timeline-rail">
            <span className="sars-timeline-endpoint sars-timeline-endpoint--left" />
            <span className="sars-timeline-endpoint sars-timeline-endpoint--right" />

            <div
              className="sars-timeline-highlight-window"
              style={{
                left: `${highlightSpan.left}%`,
                width: `${highlightSpan.width}%`
              }}
            />

            {/* Clickable Crisis Event Pins */}
            {eventPins.map((pin) => {
              const isSelectedPin = pin.events.some(
                (ev) => ev.eventId === selectedEvent?.eventId
              )
              const leadEvent = pin.events[0]
              return (
                <button
                  key={`${leadEvent.eventId}-${pin.monthIdx}`}
                  type="button"
                  className={`sars-timeline-event-tick ${isSelectedPin ? 'is-selected' : ''} ${
                    pin.hasPhenoMatch ? 'is-pheno' : 'is-other'
                  }`}
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
                  title={`${pin.label}: ${pin.events.map((e) => e.eventName).join(' · ')}`}
                >
                  <span className="sars-timeline-event-tick__bar" />
                  <span className="sars-timeline-event-tick__label">{pin.label}</span>
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

          {/* All 12 Year Ticks (2015..2026) */}
          <div className="sars-timeline-year-ticks">
            {YEAR_TICKS.map((yr) => {
              const idx = monthIndexMap.get(`${yr}-01`) ?? Math.round(((yr - 2015) / 11) * totalMax)
              const leftPct = (idx / totalMax) * 100
              return (
                <span key={yr} className="sars-timeline-year-tick" style={{ left: `${leftPct}%` }}>
                  {yr}
                </span>
              )
            })}
          </div>
        </div>

        {/* Live Month Environmental Readout & Color Key */}
        {selectedObservation && (
          <div
            className="sars-timeline-live-readout"
            title="Selected month hydrological, cryosphere & NISAR acquisition metrics"
          >
            {showBasinProgression && (
              <div className="sars-live-legend">
                {liveScope === 'planet' ? (
                  <>
                    <span>
                      <i className="leg-dot" style={{ backgroundColor: '#22D3EE' }} />
                      Flood
                    </span>
                    <span>
                      <i className="leg-dot" style={{ backgroundColor: '#10B981' }} />
                      Canopy
                    </span>
                    <span>
                      <i className="leg-dot" style={{ backgroundColor: '#F59E0B' }} />
                      Dry
                    </span>
                    <span>
                      <i className="leg-dot" style={{ backgroundColor: '#FB7185' }} />
                      Fire
                    </span>
                    <span>
                      <i className="leg-dot" style={{ backgroundColor: '#6366F1' }} />
                      Freeze
                    </span>
                    <span>
                      <i className="leg-dot" style={{ backgroundColor: '#E0F2FE' }} />
                      Ice
                    </span>
                  </>
                ) : (
                  <>
                    <span>
                      <i className="leg-dot" style={{ backgroundColor: '#22D3EE' }} />
                      Flood
                    </span>
                    <span>
                      <i className="leg-dot" style={{ backgroundColor: '#10B981' }} />
                      Wet
                    </span>
                    <span>
                      <i className="leg-dot" style={{ backgroundColor: '#F59E0B' }} />
                      Dry
                    </span>
                    <span>
                      <i className="leg-dot" style={{ backgroundColor: '#EF4444' }} />
                      Fire
                    </span>
                  </>
                )}
              </div>
            )}

            <div className="sars-live-metrics-line">
              {liveScope === 'planet' ? (
                <>
                  <span>Frozen: {Math.round(selectedObservation.global_frozen_pct ?? 0)}%</span>
                  <span>·</span>
                  <span>Ice: {Math.round(selectedObservation.global_sea_ice_idx ?? 0)}%</span>
                  <span>·</span>
                  <span>Q: {(selectedObservation.discharge_manaus_m3s / 1000).toFixed(0)}k</span>
                </>
              ) : (
                <>
                  <span>Q: {(selectedObservation.discharge_manaus_m3s / 1000).toFixed(0)}k m³/s</span>
                  <span>·</span>
                  <span>SMAP: {Math.round(selectedObservation.soil_moisture_idx)}%</span>
                  <span>·</span>
                  <span>Fires: {selectedObservation.fire_hotspots_amazon.toLocaleString()}</span>
                </>
              )}
              {selectedObservation.nisar_scenes > 0 && (
                <>
                  <span>·</span>
                  <span className="sars-nisar-pill">NISAR: {selectedObservation.nisar_scenes}</span>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
