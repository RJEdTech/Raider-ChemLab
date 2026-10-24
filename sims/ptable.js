(function(){
'use strict';
const {clamp,lerp,rng,rr,txt,pill,atLeast,PAL,FONT,lvText}=BioLab.h;
const CL=ChemLab;
/* Interactive periodic table: color by category, metal type, family, state at a temperature, valence electrons, ion charges, blocks and molar mass,
   an element card, and a symbol ↔ name practice game. */
const C=42.6,X0=26,Y0=30,FY=342;                     // cell size, table origin, top of the f-block rows
const LV={bio:0,honors:1,ap:2};
const lvOK=l=>LV[l||'bio']<=LV[BioLab.level];
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
// melting and boiling points at 1 atm (°C), CRC Handbook values. 'sub' = sublimes at that temperature. Estimates flagged in EST.
const MPBP=[null,[-259.16,-252.87],[null,-268.93],[180.5,1342],[1287,2469],[2076,3927],['sub',3642],[-210.0,-195.79],[-218.79,-182.96],[-219.67,-188.11],[-248.59,-246.05],
  [97.79,882.94],[650,1090],[660.32,2470],[1414,3265],[44.15,280.5],[115.21,444.6],[-101.5,-34.04],[-189.34,-185.85],[63.5,759],[842,1484],
  [1541,2836],[1668,3287],[1910,3407],[1907,2671],[1246,2061],[1538,2861],[1495,2927],[1455,2913],[1084.62,2562],[419.53,907],
  [29.76,2400],[938.25,2833],['sub',615],[221,685],[-7.2,58.8],[-157.37,-153.42],[39.3,688],[777,1377],[1526,3336],[1855,4409],
  [2477,4744],[2623,4639],[2157,4265],[2334,4150],[1964,3695],[1554.9,2963],[961.78,2162],[321.07,767],[156.6,2072],[231.93,2602],
  [630.63,1587],[449.51,988],[113.7,184.3],[-111.75,-108.1],[28.44,671],[727,1845],[920,3464],[795,3443],[935,3520],[1024,3074],
  [1042,3000],[1072,1794],[826,1529],[1312,3273],[1356,3230],[1407,2567],[1461,2720],[1529,2868],[1545,1950],[824,1196],
  [1652,3402],[2233,4603],[3017,5458],[3422,5555],[3186,5596],[3033,5012],[2446,4428],[1768.3,3825],[1064.18,2856],[-38.83,356.73],
  [304,1473],[327.46,1749],[271.4,1564],[254,962],[302,337],[-71,-61.7],[27,677],[700,1737],[1050,3198],[1750,4788],
  [1572,4000],[1132.2,4131],[644,3902],[639.4,3228],[1176,2607],[1340,3110],[986,null],[900,null],[860,null]];
const EST=[85,87,91,93,97,98,99];
function mpbp(Z){const d=MPBP[Z];if(!d)return {mp:null,bp:null};if(d[0]==='sub')return {mp:d[1],bp:d[1],sub:true};return {mp:d[0],bp:d[1]};}
function stateAt(Z,T){const d=MPBP[Z];if(!d)return 'u';if(d[0]==='sub')return T<d[1]?'s':'g';if(d[0]===null)return T<d[1]?'l':'g';
  if(T<d[0])return 's';if(d[1]===null)return 'u';return T<d[1]?'l':'g';}
const STATE={s:{n:'Solid',f:'#4f5b66'},l:{n:'Liquid',f:'#1f6fb2'},g:{n:'Gas',f:'#c0392b'},u:{n:'Not known',f:'#8a8a8a'}};
// families
function family(e){if(e.Z===1)return 'h';if(e.cat==='lanthanide'||e.cat==='actinide')return 'f';if(e.group===1)return 'g1';if(e.group===2)return 'g2';if(e.group>=3&&e.group<=12)return 'tm';
  return {13:'g13',14:'g14',15:'g15',16:'g16',17:'g17',18:'g18'}[e.group];}
const FAM={h:['Hydrogen (no family)','#607080'],g1:['Alkali metals','#c0392b'],g2:['Alkaline earth metals','#d35400'],tm:['Transition metals','#9a7d0a'],g13:['Boron family','#5d8a3a'],
  g14:['Carbon family','#2e7d6b'],g15:['Nitrogen family (pnictogens)','#2471a3'],g16:['Oxygen family (chalcogens)','#4f55b0'],g17:['Halogens','#a93f6b'],g18:['Noble gases','#7d3c98'],f:['Inner transition (f-block)','#8e5a2a']};
const MT={metal:['Metal','#4a6fa5'],metalloid:['Metalloid','#1e8c7a'],nonmetal:['Nonmetal','#c0602a']};
function metalType(e){if(e.cat==='metalloid')return 'metalloid';return CL.isMetal(e)?'metal':'nonmetal';}
const VCOL=['','#c0392b','#d35400','#9a7d0a','#4d8a2f','#16857a','#2471a3','#5b4fa8','#8e3c8e'];
function valenceOf(e){if(e.cat==='lanthanide'||e.cat==='actinide'||(e.group>=3&&e.group<=12))return null;return CL.valence(e);}
const BLK={s:['s block','#c0392b'],p:['p block','#2471a3'],d:['d block','#9a7d0a'],f:['f block','#2e8b57']};
function block(e){const g=CL.gridPos(e);if(g.row>=9)return 'f';if(e.Z===2||e.group<=2)return 's';if(e.group>=13)return 'p';return 'd';}
function ions(e){const q=CL.monatomic[e.sym];if(!q)return null;if(e.sym==='H')return [1];return q;}
function ionKey(e){const q=ions(e);if(e.group===18)return 'none';if(!q)return 'na';if(q.length>1)return 'var';return String(q[0]);}
const ICOL={'1':['1+','#1f4e99'],'2':['2+','#2f6fbf'],'3':['3+','#4a7fc0'],'-3':['3−','#7f2424'],'-2':['2−','#a8322e'],'-1':['1−','#c8553a'],var:['More than one charge','#6d4fa0'],none:['No ion (noble gas)','#7d3c98'],na:['Rarely forms simple ions','#7b7f86']};
const fmtQ=q=>(Math.abs(q)===1?'':Math.abs(q))+(q>0?'+':'−');
// mass order inversions (heavier than the next element)
const INV=new Set();CL.elements.forEach((e,i)=>{const n=CL.elements[i+1];if(n&&!e.synthetic&&!n.synthetic&&e.mass>n.mass){INV.add(e.Z);INV.add(n.Z);}});
// practice sets
const RJLIST='H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Cr Mn Fe Co Ni Cu Zn Br Kr Rb Sr Ag Sn I Xe Cs Ba W Pt Au Hg Pb Rn Fr Ra U'.split(' ');
function setPool(set){if(set==='z20')return CL.elements.filter(e=>e.Z<=20);if(set==='rj')return RJLIST.map(s=>CL.el(s));
  if(set==='main')return CL.elements.filter(e=>(e.group<=2||e.group>=13)&&e.period<=6&&!(e.cat==='lanthanide'||e.cat==='actinide'));return CL.elements;}
// cell geometry
function cellXY(e){const g=CL.gridPos(e);const x=X0+(g.col-1)*C,y=g.row>=9?FY+(g.row-9)*C:Y0+(g.row-1)*C;return {x,y};}
const CARD={x:X0+2*C+4,y:Y0+2,w:10*C-8,h:3*C-6};
function cellAt(x,y){for(const e of CL.elements){const p=cellXY(e);if(x>=p.x&&x<p.x+C&&y>=p.y&&y<p.y+C)return e;}return null;}

function fillFor(sim,e){const m=sim.p.color;
  if(m==='metal')return MT[metalType(e)][1];if(m==='family')return FAM[family(e)][1];if(m==='state')return STATE[stateAt(e.Z,sim.p.temp)].f;
  if(m==='valence'){const v=valenceOf(e);if(v===null)return '#7b7f86';if(e.Z===2)return VCOL[8];return VCOL[v];}
  if(m==='ions')return ICOL[ionKey(e)][1];if(m==='block')return BLK[block(e)][1];
  if(m==='mass'){const t=Math.log(e.mass)/Math.log(300);return mix('#24507f','#c8592a',clamp((t-0.0)/1,0,1));}
  return CL.CAT_FILL[e.cat];}
function mix(a,b,t){const p=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));const A=p(a),B=p(b);return '#'+A.map((v,i)=>Math.round(lerp(v,B[i],t)).toString(16).padStart(2,'0')).join('');}
function valueFor(sim,e){const m=sim.p.color;
  if(m==='valence'){const v=valenceOf(e);return v===null?'':String(v);}
  if(m==='ions'){const q=ions(e);if(e.group===18)return '0';if(!q)return '';return q.slice(0,2).map(fmtQ).join(',');}
  if(m==='state'){const s=stateAt(e.Z,sim.p.temp);return s==='u'?'?':s;}
  if(m==='mass')return e.mass>=100?e.mass.toFixed(0):e.mass.toFixed(1);
  if(m==='block')return block(e);return '';}
