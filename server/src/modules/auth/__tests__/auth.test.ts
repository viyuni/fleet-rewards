import { describe, expect, it, mock } from 'bun:test';

import Elysia from 'elysia';

import { createAuthGuard } from '../index';
import { AuthUseCase } from '../usecase';

describe('AuthUseCase', () => {
  it('签发和解析对象 JWT payload', async () => {
    const authUseCase = new AuthUseCase('test-secret');

    const token = await authUseCase.sign({
      id: 'admin-id',
      role: 'superAdmin',
    });
    const payload = await authUseCase.verify(token);

    expect(payload).toEqual({
      id: 'admin-id',
      role: 'superAdmin',
    });
  });

  it('解析没有 role 的 user token', async () => {
    const authUseCase = new AuthUseCase('test-secret');

    const token = await authUseCase.sign({
      id: 'user-id',
    });
    const payload = await authUseCase.verify(token);

    expect(payload).toEqual({
      id: 'user-id',
      role: undefined,
    });
  });

  it('使用 refreshToken 刷新 accessToken', async () => {
    const authUseCase = new AuthUseCase('test-secret');

    const { refreshToken } = await authUseCase.signTokenPair({
      id: 'user-id',
      role: 'user',
    });
    const accessToken = await authUseCase.refreshAccessToken(refreshToken);
    const payload = await authUseCase.verifyAccessToken(accessToken);

    expect(payload).toEqual({
      id: 'user-id',
      role: 'user',
    });
  });

  it('拒绝把 accessToken 当 refreshToken 使用', async () => {
    const authUseCase = new AuthUseCase('test-secret');

    const accessToken = await authUseCase.signAccessToken({
      id: 'user-id',
      role: 'user',
    });

    await expect(authUseCase.refreshAccessToken(accessToken)).rejects.toThrow();
  });
});

describe('requiredSuperAdminAuth', () => {
  function createApp(payload: { id: string; role?: string }) {
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
    });

    const response = await app.handle(new Request('http://localhost/super'));

    expect(response.status).toBe(401);
    expect(await response.text()).toContain('未登录');
  });
});
