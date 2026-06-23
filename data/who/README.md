# WHO 生长标准 LMS 数据

本目录存放 WHO 儿童生长标准的 LMS(Box-Cox)数据,供 `src/lib/growth.ts`
按年龄查百分位使用。

## 当前状态

已内置 WHO 生长数据(身高到 19 岁、BMI 5–19 岁):

- `lhfa-boys.json` / `lhfa-girls.json` — 身高/年龄 **0–228 月(0–19 岁)**,230 行
  (0–60 月取自 WHO Child Growth Standards;61–228 月取自 WHO Reference 2007)
- `wfa-boys.json` / `wfa-girls.json` — 体重/年龄 **0–120 月(0–10 岁)**,121 行(0–5 标准 + 5–10 参考)
- `bmi-boys.json` / `bmi-girls.json` — BMI/年龄 **0–228 月(0–19 岁)**,230 行(0–5 标准 + 5–19 参考)
- `lhfa-boys-sample.json` — 仅用于单元测试的 3 点样本
- `raw/` — 原始 WHO CSV(0–5 岁 lfa/hfa/wfa + 5–19 岁 height/bmi,男女各一)

**来源**:
- 0–5 岁:[WHO Child Growth Standards](https://www.who.int/tools/child-growth-standards),经 [ericpgreen/WHO-growth-charts](https://github.com/ericpgreen/WHO-growth-charts) 整理
- 5–19 岁:[WHO Reference 2007](https://www.who.int/tools/growth-reference-data-for-5to19-years),经 [isasaade-23/who-zscore-python](https://github.com/isasaade-23/who-zscore-python) 整理
- BMI 0–5 岁、体重 5–10 岁:经 [jbaldivieso/pygrowup2](https://github.com/jbaldivieso/pygrowup2) 的 WHO 标准表整理

### 重新生成(从 raw 数据)

```bash
node scripts/parse-who-ericpgreen.mjs   # 0–5 岁 → lhfa(0-60) + wfa(0-60)
node scripts/parse-who-2007.mjs         # 5–19 岁 → 追加 lhfa(61-228) + bmi(60-228)
node scripts/parse-who-extra.mjs        # 补 → bmi(0-60) + wfa(61-120)
```

## 说明

- 全部指标均**分男女**(boys / girls 各一),性别为「其他」时不显示百分位带。
- WHO 体重百分位仅到 10 岁(120 月);10 岁以上体重请参考 BMI。
- BMI 0–5 岁为 WHO 标准、5–19 岁为 WHO 2007 参考,在 60 月处衔接。

> 所有数值仅用于「对比正常范围」的科普展示,UI 标注「仅供参考,非医学诊断」。

