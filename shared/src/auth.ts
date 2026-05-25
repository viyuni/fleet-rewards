import * as v from 'valibot';

export const LiveLoginCodeParamsSchema = v.object({
  code: v.pipe(v.string('请输入登录码'), v.trim(), v.regex(/^U-[2-9A-HJ-NP-Z]{6}$/)),
});

export type LiveLoginCodeParams = v.InferOutput<typeof LiveLoginCodeParamsSchema>;
