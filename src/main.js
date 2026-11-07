import './style.css'
import { ARTISTS, CONTENT, LINKS, SECTION_ORDER, SPOTIFY } from './content.js'
import { esc, sectionHtml } from './render.js'
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
  panelPrev: $('#panel-prev'),
  panelNext: $('#panel-next'),
  panelDots: $('#panel-dots'),
  panelAll: $('#panel-all'),
  panelBody: $('#panel-body'),
  panelClose: $('#panel-close'),
  btnWeather: $('#btn-weather'),
  btnAudio: $('#btn-audio'),
  btnMusic: $('#btn-music'),
  jukebox: $('#jukebox'),
  jukeboxEmbed: $('#jukebox-embed'),
  jukeboxTitle: $('#jukebox-title'),
  jukeboxClose: $('#jukebox-close'),
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
  panelTip: $('#panel-tip'),
}

const reduceMotionPref = matchMedia('(prefers-reduced-motion: reduce)').matches
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
  els.panelTip.innerHTML = t.ui.panelTip.replace('{esc}', '<kbd>Esc</kbd>').replace('{lr}', '<kbd>←</kbd> <kbd>→</kbd>')
  els.coffeeCounter.title = t.ui.coffeesHint
  els.coffeeCounter.setAttribute('aria-label', t.ui.coffees)
  document.getElementById('action-controls').setAttribute('aria-label', t.ui.actions)
  els.btnJump.title = els.btnJump.ariaLabel = t.ui.jump
  els.btnEmote.title = els.btnEmote.ariaLabel = t.ui.wave
  updateAudioButton()
  updateWeatherButton(weatherKey, weatherIsReal)
  refreshMusicUi()
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

// ---------- prédios por dentro ----------
let roomKey = null // prédio em que estamos (null = no mapa)
let sliceId = null // assunto aberto na ficha (null = seção inteira)
let transitioning = false
let roomHs = null // hotspot em que o jogador está parado

const wait = (ms) => new Promise((r) => setTimeout(r, reduceMotionPref ? 0 : ms))
const fadeEl = $('#fade')
async function fade(on) {
  fadeEl.classList.toggle('is-on', on)
  await wait(430)
}

async function enterBuilding(key) {
  // o palco fica ao ar livre: abre direto o painel com as playlists
  if (key === 'palco') {
    if (!transitioning && !roomKey) openPanel(key)
    return
  }
  if (transitioning || roomKey || !game || !SECTION_ORDER.includes(key)) return
  transitioning = true
  game.setPaused(true)
  updatePrompt(null)
  sound.click()
  await fade(true)
  try {
    game.enterRoom(key)
    roomKey = key
    roomHs = null
    document.body.classList.add('in-room')
    updateRoomPrompt(null)
  } catch (err) {
    console.error('Erro ao montar a sala:', err)
  }
  await wait(160)
  await fade(false)
  game.setPaused(false)
  transitioning = false
}

async function leaveBuilding() {
  if (transitioning || !roomKey) return
  transitioning = true
  game.setPaused(true)
  sound.click()
  if (openKey) closePanel()
  await fade(true)
  game.exitRoom()
  roomKey = null
  roomHs = null
  document.body.classList.remove('in-room')
  els.prompt.hidden = true
  await wait(160)
  await fade(false)
  game.setPaused(false)
  transitioning = false
  updatePrompt(game.getNear()?.key ?? null)
}

// cada hotspot da sala mostra um pedaço do conteúdo da seção (o texto continua num lugar só: render.js)
const sliceCache = new Map()
function roomSlices(key) {
  const ck = `${lang}:${key}`
  if (sliceCache.has(ck)) return sliceCache.get(ck)
  const tmp = document.createElement('div')
  tmp.innerHTML = (key === 'contato' ? contactQuick() : '') + sectionHtml(lang, key)
  const list = []
  for (const hs of game.getRoomHotspots()) {
    const nodes = hs.pick.flatMap((sel) => [...tmp.querySelectorAll(sel)])
    if (!nodes.length) continue
    const first = nodes[0]
    const head = first.matches('h3, h4') ? first : first.querySelector('h3, h4, strong')
    list.push({ id: hs.id, title: head?.textContent.trim() || c().sections[key].title, html: nodes.map((n) => n.outerHTML).join('') })
  }
  sliceCache.set(ck, list)
  return list
}

