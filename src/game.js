// Motor do jogo: loop, input (teclado + joystick), colisão, câmera e desenho.
import { BUILDINGS, H, START, T, W, bakeGround, buildWorld, drawPlayer, makeBuilding, makeLamp, makeTree } from './world.js'

const SPEED = 62 // px lógicos por segundo
const FOOT_W = 5 // meia largura da caixa de colisão
const FOOT_H = 5

export function createGame(canvas, { onNear, onEnter, getLabels }) {
  const ctx = canvas.getContext('2d')
  const world = buildWorld()
  const ground = bakeGround(world)
  const buildingSprites = new Map(BUILDINGS.map((b) => [b.key, makeBuilding(b)]))
  const treeSprites = { g: makeTree('g'), o: makeTree('o'), p: makeTree('p') }
  const lampSprite = makeLamp()

  const player = { x: START.x, y: START.y, dir: 'down', frame: 0, t: 0, moving: false }
  const input = { keys: new Set(), stick: { x: 0, y: 0 } }
  let paused = true
  let near = null
  let view = { w: 0, h: 0, S: 3, css: 3, dpr: 1 }
  let cam = { x: 0, y: 0 }
  let last = 0
  let raf = 0
  let time = 0
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches

  // ---------- tamanho ----------
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 3)
    const cw = canvas.clientWidth
    const ch = canvas.clientHeight
    const forced = Number(new URLSearchParams(location.search).get('zoom')) || 0
    const css = forced || Math.max(2, Math.min(5, Math.floor(Math.min(cw / 360, ch / 220))))
    const S = Math.max(1, Math.round(css * dpr))
    canvas.width = Math.round(cw * dpr)
    canvas.height = Math.round(ch * dpr)
    view = { w: canvas.width / S, h: canvas.height / S, S, css, dpr, cw, ch }
  }

  // ---------- input ----------
  const KEYMAP = {
    ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
  }
  function onKeyDown(e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return
    const dir = KEYMAP[e.code]
    if (dir) {
      if (!paused) e.preventDefault()
      input.keys.add(dir)
      return
    }
    if (paused) return
    if ((e.code === 'KeyE' || e.code === 'Enter' || e.code === 'Space') && near) {
      e.preventDefault()
      onEnter(near.key)
    }
  }
  function onKeyUp(e) {
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
  window.addEventListener('resize', resize)

  // clique/toque nos rótulos dos prédios
  canvas.addEventListener('click', (e) => {
    if (paused) return
    const rect = canvas.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    for (const l of labelBoxes) {
      if (mx >= l.x && mx <= l.x + l.w && my >= l.y && my <= l.y + l.h) {
        onEnter(l.key)
        return
      }
    }
  })
  let labelBoxes = []

  // ---------- física ----------
  const solidAt = (px, py) => {
    const tx = Math.floor(px / T)
    const ty = Math.floor(py / T)
    if (tx < 0 || ty < 0 || tx >= W || ty >= H) return true
    return world.solid[ty][tx]
  }
  const blocked = (x, y) =>
    solidAt(x - FOOT_W, y - FOOT_H) || solidAt(x + FOOT_W, y - FOOT_H) || solidAt(x - FOOT_W, y) || solidAt(x + FOOT_W, y)

  function update(dt) {
    let vx = 0
    let vy = 0
    if (input.keys.has('left')) vx -= 1
    if (input.keys.has('right')) vx += 1
    if (input.keys.has('up')) vy -= 1
    if (input.keys.has('down')) vy += 1
    vx += input.stick.x
    vy += input.stick.y
    const len = Math.hypot(vx, vy)
    if (len > 1) {
      vx /= len
      vy /= len
    }
    if (paused) {
      vx = 0
      vy = 0
    }
    player.moving = Math.hypot(vx, vy) > 0.08
    if (player.moving) {
      const nx = player.x + vx * SPEED * dt
      if (!blocked(nx, player.y)) player.x = nx
      const ny = player.y + vy * SPEED * dt
      if (!blocked(player.x, ny)) player.y = ny
      if (Math.abs(vx) > Math.abs(vy)) player.dir = vx < 0 ? 'left' : 'right'
      else player.dir = vy < 0 ? 'up' : 'down'
      player.t += dt
      const seq = [0, 1, 0, 2]
      player.frame = seq[Math.floor(player.t / 0.14) % 4]
    } else {
      player.frame = 0
      player.t = 0
    }

    // proximidade
    let found = null
    for (const b of BUILDINGS) {
      const z = b.zone
      if (player.x >= z.x && player.x <= z.x + z.w && player.y >= z.y && player.y <= z.y + z.h) found = b
    }
    if (found?.key !== near?.key) {
      near = found
      onNear(near ? near.key : null)
    }
  }

  // ---------- desenho ----------
  function draw() {
    const { S, w, h } = view
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.fillStyle = '#6aa354'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.setTransform(S, 0, 0, S, 0, 0)
    ctx.imageSmoothingEnabled = false

    const maxX = W * T - w
    const maxY = H * T - h
    cam.x = maxX <= 0 ? maxX / 2 : Math.max(0, Math.min(maxX, player.x - w / 2))
    cam.y = maxY <= 0 ? maxY / 2 : Math.max(0, Math.min(maxY, player.y - 8 - h / 2))
    cam.x = Math.round(cam.x)
    cam.y = Math.round(cam.y)
    ctx.translate(-cam.x, -cam.y)

    ctx.drawImage(ground, 0, 0)

    // itens ordenados por Y (de trás pra frente)
    const items = []
    for (const b of BUILDINGS) items.push({ y: (b.y + b.h) * T, draw: () => ctx.drawImage(buildingSprites.get(b.key), b.x * T, b.y * T - 10) })
    for (const t of world.trees) items.push({ y: (t.y + 1) * T, draw: () => ctx.drawImage(treeSprites[t.kind], t.x * T + 8 - 14, (t.y + 1) * T - 34) })
    for (const [lx, ly] of world.lamps) items.push({ y: (ly + 1) * T, draw: () => ctx.drawImage(lampSprite, lx * T + 2, (ly + 1) * T - 28) })
    items.push({ y: player.y, draw: () => drawPlayer(ctx, player.x, player.y, player.dir, player.frame) })
    items.sort((a, b) => a.y - b.y)
    for (const it of items) it.draw()

    // brilho de destaque na porta próxima
    if (near && !reduceMotion) {
      const a = 0.25 + 0.2 * Math.sin(time * 5)
      ctx.fillStyle = `rgba(255,236,160,${a})`
      ctx.fillRect(near.doorX * T, (near.y + near.h) * T, 2 * T, T)
    }

    // rótulos (resolução da tela, texto nítido)
    ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0)
    const scale = view.S / view.dpr
    const labels = getLabels()
    labelBoxes = []
    ctx.font = '700 13px ui-rounded, "Trebuchet MS", system-ui, sans-serif'
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'center'
    for (const b of BUILDINGS) {
      const text = labels[b.key]
      const sx = (b.labelX - cam.x) * scale
      const sy = (b.labelY - cam.y) * scale
      const tw = ctx.measureText(text).width
      const bw = tw + 18
      const bh = 24
      const isNear = near?.key === b.key
      const bx = sx - bw / 2
      const by = sy - bh / 2
      ctx.fillStyle = isNear ? '#ffd166' : 'rgba(45,42,50,.88)'
      roundRect(ctx, bx, by, bw, bh, 8)
      ctx.fill()
      ctx.lineWidth = 2
      ctx.strokeStyle = isNear ? '#3b2a1a' : 'rgba(255,246,229,.85)'
      ctx.stroke()
      ctx.fillStyle = isNear ? '#2d2a32' : '#fff6e5'
      ctx.fillText(text, sx, sy + 1)
      labelBoxes.push({ key: b.key, x: bx, y: by, w: bw, h: bh })
    }
  }

  function roundRect(c, x, y, w, h, r) {
    c.beginPath()
    c.moveTo(x + r, y)
    c.arcTo(x + w, y, x + w, y + h, r)
    c.arcTo(x + w, y + h, x, y + h, r)
    c.arcTo(x, y + h, x, y, r)
    c.arcTo(x, y, x + w, y, r)
    c.closePath()
  }

  function frame(ts) {
    const dt = Math.min(0.05, (ts - last) / 1000 || 0)
    last = ts
    time += dt
    update(dt)
    draw()
    raf = requestAnimationFrame(frame)
  }

  resize()
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
      const b = BUILDINGS.find((i) => i.key === key)
      if (!b) return
      player.x = (b.doorX + 1) * T
      player.y = (b.y + b.h) * T + 8
      player.dir = 'down'
    },
    getNear: () => near,
    destroy() {
      cancelAnimationFrame(raf)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', clearInput)
      window.removeEventListener('resize', resize)
    },
  }
}
