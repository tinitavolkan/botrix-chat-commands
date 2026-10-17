import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const allowed = new Set([
  '.gitattributes', '.gitignore', '.github/workflows/tests.yml', 'LICENSE',
  'README.md', 'SECURITY.md', 'package.json', 'package-lock.json', 'settings.json',
  'wrangler.jsonc', 'src/index.js', 'src/worker.js', 'scripts/commands.js', 'scripts/check-release.js',
  'tests/worker.test.js', 'tests/commands.test.js',
  'data/horoscopes.json', 'data/percentages.json', 'data/love.json', 'data/flowers.json',
  'data/relationships.json', 'data/cafe.json', 'data/meals.json',
  'docs/SETUP.md', 'docs/METHOD.md', 'docs/COMMANDS.md', 'docs/CUSTOMIZATION.md',
  'docs/assets/flow.svg',
]);
const files = execFileSync('git', ['ls-files', '-z'], { cwd:root, encoding:'utf8' }).split('\0').filter(Boolean);
const missing = [...allowed].filter(name => !files.includes(name));
const extra = files.filter(name => !allowed.has(name));
if (missing.length || extra.length) throw new Error(JSON.stringify({missing, extra}));
for (const name of files) {
  const body = readFileSync(new URL('../' + name, import.meta.url), 'utf8');
  if (/\bgh[pousr]_[A-Za-z0-9]{20,}|\bgithub_pat_[A-Za-z0-9_]{20,}/.test(body)) throw new Error('Possible credential: ' + name);
  if (/botrix-burc\.tinitavolkan\.workers\.dev|C:\\Users\\tinitaVolkan/.test(body)) throw new Error('Personal runtime address/path: ' + name);
}
console.log(`Publication check passed: ${files.length} source, content and documentation files.`);
