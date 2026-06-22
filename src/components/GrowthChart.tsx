'use client';

import dynamic from 'next/dynamic';

// ECharts 依赖 DOM/画布,客户端动态加载、关闭 SSR。
const ReactECharts = dynamic(() => import('echarts-for-react'), {
  ssr: false,
  loading: () => <div style={{ height: 280 }} />,
});

export function GrowthChart({ option }: { option: Record<string, unknown> }) {
  return (
    <ReactECharts
      option={option}
      notMerge
      lazyUpdate
      style={{ height: 280, width: '100%' }}
      opts={{ renderer: 'svg' }}
    />
  );
}
