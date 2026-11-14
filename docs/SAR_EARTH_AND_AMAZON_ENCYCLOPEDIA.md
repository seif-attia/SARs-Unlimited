# Earth & Amazon SAR Surface-Change Encyclopedia (2015–2026)

**NASA Space Apps Challenge 2026 — _Dancing with the SARs_**  
**Dataset Schema:** `2.0.0` · **Temporal Span:** `2015-01` through `2026-12` (`144` monthly frames)  
**Scope:** Whole-Planet Live Cryosphere & Hydro-Climate Atlas + Whole-Amazon Basin Focus · `6` Seasonal Phenomena · `15` Verified Crisis Case Studies (`6` Amazon + `9` Global) · `53` Geo-Referenced Radar Layers

---

## 1. Global Earth SAR Patterns & Radar Physics (2015–2026)

### 1.1 Active Microwave Physics: Why Radar Sees What Optical Misses
Unlike optical satellites that rely on sunlight and are blinded by equatorial clouds, nocturnal darkness, polar night, or dense wildfire smoke, Synthetic Aperture Radar (**SAR**) and L-band microwave radiometers actively measure surface **roughness/geometry** and **dielectric constant ($\varepsilon_r$)**:

- **Dielectric Contrast ($\varepsilon_r$):** Liquid water exhibits a high relative dielectric constant ($\varepsilon_r \approx 80$), whereas dry soils, dry vegetation, and frozen permafrost/ice drop sharply ($\varepsilon_r \approx 3\text{–}5$). Thawing spring tundra creates an abrupt upward step in microwave emission and radar backscatter, while standing floodwater dramatically alters radar path geometry.
- **Specular Mirror Reflection (Open Water & Floodplains):** Calm open water reflects incoming oblique radar pulses away from the satellite antenna, producing very dark backscatter (`VV` typically $\le -15\text{ dB}$ to $-24\text{ dB}$). Smooth volcanic tephra and oil-damped ocean slicks (suppressed Bragg capillary waves) likewise drop into low backscatter regimes.
- **Dihedral Double-Bounce (Sub-Canopy Floods & Urban Areas):** When standing water floods beneath vertical tree trunks (*igapó* and *várzea* forests) or against city buildings (e.g., Porto Alegre 2024), the water surface acts as a mirror bouncing the radar wave cleanly into vertical walls/trunks and straight back to the sensor — creating extreme bright hotspots (`VV` reaching $-3.1\text{ dB}$ to $> +1\text{ dB}$).
- **Volume Scattering (3D Intact Rainforest vs. Clearings/Scars):** Intact multi-story rainforest crowns depolarize incoming vertical (`V`) or horizontal (`H`) pulses inside random twigs and leaves, elevating cross-polarized backscatter (`VH` / `HVHV`). Bulldozed clearings and crown-scorching megafires flatten 3D roughness into smoother bare soil/ash (`ΔVH ≤ -2.0 dB` to `-4.0 dB`).

### 1.2 Multi-Frequency Wavelength Penetration (`C` vs. `S` vs. `L-Band`)

| Band / Mission | Wavelength | Primary Scattering Target | Key Earth Observation Capability |
| :--- | :--- | :--- | :--- |
| **C-Band** (Sentinel-1, OPERA DSWx/DIST) | **5.6 cm** | Upper canopy leaves, ocean capillary ripples, urban geometry, exposed sandbars | Rapid 6–12 day change detection (`ΔVV`, `ΔVH`), global flood mapping through clouds, InSAR fault fringes |
| **S-Band** (NISAR S-SAR / ISRO) | **12 cm** | Intermediate branches, crops, wetlands, glaciers | Bridges fine agricultural roughness and medium vegetation penetration |
| **L-Band** (NASA-ISRO **NISAR** GCOV, ALOS-2 PALSAR-2) | **24 cm** | Sub-canopy trunks, deep woody biomass, flooded forest double-bounce, peatland & InSAR coherence | Penetrates dense tropical rainforest crowns to track below-canopy inundation (`HHHH`), woody biomass (`HVHV`), and coherent ground slip |

---

### 1.3 Verified 12-Year Planetary & Amazon Telemetry Summary (2015–2026)

Extracted directly from the validated `144`-month dataset (`data/amazon_sar_2020_2026.json`):

- **Amazon Peak Observed Discharge (Manaus):** `229,001.0 m³/s` (`2022-04`)
- **Amazon Lowest Observed Discharge (Manaus):** `30,069.2 m³/s` (`2024-10`) *(Note: `2026-12` holds `0.0 m³/s` beyond the Nov 13, 2026 observed river cutoff)*
- **Peak Single-Month Amazon Active Fires (MODIS C6.1):** `48,322` detections (`2024-09`)
- **Amazon SMAP Soil Moisture Index Range:** Peak `87.7%` (`2025-03`) · Trough `39.7%` (`2023-11`)
- **Global Frozen Land Coverage Range:** Peak `42.1%` (`2024-01`, Northern Hemisphere winter peak) · Minimum `6.2%` (`2018-08`, boreal summer thaw)
- **Polar Sea-Ice Concentration Index:** Observed GIBS AMSR2 peak `100.0%` (`2015-11`); recorded series minimum `8.7%` starting `2025-09` (*see instrumentation note below*)

