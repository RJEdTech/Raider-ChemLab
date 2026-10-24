(function(){
'use strict';
const {clamp,lerp,rng,randn,rr,txt,pill,atLeast,PAL,FONT,RM}=BioLab.h;
const CL=window.ChemLab;
/* Classifying matter. Every sample is built from real particle templates (CPK atoms at a consistent scale).
   Sort mode: decide pure substance vs mixture, then element/compound or homogeneous/heterogeneous.
   Change mode: atoms are tracked one by one from the "before" particles to the "after" particles, so a
   physical change keeps every molecule whole and a chemical change regroups the same atoms into new ones.
   Properties mode: sort property cards into physical or chemical (and intensive or extensive). */
const W=800,H=500,CX=340,CY=240,R=160;
const ss=x=>{x=clamp(x,0,1);return x*x*(3-2*x);};
const RAD={H:5.5,C:9,N:8.5,O:8.5,He:7,Ne:8,Ar:10,Na:7.5,Cl:10.5,Cu:9.5,Zn:9.5,Fe:9.5,S:9.5,Si:9};
const TPL={
  He:{a:[['He',0,0]]},Ar:{a:[['Ar',0,0]]},Ne:{a:[['Ne',0,0]]},Cu:{a:[['Cu',0,0]]},Zn:{a:[['Zn',0,0]]},Fe:{a:[['Fe',0,0]]},S:{a:[['S',0,0]]},Si:{a:[['Si',0,0]]},Ox:{a:[['O',0,0]]},
  'Na+':{a:[['Na',0,0]],q:'+'},'Cl-':{a:[['Cl',0,0]],q:'−'},
  H2:{a:[['H',-5,0],['H',5,0]],b:[[0,1]]},O2:{a:[['O',-7,0],['O',7,0]],b:[[0,1]]},N2:{a:[['N',-7,0],['N',7,0]],b:[[0,1]]},Cl2:{a:[['Cl',-9,0],['Cl',9,0]],b:[[0,1]]},
  H2O:{a:[['O',0,-2],['H',-8,5],['H',8,5]],b:[[0,1],[0,2]]},
  CO2:{a:[['C',0,0],['O',-14,0],['O',14,0]],b:[[0,1],[0,2]]},
  NH3:{a:[['N',0,-1],['H',-9,5],['H',9,5],['H',0,-11]],b:[[0,1],[0,2],[0,3]]},
  CH4:{a:[['C',0,0],['H',-9,-7],['H',9,-7],['H',-9,7],['H',9,7]],b:[[0,1],[0,2],[0,3],[0,4]]},
  H2O2:{a:[['O',-6,0],['O',6,0],['H',-11,-7],['H',11,7]],b:[[0,1],[0,2],[1,3]]},
  Fe2O3:{a:[['Fe',-9,0],['Fe',9,0],['O',0,-12],['O',0,12],['O',-23,0]],b:[[0,2],[0,3],[1,2],[1,3],[0,4]]},
  oil:{a:[['C',-25,4],['C',-15,-4],['C',-5,4],['C',5,-4],['C',15,4],['C',25,-4]],b:[[0,1],[1,2],[2,3],[3,4],[4,5]]}
};
const ext=f=>{const t=TPL[f];let e=0;t.a.forEach(([s,x,y])=>{e=Math.max(e,Math.hypot(x,y)+RAD[s]);});return e;};
const LABEL={'Na+':'Na⁺','Cl-':'Cl⁻',oil:'C₆H₁₄',Ox:'O'};
const lab=f=>LABEL[f]||CL.fmt(f);
const ELNAME={H:'hydrogen',C:'carbon',N:'nitrogen',O:'oxygen',He:'helium',Ne:'neon',Ar:'argon',Na:'sodium',Cl:'chlorine',Cu:'copper',Zn:'zinc',Fe:'iron',S:'sulfur',Si:'silicon'};

/* ---------- samples ---------- */
const SAMPLES={
  he:{l:'Helium in a balloon',comps:[{f:'He',n:16,ph:'g'}],cls:'element',sub:'atoms',macro:'balloon',sym:'He(g)',
      why:'Every particle is a single helium atom. One kind of atom only, so helium is an <b>element</b>.'},
  o2:{l:'Oxygen gas',comps:[{f:'O2',n:12,ph:'g'}],cls:'element',sub:'molecules',macro:'flask',sym:'O₂(g)',
      why:'Each particle is an O₂ molecule: two atoms bonded together, but both are oxygen. A molecule made of one kind of atom is still an <b>element</b>.'},
  cu:{l:'Copper wire',comps:[{lat:['Cu'],ph:'s'}],cls:'element',sub:'atoms',macro:'wire',sym:'Cu(s)',
      why:'The wire is a solid grid of copper atoms and nothing else. One kind of atom, so copper is an <b>element</b>.'},
  h2o:{l:'Pure water',comps:[{f:'H2O',n:20,ph:'l'}],cls:'compound',macro:'beaker',sym:'H₂O(l)',
      why:'Every particle is the same H₂O molecule, so water is one substance. Each molecule holds two kinds of atoms bonded in a fixed ratio, so it is a <b>compound</b>.'},
  co2:{l:'Carbon dioxide gas',comps:[{f:'CO2',n:10,ph:'g'}],cls:'compound',macro:'flask',sym:'CO₂(g)',
      why:'Every particle is a CO₂ molecule: one carbon and two oxygen atoms bonded together. One substance made of two elements is a <b>compound</b>.'},
  h2mix:{l:'Hydrogen and oxygen gas, mixed',comps:[{f:'H2',n:10,ph:'g'},{f:'O2',n:5,ph:'g'}],cls:'homog',mixOf:'elements',macro:'flask',sym:'H₂(g) + O₂(g)',vary:{c:1,min:1,max:10},
      why:'This flask holds the same atoms as water, but they are not bonded into H₂O. H₂ and O₂ molecules are two different substances spread evenly, so it is a <b>homogeneous mixture</b> of two elements.'},
  air:{l:'Air',comps:[{f:'N2',n:13,ph:'g'},{f:'O2',n:3,ph:'g'},{f:'Ar',n:1,ph:'g'}],cls:'homog',mixOf:'elements',macro:'flask',sym:'N₂(g) + O₂(g) + Ar(g)',vary:{c:1,min:1,max:8},
      why:'N₂, O₂ and Ar particles are three substances mixed evenly all the way down to single particles, so air is a <b>homogeneous mixture</b>.'},
  salt:{l:'Salt water',comps:[{f:'H2O',n:20,ph:'l'},{f:'Na+',n:3,ph:'l',as:'NaCl'},{f:'Cl-',n:3,ph:'l',as:'NaCl',nc:true}],cls:'homog',mixOf:'compounds',macro:'beaker',sym:'NaCl(aq)',vary:{c:[1,2],min:1,max:6},
      why:'Water molecules and dissolved Na⁺ and Cl⁻ ions are spread evenly, and every drop looks the same. Two substances mixed evenly make a <b>homogeneous mixture</b>, also called a solution.'},
  sand:{l:'Sand in water',comps:[{f:'H2O',n:14,ph:'l',reg:{y0:-0.55,y1:0.38}},{lat:['Si','Ox'],alt:true,ph:'s',reg:{y0:0.42,y1:1}}],cls:'heter',mixOf:'compounds',macro:'sandy',sym:'SiO₂(s) + H₂O(l)',vary:{sand:true},
      why:'The sand (SiO₂) sits in its own solid layer and the water is above it. You can see different parts, so it is a <b>heterogeneous mixture</b>.'},
  oil:{l:'Oil and water',comps:[{f:'oil',n:5,ph:'l',reg:{y0:-0.62,y1:-0.06}},{f:'H2O',n:14,ph:'l',reg:{y0:0.02,y1:1}}],cls:'heter',mixOf:'compounds',macro:'layers',sym:'C₆H₁₄(l) + H₂O(l)',
      why:'Oil molecules stay in their own layer on top of the water. Two visible layers means a <b>heterogeneous mixture</b>.'},
  fes:{l:'Iron filings and sulfur powder',comps:[{lat:['Fe'],ph:'s',reg:{x0:-1,x1:-0.08,y0:0.05,y1:1}},{lat:['S'],ph:'s',reg:{x0:0.08,x1:1,y0:-0.2,y1:1}}],cls:'heter',mixOf:'elements',macro:'powder',sym:'Fe(s) + S(s)',
      why:'Grains of iron and grains of sulfur sit side by side without bonding. A magnet could pull the iron out. Separate grains you can see make a <b>heterogeneous mixture</b> of two elements.'},
  nacl:{lvl:'honors',l:'Table salt crystal',comps:[{lat:['Na+','Cl-'],alt:true,ph:'s'}],cls:'compound',ionic:true,macro:'crystal',sym:'NaCl(s)',
      why:'You see two kinds of ions, but they repeat in one fixed 1 : 1 pattern, the formula unit NaCl. One substance made of two elements is a <b>compound</b> (an ionic compound).'},
  fesc:{lvl:'honors',l:'Iron(II) sulfide',comps:[{lat:['Fe','S'],alt:true,ph:'s'}],cls:'compound',ionic:true,macro:'chunk',sym:'FeS(s)',
      why:'Heat iron and sulfur together and they react: now every iron is bonded to sulfur in a fixed 1 : 1 pattern. A magnet no longer pulls it out. This is the <b>compound</b> FeS, not a mixture.'},
  brass:{lvl:'honors',l:'Brass (copper–zinc alloy)',comps:[{lat:['Cu','Zn'],mix:0.3,ph:'s'}],cls:'homog',mixOf:'elements',macro:'brass',sym:'Cu(s) + Zn(s)',vary:{mix:true},
      why:'Zinc atoms are scattered evenly through the copper grid. The ratio can vary from about 5% to 45% zinc, so brass is a <b>homogeneous mixture</b> of two elements, called an alloy.'},
  humid:{lvl:'honors',l:'Humid air',comps:[{f:'N2',n:11,ph:'g'},{f:'O2',n:3,ph:'g'},{f:'H2O',n:3,ph:'g'}],cls:'homog',mixOf:'elements and compounds',macro:'flask',sym:'N₂(g) + O₂(g) + H₂O(g)',vary:{c:2,min:0,max:8},
      why:'Water vapor molecules (a compound) are mixed evenly with N₂ and O₂ (elements). It is a <b>homogeneous mixture</b> of elements and a compound.'}
};
const CLS_L={element:'Element',compound:'Compound',homog:'Homogeneous mixture',heter:'Heterogeneous mixture'};
const sampleList=()=>Object.keys(SAMPLES).filter(k=>atLeast(SAMPLES[k].lvl||'bio'));

/* ---------- changes ---------- */
const PROCS={
  melt:{l:'Melting ice',phys:true,eq:'H₂O(s) → H₂O(l)',macro:'ice',before:[{f:'H2O',n:16,ph:'s',reg:{y0:-0.3,y1:1}}],after:[{f:'H2O',n:16,ph:'l',reg:{y0:-0.25,y1:1}}],
        what:'The H₂O molecules leave their fixed places and slide past each other, but every one is still H₂O.'},
  boil:{l:'Boiling water',phys:true,eq:'H₂O(l) → H₂O(g)',macro:'boil',before:[{f:'H2O',n:16,ph:'l',reg:{y0:-0.25,y1:1}}],after:[{f:'H2O',n:16,ph:'g'}],
        what:'The H₂O molecules break away from each other and fly apart as a gas. Bonds inside each molecule never break.'},
  dissolve:{l:'Dissolving salt in water',phys:true,eq:'NaCl(s) → Na⁺(aq) + Cl⁻(aq)',macro:'dissolve',
        before:[{lat:['Na+','Cl-'],alt:true,grid:[4,2],at:[0,0.62],ph:'s'},{f:'H2O',n:14,ph:'l',reg:{y0:-0.55,y1:0.38}}],after:[{f:'Na+',n:4,ph:'l'},{f:'Cl-',n:4,ph:'l'},{f:'H2O',n:14,ph:'l'}],
        what:'Water pulls the Na⁺ and Cl⁻ ions out of the crystal and spreads them through the water. Evaporate the water and you get the same NaCl back.'},
  electro:{l:'Electrolysis of water',phys:false,eq:'2H₂O(l) → 2H₂(g) + O₂(g)',macro:'electro',before:[{f:'H2O',n:8,ph:'l',reg:{y0:-0.4,y1:1}}],after:[{f:'H2',n:8,ph:'g',reg:{x0:-1,x1:-0.04}},{f:'O2',n:4,ph:'g',reg:{x0:0.04,x1:1}}],
        what:'Electricity breaks the bonds inside H₂O. The same H and O atoms regroup into two new substances: H₂ gas and O₂ gas, twice as much H₂ as O₂.'},
  rust:{l:'Rusting iron',phys:false,eq:'4Fe(s) + 3O₂(g) → 2Fe₂O₃(s)',macro:'rust',before:[{lat:['Fe'],grid:[4,2],at:[0,0.66],ph:'s'},{f:'O2',n:6,ph:'g',reg:{y0:-1,y1:0.3}}],after:[{f:'Fe2O3',n:4,ph:'s',grid:[2,2],at:[0,0.5]}],
        what:'Iron atoms bond to oxygen atoms from the air and form a new substance, iron(III) oxide (rust). Its color, strength and magnetism differ from iron.'},
  burn:{l:'Burning methane',phys:false,eq:'CH₄(g) + 2O₂(g) → CO₂(g) + 2H₂O(g)',macro:'burn',before:[{f:'CH4',n:3,ph:'g'},{f:'O2',n:6,ph:'g'}],after:[{f:'CO2',n:3,ph:'g'},{f:'H2O',n:6,ph:'g'}],
        what:'Bonds in CH₄ and O₂ break and the atoms regroup into CO₂ and H₂O, two new substances, while energy is released as heat and light.'},
  sublime:{lvl:'honors',l:'Dry ice subliming',phys:true,eq:'CO₂(s) → CO₂(g)',macro:'dryice',before:[{f:'CO2',n:10,ph:'s',reg:{y0:0,y1:1}}],after:[{f:'CO2',n:10,ph:'g'}],
        what:'Solid CO₂ turns straight into a gas without melting. The CO₂ molecules stay whole, so it is a physical change.'},
  peroxide:{lvl:'honors',l:'Hydrogen peroxide decomposing',phys:false,eq:'2H₂O₂(l) → 2H₂O(l) + O₂(g)',macro:'foam',before:[{f:'H2O2',n:6,ph:'l',reg:{y0:-0.3,y1:1}}],after:[{f:'H2O',n:6,ph:'l',reg:{y0:0.05,y1:1}},{f:'O2',n:3,ph:'g',reg:{y0:-1,y1:-0.1}}],
        what:'Each H₂O₂ molecule loses an oxygen atom. The atoms regroup into water and O₂ gas, the bubbles you see in the foam.'}
};
const procList=()=>Object.keys(PROCS).filter(k=>atLeast(PROCS[k].lvl||'bio'));

/* ---------- property cards ---------- */
const PROPS=[
  {t:'Copper conducts electricity.',k:'phys',ie:'int',r:'You can test it without changing the copper into anything new.'},
  {t:'Iron rusts in moist air.',k:'chem',r:'Rusting turns iron into a new substance, iron oxide.'},
  {t:'Water boils at 100 °C at 1 atm.',k:'phys',ie:'int',r:'Boiling changes water’s state, not its identity: steam is still H₂O.'},
  {t:'Methane burns in oxygen.',k:'chem',r:'Burning makes new substances (CO₂ and H₂O).'},
  {t:'Gold can be hammered into thin sheets.',k:'phys',ie:'int',r:'Malleability changes the shape, not the substance.'},
  {t:'The density of aluminum is 2.70 g/cm³.',k:'phys',ie:'int',r:'You find density by measuring mass and volume; the aluminum stays aluminum.'},
  {t:'Baking soda fizzes when vinegar is added.',k:'chem',r:'The fizz is CO₂ gas, a new substance made by a reaction.'},
  {t:'Sodium reacts violently with water.',k:'chem',r:'Reactivity describes how a substance changes into new substances.'},
  {t:'Sulfur is yellow.',k:'phys',ie:'int',r:'Color is observed without changing the sulfur.'},
  {t:'This sample of water has a mass of 25.0 g.',k:'phys',ie:'ext',r:'Mass is measured without changing the water. It depends on how much you have, so it is extensive.'},
  {t:'This block has a volume of 12.0 cm³.',k:'phys',ie:'ext',r:'Volume is measured without changing the substance. A bigger block has more volume, so it is extensive.'},
  {t:'Silver tarnishes (turns black) in air.',k:'chem',r:'Tarnish is silver sulfide, a new substance.'},
  {t:'Sugar dissolves in water.',k:'phys',ie:'int',r:'The sugar molecules spread out but stay sugar; evaporate the water and you get sugar back.'},
  {t:'Helium does not react with other substances.',k:'chem',r:'Not reacting is still a statement about reactivity, so it is a chemical property.'},
  {t:'Table salt melts at 801 °C.',k:'phys',ie:'int',r:'Melting point is measured without changing the substance’s identity.'},
  {t:'Wood burns and leaves ash.',k:'chem',r:'Burning turns wood into new substances: CO₂, water vapor and ash.'}
];

/* ---------- particle building ---------- */
function regBox(reg){reg=reg||{};return {x0:CX+(reg.x0===undefined?-1:reg.x0)*R,x1:CX+(reg.x1===undefined?1:reg.x1)*R,y0:CY+(reg.y0===undefined?-1:reg.y0)*R,y1:CY+(reg.y1===undefined?1:reg.y1)*R};}
const inCirc=(x,y,m)=>Math.hypot(x-CX,y-CY)<=R-m;
function makeMol(f,x,y,ph,box,r){const t=TPL[f];const sp=ph==='g'?55:16,a=r()*6.283;
  return {f,t,tr:{x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,a:r()*6.283,va:(r()-0.5)*(ph==='g'?3:1),ph,hx:x,hy:y,box,e:ext(f),p1:r()*6.283,p2:r()*6.283}};}
function latticeSites(comp,r){const sp=comp.alt?(comp.lat.includes('Cl-')?19.5:(comp.lat.includes('Ox')?18.5:20)):20.5;const pts=[];
  if(comp.grid){const [nx,ny]=comp.grid,cx=CX+comp.at[0]*R,cy=CY+comp.at[1]*R;for(let j=0;j<ny;j++)for(let i=0;i<nx;i++)pts.push([cx+(i-(nx-1)/2)*sp,cy+(j-(ny-1)/2)*sp,i,j]);return pts;}
  const b=regBox(comp.reg);const hex=!comp.alt;const dy=hex?sp*0.866:sp;
  for(let j=-20;j<=20;j++)for(let i=-20;i<=20;i++){const x=CX+i*sp+(hex&&(j&1)?sp/2:0),y=CY+j*dy;if(inCirc(x,y,12)&&x>=b.x0+6&&x<=b.x1-6&&y>=b.y0+6&&y<=b.y1-4)pts.push([x,y,i,j]);}
  return pts;}
function buildSet(comps,seed,opt){opt=opt||{};const r=rng(seed);const mols=[];const liq=[];
  comps.forEach((c,ci)=>{
    if(c.lat){const sites=latticeSites(c,r);const box=regBox(c.reg);
      sites.forEach(([x,y,i,j],k)=>{let f;if(c.alt)f=c.lat[((i+j)%2+2)%2];else if(c.mix!==undefined)f=r()<(opt.mix!==undefined?opt.mix:c.mix)?c.lat[1]:c.lat[0];else f=c.lat[0];
        const m=makeMol(f,x,y,'s',box,r);m.ci=ci;mols.push(m);});return;}
    const box=regBox(c.reg);if(c.ph==='l')liq.push(c.reg||{});
    let n=c.n;if(opt.counts&&opt.counts[ci]!==undefined)n=opt.counts[ci];
    if(c.ph==='s'&&c.grid){const [nx,ny]=c.grid,cx=CX+c.at[0]*R,cy=CY+c.at[1]*R,sp=2*ext(c.f)+4;let k=0;
      for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){if(k++>=n)break;const m=makeMol(c.f,cx+(i-(nx-1)/2)*sp,cy+(j-(ny-1)/2)*sp*0.7,'s',box,r);m.tr.a=0;m.ci=ci;mols.push(m);}return;}
    if(c.ph==='s'){const e=ext(c.f),sp=2*e+3;const pts=[];for(let j=-12;j<=12;j++)for(let i=-12;i<=12;i++){const x=CX+i*sp+((j&1)?sp/2:0),y=CY+j*sp*0.62;if(inCirc(x,y,e+4)&&x>=box.x0+e&&x<=box.x1-e&&y>=box.y0+e&&y<=box.y1-e)pts.push([x,y]);}
      pts.sort((p,q)=>q[1]-p[1]);for(let k=0;k<n&&k<pts.length;k++){const m=makeMol(c.f,pts[k][0],pts[k][1],'s',box,r);m.tr.a=0.2*(k%3-1);m.ci=ci;mols.push(m);}return;}
    for(let k=0;k<n;k++){const e=ext(c.f);let x=CX,y=CY,ok=false;
      for(let tries=0;tries<200&&!ok;tries++){x=lerp(box.x0+e,box.x1-e,r());y=lerp(box.y0+e,box.y1-e,r());if(!inCirc(x,y,e+2))continue;
        ok=mols.every(m=>m.tr.ph==='s'&&m.ci!==ci?Math.hypot(m.tr.x-x,m.tr.y-y)>m.e+e:Math.hypot(m.tr.x-x,m.tr.y-y)>m.e+e+2);}
      const m=makeMol(c.f,x,y,c.ph,box,r);m.ci=ci;mols.push(m);}
  });
  return {mols,liq};}
function rot(dx,dy,a){const c=Math.cos(a),s=Math.sin(a);return [dx*c-dy*s,dx*s+dy*c];}
function moveSet(set,dt,t){if(!dt)return;const ms=set.mols;dt=Math.min(dt,0.05);
  ms.forEach(m=>{const q=m.tr;
    if(q.ph==='s'){const A=RM?0:1.4;q.x=q.hx+A*Math.sin(t*9+q.p1);q.y=q.hy+A*Math.cos(t*11+q.p2);return;}
    if(q.ph==='l'){q.vx+=randn()*90*dt;q.vy+=randn()*90*dt+6*dt;const sp=Math.hypot(q.vx,q.vy),mx=24;if(sp>mx){q.vx*=mx/sp;q.vy*=mx/sp;}q.va+=randn()*2*dt;q.va=clamp(q.va,-1.2,1.2);}
    q.x+=q.vx*dt;q.y+=q.vy*dt;q.a+=q.va*dt;
    const b=q.box,e=q.e;if(q.x<b.x0+e){q.x=b.x0+e;q.vx=Math.abs(q.vx);}if(q.x>b.x1-e){q.x=b.x1-e;q.vx=-Math.abs(q.vx);}
    if(q.y<b.y0+e){q.y=b.y0+e;q.vy=Math.abs(q.vy);}if(q.y>b.y1-e){q.y=b.y1-e;q.vy=-Math.abs(q.vy);}
    const dx=q.x-CX,dy=q.y-CY,d=Math.hypot(dx,dy),lim=R-e-2;if(d>lim){const nx=dx/d,ny=dy/d;q.x=CX+nx*lim;q.y=CY+ny*lim;const vn=q.vx*nx+q.vy*ny;if(vn>0){q.vx-=2*vn*nx;q.vy-=2*vn*ny;}}});
  // keep liquid particles from piling on top of each other
  for(let i=0;i<ms.length;i++){const a=ms[i].tr;if(a.ph==='g')continue;for(let j=i+1;j<ms.length;j++){const b=ms[j].tr;if(b.ph==='g'||(a.ph==='s'&&b.ph==='s'))continue;
    const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||0.01,mn=(ms[i].e+ms[j].e)*0.82;if(d<mn){const push=(mn-d)/2,ux=dx/d,uy=dy/d;
      if(a.ph!=='s'){a.x-=ux*push;a.y-=uy*push;}if(b.ph!=='s'){b.x+=ux*push;b.y+=uy*push;}}}}}
function molAtoms(m,cx,cy,a){return m.t.a.map(([s,dx,dy])=>{const [rx,ry]=rot(dx,dy,a);return [s,cx+rx,cy+ry];});}
function drawBond(ctx,x1,y1,x2,y2,alpha){if(alpha<=0.02)return;ctx.save();ctx.globalAlpha=alpha;ctx.strokeStyle='#8a8f98';ctx.lineWidth=4.5;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();ctx.restore();}
function drawAtomQ(ctx,s,x,y,q){CL.drawAtom(ctx,x,y,RAD[s],s,{label:''});if(q){ctx.font='800 11px '+FONT;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=CL.inkOn(CL.cpk(s));ctx.fillText(q,x,y+1);}}
function drawSet(ctx,set,alpha){ms(set).forEach(m=>{const q=m.tr,at=molAtoms(m,q.x,q.y,q.a);(m.t.b||[]).forEach(([i,j])=>drawBond(ctx,at[i][1],at[i][2],at[j][1],at[j][2],alpha));
  ctx.save();ctx.globalAlpha=alpha;at.forEach(([s,x,y])=>drawAtomQ(ctx,s,x,y,m.t.q));ctx.restore();});}
const ms=set=>set.mols;
function shadeLiquid(ctx,regs,alpha){if(alpha<=0.02)return;ctx.save();ctx.beginPath();ctx.arc(CX,CY,R,0,6.283);ctx.clip();ctx.globalAlpha=0.55*alpha;ctx.fillStyle=PAL['cv-water'];
  regs.forEach(rg=>{const b=regBox(rg);ctx.fillRect(b.x0,b.y0,b.x1-b.x0,b.y1-b.y0);});ctx.restore();}

/* substance and element bookkeeping */
function substances(sample){const out=[];sample.comps.forEach(c=>{if(c.nc)return;let f;
  if(c.lat){if(c.alt)f=c.lat.join('').replace('Na+Cl-','NaCl').replace('SiOx','SiO2').replace('FeS','FeS');else if(c.mix!==undefined){out.push(c.lat[0],c.lat[1]);return;}else f=c.lat[0];}
  else f=c.as||c.f;if(!out.includes(f))out.push(f);});return out;}
const formulaOf=f=>f==='oil'?'C6H14':f;
function elementsIn(list){const els=[];list.forEach(f=>{Object.keys(CL.parse(formulaOf(f))).forEach(e=>{if(!els.includes(e))els.push(e);});});return els;}
function setCounts(set){const c={};set.mols.forEach(m=>{c[m.f]=(c[m.f]||0)+1;});return c;}
function atomCounts(set){const c={};set.mols.forEach(m=>m.t.a.forEach(([s])=>{c[s]=(c[s]||0)+1;}));return c;}
function setMass(set){let m=0;set.mols.forEach(x=>x.t.a.forEach(([s])=>{m+=CL.el(s).mass;}));return m;}

/* ---------- state helpers ---------- */
function amtOpt(sim){const s=SAMPLES[sim.p.sample],v=s.vary,a=atLeast('honors')?sim.p.amt/100:0.5;if(!v)return {};
  if(v.mix)return {mix:lerp(0.08,0.45,a)};if(v.sand)return {sandY:lerp(0.78,0.1,a)};
  const n=Math.round(lerp(v.min,v.max,a)),counts={};(Array.isArray(v.c)?v.c:[v.c]).forEach(ci=>counts[ci]=n);return {counts};}
function sampleComps(sim){const s=SAMPLES[sim.p.sample],o=amtOpt(sim);if(o.sandY===undefined)return s.comps;
  return [{f:'H2O',n:Math.round(lerp(16,8,(0.78-o.sandY)/0.68)),ph:'l',reg:{y0:-0.55,y1:o.sandY-0.04}},{lat:['Si','Ox'],alt:true,ph:'s',reg:{y0:o.sandY,y1:1}}];}
function sortSet(sim){const v=sim.vis,p=sim.p,key=p.sample+'|'+(atLeast('honors')?p.amt:50);if(v.sKey!==key||!v.set){v.sKey=key;v.set=buildSet(sampleComps(sim),7,amtOpt(sim));}return v.set;}
function chg(sim){const v=sim.vis,p=sim.p;if(v.cKey!==p.proc||!v.B){v.cKey=p.proc;const pr=PROCS[p.proc];v.B=buildSet(pr.before,11);v.A=buildSet(pr.after,23);v.map=mapAtoms(pr,v.B,v.A);}return v;}
function mapAtoms(pr,B,A){const pairs=[];
  if(pr.phys){const used=new Set();A.mols.forEach((am,ai)=>{let bi=B.mols.findIndex((bm,k)=>!used.has(k)&&bm.f===am.f);if(bi<0)return;used.add(bi);pairs.push({b:bi,a:ai});});return {mol:pairs};}
  const bAt=[];B.mols.forEach((m,mi)=>m.t.a.forEach(([s,dx,dy],i)=>bAt.push({s,mi,i,x:m.tr.x+dx,y:m.tr.y+dy,used:false})));
  const at=[];A.mols.forEach((m,mi)=>m.t.a.forEach(([s,dx,dy],i)=>{let best=null,bd=1e9;bAt.forEach(b=>{if(b.used||b.s!==s)return;const d=Math.hypot(b.x-m.tr.x-dx,b.y-m.tr.y-dy);if(d<bd){bd=d;best=b;}});
    if(best){best.used=true;at.push({s,bm:best.mi,bi:best.i,am:mi,ai:i});}}));
  return {atom:at};}

function syncMode(sim){if(!sim.ui||!sim.ui.sec)return;const mode=sim.p.mode,d=sim.def;
  d.controls.forEach(c=>{if(!c.modes)return;const cid=d.id+'-'+c.id,e=document.getElementById(cid)||document.getElementById(cid+'-l');if(!e)return;const w=e.closest('.ctl');if(w)w.hidden=!atLeast(c.lvl)||!c.modes.includes(mode);});
  d.metrics.forEach(m=>{if(!m.modes)return;const t=sim.ui.tiles[m.id];if(!t)return;const w=t.num.closest('.tile');if(w)w.hidden=!atLeast(m.lvl)||!m.modes.includes(mode);});
  const btns=[...sim.ui.sec.querySelectorAll('.actions button')];d.actions.forEach(a=>{const b=btns.find(x=>x.textContent===a.label);if(b)b.hidden=!atLeast(a.lvl)||!a.modes.includes(mode);});
  // sample and process menus: keep the chosen one valid for this level
  if(!atLeast(SAMPLES[sim.p.sample].lvl||'bio'))BioLab.setValues(sim,{sample:'h2o'});
  if(!atLeast(PROCS[sim.p.proc].lvl||'bio'))BioLab.setValues(sim,{proc:'melt'});}
function call(sim,c){const st=sim.st;if(st.call)return;st.call=c;st.partial=null;st.tries++;if(c===SAMPLES[sim.p.sample].cls)st.right++;sim.infoDirty=true;}
function propCall(sim,k){const st=sim.st;if(st.pcall)return;st.pcall=k;st.ptries++;if(PROPS[st.card].k===k)st.pright++;}

/* ---------- SVG particle diagrams for the challenge panel ---------- */
function svgDiagram(spec,seed){const r=rng(seed),Wd=230,Hd=150,placed=[];let body='';const atoms=[],bonds=[];
  spec.forEach(({f,n})=>{const t=TPL[f],e=ext(f)*0.85;for(let k=0;k<n;k++){let x=0,y=0;for(let tr=0;tr<300;tr++){x=e+6+r()*(Wd-2*e-12);y=e+6+r()*(Hd-2*e-12);if(placed.every(p=>Math.hypot(p[0]-x,p[1]-y)>p[2]+e+3))break;}
    placed.push([x,y,e]);const a=r()*6.283;const pts=t.a.map(([s,dx,dy])=>{const [rx,ry]=rot(dx*0.85,dy*0.85,a);return [s,x+rx,y+ry];});
    (t.b||[]).forEach(([i,j])=>bonds.push(`<line x1="${pts[i][1].toFixed(1)}" y1="${pts[i][2].toFixed(1)}" x2="${pts[j][1].toFixed(1)}" y2="${pts[j][2].toFixed(1)}" stroke="#8a8f98" stroke-width="4" stroke-linecap="round"/>`));
    pts.forEach(([s,px,py])=>atoms.push(`<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${(RAD[s]*0.85).toFixed(1)}" fill="${CL.cpk(s)}" stroke="#333" stroke-width="1"/>`));}});
  const els=[];spec.forEach(({f})=>TPL[f].a.forEach(([s])=>{if(!els.includes(s))els.push(s);}));
  const key=els.map((s,i)=>`<circle cx="${12+i*58}" cy="${Hd+16}" r="6" fill="${CL.cpk(s)}" stroke="#333"/><text x="${22+i*58}" y="${Hd+21}" font-size="13" fill="currentColor">${s}</text>`).join('');
  body=`<rect x="1" y="1" width="${Wd-2}" height="${Hd-2}" rx="10" fill="none" stroke="currentColor" stroke-opacity=".45" stroke-width="2"/>`+bonds.join('')+atoms.join('')+key;
  return `<svg viewBox="0 0 ${Wd} ${Hd+28}" width="${Wd}" height="${Hd+28}" role="img" aria-label="Particle diagram" style="display:block;margin:10px 0 2px;max-width:100%">${body}</svg>`;}
const POOL=[
  {spec:[{f:'Ne',n:9}],c:0,c6:0,d:'Every particle is a single Ne atom, all the same kind.'},
  {spec:[{f:'Cl2',n:7}],c:0,c6:1,d:'Every particle is a Cl₂ molecule. Both atoms are chlorine, so it is still an element.'},
  {spec:[{f:'N2',n:7}],c:0,c6:1,d:'Every particle is an N₂ molecule made of one kind of atom.'},
  {spec:[{f:'NH3',n:7}],c:1,c6:2,d:'Every particle is the same NH₃ molecule, built from two kinds of atoms bonded together.'},
  {spec:[{f:'CO2',n:6}],c:1,c6:2,d:'Every particle is the same CO₂ molecule, built from two kinds of atoms bonded together.'},
  {spec:[{f:'Ne',n:5},{f:'Cl2',n:4}],c:2,c6:3,d:'There are two different particles, Ne atoms and Cl₂ molecules. Each is an element, so this is a mixture of elements.'},
  {spec:[{f:'H2O',n:5},{f:'CO2',n:4}],c:2,c6:4,d:'There are two different molecules, H₂O and CO₂, each a compound. Two substances means a mixture of compounds.'},
  {spec:[{f:'N2',n:5},{f:'H2O',n:4}],c:2,c6:5,d:'N₂ is an element and H₂O is a compound. Two substances mixed is a mixture of an element and a compound.'},
  {spec:[{f:'H2',n:6},{f:'O2',n:3}],c:2,c6:3,d:'H₂ and O₂ are two different elements, not yet bonded into water. It is a mixture of elements.'}
];
function poolItem(sim,salt){const i=Math.floor(rng((sim.cq||0)*31+salt)()*POOL.length);return POOL[i];}

/* ---------- macroscopic drawings ---------- */
function zoomLines(ctx,mx,my,mr){ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.2;ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(mx,my-mr);ctx.lineTo(CX-R*0.55,CY-R*0.84);ctx.moveTo(mx,my+mr);ctx.lineTo(CX-R*0.55,CY+R*0.84);ctx.stroke();ctx.setLineDash([]);
  ctx.lineWidth=2.5;ctx.strokeStyle=PAL['cv-ink'];ctx.beginPath();ctx.arc(mx,my,mr,0,6.283);ctx.stroke();}
function drawMacro(ctx,kind,e,t,k){const x=34,y=150,w=118,h=180,P=PAL;ctx.save();
  const beaker=(fill,liq)=>CL.drawBeaker(ctx,{x,y:y+20,w,h:h-20,fill,liquid:liq||P['cv-water']});
  if(kind==='balloon'){ctx.fillStyle='#d9a6e8';ctx.beginPath();ctx.ellipse(x+w/2,y+70,48,60,0,0,6.283);ctx.fill();ctx.fillStyle='rgba(255,255,255,.35)';ctx.beginPath();ctx.ellipse(x+w/2-16,y+46,9,16,-0.4,0,6.283);ctx.fill();
    ctx.strokeStyle=P['cv-soft'];ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x+w/2,y+130);ctx.quadraticCurveTo(x+w/2+12,y+160,x+w/2-4,y+190);ctx.stroke();ctx.restore();return [x+w/2+6,y+72];}
  if(kind==='flask'){ctx.strokeStyle=P['cv-glass'];ctx.lineWidth=3;ctx.fillStyle=P['cv-bg2'];ctx.beginPath();ctx.moveTo(x+w/2-12,y+10);ctx.lineTo(x+w/2-12,y+60);ctx.lineTo(x+6,y+h-8);ctx.lineTo(x+w-6,y+h-8);ctx.lineTo(x+w/2+12,y+60);ctx.lineTo(x+w/2+12,y+10);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle=P['cv-soft'];rr(ctx,x+w/2-15,y,30,14,3);ctx.fill();ctx.restore();return [x+w/2,y+125];}
  if(kind==='wire'){ctx.strokeStyle='#c4743a';ctx.lineWidth=6;ctx.beginPath();for(let i=0;i<=60;i++){const a=i/60*6.283*3,px=x+20+i*1.3+Math.cos(a)*16,py=y+90+Math.sin(a)*40;i?ctx.lineTo(px,py):ctx.moveTo(px,py);}ctx.stroke();ctx.restore();return [x+w/2,y+90];}
  if(kind==='beaker'){beaker(0.7);ctx.restore();return [x+w/2,y+130];}
  if(kind==='sandy'){const L=beaker(0.75);ctx.fillStyle='#c9a66b';ctx.fillRect(x+2,y+h-44,w-4,42);ctx.fillStyle='#a8844d';for(let i=0;i<26;i++)ctx.fillRect(x+6+(i*37)%(w-12),y+h-40+(i*13)%34,3,3);ctx.restore();return [x+w/2,y+h-48];}
  if(kind==='layers'){const L=beaker(0.75);ctx.fillStyle='rgba(222,181,40,.75)';ctx.fillRect(L.x+2,L.y,w-4,34);ctx.restore();return [x+w/2,L.y+34];}
  if(kind==='powder'){ctx.fillStyle=P['cv-glass'];ctx.globalAlpha=0.5;ctx.beginPath();ctx.ellipse(x+w/2,y+150,60,14,0,0,6.283);ctx.fill();ctx.globalAlpha=1;
    for(let i=0;i<70;i++){const a=i*2.4,rr2=Math.sqrt(i/70)*48;ctx.fillStyle=i%2?'#e6d22e':'#5f6670';ctx.fillRect(x+w/2+Math.cos(a)*rr2-2,y+138+Math.sin(a)*rr2*0.25-2,4,4);}ctx.restore();return [x+w/2,y+140];}
  if(kind==='crystal'||kind==='chunk'||kind==='brass'){const col=kind==='crystal'?'#eef2f5':kind==='chunk'?'#4d4f55':'#c9a23a';ctx.fillStyle=col;ctx.strokeStyle=CL.shade(col,-0.4);ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(x+24,y+120);ctx.lineTo(x+64,y+100);ctx.lineTo(x+104,y+118);ctx.lineTo(x+104,y+160);ctx.lineTo(x+64,y+178);ctx.lineTo(x+24,y+160);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle=CL.shade(col,-0.15);ctx.beginPath();ctx.moveTo(x+64,y+138);ctx.lineTo(x+104,y+118);ctx.lineTo(x+104,y+160);ctx.lineTo(x+64,y+178);ctx.closePath();ctx.fill();ctx.restore();return [x+50,y+142];}
  // change-mode scenes, e = progress 0..1
  if(kind==='ice'){const s=1-0.85*e;ctx.fillStyle=P['cv-water'];ctx.beginPath();ctx.ellipse(x+w/2,y+168,20+40*e,6+5*e,0,0,6.283);ctx.fill();ctx.strokeStyle=P['cv-glass'];ctx.lineWidth=1.5;ctx.stroke();
    ctx.fillStyle='rgba(200,230,250,.9)';ctx.strokeStyle='#7fa8c4';ctx.lineWidth=2;const c=56*s;rr(ctx,x+w/2-c/2,y+168-c,c,c,6);ctx.fill();ctx.stroke();ctx.restore();return [x+w/2,y+160];}
  if(kind==='boil'||kind==='dissolve'||kind==='foam'){const L=beaker(kind==='boil'?0.65-0.4*e:0.7);
    if(kind==='boil'){ctx.fillStyle=P['cv-bubble'];for(let i=0;i<10;i++){const ph=(t*0.6+i*0.13)%1;ctx.globalAlpha=0.8*e+0.1;ctx.beginPath();ctx.arc(x+16+(i*29)%(w-30),L.y+L.h-ph*L.h,3+ph*3,0,6.283);ctx.fill();}
      ctx.globalAlpha=0.5*e;ctx.strokeStyle=P['cv-soft'];ctx.lineWidth=2;for(let i=0;i<3;i++){ctx.beginPath();const sx=x+30+i*30;ctx.moveTo(sx,y+14);ctx.bezierCurveTo(sx-10,y,sx+10,y-14,sx,y-26);ctx.stroke();}
      ctx.globalAlpha=1;ctx.fillStyle='#3b7bd9';ctx.beginPath();ctx.moveTo(x+w/2-12,y+h+16);ctx.quadraticCurveTo(x+w/2,y+h-4,x+w/2+12,y+h+16);ctx.fill();}
    if(kind==='dissolve'){ctx.fillStyle='#eef2f5';ctx.strokeStyle='#8a9aa6';for(let i=0;i<6;i++){const c=9*(1-e);if(c<1)break;ctx.fillRect(x+24+i*13,y+h-6-c,c,c);ctx.strokeRect(x+24+i*13,y+h-6-c,c,c);}}
    if(kind==='foam'){ctx.fillStyle=P['cv-bubble'];ctx.strokeStyle=P['cv-bstroke'];ctx.lineWidth=1;for(let i=0;i<Math.round(28*e);i++){ctx.beginPath();ctx.arc(x+10+(i*23)%(w-20),L.y-4-((i*7)%22)*e,4+(i%3),0,6.283);ctx.fill();ctx.stroke();}}
    ctx.restore();return [x+w/2,L.y+(L.h)/2];}
  if(kind==='electro'){CL.drawBeaker(ctx,{x,y:y+60,w,h:h-60,fill:0.85});const tube=(tx,gas,lb)=>{ctx.strokeStyle=P['cv-glass'];ctx.lineWidth=2.5;ctx.fillStyle=P['cv-water'];rr(ctx,tx-12,y+10,24,150,8);ctx.fill();ctx.stroke();
      ctx.fillStyle=P['cv-bg2'];rr(ctx,tx-10,y+12,20,gas,7);ctx.fill();txt(ctx,lb,tx,y+2,{s:12*k,w:700,a:'center',c:P['cv-ink']});};
    tube(x+32,8+90*e,'H₂');tube(x+w-32,4+45*e,'O₂');ctx.fillStyle=P['cv-soft'];ctx.fillRect(x+30,y+160,4,14);ctx.fillRect(x+w-34,y+160,4,14);ctx.restore();return [x+w/2,y+130];}
  if(kind==='rust'){const c1=[120,124,132],c2=[168,84,40];const mix=c1.map((v,i)=>Math.round(lerp(v,c2[i],e)));ctx.fillStyle='rgb('+mix.join(',')+')';
    rr(ctx,x+14,y+108,w-38,16,4);ctx.fill();ctx.beginPath();ctx.moveTo(x+w-24,y+108);ctx.lineTo(x+w-4,y+116);ctx.lineTo(x+w-24,y+124);ctx.fill();rr(ctx,x+6,y+102,12,28,3);ctx.fill();ctx.restore();return [x+w/2,y+116];}
  if(kind==='burn'){ctx.fillStyle=P['cv-soft'];ctx.fillRect(x+w/2-9,y+120,18,60);rr(ctx,x+w/2-30,y+176,60,8,3);ctx.fill();
    if(e>0.05&&e<0.995){const f=Math.sin(e*Math.PI);ctx.fillStyle='rgba(60,120,240,'+(0.75*f+0.1)+')';ctx.beginPath();ctx.moveTo(x+w/2-9,y+120);ctx.quadraticCurveTo(x+w/2-16,y+70,x+w/2,y+40+(RM?0:Math.sin(t*20)*4));ctx.quadraticCurveTo(x+w/2+16,y+70,x+w/2+9,y+120);ctx.fill();
      ctx.fillStyle='rgba(255,190,60,'+0.5*f+')';ctx.beginPath();ctx.moveTo(x+w/2-4,y+118);ctx.quadraticCurveTo(x+w/2-7,y+90,x+w/2,y+76);ctx.quadraticCurveTo(x+w/2+7,y+90,x+w/2+4,y+118);ctx.fill();}
    ctx.restore();return [x+w/2,y+86];}
  if(kind==='dryice'){const s=1-0.8*e;ctx.fillStyle='#eef3f6';ctx.strokeStyle='#8fa3b3';ctx.lineWidth=2;const c=60*s;rr(ctx,x+w/2-c/2,y+170-c,c,c,5);ctx.fill();ctx.stroke();
    ctx.fillStyle=P['cv-soft'];ctx.globalAlpha=0.25*(e>0?1:0.4);for(let i=0;i<6;i++){ctx.beginPath();ctx.ellipse(x+w/2+((i*37)%60)-30,y+150-c-((t*10+i*9)%40),18,8,0,0,6.283);ctx.fill();}ctx.globalAlpha=1;ctx.restore();return [x+w/2,y+150];}
  ctx.restore();return [x+w/2,y+120];}

