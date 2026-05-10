import type { DbExecutor } from './index';
import { pointTypes, products, users, type InsertProduct, type InsertUser } from './schema';

export interface SeedUsersOptions {
  password?: string;
}

export interface SeedProductsOptions {
  countPerPointType?: number;
}

const seedUserData = [
  {
    biliUid: '100001',
    username: 'ken99',
    status: 'active',
    emailEncrypted: 'ken99@yahoo.com',
    phoneEncrypted: '13800000001',
    addressEncrypted: '上海市浦东新区世纪大道 1 号',
    remark: '首批演示用户',
  },
  {
    biliUid: '100002',
    username: 'abe45',
    status: 'active',
    emailEncrypted: 'Abe45@gmail.com',
    phoneEncrypted: '13800000002',
    addressEncrypted: '北京市朝阳区建国路 88 号',
    remark: '积分活跃用户',
  },
  {
    biliUid: '100003',
    username: 'monserrat44',
    status: 'active',
    emailEncrypted: 'Monserrat44@gmail.com',
    phoneEncrypted: '13800000003',
    addressEncrypted: '杭州市西湖区文三路 99 号',
    remark: '待完善资料',
  },
  {
    biliUid: '100004',
    username: 'silas22',
    status: 'active',
    emailEncrypted: 'Silas22@gmail.com',
    phoneEncrypted: '13800000004',
    addressEncrypted: '深圳市南山区科技园 10 号',
    remark: '企业客户',
  },
  {
    biliUid: '100005',
    username: 'carmella',
    status: 'banned',
    emailEncrypted: 'carmella@hotmail.com',
    phoneEncrypted: '13800000005',
    addressEncrypted: '广州市天河区体育西路 6 号',
    remark: '风控封禁',
  },
] satisfies Array<Omit<InsertUser, 'passwordHash'>>;

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

export async function seedUsers(db: DbExecutor, options: SeedUsersOptions = {}) {
  const passwordHash = await Bun.password.hash(options.password ?? 'password123', {
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
  const countPerPointType = options.countPerPointType ?? 30;
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