| Year | Months | Manaus Mean Q ($\text{m}^3/\text{s}$) | Manaus Peak Q ($\text{m}^3/\text{s}$) | Manaus Min Q ($\text{m}^3/\text{s}$) | Amazon MODIS Fires | Mean SMAP (%) | Mean Global Frozen (%) | Mean Polar Ice Idx (%) | Sentinel-1 Scenes | NISAR GCOV Scenes |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **2015** | 12 | 150,001 | 226,485 | 60,551 | 93,658 | 68.7% | 23.3% | 90.5% | 854 | 0 |
| **2016** | 12 | 130,141 | 195,178 | 85,753 | 71,721 | 68.2% | 23.5% | 84.3% | 2,462 | 0 |
| **2017** | 12 | 152,068 | 216,026 | 76,123 | 94,492 | 70.6% | 23.6% | 85.2% | 7,719 | 0 |
| **2018** | 12 | 146,451 | 219,557 | 80,235 | 45,116 | 72.7% | 23.8% | 85.6% | 8,309 | 0 |
| **2019** | 12 | 156,966 | 214,224 | 79,692 | 79,527 | 71.1% | 23.7% | 84.6% | 8,998 | 0 |
| **2020** | 12 | 129,468 | 188,992 | 65,396 | 79,853 | 71.9% | 22.9% | 86.1% | 10,043 | 0 |
| **2021** | 12 | 148,108 | 220,845 | 77,641 | 63,534 | 76.1% | 23.3% | 88.6% | 9,906 | 0 |
| **2022** | 12 | 138,676 | 229,001 | 63,259 | 91,649 | 75.1% | 24.0% | 86.1% | 5,593 | 0 |
| **2023** | 12 | 113,110 | 194,847 | 37,526 | 72,129 | 68.5% | 23.2% | 83.5% | 5,858 | 0 |
| **2024** | 12 | **96,251** | **152,913** | **30,069** | **132,754** | **64.6%** | 23.2% | 84.0% | 5,838 | 0 |
| **2025** | 12 | 147,656 | 225,835 | 77,565 | 41,495 | 74.9% | 23.3% | 58.5%* | 8,921 | **394** |
| **2026** | 12 (11 obs Q) | 138,698 | 217,403 | 54,018 | 79,879 | 73.4% | 22.9% | 8.7%* | 8,666 | **3,704** |

> **Data Continuity Notes:**
> 1. **Sentinel-1 Constellation Gap (2022–2024):** Annual ASF Sentinel-1 acquisitions over Amazonia dropped from `10,043` (`2020`) and `9,906` (`2021`) to `5,593–5,858` during `2022–2024` after the Dec 2021 Sentinel-1B power anomaly, recovering in `2025` (`8,921`) with Sentinel-1C commissioning alongside `394` provisional and `3,704` (`2026`) **NISAR L-band** scenes.
> 2. **GIBS AMSR2 Sea-Ice Feed Transition (`2025-09`..`2026-12`):** From `2025-09` onward, `global_sea_ice_idx` remains flat at `8.7%` because the NASA GIBS `AMSRU2_Sea_Ice_Concentration_12km` WMS feed returned baseline background fill after August 2025 rather than physical global sea-ice loss.
> 3. **2015-01..2015-03 Pre-Launch SMAP Mapping:** Because NASA SMAP science operations began in April 2015, January–March 2015 soil moisture layers use the matching `2016` seasonal baseline while `AMSRU2` polar sea ice uses direct `2015-01..03-15` observations.

### 1.4 Four Global Earth Surface-Change Regimes Observed on the 3D Globe

1. **Equatorial Hydrological Belt & Wetlands (Amazon, Congo, Pantanal):** High-dielectric soil saturation and seasonal river pulses driven by ITCZ migration (`SMAP` indices cycling between `39.7%` drought troughs and `87.7%` wet peaks).
2. **Boreal Freeze/Thaw Breath (Siberia, Canada, Alaska):** Across `144` months, global frozen land fraction oscillates nearly `7x` every year from `6.2%` (`2018-08`) to `42.1%` (`2024-01`), tracking active permafrost thaw and winter frost lockup (`SMAP` L-band radiometer).
3. **Bipolar Cryosphere & Ice-Shelf Fracture (Arctic Ocean & Antarctica):** Winter refreeze vs. summer sea-ice retreat monitored in all-weather microwave darkness (`AMSR2`), punctured by major structural calving events such as Larsen C **Iceberg A-68** (`Jul 2017`) and the `2023-09` Antarctic winter deficit (`-15.15%`).
4. **ENSO & Compound Climate Teleconnections (`2015–2026`):** The dataset captures the complete shift from **2015–16 Extreme El Niño** drought (`2016` Manaus mean Q suppressed to `130,141 m³/s`), through **2020–2022 triple-dip La Niña** floods (`2021-06` Manaus record, `2022-04` peak `229,001 m³/s`, `2022-08` Pakistan Indus flood), into the **2023–2024 Compound El Niño + North Atlantic heat drought** (`2024` Manaus mean Q collapsing to `96,251 m³/s` and MODIS Amazon fires hitting `132,754`).

---

