# Data Sources & Scientific References — SARs Unlimited

Complete provenance, satellite archives, exact granule IDs, hydrological/climate datasets, agency reports, and 3D globe basemap endpoints used by **SARs Unlimited** (`data/amazon_sar_2020_2026.json`, schema `2.0.0`, and `GlobeViewer.tsx`).

---

## 1. Primary Satellite SAR & Earth Observation Archives

| Source ID | Dataset / Product | Publisher / DAAC | URL |
|---|---|---|---|
| `nisar_gcov_v1` | **NASA–ISRO NISAR Level-2 Geocoded Polarimetric Covariance (`NISAR_L2_GCOV_V1` & `PROVISIONAL`)** — L-band (24 cm, 1.257 GHz) HHHH / HVHV RTC $\gamma^0$ & public browse imagery | NASA Earthdata Cloud / ASF DAAC | https://asf.alaska.edu/nisar/ |
| `pc_s1_rtc` | **Copernicus Sentinel-1 Radiometrically Terrain-Corrected (RTC) $\gamma^0$ C-Band SAR** — C-band (5.6 cm, 5.405 GHz) VV/VH/HH 10 m Cloud-Optimized GeoTIFFs | ESA Copernicus / ASF / Microsoft Planetary Computer | https://planetarycomputer.microsoft.com/dataset/sentinel-1-rtc |
| `opera_dswx_s1` | **NASA JPL OPERA L3 Dynamic Surface Water Extent from Sentinel-1 (`OPERA_L3_DSWx-S1_V1`)** — 30 m water classification (Open Water, Partial Surface Water, Inundated Vegetation) | NASA JPL OPERA / Earthdata Cloud / PO.DAAC & ASF | https://www.jpl.nasa.gov/go/opera |
| `opera_dist_alert_s1` | **NASA JPL OPERA L3 Surface Disturbance Alert from Sentinel-1 (`OPERA_L3_DIST-ALERT-S1_V1`)** — 30 m all-weather radar vegetation disturbance alerts | NASA JPL OPERA / Earthdata Cloud / LP DAAC | https://www.jpl.nasa.gov/go/opera |
| `pc_alos_palsar` | **JAXA ALOS-2 PALSAR-2 Global L-Band SAR Mosaic (HH/HV)** — 25 m annual L-band polarimetric mosaic | JAXA EORC / Microsoft Planetary Computer | https://planetarycomputer.microsoft.com/dataset/alos-palsar-mosaic |
| `smap_l4` | **NASA SMAP Level-4 Analyzed Surface Soil Moisture** — 2020–2026 Monthly L-Band (1.41 GHz) radiometer/radar-assimilated soil moisture | NASA GIBS / NSIDC DAAC | https://smap.jpl.nasa.gov/ |
| `smap_ft` | **NASA SMAP L3 Radiometer Global Daily Freeze/Thaw State** — 2020–2026 boreal/polar dielectric freeze-thaw transitions | NASA GIBS / NSIDC DAAC | https://smap.jpl.nasa.gov/ |
| `amsru2_ice` | **JAXA GCOM-W1 AMSR2 Sea Ice Concentration (12 km)** — 18–89 GHz passive microwave polar cryosphere time series | NASA GIBS / JAXA | https://earthdata.nasa.gov/ |
| `firms_modis` | **NASA FIRMS MODIS Collection 6.1 Active Fire & Thermal Anomalies** — Vegetation fire detections (confidence $\ge 80$) | NASA LANCE / FIRMS | https://firms.modaps.eosdis.nasa.gov/download/ |
| `glofas_era5` | **Copernicus CEMS GloFAS v4 River Discharge & ECMWF ERA5 Reanalysis Precipitation** — Daily/monthly river discharge ($\text{m}^3/\text{s}$) and rainfall ($\text{mm}$) | ECMWF / Copernicus EMS / Open-Meteo | https://open-meteo.com/ |
| `asf_search_api` | **ASF Search API & Vertex Catalogue** — Monthly Sentinel-1 (`GRD_HD`) and NISAR (`GCOV`) acquisition metadata | Alaska Satellite Facility (ASF) DAAC | https://api.daac.asf.alaska.edu/services/search/param |
| `space_apps_2026` | **2026 NASA Space Apps Challenge — Dancing with the SARs** | NASA Science Mission Directorate | https://www.spaceappschallenge.org/2026/challenges/dancing-with-the-sars/ |

