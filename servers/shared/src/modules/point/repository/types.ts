import type { PageQuery } from '@server/db/helper';
import type { PointTransactionType, PointTypeStatus } from '@server/db/schema';

export interface PointTypePageFilter extends PageQuery {
  status?: PointTypeStatus;
  keyword?: string;
}

export interface PointTransactionPageFilter extends PageQuery {
  userId?: string;
  type?: PointTransactionType;
  pointTypeId?: string;
  startTime?: number;
  endTime?: number;
}
