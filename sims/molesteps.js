(function(){
'use strict';
const {clamp,lerp,rr,txt,pill,atLeast,PAL,FONT,RM,lvText}=BioLab.h;
const CL=window.ChemLab;

/* Mole math, one step at a time (pilot for Sandy Robertson's feedback, Nov 2026).
   Four short parts, each one class period's worth: particles <-> moles, molar mass, grams <-> moles, then both together.
   Every problem is solved as a written setup: given quantity x conversion factor(s), with the units crossing out,
   then the calculator keystrokes, then significant figures. Two feedback styles: check each step, or check only the answer. */

const NA_S='6.022 × 10²³';
const SUPD={'-':'⁻','0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹'};
const supE=e=>String(e).split('').map(c=>SUPD[c]||c).join('');
/* v with n significant figures, in scientific notation when very big or small */
function sig(v,n){if(!Number.isFinite(v))return '—';if(v===0)return '0';const r=CL.roundSig(v,n),e=Math.floor(Math.log10(Math.abs(r))+1e-12);
  if(e>=5||e<-2)return (r/Math.pow(10,e)).toFixed(Math.max(0,n-1))+' × 10'+supE(e);
  if(e>=n-1){const s=r.toFixed(0);return /0$/.test(s)&&s.replace(/0+$/,'').length<n?s+'.':s;}return r.toFixed(n-1-e);}
/* a numeral string like '1.67e21' shown as 1.67 × 10²¹ */
const show=s=>/e/i.test(s)?s.split(/e/i)[0]+' × 10'+supE(s.split(/e/i)[1]):s;
const sfOf=s=>CL.sigFigs(String(s).split(/e/i)[0]);
/* parse what a student types: 2.77e-3, 2.77 x 10^-3, 2.77*10^-3, 2.77 × 10⁻³, 2,77e-3 */
function parseNum(raw){if(raw===undefined||raw===null)return NaN;const SUP={'⁰':'0','¹':'1','²':'2','³':'3','⁴':'4','⁵':'5','⁶':'6','⁷':'7','⁸':'8','⁹':'9','⁻':'-','⁺':'+'};
  let t=String(raw).trim().replace(/\s+/g,'').replace(/[−–]/g,'-').replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺]/g,c=>SUP[c]).replace(/,(?=\d)/g,'.').replace(/[a-zA-Z]+$/,'');
  t=t.replace(/[×x*·]10\^?\(?([-+]?\d+)\)?$/i,'e$1');const m=t.match(/^([-+]?(?:\d+\.?\d*|\.\d+))(?:e([-+]?\d+))?$/i);return m?parseFloat(m[1])*Math.pow(10,m[2]?+m[2]:0):NaN;}
function typedSF(raw){const t=String(raw||'').trim().replace(/\s+/g,'').replace(/,(?=\d)/g,'.');const m=t.match(/^[-+]?(\d*\.?\d*)/);return m&&m[1]?CL.sigFigs(m[1]):0;}

/* ---------- substances: real things a student handles ---------- */
const SUB={
  H2O:{n:'water',w:'molecules'},CO2:{n:'carbon dioxide',w:'molecules'},NaCl:{n:'table salt',w:'formula units'},C12H22O11:{n:'table sugar (sucrose)',w:'molecules'},
  Al:{n:'aluminum',w:'atoms'},Cu:{n:'copper',w:'atoms'},C:{n:'graphite (pencil lead)',w:'atoms'},NaHCO3:{n:'baking soda',w:'formula units'},CaCO3:{n:'calcium carbonate (chalk, antacid tablets)',w:'formula units'},
  C8H10N4O2:{n:'caffeine',w:'molecules'},C6H12O6:{n:'glucose',w:'molecules'},'Mg(OH)2':{n:'magnesium hydroxide (milk of magnesia)',w:'formula units'},'Ca(OH)2':{n:'calcium hydroxide (garden lime)',w:'formula units'},
  '(NH4)2SO4':{n:'ammonium sulfate (lawn fertilizer)',w:'formula units'},C9H8O4:{n:'aspirin',w:'molecules'},'CuSO4*5H2O':{n:'copper(II) sulfate pentahydrate (blue crystals)',w:'formula units'},'Ca3(PO4)2':{n:'calcium phosphate (in your bones)',w:'formula units'}};
/* atomic masses as students read them off the periodic table: 2 decimals, and 1.008 for H */
const AM=e=>e==='H'?1.008:+CL.el(e).mass.toFixed(2);
const AMs=e=>e==='H'?'1.008':CL.el(e).mass.toFixed(2);
const mm2=f=>{const c=CL.parse(f.replace('*','·'));return Object.keys(c).reduce((a,e)=>a+c[e]*AM(e),0);};
const MM=f=>+mm2(f).toFixed(2);
const FT=f=>CL.fmt(f.replace('*','·'));
const PW=f=>SUB[f].w;

/* ---------- problems: path is the chain of units, start -> goal ---------- */
const BANK={
 1:[{f:'H2O',v:'1.67e21',from:'n',to:'mol',q:'One drop of water holds about 1.67 × 10²¹ water molecules. How many moles of water is that?'},
    {f:'Al',v:'0.556',from:'mol',to:'n',q:'An empty soda can is 0.556 mol of aluminum. How many aluminum atoms is that?'},
    {f:'C12H22O11',v:'0.114',from:'mol',to:'n',q:'A 12 oz can of soda holds 0.114 mol of sugar. How many sugar molecules is that?'},
    {f:'CO2',v:'5.4e20',from:'n',to:'mol',q:'One breath you breathe out carries about 5.4 × 10²⁰ molecules of CO₂. How many moles is that?'},
    {f:'NaCl',v:'6.2e17',from:'n',to:'mol',q:'A single grain of table salt holds about 6.2 × 10¹⁷ formula units of NaCl. How many moles is that?'},
    {f:'Cu',v:'0.0250',from:'mol',to:'n',q:'The copper wire in a pair of earbuds is about 0.0250 mol of copper. How many copper atoms is that?'}],
 2:[{f:'H2O',q:'What is the molar mass of water, H₂O?'},{f:'CO2',q:'What is the molar mass of carbon dioxide, CO₂, the gas in soda bubbles?'},
    {f:'NaHCO3',q:'What is the molar mass of baking soda, NaHCO₃?'},{f:'Ca(OH)2',q:'What is the molar mass of garden lime, Ca(OH)₂?'},
    {f:'C6H12O6',q:'What is the molar mass of glucose, C₆H₁₂O₆, the sugar in sports gels?'},{f:'C8H10N4O2',q:'What is the molar mass of caffeine, C₈H₁₀N₄O₂?'},
    {f:'(NH4)2SO4',q:'What is the molar mass of ammonium sulfate, (NH₄)₂SO₄, a lawn fertilizer?',lvl:'honors'},
    {f:'Ca3(PO4)2',q:'What is the molar mass of calcium phosphate, Ca₃(PO₄)₂, the mineral in your bones?',lvl:'honors'},
    {f:'CuSO4*5H2O',q:'What is the molar mass of copper(II) sulfate pentahydrate, CuSO₄·5H₂O?',lvl:'ap'}],
 3:[{f:'H2O',v:'500.',from:'g',to:'mol',q:'A water bottle holds 500. g of water. How many moles of water is that?'},
    {f:'NaCl',v:'6.00',from:'g',to:'mol',q:'A teaspoon of table salt is about 6.00 g of NaCl. How many moles is that?'},
    {f:'NaHCO3',v:'4.60',from:'g',to:'mol',q:'A cookie recipe uses 4.60 g of baking soda, NaHCO₃. How many moles is that?'},
    {f:'CaCO3',v:'0.250',from:'mol',to:'g',q:'Your lab group needs 0.250 mol of calcium carbonate, CaCO₃. What mass do you weigh out on the balance?'},
    {f:'C8H10N4O2',v:'0.160',from:'g',to:'mol',q:'A can of energy drink has 0.160 g of caffeine, C₈H₁₀N₄O₂. How many moles of caffeine is that?'},
    {f:'C6H12O6',v:'0.0750',from:'mol',to:'g',q:'A sports gel packet holds 0.0750 mol of glucose, C₆H₁₂O₆. What mass of glucose is that?'}],
 4:[{f:'C12H22O11',v:'39.0',from:'g',to:'n',q:'A can of soda has 39.0 g of sugar, C₁₂H₂₂O₁₁. How many sugar molecules is that?'},
    {f:'H2O',v:'18.0',from:'g',to:'n',q:'One big gulp is about 18.0 g of water. How many water molecules do you swallow?'},
    {f:'Al',v:'15.0',from:'g',to:'n',q:'An empty soda can is 15.0 g of aluminum. How many aluminum atoms is that?'},
    {f:'CO2',v:'3.01e23',from:'n',to:'g',q:'A balloon holds 3.01 × 10²³ molecules of CO₂. What is the mass of the CO₂?'},
    {f:'C9H8O4',v:'0.325',from:'g',to:'n',q:'One aspirin tablet has 0.325 g of aspirin, C₉H₈O₄. How many aspirin molecules is that?'},
    {f:'C',v:'2.5e19',from:'n',to:'g',q:'Writing your name in pencil leaves about 2.5 × 10¹⁹ carbon atoms on the paper. What mass of graphite is that?'}]};
