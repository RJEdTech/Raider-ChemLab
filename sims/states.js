(function(){
'use strict';
const {clamp,lerp,rng,randn,rr,txt,pill,atLeast,PAL,FONT,RM,axes,legend,serColor}=BioLab.h;
const CL=window.ChemLab;
/* States of matter and the heating curve.
   Energy model: heat flows in at the heater power; the enthalpy H of the sample (J, measured from the solid at T0)
   fixes the temperature and phase fractions exactly: q = mcΔT on the sloped parts and q = mΔH on the plateaus.
   Particle view: each particle takes the role (solid, liquid or gas) the phase fractions call for. Solids vibrate on
   lattice sites, liquids jostle in a pool held together by short-range attraction, gases fly with speed ∝ √T. */
const SUBS={
  water:{l:'Water (H₂O)',f:'H2O',M:18.02,Tm:0,Tb:100,cs:2.09,cl:4.184,cg:2.01,Hf:334,Hv:2260,T0:-40,Tmax:140,Ptp:0.006,maxW:200,N:40,names:['ice','liquid water','steam'],
    d0:24,site:30,mol:'H2O'},
  ne:{l:'Neon (Ne)',f:'Ne',M:20.18,Tm:-248.59,Tb:-246.05,cs:1.24,cl:1.83,cg:1.03,Hf:16.6,Hv:84.8,T0:-256,Tmax:-236,Ptp:0.43,maxW:8,N:64,names:['solid neon','liquid neon','neon gas'],d0:19,site:20,mol:'Ne'},
  ar:{l:'Argon (Ar)',f:'Ar',M:39.95,Tm:-189.34,Tb:-185.85,cs:0.8,cl:1.12,cg:0.52,Hf:29.6,Hv:161,T0:-205,Tmax:-165,Ptp:0.68,maxW:20,N:56,names:['solid argon','liquid argon','argon gas'],d0:22,site:23,mol:'Ar'},
  o2:{l:'Oxygen (O₂)',f:'O2',M:32.00,Tm:-218.79,Tb:-182.96,cs:1.4,cl:1.70,cg:0.918,Hf:13.9,Hv:213,T0:-230,Tmax:-160,Ptp:0.0015,maxW:25,N:40,names:['solid oxygen','liquid oxygen','oxygen gas'],d0:22,site:26,mol:'O2'}
};
const R=8.314,kB=1.380649e-23;
const sub=sim=>SUBS[sim.p.sub];
const mass=sim=>atLeast('honors')?sim.p.mass:50;
const pres=sim=>atLeast('ap')?sim.p.P:1;
function TbAt(s,P){const Pe=Math.max(P,s.Ptp),Tb0=s.Tb+273.15,dH=s.Hv*s.M;const T=1/(1/Tb0-R*Math.log(Pe)/dH)-273.15;return Math.max(T,s.Tm+0.3);}
function segs(sim){const s=sub(sim),m=mass(sim),Tb=TbAt(s,pres(sim));const H1=m*s.cs*(s.Tm-s.T0),H2=H1+m*s.Hf,H3=H2+m*s.cl*(Tb-s.Tm),H4=H3+m*s.Hv,H5=H4+m*s.cg*(s.Tmax-Tb);
  return {s,m,Tb,H1,H2,H3,H4,H5};}
function stateOf(sim,H){const g=segs(sim),s=g.s,m=g.m;H=clamp(H,0,g.H5);
  if(H<=g.H1)return {T:s.T0+H/(m*s.cs),fs:1,fl:0,fg:0,seg:0};
  if(H<=g.H2){const f=(H-g.H1)/(g.H2-g.H1);return {T:s.Tm,fs:1-f,fl:f,fg:0,seg:1};}
  if(H<=g.H3)return {T:s.Tm+(H-g.H2)/(m*s.cl),fs:0,fl:1,fg:0,seg:2};
  if(H<=g.H4){const f=(H-g.H3)/(g.H4-g.H3);return {T:g.Tb,fs:0,fl:1-f,fg:f,seg:3};}
  return {T:g.Tb+(H-g.H4)/(m*s.cg),fs:0,fl:0,fg:1,seg:4};}
function Hfor(sim,start){const g=segs(sim),s=g.s;if(start==='solid')return 0;if(start==='gas')return g.H4+g.m*s.cg*Math.min(15,(s.Tmax-g.Tb)*0.6);
  const Tl=s.f==='H2O'?25:(s.Tm+g.Tb)/2;return g.H2+g.m*s.cl*(Tl-s.Tm);}
const cur=sim=>stateOf(sim,sim.st.H);
const watts=sim=>sim.p.power/100*sub(sim).maxW;
const SEGN=['heating the solid','melting','heating the liquid','boiling','heating the gas'];
function phaseText(sim){const q=cur(sim),n=sub(sim).names;
  if(q.seg===1)return 'Melting: '+(100*q.fl).toFixed(0)+'% liquid';if(q.seg===3)return 'Boiling: '+(100*q.fg).toFixed(0)+'% gas';
  return q.seg===0?'Solid ('+n[0]+')':q.seg===2?'Liquid ('+n[1]+')':'Gas ('+n[2]+')';}
function eqText(sim){const g=segs(sim),s=g.s,q=cur(sim),m=g.m.toFixed(1),nm=s.names;
  if(q.seg===0)return 'q = mc'+'ΔT for '+nm[0]+': '+m+' g × '+s.cs+' J/g·°C × '+(s.Tm-s.T0).toFixed(1)+' °C = '+(g.H1/1000).toFixed(2)+' kJ';
  if(q.seg===1)return 'q = mΔH_fus: '+m+' g × '+s.Hf+' J/g = '+((g.H2-g.H1)/1000).toFixed(2)+' kJ';
  if(q.seg===2)return 'q = mcΔT for '+nm[1]+': '+m+' g × '+s.cl+' J/g·°C × '+(g.Tb-s.Tm).toFixed(1)+' °C = '+((g.H3-g.H2)/1000).toFixed(2)+' kJ';
  if(q.seg===3)return 'q = mΔH_vap: '+m+' g × '+s.Hv+' J/g = '+((g.H4-g.H3)/1000).toFixed(1)+' kJ';
  return 'q = mcΔT for '+nm[2]+': '+m+' g × '+s.cg+' J/g·°C × ΔT';}

/* ---------- particles ---------- */
const BX0=30,BX1=400,BY0=44,BY1=392;
function sites(s){const N=s.N,sp=s.site,nc=8,rows=Math.ceil(N/nc),pts=[];const w=(nc-1)*sp,x0=(BX0+BX1)/2-w/2,dy=sp*0.87;
  for(let j=0;j<rows;j++)for(let i=0;i<nc;i++){if(pts.length>=N)break;pts.push([x0+i*sp+(j%2?sp/2-sp/4:-sp/4),BY1-sp*0.55-j*dy]);}return pts;}
function buildVis(sim){const s=sub(sim),q=cur(sim),r=rng(3),v=sim.vis;v.key=sim.p.sub+'|'+sim.st.gen;v.sites=sites(s);v.P=[];
  const Ns=Math.round(s.N*q.fs),Ng=Math.round(s.N*q.fg);let li=0;const top=Ns?v.sites[Ns-1][1]-s.site:BY1-s.d0*0.6;
  for(let i=0;i<s.N;i++){const p={x:0,y:0,vx:0,vy:0,a:(s.mol==='H2O'?-Math.PI/2:0),va:0,role:'s',site:-1,ph:r()*6.283};
    if(i<Ns){p.role='s';p.site=i;p.x=v.sites[i][0];p.y=v.sites[i][1];}
    else if(i<s.N-Ng){p.role='l';const nc=Math.floor((BX1-BX0-20)/s.d0),c=li%nc,rw=Math.floor(li/nc);p.x=BX0+14+c*s.d0+(rw%2)*s.d0/2;p.y=(Ns?top:BY1-s.d0*0.6)-rw*s.d0*0.88;li++;p.a=r()*6.283;}
    else{p.role='g';p.x=lerp(BX0+20,BX1-20,r());p.y=lerp(BY0+20,BY0+160,r());const a=r()*6.283;p.vx=Math.cos(a)*100;p.vy=Math.sin(a)*100;p.a=r()*6.283;p.va=(r()-0.5)*6;}
    v.P.push(p);}}
function rebalance(sim){const s=sub(sim),q=cur(sim),v=sim.vis,P=v.P,N=s.N;const Ns=Math.round(N*q.fs),Ng=Math.round(N*q.fg);
  const cnt=role=>P.filter(p=>p.role===role).length;let guard=0;
  while(cnt('s')>Ns&&guard++<200){let best=null;P.forEach(p=>{if(p.role==='s'&&(!best||p.site>best.site))best=p;});best.role='l';best.site=-1;best.vy=-20;}
  while(cnt('s')<Ns&&guard++<400){const idx=cnt('s'),st=v.sites[idx];let best=null,bd=1e9;P.forEach(p=>{if(p.role==='s')return;const d=Math.hypot(p.x-st[0],p.y-st[1])+(p.role==='g'?400:0);if(d<bd){bd=d;best=p;}});if(!best)break;best.role='s';best.site=idx;best.vx=best.vy=0;}
  while(cnt('g')>Ng&&guard++<600){let best=null;P.forEach(p=>{if(p.role==='g'&&(!best||p.y>best.y))best=p;});best.role='l';best.vx*=0.2;best.vy=Math.abs(best.vy)*0.2;}
  while(cnt('g')<Ng&&guard++<800){let best=null;P.forEach(p=>{if(p.role==='l'&&(!best||p.y<best.y))best=p;});if(!best)P.forEach(p=>{if(p.role==='s'&&(!best||p.site>best.site))best=p;});if(!best)break;
    if(best.role==='s')best.site=-1;best.role='g';const a=-Math.PI/2+(Math.random()-0.5)*1.6;best.vx=Math.cos(a)*120;best.vy=Math.sin(a)*120;best.va=(Math.random()-0.5)*6;}}
function moveParticles(sim,dt){const s=sub(sim),q=cur(sim),v=sim.vis,P=v.P,d0=s.d0;if(!dt||RM&&dt<1)dt=dt;
  const TK=q.T+273.15,u=clamp((q.T-s.Tm)/Math.max(0.5,TbAt(s,pres(sim))-s.Tm),0,1),us=clamp((q.T-s.T0)/(s.Tm-s.T0),0,1);
  const vg=95*Math.sqrt(TK/(TbAt(s,pres(sim))+273.15)),vl=22+34*u,A=RM?0:0.7+2.6*us;
  let left=Math.min(dt,0.1);while(left>1e-6){const h=Math.min(left,1/60);left-=h;
    P.forEach(p=>{if(p.role==='s'){const st=v.sites[p.site]||[p.x,p.y];const tx=st[0]+A*Math.sin(sim.vt*13+p.ph),ty=st[1]+A*Math.cos(sim.vt*11+p.ph*1.7);p.x+=(tx-p.x)*Math.min(1,h*10);p.y+=(ty-p.y)*Math.min(1,h*10);
        let da=(s.mol==='H2O'?-Math.PI/2:0)-p.a;p.a+=da*Math.min(1,h*6);return;}
      if(p.role==='l'){p.vx+=randn()*vl*6*h;p.vy+=randn()*vl*6*h+160*h;const sp=Math.hypot(p.vx,p.vy);if(sp>vl){p.vx*=vl/sp;p.vy*=vl/sp;}p.va+=randn()*4*h;p.va=clamp(p.va,-2,2);}
      else{p.vy+=25*h;const sp=Math.hypot(p.vx,p.vy)||1;const f=lerp(1,vg/sp,Math.min(1,h*2));p.vx*=f;p.vy*=f;}
      p.x+=p.vx*h;p.y+=p.vy*h;p.a+=p.va*h;const m=d0*0.5;
      if(p.x<BX0+m){p.x=BX0+m;p.vx=Math.abs(p.vx);}if(p.x>BX1-m){p.x=BX1-m;p.vx=-Math.abs(p.vx);}if(p.y<BY0+m){p.y=BY0+m;p.vy=Math.abs(p.vy);}if(p.y>BY1-m){p.y=BY1-m;p.vy=-Math.abs(p.vy)*(p.role==='g'?1:0.3);}});
    for(let i=0;i<P.length;i++){const a=P[i];for(let j=i+1;j<P.length;j++){const b=P[j];if(a.role==='g'&&b.role==='g')continue;if(a.role==='s'&&b.role==='s')continue;
      const dx=b.x-a.x,dy=b.y-a.y,dd=dx*dx+dy*dy;if(dd>2.6*d0*d0)continue;const d=Math.sqrt(dd)||0.01,ux=dx/d,uy=dy/d;
      if(d<d0){const push=(d0-d);let wa=a.role==='s'?0:b.role==='s'?1:0.5,wb=1-wa;if(a.role==='s')wb=1;
        if(a.role==='g'||b.role==='g'){const g=a.role==='g'?a:b,sg=a.role==='g'?-1:1;g.x+=sg*ux*push;g.y+=sg*uy*push;const vn=g.vx*ux*sg+g.vy*uy*sg;if(vn<0){g.vx-=2*vn*ux*sg;g.vy-=2*vn*uy*sg;}continue;}
        a.x-=ux*push*wa;a.y-=uy*push*wa;b.x+=ux*push*wb;b.y+=uy*push*wb;}
      else if(a.role==='l'&&b.role==='l'||(a.role==='l'&&b.role==='s')||(a.role==='s'&&b.role==='l')){const pull=(d-d0)*0.9*h;if(a.role==='l'){a.vx+=ux*pull*30;a.vy+=uy*pull*30;}if(b.role==='l'){b.vx-=ux*pull*30;b.vy-=uy*pull*30;}}}}}}
function drawParticle(ctx,s,p){if(s.mol==='H2O'){const c=Math.cos(p.a),sn=Math.sin(p.a);CL.drawAtom(ctx,p.x,p.y,8.5,'O',{label:''});
    [0.95,-0.95].forEach(o=>{CL.drawAtom(ctx,p.x+Math.cos(p.a+o)*9.5,p.y+Math.sin(p.a+o)*9.5,5.2,'H',{label:''});});return;}
  if(s.mol==='O2'){const dx=Math.cos(p.a)*6,dy=Math.sin(p.a)*6;CL.drawAtom(ctx,p.x-dx,p.y-dy,8,'O',{label:''});CL.drawAtom(ctx,p.x+dx,p.y+dy,8,'O',{label:''});return;}
  CL.drawAtom(ctx,p.x,p.y,s.mol==='Ne'?9:10.5,s.mol,{label:''});}

/* ---------- definition ---------- */
const SIM={
  id:'states',hash:'states',apUnit:6,order:1,tab:'States of matter',kind:'Simulation',
  prereq:['classify'],next:['phasediagram','imf','kmt','calorimetry'],
  card:'Heat or cool water, neon, argon or oxygen, watch the particles melt and boil, and build the heating curve as you go.',
  title:'States of matter and the heating curve',
  lede:{bio:'Add heat or take it away. Watch the particles go from a vibrating solid to a flowing liquid to a flying gas, and see why the temperature stops rising while the sample melts or boils.',
        honors:'Build the heating curve from real data and calculate each piece: q = mcΔT while the temperature changes, and q = mΔH while the phase changes.',
        ap:'Connect temperature to average kinetic energy, and phase changes to potential energy. Change the pressure and watch the boiling point move.'},
  scale:'Particle view: about 3 nm across, each ball one atom. The sample itself is a 50 g lump in a sealed container at constant pressure.',
  timeScale:25,dtMax:0.5,unit:'s',window:600,sampleDt:2,chChange:0,chReveal:70,
  controls:[
    {id:'sub',label:'Substance',type:'select',def:'water',lvl:'bio',options:Object.keys(SUBS).map(k=>({v:k,l:SUBS[k].l})),onChange(sim){restart(sim);}},
    {id:'power',label:'Heater (+) or cooler (−)',type:'range',min:-100,max:100,step:5,def:50,unit:'%',lvl:'bio',help:'Percent of full power. Positive adds heat; negative removes it.'},
    {id:'start',label:'Start as',type:'seg',def:'solid',lvl:'bio',options:[{v:'solid',l:'Solid'},{v:'liquid',l:'Liquid'},{v:'gas',l:'Gas'}],onChange(sim){restart(sim);}},
    {id:'mass',label:'Sample mass',type:'range',min:10,max:100,step:5,def:50,unit:' g',lvl:'honors',onChange(sim){const st=sim.st;if(st&&st.m){const f=mass(sim)/st.m;st.H*=f;st.Hlo*=f;st.Hhi*=f;st.H0*=f;st.m=mass(sim);}}},
    {id:'P',label:'Pressure on the sample',type:'range',min:0.3,max:3,step:0.05,def:1,unit:' atm',lvl:'ap',help:'Lower pressure lowers the boiling point (Clausius–Clapeyron).'}
  ],
  actions:[{id:'again',label:'Start over',lvl:'bio',primary:true,run(sim){restart(sim);}}],
  init(sim){const H=Hfor(sim,sim.p.start);return {H,H0:H,Hlo:H,Hhi:H,m:mass(sim),gen:Math.random()};},
  step(sim,dt){const st=sim.st,g=segs(sim);st.H=clamp(st.H+watts(sim)*dt,0,g.H5);st.Hlo=Math.min(st.Hlo,st.H);st.Hhi=Math.max(st.Hhi,st.H);},
  metrics:[
    {id:'T',label:'Temperature',unit:'°C',lvl:'bio',min:-260,max:140,d:1,get:s=>cur(s).T},
    {id:'phase',label:'State',unit:'',lvl:'bio',text:true,get:s=>phaseText(s)},
    {id:'W',label:'Heat flow',unit:'W',lvl:'bio',d:1,max:null,get:s=>watts(s),noTrial:false},
    {id:'q',label:'Heat added since start',unit:'kJ',lvl:'honors',min:-200,max:null,d:2,get:s=>(s.st.H-s.st.H0)/1000},
    {id:'fs',label:'Solid',unit:'%',lvl:'honors',min:0,max:100,d:0,fixed:true,get:s=>100*cur(s).fs},
    {id:'fl',label:'Liquid',unit:'%',lvl:'honors',min:0,max:100,d:0,fixed:true,get:s=>100*cur(s).fl},
    {id:'fg',label:'Gas',unit:'%',lvl:'honors',min:0,max:100,d:0,fixed:true,get:s=>100*cur(s).fg},
    {id:'ke',label:'Average kinetic energy per particle',unit:'×10⁻²¹ J',lvl:'ap',min:0,max:null,d:2,get:s=>1.5*kB*(cur(s).T+273.15)*1e21},
    {id:'tb',label:'Boiling point at this pressure',unit:'°C',lvl:'ap',min:-260,max:140,d:1,get:s=>segs(s).Tb},
    {id:'eq',label:'This part of the curve',unit:'',lvl:'honors',text:true,noTrial:true,get:s=>eqText(s)}
  ],
  graphs:[{id:'curve',label:'Heating curve (temperature vs heat added)',lvl:'bio',custom:true},{id:'T',label:'Temperature vs time',lvl:'bio',lines:['T']},{id:'frac',label:'Solid, liquid and gas (%) vs time',lvl:'honors',lines:['fs','fl','fg']}],
  defaultGraph:'curve',
  plot(sim,ctx,box){drawCurve(sim,ctx,box,1,true);},
  narrate(sim){const q=cur(sim),s=sub(sim),w=watts(sim),hon=atLeast('honors'),ap=atLeast('ap'),g=segs(sim),n=s.names,heat=w>0.01,cool=w<-0.01;
    const dir=heat?'Heat flows in':cool?'Heat flows out':'No heat flows';let t='';
    if(q.seg===0)t=dir+', so '+n[0]+' particles vibrate '+(heat?'faster':cool?'more slowly':'at a steady rate')+' in place. Faster motion means a <b>'+(heat?'rising':cool?'falling':'steady')+' temperature</b>.';
    else if(q.seg===1)t='<b>Temperature holds at '+s.Tm.toFixed(s.Tm%1?2:0)+' °C.</b> '+(heat?'The incoming heat breaks particles out of the lattice instead of speeding them up':cool?'Particles lock into the lattice and give off heat as they do':'Solid and liquid sit together')+'. '+(100*q.fl).toFixed(0)+'% has melted.';
    else if(q.seg===2)t=dir+'. The particles stay in contact but slide past each other, and their speed '+(heat?'rises':cool?'falls':'holds')+' with the temperature.';
    else if(q.seg===3)t='<b>Temperature holds at '+g.Tb.toFixed(1)+' °C.</b> '+(heat?'All the heat goes into pulling particles free of each other':cool?'Gas particles stick back into the liquid and release heat':'Liquid and gas sit together')+'. '+(100*q.fg).toFixed(0)+'% is gas.';
    else t=dir+'. The gas particles fly apart and hit the walls '+(heat?'faster':cool?'more slowly':'at a steady rate')+'.';
    if(hon&&(q.seg===1||q.seg===3))t+=' This plateau takes q = mΔH = '+((q.seg===1?g.H2-g.H1:g.H4-g.H3)/1000).toFixed(q.seg===1?2:1)+' kJ.';
    if(ap&&(q.seg===1||q.seg===3))t+=' Average kinetic energy stays constant; the energy raises the particles’ potential energy.';
    if(ap&&pres(sim)<s.Ptp)t+=' Below the triple point ('+s.Ptp+' atm) the liquid cannot exist; this model holds the pressure at the triple point.';
    return t;},
  tour:[
    {title:'A solid: particles locked in place',text:'Each ball is one particle. In a solid they sit in a regular pattern and only vibrate. Attractions hold them in place.',focus:[BX0-6,BY0-6,BX1-BX0+12,BY1-BY0+16],speed:1,setup(sim){BioLab.setValues(sim,{sub:'water',start:'solid',power:50});restart(sim);}},
    {title:'Heat makes them vibrate faster',text:'The heater adds energy. The particles vibrate harder and the temperature rises along the first sloped part of the curve.',focus:[[BX0-6,BY0-6,BX1-BX0+12,BY1-BY0+40],[430,24,362,270]],speed:1,setup(sim){BioLab.setValues(sim,{power:100});}},
    {title:'Melting: the first plateau',text:{bio:'At 0 °C the ice melts. The temperature stops rising even though heat keeps flowing in: the energy breaks particles out of the lattice.',honors:'At 0 °C the energy goes into breaking attractions, not into speed. q = mΔH_fus = 50 g × 334 J/g = 16.7 kJ.'},focus:[[BX0-6,BY0-6,BX1-BX0+12,BY1-BY0+16],[430,24,362,270]],speed:1,setup(sim){const g=segs(sim);sim.st.H=g.H1+0.3*(g.H2-g.H1);sim.vis.key='';}},
    {title:'A liquid flows',text:'Now the particles touch but slide past each other. Heat speeds them up again, so the temperature climbs.',focus:[BX0-6,BY0-6,BX1-BX0+12,BY1-BY0+16],speed:1,setup(sim){const g=segs(sim);sim.st.H=g.H2+0.4*(g.H3-g.H2);sim.vis.key='';}},
    {title:'Boiling: the long plateau',text:{bio:'At 100 °C the water boils. Particles escape the liquid and fly off as a gas. This plateau is the longest because pulling particles fully apart takes the most energy.',honors:'Boiling 50 g takes q = mΔH_vap = 50 g × 2260 J/g = 113 kJ, almost 7 times the energy of melting.'},focus:[[BX0-6,BY0-6,BX1-BX0+12,BY1-BY0+16],[430,24,362,270]],speed:1,setup(sim){const g=segs(sim);sim.st.H=g.H3+0.35*(g.H4-g.H3);sim.vis.key='';}},
    {title:'A gas fills the container',text:'Gas particles fly freely and bounce off the walls. Add more heat and they move faster still.',focus:[BX0-6,BY0-6,BX1-BX0+12,BY1-BY0+16],speed:1,setup(sim){const g=segs(sim);sim.st.H=g.H4+0.3*(g.H5-g.H4);sim.vis.key='';}},
    {title:'Cooling runs it backward',text:'Turn the heater negative. Gas condenses and liquid freezes, releasing the same energy on the same plateaus.',focus:[430,24,362,270],speed:1,setup(sim){BioLab.setValues(sim,{power:-100});}},
    {lvl:'ap',title:'Pressure moves the boiling point',text:'Lower the pressure to 0.5 atm and water boils near 81 °C, as it would high in the mountains. The melting point barely moves.',focus:[430,24,362,270],speed:1,pause:true,setup(sim){BioLab.setValues(sim,{P:0.5,power:100,start:'liquid'});restart(sim);}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{sub:'water',start:'solid',power:50,P:1});restart(sim);},
  onChallenge(sim,ch,phase){if(ch&&ch.set&&phase==='done'){BioLab.setValues(sim,ch.set);restart(sim);}},
  challenges(sim){const W=SUBS.water,fus=50*W.Hf/1000,vap=50*W.Hv/1000,tb05=TbAt(W,0.5);return [
    {lvl:'bio',q:'Ice at −40 °C is heated steadily. Once it reaches 0 °C and starts to melt, what does the thermometer do?',choices:['Keeps rising at the same rate','Stays at 0 °C until all the ice has melted','Drops a little while the ice melts'],correct:1,
      baseline:{sub:'water',start:'solid',power:100},reveal:70,changeText:'Heating at full power',watch:'curve',
      explain:'The thermometer reads 0.0 °C on the flat part of the curve. The incoming heat breaks particles out of the lattice instead of making them move faster, so the temperature cannot rise until the ice is gone.'},
    {lvl:'bio',q:'Water is boiling at 100 °C. You turn the burner up to full power. What happens to the water’s temperature?',choices:['It rises above 100 °C','It stays at 100 °C; the water just boils away faster','It drops'],correct:1,
      baseline:{sub:'water',start:'liquid',power:50},change:{power:100},at:200,reveal:320,changeText:'Burner turned up to full',watch:'curve',
      explain:'More heat makes particles escape faster, but each one still leaves at 100 °C. The temperature reads 100 °C until all the liquid is gone. That is why boiling water cooks at the same temperature on high or medium.'},
    {lvl:'honors',instant:true,set:{sub:'water',mass:100,start:'solid'},q:'You double a sample of ice at 0 °C from 50 g to 100 g. How much heat does it take to melt it now?',choices:['The same, '+fus.toFixed(1)+' kJ','Twice as much, '+(2*fus).toFixed(1)+' kJ','Half as much'],correct:1,
      explain:'q = mΔH_fus = 100 g × 334 J/g = '+(2*fus).toFixed(1)+' kJ. Twice the particles need twice the energy to break free. The model is now set to 100 g: the melting plateau on the heating curve is twice as long.'},
    {lvl:'honors',instant:true,q:'For 50 g of water, which takes more heat: melting all the ice at 0 °C, or boiling all the water at 100 °C?',choices:['Melting','Boiling, about 7 times more','About the same'],correct:1,
      explain:'Melting: 50 × 334 J/g = '+fus.toFixed(1)+' kJ. Boiling: 50 × 2260 J/g = '+vap.toFixed(0)+' kJ, '+(vap/fus).toFixed(1)+' times more. Melting only loosens the attractions; boiling breaks them almost completely.'},
    {lvl:'honors',q:'You remove heat from steam. While the steam condenses, what is true?',choices:['The temperature drops steadily','The temperature stays at 100 °C while the steam gives off heat','The steam has to absorb heat to condense'],correct:1,
      baseline:{sub:'water',start:'gas',power:-100},reveal:150,changeText:'Cooling at full power',watch:'curve',
      explain:'Condensing releases ΔH_vap, the same 2260 J/g it took to boil. While that heat flows out, the temperature stays at 100 °C. That is why a steam burn is worse than a burn from 100 °C water.'},
    {lvl:'ap',q:'At 0.50 atm, like on a high mountain, water heated from 25 °C boils at…',choices:['100 °C','about '+tb05.toFixed(0)+' °C','about 120 °C'],correct:1,
      baseline:{sub:'water',start:'liquid',power:100,P:0.5},reveal:150,changeText:'Heating at 0.50 atm',watch:'curve',
      explain:'ln(P₂/P₁) = −(ΔH_vap/R)(1/T₂ − 1/T₁) with ΔH_vap = 40.7 kJ/mol gives T = '+(tb05+273.15).toFixed(1)+' K = '+tb05.toFixed(1)+' °C. Lower pressure on the surface lets particles escape at a lower temperature.'},
    {lvl:'ap',instant:true,q:'At a steady heat flow, which sloped part of water’s heating curve (temperature vs heat) is steepest?',choices:['Ice','Liquid water','Steam, slightly steeper than ice'],correct:2,
      explain:'Slope = ΔT/q = 1/(mc). Steam has the smallest specific heat (2.01 J/g·°C), ice is close (2.09), and liquid water is about twice as large (4.184), so its segment is only half as steep.'},
    {lvl:'ap',q:'During the melting plateau, what happens to the average kinetic energy of the particles?',choices:['It increases with the heat added','It stays constant; the heat raises their potential energy','It decreases'],correct:1,
      baseline:{sub:'water',start:'solid',power:100},reveal:70,changeText:'Heating at full power',watch:'curve',
      explain:'Temperature measures average kinetic energy, KE = (3/2)kT, and the temperature holds at 273.15 K, so KE holds at '+(1.5*kB*273.15*1e21).toFixed(2)+' × 10⁻²¹ J. The heat goes into separating particles against their attractions, which is potential energy.'}
  ];},
  lab:{bio:'<p><b>Question:</b> What happens to the temperature of water as you heat it from ice to steam?</p><ol><li>Start as Solid with the heater at 50%. Press <b>Record trial</b> every time the state changes.</li><li>Watch the heating curve. Mark where the temperature stays flat.</li><li>Turn the heater negative and cool the steam back to ice.</li></ol><p>Explain, using the particles, why the temperature stays flat while the water melts and boils.</p>',
       honors:'<p><b>Question:</b> Can you predict the heat needed for each part of the heating curve?</p><ol><li>For 50 g of water, calculate q for all five parts with q = mcΔT and q = mΔH.</li><li>Run the model and record “Heat added since start” at the end of each part.</li><li>Repeat for 100 g, then for argon.</li></ol><p>Compare your calculations with the model and explain why the boiling plateau is so long.</p>',
       ap:'<p><b>Question:</b> How does pressure change the boiling point?</p><ol><li>Heat liquid water at 0.5, 1.0, 2.0 and 3.0 atm and record the boiling point.</li><li>Plot ln P against 1/T (K).</li><li>Find the slope and calculate ΔH_vap.</li></ol><p><b>Claim–evidence–reasoning:</b> Compare your ΔH_vap with 40.7 kJ/mol and explain the result with kinetic and potential energy.</p>'},
  terms:[{t:'Solid',d:'Particles in fixed places that vibrate. Definite shape and volume.'},{t:'Liquid',d:'Particles in contact that slide past each other. Definite volume, takes the shape of its container.'},
    {t:'Gas',d:'Particles far apart that move freely. Fills its container.'},{t:'Melting point',d:'The temperature where solid and liquid coexist (0 °C for water).'},{t:'Boiling point',d:'The temperature where the liquid’s vapor pressure equals the outside pressure (100 °C for water at 1 atm).'},
    {t:'Heating curve',d:'A graph of temperature against heat added. Flat parts are phase changes.'},
    {lvl:'honors',t:'Specific heat (c)',d:'Heat needed to warm 1 g by 1 °C. q = mcΔT.'},{lvl:'honors',t:'Heat of fusion (ΔH_fus)',d:'Heat needed to melt 1 g at its melting point. Water: 334 J/g.'},{lvl:'honors',t:'Heat of vaporization (ΔH_vap)',d:'Heat needed to boil 1 g at its boiling point. Water: 2260 J/g.'},
    {lvl:'ap',t:'Kinetic energy and temperature',d:'Average kinetic energy per particle is (3/2)kT, so it depends only on the absolute temperature.'},{lvl:'ap',t:'Clausius–Clapeyron equation',d:'ln(P₂/P₁) = −(ΔH_vap/R)(1/T₂ − 1/T₁), which links pressure and boiling point.'}],
  about:'<p>The heating curve is exact for the data used: q = mcΔT on the sloped parts and q = mΔH on the plateaus, with water’s values c(ice) = 2.09, c(water) = 4.184, c(steam) = 2.01 J/g·°C, ΔH_fus = 334 J/g and ΔH_vap = 2260 J/g. Neon, argon and oxygen use handbook melting and boiling points and heats of fusion and vaporization; their specific heats are approximate averages. The sample is treated as having one uniform temperature, so the plateaus are perfectly flat. Real samples have warmer and cooler spots.</p><p>The boiling point at other pressures uses the Clausius–Clapeyron equation with a constant ΔH_vap; it is within about 1 °C of steam tables between 0.3 and 3 atm. The melting point is held fixed, since pressure moves it by less than 0.01 °C per atm. Heater power is a percent of each substance’s full power (200 W for water, 8 to 25 W for the cryogenic gases) so every run takes about a minute.</p><p>The particle view does not compute the temperature. It shows the fractions the energy model calls for: solids vibrate on lattice sites with an amplitude that grows with temperature, liquids jostle in a pool held together by short-range attraction, and gas speeds grow with √T. Ice really has an open lattice that is less dense than liquid water (shown with wider spacing), so in a real beaker ice floats; here the solid stays on the floor.</p>',
  initVis(sim){sim.vis.key='';},
  draw(sim,ctx,vdt,k,t){const P=PAL,s=sub(sim),q=cur(sim),v=sim.vis,w=watts(sim);ctx.fillStyle=P['cv-bg'];ctx.fillRect(0,0,800,450);
    if(v.key!==sim.p.sub+'|'+sim.st.gen)buildVis(sim);rebalance(sim);moveParticles(sim,vdt);
    // container
    ctx.fillStyle=P['cv-bg2'];ctx.fillRect(BX0,BY0,BX1-BX0,BY1-BY0);ctx.strokeStyle=P['cv-glass'];ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(BX0,BY0-14);ctx.lineTo(BX0,BY1);ctx.lineTo(BX1,BY1);ctx.lineTo(BX1,BY0-14);ctx.stroke();
    ctx.fillStyle=P['cv-soft'];ctx.fillRect(BX0-6,BY0-18,BX1-BX0+12,8);
    ctx.save();ctx.beginPath();ctx.rect(BX0,BY0,BX1-BX0,BY1-BY0);ctx.clip();v.P.forEach(p=>drawParticle(ctx,s,p));ctx.restore();
    // heater / cooler plate
    const hot=w>0.01,cold=w<-0.01,mag=Math.abs(sim.p.power)/100;ctx.fillStyle=hot?'rgb('+Math.round(150+100*mag)+',60,30)':cold?'rgb(40,'+Math.round(100+60*mag)+','+Math.round(180+60*mag)+')':P['cv-soft'];rr(ctx,BX0-6,BY1+4,BX1-BX0+12,14,4);ctx.fill();
    txt(ctx,(hot?'Heating: ':cold?'Cooling: ':'Heater off ')+(hot||cold?Math.abs(w).toFixed(w>=10||w<=-10?0:1)+' W':''),(BX0+BX1)/2,BY1+40,{s:14*k,w:700,a:'center'});
    pill(ctx,q.T.toFixed(1)+' °C',BX0+70,BY0-34,P['card'],P['cv-ink'],16*k);
    pill(ctx,phaseText(sim),BX1-100,BY0-34,q.seg===1||q.seg===3?'#a33a12':'#1f5fae','#fff',14*Math.min(k,1.5));
    // heating curve on the stage
    drawCurve(sim,ctx,{L:470,T:40,W:310,H:210,cw:800,ch:290},k,false);
    if(atLeast('honors')&&k<1.25){const lines=eqText(sim).split(': ');txt(ctx,'Now: '+SEGN[q.seg],440,330,{s:14,w:700});txt(ctx,lines[0]+':',440,354,{s:13,c:P['cv-soft']});txt(ctx,lines[1]||'',440,374,{s:13,c:P['cv-soft']});}
    else txt(ctx,'Now: '+SEGN[q.seg],440,340,{s:15*k,w:700});
  },
  thumbSetup(sim){const g=segs(sim);sim.st.H=g.H1+0.5*(g.H2-g.H1);sim.st.Hlo=0;sim.st.Hhi=sim.st.H;}
};
function restart(sim){if(!sim.st)return;const H=Hfor(sim,sim.p.start);Object.assign(sim.st,{H,H0:H,Hlo:H,Hhi:H,m:mass(sim),gen:Math.random()});sim.hist=[];sim.infoDirty=true;}
function drawCurve(sim,ctx,box,k,big){const g=segs(sim),s=g.s,P=PAL,st=sim.st,X=h=>h/1000;
  const pts=[[0,s.T0],[g.H1,s.Tm],[g.H2,s.Tm],[g.H3,g.Tb],[g.H4,g.Tb],[g.H5,s.Tmax]];
  if(big){const ax=axes(ctx,box,{xmin:0,xmax:X(g.H5),ymin:s.T0,ymax:s.Tmax,xl:'Heat added (kJ)',yl:'Temperature (°C)'});plotIn(ctx,ax,pts,st,X,P,13,g,true);return;}
  // compact axes for the stage
  const L=box.L,T=box.T,W=box.W,H=box.H,xm=X(g.H5),Xp=x=>L+x/xm*W,Yp=y=>T+H-(y-s.T0)/(s.Tmax-s.T0)*H;
  ctx.fillStyle=P['card'];rr(ctx,L-40,T-16,W+52,H+56,10);ctx.fill();ctx.strokeStyle=P['line'];ctx.lineWidth=1;ctx.stroke();
  ctx.strokeStyle=P['g-axis'];ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(L,T);ctx.lineTo(L,T+H);ctx.lineTo(L+W,T+H);ctx.stroke();
  [s.Tm,g.Tb].forEach(v=>{ctx.strokeStyle=P['g-grid'];ctx.setLineDash([3,4]);ctx.beginPath();ctx.moveTo(L,Yp(v));ctx.lineTo(L+W,Yp(v));ctx.stroke();ctx.setLineDash([]);});
  txt(ctx,fmtT(s.Tm),L-6,Yp(s.Tm),{s:12*k,a:'right',b:'middle',c:P['g-axis']});if(Yp(s.Tm)-Yp(g.Tb)>12*k)txt(ctx,fmtT(g.Tb),L-6,Yp(g.Tb),{s:12*k,a:'right',b:'middle',c:P['g-axis']});
  txt(ctx,'heat added →',L+W,T+H+18*Math.min(k,1.3),{s:12*k,a:'right',c:P['muted']});txt(ctx,'T (°C)',L-6,T-4,{s:12*k,a:'right',c:P['muted']});
  plotIn(ctx,{X:x=>Xp(x),Y:Yp},pts,st,X,P,12*k,g,false);}
const fmtT=v=>(Math.abs(v)>=100?v.toFixed(0):v.toFixed(Math.abs(v%1)>0.05?1:0));
function plotIn(ctx,ax,pts,st,X,P,fs,g,big){ctx.save();ctx.setLineDash([5,5]);ctx.strokeStyle=P['muted'];ctx.lineWidth=1.5;ctx.beginPath();pts.forEach((p,i)=>{const x=ax.X(X(p[0])),y=ax.Y(p[1]);i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.stroke();ctx.setLineDash([]);
  // the part you have actually traveled
  const lo=st.Hlo,hi=st.Hhi;ctx.strokeStyle=P['s1'];ctx.lineWidth=big?3:3.5;ctx.beginPath();let first=true;
  for(let i=0;i<pts.length-1;i++){const a=pts[i],b=pts[i+1];const h0=Math.max(a[0],lo),h1=Math.min(b[0],hi);if(h1<h0)continue;const f0=(h0-a[0])/Math.max(1e-9,b[0]-a[0]),f1=(h1-a[0])/Math.max(1e-9,b[0]-a[0]);
    const x0=ax.X(X(h0)),y0=ax.Y(lerp(a[1],b[1],f0)),x1=ax.X(X(h1)),y1=ax.Y(lerp(a[1],b[1],f1));if(first){ctx.moveTo(x0,y0);first=false;}else ctx.lineTo(x0,y0);ctx.lineTo(x1,y1);}ctx.stroke();
  const q=st.H,Tq=(()=>{for(let i=0;i<pts.length-1;i++){if(q<=pts[i+1][0]){const f=(q-pts[i][0])/Math.max(1e-9,pts[i+1][0]-pts[i][0]);return lerp(pts[i][1],pts[i+1][1],f);}}return pts[5][1];})();
  ctx.fillStyle=P['s1'];ctx.beginPath();ctx.arc(ax.X(X(q)),ax.Y(Tq),6,0,6.283);ctx.fill();ctx.strokeStyle=P['card'];ctx.lineWidth=2;ctx.stroke();
  if(atLeast('honors')){const mid=(a,b)=>ax.X(X((a+b)/2));txt(ctx,'melting',mid(g.H1,g.H2),ax.Y(pts[1][1])-10,{s:fs,w:700,a:'center',c:P['cv-soft']});txt(ctx,'boiling',mid(g.H3,g.H4),ax.Y(pts[3][1])-10,{s:fs,w:700,a:'center',c:P['cv-soft']});}
  ctx.restore();}
BioLab.register(SIM);
})();
