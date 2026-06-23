// 把 ericpgreen/WHO-growth-charts 的 WHO 标准 CSV(列:Month,L,M,S,SD,...)
// 转成本项目使用的 {age,L,M,S}[] JSON。
//
// 来源:WHO Child Growth Standards(0–60 月),https://github.com/ericpgreen/WHO-growth-charts
// 数据先下载到 data/who/raw/(lfa/hfa/wfa,男女各一)。
// 产物:
//   lhfa-boys.json / lhfa-girls.json  身长(0–23)+身高(24–60)
//   wfa-boys.json  / wfa-girls.json   体重(0–60)
import fs from 'node:fs';
import path from 'node:path';

const RAW = path.join('data', 'who', 'raw');
const OUT = path.join('data', 'who');

function parseCsv(file) {
  const txt = fs.readFileSync(path.join(RAW, file), 'utf8');
  // 该数据集是 CR 行尾;兼容 \r\n / \r / \n
  const lines = txt.split(/\r\n|\r|\n/).map((l) => l.trim()).filter(Boolean);
  return lines
    .slice(1) // 跳过表头
    .map((line) => {
      const c = line.split(',');
      return { age: Number(c[0]), L: Number(c[1]), M: Number(c[2]), S: Number(c[3]) };
    })
    .filter((r) => Number.isFinite(r.age) && Number.isFinite(r.M));
}

// 身长(0–23 月,平躺)+ 身高(24–60 月,站立)合并为「身高/年龄」
function combine(lfa, hfa) {
  return [...lfa.filter((r) => r.age < 24), ...hfa.filter((r) => r.age >= 24)].sort(
    (a, b) => a.age - b.age,
  );
}

for (const [sex, label] of [
  ['b', 'boys'],
  ['g', 'girls'],
]) {
  const lhfa = combine(parseCsv(`lfa-${sex}-z.csv`), parseCsv(`hfa-${sex}-z.csv`));
  fs.writeFileSync(path.join(OUT, `lhfa-${label}.json`), JSON.stringify(lhfa));
  console.log(`lhfa-${label}.json: ${lhfa.length} 行 (age ${lhfa[0]?.age}..${lhfa.at(-1)?.age})`);

  const wfa = parseCsv(`wfa-${sex}-z.csv`);
  fs.writeFileSync(path.join(OUT, `wfa-${label}.json`), JSON.stringify(wfa));
  console.log(`wfa-${label}.json: ${wfa.length} 行 (age ${wfa[0]?.age}..${wfa.at(-1)?.age})`);
}
