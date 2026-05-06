import { createAppContext } from '@server/shared/context';

import { config } from '#server/admin/config';

import { db } from './db';
import { AdminRepository } from './modules/admin/repository';
import { AdminAuthUseCase } from './modules/auth/usecase';

function createAdminAppContext() {
  const { appContext, instances } = createAppContext({ db, secret: config.JWT_SECRET });

  const adminRepo = new AdminRepository(db);

  const adminAuthUseCase = new AdminAuthUseCase({
    db,
    adminRepo,
    authUseCase: instances.usecase.auth,
  });

  return appContext.decorate('adminAuthUseCase', adminAuthUseCase);
}

export const appContext = createAdminAppContext();
