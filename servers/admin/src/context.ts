import { createAppContext } from '@server/shared/context';
import Elysia from 'elysia';

import { env } from '#server/admin/utils';

import { db } from './db';
import { AdminRepository } from './modules/admin/repository';
import { AdminUseCase } from './modules/admin/usecase';
import { AdminAuthUseCase } from './modules/auth/usecase';

const {
  context,
  container: {
    useCases: { authUseCase },
  },
} = createAppContext({
  db,
  env,
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

/**
 * 真实运行时上下文。
 *
 * 只能在根 app 挂载一次。
 */
export const appRuntimeContext = context.decorate({
  adminAuthUseCase,
  adminUseCase,
});

/**
 * 业务模块上下文。
 *
 * 仅用于业务模块获得 appRuntimeContext 的类型提示。
 * 运行时为空。
 *
 * 根 app 必须先 `.use(appRuntimeContext)`，再 `.use(业务模块)`。
 */
export const appContext = new Elysia({
  name: 'AdminAppContextTypeOnly',
}) as unknown as typeof appRuntimeContext;

// 初始化默认管理员
appRuntimeContext.onStart(() => {
  adminUseCase.initDefaultAdmin();
});
