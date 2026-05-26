import globals from 'globals'
import tseslint from 'typescript-eslint'

import sharedConfig from '../../libs/config/eslint.config.js'

const shared = Array.isArray(sharedConfig) ? sharedConfig : [sharedConfig]

export default tseslint.config({ ignores: ['dist/**'] }, ...shared, {
  files: ['src/**/*.ts'],
  languageOptions: {
    globals: {
      ...globals.node,
    },
  },
})
