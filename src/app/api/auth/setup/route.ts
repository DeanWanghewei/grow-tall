import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { setSession } from '@/lib/session';

const Body = z.object({ password: z.string().min(4) });

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: '密码至少 4 位' }, { status: 400 });

  const setting = await prisma.setting.findUnique({ where: { id: 'singleton' } });
  if (setting?.passwordHash) {
    return NextResponse.json({ error: '密码已设置,请改用登录' }, { status: 409 });
  }
  const hash = await hashPassword(parsed.data.password);
  await prisma.setting.upsert({
    where: { id: 'singleton' },
    update: { passwordHash: hash },
    create: { id: 'singleton', passwordHash: hash },
  });
  await setSession();
  return NextResponse.json({ ok: true });
}
