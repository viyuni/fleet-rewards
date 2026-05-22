import { treaty, type Treaty } from '@elysia/eden';
import type { Elysia } from '@server/app';
import ky from 'ky';

type AnyElysia = Elysia<any, any, any, any, any, any, any>;

type AuthRefresh<App extends AnyElysia> = (client: Treaty.Create<App>) => Promise<unknown>;

export function createApiClient<const App extends AnyElysia>(
  apiBaseUrl: string,
  authRefresh: AuthRefresh<App>,
) {
  const refreshClient = treaty<App>(apiBaseUrl, {
    throwHttpError: true,

    fetch: {
      credentials: 'include',
    },
  });

  let refreshPromise: Promise<boolean> | null = null;

  async function refreshOnce() {
    refreshPromise ??= Promise.resolve()
      .then(() => authRefresh(refreshClient))
      .then(() => true)
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });

    return refreshPromise;
  }

  async function refreshWithLock() {
    if (!import.meta.client || !('locks' in navigator)) {
      return refreshOnce();
    }

    return navigator.locks.request('guard-plus:auth-refresh', refreshOnce);
  }

  const fetcher = ky.create({
    credentials: 'include',
    retry: {
      limit: 0,
    },
    hooks: {
      afterResponse: [
        async ({ request, response }) => {
          if (response.status !== 401) {
            return response;
          }

          const refreshed = await refreshWithLock();

          if (!refreshed) {
            return response;
          }

          return fetcher(request);
        },
      ],
    },
  });

  return treaty<App>(apiBaseUrl, {
    throwHttpError: true,
    fetcher: fetcher as unknown as typeof fetch,
  });
}
