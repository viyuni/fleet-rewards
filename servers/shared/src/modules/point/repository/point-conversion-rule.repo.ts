import type { DbExecutor } from '@server/db';
import {
  pointConversionRules,
  type InsertPointConversionRule,
  type UpdatePointConversionRule,
} from '@server/db/schema';
import { and, desc, eq } from 'drizzle-orm';

export class PointConversionRuleRepository {
  constructor(private readonly db: DbExecutor) {}

  async findById(id: string, db: DbExecutor = this.db) {
    const [row] = await db
      .select()
      .from(pointConversionRules)
      .where(eq(pointConversionRules.id, id))
      .limit(1);

    return row ?? null;
  }

  async create(input: InsertPointConversionRule, db: DbExecutor = this.db) {
    const [row] = await db.insert(pointConversionRules).values(input).returning();
    return row ?? null;
  }

  async update(id: string, input: UpdatePointConversionRule, db: DbExecutor = this.db) {
    const [row] = await db
      .update(pointConversionRules)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(and(eq(pointConversionRules.id, id)))
      .returning();

    return row ?? null;
  }

  async updateEnabled(id: string, enabled: boolean, db: DbExecutor = this.db) {
    return this.update(id, { enabled }, db);
  }

  list(db: DbExecutor = this.db) {
    return db.select().from(pointConversionRules).orderBy(desc(pointConversionRules.createdAt));
  }
}
