import { expect, it, mock } from 'bun:test';

import type { AuthUseCase as SharedAuthUseCase, BiliRegisterUseCase } from '#modules/auth';
import type { BiliRegisterChallenge } from '#modules/auth/domain';
import type { RewardUseCase } from '#modules/reward';
import type { UserUseCase } from '#modules/user';
import { BadRequestError } from '#utils';

import { AuthUseCase } from '../usecase';

const input = {
  biliUid: '123456',
  biliRegisterCode: 'U-234567',
  username: 'tester',
  password: 'test_password',
};

function createUseCase(challenge: BiliRegisterChallenge | null) {
  const create = mock(async () => ({
    id: 'user-id',
    biliUid: input.biliUid,
    username: input.username,
  }));
  const replayRewardBiliGuardByUserId = mock(async () => ({
    total: 0,
    succeeded: 0,
    failed: 0,
  }));
  const consumeChallenge = mock(async () => challenge);
  const useCase = new AuthUseCase({
    authUseCase: {} as SharedAuthUseCase,
    biliRegisterUseCase: { consumeChallenge } as unknown as BiliRegisterUseCase,
    rewardUseCase: { replayRewardBiliGuardByUserId } as unknown as RewardUseCase,
    userUseCase: { create } as unknown as UserUseCase,
  });

  return {
    consumeChallenge,
    create,
    replayRewardBiliGuardByUserId,
    useCase,
  };
}

function matchedChallenge(biliUid = input.biliUid): BiliRegisterChallenge {
  return {
    status: 'matched',
    code: input.biliRegisterCode,
    verifierHash: 'verifier-hash',
    biliUid,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
  };
}

it('用户注册会拒绝失效的 UID 归属验证', async () => {
  const { create, useCase } = createUseCase(null);

  await expect(useCase.register(input, 'verifier')).rejects.toBeInstanceOf(BadRequestError);
  expect(create).not.toHaveBeenCalled();
});

it('用户注册会拒绝与验证结果不一致的 UID', async () => {
  const { create, useCase } = createUseCase(matchedChallenge('654321'));

  await expect(useCase.register(input, 'verifier')).rejects.toBeInstanceOf(BadRequestError);
  expect(create).not.toHaveBeenCalled();
});

it('用户注册验证 UID 后会创建用户并回放奖励', async () => {
  const { consumeChallenge, create, replayRewardBiliGuardByUserId, useCase } =
    createUseCase(matchedChallenge());

  await expect(useCase.register(input, 'verifier')).resolves.toMatchObject({
    id: 'user-id',
    biliUid: input.biliUid,
  });
  expect(consumeChallenge).toHaveBeenCalledWith(input.biliRegisterCode, 'verifier');
  expect(create).toHaveBeenCalledWith({
    biliUid: input.biliUid,
    username: input.username,
    password: input.password,
  });
  expect(replayRewardBiliGuardByUserId).toHaveBeenCalledWith('user-id');
});
