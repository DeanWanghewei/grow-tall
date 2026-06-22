import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';

const Update = z.object({
  name: z.string().min(1).optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  birthDate: z.string().optional(),
  themeId: z.string().optional(),
  fatherHeight: z.number().nullable().optional(),
  motherHeight: z.number().nullable().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = Update.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const d = parsed.data;
  let birth: Date | undefined;
  if (d.birthDate) {
    birth = new Date(d.birthDate);
    if (Number.isNaN(birth.getTime())) return NextResponse.json({ error: 'birthDate 无效' }, { status: 400 });
  }
  const child = await prisma.child.update({
    where: { id },
    data: {
      ...(d.name && { name: d.name }),
      ...(d.gender && { gender: d.gender }),
      ...(birth && { birthDate: birth }),
      ...(d.themeId && { themeId: d.themeId }),
      ...(d.fatherHeight !== undefined && { fatherHeight: d.fatherHeight }),
      ...(d.motherHeight !== undefined && { motherHeight: d.motherHeight }),
    },
  });
  return NextResponse.json({ child });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.child.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
