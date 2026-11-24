import { defineConfig, loadEnv } from 'vite'
import { resolve } from 'node:path'

// Em dev, /api/* roda as funções da pasta api/ (as mesmas da Vercel), lendo a chave do .env.local
function devApi(env) {
  return {
    name: 'dev-api',
    configureServer(server) {
      server.middlewares.use('/api/jogos', async (_req, res) => {
        Object.assign(process.env, env)
        const { GET } = await server.ssrLoadModule('/api/jogos.js')
        const r = await GET()
        res.statusCode = r.status
        r.headers.forEach((v, k) => res.setHeader(k, v))
        res.end(await r.text())
      })
    },
  }
}

export default defineConfig(({ mode }) => ({
  plugins: [devApi(loadEnv(mode, process.cwd(), ''))],
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        rapido: resolve(import.meta.dirname, 'rapido/index.html'),
        rapidoEn: resolve(import.meta.dirname, 'en/rapido/index.html'),
      },
    },
  },
}))
