export interface StorageConfig {
  endpoint: string;
  region: string;
  bucket: string;
  accessKey: string;
  secretKey: string;
  publicBase?: string;
}

/** 从环境变量读取 S3 配置(部署时配置,不进数据库)。 */
export function storageConfig(): StorageConfig {
  return {
    endpoint: process.env.S3_ENDPOINT ?? '',
    region: process.env.S3_REGION ?? '',
    bucket: process.env.S3_BUCKET ?? '',
    accessKey: process.env.S3_ACCESS_KEY ?? '',
    secretKey: process.env.S3_SECRET_KEY ?? '',
    publicBase: process.env.S3_PUBLIC_BASE || undefined,
  };
}

/** 五项必需变量齐全才视为已配置。 */
export function isStorageConfigured(): boolean {
  const c = storageConfig();
  return Boolean(c.endpoint && c.region && c.bucket && c.accessKey && c.secretKey);
}
