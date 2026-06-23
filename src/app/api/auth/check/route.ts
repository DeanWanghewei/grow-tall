import { NextResponse } from 'next/server';
import { isAuthed } from '@/lib/session';

// 返回当前会话是否已登录。供登录页在「登录成功」后校验 cookie 是否真的被浏览器保存。
// (HTTP 下 Secure cookie 会被丢弃,这里能探测到。需在 middleware 的 PUBLIC 中放行。)
export async function GET() {
  return NextResponse.json({ authed: await isAuthed() });
}
