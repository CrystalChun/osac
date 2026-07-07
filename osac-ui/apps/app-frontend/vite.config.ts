import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { viteStaticCopy } from 'vite-plugin-static-copy'

const uiComponentsSrc = resolve(__dirname, '../../libs/ui-components/src')

export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: resolve(__dirname, '../../libs/i18n/locales'),
          dest: '.',
        },
      ],
    }),
  ],
  resolve: {
    alias: [
      {
        find: /^@osac\/ui-components\/(.+)$/,
        replacement: `${uiComponentsSrc}/$1`,
      },
    ],
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/ready': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  optimizeDeps: {
    include: ['@patternfly/react-charts > victory-core'],
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
