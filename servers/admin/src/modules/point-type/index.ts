import {
  createPointTypeSchema,
  pointTypeIdParamsSchema,
  updatePointTypeSchema,
} from '@internal/shared/schemas';
import { pointPlugin } from '@server/shared/point';
import Elysia from 'elysia';

import { db } from '../../db';
import { authGuard } from '../auth';

export const pointType = new Elysia({
  name: 'PointTypeRoute',
  prefix: '/point-types',
  detail: {
    tags: ['PointType'],
  },
})
  .use(authGuard)
  .use(pointPlugin({ db }))
  .get(
    '/',
    ({ pointType }) => {
      return pointType.list();
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
    ({ params, pointType }) => {
      return pointType.get(params.id);
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
    ({ body, pointType }) => {
      return pointType.create(body);
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
    ({ body, params, pointType }) => {
      return pointType.update(params.id, body);
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
    ({ params, pointType }) => {
      return pointType.enable(params.id);
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
    ({ params, pointType }) => {
      return pointType.disable(params.id);
    },
    {
      params: pointTypeIdParamsSchema,
      requiredAuth: true,
      detail: {
        description: '停用积分类型',
      },
    },
  );
