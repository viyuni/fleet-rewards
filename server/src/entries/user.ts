import { app } from '#server/apps/user';
import { env } from '#server/shared/config';

app.listen({ port: env.USER_SERVER_PORT });
