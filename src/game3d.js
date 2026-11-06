// Motor 3D low-poly "estilo Nintendo": toon shading, contorno, texturas pintadas com AO,
// malhas fundidas/instanciadas (poucos draw calls) e qualidade adaptativa para mobile.
// Unidade do mundo: 1 tile = 1 unidade. x = leste, z = sul (a câmera olha para o norte).
import * as THREE from 'three'
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js'
import { BUILDINGS, H, PLACES, POND, START, T, W, buildWorld } from './world.js'
import { sound } from './audio.js'
import { WEATHER_PRESETS } from './weather.js'

const SPEED = 6.6 // unidades por segundo (mais ágil)
const RADIUS = 0.3 // meia largura da caixa de colisão
const ICONS = { sobre: '🏠', projetos: '⚙️', formacao: '📚', skills: '🛠️', contato: '✉️', estadio: '⚽', palco: '🎸', cinema: '🎬', biblioteca: '📖' }
const INK = '#2b1d3a' // cor do contorno

const isMobile = matchMedia('(pointer: coarse)').matches || Math.min(innerWidth, innerHeight) < 600
// níveis de qualidade: o jogo desce de nível sozinho se o FPS cair
const LEVELS = [
  { dpr: isMobile ? 1.5 : 2, shadow: isMobile ? 1024 : 2048, tufts: 1, shadows: true },
  { dpr: 1.25, shadow: 1024, tufts: 0.6, shadows: true },
  { dpr: 1, shadow: 512, tufts: 0.3, shadows: true },
  { dpr: 1, shadow: 512, tufts: 0.15, shadows: false },
]

let seed = 1337
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
const pick = (arr) => arr[Math.floor(rnd() * arr.length)]

// ---------- materiais toon ----------
const ramp = new THREE.DataTexture(new Uint8Array([105, 172, 255]), 3, 1, THREE.RedFormat)
ramp.minFilter = ramp.magFilter = THREE.NearestFilter
ramp.generateMipmaps = false
ramp.needsUpdate = true

const matCache = new Map()
function toon(color = '#ffffff', o = {}) {
  const key = color + JSON.stringify(o)
  if (!matCache.has(key)) matCache.set(key, new THREE.MeshToonMaterial({ color, gradientMap: ramp, ...o }))
  return matCache.get(key)
}
function mesh(geo, color, x = 0, y = 0, z = 0, opts) {
  const m = new THREE.Mesh(geo, typeof color === 'string' ? toon(color, opts) : color)
  m.position.set(x, y, z)
  m.castShadow = true
  m.receiveShadow = true
  return m
}

// ---------- contorno (casco invertido com normais suavizadas) ----------
const inkColor = new THREE.Color(INK)
const inkMats = new Map()
function inkMaterial(t) {
  if (!inkMats.has(t))
    inkMats.set(
      t,
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        uniforms: { uColor: { value: inkColor }, uT: { value: t } },
        vertexShader: `
          uniform float uT;
          void main() {
            vec3 p = position + normalize(normal) * uT;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
          }`,
        fragmentShader: `
          uniform vec3 uColor;
          void main() {
            gl_FragColor = vec4(uColor, 1.0);
            #include <colorspace_fragment>
          }`,
      }),
    )
  return inkMats.get(t)
}
function hullGeometry(geo) {
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', geo.attributes.position.clone())
  if (geo.index) g.setIndex(geo.index.clone())
  const merged = mergeVertices(g, 1e-3)
  merged.computeVertexNormals()
  return merged
}
const hullCache = new Map()
function addOutline(root, thickness = 0.03) {
  const mat = inkMaterial(thickness)
  const list = []
  root.traverse((o) => o.isMesh && !o.userData.noOutline && list.push(o))
  for (const o of list) {
    if (!hullCache.has(o.geometry)) hullCache.set(o.geometry, hullGeometry(o.geometry))
    const h = new THREE.Mesh(hullCache.get(o.geometry), mat)
    h.userData.noOutline = true
    o.add(h)
  }
}

// ---------- texturas pintadas (tileáveis, sem imagens externas) ----------
function canvasTex(size, draw) {
  const cv = document.createElement('canvas')
  cv.width = cv.height = size
  draw(cv.getContext('2d'), size)
  const t = new THREE.CanvasTexture(cv)
  t.colorSpace = THREE.SRGBColorSpace
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.anisotropy = isMobile ? 2 : 4
  return t
}
const wrap9 = (S, fn) => {
  for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) fn(ox, oy)
}

const plasterTex = () =>
  canvasTex(256, (g, S) => {
    g.fillStyle = '#ececec'
    g.fillRect(0, 0, S, S)
    for (let i = 0; i < 26; i++) {
      const x = rnd() * S
      const y = rnd() * S
      const r = 30 + rnd() * 60
      const light = rnd() > 0.5
      wrap9(S, (ox, oy) => {
        const gr = g.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, r)
        gr.addColorStop(0, light ? 'rgba(255,255,255,.55)' : 'rgba(90,80,70,.12)')
        gr.addColorStop(1, 'rgba(255,255,255,0)')
        g.fillStyle = gr
        g.fillRect(x + ox - r, y + oy - r, r * 2, r * 2)
      })
    }
    for (let i = 0; i < 480; i++) {
      g.fillStyle = `rgba(110,95,80,${0.05 + rnd() * 0.1})`
      g.fillRect(rnd() * S, rnd() * S, 1 + rnd() * 2, 1 + rnd() * 2)
    }
  })

const shingleTex = () =>
  canvasTex(256, (g, S) => {
    g.fillStyle = '#8c8c8c'
    g.fillRect(0, 0, S, S)
    const tile = 32
    for (let r = 0; r < 8; r++)
      for (let c = -1; c < 9; c++) {
        const x = c * tile + (r % 2) * (tile / 2)
        const y = r * tile - 8
        const v = Math.floor(222 + rnd() * 33)
        g.fillStyle = `rgb(${v},${v},${v})`
        g.beginPath()
        g.rect(x, y, tile, 20)
        g.arc(x + tile / 2, y + 20, tile / 2, 0, Math.PI)
        g.fill()
        g.strokeStyle = 'rgba(40,20,20,.3)'
        g.lineWidth = 2
        g.beginPath()
        g.arc(x + tile / 2, y + 20, tile / 2 - 1, 0.1, Math.PI - 0.1)
        g.stroke()
        g.fillStyle = 'rgba(255,255,255,.35)'
        g.fillRect(x + 2, y + 2, tile - 4, 3) // brilho no topo da telha
      }
  })

const woodTex = () =>
  canvasTex(256, (g, S) => {
    for (let p = 0; p < 8; p++) {
      const v = Math.floor(232 + rnd() * 22)
      g.fillStyle = `rgb(${v},${v},${v})`
      g.fillRect(p * 32, 0, 32, S)
      g.fillStyle = 'rgba(60,40,30,.35)'
      g.fillRect(p * 32, 0, 2, S)
      for (let i = 0; i < 14; i++) {
        g.fillStyle = `rgba(${rnd() > 0.5 ? '255,255,255' : '70,45,30'},${0.06 + rnd() * 0.08})`
        g.fillRect(p * 32 + 3 + rnd() * 26, rnd() * S, 1 + rnd(), 20 + rnd() * 90)
      }
    }
  })

function paintGround(world, buildings) {
  const P = isMobile ? 24 : 32
  const cv = document.createElement('canvas')
  cv.width = W * P
  cv.height = H * P
  const g = cv.getContext('2d')
  const at = (x, y) => world.ground[y]?.[x] ?? 0
  const GRASS = 0
  const PATH = 1
  const WATER = 2
  const k = P / 40 // escala dos desenhos (feitos para 40px/tile)

  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      g.fillStyle = (x + y) % 2 ? '#86dc54' : '#7ed44c'
      g.fillRect(x * P, y * P, P, P)
    }
  for (let i = 0; i < 110; i++) {
    const cx = rnd() * W * P
    const cy = rnd() * H * P
    const r = (60 + rnd() * 150) * k
    const grad = g.createRadialGradient(cx, cy, 0, cx, cy, r)
    const light = rnd() > 0.5
    grad.addColorStop(0, light ? 'rgba(206,255,120,.3)' : 'rgba(30,130,90,.18)')
    grad.addColorStop(1, 'rgba(0,0,0,0)')
    g.fillStyle = grad
    g.fillRect(cx - r, cy - r, r * 2, r * 2)
  }
  g.lineCap = 'round'
  g.lineWidth = 2 * k
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (at(x, y) !== GRASS) continue
      for (let i = 0; i < 6; i++) {
        const px = x * P + rnd() * P
        const py = y * P + rnd() * P
        g.strokeStyle = rnd() > 0.5 ? '#b0f283' : '#58b73f'
        g.beginPath()
        g.moveTo(px, py)
        g.lineTo(px + (rnd() - 0.5) * 5 * k, py - (4 + rnd() * 5) * k)
        g.stroke()
      }
      if (rnd() < 0.18) {
        // margaridinhas pintadas
        const px = x * P + rnd() * P
        const py = y * P + rnd() * P
        g.fillStyle = '#ffffff'
        for (let a = 0; a < 5; a++) {
          g.beginPath()
          g.arc(px + Math.cos((a * Math.PI * 2) / 5) * 2.2 * k, py + Math.sin((a * Math.PI * 2) / 5) * 2.2 * k, 1.5 * k, 0, 7)
          g.fill()
        }
        g.fillStyle = '#ffd23f'
        g.beginPath()
        g.arc(px, py, 1.4 * k, 0, 7)
        g.fill()
      }
    }

  // caminho em pedras + meio-fio; água
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const t = at(x, y)
      const x0 = x * P
      const y0 = y * P
      if (t === PATH) {
        g.save()
        g.beginPath()
        g.rect(x0, y0, P, P)
        g.clip()
        g.fillStyle = '#d3b072'
        g.fillRect(x0, y0, P, P)
        const s = P / 2
        for (let j = 0; j < 2; j++)
          for (let i = -1; i < 3; i++) {
            g.fillStyle = pick(['#f7e1b2', '#f2d99f', '#fbe9c0', '#eed297'])
            g.beginPath()
            g.roundRect(x0 + i * s + (j % 2) * (s / 2) + 1, y0 + j * s + 1, s - 2, s - 2, 5 * k)
            g.fill()
          }
        g.restore()
        g.fillStyle = '#b48a50'
        const e = 5 * k
        if (at(x, y - 1) !== PATH) g.fillRect(x0, y0, P, e)
        if (at(x, y + 1) !== PATH) g.fillRect(x0, y0 + P - e, P, e)
        if (at(x - 1, y) !== PATH) g.fillRect(x0, y0, e, P)
        if (at(x + 1, y) !== PATH) g.fillRect(x0 + P - e, y0, e, P)
      } else if (t === WATER) {
        g.fillStyle = '#2a8fd0'
        g.fillRect(x0, y0, P, P)
      }
    }
  g.fillStyle = '#ecd9a3'
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (at(x, y) !== GRASS) continue
      const x0 = x * P
      const y0 = y * P
      const e = 6 * k
      if (at(x, y - 1) === WATER) g.fillRect(x0, y0 + P - e, P, e)
      if (at(x, y + 1) === WATER) g.fillRect(x0, y0, P, e)
      if (at(x - 1, y) === WATER) g.fillRect(x0 + P - e, y0, e, P)
      if (at(x + 1, y) === WATER) g.fillRect(x0, y0, e, P)
    }

  // oclusão ambiental pintada: halo escuro sob prédios, árvores e postes
  g.lineJoin = 'round'
  for (const b of buildings) {
    for (let i = 0; i < 9; i++) {
      const o = i * 3.4 * k
      g.strokeStyle = `rgba(20,70,50,${0.15 * (1 - i / 9)})`
      g.lineWidth = 7 * k
      g.strokeRect(b.x * P - o, b.y * P - o, b.w * P + o * 2, b.h * P + o * 2)
    }
  }
  const blob = (cx, cy, r, a) => {
    const gr = g.createRadialGradient(cx, cy, 0, cx, cy, r)
    gr.addColorStop(0, `rgba(20,70,50,${a})`)
    gr.addColorStop(1, 'rgba(20,70,50,0)')
    g.fillStyle = gr
    g.fillRect(cx - r, cy - r, r * 2, r * 2)
  }
  for (const t of world.trees) blob((t.x + 0.5) * P, (t.y + 0.55) * P, 0.95 * P, 0.38)
  for (const [lx, ly] of world.lamps) blob((lx + 0.5) * P, (ly + 0.5) * P, 0.5 * P, 0.35)

  const tex = new THREE.CanvasTexture(cv)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = isMobile ? 2 : 8
  return tex
}

