import type { DbExecutor } from '@server/db';
import {
  pointTypes,
  type InsertPointType,
  type PointType,
  type UpdatePointType,
} from '@server/db/schema';
import { eq } from 'drizzle-orm';

export class PointTypeRepository {
  constructor(private readonly db: DbExecutor) {}

  async findById(id: string, db: DbExecutor = this.db) {
    return (
      (await db.query.pointTypes.findFirst({
        where: {
          id,
        },
      })) ?? null
    );
  }

  async findByName(name: string, db: DbExecutor = this.db) {
    return (
      (await db.query.pointTypes.findFirst({
        where: {
          name,
        },
      })) ?? null
    );
  }

  async create(input: InsertPointType, db: DbExecutor = this.db) {
    const [row] = await db.insert(pointTypes).values(input).returning();
    return row ?? null;
  }

  async update(id: string, input: UpdatePointType, db: DbExecutor = this.db) {
    const [row] = await db
      .update(pointTypes)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(eq(pointTypes.id, id))
      .returning();

    return row ?? null;
  }

  async updateStatus(id: string, status: PointType['status'], db: DbExecutor = this.db) {
    const [row] = await db
      .update(pointTypes)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(pointTypes.id, id))
      .returning();

    return row ?? null;
  }

  list() {
    return this.db.query.pointTypes.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
