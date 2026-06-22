# WHO 生长标准 LMS 数据

本目录存放 WHO 儿童生长标准的 LMS(Box-Cox)数据,供 `src/lib/growth.ts`
按年龄查百分位使用。

## 当前状态

- `lhfa-boys-sample.json` — 仅用于单元测试的 3 点样本(0/12/24 月)。

## 真实数据(Phase 2 曲线页前置)

需要放入以下文件(字段 `{age, L, M, S}`,age 单位=月):

- `lhfa-boys.json` / `lhfa-girls.json` — 身长/身高-年龄(0-60 月,WHO 标准;5-19 岁用 WHO Reference 2007 拼接)
- `wfa-boys.json` / `wfa-girls.json` — 体重-年龄(0-120 月)
- `bmi-boys.json` / `bmi-girls.json` — BMI-年龄(0-60 月 + 5-19)

### 获取与转换

1. 从 WHO 下载 zscore 表文本(每行 `age L M S F`):
   - WHO Child Growth Standards:https://www.who.int/tools/child-growth-standards
   - WHO Reference 2007(5-19 岁):https://www.who.int/tools/growth-reference-data-for-5to19-years
2. 用转换脚本:
   ```bash
   tsx scripts/who-to-json.ts < 下载的zscore文本.txt > data/who/lhfa-boys.json
   ```

> 所有数值仅用于「对比正常范围」的科普展示,UI 标注「仅供参考,非医学诊断」。