function legendItems(sim){const m=sim.p.color;
  if(m==='metal')return Object.values(MT).map(v=>({l:v[0],c:v[1]}));
  if(m==='family')return Object.keys(FAM).filter(k=>k!=='h').map(k=>({l:FAM[k][0],c:FAM[k][1]}));
  if(m==='state')return ['s','l','g','u'].map(k=>({l:STATE[k].n,c:STATE[k].f}));
  if(m==='valence')return [1,2,3,4,5,6,7,8].map(v=>({l:v+' valence e⁻',c:VCOL[v]})).concat([{l:'d and f block: varies',c:'#7b7f86'}]);
  if(m==='ions')return Object.values(ICOL).map(v=>({l:v[0],c:v[1]}));
  if(m==='block')return Object.values(BLK).map(v=>({l:v[0],c:v[1]}));
  if(m==='mass')return [{l:'light',c:'#24507f'},{l:'heavy',c:'#c8592a'},{l:'heavier than the next element',c:'#e0a800',dot:true}];
  return Object.keys(CL.CAT_FILL).map(k=>({l:CL.CAT_NAMES[k],c:CL.CAT_FILL[k]}));}
function countStates(T){const c={s:0,l:0,g:0,u:0};CL.elements.forEach(e=>c[stateAt(e.Z,T)]++);return c;}
function cap(s){return s.replace(/^./,m=>m.toUpperCase());}
function ionText(e){const q=ions(e);if(e.group===18)return 'none (stable as atoms)';if(!q)return 'rarely forms simple ions';return q.map(x=>CL.fmt(e.sym,x)).join(' or ');}

/* ---------- practice ---------- */
function newPractice(sim){const st=sim.st,p=sim.p;st.qn++;const r=rng(st.seed*131+st.qn*7919);const pool=setPool(p.set);
  let e;for(let i=0;i<10;i++){const w=pool.map(x=>(st.known[x.Z]||0)<0?3:(st.known[x.Z]||0)===0?1.6:0.6);let tot=w.reduce((a,b)=>a+b,0),t=r()*tot;e=pool[0];for(let j=0;j<pool.length;j++){t-=w[j];if(t<=0){e=pool[j];break;}}if(!st.recent.includes(e.Z))break;}
  st.recent.push(e.Z);if(st.recent.length>5)st.recent.shift();
  const dir=p.dir==='mix'?['n2s','s2n','find'][Math.floor(r()*3)]:p.dir;
  const others=pool.filter(x=>x!==e);const near=others.filter(x=>x.sym[0]===e.sym[0]||x.name[0]===e.name[0]);const pickFrom=near.length>=3?near:others;
  const opts=[e];while(opts.length<4&&opts.length<pool.length){const c=r()<0.7&&pickFrom.length?pickFrom[Math.floor(r()*pickFrom.length)]:others[Math.floor(r()*others.length)];if(!opts.includes(c))opts.push(c);}
  for(let i=opts.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[opts[i],opts[j]]=[opts[j],opts[i]];}
  st.pr={e,dir,opts,correct:opts.indexOf(e),done:false,res:null,picked:-1,input:'',clicked:null};syncAnswer(sim);}
function normName(s){return String(s||'').trim().toLowerCase().replace(/aluminium/,'aluminum').replace(/sulphur/,'sulfur').replace(/caesium/,'cesium');}
function gradePractice(sim,opt){const st=sim.st,pr=st.pr;if(!pr||pr.done)return;let ok,msg='';const e=pr.e;
  if(opt.pick!==undefined){pr.picked=opt.pick;ok=opt.pick===pr.correct;const g=pr.opts[opt.pick];if(!ok)msg=pr.dir==='n2s'?`${g.sym} is ${g.name}.`:`${g.name} is ${g.sym}.`;}
  else if(opt.el){pr.clicked=opt.el.Z;ok=opt.el.Z===e.Z;if(!ok)msg=`You picked ${opt.el.name} (${opt.el.sym}), in group ${opt.el.group>2&&opt.el.period>=6&&(opt.el.cat==='lanthanide'||opt.el.cat==='actinide')?'3 (f block)':opt.el.group}, period ${opt.el.period}.`;}
  else{const s=String(opt.typed||'').trim();if(!s){pr.res={empty:true,msg:pr.dir==='n2s'?'Type a symbol first.':'Type a name first.'};syncAnswer(sim);return;}
    if(pr.dir==='n2s'){ok=s===e.sym;if(!ok){if(s.toLowerCase()===e.sym.toLowerCase())msg=`Right letters, but write a capital, then lowercase: ${e.sym}.`;else{const g=CL.el(s);msg=g?`${s} is ${g.name}.`:`${s} is not an element symbol.`;}}}
    else{ok=normName(s)===e.name.toLowerCase();if(!ok){const g=CL.elements.find(x=>x.name.toLowerCase()===normName(s));msg=g?`${g.name} is ${g.sym}.`:'Check the spelling.';}}}
  pr.done=true;pr.res={ok,msg};st.tries++;if(ok){st.right++;st.streak++;st.known[e.Z]=Math.max(1,(st.known[e.Z]||0)+1);}else{st.streak=0;st.known[e.Z]=-1;}
  sim.p.el=e.sym;if(sim.ui&&sim.ui.ctl&&sim.ui.ctl.el)sim.ui.ctl.el.set(e.sym);sim.infoDirty=true;syncAnswer(sim);}
