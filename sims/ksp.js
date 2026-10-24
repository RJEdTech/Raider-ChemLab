(function(){
'use strict';
const {clamp,lerp,rng,rr,txt,pill,atLeast,PAL,FONT,RM,legend,serColor}=BioLab.h;
const CL=window.ChemLab;
/* Solubility equilibrium MₐXᵦ(s) ⇌ aM(aq) + bX(aq), Ksp = [M]ᵃ[X]ᵇ (25 °C, CRC values).
   The exact equilibrium (how much solid remains or precipitates) is found by bisection; the mixture relaxes toward it with τ = 1.2 s.
   The zoom shows dissolved ions (counts follow the computed concentrations) and the crystal surface trading ions with the solution. */
const VOL=0.1000;                           // L of solution in the beaker
const SALT={
  AgCl:{f:'AgCl',cat:'Ag',an:'Cl',a:1,b:1,q:[1,-1],Ksp:1.77e-10,M:143.32,ci:{f:'NaCl',ion:'an'},color:'#f4f4ef',expr:'s²'},
  BaSO4:{f:'BaSO4',cat:'Ba',an:'SO4',a:1,b:1,q:[2,-2],Ksp:1.08e-10,M:233.39,ci:{f:'Na2SO4',ion:'an'},color:'#f4f4ef',expr:'s²'},
  PbI2:{f:'PbI2',cat:'Pb',an:'I',a:1,b:2,q:[2,-1],Ksp:9.8e-9,M:461.0,ci:{f:'KI',ion:'an'},color:'#f2c80f',expr:'4s³'},
  CaF2:{f:'CaF2',cat:'Ca',an:'F',a:1,b:2,q:[2,-1],Ksp:3.45e-11,M:78.07,ci:{f:'NaF',ion:'an'},color:'#f4f4ef',expr:'4s³'},
  MgOH2:{f:'Mg(OH)2',cat:'Mg',an:'OH',a:1,b:2,q:[2,-1],Ksp:5.61e-12,M:58.32,ci:{f:'MgCl2',ion:'cat'},color:'#f4f4ef',expr:'4s³'},
  Ag2CrO4:{f:'Ag2CrO4',cat:'Ag',an:'CrO4',a:2,b:1,q:[1,-2],Ksp:1.12e-12,M:331.73,ci:{f:'AgNO3',ion:'cat'},color:'#b5402a',expr:'4s³'}
};
const MIX={AgCl:['AgNO3','NaCl'],BaSO4:['BaCl2','Na2SO4'],PbI2:['Pb(NO3)2','KI'],CaF2:['CaCl2','NaF'],MgOH2:['MgCl2','NaOH'],Ag2CrO4:['AgNO3','K2CrO4']};
const ICOL={Ag:'#8d97a5',Cl:'#2e9e5b',Ba:'#4f8f4a',SO4:'#c9a227',Pb:'#5b6470',I:'#7b3fb0',Ca:'#3a7bd5',F:'#86b84a',Mg:'#3f8f6f',OH:'#d64545',CrO4:'#e09a00'};
const ION=(id,q)=>CL.fmt(id,q);
const sOf=S=>S.a===1&&S.b===1?Math.sqrt(S.Ksp):Math.cbrt(S.Ksp/4);
const fmtS=v=>!Number.isFinite(v)?'—':v===0?'0':CL.sci(v,'',3);
const salt=p=>SALT[p.salt];
const buffered=p=>p.salt==='MgOH2'&&p.buf&&atLeast('ap')&&p.mode==='dissolve';
/* totals in mol/L: everything that could be dissolved */
function totals(sim){const p=sim.p,S=salt(p);
  if(p.mode==='mix')return {C:+p.m1/2,A:+p.m2/2,solid0:0};   // equal volumes: each solution is diluted by half
  const n=(+p.amt)/1000/S.M,St=n/VOL,c=atLeast('honors')&&!buffered(p)?+p.common:0;let C=S.a*St,A=S.b*St;if(S.ci.ion==='an')A+=c;else C+=c;return {C,A,St,solid0:St,c};}
/* equilibrium solid amount (mol/L of formula units) for given totals */
function solveSolid(S,C,A,OHfix){
  if(OHfix){const Mmax=S.Ksp/(OHfix*OHfix);return Math.max(0,C/S.a-Mmax);}   // buffered hydroxide: [OH⁻] held fixed
  const Q=z=>Math.pow(Math.max(0,C-S.a*z),S.a)*Math.pow(Math.max(0,A-S.b*z),S.b);if(Q(0)<=S.Ksp)return 0;
  let lo=0,hi=Math.min(C/S.a,A/S.b);for(let i=0;i<200;i++){const m=(lo+hi)/2;if(Q(m)>S.Ksp)lo=m;else hi=m;}return (lo+hi)/2;}
function ions(sim){const st=sim.st,S=salt(sim.p);const OH=st.OHfix;return {cat:Math.max(0,st.C-S.a*st.solid),an:OH?OH:Math.max(0,st.A-S.b*st.solid)};}
function Qnow(sim){const S=salt(sim.p),i=ions(sim);return Math.pow(i.cat,S.a)*Math.pow(i.an,S.b);}
/* molar solubility = salt dissolved per liter (from the solid you added) */
function dissolvedS(sim){const st=sim.st,p=sim.p;if(p.mode==='mix')return NaN;return st.St-st.solid;}
const keyOf=p=>[p.mode,p.salt,p.amt,p.common,p.m1,p.m2,p.buf,p.pH,atLeast('honors'),atLeast('ap')].join('|');
function fresh(sim){const p=sim.p,S=salt(p),T=totals(sim);const st={key:keyOf(p),C:T.C,A:T.A,St:T.St||0,solid:T.solid0,OHfix:buffered(p)?Math.pow(10,p.pH-14):0,vis:[],rnd:rng(99),ex:0,poured:0};
  st.eq=solveSolid(S,st.C,st.A,st.OHfix);if(p.mode==='mix')st.poured=1;return st;}
function syncMode(sim){if(!sim.ui||!sim.ui.sec)return;const d=sim.def,p=sim.p;
  d.controls.forEach(c=>{if(!c.show)return;const v=atLeast(c.lvl)&&c.show(p);c.noTrial=!v;const cid=d.id+'-'+c.id,e=document.getElementById(cid)||document.getElementById(cid+'-l');if(!e)return;const w=e.closest('.ctl');if(w)w.hidden=!v;});
  d.metrics.forEach(m=>{if(!m.show)return;const v=atLeast(m.lvl)&&m.show(p);m.noTrial=!v;const t=sim.ui.tiles[m.id];if(!t)return;const w=t.num.closest('.tile');if(w)w.hidden=!v;});
  const sel=document.getElementById(d.id+'-common');if(sel){const S=salt(p);const lab=sel.closest('.ctl').querySelector('label');if(lab)lab.textContent='Add '+CL.fmt(S.ci.f)+' (common ion '+(S.ci.ion==='an'?ION(S.an,S.q[1]):ION(S.cat,S.q[0]))+')';}}
const isD=p=>p.mode==='dissolve',isX=p=>p.mode==='mix';

/* ---------- zoom-circle ions ---------- */
const ZX=420,ZY=232,ZR=150,LAT_Y=ZY+ZR-34;
function scaleOf(S){return sOf(S)/8;}          // mol/L per drawn formula unit
function targetCounts(sim){const S=salt(sim.p),i=ions(sim),u=scaleOf(S);return {cat:Math.round(i.cat/u),an:Math.round(i.an/u)};}
const CAP=46;
function syncIons(sim,dt){const st=sim.st,p=sim.p,S=salt(p),tc=targetCounts(sim),r=st.rnd;
  const hasSolid=st.solid>1e-15;
  ['cat','an'].forEach(kind=>{const want=Math.min(CAP,tc[kind]);let have=st.vis.filter(v=>v.k===kind&&!v.go).length;
    while(have<want){const fromLat=hasSolid||st.solid>0;const x=ZX+(r()-.5)*ZR*1.3,y=fromLat?LAT_Y-6:ZY+(r()-.5)*ZR*1.2;st.vis.push({k:kind,x,y,vx:(r()-.5)*20,vy:fromLat?-25-r()*20:0,fl:fromLat?0.4:0});have++;}
    while(have>want){const list=st.vis.filter(v=>v.k===kind&&!v.go);const v=list[Math.floor(r()*list.length)];v.go=1;have--;}});
  // at equilibrium with solid present, ions keep trading places with the crystal
  if(hasSolid&&!st.OHfix){st.ex+=dt*2.2;while(st.ex>=1){st.ex-=1;const kind=r()<S.a/(S.a+S.b)?'cat':'an';const list=st.vis.filter(v=>v.k===kind&&!v.go);if(!list.length)break;const v=list[Math.floor(r()*list.length)];v.go=1;st.vis.push({k:kind,x:ZX+(r()-.5)*ZR*1.2,y:LAT_Y-6,vx:(r()-.5)*20,vy:-30,fl:0.4});}}
  st.vis.forEach(v=>{if(v.go){const tx=clamp(v.x,ZX-ZR*0.6,ZX+ZR*0.6),ty=LAT_Y-4;v.vx=(tx-v.x)*2.2;v.vy=(ty-v.y)*2.2;if(Math.abs(v.y-ty)<5)v.dead=1;}
    else{v.vx+=(r()-.5)*260*dt;v.vy+=(r()-.5)*260*dt;const sp=Math.hypot(v.vx,v.vy);if(sp>34){v.vx*=34/sp;v.vy*=34/sp;}}
    v.x+=v.vx*dt;v.y+=v.vy*dt;if(v.fl)v.fl=Math.max(0,v.fl-dt);
    const dx=v.x-ZX,dy=v.y-ZY,d=Math.hypot(dx,dy),lim=ZR-12;if(!v.go&&d>lim){v.x=ZX+dx/d*lim;v.y=ZY+dy/d*lim;v.vx*=-0.5;v.vy*=-0.5;}
    if(!v.go&&hasSolid&&v.y>LAT_Y-14){v.y=LAT_Y-14;v.vy=-Math.abs(v.vy);}});
  st.vis=st.vis.filter(v=>!v.dead);}

const KSP={
  id:'ksp',hash:'ksp',apUnit:13,order:2,kind:'Simulation',tab:'Solubility and Ksp',
  prereq:['equilibrium','precip'],next:['buffers','solcurve'],
  card:'Drop “insoluble” salts into water, watch a few ions escape until the solution is saturated, and use Ksp and Q to predict precipitates.',
  title:'Solubility equilibrium and Ksp',
  lede:{bio:'Even an “insoluble” salt dissolves a tiny bit. Add a salt to water and watch ions leave the crystal until the solution is saturated. After that, extra solid just sits there.',
        honors:'At saturation, dissolving and precipitating run at the same rate: Ksp = [ions] at equilibrium. Add a common ion and watch the solubility drop, or mix two solutions and use Q to predict a precipitate.',
        ap:'Relate Ksp to molar solubility (s², 4s³), compare salts with different formulas, quantify the common-ion effect, and see why hydroxides dissolve in acid.'},
  scale:{bio:'The beaker holds 100.0 mL of water. The circle zooms in on the solution just above the crystal, about 10 nanometers across.',
         ap:'Beaker: 100.0 mL at 25 °C. In the zoom, each ion drawn stands for s/8 mol/L of that salt’s formula units, so a saturated solution in pure water shows 8 formula units.'},
  aspect:1.6,timeScale:1,dtMax:0.02,prewarm:8,sampleDt:0.1,window:30,unit:'s',chChange:3,chReveal:9,
  controls:[
    {id:'mode',label:'Experiment',type:'seg',def:'dissolve',lvl:'bio',options:[{v:'dissolve',l:'Dissolve a salt'},{v:'mix',l:'Mix two solutions',lvl:'honors'}]},
    {id:'salt',label:'Salt',type:'select',def:'AgCl',lvl:'bio',options:[{v:'AgCl',l:'AgCl, silver chloride'},{v:'PbI2',l:'PbI₂, lead(II) iodide'},{v:'BaSO4',l:'BaSO₄, barium sulfate'},{v:'CaF2',l:'CaF₂, calcium fluoride',lvl:'honors'},{v:'MgOH2',l:'Mg(OH)₂, magnesium hydroxide',lvl:'honors'},{v:'Ag2CrO4',l:'Ag₂CrO₄, silver chromate',lvl:'honors'}]},
    {id:'amt',label:'Solid added to 100.0 mL',type:'select',def:'5',lvl:'bio',show:isD,options:[{v:'0',l:'none'},{v:'0.1',l:'0.1 mg'},{v:'0.5',l:'0.5 mg'},{v:'1',l:'1 mg'},{v:'5',l:'5 mg'},{v:'20',l:'20 mg'},{v:'100',l:'100 mg'},{v:'500',l:'500 mg'}],help:'A grain of salt is about 0.1 mg.'},
    {id:'common',label:'Add a common ion',type:'select',def:'0',lvl:'honors',show:p=>isD(p)&&!buffered(p),options:[{v:'0',l:'none'},{v:'0.001',l:'0.001 M'},{v:'0.01',l:'0.010 M'},{v:'0.1',l:'0.10 M'}]},
    {id:'buf',label:'Hold the pH with a buffer',type:'toggle',def:false,lvl:'ap',show:p=>isD(p)&&p.salt==='MgOH2'},
    {id:'pH',label:'Buffer pH',type:'range',min:8,max:12,step:0.5,def:11,unit:'',lvl:'ap',show:p=>isD(p)&&p.salt==='MgOH2'&&p.buf,help:'Mg(OH)₂ in pure water reaches about pH 10.3.'},
    {id:'m1',label:'Cation solution (50.0 mL)',type:'select',def:'0.0001',lvl:'honors',show:isX,options:[{v:'0.00001',l:'1.0 × 10⁻⁵ M'},{v:'0.0001',l:'1.0 × 10⁻⁴ M'},{v:'0.001',l:'1.0 × 10⁻³ M'},{v:'0.01',l:'0.010 M'},{v:'0.1',l:'0.10 M'}]},
    {id:'m2',label:'Anion solution (50.0 mL)',type:'select',def:'0.0001',lvl:'honors',show:isX,options:[{v:'0.00001',l:'1.0 × 10⁻⁵ M'},{v:'0.0001',l:'1.0 × 10⁻⁴ M'},{v:'0.001',l:'1.0 × 10⁻³ M'},{v:'0.01',l:'0.010 M'},{v:'0.1',l:'0.10 M'}]}
  ],
  actions:[{id:'again',label:'Start again',lvl:'bio',primary:true,run(sim){sim.st=fresh(sim);}}],
  init(sim){return fresh(sim);},
  step(sim,dt){const p=sim.p;if(keyOf(p)!==sim.st.key){const o=sim.st,nw=fresh(sim);
      // same salt, still dissolving: keep what has already dissolved and change only what you added
      if(isD(p)&&o.salt===p.salt&&o.mode==='dissolve'){const x=Math.max(0,o.St-o.solid);nw.solid=Math.max(0,nw.St-x);nw.vis=o.vis;}
      sim.st=nw;}
    const st=sim.st,S=salt(p);st.salt=p.salt;st.mode=p.mode;
    st.OHfix=buffered(p)?Math.pow(10,p.pH-14):0;if(st.OHfix)st.A=Math.max(st.A,0);
    st.eq=solveSolid(S,st.C,st.A,st.OHfix);const before=st.solid;st.solid+=(st.eq-st.solid)*(1-Math.exp(-dt/1.2));if(Math.abs(st.solid-st.eq)<0.01*Math.max(st.eq,st.St||0,sOf(S)))st.solid=st.eq;
    st.dRate=(before-st.solid)/dt;syncIons(sim,dt);},
  metrics:[
    {id:'state',label:'The solution is',unit:'',lvl:'bio',text:true,get:s=>stateText(s)},
    {id:'ions',label:'Ions in solution',unit:'',lvl:'bio',text:true,get:s=>{const S=salt(s.p),i=ions(s);return '['+ION(S.cat,S.q[0])+'] = '+fmtS(i.cat)+' M,  ['+ION(S.an,S.q[1])+'] = '+fmtS(i.an)+' M';}},
    {id:'solid',label:'Solid in the beaker',unit:'mg',lvl:'bio',min:0,max:null,d:2,get:s=>s.st.solid*VOL*salt(s.p).M*1000},
    {id:'s',label:'Molar solubility s (dissolved)',unit:'',lvl:'honors',text:true,show:isD,get:s=>fmtS(dissolvedS(s))+' M'},
    {id:'Q',label:'Ion product Q',unit:'',lvl:'honors',text:true,get:s=>fmtS(Qnow(s))},
    {id:'Ksp',label:'Ksp at 25 °C',unit:'',lvl:'honors',text:true,get:s=>fmtS(salt(s.p).Ksp)},
    {id:'lq',label:'log(Q/Ksp)',unit:'',lvl:'ap',min:-3,max:3,d:2,get:s=>{const q=Qnow(s);return q>0?Math.log10(q/salt(s.p).Ksp):NaN;}},
    {id:'gL',label:'Solubility',unit:'mg per 100 mL',lvl:'ap',min:0,max:null,d:3,show:isD,get:s=>Math.max(0,dissolvedS(s))*VOL*salt(s.p).M*1000}
  ],
  graphs:[{id:'qk',label:'Q compared with Ksp over time',lvl:'bio',custom:true},{id:'sc',label:'Solubility vs common-ion concentration',lvl:'honors',custom:true}],
  defaultGraph:'qk',
  plot(sim,ctx,box,id){const p=sim.p,S=salt(p);
    if(id==='qk'){const win=30,xmax=Math.max(win,sim.t),xmin=xmax-win;const rows=sim.hist.filter(r=>r.t>=xmin&&Number.isFinite(r.v.lq));const ys=rows.map(r=>clamp(r.v.lq,-6,6));
      const lo=Math.min(-1,...ys)-0.3,hi=Math.max(1,...ys)+0.3;const ax=BioLab.h.axes(ctx,box,{xmin,xmax,ymin:lo,ymax:hi,xl:'Time (s)',yl:'log(Q / Ksp)',yd:1});
      ctx.save();ctx.beginPath();ctx.rect(box.L,box.T,box.W,box.H);ctx.clip();ctx.setLineDash([5,4]);ctx.strokeStyle=PAL['muted'];ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(box.L,ax.Y(0));ctx.lineTo(box.L+box.W,ax.Y(0));ctx.stroke();ctx.setLineDash([]);
      ctx.strokeStyle=PAL['g-line'];ctx.lineWidth=2.5;ctx.beginPath();rows.forEach((r,i)=>{const X=ax.X(r.t),Y=ax.Y(ys[i]);i?ctx.lineTo(X,Y):ctx.moveTo(X,Y);});ctx.stroke();ctx.restore();
      txt(ctx,'above 0: supersaturated, precipitate forms',box.L+8,box.T+14,{s:12,c:PAL['muted']});txt(ctx,'below 0: unsaturated, more can dissolve',box.L+8,box.T+box.H-8,{s:12,c:PAL['muted']});return;}
    // solubility vs common ion (analytic)
    const pts=[];for(let e=-6;e<=-0.9;e+=0.05){const c=Math.pow(10,e);const sol=solveCommon(S,c);pts.push([e,Math.log10(sol)]);}
    const ys=pts.map(q=>q[1]),ax=BioLab.h.axes(ctx,box,{xmin:-6,xmax:-1,ymin:Math.min(...ys)-0.3,ymax:Math.max(...ys)+0.3,xl:'log [common ion added] (M)',yl:'log s (M)',xd:0,yd:0});
    ctx.save();ctx.beginPath();ctx.rect(box.L,box.T,box.W,box.H);ctx.clip();ctx.strokeStyle=PAL['g-line'];ctx.lineWidth=2.5;ctx.beginPath();pts.forEach(([x,y],i)=>i?ctx.lineTo(ax.X(x),ax.Y(y)):ctx.moveTo(ax.X(x),ax.Y(y)));ctx.stroke();
    const c=+p.common;if(c>0&&isD(p)){const yy=Math.log10(solveCommon(S,c));ctx.fillStyle=PAL['g-dot'];ctx.beginPath();ctx.arc(ax.X(Math.log10(c)),ax.Y(yy),6,0,6.29);ctx.fill();}ctx.restore();
    txt(ctx,'pure water: s = '+fmtS(sOf(S))+' M',box.L+box.W,box.T+14,{s:12,c:PAL['muted'],a:'right'});},
  narrate(sim){const p=sim.p,S=salt(p),st=sim.st,hon=atLeast('honors'),ap=atLeast('ap'),lr=Math.log10(Math.max(1e-300,Qnow(sim))/S.Ksp),sat=Math.abs(lr)<0.01;
    const name=CL.fmt(S.f);
    if(isX(p)){const Q0=Math.pow(+p.m1/2*1,S.a)*Math.pow(+p.m2/2,S.b);const ppt=Q0>S.Ksp;
      return 'Right after mixing, each ion is diluted by half, so Q = '+fmtS(Q0)+(ppt?' &gt; Ksp = '+fmtS(S.Ksp)+'. <b>A precipitate of '+name+' forms</b> until Q falls to Ksp.':' &lt; Ksp = '+fmtS(S.Ksp)+'. <b>No precipitate:</b> the ions stay dissolved.');}
    if(+p.amt===0)return 'Pure water. Choose an amount of solid to add.';
    if(st.solid<=1e-15&&st.eq===0)return '<b>All of the '+name+' dissolved.</b> The solution is unsaturated: '+(hon?'Q = '+fmtS(Qnow(sim))+' is below Ksp, so more could dissolve.':'it could hold more.');
    if(!sat)return (lr<0?'Ions are leaving the crystal faster than they rejoin it.':'Ions are joining the crystal faster than they leave.')+' The solution is heading toward saturation.';
    let s='<b>Saturated.</b> Ions leave the crystal and rejoin it at the same rate, so the amount dissolved stays at '+fmtS(dissolvedS(sim))+' M.';
    if(hon&&+p.common>0)s+=' The extra '+(S.ci.ion==='an'?ION(S.an,S.q[1]):ION(S.cat,S.q[0]))+' from '+CL.fmt(S.ci.f)+' pushes the equilibrium toward the solid, so less dissolves than in pure water ('+fmtS(sOf(S))+' M).';
    else if(buffered(p))s+=' The buffer holds [OH⁻] at '+fmtS(st.OHfix)+' M, so [Mg²⁺] = Ksp/[OH⁻]². Lower pH means less OH⁻ and much more Mg(OH)₂ dissolves.';
    else if(hon)s+=' Ksp = ['+ION(S.cat,S.q[0])+']'+(S.a>1?'²':'')+'['+ION(S.an,S.q[1])+']'+(S.b>1?'²':'')+' = '+S.expr+'.';
    else s+=' Adding more solid will not make more dissolve.';
    return s;},
  tour:[
    {title:'An “insoluble” salt',text:'5 mg of silver chloride is dropped into 100 mL of water. Almost all of it stays as a white solid at the bottom of the beaker.',focus:[16,56,270,400],speed:0.5,setup(sim){BioLab.setValues(sim,{mode:'dissolve',salt:'AgCl',amt:'5',common:'0'});syncMode(sim);sim.st=fresh(sim);}},
    {title:'Ions escape the crystal',text:{bio:'Zoom in: a few Ag⁺ and Cl⁻ ions break away from the crystal surface and drift into the water.',honors:'AgCl(s) ⇌ Ag⁺(aq) + Cl⁻(aq). Water molecules pull ions off the lattice; ions that bump back into the surface can stick again.'},focus:[ZX-ZR-6,ZY-ZR-22,2*ZR+12,2*ZR+28],speed:0.3},
    {title:'Saturated',text:{bio:'Soon ions leave and rejoin the crystal at the same rate. The solution is saturated: it holds as much AgCl as it can, about 0.0019 g per liter.',honors:'At saturation, Q = [Ag⁺][Cl⁻] = Ksp = 1.77 × 10⁻¹⁰. The equilibrium is dynamic: ions keep trading places with the crystal.'},focus:[ZX-ZR-6,ZY-ZR-22,2*ZR+12,2*ZR+28],speed:0.5},
    {title:'More solid, same solution',text:'Adding 100 mg instead of 5 mg just leaves more solid on the bottom. The concentration of dissolved ions does not change.',focus:[[16,56,270,400],[594,56,194,336]],speed:0.5,setup(sim){BioLab.setValues(sim,{amt:'100'});}},
    {title:'Q vs Ksp',text:{bio:'The bar compares the ions in solution with the saturation point. Left of the line, more can dissolve. Right of it, solid forms.',honors:'Q < Ksp: unsaturated, more dissolves. Q = Ksp: saturated. Q > Ksp: a precipitate forms.'},focus:[16,404,772,90],speed:0.5},
    {lvl:'honors',title:'The common-ion effect',text:'Add 0.010 M NaCl. The extra Cl⁻ pushes the equilibrium back toward solid AgCl, so the dissolved Ag⁺ drops about a thousandfold.',focus:[ZX-ZR-6,ZY-ZR-22,2*ZR+12,2*ZR+28],speed:0.5,setup(sim){BioLab.setValues(sim,{amt:'5',common:'0.01'});}},
    {lvl:'honors',title:'Will a precipitate form?',text:'Mix 50 mL of 1.0 × 10⁻⁴ M AgNO₃ with 50 mL of 1.0 × 10⁻⁴ M NaCl. After mixing each is 5.0 × 10⁻⁵ M, so Q = 2.5 × 10⁻⁹ > Ksp: AgCl precipitates.',focus:[[16,56,270,400],[16,404,772,90]],speed:0.5,setup(sim){BioLab.setValues(sim,{mode:'mix',m1:'0.0001',m2:'0.0001',common:'0'});syncMode(sim);}},
    {lvl:'ap',title:'Hydroxides and pH',text:'Mg(OH)₂ in a buffer: at pH 11, [OH⁻] = 10⁻³ M and [Mg²⁺] = Ksp/[OH⁻]² = 5.6 × 10⁻⁶ M. Each pH unit lower raises the solubility 100-fold.',focus:[[16,56,270,400],[594,56,194,336]],speed:0.5,setup(sim){BioLab.setValues(sim,{mode:'dissolve',salt:'MgOH2',amt:'20',buf:true,pH:11});syncMode(sim);}}
  ],
  onTourExit(sim){const base={};sim.def.controls.forEach(c=>base[c.id]=c.def);BioLab.setValues(sim,base);syncMode(sim);sim.st=fresh(sim);},
  onChallenge(sim,ch,phase){if(ch&&ch.instant&&ch.set&&phase==='done'){BioLab.setValues(sim,ch.set);syncMode(sim);sim.st=fresh(sim);for(let i=0;i<500;i++)sim.def.step(sim,0.02);}},
  challenges:[
    {lvl:'bio',q:'A beaker of water has 5 mg of AgCl on the bottom and the solution is saturated. You add another 95 mg of AgCl. What happens to the amount of dissolved silver ion?',choices:['It goes up, because there is more solid','It stays the same; the extra solid just sits on the bottom','It goes down'],correct:1,
     baseline:{mode:'dissolve',salt:'AgCl',amt:'5'},change:{amt:'100'},changeText:'Now 100 mg of AgCl in the same 100 mL',watch:'qk',
     explain:{bio:'A saturated solution already holds all the AgCl it can at this temperature. Extra solid adds to the pile at the bottom, but the Ions in solution readout stays at 1.33 × 10⁻⁵ M.',honors:'Solids do not appear in the Ksp expression, so the amount of solid does not affect [Ag⁺] once the solution is saturated.'}},
    {lvl:'bio',q:'You add 0.1 mg of AgCl to 100 mL of water. What will you see once it settles?',choices:['Some solid stays on the bottom','It all dissolves, because only 0.19 mg can dissolve in 100 mL','Nothing dissolves at all'],correct:1,
     baseline:{mode:'dissolve',salt:'AgCl',amt:'0'},change:{amt:'0.1'},changeText:'0.1 mg AgCl added',watch:'qk',
     explain:{bio:'“Insoluble” really means “very slightly soluble.” 100 mL of water can hold about 0.19 mg of AgCl. 0.1 mg is less than that, so it all dissolves and the solution is unsaturated.'}},
    {lvl:'bio',instant:true,set:{mode:'dissolve',salt:'PbI2',amt:'100'},q:'Which dissolves more in water: lead(II) iodide or silver chloride?',choices:['Lead(II) iodide','Silver chloride','They dissolve the same'],correct:0,
     explain:{bio:'PbI₂ dissolves about 62 mg per 100 mL, while AgCl dissolves only 0.19 mg. The model is now showing PbI₂: look at the bright yellow solid and the much larger number of ions.',honors:'s(PbI₂) = 1.35 × 10⁻³ M vs s(AgCl) = 1.33 × 10⁻⁵ M, a factor of 100.'}},
    {lvl:'honors',q:'AgCl is saturated in pure water. You add NaCl until [Cl⁻] = 0.010 M. What happens to the amount of dissolved AgCl?',choices:['It increases, because there are more ions around','It drops sharply','It stays the same, because Ksp did not change'],correct:1,
     baseline:{mode:'dissolve',salt:'AgCl',amt:'5',common:'0'},change:{common:'0.01'},changeText:'0.010 M NaCl added',watch:'qk',
     explain:{honors:'Ksp stays the same, but now [Cl⁻] is fixed near 0.010 M, so [Ag⁺] = Ksp/0.010 = 1.8 × 10⁻⁸ M, about 750 times less than in pure water. Extra Cl⁻ shifts AgCl(s) ⇌ Ag⁺ + Cl⁻ to the left: the common-ion effect.'}},
    {lvl:'honors',q:'You mix 50 mL of 1.0 × 10⁻⁴ M AgNO₃ with 50 mL of 1.0 × 10⁻⁴ M NaCl. Very dilute! Does AgCl precipitate?',choices:['No, the solutions are too dilute','Yes, because Q > Ksp after mixing','Only if you heat it'],correct:1,
     baseline:{mode:'mix',salt:'AgCl',m1:'0.00001',m2:'0.00001'},change:{m1:'0.0001',m2:'0.0001'},changeText:'Mixed the 1.0 × 10⁻⁴ M solutions',watch:'qk',
     explain:{honors:'After mixing, [Ag⁺] = [Cl⁻] = 5.0 × 10⁻⁵ M, so Q = 2.5 × 10⁻⁹. That is bigger than Ksp = 1.77 × 10⁻¹⁰, so AgCl precipitates until Q = Ksp. The 1.0 × 10⁻⁵ M mix before it gave Q = 2.5 × 10⁻¹¹ < Ksp, so nothing formed.'}},
    {lvl:'honors',instant:true,set:{mode:'dissolve',salt:'PbI2',amt:'100',common:'0'},q:'PbI₂(s) ⇌ Pb²⁺ + 2I⁻. If s is the molar solubility, Ksp equals…',choices:['s²','2s²','4s³'],correct:2,
     explain:{honors:'[Pb²⁺] = s and [I⁻] = 2s, so Ksp = (s)(2s)² = 4s³. With Ksp = 9.8 × 10⁻⁹, s = (Ksp/4)^(1/3) = 1.35 × 10⁻³ M, matching the readout.'}},
    {lvl:'ap',q:'Mg(OH)₂ sits in a buffer at pH 12. You lower the pH to 9. The amount of dissolved Mg(OH)₂…',choices:['barely changes, because Ksp is fixed','rises enormously, until all the solid is gone','falls'],correct:1,
     baseline:{mode:'dissolve',salt:'MgOH2',amt:'100',buf:true,pH:12},change:{pH:9},changeText:'Buffer pH lowered from 12 to 9',watch:'qk',
     explain:{ap:'[Mg²⁺] = Ksp/[OH⁻]². Going from pH 12 to 9 cuts [OH⁻] by 10³, so the solubility limit rises 10⁶ times, from 5.6 × 10⁻⁸ M to 0.056 M. That is more than enough to dissolve all 100 mg (0.017 M). This is how antacids containing Mg(OH)₂ dissolve in stomach acid.'}},
    {lvl:'ap',instant:true,set:{mode:'dissolve',salt:'Ag2CrO4',amt:'20',common:'0'},q:'Ag₂CrO₄ has Ksp = 1.1 × 10⁻¹² and AgCl has Ksp = 1.8 × 10⁻¹⁰. Which has the larger molar solubility?',choices:['AgCl, because its Ksp is larger','Ag₂CrO₄','They are equal'],correct:1,
     explain:{ap:'You can only compare Ksp values directly for salts with the same ion ratio. Ag₂CrO₄: Ksp = 4s³, s = 6.5 × 10⁻⁵ M. AgCl: Ksp = s², s = 1.3 × 10⁻⁵ M. So Ag₂CrO₄ is about 5 times more soluble despite its much smaller Ksp.'}},
    {lvl:'ap',instant:true,set:{mode:'dissolve',salt:'CaF2',amt:'5',common:'0.01'},q:'What is the molar solubility of CaF₂ (Ksp = 3.45 × 10⁻¹¹) in 0.010 M NaF?',choices:['2.0 × 10⁻⁴ M','3.5 × 10⁻⁷ M','3.5 × 10⁻⁹ M'],correct:1,
     explain:{ap:'[F⁻] ≈ 0.010 M, so s = [Ca²⁺] = Ksp/[F⁻]² = 3.45 × 10⁻¹¹/1.0 × 10⁻⁴ = 3.5 × 10⁻⁷ M, nearly 600 times less than in pure water (2.0 × 10⁻⁴ M). The model is set up this way; check the molar solubility readout.'}}
  ],
  lab:{bio:'<p><b>Question:</b> How much of an “insoluble” salt can 100 mL of water hold?</p><ol><li>Choose AgCl. Add 0.1, 0.5, 1 and 5 mg in turn. Record whether solid remains and the ion concentrations.</li><li>Repeat with PbI₂ using 20, 100 and 500 mg.</li></ol><p>For each salt, find the smallest amount that leaves solid on the bottom. Which salt is more soluble? How do you know a solution is saturated?</p>',
       honors:'<p><b>Question:</b> How does a common ion change solubility? (Like the PbI₂ solubility and Ksp labs.)</p><ol><li>Choose PbI₂ with 100 mg. Record s, [Pb²⁺] and [I⁻] in pure water and check that Ksp = 4s³.</li><li>Add KI at 0.001, 0.010 and 0.10 M. Record s each time.</li><li>Switch to Mix two solutions and find the lowest Pb(NO₃)₂ and KI concentrations that still give a precipitate.</li></ol><p>Explain your results using Q, Ksp and Le Châtelier’s principle.</p>',
       ap:'<p><b>Question:</b> Can you predict solubility from Ksp in every case?</p><ol><li>For all six salts in pure water, record s and Ksp, then rank them both ways.</li><li>For Mg(OH)₂, turn on the buffer and record s at pH 8 through 12.</li><li>Plot log s against pH from your trials.</li></ol><p><b>Claim–evidence–reasoning:</b> Explain why the Ksp ranking and the solubility ranking disagree, and derive the slope of your log s vs pH graph from the Ksp expression.</p>'},
  terms:[{t:'Saturated solution',d:'Holds as much dissolved solute as it can at that temperature; extra solid stays undissolved.'},{t:'Unsaturated',d:'Could dissolve more solute.'},{t:'Precipitate',d:'A solid that forms when ions in solution combine.'},
    {t:'Dynamic equilibrium',d:'Dissolving and precipitating continue at equal rates, so concentrations stay constant.'},
    {lvl:'honors',t:'Solubility product (Ksp)',d:'The equilibrium constant for a solid dissolving into ions, e.g. Ksp = [Ag⁺][Cl⁻]. The solid is left out.'},
    {lvl:'honors',t:'Molar solubility (s)',d:'Moles of solid that dissolve per liter of saturated solution.'},
    {lvl:'honors',t:'Ion product (Q)',d:'Same form as Ksp using current concentrations. Q > Ksp: precipitate forms. Q < Ksp: more can dissolve.'},
    {lvl:'honors',t:'Common-ion effect',d:'Adding an ion already in the equilibrium lowers the solubility of the salt.'},
    {lvl:'ap',t:'pH and solubility',d:'Salts with basic anions (OH⁻, F⁻, CO₃²⁻) dissolve better in acid, because H⁺ removes the anion.'}],
  about:'<p><b>Model.</b> For MₐXᵦ(s) ⇌ aMᵇ⁺ + bXᵃ⁻, the program finds the exact equilibrium: how much solid remains (or precipitates) so that [M]ᵃ[X]ᵇ = Ksp, or all of it dissolves if Q stays below Ksp. The beaker relaxes toward that state with a 1.2 s time constant (real dissolving can take minutes to hours). Added common ions and mixed solutions are included in the totals. With the buffer on, [OH⁻] is held at 10^(pH−14).</p><p><b>Data.</b> Ksp at 25 °C (CRC Handbook): AgCl 1.77 × 10⁻¹⁰, BaSO₄ 1.08 × 10⁻¹⁰, PbI₂ 9.8 × 10⁻⁹, CaF₂ 3.45 × 10⁻¹¹, Mg(OH)₂ 5.61 × 10⁻¹², Ag₂CrO₄ 1.12 × 10⁻¹².</p><p><b>Simplified.</b> Concentrations stand in for activities, which overestimates the common-ion effect in strong solutions. Side reactions (complex ions such as AgCl₂⁻ in excess Cl⁻, PbI₄²⁻, hydrolysis of F⁻ and CrO₄²⁻) and the small volume change from added solids are ignored. In the zoom, ions above about 46 per kind are not all drawn. Lead and silver compounds are toxic; in the real lab, wear goggles and gloves and collect the waste.</p>',
  initVis(sim){},
  draw(sim,ctx,vdt,k,t){const p=sim.p,S=salt(p),st=sim.st,hon=atLeast('honors'),fs=12*k;
    ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,500);
    const n=CL.fmt(S.f),eq=n+'(s) ⇌ '+(S.a>1?S.a:'')+ION(S.cat,S.q[0])+'(aq) + '+(S.b>1?S.b:'')+ION(S.an,S.q[1])+'(aq)';txt(ctx,eq,16,28,{s:15*k,w:700,b:'middle'});
    drawBeaker(ctx,sim,k);drawZoom(ctx,sim,k,t);drawSide(ctx,sim,k);drawGauge(ctx,sim,k);},
  thumbSetup(sim){},thumbFrames:40
};
function solveCommon(S,c){// solubility (mol/L of salt dissolved) with c M of the common ion added, pure water otherwise
  if(S.ci.ion==='an'){let lo=0,hi=sOf(S)*1.01;for(let i=0;i<100;i++){const m=(lo+hi)/2;if(Math.pow(S.a*m,S.a)*Math.pow(S.b*m+c,S.b)>S.Ksp)hi=m;else lo=m;}return lo;}
  let lo=0,hi=sOf(S)*1.01;for(let i=0;i<100;i++){const m=(lo+hi)/2;if(Math.pow(S.a*m+c,S.a)*Math.pow(S.b*m,S.b)>S.Ksp)hi=m;else lo=m;}return lo;}
function stateText(sim){const p=sim.p,S=salt(sim.p),st=sim.st,lr=Math.log10(Math.max(1e-300,Qnow(sim))/S.Ksp);
  if(isX(p))return st.eq>0?(Math.abs(lr)<0.01?'Saturated, with precipitate':'Precipitate forming'):'Unsaturated: no precipitate';
  if(+p.amt===0)return 'Pure water';if(st.eq===0&&st.solid<1e-15)return 'Unsaturated: all dissolved';if(Math.abs(lr)<0.01)return 'Saturated: solid remains';return lr<0?'Dissolving…':'Precipitating…';}
function card(ctx,x,y,w,h){rr(ctx,x,y,w,h,10);ctx.fillStyle=PAL['card'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();}
function drawBeaker(ctx,sim,k){const p=sim.p,S=salt(p),st=sim.st,fs=12*k,x=36,y=74,w=200,h=250;
  const liq=CL.drawBeaker(ctx,{x,y,w,h,fill:0.78,liquid:PAL['cv-water']});
  const mg=st.solid*VOL*S.M*1000,hgt=mg>0?clamp(4+10*Math.log10(1+mg*2),3,42):0;
  if(isX(p)&&st.solid>0){const a=clamp(0.25+0.15*Math.log10(1+mg*50),0.1,0.7);ctx.fillStyle=S.color;ctx.globalAlpha=a*clamp(st.solid/(st.eq||1),0,1);ctx.fillRect(liq.x+3,liq.y+4,liq.w-6,liq.h-8);ctx.globalAlpha=1;}
  if(hgt>0){ctx.fillStyle=S.color;ctx.strokeStyle=CL.shade(S.color,-0.3);ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x+6,y+h-2);const r=rng(3);for(let i=0;i<=20;i++){const xx=x+6+(w-12)*i/20,yy=y+h-2-hgt*(0.55+0.45*Math.sin(Math.PI*i/20))-r()*3;ctx.lineTo(xx,yy);}ctx.lineTo(x+w-6,y+h-2);ctx.closePath();ctx.fill();ctx.stroke();}
  const lab=isX(p)?(k>1.35?'':'50.0 mL ')+CL.fmt(MIX[p.salt][0])+' + '+(k>1.35?'':'50.0 mL ')+CL.fmt(MIX[p.salt][1]):(k>1.35?'':'100.0 mL water + ')+p.amt+' mg '+CL.fmt(S.f);
  txt(ctx,lab,x+w/2,y+h+18+fs*0.4,{s:fs,c:PAL['cv-soft'],a:'center'});
  txt(ctx,mg>0?'solid: '+(mg<0.01?mg.toExponential(1):mg<10?mg.toFixed(2):mg.toFixed(0))+' mg':'no solid',x+w/2,y+h+18+fs*1.8,{s:fs,w:700,a:'center'});
  // zoom connector
  ctx.strokeStyle=PAL['cv-soft'];ctx.setLineDash([4,4]);ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(x+w-30,y+h-30);ctx.lineTo(ZX-ZR*0.92,ZY+ZR*0.4);ctx.stroke();ctx.setLineDash([]);ctx.strokeStyle=PAL['cv-soft'];ctx.beginPath();ctx.arc(x+w-30,y+h-30,10,0,6.29);ctx.stroke();}
function ionGlyph(ctx,kind,S,x,y){const id=kind==='cat'?S.cat:S.an,q=kind==='cat'?S.q[0]:S.q[1],r=kind==='cat'?8:(id==='SO4'||id==='CrO4'||id==='I'?9.5:7.5);
  ctx.fillStyle=ICOL[id];ctx.beginPath();ctx.arc(x,y,r,0,6.29);ctx.fill();ctx.strokeStyle='rgba(0,0,0,.35)';ctx.lineWidth=1;ctx.stroke();txt(ctx,q>0?'+':'−',x,y+1,{s:11,w:800,c:'#fff',a:'center',b:'middle'});}
function drawZoom(ctx,sim,k,t){const p=sim.p,S=salt(p),st=sim.st,fs=12*k;ctx.save();ctx.beginPath();ctx.arc(ZX,ZY,ZR,0,6.29);ctx.fillStyle=PAL['cv-water'];ctx.fill();ctx.clip();
  if(st.solid>1e-15){// crystal surface: alternating ions
    const rows=3,cols=13;for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){const x=ZX-ZR+12+i*24+(j%2)*12,y=LAT_Y+4+j*17;const kind=((i+j)%(S.a+S.b))<S.a?'cat':'an';ionGlyph(ctx,kind,S,x,y);}}
  st.vis.forEach(v=>{ionGlyph(ctx,v.k,S,v.x,v.y);if(v.fl>0){ctx.strokeStyle=PAL['cv-e'];ctx.globalAlpha=v.fl*2;ctx.lineWidth=2;ctx.beginPath();ctx.arc(v.x,v.y,13,0,6.29);ctx.stroke();ctx.globalAlpha=1;}});
  ctx.restore();ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=3;ctx.beginPath();ctx.arc(ZX,ZY,ZR,0,6.29);ctx.stroke();
  const tc=targetCounts(sim),over=tc.cat>CAP||tc.an>CAP;pill(ctx,over?'not all ions drawn: too many to show':'zoomed in, about 10 nm across',ZX,ZY-ZR-2,over?PAL['s4']:PAL['card2'],over?'#fff':PAL['cv-ink'],12*k);}
