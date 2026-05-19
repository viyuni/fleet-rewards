import { createListener } from '@viyuni/bevent-relay';
import { type Guard } from '@viyuni/bevent-relay/events';
import { Queue, Worker } from 'bunqueue/client';

import { createEventContainer } from '#context';
import { db } from '#db';
import { sharedEnv } from '#utils';

import { eventEnv } from './env';

const {
  useCases: { rewardUseCase },
} = createEventContainer({ db, env: eventEnv });
const queue = new Queue<Guard>('biliGuardEvents', {
  embedded: true,
});

const listener = createListener({
  roomId: eventEnv.BILI_ROOM,
  cookieSync: {
    url: eventEnv.VIYUNI_LOGIN_SYNC_URL,
    password: eventEnv.VIYUNI_LOGIN_SYNC_PASSWORD,
  },
});

await listener.start();

// 凌晨4点重启
Bun.cron('0 4 * * *', () => listener.refreshCookieAndRestart());

listener.on('event', event => {
  if (event.type === 'guard') {
  }

  switch (event.type) {
    case 'guard': {
      queue.add('biliGuardEvents', event, {
        attempts: 3,
        backoff: 1000,
        durable: true, // 更安全：立即写盘
      });

      break;
    }
    case 'message':
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

const _worker = new Worker<Guard>(
  'biliGuardEvents',
  async job => {
    await rewardUseCase.rewardBiliGuard(job.data);
  },
  {
    embedded: true,
    concurrency: 5,
  },
);
