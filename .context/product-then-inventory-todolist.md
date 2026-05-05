# 商品模块优先开发 TODO

> 结论：先完成商品模块，再开发库存模块。库存扣减、恢复、调整都依赖商品的状态、价格、积分类型、兑换限制和发货方式。

## 第一阶段：商品模块基础能力

- [x] 梳理现有数据库表
  - [x] 确认 `servers/db/src/schema/product.ts` 字段是否满足当前商品需求
  - [x] 确认商品状态流转：`draft -> active -> disabled -> archived`
  - [x] 确认 `stock = null` 是否表示不限库存
  - [x] 确认 `perUserLimit = null` 是否表示不限兑换次数
  - [x] 确认 `deliveryType` 的 `manual` / `automatic` 业务含义
- [x] 新增共享请求 schema
  - [x] 新增 `shared/schema/product.ts`
  - [x] 定义 `productIdParamsSchema`
  - [x] 定义商品创建 schema
  - [x] 定义商品更新 schema
  - [x] 定义商品列表查询 schema
  - [x] 从 `shared/schema/index.ts` 导出商品 schema
- [x] 新增共享服务端商品模块
  - [x] 新增 `servers/shared/src/modules/product/index.ts`
  - [x] 新增 `repository.ts`
  - [x] 新增 `usecase.ts`
  - [x] 新增 `errors.ts`
  - [x] 确认无需单独 `model.ts`，直接使用 `@server/db/schema` 推断类型
  - [x] 在 `servers/shared/package.json` 增加 `./product` export
- [x] 实现商品 Repository
  - [x] `list` 支持分页、状态筛选、积分类型筛选、关键词搜索
  - [x] `findById` 过滤软删除商品
  - [x] `create`
  - [x] `update`
  - [x] `enable`
  - [x] `disable`
  - [x] `archive`
  - [x] `softDelete`
- [x] 实现商品 UseCase
  - [x] 创建商品前校验积分类型存在且可用
  - [x] 创建商品时校验价格为正整数
  - [x] 创建商品时校验库存为 `null` 或非负整数
  - [x] 创建商品时校验每用户限制为 `null` 或正整数
  - [x] 更新商品时复用字段校验
  - [x] 禁止归档商品重新上架，除非明确允许
  - [x] 返回适合 API 的商品 DTO

## 第二阶段：管理端商品 API

- [x] 新增 `servers/admin/src/modules/product`
  - [x] 新增 `context.ts`
  - [x] 新增 `index.ts`
  - [x] 注册商品模块错误
  - [x] 使用 `@server/shared/product`
- [x] 挂载管理端路由
  - [x] `GET /products` 商品列表
  - [x] `GET /products/:id` 商品详情
  - [x] `POST /products` 创建商品
  - [x] `PUT /products/:id` 更新商品
  - [x] `PATCH /products/:id/enable` 上架商品
  - [x] `PATCH /products/:id/disable` 下架商品
  - [x] `PATCH /products/:id/archive` 归档商品
  - [x] `DELETE /products/:id` 删除商品
- [x] 接入 `servers/admin/src/app.ts`
- [x] 管理端商品路由全部启用 `requiredAuth`

## 第三阶段：商品测试

- [x] 新增共享商品用例测试
  - [x] 创建商品成功
  - [x] 积分类型不存在时创建失败
  - [x] 积分类型禁用时创建失败
  - [x] 价格非法时创建失败
  - [x] 库存非法时创建失败
  - [x] 每用户限制非法时创建失败
  - [x] 列表排序稳定
  - [x] 商品状态流转符合预期
- [x] 新增管理端商品路由测试
  - [x] 未登录访问被拦截
  - [x] 创建 body 校验
  - [x] 更新 params/body 校验
  - [x] 查询不存在商品返回业务错误
  - [x] 上架、下架、归档接口成功

## 第四阶段：库存模块设计准备

- [x] 基于商品模块确定库存边界
  - [x] 不限库存商品是否跳过库存流水：不跳过，记录流水但不改变 `stock = null`
  - [x] 有限库存商品是否必须记录每次变动流水：必须记录
  - [x] 库存扣减是否和订单创建放在同一个事务：库存 UseCase 支持事务内原子扣减，后续订单模块应在同一事务内调用库存变更能力
  - [x] 库存恢复是否和订单退款放在同一个事务：库存 UseCase 支持事务内恢复，后续退款模块应在同一事务内调用库存变更能力
  - [x] 手动调整库存是否允许调整为 `null`：当前不允许，只支持有限库存数值增减；不限库存保持 `null`
- [x] 明确库存变动类型
  - [x] `consume`：用户兑换扣减库存
  - [x] `restore`：取消/退款恢复库存
  - [x] `adjust`：管理员手动调整库存
- [x] 明确库存异常
  - [x] 商品不存在
  - [x] 商品未上架
  - [x] 库存不足
  - [x] 幂等键重复
  - [x] 库存变动方向与类型不匹配

## 第五阶段：库存模块实现

- [x] 新增共享服务端库存模块
  - [x] 新增 `servers/shared/src/modules/inventory`
  - [x] 新增库存 Repository
  - [x] 新增库存 UseCase
  - [x] 新增库存 Errors
  - [x] 在 `servers/shared/package.json` 增加 `./inventory` export
- [x] 实现库存核心能力
  - [x] 扣减库存
  - [x] 恢复库存
  - [x] 手动调整库存
  - [x] 写入 `productStockMovements`
  - [x] 支持 `idempotencyKey`
  - [x] 保证库存不会扣成负数
  - [x] 不限库存商品处理策略落地
- [x] 新增管理端库存 API
  - [x] `GET /products/:id/stock-movements`
  - [x] `POST /products/:id/stock-adjustments`
- [x] 新增库存测试
  - [x] 有限库存扣减成功
  - [x] 库存不足扣减失败
  - [x] 不限库存商品行为符合设计
  - [x] 恢复库存成功
  - [x] 手动调整库存成功
  - [x] 幂等键重复不会重复变更库存
  - [x] 并发扣减不会超扣

## 第六阶段：后续接订单兑换

- [ ] 开发订单创建前，商品模块需提供可兑换商品查询能力
- [ ] 订单创建事务中同时完成：
  - [ ] 校验商品可兑换
  - [ ] 校验用户兑换次数限制
  - [ ] 扣减库存
  - [ ] 扣减积分
  - [ ] 创建订单
- [ ] 订单取消/退款事务中同时完成：
  - [ ] 恢复库存
  - [ ] 返还积分
  - [ ] 更新订单状态

## 验证

- [ ] 跑 `vp check`
- [ ] 跑 `vp test`
- [ ] 检查是否需要运行 `vite.config.ts` tasks 或 `package.json` scripts
