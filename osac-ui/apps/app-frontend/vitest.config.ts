import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

const uiComponentsSrc = resolve(__dirname, '../../libs/ui-components/src')

export default defineConfig({
  resolve: {
    alias: [
      {
        find: /^@osac\/ui-components\/(.+)$/,
        replacement: `${uiComponentsSrc}/$1`,
      },
    ],
  },
  test: {
    environment: 'jsdom',
    passWithNoTests: true,
  },
})
