import 'vue-router';
import '@pinia/colada';

// To ensure it is treated as a module, add at least one `export` statement
export {};

declare module 'vue-router' {
  interface RouteMeta {
    /**
     * Whether the route requires authentication
     */
    requiresAuth?: boolean;

    /**
     * route title
     */
    title?: string;
  }
}

declare module '@pinia/colada' {
  interface TypesConfig {
    queryMeta: {
      errorMessage?: string;
    };
    mutationMeta: {
      showToast?: boolean;
    };
  }
}
