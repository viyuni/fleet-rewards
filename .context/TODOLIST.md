# 积分模块测试任务清单

## 第一优先级：余额安全

- [x] 新增 `servers/shared/src/modules/point/__tests__/point-amount-policy.test.ts`
- [x] 覆盖 `PointAmountPolicy.assertPositive`
  - [x] 正整数通过
  - [x] `0` 抛 `PointAmountInvalidError`
  - [x] 负数抛 `PointAmountInvalidError`
  - [x] 小数抛 `PointAmountInvalidError`
  - [x] `NaN` 抛 `PointAmountInvalidError`
- [x] 覆盖 `PointAmountPolicy.assertNonZero`
  - [x] 正数通过
  - [x] 负数通过
  - [x] `0` 抛 `PointAmountInvalidError`
  - [x] 确认是否需要拦截小数；如果积分必须是整数，补实现或补 failing test 暴露问题
- [x] 新增 `servers/shared/src/modules/point/__tests__/point-account.repo.test.ts`
- [ ] 覆盖 `PointAccountRepository.ensureAccount`
  - [x] 首次调用创建账户
  - [x] 默认 `balance = 0`
  - [x] 默认 `status = active`
  - [x] 重复调用同一 `userId + pointTypeId` 不重复创建
  - [ ] 查询不到账户时抛 `PointAccountEnsureFailedError`
- [x] 覆盖 `PointAccountRepository.increaseBalance`
  - [x] active 账户可以增加余额
  - [x] suspended 账户可以增加余额
  - [x] banned 账户不能增加，抛 `PointAccountUpdateFailedError`
  - [x] 非正整数金额抛 `PointAmountInvalidError`
  - [x] 返回更新后的账户余额
- [x] 覆盖 `PointAccountRepository.decreaseBalance`
  - [x] active 且余额足够时扣减成功
  - [x] 余额不足时抛 `PointBalanceInsufficientError`
  - [x] suspended 账户不能消费
  - [x] banned 账户不能消费
  - [x] 非正整数金额抛 `PointAmountInvalidError`
  - [x] 验证余额不会扣成负数

## 第二优先级：积分变动用例

- [x] 新增 `servers/shared/src/modules/point/__tests__/point-account.usecase.test.ts`
- [ ] 覆盖 `PointUseCase.changeBalance`
  - [x] 用户不存在或不可用时抛 `UserUnavailableError`
  - [x] `delta = 0` 抛 `PointAmountInvalidError`
  - [x] 正 `delta` 会确保账户存在并增加余额
  - [x] 负 `delta` 会确保账户存在并扣减余额
  - [x] 每次成功变动都会写入 `pointTransactions`
  - [x] 流水中的 `userId` 正确
  - [x] 流水中的 `pointAccountId` 正确
  - [x] 流水中的 `pointTypeId` 正确
  - [x] 流水中的 `type` 正确
  - [x] 流水中的 `delta` 正确
  - [x] 流水中的 `balanceBefore` 正确
  - [x] 流水中的 `balanceAfter` 正确
  - [x] 流水中的 `sourceType` 和 `sourceId` 正确
  - [x] 流水中的 `idempotencyKey` 正确
  - [x] 流水中的 `remark` 正确
  - [x] 流水中的 `metadata` 正确
  - [x] `type = reversal` 时写入 `reversalOfTransactionId`
  - [x] 非 reversal 类型不写入 `reversalOfTransactionId`
  - [ ] 确认是否禁止 `type` 与 `delta` 方向不匹配，例如 `consume` 使用正数 `delta`

## 第三优先级：积分类型业务

- [x] 新增 `servers/shared/src/modules/point/__tests__/point-type.usecase.test.ts`
- [x] 覆盖 `PointTypeUseCase.list`
  - [x] 按 `sort asc, createdAt asc` 返回
- [x] 覆盖 `PointTypeUseCase.get`
  - [x] 找到时返回积分类型
  - [x] 找不到时抛 `PointTypeNotFoundError`
- [x] 覆盖 `PointTypeUseCase.create`
  - [x] 编码不存在时创建成功
  - [x] 编码重复时抛 `PointTypeCodeExistsError`
- [x] 覆盖 `PointTypeUseCase.update`
  - [x] 找到时更新成功
  - [x] 找不到时抛 `PointTypeNotFoundError`
- [x] 覆盖 `PointTypeUseCase.enable`
  - [x] 找不到时抛 `PointTypeNotFoundError`
  - [x] 已 active 时直接返回原对象
  - [x] disabled 时更新为 active
- [x] 覆盖 `PointTypeUseCase.disable`
  - [x] 找不到时抛 `PointTypeNotFoundError`
  - [x] 已 disabled 时直接返回原对象
  - [x] active 时更新为 disabled

## 第四优先级：管理端路由

- [x] 新增积分类型路由测试
- [x] 未登录访问 `/point-types` 相关接口应被 auth 拦截
- [x] `GET /point-types` 返回列表
- [ ] `GET /point-types/:id` 校验参数
- [x] `GET /point-types/:id` 不存在时返回业务错误
- [x] `POST /point-types` 校验 body
- [x] `POST /point-types` 编码重复时返回业务错误
- [x] `POST /point-types` 成功创建
- [x] `PUT /point-types/:id` 校验 body 和 params
- [x] `PUT /point-types/:id` 成功更新
- [x] `PATCH /point-types/:id/enable` 成功启用
- [x] `PATCH /point-types/:id/enable` 已启用时幂等返回
- [x] `PATCH /point-types/:id/disable` 成功停用
- [x] `PATCH /point-types/:id/disable` 已停用时幂等返回

## 测试验证

- [ ] 跑 `vp check`
- [ ] 跑 `vp test`
- [ ] 检查是否还有 `vite.config.ts` tasks 或 `package.json` scripts 需要通过 `vp run <script>` 验证
