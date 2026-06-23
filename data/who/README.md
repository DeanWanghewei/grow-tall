# WHO 生长标准 LMS 数据

本目录存放 WHO 儿童生长标准的 LMS(Box-Cox)数据,供 `src/lib/growth.ts`
按年龄查百分位使用。

## 当前状态

已内置 WHO 生长数据(身高到 19 岁、BMI 5–19 岁):

- `lhfa-boys.json` / `lhfa-girls.json` — 身高/年龄 **0–228 月(0–19 岁)**,230 行
  (0–60 月取自 WHO Child Growth Standards;61–228 月取自 WHO Reference 2007)
- `wfa-boys.json` / `wfa-girls.json` — 体重/年龄(0–60 月),61 行
- `bmi-boys.json` / `bmi-girls.json` — BMI/年龄(60–228 月,即 5–19 岁),170 行(WHO Reference 2007)
- `lhfa-boys-sample.json` — 仅用于单元测试的 3 点样本
- `raw/` — 原始 WHO CSV(0–5 岁 lfa/hfa/wfa + 5–19 岁 height/bmi,男女各一)

**来源**:
- 0–5 岁:[WHO Child Growth Standards](https://www.who.int/tools/child-growth-standards),经 [ericpgreen/WHO-growth-charts](https://github.com/ericpgreen/WHO-growth-charts) 整理
- 5–19 岁:[WHO Reference 2007](https://www.who.int/tools/growth-reference-data-for-5to19-years),经 [isasaade-23/who-zscore-python](https://github.com/isasaade-23/who-zscore-python) 整理

### 重新生成(从 raw CSV)

```bash
node scripts/parse-who-ericpgreen.mjs   # 0–5 岁 → lhfa(0-60) + wfa
node scripts/parse-who-2007.mjs         # 5–19 岁 → 追加 lhfa(61-228) + bmi(60-228)
```

## 待扩展(可选)

- BMI 0–5 岁(0–60 月):当前 BMI 百分位仅 5 岁起(60 月);如需 <5 岁 BMI 百分位,补充 WHO BMI-for-age 0–5 标准到 `bmi-*.json`(与现有 5–19 合并)。
- 体重 5–10 岁:WHO Reference 2007 的 weight-for-age 到 120 月;当前 wfa 仅 0–60 月。

> 所有数值仅用于「对比正常范围」的科普展示,UI 标注「仅供参考,非医学诊断」。

