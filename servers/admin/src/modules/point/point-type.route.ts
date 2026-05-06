import {
  createPointTypeSchema,
  pointTypeIdParamsSchema,
  updatePointTypeSchema,
} from '@internal/shared/schema';
import Elysia from 'elysia';

import { appContext } from '../../context';

export const pointTypeRoute = new Elysia({
  name: 'PointTypeRoute',
  prefix: '/types',
  detail: {
    tags: ['PointType'],
  },
})
  .use(appContext)
  .get(
    '/',
    ({ pointTypeUseCase }) => {
      return pointTypeUseCase.list();
    },
    {
      requiredAuth: true,

      detail: {
        description: '积分类型列表',
      },
    },
  )
  .get(
    '/:id',
    ({ params, pointTypeUseCase }) => {
      return pointTypeUseCase.get(params.id);
    },
    {
      params: pointTypeIdParamsSchema,
      requiredAuth: true,
      detail: {
        description: '积分类型详情',
      },
    },
  )
  .post(
    '/',
    ({ body, pointTypeUseCase }) => {
      return pointTypeUseCase.create(body);
    },
    {
      body: createPointTypeSchema,
      requiredAuth: true,
      detail: {
        description: '创建积分类型',
      },
    },
  )
  .put(
    '/:id',
    ({ body, params, pointTypeUseCase }) => {
      return pointTypeUseCase.update(params.id, body);
    },
    {
      body: updatePointTypeSchema,
      params: pointTypeIdParamsSchema,
      requiredAuth: true,
      detail: {
        description: '更新积分类型',
      },
    },
  )
  .patch(
    '/:id/enable',
    ({ params, pointTypeUseCase }) => {
      return pointTypeUseCase.enable(params.id);
    },
    {
      params: pointTypeIdParamsSchema,
      requiredAuth: true,
      detail: {
        description: '启用积分类型',
      },
    },
  )
  .patch(
    '/:id/disable',
    ({ params, pointTypeUseCase }) => {
      return pointTypeUseCase.disable(params.id);
    },
    {
      params: pointTypeIdParamsSchema,
      requiredAuth: true,
      detail: {
        description: '停用积分类型',
      },
    },
  );
