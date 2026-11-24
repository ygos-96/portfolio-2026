// Funções puras que geram HTML (usadas no navegador e no gerador das páginas estáticas).
import { DOC_UI, DOCS } from './projectdocs.js'
import { ARTISTS, BOOKS, CONTENT, IDOLS, LINKS, MOVIE_GROUPS, PROJECT_BASE, SECTION_ORDER, SITE_URL, SPOTIFY, TITLE_NAMES, TROPHIES } from './content.js'

export const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])


// Bonequinho cabeçudo em 8-bit (grade 16x18, desenhada em SVG sem suavização).
const SPRITE = [
  '....HHHHHHHH....',
  '...HHHHHHHHHH...',
  '..HHHHHHHHHHHH..',
  '..HSSSSSSSSSSH..',
  '..SSSSSSSSSSSS..',
  '..SSDDSSSSDDSS..',
  '..SSDDSSSSDDSS..',
  '..SSSSSSSSSSSS..',
  '..SSSSMMMMSSSS..',
  '...SSSSSSSSSS...',
  '....SSSSSSSS....',
  '....JJJJJJJJ....',
  '...JJJJJJJJJJ...',
  '..SJJJJJJJJJJS..',
  '..SJJJJJJJJJJS..',
  '....PPPPPPPP....',
  '....PP....PP....',
  '...BBB....BBB...',
]
const KITS = {
  fw: { J: '#0a7b45', P: '#ffffff', B: '#222' },
  mf: { J: '#0a7b45', P: '#ffffff', B: '#222' },
  df: { J: '#0a7b45', P: '#ffffff', B: '#222' },
  gk: { J: '#f28c28', P: '#222222', B: '#222' },
  coach: { J: '#2a2f3a', P: '#2a2f3a', B: '#111', T: '#0a7b45', W: '#ffffff' },
}
function idolSprite(i) {
  const kit = KITS[i.role] || KITS.fw
  const rows = SPRITE.map((r) => r.split(''))
  if (i.hairStyle === 'bald') {
    rows[0] = '................'.split('')
    rows[1] = '....HHHHHHHH....'.split('')
    rows[2] = '...HHHHHHHHHH...'.split('')
  }
  if (i.hairStyle === 'long') for (const y of [4, 5, 6, 7, 8]) { rows[y][2] = 'H'; rows[y][13] = 'H' }
  if (i.role === 'coach') {
    for (const y of [11, 12, 13, 14]) { rows[y][7] = 'T'; rows[y][8] = 'T' }
    rows[11][6] = 'W'; rows[11][9] = 'W'; rows[12][6] = 'W'; rows[12][9] = 'W'
  }
  const col = { H: i.hair, S: i.skin, D: '#1b1b1b', M: '#a4443a', ...kit }
  let rects = ''
  rows.forEach((r, y) => {
    let x = 0
    while (x < r.length) {
      const c = r[x]
      if (c === '.') { x++; continue }
      let w = 1
      while (r[x + w] === c) w++
      rects += `<rect x="${x}" y="${y}" width="${w}" height="1" fill="${col[c]}"/>`
      x += w
    }
  })
  return `<svg class="idol__sprite" viewBox="0 0 16 18" shape-rendering="crispEdges" aria-hidden="true">${rects}</svg>`
}
const IDOL_UI = {
  pt: { games: 'Jogos pelo Palmeiras', titles: 'Títulos pelo clube', none: 'a confirmar', country: 'País', years: 'No clube', fact: 'Marca no clube', prev: 'Ídolo anterior', next: 'Próximo ídolo', go: 'Ver', roles: { fw: 'Atacante', mf: 'Meia', df: 'Zagueiro', gk: 'Goleiro', coach: 'Técnico' } },
  en: { games: 'Palmeiras appearances', titles: 'Titles with the club', none: 'to be confirmed', country: 'Country', years: 'At the club', fact: 'Club legacy', prev: 'Previous idol', next: 'Next idol', go: 'Show', roles: { fw: 'Forward', mf: 'Midfielder', df: 'Defender', gk: 'Goalkeeper', coach: 'Coach' } },
}
function idolsHtml(lang) {
  const u = IDOL_UI[lang]
  const n = IDOLS.length
  const slides = IDOLS.map((i, k) => `<article class="idol-slide" role="group" aria-roledescription="slide" aria-label="${k + 1} / ${n}: ${esc(i.name)}">
      <div class="idol-slide__fig" data-nick="${esc(i.nick || i.name.split(' ')[0])}">${idolSprite(i)}</div>
      <div class="idol-slide__info">
        <span class="idol-slide__role">${esc(u.roles[i.role])}${i.nick ? ` · “${esc(i.nick)}”` : ''}</span>
        <h4>${esc(i.name)}</h4>
        <p class="idol-slide__lead">${esc(i[lang])}</p>
        <dl class="idol-slide__meta">
          <div><dt>${esc(u.country)}</dt><dd>${esc(i.country[lang])}</dd></div>
          <div><dt>${esc(u.years)}</dt><dd>${esc(i.years)}</dd></div>
          <div><dt>${esc(u.games)}</dt><dd>${i.games ? esc(i.games) : `<em>${esc(u.none)}</em>`}</dd></div>
        </dl>
        <blockquote class="idol-slide__fact"><span>${esc(u.fact)}</span>${esc(i.fact[lang])}</blockquote>
        <div class="idol-slide__titles"><span>${esc(u.titles)}</span>${i.titles.length ? `<ul>${i.titles.map(([t, y]) => `<li><strong>${esc(TITLE_NAMES[t][lang])}</strong> ${esc(y)}</li>`).join('')}</ul>` : `<em>${esc(u.none)}</em>`}</div>
      </div></article>`).join('')
  const dots = IDOLS.map((i, k) => `<button type="button" class="idol-dot${k === 0 ? ' on' : ''}" data-idol-go="${k}" aria-label="${esc(u.go)} ${esc(i.name)}"${k === 0 ? ' aria-current="true"' : ''}>${esc(i.name.split(' ').slice(-1)[0])}</button>`).join('')
  return `<div class="idol-carousel" aria-roledescription="carousel">
      <div class="idol-track" tabindex="0">${slides}</div>
      <div class="idol-nav">
        <button type="button" class="idol-arrow" data-idol-step="-1" aria-label="${esc(u.prev)}"><i class="fa-solid fa-chevron-left" aria-hidden="true"></i></button>
        <div class="idol-dots">${dots}</div>
        <button type="button" class="idol-arrow" data-idol-step="1" aria-label="${esc(u.next)}"><i class="fa-solid fa-chevron-right" aria-hidden="true"></i></button>
      </div>
    </div>`
}

