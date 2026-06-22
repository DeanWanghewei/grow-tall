import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';

const enc = (s: string) => new TextEncoder().encode(s);

export async function hashPassword(pw: string): Promise<string> {
  return bcrypt.hash(pw, 10);
}

export async function verifyPassword(pw: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pw, hash);
}

export async function createSessionToken(
  payload: Record<string, unknown>,
  secret: string,
): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('180d')
    .sign(enc(secret));
}

export async function readSessionToken(
  token: string,
  secret: string,
): Promise<Record<string, unknown> | null> {
  try {
    const { payload } = await jwtVerify(token, enc(secret));
    return payload as Record<string, unknown>;
  } catch {
    return null;
  }
}
