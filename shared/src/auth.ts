import * as v from 'valibot';

export const BiliRegisterCodeParamsSchema = v.object({
  code: v.pipe(v.string('请输入注册码'), v.trim(), v.regex(/^U-[2-9A-HJ-NP-Z]{6}$/)),
});

export type BiliRegisterCodeParams = v.InferOutput<typeof BiliRegisterCodeParamsSchema>;
