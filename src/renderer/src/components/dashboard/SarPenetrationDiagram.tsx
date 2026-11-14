import React from 'react'

export interface SarPenetrationDiagramProps {
  compact?: boolean
}

export const SarPenetrationDiagram: React.FC<SarPenetrationDiagramProps> = ({
  compact = false
}) => {
  return (
    <svg
      viewBox="0 0 336 96"
      className={`sar-penetration-svg ${compact ? 'is-compact' : ''}`}
      role="img"
      aria-label="C-band 5.6 cm, S-band ~10 cm, and NISAR L-band ~25 cm canopy penetration diagram"
    >
      <defs>
        <linearGradient id="sarWaterFloor" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#0284c7" stopOpacity="0.65" />
          <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.85" />
        </linearGradient>
      </defs>
      {/* Ground / floodwater layer */}
      <rect x="0" y="80" width="336" height="16" rx="3" fill="url(#sarWaterFloor)" />
      <text x="8" y="91" fill="#ecfeff" fontSize="7.5" fontWeight="700">
        SOIL / FLOODWATER (εr ≈ 80) · DOUBLE-BOUNCE CORNER
      </text>
      {/* Simplified forest trunks & crowns */}
      <rect x="57" y="46" width="6" height="34" fill="#92400e" />
      <ellipse cx="60" cy="42" rx="22" ry="14" fill="#10b981" fillOpacity="0.72" />
      <rect x="165" y="44" width="6" height="36" fill="#92400e" />
      <ellipse cx="168" cy="39" rx="24" ry="15" fill="#059669" fillOpacity="0.75" />
      <rect x="273" y="46" width="6" height="34" fill="#92400e" />
      <ellipse cx="276" cy="41" rx="21" ry="14" fill="#10b981" fillOpacity="0.7" />
      {/* C-band 5.6 cm */}
      <path
        d="M22 25 L54 36 L28 32"
        stroke="#38bdf8"
        strokeWidth="1.8"
        fill="none"
        strokeDasharray="3 2"
      />
      <text x="60" y="10" textAnchor="middle" fill="#38bdf8" fontSize="7.5" fontWeight="700">
        C-Band (5.6 cm)
      </text>
      <text x="60" y="19" textAnchor="middle" fill="#93c5fd" fontSize="6.8" fontWeight="600">
        Crown Leaves
      </text>
      {/* S-band ~10 cm */}
      <path
        d="M126 25 L162 50 L134 38"
        stroke="#c084fc"
        strokeWidth="1.8"
        fill="none"
        strokeDasharray="4 2"
      />
      <text x="168" y="10" textAnchor="middle" fill="#c084fc" fontSize="7.5" fontWeight="700">
        S-Band (~10 cm)
      </text>
      <text x="168" y="19" textAnchor="middle" fill="#d8b4fe" fontSize="6.8" fontWeight="600">
        Branches
      </text>
      {/* L-band ~25 cm */}
      <path d="M236 25 L272 79 L279 60 L246 32" stroke="#fbbf24" strokeWidth="2.1" fill="none" />
      <text x="276" y="10" textAnchor="middle" fill="#fbbf24" fontSize="7.5" fontWeight="700">
        L-Band (~25 cm)
      </text>
      <text x="276" y="19" textAnchor="middle" fill="#fde68a" fontSize="6.8" fontWeight="600">
        Trunks + Water
      </text>
    </svg>
  )
}