function drawSide(ctx,sim,k){const p=sim.p,S=salt(p),st=sim.st,fs=12*k,x=590,w=198,y=52,h=340,hon=atLeast('honors');card(ctx,x,y,w,h);let yy=y+12+fs;
  txt(ctx,'Key',x+12,yy,{s:13*k,w:700});yy+=fs*1.9;
  [['cat',ION(S.cat,S.q[0])],['an',ION(S.an,S.q[1])]].forEach(([kd,l])=>{ionGlyph(ctx,kd,S,x+22,yy-4);txt(ctx,l+' ion',x+38,yy,{s:fs,b:'alphabetic'});yy+=fs*1.9;});
  yy+=fs*0.5;txt(ctx,hon?'Ksp expression':'Saturation',x+12,yy,{s:13*k,w:700});yy+=fs*1.8;
  if(hon){const ex='Ksp = ['+ION(S.cat,S.q[0])+']'+(S.a>1?'²':'')+'['+ION(S.an,S.q[1])+']'+(S.b>1?'²':'');txt(ctx,ex,x+12,yy,{s:fs});yy+=fs*1.6;txt(ctx,'= '+S.expr+' in pure water',x+12,yy,{s:fs,c:PAL['cv-soft']});yy+=fs*1.6;
    txt(ctx,'Ksp = '+fmtS(S.Ksp),x+12,yy,{s:fs,w:700});yy+=fs*1.6;txt(ctx,'Q = '+fmtS(Qnow(sim)),x+12,yy,{s:fs,w:700,c:PAL['g-line']});yy+=fs*2;}
  else{txt(ctx,k>1.35?'Most in 100 mL:':'100 mL holds at most',x+12,yy,{s:fs});yy+=fs*1.6;const mx=sOf(S)*VOL*S.M*1000;txt(ctx,(mx<1?mx.toFixed(2):mx.toFixed(0))+' mg'+(k>1.35?'':' of '+CL.fmt(S.f)),x+12,yy,{s:fs,w:700});yy+=fs*2.2;}
  const stt=stateText(sim);pill(ctx,stt.split(':')[0],x+w/2,y+h-14-fs*0.5,stt.startsWith('Sat')?'#1b7339':stt.startsWith('Uns')||stt==='Pure water'?'#2d6bd2':'#b26a00','#fff',12*k);}
