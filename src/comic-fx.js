// Efeitos da página em HQ. Sem JS a página continua completa: tudo aqui é só reforço.
const root = document.documentElement
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

// 1) revelação dos quadros ao rolar
const pops = document.querySelectorAll('[data-pop]')
if ('IntersectionObserver' in window && !reduce) {
  root.classList.add('fx')
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue
        e.target.classList.add('in')
        io.unobserve(e.target)
        const n = e.target.querySelector('[data-count]')
        if (n) countUp(n)
      }
    },
    { threshold: 0.15, rootMargin: '0px 0px -6% 0px' },
  )
  pops.forEach((el, i) => {
    el.style.setProperty('--rot', `${i % 2 ? 1.2 : -1.2}deg`)
    io.observe(el)
  })
}

// 2) contador dos números da capa
function countUp(el) {
  const target = Number(el.dataset.count)
  const plus = el.textContent.trim().startsWith('+') ? '+' : ''
  const fmt = new Intl.NumberFormat(root.lang || 'pt-BR')
  const t0 = performance.now()
  const dur = 1100
  const tick = (now) => {
    const p = Math.min(1, (now - t0) / dur)
    const eased = 1 - Math.pow(1 - p, 3)
    el.textContent = plus + fmt.format(Math.round(target * eased))
    if (p < 1) requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}

// 3) barra de leitura e botão fixo (aparece depois da capa, some no contato)
const bar = document.querySelector('.progress i')
const cta = document.querySelector('.sticky-cta')
const cover = document.querySelector('.cover')
const contact = document.querySelector('#contato')
let ticking = false
function onScroll() {
  ticking = false
  const max = document.documentElement.scrollHeight - innerHeight
  if (bar && max > 0) bar.style.width = `${Math.min(100, (scrollY / max) * 100)}%`
  if (cta && cover && contact) {
    const past = cover.getBoundingClientRect().bottom < innerHeight * 0.25
    const atEnd = contact.getBoundingClientRect().top < innerHeight * 0.6
    const show = past && !atEnd
    cta.classList.toggle('on', show)
    cta.toggleAttribute('aria-hidden', !show)
    cta.tabIndex = show ? 0 : -1
  }
}
addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll) } }, { passive: true })
addEventListener('resize', onScroll)
onScroll()

// 4) clique em um quadro solta uma onomatopeia
if (!reduce) {
  const words = ['POW!', 'BAM!', 'ZAP!', 'BOOM!', 'WHAM!']
  document.addEventListener('click', (e) => {
    if (e.target.closest('a, button')) return
    if (!e.target.closest('.stat, .caption, .focus, .mission, .frame, .power, .final__panel')) return
    const w = document.createElement('span')
    w.className = 'fx-word'
    w.textContent = words[Math.floor(Math.random() * words.length)]
    w.style.left = `${e.clientX}px`
    w.style.top = `${e.clientY}px`
    document.body.append(w)
    setTimeout(() => w.remove(), 800)
  })
}