// ---------- coletor de peças (prédios fundidos por material) ----------
function boxGeo(w, h, d, tile) {
  const g = new THREE.BoxGeometry(w, h, d)
  const uv = g.attributes.uv
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]]
  for (let i = 0; i < 24; i++) {
    const f = i >> 2
    uv.setXY(i, (uv.getX(i) * dims[f][0]) / tile, (uv.getY(i) * dims[f][1]) / tile)
  }
  return g
}

function roofGeo(w, d, h, tile) {
  const hw = w / 2
  const hd = d / 2
  const A = [0, h, 0]
  const P = [[-hw, 0, hd], [hw, 0, hd], [hw, 0, -hd], [-hw, 0, -hd]]
  const pos = []
  const uv = []
  for (let i = 0; i < 4; i++) {
    const p = P[i]
    const q = P[(i + 1) % 4]
    const edge = i % 2 === 0 ? w : d
    const slant = Math.hypot(h, i % 2 === 0 ? hd : hw)
    pos.push(...p, ...q, ...A)
    uv.push(0, 0, edge / tile, 0, edge / 2 / tile, slant / tile)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  g.computeVertexNormals()
  return g
}

class Parts {
  constructor() {
    this.cats = { wall: [], roof: [], wood: [], glass: [], plain: [] }
    this.hull = []
    this.m = new THREE.Matrix4()
    this.q = new THREE.Quaternion()
    this.e = new THREE.Euler()
    this.frame = null
  }
  add(cat, geo, x, y, z, color, { ry = 0, ao = 0, hull = false } = {}) {
    if (this.frame) {
      // gira a peça em torno do centro do prédio (os construtores desenham tudo virado para o sul)
      const { cx, cz, rot } = this.frame
      const dx = x - cx
      const dz = z - cz
      x = cx + dx * Math.cos(rot) + dz * Math.sin(rot)
      z = cz - dx * Math.sin(rot) + dz * Math.cos(rot)
      ry += rot
    }
    geo.computeBoundingBox()
    const { min, max } = geo.boundingBox
    const col = new THREE.Color(color)
    const pos = geo.attributes.position
    const colors = new Float32Array(pos.count * 3)
    for (let i = 0; i < pos.count; i++) {
      const t = (pos.getY(i) - min.y) / Math.max(1e-4, max.y - min.y)
      const f = 1 - ao * (1 - t)
      colors[i * 3] = col.r * f
      colors[i * 3 + 1] = col.g * f
      colors[i * 3 + 2] = col.b * f
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    this.q.setFromEuler(this.e.set(0, ry, 0))
    this.m.compose(new THREE.Vector3(x, y, z), this.q, new THREE.Vector3(1, 1, 1))
    geo.applyMatrix4(this.m)
    const flat = geo.index ? geo.toNonIndexed() : geo
    this.cats[cat].push(flat)
    if (hull) this.hull.push(flat)
  }
}

function addBuilding(P, b) {
  const w = b.w
  const d = b.h
  const wallH = b.key === 'projetos' ? 3.7 : 3.1
  const roofH = b.key === 'projetos' ? 2.6 : 2.2
  const baseH = 0.3
  const cx = b.x + w / 2
  const cz = b.y + d / 2
  const roofY = baseH + wallH + 0.28

  P.add('wall', boxGeo(w + 0.3, baseH, d + 0.3, 2), cx, baseH / 2, cz, '#cdbf9f', { hull: true })
  P.add('wall', boxGeo(w, wallH, d, 2.4), cx, baseH + wallH / 2, cz, b.wall, { ao: 0.42, hull: true })
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) P.add('wood', boxGeo(0.4, wallH, 0.4, 1.2), cx + (sx * w) / 2, baseH + wallH / 2, cz + (sz * d) / 2, b.trim, { hull: true })
  P.add('wood', boxGeo(w + 0.06, 0.14, d + 0.06, 1.2), cx, baseH + 1.0, cz, b.trim)
  P.add('wood', boxGeo(w + 1.1, 0.28, d + 1.1, 1.2), cx, baseH + wallH + 0.14, cz, b.roofDark, { hull: true })
  P.add('roof', roofGeo(w + 1.1, d + 1.1, roofH, 2.8), cx, roofY, cz, b.roof, { ao: 0.28, hull: true })
  P.add('wood', boxGeo(0.5, 0.3, 0.5, 1), cx, roofY + roofH, cz, b.roofDark)

  // chaminé
  const chx = cx + w / 2 - 1.4
  const chz = cz - d / 2 + 1.4
  const chy = roofY + roofH * 0.45
  P.add('wall', boxGeo(0.7, 1.6, 0.7, 1.2), chx, chy + 0.8, chz, '#c0694e', { ao: 0.3, hull: true })
  P.add('wood', boxGeo(0.9, 0.2, 0.9, 1), chx, chy + 1.7, chz, '#7e4333')

  // porta
  const dx = b.doorX + 1
  const fz = cz + d / 2
  P.add('wood', boxGeo(2.5, 2.55, 0.2, 1.2), dx, baseH + 1.27, fz + 0.04, b.trim)
  P.add('wood', boxGeo(2.1, 2.3, 0.16, 1), dx, baseH + 1.15, fz + 0.12, '#8a5230')
  P.add('wood', boxGeo(0.06, 2.3, 0.18, 1), dx, baseH + 1.15, fz + 0.13, '#5a341c')
  for (const s of [-1, 1]) {
    P.add('glass', boxGeo(0.55, 0.6, 0.18, 1), dx + s * 0.55, baseH + 1.6, fz + 0.15, '#a6e1ff')
    P.add('plain', new THREE.SphereGeometry(0.07, 6, 6), dx + s * 0.14, baseH + 1.0, fz + 0.25, '#ffd166')
  }
  P.add('wall', boxGeo(3.0, 0.14, 0.9, 2), dx, baseH + 0.07, fz + 0.6, '#c2b494', { hull: false })
  // toldinho sobre a porta
  P.add('roof', roofGeo(3.2, 1.2, 0.55, 1.4), dx, baseH + 2.65, fz + 0.5, b.roofDark, { ao: 0.2 })

  // janelas (frente e laterais) com floreira
  const windowAt = (wx, wz, ry) => {
    const part = (cat, geo, lx, ly, lz, color) => {
      const rx = lx * Math.cos(ry) + lz * Math.sin(ry)
      const rz = -lx * Math.sin(ry) + lz * Math.cos(ry)
      P.add(cat, geo, wx + rx, baseH + 1.9 + ly, wz + rz, color, { ry })
    }
    part('wood', boxGeo(1.6, 1.5, 0.14, 1), 0, 0, 0, '#ffffff')
    part('glass', boxGeo(1.3, 1.2, 0.18, 1), 0, 0, 0.02, '#9fdcff')
    part('wood', boxGeo(1.3, 0.07, 0.2, 1), 0, 0, 0.03, '#ffffff')
    part('wood', boxGeo(0.07, 1.2, 0.2, 1), 0, 0, 0.03, '#ffffff')
    part('wood', boxGeo(1.5, 0.28, 0.4, 1), 0, -0.95, 0.2, '#8a5a3b')
    for (let i = 0; i < 5; i++) part('plain', new THREE.SphereGeometry(0.11, 6, 6), -0.6 + i * 0.3, -0.72, 0.22, pick([b.accent, '#ff6b9a', '#ffd166']))
  }
  windowAt(dx - 3, fz + 0.06, 0)
  windowAt(dx + 3, fz + 0.06, 0)
  windowAt(cx + w / 2 + 0.06, cz, Math.PI / 2)
  windowAt(cx - w / 2 - 0.06, cz, -Math.PI / 2)

  return { chimney: new THREE.Vector3(chx, chy + 1.9, chz), labelY: baseH + wallH + 0.9 }
}

// ---------- locais de lazer: estádio, palco, cinema e biblioteca ----------
const cyl = (rt, rb, h, seg = 10) => new THREE.CylinderGeometry(rt, rb, h, seg)
const ball = (r) => new THREE.SphereGeometry(r, 8, 6)

function addCinema(P, b) {
  const { w, h: d } = b
  const cx = b.x + w / 2
  const cz = b.y + d / 2
  const fz = b.y + d
  const H = 3.8
  P.add('wall', boxGeo(w, H, d, 2.4), cx, 0.3 + H / 2, cz, '#4a3a66', { ao: 0.4, hull: true })
  P.add('wood', boxGeo(w + 0.1, 0.35, d + 0.1, 1.2), cx, 1.2, cz, '#d9304f')
  P.add('wood', boxGeo(w + 0.5, 0.3, d + 0.5, 1.2), cx, 0.3 + H + 0.15, cz, '#2a2238', { hull: true })
  // marquise com lâmpadas
  P.add('wood', boxGeo(w - 1.2, 0.35, 1.8, 1.2), cx, 3.1, fz + 0.9, '#d9304f', { hull: true })
  P.add('wood', boxGeo(w - 1.0, 0.12, 1.9, 1.2), cx, 3.34, fz + 0.9, '#ffe08a')
  for (let i = 0; i < 9; i++) P.add('plain', ball(0.09), cx - (w - 2) / 2 + (i * (w - 2)) / 8, 3.0, fz + 1.82, '#fff2b8')
  for (const s of [-1, 1]) P.add('wood', cyl(0.12, 0.12, 2.8, 6), cx + s * (w / 2 - 0.9), 1.7, fz + 1.7, '#8a6ea8')
  // porta e cartazes
  P.add('wood', boxGeo(2.8, 2.5, 0.2, 1), cx, 1.55, fz + 0.06, '#1c1526')
  P.add('glass', boxGeo(2.4, 2.1, 0.22, 1), cx, 1.5, fz + 0.08, '#6fb7e8')
  const cols = ['#e63946', '#f4a261', '#2a9d8f', '#9b5de5']
  ;[-3.9, -2.4, 2.4, 3.9].forEach((ox, i) => {
    P.add('wood', boxGeo(1.2, 1.7, 0.08, 1), cx + ox, 2.05, fz + 0.05, '#1c1526')
    P.add('plain', boxGeo(1.0, 1.5, 0.1, 1), cx + ox, 2.05, fz + 0.1, cols[i])
  })
  // placa do letreiro
  for (const s of [-1, 1]) P.add('wood', boxGeo(0.25, 1.4, 0.25, 1), cx + s * 2.6, 0.3 + H + 0.3 + 0.7, fz - 0.1, '#2a2238')
  P.add('wood', boxGeo(7, 1.6, 0.3, 1), cx, 0.3 + H + 0.3 + 1.0, fz - 0.1, '#1c1526', { hull: true })
  return { labelY: 6.9 }
}

function addLibrary(P, b) {
  const { w, h: d } = b
  const cx = b.x + w / 2
  const cz = b.y + d / 2
  const fz = b.y + d
  const H = 3.4
  const stone = '#efe2c4'
  const green = '#3f7d4d'
  P.add('wall', boxGeo(w, H, d, 2.4), cx, 0.3 + H / 2, cz, stone, { ao: 0.4, hull: true })
  P.add('wood', boxGeo(w + 0.3, 0.25, d + 0.3, 1.2), cx, 0.3 + H + 0.12, cz, '#8a5a3b', { hull: true })
  const roofY = 0.3 + H + 0.25
  P.add('roof', roofGeo(w + 0.8, d + 0.8, 1.6, 2.8), cx, roofY, cz, green, { ao: 0.25, hull: true })
  // cúpula
  P.add('wall', cyl(1.3, 1.4, 0.9, 14), cx, roofY + 1.55, cz, stone, { hull: true })
  P.add('roof', new THREE.SphereGeometry(1.3, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), cx, roofY + 2.0, cz, green, { ao: 0.2, hull: true })
  P.add('wood', cyl(0.05, 0.05, 0.7, 6), cx, roofY + 2.0 + 1.55, cz, '#8a5a3b')
  P.add('plain', ball(0.12), cx, roofY + 2.0 + 1.95, cz, '#ffd166')
  // pórtico com colunas
  P.add('wall', boxGeo(7.4, 0.2, 2, 2), cx, 0.4, fz + 1.0, '#d8c9a8')
  for (const ox of [-3, -1, 1, 3]) P.add('wall', cyl(0.2, 0.24, 3.0, 10), cx + ox, 0.5 + 1.5, fz + 1.7, '#fbf3df', { hull: true })
  P.add('wall', boxGeo(7.4, 0.7, 2.2, 2), cx, 0.5 + 3.0 + 0.35, fz + 1.0, stone, { hull: true })
  P.add('roof', roofGeo(7.6, 2.4, 0.8, 2.8), cx, 0.5 + 3.7, fz + 1.0, green, { ao: 0.2 })
  // porta e janelas
  P.add('wood', boxGeo(2.0, 2.6, 0.2, 1), cx, 1.6, fz + 0.06, '#5a341c')
  for (const ox of [-2.6, 2.6]) {
    P.add('wood', boxGeo(1.1, 1.7, 0.14, 1), cx + ox, 2.0, fz + 0.05, '#ffffff')
    P.add('glass', boxGeo(0.9, 1.5, 0.18, 1), cx + ox, 2.0, fz + 0.07, '#9fdcff')
  }
  // pilhas de livros na entrada
  const bookCols = ['#e63946', '#2a9d8f', '#f4a261', '#4f7fcf', '#9b5de5']
  for (const s of [-1, 1])
    for (let i = 0; i < 5; i++) P.add('plain', boxGeo(0.9 - i * 0.06, 0.2, 0.6, 1), cx + s * 4.7, 0.4 + i * 0.21, fz + 0.9, bookCols[(i + (s > 0 ? 2 : 0)) % 5])
  return { labelY: 7.6 }
}

// Estádio oval no estilo do antigo Palestra Itália: bacia de arquibancadas em três níveis (verde, branco e concreto),
// mais baixa do lado da entrada, cobertura na arquibancada do fundo, refletores altos e portão com letreiro.
const STAD = { px: 8, pz: 5.4, ring: 1.5, n: 72 } // meio-campo (px, pz), espessura de cada nível, segmentos por nível
const stadEllipse = (k, off = 0) => ({ a: STAD.px + 1.2 + k * STAD.ring + off, b: STAD.pz + 1.2 + k * STAD.ring + off })
// altura do nível k no ângulo t (t = π/2 é a frente/sul: mais baixa)
const stadHeight = (k, t) => (1 + k) * (0.75 + 0.25 * -Math.sin(t))

function addStadium(P, b) {
  const cx = b.cx
  const cz = b.cz
  const green = '#0a7b45'
  const white = '#f4f4ee'
  const concrete = '#aeb7b1'
  const gap = 0.2
  const tierColor = [green, white, concrete]
  const N = STAD.n
  for (let k = 0; k < 3; k++) {
    const { a, b: bb } = stadEllipse(k)
    for (let i = 0; i < N; i++) {
      const t = ((i + 0.5) / N) * Math.PI * 2
      if (Math.abs(t - Math.PI / 2) < gap) continue // portão
      const x = a * Math.cos(t)
      const z = bb * Math.sin(t)
      let tx = -a * Math.sin(t)
      let tz = bb * Math.cos(t)
      const ds = Math.hypot(tx, tz) * ((Math.PI * 2) / N)
      const len = Math.hypot(tx, tz)
      tx /= len
      tz /= len
      const h = 0.3 + stadHeight(k, t)
      const ry = Math.atan2(-tz, tx)
      const col = k === 1 ? (i % 2 ? white : '#d7efe0') : k === 0 ? (i % 6 < 3 ? green : '#0c8a4e') : concrete
      P.add('wall', boxGeo(ds * 1.14, h, STAD.ring + 0.04, 1.6), cx + x, h / 2, cz + z, col, { ry, ao: 0.3, hull: true })
      // portinholas escuras na fachada externa
      if (k === 2 && i % 4 === 0) {
        const nx = (bb * Math.cos(t)) / Math.hypot(bb * Math.cos(t), a * Math.sin(t))
        const nz = (a * Math.sin(t)) / Math.hypot(bb * Math.cos(t), a * Math.sin(t))
        P.add('plain', boxGeo(0.85, 1.5, 0.12, 1), cx + x + nx * (STAD.ring / 2 + 0.03), 0.95, cz + z + nz * (STAD.ring / 2 + 0.03), '#2d3a33', { ry })
      }
      // faixa verde na borda de cima do nível de concreto
      if (k === 2) P.add('wall', boxGeo(ds * 1.14, 0.14, STAD.ring + 0.1, 1.6), cx + x, h + 0.07, cz + z, green, { ry })
    }
  }
  // cobertura da arquibancada do fundo (norte)
  const { a: ca, b: cb } = stadEllipse(2, -0.9)
  for (let i = 0; i < N; i++) {
    const t = ((i + 0.5) / N) * Math.PI * 2
    if (!(t > Math.PI + 0.55 && t < Math.PI * 2 - 0.55)) continue
    const x = ca * Math.cos(t)
    const z = cb * Math.sin(t)
    let tx = -ca * Math.sin(t)
    let tz = cb * Math.cos(t)
    const len = Math.hypot(tx, tz)
    const ds = len * ((Math.PI * 2) / N)
    tx /= len
    tz /= len
    const ry = Math.atan2(-tz, tx)
    P.add('wall', boxGeo(ds * 1.14, 0.22, 3.4, 1.6), cx + x, 5.0, cz + z, white, { ry, hull: true })
    P.add('wall', boxGeo(ds * 1.14, 0.4, 0.12, 1.6), cx + x + (cb * Math.cos(t) / Math.hypot(cb * Math.cos(t), ca * Math.sin(t))) * 1.7, 4.95, cz + z + (ca * Math.sin(t) / Math.hypot(cb * Math.cos(t), ca * Math.sin(t))) * 1.7, green, { ry })
    if (i % 6 === 0) P.add('wood', cyl(0.09, 0.09, 4.9, 6), cx + x * 1.07, 2.55, cz + z * 1.07, '#9aa0a6')
  }
  // refletores altos nos quatro cantos
  for (const [fx, fz] of [[-10.2, -7.6], [10.2, -7.6], [-10.2, 7.8], [10.2, 7.8]]) {
    P.add('wood', cyl(0.09, 0.14, 8.5, 6), cx + fx, 4.25, cz + fz, '#9aa0a6', { hull: true })
    P.add('plain', boxGeo(1.5, 0.9, 0.25, 1), cx + fx, 8.7, cz + fz, '#fffbe0')
  }
  // portão de entrada com arco e bandeiras
  const gz = cz + 10.2
  for (const s of [-1, 1]) {
    P.add('wall', boxGeo(0.8, 4.2, 1.2, 1), cx + s * 3.1, 2.1, gz, white, { hull: true })
    P.add('wood', cyl(0.04, 0.04, 2.6, 6), cx + s * 3.1, 4.2 + 1.3, gz, '#9aa0a6')
    P.add('plain', boxGeo(1.2, 0.7, 0.05, 1), cx + s * 3.1 + s * 0.62, 6.5, gz, s > 0 ? white : green)
  }
  P.add('wall', boxGeo(7.0, 1.1, 1.3, 1), cx, 4.2 + 0.55, gz, green, { hull: true })
  P.add('wall', boxGeo(6.6, 0.18, 1.4, 1), cx, 5.4, gz, white)
  return { labelY: 9.5 }
}

function addStage(P, b) {
  const { w, h: d } = b
  const cx = b.x + w / 2
  const fz = b.y + d
  const top = 1.3
  // plataforma de madeira e degrau
  P.add('wood', boxGeo(w, 1.0, d - 1.2, 1.2), cx, 0.8, b.y + (d - 1.2) / 2, '#8a5a3b', { hull: true })
  P.add('wood', boxGeo(2.6, 0.5, 0.9, 1.2), cx, 0.55, b.y + d - 1.2 + 0.45, '#a06a44', { hull: true })
  // fundo e cortinas
  P.add('wall', boxGeo(w, 3.6, 0.3, 2), cx, top + 1.8, b.y + 0.15, '#1f1b3a', { ao: 0.3, hull: true })
  for (const s of [-1, 1]) P.add('plain', boxGeo(0.7, 3.4, 0.5, 1), cx + s * (w / 2 - 0.35), top + 1.7, b.y + 0.7, '#b3202e')
  // estrutura e luzes coloridas
  for (const s of [-1, 1]) P.add('wood', cyl(0.07, 0.07, 3.9, 6), cx + s * (w / 2 - 0.05), top + 1.95, b.y + 1.6, '#9aa0a6')
  P.add('wood', boxGeo(w, 0.25, 0.25, 1), cx, top + 3.9, b.y + 1.6, '#9aa0a6', { hull: true })
  const lights = ['#ff4d6d', '#4cc9f0', '#ffd166', '#80ed99', '#d65bff']
  lights.forEach((c, i) => P.add('plain', ball(0.17), cx - 2.2 + i * 1.1, top + 3.65, b.y + 1.75, c))
  // caixas de som
  for (const s of [-1, 1])
    for (let i = 0; i < 2; i++) {
      P.add('plain', boxGeo(0.9, 1.0, 0.8, 1), cx + s * (w / 2 - 0.65), top + 0.5 + i * 1.0, b.y + 2.9, '#252430', { hull: true })
      P.add('plain', cyl(0.28, 0.28, 0.05, 12).rotateX(Math.PI / 2), cx + s * (w / 2 - 0.65), top + 0.5 + i * 1.0, b.y + 2.9 + 0.42, '#7d7b8c')
    }
  // bateria
  const kz = b.y + 1.5
  P.add('plain', cyl(0.45, 0.45, 0.4, 14).rotateX(Math.PI / 2), cx, top + 0.45, kz + 0.3, '#d9304f')
  for (const s of [-1, 1]) {
    P.add('plain', cyl(0.25, 0.25, 0.25, 12), cx + s * 0.38, top + 1.0, kz, '#e8e8e8')
    P.add('plain', cyl(0.35, 0.35, 0.03, 12), cx + s * 1.0, top + 1.55, kz - 0.2, '#e3b341')
  }
  return { labelY: 6.2 }
}

function addLandmark(P, b) {
  P.add('wall', boxGeo(b.w + 0.3, 0.3, b.h + 0.3, 2), b.x + b.w / 2, 0.15, b.y + b.h / 2, '#cdbf9f')
  return { cinema: addCinema, biblioteca: addLibrary, estadio: addStadium, palco: addStage }[b.key](P, b)
}

// letreiros (texto pintado em canvas, sempre de frente para a câmera)
function textSign(text, w, h, bg, fg) {
  const cv = document.createElement('canvas')
  cv.width = 512
  cv.height = Math.max(32, Math.round((512 * h) / w))
  const g = cv.getContext('2d')
  g.fillStyle = bg
  g.fillRect(0, 0, cv.width, cv.height)
  g.strokeStyle = fg
  g.lineWidth = 6
  g.strokeRect(8, 8, cv.width - 16, cv.height - 16)
  g.fillStyle = fg
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  let size = cv.height * 0.62
  const font = (s) => `900 ${Math.round(s)}px "Arial Black", Impact, system-ui, sans-serif`
  g.font = font(size)
  while (g.measureText(text).width > cv.width * 0.86 && size > 10) {
    size -= 2
    g.font = font(size)
  }
  g.fillText(text, cv.width / 2, cv.height / 2 + size * 0.04)
  const tex = new THREE.CanvasTexture(cv)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = isMobile ? 2 : 4
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex }))
}

