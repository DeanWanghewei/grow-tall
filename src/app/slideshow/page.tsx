'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

type Photo = { id: string; takenAt: string; url: string };
type GrowthResp = {
  child: { name: string; birthDate: string };
  points: { date: string; height: number | null; weight: number | null }[];
  derived: { latestHeight: number | null };
};

function ageLabel(birth: string, at: string): string {
  const ms = new Date(at).getTime() - new Date(birth).getTime();
  const years = ms / (365.25 * 86400000);
  if (years < 1) return `${Math.max(0, Math.floor(ms / (30.4375 * 86400000)))} 个月`;
  return `${Math.floor(years)} 岁`;
}

interface WallPhoto extends Photo {
  height: number; // 拍摄时身高(cm)
  age: string;
}

function SlideshowInner() {
  const params = useSearchParams();
  const childId = params.get('child') ?? '';
  const [photos, setPhotos] = useState<WallPhoto[]>([]);
  const [growth, setGrowth] = useState<GrowthResp | null>(null);
  const [playing, setPlaying] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!childId) return;
    Promise.all([
      fetch(`/api/photos?childId=${childId}`).then((r) => r.json()),
      fetch(`/api/growth/${childId}`).then((r) => r.json()),
    ]).then(([p, g]: [{ photos: Photo[] }, GrowthResp]) => {
      const list = p.photos.slice().sort((a, b) => +new Date(a.takenAt) - +new Date(b.takenAt));
      setGrowth(g);
      // 每张照片匹配拍摄时最近的身高记录
      const withH: WallPhoto[] = list.map((ph) => {
        const t = new Date(ph.takenAt).getTime();
        const recs = g.points.filter((pt) => new Date(pt.date).getTime() <= t && pt.height != null);
        const h = recs.at(-1)?.height ?? g.derived.latestHeight ?? 100;
        return { ...ph, height: h, age: ageLabel(g.child.birthDate, ph.takenAt) };
      });
      setPhotos(withH);
    });
  }, [childId]);

  // 自动播放:从最新(顶)向最旧(底)缓慢滚动
  useEffect(() => {
    if (!playing) return;
    const el = scrollRef.current;
    if (!el) return;
    const t = setInterval(() => {
      if (!el) return;
      el.scrollTop += 1.2;
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 1) setPlaying(false);
    }, 16);
    return () => clearInterval(t);
  }, [playing]);

  const { minH, maxH, pxPerCm } = useMemo(() => {
    const hs = photos.map((p) => p.height);
    const lo = hs.length ? Math.min(...hs) : 50;
    const hi = hs.length ? Math.max(...hs) : 120;
    return { minH: Math.max(0, Math.floor((lo - 5) / 10) * 10), maxH: Math.ceil((hi + 5) / 10) * 10, pxPerCm: 7 };
  }, [photos]);

  const wallPx = Math.max((maxH - minH) * pxPerCm + 320, 420);
  const yFor = (h: number) => (maxH - h) * pxPerCm + 120; // 越高越靠顶

  const latest = photos.at(-1) ?? null;

  if (photos.length === 0) {
    return (
      <div
        className="flex min-h-[100dvh] flex-col items-center justify-center gap-3 p-8 text-center"
        style={{ background: 'linear-gradient(180deg,#FFE9C9,#FFF7EC 60%,#FFE0B8)', color: 'var(--ink)', paddingTop: 'var(--safe-top)', paddingBottom: 'var(--safe-bottom)' }}
      >
        <div className="text-6xl">🦒</div>
        <p className="text-lg font-extrabold">还没有照片</p>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>先去相册添加成长照片,就能在成长墙上穿越时光啦</p>
        <Link href="/album" className="mt-2 rounded-xl px-5 py-2 text-sm font-extrabold text-white" style={{ background: 'linear-gradient(95deg,var(--primary),var(--primary-2))' }}>
          返回相册
        </Link>
      </div>
    );
  }

  const rulerMarks: number[] = [];
  for (let h = maxH; h >= minH; h -= 10) rulerMarks.push(h);

  return (
    <div className="relative h-[100dvh] overflow-hidden" style={{ background: 'linear-gradient(180deg,#FFEBC4,#FFF3DF 55%,#EAD3A6)' }}>
      {/* 顶部 */}
      <div className="absolute left-0 right-0 top-0 z-20 flex items-center gap-2 px-4 py-3" style={{ paddingTop: 'calc(var(--safe-top) + 8px)' }}>
        <span className="text-lg">🕰️</span>
        <span className="text-sm font-extrabold" style={{ color: 'var(--ink)' }}>成长时光机</span>
        <Link href="/album" className="ml-auto rounded-full bg-white/80 px-3 py-1 text-sm font-bold" style={{ color: 'var(--primary)' }}>✕</Link>
      </div>

      {/* 可滚动的成长墙 */}
      <div ref={scrollRef} className="h-full overflow-y-auto" style={{ paddingBottom: 'calc(var(--safe-bottom) + 72px)', paddingTop: 'var(--safe-top)' }}>
        <div className="relative mx-auto" style={{ width: '100%', maxWidth: 480, height: wallPx }}>
          {/* 身高尺 */}
          <div className="absolute bottom-16 right-3 top-0 w-px" style={{ background: 'linear-gradient(#E8B27A,#F0D49E)' }} />
          {rulerMarks.map((h) => (
            <div key={h} className="absolute right-3 flex items-center gap-1" style={{ top: yFor(h) }}>
              <span className="text-[9px] font-extrabold" style={{ color: 'var(--muted)' }}>{h}</span>
              <span className="h-px w-3" style={{ background: '#C9923F' }} />
            </div>
          ))}

          {/* 照片贴在对应身高处 */}
          {photos.map((p, i) => {
            const isLatest = latest && p.id === latest.id;
            const side = i % 2 === 0 ? 'left' : 'right';
            return (
              <div
                key={p.id}
                className="absolute"
                style={{
                  top: yFor(p.height),
                  [side]: 24,
                  zIndex: isLatest ? 5 : 2,
                  transform: `rotate(${i % 2 ? 3 : -3}deg) scale(${isLatest ? 1.25 : 1})`,
                  transformOrigin: side === 'left' ? 'left center' : 'right center',
                }}
              >
                <Polaroid p={p} big={!!isLatest} />
                <div className="mt-1 text-center text-[8px] font-extrabold" style={{ color: 'var(--muted)' }}>
                  {p.age} · {p.height}cm
                </div>
              </div>
            );
          })}

          {/* 最新一张的对话气泡 */}
          {latest && (
            <div
              className="absolute rounded-xl bg-white px-3 py-1.5 text-xs font-extrabold shadow"
              style={{ top: yFor(latest.height) - 34, left: '50%', transform: 'translateX(-50%)', color: 'var(--primary)', zIndex: 6 }}
            >
              现在的 {growth?.child.name} · {latest.height}cm 🦒
            </div>
          )}

          {/* 底部长颈鹿 */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
            <div style={{ fontSize: 56, lineHeight: 1 }}>🦒</div>
            <div className="mb-2 text-[9px] font-bold" style={{ color: 'var(--muted)' }}>从 {minH}cm 长到 {maxH}cm</div>
          </div>
        </div>
      </div>

      {/* 底部播放控制 */}
      <div className="absolute bottom-0 left-0 right-0 z-20 flex flex-col items-center gap-2 pb-4" style={{ paddingBottom: 'calc(var(--safe-bottom) + 12px)' }}>
        <button
          onClick={() => setPlaying((p) => !p)}
          className="flex h-12 w-12 items-center justify-center rounded-full text-base text-white shadow-lg"
          style={{ background: 'linear-gradient(135deg,var(--primary-2),var(--primary))', boxShadow: '0 5px 0 color-mix(in srgb,var(--primary) 70%,black)' }}
        >
          {playing ? '⏸' : '▶'}
        </button>
        <span className="text-[9px] font-bold" style={{ color: 'var(--muted)' }}>上下滑动 · 穿越时光</span>
      </div>
    </div>
  );
}

/** 拍立得照片:图片加载失败(S3 未配)时降级为占位贴纸。 */
function Polaroid({ p, big }: { p: WallPhoto; big: boolean }) {
  const [err, setErr] = useState(false);
  const w = big ? 104 : 78;
  return (
    <div
      className="relative overflow-hidden rounded-md bg-white p-1.5 pb-3"
      style={{ width: w, boxShadow: '0 5px 10px rgba(120,70,30,.18)' }}
    >
      <div
        className="flex items-center justify-center"
        style={{ width: w - 12, height: w - 12, background: 'linear-gradient(135deg,#FFD3A5,#FFB347)', borderRadius: 4 }}
      >
        <span style={{ fontSize: big ? 30 : 22 }}>{err || !p.url ? '🧒' : ''}</span>
        {!err && p.url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={p.url}
            alt="成长照片"
            onError={() => setErr(true)}
            className="absolute"
            style={{ width: w - 12, height: w - 12, objectFit: 'cover', borderRadius: 4, top: 6, left: 6 }}
          />
        )}
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
