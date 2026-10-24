(function(){
'use strict';
const {clamp,lerp,rng,rr,txt,pill,atLeast,PAL,FONT,RM,legend,serColor}=BioLab.h;
const CL=window.ChemLab;
/* Rate-law virtual lab.
   Method of initial rates: rate = k[A]^m[B]^n, integrated numerically from mixing; the "measured" initial rate carries ±2.5% scatter.
   Integrated rate laws: zero, first and second order solved exactly; data points are sampled like a data logger (±0.4% scatter).
   k(T) = k25·exp[−(Eₐ/R)(1/T − 1/298.15 K)]. */
const RG_=8.314;
const BXR=312;                       // right panel x
const S_THR=2.0e-3;                  // M of sulfur that hides the X
const EPS_CV=8.7e4;                  // M⁻¹ cm⁻¹, crystal violet at 590 nm, 1.00 cm cuvette
const SUPD={'0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','-':'⁻'};const sup=n=>String(n).split('').map(c=>SUPD[c]||c).join('');
const kUnits=n=>n===0?'M/s':n===1?'s⁻¹':'M'+sup('-'+(n-1))+'·s⁻¹';
const arr=(k25,Ea,TC)=>k25*Math.exp(-Ea*1000/RG_*(1/(TC+273.15)-1/298.15));
const sci=(v,sig)=>Number.isFinite(v)?CL.sci(v,'',sig||3):'—';
function tfmt(s){if(!Number.isFinite(s))return '—';if(s<120)return (s<10?s.toFixed(2):s.toFixed(1))+' s';if(s<7200)return (s/60).toFixed(1)+' min';return (s/3600).toFixed(2)+' h';}
function hash(str){let h=2166136261;for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619);}return ((h>>>0)%100000)/100000;}

/* ---------- reactions ---------- */
const RI={
  sulfur:{eq:'S₂O₃²⁻(aq) + 2H⁺(aq) → S(s) + SO₂(aq) + H₂O(l)',a:'S₂O₃²⁻',b:'H⁺',ca:'cS',cb:'cHs',ua:1,ub:1,ord:[1,0],k25:6.7e-4,Ea:50,nu:[1,2,1],plotY:'Sulfur formed (mM)'},
  cv:{eq:'CV⁺(aq) + OH⁻(aq) → CVOH(aq)',a:'CV⁺',b:'OH⁻',ca:'cCV',cb:'cOH',ua:1e-6,ub:1,ord:[1,1],k25:0.20,Ea:60,nu:[1,1,1],plotY:'Absorbance at 590 nm'},
  no:{eq:'2NO(g) + O₂(g) → 2NO₂(g)',a:'NO',b:'O₂',ca:'cNO',cb:'cO2',ua:1e-3,ub:1e-3,ord:[2,1],k25:7.1e3,Ea:0,nu:[2,1,2],plotY:'NO₂ formed (mM)'},
  mystery:{eq:'A + B → P',a:'A',b:'B',ca:'cMA',cb:'cMB',ua:1,ub:1,nu:[1,1,1],plotY:'P formed (M)'}
};
const RGX={
  cv:{eq:'CV⁺(aq) + OH⁻(aq) → CVOH(aq)',sp:'CV⁺',ord:1,k25:0.20,Ea:60,unit:'µM',u:1e-6,name:'Crystal violet fading in excess OH⁻'},
  first:{eq:'2N₂O₅(g) → 4NO₂(g) + O₂(g)',sp:'N₂O₅',ord:1,k25:3.46e-5,Ea:103,unit:'mM',u:1e-3,name:'N₂O₅ decomposition'},
  second:{eq:'2NO₂(g) → 2NO(g) + O₂(g)',sp:'NO₂',ord:2,kfix:0.543,unit:'mM',u:1e-3,name:'NO₂ decomposition at 300 °C'},
  zero:{eq:'2NH₃(g) → N₂(g) + 3H₂(g)',sp:'NH₃',ord:0,kfix:2.5e-5,unit:'mM',u:1e-3,name:'NH₃ on a hot tungsten wire'}
};
const MECH={
  a:{name:'One step',steps:[['2NO₂ + F₂ → 2NO₂F','one step']],pred:'rate = k[NO₂]²[F₂]',ok:false,bars:[16],
     why:'A one-step reaction’s rate law comes straight from its coefficients, so this predicts second order in NO₂. It also needs three molecules to collide at once, which is very rare.'},
  b:{name:'Slow step first',steps:[['NO₂ + F₂ → NO₂F + F','slow'],['NO₂ + F → NO₂F','fast']],pred:'rate = k₁[NO₂][F₂]',ok:true,bars:[15,5],
     why:'The slow first step limits the rate, and its reactants are one NO₂ and one F₂. F is an intermediate: made in step 1, used in step 2.'},
  c:{name:'Fast equilibrium first',steps:[['F₂ ⇌ 2F','fast'],['NO₂ + F → NO₂F','slow, twice']],pred:'rate = k[NO₂][F₂]¹ᐟ²',ok:false,bars:[5,14],
     why:'The slow step uses F, an intermediate. Replacing [F] using the fast equilibrium K = [F]²/[F₂] gives [F] = (K[F₂])¹ᐟ², so the rate is half order in F₂.'}
};
const curI=p=>RI[p.rxnI],curG=p=>RGX[p.rxnG];
const tempUsed=p=>(p.mode==='initial'&&(p.rxnI==='sulfur'||p.rxnI==='cv'))||(p.mode==='integrated'&&(p.rxnG==='first'||p.rxnG==='cv'));
const Teff=p=>atLeast('ap')&&tempUsed(p)?p.T:25;
function mys(sim){return sim.mys||(sim.mys={m:1,n:2,k:0.050,id:0});}
function iParams(sim){const p=sim.p,R=curI(p);if(p.rxnI==='mystery'){const y=mys(sim);return {m:y.m,n:y.n,k:y.k};}
  return {m:R.ord[0],n:R.ord[1],k:R.Ea?arr(R.k25,R.Ea,Teff(p)):R.k25};}
function gK(sim){const p=sim.p,R=curG(p);if(R.kfix!==undefined)return R.kfix;const k=arr(R.k25,R.Ea,Teff(p));return p.rxnG==='cv'?k*p.cOH:k;}
function gA0(p){return p.rxnG==='cv'?p.cCV*1e-6:p.g0*1e-3;}
function gConc(sim,t){const p=sim.p,R=curG(p),k=gK(sim),A0=gA0(p);if(R.ord===0)return Math.max(0,A0-k*t);if(R.ord===1)return A0*Math.exp(-k*t);return A0/(1+k*A0*t);}
function gHalf(sim){const p=sim.p,R=curG(p),k=gK(sim),A0=gA0(p);return R.ord===0?A0/(2*k):R.ord===1?Math.LN2/k:1/(k*A0);}
function gEnd(sim){const R=curG(sim.p),k=gK(sim),A0=gA0(sim.p);return R.ord===0?0.92*A0/k:R.ord===1?3*Math.LN2/k:5/(k*A0);}
function i0(sim){const p=sim.p,R=curI(p),pr=iParams(sim);return {A0:p[R.ca]*R.ua,B0:p[R.cb]*R.ub,pr};}
function iRate(sim,a,b){const pr=iParams(sim);if(a<=0||b<=0)return 0;return pr.k*Math.pow(a,pr.m)*Math.pow(b,pr.n);}
function iTrueR0(sim){const x=i0(sim);return iRate(sim,x.A0,x.B0);}
function iMeasR0(sim){const p=sim.p,x=i0(sim);return iTrueR0(sim)*(1+0.05*(hash([p.rxnI,x.A0,x.B0,Teff(p),mys(sim).id].join('|'))-0.5));}
function iEnd(sim){const p=sim.p,R=curI(p),x=i0(sim),r0=iTrueR0(sim);if(p.rxnI==='sulfur')return 1.25*(-Math.log(1-S_THR/x.A0)/iParams(sim).k);
  return 0.3*Math.min(x.A0/(R.nu[0]*r0),x.B0/(R.nu[1]*r0));}
const keyOf=(sim)=>{const p=sim.p;return [p.mode,p.rxnI,p.rxnG,p.cS,p.cHs,p.cCV,p.cOH,p.cNO,p.cO2,p.cMA,p.cMB,p.g0,Teff(p),mys(sim).id].join('|');};

/* ---------- which controls and readouts belong to the current setup ---------- */
function vis(sim,o){const p=sim.p;if(!atLeast(o.lvl))return false;if(!o.show)return true;return o.show(p);}
function syncMode(sim){if(!sim.ui||!sim.ui.sec)return;const d=sim.def;
  if(!atLeast('ap')&&sim.p.mode==='mech')BioLab.setValues(sim,{mode:'initial'});
  d.controls.forEach(c=>{if(!c.show)return;const v=vis(sim,c);c.noTrial=!v;const cid=d.id+'-'+c.id,e=document.getElementById(cid)||document.getElementById(cid+'-l');if(!e)return;const w=e.closest('.ctl');if(w)w.hidden=!v;});
  d.metrics.forEach(m=>{if(!m.show)return;const v=vis(sim,m);m.noTrial=!v;const t=sim.ui.tiles[m.id];if(!t)return;const w=t.num.closest('.tile');if(w)w.hidden=!v;});
  const btns=[...sim.ui.sec.querySelectorAll('.actions button')];d.actions.forEach(a=>{const b=btns.find(x=>x.textContent===a.label);if(b)b.hidden=!atLeast(a.lvl)||(a.show&&!a.show(sim.p));});}