const PARTS={1:{t:'Particles ↔ moles',short:'Part 1'},2:{t:'Molar mass',short:'Part 2'},3:{t:'Grams ↔ moles',short:'Part 3'},4:{t:'Put it together',short:'Part 4'}};
const bankFor=part=>BANK[part].filter(p=>!p.lvl||atLeast(p.lvl));
const UW={n:null,mol:'mol',g:'g'};
const unitOf=(node,f)=>node==='n'?PW(f):node;
/* the units path: g -> mol -> n, or the reverse */
function legs(P){if(P.from==='mol'||P.to==='mol')return [[P.from,P.to]];return [[P.from,'mol'],['mol',P.to]];}
/* a conversion factor: id NA or MM, oriented with top unit / bottom unit */
function fac(id,f,flip){const top=id==='NA'?{v:NA_S,u:PW(f),k:'n'}:{v:MM(f).toFixed(2),u:'g',k:'g'},bot={v:'1',u:'mol',k:'mol'};return flip?{top:bot,bot:top,id,flip}:{top,bot,id,flip};}
function rightFac(f,a,b){const id=(a==='n'||b==='n')?'NA':'MM';const t=fac(id,f,false);return t.bot.k===a?t:fac(id,f,true);}
function solution(P){return legs(P).map(([a,b])=>rightFac(P.f,a,b));}
function valOf(P,chain){let v=parseNum(P.v);chain.forEach(c=>{const t=c.top.v===NA_S?6.022e23:+c.top.v,b=c.bot.v===NA_S?6.022e23:+c.bot.v;v=v*t/b;});return v;}
/* units after the chain: {unit:power} */
function unitsAfter(P,chain){const u={};const add=(k,s)=>{u[k]=(u[k]||0)+s;if(!u[k])delete u[k];};add(P.from,1);chain.forEach(c=>{add(c.top.k,1);add(c.bot.k,-1);});return u;}
const uWord=(k,f)=>k==='n'?PW(f):k;
function uTxt(u,f){const num=[],den=[];Object.keys(u).forEach(k=>{const e=u[k],s=uWord(k,f)+(Math.abs(e)>1?'²':'');(e>0?num:den).push(s);});return (num.join(' · ')||'1')+(den.length?' / '+den.join(' · '):'');}
const done=(P,chain)=>{const u=unitsAfter(P,chain),ks=Object.keys(u);return ks.length===1&&ks[0]===P.to&&u[P.to]===1;};
const ansSF=P=>Math.min(sfOf(P.v),4);

/* ---------- calculator keystrokes ---------- */
const CALC={ti84:'TI-84 Plus',ti30:'TI-30XS MultiView',phone:'Phone or Desmos'};
function numKeys(s,calc){const [m,e]=String(s).split(/e/i);if(e===undefined)return [m];const neg=e[0]==='-',ex=e.replace(/^[-+]/,'');
  if(calc==='ti84')return [m,'[2nd]','[EE]'].concat(neg?['[(−)]']:[]).concat([ex]);
  if(calc==='ti30')return [m,'[×10ⁿ]'].concat(neg?['[(−)]']:[]).concat([ex]);
  return [m,'[EE]'].concat(neg?['[+/−]']:[]).concat([ex]);}
