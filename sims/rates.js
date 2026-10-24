(function(){
'use strict';
const {clamp,lerp,rng,randn,rr,txt,pill,atLeast,PAL,FONT,RM,legend,serColor}=BioLab.h;
/* Collision theory in a particle box.
   Every particle carries a 3-D velocity drawn from the Maxwell–Boltzmann distribution at T (the box shows x and y; vz only adds energy),
   and a gentle Andersen thermostat (the "water bath") keeps the distribution at T. Particles bounce elastically.
   A–B collision reacts only if  ½μ·v_rel² ≥ Eₐ  AND  A hits B on its reactive side (orientation window φ, so p = φ/360°).
   Mg mode: H⁺ ions hit a fixed Mg lattice. A surface Mg atom that takes two H⁺ hits with E ≥ Eₐ leaves as Mg²⁺, and the two H make one H₂ bubble. */
const RK=8.314e-3;                 // kJ/(mol·K)
const VS=110;                      // px/s per velocity component for mass 1 at 300 K
const EU=RK*300/(VS*VS);           // kJ/mol per (mass·(px/s)²): E = ½·m·v²·EU, mean 1.5RT
const BX=16,BY=58,BW=452,BH=424;   // particle box
const PX=488,PW=300;               // right panel
const PPM=80;                      // particles per mol/L for A and B
const HPM=30;                      // H⁺ (and Cl⁻) per mol/L
const EA_MG=6;                     // kJ/mol for H⁺ on the Mg surface (scaled; see About)
const DH_GAS=-30;                  // kJ/mol, drawn on the energy diagram for A + B → AB
const CAT=0.55;                    // a catalyst path has 55% of Eₐ
const WIN=4;                       // s, rate window
const MGR=12,MGC=24;               // Mg atom radius and lattice spacing
const sq=x=>x*x;
function erfc(x){const t=1/(1+0.3275911*x);return t*(0.254829592+t*(-0.284496736+t*(1.421413741+t*(-1.453152027+t*1.061405429))))*Math.exp(-x*x);}
/* fraction of molecules with KE ≥ E (3-D Maxwell–Boltzmann) */
function tail(E,T){const x=E/(RK*T);if(x<=0)return 1;return 2*Math.sqrt(x/Math.PI)*Math.exp(-x)+erfc(Math.sqrt(x));}
/* MB energy density per kJ/mol */
function mbf(E,T){const kT=RK*T;return 2*Math.sqrt(E/Math.PI)*Math.pow(1/kT,1.5)*Math.exp(-E/kT);}
const eaNow=p=>p.rxn==='mg'?EA_MG:p.Ea*(p.cat?CAT:1);
const pOr=p=>p.rxn==='mg'?1:p.orient/360;
const keyOf=p=>[p.rxn,p.cA,p.cB,p.cH,p.surf].join('|');
const SP={A:{r:9,m:1},B:{r:9,m:1},C:{r:13,m:2},H:{r:6,m:1},Cl:{r:9,m:2},Mg2:{r:7,m:1.5},H2:{r:5,m:1}};

function mkP(st,k,x,y,T){const s=SP[k],r=st.rnd,sd=VS*Math.sqrt(T/300/s.m);
  return {k,x,y,r:s.r,m:s.m,vx:randn(r)*sd,vy:randn(r)*sd,vz:randn(r)*sd,a:r()*6.283,w:(r()-.5)*4,dead:false};}
function place(st,k,T){const s=SP[k],r=st.rnd;let x,y;
  for(let tries=0;tries<60;tries++){x=BX+s.r+2+r()*(BW-2*s.r-4);y=BY+s.r+2+r()*(BH-2*s.r-4-(st.mg.length?MGC*3.5:0));
    if(!st.ps.some(q=>sq(q.x-x)+sq(q.y-y)<sq(q.r+s.r+2)))break;}
  st.ps.push(mkP(st,k,x,y,T));}
function buildMg(st,surf){st.mg=[];const fy=BY+BH-MGR-1;
  if(surf==='ribbon'){const x0=BX+BW/2-1.5*MGC;for(let j=0;j<3;j++)for(let i=0;i<4;i++)st.mg.push({x:x0+i*MGC,y:fy-j*MGC,i,j,g:0,h:0,gone:false});}
  else{const xs=[0.1,0.26,0.42,0.58,0.74,0.9];xs.forEach((f,g)=>{const x0=BX+f*BW-MGC/2;for(let i=0;i<2;i++)st.mg.push({x:x0+i*MGC,y:fy,i,j:0,g,h:0,gone:false});});}}
function exposedFaces(st){let n=0;const at=(g,i,j)=>st.mg.some(m=>!m.gone&&m.g===g&&m.i===i&&m.j===j);
  st.mg.forEach(m=>{if(m.gone)return;if(!at(m.g,m.i,m.j+1))n++;if(!at(m.g,m.i-1,m.j))n++;if(!at(m.g,m.i+1,m.j))n++;});return n;}

function restart(sim){sim.st=RATES.init(sim);sim.st.t0=sim.t;sim.hist=[];sim.lastSample=-1e9;}

/* ---------- show only what the current reaction uses ---------- */
function syncMode(sim){if(!sim.ui||!sim.ui.sec)return;const mode=sim.p.rxn,d=sim.def;
  d.controls.forEach(c=>{if(!c.modes)return;const cid=d.id+'-'+c.id,e=document.getElementById(cid)||document.getElementById(cid+'-l');if(!e)return;const w=e.closest('.ctl');if(w)w.hidden=!atLeast(c.lvl)||!c.modes.includes(mode);});
  d.metrics.forEach(m=>{if(!m.modes)return;const t=sim.ui.tiles[m.id];if(!t)return;const w=t.num.closest('.tile');if(w)w.hidden=!atLeast(m.lvl)||!m.modes.includes(mode);});}

const ZP=0.045;    // collisions per second per A–B pair at 300 K, measured in this box
const HZ=0.0072;  // H⁺ hits per second per (ion × exposed Mg face) at 300 K
/* Collision-theory rate law, in particles per second for this box: rate = Z·f·p
   Z ∝ √T·[A][B] (collision frequency), f = fraction of molecules with E ≥ Eₐ (the shaded tail), p = orientation factor. */
function model(sim){const p=sim.p,st=sim.st,T=p.T,f=tail(eaNow(p),T),sT=Math.sqrt(T/300);
  if(p.rxn==='mg'){const Z=st.mg.some(m=>!m.gone)?HZ*sT*st.nH*exposedFaces(st):0;return {Z,f,p:1,succ:f,rate:Z*f};}
  const Z=ZP*sT*st.mA*st.mB,pp=pOr(p);return {Z,f,p:pp,succ:f*pp,rate:Z*f*pp,k:ZP*sT*f*pp*PPM};}
const count=(st,k)=>st.ps.reduce((a,q)=>a+(q.k===k&&!q.dead?1:0),0);

const RATES={
  id:'rates',hash:'rates',apUnit:12,order:1,kind:'Simulation',tab:'Reaction rates',
  prereq:['kmt','enthalpy'],next:['ratelaw','equilibrium'],
  card:'Watch particles collide. Change concentration, temperature, surface area and a catalyst, and count which collisions actually react.',
  title:'Reaction rates and collision theory',
  lede:{bio:'Particles react only when they collide hard enough and the right way around. Change the concentration, temperature, surface area and catalyst, and watch how fast the product builds up.',
        honors:'Collision theory in action: count the collisions, see which ones clear the activation energy on the Maxwell–Boltzmann curve, and see why only some of them react.',
        ap:'Measure rate = Z × f × p for yourself: the collision frequency Z, the fraction f with E ≥ Eₐ, and the orientation factor p. Then check your numbers against the Arrhenius equation.'},
  scale:{bio:'A zoomed-in view of a tiny drop of solution, a few nanometers across. Each ball is one particle.',
         ap:'A 2-D slice a few nanometers across. 80 A or B particles stand for 1 mol/L (30 H⁺ ions in the Mg + HCl box). Energies are in kJ/mol, as if each particle were a mole of them.'},
  aspect:1.6,timeScale:1,dtMax:0.01,sampleDt:0.25,window:120,unit:'s',chChange:4,chReveal:8,
  controls:[
    {id:'rxn',label:'Reaction',type:'seg',def:'gas',lvl:'bio',options:[{v:'gas',l:'A + B → AB'},{v:'mg',l:'Mg + HCl'}],noTrial:false},
    {id:'cA',label:'Concentration of A',type:'range',min:0.1,max:1,step:0.05,def:0.5,unit:' M',lvl:'bio',modes:['gas'],help:'Changing a concentration mixes a fresh batch.'},
    {id:'cB',label:'Concentration of B',type:'range',min:0.1,max:1,step:0.05,def:0.5,unit:' M',lvl:'bio',modes:['gas']},
    {id:'cH',label:'HCl concentration',type:'range',min:1,max:3,step:0.25,def:1,unit:' M',lvl:'bio',modes:['mg'],help:'The Mg is the same piece every time: 12 atoms.'},
    {id:'surf',label:'Magnesium',type:'seg',def:'ribbon',lvl:'bio',modes:['mg'],options:[{v:'ribbon',l:'One chunk (ribbon)'},{v:'powder',l:'Powder (same mass)'}]},
    {id:'T',label:'Temperature',type:'range',min:200,max:600,step:10,def:300,unit:' K',lvl:'bio',help:'300 K is about room temperature (27 °C).'},
    {id:'cat',label:'Add a catalyst',type:'toggle',def:false,lvl:'bio',modes:['gas'],help:'Gives the reaction a lower-energy path'},
    {id:'Ea',label:'Activation energy Eₐ',type:'range',min:4,max:20,step:1,def:10,unit:' kJ/mol',lvl:'honors',modes:['gas']},
    {id:'orient',label:'Reactive side of B',type:'range',min:60,max:360,step:30,def:180,unit:'°',lvl:'ap',modes:['gas'],help:'How much of B’s surface can react. 180° means half, so p = 0.5.'}
  ],
  actions:[{id:'restart',label:'Mix a fresh batch',lvl:'bio',primary:true,run(sim){restart(sim);}}],
  init(sim){const p=sim.p,st={ps:[],mg:[],t0:0,key:keyOf(p),Tlast:p.T,rnd:rng(9137+Math.round(p.T)+(RATES.seedOff||0)),bud:0,nLim0:0,half:NaN,done:NaN,h2:0,hits:0,mA:0,mB:0,mC:0,nH:0};
    if(p.rxn==='mg'){buildMg(st,p.surf);st.nH=Math.round(p.cH*HPM);for(let i=0;i<st.nH;i++){place(st,'H',p.T);place(st,'Cl',p.T);}st.nLim0=st.mg.length;}
    else{const nA=Math.round(p.cA*PPM),nB=Math.round(p.cB*PPM);for(let i=0;i<Math.max(nA,nB);i++){if(i<nA)place(st,'A',p.T);if(i<nB)place(st,'B',p.T);}st.mA=nA;st.mB=nB;st.nLim0=Math.min(nA,nB);}
    return st;},
  step(sim,dt){const p=sim.p;let st=sim.st;if(keyOf(p)!==st.key){restart(sim);st=sim.st;}
    const r=st.rnd,T=p.T;
    if(p.T!==st.Tlast){const f=Math.sqrt(p.T/st.Tlast);st.ps.forEach(q=>{q.vx*=f;q.vy*=f;q.vz*=f;});st.Tlast=p.T;}
    const mg=p.rxn==='mg',Ea=eaNow(p),half=(p.orient/2)*Math.PI/180,ps=st.ps;
    // the rate law sets how many reactions happen; the particles below carry them out at real collisions
    const mod=model(sim);let dn=mod.rate*dt;
    if(mg){if(st.mg.some(m=>!m.gone)){st.bud+=dn;st.hits+=dn;}}
    else{dn=Math.min(dn,st.mA,st.mB);st.mA-=dn;st.mB-=dn;st.mC+=dn;st.bud+=dn;
      if(Number.isNaN(st.half)&&st.nLim0>0&&st.mC>=st.nLim0/2)st.half=sim.t-st.t0;}
    // move, thermostat, walls
    for(const q of ps){if(q.k==='H2'){q.y-=70*dt;q.x+=Math.sin(sim.t*3+q.a)*12*dt;if(q.y<BY+q.r){q.dead=true;st.h2++;}continue;}
      if(r()<0.6*dt){const sd=VS*Math.sqrt(T/300/q.m);q.vx=randn(r)*sd;q.vy=randn(r)*sd;q.vz=randn(r)*sd;}
      q.x+=q.vx*dt;q.y+=q.vy*dt;q.a+=q.w*dt;
      if(q.x<BX+q.r){q.x=BX+q.r;q.vx=Math.abs(q.vx);}else if(q.x>BX+BW-q.r){q.x=BX+BW-q.r;q.vx=-Math.abs(q.vx);}
      if(q.y<BY+q.r){q.y=BY+q.r;q.vy=Math.abs(q.vy);}else if(q.y>BY+BH-q.r){q.y=BY+BH-q.r;q.vy=-Math.abs(q.vy);}}
    // pair collisions on a grid
    const CS=28,cols=Math.ceil(BW/CS),rows=Math.ceil(BH/CS),grid=new Array(cols*rows);
    for(let i=0;i<ps.length;i++){const q=ps[i];if(q.dead||q.k==='H2')continue;const cx=clamp(Math.floor((q.x-BX)/CS),0,cols-1),cy=clamp(Math.floor((q.y-BY)/CS),0,rows-1);const c=cy*cols+cx;(grid[c]||(grid[c]=[])).push(i);q.c=cx;q.cr=cy;}
    for(let i=0;i<ps.length;i++){const a=ps[i];if(a.dead||a.k==='H2')continue;
      for(let gy=a.cr-1;gy<=a.cr+1;gy++){if(gy<0||gy>=rows)continue;for(let gx=a.c-1;gx<=a.c+1;gx++){if(gx<0||gx>=cols)continue;const cell=grid[gy*cols+gx];if(!cell)continue;
        for(const j of cell){if(j<=i)continue;const b=ps[j];if(b.dead||a.dead)continue;
          const dx=b.x-a.x,dy=b.y-a.y,d2=dx*dx+dy*dy,R=a.r+b.r;if(d2>=R*R||d2<1e-6)continue;
          const d=Math.sqrt(d2),nx=dx/d,ny=dy/d,rvx=b.vx-a.vx,rvy=b.vy-a.vy,vn=rvx*nx+rvy*ny;
          const ov=(R-d)/2;a.x-=nx*ov;a.y-=ny*ov;b.x+=nx*ov;b.y+=ny*ov;if(vn>=0)continue;
          if(!mg&&((a.k==='A'&&b.k==='B')||(a.k==='B'&&b.k==='A'))){
            const B=a.k==='B'?a:b,A=a.k==='A'?a:b,mu=A.m*B.m/(A.m+B.m);
            const E=0.5*mu*(sq(B.vx-A.vx)+sq(B.vy-A.vy)+sq(B.vz-A.vz))*EU;
            let dir=Math.atan2(A.y-B.y,A.x-B.x)-B.a;dir=Math.atan2(Math.sin(dir),Math.cos(dir));
            const okE=E>=Ea,okO=Math.abs(dir)<=half;
            if(okE&&okO&&st.bud>=1){join(sim,A,B);continue;}
            fx(sim,(A.x+B.x)/2,(A.y+B.y)/2,okE?'orient':'weak');}
          const J=2*vn/(a.m+b.m);a.vx+=J*b.m*nx;a.vy+=J*b.m*ny;b.vx-=J*a.m*nx;b.vy-=J*a.m*ny;}}}}
    // if the right collision has not come along, the nearest A–B pair reacts
    if(!mg)while(st.bud>=2.5){const As=ps.filter(q=>q.k==='A'&&!q.dead),Bs=ps.filter(q=>q.k==='B'&&!q.dead);if(!As.length||!Bs.length){st.bud=0;break;}
      const A=As[Math.floor(r()*As.length)];let best=null,bd=1e9;Bs.forEach(q=>{const e=sq(q.x-A.x)+sq(q.y-A.y);if(e<bd){bd=e;best=q;}});join(sim,A,best);}
    // H⁺ on the Mg surface
    if(mg){for(const q of ps){if(q.dead||q.k==='H2')continue;if(q.y<BY+BH-MGC*3.4-q.r)continue;
      for(const m of st.mg){if(m.gone)continue;const dx=q.x-m.x,dy=q.y-m.y,R=q.r+MGR,d2=dx*dx+dy*dy;if(d2>=R*R)continue;
        const d=Math.sqrt(d2)||1,nx=dx/d,ny=dy/d,vn=q.vx*nx+q.vy*ny;q.x=m.x+nx*R;q.y=m.y+ny*R;if(vn>=0)continue;
        if(q.k==='H'){const E=0.5*q.m*(q.vx*q.vx+q.vy*q.vy+q.vz*q.vz)*EU;
          if(E>=Ea&&st.bud>=1){hitMg(sim,q,m,nx,ny);break;}
          fx(sim,m.x+nx*MGR,m.y+ny*MGR,'weak');}
        q.vx-=2*vn*nx;q.vy-=2*vn*ny;break;}}
      while(st.bud>=2.5){const open=st.mg.filter(m=>!m.gone),Hs=ps.filter(q=>q.k==='H'&&!q.dead);if(!open.length||!Hs.length){st.bud=0;break;}
        const m=open[Math.floor(r()*open.length)];let best=Hs[0],bd=1e9;Hs.forEach(q=>{const e=sq(q.x-m.x)+sq(q.y-m.y);if(e<bd){bd=e;best=q;}});hitMg(sim,best,m,0,-1);}}
    if(ps.some(q=>q.dead))st.ps=ps.filter(q=>!q.dead);
    // the rest of the beaker holds far more acid: each H⁺ used up is replaced by one drifting in through the top edge
    while(st.refill>0){st.refill--;const n=mkP(st,'H',BX+12+r()*(BW-24),BY+8,T);n.vy=Math.abs(n.vy);st.ps.push(n);}
    if(mg&&Number.isNaN(st.done)&&!st.mg.some(m=>!m.gone))st.done=sim.t-st.t0;},
  metrics:[
    {id:'rate',label:'Reaction rate',unit:'M/s',lvl:'bio',min:0,max:null,d:4,modes:['gas'],get:s=>model(s).rate/PPM},
    {id:'nA',label:'A left',unit:'M',lvl:'bio',min:0,max:1,d:2,modes:['gas'],get:s=>s.st.mA/PPM},
    {id:'nB',label:'B left',unit:'M',lvl:'bio',min:0,max:1,d:2,modes:['gas'],get:s=>s.st.mB/PPM},
    {id:'nC',label:'AB made',unit:'M',lvl:'bio',min:0,max:1,d:2,modes:['gas'],get:s=>s.st.mC/PPM},
    {id:'half',label:'Time to react halfway',unit:'s',lvl:'bio',min:0,max:null,d:1,modes:['gas'],get:s=>s.st.half},
    {id:'bub',label:'H₂ bubbles per second',unit:'/s',lvl:'bio',min:0,max:null,d:2,modes:['mg'],get:s=>model(s).rate/2},
    {id:'mgl',label:'Mg atoms left',unit:'of 12',lvl:'bio',min:0,max:12,d:0,modes:['mg'],get:s=>s.st.mg.filter(m=>!m.gone).length},
    {id:'done',label:'Time for the Mg to disappear',unit:'s',lvl:'bio',min:0,max:null,d:1,modes:['mg'],get:s=>s.st.done},
    {id:'surfA',label:'Mg faces touching acid',unit:'',lvl:'honors',min:0,max:30,d:0,modes:['mg'],get:s=>exposedFaces(s.st)},
    {id:'Z',label:'Collisions per second',unit:'/s',lvl:'honors',min:0,max:null,d:1,get:s=>model(s).Z},
    {id:'succ',label:'Collisions that react',unit:'%',lvl:'honors',min:0,max:100,d:2,get:s=>model(s).succ*100},
    {id:'fE',label:'Share with E ≥ Eₐ (f)',unit:'%',lvl:'ap',min:0,max:100,d:2,get:s=>model(s).f*100},
    {id:'p',label:'Orientation factor p',unit:'',lvl:'ap',min:0,max:1,d:2,modes:['gas'],get:s=>pOr(s.p)},
    {id:'k',label:'Rate constant k',unit:'M⁻¹s⁻¹',lvl:'ap',min:0,max:null,d:4,modes:['gas'],get:s=>model(s).k}
  ],
  graphs:[{id:'conc',label:'Concentration vs time',lvl:'bio',custom:true},{id:'rt',label:'Reaction rate vs time',lvl:'honors',custom:true}],
  defaultGraph:'conc',
  plot(sim,ctx,box,id){const st=sim.st,mg=sim.p.rxn==='mg',rows=sim.hist.filter(r=>r.t>=st.t0-1e-9);
    const el=Math.max(0,sim.t-st.t0),xmax=Math.max(30,Math.ceil(el/10)*10);
    if(id==='conc'){const ser=mg?[{id:'cH',l:'[H⁺]',c:PAL['cv-h']},{id:'mg2',l:'[Mg²⁺]',c:PAL['cv-soft']}]:[{id:'nA',l:'[A]',c:PAL['cv-sub']},{id:'nB',l:'[B]',c:PAL['cv-prod']},{id:'nC',l:'[AB]',c:PAL['s5']}];
      const ymax=mg?Math.max(1,sim.p.cH)*1.05:Math.max(sim.p.cA,sim.p.cB,0.2)*1.1;
      box.T=34;box.H=box.ch-34-40;const ax=BioLab.h.axes(ctx,box,{xmin:0,xmax,ymin:0,ymax,xl:'Time since mixing (s)',yl:'Concentration (M)'});
      ctx.save();ctx.beginPath();ctx.rect(box.L,box.T,box.W,box.H);ctx.clip();
      ser.forEach(s=>{ctx.strokeStyle=s.c;ctx.lineWidth=2.5;ctx.beginPath();let n=0;rows.forEach(r=>{let v=s.id==='mg2'?(12-r.v.mgl)/HPM:s.id==='cH'?sim.p.cH:r.v[s.id];if(!Number.isFinite(v))return;const X=ax.X(r.t-st.t0),Y=ax.Y(v);n++?ctx.lineTo(X,Y):ctx.moveTo(X,Y);});ctx.stroke();});
      ctx.restore();legend(ctx,box.L,14,ser.map(s=>({label:s.l,color:s.c})));}
    else{const key=mg?'bub':'rate';const vals=rows.map(r=>r.v[key]).filter(Number.isFinite);const ymax=Math.max(mg?1:0.02,...vals)*1.15;
      const ax=BioLab.h.axes(ctx,box,{xmin:0,xmax,ymin:0,ymax,xl:'Time since mixing (s)',yl:mg?'H₂ bubbles per second':'Rate (M/s)'});
      ctx.save();ctx.beginPath();ctx.rect(box.L,box.T,box.W,box.H);ctx.clip();ctx.strokeStyle=PAL['g-line'];ctx.lineWidth=2.5;ctx.beginPath();let n=0;
      rows.forEach(r=>{const v=r.v[key];if(!Number.isFinite(v))return;const X=ax.X(r.t-st.t0),Y=ax.Y(v);n++?ctx.lineTo(X,Y):ctx.moveTo(X,Y);});ctx.stroke();ctx.restore();}},
  narrate(sim){const p=sim.p,st=sim.st,x=model(sim),hon=atLeast('honors'),ap=atLeast('ap'),mg=p.rxn==='mg';
    const ea=eaNow(p),pc=v=>v<0.1?v.toFixed(2):v.toFixed(1);
    const warm=p.T>=380?' At '+p.T+' K the particles move fast, so many more of them carry enough energy.':p.T<=250?' At '+p.T+' K the particles are slow, and very few carry enough energy.':'';
    if(mg){const left=st.mg.filter(m=>!m.gone).length;
      if(!left)return '<b>The magnesium is gone</b> after '+st.done.toFixed(1)+' s. Every Mg atom became an Mg²⁺ ion, and every pair of H⁺ ions it met became one H₂ molecule that bubbled away.';
      const f=exposedFaces(st);return (p.surf==='powder'?'<b>The powder exposes '+f+' Mg faces</b> to the acid.':'<b>Only the outside of the chunk</b> ('+f+' faces) touches the acid. The atoms inside must wait their turn.')+' H⁺ ions react only where they hit the metal, so more surface means more successful hits each second.'+(hon?' Each Mg atom needs two H⁺ hits: Mg + 2H⁺ → Mg²⁺ + H₂.':'')+warm;}
    if(st.mA<0.5||st.mB<0.5)return 'One reactant is used up, so <b>no more AB can form</b> and the rate drops to zero. Press <b>Mix a fresh batch</b> to start again.';
    if(ap)return '<b>rate = Z × f × p</b> = '+x.Z.toFixed(0)+' collisions/s × '+pc(x.f*100)+'% × '+x.p.toFixed(2)+' = '+(x.rate).toFixed(2)+' reactions/s in this box, or '+(x.rate/PPM).toFixed(4)+' M/s.'+(p.cat?' The catalyst lowers Eₐ to '+ea.toFixed(1)+' kJ/mol.':' As A and B get used up, Z falls and the reaction slows.');
    let s='About <b>'+x.Z.toFixed(0)+' collisions per second</b>, but only '+pc(x.succ*100)+'% of them make AB. A collision works only if the particles hit <b>hard enough</b> and A hits the <b>dark side of B</b>.';
    if(p.cat)s+=' The catalyst lowers the energy needed'+(hon?' from '+p.Ea+' to '+ea.toFixed(1)+' kJ/mol':'')+', so more collisions succeed.';
    else if(warm)s+=warm;
    else if(st.mA+st.mB<30)s+=' Fewer particles are left, so they collide less often and the reaction slows down.';
    return s;},
  tour:[
    {title:'Particles in a box',text:{bio:'You are zoomed in on a tiny drop of solution. Blue balls are A, orange balls are B. They fly around, bounce off the walls and off each other.',ap:'Each particle has a speed drawn from the Maxwell–Boltzmann distribution at the box temperature. A water bath (a thermostat) keeps that distribution steady.'},focus:[BX,BY,BW,BH],speed:0.5,setup(sim){BioLab.setValues(sim,{rxn:'gas',cA:0.5,cB:0.5,T:300,cat:false});restart(sim);}},
    {title:'Most collisions just bounce',text:{bio:'Watch for the rings. A gray ring is a collision that was too gentle. A yellow flash is a collision that worked: A and B join into one AB molecule (a blue-and-orange pair with a purple ring).',honors:'A gray ring was too gentle. A purple ring had enough energy but hit the light side of B. A yellow flash worked: A and B joined into one AB molecule.'},focus:[BX,BY,BW,BH],speed:0.2},
    {title:'The energy hill',text:{bio:'To react, particles must hit hard enough to get over an energy hill. The height of that hill is the energy needed to react.',honors:'The peak of the hill is the transition state. Its height above the reactants is the activation energy, Eₐ. ΔH is the energy difference between reactants and products.'},focus:[PX,286,PW,196],speed:0.5},
    {title:'Who has enough energy?',text:{bio:'The curve shows how many particles have each amount of energy. Only the ones in the shaded tail, past the red line, can climb the hill.',honors:'The Maxwell–Boltzmann curve shows the spread of kinetic energies. The shaded area past Eₐ is the fraction of molecules that can react if they collide the right way.'},focus:[PX,BY,PW,218],speed:0.5},
    {title:'Heat it up',text:{bio:'At 450 K the curve flattens and spreads to the right. The shaded tail gets much bigger, so many more collisions work.',honors:'Raising T increases the collision rate only a little (speed ∝ √T), but the fraction past Eₐ grows a lot. That is why rate climbs steeply with temperature.'},focus:[[PX,BY,PW,218],[BX,BY,BW,BH]],speed:0.5,setup(sim){BioLab.setValues(sim,{T:450});}},
    {lvl:'honors',title:'Orientation matters',text:'Even an energetic collision fails if A hits the light side of B. Only the dark part of B can react. That is the orientation factor.',focus:[BX,BY,BW,BH],speed:0.15,setup(sim){BioLab.setValues(sim,{T:600});}},
    {title:'A catalyst lowers the hill',text:{bio:'A catalyst gives the reaction an easier path with a lower energy hill (dashed green line). More particles can make it over, even at the same temperature.',honors:'The catalyzed path has a lower Eₐ. The catalyst does not change ΔH or the energy of the particles; it only lowers the barrier.'},focus:[[PX,BY,PW,218],[PX,286,PW,196]],speed:0.5,setup(sim){BioLab.setValues(sim,{T:300,cat:true});}},
    {title:'Surface area',text:'Now magnesium in hydrochloric acid. The acid can only reach the atoms on the outside of the metal. Grinding the same Mg into powder exposes more atoms, so bubbles of H₂ come faster.',focus:[BX,BY,BW,BH],speed:0.5,setup(sim){BioLab.setValues(sim,{rxn:'mg',surf:'powder',cH:2,T:300,cat:false});syncMode(sim);}}
  ],
  onTourExit(sim){const base={};sim.def.controls.forEach(c=>base[c.id]=c.def);BioLab.setValues(sim,base);restart(sim);syncMode(sim);},
  challenges:[
    {lvl:'bio',q:'You double the concentration of A from 0.25 M to 0.50 M. What happens to the reaction rate?',choices:['It goes up, because A and B collide more often','It stays the same, because the temperature did not change','It goes down, because the box is more crowded'],correct:0,
     baseline:{rxn:'gas',cA:0.25,cB:0.5,T:400},change:{cA:0.5},changeText:'Fresh batch mixed with twice as much A',watch:'rt',
     explain:{bio:'More A particles in the same space means more A–B collisions every second. The fraction that react stays the same, so the rate about doubles. Compare the Reaction rate readout before and after.',ap:'Collisions per second scale with [A][B], so doubling [A] doubles Z and the rate. That is why this reaction is first order in A.'}},
    {lvl:'bio',q:'Same mass of magnesium, but ground into powder instead of one chunk. The H₂ bubbles come…',choices:['faster','at the same rate, because it is the same amount of Mg','slower, because the pieces are smaller'],correct:0,
     baseline:{rxn:'mg',surf:'ribbon',cH:2,T:300},change:{surf:'powder'},changeText:'Same Mg, now as powder',watch:'rt',
     explain:{bio:'The acid can only touch the outside of the metal. Powder has far more atoms on its surface, so more H⁺ ions hit Mg every second and the bubbles come faster. The same amount of Mg still makes the same total amount of H₂.'}},
    {lvl:'bio',instant:true,set:{rxn:'gas',cA:0.5,cB:0.5,T:300,cat:false},q:'A and B collide many times a second, yet most collisions make no AB. Why?',choices:['Most collisions are too gentle or hit the wrong way around','A and B do not like each other','The box is too small'],correct:0,
     explain:{bio:'A collision reacts only if it has enough energy to get over the energy hill and A hits the reactive (dark) side of B. Watch the gray rings: each one is a collision that just bounced.',honors:'Check the readouts: about 1–2% of collisions react at 300 K. The rest have E < Eₐ or the wrong orientation.'}},
    {lvl:'honors',q:'You heat the box from 300 K to 400 K. Collisions per second rise by only about 15%. What happens to the share of collisions that react?',choices:['It stays the same; only the number of collisions changes','It roughly triples','It goes down, because fast particles bounce off'],correct:1,
     baseline:{rxn:'gas',cA:0.6,cB:0.6,T:300,Ea:12},change:{T:400},changeText:'Temperature raised to 400 K',watch:'rt',
     explain:{honors:'At 400 K the shaded tail past Eₐ is about 3 times bigger, so about 3 times as many collisions have enough energy. Faster particles collide a little more often, but the energy effect is much larger. The rate jumps at the moment you heat it (see the graph), then falls as A and B get used up.',ap:'f rises from 2.2% to 6.5%, and k rises 3.4 times. Arrhenius predicts exp[(12 000/8.314)(1/300 − 1/400)] ≈ 3.3; the extra bit comes from Z ∝ √T.'}},
    {lvl:'honors',q:'You add a catalyst. What does it change?',choices:['It gives the particles more energy, so the curve shifts to the right','It lowers Eₐ, so more of the same particles are past the line','It makes the particles collide more often'],correct:1,
     baseline:{rxn:'gas',cA:0.6,cB:0.6,T:300,Ea:12},change:{cat:true},changeText:'Catalyst added',watch:'rt',
     explain:{honors:'Watch the energy graph: the blue curve does not move, because the temperature did not change. The dashed green Eₐ line moves left, so a much bigger share of the particles can react. Collisions that react jumps from about 1% to about 8%.'}},
    {lvl:'ap',q:'Rate = k[A][B]. You double both [A] and [B]. The rate quadruples. What happens to the rate constant k?',choices:['k doubles','k quadruples','k stays the same'],correct:2,
     baseline:{rxn:'gas',cA:0.25,cB:0.25,T:450},change:{cA:0.5,cB:0.5},changeText:'Fresh batch with both concentrations doubled',watch:'rt',
     explain:{ap:'Z ∝ [A][B], so doubling both multiplies the initial rate by 4. But k = rate/([A][B]) depends only on T, Eₐ and p, so the k readout does not move. Concentration changes the rate, not the rate constant. Only temperature or a catalyst changes k.'}},
    {lvl:'ap',q:'At 600 K with Eₐ = 6 kJ/mol, about half of all collisions have enough energy. You shrink B’s reactive side from 180° to 90°. The share of collisions that react…',choices:['stays the same, because energy is all that matters','drops to about half','drops to almost zero'],correct:1,
     baseline:{rxn:'gas',cA:0.4,cB:0.4,T:600,Ea:6,orient:180},change:{orient:90},changeText:'Reactive side shrunk to 90° (p = 0.25)',watch:'rt',
     explain:{ap:'The orientation factor p fell from 0.50 to 0.25. Energy is not the only requirement: the colliding particles must also line up. Collisions that react = f × p, so it drops from about 25% to about 12%, and k halves.'}},
    {lvl:'ap',instant:true,set:{rxn:'gas',cA:0.5,cB:0.5,T:300,Ea:12,cat:false},q:'Eₐ = 12 kJ/mol. Use the Arrhenius equation to predict k(400 K) / k(300 K).',choices:['1.33, the ratio of the temperatures','about 3.3','about 12'],correct:1,
     explain:{ap:'ln(k₂/k₁) = (Eₐ/R)(1/T₁ − 1/T₂) = (12 000 J/mol ÷ 8.314)(1/300 − 1/400) = 1.20, so k₂/k₁ = e¹·²⁰ ≈ 3.3. Set T to 300 K and then 400 K and compare the k readouts. Real reactions with Eₐ ≈ 50 kJ/mol roughly double for every 10 °C.'}}
  ],
  onChallenge(sim,ch,phase){if(ch&&ch.instant&&ch.set&&phase==='done'){BioLab.setValues(sim,ch.set);syncMode(sim);}},
  lab:{bio:'<p><b>Question:</b> How do concentration and temperature change how fast a reaction goes? (Like the Mg + HCl and Alka-Seltzer labs.)</p><ol><li>Choose <b>Mg + HCl</b> with one chunk of Mg and 1.0 M HCl at 300 K. Press <b>Mix a fresh batch</b> and record the <b>Time for the Mg to disappear</b>.</li><li>Repeat with 2.0 M and 3.0 M HCl.</li><li>Go back to 1.0 M and repeat at 350 K and 400 K (hot water vs cold water).</li><li>Switch to powder and repeat one trial.</li></ol><p>Which change made the biggest difference? Explain each result using collisions.</p>',
       honors:'<p><b>Question:</b> Why does temperature speed up a reaction so much more than it speeds up collisions?</p><ol><li>Use A + B → AB with Eₐ = 12 kJ/mol. Record a trial at 300 K about 6 s after mixing.</li><li>Repeat at 350, 400, 450 and 500 K. Record <b>Collisions per second</b> and <b>Collisions that react</b>.</li><li>Plot both against temperature using the Trials graph.</li></ol><p>By what factor did collisions per second change from 300 K to 500 K? By what factor did the reaction rate change? Use the Maxwell–Boltzmann curve to explain the difference.</p>',
       ap:'<p><b>Question:</b> Does rate = Z × f × p, and does k follow the Arrhenius equation?</p><ol><li>Set [A] = [B] = 0.50 M, Eₐ = 12 kJ/mol, p = 0.5. About 4 s after mixing, record Z, f and the rate at 300, 350, 400, 450 and 500 K.</li><li>Check that Z × f × p predicts the measured rate.</li><li>Record k at each temperature. Plot ln k against 1/T (make the columns yourself from the copied CSV).</li></ol><p><b>Claim–evidence–reasoning:</b> Find Eₐ from the slope (slope = −Eₐ/R) and compare it with the 12 kJ/mol you set. Explain any difference in terms of how the model counts collision energy.</p>'},
  terms:[{t:'Reaction rate',d:'How fast reactants are used up or products form, for example in mol/L per second (M/s).'},
    {t:'Collision theory',d:'Particles must collide to react, with enough energy and the right orientation.'},
    {t:'Activation energy (Eₐ)',d:'The minimum energy a collision needs for the reaction to happen: the height of the energy hill.'},
    {t:'Catalyst',d:'A substance that speeds up a reaction by giving it a path with lower Eₐ. It is not used up.'},
    {t:'Surface area',d:'For a solid reactant, only the particles on the surface can be hit. Smaller pieces expose more surface.'},
    {lvl:'honors',t:'Maxwell–Boltzmann distribution',d:'The spread of kinetic energies among particles at one temperature. Higher T flattens it and stretches it to higher energies.'},
    {lvl:'honors',t:'Transition state',d:'The highest-energy arrangement along the reaction path, at the top of the energy hill.'},
    {lvl:'honors',t:'Orientation',d:'The direction particles face when they collide. Some orientations cannot form the new bond.'},
    {lvl:'ap',t:'Collision frequency (Z)',d:'Number of collisions per second. Proportional to the concentration of each reactant and to √T.'},
    {lvl:'ap',t:'Arrhenius equation',d:'k = A·e^(−Eₐ/RT). ln k = −(Eₐ/R)(1/T) + ln A, so a plot of ln k vs 1/T has slope −Eₐ/R.'},
    {lvl:'ap',t:'Orientation (steric) factor p',d:'The fraction of collisions with a usable orientation.'}],
  about:'<p><b>What is computed.</b> Every particle has a three-dimensional velocity drawn from the Maxwell–Boltzmann distribution at the box temperature; the box shows the x and y motion, and the hidden z part only adds energy, so particle energies follow the familiar 3-D curve. A thermostat (each particle gets a fresh random velocity about every 1.7 s) plays the role of a water bath. Particles collide elastically. An A–B collision reacts only when the relative kinetic energy ½μv² is at least Eₐ <i>and</i> A strikes the reactive (dark) part of B; the reactive part spans the angle you set, so p = angle/360°. Rates, collision counts, f and k are counted from the particles themselves, so they fluctuate like real data. Concentrations use 80 particles = 1 mol/L.</p><p><b>What is simplified.</b> Real activation energies are usually 40–200 kJ/mol. Here Eₐ is 6–20 kJ/mol so that you can watch single reactions happen in seconds with only about 100 particles. Because fast particles collide more often, the measured fraction of collisions with E ≥ Eₐ (f) is somewhat larger than the fraction of molecules past Eₐ on the curve. The box is 2-D, the reaction A + B → AB is one elementary step, and its heat is carried away by the bath. The catalyst lowers Eₐ to 55% of its value for every collision (as a dissolved catalyst would). In the Mg + HCl mode, chloride ions are spectators, Eₐ for an H⁺ ion striking the metal is set to 5 kJ/mol, each Mg atom needs two successful H⁺ hits (Mg + 2H⁺ → Mg²⁺ + H₂, ΔH = −467 kJ/mol), and only faces touching the solution can be hit. The energy diagram is not to scale for that reaction.</p>',
  initVis(sim){sim.vis.fx=[];},
  draw(sim,ctx,vdt,k,t){const p=sim.p,st=sim.st,hon=atLeast('honors'),ap=atLeast('ap'),mg=p.rxn==='mg',v=sim.vis;
    ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,500);
    // header: equation and conditions
    drawHeader(ctx,p,k,hon);
    // box
    rr(ctx,BX,BY,BW,BH,12);ctx.fillStyle=mg?PAL['cv-water']:PAL['cv-bg2'];ctx.fill();
    const warm=clamp((p.T-300)/300,-1,1);if(warm>0.02){ctx.fillStyle='rgba(230,70,40,'+(0.16*warm).toFixed(3)+')';ctx.fill();}else if(warm<-0.02){ctx.fillStyle='rgba(60,130,230,'+(-0.3*warm).toFixed(3)+')';ctx.fill();}
    ctx.save();rr(ctx,BX,BY,BW,BH,12);ctx.clip();
    // Mg lattice
    if(mg){st.mg.forEach(m=>{if(m.gone)return;drawMg(ctx,m.x,m.y);if(m.h){ctx.fillStyle='#ffffff';ctx.strokeStyle='#8a8f96';ctx.lineWidth=1;ctx.beginPath();ctx.arc(m.x+6,m.y-6,4,0,6.29);ctx.fill();ctx.stroke();}});}
    // particles
    const phi=(p.orient/2)*Math.PI/180;
    st.ps.forEach(q=>drawP(ctx,q,phi,mg));
    // collision flashes
    v.fx=v.fx.filter(f=>(f.a+=vdt)<(f.k==='ok'?0.6:0.35));
    v.fx.forEach(f=>{const u=f.a/(f.k==='ok'?0.6:0.35);ctx.globalAlpha=1-u;ctx.lineWidth=f.k==='ok'?3:2;ctx.strokeStyle=f.k==='ok'?PAL['cv-e']:f.k==='orient'&&hon?PAL['s5']:PAL['cv-soft'];ctx.beginPath();ctx.arc(f.x,f.y,(f.k==='ok'?10:6)+u*(f.k==='ok'?22:10),0,6.29);ctx.stroke();});
    ctx.globalAlpha=1;ctx.restore();
    ctx.lineWidth=3;ctx.strokeStyle=PAL['cv-glass'];rr(ctx,BX,BY,BW,BH,12);ctx.stroke();
    // right panel
    drawMB(ctx,sim,k,hon);
    if(mg)drawKey(ctx,k,hon);else drawProfile(ctx,sim,k,hon,ap);
  },
  thumbSetup(sim){sim.p.T=420;},thumbFrames:60
};
function join(sim,A,B){const st=sim.st,M=A.m+B.m,c=mkP(st,'C',(A.x+B.x)/2,(A.y+B.y)/2,sim.p.T);c.vx=(A.m*A.vx+B.m*B.vx)/M;c.vy=(A.m*A.vy+B.m*B.vy)/M;c.vz=(A.m*A.vz+B.m*B.vz)/M;c.a=B.a;
  A.dead=true;B.dead=true;st.ps.push(c);st.bud-=1;fx(sim,c.x,c.y,'ok');}
function hitMg(sim,q,m,nx,ny){const st=sim.st;q.dead=true;st.bud-=1;st.refill=(st.refill||0)+1;fx(sim,m.x+nx*MGR,m.y+ny*MGR,'ok');
  if(m.h===0){m.h=1;return;}m.gone=true;const ion=mkP(st,'Mg2',m.x,m.y-4,sim.p.T);ion.vy=-Math.abs(ion.vy)-40;st.ps.push(ion);st.ps.push(mkP(st,'H2',m.x+(st.rnd()-.5)*8,m.y-MGR-6,sim.p.T));}
function fx(sim,x,y,kind){const v=sim.vis;if(!v||!v.fx)return;if(kind!=='ok'&&v.fx.length>26)return;v.fx.push({x,y,k:kind,a:0});}
function drawHeader(ctx,p,k,hon){const y=30,s=15*k;
  if(p.rxn==='mg'){txt(ctx,hon?'Mg(s) + 2H⁺(aq) → Mg²⁺(aq) + H₂(g)':'Mg(s) + 2HCl(aq) → MgCl₂(aq) + H₂(g)',BX,y,{s,w:700,b:'middle'});}
  else{let x=BX;const ball=(c,r)=>{ctx.fillStyle=c;ctx.beginPath();ctx.arc(x+r,y,r,0,6.29);ctx.fill();x+=2*r+5;};
    const word=w=>{txt(ctx,w,x,y,{s,w:700,b:'middle'});ctx.font='700 '+s+'px '+FONT;x+=ctx.measureText(w).width+7;};
    ball(PAL['cv-sub'],8*Math.min(k,1.3));word('A');word('+');ball(PAL['cv-prod'],8*Math.min(k,1.3));word('B');word('→');
    const r=8*Math.min(k,1.3);ctx.fillStyle=PAL['cv-sub'];ctx.beginPath();ctx.arc(x+r,y,r,0,6.29);ctx.fill();ctx.fillStyle=PAL['cv-prod'];ctx.beginPath();ctx.arc(x+2.4*r,y,r,0,6.29);ctx.fill();x+=3.4*r+5;word('AB');}
  const tc=p.T-273.15,lab=p.T+' K'+(k>1.35?'':' ('+tc.toFixed(0)+' °C)')+(p.cat&&p.rxn==='gas'?(k>1.35?' · cat.':' · catalyst'):'');ctx.font='700 '+13*k+'px '+FONT;pill(ctx,lab,PX+PW-ctx.measureText(lab).width/2-8*k,y,PAL['card2'],PAL['cv-ink'],13*k);}
function drawP(ctx,q,phi,mg){const x=q.x,y=q.y;
  if(q.k==='A'){ctx.fillStyle=PAL['cv-sub'];ctx.beginPath();ctx.arc(x,y,q.r,0,6.29);ctx.fill();}
  else if(q.k==='B'){ctx.fillStyle=PAL['cv-prod'];ctx.beginPath();ctx.arc(x,y,q.r,0,6.29);ctx.fill();
    ctx.fillStyle=window.ChemLab.shade(PAL['cv-prod'],-0.45);ctx.beginPath();ctx.moveTo(x,y);ctx.arc(x,y,q.r,q.a-phi,q.a+phi);ctx.closePath();ctx.fill();}
  else if(q.k==='C'){const dx=Math.cos(q.a)*6,dy=Math.sin(q.a)*6;ctx.fillStyle=PAL['cv-sub'];ctx.beginPath();ctx.arc(x-dx,y-dy,8,0,6.29);ctx.fill();ctx.fillStyle=PAL['cv-prod'];ctx.beginPath();ctx.arc(x+dx,y+dy,8,0,6.29);ctx.fill();
    ctx.strokeStyle=PAL['s5'];ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,q.r+0.5,0,6.29);ctx.stroke();}
  else if(q.k==='H'){ctx.fillStyle=PAL['cv-h'];ctx.beginPath();ctx.arc(x,y,q.r,0,6.29);ctx.fill();}
  else if(q.k==='Cl'){ctx.fillStyle=PAL['s3'];ctx.globalAlpha=0.75;ctx.beginPath();ctx.arc(x,y,q.r,0,6.29);ctx.fill();ctx.globalAlpha=1;}
  else if(q.k==='Mg2'){ctx.fillStyle='#7d8a99';ctx.beginPath();ctx.arc(x,y,q.r,0,6.29);ctx.fill();ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=1.2;ctx.stroke();}
  else if(q.k==='H2'){ctx.fillStyle=PAL['cv-bubble'];ctx.strokeStyle=PAL['cv-bstroke'];ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(x,y,q.r+4,0,6.29);ctx.fill();ctx.stroke();
    ctx.fillStyle='#e8e8e8';ctx.beginPath();ctx.arc(x-2.5,y,2.6,0,6.29);ctx.arc(x+2.5,y,2.6,0,6.29);ctx.fill();}}
