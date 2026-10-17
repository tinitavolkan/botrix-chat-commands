import settings from '../settings.json' with { type: 'json' };
import horoscopes from '../data/horoscopes.json' with { type: 'json' };
import percentages from '../data/percentages.json' with { type: 'json' };
import love from '../data/love.json' with { type: 'json' };
import flowers from '../data/flowers.json' with { type: 'json' };
import relationships from '../data/relationships.json' with { type: 'json' };
import cafe from '../data/cafe.json' with { type: 'json' };
import meals from '../data/meals.json' with { type: 'json' };

// Hazır metin havuzları: istek sırasında dış hizmet veya veritabanı kullanılmaz.
const START_DATE = settings.startDate;
const PACK_VERSION = "curated-30-v1";
const { SIGNS } = horoscopes;
const SLUGS = Object.keys(SIGNS);
const { DAYS } = horoscopes;
const GERGIN_PACK_VERSION = 'gergin-v1';
const { GERGIN_TEXTS } = percentages;
const ANDAVAL_PACK_VERSION = 'andaval-v1';
const { ANDAVAL_TEXTS } = percentages;
const ASK_PACK_VERSION = 'ask-v1';
const { ASK_PAIR_TEXTS } = love;
const { ASK_SOLO_TEXTS } = love;
const CHAT_PACK_VERSION = 'chat-extras-v1';
const { FLOWER_ROWS } = flowers;
const { ENAYI_TEXTS } = percentages;
// !bok: her istekte rastgele yüzde ve o yüzdeye uygun 101 ayrı espri.
const { BOK_TEXTS } = percentages;
const MEAL_PACK_VERSION = 'yemek-v1';
const { MEAL_MENUS } = meals;
const { RELATIONSHIP_TEXTS } = relationships;
// Türkçe metin incelemesi: tüm komutların hazır metinleri gözden geçirildi.
// Çiçek yorumları: 12 çiçek için karakterle uyumlu 96 kısa kişilik tanımı.
// !yancı: 24 içecek × 10 sipariş = 240 hazır cevap.
const { CAFE_ORDERS } = cafe;
const CHAT_STEPS = {"8":[1,3,5,7],"96":[1,5,7,11,13,17,19,23,25,29,31,35,37,41,43,47,49,53,55,59,61,65,67,71,73,77,79,83,85,89,91,95],"240":[1,7,11,13,17,19,23,29,31,37,41,43,47,49,53,59,61,67,71,73,77,79,83,89,91,97,101,103,107,109,113,119,121,127,131,133,137,139,143,149,151,157,161,163,167,169,173,179,181,187,191,193,197,199,203,209,211,217,221,223,227,229,233,239]};
const DAY_MS = 86400000;
const START_ORDINAL = Date.parse(START_DATE + 'T00:00:00Z') / DAY_MS;
const ISTANBUL = new Intl.DateTimeFormat('en-CA', {timeZone:'Europe/Istanbul',year:'numeric',month:'2-digit',day:'2-digit'});

