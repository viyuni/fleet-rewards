import { bearer } from '@elysia/bearer';
import Elysia from 'elysia';

import type { JwtService } from './service';

export const jwt = ({ service }: { service: JwtService }) => {
  return new Elysia({ name: 'Jwt' })
    .use(bearer())

    .resolve({ as: 'scoped' }, async ({ bearer }): Promise<{ userId: string | null }> => {
      if (!bearer)
        return {
          userId: null,
        };

      const userId = await service.verify(bearer);
      return {
        userId,
      };
    });
};
