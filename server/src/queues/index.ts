import { Queue, type ConnectionOptions } from 'bunqueue/client';

export * from './bilibili-event';

const connection = {
  host: 'localhost',
  port: 6789,
} satisfies ConnectionOptions;

export const notifyQueue = new Queue('notify', {
  connection,
});
