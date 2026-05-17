import { defineConfig } from 'vite-plus';

export default defineConfig({
  run: {
    tasks: {
      check: {
        command: 'vp check',
      },
      typecheck: {
        command: 'vue-tsgo --build',
        input: [{ auto: true }, '!**/*.tsbuildinfo'],
      },
      'generate:manifest': {
        command: 'bun scripts/generate-manifest.ts',
      },
    },
  },
});
