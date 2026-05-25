import { describe, expect, it, mock } from 'bun:test';

import Elysia from 'elysia';

import { createAuthGuard } from '../index';
import { AuthUseCase } from '../usecase';

function createAuthUseCase() {
  const sessions = new Map<string, { accountId: string; role: 'user' | 'admin' | 'superAdmin' }>();
  const authSessionRepo = {
    create: mock(async (accountId: string, role: 'user' | 'admin' | 'superAdmin') => {
      const sessionId = `${role}-${accountId}-session`;
      sessions.set(`${role}:${sessionId}`, { accountId, role });

      return {
        accountId,
        role,
        sessionId,
        createdAt: new Date().toISOString(),
      };
    }),
    find: mock(async (role: 'user' | 'admin' | 'superAdmin', sessionId: string) => {
      const session = sessions.get(`${role}:${sessionId}`);

      if (!session) return null;

      return {
        ...session,
        sessionId,
        createdAt: new Date().toISOString(),
      };
    }),
    delete: mock(async (role: 'user' | 'admin' | 'superAdmin', sessionId: string) => {
      sessions.delete(`${role}:${sessionId}`);
    }),
  } as any;

  return new AuthUseCase('test-secret', authSessionRepo);
}

describe('AuthUseCase', () => {
  it('签发和解析对象 JWT payload', async () => {
    const authUseCase = createAuthUseCase();

    const { accessToken } = await authUseCase.createSessionTokenPair({
      id: 'admin-id',
      role: 'superAdmin',
    });
    const payload = await authUseCase.verify(accessToken);

    expect(payload).toEqual({
      id: 'admin-id',
      role: 'superAdmin',
      sid: 'superAdmin-admin-id-session',
    });
  });

  it('解析没有 role 的 user token', async () => {
    const authUseCase = createAuthUseCase();

    const { accessToken } = await authUseCase.createSessionTokenPair({
      id: 'user-id',
    });
    const payload = await authUseCase.verify(accessToken);

    expect(payload).toEqual({
      id: 'user-id',
      role: 'user',
      sid: 'user-user-id-session',
    });
  });

  it('使用 refreshToken 刷新 AccessToken', async () => {
    const authUseCase = createAuthUseCase();

    const { refreshToken } = await authUseCase.createSessionTokenPair({
      id: 'user-id',
      role: 'user',
    });
    const accessToken = await authUseCase.refreshAccessToken(refreshToken);
    const payload = await authUseCase.verifyAccessToken(accessToken);

    expect(payload).toEqual({
      id: 'user-id',
      role: 'user',
      sid: 'user-user-id-session',
    });
  });

  it('拒绝把 accessToken 当 refreshToken 使用', async () => {
    const authUseCase = createAuthUseCase();

    const { accessToken } = await authUseCase.createSessionTokenPair({
      id: 'user-id',
      role: 'user',
    });

    await expect(authUseCase.refreshAccessToken(accessToken)).rejects.toThrow();
  });
});

describe('requiredSuperAdminAuth', () => {
  function createApp(payload: { id: string; role?: string; sid: string }) {
    const authUseCase = {
      verify: mock(async () => payload),
    } as any;

    const app = new Elysia().use(createAuthGuard(authUseCase)).get(
      '/super',
      ({ auth: { id, role } }) => ({
        id,
        role,
      }),
      {
        requiredSuperAdminAuth: true,
      },
    );

    return { app, authUseCase };
  }

  it('允许超级管理员访问', async () => {
    const { app, authUseCase } = createApp({
      id: 'admin-id',
      role: 'superAdmin',
      sid: 'session-id',
    });

    const response = await app.handle(
      new Request('http://localhost/super', {
        headers: {
          cookie: 'accessToken=token',
        },
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      id: 'admin-id',
      role: 'superAdmin',
    });
    expect(authUseCase.verify).toHaveBeenCalledWith('token');
  });

  it('拒绝普通管理员访问', async () => {
    const { app } = createApp({
      id: 'admin-id',
      role: 'admin',
      sid: 'session-id',
    });

    const response = await app.handle(
      new Request('http://localhost/super', {
        headers: {
          cookie: 'accessToken=token',
        },
      }),
    );

    expect(response.status).toBe(401);
    expect(await response.text()).toContain('未登录或登录已过期');
  });

  it('拒绝没有角色的 user token', async () => {
    const { app } = createApp({
      id: 'user-id',
      sid: 'session-id',
    });

    const response = await app.handle(
      new Request('http://localhost/super', {
        headers: {
          cookie: 'accessToken=token',
        },
      }),
    );

    expect(response.status).toBe(401);
  });

  it('缺少 token 时拒绝访问', async () => {
    const { app } = createApp({
      id: 'admin-id',
      role: 'superAdmin',
      sid: 'session-id',
    });

    const response = await app.handle(new Request('http://localhost/super'));

    expect(response.status).toBe(401);
    expect(await response.text()).toContain('未登录');
  });
});
