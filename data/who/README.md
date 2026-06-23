# WHO 生长标准 LMS 数据

本目录存放 WHO 儿童生长标准的 LMS(Box-Cox)数据,供 `src/lib/growth.ts`
按年龄查百分位使用。

## 当前状态

已内置 WHO Child Growth Standards(0–60 月)数据:

- `lhfa-boys.json` / `lhfa-girls.json` — 身长(0–23 月)+ 身高(24–60 月)/ 年龄,61 行
- `wfa-boys.json` / `wfa-girls.json` — 体重 / 年龄(0–60 月),61 行
- `lhfa-boys-sample.json` — 仅用于单元测试的 3 点样本
- `raw/` — 原始 WHO CSV(lfa/hfa/wfa,男女各一)

**来源**:[WHO Child Growth Standards](https://www.who.int/tools/child-growth-standards),经
[ericpgreen/WHO-growth-charts](https://github.com/ericpgreen/WHO-growth-charts) 的 CSV 整理,
用 `scripts/parse-who-ericpgreen.mjs` 转换得到。

### 重新生成(从 raw CSV)

```bash
# raw/ 下的 CSV 已内置;也可自行重新下载到 data/who/raw/ 后重跑:
node scripts/parse-who-ericpgreen.mjs
```

## 待扩展(可选)

- 5–19 岁(WHO Reference 2007):当前 0–60 月数据在 60 月后取末端值近似。若需精确,
  可补充 `lhfa-*.json` 到 228 月(19 岁),来源:https://www.who.int/tools/growth-reference-data-for-5to19-years
- BMI/年龄(`bmi-*.json`):BMI **数值**已自动计算并显示;BMI **百分位**需补充该表才会出现。

> 所有数值仅用于「对比正常范围」的科普展示,UI 标注「仅供参考,非医学诊断」。

