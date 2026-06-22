'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/AppShell';
import { useRecordSheet } from '@/components/RecordSheet';

type Child = { id: string; name: string; birthDate: string };
type Photo = { id: string; takenAt: string; url: string };

function ageLabel(birth: string, at: string): string {
  const ms = new Date(at).getTime() - new Date(birth).getTime();
  const years = ms / (365.25 * 86400000);
  if (years < 1) return `${Math.max(0, Math.floor(ms / (30.4375 * 86400000)))} 个月`;
  return `${Math.floor(years)} 岁`;
}

export default function AlbumPage() {
  const { open } = useRecordSheet();
  const [children, setChildren] = useState<Child[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [storageOn, setStorageOn] = useState<boolean | null>(null);

  useEffect(() => {
    fetch('/api/children').then((r) => r.json()).then((d) => {
      setChildren(d.children);
      setActiveId(d.children[0]?.id ?? null);
    });
    fetch('/api/storage/status').then((r) => r.json()).then((d) => setStorageOn(d.available));
  }, []);

  useEffect(() => {
    if (!activeId) return;
    fetch(`/api/photos?childId=${activeId}`).then((r) => r.json()).then((d) => setPhotos(d.photos));
  }, [activeId]);

  const active = children.find((c) => c.id === activeId);

  // 按年龄分组(降序)
  const groups = useMemo(() => {
    if (!active) return [] as { label: string; photos: Photo[] }[];
    const map = new Map<string, Photo[]>();
    for (const p of photos) {
      const lbl = ageLabel(active.birthDate, p.takenAt);
      (map.get(lbl) ?? map.set(lbl, []).get(lbl)!).push(p);
    }
    return [...map.entries()].map(([label, ps]) => ({ label, photos: ps }));
  }, [photos, active]);

  return (
    <AppShell onRecord={() => activeId && open(activeId)}>
      <div className="p-4">
        <h1 className="text-lg font-extrabold" style={{ color: 'var(--ink)' }}>
          🖼 时光相册
        </h1>
        <p className="text-xs" style={{ color: 'var(--muted)' }}>
          {photos.length} 张照片 · 成长瞬间
        </p>
      </div>

      {photos.length > 0 ? (
        <Link
          href={`/slideshow?child=${activeId}`}
          className="mx-3 mb-3 flex items-center gap-2 rounded-2xl px-4 py-3 font-extrabold text-white"
          style={{ background: 'linear-gradient(95deg,#FF8A3D,#FF6A9D)', boxShadow: '0 5px 0 #C9541E' }}
        >
          <span className="text-xl">▶</span>
          <span className="text-sm">播放成长幻灯片</span>
          <span className="ml-auto opacity-80">›</span>
        </Link>
      ) : (
        <div className="mx-3 mb-3 rounded-2xl border-2 border-dashed p-5 text-center" style={{ borderColor: '#FFC987', color: 'var(--muted)' }}>
          <div className="text-3xl">🖼</div>
          <p className="mt-2 text-sm font-bold" style={{ color: 'var(--ink)' }}>还没有照片</p>
          <p className="mt-1 text-xs">
            {storageOn ? '点底部「记一笔」时拍一张成长照吧' : '需先配置图片存储(见部署文档),才能上传照片'}
          </p>
        </div>
      )}

      <div className="px-3 pb-6">
        {groups.map((g) => (
          <div key={g.label} className="mb-4">
            <div className="mb-2 flex justify-between text-xs font-extrabold" style={{ color: 'var(--muted)' }}>
              <span style={{ color: 'var(--ink)' }}>{g.label}</span>
              <span>{g.photos.length} 张</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {g.photos.map((p, i) => (
                <div
                  key={p.id}
                  className="overflow-hidden rounded-xl bg-white p-1"
                  style={{ transform: `rotate(${i % 2 ? 2 : -2}deg)`, boxShadow: '0 4px 8px rgba(120,70,30,.14)' }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.url} alt="成长照片" className="aspect-square w-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
