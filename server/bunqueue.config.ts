import { defineConfig } from 'bunqueue';

export default defineConfig({
  server: {
    tcpPort: 6789,
    httpPort: 6790,
  },
  storage: {},
});
