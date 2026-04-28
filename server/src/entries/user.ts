import { app } from '#server/apps/user';
import { config } from '#server/shared/config';

app.listen({ port: config.USER_SERVER_PORT });
