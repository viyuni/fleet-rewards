import Elysia from 'elysia';

import { UnauthorizedError } from '../../errors';
import { AUTH_COOKIE_NAME } from './constants';
import type { AuthUseCase } from './usecase';

export * from './usecase';
export * from './constants';

export const createAuthGuard = (authUseCase: AuthUseCase) => {
  const authGuard = new Elysia({ name: 'AuthGuard' }).macro('requiredAuth', {
    // OpenAPI
    detail: {
      security: [{ requiredAuth: [] }],
      parameters: [
        {
          name: AUTH_COOKIE_NAME,
          in: 'cookie',
          required: false,
          description: 'JWT Cookie',
          schema: {
            type: 'string',
          },
        },
      ],
    },

    async resolve({ cookie }) {
      const token = cookie?.[AUTH_COOKIE_NAME]?.value;

      if (!token || typeof token !== 'string') {
        throw new UnauthorizedError('Missing auth cookie, api key, or authorization header');
      }

      const userId = await authUseCase.verify(token);

      return {
        userId,
      };
    },
  });

  return authGuard;
};