const chips = (items) => `<ul class="chips">${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`

function shot(slug, base, name) {
  if (base.shot) {
    return `<div class="shot"><img src="${esc(base.shot)}" alt="Captura de tela: ${esc(name)}" loading="lazy" width="1280" height="720"></div>`
  }
  const [a, b] = base.hue
  return `<div class="shot shot--mock" style="--c1:${a};--c2:${b}" aria-hidden="true">
    <div class="mock-bar"><i></i><i></i><i></i></div>
    <div class="mock-body"><span class="m1"></span><span class="m2"></span><span class="m3"></span><span class="m4"></span><span class="m5"></span></div>
  </div>`
}

const cvButtons = (lang) => {
  const c = CONTENT[lang]
  return `<a class="btn btn--primary" href="${LINKS.cv[lang]}" download>${esc(c.ui.cvLabel)}</a>`
}

const sections = {
  sobre(lang) {
    const c = CONTENT[lang]
    const s = c.sobre
    return `
      <div class="inv-grid">
        <div class="inv-col">
          <div class="inv-card">
            <h3>${esc(c.hero.name)}</h3>
            ${s.paragraphs.map((p) => `<p>${esc(p)}</p>`).join('')}
            <p class="status"><span class="dot" aria-hidden="true"></span>${esc(s.status)}</p>
          </div>
          <div class="inv-card">
            <h3>${esc(s.focusTitle)}</h3>
            <ul class="list">${s.focus.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>
          </div>
        </div>
        <div class="inv-col">
          <div class="inv-card">
            <h3>${esc(s.trajectoryTitle)}</h3>
            <ol class="timeline">${s.trajectory
              .map(
                (t) => `<li><strong>${esc(t.role)}</strong><span class="meta">${esc(t.org)} · ${esc(t.period)}</span><p>${esc(t.text)}</p></li>`,
              )
              .join('')}</ol>
            <p class="actions">${cvButtons(lang)}</p>
          </div>
        </div>
      </div>`
  },

  projetos(lang) {
    const c = CONTENT[lang]
    const p = c.projetos
    return `
      <p class="lead">${esc(p.intro)}</p>
      <div class="cards">${p.items
        .map((it) => {
          const base = PROJECT_BASE[it.slug]
          return `<article class="card" id="proj-${esc(it.slug)}">
            ${shot(it.slug, base, it.name)}
            <h3>${esc(it.name)}</h3>
            <p class="meta">${esc(it.tag)}</p>
            <p>${esc(it.summary)}</p>
            <ul class="list">${it.points.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
            <p class="meta">${esc(c.ui.stack)}</p>
            ${chips(base.stack)}
            ${base.internal ? `<p class="note">${esc(c.ui.internalNote)}</p>` : ''}
            ${DOCS[it.slug] ? `<p class="actions"><button type="button" class="btn btn--primary doc-open" data-doc="${esc(it.slug)}">${esc(DOC_UI[lang].open)} · ${esc(DOC_UI[lang].count(DOCS[it.slug].shots.length))}</button></p>` : ''}
          </article>`
        })
        .join('')}</div>`
  },

  formacao(lang) {
    const c = CONTENT[lang]
    const f = c.formacao
    const row = (r) => `<li><strong>${esc(r.title)}</strong><span class="meta">${esc(r.org)} · ${esc(r.period)}</span></li>`
    return `
      <div class="inv-grid">
        <div class="inv-col">
          <div class="inv-card">
            <h3>${esc(f.educationTitle)}</h3>
            <ol class="timeline">${f.education.map(row).join('')}</ol>
          </div>
          <div class="inv-card">
            <h3>${esc(f.coursesTitle)}</h3>
            <ol class="timeline">${f.courses.map(row).join('')}</ol>
          </div>
        </div>
        <div class="inv-col">
          <div class="inv-card">
            <h3>${esc(f.earlyTitle)}</h3>
            <p>${esc(f.earlyIntro)}</p>
            <ul class="early">${f.early
              .map(
                (e) => `<li><a href="${esc(e.url)}" target="_blank" rel="noopener noreferrer"><strong>${esc(e.name)}</strong></a>
                <span class="meta">${esc(e.stack)}</span><span>${esc(e.desc)}</span></li>`,
              )
              .join('')}</ul>
          </div>
        </div>
      </div>`
  },

  skills(lang) {
    const k = CONTENT[lang].skills
    return `
      <div class="skill-grid">${k.groups.map((g) => `<section class="inv-card"><h3>${esc(g.title)}</h3>${chips(g.items)}</section>`).join('')}</div>
      <div class="inv-grid" style="margin-top:16px">
        <div class="inv-card"><h3>${esc(k.softTitle)}</h3>${chips(k.soft)}</div>
        <div class="inv-card"><h3>${esc(k.langsTitle)}</h3>${chips(k.langs)}</div>
      </div>`
  },

  contato(lang) {
    const c = CONTENT[lang]
    const ct = c.contato
    const href = {
      linkedin: LINKS.linkedin,
      github: LINKS.github,
      email: `mailto:${LINKS.email}`,
      whatsapp: LINKS.whatsapp,
    }
    return `
      <div class="inv-grid">
        <div class="inv-col">
          <div class="inv-card">
            <p class="lead">${esc(ct.intro)}</p>
            <ul class="channels">${ct.channels
              .map(
                (ch) => `<li><a class="channel" href="${esc(href[ch.key])}" ${ch.key === 'email' ? '' : 'target="_blank" rel="noopener noreferrer"'}>
                  <span class="channel__label">${esc(ch.label)}</span><span class="channel__value">${esc(ch.value)}</span></a></li>`,
              )
              .join('')}</ul>
          </div>
        </div>
        <div class="inv-col">
          <div class="inv-card">
            <h3>${esc(ct.cvTitle)}</h3>
            <p>${esc(ct.cvText)}</p>
            <p class="actions">${cvButtons(lang)}</p>
          </div>
        </div>
      </div>`
  },

  estadio(lang) {
    const t = CONTENT[lang].estadio
    const total = TROPHIES.reduce((n, tr) => n + tr.years.length, 0)
    return `
      <p class="lead">${esc(t.intro)}</p>
      <section class="next-games" data-next-games hidden>
        <h3><i class="fa-solid fa-calendar-days" aria-hidden="true"></i> ${esc(t.nextTitle)}</h3>
        <ul class="next-games__list"></ul>
      </section>
      <div class="inv-grid">
        <div class="inv-col">
          <div class="inv-card">
            <h3>${esc(t.trophiesTitle)}</h3>
            <p class="total"><strong>${total}</strong> ${esc(t.total)}</p>
            <ul class="trophies">${TROPHIES.map(
              (tr) => `<li class="trophy"><span class="trophy__cup" aria-hidden="true">🏆</span>
                <strong>${esc(tr[lang])}</strong>
                <span class="trophy__count">${tr.years.length} ${esc(t.titlesWord)}</span>
                <span class="trophy__years">${tr.years.join(' · ')}</span></li>`,
            ).join('')}</ul>
          </div>
        </div>
        <div class="inv-col">
          <div class="inv-card">
            <h3>${esc(t.idolsTitle)}</h3>
            ${idolsHtml(lang)}
          </div>
        </div>
      </div>`
  },

  palco(lang) {
    const t = CONTENT[lang].palco
    return `
      <p class="lead">${esc(t.intro)}</p>
      <h3>${esc(t.playlistsTitle)}</h3>
      <div class="playlists">${SPOTIFY.map(
        (p) => `<section class="playlist">
          <h4>${esc(p.name)}</h4>
          <iframe title="Spotify: ${esc(p.name)}" src="https://open.spotify.com/embed/playlist/${esc(p.id)}?utm_source=generator&amp;theme=0" width="100%" height="352" frameborder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>
          <a href="https://open.spotify.com/playlist/${esc(p.id)}" target="_blank" rel="noopener noreferrer">${esc(t.openOn)} ↗</a>
        </section>`,
      ).join('')}</div>
      <h3>${esc(t.artistsTitle)}</h3>
      ${chips(ARTISTS)}`
  },

  cinema(lang) {
    const t = CONTENT[lang].cinema
    return `
      <p class="lead">${esc(t.intro)}</p>
      ${MOVIE_GROUPS.map((g) => {
        const [a, b] = g.hue
        return `<h3>${esc(t.groups[g.key])}</h3>
        <ul class="movies">${g.items
          .map(([ptTitle, enTitle, year]) => {
            const title = lang === 'pt' ? ptTitle : enTitle
            return `<li class="movie" style="--c1:${a};--c2:${b}"><span class="movie__year">${year}</span><span class="movie__title">${esc(title)}</span></li>`
          })
          .join('')}</ul>`
      }).join('')}
      <p class="note">${esc(t.posterHint)}</p>`
  },

  biblioteca(lang) {
    const t = CONTENT[lang].biblioteca
    return `
      <p class="lead">${esc(t.intro)}</p>
      <ul class="books">${BOOKS.map((bk) => {
        const [a, b] = bk.hue
        return `<li class="book">
          <div class="book__cover" style="--c1:${a};--c2:${b}" aria-hidden="true"><span>${esc(bk.title[lang])}</span></div>
          <div class="book__info"><h3>${esc(bk.title[lang])}</h3>
          <p class="meta">${esc(t.by)} ${esc(bk.author)}</p>
          <p>${esc(bk.desc[lang])}</p></div></li>`
      }).join('')}</ul>`
  },
}

export const sectionHtml = (lang, key) => sections[key](lang)

export function personJsonLd(lang) {
  const c = CONTENT[lang]
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: c.hero.name,
    jobTitle: c.hero.role,
    url: SITE_URL,
    email: `mailto:${LINKS.email}`,
    address: { '@type': 'PostalAddress', addressLocality: 'São Paulo', addressCountry: 'BR' },
    sameAs: [LINKS.linkedin, LINKS.github],
    knowsAbout: ['React', 'Astro', 'JavaScript', 'Tailwind CSS', 'n8n', 'Supabase'],
  })
}

