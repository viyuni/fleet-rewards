import {
  convertPointSchema,
  createPointConversionRuleSchema,
  pointConversionRuleIdParamsSchema,
  updatePointConversionRuleSchema,
} from '@internal/shared/schema';
import { pointModule } from '@server/shared/point';
import Elysia from 'elysia';

import { db } from '#server/admin/db';
import { authGuard } from '#server/admin/modules/auth';

export const pointConversionRoute = new Elysia({
  name: 'PointConversionRoute',
  prefix: '/conversions',
  detail: {
    tags: ['PointConversion'],
  },
})
  .use(authGuard)
  .use(pointModule({ db }))
  .get(
    '/',
    ({ pointConversion }) => {
      return pointConversion.list();
    },
    {
      requiredAuth: true,
      detail: {
        description: '积分转换规则列表',
      },
    },
  )

  .post(
    '/',
    ({ body, pointConversion }) => {
      return pointConversion.create(body);
    },
    {
      body: createPointConversionRuleSchema,
      requiredAuth: true,
      detail: {
        description: '创建积分转换规则',
      },
    },
  )
  .put(
    '/:id',
    ({ body, params, pointConversion }) => {
      return pointConversion.update(params.id, body);
    },
    {
      body: updatePointConversionRuleSchema,
      params: pointConversionRuleIdParamsSchema,
      requiredAuth: true,
      detail: {
        description: '更新积分转换规则',
      },
    },
  )
  .patch(
    '/:id/enable',
    ({ params, pointConversion }) => {
      return pointConversion.enable(params.id);
    },
    {
      params: pointConversionRuleIdParamsSchema,
      requiredAuth: true,
      detail: {
        description: '启用积分转换规则',
      },
    },
  )
  .patch(
    '/:id/disable',
    ({ params, pointConversion }) => {
      return pointConversion.disable(params.id);
    },
    {
      params: pointConversionRuleIdParamsSchema,
      requiredAuth: true,
      detail: {
        description: '停用积分转换规则',
      },
    },
  )
  .post(
    '/convert',
    ({ body, pointConversion }) => {
      return pointConversion.convert(body);
    },
    {
      body: convertPointSchema,
      requiredAuth: true,
      detail: {
        description: '执行积分转换',
      },
    },
  );
