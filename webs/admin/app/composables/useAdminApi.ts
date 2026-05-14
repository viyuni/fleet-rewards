export function useAdminApi() {
  const { $api } = useNuxtApp();

  return $api;
}
