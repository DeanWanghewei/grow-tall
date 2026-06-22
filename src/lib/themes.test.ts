import { describe, it, expect } from 'vitest';
import { resolveTheme, THEMES, recommendedThemeForAge } from './themes';

describe('themes', () => {
  it('暴露三套主题: warm/mint/rainbow', () => {
    expect(Object.keys(THEMES).sort()).toEqual(['mint', 'rainbow', 'warm']);
  });

  it('resolveTheme 返回已知主题,未知回落 warm', () => {
    expect(resolveTheme('mint').id).toBe('mint');
    expect(resolveTheme('nope').id).toBe('warm');
    expect(resolveTheme(undefined).id).toBe('warm');
  });

  it('recommendedThemeForAge: 0-6→warm, 7-12→mint, 13+→rainbow', () => {
    expect(recommendedThemeForAge(3)).toBe('warm');
    expect(recommendedThemeForAge(9)).toBe('mint');
    expect(recommendedThemeForAge(15)).toBe('rainbow');
  });
});
