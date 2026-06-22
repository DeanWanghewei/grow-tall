// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  hashPassword,
  verifyPassword,
  createSessionToken,
  readSessionToken,
} from './auth';

const SECRET = 'test-secret-at-least-32-characters-long-xxxxx';

describe('auth', () => {
  it('hashPassword / verifyPassword 往返', async () => {
    const hash = await hashPassword('hunter2');
    expect(hash).not.toBe('hunter2');
    expect(await verifyPassword('hunter2', hash)).toBe(true);
    expect(await verifyPassword('wrong', hash)).toBe(false);
  });

  it('createSessionToken / readSessionToken 往返', async () => {
    const token = await createSessionToken({ ok: true }, SECRET);
    const payload = await readSessionToken(token, SECRET);
    expect(payload?.ok).toBe(true);
  });

  it('错误密钥校验失败', async () => {
    const token = await createSessionToken({ ok: true }, SECRET);
    expect(await readSessionToken(token, 'wrong-secret-also-long-enough-xxxxxxxx')).toBeNull();
  });
});
