export type ThemeId = 'warm' | 'mint' | 'rainbow';

export interface Theme {
  id: ThemeId;
  name: string;
  mascot: string; // 表情/造型标识;真实 SVG 在 Mascot 组件按 id 渲染
  vars: Record<string, string>;
}

const warm: Theme = {
  id: 'warm',
  name: '暖阳长颈鹿',
  mascot: 'giraffe',
  vars: {
    '--bg': '#FFF7EC',
    '--bg-frame': '#F0C089',
    '--card': '#FFFFFF',
    '--ink': '#5B3A1F',
    '--muted': '#B98E6A',
    '--primary': '#FF8A3D',
    '--primary-2': '#FFB347',
    '--accent': '#FF6B6B',
    '--success': '#3FAE6A',
    '--band': 'rgba(255,138,61,.12)',
  },
};

const mint: Theme = {
  id: 'mint',
  name: '清新薄荷',
  mascot: 'chick',
  vars: {
    '--bg': '#F1F8F6',
    '--bg-frame': '#B6E0D6',
    '--card': '#FFFFFF',
    '--ink': '#173128',
    '--muted': '#7C9C94',
    '--primary': '#21A99B',
    '--primary-2': '#56C596',
    '--accent': '#2EA881',
    '--success': '#2EA881',
    '--band': 'rgba(33,169,155,.12)',
  },
};

const rainbow: Theme = {
  id: 'rainbow',
  name: '彩虹活力',
  mascot: 'unicorn',
  vars: {
    '--bg': 'linear-gradient(170deg,#FBF0FF,#F2F7FF 55%,#FFF6E6)',
    '--bg-frame': '#C7B8FF',
    '--card': '#FFFFFF',
    '--ink': '#3A2A5C',
    '--muted': '#9A86C0',
    '--primary': '#7C5CFF',
    '--primary-2': '#FF7AA8',
    '--accent': '#FFC75F',
    '--success': '#4FC3A1',
    '--band': 'rgba(124,92,255,.14)',
  },
};

export const THEMES: Record<ThemeId, Theme> = { warm, mint, rainbow };

export function resolveTheme(id?: string | null): Theme {
  if (id && id in THEMES) return THEMES[id as ThemeId];
  return THEMES.warm;
}

export function recommendedThemeForAge(ageYears: number): ThemeId {
  if (ageYears <= 6) return 'warm';
  if (ageYears <= 12) return 'mint';
  return 'rainbow';
}
