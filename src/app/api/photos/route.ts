import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { publicUrl } from '@/lib/s3';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const childId = searchParams.get('childId');
  const photos = await prisma.photo.findMany({
    where: childId ? { childId } : undefined,
    orderBy: { takenAt: 'desc' },
  });
  return NextResponse.json({
    photos: photos.map((p) => ({ ...p, url: publicUrl(p.s3Key) })),
  });
}

const Create = z.object({
  childId: z.string(),
  s3Key: z.string(),
  takenAt: z.string(),
  recordId: z.string().optional(),
});

export async function POST(req: Request) {
  const parsed = Create.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const d = parsed.data;
  const taken = new Date(d.takenAt);
  if (Number.isNaN(taken.getTime())) return NextResponse.json({ error: 'takenAt 无效' }, { status: 400 });
  const photo = await prisma.photo.create({
    data: { childId: d.childId, s3Key: d.s3Key, takenAt: taken, recordId: d.recordId },
  });
  return NextResponse.json({ photo });
}
