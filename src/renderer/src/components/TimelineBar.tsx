import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Compass,
  Globe,
  Pause,
  Play,
  Radio,
  Sparkles
} from 'lucide-react'
import type { AmazonEvent, AmazonPhenomenon, TimelineMonthPoint } from '../types/sar'

type TheaterTarget = 'planet' | 'amazon' | 'arctic' | 'antarctica' | 'monsoon'

interface TimelineBarProps {
  months: TimelineMonthPoint[]
  phenomena: AmazonPhenomenon[]
  events: AmazonEvent[]
  selectedMonthIndex: number
  activePhenomenonId: string | null
  activeEventId: string | null
  isPlaying: boolean
  playbackSpeed: 1 | 2 | 4
  showBasinProgression: boolean
  liveScope: 'planet' | 'amazon'
  isTouring: boolean
  onSelectMonthIndex: (index: number) => void
  onSelectPhenomenon: (phenomenon: AmazonPhenomenon) => void
  onSelectEvent: (event: AmazonEvent) => void
  onFlyAmazonOverview: () => void
  onTogglePlay: () => void
  onCycleSpeed: () => void
  onToggleBasinProgression: () => void
  onChangeLiveScope: (scope: 'planet' | 'amazon') => void
  onFlyTheater: (theater: TheaterTarget) => void
  onToggleTour: () => void
}

const YEAR_TICKS = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026]

