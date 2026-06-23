// 把 WHO Reference 2007(5–19 岁)的 LMS CSV 合并进本项目数据。
// 来源:https://github.com/isasaade-23/who-zscore-python(列:sex,age,l,m,s;sex 1=男 2=女)
// 原始 CSV 需先下载到 data/who/raw/who_height_519.csv、who_bmi_519.csv。
//
// 产物:
//   lhfa-boys.json / lhfa-girls.json  在已有 0–60 月基础上,追加 61–228 月(5–19 岁)→ 0–19 岁
//   bmi-boys.json  / bmi-girls.json   BMI/年龄(5–19 岁,60–228 月)
import fs from 'node:fs';
import path from 'node:path';

const RAW = path.join('data', 'who', 'raw');
const OUT = path.join('data', 'who');

function parseSexCsv(file) {
  const txt = fs.readFileSync(path.join(RAW, file), 'utf8');
  const lines = txt.split(/\r\n|\r|\n/).map((l) => l.trim()).filter(Boolean);
  const header = lines[0].toLowerCase().split(',');
  const idx = (k) => header.indexOf(k);
  const [si, ai, li, mi, ssi] = ['sex', 'age', 'l', 'm', 's'].map(idx);
  return lines
    .slice(1)
    .map((line) => {
      const c = line.split(',');
      return { sex: Number(c[si]), age: Number(c[ai]), L: Number(c[li]), M: Number(c[mi]), S: Number(c[ssi]) };
    })
    .filter((r) => Number.isFinite(r.age));
}

const H = parseSexCsv('who_height_519.csv');
const B = parseSexCsv('who_bmi_519.csv');

for (const [sex, label] of [
  [1, 'boys'],
  [2, 'girls'],
]) {
  // 身高:已有 0–60 + 2007 的 61–228
  const base = JSON.parse(fs.readFileSync(path.join(OUT, `lhfa-${label}.json`), 'utf8'));
  const ext = H.filter((r) => r.sex === sex && r.age > 60).map((r) => ({ age: r.age, L: r.L, M: r.M, S: r.S }));
  const merged = [...base, ...ext].sort((a, b) => a.age - b.age);
  fs.writeFileSync(path.join(OUT, `lhfa-${label}.json`), JSON.stringify(merged));
  console.log(`lhfa-${label}.json: ${merged.length} 行 (age ${merged[0].age}..${merged.at(-1).age})`);

  // BMI:5–19(60–228)
  const bmi = B.filter((r) => r.sex === sex).map((r) => ({ age: r.age, L: r.L, M: r.M, S: r.S }));
  fs.writeFileSync(path.join(OUT, `bmi-${label}.json`), JSON.stringify(bmi));
  console.log(`bmi-${label}.json: ${bmi.length} 行 (age ${bmi[0].age}..${bmi.at(-1).age})`);
}
