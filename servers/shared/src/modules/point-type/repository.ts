import { pointTypes, type Db } from '@server/shared';
import { eq } from 'drizzle-orm';

import type { InsertPointType, PointType, UpdatePointType } from './model';

export class PointTypeRepository {
  constructor(private db: Db) {}

  async findById(id: string) {
    return await this.db.query.pointTypes.findFirst({ where: eq(pointTypes.id, id) });
  }

  async findByCode(code: string) {
    return await this.db.query.pointTypes.findFirst({ where: eq(pointTypes.code, code) });
  }

  async list(): Promise<PointType[]> {
    return await this.db.query.pointTypes.findMany();
  }

  async create(input: InsertPointType) {
    const [row] = await this.db
      .insert(pointTypes)
      .values({
        code: input.code,
        name: input.name,
        description: input.description,
      })
      .returning();

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

  async updateStatus(id: string, status: 'active' | 'disabled') {
    const [row] = await this.db
      .update(pointTypes)
      .set({ status })
      .where(eq(pointTypes.id, id))
      .returning();

    return row ?? null;
  }
}