## 2. Amazon Rainforest: 6 Seasonal Phenomena & 12-Month Climatology

### 2.1 Amazon Annual Rhythm Climatology (2015–2026 Mean)

| Month | Mean Discharge ($\text{m}^3/\text{s}$) | ERA5 Precipitation ($\text{mm}$) | Mean MODIS Fire Hotspots | Dominant Seasonal Phase |
| :---: | :---: | :---: | :---: | :--- |
| **Jan** | 135,648.4 | 239.2 | 625 | Rainy Season Onset |
| **Feb** | 153,457.4 | 256.6 | 415 | Deep Rainy Season |
| **Mar** | 175,182.2 | **282.8** | 743 | Peak Basin Rainfall · Madeira Flood Build |
| **Apr** | 197,423.7 | 250.1 | 372 | Peak Southern Tributary Flood |
| **May** | **205,095.9** | 243.5 | 1,243 | Central Amazon / Negro High-Water Crest |
| **Jun** | 190,534.9 | 132.5 | 2,493 | Dry Transition & Flood Recession Begins |
| **Jul** | 152,115.7 | 51.8 | 5,014 | Early Dry Season · Clearing Access |
| **Aug** | 108,496.2 | **41.8** | 20,929 | Clearing Surge & Fire Escalation |
| **Sep** | 77,622.4 | 67.8 | **26,414** | Peak Fire Season & Low River Stage |
| **Oct** | **66,313.3** | 95.7 | 11,864 | Lowest Basin Discharge & Sandbar Exposure |
| **Nov** | 77,507.4 | 140.3 | 6,519 | Late-Dry Fires & Initial Wet Rebound |
| **Dec** | 105,423.6 | 264.9 | 2,384 | ITCZ Return & Wetland Recharge |

> Notice the multi-month hydraulic lag: basin-wide **rainfall peaks in March** (`282.8 mm`), **mainstream discharge crests two months later in May** (`205,095.9 m³/s`), **lowest rainfall occurs in August** (`41.8 mm`), **fires peak in September** (`26,414` detections/month), and **river levels bottom out in October** (`66,313.3 m³/s`).

---

### 2.2 Detailed Breakdown of the 6 Seasonal Phenomena

#### 1. Rainy Season (`rainy_season`)
- **Typical Timing:** `Dec – May` · **Primary Region:** Manaus / Central Negro–Solimões (`manaus`)
- **Primary SAR Physics:** Dielectric Constant increase ($\varepsilon_r \approx 80$ in wet foliage & saturated topsoil) producing higher volumetric microwave attenuation and extensive floodplain water (`VV+VH` water mapping).
- **Verified Layer Evidence & Metrics:**
  - `OPERA L3 DSWx-S1` (`2025-03-06`, `OPERA_L3_DSWx-S1_T20MQB_20250306T093932Z_20250308T161257Z_S1A_30_v1.0`): **`23.46%` open water**, **`2.98%` inundated vegetation**.
  - `Sentinel-1 C-band VV` (`2025-02-10`, `S1A_IW_GRDH_1SDV_20250210T093928_20250210T093953_057832_0721F3_rtc`): `p10 = -17.74 dB`, `median = -6.36 dB`, `p90 = -4.54 dB`.
- **Natural Driver:** Southward migration of the Intertropical Convergence Zone (**ITCZ**) and deep Amazon moisture convergence.
- **Human Driver:** Unpaved logging roads wash out and wetland recharge pauses heavy mechanized clearing across Dec–May.

#### 2. Seasonal Flood (`seasonal_flood`)
- **Typical Timing:** `Peak ~Mar – Jun (Madeira at Porto Velho: ~Mar – Apr)` · **Primary Region:** Porto Velho / Rio Madeira (`porto_velho`) & Manaus NISAR corridor
- **Primary SAR Physics:** Dielectric constant + trunk–water **corner double-bounce** (`VV` and **NISAR L-band** `HHHH` penetrating 24 cm beneath flooded forest canopy).
- **Verified Layer Evidence & Metrics:**
  - `OPERA L3 DSWx-S1` (`2025-04-09`, `OPERA_L3_DSWx-S1_T20LLR_20250409T095727Z_20260406T193636Z_S1A_30_v1.0`): **`10.47%` open water**, **`0.28%` inundated vegetation**.
  - `Sentinel-1 C-band VV` (`2025-03-16`, `S1A_IW_GRDH_1SDV_20250316T095735_20250316T095800_058328_0735FE_rtc`): `p10 = -8.05 dB`, `median = -6.52 dB`, `p90 = -5.84 dB`.
  - `NISAR L-band HHHH` (`2026-06-23`, `NISAR_L2_PR_GCOV_023_140_D_090_4005_DHDH_A_20260623T221633_20260623T221711_P05023_N_F_J_001`): `p10 = -15.01 dB`, `median = -6.59 dB`, `p90 = -0.58 dB`.
- **Natural Driver:** Asynchronous flood timing of southern Andes/Madeira rains (peaking Mar–Apr) vs. northern Rio Negro crest (May–Jun).
- **Human Driver:** Riverine *várzea* agriculture, floating stilt communities, and hydropower dams (Santo Antônio / Jirau near Porto Velho).

