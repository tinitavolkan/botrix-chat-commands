import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

export const signs = [
  ['koç','koc'], ['boğa','boga'], ['ikizler','ikizler'], ['yengeç','yengec'],
  ['aslan','aslan'], ['başak','basak'], ['terazi','terazi'], ['akrep','akrep'],
  ['yay','yay'], ['oğlak','oglak'], ['kova','kova'], ['balık','balik'],
];
export const commands = [
  ['gergin','gergin'], ['andaval','andaval'], ['aşk','ask'], ['çiçek','cicek'],
  ['enayi','enayi'], ['ilişki','iliski'], ['yancı','yanci'], ['bok','bok'], ['yemek','yemek'],
];

export function generateCommands(base, edit = false) {
  const url = new URL(base);
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) {
    throw new Error('Sorgu, parola veya # içermeyen HTTPS Worker adresini kullanın.');
  }
  const action = edit ? '!editcom' : '!addcom';
  const endpoint = url.href;
  const lines = signs.map(([name, slug]) => `${action} !${name} fetch[${endpoint}?burc=${slug}]`);
  for (const [name, slug] of commands) {
    const users = slug === 'gergin' ? '' : '&kullanici=$(sender)&hedef=$(optionalvariable)';
    lines.push(`${action} !${name} fetch[${endpoint}?komut=${slug}${users}]`);
  }
  return lines.join('\n');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.length < 1 || args.length > 2 || (args[1] && args[1] !== '--edit')) {
    console.error('Kullanım: npm run commands -- https://KENDI-ADRESIN.workers.dev [--edit]');
    process.exitCode = 1;
  } else {
    try { console.log(generateCommands(args[0], args[1] === '--edit')); }
    catch (error) { console.error(error.message); process.exitCode = 1; }
  }
}
