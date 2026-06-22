// 把 WHO 发布的 zscore 文本(每行: age L M S [F])转成 {age,L,M,S}[] JSON。
//
// 用法(以男童身高/年龄为例):
//   tsx scripts/who-to-json.ts < wfa-boys-zscore.txt > data/who/lhfa-boys.json
//
// 数据来源:WHO Child Growth Standards(zscore 表)
//   https://www.who.int/tools/child-growth-standards
// 以及 5-19 岁参考(WHO Reference 2007)。把对应文本 stdin 喂给本脚本即可。
import { createInterface } from 'node:readline';

const rl = createInterface({ input: process.stdin });
const out: { age: number; L: number; M: number; S: number }[] = [];

rl.on('line', (line) => {
  const p = line.trim().split(/\s+/).map(Number);
  // 跳过表头/不完整行
  if (p.length >= 4 && p.slice(0, 4).every((n) => !Number.isNaN(n))) {
    out.push({ age: p[0], L: p[1], M: p[2], S: p[3] });
  }
});

rl.on('close', () => {
  process.stdout.write(JSON.stringify(out));
  process.stderr.write(`\nwrote ${out.length} rows\n`);
});
