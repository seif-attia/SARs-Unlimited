import * as Cesium from 'cesium'

const SKYBOX_FACE_SIZE = 1024
const SKY_FIELD_GRID = 256
const CELESTIAL_RADIUS_M = 90_000_000
const COMET_RADIUS_M = 86_000_000
const ION_TAIL_SEGMENTS = 14
const DUST_TAIL_SEGMENTS = 12
const EARTH_OCCLUSION_RADIUS_M = 6_500_000

type CubeFaceKey =
  | 'positiveX'
  | 'negativeX'
  | 'positiveY'
  | 'negativeY'
  | 'positiveZ'
  | 'negativeZ'

interface SkyBoxCanvasSources {
  positiveX: HTMLCanvasElement
  negativeX: HTMLCanvasElement
  positiveY: HTMLCanvasElement
  negativeY: HTMLCanvasElement
  positiveZ: HTMLCanvasElement
  negativeZ: HTMLCanvasElement
}

interface RealStarSeed {
  raHours: number
  decDeg: number
  mag: number
  rgb: [number, number, number]
}

interface BrightStarRecord {
  billboard: Cesium.Billboard
  temeDir: Cesium.Cartesian3
  baseScale: number
  baseAlpha: number
  baseRotation: number
  phase: number
  glintFreq: number
  baseRgb: [number, number, number]
}

interface DynamicPointStarRecord {
  point: Cesium.PointPrimitive
  temeDir: Cesium.Cartesian3
  baseSize: number
  baseAlpha: number
  phase: number
  baseColor: Cesium.Color
}

type VisitorKind = 'comet' | 'meteor'

interface ActiveVisitorState {
  kind: VisitorKind
  startTimeMs: number
  durationMs: number
  startTemeDir: Cesium.Cartesian3
  endTemeDir: Cesium.Cartesian3
  curveNormalTeme: Cesium.Cartesian3
  antiSunTeme: Cesium.Cartesian3
  tailScaleMult: number
  comaColor: Cesium.Color
  ionColor: Cesium.Color
  dustColor: Cesium.Color
}

// True IAU 1958 Galactic orthonormal basis expressed in ICRS/TEME unit coordinates:
// Galactic Center: RA 266.4051 deg, Dec -28.93617 deg; North Galactic Pole: RA 192.85948 deg, Dec +27.12825 deg
function raDecToUnitVec(raDeg: number, decDeg: number): [number, number, number] {
  const ra = (raDeg * Math.PI) / 180
  const dec = (decDeg * Math.PI) / 180
  const cosDec = Math.cos(dec)
  return [cosDec * Math.cos(ra), cosDec * Math.sin(ra), Math.sin(dec)]
}

function cross3(
  a: [number, number, number],
  b: [number, number, number]
): [number, number, number] {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
}

function normalize3(v: [number, number, number]): [number, number, number] {
  const len = Math.hypot(v[0], v[1], v[2]) || 1
  return [v[0] / len, v[1] / len, v[2] / len]
}

const GALACTIC_NORTH = raDecToUnitVec(192.85948, 27.12825)
const GALACTIC_CENTER_RAW = raDecToUnitVec(266.4051, -28.93617)
const GALACTIC_EAST = normalize3(cross3(GALACTIC_NORTH, GALACTIC_CENTER_RAW))
const GALACTIC_CENTER = normalize3(cross3(GALACTIC_EAST, GALACTIC_NORTH))

const LMC_DIR = raDecToUnitVec(80.894, -69.756)
const SMC_DIR = raDecToUnitVec(13.158, -72.8)
const ORION_NEBULA_DIR = raDecToUnitVec(83.822, -5.391)
const CARINA_NEBULA_DIR = raDecToUnitVec(161.265, -59.867)

// Prominent real-sky navigational & constellation stars (Sirius -> Orion's Belt -> Scorpius -> Crux -> Big Dipper)
const REAL_CATALOG_STARS: RealStarSeed[] = [
  { raHours: 6.7525, decDeg: -16.716, mag: -1.46, rgb: [195, 224, 255] }, // Sirius
  { raHours: 6.3992, decDeg: -52.696, mag: -0.74, rgb: [244, 248, 255] }, // Canopus
  { raHours: 14.6601, decDeg: -60.834, mag: -0.01, rgb: [255, 240, 206] }, // Rigil Kentaurus
  { raHours: 14.261, decDeg: 19.182, mag: -0.05, rgb: [255, 206, 152] }, // Arcturus
  { raHours: 18.6156, decDeg: 38.784, mag: 0.03, rgb: [214, 232, 255] }, // Vega
  { raHours: 5.2782, decDeg: 45.998, mag: 0.08, rgb: [255, 236, 194] }, // Capella
  { raHours: 5.2423, decDeg: -8.202, mag: 0.13, rgb: [188, 218, 255] }, // Rigel
  { raHours: 7.655, decDeg: 5.225, mag: 0.34, rgb: [255, 248, 232] }, // Procyon
  { raHours: 1.6286, decDeg: -57.237, mag: 0.46, rgb: [186, 216, 255] }, // Achernar
  { raHours: 5.9195, decDeg: 7.407, mag: 0.42, rgb: [255, 178, 128] }, // Betelgeuse
  { raHours: 14.0637, decDeg: -60.373, mag: 0.61, rgb: [192, 220, 255] }, // Hadar
  { raHours: 19.8464, decDeg: 8.868, mag: 0.76, rgb: [232, 242, 255] }, // Altair
  { raHours: 12.4433, decDeg: -63.099, mag: 0.77, rgb: [184, 214, 255] }, // Acrux
  { raHours: 4.5987, decDeg: 16.509, mag: 0.86, rgb: [255, 188, 134] }, // Aldebaran
  { raHours: 16.4901, decDeg: -26.432, mag: 0.96, rgb: [255, 168, 118] }, // Antares
  { raHours: 13.4199, decDeg: -11.161, mag: 0.97, rgb: [186, 218, 255] }, // Spica
  { raHours: 7.7553, decDeg: 28.026, mag: 1.14, rgb: [255, 222, 178] }, // Pollux
  { raHours: 22.9608, decDeg: -29.622, mag: 1.16, rgb: [228, 240, 255] }, // Fomalhaut
  { raHours: 20.6905, decDeg: 45.28, mag: 1.25, rgb: [238, 246, 255] }, // Deneb
  { raHours: 12.7953, decDeg: -59.689, mag: 1.25, rgb: [188, 218, 255] }, // Mimosa
  { raHours: 10.1395, decDeg: 11.967, mag: 1.35, rgb: [204, 226, 255] }, // Regulus
  { raHours: 6.9771, decDeg: -28.972, mag: 1.5, rgb: [192, 220, 255] }, // Adhara
  { raHours: 7.5767, decDeg: 31.888, mag: 1.58, rgb: [230, 240, 255] }, // Castor
  { raHours: 17.5601, decDeg: -37.104, mag: 1.62, rgb: [194, 222, 255] }, // Shaula
  { raHours: 5.4189, decDeg: 6.35, mag: 1.64, rgb: [194, 222, 255] }, // Bellatrix
  { raHours: 5.4382, decDeg: 28.607, mag: 1.65, rgb: [204, 226, 255] }, // Elnath
  { raHours: 5.6036, decDeg: -1.202, mag: 1.69, rgb: [188, 218, 255] }, // Alnilam
  { raHours: 5.6793, decDeg: -1.943, mag: 1.77, rgb: [188, 218, 255] }, // Alnitak
  { raHours: 5.5334, decDeg: -0.299, mag: 2.23, rgb: [188, 218, 255] }, // Mintaka
  { raHours: 11.0621, decDeg: 61.751, mag: 1.79, rgb: [255, 224, 178] }, // Dubhe
  { raHours: 11.0307, decDeg: 56.382, mag: 2.37, rgb: [228, 240, 255] }, // Merak
  { raHours: 12.9005, decDeg: 55.96, mag: 1.77, rgb: [232, 242, 255] }, // Alioth
  { raHours: 13.7923, decDeg: 49.313, mag: 1.86, rgb: [204, 226, 255] }, // Alkaid
  { raHours: 2.5303, decDeg: 89.264, mag: 1.98, rgb: [255, 244, 214] }, // Polaris
  { raHours: 18.4029, decDeg: -34.385, mag: 1.85, rgb: [212, 232, 255] }, // Kaus Australis
  { raHours: 3.4054, decDeg: 49.861, mag: 1.79, rgb: [255, 244, 212] }, // Mirfak
  { raHours: 0.7264, decDeg: 60.717, mag: 2.15, rgb: [198, 224, 255] }, // Gamma Cas
  { raHours: 3.7914, decDeg: 24.105, mag: 2.87, rgb: [192, 220, 255] } // Alcyone (Pleiades)
]

