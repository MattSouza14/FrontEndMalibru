import { ESLint } from 'eslint';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
const baseline = JSON.parse(await readFile(new URL('../lint-baseline.json', import.meta.url), 'utf8'));
const results = await new ESLint().lintFiles(['.']);
const counts = new Map();
const unexpected = [];
let known = 0;
for (const result of results) {
  const file = path.relative(process.cwd(), result.filePath).replaceAll('\\', '/');
  for (const m of result.messages) {
    const source = (result.source || '').split(/\r?\n/)[m.line - 1]?.trim() || '';
    const key = JSON.stringify([file, m.ruleId, m.severity, source, m.message.split('\n')[0]]);
    const count = (counts.get(key) || 0) + 1; counts.set(key, count);
    if (!m.fatal && count <= (baseline[key] || 0)) known++;
    else unexpected.push(file + ':' + m.line + ' ' + m.ruleId + ' ' + m.message);
  }
}
console.log(known + ' diagnóstico(s) legado(s) explícitos na baseline. Nenhuma regra do ESLint foi desativada.');
if (unexpected.length) { console.error(unexpected.join('\n')); process.exitCode = 1; }
else console.log('Nenhum novo diagnóstico de lint.');