function pitchMesh(w, d) {
  const cv = document.createElement('canvas')
  cv.width = 512
  cv.height = Math.round((512 * d) / w)
  const g = cv.getContext('2d')
  for (let i = 0; i < 8; i++) {
    g.fillStyle = i % 2 ? '#3aa84c' : '#43b955'
    g.fillRect((i * cv.width) / 8, 0, cv.width / 8 + 1, cv.height)
  }
  g.strokeStyle = 'rgba(255,255,255,.9)'
  g.lineWidth = 5
  g.strokeRect(10, 10, cv.width - 20, cv.height - 20)
  g.beginPath()
  g.moveTo(cv.width / 2, 10)
  g.lineTo(cv.width / 2, cv.height - 10)
  g.stroke()
  g.beginPath()
  g.arc(cv.width / 2, cv.height / 2, cv.height * 0.2, 0, Math.PI * 2)
  g.stroke()
  g.strokeRect(10, cv.height * 0.28, cv.width * 0.13, cv.height * 0.44)
  g.strokeRect(cv.width - 10 - cv.width * 0.13, cv.height * 0.28, cv.width * 0.13, cv.height * 0.44)
  const tex = new THREE.CanvasTexture(cv)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = isMobile ? 2 : 4
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshLambertMaterial({ map: tex }))
  m.rotation.x = -Math.PI / 2
  m.receiveShadow = true
  return m
}