// ---------- prompt de entrada ----------
let promptKey = null
function updatePrompt(key) {
  promptKey = key
  if (roomKey) return updateRoomPrompt(roomHs)
  if (!key || openKey || !started) {
    els.prompt.hidden = true
    return
  }
  const t = c()
  els.prompt.hidden = false
  els.prompt.innerHTML = `${isTouch ? '' : '<kbd>Enter</kbd>'}<span>${key === 'palco' ? t.ui.playMusic : `${t.ui.enterIn} ${t.sections[key].label}`}</span>`
}
function updateRoomPrompt(hs) {
  roomHs = hs
  if (!hs || openKey || !roomKey || transitioning) {
    els.prompt.hidden = true
    return
  }
  const u = c().ui
  const label = hs.kind === 'exit' ? u.leave : `${u.view} ${roomSlices(roomKey).find((s) => s.id === hs.id)?.title ?? ''}`
  els.prompt.hidden = false
  els.prompt.innerHTML = `${isTouch ? '' : '<kbd>Enter</kbd>'}<span>${label}</span>`
}
function openRoomHotspot(hs) {
  if (!hs) return
  if (hs.kind === 'exit') leaveBuilding()
  else openSlice(hs.id)
}
els.prompt.addEventListener('click', () => {
  if (roomKey) openRoomHotspot(roomHs)
  else if (promptKey) enterBuilding(promptKey)
})

// ---------- música (Spotify) ----------
// O player fica num dock fixo, fora do painel: a música continua tocando enquanto você anda pelo mapa
// e o palco entra em modo show (fogos, luzes e confete) enquanto estiver tocando.
const spotify = { api: null, ctrl: null, id: null, playing: false, loading: null, uri: null, lastPos: 0, wasPaused: true, finale: false }
const SHOW_START_S = 4 // efeitos no começo da música
const SHOW_END_S = 10 // efeitos nos últimos segundos (finale)

function loadSpotifyApi() {
  if (spotify.loading) return spotify.loading
  spotify.loading = new Promise((resolve, reject) => {
    window.onSpotifyIframeApiReady = (api) => {
      spotify.api = api
      resolve(api)
    }
    const sc = document.createElement('script')
    sc.src = 'https://open.spotify.com/embed/iframe-api/v1'
    sc.async = true
    sc.onerror = () => {
      spotify.loading = null
      reject(new Error('spotify'))
    }
    document.head.appendChild(sc)
  })
  return spotify.loading
}

// o Spotify avisa a posição e a duração da faixa: daí saem o começo e o fim da música
function onPlayback(d) {
  const playing = !d.isPaused
  const pos = d.position || 0
  const dur = d.duration || 0
  const newTrack = d.playingURI !== spotify.uri || pos + 1500 < spotify.lastPos
  if (newTrack) spotify.finale = false
  spotify.playing = playing
  if (playing && (newTrack || (spotify.wasPaused && pos < 2500))) game?.showBurst('start', SHOW_START_S)
  if (playing && dur > 0 && dur - pos <= SHOW_END_S * 1000 && !spotify.finale) {
    spotify.finale = true
    game?.showBurst('end', Math.min(SHOW_END_S, (dur - pos) / 1000 + 1))
  }
  spotify.uri = d.playingURI
  spotify.lastPos = pos
  spotify.wasPaused = !playing
  refreshMusicUi()
}

function refreshMusicUi() {
  const u = c().ui
  game?.setMusic(spotify.playing)
  document.body.classList.toggle('music-on', spotify.playing)
  els.btnMusic.hidden = !spotify.id
  els.btnMusic.setAttribute('aria-pressed', String(spotify.playing))
  els.btnMusic.title = spotify.playing ? u.musicPause : u.musicResume
  els.btnMusic.setAttribute('aria-label', els.btnMusic.title)
  els.jukeboxTitle.textContent = u.nowPlaying
  els.jukeboxClose.setAttribute('aria-label', u.hidePlayer)
  els.panelBody.querySelectorAll('[data-play]').forEach((b) => b.setAttribute('aria-pressed', String(spotify.playing && spotify.id === b.dataset.play)))
}

