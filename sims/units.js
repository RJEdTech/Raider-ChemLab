(function(){
'use strict';
const {clamp,rng,rr,txt,pill,atLeast,PAL,FONT,RM,lvText}=BioLab.h;
const CL=window.ChemLab;
const SUPD={'-':'⁻','0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹'};
const supE=e=>String(e).split('').map(c=>SUPD[c]||c).join('');
/* always scientific notation with n significant figures */
function sciA(v,n){if(!Number.isFinite(v))return '—';if(v===0)return '0';let e=Math.floor(Math.log10(Math.abs(v)));let m=v/Math.pow(10,e);if(Math.abs(+m.toFixed(n-1))>=10){e++;m=v/Math.pow(10,e);}return m.toFixed(Math.max(0,n-1))+' × 10'+supE(e);}
/* n significant figures, written so the digits show exactly n (trailing decimal point or scientific notation when needed) */
function sigStr(v,n){if(!Number.isFinite(v))return '—';if(v===0)return (0).toFixed(Math.max(0,n-1));const r=CL.roundSig(v,n),e=Math.floor(Math.log10(Math.abs(r)));
  if(e>=n||e<-3)return sciA(r,n);if(e===n-1){const s=r.toFixed(0);return /0$/.test(s)?s+'.':s;}return r.toFixed(n-1-e);}

/* ---------- units as {token: exponent} ---------- */
const SUPN={2:'²',3:'³'};
function uStr(u){const num=[],den=[];Object.keys(u).forEach(k=>{const e=u[k];if(!e)return;const s=k+(Math.abs(e)>1?SUPN[Math.abs(e)]||('^'+Math.abs(e)):'');(e>0?num:den).push(s);});
  if(!num.length&&!den.length)return '(no units)';return (num.join('·')||'1')+(den.length?'/'+den.join('·'):'');}
function uAdd(a,b,s){const o=Object.assign({},a);Object.keys(b).forEach(k=>{o[k]=(o[k]||0)+s*b[k];if(!o[k])delete o[k];});return o;}
function uEq(a,b){const ka=Object.keys(a).filter(k=>a[k]),kb=Object.keys(b).filter(k=>b[k]);return ka.length===kb.length&&ka.every(k=>a[k]===b[k]);}
const U=s=>{const o={};s.split(' ').forEach(t=>{if(!t)return;const m=t.match(/^(.+?)(\^-?\d+)?$/);o[m[1]]=(o[m[1]]||0)+(m[2]?parseInt(m[2].slice(1),10):1);});return o;};

/* ---------- conversion factors: a = b ---------- */
const F={
  km_m:{a:['1','km'],b:['1000','m'],ex:true},m_cm:{a:['1','m'],b:['100','cm'],ex:true},m_mm:{a:['1','m'],b:['1000','mm'],ex:true},nm_m:{a:['1','m'],b:['1e9','nm'],ex:true},
  L_mL:{a:['1','L'],b:['1000','mL'],ex:true},g_mg:{a:['1','g'],b:['1000','mg'],ex:true},kg_g:{a:['1','kg'],b:['1000','g'],ex:true},
  h_min:{a:['1','h'],b:['60','min'],ex:true},min_s:{a:['1','min'],b:['60','s'],ex:true},h_s:{a:['1','h'],b:['3600','s'],ex:true},day_h:{a:['1','day'],b:['24','h'],ex:true},
  in_cm:{a:['1','in'],b:['2.54','cm'],ex:true},mi_km:{a:['1','mi'],b:['1.609','km'],ex:false},lb_g:{a:['1','lb'],b:['453.6','g'],ex:false},gal_L:{a:['1','gal'],b:['3.785','L'],ex:false},
  mL_cm3:{a:['1','mL'],b:['1','cm³'],ex:true},m3_L:{a:['1','m³'],b:['1000','L'],ex:true},m3_cm3:{a:['1','m³'],b:['1e6','cm³'],ex:true},
  d_eth:{a:['1','mL'],b:['0.789','g'],ex:false,note:'density of ethanol'},d_wat:{a:['1','mL'],b:['1.00','g'],ex:false,note:'density of water'},d_Al:{a:['1','cm³'],b:['2.70','g'],ex:false,note:'density of aluminum'},
  mm_w:{a:['1','mol'],b:['18.02','g'],ex:false,note:'molar mass of H₂O'},mm_Cu:{a:['1','mol'],b:['63.55','g'],ex:false,note:'molar mass of Cu'},NA:{a:['1','mol'],b:['6.022e23','atoms'],ex:false,note:'Avogadro’s number'}
};
const num=s=>parseFloat(s);
function vStr(s){if(/e/.test(s)){const [m,e]=s.split('e');return (m==='1'?'':m+' × ')+'10'+CL.sup(e.replace('-','−'));}return s;}
function sideOf(fid,flip){const f=F[fid];return flip?{top:f.a,bot:f.b}:{top:f.b,bot:f.a};}

/* ---------- problems ---------- */
const PROBS=[
  {id:'km',lvl:'bio',q:'Convert 2.50 km to meters.',s:['2.50','km'],goal:'m',tray:['km_m','m_cm','L_mL','h_min'],sol:[['km_m',false]]},
  {id:'hs',lvl:'bio',q:'How many seconds are in 3.0 hours?',s:['3.0','h'],goal:'s',tray:['h_min','min_s','day_h','m_cm'],sol:[['h_min',false],['min_s',false]]},
  {id:'mlL',lvl:'bio',q:'Convert 455 mL to liters.',s:['455','mL'],goal:'L',tray:['L_mL','g_mg','m_mm','km_m'],sol:[['L_mL',true]]},
  {id:'incm',lvl:'bio',q:'A pencil is 7.50 in long. How long is it in centimeters?',s:['7.50','in'],goal:'cm',tray:['in_cm','m_cm','mi_km','L_mL'],sol:[['in_cm',false]]},
  {id:'kgmg',lvl:'bio',q:'Convert 0.0250 kg to milligrams.',s:['0.0250','kg'],goal:'mg',tray:['kg_g','g_mg','L_mL','m_mm'],sol:[['kg_g',false],['g_mg',false]]},
  {id:'eth',lvl:'honors',q:'What is the mass of 25.0 mL of ethanol? (density 0.789 g/mL)',s:['25.0','mL'],goal:'g',tray:['d_eth','L_mL','mL_cm3','kg_g'],sol:[['d_eth',false]]},
  {id:'molw',lvl:'honors',q:'How many moles are in 36.0 g of water?',s:['36.0','g'],goal:'mol',tray:['mm_w','kg_g','NA','g_mg'],sol:[['mm_w',true]]},
  {id:'lbkg',lvl:'honors',q:'Convert 5.00 lb to kilograms.',s:['5.00','lb'],goal:'kg',tray:['lb_g','kg_g','gal_L','g_mg'],sol:[['lb_g',false],['kg_g',true]]},
  {id:'mph',lvl:'ap',q:'A car moves at 65 mi/h. What is that in m/s?',s:['65','mi h^-1'],goal:'m s^-1',tray:['mi_km','km_m','h_min','min_s','h_s','in_cm'],sol:[['mi_km',false],['km_m',false],['h_s',true]]},
  {id:'m3L',lvl:'ap',q:'A tank holds 3.2 m³. How many liters is that?',s:['3.2','m³'],goal:'L',tray:['m3_L','m3_cm3','L_mL','mL_cm3'],sol:[['m3_L',false]]},
  {id:'m3cm3',lvl:'ap',q:'Convert 0.0450 m³ to cm³.',s:['0.0450','m³'],goal:'cm³',tray:['m_cm','m3_cm3','m3_L','mL_cm3'],sol:[['m3_cm3',false]]},
  {id:'dens',lvl:'ap',q:'Aluminum’s density is 2.70 g/cm³. What is it in kg/m³?',s:['2.70','g cm³^-1'],goal:'kg m³^-1',tray:['kg_g','m3_cm3','m3_L','mL_cm3'],sol:[['kg_g',true],['m3_cm3',false]]},
  {id:'gal',lvl:'ap',q:'What is the mass, in kg, of 1.00 gal of water?',s:['1.00','gal'],goal:'kg',tray:['gal_L','L_mL','d_wat','kg_g','lb_g'],sol:[['gal_L',false],['L_mL',false],['d_wat',false],['kg_g',true]]},
  {id:'cu',lvl:'ap',q:'How many copper atoms are in 5.00 g of Cu?',s:['5.00','g'],goal:'atoms',tray:['mm_Cu','NA','kg_g','g_mg'],sol:[['mm_Cu',true],['NA',false]]},
  {id:'nm',lvl:'ap',q:'Red light has a wavelength of 656 nm. What is that in meters?',s:['656','nm'],goal:'m',tray:['nm_m','m_cm','m_mm','km_m'],sol:[['nm_m',true]]}
];
const PB={};PROBS.forEach(p=>PB[p.id]=p);

/* ---------- random metric practice ---------- */
const PRE={k:3,h:2,da:1,'':0,d:-1,c:-2,m:-3,'μ':-6,n:-9};
function randProb(sim){const st=sim.st;const r=rng(st.seed=(st.seed*48271+3)%2147483647);const bases=['m','g','L'],b=bases[Math.floor(r()*3)];
  const list=atLeast('ap')?['k','','c','m','μ','n']:['k','','c','m'];let p1=list[Math.floor(r()*list.length)],p2;do{p2=list[Math.floor(r()*list.length)];}while(p2===p1);
  const sf=3,v=(1+r()*9)*Math.pow(10,Math.floor(r()*3)-1);const e=Math.floor(Math.log10(v));const vs=v.toFixed(Math.max(0,sf-1-e));
  const pow=e=>e>=6?'1e'+e:String(Math.pow(10,e));
  const fac=q=>{if(q==='')return null;const e=PRE[q],id='g_'+(q==='μ'?'u':q)+b;F[id]=e>0?{a:['1',q+b],b:[pow(e),b],ex:true}:{a:['1',b],b:[pow(-e),q+b],ex:true};return id;};
  const ids=[fac(p1),fac(p2)].filter(Boolean);const tray=ids.slice();['km_m','L_mL','g_mg','h_min'].forEach(x=>{if(tray.length<4&&F[x].a[1]!==p1+b&&F[x].b[1]!==p1+b)tray.push(x);});
  const P={id:'rand',lvl:'bio',q:'Convert '+vs+' '+p1+b+' to '+(p2+b)+'.',s:[vs,p1+b],goal:p2+b,tray:tray.sort(()=>r()-0.5),sol:solveSol(vs,p1+b,p2+b,ids)};
  st.rand=P;}
function solveSol(v,from,to,ids){/* find orientation of each factor that cancels units, in order */let u=U(from);const sol=[];
  ids.forEach(id=>{const o0=sideOf(id,false),uu=uAdd(uAdd(u,U(o0.top[1]),1),U(o0.bot[1]),-1);const cnt=x=>Object.keys(x).reduce((a,k)=>a+Math.abs(x[k]),0);const o1=sideOf(id,true),uv=uAdd(uAdd(u,U(o1.top[1]),1),U(o1.bot[1]),-1);
    const flip=cnt(uv)<cnt(uu);sol.push([id,flip]);u=flip?uv:uu;});return sol;}
function prob(sim){return sim.p.prob==='rand'?(sim.st.rand||PROBS[0]):(PB[sim.p.prob]||PROBS[0]);}

/* ---------- chain evaluation ---------- */
function evalChain(P,chain){let v=num(P.s[0]),u=U(P.s[1]);const sfs=[CL.sigFigs(P.s[0])];
  chain.forEach(c=>{const o=sideOf(c.f,c.flip);v=v*num(o.top[0])/num(o.bot[0]);u=uAdd(uAdd(u,U(o.top[1]),1),U(o.bot[1]),-1);if(!F[c.f].ex)sfs.push(Math.min(CL.sigFigs(F[c.f].b[0]),CL.sigFigs(F[c.f].a[0])===1?99:CL.sigFigs(F[c.f].a[0])));});
  const sf=Math.min(...sfs);const done=uEq(u,U(P.goal));return {v,u,sf,done,ans:done?ansStr(v,sf):null};}
function ansStr(v,sf){return sigStr(v,sf);}
function add(sim,fid,flip){const st=sim.st;if(st.chain.length>=6)return;st.chain.push({f:fid,flip:!!flip,t:sim.vt});st.res=null;}
function hint(sim){const P=prob(sim),st=sim.st;let n=0;while(n<st.chain.length&&n<P.sol.length&&st.chain[n].f===P.sol[n][0]&&st.chain[n].flip===P.sol[n][1])n++;
  st.chain=st.chain.slice(0,n);if(n<P.sol.length)add(sim,P.sol[n][0],P.sol[n][1]);}
function solveAll(sim){const P=prob(sim);sim.st.chain=P.sol.map(s=>({f:s[0],flip:s[1],t:-9}));sim.st.res=null;}
function gradeAns(sim){const st=sim.st,P=prob(sim),s=String(st.ans||'').trim().replace(/[×x]\s*10\^?/,'e').replace('−','-');const v=parseFloat(s);
  const right=evalChain(P,P.sol.map(q=>({f:q[0],flip:q[1]})));if(!Number.isFinite(v)){st.res={k:'bad',m:'Type a number (use e for powers of ten: 2.50e3).'};return;}
  const close=Math.abs(v-right.v)<=Math.abs(right.v)*0.006;const sf=CL.sigFigs(s.split(/[eE]/)[0]+(s.includes('e')?'':''));
  if(close&&sf===right.sf)st.res={k:'ok',m:right.ans+' '+uStr(U(P.goal))+', with '+right.sf+' significant figure'+(right.sf>1?'s':'')+'.'};
  else if(close)st.res={k:'sf',m:'The value is right, but it should have '+right.sf+' significant figures: '+right.ans+'.'};
  else if(Math.abs(Math.log10(Math.abs(v/right.v)))>0.9&&Number.isFinite(Math.log10(Math.abs(v/right.v))))st.res={k:'no',m:'Off by a power of ten or more. Check that every unit you want to get rid of is on the bottom of a factor.'};
  else st.res={k:'no',m:'Not quite. Build the chain to check your setup.'};}

/* ---------- prefix ladder ---------- */
const LAD=[{p:'k',n:'kilo',e:3},{p:'h',n:'hecto',e:2},{p:'da',n:'deka',e:1},{p:'',n:'base',e:0},{p:'d',n:'deci',e:-1},{p:'c',n:'centi',e:-2},{p:'m',n:'milli',e:-3},{p:'μ',n:'micro',e:-6,lvl:'ap'},{p:'n',n:'nano',e:-9,lvl:'ap'}];
function shiftDec(s,n){/* exact decimal shift of a numeral string by n places (n>0 moves the point right) */let [a,b='']=s.split('.');let digits=a+b,pos=a.length+n;
  if(pos<=0){digits='0'.repeat(1-pos)+digits;pos=1;}if(pos>digits.length)digits=digits+'0'.repeat(pos-digits.length);let ip=digits.slice(0,pos).replace(/^0+(?=\d)/,''),fp=digits.slice(pos);
  return fp.length?ip+'.'+fp:ip;}
function ladderSteps(p){const ef=LAD.find(l=>l.p===p.from).e,et=LAD.find(l=>l.p===p.to).e;return ef-et;}
function startHop(sim){const st=sim.st;st.hop={t:0,n:Math.abs(ladderSteps(sim.p)),done:false};}

/* ---------- mode visibility ---------- */
function syncModes(sim){if(!sim.ui||!sim.ui.sec)return;const d=sim.def,m=sim.p.mode;
  d.controls.forEach(c=>{if(!c.modes)return;const cid=d.id+'-'+c.id,e=document.getElementById(cid)||document.getElementById(cid+'-l');const w=e&&e.closest('.ctl');if(w)w.hidden=!atLeast(c.lvl)||!c.modes.includes(m);});
  d.metrics.forEach(mm=>{if(!mm.modes)return;const t=sim.ui.tiles[mm.id];const w=t&&t.num.closest('.tile');if(w)w.hidden=!atLeast(mm.lvl)||!mm.modes.includes(m);});
  const btns=[...sim.ui.sec.querySelectorAll('.controls .actions button')];d.actions.forEach((a,i)=>{const b=btns[i];if(b)b.hidden=!atLeast(a.lvl)||!a.modes.includes(m);});}
function newProblem(sim){const st=sim.st;st.chain=[];st.res=null;st.ans='';if(sim.p.prob==='rand')randProb(sim);}

/* ---------- challenges ---------- */
const CH=[
  {lvl:'bio',q:'To convert 2.50 km to meters, which conversion factor do you multiply by?',choices:['1 km / 1000 m','1000 m / 1 km','1 m / 1000 km'],correct:1,instant:true,show:{mode:'chain',prob:'km'},solve:true,
   explain:'Put the unit you want to get rid of (km) on the bottom so it cancels: 2.50 km × 1000 m / 1 km = 2500 m, written 2.50 × 10³ m to keep 3 significant figures. The chain is now built on the stage.'},
  {lvl:'bio',q:'You convert 5.0 m to centimeters. Is the number of centimeters bigger or smaller than 5.0?',choices:['Smaller, because centimeters are small','Bigger: it takes many small units to cover the same length','The same number'],correct:1,instant:true,show:{mode:'ladder',val:'5.0',from:'',to:'c',base:'m'},hop:true,
   explain:'Centimeters are smaller units, so you need more of them: 5.0 m = 500 cm. On the ladder, stepping down to a smaller unit moves the decimal point to the right, making the number bigger.'},
  {lvl:'bio',q:'Going from milliliters to liters, the decimal point moves…',choices:['3 places to the left','3 places to the right','1 place to the left'],correct:0,instant:true,show:{mode:'ladder',val:'455',from:'m',to:'',base:'L'},hop:true,
   explain:'Liters are 1000 times bigger than milliliters, so you need fewer of them. Climbing three steps up the ladder (milli → centi → deci → base) moves the decimal 3 places left: 455 mL = 0.455 L.'},
  {lvl:'honors',q:'Does an exact conversion factor such as 1 km = 1000 m limit the significant figures of your answer?',choices:['Yes: the 1 has only one significant figure','No: defined conversion factors are exact','Only the 1000 counts, so 1 sig fig'],correct:1,instant:true,show:{mode:'chain',prob:'km'},solve:true,
   explain:'Defined relationships (1 km = 1000 m, 1 in = 2.54 cm, 1 h = 60 min) are exact, with unlimited significant figures. Only measured values limit the answer: 2.50 km has 3, so the answer is 2.50 × 10³ m.'},
  {lvl:'honors',q:'What is the mass of 25.0 mL of ethanol? Its density is 0.789 g/mL.',choices:['31.7 g','19.7 g','0.0316 g'],correct:1,instant:true,show:{mode:'chain',prob:'eth'},solve:true,
   explain:'Density works as a conversion factor between mL and g: 25.0 mL × 0.789 g / 1 mL = 19.7 g. Dividing (25.0 ÷ 0.789 = 31.7) leaves mL²/g, which tells you the factor is upside down.'},
  {lvl:'ap',q:'How many cubic centimeters are in 1 m³?',choices:['100 cm³','1000 cm³','1,000,000 cm³'],correct:2,instant:true,show:{mode:'chain',prob:'m3cm3'},solve:true,
   explain:'1 m = 100 cm, so 1 m³ = (100 cm)³ = 10⁶ cm³. Every length unit in a cubed unit gets converted, so the factor is cubed too. 0.0450 m³ = 4.50 × 10⁴ cm³.'},
  {lvl:'ap',q:'A car moves at 65 mi/h. About how fast is that in m/s?',choices:['29 m/s','105 m/s','1.8 m/s'],correct:0,instant:true,show:{mode:'chain',prob:'mph'},solve:true,
   explain:'65 mi/h × 1.609 km/1 mi × 1000 m/1 km × 1 h/3600 s = 29 m/s (2 significant figures, from 65). Hours are on the bottom of mi/h, so the time factor needs h on top.'}
];

const SIM={
  id:'units',hash:'units',apUnit:0,order:3,kind:'Learning tool',tab:'Dimensional analysis',
  card:'Build factor-label chains where units cancel before your eyes, climb the metric prefix ladder, and check your answers with sig figs.',
  title:'Dimensional analysis and metric units',
  prereq:['measure'],next:['density','mole','stoich'],
  lede:{bio:'Convert any quantity by multiplying by conversion factors that equal 1. Put the unit you want to cancel on the bottom, and watch it cross out.',
        honors:'Chain several factors, use density and molar mass as conversion factors, and keep the right number of significant figures.',
        ap:'Handle derived units: cubed lengths (m³, cm³, L) and rates like mi/h → m/s, and multi-step problems that cross several kinds of units.'},
  scale:{bio:'Metric prefixes step by powers of ten: kilo = 1000, centi = 1/100, milli = 1/1000.',ap:'Metric prefixes step by powers of ten: kilo = 10³, milli = 10⁻³, micro = 10⁻⁶, nano = 10⁻⁹. Cubed units step by 10³ per prefix step of 10.'},
  timeless:true,animated:true,graph:false,
  controls:[
    {id:'mode',label:'Tool',type:'seg',def:'chain',lvl:'bio',noTrial:true,options:[{v:'chain',l:'Factor-label chain'},{v:'ladder',l:'Metric prefix ladder'}],onChange(sim){syncModes(sim);sim.st.hop=null;}},
    {id:'prob',label:'Problem',type:'select',def:'km',lvl:'bio',modes:['chain'],options:PROBS.map(p=>({v:p.id,l:p.q.replace(/\s*\(.*\)/,''),lvl:p.lvl})).concat([{v:'rand',l:'Random metric practice'}]),onChange(sim){newProblem(sim);}},
    {id:'val',label:'Number',type:'select',def:'4.75',lvl:'bio',noTrial:true,modes:['ladder'],options:['4.75','250','0.036','1.2','8000','5.0','455'].map(v=>({v,l:v})),onChange(sim){sim.st.hop=null;}},
    {id:'base',label:'Base unit',type:'seg',def:'m',lvl:'bio',noTrial:true,modes:['ladder'],options:[{v:'m',l:'meter (m)'},{v:'g',l:'gram (g)'},{v:'L',l:'liter (L)'}],onChange(sim){sim.st.hop=null;}},
    {id:'from',label:'From',type:'select',def:'k',lvl:'bio',noTrial:true,modes:['ladder'],options:LAD.map(l=>({v:l.p,l:(l.p||'base')+' ('+l.n+')',lvl:l.lvl})),onChange(sim){sim.st.hop=null;}},
    {id:'to',label:'To',type:'select',def:'',lvl:'bio',noTrial:true,modes:['ladder'],options:LAD.map(l=>({v:l.p,l:(l.p||'base')+' ('+l.n+')',lvl:l.lvl})),onChange(sim){sim.st.hop=null;}}
  ],
  actions:[
    {id:'hint',label:'Add the next factor',lvl:'bio',primary:true,modes:['chain'],run(sim){hint(sim);}},
    {id:'flip',label:'Flip the last factor',lvl:'bio',modes:['chain'],run(sim){const c=sim.st.chain;if(c.length){c[c.length-1].flip=!c[c.length-1].flip;c[c.length-1].t=sim.vt;}}},
    {id:'undo',label:'Undo',lvl:'bio',modes:['chain'],run(sim){sim.st.chain.pop();sim.st.res=null;}},
    {id:'clear',label:'Clear the chain',lvl:'bio',modes:['chain'],run(sim){sim.st.chain=[];sim.st.res=null;}},
    {id:'rand',label:'New random problem',lvl:'bio',modes:['chain'],run(sim){if(sim.p.prob!=='rand')BioLab.setValues(sim,{prob:'rand'});else newProblem(sim);}},
    {id:'go',label:'Move the decimal',lvl:'bio',primary:true,modes:['ladder'],run(sim){startHop(sim);}}
  ],
  init(sim){const st={seed:777,chain:[],res:null,ans:'',rand:null,hop:null};sim.st=st;if(sim.p.prob==='rand')randProb(sim);return st;},
  step(sim,dt){const h=sim.st.hop;if(h&&!h.done){h.t+=dt;if(h.t>=h.n*0.55+0.3)h.done=true;}},
  metrics:[
    {id:'now',label:'Units right now',unit:'',lvl:'bio',text:true,modes:['chain'],get:s=>uStr(evalChain(prob(s),s.st.chain).u)},
    {id:'goal',label:'Goal unit',unit:'',lvl:'bio',text:true,modes:['chain'],get:s=>uStr(U(prob(s).goal))},
    {id:'ans',label:'Answer',unit:'',lvl:'bio',text:true,modes:['chain'],get:s=>{const E=evalChain(prob(s),s.st.chain);return E.done?E.ans+' '+uStr(E.u):'Not finished';}},
    {id:'sf',label:'Significant figures in the answer',unit:'',lvl:'honors',min:0,max:6,d:0,modes:['chain'],get:s=>evalChain(prob(s),s.st.chain).sf},
    {id:'nf',label:'Factors used',unit:'',lvl:'bio',min:0,max:6,d:0,modes:['chain'],get:s=>s.st.chain.length},
    {id:'steps',label:'Steps on the ladder',unit:'',lvl:'bio',min:0,max:12,d:0,noTrial:true,modes:['ladder'],get:s=>Math.abs(ladderSteps(s.p))},
    {id:'dir',label:'Decimal point moves',unit:'',lvl:'bio',text:true,noTrial:true,modes:['ladder'],get:s=>{const n=ladderSteps(s.p);return n===0?'Nowhere: same unit':Math.abs(n)+' place'+(Math.abs(n)>1?'s':'')+' to the '+(n>0?'right':'left');}},
    {id:'res',label:'Result',unit:'',lvl:'bio',text:true,noTrial:true,modes:['ladder'],get:s=>{const p=s.p;return p.val+' '+p.from+p.base+' = '+shiftDec(p.val,ladderSteps(p))+' '+p.to+p.base;}}
  ],
  infoPanel(sim){const p=sim.p,st=sim.st;
    if(p.mode==='ladder'){return '<div class="p-head"><h3>The metric ladder</h3></div><p>Each step on the ladder is a factor of 10. Going <b>down</b> to a smaller unit, you need more of them: the decimal moves <b>right</b>. Going <b>up</b>, the decimal moves <b>left</b>.</p><p>Memory aid: <b>K</b>ing <b>H</b>enry <b>D</b>ied <b>B</b>y <b>D</b>rinking <b>C</b>hocolate <b>M</b>ilk (k, h, da, base, d, c, m).</p>'+(atLeast('ap')?'<p>Below milli the prefixes jump 3 steps at a time: micro (μ) = 10⁻⁶, nano (n) = 10⁻⁹.</p>':'');}
    const P=prob(sim),E=evalChain(P,st.chain);let h='<div class="p-head"><h3>Conversion factors</h3></div><p>'+P.q+' Add factors so every unwanted unit is on the bottom.</p><div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px">';
    P.tray.forEach(fid=>{[false,true].forEach(fl=>{const o=sideOf(fid,fl);h+='<button type="button" class="btn" data-f="'+fid+'" data-fl="'+(fl?1:0)+'" aria-label="Add '+vStr(o.top[0])+' '+o.top[1]+' per '+vStr(o.bot[0])+' '+o.bot[1]+'">'+vStr(o.top[0])+' '+o.top[1]+' / '+vStr(o.bot[0])+' '+o.bot[1]+'</button>';});});
    h+='</div><div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:6px 0"><label for="units-ans" style="font-weight:600">Your answer</label><input id="units-ans" class="sel" autocomplete="off" style="flex:1 1 110px;min-width:0;max-width:200px;font-size:17px;padding:6px 10px" placeholder="e.g. 2.50e3" value="'+String(st.ans||'').replace(/"/g,'')+'"><span>'+uStr(U(P.goal))+'</span><button type="button" class="btn primary" id="units-check">Check</button></div>';
    if(st.res)h+='<p class="verdict '+(st.res.k==='ok'?'ok':'no')+'">'+(st.res.k==='ok'?'Correct.':'Not yet.')+'</p><p>'+st.res.m+'</p>';
    if(atLeast('honors'))h+='<p>Defined factors (1 km = 1000 m) are exact. Measured ones, like density or molar mass, limit the significant figures; they have an orange border on the stage.</p>';
    return h;},
  bindInfo(sim,el){el.querySelectorAll('button[data-f]').forEach(b=>b.addEventListener('click',()=>{add(sim,b.dataset.f,b.dataset.fl==='1');BioLab.refresh(sim);}));
    const inp=el.querySelector('#units-ans'),btn=el.querySelector('#units-check');if(!inp)return;const go=()=>{sim.st.ans=inp.value;gradeAns(sim);sim.vis.refocus=true;BioLab.refresh(sim);};
    inp.addEventListener('input',()=>{sim.st.ans=inp.value;});inp.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();go();}});btn.addEventListener('click',go);if(sim.vis.refocus){sim.vis.refocus=false;inp.focus();}},
  onClick(sim,x,y){if(sim.p.mode!=='chain')return;const hit=(sim.vis.hits||[]).find(h=>x>=h.r[0]&&x<=h.r[0]+h.r[2]&&y>=h.r[1]&&y<=h.r[1]+h.r[3]);if(!hit)return;
    if(hit.k==='tray')add(sim,hit.f,false);else{const c=sim.st.chain[hit.i];c.flip=!c.flip;c.t=sim.vt;sim.st.res=null;}},
  narrate(sim){const p=sim.p,st=sim.st;
    if(p.mode==='ladder'){const n=ladderSteps(p),out=shiftDec(p.val,n);if(n===0)return 'Pick two different prefixes to convert between.';
      return '<b>'+p.val+' '+p.from+p.base+' = '+out+' '+p.to+p.base+'.</b> '+(n>0?'Moving down '+n+' step'+(n>1?'s':'')+' to a smaller unit: you need more of them, so the decimal moves '+n+' place'+(n>1?'s':'')+' right.':'Moving up '+(-n)+' step'+(n<-1?'s':'')+' to a bigger unit: you need fewer of them, so the decimal moves '+(-n)+' place'+(n<-1?'s':'')+' left.');}
    const P=prob(sim),E=evalChain(P,st.chain),goal=U(P.goal);
    if(!st.chain.length)return '<b>Start with what you know:</b> '+P.s[0]+' '+uStr(U(P.s[1]))+'. You want '+uStr(goal)+'. Pick a factor with '+uStr(U(P.s[1])).split('/')[0]+' on the bottom.';
    if(E.done)return '<b>Units cancel to '+uStr(goal)+'.</b> Multiply the tops, divide by the bottoms: '+E.ans+' '+uStr(goal)+' ('+E.sf+' significant figure'+(E.sf>1?'s':'')+').';
    const bad=Object.keys(E.u).filter(k=>Math.abs(E.u[k])>1);if(bad.length)return '<b>'+bad[0]+' did not cancel.</b> It is now '+(E.u[bad[0]]>0?'on top':'on the bottom')+' twice ('+uStr(E.u)+'). Click that factor to flip it.';
    return 'Units now: <b>'+uStr(E.u)+'</b>. Keep going until only '+uStr(goal)+' is left.';},
  tour:[
    {title:'Start with what you know',text:'Write the given quantity with its unit: 2.50 km. Your goal is meters.',focus:[10,80,780,150],pause:true,setup(sim){BioLab.setValues(sim,{mode:'chain',prob:'km'});sim.st.chain=[];}},
    {title:'A factor that equals 1',text:'1 km = 1000 m, so 1000 m / 1 km equals 1. Multiplying by it changes the unit, not the amount.',focus:[10,330,780,115],pause:true},
    {title:'Put the unwanted unit on the bottom',text:'km is on top in 2.50 km, so the factor needs km on the bottom. Watch the two km cross out.',focus:[10,80,780,150],speed:1,setup(sim){sim.st.chain=[{f:'km_m',flip:false,t:sim.vt}];}},
    {title:'Multiply and keep the sig figs',text:'2.50 × 1000 ÷ 1 = 2500. The exact factor doesn’t limit sig figs, so keep 3 from 2.50: 2.50 × 10³ m.',focus:[10,220,780,110],pause:true},
    {title:'Upside down? Units tell you',text:'With the factor flipped, km doesn’t cancel: you get km²/m. Wrong units mean a wrong setup.',focus:[10,80,780,250],speed:1,setup(sim){sim.st.chain=[{f:'km_m',flip:true,t:sim.vt}];}},
    {title:'Chains of factors',text:'Hours to seconds needs two steps: h → min → s. Each factor cancels the unit the last one left.',focus:[10,80,780,250],speed:1,setup(sim){BioLab.setValues(sim,{prob:'hs'});solveAll(sim);sim.st.chain.forEach(c=>c.t=sim.vt);}},
    {title:'The prefix ladder',text:'For metric prefixes you can also count steps: kilo to base is 3 steps down, so the decimal moves 3 places right.',focus:[0,0,800,450],speed:1,setup(sim){BioLab.setValues(sim,{mode:'ladder',val:'4.75',from:'k',to:'',base:'m'});startHop(sim);}},
    {lvl:'ap',title:'Derived units',text:'For mi/h → m/s, convert the top and the bottom. Hours are on the bottom, so the time factor puts h on top.',focus:[0,0,800,450],speed:1,setup(sim){BioLab.setValues(sim,{mode:'chain',prob:'mph'});solveAll(sim);sim.st.chain.forEach(c=>c.t=sim.vt);}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{mode:'chain',prob:'km'});sim.st.chain=[];syncModes(sim);},
  challenges:CH,
  onChallenge(sim,ch,phase){if(!ch||phase!=='done'||!ch.show)return;BioLab.setValues(sim,ch.show);if(ch.solve){solveAll(sim);sim.st.chain.forEach(c=>c.t=sim.vt);}if(ch.hop)startHop(sim);syncModes(sim);},
  onLevel(sim){syncModes(sim);},
  lab:{bio:'<p><b>Question:</b> Can you set up any conversion so the units cancel?</p><ol><li>Work each Big picture problem on paper first. Type your answer and press Check.</li><li>Then build the chain on the stage to see the units cancel. Press <b>Record trial</b> for each problem.</li><li>Do five <b>Random metric practice</b> problems, and check each one on the prefix ladder.</li></ol><p>How do you know which way up to write a conversion factor? Explain using one of your problems.</p>',
       honors:'<p><b>Question:</b> How do density and molar mass act as conversion factors?</p><ol><li>Solve the ethanol, water and pound problems. Record each one.</li><li>For each, circle the measured factor that limits the significant figures.</li><li>Flip one factor on purpose and write down the units you get.</li></ol><p>Explain why “wrong units” is a useful warning when you set up a problem.</p>',
       ap:'<p><b>Question:</b> How do conversions work for derived units?</p><ol><li>Solve the m³, density and mi/h problems.</li><li>Solve the gallon-of-water and copper-atoms problems, which cross three kinds of units.</li><li>Record each answer with its number of significant figures.</li></ol><p><b>Claim–evidence–reasoning:</b> Explain why 1 m³ = 10⁶ cm³ even though 1 m = 10² cm.</p>'},
  terms:[{t:'Conversion factor',d:'A ratio equal to 1, such as 1000 m / 1 km, used to change units.'},{t:'Dimensional analysis',d:'Solving problems by multiplying by conversion factors so that units cancel (also called the factor-label method).'},{t:'Metric prefix',d:'A word part that multiplies a base unit by a power of ten: kilo (10³), centi (10⁻²), milli (10⁻³).'},
    {lvl:'honors',t:'Exact number',d:'A defined or counted number, such as 1 km = 1000 m. It has unlimited significant figures.'},{lvl:'honors',t:'Density as a factor',d:'Density relates mass and volume, so it converts between them: g/mL or mL/g.'},
    {lvl:'ap',t:'Derived unit',d:'A unit built from base units, such as m³, g/cm³ or m/s.'},{lvl:'ap',t:'Micro, nano',d:'μ = 10⁻⁶ and n = 10⁻⁹.'}],
  about:'<p>The chain multiplies the starting value by each factor’s top and divides by its bottom, and tracks every unit as an exponent, so wrong setups really produce wrong units (km²/m). Cubed units such as m³ and cm³ are treated as single units with their own factors (1 m³ = 10⁶ cm³ = 1000 L). Defined factors are exact; measured values (1 mi = 1.609 km, 1 lb = 453.6 g, 1 gal = 3.785 L, densities, molar masses, Avogadro’s number) limit significant figures by their own digits. Answers are graded within 0.6% so rounding in the middle steps is accepted.</p>',
  initVis(sim){syncModes(sim);sim.vis.hits=[];},
  thumbSetup(sim){solveAll(sim);},thumbFrames:12,
  draw(sim,ctx,vdt,k,t){ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);if(sim.p.mode==='ladder')return drawLadder(sim,ctx,k,t);drawChain(sim,ctx,k,t);}
};

