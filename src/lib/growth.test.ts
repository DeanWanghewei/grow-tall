import { describe, it, expect } from 'vitest';
import {
  lmsToZ,
  lmsToPercentile,
  bmi,
  percentileFromLmsTable,
  midParentalHeight,
  devStage,
  lmsValueAtZ,
} from './growth';
import sample from '../../data/who/lhfa-boys-sample.json';

describe('growth', () => {
  it('lmsToZ: L=1 时 z = ((X/M)-1)/S', () => {
    // L=1,M=100,S=0.1,X=110 => (1.1-1)/0.1 = 1.0
    expect(lmsToZ(110, { L: 1, M: 100, S: 0.1 })).toBeCloseTo(1.0, 6);
  });

  it('lmsToPercentile: X=M 时为 P50', () => {
    expect(lmsToPercentile(100, { L: 1, M: 100, S: 0.1 })).toBeCloseTo(50, 0);
  });

  it('bmi = kg / m^2', () => {
    expect(bmi(21.5, 1.152)).toBeCloseTo(16.2, 1);
  });

  it('percentileFromLmsTable: 按年龄插值查表,中位值≈P50,更大值更高', () => {
    const p = percentileFromLmsTable(91, 24, sample); // 24月 M=91 → ≈P50
    expect(p).toBeGreaterThan(45);
    const high = percentileFromLmsTable(100, 24, sample);
    expect(high).toBeGreaterThan(p);
  });

  it('midParentalHeight: 男 (F+M+13)/2,女 (F+M-13)/2,其他为 null', () => {
    expect(midParentalHeight(178, 165, 'MALE')).toBeCloseTo(178, 0);
    expect(midParentalHeight(178, 165, 'FEMALE')).toBeCloseTo(165, 0);
    expect(midParentalHeight(178, 165, 'OTHER')).toBeNull();
  });

  it('devStage: 按年龄/性别给阶段名', () => {
    expect(devStage(3, 'MALE')).toBe('学龄前');
    expect(devStage(11, 'FEMALE')).toBe('青春期');
    expect(devStage(11, 'MALE')).toBe('学龄期');
  });

  it('lmsValueAtZ:与 lmsToZ 互逆,z=0 时为 M', () => {
    const lms = { L: 1, M: 100, S: 0.1 };
    expect(lmsValueAtZ(0, lms)).toBeCloseTo(100, 6); // P50 = M
    const z = 1.5;
    expect(lmsToZ(lmsValueAtZ(z, lms), lms)).toBeCloseTo(z, 6);
  });
});
