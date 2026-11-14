import type { EventRecord, PhenomenonDefinition } from '../types/phenomenon'
import type { SarOverlayLayer, TimelineMonthPoint } from '../types/sar'

export const LM_STUDIO_DEFAULT_URL = 'http://127.0.0.1:1234'
export const LM_STUDIO_DEFAULT_MODEL = 'qwen2.5-3b-instruct'

export function normalizeLmStudioBaseUrl(rawUrl?: string): string {
  const trimmed = (rawUrl || LM_STUDIO_DEFAULT_URL).trim().replace(/\/+$/, '')
  if (!trimmed) return LM_STUDIO_DEFAULT_URL
  const hasScheme = /^https?:\/\//i.test(trimmed)
  const withScheme = hasScheme ? trimmed : `http://${trimmed}`
  try {
    const parsed = new URL(withScheme)
    const isIpv4OrLocal =
      parsed.hostname === 'localhost' || /^\d{1,3}(\.\d{1,3}){3}$/.test(parsed.hostname)
    if (!parsed.port && parsed.protocol === 'http:' && (isIpv4OrLocal || !hasScheme)) {
      parsed.port = '1234'
    }
    return parsed.toString().replace(/\/+$/, '')
  } catch {
    return withScheme
  }
}

export type LmStudioStatus = 'idle' | 'checking' | 'ready' | 'fallback' | 'error'

export interface SarChatContext {
  selectedPhenomenon: PhenomenonDefinition
  selectedEvent: EventRecord | null
  activeEventLayer: SarOverlayLayer | null
  selectedDate: string
  selectedObservation: TimelineMonthPoint | null
  allEvents: EventRecord[]
}

export interface ChatTurnInput {
  role: 'user' | 'assistant'
  content: string
}

export interface LmStudioConnectionInfo {
  ok: boolean
  baseUrl: string
  models: string[]
  activeModel: string | null
  error?: string
}

export async function checkLmStudioConnection(
  baseUrl: string = LM_STUDIO_DEFAULT_URL
): Promise<LmStudioConnectionInfo> {
  if (!window.api?.checkAiHealth) {
    return {
      ok: false,
      baseUrl,
      models: [],
      activeModel: null,
      error: 'Electron IPC bridge (window.api.checkAiHealth) is unavailable.'
    }
  }
  return window.api.checkAiHealth(baseUrl)
}

export function buildSarSystemPrompt(ctx: SarChatContext): string {
  const {
    selectedPhenomenon,
    selectedEvent,
    activeEventLayer,
    selectedDate,
    selectedObservation,
    allEvents
  } = ctx

  const compactEventCatalog = allEvents
    .map((ev) => `- ${ev.eventId} (${ev.eventDate}, ${ev.regionName}): ${ev.headlineMetric}`)
    .join('\n')

  const activeLayerStats = activeEventLayer?.stats
    ? Object.entries(activeEventLayer.stats)
        .slice(0, 6)
        .map(([k, v]) => `${k}=${String(v)}`)
        .join(', ')
    : 'none'

  const activeEventBlock = selectedEvent
    ? [
        `Active Selected Event: ${selectedEvent.eventName} (${selectedEvent.eventId})`,
        `Date & Location: ${selectedEvent.displayDate} · ${selectedEvent.regionName}, ${selectedEvent.country} (${selectedEvent.latitude.toFixed(2)}°, ${selectedEvent.longitude.toFixed(2)}°)`,
        `Headline SAR Metric: ${selectedEvent.headlineMetric}`,
        `Summary: ${selectedEvent.summary}`,
        `Sensor: ${selectedEvent.satelliteMetadata.mission} ${selectedEvent.satelliteMetadata.sensor} (${selectedEvent.satelliteMetadata.band}, ${selectedEvent.satelliteMetadata.polarization}, ${selectedEvent.satelliteMetadata.resolution})`,
        `Physics: ${selectedEvent.scientificExplanation.whySarDetectsIt.primaryMechanism}`,
        `Drivers: Natural=${selectedEvent.causes.naturalDriver} | Human=${selectedEvent.causes.humanDriver}`,
        activeEventLayer
          ? `Active Layer: ${activeEventLayer.title} (${activeEventLayer.band} ${activeEventLayer.polarization}) · Stats: ${activeLayerStats}`
          : ''
      ]
        .filter(Boolean)
        .join('\n')
    : 'Active Selected Event: None'

  const observationBlock = selectedObservation
    ? `Active Timeline Month (${selectedDate}): Manaus Q=${Math.round(selectedObservation.discharge_manaus_m3s).toLocaleString()} m³/s, Precip=${selectedObservation.precip_mm} mm, Fires=${selectedObservation.fire_hotspots_amazon.toLocaleString()}, SoilMoisture=${selectedObservation.soil_moisture_idx.toFixed(1)}%, FloodPulse=${selectedObservation.flood_pulse_idx.toFixed(1)}%, DroughtFireIdx=${selectedObservation.drought_fire_idx.toFixed(1)}%, GlobalFrozen=${selectedObservation.global_frozen_pct.toFixed(1)}%, SeaIce=${selectedObservation.global_sea_ice_idx.toFixed(1)}%, S1Scenes=${selectedObservation.s1_scenes}, NISARScenes=${selectedObservation.nisar_scenes}.`
    : `Active Timeline Month: ${selectedDate}`

  return [
    'You are the local SARs-Unlimited scientific AI assistant running on Qwen2.5-3B-Instruct via LM Studio.',
    'Help the user understand Synthetic Aperture Radar (SAR) Earth observation, radar scattering physics, and the 2015–2026 global & Amazon crisis events displayed on the 3D globe.',
    'Keep explanations clear, accurate, concise, and grounded in the verified telemetry below. Do not invent numbers.',
    '',
    'Core SAR Wavelength & Scattering Reference:',
    '- C-band (5.6 cm; Sentinel-1, OPERA DSWx/DIST): upper canopy leaves, ocean capillary ripples, urban corners, flood mapping through clouds, InSAR fault fringes.',
    '- S-band (12 cm; NISAR S-SAR): intermediate branches, crops, wetlands, glaciers.',
    '- L-band (24 cm; NASA-ISRO NISAR GCOV, ALOS-2): penetrates dense rainforest canopy to measure sub-canopy trunks, flooded-forest double-bounce (HHHH), and woody biomass (HVHV).',
    '- Mechanisms: Specular mirror reflection (calm water/oil slicks/smooth tephra: VV <= -15 to -24 dB); Dihedral double-bounce (flooded trunks/urban walls: bright VV up to +1 dB); Volume scattering (3D canopy depolarization in VH/HVHV; clearing/burn drop ΔVH <= -2 dB); Dielectric constant (εr ~ 80 liquid water vs ~3–5 dry soil/frozen ice).',
    '- 2015–16 El Niño Mega-Drought Baseline (el_nino_drought_2015, 2015-11 / Jan 2016 Manaus): 15.48% exposed channel mudflats/sandbars (ΔVV >= +2 dB), 1.76% desiccation drop; Sentinel-1A C-band VV p10=-18.15 dB, median=-7.05 dB, p90=-6.12 dB (granule S1A_IW_GRDH_1SDV_20160117T093855).',
    '',
    `Active Phenomenon: ${selectedPhenomenon.displayName} (${selectedPhenomenon.code}, scope: ${selectedPhenomenon.geographicScope}) — ${selectedPhenomenon.description}`,
    observationBlock,
    activeEventBlock,
    '',
    'Verified 15-Event Catalog:',
    compactEventCatalog
  ].join('\n')
}

