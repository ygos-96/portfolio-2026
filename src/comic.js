// Versão em texto do portfólio em formato de HQ: uma página contínua, sem menu.
// Gera HTML estático (funciona sem JS); src/comic-fx.js só adiciona os efeitos.
import { BOOKS, CONTENT, LINKS, MOVIE_GROUPS, PROJECT_BASE, SITE_URL, SPOTIFY, TROPHIES } from './content.js'
import { esc, personJsonLd } from './render.js'

const COPY = {
  pt: {
    title: 'Ygor Gomes · Front-End, Automação (n8n) e Segurança de Aplicações',
    description:
      'Ygor Gomes, desenvolvedor em São Paulo: front-end, automação com n8n e agentes de IA em produção, e segurança de aplicações (AppSec). Projetos públicos no GitHub.',
    tagline: ['Desenvolvedor Front-End e Automação (n8n)', 'Segurança de Aplicações'],
    issue: 'Edição nº 1 · Portfólio',
    bubble: 'Automatizo o que é chato e blindo o que é sensível.',
    stats: [
      { count: 1000, plus: true, label: 'alunos com acesso liberado sem intervenção manual (n8n em produção)' },
      { text: '6/6', label: 'ataques simulados bloqueados no webhook assinado com HMAC' },
      { text: '5/5', label: 'falhas do OWASP Top 10 exploradas e depois corrigidas, com teste automático' },
    ],
    contactCta: 'Falar comigo',
    scroll: 'Role para continuar a história',
    chapter: 'Capítulo',
    ch: {
      sobre: ['Origem', 'Quem é o herói?'],
      projetos: ['Missões', 'Cinco missões, todas no ar'],
      trajetoria: ['Trajetória', 'De onde eu vim'],
      arsenal: ['Arsenal', 'Com quais ferramentas?'],
      final: ['Final', 'A próxima edição pode ser sua'],
    },
    cliff: ['Mas o trabalho de verdade começa agora…', 'Enquanto isso, nos bastidores…', 'E com que ferramentas?', 'Falta só um personagem nessa história…'],
    sfx: ['CLAC!', 'BLOQ!', 'POW!', 'ZAP!', 'XP!'],
    mission: 'Missão',
    missionBtn: 'Código no GitHub',
    earlyTitle: 'Primeiras páginas',
    extras: {
      kicker: 'Extra · lado leste',
      title: 'Fora do expediente',
      text: 'Palmeiras, filmes, livros e música moram no mapa interativo. Se tiver um tempinho, vale a visita.',
      btn: 'Visitar o mapa',
      facts: (n) => [`${n.trophies} títulos do Palmeiras desde 2015`, `${n.movies} filmes na lista`, `${n.books} livros na estante`, `${n.lists} playlists`],
    },
    top: 'Voltar ao topo',
    foot: 'Fim da edição. Obrigado por ler.',
  },
  en: {
    title: 'Ygor Gomes · Front-End, Automation (n8n) and Application Security',
    description:
      'Ygor Gomes, a developer in São Paulo, Brazil: front-end, automation with n8n and AI agents in production, and application security (AppSec). Public projects on GitHub.',
    tagline: ['Front-End & Automation (n8n) Developer', 'Application Security'],
    issue: 'Issue #1 · Portfolio',
    bubble: 'I automate the boring stuff and lock down the sensitive stuff.',
    stats: [
      { count: 1000, plus: true, label: 'students given course access with no manual work (n8n in production)' },
      { text: '6/6', label: 'simulated attacks blocked on the HMAC-signed webhook' },
      { text: '5/5', label: 'OWASP Top 10 flaws exploited, then fixed, with an automated test' },
    ],
    contactCta: 'Talk to me',
    scroll: 'Scroll to continue the story',
    chapter: 'Chapter',
    ch: {
      sobre: ['Origin', 'Who is the hero?'],
      projetos: ['Missions', 'Five missions, all live'],
      trajetoria: ['Background', 'Where I come from'],
      arsenal: ['Arsenal', 'With what tools?'],
      final: ['Finale', 'The next issue could be yours'],
    },
    cliff: ['But the real work starts now…', 'Meanwhile, behind the scenes…', 'And with what tools?', 'Only one character missing from this story…'],
    sfx: ['CLACK!', 'BLOCK!', 'POW!', 'ZAP!', 'XP!'],
    mission: 'Mission',
    missionBtn: 'Code on GitHub',
    earlyTitle: 'First pages',
    extras: {
      kicker: 'Extra · east side',
      title: 'Off the clock',
      text: 'Palmeiras, movies, books and music live in the interactive map. Worth a visit if you have a minute.',
      btn: 'Visit the map',
      facts: (n) => [`${n.trophies} Palmeiras titles since 2015`, `${n.movies} movies on the list`, `${n.books} books on the shelf`, `${n.lists} playlists`],
    },
    top: 'Back to top',
    foot: 'End of issue. Thanks for reading.',
  },
}

