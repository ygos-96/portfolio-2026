// Interiores dos prédios: cada lugar vira uma sala quadrada (estilo Habbo), com quadros e objetos
// nas paredes. Cada "hotspot" é um círculo brilhante no chão: ao ficar nele o jogador abre a ficha
// daquele assunto. Os helpers de material/contorno vêm do motor (game3d.js) para manter o mesmo visual.
import * as THREE from 'three'

export const ROOM_W = 14
export const ROOM_D = 10
const WALL_H = 4.6

// cores de cada sala: piso, parede, rodapé, destaque e o fundo fora da sala
const THEMES = {
  sobre: { floor: ['#c99a5b', '#b88748'], wall: '#f6e3c4', trim: '#8a5a3b', accent: '#c8553d', bg: '#3b2a1a' },
  projetos: { floor: ['#9aa0a8', '#8d939c'], wall: '#d9c3a0', trim: '#4a4f58', accent: '#e08a2e', bg: '#2d2a32' },
  formacao: { floor: ['#d9c9a3', '#cdbd95'], wall: '#cfe0f5', trim: '#2f4f8a', accent: '#3a5fa3', bg: '#1f2a44' },
  skills: { floor: ['#e4eee8', '#d5e3da'], wall: '#bfe3d1', trim: '#2f6b4a', accent: '#2f6b4a', bg: '#10281c' },
  contato: { floor: ['#e9d9b8', '#dccaa4'], wall: '#f6ead0', trim: '#a93d3a', accent: '#a93d3a', bg: '#3a1614' },
  estadio: { floor: ['#cfd3d8', '#c1c6cc'], wall: '#0a7b45', trim: '#ffffff', accent: '#0a7b45', bg: '#06301c' },
  palco: { floor: ['#3b2f5c', '#33284f'], wall: '#241c45', trim: '#ff6bd6', accent: '#ff6bd6', bg: '#0e0a22' },
  cinema: { floor: ['#5a1f2f', '#4d1827'], wall: '#2a1f3d', trim: '#ffd166', accent: '#d9304f', bg: '#0c0814' },
  biblioteca: { floor: ['#a9774b', '#9a6a40'], wall: '#efe2c4', trim: '#6b4a2f', accent: '#3f7d4d', bg: '#2a1c10' },
}

