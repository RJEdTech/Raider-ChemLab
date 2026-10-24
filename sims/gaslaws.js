(function(){
'use strict';
const {clamp,lerp,rr,txt,pill,atLeast,PAL,FONT,RM,axes,legend,serColor}=BioLab.h;
const CL=window.ChemLab;

/* Gas laws. A box of molecules whose pressure is MEASURED from wall collisions.
   Molecules move in 3D (vx, vy, vz) and the picture shows their x–y projection. Every wall hit transfers 2m·v⊥ of momentum (the wall also turns the molecule's sideways motion by a random angle, so energy shares among x, y and z);
   pressure = (total impulse) ÷ (wall length × time), converted to atm with one fixed calibration per container
   (P2D·A = N·kT in the simulation's units maps onto PV = nRT). The gauge therefore averages real, discrete hits.
   To keep the gauge steady, 40 molecules move for every dot drawn; only the drawn ones flash on the walls.
   Temperature: the walls are held at the heater temperature, which nudges the molecules' kinetic energy toward
   (3/2)kT with a 0.6 s time constant (Berendsen thermostat). The piston moves slowly compared with the molecules, so every change is treated as isothermal: bounces off a moving wall are plain reflections. */
const R=0.082057;                  // L·atm/(mol·K)
const KB0=150*150/(3*273);         // sim units: N₂ molecules move at 150 px/s (rms) at 273 K
const EVERY=40;                    // 1 in 40 molecules is drawn
const TPM=4000;                    // molecules per mol in the gas box
const CAP=6400;
const UNITS={atm:{f:1,d:2,l:'atm'},kPa:{f:101.325,d:1,l:'kPa'},mmHg:{f:760,d:0,l:'mmHg'},psi:{f:14.696,d:1,l:'psi'}};
const GAS={
  ideal:{l:'Ideal gas',M:28.0,a:0,b:0,r:4.6,c:'s2'},
  He:{l:'Helium (He)',f:'He',M:4.003,a:0.0346,b:0.0238,r:3.6,c:'s6',Tc:5.2,Tb:4.2,dH:0.083},
  H2:{l:'Hydrogen (H₂)',f:'H₂',M:2.016,a:0.2476,b:0.02661,r:3.6,c:'s5',Tc:33.2,Tb:20.3,dH:0.904},
  N2:{l:'Nitrogen (N₂)',f:'N₂',M:28.01,a:1.370,b:0.0387,r:4.6,c:'s2',Tc:126.2,Tb:77.4,dH:5.57},
  CO2:{l:'Carbon dioxide (CO₂)',f:'CO₂',M:44.01,a:3.640,b:0.04267,r:5.6,c:'s1',Tc:304.2,Tb:194.7,dH:25.2}};
const BOX={x0:80,x1:380,floor:405,pxl:7,Vmin:2,Vmax:45};          // 300 px wide; 7 px of height per liter
const SYR={tip:100,y0:175,y1:285,pxml:19,Vmin:5,Vmax:20};          // 110 px bore; 19 px per mL
const BAL={cx:250,cy:290,pxl:20985,P:1.0};                          // balloon drawn area ∝ volume
const ROOM=295;
const SYR_n=1.0*0.0100/(R*ROOM);   // 10.0 mL of air at 1.00 atm, 22 °C
const BAL_n=1.0*2.00/(R*ROOM);     // a 2.00 L balloon at 1.00 atm, 22 °C
const BATH={ln2:{T:77,l:'Liquid nitrogen (−196 °C)'},ice:{T:273,l:'Ice water (0 °C)'},room:{T:295,l:'Room-temperature water (22 °C)'},warm:{T:323,l:'Warm water (50 °C)'},boil:{T:373,l:'Boiling water (100 °C)'}};

const gauss=()=>{let u=0,v=0;while(u===0)u=Math.random();while(v===0)v=Math.random();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);};
const gasOf=p=>p.mode==='box'?(GAS[p.gas]||GAS.ideal):GAS.ideal;
const isReal=p=>p.mode==='box'&&p.gas!=='ideal';
function vdw(n,V,T,g){if(!g||!g.a)return n*R*T/V;return n*R*T/(V-n*g.b)-g.a*n*n/(V*V);}
function vdwV(n,P,T,g){if(!g||!g.a)return n*R*T/P; // largest root (gas branch) of the van der Waals equation
  let hi=400,f=V=>vdw(n,V,T,g)-P;if(f(hi)>0)return n*R*T/P;
  for(let V=hi;V>n*g.b*1.02;V*=0.97){if(f(V)>=0){let a=V,b=V/0.97;for(let i=0;i<50;i++){const m=(a+b)/2;if(f(m)>=0)a=m;else b=m;}return (a+b)/2;}}
  return n*R*T/P;}
function pvap(g,T){if(!g.Tc||T>=g.Tc)return Infinity; // rough vapor/sublimation pressure (atm), Clausius–Clapeyron
  if(g===GAS.CO2&&T>216.6)return 5.11*Math.exp(16700/8.314*(1/216.6-1/T));
  return Math.exp(g.dH*1000/8.314*(1/g.Tb-1/T));}
const fmtP=(atm,u)=>{const U=UNITS[u]||UNITS.atm,v=atm*U.f;if(!Number.isFinite(v))return '—';return (v>=1000?v.toFixed(0):v<0.1&&U.d<3?v.toFixed(U.d+1):v.toFixed(U.d))+' '+U.l;};
const fmtV=V=>V>=10?V.toFixed(1)+' L':V.toFixed(2)+' L';
const degC=T=>Math.round(T-273.15)+0;

/* ---------- container geometry ---------- */
function nOf(p){return p.mode==='box'?p.mol:p.mode==='syringe'?SYR_n:BAL_n;}
function NOf(p){return p.mode==='box'?Math.round(p.mol*TPM):p.mode==='syringe'?2400:3200;}
function Tset(p){return p.mode==='box'?p.T:p.mode==='syringe'?ROOM:(BATH[p.bath]||BATH.room).T;}
function AoV(mode){return mode==='box'?(BOX.x1-BOX.x0)*BOX.pxl:mode==='syringe'?SYR.pxml*(SYR.y1-SYR.y0)*1000:BAL.pxl;}
function geoFor(mode,V){
  if(mode==='box')return {t:'rect',x0:BOX.x0,x1:BOX.x1,y0:BOX.floor-BOX.pxl*V,y1:BOX.floor};
  if(mode==='syringe')return {t:'rect',x0:SYR.tip,x1:SYR.tip+SYR.pxml*V*1000,y0:SYR.y0,y1:SYR.y1};
  return {t:'circ',cx:BAL.cx,cy:BAL.cy,r:Math.sqrt(V*BAL.pxl/Math.PI)};}
function Vtarget(sim){const p=sim.p,st=sim.st,g=gasOf(p);
  if(p.mode==='syringe')return p.syr/1000;
  if(p.mode==='balloon')return st.n*R*st.Tkin/BAL.P;
  if(p.hold==='V')return p.vol;
  return clamp(vdwV(st.n,p.pext,st.Tkin,g),BOX.Vmin,BOX.Vmax);}

function spawn(st,i,x,y,T,dir){const s=Math.sqrt(KB0*T/st.m);st.x[i]=x;st.y[i]=y;st.vx[i]=gauss()*s;st.vy[i]=gauss()*s;st.vz[i]=gauss()*s;if(dir)st.vx[i]=Math.abs(st.vx[i])+s*0.6;}
function randIn(st){const g=st.geo;if(g.t==='rect')return [lerp(g.x0+2,g.x1-2,Math.random()),lerp(g.y0+2,g.y1-2,Math.random())];
  const a=Math.random()*6.2832,r=Math.sqrt(Math.random())*(g.r-3);return [g.cx+Math.cos(a)*r,g.cy+Math.sin(a)*r];}
function build(p){const T=Tset(p),g=gasOf(p);const st={mode:p.mode,n:nOf(p),N:NOf(p),m:g.M/28,Tkin:T,
    x:new Float64Array(CAP),y:new Float64Array(CAP),vx:new Float64Array(CAP),vy:new Float64Array(CAP),vz:new Float64Array(CAP),
    hits:[],hitN:0,hitT:0,hps:0,Pema:0,acc:null,steadyT:0,sig:'',chg:null,capped:false,gas:p.gas};
  let V;if(p.mode==='box')V=p.hold==='V'?p.vol:clamp(vdwV(st.n,p.pext,T,g),BOX.Vmin,BOX.Vmax);else if(p.mode==='syringe')V=p.syr/1000;else V=st.n*R*T/BAL.P;
  st.V=V;st.geo=geoFor(p.mode,V);for(let i=0;i<st.N;i++){const q=randIn(st);spawn(st,i,q[0],q[1],T);}
  st.Pema=isReal(p)?vdw(st.n,V,T,g):st.n*R*T/V;st.sig=sigOf(p);st.snap=snapOf(p);return st;}
function ensure(sim){if(!sim.st||sim.st.mode!==sim.p.mode)sim.st=build(sim.p);}
const KEYS=['mode','hold','vol','T','mol','pext','syr','bath','gas'];
function sigOf(p){return KEYS.map(k=>p[k]).join('|');}
function snapOf(p){const o={};KEYS.forEach(k=>o[k]=p[k]);return o;}

/* pressure the gauge shows (atm) */
function Pread(sim){const st=sim.st,p=sim.p;if(!st)return NaN;if(isReal(p))return vdw(st.n,st.V,st.Tkin,gasOf(p));
  return st.acc&&st.acc.t>=1.5?st.acc.imp/st.acc.perT*st.cal:st.Pema;}
function Pideal(sim){const st=sim.st;return st.n*R*st.Tkin/st.V;}

/* ---------- physics step ---------- */
function stepGas(sim,dt){ensure(sim);const p=sim.p,st=sim.st,g=gasOf(p);
  if(p.gas!==st.gas){const f=Math.sqrt(st.m/(g.M/28));for(let i=0;i<st.N;i++){st.vx[i]*=f;st.vy[i]*=f;st.vz[i]*=f;}st.m=g.M/28;st.gas=p.gas;}
  // pump: add or remove molecules
  const Nt=NOf(p);if(Nt!==st.N){if(Nt>st.N){for(let i=st.N;i<Nt&&i<CAP;i++){const gg=st.geo;spawn(st,i,gg.x0+3,Math.min(gg.y1-4,Math.max(gg.y0+3,gg.y1-12+Math.random()*6)),st.Tkin,true);}}st.N=Math.min(CAP,Nt);st.n=nOf(p);}
  // what changed?
  const sig=sigOf(p);if(sig!==st.sig){const old=st.snap,nw=snapOf(p);const k=KEYS.filter(k=>old[k]!==nw[k]);st.chg={keys:k,P0:Pread(sim),V0:st.V,T0:st.Tkin,t:sim.t};st.sig=sig;st.snap=nw;st.acc=null;st.steadyT=0;}
  const T0=Tset(p),tauT=p.mode==='balloon'?1.4:0.6,m=st.m;
  let imp=0,perT=0;let left=dt;
  while(left>1e-9){const h=Math.min(left,0.005);left-=h;
    // move the walls
    const Vt=Vtarget(sim);let ux=0,uy=0,ur=0;const go=st.geo;
    if(p.mode==='balloon'){const nv=st.V+(Vt-st.V)*Math.min(1,h/0.3);const ng=geoFor('balloon',nv);ur=(ng.r-go.r)/h;st.V=nv;st.geo=ng;}
    else{const nv0=st.V+(Vt-st.V)*Math.min(1,h/0.12);let ng=geoFor(p.mode,nv0);
      const maxd=150*h;if(p.mode==='box'){const d=ng.y0-go.y0;if(Math.abs(d)>maxd){ng=Object.assign({},go,{y0:go.y0+Math.sign(d)*maxd});}uy=(ng.y0-go.y0)/h;st.V=(BOX.floor-ng.y0)/BOX.pxl;}
      else{const d=ng.x1-go.x1;if(Math.abs(d)>maxd){ng=Object.assign({},go,{x1:go.x1+Math.sign(d)*maxd});}ux=(ng.x1-go.x1)/h;st.V=(ng.x1-SYR.tip)/SYR.pxml/1000;}
      st.geo=ng;}
    st.capped=p.mode==='box'&&p.hold==='P'&&(vdwV(st.n,p.pext,st.Tkin,g)>BOX.Vmax+0.05||vdwV(st.n,p.pext,st.Tkin,g)<BOX.Vmin-0.05);
    const G=st.geo,X=st.x,Y=st.y,VX=st.vx,VY=st.vy,VZ=st.vz,N=st.N;let ke=0;
    if(G.t==='rect'){const x0=G.x0,x1=G.x1,y0=G.y0,y1=G.y1;
      for(let i=0;i<N;i++){let x=X[i]+VX[i]*h,y=Y[i]+VY[i]*h;const dr=i%EVERY===0;
        if(x<x0){x=2*x0-x;if(VX[i]<0){imp+=-2*m*VX[i];VX[i]=-VX[i];spinX(VY,VZ,i);if(dr)hit(st,x0,y,'v');}}
        else if(x>x1){x=2*x1-x;if(VX[i]>0){imp+=2*m*VX[i];VX[i]=-VX[i];spinX(VY,VZ,i);if(dr)hit(st,x1,y,'v');}}
        if(y>y1){y=2*y1-y;if(VY[i]>0){imp+=2*m*VY[i];VY[i]=-VY[i];spinX(VX,VZ,i);if(dr)hit(st,x,y1,'h');}}
        else if(y<y0){y=2*y0-y;if(VY[i]<0){imp+=-2*m*VY[i];VY[i]=-VY[i];spinX(VX,VZ,i);if(dr)hit(st,x,y0,'h');}}
        X[i]=x<x0?x0+0.1:x>x1?x1-0.1:x;Y[i]=y<y0?y0+0.1:y>y1?y1-0.1:y;
        ke+=VX[i]*VX[i]+VY[i]*VY[i]+VZ[i]*VZ[i];}
      perT+=2*((x1-x0)+(y1-y0))*h;}
    else{const cx=G.cx,cy=G.cy,r=G.r;
      for(let i=0;i<N;i++){let x=X[i]+VX[i]*h,y=Y[i]+VY[i]*h;const dx=x-cx,dy=y-cy,d=Math.hypot(dx,dy);
        if(d>r){const nx=dx/d,ny=dy/d,vn=VX[i]*nx+VY[i]*ny;if(vn>0){const dv=2*vn;imp+=m*dv;VX[i]-=dv*nx;VY[i]-=dv*ny;{const vt=-VX[i]*ny+VY[i]*nx,vnn=VX[i]*nx+VY[i]*ny,a=Math.random()*6.2832,c=Math.cos(a),sn=Math.sin(a),t2=vt*c-VZ[i]*sn;VZ[i]=vt*sn+VZ[i]*c;VX[i]=vnn*nx-t2*ny;VY[i]=vnn*ny+t2*nx;}if(i%EVERY===0)hit(st,cx+nx*r,cy+ny*r,'c',Math.atan2(ny,nx));}
          const nd=Math.max(0,Math.min(r-0.2,2*r-d));x=cx+nx*nd;y=cy+ny*nd;}
        X[i]=x;Y[i]=y;ke+=VX[i]*VX[i]+VY[i]*VY[i]+VZ[i]*VZ[i];}
      perT+=2*Math.PI*r*h;}
    // thermostat: the walls are at the heater (or bath) temperature
    const Tk=N?m*ke/(3*N*KB0):T0;let l2=1+h/tauT*(T0/Math.max(Tk,1)-1);l2=clamp(l2,0.8,1.25);const l=Math.sqrt(l2);
    for(let i=0;i<N;i++){VX[i]*=l;VY[i]*=l;VZ[i]*=l;}st.Tkin=Tk*l2;}
  st.cal=AoV(p.mode)*(st.n/Math.max(1,st.N))*R/KB0;
  const Pin=perT>0?imp/perT*st.cal:0;st.Pema+=(Pin-st.Pema)*Math.min(1,dt/0.8);
  // wall-hit flashes and counts (drawn dots only)
  st.hitT+=dt;if(st.hitT>=1){st.hps=st.hitN/st.hitT;st.hitN=0;st.hitT=0;}
  for(const q of st.hits)q.age+=dt;while(st.hits.length&&st.hits[0].age>0.35)st.hits.shift();
  // settled average for the readout and the graph points
  const Vt=Vtarget(sim),steady=Math.abs(Vt-st.V)/st.V<0.003&&Math.abs(st.Tkin-T0)/T0<0.004;
  if(steady){st.steadyT+=dt;}else{st.steadyT=0;st.acc=null;}
  if(st.steadyT>0.8){if(!st.acc)st.acc={imp:0,perT:0,t:0};st.acc.imp+=imp;st.acc.perT+=perT;st.acc.t+=dt;
    if(st.acc.t>=1.5)addPoint(sim);}}
/* rotate the two velocity components along a wall by a random angle: speed and the normal bounce are unchanged,
   but energy can move between directions (equilibrium is unchanged by this) */
function spinX(A,B,i){const a=Math.random()*6.2832,c=Math.cos(a),s=Math.sin(a),u=A[i],w=B[i];A[i]=u*c-w*s;B[i]=u*s+w*c;}
function hit(st,x,y,o,a){st.hitN++;if(st.hits.length<70)st.hits.push({x,y,o,a,age:0});}
function addPoint(sim){const p=sim.p,st=sim.st;if(!sim.gpts)sim.gpts=[];const sig=st.sig;
  const q={sig,mode:p.mode,hold:p.hold,n:st.n,T:Tset(p),V:st.V,P:Pread(sim),pext:p.pext,gas:p.mode==='box'?p.gas:'ideal'};
  const i=sim.gpts.findIndex(o=>o.sig===sig);if(i>=0)sim.gpts[i]=q;else{sim.gpts.push(q);if(sim.gpts.length>80)sim.gpts.shift();}}

/* ---------- show only what the current mode uses ---------- */
function sync(sim){if(!sim.ui||!sim.ui.sec)return;const d=sim.def,p=sim.p;
  const vis=o=>atLeast(o.lvl)&&(!o.modes||o.modes.includes(p.mode))&&(!o.when||o.when(p));
  d.controls.forEach(c=>{const cid=d.id+'-'+c.id,e=document.getElementById(cid)||document.getElementById(cid+'-l');if(!e)return;const w=e.closest('.ctl');if(w)w.hidden=!vis(c);});
  d.metrics.forEach(m=>{const t=sim.ui.tiles[m.id];if(!t)return;const w=t.num.closest('.tile');if(w)w.hidden=!vis(m);});
  const btns=[...sim.ui.sec.querySelectorAll('.actions button')];(d.actions||[]).forEach((a,i)=>{if(btns[i])btns[i].hidden=!vis(a);});}
function onHold(sim){if(sim.st&&sim.p.hold==='V'&&sim.st.mode==='box'){const v=Math.round(clamp(sim.st.V,BOX.Vmin,BOX.Vmax)*10)/10;if(Math.abs(v-sim.p.vol)>0.05)BioLab.setValues(sim,{vol:v});}sync(sim);}

/* ---------- the definition ---------- */
const SIM={
  id:'gaslaws',hash:'gaslaws',apUnit:9,order:1,tab:'Gas laws',kind:'Simulation',
  prereq:['states'],next:['kmt','gasstoich','airbag','phasediagram'],
  card:'Squeeze, heat and pump a box of gas molecules, measure the pressure from their wall hits, and find absolute zero yourself.',
  title:'Gas laws: pressure, volume, temperature and amount',
  lede:{bio:'Gas pressure is billions of molecules hitting the walls. Squeeze the gas, heat it or let the piston float, and watch how pressure, volume and temperature push on each other.',
        honors:'Hold one variable constant and change another to test Boyle’s, Charles’s, Gay-Lussac’s and Avogadro’s laws. Compare the measured pressure with PV = nRT, and convert between atm, kPa, mmHg and psi.',
        ap:'Measure R from your own data, linearize P vs 1/V, extrapolate V vs T to absolute zero, and see where real gases (He, H₂, N₂, CO₂) leave the ideal gas law behind.'},
  scale:{bio:'Gas box: 22.4 L, about the size of a backpack. At 0 °C and 1 atm it holds 1 mol of gas (6.02 × 10²³ molecules), so each dot you see stands for 1/100 of a mole. The molecules really move about 500 m/s; here they are slowed by billions of times.',
         honors:'Gas box up to 45 L (1 mol fills 22.4 L at STP; each dot is 0.01 mol). Boyle’s syringe: a 20 mL lab syringe on a pressure sensor. Charles’s balloon: about 2 L of air. Real molecules move about 500 m/s; here they are slowed by billions of times.'},
  timeScale:1,dtMax:0.01,prewarm:1.5,sampleDt:0.1,window:30,unit:'s',chChange:2,chReveal:9,
  controls:[
    {id:'mode',label:'Setup',type:'seg',def:'box',lvl:'bio',options:[{v:'box',l:'Gas box'},{v:'syringe',l:'Boyle’s syringe'},{v:'balloon',l:'Charles’s balloon'}],onChange(sim){sync(sim);sim.infoDirty=true;}},
    {id:'hold',label:'Hold constant',type:'seg',def:'V',lvl:'bio',modes:['box'],options:[{v:'V',l:'Volume (piston locked)'},{v:'P',l:'Pressure (piston floats)'}],help:'Temperature stays fixed until you move the temperature slider.',onChange:onHold},
    {id:'vol',label:'Volume',type:'range',min:2,max:45,step:0.1,def:22.4,unit:' L',lvl:'bio',modes:['box'],when:p=>p.hold==='V',noTrial:true,help:'Push the piston down or pull it up.'},
    {id:'T',label:'Temperature (heater)',type:'range',min:50,max:1000,step:1,def:273,unit:' K',lvl:'bio',modes:['box'],noTrial:true,help:'Kelvin = °C + 273. 273 K is 0 °C.'},
    {id:'mol',label:'Amount of gas',type:'range',min:0.1,max:1.5,step:0.05,def:1,unit:' mol',lvl:'honors',modes:['box'],noTrial:true,help:'The pump adds gas; the valve lets it out.'},
    {id:'pext',label:'Outside pressure on the piston',type:'range',min:0.5,max:3,step:0.05,def:1,unit:' atm',lvl:'honors',modes:['box'],when:p=>p.hold==='P',help:'Air plus the weights stacked on the piston.'},
    {id:'syr',label:'Plunger position',type:'range',min:5,max:20,step:0.5,def:10,unit:' mL',lvl:'bio',modes:['syringe'],noTrial:true,help:'The syringe is sealed onto the sensor at 10.0 mL and room air pressure.'},
    {id:'bath',label:'Water bath',type:'seg',def:'room',lvl:'bio',modes:['balloon'],noTrial:true,options:[{v:'ln2',l:'Liquid N₂',lvl:'honors'},{v:'ice',l:'Ice water'},{v:'room',l:'Room temp'},{v:'warm',l:'Warm'},{v:'boil',l:'Boiling'}]},
    {id:'gas',label:'Gas',type:'select',def:'ideal',lvl:'ap',modes:['box'],options:Object.keys(GAS).map(k=>({v:k,l:k==='ideal'?'Ideal gas (no size, no attractions)':GAS[k].l+': real gas'})),help:'Real gases use the van der Waals equation with each gas’s a and b.',onChange(sim){sync(sim);}},
    {id:'punit',label:'Pressure units on the gauge',type:'seg',def:'atm',lvl:'bio',noTrial:true,options:[{v:'atm',l:'atm'},{v:'kPa',l:'kPa'},{v:'mmHg',l:'mmHg'},{v:'psi',l:'psi'}]}
  ],
  actions:[
    {id:'pump',label:'Pump in gas (+0.1 mol)',lvl:'honors',modes:['box'],run(sim){BioLab.setValues(sim,{mol:Math.min(1.5,Math.round((sim.p.mol+0.1)*100)/100)});}},
    {id:'vent',label:'Let some out (−0.1 mol)',lvl:'honors',modes:['box'],run(sim){BioLab.setValues(sim,{mol:Math.max(0.1,Math.round((sim.p.mol-0.1)*100)/100)});}},
    {id:'clearpts',label:'Clear graph points',lvl:'bio',run(sim){sim.gpts=[];}}
  ],
  init(sim){return build(sim.p);},
  step:stepGas,
  metrics:[
    {id:'P',label:'Pressure (gauge)',unit:'atm',lvl:'bio',min:0,max:null,d:2,get:s=>Pread(s)},
    {id:'Pconv',label:'Same pressure in other units',unit:'',lvl:'bio',text:true,noTrial:true,get:s=>{const P=Pread(s);return ['kPa','mmHg','psi'].map(u=>fmtP(P,u)).join(' = ');}},
    {id:'V',label:'Volume',unit:'L',lvl:'bio',min:0,max:45,d:2,modes:['box','balloon'],get:s=>s.p.mode==='syringe'?NaN:s.st.V},
    {id:'Vml',label:'Syringe volume',unit:'mL',lvl:'bio',min:0,max:20,d:1,modes:['syringe'],get:s=>s.p.mode==='syringe'?s.st.V*1000:NaN},
    {id:'TK',label:'Gas temperature',unit:'K',lvl:'bio',min:0,max:1000,d:0,get:s=>s.st.Tkin},
    {id:'TC',label:'Gas temperature',unit:'°C',lvl:'bio',min:-273,max:727,d:0,get:s=>degC(s.st.Tkin)},
    {id:'hits',label:'Wall hits per second by the dots you see',unit:'per s',lvl:'bio',min:0,max:null,d:0,noTrial:true,get:s=>s.st.hps},
    {id:'nmol',label:'Amount of gas',unit:'mol',lvl:'honors',min:0,max:1.5,d:3,get:s=>CL.toSig(s.st.n,3)},
    {id:'Pid',label:'Pressure from PV = nRT',unit:'atm',lvl:'honors',min:0,max:null,d:2,get:s=>Pideal(s)},
    {id:'PVT',label:'P × V ÷ T',unit:'L·atm/K',lvl:'honors',min:0,max:null,d:4,get:s=>CL.toSig(Pread(s)*s.st.V/s.st.Tkin,3)},
    {id:'Rx',label:'R from your readings (PV ÷ nT)',unit:'L·atm/(mol·K)',lvl:'ap',min:0,max:0.1,d:4,get:s=>Pread(s)*s.st.V/(s.st.n*s.st.Tkin)},
    {id:'Z',label:'Compressibility Z = PV ÷ nRT',unit:'',lvl:'ap',min:0,max:2,d:3,get:s=>Pread(s)/Pideal(s)},
    {id:'vrms',label:'rms speed of the molecules',unit:'m/s',lvl:'honors',min:0,max:null,d:0,noTrial:true,get:s=>Math.sqrt(3*8.314*s.st.Tkin/(gasOf(s.p).M/1000))}
  ],
  graphs:[
    {id:'pv',label:'Pressure vs volume (Boyle)',lvl:'bio',custom:true},
    {id:'pinv',label:'Pressure vs 1/V',lvl:'honors',custom:true},
    {id:'vt',label:'Volume vs temperature (Charles)',lvl:'bio',custom:true},
    {id:'pt',label:'Pressure vs temperature (Gay-Lussac)',lvl:'bio',custom:true},
    {id:'plive',label:'Pressure over time',lvl:'bio',lines:['P']},
    {id:'pcmp',label:'Measured vs PV = nRT',lvl:'honors',lines:['P','Pid']},
    {id:'z',label:'Real gases: Z vs P',lvl:'ap',custom:true}],
  defaultGraph:'pv',
  plot(sim,ctx,box,id){plotGas(sim,ctx,box,id);},
  narrate(sim){ensure(sim);return narrateGas(sim);},
  tour:[
    {title:'A box of gas molecules',text:{bio:'Each dot is a gas molecule (really, each one stands for 1/100 of a mole). They fly in straight lines until they hit a wall. The box holds 1 mol of gas at 0 °C in 22.4 L.',honors:'1.00 mol of gas at STP (273 K, 1.00 atm) fills 22.4 L: the molar volume. Each dot here stands for 0.01 mol.'},focus:[BOX.x0-14,BOX.floor-BOX.pxl*22.4-56,BOX.x1-BOX.x0+28,BOX.pxl*22.4+92],speed:0.5,setup(sim){BioLab.setValues(sim,{mode:'box',hold:'V',vol:22.4,T:273,mol:1,pext:1,gas:'ideal'});}},
    {title:'Pressure is wall hits',text:'Watch the orange flashes: each one is a molecule bouncing off a wall. Every bounce pushes the wall a tiny bit. Billions of pushes each second add up to the pressure the gauge reads.',focus:[[BOX.x0-14,BOX.floor-BOX.pxl*22.4-56,BOX.x1-BOX.x0+28,BOX.pxl*22.4+92],[418,16,176,240]],speed:0.15},
    {title:'Squeeze it: Boyle’s law',text:{bio:'Push the piston down to half the volume. The same molecules have half the room, so they hit the walls twice as often. The pressure doubles.',honors:'At constant T and n, P₁V₁ = P₂V₂. Halving V from 22.4 L to 11.2 L doubles P from 1.00 to 2.00 atm.'},focus:[[BOX.x0-10,150,BOX.x1-BOX.x0+20,295],[418,16,176,240]],speed:0.5,setup(sim){BioLab.setValues(sim,{vol:11.2});}},
    {title:'Heat it in a rigid box: Gay-Lussac’s law',text:{bio:'Lock the volume and turn up the heater. Hotter molecules move faster, so they hit the walls harder and more often. The pressure rises.',honors:'At constant V and n, P ∝ T in kelvin: P₁/T₁ = P₂/T₂. Doubling T from 273 K to 546 K doubles P.'},focus:[[BOX.x0-14,BOX.floor-BOX.pxl*22.4-30,BOX.x1-BOX.x0+28,BOX.pxl*22.4+68],[418,36,370,350]],speed:0.5,setup(sim){BioLab.setValues(sim,{vol:22.4,T:546});}},
    {title:'Let the piston float: Charles’s law',text:{bio:'Now the piston floats, so the pressure stays the same. Heat the gas and it pushes the piston up: hotter gas takes up more space.',honors:'At constant P and n, V ∝ T in kelvin: V₁/T₁ = V₂/T₂. Always use kelvin. In °C, 0 °C would mean zero volume, which is wrong. Extend a V vs T graph to V = 0 and it hits −273 °C, absolute zero.'},focus:[BOX.x0-14,60,BOX.x1-BOX.x0+28,380],speed:0.5,setup(sim){BioLab.setValues(sim,{hold:'P',pext:1,T:273});sim.st.Tkin=273;},pause:false},
    {title:'Lab: Boyle’s syringe',text:'A real lab version: a sealed 20 mL syringe on a pressure sensor. Push the plunger from 10 mL to 5 mL and the reading doubles. Try it, and record P and V in the data table.',focus:[0,30,800,300],speed:0.5,setup(sim){BioLab.setValues(sim,{mode:'syringe',syr:5,punit:'kPa'});}},
    {title:'Lab: Charles’s balloon',text:{bio:'A balloon in ice water shrinks a little; in boiling water it grows. The air pressure outside stays 1 atm, so the volume follows the temperature.',honors:'Volume follows kelvin temperature: from 295 K to 273 K is only 7% smaller, even though 22 °C to 0 °C sounds like a huge drop. Liquid nitrogen (77 K) makes it far smaller.'},focus:[30,100,440,340],speed:0.5,setup(sim){BioLab.setValues(sim,{mode:'balloon',bath:'ice',punit:'atm'});}},
    {lvl:'ap',title:'Real gases',text:'In a small volume at low temperature, CO₂ molecules spend time close together and attract each other, so they hit the walls less hard: the real pressure is lower than PV = nRT predicts (Z < 1). At very high pressure, the molecules’ own size wins and Z > 1. The van der Waals equation adds both effects.',focus:[[BOX.x0-14,BOX.floor-40,BOX.x1-BOX.x0+28,60],[410,372,385,76]],speed:0.5,setup(sim){BioLab.setValues(sim,{mode:'box',hold:'V',vol:2,T:250,mol:1,gas:'CO2'});}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{mode:'box',hold:'V',vol:22.4,T:273,mol:1,pext:1,gas:'ideal',punit:'atm',syr:10,bath:'room'});},
  challenges(sim){return CH;},
  lab:{bio:'<p><b>Question:</b> How does squeezing a gas change its pressure?</p><ol><li>Use the Gas box with Hold constant set to Volume and the temperature at 273 K.</li><li>Set the volume to 40, 30, 22.4, 15, 10 and 5 L. At each one, wait for the pressure to settle, then press Record trial.</li><li>Use the Trials graph with Volume on x and Pressure on y. The Pressure vs volume graph also fills in by itself.</li></ol><p>Describe the shape of the graph. What happens to the pressure each time you halve the volume? Multiply P × V for each trial: what do you notice?</p>',
       honors:'<p><b>Question:</b> How does temperature change the volume of a gas at constant pressure, and where is absolute zero?</p><ol><li>Gas box, Hold constant: Pressure (piston floats), outside pressure 1.00 atm, 1.00 mol.</li><li>Record trials at 150, 250, 350, 450 and 550 K.</li><li>Open the Volume vs temperature graph. It plots in °C and extends your line to zero volume.</li></ol><p>Read the temperature where your line reaches V = 0 and find the percent error from −273.15 °C. Then use the combined gas law (P₁V₁/T₁ = P₂V₂/T₂) to predict one new trial before you run it.</p>',
       ap:'<p><b>Question:</b> How well do real gases follow PV = nRT?</p><ol><li>Gas box, Hold constant: Volume, 1.00 mol, 250 K. Choose Ideal gas and record trials at 20, 10, 5, 3 and 2 L.</li><li>Repeat with He, N₂ and CO₂.</li><li>For each trial compute Z = PV/nRT (the tile does it too) and plot Z against P.</li></ol><p><b>Claim–evidence–reasoning:</b> Which gas deviates most and in which direction? Use the van der Waals constants a and b to explain why CO₂ has Z &lt; 1 here but He has Z &gt; 1.</p>'},
  terms:[{t:'Pressure (P)',d:'The force of molecules hitting a surface, per unit area. 1 atm = 101.325 kPa = 760 mmHg = 14.7 psi.'},{t:'Volume (V)',d:'The space the gas fills: the whole container. Measured in L or mL.'},
    {t:'Temperature (T)',d:'A measure of the average kinetic energy of the molecules. Gas laws need kelvin: K = °C + 273.'},{t:'Boyle’s law',d:'At constant temperature, pressure and volume are inversely related: P₁V₁ = P₂V₂.'},
    {t:'Charles’s law',d:'At constant pressure, volume is proportional to kelvin temperature: V₁/T₁ = V₂/T₂.'},{t:'Gay-Lussac’s law',d:'At constant volume, pressure is proportional to kelvin temperature: P₁/T₁ = P₂/T₂.'},
    {lvl:'honors',t:'Combined gas law',d:'P₁V₁/T₁ = P₂V₂/T₂ for a fixed amount of gas.'},{lvl:'honors',t:'Avogadro’s law',d:'At constant T and P, volume is proportional to moles of gas: V₁/n₁ = V₂/n₂.'},
    {lvl:'honors',t:'Absolute zero',d:'0 K = −273.15 °C, where an ideal gas would have zero volume and zero pressure.'},{lvl:'honors',t:'STP',d:'Standard temperature and pressure: 273 K and 1 atm. One mole of an ideal gas fills 22.4 L at STP.'},
    {lvl:'ap',t:'Ideal gas law',d:'PV = nRT, with R = 0.08206 L·atm/(mol·K) = 8.314 J/(mol·K).'},{lvl:'ap',t:'Real gas',d:'A gas whose molecules have volume and attract each other, so it deviates from PV = nRT at high pressure and low temperature.'},
    {lvl:'ap',t:'van der Waals equation',d:'(P + an²/V²)(V − nb) = nRT. a corrects for attractions, b for the molecules’ own volume.'},{lvl:'ap',t:'Compressibility factor (Z)',d:'Z = PV/nRT. Z = 1 for an ideal gas, Z < 1 when attractions win, Z > 1 when molecular size wins.'}],
  about:'<p><b>How the pressure is measured.</b> The molecules move in three dimensions; you see their side view. Each time one hits a wall it bounces and pushes the wall with an impulse of 2mv⊥. The gauge adds up those impulses, divides by the wall length and the time, and converts to atm with one fixed calibration per container. So the reading is a real count of collisions, and it averages toward nRT/V. After the readings settle, the pressure tile shows the average since the last change, so it gets steadier the longer you wait. To keep the gauge from jumping around, 40 molecules move for each dot drawn; only the drawn dots flash on the walls and count toward “wall hits per second”.</p><p><b>Temperature.</b> The walls are held at the heater (or water-bath) temperature, and the molecules’ average kinetic energy relaxes toward (3/2)kT in about a second. The piston and plunger move slowly compared with the molecules, so the walls keep the gas at the set temperature the whole time (an isothermal change). A real, fast push would warm the gas for a moment. Molecule speeds are drawn in proportion to √(T/M), about a billion times slower than real (N₂ at 273 K really averages about 490 m/s).</p><p><b>Simplifications.</b> Molecules do not collide with each other in the ideal gas (their size is negligible), which does not change the pressure. In real-gas mode the gauge shows the van der Waals pressure for the gas you choose (a and b from standard tables), while the dots still move as an ideal gas. Below the boiling point (or the CO₂ sublimation point) a real gas would condense; the narration warns you when that would happen, but the model does not condense. The balloon’s drawn area, not its radius cubed, is proportional to its volume, and its rubber adds no extra pressure. In liquid nitrogen, part of the air in a real balloon turns to liquid, so it shrinks even more than Charles’s law predicts.</p>',
  initVis(sim){},
  draw(sim,ctx,vdt,k,t){ensure(sim);drawGas(sim,ctx,vdt,k,t);},
  onLevel(sim){sync(sim);},
  thumbFrames:30
};

/* ---------- challenges ---------- */
const CH=[
  {lvl:'bio',q:'The gas is in 22.4 L at 273 K. You push the piston down to 11.2 L and keep the temperature the same. What happens to the pressure?',choices:['It halves','It doubles','It stays the same, because no gas was added'],correct:1,
   baseline:{mode:'box',hold:'V',vol:22.4,T:273,mol:1,gas:'ideal'},change:{vol:11.2},changeText:'Volume halved from 22.4 L to 11.2 L',watch:'plive',
   explain:{bio:'The same molecules now have half the room, so each one reaches a wall twice as often. Twice the hits each second means twice the pressure: about 1.00 atm became about 2.00 atm.',honors:'Boyle’s law: P₁V₁ = P₂V₂, so (1.00 atm)(22.4 L) = P₂(11.2 L) and P₂ = 2.00 atm. The measured gauge lands within a few percent of that, because it counts real, random hits.'}},
  {lvl:'bio',q:'The box is locked at 22.4 L. You heat the gas from 273 K to 546 K. What happens?',choices:['The molecules get bigger and fill more of the box','The molecules move faster and hit the walls harder and more often, so the pressure doubles','Nothing, because no gas was added'],correct:1,
   baseline:{mode:'box',hold:'V',vol:22.4,T:273,mol:1,gas:'ideal'},change:{T:546},changeText:'Heater turned up from 273 K to 546 K',watch:'plive',
   explain:{bio:'Molecules never grow when they are heated. They speed up, so each hit is harder and the hits come more often. Doubling the kelvin temperature doubled the pressure, from about 1.00 atm to about 2.00 atm.',honors:'Gay-Lussac’s law: P₁/T₁ = P₂/T₂, so P₂ = 1.00 atm × 546 K / 273 K = 2.00 atm.'}},
  {lvl:'bio',q:'A balloon at room temperature (22 °C) goes into ice water (0 °C). What happens to it?',choices:['It shrinks a little, by about 7%','It shrinks to almost nothing, because 0 °C is zero','It stays the same size'],correct:0,
   baseline:{mode:'balloon',bath:'room'},change:{bath:'ice'},changeText:'Balloon moved into ice water',watch:'vt',
   explain:{bio:'The balloon’s volume follows its kelvin temperature. 22 °C is 295 K and 0 °C is 273 K, and 273 ÷ 295 = 0.93. The balloon went from 2.00 L to about 1.85 L, only 7% smaller. In °C the drop looks huge, which is why gas laws always use kelvin.'}},
  {lvl:'honors',q:'The piston floats at 1.00 atm. You warm the gas from 20 °C to 40 °C. What happens to the volume?',choices:['It doubles, because the temperature doubled','It grows by about 7%','It stays the same, because the pressure is constant'],correct:1,
   baseline:{mode:'box',hold:'P',pext:1,T:293,mol:1,gas:'ideal'},change:{T:313},changeText:'Heated from 293 K (20 °C) to 313 K (40 °C)',watch:'plive',
   explain:{honors:'Charles’s law uses kelvin: V₂ = V₁ × 313 K / 293 K = 1.068 V₁. The volume grew from 24.0 L to 25.7 L, about 7%. Doubling the °C number is not doubling the temperature.'}},
  {lvl:'honors',q:'The piston floats at 1.00 atm with 0.50 mol of gas. You pump in gas until there is 1.00 mol. What happens?',choices:['The pressure doubles','The volume doubles and the pressure stays at 1.00 atm','Both the pressure and the volume double'],correct:1,
   baseline:{mode:'box',hold:'P',pext:1,T:273,mol:0.5,gas:'ideal'},change:{mol:1},changeText:'Pumped from 0.50 mol to 1.00 mol',watch:'plive',
   explain:{honors:'A floating piston rises until the gas pushes back exactly as hard as the outside does, so the pressure returns to 1.00 atm. Twice the molecules need twice the room: 11.2 L became 22.4 L. That is Avogadro’s law, V ∝ n.'}},
  {lvl:'honors',q:'The sealed syringe holds 10.0 mL of air at 101.3 kPa. You push the plunger to 5.0 mL. What does the sensor read?',choices:['About 50.7 kPa','About 203 kPa','About 106 kPa: a little higher'],correct:1,
   baseline:{mode:'syringe',syr:10,punit:'kPa'},change:{syr:5},changeText:'Plunger pushed from 10.0 mL to 5.0 mL',watch:'plive',
   explain:{honors:'P₁V₁ = P₂V₂: (101.3 kPa)(10.0 mL) = P₂(5.0 mL), so P₂ = 203 kPa. Halving the volume doubles the pressure, in any pressure unit.'}},
  {lvl:'ap',q:'Gas at 1.00 atm fills 22.4 L at 273 K. You heat it to 546 K and push the piston down to 11.2 L. What is the new pressure?',choices:['1.00 atm, because the two changes cancel','2.00 atm','4.00 atm'],correct:2,
   baseline:{mode:'box',hold:'V',vol:22.4,T:273,mol:1,gas:'ideal'},change:{T:546,vol:11.2},changeText:'Heated to 546 K and squeezed to 11.2 L',watch:'plive',
   explain:{ap:'Combined gas law: P₂ = P₁ × (V₁/V₂) × (T₂/T₁) = 1.00 atm × 2 × 2 = 4.00 atm. Both changes push the pressure up; they do not cancel.'}},
  {lvl:'ap',q:'1.00 mol of gas sits in 2.0 L at 250 K. You switch the ideal gas for real CO₂. How does the real pressure compare with PV = nRT?',choices:['Higher, because CO₂ molecules take up space','Lower, because CO₂ molecules attract each other','The same, because PV = nRT always works'],correct:1,
   baseline:{mode:'box',hold:'V',vol:2,T:250,mol:1,gas:'ideal'},change:{gas:'CO2'},changeText:'Ideal gas replaced by CO₂',watch:'plive',
   explain:{ap:'PV = nRT gives '+(R*250/2).toFixed(2)+' atm. Van der Waals for CO₂ (a = 3.64 L²·atm/mol², b = 0.0427 L/mol) gives '+vdw(1,2,250,GAS.CO2).toFixed(2)+' atm, so Z = '+(vdw(1,2,250,GAS.CO2)/(R*250/2)).toFixed(3)+'. At this density the attraction term (an²/V²) outweighs the size term, so molecules hit the walls less hard.'}},
  {lvl:'ap',q:'Now the box holds 1.5 mol of helium in 2.0 L at 273 K. Is the real pressure higher or lower than PV = nRT predicts?',choices:['Higher: helium atoms barely attract, so their own size wins','Lower: every real gas has a lower pressure than ideal','Exactly ideal: helium is a noble gas'],correct:0,
   baseline:{mode:'box',hold:'V',vol:2,T:273,mol:1.5,gas:'ideal'},change:{gas:'He'},changeText:'Ideal gas replaced by helium',watch:'plive',
   explain:{ap:'PV = nRT gives '+(1.5*R*273/2).toFixed(2)+' atm, and van der Waals for He gives '+vdw(1.5,2,273,GAS.He).toFixed(2)+' atm (Z = '+(vdw(1.5,2,273,GAS.He)/(1.5*R*273/2)).toFixed(3)+'). Helium’s a is tiny (0.0346), so the excluded-volume term b dominates and Z > 1. Real gases can deviate in either direction.'}}
];

/* ---------- narration ---------- */
function narrateGas(sim){const p=sim.p,st=sim.st,hon=atLeast('honors'),ap=atLeast('ap');const P=Pread(sim),u=p.punit,Ps=fmtP(P,u);const g=gasOf(p);
  const hits=Math.round(st.hps),ch=st.chg&&sim.t-st.chg.t<12?st.chg.keys:[];
  const real=isReal(p);let s;
  if(p.mode==='syringe'){const V=st.V*1000;
    s=V<9.9?'You pushed the plunger in. The same air molecules are crowded into '+V.toFixed(1)+' mL, so they hit the walls more often and the sensor reads <b>'+Ps+'</b>.':V>10.1?'You pulled the plunger out. The molecules spread into '+V.toFixed(1)+' mL, so they hit the walls less often and the sensor reads <b>'+Ps+'</b>.':'The syringe is sealed at 10.0 mL with room air at <b>'+Ps+'</b>. Push or pull the plunger and watch the sensor.';
    if(hon)s+=' P × V = '+CL.toSig(P*UNITS[u].f*V,3)+' '+UNITS[u].l+'·mL stays about the same: Boyle’s law.';return s;}
  if(p.mode==='balloon'){const b=BATH[p.bath]||BATH.room,T=st.Tkin;
    s=Math.abs(T-b.T)>1.5?(T>b.T?'The '+b.l.split(' (')[0].toLowerCase()+' is cooling the air in the balloon. The molecules slow down and hit the rubber less hard, so the outside air squeezes the balloon smaller.':'The '+b.l.split(' (')[0].toLowerCase()+' is warming the air in the balloon. The molecules speed up and push harder, so the balloon grows until its pressure matches the 1.00 atm outside.')
      :'The air in the balloon is at '+Math.round(T)+' K ('+degC(T)+' °C) and the balloon holds <b>'+st.V.toFixed(2)+' L</b>. The pressure inside matches the 1.00 atm outside, so the volume follows the kelvin temperature.';
    if(p.bath==='ln2')s+=' In a real demo some of the air even turns to liquid, so the balloon flattens more than this.';
    else if(hon)s+=' V ÷ T = '+(st.V/T).toFixed(5)+' L/K stays the same: Charles’s law.';return s;}
  // gas box
  if(p.hold==='P'){
    if(st.capped)s='The piston has hit its stop, so the gas cannot change its volume any more. Its pressure is now '+Ps+', not the outside pressure.';
    else if(ch.includes('T'))s='The piston floats at constant pressure. '+(st.Tkin>(st.chg.T0||0)?'Warmer molecules push harder, so the gas lifts the piston and expands':'Cooler molecules push less hard, so the outside pressure pushes the piston down')+' until the pushes balance again. <b>Volume follows kelvin temperature</b> (Charles’s law): now '+fmtV(st.V)+'.';
    else if(ch.includes('mol'))s='More molecules hit the piston from below, so it rises until the pressure is back to '+fmtP(p.pext,u)+'. <b>Volume grows with the amount of gas</b> (Avogadro’s law): now '+fmtV(st.V)+'.';
    else s='The piston floats. It settles where the gas pushes up exactly as hard as the outside pushes down ('+fmtP(p.pext,u)+'). Change the temperature or the amount of gas and the <b>volume</b> responds, not the pressure.';}
  else{
    if(ch.includes('vol')&&ch.includes('T'))s='You changed both the volume and the temperature. Each change affects how often and how hard the molecules hit, so the pressure is now <b>'+Ps+'</b> (combined gas law).';
    else if(ch.includes('vol'))s='The temperature stayed at '+Math.round(st.Tkin)+' K while you changed the volume to '+fmtV(st.V)+'. '+(st.V<(st.chg.V0||0)?'In less space each molecule reaches a wall sooner, so there are more hits each second':'With more room each molecule takes longer to reach a wall, so there are fewer hits each second')+': <b>pressure '+(st.V<(st.chg.V0||0)?'rises':'falls')+' as volume '+(st.V<(st.chg.V0||0)?'shrinks':'grows')+'</b> (Boyle’s law).';
    else if(ch.includes('T'))s=(st.Tkin>(st.chg.T0||0)+0.5?'The heater speeds up the molecules, so they hit the walls harder and more often.':st.Tkin<(st.chg.T0||0)-0.5?'Cooling slows the molecules, so they hit the walls less hard and less often.':'The molecules have reached the new temperature.')+' The volume is locked, so <b>pressure follows the kelvin temperature</b> (Gay-Lussac’s law): now '+Ps+'.';
    else if(ch.includes('mol'))s='Adding molecules to a locked box means more hits each second, so <b>pressure grows with the amount of gas</b>: now '+Ps+'.';
    else s='The gas is locked in '+fmtV(st.V)+' at '+Math.round(st.Tkin)+' K. The dots you see hit the walls about '+hits+' times a second, and all of those pushes add up to <b>'+Ps+'</b>.';}
  if(real&&ap){const Z=P/Pideal(sim);s+=' Real '+g.f+': Z = '+Z.toFixed(3)+(Z<0.995?', below ideal because the molecules attract each other.':Z>1.005?', above ideal because the molecules take up space.':', almost ideal here.');
    if(P>pvap(g,st.Tkin))s+=' <b>Warning:</b> at this temperature and pressure real '+g.f+' would start to condense, which this model does not show.';}
  else if(p.mode==='box'&&p.gas==='ideal'&&st.Tkin<90&&hon)s+=' A real gas like N₂ would be a liquid this cold; an ideal gas never condenses.';
  return s;}

/* ---------- drawing ---------- */
function dial(ctx,cx,cy,r,P,u,k,compact,st){const U=UNITS[u],v=P*U.f;
  const NICE=[1,2,3,5,10,15,20,30,50,100,150,200,300,500,1000,1500,2000,3000,5000,10000,20000,50000];
  let mx=st.dmax&&st.dunit===u&&v<st.dmax*0.92&&v>st.dmax*0.25?st.dmax:NICE.find(x=>x>=v*1.25)||NICE[NICE.length-1];st.dmax=mx;st.dunit=u;
  ctx.fillStyle=PAL['card'];ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=3;ctx.beginPath();ctx.arc(cx,cy,r,0,6.2832);ctx.fill();ctx.stroke();
  const a0=Math.PI*0.75,a1=Math.PI*2.25,A=x=>a0+(a1-a0)*clamp(x/mx,0,1.04);
  ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=1.5;for(let i=0;i<=10;i++){const a=A(mx*i/10),L=i%5===0?12:6;ctx.beginPath();ctx.moveTo(cx+Math.cos(a)*(r-4),cy+Math.sin(a)*(r-4));ctx.lineTo(cx+Math.cos(a)*(r-4-L),cy+Math.sin(a)*(r-4-L));ctx.stroke();}
  const lab=x=>x>=1000?(x/1000)+'k':String(x);
  [0,mx].forEach((x,i)=>{if(compact)return;const a=A(x);txt(ctx,lab(x),cx+Math.cos(a)*(r-28),cy+Math.sin(a)*(r-28)+4,{s:12*k,c:PAL['cv-soft'],a:'center',w:600});});
  txt(ctx,U.l,cx,cy+r*0.52,{s:12*k,c:PAL['cv-soft'],a:'center',w:700});
  const a=A(v);ctx.strokeStyle=PAL['s1'];ctx.lineWidth=3.5;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(cx-Math.cos(a)*10,cy-Math.sin(a)*10);ctx.lineTo(cx+Math.cos(a)*(r-14),cy+Math.sin(a)*(r-14));ctx.stroke();
  ctx.fillStyle=PAL['cv-ink'];ctx.beginPath();ctx.arc(cx,cy,6,0,6.2832);ctx.fill();}
function thermo(ctx,x,yTop,yBot,T,k,compact,label){const H=yBot-yTop,Y=TK=>yBot-clamp(TK/1000,0,1)*H;
  ctx.fillStyle=PAL['card'];ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=2;rr(ctx,x-9,yTop-8,18,H+16,9);ctx.fill();ctx.stroke();
  ctx.beginPath();ctx.arc(x,yBot+22,17,0,6.2832);ctx.fill();ctx.stroke();
  ctx.fillStyle='#d32f2f';ctx.beginPath();ctx.arc(x,yBot+22,12,0,6.2832);ctx.fill();ctx.fillRect(x-4,Y(T),8,yBot+14-Y(T));
  ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.5;
  [[273,'0 °C'],[373,'100 °C']].forEach(([TK,l])=>{const y=Y(TK);ctx.beginPath();ctx.moveTo(x+9,y);ctx.lineTo(x+18,y);ctx.stroke();if(!compact)txt(ctx,l,x+22,y+4,{s:12*k,c:PAL['cv-soft']});});
  for(let TK=0;TK<=1000;TK+=100){const y=Y(TK);ctx.beginPath();ctx.moveTo(x-9,y);ctx.lineTo(x-(TK%500===0?20:14),y);ctx.stroke();if(!compact&&TK%500===0)txt(ctx,TK+' K',x-24,y+4,{s:12*k,c:PAL['cv-soft'],a:'right'});}
  if(label)txt(ctx,label,x,yTop-18,{s:12*k,w:700,a:'center',c:PAL['cv-soft']});}
function dots(ctx,st,col,r){const X=st.x,Y=st.y,N=st.N;ctx.fillStyle=col;ctx.beginPath();for(let i=0;i<N;i+=EVERY){ctx.moveTo(X[i]+r,Y[i]);ctx.arc(X[i],Y[i],r,0,6.2832);}ctx.fill();
  ctx.strokeStyle=PAL['cv-bg'];ctx.lineWidth=1;ctx.stroke();}
function flashes(ctx,st){ctx.strokeStyle=PAL['s4'];ctx.lineCap='round';for(const q of st.hits){const a=1-q.age/0.35;if(a<=0)continue;ctx.globalAlpha=a;ctx.lineWidth=4;ctx.beginPath();
  if(q.o==='v'){ctx.moveTo(q.x,q.y-7);ctx.lineTo(q.x,q.y+7);}else if(q.o==='h'){ctx.moveTo(q.x-7,q.y);ctx.lineTo(q.x+7,q.y);}else{const r=Math.hypot(q.x-BAL.cx,q.y-BAL.cy);ctx.arc(BAL.cx,BAL.cy,r,q.a-0.06,q.a+0.06);}ctx.stroke();}ctx.globalAlpha=1;}
function card(ctx,x,y,w,h,lines,k){rr(ctx,x,y,w,h,10);ctx.fillStyle=PAL['card'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
  let yy=y+8;lines.forEach(L=>{yy+=L.s*k;txt(ctx,L.t,x+12,yy,{s:L.s*k,w:L.w||400,c:L.c||PAL['cv-ink']});yy+=6;});}
function fitText(ctx,s,maxW,size,w){ctx.font=(w||400)+' '+size+'px '+FONT;return ctx.measureText(s).width<=maxW;}

function drawGas(sim,ctx,vdt,k,t){const p=sim.p,st=sim.st,compact=k>1.3,hon=atLeast('honors'),ap=atLeast('ap');
  ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
  if(p.mode==='syringe')return drawSyringe(sim,ctx,k,compact);
  if(p.mode==='balloon')return drawBalloon(sim,ctx,k,compact);
  const g=st.geo,gas=gasOf(p),P=Pread(sim);
  const top=BOX.floor-BOX.pxl*BOX.Vmax-14;
  // cylinder
  ctx.fillStyle=PAL['cv-bg2'];ctx.fillRect(g.x0,g.y0,g.x1-g.x0,g.y1-g.y0);
  const hot=clamp((p.T-ROOM)/500,-1,1);
  if(Math.abs(hot)>0.03){const gr=ctx.createLinearGradient(0,g.y1,0,g.y1-60);const c=hot>0?'230,81,0':'21,101,192';gr.addColorStop(0,'rgba('+c+','+(0.28*Math.abs(hot)+0.06)+')');gr.addColorStop(1,'rgba('+c+',0)');ctx.fillStyle=gr;ctx.fillRect(g.x0,Math.max(g.y0,g.y1-60),g.x1-g.x0,Math.min(60,g.y1-g.y0));}
  ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(g.x0-3,top);ctx.lineTo(g.x0-3,g.y1+3);ctx.lineTo(g.x1+3,g.y1+3);ctx.lineTo(g.x1+3,top);ctx.stroke();
  ctx.fillStyle=PAL['cv-soft'];ctx.fillRect(g.x0-8,top-4,10,6);ctx.fillRect(g.x1-2,top-4,10,6);
  // particles and wall flashes
  dots(ctx,st,PAL[gas.c],gas.r);flashes(ctx,st);
  // piston
  const py=g.y0;const pg=ctx.createLinearGradient(0,py-14,0,py);pg.addColorStop(0,'#9aa3ad');pg.addColorStop(1,'#5f6a75');ctx.fillStyle=pg;ctx.fillRect(g.x0,py-14,g.x1-g.x0,14);
  if(p.hold==='V'){ctx.fillStyle='#6d7a88';ctx.fillRect(224,30,12,py-44);rr(ctx,186,20,88,14,7);ctx.fill();
    txt(ctx,'locked',254,Math.max(52,py-24),{s:12*k,c:PAL['cv-soft']});}
  else{const nb=Math.min(clamp(Math.round(p.pext/0.5),1,6),Math.floor((py-14-8)/16));for(let i=0;i<nb;i++){rr(ctx,262,py-14-16*(i+1),76,14,3);ctx.fillStyle='#5d4037';ctx.fill();}
    if(nb>0&&!compact)txt(ctx,'weights',300,py-14-16*nb-6,{s:12*k,c:PAL['cv-soft'],a:'center'});
    if(st.capped)pill(ctx,'piston at its stop',230,py+22,'#c62828','#fff',12*k);}
  pill(ctx,'V = '+fmtV(st.V),140,py-14-20,PAL['card'],PAL['cv-ink'],13*k);
  // heater
  const hc=p.T>320?'#c62828':p.T<250?'#1565c0':'#6d7a88';rr(ctx,g.x0-10,BOX.floor+8,g.x1-g.x0+20,28,7);ctx.fillStyle=hc;ctx.fill();
  txt(ctx,'Heater '+Math.round(p.T)+' K',(g.x0+g.x1)/2,BOX.floor+27,{s:12.5*k,w:700,c:'#fff',a:'center'});
  // pump (honors)
  if(hon){ctx.fillStyle=PAL['cv-soft'];ctx.globalAlpha=0.85;rr(ctx,20,312,30,82,6);ctx.fill();ctx.globalAlpha=1;ctx.fillStyle='#6d7a88';ctx.fillRect(32,288,6,26);rr(ctx,18,282,34,8,4);ctx.fill();
    ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(35,394);ctx.quadraticCurveTo(40,420,60,412);ctx.lineTo(g.x0-4,g.y1-10);ctx.stroke();
    txt(ctx,'Pump',35,272,{s:12*k,w:700,a:'center',c:PAL['cv-soft']});}
  // gauge + pipe
  ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(g.x1+4,BOX.floor-24);ctx.lineTo(410,BOX.floor-24);ctx.lineTo(410,122);ctx.lineTo(432,122);ctx.stroke();
  const gx=505,gy=122,gr2=72;dial(ctx,gx,gy,gr2,P,p.punit,k,compact,st);
  txt(ctx,'Pressure',gx,38,{s:12.5*k,w:700,a:'center',c:PAL['cv-soft']});
  pill(ctx,fmtP(P,p.punit),gx,gy+gr2+24,PAL['cv-ink'],PAL['card'],15*k);
  // thermometer
  thermo(ctx,668,60,300,st.Tkin,k,compact,'Temperature');
  pill(ctx,Math.round(st.Tkin)+' K = '+degC(st.Tkin)+' °C',668,356,PAL['card'],PAL['cv-ink'],13*k);
  // equation / relationship card
  const cx0=420,cw=370,cy0=380;let lines;
  if(ap&&isReal(p)){const Z=P/Pideal(sim);lines=[{t:'Real '+gas.f+' (van der Waals)',s:13.5,w:700},{t:compact?'Z = PV/nRT = '+Z.toFixed(3):'ideal '+fmtP(Pideal(sim),p.punit)+'  →  real '+fmtP(P,p.punit)+'   Z = '+Z.toFixed(3),s:12.5,c:PAL['cv-soft']}];}
  else if(hon){const l2='('+fmtP(P,'atm')+')('+fmtV(st.V)+') = ('+st.n.toFixed(2)+' mol)(0.0821)('+Math.round(st.Tkin)+' K)';
    lines=[{t:'PV = nRT',s:14,w:700},{t:compact||!fitText(ctx,l2,cw-24,12.5*k)?'P = nRT ÷ V = '+fmtP(Pideal(sim),'atm'):l2,s:12.5,c:PAL['cv-soft']}];}
  else lines=p.hold==='V'?[{t:'Volume locked',s:14,w:700},{t:'hotter gas → higher pressure',s:12.5,c:PAL['cv-soft']}]:[{t:'Pressure stays the same',s:14,w:700},{t:'hotter gas → bigger volume',s:12.5,c:PAL['cv-soft']}];
  card(ctx,cx0,cy0,cw,64,lines,k);}

function drawSyringe(sim,ctx,k,compact){const p=sim.p,st=sim.st,g=st.geo,P=Pread(sim),hon=atLeast('honors');
  const xEnd=SYR.tip+SYR.pxml*SYR.Vmax;
  // sensor and tube
  ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(SYR.tip-20,230);ctx.lineTo(54,230);ctx.lineTo(54,122);ctx.stroke();
  rr(ctx,14,40,200,84,10);ctx.fillStyle='#37474f';ctx.fill();txt(ctx,'Gas pressure sensor',114,62,{s:12*k,w:600,c:'#dfe6ea',a:'center'});
  rr(ctx,30,72,168,40,6);ctx.fillStyle='#1b2a30';ctx.fill();txt(ctx,fmtP(P,p.punit),114,101,{s:19*k,w:700,c:'#8ef0b4',a:'center'});
  // barrel
  ctx.fillStyle=PAL['cv-bg2'];ctx.fillRect(SYR.tip,SYR.y0,xEnd-SYR.tip+14,SYR.y1-SYR.y0);
  ctx.fillStyle=PAL['cv-glass'];ctx.fillRect(SYR.tip-20,222,20,16);
  ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=4;ctx.strokeRect(SYR.tip,SYR.y0-3,xEnd-SYR.tip+14,SYR.y1-SYR.y0+6);
  ctx.fillStyle=PAL['cv-glass'];ctx.fillRect(xEnd+14,SYR.y0-28,8,SYR.y1-SYR.y0+56);
  // graduations (outside the gas, above the barrel)
  ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=1.3;for(let v=0;v<=20;v++){const x=SYR.tip+SYR.pxml*v,L=v%5===0?12:v%1===0?6:3;ctx.beginPath();ctx.moveTo(x,SYR.y0-3);ctx.lineTo(x,SYR.y0-3-L);ctx.stroke();
    if(v%5===0&&v>0)txt(ctx,String(v),x,SYR.y0-20,{s:12.5*k,c:PAL['cv-ink'],a:'center',w:600});}
  txt(ctx,'mL',SYR.tip+4,SYR.y0-20,{s:12.5*k,c:PAL['cv-ink'],w:600});
  // gas
  ctx.save();ctx.beginPath();ctx.rect(g.x0,g.y0,g.x1-g.x0,g.y1-g.y0);ctx.clip();dots(ctx,st,PAL['s2'],4.2);ctx.restore();flashes(ctx,st);
  // plunger
  const xp=g.x1;ctx.fillStyle='#263238';ctx.fillRect(xp,SYR.y0+1,12,SYR.y1-SYR.y0-2);ctx.fillStyle='#78909c';ctx.fillRect(xp+12,222,290,16);rr(ctx,xp+300,186,12,88,4);ctx.fillStyle='#546e7a';ctx.fill();
  pill(ctx,'Air: '+(st.V*1000).toFixed(1)+' mL',(SYR.tip+xp)/2,SYR.y1+30,PAL['card'],PAL['cv-ink'],14*k);
  txt(ctx,'Room temperature: 22 °C (295 K), sealed: no air gets in or out',20,SYR.y1+68,{s:12.5*k,c:PAL['cv-soft']});
  if(compact)return;
  const PV=P*UNITS[p.punit].f*st.V*1000;
  card(ctx,420,372,370,64,hon?[{t:'P × V = '+PV.toFixed(0)+' '+UNITS[p.punit].l+'·mL',s:14,w:700},{t:'Boyle’s law: P₁V₁ = P₂V₂ at constant T',s:12.5,c:PAL['cv-soft']}]:[{t:'Smaller volume → higher pressure',s:14,w:700},{t:'The same air hits the walls more often',s:12.5,c:PAL['cv-soft']}],k);}

function drawBalloon(sim,ctx,k,compact){const p=sim.p,st=sim.st,g=st.geo,b=BATH[p.bath]||BATH.room,hon=atLeast('honors');
  const tx0=40,tx1=460,ty0=118,ty1=436,ly=148;
  // bath liquid
  let liq=PAL['cv-water'];ctx.fillStyle=liq;ctx.fillRect(tx0,ly,tx1-tx0,ty1-ly);
  if(p.bath==='warm'||p.bath==='boil'){ctx.fillStyle='rgba(230,81,0,'+(p.bath==='boil'?0.16:0.09)+')';ctx.fillRect(tx0,ly,tx1-tx0,ty1-ly);}
  if(p.bath==='ln2'){ctx.fillStyle='rgba(200,225,255,0.25)';ctx.fillRect(tx0,ly,tx1-tx0,ty1-ly);}
  const tt=sim.vt||0;
  if(p.bath==='boil'&&!RM){ctx.strokeStyle=PAL['cv-bstroke'];ctx.lineWidth=1.5;for(let i=0;i<14;i++){const bx=tx0+20+((i*53)%380),ph=((tt*0.6+i*0.37)%1),by=ty1-10-ph*(ty1-ly-20);if(Math.hypot(bx-g.cx,by-g.cy)<g.r+8)continue;ctx.beginPath();ctx.arc(bx,by,3+ph*3,0,6.2832);ctx.stroke();}}
  if(p.bath==='ice'){[[62,ly+2],[96,ly+6],[380,ly+3],[414,ly+7]].forEach(([x,y])=>{rr(ctx,x-15,y-12,30,26,5);ctx.fillStyle='rgba(255,255,255,0.75)';ctx.fill();ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=1.5;ctx.stroke();});}
  if(p.bath==='ln2'&&!RM){ctx.fillStyle='rgba(220,235,250,0.35)';for(let i=0;i<6;i++){const fx=tx0+40+i*70+Math.sin(tt+i)*10;ctx.beginPath();ctx.ellipse(fx,ly-12-((tt*12+i*9)%26),34,10,0,0,6.2832);ctx.fill();}}
  // tank walls
  ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(tx0,ty0);ctx.lineTo(tx0,ty1);ctx.lineTo(tx1,ty1);ctx.lineTo(tx1,ty0);ctx.stroke();
  // balloon
  const gr=ctx.createRadialGradient(g.cx-g.r*0.4,g.cy-g.r*0.4,g.r*0.1,g.cx,g.cy,g.r);gr.addColorStop(0,'rgba(255,170,170,0.35)');gr.addColorStop(1,'rgba(211,47,47,0.22)');
  ctx.fillStyle=gr;ctx.beginPath();ctx.arc(g.cx,g.cy,g.r,0,6.2832);ctx.fill();
  dots(ctx,st,PAL['s2'],4.2);flashes(ctx,st);
  ctx.strokeStyle='#c62828';ctx.lineWidth=3;ctx.beginPath();ctx.arc(g.cx,g.cy,g.r,0,6.2832);ctx.stroke();
  const ky=g.cy+g.r;ctx.fillStyle='#c62828';ctx.beginPath();ctx.moveTo(g.cx-7,ky+9);ctx.lineTo(g.cx+7,ky+9);ctx.lineTo(g.cx,ky-1);ctx.closePath();ctx.fill();
  ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(g.cx,ky+9);ctx.lineTo(g.cx,ty1-12);ctx.stroke();ctx.fillStyle='#6d7a88';rr(ctx,g.cx-22,ty1-14,44,12,3);ctx.fill();
  // thermometer in the bath
  thermo(ctx,430,48,250,st.Tkin,k,true,null);
  txt(ctx,b.l,tx0,ty0-14,{s:13*k,w:700,c:PAL['cv-ink']});
  // readouts
  const rx=490;txt(ctx,'Balloon volume',rx,150,{s:13*k,c:PAL['cv-soft'],w:600});txt(ctx,st.V.toFixed(2)+' L',rx,150+30*k,{s:24*k,w:800,c:PAL['cv-ink']});
  txt(ctx,'Air inside: '+Math.round(st.Tkin)+' K ('+degC(st.Tkin)+' °C)',rx,150+60*k,{s:13*k,c:PAL['cv-ink']});
  txt(ctx,'Outside pressure: 1.00 atm',rx,150+84*k,{s:13*k,c:PAL['cv-ink']});
  if(hon&&!compact)txt(ctx,'V ÷ T = '+(st.V/st.Tkin).toFixed(5)+' L/K',rx,150+108*k,{s:13*k,w:700,c:PAL['cv-ink']});}

/* ---------- graphs ---------- */
function msg(ctx,box,s){const words=s.split(' ');let line='',y=box.ch/2-12;const lines=[];ctx.font='15px '+FONT;
  words.forEach(w=>{const tt=line?line+' '+w:w;if(ctx.measureText(tt).width>box.cw-40){lines.push(line);line=w;}else line=tt;});lines.push(line);
  y=box.ch/2-(lines.length-1)*10;lines.forEach((l,i)=>txt(ctx,l,box.cw/2,y+i*20,{s:15,c:PAL['muted'],a:'center',b:'middle'}));}
function niceMax(v){const e=Math.pow(10,Math.floor(Math.log10(v)));const m=v/e;return (m<=1?1:m<=2?2:m<=2.5?2.5:m<=5?5:10)*e;}
function fitLine(xs,ys){const n=xs.length;if(n<2)return null;const mx=xs.reduce((a,b)=>a+b,0)/n,my=ys.reduce((a,b)=>a+b,0)/n;let sxx=0,sxy=0;for(let i=0;i<n;i++){sxx+=(xs[i]-mx)*(xs[i]-mx);sxy+=(xs[i]-mx)*(ys[i]-my);}
  if(sxx<1e-9)return null;const m=sxy/sxx;return {m,b:my-m*mx};}
function plotGas(sim,ctx,box,id){ensure(sim);const p=sim.p,st=sim.st,U=UNITS[p.punit],f=U.f,pts=sim.gpts||[],P=Pread(sim);
  const ring=(ax,x,y)=>{ctx.strokeStyle=serColor(1);ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(ax.X(x),ax.Y(y),8,0,6.29);ctx.stroke();};
  const dot=(ax,x,y)=>{ctx.fillStyle=serColor(0);ctx.beginPath();ctx.arc(ax.X(x),ax.Y(y),5,0,6.29);ctx.fill();};
  const clip=()=>{ctx.save();ctx.beginPath();ctx.rect(box.L,box.T,box.W,box.H);ctx.clip();};
  if(id==='pv'||id==='pinv'){
    if(p.mode==='balloon'){msg(ctx,box,'The balloon always sits at 1 atm. Use the Gas box or Boyle’s syringe to graph pressure against volume.');return;}
    const syr=p.mode==='syringe',sc=syr?1000:1,vu=syr?'mL':'L';
    const sel=pts.filter(q=>q.mode===p.mode&&(syr||(Math.abs(q.T-p.T)<0.5&&Math.abs(q.n-st.n)<1e-6&&q.gas===p.gas)));
    const nRT=syr?SYR_n*R*ROOM:st.n*R*p.T;const g=gasOf(p);const Pof=V=>isReal(p)?vdw(st.n,V,p.T,g):nRT/V;
    if(id==='pv'){const vmax=syr?22:47;const ymax=niceMax(Math.max(P*1.3,...sel.map(q=>q.P*1.1),Pof(syr?SYR.Vmin/1000:BOX.Vmin)*0.6)*f);
      const ax=axes(ctx,box,{xmin:0,xmax:vmax,ymin:0,ymax,xl:'Volume ('+vu+')',yl:'Pressure ('+U.l+')'});clip();
      ctx.setLineDash([5,4]);ctx.strokeStyle=PAL['muted'];ctx.lineWidth=1.5;ctx.beginPath();let first=true;for(let v=vmax;v>=0.3;v-=vmax/300){const y=Pof(v/sc)*f;if(!Number.isFinite(y))continue;first?ctx.moveTo(ax.X(v),ax.Y(y)):ctx.lineTo(ax.X(v),ax.Y(y));first=false;}ctx.stroke();ctx.setLineDash([]);
      sel.forEach(q=>dot(ax,q.V*sc,q.P*f));ring(ax,st.V*sc,P*f);ctx.restore();
      legend(ctx,box.L+12,box.T+10,[{label:'your measurements',color:serColor(0)},{label:isReal(p)?'van der Waals':'P = nRT/V',color:PAL['muted'],dash:true}]);}
    else{const xs=sel.map(q=>1/(q.V*sc));const xmax=niceMax(Math.max(1/((syr?SYR.Vmin:BOX.Vmin)*0.9),...xs)*1.02);const ymax=niceMax(Math.max(nRT*sc*xmax*f,...sel.map(q=>q.P*f))*1.05);
      const ax=axes(ctx,box,{xmin:0,xmax,ymin:0,ymax,xl:'1/V (1/'+vu+')',yl:'Pressure ('+U.l+')'});clip();
      ctx.setLineDash([5,4]);ctx.strokeStyle=PAL['muted'];ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(ax.X(0),ax.Y(0));ctx.lineTo(ax.X(xmax),ax.Y(nRT*sc*xmax*f));ctx.stroke();ctx.setLineDash([]);
      sel.forEach((q,i)=>dot(ax,xs[i],q.P*f));ring(ax,1/(st.V*sc),P*f);ctx.restore();
      const fl=fitLine(xs,sel.map(q=>q.P*f));
      legend(ctx,box.L+12,box.T+10,[{label:fl?'your slope = '+fl.m.toPrecision(3)+' '+U.l+'·'+vu:'straight line through 0 = Boyle’s law',color:PAL['muted'],dash:true}]);}
    return;}
  if(id==='vt'||id==='pt'){const isV=id==='vt';
    let sel;
    if(isV){if(p.mode==='syringe'){msg(ctx,box,'The syringe stays at room temperature. Use Charles’s balloon, or the Gas box with the piston floating.');return;}
      if(p.mode==='box'&&p.hold!=='P'){msg(ctx,box,'To graph volume against temperature, set Hold constant to Pressure (piston floats), then change the temperature.');return;}
      sel=pts.filter(q=>q.mode===p.mode&&(p.mode==='balloon'||(q.hold==='P'&&Math.abs(q.n-st.n)<1e-6&&Math.abs(q.pext-p.pext)<1e-6&&q.gas===p.gas)));}
    else{if(p.mode!=='box'){msg(ctx,box,'Use the Gas box with Hold constant set to Volume to graph pressure against temperature.');return;}
      if(p.hold!=='V'){msg(ctx,box,'To graph pressure against temperature, set Hold constant to Volume (piston locked), then change the temperature.');return;}
      sel=pts.filter(q=>q.mode==='box'&&q.hold==='V'&&Math.abs(q.n-st.n)<1e-6&&Math.abs(q.V-st.V)<0.06&&q.gas===p.gas);}
    const yv=q=>isV?q.V:q.P*f,ycur=isV?st.V:P*f,yl=isV?'Volume (L)':'Pressure ('+U.l+')';
    const xs=sel.map(q=>q.T-273.15),ys=sel.map(yv);const xmax=Math.max(150,Math.ceil((Math.max(st.Tkin,...sel.map(q=>q.T))-273.15+60)/100)*100);
    const ymax=niceMax(Math.max(ycur,...ys)*1.2);const ax=axes(ctx,box,{xmin:-300,xmax,ymin:0,ymax,xl:'Temperature (°C)',yl});clip();
    ctx.strokeStyle=PAL['s3'];ctx.setLineDash([2,4]);ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(ax.X(-273.15),box.T);ctx.lineTo(ax.X(-273.15),box.T+box.H);ctx.stroke();ctx.setLineDash([]);
    const fl=fitLine(xs,ys);let x0=null;
    if(fl&&Math.abs(fl.m)>1e-9){x0=-fl.b/fl.m;const xa=Math.min(...xs),xb=Math.max(...xs);ctx.strokeStyle=serColor(0);ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(ax.X(xa),ax.Y(fl.m*xa+fl.b));ctx.lineTo(ax.X(xb),ax.Y(fl.m*xb+fl.b));ctx.stroke();
      ctx.setLineDash([6,5]);ctx.beginPath();ctx.moveTo(ax.X(xa),ax.Y(fl.m*xa+fl.b));ctx.lineTo(ax.X(Math.max(-300,x0)),ax.Y(Math.max(0,fl.m*Math.max(-300,x0)+fl.b)));ctx.stroke();ctx.setLineDash([]);}
    sel.forEach((q,i)=>dot(ax,xs[i],ys[i]));ring(ax,st.Tkin-273.15,ycur);ctx.restore();
    txt(ctx,'absolute zero −273 °C',ax.X(-273.15)+6,box.T+box.H-8,{s:12,c:PAL['s3'],w:600});
    legend(ctx,box.L+12,box.T+10,[{label:x0!==null?'your line reaches '+(isV?'V':'P')+' = 0 at '+x0.toFixed(0)+' °C':'record two or more temperatures',color:serColor(0),dash:true}]);return;}
  if(id==='z'){const T=st.Tkin;const Pmax=niceMax(Math.max(300,P*1.3));const gl=['He','H2','N2','CO2'];
    const ax=axes(ctx,box,{xmin:0,xmax:Pmax,ymin:0,ymax:2,xl:'Pressure (atm) at '+Math.round(T)+' K, 1 mol',yl:'Z = PV/nRT'});clip();
    ctx.strokeStyle=PAL['muted'];ctx.setLineDash([5,4]);ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(ax.X(0),ax.Y(1));ctx.lineTo(ax.X(Pmax),ax.Y(1));ctx.stroke();ctx.setLineDash([]);
    const items=[];gl.forEach((k2,i)=>{const g=GAS[k2],col=serColor(i+1);ctx.strokeStyle=col;ctx.lineWidth=k2===p.gas?4:2;ctx.beginPath();let first=true,lastP=0;
      for(let V=60;V>g.b*1.15;V*=0.985){const Pv=vdw(1,V,T,g);if(Pv<lastP-1e-6)break;lastP=Pv;if(Pv>Pmax)break;const Z=Pv*V/(R*T);first?ctx.moveTo(ax.X(Pv),ax.Y(Z)):ctx.lineTo(ax.X(Pv),ax.Y(Z));first=false;}ctx.stroke();items.push({label:g.f,color:col});});
    if(isReal(p))ring(ax,P,P/Pideal(sim));ctx.restore();items.push({label:'ideal',color:PAL['muted'],dash:true});legend(ctx,box.L+12,box.T+10,items);}}

BioLab.register(SIM);
})();