const isI=p=>p.mode==='initial',isG=p=>p.mode==='integrated',isM=p=>p.mode==='mech';

/* ---------- integrated-mode data logger ---------- */
function gPoints(sim){const st=sim.st,n=16,te=st.tend,out=[];for(let i=0;i<=n;i++){const t=te*i/n;if(t>st.rt+1e-12)break;let c=gConc(sim,t);c*=1+0.008*(hash(st.key+'#'+i)-0.5);out.push([t,c]);}return out;}
function fit(pts){const n=pts.length;if(n<3)return null;let sx=0,sy=0,sxx=0,sxy=0,syy=0;pts.forEach(([x,y])=>{sx+=x;sy+=y;sxx+=x*x;sxy+=x*y;syy+=y*y;});
  const d=n*sxx-sx*sx;if(Math.abs(d)<1e-30)return null;const m=(n*sxy-sx*sy)/d,b=(sy-m*sx)/n;const ssr=pts.reduce((a,[x,y])=>a+(y-(m*x+b))**2,0),sst=syy-sy*sy/n;return {m,b,r2:sst>0?1-ssr/sst:1};}
function transforms(sim){const R=curG(sim.p),pts=gPoints(sim).filter(q=>q[1]>0),u=R.unit==='µM'?1e-6:1e-3;
  const cv=sim.p.rxnG==='cv',y0=q=>cv?q[1]*EPS_CV:q[1]/u;
  const P=[pts.map(q=>[q[0],y0(q)]),pts.map(q=>[q[0],Math.log(y0(q))]),pts.map(q=>[q[0],1/y0(q)])];
  return P.map(ps=>({pts:ps,f:fit(ps)}));}

function restart(sim){const p=sim.p,st={key:keyOf(sim),rt:0,fast:1,tend:1,done:false,a:0,b:0,P:0,tX:NaN,rec:false,mol:[]};
  if(isI(p)){const x=i0(sim);st.a=x.A0;st.b=x.B0;st.tend=iEnd(sim);}
  else if(isG(p)){st.tend=gEnd(sim);}
  st.fast=st.tend/10;sim.st=st;initMol(sim);}

/* ---------- molecules in the zoom circle (integrated mode) ---------- */
const ZX=156,ZY=394,ZR=84;
const GLYPH={N2O5:[['N',-8,0],['O',-13,-6],['O',-13,6],['O',0,-1],['N',8,0],['O',13,-6],['O',13,6]],NO2:[['N',0,-1],['O',-6,3],['O',6,3]],O2:[['O',-3.5,0],['O',3.5,0]],NO:[['N',-3.5,0],['O',3.5,0]],
  NH3:[['N',0,0],['H',-6,4],['H',6,4],['H',0,-6]],N2:[['N',-3.5,0],['N',3.5,0]],H2:[['H',-2.6,0],['H',2.6,0]],OH:[['O',-2,0],['H',4,0]]};
const RAD={N:4.6,O:4.4,H:3};
const PROD={first:[['NO2',4],['O2',1]],second:[['NO',2],['O2',1]],zero:[['N2',1],['H2',3]],cv:[['CVOH',1]]};
const REACT={first:'N2O5',second:'NO2',zero:'NH3',cv:'CV'};
const NZ=24;
function initMol(sim){const st=sim.st,p=sim.p;st.mol=[];if(!isG(p))return;const r=rng(77);st.zr=r;
  const add=k=>{const a=r()*6.283,d=Math.sqrt(r())*(ZR-12);st.mol.push({k,x:ZX+Math.cos(a)*d,y:ZY+Math.sin(a)*d,a:r()*6.283,vx:0,vy:0});};
  for(let i=0;i<NZ;i++)add(REACT[p.rxnG]);if(p.rxnG==='cv')for(let i=0;i<14;i++)add('OH');st.molAdd=add;}
function syncMol(sim){const st=sim.st,p=sim.p;if(!isG(p)||!st.mol)return;const R=curG(p),key=REACT[p.rxnG];
  const frac=gConc(sim,st.rt)/gA0(p),per=p.rxnG==='cv'?1:2,want=Math.round(NZ*frac/per)*per;let have=st.mol.filter(m=>m.k===key).length;
  while(have>want){const list=st.mol.filter(m=>m.k===key);const m0=list[Math.floor(st.zr()*list.length)];let cx=m0.x,cy=m0.y;
    if(per===2){const others=list.filter(m=>m!==m0);let best=others[0],bd=1e9;others.forEach(m=>{const e=(m.x-cx)**2+(m.y-cy)**2;if(e<bd){bd=e;best=m;}});best.dead=true;cx=(cx+best.x)/2;cy=(cy+best.y)/2;}
    m0.dead=true;if(p.rxnG==='cv'){const oh=st.mol.find(m=>m.k==='OH'&&!m.dead);if(oh){oh.dead=true;st.molAdd('OH');}}
    st.mol=st.mol.filter(m=>!m.dead);PROD[p.rxnG].forEach(([k,n])=>{for(let i=0;i<n;i++){const a=st.zr()*6.283;st.mol.push({k,x:cx+Math.cos(a)*8,y:cy+Math.sin(a)*8,a:st.zr()*6.283,vx:Math.cos(a)*30,vy:Math.sin(a)*30,fl:0.5});}});
    have-=per;}}

