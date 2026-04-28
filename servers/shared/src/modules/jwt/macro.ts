import Elysia from 'elysia';

import { UnauthorizedError } from '../../errors';
import type { JwtAuthenticator } from './authenticator';

export const jwt = ({ authenticator }: { authenticator: JwtAuthenticator }) => {
  return new Elysia({ name: 'JwtModule' }).macro('requiredAuth', {
    detail: {
      security: [{ requiredAuth: [] }],
      parameters: [
        {
          name: 'Authorization',
          in: 'header',
          required: true,
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
};