/* tokens: numbers as strings ('6.022e23'), ops '×' '÷' '+' */
function keyRow(tokens,calc){const out=[];tokens.forEach(t=>{if(t==='×'||t==='÷'||t==='+'||t==='('||t===')')out.push('['+t+']');else numKeys(t,calc).forEach(k=>out.push(k));});out.push(calc==='ti84'?'[ENTER]':calc==='ti30'?'[enter]':'[=]');return out;}
function desmos(tokens){return tokens.map(t=>t==='×'?'*':t==='÷'?'/':/e/i.test(t)?'('+t.replace(/e/i,'*10^(')+'))':t).join(' ');}
function chainTokens(P,chain){const t=[P.v.replace(/\.$/,'')];chain.forEach(c=>{const tv=c.top.v===NA_S?'6.022e23':c.top.v,bv=c.bot.v===NA_S?'6.022e23':c.bot.v;if(tv!=='1')t.push('×',tv);if(bv!=='1')t.push('÷',bv);});return t;}
function keysHTML(tokens,calc){const ks=keyRow(tokens,calc);
  const chip=k=>/^\[/.test(k)?`<kbd style="display:inline-block;border:1px solid var(--line);border-bottom-width:3px;border-radius:6px;padding:1px 7px;margin:2px 2px;font:600 15px var(--mono,ui-monospace,monospace);background:var(--card)">${k.slice(1,-1)}</kbd>`:`<span style="font:600 16px ui-monospace,monospace;margin:0 3px">${k}</span>`;
  let h=`<p style="margin:4px 0">${ks.map(chip).join('')}</p>`;
  if(calc==='phone')h+=`<p class="help">On an iPhone, turn the phone sideways to get the EE key. In Desmos, type <code>${desmos(tokens)}</code>.</p>`;
  return h;}
function calcShow(v,calc){const s=(+v.toPrecision(10)).toString();if(!/e/.test(s))return s;const [m,e]=s.split('e');return calc==='phone'?m+'e'+e.replace('+',''):m+'E'+e.replace('+','');}
const TRAP='Do not type “× 10 ^ 23” after a ÷. Your calculator divides by 6.022 and then <b>multiplies</b> by 10²³. Use the EE key (or put the whole number in parentheses), so it stays one number.';

/* ---------- grading with specific feedback ---------- */
function gradeChain(P,chain){// setup feedback for "check each step"
  if(!chain.length)return null;const last=chain[chain.length-1],u=unitsAfter(P,chain);const sq=Object.keys(u).find(k=>Math.abs(u[k])>1);
  if(sq)return {ok:false,m:`<b>${uWord(sq,P.f)} did not cancel.</b> It is now ${u[sq]>0?'on top':'on the bottom'} twice. The unit you want to get rid of has to be on the <b>bottom</b> of the factor. Flip it.`};
  const want=legs(P)[chain.length-1];
  if(want&&last.top.k!==want[1]&&!done(P,chain))return {ok:false,m:`That factor cancels ${uWord(last.bot.k,P.f)}, but it takes you to ${uWord(last.top.k,P.f)}. Which factor connects ${uWord(want[0],P.f)} and ${uWord(want[1],P.f)}?`};
  if(done(P,chain))return {ok:true,m:`<b>The units cancel to ${uWord(P.to,P.f)}.</b> The setup is right. Now do the math.`};
  return {ok:true,m:`Good: ${uWord(last.bot.k,P.f)} cancels and you have ${uTxt(u,P.f)}. Keep going to ${uWord(P.to,P.f)}.`};}
function gradeAns(P,raw,chain){const v=parseNum(raw),right=valOf(P,solution(P)),sf=ansSF(P);
  if(!Number.isFinite(v))return {ok:false,k:'bad',m:'Type a number. For powers of ten, type 2.77e-3 or 2.77 × 10^-3.'};
  const near=(a,b,t)=>Math.abs(a-b)<=Math.abs(b)*(t||0.01);
  if(near(v,right)){const ts=typedSF(raw);if(ts&&ts!==sf)return {ok:'sf',m:`The value is right. Round it to <b>${sf} significant figures</b>, the same as ${show(P.v)} ${uWord(P.from,P.f)}: <b>${sig(right,sf)}</b>.`};
    return {ok:true,m:`<b>${sig(right,sf)} ${uWord(P.to,P.f)}.</b> Right, with ${sf} significant figures.`};}
  const g=parseNum(P.v),M=MM(P.f),N=6.022e23;
  // an upside-down factor: multiplied where it should divide (or the reverse)
  const flips=[];const S=solution(P);for(let i=0;i<S.length;i++){const alt=S.map((c,j)=>j===i?fac(c.id,P.f,!c.flip):c);flips.push(valOf(P,alt));}
  if(flips.some(x=>near(v,x)))return {ok:false,m:'That is the answer you get with a factor <b>upside down</b>: multiplying where the setup divides, or the reverse. Look at the units: the unit you start with must be on the bottom so it cancels.'};
  // the classic calculator slip: "÷ 6.022 × 10^23" typed without EE multiplies by 10^23 instead of dividing
  if(near(v,right*1e46,0.02)||near(v,right/1e46,0.02))return {ok:false,m:TRAP};
  const r=Math.log10(Math.abs(v/right));if(Number.isFinite(r)&&Math.abs(r-Math.round(r))<0.01&&Math.round(r)!==0)return {ok:false,m:`The digits are right but the power of ten is off by ${Math.abs(Math.round(r))}. Check how you typed the exponent: use the EE key, and the (−) key for a negative exponent.`};
  return {ok:false,m:'Not quite. Check your setup on the stage: does every unit you started with cross out?'};}

/* molar mass parts */
function counts(f){return CL.parse(f.replace('*','·'));}
function flatCounts(f){/* what a student gets if they ignore the subscript after parentheses and the hydrate coefficient */const o={};f.replace('*','').replace(/[()]/g,'').replace(/(\d)H2O/,'H2O').match(/[A-Z][a-z]?\d*/g).forEach(t=>{const m=t.match(/([A-Z][a-z]?)(\d*)/);o[m[1]]=(o[m[1]]||0)+(m[2]?+m[2]:1);});return o;}
function gradeCount(f,el,raw){const want=counts(f)[el],n=parseInt(raw,10);if(!Number.isFinite(n))return {ok:false,m:'Type a whole number.'};if(n===want)return {ok:true};
  const flat=flatCounts(f)[el];if(/\(/.test(f)&&n===flat)return {ok:false,m:`The subscript right after a parenthesis multiplies everything inside it. Count the ${el} inside, then multiply.`};
  if(/\*/.test(f))return {ok:false,m:`Remember the waters: ·5H₂O adds 5 × 2 = 10 H and 5 O.`};
  return {ok:false,m:`Count the ${el} again. The small number right after a symbol tells how many; no number means 1.`};}
function gradeMM(f,raw){const v=parseNum(raw),M=mm2(f),c=counts(f);if(!Number.isFinite(v))return {ok:false,m:'Type the molar mass as a number in g/mol.'};
  if(Math.abs(v-M)<=Math.max(0.03,M*0.002))return {ok:true,m:`<b>${M.toFixed(2)} g/mol.</b> Right.`};
  const once=Object.keys(c).reduce((a,e)=>a+AM(e),0),Z=Object.keys(c).reduce((a,e)=>a+c[e]*CL.el(e).Z,0),flat=flatCounts(f),fl=Object.keys(flat).reduce((a,e)=>a+flat[e]*AM(e),0);
  if(Math.abs(v-once)<0.3)return {ok:false,m:'You added each element once. Multiply each atomic mass by how many of that atom are in the formula first.'};
  if(Math.abs(v-Z)<0.5)return {ok:false,m:'Those look like atomic numbers. Use the atomic <b>mass</b>, the decimal number on the periodic table (C is 12.01, not 6).'};
  if(Math.abs(v-fl)<0.3&&fl!==M)return {ok:false,m:'Check the parentheses: the subscript after them multiplies every atom inside.'};
  return {ok:false,m:'Not quite. Check each row: atoms × atomic mass, then add the rows.'};}

/* ---------- state ---------- */
function prob(sim){const L=bankFor(sim.p.part);return L[sim.st.i%L.length];}
function fresh(sim){const st=sim.st;st.chain=[];st.res=null;st.ans='';st.ex=0;st.cnt={};st.cntRes={};st.mm='';st.hint=0;st.tiles=null;st.t0=sim.vt||0;}
function tiles(sim){const P=prob(sim),st=sim.st;if(st.tiles)return st.tiles;const ids=sim.p.part===1?['NA']:sim.p.part===3?['MM','NA']:['NA','MM'];
  let T=[];ids.forEach(id=>{T.push(fac(id,P.f,false),fac(id,P.f,true));});
  /* shuffle once per problem so the right tile is not always first */
  for(let i=T.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[T[i],T[j]]=[T[j],T[i]];}
  st.tiles=T;return T;}
const EX_STEPS=['Write what you are given, with its unit.','Pick the conversion factor. The unit you start with goes on the <b>bottom</b>.','Cancel the units. Only the unit you want should be left.','Do the math: multiply by the tops, divide by the bottoms.','Round to the right number of significant figures.'];
const EX_MM=['Write each element in the formula.','Count the atoms of each element. A subscript after parentheses multiplies everything inside.','Look up each atomic mass on the periodic table.','Multiply: atoms × atomic mass for each element.','Add the rows. That is the molar mass, in g/mol.'];

/* show only the buttons and settings the current mode uses */
function syncUI(sim){if(!sim.ui||!sim.ui.sec)return;const ex=sim.p.how==='ex',sec=sim.ui.sec,d=sim.def;
  const btns=[...sec.querySelectorAll('.controls .actions button')];d.actions.forEach((a,i)=>{const b=btns[i];if(b)b.hidden=!atLeast(a.lvl)||(a.id==='next'&&!ex)||(a.id==='hint'&&ex);});
  const fb=sim.ui.ctlW&&sim.ui.ctlW.fb;if(fb)fb.hidden=ex;sim.infoDirty=true;}

const SIM={
  id:'molesteps',hash:'molesteps',apUnit:8,order:0.5,kind:'Learning tool',tab:'Mole math, step by step',prereq:['units'],next:['mole','percentcomp','stoich'],
  card:'Practice the mole one skill at a time: particles to moles, molar mass, grams to moles, then all together, with the setup and units written out at every step.',
  title:'Mole math, one step at a time',
  lede:{bio:'Four short parts, one skill each. In every problem you write the setup first: the given amount, a conversion factor, and units that cross out. The math comes last.'},
  scale:{bio:'1 mol = 6.022 × 10²³ particles. Molar mass (g/mol) comes from the periodic table: one mole of any substance weighs its formula mass in grams.'},
  aspect:1.6,timeless:true,animated:true,graph:false,trials:false,
  controls:[
    {id:'part',label:'Part',type:'seg',def:1,lvl:'bio',noTrial:true,options:[{v:1,l:'1. Particles ↔ moles'},{v:2,l:'2. Molar mass'},{v:3,l:'3. Grams ↔ moles'},{v:4,l:'4. Put it together'}],onChange(sim){sim.st.i=0;fresh(sim);syncUI(sim);}},
    {id:'how',label:'Mode',type:'seg',def:'ex',lvl:'bio',noTrial:true,options:[{v:'ex',l:'Watch an example'},{v:'try',l:'Your turn'}],onChange(sim){fresh(sim);syncUI(sim);}},
    {id:'fb',label:'Feedback',type:'seg',def:'step',lvl:'bio',noTrial:true,options:[{v:'step',l:'Check each step'},{v:'end',l:'Check only my answer'}],help:'Check each step tells you right away if a factor is upside down. Check only my answer waits until you type the answer.',onChange(sim){sim.infoDirty=true;}},
    {id:'calc',label:'My calculator',type:'select',def:'ti84',lvl:'bio',noTrial:true,options:Object.keys(CALC).map(k=>({v:k,l:CALC[k]})),onChange(sim){sim.infoDirty=true;}}
  ],
  actions:[
    {id:'next',label:'Next step',lvl:'bio',primary:true,run(sim){const st=sim.st;if(sim.p.how!=='ex'){BioLab.setValues(sim,{how:'ex'});return;}if(st.ex<4){st.ex++;st.t0=sim.vt;}else{BioLab.setValues(sim,{how:'try'});}}},
    {id:'newp',label:'Next problem',lvl:'bio',run(sim){sim.st.i++;fresh(sim);}},
    {id:'hint',label:'Show me the setup',lvl:'bio',run(sim){const P=prob(sim),st=sim.st;if(sim.p.part===2){const c=counts(P.f);Object.keys(c).forEach(e=>{st.cnt[e]=String(c[e]);st.cntRes[e]={ok:true};});}else{st.chain=solution(P);st.t0=sim.vt;}st.hint=1;}}
  ],
  init(sim){let part=1;try{const q=new URLSearchParams(location.search).get('part');if(q&&/^[1-4]$/.test(q))part=+q;}catch(e){}
    if(part!==sim.p.part){sim.p.part=part;if(sim.ui&&sim.ui.ctl&&sim.ui.ctl.part)sim.ui.ctl.part.set(part);}
    const st={i:0,chain:[],res:null,ans:'',ex:0,cnt:{},cntRes:{},mm:'',hint:0,tiles:null,t0:0,right:0};sim.st=st;return st;},
  step(sim,dt){},
  metrics:[
    {id:'part',label:'Part',unit:'',lvl:'bio',text:true,get:s=>PARTS[s.p.part].short+': '+PARTS[s.p.part].t},
    {id:'got',label:'Right this visit',unit:'',lvl:'bio',min:0,max:null,d:0,get:s=>s.st.right}
  ],
  infoPanel(sim){const p=sim.p,st=sim.st,P=prob(sim),calc=p.calc,stepFb=p.fb==='step';
    if(p.part===2){const c=counts(P.f),els=Object.keys(c),M=mm2(P.f);
      if(p.how==='ex'){let h=`<h3>Example: ${FT(P.f)}, step ${st.ex+1} of 5</h3><p>${EX_MM[st.ex]}</p>`;
        if(st.ex>=3)h+=`<p>${els.map(e=>c[e]+' × '+AMs(e)).join(' + ')} = <b>${M.toFixed(2)} g/mol</b></p>`;
        if(st.ex>=3){const tk=[];els.forEach((e,i)=>{if(i)tk.push('+');if(c[e]>1)tk.push(String(c[e]),'×');tk.push(AMs(e));});h+=`<details${st.ex===4?' open':''}><summary><b>On your ${CALC[calc]}</b></summary>${keysHTML(tk,calc)}<p class="help">Your calculator multiplies before it adds, so no parentheses are needed.</p></details>`;}
        return h+`<p class="help">Press <b>Next step</b> to keep going, then try one yourself.</p>`;}
      let h=`<h3>Your turn</h3><p>${P.q}</p><p><b>Step 1.</b> Count the atoms of each element.</p><div style="display:grid;grid-template-columns:auto auto 1fr;gap:6px 10px;align-items:center">`;
      els.forEach(e=>{const r=st.cntRes[e];h+=`<label for="ms-c-${e}" style="font-weight:700">${e}</label><input id="ms-c-${e}" data-el="${e}" class="sel" inputmode="numeric" autocomplete="off" style="width:70px;font-size:17px;padding:4px 8px" value="${String(st.cnt[e]||'').replace(/"/g,'')}">`+
        `<span>${r?r.ok?'<span class="verdict ok" style="margin:0">✓</span>':(stepFb?`<span style="color:var(--bad)">${r.m}</span>`:''):''}</span>`;});
      h+=`</div><p style="margin-top:10px"><b>Step 2.</b> Multiply each count by the atomic mass, then add the rows.</p><div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><label for="ms-mm" style="font-weight:600">Molar mass</label><input id="ms-mm" class="sel" autocomplete="off" style="max-width:150px;font-size:17px;padding:6px 10px" value="${String(st.mm||'').replace(/"/g,'')}"><span>g/mol</span><button type="button" class="btn primary" id="ms-check">Check</button></div>`;
      if(st.res)h+=`<p class="verdict ${st.res.ok===true?'ok':'no'}" style="margin-top:8px">${st.res.ok===true?'Correct.':'Not yet.'}</p><p>${st.res.m}</p>`;
      if(!stepFb&&st.res&&st.res.ok!==true){const bad=els.filter(e=>st.cntRes[e]&&!st.cntRes[e].ok);if(bad.length)h+=`<p>Check your count of ${bad.join(' and ')}: ${st.cntRes[bad[0]].m}</p>`;}
      const tk=[];els.forEach((e,i)=>{if(i)tk.push('+');if(c[e]>1)tk.push(String(c[e]),'×');tk.push(AMs(e));});
      h+=`<details><summary><b>Calculator help</b> (${CALC[calc]})</summary>${keysHTML(tk,calc)}</details>`;
      return h+(st.res&&st.res.ok===true?'<p><button type="button" class="btn primary" data-ms="next">Next problem</button></p>':'');}
    const S=solution(P),right=valOf(P,S),sf=ansSF(P);
    if(p.how==='ex'){let h=`<h3>Example, step ${st.ex+1} of 5</h3><p>${P.q}</p><p><b>${EX_STEPS[st.ex]}</b></p>`;
      if(st.ex===1)h+=`<p>${S.map(c=>`${c.top.v} ${uWord(c.top.k,P.f)} = ${c.bot.v} ${uWord(c.bot.k,P.f)}, so the factor can be written either way up. ${uWord(c.bot.k,P.f)[0].toUpperCase()+uWord(c.bot.k,P.f).slice(1)} goes on the bottom.`).join(' ')}</p>`;
      if(st.ex>=3)h+=`<details${st.ex===3?' open':''}><summary><b>On your ${CALC[calc]}</b></summary>${keysHTML(chainTokens(P,S),calc)}${/e/.test(P.v)||S.some(c=>c.bot.v===NA_S)?'<p class="help">'+TRAP+'</p>':''}</details>`;
      if(st.ex===4)h+=`<p>The calculator shows ${calcShow(right,calc)}. ${show(P.v)} has ${sfOf(P.v)} significant figures, so the answer gets ${sf}: <b>${sig(right,sf)} ${uWord(P.to,P.f)}</b>.</p>`;
      return h+`<p class="help">Press <b>Next step</b> to keep going${st.ex===4?', and then it is your turn':''}.</p>`;}
    let h=`<h3>Your turn</h3><p>${P.q}</p><p><b>Step 1.</b> Build the setup: click a conversion factor to add it.</p><div style="display:flex;flex-wrap:wrap;gap:6px;margin:4px 0 8px">`;
    tiles(sim).forEach((t,i)=>{h+=`<button type="button" class="btn" data-t="${i}" style="line-height:1.15;padding:6px 10px"><span style="display:block;border-bottom:1.5px solid currentColor;padding-bottom:2px">${t.top.v} ${t.top.k==='mol'?'mol '+FT(P.f):uWord(t.top.k,P.f)}</span><span style="display:block;padding-top:2px">${t.bot.v} ${t.bot.k==='mol'?'mol '+FT(P.f):uWord(t.bot.k,P.f)}</span></button>`;});
    h+=`</div><div class="row" style="display:flex;gap:6px;flex-wrap:wrap"><button type="button" class="btn" data-ms="flip"${st.chain.length?'':' disabled'}>Flip the last factor</button><button type="button" class="btn" data-ms="undo"${st.chain.length?'':' disabled'}>Undo</button></div>`;
    if(stepFb&&st.chain.length){const g=gradeChain(P,st.chain);if(g)h+=`<p class="verdict ${g.ok?'ok':'no'}" style="margin:8px 0 2px">${g.ok?'Setup check':'Check the setup'}</p><p style="margin-top:0">${g.m}</p>`;}
    const ready=done(P,st.chain)||!stepFb;
    h+=`<p style="margin-top:10px"><b>Step 2.</b> Do the math, then round to the right significant figures.</p><div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><label for="ms-ans" style="font-weight:600">Answer</label><input id="ms-ans" class="sel" autocomplete="off" style="flex:1 1 120px;min-width:0;max-width:210px;font-size:17px;padding:6px 10px" placeholder="e.g. 2.77e-3" value="${String(st.ans||'').replace(/"/g,'')}"${ready?'':' disabled'}><span>${uWord(P.to,P.f)}</span><button type="button" class="btn primary" id="ms-check"${ready?'':' disabled'}>Check</button></div>`;
    if(!ready)h+=`<p class="help">Finish the setup first: the units must cancel to ${uWord(P.to,P.f)}.</p>`;
    if(st.res){h+=`<p class="verdict ${st.res.ok===true?'ok':'no'}" style="margin-top:8px">${st.res.ok===true?'Correct.':st.res.ok==='sf'?'Almost.':'Not yet.'}</p><p>${st.res.m}</p>`;
      if(!stepFb&&st.res.ok!==true){const g=gradeChain(P,st.chain);if(!st.chain.length)h+='<p>Build the setup on the stage to find where it went wrong.</p>';else if(g&&!g.ok)h+=`<p>${g.m}</p>`;}}
    h+=`<details${st.res&&st.res.ok===false?' open':''}><summary><b>Calculator help</b> (${CALC[calc]})</summary>${done(P,st.chain)||st.res?keysHTML(chainTokens(P,S),calc):'<p>Finish the setup and the keystrokes appear here.</p>'}<p class="help">${TRAP}</p></details>`;
    return h+(st.res&&st.res.ok===true?'<p><button type="button" class="btn primary" data-ms="next">Next problem</button></p>':'');},
  bindInfo(sim,el){const st=sim.st,P=prob(sim),R=()=>{sim.infoDirty=true;BioLab.refresh(sim);};
    el.querySelectorAll('button[data-t]').forEach(b=>b.addEventListener('click',()=>{if(st.chain.length>=2)return;st.chain.push(Object.assign({},st.tiles[+b.dataset.t]));st.res=null;st.t0=sim.vt;R();}));
    el.querySelectorAll('button[data-ms]').forEach(b=>b.addEventListener('click',()=>{const a=b.dataset.ms;
      if(a==='flip'&&st.chain.length){const c=st.chain[st.chain.length-1];st.chain[st.chain.length-1]=fac(c.id,P.f,!c.flip);st.t0=sim.vt;st.res=null;}
      else if(a==='undo'){st.chain.pop();st.res=null;}
      else if(a==='next'){st.i++;fresh(sim);}R();}));
    el.querySelectorAll('input[data-el]').forEach(inp=>{const e=inp.dataset.el;inp.addEventListener('input',()=>{st.cnt[e]=inp.value;});
      inp.addEventListener('change',()=>{st.cnt[e]=inp.value;st.cntRes[e]=inp.value===''?undefined:gradeCount(P.f,e,inp.value);R();});});
    const ans=el.querySelector('#ms-ans'),mm=el.querySelector('#ms-mm'),btn=el.querySelector('#ms-check');
    const go=()=>{if(sim.p.part===2){st.mm=mm.value;Object.keys(counts(P.f)).forEach(e=>{if(st.cnt[e]!==undefined&&st.cnt[e]!=='')st.cntRes[e]=gradeCount(P.f,e,st.cnt[e]);});st.res=gradeMM(P.f,st.mm);}
      else{st.ans=ans.value;st.res=gradeAns(P,st.ans,st.chain);}
      if(st.res.ok===true){st.right++;if(sim.p.part!==2&&!done(P,st.chain)){st.chain=solution(P);st.t0=sim.vt;}}sim.vis.refocus=true;R();};
    [ans,mm].forEach(i=>{if(!i)return;i.addEventListener('input',()=>{if(i===ans)st.ans=i.value;else st.mm=i.value;});i.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();go();}});});
    if(btn)btn.addEventListener('click',go);
    if(sim.vis.refocus){sim.vis.refocus=false;const f=ans||mm;if(f&&!f.disabled)f.focus();}},
  narrate(sim){const p=sim.p,st=sim.st,P=prob(sim);
    if(p.part===2){if(p.how==='ex')return '<b>Molar mass</b> is the mass of one mole, in grams. Add up the atomic masses of every atom in the formula: '+EX_MM[st.ex].toLowerCase();
      return 'Count each kind of atom in <b>'+FT(P.f)+'</b>, then add up their masses. One mole of '+FT(P.f)+' weighs that many grams.';}
    if(p.how==='ex')return ['Every setup starts with the number you are given and its unit: <b>'+show(P.v)+' '+uWord(P.from,P.f)+'</b>.','A conversion factor is a fraction equal to 1. Put the unit you want to get rid of on the <b>bottom</b>.','The same unit on top and on the bottom cancels, like 3/3 = 1. Only <b>'+uWord(P.to,P.f)+'</b> is left, so the setup is right.','Multiply by every number on top and divide by every number on the bottom.','Your answer can be no more precise than your measurement, so it keeps the same number of significant figures.'][st.ex];
    if(!st.chain.length)return 'You start with <b>'+show(P.v)+' '+uWord(P.from,P.f)+'</b> and want <b>'+uWord(P.to,P.f)+'</b>. Pick a factor with '+uWord(P.from,P.f)+' on the bottom.';
    if(done(P,st.chain))return '<b>Units cancel to '+uWord(P.to,P.f)+'.</b> The setup is done; the calculator does the rest.';
    const u=unitsAfter(P,st.chain);return 'Units now: <b>'+uTxt(u,P.f)+'</b>. You want '+uWord(P.to,P.f)+'.';},
  challenges:[
    {lvl:'bio',instant:true,q:'You have 1.67 × 10²¹ water molecules and want moles. Which conversion factor goes in your setup?',choices:['1 mol / 6.022 × 10²³ molecules','6.022 × 10²³ molecules / 1 mol','18.02 g / 1 mol'],correct:0,
     explain:'Molecules is the unit you start with, so it goes on the bottom where it cancels: 1.67 × 10²¹ molecules × 1 mol / 6.022 × 10²³ molecules = 2.77 × 10⁻³ mol.',set:{part:1,how:'try'},solve:true},
    {lvl:'bio',instant:true,q:'A student types 3.01 × 10 ^ 24 ÷ 6.022 × 10 ^ 23 and gets 5.0 × 10⁴⁶. The right answer is 5.00 mol. What went wrong?',choices:['It divided by 6.022, then multiplied by 10²³','The setup needs × 6.022 × 10²³ instead of ÷','The starting number has too many sig figs'],correct:0,
     explain:'Typed that way, the calculator does each step in order: ÷ 6.022, then × 10²³. Use the EE key (2nd then , on a TI-84) so 6.022 × 10²³ stays one number.'},
    {lvl:'bio',instant:true,q:'How many oxygen atoms are in one formula unit of Ca(OH)₂?',choices:['2, since the 2 after (OH) doubles it','1, since O has no subscript of its own','3, adding the one O and the 2 together'],correct:0,
     explain:'The subscript after a parenthesis multiplies everything inside: (OH)₂ is OH + OH, so 2 O and 2 H. Molar mass: 40.08 + 2(16.00) + 2(1.008) = 74.10 g/mol.',set:{part:2,how:'try'}},
    {lvl:'bio',instant:true,q:'To go from 39.0 g of sugar to sugar molecules, how many conversion factors do you need?',choices:['Two: grams to moles, then moles to molecules','One: grams straight to molecules','Three: grams to moles to liters to molecules'],correct:0,
     explain:'There is no factor that links grams and molecules directly. Grams to moles uses the molar mass (342.30 g/mol); moles to molecules uses 6.022 × 10²³. Every route on the mole map passes through moles.',set:{part:4,how:'try'},solve:true},
    {lvl:'honors',instant:true,q:'You divide 4.60 g of baking soda by its molar mass, 84.01 g/mol. How many significant figures should the answer have?',choices:['3, the same as 4.60 g','4, the same as 84.01 g/mol','2, from the decimal places'],correct:0,
     explain:'For multiplying and dividing, the answer keeps the fewest significant figures of the measured values. 4.60 g has 3 and the molar mass has 4, so the answer gets 3: 0.0548 mol.',set:{part:3,how:'try'}},
    {lvl:'honors',instant:true,q:'Which takes more particles: 1.00 g of aluminum or 1.00 g of copper?',choices:['Aluminum: each atom is lighter','Copper: it is the denser metal','They are the same: same mass'],correct:0,
     explain:'Al is 26.98 g/mol and Cu is 63.55 g/mol. 1.00 g ÷ 26.98 = 0.0371 mol Al, but 1.00 g ÷ 63.55 = 0.0157 mol Cu. Lighter atoms means more of them in the same mass.'}
  ],
  onChallenge(sim,ch,phase){if(!ch||phase!=='done'||!ch.set)return;BioLab.setValues(sim,ch.set);if(ch.solve){sim.st.chain=solution(prob(sim));sim.st.t0=sim.vt;}sim.infoDirty=true;},
  lab:{bio:'<p><b>Do one part per class.</b> Each part has a worked example (Watch an example) and practice problems (Your turn).</p><ol><li><b>Part 1:</b> particles ↔ moles with Avogadro’s number.</li><li><b>Part 2:</b> molar mass from the periodic table.</li><li><b>Part 3:</b> grams ↔ moles with molar mass.</li><li><b>Part 4:</b> two factors in one setup, grams ↔ particles.</li></ol><p>Write every setup on paper the way the stage shows it: number and unit, then each factor as a fraction, with canceled units crossed out.</p>'},
  terms:[{t:'Mole (mol)',d:'6.022 × 10²³ particles of anything, the way a dozen is 12.'},{t:'Avogadro’s number',d:'6.022 × 10²³, the number of particles in one mole.'},{t:'Molar mass',d:'The mass of one mole of a substance, in g/mol. Add the atomic masses of every atom in the formula.'},
    {t:'Conversion factor',d:'A fraction equal to 1, like 1 mol / 6.022 × 10²³ molecules, used to change units.'},{t:'Setup (factor-label method)',d:'Writing the given amount times conversion factors so the units cancel, before doing any math.'},{t:'EE key',d:'The calculator key that enters “× 10 to the power,” so 6.022 × 10²³ stays one number (2nd then , on a TI-84; ×10ⁿ on a TI-30XS).'}],
  about:'<p>Molar masses are summed from the ChemLab periodic table (atomic masses to two decimal places in the setups; 1.008 for H). Answers are graded within 1%, so rounding in the middle is fine, and the significant figures are checked against the given value. Avogadro’s number is used as 6.022 × 10²³ (4 significant figures). The checker also looks for the common slips: a factor upside down, a power of ten typed wrong, “÷ 6.022 × 10²³” typed without the EE key, atomic numbers in place of atomic masses, and subscripts after parentheses left out. Problem amounts are typical real values (a soda can, a water bottle, an aspirin tablet), rounded.</p><p>Teachers can link straight to a part: add <code>?part=2</code> before the # in the link, for example <code>index.html?part=2#molesteps</code>.</p>',
  initVis(sim){sim.vis.refocus=false;syncUI(sim);},
  onLevel(sim){syncUI(sim);},
  thumbSetup(sim){sim.st.chain=solution(prob(sim));sim.st.ex=4;},thumbFrames:10,
  draw(sim,ctx,vdt,k,t){ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,500);if(sim.p.part===2)drawMM(sim,ctx,k,t);else drawChain(sim,ctx,k,t);}
};