async function playPlaylist(id) {
  if (spotify.ctrl && spotify.id === id) {
    spotify.ctrl.togglePlay()
    return
  }
  const wasPlaying = spotify.playing
  spotify.id = id
  els.jukebox.classList.add('is-on')
  refreshMusicUi()
  try {
    const api = await loadSpotifyApi()
    const uri = `spotify:playlist:${id}`
    if (!spotify.ctrl) {
      await new Promise((resolve) =>
        api.createController(els.jukeboxEmbed, { uri, width: '100%', height: 152 }, (ctrl) => {
          spotify.ctrl = ctrl
          ctrl.addListener('playback_update', (e) => onPlayback(e.data))
          resolve()
        }),
      )
      spotify.ctrl.play()
    } else {
      spotify.ctrl.loadUri(uri)
      setTimeout(() => spotify.ctrl.play(), 500)
    }
    // na primeira vez, fecha o painel para você ver o show no mapa
    if (!wasPlaying && openKey === 'palco' && !roomKey) setTimeout(() => closePanel(), 900)
  } catch {
    // sem acesso ao Spotify: abre a playlist numa aba nova
    spotify.id = null
    els.jukebox.classList.remove('is-on')
    refreshMusicUi()
    window.open(`https://open.spotify.com/playlist/${id}`, '_blank', 'noopener,noreferrer')
  }
}

function palcoHtml() {
  const t = c().palco
  return `<p class="lead">${esc(t.intro)}</p>
    <h3>${esc(t.playlistsTitle)}</h3>
    <ul class="jukebox-list">${SPOTIFY.map(
      (p) => `<li><button type="button" class="jb" data-play="${esc(p.id)}" aria-pressed="${spotify.playing && spotify.id === p.id}">
        <span class="jb__icon" aria-hidden="true"><i class="fa-solid fa-play"></i><i class="fa-solid fa-pause"></i></span>
        <span class="jb__name">${esc(p.name)}</span>
        <span class="eq" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
      </button></li>`,
    ).join('')}</ul>
    <p class="note">${esc(c().ui.jukeboxHint)}</p>
    <h3>${esc(t.artistsTitle)}</h3>
    <ul class="chips">${ARTISTS.map((a) => `<li>${esc(a)}</li>`).join('')}</ul>`
}

els.panelBody.addEventListener('click', (e) => {
  const b = e.target.closest('[data-play]')
  if (b) playPlaylist(b.dataset.play)
})
els.btnMusic.addEventListener('click', () => spotify.ctrl?.togglePlay())
// o iframe do Spotify rouba o foco do teclado; sem isso WASD e Esc deixam de funcionar no jogo
window.addEventListener('blur', () =>
  setTimeout(() => {
    if (document.activeElement?.tagName === 'IFRAME' && !openKey) els.canvas.focus()
  }, 0),
)
els.jukeboxClose.addEventListener('click', () => els.jukebox.classList.remove('is-on'))

// ---------- painel / ficha ----------
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

function renderPanel(key) {
  const t = c()
  els.panel.dataset.section = key
  els.panelIcon.innerHTML = `<i class="${SECTION_FA_ICONS[key] || 'fa-solid fa-box-open'}" aria-hidden="true"></i>`
  let total
  let pos
  if (sliceId && roomKey) {
    const list = roomSlices(key)
    pos = Math.max(0, list.findIndex((s) => s.id === sliceId))
    total = list.length
    els.panelTitle.textContent = list[pos].title
    els.panelBody.innerHTML = `<div class="slice">${list[pos].html}</div>`
  } else {
    pos = SECTION_ORDER.indexOf(key)
    total = SECTION_ORDER.length
    els.panelTitle.textContent = t.sections[key].title
    els.panelBody.innerHTML = (key === 'contato' ? contactQuick() : '') + (key === 'palco' ? palcoHtml() : sectionHtml(lang, key))
  }
  els.panelStep.textContent = `${pos + 1} / ${total}`
  els.panelBuilding.textContent = t.sections[key].building
  els.panelDots.innerHTML = Array.from({ length: total }, (_, i) => `<i class="${i === pos ? 'on' : ''}"></i>`).join('')
  els.panelAll.hidden = !sliceId
  els.panelAll.textContent = t.ui.seeAll
  els.panelPrev.setAttribute('aria-label', t.ui.prev)
  els.panelNext.setAttribute('aria-label', t.ui.next)
  els.panelBody.removeAttribute('aria-labelledby')
}