/* ---------- flowchart ---------- */
const NODES=[{id:'matter',l:'Matter',x:540,y:68},{id:'pure',l:'Pure substance',x:560,y:124,p:'matter'},{id:'element',l:'Element',x:580,y:176,p:'pure'},{id:'compound',l:'Compound',x:580,y:226,p:'pure'},
  {id:'mixture',l:'Mixture',x:560,y:290,p:'matter'},{id:'homog',l:'Homogeneous',x:580,y:342,p:'mixture'},{id:'heter',l:'Heterogeneous',x:580,y:392,p:'mixture'}];
const NH=38,NR=786;
const pathOf=c=>c==='element'||c==='compound'?['matter','pure',c]:['matter','mixture',c];
function drawFlow(sim,ctx,k){const st=sim.st,s=SAMPLES[sim.p.sample],P=PAL,path=st.call?pathOf(s.cls):[],wrong=st.call&&st.call!==s.cls?st.call:null;
  txt(ctx,'Flowchart',NODES[0].x,40,{s:13*k,w:700,c:P['cv-soft']});
  ctx.strokeStyle=P['cv-soft'];ctx.lineWidth=2;NODES.forEach(n=>{if(!n.p)return;const pa=NODES.find(q=>q.id===n.p);ctx.beginPath();ctx.moveTo(pa.x+14,pa.y+NH/2);ctx.lineTo(pa.x+14,n.y);ctx.lineTo(n.x,n.y);ctx.stroke();});
  NODES.forEach(n=>{const on=path.includes(n.id),bad=n.id===wrong,part=st.partial===n.id;const y=n.y-NH/2;rr(ctx,n.x,y,NR-n.x,NH,10);
    ctx.fillStyle=on?'#1b7a43':bad?'#b3261e':P['card'];ctx.fill();ctx.lineWidth=part?3:1.5;ctx.strokeStyle=on?'#1b7a43':bad?'#b3261e':part?P['s2']:P['line'];ctx.stroke();
    txt(ctx,n.l+(on&&n.id===s.cls?' ✓':bad?' ✗':''),n.x+10,n.y+1,{s:14*Math.min(k,1.55),w:700,c:on||bad?'#fff':P['cv-ink'],b:'middle'});});}