function buildAnswer(sim){if(!sim.ui||!sim.ui.ctrls||sim.ui.ansBox)return;const box=document.createElement('div');box.className='ctl';
  box.innerHTML=`<div class="ctl-top"><label for="pt-in" id="pt-prompt">Your answer</label></div><p class="help pt-q" style="margin:0 0 6px"></p>
    <div class="pt-mc" role="group" aria-labelledby="pt-prompt" style="display:flex;flex-direction:column;gap:6px"></div>
    <div class="pt-ty" style="display:flex;gap:6px"><input id="pt-in" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" style="flex:1;min-width:0;font-size:16px;padding:7px 9px;border:1px solid var(--line);border-radius:8px;background:var(--card2);color:var(--fg)"><button type="button" class="btn primary" data-pt="check">Check</button></div>
    <p class="pt-fb" aria-live="polite" style="margin:6px 0 0;font-size:15px;line-height:1.4"></p>`;
  sim.ui.ctrls.querySelector('h3').after(box);sim.ui.ansBox=box;const inp=box.querySelector('input');
  inp.addEventListener('input',()=>{if(sim.st.pr)sim.st.pr.input=inp.value;});
  const go=()=>{gradePractice(sim,{typed:inp.value});BioLab.refresh(sim);};inp.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();go();}});box.querySelector('[data-pt=check]').addEventListener('click',go);
  syncAnswer(sim);}
function syncAnswer(sim){const box=sim.ui&&sim.ui.ansBox;if(!box||!sim.st)return;const pr=sim.st.pr,prac=sim.p.mode==='practice';box.hidden=!prac||!pr;if(!prac||!pr)return;
  const e=pr.e,mc=sim.p.style==='mc'&&pr.dir!=='find',find=pr.dir==='find';
  box.querySelector('#pt-prompt').textContent=find?'Find this element on the table':pr.dir==='n2s'?'What is the symbol?':'What is the name?';
  box.querySelector('.pt-q').innerHTML=`<b style="font-size:18px">${find||pr.dir==='n2s'?esc(e.name):e.sym}</b>${find?' · click its square, or choose it under Selected element and press Check my pick':''}`;
  const inp=box.querySelector('input');if(inp.value!==(pr.input||''))inp.value=pr.input||'';inp.disabled=pr.done;inp.placeholder=pr.dir==='n2s'?'e.g. Fe':'e.g. iron';box.querySelector('[data-pt=check]').disabled=pr.done;
  box.querySelector('.pt-ty').style.display=mc||find?'none':'flex';const m=box.querySelector('.pt-mc');m.style.display=mc?'flex':'none';
  if(mc){m.innerHTML=pr.opts.map((o,i)=>{const st=pr.done?(i===pr.correct?' style="border-color:var(--good);box-shadow:inset 0 0 0 1px var(--good)"':i===pr.picked?' style="border-color:var(--bad);box-shadow:inset 0 0 0 1px var(--bad)"':''):'';
      return `<button type="button" class="choice" data-pi="${i}"${pr.done?' disabled':''}${st}>${pr.dir==='n2s'?o.sym:esc(o.name)}</button>`;}).join('');
    m.querySelectorAll('[data-pi]').forEach(b=>b.addEventListener('click',()=>{gradePractice(sim,{pick:+b.dataset.pi});BioLab.refresh(sim);}));}
  const fb=box.querySelector('.pt-fb'),r=pr.res;
  fb.innerHTML=!r?'':r.empty?`<span style="color:var(--muted)">${r.msg}</span>`:r.ok?`<b style="color:var(--good)">Correct.</b> ${esc(e.name)} is ${e.sym}.`:`<b style="color:var(--bad)">Not quite.</b> ${esc(e.name)} is ${e.sym}. ${esc(r.msg)}`;}
function syncMode(sim){if(!sim.ui||!sim.ui.sec)return;const d=sim.def,mode=sim.p.mode;
  d.controls.forEach(c=>{if(!c.show)return;const cid=d.id+'-'+c.id,el=document.getElementById(cid)||document.getElementById(cid+'-l');if(!el)return;const w=el.closest('.ctl');if(w)w.hidden=!atLeast(c.lvl)||!c.show(sim.p);});
  const btns=[...sim.ui.sec.querySelectorAll('.actions button')];d.actions.forEach((a,i)=>{if(btns[i])btns[i].hidden=!atLeast(a.lvl)||!a.show(sim.p,sim.st);});
  d.metrics.forEach(m=>{if(!m.show)return;const t=sim.ui.tiles[m.id];if(!t)return;const w=t.num.closest('.tile');if(w)w.hidden=!atLeast(m.lvl)||!m.show(sim.p);});
  syncAnswer(sim);}

const COLOR_OPTS=[{v:'cat',l:'Element category'},{v:'metal',l:'Metals, nonmetals, metalloids'},{v:'family',l:'Families (groups)'},{v:'state',l:'State at a temperature'},
  {v:'valence',l:'Valence electrons',lvl:'honors'},{v:'ions',l:'Common ion charges',lvl:'honors'},{v:'block',l:'s, p, d and f blocks',lvl:'honors'},{v:'mass',l:'Molar mass (and order by Z)',lvl:'honors'}];
