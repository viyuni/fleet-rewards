import { fakerZH_CN as faker } from '@faker-js/faker';
import { seed as drizzleSeed } from 'drizzle-seed';

import { createDatabase, db } from '.';
import {
  admins,
  pointTypes,
  products,
  productStockMovements,
  users,
  type InsertPointType,
} from './schema';

const seedValue = 1270;
const userCount = 60;
const adminCount = 6;
const productsPerPointType = 12;
const stockMovementCount = 80;
const seedDefaultPassword = '123456789@qW';

faker.seed(seedValue);

const pointTypeData = [
  {
    name: '舰长积分',
    description: '开通舰长即可获得',
    icon: 'captain',
    status: 'active',
    sort: 400,
  },
  {
    name: '提督积分',
    description: '开通提督即可获得',
    icon: 'admiral',
    status: 'active',
    sort: 300,
  },
  {
    name: '总督积分',
    description: '开通总督即可获得',
    icon: 'governor',
    status: 'active',
    sort: 200,
  },
  {
    name: '活动积分',
    description: '特殊活动节日可获得',
    icon: 'activity',
    status: 'active',
    sort: 100,
  },
] satisfies InsertPointType[];

const productKinds = [
  ['周边礼包', '徽章、贴纸、明信片组合', 'manual'],
  ['直播间装扮', '直播间专属身份装扮', 'automatic'],
  ['限定头像框', '限时纪念头像框兑换', 'automatic'],
  ['签名收藏卡', '实体签名收藏卡', 'manual'],
  ['抽奖资格', '参与月度回馈抽奖', 'automatic'],
  ['生日礼盒', '生日主题纪念礼盒', 'manual'],
] as const;

function array<T>(count: number, create: (index: number) => T): T[] {
  return Array.from({ length: count }, (_, index) => create(index));
}

function uniqueArray<T>(count: number, create: (index: number) => T): T[] {
  const values = new Set<T>();

  while (values.size < count) {
    values.add(create(values.size));
  }

  return [...values];
}

function address() {
  return [
    faker.location.state(),
    faker.location.city(),
    faker.location.county(),
    faker.location.street(),
    `${faker.location.buildingNumber()}号`,
    faker.location.secondaryAddress(),
  ].join('');
}

const biliUids = array(userCount, index => (100000000 + index).toString());
const userNames = uniqueArray(userCount, index => `${faker.internet.username()}_${index + 1}`);
const userEmails = array(userCount, index => `seed-user-${index + 1}@example.com`);
const userPhones = array(
  userCount,
  index => `138${(seedValue * 100000 + index).toString().padStart(8, '0')}`,
);
const userAddresses = array(userCount, () => address());
const userRemarks = array(userCount, index =>
  faker.helpers.arrayElement([
    '资料完整用户',
    '高频兑换用户',
    '直播间活跃用户',
    '周边收藏用户',
    '新注册用户',
    '客服备注用户',
    `批量导入样例 ${index + 1}`,
  ]),
);
const userPhoneHashes = array(userCount, index => `seed-phone-hash-${index + 1}`);

const adminUids = array(adminCount, index => `admin-${(index + 1).toString().padStart(2, '0')}`);
const adminNames = [
  '系统管理员',
  '运营管理员',
  '客服管理员',
  '商品管理员',
  '审计管理员',
  '风控管理员',
];
const adminRemarks = ['系统维护', '活动运营', '用户支持', '商品维护', '数据审计', '风险控制'];

const productNames = pointTypeData.flatMap((_pointType, pointTypeIndex) =>
  array(productsPerPointType, index => {
    const [kindName] = productKinds[index % productKinds.length]!;
    const serial = pointTypeIndex * productsPerPointType + index + 1;

    return `${kindName} ${serial.toString().padStart(2, '0')}`;
  }),
);
const productDescriptions = pointTypeData.flatMap(pointType =>
  array(productsPerPointType, index => {
    const [, kindDescription] = productKinds[index % productKinds.length]!;

    return `${pointType.description}，${kindDescription}`;
  }),
);
const productCovers = array(productNames.length, index => `/images/seed/products/${index + 1}.png`);
const productDetails = productNames.map((name, index) =>
  [
    `## ${name}`,
    '',
    productDescriptions[index],
    '',
    '- 测试数据商品',
    '- 用于开发和验收兑换商城列表、详情、库存展示',
  ].join('\n'),
);
const productPrices = array(productNames.length, index => 60 + (index % productsPerPointType) * 20);
const productStocks = array(
  productNames.length,
  index => 40 + faker.number.int({ min: 0, max: 260 }) - (index % 8),
);
const productDeliveryTypes = array(
  productNames.length,
  index => productKinds[index % productKinds.length]![2],
);
const productSorts = array(productNames.length, index => productNames.length - index);

const stockDeltas = array(stockMovementCount, () =>
  faker.helpers.arrayElement([10, 20, 30, 50, -1, -2]),
);
const stockBefore = array(stockMovementCount, () => faker.number.int({ min: 20, max: 300 }));
const stockAfter = stockBefore.map((before, index) => Math.max(0, before + stockDeltas[index]!));
const stockSourceIds = array(stockMovementCount, index => `seed-stock-${index + 1}`);
const stockIdempotencyKeys = array(stockMovementCount, index => `seedv2:stock:${index + 1}`);
const stockRemarks = stockDeltas.map(delta =>
  delta > 0 ? '测试数据入库调整' : '测试数据兑换扣减',
);

