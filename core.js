(function (root) {
  'use strict';
  const DAY = 86400000;
  const fresh = () => ({version: 1, events: [], pending: {}, custom: {}, settings: {mode: 'choice', direction: 'fr-ru', topic: 'all', size: 10, strict: false}, session: null});
  function normalize(value, strict = false) {
    let s = String(value).toLocaleLowerCase().normalize('NFC').replace(/ё/g, 'е');
    if (!strict) s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return s.replace(/[’‘`ʼ']/g, ' ').replace(/[\p{P}\p{S}]/gu, ' ').replace(/\s+/g, ' ').trim();
  }
  function effective(card, state) { return {...card, ...state.custom[card.id], id: card.id, topic: card.topic, page: card.page}; }
  function sides(card, direction) {
    const answerLang = direction === 'fr-ru' ? 'ru' : 'fr';
    const promptLang = answerLang === 'fr' ? 'ru' : 'fr';
    return {prompt: card[promptLang], answer: card[answerLang], promptLang, answerLang, accepted: [card[answerLang], ...(card[`${answerLang}Alt`] || [])]};
  }
  function matches(value, card, direction, strict) { const n = normalize(value, strict); return !!n && sides(card, direction).accepted.some(a => normalize(a, strict) === n); }
  function shuffle(items, rng = Math.random) {
    const out = [...items];
    for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
    return out;
  }
  const keyFor = (id, direction) => `${id}:${direction}`;
  function record(state, card, direction, correct, response, mode) {
    const event = {id: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`, cardId: card.id, direction, correct, response, mode, at: Date.now(), corrected: false, expected: sides(card, direction).answer};
    state.events.push(event);
    const key = keyFor(card.id, direction);
    if (correct) {
      if (state.pending[key]) { const prior = state.events.find(e => e.id === state.pending[key].eventId); if (prior) prior.corrected = true; }
      delete state.pending[key];
    } else state.pending[key] = {cardId: card.id, direction, eventId: event.id, at: event.at};
    return event;
  }
  function correctMistake(state, event) {
    event.corrected = true;
    const key = keyFor(event.cardId, event.direction);
    if (state.pending[key]?.eventId === event.id) delete state.pending[key];
  }
  function acceptAlternative(state, event, card) {
    const lang = sides(card, event.direction).answerLang;
    const custom = state.custom[card.id] || {};
    custom[`${lang}Alt`] = [...new Set([...(custom[`${lang}Alt`] || card[`${lang}Alt`] || []), event.response])];
    state.custom[card.id] = custom;
    event.correct = true; event.acceptedByUser = true; event.corrected = false;
    const key = keyFor(card.id, event.direction);
    if (state.pending[key]?.eventId === event.id) delete state.pending[key];
  }
  function localDate(at = Date.now()) { const d = new Date(at); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
  function summary(state, ids, now = Date.now()) {
    const events = ids ? state.events.filter(e => ids.has(e.cardId)) : state.events;
    const correct = events.filter(e => e.correct).length;
    const touched = new Set(events.map(e => e.cardId));
    const last = new Map();
    events.forEach(e => { const a = last.get(e.cardId) || []; a.push(e); last.set(e.cardId, a); });
    const mastered = [...last.values()].filter(a => a.length >= 3 && a.slice(-3).every(e => e.correct) && !Object.values(state.pending).some(p => p.cardId === a[0].cardId)).length;
    const days = new Set(state.events.map(e => localDate(e.at)));
    let streak = 0; const cursor = new Date(now); cursor.setHours(12,0,0,0);
    if (!days.has(localDate(cursor.getTime()))) cursor.setDate(cursor.getDate()-1);
    while (days.has(localDate(cursor.getTime()))) { streak++; cursor.setDate(cursor.getDate()-1); }
    return {total: events.length, correct, accuracy: events.length ? Math.round(correct / events.length * 100) : null, touched: touched.size, mastered, streak, today: events.filter(e => localDate(e.at) === localDate(now)).length, fixed: events.filter(e => !e.correct && e.corrected).length};
  }
  function makeQueue(cards, state, settings, errorsOnly = false) {
    const eligible = cards.filter(c => settings.topic === 'all' || settings.topic === c.topic);
    let queue;
    if (errorsOnly) {
      const ids = new Set(eligible.map(c => c.id));
      queue = shuffle(Object.values(state.pending).filter(p => ids.has(p.cardId) && (settings.direction === 'mixed' || settings.direction === p.direction))).map(p => ({id: p.cardId, direction: p.direction}));
    } else {
      const counts = new Map(); state.events.forEach(e => counts.set(e.cardId, (counts.get(e.cardId)||0)+1));
      queue = shuffle(eligible).sort((a,b) => (counts.get(a.id)||0)-(counts.get(b.id)||0)).map(c => ({id: c.id, direction: settings.direction === 'mixed' ? (Math.random()<.5 ? 'fr-ru' : 'ru-fr') : settings.direction}));
    }
    return queue.slice(0, settings.size === 'all' ? queue.length : Number(settings.size));
  }
  function options(card, direction, cards) {
    const correct = sides(card, direction).answer;
    const forbidden = new Set(sides(card,direction).accepted.map(x=>normalize(x)));
    const seen = new Set([normalize(correct)]);
    const candidates = shuffle(cards).sort((a,b) => Number(b.topic===card.topic)-Number(a.topic===card.topic));
    const wrong = [];
    for (const c of candidates) {
      const s = sides(c,direction), key = normalize(s.answer);
      if (seen.has(key) || s.accepted.some(x=>forbidden.has(normalize(x)))) continue;
      seen.add(key); wrong.push(s.answer); if (wrong.length === 3) break;
    }
    return shuffle([correct, ...wrong]);
  }
  function validateImport(raw, cards) {
    if (!raw || raw.app !== 'militaire' || raw.version !== 1 || !raw.state) throw Error('Это не файл прогресса Militaire.');
    const src = raw.state, ids = new Set(cards.map(c=>c.id)), clean = fresh();
    if (!Array.isArray(src.events) || src.events.length > 200000 || !src.custom || typeof src.custom !== 'object' || !src.pending || typeof src.pending !== 'object') throw Error('Файл прогресса повреждён.');
    const str = v => typeof v === 'string' && v.length <= 3000;
    const eventIds = new Set();
    clean.events = src.events.map(e=>{
      if (!e || !ids.has(e.cardId) || !['fr-ru','ru-fr'].includes(e.direction) || typeof e.correct !== 'boolean' || !str(e.response) || !str(e.expected) || !str(e.id) || eventIds.has(e.id) || !Number.isFinite(e.at) || e.at < 0 || !['choice','write','flash'].includes(e.mode)) throw Error('Некорректная история ответов.');
      eventIds.add(e.id);
      return {id:e.id,cardId:e.cardId,direction:e.direction,correct:e.correct,response:e.response,expected:e.expected,at:e.at,mode:e.mode,corrected:e.corrected===true,acceptedByUser:e.acceptedByUser===true};
    });
    for (const [id, value] of Object.entries(src.custom)) {
      if (!ids.has(id) || !value || typeof value !== 'object') continue;
      const c = {};
      for (const field of ['fr','ru','note']) if (field in value) { if (!str(value[field]) || (field !== 'note' && !value[field].trim())) throw Error('Некорректная карточка словаря.'); c[field]=value[field]; }
      for (const field of ['frAlt','ruAlt']) if (field in value) { if (!Array.isArray(value[field]) || value[field].length > 100 || !value[field].every(v=>str(v)&&v.trim())) throw Error('Некорректные варианты перевода.'); c[field]=[...value[field]]; }
      clean.custom[id]=c;
    }
    for (const p of Object.values(src.pending)) {
      if (!p || !ids.has(p.cardId) || !['fr-ru','ru-fr'].includes(p.direction)) throw Error('Некорректный список ошибок.');
      const e=clean.events.find(e=>e.id===p.eventId && e.cardId===p.cardId && e.direction===p.direction && !e.correct && !e.corrected);
      if (!e) throw Error('Ошибка не связана с историей ответов.');
      clean.pending[keyFor(p.cardId,p.direction)]={cardId:p.cardId,direction:p.direction,eventId:e.id,at:e.at};
    }
    const s=src.settings||{};
    if (['choice','write','flash'].includes(s.mode)) clean.settings.mode=s.mode;
    if (['fr-ru','ru-fr','mixed'].includes(s.direction)) clean.settings.direction=s.direction;
    if (s.topic==='all'||cards.some(c=>c.topic===s.topic)) clean.settings.topic=s.topic;
    if ([10,20,40,'all'].includes(s.size)) clean.settings.size=s.size;
    clean.settings.strict=s.strict===true;
    return clean;
  }
  root.MilitaireCore = {DAY, fresh, normalize, effective, sides, matches, shuffle, keyFor, record, correctMistake, acceptAlternative, localDate, summary, makeQueue, options, validateImport};
  if (typeof module !== 'undefined') module.exports = root.MilitaireCore;
})(typeof window === 'undefined' ? globalThis : window);
