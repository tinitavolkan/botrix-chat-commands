import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/index.js';
import {
  START_DATE, SIGNS, DAYS, GERGIN_TEXTS, ANDAVAL_TEXTS, ASK_PAIR_TEXTS, ASK_SOLO_TEXTS,
  FLOWER_ROWS, ENAYI_TEXTS, BOK_TEXTS, MEAL_MENUS, RELATIONSHIP_TEXTS, CAFE_ORDERS,
  dayAt, packIndex, loveResult, serve,
} from '../src/worker.js';

const now = Date.parse('2026-10-17T12:00:00+03:00');
const request = (query, method='GET') => new Request('https://test.invalid/?' + (typeof query === 'string' ? query : new URLSearchParams(query)), {method});
const query = (komut, hedef='@Viewer_B', kullanici='Viewer_A') => ({komut,kullanici,...(hedef === undefined ? {} : {hedef})});
const all = ['gergin','andaval','ask','cicek','enayi','iliski','yanci','bok','yemek'];

test('Cloudflare entrypoint exposes only the supported HTTP handler', async () => {
  const entry = await import('../src/index.js');
  assert.deepEqual(Object.keys(entry), ['default']);
  assert.equal(typeof entry.default.fetch, 'function');
});

test('Complete 1510-entry content pack, including 360 horoscope texts and 200 menus', () => {
  assert.equal(Object.keys(SIGNS).length, 12);
  assert.equal(DAYS.length, 30);
  for (const day of DAYS) { assert.equal(day.length,12); assert.ok(day.every(value => typeof value === 'string' && value.trim())); }
  for (const rows of [GERGIN_TEXTS,ANDAVAL_TEXTS,ASK_PAIR_TEXTS,ASK_SOLO_TEXTS,ENAYI_TEXTS,BOK_TEXTS]) {
    assert.equal(rows.length,101); assert.equal(new Set(rows).size,101);
  }
  assert.equal(FLOWER_ROWS.length,96);
  assert.equal(RELATIONSHIP_TEXTS.length,8);
  assert.equal(CAFE_ORDERS.length,240);
  assert.equal(MEAL_MENUS.length,200);
  assert.equal(new Set(MEAL_MENUS.map(row => row.main)).size,200);
});

test('All 21 routes return short UTF-8 plain text with no caching', async () => {
  const cases = [...all.map(c => query(c)), ...Object.keys(SIGNS).map(burc => ({burc}))];
  for (const params of cases) {
    const response = serve(request(params),now,()=>0.5);
    assert.equal(response.status,200,JSON.stringify(params));
    assert.match(response.headers.get('Content-Type'),/^text\/plain; charset=utf-8$/);
    assert.equal(response.headers.get('Cache-Control'),'no-store');
    const body = await response.text();
    assert.ok(body.length > 0 && body.length <= 500, body);
  }
});

test('Date changes at Istanbul 00:01, including month, year and leap-day boundaries', () => {
  for (const [date,previous] of [['2026-10-18','2026-10-17'],['2026-11-01','2026-10-31'],['2027-01-01','2026-12-31'],['2028-03-01','2028-02-29']]) {
    assert.equal(dayAt(Date.parse(date+'T00:00:59+03:00')),previous);
    assert.equal(dayAt(Date.parse(date+'T00:01:00+03:00')),date);
  }
});

test('Horoscopes complete a 30-day cycle; dates before the configured start use day one', () => {
  const start = Date.parse(START_DATE+'T00:00:00Z');
  for (let i=0;i<=60;i++) assert.equal(packIndex(new Date(start+i*86400000).toISOString().slice(0,10)),i%30);
  assert.equal(packIndex('2025-01-01'),0);
});

test('Daily results are stable across callers and independent of randomness', async () => {
  for (const komut of ['cicek','iliski','yanci']) {
    const first = await serve(request(query(komut)),now,()=>{throw Error('No RNG');}).text();
    for (const caller of ['Someone','ANOTHER']) {
      assert.equal(await serve(request(query(komut,'@viewer_b',caller)),now,()=>{throw Error('No RNG');}).text(),first.replace('@Viewer_B','@viewer_b'));
    }
  }
  assert.deepEqual(loveResult('Viewer_A','Viewer_B',now),loveResult('Viewer_A','Viewer_B',now));
  assert.equal(loveResult('Viewer_A','Viewer_B',now).percent,loveResult('viewer_b','viewer_a',now).percent);
});

