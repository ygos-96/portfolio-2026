// Próximos jogos do Palmeiras via API pública da ESPN (sem chave).
// Não é uma API oficial: se mudar ou cair, a função devolve erro e o bloco some do site.
// A resposta é cacheada na CDN por 6h.
const TEAM = '2029' // Palmeiras na ESPN
const LEAGUES = {
  'bra.1': 'Brasileirão',
  'conmebol.libertadores': 'Libertadores',
  'bra.copa_do_brazil': 'Copa do Brasil',
  'bra.camp.paulista': 'Paulista',
  'conmebol.recopa': 'Recopa',
  'fifa.cwc': 'Mundial de Clubes',
}
const OK_CACHE = 'public, s-maxage=21600, stale-while-revalidate=86400'

export async function GET() {
  const results = await Promise.allSettled(Object.keys(LEAGUES).map(fetchLeague))
  const ok = results.filter((r) => r.status === 'fulfilled')
  if (!ok.length) return json({ error: 'falha ao consultar a ESPN' }, 502, 'public, s-maxage=600')

  const now = Date.now()
  const seen = new Set()
  const games = ok
    .flatMap((r) => r.value)
    .filter((g) => !seen.has(g.id) && seen.add(g.id))
    .filter((g) => new Date(g.date).getTime() > now - 3 * 3600e3)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 5)
  return json({ games, updated: new Date().toISOString() }, 200, OK_CACHE)
}

async function fetchLeague(slug) {
  const r = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${slug}/teams/${TEAM}/schedule?fixture=true`)
  if (!r.ok) throw new Error(`espn ${slug} ${r.status}`)
  const d = await r.json()
  return (d.events || []).flatMap((e) => {
    const c = e.competitions?.[0]
    if (!c || c.status?.type?.state !== 'pre') return []
    const side = (ha) => {
      const t = c.competitors.find((x) => x.homeAway === ha)
      return { id: t?.id, name: t?.team?.shortDisplayName || t?.team?.displayName || '?', logo: t?.team?.logos?.[0]?.href || t?.team?.logo || null }
    }
    const home = side('home')
    const away = side('away')
    return [{
      id: e.id,
      date: e.date,
      tbd: c.timeValid === false,
      venue: c.venue?.fullName || null,
      league: LEAGUES[slug],
      home: { name: home.name, logo: home.logo },
      away: { name: away.name, logo: away.logo },
      isHome: home.id === TEAM,
    }]
  })
}

function json(body, status, cache) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': cache },
  })
}
