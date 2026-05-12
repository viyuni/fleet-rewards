import type { BiliEventRewardItemSnapshot, GuardType } from '@server/db/schema';

export interface BiliGuardRewardEvent {
  id: string;
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
  ruleSnapshot: BiliEventRewardItemSnapshot['ruleSnapshot'];
  pointTypeSnapshot: BiliEventRewardItemSnapshot['pointTypeSnapshot'];
  pointTypeId: string;
  points: number;
}

export interface RewardGrantPlan {
  items: RewardGrantPlanItem[];
}