#### 3. Dry Season (`dry_season`)
- **Typical Timing:** `Jun/Jul – Oct` · **Primary Region:** Manaus / Central Basin (`manaus`)
- **Primary SAR Physics:** Dielectric constant drop (`VH` desiccation & leaf-flushing backscatter contrast across upper crown twigs).
- **Verified Layer Evidence & Metrics:**
  - `Sentinel-1 C-band VH` (`2022-08-13`, `S1A_IW_GRDH_1SDV_20220813T093934_20220813T093959_044532_05508B_rtc`): `p10 = -23.97 dB`, `median = -13.13 dB`, `p90 = -12.07 dB`.
  - `Sentinel-1 ΔVH` (`2022-08-13`): **`10.08%` canopy change (`> 2 dB`)**, **`2.4%` severe loss (`> 4 dB`)**.
- **Natural Driver:** Seasonal northward ITCZ shift (Jun–Oct), amplified strongly during El Niño & warm Tropical North Atlantic phases.
- **Human Driver:** Dry-season soil firming enables heavy machinery access along frontier roads (`BR-230`, `BR-319`).

#### 4. Clearing / Land Opening (`clearing_land_opening`)
- **Typical Timing:** `Mostly Jun – Oct` · **Primary Region:** Apuí–Lábrea Deforestation Arc (`apui_labrea`)
- **Primary SAR Physics:** Volume roughness collapse (`3D` rainforest canopy volume scatterers felled into flat bare soil/pasture -> persistent `ΔVH` drop and `OPERA DIST-ALERT` structural disturbance).
- **Verified Layer Evidence & Metrics:**
  - `Sentinel-1 ΔVH` (`2024-10-13`, `S1A_IW_GRDH_1SDV_20241013T094050_20241013T094115_056082_06DC84_rtc`): **`1.75%` canopy loss (`> 2 dB`)**, **`0.06%` severe clearing (`> 4 dB`)**.
  - `OPERA L3 DIST-ALERT-S1` (`2026-02-24`, `OPERA_L3_DIST-ALERT-S1_T20MRS_20260224T093234Z_20260715T101215Z_S1A_30_v1.0`): **`11.71%` disturbed pixels**, **`5.17%` high-confidence disturbance**.
  - `NISAR L-band SHSH` (`2026-10-21`, `NISAR_L2_PR_GCOV_033_140_D_092_2005_SHSH_A_20261021T221736_20261021T221811_P05036_N_F_J_001`): Provisional/CalVal swath (`qa_status: WARN`).
- **Natural Driver:** Drier Jun–Oct terrain permits bulldozers and chainsaws to enter upland *terra firme*.
- **Human Driver:** Cattle pasture conversion and speculative land grabbing along `BR-230` Trans-Amazonian & `BR-319` highways.

#### 5. Fire Season (`fire_season`)
- **Typical Timing:** `Aug – Oct (peak ~Sep)` · **Primary Region:** Apuí–Lábrea (`apui_labrea`)
- **Primary SAR Physics:** Smoke-penetrating burn-scar roughness shift (`ΔVH` maps geometric crown mortality cleanly underneath thick pyrocumulus smoke that blinds optical sensors, fused with **MODIS C6.1** thermal detections).
- **Verified Layer Evidence & Metrics:**
  - `MODIS C6.1 Brazil 2024` (`2024-08-01..2024-10-31`, `MODIS_C61_Brazil_2024`): **`5,144` high-confidence thermal fire detections** in the Apuí–Lábrea window (within `132,754` MODIS Amazon hotspots in `2024`).
  - `Sentinel-1 ΔVH` (`2024-10-13`, `S1A_IW_GRDH_1SDV_20241013T094050_20241013T094115_056082_06DC84_rtc`): **`4.22%` canopy loss (`> 2 dB`)**, **`0.13%` severe clearing/scorch (`> 4 dB`)**.
- **Natural Driver:** Late-dry vapor pressure deficit (`VPD`) spike and drought-desiccated litter turn escaped agricultural fires into megafires.
- **Human Driver:** Broadcast ignition of Jun–Aug felled slash to clear pastures and release soil ash nutrients.

#### 6. Low River Levels (`low_river_levels`)
- **Typical Timing:** `Aug – Oct (lowest ~Sep/Oct)` · **Primary Region:** Porto Velho / Rio Madeira (`porto_velho`)
- **Primary SAR Physics:** Roughness inversion — smooth mirror water (`VV ≤ -17 dB`) retreats to reveal rippled sandbars, rocky shoals, and cracked mudflats whose millimeter–decimeter roughness spikes radar backscatter (`ΔVV ≥ +2 dB`).
- **Verified Layer Evidence & Metrics:**
  - `Sentinel-1 ΔVV` (`2024-09-05`, `S1A_IW_GRDH_1SDV_20240905T095741_20240905T095806_055528_06C69B_rtc`): **`0.47%` exposed sandbars**, **`0.25%` receded shoals**.
  - `OPERA L3 DSWx-S1` (`2024-10-11`, `OPERA_L3_DSWx-S1_T20LLR_20241011T095735Z_20241011T170138Z_S1A_30_v1.0`): Open water compressed to **`5.79%`**, **`2.13%` inundated vegetation**.
