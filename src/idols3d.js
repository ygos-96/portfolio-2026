// Minifiguras cabeçudas estilo Lego, renderizadas uma vez no carregamento:
// plástico com verniz (clearcoat) refletindo um estúdio, luz de três pontos, peças arredondadas
// e estampas desenhadas em alta resolução. Cada ídolo vira uma tira de quadros (giro de vitrine)
// que o CSS anima no hover/seleção.
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { IDOLS } from './content.js'

const KITS = {
  fw: { J: '#0b7a43', J2: '#0e8c4e', T: '#f4f4f4', P: '#f4f4f4', S: '#0b7a43', B: '#f4f4f4', shoe: '#141414' },
  mf: { J: '#0b7a43', J2: '#0e8c4e', T: '#f4f4f4', P: '#f4f4f4', S: '#0b7a43', B: '#f4f4f4', shoe: '#141414' },
  df: { J: '#0b7a43', J2: '#0e8c4e', T: '#f4f4f4', P: '#f4f4f4', S: '#0b7a43', B: '#f4f4f4', shoe: '#141414' },
  gk: { J: '#f07f1e', J2: '#f6953d', T: '#161616', P: '#1a1a1a', S: '#1a1a1a', B: '#f07f1e', shoe: '#141414', gloves: '#f4f4f4' },
  coach: { J: '#1f2430', J2: '#262c3a', T: '#f4f4f4', P: '#1f2430', S: '#1f2430', B: null, shoe: '#0d0d0d' },
}
export const FRAMES = 12
const W = 600 // 2x do tamanho exibido (300x338)
const H = 676
const TURN = 0.55 // giro máximo para cada lado (rad)

let strips = null

const plastic = (color, o = {}) =>
  new THREE.MeshPhysicalMaterial({ color, roughness: 0.3, clearcoat: 0.7, clearcoatRoughness: 0.12, envMapIntensity: 0.9, ...o })
const hairMat = (color) => plastic(color, { roughness: 0.45, clearcoat: 0.35, clearcoatRoughness: 0.3 })

function canvasTex(c, renderer) {
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = renderer.capabilities.getMaxAnisotropy()
  return t
}

function rbox(w, h, d, mat, x = 0, y = 0, z = 0, r = 0.06) {
  const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2, h / 2, d / 2) * 0.999), mat)
  m.position.set(x, y, z)
  return m
}

// ---------- estampas ----------

