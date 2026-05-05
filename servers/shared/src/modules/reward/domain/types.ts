import type { GuardType, RewardRule } from '@server/db/schema';

export interface BiliGuardRewardEvent {
  id: string;
  stableKey?: string;
  uid: number;
  uname: string;
  guardType: GuardType;
  guardName: string;
  total: number;
  totalNormalized: number;
  isYearGuard: boolean;
  roomId: number;
  timestamp: number;
}

export interface RewardGrantPlanItem {
  rule: RewardRule;
  pointTypeId: string;
  points: number;
}

export interface RewardGrantPlan {
  event: BiliGuardRewardEvent;
  items: RewardGrantPlanItem[];
}
