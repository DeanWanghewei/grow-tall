import { prisma } from '@/lib/db';
import { readObject } from '@/lib/s3';

export const dynamic = 'force-dynamic';

/** 代理读取照片:浏览器经本服务转发 S3 对象(内网 S3 不暴露给前端)。 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const photo = await prisma.photo.findUnique({ where: { id } });
  if (!photo) return new Response('not found', { status: 404 });

  const obj = await readObject(photo.s3Key);
  if (!obj) return new Response('object not found', { status: 404 });

  return new Response(obj.stream, {
    headers: {
      'Content-Type': obj.contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
      ...(obj.contentLength ? { 'Content-Length': String(obj.contentLength) } : {}),
    },
  });
}
