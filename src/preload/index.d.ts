import { ElectronAPI } from '@electron-toolkit/preload'
import type {
  AiChatChunkEvent,
  AiChatDoneEvent,
  AiChatErrorEvent,
  AiChatStartPayload,
  AiHealthStatus
} from './index'

export interface SarWindowApi {
  getDataset: () => Promise<unknown>
  getAssetDataUrl: (relPath: string) => Promise<string>
  checkAiHealth: (baseUrl?: string) => Promise<AiHealthStatus>
  startAiChat: (requestId: string, payload: AiChatStartPayload) => Promise<void>
  abortAiChat: (requestId: string) => Promise<boolean>
  onAiChatChunk: (cb: (data: AiChatChunkEvent) => void) => () => void
  onAiChatDone: (cb: (data: AiChatDoneEvent) => void) => () => void
  onAiChatError: (cb: (data: AiChatErrorEvent) => void) => () => void
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: SarWindowApi
  }
}
