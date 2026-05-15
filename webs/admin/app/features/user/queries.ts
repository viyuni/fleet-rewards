import type { UserPageQuery } from '@internal/shared/user';

export const USER_QUERY_KEYS = {
  root: ['users'] as const,
  page: (query: UserPageQuery = {}) => [...USER_QUERY_KEYS.root, 'page', query] as const,
};

export const userPageQuery = defineQueryOptions((query: UserPageQuery = {}) => ({
  key: USER_QUERY_KEYS.page(query),
  query: () => {
    const { $api } = useNuxtApp();

    return $api.users.get({ query }).then(res => res.data);
  },
}));