---

## 2. Exact Satellite Granules Used per Event & Phenomenon

### 2.1 Amazon & Global Crisis Events (`events[]`)

| Event | Date(s) | Sensor / Product | Exact Granule ID(s) |
|---|---|---|---|
| **2015–16 El Niño Mega-Drought (Manaus)** | `2016-01-17` (vs `2017-05-11`) | Sentinel-1A RTC (C-band VV) | `S1A_IW_GRDH_1SDV_20160117T093855_20160117T093920_009532_00DD8F_rtc` |
| **Larsen C Giant Iceberg A-68 Calving** | `2017-07-15` | Sentinel-1B RTC (C-band HH) | `S1B_IW_GRDH_1SSH_20170715T073708_20170715T073737_006495_00B6C1_rtc` |
| **Aug 2019 BR-163 Clearing & Fire Surge** | `2019-08-26` | Sentinel-1A RTC (C-band VH) | `S1A_IW_GRDH_1SDV_20190826T091535_20190826T091600_028738_034106_rtc` |
| **Australia Black Summer Burn Scars** | `2020-01-05` | Sentinel-1A RTC (C-band VH) | `S1A_IW_GRDH_1SDV_20200105T191615_20200105T191640_030669_0383E0_rtc` |
| **Mauritius MV Wakashio Oil Slick** | `2020-08-10` | Sentinel-1B RTC (C-band VV) | `S1B_IW_GRDH_1SDV_20200810T013755_20200810T013820_022854_02B625_rtc` |
| **Record Rio Negro Flood (Manaus)** | `2021-06-19` (vs `2020-10-10` & `2021-10-29`) | Sentinel-1A RTC (C-band VV/VH) | `S1A_IW_GRDH_1SDV_20210619T093925_20210619T093950_038407_04883E_rtc`<br>`S1A_IW_GRDH_1SDV_20201010T093924_20201010T093949_034732_040BDF_rtc` |
| **La Palma Cumbre Vieja Eruption** | `2021-11-01` | Sentinel-1A RTC (C-band VH) | `S1A_IW_GRDH_1SDV_20211101T191350_20211101T191420_040382_04C94F_rtc` |
| **Pakistan Indus Inland Sea Flood** | `2022-08-30` | Sentinel-1A RTC (C-band VV) | `S1A_IW_GRDH_1SDV_20220830T012551_20220830T012616_044775_0558C6_rtc` |
| **Türkiye–Syria Fault Slip & Damage** | `2023-02-09` | Sentinel-1A RTC (C-band VV / InSAR) | `S1A_IW_GRDH_1SDV_20230209T153423_20230209T153448_047161_05A88A_rtc` |
| **Canada Boreal Megafires (Quebec)** | `2023-07-16` | Sentinel-1A RTC (C-band VH) | `S1A_IW_GRDH_1SDV_20230716T225452_20230716T225517_049455_05F26A_rtc` |
| **Antarctic Winter Sea-Ice Deficit** | `2023-09-15` (vs `2020-09-15`) | JAXA GCOM-W1 AMSR2 (NASA GIBS) | `AMSRU2_Sea_Ice_20230915`<br>`AMSRU2_20230915_vs_20200915` |
| **Severe 2023 Amazon Drought (Tefé & Manaus)** | `2023-10-22` (vs `2023-05-19`) | Sentinel-1A RTC (C-band VV/VH) | `S1A_IW_GRDH_1SDV_20231022T100428_20231022T100453_050876_0621D8_rtc`<br>`S1A_IW_GRDH_1SDV_20230519T100421_20230519T100446_048601_05D86E_rtc` |
| **Porto Alegre & Guaíba Flood (Brazil RS)** | `2024-05-11` | Sentinel-1A RTC (C-band VV) | `S1A_IW_GRDH_1SDV_20240511T084943_20240511T085008_053821_068A6E_rtc` |
| **Record 2024 Drought & Fires (Apuí–Lábrea & Manaus)** | `2024-10-13` (vs `2024-07-09`) | Sentinel-1A RTC + NASA FIRMS MODIS | `S1A_IW_GRDH_1SDV_20241013T094050_20241013T094115_056082_06DC84_rtc`<br>`S1A_IW_GRDH_1SDV_20240709T094049_20240709T094114_054682_06A842_rtc`<br>`MODIS_C61_Brazil_2024` |
| **NISAR L-Band Acquisitions (Manaus)** | `2026-10-21` & `2026-11-02` | NASA–ISRO NISAR L2 GCOV (CRID `P05036`) + OPERA DSWx-S1 | `NISAR_L2_PR_GCOV_033_140_D_090_4005_DHDH_A_20261021T221629_20261021T221704_P05036_N_F_J_001`<br>`NISAR_L2_PR_GCOV_034_140_D_090_4005_DHDH_A_20261102T221630_20261102T221704_P05036_N_F_J_001`<br>`OPERA_L3_DSWx-S1_T20MQB_20261103T093832Z_20261104T040557Z_S1D_30_v1.0` |

