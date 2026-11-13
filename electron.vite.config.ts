import { resolve } from 'path'
import { cpSync, existsSync, mkdirSync } from 'fs'
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'

// Automatically copy Cesium static assets (Workers, ThirdParty, Assets, Widgets)
// into src/renderer/public/cesium if not already present so Vite serves them at /cesium
function ensureCesiumAssets(): void {
  const cesiumSource = resolve('node_modules/cesium/Build/Cesium')
  const cesiumDest = resolve('src/renderer/public/cesium')
  const folders = ['Workers', 'ThirdParty', 'Assets', 'Widgets']

  if (!existsSync(cesiumSource)) return
  mkdirSync(cesiumDest, { recursive: true })

  for (const folder of folders) {
    const srcDir = resolve(cesiumSource, folder)
    const destDir = resolve(cesiumDest, folder)
    if (existsSync(srcDir) && !existsSync(destDir)) {
      cpSync(srcDir, destDir, { recursive: true })
    }
  }
}

ensureCesiumAssets()

export default defineConfig({
  main: {},
  preload: {},
  renderer: {
    define: {
      CESIUM_BASE_URL: JSON.stringify('/cesium')
    },
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [react()]
  }
})
