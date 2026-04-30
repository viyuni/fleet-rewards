import {
  ClipboardList,
  Coins,
  LayoutDashboard,
  Radio,
  ShoppingBag,
  UserRound,
} from 'lucide-vue-next';

import type { MenuItem } from '#web/admin/types';

export const menus = [
  {
    title: '控制台',
    to: '/app/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: '用户管理',
    icon: UserRound,
    items: [
      { title: '用户列表', to: '/app/users' },
      { title: '管理员管理', to: '/app/admins' },
    ],
  },
  {
    title: '订单管理',
    to: '/app/orders',
    icon: ClipboardList,
  },
  {
    title: '积分管理',
    icon: Coins,
    items: [
      { title: '积分类型', to: '/app/points/types' },
      { title: '积分账户', to: '/app/points/accounts' },
      { title: '积分流水', to: '/app/points/transactions' },
      { title: '积分规则', to: '/app/points/rules' },
      { title: '积分转换', to: '/app/points/conversions' },
    ],
  },
  {
    title: '商品管理',
    icon: ShoppingBag,
    items: [
      { title: '商品列表', to: '/app/products' },
      { title: '库存记录', to: '/app/products/stockMovements' },
    ],
  },

  {
    title: '大航海事件',
    to: '/app/guardEvents',
    icon: Radio,
  },
] satisfies MenuItem[];