- **Natural Driver:** Seasonal baseflow recession peaking Sep–Oct, pushed to historic lows by 2023/2024 warm-Atlantic/El Niño droughts.
- **Human Driver:** Stranded river supply barges, drinking-water shortages, and hydropower generation cuts along Rio Madeira.

---

## 3. Master Catalog of 15 Signature Crisis Case Studies (2015–2026)

| # | Event ID | Scope | Month | Crisis Name | Location (`lon, lat`) | Verified Headline SAR Signal |
| :---: | :--- | :---: | :---: | :--- | :---: | :--- |
| 1 | `el_nino_drought_2015` | Amazon | `2015-11` | **2015–16 El Niño Mega-Drought Baseline** | `-60.03, -3.15` | `15.48%` exposed channel bars (`ΔVV ≥ +2 dB`) |
| 2 | `larsen_c_a68_2017` | Global | `2017-07` | **Larsen C Giant Iceberg A-68 Calving** | `-60.70, -67.70` | `13.94%` open rift lead (`~200 km` iceberg, `HH`) |
| 3 | `amazon_fire_surge_2019` | Amazon | `2019-08` | **Aug 2019 BR-163 Clearing & Fire Surge** | `-55.38, -7.08` | `23.47%` clear-cut loss + `29.79%` thinning (`ΔVH`) |
| 4 | `aus_fires_2020` | Global | `2020-01` | **Australia Black Summer Burn Scars** | `150.00, -36.20` | `8.1%` severe crown scorch + `8.0%` thinning (`ΔVH`) |
| 5 | `mauritius_spill_2020` | Global | `2020-08` | **Mauritius Wakashio Oil Slick Damping** | `57.72, -20.39` | `5.08%` heavy slick + `9.83%` Bragg-damped sheen (`ΔVV`) |
| 6 | `manaus_flood_2021` | Amazon | `2021-06` | **Record Rio Negro Flood (Manaus)** | `-60.03, -3.15` | `30.02 m` crest · `22.44%` open water (`+4.34%` new) |
| 7 | `lapalma_volcano_2021` | Global | `2021-10` | **La Palma Cumbre Vieja Lava & Deformation** | `-17.88, 28.61` | `+2.18%` rough aa-lava advance (`ΔVH`) + `14.3%` smooth tephra |
| 8 | `pakistan_flood_2022` | Global | `2022-08` | **Pakistan Indus Inland Sea Flood** | `67.95, 26.60` | `+14.0%` newly inundated plain through monsoon clouds |
| 9 | `turkiye_insar_2023` | Global | `2023-02` | **Türkiye–Syria Fault Slip & Urban Damage** | `37.00, 37.50` | `4.2 m` coseismic fault offset & `28.44%` `\|ΔVV\|` disruption |
| 10 | `canada_boreal_2023` | Global | `2023-07` | **Canada Boreal Permafrost & Taiga Megafires** | `-75.70, 53.40` | `3.67%` severe boreal crown burn + `15.37%` moderate scorch |
| 11 | `antarctic_sea_ice_2023` | Global | `2023-09` | **Antarctic Winter Sea-Ice Record Deficit** | `20.00, -62.50` | `15.15%` missing marginal pack ice vs. 2020 winter max |
| 12 | `severe_drought_2023` | Amazon | `2023-10` | **Severe Drought (Lake Tefé / Solimões)** | `-64.70, -3.33` | `-13.45%` water area contracted into bright mudflats |
| 13 | `brazil_rs_flood_2024` | Global | `2024-05` | **Porto Alegre & Guaíba Catastrophic Flood** | `-51.25, -30.01` | `+14.3%` submerged delta + `8.18%` urban double-bounce |
| 14 | `drought_fires_2024` | Amazon | `2024-09` | **Record Drought & Megafires (Apuí–Lábrea)** | `-59.75, -7.25` | `4.22%` `ΔVH ≤ -2 dB` scars · `5,144` local high-conf fires |
| 15 | `nisar_lband_2026` | Amazon | `2026-10` | **NASA-ISRO NISAR L-Band Validated Passes** | `-60.03, -3.15` | `HHHH -6.6 dB` vs `HVHV -11.61 dB` (`+5.01 dB` pol gap) |

---

### 3.1 Amazon Crisis Case Studies (`6` Events)

1. **`el_nino_drought_2015` — 2015–16 El Niño Mega-Drought Baseline (`2015-11`, Nov 2015 – Jan 2016)**
   - **Coordinates:** Center `[-60.025, -3.15]`, BBox `[-60.35, -3.35, -59.7, -2.95]` (Manaus confluence)
   - **Granules & Stats:** `Sentinel-1 C-band ΔVV` & `VV` (`2016-01-17`, `S1A_IW_GRDH_1SDV_20160117T093855_20160117T093920_009532_00DD8F_rtc`) -> **`15.48%` exposed mudflat/sandbar** (`ΔVV ≥ +2 dB`), **`1.76%` desiccation drop**; `VV`: `p10 = -18.15 dB`, `median = -7.05 dB`, `p90 = -6.12 dB`.
   - **Physics & Drivers:** Rough exposed alluvium reflects strongly back to radar (`+ΔVV`). Driven naturally by the 2015–2016 Super El Niño suppressing central Amazon convection, compounded by dry-season fire escapes along Tapajós and Solimões corridors.

