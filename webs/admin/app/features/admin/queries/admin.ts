import type { AdminPageQuery } from '@internal/shared/admin';

export const ADMIN_QUERY_KEYS = {
  root: ['admins'] as const,
  page: (query: AdminPageQuery = {}) => [...ADMIN_QUERY_KEYS.root, 'page', query] as const,
};

export const adminPageQuery = defineQueryOptions((query: AdminPageQuery = {}) => ({
  key: ADMIN_QUERY_KEYS.page(query),
  query: () => {
    const api = useAdminApi();

    return api.admin.get({ query }).then(res => res.data);
  },
}));
