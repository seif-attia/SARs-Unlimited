import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

export interface SarBridgeApi {
  getDataset: () => Promise<unknown>
  getAssetDataUrl: (relPath: string) => Promise<string>
}

// Custom APIs for renderer
const api: SarBridgeApi = {
  getDataset: () => ipcRenderer.invoke('sar:get-dataset'),
  getAssetDataUrl: (relPath: string) => ipcRenderer.invoke('sar:get-asset-data-url', relPath)
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
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