2. **`amazon_fire_surge_2019` — Aug 2019 BR-163 Clearing & Fire Surge (`2019-08`)**
   - **Coordinates:** Center `[-55.38, -7.08]`, BBox `[-55.65, -7.35, -55.1, -6.8]` (Novo Progresso / BR-163, Pará)
   - **Granules & Stats:** `Sentinel-1 C-band ΔVH` & `VH` (`2019-08-26`, `S1A_IW_GRDH_1SDV_20190826T091535_20190826T091600_028738_034106_rtc`) -> **`23.47%` clear-cut volume drop** (`ΔVH ≤ -2.2 dB`), **`29.79%` canopy edge thinning**; `VH`: `p10 = -15.89 dB`, `median = -13.52 dB`, `p90 = -12.66 dB`.
   - **Physics & Drivers:** C-band penetrates the massive smoke plume that darkened São Paulo on 19 Aug 2019 to capture geometric loss of 3D canopy depolarization. Driven by coordinated land-grabbing pasture burns along BR-163 during peak dry-season sunshine.

3. **`manaus_flood_2021` — Record Rio Negro Flood at Manaus (`2021-06`)**
   - **Coordinates:** Center `[-60.025, -3.15]`, BBox `[-60.35, -3.35, -59.7, -2.95]` (`4` layers comparing Oct 2020 low-water baseline vs. Jun 2021 flood crest)
   - **Granules & Stats:** `Sentinel-1 C-band` (`2021-06-19`, `S1A_IW_GRDH_1SDV_20210619T093925_20210619T093950_038407_04883E_rtc` vs. baseline `2020-10-10`, `S1A_IW_GRDH_1SDV_20201010T093924_20201010T093949_034732_040BDF_rtc`) -> `30.02 m` 119-year record crest, **`22.44%` open water**, **`0.99%` flooded *igapó* forest**, **`+4.34%` newly inundated water** (`VV`: `p10 = -18.65 dB`, `median = -6.63 dB`, `p90 = -5.51 dB`).
   - **Physics & Drivers:** Dielectric flood specular dark channels paired with bright sub-canopy double-bounce. Driven by La Niña convective rainstorms flooding Rio Negro & Solimões simultaneously, submerging Manaus waterfronts and Iranduba neighborhoods.

4. **`severe_drought_2023` — Severe Drought at Lake Tefé (`2023-10`, Sep – Nov 2023)**
   - **Coordinates:** Center `[-64.7, -3.325]`, BBox `[-64.85, -3.45, -64.55, -3.2]` (`3` layers: May 2023 high-water vs. Oct 2023 contraction)
   - **Granules & Stats:** `Sentinel-1 C-band` (`2023-10-22`, `S1A_IW_GRDH_1SDV_20231022T100428_20231022T100453_050876_0621D8_rtc` vs. `2023-05-19`, `S1A_IW_GRDH_1SDV_20230519T100421_20230519T100446_048601_05D86E_rtc`) -> Manaus fell to `12.70 m`, Lake Tefé hit `39.1 °C`, and open water shrank by **`-13.45%`** (`VV` `p10` rose from `-19.19 dB` to `-14.87 dB` as mirror water vanished into rough mudflats).
   - **Physics & Drivers:** Specular-to-rough surface inversion under compound 2023 El Niño + record Tropical North Atlantic warmth, stranding river towns and causing mass river dolphin mortality in shallowed Lake Tefé.

5. **`drought_fires_2024` — Record Drought & Fires in Apuí–Lábrea (`2024-09`, Aug – Oct 2024)**
   - **Coordinates:** Center `[-59.75, -7.25]`, BBox `[-60.5, -8.5, -58.5, -6.5]` (`4` layers fusing MODIS thermal detections & Jul–Oct S1 ΔVH)
   - **Granules & Stats:** `Sentinel-1 ΔVH` (`2024-10-13`, `S1A_IW_GRDH_1SDV_20241013T094050_20241013T094115_056082_06DC84_rtc` vs. `2024-07-09`, `S1A_IW_GRDH_1SDV_20240709T094049_20240709T094114_054682_06A842_rtc`) + `MODIS_C61_Brazil_2024` -> **`4.22%` canopy loss (`ΔVH ≤ -2 dB`)**, **`0.13%` severe loss**, **`5,144` local high-confidence fire detections**, coinciding with Manaus's lowest stage (`12.11 m`) and lowest observed 12-year discharge (`30,069.2 m³/s`, `2024-10`).
   - **Physics & Drivers:** Multi-year 2023–2024 soil moisture deficit (`39.7%` Nov 2023 trough; `64.6%` 2024 annual mean) combined with escaped pasture clearing along BR-230.

