(() => {
  'use strict';
  const D = window.MILITAIRE_DATA, C = window.MilitaireCore;
  const STORE = 'militaire.progress.v1';
  const $ = selector => document.querySelector(selector);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, x => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
  const icons = {
    practice:'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h8M8 11h5M8 15h3m4 0 2 2 3-4"/>',
    errors:'<path d="M5 7a8 8 0 1 1-1 9M5 3v4H1"/><path d="M12 8v5l3 2"/>',
    dictionary:'<path d="M12 5c-3-2-6-2-10-1v15c4-1 7-1 10 1 3-2 6-2 10-1V4c-4-1-7-1-10 1Zm0 0v15"/>',
    stats:'<path d="M4 20V11m8 9V4m8 16V8M2 21h20"/>',
    settings:'<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3"/><circle cx="16" cy="17" r="3"/>',
    arrow:'<path d="M4 12h15m-5-5 5 5-5 5"/>',
    check:'<path d="m5 12 4 4L19 6"/>',
    write:'<path d="m15 4 5 5M4 20l5-1L21 7a2 2 0 0 0-5-5L4 14Z"/>',
    cards:'<rect x="7" y="3" width="14" height="16" rx="2"/><path d="M4 7H3v14h14v-1m-6-12h6m-6 4h4"/>',
    choice:'<circle cx="5" cy="6" r="2"/><circle cx="5" cy="17" r="2"/><path d="M11 6h10m-10 11h10"/>',
    spark:'<path d="m12 2 2.5 6.5L21 11l-6.5 2.5L12 20l-2.5-6.5L3 11l6.5-2.5L12 2ZM20 18v4m-2-2h4"/>',
    target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    close:'<path d="m6 6 12 12M6 18 18 6"/>',
    sound:'<path d="m11 4-5 4H2v8h4l5 4V4Zm4 4a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
    download:'<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
    upload:'<path d="M12 16V4m-5 5 5-5 5 5M4 16v5h16v-5"/>',
    flame:'<path d="M12 2c2 7 7 7 7 13a7 7 0 0 1-14 0c0-3 1-5 3-7 0 4 2 5 2 5s3-3 2-11Z"/>'
  };
  const icon = (name, cls = '') => `<span class="icon ${cls}" aria-hidden="true"><svg viewBox="0 0 24 24">${icons[name] || icons.cards}</svg></span>`;
  const arrow = icon('arrow');
  const byId = new Map(D.cards.map(c=>[c.id,c]));
  const topic = id => D.sections.find(t=>t.id===id);
  const word = id => C.effective(byId.get(id), state);
  const fmtDate = at => new Date(at).toLocaleDateString('ru-RU', {day:'numeric',month:'short'});
  const fmtTime = at => new Date(at).toLocaleTimeString('ru-RU', {hour:'2-digit',minute:'2-digit'});
  let state = C.fresh(), route = 'practice', dictionarySearch = '', dictionaryTopic = 'all', dictionaryPage = 0, toastTimer;
  let unreadableRaw = null, lastSavedRaw = null, changedInAnotherTab = false;
  try {
    const saved = localStorage.getItem(STORE); lastSavedRaw=saved; unreadableRaw=saved;
    if (saved) {
      const raw = JSON.parse(saved);
      state = C.validateImport({app:'militaire',version:1,state:raw},D.cards);
      const s = raw.session;
      if (s && Array.isArray(s.queue) && s.queue.length && s.queue.every(q=>byId.has(q.id)&&['fr-ru','ru-fr'].includes(q.direction)) && Number.isInteger(s.index) && s.index>=0 && s.index<=s.queue.length && ['choice','write','flash'].includes(s.mode)) {
        state.session = {...s, eventIds: Array.isArray(s.eventIds) ? s.eventIds.filter(id=>state.events.some(e=>e.id===id)) : [], choices: Array.isArray(s.choices) && s.choices.every(x=>typeof x==='string') ? s.choices : null};
        if (s.currentEvent && !state.events.some(e=>e.id===s.currentEvent)) state.session.currentEvent=null;
      }
    }
    unreadableRaw=null;
  } catch (e) { storageWarning('Не удалось прочитать сохранённый прогресс. Исходные данные сохранены в памяти браузера. Скачайте резервную копию в настройках перед новой тренировкой.'); }
  function storageWarning(text) { const el=$('#storage-warning'); el.textContent=text; el.hidden=false; }
  function save() {
    if(changedInAnotherTab){storageWarning('Прогресс изменился в другой вкладке. Эта вкладка не перезапишет его. Скачайте текущую копию при необходимости и обновите страницу.');return;}
    try {
      if(localStorage.getItem(STORE)!==lastSavedRaw){changedInAnotherTab=true;storageWarning('Прогресс изменился в другой вкладке. Обновите эту страницу перед продолжением. Текущие изменения не записаны.');return;}
      if(unreadableRaw!==null){localStorage.setItem(`${STORE}.unreadable-backup`,unreadableRaw);unreadableRaw=null;}
      const serialized=JSON.stringify(state);localStorage.setItem(STORE,serialized);lastSavedRaw=serialized;$('#storage-warning').hidden=true;
    }
    catch { storageWarning('Браузер не смог сохранить прогресс. Не закрывайте вкладку: скачайте прогресс в разделе «Настройки».'); }
  }
  function toast(text) { clearTimeout(toastTimer); $('#toast').textContent=text; $('#toast').classList.add('show'); toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),4000); }
  function changeRoute(next, focus = true) {
    route = next; history.replaceState(null,'',`#${next}`); render();
    if (focus) { window.scrollTo({top:0,behavior:'instant'}); $('#content').focus({preventScroll:true}); }
  }
  function navigation() {
    const active = route === 'session' ? 'practice' : route;
    const pending = Object.keys(state.pending).length;
    $('#navigation').innerHTML = [['practice','Тренировка'],['errors','Мои ошибки'],['dictionary','Словарь'],['stats','Статистика'],['settings','Настройки']].map(([id,label])=>`<a class="nav-item ${active===id?'active':''}" href="#${id}" ${active===id?'aria-current="page"':''}>${icon(id)}<span>${label}</span>${id==='errors' && pending ? `<span class="nav-badge">${pending}</span>`:''}</a>`).join('');
  }
  function connection() { $('#connection').innerHTML=`<span class="status-dot"></span>${navigator.onLine?'Готов к практике':'Без интернета'}`; }
  function heading(eyebrow,title,copy,extra='') { return `<div class="page-heading"><div><div class="eyebrow">${eyebrow}</div><h1>${title}</h1><p class="intro">${copy}</p></div>${extra}</div>`; }
  function metric(label,value,foot,symbol) { return `<div class="metric"><div class="metric-head"><span>${label}</span>${icon(symbol)}</div><div class="metric-value">${value}</div><div class="metric-foot">${foot}</div></div>`; }
  function metrics() {
    const s=C.summary(state);
    return `<div class="stats-strip">${metric('В практике',`${s.touched} <small>/ ${D.cards.length}</small>`,'уникальных карточек','cards')}${metric('Точность',s.accuracy===null?'—':`${s.accuracy}<small>%</small>`,'первые ответы, без исправлений','target')}${metric('На повторение',Object.keys(state.pending).length,'ошибок по направлениям','errors')}${metric('Выучено',s.mastered,'3 верных ответа подряд','check')}</div>`;
  }
  function topicOptions(selected, all='Все темы') { return `<option value="all" ${selected==='all'?'selected':''}>${all}</option>${D.sections.map((t,i)=>`<option value="${t.id}" ${selected===t.id?'selected':''}>${String(i+1).padStart(2,'0')}. ${esc(t.ru)}</option>`).join('')}`; }
  function topicGrid() {
    return `<div class="topic-grid">${D.sections.map((t,i)=>{
      const cards=D.cards.filter(c=>c.topic===t.id), s=C.summary(state,new Set(cards.map(c=>c.id)));
      return `<button class="topic-card" data-topic="${t.id}" aria-label="Тренироваться: ${esc(t.ru)}"><div class="topic-top"><span class="topic-number">THÈME ${String(i+1).padStart(2,'0')}</span><span>${cards.length} карточек</span></div><h3>${esc(t.ru)}</h3><p lang="fr">${esc(t.fr)}</p><div class="progress-track"><span style="width:${s.touched/cards.length*100}%"></span></div><div class="topic-bottom"><span>В практике: ${s.touched} из ${cards.length}</span><span>${s.accuracy===null?'Начать →':`${s.accuracy}% верно`}</span></div></button>`;
    }).join('')}</div>`;
  }
  function practice() {
    const s=C.summary(state), settings=state.settings, pending=Object.keys(state.pending).length;
    const active=state.session && state.session.index<state.session.queue.length;
    return heading('VOTRE PRATIQUE QUOTIDIENNE','Французский по делу.','Слова, выражения и команды. От узнавания — к уверенному переводу.',`<span class="date-stamp">${new Date().toLocaleDateString('ru-RU',{day:'numeric',month:'long',weekday:'short'})}</span>`)
      + (active?`<div class="notice resume"><span>Тренировка на паузе · ${state.session.index} из ${state.session.queue.length} карточек пройдено</span><button class="button small primary" data-action="resume">Продолжить ${arrow}</button></div>`:'')
      + `<div class="dashboard-grid"><section class="training-panel" aria-labelledby="training-title"><div class="panel-head"><h2 id="training-title">Новая тренировка</h2><span class="step-number">À VOUS DE JOUER</span></div><span class="section-label">01 / ФОРМАТ ПРАКТИКИ</span><div class="modes" role="group" aria-label="Формат тренировки">${[['choice','Выбор ответа','Узнать перевод'],['write','Ввод ответа','Вспомнить самому'],['flash','Карточки','Изучить и повторить']].map(([id,name,desc])=>`<button class="mode ${settings.mode===id?'selected':''}" data-mode="${id}" aria-pressed="${settings.mode===id}">${icon(id==='flash'?'cards':id)}<strong>${name}</strong><small>${desc}</small></button>`).join('')}</div><span class="section-label">02 / НАПРАВЛЕНИЕ ПЕРЕВОДА</span><div class="segmented" role="group" aria-label="Направление перевода">${[['fr-ru','FR → RU'],['ru-fr','RU → FR'],['mixed','Вперемешку']].map(([id,label])=>`<button data-direction="${id}" class="${settings.direction===id?'selected':''}" aria-pressed="${settings.direction===id}">${label}</button>`).join('')}</div><div class="settings-row"><label><span class="section-label">03 / ТЕМА</span><select id="training-topic">${topicOptions(settings.topic)}</select></label><label><span class="section-label">04 / ОБЪЁМ</span><select id="training-size">${[10,20,40,'all'].map(n=>`<option value="${n}" ${settings.size===n?'selected':''}>${n==='all'?'Все карточки':`${n} карточек`}</option>`).join('')}</select></label></div><button class="button primary wide" data-action="start"><span>Начать тренировку</span>${arrow}</button><div class="training-foot"><span>Без таймера · в удобном темпе</span><span>${D.cards.length} карточек · 11 тем</span></div></section><aside class="right-stack"><section class="today-card"><div class="eyebrow">ПОНЕМНОГУ КАЖДЫЙ ДЕНЬ</div><h2>Сегодня — ещё шаг.</h2><div class="today-count">${s.today}<span> / 10</span></div><p>${s.today>=10?'Дневная цель достигнута. Отличный повод закрепить результат.':'Десять ответов — маленькая привычка, которая даёт результат.'}</p><div class="progress-track" role="progressbar" aria-label="Ответов сегодня" aria-valuenow="${Math.min(s.today,10)}" aria-valuemin="0" aria-valuemax="10"><span style="width:${Math.min(s.today,10)*10}%"></span></div><div class="today-footer"><span>${icon('flame')} Серия дней</span><strong>${s.streak}</strong></div></section><section class="note-card"><div>${icon('errors')}</div><h3>${pending?'Вернуться к сложному':'Ошибаться — часть учёбы'}</h3><p>${pending?`В списке повторения: ${pending}. Исправьте ответ, чтобы убрать ошибку из очереди.`:'Здесь появятся слова, которым нужно чуть больше внимания.'}</p><button class="text-button" data-nav="errors">Работа над ошибками ${arrow}</button></section></aside></div>`
      + metrics()+`<section><div class="section-head"><h2>Словарь по темам</h2><span class="subtle-count">11 тем / 4 страницы PDF</span></div>${topicGrid()}</section>`;
  }
  function empty(title,copy,button='К тренировке',action='practice') { return `<div class="empty">${icon('spark')}<h2>${title}</h2><p>${copy}</p><button class="button primary" data-nav="${action}">${button} ${arrow}</button></div>`; }
  function dictionary() {
    const needle=C.normalize(dictionarySearch);
    const filtered=D.cards.map(c=>word(c.id)).filter(c=>(dictionaryTopic==='all'||dictionaryTopic===c.topic)&&(!needle||[c.fr,c.ru,...c.frAlt,...c.ruAlt].some(v=>C.normalize(v).includes(needle))));
    const pages=Math.max(1,Math.ceil(filtered.length/30)); dictionaryPage=Math.min(dictionaryPage,pages-1);
    return heading('LE VOCABULAIRE','Слова под рукой.',`${D.cards.length} карточек из PDF. Смотрите варианты перевода и редактируйте словарь.`)
    +`<div class="toolbar"><label class="sr-only" for="dictionary-search">Найти слово или перевод</label><input type="search" id="dictionary-search" placeholder="Найти слово или перевод…" value="${esc(dictionarySearch)}"><label class="sr-only" for="dictionary-topic">Тема словаря</label><select id="dictionary-topic">${topicOptions(dictionaryTopic)}</select></div><div class="section-head"><span class="subtle-count">Найдено: ${filtered.length}</span><span class="subtle-count">Французский / русский</span></div>`
    +(filtered.length?`<div class="list">${filtered.slice(dictionaryPage*30,dictionaryPage*30+30).map(c=>`<article class="word-row"><div class="word-fr" lang="fr">${esc(c.fr)}${c.frAlt.length?`<div class="word-alts">Также: ${c.frAlt.map(esc).join(' · ')}</div>`:''}<div class="word-meta">${esc(topic(c.topic).ru)} · стр. ${c.page}${state.custom[c.id]?' · изменено вами':''}</div></div><div class="word-ru">${esc(c.ru)}${c.ruAlt.length?`<div class="word-alts">Также: ${c.ruAlt.map(esc).join(' · ')}</div>`:''}</div><button class="icon-button" data-edit="${c.id}" aria-label="Редактировать ${esc(c.fr)}">${icon('write')}</button>${c.note?`<div class="word-note">${esc(c.note)}</div>`:''}</article>`).join('')}</div><div class="pager"><button class="button secondary small" data-page="-1" ${dictionaryPage===0?'disabled':''}>← Назад</button><span>${dictionaryPage+1} / ${pages}</span><button class="button secondary small" data-page="1" ${dictionaryPage>=pages-1?'disabled':''}>Далее →</button></div>`:empty('Ничего не нашлось.','Попробуйте другое слово или выберите все темы.','К тренировке'));
  }
  function errors() {
    const pending=Object.values(state.pending).sort((a,b)=>b.at-a.at);
    return heading('ON RECOMMENCE','Ещё одна попытка.', 'Исправьте перевод, чтобы убрать слово из списка повторения.',pending.length?`<button class="button primary" data-action="train-errors">Повторить все ${arrow}</button>`:'')
    +(pending.length?`<div class="notice">Первоначальный ответ остаётся в статистике. После верного повторения ошибка получает отметку «исправлено». Здесь направления FR → RU и RU → FR учитываются отдельно.</div><div class="list">${pending.map(p=>{
      const c=word(p.cardId), side=C.sides(c,p.direction), e=state.events.find(e=>e.id===p.eventId);
      return `<article class="error-row"><div class="error-header"><h3 lang="${side.promptLang}">${esc(side.prompt)}</h3><span class="pill amber">${p.direction==='fr-ru'?'FR → RU':'RU → FR'}</span></div><div class="error-answer"><div><span class="answer-label">ВАШ ОТВЕТ</span><span class="bad-answer">${esc(e?.response || 'Не вспомнил')}</span></div><div><span class="answer-label">ВЕРНЫЙ ПЕРЕВОД</span><span class="good-answer" lang="${side.answerLang}">${esc(side.answer)}</span></div></div><div class="error-footer"><span class="word-meta">${esc(topic(c.topic).ru)} · ${fmtDate(p.at)}</span><button class="button secondary small" data-error="${esc(C.keyFor(p.cardId,p.direction))}">Исправить ${arrow}</button></div></article>`;
    }).join('')}</div>`:empty('Всё чисто.','Сейчас нет ошибок для повторения. После тренировки здесь появятся слова, которые пока не получилось вспомнить.'));
  }
  function stats() {
    const s=C.summary(state), now=new Date(); const days=[];
    for(let i=6;i>=0;i--){const d=new Date(now);d.setDate(d.getDate()-i); const date=C.localDate(d.getTime()); days.push({date,day:d.toLocaleDateString('ru-RU',{weekday:'short'}),label:fmtDate(d.getTime()),count:state.events.filter(e=>C.localDate(e.at)===date).length});}
    const max=Math.max(10,...days.map(d=>d.count));
    return heading('VOS PROGRÈS','Прогресс в деталях.','Каждая попытка сохраняется. Исправления помогают учиться и не стирают историю.',`<button class="button secondary" data-action="export">${icon('download')} Скачать прогресс</button>`)
    +metrics()+`<section class="chart-panel"><div class="section-head"><h2>Практика за 7 дней</h2><span class="subtle-count">${s.total} ответов за всё время</span></div><div class="chart" role="img" aria-label="${esc(days.map(d=>`${d.label}: ${d.count} ответов`).join('; '))}">${days.map((d,i)=>`<div class="chart-day ${i===6?'today':''}" aria-hidden="true"><span>${d.count}</span><div class="chart-bar" style="height:${Math.max(3,d.count/max*100)}px"></div><span>${d.day}</span><small>${d.label}</small></div>`).join('')}</div></section><div class="notice">Точность: ${s.correct} верных из ${s.total} первых ответов на задания. Исправлено ошибок: ${s.fixed}. В режиме карточек результат основан на вашей оценке. «Выучено» — три последних ответа на карточку верны и нет открытых ошибок.</div><section><div class="section-head"><h2>Прогресс по темам</h2></div>${topicGrid()}</section><section class="table-section"><div class="section-head"><h2>Последние ответы</h2><span class="subtle-count">До 50 последних попыток</span></div>${state.events.length?`<div class="history-wrap"><table class="history-table"><thead><tr><th>Когда</th><th>Карточка / ваш ответ</th><th>Формат</th><th>Результат</th></tr></thead><tbody>${state.events.slice(-50).reverse().map(e=>{
      const c=word(e.cardId),side=C.sides(c,e.direction);
      return `<tr><td>${fmtDate(e.at)}<br>${fmtTime(e.at)}</td><td><span lang="${side.promptLang}">${esc(side.prompt)}</span><div class="muted">${esc(e.response||'Не вспомнил')}</div></td><td>${{choice:'Выбор',write:'Ввод',flash:'Карточки'}[e.mode]}<br><span class="word-meta">${e.direction==='fr-ru'?'FR → RU':'RU → FR'}</span></td><td><span class="pill ${e.correct?'':e.corrected?'amber':'red'}">${e.correct?(e.acceptedByUser?'Зачтено вами':'Верно'):e.corrected?'Исправлено':'Ошибка'}</span></td></tr>`;
    }).join('')}</tbody></table></div>`:empty('История начинается с практики.','Пройдите первую тренировку — здесь появятся ваши ответы.')}}</section>`;
  }
  function settingsPage() {
    return heading('VOTRE CARNET','Подстроить под себя.','Проверка ответов, резервные копии и запуск на других устройствах.')
    +`<section class="settings-panel"><h2>Как проверять ответы</h2><label class="check-row"><input type="checkbox" id="strict-accents" ${state.settings.strict?'checked':''}><span>Строго учитывать французские диакритические знаки<small>Например, é и e считаются разными. По умолчанию акценты не мешают зачесть ответ.</small></span></label><p>Регистр, пунктуация и вид апострофа не учитываются. Варианты рода и перевода из словаря принимаются. Если ваш синоним не принят, нажмите «Мой ответ тоже верный» или добавьте его в словаре.</p></section>
    <section class="settings-panel"><h2>Прогресс между устройствами</h2><p>Статистика хранится в этом браузере на этом устройстве. GitHub Pages публикует сайт, но не синхронизирует данные. Скачайте прогресс на одном устройстве и загрузите этот файл на другом.</p><div class="button-row"><button class="button primary" data-action="export">${icon('download')} Скачать прогресс</button><label class="button secondary" for="import-file">${icon('upload')} Загрузить прогресс</label><input type="file" id="import-file" accept=".json,application/json" hidden></div><p class="small-copy">Файл включает историю, ошибки, ваши правки словаря и настройки. Импорт заменяет текущие данные после подтверждения. Перед заменой можно скачать резервную копию. Передавайте файл заново, когда хотите обновить прогресс на другом устройстве.</p><button class="text-button" data-action="raw-export">Скачать исходные данные браузера</button></section>
    <section class="settings-panel"><h2>Открывать с телефона через GitHub</h2><ol class="help-steps"><li>Создайте публичный репозиторий, например <code>militaire</code>.</li><li>Загрузите в него <strong>содержимое папки militaire</strong>. Файл <code>index.html</code> должен лежать в корне репозитория. Исходный PDF загружать не требуется.</li><li>Откройте <strong>Settings → Pages</strong>. В Source выберите <strong>Deploy from a branch</strong>, ветку <strong>main</strong> и папку <strong>/ (root)</strong>. Нажмите Save.</li><li>Дождитесь завершения публикации. Адрес появится в Pages: <code>https://ваш-логин.github.io/militaire/</code>. Откройте его с телефона и компьютера.</li><li>На телефоне добавьте сайт на главный экран через меню браузера. После первого успешного открытия по HTTPS сайт может работать без интернета.</li></ol><p class="small-copy">Полная инструкция — в README.md. Публикация пока не выполнена: эти шаги нужно сделать в вашем GitHub. <a href="https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site" target="_blank" rel="noopener">Инструкция GitHub Pages ↗</a></p></section>
    <section class="settings-panel"><h2>О словаре</h2><p>Все 11 тем и все 4 страницы VOCABULAIRE MILITAIRE.pdf: ${D.cards.length} карточек. Варианты через «/» разделены на самостоятельные выражения; для форм рода и синонимов добавлены допустимые ответы. Повтор выражения «la veille des exercices» сохранён в обеих темах исходника.</p><p>Исправлены пробелы и явные опечатки. Добавлен отсутствующий перевод «égoïste». Для «Respectez les ordres !» сохранён перевод из PDF и добавлен буквальный. Такие изменения отмечены в карточках. Устойчивые выражения проверяются по перечисленным вариантам, поэтому произвольный смысловой перевод может потребовать добавления в словарь.</p></section>
    <section class="settings-panel danger-zone"><h2>Очистить историю практики</h2><p>Удалит статистику, список ошибок и текущую тренировку на этом устройстве. Ваши правки словаря и настройки сохранятся.</p><button class="button danger" data-action="reset">Очистить прогресс…</button></section>`;
  }
  function newSession(errorsOnly=false, single=null) {
    const settings={...state.settings};
    if(errorsOnly){settings.topic='all';settings.direction='mixed';settings.size='all';settings.mode='write';}
    const queue=single?[{id:single.cardId,direction:single.direction}]:C.makeQueue(D.cards,state,settings,errorsOnly);
    if(!queue.length){toast('В выбранном наборе пока нет карточек.');return;}
    state.session={queue,index:0,mode:single?'write':settings.mode,strict:settings.strict,errorsOnly,flipped:false,eventIds:[],currentEvent:null,choices:null,startedAt:Date.now()};
    save();changeRoute('session');
  }
  function startSafely(errorsOnly=false,single=null) {
    if (state.session && state.session.index<state.session.queue.length) {
      modal('Начать новую тренировку?',`<p>Текущая очередь будет заменена. Уже записанные ответы и ошибки сохранятся.</p><div class="button-row"><button class="button secondary" data-dialog-close>Остаться</button><button class="button primary" id="confirm-new-session">Начать новую</button></div>`);
      $('#confirm-new-session').onclick=()=>{closeModal();newSession(errorsOnly,single);};
    } else newSession(errorsOnly,single);
  }
  function current() {
    const s=state.session;if(!s||s.index>=s.queue.length)return null;
    const q=s.queue[s.index],card=word(q.id),side=C.sides(card,q.direction),event=state.events.find(e=>e.id===s.currentEvent);
    return {s,q,card,side,event};
  }
  function sessionPage() {
    const s=state.session;
    if(!s)return empty('Начнём с небольшой практики.','Выберите формат и тему для первой тренировки.');
    if(s.index>=s.queue.length)return resultPage();
    const {q,card,side,event}=current();
    if(s.mode==='choice'&&!s.choices){s.choices=C.options(card,q.direction,D.cards.map(c=>word(c.id)));save();}
    const completed=s.index+(event?1:0);
    let task='';
    if(!event) {
      if(s.mode==='choice')task=`<div class="choices">${s.choices.map((v,i)=>`<button class="choice" data-choice="${i}" lang="${side.answerLang}"><span class="choice-number">${i+1}</span><span>${esc(v)}</span></button>`).join('')}</div>`;
      if(s.mode==='write')task=`<form id="answer-form" class="answer-form"><label class="sr-only" for="answer-input">${side.answerLang==='fr'?'Ответ по-французски':'Ответ по-русски'}</label><input id="answer-input" type="text" lang="${side.answerLang}" autocomplete="off" autocapitalize="off" spellcheck="false" maxlength="2000" placeholder="${side.answerLang==='fr'?'Votre réponse…':'Ваш перевод…'}" enterkeyhint="done" required>${side.answerLang==='fr'?accentKeyboard('answer-input'):''}<button class="button primary" type="submit">Проверить ответ ${arrow}</button></form>`;
      if(s.mode==='flash')task=s.flipped?`<div class="flash-answer"><span class="lang-label">${side.answerLang==='fr'?'FRANÇAIS':'РУССКИЙ'}</span><div class="prompt" lang="${side.answerLang}">${esc(side.answer)}</div>${side.accepted.length>1?`<p class="question-hint">Также: ${side.accepted.slice(1).map(esc).join(' · ')}</p>`:''}<div class="button-row"><button class="button secondary" data-action="flash-no">${icon('errors')} Повторить</button><button class="button primary" data-action="flash-yes">${icon('check')} Знаю</button></div></div>`:`<button class="button primary" data-action="flip">Показать перевод ${arrow}</button>`;
      if(s.mode!=='flash')task+=`<div class="answer-actions"><button class="button ghost" data-action="skip">Не помню</button><span class="small-copy">${s.mode==='choice'?'Выберите один вариант':'Принимаются варианты из словаря'}</span></div>`;
    }
    return `<div class="practice-shell"><div class="session-top"><button class="button ghost" data-nav="practice">← На главную</button><span>${s.errorsOnly?'Работа над ошибками':'Тренировка'} · ${s.index+1} / ${s.queue.length}</span></div><div class="session-progress" role="progressbar" aria-label="Пройдено карточек" aria-valuenow="${completed}" aria-valuemin="0" aria-valuemax="${s.queue.length}"><span style="width:${completed/s.queue.length*100}%"></span></div><section class="question-card" aria-label="Карточка тренировки"><div class="question-meta"><span>${esc(topic(card.topic).ru)}</span><span>${q.direction==='fr-ru'?'FR → RU':'RU → FR'} · ${s.mode==='choice'?'Выбор':s.mode==='write'?'Ввод':'Карточки'}</span></div><span class="lang-label">${side.promptLang==='fr'?'FRANÇAIS':'РУССКИЙ'}</span><div class="prompt ${side.promptLang==='ru'?'russian':''}" lang="${side.promptLang}">${esc(side.prompt)}</div><p class="question-hint">${s.mode==='flash'?'Вспомните перевод и проверьте себя.':side.answerLang==='fr'?'Как это сказать по-французски?':'Как это перевести на русский?'}</p>${task}${event?feedback(card,side,event):''}</section><div class="session-bottom"><span>${icon('sound')} <button class="text-button" data-speak="${card.id}">Послушать французский</button></span><span>${s.mode==='write'?(s.strict?'Акценты учитываются':'Акценты можно опускать'):'Без таймера'} · стр. ${card.page}</span></div></div>`;
  }
  function accentKeyboard(target) {return `<div class="accent-keys" role="group" aria-label="Французские знаки">${['é','è','ê','ë','à','â','ç','î','ï','ô','ù','û','œ','’'].map(c=>`<button type="button" data-accent="${c}" data-target="${target}" aria-label="Вставить ${c}">${c}</button>`).join('')}</div>`;}
  function feedback(card,side,event) {
    const fixed=event.corrected;
    return `<div class="feedback ${event.correct||fixed?'':'wrong'}" role="status"><div class="feedback-title">${icon(event.correct||fixed?'check':'errors')}${event.correct?'Верно!':fixed?'Ошибка исправлена.':'Пока не получилось.'}</div>${!event.correct?`<p>Ваш ответ: <strong>${esc(event.response||'Не вспомнил')}</strong></p>`:''}<div class="expected" lang="${side.answerLang}">${esc(side.answer)}</div>${side.accepted.length>1?`<p class="alternates">Также принимается: ${side.accepted.slice(1).map(esc).join(' · ')}</p>`:''}${card.note?`<p class="alternates">${esc(card.note)}</p>`:''}${!event.correct&&!fixed?`<p>Посмотрите на перевод и введите его ещё раз, чтобы закрепить.</p><div id="correction-area"></div>`:''}<div class="feedback-actions"><button class="button primary" data-action="next">${state.session.index===state.session.queue.length-1?'Завершить':'Следующая'} ${arrow}</button>${!event.correct&&!fixed?`<button class="button secondary" data-action="retry">Исправить сейчас</button>${event.mode==='write'&&event.response?'<button class="text-button" data-action="accept">Мой ответ тоже верный</button>':''}`:''}</div>${fixed?'<p class="alternates">Первоначальная ошибка сохранена в статистике.</p>':''}</div>`;
  }
  function answer(response, selfCorrect=null) {
    const cur=current();if(!cur||cur.event)return;
    const {s,q,card}=cur;
    const correct=selfCorrect===null?C.matches(response,card,q.direction,s.strict):selfCorrect;
    const e=C.record(state,card,q.direction,correct,response,s.mode);
    s.currentEvent=e.id;s.eventIds.push(e.id);save();render();
    $('.feedback')?.scrollIntoView({block:'nearest',behavior:'smooth'});
    $('[data-action="next"]')?.focus({preventScroll:true});
  }
  function resultPage() {
    const s=state.session,events=s.eventIds.map(id=>state.events.find(e=>e.id===id)).filter(Boolean),good=events.filter(e=>e.correct).length,fixed=events.filter(e=>!e.correct&&e.corrected).length;
    const sessionKeys=new Set(events.map(e=>C.keyFor(e.cardId,e.direction)));
    const left=Object.keys(state.pending).filter(k=>sessionKeys.has(k)).length;
    return `<div class="practice-shell"><div class="result-card"><div class="result-seal">${icon('check')}</div><div class="eyebrow">BIEN JOUÉ</div><h1>Ещё немного увереннее.</h1><p class="intro">${left?'Вернитесь к сложным словам, пока они свежи в памяти.':'Эта тренировка завершена. Прогресс сохранён на устройстве.'}</p><div class="result-metrics"><div><strong>${events.length?Math.round(good/events.length*100):0}%</strong><span>точность</span></div><div><strong>${good} / ${events.length}</strong><span>верно с первого раза</span></div><div><strong>${fixed}</strong><span>ошибок исправлено</span></div></div><p class="small-copy">${left?`В этой тренировке осталось ошибок: ${left}.`:'Ошибок из этой тренировки в очереди нет.'} ${s.mode==='flash'?'Результат карточек основан на вашей самооценке.':''}</p><div class="button-row">${Object.keys(state.pending).length?`<button class="button primary" data-action="train-errors">Повторить ошибки ${arrow}</button>`:''}<button class="button ${Object.keys(state.pending).length?'secondary':'primary'}" data-nav="practice">Новая тренировка</button><button class="button secondary" data-nav="stats">Статистика</button></div></div></div>`;
  }
  function render() {
    navigation();connection();
    const pages={practice,errors,dictionary,stats,settings:settingsPage,session:sessionPage};
    $('#content').innerHTML=(pages[route]||practice)();
    document.title=`${{practice:'Тренировка',errors:'Мои ошибки',dictionary:'Словарь',stats:'Статистика',settings:'Настройки',session:'Практика'}[route]||'Французский'} · Militaire`;
  }
  function modal(title,html) { const d=$('#dialog'); d.innerHTML=`<div class="dialog-header"><h2 id="dialog-title">${title}</h2><button class="icon-button" data-dialog-close aria-label="Закрыть">${icon('close')}</button></div><div class="dialog-form">${html}</div>`; if(!d.open)d.showModal(); }
  function closeModal(){ $('#dialog').close(); }
  function editCard(id) {
    const c=word(id);
    modal('Редактировать карточку',`<form id="edit-form"><p class="source">${esc(topic(c.topic).ru)} · PDF, стр. ${c.page}. Правки сохраняются только в вашем браузере и в файле экспорта.</p><label for="edit-fr">Французский</label><input type="text" id="edit-fr" value="${esc(c.fr)}" lang="fr" maxlength="2000" required><label for="edit-ru">Русский перевод</label><input type="text" id="edit-ru" value="${esc(c.ru)}" maxlength="2000" required><label for="edit-fr-alt">Другие допустимые ответы по-французски — каждый с новой строки</label><textarea id="edit-fr-alt" lang="fr">${esc(c.frAlt.join('\n'))}</textarea><label for="edit-ru-alt">Другие допустимые ответы по-русски — каждый с новой строки</label><textarea id="edit-ru-alt">${esc(c.ruAlt.join('\n'))}</textarea><label for="edit-note">Примечание</label><textarea id="edit-note" maxlength="2000">${esc(c.note)}</textarea><div class="button-row">${state.custom[id]?'<button class="button secondary" type="button" id="restore-card">Вернуть исходную</button>':''}<button type="button" class="button secondary" data-dialog-close>Отмена</button><button class="button primary" type="submit">Сохранить</button></div><p class="validation" id="edit-error" role="alert"></p></form>`);
    $('#edit-form').onsubmit=e=>{
      e.preventDefault();
      const fr=$('#edit-fr').value.trim(),ru=$('#edit-ru').value.trim();
      const alts=sel=>[...new Set($(sel).value.split('\n').map(x=>x.trim()).filter(Boolean))];
      const frAlt=alts('#edit-fr-alt'),ruAlt=alts('#edit-ru-alt');
      if(!fr||!ru||[frAlt,ruAlt].some(a=>a.length>100||a.some(v=>v.length>2000))){$('#edit-error').textContent='Заполните обе стороны. Не более 100 вариантов, до 2000 символов каждый.';return;}
      state.custom[id]={fr,ru,frAlt,ruAlt,note:$('#edit-note').value.trim()};
      // Reset the choices for a paused question after its dictionary entry changes.
      if(state.session)state.session.choices=null;
      save();closeModal();render();toast('Карточка сохранена.');
    };
    if($('#restore-card'))$('#restore-card').onclick=()=>{delete state.custom[id];if(state.session)state.session.choices=null;save();closeModal();render();toast('Исходная карточка восстановлена.');};
  }
  function download(filename,text) {
    const url=URL.createObjectURL(new Blob([text],{type:'application/json;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
  }
  function exportProgress() { download(`militaire-progress-${C.localDate()}.json`,JSON.stringify({app:'militaire',version:1,exportedAt:new Date().toISOString(),state:{...state,session:null}},null,2));toast('Файл прогресса подготовлен.'); }
  async function importProgress(file) {
    if(!file)return;
    try{
      if(file.size>20000000)throw Error('Файл слишком большой. Максимум — 20 МБ.');
      const incoming=C.validateImport(JSON.parse(await file.text()),D.cards),summary=C.summary(incoming);
      modal('Загрузить прогресс?',`<p>В файле: <strong>${summary.total} ответов</strong>, ${Object.keys(incoming.pending).length} ошибок и ${Object.keys(incoming.custom).length} изменённых карточек.</p><p>Загрузка заменит историю, правки словаря и настройки в этом браузере. Текущая тренировка будет завершена.</p><div class="button-row"><button class="button secondary" data-action="export">Скачать текущий</button><button class="button secondary" data-dialog-close>Отмена</button><button class="button primary" id="confirm-import">Заменить прогресс</button></div>`);
      $('#confirm-import').onclick=()=>{state=incoming;save();closeModal();changeRoute('stats');toast('Прогресс загружен.');};
    }catch(error){modal('Не удалось загрузить файл',`<p>${esc(error.message)}</p><div class="button-row"><button class="button secondary" data-dialog-close>Понятно</button></div>`);}
  }
  function showRetry() {
    const cur=current();if(!cur?.event||cur.event.correct||cur.event.corrected)return;
    const {side}=cur;
    $('#correction-area').innerHTML=`<form id="correction-form" class="correction-block"><label for="correction-input">Повторите верный перевод ${side.answerLang==='fr'?'по-французски':'по-русски'}</label><input type="text" id="correction-input" autocomplete="off" autocapitalize="off" spellcheck="false" maxlength="2000" lang="${side.answerLang}" enterkeyhint="done" required>${side.answerLang==='fr'?accentKeyboard('correction-input'):''}<button class="button secondary small" type="submit">Проверить исправление</button><p id="correction-error" class="validation" role="alert"></p></form>`;
    $('#correction-form').onsubmit=e=>{e.preventDefault();const v=$('#correction-input').value;
      if(C.matches(v,cur.card,cur.q.direction,cur.s.strict)){C.correctMistake(state,cur.event);save();render();toast('Исправлено. Слово убрано из очереди ошибок.');$('[data-action="next"]')?.focus({preventScroll:true});}
      else {$('#correction-error').textContent='Пока не совпадает. Проверьте перевод выше и попробуйте ещё раз.';$('#correction-input').focus();}
    };$('#correction-input').focus();
  }
  function acceptAnswer() {
    const cur=current();if(!cur?.event||cur.event.correct)return;
    modal('Принять ваш вариант?',`<p>Ваш ответ <strong>«${esc(cur.event.response)}»</strong> станет допустимым переводом для этой карточки. Текущая попытка будет засчитана как верная.</p><p>Эта кнопка предназначена для синонимов и равнозначных переводов. Обычную ошибку лучше исправить повторным вводом.</p><div class="button-row"><button class="button secondary" data-dialog-close>Отмена</button><button class="button primary" id="confirm-accept">Добавить вариант и зачесть</button></div>`);
    $('#confirm-accept').onclick=()=>{C.acceptAlternative(state,cur.event,cur.card);save();closeModal();render();toast('Вариант добавлен в словарь. Ответ зачтён.');};
  }
  function speak(id) {
    if(!('speechSynthesis' in window)){toast('В этом браузере озвучивание недоступно.');return;}
    speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(word(id).fr);u.lang='fr-FR';u.rate=.85;
    const voice=speechSynthesis.getVoices().find(v=>v.lang.startsWith('fr'));if(voice)u.voice=voice;
    u.onerror=()=>toast('Не удалось озвучить. Проверьте наличие французского голоса в браузере.');speechSynthesis.speak(u);
  }
  document.addEventListener('click',e=>{
    const b=e.target.closest('button,a,[data-action]');if(!b||b.disabled)return;
    if(b.hasAttribute('data-dialog-close')){closeModal();return;}
    if(b.matches('a[href^="#"]')){
      const destination=b.hash.slice(1);
      if(['practice','errors','dictionary','stats','settings','session'].includes(destination)){e.preventDefault();changeRoute(destination);}
      return;
    }
    if(b.dataset.nav){changeRoute(b.dataset.nav);return;}
    if(b.dataset.mode){state.settings.mode=b.dataset.mode;save();render();return;}
    if(b.dataset.direction){state.settings.direction=b.dataset.direction;save();render();return;}
    if(b.dataset.topic){state.settings.topic=b.dataset.topic;save();changeRoute('practice');$('.training-panel')?.scrollIntoView({block:'start',behavior:'smooth'});return;}
    if(b.dataset.edit){editCard(b.dataset.edit);return;}
    if(b.dataset.error){const p=state.pending[b.dataset.error];if(p)startSafely(true,p);return;}
    if(b.dataset.page){dictionaryPage+=Number(b.dataset.page);render();window.scrollTo({top:0,behavior:'instant'});return;}
    if(b.dataset.choice!==undefined){const cur=current();if(cur?.s.mode==='choice'&&!cur.event)answer(cur.s.choices[Number(b.dataset.choice)]);return;}
    if(b.dataset.speak){speak(b.dataset.speak);return;}
    if(b.dataset.accent){const input=document.getElementById(b.dataset.target);if(!input)return;const start=input.selectionStart??input.value.length,end=input.selectionEnd??start;input.setRangeText(b.dataset.accent,start,end,'end');input.focus();return;}
    switch(b.dataset.action){
      case 'start':startSafely();break;
      case 'resume':changeRoute('session');break;
      case 'train-errors':startSafely(true);break;
      case 'flip':if(current()){state.session.flipped=true;save();render();}break;
      case 'flash-yes':answer('Знаю (самооценка)',true);break;
      case 'flash-no':answer('Нужно повторить (самооценка)',false);break;
      case 'skip':answer('',false);break;
      case 'next':if(current()?.event){state.session.index++;state.session.currentEvent=null;state.session.choices=null;state.session.flipped=false;save();render();window.scrollTo({top:0,behavior:'instant'});$('#content').focus({preventScroll:true});}break;
      case 'retry':showRetry();break;
      case 'accept':acceptAnswer();break;
      case 'export':exportProgress();break;
      case 'raw-export':try{download('militaire-browser-backup.json',unreadableRaw??localStorage.getItem(`${STORE}.unreadable-backup`)??localStorage.getItem(STORE)??'{}');toast('Исходная копия подготовлена.');}catch{toast('Хранилище браузера недоступно.');}break;
      case 'reset':modal('Очистить прогресс?',`<p>Будут удалены все ${state.events.length} ответов, список ошибок и текущая тренировка. Правки словаря и настройки останутся.</p><div class="button-row"><button class="button secondary" data-action="export">Скачать копию</button><button class="button secondary" data-dialog-close>Отмена</button><button class="button danger" id="confirm-reset">Удалить историю</button></div>`);$('#confirm-reset').onclick=()=>{state.events=[];state.pending={};state.session=null;save();closeModal();render();toast('История практики очищена.');};break;
    }
  });
  document.addEventListener('submit',e=>{if(e.target.id==='answer-form'){e.preventDefault();const input=$('#answer-input');if(input.value.trim())answer(input.value.trim());}});
  document.addEventListener('change',e=>{
    switch(e.target.id){
      case 'training-topic':state.settings.topic=e.target.value;save();break;
      case 'training-size':state.settings.size=e.target.value==='all'?'all':Number(e.target.value);save();break;
      case 'dictionary-topic':dictionaryTopic=e.target.value;dictionaryPage=0;render();break;
      case 'strict-accents':state.settings.strict=e.target.checked;save();toast(state.settings.strict?'Акценты учитываются в новых тренировках.':'В новых тренировках акценты можно опускать.');break;
      case 'import-file':importProgress(e.target.files[0]);e.target.value='';break;
    }
  });
  document.addEventListener('input',e=>{
    if(e.target.id==='dictionary-search'){
      const input=e.target,position=input.selectionStart;dictionarySearch=input.value;dictionaryPage=0;render();$('#dictionary-search').focus();try{$('#dictionary-search').setSelectionRange(position,position);}catch{}
    }
  });
  document.addEventListener('keydown',e=>{
    if(route!=='session'||$('#dialog').open||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)||e.ctrlKey||e.altKey||e.metaKey)return;
    const cur=current();if(!cur)return;
    if(!cur.event&&cur.s.mode==='choice'&&/^[1-4]$/.test(e.key)){e.preventDefault();const option=cur.s.choices[Number(e.key)-1];if(option)answer(option);}
  });
  window.addEventListener('hashchange',()=>{const next=location.hash.slice(1);if(['practice','errors','dictionary','stats','settings','session'].includes(next))changeRoute(next);});
  window.addEventListener('online',connection);window.addEventListener('offline',connection);
  window.addEventListener('storage',e=>{if(e.key===STORE||e.key===null){changedInAnotherTab=true;storageWarning('Прогресс изменился в другой вкладке. Эта вкладка не перезапишет его. Обновите страницу перед продолжением.');}});
  route=['practice','errors','dictionary','stats','settings','session'].includes(location.hash.slice(1))?location.hash.slice(1):'practice';render();
  if('serviceWorker' in navigator && ['https:','http:'].includes(location.protocol)) {
    window.addEventListener('load',()=>{navigator.serviceWorker.register('./sw.js').catch(()=>{});});
  }
})();
