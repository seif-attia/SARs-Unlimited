import { useCallback, useEffect, useRef, useState } from 'react'
import * as Cesium from 'cesium'
import type { HoveredLocationInfo } from '../types/phenomenon'
import {
  resolveGeographicCursorLocation,
  type AdaptedSarPlatformData
} from '../services/phenomenonDataAdapter'

export interface UseGlobeLocationPickingOptions {
  viewerRef: React.RefObject<Cesium.Viewer | null>
  userInteractingRef: React.RefObject<boolean>
  platformData: AdaptedSarPlatformData | null
  selectedDate: string
  enabled?: boolean
}

export function useGlobeLocationPicking({
  viewerRef,
  userInteractingRef,
  platformData,
  selectedDate,
  enabled = true
}: UseGlobeLocationPickingOptions): {
  hoveredLocation: HoveredLocationInfo | null
  clearHoveredLocation: () => void
} {
  const [hoveredLocation, setHoveredLocation] = useState<HoveredLocationInfo | null>(null)
  const lastPickTimeRef = useRef<number>(0)
  const lastSignatureRef = useRef<string>('')

  const clearHoveredLocation = useCallback(() => {
    if (lastSignatureRef.current !== '') {
      lastSignatureRef.current = ''
      setHoveredLocation(null)
    }
  }, [])

  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer || viewer.isDestroyed() || !enabled) return

    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)

    handler.setInputAction((movement: Cesium.ScreenSpaceEventHandler.MotionEvent) => {
      if (userInteractingRef.current) return

      const now = performance.now()
      if (now - lastPickTimeRef.current < 120) return
      lastPickTimeRef.current = now

      if (!viewer || viewer.isDestroyed()) return
      const cartesian = viewer.camera.pickEllipsoid(
        movement.endPosition,
        viewer.scene.globe.ellipsoid
      )

      if (!cartesian) {
        if (lastSignatureRef.current !== 'OFF_GLOBE') {
          lastSignatureRef.current = 'OFF_GLOBE'
          setHoveredLocation(null)
        }
        return
      }

      const carto = Cesium.Cartographic.fromCartesian(cartesian)
      const lon = Cesium.Math.toDegrees(carto.longitude)
      const lat = Cesium.Math.toDegrees(carto.latitude)

      const resolved = resolveGeographicCursorLocation(lon, lat, platformData, selectedDate)
      const quantLat = Math.round(lat * 2) / 2
      const quantLon = Math.round(lon * 2) / 2
      const sig = `${resolved.state}:${resolved.regionId ?? ''}:${resolved.matchedEventIds.join(',')}:${quantLat},${quantLon}`

      if (sig !== lastSignatureRef.current) {
        lastSignatureRef.current = sig
        setHoveredLocation(resolved)
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)

    const onMouseLeave = (): void => {
      if (lastSignatureRef.current !== '') {
        lastSignatureRef.current = ''
        setHoveredLocation(null)
      }
    }

    const canvas = viewer.scene.canvas
    canvas.addEventListener('mouseleave', onMouseLeave)

    return () => {
      canvas.removeEventListener('mouseleave', onMouseLeave)
      if (!handler.isDestroyed()) {
        handler.destroy()
      }
    }
  }, [viewerRef, userInteractingRef, platformData, selectedDate, enabled])

  return {
    hoveredLocation,
    clearHoveredLocation
  }
}
