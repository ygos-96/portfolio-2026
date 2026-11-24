// Bloco "Próximos jogos" do Estádio: busca /api/jogos (função na Vercel) e preenche a lista.
// Se a API falhar ou não houver jogos, o bloco continua escondido.
const UI = {
  pt: { home: 'Em casa', away: 'Fora', tbd: 'horário a definir', locale: 'pt-BR' },
  en: { home: 'Home', away: 'Away', tbd: 'time TBC', locale: 'en-GB' },
}
const LEAGUES = [
  [/serie a/i, 'Brasileirão'],
  [/libertadores/i, 'Libertadores'],
  [/copa do brasil/i, 'Copa do Brasil'],
  [/paulista/i, 'Paulista'],
  [/sudamericana/i, 'Sul-Americana'],
  [/recopa/i, 'Recopa'],
  [/supercopa/i, 'Supercopa'],
  [/club world cup|mundial/i, 'Mundial de Clubes'],
]
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch])
const league = (name) => LEAGUES.find(([re]) => re.test(name))?.[1] || name

let request = null // uma busca por visita

export function hydrateNextGames(root, lang) {
  const box = root.querySelector('[data-next-games]')
  if (!box) return
  request ||= fetch('/api/jogos')
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null)
    .then((data) => {
      if (!data) request = null // falhou: tenta de novo na próxima vez que o painel abrir
      return data
    })
  request.then((data) => {
    if (!data?.games?.length || !box.isConnected) return
    const u = UI[lang] || UI.pt
    const day = new Intl.DateTimeFormat(u.locale, { timeZone: 'America/Sao_Paulo', weekday: 'short', day: '2-digit', month: '2-digit' })
    const hour = new Intl.DateTimeFormat(u.locale, { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' })
    const team = (t) =>
      `<span class="ng-team"><img src="${esc(t.logo)}" alt="" width="28" height="28" loading="lazy" onerror="this.remove()"><span>${esc(t.name)}</span></span>`
    box.querySelector('.next-games__list').innerHTML = data.games
      .map((g) => {
        const d = new Date(g.date)
        return `<li class="ng-game${g.isHome ? ' is-home' : ''}">
          <div class="ng-when"><strong>${esc(day.format(d))}</strong><span>${g.tbd ? esc(u.tbd) : esc(hour.format(d))}</span></div>
          <div class="ng-match">${team(g.home)}<span class="ng-x">×</span>${team(g.away)}</div>
          <div class="ng-tags"><span class="ng-league">${esc(league(g.league))}</span><span class="ng-side">${g.isHome ? u.home : u.away}</span></div>
          ${g.venue ? `<div class="ng-venue"><i class="fa-solid fa-location-dot" aria-hidden="true"></i> ${esc(g.venue)}</div>` : ''}
        </li>`
      })
      .join('')
    box.hidden = false
  })
}
