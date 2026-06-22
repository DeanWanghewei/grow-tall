import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
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

/** 生成预签名 PUT URL,浏览器直传(不经服务器中转)。 */
export async function presignPut(key: string, contentType: string): Promise<string> {
  const c = storageConfig();
  const cmd = new PutObjectCommand({ Bucket: c.bucket, Key: key, ContentType: contentType });
  return getSignedUrl(getClient(), cmd, { expiresIn: 300 });
}

/** 照片的可访问 URL。优先 publicBase,否则拼 endpoint/bucket/key(path-style)。 */
export function publicUrl(key: string): string {
  const c = storageConfig();
  if (c.publicBase) return `${c.publicBase.replace(/\/$/, '')}/${key}`;
  const base = c.endpoint.replace(/\/$/, '');
  return `${base}/${c.bucket}/${key}`;
}