export function buildRoom(key, h) {
  const th = THEMES[key]
  const group = new THREE.Group()
  const solids = []
  const hotspots = []
  const markers = []

  const add = (o) => {
    group.add(o)
    return o
  }
  // caixa: (x, z) é o centro no chão e y é a base
  const bx = (x, y, z, w, hh, d, color, solid = false) => {
    const m = add(h.mesh(new THREE.BoxGeometry(w, hh, d), color, x, y + hh / 2, z))
    if (solid) solids.push({ x0: x - w / 2, x1: x + w / 2, z0: z - d / 2, z1: z + d / 2 })
    return m
  }
  const cy = (x, y, z, r, hh, color, seg = 12) => add(h.mesh(new THREE.CylinderGeometry(r, r, hh, seg), color, x, y + hh / 2, z))
  const ball = (x, y, z, r, color) => add(h.mesh(new THREE.SphereGeometry(r, 10, 8), color, x, y, z))
  const glow = (x, y, z, w, hh, d, color) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, hh, d), new THREE.MeshBasicMaterial({ color }))
    m.position.set(x, y + hh / 2, z)
    return add(m)
  }

  // ----- piso, paredes e rodapé -----
  const cv = document.createElement('canvas')
  cv.width = 512
  cv.height = Math.round((512 * ROOM_D) / ROOM_W)
  const g2 = cv.getContext('2d')
  const tile = cv.width / ROOM_W
  for (let i = 0; i < ROOM_W; i++)
    for (let j = 0; j < ROOM_D; j++) {
      g2.fillStyle = th.floor[(i + j) % 2]
      g2.fillRect(i * tile, j * tile, tile + 1, tile + 1)
    }
  const floorTex = new THREE.CanvasTexture(cv)
  floorTex.colorSpace = THREE.SRGBColorSpace
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_W, ROOM_D), new THREE.MeshToonMaterial({ map: floorTex, gradientMap: h.ramp }))
  floor.rotation.x = -Math.PI / 2
  floor.position.set(ROOM_W / 2, 0.01, ROOM_D / 2)
  floor.receiveShadow = true
  add(floor)
  bx(ROOM_W / 2, -0.4, ROOM_D / 2, ROOM_W + 0.8, 0.4, ROOM_D + 0.8, th.trim)

  bx(ROOM_W / 2, 0, -0.15, ROOM_W + 0.6, WALL_H, 0.3, th.wall)
  bx(-0.15, 0, ROOM_D / 2, 0.3, WALL_H, ROOM_D, th.wall)
  bx(ROOM_W + 0.15, 0, ROOM_D / 2, 0.3, WALL_H, ROOM_D, th.wall)
  bx(ROOM_W / 2, 0, 0.08, ROOM_W, 0.4, 0.16, th.trim)
  bx(0.08, 0, ROOM_D / 2, 0.16, 0.4, ROOM_D, th.trim)
  bx(ROOM_W - 0.08, 0, ROOM_D / 2, 0.16, 0.4, ROOM_D, th.trim)
  bx(ROOM_W / 2, WALL_H, -0.15, ROOM_W + 0.6, 0.18, 0.5, th.trim)
  bx(-0.15, WALL_H, ROOM_D / 2, 0.5, 0.18, ROOM_D, th.trim)
  bx(ROOM_W + 0.15, WALL_H, ROOM_D / 2, 0.5, 0.18, ROOM_D, th.trim)

  // ----- quadros e placas nas paredes -----
  // wall: 'back' (voltada para +z), 'left' (para +x) ou 'right' (para -x); along = x (ou z) ao longo da parede
  const onWall = (wall, along, y, w, hh, text, bg, fg, border) => {
    const pos = wall === 'back' ? [along, y, 0.04] : wall === 'left' ? [0.04, y, along] : [ROOM_W - 0.04, y, along]
    const ry = wall === 'back' ? 0 : wall === 'left' ? Math.PI / 2 : -Math.PI / 2
    const fr = h.mesh(new THREE.BoxGeometry(w + 0.28, hh + 0.28, 0.1), border || th.trim, 0, 0, 0)
    fr.position.set(...pos)
    fr.rotation.y = ry
    add(fr)
    const pl = h.textSign(text, w, hh, bg, fg)
    pl.position.set(...pos)
    pl.rotation.y = ry
    const off = wall === 'back' ? [0, 0, 0.07] : wall === 'left' ? [0.07, 0, 0] : [-0.07, 0, 0]
    pl.position.add(new THREE.Vector3(...off))
    add(pl)
  }
  // placa sem moldura (letreiro)
  const sign = (wall, along, y, w, hh, text, bg, fg) => onWall(wall, along, y, w, hh, text, bg, fg, bg)

  // ----- hotspots: círculo brilhante no chão + diamante flutuante -----
  const hot = (id, label, x, z, pick) => {
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.55, 0.85, 28), new THREE.MeshBasicMaterial({ color: '#ffd166', transparent: true, opacity: 0.85, side: THREE.DoubleSide }))
    ring.rotation.x = -Math.PI / 2
    ring.position.set(x, 0.05, z)
    add(ring)
    const dia = new THREE.Mesh(new THREE.OctahedronGeometry(0.22), new THREE.MeshBasicMaterial({ color: '#ffd166' }))
    dia.position.set(x, 1.5, z)
    add(dia)
    markers.push({ dia, ring, y: 1.5, phase: hotspots.length })
    hotspots.push({ id, label, x, z, r: 1.15, pick, kind: 'info' })
  }
  // saída: tapete na frente da sala
  const mat = h.textSign('SAÍDA', 2.6, 0.9, th.accent, '#fff6e5')
  mat.rotation.x = -Math.PI / 2
  mat.position.set(ROOM_W / 2, 0.03, ROOM_D - 1.0)
  add(mat)
  hotspots.push({ id: 'exit', label: '', x: ROOM_W / 2, z: ROOM_D - 1.0, r: 0.9, kind: 'exit' })

  // ----- móveis reutilizáveis -----
  const rug = (x, z, w, d, color) => bx(x, 0.01, z, w, 0.03, d, color)
  const plant = (x, z) => {
    cy(x, 0, z, 0.32, 0.5, '#a0522d')
    ball(x, 1.0, z, 0.55, '#3f9a3a')
    ball(x + 0.2, 1.45, z - 0.1, 0.35, '#5fbf4a')
    solids.push({ x0: x - 0.35, x1: x + 0.35, z0: z - 0.35, z1: z + 0.35 })
  }
  const lamp = (x, z, color = '#ffd166') => {
    cy(x, 0, z, 0.18, 0.1, '#3b2a1a')
    cy(x, 0.1, z, 0.05, 1.4, '#3b2a1a', 6)
    cy(x, 1.5, z, 0.32, 0.4, color, 10)
  }
  const sofa = (x, z, w, d, color) => {
    bx(x, 0, z, w, 0.5, d, color, true)
    bx(x, 0.5, z - d / 2 + 0.2, w, 0.7, 0.4, color)
    for (const s of [-1, 1]) bx(x + (s * (w - 0.3)) / 2, 0.5, z, 0.3, 0.5, d, color)
  }
  const desk = (x, z, w, d, color = '#8a5a3b') => {
    bx(x, 0.7, z, w, 0.14, d, color, true)
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) bx(x + sx * (w / 2 - 0.12), 0, z + sz * (d / 2 - 0.12), 0.14, 0.7, 0.14, '#5a341c')
  }
  const monitor = (x, y, z, color) => {
    bx(x, y, z, 1.3, 0.9, 0.1, '#1c1526')
    glow(x, y + 0.06, z + 0.06, 1.14, 0.76, 0.02, color)
    bx(x, y - 0.12, z, 0.14, 0.16, 0.12, '#1c1526')
  }
  const shelf = (x, z, w, d, rows, cols) => {
    bx(x, 0, z, w, 2.6, d, '#6b4a2f', true)
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) bx(x - w / 2 + 0.35 + c * ((w - 0.6) / cols), 0.35 + r * 0.7, z + d / 2 - 0.05, 0.22, 0.5, 0.1, ['#e63946', '#2a9d8f', '#f4a261', '#4f7fcf', '#9b5de5'][(r + c) % 5])
  }
  const rack = (x, z, led) => {
    bx(x, 0, z, 1.1, 2.6, 0.9, '#2d2a32', true)
    for (let i = 0; i < 5; i++) {
      glow(x - 0.3, 0.4 + i * 0.45, z + 0.46, 0.12, 0.1, 0.02, i % 2 ? '#7cfc7c' : led)
      bx(x + 0.1, 0.38 + i * 0.45, z + 0.46, 0.6, 0.06, 0.02, '#4a4455')
    }
  }
  const seatRow = (x, z, n, color) => {
    for (let i = 0; i < n; i++) {
      bx(x + i * 0.95, 0, z, 0.8, 0.5, 0.8, color)
      bx(x + i * 0.95, 0.5, z + 0.3, 0.8, 0.7, 0.2, color)
    }
  }
  const locker = (x, z, color) => {
    bx(x, 0, z, 0.9, 2.4, 0.7, color, true)
    bx(x, 1.2, z + 0.36, 0.05, 0.4, 0.03, '#ffd166')
  }

  // ----- salas -----
  const ROOMS = {
    sobre() {
      rug(7, 6, 7, 4, '#c8553d')
      bx(7, 0, 0.7, 3.2, 2.2, 1.2, '#b5654a', true)
      bx(7, 0.15, 0.78, 2.2, 1.3, 1.1, '#2d2a32')
      glow(7, 0.2, 1.37, 1.6, 0.5, 0.03, '#ff8a3d')
      bx(7, 2.2, 0.7, 3.8, 0.2, 1.4, '#8a5a3b')
      sofa(1.5, 5.4, 1.4, 3.6, '#4f7fcf')
      shelf(13.3, 4.2, 0.9, 3.4, 3, 4)
      plant(12.7, 8.6)
      lamp(2.4, 1.6)
      onWall('back', 3.2, 2.5, 2.4, 1.5, 'SOBRE MIM', '#fdf0dc', '#7d2f1f')
      onWall('back', 7, 3.55, 2.0, 0.8, 'FOCO', '#e8eefb', '#1f3868')
      onWall('back', 10.8, 2.5, 2.4, 1.5, 'TRAJETÓRIA', '#fbe9e6', '#7d2f1f')
      hot('bio', 'Sobre mim', 3.2, 2.2, ['.inv-col:nth-child(1) .inv-card:nth-child(1)'])
      hot('foco', 'No que eu trabalho', 7, 2.8, ['.inv-col:nth-child(1) .inv-card:nth-child(2)'])
      hot('traj', 'Trajetória', 10.8, 2.2, ['.inv-col:nth-child(2) .inv-card'])
    },
    projetos() {
      bx(7, 0, 1.0, 12.4, 0.9, 1.4, '#6b4a2f', true)
      const cols = ['#5b8def', '#e08a2e', '#7cfc7c', '#ff6bd6', '#4cc9f0', '#ffd166']
      for (let i = 0; i < 6; i++) monitor(1.8 + i * 2.08, 1.35, 0.55, cols[i])
      sign('back', 7, 3.7, 5.6, 0.9, 'OFICINA DE PROJETOS', '#2d2a32', '#f4a259')
      bx(1.0, 0, 6.5, 1.0, 1.2, 2.4, '#c99a5b', true)
      bx(12.9, 0, 5.0, 1.0, 1.0, 1.0, '#c99a5b', true)
      bx(12.9, 1.0, 5.0, 0.8, 0.8, 0.8, '#d9ac6c')
      cy(12.8, 0, 7.4, 0.45, 0.9, '#e08a2e')
      desk(10.6, 7.6, 2.6, 1.2, '#4a4f58')
      lamp(2.8, 8.4, '#f4a259')
      for (let i = 0; i < 6; i++) hot('proj' + i, 'Projeto ' + (i + 1), 1.8 + i * 2.08, 2.5, ['.card:nth-child(' + (i + 1) + ')'])
    },
    formacao() {
      bx(7, 0.9, 0.12, 8, 2.6, 0.12, '#1f3a2f')
      glow(7, 1.0, 0.2, 7.6, 2.4, 0.02, '#274d3b')
      sign('back', 7, 3.9, 4.0, 0.6, 'ESCOLA', '#2f4f8a', '#fffaf0')
      onWall('left', 3.2, 2.4, 2.6, 1.6, 'FORMAÇÃO', '#fffaf0', '#2f4f8a', '#8a5a3b')
      onWall('left', 6.8, 2.4, 2.2, 1.6, 'CURSOS', '#fffaf0', '#2f4f8a', '#8a5a3b')
      onWall('right', 5, 2.4, 3.0, 1.6, 'PRIMEIROS PROJETOS', '#fffaf0', '#2f4f8a', '#8a5a3b')
      for (const [x, z] of [[4.2, 5.6], [7.4, 5.6], [10.2, 5.6], [4.2, 7.6], [7.4, 7.6], [10.2, 7.6]]) {
        desk(x, z, 1.5, 0.9, '#c99a5b')
        bx(x, 0, z + 0.9, 0.6, 0.45, 0.6, '#3a5fa3', true)
      }
      desk(11.8, 1.8, 2.4, 1.0, '#8a5a3b')
      cy(11.8, 0.84, 1.8, 0.3, 0.5, '#e63946', 8)
      cy(1.2, 0, 1.4, 0.4, 1.0, '#cdbf9f')
      ball(1.2, 1.3, 1.4, 0.5, '#4f7fcf')
      hot('edu', 'Formação acadêmica', 3.2, 3.6, ['.inv-col:nth-child(1) .inv-card:nth-child(1)'])
      hot('cursos', 'Cursos e certificações', 6.8, 3.6, ['.inv-col:nth-child(1) .inv-card:nth-child(2)'])
      hot('early', 'Primeiros projetos', 12.0, 5.0, ['.inv-col:nth-child(2) .inv-card'])
    },
    skills() {
      const leds = ['#ffd166', '#ff6bd6', '#4cc9f0', '#ffb703', '#ff4d6d']
      for (let i = 0; i < 5; i++) rack(1.6 + i * 2.5, 0.8, leds[i])
      sign('back', 7, 4.0, 5.0, 0.6, 'SKILLS LAB', '#2f6b4a', '#e4eee8')
      bx(7, 0, 5.4, 4.4, 0.9, 1.4, '#e4eee8', true)
      monitor(5.9, 1.0, 5.2, '#7fe0c0')
      monitor(8.1, 1.0, 5.2, '#4cc9f0')
      bx(12.6, 0, 4.2, 1.4, 1.1, 2.6, '#c9ced6', true)
      cy(12.6, 1.1, 4.2, 0.35, 0.5, '#e76f51', 8)
      onWall('right', 7.6, 2.5, 2.6, 1.5, 'SOFT SKILLS', '#e4f1e9', '#163a27')
      onWall('left', 5, 2.5, 2.6, 1.5, 'IDIOMAS', '#e4f1e9', '#163a27')
      plant(1.0, 8.6)
      for (let i = 0; i < 5; i++) hot('sk' + i, 'Grupo ' + (i + 1), 1.6 + i * 2.5, 2.6, ['.skill-grid > .inv-card:nth-child(' + (i + 1) + ')'])
      hot('soft', 'Soft skills', 11.4, 7.6, ['.inv-grid > .inv-card:nth-child(1)'])
      hot('langs', 'Idiomas', 2.8, 6.2, ['.inv-grid > .inv-card:nth-child(2)'])
    },
    contato() {
      bx(7, 0, 2.4, 9, 1.1, 1.2, '#a93d3a', true)
      bx(7, 1.1, 2.4, 9.2, 0.15, 1.4, '#f6ead0')
      bx(7, 0, 0.5, 11, 2.3, 0.7, '#3a5fa3', true)
      for (let i = 0; i < 12; i++) {
        bx(1.9 + i * 0.84, 0.5 + (i % 2) * 0.9, 0.9, 0.62, 0.55, 0.05, '#2d4a7e')
        glow(1.9 + i * 0.84, 0.72 + (i % 2) * 0.9, 0.94, 0.4, 0.04, 0.02, '#14233f')
      }
      sign('back', 7, 3.5, 5.0, 0.8, 'CORREIOS', '#a93d3a', '#fff6e5')
      onWall('left', 5, 2.5, 2.8, 1.5, 'CONTATO RÁPIDO', '#fbe9e6', '#5e1d1b')
      onWall('right', 5, 2.5, 2.2, 1.5, 'CURRÍCULO', '#fbe9e6', '#5e1d1b')
      bx(12.3, 0, 7.8, 1.3, 1.5, 1.3, '#3a5fa3', true)
      cy(12.3, 1.5, 7.8, 0.65, 1.3, '#3a5fa3', 12).rotation.x = Math.PI / 2
      plant(1.0, 8.6)
      lamp(12.8, 1.6)
      hot('quick', 'Contato rápido', 3.2, 4.4, ['.quick'])
      hot('canais', 'Canais', 7, 4.4, ['.inv-col:nth-child(1) .inv-card'])
      hot('cv', 'Currículo', 10.8, 4.4, ['.inv-col:nth-child(2) .inv-card'])
    },
    estadio() {
      for (let i = 0; i < 6; i++) locker(1.4 + i * 1.05, 0.6, i % 2 ? '#0a7b45' : '#f6f6f6')
      sign('back', 10.4, 3.5, 4.6, 0.8, 'PALESTRA ITÁLIA · 1914', '#0a7b45', '#ffffff')
      bx(7, 0, 5.2, 5, 0.5, 1.6, '#e8e8e8', true)
      bx(7, 0.5, 5.2, 5.2, 0.1, 1.8, '#0a7b45')
      onWall('left', 5, 2.5, 2.8, 1.6, 'TAÇAS', '#e3f4ea', '#064a29')
      onWall('right', 5, 2.5, 2.8, 1.6, 'ÍDOLOS', '#e3f4ea', '#064a29')
      cy(12.4, 0, 2.6, 0.45, 1.0, '#e3b341', 10)
      ball(12.4, 1.35, 2.6, 0.5, '#f4d35e')
      hot('taca', 'Taças', 3.2, 3.8, ['.inv-col:nth-child(1) .inv-card'])
      hot('idolos', 'Meus ídolos', 10.8, 3.8, ['.inv-col:nth-child(2) .inv-card'])
      hot('intro', 'Palmeirense de coração', 7, 7.2, ['.lead'])
    },
    palco() {
      bx(7, 0, 1.8, 12, 0.9, 3.2, '#8a5a3b', true)
      for (const s of [-1, 1]) bx(7 + s * 5.6, 0.9, 1.0, 0.7, 3.4, 0.5, '#b3202e')
      bx(7, 0.9, 0.5, 11, 3.6, 0.2, '#1f1b3a')
      const cols = ['#ff4d6d', '#4cc9f0', '#ffd166', '#80ed99', '#d65bff']
      cols.forEach((c, i) => ball(2.6 + i * 2.2, 4.1, 2.6, 0.22, c))
      for (const s of [-1, 1]) {
        bx(7 + s * 4.6, 0.9, 1.4, 1.0, 1.1, 0.9, '#252430')
        bx(7 + s * 4.6, 2.0, 1.4, 1.0, 1.1, 0.9, '#252430')
      }
      cy(7, 0.9, 1.2, 0.5, 0.45, '#d9304f')
      sign('back', 7, 3.9, 3.8, 0.6, 'AO VIVO', '#1f1b3a', '#ff6bd6')
      seatRow(3, 7.8, 8, '#d9304f')
      bx(2.0, 0, 5.2, 1.6, 1.0, 0.8, '#252430', true)
      bx(12.0, 0, 5.2, 1.6, 1.0, 0.8, '#252430', true)
      for (let i = 0; i < 4; i++) hot('pl' + i, 'Playlist ' + (i + 1), 2.6 + i * 3.0, 4.4, ['.playlist:nth-child(' + (i + 1) + ')'])
      hot('art', 'Artistas', 11.4, 7.2, ['.panel-art', 'h3:last-of-type', '.chips'])
    },
    cinema() {
      bx(7, 0.7, 0.12, 9.4, 3.4, 0.14, '#1c1526')
      glow(7, 0.8, 0.2, 9.0, 3.2, 0.02, '#e8e0f5')
      for (const s of [-1, 1]) bx(7 + s * 5.1, 0, 0.5, 0.9, 4.0, 0.6, '#b3202e')
      sign('back', 7, 4.15, 4.0, 0.5, 'SESSÃO DA CASA', '#1c1526', '#ffd166')
      for (let r = 0; r < 3; r++) seatRow(3.1, 5.2 + r * 1.3, 7, '#d9304f')
      onWall('left', 3.4, 2.6, 1.6, 2.2, 'POP', '#6e5ce6', '#ffffff')
      onWall('left', 6.4, 2.6, 1.6, 2.2, 'TERROR', '#3a1f4d', '#ff6b6b')
      onWall('right', 3.4, 2.6, 1.6, 2.2, 'SANDLER', '#e08a2e', '#ffffff')
      onWall('right', 6.4, 2.6, 1.6, 2.2, 'CARREY', '#2a9d8f', '#ffffff')
      cy(12.5, 0, 8.4, 0.4, 0.9, '#d9304f')
      cy(12.5, 0.9, 8.4, 0.5, 0.3, '#fff2b8')
      hot('pop', 'Cultura pop', 2.8, 3.4, ['h3:nth-of-type(1)', 'ul.movies:nth-of-type(1)'])
      hot('terror', 'Terror', 2.8, 6.4, ['h3:nth-of-type(2)', 'ul.movies:nth-of-type(2)'])
      hot('sandler', 'Adam Sandler', 11.2, 3.4, ['h3:nth-of-type(3)', 'ul.movies:nth-of-type(3)'])
      hot('carrey', 'Jim Carrey', 11.2, 6.4, ['h3:nth-of-type(4)', 'ul.movies:nth-of-type(4)'])
    },
    biblioteca() {
      for (const x of [2.4, 5.6, 8.8, 12.0]) shelf(x, 0.7, 2.6, 0.9, 3, 5)
      sign('back', 7, 4.0, 5.0, 0.6, 'BIBLIOTECA', '#2f5d3a', '#f6e3c4')
      rug(7, 6.2, 7, 3.4, '#3f7d4d')
      desk(7, 6.2, 2.6, 1.2, '#8a5a3b')
      bx(7, 0.84, 6.2, 0.9, 0.1, 0.7, '#e63946')
      bx(2.0, 0, 7.4, 1.4, 0.55, 1.4, '#9b5de5', true)
      bx(12.0, 0, 7.4, 1.4, 0.55, 1.4, '#2a9d8f', true)
      lamp(12.8, 4.2)
      plant(1.0, 3.2)
      for (let i = 0; i < 5; i++) hot('bk' + i, 'Livro ' + (i + 1), 1.9 + i * 2.5, 2.5, ['.book:nth-child(' + (i + 1) + ')'])
    },
  }
  ROOMS[key]()

  // iluminação suave extra da sala (as luzes do mapa também alcançam aqui)
  const fill = new THREE.PointLight('#fff1d6', 24, 26, 1.6)
  fill.position.set(ROOM_W / 2, 7, ROOM_D / 2)
  add(fill)

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
    },
  }
}
