import type { PhenomenonDefinition } from '../types/phenomenon'

/**
 * Configurable catalog of the 6 Global Phenomenon slots and 8 Amazon Region Phenomenon slots.
 * Team members can update codes, display names, or dataset mappings in this single configuration file
 * without modifying any UI components.
 */
export const GLOBAL_PHENOMENON_SLOTS: PhenomenonDefinition[] = [
  {
    id: 'global-pheno-1',
    code: 'Pheno 1',
    shortLabel: 'Deformation',
    displayName: 'Pheno 1 · Surface Deformation & Fault Slip',
    scientificTitle: 'SURFACE DEFORMATION & INSAR FAULT RUPTURE',
    description:
      'Centimeter-to-meter crustal fault displacement, volcanic magma dike inflation, and urban structural damage mapped through clouds via Sentinel-1 & NISAR radar interferometry (InSAR) and amplitude coherence.',
    geographicScope: 'global',
    associatedRegions: ['global_tur_kahramanmaras', 'global_esp_lapalma'],
    startDate: '2015-01',
    endDate: '2026-12',
    availableDatasets: ['pc_s1_rtc', 'nisar_gcov_v1'],
    eventIds: ['turkiye_insar_2023', 'lapalma_volcano_2021'],
    sourcePhenomenonIds: [],
    accentColor: '#38BDF8',
    defaultSensorBadge: 'SENTINEL-1 · C/L-BAND INSAR',
    defaultBbox: [36.7, 37.25, 37.3, 37.75],
    defaultCenter: [37.0, 37.5],
    layers: [],
    scientificExplanation: {
      whatHappened: {
        description:
          'Two or more radar passes over the same fault zone or volcanic edifice are compared before and after crustal slip or magma intrusion. Even millimeter-to-meter ground shifts alter the radar phase and urban corner-reflector amplitude.',
        when: '2015–2026 archive (Anchor events: Oct 2021 La Palma Eruption · Feb 2023 Türkiye–Syria Mw 7.8 & 7.5 Earthquakes)',
        where: 'East Anatolian Fault Zone (Kahramanmaraş, Türkiye) & Cumbre Vieja Rift (La Palma, Canary Islands)',
        observations:
          '4.2 m coseismic left-lateral fault rupture with 28.44% urban |ΔVV| ≥ 2.2 dB amplitude disruption in Türkiye; +2.18% rough aa-basalt lava advance (+ΔVH ≥ +1.25 dB) in La Palma.'
      },
      whySarDetectsIt: {
        primaryMechanism: 'Interferometric Phase (InSAR Range Displacement) & Dihedral Corner-Reflector Coherence',
        roughnessAndBackscatter:
          'Intact urban city blocks act as strong dihedral wall–ground corner reflectors. Building collapse scrambles phase coherence and shifts |ΔVV|, while cooling jagged aa-lava increases centimeter-scale surface roughness (+ΔVH).',
        dielectricAndMoisture:
          'Dry masonry rubble and cooled basalt maintain relatively stable low dielectric permittivity (εr ≈ 4–6), isolating geometric range change and surface texture as the primary radar signal.',
        polarizationAndWavelength:
          'Each full rainbow InSAR phase cycle represents half a radar wavelength of line-of-sight ground motion (~2.8 cm in C-band, ~12.5 cm in L-band). Longer ~25 cm L-band preserves fringe coherence near high-strain fault cores.'
      },
      environmentalAndHumanImpact: {
        environmentalImpact:
          'Permanent surface fault scarps up to 4.2 m offset, volcanic tephra ash blanketing across 14.3% of surrounding terrain, and coastal lava delta expansion.',
        humanAndInfrastructureImpact:
          'Widespread collapse of multi-story unreinforced masonry across fault basins in Türkiye & Syria, and burial of plantations and roads in Los Llanos / Todoque.',
        naturalDriver:
          'Tectonic strike-slip rupture along the East Anatolian Fault Zone and mantle magma dike injection beneath Cumbre Vieja.',
        humanDriver:
          'High density of soft-story and unreinforced urban structures concentrated along alluvial fault basins.',
        geographicExtent: 'Regional fault corridors (>300 km rupture length) and volcanic island rift zones.',
        overlayReadingGuide:
          'Each concentric rainbow phase fringe cycle equals 0.28 m of ground displacement toward or away from the satellite; bright magenta/orange highlights severe urban |ΔVV| or rough lava ΔVH change.'
      },
      dataUsedAndMethodology: {
        satelliteMission: 'ESA Copernicus Sentinel-1A & NASA-ISRO NISAR Mode',
        sensorAndBand: 'C-Band SAR (5.6 cm) IW GRDH / InSAR & L-Band (~25 cm)',
        acquisitionDates: '2021-11-01 (La Palma) · 2023-02-09 (Türkiye–Syria, 3 days post-quake)',
        processingMethodology:
          'Differential Interferometric SAR (DInSAR) phase wrapping paired with Radiometrically Terrain-Corrected (RTC) log-amplitude change (|ΔVV|, ΔVH).',
        dataResolution: '10 m – 30 m ground range resolution',
        observationPeriod: 'Jan 2015 – Dec 2026 (144-month planetary & crisis archive)',
        dataSource: 'ESA Copernicus / Microsoft Planetary Computer & ASF DAAC',
        processingModel: 'Sentinel-1 RTC Gamma0 + Wrapped Co-Seismic Phase Model'
      }
    },
    status: 'AVAILABLE'
  },
  {
    id: 'global-pheno-2',
    code: 'Pheno 2',
    shortLabel: 'Flooding',
    displayName: 'Pheno 2 · Extreme Monsoon & Urban Flooding',
    scientificTitle: 'ALL-WEATHER FLOOD INUNDATION & URBAN DOUBLE-BOUNCE',
    description:
      'Continental monsoon inland-sea inundation and catastrophic urban basin flooding mapped directly through unbroken storm clouds using specular water reflection (-ΔVV) and building–water double-bounce (+ΔVV).',
    geographicScope: 'global',
    associatedRegions: ['global_pak_indus', 'global_bra_rs'],
    startDate: '2015-01',
    endDate: '2026-12',
    availableDatasets: ['pc_s1_rtc', 'opera_dswx_s1'],
    eventIds: ['pakistan_flood_2022', 'brazil_rs_flood_2024'],
    sourcePhenomenonIds: [],
    accentColor: '#00E5FF',
    defaultSensorBadge: 'SENTINEL-1 · C-BAND VV / ΔVV',
    defaultBbox: [67.55, 26.25, 68.35, 26.95],
    defaultCenter: [67.95, 26.6],
    layers: [],
    scientificExplanation: {
      whatHappened: {
        description:
          'Extreme atmospheric rivers and stalled monsoon systems submerged vast alluvial plains and metropolitan river deltas beneath cloud decks that completely blinded optical satellites.',
        when: 'Aug 2022 (Pakistan Indus Basin Flood) · May 2024 (Porto Alegre & Rio Grande do Sul Flood)',
        where: 'Sindh / Lake Manchar Corridor (Pakistan) & Guaíba Delta / Porto Alegre (Southern Brazil)',
        observations:
          '+14.0% newly inundated cropland and towns in Pakistan (VV ≤ -15 dB); +14.3% submerged delta plains paired with +8.18% urban building double-bounce in Porto Alegre.'
      },
      whySarDetectsIt: {
        primaryMechanism: 'Specular Mirror Reflection over Open Water vs. Dihedral Urban/Trunk Double-Bounce',
        roughnessAndBackscatter:
          'Calm open floodwater acts like a smooth mirror that reflects oblique radar pulses away from the satellite antenna (turning inundated fields jet-black, VV ≤ -16 dB). Conversely, flooded vertical walls and tree trunks create 90° corner reflectors (+3 to +6 dB brightening).',
        dielectricAndMoisture:
          'Liquid water has an extremely high relative dielectric constant (εr ≈ 80 vs. εr ≈ 4 for dry soil), creating high microwave reflectivity at the water surface.',
        polarizationAndWavelength:
          'Co-polarized VV maximizes both the open-water specular drop over farmlands and vertical wall–water dihedral bounce inside flooded cities.'
      },
      environmentalAndHumanImpact: {
        environmentalImpact:
          'Formation of a 100 km-wide inland flood sea in the Indus Basin and extensive sediment/nutrient scouring across the Guaíba lagoon delta.',
        humanAndInfrastructureImpact:
          'Overburdened flood levees (RBOD and Porto Alegre pump stations), submerged international airports, displaced populations, and multi-billion-dollar crop losses.',
        naturalDriver:
          '2022 La Niña triple-dip monsoon stalling over Sindh and 2024 Amazonian "flying river" moisture blocked by a subtropical heat dome.',
        humanDriver:
          'Floodplain settlement encroachment, impervious urban expansion, and levee breaches.',
        geographicExtent: 'Indus alluvial plain (Sindh, Pakistan) and Guaíba watershed (Rio Grande do Sul, Brazil).',
        overlayReadingGuide:
          'Cyan (#00E5FF) marks newly submerged open floodwater (ΔVV ≤ -2.5 dB); pink/magenta (#F472B6) marks flooded urban blocks with strong double-bounce (+ΔVV ≥ +2.2 dB).'
      },
      dataUsedAndMethodology: {
        satelliteMission: 'ESA Copernicus Sentinel-1A',
        sensorAndBand: 'C-Band SAR (5.6 cm) VV & ΔVV',
        acquisitionDates: '2022-08-30 (Pakistan Indus Peak) · 2024-05-11 (Porto Alegre Peak)',
        processingMethodology:
          'Pre-flood baseline vs. peak-flood RTC log-ratio differencing (ΔVV) and bimodal histogram thresholding.',
        dataResolution: '10 m – 20 m SAR Ground Range Detected (GRDH)',
        observationPeriod: '2015–2026',
        dataSource: 'ESA Copernicus / Microsoft Planetary Computer',
        processingModel: 'Dual Specular-Inundation & Urban Dihedral Classifier'
      }
    },
    status: 'AVAILABLE'
  },
  {
    id: 'global-pheno-3',
    code: 'Pheno 3',
    shortLabel: 'Ice & Cryosphere',
    displayName: 'Pheno 3 · Polar Ice Calving & Sea-Ice Deficit',
    scientificTitle: 'POLAR NIGHT ICE-SHELF CALVING & SEA-ICE ANOMALIES',
    description:
      'Giant tabular iceberg calving fractures and historic winter sea-ice refreeze deficits monitored continuously through 24-hour polar darkness and Southern Ocean storms.',
    geographicScope: 'global',
    associatedRegions: ['global_ant_larsen', 'global_ant_weddell'],
    startDate: '2015-01',
    endDate: '2026-12',
    availableDatasets: ['pc_s1_rtc', 'amsru2_ice'],
    eventIds: ['larsen_c_a68_2017', 'antarctic_sea_ice_2023'],
    sourcePhenomenonIds: [],
    accentColor: '#7DD3FC',
    defaultSensorBadge: 'SENTINEL-1 HH · JAXA AMSR2',
    defaultBbox: [-61.8, -68.4, -59.6, -67.0],
    defaultCenter: [-60.7, -67.7],
    layers: [],
    scientificExplanation: {
      whatHappened: {
        description:
          'During perpetual Austral winter darkness, Iceberg A-68 (~5,800 km², 1 trillion tonnes) detached from the Larsen C Ice Shelf in July 2017, followed in September 2023 by a 6σ record deficit in Antarctic winter pack ice.',
        when: 'Jul 2017 (Larsen C A-68 Calving) · Sep 2023 (Antarctic Winter Sea-Ice Record Minimum)',
        where: 'Larsen C Ice Shelf (Antarctic Peninsula) & Haakon VII / Weddell Marginal Ice Belt',
        observations:
          '13.94% dark open seawater lead opened as A-68 detached (~200 km fracture); -15.15% missing winter pack ice in Sep 2023 compared to Sep 2020 baseline.'
      },
      whySarDetectsIt: {
        primaryMechanism: 'Glacial Firn Volume Scattering vs. Saline Seawater Dielectric Contrast',
        roughnessAndBackscatter:
          'Thick continental ice-shelf firn and deformed pack-ice ridges scatter microwave energy brightly (-5 to 0 dB), whereas calm open leads between detached icebergs reflect specularly away (<-17 dB).',
        dielectricAndMoisture:
          'Dry cold glacial firn (εr ≈ 2.1) and brine-expelled sea ice (εr ≈ 3.5) contrast sharply against high-dielectric liquid polar seawater (εr ≈ 80).',
        polarizationAndWavelength:
          'HH co-polarization maximizes contrast between consolidated ice-shelf walls and wind-roughened ocean leads during polar night.'
      },
      environmentalAndHumanImpact: {
        environmentalImpact:
          'Structural weakening of Antarctic Peninsula ice-shelf buttressing and loss of >1.6 million km² of winter sea-ice albedo protection across the Southern Ocean.',
        humanAndInfrastructureImpact:
          'Major navigation hazards from giant tabular icebergs drifting through Southern Ocean shipping and krill fishery corridors.',
        naturalDriver:
          'Multi-decadal rift propagation across Larsen C suture zones and subsurface Circumpolar Deep Water upwelling.',
        humanDriver:
          'Anthropogenic Southern Ocean heat uptake and atmospheric warming over the Antarctic Peninsula.',
        geographicExtent: 'Weddell Sea, Larsen C Ice Shelf, and Haakon VII Sea (60°S–70°S).',
        overlayReadingGuide:
          'Ice-blue (#38BDF8 / #E0F2FE) indicates fractured ice shelf fronts and retained pack ice; rose-red (#F43F5E) marks missing winter sea ice relative to the 2020 maximum.'
      },
      dataUsedAndMethodology: {
        satelliteMission: 'ESA Sentinel-1B & JAXA GCOM-W1 (AMSR2)',
        sensorAndBand: 'C-Band SAR HH (5.6 cm) & Passive Microwave (18–89 GHz)',
        acquisitionDates: '2017-07-15 (Larsen C Calving) · 2023-09-15 vs. 2020-09-15 (Weddell Sea Ice)',
        processingMethodology:
          'Polar-night HH backscatter differencing (ΔHH) and AMSR2 12 km Sea Ice Concentration anomaly mapping.',
        dataResolution: '20 m (Sentinel-1 EW/IW) · 12 km (AMSR2 Cryosphere Grid)',
        observationPeriod: '2015–2026 (144-month polar cryosphere record)',
        dataSource: 'ESA Copernicus / NASA GIBS / JAXA',
        processingModel: 'RTC HH Rift Detector & AMSR2 Sea-Ice Anomaly Pipeline'
      }
    },
    status: 'AVAILABLE'
  },
  {
    id: 'global-pheno-4',
    code: 'Pheno 4',
    shortLabel: 'Wildfires',
    displayName: 'Pheno 4 · Global Megafires & Permafrost Burn Scars',
    scientificTitle: 'SMOKE-PENETRATING WILDFIRE SCARS & BOREAL THAW',
    description:
      'All-weather cross-polarized radar mapping of stand-replacing wildfire canopy loss beneath continental pyrocumulonimbus smoke plumes in temperate eucalyptus and boreal permafrost forests.',
    geographicScope: 'global',
    associatedRegions: ['global_aus_nsw', 'global_can_quebec'],
    startDate: '2015-01',
    endDate: '2026-12',
    availableDatasets: ['pc_s1_rtc', 'firms_modis', 'smap_ft'],
    eventIds: ['aus_fires_2020', 'canada_boreal_2023'],
    sourcePhenomenonIds: [],
    accentColor: '#F97316',
    defaultSensorBadge: 'SENTINEL-1 · C-BAND VH / ΔVH',
    defaultBbox: [149.7, -36.5, 150.3, -35.9],
    defaultCenter: [150.0, -36.2],
    layers: [],
    scientificExplanation: {
      whatHappened: {
        description:
          'Record-breaking firestorms in southeastern Australia (Jan 2020 Black Summer) and northern Quebec (Jul 2023 Boreal Megafires) incinerated forest canopies beneath dense smoke blankets that obscured optical satellites for weeks.',
        when: 'Jan 2020 (Australia Black Summer) · Jul 2023 (Canada Boreal Taiga Megafires)',
        where: 'Clyde Mountain / Batemans Bay (NSW, Australia) & James Bay / Northern Quebec (Canada)',
        observations:
          '8.1% severe crown scorch + 8.0% canopy thinning in NSW; 3.67% severe black-spruce crown loss (ΔVH ≤ -3.2 dB) + 15.37% moderate burn thinning in Quebec.'
      },
      whySarDetectsIt: {
        primaryMechanism: 'Cross-Polarized Volume Scattering Loss (ΔVH) Through Opaque Smoke Plumes',
        roughnessAndBackscatter:
          'Unburned forest canopies contain dense 3D twigs, needles, and leaves that depolarize radar waves (strong VH volume scattering). Crown fire consumes this fine canopy volume, causing an immediate -1.5 to -4.0 dB drop in VH.',
        dielectricAndMoisture:
          'Intense fire pyrolysis desiccates foliage and surface moss (dropping εr), while in boreal peatlands removal of the insulating moss mat accelerates active-layer permafrost thaw.',
        polarizationAndWavelength:
          '5.6 cm C-band wavelengths are unaffected by smoke aerosols (which are ~1 μm in size) and respond directly to centimeter-scale branch/leaf incineration.'
      },
      environmentalAndHumanImpact: {
        environmentalImpact:
          'Over 15 million hectares burned nationally in Canada (2023) and massive biodiversity loss across NSW eucalyptus habitats, plus accelerated boreal permafrost carbon release.',
        humanAndInfrastructureImpact:
          'Transcontinental smoke air-quality emergencies across North America and Australia, highway closures, and community evacuations.',
        naturalDriver:
          'Record positive Indian Ocean Dipole (2019–20) in Australia and persistent Omega block high-pressure heat domes + early snowmelt in Quebec (2023).',
        humanDriver:
          'Anthropogenic climate warming and Arctic amplification (>2x global average) extending extreme fire-weather windows.',
        geographicExtent: 'Southeastern Australia eucalyptus belt and Canadian Shield boreal taiga.',
        overlayReadingGuide:
          'Crimson/rose (#F43F5E) indicates severe stand-replacing crown burn (ΔVH drop); orange (#FF9100 / #FB923C) marks moderate canopy scorch and understory thinning.'
      },
      dataUsedAndMethodology: {
        satelliteMission: 'ESA Copernicus Sentinel-1A',
        sensorAndBand: 'C-Band SAR (5.6 cm) Cross-Polarized VH & ΔVH',
        acquisitionDates: '2020-01-05 (NSW Black Summer) · 2023-07-16 (Quebec Boreal Megafire)',
        processingMethodology:
          'Pre-fire vs. post-fire cross-polarized RTC backscatter differencing (ΔVH = VH_post - VH_pre).',
        dataResolution: '20 m Radiometrically Terrain-Corrected (RTC)',
        observationPeriod: '2015–2026',
        dataSource: 'ESA Copernicus / Microsoft Planetary Computer',
        processingModel: 'All-Weather ΔVH Canopy Depolarization Loss Model'
      }
    },
    status: 'AVAILABLE'
  },
  {
    id: 'global-pheno-5',
    code: 'Pheno 5',
    shortLabel: 'Oil Slick',
    displayName: 'Pheno 5 · Marine Oil Slick & Wave Damping',
    scientificTitle: 'MARINE OIL SLICK BRAGG CAPILLARY-WAVE DAMPING',
    description:
      'Detection of marine oil spills and viscous surface slicks across coastal reef lagoons by measuring the suppression of centimeter-scale Bragg capillary ocean waves in C-band co-polarized radar.',
    geographicScope: 'global',
    associatedRegions: ['global_mus_spill'],
    startDate: '2015-01',
    endDate: '2026-12',
    availableDatasets: ['pc_s1_rtc'],
    eventIds: ['mauritius_spill_2020'],
    sourcePhenomenonIds: [],
    accentColor: '#A855F7',
    defaultSensorBadge: 'SENTINEL-1B · C-BAND VV / ΔVV',
    defaultBbox: [57.62, -20.48, 57.82, -20.3],
    defaultCenter: [57.72, -20.39],
    layers: [],
    scientificExplanation: {
      whatHappened: {
        description:
          'Following the grounding of bulk carrier MV Wakashio on the Pointe d’Esny coral reef in August 2020, over 1,000 tonnes of low-sulfur fuel oil leaked into Mauritius’s turquoise lagoon and mangrove reserves.',
        when: 'Aug 2020 (Sentinel-1B pass on 2020-08-10)',
        where: 'Pointe d’Esny & Mahebourg Lagoon, Southeastern Mauritius (Indian Ocean)',
        observations:
          '5.08% heavy viscous fuel oil slick (VV ≤ -17 dB) surrounded by 9.83% Bragg-damped thin sheen mapped day and night.'
      },
      whySarDetectsIt: {
        primaryMechanism: 'Viscoelastic Damping of Bragg-Resonant Capillary Ocean Waves',
        roughnessAndBackscatter:
          'Under moderate trade winds (3–10 m/s), clean ocean surfaces are covered with 5–10 cm gravity-capillary ripples that produce bright Bragg resonant backscatter in C-band. Viscous floating oil damps out these ripples, turning the slick into a pitch-black specular mirror.',
        dielectricAndMoisture:
          'While petroleum has a much lower dielectric constant than seawater, the dominant radar contrast (>6–10 dB drop) comes from the mechanical smoothing of millimeter-to-centimeter surface waves.',
        polarizationAndWavelength:
          'VV co-polarization provides the highest Bragg sea-clutter-to-slick contrast because 5.6 cm C-band directly matches capillary wave wavelengths.'
      },
      environmentalAndHumanImpact: {
        environmentalImpact:
          'Contamination of Ramsar-protected wetlands, coral reefs, seagrass lagoons, and Ile aux Aigrettes coastal ecosystems.',
        humanAndInfrastructureImpact:
          'Disruption of artisanal fisheries, coastal tourism, and massive community containment operations.',
        naturalDriver:
          'Southeast trade-wind swells accelerated hull fracture on the outer barrier reef and pushed the plume northwestward.',
        humanDriver:
          'Maritime shipping corridor proximity and vessel grounding of MV Wakashio.',
        geographicExtent: 'Southeastern Mauritius barrier reef and coastal lagoon (~20 km plume corridor).',
        overlayReadingGuide:
          'Deep violet (#A855F7) highlights thick viscous oil slicks (VV ≤ -17 dB); lavender (#C084FC) marks wider Bragg-damped surface sheen (-ΔVV).'
      },
      dataUsedAndMethodology: {
        satelliteMission: 'ESA Copernicus Sentinel-1B',
        sensorAndBand: 'C-Band SAR (5.6 cm) VV & ΔVV',
        acquisitionDates: '2020-08-10 vs. 2020-07-05 clean ocean baseline',
        processingMethodology:
          'Co-polarized VV Bragg-clutter ratioing and dark-spot morphological slick segmentation.',
        dataResolution: '10 m Sentinel-1 IW GRDH RTC',
        observationPeriod: '2015–2026',
        dataSource: 'ESA Copernicus / Microsoft Planetary Computer',
        processingModel: 'Bragg Capillary-Wave Damping Oil Slick Detector'
      }
    },
    status: 'AVAILABLE'
  },
  {
    id: 'global-pheno-6',
    code: 'Pheno 6',
    shortLabel: 'Planetary Atlas',
    displayName: 'Pheno 6 · Planetary Hydro-Cryosphere & Freeze/Thaw',
    scientificTitle: 'GLOBAL 144-MONTH SMAP SOIL MOISTURE, FREEZE/THAW & SEA-ICE ATLAS',
    description:
      'Whole-planet 12-year (2015–2026) monthly progression integrating NASA SMAP L-band soil moisture, boreal permafrost freeze/thaw state, JAXA AMSR2 polar sea ice, and all 9 global SAR crisis benchmarks.',
    geographicScope: 'global',
    associatedRegions: [
      'global_tur_kahramanmaras',
      'global_pak_indus',
      'global_bra_rs',
      'global_ant_larsen',
      'global_ant_weddell',
      'global_aus_nsw',
      'global_can_quebec',
      'global_mus_spill',
      'global_esp_lapalma'
    ],
    startDate: '2015-01',
    endDate: '2026-12',
    availableDatasets: ['smap_l4', 'smap_ft', 'amsru2_ice', 'pc_s1_rtc'],
    eventIds: [
      'larsen_c_a68_2017',
      'aus_fires_2020',
      'mauritius_spill_2020',
      'lapalma_volcano_2021',
      'pakistan_flood_2022',
      'turkiye_insar_2023',
      'canada_boreal_2023',
      'antarctic_sea_ice_2023',
      'brazil_rs_flood_2024'
    ],
    sourcePhenomenonIds: [],
    accentColor: '#6366F1',
    defaultSensorBadge: 'NASA SMAP L-BAND · AMSR2 · SENTINEL-1',
    defaultBbox: [-180, -90, 180, 90],
    defaultCenter: [20.0, 15.0],
    layers: [],
    scientificExplanation: {
      whatHappened: {
        description:
          'Across 144 consecutive months (Jan 2015 – Dec 2026), Earth’s continental surfaces breathe between boreal winter freeze (up to 42.1% global frozen land in Jan 2024) and summer thaw (6.2% in Aug 2018), alongside equatorial monsoon pulses and ENSO extremes.',
        when: 'Jan 2015 – Dec 2026 (144 monthly planetary frames)',
        where: 'Global Earth (Equatorial wetland belt, Boreal permafrost zones, and Bipolar sea-ice caps)',
        observations:
          'Global frozen land oscillates nearly 7× annually (6.2%–42.1%); polar sea-ice index ranges up to 100% at winter peak; 9 major global SAR disasters captured at 10–20 m resolution.'
      },
      whySarDetectsIt: {
        primaryMechanism: 'Planetary Dielectric State Transitions (Frozen Ice εr ≈ 3.2 ↔ Liquid Water εr ≈ 80)',
        roughnessAndBackscatter:
          'Active C/L-band SAR resolves fine geometric surface fractures, flood mirrors, and burn scars, while global L-band microwave radiometry tracks continental soil permittivity and freeze/thaw boundaries.',
        dielectricAndMoisture:
          'When boreal soil water freezes in autumn, its dielectric constant drops precipitously from ~80 to ~3.2, producing an unmistakable microwave step change across Siberia, Alaska, and Canada.',
        polarizationAndWavelength:
          '~25 cm L-band (SMAP & NISAR) penetrates vegetation and snow cover to sense topsoil moisture and freeze state across all weather and solar lighting conditions.'
      },
      environmentalAndHumanImpact: {
        environmentalImpact:
          'Captures the full 2015–16 El Niño drought, 2020–22 triple-dip La Niña floods, 2023–24 compound planetary heat anomalies, and bipolar cryosphere shifts.',
        humanAndInfrastructureImpact:
          'Provides early-warning indicators for agricultural drought, permafrost infrastructure thaw, monsoon flood corridors, and polar navigation.',
        naturalDriver:
          'Solar seasonal declination, ITCZ migration, El Niño–Southern Oscillation (ENSO), and polar vortex dynamics.',
        humanDriver:
          'Long-term greenhouse warming amplifying high-latitude permafrost thaw, fire weather, and hydro-climatic volatility.',
        geographicExtent: 'Whole-Planet (-180° to +180° Lon, -90° to +90° Lat).',
        overlayReadingGuide:
          'Cyan (#22D3EE) = Flood/Wetlands, Emerald (#10B981) = Wet Canopy, Amber (#F59E0B) = Dry Soil, Rose (#FB7185) = Fire Anomaly, Indigo (#6366F1) = Frozen Land, Ice White (#E0F2FE) = Polar Sea Ice.'
      },
      dataUsedAndMethodology: {
        satelliteMission: 'NASA SMAP, JAXA GCOM-W1 AMSR2, ESA Sentinel-1 & NASA-ISRO NISAR',
        sensorAndBand: 'L-Band (1.41 GHz / ~21 cm), C-Band (5.4 GHz / 5.6 cm) & Passive Microwave',
        acquisitionDates: 'Monthly composites 2015-01 through 2026-12 (144 frames)',
        processingMethodology:
          'Multi-sensor planetary synthesis combining NASA GIBS SMAP L4 Soil Moisture, SMAP L3 Freeze/Thaw, AMSR2 Sea Ice, and Sentinel-1 RTC crisis overlays.',
        dataResolution: '9 km – 12 km (Planetary Grid) · 10 m – 30 m (Crisis AOIs)',
        observationPeriod: '2015-01-01 to 2026-12-31',
        dataSource: 'NASA GIBS / NSIDC DAAC / ESA Copernicus / ASF DAAC',
        processingModel: 'SARs-Unlimited Schema 2.0 Planetary Hydro-Cryosphere Engine'
      }
    },
    status: 'AVAILABLE'
  }
]