// rosto impresso: textura cobre a circunferência da cabeça, frente no centro (u = 0.5)
function faceTexture(i, renderer) {
  const c = document.createElement('canvas')
  c.width = 1024
  c.height = 256
  const g = c.getContext('2d')
  g.fillStyle = i.skin
  g.fillRect(0, 0, 1024, 256)
  g.translate(512, 0)
  g.scale(0.86, 1) // compensa o esticamento horizontal da circunferência
  g.lineCap = 'round'
  g.lineJoin = 'round'

  const bc = i.beardColor || i.hair
  // barba
  if (i.beard === 'full') {
    g.fillStyle = bc
    g.beginPath()
    g.moveTo(-150, 96)
    g.bezierCurveTo(-140, 150, -110, 200, -60, 214)
    g.lineTo(60, 214)
    g.bezierCurveTo(110, 200, 140, 150, 150, 96)
    g.lineTo(150, 256)
    g.lineTo(-150, 256)
    g.closePath()
    g.fill()
    g.beginPath()
    g.moveTo(-124, 120)
    g.quadraticCurveTo(-90, 132, -50, 142)
    g.quadraticCurveTo(0, 128, 50, 142)
    g.quadraticCurveTo(90, 132, 124, 120)
    g.lineTo(150, 256)
    g.lineTo(-150, 256)
    g.closePath()
    g.fill()
  } else if (i.beard === 'stubble' || i.beard === 'goatee') {
    const grd = g.createLinearGradient(0, 110, 0, 256)
    grd.addColorStop(0, 'rgba(0,0,0,0)')
    grd.addColorStop(0.35, hexA(bc, i.beard === 'goatee' ? 0.16 : 0.26))
    grd.addColorStop(1, hexA(bc, i.beard === 'goatee' ? 0.2 : 0.34))
    g.fillStyle = grd
    g.beginPath()
    g.moveTo(-140, 110)
    g.bezierCurveTo(-130, 190, -80, 250, 0, 252)
    g.bezierCurveTo(80, 250, 130, 190, 140, 110)
    g.closePath()
    g.fill()
    if (i.beard === 'goatee') {
      g.fillStyle = bc
      roundRect(g, -40, 140, 80, 13, 6)
      g.beginPath()
      g.moveTo(-30, 198)
      g.quadraticCurveTo(0, 190, 30, 198)
      g.lineTo(24, 246)
      g.quadraticCurveTo(0, 256, -24, 246)
      g.closePath()
      g.fill()
    }
  }

  // bochechas
  for (const s of [-1, 1]) {
    const rg = g.createRadialGradient(s * 92, 162, 2, s * 92, 162, 30)
    rg.addColorStop(0, 'rgba(230,90,90,0.22)')
    rg.addColorStop(1, 'rgba(230,90,90,0)')
    g.fillStyle = rg
    g.fillRect(s * 92 - 32, 130, 64, 64)
  }

  // sobrancelhas
  const brow = i.hair === '#ececec' ? '#9a9a9a' : i.hair
  g.strokeStyle = brow
  g.lineWidth = i.hair === '#ececec' ? 14 : 11
  for (const s of [-1, 1]) {
    g.beginPath()
    g.moveTo(s * 30, 82)
    g.quadraticCurveTo(s * 54, 68, s * 80, 78)
    g.stroke()
  }

  // olhos com brilho
  for (const s of [-1, 1]) {
    g.fillStyle = '#121212'
    g.beginPath()
    g.ellipse(s * 54, 116, 13, 18, 0, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = '#fff'
    g.beginPath()
    g.arc(s * 54 - 4, 109, 5, 0, Math.PI * 2)
    g.fill()
  }

  // bigode
  if (i.beard === 'mustache') {
    g.fillStyle = bc
    g.beginPath()
    g.moveTo(-58, 160)
    g.quadraticCurveTo(-40, 136, 0, 144)
    g.quadraticCurveTo(40, 136, 58, 160)
    g.quadraticCurveTo(30, 156, 0, 160)
    g.quadraticCurveTo(-30, 156, -58, 160)
    g.fill()
  }

  // sorriso aberto
  const my = i.beard === 'mustache' ? 166 : 158
  g.fillStyle = '#4a1612'
  g.beginPath()
  g.moveTo(-40, my)
  g.quadraticCurveTo(0, my + 4, 40, my)
  g.quadraticCurveTo(34, my + 44, 0, my + 46)
  g.quadraticCurveTo(-34, my + 44, -40, my)
  g.fill()
  g.save()
  g.clip()
  g.fillStyle = '#fbfbf6'
  g.fillRect(-44, my - 2, 88, 14)
  g.fillStyle = '#c4504a'
  g.beginPath()
  g.ellipse(0, my + 44, 22, 14, 0, 0, Math.PI * 2)
  g.fill()
  g.restore()
  if (i.beard === 'full') {
    // contorno claro para a boca não sumir na barba
    g.strokeStyle = hexA('#ffffff', 0.35)
    g.lineWidth = 3
    g.stroke()
  }
  return canvasTex(c, renderer)
}

function torsoTexture(i, kit, renderer) {
  const c = document.createElement('canvas')
  c.width = 512
  c.height = 512
  const g = c.getContext('2d')
  g.fillStyle = kit.J
  g.fillRect(0, 0, 512, 512)
  g.lineCap = 'round'
  g.lineJoin = 'round'

  if (i.role === 'coach') {
    // camisa e gravata
    g.fillStyle = '#f4f4f4'
    g.beginPath(); g.moveTo(170, 0); g.lineTo(342, 0); g.lineTo(256, 250); g.closePath(); g.fill()
    g.fillStyle = '#0b7a43'
    g.beginPath(); g.moveTo(236, 18); g.lineTo(276, 18); g.lineTo(268, 52); g.lineTo(244, 52); g.closePath(); g.fill()
    g.beginPath(); g.moveTo(244, 50); g.lineTo(268, 50); g.lineTo(282, 220); g.lineTo(256, 250); g.lineTo(230, 220); g.closePath(); g.fill()
    g.strokeStyle = hexA('#ffffff', 0.25)
    g.lineWidth = 3
    for (let y = 80; y < 220; y += 34) { g.beginPath(); g.moveTo(240, y + 10); g.lineTo(272, y); g.stroke() }
    // lapelas
    g.strokeStyle = '#141820'
    g.lineWidth = 6
    for (const s of [-1, 1]) {
      g.beginPath()
      g.moveTo(256 + s * 92, 0)
      g.lineTo(256 + s * 40, 120)
      g.lineTo(256 + s * 80, 130)
      g.lineTo(256 + s * 6, 290)
      g.stroke()
    }
    // botões
    g.fillStyle = '#0d1016'
    for (const y of [330, 400]) { g.beginPath(); g.arc(256, y, 9, 0, Math.PI * 2); g.fill() }
    // bolso e lenço
    g.fillStyle = '#141820'
    g.fillRect(320, 200, 90, 6)
    g.fillStyle = '#f4f4f4'
    g.beginPath(); g.moveTo(340, 200); g.lineTo(352, 178); g.lineTo(366, 200); g.lineTo(380, 182); g.lineTo(390, 200); g.fill()
    crest(g, 145, 190, 22)
  } else {
    // tramas sutis
    g.fillStyle = kit.J2
    for (let x = 0; x < 512; x += 48) g.fillRect(x, 0, 22, 512)
    const grd = g.createLinearGradient(0, 0, 0, 512)
    grd.addColorStop(0, 'rgba(255,255,255,0.08)')
    grd.addColorStop(1, 'rgba(0,0,0,0.12)')
    g.fillStyle = grd
    g.fillRect(0, 0, 512, 512)
    // gola V
    g.fillStyle = kit.T
    g.beginPath(); g.moveTo(160, 0); g.lineTo(352, 0); g.lineTo(256, 118); g.closePath(); g.fill()
    g.fillStyle = shade(kit.J, -0.35)
    g.beginPath(); g.moveTo(194, 0); g.lineTo(318, 0); g.lineTo(256, 78); g.closePath(); g.fill()
    // listras laterais
    g.fillStyle = kit.T
    g.fillRect(14, 120, 10, 392)
    g.fillRect(488, 120, 10, 392)
    // escudo no peito
    if (i.role === 'gk') {
      g.fillStyle = '#161616'
      g.beginPath(); g.moveTo(0, 300); g.lineTo(512, 220); g.lineTo(512, 250); g.lineTo(0, 330); g.fill()
    }
    crest(g, 352, 200, 46)
    // barra
    g.fillStyle = kit.T
    g.fillRect(0, 470, 512, 14)
  }
  return canvasTex(c, renderer)
}

// escudo genérico verde e branco com o "P"
function crest(g, x, y, r) {
  g.fillStyle = '#f4f4f4'
  g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill()
  g.fillStyle = '#0b7a43'
  g.beginPath(); g.arc(x, y, r * 0.84, 0, Math.PI * 2); g.fill()
  g.strokeStyle = '#f4f4f4'
  g.lineWidth = Math.max(2, r * 0.07)
  g.beginPath(); g.arc(x, y, r * 0.68, 0, Math.PI * 2); g.stroke()
  g.fillStyle = '#f4f4f4'
  g.font = `900 ${Math.round(r * 0.95)}px Arial, sans-serif`
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillText('P', x, y + r * 0.05)
  if (r > 30) {
    g.fillStyle = '#f2c230'
    for (const s of [-1, 0, 1]) star(g, x + s * r * 0.42, y - r * 1.32, r * 0.16)
  }
}

function star(g, x, y, r) {
  g.beginPath()
  for (let k = 0; k < 10; k++) {
    const a = -Math.PI / 2 + (k * Math.PI) / 5
    const rr = k % 2 ? r * 0.45 : r
    g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr)
  }
  g.closePath()
  g.fill()
}

