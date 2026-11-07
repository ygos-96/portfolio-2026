// Interiores dos prédios: cada lugar vira uma sala quadrada (estilo Habbo), com um tema só dele.
// A Casa é a única com os gostos pessoais do Ygor (setup gamer, NBA com fotos reais, Palmeiras e heróis).
// Os assuntos ficam em objetos que têm a ver com cada um (PC, cavalete, degraus da carreira, troféus...):
// ao ficar no círculo brilhante do chão, o jogador abre a ficha daquele assunto.
// Os helpers de material/contorno vêm do motor (game3d.js) para manter o mesmo visual do mapa.
import * as THREE from 'three'
import { ART, floorTex, wallTex } from './roomart.js'

export const ROOM_W = 14
export const ROOM_D = 10
const WALL_H = 4.6

// piso, parede, rodapé, destaque e fundo de cada sala
const THEMES = {
  sobre: { floorKind: 'planks', floor: ['#c99a5b', '#b88748'], wallKind: 'paper', wall: ['#f6e3c4', '#efd5a8'], trim: '#8a5a3b', accent: '#c8553d', bg: '#3b2a1a' },
  projetos: { floorKind: 'concrete', floor: ['#9aa0a8', '#8d939c'], wallKind: 'brick', wall: ['#b5654a', '#a35840'], trim: '#4a4f58', accent: '#e08a2e', bg: '#1f1d26' },
  formacao: { floorKind: 'tile', floor: ['#e6d8b4', '#d3c196'], wallKind: 'panel', wall: ['#cfe0f5', '#a77c52'], trim: '#2f4f8a', accent: '#3a5fa3', bg: '#1f2a44' },
  skills: { floorKind: 'lab', floor: ['#eef4f0', '#dbe8e0'], wallKind: 'grid', wall: ['#cfeede', '#a8d8c0'], trim: '#2f6b4a', accent: '#2f6b4a', bg: '#0c2217' },
  contato: { floorKind: 'tile', floor: ['#efe0bf', '#e0cba2'], wallKind: 'stripes', wall: ['#f6ead0', '#ecd9b2'], trim: '#a93d3a', accent: '#a93d3a', bg: '#3a1614' },
  estadio: { floorKind: 'tile', floor: ['#d7dbe0', '#c4c9d0'], wallKind: 'stripes', wall: ['#0a7b45', '#0d8f51'], trim: '#ffffff', accent: '#0a7b45', bg: '#06301c' },
  cinema: { floorKind: 'carpet', floor: ['#5a1f2f', '#7a2c40'], wallKind: 'panel', wall: ['#2a1f3d', '#4a2f2a'], trim: '#ffd166', accent: '#d9304f', bg: '#0c0814' },
  biblioteca: { floorKind: 'planks', floor: ['#a9774b', '#8f623a'], wallKind: 'panel', wall: ['#efe2c4', '#8a5a3b'], trim: '#6b4a2f', accent: '#3f7d4d', bg: '#2a1c10' },
}

const loader = new THREE.TextureLoader()