export function buildLocalSarFallbackResponse(question: string, ctx: SarChatContext): string {
  const q = question.toLowerCase()
  const { selectedEvent, selectedPhenomenon, activeEventLayer, selectedDate, selectedObservation, allEvents } =
    ctx

  if (q.includes('el niño') || q.includes('el nino') || q.includes('2015')) {
    const elNino = allEvents.find((e) => e.eventId === 'el_nino_drought_2015')
    if (elNino) {
      return [
        `**${elNino.eventName} (${elNino.displayDate})**`,
        `- **Headline SAR Signal:** ${elNino.headlineMetric}`,
        `- **Location:** ${elNino.regionName}, ${elNino.country} (${elNino.latitude.toFixed(2)}°, ${elNino.longitude.toFixed(2)}°)`,
        `- **Sentinel-1A C-band VV Metrics:** \`15.48%\` exposed mudflats/sandbars (\`ΔVV >= +2 dB\`), \`1.76%\` desiccation drop; backscatter percentiles \`p10 = -18.15 dB\`, \`median = -7.05 dB\`, \`p90 = -6.12 dB\`.`,
        `- **Why SAR Detects It:** ${elNino.scientificExplanation.whySarDetectsIt.primaryMechanism}`,
        `- **Drivers:** ${elNino.causes.naturalDriver}`
      ].join('\n')
    }
  }

  if (
    q.includes('band') ||
    q.includes('c-band') ||
    q.includes('l-band') ||
    q.includes('s-band') ||
    q.includes('wavelength') ||
    q.includes('nisar')
  ) {
    return [
      '**Multi-Frequency SAR Wavelength Penetration:**',
      '- **C-Band (5.6 cm — Sentinel-1, OPERA):** Interacts with upper canopy leaves, ocean ripples, urban facades, and exposed sandbars; ideal for 6–12 day flood mapping and InSAR deformation.',
      '- **S-Band (12 cm — NISAR S-SAR):** Probes intermediate tree branches, agricultural crops, and wetlands.',
      '- **L-Band (24 cm — NASA-ISRO NISAR GCOV):** Penetrates dense rainforest canopies to reach tree trunks and flooded forest floors (strong `HHHH` double-bounce and `HVHV` woody biomass signal).'
    ].join('\n')
  }

  if (q.includes('double-bounce') || q.includes('double bounce') || q.includes('flood')) {
    return [
      '**SAR Flood & Double-Bounce Physics:**',
      '- **Open Water (Specular Reflection):** Smooth water reflects oblique radar pulses away from the antenna, appearing dark (`VV <= -15 dB` to `-24 dB`).',
      '- **Sub-Canopy / Urban Flood (Dihedral Double-Bounce):** Standing water reflects pulses off vertical tree trunks or building walls right back to the satellite, creating bright hotspots (`VV` reaching `-3.1 dB` to `> +1 dB`).'
    ].join('\n')
  }

  if (selectedEvent) {
    return [
      `**Current Globe Focus — ${selectedEvent.eventName} (${selectedEvent.displayDate})**`,
      `- **Phenomenon:** ${selectedPhenomenon.displayName}`,
      `- **Headline Metric:** ${selectedEvent.headlineMetric}`,
      `- **Sensor & Layer:** ${activeEventLayer ? `${activeEventLayer.title} (${activeEventLayer.band} ${activeEventLayer.polarization})` : `${selectedEvent.satelliteMetadata.sensor} (${selectedEvent.satelliteMetadata.band})`}`,
      `- **Summary:** ${selectedEvent.summary}`,
      `- **SAR Mechanism:** ${selectedEvent.scientificExplanation.whySarDetectsIt.primaryMechanism}`,
      selectedObservation
        ? `- **Timeline (${selectedDate}):** Manaus discharge \`${Math.round(selectedObservation.discharge_manaus_m3s).toLocaleString()} m³/s\`, Soil Moisture \`${selectedObservation.soil_moisture_idx.toFixed(1)}%\`, Fires \`${selectedObservation.fire_hotspots_amazon.toLocaleString()}\`.`
        : ''
    ]
      .filter(Boolean)
      .join('\n')
  }

  return `Active Phenomenon: **${selectedPhenomenon.displayName}** (${selectedDate}). ${selectedPhenomenon.description}`
}

