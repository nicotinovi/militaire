const {test} = require('node:test');
const assert = require('node:assert/strict');
const C = require('../core.js');
require('../data.js');
const D = globalThis.MILITAIRE_DATA;
const card = D.cards.find(c=>c.fr==='courageux');

test('all PDF topics and meaningful nonempty entries are included',()=>{
  assert.equal(D.sections.length,11);
  assert.equal(D.cards.length,188);
  assert.deepEqual(D.sections.map(t=>D.cards.filter(c=>c.topic===t.id).length),[25,11,13,28,27,21,8,8,20,12,15]);
  assert.equal(new Set(D.cards.map(c=>c.id)).size,D.cards.length);
  for(const c of D.cards){assert.ok(c.fr&&c.ru);assert.ok(D.sections.some(t=>t.id===c.topic));assert.ok(c.page>=1&&c.page<=4);}
  for(const section of D.sections)assert.ok(D.cards.some(c=>c.topic===section.id));
  assert.equal(D.cards.filter(c=>c.fr==='la veille des exercices').length,2);
});
test('normalization accepts case, apostrophe, punctuation, ё and optional accents',()=>{
  assert.equal(C.normalize('  ÊTRE à l’heure !  '),C.normalize("etre a l'heure"));
  assert.equal(C.normalize('своё'),C.normalize('свое'));
  const e=D.cards.find(c=>c.fr==='être en retard');
  assert.ok(C.matches('ETRE en retard!',e,'ru-fr',false));
  assert.ok(!C.matches('etre en retard',e,'ru-fr',true));
  assert.ok(C.matches('être en retard',e,'ru-fr',true));
  assert.ok(!C.matches('',e,'ru-fr',false));
});
test('both genders, equivalents and both translation directions work',()=>{
  assert.ok(C.matches('courageuse',card,'ru-fr',true));
  assert.ok(C.matches('храбрая',card,'fr-ru',false));
  assert.ok(!C.matches('ленивый',card,'fr-ru',false));
  const ep=D.cards.find(c=>c.fr==='des pattes d’épaule');
  assert.ok(C.matches('des épaulettes',ep,'ru-fr',true));
});
test('correction clears only that direction, preserves initial accuracy, and is idempotent',()=>{
  const s=C.fresh();const e=C.record(s,card,'fr-ru',false,'умный','write');
  C.record(s,card,'ru-fr',false,'paresseux','write');
  C.correctMistake(s,e);C.correctMistake(s,e);
  assert.equal(Object.keys(s.pending).length,1);
  assert.equal(s.events.length,2);
  assert.equal(C.summary(s).accuracy,0);
  assert.equal(C.summary(s).fixed,1);
});
test('a later correct answer resolves the matching pending error',()=>{
  const s=C.fresh(),e=C.record(s,card,'ru-fr',false,'x','write');
  C.record(s,card,'ru-fr',true,'courageux','write');
  assert.equal(Object.keys(s.pending).length,0);
  assert.equal(e.corrected,true);
  assert.equal(C.summary(s).accuracy,50);
});
test('user accepted alternate is local to the card and regrades only current answer',()=>{
  const s=C.fresh(),e=C.record(s,card,'fr-ru',false,'отважный','write');
  C.acceptAlternative(s,e,card);
  assert.equal(e.acceptedByUser,true);
  assert.equal(C.summary(s).accuracy,100);
  assert.ok(C.matches('отважный',C.effective(card,s),'fr-ru',false));
  assert.ok(!C.matches('отважный',card,'fr-ru',false));
  assert.equal(Object.keys(s.pending).length,0);
});
test('queues filter topics, avoid duplicate normal cards and respect error direction',()=>{
  const s=C.fresh(),settings={...s.settings,topic:'safety',size:'all',direction:'mixed'};
  const q=C.makeQueue(D.cards,s,settings);
  assert.equal(q.length,D.cards.filter(c=>c.topic==='safety').length);
  assert.equal(new Set(q.map(c=>c.id)).size,q.length);
  assert.ok(q.every(c=>['fr-ru','ru-fr'].includes(c.direction)));
  C.record(s,card,'fr-ru',false,'x','write');C.record(s,card,'ru-fr',false,'x','write');
  assert.equal(C.makeQueue(D.cards,s,{...settings,topic:'all',direction:'fr-ru'},true).length,1);
  assert.equal(C.makeQueue(D.cards,s,{...settings,topic:'all'},true).length,2);
  const attempted=C.record(s,D.cards[0],'fr-ru',true,D.cards[0].ru,'choice');
  const normal=C.makeQueue(D.cards,s,{...settings,topic:'all',size:10});
  assert.ok(normal.every(q=>q.id!==attempted.cardId));
});
test('choices always contain exactly one correct, distinct option',()=>{
  for(const direction of ['fr-ru','ru-fr'])for(const c of D.cards){
    const options=C.options(c,direction,D.cards);
    assert.equal(options.length,4, c.id);
    assert.equal(new Set(options.map(o=>C.normalize(o))).size,4,c.id);
    assert.equal(options.filter(o=>C.matches(o,c,direction,false)).length,1,c.id);
  }
});
test('mastery requires three consecutive correct attempts and no pending direction',()=>{
  const s=C.fresh();for(let i=0;i<3;i++)C.record(s,card,'fr-ru',true,'смелый','choice');
  assert.equal(C.summary(s).mastered,1);
  C.record(s,card,'ru-fr',false,'x','write');assert.equal(C.summary(s).mastered,0);
});
test('daily activity and streak count local calendar days',()=>{
  const s=C.fresh(),now=new Date(2026,10,11,14).getTime();
  for(let i=0;i<3;i++){const e=C.record(s,card,'fr-ru',true,'смелый','write');const date=new Date(now);date.setDate(date.getDate()-i);e.at=date.getTime();}
  assert.equal(C.summary(s,undefined,now).today,1);
  assert.equal(C.summary(s,undefined,now).streak,3);
});
test('export roundtrip retains history, errors, settings and dictionary and drops paused queue',()=>{
  const s=C.fresh();C.record(s,card,'fr-ru',false,'x','write');s.settings.strict=true;
  s.custom[card.id]={ru:'отважный',ruAlt:['смелый']};s.session={index:3};
  const clean=C.validateImport(JSON.parse(JSON.stringify({app:'militaire',version:1,state:s})),D.cards);
  assert.deepEqual(clean.events,s.events.map(e=>({...e,acceptedByUser:false})));
  assert.deepEqual(clean.pending,s.pending);assert.deepEqual(clean.custom,s.custom);assert.equal(clean.settings.strict,true);assert.equal(clean.session,null);
});
test('invalid imports fail without modifying existing state and do not retain arbitrary fields',()=>{
  const s=C.fresh();assert.throws(()=>C.validateImport({state:s},D.cards));
  const e=C.record(s,card,'fr-ru',false,'x','write');const raw=()=>JSON.parse(JSON.stringify({app:'militaire',version:1,state:s}));
  let v=raw();v.state.events[0].cardId='unknown';assert.throws(()=>C.validateImport(v,D.cards));
  v=raw();v.state.events[0].correct='yes';assert.throws(()=>C.validateImport(v,D.cards));
  v=raw();v.state.pending[Object.keys(v.state.pending)[0]].eventId='missing';assert.throws(()=>C.validateImport(v,D.cards));
  v=raw();v.state.custom[card.id]={id:'evil',fr:'autre',unexpected:'discard'};const clean=C.validateImport(v,D.cards);assert.equal(clean.custom[card.id].id,undefined);assert.equal(clean.custom[card.id].unexpected,undefined);
  assert.equal(s.events[0],e);assert.equal(s.events.length,1);
});
