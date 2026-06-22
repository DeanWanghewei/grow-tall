'use client';

import { useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { GrowthChart } from '@/components/GrowthChart';
import { useRecordSheet } from '@/components/RecordSheet';
import { useTheme } from '@/lib/useTheme';

type GrowthResp = {
  child: { name: string };
  points: { ageMonths: number; height: number | null; weight: number | null; bmi: number | null }[];
  derived: {
    ageYears: number;
    predictedHeight: number | null;
    devStage: string;
    latestHeight: number | null;
    latestWeight: number | null;
    latestBmi: number | null;
    heightPercentile: number | null;
  };
  bands: { height: { ages: number[]; p3: number[]; p50: number[]; p97: number[] } | null };
  hasReferenceData: boolean;
};

type Metric = 'height' | 'weight' | 'bmi';
const METRICS: { key: Metric; label: string; icon: string; unit: string }[] = [
  { key: 'height', label: '身高', icon: '📏', unit: 'cm' },
  { key: 'weight', label: '体重', icon: '⚖️', unit: 'kg' },
  { key: 'bmi', label: 'BMI', icon: '📊', unit: '' },
];

export default function CurvesPage() {
  const { open } = useRecordSheet();
  const [children, setChildren] = useState<{ id: string; name: string; themeId: string }[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [metric, setMetric] = useState<Metric>('height');
  const [data, setData] = useState<GrowthResp | null>(null);

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
    fetch(`/api/growth/${activeId}`).then((r) => r.json()).then(setData);
  }, [activeId]);

  const active = children.find((c) => c.id === activeId);
  useTheme(active?.themeId);

  const option = useMemo(() => (data ? buildOption(data, metric) : {}), [data, metric]);
  const m = METRICS.find((x) => x.key === metric)!;

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
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="mx-3 flex gap-1 rounded-xl p-1" style={{ background: 'var(--band)' }}>
        {METRICS.map((x) => (
          <button
            key={x.key}
            onClick={() => setMetric(x.key)}
            className="flex-1 rounded-lg py-2 text-xs font-extrabold"
            style={metric === x.key
              ? { background: 'var(--card)', color: 'var(--primary)', boxShadow: '0 3px 6px rgba(255,138,61,.18)' }
              : { color: 'var(--muted)' }}
          >
            {x.icon} {x.label}
          </button>
        ))}
      </div>

      <div className="m-3 rounded-2xl bg-white p-3" style={{ boxShadow: '0 5px 0 rgba(255,138,61,.12)' }}>
        <div className="mb-1 flex justify-between text-xs font-bold" style={{ color: 'var(--muted)' }}>
          <span>{m.label}/年龄</span>
          {metric === 'height' && data?.derived.heightPercentile != null && (
            <b style={{ color: 'var(--primary)' }}>P{data.derived.heightPercentile}</b>
          )}
        </div>
        {data ? <GrowthChart option={option} /> : <div style={{ height: 280 }} />}
        {metric === 'height' && data && !data.hasReferenceData && (
          <p className="mt-1 text-center text-[10px]" style={{ color: 'var(--muted)' }}>
            百分位参考带需添加 WHO 数据(见 data/who/README);上方为孩子的成长轨迹
          </p>
        )}
      </div>

      {data && (
        <div className="mx-3 grid grid-cols-3 gap-2 pb-4">
          <Chip icon="📏" label="预测成年身高" value={data.derived.predictedHeight ? `≈${data.derived.predictedHeight}` : '—'} sub="cm" />
          <Chip icon="🌱" label="发育阶段" value={data.derived.devStage} />
          <Chip icon="📊" label="BMI" value={data.derived.latestBmi != null ? String(data.derived.latestBmi) : '—'} sub={data.derived.latestBmi != null ? '正常' : ''} />
        </div>
      )}

      {data && data.hasReferenceData && data.derived.heightPercentile != null && (
        <div className="mx-3 mb-6 flex items-center gap-2 rounded-2xl p-3" style={{ background: 'linear-gradient(135deg,#FFF0DA,#FFE3C2)', border: '2px dashed #FFC987' }}>
          <span className="text-2xl">🦒</span>
          <span className="text-xs font-bold leading-tight" style={{ color: 'var(--ink)' }}>
            身高在同龄人里<b style={{ color: 'var(--primary)' }}> P{data.derived.heightPercentile}</b>,长得很好!
          </span>
        </div>
      )}
    </AppShell>
  );
}

function Chip({ icon, label, value, sub }: { icon: string; label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl bg-white p-2 text-center" style={{ boxShadow: '0 4px 0 rgba(255,138,61,.12)' }}>
      <div className="text-base">{icon}</div>
      <div className="text-[8px] font-bold" style={{ color: 'var(--muted)' }}>{label}</div>
      <div className="text-sm font-extrabold" style={{ color: 'var(--ink)' }}>
        {value}
        {sub && <span className="text-[8px]" style={{ color: 'var(--success)' }}> {sub}</span>}
      </div>
    </div>
  );
}

function buildOption(data: GrowthResp, metric: Metric): Record<string, unknown> {
  const unit = metric === 'height' ? 'cm' : metric === 'weight' ? 'kg' : '';
  const childData = data.points
    .filter((p) => (p as Record<string, number | null>)[metric] != null)
    .map((p) => [p.ageMonths, (p as Record<string, number | null>)[metric] as number]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const series: any[] = [];

  if (metric === 'height' && data.bands?.height) {
    const b = data.bands.height;
    series.push({
      name: '正常范围', type: 'line', stack: 'range', symbol: 'none', silent: true, z: 1,
      data: b.ages.map((a, i) => [a, b.p3[i]]),
      lineStyle: { opacity: 0 }, areaStyle: { color: 'transparent' },
    });
    series.push({
      name: '正常范围', type: 'line', stack: 'range', symbol: 'none', silent: true, z: 1,
      data: b.ages.map((a, i) => [a, +(b.p97[i] - b.p3[i]).toFixed(1)]),
      lineStyle: { opacity: 0 }, areaStyle: { color: 'rgba(255,138,61,.14)' },
    });
    series.push({
      name: 'P50 中位', type: 'line', symbol: 'none', silent: true, z: 2,
      data: b.ages.map((a, i) => [a, b.p50[i]]),
      lineStyle: { color: '#E8B27A', width: 1.4, type: 'dashed' },
    });
  }

  series.push({
    name: '我的数据', type: 'line', smooth: true, z: 5,
    data: childData,
    lineStyle: { color: '#FF7A2F', width: 3 }, itemStyle: { color: '#FF7A2F' }, symbolSize: 7,
  });

  return {
    grid: { left: 38, right: 16, top: 28, bottom: 28 },
    xAxis: {
      type: 'value', name: '月', min: 0,
      nameTextStyle: { fontSize: 10 },
      splitLine: { lineStyle: { color: '#F2E2CB' } },
      axisLabel: { fontSize: 10 },
    },
    yAxis: {
      type: 'value', name: unit, scale: true,
      nameTextStyle: { fontSize: 10 },
      splitLine: { lineStyle: { color: '#F2E2CB' } },
      axisLabel: { fontSize: 10 },
    },
    series,
    legend: { show: metric === 'height', top: 0, right: 4, textStyle: { fontSize: 9 } },
    tooltip: { trigger: 'axis' },
  };
}
