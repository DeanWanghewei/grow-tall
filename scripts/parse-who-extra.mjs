// 补齐 WHO 数据的缺段(均分男女):
//   BMI 0–5 岁(0–60 月,WHO 标准)→ 与已有 5–19 岁(60–228)合并为 BMI 0–19 岁
//   体重 5–10 岁(61–120 月,WHO 2007)→ 与已有 0–5 岁(0–60)合并为体重 0–10 岁
// 源数据(pygrowup2,txt: Month L M S SD...):https://github.com/jbaldivieso/pygrowup2
import fs from 'node:fs';
import path from 'node:path';

const RAW = path.join('data', 'who', 'raw');
const OUT = path.join('data', 'who');

function parseTxt(file) {
  const lines = fs.readFileSync(path.join(RAW, file), 'utf8').split(/\r\n|\r|\n/).map((l) => l.trim()).filter(Boolean);
  return lines
    .slice(1) // 跳过表头
    .map((line) => {
      const c = line.split(/\s+/); // 兼容 tab/空格
      return { age: Number(c[0]), L: Number(c[1]), M: Number(c[2]), S: Number(c[3]) };
    })
    .filter((r) => Number.isFinite(r.age));
}

for (const label of ['boys', 'girls']) {
  // BMI:0–2(0–23) + 2–5(24–60) → 0–60,再并入已有 60–228
  const bmi05 = [
    ...parseTxt(`bmi_${label}_0_2.txt`).filter((r) => r.age < 24),
    ...parseTxt(`bmi_${label}_2_5.txt`).filter((r) => r.age >= 24),
  ].sort((a, b) => a.age - b.age);
  const bmiExisting = JSON.parse(fs.readFileSync(path.join(OUT, `bmi-${label}.json`), 'utf8'));
  const bmi = [...bmi05, ...bmiExisting.filter((r) => r.age > 60)].sort((a, b) => a.age - b.age);
  fs.writeFileSync(path.join(OUT, `bmi-${label}.json`), JSON.stringify(bmi));
  console.log(`bmi-${label}.json: ${bmi.length} 行 (age ${bmi[0].age}..${bmi.at(-1).age})`);

  // 体重:已有 0–60 + 5–10(61–120)
  const wfaBase = JSON.parse(fs.readFileSync(path.join(OUT, `wfa-${label}.json`), 'utf8'));
  const wfaExt = parseTxt(`wfa_${label}_5_10.txt`).filter((r) => r.age > 60 && r.age <= 120);
  const wfa = [...wfaBase, ...wfaExt].sort((a, b) => a.age - b.age);
  fs.writeFileSync(path.join(OUT, `wfa-${label}.json`), JSON.stringify(wfa));
  console.log(`wfa-${label}.json: ${wfa.length} 行 (age ${wfa[0].age}..${wfa.at(-1).age})`);
}
