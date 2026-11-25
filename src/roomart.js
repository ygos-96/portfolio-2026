// Texturas pintadas em canvas para as salas: pisos, paredes, pôsteres, camisas e bolas.
// Nada de imagens externas: tudo é desenhado em código, no mesmo espírito do mapa.
import * as THREE from 'three'

let seed = 99
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)

export function tex(w, h, draw, { repeat = false } = {}) {
  const cv = document.createElement('canvas')
  cv.width = w
  cv.height = h
  draw(cv.getContext('2d'), w, h)
  const t = new THREE.CanvasTexture(cv)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping
  return t
}

const speckle = (g, w, h, n, a = 0.06, dark = true) => {
  for (let i = 0; i < n; i++) {
    g.fillStyle = dark ? `rgba(0,0,0,${a * rnd()})` : `rgba(255,255,255,${a * rnd()})`
    g.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 3, 1 + rnd() * 3)
  }
}

// ---------- pisos (cobrem a sala inteira) ----------
export function floorTex(kind, [c1, c2], W, D) {
  const w = 1024
  const h = Math.round((w * D) / W)
  const u = w / W
  return tex(w, h, (g) => {
    g.fillStyle = c1
    g.fillRect(0, 0, w, h)
    if (kind === 'planks') {
      const ph = u * 0.5
      for (let r = 0; r < h / ph; r++) {
        let x = -rnd() * u * 2
        while (x < w) {
          const pw = u * (1.6 + rnd() * 1.6)
          g.fillStyle = rnd() > 0.5 ? c1 : c2
          g.globalAlpha = 0.7 + rnd() * 0.3
          g.fillRect(x, r * ph, pw, ph)
          g.globalAlpha = 1
          g.strokeStyle = 'rgba(40,20,5,.35)'
          g.lineWidth = 2
          g.strokeRect(x, r * ph, pw, ph)
          x += pw
        }
      }
      speckle(g, w, h, 1400, 0.1)
      g.lineWidth = 1
      for (let i = 0; i < 260; i++) {
        const y = rnd() * h
        const x = rnd() * w
        g.strokeStyle = `rgba(60,30,10,${0.05 + rnd() * 0.1})`
        g.beginPath()
        g.moveTo(x, y)
        g.bezierCurveTo(x + 40, y + (rnd() - 0.5) * 3, x + 90, y + (rnd() - 0.5) * 3, x + 140 + rnd() * 80, y + (rnd() - 0.5) * 2)
        g.stroke()
      }
    } else if (kind === 'tile' || kind === 'lab') {
      for (let i = 0; i < W; i++)
        for (let j = 0; j < D; j++) {
          g.fillStyle = (i + j) % 2 ? c2 : c1
          g.fillRect(i * u, j * u, u, u)
        }
      g.strokeStyle = kind === 'lab' ? 'rgba(47,107,74,.35)' : 'rgba(90,70,40,.3)'
      g.lineWidth = 2
      for (let i = 0; i <= W; i++) {
        g.beginPath()
        g.moveTo(i * u, 0)
        g.lineTo(i * u, h)
        g.stroke()
      }
      for (let j = 0; j <= D; j++) {
        g.beginPath()
        g.moveTo(0, j * u)
        g.lineTo(w, j * u)
        g.stroke()
      }
      speckle(g, w, h, 800, 0.06)
    } else if (kind === 'concrete') {
      speckle(g, w, h, 4000, 0.12)
      speckle(g, w, h, 1500, 0.12, false)
      g.strokeStyle = 'rgba(0,0,0,.18)'
      g.lineWidth = 2
      for (let i = 1; i < W; i += 3) {
        g.beginPath()
        g.moveTo(i * u, 0)
        g.lineTo(i * u, h)
        g.stroke()
      }
      g.fillStyle = '#f4c95d'
      for (let x = 0; x < w; x += 46) g.fillRect(x, h - 22, 28, 10)
    } else if (kind === 'carpet') {
      g.fillStyle = c2
      for (let i = 0; i < W * 2; i++)
        for (let j = 0; j < D * 2; j++) if ((i + j) % 2 === 0) g.fillRect(i * u * 0.5 + u * 0.18, j * u * 0.5 + u * 0.18, u * 0.14, u * 0.14)
      speckle(g, w, h, 2500, 0.1)
    } else if (kind === 'pitch') {
      for (let i = 0; i < W; i++) {
        g.fillStyle = i % 2 ? c1 : c2
        g.fillRect(i * u, 0, u, h)
      }
      speckle(g, w, h, 1500, 0.08)
    }
  })
}

