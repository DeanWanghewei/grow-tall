'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { GrowthWall } from '@/components/GrowthWall';
import { useRecordSheet } from '@/components/RecordSheet';
import { useTheme } from '@/lib/useTheme';
import { STICKERS, summarize } from '@/lib/stickers';

type Child = {
  id: string;
  name: string;
  gender: string;
  birthDate: string;
  themeId: string;
};
type Record = {
  id: string;
  date: string;
  height: number | null;
  weight: number | null;
};

export default function HomePage() {
  const { open } = useRecordSheet();
  const [children, setChildren] = useState<Child[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [records, setRecords] = useState<Record[]>([]);

  useEffect(() => {
    fetch('/api/children')
      .then((r) => r.json())
      .then((d) => {
        setChildren(d.children);
        setActiveId(d.children[0]?.id ?? null);
      });
  }, []);

  useEffect(() => {
    if (!activeId) return;
    fetch(`/api/records?childId=${activeId}`)
      .then((r) => r.json())
      .then((d) => setRecords(d.records));
  }, [activeId]);

  const active = children.find((c) => c.id === activeId);
  useTheme(active?.themeId);
  const latest = records.at(-1);
  const stickers = summarize(records);

  return (
    <AppShell onRecord={() => activeId && open(activeId)}>
      <div className="p-4">
        <select
          value={activeId ?? ''}
          onChange={(e) => setActiveId(e.target.value)}
          className="rounded-xl px-3 py-2 font-extrabold"
          style={{ background: 'var(--card)', color: 'var(--ink)' }}
        >
          {children.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <GrowthWall name={active?.name ?? ''} heightCm={latest?.height ?? null} />

      <div className="grid grid-cols-2 gap-3 p-3">
        <Stat label="身高" value={latest?.height} unit="cm" />
        <Stat label="体重" value={latest?.weight} unit="kg" />
      </div>

      <StickerStrip stickers={stickers} />

      <p className="pb-6 text-center text-xs" style={{ color: 'var(--muted)' }}>
        共 {records.length} 条记录
      </p>
    </AppShell>
  );
}

function Stat({
  label,
  value,
  unit,
}: {
  label: string;
  value?: number | null;
  unit: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-4" style={{ boxShadow: '0 5px 0 rgba(255,138,61,.14)' }}>
      <div className="text-xs font-bold" style={{ color: 'var(--muted)' }}>
        {label}
      </div>
      <div className="text-2xl font-extrabold" style={{ color: 'var(--ink)' }}>
        {value ?? '—'}
        {value && (
          <span className="text-xs" style={{ color: 'var(--muted)' }}>
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

function StickerStrip({ stickers }: { stickers: ReturnType<typeof summarize> }) {
  const earnedIds = new Set(stickers.earned.map((s) => s.id));
  return (
    <div className="mx-3 mb-1 rounded-2xl bg-white p-3" style={{ boxShadow: '0 4px 0 rgba(255,138,61,.10)' }}>
      <div className="mb-2 flex items-center justify-between text-xs font-extrabold" style={{ color: 'var(--ink)' }}>
        <span>🏅 贴纸成就</span>
        <span style={{ color: 'var(--muted)' }}>
          {stickers.earned.length}/{STICKERS.length}
        </span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {STICKERS.map((s) => {
          const got = earnedIds.has(s.id);
          return (
            <div
              key={s.id}
              className="flex min-w-[52px] flex-col items-center rounded-xl px-2 py-1.5"
              style={{
                background: got ? 'var(--band)' : 'transparent',
                opacity: got ? 1 : 0.4,
                filter: got ? 'none' : 'grayscale(1)',
              }}
              title={s.desc}
            >
              <span className="text-2xl leading-none">{s.emoji}</span>
              <span className="mt-0.5 text-[8px] font-bold" style={{ color: 'var(--ink)' }}>
                {s.name}
              </span>
            </div>
          );
        })}
      </div>
      {stickers.next && (
        <p className="mt-1 text-center text-[9px]" style={{ color: 'var(--muted)' }}>
          再记录一点,解锁「{stickers.next.emoji} {stickers.next.name}」
        </p>
      )}
    </div>
  );
}
