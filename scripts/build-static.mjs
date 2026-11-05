// Gera as páginas estáticas do "modo rápido" (PT e EN) e o sitemap a partir de src/content.js.
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { rapidoPage } from '../src/render.js'
import { SITE_URL } from '../src/content.js'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const out = [
  ['rapido/index.html', 'pt'],
  ['en/rapido/index.html', 'en'],
]
for (const [file, lang] of out) {
  const path = resolve(root, file)
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, rapidoPage(lang))
}

const urls = ['/', '/?lang=en', '/rapido/', '/en/rapido/']
writeFileSync(
  resolve(root, 'public/sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((u) => `  <url><loc>${SITE_URL}${u.replace(/&/g, '&amp;')}</loc></url>`)
    .join('\n')}\n</urlset>\n`,
)
writeFileSync(resolve(root, 'public/robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${SITE_URL}/sitemap.xml\n`)
console.log('static pages generated')
