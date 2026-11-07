// Interiores dos prédios: cada lugar vira uma sala quadrada (estilo Habbo), com quadros, objetos e
// easter eggs dos gostos do Ygor (dev, heróis, Palmeiras, NBA: Spurs, LeBron e Jordan).
// Cada "hotspot" é um círculo brilhante no chão: ao ficar nele o jogador abre a ficha daquele assunto.
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
  const flat = (map, x, y, z, w, d) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ map, transparent: true }))
    m.rotation.x = -Math.PI / 2
    m.position.set(x, y, z)
    return add(m)
  }
  const solid = (x, z, w, d) => solids.push({ x0: x - w / 2, x1: x + w / 2, z0: z - d / 2, z1: z + d / 2 })

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
  const decal = (wall, along, y, w, hh, map) => {
    const pl = new THREE.Mesh(new THREE.PlaneGeometry(w, hh), new THREE.MeshBasicMaterial({ map, transparent: true }))
    pl.position.set(...wp(wall, along, y, 0.07))
    pl.rotation.y = wry[wall]
    add(pl)
  }
  const plaque = (wall, along, y, w, hh, text, bg, fg, border) => {
    frameBox(wall, along, y, w, hh, border || th.trim)
    const pl = h.textSign(text, w, hh, bg, fg)
    pl.position.set(...wp(wall, along, y, 0.11))
    pl.rotation.y = wry[wall]
    add(pl)
  }
  const sign = (wall, along, y, w, hh, text, bg, fg) => plaque(wall, along, y, w, hh, text, bg, fg, bg)
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
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.14, hh - 0.14), new THREE.MeshBasicMaterial({ map }))
    scr.position.set(x, y + hh / 2, z + 0.06)
    add(scr)
    bx(x, y - 0.14, z, 0.16, 0.16, 0.12, '#1c1526')
    bx(x, y - 0.2, z, 0.5, 0.06, 0.3, '#1c1526')
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
  const headphones = (x, y, z) => {
    add(h.mesh(new THREE.TorusGeometry(0.2, 0.03, 6, 14, Math.PI), '#1c1526', x, y + 0.2, z))
    for (const s of [-1, 1]) cy(x + s * 0.2, y + 0.06, z, 0.08, 0.1, '#ff6bd6', 8)
  }
  const sneaker = (x, y, z, c1, c2) => {
    bx(x, y, z, 0.55, 0.1, 0.22, '#ffffff')
    bx(x - 0.04, y + 0.1, z, 0.42, 0.15, 0.2, c1)
    bx(x - 0.14, y + 0.25, z, 0.2, 0.15, 0.2, c1)
    bx(x + 0.14, y + 0.12, z, 0.1, 0.06, 0.2, c2)
  }
  const figurine = (x, y, z, body, accent, cape) => {
    bx(x - 0.07, y, z, 0.1, 0.22, 0.1, accent)
    bx(x + 0.07, y, z, 0.1, 0.22, 0.1, accent)
    bx(x, y + 0.22, z, 0.3, 0.3, 0.16, body)
    ball(x, y + 0.67, z, 0.17, body)
    if (cape) bx(x, y + 0.22, z - 0.1, 0.32, 0.42, 0.03, cape)
  }
  const basketball = (x, y, z, r = 0.3) => {
    const b = add(h.mesh(new THREE.SphereGeometry(r, 14, 10), tm(art('basketball')), x, y, z))
    b.rotation.y = 1
  }
  const soccer = (x, y, z, r = 0.28) => add(h.mesh(new THREE.SphereGeometry(r, 14, 10), tm(art('soccer')), x, y, z))
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

  // ----- salas -----
  const ROOMS = {
    // CASA: sala do dev fã de Palmeiras, Spurs, LeBron, Jordan e heróis
    sobre() {
      rug(7, 6, 7, 4, '#c8553d', '#f4c95d')
      bx(7, 0, 0.8, 3.4, 2.2, 1.3, '#b5654a', true)
      bx(7, 0.15, 1.2, 2.2, 1.3, 0.8, '#2d2a32')
      glow(7, 0.2, 1.62, 1.6, 0.5, 0.03, '#ff8a3d')
      bx(7, 2.2, 0.8, 3.9, 0.2, 1.5, '#8a5a3b')
      trophy(8.1, 2.4, 0.9, 0.9)
      soccer(5.9, 2.7, 0.9, 0.26)
      bx(6.3, 1.0, 1.55, 0.35, 1.2, 0.04, '#0a7b45')
      bx(6.3, 1.45, 1.58, 0.35, 0.18, 0.04, '#ffffff')
      windowAt('back', 2.5, 2.5, 1.9, 1.7)
      plaque('back', 2.5, 4.0, 2.2, 0.5, 'SOBRE MIM', '#fdf0dc', '#7d2f1f')
      plaque('back', 7, 3.6, 2.0, 0.55, 'FOCO', '#e8eefb', '#1f3868')
      plaque('back', 11.6, 2.5, 2.4, 1.5, 'TRAJETÓRIA', '#fbe9e6', '#7d2f1f')
      clock('back', 9.4, 3.7)
      decal('left', 2.4, 3.1, 1.8, 0.9, art('pennant', '#0b0b0b', '#c4ced4', 'SPURS'))
      wallArt('left', 4.6, 2.5, 1.5, 2.0, art('jordan'), '#2d2a32')
      wallArt('left', 7.0, 2.5, 1.5, 2.0, art('lebron'), '#2d2a32')
      wallArt('left', 9.0, 3.2, 1.0, 1.3, art('spurs'), '#2d2a32')
      hoop(2.2, 3.1)
      decal('right', 4.6, 3.55, 1.6, 1.8, art('jersey', '#0a7b45', '#ffffff', 10, 'PALMEIRAS'))
      shelf(13.3, 6.4, 0.9, 3.4, 3, 4, () => {
        figurine(13.3, 2.6, 5.7, '#c1121f', '#1d4ed8', '#1d4ed8')
        figurine(13.3, 2.6, 6.4, '#14141c', '#f4c20d', '#14141c')
        figurine(13.3, 2.6, 7.1, '#1d4ed8', '#c1121f', '#c1121f')
      })
      sofa(1.5, 5.6, 1.4, 3.6, '#4f7fcf')
      bx(1.5, 0.9, 5.0, 0.2, 0.5, 0.5, '#0a7b45')
      basketball(2.6, 0.3, 8.4)
      soccer(8.6, 0.28, 6.9)
      beanbag(11.6, 8.3, '#c8553d')
      plant(12.7, 1.4, true)
      lamp(4.6, 1.5)
      hot('bio', 'Sobre mim', 2.5, 2.4, ['.inv-col:nth-child(1) .inv-card:nth-child(1)'])
      hot('foco', 'No que eu trabalho', 7, 3.0, ['.inv-col:nth-child(1) .inv-card:nth-child(2)'])
      hot('traj', 'Trajetória', 11.2, 2.4, ['.inv-col:nth-child(2) .inv-card'])
    },
    // OFICINA: estação de trabalho de dev com heróis, NBA e muito café
    projetos() {
      bx(7, 0, 1.0, 12.6, 0.9, 1.5, '#6b4a2f', true)
      bx(7, 0.9, 1.0, 12.8, 0.1, 1.6, '#8a5a3b')
      const maps = [art('code', '#7cfc7c'), art('nodes'), art('code', '#4cc9f0'), art('code', '#ff6bd6'), art('nodes'), art('code', '#ffd166')]
      for (let i = 0; i < 6; i++) {
        monitor(1.8 + i * 2.08, 1.55, 0.6, maps[i])
        keyboard(1.8 + i * 2.08, 1.0, 1.4)
      }
      mug(0.9, 1.0, 1.0, '#f6f6f6')
      mug(11.0, 1.0, 1.1, '#0a7b45')
      duck(5.0, 1.0, 1.35)
      headphones(9.1, 1.0, 1.4)
      figurine(12.6, 1.0, 1.1, '#14141c', '#f4c20d', '#14141c')
      sign('back', 7, 4.0, 5.6, 0.8, 'OFICINA DE PROJETOS', '#2d2a32', '#f4a259')
      wallArt('left', 3.4, 2.7, 2.6, 2.0, art('notes'), '#4a4f58')
      wallArt('left', 6.2, 2.6, 1.4, 1.9, art('jordan'), '#2d2a32')
      wallArt('right', 3.2, 2.6, 1.5, 2.0, art('spidey'), '#2d2a32')
      wallArt('right', 5.4, 2.6, 1.5, 2.0, art('lebron'), '#2d2a32')
      decal('right', 7.4, 3.4, 1.8, 0.9, art('pennant', '#0b0b0b', '#c4ced4', 'SPURS'))
      bx(1.0, 0, 6.8, 1.0, 1.2, 2.4, '#c99a5b', true)
      sneaker(1.0, 1.2, 6.2, '#b3202e', '#111')
      sneaker(1.0, 1.2, 7.3, '#ffffff', '#b3202e')
      beanbag(12.4, 7.6, '#4f7fcf')
      basketball(11.2, 0.3, 6.2)
      bx(12.9, 0, 4.6, 0.9, 1.0, 0.9, '#c99a5b', true)
      cy(12.9, 1.0, 4.6, 0.3, 0.5, '#e08a2e')
      desk(10.6, 8.2, 2.4, 1.0, '#4a4f58')
      mug(10.2, 0.84, 8.2, '#d9304f')
      plant(2.8, 8.6)
      lamp(5.2, 7.6, '#f4a259')
      for (let i = 0; i < 6; i++) hot('proj' + i, 'Projeto ' + (i + 1), 1.8 + i * 2.08, 2.7, ['.card:nth-child(' + (i + 1) + ')'])
    },
    // ESCOLA: sala de aula com lousa, globo e easter eggs
    formacao() {
      wallArt('back', 7, 2.4, 7.6, 2.3, art('chalk'), '#8a5a3b')
      bx(7, 0.6, 0.35, 7.6, 0.08, 0.3, '#8a5a3b')
      sign('back', 7, 4.15, 3.6, 0.5, 'ESCOLA', '#2f4f8a', '#fffaf0')
      clock('back', 12.2, 3.4)
      plaque('left', 3.2, 2.5, 2.4, 1.5, 'FORMAÇÃO', '#fffaf0', '#2f4f8a', '#8a5a3b')
      plaque('left', 6.8, 2.5, 2.2, 1.5, 'CURSOS', '#fffaf0', '#2f4f8a', '#8a5a3b')
      plaque('right', 5, 2.5, 3.0, 1.5, 'PRIMEIROS PROJETOS', '#fffaf0', '#2f4f8a', '#8a5a3b')
      wallArt('right', 7.8, 2.6, 1.3, 1.8, art('spidey'), '#2d2a32')
      decal('left', 8.6, 3.3, 1.8, 0.9, art('pennant', '#0b0b0b', '#c4ced4', 'SPURS'))
      for (const [x, z] of [[3.8, 5.2], [5.6, 5.2], [8.4, 5.2], [10.2, 5.2], [3.8, 7.0], [5.6, 7.0], [8.4, 7.0], [10.2, 7.0]]) {
        desk(x, z, 1.5, 0.9, '#c99a5b')
        bx(x, 0, z + 0.9, 0.6, 0.45, 0.6, '#3a5fa3')
        bx(x - 0.3, 0.84, z, 0.4, 0.05, 0.3, '#ffffff')
      }
      desk(11.8, 2.0, 2.6, 1.1, '#8a5a3b')
      ball(11.5, 0.97, 2.0, 0.16, '#e63946')
      bx(12.3, 0.84, 2.0, 0.5, 0.04, 0.4, '#f4a259')
      bx(12.6, 0.84, 1.6, 0.04, 0.5, 0.3, '#0a7b45')
      globe(1.4, 1.6)
      basketball(1.6, 0.3, 8.6)
      bookStack(2.6, 0, 8.7, 4)
      plant(12.8, 8.7)
      hot('edu', 'Formação acadêmica', 3.2, 3.6, ['.inv-col:nth-child(1) .inv-card:nth-child(1)'])
      hot('cursos', 'Cursos e certificações', 6.8, 3.6, ['.inv-col:nth-child(1) .inv-card:nth-child(2)'])
      hot('early', 'Primeiros projetos', 12.0, 5.0, ['.inv-col:nth-child(2) .inv-card'])
    },
    // LAB: servidores, automações n8n e heróis de guarda
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
      bx(12.6, 0, 4.4, 1.4, 1.1, 2.6, '#c9ced6', true)
      figurine(12.6, 1.1, 3.8, '#c1121f', '#f4c20d', '#c1121f')
      figurine(12.6, 1.1, 4.6, '#1d4ed8', '#c1121f', '#c1121f')
      plaque('right', 7.6, 2.6, 2.6, 1.5, 'SOFT SKILLS', '#e4f1e9', '#163a27')
      plaque('left', 5, 2.6, 2.6, 1.5, 'IDIOMAS', '#e4f1e9', '#163a27')
      wallArt('left', 7.6, 2.6, 1.3, 1.8, art('batman'), '#163a27')
      wallArt('right', 4.4, 2.6, 1.3, 1.8, art('spurs'), '#163a27')
      soccer(2.2, 0.28, 7.8)
      plant(1.0, 8.6)
      for (let i = 0; i < 5; i++) hot('sk' + i, 'Grupo ' + (i + 1), 1.6 + i * 2.5, 2.7, ['.skill-grid > .inv-card:nth-child(' + (i + 1) + ')'])
      hot('soft', 'Soft skills', 11.4, 7.6, ['.inv-grid > .inv-card:nth-child(1)'])
      hot('langs', 'Idiomas', 2.8, 6.2, ['.inv-grid > .inv-card:nth-child(2)'])
    },
    // CORREIOS: balcão, escaninhos, pacotes e o jornal do Homem-Aranha
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
      cy(5.2, 1.25, 2.5, 0.28, 0.1, '#ffd166', 10)
      bx(8.6, 1.25, 2.5, 0.8, 0.4, 0.6, '#c99a5b')
      plaque('left', 5, 2.5, 2.8, 1.5, 'CONTATO RÁPIDO', '#fbe9e6', '#5e1d1b')
      plaque('right', 5, 2.5, 2.2, 1.5, 'CURRÍCULO', '#fbe9e6', '#5e1d1b')
      wallArt('left', 8.2, 2.6, 1.4, 1.9, art('newspaper'), '#5e1d1b')
      wallArt('right', 7.8, 2.6, 1.3, 1.8, art('jordan'), '#5e1d1b')
      decal('left', 2.4, 3.2, 1.8, 0.9, art('pennant', '#0b0b0b', '#c4ced4', 'SPURS'))
      for (let i = 0; i < 4; i++) bx(1.0 + (i % 2) * 0.9, Math.floor(i / 2) * 0.62, 8.3, 0.8, 0.6, 0.7, ['#c99a5b', '#b88748'][i % 2], i < 2)
      bx(12.3, 0, 8.2, 1.3, 1.5, 1.3, '#3a5fa3', true)
      const top = h.mesh(new THREE.CylinderGeometry(0.65, 0.65, 1.3, 12), '#3a5fa3', 12.3, 1.5, 8.2)
      top.rotation.x = Math.PI / 2
      add(top)
      plant(12.8, 1.4)
      lamp(1.2, 1.4)
      soccer(10.4, 0.28, 7.2)
      hot('quick', 'Contato rápido', 3.2, 4.6, ['.quick'])
      hot('canais', 'Canais', 7, 4.6, ['.inv-col:nth-child(1) .inv-card'])
      hot('cv', 'Currículo', 10.8, 4.6, ['.inv-col:nth-child(2) .inv-card'])
    },
    // ESTÁDIO: vestiário do Palmeiras, com camisas dos ídolos, mascote e taças
    estadio() {
      const names = [['VALDIVIA', '10'], ['EDMUNDO', '7'], ['ALEX', '10'], ['WEVERTON', '21'], ['GÓMEZ', '15'], ['DUDU', '7']]
      for (let i = 0; i < 6; i++) locker(1.2 + i * 1.05, 0.6, i % 2 ? '#0a7b45' : '#f6f6f6', art('jersey', '#0a7b45', '#ffffff', names[i][1], names[i][0]))
      sign('back', 10.5, 3.7, 4.6, 0.8, 'PALESTRA ITÁLIA · 1914', '#0a7b45', '#ffffff')
      bx(7, 0, 5.4, 5.4, 0.5, 1.4, '#e8e8e8', true)
      bx(7, 0.5, 5.4, 5.6, 0.1, 1.6, '#0a7b45')
      soccer(5.6, 0.82, 5.4, 0.26)
      plaque('left', 5, 2.6, 2.8, 1.6, 'TAÇAS', '#e3f4ea', '#064a29')
      plaque('right', 5, 2.6, 2.8, 1.6, 'ÍDOLOS', '#e3f4ea', '#064a29')
      decal('left', 8.0, 3.2, 1.8, 0.9, art('pennant', '#0a7b45', '#ffffff', 'AVANTI'))
      wallArt('right', 8.2, 2.5, 1.3, 1.7, art('palmeiras'), '#ffffff')
      bx(12.5, 0, 2.6, 1.2, 2.4, 1.2, '#3b2a1a', true)
      for (const y of [0.3, 1.1, 1.9]) bx(12.5, y, 2.6, 1.0, 0.06, 1.0, '#8a5a3b')
      trophy(12.5, 0.36, 2.6, 0.8, '#e3b341')
      trophy(12.5, 1.16, 2.6, 0.8, '#c4ced4')
      trophy(12.5, 1.96, 2.6, 0.8, '#e3b341')
      pig(2.0, 8.0, 0.9)
      beanbag(12.2, 8.0, '#0a7b45')
      basketball(3.8, 0.3, 8.6)
      hot('taca', 'Taças', 3.2, 3.9, ['.inv-col:nth-child(1) .inv-card'])
      hot('idolos', 'Meus ídolos', 10.8, 4.2, ['.inv-col:nth-child(2) .inv-card'])
      hot('intro', 'Palmeirense de coração', 7, 7.4, ['.lead'])
    },
    // CINEMA: tela, poltronas, pipoca e cartazes de heróis e de Space Jam (Jordan e LeBron)
    cinema() {
      bx(7, 0.7, 0.12, 9.4, 3.4, 0.14, '#1c1526')
      glow(7, 0.8, 0.2, 9.0, 3.2, 0.02, '#e8e0f5')
      for (const s of [-1, 1]) bx(7 + s * 5.1, 0, 0.5, 0.9, 4.0, 0.6, '#b3202e')
      sign('back', 7, 4.2, 4.0, 0.5, 'SESSÃO DA CASA', '#1c1526', '#ffd166')
      for (let r = 0; r < 3; r++) seatRow(3.1, 5.2 + r * 1.3, 7, '#d9304f')
      plaque('left', 3.4, 2.6, 1.6, 2.2, 'POP', '#6e5ce6', '#ffffff')
      plaque('left', 6.4, 2.6, 1.6, 2.2, 'TERROR', '#3a1f4d', '#ff6b6b')
      plaque('right', 3.4, 2.6, 1.6, 2.2, 'SANDLER', '#e08a2e', '#ffffff')
      plaque('right', 6.4, 2.6, 1.6, 2.2, 'CARREY', '#2a9d8f', '#ffffff')
      wallArt('left', 8.8, 2.6, 1.0, 1.5, art('jordan'), '#ffd166')
      wallArt('right', 8.8, 2.6, 1.0, 1.5, art('lebron'), '#ffd166')
      plaque('left', 9.9, 3.9, 0.3, 0.3, 'SPACE JAM', '#1d4ed8', '#ffd166', '#ffd166')
      wallArt('back', 1.2, 2.6, 1.0, 1.5, art('batman'), '#ffd166')
      wallArt('back', 12.8, 2.6, 1.0, 1.5, art('superman'), '#ffd166')
      popcorn(12.5, 8.4)
      basketball(3.4, 0.3, 8.8)
      hot('pop', 'Cultura pop', 2.8, 3.4, ['h3:nth-of-type(1)', 'ul.movies:nth-of-type(1)'])
      hot('terror', 'Terror', 2.8, 6.4, ['h3:nth-of-type(2)', 'ul.movies:nth-of-type(2)'])
      hot('sandler', 'Adam Sandler', 11.2, 3.4, ['h3:nth-of-type(3)', 'ul.movies:nth-of-type(3)'])
      hot('carrey', 'Jim Carrey', 11.2, 6.4, ['h3:nth-of-type(4)', 'ul.movies:nth-of-type(4)'])
    },
    // BIBLIOTECA: estante, escada, poltronas, quadrinhos e um pouco de bola ao cesto
    biblioteca() {
      for (const x of [2.4, 5.6, 8.8, 12.0]) shelf(x, 0.75, 2.6, 0.9, 3, 5)
      basketball(11.2, 2.9, 0.75, 0.24)
      mug(3.2, 2.62, 0.8, '#c4ced4')
      figurine(7.9, 2.62, 0.8, '#c1121f', '#1d4ed8', '#1d4ed8')
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
      windowAt('left', 5.4, 2.6, 1.8, 1.6)
      decal('left', 8.4, 3.2, 1.8, 0.9, art('pennant', '#0a7b45', '#ffffff', 'AVANTI'))
      wallArt('right', 5.4, 2.6, 1.3, 1.8, art('jordan'), '#6b4a2f')
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
        else a.o.visible = Math.sin(time * 5 + a.phase * 2.1) > -0.6
      }
    },
  }
}
