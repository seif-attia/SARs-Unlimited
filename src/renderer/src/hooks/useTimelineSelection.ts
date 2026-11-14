import { useCallback, useEffect, useMemo, useState } from 'react'
import type { TimelineMonthPoint } from '../types/sar'
import type { DateFilterMode } from '../types/phenomenon'

export interface UseTimelineSelectionOptions {
  months: TimelineMonthPoint[]
  initialDate?: string
}

export interface TimelineSelectionState {
  months: TimelineMonthPoint[]
  selectedMonthIndex: number
  selectedDate: string
  selectedObservation: TimelineMonthPoint | null
  dateFilterMode: DateFilterMode
  isPlaying: boolean
  playbackSpeed: 1 | 2 | 4
  playbackSpeedMs: number
  setSelectedMonthIndex: (idx: number) => void
  setSelectedDate: (date: string) => void
  setDateFilterMode: (mode: DateFilterMode) => void
  setIsPlaying: (playing: boolean | ((prev: boolean) => boolean)) => void
  cyclePlaybackSpeed: () => void
  setPlaybackSpeedMs: (ms: number) => void
  stepForward: () => void
  stepBackward: () => void
}

const FALLBACK_MONTHS: TimelineMonthPoint[] = Array.from({ length: 144 }, (_, idx) => {
  const year = 2015 + Math.floor(idx / 12)
  const month_num = (idx % 12) + 1
  const month = `${year}-${String(month_num).padStart(2, '0')}`
  return {
    month,
    year,
    month_num,
    discharge_manaus_m3s: 112000,
    discharge_porto_velho_m3s: 21000,
    precip_mm: 210,
    fire_hotspots_amazon: 450,
    s1_scenes: 62,
    nisar_scenes: year >= 2025 ? 24 : 0,
    active_phenomena: [],
    event_id: null,
    basin_overlay_path: '',
    soil_moisture_idx: 64.5,
    flood_pulse_idx: 52.0,
    drought_fire_idx: 18.0,
    planet_overlay_path: '',
    global_frozen_pct: 36.2,
    global_sea_ice_idx: 58.4
  }
})

export function useTimelineSelection({
  months: rawMonths,
  initialDate = '2023-02'
}: UseTimelineSelectionOptions): TimelineSelectionState {
  const months = useMemo(
    () => (rawMonths && rawMonths.length > 0 ? rawMonths : FALLBACK_MONTHS),
    [rawMonths]
  )

  const [selectedDateState, setSelectedDateState] = useState<string>(initialDate)
  const [dateFilterMode, setDateFilterMode] = useState<DateFilterMode>('all_period')
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 2 | 4>(1)
  const [customSpeedMs, setCustomSpeedMs] = useState<number | null>(null)

  const playbackSpeedMs = customSpeedMs ?? Math.round(650 / playbackSpeed)

  const cyclePlaybackSpeed = useCallback(() => {
    setCustomSpeedMs(null)
    setPlaybackSpeed((prev) => (prev === 1 ? 2 : prev === 2 ? 4 : 1))
  }, [])

  const setPlaybackSpeedMs = useCallback((ms: number) => {
    setCustomSpeedMs(ms)
  }, [])

  const selectedMonthIndex = useMemo(() => {
    const idx = months.findIndex((m) => m.month === selectedDateState)
    if (idx >= 0) return idx
    const prefixIdx = months.findIndex((m) => selectedDateState.startsWith(m.month))
    if (prefixIdx >= 0) return prefixIdx
    return Math.min(97, months.length - 1) // Feb 2023 default
  }, [months, selectedDateState])

  const selectedObservation = useMemo(
    () => months[selectedMonthIndex] ?? null,
    [months, selectedMonthIndex]
  )

  const selectedDate = selectedObservation?.month ?? selectedDateState

  const setSelectedMonthIndex = useCallback(
    (idx: number) => {
      const clamped = Math.max(0, Math.min(months.length - 1, Math.round(idx)))
      const target = months[clamped]
      if (target) {
        setSelectedDateState(target.month)
      }
    },
    [months]
  )

  const setSelectedDate = useCallback((dateStr: string) => {
    const normalized = dateStr.trim().slice(0, 7)
    if (normalized) {
      setSelectedDateState(normalized)
    }
  }, [])

  const stepForward = useCallback(() => {
    setSelectedMonthIndex((selectedMonthIndex + 1) % months.length)
  }, [selectedMonthIndex, months.length, setSelectedMonthIndex])

  const stepBackward = useCallback(() => {
    setSelectedMonthIndex((selectedMonthIndex - 1 + months.length) % months.length)
  }, [selectedMonthIndex, months.length, setSelectedMonthIndex])

  useEffect(() => {
    if (!isPlaying || months.length <= 1) return
    const timer = window.setInterval(() => {
      setSelectedDateState((prevDate) => {
        const currentIdx = months.findIndex((m) => m.month === prevDate)
        const nextIdx = currentIdx >= 0 ? (currentIdx + 1) % months.length : 0
        return months[nextIdx]?.month ?? prevDate
      })
    }, playbackSpeedMs)
    return () => window.clearInterval(timer)
  }, [isPlaying, playbackSpeedMs, months])

  return {
    months,
    selectedMonthIndex,
    selectedDate,
    selectedObservation,
    dateFilterMode,
    isPlaying,
    playbackSpeed,
    playbackSpeedMs,
    setSelectedMonthIndex,
    setSelectedDate,
    setDateFilterMode,
    setIsPlaying,
    cyclePlaybackSpeed,
    setPlaybackSpeedMs,
    stepForward,
    stepBackward
  }
}
