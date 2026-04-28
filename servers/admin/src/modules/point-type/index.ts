import Elysia from 'elysia';

import { pointTypeContext } from './context';

export * from './repository';
export * from './usecase';
export * from './errors';
export * from './model';

export const pointType = new Elysia({
  name: 'PointRoute',
}).use(pointTypeContext);