/* ---------- drawing: the road (particles - moles - grams) ---------- */
function road(sim,ctx,k,P,chain,y){y=y||96;const X={n:150,mol:400,g:650},lab={n:'Particles',mol:'Moles',g:'Grams'};
  const used=legs(P).map(l=>l.join('-')),active=new Set();legs(P).forEach(l=>{active.add(l[0]);active.add(l[1]);});
  [['n','mol','÷ '+NA_S,'× '+NA_S],['mol','g','× '+MM(P.f).toFixed(2)+' g/mol','÷ '+MM(P.f).toFixed(2)+' g/mol']].forEach(([a,b,fw,bw])=>{const on=used.includes(a+'-'+b)||used.includes(b+'-'+a),fwd=used.includes(a+'-'+b);
    ctx.strokeStyle=on?'#c8102e':PAL['line'];ctx.lineWidth=on?3:2;const x1=X[a]+70,x2=X[b]-70;ctx.beginPath();ctx.moveTo(x1,y);ctx.lineTo(x2,y);ctx.stroke();
    const tip=fwd?x2:x1,d=fwd?-1:1;if(on){ctx.fillStyle='#c8102e';ctx.beginPath();ctx.moveTo(tip,y);ctx.lineTo(tip+d*11,y-6);ctx.lineTo(tip+d*11,y+6);ctx.closePath();ctx.fill();}
    if(on&&k<=1.4)txt(ctx,fwd?fw:bw,(x1+x2)/2,y-12,{s:12.5*k,w:700,a:'center',c:PAL['cv-ink']});});
  Object.keys(X).forEach(n=>{const on=active.has(n),w=130,h=40;ctx.fillStyle=on?PAL['card']:PAL['cv-bg2'];rr(ctx,X[n]-w/2,y-h/2,w,h,10);ctx.fill();ctx.strokeStyle=on?'#c8102e':PAL['line'];ctx.lineWidth=on?2.5:1.2;ctx.stroke();
    txt(ctx,lab[n],X[n],y+1,{s:15*k,w:700,a:'center',b:'middle',c:on?PAL['cv-ink']:PAL['cv-soft']});
    if(n===P.from)txt(ctx,'start',X[n],y+h/2+14*k,{s:12*k,w:700,a:'center',c:PAL['s3']});if(n===P.to)txt(ctx,'goal',X[n],y+h/2+14*k,{s:12*k,w:700,a:'center',c:'#c8102e'});});}
