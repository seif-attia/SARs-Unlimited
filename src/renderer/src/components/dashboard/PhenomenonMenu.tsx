import React, { useEffect, useRef, useState } from 'react'
import { ChevronDown, Globe2, Layers, Trees } from 'lucide-react'
import type { PhenomenonDefinition } from '../../types/phenomenon'

export interface PhenomenonMenuProps {
  globalPhenomena: PhenomenonDefinition[]
  amazonPhenomena: PhenomenonDefinition[]
  selectedPhenomenon: PhenomenonDefinition
  onSelectPhenomenon: (id: string) => void
  onSelectAmazonRegion?: (regionId: string | null) => void
  lockedRegionId?: string | null
  studyRegionOptions?: Array<{ id: string; name: string }>
}

export const PhenomenonMenu: React.FC<PhenomenonMenuProps> = ({
  globalPhenomena,
  amazonPhenomena,
  selectedPhenomenon,
  onSelectPhenomenon,
  onSelectAmazonRegion,
  lockedRegionId,
  studyRegionOptions = []
}) => {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    const handleOutside = (e: MouseEvent): void => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    window.addEventListener('mousedown', handleOutside)
    return () => window.removeEventListener('mousedown', handleOutside)
  }, [open])

  const quickSlots: Array<{ id: string; label: string }> = [
    { id: 'global-pheno-1', label: 'Deformation' },
    { id: 'global-pheno-2', label: 'Flooding' },
    { id: 'global-pheno-4', label: 'Wildfires' },
    { id: 'global-pheno-5', label: 'Marine' },
    { id: 'global-pheno-3', label: 'Ice' },
    { id: 'amazon-pheno-2', label: 'Amazon' }
  ]

  return (
    <div className="sars-pheno-nav-group" ref={containerRef}>
      {/* Main Phenomenon Dropdown Button */}
      <button
        type="button"
        className={`sars-nav-pill sars-nav-pill--primary ${open ? 'is-open' : ''}`}
        onClick={() => setOpen((prev) => !prev)}
        title="Open Phenomenon Catalog (6 Global + 8 Amazon Phenomena)"
      >
        <Layers size={13} className="sars-nav-pill__icon" />
        <span className="sars-nav-pill__tag">Phenomenon</span>
        <span className="sars-nav-pill__active-name">
          {selectedPhenomenon.displayName}
        </span>
        <ChevronDown size={13} className={`sars-nav-pill__caret ${open ? 'is-open' : ''}`} />
      </button>

      {/* Quick Category Pills matching screenshot */}
      <div className="sars-quick-pheno-pills" role="tablist" aria-label="Quick phenomenon categories">
        {quickSlots.map((slot) => {
          const isActive =
            selectedPhenomenon.id === slot.id ||
            (slot.id === 'amazon-pheno-2' && selectedPhenomenon.geographicScope === 'amazon')
          return (
            <button
              key={slot.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`sars-quick-pill ${isActive ? 'is-active' : ''}`}
              onClick={() => onSelectPhenomenon(slot.id)}
            >
              <span>{slot.label}</span>
              <span className="sars-quick-pill__caret">▾</span>
            </button>
          )
        })}
      </div>

      {/* Full Phenomenon Catalog Popover */}
      {open && (
        <div className="sars-dropdown-popover sars-pheno-popover" role="menu">
          <div className="sars-pheno-popover__columns">
            {/* Column 1: Global Phenomena (6 Slots) */}
            <div className="sars-pheno-popover__col">
              <div className="sars-pheno-popover__header">
                <Globe2 size={13} />
                <span>GLOBAL PHENOMENA (6 CATEGORIES)</span>
              </div>
              <div className="sars-pheno-popover__list">
                {globalPhenomena.map((item) => {
                  const active = item.id === selectedPhenomenon.id
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={`sars-pheno-item ${active ? 'is-active' : ''}`}
                      onClick={() => {
                        onSelectPhenomenon(item.id)
                        setOpen(false)
                      }}
                    >
                      <div className="sars-pheno-item__top">
                        <span
                          className="sars-pheno-item__dot"
                          style={{ backgroundColor: item.accentColor }}
                        />
                        <span className="sars-pheno-item__code">{item.code}</span>
                        <span className="sars-pheno-item__title">{item.displayName}</span>
                        <span className="sars-pheno-item__count">{item.eventIds.length} ev</span>
                      </div>
                      <div className="sars-pheno-item__sub">
                        {item.defaultSensorBadge} · {item.shortLabel}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Column 2: Amazon Region Phenomena (8 Slots) */}
            <div className="sars-pheno-popover__col">
              <div className="sars-pheno-popover__header">
                <Trees size={13} />
                <span>AMAZON REGION PHENOMENA (8 CATEGORIES)</span>
              </div>
              <div className="sars-pheno-popover__list">
                {amazonPhenomena.map((item) => {
                  const active = item.id === selectedPhenomenon.id
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={`sars-pheno-item ${active ? 'is-active' : ''}`}
                      onClick={() => {
                        onSelectPhenomenon(item.id)
                        setOpen(false)
                      }}
                    >
                      <div className="sars-pheno-item__top">
                        <span
                          className="sars-pheno-item__dot"
                          style={{ backgroundColor: item.accentColor }}
                        />
                        <span className="sars-pheno-item__code">{item.code}</span>
                        <span className="sars-pheno-item__title">{item.displayName}</span>
                        <span className="sars-pheno-item__count">{item.eventIds.length} ev</span>
                      </div>
                      <div className="sars-pheno-item__sub">
                        {item.defaultSensorBadge} · {item.shortLabel}
                      </div>
                    </button>
                  )
                })}
              </div>

              {onSelectAmazonRegion && studyRegionOptions.length > 0 && (
                <div className="sars-pheno-popover__subfilter">
                  <label className="sars-pheno-popover__sublabel">
                    Amazon Basin Sub-Region Focus:
                  </label>
                  <select
                    className="sars-select-input"
                    value={lockedRegionId ?? ''}
                    onChange={(e) => onSelectAmazonRegion(e.target.value || null)}
                  >
                    <option value="">All Study Sub-Regions (Auto Cursor)</option>
                    {studyRegionOptions.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
