import { imagePlugin } from '@gr/server-shared/image';
import Elysia from 'elysia';

import { config } from '#server-user/config';

export const image = new Elysia({
  name: 'ImageRoute',
}).use(imagePlugin(config));
