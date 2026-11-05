import { defineConfig } from 'vite'
import { resolve } from 'node:path'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        rapido: resolve(import.meta.dirname, 'rapido/index.html'),
        rapidoEn: resolve(import.meta.dirname, 'en/rapido/index.html'),
      },
    },
  },
})