// copiar e-mail (contato rápido)
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

// setas: dentro da sala percorrem os assuntos; fora dela, as seções
function step(dir) {
  if (!openKey) return
  sound.click()
  if (sliceId && roomKey) {
    const list = roomSlices(roomKey)
    const i = list.findIndex((s) => s.id === sliceId)
    sliceId = list[(i + dir + list.length) % list.length].id
    game.teleportInRoom(sliceId)
    renderPanel(roomKey)
  } else {
    const k = SECTION_ORDER[(SECTION_ORDER.indexOf(openKey) + dir + SECTION_ORDER.length) % SECTION_ORDER.length]
    openKey = k
    renderPanel(k)
    if (location.hash !== `#${k}`) history.replaceState(null, '', `#${k}`)
    if (!roomKey) game?.teleportTo(k)
  }
  els.panelBody.scrollTop = 0
}
els.panelPrev.addEventListener('click', () => step(-1))
els.panelNext.addEventListener('click', () => step(1))
els.panelAll.addEventListener('click', () => {
  sliceId = null
  sound.click()
  renderPanel(openKey)
  els.panelBody.scrollTop = 0
})

function showPanel() {
  els.panel.hidden = false
  document.body.classList.add('modal-open')
  els.panelBody.scrollTop = 0
  game?.setPaused(true)
  updatePrompt(null)
  els.panelClose.focus({ preventScroll: true })
}

function openPanel(key) {
  if (!SECTION_ORDER.includes(key)) return
  sound.click()
  lastFocus = document.activeElement
  openKey = key
  sliceId = null
  renderPanel(key)
  showPanel()
  if (location.hash !== `#${key}`) history.replaceState(null, '', `#${key}`)
}

function openSlice(id) {
  if (!roomKey || !roomSlices(roomKey).some((s) => s.id === id)) return
  sound.click()
  lastFocus = document.activeElement
  openKey = roomKey
  sliceId = id
  renderPanel(roomKey)
  showPanel()
}

function closePanel() {
  if (!openKey) return
  sound.click()
  openKey = null
  sliceId = null
  els.panel.hidden = true
  document.body.classList.remove('modal-open')
  if (started && !transitioning) game?.setPaused(false)
  if (location.hash) history.replaceState(null, '', location.pathname + location.search)
  updatePrompt(game?.getNear()?.key ?? null)
  if (lastFocus && document.contains(lastFocus)) lastFocus.focus()
}

els.panelClose.addEventListener('click', closePanel)
els.panel.addEventListener('click', (e) => {
  if (e.target === els.panel) closePanel()
})
document.addEventListener('keydown', (e) => {
  if (!openKey) {
    if (e.key === 'Escape' && roomKey && !transitioning) leaveBuilding()
    return
  }
  if (e.key === 'Escape') {
    e.preventDefault()
    closePanel()
    return
  }
  if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
    if (e.target.closest('input, textarea, iframe')) return
    e.preventDefault()
    step(e.key === 'ArrowRight' ? 1 : -1)
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
els.nav.addEventListener('click', async (e) => {
  const b = e.target.closest('[data-open]')
  if (!b) return
  setPlacesOpen(false)
  if (!started) startGame()
  const key = b.dataset.open
  if (!game) {
    pendingTeleport = key
    openPanel(key)
    return
  }
  if (roomKey === key) return
  if (roomKey) await leaveBuilding()
  game.teleportTo(key)
  enterBuilding(key)
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
      onEnter: (key) => enterBuilding(key),
      onRoomNear: (hs) => updateRoomPrompt(hs),
      onRoomOpen: (hs) => openRoomHotspot(hs),
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