/* ---------- property cards ---------- */
function wrapLines(ctx,s,maxW,font){ctx.font=font;const words=s.split(' '),out=[];let line='';words.forEach(w=>{const tst=line?line+' '+w:w;if(ctx.measureText(tst).width>maxW&&line){out.push(line);line=w;}else line=tst;});if(line)out.push(line);return out;}
function drawProps(sim,ctx,k){const st=sim.st,P=PAL,c=PROPS[st.card],hon=atLeast('honors');
  const cw=520,cx=400-cw/2,cy=40;rr(ctx,cx,cy,cw,170,16);ctx.fillStyle=P['card'];ctx.fill();ctx.strokeStyle=st.pcall?(st.pcall===c.k?'#1b7a43':'#b3261e'):P['line'];ctx.lineWidth=st.pcall?4:2;ctx.stroke();
  txt(ctx,'Property card '+(st.card+1)+' of '+PROPS.length,cx+20,cy+30,{s:13*k,w:700,c:P['cv-soft']});
  const font='700 '+Math.round(24*Math.min(k,1.5))+'px '+FONT,lines=wrapLines(ctx,c.t,cw-40,font);lines.forEach((l,i)=>txt(ctx,l,400,cy+80+i*34*Math.min(k,1.5),{s:Math.round(24*Math.min(k,1.5)),w:700,a:'center'}));
  const bins=[{k:'phys',l:'Physical property',d:'observe it without making a new substance'},{k:'chem',l:'Chemical property',d:'how it changes into new substances'}];
  bins.forEach((b,i)=>{const bx=i?420:60,by=250,bw=320,bh=150;const sel=st.pcall===b.k,right=st.pcall&&c.k===b.k;rr(ctx,bx,by,bw,bh,14);ctx.fillStyle=right?'#1b7a43':sel?'#b3261e':P['cv-bg2'];ctx.fill();
    ctx.strokeStyle=right?'#1b7a43':P['line'];ctx.lineWidth=2;ctx.stroke();const ink=right||sel?'#fff':P['cv-ink'];
    txt(ctx,b.l+(right?' ✓':sel?' ✗':''),bx+bw/2,by+44,{s:20*k,w:800,a:'center',c:ink});if(k<1.3)txt(ctx,b.d,bx+bw/2,by+78,{s:14,a:'center',c:right||sel?'#fff':P['cv-soft']});
    if(right&&hon&&c.ie)pill(ctx,c.ie==='int'?'intensive':'extensive',bx+bw/2,by+116,'#fff','#1b7a43',15*k);});
  txt(ctx,st.pcall?(st.pcall===c.k?'Right.':'Not quite.')+' Press “Next card”.':'Pick a bin with the buttons.',400,440,{s:15*k,w:600,a:'center',c:P['cv-soft']});}