/* ---------- chain drawing ---------- */
function measureFrac(ctx,top,bot,fs){ctx.font='700 '+fs+'px '+FONT;return Math.max(ctx.measureText(top).width,ctx.measureText(bot).width)+fs*1.1;}
function drawChain(sim,ctx,k,t){const P=prob(sim),st=sim.st,E=evalChain(P,st.chain);sim.vis.hits=[];
  const qfs=15*k;ctx.font='700 '+qfs+'px '+FONT;const words=P.q.split(' ');let lines=[''];words.forEach(w=>{const tt=lines[lines.length-1]?lines[lines.length-1]+' '+w:w;if(ctx.measureText(tt).width>760)lines.push(w);else lines[lines.length-1]=tt;});
  lines.slice(0,2).forEach((l,i)=>txt(ctx,l,20,30+i*qfs*1.25,{s:qfs,w:700}));
  // net units for cancel marks
  const net=E.u;const startU=U(P.s[1]);
  // items: start + factors
  const sNum={},sDen={};Object.keys(startU).forEach(q=>{if(startU[q]>0)sNum[q]=startU[q];else sDen[q]=-startU[q];});
  const items=[Object.keys(sDen).length?{top:vStr(P.s[0])+' '+uStr(sNum),bot:'1 '+uStr(sDen),tu:sNum,bu:sDen,start:true}:{top:vStr(P.s[0])+' '+uStr(startU),bot:null,tu:startU,bu:{}}].concat(st.chain.map(c=>{const o=sideOf(c.f,c.flip);return {top:vStr(o.top[0])+' '+o.top[1],bot:vStr(o.bot[0])+' '+o.bot[1],tu:U(o.top[1]),bu:U(o.bot[1]),t:c.t,ex:F[c.f].ex,note:F[c.f].note};}));
  let fs=25*Math.min(k,1.45);const gap=fs*1.3;const W=()=>items.reduce((a,it)=>a+measureFrac(ctx,it.top,it.bot||'',fs)+gap,0);const fmin=Math.max(15,fs*0.62);while(W()>770&&fs>fmin)fs-=1;
  // layout rows
  let rows=[[]],rw=0;items.forEach((it,i)=>{const w=measureFrac(ctx,it.top,it.bot||'',fs);if(rw+w+gap>770&&rows[rows.length-1].length){rows.push([]);rw=0;}rows[rows.length-1].push({it,i,w});rw+=w+gap;});
  const rowH=fs*3.2;let y0=100+(rows.length>1?0:20);
  const cancelled=tok=>!net[tok];
  rows.forEach((row,ri)=>{const tw=row.reduce((a,c)=>a+c.w+gap,0)-gap;let x=400-tw/2;const cy=y0+ri*rowH+fs*1.2;
    row.forEach(({it,i,w})=>{if(i>0){txt(ctx,'×',x-gap/2,cy,{s:fs,w:700,a:'center',b:'middle',c:PAL['cv-soft']});}
      const age=it.t===undefined?9:sim.vt-it.t,grow=clamp((age-0.35)/0.4,0,1);
      const box=[x-4,cy-fs*1.5,w+8,fs*3];if(i>0&&!it.start){ctx.fillStyle=PAL['card'];rr(ctx,box[0],box[1],box[2],box[3],8);ctx.fill();ctx.strokeStyle=it.ex?PAL['line']:PAL['s4'];ctx.lineWidth=it.ex?1.5:2;ctx.stroke();sim.vis.hits.push({k:'chain',i:i-1,r:box});}
      const drawPart=(s,yy,umap)=>{txt(ctx,s,x+w/2,yy,{s:fs,w:700,a:'center',b:'middle'});const unit=s.split(' ').slice(1).join(' ');
        if(Object.keys(umap).length&&Object.keys(umap).every(cancelled)&&grow>0){ctx.font='700 '+fs+'px '+FONT;const sw=ctx.measureText(s).width,uw=ctx.measureText(unit).width;const ux=x+w/2+sw/2-uw;
          ctx.strokeStyle=PAL['s1'];ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(ux-2,yy+fs*0.3);ctx.lineTo(ux-2+(uw+4)*grow,yy-fs*0.35);ctx.stroke();}};
      if(it.bot===null){drawPart(it.top,cy,startU);}
      else{drawPart(it.top,cy-fs*0.75,it.tu);ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+2,cy);ctx.lineTo(x+w-2,cy);ctx.stroke();drawPart(it.bot,cy+fs*0.8,it.bu);}
      x+=w+gap;});});
  // result line
  const ry=y0+rows.length*rowH+fs*0.6;const goal=U(P.goal);
  if(E.done){const raw=E.v;txt(ctx,'= '+E.ans+' '+uStr(goal),400,ry,{s:fs*1.05,w:800,a:'center',c:PAL['s3']});
    if(atLeast('honors'))txt(ctx,'calculator: '+(Math.abs(raw)>=1e6||Math.abs(raw)<1e-3?raw.toExponential(6):String(+raw.toPrecision(8)))+'  →  '+E.sf+' sig figs',400,ry+fs*1.2,{s:13*k,c:PAL['cv-soft'],a:'center'});}
  else txt(ctx,'Units now: '+uStr(E.u)+'     Goal: '+uStr(goal),400,ry,{s:15*k,w:700,a:'center',c:Object.keys(E.u).some(q=>Math.abs(E.u[q])>1)?PAL['s1']:PAL['cv-ink']});
  // tray
  const ty=352;ctx.fillStyle=PAL['cv-bg2'];ctx.fillRect(0,ty-10,800,108);txt(ctx,k<1.3?'Conversion factors: click one to add it, click a factor in the chain to flip it':'Tap to add; tap a chain factor to flip it',14,ty+6,{s:12*k,c:PAL['cv-soft']});
  let tfs=15*Math.min(k,1.4);const tw=P.tray.map(f=>{const o=sideOf(f,false);return measureFrac(ctx,vStr(o.top[0])+' '+o.top[1],vStr(o.bot[0])+' '+o.bot[1],tfs)+10;});
  while(tw.reduce((a,b)=>a+b+10,0)>780&&tfs>11){tfs-=1;tw.forEach((_,i)=>{const o=sideOf(P.tray[i],false);tw[i]=measureFrac(ctx,vStr(o.top[0])+' '+o.top[1],vStr(o.bot[0])+' '+o.bot[1],tfs)+10;});}
  let tx=400-(tw.reduce((a,b)=>a+b+10,0)-10)/2;const tcy=ty+12+(88-12)/2+4;
  P.tray.forEach((f,i)=>{const o=sideOf(f,false),w=tw[i],r=[tx,tcy-tfs*1.6,w,tfs*3.2];ctx.fillStyle=PAL['card'];rr(ctx,r[0],r[1],r[2],r[3],8);ctx.fill();ctx.strokeStyle=F[f].ex?PAL['line']:PAL['s4'];ctx.lineWidth=1.5;ctx.stroke();
    txt(ctx,vStr(o.top[0])+' '+o.top[1],tx+w/2,tcy-tfs*0.7,{s:tfs,w:700,a:'center',b:'middle'});ctx.strokeStyle=PAL['cv-ink'];ctx.beginPath();ctx.moveTo(tx+6,tcy);ctx.lineTo(tx+w-6,tcy);ctx.stroke();txt(ctx,vStr(o.bot[0])+' '+o.bot[1],tx+w/2,tcy+tfs*0.75,{s:tfs,w:700,a:'center',b:'middle'});
    sim.vis.hits.push({k:'tray',f,r});tx+=w+10;});
  if(atLeast('honors')&&k<1.3)txt(ctx,'Orange border = measured value (limits sig figs)',786,ty+6,{s:12*k,c:PAL['s4'],a:'right'});}