const RL={
  id:'ratelaw',hash:'ratelaw',apUnit:12,order:2,kind:'Virtual lab',tab:'Rate laws',
  prereq:['rates'],next:['beerslaw','equilibrium'],
  card:'Run the sulfur clock and crystal violet labs, find reaction orders from initial rates, and pick the straight-line plot that reveals the rate law.',
  title:'Rate laws: initial rates, integrated rate laws and mechanisms',
  lede:{bio:'Time how long a reaction takes to hide an X and watch crystal violet fade. Change one concentration at a time and see which ones matter.',
        honors:'Find the order of each reactant by the method of initial rates, then use [A], ln[A] and 1/[A] plots and half-lives to identify zero-, first- and second-order reactions.',
        ap:'Determine full rate laws with units of k, use pseudo-first-order conditions, build an Arrhenius plot to find Eₐ, and test which mechanism fits the observed rate law.'},
  scale:{bio:'Lab-bench scale: a flask on a sheet of paper, a colorimeter cuvette, a glass gas bulb. The zoom circle shows a few of the molecules inside.',
         honors:'Lab-bench scale. The clock shows reaction time; runs are sped up so each one takes about 10 seconds to watch.'},
  aspect:1.6,timeScale:1,dtMax:0.02,sampleDt:0.2,window:30,unit:'s',chChange:11,chReveal:23,
  clock(sim){const p=sim.p,st=sim.st;if(isM(p))return '';const sp=st.fast;return 'Reaction time '+tfmt(st.rt)+(sp>1.5?' (sped up '+(sp>=1000?CL.sci(sp,'',2):sp.toFixed(0))+'×)':'');},
  controls:[
    {id:'mode',label:'Experiment',type:'seg',def:'initial',lvl:'bio',options:[{v:'initial',l:'Initial rates'},{v:'integrated',l:'Concentration vs time'},{v:'mech',l:'Mechanisms',lvl:'ap'}]},
    {id:'rxnI',label:'Reaction',type:'select',def:'sulfur',lvl:'bio',show:isI,options:[{v:'sulfur',l:'Sulfur clock: S₂O₃²⁻ + HCl'},{v:'cv',l:'Crystal violet + OH⁻',lvl:'honors'},{v:'no',l:'2NO + O₂ → 2NO₂',lvl:'honors'},{v:'mystery',l:'Mystery reaction A + B',lvl:'honors'}]},
    {id:'rxnG',label:'Reaction',type:'select',def:'cv',lvl:'bio',show:isG,options:[{v:'cv',l:'Crystal violet fading'},{v:'first',l:'2N₂O₅ → 4NO₂ + O₂',lvl:'honors'},{v:'second',l:'2NO₂ → 2NO + O₂',lvl:'honors'},{v:'zero',l:'2NH₃ → N₂ + 3H₂ on tungsten',lvl:'honors'}]},
    {id:'cS',label:'[S₂O₃²⁻] (thiosulfate)',type:'range',min:0.025,max:0.15,step:0.025,def:0.1,d:3,unit:' M',lvl:'bio',show:p=>isI(p)&&p.rxnI==='sulfur'},
    {id:'cHs',label:'[HCl]',type:'range',min:0.5,max:2,step:0.25,def:1,unit:' M',lvl:'bio',show:p=>isI(p)&&p.rxnI==='sulfur'},
    {id:'cCV',label:'[CV⁺] (crystal violet)',type:'range',min:5,max:25,step:2.5,def:10,d:1,unit:' µM',lvl:'bio',show:p=>(isI(p)&&p.rxnI==='cv')||(isG(p)&&p.rxnG==='cv')},
    {id:'cOH',label:'[OH⁻] (from NaOH)',type:'range',min:0.02,max:0.1,step:0.01,def:0.05,unit:' M',lvl:'bio',show:p=>(isI(p)&&p.rxnI==='cv')||(isG(p)&&p.rxnG==='cv')},
    {id:'cNO',label:'[NO]',type:'range',min:1,max:5,step:0.5,def:2,unit:' mM',lvl:'honors',show:p=>isI(p)&&p.rxnI==='no'},
    {id:'cO2',label:'[O₂]',type:'range',min:1,max:5,step:0.5,def:2,unit:' mM',lvl:'honors',show:p=>isI(p)&&p.rxnI==='no'},
    {id:'cMA',label:'[A]',type:'range',min:0.1,max:0.5,step:0.05,def:0.2,unit:' M',lvl:'honors',show:p=>isI(p)&&p.rxnI==='mystery'},
    {id:'cMB',label:'[B]',type:'range',min:0.1,max:0.5,step:0.05,def:0.2,unit:' M',lvl:'honors',show:p=>isI(p)&&p.rxnI==='mystery'},
    {id:'g0',label:'Starting concentration',type:'range',min:5,max:50,step:5,def:20,unit:' mM',lvl:'honors',show:p=>isG(p)&&p.rxnG!=='cv'},
    {id:'T',label:'Temperature',type:'range',min:15,max:65,step:5,def:25,unit:' °C',lvl:'ap',show:tempUsed,help:'Used for the sulfur clock, crystal violet and N₂O₅.'},
    {id:'gm',label:'Your order in the first reactant (m)',type:'seg',def:1,lvl:'honors',show:isI,options:[{v:0,l:'0'},{v:1,l:'1'},{v:2,l:'2'}]},
    {id:'gn',label:'Your order in the second reactant (n)',type:'seg',def:1,lvl:'honors',show:isI,options:[{v:0,l:'0'},{v:1,l:'1'},{v:2,l:'2'}]},
    {id:'check',label:'Check my rate law',type:'toggle',def:false,lvl:'honors',show:isI,noTrial:true},
    {id:'mech',label:'Proposed mechanism',type:'seg',def:'a',lvl:'ap',show:isM,options:[{v:'a',l:'One step'},{v:'b',l:'Slow step first'},{v:'c',l:'Fast equilibrium first'}]}
  ],
  actions:[{id:'mix',label:'Mix a fresh run',lvl:'bio',primary:true,show:p=>!isM(p),run(sim){restart(sim);}},
    {id:'newmys',label:'New mystery reaction',lvl:'honors',show:p=>isI(p)&&p.rxnI==='mystery',run(sim){const y=mys(sim),pick=()=>[0,1,2][Math.floor(Math.random()*3)];let m,n;do{m=pick();n=pick();}while(m+n===0||(m===y.m&&n===y.n));
      sim.mys={m,n,k:+(Math.pow(10,-2+Math.random()*1.5)).toPrecision(2),id:y.id+1};BioLab.setValues(sim,{check:false});restart(sim);}}],
  init(sim){restart(sim);return sim.st;},
  step(sim,dt){const p=sim.p;if(keyOf(sim)!==sim.st.key)restart(sim);const st=sim.st;if(isM(p))return;
    if(st.done){animMol(sim,dt);return;}
    const dtr=Math.min(dt*st.fast,st.tend-st.rt);
    if(isI(p)){const R=curI(p),n=20,h=dtr/n;for(let i=0;i<n;i++){const r=iRate(sim,st.a,st.b);st.a=Math.max(0,st.a-R.nu[0]*r*h);st.b=Math.max(0,st.b-R.nu[1]*r*h);st.P+=R.nu[2]*r*h;
        if(p.rxnI==='sulfur'&&Number.isNaN(st.tX)&&st.P>=S_THR)st.tX=st.rt+h*(i+1);}}
    st.rt+=dtr;if(st.rt>=st.tend-1e-12){st.done=true;logArr(sim);}
    syncMol(sim);animMol(sim,dt);},
  metrics:[
    {id:'tX',label:'Time for the X to disappear',unit:'s',lvl:'bio',min:0,max:null,d:1,show:p=>isI(p)&&p.rxnI==='sulfur',get:s=>s.st.tX},
    {id:'rel',label:'Rate (1000 ÷ time)',unit:'s⁻¹',lvl:'bio',min:0,max:null,d:1,show:p=>isI(p)&&p.rxnI==='sulfur',get:s=>1000/s.st.tX},
    {id:'r0',label:'Initial rate',unit:'M/s',lvl:'honors',text:true,show:isI,get:s=>s.st.rt<0.04*s.st.tend?'measuring…':sci(iMeasR0(s),3)},
    {id:'kfit',label:'k from your rate law',unit:'',lvl:'ap',text:true,show:isI,get:s=>s.st.rt<0.04*s.st.tend?'measuring…':kFromGuess(s)},
    {id:'abs',label:'Absorbance now',unit:'',lvl:'bio',min:0,max:2.5,d:3,show:p=>isG(p)&&p.rxnG==='cv',get:s=>gConc(s,s.st.rt)*EPS_CV},
    {id:'cnow',label:'Concentration now',unit:'',lvl:'bio',text:true,show:isG,get:s=>{const R=curG(s.p);return (gConc(s,s.st.rt)/R.u).toFixed(R.unit==='µM'?2:2)+' '+R.unit;}},
    {id:'half',label:'Half-life',unit:'',lvl:'bio',text:true,show:isG,get:s=>tfmt(gHalf(s))},
    {id:'R2a',label:'R² for [A] vs t',unit:'',lvl:'honors',min:0,max:1,d:4,show:isG,get:s=>{const f=transforms(s)[0].f;return f?f.r2:NaN;}},
    {id:'R2b',label:'R² for ln[A] vs t',unit:'',lvl:'honors',min:0,max:1,d:4,show:isG,get:s=>{const f=transforms(s)[1].f;return f?f.r2:NaN;}},
    {id:'R2c',label:'R² for 1/[A] vs t',unit:'',lvl:'honors',min:0,max:1,d:4,show:isG,get:s=>{const f=transforms(s)[2].f;return f?f.r2:NaN;}},
    {id:'kint',label:'Rate constant k',unit:'',lvl:'ap',text:true,show:isG,get:s=>{const R=curG(s.p);return sci(gK(s),3)+' '+kUnits(R.ord);}},
    {id:'pred',label:'This mechanism predicts',unit:'',lvl:'ap',text:true,show:isM,get:s=>MECH[s.p.mech].pred},
    {id:'match',label:'Matches the experiment?',unit:'',lvl:'ap',text:true,show:isM,get:s=>MECH[s.p.mech].ok?'Yes: rate = k[NO₂][F₂]':'No: experiment says rate = k[NO₂][F₂]'}
  ],
  graphs:[{id:'ct',label:'Concentration vs time',lvl:'bio',custom:true},{id:'arr',label:'Arrhenius plot: ln k vs 1/T',lvl:'ap',custom:true}],
  defaultGraph:'ct',
  plot(sim,ctx,box,id){const p=sim.p,st=sim.st;
    const msg=s=>txt(ctx,s,box.cw/2,box.ch/2,{s:15,c:PAL['muted'],a:'center',b:'middle'});
    if(id==='arr'){const key=isI(p)?p.rxnI:p.rxnG,ptsA=((sim.arr||{})[key]||[]);
      if(!(tempUsed(p)))return msg('Choose the sulfur clock, crystal violet or N₂O₅ to collect k at different temperatures.');
      if(ptsA.length<2)return msg('Finish runs at two or more temperatures to build the plot ('+ptsA.length+' so far).');
      const xs=ptsA.map(q=>1000/(q.T+273.15)),ys=ptsA.map(q=>Math.log(q.k));const f=fit(ptsA.map((q,i)=>[xs[i],ys[i]]))||{m:0,b:ys[0]};
      const xmin=Math.min(...xs)-0.03,xmax=Math.max(...xs)+0.03,ymin=Math.min(...ys)-0.4,ymax=Math.max(...ys)+0.4;box.T=34;box.H=box.ch-34-40;
      const ax=BioLab.h.axes(ctx,box,{xmin,xmax,ymin,ymax,xl:'1000/T (1/K)',yl:'ln k',xd:2,yd:1});
      ctx.save();ctx.beginPath();ctx.rect(box.L,box.T,box.W,box.H);ctx.clip();ctx.strokeStyle=PAL['muted'];ctx.setLineDash([5,4]);ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(ax.X(xmin),ax.Y(f.m*xmin+f.b));ctx.lineTo(ax.X(xmax),ax.Y(f.m*xmax+f.b));ctx.stroke();ctx.setLineDash([]);
      xs.forEach((x,i)=>{ctx.fillStyle=PAL['g-dot'];ctx.beginPath();ctx.arc(ax.X(x),ax.Y(ys[i]),5.5,0,6.29);ctx.fill();});ctx.restore();
      txt(ctx,'slope = '+f.m.toFixed(2)+' K  →  Eₐ = −slope × R = '+(-f.m*1000*RG_/1000).toFixed(0)+' kJ/mol',box.L,16,{s:13,c:PAL['muted']});return;}
    if(isM(p))return msg('Mechanisms have no time data. Compare the predicted and experimental rate laws above.');
    const curve=[];const N=120;for(let i=0;i<=N;i++){const t=st.tend*i/N;if(t>st.rt)break;curve.push([t,ySeries(sim,t)]);}
    const yl=isI(p)?curI(p).plotY:(p.rxnG==='cv'?'Absorbance':'['+curG(p).sp+'] ('+curG(p).unit+')');
    const ymax=Math.max(1e-9,isI(p)?ySeries(sim,st.tend):ySeries(sim,0))*1.1;
    const tu=tUnit(st.tend);const ax=BioLab.h.axes(ctx,box,{xmin:0,xmax:st.tend/tu.f,ymin:0,ymax,xl:'Reaction time ('+tu.u+')',yl});
    ctx.save();ctx.beginPath();ctx.rect(box.L,box.T,box.W,box.H);ctx.clip();ctx.strokeStyle=PAL['g-line'];ctx.lineWidth=2.5;ctx.beginPath();curve.forEach(([t,y],i)=>{i?ctx.lineTo(ax.X(t/tu.f),ax.Y(y)):ctx.moveTo(ax.X(t/tu.f),ax.Y(y));});ctx.stroke();ctx.restore();},
  narrate(sim){const p=sim.p,st=sim.st,hon=atLeast('honors'),ap=atLeast('ap');
    if(isM(p)){const M=MECH[p.mech];return (M.ok?'<b>This mechanism fits.</b> ':'<b>This mechanism does not fit.</b> ')+M.why;}
    if(isI(p)){const R=curI(p);
      if(p.rxnI==='sulfur'){if(Number.isNaN(st.tX))return 'Thiosulfate and acid are making tiny grains of <b>solid sulfur</b>, so the solution turns cloudy. Time how long it takes until you cannot see the X through the flask.';
        return 'The X disappeared after <b>'+st.tX.toFixed(1)+' s</b>. '+(hon?'Change one concentration at a time and compare times: if halving the time came from doubling a reactant, the rate is first order in it.':'A shorter time means a faster reaction. Try a different thiosulfate concentration, then a different acid concentration.');}
      const pr=iParams(sim);let s='Mixing starts the clock. The <b>initial rate</b> is the slope of the dashed tangent line at t = 0, before the concentrations change much.';
      if(p.rxnI==='cv')s='Crystal violet (purple) reacts with OH⁻ to make a colorless product, so the colorimeter reading falls. The <b>initial rate</b> is the starting slope of [CV⁺].';
      if(p.check)s+=(p.gm===pr.m&&p.gn===pr.n)?' <b>Your rate law is right.</b>':' <b>Not yet.</b> Compare two trials where only one concentration changed.';
      return s;}
    const R=curG(p),c=gConc(sim,st.rt),frac=c/gA0(p);
    let s=p.rxnG==='cv'?'Each CV⁺ ion that meets OH⁻ loses its color, so the purple fades and the absorbance drops.':'The '+R.sp+' molecules are breaking down, so their concentration falls.';
    if(R.ord===1)s+=' <b>Each half-life takes the same time</b> ('+tfmt(gHalf(sim))+'), no matter how much is left.';
    else if(R.ord===0)s+=' The concentration drops by the <b>same amount</b> each second until the reactant runs out.';
    else s+=' The reaction slows sharply as '+R.sp+' runs low, so each half-life is <b>twice as long</b> as the one before.';
    if(hon&&st.rt>0.3*st.tend){const T=transforms(sim);const best=T.map((x,i)=>[x.f?x.f.r2:0,i]).sort((a,b)=>b[0]-a[0])[0][1];s+=' The straightest plot is <b>'+['[A]','ln[A]','1/[A]'][best]+' vs t</b>, so the reaction is '+['zero','first','second'][best]+' order.';}
    if(ap&&p.rxnG==='cv')s+=' OH⁻ is in huge excess, so its concentration hardly changes: k′ = k[OH⁻] = '+sci(gK(sim),3)+' s⁻¹ (pseudo-first-order).';
    return s;},
  tour:[
    {title:'The sulfur clock',text:'Thiosulfate reacts with acid to make solid sulfur. You look down through the flask at an X on paper. As sulfur grains form, the solution clouds over until the X disappears. Stop the clock then.',focus:[10,44,296,452],speed:1,setup(sim){BioLab.setValues(sim,{mode:'initial',rxnI:'sulfur',cS:0.1,cHs:1});syncMode(sim);restart(sim);}},
    {title:'Watch the sulfur build up',text:'The graph shows how much sulfur has formed. The X vanishes when about 2 mM of sulfur is in the flask. A faster reaction reaches that line sooner.',focus:[BXR,44,480,286],speed:1},
    {title:'Change one thing at a time',text:{bio:'Now the thiosulfate is cut in half. The reaction is slower, so it takes about twice as long to hide the X.',honors:'Halving [S₂O₃²⁻] doubles the time, so it halves the rate: first order in thiosulfate. Try the same with HCl and the time barely changes: zero order in H⁺.'},focus:[[10,44,296,452],[BXR,44,480,286]],speed:1,setup(sim){BioLab.setValues(sim,{cS:0.05});}},
    {lvl:'honors',title:'Initial rate is a slope',text:'For crystal violet, the colorimeter tracks the purple color. The dashed tangent at t = 0 is the initial rate. Comparing initial rates between trials gives the order of each reactant.',focus:[BXR,44,480,286],speed:1,setup(sim){BioLab.setValues(sim,{rxnI:'cv',cCV:10,cOH:0.05});syncMode(sim);}},
    {title:'Concentration over time',text:{bio:'Crystal violet fades. The concentration drops fast at first, then slower. Each half-life takes the same time: half, then a quarter, then an eighth is left.',honors:'Plot [A], ln[A] and 1/[A] against time. Only one of them is a straight line. For crystal violet in excess OH⁻ it is ln[A]: first order.'},focus:[[10,44,296,452],[BXR,44,480,452]],speed:1,setup(sim){BioLab.setValues(sim,{mode:'integrated',rxnG:'cv',cCV:15,cOH:0.05});syncMode(sim);}},
    {lvl:'honors',title:'A second-order reaction',text:'2NO₂ → 2NO + O₂. Now 1/[A] vs t is the straight one, and each half-life is twice as long as the last because the rate depends on [NO₂]².',focus:[BXR,44,480,452],speed:1,setup(sim){BioLab.setValues(sim,{rxnG:'second',g0:20});syncMode(sim);}},
    {lvl:'ap',title:'Temperature and Eₐ',text:'Run N₂O₅ at several temperatures. k grows about 4× for each 10 °C. A plot of ln k against 1/T is a straight line with slope −Eₐ/R.',focus:[[BXR,44,480,452]],speed:1,setup(sim){BioLab.setValues(sim,{rxnG:'first',T:45,g0:20});syncMode(sim);}},
    {lvl:'ap',title:'Mechanisms',text:'The slow step controls the rate. A mechanism fits only if its slow step (with intermediates replaced) gives the experimental rate law, and its steps add up to the overall equation.',focus:[[0,0,800,500]],speed:1,pause:true,setup(sim){BioLab.setValues(sim,{mode:'mech',mech:'b'});syncMode(sim);}}
  ],
  onTourExit(sim){const base={};sim.def.controls.forEach(c=>base[c.id]=c.def);BioLab.setValues(sim,base);syncMode(sim);restart(sim);},
  onChallenge(sim,ch,phase){if(ch&&ch.instant&&ch.set&&phase==='done'){BioLab.setValues(sim,ch.set);syncMode(sim);restart(sim);}},
  challenges:[
    {lvl:'bio',q:'With 0.050 M thiosulfate the X disappears after about 60 s. If you double the thiosulfate to 0.100 M, the X disappears after…',choices:['about 30 s','about 60 s','about 120 s'],correct:0,
     baseline:{mode:'initial',rxnI:'sulfur',cS:0.05,cHs:1},change:{cS:0.1},changeText:'Fresh run with 0.100 M thiosulfate',
     explain:{bio:'Twice as many thiosulfate ions means twice as many reactions every second, so the sulfur reaches the hiding point in about half the time. Check the Time readout.',honors:'Rate ∝ [S₂O₃²⁻]¹: doubling the concentration doubles the rate and halves the time. That is first order.'}},
    {lvl:'bio',q:'The X takes 30 s to disappear with 1.0 M HCl. You double the acid to 2.0 M. The time becomes…',choices:['about 15 s, because more acid always means faster','about the same','longer'],correct:1,
     baseline:{mode:'initial',rxnI:'sulfur',cS:0.1,cHs:1},change:{cHs:2},changeText:'Fresh run with 2.0 M HCl',
     explain:{bio:'Surprise: the acid concentration barely matters here. Not every reactant speeds up a reaction when you add more of it. You can only find out by testing each one.',honors:'The rate is zero order in H⁺: rate = k[S₂O₃²⁻]¹[H⁺]⁰. Orders come from experiments, not from the coefficients in the balanced equation (the 2 in front of H⁺ means nothing here).'}},
    {lvl:'bio',instant:true,set:{mode:'integrated',rxnG:'cv',cCV:15,cOH:0.05},q:'Crystal violet fades to half its color in 69 s. How long until only a quarter of the color is left?',choices:['about 104 s','about 138 s','about 276 s'],correct:1,
     explain:{bio:'In each half-life, half of what is left reacts. After one half-life (69 s) half is left; after two half-lives (138 s) a quarter is left. Watch the half-life marks on the graph line up evenly.',honors:'This is a first-order process: t½ = 0.693/k′ is constant, so two half-lives take 2 × 69 s = 138 s.'}},
    {lvl:'honors',instant:true,set:{mode:'initial',rxnI:'no',cNO:4,cO2:2},q:'2NO + O₂ → 2NO₂. Doubling [NO] (with [O₂] fixed) makes the initial rate 4 times bigger. What is the order in NO?',choices:['1','2','4'],correct:1,
     explain:{honors:'Rate ratio = (concentration ratio)ᵐ, so 4 = 2ᵐ and m = 2. The model is now set to [NO] = 4.0 mM; compare its Initial rate with [NO] = 2.0 mM. Set m = 2 and turn on Check my rate law.'}},
    {lvl:'honors',q:'Crystal violet is first order in CV⁺. What happens to its half-life if you double [OH⁻] from 0.04 M to 0.08 M?',choices:['Nothing, because the reaction is first order in CV⁺','It is cut in half','It doubles'],correct:1,
     baseline:{mode:'integrated',rxnG:'cv',cCV:10,cOH:0.04},change:{cOH:0.08},changeText:'Fresh run with twice the OH⁻',watch:'ct',
     explain:{honors:'The full rate law is rate = k[CV⁺][OH⁻]. OH⁻ is in huge excess, so it acts like part of the rate constant: k′ = k[OH⁻]. Doubling [OH⁻] doubles k′, and t½ = 0.693/k′ halves (from 87 s to 43 s).'}},
    {lvl:'honors',instant:true,set:{mode:'integrated',rxnG:'first',g0:20},q:'For 2N₂O₅ → 4NO₂ + O₂, which plot gives a straight line?',choices:['[N₂O₅] vs t','ln[N₂O₅] vs t','1/[N₂O₅] vs t'],correct:1,
     explain:{honors:'ln[N₂O₅] vs t is straight (R² ≈ 1), so the reaction is first order: ln[A] = ln[A]₀ − kt. The coefficient 2 in the equation does not make it second order.'}},
    {lvl:'ap',instant:true,set:{mode:'initial',rxnI:'no',cNO:2,cO2:2,gm:2,gn:1},q:'rate = k[NO]²[O₂]. What are the units of k when the rate is in M/s?',choices:['M⁻¹·s⁻¹','M⁻²·s⁻¹','s⁻¹'],correct:1,
     explain:{ap:'The overall order is 3. k = rate/([NO]²[O₂]) has units (M/s)/M³ = M⁻²·s⁻¹. The k from your rate law readout shows this for m = 2, n = 1.'}},
    {lvl:'ap',q:'N₂O₅ decomposes at 25 °C. You warm it to 35 °C, only 3% hotter in kelvin. The rate constant k…',choices:['rises by about 3%','roughly doubles','rises about 4 times'],correct:2,
     baseline:{mode:'integrated',rxnG:'first',g0:20,T:25},change:{T:35},changeText:'Fresh run at 35 °C',watch:'ct',
     explain:{ap:'With Eₐ = 103 kJ/mol, ln(k₂/k₁) = (Eₐ/R)(1/298 − 1/308) = 1.35, so k rises 3.9×: from 3.46 × 10⁻⁵ to 1.33 × 10⁻⁴ s⁻¹ (the classic measurement is 1.35 × 10⁻⁴). Large Eₐ means strong temperature dependence.'}},
    {lvl:'ap',instant:true,set:{mode:'mech',mech:'b'},q:'The experimental rate law for 2NO₂ + F₂ → 2NO₂F is rate = k[NO₂][F₂]. Which mechanism fits?',choices:['One step: 2NO₂ + F₂ → 2NO₂F','Slow: NO₂ + F₂ → NO₂F + F, then fast: NO₂ + F → NO₂F','Fast: F₂ ⇌ 2F, then slow: NO₂ + F → NO₂F'],correct:1,
     explain:{ap:'The slow first step has one NO₂ and one F₂, which gives rate = k₁[NO₂][F₂]. The steps add up to the overall equation, and F is an intermediate. The other two predict [NO₂]² and [F₂]¹ᐟ².'}},
    {lvl:'ap',instant:true,set:{mode:'integrated',rxnG:'zero',g0:40},q:'NH₃ decomposes on hot tungsten with zero-order kinetics. If you double [NH₃]₀, the half-life…',choices:['stays the same','doubles','halves'],correct:1,
     explain:{ap:'For zero order, t½ = [A]₀/2k: the rate is fixed by the crowded metal surface, so twice as much NH₃ takes twice as long to use up half of it. The model is set to 40 mM; compare the Half-life readout with 20 mM.'}}
  ],
  lab:{bio:'<p><b>Question:</b> Which reactant concentrations change the speed of the sulfur clock reaction?</p><ol><li>Set HCl to 1.0 M. Run trials with thiosulfate at 0.025, 0.050, 0.075, 0.100 and 0.150 M. Record the time for the X to disappear each time.</li><li>Now keep thiosulfate at 0.100 M and run trials with HCl at 0.50, 1.00, 1.50 and 2.00 M.</li><li>Use the Trials graph to plot Rate (1000 ÷ time) against each concentration.</li></ol><p>Which reactant mattered? Describe the shape of each graph.</p>',
       honors:'<p><b>Question:</b> What is the rate law for the mystery reaction?</p><ol><li>Choose Initial rates → Mystery reaction. Record the initial rate with [A] = [B] = 0.20 M.</li><li>Double [A] only, record. Then go back and double [B] only, record.</li><li>Find m and n from the rate ratios. Set them and turn on <b>Check my rate law</b>.</li><li>Switch to Concentration vs time. For each of the three reactions, decide which plot is straight.</li></ol><p>Explain how a straight ln[A] plot shows a first-order reaction.</p>',
       ap:'<p><b>Question:</b> What is Eₐ for the decomposition of N₂O₅?</p><ol><li>Choose Concentration vs time → 2N₂O₅ → 4NO₂ + O₂.</li><li>Run it at 25, 35, 45, 55 and 65 °C, letting each run finish. Record k each time.</li><li>Open the Arrhenius plot (ln k vs 1/T) below the stage.</li></ol><p><b>Claim–evidence–reasoning:</b> Find Eₐ from the slope and compare it with the literature value (about 103 kJ/mol). Then predict k at 0 °C and explain why N₂O₅ can be stored cold.</p>'},
  terms:[{t:'Reaction rate',d:'The change in concentration per unit time, in M/s.'},{t:'Half-life (t½)',d:'The time for half of a reactant to be used up.'},
    {lvl:'honors',t:'Rate law',d:'rate = k[A]ᵐ[B]ⁿ. The orders m and n come from experiments, not from the balanced equation.'},
    {lvl:'honors',t:'Order',d:'The exponent of a concentration in the rate law. Zero order: no effect. First order: double [A], double rate. Second order: double [A], 4× rate.'},
    {lvl:'honors',t:'Method of initial rates',d:'Measure the rate right after mixing in trials where only one concentration changes, and compare ratios.'},
    {lvl:'honors',t:'Integrated rate law',d:'Zero: [A] = [A]₀ − kt. First: ln[A] = ln[A]₀ − kt. Second: 1/[A] = 1/[A]₀ + kt.'},
    {lvl:'ap',t:'Rate constant (k)',d:'The proportionality constant in the rate law. Its units depend on the overall order. It changes with temperature but not with concentration.'},
    {lvl:'ap',t:'Pseudo-first-order',d:'When one reactant is in large excess, its concentration stays nearly constant and folds into k′ = k[B].'},
    {lvl:'ap',t:'Arrhenius equation',d:'k = A·e^(−Eₐ/RT); ln k vs 1/T is a straight line with slope −Eₐ/R.'},
    {lvl:'ap',t:'Rate-determining step',d:'The slowest step of a mechanism; it sets the rate law.'},{lvl:'ap',t:'Intermediate',d:'A species made in one step and used up in a later step. It does not appear in the overall equation.'}],
  about:'<p><b>Data and equations.</b> Initial-rate runs integrate rate = k[A]ᵐ[B]ⁿ from the moment of mixing; the reported initial rate carries up to ±2.5% scatter, like a real measurement. Concentration-vs-time runs use the exact integrated rate laws, and the 17 logged data points carry ±0.4% scatter, so R² is close to but not exactly 1. For concentration-vs-time, k is defined by −d[A]/dt = k[A]ⁿ. Temperature follows the Arrhenius equation.</p><p><b>Values used.</b> N₂O₅: k = 3.46 × 10⁻⁵ s⁻¹ at 25 °C and Eₐ = 103 kJ/mol (the classic Daniels and Johnston data). NO₂ at 300 °C: k = 0.543 M⁻¹·s⁻¹ (a standard textbook data set). 2NO + O₂: k = 7.1 × 10³ M⁻²·s⁻¹ at 25 °C. Crystal violet: rate = k[CV⁺][OH⁻] with k = 0.20 M⁻¹·s⁻¹ and Eₐ = 60 kJ/mol, and ε = 8.7 × 10⁴ M⁻¹·cm⁻¹ at 590 nm in a 1.00 cm cuvette; these are representative of published and school-lab values. The sulfur clock uses rate = k[S₂O₃²⁻] with k = 6.7 × 10⁻⁴ s⁻¹ at 25 °C (zero order in H⁺, close to what school labs find), Eₐ = 50 kJ/mol, and the X counts as hidden at 2.0 mM sulfur. The NH₃-on-tungsten k (2.5 × 10⁻⁵ M/s) and the mystery reactions are illustrative.</p><p><b>Simplified.</b> Runs are sped up so each takes about 10 s to watch; the clock shows reaction time. Reverse reactions are ignored. The zoom circle shows a handful of molecules whose numbers follow the computed concentration; OH⁻ is drawn at a constant number because it is in huge excess.</p>',
  initVis(sim){},
  draw(sim,ctx,vdt,k,t){const p=sim.p,st=sim.st,hon=atLeast('honors'),ap=atLeast('ap');
    ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,500);
    if(isM(p)){drawMech(ctx,sim,k);return;}
    const eq=isI(p)?curI(p).eq:curG(p).eq;txt(ctx,eq,16,28,{s:15*k,w:700,b:'middle'});
    if(isI(p)){drawVesselI(ctx,sim,k,t);drawPlotI(ctx,sim,k);drawLawCard(ctx,sim,k);}
    else{drawVesselG(ctx,sim,k,t);drawZoom(ctx,sim,k);drawPlotsG(ctx,sim,k);}
  },
  thumbSetup(sim){},thumbFrames:40
};