/* ---------- definition ---------- */
const SIM={
  id:'classify',hash:'classify',apUnit:1,order:1,tab:'Classifying matter',kind:'Learning tool',
  prereq:[],next:['separation','states','balance'],
  card:'Zoom into real samples to sort elements, compounds and mixtures, then watch whether a change makes new substances.',
  title:'Classifying matter: elements, compounds and mixtures',
  lede:{bio:'Zoom in on everyday samples. Decide whether each is a pure substance or a mixture, then watch melting, boiling, rusting and burning at the particle level.',
        honors:'Use particle diagrams to tell atoms from molecules, elements from compounds, and homogeneous from heterogeneous mixtures. Change a mixture’s recipe and see that only mixtures can vary.',
        ap:'Connect particle diagrams to composition: a compound has a fixed mass percent, a mixture does not, and atoms and mass are conserved in every chemical change.'},
  scale:'Zoomed about 100 million times: each ball is one atom, 0.1–0.4 nm across. The container on the left is a few centimeters tall.',
  aspect:1.6,timeless:true,animated:true,graph:false,chChange:0.5,chReveal:8,
  controls:[
    {id:'mode',label:'Activity',type:'seg',def:'sort',lvl:'bio',options:[{v:'sort',l:'Classify a sample'},{v:'change',l:'Physical or chemical change'},{v:'props',l:'Properties sort'}],
      onChange(sim){if(sim.st&&sim.p.mode==='change'){sim.st.prog=0;sim.st.run=true;}syncMode(sim);}},
    {id:'sample',label:'Sample',type:'select',def:'h2o',lvl:'bio',modes:['sort'],options:Object.keys(SAMPLES).map(k=>({v:k,l:SAMPLES[k].l,lvl:SAMPLES[k].lvl})),
      onChange(sim){if(sim.st){sim.st.call=null;sim.st.partial=null;}}},
    {id:'amt',label:'Mixture recipe: amount of the added substance',type:'range',min:0,max:100,step:5,def:50,unit:'%',lvl:'honors',modes:['sort'],
      help:'Changes how much of the second substance is in a mixture. Try it on a compound too.'},
    {id:'proc',label:'Change',type:'select',def:'melt',lvl:'bio',modes:['change'],options:Object.keys(PROCS).map(k=>({v:k,l:PROCS[k].l,lvl:PROCS[k].lvl})),
      onChange(sim){if(sim.st){sim.st.prog=0;sim.st.run=true;}}}
  ],
  actions:[
    {id:'cE',label:'It’s an element',lvl:'bio',modes:['sort'],run(sim){call(sim,'element');}},
    {id:'cC',label:'It’s a compound',lvl:'bio',modes:['sort'],run(sim){call(sim,'compound');}},
    {id:'cHo',label:'Homogeneous mixture',lvl:'bio',modes:['sort'],run(sim){call(sim,'homog');}},
    {id:'cHe',label:'Heterogeneous mixture',lvl:'bio',modes:['sort'],run(sim){call(sim,'heter');}},
    {id:'newS',label:'Next sample',lvl:'bio',primary:true,modes:['sort'],run(sim){const L=sampleList(),i=L.indexOf(sim.p.sample);BioLab.setValues(sim,{sample:L[(i+1)%L.length]});sim.st.call=null;sim.st.partial=null;}},
    {id:'run',label:'Run the change',lvl:'bio',primary:true,modes:['change'],run(sim){sim.st.prog=0;sim.st.run=true;}},
    {id:'pP',label:'Physical property',lvl:'bio',modes:['props'],run(sim){propCall(sim,'phys');}},
    {id:'pC',label:'Chemical property',lvl:'bio',modes:['props'],run(sim){propCall(sim,'chem');}},
    {id:'pN',label:'Next card',lvl:'bio',primary:true,modes:['props'],run(sim){sim.st.card=(sim.st.card+1)%PROPS.length;sim.st.pcall=null;}}
  ],
  init(){return {seed:0,call:null,partial:null,tries:0,right:0,prog:0,run:false,card:0,pcall:null,ptries:0,pright:0};},
  step(sim,dt){const st=sim.st;if(st.run){st.prog=Math.min(1,st.prog+dt/6);if(st.prog>=1)st.run=false;}},
  metrics:[
    {id:'els',label:'Elements present',unit:'',lvl:'bio',text:true,modes:['sort'],get:s=>elementsIn(substances(SAMPLES[s.p.sample])).map(e=>e+' ('+ELNAME[e]+')').join(', ')},
    {id:'subs',label:'Substances present',unit:'',lvl:'bio',text:true,modes:['sort'],get:s=>{if(!s.st.call)return 'Make your call first';const L=substances(SAMPLES[s.p.sample]);return L.length+': '+L.map(lab).join(', ');}},
    {id:'yours',label:'Your call',unit:'',lvl:'bio',text:true,modes:['sort'],get:s=>{const c=s.st.call;if(!c)return 'Not yet';const r=SAMPLES[s.p.sample].cls;return CLS_L[c]+(c===r?' ✓':' ✗ (it is a '+CLS_L[r].toLowerCase()+')');}},
    {id:'score',label:'Correct calls',unit:'',lvl:'bio',text:true,modes:['sort'],noTrial:true,get:s=>s.st.right+' of '+s.st.tries},
    {id:'pct',label:'Composition by mass in this view',unit:'',lvl:'ap',text:true,modes:['sort'],get:s=>composition(s)},
    {id:'before',label:'Substances before',unit:'',lvl:'bio',text:true,modes:['change'],get:s=>Object.keys(setCounts(chg(s).B)).map(lab).join(', ')},
    {id:'after',label:'Substances after',unit:'',lvl:'bio',text:true,modes:['change'],get:s=>s.st.prog<0.8?'Watch…':Object.keys(setCounts(chg(s).A)).map(lab).join(', ')},
    {id:'type',label:'Type of change',unit:'',lvl:'bio',text:true,modes:['change'],get:s=>s.st.prog<0.8?'Watch…':PROCS[s.p.proc].phys?'Physical (same substances)':'Chemical (new substances)'},
    {id:'atoms',label:'Atoms before → after',unit:'',lvl:'honors',text:true,modes:['change'],get:s=>{const v=chg(s),b=atomCounts(v.B),a=atomCounts(v.A);return Object.keys(b).map(e=>e+' '+b[e]+' → '+(a[e]||0)).join(', ');}},
    {id:'mass',label:'Total mass before → after',unit:'u',lvl:'ap',text:true,modes:['change'],get:s=>{const v=chg(s);return setMass(v.B).toFixed(1)+' → '+setMass(v.A).toFixed(1);}},
    {id:'pscore',label:'Cards sorted correctly',unit:'',lvl:'bio',text:true,modes:['props'],noTrial:true,get:s=>s.st.pright+' of '+s.st.ptries}
  ],
  narrate(sim){const p=sim.p,st=sim.st,hon=atLeast('honors'),ap=atLeast('ap');
    if(p.mode==='sort'){const s=SAMPLES[p.sample];
      if(!st.call){let t='You are looking at <b>'+s.l.toLowerCase()+'</b>. First ask: <b>is every particle the same substance?</b> If yes, it is pure; if you see two or more different particles, it is a mixture. Click the flowchart or use the buttons.';
        if(hon&&s.vary)t+=' Slide the recipe: a mixture can have any amount of each part.';else if(hon&&!s.vary&&(s.cls==='element'||s.cls==='compound'))t+=' This one ignores the recipe slider: a pure substance has a fixed makeup.';return t;}
      let t=(st.call===s.cls?'Right. ':'Not quite. ')+s.why;
      if(hon&&s.cls==='element')t+=' It is an element made of '+(s.sub==='molecules'?'molecules':'separate atoms')+'.';
      if(hon&&s.mixOf)t+=' It is a mixture of '+s.mixOf+'.';
      if(ap&&s.cls==='compound'){const f=substances(s)[0],pc=CL.percentComp(formulaOf(f).replace('Ox','O'));t+=' Every sample of '+lab(f)+' is '+pc.map(q=>q.pct.toFixed(1)+'% '+q.sym).join(', ')+' by mass (law of definite proportions).';}
      return t;}
    if(p.mode==='change'){const pr=PROCS[p.proc];
      if(st.prog<0.15&&!st.run)return 'Press <b>Run the change</b> and watch the particles. Do the molecules stay whole, or do atoms trade partners and make new substances?';
      if(st.prog<0.8)return pr.phys?'Watch each molecule: does it stay in one piece as it moves?':'Watch the bonds: old bonds fade as atoms move to new partners.';
      let t=(pr.phys?'<b>Physical change.</b> ':'<b>Chemical change.</b> ')+pr.what;
      if(hon)t+=' Count the atoms: every atom before is still there after.';if(ap)t+=' Mass is conserved: '+setMass(chg(sim).B).toFixed(1)+' u before and after.';return t;}
    const c=PROPS[st.card];if(!st.pcall)return 'Is this a <b>physical property</b> (observed without making a new substance) or a <b>chemical property</b> (how the substance changes into new substances)?';
    let t=(st.pcall===c.k?'Right: ':'Not quite: ')+'it is a '+(c.k==='phys'?'physical':'chemical')+' property. '+c.r;
    if(hon&&c.ie)t+=' It is <b>'+(c.ie==='int'?'intensive':'extensive')+'</b>: '+(c.ie==='int'?'it stays the same no matter how much you have.':'it depends on the amount of sample.');return t;},
  tour:[
    {title:'Two views of one sample',text:'On the left is what you see in the lab. The big circle zooms in about 100 million times so you can see the particles. Here is pure water: every particle is the same H₂O molecule.',focus:[[24,130,140,230],[CX-R-6,CY-R-6,2*R+12,2*R+12]],speed:1,setup(sim){BioLab.setValues(sim,{mode:'sort',sample:'h2o'});sim.st.call=null;}},
    {title:'Pure substance or mixture?',text:'Salt water looks just like pure water, but the zoom shows water molecules plus Na⁺ and Cl⁻ ions. Two substances means a mixture.',focus:[CX-R-6,CY-R-6,2*R+12,2*R+12],speed:1,setup(sim){BioLab.setValues(sim,{sample:'salt'});sim.st.call=null;}},
    {title:'Molecules can be elements',text:{bio:'Oxygen gas is made of O₂ molecules. Both atoms in each molecule are oxygen, so oxygen gas is an element, not a compound.',honors:'O₂, N₂, H₂ and Cl₂ are diatomic elements: molecules made of one kind of atom. A compound needs two or more different elements bonded together.'},focus:[CX-R-6,CY-R-6,2*R+12,2*R+12],speed:1,setup(sim){BioLab.setValues(sim,{sample:'o2'});sim.st.call=null;}},
    {title:'Even or not even?',text:'Sand in water has a solid layer you can see. A mixture whose parts you can tell apart is heterogeneous. Salt water and air are the same all through, so they are homogeneous.',focus:[CX-R-6,CY-R-6,2*R+12,2*R+12],speed:1,setup(sim){BioLab.setValues(sim,{sample:'sand'});sim.st.call=null;}},
    {title:'The flowchart',text:'Two questions classify any sample. One substance? Then ask: one kind of atom (element) or more (compound)? A mixture? Then ask: the same throughout (homogeneous) or not (heterogeneous)?',focus:[528,30,266,390],speed:1,pause:true,setup(sim){sim.st.call=null;call(sim,'heter');}},
    {title:'Physical change',text:'Melting ice: the H₂O molecules leave their fixed spots and slide around, but every molecule stays whole. No new substance forms.',focus:[[24,130,140,230],[CX-R-6,CY-R-6,2*R+12,2*R+12]],speed:1,setup(sim){BioLab.setValues(sim,{mode:'change',proc:'melt'});sim.st.prog=0;sim.st.run=true;}},
    {title:'Chemical change',text:'Burning methane: bonds break and the same atoms regroup into CO₂ and H₂O. New substances mean a chemical change.',focus:[CX-R-6,CY-R-6,2*R+12,2*R+12],speed:1,setup(sim){BioLab.setValues(sim,{mode:'change',proc:'burn'});sim.st.prog=0;sim.st.run=true;}},
    {lvl:'honors',title:'Atoms are conserved',text:{honors:'Check the readout Atoms before → after: 3 C, 12 H and 12 O before, and the same after. A chemical equation is balanced because atoms are never created or destroyed.',ap:'Atoms before → after match, so the total mass matches too: 240.3 u of reactants become 240.3 u of products. That is the law of conservation of mass.'},focus:[150,440,380,56],speed:1,setup(sim){BioLab.setValues(sim,{mode:'change',proc:'burn'});sim.st.prog=1;sim.st.run=false;}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{mode:'sort',sample:'h2o',proc:'melt'});sim.st.call=null;},
  onChallenge(sim,ch,phase){if(phase==='ask'&&ch&&ch.rnd)sim.cq=(sim.cq||0)+1;if(ch&&ch.set&&phase==='done'){BioLab.setValues(sim,ch.set);sim.st.call=null;}},
  challenges(sim){const a=poolItem(sim,1),b=poolItem(sim,2);const M=f=>CL.molarMass(f);
    const mR=3*M('CH4')+6*M('O2'),mP=3*M('CO2')+6*M('H2O');const pH2O=CL.percentComp('H2O').find(q=>q.sym==='H').pct,pH2O2=CL.percentComp('H2O2').find(q=>q.sym==='H').pct;
    return [
    {lvl:'bio',instant:true,rnd:true,q:'Classify the sample in this particle diagram.'+svgDiagram(a.spec,(sim.cq||0)*7+3),choices:['An element','A compound','A mixture'],correct:a.c,
      explain:a.d+' First ask whether all the particles are the same; only then ask how many kinds of atoms each one has.'},
    {lvl:'bio',instant:true,set:{mode:'sort',sample:'o2'},q:'Oxygen gas is made of O₂ molecules: two oxygen atoms bonded together. What is oxygen gas?'+svgDiagram([{f:'O2',n:7}],5),
      choices:['An element, because every atom is oxygen','A compound, because the atoms are bonded together','A mixture, because each particle has two atoms'],correct:0,
      explain:'Bonded atoms do not make a compound by themselves. A compound needs two or more <i>different</i> elements. O₂ has only oxygen, so it is an element (made of molecules). The stage now shows oxygen gas.'},
    {lvl:'bio',q:'Predict: when ice melts, what happens to the water molecules?',choices:['They stay H₂O molecules and just move more freely','They break apart into H and O atoms','They turn into a new substance'],correct:0,
      baseline:{mode:'change',proc:'melt'},changeAction:'run',changeText:'The ice is melting',
      explain:'Watch the readouts: Substances before is H₂O and Substances after is still H₂O. The molecules only left their fixed places, so melting is a physical change.'},
    {lvl:'bio',instant:true,set:{mode:'sort',sample:'h2mix'},q:'A flask holds H₂ and O₂ molecules, the same atoms that make up water. What is in the flask?'+svgDiagram([{f:'H2',n:6},{f:'O2',n:3}],9),
      choices:['Water, a compound','A mixture of two elements','One element'],correct:1,
      explain:'The atoms are the same as in water, but they are not bonded into H₂O. Two different substances, H₂ and O₂, are mixed, so it is a mixture of elements. A spark would react them into water, a chemical change.'},
    {lvl:'honors',q:'Predict: you pass electricity through water. What collects above the two electrodes?',choices:['Water vapor (steam) above both','Hydrogen gas and oxygen gas, about 2 volumes of H₂ to 1 of O₂','Hydrogen and oxygen gas in equal volumes'],correct:1,
      baseline:{mode:'change',proc:'electro'},changeAction:'run',changeText:'The current is on',
      explain:'The atoms regroup: 8 H₂O become 8 H₂ and 4 O₂. The H₂ tube fills twice as fast because 2H₂O → 2H₂ + O₂ makes 2 molecules of H₂ for every O₂. New substances, so electrolysis is a chemical change.'},
    {lvl:'honors',instant:true,set:{mode:'sort',sample:'brass'},q:'Brass is made by melting copper and zinc together. It looks the same all through. How do you classify brass?',
      choices:['An element, because it is a metal','A compound of copper and zinc','A homogeneous mixture (an alloy)','A heterogeneous mixture'],correct:2,
      explain:'Zinc atoms are scattered evenly in the copper grid, but they are not bonded in a fixed ratio: brass can be 5% to 45% zinc. Variable composition and an even look make it a homogeneous mixture. Try the recipe slider on the stage.'},
    {lvl:'honors',instant:true,rnd:true,q:'Classify the sample in this particle diagram as precisely as you can.'+svgDiagram(b.spec,(sim.cq||0)*13+5),
      choices:['Element made of atoms','Element made of molecules','Compound','Mixture of elements','Mixture of compounds','Mixture of an element and a compound'],correct:b.c6,explain:b.d},
    {lvl:'ap',q:'3 CH₄ molecules burn with 6 O₂ molecules. Compared with the reactants, the total mass of the products is…',choices:['less, because gases are made','the same','greater, because oxygen was added'],correct:1,
      baseline:{mode:'change',proc:'burn'},changeAction:'run',changeText:'The methane is burning',
      explain:'Reactants: 3(16.04) + 6(32.00) = '+mR.toFixed(1)+' u. Products: 3(44.01) + 6(18.02) = '+mP.toFixed(1)+' u. The Total mass readout matches because every atom is conserved; the oxygen was already counted in the reactants.'},
    {lvl:'ap',instant:true,q:'Two pure samples contain only hydrogen and oxygen. Sample A is '+pH2O.toFixed(1)+'% H by mass and sample B is '+pH2O2.toFixed(1)+'% H. What are they?',
      choices:['The same compound with measurement error','Two different compounds','Mixtures, because their compositions differ'],correct:1,
      explain:'A compound always has the same mass percent (law of definite proportions). H₂O is '+pH2O.toFixed(1)+'% H and H₂O₂ is '+pH2O2.toFixed(1)+'% H. Different fixed percentages mean different compounds made of the same elements (law of multiple proportions).'},
    {lvl:'ap',instant:true,set:{mode:'change',proc:'dissolve'},q:'When NaCl dissolves, its ionic bonds break and the ions spread out. Most chemistry courses still call dissolving a physical change. What is the best evidence?',
      choices:['Evaporating the water gives back the same NaCl','The salt seems to disappear','The temperature changes a little'],correct:0,
      explain:'No new substance forms: the ions are still Na⁺ and Cl⁻, and boiling off the water returns the same NaCl crystal. Disappearing and small temperature changes happen in both kinds of change, so they are not good evidence. Chemists do debate this case, because ionic bonds do break.'}
  ];},
  lab:{bio:'<p><b>Question:</b> How can you tell from particles whether something is an element, compound or mixture?</p><ol><li>Choose <b>Classify a sample</b>. For each sample, make your call before you look at the readouts.</li><li>Press <b>Record trial</b> after each call so the table keeps the sample and your answer.</li><li>Classify at least eight samples, then switch to <b>Physical or chemical change</b> and run all six changes.</li></ol><p>Write one rule that tells a pure substance from a mixture, and one that tells a physical change from a chemical change.</p>',
       honors:'<p><b>Question:</b> What makes a compound different from a mixture of the same elements?</p><ol><li>Compare <b>Hydrogen and oxygen gas, mixed</b> with <b>Pure water</b>, and <b>Iron filings and sulfur powder</b> with <b>Iron(II) sulfide</b>.</li><li>Move the recipe slider on each. Record which ones change.</li><li>Run electrolysis of water and count the H₂ and O₂ molecules made.</li></ol><p>Explain, using particles, why a mixture’s recipe can change but a compound’s cannot.</p>',
       ap:'<p><b>Question:</b> Do mass percent data support the particle model?</p><ol><li>For three compounds, record the composition readout. Change the recipe and record again.</li><li>For three mixtures, record the composition at recipes of 0%, 50% and 100%.</li><li>Run burning methane and rusting iron and record the total mass before and after.</li></ol><p><b>Claim–evidence–reasoning:</b> Use your data to support the laws of definite proportions and conservation of mass.</p>'},
  terms:[{t:'Matter',d:'Anything that has mass and takes up space.'},{t:'Pure substance',d:'Matter with one fixed makeup: every particle is the same. Elements and compounds are pure substances.'},
    {t:'Element',d:'A pure substance made of only one kind of atom. It can be single atoms (He) or molecules (O₂).'},{t:'Compound',d:'A pure substance made of two or more elements chemically bonded in a fixed ratio (H₂O, NaCl).'},
    {t:'Mixture',d:'Two or more substances physically combined, each keeping its own identity. The amounts can vary.'},{t:'Homogeneous mixture',d:'A mixture that is the same throughout, such as salt water or air. A solution is a homogeneous mixture.'},
    {t:'Heterogeneous mixture',d:'A mixture whose parts you can tell apart, such as sand in water.'},{t:'Physical change',d:'A change in form or state that makes no new substance (melting, boiling, dissolving).'},
    {t:'Chemical change',d:'A change that makes new substances by breaking and forming bonds (burning, rusting).'},
    {lvl:'honors',t:'Diatomic element',d:'An element whose particles are two-atom molecules: H₂, N₂, O₂, F₂, Cl₂, Br₂, I₂.'},{lvl:'honors',t:'Alloy',d:'A homogeneous mixture of metals, such as brass (Cu and Zn).'},
    {lvl:'honors',t:'Intensive property',d:'A property that does not depend on the amount of sample (density, boiling point, color).'},{lvl:'honors',t:'Extensive property',d:'A property that depends on the amount of sample (mass, volume).'},
    {lvl:'ap',t:'Law of definite proportions',d:'A compound always contains the same elements in the same mass ratio.'},{lvl:'ap',t:'Conservation of mass',d:'In a chemical change the total mass of the products equals the total mass of the reactants, because atoms are conserved.'}],
  about:'<p>Each sample is drawn from real particle formulas with CPK atom colors and sizes on one consistent scale (H smallest, Cl and Ar largest). Gas particles fly freely, liquid particles jostle in contact, and solids vibrate in place. Gases are drawn far denser than real: at room conditions a gas has about 1/1000 the particles of a liquid in the same space.</p><p>In the change animations the program tracks every atom. A physical change moves whole molecules to new places; a chemical change sends each atom to a new partner, so the atom counts before and after always match. Real rust is hydrated iron(III) oxide, oil is a blend of hydrocarbons (shown as hexane with its H atoms left out), sulfur is really S₈ rings, and sand is shown as a SiO₂ grid. Air is simplified to N₂, O₂ and Ar; the composition readout counts only the particles in view, so it differs from air’s real 78% N₂ by mass percentages. Masses use average atomic masses from the periodic table.</p>',
  initVis(sim){},
  draw(sim,ctx,vdt,k,t){const p=sim.p,st=sim.st,v=sim.vis,P=PAL,hon=atLeast('honors');
    ctx.fillStyle=P['cv-bg'];ctx.fillRect(0,0,W,H);
    if(p.mode==='props'){drawProps(sim,ctx,k);return;}
    const isChange=p.mode==='change',e=isChange?ss((st.prog-0.15)/0.6):0;
    const macroKind=isChange?PROCS[p.proc].macro:SAMPLES[p.sample].macro;
    txt(ctx,'What you see',94,128,{s:13*k,w:700,a:'center',c:P['cv-soft']});
    const [mx,my]=drawMacro(ctx,macroKind,e,t,k);
    zoomLines(ctx,mx,my,12);
    txt(ctx,'Particle view',CX,CY-R-12,{s:13*k,w:700,a:'center',c:P['cv-soft']});
    // circle background
    ctx.save();ctx.beginPath();ctx.arc(CX,CY,R,0,6.283);ctx.fillStyle=P['cv-bg2'];ctx.fill();ctx.clip();
    if(!isChange){const S=sortSet(sim);moveSet(S,vdt,t);shadeLiquid(ctx,S.liq,1);drawSet(ctx,S,1);}
    else{chg(sim);moveSet(v.B,vdt,t);moveSet(v.A,vdt,t);shadeLiquid(ctx,v.B.liq,1-e);shadeLiquid(ctx,v.A.liq,e);drawChange(ctx,v,e);}
    ctx.restore();ctx.strokeStyle=P['cv-glass'];ctx.lineWidth=3;ctx.beginPath();ctx.arc(CX,CY,R,0,6.283);ctx.stroke();
    // key of elements
    const set=isChange?chg(sim).B:sortSet(sim),els=[];set.mols.forEach(m=>m.t.a.forEach(([s])=>{if(!els.includes(s))els.push(s);}));
    let kx=CX-els.length*34;els.forEach(s=>{CL.drawAtom(ctx,kx+8,CY+R+24,8,s,{label:''});txt(ctx,s,kx+21,CY+R+25,{s:14*k,w:700,b:'middle'});kx+=68;});
    // symbol line
    const sym=isChange?PROCS[p.proc].eq:SAMPLES[p.sample].sym;
    if(isChange){pill(ctx,sym,CX,H-22,P['card'],P['cv-ink'],15*k);}
    else txt(ctx,sym,CX,H-14,{s:16*k,w:700,a:'center'});
    if(!isChange)drawFlow(sim,ctx,k);
    else drawChangePanel(sim,ctx,k,e);
  },
  onClick(sim,x,y){if(sim.p.mode!=='sort')return;const st=sim.st;const n=NODES.find(n=>x>=n.x&&x<=NR&&Math.abs(y-n.y)<=NH/2);if(!n||st.call)return;
    if(n.id==='pure'||n.id==='mixture'){st.partial=n.id;return;}if(n.id!=='matter')call(sim,n.id);},
  thumbSetup(sim){sim.p.sample='salt';}
};
function composition(s){const sm=SAMPLES[s.p.sample];const subs=substances(sm);
  if(subs.length===1){const f=formulaOf(subs[0]).replace('Ox','O');if(Object.keys(CL.parse(f)).length===1)return '100% '+f+' (an element)';return CL.percentComp(f).map(q=>q.pct.toFixed(1)+'% '+q.sym).join(', ')+' (fixed)';}
  // mixture: mass of each substance from the particles in view
  const c=setCounts(sortSet(s)),mass={};let tot=0;
  Object.keys(c).forEach(f=>{let key=f,m;if(f==='Na+'||f==='Cl-'){key='NaCl';m=CL.el(f==='Na+'?'Na':'Cl').mass;}else if(f==='Si'||f==='Ox'){key='SiO2';m=CL.el(f==='Si'?'Si':'O').mass;}else m=CL.molarMass(formulaOf(f));mass[key]=(mass[key]||0)+m*c[f];tot+=m*c[f];});
  return Object.keys(mass).map(f=>(100*mass[f]/tot).toFixed(0)+'% '+lab(f)).join(', ')+' (varies)';}
