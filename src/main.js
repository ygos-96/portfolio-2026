import './style.css'
import { CONTENT, SECTION_ORDER } from './content.js'
import { sectionHtml } from './render.js'
import { sound } from './audio.js'
import { detectRealWeather, WEATHER_PRESETS } from './weather.js'

const $ = (s) => document.querySelector(s)
const store = {
  get: (k) => {
    try {
      return localStorage.getItem(k)
    } catch {
      return null
    }
  },
  set: (k, v) => {
    try {
      localStorage.setItem(k, v)
    } catch {
      /* ignora */
    }
  },
}

function pickLang() {
  const q = new URLSearchParams(location.search).get('lang')
  if (q === 'en' || q === 'pt') return q
  const s = store.get('lang')
  if (s === 'en' || s === 'pt') return s
  return (navigator.language || 'pt').toLowerCase().startsWith('en') ? 'en' : 'pt'
}

let lang = pickLang()
let started = false
let openKey = null
let lastFocus = null
const isTouch = matchMedia('(pointer: coarse)').matches
document.body.classList.toggle('touch', isTouch)

const els = {
  canvas: $('#game'),
  intro: $('#intro'),
  introTitle: $('#intro-title'),
  introRole: $('#intro-role'),
  introHint: $('#intro-hint'),
  introKeys: $('#intro-keys'),
  start: $('#start'),
  introFast: $('#intro-fast'),
  hudName: $('#hud-name'),
  hudRole: $('#hud-role'),
  nav: $('#shortcuts'),
  fast: $('#fast'),
  lang: $('#lang'),
  cv: $('#cv'),
  prompt: $('#prompt'),
  stickZone: $('#stick'),
  stickKnob: $('#stick-knob'),
  panel: $('#panel'),
  panelBox: $('#panel-box'),
  panelTitle: $('#panel-title'),
  panelIcon: $('#panel-icon'),
  panelTabs: $('#panel-tabs'),
  panelBody: $('#panel-body'),
  panelClose: $('#panel-close'),
  btnWeather: $('#btn-weather'),
  btnAudio: $('#btn-audio'),
  coffeeCounter: $('#coffee-counter'),
  btnJump: $('#btn-jump'),
  btnEmote: $('#btn-emote'),
  actionControls: $('#action-controls'),
  toastAchievement: $('#toast-achievement'),
}

const c = () => CONTENT[lang]
const fastHref = () => (lang === 'pt' ? '/rapido/' : '/en/rapido/')

function setMeta(sel, attr, val) {
  const el = document.querySelector(sel)
  if (el) el.setAttribute(attr, val)
}

function applyLang() {
  const t = c()
  document.documentElement.lang = t.htmlLang
  document.title = t.meta.title
  setMeta('meta[name="description"]', 'content', t.meta.description)
  setMeta('meta[property="og:title"]', 'content', t.meta.title)
  setMeta('meta[property="og:description"]', 'content', t.meta.description)
  els.canvas.setAttribute('aria-label', t.ui.mapLabel)
  els.introTitle.textContent = t.hero.name
  els.introRole.textContent = t.hero.role
  els.introHint.textContent = t.ui.introHint
  els.introKeys.textContent = isTouch ? t.ui.touch : t.ui.keys
  els.start.textContent = t.ui.start
  els.introFast.textContent = `${t.ui.fast} →`
  els.introFast.href = fastHref()
  els.hudName.textContent = t.hero.name
  els.hudRole.textContent = t.hero.role
  els.nav.setAttribute('aria-label', t.ui.shortcuts)
  els.nav.innerHTML = SECTION_ORDER.map((k) => `<button type="button" data-open="${k}">${t.sections[k].label}</button>`).join('')
  els.fast.textContent = t.ui.fast
  els.fast.href = fastHref()
  els.fast.title = t.ui.fastHint
  els.lang.textContent = t.ui.langOther
  els.lang.setAttribute('aria-label', t.ui.langOtherLabel)
  els.cv.textContent = 'CV'
  els.cv.href = lang === 'pt' ? '/Ygor-Gomes-Curriculo.pdf' : '/Ygor-Gomes-Resume-EN.pdf'
  els.cv.title = t.ui.cvLabel
  els.panelClose.setAttribute('aria-label', t.ui.close)
  els.panelClose.textContent = '✕'
  els.stickZone.setAttribute('aria-hidden', 'true')
  updatePrompt(game?.getNear()?.key ?? null)
  if (openKey) renderPanel(openKey)
}