// ---------- paredes ----------
export function wallTex(kind, w, hh, [c1, c2]) {
  const px = 140
  const W = Math.round(w * px)
  const H = Math.round(hh * px)
  return tex(W, H, (g) => {
    g.fillStyle = c1
    g.fillRect(0, 0, W, H)
    const wain = H * 0.3
    if (kind === 'paper') {
      g.fillStyle = c2
      for (let x = 0; x < W; x += px * 0.5) g.fillRect(x, 0, px * 0.18, H)
      speckle(g, W, H, 600, 0.05)
    } else if (kind === 'brick') {
      for (let r = 0; r < H / 22; r++)
        for (let x = -(r % 2) * 30; x < W; x += 62) {
          g.fillStyle = rnd() > 0.5 ? c1 : c2
          g.fillRect(x + 2, r * 22 + 2, 58, 18)
        }
      speckle(g, W, H, 2500, 0.15)
    } else if (kind === 'panel') {
      g.fillStyle = c2
      g.fillRect(0, H - wain, W, wain)
      g.strokeStyle = 'rgba(0,0,0,.25)'
      g.lineWidth = 3
      for (let x = 0; x < W; x += px * 0.9) g.strokeRect(x + 8, H - wain + 10, px * 0.9 - 16, wain - 20)
    } else if (kind === 'grid') {
      g.strokeStyle = c2
      g.lineWidth = 2
      for (let x = 0; x < W; x += px * 0.5) {
        g.beginPath()
        g.moveTo(x, 0)
        g.lineTo(x, H)
        g.stroke()
      }
      for (let y = 0; y < H; y += px * 0.5) {
        g.beginPath()
        g.moveTo(0, y)
        g.lineTo(W, y)
        g.stroke()
      }
    } else if (kind === 'curtain') {
      for (let x = 0; x < W; x += 14) {
        g.fillStyle = (x / 14) % 2 ? c1 : c2
        g.fillRect(x, 0, 14, H)
      }
    } else if (kind === 'stripes') {
      g.fillStyle = c2
      for (let x = 0; x < W; x += px * 0.9) g.fillRect(x, 0, px * 0.45, H)
    }
    // sombra suave no topo e no rodapé
    const gr = g.createLinearGradient(0, 0, 0, H)
    gr.addColorStop(0, 'rgba(0,0,0,.18)')
    gr.addColorStop(0.15, 'rgba(0,0,0,0)')
    gr.addColorStop(0.9, 'rgba(0,0,0,0)')
    gr.addColorStop(1, 'rgba(0,0,0,.2)')
    g.fillStyle = gr
    g.fillRect(0, 0, W, H)
  })
}

// ---------- pôsteres e arte ----------
const text = (g, s, x, y, size, color, font = '900', align = 'center') => {
  g.fillStyle = color
  g.textAlign = align
  g.textBaseline = 'middle'
  g.font = `${font} ${size}px "Arial Black", Impact, system-ui, sans-serif`
  g.fillText(s, x, y)
}
const star = (g, cx, cy, r, color) => {
  g.fillStyle = color
  g.beginPath()
  for (let i = 0; i < 10; i++) {
    const a = (i * Math.PI) / 5 - Math.PI / 2
    const rr = i % 2 ? r * 0.42 : r
    g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr)
  }
  g.closePath()
  g.fill()
}
const figure = (g, cx, cy, s, color) => {
  // silhueta saltando para enterrar
  g.strokeStyle = color
  g.fillStyle = color
  g.lineCap = 'round'
  g.lineWidth = s * 0.14
  g.beginPath()
  g.arc(cx, cy - s * 0.55, s * 0.16, 0, 7)
  g.fill()
  g.beginPath()
  g.moveTo(cx, cy - s * 0.4)
  g.lineTo(cx - s * 0.05, cy + s * 0.12)
  g.moveTo(cx, cy - s * 0.32)
  g.lineTo(cx + s * 0.38, cy - s * 0.62)
  g.moveTo(cx, cy - s * 0.3)
  g.lineTo(cx - s * 0.3, cy - s * 0.12)
  g.moveTo(cx - s * 0.05, cy + s * 0.12)
  g.lineTo(cx - s * 0.32, cy + s * 0.34)
  g.moveTo(cx - s * 0.05, cy + s * 0.12)
  g.lineTo(cx + s * 0.22, cy + s * 0.3)
  g.stroke()
}

