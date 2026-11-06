import './style.css'
import { CONTENT, LINKS, SECTION_ORDER } from './content.js'
import { PLACES, STREET_N, STREET_S, W as MAP_W, H as MAP_H } from './world.js'
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
let game = null
let pendingTeleport = null
const simpsonsClouds = $('#simpsons-clouds')
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
  placesMenu: $('#places-menu'),
  btnPlacesToggle: $('#btn-places-toggle'),
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
  toastTitle: $('#toast-title'),
  toastText: $('#toast-text'),
  skip: $('#skip'),
  introEyebrow: $('#intro-eyebrow'),
  hudTools: $('#hud-tools'),
  panelStep: $('#panel-step'),
  panelBuilding: $('#panel-building'),
  panelWho: $('#panel-who'),
  panelWhoRole: $('#panel-who-role'),
  panelMap: $('#panel-map'),
  panelMapCaption: $('#panel-map-caption'),
  panelAvailable: $('#panel-available'),
  panelTip: $('#panel-tip'),
}

let soundMuted = false
let weatherKey = 'day'
let weatherIsReal = false

const SECTION_FA_ICONS = {
  sobre: 'fa-solid fa-house',
  projetos: 'fa-solid fa-laptop-code',
  formacao: 'fa-solid fa-graduation-cap',
  skills: 'fa-solid fa-screwdriver-wrench',
  contato: 'fa-solid fa-envelope',
  estadio: 'fa-solid fa-futbol',
  palco: 'fa-solid fa-guitar',
  cinema: 'fa-solid fa-film',
  biblioteca: 'fa-solid fa-book-open',
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
  els.introEyebrow.textContent = t.ui.eyebrow
  els.skip.textContent = t.ui.skipMenu
  els.hudTools.setAttribute('aria-label', t.ui.tools)
  els.placesMenu.setAttribute('aria-label', t.ui.places)
  els.toastTitle.textContent = t.ui.achievementTitle
  els.toastText.textContent = t.ui.achievementText
  els.panelWho.textContent = t.hero.name
  els.panelWhoRole.textContent = t.hero.role
  els.panelMapCaption.textContent = t.ui.youAreHere
  els.panelAvailable.textContent = t.ui.available
  els.panelTip.innerHTML = t.ui.panelTip.replace('{esc}', '<kbd>Esc</kbd>').replace('{updown}', '<kbd>↑</kbd> <kbd>↓</kbd>')
  els.panelTabs.setAttribute('aria-label', t.ui.tabs)
  els.coffeeCounter.title = t.ui.coffeesHint
  els.coffeeCounter.setAttribute('aria-label', t.ui.coffees)
  document.getElementById('action-controls').setAttribute('aria-label', t.ui.actions)
  els.btnJump.title = els.btnJump.ariaLabel = t.ui.jump
  els.btnEmote.title = els.btnEmote.ariaLabel = t.ui.wave
  updateAudioButton()
  updateWeatherButton(weatherKey, weatherIsReal)
  if (els.btnPlacesToggle) {
    els.btnPlacesToggle.title = t.ui.places
    els.btnPlacesToggle.setAttribute('aria-label', t.ui.places)
  }
  els.nav.innerHTML = SECTION_ORDER.map(
    (k) => `<li><button type="button" data-open="${k}"><i class="${SECTION_FA_ICONS[k] || 'fa-solid fa-location-dot'}" aria-hidden="true"></i><span>${t.sections[k].label}</span></button></li>`,
  ).join('')
  els.fast.innerHTML = '<i class="fa-solid fa-bolt" aria-hidden="true"></i>'
  els.fast.href = fastHref()
  els.fast.title = `${t.ui.fast} — ${t.ui.fastHint}`
  els.fast.setAttribute('aria-label', t.ui.fast)
  els.lang.innerHTML = '<i class="fa-solid fa-language" aria-hidden="true"></i>'
  els.lang.title = t.ui.langOtherLabel
  els.lang.setAttribute('aria-label', t.ui.langOtherLabel)
  els.cv.innerHTML = '<i class="fa-solid fa-file-arrow-down" aria-hidden="true"></i>'
  els.cv.href = lang === 'pt' ? '/Ygor-Gomes-Curriculo.pdf' : '/Ygor-Gomes-Resume-EN.pdf'
  els.cv.title = t.ui.cvLabel
  els.cv.setAttribute('aria-label', t.ui.cvLabel)
  els.panelClose.setAttribute('aria-label', t.ui.close)
  els.panelClose.innerHTML = '<i class="fa-solid fa-xmark" aria-hidden="true"></i> <kbd class="panel__close-key">Esc</kbd>'
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

// ---------- painel ----------
const WORK_COUNT = 5 // as 5 primeiras seções são os prédios de trabalho; o resto é o lado de lazer

function contactQuick() {
  const u = c().ui
  const wa = `${LINKS.whatsapp}?text=${encodeURIComponent(u.waMessage)}`
  const mail = `mailto:${LINKS.email}?subject=${encodeURIComponent(u.mailSubject)}&body=${encodeURIComponent(u.mailBody)}`
  return `<section class="quick" aria-labelledby="quick-title">
    <h3 id="quick-title">${u.quickTitle}</h3>
    <div class="quick__row">
      <button type="button" class="quick__btn" data-copy="${LINKS.email}"><i class="fa-regular fa-copy" aria-hidden="true"></i><span>${u.copyEmail}</span></button>
      <a class="quick__btn quick__btn--wa" href="${wa}" target="_blank" rel="noopener noreferrer"><i class="fa-brands fa-whatsapp" aria-hidden="true"></i><span>WhatsApp</span></a>
      <a class="quick__btn" href="${mail}"><i class="fa-solid fa-envelope" aria-hidden="true"></i><span>${u.sayHi}</span></a>
    </div>
  </section>`
}

function renderMiniMap(key) {
  const dots = PLACES.map((b) => {
    const on = b.key === key
    const r = b.key === 'estadio' ? 4.2 : 3
    return `${on ? `<circle class="mm-pulse" cx="${b.cx}" cy="${b.cz}" r="${r}"/>` : ''}<circle class="mm-dot${on ? ' mm-dot--on' : ''}" data-map="${b.key}" cx="${b.cx}" cy="${b.cz}" r="${on ? r + 1 : r}"><title>${c().sections[b.key].label}</title></circle>`
  }).join('')
  els.panelMap.innerHTML = `<path class="mm-road" d="M0 ${STREET_N} H${MAP_W} M0 ${STREET_S} H${MAP_W}"/>${dots}`
}

function renderPanel(key) {
  const t = c()
  const i = SECTION_ORDER.indexOf(key)
  els.panelIcon.innerHTML = `<i class="${SECTION_FA_ICONS[key] || 'fa-solid fa-box-open'}" aria-hidden="true"></i>`
  els.panelTitle.textContent = t.sections[key].title
  els.panelStep.textContent = `${i + 1} / ${SECTION_ORDER.length}`
  els.panelBuilding.textContent = t.sections[key].building
  els.panelBody.innerHTML = (key === 'contato' ? contactQuick() : '') + sectionHtml(lang, key)
  els.panel.dataset.section = key
  els.panelTabs.innerHTML = SECTION_ORDER.map(
    (k, n) => `${n === WORK_COUNT ? '<div class="panel__sep" role="presentation"></div>' : ''}
      <button type="button" role="tab" id="tab-${k}" class="panel__tab ${k === key ? 'is-active' : ''}" data-tab="${k}" aria-selected="${k === key}" aria-controls="panel-body" tabindex="${k === key ? 0 : -1}">
        <span class="panel__tab-icon" aria-hidden="true"><i class="${SECTION_FA_ICONS[k] || 'fa-solid fa-box-open'}"></i></span>
        <span class="panel__tab-label">${t.sections[k].label}</span>
      </button>`,
  ).join('')
  els.panelBody.setAttribute('aria-labelledby', `tab-${key}`)
  els.panelTabs.querySelector('.is-active')?.scrollIntoView({ block: 'nearest', inline: 'center' })
  renderMiniMap(key)
}

// copiar e-mail (contato rápido) e clicar nos pontos do mini-mapa
els.panelBody.addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-copy]')
  if (!btn) return
  const label = btn.querySelector('span')
  try {
    await navigator.clipboard.writeText(btn.dataset.copy)
  } catch {
    return
  }
  sound.click()
  const prev = label.textContent
  label.textContent = c().ui.copied
  btn.classList.add('is-ok')
  setTimeout(() => {
    label.textContent = prev
    btn.classList.remove('is-ok')
  }, 1800)
})
els.panelMap.addEventListener('click', (e) => {
  const k = e.target.closest('[data-map]')?.dataset.map
  if (k) switchTab(k)
})