function drawChange(ctx,v,e){const B=v.B,A=v.A,map=v.map;
  if(map.mol){map.mol.forEach(({b,a})=>{const mb=B.mols[b].tr,ma=A.mols[a].tr;let da=ma.a-mb.a;da=Math.atan2(Math.sin(da),Math.cos(da));const m=B.mols[b];
      const at=molAtoms(m,lerp(mb.x,ma.x,e),lerp(mb.y,ma.y,e),mb.a+da*e);(m.t.b||[]).forEach(([i,j])=>drawBond(ctx,at[i][1],at[i][2],at[j][1],at[j][2],1));at.forEach(([s,x,y])=>drawAtomQ(ctx,s,x,y,m.t.q));});return;}
  const posB=B.mols.map(m=>molAtoms(m,m.tr.x,m.tr.y,m.tr.a)),posA=A.mols.map(m=>molAtoms(m,m.tr.x,m.tr.y,m.tr.a));
  const cur=map.atom.map(q=>{const pb=posB[q.bm][q.bi],pa=posA[q.am][q.ai];return [q.s,lerp(pb[1],pa[1],e),lerp(pb[2],pa[2],e)];});
  const idxB={},idxA={};map.atom.forEach((q,i)=>{idxB[q.bm+':'+q.bi]=i;idxA[q.am+':'+q.ai]=i;});
  B.mols.forEach((m,mi)=>(m.t.b||[]).forEach(([i,j])=>{const a=cur[idxB[mi+':'+i]],b=cur[idxB[mi+':'+j]];if(a&&b)drawBond(ctx,a[1],a[2],b[1],b[2],1-e);}));
  A.mols.forEach((m,mi)=>(m.t.b||[]).forEach(([i,j])=>{const a=cur[idxA[mi+':'+i]],b=cur[idxA[mi+':'+j]];if(a&&b)drawBond(ctx,a[1],a[2],b[1],b[2],e);}));
  cur.forEach(([s,x,y])=>drawAtomQ(ctx,s,x,y,null));}