const el=s=>CL.el(s);
const SIM={
  id:'ptable',hash:'ptable',apUnit:4,order:1,tab:'Periodic table',kind:'Learning tool',
  card:'Explore all 118 elements by family, metal type, state at any temperature, valence electrons and ion charges, then drill the symbols.',
  title:'The periodic table',
  lede:{bio:'Rows are periods and columns are groups. Elements in the same group act alike. Click any element to see its card, or color the table to see patterns.',
        honors:'Color the table by valence electrons, ion charges and blocks to see why elements in a group form the same ions.',
        ap:'Add electron configurations, electronegativity, radius, ionization energy and melting and boiling points to every element card.'},
  scale:'Every known element, one square each. A real atom of any of them is about 0.1 to 0.5 nm across.',
  aspect:4/3,timeless:true,graph:true,defaultGraph:null,
  next:['trends','econfig','ionic','atombuilder'],
  controls:[
    {id:'mode',label:'Use the table to',type:'seg',def:'explore',lvl:'bio',noTrial:true,options:[{v:'explore',l:'Explore'},{v:'practice',l:'Practice symbols'}],onChange:sim=>{if(sim.p.mode==='practice'&&sim.st)newPractice(sim);syncMode(sim);}},
    {id:'color',label:'Color the table by',type:'select',def:'cat',lvl:'bio',noTrial:true,options:COLOR_OPTS,onChange:syncMode},
    {id:'temp',label:'Temperature',type:'range',min:-273,max:4000,step:1,def:25,unit:' °C',lvl:'bio',noTrial:true,help:'Room temperature is 25 °C. Pressure stays at 1 atm.',show:p=>p.color==='state'},
    {id:'el',label:'Selected element',type:'select',def:'Na',lvl:'bio',options:CL.elements.map(e=>({v:e.sym,l:e.Z+' '+e.sym+' · '+e.name})),help:'Or click a square on the table.'},
    {id:'set',label:'Practice set',type:'select',def:'z20',lvl:'bio',noTrial:true,options:[{v:'z20',l:'Elements 1–20'},{v:'rj',l:'RJ quiz list (46 elements)'},{v:'main',l:'Main-group elements'},{v:'all',l:'All 118 elements'}],show:p=>p.mode==='practice',onChange:sim=>{if(sim.p.mode==='practice')newPractice(sim);}},
    {id:'dir',label:'Practice',type:'seg',def:'n2s',lvl:'bio',noTrial:true,options:[{v:'n2s',l:'Name → symbol'},{v:'s2n',l:'Symbol → name'},{v:'find',l:'Find it'},{v:'mix',l:'Mix'}],show:p=>p.mode==='practice',onChange:sim=>{if(sim.p.mode==='practice')newPractice(sim);}},
    {id:'style',label:'Answer by',type:'seg',def:'type',lvl:'bio',noTrial:true,options:[{v:'type',l:'Typing'},{v:'mc',l:'Choosing'}],show:p=>p.mode==='practice',onChange:sim=>syncAnswer(sim)}
  ],
  actions:[
    {id:'prev',label:'‹ Previous element',show:p=>p.mode==='explore',run(sim){const e=el(sim.p.el);BioLab.setValues(sim,{el:CL.el(e.Z>1?e.Z-1:118).sym});}},
    {id:'next',label:'Next element ›',show:p=>p.mode==='explore',run(sim){const e=el(sim.p.el);BioLab.setValues(sim,{el:CL.el(e.Z<118?e.Z+1:1).sym});}},
    {id:'newq',label:'Next element to practice',primary:true,show:p=>p.mode==='practice',run(sim){newPractice(sim);}},
    {id:'pick',label:'Check my pick',show:(p,st)=>p.mode==='practice'&&st&&st.pr&&st.pr.dir==='find',run(sim){gradePractice(sim,{el:el(sim.p.el)});}},
    {id:'reset',label:'Reset score',show:p=>p.mode==='practice',run(sim){const st=sim.st;st.right=0;st.tries=0;st.streak=0;st.known={};}}
  ],
  init(sim){const st={seed:1+Math.floor(Math.random()*1e6),qn:0,right:0,tries:0,streak:0,known:{},recent:[],pr:null,flash:0};sim.st=st;newPractice(sim);return st;},
  initVis(sim){buildAnswer(sim);syncMode(sim);},
  onLevel(sim){syncMode(sim);},
  onClick(sim,x,y){const e=cellAt(x,y);if(!e)return;if(sim.p.mode==='practice'&&sim.st.pr&&sim.st.pr.dir==='find'&&!sim.st.pr.done){gradePractice(sim,{el:e});return;}BioLab.setValues(sim,{el:e.sym});},
  metrics:[
    {id:'name',label:'Element',unit:'',lvl:'bio',text:true,noTrial:true,get:s=>{const e=el(s.p.el);return e.name+' ('+e.sym+')';}},
    {id:'Z',label:'Atomic number Z',unit:'',lvl:'bio',min:0,max:118,d:0,get:s=>el(s.p.el).Z},
    {id:'mass',label:'Molar mass',unit:'g/mol',lvl:'bio',min:0,max:300,d:2,get:s=>el(s.p.el).mass},
    {id:'val',label:'Valence electrons',unit:'',lvl:'honors',min:0,max:8,d:0,get:s=>{const v=valenceOf(el(s.p.el));return v===null?NaN:v;}},
    {id:'en',label:'Electronegativity',unit:'',lvl:'ap',min:0,max:4,d:2,get:s=>{const v=el(s.p.el).en;return v===null?NaN:v;}},
    {id:'rad',label:'Covalent radius',unit:'pm',lvl:'ap',min:0,max:260,d:0,get:s=>{const v=el(s.p.el).radius;return v===null?NaN:v;}},
    {id:'ie',label:'1st ionization energy',unit:'kJ/mol',lvl:'ap',min:0,max:2400,d:0,get:s=>{const v=el(s.p.el).ie1;return v===null?NaN:v;}},
    {id:'mp',label:'Melting point',unit:'°C',lvl:'ap',min:-273,max:4000,d:0,get:s=>{const m=mpbp(el(s.p.el).Z).mp;return m===null?NaN:m;}},
    {id:'score',label:'Practice score',unit:'',lvl:'bio',text:true,noTrial:true,show:p=>p.mode==='practice',get:s=>s.st.tries?s.st.right+' of '+s.st.tries+' · streak '+s.st.streak:'No answers yet'}
  ],
  graphs:[{id:'prop',label:'Property vs atomic number',lvl:'bio',custom:true}],
  plot(sim,ctx,box){const e=el(sim.p.el);const hon=atLeast('honors'),ap=atLeast('ap');
    const props=[{k:'mass',l:'Molar mass (g/mol)',f:x=>x.mass}];if(hon)props.push({k:'val',l:'Valence electrons',f:x=>valenceOf(x)});if(ap){props.push({k:'ie1',l:'1st ionization energy (kJ/mol)',f:x=>x.ie1});}
    const pr=ap?props[2]:hon?props[1]:props[0];const xs=CL.elements.filter(x=>x.Z<=86);const ys=xs.map(pr.f);const ymax=Math.max(...ys.filter(v=>v!==null))*1.08;
    const ax=BioLab.h.axes(ctx,box,{xmin:0,xmax:87,ymin:0,ymax,xl:'Atomic number Z',yl:pr.l});
    ctx.save();ctx.beginPath();ctx.rect(box.L,box.T,box.W,box.H);ctx.clip();ctx.strokeStyle=PAL['g-line'];ctx.lineWidth=2;ctx.beginPath();let on=false;
    xs.forEach((x,i)=>{const v=ys[i];if(v===null){on=false;return;}const X=ax.X(x.Z),Y=ax.Y(v);on?ctx.lineTo(X,Y):ctx.moveTo(X,Y);on=true;});ctx.stroke();
    xs.forEach((x,i)=>{const v=ys[i];if(v===null)return;if(x.group===18||x.group===1){ctx.fillStyle=x.group===18?PAL['s5']:PAL['s1'];ctx.beginPath();ctx.arc(ax.X(x.Z),ax.Y(v),3.5,0,6.29);ctx.fill();}});
    const v=pr.f(e);if(v!==null&&e.Z<=86){ctx.strokeStyle=PAL['s4'];ctx.lineWidth=3;ctx.beginPath();ctx.arc(ax.X(e.Z),ax.Y(v),8,0,6.29);ctx.stroke();}ctx.restore();
    BioLab.h.legend(ctx,box.L+10,box.T+10,[{label:'Group 1',color:PAL['s1']},{label:'Group 18',color:PAL['s5']},{label:e.sym+(v===null||e.Z>86?' (not plotted)':''),color:PAL['s4']}]);},
  challengeTitle:'Check your understanding',
  challenges(sim){const K=el('K'),Al=el('Al'),Se=el('Se');const liq25=countStates(25).l;const at1000=['Cu','Al','Na','Fe'];const liq1000=at1000.find(s=>stateAt(el(s).Z,1000)==='l');
    const cuR=CL.configText(29,{noble:true}),cuA=(()=>{const c=CL.config(29,{aufbauOnly:true});return '[Ar] '+c.filter(o=>['4s','3d'].includes(o.label)).map(o=>o.label+CL.sup(o.e)).join(' ');})();
    const notFirst=['K','Ca','C','Cl'];const oddIdx=notFirst.findIndex(s=>el(s).name[0].toUpperCase()!==s[0]);
    const v=CL.valence(Se),vOpts=[2,4,6,16];const alq=ions(Al)[0];const feq=ions(el('Fe'));
    return [
      {lvl:'bio',instant:true,q:'Which element’s symbol does NOT come from its English name?',choices:notFirst.map(s=>s+' ('+el(s).name.toLowerCase()+')'),correct:oddIdx,set:{mode:'explore',el:'K'},
       explain:'K comes from <b>kalium</b>, the Latin name for potassium. Others like it: Na (natrium, sodium), Fe (ferrum, iron), Cu (cuprum), Ag (argentum), Au (aurum), Sn (stannum), Pb (plumbum), Hg (hydrargyrum) and W (wolfram). The table now shows potassium.'},
      {lvl:'bio',instant:true,q:'Hydrogen sits at the top of Group 1. Is it an alkali metal?',choices:['Yes, everything in Group 1 is an alkali metal','No, hydrogen is a nonmetal gas','Yes, but only as a liquid'],correct:el('H').cat==='alkali'?0:1,set:{mode:'explore',color:'cat',el:'H'},
       explain:'Hydrogen has one valence electron like the alkali metals, which is why it sits in Group 1. But it is a <b>nonmetal</b> gas (H₂) at room temperature. It can lose an electron (H⁺) or gain one (H⁻).'},
      {lvl:'bio',instant:true,q:'Sodium and chlorine are in the same row, period 3. What do they share?',choices:['The same number of electron shells (energy levels)','The same number of valence electrons','Very similar chemical properties'],correct:0,set:{mode:'explore',color:'family',el:'Cl'},
       explain:'A <b>period</b> (row) tells you the number of occupied energy levels: both have 3. Elements in the same <b>group</b> (column) share valence electrons and act alike, so sodium (a soft, reactive metal) and chlorine (a toxic gas) are very different.'},
      {lvl:'bio',instant:true,q:'Aluminum touches the staircase line. What is it?',choices:['A metal','A metalloid','A nonmetal'],correct:['metal','metalloid','nonmetal'].indexOf(metalType(Al)),set:{mode:'explore',color:'metal',el:'Al'},
       explain:'Aluminum is a <b>metal</b>: shiny, it conducts electricity and forms Al³⁺. Touching the line is not enough. The metalloids are B, Si, Ge, As, Sb and Te (and sometimes Po).'},
      {lvl:'honors',instant:true,q:'How many valence electrons does selenium (Se) have?',choices:vOpts.map(String),correct:vOpts.indexOf(v),set:{mode:'explore',color:'valence',el:'Se'},
       explain:'Se is in group 16, so it has <b>'+v+' valence electrons</b> (4s² 4p⁴). Main-group elements have the same number of valence electrons as the last digit of their group number. It gains 2 to form Se²⁻.'},
      {lvl:'honors',instant:true,q:'Which ion does aluminum form?',choices:['Al³⁺','Al³⁻','Al⁺','Al⁵⁻'],correct:alq===3?0:1,set:{mode:'explore',color:'ions',el:'Al'},
       explain:'Aluminum has 3 valence electrons. Losing 3 is far easier than gaining 5, so it forms <b>Al³⁺</b>. Metals lose electrons and become positive ions.'},
      {lvl:'honors',instant:true,q:'Iron is a transition metal. Which ions can it form?',choices:['Both Fe²⁺ and Fe³⁺','Only Fe²⁺','Only Fe³⁺','Fe⁸⁺, because it is in group 8'],correct:feq.includes(2)&&feq.includes(3)?0:1,set:{mode:'explore',color:'ions',el:'Fe'},
       explain:'Many transition metals form more than one ion, so their compound names need a Roman numeral: iron(II) and iron(III). The group number does not give a transition metal’s charge.'},
      {lvl:'honors',instant:true,q:'At room temperature (25 °C), how many elements are liquids?',choices:['2','5','11','Over 20'],correct:['2','5','11','Over 20'].indexOf(String(liq25)),set:{mode:'explore',color:'state',temp:25,el:'Br'},
       explain:'Only <b>'+liq25+'</b>: bromine and mercury. Gallium (29.8 °C) and cesium (28.4 °C) melt just above room temperature, so a warm hand melts gallium. Eleven elements are gases at 25 °C.'},
      {lvl:'ap',instant:true,q:'At 1000 °C and 1 atm, which of these is a liquid?',choices:at1000.map(s=>el(s).name),correct:at1000.indexOf(liq1000),set:{mode:'explore',color:'state',temp:1000,el:liq1000},
       explain:'Aluminum melts at 660 °C and boils at 2470 °C, so at 1000 °C it is <b>liquid</b>. Copper (1085 °C) and iron (1538 °C) are still solid, and sodium (boils at 883 °C) is already a gas. The table is now set to 1000 °C.'},
      {lvl:'ap',instant:true,q:'What is the ground-state electron configuration of copper?',choices:[cuR,cuA,'[Ar] 3d¹¹','[Ar] 4s² 4p⁹'],correct:0,set:{mode:'explore',el:'Cu'},
       explain:'Copper is an exception: <b>'+cuR+'</b>. A filled 3d¹⁰ subshell is lower in energy than 4s² 3d⁹, so one 4s electron moves into 3d. Chromium does the same thing ([Ar] 4s¹ 3d⁵).'},
      {lvl:'ap',instant:true,q:'Tellurium (127.60 g/mol) comes before iodine (126.90 g/mol). Why?',choices:['The table is ordered by atomic number (protons), not mass','Mendeleev made a mistake that was never fixed','Tellurium is radioactive'],correct:0,set:{mode:'explore',color:'mass',el:'Te'},
       explain:'Moseley showed in 1913 that atomic number Z orders the table. Te has 52 protons and I has 53, so Te comes first even though its common isotopes are heavier. The gold dots mark every pair like this, such as Ar and K, and Co and Ni.'}
    ];},
  onChallenge(sim,ch,phase){if(ch&&phase==='done'&&ch.set){BioLab.setValues(sim,ch.set);syncMode(sim);}},
  infoPanel(sim){const e=el(sim.p.el),hon=atLeast('honors'),ap=atLeast('ap');const m=mpbp(e.Z),T=sim.p.temp;
    let h=`<h3>${e.Z} · ${esc(e.name)} (${e.sym})</h3><p>${CL.CAT_NAMES[e.cat]}, ${metalType(e)}. ${e.cat==='lanthanide'||e.cat==='actinide'?'f block, period '+e.period:'Group '+e.group+', period '+e.period}. Molar mass ${e.mass} g/mol. ${{s:'Solid',l:'Liquid',g:'Gas'}[e.state]} at 25 °C${e.synthetic?'; made in labs and reactors, not found in nature':''}.</p>`;
    if(hon)h+=`<p><b>Valence electrons:</b> ${valenceOf(e)===null?'not a simple count (d or f block)':valenceOf(e)}. <b>Common ions:</b> ${ionText(e)}. <b>Block:</b> ${block(e)}.</p>`;
    if(hon)h+=`<p><b>Electron configuration:</b> ${CL.configText(e.Z,{noble:true})}${ap?' &nbsp;(full: '+CL.configText(e.Z)+')':''}</p>`;
    if(ap)h+=`<p><b>Electronegativity</b> ${e.en===null?'none (no stable bonds)':e.en} · <b>covalent radius</b> ${e.radius===null?'unknown':e.radius+' pm'} · <b>first ionization energy</b> ${e.ie1===null?'unknown':e.ie1+' kJ/mol'}</p>
      <p><b>Melting point</b> ${m.sub?'sublimes at '+m.mp+' °C':m.mp===null?(e.Z===2?'never freezes at 1 atm':'unknown'):m.mp+' °C'} · <b>boiling point</b> ${m.sub?'(sublimes)':m.bp===null?'unknown':m.bp+' °C'}${EST.includes(e.Z)?' (estimated)':''}</p>`;
    if(ap&&CL.isotopes[e.sym]){const iso=CL.isotopes[e.sym];h+=`<p><b>Natural isotopes:</b> ${Object.keys(iso).map(A=>CL.sup(A)+e.sym+' '+iso[A][1]+'%').join(', ')}</p>`;}
    if(sim.p.color==='state'){const c=countStates(T);h+=`<p class="help">At ${T} °C: ${c.s} solids, ${c.l} liquids, ${c.g} gases, ${c.u} not known.</p>`;}
    return h;},
  narrate(sim){const e=el(sim.p.el),m=sim.p.color,hon=atLeast('honors');
    if(sim.p.mode==='practice'){const pr=sim.st.pr;if(!pr)return '';if(pr.done)return pr.res&&pr.res.ok?`<b>${esc(pr.e.name)} is ${pr.e.sym}.</b> ${pr.e.sym[0]!==pr.e.name[0].toUpperCase()?'Its symbol comes from another name, so it is worth memorizing on its own.':'Its symbol starts with the first letter of its name.'}`:`<b>${esc(pr.e.name)} is ${pr.e.sym}</b>, in group ${pr.e.group}, period ${pr.e.period}. It is outlined on the table.`;
      return pr.dir==='find'?`Find <b>${esc(pr.e.name)}</b>. Hint: it is in period ${pr.e.period}${atLeast('honors')?'':''}.`:'Symbols are one or two letters: a capital, then lowercase. Some come from Latin names, like Na (natrium) for sodium.';}
    if(m==='state'){const c=countStates(sim.p.temp),s=stateAt(e.Z,sim.p.temp),mb=mpbp(e.Z);
      return `At <b>${sim.p.temp} °C</b>, ${c.l} element${c.l===1?' is':'s are'} liquid and ${c.g} are gases. ${e.name} is ${s==='u'?'unknown':STATE[s].n.toLowerCase()} here`+(mb.mp!==null&&!mb.sub?`: it melts at ${mb.mp} °C`+(mb.bp!==null?` and boils at ${mb.bp} °C.`:'.'):mb.sub?`: it sublimes at ${mb.mp} °C.`:'.');}
    if(m==='valence'){const v=valenceOf(e);return v===null?`${e.name} is in the ${block(e)} block, where the valence count is not a simple group number. <b>Main-group elements</b> have valence electrons equal to the last digit of the group number.`:`${e.name} is in group ${e.group}, so it has <b>${v} valence electron${v>1?'s':''}</b>. Every element in this column has the same number, which is why they react alike.`;}
    if(m==='ions')return `${e.name} forms <b>${ionText(e)}</b>. ${e.group===18?'A full outer shell means no ion.':CL.isMetal(e)?'Metals lose electrons, so their ions are positive.':'Nonmetals gain electrons until they have 8, so their ions are negative.'}`;
    if(m==='block')return `${e.name} is in the <b>${block(e)} block</b>: its last electron goes into a${block(e)==='s'?'n':''} ${block(e)} orbital. ${hon?'The blocks follow the filling order: s is 2 wide, p is 6, d is 10, f is 14.':''}`;
    if(m==='metal')return `${e.name} is a <b>${metalType(e)}</b>. Metals sit left of the staircase line, nonmetals to the right, and metalloids along it, with properties in between.`;
    if(m==='mass')return INV.has(e.Z)?`<b>${e.name} is part of a mass swap.</b> The table is ordered by protons (Z), not mass, so a few heavier elements come before lighter ones.`:`Mass mostly rises with Z because each new element adds a proton and usually more neutrons. ${e.name}: ${e.mass} g/mol.`;
    if(m==='family')return `${e.name} belongs to the <b>${FAM[family(e)][0].toLowerCase()}</b>. ${e.group===1&&e.Z>1?'They have 1 valence electron and react violently with water.':e.group===17?'They have 7 valence electrons and grab one more.':e.group===18?'Their outer shells are full, so they barely react.':e.group===2?'They have 2 valence electrons and form 2+ ions.':'Elements in a column share their outer-electron pattern.'}`;
    return `<b>${e.name} (${e.sym})</b>, atomic number ${e.Z}: ${e.Z} protons. It is ${/^[aeiou]/i.test(CL.CAT_NAMES[e.cat])?'an':'a'} ${CL.CAT_NAMES[e.cat].toLowerCase()} in period ${e.period}${e.group&&!(e.cat==='lanthanide'||e.cat==='actinide')?', group '+e.group:''}.`;},
  tour:[
    {title:'Periods are rows',text:'Each row is a period. Moving left to right adds one proton at a time. Every element in period 3 has electrons in 3 energy levels.',focus:[X0-4,Y0+2*C-4,18*C+8,C+8],pause:true,setup(sim){BioLab.setValues(sim,{mode:'explore',color:'cat',el:'Na'});}},
    {title:'Groups are columns',text:'Each column is a group. Elements in a group have the same number of valence electrons, so they react alike. Group 17, the halogens, all grab one electron.',focus:[X0+16*C-4,Y0-4,C+8,6*C+8],pause:true,setup(sim){BioLab.setValues(sim,{color:'family',el:'Cl'});}},
    {title:'Metals, nonmetals and metalloids',text:'The staircase line splits metals (left) from nonmetals (right). Metalloids sit along it. Most elements are metals.',focus:[X0+12*C-4,Y0-4,6*C+8,7*C+8],pause:true,setup(sim){BioLab.setValues(sim,{color:'metal',el:'Si'});}},
    {title:'The element card',text:'Click any square to see its card: atomic number (protons), symbol, name and molar mass. The mass is an average over the element’s natural isotopes.',focus:[CARD.x-4,CARD.y-4,CARD.w+8,CARD.h+8],pause:true,setup(sim){BioLab.setValues(sim,{color:'cat',el:'Fe'});}},
    {title:'Solid, liquid or gas',text:'At 25 °C most elements are solids, 11 are gases and only bromine and mercury are liquids. Slide the temperature and watch the states change.',focus:[X0-4,Y0-4,18*C+8,7*C+8],pause:true,setup(sim){BioLab.setValues(sim,{color:'state',temp:25,el:'Hg'});}},
    {lvl:'honors',title:'Valence electrons and ions',text:'Main-group elements gain or lose electrons to get 8 valence electrons. Group 1 forms 1+ ions, group 2 forms 2+, group 16 forms 2− and group 17 forms 1−.',focus:[X0-4,Y0-4,18*C+8,7*C+8],pause:true,setup(sim){BioLab.setValues(sim,{color:'ions',el:'O'});}},
    {lvl:'honors',title:'The blocks',text:'The table’s shape comes from the orbitals: the s block is 2 columns wide, p is 6, d is 10 and f is 14. The block tells you which kind of orbital the last electron fills.',focus:[X0-4,Y0-4,18*C+8,FY+2*C-Y0+8],pause:true,setup(sim){BioLab.setValues(sim,{color:'block',el:'Fe'});}},
    {lvl:'ap',title:'Ordered by protons',text:'Mendeleev ordered by mass. Moseley showed that atomic number is the true order, which fixes the pairs that would be swapped by mass, like Te and I.',focus:[CARD.x-4,CARD.y-4,CARD.w+8,CARD.h+8],pause:true,setup(sim){BioLab.setValues(sim,{color:'mass',el:'Te'});}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{color:'cat',el:'Na'});},
  lab:{bio:'<p><b>Question:</b> What do elements in the same group have in common?</p><ol><li>Color the table by <b>Families</b>.</li><li>Select each alkali metal (Li, Na, K, Rb, Cs) and press <b>Record trial</b> for each.</li><li>Do the same for the halogens (F, Cl, Br, I).</li><li>Switch to <b>State at a temperature</b> and note each one’s state at 25 °C.</li></ol><p>Describe one pattern you see going down a group.</p>',
       honors:'<p><b>Question:</b> How do valence electrons predict ion charges?</p><ol><li>Record trials for Na, Mg, Al, Si, P, S, Cl and Ar.</li><li>Color by <b>Valence electrons</b>, then by <b>Common ion charges</b>, and write both for each element.</li><li>Plot atomic number (x) against valence electrons (y) on the Trials graph.</li></ol><p>Write a rule that turns valence electrons into an ion charge, and name the elements that break it.</p>',
       ap:'<p><b>Question:</b> Is ionization energy periodic?</p><ol><li>Record trials for every element from H to Ca (Z = 1 to 20).</li><li>Plot Z (x) against first ionization energy (y) on the Trials graph.</li><li>Mark the peaks and the drops.</li></ol><p><b>Claim–evidence–reasoning:</b> Explain why each drop comes right after a noble gas, and why B and O sit below the trend, using electron configurations.</p>'},
  terms:[{t:'Period',d:'A row of the table. The period number is the number of occupied energy levels.'},{t:'Group (family)',d:'A column of the table. Elements in a group have the same number of valence electrons and similar properties.'},
    {t:'Atomic number (Z)',d:'The number of protons. The table is in order of Z.'},{t:'Metal',d:'Shiny, conducts heat and electricity, bends, and loses electrons to form positive ions.'},{t:'Nonmetal',d:'Dull, a poor conductor, often a gas, and gains electrons to form negative ions.'},
    {t:'Metalloid',d:'An element with properties between a metal and a nonmetal: B, Si, Ge, As, Sb, Te.'},{t:'Alkali metals, alkaline earth metals, halogens, noble gases',d:'Groups 1, 2, 17 and 18.'},
    {lvl:'honors',t:'Valence electrons',d:'Electrons in the outermost energy level. They take part in bonding.'},{lvl:'honors',t:'Ion',d:'An atom that has gained or lost electrons, so it has a charge.'},{lvl:'honors',t:'s, p, d and f blocks',d:'Regions of the table named for the orbital that the last electron fills.'},
    {lvl:'ap',t:'Electronegativity',d:'How strongly an atom pulls shared electrons in a bond (Pauling scale).'},{lvl:'ap',t:'First ionization energy',d:'The energy to remove one electron from each atom in a mole of gaseous atoms.'}],
  about:'<p>Element data (molar mass, category, electronegativity, covalent radius, first ionization energy, state at 25 °C) come from ChemLab’s shared element table, so they match every other tool on the site. Electron configurations include the known exceptions (Cr, Cu, Mo, Ag, Au and others).</p><p>Melting and boiling points at 1 atm come from the CRC Handbook. Carbon and arsenic sublime at 1 atm, and helium never freezes at 1 atm. Values for astatine, francium, protactinium, neptunium and berkelium to einsteinium are estimates, and nothing is known for elements past 99, so they show as “not known.”</p><p>Simplifications: “common ion charges” lists the ions taught in first-year chemistry; many transition metals form more. Valence electrons are shown only for main-group elements. Lanthanum and actinium sit in group 3, and helium is placed with the noble gases even though it is an s-block element. The mass colors use a log scale.</p>',
  draw(sim,ctx,vdt,k){const P=PAL,small=k>1.3,cur=el(sim.p.el),pr=sim.p.mode==='practice'?sim.st.pr:null;ctx.fillStyle=P['cv-bg'];ctx.fillRect(0,0,800,600);
    // group numbers
    if(!small)for(let g=1;g<=18;g++){const y=g===1||g===18?Y0-8:g===2||g>=13?Y0+C-8:Y0+3*C-8;txt(ctx,String(g),X0+(g-0.5)*C,y,{s:12*k,w:700,c:P['cv-soft'],a:'center'});}
    if(!small)for(let r=1;r<=7;r++)txt(ctx,String(r),X0-8,Y0+(r-0.5)*C+1,{s:12*k,w:700,c:P['cv-soft'],a:'right',b:'middle'});
    // f-block labels
    txt(ctx,small?'La–Lu':'Lanthanides',X0+3*C-6,FY+C/2+1,{s:12*k,w:700,c:P['cv-soft'],a:'right',b:'middle'});txt(ctx,small?'Ac–Lr':'Actinides',X0+3*C-6,FY+1.5*C+1,{s:12*k,w:700,c:P['cv-soft'],a:'right',b:'middle'});
    const hideAnswer=pr&&!pr.done;
    CL.elements.forEach(e=>{const {x,y}=cellXY(e);const f=fillFor(sim,e);rr(ctx,x+1.5,y+1.5,C-3,C-3,5);ctx.fillStyle=f;ctx.fill();
      if(e.synthetic&&atLeast('honors')){ctx.strokeStyle='rgba(255,255,255,.55)';ctx.lineWidth=1.2;ctx.setLineDash([3,2]);rr(ctx,x+4,y+4,C-8,C-8,4);ctx.stroke();ctx.setLineDash([]);}
      const ink=CL.inkOn(f),val=valueFor(sim,e);
      if(small){txt(ctx,e.sym,x+C/2,y+C/2+1,{s:Math.min(12*k,e.sym.length>2?11*k:12*k),w:700,c:ink,a:'center',b:'middle'});}
      else{if(!val)txt(ctx,String(e.Z),x+4,y+13,{s:12,w:500,c:ink});txt(ctx,e.sym,x+C/2,y+(val?C/2-3:C/2+5),{s:16,w:700,c:ink,a:'center',b:'middle'});
        if(val)txt(ctx,val,x+C/2,y+C-5,{s:12,w:600,c:ink,a:'center'});}
      if(sim.p.color==='mass'&&INV.has(e.Z)){ctx.fillStyle='#e0a800';ctx.beginPath();ctx.arc(x+C-7,y+7,4,0,6.29);ctx.fill();ctx.strokeStyle='#5a4300';ctx.lineWidth=1;ctx.stroke();}});
    // staircase
    if(sim.p.color==='metal'||sim.p.color==='cat'){ctx.strokeStyle=P['cv-ink'];ctx.lineWidth=3.5;ctx.lineCap='round';ctx.beginPath();
      CL.elements.forEach(e=>{const g=CL.gridPos(e);if(g.row>7||g.col<13)return;const isM=CL.isMetal(e)&&e.cat!=='metalloid';const {x,y}=cellXY(e);
        const right=CL.elements.find(o=>{const q=CL.gridPos(o);return q.row===g.row&&q.col===g.col+1;});if(right&&isM&&!(CL.isMetal(right)&&right.cat!=='metalloid')){ctx.moveTo(x+C,y);ctx.lineTo(x+C,y+C);}
        const up=CL.elements.find(o=>{const q=CL.gridPos(o);return q.row===g.row-1&&q.col===g.col;});if(up&&isM&&!(CL.isMetal(up)&&up.cat!=='metalloid')){ctx.moveTo(x,y);ctx.lineTo(x+C,y);}});ctx.stroke();ctx.lineCap='butt';}
    // selection and practice marks
    const mark=(e,col,w)=>{const {x,y}=cellXY(e);ctx.strokeStyle=col;ctx.lineWidth=w;rr(ctx,x-1,y-1,C+2,C+2,7);ctx.stroke();};
    if(pr){if(pr.done){if(pr.clicked&&pr.clicked!==pr.e.Z)mark(CL.el(pr.clicked),'#b3261e',4);mark(pr.e,pr.res&&pr.res.ok?'#1b7339':P['s4'],4.5);}}
    else{mark(cur,P['cv-ink'],4);mark(cur,P['cv-bg'],1.5);}
    // card
    drawCard(sim,ctx,k,small,cur,pr);
    // legend
    const items=legendItems(sim);const ly=FY+2*C+14;const cols=small?2:items.length>8?4:items.length>4?4:items.length;const cw=776/cols,lh=small?30:24;
    items.forEach((it,i)=>{const cx=12+(i%cols)*cw,cy=ly+Math.floor(i/cols)*lh+lh/2;if(cy>596)return;if(it.dot){ctx.fillStyle=it.c;ctx.beginPath();ctx.arc(cx+8,cy,6,0,6.29);ctx.fill();}else{rr(ctx,cx,cy-8,18,16,4);ctx.fillStyle=it.c;ctx.fill();}
      const z=fitTxt(ctx,it.l,cw-30,13*k,12*k);txt(ctx,it.l,cx+24,cy+1,{s:z,c:P['cv-ink'],b:'middle'});});
    if(sim.p.color==='state'){const c=countStates(sim.p.temp);const s=`${sim.p.temp} °C: ${c.s} solid · ${c.l} liquid · ${c.g} gas`;txt(ctx,s,788,ly+Math.ceil(items.length/cols)*lh+14,{s:13*k,w:700,c:P['cv-soft'],a:'right'});}
  },
  thumbSetup(sim){sim.p.color='family';sim.p.el='Fe';}
};
function fitTxt(ctx,s,maxW,size,min){let z=size;ctx.font='400 '+z+'px '+FONT;while(ctx.measureText(s).width>maxW&&z>min){z-=0.5;ctx.font='400 '+z+'px '+FONT;}return z;}
function drawCard(sim,ctx,k,small,e,pr){const P=PAL,B=CARD;rr(ctx,B.x,B.y,B.w,B.h,10);ctx.fillStyle=P['card'];ctx.fill();ctx.strokeStyle=P['line'];ctx.lineWidth=1;ctx.stroke();
  if(pr){const q=pr.e;const lead=pr.dir==='find'?'Find:':pr.dir==='n2s'?'Symbol for:':'Name for:';const shown=pr.dir==='s2n'?q.sym:q.name;
    txt(ctx,lead,B.x+14,B.y+24,{s:13*k,w:700,c:P['cv-soft']});let z=34*Math.min(k,1.3);ctx.font='700 '+z+'px '+FONT;while(ctx.measureText(shown).width>B.w-28&&z>14)z-=1;txt(ctx,shown,B.x+14,B.y+B.h/2+8,{s:z,w:700,b:'middle'});
    let msg=pr.done?(pr.res.ok?'Correct: '+q.name+' is '+q.sym:'It is '+q.sym+', '+q.name):sim.st.tries?sim.st.right+' of '+sim.st.tries+' correct':'';const col=pr.done?(pr.res.ok?P['s3']:P['s1']):P['cv-soft'];
    if(msg){const z2=fitTxt(ctx,msg,B.w-28,13*k,12*k);txt(ctx,msg,B.x+14,B.y+B.h-12,{s:z2,w:700,c:col});}return;}
  const f=fillFor(sim,e),bw=small?104:96;rr(ctx,B.x+8,B.y+8,bw,B.h-16,8);ctx.fillStyle=f;ctx.fill();const ink=CL.inkOn(f);
  txt(ctx,String(e.Z),B.x+16,B.y+12+12*Math.min(k,1.4),{s:12*Math.min(k,1.4),w:700,c:ink});txt(ctx,e.sym,B.x+8+bw/2,B.y+B.h/2+2,{s:small?40:38,w:800,c:ink,a:'center',b:'middle'});
  txt(ctx,e.mass>=100?e.mass.toFixed(2):e.mass.toFixed(3),B.x+8+bw/2,B.y+B.h-16,{s:12*Math.min(k,1.4),w:600,c:ink,a:'center'});
  const tx=B.x+bw+20,tw=B.w-bw-30;const hon=atLeast('honors'),ap=atLeast('ap');
  const lines=[{t:e.name,s:18,w:800,c:P['cv-ink']},{t:CL.CAT_NAMES[e.cat]+(e.synthetic?' · synthetic':''),s:13,w:600,c:P['cv-soft']}];
  if(small){lines.push({t:(e.cat==='lanthanide'||e.cat==='actinide'?'f block':'Group '+e.group)+' · Period '+e.period,s:13,c:P['cv-soft']});}
  else{lines.push({t:(e.cat==='lanthanide'||e.cat==='actinide'?'f block':'Group '+e.group)+' · Period '+e.period+' · '+e.mass+' g/mol',s:13,c:P['cv-ink']});
    if(sim.p.color==='state'){const s=stateAt(e.Z,sim.p.temp),m=mpbp(e.Z);lines.push({t:(s==='u'?'State not known':STATE[s].n)+' at '+sim.p.temp+' °C'+(m.sub?' · sublimes '+m.mp+' °C':m.mp!==null?' · mp '+m.mp+' °C'+(m.bp!==null?', bp '+m.bp+' °C':''):''),s:13,w:700,c:P['cv-ink']});}
    if(hon)lines.push({t:'Valence e⁻: '+(valenceOf(e)===null?'varies':valenceOf(e))+' · Ions: '+ionText(e),s:13,c:P['cv-ink']});
    if(hon)lines.push({t:CL.configText(e.Z,{noble:true}),s:13,c:P['cv-ink']});
    if(ap)lines.push({t:'EN '+(e.en===null?'—':e.en)+' · r '+(e.radius===null?'—':e.radius+' pm')+' · IE₁ '+(e.ie1===null?'—':e.ie1+' kJ/mol'),s:13,c:P['cv-ink']});}
  const kk=small?k:1;let y=B.y+8;const avail=B.h-12;let tot=lines.reduce((a,l)=>a+Math.max(l.s,12)*kk*1.22,0);const shrink=tot>avail?avail/tot:1;
  lines.forEach(l=>{const z=Math.max(12*kk,l.s*kk*shrink);const zz=fitTxt(ctx,l.t,tw,z,Math.min(z,11));y+=z*1.2;txt(ctx,l.t,tx,y-z*0.25,{s:zz,w:l.w||400,c:l.c});});}
BioLab.register(SIM);
})();