// Página completa do "modo rápido" (HTML estático, sem JS).
export function rapidoPage(lang) {
  const c = CONTENT[lang]
  const other = lang === 'pt' ? 'en' : 'pt'
  const base = lang === 'pt' ? '' : '/en'
  const otherBase = other === 'pt' ? '' : '/en'
  const mapHref = lang === 'pt' ? '/' : '/?lang=en'
  const canonical = `${SITE_URL}${base}/rapido/`
  return `<!doctype html>
<html lang="${c.htmlLang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(c.hero.name)} · ${esc(c.ui.fast)}</title>
<meta name="description" content="${esc(c.meta.description)}">
<link rel="canonical" href="${canonical}">
<link rel="alternate" hreflang="${c.htmlLang}" href="${canonical}">
<link rel="alternate" hreflang="${CONTENT[other].htmlLang}" href="${SITE_URL}${otherBase}/rapido/">
<meta property="og:type" content="profile">
<meta property="og:title" content="${esc(c.meta.title)}">
<meta property="og:description" content="${esc(c.meta.description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${SITE_URL}/og.png">
<meta property="og:locale" content="${c.ogLocale}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#2d2a32">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/src/style.css">
<script type="application/ld+json">${personJsonLd(lang)}</script>
</head>
<body class="rapido">
<a class="skip" href="#conteudo">${esc(c.ui.skipToContent)}</a>
<header class="r-head">
  <div>
    <h1>${esc(c.hero.name)}</h1>
    <p class="r-role">${esc(c.hero.role)}</p>
    <p class="meta">${esc(c.hero.location)}</p>
  </div>
  <nav class="r-nav" aria-label="${esc(c.ui.shortcuts)}">
    <a class="btn" href="${mapHref}">${esc(c.ui.backToMap)}</a>
    <a class="btn" href="${otherBase}/rapido/" hreflang="${other}" lang="${other}" aria-label="${esc(c.ui.langOtherLabel)}">${esc(c.ui.langOther)}</a>
  </nav>
</header>
<nav class="r-toc" aria-label="${esc(c.ui.shortcuts)}">
  ${SECTION_ORDER.map((k) => `<a href="#${k}">${esc(c.sections[k].label)}</a>`).join('')}
</nav>
<main id="conteudo" class="r-main">
${SECTION_ORDER.map(
  (k) => `<section id="${k}" class="r-section" aria-labelledby="h-${k}">
  <h2 id="h-${k}">${esc(c.sections[k].title)}</h2>
  ${sectionHtml(lang, k)}
</section>`,
).join('\n')}
</main>
<footer class="r-foot"><p class="meta">© ${new Date().getFullYear()} ${esc(c.hero.name)}</p></footer>
</body>
</html>
`
}