// integrante da banda (animado, fora da malha fundida)
function makeMember(shirt, kind) {
  const g = new THREE.Group()
  const body = new THREE.Group()
  g.add(body)
  const bx = (w, h, d, c, x, y, z) => mesh(new THREE.BoxGeometry(w, h, d), c, x, y, z)
  const skin = '#f6c19a'
  body.add(bx(0.5, 0.6, 0.32, shirt, 0, 0.95, 0))
  const head = new THREE.Group()
  head.position.y = 1.52
  head.add(mesh(new THREE.SphereGeometry(0.26, 12, 10), skin))
  head.add(mesh(new THREE.SphereGeometry(0.285, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), kind === 'vocal' ? '#2d2a32' : '#7a4a2a', 0, 0.03, 0))
  for (const s of [-1, 1]) head.add(mesh(new THREE.SphereGeometry(0.035, 6, 6), '#2d2a32', s * 0.09, -0.03, 0.235))
  body.add(head)
  for (const s of [-1, 1]) g.add(bx(0.2, 0.65, 0.2, '#2b2f4a', s * 0.13, 0.33, 0))
  const arm = (x) => {
    const p = new THREE.Group()
    p.position.set(x, 1.22, 0)
    p.add(bx(0.15, 0.5, 0.15, shirt, 0, -0.25, 0))
    p.add(mesh(new THREE.SphereGeometry(0.09, 8, 8), skin, 0, -0.52, 0))
    body.add(p)
    return p
  }
  const armL = arm(-0.35)
  const armR = arm(0.35)
  if (kind === 'guitar' || kind === 'bass') {
    const gt = new THREE.Group()
    gt.add(bx(0.5, 0.36, 0.1, kind === 'guitar' ? '#d9534f' : '#4f7fcf', 0, 0, 0))
    const neck = bx(0.75, 0.07, 0.06, '#8a5a3b', 0.55, 0.1, 0)
    neck.rotation.z = 0.35
    gt.add(neck)
    gt.position.set(0.05, 0.8, 0.22)
    gt.rotation.z = -0.35
    body.add(gt)
  }
  if (kind === 'vocal') {
    const mic = new THREE.Group()
    mic.add(mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.3, 6), '#9aa0a6', 0, 0.65, 0))
    mic.add(mesh(new THREE.SphereGeometry(0.07, 8, 8), '#2d2a32', 0, 1.33, 0))
    mic.position.set(0, 0, 0.45)
    g.add(mic)
  }
  addOutline(g, 0.03)
  g.userData = { body, head, armL, armR, kind }
  return g
}

function buildExtras(scene, reduceMotion) {
  const sceneObjs = { members: [], notes: [] }
  const byKey = (k) => PLACES.find((p) => p.key === k)
  const sign = (text, w, h, bg, fg, x, y, z, ry = 0) => {
    const s = textSign(text, w, h, bg, fg)
    s.position.set(x, y, z)
    if (ry) s.rotation.y = ry
    scene.add(s)
  }

  // estádio Palestra Itália
  const st = byKey('estadio')
  const gz = st.cz + 10.2
  sign('PALMEIRAS', 5.2, 0.8, '#0a7b45', '#ffffff', st.cx, 4.75, gz + 0.66)
  sign('1914', 2.8, 0.9, '#111111', '#7cfc7c', st.cx, 5.8, gz + 0.66)
  const pit = pitchMesh(16, 10.8)
  pit.position.set(st.cx, 0.35, st.cz)
  scene.add(pit)

  // cinema girado 75°
  const ci = byKey('cinema')
  const ciSignDist = 0.3 + 3.8 + 0.3 + 1.0
  const ciSignPos = new THREE.Vector3(ci.cx, ciSignDist, ci.cz + ci.h / 2 + 0.07)
  const dxCi = ciSignPos.x - ci.cx
  const dzCi = ciSignPos.z - ci.cz
  const rotCiX = ci.cx + dxCi * Math.cos(ci.rot) + dzCi * Math.sin(ci.rot)
  const rotCiZ = ci.cz - dxCi * Math.sin(ci.rot) + dzCi * Math.cos(ci.rot)
  sign('CINEMA', 6.6, 1.4, '#1c1526', '#ffd166', rotCiX, ciSignDist, rotCiZ, ci.rot)

  // biblioteca girada
  const li = byKey('biblioteca')
  const liDx = 0
  const liDz = li.h / 2 + 2.12
  const rotLiX = li.cx + liDx * Math.cos(li.rot) + liDz * Math.sin(li.rot)
  const rotLiZ = li.cz - liDx * Math.sin(li.rot) + liDz * Math.cos(li.rot)
  sign('BIBLIOTECA', 4.8, 0.5, '#2f5d3a', '#f6e3c4', rotLiX, 3.85, rotLiZ, li.rot)

  // palco girado
  const pa = byKey('palco')
  const top = 1.3
  const paRotPt = (x, z) => {
    const dx = x - pa.cx
    const dz = z - pa.cz
    return {
      x: pa.cx + dx * Math.cos(pa.rot) + dz * Math.sin(pa.rot),
      z: pa.cz - dx * Math.sin(pa.rot) + dz * Math.cos(pa.rot)
    }
  }
  const paSignP = paRotPt(pa.cx, pa.cz - pa.h / 2 + 0.32)
  sign('AO VIVO', 3.6, 0.7, '#1f1b3a', '#ff6bd6', paSignP.x, top + 2.6, paSignP.z, pa.rot)

  const crew = [
    ['vocal', '#ff6b6b', pa.cx, pa.cz + 0.5],
    ['guitar', '#4cc9f0', pa.cx - 1.7, pa.cz],
    ['bass', '#ffd166', pa.cx + 1.7, pa.cz],
    ['drums', '#80ed99', pa.cx, pa.cz - 1.2],
  ]
  crew.forEach(([kind, shirt, x, z], i) => {
    const pt = paRotPt(x, z)
    const m = makeMember(shirt, kind)
    m.position.set(pt.x, top, pt.z)
    m.rotation.y = pa.rot
    scene.add(m)
    sceneObjs.members.push({ m, phase: i * 1.3 })
  })

  // notas musicais subindo do palco
  const noteCols = ['#ff4d6d', '#4cc9f0', '#ffd166', '#80ed99', '#d65bff', '#ffffff']
  for (let i = 0; i < 6; i++) {
    const n = new THREE.Group()
    n.add(mesh(new THREE.SphereGeometry(0.11, 8, 6), noteCols[i], 0, 0, 0))
    n.add(mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.4, 5), noteCols[i], 0.09, 0.2, 0))
    scene.add(n)
    sceneObjs.notes.push({ n, i })
  }
  const paCenter = paRotPt(pa.cx, pa.cz)
  const nx = paCenter.x
  const nz = paCenter.z
  return {
    update(time) {
      for (const { m, phase } of sceneObjs.members) {
        const u = m.userData
        const t = time * 7 + phase
        const k = reduceMotion ? 0 : 1
        u.body.position.y = Math.abs(Math.sin(t)) * 0.07 * k
        u.head.rotation.z = Math.sin(t * 0.5) * 0.12 * k
        if (u.kind === 'drums') {
          u.armL.rotation.x = -1.1 + Math.sin(t * 2) * 0.7 * k
          u.armR.rotation.x = -1.1 + Math.cos(t * 2) * 0.7 * k
        } else if (u.kind === 'vocal') {
          u.armR.rotation.x = -1.5 + Math.sin(t * 0.7) * 0.15 * k
          u.armL.rotation.x = Math.sin(t) * 0.5 * k
        } else {
          u.armR.rotation.x = -0.6 + Math.sin(t * 2) * 0.5 * k
          u.armL.rotation.x = -0.5
        }
      }
      for (const { n, i } of sceneObjs.notes) {
        if (reduceMotion) {
          n.visible = false
          continue
        }
        const t = (time * 0.35 + i / 6) % 1
        n.position.set(nx + (i - 2.5) * 0.75 + Math.sin(t * 7 + i) * 0.25, top + 3.0 + t * 3, nz)
        n.scale.setScalar(Math.max(0.01, Math.sin(t * Math.PI)))
        n.rotation.z = Math.sin(t * 5 + i) * 0.4
      }
    },
  }
}

function buildTown() {
  const P = new Parts()
  const info = new Map()
  const rotPt = (b, v) => {
    const dx = v.x - b.cx
    const dz = v.z - b.cz
    return new THREE.Vector3(b.cx + dx * Math.cos(b.rot) + dz * Math.sin(b.rot), v.y, b.cz - dx * Math.sin(b.rot) + dz * Math.cos(b.rot))
  }
  for (const b of PLACES) {
    P.frame = { cx: b.cx, cz: b.cz, rot: b.rot }
    const r = BUILDINGS.includes(b) ? addBuilding(P, b) : addLandmark(P, b)
    if (r.chimney) r.chimney = rotPt(b, r.chimney)
    info.set(b.key, r)
  }
  P.frame = null
  const group = new THREE.Group()
  // (criados direto: toon() faz cache por JSON e não serve para texturas)
  const mk = (o) => new THREE.MeshToonMaterial({ gradientMap: ramp, vertexColors: true, ...o })
  const mats = {
    wall: mk({ map: plasterTex() }),
    roof: mk({ map: shingleTex() }),
    wood: mk({ map: woodTex() }),
    glass: mk({ emissive: '#2f6b97', emissiveIntensity: 0.55 }),
    plain: mk({}),
  }
  for (const cat of Object.keys(P.cats)) {
    if (!P.cats[cat].length) continue
    const m = new THREE.Mesh(mergeGeometries(P.cats[cat]), mats[cat])
    m.castShadow = cat !== 'glass' && cat !== 'plain'
    m.receiveShadow = true
    group.add(m)
  }
  // contorno de todos os prédios numa malha só
  const hull = new THREE.Mesh(hullGeometry(mergeGeometries(P.hull.map((g) => {
    const h = new THREE.BufferGeometry()
    h.setAttribute('position', g.attributes.position)
    return h
  }))), inkMaterial(0.1))
  group.add(hull)
  return { group, info }
}

