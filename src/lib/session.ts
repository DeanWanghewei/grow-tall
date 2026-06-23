import { cookies } from 'next/headers';
import { createSessionToken, readSessionToken } from './auth';

const COOKIE = 'gt_session';

export async function setSession() {
  const secret = process.env.SESSION_SECRET!;
  const token = await createSessionToken({ authed: true }, secret);
  // Secure cookie 只会在 HTTPS 下被浏览器发送。
  // 生产默认 secure;纯 HTTP 自托管必须设 SESSION_COOKIE_SECURE=false,
  // 否则「设密码/登录后无法进入」(cookie 在 HTTP 下被浏览器丢弃)。
  const secure = process.env.SESSION_COOKIE_SECURE
    ? process.env.SESSION_COOKIE_SECURE === 'true'
    : process.env.NODE_ENV === 'production';
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure,
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
