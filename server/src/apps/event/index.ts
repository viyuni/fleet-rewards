import { createListener } from '@viyuni/bevent-relay';

import { publishBilibiliGuardEvent } from '#queues';
import { logger, sharedEnv } from '#utils';

import { eventEnv } from './env';

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
      publishBilibiliGuardEvent(event);

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
  logger.info('Bilibili Event Listener started...');
});