// ---------- vento (deslocamento no vertex shader, sem custo de CPU) ----------
const windTime = { value: 0 }
function addWind(material, ref, amp) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = windTime
    shader.vertexShader =
      'uniform float uTime;\n' +
      shader.vertexShader.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        float ph = instanceMatrix[3].x * 0.8 + instanceMatrix[3].z * 0.6;
        float hh = max(position.y - ${ref.toFixed(3)}, 0.0);
        transformed.x += sin(uTime * 1.4 + ph) * ${amp.toFixed(3)} * hh;
        transformed.z += cos(uTime * 1.1 + ph) * ${(amp * 0.6).toFixed(3)} * hh;`,
      )
  }
  return material
}

// ---------- árvores / postes (instanciados) ----------
function buildTrees(world) {
  const n = world.trees.length
  const cols = { g: ['#35b24a', '#63d86b', '#2f9e44'], o: ['#f08a24', '#ffbe55', '#e0731a'], p: ['#f47eae', '#ffb5d2', '#e8679a'] }
  const geos = {
    trunk: new THREE.CylinderGeometry(0.12, 0.2, 1, 6).translate(0, 0.5, 0),
    a: new THREE.IcosahedronGeometry(0.85, 1).scale(1, 0.92, 1).translate(0, 1.65, 0),
    b: new THREE.IcosahedronGeometry(0.58, 1).translate(0.12, 2.4, 0.05),
    c: new THREE.IcosahedronGeometry(0.4, 1).translate(-0.45, 2.0, 0.35),
  }
  const mats = {
    trunk: toon('#8a5a3b'),
    a: addWind(new THREE.MeshToonMaterial({ gradientMap: ramp }), 0.9, 0.035),
    b: addWind(new THREE.MeshToonMaterial({ gradientMap: ramp }), 0.9, 0.035),
    c: addWind(new THREE.MeshToonMaterial({ gradientMap: ramp }), 0.9, 0.035),
  }
  const meshes = {}
  for (const k of Object.keys(geos)) {
    meshes[k] = new THREE.InstancedMesh(geos[k], mats[k], n)
    meshes[k].castShadow = true
    meshes[k].receiveShadow = true
  }
  const o = new THREE.Object3D()
  const idx = { trunk: 0, a: 0, b: 1, c: 0 }
  world.trees.forEach((t, i) => {
    const s = 0.9 + rnd() * 0.45
    o.position.set(t.x + 0.5, 0, t.y + 0.5)
    o.rotation.set(0, rnd() * Math.PI * 2, 0)
    o.scale.set(s, s * (0.95 + rnd() * 0.2), s)
    o.updateMatrix()
    const c = cols[t.kind]
    for (const k of Object.keys(meshes)) {
      meshes[k].setMatrixAt(i, o.matrix)
      meshes[k].setColorAt(i, new THREE.Color(k === 'trunk' ? '#ffffff' : c[idx[k]]))
    }
  })
  return Object.values(meshes)
}

let lampMat = null
function buildLamps(world) {
  const n = world.lamps.length
  lampMat = toon('#fff2b8', { emissive: '#ffc94a', emissiveIntensity: 0.9 })
  const parts = [
    [new THREE.CylinderGeometry(0.16, 0.2, 0.18, 8).translate(0, 0.09, 0), toon('#3b3a4a')],
    [new THREE.CylinderGeometry(0.05, 0.07, 2.2, 6).translate(0, 1.2, 0), toon('#3b3a4a')],
    [new THREE.BoxGeometry(0.38, 0.42, 0.38).translate(0, 2.45, 0), lampMat],
    [new THREE.ConeGeometry(0.34, 0.25, 4).rotateY(Math.PI / 4).translate(0, 2.8, 0), toon('#3b3a4a')],
  ]
  return parts.map(([geo, mat]) => {
    const im = new THREE.InstancedMesh(geo, mat, n)
    im.castShadow = true
    const o = new THREE.Object3D()
    world.lamps.forEach(([lx, ly], i) => {
      o.position.set(lx + 0.5, 0, ly + 0.5)
      o.updateMatrix()
      im.setMatrixAt(i, o.matrix)
    })
    return im
  })
}

// Locais dos 8 cafés colecionáveis espalhados pelo mapa
const COFFEE_SPOTS = [
  { x: 30, z: 32, id: 'start' }, // Perto da entrada / Sobre
  { x: 42, z: 27, id: 'lake' }, // Deck do Lago
  { x: 23, z: 24, id: 'proj' }, // Praça dos Projetos
  { x: 34, z: 20, id: 'form' }, // Entrada de Formação
  { x: 19, z: 36, id: 'skills' }, // Parque das Skills
  { x: 44, z: 38, id: 'cinema' }, // Esquina do Cinema
  { x: 38, z: 46, id: 'stadium' }, // Gramado do Estádio
  { x: 25, z: 42, id: 'contact' }, // Totem de Contato
]

function makeCoffeeCup() {
  const g = new THREE.Group()
  // Caneca cerâmica branca
  const cup = mesh(new THREE.CylinderGeometry(0.2, 0.16, 0.32, 12), '#ffffff', 0, 0.16, 0)
  // Café líquido escuro
  const coffee = mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.04, 12), '#3d2011', 0, 0.3, 0)
  // Alça
  const handle = mesh(new THREE.TorusGeometry(0.1, 0.035, 6, 12, Math.PI * 1.3), '#ffffff', 0.2, 0.16, 0)
  handle.rotation.z = -Math.PI / 2
  // Anel dourado flutuante
  const ring = mesh(new THREE.TorusGeometry(0.32, 0.025, 6, 16), '#ffd166', 0, 0.16, 0)
  ring.rotation.x = Math.PI / 2

  g.add(cup, coffee, handle, ring)
  addOutline(g, 0.02)
  return g
}

function makeMiniLaptop() {
  const g = new THREE.Group()
  const base = mesh(new THREE.BoxGeometry(0.32, 0.02, 0.22), '#1e222d', 0, 0.45, 0.22)
  const screen = mesh(new THREE.BoxGeometry(0.32, 0.22, 0.02), '#1e222d', 0, 0.55, 0.12)
  screen.rotation.x = -0.22
  const display = mesh(new THREE.PlaneGeometry(0.28, 0.18), '#00f0ff', 0, 0.55, 0.132)
  display.rotation.x = -0.22
  g.add(base, screen, display)
  return g
}

// ---------- personagem ----------
function makePlayer() {
  const root = new THREE.Group()
  const body = new THREE.Group()
  root.add(body)
  const skin = '#f6c19a'
  const bx = (w, h, d, color, x, y, z) => mesh(new THREE.BoxGeometry(w, h, d), color, x, y, z)

  // Jaqueta Streetwear Techwear Corta-Vento (grafite com detalhes em terracota e camiseta branca interna)
  // Camiseta interna de algodão no peito
  body.add(bx(0.26, 0.54, 0.35, '#f8fafc', 0, 0.98, 0.01))
  // Jaqueta aberta nas laterais e costas
  body.add(bx(0.14, 0.58, 0.35, '#1e222d', -0.19, 0.98, 0))
  body.add(bx(0.14, 0.58, 0.35, '#1e222d', 0.19, 0.98, 0))
  body.add(bx(0.52, 0.58, 0.1, '#1e222d', 0, 0.98, -0.12))
  // Detalhes esportivos terracota vibrante nos ombros/peito
  body.add(bx(0.12, 0.09, 0.36, '#ff6b35', -0.18, 1.15, 0.01))
  body.add(bx(0.12, 0.09, 0.36, '#ff6b35', 0.18, 1.15, 0.01))
  // Gola estruturada / capuz caído na nuca
  body.add(bx(0.38, 0.14, 0.18, '#161922', 0, 1.28, -0.12))

  // Cinto escuro e fivela metálica moderna
  body.add(bx(0.54, 0.09, 0.36, '#231e1a', 0, 0.77, 0))
  body.add(bx(0.12, 0.11, 0.38, '#e2e8f0', 0, 0.77, 0.01))
  // Bolsinho utilitário lateral na cintura (pouch techwear)
  body.add(bx(0.12, 0.16, 0.14, '#ff6b35', 0.28, 0.78, 0.02))

  // Alças frontais da mochila no peito com fivelas douradas
  body.add(bx(0.08, 0.48, 0.03, '#3a2d24', -0.16, 1.0, 0.18))
  body.add(bx(0.09, 0.05, 0.04, '#ffd166', -0.16, 0.94, 0.185))
  body.add(bx(0.08, 0.48, 0.03, '#3a2d24', 0.16, 1.0, 0.18))
  body.add(bx(0.09, 0.05, 0.04, '#ffd166', 0.16, 0.94, 0.185))

  // Mochila de Aventureiro / Dev Explorer nas costas
  const backpack = new THREE.Group()
  backpack.position.set(0, 1.0, -0.26)
  backpack.add(bx(0.38, 0.44, 0.2, '#f48c06', 0, 0, 0)) // corpo da mochila
  backpack.add(bx(0.32, 0.24, 0.1, '#e85d04', 0, -0.06, -0.11)) // bolso frontal
  backpack.add(bx(0.24, 0.04, 0.11, '#e0e0e0', 0, -0.02, -0.115)) // faixa refletiva
  backpack.add(bx(0.16, 0.08, 0.05, '#2b1e15', 0, 0.24, 0.04)) // alça de mão
  body.add(backpack)

  // Cabeça, Cabelo 3D Estilizado & Headphone Gamer
  const head = new THREE.Group()
  head.position.y = 1.5
  head.add(mesh(new THREE.SphereGeometry(0.26, 14, 12), skin))

  // Olhos expressivos com brilho de vida
  for (const s of [-1, 1]) {
    // Pupila escura
    head.add(mesh(new THREE.SphereGeometry(0.038, 8, 8), '#1a1824', s * 0.09, -0.02, 0.24))
    // Brilho especular do olhar
    head.add(mesh(new THREE.SphereGeometry(0.015, 6, 6), '#ffffff', s * 0.09 + 0.012, 0.0, 0.252))
    // Bochechas rosadas
    head.add(mesh(new THREE.SphereGeometry(0.045, 6, 6), '#ff9fb0', s * 0.16, -0.09, 0.2))
  }
  // Sorriso sutil e confiante
  head.add(bx(0.08, 0.02, 0.04, '#c26d55', 0, -0.12, 0.24))

  // Cabelo 3D moderno texturizado
  head.add(mesh(new THREE.SphereGeometry(0.285, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.58), '#231c19', 0, 0.04, -0.02))
  // Topete frontal e mechas angulares
  head.add(bx(0.2, 0.1, 0.16, '#2c221e', 0, 0.26, 0.16))
  head.add(bx(0.14, 0.12, 0.12, '#231c19', -0.1, 0.2, 0.22))
  head.add(bx(0.12, 0.1, 0.12, '#231c19', 0.1, 0.2, 0.21))
  head.add(bx(0.08, 0.18, 0.14, '#231c19', -0.25, 0.05, 0.08))
  head.add(bx(0.08, 0.18, 0.14, '#231c19', 0.25, 0.05, 0.08))

  // Headphone Gamer descansando no pescoço com LED ciano
  const hpArch = mesh(new THREE.TorusGeometry(0.24, 0.038, 8, 16, Math.PI * 1.15), '#181a20', 0, -0.22, 0.04)
  hpArch.rotation.x = Math.PI * 0.55
  head.add(hpArch)
  for (const s of [-1, 1]) {
    // Almofadas auriculares
    head.add(bx(0.07, 0.14, 0.12, '#232733', s * 0.25, -0.2, 0.05))
    // Anel de luz LED ciano gamer
    head.add(bx(0.02, 0.1, 0.08, '#00f0ff', s * 0.29, -0.2, 0.05))
  }
  body.add(head)

  // Pernas com Calça Cargo e Tênis Sneakers
  const makeLeg = (x) => {
    const pivot = new THREE.Group()
    pivot.position.set(x, 0.7, 0)
    // Perna com calça cargo cinza grafite
    pivot.add(bx(0.2, 0.62, 0.2, '#282d3c', 0, -0.31, 0))
    // Bolso lateral 3D na coxa
    pivot.add(bx(0.05, 0.18, 0.14, '#202430', x > 0 ? 0.11 : -0.11, -0.24, 0))
    // Tênis Sneakers Chunky
    // Solado robusto branco
    pivot.add(bx(0.25, 0.11, 0.38, '#ffffff', 0, -0.585, 0.06))
    // Cabedal preto/grafite do tênis
    pivot.add(bx(0.23, 0.1, 0.32, '#1e222d', 0, -0.52, 0.04))
    // Detalhe esportivo terracota
    pivot.add(bx(0.24, 0.04, 0.14, '#ff6b35', 0, -0.51, 0.08))
    return pivot
  }

  // Braços com mangas da jaqueta e detalhe canelado
  const makeArm = (x) => {
    const pivot = new THREE.Group()
    pivot.position.set(x, 1.22, 0)
    // Manga da jaqueta
    pivot.add(bx(0.16, 0.36, 0.16, '#1e222d', 0, -0.18, 0))
    // Punho canelado terracota
    pivot.add(bx(0.17, 0.06, 0.17, '#ff6b35', 0, -0.37, 0))
    // Mão
    pivot.add(mesh(new THREE.SphereGeometry(0.1, 8, 8), skin, 0, -0.46, 0))
    return pivot
  }

  const legL = makeLeg(-0.13)
  const legR = makeLeg(0.13)
  const armL = makeArm(-0.35)
  const armR = makeArm(0.35)

  const laptop = makeMiniLaptop()
  laptop.visible = false
  body.add(laptop)

  root.add(legL, legR)
  body.add(armL, armR)
  addOutline(root, 0.03)
  root.userData = { body, head, legL, legR, armL, armR, backpack, laptop }
  return root
}

// ---------- jogo ----------
export function createGame(canvas, { onNear, onEnter, getLabels, onCollect, onAllCollected }) {
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
  const world = buildWorld()
  let level = isMobile ? 1 : 0

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' })
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.08

  const scene = new THREE.Scene()
  const sky = document.createElement('canvas')
  sky.width = 2
  sky.height = 256
  const sg = sky.getContext('2d')
  const grad = sg.createLinearGradient(0, 0, 0, 256)
  grad.addColorStop(0, '#4aa8f0')
  grad.addColorStop(0.55, '#9bd8ff')
  grad.addColorStop(1, '#e4f6ff')
  sg.fillStyle = grad
  sg.fillRect(0, 0, 2, 256)
  const skyTex = new THREE.CanvasTexture(sky)
  skyTex.colorSpace = THREE.SRGBColorSpace
  scene.background = skyTex
  scene.fog = new THREE.Fog('#d6f0ff', 65, 260)

  const camera = new THREE.PerspectiveCamera(42, 1, 0.5, 300)

  // luz: hemisfério colorido + sol direcional com sombras
  const hemi = new THREE.HemisphereLight('#eaf6ff', '#8a86d8', 1.9)
  scene.add(hemi)
  const sun = new THREE.DirectionalLight('#fff0cc', 2.1)
  sun.castShadow = true
  const sc = sun.shadow.camera
  sc.left = -20
  sc.right = 20
  sc.top = 20
  sc.bottom = -20
  sc.near = 1
  sc.far = 90
  sun.shadow.bias = -0.0006
  sun.shadow.normalBias = 0.04
  scene.add(sun, sun.target)
  const SUN_OFFSET = new THREE.Vector3(-16, 34, 14)

  // chão
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshLambertMaterial({ map: paintGround(world, PLACES) }))
  ground.rotation.x = -Math.PI / 2
  ground.position.set(W / 2, 0, H / 2)
  ground.receiveShadow = true
  scene.add(ground)
  const outer = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshLambertMaterial({ color: '#76cf4e' }))
  outer.rotation.x = -Math.PI / 2
  outer.position.set(W / 2, -0.03, H / 2)
  scene.add(outer)

  // lagoa com ondas deslizantes
  const rip = canvasTexRipple()
  const pond = new THREE.Mesh(new THREE.CircleGeometry(1, 40), new THREE.MeshBasicMaterial({ map: rip, color: '#c9efff', transparent: true, opacity: 0.55, depthWrite: false }))
  pond.rotation.x = -Math.PI / 2
  pond.scale.set(POND.rx, POND.ry, 1)
  pond.position.set(POND.cx, 0.04, POND.cy)
  scene.add(pond)

  // prédios fundidos + fumaça
  const town = buildTown()
  scene.add(town.group)
  const extras = buildExtras(scene, reduceMotion)
  const smoke = []
  for (const b of BUILDINGS)
    for (let i = 0; i < 3; i++) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(0.28, 7, 6), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0, depthWrite: false }))
      puff.userData = { origin: town.info.get(b.key).chimney, phase: i / 3 }
      scene.add(puff)
      smoke.push(puff)
    }

  for (const m of buildTrees(world)) scene.add(m)
  for (const m of buildLamps(world)) scene.add(m)

  // flores, tufos de grama e pedrinhas (instanciados)
  const dummy = new THREE.Object3D()
  const free = (x, y) => world.ground[y]?.[x] === 0 && !world.solid[y][x]
  const flowerColors = ['#ffd166', '#ef476f', '#ffffff', '#cdb4ff', '#ff9f1c']
  const flowerHeads = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.09, 0), toon('#ffffff'), world.flowers.length)
  const flowerStems = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.012, 0.012, 0.22, 4), toon('#3f9a3a'), world.flowers.length)
  world.flowers.forEach((f, i) => {
    dummy.position.set(f.x / T, 0.24, f.y / T)
    dummy.rotation.set(0, 0, 0)
    dummy.scale.setScalar(1)
    dummy.updateMatrix()
    flowerHeads.setMatrixAt(i, dummy.matrix)
    flowerHeads.setColorAt(i, new THREE.Color(f.c || pick(flowerColors)))
    dummy.position.y = 0.11
    dummy.updateMatrix()
    flowerStems.setMatrixAt(i, dummy.matrix)
  })
  scene.add(flowerHeads, flowerStems)

  const tufts = []
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) if (free(x, y)) for (let k = 0; k < 1.3; k++) tufts.push([x + rnd(), y + rnd()])
  for (let i = tufts.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[tufts[i], tufts[j]] = [tufts[j], tufts[i]]
  }
  const tuftMat = addWind(new THREE.MeshToonMaterial({ gradientMap: ramp }), 0, 0.5)
  const tuftMesh = new THREE.InstancedMesh(new THREE.ConeGeometry(0.07, 0.34, 4).translate(0, 0.17, 0), tuftMat, tufts.length)
  tufts.forEach(([x, z], i) => {
    dummy.position.set(x, 0, z)
    dummy.rotation.set((rnd() - 0.5) * 0.4, rnd() * 3, (rnd() - 0.5) * 0.4)
    dummy.scale.set(1, 0.7 + rnd() * 0.9, 1)
    dummy.updateMatrix()
    tuftMesh.setMatrixAt(i, dummy.matrix)
    tuftMesh.setColorAt(i, new THREE.Color(pick(['#4fb53c', '#6fd04a', '#3f9e35', '#8ae25b'])))
  })
  const tuftTotal = tufts.length
  scene.add(tuftMesh)

  const rocks = []
  for (let tries = 0; tries < 200 && rocks.length < 16; tries++) {
    const x = 2 + Math.floor(rnd() * (W - 4))
    const y = 2 + Math.floor(rnd() * (H - 4))
    if (free(x, y)) rocks.push([x + rnd(), y + rnd()])
  }
  const rockMesh = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(0.22, 0), toon('#c3c6d3'), rocks.length)
  rocks.forEach(([x, z], i) => {
    const s = 0.6 + rnd() * 0.9
    dummy.position.set(x, 0.1, z)
    dummy.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3)
    dummy.scale.set(s, s * 0.7, s)
    dummy.updateMatrix()
    rockMesh.setMatrixAt(i, dummy.matrix)
  })
  rockMesh.castShadow = true
  scene.add(rockMesh)

  // nuvens (uma malha fundida por nuvem + corredor de nuvens para o mergulho inicial)
  const clouds = []
  const cloudMat = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.94 })
  for (let i = 0; i < 8; i++) {
    const n = 4 + Math.floor(rnd() * 2)
    const gs = []
    for (let k = 0; k < n; k++) {
      const s = 1.6 + rnd() * 1.4
      gs.push(new THREE.IcosahedronGeometry(s, 1).scale(1, 0.62, 1).translate((k - n / 2) * 2.2, rnd() * 0.8, (rnd() - 0.5) * 1.6))
    }
    const c = new THREE.Mesh(mergeGeometries(gs), cloudMat)
    c.position.set(-30 + rnd() * 110, 22 + rnd() * 10, -30 + rnd() * 70)
    scene.add(c)
    clouds.push(c)
  }
  // Nuvens no corredor de descida da câmera (efeito de passar por dentro das nuvens no zoom inicial)
  const introCloudOffsets = [
    [-5.5, 34, 44],
    [5.8, 32, 42],
    [-4.2, 25, 35],
    [4.6, 24, 34],
  ]
  for (const [ox, cy, cz] of introCloudOffsets) {
    const gs = []
    for (let k = 0; k < 5; k++) {
      const s = 1.8 + rnd() * 1.3
      gs.push(new THREE.IcosahedronGeometry(s, 1).scale(1.1, 0.6, 1).translate((k - 2) * 2.1, (rnd() - 0.5) * 0.7, (rnd() - 0.5) * 1.4))
    }
    const c = new THREE.Mesh(mergeGeometries(gs), cloudMat)
    c.position.set(START.x / T + ox, cy, cz)
    scene.add(c)
    clouds.push(c)
  }

  // borboletas
  const butterflies = []
  const wingGeo = new THREE.PlaneGeometry(0.2, 0.16).rotateX(-Math.PI / 2)
  for (let i = 0; i < 6; i++) {
    const g = new THREE.Group()
    const wm = new THREE.MeshBasicMaterial({ color: pick(['#ffb5d2', '#ffe08a', '#b8e4ff', '#d7b8ff']), side: THREE.DoubleSide })
    const l = new THREE.Group()
    const r = new THREE.Group()
    l.add(new THREE.Mesh(wingGeo.clone().translate(-0.1, 0, 0), wm))
    r.add(new THREE.Mesh(wingGeo.clone().translate(0.1, 0, 0), wm))
    g.add(l, r)
    g.userData = { l, r, cx: 6 + rnd() * 36, cz: 5 + rnd() * 20, rad: 2 + rnd() * 3, sp: 0.25 + rnd() * 0.25, ph: rnd() * 6 }
    scene.add(g)
    butterflies.push(g)
  }

  // brilho da porta
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 1.6), new THREE.MeshBasicMaterial({ color: '#ffe08a', transparent: true, opacity: 0, depthWrite: false }))
  glow.rotation.x = -Math.PI / 2
  glow.position.y = 0.05
  scene.add(glow)

  // 8 Cafés colecionáveis espalhados pelo mapa
  let collectedCoffeeCount = 0
  const coffeeItems = COFFEE_SPOTS.map((spot, idx) => {
    const cupMesh = makeCoffeeCup()
    cupMesh.position.set(spot.x, 0.5, spot.z)
    scene.add(cupMesh)
    return { spot, mesh: cupMesh, collected: false, phase: idx * 0.75 }
  })

  // Sistema de poeira (dust puffs) nos pés ao pular / aterrissar / correr
  const dustParticles = []
  function spawnDust(x, z, count = 4) {
    for (let i = 0; i < count; i++) {
      const p = mesh(new THREE.SphereGeometry(0.07 + rnd() * 0.05, 6, 5), '#ffffff', x + (rnd() - 0.5) * 0.35, 0.06, z + (rnd() - 0.5) * 0.35)
      p.material.transparent = true
      p.material.opacity = 0.8
      p.userData = {
        vx: (rnd() - 0.5) * 1.6,
        vy: 0.6 + rnd() * 1.2,
        vz: (rnd() - 0.5) * 1.6,
        life: 0.35 + rnd() * 0.15,
        maxLife: 0.45,
      }
      scene.add(p)
      dustParticles.push(p)
    }
  }

  // Vaga-lumes noturnos reluzentes na grama e no lago
  const fireflies = []
  const ffGeo = new THREE.SphereGeometry(0.055, 6, 6)
  for (let i = 0; i < 26; i++) {
    const ffMat = new THREE.MeshBasicMaterial({ color: '#caff70', transparent: true, opacity: 0 })
    const ff = new THREE.Mesh(ffGeo, ffMat)
    ff.position.set(10 + rnd() * (W - 20), 0.4 + rnd() * 1.8, 10 + rnd() * (H - 20))
    ff.userData = {
      baseX: ff.position.x,
      baseY: ff.position.y,
      baseZ: ff.position.z,
      phase: rnd() * Math.PI * 2,
      speed: 0.5 + rnd() * 0.8,
    }
    scene.add(ff)
    fireflies.push(ff)
  }

  // Chuva volumétrica procedural
  const rainCount = 320
  const rainGeom = new THREE.BufferGeometry()
  const rainPos = new Float32Array(rainCount * 6)
  for (let i = 0; i < rainCount; i++) {
    const rx = (rnd() - 0.5) * 44
    const ry = rnd() * 24
    const rz = (rnd() - 0.5) * 44
    rainPos[i * 6 + 0] = rx
    rainPos[i * 6 + 1] = ry
    rainPos[i * 6 + 2] = rz
    rainPos[i * 6 + 3] = rx - 0.1
    rainPos[i * 6 + 4] = ry - 0.7
    rainPos[i * 6 + 5] = rz + 0.1
  }
  rainGeom.setAttribute('position', new THREE.BufferAttribute(rainPos, 3))
  const rainMat = new THREE.LineBasicMaterial({ color: '#b0cadb', transparent: true, opacity: 0.55 })
  const rainMesh = new THREE.LineSegments(rainGeom, rainMat)
  rainMesh.visible = false
  scene.add(rainMesh)

  // Confetes comemorativos para quando coletar todos os cafés
  const confetti = []
  function spawnConfetti(px, pz) {
    const colors = ['#ffd166', '#ff4757', '#2ed573', '#1e90ff', '#ffa502', '#9b59b6']
    const geo = new THREE.PlaneGeometry(0.12, 0.12)
    for (let i = 0; i < 80; i++) {
      const mat = new THREE.MeshBasicMaterial({ color: pick(colors), side: THREE.DoubleSide })
      const c = new THREE.Mesh(geo, mat)
      c.position.set(px + (rnd() - 0.5) * 16, 10 + rnd() * 8, pz + (rnd() - 0.5) * 16)
      c.userData = {
        vx: (rnd() - 0.5) * 2.2,
        vy: -2.0 - rnd() * 2.5,
        vz: (rnd() - 0.5) * 2.2,
        rotX: (rnd() - 0.5) * 7,
        rotY: (rnd() - 0.5) * 7,
        life: 5.0,
      }
      scene.add(c)
      confetti.push(c)
    }
  }

  // Clima dinâmico e presets de iluminação
  let currentWeatherKey = 'day'
  function applyWeather(presetKey) {
    const p = WEATHER_PRESETS[presetKey] || WEATHER_PRESETS.day
    currentWeatherKey = presetKey

    // Atualiza textura do céu
    const sg = sky.getContext('2d')
    const grad = sg.createLinearGradient(0, 0, 0, 256)
    grad.addColorStop(0, p.sky[0])
    grad.addColorStop(0.55, p.sky[1])
    grad.addColorStop(1, p.sky[2])
    sg.fillStyle = grad
    sg.fillRect(0, 0, 2, 256)
    skyTex.needsUpdate = true

    // Atualiza névoa
    scene.fog.color.set(p.fog)
    scene.fog.near = p.isRain ? 40 : 65
    scene.fog.far = p.isRain ? 170 : 260

    // Atualiza luzes
    hemi.color.set(p.hemi.sky)
    hemi.groundColor.set(p.hemi.ground)
    hemi.intensity = p.hemi.intensity

    sun.color.set(p.sun.color)
    sun.intensity = p.sun.intensity
    SUN_OFFSET.set(...p.sun.pos)

    // Postes acesos ou apagados
    if (lampMat) {
      lampMat.emissiveIntensity = p.lampEmissive
    }

    // Chuva
    rainMesh.visible = p.isRain
  }

  // personagem
  const player = {
    x: START.x / T,
    y: 0,
    z: START.y / T,
    vx: 0,
    vy: 0,
    vz: 0,
    rot: 0,
    phase: 0,
    amp: 0,
    isGrounded: true,
    stepTimer: 0,
    afkTimer: 0,
    currentEmote: null,
    emoteTimer: 0,
  }
  const avatar = makePlayer()
  scene.add(avatar)

  function doJump() {
    if (player.isGrounded && !paused) {
      player.vy = 8.6
      player.isGrounded = false
      player.afkTimer = 0
      if (player.currentEmote === 'sit') {
        player.currentEmote = null
        if (avatar.userData.laptop) avatar.userData.laptop.visible = false
      }
      sound.jump()
      spawnDust(player.x, player.z, 5)
    }
  }

  function doEmote(type) {
    if (paused) return
    player.currentEmote = type
    player.emoteTimer = type === 'dance' ? 3.0 : 2.0
    player.afkTimer = 0
    if (avatar.userData.laptop) avatar.userData.laptop.visible = type === 'sit'
  }

  // rótulos HTML sobre os prédios
  const labelLayer = document.createElement('div')
  labelLayer.className = 'labels3d'
  const labelEls = new Map()
  for (const b of PLACES) {
    const el = document.createElement('button')
    el.type = 'button'
    el.className = 'label3d'
    el.innerHTML = `<span class="label3d__icon" aria-hidden="true">${ICONS[b.key]}</span><span class="label3d__text"></span>`
    el.addEventListener('click', () => !paused && onEnter(b.key))
    labelLayer.appendChild(el)
    labelEls.set(b.key, { el, text: el.querySelector('.label3d__text'), last: '', tf: '' })
  }
  canvas.parentElement.appendChild(labelLayer)

  // ---------- estado / input ----------
  const input = { keys: new Set(), stick: { x: 0, y: 0 } }
  let paused = true
  let near = null
  let time = 0
  let last = 0
  let raf = 0
  let idleAcc = 0
  const samples = []

  // Animação inicial cinematográfica "Estilo Simpsons" (mergulho passando por dentro das nuvens/neblina)
  const introFly = {
    active: !reduceMotion,
    progress: 0,
    duration: 2.5,
  }
  const wideInit = (canvas.clientWidth / (canvas.clientHeight || 1)) < 0.9 ? 1.5 : 1
  const camPos = new THREE.Vector3(player.x, 44 * wideInit, player.z + 36 * wideInit)
  const camLook = new THREE.Vector3(player.x, 0.4, player.z - 5)
  camera.position.copy(camPos)
  camera.lookAt(camLook)
  let camReady = true

  const KEYMAP = {
    ArrowUp: 'up', KeyW: 'up',
    ArrowDown: 'down', KeyS: 'down',
    ArrowLeft: 'left', KeyA: 'left',
    ArrowRight: 'right', KeyD: 'right',
    ShiftLeft: 'shift', ShiftRight: 'shift',
  }
  function onKeyDown(e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return
    if (e.code === 'Space') {
      if (!paused) {
        e.preventDefault()
        doJump()
      }
      return
    }
    if (e.code === 'Digit1') {
      doEmote('wave')
      return
    }
    if (e.code === 'Digit2') {
      doEmote('dance')
      return
    }
    const dir = KEYMAP[e.code]
    if (dir) {
      if (!paused) e.preventDefault()
      input.keys.add(dir)
      player.afkTimer = 0
      if (player.currentEmote === 'sit') {
        player.currentEmote = null
        if (avatar.userData.laptop) avatar.userData.laptop.visible = false
      }
      return
    }
    if (paused) return
    if ((e.code === 'Enter' || e.code === 'NumpadEnter') && near) {
      e.preventDefault()
      onEnter(near.key)
    }
  }
  const onKeyUp = (e) => {
    const dir = KEYMAP[e.code]
    if (dir) input.keys.delete(dir)
  }
  const clearInput = () => {
    input.keys.clear()
    input.stick.x = 0
    input.stick.y = 0
  }
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  window.addEventListener('blur', clearInput)

  function resize() {
    const cw = canvas.clientWidth
    const ch = canvas.clientHeight
    renderer.setSize(cw, ch, false)
    camera.aspect = cw / ch
    camera.fov = camera.aspect < 0.9 ? 58 : 42
    camera.updateProjectionMatrix()
  }
  window.addEventListener('resize', resize)

  // qualidade adaptativa
  function applyLevel() {
    const L = LEVELS[level]
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, L.dpr))
    sun.castShadow = L.shadows
    if (sun.shadow.mapSize.x !== L.shadow) {
      sun.shadow.mapSize.set(L.shadow, L.shadow)
      sun.shadow.map?.dispose()
      sun.shadow.map = null
    }
    tuftMesh.count = Math.floor(tuftTotal * L.tufts)
    resize()
  }
  applyLevel()

  // ---------- física ----------
  const solidAt = (x, z) => {
    const tx = Math.floor(x)
    const tz = Math.floor(z)
    if (tx < 0 || tz < 0 || tx >= W || tz >= H) return true
    return world.solid[tz][tx]
  }
  const blocked = (x, z) => solidAt(x - RADIUS, z - RADIUS) || solidAt(x + RADIUS, z - RADIUS) || solidAt(x - RADIUS, z + RADIUS) || solidAt(x + RADIUS, z + RADIUS)

  function update(dt) {
    let ix = 0
    let iz = 0
    if (input.keys.has('left')) ix -= 1
    if (input.keys.has('right')) ix += 1
    if (input.keys.has('up')) iz -= 1
    if (input.keys.has('down')) iz += 1
    ix += input.stick.x
    iz += input.stick.y
    const len = Math.hypot(ix, iz)
    if (len > 1) {
      ix /= len
      iz /= len
    }
    if (paused) {
      ix = 0
      iz = 0
    }

    // Sprint com Shift
    const moveSpeed = input.keys.has('shift') ? SPEED * 1.5 : SPEED

    // Aceleração progressiva e inércia
    const isMoving = len > 0.05 && !paused
    if (isMoving) {
      player.afkTimer = 0
      if (player.currentEmote === 'sit') {
        player.currentEmote = null
        if (avatar.userData.laptop) avatar.userData.laptop.visible = false
      }
    } else {
      player.afkTimer += dt
      if (player.afkTimer > 9.0 && player.isGrounded && !player.currentEmote && !paused) {
        player.currentEmote = 'sit'
        if (avatar.userData.laptop) avatar.userData.laptop.visible = true
      }
    }

    const k = 1 - Math.exp((isMoving ? -12 : -15) * dt)
    player.vx += (ix * moveSpeed - player.vx) * k
    player.vz += (iz * moveSpeed - player.vz) * k

    // Física Vertical / Gravidade do Pulo
    if (!player.isGrounded) {
      player.vy -= 26 * dt
      player.y += player.vy * dt
      if (player.y <= 0) {
        player.y = 0
        player.vy = 0
        player.isGrounded = true
        sound.land()
        spawnDust(player.x, player.z, 5)
      }
    }

    // Colisão horizontal com deslizamento
    const nx = player.x + player.vx * dt
    if (!blocked(nx, player.z)) {
      player.x = nx
    } else {
      player.vx *= 0.15
    }
    const nz = player.z + player.vz * dt
    if (!blocked(player.x, nz)) {
      player.z = nz
    } else {
      player.vz *= 0.15
    }

    const speed = Math.hypot(player.vx, player.vz)

    // Sons de passos rítmicos na caminhada/corrida
    if (player.isGrounded && speed > 1.2 && !paused) {
      player.stepTimer += dt * (speed / SPEED)
      if (player.stepTimer > 0.35) {
        player.stepTimer = 0
        sound.step()
        if (input.keys.has('shift')) spawnDust(player.x, player.z, 2)
      }
    }

    if (speed > 0.2) {
      let diff = Math.atan2(player.vx, player.vz) - player.rot
      diff = Math.atan2(Math.sin(diff), Math.cos(diff))
      player.rot += diff * (1 - Math.exp(-14 * dt))
      const targetLean = -diff * Math.min(1, speed / 2.2) * 0.42
      player.lean = (player.lean || 0) + (targetLean - (player.lean || 0)) * (1 - Math.exp(-11 * dt))
    } else {
      player.lean = (player.lean || 0) * (1 - Math.exp(-9 * dt))
    }
    player.amp += (Math.min(1, speed / SPEED) - player.amp) * (1 - Math.exp(-12 * dt))
    player.phase += dt * (7.5 + speed * 2.1)

    // Coleta dos cafés espalhados
    for (const item of coffeeItems) {
      if (!item.collected) {
        item.mesh.rotation.y += dt * 2.2
        item.mesh.position.y = 0.5 + Math.sin(time * 3 + item.phase) * 0.12
        const d = Math.hypot(player.x - item.spot.x, player.z - item.spot.z)
        if (d < 1.15) {
          item.collected = true
          item.mesh.visible = false
          spawnDust(item.spot.x, item.spot.z, 8)
          sound.collect()
          collectedCoffeeCount++
          onCollect?.(collectedCoffeeCount, COFFEE_SPOTS.length)
          if (collectedCoffeeCount === COFFEE_SPOTS.length) {
            sound.fanfare()
            spawnConfetti(player.x, player.z)
            onAllCollected?.()
          }
        }
      }
    }

    let found = null
    for (const b of PLACES) {
      const d = Math.hypot(player.x - b.spot.x, player.z - b.spot.z)
      if (d <= 2.8) found = b
    }
    if (found?.key !== near?.key) {
      near = found
      onNear(near ? near.key : null)
    }
  }

  // ---------- animação ----------
  function animate(dt) {
    const u = avatar.userData
    const speed = Math.hypot(player.vx, player.vz)
    const sw = Math.sin(player.phase) * 0.88 * player.amp

    if (player.currentEmote === 'sit') {
      // Sentado relaxando com laptop
      u.legL.rotation.x = -1.45
      u.legR.rotation.x = -1.45
      u.legL.position.y = 0.25
      u.legR.position.y = 0.25
      u.armL.rotation.x = -0.7
      u.armR.rotation.x = -0.7
      u.armL.rotation.z = -0.3
      u.armR.rotation.z = 0.3
      u.body.position.y = -0.35 + Math.sin(time * 2.2) * 0.01
      u.head.rotation.x = 0.25
      u.head.rotation.y = 0
    } else if (player.currentEmote === 'wave') {
      // Acenando
      u.legL.rotation.x = sw
      u.legR.rotation.x = -sw
      u.armL.rotation.x = -sw * 0.85
      u.armR.rotation.x = -2.3 + Math.sin(time * 12) * 0.35
      u.armR.rotation.z = 0.5
      u.head.rotation.y = 0.2
      player.emoteTimer -= dt
      if (player.emoteTimer <= 0) player.currentEmote = null
    } else if (player.currentEmote === 'dance') {
      // Dancinha comemorativa
      avatar.rotation.y += dt * 6.5
      u.armL.rotation.x = -2.2 + Math.sin(time * 14) * 0.4
      u.armR.rotation.x = -2.2 - Math.sin(time * 14) * 0.4
      u.armL.rotation.z = -0.4
      u.armR.rotation.z = 0.4
      u.body.position.y = Math.abs(Math.sin(time * 12)) * 0.25
      player.emoteTimer -= dt
      if (player.emoteTimer <= 0) player.currentEmote = null
    } else {
      // Animação padrão de caminhada / corrida
      u.legL.rotation.x = sw
      u.legR.rotation.x = -sw
      u.legL.position.y = 0.7 + Math.max(0, -sw) * 0.07 * player.amp
      u.legR.position.y = 0.7 + Math.max(0, sw) * 0.07 * player.amp
      u.legL.position.z = Math.sin(player.phase) * 0.035 * player.amp
      u.legR.position.z = -Math.sin(player.phase) * 0.035 * player.amp

      u.armL.rotation.x = -sw * 0.85
      u.armR.rotation.x = sw * 0.85
      u.armL.rotation.z = -0.14 - Math.abs(sw) * 0.12 * player.amp
      u.armR.rotation.z = 0.14 + Math.abs(sw) * 0.12 * player.amp

      const hipSway = Math.sin(player.phase) * 0.06 * player.amp
      u.body.rotation.z = hipSway + (player.lean || 0)
      u.body.rotation.x = 0.12 * player.amp + (speed / SPEED) * 0.06

      const walkBounce = Math.abs(Math.sin(player.phase)) * 0.08 * player.amp
      const idleBreath = Math.sin(time * 2.4) * 0.014 * (1 - player.amp)
      u.body.position.y = walkBounce + idleBreath

      const squash = Math.sin(player.phase * 2) * 0.032 * player.amp
      u.body.scale.set(1 + squash * 0.6, 1 - squash, 1 + squash * 0.6)

      if (u.backpack) {
        u.backpack.rotation.x = -0.04 + Math.sin(player.phase * 2) * 0.04 * player.amp
      }

      u.head.rotation.x = -u.body.rotation.x * 0.4
      u.head.rotation.y = Math.sin(time * 0.75) * 0.16 * (1 - player.amp)
      u.head.position.y = 1.5 + Math.sin(time * 2.4) * 0.01 * (1 - player.amp)

      if (u.laptop) u.laptop.visible = false
    }

    avatar.position.set(player.x, player.y, player.z)
    if (player.currentEmote !== 'dance') avatar.rotation.y = player.rot
    avatar.rotation.z = (player.lean || 0) * 0.45

    // Atualização de partículas de poeira
    for (let i = dustParticles.length - 1; i >= 0; i--) {
      const p = dustParticles[i]
      p.userData.life -= dt
      p.position.x += p.userData.vx * dt
      p.position.y += p.userData.vy * dt
      p.position.z += p.userData.vz * dt
      p.material.opacity = (p.userData.life / p.userData.maxLife) * 0.75
      if (p.userData.life <= 0) {
        scene.remove(p)
        dustParticles.splice(i, 1)
      }
    }

    // Atualização de vaga-lumes à noite/pôr do sol
    for (const ff of fireflies) {
      const d = ff.userData
      d.phase += dt * d.speed
      ff.position.x = d.baseX + Math.sin(d.phase) * 0.7
      ff.position.y = Math.max(0.2, d.baseY + Math.cos(d.phase * 1.4) * 0.35)
      ff.position.z = d.baseZ + Math.cos(d.phase * 0.8) * 0.7
      const targetOp = (currentWeatherKey === 'night' || currentWeatherKey === 'sunset') ? (0.45 + Math.sin(d.phase * 3.2) * 0.35) : 0
      ff.material.opacity += (targetOp - ff.material.opacity) * 0.08
    }

    // Atualização da chuva
    if (rainMesh.visible) {
      const attr = rainMesh.geometry.attributes.position
      const arr = attr.array
      for (let i = 1; i < arr.length; i += 6) {
        arr[i] -= dt * 36
        arr[i + 3] -= dt * 36
        if (arr[i] < 0) {
          arr[i] += 24
          arr[i + 3] += 24
        }
      }
      attr.needsUpdate = true
      rainMesh.position.set(player.x, 0, player.z)
    }

    // Atualização de confetes
    for (let i = confetti.length - 1; i >= 0; i--) {
      const c = confetti[i]
      c.userData.life -= dt
      c.position.x += c.userData.vx * dt
      c.position.y += c.userData.vy * dt
      c.position.z += c.userData.vz * dt
      c.rotation.x += c.userData.rotX * dt
      c.rotation.y += c.userData.rotY * dt
      if (c.position.y < 0.05 || c.userData.life <= 0) {
        scene.remove(c)
        confetti.splice(i, 1)
      }
    }

    if (!reduceMotion) {
      windTime.value = time
      for (const c of clouds) {
        c.position.x += dt * 0.6
        if (c.position.x > 85) c.position.x = -40
      }
      rip.offset.x = (time * 0.04) % 1
      rip.offset.y = (time * 0.025) % 1
      pond.material.opacity = 0.5 + Math.sin(time * 1.6) * 0.08
      for (const p of smoke) {
        const t = (time * 0.35 + p.userData.phase) % 1
        const o = p.userData.origin
        p.position.set(o.x + t * 0.9 + Math.sin(t * 6) * 0.1, o.y + t * 2.2, o.z)
        p.scale.setScalar(0.5 + t * 1.3)
        p.material.opacity = Math.sin(t * Math.PI) * 0.55
      }
      for (const b of butterflies) {
        const d = b.userData
        const a = time * d.sp + d.ph
        const x = d.cx + Math.cos(a) * d.rad
        const z = d.cz + Math.sin(a * 2) * d.rad * 0.6
        b.rotation.y = Math.atan2(x - b.position.x, z - b.position.z)
        b.position.set(x, 0.9 + Math.sin(a * 3) * 0.25, z)
        const f = Math.sin(time * 18 + d.ph) * 0.9
        d.l.rotation.z = f
        d.r.rotation.z = -f
      }
    }

    extras.update(time)

    if (near) {
      glow.visible = true
      glow.position.set(near.glow.x, 0.05, near.glow.z)
      glow.rotation.z = -near.rot
      glow.material.opacity = reduceMotion ? 0.4 : 0.35 + Math.sin(time * 5) * 0.18
    } else glow.visible = false

    // câmera de terceira pessoa com mergulho inicial cinematográfico (estilo Simpsons)
    const wide = camera.aspect < 0.9 ? 1.5 : 1
    const targetPos = new THREE.Vector3(player.x, 15 * wide, player.z + 14 * wide)
    const targetLook = new THREE.Vector3(player.x, 0.3, player.z - 2.5)

    if (introFly.active) {
      introFly.progress += dt
      const t = Math.min(1, introFly.progress / introFly.duration)
      // Ease-out cúbico suave passando por dentro das nuvens/neblina até a cidade
      const ease = 1 - Math.pow(1 - t, 3)
      const currentStartPos = new THREE.Vector3(player.x, 44 * wide, player.z + 36 * wide)
      const currentStartLook = new THREE.Vector3(player.x, 0.4, player.z - 5)
      camPos.lerpVectors(currentStartPos, targetPos, ease)
      camLook.lerpVectors(currentStartLook, targetLook, ease)
      camera.position.copy(camPos)
      camera.lookAt(camLook)

      // Neblina 3D dissipa gradualmente conforme a câmera atravessa as nuvens e se aproxima da cidade
      const endNear = currentWeatherKey === 'rain' ? 40 : 65
      const endFar = currentWeatherKey === 'rain' ? 170 : 260
      scene.fog.near = 14 + (endNear - 14) * ease
      scene.fog.far = 68 + (endFar - 68) * ease

      if (t >= 1) {
        introFly.active = false
        scene.fog.near = endNear
        scene.fog.far = endFar
      }
    } else {
      const ck = reduceMotion ? 1 : 1 - Math.exp(-5.5 * dt)
      camPos.lerp(targetPos, ck)
      camLook.lerp(targetLook, ck)
      camera.position.copy(camPos)
      camera.lookAt(camLook)
    }

    sun.position.set(player.x, 0, player.z).add(SUN_OFFSET)
    sun.target.position.set(player.x, 0, player.z)
  }

  const v3 = new THREE.Vector3()
  function updateLabels() {
    const labels = getLabels()
    const w = canvas.clientWidth
    const h = canvas.clientHeight
    for (const b of PLACES) {
      const L = labelEls.get(b.key)
      const txt = labels[b.key]
      if (L.last !== txt) {
        L.text.textContent = txt
        L.last = txt
      }
      v3.set(b.labelPos.x, town.info.get(b.key).labelY, b.labelPos.z).project(camera)
      const visible = v3.z < 1 && v3.z > -1 && Math.abs(v3.x) < 1.15 && Math.abs(v3.y) < 1.15
      const tf = visible ? `translate(${Math.round(((v3.x + 1) / 2) * w)}px, ${Math.round(((1 - v3.y) / 2) * h)}px) translate(-50%, -50%)` : ''
      if (tf !== L.tf) {
        L.tf = tf
        L.el.style.display = visible ? '' : 'none'
        if (visible) L.el.style.transform = tf
      }
      L.el.classList.toggle('is-near', near?.key === b.key)
    }
  }

  function frame(ts) {
    raf = requestAnimationFrame(frame)
    const raw = (ts - last) / 1000 || 0
    last = ts
    const dt = Math.min(0.05, raw)
    time += dt
    update(dt)
    animate(dt)

    if (paused && !introFly.active) {
      idleAcc += raw
      if (idleAcc < 0.05) return
      idleAcc = 0
    }
    renderer.render(scene, camera)
    updateLabels()

    if (!paused && time > 3 && level < LEVELS.length - 1 && raw < 0.25) {
      samples.push(raw)
      if (samples.length >= 90) {
        const avg = samples.reduce((a, b) => a + b, 0) / samples.length
        samples.length = 0
        if (avg > 1 / 38) {
          level++
          applyLevel()
        }
      }
    } else samples.length = 0
  }
  raf = requestAnimationFrame(frame)

  return {
    setPaused(v) {
      paused = v
      if (v) clearInput()
    },
    setStick(x, y) {
      input.stick.x = x
      input.stick.y = y
    },
    teleportTo(key) {
      const b = PLACES.find((i) => i.key === key)
      if (!b) return
      player.x = b.spot.x
      player.z = b.spot.z
      player.vx = 0
      player.vz = 0
      player.rot = b.rot + Math.PI
    },
    jump: doJump,
    emote: doEmote,
    skipIntroFly() {
      introFly.active = false
      scene.fog.near = currentWeatherKey === 'rain' ? 40 : 65
      scene.fog.far = currentWeatherKey === 'rain' ? 170 : 260
    },
    setWeather: applyWeather,
    getWeather: () => currentWeatherKey,
    getCoffeeCount: () => collectedCoffeeCount,
    getTotalCoffee: () => COFFEE_SPOTS.length,
    getNear: () => near,
    destroy() {
      cancelAnimationFrame(raf)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', clearInput)
      window.removeEventListener('resize', resize)
      labelLayer.remove()
      renderer.dispose()
    },
  }
}

// textura de ondas/brilhos da água (tileável)
function canvasTexRipple() {
  const t = canvasTex(128, (g, S) => {
    g.clearRect(0, 0, S, S)
    g.strokeStyle = 'rgba(255,255,255,.8)'
    g.lineWidth = 3
    g.lineCap = 'round'
    for (let i = 0; i < 7; i++) {
      const x = rnd() * S
      const y = rnd() * S
      wrap9(S, (ox, oy) => {
        g.beginPath()
        g.moveTo(x + ox - 12, y + oy)
        g.quadraticCurveTo(x + ox - 4, y + oy - 5, x + ox + 4, y + oy)
        g.quadraticCurveTo(x + ox + 10, y + oy + 5, x + ox + 16, y + oy)
        g.stroke()
      })
    }
    g.fillStyle = 'rgba(255,255,255,.9)'
    for (let i = 0; i < 6; i++) wrap9(S, () => g.fillRect(rnd() * S, rnd() * S, 3, 3))
  })
  t.repeat.set(4, 2)
  return t
}
