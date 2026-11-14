import React from 'react'

export interface SarPenetrationDiagramProps {
  compact?: boolean
}

export const SarPenetrationDiagram: React.FC<SarPenetrationDiagramProps> = ({
  compact = false
}) => {
  return (
    <svg
      viewBox="0 0 300 84"
      className={`sar-penetration-svg ${compact ? 'is-compact' : ''}`}
      role="img"
      aria-label="C-band 5.6 cm, S-band 12 cm, and NISAR L-band 24 cm canopy penetration diagram"
    >
      <defs>
        <linearGradient id="sarWaterFloor" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#0284c7" stopOpacity="0.65" />
          <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.85" />
        </linearGradient>
      </defs>
      {/* Ground / floodwater layer */}
      <rect x="0" y="68" width="300" height="16" rx="3" fill="url(#sarWaterFloor)" />
      <text x="8" y="79" fill="#ecfeff" fontSize="7.5" fontWeight="700">
        SOIL / FLOODWATER (εr ≈ 80) · DOUBLE-BOUNCE CORNER
      </text>
      {/* Simplified forest trunks & crowns */}
      <rect x="74" y="34" width="6" height="34" fill="#92400e" />
      <ellipse cx="77" cy="30" rx="22" ry="14" fill="#10b981" fillOpacity="0.72" />
      <rect x="166" y="32" width="6" height="36" fill="#92400e" />
      <ellipse cx="169" cy="27" rx="24" ry="15" fill="#059669" fillOpacity="0.75" />
      <rect x="250" y="34" width="6" height="34" fill="#92400e" />
      <ellipse cx="253" cy="29" rx="21" ry="14" fill="#10b981" fillOpacity="0.7" />
      {/* C-band 5.6 cm */}
      <path
        d="M28 8 L72 22 L38 16"
        stroke="#38bdf8"
        strokeWidth="1.8"
        fill="none"
        strokeDasharray="3 2"
      />
      <text x="14" y="13" fill="#38bdf8" fontSize="8" fontWeight="700">
        C-Band (5.6 cm): Crown Leaves
      </text>
      {/* S-band 12 cm */}
      <path
        d="M118 8 L164 38 L128 24"
        stroke="#c084fc"
        strokeWidth="1.8"
        fill="none"
        strokeDasharray="4 2"
      />
      <text x="116" y="13" fill="#c084fc" fontSize="8" fontWeight="700">
        S-Band (12 cm): Branches
      </text>
      {/* L-band 24 cm */}
      <path d="M214 8 L249 67 L256 48 L224 16" stroke="#fbbf24" strokeWidth="2.1" fill="none" />
      <text x="206" y="13" fill="#fbbf24" fontSize="8" fontWeight="700">
        L-Band (24 cm): Trunks+Water
      </text>
    </svg>
  )
}