export const ART = {
  jordan: () =>
    tex(256, 340, (g, w, h) => {
      g.fillStyle = '#b3202e'
      g.fillRect(0, 0, w, h)
      g.fillStyle = '#111'
      g.beginPath()
      g.arc(w / 2, h * 0.42, 96, 0, 7)
      g.fill()
      figure(g, w / 2, h * 0.45, 190, '#ffffff')
      g.fillStyle = '#f4a259'
      g.beginPath()
      g.arc(w / 2 + 84, h * 0.3, 15, 0, 7)
      g.fill()
      text(g, 'AIR', w / 2, h * 0.78, 44, '#ffffff')
      text(g, 'MJ 23', w / 2, h * 0.9, 38, '#111')
    }),
  lebron: () =>
    tex(256, 340, (g, w, h) => {
      g.fillStyle = '#552583'
      g.fillRect(0, 0, w, h)
      g.fillStyle = '#fdb927'
      g.beginPath()
      g.moveTo(60, 110)
      g.lineTo(80, 60)
      g.lineTo(110, 95)
      g.lineTo(128, 45)
      g.lineTo(146, 95)
      g.lineTo(176, 60)
      g.lineTo(196, 110)
      g.closePath()
      g.fill()
      text(g, '23', w / 2, h * 0.52, 120, '#fdb927')
      text(g, 'KING', w / 2, h * 0.8, 52, '#ffffff')
      text(g, 'LEBRON', w / 2, h * 0.9, 24, '#fdb927')
    }),
  spurs: () =>
    tex(256, 340, (g, w, h) => {
      g.fillStyle = '#0b0b0b'
      g.fillRect(0, 0, w, h)
      g.fillStyle = '#c4ced4'
      g.fillRect(0, h * 0.62, w, 14)
      g.fillRect(0, h * 0.62 + 24, w, 6)
      star(g, w / 2, h * 0.3, 74, '#c4ced4')
      text(g, 'SPURS', w / 2, h * 0.8, 62, '#c4ced4')
      text(g, 'SAN ANTONIO', w / 2, h * 0.92, 22, '#ffffff')
    }),
  palmeiras: () =>
    tex(256, 340, (g, w, h) => {
      g.fillStyle = '#0a7b45'
      g.fillRect(0, 0, w, h)
      g.fillStyle = '#ffffff'
      g.beginPath()
      g.arc(w / 2, h * 0.38, 86, 0, 7)
      g.fill()
      g.fillStyle = '#0a7b45'
      g.beginPath()
      g.arc(w / 2, h * 0.38, 72, 0, 7)
      g.fill()
      text(g, 'P', w / 2, h * 0.38, 110, '#ffffff')
      text(g, 'PALMEIRAS', w / 2, h * 0.76, 36, '#ffffff')
      text(g, 'AVANTI', w / 2, h * 0.88, 30, '#f4c95d')
    }),
  spidey: () =>
    tex(256, 340, (g, w, h) => {
      g.fillStyle = '#c1121f'
      g.fillRect(0, 0, w, h)
      g.strokeStyle = 'rgba(255,255,255,.55)'
      g.lineWidth = 2
      for (let a = 0; a < 12; a++) {
        g.beginPath()
        g.moveTo(w / 2, h * 0.4)
        g.lineTo(w / 2 + Math.cos((a * Math.PI) / 6) * 260, h * 0.4 + Math.sin((a * Math.PI) / 6) * 260)
        g.stroke()
      }
      for (let r = 40; r < 220; r += 40) {
        g.beginPath()
        g.arc(w / 2, h * 0.4, r, 0, 7)
        g.stroke()
      }
      g.fillStyle = '#111'
      g.beginPath()
      g.ellipse(w / 2, h * 0.4, 22, 34, 0, 0, 7)
      g.fill()
      g.lineWidth = 6
      g.strokeStyle = '#111'
      for (const s of [-1, 1])
        for (const k of [-24, 0, 24]) {
          g.beginPath()
          g.moveTo(w / 2 + s * 14, h * 0.4 + k * 0.5)
          g.lineTo(w / 2 + s * 56, h * 0.4 + k * 1.6)
          g.stroke()
        }
      text(g, 'COM GRANDES PODERES', w / 2, h * 0.84, 17, '#ffffff', '800')
      text(g, 'VÊM GRANDES RESPONSABILIDADES', w / 2, h * 0.91, 12, '#ffffff', '800')
    }),
  batman: () =>
    tex(256, 340, (g, w, h) => {
      g.fillStyle = '#14141c'
      g.fillRect(0, 0, w, h)
      g.fillStyle = '#f4c20d'
      g.beginPath()
      g.ellipse(w / 2, h * 0.4, 100, 58, 0, 0, 7)
      g.fill()
      g.fillStyle = '#111'
      g.beginPath()
      g.moveTo(w / 2, h * 0.34)
      g.lineTo(w / 2 + 20, h * 0.3)
      g.lineTo(w / 2 + 34, h * 0.34)
      g.lineTo(w / 2 + 86, h * 0.3)
      g.quadraticCurveTo(w / 2 + 60, h * 0.4, w / 2 + 40, h * 0.5)
      g.quadraticCurveTo(w / 2 + 18, h * 0.42, w / 2, h * 0.52)
      g.quadraticCurveTo(w / 2 - 18, h * 0.42, w / 2 - 40, h * 0.5)
      g.quadraticCurveTo(w / 2 - 60, h * 0.4, w / 2 - 86, h * 0.3)
      g.lineTo(w / 2 - 34, h * 0.34)
      g.lineTo(w / 2 - 20, h * 0.3)
      g.closePath()
      g.fill()
      text(g, 'HERÓI', w / 2, h * 0.84, 40, '#f4c20d')
    }),
  superman: () =>
    tex(256, 340, (g, w, h) => {
      g.fillStyle = '#1d4ed8'
      g.fillRect(0, 0, w, h)
      g.fillStyle = '#e63946'
      g.beginPath()
      g.moveTo(w / 2, h * 0.14)
      g.lineTo(w / 2 + 96, h * 0.3)
      g.lineTo(w / 2, h * 0.7)
      g.lineTo(w / 2 - 96, h * 0.3)
      g.closePath()
      g.fill()
      text(g, 'S', w / 2, h * 0.38, 110, '#f4c20d')
    }),
  code: (c1 = '#7cfc7c') =>
    tex(256, 160, (g, w, h) => {
      g.fillStyle = '#0f1220'
      g.fillRect(0, 0, w, h)
      const cols = [c1, '#ffd166', '#ff6bd6', '#4cc9f0', '#e8e8f0']
      for (let r = 0; r < 11; r++) {
        let x = 14 + (r % 3) * 12
        g.fillStyle = '#4a4f66'
        g.fillRect(4, 8 + r * 13, 5, 6)
        for (let k = 0; k < 4; k++) {
          const lw = 16 + rnd() * 40
          g.fillStyle = cols[Math.floor(rnd() * cols.length)]
          g.fillRect(x, 8 + r * 13, lw, 6)
          x += lw + 6
          if (x > w - 20) break
        }
      }
    }),
  nodes: () =>
    tex(256, 160, (g, w, h) => {
      g.fillStyle = '#1b1530'
      g.fillRect(0, 0, w, h)
      g.strokeStyle = '#ff6d5a'
      g.lineWidth = 3
      const pts = [[40, 80], [110, 40], [110, 120], [190, 80], [230, 40]]
      const links = [[0, 1], [0, 2], [1, 3], [2, 3], [3, 4]]
      for (const [a, b] of links) {
        g.beginPath()
        g.moveTo(pts[a][0], pts[a][1])
        g.bezierCurveTo(pts[a][0] + 40, pts[a][1], pts[b][0] - 40, pts[b][1], pts[b][0], pts[b][1])
        g.stroke()
      }
      const cs = ['#ff6d5a', '#ffd166', '#4cc9f0', '#ff6bd6', '#7cfc7c']
      pts.forEach(([x, y], i) => {
        g.fillStyle = cs[i]
        g.beginPath()
        g.roundRect(x - 22, y - 16, 44, 32, 8)
        g.fill()
      })
    }),
  chalk: () =>
    tex(512, 200, (g, w, h) => {
      g.fillStyle = '#1f3a2f'
      g.fillRect(0, 0, w, h)
      speckle(g, w, h, 900, 0.09, false)
      g.strokeStyle = 'rgba(255,255,255,.85)'
      g.fillStyle = 'rgba(255,255,255,.9)'
      g.font = '700 26px "Comic Sans MS", cursive, system-ui'
      g.textAlign = 'left'
      g.fillText('const dev = {', 24, 44)
      g.fillText('  stack: ["React","Astro","n8n"],', 24, 78)
      g.fillText('  cafe: Infinity, time: "Palmeiras"', 24, 112)
      g.fillText('}   // aprender sempre ✎', 24, 146)
      g.lineWidth = 3
      g.beginPath()
      g.arc(430, 100, 40, 0, 7)
      g.stroke()
      g.fillText('E=mc²', 396, 104)
    }),
  jersey: (c1, c2, num, name) =>
    tex(256, 300, (g, w, h) => {
      g.fillStyle = c1
      g.strokeStyle = c2
      g.lineWidth = 12
      g.beginPath()
      g.moveTo(70, 20)
      g.lineTo(110, 20)
      g.quadraticCurveTo(128, 70, 146, 20)
      g.lineTo(186, 20)
      g.lineTo(240, 80)
      g.lineTo(205, 120)
      g.lineTo(205, 285)
      g.lineTo(51, 285)
      g.lineTo(51, 120)
      g.lineTo(16, 80)
      g.closePath()
      g.fill()
      g.stroke()
      text(g, name, w / 2, 96, 24, c2, '800')
      text(g, String(num), w / 2, 175, 110, c2)
    }),
  pennant: (c1, c2, label) =>
    tex(256, 128, (g, w, h) => {
      g.fillStyle = c1
      g.beginPath()
      g.moveTo(4, 10)
      g.lineTo(w - 4, h / 2)
      g.lineTo(4, h - 10)
      g.closePath()
      g.fill()
      g.strokeStyle = c2
      g.lineWidth = 6
      g.stroke()
      text(g, label, w * 0.4, h / 2, 34, c2)
    }),
  notes: () =>
    tex(256, 200, (g, w, h) => {
      g.fillStyle = '#d9c3a0'
      g.fillRect(0, 0, w, h)
      const cs = ['#ffd166', '#ff9ec7', '#9be7ff', '#b8f2a0']
      for (let i = 0; i < 18; i++) {
        g.save()
        g.translate(20 + (i % 6) * 40, 24 + Math.floor(i / 6) * 58)
        g.rotate((rnd() - 0.5) * 0.25)
        g.fillStyle = cs[i % 4]
        g.fillRect(-16, -16, 34, 34)
        g.fillStyle = 'rgba(0,0,0,.35)'
        g.fillRect(-10, -6, 20, 3)
        g.fillRect(-10, 2, 14, 3)
        g.restore()
      }
    }),
  sky: () =>
    tex(128, 128, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, 0, h)
      gr.addColorStop(0, '#4aa8f0')
      gr.addColorStop(1, '#d6f0ff')
      g.fillStyle = gr
      g.fillRect(0, 0, w, h)
      g.fillStyle = 'rgba(255,255,255,.9)'
      for (const [x, y, r] of [[30, 40, 14], [48, 36, 18], [70, 44, 12], [100, 80, 12], [116, 76, 9]]) {
        g.beginPath()
        g.arc(x, y, r, 0, 7)
        g.fill()
      }
    }),
  newspaper: () =>
    tex(256, 340, (g, w, h) => {
      g.fillStyle = '#efe6cf'
      g.fillRect(0, 0, w, h)
      text(g, 'DAILY BUGLE', w / 2, 36, 34, '#222')
      g.fillStyle = '#222'
      g.fillRect(14, 60, w - 28, 3)
      text(g, 'HOMEM-ARANHA', w / 2, 96, 22, '#c1121f')
      text(g, 'ENTREGA A CARTA', w / 2, 122, 22, '#c1121f')
      g.fillStyle = '#bdb39a'
      g.fillRect(24, 150, 90, 70)
      for (let i = 0; i < 9; i++) g.fillRect(128, 150 + i * 14, 100, 6)
      for (let i = 0; i < 8; i++) g.fillRect(24, 236 + i * 12, 204, 5)
    }),
  keys: () =>
    tex(128, 48, (g, w, h) => {
      g.fillStyle = '#2a2a35'
      g.fillRect(0, 0, w, h)
      for (let r = 0; r < 4; r++)
        for (let c = 0; c < 14; c++) {
          g.fillStyle = (r + c) % 7 === 0 ? '#ff6bd6' : '#52526a'
          g.fillRect(4 + c * 8.6, 4 + r * 10.5, 7, 8.5)
        }
    }),
  basketball: () =>
    tex(512, 256, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, 0, h)
      gr.addColorStop(0, '#c4571a')
      gr.addColorStop(0.5, '#e3772a')
      gr.addColorStop(1, '#b24c14')
      g.fillStyle = gr
      g.fillRect(0, 0, w, h)
      // couro granulado
      for (let i = 0; i < 14000; i++) {
        const x = rnd() * w
        const y = rnd() * h
        g.fillStyle = rnd() > 0.45 ? `rgba(90,35,5,${0.1 + rnd() * 0.16})` : `rgba(255,190,120,${0.06 + rnd() * 0.1})`
        g.beginPath()
        g.arc(x, y, 0.7 + rnd() * 0.9, 0, 7)
        g.fill()
      }
      // gomos: meridianos, equador e os dois canais curvos
      const seam = (draw) => {
        g.lineCap = 'round'
        g.strokeStyle = 'rgba(0,0,0,.35)'
        g.lineWidth = 9
        draw()
        g.strokeStyle = '#1b0e06'
        g.lineWidth = 5
        draw()
      }
      for (const x of [0, w / 2, w])
        seam(() => {
          g.beginPath()
          g.moveTo(x, 0)
          g.lineTo(x, h)
          g.stroke()
        })
      seam(() => {
        g.beginPath()
        g.moveTo(0, h / 2)
        g.lineTo(w, h / 2)
        g.stroke()
      })
      for (const off of [0.25, 0.75])
        seam(() => {
          g.beginPath()
          for (let x = 0; x <= w; x += 4) {
            const y = h / 2 + Math.sin(((x / w) * 2 + off) * Math.PI * 2) * h * 0.3
            x === 0 ? g.moveTo(x, y) : g.lineTo(x, y)
          }
          g.stroke()
        })
    }),
  soccer: () =>
    tex(512, 256, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, 0, h)
      gr.addColorStop(0, '#e4e6ea')
      gr.addColorStop(0.5, '#ffffff')
      gr.addColorStop(1, '#d6d9de')
      g.fillStyle = gr
      g.fillRect(0, 0, w, h)
      const penta = (lon, lat) => {
        const cx = (lon / 360 + 0.5) * w
        const cy = (0.5 - lat / 180) * h
        const sx = 1 / Math.max(0.35, Math.cos((lat * Math.PI) / 180))
        for (const ox of [-w, 0, w]) {
          g.fillStyle = '#16161a'
          g.beginPath()
          for (let i = 0; i < 5; i++) {
            const a = (i * 2 * Math.PI) / 5 - Math.PI / 2
            g.lineTo(cx + ox + Math.cos(a) * 30 * sx, cy + Math.sin(a) * 30)
          }
          g.closePath()
          g.fill()
          // costuras ligando os gomos
          g.strokeStyle = 'rgba(70,70,80,.55)'
          g.lineWidth = 2
          for (let i = 0; i < 5; i++) {
            const a = (i * 2 * Math.PI) / 5 - Math.PI / 2
            g.beginPath()
            g.moveTo(cx + ox + Math.cos(a) * 30 * sx, cy + Math.sin(a) * 30)
            g.lineTo(cx + ox + Math.cos(a) * 62 * sx, cy + Math.sin(a) * 62)
            g.stroke()
          }
        }
      }
      for (let i = 0; i < 5; i++) {
        penta(-180 + i * 72, 26.6)
        penta(-144 + i * 72, -26.6)
      }
      g.fillStyle = '#16161a'
      g.fillRect(0, 0, w, 16)
      g.fillRect(0, h - 16, w, 16)
    }),
  profile: () =>
    tex(320, 160, (g, w, h) => {
      g.fillStyle = '#0f1220'
      g.fillRect(0, 0, w, h)
      g.fillStyle = '#1b2036'
      g.fillRect(10, 10, w - 20, h - 20)
      g.fillStyle = '#f4a259'
      g.beginPath()
      g.arc(52, 56, 26, 0, 7)
      g.fill()
      g.fillStyle = '#1c1526'
      g.fillRect(36, 74, 32, 22)
      text(g, 'Ygor Gomes', 190, 40, 20, '#ffffff', '800')
      text(g, 'Dev Front-End · n8n/IA', 190, 62, 12, '#4cc9f0', '700')
      g.fillStyle = '#4a4f66'
      for (let i = 0; i < 4; i++) g.fillRect(100, 84 + i * 14, 150 - i * 18, 6)
      g.fillStyle = '#5dca87'
      g.beginPath()
      g.arc(260, 120, 8, 0, 7)
      g.fill()
    }),
  desktop: () =>
    tex(512, 160, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, w, h)
      gr.addColorStop(0, '#2b1a5e')
      gr.addColorStop(1, '#0a6a8a')
      g.fillStyle = gr
      g.fillRect(0, 0, w, h)
      g.fillStyle = 'rgba(15,18,32,.92)'
      g.fillRect(24, 16, 190, 110)
      g.fillStyle = 'rgba(255,255,255,.9)'
      g.fillRect(250, 22, 230, 96)
      const cols = ['#ff6bd6', '#4cc9f0', '#ffd166', '#7cfc7c']
      for (let i = 0; i < 7; i++) {
        g.fillStyle = cols[i % 4]
        g.fillRect(34, 28 + i * 13, 30 + ((i * 37) % 120), 6)
      }
      g.fillStyle = '#5a5f78'
      for (let i = 0; i < 6; i++) g.fillRect(262, 34 + i * 14, 120 + ((i * 29) % 90), 6)
      g.fillStyle = 'rgba(10,10,20,.9)'
      g.fillRect(0, h - 20, w, 20)
      g.fillStyle = '#4cc9f0'
      g.fillRect(8, h - 14, 24, 8)
    }),
  landing: () =>
    tex(256, 200, (g, w, h) => {
      g.fillStyle = '#f6f1e4'
      g.fillRect(0, 0, w, h)
      g.fillStyle = '#2d2a32'
      g.fillRect(0, 0, w, 20)
      g.fillStyle = '#f4a259'
      g.fillRect(10, 6, 30, 8)
      g.fillStyle = '#4f7fcf'
      g.fillRect(0, 20, w, 70)
      text(g, 'Seu site aqui', w / 2, 52, 22, '#ffffff', '800')
      g.fillStyle = '#ffd166'
      g.beginPath()
      g.roundRect(w / 2 - 32, 66, 64, 16, 6)
      g.fill()
      for (let i = 0; i < 3; i++) {
        g.fillStyle = '#e6dcc4'
        g.fillRect(16 + i * 78, 104, 66, 44)
        g.fillStyle = ['#c8553d', '#3a8fd8', '#5aa469'][i]
        g.fillRect(16 + i * 78, 104, 66, 12)
      }
      g.fillStyle = '#8a8392'
      for (let i = 0; i < 3; i++) g.fillRect(16, 160 + i * 10, 130 - i * 24, 5)
    }),
  diagram: () =>
    tex(320, 200, (g, w, h) => {
      g.fillStyle = '#f7f7f2'
      g.fillRect(0, 0, w, h)
      g.strokeStyle = '#2d2a32'
      g.lineWidth = 3
      const box = (x, y, bw, bh, c) => {
        g.fillStyle = c
        g.beginPath()
        g.roundRect(x, y, bw, bh, 8)
        g.fill()
        g.stroke()
      }
      box(20, 70, 70, 50, '#ffd166')
      box(125, 20, 70, 50, '#9be7ff')
      box(125, 120, 70, 50, '#ff9ec7')
      box(230, 70, 70, 50, '#b8f2a0')
      g.beginPath()
      for (const [a, b, c, d] of [[90, 85, 125, 50], [90, 105, 125, 140], [195, 50, 230, 85], [195, 145, 230, 105]]) {
        g.moveTo(a, b)
        g.lineTo(c, d)
      }
      g.stroke()
      g.fillStyle = '#2d2a32'
      for (const [x, y] of [[40, 90], [145, 40], [145, 140], [250, 90]]) g.fillRect(x, y, 30, 5)
    }),
  kanban: () =>
    tex(320, 200, (g, w, h) => {
      g.fillStyle = '#2d3a5a'
      g.fillRect(0, 0, w, h)
      const cols = ['#ff9ec7', '#ffd166', '#9be7ff', '#b8f2a0']
      for (let c = 0; c < 3; c++) {
        g.fillStyle = 'rgba(255,255,255,.12)'
        g.fillRect(12 + c * 102, 12, 94, h - 24)
        for (let i = 0; i < 4 - c; i++) {
          g.fillStyle = cols[(c + i) % 4]
          g.fillRect(20 + c * 102, 24 + i * 40, 78, 30)
          g.fillStyle = 'rgba(0,0,0,.35)'
          g.fillRect(26 + c * 102, 34 + i * 40, 50, 4)
        }
      }
    }),
  diploma: (title) =>
    tex(256, 190, (g, w, h) => {
      g.fillStyle = '#f7efd9'
      g.fillRect(0, 0, w, h)
      g.strokeStyle = '#b08a3e'
      g.lineWidth = 6
      g.strokeRect(10, 10, w - 20, h - 20)
      g.lineWidth = 2
      g.strokeRect(20, 20, w - 40, h - 40)
      text(g, 'DIPLOMA', w / 2, 52, 24, '#7a5a1f')
      text(g, title, w / 2, 92, 15, '#2d2a32', '800')
      g.fillStyle = '#9a8a6a'
      g.fillRect(50, 114, w - 100, 4)
      g.fillRect(70, 126, w - 140, 4)
      g.fillStyle = '#c1121f'
      g.beginPath()
      g.arc(w - 52, h - 50, 20, 0, 7)
      g.fill()
      g.fillRect(w - 66, h - 36, 10, 24)
      g.fillRect(w - 50, h - 36, 10, 24)
    }),
  poster: (kind) =>
    tex(256, 340, (g, w, h) => {
      const sets = {
        pop: ['#6e5ce6', '#ffd166'],
        terror: ['#2a1038', '#ff6b6b'],
        comedia: ['#e08a2e', '#ffffff'],
        suspense: ['#1f2a44', '#9fb4d9'],
        acao: ['#d9480f', '#ffd166'],
      }
      const [bg, fg] = sets[kind]
      g.fillStyle = bg
      g.fillRect(0, 0, w, h)
      g.fillStyle = fg
      if (kind === 'pop') {
        g.beginPath()
        for (let i = 0; i < 24; i++) {
          const a = (i * Math.PI) / 12
          const r = i % 2 ? 60 : 110
          g.lineTo(w / 2 + Math.cos(a) * r, 140 + Math.sin(a) * r)
        }
        g.closePath()
        g.fill()
        text(g, 'POP!', w / 2, 140, 54, bg)
      } else if (kind === 'terror') {
        g.beginPath()
        g.arc(w / 2, 120, 70, 0, 7)
        g.fill()
        g.fillStyle = bg
        g.beginPath()
        g.arc(w / 2 + 28, 108, 62, 0, 7)
        g.fill()
        g.fillStyle = fg
        for (let i = 0; i < 7; i++) g.fillRect(20 + i * 34, 200 + ((i * 17) % 40), 8, 60)
      } else if (kind === 'suspense') {
        g.beginPath()
        g.ellipse(w / 2, 130, 90, 48, 0, 0, 7)
        g.fill()
        g.fillStyle = bg
        g.beginPath()
        g.arc(w / 2, 130, 30, 0, 7)
        g.fill()
      } else if (kind === 'acao') {
        g.beginPath()
        for (const [x, y] of [[150, 30], [80, 150], [125, 150], [100, 250], [190, 120], [145, 120], [180, 30]]) g.lineTo(x, y)
        g.closePath()
        g.fill()
      } else {
        for (const s of [-1, 1]) {
          g.beginPath()
          g.ellipse(w / 2 + s * 34, 120, 44, 56, 0, 0, 7)
          g.fill()
        }
        g.fillStyle = bg
        for (const s of [-1, 1]) {
          g.beginPath()
          g.ellipse(w / 2 + s * 48, 108, 8, 12, 0, 0, 7)
          g.fill()
        }
        g.lineWidth = 6
        g.strokeStyle = bg
        g.beginPath()
        g.arc(w / 2 - 34, 134, 22, 0.2, Math.PI - 0.2)
        g.stroke()
        g.beginPath()
        g.arc(w / 2 + 34, 150, 22, Math.PI + 0.2, -0.2)
        g.stroke()
      }
      text(g, kind === 'pop' ? 'CULTURA POP' : kind === 'terror' ? 'TERROR' : kind === 'suspense' ? 'SUSPENSE' : kind === 'acao' ? 'AÇÃO' : 'COMÉDIA', w / 2, 290, 24, fg)
    }),
  rug: (c1, c2) =>
    tex(256, 160, (g, w, h) => {
      g.fillStyle = c1
      g.fillRect(0, 0, w, h)
      g.strokeStyle = c2
      g.lineWidth = 8
      g.strokeRect(14, 14, w - 28, h - 28)
      g.lineWidth = 3
      g.strokeRect(30, 30, w - 60, h - 60)
      g.fillStyle = c2
      g.beginPath()
      g.moveTo(w / 2, 40)
      g.lineTo(w / 2 + 40, h / 2)
      g.lineTo(w / 2, h - 40)
      g.lineTo(w / 2 - 40, h / 2)
      g.closePath()
      g.fill()
    }),
}
