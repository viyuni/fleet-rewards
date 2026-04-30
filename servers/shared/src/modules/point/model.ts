export type {
  InsertPointAccount,
  InsertPointConversionRule,
  InsertPointRule,
  InsertPointTransaction,
  InsertPointType,
  PointAccount,
  PointConversionRule,
  PointRule,
  PointRuleEffect,
  PointTransaction,
  PointTransactionType,
  PointType,
  PointTypeStatus,
  UpdatePointAccount,
  UpdatePointConversionRule,
  UpdatePointRule,
  UpdatePointTransaction,
  UpdatePointType,
} from '#server/shared/db/schemas';

export type PointTransactionListFilter = {
  userId?: string;
  accountId?: string;
  pointTypeId?: string;
  sourceType?: string;
  sourceId?: string;
};

export type PointRuleListFilter = {
  pointTypeId?: string;
  group?: string;
  enabled?: boolean;
};

export type PointConversionRuleListFilter = {
  fromPointTypeId?: string;
  toPointTypeId?: string;
  enabled?: boolean;
};
