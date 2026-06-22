import type { Config } from 'tailwindcss';

/**
 * Tailwind 配置(TS 版)。
 *
 * 注意:本项目使用 Tailwind v4(以 CSS 为中心的配置,见 src/app/globals.css 的
 * @theme 块)。此文件作为主题扩展的 TS 入口保留,供后续主题系统(Task 3)使用。
 * 如需启用 JS 配置,在 globals.css 顶部添加 `@config "../../tailwind.config.ts";`。
 */
const config: Config = {
  content: [
    './src/**/*.{ts,tsx,js,jsx,mdx}',
  ],
  theme: {
    extend: {
      // 主题 token 将在 Task 3 中扩展
    },
  },
  plugins: [],
};

export default config;
