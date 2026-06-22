import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { mergeRecordInput } from '@/lib/records';

const Create = z.object({
  childId: z.string(),
  date: z.string(),
  height: z.number().nullable().optional(),
  weight: z.number().nullable().optional(),
  note: z.string().optional(),
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const childId = searchParams.get('childId');
  const records = await prisma.record.findMany({
    where: childId ? { childId } : undefined,
    orderBy: { date: 'asc' },
  });
  return NextResponse.json({ records });
}

export async function POST(req: Request) {
  const parsed = Create.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const d = parsed.data;
  const date = new Date(d.date);
  if (Number.isNaN(date.getTime())) return NextResponse.json({ error: 'date 无效' }, { status: 400 });

  // 同一天:合并(新输入非空字段覆盖旧值)
  const existing = await prisma.record.findUnique({
    where: { childId_date: { childId: d.childId, date } },
  });
  if (existing) {
    const merged = mergeRecordInput(
      { height: existing.height, weight: existing.weight },
      { height: d.height ?? null, weight: d.weight ?? null },
    );
    const updated = await prisma.record.update({
      where: { id: existing.id },
      data: { height: merged.height, weight: merged.weight, ...(d.note && { note: d.note }) },
    });
    return NextResponse.json({ record: updated });
  }

  const created = await prisma.record.create({
    data: {
      childId: d.childId,
      date,
      height: d.height ?? undefined,
      weight: d.weight ?? undefined,
      note: d.note,
    },
  });
  return NextResponse.json({ record: created });
}
