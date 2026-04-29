import type { ComponentResolver } from 'unplugin-vue-components/types';

import components from './components.json' with { type: 'json' };

export default function (): ComponentResolver {
  return {
    type: 'component',
    resolve(name) {
      const from = components[name as keyof typeof components];

      if (!from) return;

      return {
        name,
        from,
      };
    },
  };
}