function wrapQ(ctx,q,k){const fs=15*k;ctx.font='700 '+fs+'px '+FONT;const words=q.split(' ');const lines=[''];words.forEach(w=>{const tt=lines[lines.length-1]?lines[lines.length-1]+' '+w:w;if(ctx.measureText(tt).width>770)lines.push(w);else lines[lines.length-1]=tt;});
  const L=lines.slice(0,3);L.forEach((l,i)=>txt(ctx,l,16,24+i*fs*1.25,{s:fs,w:700}));return 24+(L.length-1)*fs*1.25;}
function fracW(ctx,a,b,fs){ctx.font='700 '+fs+'px '+FONT;return Math.max(ctx.measureText(a).width,ctx.measureText(b||'').width)+fs*0.9;}
/* ---------- drawing: the setup ---------- */
function drawChain(sim,ctx,k,t){const p=sim.p,st=sim.st,P=prob(sim),ex=p.how==='ex';
  const chain=ex?(st.ex>=1?solution(P):[]):st.chain,qy=wrapQ(ctx,P.q,k),ry=Math.max(96,qy+30+20*k);road(sim,ctx,k,P,chain,ry);
  const showCancel=ex?st.ex>=2:true,showAns=ex?st.ex>=3:!!(st.res&&st.res.ok===true),showSF=ex?st.ex>=4:showAns,u=unitsAfter(P,chain),age=(sim.vt||t)-st.t0,grow=RM?1:clamp((age-0.3)/0.5,0,1);
  const sub=FT(P.f),word=k2=>k2==='mol'?'mol '+sub:uWord(k2,P.f);
  const items=[{top:show(P.v)+' '+word(P.from),bot:null,tk:P.from}].concat(chain.map(c=>({top:c.top.v+' '+word(c.top.k),bot:c.bot.v+' '+word(c.bot.k),tk:c.top.k,bk:c.bot.k})));
  const S=solution(P),right=valOf(P,S),sf=ansSF(P);
  const ansT=showAns?'= '+(showSF?sig(right,sf):String(+right.toPrecision(7)).replace(/e\+?(-?\d+)/,(m,e)=>' × 10'+supE(e)))+' '+uWord(P.to,P.f):null;
  if(ansT)items.push({ans:ansT});
  /* lay the setup out in rows that fit 770 px; on a phone it wraps instead of shrinking */
  let fs=24*Math.min(k,1.4);const fmin=Math.min(fs,13*k),gap=()=>fs*1.4,wOf=it=>it.ans?(ctx.font='800 '+fs+'px '+FONT,ctx.measureText(it.ans).width+8):fracW(ctx,it.top,it.bot,fs);
  const rowsAt=()=>{const R=[[]];let rw=0;items.forEach(it=>{const w=wOf(it)+12;if(R[R.length-1].length&&rw+w+gap()>770){R.push([]);rw=0;}R[R.length-1].push({it,w});rw+=w+gap();});return R;};
  let rows=rowsAt();const top=ry+46,bottom=338,fit=()=>rows.length*fs*3.3<=bottom-top;while((rows.length>1&&fs>fmin&&rows.length*fs*3.3>bottom-top)||(rows.length===1&&rows[0].reduce((a,c)=>a+c.w+gap(),0)>780&&fs>fmin)){fs-=1;rows=rowsAt();}
  const rowH=fs*3.3,y0=top+Math.max(0,(bottom-top-rows.length*rowH)/2)+rowH/2;
  const cancelled=(kk)=>showCancel&&!u[kk];
  const strike=(s2,unitTxt,xc,yy)=>{ctx.font='700 '+fs+'px '+FONT;const sw=ctx.measureText(s2).width,uw=ctx.measureText(unitTxt).width,ux=xc+sw/2-uw;ctx.strokeStyle='#c8102e';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(ux-2,yy+fs*0.3);ctx.lineTo(ux-2+(uw+4)*grow,yy-fs*0.35);ctx.stroke();};
  let idx=0;rows.forEach((row,ri)=>{const tw=row.reduce((a,c)=>a+c.w+gap(),0)-gap();let x=400-tw/2+6;const cy=y0+ri*rowH;
    row.forEach(({it,w})=>{const i=idx++,iw=w-12;
      if(it.ans){txt(ctx,it.ans,x,cy,{s:fs,w:800,b:'middle',c:PAL['s3']});x+=w+gap();return;}
      if(i>0)txt(ctx,'×',x-gap()/2,cy,{s:fs,w:700,a:'center',b:'middle',c:PAL['cv-soft']});
      if(i>0){const sq=Object.keys(u).some(q=>Math.abs(u[q])>1)&&i===chain.length&&!ex;ctx.fillStyle=PAL['card'];rr(ctx,x-6,cy-fs*1.55,iw+12,fs*3.1,9);ctx.fill();ctx.strokeStyle=sq?'#c8102e':PAL['line'];ctx.lineWidth=sq?2.5:1.5;ctx.stroke();}
      const xc=x+iw/2;
      if(it.bot===null){txt(ctx,it.top,xc,cy,{s:fs,w:700,a:'center',b:'middle'});if(cancelled(it.tk))strike(it.top,word(it.tk),xc,cy);}
      else{txt(ctx,it.top,xc,cy-fs*0.78,{s:fs,w:700,a:'center',b:'middle'});ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,cy);ctx.lineTo(x+iw,cy);ctx.stroke();txt(ctx,it.bot,xc,cy+fs*0.82,{s:fs,w:700,a:'center',b:'middle'});
        if(cancelled(it.tk))strike(it.top,word(it.tk),xc,cy-fs*0.78);if(cancelled(it.bk))strike(it.bot,word(it.bk),xc,cy+fs*0.82);}
      x+=w+gap();});});
  if(!showAns&&chain.length&&!ex)txt(ctx,'Units now: '+uTxt(u,P.f),400,Math.min(352,y0+(rows.length-1)*rowH+fs*2.1),{s:14*k,w:700,a:'center',c:Object.keys(u).some(q=>Math.abs(u[q])>1)?'#c8102e':PAL['cv-ink']});
  // the five steps of every setup
  const labs=['Given + unit','Factor, start unit on the bottom','Units cancel','Calculator','Sig figs'],sy=372,bw=148;
  const at=ex?st.ex:(!chain.length?0:!done(P,chain)?1:!st.res?3:st.res.ok===true?5:st.res.ok==='sf'?4:3);
  txt(ctx,'Every setup, in order',16,sy-24,{s:13*k,w:700,c:PAL['cv-soft']});
  labs.forEach((l,i)=>{const bx=16+i*(bw+7),on=i===at,ok=i<at;ctx.fillStyle=on?PAL['card']:PAL['cv-bg2'];rr(ctx,bx,sy,bw,64,9);ctx.fill();ctx.strokeStyle=on?'#c8102e':ok?PAL['s3']:PAL['line'];ctx.lineWidth=on?2.5:1.3;ctx.stroke();
    txt(ctx,(ok?'✓  ':'')+'Step '+(i+1),bx+10,sy+15,{s:12.5*k,w:800,c:ok?PAL['s3']:on?'#c8102e':PAL['cv-soft'],b:'middle'});
    const ws=l.split(' ');let line='',lines=[];ctx.font='600 '+(12.5*k)+'px '+FONT;ws.forEach(w=>{const tt=line?line+' '+w:w;if(ctx.measureText(tt).width>bw-20){lines.push(line);line=w;}else line=tt;});lines.push(line);
    lines.slice(0,2).forEach((s,j)=>txt(ctx,s,bx+10,sy+35+j*15*Math.min(k,1.2),{s:12.5*k,w:600,c:on||ok?PAL['cv-ink']:PAL['cv-soft'],b:'middle'}));});
  if(sim.p.how==='try'&&sim.p.fb==='end'&&!st.res&&chain.length)txt(ctx,'Feedback comes when you check your answer.',400,470,{s:12.5*k,a:'center',c:PAL['cv-soft']});}

