/* Offline UI smoke checks in a minimal document harness. No browser, network,
   or rendering engine is started. These checks do not replace visual QA. */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const ROOT=path.join(__dirname,'..');
const STORE='militaire.progress.v1';
function harness(seed,hash=''){
  const memory=seed||new Map(),nodes=new Map(),handlers={},windowHandlers={};
  const permanent=new Set(['#content','#navigation','#connection','#storage-warning','#dialog','#toast']);
  const node=key=>{
    if(!nodes.has(key))nodes.set(key,{innerHTML:'',textContent:'',value:'',hidden:true,open:false,checked:false,files:[],classList:{add(){},remove(){}},focus(){},scrollIntoView(){},setSelectionRange(){},showModal(){this.open=true;},close(){this.open=false;},append(){},remove(){},click(){}});
    return nodes.get(key);
  };
  const has=key=>permanent.has(key)||[...nodes.values()].some(n=>typeof n.innerHTML==='string'&&n.innerHTML.includes(`id="${key.slice(1)}"`));
  const query=key=>key.startsWith('#')?(has(key)?node(key):null):({focus(){},scrollIntoView(){}});
  const doc={querySelector:query,getElementById:id=>query('#'+id),addEventListener:(key,fn)=>handlers[key]=fn,createElement:()=>node('a-download'),body:{append(){}}};
  const context={document:doc,navigator:{onLine:true},location:{hash,protocol:'file:'},history:{replaceState(_,__,hash){context.location.hash=hash;}},localStorage:{getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,v)},setTimeout:()=>1,clearTimeout(){},console,URL,Blob,Date,Math,crypto:globalThis.crypto,scrollTo(){},addEventListener:(key,fn)=>windowHandlers[key]=fn};
  context.window=context;vm.createContext(context);
  for(const name of ['data.js','core.js','app.js'])vm.runInContext(fs.readFileSync(path.join(ROOT,name),'utf8'),context,{filename:name});
  function click(dataset){const b={dataset,disabled:false,hasAttribute:name=>name==='data-dialog-close'&&dataset.dialogClose!==undefined,matches:()=>false};handlers.click({target:{closest:()=>b}});}
  function change(id,value){const el=query('#'+id);el.id=id;el.value=value;handlers.change({target:el});}
  function submit(id){const el=query('#'+id);assert.ok(el,`form ${id} exists`);if(el.onsubmit)el.onsubmit({preventDefault(){}});else handlers.submit({target:{id},preventDefault(){}});}
  return {context,memory,node,query,click,change,submit,handlers,windowHandlers,html:()=>node('#content').innerHTML,saved:()=>JSON.parse(memory.get(STORE))};
}
test('all main pages render meaningful UI with no undefined content',()=>{
  const h=harness();assert.match(h.html(),/188 карточек/);
  for(const nav of ['errors','dictionary','stats','settings','practice']){h.click({nav});assert.ok(h.html().length>400);assert.doesNotMatch(h.html(),/undefined|NaN/);}
});
test('choice answer, retry, correction and reload preserve the original failed attempt',()=>{
  const h=harness();h.click({action:'start'});assert.match(h.html(),/data-choice="0"/);
  const initial=h.saved();assert.equal(initial.session.queue.length,10);
  const q=initial.session.queue[0],card=h.context.MILITAIRE_DATA.cards.find(c=>c.id===q.id);
  const wrong=initial.session.choices.findIndex(v=>!h.context.MilitaireCore.matches(v,card,q.direction,false));
  h.click({choice:String(wrong)});assert.match(h.html(),/Пока не получилось/);assert.equal(h.saved().events.length,1);
  h.click({action:'retry'});h.query('#correction-input').value='неправильное исправление';h.submit('correction-form');assert.match(h.query('#correction-error').textContent,/Пока не совпадает/);
  h.query('#correction-input').value=h.context.MilitaireCore.sides(card,q.direction).answer;h.submit('correction-form');
  assert.match(h.html(),/Ошибка исправлена/);assert.equal(Object.keys(h.saved().pending).length,0);assert.equal(h.saved().events[0].correct,false);assert.equal(h.saved().events[0].corrected,true);
  const reload=harness(h.memory,'#session');assert.match(reload.html(),/Ошибка исправлена/);reload.click({action:'next'});assert.equal(reload.saved().session.index,1);assert.match(reload.html(),/data-choice="0"/);
});
test('writing accepts a custom alternate and restores it after reload',()=>{
  const h=harness();h.click({mode:'write'});h.click({direction:'ru-fr'});h.click({action:'start'});
  h.query('#answer-input').value='a personal equivalent';h.submit('answer-form');assert.match(h.html(),/Мой ответ тоже верный/);
  h.click({action:'accept'});assert.equal(h.node('#dialog').open,true);h.query('#confirm-accept').onclick();
  assert.equal(h.saved().events[0].correct,true);assert.equal(h.saved().events[0].acceptedByUser,true);
  const q=h.saved().session.queue[0],reload=harness(h.memory);assert.ok(reload.saved().custom[q.id].frAlt.includes('a personal equivalent'));
});
test('flashcards, skipped answers, single-error practice and results work',()=>{
  const h=harness();h.click({mode:'flash'});h.change('training-topic','safety');h.change('training-size','all');h.click({action:'start'});
  for(let i=0;i<8;i++){h.click({action:'flip'});assert.match(h.html(),/Знаю/);h.click({action:i?'flash-yes':'flash-no'});h.click({action:'next'});}
  assert.match(h.html(),/Эта тренировка|Вернитесь к сложным/);assert.equal(h.saved().events.length,8);
  h.click({nav:'errors'});assert.match(h.html(),/Нужно повторить/);
  const key=Object.keys(h.saved().pending)[0];h.click({error:key});assert.match(h.html(),/id="answer-input"/);assert.equal(h.saved().session.mode,'write');
  h.click({action:'skip'});assert.match(h.html(),/Пока не получилось/);h.click({action:'next'});assert.match(h.html(),/Ещё немного увереннее/);
});
test('dictionary editing persists and source restore does not erase statistics',()=>{
  const h=harness();h.click({nav:'dictionary'});const id='uniform-01';h.click({edit:id});
  for(const [key,value] of [['edit-fr','une tenue militaire'],['edit-ru','форма'],['edit-fr-alt','tenue\nuniforme'],['edit-ru-alt','военная форма'],['edit-note','Личная заметка']])h.query('#'+key).value=value;
  h.submit('edit-form');assert.equal(h.saved().custom[id].ru,'форма');assert.match(h.html(),/Личная заметка/);
  h.click({edit:id});h.query('#restore-card').onclick();assert.equal(h.saved().custom[id],undefined);assert.equal(h.saved().events.length,0);
});
test('import preview requires confirmation and invalid files leave progress untouched',async()=>{
  const h=harness();h.click({nav:'settings'});
  const imported=h.context.MilitaireCore.fresh();h.context.MilitaireCore.record(imported,h.context.MILITAIRE_DATA.cards[0],'fr-ru',false,'x','write');
  const fire=async value=>{const el=h.query('#import-file');el.id='import-file';el.files=[{size:100,text:async()=>value}];h.handlers.change({target:el});await new Promise(resolve=>setImmediate(resolve));};
  await fire(JSON.stringify({app:'militaire',version:1,state:imported}));assert.match(h.node('#dialog').innerHTML,/Загрузить прогресс/);assert.equal(h.memory.has(STORE),false);
  h.query('#confirm-import').onclick();assert.equal(h.saved().events.length,1);assert.match(h.html(),/Прогресс в деталях/);
  h.click({nav:'settings'});await fire('{invalid');assert.match(h.node('#dialog').innerHTML,/Не удалось загрузить/);assert.equal(h.saved().events.length,1);
});
test('unreadable browser data is preserved before new progress is saved',()=>{
  const memory=new Map([[STORE,'broken-json']]),h=harness(memory);assert.equal(h.node('#storage-warning').hidden,false);
  h.click({mode:'write'});assert.equal(memory.get(STORE+'.unreadable-backup'),'broken-json');assert.equal(h.saved().settings.mode,'write');
});
test('another tab cannot be silently overwritten',()=>{
  const h=harness();h.click({mode:'write'});const before=h.memory.get(STORE);
  const other=JSON.parse(before);other.settings.mode='flash';h.memory.set(STORE,JSON.stringify(other));
  h.windowHandlers.storage({key:STORE});h.click({mode:'choice'});
  assert.equal(h.saved().settings.mode,'flash');assert.equal(h.node('#storage-warning').hidden,false);
});
test('manifest and offline cache contain valid relative assets, also safe under a project subpath',()=>{
  const manifest=JSON.parse(fs.readFileSync(path.join(ROOT,'manifest.webmanifest'),'utf8'));
  assert.equal(manifest.start_url,'./');assert.equal(manifest.scope,'./');
  for(const i of manifest.icons)assert.ok(fs.existsSync(path.join(ROOT,i.src)));
  const worker=fs.readFileSync(path.join(ROOT,'sw.js'),'utf8'),assets=[...worker.matchAll(/'\.\/([^']*)'/g)].map(m=>m[1]).filter(Boolean);
  for(const asset of assets)assert.ok(fs.existsSync(path.join(ROOT,asset)),asset);
  const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
  for(const [,asset] of html.matchAll(/(?:src|href)="(\.\/[^"]+)"/g)){assert.ok(fs.existsSync(path.join(ROOT,asset)),asset);assert.ok(new URL(asset,'https://example.github.io/militaire/').pathname.startsWith('/militaire/'));}
});
