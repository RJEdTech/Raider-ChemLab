(function(){
'use strict';
const {clamp,lerp,rng,rr,txt,pill,atLeast,PAL,FONT,RM,legend,serColor}=BioLab.h;
const CL=window.ChemLab;
/* Reversible reaction by mass action: rate_f = k_f·Π[reactant]^ν, rate_r = k_r·Π[product]^ν, k_r = k_f/K.
   K(T) from the van ’t Hoff equation, k_f(T) from Arrhenius. The particle box carries out forward and reverse events
   at the computed gross rates, so you see both reactions keep going at equilibrium. */
const R_=8.314;
const BX=16,BY=56,BH=336,WPL=300;       // box: width = WPL × V (L) for gases; aq uses WPL×V/0.1
const PX=500,PW=288;
const SYS={
  no2:{eq:'N₂O₄(g) ⇌ 2NO₂(g)',sp:[{id:'N2O4',f:'N₂O₄',nu:-1,S:1400,g:'N2O4'},{id:'NO2',f:'NO₂',nu:2,S:1400,g:'NO2'}],
       dH:57.2,Kref:4.6e-3,Tref:298.15,Ea:40,gas:true,n0:{N2O4:0.05,NO2:0},V0:1,Tc:'Tg',inert:true,
       addR:0.02,addP:0.03,names:['N₂O₄ (colorless)','NO₂ (brown)']},
  haber:{eq:'N₂(g) + 3H₂(g) ⇌ 2NH₃(g)',sp:[{id:'N2',f:'N₂',nu:-1,S:20,g:'N2'},{id:'H2',f:'H₂',nu:-3,S:20,g:'H2'},{id:'NH3',f:'NH₃',nu:2,S:20,g:'NH3'}],
       dH:-92.2,Kref:0.060,Tref:773.15,Ea:30,gas:true,n0:{N2:1,H2:3,NH3:0},V0:1,Tc:'Th',inert:true,
       addR:0.4,addP:0.5,names:['N₂','H₂','NH₃']},
  co:{eq:'Co(H₂O)₆²⁺(aq) + 4Cl⁻(aq) ⇌ CoCl₄²⁻(aq) + 6H₂O(l)',sp:[{id:'Co6',f:'Co(H₂O)₆²⁺',nu:-1,S:4000,g:'pink'},{id:'Cl',f:'Cl⁻',nu:-4,S:50,g:'Cl'},{id:'CoCl4',f:'CoCl₄²⁻',nu:1,S:4000,g:'blue'}],
       dH:50,Kref:5e-4,Tref:298.15,Ea:40,gas:false,n0:{Co6:0.010,Cl:0.60,CoCl4:0},V0:0.1,Tc:'Tg',inert:false,names:['Co(H₂O)₆²⁺ (pink)','Cl⁻','CoCl₄²⁻ (blue)']}
};
const sysOf=p=>SYS[p.sys];
const TK=p=>(sysOf(p).Tc==='Th'?p.Th:p.Tg)+273.15;
const Kat=(S,T)=>S.Kref*Math.exp(-S.dH*1000/R_*(1/T-1/S.Tref));
const conc=(st,id)=>Math.max(0,st.n[id])/st.V;
function Qof(S,st,nOverride,V){const n=nOverride||st.n,v=V||st.V;let num=1,den=1;S.sp.forEach(s=>{const c=Math.max(1e-300,n[s.id]/v);if(s.nu>0)num*=Math.pow(c,s.nu);else den*=Math.pow(c,-s.nu);});return num/den;}
function rates(S,st,kf,K){let f=kf,r=kf/K;S.sp.forEach(s=>{const c=conc(st,s.id);if(s.nu<0)f*=Math.pow(c,-s.nu);else r*=Math.pow(c,s.nu);});return {f,r};}
/* equilibrium extent from the present amounts: solve Q(ξ) = K by bisection on ln Q */
function solveXi(S,n,V,K){let lo=-1e9,hi=1e9;S.sp.forEach(s=>{const lim=-n[s.id]/s.nu;if(s.nu<0)hi=Math.min(hi,lim);else lo=Math.max(lo,lim);});
  const g=xi=>{const m={};S.sp.forEach(s=>m[s.id]=n[s.id]+s.nu*xi);return Math.log(Qof(S,null,m,V))-Math.log(K);};
  let a=lo+(hi-lo)*1e-12,b=hi-(hi-lo)*1e-12;for(let i=0;i<200;i++){const m=(a+b)/2;if(g(m)>0)b=m;else a=m;}return (a+b)/2;}
/* k_f at the calibration point gives a relaxation time of about 1 s */
const KF0={};
function kf25(key){if(KF0[key])return KF0[key];const S=SYS[key],T=S.Tc==='Th'?723.15:298.15,K=Kat(S,T),n=Object.assign({},S.n0),V=S.V0;
  const xe=solveXi(S,n,V,K),h=Math.abs(xe)*1e-4+1e-9;const net=x=>{const st={n:{},V};S.sp.forEach(s=>st.n[s.id]=n[s.id]+s.nu*x);const r=rates(S,st,1,K);return (r.f-r.r)*V;};
  const lam=-(net(xe+h)-net(xe-h))/(2*h);KF0[key]={k:1/lam,T};return KF0[key];}
function kfNow(p){const S=sysOf(p),c=kf25(p.sys);return c.k*Math.exp(-S.Ea*1000/R_*(1/TK(p)-1/c.T))*(p.cat?6:1);}

/* ---------- particles ---------- */
const GL={N2O4:[['N',-3.6,0],['N',3.6,0],['O',-8,-5],['O',-8,5],['O',8,-5],['O',8,5]],NO2:[['N',0,-1.5],['O',-6,3],['O',6,3]],
  N2:[['N',-3.6,0],['N',3.6,0]],H2:[['H',-2.8,0],['H',2.8,0]],NH3:[['N',0,0],['H',-6,4],['H',6,4],['H',0,-6.5]]};
const RAD={N:4.8,O:4.5,H:3.2};
const boxW=(S,V)=>S.gas?WPL*V:WPL*V/0.1;
function addP(st,g,x,y,T){const r=st.rnd,sp=Math.sqrt(T/300)*(st.gas?60:14);const a=r()*6.283;st.ps.push({g,x:x===undefined?BX+12+r()*(st.W-24):x,y:y===undefined?BY+12+r()*(BH-24):y,vx:Math.cos(a)*sp*(0.5+r()),vy:Math.sin(a)*sp*(0.5+r()),a:r()*6.283,w:(r()-.5)*3,fl:0});}
const pr=(g)=>g==='N2O4'||g==='NO2'||g==='N2'||g==='H2'||g==='NH3'||g==='pink'||g==='blue'||g==='Cl';
function nearest(st,g,x,y,skip){let best=null,bd=1e18;for(const q of st.ps){if(q.g!==g||q.dead||(skip&&skip.includes(q)))continue;const d=(q.x-x)**2+(q.y-y)**2;if(d<bd){bd=d;best=q;}}return best;}
function pickRand(st,g){const L=st.ps.filter(q=>q.g===g&&!q.dead);return L.length?L[Math.floor(st.rnd()*L.length)]:null;}
function evForward(sim){const st=sim.st,p=sim.p,T=TK(p);
  if(p.sys==='no2'){const q=pickRand(st,'N2O4');if(!q)return false;q.dead=true;for(const s of [-1,1]){addP(st,'NO2',q.x+s*7,q.y,T);const n=st.ps[st.ps.length-1];n.vx=s*Math.abs(n.vx)+q.vx;n.fl=0.3;}return true;}
  if(p.sys==='haber'){const q=pickRand(st,'N2');if(!q)return false;const hs=[];for(let i=0;i<3;i++){const h=nearest(st,'H2',q.x,q.y,hs);if(!h)return false;hs.push(h);}q.dead=true;hs.forEach(h=>h.dead=true);for(let i=0;i<2;i++){addP(st,'NH3',q.x+(i?8:-8),q.y,T);st.ps[st.ps.length-1].fl=0.3;}return true;}
  const q=pickRand(st,'pink');if(!q)return false;q.g='blue';q.fl=0.3;st.clAcc-=4/4000*50;while(st.clAcc<=-1){const c=nearest(st,'Cl',q.x,q.y);if(c)c.dead=true;st.clAcc+=1;}return true;}
function evReverse(sim){const st=sim.st,p=sim.p,T=TK(p);
  if(p.sys==='no2'){const a=pickRand(st,'NO2');if(!a)return false;const b=nearest(st,'NO2',a.x,a.y,[a]);if(!b)return false;a.dead=b.dead=true;addP(st,'N2O4',(a.x+b.x)/2,(a.y+b.y)/2,T);st.ps[st.ps.length-1].fl=0.3;return true;}
  if(p.sys==='haber'){const a=pickRand(st,'NH3');if(!a)return false;const b=nearest(st,'NH3',a.x,a.y,[a]);if(!b)return false;a.dead=b.dead=true;const x=(a.x+b.x)/2,y=(a.y+b.y)/2;addP(st,'N2',x,y,T);st.ps[st.ps.length-1].fl=0.3;for(let i=0;i<3;i++)addP(st,'H2',x+(i-1)*9,y+8,T);return true;}
  const q=pickRand(st,'blue');if(!q)return false;q.g='pink';q.fl=0.3;st.clAcc+=4/4000*50;while(st.clAcc>=1){addP(st,'Cl',q.x+8,q.y,T);st.clAcc-=1;}return true;}
const mainG=p=>p.sys==='no2'?'N2O4':p.sys==='haber'?'N2':'pink';
function dispCount(st,g){let n=0;for(const q of st.ps)if(q.g===g&&!q.dead)n++;return n;}

function freshState(sim){const p=sim.p,S=sysOf(p),st={n:Object.assign({},S.n0),V:S.V0,gas:S.gas,ps:[],rnd:rng(4242),af:0,ar:0,clAcc:0,ag:0,last:null,I:null,He:0,W:0,log:[]};
  if(S.gas)st.V=p.V;st.W=boxW(S,st.V);const T=TK(p);
  S.sp.forEach(s=>{const n=Math.round(st.n[s.id]*s.S);for(let i=0;i<n;i++)addP(st,s.g,undefined,undefined,T);});st.I=Object.assign({},st.n);st.IV=st.V;return st;}
function setV(sim,V){const st=sim.st,S=sysOf(sim.p),W=boxW(S,V),f=W/st.W;st.ps.forEach(q=>{q.x=BX+(q.x-BX)*f;});st.V=V;st.W=W;markStress(sim,'volume');}
function markStress(sim,kind){const st=sim.st;st.last={kind,t:sim.t};st.I=Object.assign({},st.n);st.IV=st.V;st.Q0=Qof(sysOf(sim.p),st);st.K0=Kat(sysOf(sim.p),TK(sim.p));sim.infoDirty=true;}
function stress(sim,kind){const st=sim.st,p=sim.p,S=sysOf(p),T=TK(p);if(st.ps.length>205){st.full=1.5;return;}
  const add=(id,mol)=>{const s=S.sp.find(x=>x.id===id);st.n[id]+=mol;const k=Math.round(mol*s.S);for(let i=0;i<k;i++)addP(st,s.g,BX+8+st.rnd()*30,undefined,T);};
  const rem=(id,frac)=>{const s=S.sp.find(x=>x.id===id),mol=st.n[id]*frac;st.n[id]-=mol;let k=Math.round(mol*s.S);for(const q of st.ps){if(k<=0)break;if(q.g===s.g&&!q.dead){q.dead=true;k--;}}};
  if(kind==='addR'){if(p.sys==='no2')add('N2O4',S.addR);else if(p.sys==='haber')add('N2',S.addR);}
  else if(kind==='addP'){if(p.sys==='no2')add('NO2',S.addP);else add('NH3',S.addP);}
  else if(kind==='remP'){if(p.sys==='no2')rem('NO2',0.5);else rem('NH3',0.5);}
  else if(kind==='he'){st.He=Math.min(st.He+(p.sys==='no2'?0.05:2),p.sys==='no2'?0.15:6);}
  else if(kind==='hcl'){add('Cl',0.15);st.V+=0.0125;st.W=boxW(S,st.V);}
  else if(kind==='water'){if(st.V<0.199){const f=(st.V+0.05)/st.V;setV(sim,st.V+0.05);}}
  else if(kind==='ag'){const take=Math.min(0.15,st.n.Cl*0.6);rem('Cl',take/st.n.Cl);st.ag+=take;}
  st.ps=st.ps.filter(q=>!q.dead);markStress(sim,kind);}

function syncMode(sim){if(!sim.ui||!sim.ui.sec)return;const d=sim.def,p=sim.p;
  d.controls.forEach(c=>{if(!c.show)return;const v=atLeast(c.lvl)&&c.show(p);c.noTrial=!v;const cid=d.id+'-'+c.id,e=document.getElementById(cid)||document.getElementById(cid+'-l');if(!e)return;const w=e.closest('.ctl');if(w)w.hidden=!v;});
  d.metrics.forEach(m=>{if(!m.show)return;const v=atLeast(m.lvl)&&m.show(p);m.noTrial=!v;const t=sim.ui.tiles[m.id];if(!t)return;const w=t.num.closest('.tile');if(w)w.hidden=!v;});
  const btns=[...sim.ui.sec.querySelectorAll('.actions button')];d.actions.forEach(a=>{const b=btns.find(x=>x.textContent===a.label);if(b)b.hidden=!atLeast(a.lvl)||(a.show&&!a.show(p));});}
const gasS=p=>p.sys!=='co',isCo=p=>p.sys==='co';
const fmtC=v=>!Number.isFinite(v)?'—':v===0?'0':v>=0.1?v.toFixed(3):v>=0.001?v.toFixed(4):CL.sci(v,'',3);
const fmtK=v=>!Number.isFinite(v)?'—':(v>=0.01&&v<1000)?CL.toSig(v,3):CL.sci(v,'',3);

const EQ={
  id:'equilibrium',hash:'equilibrium',apUnit:13,order:1,kind:'Simulation',tab:'Chemical equilibrium',
  prereq:['rates'],next:['ksp','buffers'],
  card:'Push a reversible reaction with heat, pressure and extra chemicals. Predict which way it shifts, then watch Q race back to K.',
  title:'Chemical equilibrium and Le Châtelier’s principle',
  lede:{bio:'In a reversible reaction, products keep turning back into reactants. At equilibrium both reactions run at the same speed, so the amounts stop changing. Disturb it and watch it shift.',
        honors:'Compare Q with K to predict the shift, then test Le Châtelier’s principle with concentration, volume, temperature and a catalyst in three real systems.',
        ap:'Track Q and K quantitatively: K changes only with temperature (van ’t Hoff), forward and reverse rates converge, and the ICE table predicts the new equilibrium exactly.'},
  scale:{bio:'The box is a zoomed-in view of the reaction mixture. Each glob of balls is one molecule or ion.',
         ap:'Box: 1400 drawn molecules per mole for N₂O₄/NO₂ (20 per mole for the Haber mix). In the cobalt system each complex ion drawn stands for 1/4000 mol, and each green dot for 1/50 mol of Cl⁻.'},
  aspect:1.6,timeScale:1,dtMax:0.01,prewarm:12,sampleDt:0.1,window:30,unit:'s',chChange:3,chReveal:9,
  controls:[
    {id:'sys',label:'Reaction',type:'select',def:'no2',lvl:'bio',options:[{v:'no2',l:'N₂O₄ ⇌ 2NO₂ (brown gas)'},{v:'co',l:'Cobalt chloride: pink ⇌ blue',lvl:'honors'},{v:'haber',l:'Haber process: N₂ + 3H₂ ⇌ 2NH₃',lvl:'honors'}]},
    {id:'Tg',label:'Temperature',type:'range',min:0,max:100,step:5,def:25,unit:' °C',lvl:'bio',show:p=>p.sys!=='haber',help:'Ice water is 0 °C, boiling water is 100 °C.'},
    {id:'Th',label:'Temperature',type:'range',min:300,max:600,step:25,def:450,unit:' °C',lvl:'honors',show:p=>p.sys==='haber',help:'Industrial plants run near 400–450 °C.'},
    {id:'V',label:'Volume of the container',type:'range',min:0.5,max:1.5,step:0.1,def:1,unit:' L',lvl:'honors',show:gasS,help:'Smaller volume means higher pressure.'},
    {id:'cat',label:'Add a catalyst',type:'toggle',def:false,lvl:'honors',help:'Speeds up both directions'}
  ],
  actions:[
    {id:'addR',label:'Add reactant',lvl:'bio',show:gasS,run(sim){stress(sim,'addR');}},
    {id:'addP',label:'Add product',lvl:'bio',show:gasS,run(sim){stress(sim,'addP');}},
    {id:'remP',label:'Remove half the product',lvl:'honors',show:gasS,run(sim){stress(sim,'remP');}},
    {id:'he',label:'Add helium (same volume)',lvl:'ap',show:gasS,run(sim){stress(sim,'he');}},
    {id:'hcl',label:'Add HCl (more Cl⁻)',lvl:'honors',show:isCo,run(sim){stress(sim,'hcl');}},
    {id:'water',label:'Add water',lvl:'honors',show:isCo,run(sim){stress(sim,'water');}},
    {id:'ag',label:'Add AgNO₃ (removes Cl⁻)',lvl:'honors',show:isCo,run(sim){stress(sim,'ag');}},
    {id:'fresh',label:'Start over',lvl:'bio',run(sim){sim.st=freshState(sim);sim.infoDirty=true;}}
  ],
  init(sim){return freshState(sim);},
  step(sim,dt){const p=sim.p,S=sysOf(p);let st=sim.st;
    if(st.sys!==p.sys){st=sim.st=freshState(sim);st.sys=p.sys;}
    if(S.gas&&Math.abs(p.V-st.V)>1e-9)setV(sim,p.V);
    const T=TK(p),K=Kat(S,T),kf=kfNow(p);if(st.Tlast!==undefined&&st.Tlast!==T)markStress(sim,'temp');st.Tlast=T;if(st.catLast!==undefined&&st.catLast!==p.cat)markStress(sim,'cat');st.catLast=p.cat;
    // RK2 on the extent of reaction
    const deriv=n=>{const s2={n,V:st.V};const r=rates(S,s2,kf,K);return {d:(r.f-r.r)*st.V,r};};
    const r0=deriv(st.n),mid={};S.sp.forEach(s=>mid[s.id]=Math.max(0,st.n[s.id]+s.nu*r0.d*dt/2));const r1=deriv(mid);let dx=r1.d*dt;
    S.sp.forEach(s=>{if(st.n[s.id]+s.nu*dx<0)dx=-st.n[s.id]/s.nu*0.999;});S.sp.forEach(s=>st.n[s.id]=Math.max(0,st.n[s.id]+s.nu*dx));
    st.rf=r0.r.f;st.rr=r0.r.r;
    // particle events at the gross rates (display molecules per second)
    const main=S.sp[0],Sm=main.S;st.af+=st.rf*st.V*Sm*dt*(p.sys==='haber'?1:1);st.ar+=st.rr*st.V*Sm*dt;
    let guard=0;while(st.af>=1&&guard++<20){st.af-=1;if(!evForward(sim))st.af=0;}
    guard=0;while(st.ar>=1&&guard++<20){st.ar-=1;if(!evReverse(sim))st.ar=0;}
    // keep the drawing matched to the computed amounts (rounding)
    const want=Math.round(st.n[main.id]*Sm),have=dispCount(st,main.g==='pink'?'pink':main.g);
    if(have>want+1)evForward(sim);else if(have<want-1)evReverse(sim);
    if(st.ps.some(q=>q.dead))st.ps=st.ps.filter(q=>!q.dead);
    // motion
    const sp=Math.sqrt(T/300)*(S.gas?60:14),W=st.W;
    for(const q of st.ps){if(!S.gas||q.g==='Cl'){q.vx+=(st.rnd()-.5)*300*dt;q.vy+=(st.rnd()-.5)*300*dt;const v=Math.hypot(q.vx,q.vy),mx=S.gas?sp*1.6:sp*2;if(v>mx){q.vx*=mx/v;q.vy*=mx/v;}}
      else{const v=Math.hypot(q.vx,q.vy)||1,tgt=sp*(q.g==='H2'?1.6:q.g==='N2O4'?0.75:1);q.vx*=1+(tgt/v-1)*0.02;q.vy*=1+(tgt/v-1)*0.02;}
      q.x+=q.vx*dt;q.y+=q.vy*dt;q.a+=q.w*dt;if(q.fl>0)q.fl-=dt;const m=9;
      if(q.x<BX+m){q.x=BX+m;q.vx=Math.abs(q.vx);}if(q.x>BX+W-m){q.x=BX+W-m;q.vx=-Math.abs(q.vx);}if(q.y<BY+m){q.y=BY+m;q.vy=Math.abs(q.vy);}if(q.y>BY+BH-m-(st.ag>0?14:0)){q.y=BY+BH-m-(st.ag>0?14:0);q.vy=-Math.abs(q.vy);}}
    if(st.full>0)st.full-=dt;
    st.log.push([sim.t,st.rf,st.rr]);if(st.log.length>400)st.log.shift();},
  afterPrewarm(sim){const st=sim.st,S0=sysOf(sim.p);st.I=Object.assign({},S0.n0);st.IV=st.V;st.last=null;st.Q0=Qof(sysOf(sim.p),st);st.K0=Kat(sysOf(sim.p),TK(sim.p));},
  metrics:[
    {id:'N2O4',label:'[N₂O₄]',unit:'M',lvl:'bio',min:0,max:null,d:4,show:p=>p.sys==='no2',get:s=>s.p.sys==='no2'?conc(s.st,'N2O4'):NaN},
    {id:'NO2',label:'[NO₂]',unit:'M',lvl:'bio',min:0,max:null,d:4,show:p=>p.sys==='no2',get:s=>s.p.sys==='no2'?conc(s.st,'NO2'):NaN},
    {id:'N2',label:'[N₂]',unit:'M',lvl:'honors',min:0,max:null,d:3,show:p=>p.sys==='haber',get:s=>s.p.sys==='haber'?conc(s.st,'N2'):NaN},
    {id:'H2',label:'[H₂]',unit:'M',lvl:'honors',min:0,max:null,d:3,show:p=>p.sys==='haber',get:s=>s.p.sys==='haber'?conc(s.st,'H2'):NaN},
    {id:'NH3',label:'[NH₃]',unit:'M',lvl:'honors',min:0,max:null,d:3,show:p=>p.sys==='haber',get:s=>s.p.sys==='haber'?conc(s.st,'NH3'):NaN},
    {id:'Co6',label:'[Co(H₂O)₆²⁺] (pink)',unit:'M',lvl:'honors',min:0,max:null,d:4,show:isCo,get:s=>s.p.sys==='co'?conc(s.st,'Co6'):NaN},
    {id:'CoCl4',label:'[CoCl₄²⁻] (blue)',unit:'M',lvl:'honors',min:0,max:null,d:4,show:isCo,get:s=>s.p.sys==='co'?conc(s.st,'CoCl4'):NaN},
    {id:'Cl',label:'[Cl⁻]',unit:'M',lvl:'honors',min:0,max:null,d:2,show:isCo,get:s=>s.p.sys==='co'?conc(s.st,'Cl'):NaN},
    {id:'shift',label:'Which way it is going',unit:'',lvl:'bio',text:true,get:s=>shiftText(s)},
    {id:'rf',label:'Forward rate',unit:'M/s',lvl:'honors',min:0,max:null,d:5,get:s=>s.st.rf},
    {id:'rr',label:'Reverse rate',unit:'M/s',lvl:'honors',min:0,max:null,d:5,get:s=>s.st.rr},
    {id:'Q',label:'Reaction quotient Q',unit:'',lvl:'honors',text:true,get:s=>fmtK(Qof(sysOf(s.p),s.st))},
    {id:'K',label:'Equilibrium constant K',unit:'',lvl:'honors',text:true,get:s=>fmtK(Kat(sysOf(s.p),TK(s.p)))},
    {id:'yield',label:'NH₃ in the gas mix',unit:'%',lvl:'honors',min:0,max:100,d:1,show:p=>p.sys==='haber',get:s=>{const t=s.st,tot=t.n.N2+t.n.H2+t.n.NH3;return s.p.sys==='haber'&&tot>0?100*t.n.NH3/tot:NaN;}},
    {id:'P',label:'Total pressure',unit:'atm',lvl:'ap',min:0,max:null,d:2,show:gasS,get:s=>{const t=s.st;if(s.p.sys==='co')return NaN;const nt=Object.values(t.n).reduce((a,b)=>a+b,0)+t.He;return nt*0.08206*TK(s.p)/t.V;}}
  ],
  graphs:[{id:'cg',label:'Concentrations vs time',lvl:'bio',custom:true},{id:'rg',label:'Forward and reverse rates',lvl:'honors',custom:true},{id:'qk',label:'Q and K vs time (log scale)',lvl:'ap',custom:true}],
  defaultGraph:'cg',
  plot(sim,ctx,box,id){const p=sim.p,S=sysOf(p),win=30,xmax=Math.max(win,sim.t),xmin=xmax-win;const rows=sim.hist.filter(r=>r.t>=xmin);
    const draw=(series,yl,ymin,ymax)=>{box.T=34;box.H=box.ch-34-40;const ax=BioLab.h.axes(ctx,box,{xmin,xmax,ymin,ymax,xl:'Time (s)',yl});
      ctx.save();ctx.beginPath();ctx.rect(box.L,box.T,box.W,box.H);ctx.clip();series.forEach(s=>{ctx.strokeStyle=s.c;ctx.lineWidth=2.5;ctx.setLineDash(s.dash?[6,4]:[]);ctx.beginPath();let n=0;rows.forEach(r=>{const v=s.f(r);if(!Number.isFinite(v))return;n++?ctx.lineTo(ax.X(r.t),ax.Y(v)):ctx.moveTo(ax.X(r.t),ax.Y(v));});ctx.stroke();});ctx.setLineDash([]);ctx.restore();
      legend(ctx,box.L,14,series.map(s=>({label:s.l,color:s.c,dash:s.dash})));};
    if(id==='cg'){const cols=[PAL['s2'],PAL['s4'],PAL['s5']];const ser=S.sp.filter(s=>!(p.sys==='co'&&s.id==='Cl')).map((s,i)=>({l:'['+s.f+']',c:p.sys==='no2'?(i?PAL['cv-prod']:PAL['s2']):p.sys==='co'?(i?PAL['s2']:PAL['cv-h']):cols[i],f:r=>r.v[s.id]}));
      const ymax=Math.max(1e-6,...rows.map(r=>Math.max(...ser.map(s=>s.f(r)||0))))*1.15;draw(ser,'Concentration (M)',0,ymax);}
    else if(id==='rg'){const ser=[{l:'forward',c:PAL['s3'],f:r=>r.v.rf},{l:'reverse',c:PAL['s1'],f:r=>r.v.rr,dash:true}];const ymax=Math.max(1e-9,...rows.map(r=>Math.max(r.v.rf||0,r.v.rr||0)))*1.15;draw(ser,'Rate (M/s)',0,ymax);}
    else{const K=Kat(S,TK(p));const Qs=rows.map(r=>{const n={};S.sp.forEach(s=>n[s.id]=r.v[s.id]);return Math.log10(Qof(S,null,n,1));});const lk=Math.log10(K);
      const lo=Math.min(lk,...Qs.filter(Number.isFinite))-0.5,hi=Math.max(lk,...Qs.filter(Number.isFinite))+0.5;
      rows.forEach((r,i)=>r._q=Qs[i]);draw([{l:'log Q',c:PAL['g-line'],f:r=>r._q},{l:'log K',c:PAL['muted'],f:()=>lk,dash:true}],'log₁₀',lo,hi);}},
  infoPanel(sim){const p=sim.p,S=sysOf(p),st=sim.st,ap=atLeast('ap'),hon=atLeast('honors');
    const num=S.sp.filter(s=>s.nu>0).map(s=>'['+s.f+']'+(s.nu>1?'<sup>'+s.nu+'</sup>':'')).join(''),den=S.sp.filter(s=>s.nu<0).map(s=>'['+s.f+']'+(-s.nu>1?'<sup>'+(-s.nu)+'</sup>':'')).join('');
    let h='<div class="p-head"><h3>'+(ap?'K expression and ICE table':'The equilibrium constant')+'</h3></div><p style="font-size:1.05em">K = '+num+' / '+den+(p.sys==='co'?' <small>(water is a liquid, so it is left out)</small>':'')+'</p>';
    const T=TK(p),K=Kat(S,T);h+='<p>At '+(T-273.15).toFixed(0)+' °C, K = <b>'+fmtK(K)+'</b>. '+(S.dH>0?'The forward reaction is endothermic (ΔH° = +'+S.dH+' kJ/mol), so heating makes K larger.':'The forward reaction is exothermic (ΔH° = '+S.dH+' kJ/mol), so heating makes K smaller.')+'</p>';
    if(!hon)return h+'<p>Only temperature changes K. Adding chemicals or changing the volume changes Q instead, and the reaction shifts until Q equals K again.</p>';
    if(!ap)return h+'<p>Q has the same form as K but uses the concentrations right now. If Q &lt; K, the reaction shifts right; if Q &gt; K, it shifts left.</p>';
    const I=st.I||st.n,IV=st.IV||st.V,xe=solveXi(S,I,IV,K);
    const row=(lab,f)=>'<tr><th>'+lab+'</th>'+S.sp.map(s=>'<td>'+f(s)+'</td>').join('')+'</tr>';
    const cI=s=>I[s.id]/IV,xc=xe/IV;
    h+='<div class="tbl-wrap"><table><thead><tr><th></th>'+S.sp.map(s=>'<th>['+s.f+']</th>').join('')+'</tr></thead><tbody>'+
      row('I',s=>fmtC(cI(s)))+row('C',s=>(s.nu>0?'+':'−')+(Math.abs(s.nu)>1?Math.abs(s.nu):'')+'x')+row('E',s=>fmtC(cI(s)+s.nu*xc))+'</tbody></table></div>';
    h+='<p>Solving K = '+fmtK(K)+' gives <b>x = '+fmtC(xc)+' M</b>'+(xc<0?' (negative: the reaction runs in reverse)':'')+'. I is '+(st.last?'the mixture right after the last change you made.':'the starting mixture, before any reaction.')+'</p>';
    return h;},
  narrate(sim){const p=sim.p,S=sysOf(p),st=sim.st,hon=atLeast('honors'),ap=atLeast('ap');const Q=Qof(S,st),K=Kat(S,TK(p)),lr=Math.log10(Q/K);
    const at=Math.abs(lr)<0.02,dir=lr<0?'right':'left';const last=st.last&&sim.t-st.last.t<10?st.last.kind:null;
    const ev=(st.rf*st.V*S.sp[0].S).toFixed(1);
    const why={addR:'You added reactant, so Q dropped below K.',addP:'You added product, so Q rose above K.',remP:'You removed product, so Q dropped below K.',
      volume:'You changed the volume, which changed every concentration at once.',temp:'You changed the temperature, which changed K itself.',cat:'The catalyst speeds up both directions equally, so it cannot shift the equilibrium.',
      he:'Helium adds pressure but does not change any concentration in the K expression, so Q still equals K.',hcl:'More Cl⁻ lowered Q below K.',water:'Adding water diluted everything; Q rose above K because Cl⁻ is raised to the 4th power.',ag:'Ag⁺ pulled Cl⁻ out as solid AgCl, so Q rose above K.'};
    let s='';if(last&&why[last])s+=why[last]+' ';
    if(at){s+='<b>At equilibrium.</b> The forward and reverse reactions both keep running, about '+ev+' times a second each in this box, so the amounts stay the same.';
      if(p.sys==='no2'&&!hon)s+=' Heat it, cool it, or add a chemical to disturb it.';}
    else{const toward=dir==='right'?S.sp.filter(s=>s.nu>0).map(s=>s.f).join(' and '):S.sp.filter(s=>s.nu<0).map(s=>s.f).join(' and ');
      s+='<b>Shifting '+dir+'</b> toward more '+toward+(hon?' (Q '+(lr<0?'<':'>')+' K)':'')+'. The '+(dir==='right'?'forward':'reverse')+' reaction is faster until the rates match again.';}
    if(p.sys==='co'&&!at)s+=' Watch the color: '+(dir==='right'?'bluer':'pinker')+'.';
    return s;},
  tour:[
    {title:'A reversible reaction',text:{bio:'N₂O₄ is a colorless gas. Each N₂O₄ molecule can split into two brown NO₂ molecules, and two NO₂ molecules can join back into N₂O₄.',honors:'N₂O₄(g) ⇌ 2NO₂(g). The double arrow means both reactions happen. The particle box and the tube show the same mixture.'},focus:[BX,BY,WPL,BH],speed:0.5,setup(sim){BioLab.setValues(sim,{sys:'no2',Tg:25,V:1,cat:false});sim.st=freshState(sim);sim.st.sys='no2';}},
    {title:'Heading to equilibrium',text:'We started with only N₂O₄. At first only the forward reaction can happen. As NO₂ builds up, the reverse reaction speeds up.',focus:[[BX,BY,WPL,BH],[PX,BY,PW,BH]],speed:0.5},
    {title:'Dynamic, not stopped',text:{bio:'Now the amounts hold steady, but look closely: molecules still split and join. The two reactions run at the same speed, so nothing changes overall.',honors:'Forward rate = reverse rate. Watch the rate bars: both are nonzero and equal. Open the Forward and reverse rates graph to see them meet.'},focus:[PX,232,PW,160],speed:0.5},
    {title:'Heat it',text:{bio:'Heat the mixture to 80 °C. The forward reaction absorbs heat, so heating pushes the reaction toward brown NO₂.',honors:'The forward reaction is endothermic (ΔH° = +57.2 kJ/mol). Heating raises K, so the mixture shifts right and gets browner.'},focus:[[BX,BY,WPL,BH],[PX,BY,PW,170]],speed:0.5,setup(sim){BioLab.setValues(sim,{Tg:80});}},
    {title:'Add more reactant',text:'Extra N₂O₄ is added at the left side. The mixture shifts right to use some of it up, making more NO₂.',focus:[BX,BY,WPL,BH],speed:0.5,setup(sim){BioLab.setValues(sim,{Tg:25});stress(sim,'addR');}},
    {lvl:'honors',title:'Squeeze it',text:'Halve the volume. Every concentration doubles, but [NO₂]² doubles twice, so Q > K. The mixture shifts left, toward fewer gas molecules.',focus:[BX,BY,460,BH],speed:0.5,setup(sim){BioLab.setValues(sim,{V:0.5});}},
    {lvl:'honors',title:'Q versus K',text:'The gauge compares Q with K. When the marker is left of K, the reaction shifts right; when it is right of K, it shifts left. At equilibrium they line up.',focus:[BX,408,768,86],speed:0.5,setup(sim){BioLab.setValues(sim,{V:1});}},
    {lvl:'ap',title:'Only temperature changes K',text:'Concentration and volume changes move Q away from K. A temperature change moves K itself, following ln(K₂/K₁) = −(ΔH°/R)(1/T₂ − 1/T₁).',focus:[BX,408,768,86],speed:0.5,setup(sim){BioLab.setValues(sim,{Tg:60});}}
  ],
  onTourExit(sim){const base={};sim.def.controls.forEach(c=>base[c.id]=c.def);BioLab.setValues(sim,base);sim.st=freshState(sim);sim.st.sys=sim.p.sys;syncMode(sim);},
  onChallenge(sim,ch,phase){if(ch&&ch.instant&&ch.set&&phase==='done'){BioLab.setValues(sim,ch.set);syncMode(sim);sim.st=freshState(sim);sim.st.sys=sim.p.sys;const h=sim.def.dtMax;for(let i=0;i<1200;i++)sim.def.step(sim,h);sim.def.afterPrewarm(sim);sim.infoDirty=true;}},
  challenges:[
    {lvl:'bio',q:'The N₂O₄ ⇌ 2NO₂ mixture is at equilibrium at 25 °C. You heat it to 80 °C. What happens to the brown color?',choices:['It gets darker, because more brown NO₂ forms','It gets lighter','It stays the same, because the system is already at equilibrium'],correct:0,
     baseline:{sys:'no2',Tg:25},change:{Tg:80},changeText:'Heated to 80 °C',watch:'cg',
     explain:{bio:'Splitting N₂O₄ absorbs heat. Adding heat favors the direction that uses it up, so more N₂O₄ splits into brown NO₂. This is the classic hot-and-cold NO₂ tube demo.',honors:'The forward reaction is endothermic, so K rises from 0.0046 to about 0.17 at 80 °C. Q is now below K, and the mixture shifts right.'}},
    {lvl:'bio',q:'At equilibrium you add extra N₂O₄. What does the mixture do?',choices:['Makes more NO₂ to use up some of the extra N₂O₄','Nothing; it was already balanced','Makes more N₂O₄'],correct:0,
     baseline:{sys:'no2',Tg:25},changeAction:'addR',changeText:'Extra N₂O₄ added',watch:'cg',
     explain:{bio:'When you add a reactant, the reaction shifts toward the products to use some of it up. [NO₂] rises to a new, higher steady value. This is Le Châtelier’s principle.'}},
    {lvl:'bio',instant:true,set:{sys:'no2',Tg:25},q:'The amounts of N₂O₄ and NO₂ have stopped changing. What is happening to the molecules?',choices:['Nothing: the reactions have stopped','N₂O₄ keeps splitting and NO₂ keeps joining, at the same speed','Only N₂O₄ is splitting'],correct:1,
     explain:{bio:'Equilibrium is dynamic. Watch the box: molecules keep splitting and joining several times a second, but each split is balanced by a join, so the totals stay the same.',honors:'The Forward rate and Reverse rate readouts are equal and not zero.'}},
    {lvl:'honors',q:'You squeeze the N₂O₄ ⇌ 2NO₂ mixture from 1.0 L to 0.5 L. Which way does it shift?',choices:['Toward NO₂, because pressure pushes molecules apart','Toward N₂O₄, the side with fewer gas molecules','No shift, because the amounts did not change'],correct:1,
     baseline:{sys:'no2',Tg:25,V:1},change:{V:0.5},changeText:'Volume halved to 0.5 L',watch:'cg',
     explain:{honors:'Halving V doubles both concentrations, but Q = [NO₂]²/[N₂O₄] doubles, so Q > K. The reaction shifts left: 2 NO₂ molecules become 1 N₂O₄, which lowers the pressure. The tube first gets darker (squeezed) and then lighter as it shifts.'}},
    {lvl:'honors',q:'The Haber mixture is at equilibrium at 450 °C. You add an iron catalyst. What happens to the amount of NH₃?',choices:['It increases, because catalysts make more product','It stays the same; the catalyst only gets to equilibrium faster','It decreases'],correct:1,
     baseline:{sys:'haber',Th:450},change:{cat:true},changeText:'Catalyst added',watch:'cg',
     explain:{honors:'A catalyst lowers the activation energy for both the forward and reverse reactions by the same amount, so both speed up equally. K and the equilibrium amounts do not change. Industry uses iron so it reaches equilibrium quickly.'}},
    {lvl:'honors',q:'The cobalt chloride solution is violet. You add water. What color does it turn?',choices:['Bluer','Pinker','It stays violet'],correct:1,
     baseline:{sys:'co',Tg:25},changeAction:'water',changeText:'50 mL of water added',watch:'cg',
     explain:{honors:'Water dilutes everything. Q = [CoCl₄²⁻]/([Co(H₂O)₆²⁺][Cl⁻]⁴), and diluting shrinks the denominator much more because of the 4th power, so Q > K. The reaction shifts left to the pink Co(H₂O)₆²⁺. (Water itself is a product, but as the liquid solvent it does not appear in K.)'}},
    {lvl:'honors',q:'You heat the cobalt chloride solution from 25 °C to 80 °C. The forward reaction is endothermic. The color turns…',choices:['bluer','pinker','colorless'],correct:0,
     baseline:{sys:'co',Tg:25},change:{Tg:80},changeText:'Heated to 80 °C',watch:'cg',
     explain:{honors:'Heat acts like a reactant in an endothermic reaction. Heating raises K, so the mixture shifts toward blue CoCl₄²⁻. Ice water turns it pink again.'}},
    {lvl:'ap',q:'You add helium to the N₂O₄/NO₂ container without changing its volume. The total pressure rises. Which way does it shift?',choices:['Left, because the pressure went up','Right','No shift'],correct:2,
     baseline:{sys:'no2',Tg:25,V:1},changeAction:'he',changeText:'Helium added at constant volume',watch:'qk',
     explain:{ap:'Helium is not in the K expression and the volume did not change, so [N₂O₄] and [NO₂] stay the same and Q still equals K. Pressure changes cause shifts only when they change the concentrations (partial pressures) of the reacting gases.'}},
    {lvl:'ap',q:'The Haber reaction is exothermic (ΔH° = −92 kJ/mol). You raise the temperature from 400 °C to 500 °C. What happens?',choices:['K increases and more NH₃ forms','K decreases and some NH₃ breaks down','K stays the same; only the rate changes'],correct:1,
     baseline:{sys:'haber',Th:400},change:{Th:500},changeText:'Heated to 500 °C',watch:'cg',
     explain:{ap:'For an exothermic reaction, K falls as T rises: K goes from about 0.50 to 0.060. Q is now above K, so NH₃ decomposes. Industry accepts a lower yield at 400–450 °C because the rate at lower temperatures is too slow.'}},
    {lvl:'ap',instant:true,set:{sys:'no2',Tg:25,V:1},q:'0.050 mol N₂O₄ is sealed in a 1.00 L flask at 25 °C (K = 4.6 × 10⁻³). Use an ICE table: what is [NO₂] at equilibrium?',choices:['0.0068 M','0.014 M','0.10 M'],correct:1,
     explain:{ap:'K = (2x)²/(0.050 − x) = 4.6 × 10⁻³ gives 4x² + 0.0046x − 0.00023 = 0, so x = 0.0070 M and [NO₂] = 2x = 0.014 M. The x is not negligible here (14% of 0.050), so the quadratic is needed. The info panel shows the same ICE table.'}},
    {lvl:'ap',instant:true,set:{sys:'no2',Tg:25,V:1},q:'For N₂O₄ ⇌ 2NO₂ at 25 °C, a mixture has [N₂O₄] = 0.010 M and [NO₂] = 0.020 M. Which way will it shift?',choices:['Right, toward NO₂','Left, toward N₂O₄','It is at equilibrium'],correct:1,
     explain:{ap:'Q = (0.020)²/0.010 = 0.040, which is larger than K = 0.0046. Too much product, so the reaction runs in reverse until Q falls to K.'}}
  ],
  lab:{bio:'<p><b>Question:</b> How do heat and extra chemicals change an equilibrium? (Like the hot and cold NO₂ tubes.)</p><ol><li>Let the N₂O₄ ⇌ 2NO₂ mixture settle at 25 °C. Record [NO₂].</li><li>Set the temperature to 0 °C, then 50 °C and 100 °C. Record [NO₂] each time after it settles.</li><li>Back at 25 °C, press <b>Add reactant</b>, wait, and record.</li></ol><p>For each change, predict first: will the mixture get browner or lighter? Explain using “the reaction shifts to use up what you added.”</p>',
       honors:'<p><b>Question:</b> Can Q and K predict every Le Châtelier shift?</p><ol><li>For each stress (add reactant, add product, remove product, halve the volume, heat, catalyst), write Q &gt; K, Q &lt; K or Q = K right after the change.</li><li>Predict the direction, then test it and record Q and K before and after.</li><li>Repeat with the cobalt system: add HCl, add water, add AgNO₃, heat.</li></ol><p>Which stresses changed K itself? Which only changed Q?</p>',
       ap:'<p><b>Question:</b> What is ΔH° for N₂O₄ ⇌ 2NO₂, measured from K?</p><ol><li>At 1.00 L, record trials at 0, 20, 40, 60, 80 and 100 °C after each settles: [N₂O₄], [NO₂].</li><li>Calculate K = [NO₂]²/[N₂O₄] for each trial and plot ln K against 1/T (K).</li><li>Use the ICE table panel to check one trial by hand.</li></ol><p><b>Claim–evidence–reasoning:</b> The slope equals −ΔH°/R. Find ΔH° and compare it with +57.2 kJ/mol. Explain why heating favors the endothermic direction in terms of K, not just “stress.”</p>'},
  terms:[{t:'Reversible reaction',d:'A reaction that runs in both directions, shown with ⇌.'},{t:'Dynamic equilibrium',d:'The forward and reverse reactions run at the same rate, so amounts stay constant even though molecules keep reacting.'},
    {t:'Le Châtelier’s principle',d:'If a system at equilibrium is disturbed, it shifts in the direction that partly undoes the change.'},
    {t:'Endothermic / exothermic',d:'Absorbs heat / releases heat. Heating favors the endothermic direction.'},
    {lvl:'honors',t:'Equilibrium constant (K)',d:'K = [products]^coefficients / [reactants]^coefficients at equilibrium. Pure solids and liquids are left out. K changes only with temperature.'},
    {lvl:'honors',t:'Reaction quotient (Q)',d:'Same form as K, using the current concentrations. Q < K: shifts right. Q > K: shifts left.'},
    {lvl:'honors',t:'Catalyst',d:'Speeds up the forward and reverse reactions equally; equilibrium is reached faster but does not move.'},
    {lvl:'ap',t:'ICE table',d:'Initial, Change, Equilibrium rows for solving equilibrium concentrations from K.'},
    {lvl:'ap',t:'van ’t Hoff equation',d:'ln(K₂/K₁) = −(ΔH°/R)(1/T₂ − 1/T₁).'},
    {lvl:'ap',t:'Partial pressure',d:'The pressure one gas would exert alone. Adding an inert gas at constant volume does not change it.'}],
  about:'<p><b>Model.</b> The reaction runs by mass action, rate<sub>f</sub> = k<sub>f</sub>Π[reactant]<sup>ν</sup> and rate<sub>r</sub> = k<sub>r</sub>Π[product]<sup>ν</sup>, with k<sub>r</sub> = k<sub>f</sub>/K, so it relaxes to exactly Q = K. K depends on temperature through the van ’t Hoff equation; k<sub>f</sub> follows Arrhenius and is scaled so equilibrium is reached in about a second (real rates vary enormously). A catalyst multiplies both k<sub>f</sub> and k<sub>r</sub> by 6. The particle box performs forward and reverse events at the computed rates, so the number of molecules you see follows the computed amounts.</p><p><b>Data.</b> N₂O₄ ⇌ 2NO₂: K<sub>c</sub> = 4.6 × 10⁻³ at 25 °C and ΔH° = +57.2 kJ/mol (standard textbook values). Haber: K<sub>c</sub> ≈ 0.060 at 500 °C and ΔH° = −92.2 kJ/mol, starting from a 1:3 N₂:H₂ mix at 1 mol N₂/L (about 250 atm). Cobalt chloride: K and ΔH° = +50 kJ/mol are illustrative values chosen to reproduce the familiar colors (pink in water, violet in about 6 M Cl⁻, blue when hot or in concentrated HCl); the real system involves several intermediate complexes and is far from ideal.</p><p><b>Simplified.</b> Concentrations are used in place of activities. Gases are ideal, and the temperature is held fixed by a bath. Each added portion of chemical appears at the left side of the box.</p>',
  initVis(sim){},
  draw(sim,ctx,vdt,k,t){const p=sim.p,S=sysOf(p),st=sim.st,hon=atLeast('honors'),ap=atLeast('ap');
    ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,500);
    txt(ctx,S.eq,BX,28,{s:15*k,w:700,b:'middle'});
    if(hon){ctx.font='700 '+15*k+'px '+FONT;const w=ctx.measureText(S.eq).width;const dh='ΔH° = '+(S.dH>0?'+':'')+S.dH+' kJ/mol';ctx.font=13*k+'px '+FONT;if(BX+w+24+ctx.measureText(dh).width<784)txt(ctx,dh,784,28,{s:13*k,c:PAL['cv-soft'],a:'right',b:'middle'});}
    // box
    const W=st.W;rr(ctx,BX,BY,W,BH,10);ctx.fillStyle=S.gas?PAL['cv-bg2']:PAL['cv-water'];ctx.fill();
    const Tc=TK(p)-273.15,ref=S.Tc==='Th'?450:25,hot=clamp((Tc-ref)/(S.Tc==='Th'?150:75),-1,1);
    if(hot>0.02){ctx.fillStyle='rgba(230,70,40,'+(0.14*hot).toFixed(3)+')';ctx.fill();}else if(hot<-0.02){ctx.fillStyle='rgba(60,130,230,'+(-0.25*hot).toFixed(3)+')';ctx.fill();}
    ctx.save();rr(ctx,BX,BY,W,BH,10);ctx.clip();
    if(st.ag>0){ctx.fillStyle='#f2f2ee';ctx.fillRect(BX,BY+BH-14,W,14);ctx.fillStyle='#cfcfc8';for(let i=0;i<W;i+=7)ctx.fillRect(BX+i,BY+BH-14+((i*13)%5),4,3);}
    if(st.He>0){const nHe=Math.round(st.He*(p.sys==='no2'?200:6));const r=rng(31);for(let i=0;i<nHe;i++){ctx.fillStyle=PAL['cv-soft'];ctx.globalAlpha=0.5;const x=BX+8+((r()*W+t*(20+r()*40))%(W-16)),y=BY+8+r()*(BH-16);ctx.beginPath();ctx.arc(x,y,2.5,0,6.29);ctx.fill();}ctx.globalAlpha=1;}
    st.ps.forEach(q=>drawMol(ctx,q));
    ctx.restore();ctx.lineWidth=3;ctx.strokeStyle=PAL['cv-glass'];rr(ctx,BX,BY,W,BH,10);ctx.stroke();
    if(S.gas){ctx.fillStyle=PAL['cv-soft'];ctx.fillRect(BX+W+2,BY-6,8,BH+12);ctx.fillRect(BX+W+10,BY+BH/2-5,Math.max(14,470-W-10),10);}
    if(st.full>0)pill(ctx,'The box is full. Start over to add more.',BX+150,BY+24,PAL['s4'],'#fff',13*k);
    drawMacro(ctx,sim,k);drawRates(ctx,sim,k);drawGauge(ctx,sim,k);
  },
  thumbSetup(sim){},thumbFrames:30
};
function drawMol(ctx,q){const x=q.x,y=q.y;
  if(q.g==='pink'||q.g==='blue'){ctx.fillStyle=q.g==='pink'?'#e07aa0':'#2f5fc4';ctx.beginPath();ctx.arc(x,y,9,0,6.29);ctx.fill();ctx.strokeStyle='rgba(0,0,0,.3)';ctx.lineWidth=1;ctx.stroke();}
  else if(q.g==='Cl'){ctx.fillStyle=PAL['s3'];ctx.beginPath();ctx.arc(x,y,4.5,0,6.29);ctx.fill();}
  else{const g=GL[q.g],c=Math.cos(q.a),s=Math.sin(q.a);g.forEach(([e,dx,dy])=>{const ax=x+dx*c-dy*s,ay=y+dx*s+dy*c;ctx.fillStyle=e==='N'&&(q.g==='NO2'||q.g==='N2O4')?'#3050f8':CL.cpk(e);ctx.beginPath();ctx.arc(ax,ay,RAD[e],0,6.29);ctx.fill();ctx.strokeStyle='rgba(0,0,0,.4)';ctx.lineWidth=0.8;ctx.stroke();});
    if(q.g==='NO2'){ctx.strokeStyle='rgba(150,75,20,.8)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y+1,10,0,6.29);ctx.stroke();}}
  if(q.fl>0){ctx.strokeStyle=PAL['cv-e'];ctx.globalAlpha=clamp(q.fl*2.5,0,0.8);ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(x,y,15,0,6.29);ctx.stroke();ctx.globalAlpha=1;}}
function card(ctx,x,y,w,h){rr(ctx,x,y,w,h,10);ctx.fillStyle=PAL['card'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();}
function drawMacro(ctx,sim,k){const p=sim.p,S=sysOf(p),st=sim.st,fs=12*k,y=BY,h=168;card(ctx,PX,y,PW,h);const hon=atLeast('honors');
  const vol=S.gas?(hon?' · '+st.V.toFixed(1)+' L':''):' · '+(st.V*1000).toFixed(0)+' mL';
  const cx=PX+PW-46*Math.min(k,1.3),top=y+20+fs*1.6,bot=y+h-14-fs*1.3,ly=top+fs*0.6;
  const vessel=(fill,round)=>{ctx.fillStyle='rgba(190,225,240,0.25)';rr(ctx,cx-22,top,44,bot-top,round);ctx.fill();ctx.fillStyle=fill;rr(ctx,cx-22,top,44,bot-top,round);ctx.fill();ctx.strokeStyle='#8aa6b4';ctx.lineWidth=2.5;rr(ctx,cx-22,top,44,bot-top,round);ctx.stroke();};
  if(p.sys==='no2'){const a=clamp(conc(st,'NO2')/0.06,0,0.92);txt(ctx,'Sealed tube'+vol,PX+12,y+10+fs,{s:13*k,w:700});vessel('rgba(150,75,20,'+a.toFixed(3)+')',18);
    txt(ctx,a<0.15?'nearly colorless':a<0.45?'light brown':'dark brown',cx,y+h-10,{s:fs,c:PAL['cv-soft'],a:'center'});legendRow(ctx,PX+12,ly,[['N2O4','N₂O₄'],['NO2','NO₂ (brown)']],k);return;}
  if(p.sys==='co'){const f=conc(st,'CoCl4')/(conc(st,'CoCl4')+conc(st,'Co6')+1e-12);const pk=[224,122,160],bl=[47,95,196];
    txt(ctx,'Test tube'+vol,PX+12,y+10+fs,{s:13*k,w:700});vessel('rgb('+pk.map((v,i)=>Math.round(lerp(v,bl[i],f))).join(',')+')',20);
    txt(ctx,f<0.25?'pink':f<0.6?'violet':'blue',cx,y+h-10,{s:fs,w:700,c:PAL['cv-soft'],a:'center'});
    legendRow(ctx,PX+12,ly,[['pink','Co(H₂O)₆²⁺'],['blue','CoCl₄²⁻'],['Cl',k>1.35?'Cl⁻':'Cl⁻ (1 dot : 80)']],k);return;}
  const tot=st.n.N2+st.n.H2+st.n.NH3,y_=st.n.NH3/tot;txt(ctx,(k>1.35?'NH₃':'Ammonia in the gas')+vol,PX+12,y+10+fs,{s:13*k,w:700});
  rr(ctx,cx-20,top,40,bot-top,6);ctx.fillStyle=PAL['card2'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.stroke();const fh=(bot-top)*clamp(y_/0.6,0,1);rr(ctx,cx-20,bot-fh,40,fh,6);ctx.fillStyle=PAL['s5'];ctx.fill();
  txt(ctx,(100*y_).toFixed(1)+'%',cx,y+h-10,{s:fs,w:700,a:'center'});legendRow(ctx,PX+12,ly,[['N2','N₂'],['H2','H₂'],['NH3','NH₃']],k);}
function legendRow(ctx,x,y,items,k){const fs=12*k;items.forEach((it,i)=>{const yy=y+i*fs*1.75;drawMol(ctx,{g:it[0],x:x+10,y:yy,a:0,fl:0});txt(ctx,it[1],x+26,yy,{s:fs,b:'middle'});});}
function drawRates(ctx,sim,k){const st=sim.st,p=sim.p,fs=12*k,y=BY+178,h=BH-178;card(ctx,PX,y,PW,h);const hon=atLeast('honors'),cmp=k>1.35;
  txt(ctx,hon?(cmp?'Rates':'Forward vs reverse rate'):'Splitting vs joining',PX+12,y+10+fs,{s:13*k,w:700});
  const mx=Math.max(st.rf,st.rr,1e-30),bh=Math.max(10,fs*0.9);
  const fl=p.sys==='no2'&&!hon?'N₂O₄ splitting →':'forward →',rl=p.sys==='no2'&&!hon?'← NO₂ joining':'← reverse';
  const bar=(v,yy,c,lab,short)=>{let L=PX+16,Wb=PW-32;if(cmp){L=PX+16+fs*2;Wb=PW-32-fs*2;txt(ctx,short,PX+14,yy+bh/2,{s:fs,w:700,c,b:'middle'});}else txt(ctx,lab,L,yy-5,{s:fs,c:PAL['cv-soft']});
    rr(ctx,L,yy,Wb,bh,4);ctx.fillStyle=PAL['card2'];ctx.fill();rr(ctx,L,yy,Math.max(2,Wb*v/mx),bh,4);ctx.fillStyle=c;ctx.fill();};
  const y1=cmp?y+22+fs*2:y+26+fs*2.4,y2=cmp?y1+bh+fs*1.1:y1+bh+fs*2.2;bar(st.rf,y1,PAL['s3'],fl,'→');bar(st.rr,y2,PAL['s1'],rl,'←');
  const eq=Math.abs(Math.log10((st.rf+1e-300)/(st.rr+1e-300)))<0.01;txt(ctx,eq?(cmp?'equal':'equal: at equilibrium'):st.rf>st.rr?'forward faster':'reverse faster',PX+PW/2,y+h-10,{s:fs,w:700,c:eq?PAL['s3']:PAL['cv-ink'],a:'center'});}
function drawGauge(ctx,sim,k){const p=sim.p,S=sysOf(p),st=sim.st,fs=12*k,y=406,h=88,hon=atLeast('honors');card(ctx,BX,y,772,h);
  const Q=Qof(S,st),K=Kat(S,TK(p)),lq=Math.log10(Q),lk=Math.log10(K),L=BX+130*Math.min(k,1.4),R=BX+760,mid=(L+R)/2,span=3;const X=v=>clamp(mid+(v-lk)/span*(R-L)/2,L,R);
  txt(ctx,hon?'Q vs K':'Balance',BX+14,y+22+fs*0.3,{s:14*k,w:700});txt(ctx,'log scale',BX+14,y+44+fs*0.6,{s:fs,c:PAL['cv-soft']});
  const by=y+44;ctx.fillStyle=PAL['card2'];rr(ctx,L,by-5,R-L,10,5);ctx.fill();
  txt(ctx,hon?'Q < K: shifts right →':'too much reactant',L,by+22+fs*0.3,{s:fs,c:PAL['cv-soft']});txt(ctx,hon?'← Q > K: shifts left':'too much product',R,by+22+fs*0.3,{s:fs,c:PAL['cv-soft'],a:'right'});
  ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(mid,by-14);ctx.lineTo(mid,by+12);ctx.stroke();txt(ctx,hon?'K = '+fmtK(K):'equilibrium',mid,by-20,{s:fs,w:700,a:'center'});
  const qx=X(lq);ctx.fillStyle=PAL['g-line'];ctx.beginPath();ctx.moveTo(qx,by+2);ctx.lineTo(qx-8,by-12);ctx.lineTo(qx+8,by-12);ctx.closePath();ctx.fill();ctx.beginPath();ctx.arc(qx,by,6,0,6.29);ctx.fill();
  if(hon&&Math.abs(qx-mid)>70*k)txt(ctx,'Q',qx,by-18,{s:fs,w:800,c:PAL['g-line'],a:'center'});}
function shiftText(sim){const S=sysOf(sim.p),st=sim.st,lr=Math.log10(Qof(S,st)/Kat(S,TK(sim.p)));if(Math.abs(lr)<0.02)return 'At equilibrium';return lr<0?'Shifting right →':'← Shifting left';}
EQ.controls[0].onChange=sim=>syncMode(sim);
EQ.onLevel=sim=>{syncMode(sim);sim.infoDirty=true;};
BioLab.register(EQ);
})();
