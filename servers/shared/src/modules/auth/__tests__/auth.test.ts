import { describe, expect, it, mock } from 'bun:test';

import Elysia from 'elysia';

import { createAuthGuard } from '../index';
import { AuthUseCase } from '../usecase';

describe('AuthUseCase', () => {
  it('签发和解析对象 JWT payload', async () => {
    const authUseCase = new AuthUseCase('test-secret');

    const token = await authUseCase.sign({
      userId: 'admin-id',
      role: 'superAdmin',
    });
    const payload = await authUseCase.verify(token);

    expect(payload).toEqual({
      userId: 'admin-id',
      role: 'superAdmin',
    });
  });

  it('解析没有 role 的 user token', async () => {
    const authUseCase = new AuthUseCase('test-secret');

    const token = await authUseCase.sign({
      userId: 'user-id',
    });
    const payload = await authUseCase.verify(token);

    expect(payload).toEqual({
      userId: 'user-id',
      role: undefined,
    });
  });
});

describe('requiredSuperAdminAuth', () => {
  function createApp(payload: { userId: string; role?: string }) {
    const authUseCase = {
      verify: mock(async () => payload),
    } as any;

    const app = new Elysia().use(createAuthGuard(authUseCase)).get(
      '/super',
      ({ userId, role }) => ({
        userId,
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
      userId: 'admin-id',
      role: 'superAdmin',
    });

    const response = await app.handle(
      new Request('http://localhost/super', {
        headers: {
          cookie: 'authorization=token',
        },
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      userId: 'admin-id',
      role: 'superAdmin',
    });
    expect(authUseCase.verify).toHaveBeenCalledWith('token');
  });

  it('拒绝普通管理员访问', async () => {
    const { app } = createApp({
      userId: 'admin-id',
      role: 'admin',
    });

    const response = await app.handle(
      new Request('http://localhost/super', {
        headers: {
          cookie: 'authorization=token',
        },
      }),
    );

    expect(response.status).toBe(401);
    expect(await response.text()).toContain('Not super admin');
  });

  it('拒绝没有角色的 user token', async () => {
    const { app } = createApp({
      userId: 'user-id',
    });

    const response = await app.handle(
      new Request('http://localhost/super', {
        headers: {
          cookie: 'authorization=token',
        },
      }),
    );

    expect(response.status).toBe(401);
  });

  it('缺少 token 时拒绝访问', async () => {
    const { app } = createApp({
      userId: 'admin-id',
      role: 'superAdmin',
    });

    const response = await app.handle(new Request('http://localhost/super'));

    expect(response.status).toBe(401);
    expect(await response.text()).toContain('Missing auth cookie');
  });
});
