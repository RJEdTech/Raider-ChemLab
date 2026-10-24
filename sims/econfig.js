(function(){
'use strict';
const {clamp,lerp,rr,txt,pill,atLeast,PAL,FONT,RM,axes,legend,serColor,lvText}=BioLab.h;
const CL=window.ChemLab;

/* ---------- sublevels in filling (Aufbau) order ---------- */
const SUB=['1s','2s','2p','3s','3p','4s','3d','4p','5s','4d','5p'].map((lab,i)=>{const n=+lab[0],l='spdf'.indexOf(lab[1]);return {lab,n,l,nb:2*l+1,cap:4*l+2,i};});
const SUBI={};SUB.forEach(s=>SUBI[s.lab]=s);
const NOBLE=[2,10,18,36];
const EXC=[24,29,41,42,44,45,46,47];          // exceptions inside Z ≤ 54 (ChemLab.config applies them)
const SUPN=n=>CL.sup(n);
const fmtQ=q=>q===0?'':CL.sup((Math.abs(q)===1?'':Math.abs(q))+(q>0?'+':'-'));
const MAXZ=54;

/* ---------- layout ---------- */
const BOX=28,GAP=2,ROW=35,Y0=418;
const COLX=[70,150,284];
const rowY=s=>Y0-s.i*ROW;
function boxRect(s,b){return [COLX[s.l]+b*(BOX+GAP),rowY(s)-BOX/2,BOX,BOX];}
const PTX=476,CS=17.4;                 // mini periodic table
const ptY=k=>16+14*k;

/* ---------- target (ground state) ---------- */
function counts(cfg){const c={};SUB.forEach(s=>c[s.lab]=0);cfg.forEach(o=>{if(c[o.label]!==undefined)c[o.label]+=o.e;});return c;}
function targetCounts(Z,q){const N=Math.max(0,Z-q);
  if(q<=0){return counts(q===0?CL.config(Z):CL.config(N,{aufbauOnly:true}));}
  const c=counts(CL.config(Z));let left=q;const ord=SUB.slice().sort((a,b)=>b.n-a.n||b.l-a.l);
  for(const s of ord){while(left>0&&c[s.lab]>0){c[s.lab]--;left--;}}return c;}
const aufbauCounts=N=>counts(CL.config(N,{aufbauOnly:true}));
// Box arrangement for a count: Hund's rule (all up first, left to right), then pair.
function arrange(s,e){const bx=[];for(let b=0;b<s.nb;b++)bx.push([]);for(let i=0;i<e;i++){if(i<s.nb)bx[i].push(1);else bx[i-s.nb].push(-1);}return bx;}

/* ---------- state helpers ---------- */
function emptyOcc(){const o={};SUB.forEach(s=>{o[s.lab]=[];for(let b=0;b<s.nb;b++)o[s.lab].push([]);});return o;}
const nPlaced=st=>SUB.reduce((a,s)=>a+st.occ[s.lab].reduce((x,b)=>x+b.length,0),0);
const subCount=(st,lab)=>st.occ[lab].reduce((x,b)=>x+b.length,0);
const placedCounts=st=>{const c={};SUB.forEach(s=>c[s.lab]=subCount(st,s.lab));return c;};
const same=(a,b)=>SUB.every(s=>a[s.lab]===b[s.lab]);
const need=p=>Math.max(0,p.Z-p.charge);
const el=p=>CL.el(p.Z);
function ionName(p){const e=el(p);if(p.charge===0)return e.name;return e.sym+fmtQ(p.charge)+' ion';}
function symQ(p){return el(p).sym+fmtQ(p.charge);}
function cfgText(c,noble){let core='',skip={};
  if(noble){const N=SUB.reduce((a,s)=>a+c[s.lab],0);for(const ng of NOBLE.slice().reverse()){if(ng>N)continue;const cc=aufbauCounts(ng);if(SUB.every(s=>cc[s.lab]===0||c[s.lab]===cc[s.lab])&&ng<N||ng===N&&SUB.every(s=>cc[s.lab]===0||c[s.lab]===cc[s.lab])){if(ng===N){return '['+CL.el(ng).sym+']';}core='['+CL.el(ng).sym+'] ';SUB.forEach(s=>{if(cc[s.lab])skip[s.lab]=1;});break;}}}
  const parts=SUB.filter(s=>c[s.lab]>0&&!skip[s.lab]).map(s=>s.lab+SUPN(c[s.lab]));return (core+parts.join(' ')).trim()||'none yet';}

/* ---------- the rules check ---------- */
function check(sim){const p=sim.p,st=sim.st,N=nPlaced(st),Nt=need(p),c=placedCounts(st),T=targetCounts(p.Z,p.charge);const bad=[];
  if(N===0)return {code:'empty',bad,short:'Place the first electron',msg:'No electrons yet. '+ionName(p).replace(/^./,m=>m.toUpperCase())+' needs <b>'+Nt+'</b>. Start at the bottom: the lowest energy orbital, 1s.'};
  if(N>Nt)return {code:'toomany',bad,short:'Too many electrons',msg:'You placed '+N+' electrons, but '+symQ(p)+' has only <b>'+Nt+'</b>. Remove '+(N-Nt)+'.'};
  for(const s of SUB){st.occ[s.lab].forEach((b,i)=>{if(b.length===2&&b[0]===b[1])bad.push(s.lab+':'+i);});}
  if(bad.length){const k=bad[0].split(':');return {code:'pauli',bad,short:'Pauli rule broken',msg:'<b>Pauli exclusion principle:</b> two electrons in one orbital must have opposite spins (↑↓). The '+k[0]+' orbital has two with the same spin.'};}
  for(const s of SUB){const bx=st.occ[s.lab];if(bx.some(b=>b.length===2)&&bx.some(b=>b.length===0)){bx.forEach((b,i)=>{if(b.length===2)bad.push(s.lab+':'+i);});
      return {code:'hund',bad,short:'Hund’s rule broken',msg:'<b>Hund’s rule:</b> in '+s.lab+', put one electron in each orbital before you pair any up. There is an empty '+s.lab+' orbital while another holds a pair.'};}
    const singles=bx.map((b,i)=>b.length===1?b[0]:0).filter(v=>v);if(singles.length>1&&singles.some(v=>v!==singles[0])){bx.forEach((b,i)=>{if(b.length===1)bad.push(s.lab+':'+i);});
      return {code:'hundspin',bad,short:'Hund’s rule: spins',msg:'<b>Hund’s rule:</b> unpaired electrons in the same sublevel ('+s.lab+') should all spin the same way. Flip one so they match.'};}}
  const relax=p.charge>0||(p.charge===0&&EXC.includes(p.Z));
  let auf=null;for(const s of SUB){if(c[s.lab]===0)continue;for(const j of SUB){if(j.i>=s.i)break;if(c[j.lab]<j.cap){if(relax&&j.l===0&&s.l===2&&s.n===j.n-1)continue;if(relax&&j.l===0&&s.l===1&&s.n===j.n-1&&false)continue;auf={hi:s,lo:j};break;}}if(auf)break;}
  if(auf){bad.push(auf.hi.lab);if(N===Nt)return {code:'excited',bad,short:'Excited state',msg:'Every electron is placed, but one sits in <b>'+auf.hi.lab+'</b> while <b>'+auf.lo.lab+'</b> still has room. That is an <b>excited state</b>: real, but not the ground state. The Aufbau principle fills '+auf.lo.lab+' first.'};
    return {code:'aufbau',bad,short:'Aufbau: fill '+auf.lo.lab+' first',msg:'<b>Aufbau principle:</b> electrons fill the lowest energy sublevel first. '+auf.lo.lab+' has room, so it comes before '+auf.hi.lab+'.'};}
  if(N<Nt)return {code:'progress',bad,short:(Nt-N)+' more to go',msg:'So far every rule holds. '+symQ(p)+' needs <b>'+(Nt-N)+' more</b> electron'+(Nt-N===1?'':'s')+'.'};
  if(same(c,T)){let m='This is the <b>ground state of '+symQ(p)+'</b>: '+cfgText(T,true)+'.';
    if(p.charge>0&&!same(T,aufbauCounts(Nt)))m+=' For a cation, electrons leave the <b>highest n</b> first, so the '+SUB.filter(s=>s.l===0&&T[s.lab]<aufbauCounts(Nt)[s.lab]).map(s=>s.lab).join(', ')+' electrons went before any d electrons.';
    else if(p.charge===0&&EXC.includes(p.Z))m+=' This element is an <b>exception</b>: a half-filled or filled d sublevel is extra stable, so one s electron moves into d.';
    return {code:'ground',bad,short:'Ground state ✓',msg:m};}
  if(p.charge===0&&EXC.includes(p.Z)&&same(c,aufbauCounts(Nt)))return {code:'exception',bad,short:'Rules followed (see note)',msg:'You followed every rule. Measurements show real '+el(p).name.toLowerCase()+' is <b>'+cfgText(T,true)+'</b>: one s electron moves into d, because a half-filled or filled d sublevel is extra stable.'};
  if(p.charge>0)return {code:'ion',bad,short:'Ion: remove from highest n',msg:'Close. To make a cation, start from the neutral atom and remove electrons from the <b>highest n</b> first. '+symQ(p)+' is <b>'+cfgText(T,true)+'</b>.'};
  return {code:'other',bad,short:'Not the ground state',msg:'All electrons are placed, but this is not the ground state. The ground state of '+symQ(p)+' is '+cfgText(T,true)+'.'};}

/* ---------- actions ---------- */
function clearAll(sim){const st=sim.st;st.occ=emptyOcc();st.hist=[];st.q=[];st.fresh=null;}
function addAt(sim,lab,b,spin){const st=sim.st,bx=st.occ[lab][b];if(bx.length>=2){st.note='That orbital is full. An orbital holds at most two electrons.';return false;}
  bx.push(spin);st.hist.push({lab,b});st.fresh={lab,b,t:0.35};st.note='';return true;}
function removeAt(sim,lab,b){const st=sim.st,bx=st.occ[lab][b];if(!bx.length)return false;bx.pop();for(let i=st.hist.length-1;i>=0;i--){if(st.hist[i].lab===lab&&st.hist[i].b===b){st.hist.splice(i,1);break;}}return true;}
function nextByRules(sim){const p=sim.p,st=sim.st,T=targetCounts(p.Z,p.charge);if(nPlaced(st)>=need(p))return null;
  for(const s of SUB){const e=subCount(st,s.lab);if(e>=T[s.lab])continue;const bx=st.occ[s.lab];let b=bx.findIndex(x=>x.length===0);if(b>=0)return {lab:s.lab,b,spin:1};
    b=bx.findIndex(x=>x.length===1);if(b>=0)return {lab:s.lab,b,spin:-bx[b][0]};}return null;}
function fillPlan(sim){const p=sim.p,T=targetCounts(p.Z,p.charge),plan=[];SUB.forEach(s=>{const bx=arrange(s,T[s.lab]);const n=T[s.lab];for(let i=0;i<n;i++){if(i<s.nb)plan.push({lab:s.lab,b:i,spin:1});else plan.push({lab:s.lab,b:i-s.nb,spin:-1});}});return plan;}
function fillNow(sim){clearAll(sim);fillPlan(sim).forEach(x=>addAt(sim,x.lab,x.b,x.spin));sim.st.fresh=null;}
function fillAnimated(sim){clearAll(sim);sim.st.q=fillPlan(sim);sim.st.qt=0;}
function slotOf(p){const [lab,b]=String(p.slot).split(':');return {lab,b:+b};}
function lastE(st){const h=st.hist[st.hist.length-1];if(!h)return null;const s=SUBI[h.lab],bx=st.occ[h.lab][h.b];return {s,b:h.b,ml:h.b-s.l,ms:bx[bx.length-1]};}
function unpaired(st){return SUB.reduce((a,s)=>a+st.occ[s.lab].filter(b=>b.length===1).length,0);}
function valenceOf(p){const T=targetCounts(p.Z,p.charge);let maxn=0;SUB.forEach(s=>{if(T[s.lab]>0)maxn=Math.max(maxn,s.n);});return SUB.filter(s=>s.n===maxn).reduce((a,s)=>a+T[s.lab],0);}

function sync(sim){const d=sim.def;if(!sim.ui||!sim.ui.sec)return;const o=document.getElementById(d.id+'-Z-out');if(o){const e=el(sim.p);o.textContent=sim.p.Z+' · '+e.sym+' ('+e.name.toLowerCase()+')';}}
function onTarget(sim){if(sim.p.Z-sim.p.charge<0)BioLab.setValues(sim,{charge:0});if(sim.st)clearAll(sim);sync(sim);}

const SLOTS=[];SUB.forEach(s=>{for(let b=0;b<s.nb;b++)SLOTS.push({v:s.lab+':'+b,l:s.lab+(s.nb>1?' orbital '+(b+1)+' of '+s.nb+(s.l?' (mℓ = '+(b-s.l>0?'+':b-s.l<0?'−':'')+Math.abs(b-s.l)+')':''):'')});});

const SIM={
  id:'econfig',hash:'econfig',apUnit:3,order:3,tab:'Electron configurations',kind:'Learning tool',
  prereq:['atombuilder','spectra'],next:['ptable','trends','pes'],
  card:'Drop electrons into orbital boxes one at a time. The rules check flags Aufbau, Pauli and Hund mistakes and writes the configuration for you.',
  title:'Electron configurations: filling orbitals',
  lede:{bio:'Electrons fill an atom from the lowest energy up, two to an orbital, spreading out before they pair. Build an atom one electron at a time and the rules check tells you if you broke a rule.',
        honors:'Write full and noble-gas configurations, build ions (electrons leave from the highest n first), and see how the periodic table’s s, p and d blocks match the orbitals being filled.',
        ap:'Add the exceptions (Cr, Cu, Mo, Ag), count unpaired electrons to predict paramagnetism, and give the four quantum numbers of the last electron.'},
  scale:{bio:'Each box is one orbital, a region that holds up to two electrons. Rows higher on the diagram have higher energy. This covers hydrogen through xenon (Z = 1 to 54).',
         honors:'Rows are in Aufbau order (1s, 2s, 2p, 3s, 3p, 4s, 3d, 4p, 5s, 4d, 5p). The spacing is even for readability; real gaps between sublevels vary.'},
  timeless:true,animated:true,chChange:0.5,chReveal:1.5,
  controls:[
    {id:'Z',label:'Element (atomic number)',type:'range',min:1,max:MAXZ,step:1,def:8,lvl:'bio',onChange:onTarget},
    {id:'charge',label:'Ion charge',type:'range',min:-3,max:3,step:1,def:0,lvl:'honors',help:'Positive ions lose electrons; negative ions gain them.',onChange:onTarget},
    {id:'view',label:'Draw it as',type:'seg',def:'boxes',lvl:'bio',options:[{v:'boxes',l:'Orbital boxes'},{v:'hotel',l:'Hotel Aufbau'}],noTrial:true},
    {id:'spin',label:'Spin of the next electron you place',type:'seg',def:'up',lvl:'bio',options:[{v:'up',l:'↑ up'},{v:'down',l:'↓ down'}],noTrial:true,help:'Click a box on the diagram to place an electron there. Click a full box to take one out.'},
    {id:'slot',label:'Orbital (keyboard placing)',type:'select',def:'1s:0',lvl:'bio',options:SLOTS,noTrial:true}
  ],
  actions:[
    {id:'next',label:'Next electron by the rules',lvl:'bio',primary:true,run(sim){const n=nextByRules(sim);sim.st.q=[];if(n)addAt(sim,n.lab,n.b,n.spin);}},
    {id:'fill',label:'Fill the whole atom',lvl:'bio',run(sim){fillAnimated(sim);}},
    {id:'add',label:'Add to chosen orbital',lvl:'bio',run(sim){const s=slotOf(sim.p);sim.st.q=[];addAt(sim,s.lab,s.b,sim.p.spin==='down'?-1:1);}},
    {id:'rem',label:'Remove from chosen orbital',lvl:'bio',run(sim){const s=slotOf(sim.p);sim.st.q=[];removeAt(sim,s.lab,s.b);}},
    {id:'undo',label:'Undo',lvl:'bio',run(sim){const st=sim.st;st.q=[];const h=st.hist[st.hist.length-1];if(h)removeAt(sim,h.lab,h.b);}},
    {id:'clear',label:'Clear',lvl:'bio',run(sim){clearAll(sim);}}
  ],
  init(sim){return {occ:emptyOcc(),hist:[],q:[],qt:0,fresh:null,note:''};},
  step(sim,dt){const st=sim.st;if(st.fresh){st.fresh.t-=dt;if(st.fresh.t<=0)st.fresh=null;}
    if(st.q&&st.q.length){st.qt+=dt;while(st.q.length&&st.qt>=0.11){st.qt-=0.11;const x=st.q.shift();addAt(sim,x.lab,x.b,x.spin);}sim.infoDirty=true;}},
  onClick(sim,x,y){const st=sim.st;for(const s of SUB){for(let b=0;b<s.nb;b++){const r=boxRect(s,b);if(x>=r[0]-2&&x<=r[0]+r[2]+2&&y>=r[1]-3&&y<=r[1]+r[3]+3){st.q=[];
          if(st.occ[s.lab][b].length>=2)removeAt(sim,s.lab,b);else addAt(sim,s.lab,b,sim.p.spin==='down'?-1:1);BioLab.setValues(sim,{slot:s.lab+':'+b});sim.infoDirty=true;return;}}}},
  metrics:[
    {id:'elem',label:'Building',lvl:'bio',text:true,get:s=>{const e=el(s.p);return s.p.charge===0?e.name+' ('+e.sym+'), Z = '+e.Z:symQ(s.p)+', an ion of '+e.name.toLowerCase();}},
    {id:'placed',label:'Electrons placed',lvl:'bio',min:0,max:null,d:0,get:s=>nPlaced(s.st)},
    {id:'needed',label:'Electrons needed',lvl:'bio',min:0,max:null,d:0,get:s=>need(s.p)},
    {id:'rule',label:'Rules check',lvl:'bio',text:true,get:s=>check(s).short},
    {id:'full',label:'Configuration so far',lvl:'bio',text:true,get:s=>cfgText(placedCounts(s.st),false)},
    {id:'noble',label:'Noble-gas notation',lvl:'honors',text:true,get:s=>cfgText(placedCounts(s.st),true)},
    {id:'val',label:'Electrons in the outermost shell (ground state)',lvl:'bio',min:0,max:8,d:0,get:s=>valenceOf(s.p)},
    {id:'unp',label:'Unpaired electrons placed',lvl:'ap',min:0,max:null,d:0,get:s=>unpaired(s.st)},
    {id:'mag',label:'Magnetism',lvl:'ap',text:true,get:s=>{const n=nPlaced(s.st);if(!n)return 'no electrons yet';return unpaired(s.st)?'Paramagnetic (attracted to a magnet)':'Diamagnetic (all electrons paired)';}},
    {id:'qn',label:'Quantum numbers of the last electron added',lvl:'ap',text:true,noTrial:true,get:s=>{const L=lastE(s.st);if(!L)return 'no electrons yet';return 'n = '+L.s.n+', ℓ = '+L.s.l+', mℓ = '+(L.ml>0?'+':L.ml<0?'−':'')+Math.abs(L.ml)+', mₛ = '+(L.ms>0?'+½':'−½');}}
  ],
  graph:false,
  infoPanel(sim){const p=sim.p,st=sim.st,ch=check(sim),hon=atLeast('honors'),ap=atLeast('ap');const T=targetCounts(p.Z,p.charge);
    let h='<div class="p-head"><h3>Rules check</h3></div><p>'+ch.msg+'</p>';if(st.note)h+='<p><b>'+st.note+'</b></p>';
    h+='<p><b>The three rules.</b> Aufbau: fill the lowest energy sublevel first. Pauli: at most two electrons per orbital, with opposite spins. Hund: in a sublevel, one electron per orbital (same spin) before any pair.</p>';
    if(hon)h+='<p><b>Answer key for '+symQ(p)+':</b> '+cfgText(T,false)+(cfgText(T,true)!==cfgText(T,false)?' = '+cfgText(T,true):'')+'</p>';
    if(p.view==='hotel')h+='<p><b>Hotel Aufbau:</b> each floor is a sublevel, each room an orbital. Guests take the cheapest (lowest) floor first, take empty rooms before sharing, and roommates sleep head to toe.</p>';
    return h;},
  narrate(sim){const p=sim.p,st=sim.st,ch=check(sim),L=lastE(st);let s='';
    if(st.q&&st.q.length&&L)return 'Filling '+symQ(p)+' by the rules. The last electron went into <b>'+L.s.lab+'</b>, the lowest-energy sublevel with room. '+st.q.length+' to go.';
    if(st.note)s='<b>'+st.note+'</b> ';
    return s+ch.msg;},
  tour:[
    {title:'Energy levels and orbitals',text:{bio:'Each box is an orbital that can hold two electrons. Rows are sublevels (1s, 2s, 2p…), and higher rows have higher energy. The arrow at the left points uphill in energy.',honors:'s sublevels have 1 orbital, p have 3, d have 5. So s holds 2 electrons, p holds 6, d holds 10.'},focus:[8,50,440,392],speed:1,setup(sim){BioLab.setValues(sim,{Z:1,charge:0,view:'boxes'});clearAll(sim);}},
    {title:'Aufbau: start at the bottom',text:'Hydrogen’s one electron goes into 1s, the lowest-energy orbital. Electrons always take the lowest energy spot available.',focus:[30,Y0-24,120,48],speed:1,setup(sim){BioLab.setValues(sim,{Z:1});fillAnimated(sim);}},
    {title:'Pauli: two per orbital, opposite spins',text:'Helium’s second electron joins the first in 1s, spinning the other way (↑↓). No orbital holds more than two, and the two must have opposite spins.',focus:[30,Y0-24,120,48],speed:1,setup(sim){BioLab.setValues(sim,{Z:2});fillAnimated(sim);}},
    {title:'Hund: spread out before pairing',text:'Nitrogen’s three 2p electrons each take their own orbital, all spinning the same way. Like passengers on a bus, they take empty seats before sharing.',focus:[30,rowY(SUBI['2p'])-22,240,80],speed:1,setup(sim){BioLab.setValues(sim,{Z:7});fillAnimated(sim);}},
    {title:'4s fills before 3d',text:'Potassium’s 19th electron goes into 4s, not 3d. The 4s sublevel is lower in energy for these atoms, which is why row 4 of the periodic table starts with K and Ca.',focus:[30,rowY(SUBI['3d'])-22,410,60],speed:1,setup(sim){BioLab.setValues(sim,{Z:19});fillAnimated(sim);}},
    {title:'The periodic table is a map',text:{bio:'The blocks of the periodic table match the sublevel being filled: s on the left, d in the middle, p on the right. The yellow dot marks the element with as many electrons as you placed.',honors:'Iron sits in the d block, period 4, so its last electrons go into 3d. Read the noble-gas notation off the table: [Ar] then the row-4 sublevels.'},focus:[PTX-8,4,322,124],speed:1,setup(sim){BioLab.setValues(sim,{Z:26});fillAnimated(sim);}},
    {lvl:'honors',title:'Ions: remove from the highest n',text:'Fe²⁺ has 24 electrons, but not the configuration of chromium. Start from iron and remove the two 4s electrons first, because n = 4 is the outermost shell. Fe²⁺ is [Ar] 3d⁶.',focus:[30,rowY(SUBI['3d'])-22,410,60],speed:1,setup(sim){BioLab.setValues(sim,{Z:26,charge:2});fillAnimated(sim);}},
    {lvl:'ap',title:'Exceptions: chromium and copper',text:'Real chromium is [Ar] 4s¹ 3d⁵, not 4s² 3d⁴. A half-filled d sublevel is extra stable, so one 4s electron moves to 3d. Copper does the same to fill 3d: [Ar] 4s¹ 3d¹⁰.',focus:[30,rowY(SUBI['3d'])-22,410,60],speed:1,setup(sim){BioLab.setValues(sim,{Z:24,charge:0});fillAnimated(sim);}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{Z:8,charge:0,view:'boxes'});clearAll(sim);},
  onChallenge(sim,ch,phase){if(ch&&ch.set&&phase==='done'){BioLab.setValues(sim,ch.set);fillNow(sim);sim.infoDirty=true;}},
  challenges:[
    {lvl:'bio',instant:true,set:{Z:3,charge:0},q:'Lithium has 3 electrons. Where does the third one go?',choices:['Into 1s, next to the first two','Into 2s','Into 2p'],correct:1,
     explain:{bio:'1s already holds two electrons, and no orbital can hold three (Pauli). The next lowest energy orbital is 2s, so lithium is 1s² 2s¹. The model now shows lithium.'}},
    {lvl:'bio',instant:true,set:{Z:6,charge:0},q:'Carbon has 2 electrons in its 2p sublevel. How do they sit?',choices:['Paired in one 2p orbital, opposite spins','In two separate 2p orbitals, same spin','In two separate 2p orbitals, opposite spins'],correct:1,
     explain:{bio:'Hund’s rule: electrons spread out into empty orbitals before pairing, and unpaired electrons in a sublevel spin the same way. The model now shows carbon: 1s² 2s² 2p², with two up arrows in 2p.'}},
    {lvl:'bio',instant:true,set:{Z:19,charge:0},q:'Potassium has 19 electrons. After 3p is full, where does the 19th electron go?',choices:['3d','4s','4p'],correct:1,
     explain:{bio:'4s is lower in energy than 3d for potassium, so it fills first: [Ar] 4s¹. That is why potassium starts row 4 of the periodic table in the s block. The model now shows potassium.'}},
    {lvl:'honors',instant:true,set:{Z:26,charge:2},q:'Iron is [Ar] 4s² 3d⁶. When it forms Fe²⁺, which electrons does it lose?',choices:['Two 3d electrons','Two 4s electrons','One 4s and one 3d'],correct:1,
     explain:{honors:'Electrons leave from the highest n first. 4s (n = 4) is outside 3d (n = 3), so Fe²⁺ is [Ar] 3d⁶, not [Ar] 4s² 3d⁴. The model shows Fe²⁺; the rules check confirms the ground state.'}},
    {lvl:'honors',instant:true,set:{Z:35,charge:0},q:'What is the noble-gas configuration of bromine (Z = 35)?',choices:['[Ar] 4s² 3d¹⁰ 4p⁵','[Kr] 4p⁵','[Ar] 4s² 4p⁵','[Ne] 3s² 3p⁵'],correct:0,
     explain:{honors:'Argon accounts for 18 electrons. The other 17 fill 4s (2), 3d (10) and 4p (5). Do not skip the 3d sublevel: bromine sits after the d block in row 4.'}},
    {lvl:'honors',instant:true,set:{Z:16,charge:0},q:'How many valence electrons does sulfur (1s² 2s² 2p⁶ 3s² 3p⁴) have?',choices:['2','4','6','16'],correct:2,
     explain:{honors:'Valence electrons are in the outermost shell, n = 3: 3s² 3p⁴ makes 6. That matches sulfur’s place in group 16 and its usual 2− charge (it gains 2 to reach 8).'}},
    {lvl:'ap',instant:true,set:{Z:24,charge:0},q:'What is the measured ground-state configuration of chromium (Z = 24)?',choices:['[Ar] 4s² 3d⁴','[Ar] 4s¹ 3d⁵','[Ar] 3d⁶','[Ar] 4s² 4p⁴'],correct:1,
     explain:{ap:'Chromium is an exception: [Ar] 4s¹ 3d⁵. Six unpaired electrons in nearly degenerate 4s and 3d orbitals lower the electron–electron repulsion and gain exchange energy. Copper (4s¹ 3d¹⁰) and molybdenum do the same.'}},
    {lvl:'ap',instant:true,set:{Z:26,charge:3},q:'How many unpaired electrons does Fe³⁺ have?',choices:['0','3','5','6'],correct:2,
     explain:{ap:'Fe³⁺ loses both 4s electrons and one 3d electron: [Ar] 3d⁵. By Hund’s rule each of the five 3d orbitals holds one electron, so there are 5 unpaired electrons and Fe³⁺ is strongly paramagnetic.'}},
    {lvl:'ap',instant:true,set:{Z:8,charge:0},q:'Which quantum numbers describe the last electron added to oxygen?',choices:['n = 2, ℓ = 1','n = 2, ℓ = 0','n = 1, ℓ = 1','n = 2, ℓ = 2'],correct:0,
     explain:{ap:'Oxygen’s last electron goes into 2p: n = 2 and ℓ = 1 (p). It is the first electron to pair in 2p, so mₛ = −½. ℓ can never equal n, so n = 1, ℓ = 1 and n = 2, ℓ = 2 are impossible.'}}
  ],
  lab:{bio:'<p><b>Question:</b> How do electrons fill an atom?</p><ol><li>Pick an element from the first three rows (Z = 1 to 18).</li><li>Place its electrons one at a time by clicking the boxes. Watch the Rules check after each one.</li><li>Record a trial when you reach the ground state. Repeat for five elements.</li></ol><p>Write the three rules (Aufbau, Pauli, Hund) in your own words, with one example of a mistake each rule would catch.</p>',
       honors:'<p><b>Question:</b> How does the periodic table predict configurations and ion charges?</p><ol><li>Build Na, Mg, Al, S and Cl. Record the noble-gas notation for each.</li><li>Build the ions Na⁺, Mg²⁺, Al³⁺, S²⁻ and Cl⁻. Record their configurations.</li><li>Build Fe, Fe²⁺ and Fe³⁺.</li></ol><p>Which noble gas does each main-group ion match? Explain why transition metal ions lose their 4s electrons first.</p>',
       ap:'<p><b>Question:</b> Can you predict magnetism from configuration?</p><ol><li>Build Sc³⁺, Ti²⁺, V³⁺, Cr³⁺, Mn²⁺, Fe²⁺, Co²⁺, Ni²⁺, Cu²⁺ and Zn²⁺.</li><li>Record unpaired electrons for each.</li><li>On the Trials graph, plot Element (x) against Unpaired electrons (y).</li></ol><p><b>Claim–evidence–reasoning:</b> Which ions are diamagnetic? Use the d-electron count and Hund’s rule to explain the pattern.</p>'},
  terms:[{t:'Orbital',d:'A region around the nucleus that holds up to two electrons.'},{t:'Sublevel',d:'A set of orbitals with the same n and shape: s (1 orbital), p (3), d (5), f (7).'},{t:'Aufbau principle',d:'Electrons fill the lowest energy orbitals first.'},
    {t:'Pauli exclusion principle',d:'An orbital holds at most two electrons, and they must have opposite spins.'},{t:'Hund’s rule',d:'Within a sublevel, electrons occupy empty orbitals one at a time with the same spin before pairing.'},{t:'Valence electrons',d:'Electrons in the outermost shell (highest n).'},
    {lvl:'honors',t:'Noble-gas notation',d:'A shorthand that replaces the core electrons with the previous noble gas: [Ne] 3s¹ for sodium.'},{lvl:'honors',t:'Cation configuration',d:'Remove electrons from the highest n first; for transition metals, ns goes before (n−1)d.'},
    {lvl:'ap',t:'Quantum numbers',d:'n (shell), ℓ (shape: 0 = s, 1 = p, 2 = d), mℓ (orientation, −ℓ to +ℓ), mₛ (spin, +½ or −½).'},{lvl:'ap',t:'Paramagnetic',d:'Has unpaired electrons, so it is pulled into a magnetic field. Diamagnetic substances have all electrons paired.'}],
  about:'<p>Ground states come from ChemLab’s configuration table: Aufbau order (1s, 2s, 2p, 3s, 3p, 4s, 3d, 4p, 5s, 4d, 5p) with the measured exceptions for Z ≤ 54 (Cr, Cu, Nb, Mo, Ru, Rh, Pd, Ag). Cations remove electrons from the highest n first, then the highest ℓ, which gives Fe²⁺ = [Ar] 3d⁶ and Cu⁺ = [Ar] 3d¹⁰. Anions add electrons in Aufbau order.</p><p>The rules check tests, in order: too many electrons, Pauli, Hund (pairing and parallel spins), then Aufbau. A configuration with every electron placed but an Aufbau gap is labeled an excited state. For cations and the exception elements, an (n−1)d electron with ns not full is allowed, because that is how the real ground state looks. Boxes run mℓ = −ℓ to +ℓ from left to right and fill spin-up first; that ordering is a convention, so other textbooks may assign mℓ differently. Rows are evenly spaced; the true energy gaps between sublevels differ and shift from element to element. The f block (Z > 57) is not covered.</p>',
  initVis(sim){},
  draw(sim,ctx,vdt,k,t){const p=sim.p,st=sim.st,hon=atLeast('honors'),ap=atLeast('ap'),hotel=p.view==='hotel';const ch=check(sim);const badSet=new Set(ch.bad);const T=targetCounts(p.Z,p.charge);
    ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
    // energy arrow
    ctx.strokeStyle=PAL['cv-soft'];ctx.fillStyle=PAL['cv-soft'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(18,Y0+10);ctx.lineTo(18,60);ctx.stroke();ctx.beginPath();ctx.moveTo(11,68);ctx.lineTo(25,68);ctx.lineTo(18,54);ctx.closePath();ctx.fill();
    txt(ctx,'Energy',8,44-6*(k-1),{s:12*k,w:700,c:PAL['cv-soft']});
    if(hotel){ctx.fillStyle=PAL['cv-bg2'];rr(ctx,50,Y0-SUB.length*ROW+14,400,SUB.length*ROW+8,8);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
      SUB.forEach(s=>{ctx.strokeStyle=PAL['line'];ctx.beginPath();ctx.moveTo(54,rowY(s)+ROW/2);ctx.lineTo(446,rowY(s)+ROW/2);ctx.stroke();});}
    const fillingSub=(()=>{const L=lastE(st);return L?L.s.lab:null;})();
    SUB.forEach(s=>{const y=rowY(s),x0=COLX[s.l];const full=subCount(st,s.lab)===s.cap,hasT=T[s.lab]>0;
      txt(ctx,s.lab,x0-8,y,{s:13*k,w:700,a:'right',b:'middle',c:hasT||subCount(st,s.lab)?PAL['cv-ink']:PAL['cv-soft']});
      for(let b=0;b<s.nb;b++){const r=boxRect(s,b),bx=st.occ[s.lab][b],key=s.lab+':'+b,bad=badSet.has(key)||badSet.has(s.lab);
        if(hotel){ctx.fillStyle=PAL['card'];rr(ctx,r[0],r[1]-2,r[2],r[3]+4,4);ctx.fill();ctx.strokeStyle=bad?'#d32f2f':PAL['cv-glass'];ctx.lineWidth=bad?3:1.5;ctx.stroke();}
        else{ctx.fillStyle=PAL['card'];ctx.fillRect(r[0],r[1],r[2],r[3]);ctx.strokeStyle=bad?'#d32f2f':PAL['cv-ink'];ctx.lineWidth=bad?3:1.4;ctx.strokeRect(r[0],r[1],r[2],r[3]);}
        const fr=st.fresh&&st.fresh.lab===s.lab&&st.fresh.b===b?st.fresh.t:0;
        bx.forEach((sp,i)=>{const cx=r[0]+(bx.length===1?r[2]/2:i===0?r[2]*0.3:r[2]*0.7),cy=y;const drop=fr&&i===bx.length-1?(fr/0.35)*14:0;const col=sp>0?PAL['s2']:PAL['s1'];
          if(hotel)guest(ctx,cx,cy-drop*(sp>0?1:-1),sp,col);else arrowE(ctx,cx,cy-drop*(sp>0?1:-1),sp,col);});}
      if(full&&!hotel){ctx.fillStyle=PAL['s3'];ctx.beginPath();ctx.arc(COLX[s.l]+s.nb*(BOX+GAP)+8,y,3.5,0,6.29);ctx.fill();}});
    if(hotel)txt(ctx,'Hotel Aufbau',250,Y0-SUB.length*ROW+4,{s:13*k,w:800,a:'center',c:PAL['cv-ink']});
    // mini periodic table
    const PY=ptY(k),N=nPlaced(st);
    ['s','d','p'].forEach((b,i)=>{const cx=b==='s'?PTX+CS:b==='d'?PTX+CS*7:PTX+CS*15;txt(ctx,b+' block',cx,PY-5,{s:12*k,w:700,a:'center',c:PAL['cv-soft']});});
    for(let Z=1;Z<=MAXZ;Z++){const e=CL.el(Z),g=CL.gridPos(e);const x=PTX+(g.col-1)*CS,y=PY+(g.row-1)*CS;const blk=Z===2?'s':g.col<=2?'s':g.col>=13?'p':'d';
      ctx.fillStyle=blk==='s'?PAL['s1']:blk==='p'?PAL['s2']:PAL['s4'];ctx.globalAlpha=0.28;ctx.fillRect(x+0.5,y+0.5,CS-1,CS-1);ctx.globalAlpha=1;
      if(Z===p.Z){ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2.5;ctx.strokeRect(x,y,CS,CS);}
      if(N>0&&Z===Math.min(N,MAXZ)){ctx.fillStyle=PAL['cv-e'];ctx.strokeStyle=PAL['cv-estroke'];ctx.lineWidth=1;ctx.beginPath();ctx.arc(x+CS/2,y+CS/2,5,0,6.29);ctx.fill();ctx.stroke();}}
    // element card
    const e=el(p),cy0=PY+5*CS+12,TS=50+12*k;rr(ctx,PTX,cy0,TS,TS,8);const cf=CL.CAT_FILL[e.cat]||'#6d7a88';ctx.fillStyle=cf;ctx.fill();
    txt(ctx,String(e.Z),PTX+5,cy0+3+12*k*0.85,{s:12*k,w:700,c:'#fff'});txt(ctx,e.sym,PTX+TS/2,cy0+TS-9,{s:20*k,w:800,a:'center',c:'#fff'});
    const tx=PTX+TS+10;txt(ctx,p.charge?symQ(p)+' ion':e.name,tx,cy0+18*k*0.9,{s:15*k,w:800});txt(ctx,N+' of '+need(p)+' e⁻ placed',tx,cy0+18*k*0.9+20*k,{s:12*k,c:PAL['cv-soft']});
    const ny=cy0+TS+26*k;txt(ctx,cfgText(placedCounts(st),true),PTX,ny,{s:(hon?16:14)*k,w:800});
    const col=ch.code==='ground'?'#1b7339':['pauli','hund','hundspin','aufbau','toomany'].includes(ch.code)?'#b3261e':['excited','ion','exception','other'].includes(ch.code)?'#a15c00':'#3f6fb0';
    const py=ny+24*k;ctx.font='700 '+(13*k)+'px '+FONT;const pw=ctx.measureText(ch.short).width+13*k*1.1;pill(ctx,ch.short,PTX+pw/2,py,col,'#fff',13*k);
    let yy=py+30*k;
    if(ap){const L=lastE(st);if(L){const ml=(L.ml>0?'+':L.ml<0?'−':'')+Math.abs(L.ml),ms=L.ms>0?'+½':'−½';
        if(k>1.25){txt(ctx,'Last e⁻: n = '+L.s.n+', ℓ = '+L.s.l+',',PTX,yy,{s:12*k,c:PAL['cv-soft']});yy+=18*k;txt(ctx,'mℓ = '+ml+', mₛ = '+ms,PTX,yy,{s:12*k,c:PAL['cv-soft']});}
        else txt(ctx,'Last e⁻: n = '+L.s.n+', ℓ = '+L.s.l+', mℓ = '+ml+', mₛ = '+ms,PTX,yy,{s:12*k,c:PAL['cv-soft']});yy+=20*k;}
      if(N){txt(ctx,unpaired(st)+' unpaired: '+(unpaired(st)?'paramagnetic':'diamagnetic'),PTX,yy,{s:12*k,c:PAL['cv-soft']});yy+=20*k;}}
    // filling order chips (only where they fit)
    {const fs=12*k,ch=fs*1.6;ctx.font='700 '+fs+'px '+FONT;let x=PTX,y=yy+10;const rows=[];let row=[];
      SUB.forEach(s=>{const w=ctx.measureText(s.lab).width+fs*0.9;if(x+w>792&&row.length){rows.push(row);row=[];x=PTX;}row.push({s,x,w});x+=w+5;});rows.push(row);
      const need=fs+6+rows.length*(ch+5);if(y+need<=446){txt(ctx,'Filling order',PTX,y+fs*0.8,{s:fs,w:700,c:PAL['cv-soft']});y+=fs+8;
        rows.forEach(r=>{r.forEach(o=>{const c=subCount(st,o.s.lab),full=c===o.s.cap,cur=fillingSub===o.s.lab;rr(ctx,o.x,y,o.w,ch,ch/2);ctx.fillStyle=full?PAL['s3']:c?PAL['card']:PAL['cv-bg2'];ctx.globalAlpha=full?0.85:1;ctx.fill();ctx.globalAlpha=1;
          ctx.strokeStyle=cur?PAL['cv-ink']:PAL['line'];ctx.lineWidth=cur?2.2:1;ctx.stroke();txt(ctx,o.s.lab,o.x+o.w/2,y+ch/2+1,{s:fs,w:700,a:'center',b:'middle',c:full?'#fff':PAL['cv-ink']});});y+=ch+5;});}}
  },
  thumbSetup(sim){sim.p.Z=26;fillNow(sim);},thumbFrames:4
};
function arrowE(ctx,x,y,sp,col){const h=10;ctx.strokeStyle=col;ctx.fillStyle=col;ctx.lineWidth=2.6;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x,y+sp*h);ctx.lineTo(x,y-sp*(h-4));ctx.stroke();
  ctx.beginPath();ctx.moveTo(x,y-sp*h);ctx.lineTo(x-5,y-sp*(h-6));ctx.lineTo(x+5,y-sp*(h-6));ctx.closePath();ctx.fill();}
function guest(ctx,x,y,sp,col){// a stick figure; spin up = head at top, spin down = head at the bottom (head to toe)
  const hy=y-sp*8;ctx.fillStyle=col;ctx.strokeStyle=col;ctx.lineWidth=2.2;ctx.lineCap='round';ctx.beginPath();ctx.arc(x,hy,3.6,0,6.29);ctx.fill();
  ctx.beginPath();ctx.moveTo(x,hy+sp*3.6);ctx.lineTo(x,y+sp*5);ctx.moveTo(x-4,y);ctx.lineTo(x+4,y);ctx.moveTo(x,y+sp*5);ctx.lineTo(x-3,y+sp*10);ctx.moveTo(x,y+sp*5);ctx.lineTo(x+3,y+sp*10);ctx.stroke();}
SIM.onLevel=sync;
BioLab.register(SIM);
})();