### 2.2 Amazon Seasonal Phenomena (`phenomena[]`)

| Phenomenon | Date | Sensor / Product | Exact Granule ID(s) |
|---|---|---|---|
| **Rainy Season** | `2025-03-06` / `2025-02-10` | OPERA DSWx-S1 & Sentinel-1A RTC | `OPERA_L3_DSWx-S1_T20MQB_20250306T093932Z_20250308T161257Z_S1A_30_v1.0`<br>`S1A_IW_GRDH_1SDV_20250210T093928_20250210T093953_057832_0721F3_rtc` |
| **Seasonal Flood** | `2025-04-09` / `2025-03-16` / `2026-06-23` | OPERA DSWx-S1, Sentinel-1A RTC, NISAR L2 GCOV | `OPERA_L3_DSWx-S1_T20LLR_20250409T095727Z_20260406T193636Z_S1A_30_v1.0`<br>`S1A_IW_GRDH_1SDV_20250316T095735_20250316T095800_058328_0735FE_rtc`<br>`NISAR_L2_PR_GCOV_023_140_D_090_4005_DHDH_A_20260623T221633_20260623T221711_P05023_N_F_J_001` |
| **Dry Season** | `2022-08-13` | Sentinel-1A RTC (C-band VH) | `S1A_IW_GRDH_1SDV_20220813T093934_20220813T093959_044532_05508B_rtc` |
| **Clearing / Land Opening** | `2024-10-13` / `2026-02-24` / `2026-10-21` | Sentinel-1A RTC, OPERA DIST-ALERT-S1, NISAR L2 GCOV | `S1A_IW_GRDH_1SDV_20241013T094050_20241013T094115_056082_06DC84_rtc`<br>`OPERA_L3_DIST-ALERT-S1_T20MRS_20260224T093234Z_20260715T101215Z_S1A_30_v1.0`<br>`NISAR_L2_PR_GCOV_033_140_D_092_2005_SHSH_A_20261021T221736_20261021T221811_P05036_N_F_J_001` |
| **Fire Season** | `2024-08..10` / `2024-10-13` | NASA FIRMS MODIS C6.1 & Sentinel-1A RTC | `MODIS_C61_Brazil_2024`<br>`S1A_IW_GRDH_1SDV_20241013T094050_20241013T094115_056082_06DC84_rtc` |
| **Low River Levels** | `2024-09-05` / `2024-10-11` | Sentinel-1A RTC & OPERA DSWx-S1 | `S1A_IW_GRDH_1SDV_20240905T095741_20240905T095806_055528_06C69B_rtc`<br>`OPERA_L3_DSWx-S1_T20LLR_20241011T095735Z_20241011T170138Z_S1A_30_v1.0` |

---

## 3. Hydrological, Meteorological & Ground-Truth Agency Citations

