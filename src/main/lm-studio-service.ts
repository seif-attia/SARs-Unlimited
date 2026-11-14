import type { WebContents } from 'electron'

export const DEFAULT_LM_STUDIO_URL = 'http://127.0.0.1:1234'
export const DEFAULT_LM_STUDIO_MODEL = 'qwen2.5-3b-instruct'

export interface LmStudioMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface LmStudioChatPayload {
  baseUrl?: string
  model?: string
  messages: LmStudioMessage[]
  temperature?: number
  maxTokens?: number
}

export interface LmStudioHealthResult {
  ok: boolean
  baseUrl: string
  models: string[]
  activeModel: string | null
  error?: string
}

const activeStreams = new Map<string, AbortController>()

function normalizeBaseUrl(rawUrl?: string): string {
  const trimmed = (rawUrl || DEFAULT_LM_STUDIO_URL).trim().replace(/\/+$/, '')
  return trimmed || DEFAULT_LM_STUDIO_URL
}

function pickPreferredModel(models: string[], requestedModel?: string): string {
  if (requestedModel && models.includes(requestedModel)) {
    return requestedModel
  }
  const qwenMatch = models.find((id) => id.toLowerCase().includes('qwen2.5-3b-instruct'))
  if (qwenMatch) {
    return qwenMatch
  }
  return models[0] || requestedModel || DEFAULT_LM_STUDIO_MODEL
}

/**
 * Probes LM Studio's OpenAI-compatible `/v1/models` endpoint to verify the local server is running
 * and detect the loaded model (preferring `qwen2.5-3b-instruct`).
 */
export async function checkLmStudioHealth(rawBaseUrl?: string): Promise<LmStudioHealthResult> {
  const baseUrl = normalizeBaseUrl(rawBaseUrl)
  try {
    const response = await fetch(`${baseUrl}/v1/models`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000)
    })

    if (!response.ok) {
      return {
        ok: false,
        baseUrl,
        models: [],
        activeModel: null,
        error: `LM Studio returned HTTP ${response.status}`
      }
    }

    const data = (await response.json()) as { data?: Array<{ id?: string }> }
    const models = (data.data ?? [])
      .map((entry) => entry.id)
      .filter((id): id is string => typeof id === 'string' && id.length > 0)

    return {
      ok: true,
      baseUrl,
      models,
      activeModel: pickPreferredModel(models)
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return {
      ok: false,
      baseUrl,
      models: [],
      activeModel: null,
      error: `Cannot reach LM Studio at ${baseUrl} (${msg}). Make sure LM Studio Local Server is started on port 1234 with ${DEFAULT_LM_STUDIO_MODEL} loaded.`
    }
  }
}

export function abortLmStudioChat(requestId: string): boolean {
  const controller = activeStreams.get(requestId)
  if (!controller) return false
  controller.abort()
  activeStreams.delete(requestId)
  return true
}

/**
 * Streams a chat completion from LM Studio's `/v1/chat/completions` endpoint
 * and forwards token chunks to the renderer via Electron IPC.
 */
export async function streamLmStudioChat(
  sender: WebContents,
  requestId: string,
  payload: LmStudioChatPayload
): Promise<void> {
  const baseUrl = normalizeBaseUrl(payload.baseUrl)
  const controller = new AbortController()
  activeStreams.set(requestId, controller)

  let fullText = ''

  try {
    const health = await checkLmStudioHealth(baseUrl)
    const model = pickPreferredModel(health.models, payload.model)

    const response = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: payload.messages,
        temperature: payload.temperature ?? 0.35,
        max_tokens: payload.maxTokens ?? 768,
        stream: true
      }),
      signal: controller.signal
    })

    if (!response.ok || !response.body) {
      const errBody = await response.text().catch(() => '')
      throw new Error(
        `LM Studio HTTP ${response.status}${errBody ? `: ${errBody.slice(0, 200)}` : ''}`
      )
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder('utf-8')
    let buffer = ''

    while (true) {
      const { value, done } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split(/\r?\n/)
      buffer = lines.pop() ?? ''

      for (const rawLine of lines) {
        const line = rawLine.trim()
        if (!line || !line.startsWith('data:')) continue

        const dataStr = line.slice(5).trim()
        if (dataStr === '[DONE]') {
          if (!sender.isDestroyed()) {
            sender.send('ai:chat-done', { requestId, fullText, model })
          }
          return
        }

        try {
          const parsed = JSON.parse(dataStr) as {
            choices?: Array<{ delta?: { content?: string }; message?: { content?: string } }>
          }
          const delta =
            parsed.choices?.[0]?.delta?.content ?? parsed.choices?.[0]?.message?.content ?? ''
          if (delta) {
            fullText += delta
            if (!sender.isDestroyed()) {
              sender.send('ai:chat-chunk', { requestId, delta, fullText })
            }
          }
        } catch {
          // Ignore malformed SSE keepalive/partial JSON lines
        }
      }
    }

    if (!sender.isDestroyed()) {
      sender.send('ai:chat-done', { requestId, fullText, model })
    }
  } catch (err) {
    const aborted = controller.signal.aborted
    const message = err instanceof Error ? err.message : String(err)
    if (!sender.isDestroyed()) {
      sender.send('ai:chat-error', { requestId, error: message, aborted, fullText })
    }
  } finally {
    activeStreams.delete(requestId)
  }
}
