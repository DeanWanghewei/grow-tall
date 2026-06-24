import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const childId = searchParams.get('childId');
  const photos = await prisma.photo.findMany({
    where: childId ? { childId } : undefined,
    orderBy: { takenAt: 'desc' },
  });
  // url 指向本服务的代理读取接口(不直连 S3)
  return NextResponse.json({
    photos: photos.map((p) => ({ ...p, url: `/api/photos/${p.id}/file` })),
  });
}
