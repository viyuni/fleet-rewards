import {
  convertPointSchema,
  createPointConversionRuleSchema,
  pointConversionRuleIdParamsSchema,
  updatePointConversionRuleSchema,
} from '@internal/shared/schema';
import Elysia from 'elysia';

import { appContext } from '../../context';

export const pointConversionRoute = new Elysia({
  name: 'PointConversionRoute',
  prefix: '/conversions',
  detail: {
    tags: ['PointConversion'],
  },
})

  .use(appContext)
  .get(
    '/',
    ({ pointConversionUseCase }) => {
      return pointConversionUseCase.list();
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
    ({ body, pointConversionUseCase }) => {
      return pointConversionUseCase.create(body);
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
    ({ body, params, pointConversionUseCase }) => {
      return pointConversionUseCase.update(params.id, body);
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
    ({ params, pointConversionUseCase }) => {
      return pointConversionUseCase.enable(params.id);
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
    ({ params, pointConversionUseCase }) => {
      return pointConversionUseCase.disable(params.id);
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
    ({ body, pointConversionUseCase }) => {
      return pointConversionUseCase.convert(body);
    },
    {
      body: convertPointSchema,
      requiredAuth: true,
      detail: {
        description: '执行积分转换',
      },
    },
  );
