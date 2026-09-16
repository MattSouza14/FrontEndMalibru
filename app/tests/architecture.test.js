import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../src/', import.meta.url));
function walk(dir) { return readdirSync(dir, { withFileTypes: true }).flatMap(f => f.isDirectory() ? walk(path.join(dir, f.name)) : [path.join(dir, f.name)]); }
const files = walk(root).filter(f => /\.(js|jsx)$/.test(f));
function imports(file) { return [...readFileSync(file, 'utf8').matchAll(/(?:from\s*|import\s*\(\s*|import\s*)['"](\.[^'"]+)['"]/g)].map(m => path.resolve(path.dirname(file), m[1])); }
test('todos os imports relativos resolvem após a reorganização', () => {
  for (const file of files) for (const target of imports(file)) assert.ok(existsSync(target), path.relative(root, file) + ' -> ' + target);
});
test('shared permanece independente de features e app', () => {
  for (const file of files.filter(f => f.startsWith(path.join(root, 'shared') + path.sep))) {
    for (const target of imports(file)) assert.ok(!/^(features|app)[/\\]/.test(path.relative(root, target)), file + ' depende de ' + target);
  }
});
test('páginas de cada funcionalidade não dependem da composição app', () => {
  for (const file of files.filter(f => f.startsWith(path.join(root, 'features') + path.sep))) {
    for (const target of imports(file)) assert.ok(!path.relative(root, target).startsWith('app' + path.sep), file + ' depende de app');
  }
});
