import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { storageConfig, isStorageConfigured } from './storage';

export function isPhotoUploadEnabled(): boolean {
  return isStorageConfigured();
}

function getClient() {
  const c = storageConfig();
  // MinIO / 阿里云 OSS / Cloudflare R2 等用 path-style;AWS S3 用虚拟主机风格。
  const forcePathStyle = !c.endpoint.includes('amazonaws.com');
  return new S3Client({
    region: c.region,
    endpoint: c.endpoint || undefined,
    forcePathStyle,
    credentials: { accessKeyId: c.accessKey, secretAccessKey: c.secretKey },
  });
}

/**
 * 服务端上传到 S3(不再把 S3 暴露给前端)。
 * 内网 S3 场景下,前端只需能访问本服务,由本服务代理读写。
 */
export async function putObject(key: string, body: Uint8Array, contentType: string): Promise<void> {
  const c = storageConfig();
  await getClient().send(
    new PutObjectCommand({ Bucket: c.bucket, Key: key, Body: body, ContentType: contentType }),
  );
}

/**
 * 服务端从 S3 读取对象,返回可流式转发给浏览器的 Web Stream。
 * 前端通过 /api/photos/[id]/file 代理访问,不直连 S3。
 */
export async function readObject(
  key: string,
): Promise<{ stream: ReadableStream; contentType: string; contentLength?: number } | null> {
  const c = storageConfig();
  try {
    const data = await getClient().send(new GetObjectCommand({ Bucket: c.bucket, Key: key }));
    const body = data.Body as unknown as {
      transformToWebStream?: () => ReadableStream;
    };
    const stream = body.transformToWebStream ? body.transformToWebStream() : (data.Body as unknown as ReadableStream);
    return {
      stream,
      contentType: data.ContentType || 'application/octet-stream',
      contentLength: data.ContentLength,
    };
  } catch {
    return null;
  }
}
