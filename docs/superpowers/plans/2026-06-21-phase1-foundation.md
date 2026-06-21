# Phase 1 · 地基与核心闭环 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 搭出一个可登录、可管理多个孩子、可录入身高/体重、能在首页「成长墙」看到状态的 Next.js PWA 骨架——含数据层、主题系统、成长算法、单密码访问控制。

**Architecture:** Next.js(App Router)单体全栈应用 + Prisma(SQLite)+ Tailwind(CSS 变量做主题)+ Vitest。纯逻辑(LMS 百分位、BMI、记录合并、S3 检测、主题解析)全部 TDD;UI 关键行为用 React Testing Library 测,视觉页用 `npm run dev` 人工验证。

**Tech Stack:** Next.js 15 · React 19 · TypeScript 5 · Tailwind 3.4 · Prisma 5(SQLite)· Vitest 2 · @testing-library/react · bcryptjs · jose(JWT)· framer-motion · zod

> **约定**:所有 `git commit` 信息末尾附 `Co-Authored-By: Claude <noreply@anthropic.com>`。每个 Task 结束都提交一次。

---

## 文件结构(Phase 1 涉及)

```
grow-tall/
├─ prisma/
│  ├─ schema.prisma              # 4 个模型
│  └─ seed.ts                    # 种子数据
├─ src/
│  ├─ app/
│  │  ├─ layout.tsx              # 根:html/body,字体,主题 provider,元数据
│  │  ├─ globals.css             # Tailwind + 主题 CSS 变量 + 安全区
│  │  ├─ page.tsx                # 根重定向:已登录→/home,否则→/login
│  │  ├─ login/page.tsx          # 登录 / 首次设密码
│  │  ├─ (app)/layout.tsx        # 鉴权外壳:底部导航 + 凸起按钮 + 安全区
│  │  ├─ (app)/home/page.tsx     # 首页(成长墙)
│  │  └─ api/
│  │     ├─ auth/{setup,login,logout}/route.ts
│  │     ├─ children/route.ts · children/[id]/route.ts
│  │     ├─ records/route.ts · records/[id]/route.ts
│  │     └─ storage/status/route.ts
│  ├─ components/
│  │  ├─ AppShell.tsx            # 底部导航 + 凸起按钮
│  │  ├─ Mascot.tsx              # 主题化 SVG 吉祥物(长颈鹿等)
│  │  ├─ GrowthWall.tsx          # 首页成长墙
│  │  ├─ RecordSheet.tsx         # 记一笔底部弹层
│  │  └─ providers.tsx           # ThemeProvider / QueryProvider(可选)
│  ├─ lib/
│  │  ├─ db.ts                   # Prisma 单例
│  │  ├─ themes.ts               # 主题定义 + 解析(测)
│  │  ├─ growth.ts               # LMS/BMI/预测身高/发育阶段(测)
│  │  ├─ records.ts              # 同日合并(测)
│  │  ├─ storage.ts              # S3 环境检测(测)
│  │  ├─ auth.ts                 # 密码哈希/校验 + JWT 签发/校验(测)
│  │  └─ session.ts              # cookie 读写
│  └─ middleware.ts              # 鉴权网关
├─ public/manifest.webmanifest
├─ data/who/                     # WHO LMS 数据(JSON,Phase 1 引入身高/年龄)
├─ middleware.ts → src/middleware.ts
├─ tailwind.config.ts · vitest.config.ts · next.config.mjs
└─ .env.example
```

---

## Task 1:项目脚手架与工具链

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.mjs`, `tailwind.config.ts`, `postcss.config.mjs`, `vitest.config.ts`, `src/app/globals.css`, `.env.example`, `data/who/.gitkeep`

- [ ] **Step 1: 创建 Next.js 工程(不交互)**

```bash
cd /Users/deanwang/IdeaProjects/local-git-project/grow-tall
npx create-next-app@15 . --typescript --tailwind --eslint --app --src-dir \
  --import-alias "@/*" --use-npm --no-turbopack --yes
```

预期:生成 `package.json`、`src/app/`、`tailwind.config.ts` 等。若提示目录非空,选「忽略文件继续」。

- [ ] **Step 2: 安装依赖**

```bash
npm install prisma@5 @prisma/client@5 bcryptjs jose framer-motion zod
npm install -D vitest@2 @vitejs/plugin-react jsdom \
  @testing-library/react@16 @testing-library/jest-dom @testing-library/user-event \
  @types/bcryptjs @vitest/ui
```

- [ ] **Step 3: 写 `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
});
```

- [ ] **Step 4: 写 `vitest.setup.ts`**

```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 5: 写 `.env.example`**

```bash
# 数据库(SQLite)
DATABASE_URL="file:./dev.db"

# 会话签名密钥(任意长随机串)
SESSION_SECRET="change-me-to-a-long-random-string"

# 访问密码(可选;不设则首次打开 App 时引导设置)
APP_PASSWORD=""

# S3 图片存储(全部可选;缺省=图片功能关闭)
S3_ENDPOINT=""
S3_REGION=""
S3_BUCKET=""
S3_ACCESS_KEY=""
S3_SECRET_KEY=""
S3_PUBLIC_BASE=""
```

- [ ] **Step 6: 更新 `.gitignore`(追加)**

在现有 `.gitignore` 末尾确认包含(脚手架已生成大部分):

```
/dev.db*
.env
```

- [ ] **Step 7: 验证可运行**

```bash
npm run dev   # 访问 http://localhost:3000 看到默认页后 Ctrl+C
npm run lint
```

预期:dev 起得来;lint 无错。

- [ ] **Step 8: 提交**

```bash
git add -A
git commit -m "chore: scaffold Next.js + Tailwind + Prisma + Vitest" -m "Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 2:Prisma 数据模型与种子

**Files:**
- Create: `prisma/schema.prisma`, `prisma/seed.ts`, `src/lib/db.ts`
- Modify: `package.json`(加 prisma seed 脚本)

- [ ] **Step 1: 初始化 Prisma + 写 schema**

```bash
npx prisma init --datasource-provider sqlite
```

覆写 `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

enum Gender {
  MALE
  FEMALE
  OTHER
}

model Child {
  id            String   @id @default(cuid())
  name          String
  gender        String   @default("OTHER") // sqlite 不支持 enum,用字符串
  birthDate     DateTime
  themeId       String   @default("warm")
  avatarKey     String?
  fatherHeight  Float?
  motherHeight  Float?
  createdAt     DateTime @default(now())
  records       Record[]
  photos        Photo[]
}

model Record {
  id        String   @id @default(cuid())
  childId   String
  child     Child    @relation(fields: [childId], references: [id], onDelete: Cascade)
  date      DateTime
  height    Float?
  weight    Float?
  note      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([childId, date])
}

