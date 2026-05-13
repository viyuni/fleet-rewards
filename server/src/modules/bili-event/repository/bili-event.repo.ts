import { and, asc, eq, inArray, sql } from 'drizzle-orm';

import type { DbExecutor } from '#db';
import {
  biliEvents,
  type BiliEventRewardItemSnapshot,
  type BiliEventRewardResultSnapshot,
  type BiliEventStatus,
  type InsertBiliEvent,
} from '#db/schema';

export class BiliEventRepository {
  constructor(private readonly db: DbExecutor) {}

  async findByBiliEventId(biliEventId: string, db: DbExecutor = this.db) {
    return await db.query.biliEvents.findFirst({
      where: {
        biliEventId,
      },
    });
  }

  async listReplayableBiliGuardByBiliUid(biliUid: string, db: DbExecutor = this.db) {
    return await db
      .select()
      .from(biliEvents)
      .where(
        and(
          eq(biliEvents.eventType, 'bili_guard'),
          eq(biliEvents.biliUid, biliUid),
          inArray(biliEvents.status, ['ignored', 'failed']),
        ),
      )
      .orderBy(asc(biliEvents.occurredAt), asc(biliEvents.createdAt));
  }

  async upsertProcessing(
    input: Pick<
      InsertBiliEvent,
      'biliEventId' | 'eventType' | 'biliUid' | 'occurredAt' | 'eventSnapshot'
    > & {
      rewardItemSnapshots: BiliEventRewardItemSnapshot[];
    },
    db: DbExecutor = this.db,
  ) {
    const [event] = await db
      .insert(biliEvents)
      .values({
        ...input,
        status: 'processing',
        rewardResultSnapshots: [],
      })
      .onConflictDoUpdate({
        target: biliEvents.biliEventId,
        set: {
          eventType: input.eventType,
          biliUid: input.biliUid,
          occurredAt: input.occurredAt,
          eventSnapshot: input.eventSnapshot,
          rewardItemSnapshots: input.rewardItemSnapshots,
          rewardResultSnapshots: [],
          status: 'processing',
          lastErrorCode: null,
          lastErrorMessage: null,
          processedAt: null,
        },
      })
      .returning();

    return event ?? null;
  }

  async markProcessing(biliEventId: string, db: DbExecutor = this.db) {
    return await this.updateStatus(
      biliEventId,
      {
        status: 'processing',
        lastErrorCode: null,
        lastErrorMessage: null,
        processedAt: null,
      },
      db,
    );
  }

  async markIgnored(
    biliEventId: string,
    input: {
      lastErrorCode: string;
      lastErrorMessage: string;
    },
    db: DbExecutor = this.db,
  ) {
    return await this.updateStatus(
      biliEventId,
      {
        status: 'ignored',
        userId: null,
        rewardResultSnapshots: [],
        lastErrorCode: input.lastErrorCode,
        lastErrorMessage: input.lastErrorMessage,
        processedAt: new Date(),
      },
      db,
    );
  }

  async markSucceeded(
    biliEventId: string,
    input: {
      userId: string;
      rewardResultSnapshots: BiliEventRewardResultSnapshot[];
    },
    db: DbExecutor = this.db,
  ) {
    return await this.updateStatus(
      biliEventId,
      {
        status: 'succeeded',
        userId: input.userId,
        rewardResultSnapshots: input.rewardResultSnapshots,
        lastErrorCode: null,
        lastErrorMessage: null,
        processedAt: new Date(),
      },
      db,
    );
  }

  async markFailed(
    biliEventId: string,
    input: {
      lastErrorCode: string;
      lastErrorMessage: string;
    },
    db: DbExecutor = this.db,
  ) {
    const [event] = await db
      .update(biliEvents)
      .set({
        status: 'failed',
        retryCount: sql`${biliEvents.retryCount} + 1`,
        lastErrorCode: input.lastErrorCode,
        lastErrorMessage: input.lastErrorMessage,
        processedAt: new Date(),
      })
      .where(eq(biliEvents.biliEventId, biliEventId))
      .returning();

    return event ?? null;
  }

  private async updateStatus(
    biliEventId: string,
    input: {
      status: BiliEventStatus;
      userId?: string | null;
      rewardResultSnapshots?: BiliEventRewardResultSnapshot[];
      lastErrorCode?: string | null;
      lastErrorMessage?: string | null;
      processedAt?: Date | null;
    },
    db: DbExecutor,
  ) {
    const [event] = await db
      .update(biliEvents)
      .set(input)
      .where(eq(biliEvents.biliEventId, biliEventId))
      .returning();

    return event ?? null;
  }
}
