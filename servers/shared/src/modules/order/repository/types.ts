import type { PageQuery } from '@server/db/helper';
import type { OrderStatus } from '@server/db/schema';

export interface OrderPageFilter extends PageQuery {
  keyword?: string;
  status?: OrderStatus;
  userId?: string;
  startTime?: number;
  endTime?: number;
}