model Photo {
  id        String   @id @default(cuid())
  childId   String
  child     Child    @relation(fields: [childId], references: [id], onDelete: Cascade)
  recordId  String?
  s3Key     String
  takenAt   DateTime
  createdAt DateTime @default(now())
}

model Setting {
  id           String   @id @default("singleton")
  passwordHash String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

> 注:SQLite 不支持 `enum`,故 `gender` 用字符串;应用层用 zod 约束为 `MALE|FEMALE|OTHER`。

- [ ] **Step 2: 写 Prisma 单例 `src/lib/db.ts`**

```ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

- [ ] **Step 3: 迁移**

```bash
npx prisma migrate dev --name init
npx prisma generate
```

预期:生成 `prisma/migrations/`、`dev.db`、`@prisma/client` 类型。

- [ ] **Step 4: 写种子 `prisma/seed.ts`**

```ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const child = await prisma.child.upsert({
    where: { id: 'seed-child-1' },
    update: {},
    create: {
      id: 'seed-child-1',
      name: '豆豆',
      gender: 'OTHER',
      birthDate: new Date('2021-04-01'),
      themeId: 'warm',
      fatherHeight: 178,
      motherHeight: 165,
    },
  });

  const days = (n: number) => new Date(Date.UTC(2024, 0, 1) + n * 86400000);
  const samples = [
    { date: days(0), height: 88, weight: 12.5 },
    { date: days(180), height: 96, weight: 14.2 },
    { date: days(365), height: 104, weight: 16.1 },
    { date: days(540), height: 110, weight: 18.0 },
    { date: days(700), height: 115.2, weight: 21.5 },
  ];
  for (const s of samples) {
    await prisma.record.upsert({
      where: { childId_date: { childId: child.id, date: s.date } },
      update: {},
      create: { childId: child.id, date: s.date, height: s.height, weight: s.weight },
    });
  }
  console.log('seeded');
}

main().finally(() => prisma.$disconnect());
```

- [ ] **Step 5: 在 `package.json` 加 seed 配置**

在 `"devDependencies"` 同级加:

```json
"prisma": {
  "seed": "tsx prisma/seed.ts"
}
```

并安装 `tsx`:`npm install -D tsx`,再加脚本:

```json
"scripts": {
  "dev": "next dev",
  "build": "prisma generate && next build",
  "start": "next start",
  "lint": "next lint",
  "test": "vitest run",
  "test:watch": "vitest",
  "db:migrate": "prisma migrate dev",
  "db:seed": "tsx prisma/seed.ts",
  "db:studio": "prisma studio"
}
```

- [ ] **Step 6: 跑种子并验证**

```bash
npm run db:seed
npx prisma studio   # 看到 Child/Record 有数据后关闭
```

- [ ] **Step 7: 提交**

```bash
git add -A
git commit -m "feat(db): prisma schema (child/record/photo/setting) + seed" -m "Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 3:主题系统(定义 + CSS 变量 + 解析)

**Files:**
- Create: `src/lib/themes.ts`, `src/lib/themes.test.ts`
- Modify: `src/app/globals.css`(加主题变量), `src/app/layout.tsx`(挂 data-theme)

- [ ] **Step 1: 先写失败测试 `src/lib/themes.test.ts`**

```ts
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
```

- [ ] **Step 2: 运行测试确认失败**

```bash
npm test -- themes
```
预期:FAIL(`cannot find module ./themes`)。

- [ ] **Step 3: 实现 `src/lib/themes.ts`**

```ts
export type ThemeId = 'warm' | 'mint' | 'rainbow';

export interface Theme {
  id: ThemeId;
  name: string;
  mascot: string;          // 表情(占位;真实 SVG 在 Mascot 组件按 id 渲染)
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
    '--bg': '#F1F8F6', '--bg-frame': '#B6E0D6', '--card': '#FFFFFF',
    '--ink': '#173128', '--muted': '#7C9C94', '--primary': '#21A99B',
    '--primary-2': '#56C596', '--accent': '#2EA881', '--success': '#2EA881',
    '--band': 'rgba(33,169,155,.12)',
  },
};

const rainbow: Theme = {
  id: 'rainbow',
  name: '彩虹活力',
  mascot: 'unicorn',
  vars: {
    '--bg': 'linear-gradient(170deg,#FBF0FF,#F2F7FF 55%,#FFF6E6)',
    '--bg-frame': '#C7B8FF', '--card': '#FFFFFF', '--ink': '#3A2A5C',
    '--muted': '#9A86C0', '--primary': '#7C5CFF', '--primary-2': '#FF7AA8',
    '--accent': '#FFC75F', '--success': '#4FC3A1', '--band': 'rgba(124,92,255,.14)',
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
```

- [ ] **Step 4: 运行测试确认通过**

```bash
npm test -- themes
```
预期:PASS。

- [ ] **Step 5: 在 `src/app/globals.css` 顶部加默认主题变量 + 安全区**

在文件最前(`@tailwind` 之前)插入:

```css
:root {
  --safe-top: env(safe-area-inset-top, 0px);
  --safe-bottom: env(safe-area-inset-bottom, 0px);
}
html, body { background: var(--bg, #FFF7EC); color: var(--ink, #5B3A1F); }
```

- [ ] **Step 6: 修改 `src/app/layout.tsx`,挂默认 `data-theme="warm"` 与 viewport**

```tsx
import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '成长日记',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title: '成长日记' },
};

export const viewport: Viewport = {
  viewportFit: 'cover',
  themeColor: '#FF8A3D',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" data-theme="warm">
      <body>{children}</body>
    </html>
  );
}
```

> 主题变量切换(改 `data-theme` 并注入 `vars`)放到 Phase 3 主题选择器;Phase 1 先用 `warm` 默认,但 `resolveTheme().vars` 已就绪。

- [ ] **Step 7: 提交**

```bash
git add -A
git commit -m "feat(theme): 3 themes (warm/mint/rainbow) + resolve + age recommendation" -m "Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 4:成长算法(LMS 百分位 / BMI / 预测身高 / 发育阶段)

**Files:**
- Create: `src/lib/growth.ts`, `src/lib/growth.test.ts`, `data/who/lhfa-boys-sample.json`

- [ ] **Step 1: 先写失败测试 `src/lib/growth.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import {
  lmsToZ, lmsToPercentile, bmi, percentileFromLmsTable,
  midParentalHeight, devStage,
} from './growth';
import sample from '../../../data/who/lhfa-boys-sample.json';

