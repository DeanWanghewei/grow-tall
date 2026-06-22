import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { hashPassword, verifyPassword } from '@/lib/auth';

const Body = z.object({ current: z.string(), next: z.string().min(4) });

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: '新密码至少 4 位' }, { status: 400 });

  const setting = await prisma.setting.findUnique({ where: { id: 'singleton' } });
  const envPw = process.env.APP_PASSWORD;
  const okCurrent = envPw
    ? parsed.data.current === envPw
    : setting?.passwordHash
      ? await verifyPassword(parsed.data.current, setting.passwordHash)
      : false;
  if (!okCurrent) return NextResponse.json({ error: '当前密码错误' }, { status: 401 });

  const hash = await hashPassword(parsed.data.next);
  await prisma.setting.upsert({
    where: { id: 'singleton' },
    update: { passwordHash: hash },
    create: { id: 'singleton', passwordHash: hash },
  });
  return NextResponse.json({ ok: true });
}
