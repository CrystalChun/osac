import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

const apiContractsSrc = resolve(__dirname, '../../libs/api-contracts/src')
const uiComponentsSrc = resolve(__dirname, '../../libs/ui-components/src')

export default defineConfig({
  resolve: {
    alias: [
      {
        find: /^@osac\/api-contracts\/(.+)$/,
        replacement: `${apiContractsSrc}/$1.ts`,
      },
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
