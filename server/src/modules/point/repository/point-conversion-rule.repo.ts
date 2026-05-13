import { and, desc, eq } from 'drizzle-orm';

import type { DbExecutor } from '#db';
import { deletedAtIsNull } from '#db/helper';
import {
  pointConversionRules,
  type InsertPointConversionRule,
  type UpdatePointConversionRule,
} from '#db/schema';

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

  async findByName(name: string, db: DbExecutor = this.db) {
    const [row] = await db
      .select()
      .from(pointConversionRules)
      .where(and(eq(pointConversionRules.name, name), deletedAtIsNull(pointConversionRules)))
      .limit(1);

    return row ?? null;
  }

  async findByPointTypePair(
    input: { fromPointTypeId: string; toPointTypeId: string },
    db: DbExecutor = this.db,
  ) {
    const [row] = await db
      .select()
      .from(pointConversionRules)
      .where(
        and(
          eq(pointConversionRules.fromPointTypeId, input.fromPointTypeId),
          eq(pointConversionRules.toPointTypeId, input.toPointTypeId),
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
