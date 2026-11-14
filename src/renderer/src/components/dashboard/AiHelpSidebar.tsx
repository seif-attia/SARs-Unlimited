import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Bot,
  CheckCircle2,
  Cpu,
  PanelRightClose,
  RefreshCw,
  Send,
  Sparkles,
  Square,
  Trash2,
  User
} from 'lucide-react'
import type { EventRecord, PhenomenonDefinition } from '../../types/phenomenon'
import type { SarOverlayLayer } from '../../types/sar'
import type { TimelineSelectionState } from '../../hooks/useTimelineSelection'
import {
  checkLmStudioConnection,
  generateAiChatResponse,
  LM_STUDIO_DEFAULT_MODEL,
  LM_STUDIO_DEFAULT_URL,
  type ChatTurnInput,
  type LmStudioStatus,
  type SarChatContext
} from '../../services/lmStudioService'

export interface AiHelpSidebarProps {
  isOpen: boolean
  onClose: () => void
  selectedPhenomenon: PhenomenonDefinition
  selectedEvent: EventRecord | null
  activeEventLayer: SarOverlayLayer | null
  timeline: TimelineSelectionState
  allEvents: EventRecord[]
  lmStudioBaseUrl?: string
  connectionRefreshToken?: number
  onConnectionStatusChange?: (connected: boolean) => void
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
  mode?: 'lmstudio' | 'fallback'
  warning?: string
}

const STARTER_PROMPTS = [
  'Explain the 2015 El Niño drought SAR metrics.',
  'Explain the currently selected event on the globe.',
  'How do C-band, S-band, and L-band SAR differ?',
  'Why does flooded forest cause bright double-bounce?'
]

const INITIAL_WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome-msg',
  role: 'assistant',
  createdAt: 'LM Studio',
  content: [
    'Welcome to SARs-Unlimited! I am your AI assistant,' ,
    'here to help you explore 12 years of Earth and Amazon radar data.',
    'What would you like to investigate today?.'
  ].join('\n')
}

function renderInlineSegments(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return <strong key={idx}>{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code key={idx} className="sars-ai-inline-code">
          {part.slice(1, -1)}
        </code>
      )
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>
  })
}

