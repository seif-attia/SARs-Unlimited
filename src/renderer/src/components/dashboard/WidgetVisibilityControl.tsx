import React, { useEffect, useRef, useState } from 'react'
import { ChevronDown, Eye } from 'lucide-react'
import type { WidgetVisibilityState } from '../../types/phenomenon'

export interface WidgetVisibilityControlProps {
  widgetVisibility: WidgetVisibilityState
  onToggleWidget: (widget: keyof WidgetVisibilityState) => void
}

const SHOW_TAB_ITEMS: Array<{ key: keyof WidgetVisibilityState; label: string }> = [
  { key: 'statistics', label: 'Statistics' },
  { key: 'eventSummary', label: 'Summary' },
  { key: 'timeline', label: 'Timeline' },
  { key: 'scientificExplanation', label: 'Explanation' }
]

export const WidgetVisibilityControl: React.FC<WidgetVisibilityControlProps> = ({
  widgetVisibility,
  onToggleWidget
}) => {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    const handleOutside = (e: MouseEvent): void => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    window.addEventListener('mousedown', handleOutside)
    return () => window.removeEventListener('mousedown', handleOutside)
  }, [open])

  return (
    <div className="sars-settings-wrapper" ref={ref}>
      <button
        type="button"
        className={`sars-nav-pill ${open ? 'is-open' : ''}`}
        onClick={() => setOpen((p) => !p)}
        title="Show or hide dashboard tabs"
      >
        <Eye size={13} className="sars-nav-pill__icon" />
        <span>Show</span>
        <ChevronDown size={13} className={`sars-nav-pill__caret ${open ? 'is-open' : ''}`} />
      </button>

      {open && (
        <div
          className="sars-dropdown-popover sars-show-popover"
          role="dialog"
          aria-label="Show Tabs"
        >
          {SHOW_TAB_ITEMS.map((item) => (
            <label key={item.key} className="sars-toggle-row">
              <span>{item.label}</span>
              <input
                type="checkbox"
                checked={widgetVisibility[item.key]}
                onChange={() => onToggleWidget(item.key)}
              />
            </label>
          ))}
        </div>
      )}
    </div>
  )
}
