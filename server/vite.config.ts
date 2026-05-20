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
  run: {
    tasks: {
      queue: {
        command: 'bun bunqueue start',
      },
      'dev:admin': {
        command: 'bun --env-file=.env --watch ./src/apps/admin/index.ts',
      },
      'dev:user': {
        command: 'bun --env-file=.env --watch ./src/apps/user/index.ts',
      },
      'dev:event': {
        command: 'bun --env-file=.env ./src/apps/event/index.ts',
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
      build: {
        command: 'vpr build:admin && vpr build:user',
      },
      'build:admin': {
        command: 'bun build ./src/apps/admin/index.ts --compile --outfile dist/admin',
      },
      'build:user': {
        command: 'bun build ./src/apps/user/index.ts --compile --outfile dist/user',
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
    },
  },
});
