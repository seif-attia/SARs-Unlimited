import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { AmazonSarDataset, SarOverlayLayer } from '../types/sar'
import type {
  DatasetStatus,
  EventRecord,
  HoveredLocationInfo,
  PhenomenonDefinition,
  ScientificExplanationContent,
  StatisticsPanelData,
  WidgetVisibilityState
} from '../types/phenomenon'
import { ALL_PHENOMENON_SLOTS } from '../data/phenomenonCatalog'
import {
  buildSynchronizedStatistics,
  type AdaptedSarPlatformData
} from '../services/phenomenonDataAdapter'
import { loadVerifiedSarDataset } from '../services/phenomenonDataService'
import { useTimelineSelection, type TimelineSelectionState } from './useTimelineSelection'

export const TOUR_STOP_IDS = [
  'el_nino_drought_2015',
  'larsen_c_a68_2017',
  'manaus_flood_2021',
  'lapalma_volcano_2021',
  'pakistan_flood_2022',
  'turkiye_insar_2023',
  'drought_fires_2024',
  'nisar_lband_2026'
] as const

export interface PhenomenonContextValue {
  platformData: AdaptedSarPlatformData | null
  dataset: AmazonSarDataset | null
  datasetStatus: DatasetStatus
  isDemoFallbackActive: boolean
  setIsDemoFallbackActive: (active: boolean) => void
  phenomena: PhenomenonDefinition[]
  globalPhenomena: PhenomenonDefinition[]
  amazonPhenomena: PhenomenonDefinition[]
  selectedPhenomenon: PhenomenonDefinition
  selectPhenomenonById: (id: string) => void
  allEvents: EventRecord[]
  filteredEvents: EventRecord[]
  phenomenonEvents: EventRecord[]
  selectedEvent: EventRecord | null
  selectEvent: (event: EventRecord | null) => void
  activeEventLayer: SarOverlayLayer | null
  selectEventLayerById: (layerId: string) => void
  sarOverlayOpacity: number
  setSarOverlayOpacity: (opacity: number) => void
  timeline: TimelineSelectionState
  liveScope: 'planet' | 'amazon'
  setLiveScope: (scope: 'planet' | 'amazon') => void
  showBasinProgression: boolean
  setShowBasinProgression: (show: boolean | ((prev: boolean) => boolean)) => void
  toggleBasinProgression: () => void
  activeSeasonalPhenomenonIds: string[]
  isTouring: boolean
  tourStopIdx: number
  tourStopCount: number
  toggleTour: () => void
  stopTour: () => void
  jumpTourStop: (nextIdx: number) => EventRecord | null
  hoveredLocation: HoveredLocationInfo | null
  setHoveredLocation: (loc: HoveredLocationInfo | null) => void
  lockedRegionId: string | null
  setLockedRegionId: (regionId: string | null) => void
  searchQuery: string
  setSearchQuery: (q: string) => void
  statistics: StatisticsPanelData
  scientificExplanation: ScientificExplanationContent
  widgetVisibility: WidgetVisibilityState
  toggleWidget: (widget: keyof WidgetVisibilityState) => void
  setWidgetVisible: (widget: keyof WidgetVisibilityState, visible: boolean) => void
  restoreAllWidgets: () => void
  reportModalEvent: EventRecord | null
  openReportModal: (event: EventRecord) => void
  closeReportModal: () => void
  mediaModalEvent: EventRecord | null
  openMediaModal: (event: EventRecord) => void
  closeMediaModal: () => void
}

