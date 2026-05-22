import { SignJWT, jwtVerify } from 'jose';

import { UnauthorizedError } from '#utils';

import { ACCESS_TOKEN_EXPIRES_IN_SECONDS, REFRESH_TOKEN_EXPIRES_IN_SECONDS } from '../constants';
import type { AuthPayload } from '../domain';

type AuthTokenType = 'access' | 'refresh';

function getTokenExpiresInSeconds(type: AuthTokenType) {
  return type === 'access' ? ACCESS_TOKEN_EXPIRES_IN_SECONDS : REFRESH_TOKEN_EXPIRES_IN_SECONDS;
}

export class AuthUseCase {
  private encodedSecret: Uint8Array<ArrayBuffer>;

  constructor(private secret: string) {
    this.encodedSecret = new TextEncoder().encode(this.secret);
  }

  private async signToken(payload: AuthPayload, type: AuthTokenType) {
    const expiresInSeconds = getTokenExpiresInSeconds(type);

    return new SignJWT({
      id: payload.id,
      role: payload.role,
      type,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(`${expiresInSeconds}s`)
      .sign(this.encodedSecret);
  }

  async sign(payload: AuthPayload) {
    return this.signAccessToken(payload);
  }

  async signAccessToken(payload: AuthPayload) {
    return this.signToken(payload, 'access');
  }

  async signRefreshToken(payload: AuthPayload) {
    return this.signToken(payload, 'refresh');
  }

  async signTokenPair(payload: AuthPayload) {
    const now = Date.now();
    const [accessToken, refreshToken] = await Promise.all([
      this.signAccessToken(payload),
      this.signRefreshToken(payload),
    ]);

    return {
      accessToken,
      accessTokenExpiresAt: now + ACCESS_TOKEN_EXPIRES_IN_SECONDS * 1000,
      refreshToken,
      refreshTokenExpiresAt: now + REFRESH_TOKEN_EXPIRES_IN_SECONDS * 1000,
    };
  }

  private async verifyToken(token: string, expectedType: AuthTokenType) {
    try {
      const { payload } = await jwtVerify<AuthPayload & { type?: AuthTokenType }>(
        token,
        this.encodedSecret,
      );

      if (typeof payload.id !== 'string') {
        throw new UnauthorizedError();
      }

      if (payload.type !== expectedType) {
        throw new UnauthorizedError();
      }

      // 确保角色是字符串
      if (payload.role !== undefined && typeof payload.role !== 'string') {
        throw new UnauthorizedError();
      }

      return {
        id: payload.id,
        role: payload.role,
      };
    } catch {
      throw new UnauthorizedError();
    }
  }

  async verify(token: string) {
    return this.verifyAccessToken(token);
  }

  async verifyAccessToken(token: string) {
    return this.verifyToken(token, 'access');
  }

  async verifyRefreshToken(token: string) {
    return this.verifyToken(token, 'refresh');
  }

  async refreshAccessToken(refreshToken: string) {
    const payload = await this.verifyRefreshToken(refreshToken);

    return this.signAccessToken(payload);
  }
}
