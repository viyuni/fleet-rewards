import type { PointType } from '@server/db/schema';

import { PointTypeUnavailableError } from './errors';

export type AvailablePointType = PointType & {
  status: 'active';
};

export class PointTypePolicy {
  static isAvailable(pointType: PointType | null | undefined): pointType is AvailablePointType {
    return pointType?.status === 'active';
  }

  static assertAvailable(
    pointType: PointType | null | undefined,
  ): asserts pointType is AvailablePointType {
    if (!PointTypePolicy.isAvailable(pointType)) {
      throw new PointTypeUnavailableError();
    }
  }
}