export async function seedV2(targetDb = db) {
  const passwordHash = await Bun.password.hash(seedDefaultPassword, {
    algorithm: 'bcrypt',
    cost: 12,
  });

  await drizzleSeed(
    targetDb,
    {
      admins,
      pointTypes,
      products,
      productStockMovements,
      users,
    },
    {
      count: userCount,
      seed: seedValue,
    },
  ).refine(funcs => ({
    admins: {
      count: adminCount,
      columns: {
        id: funcs.uuid(),
        uid: funcs.valuesFromArray({ values: adminUids, isUnique: true }),
        username: funcs.valuesFromArray({ values: adminNames, isUnique: true }),
        status: funcs.valuesFromArray({ values: ['active', 'active', 'active', 'banned'] }),
        role: funcs.default({ defaultValue: 'admin' }),
        passwordHash: funcs.default({ defaultValue: passwordHash }),
        lastLoginAt: funcs.date({
          minDate: '2026-01-01',
          maxDate: '2026-05-01',
        }),
        remark: funcs.valuesFromArray({ values: adminRemarks }),
      },
    },
    users: {
      count: userCount,
      columns: {
        id: funcs.uuid(),
        biliUid: funcs.valuesFromArray({ values: biliUids, isUnique: true }),
        username: funcs.valuesFromArray({ values: userNames, isUnique: true }),
        status: funcs.valuesFromArray({
          values: ['active', 'active', 'active', 'active', 'banned'],
        }),
        passwordHash: funcs.default({ defaultValue: passwordHash }),
        phoneEncrypted: funcs.valuesFromArray({ values: userPhones, isUnique: true }),
        emailEncrypted: funcs.valuesFromArray({ values: userEmails, isUnique: true }),
        addressEncrypted: funcs.valuesFromArray({ values: userAddresses }),
        phoneHash: funcs.valuesFromArray({ values: userPhoneHashes, isUnique: true }),
        remark: funcs.valuesFromArray({ values: userRemarks }),
      },
    },
    pointTypes: {
      count: pointTypeData.length,
      columns: {
        id: funcs.uuid(),
        name: funcs.valuesFromArray({
          values: pointTypeData.map(item => item.name),
          isUnique: true,
        }),
        description: funcs.valuesFromArray({
          values: pointTypeData.map(item => item.description),
        }),
        icon: funcs.valuesFromArray({
          values: pointTypeData.map(item => item.icon),
          isUnique: true,
        }),
        status: funcs.valuesFromArray({
          values: pointTypeData.map(item => item.status),
        }),
        sort: funcs.valuesFromArray({
          values: pointTypeData.map(item => item.sort),
          isUnique: true,
        }),
      },
      with: {
        products: productsPerPointType,
      },
    },
    products: {
      count: productNames.length,
      columns: {
        id: funcs.uuid(),
        name: funcs.valuesFromArray({ values: productNames, isUnique: true }),
        description: funcs.valuesFromArray({ values: productDescriptions }),
        cover: funcs.valuesFromArray({ values: productCovers, isUnique: true }),
        coverPlaceholderUrl: funcs.valuesFromArray({
          values: productCovers.map(value => `${value}?placeholder=1`),
          isUnique: true,
        }),
        detail: funcs.valuesFromArray({ values: productDetails }),
        price: funcs.valuesFromArray({ values: productPrices }),
        status: funcs.valuesFromArray({ values: ['active', 'active', 'active', 'disabled'] }),
        stock: funcs.valuesFromArray({ values: productStocks }),
        deliveryType: funcs.valuesFromArray({ values: productDeliveryTypes }),
        sort: funcs.valuesFromArray({ values: productSorts, isUnique: true }),
        metadata: funcs.json(),
        deletedAt: undefined,
      },
      with: {
        productStockMovements: [
          {
            weight: 0.65,
            count: 1,
          },
          {
            weight: 0.35,
            count: 2,
          },
        ],
      },
    },
    productStockMovements: {
      count: stockMovementCount,
      columns: {
        id: funcs.uuid(),
        type: funcs.valuesFromArray({ values: ['adjust', 'adjust', 'consume'] }),
        delta: funcs.valuesFromArray({ values: stockDeltas }),
        stockBefore: funcs.valuesFromArray({ values: stockBefore }),
        stockAfter: funcs.valuesFromArray({ values: stockAfter }),
        sourceType: funcs.default({ defaultValue: 'seed_adjustment' }),
        sourceId: funcs.valuesFromArray({ values: stockSourceIds, isUnique: true }),
        idempotencyKey: funcs.valuesFromArray({ values: stockIdempotencyKeys, isUnique: true }),
        remark: funcs.valuesFromArray({ values: stockRemarks }),
        metadata: funcs.json(),
      },
    },
  }));

  return {
    admins: adminCount,
    users: userCount,
    pointTypes: pointTypeData.length,
    products: productNames.length,
    productStockMovements: stockMovementCount,
  };
}

if (import.meta.main) {
  const databaseUrl = Bun.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required to seed database.');
  }

  const result = await seedV2(createDatabase(databaseUrl));

  console.log(
    `Seed v2 completed: ${result.admins} admins, ${result.users} users, ${result.pointTypes} point types, ${result.products} products, ${result.productStockMovements} product stock movements.`,
  );
}