function labels() {
  const out = {}
  for (const k of SECTION_ORDER) out[k] = c().sections[k].label
  return out
}

// ---------- prompt de entrada ----------
let promptKey = null
function updatePrompt(key) {
  promptKey = key
  if (!key || openKey || !started) {
    els.prompt.hidden = true
    return
  }
  const t = c()
  els.prompt.hidden = false
  els.prompt.innerHTML = `${isTouch ? '' : '<kbd>Enter</kbd>'}<span>${t.ui.enterIn} ${t.sections[key].label}</span>`
}
els.prompt.addEventListener('click', () => promptKey && openPanel(promptKey))

const SECTION_ICONS = {
  sobre: '🏠',
  projetos: '⚙️',
  formacao: '📚',
  skills: '🛠️',
  contato: '✉️',
  estadio: '⚽',
  palco: '🎸',
  cinema: '🎬',
  biblioteca: '📖',
}

// ---------- painel ----------
function renderPanel(key) {
  const t = c()
  if (els.panelIcon) els.panelIcon.textContent = SECTION_ICONS[key] || '📦'
  els.panelTitle.textContent = t.sections[key].title
  els.panelBody.innerHTML = sectionHtml(lang, key)
  els.panel.dataset.section = key

  if (els.panelTabs) {
    els.panelTabs.innerHTML = SECTION_ORDER.map(
      (k) => `
      <button type="button" class="panel__tab ${k === key ? 'is-active' : ''}" data-tab="${k}">
        <span class="panel__tab-icon" aria-hidden="true">${SECTION_ICONS[k] || '📦'}</span>
        <span class="panel__tab-label">${t.sections[k].label}</span>
      </button>`,
    ).join('')
  }
}

function openPanel(key) {
  if (!SECTION_ORDER.includes(key)) return
  sound.click()
  lastFocus = document.activeElement
  openKey = key
  renderPanel(key)
  els.panel.hidden = false
  document.body.classList.add('modal-open')
  els.panelBody.scrollTop = 0
  game?.setPaused(true)
  updatePrompt(null)
  els.panelClose.focus()
  if (location.hash !== `#${key}`) history.replaceState(null, '', `#${key}`)
}

if (els.panelTabs) {
  els.panelTabs.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-tab]')
    if (!btn) return
    const targetKey = btn.dataset.tab
    if (targetKey && targetKey !== openKey) {
      sound.click()
      openKey = targetKey
      renderPanel(targetKey)
      els.panelBody.scrollTop = 0
      if (location.hash !== `#${targetKey}`) history.replaceState(null, '', `#${targetKey}`)
      if (game) game.teleportTo(targetKey)
    }
  })
}

function closePanel() {
  if (!openKey) return
  sound.click()
  openKey = null
  els.panel.hidden = true
  document.body.classList.remove('modal-open')
  if (started) game?.setPaused(false)
  history.replaceState(null, '', location.pathname + location.search)
  updatePrompt(game?.getNear()?.key ?? null)
  if (lastFocus && document.contains(lastFocus)) lastFocus.focus()
}