export function buildRoom(key, h) {
  const th = THEMES[key]
  const group = new THREE.Group()
  const solids = []
  const hotspots = []
  const markers = []
  const animated = []
  const cache = new Map()
  const art = (name, ...args) => {
    const k = name + args.join('|')
    if (!cache.has(k)) cache.set(k, ART[name](...args))
    return cache.get(k)
  }
  // foto real (public/photos): recorta para caber no quadro, como um "object-fit: cover"
  const photo = (slug, fa, crop = {}) => {
    const k = `photo:${slug}:${fa}`
    if (cache.has(k)) return cache.get(k)
    const t = loader.load(`/photos/${slug}.jpg`, (tx) => {
      const ia = tx.image.width / tx.image.height
      const zoom = crop.zoom || 1
      let rx = 1
      let ry = 1
      if (ia > fa) rx = fa / ia
      else ry = ia / fa
      rx /= zoom
      ry /= zoom
      tx.repeat.set(rx, ry)
      tx.offset.set((1 - rx) * (crop.cx ?? 0.5), (1 - ry) * (1 - (crop.cy ?? 0.5)))
    })
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 4
    cache.set(k, t)
    return t
  }

  const add = (o) => {
    o.traverse((m) => {
      if (m.isMesh && (m.material.isMeshBasicMaterial || /Plane|Ring|Circle/.test(m.geometry.type))) m.userData.noOutline = true
    })
    group.add(o)
    return o
  }
  const tm = (map, extra) => new THREE.MeshToonMaterial({ map, gradientMap: h.ramp, ...extra })
  // caixa: (x, z) é o centro no chão e y é a base
  const bx = (x, y, z, w, hh, d, color, solid = false) => {
    const m = add(h.mesh(new THREE.BoxGeometry(w, hh, d), color, x, y + hh / 2, z))
    if (solid) solids.push({ x0: x - w / 2, x1: x + w / 2, z0: z - d / 2, z1: z + d / 2 })
    return m
  }
  const cy = (x, y, z, r, hh, color, seg = 12, r2 = r) => add(h.mesh(new THREE.CylinderGeometry(r2, r, hh, seg), color, x, y + hh / 2, z))
  const ball = (x, y, z, r, color) => add(h.mesh(new THREE.SphereGeometry(r, 12, 9), color, x, y, z))
  const glow = (x, y, z, w, hh, d, color) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, hh, d), new THREE.MeshBasicMaterial({ color }))
    m.position.set(x, y + hh / 2, z)
    return add(m)
  }
  const rgb = (x, y, z, w, hh, d, phase = 0) => {
    const m = glow(x, y, z, w, hh, d, '#ff00aa')
    animated.push({ o: m, rgb: true, phase })
    return m
  }
  const flat = (map, x, y, z, w, d) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ map, transparent: true }))
    m.rotation.x = -Math.PI / 2
    m.position.set(x, y, z)
    return add(m)
  }
  const solid = (x, z, w, d) => solids.push({ x0: x - w / 2, x1: x + w / 2, z0: z - d / 2, z1: z + d / 2 })
  const screen = (map, x, y, z, w, hh) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, hh), new THREE.MeshBasicMaterial({ map }))
    m.position.set(x, y, z)
    return add(m)
  }

  // ----- piso, paredes e rodapé (com textura) -----
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_W, ROOM_D), tm(floorTex(th.floorKind, th.floor, ROOM_W, ROOM_D)))
  floor.rotation.x = -Math.PI / 2
  floor.position.set(ROOM_W / 2, 0.01, ROOM_D / 2)
  floor.receiveShadow = true
  add(floor)
  bx(ROOM_W / 2, -0.4, ROOM_D / 2, ROOM_W + 0.8, 0.4, ROOM_D + 0.8, th.trim)

  bx(ROOM_W / 2, 0, -0.15, ROOM_W + 0.6, WALL_H, 0.3, th.wall[0])
  bx(-0.15, 0, ROOM_D / 2, 0.3, WALL_H, ROOM_D, th.wall[0])
  bx(ROOM_W + 0.15, 0, ROOM_D / 2, 0.3, WALL_H, ROOM_D, th.wall[0])
  const wallPlane = (w, tx, pos, ry) => {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(w, WALL_H), tm(tx))
    p.position.set(...pos)
    p.rotation.y = ry
    p.receiveShadow = true
    add(p)
  }
  wallPlane(ROOM_W, wallTex(th.wallKind, ROOM_W, WALL_H, th.wall), [ROOM_W / 2, WALL_H / 2, 0.005], 0)
  wallPlane(ROOM_D, wallTex(th.wallKind, ROOM_D, WALL_H, th.wall), [0.005, WALL_H / 2, ROOM_D / 2], Math.PI / 2)
  wallPlane(ROOM_D, wallTex(th.wallKind, ROOM_D, WALL_H, th.wall), [ROOM_W - 0.005, WALL_H / 2, ROOM_D / 2], -Math.PI / 2)
  bx(ROOM_W / 2, 0, 0.09, ROOM_W, 0.4, 0.18, th.trim)
  bx(0.09, 0, ROOM_D / 2, 0.18, 0.4, ROOM_D, th.trim)
  bx(ROOM_W - 0.09, 0, ROOM_D / 2, 0.18, 0.4, ROOM_D, th.trim)
  bx(ROOM_W / 2, WALL_H, -0.15, ROOM_W + 0.6, 0.18, 0.5, th.trim)
  bx(-0.15, WALL_H, ROOM_D / 2, 0.5, 0.18, ROOM_D, th.trim)
  bx(ROOM_W + 0.15, WALL_H, ROOM_D / 2, 0.5, 0.18, ROOM_D, th.trim)

  // ----- itens de parede -----
  // wall: 'back' (voltada para +z), 'left' (para +x) ou 'right' (para -x); along = x (ou z) ao longo da parede
  const wp = (wall, along, y, d) => (wall === 'back' ? [along, y, d] : wall === 'left' ? [d, y, along] : [ROOM_W - d, y, along])
  const wry = { back: 0, left: Math.PI / 2, right: -Math.PI / 2 }
  const frameBox = (wall, along, y, w, hh, color) => {
    const fr = h.mesh(new THREE.BoxGeometry(w + 0.26, hh + 0.26, 0.1), color, ...wp(wall, along, y, 0.05))
    fr.rotation.y = wry[wall]
    add(fr)
  }
  const wallArt = (wall, along, y, w, hh, map, border = th.trim) => {
    frameBox(wall, along, y, w, hh, border)
    const pl = new THREE.Mesh(new THREE.PlaneGeometry(w, hh), new THREE.MeshBasicMaterial({ map }))
    pl.position.set(...wp(wall, along, y, 0.11))
    pl.rotation.y = wry[wall]
    add(pl)
  }
  // foto real emoldurada (moldura branca de revelação, em contraste com o cenário de desenho)
  const photoWall = (wall, along, y, w, hh, slug, crop) => wallArt(wall, along, y, w, hh, photo(slug, w / hh, crop), '#f4efe3')
  const decal = (wall, along, y, w, hh, map) => {
    const pl = new THREE.Mesh(new THREE.PlaneGeometry(w, hh), new THREE.MeshBasicMaterial({ map, transparent: true }))
    pl.position.set(...wp(wall, along, y, 0.07))
    pl.rotation.y = wry[wall]
    add(pl)
  }
  const sign = (wall, along, y, w, hh, text, bg, fg) => {
    frameBox(wall, along, y, w, hh, bg)
    const pl = h.textSign(text, w, hh, bg, fg)
    pl.position.set(...wp(wall, along, y, 0.11))
    pl.rotation.y = wry[wall]
    add(pl)
  }
  const windowAt = (wall, along, y, w, hh) => {
    wallArt(wall, along, y, w, hh, art('sky'), '#ffffff')
    for (const [bw, bh] of [[w, 0.08], [0.08, hh]]) {
      const bar = h.mesh(new THREE.BoxGeometry(bw, bh, 0.06), '#ffffff', ...wp(wall, along, y, 0.16))
      bar.rotation.y = wry[wall]
      add(bar)
    }
  }
  const clock = (wall, along, y) => {
    const f = h.mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.1, 16), '#3b2a1a', ...wp(wall, along, y, 0.08))
    f.rotation.set(wall === 'back' ? Math.PI / 2 : 0, 0, wall === 'back' ? 0 : Math.PI / 2)
    add(f)
    const face = new THREE.Mesh(new THREE.CircleGeometry(0.34, 16), new THREE.MeshBasicMaterial({ color: '#fffaf0' }))
    face.position.set(...wp(wall, along, y, 0.14))
    face.rotation.y = wry[wall]
    add(face)
  }

  // ----- hotspots: círculo brilhante no chão + diamante flutuante -----
  const hot = (id, label, x, z, pick) => {
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.55, 0.85, 28), new THREE.MeshBasicMaterial({ color: '#ffd166', transparent: true, opacity: 0.85, side: THREE.DoubleSide }))
    ring.rotation.x = -Math.PI / 2
    ring.position.set(x, 0.05, z)
    add(ring)
    const dia = new THREE.Mesh(new THREE.OctahedronGeometry(0.26), new THREE.MeshBasicMaterial({ color: '#ffd166' }))
    dia.position.set(x, 1.6, z)
    add(dia)
    markers.push({ dia, ring, y: 1.6, phase: hotspots.length })
    hotspots.push({ id, label, x, z, r: 1.15, pick, kind: 'info' })
  }
  const mat = h.textSign('SAÍDA', 2.6, 0.9, th.accent, '#fff6e5')
  mat.rotation.x = -Math.PI / 2
  mat.position.set(ROOM_W / 2, 0.03, ROOM_D - 1.0)
  add(mat)
  hotspots.push({ id: 'exit', label: '', x: ROOM_W / 2, z: ROOM_D - 1.0, r: 0.9, kind: 'exit' })

  // ----- objetos -----
  const rug = (x, z, w, d, c1, c2) => flat(art('rug', c1, c2), x, 0.03, z, w, d)
  const plant = (x, z, big = false) => {
    cy(x, 0, z, 0.34, 0.5, '#b5654a', 10, 0.26)
    ball(x, 1.0, z, big ? 0.7 : 0.55, '#3f9a3a')
    ball(x + 0.22, 1.5, z - 0.1, big ? 0.5 : 0.36, '#5fbf4a')
    ball(x - 0.25, 1.3, z + 0.12, 0.3, '#2f8a34')
    solid(x, z, 0.7, 0.7)
  }
  const lamp = (x, z, color = '#ffd166') => {
    cy(x, 0, z, 0.2, 0.1, '#3b2a1a')
    cy(x, 0.1, z, 0.05, 1.5, '#3b2a1a', 6)
    cy(x, 1.5, z, 0.36, 0.45, color, 10, 0.24)
  }
  const sofa = (x, z, w, d, color) => {
    bx(x, 0, z, w, 0.5, d, color, true)
    bx(x, 0.5, z - d / 2 + 0.2, w, 0.8, 0.4, color)
    for (const s of [-1, 1]) bx(x + (s * (w - 0.3)) / 2, 0.5, z, 0.3, 0.55, d, color)
  }
  const desk = (x, z, w, d, color = '#8a5a3b') => {
    bx(x, 0.7, z, w, 0.14, d, color, true)
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) bx(x + sx * (w / 2 - 0.12), 0, z + sz * (d / 2 - 0.12), 0.14, 0.7, 0.14, '#5a341c')
  }
  const monitor = (x, y, z, map, w = 1.3, hh = 0.9) => {
    bx(x, y, z, w, hh, 0.1, '#1c1526')
    screen(map, x, y + hh / 2, z + 0.06, w - 0.14, hh - 0.14)
    bx(x, y - 0.14, z, 0.16, 0.16, 0.12, '#1c1526')
    bx(x, y - 0.2, z, 0.5, 0.06, 0.3, '#1c1526')
  }
  const laptop = (x, y, z, map) => {
    bx(x, y, z, 0.7, 0.04, 0.5, '#9aa0a6')
    bx(x, y + 0.04, z - 0.22, 0.7, 0.45, 0.03, '#2d2a32')
    screen(map, x, y + 0.27, z - 0.2, 0.62, 0.37)
  }
  const keyboard = (x, y, z) => {
    bx(x, y, z, 0.9, 0.05, 0.3, '#2a2a35')
    const k = new THREE.Mesh(new THREE.PlaneGeometry(0.86, 0.26), new THREE.MeshBasicMaterial({ map: art('keys') }))
    k.rotation.x = -Math.PI / 2
    k.position.set(x, y + 0.06, z)
    add(k)
  }
  const mug = (x, y, z, color) => {
    cy(x, y, z, 0.12, 0.2, color, 10)
    add(h.mesh(new THREE.TorusGeometry(0.07, 0.02, 6, 10), color, x + 0.14, y + 0.1, z))
  }
  const duck = (x, y, z) => {
    ball(x, y + 0.14, z, 0.16, '#ffd400')
    ball(x + 0.1, y + 0.3, z, 0.1, '#ffd400')
    bx(x + 0.2, y + 0.29, z, 0.1, 0.04, 0.07, '#ff8c1a')
  }
  const headphones = (x, y, z, color = '#ff6bd6') => {
    add(h.mesh(new THREE.TorusGeometry(0.2, 0.03, 6, 14, Math.PI), '#1c1526', x, y + 0.2, z))
    for (const s of [-1, 1]) cy(x + s * 0.2, y + 0.06, z, 0.08, 0.1, color, 8)
  }
  const tattooMachine = (x, y, z) => {
    bx(x, y, z, 0.34, 0.05, 0.14, '#c9ced6')
    for (const dx of [-0.07, 0.08]) cy(x + dx, y + 0.05, z, 0.05, 0.14, '#b3202e', 8)
    bx(x + 0.3, y + 0.03, z, 0.34, 0.05, 0.05, '#2d2a32')
    bx(x + 0.5, y + 0.02, z, 0.1, 0.03, 0.03, '#9aa0a6')
  }
  const figurine = (x, y, z, body, accent, cape) => {
    bx(x - 0.07, y, z, 0.1, 0.22, 0.1, accent)
    bx(x + 0.07, y, z, 0.1, 0.22, 0.1, accent)
    bx(x, y + 0.22, z, 0.3, 0.3, 0.16, body)
    ball(x, y + 0.67, z, 0.17, body)
    if (cape) bx(x, y + 0.22, z - 0.1, 0.32, 0.42, 0.03, cape)
  }
  const basketball = (x, y, z, r = 0.3) => {
    const b = add(h.mesh(new THREE.SphereGeometry(r, 20, 14), tm(art('basketball'), { shininess: 0 }), x, y, z))
    b.rotation.y = 1
  }
  const soccer = (x, y, z, r = 0.28) => add(h.mesh(new THREE.SphereGeometry(r, 20, 14), tm(art('soccer')), x, y, z))
  const trophy = (x, y, z, s = 1, color = '#e3b341') => {
    bx(x, y, z, 0.5 * s, 0.14 * s, 0.5 * s, '#3b2a1a')
    cy(x, y + 0.14 * s, z, 0.06 * s, 0.4 * s, color, 8)
    cy(x, y + 0.5 * s, z, 0.3 * s, 0.38 * s, color, 12, 0.12 * s)
    for (const sd of [-1, 1]) add(h.mesh(new THREE.TorusGeometry(0.14 * s, 0.025 * s, 6, 10), color, x + sd * 0.3 * s, y + 0.7 * s, z))
  }
  const pig = (x, z, s = 1) => {
    ball(x, 0.6 * s, z, 0.55 * s, '#0a7b45')
    ball(x, 0.8 * s, z + 0.5 * s, 0.34 * s, '#ffffff')
    cy(x, 0.72 * s, z + 0.82 * s, 0.14 * s, 0.1 * s, '#f4a6b8', 10).rotation.x = Math.PI / 2
    for (const sd of [-1, 1]) {
      bx(x + sd * 0.22 * s, 1.05 * s, z + 0.5 * s, 0.14 * s, 0.2 * s, 0.06 * s, '#0a7b45')
      cy(x + sd * 0.3 * s, 0, z - 0.1 * s, 0.1 * s, 0.25 * s, '#ffffff', 6)
    }
    solid(x, z, 1.1 * s, 1.1 * s)
  }
  const cat = (x, z) => {
    const body = add(h.mesh(new THREE.SphereGeometry(0.4, 12, 9), '#d9a066', x, 0.28, z))
    body.scale.set(1.3, 0.7, 1)
    ball(x + 0.5, 0.32, z + 0.05, 0.22, '#d9a066')
    for (const sd of [-1, 1]) bx(x + 0.55, 0.52, z + 0.05 + sd * 0.12, 0.08, 0.12, 0.06, '#d9a066')
    bx(x - 0.55, 0.15, z + 0.35, 0.5, 0.1, 0.1, '#c58b52')
    for (const sd of [-1, 1]) bx(x + 0.62, 0.34, z + 0.05 + sd * 0.07, 0.02, 0.03, 0.02, '#2d2a32')
  }
  const beanbag = (x, z, color) => {
    add(h.mesh(new THREE.SphereGeometry(0.7, 12, 9), color, x, 0.42, z)).scale.set(1, 0.62, 1)
    solid(x, z, 1.2, 1.2)
  }
  const globe = (x, z) => {
    cy(x, 0, z, 0.3, 0.1, '#3b2a1a')
    cy(x, 0.1, z, 0.05, 0.7, '#3b2a1a', 6)
    ball(x, 1.15, z, 0.4, '#3a8fd8')
    ball(x + 0.1, 1.2, z + 0.28, 0.16, '#5fbf4a')
    solid(x, z, 0.6, 0.6)
  }
  const bookStack = (x, y, z, n) => {
    const cs = ['#e63946', '#2a9d8f', '#f4a261', '#4f7fcf', '#9b5de5']
    for (let i = 0; i < n; i++) bx(x + (i % 2) * 0.04, y + i * 0.16, z, 0.7 - i * 0.04, 0.15, 0.5, cs[i % 5])
  }
  const shelf = (x, z, w, d, rows, cols, extras) => {
    bx(x, 0, z, w, 2.6, d, '#6b4a2f', true)
    for (let r = 0; r < rows; r++) {
      bx(x, 0.1 + r * 0.8, z + 0.04, w - 0.1, 0.06, d - 0.04, '#8a5a3b')
      for (let c = 0; c < cols; c++) bx(x - w / 2 + 0.35 + c * ((w - 0.6) / cols), 0.18 + r * 0.8, z + d / 2 - 0.05, 0.22, 0.6, 0.12, ['#e63946', '#2a9d8f', '#f4a261', '#4f7fcf', '#9b5de5'][(r + c) % 5])
    }
    extras?.()
  }
  // estante encostada na parede da esquerda ou da direita (os livros ficam voltados para a sala)
  const sideShelf = (xWall, z, d, rows, cols, dir) => {
    bx(xWall, 0, z, 0.9, 2.6, d, '#6b4a2f', true)
    for (let r = 0; r < rows; r++) {
      bx(xWall, 0.1 + r * 0.8, z, 0.85, 0.06, d - 0.04, '#8a5a3b')
      for (let c = 0; c < cols; c++) bx(xWall + dir * 0.42, 0.18 + r * 0.8, z - d / 2 + 0.3 + c * ((d - 0.6) / cols), 0.12, 0.6, 0.22, ['#e63946', '#2a9d8f', '#f4a261', '#4f7fcf', '#9b5de5'][(r + c) % 5])
    }
  }
  const rack = (x, z, led) => {
    bx(x, 0, z, 1.1, 2.6, 0.9, '#2d2a32', true)
    for (let i = 0; i < 5; i++) {
      animated.push({ o: glow(x - 0.3, 0.4 + i * 0.45, z + 0.46, 0.12, 0.1, 0.02, i % 2 ? '#7cfc7c' : led), phase: i + x })
      bx(x + 0.1, 0.38 + i * 0.45, z + 0.46, 0.6, 0.06, 0.02, '#4a4455')
    }
  }
  const seatRow = (x, z, n, color) => {
    for (let i = 0; i < n; i++) {
      bx(x + i * 0.95, 0, z, 0.8, 0.5, 0.8, color)
      bx(x + i * 0.95, 0.5, z + 0.3, 0.8, 0.8, 0.2, color)
      for (const s of [-1, 1]) bx(x + i * 0.95 + s * 0.44, 0.4, z, 0.08, 0.3, 0.7, color)
    }
  }
  const locker = (x, z, color, jersey) => {
    bx(x, 0, z, 0.95, 2.5, 0.7, color, true)
    bx(x, 1.3, z + 0.36, 0.05, 0.4, 0.03, '#ffd166')
    const j = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.8), new THREE.MeshBasicMaterial({ map: jersey, transparent: true }))
    j.position.set(x, 1.7, z + 0.37)
    add(j)
  }
  const popcorn = (x, z) => {
    bx(x, 0, z, 1.1, 1.0, 0.9, '#d9304f', true)
    bx(x, 1.0, z, 1.0, 1.0, 0.8, '#fff2b8')
    for (let i = 0; i < 6; i++) ball(x - 0.3 + (i % 3) * 0.3, 2.05, z - 0.15 + Math.floor(i / 3) * 0.3, 0.17, '#fffbe0')
    bx(x, 2.0, z, 1.1, 0.12, 0.9, '#d9304f')
  }
  const hoop = (along, y) => {
    add(h.mesh(new THREE.BoxGeometry(0.08, 1.0, 1.5), '#ffffff', ROOM_W - 0.14, y, along))
    bx(ROOM_W - 0.2, y - 0.2, along, 0.04, 0.45, 0.5, '#d9304f')
    const rim = h.mesh(new THREE.TorusGeometry(0.26, 0.03, 6, 16), '#ff6b1a', ROOM_W - 0.65, y - 0.35, along)
    rim.rotation.x = Math.PI / 2
    add(rim)
    const net = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.14, 0.35, 10, 1, true), new THREE.MeshBasicMaterial({ color: '#ffffff', wireframe: true }))
    net.position.set(ROOM_W - 0.65, y - 0.55, along)
    add(net)
  }
  // cadeira gamer vista por trás (ela olha para a mesa, em direção a -z)
  const gamerChair = (x, z, color) => {
    bx(x, 0.1, z, 1.1, 0.06, 0.1, '#1c1526')
    bx(x, 0.1, z, 0.1, 0.06, 1.1, '#1c1526')
    for (const [dx, dz] of [[-0.55, 0], [0.55, 0], [0, -0.55], [0, 0.55]]) ball(x + dx, 0.07, z + dz, 0.07, '#111')
    cy(x, 0.1, z, 0.07, 0.4, '#9aa0a6', 8)
    bx(x, 0.5, z, 0.95, 0.2, 0.95, '#1c1526')
    for (const s of [-1, 1]) bx(x + s * 0.4, 0.62, z, 0.14, 0.14, 0.9, color)
    bx(x, 0.7, z + 0.5, 0.95, 1.55, 0.2, '#1c1526')
    bx(x, 0.95, z + 0.61, 0.3, 1.1, 0.04, color)
    for (const s of [-1, 1]) bx(x + s * 0.38, 0.8, z + 0.6, 0.12, 1.2, 0.05, color)
    bx(x, 2.0, z + 0.55, 0.5, 0.3, 0.14, color)
    for (const s of [-1, 1]) {
      bx(x + s * 0.62, 0.62, z, 0.1, 0.05, 0.5, '#1c1526')
      bx(x + s * 0.62, 0.5, z, 0.06, 0.2, 0.06, '#9aa0a6')
    }
    solid(x, z, 1.2, 1.2)
  }
  const phone = (x, y, z) => {
    bx(x, y, z, 0.5, 0.18, 0.4, '#1c1526')
    bx(x, y + 0.18, z, 0.5, 0.06, 0.14, '#b3202e')
    ball(x - 0.25, y + 0.24, z, 0.07, '#b3202e')
    ball(x + 0.25, y + 0.24, z, 0.07, '#b3202e')
    for (let i = 0; i < 4; i++) ball(x - 0.12 + (i % 2) * 0.24, y + 0.19, z + 0.12 + Math.floor(i / 2) * 0.1, 0.03, '#ffd166')
  }
  const printer = (x, y, z) => {
    bx(x, y, z, 1.0, 0.4, 0.7, '#cfd3d8')
    bx(x, y + 0.4, z, 0.95, 0.06, 0.6, '#2d2a32')
    bx(x, y + 0.46, z + 0.1, 0.7, 0.05, 0.4, '#ffffff')
    bx(x, y + 0.1, z + 0.38, 0.8, 0.02, 0.2, '#ffffff')
    glow(x + 0.35, y + 0.28, z + 0.36, 0.08, 0.04, 0.02, '#7cfc7c')
  }
  const parcel = (x, y, z, w, hh, d, color) => {
    bx(x, y, z, w, hh, d, color)
    bx(x, y + hh, z, w * 0.2, 0.01, d + 0.02, '#e8d8a8')
  }

  // ----- salas -----
  const ROOMS = {
    // CASA: o cantinho do Ygor (setup gamer, NBA com fotos reais, Palmeiras e heróis)
    sobre() {
      rug(7, 6.2, 7, 3.8, '#c8553d', '#f4c95d')
      // mesa do PC: monitor ultrawide, dois laterais, teclado, mousepad, torre RGB e a cadeira gamer
      desk(7, 1.05, 5.2, 1.4, '#2d2a32')
      monitor(7, 1.4, 0.6, art('desktop'), 2.4, 0.95)
      monitor(4.95, 1.4, 0.7, art('code', '#7cfc7c'), 1.15, 0.85)
      monitor(9.05, 1.4, 0.7, art('profile'), 1.15, 0.85)
      bx(7.2, 0.84, 1.5, 2.4, 0.02, 0.7, '#14141c')
      keyboard(6.7, 0.86, 1.5)
      bx(8.0, 0.86, 1.5, 0.14, 0.06, 0.22, '#1c1526')
      headphones(9.3, 0.84, 1.45, '#4cc9f0')
      mug(4.6, 0.84, 1.5, '#0a7b45')
      rgb(7, 0.02, 1.05, 4.8, 0.03, 1.2, 0)
      rgb(7, 0.9, 0.04, 5.0, 0.05, 0.02, 0.3)
      bx(10.1, 0, 0.9, 0.7, 1.5, 1.0, '#14141c', true)
      rgb(10.1, 0.35, 1.42, 0.5, 0.85, 0.02, 0.6)
      for (const s of [-1, 1]) bx(7 + s * 1.45, 0.84, 0.5, 0.3, 0.55, 0.3, '#14141c')
      gamerChair(7, 2.8, '#d9304f')
      sign('back', 7, 3.95, 2.4, 0.5, '</> DEV', '#0e0a22', '#4cc9f0')
      decal('back', 2.4, 3.2, 1.8, 0.9, art('pennant', '#0a7b45', '#ffffff', 'AVANTI'))
      windowAt('back', 12.2, 3.3, 1.7, 1.2)
      // cavalete com uma landing page (o que eu faço no dia a dia)
      bx(2.0, 0, 1.6, 0.08, 1.8, 0.08, '#8a5a3b')
      bx(3.2, 0, 1.6, 0.08, 1.8, 0.08, '#8a5a3b')
      bx(2.6, 0, 2.1, 0.08, 1.5, 0.08, '#8a5a3b')
      bx(2.6, 1.0, 1.5, 1.7, 1.3, 0.1, '#e6dcc4')
      screen(art('landing'), 2.6, 1.65, 1.56, 1.5, 1.15)
      solid(2.6, 1.7, 1.8, 0.8)
      // degraus da carreira: headset (cobrança), máquina de tatuagem (estúdio) e notebook (dev)
      bx(10.5, 0, 1.5, 0.95, 0.5, 1.1, '#8a5a3b', true)
      bx(11.5, 0, 1.5, 0.95, 0.9, 1.1, '#8a5a3b', true)
      bx(12.5, 0, 1.5, 0.95, 1.3, 1.1, '#8a5a3b', true)
      headphones(10.5, 0.5, 1.5, '#4f7fcf')
      tattooMachine(11.35, 0.9, 1.5)
      laptop(12.5, 1.3, 1.5, art('code', '#ffd166'))
      // NBA: fotos reais (Jordan, LeBron e Duncan dos Spurs), cesta e camisa
      photoWall('left', 4.2, 2.6, 1.4, 1.9, 'jordan', { cx: 0.5, cy: 0.45 })
      photoWall('left', 6.5, 2.6, 1.4, 1.9, 'lebron', { cx: 0.5, cy: 0.35 })
      photoWall('left', 8.8, 2.6, 1.4, 1.9, 'wembanyama', { cx: 0.5, cy: 0.5 })
      photoWall('left', 2.2, 3.1, 1.7, 1.15, 'spurs-campeoes', { cx: 0.45, cy: 0.5 })
      hoop(2.2, 3.1)
      decal('right', 4.6, 3.55, 1.6, 1.8, art('jersey', '#0a7b45', '#ffffff', 10, 'PALMEIRAS'))
      shelf(13.3, 6.8, 0.9, 3.4, 3, 4, () => {
        figurine(13.3, 2.6, 6.1, '#c1121f', '#1d4ed8', '#1d4ed8')
        figurine(13.3, 2.6, 6.8, '#14141c', '#f4c20d', '#14141c')
        figurine(13.3, 2.6, 7.5, '#1d4ed8', '#c1121f', '#c1121f')
      })
      sofa(1.5, 6.5, 1.4, 3.0, '#4f7fcf')
      bx(1.5, 0.9, 5.9, 0.2, 0.5, 0.5, '#0a7b45')
      basketball(3.0, 0.3, 8.6)
      soccer(8.8, 0.28, 6.9)
      beanbag(11.4, 8.4, '#c8553d')
      plant(13.0, 3.9, true)
      lamp(4.0, 3.2)
      hot('bio', 'Sobre mim', 7, 4.2, ['.inv-col:nth-child(1) .inv-card:nth-child(1)'])
      hot('foco', 'No que eu trabalho', 2.8, 3.5, ['.inv-col:nth-child(1) .inv-card:nth-child(2)'])
      hot('traj', 'Trajetória', 11.5, 3.3, ['.inv-col:nth-child(2) .inv-card'])
    },
    // OFICINA: estação de trabalho de dev
    projetos() {
      bx(7, 0, 1.0, 12.6, 0.9, 1.5, '#6b4a2f', true)
      bx(7, 0.9, 1.0, 12.8, 0.1, 1.6, '#8a5a3b')
      const maps = [art('code', '#7cfc7c'), art('nodes'), art('code', '#4cc9f0'), art('code', '#ff6bd6'), art('nodes')]
      for (let i = 0; i < 5; i++) {
        monitor(2.2 + i * 2.4, 1.55, 0.6, maps[i])
        keyboard(2.2 + i * 2.4, 1.0, 1.4)
      }
      mug(0.9, 1.0, 1.0, '#f6f6f6')
      mug(11.0, 1.0, 1.1, '#e08a2e')
      duck(5.0, 1.0, 1.35)
      headphones(9.1, 1.0, 1.4)
      sign('back', 7, 4.0, 5.6, 0.8, 'OFICINA DE PROJETOS', '#2d2a32', '#f4a259')
      wallArt('left', 2.6, 2.6, 2.0, 1.5, art('diagram'), '#4a4f58')
      wallArt('left', 5.0, 2.6, 2.4, 1.6, art('kanban'), '#4a4f58')
      wallArt('left', 7.6, 2.6, 2.0, 1.5, art('notes'), '#4a4f58')
      // bancada de ferramentas, máquina de café, puf e mesa de montagem
      bx(1.0, 0, 6.8, 1.0, 1.2, 2.4, '#c99a5b', true)
      bx(1.0, 1.2, 6.2, 0.7, 0.3, 0.45, '#b3202e')
      bx(1.0, 1.5, 6.2, 0.4, 0.04, 0.04, '#9aa0a6')
      bx(1.0, 1.2, 7.4, 0.5, 0.08, 0.5, '#4a4f58')
      bx(12.9, 0, 4.6, 0.8, 1.2, 0.8, '#2d2a32', true)
      glow(12.9, 1.2, 4.6, 0.6, 0.06, 0.6, '#ff6b1a')
      cy(12.9, 0.4, 5.05, 0.06, 0.3, '#f6f6f6', 8)
      beanbag(12.4, 7.6, '#4f7fcf')
      desk(10.6, 8.2, 2.4, 1.0, '#4a4f58')
      laptop(10.6, 0.84, 8.2, art('landing'))
      mug(9.8, 0.84, 8.2, '#d9304f')
      plant(2.8, 8.6)
      lamp(5.2, 7.6, '#f4a259')
      for (let i = 0; i < 5; i++) hot('proj' + i, 'Projeto ' + (i + 1), 2.2 + i * 2.4, 2.7, ['.card:nth-child(' + (i + 1) + ')'])
    },
    // ESCOLA: sala de aula (diplomas, estante de cursos e o laboratório de computadores)
    formacao() {
      wallArt('back', 6.2, 2.4, 6.4, 2.2, art('chalk'), '#8a5a3b')
      bx(6.2, 0.6, 0.35, 6.4, 0.08, 0.3, '#8a5a3b')
      sign('back', 6.2, 4.15, 3.6, 0.5, 'ESCOLA', '#2f4f8a', '#fffaf0')
      clock('back', 1.6, 3.4)
      // diplomas na parede (formação acadêmica)
      wallArt('left', 2.8, 2.6, 1.7, 1.3, art('diploma', 'TÉCNICO EM TI'), '#8a5a3b')
      wallArt('left', 5.0, 2.6, 1.7, 1.3, art('diploma', 'JORNALISMO'), '#8a5a3b')
      // estante de cursos e certificados
      sideShelf(0.5, 8.0, 3.0, 3, 5, 1)
      // laboratório de computadores: os primeiros projetos
      desk(11.2, 1.3, 4.0, 1.2, '#c9ced6')
      monitor(9.9, 1.4, 1.1, art('landing'), 1.0, 0.75)
      monitor(11.2, 1.4, 1.1, art('code', '#4cc9f0'), 1.0, 0.75)
      monitor(12.5, 1.4, 1.1, art('landing'), 1.0, 0.75)
      for (const [x, z] of [[3.8, 5.2], [5.6, 5.2], [8.4, 5.2], [10.2, 5.2], [3.8, 7.0], [5.6, 7.0], [8.4, 7.0], [10.2, 7.0]]) {
        desk(x, z, 1.5, 0.9, '#c99a5b')
        bx(x, 0, z + 0.9, 0.6, 0.45, 0.6, '#3a5fa3')
        bx(x - 0.3, 0.84, z, 0.4, 0.05, 0.3, '#ffffff')
      }
      desk(2.8, 1.6, 2.2, 1.0, '#8a5a3b')
      ball(2.4, 0.97, 1.6, 0.16, '#e63946')
      bx(3.3, 0.84, 1.6, 0.5, 0.04, 0.4, '#f4a259')
      globe(1.0, 3.6)
      bookStack(12.8, 0, 8.4, 4)
      plant(13.0, 6.0)
      hot('edu', 'Formação acadêmica', 3.9, 3.5, ['.inv-col:nth-child(1) .inv-card:nth-child(1)'])
      hot('cursos', 'Cursos e certificações', 2.3, 8.0, ['.inv-col:nth-child(1) .inv-card:nth-child(2)'])
      hot('early', 'Primeiros projetos', 11.2, 3.0, ['.inv-col:nth-child(2) .inv-card'])
    },
    // LAB: servidores e automações; mesa de reunião (soft skills) e cantinho de idiomas
    skills() {
      const leds = ['#ffd166', '#ff6bd6', '#4cc9f0', '#ffb703', '#ff4d6d']
      for (let i = 0; i < 5; i++) rack(1.6 + i * 2.5, 0.8, leds[i])
      sign('back', 7, 4.0, 5.0, 0.6, 'SKILLS LAB', '#2f6b4a', '#e4eee8')
      desk(7, 5.4, 4.6, 1.2, '#e4eee8')
      monitor(5.6, 1.5, 5.1, art('nodes'), 1.1, 0.8)
      monitor(7, 1.5, 5.1, art('code', '#7cfc7c'), 1.1, 0.8)
      monitor(8.4, 1.5, 5.1, art('nodes'), 1.1, 0.8)
      keyboard(7, 0.85, 5.8)
      duck(5.0, 0.85, 5.8)
      mug(9.2, 0.85, 5.8, '#0a7b45')
      const ring = h.mesh(new THREE.TorusGeometry(0.4, 0.03, 8, 24), '#4cc9f0', 7, 2.6, 4.6)
      ring.rotation.x = Math.PI / 2
      add(ring)
      animated.push({ o: ring, spinY: true, phase: 0 })
      // mesa de reunião redonda com balões de conversa (soft skills)
      cy(11.6, 0, 7.4, 1.0, 0.7, '#e4eee8', 16)
      cy(11.6, 0.7, 7.4, 1.05, 0.08, '#2f6b4a', 16)
      solid(11.6, 7.4, 2.1, 2.1)
      for (const [dx, dz] of [[-1.5, 0], [1.5, 0], [0, -1.5], [0, 1.5]]) {
        bx(11.6 + dx, 0, 7.4 + dz, 0.55, 0.5, 0.55, '#3a8fd8')
        bx(11.6 + dx, 0.5, 7.4 + dz - 0.2 * Math.sign(dz || 1), 0.55, 0.5, 0.1, '#3a8fd8')
      }
      for (const [dx, dy, c] of [[-0.35, 1.35, '#ffffff'], [0.4, 1.7, '#ffd166']]) add(h.mesh(new THREE.SphereGeometry(0.3, 12, 8), c, 11.6 + dx, dy + 0.5, 7.4)).scale.set(1.4, 0.8, 0.9)
      // cantinho de idiomas: estante, globo e bandeiras
      bx(1.1, 0, 7.6, 1.0, 1.0, 2.2, '#8a5a3b', true)
      for (let i = 0; i < 4; i++) bx(1.1, 1.0, 6.8 + i * 0.5, 0.5, 0.45, 0.14, ['#e63946', '#2a9d8f', '#f4a261', '#4f7fcf'][i])
      cy(2.4, 0, 8.6, 0.03, 1.8, '#9aa0a6', 6)
      bx(2.4, 1.3, 8.6, 0.5, 0.35, 0.04, '#0a7b45')
      bx(2.4, 1.3, 8.62, 0.2, 0.2, 0.04, '#ffd400')
      cy(3.2, 0, 8.6, 0.03, 1.8, '#9aa0a6', 6)
      bx(3.2, 1.3, 8.6, 0.5, 0.35, 0.04, '#1d4ed8')
      bx(3.2, 1.4, 8.62, 0.5, 0.06, 0.04, '#e63946')
      headphones(1.1, 1.0, 8.1, '#4cc9f0')
      plant(13.0, 2.6)
      for (let i = 0; i < 5; i++) hot('sk' + i, 'Grupo ' + (i + 1), 1.6 + i * 2.5, 2.7, ['.skill-grid > .inv-card:nth-child(' + (i + 1) + ')'])
      hot('soft', 'Soft skills', 11.6, 5.4, ['.inv-grid > .inv-card:nth-child(1)'])
      hot('langs', 'Idiomas', 3.0, 6.4, ['.inv-grid > .inv-card:nth-child(2)'])
    },
    // CORREIOS: balcão com telefone, encomendas e impressora; escaninhos de cartas
    contato() {
      bx(7, 0, 2.5, 9, 1.1, 1.2, '#a93d3a', true)
      bx(7, 1.1, 2.5, 9.2, 0.15, 1.4, '#f6ead0')
      bx(7, 0, 0.55, 11.4, 2.5, 0.7, '#3a5fa3', true)
      for (let i = 0; i < 12; i++)
        for (const r of [0, 1]) {
          bx(1.7 + i * 0.86, 0.5 + r * 1.0, 0.92, 0.7, 0.7, 0.04, '#2d4a7e')
          bx(1.7 + i * 0.86, 0.6 + r * 1.0, 0.95, 0.5, 0.05, 0.04, ['#fff6e5', '#ffd166', '#ff9ec7', '#9be7ff'][(i + r) % 4])
        }
      sign('back', 7, 3.7, 5.0, 0.8, 'CORREIOS', '#a93d3a', '#fff6e5')
      // contato rápido: telefone e sineta
      phone(3.8, 1.25, 2.5)
      cy(4.7, 1.25, 2.5, 0.28, 0.1, '#ffd166', 10)
      ball(4.7, 1.45, 2.5, 0.1, '#b3202e')
      // canais: cartas e encomendas de cada rede
      parcel(6.2, 1.25, 2.5, 0.7, 0.4, 0.5, '#c99a5b')
      parcel(7.1, 1.25, 2.5, 0.55, 0.3, 0.45, '#4f7fcf')
      parcel(7.9, 1.25, 2.5, 0.6, 0.35, 0.5, '#d9534f')
      for (let i = 0; i < 4; i++) bx(6.3 + i * 0.5, 1.25, 2.1, 0.4, 0.02, 0.28, '#ffffff')
      // currículo: impressora com folhas
      printer(10.2, 1.25, 2.5)
      for (let i = 0; i < 6; i++) bx(9.5, 1.25 + i * 0.02, 2.5, 0.4, 0.02, 0.55, '#ffffff')
      for (let i = 0; i < 4; i++) bx(1.0 + (i % 2) * 0.9, Math.floor(i / 2) * 0.62, 8.3, 0.8, 0.6, 0.7, ['#c99a5b', '#b88748'][i % 2], i < 2)
      bx(1.4, 1.24, 8.3, 0.7, 0.04, 0.05, '#ffffff')
      bx(12.3, 0, 8.2, 1.3, 1.5, 1.3, '#3a5fa3', true)
      const top = h.mesh(new THREE.CylinderGeometry(0.65, 0.65, 1.3, 12), '#3a5fa3', 12.3, 1.5, 8.2)
      top.rotation.x = Math.PI / 2
      add(top)
      plant(12.8, 4.8)
      lamp(1.2, 3.6)
      hot('quick', 'Contato rápido', 4.2, 4.1, ['.quick'])
      hot('canais', 'Canais', 7, 4.1, ['.inv-col:nth-child(1) .inv-card'])
      hot('cv', 'Currículo', 10.0, 4.1, ['.inv-col:nth-child(2) .inv-card'])
    },
    // ESTÁDIO: vestiário do Palmeiras, com fotos reais, camisas dos ídolos, mascote e armário de taças
    estadio() {
      const names = [['VALDIVIA', '10'], ['EDMUNDO', '7'], ['ALEX', '10'], ['WEVERTON', '21'], ['GÓMEZ', '15'], ['DUDU', '7']]
      for (let i = 0; i < 6; i++) locker(1.2 + i * 1.05, 0.6, i % 2 ? '#0a7b45' : '#f6f6f6', art('jersey', '#0a7b45', '#ffffff', names[i][1], names[i][0]))
      sign('back', 10.5, 3.7, 4.6, 0.8, 'PALESTRA ITÁLIA · 1914', '#0a7b45', '#ffffff')
      bx(7, 0, 5.6, 5.4, 0.5, 1.4, '#e8e8e8', true)
      bx(7, 0.5, 5.6, 5.6, 0.1, 1.6, '#0a7b45')
      soccer(5.6, 0.82, 5.6, 0.26)
      photoWall('left', 4.0, 2.6, 1.9, 1.9, 'palmeiras-trofeus', { cx: 0.5, cy: 0.5 })
      photoWall('left', 7.0, 2.6, 1.7, 1.3, 'palmeiras-allianz', { cx: 0.5, cy: 0.5 })
      photoWall('right', 4.0, 2.6, 1.4, 1.9, 'palmeiras-torcida', { cx: 0.5, cy: 0.5 })
      decal('right', 7.2, 3.2, 1.8, 0.9, art('pennant', '#0a7b45', '#ffffff', 'AVANTI'))
      bx(12.5, 0, 2.6, 1.2, 2.4, 1.2, '#3b2a1a', true)
      for (const y of [0.3, 1.1, 1.9]) bx(12.5, y, 2.6, 1.0, 0.06, 1.0, '#8a5a3b')
      trophy(12.5, 0.36, 2.6, 0.8, '#e3b341')
      trophy(12.5, 1.16, 2.6, 0.8, '#c4ced4')
      trophy(12.5, 1.96, 2.6, 0.8, '#e3b341')
      pig(2.0, 8.0, 0.9)
      beanbag(12.2, 8.0, '#0a7b45')
      hot('taca', 'Taças', 11.0, 4.0, ['.inv-col:nth-child(1) .inv-card'])
      hot('idolos', 'Meus ídolos', 3.8, 2.6, ['.inv-col:nth-child(2) .inv-card'])
      hot('intro', 'Palmeirense de coração', 7, 3.7, ['.lead'])
    },
    // CINEMA: tela, poltronas, pipoca, projetor e cartazes de cada gênero
    cinema() {
      bx(7, 0.7, 0.12, 9.4, 3.4, 0.14, '#1c1526')
      glow(7, 0.8, 0.2, 9.0, 3.2, 0.02, '#e8e0f5')
      for (const s of [-1, 1]) bx(7 + s * 5.1, 0, 0.5, 0.9, 4.0, 0.6, '#b3202e')
      sign('back', 7, 4.2, 4.0, 0.5, 'SESSÃO DA CASA', '#1c1526', '#ffd166')
      for (let r = 0; r < 3; r++) seatRow(3.1, 5.2 + r * 1.3, 7, '#d9304f')
      wallArt('left', 3.4, 2.6, 1.5, 2.0, art('poster', 'pop'), '#ffd166')
      wallArt('left', 6.4, 2.6, 1.5, 2.0, art('poster', 'terror'), '#ffd166')
      wallArt('right', 3.4, 2.6, 1.5, 2.0, art('poster', 'sandler'), '#ffd166')
      wallArt('right', 6.4, 2.6, 1.5, 2.0, art('poster', 'carrey'), '#ffd166')
      // projetor no fundo da sala, com o feixe de luz até a tela
      bx(7, 3.6, 9.0, 1.0, 0.5, 0.7, '#2d2a32')
      cy(7, 3.7, 8.6, 0.18, 0.2, '#111', 10).rotation.x = Math.PI / 2
      const beamMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 2.6, 8.2, 18, 1, true), new THREE.MeshBasicMaterial({ color: '#e8e0f5', transparent: true, opacity: 0.07, depthWrite: false, side: THREE.DoubleSide }))
      beamMesh.rotation.x = Math.PI / 2
      beamMesh.position.set(7, 3.8, 4.5)
      add(beamMesh)
      popcorn(12.5, 8.4)
      // rolo de filme e claquete
      cy(1.3, 0, 8.4, 0.55, 0.12, '#2d2a32', 14)
      cy(1.3, 0.12, 8.4, 0.5, 0.05, '#9aa0a6', 14)
      bx(2.6, 0, 8.6, 0.8, 0.1, 0.5, '#111')
      bx(2.6, 0.1, 8.6, 0.8, 0.06, 0.5, '#f6f6f6')
      hot('pop', 'Cultura pop', 2.8, 3.4, ['h3:nth-of-type(1)', 'ul.movies:nth-of-type(1)'])
      hot('terror', 'Terror', 2.8, 6.4, ['h3:nth-of-type(2)', 'ul.movies:nth-of-type(2)'])
      hot('sandler', 'Adam Sandler', 11.2, 3.4, ['h3:nth-of-type(3)', 'ul.movies:nth-of-type(3)'])
      hot('carrey', 'Jim Carrey', 11.2, 6.4, ['h3:nth-of-type(4)', 'ul.movies:nth-of-type(4)'])
    },
    // BIBLIOTECA: estantes, escada, poltronas e um gato dormindo no tapete
    biblioteca() {
      for (const x of [2.4, 5.6, 8.8, 12.0]) shelf(x, 0.75, 2.6, 0.9, 3, 5)
      mug(3.2, 2.62, 0.8, '#c4ced4')
      sign('back', 7, 4.0, 5.0, 0.6, 'BIBLIOTECA', '#2f5d3a', '#f6e3c4')
      rug(7, 6.4, 7, 3.4, '#3f7d4d', '#f4c95d')
      desk(7, 6.4, 2.6, 1.2, '#8a5a3b')
      bookStack(6.3, 0.84, 6.4, 3)
      bx(7.8, 0.84, 6.4, 0.9, 0.1, 0.7, '#e63946')
      lamp(8.3, 6.0)
      bx(1.9, 0, 7.6, 1.5, 0.6, 1.5, '#9b5de5', true)
      bx(1.9, 0.6, 8.2, 1.5, 0.9, 0.3, '#9b5de5')
      bx(12.0, 0, 7.6, 1.5, 0.6, 1.5, '#2a9d8f', true)
      bx(12.0, 0.6, 8.2, 1.5, 0.9, 0.3, '#2a9d8f')
      bookStack(0.9, 0, 5.6, 5)
      globe(12.9, 4.8)
      cat(4.6, 7.6)
      windowAt('left', 5.4, 2.6, 1.8, 1.6)
      plant(1.0, 3.0)
      for (let i = 0; i < 5; i++) hot('bk' + i, 'Livro ' + (i + 1), 1.9 + i * 2.5, 2.6, ['.book:nth-child(' + (i + 1) + ')'])
    },
  }
  ROOMS[key]()

  // contorno escuro nos objetos (mesmo visual do mapa) e luz de preenchimento
  h.addOutline(group, 0.022)
  const fill = new THREE.PointLight('#fff1d6', 22, 26, 1.6)
  fill.position.set(ROOM_W / 2, 7, ROOM_D / 2)
  group.add(fill)

  return {
    key,
    group,
    solids,
    hotspots,
    theme: th,
    spawn: { x: ROOM_W / 2, z: ROOM_D - 2.7 },
    update(time) {
      for (const m of markers) {
        m.dia.position.y = m.y + Math.sin(time * 3 + m.phase) * 0.14
        m.dia.rotation.y = time * 2
        m.ring.material.opacity = 0.55 + Math.sin(time * 4 + m.phase) * 0.3
      }
      for (const a of animated) {
        if (a.spinY) a.o.rotation.z = time * 1.6
        else if (a.rgb) a.o.material.color.setHSL((time * 0.18 + a.phase) % 1, 0.95, 0.55)
        else a.o.visible = Math.sin(time * 5 + a.phase * 2.1) > -0.6
      }
    },
  }
}
