import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  // Vitest 无需处理 CSS;给空 inline PostCSS 配置,避免加载项目的
  // postcss.config.mjs(Tailwind v4 的 @tailwindcss/postcss 在 Vite 加载器下不兼容)。
  css: { postcss: { plugins: [] } },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
});
