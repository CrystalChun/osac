import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import tseslint from 'typescript-eslint'

import sharedConfig from '../../libs/config/eslint.config.js'

const shared = Array.isArray(sharedConfig) ? sharedConfig : [sharedConfig]

export default tseslint.config({ ignores: ['dist/**'] }, ...shared, {
  files: ['src/**/*.{ts,tsx}'],
  languageOptions: {
    globals: {
      ...globals.browser,
    },
  },
  plugins: {
    'react-hooks': reactHooks,
  },
  rules: {
    ...reactHooks.configs.recommended.rules,
    'react-hooks/refs': 'off',
    'react-hooks/set-state-in-effect': 'off',
  },
})