6. **`nisar_lband_2026` — NASA-ISRO NISAR L-Band Validated Passes (`2026-10`, Oct – Nov 2026 vs. Jun 2026)**
   - **Coordinates:** Center `[-60.025, -3.15]`, BBox `[-60.35, -3.35, -59.7, -2.95]` (`6` multi-sensor layers)
   - **Granules & Stats:** `NISAR L2 PR GCOV` (`2026-10-21`, `NISAR_L2_PR_GCOV_033_140_D_090_4005_DHDH_A_20261021T221629_20261021T221704_P05036_N_F_J_001` & `2026-11-02`, `NISAR_L2_PR_GCOV_034_140_D_090_4005_DHDH_A_20261102T221630_20261102T221704_P05036_N_F_J_001` vs. Jun 23 provisional flood pass) + `OPERA DSWx-S1` (`2026-11-03`, `OPERA_L3_DSWx-S1_T20MQB_20261103T093832Z_20261104T040557Z_S1D_30_v1.0`) -> **`HHHH` median `-6.6 dB` (`p90 = +0.22 dB`) vs. `HVHV` median `-11.61 dB`** (`+5.01 dB` co/cross-pol separation); `ΔHHHH` Jun→Oct captures **`13.06%` flooded double-bounce drop** as floodwaters receded and **`13.66%` exposed bank roughness rise**; OPERA confirms **`20.11%` open water** & **`3.79%` inundated vegetation**.
   - **Physics & Drivers:** Direct operational **24 cm L-band** sub-canopy penetration across repeat 12-day NISAR orbits.

---

### 3.2 Global Earth Crisis Case Studies (`9` Events)

1. **`larsen_c_a68_2017` — Larsen C Giant Iceberg A-68 Calving (`2017-07`)**
   - **Location:** `[-60.7, -67.7]`, BBox `[-61.8, -68.4, -59.6, -67.0]` (Antarctic Peninsula)
   - **Sensor / Granule:** `Sentinel-1B C-band HH` (`2017-07-15`, `S1B_IW_GRDH_1SSH_20170715T073708_20170715T073737_006495_00B6C1_rtc`)
   - **Stats:** **`13.94%` dark open rift lead** between shelf and A-68 (`~5,800 km²`, `~200 km` long), **`4.48%` calving fracture shift**; `HH`: `p10 = -7.48 dB`, `median = -5.03 dB`, `p90 = +0.23 dB`. Imaged cleanly in **Antarctic winter polar darkness** where optical satellites are completely blind.

2. **`aus_fires_2020` — Australia "Black Summer" Burn Scars (`2020-01`)**
   - **Location:** `[150.0, -36.2]`, BBox `[149.7, -36.5, 150.3, -35.9]` (New South Wales eucalyptus belt)
   - **Sensor / Granule:** `Sentinel-1A ΔVH` (`2020-01-05`, `S1A_IW_GRDH_1SDV_20200105T191615_20200105T191640_030669_0383E0_rtc`)
   - **Stats:** **`8.1%` severe crown scorch** + **`8.0%` moderate understory burn** (`VH`: `p10 = -23.37 dB`, `median = -15.66 dB`, `p90 = -13.63 dB`). Driven by a record positive Indian Ocean Dipole (`IOD`) and prolonged extreme heatwaves.