export const AMAZON_PHENOMENON_SLOTS: PhenomenonDefinition[] = [
  {
    id: 'amazon-pheno-1',
    code: 'Pheno 1',
    shortLabel: 'Rainy Season',
    displayName: 'Pheno 1 · Rainy Season & Wetland Recharge',
    scientificTitle: 'AMAZON RAINY SEASON · DIELECTRIC CANOPY & WETLAND RECHARGE',
    description:
      'Peak convective rainfall across the Amazon Basin (Dec–May, wettest Feb–Apr) monitored through persistent equatorial cloud cover via C-band and L-band dielectric moisture sensitivity.',
    geographicScope: 'amazon',
    associatedRegions: ['manaus', 'amazon_basin', 'mamiraua'],
    startDate: '2015-01',
    endDate: '2026-12',
    availableDatasets: ['opera_dswx_s1', 'pc_s1_rtc', 'glofas_era5', 'smap_l4'],
    eventIds: ['manaus_flood_2021', 'nisar_lband_2026'],
    sourcePhenomenonIds: ['rainy_season'],
    accentColor: '#38BDF8',
    defaultSensorBadge: 'OPERA DSWx-S1 · SENTINEL-1 VV',
    activeMonths: [12, 1, 2, 3, 4, 5],
    peakMonths: [2, 3, 4],
    defaultBbox: [-60.35, -3.35, -59.7, -2.95],
    defaultCenter: [-60.025, -3.15],
    layers: [],
    scientificExplanation: {
      whatHappened: {
        description:
          'Peak convective rainfall across the Amazon Basin (Dec–May, peaking in Mar at 282.8 mm/month mean). Cloud-penetrating microwave radar tracks soil/canopy wetting and floodplain recharge even when dense ITCZ clouds blind optical satellites.',
        when: 'Annual seasonal cycle Dec – May (144-month record 2015–2026; peak layer 2025-03-06)',
        where: 'Central Amazon Basin — Manaus / Rio Negro & Solimões Confluence',
        observations:
          'OPERA L3 DSWx-S1 maps 23.46% open water and 2.98% inundated vegetation; Sentinel-1 VV median backscatter reaches -6.36 dB (p90 = -4.54 dB).'
      },
      whySarDetectsIt: {
        primaryMechanism: 'Dielectric Constant Increase (Wet Foliage & Saturated Topsoil εr ≈ 80)',
        roughnessAndBackscatter:
          'Dense Amazon terra firme crowns produce diffuse volume scattering year-round, while rising floodplain lakes turn dark via specular reflection.',
        dielectricAndMoisture:
          'Heavy wet-season rain raises leaf and soil water content, boosting upper-canopy reflectivity (+0.6 to +1.2 dB in Sentinel-1 C-band VV) and triggering early inundated-forest returns.',
        polarizationAndWavelength:
          'C-band (5.6 cm) reacts strongly to leaf/twig surface wetness in the upper crown, whereas L-band (~25 cm) penetrates rain cells and upper leaves to inspect trunks.'
      },
      environmentalAndHumanImpact: {
        environmentalImpact:
          'Recharges 6.15 million km² of Amazonian aquifers and várzea/igapó wetlands; basin-wide SMAP soil moisture peaks up to 87.7% (Mar 2025).',
        humanAndInfrastructureImpact:
          'Unpaved logging roads (BR-319, BR-230) wash out, naturally pausing heavy mechanized deforestation across Dec–May while restoring river navigation.',
        naturalDriver:
          'Southward migration of the Intertropical Convergence Zone (ITCZ) and deep South American Monsoon moisture convergence.',
        humanDriver:
          'Seasonal suspension of frontier road clearing and transition to riverine transport.',
        geographicExtent: 'Central & Whole Amazon Basin (-79.5°W to -44.5°W, -18.0°S to +8.5°N).',
        overlayReadingGuide:
          'Cyan (#00E5FF) = Open Surface Water (Class 1); Light Blue (#40C4FF) = Partial Water; Emerald (#00E676) = Inundated Flooded Vegetation (Class 3).'
      },
      dataUsedAndMethodology: {
        satelliteMission: 'ESA Sentinel-1A & NASA JPL OPERA Project',
        sensorAndBand: 'C-Band SAR (5.6 cm) VV+VH → OPERA DSWx-S1 Water Classification',
        acquisitionDates: '2025-03-06 (OPERA DSWx-S1) · 2025-02-10 (Sentinel-1 RTC VV)',
        processingMethodology:
          'Dynamic Surface Water Extent (OPERA L3 DSWx-S1 v1.0) multi-polarization thresholding + Sentinel-1 RTC backscatter calibration.',
        dataResolution: '30 m (OPERA DSWx-S1) · 20 m (Sentinel-1 RTC)',
        observationPeriod: 'Jan 2015 – Dec 2026',
        dataSource: 'NASA Earthdata Cloud / PO.DAAC / ASF & Planetary Computer',
        processingModel: 'OPERA_L3_DSWx-S1_V1 + GloFAS v4 Hydrological Series'
      }
    },
    status: 'AVAILABLE'
  },
  {
    id: 'amazon-pheno-2',
    code: 'Pheno 2',
    shortLabel: 'Seasonal Flood',
    displayName: 'Pheno 2 · Seasonal Flood & Flooded Forest',
    scientificTitle: 'AMAZON FLOOD PULSE · SUB-CANOPY TRUNK DOUBLE-BOUNCE',
    description:
      'Annual 10–12 meter Amazon flood-pulse wave cresting in Mar–Apr along the Madeira River (Porto Velho) and May–Jun at Manaus, mapped via C-band water masks and ~25 cm L-band sub-canopy double-bounce.',
    geographicScope: 'amazon',
    associatedRegions: ['porto_velho', 'manaus', 'madeira', 'mamiraua', 'purus'],
    startDate: '2015-01',
    endDate: '2026-12',
    availableDatasets: ['opera_dswx_s1', 'pc_s1_rtc', 'nisar_gcov_v1', 'glofas_era5'],
    eventIds: ['manaus_flood_2021', 'nisar_lband_2026'],
    sourcePhenomenonIds: ['seasonal_flood'],
    accentColor: '#00E5FF',
    defaultSensorBadge: 'SENTINEL-1 · NISAR L-BAND HHHH',
    activeMonths: [3, 4, 5, 6],
    peakMonths: [4, 5, 6],
    defaultBbox: [-64.05, -8.9, -63.7, -8.55],
    defaultCenter: [-63.875, -8.725],
    layers: [],
    scientificExplanation: {
      whatHappened: {
        description:
          'Southern tributaries like the Madeira River at Porto Velho crest in Mar–Apr, whereas the Rio Negro/Solimões mainstem at Manaus peaks in May–Jun (reaching an all-time record 30.02 m crest in June 2021 and 229,001 m³/s peak discharge in Apr 2022).',
        when: 'Annual flood crest Mar – Jun (Record crest: Jun 2021 Manaus · Jun 2026 NISAR Flood Pass)',
        where: 'Porto Velho (Rio Madeira), Manaus (Rio Negro Confluence) & Mamirauá Várzea',
        observations:
          'June 2021 Manaus flood reached 22.44% open water (+4.34% new inundation) and 0.99% flooded igapó forest; Madeira flood reaches 10.47% open water.'
      },
      whySarDetectsIt: {
        primaryMechanism: 'Specular Channel Darkness + Sub-Canopy Trunk–Water Corner Double-Bounce',
        roughnessAndBackscatter:
          'Two opposite radar signatures appear side-by-side: calm open rivers act as dark radar mirrors (<-15 dB), while flooded tree trunks standing in water form 90° dihedral corner reflectors (+3.5 to +5.5 dB brightening).',
        dielectricAndMoisture:
          'High-dielectric floodwater (εr ≈ 80) beneath várzea/igapó trees reflects incident microwaves forward onto vertical tree trunks and straight back to the satellite.',
        polarizationAndWavelength:
          'HH / HHHH co-polarization maximizes double-bounce off horizontal water + vertical trunks; ~25 cm NISAR L-band penetrates closed 30 m forest canopies to reveal flooded forests beneath.'
      },
      environmentalAndHumanImpact: {
        environmentalImpact:
          'Drives lateral nutrient exchange and fish spawning across várzea and igapó flooded forests spanning >250,000 km².',
        humanAndInfrastructureImpact:
          'Submerges urban waterfronts in Manaus and Iranduba, impacts stilt communities, and modulates hydropower operations at Santo Antônio and Jirau dams on the Madeira.',
        naturalDriver:
          'Asynchronous flood timing of southern Andean/Madeira rainfall (Mar–Apr) vs. northern Rio Negro crest (May–Jun), amplified during La Niña years.',
        humanDriver:
          'Peri-urban floodplain urbanization and run-of-river dam reservoir management.',
        geographicExtent: 'Middle Madeira, Solimões–Japurá (Mamirauá), Lower Purus, and Manaus Confluence.',
        overlayReadingGuide:
          'Cyan (#00E5FF) = Open Floodwater; Emerald (#00E676) = C-band Flooded Vegetation; Pink/Gold (#F472B6) = NISAR L-band HHHH Sub-Canopy Double-Bounce.'
      },
      dataUsedAndMethodology: {
        satelliteMission: 'ESA Sentinel-1A, NASA JPL OPERA & NASA-ISRO NISAR',
        sensorAndBand: 'C-Band (5.6 cm) VV/VH & NISAR L-Band (~25 cm) HHHH GCOV',
        acquisitionDates: '2021-06-19 (Manaus Record Flood) · 2025-04-09 (Madeira) · 2026-06-23 (NISAR Flood)',
        processingMethodology:
          'Multi-temporal flood change detection (Peak vs. Low-Water Baseline) and polarimetric L-band covariance (GCOV) decomposition.',
        dataResolution: '20 m – 30 m geocoded radar grids',
        observationPeriod: '2015–2026',
        dataSource: 'NASA ASF DAAC / PO.DAAC / Microsoft Planetary Computer',
        processingModel: 'OPERA DSWx-S1 + NISAR L2 PR GCOV Track 140'
      }
    },
    status: 'AVAILABLE'
  },
  {
    id: 'amazon-pheno-3',
    code: 'Pheno 3',
    shortLabel: 'Dry Season',
    displayName: 'Pheno 3 · Dry Season Canopy Moisture Stress',
    scientificTitle: 'AMAZON DRY SEASON · CANOPY DESICCATION & DIELECTRIC DROP',
    description:
      'Austral winter–spring dry period (Jun/Jul–Oct) across the central and southern Amazon where falling rainfall lowers topsoil moisture and upper-canopy dielectric backscatter (ΔVH).',
    geographicScope: 'amazon',
    associatedRegions: ['manaus', 'tefe', 'amazon_basin'],
    startDate: '2015-01',
    endDate: '2026-12',
    availableDatasets: ['pc_s1_rtc', 'smap_l4', 'glofas_era5'],
    eventIds: ['el_nino_drought_2015', 'severe_drought_2023', 'drought_fires_2024'],
    sourcePhenomenonIds: ['dry_season'],
    accentColor: '#FBBF24',
    defaultSensorBadge: 'SENTINEL-1 · C-BAND VH / ΔVH',
    activeMonths: [6, 7, 8, 9, 10],
    peakMonths: [8, 9],
    defaultBbox: [-60.35, -3.35, -59.7, -2.95],
    defaultCenter: [-60.025, -3.15],
    layers: [],
    scientificExplanation: {
      whatHappened: {
        description:
          'From June to October, basin-wide precipitation drops to a minimum of 41.8 mm in August. Reduced leaf water potential and soil desiccation lower C-band cross-polarized backscatter across upland terra firme and seasonal floodplains.',
        when: 'Annual Jun – Oct dry season (Peak stress in Aug–Sep; reference pass 2022-08-13)',
        where: 'Central & Southern Amazon Basin (Manaus, Tefé, and southern tributaries)',
        observations:
          'Sentinel-1 C-band VH median drops to -13.13 dB (p10 = -23.97 dB), with 10.08% of the scene exhibiting >2 dB seasonal moisture/canopy shift.'
      },
      whySarDetectsIt: {
        primaryMechanism: 'Dielectric Constant Drop from Leaf Water Potential & Topsoil Desiccation',
        roughnessAndBackscatter:
          'Standing terra firme tree geometry remains physically rough, so spatial forest texture persists even as radar brightness declines with moisture loss.',
        dielectricAndMoisture:
          'Lower leaf moisture and drier surface soil reduce the effective dielectric constant across sunlit crowns, decreasing C-band VH cross-polarization by -0.8 to -1.8 dB.',
        polarizationAndWavelength:
          'C-band (5.6 cm) senses rapid top-leaf water stress during dry spells, while ~25 cm L-band remains stable over deep woody trunks unless drought causes structural branch mortality.'
      },
      environmentalAndHumanImpact: {
        environmentalImpact:
          'Pre-conditions forest litter and understory fuel for late-dry wildfire ignition; SMAP basin soil moisture dropped to 39.7% during the Nov 2023 drought trough.',
        humanAndInfrastructureImpact:
          'Dry-season soil firming enables heavy logging and earth-moving machinery to access frontier roads (BR-230, BR-319, BR-163).',
        naturalDriver:
          'Seasonal northward migration of the ITCZ (Jun–Oct), amplified strongly during El Niño and warm Tropical North Atlantic SST anomalies.',
        humanDriver:
          'Dry-window mechanized road grading, timber extraction, and pasture preparation.',
        geographicExtent: 'Central and Southern Amazonia.',
        overlayReadingGuide:
          'Grayscale VH shows canopy moisture intensity (-24 to -6 dB); orange (#FF9100) and rose (#F43F5E) in ΔVH highlight desiccation and canopy loss (>2 dB drop).'
      },
      dataUsedAndMethodology: {
        satelliteMission: 'ESA Copernicus Sentinel-1A & NASA SMAP',
        sensorAndBand: 'C-Band SAR (5.6 cm) VH & ΔVH + SMAP L4 Soil Moisture',
        acquisitionDates: '2022-08-13 (Dry-Season Benchmark) & 2015–2026 Monthly Series',
        processingMethodology:
          'Seasonal wet-to-dry cross-polarized RTC differencing (ΔVH) paired with NASA SMAP root-zone/surface moisture indices.',
        dataResolution: '20 m (Sentinel-1 RTC) · 9 km (SMAP L4)',
        observationPeriod: '2015–2026',
        dataSource: 'ESA Copernicus / Microsoft Planetary Computer / NSIDC DAAC',
        processingModel: 'C-Band Canopy Dielectric Stress & Desiccation Tracker'
      }
    },
    status: 'AVAILABLE'
  },
  {
    id: 'amazon-pheno-4',
    code: 'Pheno 4',
    shortLabel: 'Land Clearing',
    displayName: 'Pheno 4 · Forest Clearing & Land Opening',
    scientificTitle: 'FRONTIER DEFORESTATION · 3D CANOPY VOLUME LOSS (ΔVH & OPERA DIST)',
    description:
      'Mechanized forest felling and fishbone pasture expansion along Southern Amazonas and Pará highways (BR-230, BR-163, BR-319) detected through cloud cover via C-band volume loss and NISAR L-band biomass tracking.',
    geographicScope: 'amazon',
    associatedRegions: ['apui_labrea', 'global_amz_br163', 'xingu', 'madeira'],
    startDate: '2015-01',
    endDate: '2026-12',
    availableDatasets: ['pc_s1_rtc', 'opera_dist_alert_s1', 'nisar_gcov_v1'],
    eventIds: ['amazon_fire_surge_2019', 'drought_fires_2024', 'nisar_lband_2026'],
    sourcePhenomenonIds: ['clearing_land_opening'],
    accentColor: '#FB923C',
    defaultSensorBadge: 'SENTINEL-1 ΔVH · OPERA DIST-ALERT · NISAR',
    activeMonths: [6, 7, 8, 9, 10],
    peakMonths: [7, 8, 9],
    defaultBbox: [-60.0, -7.5, -59.5, -7.0],
    defaultCenter: [-59.75, -7.25],
    layers: [],
    scientificExplanation: {
      whatHappened: {
        description:
          'During the dry Jun–Oct ground-access window, rectangular pasture clearings and fishbone logging roads expand into intact terra firme rainforest along the Apuí–Lábrea (BR-230) and Novo Progresso (BR-163) frontiers.',
        when: 'Concentrated Jun – Oct annually (Aug 2019 BR-163 Surge · 2020→2024 BR-230 ΔVH · Feb 2026 OPERA DIST)',
        where: 'Apuí–Lábrea Deforestation Arc (BR-230, Amazonas) & BR-163 Corridor (Pará)',
        observations:
          '23.47% clear-cut volume drop along BR-163 (Aug 2019); 11.71% disturbed pixels (5.17% high-confidence) in NASA OPERA DIST-ALERT-S1 over Apuí (2026).'
      },
      whySarDetectsIt: {
        primaryMechanism: '3D Canopy Volume Scattering Collapse (Random Branches → Flat Bare Pasture)',
        roughnessAndBackscatter:
          'Intact multi-story rainforest is a deep 3D volume of randomly oriented branches and leaves that strongly depolarizes radar waves. Felling replaces this with flat bare soil or pasture, collapsing cross-polarized backscatter in sharp geometric plots.',
        dielectricAndMoisture:
          'Freshly felled slash dries rapidly under equatorial sun, making cleared geometric polygons persistently dark in VH (-2 to -6 dB drop) regardless of cloud cover.',
        polarizationAndWavelength:
          'Cross-polarization (Sentinel-1 VH and NISAR HVHV) is the premier deforestation detector; L-band (~25 cm) directly measures loss of heavy woody trunk biomass (~150+ Mg/ha).'
      },
      environmentalAndHumanImpact: {
        environmentalImpact:
          'Fragmentation of contiguous rainforest canopy, loss of aboveground carbon biomass, and creation of dry edge microclimates vulnerable to fire invasion.',
        humanAndInfrastructureImpact:
          'Expansion of unpaved road networks, cattle pasture conversion, and land-tenure conflicts across protected and indigenous buffer zones.',
        naturalDriver:
          'Dry Jun–Oct soil firming allows heavy bulldozers and chainsaws to enter upland terra firme.',
        humanDriver:
          'Cattle ranching pasture conversion and speculative land clearing along BR-230, BR-163, and BR-319.',
        geographicExtent: 'Southern Amazonas (Apuí–Lábrea), Pará (BR-163 / Xingu), and Rondônia.',
        overlayReadingGuide:
          'Rose-red (#F43F5E) marks high-confidence geometric clearing (ΔVH ≤ -4 dB / OPERA High-Conf); orange (#FF9100) marks edge canopy thinning (-4 < ΔVH ≤ -2 dB).'
      },
      dataUsedAndMethodology: {
        satelliteMission: 'ESA Sentinel-1A, NASA JPL OPERA & NASA-ISRO NISAR',
        sensorAndBand: 'C-Band ΔVH (5.6 cm), OPERA DIST-ALERT-S1 & NISAR L-Band SHSH/HVHV (~25 cm)',
        acquisitionDates: '2019-08-26 (BR-163) · 2024-10-13 (Apuí ΔVH) · 2026-02-24 (OPERA DIST) · 2026-10-21 (NISAR)',
        processingMethodology:
          'Multi-year cross-pol log-ratio differencing (ΔVH) and OPERA L3 Surface Disturbance Alert confidence classification.',
        dataResolution: '20 m – 30 m',
        observationPeriod: '2015–2026',
        dataSource: 'NASA LP DAAC / ASF DAAC / Microsoft Planetary Computer',
        processingModel: 'OPERA_L3_DIST-ALERT-S1_V1 + Sentinel-1 ΔVH Deforestation Pipeline'
      }
    },
    status: 'AVAILABLE'
  },
  {
    id: 'amazon-pheno-5',
    code: 'Pheno 5',
    shortLabel: 'Fire Season',
    displayName: 'Pheno 5 · Fire Season & Smoke-Penetrating Burn Scars',
    scientificTitle: 'AMAZON FIRE SEASON · SMOKE-PENETRATING SAR ΔVH + MODIS THERMAL FUSION',
    description:
      'Peak Amazon burning season (Aug–Oct, climaxing in Sep) where active SAR microwave pulses pierce dense pyrocumulus smoke plumes to map structural burn scars alongside NASA FIRMS thermal hotspots.',
    geographicScope: 'amazon',
    associatedRegions: ['apui_labrea', 'global_amz_br163'],
    startDate: '2015-01',
    endDate: '2026-12',
    availableDatasets: ['firms_modis', 'pc_s1_rtc'],
    eventIds: ['drought_fires_2024', 'amazon_fire_surge_2019'],
    sourcePhenomenonIds: ['fire_season'],
    accentColor: '#F43F5E',
    defaultSensorBadge: 'SENTINEL-1 ΔVH · NASA FIRMS MODIS C6.1',
    activeMonths: [8, 9, 10],
    peakMonths: [9],
    defaultBbox: [-60.5, -8.5, -58.5, -6.5],
    defaultCenter: [-59.75, -7.25],
    layers: [],
    scientificExplanation: {
      whatHappened: {
        description:
          'Between August and October (peaking in September at an average of 26,414 detections/month, and reaching 48,322 in Sep 2024 / 132,754 in full-year 2024), slash fires and drought-driven understory megafires blanket the Amazon in thick smoke.',
        when: 'Annual Aug – Oct fire window (Peak crises: Aug 2019 BR-163 & Sep 2024 Apuí–Lábrea Record Fires)',
        where: 'Apuí–Lábrea Frontier (Southern Amazonas) & BR-163 Corridor (Pará)',
        observations:
          '5,144 high-confidence MODIS C6.1 thermal fire detections in the Apuí–Lábrea window (Aug–Oct 2024) paired with 4.22% Sentinel-1 ΔVH canopy loss beneath smoke.'
      },
      whySarDetectsIt: {
        primaryMechanism: 'Smoke-Penetrating Microwave Burn-Scar Mapping (ΔVH) Fused with Thermal IR',
        roughnessAndBackscatter:
          'Fire consumes fine leaves and twigs (reducing cross-pol volume scatter by -2.0 to -4.8 dB) while leaving charred bare soil and skeletal standing snags exposed to radar pulses.',
        dielectricAndMoisture:
          'Extreme vapor pressure deficit (VPD) and fire heat vaporize surface soil and litter moisture, dropping surface permittivity until November rains arrive.',
        polarizationAndWavelength:
          'Both C-band (5.6 cm) and L-band (~25 cm) penetrate dense biomass smoke without attenuation, separating active burn scars from unburned smoke-covered forest.'
      },
      environmentalAndHumanImpact: {
        environmentalImpact:
          'Stand-replacing mortality in drought-stressed rainforest edges, massive carbon emissions, andcontinental smoke plumes.',
        humanAndInfrastructureImpact:
          'Severe respiratory health crises across Amazonian cities (Manaus, Porto Velho, Rio Branco), airport closures, and destruction of agroforestry plots.',
        naturalDriver:
          'Late-dry VPD spike and multi-year 2023–2024 precipitation deficit leaving forest litter parched.',
        humanDriver:
          'Broadcast ignition of Jun–Aug felled slash to clear cattle pastures and release soil ash nutrients.',
        geographicExtent: 'Southern Amazon Arc of Deforestation (Amazonas, Rondônia, Pará, Mato Grosso).',
        overlayReadingGuide:
          'Yellow/Orange (#FFEE58 / #FF6D00) = Active MODIS C6.1 Thermal Fire Clusters; Crimson (#F43F5E) = Sentinel-1 ΔVH Structural Burn Scars.'
      },
      dataUsedAndMethodology: {
        satelliteMission: 'ESA Copernicus Sentinel-1A & NASA Aqua/Terra MODIS',
        sensorAndBand: 'C-Band SAR ΔVH (5.6 cm) + MODIS C6.1 Thermal IR (8–10 μm)',
        acquisitionDates: '2024-08-01..2024-10-31 (MODIS C6.1) · 2024-07-09 vs. 2024-10-13 (Sentinel-1 ΔVH)',
        processingMethodology:
          'Sensor fusion of active thermal hotspot density (NASA FIRMS) with pre/post-burn Sentinel-1 RTC cross-polarization differencing.',
        dataResolution: '20 m (Sentinel-1 SAR) · 1 km (MODIS Thermal Hotspots)',
        observationPeriod: '2015–2026 (144-month fire & backscatter record)',
        dataSource: 'NASA LANCE / FIRMS & Microsoft Planetary Computer',
        processingModel: 'Dual Thermal-IR Hotspot & SAR ΔVH Burn-Scar Fusion'
      }
    },
    status: 'AVAILABLE'
  },
  {
    id: 'amazon-pheno-6',
    code: 'Pheno 6',
    shortLabel: 'Low River Levels',
    displayName: 'Pheno 6 · Low River Levels & Exposed Sandbars',
    scientificTitle: 'HYDROLOGIC TROUGH · ROUGHNESS INVERSION ON EXPOSED SANDBARS (+ΔVV)',
    description:
      'Annual Amazon low-water trough (Aug–Oct, lowest in Sep/Oct) where shrinking river channels expose rough sandbars, mudflats, and rocky shoals that spike radar backscatter (+ΔVV ≥ +2 dB).',
    geographicScope: 'amazon',
    associatedRegions: ['porto_velho', 'manaus', 'tefe', 'madeira'],
    startDate: '2015-01',
    endDate: '2026-12',
    availableDatasets: ['pc_s1_rtc', 'opera_dswx_s1', 'glofas_era5'],
    eventIds: ['el_nino_drought_2015', 'severe_drought_2023', 'drought_fires_2024'],
    sourcePhenomenonIds: ['low_river_levels'],
    accentColor: '#A855F7',
    defaultSensorBadge: 'SENTINEL-1 ΔVV · OPERA DSWx-S1',
    activeMonths: [8, 9, 10],
    peakMonths: [9, 10],
    defaultBbox: [-64.05, -8.9, -63.7, -8.55],
    defaultCenter: [-63.875, -8.725],
    layers: [],
    scientificExplanation: {
      whatHappened: {
        description:
          'During the Aug–Oct dry trough, Amazon mainstem discharge falls to an average of 66,313 m³/s in October (and a 12-year record low of 30,069.2 m³/s in Oct 2024). Retreating channels expose kilometer-wide sandbars and mudflats.',
        when: 'Annual Aug – Oct low-water season (Historic lows: Nov 2015, Oct 2023, Sep–Oct 2024)',
        where: 'Rio Madeira at Porto Velho, Rio Solimões at Tefé & Rio Negro at Manaus',
        observations:
          'OPERA DSWx-S1 shows Madeira open water compressed to 5.79% (Oct 2024); Manaus stage fell to 12.66 m (2024) and 12.70 m (2023); 15.48% exposed channel bars in 2015–16 El Niño.'
      },
      whySarDetectsIt: {
        primaryMechanism: 'Roughness Inversion (Smooth Specular Water → Bright Rough Sandbars)',
        roughnessAndBackscatter:
          'When flooded, smooth river water reflects microwaves away like a mirror (<-16 dB). As water drops in Sep–Oct, rippled sandbars, cracked mudflats, and cobble shoals replace water—jumping +4 to +8 dB brighter in C-band!',
        dielectricAndMoisture:
          'Exposed moist alluvial bars combine high soil permittivity with centimeter-scale wind/current sand ripples that strongly backscatter C-band radar.',
        polarizationAndWavelength:
          '5.6 cm C-band VV is acutely sensitive to centimeter-scale sand ripples on newly exposed river bars, while OPERA DSWx-S1 delineates the contracted low-flow channel.'
      },
      environmentalAndHumanImpact: {
        environmentalImpact:
          'Disconnects floodplain lakes from mainstem rivers, trapping aquatic fauna in shallow solar-heated basins.',
        humanAndInfrastructureImpact:
          'Strands supply barges, isolates riverside municipalities from food/medical deliveries, and forces hydropower curtailment at Santo Antônio and Jirau.',
        naturalDriver:
          'Seasonal baseflow recession peaking Sep–Oct, pushed to record extremes by compound El Niño and warm North Atlantic droughts.',
        humanDriver:
          'Heavy reliance on river barge logistics and run-of-river hydroelectric generation.',
        geographicExtent: 'Rio Madeira, Middle Solimões (Tefé), and Manaus Confluence.',
        overlayReadingGuide:
          'Yellow/Gold (#FACC15) = Exposed Rough Sandbars (ΔVV ≥ +3 dB); Purple (#A855F7) = Shallow Drying Shoals (+1.5 to +3 dB); Cyan (#00E5FF) = Remaining Channel.'
      },
      dataUsedAndMethodology: {
        satelliteMission: 'ESA Copernicus Sentinel-1A & NASA JPL OPERA',
        sensorAndBand: 'C-Band SAR (5.6 cm) ΔVV & OPERA L3 DSWx-S1',
        acquisitionDates: '2024-09-05 (Madeira ΔVV) · 2024-10-11 (OPERA DSWx-S1) · 2016-01-17 (El Niño)',
        processingMethodology:
          'High-water vs. low-water co-polarized backscatter inversion (+ΔVV) and OPERA surface water contraction mapping.',
        dataResolution: '20 m – 30 m',
        observationPeriod: '2015–2026',
        dataSource: 'NASA PO.DAAC / ASF DAAC / Copernicus GloFAS',
        processingModel: 'SAR Specular-to-Roughness Sandbar Inversion Model'
      }
    },
    status: 'AVAILABLE'
  },
  {
    id: 'amazon-pheno-7',
    code: 'Pheno 7',
    shortLabel: 'Mega-Droughts',
    displayName: 'Pheno 7 · Compound El Niño & Lake Tefé Droughts',
    scientificTitle: 'AMAZON MEGA-DROUGHT COMPARATOR · 2015–16 EL NIÑO VS. 2023–24 COMPOUND DROUGHT',
    description:
      'Decadal comparative analysis of the 2015–16 Super El Niño drought, the Oct 2023 Lake Tefé thermal crisis (39.1 °C), and the 2024 all-time low river stage (12.66 m at Manaus).',
    geographicScope: 'amazon',
    associatedRegions: ['tefe', 'manaus', 'apui_labrea', 'mamiraua'],
    startDate: '2015-01',
    endDate: '2026-12',
    availableDatasets: ['pc_s1_rtc', 'glofas_era5', 'smap_l4'],
    eventIds: ['severe_drought_2023', 'el_nino_drought_2015', 'drought_fires_2024'],
    sourcePhenomenonIds: ['low_river_levels', 'dry_season'],
    accentColor: '#F59E0B',
    defaultSensorBadge: 'SENTINEL-1 VV / ΔVV · GLOFAS · SMAP',
    activeMonths: [9, 10, 11],
    peakMonths: [10],
    defaultBbox: [-64.85, -3.45, -64.55, -3.2],
    defaultCenter: [-64.7, -3.325],
    layers: [],
    scientificExplanation: {
      whatHappened: {
        description:
          'Three historic droughts struck the Amazon within a decade: the 2015–16 "Godzilla" El Niño, the Sep–Nov 2023 Lake Tefé contraction (-13.45% water area loss and 39.1 °C water temperatures), and the 2024 historic low (Manaus 12.66 m, discharge 30,069 m³/s).',
        when: 'Nov 2015 – Jan 2016 · Sep – Nov 2023 · Aug – Oct 2024',
        where: 'Lake Tefé & Mamirauá (Middle Solimões), Manaus Confluence & Southern Amazonas',
        observations:
          'Lake Tefé open water contracted by -13.45% in Oct 2023 (VV p10 rose from -19.19 dB to -14.87 dB as mirror water became mudflats); Manaus stage hit 12.70 m (2023) and 12.66 m (2024).'
      },
      whySarDetectsIt: {
        primaryMechanism: 'Multi-Year Shoreline Contraction & Specular-to-Mudflat Backscatter Shift',
        roughnessAndBackscatter:
          'Receding lake shorelines replace mirror-smooth open water (-19 dB) with cracked silt beds and exposed bars (-9 to -5 dB), shifting the entire scene backscatter histogram upward by +4 to +6 dB.',
        dielectricAndMoisture:
          'Loss of open surface water and drying várzea wetlands lowers regional dielectric wetness across hundreds of square kilometers.',
        polarizationAndWavelength:
          'Sentinel-1 C-band VV time series across identical orbital tracks quantifies exact shoreline contraction polygons between May high water and October drought peaks.'
      },
      environmentalAndHumanImpact: {
        environmentalImpact:
          'Mass mortality of endangered Tucuxi and pink river dolphins in 39.1 °C Lake Tefé (Oct 2023) and widespread wetland desiccation.',
        humanAndInfrastructureImpact:
          'Complete isolation of riverside communities along the Solimões and Negro, emergency dredging, and drinking-water scarcity.',
        naturalDriver:
          'Compound Pacific El Niño warming synchronized with record Tropical North Atlantic sea-surface temperature anomalies.',
        humanDriver:
          'Regional deforestation weakening local evapotranspiration recycling ("flying rivers") and amplifying surface heating.',
        geographicExtent: 'Middle Solimões (Lake Tefé / Mamirauá) and Central Amazon Confluence.',
        overlayReadingGuide:
          'Amber (#F59E0B) marks lost lake water / exposed mudflats; Dark Blue (#1565C0) marks the contracted permanent channel; Cyan (#00E5FF) marks minor water gain.'
      },
      dataUsedAndMethodology: {
        satelliteMission: 'ESA Copernicus Sentinel-1A & CEMS GloFAS v4',
        sensorAndBand: 'C-Band SAR (5.6 cm) VV & ΔVV/ΔVH + River Discharge Telemetry',
        acquisitionDates: '2016-01-17 (El Niño) · 2023-05-19 vs. 2023-10-22 (Lake Tefé) · 2024-10-13 (2024 Drought)',
        processingMethodology:
          'Bi-temporal water mask differencing and backscatter histogram shift analysis between seasonal high-water and drought troughs.',
        dataResolution: '20 m Sentinel-1 RTC',
        observationPeriod: '2015–2026',
        dataSource: 'ESA Copernicus / Microsoft Planetary Computer / ECMWF GloFAS',
        processingModel: 'Decadal Amazon Drought Shoreline & Backscatter Comparator'
      }
    },
    status: 'AVAILABLE'
  },
  {
    id: 'amazon-pheno-8',
    code: 'Pheno 8',
    shortLabel: 'NISAR L-Band',
    displayName: 'Pheno 8 · NISAR L-Band (~25 cm) Sub-Canopy Polarimetry',
    scientificTitle: 'NASA–ISRO NISAR L-BAND (24 CM) · VALIDATED GCOV POLARIMETRY & C-BAND FUSION',
    description:
      'Validated 2026 NASA-ISRO NISAR Level-2 GCOV dual-polarization (HHHH + HVHV) passes over Manaus and Apuí (Track 140), demonstrating ~25 cm L-band sub-canopy penetration alongside simultaneous NASA OPERA Sentinel-1 C-band.',
    geographicScope: 'amazon',
    associatedRegions: ['manaus', 'apui_labrea', 'porto_velho', 'mamiraua'],
    startDate: '2025-01',
    endDate: '2026-12',
    availableDatasets: ['nisar_gcov_v1', 'opera_dswx_s1'],
    eventIds: ['nisar_lband_2026', 'manaus_flood_2021'],
    sourcePhenomenonIds: ['seasonal_flood', 'clearing_land_opening'],
    accentColor: '#A78BFA',
    defaultSensorBadge: 'NASA–ISRO NISAR · L-BAND 24 CM GCOV',
    activeMonths: [6, 10, 11],
    peakMonths: [10, 11],
    defaultBbox: [-60.35, -3.35, -59.7, -2.95],
    defaultCenter: [-60.025, -3.15],
    layers: [],
    scientificExplanation: {
      whatHappened: {
        description:
          'Following NISAR commissioning (394 scenes in 2025 and 3,704 scenes in 2026), validated Level-2 GCOV passes on Track 140 captured the June 2026 flood crest and October–November 2026 dry transition over Manaus and the BR-230 frontier.',
        when: 'Jun 2026 – Nov 2026 (2026-06-23 Flood Pass · 2026-10-21 & 2026-11-02 Dry Transition Passes)',
        where: 'Manaus Confluence (Rio Negro / Solimões, Track 140) & Apuí–Lábrea Frontier',
        observations:
          'L-band HHHH median -6.6 dB (p90 = +0.22 dB) vs. HVHV median -11.61 dB (+5.01 dB co/cross-pol separation); Jun→Oct ΔHHHH captures 13.06% flooded double-bounce drop and 13.66% exposed bank rise.'
      },
      whySarDetectsIt: {
        primaryMechanism: '~25 cm L-Band Deep Canopy Penetration & Polarimetric Covariance (HHHH vs. HVHV)',
        roughnessAndBackscatter:
          'Whereas 5.6 cm C-band scatters off upper-crown leaves and twigs, NISAR’s ~25 cm L-band wavelength passes straight through foliage to scatter off large woody trunks, forest floor roughness, and sub-canopy water.',
        dielectricAndMoisture:
          'Comparing June flood peak vs. October dry transition on identical Track 140 isolates high-dielectric flooded igapó trunk double-bounce (HHHH) from dry forest floor scattering.',
        polarizationAndWavelength:
          'HHHH (horizontal co-pol) highlights specular water darkness and trunk–water double-bounce; HVHV (cross-pol) quantitatively measures 3D woody forest biomass density.'
      },
      environmentalAndHumanImpact: {
        environmentalImpact:
          'Enables accurate sub-canopy wetland methane/hydrology mapping and woody carbon biomass monitoring across dense tropical forests.',
        humanAndInfrastructureImpact:
          'Provides operational 12-day repeat all-weather monitoring of Amazonian flood waves and frontier deforestation.',
        naturalDriver:
          '2026 Rio Negro flood-to-dry seasonal hydrological pulse captured across repeat 12-day NISAR orbits.',
        humanDriver:
          'Establish baseline L-band woody biomass and disturbance reference across central Amazonia.',
        geographicExtent: 'NISAR Track 140 Swath (-60.61°W to -57.60°W, -4.56°S to -1.61°S).',
        overlayReadingGuide:
          'Pink/Gold (#F472B6) = Strong L-band HHHH Trunk & Double-Bounce; Emerald (#34D399) = HVHV Woody Canopy Biomass; Dark Slate (#1E293B) = Specular Open River.'
      },
      dataUsedAndMethodology: {
        satelliteMission: 'NASA–ISRO SAR (NISAR) & NASA JPL OPERA (Sentinel-1D)',
        sensorAndBand: 'L-Band SAR (~25 cm, 1.25 GHz) Dual-Pol HHHH/HVHV + C-Band OPERA DSWx-S1',
        acquisitionDates: '2026-06-23 · 2026-10-21 · 2026-11-02 (NISAR GCOV) & 2026-11-03 (OPERA S1D)',
        processingMethodology:
          'Geocoded Polarimetric Covariance (NISAR_L2_PR_GCOV v1) dB scaling, RGB dual-pol compositing, and C-band/L-band co-registration.',
        dataResolution: '20 m – 30 m geocoded covariance matrix (GCOV)',
        observationPeriod: '2025–2026 (within 2015–2026 multi-mission archive)',
        dataSource: 'NASA Earthdata Cloud / ASF DAAC & PO.DAAC',
        processingModel: 'NISAR L2 PR GCOV Track 140 + OPERA L3 DSWx-S1 v1.0'
      }
    },
    status: 'AVAILABLE'
  }
]

export const ALL_PHENOMENON_SLOTS: PhenomenonDefinition[] = [
  ...GLOBAL_PHENOMENON_SLOTS,
  ...AMAZON_PHENOMENON_SLOTS
]