function dayAt(now = Date.now()) {
  const parts = Object.fromEntries(ISTANBUL.formatToParts(new Date(now - 60000)).map(p => [p.type, p.value]));
  return parts.year + '-' + parts.month + '-' + parts.day;
}
function packIndex(day) {
  const elapsed = Date.parse(day + 'T00:00:00Z') / DAY_MS - START_ORDINAL;
  return Math.max(0, elapsed) % DAYS.length;
}
function text(body, status = 200, extra = {}) {
  return new Response(body, {status, headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...extra}});
}
function stressText(percent) {
  if (!Number.isInteger(percent) || percent < 0 || percent > 100) throw new RangeError('Invalid percentage');
  return settings.streamerName + ' şu anda %' + percent + ' gergin. ' + GERGIN_TEXTS[percent];
}
function andavalText(percent) {
  if (!Number.isInteger(percent) || percent < 0 || percent > 100) throw new RangeError('Invalid percentage');
  return '%' + percent + ' andaval. ' + ANDAVAL_TEXTS[percent];
}
function pickPercent(random = Math.random) {
  const value = random();
  if (!Number.isFinite(value) || value < 0 || value >= 1) throw new RangeError('Invalid random value');
  return Math.floor(value * 101);
}
function loveUsers(sender, target) {
  function user(value) {
    if (typeof value !== 'string') return null;
    const display = value.trim().replace(/^@/, '');
    return /^[a-z0-9_-]{1,32}$/i.test(display) ? {display, key:display.toLowerCase()} : null;
  }
  const caller = user(sender);
  if (!caller) throw new RangeError('Invalid sender');
  let chosen = null;
  if (target !== null && target !== undefined) {
    if (typeof target !== 'string') throw new RangeError('Invalid target');
    const raw = target.trim();
    if (raw && raw !== 'null' && raw !== '__solo__') {
      chosen = user(raw);
      if (!chosen) throw new RangeError('Invalid target');
    }
  }
  if (chosen && chosen.key === caller.key) chosen = null;
  return {caller, chosen};
}
function loveText(sender, target, percent) {
  if (!Number.isInteger(percent) || percent < 0 || percent > 100) throw new RangeError('Invalid percentage');
  const {caller, chosen} = loveUsers(sender, target);
  return chosen
    ? '@' + caller.display + ', @' + chosen.display + ' sana %' + percent + ' âşık 💗 ' + ASK_PAIR_TEXTS[percent]
    : '@' + caller.display + ' flört modun %' + percent + ' 💗 ' + ASK_SOLO_TEXTS[percent];
}
function hash32(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index++) hash = Math.imul(hash ^ value.charCodeAt(index), 16777619);
  return hash >>> 0;
}
function loveResult(sender, target = null, now = Date.now()) {
  const {caller, chosen} = loveUsers(sender, target);
  const day = dayAt(now);
  const key = chosen ? 'pair|' + [caller.key, chosen.key].sort().join('|') : 'solo|' + caller.key;
  const offset = hash32(ASK_PACK_VERSION + '|' + key) % 101;
  const step = 1 + hash32('step|' + key) % 100;
  const ordinal = Date.parse(day + 'T00:00:00Z') / DAY_MS;
  const position = (ordinal % 101 + 101) % 101;
  // 101 is prime; every nonzero step visits all scores, with no consecutive-day repeat.
  const percent = (offset + position * step) % 101;
  return {day, mode:chosen ? 'pair' : 'solo', percent, body:loveText(caller.display, chosen ? chosen.display : null, percent)};
}
function serveLove(request, params, now) {
  const senders = params.getAll('kullanici');
  const targets = params.getAll('hedef');
  if (senders.length !== 1 || targets.length > 1) return text(request.method === 'HEAD' ? '' : 'Kullanım: !aşk veya !aşk @kişi', 400);
  let result;
  try { result = loveResult(senders[0], targets.length ? targets[0] : null, now); }
  catch { return text(request.method === 'HEAD' ? '' : 'Geçersiz kullanıcı. Kullanım: !aşk @kişi', 400); }
  return text(request.method === 'HEAD' ? '' : result.body, 200, {'X-Ask-Pack':ASK_PACK_VERSION,'X-Ask-Day':result.day,'X-Ask-Mode':result.mode,'X-Ask-Percent':String(result.percent)});
}
function chatDailyIndex(command, userKey, day, size) {
  const identity = CHAT_PACK_VERSION + '|' + command + '|' + userKey;
  const offset = hash32(identity) % size;
  const options = CHAT_STEPS[size];
  const step = options[hash32('step|' + identity) % options.length];
  const ordinal = Date.parse(day + 'T00:00:00Z') / DAY_MS;
  const position = (ordinal % size + size) % size;
  return (offset + position * step) % size;
}
function serveChatExtra(request, params, command, now, random) {
  const isHead = request.method === 'HEAD';
  const senders = params.getAll('kullanici'), targets = params.getAll('hedef');
  const usage = {cicek:'çiçek',enayi:'enayi',iliski:'ilişki',yanci:'yancı',bok:'bok'}[command];
  if (senders.length !== 1 || targets.length > 1) return text(isHead ? '' : 'Kullanım: !' + usage + ' veya !' + usage + ' @kişi', 400);
  let recipient;
  try {
    const {caller, chosen} = loveUsers(senders[0], targets.length ? targets[0] : null);
    recipient = chosen || caller;
  } catch {
    return text(isHead ? '' : 'Geçersiz kullanıcı. Kullanım: !' + usage + ' @kişi', 400);
  }
  const headers = {'X-Chat-Pack':CHAT_PACK_VERSION,'X-Chat-Command':command};
  const prefix = '@' + recipient.display + ' ';
  if (command === 'enayi' || command === 'bok') {
    if (isHead) return text('', 200, headers);
    const percent = pickPercent(random);
    headers['X-Chat-Percent'] = String(percent);
    const body = command === 'bok'
      ? prefix + '💩 %' + percent + ' bok. ' + BOK_TEXTS[percent]
      : prefix + '%' + percent + ' enayi. ' + ENAYI_TEXTS[percent];
    return text(body, 200, headers);
  }
  const day = dayAt(now);
  const size = command === 'cicek' ? FLOWER_ROWS.length : command === 'iliski' ? RELATIONSHIP_TEXTS.length : CAFE_ORDERS.length;
  const index = chatDailyIndex(command, recipient.key, day, size);
  headers['X-Chat-Day'] = day;
  headers['X-Chat-Index'] = String(index);
  let body;
  if (command === 'cicek') {
    const row = FLOWER_ROWS[index];
    headers['X-Chat-Flower'] = row.slug;
    body = prefix + row.emoji + ' ' + row.name + ' çıktın: ' + row.text;
  } else if (command === 'iliski') {
    body = prefix + '💌 İlişki durumu: ' + RELATIONSHIP_TEXTS[index];
  } else {
    const row = CAFE_ORDERS[index];
    body = prefix + row.emoji + ' ' + settings.cafeName + ' siparişin: ' + row.drink + ' + ' + row.side + '. ' + row.text;
  }
  return text(isHead ? '' : body, 200, headers);
}

