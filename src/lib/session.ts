import { cookies } from 'next/headers';
import { createSessionToken, readSessionToken } from './auth';

const COOKIE = 'gt_session';

export async function setSession() {
  const secret = process.env.SESSION_SECRET!;
  const token = await createSessionToken({ authed: true }, secret);
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 180,
    path: '/',
  });
}

export async function clearSession() {
  (await cookies()).delete(COOKIE);
}

export async function isAuthed(): Promise<boolean> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return false;
  const payload = await readSessionToken(token, process.env.SESSION_SECRET!);
  return Boolean(payload?.authed);
}
