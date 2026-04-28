import Elysia from 'elysia';

import { db } from '#server/db';
import { config } from '#server/shared/config';
import { adminLoginSchema } from '#shared/schema';

import { jwt } from '../jwt';
import { JwtService } from '../jwt/service';
import * as AdminErrors from './errors';
import { AdminUseCase } from './usecase';

const jwtService = new JwtService(config.ADMIN_JWT_SECRET);

export const admin = new Elysia({
  name: 'Admin',
})
  .error(AdminErrors)
  .use(jwt({ service: jwtService }))
  .decorate('admin', new AdminUseCase(db, jwtService))
  .guard({
    beforeHandle({ userId }) {},
  })

  .post(
    '/login',
    ({ body, admin, userId }) => {
      return admin.login(body);
    },
    {
      requiredAuth: true,
      body: adminLoginSchema,
    },
  );