export interface StreamChatOptions {
  history: ChatTurnInput[]
  userMessage: string
  context: SarChatContext
  baseUrl?: string
  model?: string
  onToken: (fullTextSoFar: string) => void
  signal?: AbortSignal
}

export interface ChatResponseResult {
  text: string
  mode: 'lmstudio' | 'fallback'
  model?: string
  warning?: string
}

export async function generateAiChatResponse({
  history,
  userMessage,
  context,
  baseUrl = LM_STUDIO_DEFAULT_URL,
  model = LM_STUDIO_DEFAULT_MODEL,
  onToken,
  signal
}: StreamChatOptions): Promise<ChatResponseResult> {
  if (!window.api?.startAiChat) {
    const fallback = buildLocalSarFallbackResponse(userMessage, context)
    onToken(fallback)
    return {
      text: fallback,
      mode: 'fallback',
      warning: 'Electron IPC bridge unavailable. Using verified SAR telemetry fallback.'
    }
  }

  const requestId = `lm-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const messages = [
    { role: 'system' as const, content: buildSarSystemPrompt(context) },
    ...history.slice(-8),
    { role: 'user' as const, content: userMessage }
  ]

  return new Promise<ChatResponseResult>((resolve) => {
    let settled = false
    let latestText = ''
    let offChunk: (() => void) | null = null
    let offDone: (() => void) | null = null
    let offError: (() => void) | null = null

    const cleanup = (): void => {
      offChunk?.()
      offDone?.()
      offError?.()
      signal?.removeEventListener('abort', handleAbort)
    }

    const handleAbort = (): void => {
      void window.api.abortAiChat(requestId)
    }

    if (signal?.aborted) {
      resolve({
        text: '',
        mode: 'lmstudio',
        model
      })
      return
    }

    signal?.addEventListener('abort', handleAbort, { once: true })

    offChunk = window.api.onAiChatChunk((data) => {
      if (data.requestId !== requestId || settled) return
      latestText = data.fullText
      onToken(latestText)
    })

    offDone = window.api.onAiChatDone((data) => {
      if (data.requestId !== requestId || settled) return
      settled = true
      cleanup()
      const finalText = data.fullText.trim() || latestText.trim()
      resolve({
        text: finalText,
        mode: 'lmstudio',
        model: data.model
      })
    })

    offError = window.api.onAiChatError((data) => {
      if (data.requestId !== requestId || settled) return
      settled = true
      cleanup()

      if (data.aborted) {
        resolve({
          text: data.fullText || latestText || 'Generation stopped by user.',
          mode: 'lmstudio',
          model
        })
        return
      }

      const fallback = buildLocalSarFallbackResponse(userMessage, context)
      onToken(fallback)
      resolve({
        text: fallback,
        mode: 'fallback',
        warning: `${data.error} — Showing verified SAR telemetry fallback.`
      })
    })

    void window.api
      .startAiChat(requestId, {
        baseUrl,
        model,
        messages,
        temperature: 0.35,
        maxTokens: 768
      })
      .catch((err) => {
        if (settled) return
        settled = true
        cleanup()
        const msg = err instanceof Error ? err.message : String(err)
        const fallback = buildLocalSarFallbackResponse(userMessage, context)
        onToken(fallback)
        resolve({
          text: fallback,
          mode: 'fallback',
          warning: `${msg} — Showing verified SAR telemetry fallback.`
        })
      })
  })
}
