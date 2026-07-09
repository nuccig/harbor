import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: ['out/**', 'dist/**', 'node_modules/**', 'scripts/**']
  },
  ...tseslint.configs.recommended
)