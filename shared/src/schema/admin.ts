import { type } from 'arktype';

const adminUsernameSchema = type('string.trim').to('3 <= string <= 32').to('/^[A-Za-z0-9_-]+$/');

const biliUidSchema = type('string.trim').to('1 <= string <= 32').to('/^[0-9]+$/');

const adminPasswordSchema = type('8 <= string <= 128').narrow(
  (password, context) =>
    (/[A-Za-z]/.test(password) && /[0-9]/.test(password)) || context.mustBe('同时包含字母和数字'),
);

const adminRemarkSchema = type('string.trim').to('string <= 500');

export const adminRegisterSchema = type({
  biliUid: biliUidSchema,
  username: adminUsernameSchema,
  password: adminPasswordSchema,
  'remark?': adminRemarkSchema.or('null'),
});

export const adminLoginSchema = type({
  username: adminUsernameSchema,
  password: 'string',
});

export type AdminRegisterInput = typeof adminRegisterSchema.infer;
export type AdminLoginInput = typeof adminLoginSchema.infer;
