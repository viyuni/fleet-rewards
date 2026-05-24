import type { Guard } from '@viyuni/bevent-relay/events';
import { Queue } from 'bunqueue/client';

export const BILIBILI_EVENT_QUEUE_NAME = 'bilibiliEvent' as const;

export const bilibiliEventQueueOptions = {
  embedded: true,
  dataPath: './.queue/bilibiliEvent',
} as const;

export const bilibiliEventQueue = new Queue<Guard>(BILIBILI_EVENT_QUEUE_NAME, {
  ...bilibiliEventQueueOptions,
});