export function TimelineBar({
  months,
  phenomena,
  events,
  selectedMonthIndex,
  activePhenomenonId,
  activeEventId,
  isPlaying,
  playbackSpeed,
  showBasinProgression,
  liveScope,
  isTouring,
  onSelectMonthIndex,
  onSelectPhenomenon,
  onSelectEvent,
  onFlyAmazonOverview,
  onTogglePlay,
  onCycleSpeed,
  onToggleBasinProgression,
  onChangeLiveScope,
  onFlyTheater,
  onToggleTour
}: TimelineBarProps): React.JSX.Element {
  const current = months[selectedMonthIndex] ?? months[0]
  const totalMax = Math.max(months.length - 1, 1)

  const monthIndexMap = new Map<string, number>()
  months.forEach((m, idx) => monthIndexMap.set(m.month, idx))

  // Build normalized dual-trace SVG sparklines over 2015-2026
  const maxQ = Math.max(...months.map((m) => m.discharge_manaus_m3s || 1), 1)
  const maxFire = Math.max(...months.map((m) => m.fire_hotspots_amazon || 1), 1)
  const primarySpark = months
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
  const secondarySpark = months
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

  return (
    <section className="sar-timeline-dock" aria-label="Dancing with the SARs Timeline & Phenomena">
      {/* Row 1: Planet / Amazon Theater Switcher + 6 Seasonal Rhythms */}
      <div className="sar-phenomena-row">
        <div className="sar-scope-switcher" role="group" aria-label="Live progression scope">
          <button
            type="button"
            className={`sar-scope-btn ${liveScope === 'planet' ? 'active' : ''}`}
            onClick={() => onChangeLiveScope('planet')}
            title="Show Whole-Planet 144-month (2015–2026) SMAP moisture, freeze/thaw, floodplains, fires & polar sea ice"
          >
            <Globe size={12} />
            <span>Planet Live</span>
          </button>
          <button
            type="button"
            className={`sar-scope-btn ${liveScope === 'amazon' ? 'active' : ''}`}
            onClick={() => onChangeLiveScope('amazon')}
            title="Focus Whole-Amazon 144-month (2015–2026) SMAP + GloFAS + FIRMS hydrological cycle"
          >
            <Sparkles size={12} />
            <span>Amazon Live</span>
          </button>
          <button
            type="button"
            className="sar-theater-btn"
            onClick={() => onFlyTheater('arctic')}
            title="Fly camera to Arctic Ocean sea-ice & boreal freeze/thaw belt"
          >
            <Compass size={11} />
            <span>Arctic</span>
          </button>
          <button
            type="button"
            className="sar-theater-btn"
            onClick={() => onFlyTheater('antarctica')}
            title="Fly camera to Antarctica & Weddell Sea sea-ice belt"
          >
            <span>Antarctica</span>
          </button>
          <button
            type="button"
            className="sar-theater-btn"
            onClick={() => onFlyTheater('monsoon')}
            title="Fly camera to South & Southeast Asia monsoon floodplains"
          >
            <span>Monsoon</span>
          </button>
        </div>

        <button
          type="button"
          className="sar-overview-pill"
          onClick={onFlyAmazonOverview}
          title="Center camera on Amazon Rainforest study basin"
        >
          <span>Amazon Focus</span>
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

        <button
          type="button"
          className={`sar-live-basin-toggle ${showBasinProgression ? 'active' : ''}`}
          onClick={onToggleBasinProgression}
          title="Toggle live 2015–2026 monthly surface-change progression overlay"
        >
          <Radio size={12} />
          <span>{showBasinProgression ? 'Live ON' : 'Live OFF'}</span>
        </button>

        <button
          type="button"
          className={`sar-tour-btn ${isTouring ? 'active' : ''}`}
          onClick={onToggleTour}
          title="Auto-fly through 8 signature 2015–2026 global & Amazon SAR crises"
        >
          <Compass size={12} />
          <span>{isTouring ? 'Stop Tour' : 'Guided Tour'}</span>
        </button>
      </div>

      {/* Row 2: 2015–2026 Temporal Scrubber & Clickable Crisis Event Dots */}
      <div className="sar-scrubber-row">
        <div className="sar-month-readout">
          <button
            type="button"
            className={`sar-play-btn ${isPlaying ? 'playing' : ''}`}
            onClick={onTogglePlay}
            aria-label={isPlaying ? 'Pause monthly progression' : 'Play 2015–2026 progression'}
            title={isPlaying ? 'Pause playback' : 'Play monthly progression (2015–2026)'}
          >
            {isPlaying ? <Pause size={12} /> : <Play size={12} />}
          </button>
          <button
            type="button"
            className="sar-speed-btn"
            onClick={onCycleSpeed}
            title="Cycle playback speed (1x / 2x / 4x)"
          >
            {playbackSpeed}x
          </button>
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
          <svg
            className="sar-timeline-sparkline"
            viewBox="0 0 1000 28"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <polyline
              fill="none"
              stroke={liveScope === 'planet' ? '#64d2ff' : '#22d3ee'}
              strokeWidth="1.5"
              strokeOpacity="0.65"
              points={primarySpark}
            />
            <polyline
              fill="none"
              stroke={liveScope === 'planet' ? '#818cf8' : '#fb7185'}
              strokeWidth="1.35"
              strokeOpacity="0.7"
              points={secondarySpark}
            />
          </svg>
          <input
            type="range"
            className="sar-month-slider"
            min={0}
            max={totalMax}
            value={selectedMonthIndex}
            onChange={(e) => onSelectMonthIndex(Number(e.target.value))}
            aria-label="2015 to 2026 monthly timeline scrubber"
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

          {/* Clickable 9 Specific Event Dots pinned on exact month positions (4 Amazon + 5 Global) */}
          <div className="sar-event-dots-layer">
            {events.map((evt) => {
              const idx = monthIndexMap.get(evt.timeline_month)
              if (idx === undefined) return null
              const leftPct = (idx / totalMax) * 100
              const isSelected = activeEventId === evt.id
              const isGlobal = evt.scope === 'global'
              return (
                <button
                  key={evt.id}
                  type="button"
                  className={`sar-event-dot-btn ${isGlobal ? 'is-global' : ''} ${
                    isSelected ? 'active' : ''
                  }`}
                  style={
                    {
                      left: `${leftPct}%`,
                      ['--evt-color' as string]: evt.color
                    } as React.CSSProperties
                  }
                  onClick={() => onSelectEvent(evt)}
                  title={`${isGlobal ? '[GLOBAL] ' : '[AMAZON] '}${evt.name} (${evt.timing})`}
                >
                  <span className="sar-event-dot-core" />
                  <span className="sar-event-dot-tag">
                    {isGlobal && <span className="evt-scope-tag">GLOBAL</span>}
                    <strong>{evt.timing}</strong> · {evt.name.replace(' (Manaus)', '')}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Live Month Environmental Readout */}
        {current && (
          <div
            className="sar-month-metrics"
            title="Selected month hydrological, cryosphere & SAR metrics"
          >
            {showBasinProgression && liveScope === 'planet' && (
              <span className="sar-live-legend" title="Whole-Planet progression color key">
                <i className="leg-dot" style={{ backgroundColor: '#22D3EE' }} /> Flood
                <i className="leg-dot" style={{ backgroundColor: '#10B981' }} /> Canopy
                <i className="leg-dot" style={{ backgroundColor: '#F59E0B' }} /> Dry
                <i className="leg-dot" style={{ backgroundColor: '#FB7185' }} /> Fire
                <i className="leg-dot" style={{ backgroundColor: '#6366F1' }} /> Freeze
                <i className="leg-dot" style={{ backgroundColor: '#E0F2FE' }} /> Ice
              </span>
            )}
            {showBasinProgression && liveScope === 'amazon' && (
              <span className="sar-live-legend" title="Whole-Amazon progression color key">
                <i className="leg-dot" style={{ backgroundColor: '#22D3EE' }} /> Flood
                <i className="leg-dot" style={{ backgroundColor: '#10B981' }} /> Wet
                <i className="leg-dot" style={{ backgroundColor: '#F59E0B' }} /> Dry
                <i className="leg-dot" style={{ backgroundColor: '#EF4444' }} /> Fire
              </span>
            )}
            {liveScope === 'planet' ? (
              <>
                <span>Frozen: {Math.round(current.global_frozen_pct ?? 0)}%</span>
                <span>·</span>
                <span>Ice: {Math.round(current.global_sea_ice_idx ?? 0)}%</span>
                <span>·</span>
                <span>Amazon Q: {(current.discharge_manaus_m3s / 1000).toFixed(0)}k</span>
              </>
            ) : (
              <>
                <span>Q: {(current.discharge_manaus_m3s / 1000).toFixed(0)}k m³/s</span>
                <span>·</span>
                <span>SMAP: {Math.round(current.soil_moisture_idx)}%</span>
                <span>·</span>
                <span>Fires: {current.fire_hotspots_amazon.toLocaleString()}</span>
              </>
            )}
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
