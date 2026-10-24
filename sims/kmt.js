(function(){
'use strict';
const {clamp,lerp,rr,txt,pill,atLeast,PAL,FONT,RM,axes,legend,serColor}=BioLab.h;
const CL=window.ChemLab;

/* Kinetic molecular theory.
   Speeds box: molecules move in 3D (the picture is their side view) with real speeds in m/s, drawn at 0.25 px per (m/s) per second.
   They bounce off the walls and collide with each other as hard spheres: when two dots touch, the collision normal gets a random
   tilt out of the screen, so energy is shared among all three directions and any starting speeds relax to the Maxwell–Boltzmann
   distribution. A weak thermostat (time constant 0.6 s) holds the average kinetic energy at (3/2)RT per mole.
   Pinhole: molecules do not collide (as in real effusion); any that reach the hole escape and are counted, and a fresh one enters
   from the reservoir on the left. 25 molecules move for each dot drawn, so the counts build quickly.
   Diffusion race: each gas front moves at a speed proportional to 1/√M (Graham's law). */
const R=8.314,SC=0.25;
const G={He:{l:'Helium',f:'He',M:4.003,r:4,c:'#26a69a'},Ne:{l:'Neon',f:'Ne',M:20.18,r:5,c:'#ef6c00'},N2:{l:'Nitrogen',f:'N₂',M:28.01,r:6,c:'#3f6fd8',di:1},
  CO2:{l:'Carbon dioxide',f:'CO₂',M:44.01,r:7,c:'#e53935',tri:1},Xe:{l:'Xenon',f:'Xe',M:131.29,r:8,c:'#7e57c2'}};
const GOPT=Object.keys(G).map(k=>({v:k,l:G[k].l+' ('+G[k].f+', '+G[k].M.toFixed(1)+' g/mol)'}));
const PAIR={hcl:{b:'NH₃',bn:'ammonia',Mb:17.03,a:'HCl',an:'hydrogen chloride',Ma:36.46,s:'NH₄Cl',cb:'#3f6fd8',ca:'#2e7d32'},
  hbr:{b:'NH₃',bn:'ammonia',Mb:17.03,a:'HBr',an:'hydrogen bromide',Ma:80.91,s:'NH₄Br',cb:'#3f6fd8',ca:'#a1452e'},
  mea:{b:'CH₃NH₂',bn:'methylamine',Mb:31.06,a:'HCl',an:'hydrogen chloride',Ma:36.46,s:'CH₃NH₃Cl',cb:'#5c6bc0',ca:'#2e7d32'}};
const BOXD={x0:24,x1:504,y0:40,y1:424},BOXE={x0:24,x1:474,y0:40,y1:424},HOLE={y0:182,y1:282};
const TUBE={x0:60,x1:740,y0:196,y1:244,cm:6.8},RACE_K=100/(14*(1/Math.sqrt(17.03)+1/Math.sqrt(36.46))),LABX=30;
const V_BOX=24.6,MOL_PER=0.01; // the speeds box is 24.6 L; each dot is 0.01 mol, so 100 dots at 300 K make 1.00 atm
const EFF_N=2000,EFF_EVERY=25;
const gauss=()=>{let u=0,v=0;while(u===0)u=Math.random();while(v===0)v=Math.random();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);};
const sig1=(M,T)=>Math.sqrt(R*T/(M/1000));
const vrmsT=(M,T)=>Math.sqrt(3*R*T/(M/1000)),vmpT=(M,T)=>Math.sqrt(2*R*T/(M/1000)),vavgT=(M,T)=>Math.sqrt(8*R*T/(Math.PI*M/1000));
const mb=(v,M,T)=>{const a=M/1000/(2*R*T);return 4*Math.PI*Math.pow(a/Math.PI,1.5)*v*v*Math.exp(-a*v*v);};
const hasB=p=>p.gasB!=='none'&&p.mode!=='race';
const gA=p=>G[p.gasA]||G.N2,gB=p=>G[p.gasB]||null;

/* ---------- state ---------- */
function mk(gas,box,T,dirIn){const s=sig1(gas.M,T);const o={x:lerp(box.x0+10,box.x1-10,Math.random()),y:lerp(box.y0+10,box.y1-10,Math.random()),vx:gauss()*s,vy:gauss()*s,vz:gauss()*s};if(dirIn){o.x=box.x0+2;o.vx=Math.abs(o.vx);}return o;}
function build(p){const st={mode:p.mode,T:p.T,mol:[],hist:[],hT:0,ema:{},esc:[0,0],escT:0,fly:[],race:{t:0,met:false,xm:0,tm:0,dep:0},key:''};
  if(p.mode==='dist'){const na=p.nA,nb=hasB(p)?p.nB:0;for(let i=0;i<na;i++)st.mol.push(Object.assign(mk(gA(p),BOXD,p.T),{s:0}));for(let i=0;i<nb;i++)st.mol.push(Object.assign(mk(gB(p),BOXD,p.T),{s:1}));}
  else if(p.mode==='effuse'){for(let i=0;i<EFF_N;i++)st.mol.push(Object.assign(mk(gA(p),BOXE,p.T),{s:0}));if(hasB(p))for(let i=0;i<EFF_N;i++)st.mol.push(Object.assign(mk(gB(p),BOXE,p.T),{s:1}));}
  else{st.rp=[];for(let s=0;s<2;s++)for(let i=0;i<55;i++)st.rp.push({s,u:Math.pow(Math.random(),0.75),y:lerp(TUBE.y0+6,TUBE.y1-6,Math.random()),ph:Math.random()*6.28});}
  st.key=keyOf(p);st.gA=p.gasA;st.gB=p.gasB;return st;}
const keyOf=p=>[p.mode,p.mode==='race'?p.pair:'',p.mode!=='race'?p.gasB==='none'?'none':'b':'',p.mode==='effuse'?p.gasB:''].join('|');
function ensure(sim){const p=sim.p;if(!sim.st||sim.st.key!==keyOf(p))sim.st=build(p);}
function gasOfMol(p,s){return s?gB(p):gA(p);}

/* adjust counts and species without restarting */
function syncCounts(sim){const p=sim.p,st=sim.st;if(p.mode!=='dist')return;
  const cnt=[0,0];st.mol.forEach(m=>cnt[m.s]++);const want=[p.nA,hasB(p)?p.nB:0];
  for(let s=0;s<2;s++){while(cnt[s]>want[s]){const i=st.mol.findIndex(m=>m.s===s);st.mol.splice(i,1);cnt[s]--;}
    while(cnt[s]<want[s]){const g=gasOfMol(p,s);st.mol.push(Object.assign(mk(g,BOXD,st.T),{s}));cnt[s]++;}}}
function swapGas(sim){const p=sim.p,st=sim.st;
  [['gA','gasA',0],['gB','gasB',1]].forEach(([k,pk,s])=>{if(st[k]!==p[pk]){const o=G[st[k]],n=G[p[pk]];if(o&&n){const f=Math.sqrt(o.M/n.M);st.mol.forEach(m=>{if(m.s===s){m.vx*=f;m.vy*=f;m.vz*=f;}});}st[k]=p[pk];st.hist=[];}});}

function stepK(sim,dt){ensure(sim);const p=sim.p,st=sim.st;swapGas(sim);syncCounts(sim);
  if(p.mode==='race')return stepRace(sim,dt);
  const box=p.mode==='dist'?BOXD:BOXE,eff=p.mode==='effuse';let left=dt;const ma=gA(p).M,mbm=hasB(p)?gB(p).M:1;
  const fast=Math.max(vrmsT(ma,p.T),hasB(p)?vrmsT(mbm,p.T):0),hmax=clamp(3/(fast*SC),0.0015,0.006);
  while(left>1e-9){const h=Math.min(left,hmax);left-=h;
    const ms=st.mol;
    for(let i=0;i<ms.length;i++){const m=ms[i];m.x+=m.vx*SC*h;m.y+=m.vy*SC*h;
      if(m.x<box.x0){m.x=2*box.x0-m.x;m.vx=Math.abs(m.vx);if(eff)spin(m,'x');}
      if(m.x>box.x1){if(eff&&m.y>HOLE.y0&&m.y<HOLE.y1){st.esc[m.s]++;if(i%EFF_EVERY===0&&st.fly.length<60)st.fly.push({x:box.x1,y:m.y,vx:m.vx,vy:m.vy,s:m.s});
          m.x=box.x0+1;m.y=lerp(box.y0+4,box.y1-4,Math.random());m.vx=-m.vx;continue;} // re-enters from the reservoir with the same speed, so the box keeps its distribution
        m.x=2*box.x1-m.x;m.vx=-Math.abs(m.vx);if(eff)spin(m,'x');}
      if(m.y<box.y0){m.y=2*box.y0-m.y;m.vy=Math.abs(m.vy);if(eff)spin(m,'y');}else if(m.y>box.y1){m.y=2*box.y1-m.y;m.vy=-Math.abs(m.vy);if(eff)spin(m,'y');}}
    if(!eff&&p.coll)collide(sim);
    // thermostat: the walls hold each gas at the set temperature
    const ke=[0,0],cn=[0,0];for(const m of ms){const M=gasOfMol(p,m.s).M/1000;ke[m.s]+=0.5*M*(m.vx*m.vx+m.vy*m.vy+m.vz*m.vz);cn[m.s]++;}
    let Tsum=0;for(let s2=0;s2<2;s2++){if(!cn[s2])continue;const Tk=ke[s2]/(1.5*R*cn[s2]);let l2=1+h/0.4*(p.T/Math.max(1,Tk)-1);l2=clamp(l2,0.8,1.25);const l=Math.sqrt(l2);for(const m of ms)if(m.s===s2){m.vx*=l;m.vy*=l;m.vz*=l;}Tsum+=Tk*l2*cn[s2];}
    st.T=(cn[0]+cn[1])?Tsum/(cn[0]+cn[1]):p.T;}
  if(eff){st.escT+=dt;for(const f of st.fly){f.x+=f.vx*SC*dt;f.y+=f.vy*SC*dt*0.5;}st.fly=st.fly.filter(f=>f.x<810&&f.y>-10&&f.y<460);}
  // speed samples for the histogram (last 1.5 s)
  st.hT+=dt;if(st.hT>=0.05){st.hT=0;const arr=[];const ms=st.mol;const stepI=eff?EFF_EVERY/5:1;for(let i=0;i<ms.length;i+=stepI){const m=ms[i];arr.push([m.s,Math.hypot(m.vx,m.vy,m.vz)]);}st.hist.push(arr);if(st.hist.length>30)st.hist.shift();}
  // smoothed stats
  const stats=statsOf(sim);for(const k in stats){const v=stats[k];st.ema[k]=st.ema[k]===undefined||!Number.isFinite(st.ema[k])?v:st.ema[k]+(v-st.ema[k])*Math.min(1,dt/0.7);}}
/* turn the two velocity components along a wall by a random angle (keeps speed and the bounce; lets energy share among x, y, z) */
function spin(m,ax){const a=Math.random()*6.2832,c=Math.cos(a),sn=Math.sin(a);if(ax==='x'){const u=m.vy,w=m.vz;m.vy=u*c-w*sn;m.vz=u*sn+w*c;}else{const u=m.vx,w=m.vz;m.vx=u*c-w*sn;m.vz=u*sn+w*c;}}
function collide(sim){const p=sim.p,ms=sim.st.mol;ms.sort((a,b)=>a.x-b.x);
  for(let i=0;i<ms.length;i++){const a=ms[i],ga=gasOfMol(p,a.s);for(let j=i+1;j<ms.length;j++){const b=ms[j];const gb=gasOfMol(p,b.s),d=ga.r+gb.r;const dx=b.x-a.x;if(dx>d)break;const dy=b.y-a.y,r2=dx*dx+dy*dy;if(r2>=d*d||r2<1e-6)continue;
    const r=Math.sqrt(r2),ux=dx/r,uy=dy/r;const rvx=a.vx-b.vx,rvy=a.vy-b.vy,rvz=a.vz-b.vz;if(rvx*ux+rvy*uy<=0)continue; // separating already
    let sz=(Math.random()*2-1)*0.7,c=Math.sqrt(1-sz*sz);let nx=ux*c,ny=uy*c,nz=sz;let vn=rvx*nx+rvy*ny+rvz*nz;if(vn<=0){nz=-nz;vn=rvx*nx+rvy*ny+rvz*nz;if(vn<=0)continue;}
    const m1=ga.M,m2=gb.M,J=2*vn/(m1+m2);a.vx-=J*m2*nx;a.vy-=J*m2*ny;a.vz-=J*m2*nz;b.vx+=J*m1*nx;b.vy+=J*m1*ny;b.vz+=J*m1*nz;
    const push=(d-r)/2+0.05;a.x-=ux*push;a.y-=uy*push;b.x+=ux*push;b.y+=uy*push;}}}
function statsOf(sim){const p=sim.p,st=sim.st,o={};for(let s=0;s<2;s++){let n=0,sv=0,sv2=0;for(const m of st.mol){if(m.s!==s)continue;const v2=m.vx*m.vx+m.vy*m.vy+m.vz*m.vz;n++;sv+=Math.sqrt(v2);sv2+=v2;}
    const g=gasOfMol(p,s);o['n'+s]=n;o['v'+s]=n?sv/n:NaN;o['rms'+s]=n?Math.sqrt(sv2/n):NaN;o['ke'+s]=n&&g?0.5*g.M/1000*sv2/n/1000:NaN;}return o;}
function stepRace(sim,dt){const p=sim.p,st=sim.st,P=PAIR[p.pair]||PAIR.hcl,r=st.race;r.t+=dt;
  if(!r.met){const da=RACE_K/Math.sqrt(P.Mb)*r.t,db=RACE_K/Math.sqrt(P.Ma)*r.t;if(da+db>=100){r.met=true;r.xm=100*(1/Math.sqrt(P.Mb))/(1/Math.sqrt(P.Mb)+1/Math.sqrt(P.Ma));r.tm=100/(RACE_K*(1/Math.sqrt(P.Mb)+1/Math.sqrt(P.Ma)));}}
  if(r.met)r.dep=Math.min(1,r.dep+dt/6);
  for(const q of st.rp){q.ph+=dt*(3+q.u*2);}}
function raceD(st,p){const P=PAIR[p.pair]||PAIR.hcl,r=st.race;if(r.met)return [r.xm,100-r.xm];return [RACE_K/Math.sqrt(P.Mb)*r.t,RACE_K/Math.sqrt(P.Ma)*r.t];}

/* ---------- show only what the current mode uses ---------- */
function sync(sim){if(!sim.ui||!sim.ui.sec)return;const d=sim.def,p=sim.p;const vis=o=>atLeast(o.lvl)&&(!o.modes||o.modes.includes(p.mode))&&(!o.when||o.when(p));
  d.controls.forEach(c=>{const cid=d.id+'-'+c.id,e=document.getElementById(cid)||document.getElementById(cid+'-l');if(!e)return;const w=e.closest('.ctl');if(w)w.hidden=!vis(c);});
  d.metrics.forEach(m=>{const t=sim.ui.tiles[m.id];if(!t)return;const w=t.num.closest('.tile');if(w)w.hidden=!vis(m);});
  const btns=[...sim.ui.sec.querySelectorAll('.actions button')];(d.actions||[]).forEach((a,i)=>{if(btns[i])btns[i].hidden=!vis(a);});}
const E=(sim,k)=>{const v=sim.st&&sim.st.ema[k];return Number.isFinite(v)?v:NaN;};
const PofS=(sim,s)=>{const n=E(sim,'n'+s),ke=E(sim,'ke'+s);return n?n*MOL_PER*(2/3)*ke*1000/(R)*0.082057/V_BOX:NaN;};

const SIM={
  id:'kmt',hash:'kmt',apUnit:9,order:2,tab:'Kinetic molecular theory',kind:'Simulation',
  prereq:['gaslaws'],next:['states','gasstoich','imf'],
  card:'Watch molecule speeds spread into the Maxwell–Boltzmann curve, race NH₃ against HCl down a tube, and test Graham’s law.',
  title:'Kinetic molecular theory: molecular speed and energy',
  lede:{bio:'Gas molecules never stop moving. Heat them and they speed up; make them heavier and they slow down. See why, at the same temperature, every gas has the same average energy of motion.',
        honors:'Build the speed distribution from real molecules, mix two gases to test Dalton’s law of partial pressures, and measure Graham’s law with effusion and the NH₃ + HCl diffusion race.',
        ap:'Compare the measured distribution with Maxwell–Boltzmann theory, calculate u_rms = √(3RT/M), and connect average kinetic energy to temperature: KE_avg = (3/2)RT per mole.'},
  scale:'Speeds box: 24.6 L of gas, each dot standing for 0.01 mol. Speeds are real (N₂ at 300 K averages about 476 m/s) but drawn about 4 billion times slower. Diffusion tube: 100 cm long, 30× faster than real time.',
  timeScale:1,dtMax:0.02,prewarm:1.5,sampleDt:0.1,window:30,unit:'s',chChange:2,chReveal:8,
  controls:[
    {id:'mode',label:'Experiment',type:'seg',def:'dist',lvl:'bio',options:[{v:'dist',l:'Speeds in a box'},{v:'race',l:'Diffusion race'},{v:'effuse',l:'Pinhole effusion',lvl:'honors'}],onChange(sim){if(sim.p.mode==='effuse'&&sim.p.gasB==='none')BioLab.setValues(sim,{gasB:'He'});sync(sim);}},
    {id:'gasA',label:'Gas',type:'select',def:'N2',lvl:'bio',modes:['dist','effuse'],options:GOPT},
    {id:'T',label:'Temperature',type:'range',min:100,max:1000,step:10,def:300,unit:' K',lvl:'bio',modes:['dist','effuse'],help:'K = °C + 273'},
    {id:'gasB',label:'Second gas (mixture)',type:'select',def:'none',lvl:'honors',modes:['dist','effuse'],options:[{v:'none',l:'None'}].concat(GOPT),onChange(sim){sync(sim);}},
    {id:'nA',label:'Molecules of the first gas',type:'range',min:20,max:150,step:10,def:100,unit:'',lvl:'honors',modes:['dist']},
    {id:'nB',label:'Molecules of the second gas',type:'range',min:10,max:100,step:10,def:50,unit:'',lvl:'honors',modes:['dist'],when:p=>p.gasB!=='none'},
    {id:'coll',label:'Molecules collide with each other',type:'toggle',def:true,lvl:'honors',modes:['dist'],help:'Turn off and start them at one speed: without collisions the speeds never spread out.'},
    {id:'pair',label:'Gases in the tube',type:'seg',def:'hcl',lvl:'bio',modes:['race'],options:[{v:'hcl',l:'NH₃ + HCl'},{v:'hbr',l:'NH₃ + HBr',lvl:'honors'},{v:'mea',l:'CH₃NH₂ + HCl',lvl:'honors'}],onChange(sim){sim.st&&(sim.st.race={t:0,met:false,xm:0,tm:0,dep:0});}}
  ],
  actions:[
    {id:'same',label:'Start every molecule at the same speed',lvl:'bio',modes:['dist'],run(sim){ensure(sim);const p=sim.p;sim.st.mol.forEach(m=>{const g=gasOfMol(p,m.s),v=vrmsT(g.M,p.T);const z=Math.random()*2-1,a=Math.random()*6.2832,c=Math.sqrt(1-z*z);m.vx=v*c*Math.cos(a);m.vy=v*c*Math.sin(a);m.vz=v*z;});sim.st.hist=[];sim.st.ema={};}},
    {id:'restart',label:'Restart',lvl:'bio',modes:['race','effuse'],run(sim){ensure(sim);const st=sim.st;st.race={t:0,met:false,xm:0,tm:0,dep:0};st.esc=[0,0];st.escT=0;st.fly=[];}}
  ],
  init(sim){return build(sim.p);},
  step:stepK,
  afterPrewarm(sim){const st=sim.st;st.esc=[0,0];st.escT=0;st.fly=[];st.race={t:0,met:false,xm:0,tm:0,dep:0};},
  metrics:[
    {id:'TK',label:'Temperature',unit:'K',lvl:'bio',min:0,max:1000,d:0,modes:['dist','effuse'],get:s=>s.p.mode==='race'?NaN:s.st.T},
    {id:'vA',label:'Average speed, first gas',unit:'m/s',lvl:'bio',min:0,max:null,d:0,modes:['dist','effuse'],get:s=>s.p.mode==='race'?NaN:E(s,'v0')},
    {id:'keA',label:'Average kinetic energy, first gas',unit:'kJ/mol',lvl:'bio',min:0,max:15,d:2,modes:['dist','effuse'],get:s=>s.p.mode==='race'?NaN:E(s,'ke0')},
    {id:'vB',label:'Average speed, second gas',unit:'m/s',lvl:'honors',min:0,max:null,d:0,modes:['dist','effuse'],when:hasB,get:s=>hasB(s.p)?E(s,'v1'):NaN},
    {id:'keB',label:'Average kinetic energy, second gas',unit:'kJ/mol',lvl:'honors',min:0,max:15,d:2,modes:['dist','effuse'],when:hasB,get:s=>hasB(s.p)?E(s,'ke1'):NaN},
    {id:'PA',label:'Partial pressure, first gas',unit:'atm',lvl:'honors',min:0,max:null,d:3,modes:['dist'],get:s=>s.p.mode==='dist'?PofS(s,0):NaN},
    {id:'PB',label:'Partial pressure, second gas',unit:'atm',lvl:'honors',min:0,max:null,d:3,modes:['dist'],when:hasB,get:s=>s.p.mode==='dist'&&hasB(s.p)?PofS(s,1):NaN},
    {id:'Pt',label:'Total pressure',unit:'atm',lvl:'honors',min:0,max:null,d:3,modes:['dist'],get:s=>s.p.mode!=='dist'?NaN:PofS(s,0)+(hasB(s.p)?PofS(s,1):0)},
    {id:'xA',label:'Mole fraction of the first gas',unit:'',lvl:'honors',min:0,max:1,d:3,modes:['dist'],when:hasB,get:s=>{if(s.p.mode!=='dist')return NaN;const a=E(s,'n0'),b=hasB(s.p)?E(s,'n1'):0;return a/(a+b);}},
    {id:'rmsA',label:'rms speed, first gas (measured)',unit:'m/s',lvl:'ap',min:0,max:null,d:0,modes:['dist','effuse'],get:s=>s.p.mode==='race'?NaN:E(s,'rms0')},
    {id:'rmsT',label:'u_rms = √(3RT/M), first gas',unit:'m/s',lvl:'ap',min:0,max:null,d:0,modes:['dist','effuse'],get:s=>s.p.mode==='race'?NaN:vrmsT(gA(s.p).M,s.p.T)},
    {id:'vmp',label:'Most probable speed √(2RT/M)',unit:'m/s',lvl:'ap',min:0,max:null,d:0,modes:['dist','effuse'],noTrial:true,get:s=>s.p.mode==='race'?NaN:vmpT(gA(s.p).M,s.p.T)},
    {id:'keJ',label:'Average KE per molecule, (3/2)kT',unit:'',lvl:'ap',text:true,modes:['dist','effuse'],get:s=>CL.sci(1.5*1.380649e-23*s.p.T,'J',3)},
    {id:'rA',label:'Escape rate, first gas',unit:'per s',lvl:'honors',min:0,max:null,d:1,modes:['effuse'],get:s=>s.p.mode==='effuse'&&s.st.escT>0.5?s.st.esc[0]/s.st.escT:NaN},
    {id:'rB',label:'Escape rate, second gas',unit:'per s',lvl:'honors',min:0,max:null,d:1,modes:['effuse'],when:hasB,get:s=>s.p.mode==='effuse'&&hasB(s.p)&&s.st.escT>0.5?s.st.esc[1]/s.st.escT:NaN},
    {id:'rat',label:'Measured rate ratio (first ÷ second)',unit:'',lvl:'honors',min:0,max:null,d:2,modes:['effuse'],when:hasB,get:s=>s.p.mode==='effuse'&&hasB(s.p)&&s.st.esc[1]>0?s.st.esc[0]/s.st.esc[1]:NaN},
    {id:'grE',label:'Graham’s law: √(M second ÷ M first)',unit:'',lvl:'honors',min:0,max:null,d:2,modes:['effuse'],when:hasB,get:s=>hasB(s.p)?Math.sqrt(gB(s.p).M/gA(s.p).M):NaN},
    {id:'dA',label:'Distance the base traveled (left)',unit:'cm',lvl:'bio',min:0,max:100,d:1,modes:['race'],get:s=>s.p.mode==='race'?raceD(s.st,s.p)[0]:NaN},
    {id:'dB',label:'Distance the acid traveled (right)',unit:'cm',lvl:'bio',min:0,max:100,d:1,modes:['race'],get:s=>s.p.mode==='race'?raceD(s.st,s.p)[1]:NaN},
    {id:'dr',label:'Distance ratio (base ÷ acid)',unit:'',lvl:'honors',min:0,max:3,d:2,modes:['race'],get:s=>{if(s.p.mode!=='race')return NaN;const d=raceD(s.st,s.p);return d[1]>0.5?d[0]/d[1]:NaN;}},
    {id:'grR',label:'Graham’s law: √(M acid ÷ M base)',unit:'',lvl:'honors',min:0,max:3,d:2,modes:['race'],get:s=>{const P=PAIR[s.p.pair]||PAIR.hcl;return s.p.mode==='race'?Math.sqrt(P.Ma/P.Mb):NaN;}},
    {id:'lt',label:'Lab time',unit:'min',lvl:'bio',min:0,max:null,d:1,modes:['race'],get:s=>s.p.mode==='race'?s.st.race.t*LABX/60:NaN}
  ],
  graphs:[{id:'hist',label:'Speed distribution',lvl:'bio',custom:true},{id:'bars',label:'Average speed vs energy',lvl:'bio',custom:true},
    {id:'vline',label:'Average speed over time',lvl:'bio',lines:['vA']},{id:'race',label:'Diffusion race distances',lvl:'bio',custom:true}],
  defaultGraph:'hist',
  plot(sim,ctx,box,id){plotK(sim,ctx,box,id);},
  narrate(sim){ensure(sim);return narrK(sim);},
  tour:[
    {title:'Molecules in constant motion',text:'Each dot is a gas molecule flying in a straight line until it hits a wall or another molecule. Nothing pushes them; they keep moving on their own. That is the first idea of kinetic molecular theory.',focus:[BOXD.x0,BOXD.y0,BOXD.x1-BOXD.x0,BOXD.y1-BOXD.y0],speed:0.4,setup(sim){BioLab.setValues(sim,{mode:'dist',gasA:'N2',gasB:'none',T:300,nA:100,coll:true});}},
    {title:'Not all the same speed',text:{bio:'At any moment some molecules are slow and some are fast. The graph on the right counts how many have each speed. Most are near the middle, with a long tail of fast ones.',ap:'The bars come from the molecules in the box; the dashed curve is the Maxwell–Boltzmann distribution for N₂ at 300 K. The peak is the most probable speed, √(2RT/M) = 422 m/s.'},focus:[520,36,272,230],speed:0.4},
    {title:'Collisions share the energy',text:'Start every molecule at exactly the same speed. Collisions quickly trade energy between molecules, and the spike spreads back into the same curve. The average energy never changes.',focus:[[BOXD.x0,BOXD.y0,BOXD.x1-BOXD.x0,BOXD.y1-BOXD.y0],[520,36,272,230]],speed:0.25,setup(sim){sim.def.actions[0].run(sim);}},
    {title:'Hotter means faster',text:{bio:'Raise the temperature to 900 K. The molecules speed up and the curve stretches toward higher speeds. Temperature measures the average kinetic energy of the molecules.',honors:'Average kinetic energy is proportional to kelvin temperature. Tripling T from 300 K to 900 K triples the average KE, so the average speed grows by √3 = 1.73×.'},focus:[[BOXD.x0,BOXD.y0,BOXD.x1-BOXD.x0,BOXD.y1-BOXD.y0],[520,36,272,230]],speed:0.4,setup(sim){BioLab.setValues(sim,{T:900});}},
    {title:'Heavy and light, same energy',text:'Now helium and xenon share the box at 300 K. Helium atoms are 33× lighter, so they zip around about 5.7× faster. Look at the bars: their average kinetic energies are the same. At one temperature, every gas has the same average KE.',focus:[520,250,272,196],speed:0.4,setup(sim){BioLab.setValues(sim,{T:300,gasA:'He',gasB:'Xe',nA:70,nB:70});}},
    {title:'The diffusion race',text:'Cotton soaked in ammonia sits at the left end of a 100 cm tube and cotton with hydrochloric acid at the right. The gases drift toward each other. Where they meet, they react: NH₃(g) + HCl(g) → NH₄Cl(s), a white ring. Lighter NH₃ moves faster, so the ring forms nearer the HCl end.',focus:[30,100,740,240],speed:1,setup(sim){BioLab.setValues(sim,{mode:'race',pair:'hcl'});}},
    {lvl:'honors',title:'Effusion through a pinhole',text:'Molecules escape through a small hole only when they happen to hit it. Faster molecules hit it more often, so the rate of effusion is inversely proportional to √M (Graham’s law). Helium escapes about 2.6× faster than N₂.',focus:[[BOXE.x1-30,HOLE.y0-20,60,HOLE.y1-HOLE.y0+40],[500,36,295,140]],speed:0.5,setup(sim){BioLab.setValues(sim,{mode:'effuse',gasA:'He',gasB:'N2',T:300});}},
    {lvl:'ap',title:'Speeds from the equation',text:'u_rms = √(3RT/M) with R = 8.314 J/(mol·K) and M in kg/mol. For N₂ at 300 K: √(3 × 8.314 × 300 / 0.02801) = 517 m/s. Compare the measured rms speed tile with the formula.',focus:[BOXD.x0,BOXD.y0,BOXD.x1-BOXD.x0,BOXD.y1-BOXD.y0],speed:0.4,setup(sim){BioLab.setValues(sim,{mode:'dist',gasA:'N2',gasB:'none',T:300});}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{mode:'dist',gasA:'N2',gasB:'none',T:300,nA:100,nB:50,coll:true,pair:'hcl'});},
  challenges(sim){return CH;},
  onLevel(sim){sync(sim);},
  lab:{bio:'<p><b>Question:</b> How does temperature change how fast gas molecules move?</p><ol><li>Use Speeds in a box with nitrogen.</li><li>Set the temperature to 200, 400, 600, 800 and 1000 K. At each one, wait 3 seconds and press Record trial.</li><li>Use the Trials graph: Temperature on x, Average speed on y.</li></ol><p>Does doubling the temperature double the speed? Then plot Average kinetic energy against temperature. Which graph is a straight line?</p>',
       honors:'<p><b>Question:</b> Does Graham’s law predict how fast gases spread out?</p><ol><li>Run the Diffusion race with NH₃ + HCl. Record the distance each gas traveled when the ring forms.</li><li>Repeat with NH₃ + HBr and CH₃NH₂ + HCl.</li><li>In Pinhole effusion, run He vs N₂ for at least 30 s and record the escape rates.</li></ol><p>Compare each measured ratio with √(M₂/M₁) and calculate the percent difference.</p>',
       ap:'<p><b>Question:</b> How do molar mass and temperature shape the Maxwell–Boltzmann distribution?</p><ol><li>For He, N₂ and Xe at 300 K, record the measured rms speed and the u_rms formula value.</li><li>For N₂, record trials at 150, 300, 600 and 900 K.</li><li>Sketch each distribution from the Speed distribution graph.</li></ol><p><b>Claim–evidence–reasoning:</b> Explain why all three gases have the same average kinetic energy at 300 K but different speed distributions, and why the curve flattens as T rises.</p>'},
  terms:[{t:'Kinetic molecular theory (KMT)',d:'A model of gases: tiny particles in constant, random, straight-line motion, with elastic collisions and negligible size and attractions.'},{t:'Kinetic energy',d:'Energy of motion, KE = ½mv². Heavier or faster particles have more.'},
    {t:'Temperature',d:'A measure of the average kinetic energy of the particles. In kelvin, it is directly proportional to the average KE.'},{t:'Diffusion',d:'The spreading of one gas through another, from high concentration to low.'},
    {lvl:'honors',t:'Effusion',d:'Gas escaping through a tiny hole into empty space.'},{lvl:'honors',t:'Graham’s law',d:'Rate₁/Rate₂ = √(M₂/M₁): lighter gases effuse and diffuse faster.'},
    {lvl:'honors',t:'Dalton’s law of partial pressures',d:'P_total = P₁ + P₂ + …, and each gas’s partial pressure is its mole fraction times the total.'},{lvl:'honors',t:'Mole fraction (χ)',d:'Moles of one gas ÷ total moles of gas.'},
    {lvl:'ap',t:'Maxwell–Boltzmann distribution',d:'The spread of molecular speeds in a gas at one temperature. It shifts right and flattens as T rises or M falls.'},{lvl:'ap',t:'Root-mean-square speed',d:'u_rms = √(3RT/M), with M in kg/mol.'},{lvl:'ap',t:'Average kinetic energy',d:'KE_avg = (3/2)RT per mole, or (3/2)kT per molecule, the same for every gas at a given T.'}],
  about:'<p><b>Speeds box.</b> Every molecule has a real 3D velocity in m/s; you see its side view, drawn at 0.25 pixels per (m/s) per second, so N₂ at 300 K drifts about 120 px each second. When two dots touch they collide as hard spheres, with the collision direction tilted randomly out of the screen (the dots are really at different depths). These collisions conserve energy and momentum and spread any starting speeds into the Maxwell–Boltzmann distribution, which the dashed curve shows: f(v) = 4π(M/2πRT)^{3/2} v² e^{−Mv²/2RT}. The walls act as a gentle thermostat (0.4 s) that holds each gas’s average kinetic energy at (3/2)RT. The histogram averages the last 1.5 s of speeds. Partial pressures come from the kinetic-theory result P = (2/3)(N/V)·KE_avg for a 24.6 L box where each dot is 0.01 mol.</p><p><b>Pinhole effusion.</b> Molecules do not collide with each other (real effusion needs a hole smaller than the distance between collisions). Every molecule that reaches the hole escapes and is counted, and an identical molecule enters from a reservoir on the left, so the gas never runs out and its speed distribution stays the same. 25 molecules move for each dot drawn, so the escape counts include molecules you cannot see. The measured rate ratio approaches √(M₂/M₁) as the counts grow.</p><p><b>Diffusion race.</b> Each gas front advances at a speed proportional to 1/√M, so the ring lands where Graham’s law puts it. In real tubes the gases diffuse through air and the ring often forms a little closer to the middle (measured ratios of about 1.2–1.4 for NH₃/HCl). Time runs 30× faster than a real 100 cm tube.</p>',
  initVis(sim){},
  draw(sim,ctx,vdt,k,t){ensure(sim);drawK(sim,ctx,vdt,k,t);},
  thumbFrames:30
};

/* ---------- challenges ---------- */
const CH=[
  {lvl:'bio',q:'Helium and xenon are mixed at the same temperature. Xenon atoms are 33 times heavier. Which have more kinetic energy on average?',choices:['Xenon, because the atoms are heavier','Helium, because the atoms are faster','Neither: their average kinetic energies are the same'],correct:2,
   baseline:{mode:'dist',gasA:'He',gasB:'Xe',nA:70,nB:70,T:300,coll:true},changeText:'Watch the energy bars on the right',watch:'bars',
   explain:{bio:'Both bars settle at the same height, about 3.74 kJ/mol at 300 K. Helium is light but fast; xenon is heavy but slow. Temperature sets the average kinetic energy, no matter which gas it is.',ap:'KE_avg = (3/2)RT = 1.5 × 8.314 × 300 = 3.74 kJ/mol for every gas. Speed depends on mass: u_rms(He)/u_rms(Xe) = √(131.29/4.003) = 5.73.'}},
  {lvl:'bio',q:'Nitrogen is at 250 K. You heat it to 1000 K, four times the kelvin temperature. What happens to the average speed?',choices:['It doubles','It becomes four times faster','It stays the same'],correct:0,
   baseline:{mode:'dist',gasA:'N2',gasB:'none',nA:100,T:250},change:{T:1000},changeText:'Heated from 250 K to 1000 K',watch:'vline',
   explain:{bio:'Four times the temperature means four times the kinetic energy. Kinetic energy grows with speed squared, so the speed only doubles: about 434 m/s became about 868 m/s.',ap:'u ∝ √T, so √(1000/250) = 2. KE = ½mv² quadruples while v doubles.'}},
  {lvl:'bio',q:'Ammonia (NH₃, 17 g/mol) starts at the left end of the tube and hydrogen chloride (HCl, 36 g/mol) at the right. Where does the white ring of NH₄Cl form?',choices:['In the middle','Nearer the HCl end','Nearer the NH₃ end'],correct:1,
   baseline:{mode:'race',pair:'hcl'},at:0.2,reveal:19,changeText:'Both cotton plugs are in. The gases are racing',watch:'race',
   explain:{bio:'Lighter NH₃ molecules move faster, so ammonia covers more of the tube before the gases meet. The ring forms about 59 cm from the NH₃ end, closer to the HCl.',honors:'Graham’s law: d(NH₃)/d(HCl) = √(36.46/17.03) = 1.46, so the ring sits at 100 × 1.46/2.46 = 59.4 cm from the NH₃ end.'}},
  {lvl:'honors',q:'Every molecule starts at exactly the same speed, and they collide with each other. What happens over the next few seconds?',choices:['They stay at the same speed, because collisions are elastic','The speeds spread out into a range of slow and fast, but the average energy stays the same','They all slow down, because collisions waste energy'],correct:1,
   baseline:{mode:'dist',gasA:'N2',gasB:'none',nA:150,T:300,coll:true},baselineAction:'same',at:0.1,changeText:'All molecules started at 517 m/s',watch:'hist',
   explain:{honors:'Elastic means the total energy is conserved, not each molecule’s. In each collision one molecule usually gains energy and the other loses it, so the spike spreads into the Maxwell–Boltzmann curve within a few seconds while the average KE stays at 3.74 kJ/mol.'}},
  {lvl:'honors',q:'Helium and nitrogen leak out of the box through the same pinhole. About how many times faster does helium escape?',choices:['About 7 times (28 ÷ 4)','About 2.6 times (√(28 ÷ 4))','The same rate, because the temperature is the same'],correct:1,
   baseline:{mode:'effuse',gasA:'He',gasB:'N2',T:300},at:0.1,reveal:22,changeText:'Counting the molecules that escape',watch:'bars',
   explain:{honors:'Effusion rate ∝ 1/√M: Rate(He)/Rate(N₂) = √(28.01/4.003) = 2.65. Check the measured ratio tile: it lands close to 2.6 and gets closer the longer you count.'}},
  {lvl:'honors',q:'The box holds 100 dots of N₂ and 50 dots of He at 300 K. What share of the total pressure comes from the helium?',choices:['Almost none, because helium atoms are so light','One third, because one third of the molecules are helium','One half, because there are two gases'],correct:1,
   baseline:{mode:'dist',gasA:'N2',gasB:'He',nA:100,nB:50,T:300},changeText:'Compare the partial pressure tiles',watch:'bars',
   explain:{honors:'Each molecule pushes on the walls with the same average kinetic energy, light or heavy. So partial pressure depends only on the number of molecules: χ(He) = 50/150 = 1/3. Dalton’s law: P(He) = ⅓ × P_total, about 0.50 of 1.50 atm.'}},
  {lvl:'ap',q:'What is the rms speed of N₂ molecules (28.0 g/mol) at 300 K?',choices:['16.3 m/s','517 m/s','16 300 m/s'],correct:1,instant:true,
   explain:{ap:'u_rms = √(3RT/M) = √(3 × 8.314 J/(mol·K) × 300 K ÷ 0.0280 kg/mol) = 517 m/s. 16.3 m/s comes from using M in g/mol; R in J needs kg. The rms speed tile in the box confirms about 517 m/s.'}},
  {lvl:'ap',q:'At 300 K you replace xenon with helium. How does the speed distribution change?',choices:['It shifts to higher speeds and spreads out wider, with a lower peak','It shifts to higher speeds but keeps the same shape and height','Nothing changes, because the temperature is the same'],correct:0,
   baseline:{mode:'dist',gasA:'Xe',gasB:'none',nA:120,T:300},change:{gasA:'He'},changeText:'Xenon replaced by helium',watch:'hist',
   explain:{ap:'The most probable speed √(2RT/M) rises from 195 to 1116 m/s. The area under the curve is still the number of molecules, so a wider curve must be lower. Same T, same average KE, very different speeds.'}},
  {lvl:'ap',q:'Replace HCl with HBr (80.9 g/mol). Where does the white NH₄Br ring form, measured from the NH₃ end of the 100 cm tube?',choices:['About 59 cm','About 69 cm','About 50 cm'],correct:1,
   baseline:{mode:'race',pair:'hbr'},at:0.2,reveal:19,changeText:'NH₃ racing HBr',watch:'race',
   explain:{ap:'d(NH₃)/d(HBr) = √(80.91/17.03) = 2.18, so the ring is at 100 × 2.18/3.18 = 68.6 cm. A heavier acid gas moves the ring even closer to its own end.'}}
];

/* ---------- narration ---------- */
function narrK(sim){const p=sim.p,st=sim.st,hon=atLeast('honors'),ap=atLeast('ap');
  if(p.mode==='race'){const P=PAIR[p.pair]||PAIR.hcl,r=st.race,d=raceD(st,p);
    if(!r.met)return 'Molecules of '+P.b+' (left) and '+P.a+' (right) drift toward each other. '+P.b+' is lighter ('+P.Mb.toFixed(1)+' vs '+P.Ma.toFixed(1)+' g/mol), so it moves faster: <b>'+d[0].toFixed(0)+' cm</b> against '+d[1].toFixed(0)+' cm so far.';
    return 'The gases met and reacted: '+P.b+'(g) + '+P.a+'(g) → '+P.s+'(s). The white ring sits <b>'+r.xm.toFixed(1)+' cm from the '+P.b+' end</b>, closer to the heavier '+P.a+'.'+(hon?' Ratio '+(r.xm/(100-r.xm)).toFixed(2)+' = √('+P.Ma.toFixed(2)+' ÷ '+P.Mb.toFixed(2)+').':'');}
  const a=gA(p),b=hasB(p)?gB(p):null,vA=E(sim,'v0'),vB=E(sim,'v1'),kA=E(sim,'ke0'),kB=E(sim,'ke1');
  if(p.mode==='effuse'){if(!b)return 'Pick a second gas to race it through the pinhole.';const ra=st.escT>0.5?st.esc[0]/st.escT:0,rb=st.escT>0.5?st.esc[1]/st.escT:0;
    return (a.M<b.M?a.f+' is lighter, so its molecules move faster and hit the hole more often.':a.M>b.M?b.f+' is lighter, so its molecules move faster and hit the hole more often.':'Both gases have the same molar mass, so they escape at the same rate.')+' Escape rates so far: '+ra.toFixed(1)+' vs '+rb.toFixed(1)+' per second'+(rb>0?', a ratio of <b>'+(ra/rb).toFixed(2)+'</b> (Graham predicts '+Math.sqrt(b.M/a.M).toFixed(2)+').':'.');}
  // spread check
  const sp=spread(sim);
  if(sp<0.25)return 'Every molecule is moving at nearly the same speed right now. '+(p.coll?'Watch the collisions trade energy: the spike will spread into a curve.':'<b>Collisions are off</b>, so nothing can trade energy and the speeds stay bunched together.');
  let s;
  if(b)s=a.f+' molecules average '+Math.round(vA)+' m/s and '+b.f+' molecules average '+Math.round(vB)+' m/s, yet their <b>average kinetic energies match</b> ('+kA.toFixed(2)+' vs '+kB.toFixed(2)+' kJ/mol), because they share one temperature.';
  else s='At '+Math.round(st.T)+' K, '+a.f+' molecules average <b>'+Math.round(vA)+' m/s</b>, but each one speeds up and slows down as it collides. '+(st.T>600?'Hot molecules have more kinetic energy, so the curve stretches to the right.':st.T<200?'Cold molecules have less kinetic energy, so the curve bunches up at low speeds.':'The curve shows how many molecules have each speed.');
  if(ap&&!b)s+=' Measured u_rms = '+Math.round(E(sim,'rms0'))+' m/s; √(3RT/M) = '+Math.round(vrmsT(a.M,p.T))+' m/s.';
  return s;}
function spread(sim){const h=sim.st.hist;if(!h.length)return 1;const last=h[h.length-1].map(q=>q[1]);if(last.length<3)return 1;const m=last.reduce((a,b)=>a+b,0)/last.length;const sd=Math.sqrt(last.reduce((a,b)=>a+(b-m)*(b-m),0)/last.length);return sd/m;}

/* ---------- drawing ---------- */
function drawMol(ctx,x,y,g,ang){const r=g.r;ctx.lineWidth=1;ctx.strokeStyle='rgba(0,0,0,.35)';
  if(g.di){const dx=Math.cos(ang)*r*0.55,dy=Math.sin(ang)*r*0.55;ctx.fillStyle=g.c;[-1,1].forEach(s=>{ctx.beginPath();ctx.arc(x+s*dx,y+s*dy,r*0.68,0,6.2832);ctx.fill();ctx.stroke();});return;}
  if(g.tri){const dx=Math.cos(ang)*r*0.75,dy=Math.sin(ang)*r*0.75;ctx.fillStyle=g.c;[-1,1].forEach(s=>{ctx.beginPath();ctx.arc(x+s*dx,y+s*dy,r*0.5,0,6.2832);ctx.fill();ctx.stroke();});ctx.fillStyle='#424242';ctx.beginPath();ctx.arc(x,y,r*0.5,0,6.2832);ctx.fill();ctx.stroke();return;}
  ctx.fillStyle=g.c;ctx.beginPath();ctx.arc(x,y,r,0,6.2832);ctx.fill();ctx.stroke();}
function histData(sim,nb,vmax){const p=sim.p,st=sim.st,h=[new Array(nb).fill(0),new Array(nb).fill(0)],cnt=[0,0];
  st.hist.forEach(fr=>fr.forEach(([s,v])=>{const i=Math.floor(v/vmax*nb);if(i>=0&&i<nb)h[s][i]++;cnt[s]++;}));const n=Math.max(1,st.hist.length);
  return {h:h.map(a=>a.map(c=>c/n)),per:[cnt[0]/n,cnt[1]/n]};}
function vMaxFor(p){const a=gA(p),b=hasB(p)?gB(p):null;const f=Math.max(vrmsT(a.M,p.T),b?vrmsT(b.M,p.T):0);const raw=f*2.4;const st=[500,1000,1500,2000,3000,4000,5000,6000];return st.find(x=>x>=raw)||6000;}
function miniHist(sim,ctx,x,y,w,h,k,compact){const p=sim.p,nb=24,vmax=vMaxFor(p),D=histData(sim,nb,vmax),bw=w/nb,gs=[gA(p),hasB(p)?gB(p):null];
  let ymax=0;for(let s=0;s<2;s++){if(!gs[s])continue;D.h[s].forEach(c=>ymax=Math.max(ymax,c));for(let i=0;i<60;i++){const v=(i+0.5)/60*vmax;ymax=Math.max(ymax,D.per[s]*mb(v,gs[s].M,p.T)*vmax/nb);}}ymax=Math.max(ymax*1.12,1);
  ctx.fillStyle=PAL['card'];ctx.fillRect(x,y,w,h);ctx.strokeStyle=PAL['line'];ctx.strokeRect(x,y,w,h);
  for(let s=0;s<2;s++){if(!gs[s])continue;ctx.fillStyle=gs[s].c;ctx.globalAlpha=0.55;D.h[s].forEach((c,i)=>{const bh=c/ymax*h;ctx.fillRect(x+i*bw+1,y+h-bh,bw-2,bh);});ctx.globalAlpha=1;}
  for(let s=0;s<2;s++){if(!gs[s])continue;ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2;ctx.setLineDash([5,4]);ctx.beginPath();for(let i=0;i<=80;i++){const v=i/80*vmax,yy=y+h-D.per[s]*mb(v,gs[s].M,p.T)*vmax/nb/ymax*h;i?ctx.lineTo(x+i/80*w,yy):ctx.moveTo(x,yy);}ctx.stroke();ctx.setLineDash([]);}
  txt(ctx,'0',x,y+h+16*k,{s:12*k,c:PAL['cv-soft']});txt(ctx,vmax+' m/s',x+w,y+h+16*k,{s:12*k,c:PAL['cv-soft'],a:'right'});
  if(!compact)txt(ctx,vmax/2+'',x+w/2,y+h+16*k,{s:12*k,c:PAL['cv-soft'],a:'center'});
  txt(ctx,compact?'Speeds':'How many have each speed',x,y-8,{s:12.5*k,w:700,c:PAL['cv-ink']});}
function energyBars(sim,ctx,x,y,w,h,k,compact){const p=sim.p,gs=[gA(p),hasB(p)?gB(p):null],vmax=vMaxFor(p),kmax=1.5*R*1000/1000*1.15;
  const groups=[{l:compact?'speed':'Avg speed',v:[E(sim,'v0'),E(sim,'v1')],mx:vmax*0.6,f:v=>Math.round(v)+''},{l:compact?'energy':'Avg energy',v:[E(sim,'ke0'),E(sim,'ke1')],mx:kmax,f:v=>v.toFixed(1)}];
  const gw=w/2;groups.forEach((G2,gi)=>{const gx=x+gi*gw;const n=gs[1]?2:1,bw=Math.min(40,(gw-30)/n);
    ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(gx+8,y+h);ctx.lineTo(gx+gw-8,y+h);ctx.stroke();
    for(let s=0;s<n;s++){const v=G2.v[s];if(!Number.isFinite(v))continue;const bh=clamp(v/G2.mx,0,1)*h,bx=gx+gw/2-n*bw/2-(n-1)*4+s*(bw+8);ctx.fillStyle=gs[s].c;ctx.fillRect(bx,y+h-bh,bw,bh);
      if(!compact)txt(ctx,G2.f(v),bx+bw/2,y+h-bh-5,{s:12*k,w:700,a:'center',c:PAL['cv-ink']});}
    txt(ctx,G2.l,gx+gw/2,y+h+18*k,{s:12.5*k,w:700,a:'center',c:PAL['cv-ink']});});}
function legendChips(ctx,x,y,gs,k,compact){let xx=x;gs.forEach(g=>{if(!g)return;ctx.fillStyle=g.c;ctx.beginPath();ctx.arc(xx+6,y-4,6,0,6.2832);ctx.fill();const s=compact?g.f:g.f+' '+g.M.toFixed(1)+' g/mol';txt(ctx,s,xx+16,y+1,{s:12.5*k,w:600,c:PAL['cv-ink']});ctx.font='600 '+12.5*k+'px '+FONT;xx+=ctx.measureText(s).width+30;});}
function drawK(sim,ctx,vdt,k,t){const p=sim.p,st=sim.st,compact=k>1.3;ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
  if(p.mode==='race')return drawRace(sim,ctx,k,compact,t);
  const box=p.mode==='dist'?BOXD:BOXE,eff=p.mode==='effuse';
  ctx.fillStyle=PAL['cv-bg2'];ctx.fillRect(box.x0,box.y0,box.x1-box.x0,box.y1-box.y0);ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=4;
  if(eff){ctx.beginPath();ctx.moveTo(box.x1,HOLE.y0);ctx.lineTo(box.x1,box.y0);ctx.lineTo(box.x0,box.y0);ctx.lineTo(box.x0,box.y1);ctx.lineTo(box.x1,box.y1);ctx.lineTo(box.x1,HOLE.y1);ctx.stroke();}
  else ctx.strokeRect(box.x0,box.y0,box.x1-box.x0,box.y1-box.y0);
  const ms=st.mol,stepI=eff?EFF_EVERY:1;for(let i=0;i<ms.length;i+=stepI){const m=ms[i];const g=gasOfMol(p,m.s);if(!g)continue;drawMol(ctx,m.x,m.y,g,(i*1.7+t*(1+i%5))%6.28);}
  if(eff){for(const f of st.fly){const g=gasOfMol(p,f.s);if(g)drawMol(ctx,f.x,f.y,g,0);}
    txt(ctx,'pinhole',box.x1+8,HOLE.y1+18,{s:12*k,c:PAL['cv-soft']});
    const gs=[gA(p),hasB(p)?gB(p):null],rate=s=>st.escT>0.5?st.esc[s]/st.escT:0,mx=Math.max(10,rate(0),rate(1))*1.2;
    txt(ctx,'Escaped per second',520,52,{s:13*k,w:700,c:PAL['cv-ink']});
    gs.forEach((g,s)=>{if(!g)return;const y=70+s*42*Math.min(k,1.35);const w=clamp(rate(s)/mx,0,1)*170;ctx.fillStyle=g.c;rr(ctx,520,y,Math.max(4,w),22,4);ctx.fill();txt(ctx,g.f+' '+rate(s).toFixed(1),520+Math.max(4,w)+8,y+16,{s:12.5*k,w:700,c:PAL['cv-ink']});});
    if(gs[1]&&!compact){const r1=st.esc[1]>0?st.esc[0]/st.esc[1]:NaN;rr(ctx,520,330,268,92,10);ctx.fillStyle=PAL['card'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
      txt(ctx,'Graham’s law',534,354,{s:13.5*k,w:700});txt(ctx,'measured ratio: '+(Number.isFinite(r1)?r1.toFixed(2):'…'),534,378,{s:12.5*k});txt(ctx,'√('+gs[1].M.toFixed(1)+' ÷ '+gs[0].M.toFixed(1)+') = '+Math.sqrt(gs[1].M/gs[0].M).toFixed(2),534,402,{s:12.5*k,c:PAL['cv-soft']});}
    pill(ctx,Math.round(st.T)+' K',box.x0+44,box.y0+22,PAL['card'],PAL['cv-ink'],13*k);return;}
  const gs=[gA(p),hasB(p)?gB(p):null];legendChips(ctx,528,48,gs,k,compact);
  miniHist(sim,ctx,528,84,256,compact?120:150,k,compact);
  energyBars(sim,ctx,528,compact?280:296,256,compact?92:104,k,compact);
  pill(ctx,Math.round(st.T)+' K',box.x0+44,box.y0+22,PAL['card'],PAL['cv-ink'],13*k);}
function drawRace(sim,ctx,k,compact,t){const p=sim.p,st=sim.st,P=PAIR[p.pair]||PAIR.hcl,r=st.race,d=raceD(st,p),T=TUBE,X=cm=>T.x0+cm*T.cm,hon=atLeast('honors');
  txt(ctx,'Lab time: '+(r.t*LABX/60).toFixed(1)+' min',T.x0,44,{s:13*k,w:700});if(!compact)txt(ctx,'(shown 30× faster than real)',T.x0,64,{s:12*k,c:PAL['cv-soft']});
  // tube
  ctx.fillStyle=PAL['cv-bg2'];ctx.fillRect(T.x0,T.y0,T.x1-T.x0,T.y1-T.y0);
  // concentration haze
  const ga=ctx.createLinearGradient(T.x0,0,X(d[0]),0);ga.addColorStop(0,P.cb+'66');ga.addColorStop(1,P.cb+'00');ctx.fillStyle=ga;ctx.fillRect(T.x0,T.y0,X(d[0])-T.x0,T.y1-T.y0);
  const gb=ctx.createLinearGradient(T.x1,0,X(100-d[1]),0);gb.addColorStop(0,P.ca+'66');gb.addColorStop(1,P.ca+'00');ctx.fillStyle=gb;ctx.fillRect(X(100-d[1]),T.y0,T.x1-X(100-d[1]),T.y1-T.y0);
  // molecules
  for(const q of st.rp){const front=q.s?d[1]:d[0];const cmv=front*q.u+Math.sin(q.ph)*0.8;const x=q.s?X(100-cmv):X(cmv);const y=q.y+Math.sin(q.ph*1.3)*4;
    if(r.met&&Math.abs((q.s?100-cmv:cmv)-r.xm)<2.5&&(Math.floor(q.ph*3)%3===0))continue;
    ctx.fillStyle=q.s?P.ca:P.cb;ctx.beginPath();ctx.arc(x,clamp(y,T.y0+4,T.y1-4),4,0,6.2832);ctx.fill();}
  // ring
  if(r.met){const xr=X(r.xm),w=6+r.dep*12;ctx.fillStyle='#f4f1ea';ctx.strokeStyle='#8d8d8d';ctx.lineWidth=1.5;rr(ctx,xr-w/2,T.y0-2,w,T.y1-T.y0+4,3);ctx.fill();ctx.stroke();
    ctx.strokeStyle=PAL['cv-soft'];ctx.beginPath();ctx.moveTo(xr,T.y0-4);ctx.lineTo(xr,130);ctx.stroke();pill(ctx,P.s+'(s) ring at '+r.xm.toFixed(1)+' cm',clamp(xr,130,670),116,PAL['cv-ink'],PAL['card'],13*k);}
  ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=3;ctx.strokeRect(T.x0,T.y0,T.x1-T.x0,T.y1-T.y0);
  // cotton plugs
  [[T.x0-26,P.cb],[T.x1,P.ca]].forEach(([x,c])=>{rr(ctx,x,T.y0-6,26,T.y1-T.y0+12,8);ctx.fillStyle='#eceff1';ctx.fill();ctx.strokeStyle=c;ctx.lineWidth=3;ctx.stroke();});
  txt(ctx,P.b+'(aq) cotton',T.x0-26,T.y0-18,{s:13*k,w:700,c:PAL['cv-ink']});txt(ctx,P.a+'(aq) cotton',T.x1+26,T.y0-18,{s:13*k,w:700,c:PAL['cv-ink'],a:'right'});
  // ruler
  const ry=T.y1+14;ctx.fillStyle=PAL['cv-ruler'];ctx.fillRect(T.x0,ry,T.x1-T.x0,30);ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1;ctx.strokeRect(T.x0,ry,T.x1-T.x0,30);
  ctx.beginPath();for(let c=0;c<=100;c+=2){const x=X(c),h=c%10===0?12:6;ctx.moveTo(x,ry);ctx.lineTo(x,ry+h);}ctx.stroke();
  for(let c=0;c<=100;c+=compact?25:10)txt(ctx,String(c),X(c),ry+26,{s:12*k,c:PAL['cv-soft'],a:'center'});
  // distances
  const yb=ry+62;const br=(x1,x2,c,label,al)=>{ctx.strokeStyle=c;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x1,yb);ctx.lineTo(x2,yb);ctx.moveTo(x1,yb-7);ctx.lineTo(x1,yb+7);ctx.moveTo(x2,yb-7);ctx.lineTo(x2,yb+7);ctx.stroke();
    txt(ctx,label,al==='left'?x1:x2,yb+26*Math.min(k,1.4),{s:13*k,w:700,c:PAL['cv-ink'],a:al});};
  br(X(0),X(d[0]),P.cb,P.b+': '+d[0].toFixed(1)+' cm','left');br(X(100-d[1]),X(100),P.ca,P.a+': '+d[1].toFixed(1)+' cm','right');
  if(!compact){const y0=372;rr(ctx,200,y0,400,66,10);ctx.fillStyle=PAL['card'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
    txt(ctx,hon?'Graham’s law: d('+P.b+') ÷ d('+P.a+') = √(M '+P.a+' ÷ M '+P.b+')':'Lighter molecules move faster',400,y0+26,{s:13.5*k,w:700,a:'center'});
    txt(ctx,hon?'√('+P.Ma.toFixed(2)+' ÷ '+P.Mb.toFixed(2)+') = '+Math.sqrt(P.Ma/P.Mb).toFixed(2)+(r.met?'   measured: '+(r.xm/(100-r.xm)).toFixed(2):''):P.b+' '+P.Mb.toFixed(1)+' g/mol vs '+P.a+' '+P.Ma.toFixed(1)+' g/mol',400,y0+50,{s:12.5*k,a:'center',c:PAL['cv-soft']});}}

/* ---------- graphs ---------- */
function msgK(ctx,box,s){txt(ctx,s,box.cw/2,box.ch/2,{s:15,c:PAL['muted'],a:'center',b:'middle'});}
function plotK(sim,ctx,box,id){ensure(sim);const p=sim.p,st=sim.st;
  if(id==='race'){if(p.mode!=='race'){msgK(ctx,box,'Switch to the Diffusion race to graph distances.');return;}const P=PAIR[p.pair]||PAIR.hcl,r=st.race;const tmax=Math.max(16,r.t)*LABX/60;
    const ax=axes(ctx,box,{xmin:0,xmax:tmax,ymin:0,ymax:100,xl:'Lab time (min)',yl:'Distance traveled (cm)'});const tm=r.met?r.tm:r.t;
    [[P.Mb,P.cb,P.b],[P.Ma,P.ca,P.a]].forEach(([M,c])=>{ctx.strokeStyle=c;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(ax.X(0),ax.Y(0));const dd=RACE_K/Math.sqrt(M)*tm;ctx.lineTo(ax.X(tm*LABX/60),ax.Y(dd));if(r.met)ctx.lineTo(ax.X(r.t*LABX/60),ax.Y(dd));ctx.stroke();});
    legend(ctx,box.L+12,box.T+10,[{label:P.b,color:P.cb},{label:P.a,color:P.ca}]);return;}
  if(id==='hist'){const nb=30,vmax=vMaxFor(p),D=histData(sim,nb,vmax),gs=[gA(p),hasB(p)?gB(p):null];let ymax=1;
    for(let s=0;s<2;s++){if(!gs[s])continue;D.h[s].forEach(c=>ymax=Math.max(ymax,c));ymax=Math.max(ymax,D.per[s]*mb(vmpT(gs[s].M,p.T),gs[s].M,p.T)*vmax/nb);}ymax*=1.15;
    const ax=axes(ctx,box,{xmin:0,xmax:vmax,ymin:0,ymax,xl:'Speed (m/s)',yl:'Molecules per '+Math.round(vmax/nb)+' m/s'});const bw=(ax.X(vmax/nb)-ax.X(0));
    for(let s=0;s<2;s++){if(!gs[s])continue;ctx.fillStyle=gs[s].c;ctx.globalAlpha=0.5;D.h[s].forEach((c,i)=>{ctx.fillRect(ax.X(i*vmax/nb)+1,ax.Y(c),bw-2,ax.Y(0)-ax.Y(c));});ctx.globalAlpha=1;
      ctx.strokeStyle=PAL['fg'];ctx.lineWidth=2;ctx.setLineDash([5,4]);ctx.beginPath();for(let i=0;i<=120;i++){const v=i/120*vmax,y=D.per[s]*mb(v,gs[s].M,p.T)*vmax/nb;i?ctx.lineTo(ax.X(v),ax.Y(y)):ctx.moveTo(ax.X(v),ax.Y(y));}ctx.stroke();ctx.setLineDash([]);
      if(atLeast('ap')){[[vmpT,'mp'],[vavgT,'avg'],[vrmsT,'rms']].forEach(([fn,l],j)=>{const v=fn(gs[s].M,p.T);if(v>vmax)return;ctx.strokeStyle=gs[s].c;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(ax.X(v),ax.Y(0));ctx.lineTo(ax.X(v),ax.Y(ymax*(0.55-j*0.12-s*0.04)));ctx.stroke();txt(ctx,l,ax.X(v)+3,ax.Y(ymax*(0.55-j*0.12-s*0.04))+4,{s:12,c:PAL['muted']});});}}
    const items=gs.filter(Boolean).map(g=>({label:g.f+' measured',color:g.c}));items.push({label:'Maxwell–Boltzmann',color:PAL['fg'],dash:true});legend(ctx,box.L+12,box.T+10,items);return;}
  if(id==='bars'){if(p.mode==='race'){msgK(ctx,box,'Switch to Speeds in a box or Pinhole effusion.');return;}const gs=[gA(p),hasB(p)?gB(p):null].filter(Boolean);
    if(p.mode==='effuse'){const rate=s=>st.escT>0.5?st.esc[s]/st.escT:0;const vals=gs.map((g,s)=>rate(s));const ax=axes(ctx,box,{xmin:0,xmax:gs.length,ymin:0,ymax:Math.max(10,...vals)*1.25,xcats:gs.map(g=>g.f),yl:'Escapes per second'});
      vals.forEach((v,i)=>{ctx.fillStyle=gs[i].c;ctx.fillRect(ax.X(i+0.25),ax.Y(v),ax.X(0.5)-ax.X(0),ax.Y(0)-ax.Y(v));txt(ctx,v.toFixed(1),ax.X(i+0.5),ax.Y(v)-6,{s:13,w:700,a:'center',c:PAL['fg']});});return;}
    const cats=[],vals=[],cols=[];gs.forEach((g,s)=>{cats.push(g.f+' speed');vals.push(E(sim,'v'+s)/Math.max(1,vMaxFor(p)*0.6)*100);cols.push(g.c);});gs.forEach((g,s)=>{cats.push(g.f+' KE');vals.push(E(sim,'ke'+s)/(1.5*R*1000/1000*1.15)*100);cols.push(g.c);});
    const ax=axes(ctx,box,{xmin:0,xmax:cats.length,ymin:0,ymax:110,xcats:cats,yl:'% of full scale'});
    vals.forEach((v,i)=>{if(!Number.isFinite(v))return;ctx.fillStyle=cols[i];ctx.fillRect(ax.X(i+0.2),ax.Y(v),ax.X(0.6)-ax.X(0),ax.Y(0)-ax.Y(v));const s=i%gs.length,isKE=i>=gs.length;txt(ctx,isKE?E(sim,'ke'+s).toFixed(2)+' kJ/mol':Math.round(E(sim,'v'+s))+' m/s',ax.X(i+0.5),ax.Y(v)-6,{s:13,w:700,a:'center',c:PAL['fg']});});}}

BioLab.register(SIM);
})();
