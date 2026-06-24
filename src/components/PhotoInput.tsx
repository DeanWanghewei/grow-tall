'use client';

import { useRef, useState } from 'react';

type Photo = { id: string; s3Key: string; takenAt: string; url?: string };

/**
 * 拍/选一张成长照,经本服务代理上传到 S3(不直连 S3,适合内网 S3)。
 * 打开文件选择必须在用户手势的同步上下文(不能在 await 之后),
 * 所以点击处理保持同步;存储是否可用由上传接口权威判断。
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
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  function pick() {
    setMsg('');
    // 同步触发,确保在用户手势内打开文件选择框
    inputRef.current?.click();
  }

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    setMsg('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('childId', childId);
      const r = await fetch('/api/photos/upload', { method: 'POST', body: fd });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        setMsg(j.error || '上传失败');
        return;
      }
      onUploaded?.(j.photo);
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
      <input ref={inputRef} type="file" accept="image/*" onChange={onChange} style={{ display: 'none' }} />
      {msg && (
        <p className="mt-1 text-center text-[9px] font-bold" style={{ color: 'var(--muted)' }}>
          {msg}
        </p>
      )}
    </>
  );
}
