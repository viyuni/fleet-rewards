import { createAppContext } from '@server/shared/context';

import { config } from '#server/admin/config';

import { db } from './db';
import { AdminRepository } from './modules/admin/repository';
import { AdminUseCase } from './modules/admin/usecase';
import { AdminAuthUseCase } from './modules/auth/usecase';

const {
  context,
  instances: {
    useCases: { authUseCase },
  },
} = createAppContext({
  db,
  config,
});

const adminRepo = new AdminRepository(db);
const adminUseCase = new AdminUseCase({
  adminRepo,
});

const adminAuthUseCase = new AdminAuthUseCase({
  db,
  adminRepo,
  authUseCase,
});

export const appContext = context.decorate({
  adminAuthUseCase,
  adminUseCase,
});

export function initDefaultAdmin() {
  return adminUseCase.initDefaultAdmin();
}