test('Daily sequences visit the whole configured cycle without adjacent repeats', () => {
  for (const [komut,size] of [['cicek',96],['iliski',8],['yanci',240]]) {
    const seen=[];
    for (let day=0;day<size;day++) {
      const response=serve(request(query(komut)),now+day*86400000);
      seen.push(Number(response.headers.get('X-Chat-Index')));
    }
    assert.equal(new Set(seen).size,size);
  }
  const scores=Array.from({length:101},(_,day)=>loveResult('Viewer_A',null,now+day*86400000).percent);
  assert.equal(new Set(scores).size,101);
});

test('All random percentages, boundary buckets and meal choices are reachable', async () => {
  for (const komut of ['gergin','andaval','enayi','bok']) {
    for (let i=0;i<=100;i++) {
      let draws=0;
      const response=serve(request(query(komut)),now,()=>{draws++; return (i+0.5)/101;});
      assert.match(await response.text(),new RegExp('%'+i+'(?:\\s|$)'));
      assert.equal(draws,1);
    }
    assert.match(await serve(request(query(komut)),now,()=>0).text(),/%0\s/);
    assert.match(await serve(request(query(komut)),now,()=>1-Number.EPSILON).text(),/%100\s/);
  }
  for (let i=0;i<200;i++) {
    const response=serve(request(query('yemek')),now,()=>(i+0.5)/200);
    assert.equal(response.headers.get('X-Yemek-Index'),String(i));
    assert.ok((await response.text()).includes(MEAL_MENUS[i].main));
  }
});

test('A request may draw the same random value twice; random commands are not daily caches', async () => {
  const same=[];
  for (const value of [0.2,0.2,0.8]) same.push(await serve(request(query('yemek')),now,()=>value).text());
  assert.equal(same[0],same[1]); assert.notEqual(same[1],same[2]);
});

test('Missing, null, blank and self targets fall back to the caller', async () => {
  for (const komut of ['andaval','ask','cicek','enayi','iliski','yanci','bok','yemek']) {
    for (const target of ['', 'null', '__solo__','@viewer_a']) {
      const body=await serve(request(query(komut,target)),now,()=>0.5).text();
      assert.ok(body.startsWith('@Viewer_A '),body);
      assert.equal((body.match(/@/g)||[]).length,1);
    }
    const body=await serve(request({komut,kullanici:'Viewer_A'}),now,()=>0.5).text();
    assert.ok(body.startsWith('@Viewer_A '));
  }
});

test('The meal free-text regression uses the sender instead of returning an error', async () => {
  for (const hedef of ['yazınca yemek mi geliyor','@@a','🍕','@other food']) {
    const response=serve(request(query('yemek',hedef)),now,()=>0.5);
    assert.equal(response.status,200);
    assert.ok((await response.text()).startsWith('@Viewer_A 🍽️'));
  }
});

test('Usernames, duplicate parameters, mixed routes and unknown commands are validated', () => {
  for (const value of ['komut=unknown','komut=yemek','komut=ask&kullanici=a&hedef=b&hedef=c','komut=ask&komut=ask&kullanici=a','komut=ask&burc=koc&kullanici=a','burc=koc&burc=boga','burc=unknown']) {
    assert.equal(serve(request(value),now).status,400,value);
  }
  for (const komut of ['ask','andaval','cicek','enayi','iliski','yanci','bok','yemek']) {
    for (const user of ['', '@@bad','two users','a'.repeat(33)]) assert.equal(serve(request(query(komut,'@Viewer_B',user)),now).status,400);
  }
});

test('Daily date/index override parameters cannot force a result', async () => {
  const expected=await serve(request(query('cicek')),now).text();
  assert.equal(await serve(request({...query('cicek'),day:'2000-01-01',index:'0',percent:'100'}),now).text(),expected);
});

test('HEAD returns empty text without random draws; unsupported methods return 405', async () => {
  for (const params of [...all.map(c=>query(c)),{burc:'koc'}]) {
    const response=serve(request(params,'HEAD'),now,()=>{throw Error('HEAD drew randomness');});
    assert.equal(response.status,200); assert.equal(await response.text(),'');
  }
  for (const method of ['POST','PUT','DELETE']) assert.equal(serve(request(query('yemek'),method),now).status,405);
});

test('Worker serves without outbound requests or bindings', async () => {
  const original=globalThis.fetch;
  globalThis.fetch=()=>{throw Error('Outbound request forbidden');};
  try {
    const bindings=new Proxy({}, {get(){throw Error('Binding access forbidden');}});
    for (const params of [...all.map(c=>query(c)),{burc:'koc'}]) assert.equal((await worker.fetch(request(params),bindings)).status,200);
  } finally { globalThis.fetch=original; }
});
