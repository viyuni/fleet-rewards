import { defineQueryOptions } from '@pinia/colada';

export const userQueryOptions = defineQueryOptions(
  (params: { headers: () => Record<string, string | undefined> | undefined }) => {
    const { $api } = useNuxtApp();

    return {
      key: ['user'],
      query: async () => {
        const headers = params.headers();
        const res = await $api.me.get({
          headers,
          throwHttpError: false,
        });

        return res.data;
      },
    };
  },
);
