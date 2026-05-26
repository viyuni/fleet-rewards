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
  vpp: {
    test: 'bun:test',
  },
  run: {
    tasks: {
      dev: {
        command: 'bun --parallel run dev:admin dev:user dev:event',
      },
      build: {
        command: 'bun --sequential run build:admin build:user build:event',
      },
      dts: {
        command: 'vp pack',
      },
      typecheck: {
        command: 'tsgo --build',
      },
      check: {
        command: 'vpr typecheck && vp lint && vp fmt',
      },
      test: {
        command:
          'bun --env-file=.env.test test --preload ./src/__tests__/setup-env.ts --pass-with-no-tests',
      },
      'db:generate': {
        command: 'bun --env-file=.env drizzle-kit generate',
      },
      'db:push': {
        cache: false,
        command: 'bun --env-file=.env drizzle-kit push',
      },
      'db:push:test': {
        cache: false,
        command: 'bun --env-file=.env.test drizzle-kit push',
      },
      'db:seed': {
        cache: false,
        command: 'bun --env-file=.env ./src/db/seed.ts',
      },
      'db:studio': {
        cache: false,
        command: 'bun --env-file=.env drizzle-kit studio',
      },
      'db:studio:test': {
        cache: false,
        command: 'bun --env-file=.env.test drizzle-kit studio',
      },
      'docker-compose': {
        command: 'docker compose up -d',
      },
    },
  },
});
