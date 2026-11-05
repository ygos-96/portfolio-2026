// Funções puras que geram HTML (usadas no navegador e no gerador das páginas estáticas).
import { CONTENT, LINKS, PROJECT_BASE, SECTION_ORDER, SITE_URL } from './content.js'

export const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

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
      ${s.paragraphs.map((p) => `<p>${esc(p)}</p>`).join('')}
      <p class="status"><span class="dot" aria-hidden="true"></span>${esc(s.status)}</p>
      <h3>${esc(s.focusTitle)}</h3>
      <ul class="list">${s.focus.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>
      <h3>${esc(s.trajectoryTitle)}</h3>
      <ol class="timeline">${s.trajectory
        .map(
          (t) => `<li><strong>${esc(t.role)}</strong><span class="meta">${esc(t.org)} · ${esc(t.period)}</span><p>${esc(t.text)}</p></li>`,
        )
        .join('')}</ol>
      <p class="actions">${cvButtons(lang)}</p>`
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
          </article>`
        })
        .join('')}</div>`
  },

  formacao(lang) {
    const c = CONTENT[lang]
    const f = c.formacao
    const row = (r) => `<li><strong>${esc(r.title)}</strong><span class="meta">${esc(r.org)} · ${esc(r.period)}</span></li>`
    return `
      <h3>${esc(f.educationTitle)}</h3>
      <ol class="timeline">${f.education.map(row).join('')}</ol>
      <h3>${esc(f.coursesTitle)}</h3>
      <ol class="timeline">${f.courses.map(row).join('')}</ol>
      <h3>${esc(f.earlyTitle)}</h3>
      <p>${esc(f.earlyIntro)}</p>
      <ul class="early">${f.early
        .map(
          (e) => `<li><a href="${esc(e.url)}" target="_blank" rel="noopener noreferrer"><strong>${esc(e.name)}</strong></a>
          <span class="meta">${esc(e.stack)}</span><span>${esc(e.desc)}</span></li>`,
        )
        .join('')}</ul>`
  },

  skills(lang) {
    const k = CONTENT[lang].skills
    return `
      <div class="skill-grid">${k.groups.map((g) => `<section><h3>${esc(g.title)}</h3>${chips(g.items)}</section>`).join('')}</div>
      <h3>${esc(k.softTitle)}</h3>${chips(k.soft)}
      <h3>${esc(k.langsTitle)}</h3>${chips(k.langs)}`
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
      <p class="lead">${esc(ct.intro)}</p>
      <ul class="channels">${ct.channels
        .map(
          (ch) => `<li><a class="channel" href="${esc(href[ch.key])}" ${ch.key === 'email' ? '' : 'target="_blank" rel="noopener noreferrer"'}>
            <span class="channel__label">${esc(ch.label)}</span><span class="channel__value">${esc(ch.value)}</span></a></li>`,
        )
        .join('')}</ul>
      <h3>${esc(ct.cvTitle)}</h3>
      <p>${esc(ct.cvText)}</p>
      <p class="actions">${cvButtons(lang)}</p>`
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
