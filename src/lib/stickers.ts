export type StickerKind = 'records' | 'months';

export interface Sticker {
  id: string;
  emoji: string;
  name: string;
  desc: string;
  kind: StickerKind;
  threshold: number;
}

/** 贴纸成就:按「累计记录条数」和「不同记录月份」解锁。 */
export const STICKERS: Sticker[] = [
  { id: 'first', emoji: '🌱', name: '初出茅庐', desc: '第一次记录', kind: 'records', threshold: 1 },
  { id: 'm3', emoji: '🌟', name: '坚持一季', desc: '记录满 3 个月', kind: 'months', threshold: 3 },
  { id: 'r10', emoji: '📒', name: '勤记录', desc: '累计 10 条', kind: 'records', threshold: 10 },
  { id: 'm6', emoji: '🏅', name: '半年小达人', desc: '记录满 6 个月', kind: 'months', threshold: 6 },
  { id: 'r50', emoji: '📚', name: '成长档案', desc: '累计 50 条', kind: 'records', threshold: 50 },
  { id: 'm12', emoji: '🎉', name: '成长一年', desc: '记录满 12 个月', kind: 'months', threshold: 12 },
];

interface RecordLike {
  date: string;
}

/** 已解锁的贴纸(按 STICKERS 顺序)。 */
export function earnedStickers(records: RecordLike[]): Sticker[] {
  const recordCount = records.length;
  const months = new Set(records.map((r) => r.date.slice(0, 7))).size;
  return STICKERS.filter((s) =>
    s.kind === 'records' ? recordCount >= s.threshold : months >= s.threshold,
  );
}

export interface StickerSummary {
  records: number;
  months: number;
  earned: Sticker[];
  /** 下一个未解锁的贴纸(进度激励用)。 */
  next: Sticker | null;
}

export function summarize(records: RecordLike[]): StickerSummary {
  const earned = earnedStickers(records);
  const earnedIds = new Set(earned.map((s) => s.id));
  const next = STICKERS.find((s) => !earnedIds.has(s.id)) ?? null;
  return {
    records: records.length,
    months: new Set(records.map((r) => r.date.slice(0, 7))).size,
    earned,
    next,
  };
}