const SKILL_COLORS = ['red', 'cyan', 'yellow', 'pink', 'green', 'ink']

const cliff = (text) => `<p class="cliff" data-pop><span>${esc(text)}</span></p>`

const chapterHead = (k, n, lang) => {
  const [tag, title] = COPY[lang].ch[k]
  return `<header class="ch-head" data-pop>
      <span class="ch-num">${esc(COPY[lang].chapter)} ${n}</span>
      <p class="ch-tag">${esc(tag)}</p>
      <h2 id="h-${k}">${esc(title)}</h2>
    </header>`
}

function missionShot(base, name) {
  if (!base.shot) return ''
  return `<div class="m-shot"><img src="${esc(base.shot)}" alt="${esc(name)}" loading="lazy" width="1280" height="720"></div>`
}

function projectPanel(it, i, lang, c, t) {
  const base = PROJECT_BASE[it.slug]
  const link = base.live
    ? `<a class="btn btn--red" href="${esc(base.live)}" target="_blank" rel="noopener noreferrer">${esc(c.ui.live)} ↗</a>`
    : base.repo
      ? `<a class="btn btn--red" href="${esc(base.repo)}" target="_blank" rel="noopener noreferrer">${esc(t.missionBtn)} ↗</a>`
      : ''
  return `<article class="mission ${i % 2 ? 'mission--flip' : ''}" data-pop id="proj-${esc(it.slug)}">
      <div class="m-art">
        <span class="m-sfx" aria-hidden="true">${esc(t.sfx[i % t.sfx.length])}</span>
        ${missionShot(base, it.name)}
      </div>
      <div class="m-body">
        <p class="m-kicker"><span>${esc(t.mission)} ${String(i + 1).padStart(2, '0')}</span>${esc(it.tag)}</p>
        <h3>${esc(it.name)}</h3>
        <p class="m-sum">${esc(it.summary)}</p>
        <ul class="m-points">${it.points.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>
        <ul class="tags" aria-label="${esc(c.ui.stack)}">${base.stack.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
        ${link ? `<p class="m-actions">${link}</p>` : ''}
      </div>
    </article>`
}

