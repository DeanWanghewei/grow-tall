'use client';

import { useEffect } from 'react';
import { resolveTheme } from './themes';

/**
 * 按当前孩子的主题,即时把 CSS 变量应用到 <html>。
 * 切换孩子 / 换主题时,整盘配色(背景、卡片、主色、强调…)立刻变化。
 */
export function useTheme(themeId?: string | null) {
  useEffect(() => {
    const theme = resolveTheme(themeId);
    const root = document.documentElement;
    root.setAttribute('data-theme', theme.id);
    for (const [k, v] of Object.entries(theme.vars)) {
      root.style.setProperty(k, v);
    }
  }, [themeId]);
}