describe('growth', () => {
  it('lmsToZ / lmsToPercentile:L=1 退化为标准 z', () => {
    // L=1,M=100,S=0.1,value=110 => z = ln(1.1)/0.1 ≈ 0.953
    expect(lmsToZ(110, { L: 1, M: 100, S: 0.1 })).toBeCloseTo(0.9531, 3);
    // P50 对应 z=0
    expect(lmsToPercentile(100, { L: 1, M: 100, S: 0.1 })).toBeCloseTo(50, 0);
  });

  it('bmi = kg / m^2', () => {
    expect(bmi(21.5, 1.152)).toBeCloseTo(16.2, 1);
  });

  it('percentileFromLmsTable:按年龄插值查表', () => {
    // sample: age(月) [{0,76,..},{12,84},{24,91}] 用近似的 M;此处仅校验边界与插值单调
    const p = percentileFromLmsTable(91, 24, sample);
    expect(p).toBeGreaterThan(45); // 恰为 M(中位) → 约 50
    const high = percentileFromLmsTable(100, 24, sample);
    expect(high).toBeGreaterThan(p);
  });

  it('midParentalHeight:男 (F+M+13)/2,女 (F+M-13)/2', () => {
    expect(midParentalHeight(178, 165, 'MALE')).toBeCloseTo(178, 0);
    expect(midParentalHeight(178, 165, 'FEMALE')).toBeCloseTo(165, 0);
    expect(midParentalHeight(178, 165, 'OTHER')).toBeNull();
  });

  it('devStage:按年龄/性别给阶段名', () => {
    expect(devStage(3, 'MALE')).toBe('学龄前');
    expect(devStage(11, 'FEMALE')).toBe('青春期');
    expect(devStage(11, 'MALE')).toBe('学龄期');
  });
});
```

- [ ] **Step 2: 运行确认失败**

```bash
npm test -- growth
```
预期:FAIL。

- [ ] **Step 3: 写样本数据 `data/who/lhfa-boys-sample.json`**

> 真实 WHO LMS 表在 Task 4 Step 9 用脚本从 WHO 公开 CSV 转换;此处样本供单测。

```json
[
  { "age": 0,  "L": 1, "M": 49.5, "S": 0.038 },
  { "age": 12, "L": 1, "M": 84.0, "S": 0.036 },
  { "age": 24, "L": 1, "M": 91.0, "S": 0.035 }
]
```

- [ ] **Step 4: 实现 `src/lib/growth.ts`**

```ts
export interface LmsPoint { age: number; L: number; M: number; S: number; }
export type LmsTable = LmsPoint[];
export type Gender = 'MALE' | 'FEMALE' | 'OTHER';

