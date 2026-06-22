import { describe, it, expect, beforeEach } from 'vitest';
import { isStorageConfigured, storageConfig } from './storage';

beforeEach(() => {
  delete process.env.S3_ENDPOINT;
  delete process.env.S3_REGION;
  delete process.env.S3_BUCKET;
  delete process.env.S3_ACCESS_KEY;
  delete process.env.S3_SECRET_KEY;
  delete process.env.S3_PUBLIC_BASE;
});

describe('storage detection', () => {
  it('五项齐全 → 已配置', () => {
    process.env.S3_ENDPOINT = 'https://s3.example.com';
    process.env.S3_REGION = 'us-east-1';
    process.env.S3_BUCKET = 'b';
    process.env.S3_ACCESS_KEY = 'ak';
    process.env.S3_SECRET_KEY = 'sk';
    expect(isStorageConfigured()).toBe(true);
    expect(storageConfig().bucket).toBe('b');
  });

  it('缺任意一项 → 未配置', () => {
    process.env.S3_ENDPOINT = 'https://s3.example.com';
    process.env.S3_REGION = 'us-east-1';
    process.env.S3_BUCKET = 'b';
    process.env.S3_ACCESS_KEY = 'ak';
    // 缺 SECRET
    expect(isStorageConfigured()).toBe(false);
  });

  it('全空 → 未配置', () => {
    expect(isStorageConfigured()).toBe(false);
  });
});
