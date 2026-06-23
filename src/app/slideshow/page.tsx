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
      setPhotos((p.photos as Photo[]).sort((a, b) => +new Date(a.takenAt) - +new Date(b.takenAt)));
      setGrowth(g);
    });
  }, [childId]);

  useEffect(() => {
    if (!playing || photos.length === 0) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % photos.length), 2500);
    return () => clearInterval(t);
  }, [playing, photos.length]);

  const meta = useMemo(() => {
    if (!growth || photos.length === 0) return null;
    const photo = photos[idx];
    const t = new Date(photo.takenAt).getTime();
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

  const ink = 'var(--ink)';
  const muted = 'var(--muted)';

  if (photos.length === 0) {
    return (
      <div
        className="flex min-h-[100dvh] flex-col items-center justify-center gap-3 p-8 text-center"
        style={{ background: 'linear-gradient(180deg,#FFE9C9,#FFF7EC 60%,#FFE0B8)', color: ink, paddingTop: 'var(--safe-top)', paddingBottom: 'var(--safe-bottom)' }}
      >
        <div className="text-6xl">🦒</div>
        <p className="text-lg font-extrabold">还没有照片</p>
        <p className="text-sm" style={{ color: muted }}>先去相册添加成长照片,就能播放幻灯片啦</p>
        <Link
          href="/album"
          className="mt-2 rounded-xl px-5 py-2 text-sm font-extrabold text-white"
          style={{ background: 'linear-gradient(95deg,var(--primary),var(--primary-2))' }}
        >
          返回相册
        </Link>
      </div>
    );
  }

  const photo = photos[idx];
  return (
    <div
      className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden p-4"
      style={{ background: 'linear-gradient(180deg,#FFE9C9 0%,#FFF7EC 55%,#FFE0B8 100%)', color: ink, paddingTop: 'var(--safe-top)' }}
    >
      <Link
        href="/album"
        className="absolute right-4 z-20 rounded-full bg-white px-3 py-1 text-sm font-bold shadow"
        style={{ top: 'calc(var(--safe-top) + 8px)', color: 'var(--primary)' }}
      >
        ✕
      </Link>

      <div
        className="rotate-[-2deg] rounded-2xl bg-white p-2 pb-4"
        style={{ boxShadow: '0 16px 30px rgba(120,70,30,.25)' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo.url} alt="成长照片" className="h-[46vh] w-auto rounded-lg object-cover" />
        {meta && (
          <p className="mt-2 text-center text-xs font-extrabold" style={{ color: ink }}>
            {growth?.child.name} · {meta.age}
          </p>
        )}
      </div>

      {meta && (
        <div className="mt-4 rounded-2xl bg-white/95 px-5 py-2 text-center" style={{ boxShadow: '0 8px 18px rgba(120,70,30,.18)' }}>
          <div className="text-base font-extrabold" style={{ color: ink }}>{meta.age}</div>
          <div className="text-xs font-bold" style={{ color: muted }}>
            身高 {meta.height ? `${meta.height}cm` : '—'} · 体重 {meta.weight ? `${meta.weight}kg` : '—'}
          </div>
        </div>
      )}

      {firstHeight != null && latestHeight != null && (
        <div
          className="mt-3 flex items-center gap-2 rounded-full border-2 border-dashed px-4 py-2 text-xs font-extrabold"
          style={{ borderColor: '#FFC987', background: '#fff', color: ink }}
        >
          <span>🍼 {firstHeight}cm</span>
          <b style={{ color: 'var(--primary)' }}>→</b>
          <span>🦒 {latestHeight}cm</span>
        </div>
      )}

      <div className="mt-5 flex items-center gap-5 text-lg" style={{ color: muted }}>
        <button onClick={() => setIdx((i) => (i - 1 + photos.length) % photos.length)}>⏮</button>
        <button
          onClick={() => setPlaying((p) => !p)}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-base shadow"
          style={{ color: 'var(--primary)' }}
        >
          {playing ? '⏸' : '▶'}
        </button>
        <button onClick={() => setIdx((i) => (i + 1) % photos.length)}>⏭</button>
      </div>

      <div className="mt-3 flex gap-1.5">
        {photos.map((_, i) => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            className="h-1.5 rounded-full transition-all"
            style={{ width: i === idx ? 18 : 6, background: i === idx ? 'var(--primary)' : 'rgba(120,70,30,.25)' }}
          />
        ))}
      </div>
    </div>
  );
}

export default function SlideshowPage() {
  return (
    <Suspense fallback={<div className="min-h-[100dvh]" style={{ background: 'linear-gradient(180deg,#FFE9C9,#FFF7EC)' }} />}>
      <SlideshowInner />
    </Suspense>
  );
}
