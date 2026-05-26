import { defineConfig } from 'vite-plus';

type CommandBuilder = {
  (...commands: string[]): string;
  with(command: string): CommandBuilder;
};

function createCommand(base: string, prevCommand = ''): CommandBuilder {
  const current = prevCommand.trim();

  const builder = ((...commands: string[]) => {
    return [base.trim(), current, ...commands.map(command => command.trim())]
      .filter(Boolean)
      .join(' ');
  }) as CommandBuilder;

  builder.with = (command: string) => {
    return createCommand(base, [current, command.trim()].filter(Boolean).join(' '));
  };

  return builder;
}

const bun = createCommand('bun');
const bunEnv = bun.with('--env-file=.env');
const bunTest = bun.with('--env-file=.env.test');
const dev = bunEnv.with('--no-clear-screen --watch');

const inputs = {
  admin: './src/apps/admin/index.ts',
  user: './src/apps/user/index.ts',
  event: './src/apps/event/index.ts',
} as const;

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
      dev: {
        cache: false,
        command: 'bun scripts/dev.ts',
      },
      'dev:admin': {
        cache: false,
        command: dev(inputs.admin),
      },
      'dev:user': {
        cache: false,
        command: dev(inputs.user),
      },
      'dev:event': {
        cache: false,
        command: dev(inputs.event),
      },
      build: {
        command: 'bun scripts/build.ts',
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
        command: bunTest('test --pass-with-no-tests'),
      },
      'db:generate': {
        command: bunEnv('drizzle-kit generate'),
      },
      'db:push': {
        cache: false,
        command: bunEnv('drizzle-kit push'),
      },
      'db:push:test': {
        cache: false,
        command: bunTest('drizzle-kit push'),
      },
      'db:seed': {
        cache: false,
        command: bunEnv('./src/db/seed.ts'),
      },
      'db:studio': {
        cache: false,
        command: bunEnv('drizzle-kit studio'),
      },
      'db:studio:test': {
        cache: false,
        command: bunTest('drizzle-kit studio'),
      },
      'docker-compose': {
        command: 'docker compose up -d',
      },
    },
  },
});