function switchTab(targetKey) {
  if (!targetKey || targetKey === openKey) return
  sound.click()
  openKey = targetKey
  renderPanel(targetKey)
  els.panelBody.scrollTop = 0
  if (location.hash !== `#${targetKey}`) history.replaceState(null, '', `#${targetKey}`)
  if (game) game.teleportTo(targetKey)
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
  els.panelTabs.querySelector('.is-active')?.focus({ preventScroll: true })
  if (location.hash !== `#${key}`) history.replaceState(null, '', `#${key}`)
}

if (els.panelTabs) {
  els.panelTabs.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-tab]')
    if (!btn) return
    switchTab(btn.dataset.tab)
  })
  // navegação por teclado (padrão WAI-ARIA tabs): setas, Home e End
  els.panelTabs.addEventListener('keydown', (e) => {
    const i = SECTION_ORDER.indexOf(openKey)
    let n = -1
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = (i + 1) % SECTION_ORDER.length
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = (i - 1 + SECTION_ORDER.length) % SECTION_ORDER.length
    else if (e.key === 'Home') n = 0
    else if (e.key === 'End') n = SECTION_ORDER.length - 1
    if (n < 0) return
    e.preventDefault()
    switchTab(SECTION_ORDER[n])
    els.panelTabs.querySelector('.is-active')?.focus()
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

// ---------- menu lateral de lugares ----------
function setPlacesOpen(open) {
  if (!els.nav || !els.btnPlacesToggle) return
  els.nav.hidden = !open
  els.btnPlacesToggle.setAttribute('aria-expanded', String(open))
  els.btnPlacesToggle.classList.toggle('is-open', open)
  els.btnPlacesToggle.innerHTML = `<i class="fa-solid ${open ? 'fa-xmark' : 'fa-map-location-dot'}" aria-hidden="true"></i>`
}

els.btnPlacesToggle?.addEventListener('click', (e) => {
  e.stopPropagation()
  sound.click()
  setPlacesOpen(els.nav.hidden)
})

document.addEventListener('click', (e) => {
  if (els.nav && !els.nav.hidden && !els.placesMenu?.contains(e.target)) {
    setPlacesOpen(false)
  }
})
els.placesMenu.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !els.nav.hidden) {
    e.stopPropagation()
    setPlacesOpen(false)
    els.btnPlacesToggle.focus()
  }
})