/** 标准 CDF 的有理近似(Abramowitz-Stegun 26.2.17) */
function normalCdf(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp(-z * z / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return z > 0 ? 1 - p : p;
}

export function lmsToZ(value: number, lms: { L: number; M: number; S: number }): number {
  const { L, M, S } = lms;
  if (L === 0) return Math.log(value / M) / S;
  return (Math.pow(value / M, L) - 1) / (L * S);
}

export function lmsToPercentile(value: number, lms: { L: number; M: number; S: number }): number {
  return Math.round(normalCdf(lmsToZ(value, lms)) * 100);
}

export function bmi(weightKg: number, heightM: number): number {
  return weightKg / (heightM * heightM);
}

/** 在 LMS 表中按 age(月)线性插值找到 L/M/S */
function interpolate(table: LmsTable, age: number): { L: number; M: number; S: number } {
  if (age <= table[0].age) return table[0];
  if (age >= table[table.length - 1].age) return table[table.length - 1];
  for (let i = 0; i < table.length - 1; i++) {
    const a = table[i], b = table[i + 1];
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

export function percentileFromLmsTable(value: number, ageMonths: number, table: LmsTable): number {
  return lmsToPercentile(value, interpolate(table, ageMonths));
}

export function midParentalHeight(fatherCm: number, motherCm: number, gender: Gender): number | null {
  if (gender === 'MALE') return Math.round((fatherCm + motherCm + 13) / 2);
  if (gender === 'FEMALE') return Math.round((fatherCm + motherCm - 13) / 2);
  return null;
}

export function devStage(ageYears: number, gender: Gender): string {
  if (ageYears <= 6) return '学龄前';
  if (ageYears <= 12) {
    // 女孩偏早进入青春期
    if (gender === 'FEMALE' && ageYears >= 8) return '青春期';
    return '学龄期';
  }
  return '青春期';
}
```

- [ ] **Step 5: 运行测试确认通过**

```bash
npm test -- growth
```
预期:PASS(全部 6 项)。

- [ ] **Step 6: 配置 JSON 导入**

在 `tsconfig.json` 的 `compilerOptions` 加 `"resolveJsonModule": true`(脚手架通常已开)。

- [ ] **Step 7: 下载真实 WHO LMS 数据(身高/年龄,男+女)**

```bash
mkdir -p data/who/raw
# WHO 身长/身高-年龄(0-5 岁)
curl -fsSL "https://www.who.int/toolkits/child-growth-standards/standards/length-height-for-age" -o /dev/null || true
```

> WHO 数据以 `zscore- lenanthfa-boys-exp.txt`(L/M/S 列)形式发布。手动步骤:从 WHO 发布的 `zscore-` 文本文件复制 0–60 月(男/女)与 5–19 岁(who 2007 reference)行,落成 `data/who/lhfa-boys.json`、`lhfa-girls.json`,格式同样本(字段 `age/L/M/S`,单位月)。

- [ ] **Step 8: 写转换脚本 `scripts/who-to-json.ts`(占位,数据到位后跑)**

```ts
// 输入 WHO zscore 文本(每行: age L M S F),输出 {age,L,M,S}[]
// 用法: tsx scripts/who-to-json.ts < input.txt > data/who/lhfa-boys.json
import { createInterface } from 'node:readline';
const rl = createInterface({ input: process.stdin });
const out: { age: number; L: number; M: number; S: number }[] = [];
rl.on('line', (line) => {
  const p = line.trim().split(/\s+/).map(Number);
  if (p.length >= 4 && !Number.isNaN(p[0])) out.push({ age: p[0], L: p[1], M: p[2], S: p[3] });
});
rl.on('close', () => process.stdout.write(JSON.stringify(out)));
```

> Phase 1 仅需身高/年龄表就够首页展示百分位;体重/BMI 表 Phase 2 再补。

- [ ] **Step 9: 提交**

```bash
git add -A
git commit -m "feat(growth): LMS percentile / BMI / mid-parental height / dev stage + WHO loader" -m "Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 5:记录同日合并逻辑

**Files:**
- Create: `src/lib/records.ts`, `src/lib/records.test.ts`

- [ ] **Step 1: 先写失败测试 `src/lib/records.test.ts`**

```ts
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
```

- [ ] **Step 2: 运行确认失败**

```bash
npm test -- records
```

- [ ] **Step 3: 实现 `src/lib/records.ts`**

```ts
export interface PartialMeasure { height: number | null; weight: number | null; }

/** 同一孩子同一天的多次录入合并:新输入中非空字段覆盖旧值,空字段保留旧值。 */
export function mergeRecordInput(prev: PartialMeasure, next: PartialMeasure): PartialMeasure {
  return {
    height: next.height ?? prev.height,
    weight: next.weight ?? prev.weight,
  };
}
```

- [ ] **Step 4: 运行确认通过**

```bash
npm test -- records
```
预期:PASS。

- [ ] **Step 5: 提交**

```bash
git add -A
git commit -m "feat(records): same-day merge semantics" -m "Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 6:S3 存储环境检测

**Files:**
- Create: `src/lib/storage.ts`, `src/lib/storage.test.ts`

- [ ] **Step 1: 先写失败测试 `src/lib/storage.test.ts`**

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { isStorageConfigured, storageConfig } from './storage';

beforeEach(() => {
  delete process.env.S3_ENDPOINT;
  delete process.env.S3_REGION;
  delete process.env.S3_BUCKET;
  delete process.env.S3_ACCESS_KEY;
  delete process.env.S3_SECRET_KEY;
});

describe('storage detection', () => {
  it('五项齐全 → 已配置', () => {
    process.env.S3_ENDPOINT = 'https://s3.example.com';
    process.env.S3_REGION = 'us-east-1';
    process.env.S3_BUCKET = 'b';
    process.env.S3_ACCESS_KEY = 'ak';
    process.env.S3_SECRET_KEY = 'sk';
    expect(isStorageConfigured()).toBe(true);
    expect(storageConfig().bucket).toBe('b');
  });
  it('缺任意一项 → 未配置', () => {
    process.env.S3_ENDPOINT = 'https://s3.example.com';
    process.env.S3_REGION = 'us-east-1';
    process.env.S3_BUCKET = 'b';
    process.env.S3_ACCESS_KEY = 'ak';
    // 缺 SECRET
    expect(isStorageConfigured()).toBe(false);
  });
  it('全空 → 未配置', () => {
    expect(isStorageConfigured()).toBe(false);
  });
});
```

- [ ] **Step 2: 运行确认失败**

```bash
npm test -- storage
```

- [ ] **Step 3: 实现 `src/lib/storage.ts`**

```ts
export interface StorageConfig {
  endpoint: string;
  region: string;
  bucket: string;
  accessKey: string;
  secretKey: string;
  publicBase?: string;
}

export function storageConfig(): StorageConfig {
  return {
    endpoint: process.env.S3_ENDPOINT ?? '',
    region: process.env.S3_REGION ?? '',
    bucket: process.env.S3_BUCKET ?? '',
    accessKey: process.env.S3_ACCESS_KEY ?? '',
    secretKey: process.env.S3_SECRET_KEY ?? '',
    publicBase: process.env.S3_PUBLIC_BASE || undefined,
  };
}

export function isStorageConfigured(): boolean {
  const c = storageConfig();
  return Boolean(c.endpoint && c.region && c.bucket && c.accessKey && c.secretKey);
}
```

- [ ] **Step 4: 运行确认通过**

```bash
npm test -- storage
```

- [ ] **Step 5: 提交**

```bash
git add -A
git commit -m "feat(storage): S3 env-based detection (no DB)" -m "Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 7:访问控制(单密码 + JWT 会话 + 中间件)

**Files:**
- Create: `src/lib/auth.ts`, `src/lib/auth.test.ts`, `src/lib/session.ts`, `src/middleware.ts`
- Create: `src/app/api/auth/setup/route.ts`, `src/app/api/auth/login/route.ts`, `src/app/api/auth/logout/route.ts`

- [ ] **Step 1: 先写失败测试 `src/lib/auth.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, createSessionToken, readSessionToken } from './auth';

const SECRET = 'test-secret-at-least-32-characters-long-xxxxx';

describe('auth', () => {
  it('hashPassword / verifyPassword 往返', async () => {
    const hash = await hashPassword('hunter2');
    expect(hash).not.toBe('hunter2');
    expect(await verifyPassword('hunter2', hash)).toBe(true);
    expect(await verifyPassword('wrong', hash)).toBe(false);
  });

  it('createSessionToken / readSessionToken 往返', async () => {
    const token = await createSessionToken({ ok: true }, SECRET);
    const payload = await readSessionToken(token, SECRET);
    expect(payload?.ok).toBe(true);
  });

  it('错误密钥校验失败', async () => {
    const token = await createSessionToken({ ok: true }, SECRET);
    expect(await readSessionToken(token, 'wrong-secret-also-long-enough-xxxxxxxx')).toBeNull();
  });
});
```

- [ ] **Step 2: 运行确认失败**

```bash
npm test -- auth
```

- [ ] **Step 3: 实现 `src/lib/auth.ts`**

```ts
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';

const enc = (s: string) => new TextEncoder().encode(s);

export async function hashPassword(pw: string): Promise<string> {
  return bcrypt.hash(pw, 10);
}

export async function verifyPassword(pw: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pw, hash);
}

export async function createSessionToken(payload: Record<string, unknown>, secret: string): Promise<string> {
  return new SignJWT(payload).setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt().setExpirationTime('180d').sign(enc(secret));
}

export async function readSessionToken(token: string, secret: string): Promise<Record<string, unknown> | null> {
  try {
    const { payload } = await jwtVerify(token, enc(secret));
    return payload as Record<string, unknown>;
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: 实现 `src/lib/session.ts`**

```ts
import { cookies } from 'next/headers';
import { createSessionToken, readSessionToken } from './auth';

const COOKIE = 'gt_session';

export async function setSession() {
  const secret = process.env.SESSION_SECRET!;
  const token = await createSessionToken({ authed: true }, secret);
  (await cookies()).set(COOKIE, token, {
    httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 180, path: '/',
  });
}

export async function clearSession() {
  (await cookies()).delete(COOKIE);
}

export async function isAuthed(): Promise<boolean> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return false;
  const payload = await readSessionToken(token, process.env.SESSION_SECRET!);
  return Boolean(payload?.authed);
}
```

- [ ] **Step 5: 运行测试确认通过**

```bash
npm test -- auth
```
预期:PASS。

- [ ] **Step 6: 写 `src/middleware.ts`(网关)**

```ts
import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const COOKIE = 'gt_session';
const PUBLIC = ['/', '/login', '/api/auth/setup', '/api/auth/login'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC.includes(pathname) || pathname.startsWith('/_next') || pathname.startsWith('/icon')) {
    return NextResponse.next();
  }
  const token = req.cookies.get(COOKIE)?.value;
  let ok = false;
  if (token) {
    try {
      await jwtVerify(token, new TextEncoder().encode(process.env.SESSION_SECRET!));
      ok = true;
    } catch { ok = false; }
  }
  if (!ok) return NextResponse.redirect(new URL('/login', req.url));
  return NextResponse.next();
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] };
```

- [ ] **Step 7: 写 `src/app/api/auth/setup/route.ts`(首次设密码)**

```ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { setSession } from '@/lib/session';

const Body = z.object({ password: z.string().min(4) });

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: '密码至少 4 位' }, { status: 400 });

  const setting = await prisma.setting.findUnique({ where: { id: 'singleton' } });
  if (setting?.passwordHash) {
    return NextResponse.json({ error: '密码已设置,请改用登录' }, { status: 409 });
  }
  const hash = await hashPassword(parsed.data.password);
  await prisma.setting.upsert({
    where: { id: 'singleton' },
    update: { passwordHash: hash },
    create: { id: 'singleton', passwordHash: hash },
  });
  await setSession();
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 8: 写 `src/app/api/auth/login/route.ts`**

```ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { verifyPassword, hashPassword } from '@/lib/auth';
import { setSession } from '@/lib/session';

const Body = z.object({ password: z.string().min(1) });

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: '参数错误' }, { status: 400 });

  const setting = await prisma.setting.findUnique({ where: { id: 'singleton' } });

  // 支持 APP_PASSWORD 环境变量预置密码(部署时)
  const envPw = process.env.APP_PASSWORD;
  if (!setting?.passwordHash && !envPw) {
    return NextResponse.json({ error: '尚未设置密码', needsSetup: true }, { status: 409 });
  }

  const ok = envPw
    ? parsed.data.password === envPw
    : setting?.passwordHash ? await verifyPassword(parsed.data.password, setting.passwordHash) : false;

  if (!ok) return NextResponse.json({ error: '密码错误' }, { status: 401 });

  // 若用环境密码登录且库里没记录,顺手写入哈希(便于后续改密)
  if (!setting?.passwordHash && envPw) {
    await prisma.setting.upsert({
      where: { id: 'singleton' },
      update: {},
      create: { id: 'singleton', passwordHash: await hashPassword(envPw) },
    });
  }

  await setSession();
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 9: 写 `src/app/api/auth/logout/route.ts`**

```ts
import { NextResponse } from 'next/server';
import { clearSession } from '@/lib/session';

export async function POST() {
  await clearSession();
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 10: 配 `SESSION_SECRET`(开发)**

把 `.env`(已 gitignore)创建好:

```bash
cp .env.example .env
printf '\nSESSION_SECRET="dev-secret-change-me-32chars-min-xxxxx"\n' >> .env
```

- [ ] **Step 11: 提交**

```bash
git add -A
git commit -m "feat(auth): single password (bcrypt) + JWT session + middleware + setup/login/logout" -m "Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 8:孩子 & 记录 API

**Files:**
- Create: `src/app/api/children/route.ts`, `src/app/api/children/[id]/route.ts`, `src/app/api/records/route.ts`, `src/app/api/records/[id]/route.ts`, `src/app/api/storage/status/route.ts`

- [ ] **Step 1: `src/app/api/children/route.ts`(列表 + 新建)**

```ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { recommendedThemeForAge } from '@/lib/themes';

const Create = z.object({
  name: z.string().min(1),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  birthDate: z.string().datetime(),
  themeId: z.string().optional(),
});

function ageYears(birth: Date): number {
  const ms = Date.now() - birth.getTime();
  return ms / (365.25 * 86400000);
}

export async function GET() {
  const children = await prisma.child.findMany({ orderBy: { birthDate: 'asc' } });
  return NextResponse.json({ children });
}

export async function POST(req: Request) {
  const parsed = Create.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const d = parsed.data;
  const birth = new Date(d.birthDate);
  const themeId = d.themeId ?? recommendedThemeForAge(ageYears(birth));
  const child = await prisma.child.create({
    data: { name: d.name, gender: d.gender, birthDate: birth, themeId },
  });
  return NextResponse.json({ child });
}
```

- [ ] **Step 2: `src/app/api/children/[id]/route.ts`(改 + 删)**

```ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';

const Update = z.object({
  name: z.string().min(1).optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  birthDate: z.string().datetime().optional(),
  themeId: z.string().optional(),
  fatherHeight: z.number().nullable().optional(),
  motherHeight: z.number().nullable().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = Update.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const d = parsed.data;
  const child = await prisma.child.update({
    where: { id },
    data: {
      ...(d.name && { name: d.name }),
      ...(d.gender && { gender: d.gender }),
      ...(d.birthDate && { birthDate: new Date(d.birthDate) }),
      ...(d.themeId && { themeId: d.themeId }),
      ...(d.fatherHeight !== undefined && { fatherHeight: d.fatherHeight }),
      ...(d.motherHeight !== undefined && { motherHeight: d.motherHeight }),
    },
  });
  return NextResponse.json({ child });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.child.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3: `src/app/api/records/route.ts`(列表 + 新建/合并)**

```ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { mergeRecordInput } from '@/lib/records';

const Create = z.object({
  childId: z.string(),
  date: z.string().datetime(),
  height: z.number().nullable().optional(),
  weight: z.number().nullable().optional(),
  note: z.string().optional(),
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const childId = searchParams.get('childId');
  const records = await prisma.record.findMany({
    where: childId ? { childId } : undefined,
    orderBy: { date: 'asc' },
  });
  return NextResponse.json({ records });
}

export async function POST(req: Request) {
  const parsed = Create.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const d = parsed.data;
  const date = new Date(d.date);
  // 同一天:合并
  const existing = await prisma.record.findUnique({
    where: { childId_date: { childId: d.childId, date } },
  });
  if (existing) {
    const merged = mergeRecordInput(
      { height: existing.height, weight: existing.weight },
      { height: d.height ?? null, weight: d.weight ?? null },
    );
    const updated = await prisma.record.update({
      where: { id: existing.id },
      data: { height: merged.height, weight: merged.weight, ...(d.note && { note: d.note }) },
    });
    return NextResponse.json({ record: updated });
  }
  const created = await prisma.record.create({
    data: { childId: d.childId, date, height: d.height ?? undefined, weight: d.weight ?? undefined, note: d.note },
  });
  return NextResponse.json({ record: created });
}
```

- [ ] **Step 4: `src/app/api/records/[id]/route.ts`(删)**

```ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.record.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 5: `src/app/api/storage/status/route.ts`**

```ts
import { NextResponse } from 'next/server';
import { isStorageConfigured } from '@/lib/storage';

export async function GET() {
  return NextResponse.json({ available: isStorageConfigured() });
}
```

- [ ] **Step 6: 用 curl 烟测(需先登录拿 cookie)**

```bash
npm run dev &
sleep 4
# 首次设密码
curl -s -c /tmp/gt.cookie -X POST localhost:3000/api/auth/setup -H 'Content-Type: application/json' -d '{"password":"1234"}'
# 建孩子
curl -s -b /tmp/gt.cookie -X POST localhost:3000/api/children -H 'Content-Type: application/json' \
  -d '{"name":"测试","gender":"OTHER","birthDate":"2021-04-01T00:00:00Z"}'
# 录两条同日(验证合并)
curl -s -b /tmp/gt.cookie -X POST localhost:3000/api/records -H 'Content-Type: application/json' \
  -d '{"childId":"<上一步 id>","date":"2026-06-21T00:00:00Z","height":115.2}'
curl -s -b /tmp/gt.cookie -X POST localhost:3000/api/records -H 'Content-Type: application/json' \
  -d '{"childId":"<id>","date":"2026-06-21T00:00:00Z","weight":21.5}'
# 查:应为一条 height+weight 都有的记录
curl -s -b /tmp/gt.cookie 'localhost:3000/api/records?childId=<id>'
kill %1
```

预期:最后一条返回的记录 height=115.2 且 weight=21.5。

- [ ] **Step 7: 提交**

```bash
git add -A
git commit -m "feat(api): children + records (same-day merge) + storage status" -m "Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 9:应用外壳(安全区 + 底部导航 + 凸起按钮 + 登录闸)

**Files:**
- Create: `src/components/AppShell.tsx`, `src/components/Mascot.tsx`, `src/app/login/page.tsx`, `src/app/(app)/layout.tsx`, `src/app/page.tsx`
- Create: `public/manifest.webmanifest`, `public/icon.svg`

- [ ] **Step 1: PWA manifest `public/manifest.webmanifest`**

```json
{
  "name": "成长日记",
  "short_name": "成长",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#FFF7EC",
  "theme_color": "#FF8A3D",
  "icons": [{ "src": "/icon.svg", "sizes": "any", "type": "image/svg+xml" }]
}
```

- [ ] **Step 2: `public/icon.svg`(长颈鹿简笔)**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
  <rect width="120" height="120" rx="26" fill="#FF8A3D"/>
  <g fill="#F4B06B"><path d="M72 96 Q60 60 66 30 L82 32 Q86 64 88 96Z"/><ellipse cx="70" cy="96" rx="22" ry="13"/><ellipse cx="74" cy="28" rx="13" ry="10"/></g>
  <circle cx="76" cy="26" r="2.4" fill="#3a2a1a"/>
  <ellipse cx="64" cy="44" rx="4" ry="3" fill="#D9822F"/>
  <ellipse cx="80" cy="64" rx="5" ry="3.5" fill="#D9822F"/>
</svg>
```

- [ ] **Step 3: `src/components/Mascot.tsx`(可复用 SVG 吉祥物,按主题)**

```tsx
import { resolveTheme } from '@/lib/themes';

export function Mascot({ themeId = 'warm', size = 96, className }: { themeId?: string; size?: number; className?: string }) {
  // Phase 1:三套主题都先用长颈鹿 SVG;Phase 3 替换 chick/unicorn 造型
  return (
    <svg viewBox="0 0 120 200" width={size} height={size * 200 / 120} className={className} aria-hidden>
      <rect x="36" y="150" width="9" height="42" rx="4" fill="#E89A4A"/><rect x="52" y="150" width="9" height="42" rx="4" fill="#F4B06B"/>
      <rect x="80" y="150" width="9" height="42" rx="4" fill="#E89A4A"/><rect x="96" y="150" width="9" height="42" rx="4" fill="#F4B06B"/>
      <ellipse cx="70" cy="148" rx="36" ry="22" fill="#F4B06B"/>
      <path d="M72 150 Q60 92 66 42 L82 44 Q86 96 88 150 Z" fill="#F4B06B"/>
      <ellipse cx="74" cy="36" rx="21" ry="15" fill="#F4B06B"/><ellipse cx="90" cy="43" rx="11" ry="9" fill="#F8C68A"/>
      <rect x="62" y="13" width="4" height="13" rx="2" fill="#F4B06B"/><circle cx="64" cy="12" r="4" fill="#7A4A1E"/>
      <rect x="74" y="11" width="4" height="14" rx="2" fill="#F4B06B"/><circle cx="76" cy="10" r="4" fill="#7A4A1E"/>
      <ellipse cx="58" cy="30" rx="5" ry="8" fill="#E89A4A" transform="rotate(-25 58 30)"/>
      <circle cx="76" cy="32" r="3.2" fill="#3a2a1a"/><circle cx="77" cy="31" r="1.1" fill="#fff"/>
      <path d="M85 49 Q90 52 95 49" stroke="#7A4A1E" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <ellipse cx="66" cy="68" rx="5" ry="4" fill="#D9822F"/><ellipse cx="64" cy="92" rx="6" ry="4.5" fill="#D9822F"/><ellipse cx="80" cy="112" rx="7" ry="5" fill="#D9822F"/>
    </svg>
  );
}
// 触碰 resolveTheme 便于未来按主题切造型(Phase 1 暂统一)
void resolveTheme;
```

- [ ] **Step 4: `src/components/AppShell.tsx`(底部导航 + 凸起按钮 + 安全区)**

```tsx
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

const TABS = [
  { href: '/home', icon: '🏠', label: '首页' },
  { href: '/curves', icon: '📈', label: '曲线' },
  { href: '/album', icon: '🖼', label: '相册' },
  { href: '/settings', icon: '⚙', label: '我的' },
];

export function AppShell({ children, onRecord }: { children: React.ReactNode; onRecord: () => void }) {
  const path = usePathname();
  return (
    <div className="min-h-[100dvh] flex flex-col" style={{ background: 'var(--bg)' }}>
      <main className="flex-1 overflow-y-auto" style={{ paddingTop: 'var(--safe-top)' }}>{children}</main>
      <nav
        className="relative grid grid-cols-[1fr_1fr_72px_1fr_1fr] items-end bg-white"
        style={{ borderTop: '3px dashed var(--accent, #FFE3CC)', paddingBottom: 'var(--safe-bottom)' }}
      >
        {TABS.slice(0, 2).map((t) => <Tab key={t.href} {...t} active={path.startsWith(t.href)} />)}
        <div />
        {TABS.slice(2).map((t) => <Tab key={t.href} {...t} active={path.startsWith(t.href)} />)}
        <motion.button
          aria-label="记一笔"
          onClick={onRecord}
          className="absolute left-1/2 -translate-x-1/2 w-14 h-14 rounded-full border-[3px] border-white flex flex-col items-center justify-center text-white"
          style={{ bottom: 'calc(var(--safe-bottom) + 16px)', background: 'linear-gradient(135deg, var(--primary-2), var(--primary))', boxShadow: '0 6px 0 color-mix(in srgb, var(--primary) 70%, black), 0 12px 18px rgba(0,0,0,.2)' }}
          animate={{ rotate: [-4, 4, -4] }} transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <span className="text-xl leading-none">🦒</span>
          <span className="text-[7px] font-extrabold">记一笔</span>
        </motion.button>
      </nav>
    </div>
  );
}

function Tab({ href, icon, label, active }: { href: string; icon: string; label: string; active: boolean }) {
  return (
    <Link href={href} className="flex flex-col items-center gap-px text-[8px] font-extrabold py-2"
      style={{ color: active ? 'var(--primary)' : '#CBB299' }}>
      <span className="text-base leading-none">{icon}</span>{label}
    </Link>
  );
}
```

- [ ] **Step 5: 登录页 `src/app/login/page.tsx`(首次设密码 / 登录合一)**

```tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mascot } from '@/components/Mascot';

export default function LoginPage() {
  const router = useRouter();
  const [pw, setPw] = useState('');
  const [mode, setMode] = useState<'check' | 'setup' | 'login'>('check');
  const [err, setErr] = useState('');

  async function detect() {
    const r = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: '__probe__' }) });
    if (r.status === 409) { const j = await r.json(); setMode(j.needsSetup ? 'setup' : 'login'); }
    else setMode('login');
  }
  if (mode === 'check') detect();

  async function submit() {
    setErr('');
    const url = mode === 'setup' ? '/api/auth/setup' : '/api/auth/login';
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: pw }) });
    if (r.ok) { router.push('/home'); router.refresh(); return; }
    const j = await r.json().catch(() => ({}));
    setErr(j.error ?? '出错啦');
  }

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center gap-4 p-8" style={{ paddingTop: 'var(--safe-top)', paddingBottom: 'var(--safe-bottom)', background: 'var(--bg)' }}>
      <Mascot size={120} />
      <h1 className="text-2xl font-extrabold" style={{ color: 'var(--ink)' }}>成长日记</h1>
      <p className="text-sm" style={{ color: 'var(--muted)' }}>{mode === 'setup' ? '先设一个访问密码' : '请输入访问密码'}</p>
      <input type="password" value={pw} onChange={(e) => setPw(e.target.value)}
        className="rounded-2xl px-4 py-3 text-center text-lg w-56 outline-none"
        style={{ background: 'var(--card)', border: '2px dashed var(--primary-2)', color: 'var(--ink)' }} />
      {err && <p className="text-xs" style={{ color: 'var(--accent)' }}>{err}</p>}
      <button onClick={submit} className="rounded-2xl px-8 py-3 font-extrabold text-white"
        style={{ background: 'linear-gradient(95deg, var(--primary), var(--primary-2))' }}>
        {mode === 'setup' ? '开始记录' : '进入'}
      </button>
    </div>
  );
}
```

- [ ] **Step 6: 根 `src/app/page.tsx`(重定向)**

```tsx
import { redirect } from 'next/navigation';
import { isAuthed } from '@/lib/session';

export default async function Root() {
  redirect((await isAuthed()) ? '/home' : '/login');
}
```

- [ ] **Step 7: 写「记一笔」弹层组件测试 `src/components/RecordSheet.test.tsx`**

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RecordSheetProvider, useRecordSheet } from './RecordSheet';

function Harness() {
  const { open } = useRecordSheet();
  return <button onClick={() => open('child-1')}>open</button>;
}

describe('RecordSheet', () => {
  it('打开后填身高+体重,提交合并到同一天', async () => {
    const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ record: { id: 'r1' } }), { status: 200 })
    );
    render(<RecordSheetProvider><Harness /></RecordSheetProvider>);
    fireEvent.click(screen.getByText('open'));
    fireEvent.change(await screen.findByLabelText('身高'), { target: { value: '115.2' } });
    fireEvent.change(screen.getByLabelText('体重'), { target: { value: '21.5' } });
    fireEvent.click(screen.getByText(/保存/));
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const body = JSON.parse((fetchMock.mock.calls[0][1] as any).body);
    expect(body).toMatchObject({ childId: 'child-1', height: 115.2, weight: 21.5 });
    fetchMock.mockRestore();
  });
});
```

- [ ] **Step 8: 运行确认失败**

```bash
npm test -- RecordSheet
```
预期:FAIL(`cannot find module ./RecordSheet`)。

- [ ] **Step 9: 实现 `src/components/RecordSheet.tsx`(Provider + 弹层)**

```tsx
'use client';
import { createContext, useContext, useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type Ctx = { open: (childId: string) => void };
const SheetCtx = createContext<Ctx | null>(null);
export const useRecordSheet = () => {
  const c = useContext(SheetCtx);
  if (!c) throw new Error('useRecordSheet must be inside provider');
  return c;
};

export function RecordSheetProvider({ children }: { children: ReactNode }) {
  const [childId, setChildId] = useState<string | null>(null);
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [saving, setSaving] = useState(false);

  function open(id: string) { setChildId(id); setHeight(''); setWeight(''); }

  async function save() {
    if (!childId) return;
    setSaving(true);
    await fetch('/api/records', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        childId, date: new Date().toISOString(),
        height: height ? Number(height) : null,
        weight: weight ? Number(weight) : null,
      }),
    });
    setSaving(false); setChildId(null);
  }

  return (
    <SheetCtx.Provider value={{ open }}>
      {children}
      <AnimatePresence>
        {childId && (
          <motion.div className="fixed inset-0 z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/40" onClick={() => setChildId(null)} />
            <motion.div
              className="absolute left-0 right-0 bottom-0 rounded-t-3xl p-4 pb-7"
              style={{ background: 'var(--bg)', paddingBottom: 'calc(var(--safe-bottom) + 20px)' }}
              initial={{ y: '60%' }} animate={{ y: 0 }} exit={{ y: '60%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            >
              <div className="mx-auto mb-3 h-1.5 w-10 rounded-full" style={{ background: 'var(--muted)', opacity: .4 }} />
              <h3 className="text-center font-extrabold text-lg" style={{ color: 'var(--ink)' }}>记一笔</h3>
              <label className="block text-xs font-bold mt-3 mb-1" style={{ color: 'var(--muted)' }}>身高</label>
              <input aria-label="身高" value={height} onChange={(e) => setHeight(e.target.value)} inputMode="decimal"
                placeholder="cm" className="w-full rounded-xl px-3 py-2" style={{ background: 'var(--card)', color: 'var(--ink)' }} />
              <label className="block text-xs font-bold mt-3 mb-1" style={{ color: 'var(--muted)' }}>体重</label>
              <input aria-label="体重" value={weight} onChange={(e) => setWeight(e.target.value)} inputMode="decimal"
                placeholder="kg" className="w-full rounded-xl px-3 py-2" style={{ background: 'var(--card)', color: 'var(--ink)' }} />
              <button onClick={save} disabled={saving}
                className="w-full mt-4 rounded-xl py-3 font-extrabold text-white"
                style={{ background: 'linear-gradient(95deg, var(--primary), var(--primary-2))' }}>
                {saving ? '保存中…' : '保存 🎉'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </SheetCtx.Provider>
  );
}
```

- [ ] **Step 10: 运行测试确认通过**

```bash
npm test -- RecordSheet
```
预期:PASS。

- [ ] **Step 11: 鉴权外壳 `src/app/(app)/layout.tsx`(挂 RecordSheetProvider)**

```tsx
import { redirect } from 'next/navigation';
import { isAuthed } from '@/lib/session';
import { RecordSheetProvider } from '@/components/RecordSheet';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAuthed())) redirect('/login');
  return <RecordSheetProvider>{children}</RecordSheetProvider>;
}
```

> Provider 挂在外壳层,这样所有页面(含 Task 10 首页)都能用 `useRecordSheet()`。

- [ ] **Step 12: 跑起来人工验证登录闸**

```bash
npm run dev
```
预期:访问 `/` → 跳 `/login` → 设密码 → 跳 `/home`(此时 404 无妨,Task 10 补)。

- [ ] **Step 13: 提交**

```bash
git add -A
git commit -m "feat(shell): safe-area, bottom nav + raised record button, login/setup gate, record sheet, PWA manifest" -m "Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 10:首页「成长墙」+ 数据接线

> 「记一笔」弹层(`RecordSheet` + Provider)已在 Task 9 创建并接入外壳层;本任务只做首页与成长墙,并把凸起按钮接到当前孩子。

**Files:**
- Create: `src/components/GrowthWall.tsx`, `src/app/(app)/home/page.tsx`

- [ ] **Step 1: 成长墙 `src/components/GrowthWall.tsx`**

```tsx
import { Mascot } from './Mascot';

export function GrowthWall({ heightCm, name }: { heightCm: number | null; name: string }) {
  return (
    <div className="mx-3 mt-2 rounded-3xl relative overflow-hidden p-3"
      style={{ background: 'linear-gradient(180deg,#FFEBC4,#FFF3DF 60%,#EAD3A6)', height: 210 }}>
      <div className="absolute top-2 right-4 w-7 h-7 rounded-full" style={{ background: '#FFD15C', boxShadow: '0 0 0 5px rgba(255,209,92,.35)' }} />
      <div className="absolute right-5 bottom-0 top-0 w-px" style={{ background: 'linear-gradient(#E8B27A,#F0D49E)' }} />
      <div className="absolute" style={{ left: 24, bottom: 6 }}><Mascot size={150} /></div>
      {heightCm && (
        <div className="absolute left-28 top-4 rounded-xl px-3 py-1.5 text-xs font-extrabold bg-white shadow" style={{ color: 'var(--primary)' }}>
          {name}长高啦!<span className="text-sm">{heightCm}</span>cm
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: 首页 `src/app/(app)/home/page.tsx`**

```tsx
'use client';
import { useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { GrowthWall } from '@/components/GrowthWall';
import { useRecordSheet } from '@/components/RecordSheet';

type Child = { id: string; name: string; gender: string; birthDate: string; themeId: string };
type Record = { id: string; date: string; height: number | null; weight: number | null };

export default function HomePage() {
  const { open } = useRecordSheet();
  const [children, setChildren] = useState<Child[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [records, setRecords] = useState<Record[]>([]);

  useEffect(() => { fetch('/api/children').then(r => r.json()).then(d => { setChildren(d.children); setActiveId(d.children[0]?.id ?? null); }); }, []);
  useEffect(() => {
    if (!activeId) return;
    fetch(`/api/records?childId=${activeId}`).then(r => r.json()).then(d => setRecords(d.records));
  }, [activeId]);

  const active = children.find(c => c.id === activeId);
  const latest = records.at(-1);

  return (
    <AppShell onRecord={() => activeId && open(activeId)}>
      <div className="p-4">
        <select value={activeId ?? ''} onChange={(e) => setActiveId(e.target.value)}
          className="rounded-xl px-3 py-2 font-extrabold" style={{ background: 'var(--card)', color: 'var(--ink)' }}>
          {children.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <GrowthWall name={active?.name ?? ''} heightCm={latest?.height ?? null} />
      <div className="grid grid-cols-2 gap-3 p-3">
        <Stat label="身高" value={latest?.height} unit="cm" />
        <Stat label="体重" value={latest?.weight} unit="kg" />
      </div>
      <p className="text-center text-xs pb-6" style={{ color: 'var(--muted)' }}>共 {records.length} 条记录</p>
    </AppShell>
  );
}

function Stat({ label, value, unit }: { label: string; value?: number | null; unit: string }) {
  return (
    <div className="rounded-2xl p-4 bg-white" style={{ boxShadow: '0 5px 0 rgba(255,138,61,.14)' }}>
      <div className="text-xs font-bold" style={{ color: 'var(--muted)' }}>{label}</div>
      <div className="text-2xl font-extrabold" style={{ color: 'var(--ink)' }}>
        {value ?? '—'}{value && <span className="text-xs" style={{ color: 'var(--muted)' }}>{unit}</span>}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: 端到端人工验证**

```bash
npm run dev
```
预期:
1. `/` → `/login`,设密码 → `/home`
2. 看到种子孩子「豆豆」与最新身高 115.2
3. 点底部凸起按钮 → 弹层,填身高/体重 → 保存 → 刷新后数据更新(同日合并)
4. 浏览器开发者工具切 iPhone 视口,确认顶部/底部安全区留白、凸起按钮不与底栏重叠

- [ ] **Step 4: 跑全部单测**

```bash
npm test
```
预期:全部 PASS(themes/growth/records/storage/auth/RecordSheet)。

- [ ] **Step 5: 提交**

```bash
git add -A
git commit -m "feat(home): growth wall + record bottom sheet (same-day merge) + nav wiring" -m "Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Phase 1 完成标准(Definition of Done)

- [ ] `npm test` 全绿(themes / growth / records / storage / auth / RecordSheet)
- [ ] `npm run dev` 可:首次设密码 → 登录 → 切换孩子 → 录身高/体重(同日合并)→ 首页成长墙显示最新值
- [ ] 移动视口下顶部/底部安全区留白,凸起「记一笔」按钮不与底栏重叠
- [ ] PWA manifest 可「添加到主屏幕」
- [ ] 全部已提交到 `main`

## 后续阶段(单独的计划文档)

- **Phase 2**:成长曲线页(ECharts 百分位带 + 派生指标)、时光相册 + S3 直传 + 成长幻灯片(方向 A)
- **Phase 3**:设置页、主题选择器(实时换肤)、S3 部署检测 UI、贴纸成就、Dockerfile + docker-compose + deploy.md、安全区真机回归
