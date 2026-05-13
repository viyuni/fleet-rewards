import { addComponent, defineNuxtModule } from '@nuxt/kit';
import components from '@web/ui/resolver/components.json';

export default defineNuxtModule({
  setup() {
    for (const [name, from] of Object.entries(components)) {
      addComponent({ name, export: name, filePath: from });
    }
  },
});
