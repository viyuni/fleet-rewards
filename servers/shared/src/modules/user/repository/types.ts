import type { PageQuery } from '@server/db/helper';
import type { UserStatus } from '@server/db/schema';

export interface UserPageFilter extends PageQuery {
  keyword?: string;
  status?: UserStatus;
}
