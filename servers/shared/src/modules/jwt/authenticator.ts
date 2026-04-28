import { UnauthorizedError } from '@gr/server-shared';
import { SignJWT, jwtVerify } from 'jose';

export class JwtAuthenticator {
  private encodedSecret: NodeJS.NonSharedUint8Array;

  constructor(private secret: string) {
    this.encodedSecret = new TextEncoder().encode(this.secret);
  }

  async sign(userId: string) {
    return new SignJWT()
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1d')
      .setSubject(userId)
      .sign(this.encodedSecret);
  }

  /**
   * @param token
   * @returns userId
   */
  async verify(token: string) {
    try {
      const { payload } = await jwtVerify(token, this.encodedSecret);
      if (!payload.sub) throw new UnauthorizedError();

      return payload.sub;
    } catch {
      throw new UnauthorizedError();
    }
  }
}
