'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

type Photo = { id: string; takenAt: string; url: string };
type GrowthResp = {
  child: { name: string; birthDate: string };
  points: { ageMonths: number; date: string; height: number | null; weight: number | null }[];
  derived: { latestHeight: number | null };
};

function ageLabel(birth: string, at: string): string {
  const ms = new Date(at).getTime() - new Date(birth).getTime();
  const years = ms / (365.25 * 86400000);
  if (years < 1) return `${Math.max(0, Math.floor(ms / (30.4375 * 86400000)))} 个月`;
  return `${Math.floor(years)} 岁`;
}

function SlideshowInner() {
  const params = useSearchParams();
  const childId = params.get('child') ?? '';
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [growth, setGrowth] = useState<GrowthResp | null>(null);
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    if (!childId) return;
    Promise.all([
      fetch(`/api/photos?childId=${childId}`).then((r) => r.json()),
      fetch(`/api/growth/${childId}`).then((r) => r.json()),
    ]).then(([p, g]) => {
      // 照片按时间升序播放
      setPhotos((p.photos as Photo[]).sort((a, b) => +new Date(a.takenAt) - +new Date(b.takenAt)));
      setGrowth(g);
    });
  }, [childId]);

  // 自动播放(每 2.5 秒)
  useEffect(() => {
    if (!playing || photos.length === 0) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % photos.length), 2500);
    return () => clearInterval(t);
  }, [playing, photos.length]);

  const meta = useMemo(() => {
    if (!growth || photos.length === 0) return null;
    const photo = photos[idx];
    const t = new Date(photo.takenAt).getTime();
    // 找拍摄时间最近(且不晚于)的记录,取当时的身高/体重
    const past = growth.points.filter((p) => new Date(p.date).getTime() <= t);
    const rec = past.at(-1);
    return {
      age: ageLabel(growth.child.birthDate, photo.takenAt),
      height: rec?.height ?? null,
      weight: rec?.weight ?? null,
    };
  }, [growth, photos, idx]);

  const firstHeight = useMemo(
    () => growth?.points.find((p) => p.height != null)?.height ?? null,
    [growth],
  );
  const latestHeight = growth?.derived.latestHeight ?? null;

  if (photos.length === 0) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-3 p-8 text-center" style={{ background: 'linear-gradient(180deg,#3a2a5c,#2a1c40)', color: '#fff' }}>
        <div className="text-5xl">🎞</div>
        <p className="text-lg font-extrabold">还没有照片</p>
        <p className="text-sm opacity-80">先去相册添加成长照片,就能播放幻灯片啦</p>
        <Link href="/album" className="mt-2 rounded-xl px-5 py-2 text-sm font-extrabold" style={{ background: '#fff', color: '#FF7A2F' }}>返回相册</Link>
      </div>
    );
  }

  const photo = photos[idx];
  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden p-4" style={{ background: 'radial-gradient(120% 80% at 50% 0%,#4a3470,#2a1c40 60%,#1a1228)' }}>
      <Link href="/album" className="absolute right-4 z-20 rounded-full bg-white/15 px-3 py-1 text-sm font-bold text-white" style={{ top: 'calc(var(--safe-top) + 8px)' }}>✕</Link>

      <div className="rotate-[-2deg] rounded-2xl bg-white p-2 pb-4 shadow-2xl" style={{ boxShadow: '0 16px 36px rgba(0,0,0,.5)' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo.url} alt="成长照片" className="h-[46vh] w-auto rounded-lg object-cover" />
        {meta && (
          <p className="mt-2 text-center text-xs font-extrabold" style={{ color: '#5B3A1F' }}>
            {growth?.child.name} · {meta.age}
          </p>
        )}
      </div>

      {meta && (
        <div className="mt-4 rounded-2xl bg-white/95 px-5 py-2 text-center shadow-xl">
          <div className="text-base font-extrabold" style={{ color: '#5B3A1F' }}>{meta.age}</div>
          <div className="text-xs font-bold" style={{ color: '#B98E6A' }}>
            身高 {meta.height ? `${meta.height}cm` : '—'} · 体重 {meta.weight ? `${meta.weight}kg` : '—'}
          </div>
        </div>
      )}

      {firstHeight != null && latestHeight != null && (
        <div className="mt-3 flex items-center gap-2 rounded-full border border-dashed border-white/40 bg-white/10 px-4 py-2 text-xs font-extrabold text-white">
          <span>🍼 {firstHeight}cm</span>
          <b style={{ color: '#FFD15C' }}>→</b>
          <span>🦒 {latestHeight}cm</span>
        </div>
      )}

      <div className="mt-5 flex items-center gap-5 text-lg text-white/90">
        <button onClick={() => setIdx((i) => (i - 1 + photos.length) % photos.length)}>⏮</button>
        <button onClick={() => setPlaying((p) => !p)} className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-base" style={{ color: '#FF7A2F' }}>{playing ? '⏸' : '▶'}</button>
        <button onClick={() => setIdx((i) => (i + 1) % photos.length)}>⏭</button>
      </div>

      <div className="mt-3 flex gap-1.5">
        {photos.map((_, i) => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            className="h-1.5 rounded-full transition-all"
            style={{ width: i === idx ? 18 : 6, background: i === idx ? '#FFD15C' : 'rgba(255,255,255,.4)' }}
          />
        ))}
      </div>
    </div>
  );
}

export default function SlideshowPage() {
  return (
    <Suspense fallback={<div className="min-h-[100dvh]" style={{ background: '#2a1c40' }} />}>
      <SlideshowInner />
    </Suspense>
  );
}
