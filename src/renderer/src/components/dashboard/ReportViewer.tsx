import React from 'react'
import type { EventRecord } from '../../types/phenomenon'
import { MediaViewer } from './MediaViewer'

export interface ReportViewerProps {
  event: EventRecord | null
  onClose: () => void
  onSelectLayerOnGlobe: (layerId: string) => void
}

export const ReportViewer: React.FC<ReportViewerProps> = ({
  event,
  onClose,
  onSelectLayerOnGlobe
}) => {
  return (
    <MediaViewer
      event={event}
      onClose={onClose}
      initialTab="overview"
      onSelectLayerOnGlobe={onSelectLayerOnGlobe}
    />
  )
}
