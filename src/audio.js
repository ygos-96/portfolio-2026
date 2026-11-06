// Gerador de efeitos sonoros procedurais leves via Web Audio API (zero dependências, zero arquivos MP3)

let ctx = null
let muted = false

function getCtx() {
  if (!ctx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (AudioCtx) ctx = new AudioCtx()
  }
  if (ctx && ctx.state === 'suspended') {
    ctx.resume()
  }
  return ctx
}

export const sound = {
  isMuted() {
    return muted
  },

  setMuted(m) {
    muted = m
  },

  toggleMute() {
    muted = !muted
    return muted
  },

  // Som suave de passo
  step() {
    if (muted) return
    const c = getCtx()
    if (!c) return
    try {
      const osc = c.createOscillator()
      const gain = c.createGain()
      const filter = c.createBiquadFilter()

      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(320, c.currentTime)

      osc.type = 'triangle'
      osc.frequency.setValueAtTime(90 + Math.random() * 30, c.currentTime)
      osc.frequency.exponentialRampToValueAtTime(40, c.currentTime + 0.08)

      gain.gain.setValueAtTime(0.08, c.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.08)

      osc.connect(filter)
      filter.connect(gain)
      gain.connect(c.destination)

      osc.start()
      osc.stop(c.currentTime + 0.09)
    } catch {
      /* ignora */
    }
  },

  // Som de pulo ("boing" alegre)
  jump() {
    if (muted) return
    const c = getCtx()
    if (!c) return
    try {
      const osc = c.createOscillator()
      const gain = c.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(220, c.currentTime)
      osc.frequency.exponentialRampToValueAtTime(480, c.currentTime + 0.16)

      gain.gain.setValueAtTime(0.12, c.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.18)

      osc.connect(gain)
      gain.connect(c.destination)

      osc.start()
      osc.stop(c.currentTime + 0.19)
    } catch {
      /* ignora */
    }
  },

  // Som de aterrissagem
  land() {
    if (muted) return
    const c = getCtx()
    if (!c) return
    try {
      const osc = c.createOscillator()
      const gain = c.createGain()

      osc.type = 'triangle'
      osc.frequency.setValueAtTime(110, c.currentTime)
      osc.frequency.exponentialRampToValueAtTime(35, c.currentTime + 0.12)

      gain.gain.setValueAtTime(0.1, c.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.12)

      osc.connect(gain)
      gain.connect(c.destination)

      osc.start()
      osc.stop(c.currentTime + 0.13)
    } catch {
      /* ignora */
    }
  },

  // Som de coleta de item (arpeggio cristalino estilo Zelda / Mario)
  collect() {
    if (muted) return
    const c = getCtx()
    if (!c) return
    try {
      const notes = [523.25, 659.25, 783.99, 1046.5] // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = c.createOscillator()
        const gain = c.createGain()

        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, c.currentTime + idx * 0.05)

        gain.gain.setValueAtTime(0, c.currentTime + idx * 0.05)
        gain.gain.linearRampToValueAtTime(0.14, c.currentTime + idx * 0.05 + 0.01)
        gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + idx * 0.05 + 0.22)

        osc.connect(gain)
        gain.connect(c.destination)

        osc.start(c.currentTime + idx * 0.05)
        osc.stop(c.currentTime + idx * 0.05 + 0.25)
      })
    } catch {
      /* ignora */
    }
  },

  // Fanfarra de todas as moedas coletadas
  fanfare() {
    if (muted) return
    const c = getCtx()
    if (!c) return
    try {
      const melody = [
        { f: 523.25, t: 0.0 }, // C5
        { f: 659.25, t: 0.12 }, // E5
        { f: 783.99, t: 0.24 }, // G5
        { f: 1046.5, t: 0.36 }, // C6
        { f: 880.0, t: 0.5 }, // A5
        { f: 1046.5, t: 0.65 }, // C6
        { f: 1318.51, t: 0.8 }, // E6
      ]
      melody.forEach(({ f, t }) => {
        const osc = c.createOscillator()
        const gain = c.createGain()

        osc.type = 'triangle'
        osc.frequency.setValueAtTime(f, c.currentTime + t)

        gain.gain.setValueAtTime(0.18, c.currentTime + t)
        gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + t + 0.35)

        osc.connect(gain)
        gain.connect(c.destination)

        osc.start(c.currentTime + t)
        osc.stop(c.currentTime + t + 0.4)
      })
    } catch {
      /* ignora */
    }
  },

  // Clique de menu / abas
  click() {
    if (muted) return
    const c = getCtx()
    if (!c) return
    try {
      const osc = c.createOscillator()
      const gain = c.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(800, c.currentTime)
      osc.frequency.exponentialRampToValueAtTime(400, c.currentTime + 0.04)

      gain.gain.setValueAtTime(0.08, c.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.04)

      osc.connect(gain)
      gain.connect(c.destination)

      osc.start()
      osc.stop(c.currentTime + 0.05)
    } catch {
      /* ignora */
    }
  },
}