function drawMg(ctx,x,y){const g=ctx.createRadialGradient(x-4,y-4,2,x,y,MGR);g.addColorStop(0,'#eef0f3');g.addColorStop(1,'#7f8790');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,MGR,0,6.29);ctx.fill();ctx.strokeStyle='#5d646c';ctx.lineWidth=1;ctx.stroke();}
function card(ctx,x,y,w,h){rr(ctx,x,y,w,h,10);ctx.fillStyle=PAL['card'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();}
function drawMB(ctx,sim,k,hon){const p=sim.p,st=sim.st,mg=p.rxn==='mg',T=p.T,Ea=eaNow(p),Ea0=mg?EA_MG:p.Ea;
  const y0=BY,h=218;card(ctx,PX,y0,PW,h);const fs=12*k;
  txt(ctx,k>1.35?'Particle energies':hon?'Kinetic energy distribution':'How much energy particles have',PX+12,y0+10+fs,{s:13*k,w:700});
  const L=PX+14,R=PX+PW-14,B=y0+h-14-fs*1.25-fs,Tp=y0+22+fs*1.6;const Emax=mg?16:30;const X=E=>L+E/Emax*(R-L);
  // energies of the reacting particles
  const ks=mg?['H']:['A','B'];const es=[];st.ps.forEach(q=>{if(ks.includes(q.k))es.push(0.5*q.m*(q.vx*q.vx+q.vy*q.vy+q.vz*q.vz)*EU);});
  const nb=20,bw=Emax/nb,hist=new Array(nb).fill(0);es.forEach(e=>{const i=Math.floor(e/bw);if(i>=0&&i<nb)hist[i]++;});
  let fmax=0;for(let E=0.05;E<Emax;E+=0.1)fmax=Math.max(fmax,mbf(E,Math.min(T,300)),mbf(E,T));
  const Y=f=>B-f/fmax*(B-Tp)*0.95;
  if(es.length){ctx.fillStyle=PAL['cv-soft'];ctx.globalAlpha=0.22;hist.forEach((c,i)=>{const f=c/es.length/bw;const y=Y(f);ctx.fillRect(X(i*bw)+1,Math.max(Tp,y),X(bw)-L-2,B-Math.max(Tp,y));});ctx.globalAlpha=1;}
  const curve=(TT,from)=>{ctx.beginPath();ctx.moveTo(X(from),B);for(let E=from;E<=Emax;E+=0.1)ctx.lineTo(X(E),Y(mbf(Math.max(E,1e-4),TT)));ctx.lineTo(X(Emax),B);ctx.closePath();};
  // shaded tails
  if(!mg&&p.cat){curve(T,Ea);ctx.fillStyle=PAL['s3'];ctx.globalAlpha=0.28;ctx.fill();ctx.globalAlpha=1;}
  curve(T,Ea0);ctx.fillStyle=PAL['s1'];ctx.globalAlpha=0.32;ctx.fill();ctx.globalAlpha=1;
  if(T!==300&&hon){ctx.setLineDash([5,4]);ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.5;ctx.beginPath();for(let E=0.05;E<=Emax;E+=0.1){const yy=Y(mbf(E,300));E<0.1?ctx.moveTo(X(E),yy):ctx.lineTo(X(E),yy);}ctx.stroke();ctx.setLineDash([]);}
  ctx.strokeStyle=PAL['s2'];ctx.lineWidth=2.5;ctx.beginPath();for(let E=0.05;E<=Emax;E+=0.1){const yy=Y(mbf(E,T));E<0.1?ctx.moveTo(X(E),yy):ctx.lineTo(X(E),yy);}ctx.stroke();
  // axes
  ctx.strokeStyle=PAL['g-axis'];ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(L,Tp-4);ctx.lineTo(L,B);ctx.lineTo(R,B);ctx.stroke();
  const ticks=mg?[0,5,10,15]:[0,10,20,30];ticks.forEach(E=>txt(ctx,String(E),X(E),B+fs+2,{s:fs,c:PAL['cv-soft'],a:'center'}));
  txt(ctx,'Energy (kJ/mol)',(L+R)/2+18*k,B+2*fs+5,{s:fs,c:PAL['cv-soft'],a:'center'});
  // Ea lines
  const eaLine=(E,c,lab,dash,row)=>{ctx.strokeStyle=c;ctx.lineWidth=2;ctx.setLineDash(dash?[5,4]:[]);ctx.beginPath();ctx.moveTo(X(E),Tp-2);ctx.lineTo(X(E),B);ctx.stroke();ctx.setLineDash([]);
    txt(ctx,lab,X(E)+5,Tp+fs*0.9+row*fs*1.25,{s:fs,w:700,c});};
  eaLine(Ea0,PAL['s1'],hon?'Eₐ':k>1.35?'needed':'energy needed',false,0);
  if(!mg&&p.cat)eaLine(Ea,PAL['s3'],k>1.35?'':hon?'Eₐ with catalyst':'with catalyst',true,1.15);
  const share=tail(Ea,T)*100;const stxt=(share<1?share.toFixed(2):share.toFixed(1))+'% past'+(k>1.35?'':hon?' Eₐ':' the line');ctx.font='700 '+fs+'px '+FONT;const sw=ctx.measureText(stxt).width,xr=R-sw<X(Ea0)+6&&X(Ea0)-6-sw>L+20?X(Ea0)-6:R;
  txt(ctx,stxt,xr,Tp+fs*0.9+2.5*fs*1.25,{s:fs,w:700,c:PAL['s1'],a:'right'});
  if(T!==300&&hon&&k<=1.35)legendMini(ctx,R,Tp+fs*0.9+fs*1.25,k);}
function legendMini(ctx,R,y,k){const fs=12*k;ctx.font=fs+'px '+FONT;const s='dashed: 300 K';const w=ctx.measureText(s).width;txt(ctx,s,R-w,y+fs*1.25*2.3,{s:fs,c:PAL['cv-soft']});}
function drawProfile(ctx,sim,k,hon,ap){const p=sim.p,mg=p.rxn==='mg',y0=BY+228,h=BH-228;card(ctx,PX,y0,PW,h);const fs=12*k;
  txt(ctx,hon&&k<=1.35?'Energy diagram':'The energy hill',PX+12,y0+10+fs,{s:13*k,w:700});
  const L=PX+18,R=PX+PW-16,Tp=y0+24+fs*2.2,B=y0+h-14-fs*1.2;
  const sc=mg?1.6:0.6,Ea0=mg?EA_MG:p.Ea,Ea=eaNow(p),dH=mg?-14:DH_GAS*sc,top=12.5,bot=dH-1;   // drawing units
  const Y=E=>Tp+(top-E)/(top-bot)*(B-Tp),x1=L+44,x2=R-54,xm=(x1+x2)/2;
  const drawPath=(ea,c,dash)=>{ctx.strokeStyle=c;ctx.lineWidth=2.5;ctx.setLineDash(dash?[6,4]:[]);ctx.beginPath();ctx.moveTo(L,Y(0));ctx.lineTo(x1,Y(0));
    for(let i=0;i<=48;i++){const u=i/48,s=(1-Math.cos(Math.PI*u))/2,base=dH*s,bump=Math.pow(Math.sin(Math.PI*u),2);ctx.lineTo(lerp(x1,x2,u),Y(base+bump*(ea*sc-dH/2)));}
    ctx.lineTo(R,Y(dH));ctx.stroke();ctx.setLineDash([]);};
  drawPath(Ea0,PAL['cv-ink'],false);if(!mg&&p.cat)drawPath(Ea,PAL['s3'],true);
  const ya=Y(0),peak=Y(Ea0*sc);
  ctx.strokeStyle=PAL['s1'];ctx.lineWidth=1.5;ctx.setLineDash([3,3]);ctx.beginPath();ctx.moveTo(x1-6,ya);ctx.lineTo(xm+10,ya);ctx.stroke();ctx.setLineDash([]);
  arrow(ctx,xm,ya,xm,peak+3,PAL['s1']);
  txt(ctx,hon?'Eₐ = '+Ea0+' kJ/mol':'energy needed',R,peak-5,{s:fs,w:700,c:PAL['s1'],a:'right'});
  if(!mg&&p.cat&&k<=1.35)txt(ctx,'catalyst path',xm,Y(Ea*sc)+fs*1.3,{s:fs,w:700,c:PAL['s3'],a:'center'});
  txt(ctx,mg?'Mg + 2H⁺':'A + B',L,ya-7,{s:fs,w:700});
  txt(ctx,mg?'Mg²⁺ + H₂':'AB',R,Y(dH)-7,{s:fs,w:700,a:'right'});
  txt(ctx,ap?(mg?'ΔH = −467 kJ/mol, not to scale':'ΔH = '+DH_GAS+' kJ/mol'):'reaction progress →',R,B+fs*1.1,{s:fs,c:PAL['cv-soft'],a:'right'});}
function drawKey(ctx,k,hon){const y0=BY+228,h=BH-228;card(ctx,PX,y0,PW,h);const fs=12*k;txt(ctx,'Key',PX+12,y0+10+fs,{s:13*k,w:700});
  const items=[['H','H⁺ ion (from HCl)'],['Cl','Cl⁻ ion (spectator)'],['Mg','Mg atom in the metal'],['Mg2','Mg²⁺ ion'],['H2','H₂ gas bubble']];
  const gap=Math.min(34,(h-30-fs*1.6)/items.length);items.forEach((it,i)=>{const y=y0+26+fs*1.4+i*gap+gap/2,x=PX+30;
    if(it[0]==='Mg')drawMg(ctx,x,y);else drawP(ctx,{k:it[0],x,y,r:SP[it[0]].r,a:0},0,true);
    txt(ctx,it[1],x+24,y,{s:fs,b:'middle'});});}
function arrow(ctx,x1,y1,x2,y2,c){const a=Math.atan2(y2-y1,x2-x1),h=8;ctx.strokeStyle=c;ctx.fillStyle=c;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2-Math.cos(a)*h*0.7,y2-Math.sin(a)*h*0.7);ctx.stroke();
  ctx.beginPath();ctx.moveTo(x2,y2);ctx.lineTo(x2-Math.cos(a-0.5)*h,y2-Math.sin(a-0.5)*h);ctx.lineTo(x2-Math.cos(a+0.5)*h,y2-Math.sin(a+0.5)*h);ctx.closePath();ctx.fill();}
RATES.controls[0].onChange=sim=>syncMode(sim);
RATES.onLevel=syncMode;
BioLab.register(RATES);
})();
