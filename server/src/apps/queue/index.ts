import { Queue, type ConnectionOptions } from 'bunqueue/client';

const connection = {
  host: 'localhost',
  port: 6789,
} satisfies ConnectionOptions;

export const notifyQueue = new Queue('notify', {
  connection,
});
