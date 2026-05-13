export const basePackageExports = {
  './nuxt': './nuxt/index.ts',
  './nuxt/components.json': './nuxt/components.json',
  '.': './src/index.ts',
  './style.css': './src/style.css',
  './types': './types.d.ts',
  './components/*': './src/components/*',
  './lib/*': './src/lib/*',
} as const;
