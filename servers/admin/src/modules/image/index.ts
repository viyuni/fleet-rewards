import { imagePlugin } from '@server/shared/image';
import Elysia from 'elysia';

import { config } from '#server/admin/config';

export const image = new Elysia({
  name: 'ImageRoute',
}).use(imagePlugin(config));
