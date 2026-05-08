import { defineConfig } from 'vite-plus';

export default defineConfig({
  pack: {
    entry: {
      eden: './src/eden.ts',
    },
    dts: {
      emitDtsOnly: true,
    },
  },
});