// atalhos
els.nav.addEventListener('click', (e) => {
  const b = e.target.closest('[data-open]')
  if (!b) return
  setPlacesOpen(false)
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
const WEATHER_FA_ICONS = {
  day: 'fa-solid fa-sun',
  sunset: 'fa-solid fa-cloud-sun',
  night: 'fa-solid fa-moon',
  rain: 'fa-solid fa-cloud-showers-heavy',
}
let currentWeatherIdx = 0
let initialWeather = 'day'

function updateWeatherButton(key, isReal = false) {
  if (!els.btnWeather) return
  weatherKey = key
  weatherIsReal = isReal
  const t = c().ui
  const iconClass = WEATHER_FA_ICONS[key] || WEATHER_FA_ICONS.day
  const name = t.weatherNames[key] || t.weatherNames.day
  const label = `${t.weather}: ${name}${isReal ? ` (${t.weatherReal})` : ''}`
  els.btnWeather.innerHTML = `<i class="${iconClass}" aria-hidden="true"></i>`
  els.btnWeather.title = label
  els.btnWeather.setAttribute('aria-label', label)
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

function updateAudioButton() {
  if (!els.btnAudio) return
  const label = soundMuted ? c().ui.soundOff : c().ui.soundOn
  els.btnAudio.innerHTML = `<i class="fa-solid ${soundMuted ? 'fa-volume-xmark' : 'fa-volume-high'}" aria-hidden="true"></i>`
  els.btnAudio.title = label
  els.btnAudio.setAttribute('aria-label', label)
  els.btnAudio.setAttribute('aria-pressed', String(soundMuted))
}

els.btnAudio?.addEventListener('click', () => {
  soundMuted = sound.toggleMute()
  updateAudioButton()
  if (!soundMuted) sound.click()
})

els.btnJump?.addEventListener('click', () => {
  game?.jump()
})

els.btnEmote?.addEventListener('click', () => {
  game?.emote('wave')
})

// ---------- jogo ----------
// O motor 3D (Three.js) carrega sob demanda: o resto da página abre sem esperar por ele.
// Garantia de segurança: remove a camada de neblina inicial após a animação mesmo se a rede atrasar
setTimeout(() => {
  simpsonsClouds?.classList.add('parted')
  setTimeout(() => {
    if (simpsonsClouds) simpsonsClouds.style.display = 'none'
  }, 2400)
}, 2800)

import('./game3d.js')
  .then(({ createGame }) => {
    game = createGame(els.canvas, {
      getLabels: labels,
      onNear: (key) => updatePrompt(key),
      onEnter: (key) => openPanel(key),
      onCollect: (collected, total) => {
        if (els.coffeeCounter) els.coffeeCounter.innerHTML = `<i class="fa-solid fa-mug-hot" aria-hidden="true"></i> <span>${collected}/${total}</span>`
        els.coffeeCounter?.classList.remove('is-bump')
        void els.coffeeCounter?.offsetWidth
        els.coffeeCounter?.classList.add('is-bump')
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

    // Efeito de zoom passando por dentro das nuvens/neblina e revelando a cidade gradualmente
    requestAnimationFrame(() => {
      simpsonsClouds?.classList.add('parted')
      setTimeout(() => {
        if (simpsonsClouds) simpsonsClouds.style.display = 'none'
      }, 2600)
    })
  })
  .catch((err) => {
    console.error('Erro ao inicializar Three.js / game3d:', err)
    if (simpsonsClouds) simpsonsClouds.style.display = 'none'
    els.intro.classList.add('intro--nogl')
  })

function startGame() {
  started = true
  els.intro.hidden = true
  document.body.classList.add('playing')
  sound.click()
  game?.skipIntroFly?.()
  if (!openKey) game?.setPaused(false)
  game?.emote?.('wave')
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
