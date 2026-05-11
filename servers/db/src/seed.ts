import { createDatabase, type DbExecutor } from './index';
import {
  pointTypes,
  products,
  users,
  type InsertPointType,
  type InsertProduct,
  type InsertUser,
} from './schema';

export interface SeedUsersOptions {
  password?: string;
}

export interface SeedProductsOptions {
  countPerPointType?: number;
}

export interface SeedOptions {
  users?: SeedUsersOptions;
  products?: SeedProductsOptions;
}

const seedDefaultPassword = '123456789@qW';

export const seedPointTypeIds = {
  captain: '00000000-0000-4000-8000-000000000001',
  admiral: '00000000-0000-4000-8000-000000000002',
  governor: '00000000-0000-4000-8000-000000000003',
  activity: '00000000-0000-4000-8000-000000000004',
} as const;

export const seedPointTypeData = [
  {
    id: seedPointTypeIds.captain,
    name: '舰长积分',
    description: '开通舰长即可获得',
    icon: 'captain',
    status: 'active',
    sort: 400,
  },
  {
    id: seedPointTypeIds.admiral,
    name: '提督积分',
    description: '开通提督即可获得',
    icon: 'admiral',
    status: 'active',
    sort: 300,
  },
  {
    id: seedPointTypeIds.governor,
    name: '总督积分',
    description: '开通总督即可获得',
    icon: 'governor',
    status: 'active',
    sort: 200,
  },
  {
    id: seedPointTypeIds.activity,
    name: '活动积分',
    description: '特殊活动节日可获得',
    icon: 'activity',
    status: 'active',
    sort: 100,
  },
] satisfies InsertPointType[];

const seedUserProfiles = [
  ['ken99', '首批演示用户'],
  ['abe45', '积分活跃用户'],
  ['monserrat44', '待完善资料'],
  ['silas22', '企业客户'],
  ['carmella', '风控封禁'],
  ['mira12', '节日活动用户'],
  ['nolan77', '高频兑换用户'],
  ['ivy08', '新注册用户'],
  ['owen31', '直播间活跃用户'],
  ['luna64', '周边收藏用户'],
  ['ethan52', '自动发货测试用户'],
  ['zoe19', '人工发货测试用户'],
  ['liam86', '积分转换测试用户'],
  ['aria23', '批量导入用户'],
  ['noah70', '资料完整用户'],
  ['emma41', '资料待审核用户'],
  ['mason15', '月度回馈用户'],
  ['ava68', '头像框兑换用户'],
  ['logan33', '抽奖参与用户'],
  ['mia92', '库存压测用户'],
  ['lucas27', '客服备注用户'],
  ['ella56', '订单退款用户'],
  ['jack04', '账户暂停用户'],
  ['ruby81', '历史订单用户'],
  ['leo39', '积分补发用户'],
  ['nina74', '活动报名用户'],
  ['finn20', '提督积分用户'],
  ['sara58', '总督积分用户'],
  ['max11', '舰长积分用户'],
  ['kate63', '混合积分用户'],
  ['hugo47', '兑换审核用户'],
  ['iris95', '地址变更用户'],
  ['ryan26', '手机号变更用户'],
  ['amy72', '邮箱变更用户'],
  ['ivan18', '长期活跃用户'],
  ['cara50', '节日礼包用户'],
  ['ben84', '签名卡收藏用户'],
  ['tina07', '直播装扮用户'],
  ['eric61', '封禁样例用户'],
  ['vera29', '普通演示用户'],
] satisfies Array<readonly [username: string, remark: string]>;

const seedUserData = seedUserProfiles.map(([username, remark], index) => {
  const serial = index + 1;
  const paddedSerial = serial.toString().padStart(2, '0');

  return {
    biliUid: (100000 + serial).toString(),
    username,
    status: serial % 20 === 19 ? 'banned' : 'active',
    emailEncrypted: `${username}@example.com`,
    phoneEncrypted: `138000000${paddedSerial}`,
    addressEncrypted: `演示地址 ${paddedSerial} 号`,
    remark,
  };
}) satisfies Array<Omit<InsertUser, 'passwordHash'>>;