function serveMeal(request, params, random) {
  const isHead = request.method === 'HEAD';
  const senders = params.getAll('kullanici'), targets = params.getAll('hedef');
  if (senders.length !== 1 || targets.length > 1) return text(isHead ? '' : 'Kullanım: !yemek veya !yemek @kişi', 400);
  let recipient;
  try {
    // Chat text after the command is optional, and need not be a username.
    const rawTarget = targets.length ? targets[0].trim() : '';
    const target = /^@?[a-z0-9_-]{1,32}$/i.test(rawTarget) ? rawTarget : null;
    const {caller, chosen} = loveUsers(senders[0], target);
    recipient = chosen || caller;
  } catch {
    return text(isHead ? '' : 'Geçersiz kullanıcı. Kullanım: !yemek @kişi', 400);
  }
  const headers = {'X-Yemek-Pack':MEAL_PACK_VERSION};
  if (isHead) return text('', 200, headers);
  const value = random();
  if (!Number.isFinite(value) || value < 0 || value >= 1) throw new RangeError('Invalid random value');
  const index = Math.floor(value * MEAL_MENUS.length);
  const row = MEAL_MENUS[index];
  headers['X-Yemek-Index'] = String(index);
  headers['X-Yemek-Category'] = row.category;
  const body = '@' + recipient.display + ' 🍽️ Menü: ' + row.main + '. Yanına ' + row.side + '.';
  return text(body, 200, headers);
}

function serve(request, now = Date.now(), random = Math.random) {
  if (request.method !== 'GET' && request.method !== 'HEAD') return text('Yalnızca GET desteklenir.', 405, {Allow:'GET, HEAD'});
  const params = new URL(request.url).searchParams;
  const commands = params.getAll('komut');
  const values = params.getAll('burc');
  if (commands.length) {
    if (commands.length !== 1 || !['gergin', 'andaval', 'ask', 'cicek', 'enayi', 'iliski', 'yanci', 'bok', 'yemek'].includes(commands[0]) || values.length) return text(request.method === 'HEAD' ? '' : 'Geçersiz komut.', 400);
    if (commands[0] === 'yemek') return serveMeal(request, params, random);
    if (commands[0] === 'ask') return serveLove(request, params, now);
    if (['cicek', 'enayi', 'iliski', 'yanci', 'bok'].includes(commands[0])) return serveChatExtra(request, params, commands[0], now, random);
    const isAndaval = commands[0] === 'andaval';
    let recipientPrefix = '';
    // No name fields keeps the old bare endpoint compatible with saved BotRix commands.
    if (isAndaval && (params.has('kullanici') || params.has('hedef'))) {
      const senders = params.getAll('kullanici'), targets = params.getAll('hedef');
      if (senders.length !== 1 || targets.length > 1) return text(request.method === 'HEAD' ? '' : 'Kullanım: !andaval veya !andaval @kişi', 400);
      try {
        const {caller, chosen} = loveUsers(senders[0], targets.length ? targets[0] : null);
        recipientPrefix = '@' + (chosen || caller).display + ' ';
      } catch {
        return text(request.method === 'HEAD' ? '' : 'Geçersiz kullanıcı. Kullanım: !andaval @kişi', 400);
      }
    }
    const prefix = isAndaval ? 'X-Andaval-' : 'X-Gergin-';
    const headers = {[prefix + 'Pack']:isAndaval ? ANDAVAL_PACK_VERSION : GERGIN_PACK_VERSION};
    if (request.method === 'HEAD') return text('', 200, headers);
    const percent = pickPercent(random);
    headers[prefix + 'Percent'] = String(percent);
    return text(isAndaval ? recipientPrefix + andavalText(percent) : stressText(percent), 200, headers);
  }
  const slug = values.length === 1 ? values[0] : null;
  if (!slug || !Object.hasOwn(SIGNS, slug)) return text(request.method === 'HEAD' ? '' : 'Geçersiz burç. Örnek: ?burc=ikizler', 400);
  const day = dayAt(now), index = packIndex(day);
  const body = SIGNS[slug] + ' | ' + day.split('-').reverse().join('.') + ': ' + DAYS[index][SLUGS.indexOf(slug)];
  return text(request.method === 'HEAD' ? '' : body, 200, {'X-Horoscope-Pack':PACK_VERSION,'X-Horoscope-Day':String(index + 1),'X-Horoscope-Date':day});
}
export default {
  fetch(request) { return serve(request); },
};

export { START_DATE, SIGNS, DAYS, GERGIN_TEXTS, ANDAVAL_TEXTS, ASK_PAIR_TEXTS, ASK_SOLO_TEXTS, FLOWER_ROWS, ENAYI_TEXTS, BOK_TEXTS, MEAL_MENUS, RELATIONSHIP_TEXTS, CAFE_ORDERS, dayAt, packIndex, loveResult, chatDailyIndex, serve };
