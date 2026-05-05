import { describe, expect, it } from 'bun:test';

import { Elysia } from 'elysia';

import { setupApp } from '../../../setup-app';
import { createAuthModule } from '../index';

const { authGuard, authenticator } = createAuthModule('jwt-test-secret');
const app = setupApp(new Elysia())
  .use(authGuard)
  .get('/me', ({ userId }) => ({ userId }), {
    requiredAuth: true,
  });

async function responseBody(response: Response) {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return { message: text };
  }
}

describe('JWT 认证宏', () => {
  it('未登录访问会被认证拦截', async () => {
    const response = await app.handle(new Request('http://localhost/me'));
    const body = await responseBody(response);

    expect(response.status).toBe(401);
    expect(body.code ?? body.message).toBeTruthy();
  });

  it('Authorization 格式错误时会被认证拦截', async () => {
    const response = await app.handle(
      new Request('http://localhost/me', {
        headers: {
          authorization: 'invalid-token',
        },
      }),
    );
    const body = await responseBody(response);

    expect(response.status).toBe(401);
    expect(body.code ?? body.message).toBeTruthy();
  });

  it('认证通过后会注入 userId', async () => {
    const userId = crypto.randomUUID();
    const token = await authenticator.sign(userId);
    const response = await app.handle(
      new Request('http://localhost/me', {
        headers: {
          authorization: `Bearer ${token}`,
        },
      }),
    );
    const body = await responseBody(response);

    expect(response.status).toBe(200);
    expect(body.userId).toBe(userId);
  });
});