const productKinds = [
  {
    name: '周边礼包',
    description: '徽章、贴纸、明信片组合',
    deliveryType: 'manual',
    priceBase: 80,
    stockBase: 120,
  },
  {
    name: '直播间装扮',
    description: '直播间专属身份装扮',
    deliveryType: 'automatic',
    priceBase: 120,
    stockBase: 300,
  },
  {
    name: '限定头像框',
    description: '限时纪念头像框兑换',
    deliveryType: 'automatic',
    priceBase: 160,
    stockBase: 240,
  },
  {
    name: '签名收藏卡',
    description: '实体签名收藏卡',
    deliveryType: 'manual',
    priceBase: 220,
    stockBase: 80,
  },
  {
    name: '抽奖资格',
    description: '参与月度回馈抽奖',
    deliveryType: 'automatic',
    priceBase: 60,
    stockBase: 500,
  },
] satisfies Array<{
  name: string;
  description: string;
  deliveryType: InsertProduct['deliveryType'];
  priceBase: number;
  stockBase: number;
}>;

export async function seedPointTypes(db: DbExecutor) {
  await db.insert(pointTypes).values(seedPointTypeData).onConflictDoNothing();

  return seedPointTypeData;
}

export async function seedUsers(db: DbExecutor, options: SeedUsersOptions = {}) {
  const passwordHash = await Bun.password.hash(options.password ?? seedDefaultPassword, {
    algorithm: 'bcrypt',
    cost: 12,
  });

  const values = seedUserData.map(user => ({
    ...user,
    passwordHash,
  }));

  await db.insert(users).values(values).onConflictDoNothing();

  return values.map(({ passwordHash: _passwordHash, ...user }) => user);
}

export async function seedProducts(db: DbExecutor, options: SeedProductsOptions = {}) {
  const countPerPointType = options.countPerPointType ?? 10;
  const existingPointTypes = await db.query.pointTypes.findMany({
    where: {
      status: 'active',
    },
    orderBy: {
      sort: 'desc',
      createdAt: 'asc',
    },
  });

  if (existingPointTypes.length === 0) {
    return [];
  }

  const values = existingPointTypes.flatMap((pointType, pointTypeIndex) =>
    Array.from({ length: countPerPointType }, (_, index) => {
      const kind = productKinds[index % productKinds.length]!;
      const serial = index + 1;

      return {
        name: `${pointType.name}${kind.name} ${serial.toString().padStart(2, '0')}`,
        description: `${pointType.description ?? pointType.name}，${kind.description}`,
        cover: `/images/seed/products/${pointTypeIndex + 1}-${serial}.png`,
        detail: [
          `## ${pointType.name}${kind.name}`,
          '',
          kind.description,
          '',
          '- seed 演示商品',
          `- 所需积分: ${pointType.name}`,
        ].join('\n'),
        pointTypeId: pointType.id,
        price: kind.priceBase + pointTypeIndex * 50 + serial * 5,
        status: serial % 10 === 0 ? 'disabled' : 'active',
        stock: kind.stockBase + pointTypeIndex * 30 - (serial % 12),
        deliveryType: kind.deliveryType,
        sort: countPerPointType - index,
        metadata: {
          seed: true,
          pointType: pointType.name,
          kind: kind.name,
          serial,
        },
      };
    }),
  ) satisfies InsertProduct[];

  await db.insert(products).values(values).onConflictDoNothing();

  return values;
}

export async function seed(db: DbExecutor, options: SeedOptions = {}) {
  const seededPointTypes = await seedPointTypes(db);
  const seededUsers = await seedUsers(db, options.users);
  const seededProducts = await seedProducts(db, options.products);

  return {
    pointTypes: seededPointTypes,
    users: seededUsers,
    products: seededProducts,
  };
}

if (import.meta.main) {
  const databaseUrl = Bun.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required to seed database.');
  }

  const db = createDatabase(databaseUrl);
  const result = await seed(db);

  console.log(
    `Seed completed: ${result.pointTypes.length} point types, ${result.users.length} users, ${result.products.length} products.`,
  );
}
