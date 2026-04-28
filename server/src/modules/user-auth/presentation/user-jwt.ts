import { config } from '#server/shared/config';

const devUserJwtSecret = 'dev-user-jwt-secret';

export function getUserJwtSecret() {
  if (config.USER_JWT_SECRET) {
    return config.USER_JWT_SECRET;
  }

  if (config.NODE_ENV === 'production') {
    throw new Error('USER_JWT_SECRET is required in production');
  }

  return devUserJwtSecret;
}