- **Serviço Geológico do Brasil (SGB/CPRM)** — *Boletim de Monitoramento Hidrológico da Bacia do Amazonas* & *Nível do Rio Negro em Manaus (AM) é o menor em 122 anos de monitoramento* (`12.11 m` record low on 9 Oct 2024; `30.02 m` record crest on 16 Jun 2021):
  - https://www.sgb.gov.br/sace/boletins/Amazonas/20241203_17-20241203%20-%20173204.pdf
  - https://sgb.gov.br/sala-de-imprensa/-/asset_publisher/ujyx/content/nivel-do-rio-negro-em-manaus-am-e-o-menor-em-122-anos-de-monitoramento-
- **Agência Nacional de Águas e Saneamento Básico (ANA) / ABRHidro** — *2023 Rio Negro Drought Hydrological Analysis* (`12.70 m` minimum stage on 26 Oct 2023):
  - https://anais.abrhidro.org.br/job.php?Job=16725
- **Instituto Nacional de Pesquisas Espaciais (INPE — Programa Queimadas)** — *2024 Amazon Biome Active Fire Hotspots Official Bulletin* (`140,328` hotspots in 2024, +42% vs. 2023):
  - http://md-m09c.sid.inpe.br/col/sid.inpe.br/md-m09c/2025/01.21.14.03/doc/Brasil%20registrou%202783%20mil%20focos%20de%20inc%c3%aandio%20em%202024%20diz%20Inpe%20PDF.pdf
- **Universidade do Estado do Amazonas (UEA)** — *Amazon Rainfall Seasonality & Manaus 2021 Flood Analysis*:
  - https://pos.uea.edu.br/data/area/dissertacao/download/61-32.pdf
  - https://ri.uea.edu.br/server/api/core/bitstreams/66e07ab6-ccb9-40ce-a37b-5495a3e8c0c5/content
- **ASF NISAR Data User Guide & Product Specification** — *NISAR GCOV Product Guide & Product Availability/Maturity* (CRID `P05036` validated cutover on 21 Oct 2026):
  - https://nisar-docs.asf.alaska.edu/gcov/
  - https://nisar-docs.asf.alaska.edu/availability-overview/
  - https://science.nasa.gov/mission/nisar/mission-overview/
- **Civil Defence & Ecological Impact Reports**:
  - *Agência Brasil* (2021 Manaus 30.02 m crest): https://agenciabrasil.ebc.com.br/es/node/1690178
  - *CNN Brasil* (2021 Amazonas flood impact): https://www.cnnbrasil.com.br/nacional/cheia-afeta-455-mil-pessoas-e-deixa-25-cidades-em-estado-de-emergencia-no-am/
  - *ClimaInfo* (2023 62 Amazonas municipalities in emergency): https://climainfo.org.br/2023/11/05/todas-as-cidades-do-amazonas-entram-em-emergencia-pela-seca-extrema/
  - *Folha de S.Paulo* (Lake Tefé 75% area contraction & river dolphin mortality): https://www1.folha.uol.com.br/internacional/en/scienceandhealth/2025/11/lake-tefe-loses-75-of-its-area-and-amazon-river-dolphins-are-left-without-cold-water-for-refuge.shtml

---

## 4. 3D Globe Basemap & Elevation Tile Providers (`GlobeViewer.tsx`)

| Layer | Provider / Agency | Endpoint / Source |
|---|---|---|
| **Offline Base Texture** | Cesium / Natural Earth II | Bundled locally at `src/renderer/public/cesium/Assets/Textures/NaturalEarthII` |
| **Optical Satellite Imagery** | Esri World Imagery | `https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}` |
| **SRTM Radar Topography** | NASA GIBS (`SRTM_Color_Index`) | `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/SRTM_Color_Index/default/default/GoogleMapsCompatible_Level12/{z}/{y}/{x}.png` |
| **Topographic Shaded Relief** | NASA GIBS (`ASTER_GDEM_Color_Shaded_Relief`) | `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/ASTER_GDEM_Color_Shaded_Relief/default/default/GoogleMapsCompatible_Level12/{z}/{y}/{x}.jpg` |
| **Borders & Place Labels** | Esri World Boundaries and Places | `https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}` |
