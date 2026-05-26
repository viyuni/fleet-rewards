import { logger } from './logger';

export type Cleanup = () => void | Promise<void>;

export interface LifecycleOptions {
  timeoutMs?: number;
  exit?: boolean;
}

export function createLifecycle(options: LifecycleOptions = {}) {
  const { timeoutMs = 10_000, exit = true } = options;

  const cleanups: Cleanup[] = [];

  let installed = false;
  let closing = false;

  function onCleanup(cleanup: Cleanup) {
    cleanups.push(cleanup);

    return () => {
      const index = cleanups.indexOf(cleanup);

      if (index !== -1) {
        cleanups.splice(index, 1);
      }
    };
  }

  async function runWithTimeout(task: Promise<void>) {
    const timeout = new Promise<void>(resolve => {
      const timer = setTimeout(() => {
        logger.warn(`[lifecycle] cleanup timeout after ${timeoutMs}ms`);
        resolve();
      }, timeoutMs);

      timer.unref?.();
    });

    await Promise.race([task, timeout]);
  }

  async function shutdown(reason = 'manual') {
    if (closing) return;

    closing = true;

    logger.info?.(`[lifecycle] shutting down: ${reason}`);

    await runWithTimeout(
      (async () => {
        for (const cleanup of cleanups.toReversed()) {
          try {
            await cleanup();
          } catch (error) {
            logger.error(error, '[lifecycle] cleanup failed:');
          }
        }
      })(),
    );

    logger.info?.('[lifecycle] shutdown complete');
  }

  function install() {
    if (installed) return;

    installed = true;

    process.once('SIGINT', async () => {
      await shutdown('SIGINT');

      if (exit) {
        process.exit(0);
      }
    });

    process.once('SIGTERM', async () => {
      await shutdown('SIGTERM');

      if (exit) {
        process.exit(0);
      }
    });

    process.once('beforeExit', async () => {
      await shutdown('beforeExit');
    });
  }

  return {
    install,
    shutdown,
    onCleanup,
  };
}