function createMulberry32(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Fast continuous 3D hash noise table so fBm noise across cube faces has zero trig bottlenecks and zero edge seams
const NOISE_PERMS = (() => {
  const table = new Float32Array(256)
  const rng = createMulberry32(0x9e3779b9)
  for (let i = 0; i < 256; i++) table[i] = rng()
  return table
})()

function hash3(ix: number, iy: number, iz: number): number {
  const h = (Math.imul(ix, 374761393) + Math.imul(iy, 668265263) + Math.imul(iz, 2147483647)) >>> 0
  const m = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0
  return NOISE_PERMS[(m ^ (m >>> 16)) & 255]
}

function valueNoise3(x: number, y: number, z: number): number {
  const ix = Math.floor(x)
  const iy = Math.floor(y)
  const iz = Math.floor(z)
  const fx = x - ix
  const fy = y - iy
  const fz = z - iz
  const ux = fx * fx * (3 - 2 * fx)
  const uy = fy * fy * (3 - 2 * fy)
  const uz = fz * fz * (3 - 2 * fz)

  const n000 = hash3(ix, iy, iz)
  const n100 = hash3(ix + 1, iy, iz)
  const n010 = hash3(ix, iy + 1, iz)
  const n110 = hash3(ix + 1, iy + 1, iz)
  const n001 = hash3(ix, iy, iz + 1)
  const n101 = hash3(ix + 1, iy, iz + 1)
  const n011 = hash3(ix, iy + 1, iz + 1)
  const n111 = hash3(ix + 1, iy + 1, iz + 1)

  const nx00 = n000 + (n100 - n000) * ux
  const nx10 = n010 + (n110 - n010) * ux
  const nx01 = n001 + (n101 - n001) * ux
  const nx11 = n011 + (n111 - n011) * ux
  const nxy0 = nx00 + (nx10 - nx00) * uy
  const nxy1 = nx01 + (nx11 - nx01) * uy
  return nxy0 + (nxy1 - nxy0) * uz
}

function fbm3(x: number, y: number, z: number, octaves = 4): number {
  let sum = 0
  let amp = 0.5
  let freq = 1
  let norm = 0
  for (let i = 0; i < octaves; i++) {
    sum += amp * valueNoise3(x * freq, y * freq, z * freq)
    norm += amp
    amp *= 0.5
    freq *= 2.04
  }
  return sum / norm
}

function ridgedFbm3(x: number, y: number, z: number, octaves = 4): number {
  let sum = 0
  let amp = 0.55
  let freq = 1
  let norm = 0
  for (let i = 0; i < octaves; i++) {
    const ridge = 1 - Math.abs(2 * valueNoise3(x * freq, y * freq, z * freq) - 1)
    sum += amp * ridge * ridge
    norm += amp
    amp *= 0.5
    freq *= 2.15
  }
  return sum / norm
}

// Exact OpenGL Cube Map direction vectors accounting for Cesium CubeMap UNPACK_FLIP_Y_WEBGL = true
function faceUvToUnitDir(face: CubeFaceKey, u: number, v: number): [number, number, number] {
  switch (face) {
    case 'positiveX':
      return normalize3([1, -v, -u])
    case 'negativeX':
      return normalize3([-1, -v, u])
    case 'positiveY':
      return normalize3([u, 1, v])
    case 'negativeY':
      return normalize3([u, -1, -v])
    case 'positiveZ':
      return normalize3([u, -v, 1])
    case 'negativeZ':
      return normalize3([-u, -v, -1])
  }
}

function evaluateDesertSkyIrradiance(
  dx: number,
  dy: number,
  dz: number
): [number, number, number] {
  // Project into Galactic frame
  const gc = dx * GALACTIC_CENTER[0] + dy * GALACTIC_CENTER[1] + dz * GALACTIC_CENTER[2]
  const ge = dx * GALACTIC_EAST[0] + dy * GALACTIC_EAST[1] + dz * GALACTIC_EAST[2]
  const gn = dx * GALACTIC_NORTH[0] + dy * GALACTIC_NORTH[1] + dz * GALACTIC_NORTH[2]

  const absGn = Math.abs(gn)
  const bulgeWeight = Math.max(0, 0.5 * (1 + gc)) // strongest around Sagittarius core (gc ~ 1)
  const planeSigma = 0.085 + 0.065 * bulgeWeight
  const galacticBand = Math.exp(-(absGn * absGn) / (2 * planeSigma * planeSigma))
  const wideHalo = Math.exp(-(absGn * absGn) / (2 * 0.28 * 0.28))

  // Domain-warped 3D noise for authentic spiral star clouds and dust tendrils
  const warpX = fbm3(dx * 2.8 + 3.1, dy * 2.8 - 1.4, dz * 2.8 + 5.7, 3) - 0.5
  const warpY = fbm3(dx * 2.8 - 4.2, dy * 2.8 + 6.3, dz * 2.8 - 2.1, 3) - 0.5
  const sx = dx + 0.28 * warpX
  const sy = dy + 0.28 * warpY
  const sz = dz + 0.22 * (warpX - warpY)

  const starCloudNoise = fbm3(sx * 4.4 + 11.2, sy * 4.4 - 7.5, sz * 4.4 + 2.9, 4)
  const fineMottling = fbm3(sx * 11.5 - 3.4, sy * 11.5 + 8.1, sz * 11.5 - 5.2, 3)

  // The Great Rift dark absorption lane cleaving near the galactic equator
  const riftRidge = ridgedFbm3(sx * 5.2 + 19.4, sy * 5.2 + 4.8, sz * 5.2 - 12.1, 4)
  const equatorNarrow = Math.exp(-Math.pow(gn / 0.042, 2))
  const riftStrength = Math.max(
    0,
    Math.min(0.84, equatorNarrow * Math.max(0, (riftRidge - 0.28) * 1.42) * (0.45 + 0.75 * bulgeWeight))
  )

  const luminousCloud =
    galacticBand * (0.28 + 0.92 * Math.pow(starCloudNoise, 1.35)) * (0.72 + 0.48 * fineMottling)
  const bulgeGlow = Math.pow(bulgeWeight, 2.2) * Math.exp(-Math.pow(absGn / 0.14, 2))

  // Faint southern desert sky highlights: Magellanic Clouds + Orion/Carina nebular warmth
  const dotLmc = Math.max(0, dx * LMC_DIR[0] + dy * LMC_DIR[1] + dz * LMC_DIR[2])
  const lmcCloud =
    dotLmc > 0.985
      ? Math.pow((dotLmc - 0.985) / 0.015, 2.1) * (0.55 + 0.7 * fineMottling)
      : 0

  const dotSmc = Math.max(0, dx * SMC_DIR[0] + dy * SMC_DIR[1] + dz * SMC_DIR[2])
  const smcCloud =
    dotSmc > 0.991
      ? Math.pow((dotSmc - 0.991) / 0.009, 2.0) * (0.5 + 0.65 * starCloudNoise)
      : 0

  const dotOrion = Math.max(0, dx * ORION_NEBULA_DIR[0] + dy * ORION_NEBULA_DIR[1] + dz * ORION_NEBULA_DIR[2])
  const orionGlow = dotOrion > 0.993 ? Math.pow((dotOrion - 0.993) / 0.007, 2.4) : 0

  const dotCarina = Math.max(0, dx * CARINA_NEBULA_DIR[0] + dy * CARINA_NEBULA_DIR[1] + dz * CARINA_NEBULA_DIR[2])
  const carinaGlow = dotCarina > 0.992 ? Math.pow((dotCarina - 0.992) / 0.008, 2.3) : 0

  // Bortle-1 desert deep vault baseline (very dark indigo-obsidian)
  let r = 1.6 + 2.4 * wideHalo
  let g = 3.2 + 4.4 * wideHalo
  let b = 8.4 + 9.2 * wideHalo

  // Spiral arm diffuse unresolved starlight + Sagittarius golden core dust
  const cloudFactor = luminousCloud * (1 - riftStrength)
  r += cloudFactor * (18 + 20 * Math.pow(bulgeWeight, 1.4)) + bulgeGlow * (1 - riftStrength * 0.8) * 20
  g += cloudFactor * (23 + 12 * bulgeWeight) + bulgeGlow * (1 - riftStrength * 0.8) * 16
  b += cloudFactor * (38 + 8 * (1 - bulgeWeight)) + bulgeGlow * (1 - riftStrength * 0.8) * 12

  // Cygnus / Vela silvery knots using longitudinal modulation ge
  const armFilaments = Math.max(0, Math.sin(ge * 3.2 + starCloudNoise * 4.5)) * galacticBand * (1 - riftStrength)
  r += armFilaments * 5.5
  g += armFilaments * 8.0
  b += armFilaments * 13.5

  // Magellanic Clouds + faint H-II emission hints
  r += (lmcCloud + smcCloud * 0.85) * 18 + (orionGlow + carinaGlow) * 16
  g += (lmcCloud + smcCloud * 0.85) * 21 + (orionGlow + carinaGlow) * 10
  b += (lmcCloud + smcCloud * 0.85) * 29 + (orionGlow + carinaGlow) * 21

  return [r, g, b]
}

interface ProjectedCubeStar {
  dir: [number, number, number]
  brightness: number
  sigmaPx: number
  rgb: [number, number, number]
}

function generateFaintCubemapStars(count: number): ProjectedCubeStar[] {
  const rng = createMulberry32(0x2026a1b5)
  const palette: [number, number, number][] = [
    [186, 216, 255], // O/B blue-white
    [224, 238, 255], // A cool white
    [255, 252, 245], // F white
    [255, 240, 210], // G warm white
    [255, 214, 168], // K orange
    [255, 188, 146] // M warm amber
  ]
  const stars: ProjectedCubeStar[] = []

  for (let i = 0; i < count; i++) {
    let dir: [number, number, number]
    if (rng() < 0.62) {
      // Concentrate realistic Milky Way faint star cloud density along the Galactic disk
      const l = rng() * Math.PI * 2
      const bSpread = (rng() + rng() + rng() - 1.5) * 0.24
      const cosB = Math.cos(bSpread)
      const gc = cosB * Math.cos(l)
      const ge = cosB * Math.sin(l)
      const gn = Math.sin(bSpread)
      dir = normalize3([
        gc * GALACTIC_CENTER[0] + ge * GALACTIC_EAST[0] + gn * GALACTIC_NORTH[0],
        gc * GALACTIC_CENTER[1] + ge * GALACTIC_EAST[1] + gn * GALACTIC_NORTH[1],
        gc * GALACTIC_CENTER[2] + ge * GALACTIC_EAST[2] + gn * GALACTIC_NORTH[2]
      ])
    } else {
      const z = rng() * 2 - 1
      const phi = rng() * Math.PI * 2
      const sinTheta = Math.sqrt(Math.max(0, 1 - z * z))
      dir = [sinTheta * Math.cos(phi), sinTheta * Math.sin(phi), z]
    }

    const colorChoice = palette[Math.floor(Math.pow(rng(), 0.9) * palette.length) % palette.length]
    const magRoll = Math.pow(rng(), 2.9)
    const brightness = 0.24 + magRoll * 0.95
    const sigmaPx = 0.42 + magRoll * 0.45

    stars.push({ dir, brightness, sigmaPx, rgb: colorChoice })
  }

  return stars
}

function projectDirToFaceCoords(
  dx: number,
  dy: number,
  dz: number,
  face: CubeFaceKey
): { u: number; v: number } | null {
  let ma: number
  let sc: number
  let tc: number
  switch (face) {
    case 'positiveX':
      ma = dx
      sc = -dz
      tc = -dy
      break
    case 'negativeX':
      ma = -dx
      sc = dz
      tc = -dy
      break
    case 'positiveY':
      ma = dy
      sc = dx
      tc = dz
      break
    case 'negativeY':
      ma = -dy
      sc = dx
      tc = -dz
      break
    case 'positiveZ':
      ma = dz
      sc = dx
      tc = -dy
      break
    case 'negativeZ':
      ma = -dz
      sc = -dx
      tc = -dy
      break
  }

  if (ma <= 0.15) return null
  const u = sc / ma
  const v = tc / ma
  // Include a slight 1.02 margin so edge-crossing PSFs splat identically onto adjacent cube faces
  if (Math.abs(u) > 1.02 || Math.abs(v) > 1.02) return null
  return { u, v }
}

function buildSkyBoxFaceCanvas(
  face: CubeFaceKey,
  faintStars: ProjectedCubeStar[]
): HTMLCanvasElement {
  const size = SKYBOX_FACE_SIZE
  const grid = SKY_FIELD_GRID
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas

  // 1. Evaluate smooth Galactic / Great Rift / Desert Sky field on 256x256 float buffer
  const fieldRgb = new Float32Array(grid * grid * 3)
  for (let gy = 0; gy < grid; gy++) {
    const v = 1 - (2 * (gy + 0.5)) / grid
    for (let gx = 0; gx < grid; gx++) {
      const u = (2 * (gx + 0.5)) / grid - 1
      const [dx, dy, dz] = faceUvToUnitDir(face, u, v)
      const [r, g, b] = evaluateDesertSkyIrradiance(dx, dy, dz)
      const o = (gy * grid + gx) * 3
      fieldRgb[o] = r
      fieldRgb[o + 1] = g
      fieldRgb[o + 2] = b
    }
  }

  // 2. Bilinearly upsample sky irradiance onto 1024x1024 RGBA buffer with subtle blue-noise dither
  const imgData = ctx.createImageData(size, size)
  const pixels = imgData.data
  const scale = (grid - 1) / (size - 1)

  for (let py = 0; py < size; py++) {
    const fy = py * scale
    const y0 = Math.min(grid - 2, Math.floor(fy))
    const ty = fy - y0
    const row0 = y0 * grid
    const row1 = (y0 + 1) * grid

    for (let px = 0; px < size; px++) {
      const fx = px * scale
      const x0 = Math.min(grid - 2, Math.floor(fx))
      const tx = fx - x0

      const i00 = (row0 + x0) * 3
      const i10 = (row0 + x0 + 1) * 3
      const i01 = (row1 + x0) * 3
      const i11 = (row1 + x0 + 1) * 3

      const w00 = (1 - tx) * (1 - ty)
      const w10 = tx * (1 - ty)
      const w01 = (1 - tx) * ty
      const w11 = tx * ty

      // Fast deterministic hash dither in [-0.45, +0.45] to prevent dark-sky 8-bit banding
      const ditherHash = ((Math.imul(px + 17, 73856093) ^ Math.imul(py + 31, 19349663)) >>> 24) / 255 - 0.5

      const dst = (py * size + px) * 4
      pixels[dst] = Math.max(0, Math.min(255, fieldRgb[i00] * w00 + fieldRgb[i10] * w10 + fieldRgb[i01] * w01 + fieldRgb[i11] * w11 + ditherHash))
      pixels[dst + 1] = Math.max(0, Math.min(255, fieldRgb[i00 + 1] * w00 + fieldRgb[i10 + 1] * w10 + fieldRgb[i01 + 1] * w01 + fieldRgb[i11 + 1] * w11 + ditherHash))
      pixels[dst + 2] = Math.max(0, Math.min(255, fieldRgb[i00 + 2] * w00 + fieldRgb[i10 + 2] * w10 + fieldRgb[i01 + 2] * w01 + fieldRgb[i11 + 2] * w11 + ditherHash))
      pixels[dst + 3] = 255
    }
  }

  // 3. Splat 1024px sub-pixel pinpoint stars onto this face (including seam-safe boundary overlap)
  for (let i = 0; i < faintStars.length; i++) {
    const s = faintStars[i]
    const projected = projectDirToFaceCoords(s.dir[0], s.dir[1], s.dir[2], face)
    if (!projected) continue

    const fpx = (projected.u + 1) * 0.5 * size - 0.5
    const fpy = (1 - projected.v) * 0.5 * size - 0.5
    const minX = Math.max(0, Math.floor(fpx - 2))
    const maxX = Math.min(size - 1, Math.ceil(fpx + 2))
    const minY = Math.max(0, Math.floor(fpy - 2))
    const maxY = Math.min(size - 1, Math.ceil(fpy + 2))

    const inv2Sig2 = 1 / (2 * s.sigmaPx * s.sigmaPx)
    for (let py = minY; py <= maxY; py++) {
      const dy = py - fpy
      for (let px = minX; px <= maxX; px++) {
        const dx = px - fpx
        const d2 = dx * dx + dy * dy
        const psf = Math.exp(-d2 * inv2Sig2) * s.brightness
        if (psf < 0.015) continue
        const dst = (py * size + px) * 4
        pixels[dst] = Math.min(255, pixels[dst] + psf * s.rgb[0])
        pixels[dst + 1] = Math.min(255, pixels[dst + 1] + psf * s.rgb[1])
        pixels[dst + 2] = Math.min(255, pixels[dst + 2] + psf * s.rgb[2])
      }
    }
  }

  ctx.putImageData(imgData, 0, 0)
  return canvas
}

// Crisp high-DPI optical diffraction starburst sprite (128x128) for shining prominent stars
function createDiffractionStarSprite(): string {
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''

  const c = size / 2
  const glow = ctx.createRadialGradient(c, c, 0, c, c, c * 0.94)
  glow.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)')
  glow.addColorStop(0.07, 'rgba(255, 255, 255, 0.96)')
  glow.addColorStop(0.18, 'rgba(235, 245, 255, 0.48)')
  glow.addColorStop(0.42, 'rgba(195, 224, 255, 0.12)')
  glow.addColorStop(1.0, 'rgba(195, 224, 255, 0.0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, size, size)

  const drawSpike = (angleRad: number, length: number, thickness: number, alpha: number): void => {
    ctx.save()
    ctx.translate(c, c)
    ctx.rotate(angleRad)
    const grad = ctx.createLinearGradient(-length, 0, length, 0)
    grad.addColorStop(0, 'rgba(255, 255, 255, 0)')
    grad.addColorStop(0.32, `rgba(235, 246, 255, ${alpha * 0.35})`)
    grad.addColorStop(0.5, `rgba(255, 255, 255, ${alpha})`)
    grad.addColorStop(0.68, `rgba(235, 246, 255, ${alpha * 0.35})`)
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)')
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.ellipse(0, 0, length, thickness, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  // Primary 4-point Airy diffraction spikes + delicate 45-deg secondary spikes
  drawSpike(0, 58, 1.65, 0.92)
  drawSpike(Math.PI / 2, 58, 1.65, 0.92)
  drawSpike(Math.PI / 4, 34, 1.05, 0.42)
  drawSpike(-Math.PI / 4, 34, 1.05, 0.42)

  return canvas.toDataURL('image/png')
}

// Soft desert-seeing star halo sprite (64x64) for medium-bright stars
function createSoftStarHaloSprite(): string {
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''

  const c = size / 2
  const grad = ctx.createRadialGradient(c, c, 0, c, c, c * 0.95)
  grad.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)')
  grad.addColorStop(0.14, 'rgba(255, 255, 255, 0.9)')
  grad.addColorStop(0.36, 'rgba(230, 242, 255, 0.34)')
  grad.addColorStop(0.7, 'rgba(190, 220, 255, 0.06)')
  grad.addColorStop(1.0, 'rgba(190, 220, 255, 0.0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, size, size)

  return canvas.toDataURL('image/png')
}

// Condensed comet nucleus + inner cyan-emerald coma sprite (128x128)
function createCometComaSprite(): string {
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''

  const c = size / 2
  const grad = ctx.createRadialGradient(c, c, 0, c, c, c * 0.96)
  grad.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)')
  grad.addColorStop(0.08, 'rgba(236, 254, 255, 0.96)')
  grad.addColorStop(0.22, 'rgba(165, 243, 252, 0.68)')
  grad.addColorStop(0.48, 'rgba(94, 234, 212, 0.25)')
  grad.addColorStop(0.8, 'rgba(56, 189, 248, 0.06)')
  grad.addColorStop(1.0, 'rgba(56, 189, 248, 0.0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, size, size)

  return canvas.toDataURL('image/png')
}

// Soft Gaussian plume sprite (64x64) layered smoothly to build ion and dust comet tails
function createCometTailSprite(): string {
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''

  const c = size / 2
  const grad = ctx.createRadialGradient(c, c, 0, c, c, c * 0.95)
  grad.addColorStop(0.0, 'rgba(255, 255, 255, 0.72)')
  grad.addColorStop(0.28, 'rgba(255, 255, 255, 0.36)')
  grad.addColorStop(0.65, 'rgba(255, 255, 255, 0.09)')
  grad.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, size, size)

  return canvas.toDataURL('image/png')
}

/**
 * Attaches a high-resolution 1024px-per-face desert-night skybox cubemap,
 * a 3D parallax-free TEME starfield with optical starbursts that dynamically shine
 * and scintillate when moving the globe, and occasional passing deep-space comets
 * and shooting stars across visible desert-sky quadrants behind Earth.
 *
 * Returns a cleanup callback that disposes all timers, listeners, and primitives.
 */
export function attachDynamicDesertNightSky(viewer: Cesium.Viewer): () => void {
  const { scene, camera } = viewer
  let disposed = false

  // --------------------------------------------------------------------------
  // 1. Asynchronous 1024px-per-face Desert-Night Cubemap Generation
  // --------------------------------------------------------------------------
  const faintCubemapStars = generateFaintCubemapStars(21_000)
  const facesOrder: CubeFaceKey[] = [
    'positiveX',
    'negativeX',
    'positiveY',
    'negativeY',
    'positiveZ',
    'negativeZ'
  ]
  const partialFaces: Partial<SkyBoxCanvasSources> = {}
  let skyboxTimerId: number | null = null

  const buildNextSkyBoxFace = (index: number): void => {
    if (disposed || viewer.isDestroyed()) return
    const key = facesOrder[index]
    partialFaces[key] = buildSkyBoxFaceCanvas(key, faintCubemapStars)

    if (index + 1 < facesOrder.length) {
      skyboxTimerId = window.setTimeout(() => buildNextSkyBoxFace(index + 1), 0)
    } else if (!viewer.isDestroyed()) {
      scene.skyBox = new Cesium.SkyBox({
        sources: partialFaces as SkyBoxCanvasSources,
        show: true
      })
      scene.requestRender()
    }
  }
  skyboxTimerId = window.setTimeout(() => buildNextSkyBoxFace(0), 0)

  // --------------------------------------------------------------------------
  // 2. Dynamic 3D Starfield (PointPrimitives + Optical Diffraction Billboards)
  // --------------------------------------------------------------------------
  const diffractionSprite = createDiffractionStarSprite()
  const haloSprite = createSoftStarHaloSprite()
  const comaSprite = createCometComaSprite()
  const tailSprite = createCometTailSprite()

  const pointCollection = new Cesium.PointPrimitiveCollection({
    blendOption: Cesium.BlendOption.TRANSLUCENT
  })
  const billboardCollection = new Cesium.BillboardCollection({
    scene,
    blendOption: Cesium.BlendOption.TRANSLUCENT
  })

  scene.primitives.add(pointCollection)
  scene.primitives.add(billboardCollection)

  const pointStars: DynamicPointStarRecord[] = []
  const brightStars: BrightStarRecord[] = []

  const starRng = createMulberry32(0x7c93e411)
  const spectralPalette: [number, number, number][] = [
    [186, 218, 255], // O/B blue-white
    [224, 240, 255], // A cool white
    [255, 251, 242], // F white
    [255, 238, 206], // G yellow-white
    [255, 210, 160], // K warm amber
    [255, 182, 134] // M crimson-orange
  ]

  // 2a. Real catalog navigational & constellation anchor stars
  for (let i = 0; i < REAL_CATALOG_STARS.length; i++) {
    const cat = REAL_CATALOG_STARS[i]
    const [dx, dy, dz] = raDecToUnitVec(cat.raHours * 15, cat.decDeg)
    const temeDir = new Cesium.Cartesian3(dx, dy, dz)
    const pos = Cesium.Cartesian3.multiplyByScalar(temeDir, CELESTIAL_RADIUS_M, new Cesium.Cartesian3())

    const magWeight = Math.max(0.18, 1 - (cat.mag + 1.5) / 4.8)
    const baseScale = 0.14 + magWeight * 0.24
    const baseAlpha = 0.78 + magWeight * 0.22
    const baseRotation = starRng() * Math.PI * 2
    const color = Cesium.Color.fromBytes(
      cat.rgb[0],
      cat.rgb[1],
      cat.rgb[2],
      Math.round(baseAlpha * 255)
    )

    const billboard = billboardCollection.add({
      position: pos,
      image: cat.mag < 1.35 ? diffractionSprite : haloSprite,
      scale: baseScale,
      rotation: baseRotation,
      color
    })

    brightStars.push({
      billboard,
      temeDir,
      baseScale,
      baseAlpha,
      baseRotation,
      phase: starRng() * Math.PI * 2,
      glintFreq: 9 + starRng() * 14,
      baseRgb: cat.rgb
    })
  }

  // 2b. ~175 prominent Galactic & all-sky luminous stars + 2,500 crisp field stars
  for (let i = 0; i < 2675; i++) {
    let dirArr: [number, number, number]
    if (starRng() < 0.56) {
      const l = starRng() * Math.PI * 2
      const b = (starRng() + starRng() + starRng() - 1.5) * 0.26
      const cosB = Math.cos(b)
      const gc = cosB * Math.cos(l)
      const ge = cosB * Math.sin(l)
      const gn = Math.sin(b)
      dirArr = normalize3([
        gc * GALACTIC_CENTER[0] + ge * GALACTIC_EAST[0] + gn * GALACTIC_NORTH[0],
        gc * GALACTIC_CENTER[1] + ge * GALACTIC_EAST[1] + gn * GALACTIC_NORTH[1],
        gc * GALACTIC_CENTER[2] + ge * GALACTIC_EAST[2] + gn * GALACTIC_NORTH[2]
      ])
    } else {
      const z = starRng() * 2 - 1
      const phi = starRng() * Math.PI * 2
      const s = Math.sqrt(Math.max(0, 1 - z * z))
      dirArr = [s * Math.cos(phi), s * Math.sin(phi), z]
    }

    const temeDir = new Cesium.Cartesian3(dirArr[0], dirArr[1], dirArr[2])
    const pos = Cesium.Cartesian3.multiplyByScalar(temeDir, CELESTIAL_RADIUS_M, new Cesium.Cartesian3())
    const rgb = spectralPalette[Math.floor(Math.pow(starRng(), 0.92) * spectralPalette.length) % spectralPalette.length]

    if (i < 175) {
      const prominence = Math.pow(starRng(), 1.8)
      const isDiffraction = i < 48
      const baseScale = isDiffraction ? 0.11 + prominence * 0.12 : 0.1 + prominence * 0.1
      const baseAlpha = 0.58 + prominence * 0.34
      const baseRotation = starRng() * Math.PI * 2

      const billboard = billboardCollection.add({
        position: pos,
        image: isDiffraction ? diffractionSprite : haloSprite,
        scale: baseScale,
        rotation: baseRotation,
        color: Cesium.Color.fromBytes(rgb[0], rgb[1], rgb[2], Math.round(baseAlpha * 255))
      })

      brightStars.push({
        billboard,
        temeDir,
        baseScale,
        baseAlpha,
        baseRotation,
        phase: starRng() * Math.PI * 2,
        glintFreq: 8 + starRng() * 16,
        baseRgb: rgb
      })
    } else {
      const magPower = Math.pow(starRng(), 2.4)
      const baseSize = 1.25 + magPower * 2.15
      const baseAlpha = 0.42 + magPower * 0.52
      const color = Cesium.Color.fromBytes(rgb[0], rgb[1], rgb[2], Math.round(baseAlpha * 255))

      const point = pointCollection.add({
        position: pos,
        pixelSize: baseSize,
        color
      })

      // Keep top ~420 brighter field stars dynamically shimmering during camera motion
      if (pointStars.length < 420 && magPower > 0.22) {
        pointStars.push({
          point,
          temeDir,
          baseSize,
          baseAlpha,
          phase: starRng() * Math.PI * 2,
          baseColor: Cesium.Color.clone(color)
        })
      }
    }
  }

  // --------------------------------------------------------------------------
  // 3. Pre-allocated Pool for Passing Comets & Shooting Stars
  // --------------------------------------------------------------------------
  const visitorComa = billboardCollection.add({
    show: false,
    position: new Cesium.Cartesian3(COMET_RADIUS_M, 0, 0),
    image: comaSprite,
    scale: 0.45,
    color: Cesium.Color.WHITE
  })

  const visitorIonNodes: Cesium.Billboard[] = []
  for (let i = 0; i < ION_TAIL_SEGMENTS; i++) {
    visitorIonNodes.push(
      billboardCollection.add({
        show: false,
        position: new Cesium.Cartesian3(COMET_RADIUS_M, 0, 0),
        image: tailSprite,
        scale: 0.3,
        color: Cesium.Color.SKYBLUE
      })
    )
  }

  const visitorDustNodes: Cesium.Billboard[] = []
  for (let i = 0; i < DUST_TAIL_SEGMENTS; i++) {
    visitorDustNodes.push(
      billboardCollection.add({
        show: false,
        position: new Cesium.Cartesian3(COMET_RADIUS_M, 0, 0),
        image: tailSprite,
        scale: 0.35,
        color: Cesium.Color.MOCCASIN
      })
    )
  }

  const hideVisitorNodes = (): void => {
    visitorComa.show = false
    for (let i = 0; i < visitorIonNodes.length; i++) visitorIonNodes[i].show = false
    for (let i = 0; i < visitorDustNodes.length; i++) visitorDustNodes[i].show = false
  }

  // --------------------------------------------------------------------------
  // 4. Camera-Driven Scintillation + Occasional Comet Transit Animation
  // --------------------------------------------------------------------------
  const scratchTemeToFixed = new Cesium.Matrix3()
  const scratchFixedToTeme = new Cesium.Matrix3()
  const scratchWorldDir = new Cesium.Cartesian3()
  const scratchDeltaCam = new Cesium.Cartesian3()
  const prevCamDir = Cesium.Cartesian3.clone(camera.directionWC)
  const prevCamUp = Cesium.Cartesian3.clone(camera.upWC)

  const scratchCometPos = new Cesium.Cartesian3()
  const scratchCometTailDir = new Cesium.Cartesian3()
  const scratchCometDustBias = new Cesium.Cartesian3()
  const scratchTailOffset = new Cesium.Cartesian3()
  const scratchTailPt = new Cesium.Cartesian3()
  const scratchColor = new Cesium.Color()

  let lastPreRenderMs = performance.now()
  let sweepIntegral = 0
  let motionEnergy = 0
  let visitorRafId: number | null = null
  let nextVisitorTimerId: number | null = null
  let activeVisitor: ActiveVisitorState | null = null
  let visitorCount = 0

  const stepActiveVisitor = (nowMs: number): void => {
    if (!activeVisitor) return
    const elapsed = nowMs - activeVisitor.startTimeMs
    const t = Math.max(0, Math.min(1, elapsed / activeVisitor.durationMs))

    if (t >= 1) {
      activeVisitor = null
      hideVisitorNodes()
      scene.requestRender()
      return
    }

    // Smooth entry & fade envelope across open sky
    const envelope = Math.pow(Math.sin(t * Math.PI), activeVisitor.kind === 'comet' ? 0.55 : 0.35)

    // Great-circle slerp + subtle orbital curvature normal so comets sweep gracefully across space
    Cesium.Cartesian3.lerp(
      activeVisitor.startTemeDir,
      activeVisitor.endTemeDir,
      t,
      scratchCometPos
    )
    const arcLift = Math.sin(t * Math.PI) * (activeVisitor.kind === 'comet' ? 0.065 : 0.015)
    Cesium.Cartesian3.multiplyByScalar(activeVisitor.curveNormalTeme, arcLift, scratchTailOffset)
    Cesium.Cartesian3.add(scratchCometPos, scratchTailOffset, scratchCometPos)
    Cesium.Cartesian3.normalize(scratchCometPos, scratchCometPos)

    // Tangent direction of travel for meteor trail alignment
    Cesium.Cartesian3.subtract(activeVisitor.endTemeDir, activeVisitor.startTemeDir, scratchCometTailDir)
    Cesium.Cartesian3.normalize(scratchCometTailDir, scratchCometTailDir)
    Cesium.Cartesian3.negate(scratchCometTailDir, scratchCometTailDir)

    if (activeVisitor.kind === 'comet') {
      // Blend anti-velocity direction with outward radiation pressure vector for natural tail geometry
      Cesium.Cartesian3.lerp(
        scratchCometTailDir,
        activeVisitor.antiSunTeme,
        0.58,
        scratchCometTailDir
      )
      Cesium.Cartesian3.normalize(scratchCometTailDir, scratchCometTailDir)

      // Dust tail lags slightly behind orbital path forming a faint parabolic spread
      Cesium.Cartesian3.cross(
        scratchCometPos,
        scratchCometTailDir,
        scratchCometDustBias
      )
      Cesium.Cartesian3.normalize(scratchCometDustBias, scratchCometDustBias)
    }

    // Position coma head
    Cesium.Cartesian3.multiplyByScalar(scratchCometPos, COMET_RADIUS_M, visitorComa.position)
    visitorComa.show = true
    visitorComa.scale =
      (activeVisitor.kind === 'comet' ? 0.34 : 0.24) *
      activeVisitor.tailScaleMult *
      (0.8 + 0.25 * envelope)
    Cesium.Color.clone(activeVisitor.comaColor, scratchColor)
    scratchColor.alpha = Math.min(1, 0.96 * envelope)
    visitorComa.color = scratchColor

    // Type I Ion Tail (or crisp meteor ionization wake)
    const ionAngularStep =
      (activeVisitor.kind === 'comet' ? 0.0052 : 0.0042) * activeVisitor.tailScaleMult
    for (let i = 0; i < visitorIonNodes.length; i++) {
      const node = visitorIonNodes[i]
      const frac = (i + 1) / visitorIonNodes.length
      Cesium.Cartesian3.multiplyByScalar(
        scratchCometTailDir,
        frac * ionAngularStep * visitorIonNodes.length,
        scratchTailOffset
      )
      Cesium.Cartesian3.add(scratchCometPos, scratchTailOffset, scratchTailPt)
      Cesium.Cartesian3.normalize(scratchTailPt, scratchTailPt)
      Cesium.Cartesian3.multiplyByScalar(scratchTailPt, COMET_RADIUS_M, node.position)

      node.show = true
      node.scale =
        (activeVisitor.kind === 'comet'
          ? 0.22 + (1 - frac) * 0.26
          : 0.1 + (1 - frac) * 0.12) * activeVisitor.tailScaleMult
      Cesium.Color.clone(activeVisitor.ionColor, scratchColor)
      scratchColor.alpha = Math.max(0.02, Math.pow(1 - frac, 1.45) * 0.65 * envelope)
      node.color = scratchColor
    }

    // Type II Warm Dust Tail (only on comets, curving smoothly away from ion tail)
    if (activeVisitor.kind === 'comet') {
      const dustStep = 0.0048 * activeVisitor.tailScaleMult
      for (let i = 0; i < visitorDustNodes.length; i++) {
        const node = visitorDustNodes[i]
        const frac = (i + 1) / visitorDustNodes.length
        Cesium.Cartesian3.multiplyByScalar(
          scratchCometTailDir,
          frac * dustStep * visitorDustNodes.length * 0.88,
          scratchTailOffset
        )
        Cesium.Cartesian3.add(scratchCometPos, scratchTailOffset, scratchTailPt)

        const curveBend = frac * frac * 0.024 * activeVisitor.tailScaleMult
        Cesium.Cartesian3.multiplyByScalar(scratchCometDustBias, curveBend, scratchTailOffset)
        Cesium.Cartesian3.add(scratchTailPt, scratchTailOffset, scratchTailPt)
        Cesium.Cartesian3.normalize(scratchTailPt, scratchTailPt)
        Cesium.Cartesian3.multiplyByScalar(scratchTailPt, COMET_RADIUS_M, node.position)

        node.show = true
        node.scale = (0.24 + frac * 0.34) * activeVisitor.tailScaleMult
        Cesium.Color.clone(activeVisitor.dustColor, scratchColor)
        scratchColor.alpha = Math.max(0.01, Math.pow(1 - frac, 1.55) * 0.42 * envelope)
        node.color = scratchColor
      }
    } else {
      for (let i = 0; i < visitorDustNodes.length; i++) {
        visitorDustNodes[i].show = false
      }
    }
  }

  const spawnVisitorAndAnimate = (): void => {
    if (disposed || viewer.isDestroyed()) return
    visitorCount += 1

    // First visitor is always a deep-space comet (~1.8s after launch), then alternate comets & shooting stars
    const kind: VisitorKind = visitorCount === 1 || Math.random() < 0.58 ? 'comet' : 'meteor'

    // Compute camera basis vectors & current Earth angular radius so trajectory clears the globe limb
    const camDist = Math.max(EARTH_OCCLUSION_RADIUS_M + 1000, Cesium.Cartesian3.magnitude(camera.positionWC))
    const sinEarthHalf = Math.min(0.88, EARTH_OCCLUSION_RADIUS_M / camDist)
    const earthHalfAngle = Math.asin(sinEarthHalf)

    // Pick an open sky radial corridor outside Earth's silhouette weighted toward the wider horizontal flanks
    const clearanceAngle = earthHalfAngle + (kind === 'comet' ? 0.11 : 0.08) + Math.random() * 0.1
    const baseQuadrants = [0.22, Math.PI - 0.28, -0.25, -Math.PI + 0.3, 0.52, -0.58]
    const quadrantAngle = baseQuadrants[visitorCount % baseQuadrants.length] + (Math.random() - 0.5) * 0.24
    const maxQuadAngle = Math.abs(Math.sin(quadrantAngle)) > 0.6 ? 0.36 : 0.54
    const skyAngle = Math.min(maxQuadAngle, Math.max(0.24, clearanceAngle))

    const cosQ = Math.cos(quadrantAngle)
    const sinQ = Math.sin(quadrantAngle)
    const radialVec = new Cesium.Cartesian3()
    const tangentVec = new Cesium.Cartesian3()

    // radialVec points outward in screen sky away from Earth's disk
    Cesium.Cartesian3.multiplyByScalar(camera.rightWC, cosQ, radialVec)
    Cesium.Cartesian3.multiplyByScalar(camera.upWC, sinQ, scratchTailOffset)
    Cesium.Cartesian3.add(radialVec, scratchTailOffset, radialVec)
    Cesium.Cartesian3.normalize(radialVec, radialVec)

    // tangentVec runs roughly across the sky tangent to Earth's horizon limb
    Cesium.Cartesian3.multiplyByScalar(camera.rightWC, -sinQ, tangentVec)
    Cesium.Cartesian3.multiplyByScalar(camera.upWC, cosQ, scratchTailOffset)
    Cesium.Cartesian3.add(tangentVec, scratchTailOffset, tangentVec)
    Cesium.Cartesian3.normalize(tangentVec, tangentVec)

    // Center point on the visible sky hemisphere
    const arcCenterWorld = new Cesium.Cartesian3()
    Cesium.Cartesian3.multiplyByScalar(camera.directionWC, Math.cos(skyAngle), arcCenterWorld)
    Cesium.Cartesian3.multiplyByScalar(radialVec, Math.sin(skyAngle), scratchTailOffset)
    Cesium.Cartesian3.add(arcCenterWorld, scratchTailOffset, arcCenterWorld)
    Cesium.Cartesian3.normalize(arcCenterWorld, arcCenterWorld)

    const sweepDirWorld = new Cesium.Cartesian3()
    const signSweep = visitorCount % 2 === 0 ? 1 : -1
    Cesium.Cartesian3.multiplyByScalar(tangentVec, signSweep, sweepDirWorld)
    Cesium.Cartesian3.multiplyByScalar(radialVec, -0.22 + (Math.random() - 0.5) * 0.35, scratchTailOffset)
    Cesium.Cartesian3.add(sweepDirWorld, scratchTailOffset, sweepDirWorld)
    Cesium.Cartesian3.normalize(sweepDirWorld, sweepDirWorld)

    const halfArcRad = kind === 'comet' ? 0.26 : 0.22
    const startWorld = new Cesium.Cartesian3()
    const endWorld = new Cesium.Cartesian3()

    Cesium.Cartesian3.multiplyByScalar(sweepDirWorld, -halfArcRad, scratchTailOffset)
    Cesium.Cartesian3.add(arcCenterWorld, scratchTailOffset, startWorld)
    Cesium.Cartesian3.normalize(startWorld, startWorld)

    Cesium.Cartesian3.multiplyByScalar(sweepDirWorld, halfArcRad, scratchTailOffset)
    Cesium.Cartesian3.add(arcCenterWorld, scratchTailOffset, endWorld)
    Cesium.Cartesian3.normalize(endWorld, endWorld)

    // Transform endpoints into TEME coordinates so the comet stays celestial-anchored if user spins globe mid-flight
    const julianNow = viewer.clock.currentTime
    Cesium.Transforms.computeTemeToPseudoFixedMatrix(julianNow, scratchTemeToFixed)
    Cesium.Matrix3.transpose(scratchTemeToFixed, scratchFixedToTeme)

    const startTemeDir = Cesium.Matrix3.multiplyByVector(scratchFixedToTeme, startWorld, new Cesium.Cartesian3())
    const endTemeDir = Cesium.Matrix3.multiplyByVector(scratchFixedToTeme, endWorld, new Cesium.Cartesian3())
    const curveNormalTeme = Cesium.Matrix3.multiplyByVector(scratchFixedToTeme, radialVec, new Cesium.Cartesian3())
    Cesium.Cartesian3.normalize(startTemeDir, startTemeDir)
    Cesium.Cartesian3.normalize(endTemeDir, endTemeDir)
    Cesium.Cartesian3.normalize(curveNormalTeme, curveNormalTeme)

    // Choose anti-solar radiation vector pointing generally away from Earth-center / radial limb
    const antiSunTeme = Cesium.Cartesian3.clone(curveNormalTeme)
    Cesium.Cartesian3.lerp(antiSunTeme, Cesium.Cartesian3.negate(endTemeDir, new Cesium.Cartesian3()), 0.35, antiSunTeme)
    Cesium.Cartesian3.normalize(antiSunTeme, antiSunTeme)

    const nowMs = performance.now()
    activeVisitor = {
      kind,
      startTimeMs: nowMs,
      durationMs: kind === 'comet' ? 5400 : 1250,
      startTemeDir,
      endTemeDir,
      curveNormalTeme,
      antiSunTeme,
      tailScaleMult: kind === 'comet' ? 0.92 + Math.random() * 0.36 : 0.95 + Math.random() * 0.25,
      comaColor:
        kind === 'comet'
          ? Cesium.Color.fromCssColorString('#a5f3fc')
          : Cesium.Color.fromCssColorString('#f0f9ff'),
      ionColor:
        kind === 'comet'
          ? Cesium.Color.fromCssColorString('#38bdf8')
          : Cesium.Color.fromCssColorString('#6ee7b7'),
      dustColor: Cesium.Color.fromCssColorString('#fde68a')
    }

    const runTransitFrame = (): void => {
      if (disposed || viewer.isDestroyed() || !activeVisitor) {
        visitorRafId = null
        return
      }
      stepActiveVisitor(performance.now())
      scene.requestRender()
      if (activeVisitor) {
        visitorRafId = window.requestAnimationFrame(runTransitFrame)
      } else {
        visitorRafId = null
        scheduleNextVisitor()
      }
    }

    if (visitorRafId !== null) {
      window.cancelAnimationFrame(visitorRafId)
    }
    visitorRafId = window.requestAnimationFrame(runTransitFrame)
  }

  const scheduleNextVisitor = (): void => {
    if (disposed) return
    const delayMs = visitorCount === 0 ? 1800 : 10_500 + Math.random() * 6_500
    nextVisitorTimerId = window.setTimeout(() => {
      spawnVisitorAndAnimate()
    }, delayMs)
  }

  scheduleNextVisitor()

  // Update TEME orientation, camera-centered shell, and camera-motion illumination shimmer each rendered frame
  const onPreRender = (_scene: Cesium.Scene, time: Cesium.JulianDate): void => {
    if (disposed || viewer.isDestroyed()) return
    const nowMs = performance.now()
    const dt = Math.min(0.1, Math.max(0.001, (nowMs - lastPreRenderMs) / 1000))
    lastPreRenderMs = nowMs

    // Keep 3D star sphere aligned frame-accurately with Cesium's TEME SkyBox and centered on the camera
    Cesium.Transforms.computeTemeToPseudoFixedMatrix(time, scratchTemeToFixed)
    Cesium.Matrix4.fromRotationTranslation(
      scratchTemeToFixed,
      camera.positionWC,
      pointCollection.modelMatrix
    )
    Cesium.Matrix4.clone(pointCollection.modelMatrix, billboardCollection.modelMatrix)

    // Measure angular sweep across camera direction + camera roll/up for realistic dynamic star sparkle
    Cesium.Cartesian3.subtract(camera.directionWC, prevCamDir, scratchDeltaCam)
    const dirDelta = Cesium.Cartesian3.magnitude(scratchDeltaCam)
    Cesium.Cartesian3.subtract(camera.upWC, prevCamUp, scratchDeltaCam)
    const upDelta = Cesium.Cartesian3.magnitude(scratchDeltaCam)
    Cesium.Cartesian3.clone(camera.directionWC, prevCamDir)
    Cesium.Cartesian3.clone(camera.upWC, prevCamUp)

    const angularMove = dirDelta + upDelta * 0.65
    const instantSpeed = angularMove / dt
    sweepIntegral += angularMove * 8.5 + (activeVisitor ? dt * 0.35 : 0)

    const targetEnergy = Math.min(1.0, instantSpeed * 1.45)
    motionEnergy += (targetEnergy - motionEnergy) * Math.min(1, dt * 8.0)

    const camRight = camera.rightWC
    const camUp = camera.upWC
    const camDir = camera.directionWC

    // 4a. Modulate optical starburst scales, illumination brightness, and diffraction orientation
    for (let i = 0; i < brightStars.length; i++) {
      const s = brightStars[i]
      Cesium.Matrix3.multiplyByVector(scratchTemeToFixed, s.temeDir, scratchWorldDir)
      const forwardDot = Cesium.Cartesian3.dot(scratchWorldDir, camDir)
      if (forwardDot < 0.05) continue

      const viewX = Cesium.Cartesian3.dot(scratchWorldDir, camRight)
      const viewY = Cesium.Cartesian3.dot(scratchWorldDir, camUp)

      const sparkleWave = Math.sin(
        viewX * s.glintFreq + viewY * (s.glintFreq * 0.82) + sweepIntegral * 0.45 + s.phase
      )
      const harmonicWave = Math.cos(
        (viewX - viewY) * (s.glintFreq * 0.65) - sweepIntegral * 0.3 + s.phase * 1.7
      )
      const shimmer = 0.5 + 0.5 * (0.65 * sparkleWave + 0.35 * harmonicWave)
      const boost = 0.12 * shimmer + motionEnergy * (0.2 + 0.38 * shimmer)

      s.billboard.scale = s.baseScale * (1 + boost)
      s.billboard.rotation =
        s.baseRotation + (viewX * 0.35 - viewY * 0.25) * (0.35 + motionEnergy * 0.5)

      const litAlpha = Math.min(1.0, s.baseAlpha * (0.86 + 0.16 * shimmer + 0.24 * motionEnergy * shimmer))
      Cesium.Color.fromBytes(
        s.baseRgb[0],
        s.baseRgb[1],
        s.baseRgb[2],
        Math.round(litAlpha * 255),
        scratchColor
      )
      s.billboard.color = scratchColor
    }

    // 4b. Modulate scintillating field stars so faint desert stars twinkle gently during globe motion
    for (let i = 0; i < pointStars.length; i++) {
      const p = pointStars[i]
      Cesium.Matrix3.multiplyByVector(scratchTemeToFixed, p.temeDir, scratchWorldDir)
      const forwardDot = Cesium.Cartesian3.dot(scratchWorldDir, camDir)
      if (forwardDot < 0.08) continue

      const viewX = Cesium.Cartesian3.dot(scratchWorldDir, camRight)
      const viewY = Cesium.Cartesian3.dot(scratchWorldDir, camUp)
      const twinkle =
        0.5 + 0.5 * Math.sin(viewX * 19.0 + viewY * 15.0 + sweepIntegral * 0.65 + p.phase)

      p.point.pixelSize = p.baseSize * (1 + 0.14 * twinkle + 0.32 * motionEnergy * twinkle)
      Cesium.Color.clone(p.baseColor, scratchColor)
      scratchColor.alpha = Math.min(
        1.0,
        p.baseAlpha * (0.82 + 0.22 * twinkle + 0.2 * motionEnergy * twinkle)
      )
      p.point.color = scratchColor
    }
  }

  scene.preRender.addEventListener(onPreRender)
  scene.requestRender()

  return () => {
    disposed = true
    if (skyboxTimerId !== null) {
      window.clearTimeout(skyboxTimerId)
      skyboxTimerId = null
    }
    if (nextVisitorTimerId !== null) {
      window.clearTimeout(nextVisitorTimerId)
      nextVisitorTimerId = null
    }
    if (visitorRafId !== null) {
      window.cancelAnimationFrame(visitorRafId)
      visitorRafId = null
    }
    if (!viewer.isDestroyed()) {
      scene.preRender.removeEventListener(onPreRender)
      if (scene.primitives.contains(pointCollection)) {
        scene.primitives.remove(pointCollection)
      }
      if (scene.primitives.contains(billboardCollection)) {
        scene.primitives.remove(billboardCollection)
      }
    }
  }
}
