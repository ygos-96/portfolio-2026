// Busca o caminho do pôster de cada filme no TMDB e grava em src/posters.js.
// Uso: TMDB_API_KEY=suachave npm run posters   (chave grátis em themoviedb.org > Configurações > API)
// As imagens não são baixadas: o site carrega do CDN do TMDB (image.tmdb.org), com o crédito exigido pelo TMDB.
import { writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { MOVIE_GROUPS } from '../src/content.js'

const key = process.env.TMDB_API_KEY
if (!key) {
  console.error('Defina TMDB_API_KEY (chave v3 do TMDB).')
  process.exit(1)
}
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

async function search(query, year) {
  const url = new URL('https://api.themoviedb.org/3/search/movie')
  url.searchParams.set('api_key', key)
  url.searchParams.set('query', query)
  if (year) url.searchParams.set('year', String(year))
  const r = await fetch(url)
  if (!r.ok) throw new Error(`TMDB ${r.status}`)
  const { results } = await r.json()
  return results.find((m) => m.poster_path)?.poster_path ?? null
}

const out = {}
const missing = []
for (const g of MOVIE_GROUPS) {
  for (const [pt, en, year] of g.items) {
    const id = `${en}|${year}`
    if (out[id]) continue
    const path = (await search(en, year)) ?? (await search(pt, year)) ?? (await search(en))
    if (path) out[id] = path
    else missing.push(id)
  }
}
const body = Object.entries(out)
  .map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)},`)
  .join('\n')
writeFileSync(
  resolve(root, 'src/posters.js'),
  `// Gerado por scripts/fetch-posters.mjs (npm run posters). Chave: "<título EN>|<ano>" -> caminho do pôster no TMDB.\nexport const POSTERS = {\n${body}\n}\n`,
)
console.log(`${Object.keys(out).length} pôsteres encontrados.`)
if (missing.length) console.log('Sem pôster:', missing.join(', '))
