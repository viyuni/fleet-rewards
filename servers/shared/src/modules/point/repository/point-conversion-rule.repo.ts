import type { DbExecutor } from '@server/db';
import { deletedAtIsNull } from '@server/db/helper';
import {
  pointConversionRules,
  type InsertPointConversionRule,
  type UpdatePointConversionRule,
} from '@server/db/schema';
import { and, desc, eq } from 'drizzle-orm';

export class PointConversionRuleRepository {
  constructor(private readonly db: DbExecutor) {}

  async findById(pointConversionRuleId: string, db: DbExecutor = this.db) {
    const [row] = await db
      .select()
      .from(pointConversionRules)
      .where(
        and(
          eq(pointConversionRules.id, pointConversionRuleId),
          deletedAtIsNull(pointConversionRules),
        ),
      )
      .limit(1);

    return row ?? null;
  }

  async create(input: InsertPointConversionRule, db: DbExecutor = this.db) {
    const [row] = await db.insert(pointConversionRules).values(input).returning();
    return row ?? null;
  }

  async update(
    pointConversionRuleId: string,
    data: UpdatePointConversionRule,
    db: DbExecutor = this.db,
  ) {
    const [row] = await db
      .update(pointConversionRules)
      .set(data)
      .where(
        and(
          eq(pointConversionRules.id, pointConversionRuleId),
          deletedAtIsNull(pointConversionRules),
        ),
      )
      .returning();

    return row ?? null;
  }

  async enabled(pointConversionRuleId: string, db: DbExecutor = this.db) {
    return this.update(pointConversionRuleId, { enabled: true }, db);
  }

  async disabled(pointConversionRuleId: string, db: DbExecutor = this.db) {
    return this.update(pointConversionRuleId, { enabled: false }, db);
  }

  list(db: DbExecutor = this.db) {
    return db
      .select()
      .from(pointConversionRules)
      .where(deletedAtIsNull(pointConversionRules))
      .orderBy(desc(pointConversionRules.createdAt));
  }
}