function animMol(sim,dt){const st=sim.st;if(!st.mol)return;const r=st.zr||Math.random;st.mol.forEach(m=>{m.vx+=(r()-.5)*400*dt;m.vy+=(r()-.5)*400*dt;const sp=Math.hypot(m.vx,m.vy);if(sp>40){m.vx*=40/sp;m.vy*=40/sp;}
  m.x+=m.vx*dt;m.y+=m.vy*dt;m.a+=dt*0.8;if(m.fl)m.fl=Math.max(0,m.fl-dt);const dx=m.x-ZX,dy=m.y-ZY,d=Math.hypot(dx,dy),lim=ZR-11;if(d>lim){m.x=ZX+dx/d*lim;m.y=ZY+dy/d*lim;m.vx=-m.vx;m.vy=-m.vy;}});}
function ySeries(sim,t){const p=sim.p;if(isG(p)){const c=gConc(sim,t);return p.rxnG==='cv'?c*EPS_CV:c/curG(p).u;}
  // initial mode: integrate a copy from zero (cheap closed forms where possible)
  const R=curI(p),x=i0(sim),pr=iParams(sim);
  if(p.rxnI==='sulfur'){const S=x.A0*(1-Math.exp(-pr.k*t));return S*1000;}
  if(p.rxnI==='cv'){const kp=pr.k*x.B0;return x.A0*Math.exp(-kp*t)*EPS_CV;}
  // NO and mystery: short Euler integration
  let a=x.A0,b=x.B0,P=0;const n=60,h=t/n;for(let i=0;i<n;i++){const r=iRate(sim,a,b);a=Math.max(0,a-R.nu[0]*r*h);b=Math.max(0,b-R.nu[1]*r*h);P+=R.nu[2]*r*h;}return p.rxnI==='no'?P*1000:P;}
