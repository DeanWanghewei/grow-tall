import fs from 'node:fs/promises';
import path from 'node:path';
import { lmsAtAge, lmsValueAtZ, type LmsTable, type Gender } from './growth';

// 仅服务端使用(Node fs)。客户端通过 /api/growth 取数据。
const DATA_DIR = path.join(process.cwd(), 'data', 'who');

const cache = new Map<string, LmsTable | null>();

/**
 * 读取 WHO LMS 表。文件名约定:
 *   lhfa-boys.json / lhfa-girls.json  身高/年龄
 *   wfa-boys.json  / wfa-girls.json   体重/年龄
 *   bmi-boys.json  / bmi-girls.json   BMI/年龄
 * 缺文件返回 null(上层据此禁用百分位带)。
 */
export async function getLmsTable(
  metric: 'lhfa' | 'wfa' | 'bmi',
  gender: Gender,
): Promise<LmsTable | null> {
  if (gender === 'OTHER') return null;
  const sex = gender === 'MALE' ? 'boys' : 'girls';
  const name = `${metric}-${sex}.json`;
  if (cache.has(name)) return cache.get(name)!;
  let table: LmsTable | null = null;
  try {
    const raw = await fs.readFile(path.join(DATA_DIR, name), 'utf8');
    table = JSON.parse(raw) as LmsTable;
  } catch {
    table = null;
  }
  cache.set(name, table);
  return table;
}

// z 分:P3 / P15 / P50 / P85 / P97
const Z = { p3: -1.8808, p15: -1.0364, p50: 0, p85: 1.0364, p97: 1.8808 };

export interface BandSeries {
  ages: number[];
  p3: number[];
  p15: number[];
  p50: number[];
  p85: number[];
  p97: number[];
}

/** 在 ageMin..ageMax 间按 step 月采样,生成各百分位曲线。 */
export function buildBands(
  table: LmsTable,
  ageMin: number,
  ageMax: number,
  step = 3,
): BandSeries {
  const out: BandSeries = { ages: [], p3: [], p15: [], p50: [], p85: [], p97: [] };
  for (let age = ageMin; age <= ageMax; age += step) {
    const lms = lmsAtAge(table, age);
    out.ages.push(age);
    out.p3.push(+lmsValueAtZ(Z.p3, lms).toFixed(1));
    out.p15.push(+lmsValueAtZ(Z.p15, lms).toFixed(1));
    out.p50.push(+lmsValueAtZ(Z.p50, lms).toFixed(1));
    out.p85.push(+lmsValueAtZ(Z.p85, lms).toFixed(1));
    out.p97.push(+lmsValueAtZ(Z.p97, lms).toFixed(1));
  }
  return out;
}
