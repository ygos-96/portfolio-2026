// Mundo: mapa em tiles, colisão, e todos os sprites desenhados em código (pixel art, sem imagens).
export const T = 16
export const W = 48
export const H = 32

const mulberry32 = (a) => () => {
  a |= 0
  a = (a + 0x6d2b79f5) | 0
  let t = Math.imul(a ^ (a >>> 15), 1 | a)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

const canvas = (w, h) => {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const x = c.getContext('2d')
  x.imageSmoothingEnabled = false
  return [c, x]
}
const rect = (x, px, py, w, h, color) => {
  x.fillStyle = color
  x.fillRect(px, py, w, h)
}
const ellipse = (x, cx, cy, rx, ry, color) => {
  x.fillStyle = color
  for (let yy = -ry; yy <= ry; yy++) {
    const half = Math.round(rx * Math.sqrt(1 - (yy * yy) / (ry * ry + 0.0001)))
    x.fillRect(Math.round(cx - half), Math.round(cy + yy), half * 2, 1)
  }
}

export const BUILDINGS = [
  { key: 'sobre', x: 4, y: 3, w: 8, h: 5, icon: 'house', roof: '#c8553d', roofDark: '#9e3f2c', wall: '#f6e3c4', trim: '#8a5a3b', accent: '#f4a259' },
  { key: 'projetos', x: 19, y: 2, w: 10, h: 6, icon: 'gear', roof: '#e08a2e', roofDark: '#b86a1c', wall: '#ecd9b8', trim: '#6b4a2f', accent: '#5b8def' },
  { key: 'formacao', x: 36, y: 3, w: 8, h: 5, icon: 'book', roof: '#4f7fcf', roofDark: '#3a5fa3', wall: '#f3ead7', trim: '#5a4632', accent: '#f4c95d' },
  { key: 'skills', x: 6, y: 19, w: 8, h: 5, icon: 'tools', roof: '#5aa469', roofDark: '#3f7d4d', wall: '#f2e1c0', trim: '#7a5230', accent: '#e76f51' },
  { key: 'contato', x: 34, y: 19, w: 8, h: 5, icon: 'mail', roof: '#d9534f', roofDark: '#a93d3a', wall: '#f6ead0', trim: '#6b4a2f', accent: '#4f7fcf' },
].map((b) => {
  const dx = b.x + b.w / 2 - 1
  return {
    ...b,
    doorX: dx, // primeira coluna da porta (porta tem 2 tiles)
    // área de interação em px (mundo)
    zone: { x: (dx - 1) * T, y: (b.y + b.h) * T - 4, w: 4 * T, h: 2 * T + 4 },
    labelX: (b.x + b.w / 2) * T,
    labelY: b.y * T + 18,
  }
})

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
  road(2, 45, 12, 13) // rua de cima
  road(2, 45, 26, 27) // rua de baixo
  road(23, 24, 12, 27) // avenida central
  for (const b of BUILDINGS) {
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
  for (const b of BUILDINGS) {
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
  while (placed < 34 && tries++ < 800) {
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
  ].filter(([x, y]) => ground[y][x] === GRASS && !solid[y][x])
  for (const [x, y] of lamps) solid[y][x] = true

  // flores (decoração, não colide)
  const flowers = []
  for (let i = 0; i < 160; i++) {
    const x = 2 + Math.floor(rng() * (W - 4))
    const y = 2 + Math.floor(rng() * (H - 4))
    if (ground[y][x] !== GRASS || solid[y][x]) continue
    flowers.push({ x: x * T + 2 + Math.floor(rng() * 11), y: y * T + 3 + Math.floor(rng() * 10), c: ['#ffd166', '#ef476f', '#ffffff', '#cdb4ff'][Math.floor(rng() * 4)] })
  }

  return { ground, solid, trees, lamps, flowers, rng: mulberry32(99) }
}

// ---------- chão pré-renderizado ----------
export function bakeGround(world) {
  const rng = mulberry32(5)
  const [c, x] = canvas(W * T, H * T)
  const { ground } = world
  const grassA = '#86b86a'
  const grassB = '#7cae60'
  for (let ty = 0; ty < H; ty++)
    for (let tx = 0; tx < W; tx++) {
      const g = ground[ty][tx]
      const px = tx * T
      const py = ty * T
      if (g === GRASS) {
        rect(x, px, py, T, T, (tx + ty) % 2 ? grassA : grassB)
        for (let i = 0; i < 5; i++) {
          const gx = px + Math.floor(rng() * 14)
          const gy = py + Math.floor(rng() * 14)
          rect(x, gx, gy, 1, 2, rng() > 0.5 ? '#6a9c52' : '#9ccb7e')
        }
      } else if (g === PATH) {
        rect(x, px, py, T, T, '#ead7a8')
        for (let i = 0; i < 4; i++) rect(x, px + Math.floor(rng() * 14), py + Math.floor(rng() * 14), 2, 1, rng() > 0.5 ? '#d9c28b' : '#f4e6c1')
        const n = (dx, dy) => ground[ty + dy]?.[tx + dx] !== PATH
        if (n(0, -1)) rect(x, px, py, T, 2, '#c9ae74')
        if (n(0, 1)) rect(x, px, py + T - 2, T, 2, '#c9ae74')
        if (n(-1, 0)) rect(x, px, py, 2, T, '#c9ae74')
        if (n(1, 0)) rect(x, px + T - 2, py, 2, T, '#c9ae74')
      } else {
        rect(x, px, py, T, T, '#5aa7d6')
        for (let i = 0; i < 3; i++) rect(x, px + Math.floor(rng() * 12), py + Math.floor(rng() * 14), 4, 1, '#9fd3ee')
        const n = (dx, dy) => ground[ty + dy]?.[tx + dx] !== WATER
        if (n(0, -1)) rect(x, px, py, T, 3, '#e6d29a')
        if (n(0, 1)) rect(x, px, py + T - 2, T, 2, '#3f8ab8')
        if (n(-1, 0)) rect(x, px, py, 3, T, '#e6d29a')
        if (n(1, 0)) rect(x, px + T - 3, py, 3, T, '#e6d29a')
      }
    }
  // flores
  for (const f of world.flowers) {
    rect(x, f.x, f.y, 2, 2, f.c)
    rect(x, f.x, f.y + 2, 1, 2, '#4d8a3c')
  }
  // sombras dos prédios
  for (const b of BUILDINGS) {
    x.fillStyle = 'rgba(40,50,30,.28)'
    x.fillRect(b.x * T + 3, (b.y + b.h) * T - 5, b.w * T, 9)
  }
  return c
}

// ---------- ícones 9x9 ----------
const ICONS = {
  house: ['....#....', '...###...', '..#####..', '.#######.', '#########', '.##...##.', '.##.#.##.', '.##.#.##.', '.#######.'],
  gear: ['...###...', '.#.###.#.', '.#######.', '####.####', '###...###', '####.####', '.#######.', '.#.###.#.', '...###...'],
  book: ['.#######.', '#.#####.#', '#.#...#.#', '#.#.#.#.#', '#.#...#.#', '#.#####.#', '#.......#', '.#######.', '.........'],
  tools: ['.......##', '......###', '.....###.', '....###..', '.#.###...', '.####....', '..###....', '.#.##....', '##.......'],
  mail: ['#########', '##.....##', '#.#...#.#', '#..#.#..#', '#...#...#', '#.......#', '#.......#', '#########', '.........'],
}
const drawIcon = (x, kind, px, py, color) => {
  ICONS[kind].forEach((row, j) => {
    for (let i = 0; i < row.length; i++) if (row[i] === '#') rect(x, px + i, py + j, 1, 1, color)
  })
}

// ---------- sprites ----------
const PAD = 10 // folga no topo do sprite (chaminé)

export function makeBuilding(b) {
  const w = b.w * T
  const h = b.h * T
  const [c, x] = canvas(w, h + PAD)
  const wallH = b.h > 5 ? 40 : 32
  const roofH = h - wallH
  const oy = PAD
  // parede
  rect(x, 0, oy + roofH, w, wallH, b.wall)
  rect(x, 0, oy + h - 4, w, 4, b.trim)
  for (let i = 0; i < w; i += 8) rect(x, i, oy + roofH + 6, 1, wallH - 10, 'rgba(0,0,0,.05)')
  // chaminé
  rect(x, w - 26, oy - 8, 9, 16, '#a45a46')
  rect(x, w - 27, oy - 9, 11, 3, '#7d4030')
  rect(x, w - 24, oy - 8, 2, 14, '#bf7660')
  // telhado
  rect(x, -0, oy, w, roofH + 4, b.roof)
  for (let row = 0; row < roofH + 4; row += 6) {
    rect(x, 0, oy + row + 5, w, 1, b.roofDark)
    for (let col = (row / 6) % 2 ? 4 : 0; col < w; col += 8) rect(x, col, oy + row, 1, 6, b.roofDark)
  }
  rect(x, 0, oy, w, 2, 'rgba(255,255,255,.28)')
  rect(x, 0, oy + roofH + 1, w, 3, b.roofDark)
  rect(x, 0, oy + roofH + 4, w, 3, 'rgba(0,0,0,.18)') // sombra do beiral
  rect(x, 0, oy, 2, roofH + 4, b.roofDark)
  rect(x, w - 2, oy, 2, roofH + 4, b.roofDark)
  // janelas
  const win = (wx) => {
    const wy = oy + roofH + 10
    rect(x, wx - 1, wy - 1, 14, 14, b.trim)
    rect(x, wx, wy, 12, 12, '#a9dcf2')
    rect(x, wx, wy, 12, 4, '#c8eefb')
    rect(x, wx + 5, wy, 2, 12, b.trim)
    rect(x, wx, wy + 5, 12, 2, b.trim)
    rect(x, wx - 2, wy + 12, 16, 3, b.accent) // floreira
    rect(x, wx, wy + 12, 3, 1, '#ef476f')
    rect(x, wx + 6, wy + 12, 3, 1, '#ffd166')
  }
  win(Math.round(w * 0.16))
  win(Math.round(w * 0.84) - 12)
  // porta (2 tiles)
  const dw = 32
  const dxp = w / 2 - dw / 2
  const dy = oy + h - 26
  rect(x, dxp - 3, dy - 3, dw + 6, 29, b.trim)
  rect(x, dxp, dy, dw, 26, '#8b5a3a')
  rect(x, dxp, dy, dw, 4, '#a06a45')
  rect(x, dxp + 15, dy, 2, 26, '#6e452a')
  rect(x, dxp + 3, dy + 6, 10, 8, '#a9dcf2')
  rect(x, dxp + 19, dy + 6, 10, 8, '#a9dcf2')
  rect(x, dxp + 12, dy + 13, 2, 2, '#ffd166')
  rect(x, dxp + 18, dy + 13, 2, 2, '#ffd166')
  rect(x, dxp - 4, oy + h - 1, dw + 8, 3, '#c9c3b8') // degrau
  // placa com ícone
  const sx = w / 2 - 12
  const sy = oy + roofH - 10
  rect(x, sx - 1, sy - 1, 26, 17, '#4a3222')
  rect(x, sx, sy, 24, 15, '#f6d78f')
  drawIcon(x, b.icon, sx + 8, sy + 3, '#3b2a1a')
  rect(x, sx + 3, sy - 4, 1, 3, '#4a3222')
  rect(x, sx + 20, sy - 4, 1, 3, '#4a3222')
  return c
}

export function makeTree(kind) {
  const [c, x] = canvas(28, 36)
  const pal = {
    g: ['#3f8f4f', '#4fa860', '#2e7040'],
    o: ['#e0912f', '#f2ac4a', '#bf7420'],
    p: ['#f19cc0', '#f7b9d3', '#d77da4'],
  }[kind]
  ellipse(x, 14, 33, 8, 2, 'rgba(0,0,0,.22)')
  rect(x, 12, 22, 5, 12, '#7a4f2d')
  rect(x, 12, 22, 2, 12, '#946339')
  ellipse(x, 14, 14, 12, 11, pal[2])
  ellipse(x, 13, 12, 11, 10, pal[0])
  ellipse(x, 10, 8, 6, 5, pal[1])
  ellipse(x, 18, 15, 3, 2, pal[2])
  rect(x, 8, 6, 2, 2, 'rgba(255,255,255,.35)')
  return c
}

export function makeLamp() {
  const [c, x] = canvas(12, 30)
  ellipse(x, 6, 28, 4, 1, 'rgba(0,0,0,.22)')
  rect(x, 5, 10, 2, 18, '#3d3a44')
  rect(x, 3, 26, 6, 2, '#3d3a44')
  rect(x, 2, 3, 8, 8, '#ffe9a8')
  rect(x, 2, 2, 8, 2, '#3d3a44')
  rect(x, 2, 10, 8, 2, '#3d3a44')
  rect(x, 4, 5, 4, 4, '#fff6d1')
  return c
}

// ---------- personagem ----------
export function drawPlayer(ctx, px, py, dir, frame) {
  const x = Math.round(px)
  const y = Math.round(py)
  const step = frame === 1 ? 1 : frame === 2 ? -1 : 0
  const bob = frame === 0 ? 0 : 1
  ellipse(ctx, x, y - 1, 6, 2, 'rgba(0,0,0,.25)')
  const skin = '#f0c9a0'
  const hair = '#3a2a22'
  const hood = '#4f7fcf'
  const hoodD = '#3a5fa3'
  const pants = '#35384f'
  const shoe = '#f2f2f2'
  const phone = '#2d2a32'
  const side = dir === 'left' || dir === 'right'
  // pernas
  if (side) {
    rect(ctx, x - 3 + step, y - 6, 3, 5, pants)
    rect(ctx, x + 0 - step, y - 6, 3, 5, pants)
    rect(ctx, x - 3 + step, y - 2, 4, 2, shoe)
    rect(ctx, x + 0 - step, y - 2, 4, 2, shoe)
  } else {
    rect(ctx, x - 4, y - 6 - (step > 0 ? 1 : 0), 3, 5 + (step > 0 ? 1 : 0), pants)
    rect(ctx, x + 1, y - 6 - (step < 0 ? 1 : 0), 3, 5 + (step < 0 ? 1 : 0), pants)
    rect(ctx, x - 4, y - 2, 3, 2, shoe)
    rect(ctx, x + 1, y - 2, 3, 2, shoe)
  }
  const by = y - 14 - bob
  // corpo (moletom)
  rect(ctx, x - 5, by, 10, 9, hood)
  rect(ctx, x - 5, by + 7, 10, 2, hoodD)
  if (dir === 'down') rect(ctx, x - 1, by + 1, 2, 5, hoodD)
  // braços
  if (side) {
    rect(ctx, x - 1 + (dir === 'left' ? -step : step), by + 2, 3, 6, hoodD)
  } else {
    rect(ctx, x - 7, by + 2 + (step > 0 ? 1 : 0), 2, 6, hoodD)
    rect(ctx, x + 5, by + 2 + (step < 0 ? 1 : 0), 2, 6, hoodD)
    rect(ctx, x - 7, by + 8 + (step > 0 ? 1 : 0), 2, 1, skin)
    rect(ctx, x + 5, by + 8 + (step < 0 ? 1 : 0), 2, 1, skin)
  }
  // cabeça
  const hy = by - 9
  rect(ctx, x - 4, hy + 1, 8, 8, skin)
  rect(ctx, x - 3, hy, 6, 1, skin)
  // cabelo
  if (dir === 'up') {
    rect(ctx, x - 5, hy - 1, 10, 9, hair)
    rect(ctx, x - 4, hy - 2, 8, 1, hair)
  } else {
    rect(ctx, x - 5, hy - 1, 10, 4, hair)
    rect(ctx, x - 4, hy - 2, 8, 1, hair)
    if (dir === 'down') {
      rect(ctx, x - 5, hy + 2, 2, 3, hair)
      rect(ctx, x + 3, hy + 2, 2, 3, hair)
    } else if (dir === 'left') {
      rect(ctx, x + 1, hy + 1, 4, 5, hair)
    } else {
      rect(ctx, x - 5, hy + 1, 4, 5, hair)
    }
  }
  // rosto
  if (dir === 'down') {
    rect(ctx, x - 3, hy + 4, 2, 2, '#2d2a32')
    rect(ctx, x + 1, hy + 4, 2, 2, '#2d2a32')
    rect(ctx, x - 1, hy + 7, 2, 1, '#c98a6a')
  } else if (dir === 'left') {
    rect(ctx, x - 3, hy + 4, 2, 2, '#2d2a32')
  } else if (dir === 'right') {
    rect(ctx, x + 1, hy + 4, 2, 2, '#2d2a32')
  }
  // fone de ouvido
  rect(ctx, x - 5, hy - 2, 10, 1, phone)
  if (dir === 'down' || dir === 'up') {
    rect(ctx, x - 6, hy + 2, 2, 4, phone)
    rect(ctx, x + 4, hy + 2, 2, 4, phone)
  } else {
    rect(ctx, x - 1, hy + 2, 3, 4, phone)
  }
}