function roundRect(g, x, y, w, h, r) {
  g.beginPath()
  g.roundRect(x, y, w, h, r)
  g.fill()
}

function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`
}

function shade(hex, k) {
  const c = new THREE.Color(hex)
  c.offsetHSL(0, 0, k * 0.5)
  return '#' + c.getHexString()
}

// ---------- peças ----------

// cabeça: cilindro com bordas arredondadas (torneado), UV vertical pela altura
function headGeometry(r = 0.52, h = 0.7, e = 0.09) {
  const pts = [new THREE.Vector2(0, 0)]
  const arc = (cx, cy, a0, a1) => {
    for (let k = 0; k <= 6; k++) {
      const a = a0 + ((a1 - a0) * k) / 6
      pts.push(new THREE.Vector2(cx + Math.cos(a) * e, cy + Math.sin(a) * e))
    }
  }
  arc(r - e, e, -Math.PI / 2, 0)
  for (let k = 1; k < 8; k++) pts.push(new THREE.Vector2(r, e + ((h - 2 * e) * k) / 8))
  arc(r - e, h - e, 0, Math.PI / 2)
  pts.push(new THREE.Vector2(0, h))
  const geo = new THREE.LatheGeometry(pts, 48, Math.PI)
  const pos = geo.attributes.position
  const uv = geo.attributes.uv
  for (let k = 0; k < uv.count; k++) uv.setY(k, pos.getY(k) / h)
  geo.computeVertexNormals()
  return geo
}

// tronco trapezoidal arredondado
function torsoGeometry() {
  const geo = new RoundedBoxGeometry(1.12, 1.0, 0.58, 4, 0.07)
  const pos = geo.attributes.position
  for (let k = 0; k < pos.count; k++) {
    const t = (pos.getY(k) + 0.5) // 0 embaixo, 1 em cima
    pos.setX(k, pos.getX(k) * (1 - 0.26 * t))
  }
  geo.computeVertexNormals()
  return geo
}

function buildFigure(i, renderer) {
  const kit = KITS[i.role] || KITS.fw
  const coach = i.role === 'coach'
  const g = new THREE.Group()
  const skinM = plastic(i.skin)
  const jerseyM = plastic(kit.J)
  const shortsM = plastic(kit.P)
  const sockM = plastic(kit.S)
  const shoeM = plastic(kit.shoe, { roughness: 0.25 })

  // base redonda
  const baseM = plastic('#156b3c')
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.92, 0.95, 0.16, 48), baseM)
  base.position.y = -0.08
  g.add(base)
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.92, 0.025, 8, 48), baseM)
  rim.rotation.x = Math.PI / 2
  g.add(rim)

  // pernas
  for (const s of [-1, 1]) {
    const x = s * 0.27
    g.add(rbox(0.5, 0.17, 0.7, shoeM, x, 0.085, 0.05, 0.06))
    g.add(rbox(0.48, 0.46, 0.56, sockM, x, 0.39, 0, 0.05))
    if (kit.B) g.add(rbox(0.49, 0.07, 0.57, plastic(kit.B), x, 0.56, 0, 0.03))
    g.add(rbox(0.52, 0.22, 0.6, shortsM, x, 0.72, 0, 0.05))
  }
  g.add(rbox(1.1, 0.24, 0.6, shortsM, 0, 0.9, 0, 0.06))
  if (!coach) {
    // friso das calças
    const trimM = plastic(kit.J)
    for (const s of [-1, 1]) g.add(rbox(0.05, 0.2, 0.61, trimM, s * 0.51, 0.72, 0, 0.02))
  }

  // tronco
  const frontM = plastic('#ffffff', { map: torsoTexture(i, kit, renderer) })
  const torso = new THREE.Mesh(torsoGeometry(), jerseyM)
  // a frente (+z) recebe a estampa: separa por normal
  torso.geometry.clearGroups()
  const idx = torso.geometry.index
  const nrm = torso.geometry.attributes.normal
  const front = []
  const rest = []
  if (idx) {
    for (let t = 0; t < idx.count; t += 3) {
      const a = idx.getX(t)
      ;(nrm.getZ(a) > 0.7 ? front : rest).push(idx.getX(t), idx.getX(t + 1), idx.getX(t + 2))
    }
    torso.geometry.setIndex([...rest, ...front])
    torso.geometry.addGroup(0, rest.length, 0)
    torso.geometry.addGroup(rest.length, front.length, 1)
  } else {
    const n = nrm.count
    const sorted = { rest: [], front: [] }
    for (let t = 0; t < n; t += 3) (nrm.getZ(t) > 0.7 ? sorted.front : sorted.rest).push(t, t + 1, t + 2)
    torso.geometry.setIndex([...sorted.rest, ...sorted.front])
    torso.geometry.addGroup(0, sorted.rest.length, 0)
    torso.geometry.addGroup(sorted.rest.length, sorted.front.length, 1)
  }
  torso.material = [jerseyM, frontM]
  torso.position.y = 1.52
  g.add(torso)

  // pescoço
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.12, 20), skinM)
  neck.position.y = 2.06
  g.add(neck)

  // braços: manga, antebraço e mão em "C"
  const longSleeve = i.role === 'gk' || coach
  const handM = kit.gloves ? plastic(kit.gloves) : skinM
  for (const s of [-1, 1]) {
    const arm = new THREE.Group()
    arm.position.set(s * 0.5, 1.92, 0)
    arm.rotation.z = s * 0.2
    arm.rotation.x = -0.28
    const sleeve = rbox(0.32, 0.5, 0.38, jerseyM, s * 0.07, -0.16, 0, 0.12)
    arm.add(sleeve)
    if (!longSleeve) {
      const cuff = rbox(0.33, 0.06, 0.39, plastic(kit.T), s * 0.07, -0.39, 0, 0.02)
      arm.add(cuff)
    }
    const fore = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.13, 0.42, 20), longSleeve ? jerseyM : skinM)
    fore.position.set(s * 0.08, -0.6, 0.02)
    arm.add(fore)
    const handPivot = new THREE.Group()
    handPivot.position.set(s * 0.08, -0.86, 0.04)
    handPivot.rotation.y = (5 * Math.PI) / 4
    const hand = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.065, 12, 24, Math.PI * 1.55), handM)
    hand.rotation.x = Math.PI / 2
    handPivot.add(hand)
    arm.add(handPivot)
    g.add(arm)
  }

  // cabeçona
  const head = new THREE.Group()
  head.position.y = 2.1
  head.scale.setScalar(1.95)
  const faceM = plastic('#ffffff', { map: faceTexture(i, renderer) })
  head.add(new THREE.Mesh(headGeometry(), faceM))
  const stud = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.12, 24), skinM)
  stud.position.y = 0.75

  const hairM = hairMat(i.hair)
  const st = i.hairStyle
  if (st === 'bald') {
    head.add(stud)
  } else if (st === 'buzz') {
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.535, 40, 16, 0, Math.PI * 2, 0, Math.PI / 2), hairM)
    cap.scale.y = 0.5
    cap.position.set(0, 0.6, -0.01)
    cap.rotation.x = -0.1
    head.add(cap)
  } else {
    const rec = st === 'recede'
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.57, 40, 18, 0, Math.PI * 2, 0, Math.PI / 2 + (rec ? 0.08 : 0.22)), hairM)
    cap.scale.set(1, 0.82, 1.02)
    cap.position.set(0, 0.6, rec ? -0.06 : -0.02)
    cap.rotation.x = rec ? -0.32 : -0.16
    head.add(cap)
    if (st === 'quiff') {
      const q = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.42, 6, 16), hairM)
      q.rotation.z = Math.PI / 2
      q.rotation.y = 0.15
      q.position.set(0.02, 0.95, 0.22)
      head.add(q)
    }
    if (st === 'side') {
      const part = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.5, 6, 16), hairM)
      part.rotation.z = Math.PI / 2 - 0.12
      part.position.set(0.04, 0.92, 0.24)
      head.add(part)
      const sweep = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.22, 6, 16), hairM)
      sweep.rotation.x = Math.PI / 2
      sweep.position.set(-0.32, 0.86, 0.22)
      head.add(sweep)
    }
    if (st === 'wavy') {
      const back = new THREE.Mesh(new THREE.CylinderGeometry(0.585, 0.6, 0.62, 40, 1, true, Math.PI * 0.55, Math.PI * 0.9), hairM)
      back.material = hairM.clone()
      back.material.side = THREE.DoubleSide
      back.position.set(0, 0.32, -0.04)
      head.add(back)
      for (const s of [-1, 1]) {
        const lock = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.36, 6, 12), hairM)
        lock.position.set(s * 0.5, 0.5, 0.02)
        lock.rotation.z = s * 0.12
        head.add(lock)
      }
    }
    if (rec) {
      for (const s of [-1, 1]) {
        const side = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.3, 6, 12), hairM)
        side.position.set(s * 0.5, 0.5, -0.12)
        head.add(side)
      }
    }
  }
  g.add(head)
  return g
}

function contactShadow() {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const g = c.getContext('2d')
  const rg = g.createRadialGradient(64, 64, 10, 64, 64, 64)
  rg.addColorStop(0, 'rgba(0,30,15,0.45)')
  rg.addColorStop(1, 'rgba(0,30,15,0)')
  g.fillStyle = rg
  g.fillRect(0, 0, 128, 128)
  const t = new THREE.CanvasTexture(c)
  const m = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 1.5), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false }))
  m.rotation.x = -Math.PI / 2
  m.position.y = -0.17
  return m
}

function dispose(obj) {
  obj.traverse((o) => {
    o.geometry?.dispose()
    const ms = Array.isArray(o.material) ? o.material : o.material ? [o.material] : []
    ms.forEach((m) => {
      m.map?.dispose()
      m.dispose()
    })
  })
}

const toBlobUrl = (c) =>
  new Promise((res, rej) => c.toBlob((b) => (b ? res(URL.createObjectURL(b)) : rej(new Error('blob'))), 'image/png'))

async function bakeAll() {
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true })
  renderer.setPixelRatio(1)
  renderer.setSize(W, H, false)
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 0.95
  renderer.outputColorSpace = THREE.SRGBColorSpace

  const scene = new THREE.Scene()
  const pmrem = new THREE.PMREMGenerator(renderer)
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
  scene.environment = env

  // luz de três pontos
  const key = new THREE.DirectionalLight(0xfff1de, 1.9)
  key.position.set(4, 6, 7)
  scene.add(key)
  const fill = new THREE.DirectionalLight(0xcfe3ff, 0.7)
  fill.position.set(-6, 2, 4)
  scene.add(fill)
  const rim = new THREE.DirectionalLight(0xc8ffe0, 1.6)
  rim.position.set(-2, 5, -6)
  scene.add(rim)
  scene.add(new THREE.HemisphereLight(0xffffff, 0x2a4a35, 0.35))
  const shadow = contactShadow()
  scene.add(shadow)

  const cam = new THREE.PerspectiveCamera(25, W / H, 0.1, 50)
  cam.position.set(0, 2.9, 11.6)
  cam.lookAt(0, 1.78, 0)

  const strip = document.createElement('canvas')
  strip.width = W * FRAMES
  strip.height = H
  const sg = strip.getContext('2d')

  const out = []
  for (const i of IDOLS) {
    const fig = buildFigure(i, renderer)
    scene.add(fig)
    sg.clearRect(0, 0, strip.width, H)
    for (let f = 0; f < FRAMES; f++) {
      fig.rotation.y = -TURN + (2 * TURN * f) / (FRAMES - 1)
      renderer.render(scene, cam)
      sg.drawImage(canvas, f * W, 0)
    }
    out.push(await toBlobUrl(strip))
    scene.remove(fig)
    dispose(fig)
    await new Promise((r) => setTimeout(r)) // não trava a interface entre ídolos
  }
  dispose(shadow)
  env.dispose()
  pmrem.dispose()
  renderer.dispose()
  renderer.forceContextLoss()
  return out
}

export async function hydrateIdols(root) {
  const slots = root.querySelectorAll('.idol__sprite')
  if (!slots.length) return
  try {
    strips ||= await bakeAll()
  } catch {
    return // sem WebGL: fica o SVG de reserva
  }
  slots.forEach((svg, n) => {
    const url = strips[n]
    if (!url) return
    const fig = document.createElement('span')
    fig.className = 'idol__fig'
    fig.style.backgroundImage = `url("${url}")`
    svg.replaceWith(fig)
  })
}
