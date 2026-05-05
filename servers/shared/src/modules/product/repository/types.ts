import type { PageQuery } from '@server/db/helper';
import type {
  ProductDeliveryType,
  ProductStatus,
  ProductStockMovementType,
} from '@server/db/schema';

export interface ProductPageFilter extends PageQuery {
  status?: ProductStatus;
  pointTypeId?: string;
  deliveryType?: ProductDeliveryType;
  keyword?: string;
}

export interface StockMovementPageFilter extends PageQuery {
  productId: string;
  type?: ProductStockMovementType;
  startTime?: number;
  endTime?: number;
}