function tUnit(T){return T<200?{f:1,u:'s'}:T<12000?{f:60,u:'min'}:{f:3600,u:'h'};}
function kFromGuess(sim){const p=sim.p,x=i0(sim),r=iMeasR0(sim);const k=r/(Math.pow(x.A0,p.gm)*Math.pow(x.B0,p.gn));return sci(k,3)+' '+kUnits(p.gm+p.gn);}
function logArr(sim){const p=sim.p;if(!tempUsed(p)||!atLeast('ap'))return;const key=isI(p)?p.rxnI:p.rxnG;sim.arr=sim.arr||{};const L=sim.arr[key]=sim.arr[key]||[];
  const kk=isI(p)?iParams(sim).k:gK(sim)/(p.rxnG==='cv'?p.cOH:1);const meas=kk*(1+0.04*(hash(key+p.T)-0.5));const i=L.findIndex(q=>q.T===p.T);if(i>=0)L[i].k=meas;else L.push({T:p.T,k:meas});}
function card(ctx,x,y,w,h){rr(ctx,x,y,w,h,10);ctx.fillStyle=PAL['card'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();}

/* ---------- initial-rate vessels ---------- */
function drawVesselI(ctx,sim,k,t){const p=sim.p,st=sim.st,fs=12*k,cx=156;
  if(p.rxnI==='sulfur'){const cy=222,R=110,cloud=clamp(st.P/S_THR,0,1);
    rr(ctx,cx-R-18,cy-R-18,2*R+36,2*R+36,8);ctx.fillStyle='#f4f1e6';ctx.fill();ctx.strokeStyle=PAL['line'];ctx.stroke();
    ctx.strokeStyle='#1c1c1c';ctx.lineWidth=12;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(cx-44,cy-44);ctx.lineTo(cx+44,cy+44);ctx.moveTo(cx+44,cy-44);ctx.lineTo(cx-44,cy+44);ctx.stroke();ctx.lineCap='butt';
    ctx.fillStyle='rgba(190,225,240,0.35)';ctx.beginPath();ctx.arc(cx,cy,R,0,6.29);ctx.fill();
    ctx.fillStyle='rgba(246,240,205,'+(0.985*Math.pow(cloud,0.8)).toFixed(3)+')';ctx.beginPath();ctx.arc(cx,cy,R,0,6.29);ctx.fill();
    if(cloud>0.05&&!RM){const r=rng(5);ctx.fillStyle='rgba(225,205,120,'+(0.5*cloud).toFixed(2)+')';for(let i=0;i<70;i++){const a=r()*6.283,d=Math.sqrt(r())*R*0.95;ctx.fillRect(cx+Math.cos(a+t*0.05)*d,cy+Math.sin(a+t*0.05)*d,2,2);}}
    ctx.strokeStyle='#8aa6b4';ctx.lineWidth=5;ctx.beginPath();ctx.arc(cx,cy,R,0,6.29);ctx.stroke();ctx.lineWidth=2;ctx.beginPath();ctx.arc(cx,cy,R*0.42,0,6.29);ctx.stroke();
    txt(ctx,'Looking down through the flask at an X',cx,cy+R+18+fs*1.4,{s:fs,c:PAL['cv-soft'],a:'center'});
    pill(ctx,Number.isNaN(st.tX)?'t = '+st.rt.toFixed(1)+' s':'X gone at '+st.tX.toFixed(1)+' s',cx,cy+R+18+fs*3.4,Number.isNaN(st.tX)?PAL['card2']:'#1b7339',Number.isNaN(st.tX)?PAL['cv-ink']:'#fff',14*k);
    return;}
  if(p.rxnI==='cv'){drawColorimeter(ctx,cx,ySeries(sim,st.rt),ySeries(sim,0),k);return;}
  if(p.rxnI==='no'){const frac=clamp(st.P/(i0(sim).A0+1e-12),0,1);drawBulb(ctx,cx,200,96,'rgba(150,75,20,'+(0.85*frac).toFixed(3)+')',k,'NO + O₂ in a sealed bulb');return;}
  const frac=clamp(st.P/Math.min(i0(sim).A0,i0(sim).B0),0,1);CL.drawBeaker(ctx,{x:cx-80,y:80,w:160,h:200,fill:0.75,liquid:'rgba(30,140,130,'+(0.15+0.7*frac).toFixed(3)+')',label:'Product P is blue-green'});}
function drawColorimeter(ctx,cx,A,A0,k){const fs=12*k,y=70;
  const col=CL.shade('#7b2fbf',0);ctx.fillStyle='rgba(190,225,240,0.25)';rr(ctx,cx-34,y,68,150,6);ctx.fill();
  ctx.fillStyle='rgba(110,40,170,'+clamp(A/1.9,0,0.95).toFixed(3)+')';rr(ctx,cx-30,y+30,60,116,4);ctx.fill();ctx.strokeStyle='#8aa6b4';ctx.lineWidth=2.5;rr(ctx,cx-34,y,68,150,6);ctx.stroke();
  rr(ctx,cx-110,y+130,220,150,14);ctx.fillStyle='#3a3f47';ctx.fill();rr(ctx,cx-42,y+124,84,14,4);ctx.fillStyle='#22262c';ctx.fill();
  rr(ctx,cx-84,y+172,168,62,8);ctx.fillStyle='#0f2a1c';ctx.fill();txt(ctx,'A = '+A.toFixed(3),cx,y+203,{s:24,w:700,c:'#7dffb0',a:'center',b:'middle'});
  txt(ctx,'Colorimeter, 590 nm',cx,y+256,{s:13,w:600,c:'#e6e6e6',a:'center',b:'middle'});
  txt(ctx,'Purple CV⁺ fades as it reacts',cx,y+300+fs,{s:fs,c:PAL['cv-soft'],a:'center'});}
function drawBulb(ctx,cx,cy,R,fill,k,lab){const fs=12*k;ctx.fillStyle='rgba(190,225,240,0.25)';ctx.beginPath();ctx.arc(cx,cy,R,0,6.29);ctx.fill();ctx.fillStyle=fill;ctx.beginPath();ctx.arc(cx,cy,R,0,6.29);ctx.fill();
  ctx.strokeStyle='#8aa6b4';ctx.lineWidth=3;ctx.beginPath();ctx.arc(cx,cy,R,0,6.29);ctx.stroke();ctx.fillStyle='rgba(190,225,240,0.25)';ctx.fillRect(cx-12,cy-R-34,24,36);ctx.strokeRect(cx-12,cy-R-34,24,36);
  ctx.fillStyle='rgba(255,255,255,.35)';ctx.beginPath();ctx.ellipse(cx-R*0.4,cy-R*0.4,R*0.16,R*0.26,-0.6,0,6.29);ctx.fill();
  txt(ctx,lab,cx,cy+R+10+fs,{s:fs,c:PAL['cv-soft'],a:'center'});}

/* ---------- mini plot ---------- */
function mini(ctx,o){const k=o.k,fs=12*k;card(ctx,o.x,o.y,o.w,o.h);
  if(o.hi){ctx.strokeStyle=PAL['s3'];ctx.lineWidth=3;rr(ctx,o.x+1.5,o.y+1.5,o.w-3,o.h-3,9);ctx.stroke();}
  txt(ctx,o.title,o.x+10,o.y+8+fs,{s:13*k,w:700});if(o.note)txt(ctx,o.note,o.x+o.w-10,o.y+8+fs,{s:fs,w:700,c:o.noteC||PAL['cv-soft'],a:'right'});
  const L=o.x+12+(o.yw||0),R=o.x+o.w-12,T=o.y+16+fs*1.6,B=o.y+o.h-10-(o.xl?fs*1.3:0);
  const X=v=>L+(v-o.xmin)/(o.xmax-o.xmin)*(R-L),Y=v=>B-(v-o.ymin)/((o.ymax-o.ymin)||1)*(B-T);
  ctx.strokeStyle=PAL['g-axis'];ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(L,T);ctx.lineTo(L,B);ctx.lineTo(R,B);ctx.stroke();
  if(o.xt){ctx.font=fs+'px '+FONT;const xlw=o.xl?ctx.measureText(o.xl).width+10:0;o.xt.forEach(v=>{const x=X(v);if(x>R-xlw-fs)return;txt(ctx,nice(v),x,o.y+o.h-8,{s:fs,c:PAL['cv-soft'],a:'center'});});}
  if(o.xl)txt(ctx,o.xl,R,o.y+o.h-8,{s:fs,c:PAL['cv-soft'],a:'right'});
  if(o.yt)o.yt.forEach(v=>{if(v<o.ymin||v>o.ymax)return;txt(ctx,o.yfmt?o.yfmt(v):String(v),L-4,Y(v),{s:fs,c:PAL['cv-soft'],a:'right',b:'middle'});});
  ctx.save();ctx.beginPath();ctx.rect(L,T-4,R-L,B-T+8);ctx.clip();
  if(o.extra)o.extra(X,Y);
  if(o.curve){ctx.strokeStyle=o.curveC||PAL['g-line'];ctx.lineWidth=2.5;ctx.beginPath();o.curve.forEach(([a,b],i)=>i?ctx.lineTo(X(a),Y(b)):ctx.moveTo(X(a),Y(b)));ctx.stroke();}
  if(o.line){ctx.strokeStyle=PAL['muted'];ctx.lineWidth=1.5;ctx.setLineDash([5,4]);ctx.beginPath();ctx.moveTo(X(o.xmin),Y(o.line.m*o.xmin+o.line.b));ctx.lineTo(X(o.xmax),Y(o.line.m*o.xmax+o.line.b));ctx.stroke();ctx.setLineDash([]);}
  if(o.pts)o.pts.forEach(([a,b])=>{ctx.fillStyle=PAL['g-dot'];ctx.beginPath();ctx.arc(X(a),Y(b),3.6*Math.min(k,1.4),0,6.29);ctx.fill();});
  ctx.restore();return {X,Y,L,R,T,B};}
const ticks=(lo,hi,n)=>{const st=BioLab.h.niceStep(hi-lo,n||3),out=[];for(let v=Math.ceil(lo/st-1e-9)*st;v<=hi+1e-9;v+=st)out.push(+v.toPrecision(6));return out;};
const nice=v=>{if(v===0)return '0';const a=Math.abs(v);return a>=100?v.toFixed(0):a>=10?v.toFixed(1):a>=1?v.toFixed(2):a>=0.01?v.toFixed(3):v.toExponential(1);};

function drawPlotI(ctx,sim,k){const p=sim.p,st=sim.st,R=curI(p),fs=12*k,te=st.tend,tu=tUnit(te);
  const N=100,curve=[];for(let i=0;i<=N;i++){const tt=te*i/N;if(tt>st.rt+1e-12)break;curve.push([tt/tu.f,ySeries(sim,tt)]);}
  const yEnd=ySeries(sim,te),y0=ySeries(sim,0),cv=p.rxnI==='cv',ymax=cv?y0*1.03:Math.max(yEnd,p.rxnI==='sulfur'?S_THR*1000:0)*1.12||1,ymin=cv?Math.max(0,yEnd-(y0-yEnd)*0.25):0;
  const dy=(ySeries(sim,te*0.01)-y0)/(te*0.01)*tu.f;   // initial slope in y-units per time unit
  mini(ctx,{x:BXR,y:44,w:476,h:286,k,title:R.plotY,note:atLeast('honors')?'dashed = initial slope':'',xmin:0,xmax:te/tu.f,ymin,ymax,xl:'time ('+tu.u+')',xt:ticks(0,te/tu.f,4),yw:46*k,yt:ticks(ymin,ymax,3),yfmt:nice,curve,
    extra(X,Y){if(p.rxnI==='sulfur'){ctx.strokeStyle=PAL['s4'];ctx.lineWidth=2;ctx.setLineDash([6,4]);ctx.beginPath();ctx.moveTo(X(0),Y(S_THR*1000));ctx.lineTo(X(te/tu.f),Y(S_THR*1000));ctx.stroke();ctx.setLineDash([]);
        txt(ctx,'X hidden',X(0)+6,Y(S_THR*1000)-6,{s:fs,w:700,c:PAL['s4']});}
      if(atLeast('honors')&&st.rt>0.02*te){ctx.strokeStyle=PAL['s5'];ctx.lineWidth=2;ctx.setLineDash([6,4]);const t2=te/tu.f*0.8;ctx.beginPath();ctx.moveTo(X(0),Y(y0));ctx.lineTo(X(t2),Y(y0+dy*t2));ctx.stroke();ctx.setLineDash([]);}}});}
function drawLawCard(ctx,sim,k){const p=sim.p,st=sim.st,R=curI(p),fs=12*k,y=340,h=142,hon=atLeast('honors'),ap=atLeast('ap');card(ctx,BXR,y,476,h);
  if(!hon){const big=p.rxnI==='sulfur'?(Number.isNaN(st.tX)?'Waiting for the X to disappear…':'Time: '+st.tX.toFixed(1)+' s   ·   Rate = 1000 ÷ '+st.tX.toFixed(1)+' = '+(1000/st.tX).toFixed(1)):'';
    txt(ctx,'[S₂O₃²⁻] = '+p.cS.toFixed(3)+' M     [HCl] = '+p.cHs.toFixed(2)+' M',BXR+16,y+22+fs,{s:14*k,w:700});txt(ctx,big,BXR+16,y+60+fs,{s:14*k,c:PAL['cv-ink']});
    txt(ctx,'Change one concentration, then compare the times.',BXR+16,y+98+fs,{s:fs,c:PAL['cv-soft']});return;}
  const x=i0(sim),fc=(v,u)=>u===1e-6?(v*1e6).toFixed(1)+' µM':u===1e-3?(v*1e3).toFixed(1)+' mM':v.toFixed(3)+' M';
  txt(ctx,'['+R.a+']₀ = '+fc(x.A0,R.ua)+'    ['+R.b+']₀ = '+fc(x.B0,R.ub),BXR+16,y+16+fs,{s:13*k,w:700});
  const law='Your rate law:  rate = k['+R.a+']'+sup(p.gm)+'['+R.b+']'+sup(p.gn);txt(ctx,law,BXR+16,y+48+fs,{s:15*k,w:700,c:PAL['s5']});
  txt(ctx,'Initial rate = '+(st.rt<0.04*st.tend?'measuring…':sci(iMeasR0(sim),3)+' M/s'),BXR+16,y+80+fs,{s:13*k});
  if(ap)txt(ctx,'k = '+(st.rt<0.04*st.tend?'…':kFromGuess(sim)),BXR+16,y+108+fs,{s:13*k,c:PAL['cv-soft']});
  if(p.check){const pr=iParams(sim),ok=p.gm===pr.m&&p.gn===pr.n;pill(ctx,ok?'✓ matches the data':'✗ not yet',BXR+476-16-70*k,y+80+fs*0.6,ok?'#1b7339':'#b3261e','#fff',13*k);}}

/* ---------- integrated mode ---------- */
function drawVesselG(ctx,sim,k,t){const p=sim.p,st=sim.st,cx=156;
  if(p.rxnG==='cv'){const A=ySeries(sim,st.rt),fs=12*k;ctx.fillStyle='rgba(190,225,240,0.25)';rr(ctx,cx-40,58,80,196,6);ctx.fill();ctx.fillStyle='rgba(110,40,170,'+clamp(A/1.9,0,0.95).toFixed(3)+')';rr(ctx,cx-36,96,72,154,4);ctx.fill();
    ctx.strokeStyle='#8aa6b4';ctx.lineWidth=2.5;rr(ctx,cx-40,58,80,196,6);ctx.stroke();pill(ctx,'A = '+A.toFixed(3),cx,176,'#0f2a1c','#7dffb0',14*k);txt(ctx,'Purple: CV⁺   Gray: colorless CVOH',cx,272,{s:12*k,c:PAL['cv-soft'],a:'center'});return;}
  const frac=gConc(sim,st.rt)/gA0(p);const brown=p.rxnG==='first'?(1-frac):p.rxnG==='second'?frac:0;
  drawBulb(ctx,cx,150,80,'rgba(150,75,20,'+(0.85*brown).toFixed(3)+')',k,'');
  if(p.rxnG==='zero'){ctx.strokeStyle='#ff8a2a';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(cx-30,150);for(let i=0;i<=6;i++)ctx.lineTo(cx-30+i*10,150+(i%2?-8:8));ctx.stroke();}
  txt(ctx,p.rxnG==='first'?'Brown NO₂ builds up':p.rxnG==='second'?'Brown NO₂ fades':'Hot tungsten wire',cx,252,{s:12*k,c:PAL['cv-soft'],a:'center'});
  txt(ctx,p.rxnG==='zero'?'Atoms: N blue, H white':'Atoms: N blue, O red',cx,252+15*k,{s:12*k,c:PAL['cv-soft'],a:'center'});}
function drawGlyph(ctx,m){const g=GLYPH[m.k],c=Math.cos(m.a),s=Math.sin(m.a);
  if(m.k==='CV'){ctx.fillStyle='#7b2fbf';ctx.beginPath();ctx.arc(m.x,m.y,9,0,6.29);ctx.fill();txt(ctx,'+',m.x,m.y+1,{s:12,w:800,c:'#fff',a:'center',b:'middle'});return;}
  if(m.k==='CVOH'){ctx.fillStyle='#b9b4c4';ctx.beginPath();ctx.arc(m.x,m.y,9,0,6.29);ctx.fill();ctx.fillStyle=CL.cpk('O');ctx.beginPath();ctx.arc(m.x+c*9,m.y+s*9,4,0,6.29);ctx.fill();return;}
  g.forEach(([e,dx,dy])=>{const x=m.x+dx*c-dy*s,y=m.y+dx*s+dy*c;ctx.fillStyle=CL.cpk(e);ctx.beginPath();ctx.arc(x,y,RAD[e],0,6.29);ctx.fill();ctx.strokeStyle='rgba(0,0,0,.35)';ctx.lineWidth=0.8;ctx.stroke();});
  if(m.fl){ctx.strokeStyle=PAL['cv-e'];ctx.globalAlpha=m.fl*2;ctx.lineWidth=2;ctx.beginPath();ctx.arc(m.x,m.y,12,0,6.29);ctx.stroke();ctx.globalAlpha=1;}}
function drawZoom(ctx,sim,k){const st=sim.st,p=sim.p;ctx.save();ctx.beginPath();ctx.arc(ZX,ZY,ZR,0,6.29);ctx.fillStyle=p.rxnG==='cv'?PAL['cv-water']:PAL['cv-bg2'];ctx.fill();ctx.clip();
  st.mol.forEach(m=>drawGlyph(ctx,m));ctx.restore();ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=3;ctx.beginPath();ctx.arc(ZX,ZY,ZR,0,6.29);ctx.stroke();
  const R=curG(p),n=st.mol.filter(m=>m.k===REACT[p.rxnG]).length;pill(ctx,n+' '+R.sp+(p.rxnG==='cv'?' ions':' molecules')+' shown',ZX,ZY-ZR+2,PAL['card2'],PAL['cv-ink'],12*k);}
function drawPlotsG(ctx,sim,k){const p=sim.p,st=sim.st,R=curG(p),hon=atLeast('honors'),ap=atLeast('ap'),te=st.tend,tu=tUnit(te),cv=p.rxnG==='cv';
  const T=transforms(sim),lab=cv?['Absorbance','ln(Absorbance)','1/Absorbance']:['['+R.sp+'] ('+R.unit+')','ln['+R.sp+']','1/['+R.sp+'] ('+R.unit+'⁻¹)'];
  const full=[0,1,2].map(i=>{const out=[];for(let j=0;j<=60;j++){const tt=te*j/60;const c=gConc(sim,tt);if(c<=0)break;const y=cv?c*EPS_CV:c/R.u;out.push([tt/tu.f,[y,Math.log(y),1/y][i]]);}return out;});
  const pts=T.map(x=>x.pts.map(([a,b])=>[a/tu.f,b]));
  const best=T.map((x,i)=>[x.f&&x.pts.length>=4?x.f.r2:-1,i]).sort((a,b)=>b[0]-a[0])[0];
  const rng_=i=>{const ys=full[i].map(q=>q[1]).filter(Number.isFinite);let lo=Math.min(...ys),hi=Math.max(...ys);if(i===0||i===2)lo=Math.min(0,lo);const pad=(hi-lo)*0.08||1;return [i===0||i===2?lo:lo-pad,hi+pad];};
  if(!hon){const [lo,hi]=rng_(0),th=gHalf(sim);mini(ctx,{x:BXR,y:44,w:476,h:438,k,title:lab[0]+' vs time',xmin:0,xmax:te/tu.f,ymin:0,ymax:hi,xl:'time ('+tu.u+')',xt:ticks(0,te/tu.f,4),yw:46*k,yt:ticks(0,hi,3),yfmt:nice,pts:pts[0],
      extra(X,Y){const y0=full[0][0][1];for(let j=1;j<=3;j++){const tt=j*th;if(R.ord===0&&j>1)break;if(tt>te)break;const yv=y0/Math.pow(2,j);ctx.strokeStyle=PAL['s4'];ctx.lineWidth=1.5;ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(X(tt/tu.f),Y(0));ctx.lineTo(X(tt/tu.f),Y(yv));ctx.lineTo(X(0),Y(yv));ctx.stroke();ctx.setLineDash([]);
        txt(ctx,j===1?'½':j===2?'¼':'⅛',X(tt/tu.f)+5,Y(yv)-6,{s:14*k,w:700,c:PAL['s4']});}}});return;}
  const h=(438-12)/3;[0,1,2].forEach(i=>{const [lo,hi]=rng_(i),f=T[i].f,isBest=best[0]>0&&best[1]===i&&pts[i].length>=6;
    mini(ctx,{x:BXR,y:44+i*(h+6),w:476,h,k,title:lab[i]+' vs t',note:f&&pts[i].length>=4?'R² = '+f.r2.toFixed(4)+(isBest&&ap?'   slope = '+nice(f.m*tu.f)+'/'+tu.u:''):'',noteC:isBest?PAL['s3']:PAL['cv-soft'],hi:isBest,
      xmin:0,xmax:te/tu.f,ymin:lo,ymax:hi,xl:i===2?'time ('+tu.u+')':'',xt:i===2?ticks(0,te/tu.f,4):null,yw:44*k,yt:(t=>[t[0],t[t.length-1]])(ticks(lo,hi,2)),yfmt:nice,pts:pts[i],line:f&&pts[i].length>=4?{m:f.m*tu.f,b:f.b}:null});});}

/* ---------- mechanisms ---------- */
function drawMech(ctx,sim,k){const p=sim.p,M=MECH[p.mech],fs=12*k;
  txt(ctx,'Overall: 2NO₂(g) + F₂(g) → 2NO₂F(g)',16,28,{s:15*k,w:700,b:'middle'});
  txt(ctx,'Experiment: rate = k[NO₂][F₂]',784,28,{s:14*k,w:700,c:PAL['s2'],a:'right',b:'middle'});
  card(ctx,16,52,372,300);txt(ctx,'Proposed mechanism: '+M.name.toLowerCase(),30,60+fs*1.2,{s:13*k,w:700});
  M.steps.forEach((s,i)=>{const y=110+i*90;rr(ctx,30,y,344,70,10);ctx.fillStyle=PAL['card2'];ctx.fill();
    txt(ctx,'Step '+(i+1),44,y+22,{s:fs,w:700,c:PAL['cv-soft']});
    const slow=s[1].startsWith('slow')||s[1]==='one step';pill(ctx,s[1],374-12-40*k,y+20,slow?'#b3261e':'#1b7339','#fff',12*k);
    drawEq(ctx,s[0],44,y+50,15*k);});
  const inter=p.mech==='a'?'none':'F (made, then used up)';txt(ctx,'Intermediate: '+inter,30,52+300-40,{s:fs,c:PAL['s5'],w:700});
  txt(ctx,'Steps add up to the overall equation ✓',30,52+300-16,{s:fs,c:PAL['cv-soft']});
  // energy profile
  card(ctx,404,52,380,300);txt(ctx,'Energy diagram',418,60+fs*1.2,{s:13*k,w:700});
  const L=430,Rr=770,Tp=110,B=320,bars=M.bars,n=bars.length,Y=E=>B-30-(E/18)*(B-30-Tp);const lv=[0];for(let i=0;i<n;i++)lv.push(-3*(i+1)/n);
  ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(L,Y(lv[0]));const seg=(Rr-L-40)/n;
  for(let i=0;i<n;i++){const x0=L+20+i*seg;ctx.lineTo(x0,Y(lv[i]));for(let j=0;j<=30;j++){const u=j/30,x=x0+u*seg,base=lerp(lv[i],lv[i+1],(1-Math.cos(Math.PI*u))/2),bump=Math.pow(Math.sin(Math.PI*u),2)*(bars[i]-(lv[i]+lv[i+1])/2);ctx.lineTo(x,Y(base+bump));}}
  ctx.lineTo(Rr,Y(lv[n]));ctx.stroke();
  for(let i=0;i<n;i++){const xm=L+20+(i+0.5)*seg;const slow=M.steps[i][1].startsWith('slow')||M.steps[i][1]==='one step';txt(ctx,(slow?'slow':'fast'),xm,Y(bars[i])-10,{s:fs,w:700,c:slow?'#c0392b':PAL['s3'],a:'center'});
    if(i<n-1)txt(ctx,'F',L+20+(i+1)*seg,Y(lv[i+1])+fs*1.4,{s:fs,w:700,c:PAL['s5'],a:'center'});}
  txt(ctx,'reaction progress →',Rr,B+14,{s:fs,c:PAL['cv-soft'],a:'right'});
  // verdict band
  card(ctx,16,366,768,116);txt(ctx,'Rate law from the slow step:',32,392+fs*0.4,{s:13*k,c:PAL['cv-soft']});
  txt(ctx,M.pred,32,428+fs*0.4,{s:20*k,w:700});pill(ctx,M.ok?'✓ matches the experiment':'✗ does not match',784-24-110*k,428,M.ok?'#1b7339':'#b3261e','#fff',14*k);
  txt(ctx,M.ok?'A mechanism can never be proven, only supported by the data.':'Try another mechanism.',32,466,{s:fs,c:PAL['cv-soft']});}
function drawEq(ctx,s,x,y,size){const parts=s.split(/((?<=^|\s|[0-9])F(?=\s|$))/);ctx.font='700 '+size+'px '+FONT;parts.forEach(pt=>{if(!pt)return;const isF=pt==='F';txt(ctx,pt,x,y,{s:size,w:700,c:isF?PAL['s5']:PAL['cv-ink']});x+=ctx.measureText(pt).width;});}

RL.controls.forEach(c=>{if(c.id==='mode'||c.id==='rxnI'||c.id==='rxnG')c.onChange=sim=>syncMode(sim);});
RL.onLevel=sim=>{syncMode(sim);};
BioLab.register(RL);
})();