function drawGauge(ctx,sim,k){const S=salt(sim.p),fs=12*k,y=404,h=90,hon=atLeast('honors');card(ctx,16,y,772,h);
  const Q=Qnow(sim),lr=Q>0?Math.log10(Q/S.Ksp):-9,L=16+130*Math.min(k,1.4),R=776,mid=(L+R)/2,X=v=>clamp(mid+v/4*(R-L)/2,L,R);
  txt(ctx,hon?'Q vs Ksp':'Saturation',30,y+24,{s:14*k,w:700});txt(ctx,'log scale',30,y+46+fs*0.4,{s:fs,c:PAL['cv-soft']});
  const by=y+46;ctx.fillStyle=PAL['card2'];rr(ctx,L,by-5,R-L,10,5);ctx.fill();
  txt(ctx,hon?'Q < Ksp: unsaturated':'more can dissolve',L,by+22+fs*0.3,{s:fs,c:PAL['cv-soft']});txt(ctx,hon?'Q > Ksp: precipitate':'solid forms',R,by+22+fs*0.3,{s:fs,c:PAL['cv-soft'],a:'right'});
  ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(mid,by-14);ctx.lineTo(mid,by+12);ctx.stroke();txt(ctx,hon?'Ksp':'saturated',mid,by-20,{s:fs,w:700,a:'center'});
  const qx=X(lr);ctx.fillStyle=PAL['g-line'];ctx.beginPath();ctx.moveTo(qx,by+2);ctx.lineTo(qx-8,by-12);ctx.lineTo(qx+8,by-12);ctx.closePath();ctx.fill();ctx.beginPath();ctx.arc(qx,by,6,0,6.29);ctx.fill();
  if(hon&&Math.abs(qx-mid)>50*k)txt(ctx,'Q',qx,by-18,{s:fs,w:800,c:PAL['g-line'],a:'center'});}
KSP.controls.forEach(c=>{if(['mode','salt','buf'].includes(c.id))c.onChange=sim=>syncMode(sim);});
KSP.onLevel=sim=>syncMode(sim);
BioLab.register(KSP);
})();
