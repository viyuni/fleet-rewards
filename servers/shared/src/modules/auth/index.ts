export { JwtAuthenticator } from './authenticator';
import { Elysia } from 'elysia';

import { UnauthorizedError } from '../../errors';
import { JwtAuthenticator } from './authenticator';

export const createAuthModule = (secret: string) => {
  const authenticator = new JwtAuthenticator(secret);

  const authGuard = new Elysia({ name: 'AuthGuardModule' }).macro('requiredAuth', {
    // OpenAPI
    detail: {
      security: [{ requiredAuth: [] }],
      parameters: [
        {
          name: 'Authorization',
          in: 'header',
          required: true,
          description: 'Authorization header',
          schema: {
            type: 'string',
            example: 'Bearer <token>',
          },
        },
      ],
    },

    async resolve({ headers }) {
      const authorization = headers['authorization'] || headers['Authorization'];

      if (!authorization) {
        throw new UnauthorizedError('Missing authorization header');
      }

      if (!/^Bearer\s\S+$/i.test(authorization)) {
        throw new UnauthorizedError('Invalid authorization header');
      }

      const token = authorization.replace(/^Bearer\s+/i, '');
      const userId = await authenticator.verify(token);

      return {
        userId,
      };
    },
  });

  return { authGuard, authenticator };
};
