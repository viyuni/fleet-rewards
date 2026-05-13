import { SignJWT, jwtVerify } from 'jose';

import { UnauthorizedError } from '#errors';

import type { AuthPayload } from '../domain';

export class AuthUseCase {
  private encodedSecret: Uint8Array<ArrayBuffer>;

  constructor(private secret: string) {
    this.encodedSecret = new TextEncoder().encode(this.secret);
  }

  async sign(payload: AuthPayload) {
    return new SignJWT({
      id: payload.id,
      role: payload.role,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1d')
      .sign(this.encodedSecret);
  }

  async verify(token: string) {
    try {
      const { payload } = await jwtVerify<AuthPayload>(token, this.encodedSecret);

      if (typeof payload.id !== 'string') {
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
}