export function comicPage(lang) {
  const c = CONTENT[lang]
  const t = COPY[lang]
  const other = lang === 'pt' ? 'en' : 'pt'
  const base = lang === 'pt' ? '' : '/en'
  const otherBase = other === 'pt' ? '' : '/en'
  const mapHref = lang === 'pt' ? '/' : '/?lang=en'
  const canonical = `${SITE_URL}${base}/rapido/`
  const mail = `mailto:${LINKS.email}`
  const channelHref = { linkedin: LINKS.linkedin, github: LINKS.github, email: mail, whatsapp: LINKS.whatsapp }
  const counts = {
    trophies: TROPHIES.reduce((n, tr) => n + tr.years.length, 0),
    movies: MOVIE_GROUPS.reduce((n, g) => n + g.items.length, 0),
    books: BOOKS.length,
    lists: SPOTIFY.length,
  }
  const s = c.sobre
  const f = c.formacao
  const k = c.skills
  const ct = c.contato
  const row = (r) => `<li><strong>${esc(r.title)}</strong><span>${esc(r.org)} · ${esc(r.period)}</span></li>`

  return `<!doctype html>
<html lang="${c.htmlLang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(t.title)}</title>
<meta name="description" content="${esc(t.description)}">
<link rel="canonical" href="${canonical}">
<link rel="alternate" hreflang="${c.htmlLang}" href="${canonical}">
<link rel="alternate" hreflang="${CONTENT[other].htmlLang}" href="${SITE_URL}${otherBase}/rapido/">
<meta property="og:type" content="profile">
<meta property="og:title" content="${esc(t.title)}">
<meta property="og:description" content="${esc(t.description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${SITE_URL}/og.png">
<meta property="og:locale" content="${c.ogLocale}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#14121c">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bangers&family=Comic+Neue:wght@400;700&family=Permanent+Marker&display=swap">
<link rel="stylesheet" href="/src/comic.css">
<script type="application/ld+json">${personJsonLd(lang)}</script>
</head>
<body class="comic">
<a class="skip" href="#historia">${esc(c.ui.skipToContent)}</a>
<div class="progress" aria-hidden="true"><i></i></div>

<main id="historia">

<!-- CAPA -->
<section class="cover" aria-labelledby="h-cover">
  <div class="cover__top">
    <span class="issue">${esc(t.issue)}</span>
    <span class="cover__links">
      <a href="${mapHref}">${esc(c.ui.backToMap)}</a>
      <a href="${otherBase}/rapido/" hreflang="${other}" lang="${other}" aria-label="${esc(c.ui.langOtherLabel)}">${esc(c.ui.langOther)}</a>
    </span>
  </div>
  <div class="cover__title">
    <span class="cover__burst" aria-hidden="true"></span>
    <h1 id="h-cover"><span class="h1-name">${esc(c.hero.name)}</span>
      <span class="h1-role">${esc(t.tagline[0])}</span>
      <span class="h1-role h1-role--alt">${esc(t.tagline[1])}</span></h1>
  </div>
  <p class="bubble bubble--hero">${esc(t.bubble)}</p>
  <p class="status"><span class="dot" aria-hidden="true"></span>${esc(s.status)}</p>
  <ul class="stats">${t.stats
    .map(
      (st) => `<li class="stat" data-pop><strong${st.count ? ` data-count="${st.count}"` : ''}>${st.count ? `${st.plus ? '+' : ''}${st.count.toLocaleString(lang === 'pt' ? 'pt-BR' : 'en-US')}` : esc(st.text)}</strong><span>${esc(st.label)}</span></li>`,
    )
    .join('')}</ul>
  <p class="cover__cta">
    <a class="btn btn--red" href="${LINKS.cv[lang]}" download>${esc(c.ui.cvLabel)}</a>
    <a class="btn btn--yellow" href="#contato">${esc(t.contactCta)}</a>
  </p>
  <a class="scroll-cue" href="#sobre"><span>${esc(t.scroll)}</span><i aria-hidden="true">↓</i></a>
</section>

<!-- CAP. 1 -->
<section id="sobre" class="chapter" aria-labelledby="h-sobre">
  ${chapterHead('sobre', 1, lang)}
  <div class="origin">
    <div class="captions">${s.paragraphs.map((p) => `<p class="caption" data-pop>${esc(p)}</p>`).join('')}</div>
    <aside class="focus" data-pop>
      <h3>${esc(s.focusTitle)}</h3>
      <ul>${s.focus.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
    </aside>
  </div>
  ${cliff(t.cliff[0])}
</section>

<!-- CAP. 2 -->
<section id="projetos" class="chapter chapter--dark" aria-labelledby="h-projetos">
  ${chapterHead('projetos', 2, lang)}
  <p class="lead" data-pop>${esc(c.projetos.intro)}</p>
  ${c.projetos.items.map((it, i) => projectPanel(it, i, lang, c, t)).join('\n')}
  ${cliff(t.cliff[1])}
</section>

<!-- CAP. 3 -->
<section id="trajetoria" class="chapter" aria-labelledby="h-trajetoria">
  ${chapterHead('trajetoria', 3, lang)}
  <div class="strip">
    ${s.trajectory
      .map(
        (tr) => `<article class="frame" data-pop>
      <p class="frame__when">${esc(tr.period)}</p>
      <h3>${esc(tr.role)}</h3>
      <p class="frame__org">${esc(tr.org)}</p>
      <p>${esc(tr.text)}</p>
    </article>`,
      )
      .join('')}
    <article class="frame frame--edu" data-pop>
      <h3>${esc(f.educationTitle)}</h3>
      <ol class="rows">${f.education.map(row).join('')}</ol>
    </article>
    <article class="frame frame--edu" data-pop>
      <h3>${esc(f.coursesTitle)}</h3>
      <ol class="rows">${f.courses.map(row).join('')}</ol>
    </article>
  </div>
  <div class="early" data-pop>
    <h3>${esc(t.earlyTitle)}</h3>
    <ul>${f.early.map((e) => `<li><a href="${esc(e.url)}" target="_blank" rel="noopener noreferrer">${esc(e.name)}</a><span>${esc(e.stack)}</span></li>`).join('')}</ul>
  </div>
  ${cliff(t.cliff[2])}
</section>

<!-- CAP. 4 -->
<section id="arsenal" class="chapter chapter--dark" aria-labelledby="h-arsenal">
  ${chapterHead('arsenal', 4, lang)}
  <div class="arsenal">
    ${k.groups
      .map(
        (g, i) => `<section class="power power--${SKILL_COLORS[i % SKILL_COLORS.length]}" data-pop>
      <h3>${esc(g.title)}</h3>
      <ul class="tags">${g.items.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
    </section>`,
      )
      .join('')}
    <section class="power power--ink" data-pop>
      <h3>${esc(k.softTitle)}</h3>
      <ul class="tags">${k.soft.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
      <h3 class="sub">${esc(k.langsTitle)}</h3>
      <ul class="tags">${k.langs.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
    </section>
  </div>
  ${cliff(t.cliff[3])}
</section>

<!-- CAP. 5 -->
<section id="contato" class="chapter final" aria-labelledby="h-final">
  ${chapterHead('final', 5, lang)}
  <div class="final__panel" data-pop>
    <p class="bubble bubble--final">${esc(ct.intro)}</p>
    <ul class="channels">${ct.channels
      .map(
        (ch) => `<li><a class="channel" href="${esc(channelHref[ch.key])}"${ch.key === 'email' ? '' : ' target="_blank" rel="noopener noreferrer"'}><span>${esc(ch.label)}</span><strong>${esc(ch.value)}</strong></a></li>`,
      )
      .join('')}</ul>
    <p class="final__cv"><a class="btn btn--red" href="${LINKS.cv[lang]}" download>${esc(c.ui.cvLabel)}</a></p>
  </div>
</section>

<!-- EXTRA (bem discreto) -->
<aside class="extras" aria-labelledby="h-extras">
  <p class="extras__kicker">${esc(t.extras.kicker)}</p>
  <h2 id="h-extras">${esc(t.extras.title)}</h2>
  <p>${esc(t.extras.text)}</p>
  <ul class="tags">${t.extras.facts(counts).map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
  <p><a class="btn btn--ghost" href="${mapHref}">${esc(t.extras.btn)}</a></p>
</aside>
</main>

<footer class="foot">
  <p>${esc(t.foot)}</p>
  <p><a href="#historia">${esc(t.top)} ↑</a> · © ${new Date().getFullYear()} ${esc(c.hero.name)}</p>
</footer>

<a class="sticky-cta" href="#contato" aria-hidden="true" tabindex="-1">${esc(t.contactCta)} →</a>
<script type="module" src="/src/comic-fx.js"></script>
</body>
</html>
`
}
