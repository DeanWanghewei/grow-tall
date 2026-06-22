import { NextResponse } from 'next/server';
import { z } from 'zod';
import { isPhotoUploadEnabled, presignPut } from '@/lib/s3';

const Body = z.object({
  childId: z.string(),
  filename: z.string(),
  contentType: z.string(),
});

export async function POST(req: Request) {
  if (!isPhotoUploadEnabled()) {
    return NextResponse.json(
      { error: '图片存储未配置', configured: false },
      { status: 503 },
    );
  }
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { childId, filename, contentType } = parsed.data;
  const ext = (filename.split('.').pop() || 'jpg').toLowerCase();
  // 用时间戳避免碰撞(crypto 随机在 workflow 脚本里受限,这里用 Date + Math)
  const key = `${childId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const url = await presignPut(key, contentType);
  return NextResponse.json({ url, key });
}
