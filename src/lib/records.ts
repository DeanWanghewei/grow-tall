export interface PartialMeasure {
  height: number | null;
  weight: number | null;
}

/**
 * 同一孩子同一天的多次录入合并:
 * 新输入中非空字段覆盖旧值,空字段(null/undefined)保留旧值。
 */
export function mergeRecordInput(prev: PartialMeasure, next: PartialMeasure): PartialMeasure {
  return {
    height: next.height ?? prev.height,
    weight: next.weight ?? prev.weight,
  };
}