/* ---------- ladder drawing ---------- */
function drawLadder(sim,ctx,k,t){const p=sim.p,st=sim.st,ap=atLeast('ap');const L=LAD.filter(l=>!l.lvl||ap);
  const emin=ap?-9:-3,cols=3-emin+1,x0=30,x1=770,cw=(x1-x0)/cols,yTop=160,yBot=350,sh=(yBot-yTop)/(cols-1);const X=e=>x0+(3-e)*cw,Yb=e=>yTop+(3-e)*sh;
  for(let e=3;e>=emin;e--){const l=L.find(q=>q.e===e);ctx.fillStyle=l?(l.e===0?PAL['s2']:PAL['card']):PAL['cv-bg2'];ctx.fillRect(X(e),Yb(e),cw-2,yBot+40-Yb(e));ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.strokeRect(X(e),Yb(e),cw-2,yBot+40-Yb(e));
    if(l){txt(ctx,(l.p||p.base)+(l.p?p.base:''),X(e)+cw/2-1,Yb(e)+20*Math.min(k,1.4),{s:17*Math.min(k,1.4),w:800,a:'center',c:l.e===0?'#fff':PAL['cv-ink']});
      if(k<1.3||!ap)txt(ctx,l.n,X(e)+cw/2-1,Yb(e)+40*Math.min(k,1.4),{s:12*k,a:'center',c:l.e===0?'#fff':PAL['cv-soft']});}}
  const n=ladderSteps(p),ef=LAD.find(l=>l.p===p.from).e,et=LAD.find(l=>l.p===p.to).e;
  // ball hops
  const h=st.hop;let step=h?Math.min(h.n,Math.floor(h.t/0.55)):0,frac=h?clamp((h.t-step*0.55)/0.55,0,1):0;if(h&&h.done){step=h.n;frac=0;}
  const dir=Math.sign(et-ef);const eNow=ef+dir*step,eNext=eNow+dir;const atE=(h&&!h.done&&step<h.n)?eNow+(eNext-eNow)*frac:(h?et:ef);
  const bx=X(atE)+cw/2,by=Yb(atE)-16-(h&&!h.done&&step<h.n?Math.sin(frac*Math.PI)*30:0);
  ctx.beginPath();ctx.arc(bx,by,13,0,6.29);ctx.fillStyle=PAL['s1'];ctx.fill();ctx.strokeStyle=PAL['card'];ctx.lineWidth=2;ctx.stroke();
  if(ef!==et){ctx.strokeStyle=PAL['s4'];ctx.lineWidth=3;ctx.setLineDash([6,5]);ctx.beginPath();ctx.moveTo(X(ef)+cw/2,Yb(ef)-36);ctx.lineTo(X(et)+cw/2,Yb(et)-36);ctx.stroke();ctx.setLineDash([]);}
  // number with moving decimal
  const shownSteps=h?(h.done?n:Math.sign(n)*step):0;const cur=shiftDec(p.val,shownSteps);const done=!!(h&&h.done);
  const fs=30*Math.min(k,1.4);txt(ctx,p.val+' '+p.from+p.base,30,54,{s:fs,w:800});txt(ctx,'=',30+ctx.measureText(p.val+' '+p.from+p.base).width+24,54,{s:fs,w:800,c:PAL['cv-soft']});
  ctx.font='800 '+fs+'px '+FONT;const lx=30+ctx.measureText(p.val+' '+p.from+p.base+'  =  ').width+12;const lNow=LAD.find(q=>q.e===eNow);txt(ctx,(h?cur:'?')+' '+(done||!h?p.to+p.base:(lNow?lNow.p+p.base:'…')),lx,54,{s:fs,w:800,c:done?PAL['s3']:PAL['rj']});
  txt(ctx,n===0?'Same unit: choose a different prefix.':(h?(done?'Done: ':'Moving: ')+Math.abs(shownSteps)+' of '+Math.abs(n)+' places '+(n>0?'right':'left'):'Press Move the decimal to watch it hop '+Math.abs(n)+' place'+(Math.abs(n)>1?'s':'')+' '+(n>0?'right':'left')),30,94,{s:14*k,c:PAL['cv-soft']});
  txt(ctx,'← bigger units',x0,yBot+66,{s:12*k,c:PAL['cv-soft']});txt(ctx,'smaller units →',x1,yBot+66,{s:12*k,c:PAL['cv-soft'],a:'right'});}

BioLab.register(SIM);
})();
