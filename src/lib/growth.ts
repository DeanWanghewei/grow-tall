export interface LmsPoint {
  age: number;
  L: number;
  M: number;
  S: number;
}
export type LmsTable = LmsPoint[];
export type Gender = 'MALE' | 'FEMALE' | 'OTHER';

/** 标准正态 CDF 的有理近似(Abramowitz-Stegun 26.2.17) */
function normalCdf(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp((-z * z) / 2);
  const p =
    d *
    t *
    (0.3193815 +
      t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return z > 0 ? 1 - p : p;
}

/** LMS(Box-Cox)由测量值算 z 分。L=0 时用对数形式。 */
export function lmsToZ(
  value: number,
  lms: { L: number; M: number; S: number },
): number {
  const { L, M, S } = lms;
  if (L === 0) return Math.log(value / M) / S;
  return (Math.pow(value / M, L) - 1) / (L * S);
}

export function lmsToPercentile(
  value: number,
  lms: { L: number; M: number; S: number },
): number {
  return Math.round(normalCdf(lmsToZ(value, lms)) * 100);
}

export function bmi(weightKg: number, heightM: number): number {
  return weightKg / (heightM * heightM);
}

/** 在 LMS 表中按 age 线性插值找到 L/M/S(表外取端点)。 */
function interpolate(
  table: LmsTable,
  age: number,
): { L: number; M: number; S: number } {
  if (age <= table[0].age) return table[0];
  if (age >= table[table.length - 1].age) return table[table.length - 1];
  for (let i = 0; i < table.length - 1; i++) {
    const a = table[i];
    const b = table[i + 1];
    if (age >= a.age && age <= b.age) {
      const t = (age - a.age) / (b.age - a.age);
      return {
        L: a.L + (b.L - a.L) * t,
        M: a.M + (b.M - a.M) * t,
        S: a.S + (b.S - a.S) * t,
      };
    }
  }
  return table[table.length - 1];
}

export function percentileFromLmsTable(
  value: number,
  ageMonths: number,
  table: LmsTable,
): number {
  return lmsToPercentile(value, interpolate(table, ageMonths));
}

/** 父母中位身高(靶身高)预测。 */
export function midParentalHeight(
  fatherCm: number,
  motherCm: number,
  gender: Gender,
): number | null {
  if (gender === 'MALE') return Math.round((fatherCm + motherCm + 13) / 2);
  if (gender === 'FEMALE') return Math.round((fatherCm + motherCm - 13) / 2);
  return null;
}

/** 发育阶段提示(科普,非 Tanner 分期)。 */
export function devStage(ageYears: number, gender: Gender): string {
  if (ageYears <= 6) return '学龄前';
  if (ageYears <= 12) {
    if (gender === 'FEMALE' && ageYears >= 8) return '青春期';
    return '学龄期';
  }
  return '青春期';
}
