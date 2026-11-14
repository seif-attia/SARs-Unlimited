import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

export interface AiChatMessagePayload {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface AiChatStartPayload {
  baseUrl?: string
  model?: string
  messages: AiChatMessagePayload[]
  temperature?: number
  maxTokens?: number
}

export interface AiHealthStatus {
  ok: boolean
  baseUrl: string
  models: string[]
  activeModel: string | null
  error?: string
}

export interface AiChatChunkEvent {
  requestId: string
  delta: string
  fullText: string
}

export interface AiChatDoneEvent {
  requestId: string
  fullText: string
  model: string
}

export interface AiChatErrorEvent {
  requestId: string
  error: string
  aborted: boolean
  fullText: string
}

export interface SarBridgeApi {
  getDataset: () => Promise<unknown>
  getAssetDataUrl: (relPath: string) => Promise<string>
  checkAiHealth: (baseUrl?: string) => Promise<AiHealthStatus>
  startAiChat: (requestId: string, payload: AiChatStartPayload) => Promise<void>
  abortAiChat: (requestId: string) => Promise<boolean>
  onAiChatChunk: (cb: (data: AiChatChunkEvent) => void) => () => void
  onAiChatDone: (cb: (data: AiChatDoneEvent) => void) => () => void
  onAiChatError: (cb: (data: AiChatErrorEvent) => void) => () => void
}

// Custom APIs for renderer
const api: SarBridgeApi = {
  getDataset: () => ipcRenderer.invoke('sar:get-dataset'),
  getAssetDataUrl: (relPath: string) => ipcRenderer.invoke('sar:get-asset-data-url', relPath),
  checkAiHealth: (baseUrl?: string) => ipcRenderer.invoke('ai:check-health', baseUrl),
  startAiChat: (requestId: string, payload: AiChatStartPayload) =>
    ipcRenderer.invoke('ai:start-chat', requestId, payload),
  abortAiChat: (requestId: string) => ipcRenderer.invoke('ai:abort-chat', requestId),
  onAiChatChunk: (cb) => {
    const listener = (_: Electron.IpcRendererEvent, data: AiChatChunkEvent): void => cb(data)
    ipcRenderer.on('ai:chat-chunk', listener)
    return () => ipcRenderer.removeListener('ai:chat-chunk', listener)
  },
  onAiChatDone: (cb) => {
    const listener = (_: Electron.IpcRendererEvent, data: AiChatDoneEvent): void => cb(data)
    ipcRenderer.on('ai:chat-done', listener)
    return () => ipcRenderer.removeListener('ai:chat-done', listener)
  },
  onAiChatError: (cb) => {
    const listener = (_: Electron.IpcRendererEvent, data: AiChatErrorEvent): void => cb(data)
    ipcRenderer.on('ai:chat-error', listener)
    return () => ipcRenderer.removeListener('ai:chat-error', listener)
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