function drawChangePanel(sim,ctx,k,e){const P=PAL,pr=PROCS[sim.p.proc],st=sim.st,v=chg(sim),x0=540,hon=atLeast('honors');
  const box=(y,h,title,body,col)=>{rr(ctx,x0,y,250,h,12);ctx.fillStyle=col||P['card'];ctx.fill();ctx.strokeStyle=col||P['line'];ctx.lineWidth=1.5;ctx.stroke();
    txt(ctx,title,x0+14,y+24,{s:13*k,w:700,c:col?'#fff':P['cv-soft']});txt(ctx,body,x0+14,y+56,{s:17*Math.min(k,1.3),w:800,c:col?'#fff':P['cv-ink']});};
  const nm=set=>Object.keys(setCounts(set)).map(lab).join(' + ');
  box(40,80,'Before',nm(v.B));box(140,80,'After',st.prog<0.8?'…':nm(v.A));
  const done=st.prog>=0.8;box(240,80,'New substance?',done?(pr.phys?'No → physical':'Yes → chemical'):'Watch…',done?(pr.phys?'#1f5fae':'#a33a12'):null);
  // progress bar
  rr(ctx,x0,340,250,10,5);ctx.fillStyle=P['cv-bg2'];ctx.fill();rr(ctx,x0,340,250*clamp(st.prog,0,1),10,5);ctx.fillStyle=P['rj'];ctx.fill();
  if(hon&&k<1.3){const b=atomCounts(v.B);txt(ctx,'Atoms: '+Object.keys(b).map(s=>b[s]+' '+s).join(', '),x0,378,{s:13,c:P['cv-soft']});txt(ctx,'Same atoms before and after',x0,398,{s:13,c:P['cv-soft']});}}
SIM.onLevel=syncMode;
BioLab.register(SIM);
})();
