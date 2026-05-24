import { createListener } from '@viyuni/bevent-relay';
import type { Guard } from '@viyuni/bevent-relay/events';
import { Worker } from 'bunqueue/client';

import { createEventContainer } from '#context';
import { db } from '#db';
import { BILIBILI_EVENT_QUEUE_NAME, bilibiliEventQueue, bilibiliEventQueueOptions } from '#queues';
import { logger, sharedEnv } from '#utils';

import { eventEnv } from './env';

const {
  useCases: { rewardUseCase },
} = createEventContainer({ db, env: eventEnv });

// oxlint-disable-next-line no-unused-vars
const worker = new Worker<Guard>(
  BILIBILI_EVENT_QUEUE_NAME,
  async job => {
    await rewardUseCase.rewardBiliGuard(job.data);
  },
  {
    ...bilibiliEventQueueOptions,
    concurrency: 5,
  },
);

const listener = createListener({
  roomId: eventEnv.BILI_ROOM,
  cookieSync: {
    url: eventEnv.VIYUNI_LOGIN_SYNC_URL,
    password: eventEnv.VIYUNI_LOGIN_SYNC_PASSWORD,
  },
});

listener.on('event', event => {
  if (event.type === 'guard') {
  }

  switch (event.type) {
    case 'guard': {
      bilibiliEventQueue.add(BILIBILI_EVENT_QUEUE_NAME, event, {
        attempts: 3,
        backoff: 1000,
        durable: true,
      });

      break;
    }
    case 'message': {
      break;
    }
    case 'gift':
    case 'superChat':
    case 'superChatDelete':
    case 'liveStart':
    case 'liveEnd':
    case 'liveCutoff':
    case 'liveWarning':
    case 'likesUpdate':
    case 'likeClick':
    case 'entryEffect': {
      if (sharedEnv.NODE_ENV === 'development') console.log(event);
    }
  }
});

// 凌晨4点重启
Bun.cron('0 4 * * *', () => listener.refreshCookieAndRestart());

await listener.start().then(() => {
  logger.info('Bilibili Event Worker started...');
});
