/* Raider Labs Lesson Kit v1 (Nov 19, 2026) · RJ Ed Tech
   The shared pieces of the Raider Labs lesson model (see README.md):
     LK.setup      page id, saved state, GoatCounter events
     LK.supports   🔊 Read aloud and Aa Easier reading (shared Raider Labs settings)
     LK.path       "How do you want to start?" mystery or just the lesson
     LK.confused   help-first "This confused me" (help, then an anonymous reason)
     LK.num/check  number-only answer boxes and checking
     LK.strip      road map strip: the problem's own numbers at each station
     LK.bars       before/after bars (weight, money, distance...)
     LK.stepper    step-through animation: Play, Play again, reduced-motion stepping
     LK.whyCare    a short "Why care?" right after a hard idea
     LK.world      "How this changes the world" cards
     LK.test       Test yourself: one question at a time, hint first, best score saved
     LK.balance    finds questions where the right answer is the longest choice
   No libraries, no cookies, no personal data. Events send only a path such as
   confused/ChemLab/stoichiometry/practice/step2 and an optional /why-<reason>. */
(function(){
'use strict';
const LK=window.LK={version:'1.0'};
const cfg={site:'Lab',page:'lesson',key:'raider-lesson'};
let S={};

/* ---------- small helpers ---------- */
LK.esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const esc=LK.esc;
const $=(sel,root=document)=>root.querySelector(sel);
const el=(x)=>typeof x==='string'?document.querySelector(x):x;
const slug=s=>String(s||'').toLowerCase().normalize('NFKD').replace(/[^\w\s/-]/g,'').trim().replace(/\s+/g,'-').slice(0,60);
LK.slug=slug;
const RM=()=>!!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches);
LK.reducedMotion=RM;

/* ---------- setup, state, events ---------- */
LK.setup=function(o){Object.assign(cfg,o||{});try{S=JSON.parse(localStorage.getItem(cfg.key)||'{}')||{}}catch(e){S={}}return S};
LK.state=()=>S;
LK.save=function(){try{localStorage.setItem(cfg.key,JSON.stringify(S))}catch(e){}};
/* The current part of the page, used in event paths. Pages with hash routing pass their own. */
LK.where=()=>slug((location.hash||'#start').slice(1).split(/[=@?&]/)[0])||'start';
LK.event=function(full,title){
  (function go(n){const g=window.goatcounter;if(g&&typeof g.count==='function'){try{g.count({path:full,title:title||full,event:true})}catch(e){}}else if(n<40)setTimeout(()=>go(n+1),250)})(0)};
/* Event paths keep the lab's own capitals (confused/ChemLab/...), matching the paths the existing lessons send. */
const evPath=(...p)=>p.filter(Boolean).map(x=>String(x).normalize('NFKD').replace(/[^\w/-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,60)).join('/');

/* ---------- Read aloud + Easier reading ---------- */
const SS=window.speechSynthesis,CAN=!!(SS&&typeof SpeechSynthesisUtterance!=='undefined');
const gk=k=>{try{return localStorage.getItem(k)==='on'}catch(e){return false}},pk=(k,v)=>{try{localStorage.setItem(k,v?'on':'off')}catch(e){}};
let raOn=CAN&&gk('raider-labs-readaloud'),easy=gk('raider-labs-easyread'),voice=null;
function pickVoice(){if(!CAN)return;const vs=SS.getVoices()||[];const en=vs.filter(v=>/^en(-|_)?US/i.test(v.lang));const pool=en.length?en:vs.filter(v=>/^en/i.test(v.lang));voice=pool.find(v=>/natural|online|neural|premium|enhanced/i.test(v.name))||null}
/* Turns symbols into words a voice can read: subscripts, g/mol, ×, ÷, →. */
LK.speakable=t=>String(t).replace(/\s+/g,' ')
  .replace(/[₀-₉]/g,c=>String('₀₁₂₃₄₅₆₇₈₉'.indexOf(c)))
  .replace(/g\/mol/g,'grams per mole').replace(/m\/s²/g,'meters per second squared').replace(/m\/s/g,'meters per second')
  .replace(/(\d)\s*%/g,'$1 percent').replace(/(\d) g\b/g,'$1 grams').replace(/\bmol\b/g,'moles')
  .replace(/÷/g,' divided by ').replace(/×/g,' times ').replace(/→/g,' to ').replace(/≈/g,' about ').replace(/[✓🔒😕🔊🔎📘⚖️🔢▶⟲]/g,'').replace(/\s+/g,' ').trim();
LK.say=function(t){if(!CAN||!voice||!raOn||!t)return;SS.cancel();(LK.speakable(t).match(/[^.!?]+[.!?]*/g)||[t]).forEach(p=>{const u=new SpeechSynthesisUtterance(p.trim());u.voice=voice;u.lang=voice.lang||'en-US';u.rate=.95;SS.speak(u)})};
LK.text=node=>{if(!node)return '';const c=node.cloneNode(true);c.querySelectorAll('button,input,script,style,svg').forEach(x=>x.remove());c.querySelectorAll('p,div,h2,h3,h4,li,tr').forEach(x=>x.append(document.createTextNode('. ')));return c.textContent.replace(/\s+/g,' ').replace(/(\.\s*){2,}/g,'. ').trim()};
function howDialog(){let d=document.getElementById('lkHow');if(!d){d=document.createElement('dialog');d.id='lkHow';d.className='lk-dialog';
  d.innerHTML='<h2>Hear it read aloud in Microsoft Edge</h2><p>This browser doesn’t have a natural-sounding voice yet. Edge does:</p><ol><li><b>Open this page in Microsoft Edge.</b></li><li><b>Select the words</b>, right-click, and choose <b>Read aloud selection</b>. Or press <b>Ctrl + Shift + U</b> for the whole page.</li><li><b>Pick a voice</b> with <b>Natural</b> in its name under Voice options.</li></ol><button class="lk-btn">Got it</button>';
  d.querySelector('button').addEventListener('click',()=>d.close());document.body.appendChild(d)}if(d.showModal)d.showModal();else d.setAttribute('open','')}
LK.supports=function(host){host=el(host);if(!host)return;if(CAN){pickVoice();if(SS.addEventListener)SS.addEventListener('voiceschanged',()=>{pickVoice();sync()})}
  host.innerHTML='<button class="lk-sup" data-lk="ra" aria-pressed="false">🔊 Read aloud</button><button class="lk-sup" data-lk="er" aria-pressed="false">Aa Easier reading</button>';
  const ra=$('[data-lk=ra]',host),er=$('[data-lk=er]',host);
  function sync(){raOn=raOn&&!!voice;ra.textContent=raOn?'🔊 Read aloud: on':'🔊 Read aloud';ra.setAttribute('aria-pressed',String(raOn));er.textContent=easy?'Aa Easier reading: on':'Aa Easier reading';er.setAttribute('aria-pressed',String(easy));document.documentElement.classList.toggle('lk-easy',easy);document.documentElement.classList.toggle('easy',easy)}
  ra.addEventListener('click',()=>{if(CAN)pickVoice();if(!voice){raOn=false;pk('raider-labs-readaloud',false);sync();howDialog();return}raOn=!raOn;pk('raider-labs-readaloud',raOn);sync();if(!raOn)SS.cancel()});
  er.addEventListener('click',()=>{easy=!easy;pk('raider-labs-easyread',easy);sync()});
  window.addEventListener('pagehide',()=>{if(CAN)SS.cancel()});sync()};

/* ---------- 1. Pick a way in ---------- */
/* o: {mystery:{title,html}, lessonNote, onChange(choice)} . Choice is 'case' or 'plain', saved. */
LK.path=function(host,o){host=el(host);function draw(){const p=S.path;
    if(p==='case')host.innerHTML=`<div class="lk-eyebrow">${esc(o.mystery.title||'The case')}</div>${o.mystery.html}<p><button class="lk-link" data-p="plain">Switch to just the lesson</button></p>`;
    else if(p==='plain')host.innerHTML=`<p class="lk-muted">${o.lessonNote||'Just the lesson, step by step.'} <button class="lk-link" data-p="case">Want a mystery to solve instead?</button></p>`;
    else host.innerHTML=`<div class="lk-eyebrow">How do you want to start?</div><p>Same lesson either way. Pick one:</p><div class="lk-row"><button class="lk-btn" data-p="case">🔎 Solve a mystery</button><button class="lk-btn ghost" data-p="plain">📘 Just the lesson</button></div>`;
    host.classList.add('lk-card','lk-path')}
  host.addEventListener('click',e=>{const b=e.target.closest('[data-p]');if(!b)return;S.path=b.dataset.p;LK.save();draw();if(S.path==='case')LK.say(LK.text(host));o.onChange&&o.onChange(S.path)});
  draw();return {choice:()=>S.path}};

/* ---------- 3. Help-first "This confused me" ---------- */
/* Opens help first: what it's asking, another way to see it, how to start, an action (Show me).
   Only then asks the reason, anonymously. Opening counts once per place; a reason adds /why-<reason>. */
const WHY=[['reading','Too much to read'],['see','Couldn’t see what changed'],['words','Words I don’t know'],['fast','Went too fast'],['question','The question was confusing']];
const TIP={reading:'Thanks. Try 🔊 Read aloud or Aa Easier reading at the top.',see:'Thanks. Try the picture again, one step at a time.',words:'Thanks. The words are explained in Part 1. Ask your teacher about any other word.',fast:'Thanks. Take one step at a time, and use Show me this step.',question:'Thanks. That helps us rewrite it. Ask your teacher, too.'};
LK.WHY=WHY;
const cfOpened=new Set();
LK.confused=function(host,o){host=el(host);
  /* Mounting again on the same box (e.g. after a redraw) reuses it; a new 'where' starts closed. */
  const st=host._lkcf&&host._lkcf.o.where===o.where?Object.assign(host._lkcf,{o}):(host._lkcf={o,open:false,why:null});
  function draw(){const {o,open,why}=st;
    host.innerHTML=`<button class="lk-cf" aria-expanded="${open}">😕 ${open?'Close help':'This confused me'}</button>`+(open?`<div class="lk-cfhelp" role="region" aria-label="Help"><b>Let’s try it another way.</b>${o.ask?`<p><b>What it’s asking:</b> ${o.ask}</p>`:''}${o.another?`<div><b>Another way to see it:</b> ${o.another}</div>`:''}${o.start?`<p><b>How to start:</b> ${o.start}</p>`:''}${(o.actions||[]).length?`<div class="lk-row">${o.actions.map((a,i)=>`<button class="lk-btn ghost small" data-a="${i}">${esc(a.label)}</button>`).join('')}</div>`:''}<div class="lk-cfwhy">${why?`<span>${TIP[why]}</span>`:`<span>Still confused? Tell us what kind (anonymous):</span>${WHY.map(([k,l])=>`<button class="lk-chip" data-why="${k}">${l}</button>`).join('')}`}</div></div>`:'')}
  st.draw=draw;
  if(!host._lkcfBound){host._lkcfBound=1;host.addEventListener('click',e=>{const st=host._lkcf,o=st.o,where=o.where||'step',t=e.target;
    if(t.closest('.lk-cf')){st.open=!st.open;st.draw();if(st.open){const id=cfg.site+'/'+cfg.page+'/'+where;if(!cfOpened.has(id)){cfOpened.add(id);LK.event(evPath('confused',cfg.site,cfg.page,o.part||LK.where(),where),'Confusing step')}const p=$('.lk-cfhelp',host);p.scrollIntoView({block:'nearest'});LK.say(LK.text(p).replace(/Still confused\?.*$/,''))}return}
    const y=t.closest('[data-why]');if(y){st.why=y.dataset.why;LK.event(evPath('confused',cfg.site,cfg.page,o.part||LK.where(),where)+'/why-'+st.why,'Confusing: '+st.why);st.draw();return}
    const a=t.closest('[data-a]');if(a){const f=(o.actions||[])[+a.dataset.a];f&&f.run&&f.run()}})}
  draw();return {close(){st.open=false;draw()}}};

/* ---------- Number-only answers ---------- */
/* Accepts 35.7, 35,700, 6.02e23, 6.02 x 10^23, 6.02×10²³. Returns NaN for anything else (letters, formulas). */
const SUP='⁰¹²³⁴⁵⁶⁷⁸⁹';
LK.num=function(v){let s=String(v??'').trim().replace(/\s+/g,'').replace(/,/g,'').replace(/−/g,'-');
  s=s.replace(/[⁻]/g,'-').replace(/[⁰-⁹¹²³]/g,c=>String(SUP.indexOf(c)));
  const m=s.match(/^([-+]?\d*\.?\d+)(?:[x×*]10\^?([-+]?\d+))?$/i);if(m)return parseFloat(m[1])*(m[2]!=null?Math.pow(10,+m[2]):1);
  return /^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(s)?parseFloat(s):NaN};
/* 'ok' | 'empty' | 'notnumber' | 'wrong'. rel: allowed relative error (default 1%). */
LK.check=function(v,ans,o={}){if(String(v??'').trim()==='')return 'empty';const x=LK.num(v);if(!isFinite(x))return 'notnumber';const rel=o.rel??0.01,abs=o.abs??0;return Math.abs(x-ans)<=Math.max(abs,rel*Math.abs(ans))?'ok':'wrong'};
LK.checkMsg={empty:'Type a number first.',notnumber:'Type just the number, like 35.7. The unit is already there.',wrong:'Not quite. Check the step and try again.'};
/* Attributes for an answer box: <input class="lk-num" ...LK.numAttrs> */
LK.numAttrs='inputmode="decimal" autocomplete="off" spellcheck="false" placeholder="number"';

/* ---------- Road map strip ---------- */
/* o: {stations:[{icon,value,unit,kind:'w'|'c',bar}], arrows:['÷ 2.02',...], now:index of the station to find next, note}
   value null/'' shows '?'. bar is 0..1 (draws a bar under the station). Stations before 'now' show as found. */
LK.strip=function(host,o){host=el(host);const n=o.now??o.stations.length;
  const cell=(s,i)=>`<div class="lk-rs ${s.kind||'w'}${i===n?' now':''}${i<n?' got':''}"><span class="lk-rsi" aria-hidden="true">${s.icon||''}</span><span class="lk-rsv">${s.value==null||s.value===''?'?':esc(s.value)}</span><span class="lk-rsu">${esc(s.unit||'')}</span>${s.bar!=null?`<span class="lk-rsb"><i style="width:${Math.max(4,Math.min(1,s.bar)*100).toFixed(0)}%"></i></span>`:''}</div>`;
  const arrow=t=>`<div class="lk-ra"><span>${esc(t||'')}</span><b aria-hidden="true">→</b></div>`;
  host.innerHTML=`<div class="lk-strip" aria-label="${esc(o.label||'Road map for this problem')}">${o.stations.map((s,i)=>(i?arrow(o.arrows&&o.arrows[i-1]):'')+cell(s,i)).join('')}</div>${o.note?`<p class="lk-note">${o.note}</p>`:''}`};
LK.stripHTML=o=>{const d=document.createElement('div');LK.strip(d,o);return d.innerHTML};

/* ---------- Before/after bars ---------- */
/* o: {rows:[{label, parts:[{label,value,color}]}], unit, note, max}. Each row is scaled to the largest total. */
LK.bars=function(host,o){host=el(host);const tot=r=>r.parts.reduce((a,p)=>a+(+p.value||0),0),max=o.max||Math.max(...o.rows.map(tot));const fmt=o.format||(v=>String(v));
  host.innerHTML=`<div class="lk-bars">${o.rows.map(r=>`<div class="lk-brow"${r.hidden?' hidden':''}><span class="lk-bl">${esc(r.label)}</span><div class="lk-btrack"><div class="lk-bfill" style="width:${(tot(r)/max*100).toFixed(1)}%">${r.parts.map(p=>`<i style="flex:${(+p.value/tot(r)).toFixed(4)};background:${p.color||'var(--lk-warm)'}" title="${esc(p.label)} ${fmt(p.value)} ${esc(o.unit||'')}">${esc(p.label)} ${fmt(p.value)}${o.unit?' '+esc(o.unit):''}</i>`).join('')}</div></div></div>`).join('')}${o.note?`<p class="lk-note">${o.note}</p>`:''}</div>`;
  return {show(i,on=true){const r=host.querySelectorAll('.lk-brow')[i];if(r)r.hidden=!on},note(h){let p=$('.lk-note',host);if(!p){p=document.createElement('p');p.className='lk-note';$('.lk-bars',host).append(p)}p.innerHTML=h}}};

/* ---------- Step-through animation ---------- */
/* Shows cause and effect: each step changes the picture, and the thing that changes is highlighted.
   o: {svg:'<svg>...</svg>' (elements with ids), steps:[{label, caption, tally:{name:value}, set:{id:{attr:value}}, focus:[ids]}],
       duration (ms per step, default 1400), playLabel, onStep(i)}
   set: numeric SVG attributes (cx, cy, x, y, r, width, height, x1, y1, x2, y2, opacity, ...) are animated between steps;
   tx/ty/s/rot build a transform. Text attributes ('text') and anything non-numeric switch at the end of the move.
   Step 0 is the starting picture. Reduced motion: no movement, a Next step button instead. */
LK.stepper=function(host,o){host=el(host);const steps=o.steps,D=o.duration||1400;
  host.classList.add('lk-stepper');
  host.innerHTML=`<div class="lk-stage">${o.svg}</div><div class="lk-row lk-stepbar"><button class="lk-btn small" data-k="play">${esc(o.playLabel||'▶ Play')}</button><button class="lk-btn ghost small" data-k="next">Next step ›</button><span class="lk-steplabel" aria-live="polite"></span></div><div class="lk-tally" aria-live="polite"></div>${o.after?`<div class="lk-after">${o.after}</div>`:''}`;
  const svg=$('svg',host),lab=$('.lk-steplabel',host),tal=$('.lk-tally',host),play=$('[data-k=play]',host),next=$('[data-k=next]',host);
  const ids=new Set();steps.forEach(s=>Object.keys(s.set||{}).forEach(k=>ids.add(k)));
  /* full state at each step: carry earlier values forward */
  const full=[];steps.forEach((s,i)=>{const prev=i?full[i-1]:{};const cur={};ids.forEach(id=>{cur[id]=Object.assign({},prev[id]||{},(s.set||{})[id]||{})});full.push(cur)});
  const node=id=>svg.querySelector('#'+CSS.escape(id));
  const ease=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
  function apply(a,b,t){ids.forEach(id=>{const n=node(id);if(!n)return;const A=a[id]||{},B=b[id]||{},keys=new Set([...Object.keys(A),...Object.keys(B)]);const tf={};
    keys.forEach(k=>{const va=A[k]??B[k],vb=B[k]??A[k];const nu=typeof va==='number'&&typeof vb==='number';const v=nu?va+(vb-va)*t:(t<1?va:vb);
      if(k==='tx'||k==='ty'||k==='s'||k==='rot'){tf[k]=v;return}if(k==='text'){n.textContent=v;return}if(k==='class'){n.setAttribute('class',v);return}n.setAttribute(k,nu?(+v).toFixed(2):v)});
    if(Object.keys(tf).length)n.setAttribute('transform',`translate(${(tf.tx||0).toFixed(2)} ${(tf.ty||0).toFixed(2)}) rotate(${(tf.rot||0).toFixed(2)}) scale(${(tf.s??1).toFixed(3)})`)})}
  let at=0,raf=0,busy=false;
  function label(i){const s=steps[i];lab.innerHTML=`<b>Step ${i+1} of ${steps.length}:</b> ${s.label||''}`;
    tal.innerHTML=s.tally?Object.entries(s.tally).map(([k,v])=>`<span>${esc(k)}: <b>${v}</b></span>`).join(''):'';
    svg.querySelectorAll('.lk-focus').forEach(x=>x.classList.remove('lk-focus'));(s.focus||[]).forEach(id=>{const n=node(id);n&&n.classList.add('lk-focus')});
    const cap=svg.querySelector('[data-lk-caption]');if(cap&&s.caption!=null)cap.textContent=s.caption;
    o.onStep&&o.onStep(i);LK.say(lab.textContent)}
  function go(i,animate,done){const from=at;at=i;if(!animate||RM()){apply(full[from],full[i],1);label(i);done&&done();return}
    label(i);busy=true;const t0=performance.now();cancelAnimationFrame(raf);
    (function f(now){const t=Math.min(1,(now-t0)/D);apply(full[from],full[i],ease(t));if(t<1)raf=requestAnimationFrame(f);else{busy=false;done&&done()}})(t0)}
  function buttons(){const end=at>=steps.length-1;play.textContent=end?'⟲ Play again':(o.playLabel||'▶ Play');next.textContent=end?'⟲ Start over':'Next step ›';play.hidden=RM();next.hidden=end&&!RM();play.disabled=busy;next.disabled=busy}
  play.addEventListener('click',()=>{if(busy)return;if(at>=steps.length-1){go(0,false)}
    const run=()=>{if(at>=steps.length-1){buttons();return}buttons();go(at+1,true,()=>setTimeout(run,450));buttons()};run()});
  next.addEventListener('click',()=>{if(busy)return;if(at>=steps.length-1)go(0,false);else go(at+1,true,buttons);buttons()});
  apply(full[0],full[0],1);label(0);buttons();
  return {go:i=>{go(i,false);buttons()},step:()=>at}};

/* ---------- Why care? and How this changes the world ---------- */
LK.whyCare=function(host,html){host=el(host);host.classList.add('lk-whycare');host.innerHTML=`<b>Why care?</b> ${html}`};
/* o: {title, lead, cards:[{icon,title,html,source}]} */
LK.world=function(host,o){host=el(host);host.classList.add('lk-card');
  host.innerHTML=`<div class="lk-eyebrow">${esc(o.eyebrow||'Why it matters')}</div><h3>${esc(o.title||'How this changes the world')}</h3>${o.lead?`<p>${o.lead}</p>`:''}<div class="lk-world">${o.cards.map(c=>`<div class="lk-wcard"><span class="lk-wi" aria-hidden="true">${c.icon||''}</span><h4>${esc(c.title)}</h4><p>${c.html}</p>${c.source?`<p class="lk-src">Source: ${c.source}</p>`:''}</div>`).join('')}</div>`};

/* ---------- Test yourself ---------- */
/* o: {id, questions:[{q, choices:[...], answer:index, hint, why, ask, another, start}], onDone(score)}
   One question at a time. A hint and help-first "This confused me" come before any answer is shown.
   The best score is saved in state under test.<id>. */
LK.balance=qs=>qs.map((q,i)=>{const L=q.choices.map(c=>String(c).replace(/<[^>]+>/g,'').length);const m=Math.max(...L);return L[q.answer]===m&&L.filter(x=>x===m).length===1?i:-1}).filter(i=>i>=0);
LK.test=function(host,o){host=el(host);const qs=o.questions,T=(S.test=S.test||{})[o.id]=Object.assign({best:0},(S.test||{})[o.id]);
  const bad=LK.balance(qs);if(bad.length>qs.length/4&&window.console)console.warn('Lesson kit: the right answer is the longest choice in',bad.length,'of',qs.length,'questions:',bad.map(i=>i+1).join(', '));
  let i=0,score=0,picked=null,tries=0,hint=false,done=false,res=[];
  /* Copy for Canvas (Nov 19, 2026): the score screen copies a summary to paste into a Canvas assignment. Same wording as the Raider Labs tools. */
  let nm='';try{nm=localStorage.getItem('raider-labs-name')||'';}catch(e){}
  const plain=h=>{const d=document.createElement('div');d.innerHTML=h||'';return (d.textContent||'').replace(/\s+/g,' ').trim();};
  const summary=()=>[document.title.split(' · ').reverse().join(': '),'Name: '+(nm.trim()||'(add your name)'),'Date: '+new Date().toLocaleString(),'',
    'Test yourself: '+score+' of '+qs.length+' right on the first try (best so far: '+T.best+' of '+qs.length+')']
    .concat(qs.map((q,k)=>'  '+(res[k]===true?'✓':res[k]===false?'✗':'–')+' '+(k+1)+'. '+plain(q.q))).join('\n');
  function draw(){if(done){host.innerHTML=`<div class="lk-card"><h3>You got ${score} of ${qs.length} on the first try.</h3><p>Best so far: <b>${T.best} of ${qs.length}</b>.</p>
      <p class="lk-cvh">Teacher assigned this lesson? Copy your result and paste it into Canvas.</p>
      <div class="lk-row"><label class="lk-cvn">Your name <input class="lk-name" autocomplete="name" value="${LK.esc(nm)}"></label></div>
      <div class="lk-row"><button class="lk-btn" data-t="copy">Copy for Canvas</button><button class="lk-btn ghost" data-t="again">Try again</button></div>
      <p class="lk-cmsg" role="status"></p><textarea class="lk-out" rows="8" readonly hidden aria-label="Your result, ready to paste into Canvas" style="width:100%;box-sizing:border-box;font:13px ui-monospace,Consolas,monospace;margin-top:6px"></textarea></div>`;
      const ni=$('.lk-name',host);if(ni)ni.addEventListener('input',()=>{nm=ni.value;try{localStorage.setItem('raider-labs-name',nm);}catch(e){}});return}
    const q=qs[i],right=picked===q.answer;
    host.innerHTML=`<div class="lk-card lk-test"><div class="lk-eyebrow">Question ${i+1} of ${qs.length}</div><p class="lk-q">${q.q}</p>
      <div class="lk-choices">${q.choices.map((c,k)=>`<button class="lk-choice${picked===k?(k===q.answer?' ok':' no'):''}" data-c="${k}"${right?' disabled':''}>${c}</button>`).join('')}</div>
      ${picked!=null?`<p class="lk-msg ${right?'ok':'no'}">${right?'✓ Right. ':'Not that one. Try another. '}${right&&q.why?q.why:''}</p>`:''}
      <div class="lk-row">${!right&&q.hint?`<button class="lk-btn ghost small" data-t="hint">${hint?'Hide hint':'Give me a hint'}</button>`:''}${right?`<button class="lk-btn" data-t="next">${i+1<qs.length?'Next question ›':'See my score'}</button>`:''}</div>
      ${hint&&!right?`<p class="lk-hint">${q.hint}</p>`:''}<div class="lk-cfslot"></div></div>`;
    if(!right&&(q.ask||q.another||q.start))LK.confused($('.lk-cfslot',host),{where:'test/q'+(i+1),part:'test',ask:q.ask,another:q.another,start:q.start})}
  host.addEventListener('click',e=>{const c=e.target.closest('[data-c]'),t=e.target.closest('[data-t]');
    if(c){picked=+c.dataset.c;tries++;if(picked===qs[i].answer&&tries===1)score++;if(picked===qs[i].answer&&res[i]===undefined)res[i]=tries===1;draw();LK.say(LK.text($('.lk-msg',host)));return}
    if(!t)return;const k=t.dataset.t;
    if(k==='hint'){hint=!hint;draw();if(hint)LK.say(LK.text($('.lk-hint',host)))}
    else if(k==='next'){i++;picked=null;tries=0;hint=false;if(i>=qs.length){done=true;T.best=Math.max(T.best,score);LK.save();o.onDone&&o.onDone(score)}draw()}
    else if(k==='copy'){const t=summary(),out=$('.lk-out',host),m=$('.lk-cmsg',host),say=x=>{if(m)m.textContent=x};
      const fb=()=>{if(out){out.value=t;out.hidden=false;out.focus();out.select()}say('It’s in the box below and already selected: press Ctrl+C (Cmd+C on a Mac), then paste it into Canvas.')};
      try{navigator.clipboard.writeText(t).then(()=>{if(out)out.hidden=true;say('Copied! In Canvas, click the answer box and press Ctrl+V (Cmd+V on a Mac).')},fb)}catch(err){fb()}}
    else if(k==='again'){i=0;score=0;picked=null;tries=0;hint=false;done=false;res=[];draw()}});
  draw()};
})();
