import { describe, it, expect } from 'vitest';
import { earnedStickers, STICKERS, summarize } from './stickers';

const recs = (months: string[]) =>
  months.map((m) => ({ id: m, date: `${m}-15`, height: 100, weight: 20 }));

describe('stickers', () => {
  it('无记录 → 不解锁任何贴纸', () => {
    expect(earnedStickers([]).map((s) => s.id)).toEqual([]);
  });

  it('1 条记录 → 解锁 first(初出茅庐)', () => {
    const ids = earnedStickers(recs(['2024-01'])).map((s) => s.id);
    expect(ids).toContain('first');
  });

  it('3 个不同月份 → first + m3,不到 m6', () => {
    const ids = earnedStickers(recs(['2024-01', '2024-05', '2024-09'])).map((s) => s.id);
    expect(ids).toContain('first');
    expect(ids).toContain('m3');
    expect(ids).not.toContain('m6');
  });

  it('10 条记录 → 解锁 r10', () => {
    const ten = Array.from({ length: 10 }, (_, i) => ({
      id: String(i),
      date: `2024-${String((i % 12) + 1).padStart(2, '0')}-01`,
      height: 100,
      weight: 20,
    }));
    expect(earnedStickers(ten).map((s) => s.id)).toContain('r10');
  });

  it('summarize 返回月数/条数/已得/下一个目标', () => {
    const s = summarize(recs(['2024-01', '2024-02', '2024-03', '2024-04']));
    expect(s.months).toBe(4);
    expect(s.records).toBe(4);
    expect(s.earned.length).toBeGreaterThan(0);
    expect(s.next).toBeTruthy();
  });

  it('STICKERS 非空', () => {
    expect(STICKERS.length).toBeGreaterThan(0);
  });
});
