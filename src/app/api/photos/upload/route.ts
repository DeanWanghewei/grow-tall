import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { isPhotoUploadEnabled, putObject } from '@/lib/s3';

export const dynamic = 'force-dynamic';

/** 由本服务代理上传:前端把文件 POST 到这里,后端写入 S3(内网 S3 不暴露给前端)。 */
export async function POST(req: Request) {
  if (!isPhotoUploadEnabled()) {
    return NextResponse.json({ error: '图片存储未配置' }, { status: 503 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: '请求格式错误' }, { status: 400 });
  }

  const file = form.get('file');
  const childId = form.get('childId');
  if (!(file instanceof File) || typeof childId !== 'string') {
    return NextResponse.json({ error: '缺少文件或 childId' }, { status: 400 });
  }
  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: '仅支持图片' }, { status: 400 });
  }
  if (file.size > 20 * 1024 * 1024) {
    return NextResponse.json({ error: '图片过大(>20MB)' }, { status: 413 });
  }

  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const key = `${childId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const buf = new Uint8Array(await file.arrayBuffer());
  try {
    await putObject(key, buf, file.type || 'image/jpeg');
  } catch (e) {
    return NextResponse.json(
      { error: '写入存储失败:' + (e instanceof Error ? e.message : '未知错误') },
      { status: 502 },
    );
  }

  const photo = await prisma.photo.create({
    data: { childId, s3Key: key, takenAt: new Date() },
  });
  return NextResponse.json({ photo: { ...photo, url: `/api/photos/${photo.id}/file` } });
}