3. **`mauritius_spill_2020` — Mauritius *MV Wakashio* Oil Spill (`2020-08`)**
   - **Location:** `[57.72, -20.39]`, BBox `[57.62, -20.48, 57.82, -20.3]` (Pointe d'Esny reef lagoon, Mauritius)
   - **Sensor / Granule:** `Sentinel-1B ΔVV / VV` (`2020-08-10`, `S1B_IW_GRDH_1SDV_20200810T013755_20200810T013820_022854_02B625_rtc`)
   - **Stats:** **`5.08%` heavy viscous oil slick** (`VV ≤ -17 dB`) + **`9.83%` Bragg-damped thin sheen** (`VV`: `p10 = -15.65 dB`, `median = -8.65 dB`, `p90 = -6.34 dB`). Oil viscosity suppresses millimeter-scale capillary wind waves (`Bragg resonance`), turning bright windy seawater dark in day/night C-band passes.

4. **`lapalma_volcano_2021` — La Palma *Cumbre Vieja* Lava & Ash (`2021-10`)**
   - **Location:** `[-17.88, 28.61]`, BBox `[-17.96, 28.54, -17.8, 28.68]` (Canary Islands)
   - **Sensor / Granule:** `Sentinel-1A ΔVH / VH` (`2021-11-01`, `S1A_IW_GRDH_1SDV_20211101T191350_20211101T191420_040382_04C94F_rtc`)
   - **Stats:** **`+2.18%` rough *aa*-lava flow delta** (`+ΔVH ≥ +1.25 dB`) advancing into Los Llanos / ocean, surrounded by **`14.3%` smooth volcanic tephra blanketing** (`VH`: `p10 = -23.29 dB`, `median = -15.64 dB`, `p90 = -12.76 dB`). Radar penetrates opaque sulfur/ash clouds directly above the erupting fissure.

5. **`pakistan_flood_2022` — Pakistan Indus "Inland Sea" Flood (`2022-08`)**
   - **Location:** `[67.95, 26.6]`, BBox `[67.55, 26.25, 68.35, 26.95]` (Sindh / Lake Manchar corridor)
   - **Sensor / Granule:** `Sentinel-1A ΔVV / VV` (`2022-08-30`, `S1A_IW_GRDH_1SDV_20220830T012551_20220830T012616_044775_0558C6_rtc`)
   - **Stats:** **`+14.0%` newly inundated Indus basin cropland and towns** (`0.32%` permanent water; `VV`: `p10 = -16.5 dB`, `median = -8.57 dB`, `p90 = -6.45 dB`), mapped directly through unbroken monsoon cloud cover.

6. **`turkiye_insar_2023` — Türkiye–Syria Fault Rupture & Urban Damage (`2023-02`)**
   - **Location:** `[37.0, 37.5]`, BBox `[36.7, 37.25, 37.3, 37.75]` (East Anatolian Fault / Kahramanmaraş)
   - **Sensor / Granule:** `Sentinel-1A InSAR & Intensity` (`2023-02-09`, `S1A_IW_GRDH_1SDV_20230209T153423_20230209T153448_047161_05A88A_rtc`, 3 days after `Mw 7.8` & `Mw 7.5` quakes)
   - **Stats:** **`4.2 m` coseismic left-lateral slip** and **`28.44%` urban amplitude/corner-reflector disruption** (`|ΔVV| ≥ 2.2 dB`; `VV`: `p10 = -11.65 dB`, `median = -9.66 dB`, `p90 = -8.37 dB`). Demonstrates centimeter-scale InSAR phase displacement and building collapse detection.

7. **`canada_boreal_2023` — Canada Boreal Taiga Megafires (`2023-07`)**
   - **Location:** `[-75.7, 53.4]`, BBox `[-76.2, 53.05, -75.2, 53.75]` (James Bay / Northern Quebec)
   - **Sensor / Granule:** `Sentinel-1A ΔVH / VH` (`2023-07-16`, `S1A_IW_GRDH_1SDV_20230716T225452_20230716T225517_049455_05F26A_rtc`)
   - **Stats:** **`3.67%` severe black-spruce crown loss** (`ΔVH ≤ -3.2 dB`) + **`15.37%` moderate burn thinning** (`VH`: `p10 = -22.96 dB`, `median = -14.87 dB`, `p90 = -13.71 dB`), mapped beneath continental smoke plumes fed by Arctic-amplified peat drying.

8. **`antarctic_sea_ice_2023` — Antarctic Winter Sea-Ice Record Deficit (`2023-09`)**
   - **Location:** `[20.0, -62.5]`, BBox `[5.0, -70.0, 35.0, -55.0]` (Haakon VII / Weddell marginal ice belt)
   - **Sensor / Granule:** `JAXA AMSR2 / SAR Equivalent` (`AMSRU2_20230915_vs_20200915` & `AMSRU2_Sea_Ice_20230915`)
   - **Stats:** **`15.15%` missing marginal pack ice** relative to September 2020 winter max (**`74.67%` retained pack ice** across the sector), capturing the $6\sigma$ 2023 Southern Ocean winter refreeze collapse.

9. **`brazil_rs_flood_2024` — Porto Alegre & Guaíba Catastrophic Flood (`2024-05`)**
   - **Location:** `[-51.25, -30.01]`, BBox `[-51.45, -30.18, -51.05, -29.85]` (Rio Grande do Sul, southern Brazil)
   - **Sensor / Granule:** `Sentinel-1A ΔVV / VV` (`2024-05-11`, `S1A_IW_GRDH_1SDV_20240511T084943_20240511T085008_053821_068A6E_rtc`)
   - **Stats:** **`+14.3%` submerged airport/delta plains** (`-ΔVV` specular drop) paired with **`+8.18%` urban double-bounce brightening** (`+ΔVV` trunk/building corner reflections; `VV` `p90 = -3.13 dB`, `median = -7.33 dB`, `p10 = -18.64 dB`), directly demonstrating flood physics duality within one city.

---

## 4. Interactive Exploration Guide (`SARs-Unlimited` Electron App)

- **144-Month Dual-Scope Scrubber (`2015–2026`):** Toggle **`Planet Live`** (global SMAP soil moisture, boreal freeze/thaw, and polar AMSR2 sea ice) vs. **`Amazon Live`** (basin-wide hydrology and fire pulses), backed by a real-time **SVG waveform sparkline** showing `2015–2026` planetary ice/freeze or Amazon discharge/fire waves.
- **8-Stop Guided Tour:** Click **`Guided Tour`** in the top dock to automatically fly from the `2015–16` El Niño drought baseline to `2017` Larsen C calving, `2021` Manaus flood & La Palma lava, `2022` Pakistan flood, `2023` Türkiye InSAR fault slip, `2024` Amazon megafires, and `2026` NASA-ISRO **NISAR** L-band passes.
- **Interactive SAR Lab (Inside Story Card):**
  - **Split-Screen Swipe Comparator:** Drag horizontally over any crisis or phenomenon preview to wipe dynamically between `Before ⟷ After` or **`C-band ⟷ NISAR L-band`**.
  - **Live Radar `dB` & Scattering Probe:** Hover anywhere on the preview image to read pixel backscatter intensity (`dB`) and surface regime (Specular Water/Oil Mirror, Dry Bare Soil, 3D Canopy Volume Scattering, Urban/Flooded Forest Double-Bounce, Active Burn/Hotspot).
  - **C/S/L-Band Canopy Diagram:** Inspect `5.6 cm`, `12 cm`, and `24 cm` microwave penetration depth directly alongside each phenomenon's backscatter histogram and natural/human drivers.
