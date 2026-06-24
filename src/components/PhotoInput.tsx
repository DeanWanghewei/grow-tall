'use client';

import { useEffect, useRef, useState } from 'react';

type Photo = { id: string; s3Key: string; takenAt: string; url?: string };

/**
 * 拍/选一张成长照并上传(S3 预签名直传)。
 * 未配置存储时提示。注意:打开文件选择必须在用户手势的同步上下文里,
 * 所以存储状态在挂载时预先拉取,点击处理保持同步(不 await)。
 */
export function PhotoInput({
  childId,
  onUploaded,
  label = '📸 拍 / 选成长照',
  className,
  style,
}: {
  childId: string;
  onUploaded?: (p: Photo) => void;
  label?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetch('/api/storage/status')
      .then((r) => r.json())
      .then((d) => setAvailable(!!d.available))
      .catch(() => setAvailable(false));
  }, []);

  function pick() {
    setMsg('');
    if (available === false) {
      setMsg('图片存储未配置,暂时无法上传(见部署文档)');
      return;
    }
    // 必须同步触发(不能在 await 之后),否则浏览器会拦截文件选择框
    // 存储是否真的可用,以选图后 presign 的权威结果为准(未配置会返回 503)
    inputRef.current?.click();
  }

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    setMsg('');
    try {
      const ps = await fetch('/api/photos/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId, filename: file.name, contentType: file.type }),
      }).then((r) => r.json());
      if (!ps.url) {
        setMsg(ps.error || '获取上传地址失败');
        return;
      }
      const up = await fetch(ps.url, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
      if (!up.ok) {
        setMsg('上传失败:请在存储侧开启 CORS(允许本站 PUT)');
        return;
      }
      const created = await fetch('/api/photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId, s3Key: ps.key, takenAt: new Date().toISOString() }),
      }).then((r) => r.json());
      onUploaded?.(created.photo);
      setMsg('已添加 ✓');
    } catch {
      setMsg('上传出错了');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button type="button" onClick={pick} className={className} style={style} disabled={busy}>
        {busy ? '上传中…' : label}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={onChange}
        style={{ display: 'none' }}
      />
      {msg && (
        <p className="mt-1 text-center text-[9px] font-bold" style={{ color: 'var(--muted)' }}>
          {msg}
        </p>
      )}
    </>
  );
}
