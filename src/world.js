// Mundo: mapa em tiles (1 tile = 1 unidade no 3D), colisão e posições de prédios, árvores, postes e flores.
export const T = 16
export const W = 112
export const H = 66

// ruas horizontais (2 linhas cada) e lagoa
export const STREET_N = 22
export const STREET_S = 50
export const POND = { cx: 13, cy: 59, rx: 8, ry: 3.2 }

const mulberry32 = (a) => () => {
  a |= 0
  a = (a + 0x6d2b79f5) | 0
  let t = Math.imul(a ^ (a >>> 15), 1 | a)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

// rot = giro em graus (0 = porta virada para o sul; positivo = porta vira para a direita/leste)
const BUILDINGS_BASE = [
  { key: 'sobre', x: 8, y: 6, w: 8, h: 5, rot: 0, icon: 'house', roof: '#c8553d', roofDark: '#9e3f2c', wall: '#f6e3c4', trim: '#8a5a3b', accent: '#f4a259' },
  { key: 'projetos', x: 28, y: 5, w: 10, h: 6, rot: 0, icon: 'gear', roof: '#e08a2e', roofDark: '#b86a1c', wall: '#ecd9b8', trim: '#6b4a2f', accent: '#5b8def' },
  { key: 'formacao', x: 52, y: 6, w: 8, h: 5, rot: -15, icon: 'book', roof: '#4f7fcf', roofDark: '#3a5fa3', wall: '#f3ead7', trim: '#5a4632', accent: '#f4c95d' },
  { key: 'skills', x: 10, y: 34, w: 8, h: 5, rot: 15, icon: 'tools', roof: '#5aa469', roofDark: '#3f7d4d', wall: '#f2e1c0', trim: '#7a5230', accent: '#e76f51' },
  { key: 'contato', x: 100, y: 34, w: 8, h: 5, rot: -10, icon: 'mail', roof: '#d9534f', roofDark: '#a93d3a', wall: '#f6ead0', trim: '#6b4a2f', accent: '#4f7fcf' },
]

// Locais de lazer: cinema, biblioteca, estádio e palco. Larguras pares.
export const LANDMARKS = [
  { key: 'cinema', x: 70, y: 5, w: 10, h: 5, rot: 75 },
  { key: 'biblioteca', x: 92, y: 6, w: 8, h: 5, rot: -20 },
  { key: 'estadio', x: 46, y: 26, w: 26, h: 22, rot: 0 },
  { key: 'palco', x: 83, y: 33, w: 8, h: 6, rot: 75 },
]

const withZone = (b) => {
  const rot = ((b.rot || 0) * Math.PI) / 180
  const cx = b.x + b.w / 2
  const cz = b.y + b.h / 2
  const fx = Math.sin(rot)
  const fz = Math.cos(rot)
  const reach = b.h / 2
  return {
    ...b,
    rot,
    cx,
    cz,
    fx,
    fz,
    doorX: cx - 1,
    door: { x: cx + fx * reach, z: cz + fz * reach }, // meio da porta
    glow: { x: cx + fx * (reach + 0.75), z: cz + fz * (reach + 0.75) }, // brilho no chão
    spot: { x: cx + fx * (reach + 1.3), z: cz + fz * (reach + 1.3) }, // onde o jogador "toca" a porta
    labelPos: { x: cx + fx * (reach + 0.4), z: cz + fz * (reach + 0.4) },
  }
}

export const BUILDINGS = BUILDINGS_BASE.map(withZone)
export const PLACES = [...BUILDINGS, ...LANDMARKS.map(withZone)]

export const START = { x: 40 * T, y: 23 * T }

// ponto (px, pz) dentro da pegada (retângulo girado) do prédio?
export const inFootprint = (b, px, pz, m = 0.35) => {
  const dx = px - b.cx
  const dz = pz - b.cz
  const lx = dx * Math.cos(b.rot) - dz * Math.sin(b.rot)
  const lz = dx * Math.sin(b.rot) + dz * Math.cos(b.rot)
  return Math.abs(lx) <= b.w / 2 + m && Math.abs(lz) <= b.h / 2 + m
}

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
  road(2, W - 3, STREET_N, STREET_N + 1) // rua de cima
  road(2, W - 3, STREET_S, STREET_S + 1) // rua de baixo
  for (const ax of [30, 76, 96]) road(ax, ax + 1, STREET_N, STREET_S + 1) // avenidas
  road(84, 85, 4, STREET_N) // rua do cinema

  // caminho de cada porta até a rua mais próxima (passa por uma pracinha na frente)
  const roads = []
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (ground[y][x] === PATH) roads.push([x + 0.5, y + 0.5])
  const stamp = (px, pz, dx, dz) => {
    for (const s of [-0.5, 0.5]) {
      const x = Math.floor(px - dz * s)
      const z = Math.floor(pz + dx * s)
      if (x >= 1 && z >= 1 && x < W - 1 && z < H - 1) ground[z][x] = PATH
    }
  }
  const line = (x0, z0, x1, z1) => {
    const L = Math.hypot(x1 - x0, z1 - z0)
    if (L < 0.01) return
    const dx = (x1 - x0) / L
    const dz = (z1 - z0) / L
    for (let t = 0; t <= L; t += 0.3) stamp(x0 + dx * t, z0 + dz * t, dx, dz)
  }
  for (const b of PLACES) {
    const sx = b.door.x + b.fx * 0.2
    const sz = b.door.z + b.fz * 0.2
    const ex = b.spot.x + b.fx * 3
    const ez = b.spot.z + b.fz * 3
    let best = roads[0]
    let bd = Infinity
    for (const r of roads) {
      const d = Math.hypot(r[0] - ex, r[1] - ez)
      if (d < bd) {
        bd = d
        best = r
      }
    }
    line(sx, sz, ex, ez)
    line(ex, ez, best[0], best[1])
  }

  // lagoa
  for (let y = STREET_S + 2; y < H; y++)
    for (let x = 0; x < W; x++) {
      const dx = (x + 0.5 - POND.cx) / POND.rx
      const dy = (y + 0.5 - POND.cy) / POND.ry
      if (dx * dx + dy * dy <= 1 && ground[y][x] !== PATH) {
        ground[y][x] = WATER
        solid[y][x] = true
      }
    }

  // bordas sólidas
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) if (x < 1 || x >= W - 1 || y < 1 || y >= H - 1) solid[y][x] = true

  // prédios sólidos (pegada girada) e área reservada ao redor
  const occupied = new Set()
  for (const b of PLACES) {
    const r = Math.hypot(b.w, b.h) / 2 + 1
    for (let y = Math.floor(b.cz - r); y <= Math.ceil(b.cz + r); y++)
      for (let x = Math.floor(b.cx - r); x <= Math.ceil(b.cx + r); x++) {
        if (x < 0 || y < 0 || x >= W || y >= H) continue
        if (inFootprint(b, x + 0.5, y + 0.5, 0.2)) solid[y][x] = true
        if (Math.hypot(x + 0.5 - b.cx, y + 0.5 - b.cz) <= r + 1.2) occupied.add(`${x},${y}`)
      }
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
    addTree(x, H - 2, kinds[Math.floor(rng() * kinds.length)])
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
  while (placed < 150 && tries++ < 3000) {
    const x = 3 + Math.floor(rng() * (W - 6))
    const y = 3 + Math.floor(rng() * (H - 6))
    if (ground[y][x] !== GRASS || solid[y][x] || occupied.has(`${x},${y}`)) continue
    // mantém ruas e acessos livres com folga
    let near = false
    for (let yy = y - 1; yy <= y + 1; yy++) for (let xx = x - 1; xx <= x + 1; xx++) if (ground[yy]?.[xx] === PATH) near = true
    if (near) continue
    if (trees.some((t) => Math.abs(t.x - x) + Math.abs(t.y - y) < 4)) continue
    addTree(x, y, kinds[Math.floor(rng() * kinds.length)])
    placed++
  }

  // postes de luz ao longo das ruas
  const lamps = []
  for (let x = 6; x < W - 4; x += 10) {
    lamps.push([x, STREET_N - 1], [x + 5, STREET_N + 2], [x, STREET_S - 1], [x + 5, STREET_S + 2])
  }
  const lampsOk = lamps.filter(([x, y]) => ground[y]?.[x] === GRASS && !solid[y][x] && !occupied.has(`${x},${y}`))
  for (const [x, y] of lampsOk) solid[y][x] = true

  // flores (decoração, não colide)
  const flowers = []
  for (let i = 0; i < 700; i++) {
    const x = 2 + Math.floor(rng() * (W - 4))
    const y = 2 + Math.floor(rng() * (H - 4))
    if (ground[y][x] !== GRASS || solid[y][x]) continue
    flowers.push({ x: x * T + 2 + Math.floor(rng() * 11), y: y * T + 3 + Math.floor(rng() * 10), c: ['#ffd166', '#ef476f', '#ffffff', '#cdb4ff'][Math.floor(rng() * 4)] })
  }

  return { ground, solid, trees, lamps: lampsOk, flowers, rng: mulberry32(99) }
}
