import { describe, it, expect } from 'vitest';
import { mergeRecordInput } from './records';

describe('records merge', () => {
  it('空字段不覆盖已有值', () => {
    expect(mergeRecordInput({ height: 110, weight: 20 }, { height: null, weight: 21 })).toEqual({ height: 110, weight: 21 });
  });
  it('新值覆盖旧值', () => {
    expect(mergeRecordInput({ height: 110, weight: 20 }, { height: 112, weight: null })).toEqual({ height: 112, weight: 20 });
  });
  it('两者皆空保持原值', () => {
    expect(mergeRecordInput({ height: 110, weight: 20 }, { height: null, weight: null })).toEqual({ height: 110, weight: 20 });
  });
});