export function usePhenomenonContext(): PhenomenonContextValue {
  const [platformData, setPlatformData] = useState<AdaptedSarPlatformData | null>(null)
  const [datasetStatus, setDatasetStatus] = useState<DatasetStatus>('PROCESSING')
  const [isDemoFallbackActive, setIsDemoFallbackActive] = useState<boolean>(false)

  useEffect(() => {
    let cancelled = false
    loadVerifiedSarDataset().then(({ platformData: loaded, status }) => {
      if (cancelled) return
      setPlatformData(loaded)
      setDatasetStatus(status)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const phenomena = useMemo(
    () => platformData?.phenomena ?? ALL_PHENOMENON_SLOTS,
    [platformData]
  )
  const globalPhenomena = useMemo(
    () => phenomena.filter((p) => p.geographicScope === 'global'),
    [phenomena]
  )
  const amazonPhenomena = useMemo(
    () => phenomena.filter((p) => p.geographicScope === 'amazon'),
    [phenomena]
  )

  const [selectedPhenomenonId, setSelectedPhenomenonId] = useState<string>('global-pheno-1')

  const selectedPhenomenon = useMemo(
    () =>
      phenomena.find((p) => p.id === selectedPhenomenonId) ??
      phenomena[0] ??
      ALL_PHENOMENON_SLOTS[0],
    [phenomena, selectedPhenomenonId]
  )

  const allEvents = useMemo(() => platformData?.events ?? [], [platformData])

  const timeline = useTimelineSelection({
    months: platformData?.months ?? [],
    initialDate: '2023-02'
  })

  const [liveScope, setLiveScope] = useState<'planet' | 'amazon'>('planet')
  const [showBasinProgression, setShowBasinProgression] = useState<boolean>(true)
  const [isTouring, setIsTouring] = useState<boolean>(false)
  const [tourStopIdx, setTourStopIdx] = useState<number>(0)
  const tourStopIdxRef = useRef<number>(0)

  const [hoveredLocation, setHoveredLocation] = useState<HoveredLocationInfo | null>(null)
  const [lockedRegionId, setLockedRegionId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedEventId, setSelectedEventId] = useState<string | null>('turkiye_insar_2023')
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null)
  const [sarOverlayOpacity, setSarOverlayOpacity] = useState<number>(0.86)

  const activeSeasonalPhenomenonIds = useMemo(
    () => timeline.selectedObservation?.active_phenomena ?? [],
    [timeline.selectedObservation]
  )

  // Phenomenon-matched events across full 2015–2026 period
  const phenomenonEvents = useMemo(() => {
    const matches = allEvents.filter(
      (ev) =>
        selectedPhenomenon.eventIds.includes(ev.eventId) ||
        ev.phenomenonId === selectedPhenomenon.id ||
        ev.additionalPhenomenonIds.includes(selectedPhenomenon.id)
    )
    return matches.length > 0
      ? matches
      : allEvents.filter((ev) => ev.scope === selectedPhenomenon.geographicScope)
  }, [allEvents, selectedPhenomenon])

  // Synchronized filtered events for the Event Summary panel
  const filteredEvents = useMemo(() => {
    let list = [...phenomenonEvents]

    if (timeline.dateFilterMode === 'exact_month') {
      list = list.filter((ev) => ev.eventDate === timeline.selectedDate)
    } else if (timeline.dateFilterMode === 'year') {
      const yearPrefix = timeline.selectedDate.slice(0, 4)
      list = list.filter((ev) => ev.eventDate.startsWith(yearPrefix))
    }

    if (lockedRegionId) {
      list = list.filter((ev) => ev.regionId === lockedRegionId)
    }

    const q = searchQuery.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (ev) =>
          ev.eventName.toLowerCase().includes(q) ||
          ev.summary.toLowerCase().includes(q) ||
          ev.regionName.toLowerCase().includes(q) ||
          ev.country.toLowerCase().includes(q) ||
          ev.headlineMetric.toLowerCase().includes(q)
      )
    }

    return list
  }, [
    phenomenonEvents,
    timeline.dateFilterMode,
    timeline.selectedDate,
    lockedRegionId,
    searchQuery
  ])

  const selectedEvent = useMemo(() => {
    if (selectedEventId) {
      const exact = allEvents.find((e) => e.eventId === selectedEventId)
      if (exact) return exact
    }
    return filteredEvents[0] ?? phenomenonEvents[0] ?? null
  }, [allEvents, selectedEventId, filteredEvents, phenomenonEvents])

  const activeEventLayer = useMemo<SarOverlayLayer | null>(() => {
    if (selectedEvent && selectedEvent.layers.length > 0) {
      if (selectedLayerId) {
        const match = selectedEvent.layers.find((l) => l.id === selectedLayerId)
        if (match) return match
      }
      const def = selectedEvent.layers.find((l) => l.id === selectedEvent.defaultLayerId)
      return def ?? selectedEvent.layers[0] ?? null
    }
    if (selectedPhenomenon.layers.length > 0) {
      if (selectedLayerId) {
        const match = selectedPhenomenon.layers.find((l) => l.id === selectedLayerId)
        if (match) return match
      }
      return selectedPhenomenon.layers[0] ?? null
    }
    return null
  }, [selectedEvent, selectedPhenomenon, selectedLayerId])

  const [widgetVisibility, setWidgetVisibility] = useState<WidgetVisibilityState>({
    statistics: false,
    eventSummary: false,
    scientificExplanation: false,
    timeline: false
  })

  const toggleWidget = useCallback((widget: keyof WidgetVisibilityState) => {
    setWidgetVisibility((prev) => ({
      ...prev,
      [widget]: !prev[widget]
    }))
  }, [])

  const setWidgetVisible = useCallback(
    (widget: keyof WidgetVisibilityState, visible: boolean) => {
      setWidgetVisibility((prev) => ({
        ...prev,
        [widget]: visible
      }))
    },
    []
  )

  const restoreAllWidgets = useCallback(() => {
    setWidgetVisibility({
      statistics: true,
      eventSummary: true,
      scientificExplanation: true,
      timeline: true
    })
  }, [])

  const applyEventSelectionInternal = useCallback(
    (event: EventRecord) => {
      restoreAllWidgets()
      timeline.setIsPlaying(false)
      setLiveScope(event.scope === 'global' ? 'planet' : 'amazon')
      if (event.phenomenonId) {
        setSelectedPhenomenonId(event.phenomenonId)
      }
      setSelectedEventId(event.eventId)
      setSelectedLayerId(event.defaultLayerId)
      timeline.setSelectedDate(event.eventDate)
    },
    [restoreAllWidgets, timeline]
  )

  const selectPhenomenonById = useCallback(
    (id: string) => {
      restoreAllWidgets()
      setIsTouring(false)
      timeline.setIsPlaying(false)
      const targetPheno = phenomena.find(
        (p) => p.id === id || p.sourcePhenomenonIds.includes(id)
      )
      setSelectedPhenomenonId(targetPheno ? targetPheno.id : id)
      if (!targetPheno) return

      setLiveScope(targetPheno.geographicScope === 'global' ? 'planet' : 'amazon')
      if (targetPheno.geographicScope === 'amazon') {
        setShowBasinProgression(true)
      }

      const matchingEvents = allEvents.filter(
        (ev) =>
          targetPheno.eventIds.includes(ev.eventId) ||
          ev.phenomenonId === targetPheno.id ||
          ev.additionalPhenomenonIds.includes(targetPheno.id)
      )
      const firstEv = matchingEvents[0] ?? null
      if (firstEv) {
        setSelectedEventId(firstEv.eventId)
        setSelectedLayerId(firstEv.defaultLayerId)
        timeline.setSelectedDate(firstEv.eventDate)
      } else {
        setSelectedEventId(null)
        setSelectedLayerId(targetPheno.defaultLayerId ?? null)
        // Jump timeline to peak month in 2025 if seasonal phenomenon specifies peakMonths
        if (targetPheno.peakMonths && targetPheno.peakMonths.length > 0) {
          const peakM = targetPheno.peakMonths[0]
          timeline.setSelectedDate(`2025-${String(peakM).padStart(2, '0')}`)
        }
      }
    },
    [restoreAllWidgets, phenomena, allEvents, timeline]
  )

  const selectEvent = useCallback(
    (event: EventRecord | null) => {
      setIsTouring(false)
      if (!event) {
        setSelectedEventId(null)
        setSelectedLayerId(null)
        return
      }
      applyEventSelectionInternal(event)
    },
    [applyEventSelectionInternal]
  )

  const selectEventLayerById = useCallback((layerId: string) => {
    setSelectedLayerId(layerId)
  }, [])

  const toggleBasinProgression = useCallback(() => {
    setShowBasinProgression((prev) => {
      if (prev) timeline.setIsPlaying(false)
      return !prev
    })
  }, [timeline])

  const jumpTourStop = useCallback(
    (nextIdx: number): EventRecord | null => {
      if (allEvents.length === 0) return null
      const wrapped =
        ((nextIdx % TOUR_STOP_IDS.length) + TOUR_STOP_IDS.length) % TOUR_STOP_IDS.length
      tourStopIdxRef.current = wrapped
      setTourStopIdx(wrapped)
      const evtId = TOUR_STOP_IDS[wrapped]
      const evt = allEvents.find((e) => e.eventId === evtId) ?? null
      if (evt) {
        applyEventSelectionInternal(evt)
      }
      return evt
    },
    [allEvents, applyEventSelectionInternal]
  )

  const toggleTour = useCallback(() => {
    if (allEvents.length === 0) return
    timeline.setIsPlaying(false)
    setIsTouring((prev) => {
      const next = !prev
      if (next) {
        tourStopIdxRef.current = 0
        setTourStopIdx(0)
        const evt = allEvents.find((e) => e.eventId === TOUR_STOP_IDS[0])
        if (evt) {
          applyEventSelectionInternal(evt)
        }
      }
      return next
    })
  }, [allEvents, applyEventSelectionInternal, timeline])

  const stopTour = useCallback(() => {
    setIsTouring(false)
  }, [])

  // Auto-advance Guided Tour stops every 5.8s across signature 2015–2026 crises
  useEffect(() => {
    if (!isTouring || allEvents.length === 0) return
    const id = window.setInterval(() => {
      jumpTourStop(tourStopIdxRef.current + 1)
    }, 5800)
    return () => window.clearInterval(id)
  }, [isTouring, allEvents.length, jumpTourStop])

  const effectiveDatasetStatus: DatasetStatus = isDemoFallbackActive
    ? 'DEMO'
    : datasetStatus

  const statistics = useMemo(
    () =>
      buildSynchronizedStatistics({
        platformData,
        selectedPhenomenon,
        selectedEvent,
        selectedMonth: timeline.selectedObservation,
        filteredEvents,
        phenomenonEvents,
        isDemoFallback: isDemoFallbackActive
      }),
    [
      platformData,
      selectedPhenomenon,
      selectedEvent,
      timeline.selectedObservation,
      filteredEvents,
      phenomenonEvents,
      isDemoFallbackActive
    ]
  )

  const scientificExplanation = useMemo(
    () => selectedEvent?.scientificExplanation ?? selectedPhenomenon.scientificExplanation,
    [selectedEvent, selectedPhenomenon]
  )

  const [reportModalEvent, setReportModalEvent] = useState<EventRecord | null>(null)
  const [mediaModalEvent, setMediaModalEvent] = useState<EventRecord | null>(null)

  const openReportModal = useCallback((ev: EventRecord) => {
    setReportModalEvent(ev)
  }, [])

  const closeReportModal = useCallback(() => {
    setReportModalEvent(null)
  }, [])

  const openMediaModal = useCallback((ev: EventRecord) => {
    setMediaModalEvent(ev)
  }, [])

  const closeMediaModal = useCallback(() => {
    setMediaModalEvent(null)
  }, [])

  return {
    platformData,
    dataset: platformData?.dataset ?? null,
    datasetStatus: effectiveDatasetStatus,
    isDemoFallbackActive,
    setIsDemoFallbackActive,
    phenomena,
    globalPhenomena,
    amazonPhenomena,
    selectedPhenomenon,
    selectPhenomenonById,
    allEvents,
    filteredEvents,
    phenomenonEvents,
    selectedEvent,
    selectEvent,
    activeEventLayer,
    selectEventLayerById,
    sarOverlayOpacity,
    setSarOverlayOpacity,
    timeline,
    liveScope,
    setLiveScope,
    showBasinProgression,
    setShowBasinProgression,
    toggleBasinProgression,
    activeSeasonalPhenomenonIds,
    isTouring,
    tourStopIdx,
    tourStopCount: TOUR_STOP_IDS.length,
    toggleTour,
    stopTour,
    jumpTourStop,
    hoveredLocation,
    setHoveredLocation,
    lockedRegionId,
    setLockedRegionId,
    searchQuery,
    setSearchQuery,
    statistics,
    scientificExplanation,
    widgetVisibility,
    toggleWidget,
    setWidgetVisible,
    restoreAllWidgets,
    reportModalEvent,
    openReportModal,
    closeReportModal,
    mediaModalEvent,
    openMediaModal,
    closeMediaModal
  }
}
