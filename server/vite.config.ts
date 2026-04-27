import { defineConfig } from 'vite-plus';

export default defineConfig({
  pack: {
    entry: {
      'eden-admin': 'src/edens/admin.ts',
      'eden-user': 'src/edens/user.ts',
    },
    dts: {
      emitDtsOnly: true,
    },
  },
});