/* ---------- drawing: molar mass ---------- */
function drawMM(sim,ctx,k,t){const p=sim.p,st=sim.st,P=prob(sim),ex=p.how==='ex',c=counts(P.f),els=Object.keys(c),M=mm2(P.f);wrapQ(ctx,P.q,k);
  const stage=ex?st.ex:(()=>{const allC=els.every(e=>st.cntRes[e]&&st.cntRes[e].ok);return st.res&&st.res.ok===true?4:allC?3:1;})();
  txt(ctx,FT(P.f),400,82,{s:34*Math.min(k,1.3),w:800,a:'center',b:'middle'});
  const cw=Math.min(170,760/els.length),x0=400-cw*els.length/2,ay=160;
  els.forEach((e,i)=>{const cx=x0+cw*i+cw/2,E=CL.el(e),known=ex?stage>=1:!!(st.cntRes[e]&&st.cntRes[e].ok);
    CL.drawAtom(ctx,cx,ay,24,e,{s:16});
    txt(ctx,E.name,cx,ay+40,{s:12.5*k,a:'center',c:PAL['cv-soft']});
    txt(ctx,known?'× '+c[e]+' atom'+(c[e]>1?'s':''):'× ?',cx,ay+64,{s:17*k,w:800,a:'center',c:known?PAL['cv-ink']:'#c8102e'});
    if(ex?stage>=2:known)txt(ctx,AMs(e)+' g/mol each',cx,ay+90,{s:13*k,w:600,a:'center',c:PAL['cv-soft']});
    if(ex?stage>=3:stage>=4)txt(ctx,'= '+(+(c[e]*AM(e)).toFixed(3)).toFixed(e==='H'?3:2),cx,ay+116,{s:16*k,w:800,a:'center',c:PAL['s3']});});
  if(ex?stage>=4:stage>=4){ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x0+20,ay+136);ctx.lineTo(x0+cw*els.length-20,ay+136);ctx.stroke();
    txt(ctx,'Molar mass = '+M.toFixed(2)+' g/mol',400,ay+162,{s:20*Math.min(k,1.3),w:800,a:'center',c:PAL['s3']});
    txt(ctx,'One mole of '+FT(P.f)+' has a mass of '+M.toFixed(2)+' grams.',400,ay+190,{s:13*k,a:'center',c:PAL['cv-soft']});}
  if(/\(/.test(P.f)&&(ex?stage>=1:true))txt(ctx,'A subscript after ( ) multiplies every atom inside the parentheses.',400,476,{s:13*k,w:700,a:'center',c:'#c8102e'});
  else if(/\*/.test(P.f))txt(ctx,'The ·5H₂O means 5 water molecules come with each formula unit.',400,476,{s:13*k,w:700,a:'center',c:'#c8102e'});}

BioLab.register(SIM);
})();
