import { Calendar, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import type { AmazonEvent, AmazonPhenomenon, TimelineMonthPoint } from '../types/sar'

interface TimelineBarProps {
  months: TimelineMonthPoint[]
  phenomena: AmazonPhenomenon[]
  events: AmazonEvent[]
  selectedMonthIndex: number
  activePhenomenonId: string | null
  activeEventId: string | null
  onSelectMonthIndex: (index: number) => void
  onSelectPhenomenon: (phenomenon: AmazonPhenomenon) => void
  onSelectEvent: (event: AmazonEvent) => void
  onFlyAmazonOverview: () => void
}

const YEAR_TICKS = [2020, 2021, 2022, 2023, 2024, 2025, 2026]

export function TimelineBar({
  months,
  phenomena,
  events,
  selectedMonthIndex,
  activePhenomenonId,
  activeEventId,
  onSelectMonthIndex,
  onSelectPhenomenon,
  onSelectEvent,
  onFlyAmazonOverview
}: TimelineBarProps): React.JSX.Element {
  const current = months[selectedMonthIndex] ?? months[0]
  const totalMax = Math.max(months.length - 1, 1)

  const monthIndexMap = new Map<string, number>()
  months.forEach((m, idx) => monthIndexMap.set(m.month, idx))

  return (
    <section className="sar-timeline-dock" aria-label="Dancing with the SARs Timeline & Phenomena">
      {/* Row 1: Generic Seasonal Rhythms (Table 1 — 6 Phenomena) */}
      <div className="sar-phenomena-row">
        <button
          type="button"
          className="sar-overview-pill"
          onClick={onFlyAmazonOverview}
          title="Center camera on Amazon Rainforest study basin"
        >
          <Sparkles size={12} className="hud-icon-cyan" />
          <span>AMAZON 2020–2026</span>
        </button>

        <div className="sar-phenomena-pills" role="tablist" aria-label="Amazon Seasonal Phenomena">
          {phenomena.map((phen) => {
            const isSelected = activePhenomenonId === phen.id
            const isSeasonallyActive = current?.active_phenomena.includes(phen.id) ?? false
            return (
              <button
                key={phen.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                className={`sar-phen-pill ${isSelected ? 'selected' : ''} ${
                  isSeasonallyActive && !activeEventId ? 'in-season' : ''
                }`}
                style={{ ['--phen-color' as string]: phen.color } as React.CSSProperties}
                onClick={() => onSelectPhenomenon(phen)}
                title={`${phen.name} (${phen.typical_timing}) — Click to inspect SAR overlay`}
              >
                <span className="phen-dot" style={{ backgroundColor: phen.color }} />
                <span className="phen-name">{phen.name}</span>
                <span className="phen-timing">{phen.typical_timing}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Row 2: 2020–2026 Temporal Scrubber & Clickable Specific Event Dots (Table 2) */}
      <div className="sar-scrubber-row">
        <div className="sar-month-readout">
          <Calendar size={12} className="hud-icon-cyan" />
          <span className="sar-month-code">{current?.month ?? '2026-10'}</span>
          <button
            type="button"
            className="sar-step-btn"
            onClick={() => onSelectMonthIndex(Math.max(0, selectedMonthIndex - 1))}
            disabled={selectedMonthIndex <= 0}
            aria-label="Previous month"
          >
            <ChevronLeft size={13} />
          </button>
          <button
            type="button"
            className="sar-step-btn"
            onClick={() => onSelectMonthIndex(Math.min(totalMax, selectedMonthIndex + 1))}
            disabled={selectedMonthIndex >= totalMax}
            aria-label="Next month"
          >
            <ChevronRight size={13} />
          </button>
        </div>

        <div className="sar-track-wrap">
          <input
            type="range"
            className="sar-month-slider"
            min={0}
            max={totalMax}
            value={selectedMonthIndex}
            onChange={(e) => onSelectMonthIndex(Number(e.target.value))}
            aria-label="2020 to 2026 monthly timeline scrubber"
          />

          {/* Year tick labels underneath */}
          <div className="sar-year-ticks">
            {YEAR_TICKS.map((yr) => {
              const idx = monthIndexMap.get(`${yr}-01`) ?? 0
              const leftPct = (idx / totalMax) * 100
              return (
                <span key={yr} className="sar-year-tick" style={{ left: `${leftPct}%` }}>
                  {yr}
                </span>
              )
            })}
          </div>

          {/* Clickable 4 Specific Event Dots pinned on exact month positions */}
          <div className="sar-event-dots-layer">
            {events.map((evt) => {
              const idx = monthIndexMap.get(evt.timeline_month)
              if (idx === undefined) return null
              const leftPct = (idx / totalMax) * 100
              const isSelected = activeEventId === evt.id
              return (
                <button
                  key={evt.id}
                  type="button"
                  className={`sar-event-dot-btn ${isSelected ? 'active' : ''}`}
                  style={
                    {
                      left: `${leftPct}%`,
                      ['--evt-color' as string]: evt.color
                    } as React.CSSProperties
                  }
                  onClick={() => onSelectEvent(evt)}
                  title={`${evt.name} (${evt.timing})`}
                >
                  <span className="sar-event-dot-core" />
                  <span className="sar-event-dot-tag">
                    <strong>{evt.timing}</strong> · {evt.name.replace(' (Manaus)', '')}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Live Month Environmental Readout */}
        {current && (
          <div className="sar-month-metrics" title="Selected month hydrological & SAR counts">
            <span>Q: {(current.discharge_manaus_m3s / 1000).toFixed(0)}k m³/s</span>
            <span>·</span>
            <span>Rain: {Math.round(current.precip_mm)} mm</span>
            <span>·</span>
            <span>Fires: {current.fire_hotspots_amazon.toLocaleString()}</span>
            {current.nisar_scenes > 0 && (
              <>
                <span>·</span>
                <span className="sar-nisar-tag">NISAR: {current.nisar_scenes}</span>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
