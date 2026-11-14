import { ElectronAPI } from '@electron-toolkit/preload'

export interface SarWindowApi {
  getDataset: () => Promise<unknown>
  getAssetDataUrl: (relPath: string) => Promise<string>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: SarWindowApi
  }
}