els.panelClose.addEventListener('click', closePanel)
els.panel.addEventListener('click', (e) => {
  if (e.target === els.panel) closePanel()
})
document.addEventListener('keydown', (e) => {
  if (!openKey) return
  if (e.key === 'Escape') {
    e.preventDefault()
    closePanel()
    return
  }
  if (e.key === 'Tab') {
    const f = [...els.panelBox.querySelectorAll('a[href], button:not([disabled])')].filter((n) => n.offsetParent !== null)
    if (!f.length) return
    const first = f[0]
    const last = f[f.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }
})

// atalhos
els.nav.addEventListener('click', (e) => {
  const b = e.target.closest('[data-open]')
  if (!b) return
  if (!started) startGame()
  if (game) game.teleportTo(b.dataset.open)
  else pendingTeleport = b.dataset.open
  openPanel(b.dataset.open)
})

// ---------- idioma ----------
els.lang.addEventListener('click', () => {
  lang = lang === 'pt' ? 'en' : 'pt'
  store.set('lang', lang)
  applyLang()
})

// ---------- joystick ----------
if (isTouch) {
  const R = 44
  let id = null
  let origin = null
  const move = (e) => {
    const dx = e.clientX - origin.x
    const dy = e.clientY - origin.y
    const len = Math.hypot(dx, dy) || 1
    const k = Math.min(len, R) / R
    const nx = (dx / len) * k
    const ny = (dy / len) * k
    els.stickKnob.style.transform = `translate(${nx * R}px, ${ny * R}px)`
    game?.setStick(k < 0.18 ? 0 : nx, k < 0.18 ? 0 : ny)
  }
  const end = () => {
    id = null
    els.stickKnob.style.transform = 'translate(0,0)'
    game?.setStick(0, 0)
  }
  els.stickZone.addEventListener('pointerdown', (e) => {
    if (id !== null) return
    id = e.pointerId
    els.stickZone.setPointerCapture(id)
    const r = els.stickZone.getBoundingClientRect()
    origin = { x: r.left + r.width / 2, y: r.top + r.height / 2 }
    move(e)
  })
  els.stickZone.addEventListener('pointermove', (e) => e.pointerId === id && move(e))
  els.stickZone.addEventListener('pointerup', (e) => e.pointerId === id && end())
  els.stickZone.addEventListener('pointercancel', end)
}

// ---------- clima e som ----------
const weatherOrder = ['day', 'sunset', 'night', 'rain']
let currentWeatherIdx = 0
let initialWeather = 'day'

function updateWeatherButton(key, isReal = false) {
  if (!els.btnWeather) return
  const p = WEATHER_PRESETS[key] || WEATHER_PRESETS.day
  els.btnWeather.textContent = `${p.label}${isReal ? ' (Real)' : ''}`
}

detectRealWeather((presetKey, isApiResult) => {
  initialWeather = presetKey
  currentWeatherIdx = weatherOrder.indexOf(presetKey)
  if (currentWeatherIdx === -1) currentWeatherIdx = 0
  if (game) game.setWeather(presetKey)
  updateWeatherButton(presetKey, isApiResult)
})

els.btnWeather?.addEventListener('click', () => {
  sound.click()
  currentWeatherIdx = (currentWeatherIdx + 1) % weatherOrder.length
  const nextKey = weatherOrder[currentWeatherIdx]
  game?.setWeather(nextKey)
  updateWeatherButton(nextKey, false)
})

els.btnAudio?.addEventListener('click', () => {
  const isMuted = sound.toggleMute()
  els.btnAudio.textContent = isMuted ? '🔇 Mudo' : '🔊 Som'
  if (!isMuted) sound.click()
})

els.btnJump?.addEventListener('click', () => {
  game?.jump()
})

els.btnEmote?.addEventListener('click', () => {
  game?.emote('wave')
})

// ---------- jogo ----------
// O motor 3D (Three.js) carrega sob demanda: o resto da página abre sem esperar por ele.
let game = null
let pendingTeleport = null
import('./game3d.js')
  .then(({ createGame }) => {
    game = createGame(els.canvas, {
      getLabels: labels,
      onNear: (key) => updatePrompt(key),
      onEnter: (key) => openPanel(key),
      onCollect: (collected, total) => {
        if (els.coffeeCounter) els.coffeeCounter.textContent = `☕ ${collected}/${total}`
      },
      onAllCollected: () => {
        if (els.toastAchievement) {
          els.toastAchievement.hidden = false
          setTimeout(() => {
            els.toastAchievement.hidden = true
          }, 6000)
        }
      },
    })
    game.setWeather(initialWeather)
    if (pendingTeleport) game.teleportTo(pendingTeleport)
    if (started && !openKey) game.setPaused(false)
    updatePrompt(game.getNear()?.key ?? null)
  })
  .catch(() => {
    // sem WebGL/rede: o modo rápido continua disponível
    els.intro.classList.add('intro--nogl')
  })

function startGame() {
  started = true
  els.intro.hidden = true
  document.body.classList.add('playing')
  if (!openKey) game?.setPaused(false)
  updatePrompt(game?.getNear()?.key ?? null)
}
els.start.addEventListener('click', () => {
  startGame()
  els.canvas.focus()
})
window.addEventListener('keydown', (e) => {
  if (started || e.metaKey || e.ctrlKey || e.altKey) return
  if (e.target instanceof HTMLElement && e.target.closest('a, button')) return
  if (['Tab', 'Shift', 'Escape'].includes(e.key)) return
  startGame()
})

applyLang()

// links diretos: /#projetos
const fromHash = location.hash.slice(1)
if (SECTION_ORDER.includes(fromHash)) {
  startGame()
  pendingTeleport = fromHash
  game?.teleportTo(fromHash)
  openPanel(fromHash)
} else {
  els.start.focus({ preventScroll: true })
}
window.addEventListener('hashchange', () => {
  const k = location.hash.slice(1)
  if (SECTION_ORDER.includes(k) && openKey !== k) {
    if (!started) startGame()
    openPanel(k)
  }
})
