import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { verifyPassword, hashPassword } from '@/lib/auth';
import { setSession } from '@/lib/session';

const Body = z.object({ password: z.string().min(1) });

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: '参数错误' }, { status: 400 });

  const setting = await prisma.setting.findUnique({ where: { id: 'singleton' } });

  // 支持 APP_PASSWORD 环境变量预置密码(部署时)
  const envPw = process.env.APP_PASSWORD;
  if (!setting?.passwordHash && !envPw) {
    return NextResponse.json({ error: '尚未设置密码', needsSetup: true }, { status: 409 });
  }

  const ok = envPw
    ? parsed.data.password === envPw
    : setting?.passwordHash
      ? await verifyPassword(parsed.data.password, setting.passwordHash)
      : false;

  if (!ok) return NextResponse.json({ error: '密码错误' }, { status: 401 });

  // 若用环境密码登录且库里没记录,顺手写入哈希(便于后续改密)
  if (!setting?.passwordHash && envPw) {
    await prisma.setting.upsert({
      where: { id: 'singleton' },
      update: {},
      create: { id: 'singleton', passwordHash: await hashPassword(envPw) },
    });
  }

  await setSession();
  return NextResponse.json({ ok: true });
}
