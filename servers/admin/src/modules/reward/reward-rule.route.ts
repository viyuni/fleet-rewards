import {
  createRewardRuleSchema,
  rewardRuleIdParamsSchema,
  rewardRulePageQuerySchema,
  updateRewardRuleSchema,
} from '@internal/shared';
import { rewardModule } from '@server/shared/reward';
import Elysia from 'elysia';

import { db } from '#server/admin/db';
import { authGuard } from '#server/admin/modules/auth';

export const rewardRuleRoute = new Elysia({
  name: 'RewardRuleRoute',
  prefix: '/rules',
  detail: {
    tags: ['RewardRule'],
  },
})
  .use(authGuard)
  .use(rewardModule({ db }))
  .get(
    '/',
    ({ query, rewardRule }) => {
      return rewardRule.page(query);
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
    ({ params, rewardRule }) => {
      return rewardRule.get(params.id);
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
    ({ body, rewardRule }) => {
      return rewardRule.create(body);
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
    ({ body, params, rewardRule }) => {
      return rewardRule.update(params.id, body);
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
    ({ params, rewardRule }) => {
      return rewardRule.enable(params.id);
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
    ({ params, rewardRule }) => {
      return rewardRule.disable(params.id);
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
    ({ params, rewardRule }) => {
      return rewardRule.remove(params.id);
    },
    {
      params: rewardRuleIdParamsSchema,
      requiredAuth: true,
      detail: {
        description: '删除积分奖励规则',
      },
    },
  );
