import {
  CreatePointTypeSchema,
  PointTypeIdParamsSchema,
  UpdatePointTypeSchema,
} from '@internal/shared/point-type';
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
    '/:pointTypeId',
    ({ params, pointTypeUseCase }) => {
      return pointTypeUseCase.get(params.pointTypeId);
    },
    {
      params: PointTypeIdParamsSchema,
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
      body: CreatePointTypeSchema,
      requiredAuth: true,
      detail: {
        description: '创建积分类型',
      },
    },
  )
  .put(
    '/:pointTypeId',
    ({ body, params, pointTypeUseCase }) => {
      return pointTypeUseCase.update(params.pointTypeId, body);
    },
    {
      body: UpdatePointTypeSchema,
      params: PointTypeIdParamsSchema,
      requiredAuth: true,
      detail: {
        description: '更新积分类型',
      },
    },
  )
  .patch(
    '/:pointTypeId/enable',
    ({ params, pointTypeUseCase }) => {
      return pointTypeUseCase.enable(params.pointTypeId);
    },
    {
      params: PointTypeIdParamsSchema,
      requiredAuth: true,
      detail: {
        description: '启用积分类型',
      },
    },
  )
  .patch(
    '/:pointTypeId/disable',
    ({ params, pointTypeUseCase }) => {
      return pointTypeUseCase.disable(params.pointTypeId);
    },
    {
      params: PointTypeIdParamsSchema,
      requiredAuth: true,
      detail: {
        description: '停用积分类型',
      },
    },
  );
