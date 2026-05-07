import { UnauthorizedError } from '@server/shared';
import { SignJWT, jwtVerify, type JWTPayload } from 'jose';

export interface AuthTokenPayload {
  userId: string;
  role?: string;
}

export class AuthUseCase {
  private encodedSecret: Uint8Array<ArrayBuffer>;

  constructor(private secret: string) {
    this.encodedSecret = new TextEncoder().encode(this.secret);
  }

  async sign(payload: AuthTokenPayload) {
    const jwtPayload: JWTPayload = {
      userId: payload.userId,
      role: payload.role,
    };

    return new SignJWT(jwtPayload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1d')
      .sign(this.encodedSecret);
  }

  async verify(token: string) {
    try {
      const { payload } = await jwtVerify(token, this.encodedSecret);
      if (typeof payload.userId !== 'string') throw new UnauthorizedError();
      if (payload.role !== undefined && typeof payload.role !== 'string')
        throw new UnauthorizedError();

      return {
        userId: payload.userId,
        role: payload.role,
      };
    } catch {
      throw new UnauthorizedError();
    }
  }
}
