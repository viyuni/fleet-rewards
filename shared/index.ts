import { Type } from 'arktype';

export * from './schema';

export function toOpenApiSchema(schema: unknown) {
  if (schema instanceof Type) {
    return schema.toJsonSchema({
      fallback: {
        default: ctx => ctx.base,
        proto: ctx => {
          if (ctx.proto === File || ctx.proto?.name === 'File') {
            return {
              ...ctx.base,
              type: 'string',
              format: 'binary',
            };
          }

          return ctx.base;
        },

        date: ctx => ({
          ...ctx.base,
          type: 'string',
          format: 'date-time',
        }),
      },
    });
  }
}
