import {
  createRewardRuleSchema,
  rewardRuleIdParamsSchema,
  rewardRulePageQuerySchema,
  updateRewardRuleSchema,
} from '@internal/shared';
import { RewardErrors } from '@server/shared/reward';
import Elysia from 'elysia';

import { appContext } from '../../context';

export const rewardRuleRoute = new Elysia({
  name: 'RewardRuleRoute',
  prefix: '/rules',
  detail: {
    tags: ['RewardRule'],
  },
})
  .use(appContext)
  .error(RewardErrors)
  .get(
    '/',
    ({ query, rewardRuleUseCase }) => {
      return rewardRuleUseCase.page(query);
    },
    {
      query: rewardRulePageQuerySchema,
      requiredAuth: true,
      detail: {
        description: '积分奖励规则列表',
      },
    },
  )
  .get(
    '/:id',
    ({ params, rewardRuleUseCase }) => {
      return rewardRuleUseCase.get(params.id);
    },
    {
      params: rewardRuleIdParamsSchema,
      requiredAuth: true,
      detail: {
        description: '积分奖励规则详情',
      },
    },
  )
  .post(
    '/',
    ({ body, rewardRuleUseCase }) => {
      return rewardRuleUseCase.create(body);
    },
    {
      body: createRewardRuleSchema,
      requiredAuth: true,
      detail: {
        description: '创建积分奖励规则',
      },
    },
  )
  .put(
    '/:id',
    ({ body, params, rewardRuleUseCase }) => {
      return rewardRuleUseCase.update(params.id, body);
    },
    {
      body: updateRewardRuleSchema,
      params: rewardRuleIdParamsSchema,
      requiredAuth: true,
      detail: {
        description: '更新积分奖励规则',
      },
    },
  )
  .patch(
    '/:id/enable',
    ({ params, rewardRuleUseCase }) => {
      return rewardRuleUseCase.enable(params.id);
    },
    {
      params: rewardRuleIdParamsSchema,
      requiredAuth: true,
      detail: {
        description: '启用积分奖励规则',
      },
    },
  )
  .patch(
    '/:id/disable',
    ({ params, rewardRuleUseCase }) => {
      return rewardRuleUseCase.disable(params.id);
    },
    {
      params: rewardRuleIdParamsSchema,
      requiredAuth: true,
      detail: {
        description: '停用积分奖励规则',
      },
    },
  )
  .delete(
    '/:id',
    ({ params, rewardRuleUseCase }) => {
      return rewardRuleUseCase.remove(params.id);
    },
    {
      params: rewardRuleIdParamsSchema,
      requiredAuth: true,
      detail: {
        description: '删除积分奖励规则',
      },
    },
  );
