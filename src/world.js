// Mundo: mapa em tiles (1 tile = 1 unidade no 3D), colisão e posições de prédios, árvores, postes e flores.
export const T = 16
export const W = 72
export const H = 32

const mulberry32 = (a) => () => {
  a |= 0
  a = (a + 0x6d2b79f5) | 0
  let t = Math.imul(a ^ (a >>> 15), 1 | a)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

const BUILDINGS_BASE = [
  { key: 'sobre', x: 4, y: 3, w: 8, h: 5, icon: 'house', roof: '#c8553d', roofDark: '#9e3f2c', wall: '#f6e3c4', trim: '#8a5a3b', accent: '#f4a259' },
  { key: 'projetos', x: 19, y: 2, w: 10, h: 6, icon: 'gear', roof: '#e08a2e', roofDark: '#b86a1c', wall: '#ecd9b8', trim: '#6b4a2f', accent: '#5b8def' },
  { key: 'formacao', x: 36, y: 3, w: 8, h: 5, icon: 'book', roof: '#4f7fcf', roofDark: '#3a5fa3', wall: '#f3ead7', trim: '#5a4632', accent: '#f4c95d' },
  { key: 'skills', x: 6, y: 19, w: 8, h: 5, icon: 'tools', roof: '#5aa469', roofDark: '#3f7d4d', wall: '#f2e1c0', trim: '#7a5230', accent: '#e76f51' },
  { key: 'contato', x: 34, y: 19, w: 8, h: 5, icon: 'mail', roof: '#d9534f', roofDark: '#a93d3a', wall: '#f6ead0', trim: '#6b4a2f', accent: '#4f7fcf' },
]

// Locais de lazer (bairro leste): estádio, palco, cinema e biblioteca. Larguras pares, como nos prédios acima.
export const LANDMARKS = [
  { key: 'cinema', x: 50, y: 3, w: 10, h: 5 },
  { key: 'biblioteca', x: 62, y: 3, w: 8, h: 5 },
  { key: 'estadio', x: 50, y: 16, w: 12, h: 8 },
  { key: 'palco', x: 64, y: 19, w: 6, h: 5 },
]

const withZone = (b) => {
  const dx = b.x + b.w / 2 - 1
  return {
    ...b,
    doorX: dx, // primeira coluna da porta (porta tem 2 tiles)
    // área de interação em px (mundo)
    zone: { x: (dx - 1) * T, y: (b.y + b.h) * T - 4, w: 4 * T, h: 2 * T + 4 },
    labelX: (b.x + b.w / 2) * T,
    labelY: b.y * T + 18,
  }
}

export const BUILDINGS = BUILDINGS_BASE.map(withZone)
export const PLACES = [...BUILDINGS, ...LANDMARKS.map(withZone)]

export const START = { x: 24 * T, y: 15 * T }

// ---------- grade ----------
const GRASS = 0
const PATH = 1
const WATER = 2

export function buildWorld() {
  const rng = mulberry32(11)
  const ground = Array.from({ length: H }, () => Array(W).fill(GRASS))
  const solid = Array.from({ length: H }, () => Array(W).fill(false))

  const road = (x0, x1, y0, y1) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) ground[y][x] = PATH
  }
  road(2, W - 3, 12, 13) // rua de cima
  road(2, W - 3, 26, 27) // rua de baixo
  road(23, 24, 12, 27) // avenida central
  road(47, 48, 12, 27) // avenida leste (bairro de lazer)
  for (const b of PLACES) {
    const top = b.y + b.h
    const bottom = b.y < 10 ? 11 : 25
    road(b.doorX, b.doorX + 1, Math.min(top, bottom), Math.max(top, bottom))
    // sobre as portas do lado de baixo, o caminho vai até a rua de baixo (linha 26)
  }

  // lagoa
  const pond = { cx: 7, cy: 29.4, rx: 5, ry: 2.2 }
  for (let y = 27; y < H; y++)
    for (let x = 0; x < W; x++) {
      const dx = (x + 0.5 - pond.cx) / pond.rx
      const dy = (y + 0.5 - pond.cy) / pond.ry
      if (dx * dx + dy * dy <= 1 && ground[y][x] !== PATH) {
        ground[y][x] = WATER
        solid[y][x] = true
      }
    }

  // bordas sólidas
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) if (x < 1 || x >= W - 1 || y < 1 || y >= H - 1) solid[y][x] = true

  // prédios sólidos
  const occupied = new Set()
  for (const b of PLACES) {
    for (let y = b.y; y < b.y + b.h; y++)
      for (let x = b.x; x < b.x + b.w; x++) {
        solid[y][x] = true
      }
    for (let y = b.y - 1; y < b.y + b.h + 2; y++) for (let x = b.x - 2; x < b.x + b.w + 2; x++) occupied.add(`${x},${y}`)
  }

  // árvores de borda
  const trees = []
  const addTree = (x, y, kind) => {
    trees.push({ x, y, kind })
    solid[y][x] = true
  }
  const kinds = ['g', 'g', 'g', 'g', 'o', 'p']
  for (let x = 1; x < W - 1; x += 2) {
    addTree(x, 1, kinds[Math.floor(rng() * kinds.length)])
    if (x < 36 || x > 43) addTree(x, H - 2, kinds[Math.floor(rng() * kinds.length)])
  }
  for (let y = 3; y < H - 2; y += 2) {
    addTree(1, y, kinds[Math.floor(rng() * kinds.length)])
    addTree(W - 2, y, kinds[Math.floor(rng() * kinds.length)])
  }
  // lagoa: não deixa árvore de borda dentro da água
  for (let i = trees.length - 1; i >= 0; i--) if (ground[trees[i].y][trees[i].x] === WATER) trees.splice(i, 1)

  // árvores soltas
  let tries = 0
  let placed = 0
  while (placed < 60 && tries++ < 800) {
    const x = 3 + Math.floor(rng() * (W - 6))
    const y = 3 + Math.floor(rng() * (H - 6))
    if (ground[y][x] !== GRASS || solid[y][x] || occupied.has(`${x},${y}`)) continue
    // mantém ruas e acessos livres com folga
    let near = false
    for (let yy = y - 1; yy <= y + 1; yy++) for (let xx = x - 1; xx <= x + 1; xx++) if (ground[yy]?.[xx] === PATH) near = true
    if (near) continue
    if (trees.some((t) => Math.abs(t.x - x) + Math.abs(t.y - y) < 3)) continue
    addTree(x, y, kinds[Math.floor(rng() * kinds.length)])
    placed++
  }

  // postes de luz
  const lamps = [
    [6, 11], [16, 11], [31, 11], [45 - 2, 11],
    [4, 14], [16, 14], [31, 14], [43, 14],
    [16, 25], [31, 25], [44, 25], [4, 25],
    [49, 11], [60, 11], [69, 11], [49, 14], [60, 14], [69, 14], [49, 25], [62, 25], [69, 25],
  ].filter(([x, y]) => ground[y][x] === GRASS && !solid[y][x])
  for (const [x, y] of lamps) solid[y][x] = true

  // flores (decoração, não colide)
  const flowers = []
  for (let i = 0; i < 300; i++) {
    const x = 2 + Math.floor(rng() * (W - 4))
    const y = 2 + Math.floor(rng() * (H - 4))
    if (ground[y][x] !== GRASS || solid[y][x]) continue
    flowers.push({ x: x * T + 2 + Math.floor(rng() * 11), y: y * T + 3 + Math.floor(rng() * 10), c: ['#ffd166', '#ef476f', '#ffffff', '#cdb4ff'][Math.floor(rng() * 4)] })
  }

  return { ground, solid, trees, lamps, flowers, rng: mulberry32(99) }
}
