type DevApp = {
  name: 'admin' | 'user' | 'event';
  color: string;
};

const reset = '\x1b[0m';

const apps = [
  { name: 'admin', color: Bun.color('#5EAAB5', 'ansi') ?? '' },
  { name: 'user', color: Bun.color('#E6CC77', 'ansi') ?? '' },
  { name: 'event', color: Bun.color('#D9739F', 'ansi') ?? '' },
] satisfies DevApp[];

type AppName = (typeof apps)[number]['name'];

function color(text: string, ansi: string) {
  return ansi ? `${ansi}${text}${reset}` : text;
}

function prefix(name: AppName, ansi: string) {
  return `${color(name.padEnd(5), ansi)} | `;
}

function shouldIgnoreLine(line: string) {
  return line.includes('is not in the project directory and will not be watched');
}

async function pipeLines(stream: ReadableStream<Uint8Array>, name: AppName, ansi: string) {
  const decoder = new TextDecoder();
  const reader = stream.getReader();

  let buffered = '';

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      buffered += decoder.decode();
      break;
    }

    buffered += decoder.decode(value, { stream: true });

    const lines = buffered.split(/\r?\n/);
    buffered = lines.pop() ?? '';

    for (const line of lines) {
      if (shouldIgnoreLine(line)) continue;
      console.log(`${prefix(name, ansi)}${line}`);
    }
  }

  if (buffered && !shouldIgnoreLine(buffered)) {
    console.log(`${prefix(name, ansi)}${buffered}`);
  }
}

function dev({ color: ansi, name }: DevApp) {
  const proc = Bun.spawn(
    ['bun', '--env-file=.env', '--no-clear-screen', '--watch', `./src/apps/${name}/index.ts`],
    {
      stdout: 'pipe',
      stderr: 'pipe',
    },
  );

  void pipeLines(proc.stdout, name, ansi);
  void pipeLines(proc.stderr, name, ansi);

  return proc;
}

const processes = apps.map(dev);

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    for (const proc of processes) {
      proc.kill(signal);
    }

    process.exit(0);
  });
}

const exits = await Promise.all(processes.map(proc => proc.exited));

process.exit(exits.some(code => code !== 0) ? 1 : 0);
