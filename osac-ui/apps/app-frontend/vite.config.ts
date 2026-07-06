import { defineConfig, loadEnv, type ProxyOptions } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { viteStaticCopy } from 'vite-plugin-static-copy'

import { mockAuthPlugin } from './vite/mockAuthPlugin'

const uiComponentsSrc = resolve(__dirname, '../../libs/ui-components/src')
const defaultProxyTarget = 'http://localhost:8080'

const parseMockRoles = (value: string | undefined): string[] => {
  if (!value?.trim()) {
    return ['tenant-admin']
  }
  return value.split(',').map((role) => role.trim()).filter(Boolean)
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '')
  const isMockMode = mode === 'mock'
  const mockServer = process.env.MOCK_SERVER ?? env.MOCK_SERVER

  if (isMockMode && !mockServer) {
    throw new Error(
      'MOCK_SERVER is required for dev:mock (e.g. MOCK_SERVER=http://localhost:4010 pnpm dev:mock)',
    )
  }

  const mockAuth = isMockMode
    ? {
        username: process.env.MOCK_USER ?? env.MOCK_USER ?? 'mock-user',
        roles: parseMockRoles(process.env.MOCK_ROLES ?? env.MOCK_ROLES),
        expiresIn: Number(process.env.MOCK_EXPIRES_IN ?? env.MOCK_EXPIRES_IN ?? 3600),
      }
    : undefined

  const devProxy: Record<string, ProxyOptions> = {
    '/api': {
      target: defaultProxyTarget,
      changeOrigin: true,
    },
    '/health': {
      target: defaultProxyTarget,
      changeOrigin: true,
    },
    '/ready': {
      target: defaultProxyTarget,
      changeOrigin: true,
    },
  }

  const serverProxy: Record<string, ProxyOptions> = isMockMode
    ? {
        '/api/fulfillment': {
          target: mockServer!,
          changeOrigin: true,
        },
        '/api/events': {
          target: mockServer!,
          changeOrigin: true,
        },
        '/api/osac/public': {
          target: mockServer!,
          changeOrigin: true,
        },
      }
    : devProxy

  return {
  plugins: [
    react(),
    ...(mockAuth ? [mockAuthPlugin(mockAuth)] : []),
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
    proxy: serverProxy,
  },
  optimizeDeps: {
    include: ['@patternfly/react-charts > victory-core'],
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  }
})
