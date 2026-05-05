import type { DbExecutor } from '@server/db';
import { eqIfDefined, keywordLike, PageBuilder } from '@server/db/helper';
import {
  pointTypes,
  type InsertPointType,
  type PointType,
  type UpdatePointType,
} from '@server/db/schema';
import { and, desc, eq } from 'drizzle-orm';

import type { PointTypePageFilter } from './types';

export class PointTypeRepository {
  constructor(private readonly db: DbExecutor) {}

  static async findById(db: DbExecutor, id: string) {
    return await db.query.pointTypes.findFirst({
      where: {
        id,
      },
    });
  }

  async findById(id: string) {
    return PointTypeRepository.findById(this.db, id);
  }

  async findByName(name: string) {
    return await this.db.query.pointTypes.findFirst({
      where: {
        name,
      },
    });
  }

  async create(input: InsertPointType) {
    const [row] = await this.db.insert(pointTypes).values(input).returning();
    return row ?? null;
  }

  async update(id: string, input: UpdatePointType) {
    const [row] = await this.db
      .update(pointTypes)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(eq(pointTypes.id, id))
      .returning();

    return row ?? null;
  }

  async updateStatus(id: string, status: PointType['status']) {
    const [row] = await this.db
      .update(pointTypes)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(pointTypes.id, id))
      .returning();

    return row ?? null;
  }

  pageBuilder(filter: PointTypePageFilter) {
    return new PageBuilder(this.db, pointTypes)
      .where(
        and(
          eqIfDefined(pointTypes.status, filter.status),
          keywordLike([pointTypes.name], filter.keyword),
        ),
      )
      .orderBy(desc(pointTypes.createdAt))
      .page(filter.page)
      .pageSize(filter.pageSize);
  }
}