function renderFormattedMessage(content: string): React.ReactNode {
  const lines = content.split('\n')
  const blocks: React.ReactNode[] = []
  let listItems: string[] = []

  const flushList = (keyPrefix: string): void => {
    if (listItems.length === 0) return
    blocks.push(
      <ul key={`${keyPrefix}-ul`} className="sars-ai-msg-list">
        {listItems.map((item, idx) => (
          <li key={idx}>{renderInlineSegments(item)}</li>
        ))}
      </ul>
    )
    listItems = []
  }

  lines.forEach((rawLine, idx) => {
    const line = rawLine.trim()
    if (!line) {
      flushList(`line-${idx}`)
      return
    }
    if (/^[-*•]\s+/.test(line)) {
      listItems.push(line.replace(/^[-*•]\s+/, ''))
      return
    }
    if (/^\d+\.\s+/.test(line)) {
      listItems.push(line.replace(/^\d+\.\s+/, ''))
      return
    }
    flushList(`line-${idx}`)
    if (/^#{1,3}\s+/.test(line)) {
      blocks.push(
        <p key={`h-${idx}`} className="sars-ai-msg-heading">
          {renderInlineSegments(line.replace(/^#{1,3}\s+/, ''))}
        </p>
      )
      return
    }
    blocks.push(
      <p key={`p-${idx}`} className="sars-ai-msg-para">
        {renderInlineSegments(line)}
      </p>
    )
  })

  flushList('end')
  return blocks.length > 0 ? blocks : content
}

function formatNowTime(): string {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export const AiHelpSidebar: React.FC<AiHelpSidebarProps> = ({
  isOpen,
  onClose,
  selectedPhenomenon,
  selectedEvent,
  activeEventLayer,
  timeline,
  allEvents,
  lmStudioBaseUrl = LM_STUDIO_DEFAULT_URL,
  connectionRefreshToken = 0,
  onConnectionStatusChange
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_WELCOME_MESSAGE])
  const [inputValue, setInputValue] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState<boolean>(false)
  const [engineStatus, setEngineStatus] = useState<LmStudioStatus>('idle')
  const [activeModel, setActiveModel] = useState<string>(LM_STUDIO_DEFAULT_MODEL)
  const [engineError, setEngineError] = useState<string | null>(null)

  const scrollEndRef = useRef<HTMLDivElement | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const hasAutoCheckedRef = useRef<boolean>(false)

  const sarContext = useMemo<SarChatContext>(
    () => ({
      selectedPhenomenon,
      selectedEvent,
      activeEventLayer,
      selectedDate: timeline.selectedDate,
      selectedObservation: timeline.selectedObservation,
      allEvents
    }),
    [
      selectedPhenomenon,
      selectedEvent,
      activeEventLayer,
      timeline.selectedDate,
      timeline.selectedObservation,
      allEvents
    ]
  )

  const checkLmStudioServer = useCallback(async () => {
    setEngineStatus('checking')
    const health = await checkLmStudioConnection(lmStudioBaseUrl)
    if (health.ok) {
      setEngineStatus('ready')
      setActiveModel(health.activeModel || LM_STUDIO_DEFAULT_MODEL)
      setEngineError(null)
      onConnectionStatusChange?.(true)
    } else {
      setEngineStatus('fallback')
      setEngineError(
        health.error ||
          `Model is not connected. Make sure LM Studio Local Server is running at ${lmStudioBaseUrl}.`
      )
      onConnectionStatusChange?.(false)
    }
  }, [lmStudioBaseUrl, onConnectionStatusChange])

  useEffect(() => {
    hasAutoCheckedRef.current = false
    if (isOpen) {
      hasAutoCheckedRef.current = true
      void checkLmStudioServer()
    }
  }, [lmStudioBaseUrl, connectionRefreshToken, isOpen, checkLmStudioServer])

  // Check LM Studio connection when the sidebar is opened
  useEffect(() => {
    if (!isOpen) return
    if (!hasAutoCheckedRef.current) {
      hasAutoCheckedRef.current = true
      void checkLmStudioServer()
    }
    const timer = window.setTimeout(() => {
      textareaRef.current?.focus()
    }, 80)
    return () => window.clearTimeout(timer)
  }, [isOpen, checkLmStudioServer])

  useEffect(() => {
    if (!isOpen) return
    scrollEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, isOpen, isGenerating])

  const handleStopGeneration = useCallback(() => {
    abortControllerRef.current?.abort()
    setIsGenerating(false)
  }, [])

  const isModelConnected = engineStatus === 'ready'
  const isCheckingConnection = engineStatus === 'checking' || engineStatus === 'idle'

  const handleSendPrompt = useCallback(
    async (rawPrompt?: string) => {
      const text = (rawPrompt ?? inputValue).trim()
      if (!text || isGenerating || !isModelConnected) return

      if (!rawPrompt) {
        setInputValue('')
      }

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: text,
        createdAt: formatNowTime()
      }

      const assistantMsgId = `assistant-${Date.now() + 1}`
      const placeholderAssistant: ChatMessage = {
        id: assistantMsgId,
        role: 'assistant',
        content: '',
        createdAt: formatNowTime()
      }

      const historyForModel: ChatTurnInput[] = messages
        .filter((m) => m.id !== INITIAL_WELCOME_MESSAGE.id && m.content.trim().length > 0)
        .map((m) => ({ role: m.role, content: m.content }))

      setMessages((prev) => [...prev, userMsg, placeholderAssistant])
      setIsGenerating(true)

      const controller = new AbortController()
      abortControllerRef.current = controller

      try {
        const result = await generateAiChatResponse({
          history: historyForModel,
          userMessage: text,
          context: sarContext,
          baseUrl: lmStudioBaseUrl,
          model: activeModel,
          signal: controller.signal,
          onToken: (partial) => {
            setMessages((prev) =>
              prev.map((m) => (m.id === assistantMsgId ? { ...m, content: partial } : m))
            )
          }
        })

        setEngineStatus(result.mode === 'lmstudio' ? 'ready' : 'fallback')
        if (result.model) {
          setActiveModel(result.model)
        }
        if (result.warning) {
          setEngineError(result.warning)
        } else {
          setEngineError(null)
        }

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  content:
                    result.text ||
                    m.content ||
                    'Generation stopped before output completed.',
                  mode: result.mode,
                  warning: result.warning
                }
              : m
          )
        )
      } finally {
        abortControllerRef.current = null
        setIsGenerating(false)
      }
    },
    [activeModel, inputValue, isGenerating, isModelConnected, lmStudioBaseUrl, messages, sarContext]
  )

  const handleClearChat = useCallback(() => {
    if (isGenerating) {
      void handleStopGeneration()
    }
    setMessages([INITIAL_WELCOME_MESSAGE])
  }, [isGenerating, handleStopGeneration])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void handleSendPrompt()
    }
  }

  if (!isOpen) return null

  const showDisconnectedNotice =
    !isModelConnected &&
    (engineStatus === 'error' ||
      engineStatus === 'fallback' ||
      (engineStatus === 'checking' && engineError !== null))

  const statusLabel = isGenerating
    ? 'Generating…'
    : engineStatus === 'ready'
      ? 'Ready (LM Studio)'
      : engineStatus === 'checking'
        ? 'Connecting…'
        : engineStatus === 'fallback'
          ? 'Not Connected'
          : engineStatus === 'error'
            ? 'Connection Error'
            : 'Checking…'

  return (
    <aside className="sars-panel sars-ai-sidebar" aria-label="AI Help Chat Sidebar">
      {/* HEADER */}
      <div className="sars-ai-sidebar__header">
        <div className="sars-ai-sidebar__title-wrap">
          <div className="sars-ai-sidebar__title-row">
            <Sparkles size={14} className="sars-ai-sidebar__accent-icon" />
            <h2 className="sars-ai-sidebar__title">Ask for Help · Local AI</h2>
          </div>
          <div className="sars-ai-sidebar__subtitle-row">
            <span className="sars-ai-model-tag" title={`LM Studio: ${activeModel}`}>
              <Cpu size={11} />
              <span>{activeModel}</span>
            </span>
            <span className={`sars-ai-status-pill is-${engineStatus === 'checking' ? 'loading' : engineStatus}`}>
              {engineStatus === 'ready' && !isGenerating && <CheckCircle2 size={10} />}
              <span>{statusLabel}</span>
            </span>
          </div>
        </div>

        <div className="sars-ai-sidebar__header-actions">
          <button
            type="button"
            className="sars-ai-icon-btn"
            onClick={handleClearChat}
            title="Clear chat history"
            aria-label="Clear chat history"
          >
            <Trash2 size={13} />
          </button>
          <button
            type="button"
            className="sars-hide-btn"
            onClick={onClose}
            title="Close AI Help Sidebar"
          >
            <PanelRightClose size={12} />
            <span>Hide</span>
          </button>
        </div>
      </div>

      {/* LIVE GLOBE CONTEXT CHIP */}
      <div className="sars-ai-context-chip">
        <span className="sars-ai-context-chip__label">LIVE CONTEXT</span>
        <span className="sars-ai-context-chip__text">
          {selectedPhenomenon.shortLabel}
          {selectedEvent ? ` · ${selectedEvent.eventName}` : ''}
          {` · ${timeline.selectedDate}`}
        </span>
      </div>

      {/* CHAT MESSAGE THREAD */}
      <div className="sars-ai-messages" role="log" aria-live="polite">
        {(isModelConnected
          ? messages
          : messages.filter((msg) => msg.id !== INITIAL_WELCOME_MESSAGE.id)
        ).map((msg) => {
          const isUser = msg.role === 'user'
          const isStreamingPlaceholder = !isUser && isGenerating && msg.content.length === 0
          return (
            <div
              key={msg.id}
              className={`sars-ai-msg ${isUser ? 'is-user' : 'is-assistant'}`}
            >
              <div className="sars-ai-msg__avatar" aria-hidden="true">
                {isUser ? <User size={12} /> : <Bot size={12} />}
              </div>
              <div className="sars-ai-msg__bubble">
                <div className="sars-ai-msg__meta">
                  <span>{isUser ? 'You' : 'Qwen2.5-3B Local'}</span>
                  <span>{msg.createdAt}</span>
                </div>
                <div className="sars-ai-msg__content">
                  {isStreamingPlaceholder ? (
                    <span className="sars-ai-typing">Thinking via LM Studio…</span>
                  ) : isUser ? (
                    msg.content
                  ) : (
                    renderFormattedMessage(msg.content)
                  )}
                </div>
                {msg.mode === 'fallback' && (
                  <div className="sars-ai-msg__badge">Verified Local SAR Telemetry</div>
                )}
              </div>
            </div>
          )
        })}
        {showDisconnectedNotice && (
          <div className="sars-ai-msg is-assistant">
            <div className="sars-ai-msg__avatar" aria-hidden="true">
              <Bot size={12} />
            </div>
            <div className="sars-ai-msg__bubble">
              <div className="sars-ai-msg__meta">
                <span>{activeModel}</span>
                <span>Not Connected</span>
              </div>
              <div className="sars-ai-msg__content">
                <p className="sars-ai-msg-para">
                  Model is not connected. Please start LM Studio and click refresh to try
                  reconnecting.
                </p>
              </div>
              <button
                type="button"
                className="sars-ai-retry-btn sars-ai-msg__retry-btn"
                onClick={() => void checkLmStudioServer()}
                disabled={engineStatus === 'checking'}
              >
                <RefreshCw
                  size={11}
                  className={engineStatus === 'checking' ? 'spin-icon' : undefined}
                />
                <span>{engineStatus === 'checking' ? 'Reconnecting…' : 'Refresh'}</span>
              </button>
            </div>
          </div>
        )}
        <div ref={scrollEndRef} />
      </div>

      {/* STARTER PROMPTS (Shown when connected and thread only has welcome or few messages) */}
      {isModelConnected && messages.length <= 2 && (
        <div className="sars-ai-starters" aria-label="Suggested questions">
          {STARTER_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              className="sars-ai-starter-chip"
              onClick={() => void handleSendPrompt(prompt)}
              disabled={isGenerating || !isModelConnected}
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* INPUT BAR */}
      <form
        className="sars-ai-input-bar"
        onSubmit={(e) => {
          e.preventDefault()
          void handleSendPrompt()
        }}
      >
        <textarea
          ref={textareaRef}
          className="sars-ai-input-bar__textarea"
          placeholder={
            isModelConnected
              ? 'Ask Qwen2.5-3B about SAR events, dB metrics, or physics…'
              : isCheckingConnection
                ? 'Connecting to model…'
                : 'Model is not connected…'
          }
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={!isModelConnected}
          rows={2}
          aria-label="Ask local AI a question"
        />
        {isGenerating ? (
          <button
            type="button"
            className="sars-ai-send-btn is-stop"
            onClick={() => void handleStopGeneration()}
            title="Stop generation"
            aria-label="Stop generation"
          >
            <Square size={13} />
          </button>
        ) : (
          <button
            type="submit"
            className="sars-ai-send-btn"
            disabled={!isModelConnected || !inputValue.trim()}
            title={isModelConnected ? 'Send message (Enter)' : 'Model is not connected'}
            aria-label="Send message"
          >
            <Send size={13} />
          </button>
        )}
      </form>
    </aside>
  )
}
