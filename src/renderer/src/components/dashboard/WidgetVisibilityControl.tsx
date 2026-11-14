import React from 'react'
import { BarChart3, BookOpen, CalendarClock, ListFilter } from 'lucide-react'
import type { WidgetVisibilityState } from '../../types/phenomenon'

export interface WidgetVisibilityControlProps {
  widgetVisibility: WidgetVisibilityState
  onToggleWidget: (widget: keyof WidgetVisibilityState) => void
}

export const WidgetVisibilityControl: React.FC<WidgetVisibilityControlProps> = ({
  widgetVisibility,
  onToggleWidget
}) => {
  const hiddenWidgets: Array<{
    key: keyof WidgetVisibilityState
    label: string
    icon: React.ReactNode
  }> = []

  if (!widgetVisibility.statistics) {
    hiddenWidgets.push({
      key: 'statistics',
      label: 'Show Statistics',
      icon: <BarChart3 size={12} />
    })
  }
  if (!widgetVisibility.timeline) {
    hiddenWidgets.push({
      key: 'timeline',
      label: 'Show Timeline',
      icon: <CalendarClock size={12} />
    })
  }
  if (!widgetVisibility.eventSummary) {
    hiddenWidgets.push({
      key: 'eventSummary',
      label: 'Show Summary',
      icon: <ListFilter size={12} />
    })
  }
  if (!widgetVisibility.scientificExplanation) {
    hiddenWidgets.push({
      key: 'scientificExplanation',
      label: 'Show Explanation',
      icon: <BookOpen size={12} />
    })
  }

  if (hiddenWidgets.length === 0) return null

  return (
    <div className="sars-restore-pills" role="region" aria-label="Restore hidden widgets">
      {hiddenWidgets.map((item) => (
        <button
          key={item.key}
          type="button"
          className="sars-restore-pill"
          onClick={() => onToggleWidget(item.key)}
          title={`Restore ${item.label} panel`}
        >
          {item.icon}
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  )
}
