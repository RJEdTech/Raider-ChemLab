(function(){
'use strict';
const {clamp,lerp,rr,txt,pill,atLeast,PAL,FONT,RM,axes,legend,serColor}=BioLab.h;
const CL=window.ChemLab;
const ASP=800/516,LH=516;

/* ---------- species and equations ----------
   A species is a formula string with an optional charge after '^' ('Fe^2+', 'MnO4^-', 'e' = electron).
   Every equation in the library is checked by code at load: atom counts for each element and total charge
   must match on both sides, and the coefficients must be in lowest terms. Anything that fails is dropped
   and reported in the console. */
const SPC={};
function sp(s){if(SPC[s])return SPC[s];let f=s,q=0;const m=s.match(/^(.+)\^(\d*)([+-])$/);if(m){f=m[1];q=(m[2]?+m[2]:1)*(m[3]==='+'?1:-1);}
  const e=f==='e';const counts=e?{}:CL.parse(f);let n=0;for(const k in counts)n+=counts[k];if(e)q=-1;
  return SPC[s]={s,f,q,counts,e,n,txt:e?'e⁻':CL.fmt(f,q),html:e?'e<sup>−</sup>':CL.html(f,q),M:e?0:CL.molarMass(counts)};}
function side(str){return str.split(' + ').map(t=>{t=t.trim();const m=t.match(/^(\d+)(?=[A-Z(e])(.+)$/);return m?{c:+m[1],sp:sp(m[2])}:{c:1,sp:sp(t)};});}
const gcd=(a,b)=>b?gcd(b,a%b):a;
function tally(r,p,cr,cp){const els=[],R={},P={};let qR=0,qP=0;
  const add=(list,cs,T,isR)=>list.forEach((s,i)=>{const c=cs[i];for(const k in s.counts){if(!els.includes(k))els.push(k);T[k]=(T[k]||0)+c*s.counts[k];}if(isR)qR+=c*s.q;else qP+=c*s.q;});
  add(r,cr,R,true);add(p,cp,P,false);els.forEach(k=>{R[k]=R[k]||0;P[k]=P[k]||0;});return {els,R,P,qR,qP};}

// [id, name, tier (3 = Closer look and up in the equation menu), type, skeleton, balanced coefficients]
const LIB_RAW=[
 ['water','Making water',1,'synthesis','H2 + O2 > H2O',[2,1,2]],
 ['ammonia','Making ammonia',1,'synthesis','N2 + H2 > NH3',[1,3,2]],
 ['salt','Sodium and chlorine',1,'synthesis','Na + Cl2 > NaCl',[2,1,2]],
 ['mgo','Burning magnesium',1,'synthesis','Mg + O2 > MgO',[2,1,2]],
 ['hcl','Hydrogen and chlorine',1,'synthesis','H2 + Cl2 > HCl',[1,1,2]],
 ['peroxide','Hydrogen peroxide breaking down',1,'decomposition','H2O2 > H2O + O2',[2,2,1]],
 ['caco3','Heating limestone',1,'decomposition','CaCO3 > CaO + CO2',[1,1,1]],
 ['hgo','Heating mercury(II) oxide',1,'decomposition','HgO > Hg + O2',[2,2,1]],
 ['kclo3','Heating potassium chlorate',1,'decomposition','KClO3 > KCl + O2',[2,2,3]],
 ['methane','Burning methane',1,'combustion','CH4 + O2 > CO2 + H2O',[1,2,1,2]],
 ['al2o3','Aluminum and oxygen',1,'synthesis','Al + O2 > Al2O3',[4,3,2]],
 ['fecl3','Iron and chlorine',1,'synthesis','Fe + Cl2 > FeCl3',[2,3,2]],
 ['zn','Zinc in hydrochloric acid',1,'single replacement','Zn + HCl > ZnCl2 + H2',[1,2,1,1]],
 ['p4o10','Burning phosphorus',1,'synthesis','P4 + O2 > P4O10',[1,5,1]],
 ['alcu','Aluminum in copper(II) chloride',2,'single replacement','Al + CuCl2 > AlCl3 + Cu',[2,3,2,3]],
 ['agcl','Silver nitrate and sodium chloride',2,'double replacement','AgNO3 + NaCl > AgCl + NaNO3',[1,1,1,1]],
 ['pbi2','Lead(II) nitrate and potassium iodide',2,'double replacement','Pb(NO3)2 + KI > PbI2 + KNO3',[1,2,1,2]],
 ['propane','Burning propane',2,'combustion','C3H8 + O2 > CO2 + H2O',[1,5,3,4]],
 ['ethanol','Burning ethanol',2,'combustion','C2H5OH + O2 > CO2 + H2O',[1,3,2,3]],
 ['rust','Iron rusting',2,'synthesis','Fe + O2 > Fe2O3',[4,3,2]],
 ['smelt','Smelting iron ore',2,'single replacement','Fe2O3 + C > Fe + CO2',[2,3,4,3]],
 ['nawater','Sodium in water',2,'single replacement','Na + H2O > NaOH + H2',[2,2,2,1]],
 ['caoh','Calcium hydroxide and hydrochloric acid',2,'double replacement','Ca(OH)2 + HCl > CaCl2 + H2O',[1,2,1,2]],
 ['baso4','Barium chloride and sodium sulfate',2,'double replacement','BaCl2 + Na2SO4 > BaSO4 + NaCl',[1,1,1,2]],
 ['cuag','Copper in silver nitrate',2,'single replacement','Cu + AgNO3 > Cu(NO3)2 + Ag',[1,2,1,2]],
 ['h2so4','Sulfuric acid and sodium hydroxide',2,'double replacement','H2SO4 + NaOH > Na2SO4 + H2O',[1,2,1,2]],
 ['vinegar','Baking soda and vinegar',2,'double replacement','NaHCO3 + HC2H3O2 > NaC2H3O2 + H2O + CO2',[1,1,1,1,1]],
 ['no2','Nitrogen and oxygen',2,'synthesis','N2 + O2 > NO2',[1,2,2]],
 ['mghcl','Magnesium in hydrochloric acid',2,'single replacement','Mg + HCl > MgCl2 + H2',[1,2,1,1]],
 ['resp','Cellular respiration',2,'combustion','C6H12O6 + O2 > CO2 + H2O',[1,6,6,6]],
 ['photo','Photosynthesis',2,'photosynthesis','CO2 + H2O > C6H12O6 + O2',[6,6,1,6]],
 ['octane','Burning octane (gasoline)',3,'combustion','C8H18 + O2 > CO2 + H2O',[2,25,16,18]],
 ['ethane','Burning ethane',3,'combustion','C2H6 + O2 > CO2 + H2O',[2,7,4,6]],
 ['butane','Burning butane (lighter fuel)',3,'combustion','C4H10 + O2 > CO2 + H2O',[2,13,8,10]],
 ['ostwald','Oxidizing ammonia',3,'redox','NH3 + O2 > NO + H2O',[4,5,4,6]],
 ['fekoh','Iron(III) sulfate and potassium hydroxide',3,'double replacement','Fe2(SO4)3 + KOH > K2SO4 + Fe(OH)3',[1,6,3,2]],
 ['phos','Making phosphorus',3,'redox','Ca3(PO4)2 + SiO2 + C > CaSiO3 + P4 + CO',[2,6,10,6,1,10]],
 ['remsen','Copper in nitric acid (Remsen)',3,'redox','Cu + HNO3 > Cu(NO3)2 + NO2 + H2O',[1,4,1,2,2]],
 ['kmno4','Permanganate and hydrochloric acid',3,'redox','KMnO4 + HCl > KCl + MnCl2 + Cl2 + H2O',[2,16,2,2,5,8]],
 ['airbag','Car airbag',3,'decomposition','NaN3 > Na + N2',[2,2,3]],
 ['alh2so4','Aluminum in sulfuric acid',3,'single replacement','Al + H2SO4 > Al2(SO4)3 + H2',[2,3,1,3]],
 ['pyrite','Roasting pyrite',3,'redox','FeS2 + O2 > Fe2O3 + SO2',[4,11,2,8]],
 ['thermite','Thermite',3,'single replacement','Al + Fe2O3 > Al2O3 + Fe',[2,1,1,2]]
];
// Redox in acidic solution: [id, name, skeleton, coefficients, oxidation half, reduction half, oxidation-number note]
const RX_RAW=[
 ['cuag','Copper in silver ions','Cu + Ag^+ > Cu^2+ + Ag',[1,2,1,2],'Cu > Cu^2+ + 2e','Ag^+ + e > Ag','Cu: 0 → +2 (oxidized) · Ag: +1 → 0 (reduced)'],
 ['mnfe','Permanganate and iron(II)','MnO4^- + Fe^2+ + H^+ > Mn^2+ + Fe^3+ + H2O',[1,5,8,1,5,4],'Fe^2+ > Fe^3+ + e','MnO4^- + 8H^+ + 5e > Mn^2+ + 4H2O','Mn: +7 → +2 (reduced) · Fe: +2 → +3 (oxidized)'],
 ['mnh2o2','Permanganate and hydrogen peroxide','MnO4^- + H2O2 + H^+ > Mn^2+ + O2 + H2O',[2,5,6,2,5,8],'H2O2 > O2 + 2H^+ + 2e','MnO4^- + 8H^+ + 5e > Mn^2+ + 4H2O','Mn: +7 → +2 (reduced) · O: −1 → 0 (oxidized)'],
 ['crfe','Dichromate and iron(II)','Cr2O7^2- + Fe^2+ + H^+ > Cr^3+ + Fe^3+ + H2O',[1,6,14,2,6,7],'Fe^2+ > Fe^3+ + e','Cr2O7^2- + 14H^+ + 6e > 2Cr^3+ + 7H2O','Cr: +6 → +3 (reduced) · Fe: +2 → +3 (oxidized)'],
 ['cuno3','Copper in dilute nitric acid','Cu + NO3^- + H^+ > Cu^2+ + NO + H2O',[3,2,8,3,2,4],'Cu > Cu^2+ + 2e','NO3^- + 4H^+ + 3e > NO + 2H2O','N: +5 → +2 (reduced) · Cu: 0 → +2 (oxidized)'],
 ['mnox','Permanganate and oxalate','MnO4^- + C2O4^2- + H^+ > Mn^2+ + CO2 + H2O',[2,5,16,2,10,8],'C2O4^2- > 2CO2 + 2e','MnO4^- + 8H^+ + 5e > Mn^2+ + 4H2O','Mn: +7 → +2 (reduced) · C: +3 → +4 (oxidized)'],
 ['cri','Dichromate and iodide','Cr2O7^2- + I^- + H^+ > Cr^3+ + I2 + H2O',[1,6,14,2,3,7],'2I^- > I2 + 2e','Cr2O7^2- + 14H^+ + 6e > 2Cr^3+ + 7H2O','Cr: +6 → +3 (reduced) · I: −1 → 0 (oxidized)'],
 ['znno3','Zinc and nitrate to ammonium','Zn + NO3^- + H^+ > Zn^2+ + NH4^+ + H2O',[4,1,10,4,1,3],'Zn > Zn^2+ + 2e','NO3^- + 10H^+ + 8e > NH4^+ + 3H2O','N: +5 → −3 (reduced) · Zn: 0 → +2 (oxidized)']
];
const BAD=[];
function buildEq(id,name,skel,ans){const [L,R]=skel.split(' > ');const r=side(L).map(x=>x.sp),p=side(R).map(x=>x.sp);return {id,name,skel,r,p,all:r.concat(p),ans};}
function verify(e){const t=tally(e.r,e.p,e.ans.slice(0,e.r.length),e.ans.slice(e.r.length));const ok=t.els.every(k=>t.R[k]===t.P[k])&&t.qR===t.qP&&e.ans.reduce(gcd)===1&&e.ans.length===e.all.length;
  if(!ok)BAD.push(e.id);return ok;}
function verifyHalf(str){const [L,R]=str.split(' > '),l=side(L),r=side(R);const t=tally(l.map(x=>x.sp),r.map(x=>x.sp),l.map(x=>x.c),r.map(x=>x.c));return {ok:t.els.every(k=>t.R[k]===t.P[k])&&t.qR===t.qP,l,r,e:l.concat(r).filter(x=>x.sp.e).reduce((a,x)=>a+x.c,0)};}
const LIB=[];LIB_RAW.forEach(a=>{const e=buildEq(a[0],a[1],a[4],a[5]);e.tier=a[2];e.type=a[3];if(verify(e))LIB.push(e);});
const RX=[];RX_RAW.forEach(a=>{const e=buildEq(a[0],a[1],a[2],a[3]);e.on=a[6];const ox=verifyHalf(a[4]),red=verifyHalf(a[5]);
  let ok=verify(e)&&ox.ok&&red.ok;
  if(ok){const L=ox.e*red.e/gcd(ox.e,red.e),mo=L/ox.e,mr=L/red.e,net={};
    const addH=(h,m)=>{h.l.forEach(x=>{if(!x.sp.e)net[x.sp.s]=(net[x.sp.s]||0)+x.c*m;});h.r.forEach(x=>{if(!x.sp.e)net[x.sp.s]=(net[x.sp.s]||0)-x.c*m;});};
    addH(ox,mo);addH(red,mr);ok=e.all.every((s,i)=>(i<e.r.length?1:-1)*e.ans[i]===(net[s.s]||0))&&Object.keys(net).every(k=>net[k]===0||e.all.some(s=>s.s===k));
    e.half={ox,red,L,mo,mr};}
  if(!ok)BAD.push('redox:'+e.id);else RX.push(e);});
if(BAD.length)console.error('balance: equations failed the balance check and were removed: '+BAD.join(', '));
const LIBM={},RXM={};LIB.forEach(e=>LIBM[e.id]=e);RX.forEach(e=>RXM[e.id]=e);
const NSLOT=6;
const LAY=sim=>sim.vis.lay||{BY:176,BH:186};
const fEq=sim=>[8,30,784,LAY(sim).BY-34],fBoxes=sim=>{const l=LAY(sim);return [[8,l.BY,384,l.BH],[408,l.BY,384,l.BH]];},fScales=()=>[8,376,784,136],
  fRightScales=sim=>{const l=LAY(sim);return [[408,l.BY,384,l.BH],[8,376,784,136]];};

/* ---------- state helpers ---------- */
function cur(sim){const p=sim.p;if(p.mode==='redox')return RXM[p.req]||RX[0];return LIBM[p.eq]||LIB[0];}
function coefs(sim,e){e=e||cur(sim);return e.all.map((_,i)=>Math.max(1,Math.round(sim.p['c'+i]||1)));}
function evC(e,c){const nr=e.r.length,t=tally(e.r,e.p,c.slice(0,nr),c.slice(nr));
  const bad=t.els.filter(k=>t.R[k]!==t.P[k]),qok=t.qR===t.qP,atoms=!bad.length,bal=atoms&&qok,g=c.reduce(gcd),lowest=g===1;
  let aR=0,aP=0,mR=0,mP=0;e.r.forEach((s,i)=>{aR+=c[i]*s.n;mR+=c[i]*s.M;});e.p.forEach((s,i)=>{aP+=c[nr+i]*s.n;mP+=c[nr+i]*s.M;});
  return {e,c,nr,t,bad,qok,atoms,bal,lowest,g,aR,aP,mR,mP,correct:bal&&lowest};}
function ev(sim){const e=cur(sim);return evC(e,coefs(sim,e));}
/* Balance race: the atom counts stay hidden while the student is setting coefficients, so the scales cannot be used to
   fiddle until everything turns green. They appear when Check is pressed, and stay up after a miss until a coefficient changes. */
const same=(a,b)=>!!a&&!!b&&a.length===b.length&&a.every((x,i)=>x===b[i]);
function hidden(sim){const G=sim.game,r=sim.gameRound;if(!G||!r||G.state==='over'||G.state==='hit'||G.state==='flying')return false;
  return !(G.state==='miss'&&same(coefs(sim),r.checked));}
function setCoefs(sim,arr){const v={};for(let i=0;i<NSLOT;i++)v['c'+i]=arr[i]||1;BioLab.setValues(sim,v);}
const qs=q=>q===0?'0':(q>0?'+':'−')+Math.abs(q);
function hint(r){const e=r.e,t=r.t;if(!r.bad.length)return '';
  const inOne=k=>e.r.filter(s=>s.counts[k]).length===1&&e.p.filter(s=>s.counts[k]).length===1;
  const order=r.bad.slice().sort((a,b)=>{const sc=k=>(k==='O'?3:k==='H'?2:0)+(inOne(k)?0:1);return sc(a)-sc(b);});const k=order[0];
  return {k,txt:'<b>'+k+'</b> is '+t.R[k]+' on the left and '+t.P[k]+' on the right'};}
function statusText(r,sim){if(hidden(sim))return 'Press Check';if(r.bal&&!r.lowest)return 'Balanced, not lowest terms';if(r.bal)return 'Balanced';if(r.atoms&&!r.qok)return 'Charge not balanced';return 'Not balanced';}

/* ---------- show only what the current mode uses ---------- */
function syncMode(sim){if((!atLeast('ap')&&sim.p.mode==='redox')||!MODES.some(m=>m.v===sim.p.mode))BioLab.setValues(sim,{mode:'explore'});
  if(!sim.ui||!sim.ui.sec)return;const mode=sim.p.mode,d=sim.def,e=cur(sim),inGame=!!sim.game;
  d.controls.forEach(c=>{const cid=d.id+'-'+c.id,el=document.getElementById(cid)||document.getElementById(cid+'-l');if(!el)return;const w=el.closest('.ctl');if(!w)return;
    // during the Balance race only the coefficient sliders of the round's equation show
    let show=atLeast(c.lvl)&&(!c.modes||c.modes.includes(mode))&&(!inGame||c.slot!==undefined);
    if(c.slot!==undefined){show=show&&c.slot<e.all.length;const lab=w.querySelector('label');if(lab)lab.textContent=c.slot<e.all.length?'Coefficient of '+e.all[c.slot].txt:'Coefficient '+(c.slot+1);}
    w.hidden=!show;});
  d.metrics.forEach(m=>{if(!m.modes)return;const t=sim.ui.tiles[m.id];if(!t)return;const w=t.num.closest('.tile');if(w)w.hidden=!atLeast(m.lvl)||!m.modes.includes(mode);});
  const btns=[...sim.ui.sec.querySelectorAll('.actions button')];
  d.actions.forEach(a=>{const b=btns.find(x=>x.textContent===a.label);if(b)b.hidden=inGame||!atLeast(a.lvl)||!a.modes.includes(mode);});
  sim.vis.syncKey=mode+'|'+e.id;sim.infoDirty=true;}
function eqChanged(sim){setCoefs(sim,[]);syncMode(sim);}

/* ---------- molecule drawing ---------- */
const GEOM={H2:[['H',-0.55,0],['H',0.55,0]],H2O:[['O',0,-0.15],['H',-0.95,0.55],['H',0.95,0.55]],CO2:[['O',-1.6,0],['C',0,0],['O',1.6,0]],
  NH3:[['N',0,0],['H',-1.05,0.55],['H',1.05,0.55],['H',0,-1.15]],CH4:[['C',0,0],['H',-1.05,-0.75],['H',1.05,-0.75],['H',-1.05,0.75],['H',1.05,0.75]],
  H2O2:[['O',-0.8,0],['O',0.8,0],['H',-1.55,0.75],['H',1.55,-0.75]],NO2:[['N',0,0.25],['O',-1.35,-0.45],['O',1.35,-0.45]],SO2:[['S',0,0.25],['O',-1.45,-0.45],['O',1.45,-0.45]],
  HCl:[['H',-0.75,0],['Cl',0.45,0]],NaOH:[['Na',-1.2,0],['O',0.35,0],['H',1.3,0]]};
const HEX=(()=>{const a=[];for(let q=-4;q<=4;q++)for(let r=-4;r<=4;r++){const x=q+r/2,y=r*Math.sqrt(3)/2;a.push([x,y,Math.hypot(x,y),Math.atan2(y,x)]);}a.sort((p,q)=>p[2]-q[2]||p[3]-q[3]);return a;})();
const RAD=el=>el==='H'?0.62:1;
const GCACHE={};
function geom(s){if(GCACHE[s.s])return GCACHE[s.s];let g;
  if(GEOM[s.f])g=GEOM[s.f].map(a=>({el:a[0],x:a[1],y:a[2],r:RAD(a[0])}));
  else{const els=Object.keys(s.counts),heavy=[],hs=[];els.forEach(k=>{for(let i=0;i<s.counts[k];i++)(k==='H'?hs:heavy).push(k);});
    if(heavy.length+hs.length===2){const a=heavy.concat(hs);const r0=RAD(a[0]),r1=RAD(a[1]),d=(r0+r1)*0.8;g=[{el:a[0],x:-d/2,y:0,r:r0},{el:a[1],x:d/2,y:0,r:r1}];}
    else{g=[];let i=0;heavy.forEach(k=>{const h=HEX[i++];g.push({el:k,x:h[0]*1.62,y:h[1]*1.62,r:1});});hs.forEach(k=>{const h=HEX[i++];g.push({el:k,x:h[0]*1.62,y:h[1]*1.62,r:RAD(k)});});}}
  let R=0;g.forEach(a=>R=Math.max(R,Math.hypot(a.x,a.y)+a.r));g.R=R;g.sort((a,b)=>a.r-b.r);return GCACHE[s.s]=g;}
function drawMol(ctx,s,x,y,r){if(s.e)return;const g=geom(s);g.forEach(a=>CL.drawAtom(ctx,x+a.x*r,y+a.y*r,a.r*r,a.el,{label:a.r*r>=8?a.el:''}));
  if(s.q){const R=g.R*r;txt(ctx,(Math.abs(s.q)>1?Math.abs(s.q):'')+(s.q>0?'+':'−'),x+R*0.8,y-R*0.75,{s:Math.max(10,r*1.2),w:800,c:PAL['cv-ink'],a:'left',b:'middle'});}}
/* place the molecules of one side inside a box; returns nothing (draws) */
function drawSide(ctx,list,cs,box,k,t,budget){const n=list.length,gap=6,wEach=(box.w-gap*(n-1))/n;let atoms=0;list.forEach((s,i)=>atoms+=cs[i]*s.n);
  const lim=atoms>budget?budget/atoms:1;
  list.forEach((s,i)=>{if(s.e)return;const rx=box.x+i*(wEach+gap),ry=box.y,rw=wEach,rh=box.h-16*k;const want=cs[i];let show=Math.max(1,Math.min(want,Math.floor(want*lim)));
    const g=geom(s);let r=Math.min(24,rh/(2*g.R+0.6)),cell=0,cols=1,rows=1;
    for(let it=0;it<40;it++){cell=2*g.R*r+5;cols=Math.max(1,Math.floor(rw/cell));rows=Math.ceil(show/cols);if(rows*cell<=rh&&cell<=rw)break;if(r>4.2)r*=0.92;else{show=Math.max(1,cols*Math.max(1,Math.floor(rh/cell)));rows=Math.ceil(show/cols);break;}}
    const usedC=Math.min(cols,show),ox=rx+(rw-usedC*cell)/2+cell/2,oy=ry+(rh-rows*cell)/2+cell/2;
    for(let j=0;j<show;j++){const cx=ox+(j%cols)*cell,cy=oy+Math.floor(j/cols)*cell+(RM?0:Math.sin(t*1.4+j*1.7+i)*1.2);drawMol(ctx,s,cx,cy,r);}
    if(i>0){ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.setLineDash([3,4]);ctx.beginPath();ctx.moveTo(rx-gap/2,box.y);ctx.lineTo(rx-gap/2,box.y+box.h);ctx.stroke();ctx.setLineDash([]);}
    const lab=(show<want?show+' of ':'')+want+' '+s.txt;txt(ctx,lab,rx+rw/2,box.y+box.h-2,{s:12*k,c:PAL['cv-soft'],a:'center'});});}


/* ---------- Balance race (the engine's Challenge game) ----------
   Six equations per game, easy to hard: synthesis, decomposition, a harder synthesis, combustion, a double replacement
   with a polyatomic ion, then a hard finish. Each round draws one equation from its pool, so every game differs.
   Every library equation is verified at load, and every coefficient is 1–25, so every round is winnable on the sliders. */
const RACE={
  bio:   [['water','ammonia','salt','mgo','hcl'],['peroxide','hgo','kclo3'],['al2o3','fecl3','rust'],['methane','propane'],['pbi2','caoh','h2so4','baso4'],['ethanol','alcu','smelt','nawater']],
  honors:[['al2o3','fecl3','p4o10','rust'],['kclo3','airbag','hgo'],['propane','ethanol','resp'],['pbi2','baso4','h2so4','caoh'],['ethane','butane','octane'],['fekoh','alh2so4']],
  ap:    [['rust','p4o10','al2o3','fecl3'],['kclo3','airbag'],['ethane','butane','resp'],['fekoh'],['octane','pyrite','ostwald','alh2so4'],['kmno4','remsen','phos']]};
const CTX={water:'A hydrogen fuel cell joins hydrogen and oxygen into water, the only thing that comes out of its tailpipe.',
  ammonia:'Factories make ammonia for fertilizer from nitrogen in the air and hydrogen gas.',salt:'Sodium metal burns in chlorine gas and leaves table salt.',
  mgo:'A magnesium strip burns with a blinding white flame and leaves a white powder, magnesium oxide.',hcl:'Hydrogen and chlorine gases combine to make hydrogen chloride.',
  peroxide:'The fizz when you pour hydrogen peroxide on a cut is oxygen gas escaping as the peroxide breaks down.',
  hgo:'Joseph Priestley first collected oxygen in 1774 by heating red mercury(II) oxide.',kclo3:'Heating potassium chlorate is the classic way to make oxygen gas in a school lab.',
  airbag:'A car airbag fills in about 30 ms with nitrogen gas from sodium azide.',al2o3:'Aluminum foil stays shiny because a thin skin of aluminum oxide forms on it.',
  fecl3:'Hot iron wool glows in chlorine gas and turns into iron(III) chloride.',rust:'A steel bridge rusts as its iron reacts with oxygen to form iron(III) oxide.',
  p4o10:'Burning white phosphorus makes thick white smoke of P₄O₁₀.',methane:'A gas stove burns natural gas, which is mostly methane.',
  propane:'A gas grill burns propane with oxygen from the air.',ethanol:'E10 gasoline is 10% ethanol, which burns in the engine along with the gasoline.',
  resp:'Your cells burn glucose for energy, and you breathe out the CO₂.',ethane:'Ethane, the second-biggest part of natural gas, burns in a furnace.',
  butane:'A pocket lighter burns butane.',octane:'A car engine burns octane, a main part of gasoline.',
  pbi2:'Mix two clear solutions and a bright yellow solid, lead(II) iodide, appears.',caoh:'Calcium hydroxide (slaked lime) neutralizes hydrochloric acid.',
  h2so4:'Sodium hydroxide neutralizes a sulfuric acid spill.',baso4:'This reaction makes barium sulfate, the white solid patients drink before a stomach X-ray.',
  fekoh:'Potassium hydroxide added to iron(III) sulfate solution makes a rust-brown solid, iron(III) hydroxide.',
  alh2so4:'Aluminum dissolves in sulfuric acid and gives off hydrogen gas.',alcu:'Aluminum foil in blue copper(II) chloride solution pulls out red-brown copper metal.',
  nawater:'A chunk of sodium fizzes across water, making sodium hydroxide and hydrogen gas.',smelt:'A blast furnace turns iron ore into iron metal with carbon from coke.',pyrite:'Roasting pyrite (fool’s gold) makes the SO₂ that factories turn into sulfuric acid.',
  ostwald:'The first step in making nitric acid for fertilizer burns ammonia over a platinum gauze.',
  kmno4:'Potassium permanganate and hydrochloric acid make chlorine gas in the lab.',remsen:'A copper penny in concentrated nitric acid gives off choking brown NO₂ gas.',
  phos:'Phosphorus is made in an electric furnace from phosphate rock, sand and coke.'};
const POLY={pbi2:'NO₃',caoh:'OH',h2so4:'SO₄',baso4:'SO₄',fekoh:'SO₄ and OH',alh2so4:'SO₄'};
const eqHtml=(e,c)=>e.r.map((s,i)=>(c&&c[i]>1?c[i]:'')+s.html).join(' + ')+' → '+e.p.map((s,i)=>(c&&c[e.r.length+i]>1?c[e.r.length+i]:'')+s.html).join(' + ');
function raceHint(e,i,lv){const t=e.type;
  if(lv==='bio'){if(POLY[e.id])return 'Hint: '+POLY[e.id]+' stays together on both sides, so count it as one unit.';
    if(t==='combustion')return 'Hint: balance C first, then H, then O last.';
    if(t==='decomposition')return 'Hint: count each element on both sides in the particle view. Fix one, then recount the others.';
    if(t==='single replacement')return 'Hint: balance an element that is in only one substance on each side first. Leave H and O for last.';
    const els=Object.keys(e.r.reduce((o,x)=>Object.assign(o,x.counts),{})),gas=['O','Cl','H'].find(k=>els.includes(k)),rest=els.filter(k=>k!==gas);
    return gas&&rest.length?'Hint: balance '+rest.join(' and ')+' first, then '+gas+' last.':'Hint: count each element on both sides in the particle view. Fix one, then recount the others.';}
  if(lv==='honors'&&(POLY[e.id]||(t==='combustion'&&i>=4)))return POLY[e.id]?'Treat '+POLY[e.id]+' as one unit.':'If O₂ needs a half, double every coefficient.';
  return '';}
/* why a check failed: lowest terms, or which element is off, by how much, and which way to adjust */
function raceMiss(r){const e=r.e,t=r.t;
  if(r.bal&&!r.lowest)return 'Balanced, but not in lowest terms: every coefficient divides by '+r.g+'. Divide them all by '+r.g+'.';
  const h=hint(r),k=h.k,L=t.R[k],R=t.P[k],d=Math.abs(L-R),lowL=L<R,nr=r.nr;
  const with_=(left,big)=>(left?e.r:e.p).map((s,i)=>({s,c:r.c[left?i:nr+i]})).filter(x=>x.s.counts[k]&&(!big||x.c>1)).map(x=>x.s.html).join(' or ');
  const up=with_(lowL,false),down=with_(!lowL,true);
  let m='<b>'+k+'</b> is off by '+d+': '+L+' on the left, '+R+' on the right. Raise the coefficient of '+up+' on the '+(lowL?'left':'right')+(down?', or lower '+down+' on the '+(lowL?'right':'left'):'')+'.';
  const rest=r.bad.filter(x=>x!==k).map(x=>x+' ('+t.R[x]+' left, '+t.P[x]+' right)');
  if(rest.length)m+=' Also off: '+rest.join(', ')+'.';return m;}
const GAME={label:'Balance race',title:'Balance race',rounds:6,fireLabel:'Check',par:300,metrics:[],
  intro:{bio:'Six equations, easy to hard. Set each coefficient with its slider or the arrows on the stage, then press Check. The atom scales stay hidden until you check, so count atoms in the particle view. You need the smallest whole numbers. A first-try balance scores 3 points; finish in under 5:00 for the par badge.',
         honors:'Six equations, from synthesis to a polyatomic double replacement and long combustions. Find the smallest whole-number coefficients, then press Check; the scales stay hidden until you do. First-try balances score 3, and under 5:00 earns the par badge.',
         ap:'Six equations, ending with redox reactions that take real bookkeeping. Find the lowest whole-number coefficients and press Check; the scales stay hidden until you do. First-try balances score 3, and under 5:00 earns the par badge.'},
  newRound(sim,i){const lv=BioLab.level==='ap'?'ap':BioLab.level==='honors'?'honors':'bio',pool=RACE[lv][i].filter(id=>LIBM[id]);
    const id=pool[Math.floor(Math.random()*pool.length)],e=LIBM[id];
    BioLab.setValues(sim,{mode:'explore',eq:id});setCoefs(sim,[]);sim.vis.th={};
    const h=raceHint(e,i,lv),tp=e.type.charAt(0).toUpperCase()+e.type.slice(1);
    return {id,controls:e.all.map((_,k)=>'c'+k),metrics:[],checked:null,
      prompt:`<b>Round ${i+1}: ${tp}.</b> ${CTX[id]||e.name+'.'}<br>Balance <b>${eqHtml(e)}</b> with the smallest whole-number coefficients.`+(h?` <span class="gm-hint">${h}</span>`:'')};},
  fire(sim,r){r.checked=coefs(sim,LIBM[r.id]);r.t0=performance.now();sim.infoDirty=true;},
  retry(sim,r){r.checked=null;},
  // give the scales about half a second to tip into place before the verdict
  poll(sim,r){if(performance.now()-r.t0<600)return null;const e=LIBM[r.id],c=r.checked,res=evC(e,c);sim.infoDirty=true;
    if(res.correct)return {ok:true,msg:'Balanced! '+eqHtml(e,c)+' has the same atoms of every element on both sides.'};
    return {ok:false,msg:raceMiss(res)};},
  solve(sim,r){setCoefs(sim,LIBM[r.id].ans);}};

/* ---------- the definition ---------- */
const MODES=[{v:'explore',l:'Explore'},{v:'redox',l:'Redox in acid',lvl:'ap'}];
const ctlC=[];for(let i=0;i<NSLOT;i++)ctlC.push({id:'c'+i,slot:i,label:'Coefficient '+(i+1),type:'range',min:1,max:25,step:1,def:1,lvl:'bio',
  help:i===0?'Coefficients count whole molecules (or formula units). You can also click the arrows above and below each number on the stage.':undefined});
const BAL={
  id:'balance',hash:'balance',apUnit:7,order:1,tab:'Balancing equations',kind:'Learning tool',next:['rxntypes','stoich'],prereq:[],
  card:'Change coefficients and watch molecules appear, atom counts tip the scales, and the equation balance. Then race the clock in the Balance race.',
  title:'Balancing chemical equations',
  lede:{bio:'Atoms are never created or destroyed in a reaction. Change the coefficients until every element has the same number of atoms on both sides.',
        honors:'Balance each equation with the smallest whole-number coefficients, and check that the mass of the reactants equals the mass of the products.',
        ap:'Balance redox reactions in acidic solution: split them into half-reactions, balance atoms with H₂O and H⁺, then balance charge with electrons.'},
  scale:'Particle view: each ball is one atom, drawn about 50 million times larger than life. The numbers are the same whether you read them as molecules or as moles of molecules.',
  aspect:ASP,timeless:true,animated:true,chChange:1.2,chReveal:3.4,
  controls:[
    {id:'mode',label:'Mode',type:'seg',def:'explore',lvl:'bio',options:MODES,onChange(sim){syncMode(sim);}},
    {id:'eq',label:'Equation',type:'select',def:'water',lvl:'bio',modes:['explore'],options:LIB.map(e=>({v:e.id,l:e.name+': '+e.r.map(s=>s.txt).join(' + ')+' → '+e.p.map(s=>s.txt).join(' + '),lvl:e.tier===3?'honors':undefined})),onChange:eqChanged},
    {id:'req',label:'Redox equation (acidic solution)',type:'select',def:'cuag',lvl:'ap',noTrial:true,modes:['redox'],options:RX.map(e=>({v:e.id,l:e.name+': '+e.r.map(s=>s.txt).join(' + ')+' → '+e.p.map(s=>s.txt).join(' + ')})),onChange:eqChanged},
    ...ctlC,
    {id:'half',label:'Show the half-reactions',type:'toggle',def:false,lvl:'ap',noTrial:true,modes:['redox'],help:'Splits the reaction into oxidation and reduction, then adds them so the electrons cancel.'}
  ],
  actions:[
    {id:'random',label:'Random equation',lvl:'bio',modes:['explore'],run(sim){const pool=LIB.filter(e=>atLeast(e.tier===3?'honors':'bio')&&e.id!==sim.p.eq);BioLab.setValues(sim,{eq:pool[Math.floor(Math.random()*pool.length)].id});}},
    {id:'ones',label:'Reset coefficients to 1',lvl:'bio',modes:['explore','redox'],run(sim){setCoefs(sim,[]);}},
    {id:'answer',label:'Show the answer',lvl:'bio',modes:['explore','redox'],run(sim){setCoefs(sim,cur(sim).ans);}}
  ],
  game:GAME,
  init(sim){return {};},
  step(sim,dt){},
  metrics:[
    {id:'status',label:'The equation is',unit:'',lvl:'bio',text:true,get:s=>statusText(ev(s),s)},
    {id:'nbad',label:'Elements not balanced',unit:'',lvl:'bio',min:0,max:6,d:0,get:s=>hidden(s)?NaN:ev(s).bad.length},
    {id:'aR',label:'Atoms on the left',unit:'atoms',lvl:'bio',min:0,max:null,d:0,get:s=>ev(s).aR},
    {id:'aP',label:'Atoms on the right',unit:'atoms',lvl:'bio',min:0,max:null,d:0,get:s=>ev(s).aP},
    {id:'mR',label:'Mass of reactants',unit:'g',lvl:'honors',min:0,max:null,d:2,get:s=>ev(s).mR},
    {id:'mP',label:'Mass of products',unit:'g',lvl:'honors',min:0,max:null,d:2,get:s=>ev(s).mP},
    {id:'chg',label:'Charge: left | right',unit:'',lvl:'ap',text:true,modes:['redox'],get:s=>{const r=ev(s);return qs(r.t.qR)+' | '+qs(r.t.qP);}}
  ],
  graphs:[{id:'inv',label:'Atom inventory',lvl:'bio',custom:true},{id:'mass',label:'Mass of reactants vs products',lvl:'honors',custom:true}],
  defaultGraph:'inv',
  plot(sim,ctx,box,id){const r=ev(sim);
    if(hidden(sim)){txt(ctx,'Press Check to see the atom counts.',box.cw/2,box.ch/2,{s:15,c:PAL.muted,a:'center',b:'middle'});return;}
    if(id==='inv'){const cats=r.t.els.slice();const vals=cats.map(k=>[r.t.R[k],r.t.P[k]]);if(sim.p.mode==='redox'){cats.push('charge');vals.push([r.t.qR,r.t.qP]);}
      const all=[].concat(...vals),ymax=Math.max(4,...all)*1.3,ymin=Math.min(0,...all)*1.18;
      const ax=axes(ctx,box,{xmin:0,xmax:cats.length,ymin,ymax,xcats:cats.map((c,i)=>c+(vals[i][0]===vals[i][1]?'  ✓':'  ✗')),yl:'number of atoms'});const w=0.34;
      vals.forEach((v,i)=>{[0,1].forEach(j=>{const x0=ax.X(i+0.5+(j?0.02:-w)),x1=ax.X(i+0.5+(j?w:-0.02));const y0=ax.Y(0),y1=ax.Y(v[j]);ctx.fillStyle=j?serColor(3):serColor(1);ctx.fillRect(x0,Math.min(y0,y1),x1-x0,Math.abs(y1-y0));
        txt(ctx,String(v[j]),(x0+x1)/2,Math.min(y0,y1)-5,{s:12,c:PAL.fg,a:'center',w:700});});});
      legend(ctx,box.L+10,box.T+8,[{label:'reactants (left)',color:serColor(1)},{label:'products (right)',color:serColor(3)}]);}
    else{const ymax=Math.max(r.mR,r.mP,1)*1.2;const ax=axes(ctx,box,{xmin:0,xmax:2,ymin:0,ymax,xcats:['Reactants','Products'],yl:'mass (g per mole of reaction)'});
      [r.mR,r.mP].forEach((m,i)=>{const x0=ax.X(i+0.2),x1=ax.X(i+0.8);ctx.fillStyle=i?serColor(3):serColor(1);ctx.fillRect(x0,ax.Y(m),x1-x0,ax.Y(0)-ax.Y(m));txt(ctx,m.toFixed(2)+' g',(x0+x1)/2,ax.Y(m)-6,{s:13,w:700,c:PAL.fg,a:'center'});});
      txt(ctx,Math.abs(r.mR-r.mP)<1e-6?'Equal: mass is conserved':'Difference: '+Math.abs(r.mR-r.mP).toFixed(2)+' g',box.L+box.W/2,box.T+14,{s:13,w:700,c:Math.abs(r.mR-r.mP)<1e-6?PAL.s3:PAL.s1,a:'center'});}},
  infoPanel(sim){const r=ev(sim),e=r.e,hon=atLeast('honors'),ap=atLeast('ap'),hid=hidden(sim),mode=sim.p.mode;let h='';
    h+=`<h3>${e.name}</h3>`;
    if(hid)h+='<p class="help">The atom counts appear when you press Check. Until then, count the atoms in the particle view yourself.</p>';
    const coefTxt=(c,s)=>(c>1?c:'')+s.html;
    h+=`<p style="font-size:1.05em">${e.r.map((s,i)=>coefTxt(r.c[i],s)).join(' + ')} → ${e.p.map((s,i)=>coefTxt(r.c[r.nr+i],s)).join(' + ')}</p>`;
    if(!hid){const cell=(list,off,k)=>{if(!hon)return '';const parts=[];list.forEach((s,i)=>{if(s.counts[k])parts.push(r.c[off+i]+'×'+s.counts[k]);});return parts.length===1&&parts[0]==='1×1'?'':parts.join(' + ')+' = ';};
      h+='<div class="tbl-wrap"><table><thead><tr><th>Element</th><th>Left</th><th>Right</th><th></th></tr></thead><tbody>'+r.t.els.map(k=>`<tr><td>${k}</td><td>${cell(e.r,0,k)}${r.t.R[k]}</td><td>${cell(e.p,r.nr,k)}${r.t.P[k]}</td><td>${r.t.R[k]===r.t.P[k]?'✓':'✗'}</td></tr>`).join('')+
        (mode==='redox'?`<tr><td>charge</td><td>${qs(r.t.qR)}</td><td>${qs(r.t.qP)}</td><td>${r.qok?'✓':'✗'}</td></tr>`:'')+'</tbody></table></div>';
      if(hon)h+=`<p class="help">Mass: ${r.mR.toFixed(2)} g of reactants and ${r.mP.toFixed(2)} g of products per mole of reaction as written (coefficient × molar mass, summed).</p>`;}
    if(mode==='redox'&&ap){h+=`<p><b>Oxidation numbers:</b> ${e.on}</p>`;
      if(sim.p.half){const hs=e.half,fm=(hh,m)=>hh.l.map(x=>(x.c*m>1?x.c*m:'')+x.sp.html).join(' + ')+' → '+hh.r.map(x=>(x.c*m>1?x.c*m:'')+x.sp.html).join(' + ');
        h+=`<p><b>Oxidation (loses e⁻):</b> ${fm(hs.ox,1)}${hs.mo>1?' &nbsp;×'+hs.mo:''}</p><p><b>Reduction (gains e⁻):</b> ${fm(hs.red,1)}${hs.mr>1?' &nbsp;×'+hs.mr:''}</p>
          <p class="help">Multiply so electrons lost = electrons gained = ${hs.L}. Add the two halves, cancel the electrons and anything that appears on both sides (H⁺, H₂O).</p>`;}
      else h+='<p class="help">Turn on “Show the half-reactions” to see how the electrons are matched.</p>';}
    else if(!hon)h+='<p class="help"><b>Strategy:</b> balance an element that appears in only one substance on each side first. Save H and O for last. Never change a subscript: that changes the substance.</p>';
    else h+='<p class="help"><b>Strategy:</b> treat a polyatomic ion that stays together (like NO₃⁻ or SO₄²⁻) as one unit. In combustion, balance C, then H, then O last. If you need a half, double everything.</p>';
    return h;},
  narrate(sim){const r=ev(sim),mode=sim.p.mode,hon=atLeast('honors');
    if(hidden(sim))return 'Count the atoms of each element in the particle view, set the coefficients, then press <b>Check</b>. The scales stay hidden until you check.';
    if(r.bal&&!r.lowest)return '<b>Balanced, but not in lowest terms.</b> Every coefficient divides by '+r.g+'. Divide them all by '+r.g+' to get the simplest whole numbers.';
    if(r.bal){const ex=r.t.els.slice(0,3).map(k=>r.t.R[k]+' '+k).join(', ');return '<b>Balanced.</b> Each side has '+ex+(r.t.els.length>3?' and more':'')+'. The atoms only rearranged into new substances; none were created or destroyed'+(hon?', so the mass stays '+r.mR.toFixed(2)+' g on both sides.':'.');}
    if(r.atoms&&!r.qok)return '<b>The atoms balance, but the charge does not:</b> '+qs(r.t.qR)+' on the left and '+qs(r.t.qP)+' on the right. Electrons lost must equal electrons gained, so adjust the ions until the charges match.';
    const h=hint(r);return '<b>Not balanced yet:</b> '+h.txt+'. Change the coefficient in front of a substance that contains '+h.k+'. Never change a subscript.';},
  tour:[
    {title:'An equation is a recipe',text:'Reactants on the left turn into products on the right. Hydrogen gas and oxygen gas react to make water.',focus:fEq,pause:true,setup(sim){BioLab.setValues(sim,{mode:'explore',eq:'water'});setCoefs(sim,[]);}},
    {title:'Coefficients count molecules',text:'The big number in front of each formula is the coefficient. Right now each is 1, so the particle view shows one H₂, one O₂ and one H₂O.',focus:fBoxes,pause:true},
    {title:'Count every atom',text:'Each little scale weighs one element: atoms on the left pan, atoms on the right pan. Hydrogen is level (2 and 2). Oxygen tips: 2 on the left, only 1 on the right.',focus:fScales,pause:true},
    {title:'Fix oxygen',text:'Make 2 water molecules. Now oxygen balances (2 and 2), but hydrogen tips the other way: 2 on the left, 4 on the right.',focus:fRightScales,pause:true,setup(sim){setCoefs(sim,[1,1,2]);}},
    {title:'Fix hydrogen',text:'Use 2 hydrogen molecules. Every scale is level: 4 H and 2 O on each side. 2H₂ + O₂ → 2H₂O is balanced.',focus:[8,30,784,482],pause:true,setup(sim){setCoefs(sim,[2,1,2]);}},
    {title:'Never change a subscript',text:'Changing H₂O to H₂O₂ would also fix the oxygen count, but H₂O₂ is hydrogen peroxide, a different substance. Only coefficients may change.',focus:fEq,pause:true},
    {lvl:'honors',title:'Mass is conserved',text:'Burning propane, balanced: 1, 5, 3, 4. Both sides have the same atoms, so both sides have the same mass: compare the masses in the box headers and the readouts.',focus:fBoxes,pause:true,setup(sim){BioLab.setValues(sim,{eq:'propane'});setCoefs(sim,[1,5,3,4]);}},
    {lvl:'ap',title:'Charge must balance too',text:'Cu + Ag⁺ → Cu²⁺ + Ag has 1 Cu and 1 Ag on each side, but the charge is +1 on the left and +2 on the right. Copper loses 2 electrons, so it takes 2 Ag⁺ ions to accept them.',focus:fScales,pause:true,setup(sim){BioLab.setValues(sim,{mode:'redox',req:'cuag'});setCoefs(sim,[]);}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{mode:'explore',eq:'water'});setCoefs(sim,[]);},
  onChallenge(sim,ch,phase){if(ch&&ch.instant&&ch.set&&phase==='done'){BioLab.setValues(sim,ch.set);if(ch.setC)setCoefs(sim,ch.setC);syncMode(sim);}},
  challenges:[
    {lvl:'bio',q:'H₂ + O₂ → H₂O has every coefficient set to 1. You change the coefficient of H₂O to 2. What happens?',choices:['The equation is balanced','Oxygen balances, but hydrogen is now off: 2 on the left and 4 on the right','Nothing changes, because the coefficient only counts the water'],correct:1,
     baseline:{mode:'explore',eq:'water'},change:{c2:2},changeText:'Coefficient of H₂O changed to 2',watch:'inv',
     explain:{bio:'Two water molecules hold 2 O atoms, which matches O₂. They also hold 4 H atoms, and the left side still has only 2. Fixing one element can unbalance another, so recount after every change. Next step: 2H₂.'}},
    {lvl:'bio',instant:true,set:{mode:'explore',eq:'water'},setC:[2,1,2],q:'To balance H₂ + O₂ → H₂O, a classmate rewrites the product as H₂O₂. What is wrong with that?',choices:['Nothing. It balances the oxygen atoms','It changes the substance: H₂O₂ is hydrogen peroxide, not water','Subscripts may change, but only on the product side'],correct:1,
     explain:{bio:'A subscript is part of the formula, so changing it makes a different substance. The model now shows the correct fix: 2H₂ + O₂ → 2H₂O, which changes only the coefficients.'}},
    {lvl:'bio',q:'Heating limestone: CaCO₃ → CaO + CO₂. With every coefficient at 1, is the equation balanced?',choices:['Yes, it is already balanced','No, it needs a 2 in front of CaO','No, every equation needs at least one coefficient bigger than 1'],correct:0,
     baseline:{mode:'explore',eq:'caco3'},changeText:'Counting the atoms on each side',watch:'inv',
     explain:{bio:'1 Ca, 1 C and 3 O on each side: every scale is level. Some equations are balanced as written, and a coefficient of 1 is simply not written.'}},
    {lvl:'bio',instant:true,set:{mode:'explore',eq:'methane'},setC:[1,2,1,2],q:'CH₄ + 2O₂ → CO₂ + H₂O is not balanced yet. Which change finishes it?',choices:['Put a 2 in front of CO₂','Put a 2 in front of H₂O','Change H₂O to H₄O'],correct:1,
     explain:{bio:'CH₄ has 4 H atoms, so you need 2 H₂O on the right. Then O is 4 on each side (2 × O₂ and 2 + 2 on the right). The model now shows CH₄ + 2O₂ → CO₂ + 2H₂O with every scale level.'}},
    {lvl:'honors',instant:true,set:{mode:'explore',eq:'water'},setC:[1,1,3],q:'How many hydrogen atoms are in 3H₂O?',choices:['2','3','5','6'],correct:3,
     explain:{honors:'The coefficient multiplies everything in the formula: 3 × 2 = 6 H atoms (and 3 × 1 = 3 O atoms). The model now shows 3 water molecules, and the right-hand H scale reads 6.'}},
    {lvl:'honors',instant:true,set:{mode:'explore',eq:'propane'},setC:[1,5,3,4],q:'Balance C₃H₈ + O₂ → CO₂ + H₂O. What is the coefficient of O₂?',choices:['3','4','5','10'],correct:2,
     explain:{honors:'Balance C first (3CO₂), then H (4H₂O), then O last: 3×2 + 4×1 = 10 O atoms on the right, so 5 O₂. The model now shows C₃H₈ + 5O₂ → 3CO₂ + 4H₂O.'}},
    {lvl:'honors',q:'Propane is balanced: C₃H₈ + 5O₂ → 3CO₂ + 4H₂O. How does the mass of the reactants compare with the mass of the products?',choices:['The reactants are heavier, because gas is lost','The products are heavier, because there are more molecules','They are exactly equal'],correct:2,
     baseline:{mode:'explore',eq:'propane',c0:1,c1:5,c2:3,c3:4},changeText:'Weighing both sides',watch:'mass',
     explain:{honors:'Both sides have 3 C, 8 H and 10 O, so both weigh 204.20 g per mole of reaction. The number of molecules changes (6 → 7), but the atoms, and so the mass, are conserved.'}},
    {lvl:'ap',q:'Cu + Ag⁺ → Cu²⁺ + Ag with every coefficient at 1. The atoms balance. Is the equation balanced?',choices:['Yes, the atoms match','No: the charge is +1 on the left and +2 on the right','No: there is too much copper'],correct:1,
     baseline:{mode:'redox',req:'cuag'},changeText:'Checking atoms and charge',watch:'inv',
     explain:{ap:'An ionic equation must balance charge as well as atoms. Copper loses 2 electrons, and each Ag⁺ gains only 1, so the balanced equation is Cu + 2Ag⁺ → Cu²⁺ + 2Ag (charge +2 on both sides).'}},
    {lvl:'ap',instant:true,set:{mode:'redox',req:'mnfe',half:true},setC:[1,5,8,1,5,4],q:'In acid, MnO₄⁻ + Fe²⁺ → Mn²⁺ + Fe³⁺. How many Fe²⁺ ions react with each MnO₄⁻?',choices:['1','2','5','8'],correct:2,
     explain:{ap:'Mn goes from +7 to +2, gaining 5 e⁻. Each Fe²⁺ loses only 1 e⁻, so 5 Fe²⁺ are needed. The model now shows MnO₄⁻ + 5Fe²⁺ + 8H⁺ → Mn²⁺ + 5Fe³⁺ + 4H₂O, with charge +17 on both sides.'}},
    {lvl:'ap',instant:true,set:{mode:'explore',eq:'octane'},setC:[2,25,16,18],q:'Gasoline: 2C₈H₁₈ + 25O₂ → 16CO₂ + ? H₂O. What coefficient goes in front of H₂O?',choices:['9','16','18','36'],correct:2,
     explain:{ap:'2 × 18 = 36 H atoms need 18 H₂O. Check O: 16 × 2 + 18 = 50 = 25 × 2. With 1 C₈H₁₈ the O₂ coefficient would be 12.5, so everything doubles to reach whole numbers.'}}
  ],
  lab:{bio:'<p><b>Question:</b> How can you balance an equation without changing any substance?</p><ol><li>Choose “Making water”. Count the atoms of each element on each side and record a trial.</li><li>Change one coefficient at a time. After each change, record a trial and note which scales are level.</li><li>Repeat for “Burning methane” and “Aluminum and oxygen”.</li></ol><p>Explain why you may change coefficients but never subscripts.</p>',
       honors:'<p><b>Question:</b> Does balancing an equation conserve mass?</p><ol><li>For five equations, record a trial with every coefficient at 1, then record again when balanced.</li><li>Compare the mass of reactants and products in each trial.</li><li>Play the Balance race and record your score and time.</li></ol><p>Use your data to explain the law of conservation of mass in terms of atoms.</p>',
       ap:'<p><b>Question:</b> How do electrons decide the coefficients in a redox reaction?</p><ol><li>Choose “Permanganate and hydrogen peroxide” (the AP redox titration). Write each half-reaction yourself, then turn on the half-reactions to check.</li><li>Balance it and record a trial. Note the charge on each side.</li><li>Repeat for dichromate and iron(II).</li></ol><p><b>Claim–evidence–reasoning:</b> Explain why the mole ratio of MnO₄⁻ to H₂O₂ is 2 : 5, using electrons transferred as your evidence.</p>'},
  terms:[{t:'Reactants / products',d:'The substances you start with (left of the arrow) and the substances made (right of the arrow).'},{t:'Coefficient',d:'The number in front of a formula. It counts molecules or formula units. A coefficient of 1 is not written.'},{t:'Subscript',d:'The small number inside a formula, such as the 2 in H₂O. It is part of the substance and never changes when you balance.'},
    {t:'Balanced equation',d:'An equation with the same number of atoms of each element on both sides.'},{t:'Law of conservation of mass',d:'Matter is not created or destroyed in a chemical reaction, so atoms (and mass) are the same before and after.'},{t:'Diatomic elements',d:'H₂, N₂, O₂, F₂, Cl₂, Br₂ and I₂ exist as two-atom molecules.'},
    {lvl:'honors',t:'Lowest whole-number ratio',d:'The smallest whole-number coefficients that balance the equation. 4H₂ + 2O₂ → 4H₂O balances, but 2H₂ + O₂ → 2H₂O is the accepted form.'},{lvl:'honors',t:'Polyatomic ion as a unit',d:'If an ion such as NO₃⁻ appears unchanged on both sides, balance it as one unit.'},
    {lvl:'ap',t:'Oxidation / reduction',d:'Oxidation is loss of electrons (oxidation number goes up). Reduction is gain of electrons (oxidation number goes down).'},{lvl:'ap',t:'Half-reaction',d:'The oxidation or the reduction written alone, with electrons shown.'},{lvl:'ap',t:'Balancing in acid',d:'Balance atoms other than O and H, then O with H₂O, H with H⁺, and charge with e⁻. Multiply the halves so the electrons cancel.'}],
  about:'<p>The tool counts atoms with a formula parser, so every count, mass and charge on the page is computed, not typed in. Masses use standard atomic weights and are given per mole of reaction as written (the sum of coefficient × molar mass).</p>'+
    '<p>Every equation in the library ('+LIB.length+' molecular equations and '+RX.length+' redox equations in acid) is checked by code when the page loads: each element and the total charge must match on both sides, and the coefficients must be in lowest terms. For the redox equations, the code also adds the two half-reactions and checks that the electrons cancel to give exactly the listed equation.</p>'+
    '<p>Simplifications: molecules are drawn as compact clusters of CPK-colored atoms, not their true shapes or sizes. When a side would need more than about 200 atoms, the drawing shows only some of the molecules and says how many. Coefficients go up to 25. States of matter are left off so the counting stays clear; the reaction-types and precipitation tools add them. Redox balancing is shown in acidic solution only.</p>',
  initVis(sim){sim.vis.th={};sim.vis.hits=[];sim.vis.syncKey='';},
  onLevel(sim){syncMode(sim);},
  onClick(sim,x,y){const h=(sim.vis.hits||[]).find(b=>x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h);if(!h)return;const id='c'+h.i,v=clamp(Math.round(sim.p[id])+h.d,1,25);BioLab.setValues(sim,{[id]:v});},
  thumbSetup(sim){sim.p.eq='propane';sim.p.c0=1;sim.p.c1=5;sim.p.c2=3;sim.p.c3=2;},
  draw(sim,ctx,vdt,k,t){const r=ev(sim),e=r.e,v=sim.vis,hon=atLeast('honors'),hid=hidden(sim),mode=sim.p.mode;
    if(sim.ui&&sim.ui.sec&&v.syncKey!==mode+'|'+e.id)syncMode(sim);
    ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,LH);
    // header
    const head=sim.game&&sim.gameRound?e.name+' · '+e.type:e.name;
    txt(ctx,head,16,26,{s:14*k,w:700});
    // equation row with steppers
    const items=[];e.all.forEach((s,i)=>{if(i===r.nr)items.push({op:'→'});else if(i>0)items.push({op:'+'});items.push({i,s,c:r.c[i]});});
    let F=28*k;const meas=f=>{let w=0;items.forEach(it=>{if(it.op){ctx.font='600 '+f+'px '+FONT;w+=ctx.measureText(' '+it.op+' ').width;}else{ctx.font='800 '+f*1.08+'px '+FONT;const cw=Math.max(ctx.measureText(String(it.c)).width,f*0.62);ctx.font='600 '+f+'px '+FONT;it.cw=cw;it.fw=ctx.measureText(it.s.txt).width;w+=cw+f*0.18+it.fw;}});return w;};
    let W=meas(F);if(W>772){F*=772/W;W=meas(F);}
    const a0=clamp(F*0.3,7,13),EY=44+F*0.62+a0*1.4;let x=400-W/2;v.hits=[];
    items.forEach(it=>{if(it.op){ctx.font='600 '+F+'px '+FONT;const w=ctx.measureText(' '+it.op+' ').width;txt(ctx,it.op,x+w/2,EY,{s:F,w:600,a:'center',b:'middle',c:PAL['cv-soft']});x+=w;return;}
      const cx=x+it.cw/2,col=it.c===1?PAL['cv-soft']:PAL['s2'];
      txt(ctx,String(it.c),cx,EY,{s:F*1.08,w:800,a:'center',b:'middle',c:col});
      const a=clamp(F*0.3,7,13);ctx.fillStyle=PAL['s2'];
      ctx.beginPath();ctx.moveTo(cx,EY-F*0.62-a*1.4);ctx.lineTo(cx-a,EY-F*0.62);ctx.lineTo(cx+a,EY-F*0.62);ctx.closePath();ctx.globalAlpha=it.c>=25?0.3:1;ctx.fill();
      ctx.beginPath();ctx.moveTo(cx,EY+F*0.62+a*1.4);ctx.lineTo(cx-a,EY+F*0.62);ctx.lineTo(cx+a,EY+F*0.62);ctx.closePath();ctx.globalAlpha=it.c<=1?0.3:1;ctx.fill();ctx.globalAlpha=1;
      const hw=Math.max(a*1.6,it.cw/2+4);v.hits.push({x:cx-hw,y:EY-F*0.62-a*1.4-8,w:hw*2,h:a*1.4+10,i:it.i,d:1},{x:cx-hw,y:EY+F*0.62-2,w:hw*2,h:a*1.4+10,i:it.i,d:-1});
      x+=it.cw+F*0.18;txt(ctx,it.s.txt,x,EY,{s:F,w:600,b:'middle'});x+=it.fw;});
    // status pill
    let st,bg;if(hid){st='Press Check when you think it is balanced';bg='#5d5d63';}else if(r.bal&&!r.lowest){st='Balanced, but divide every coefficient by '+r.g;bg='#9a5b00';}
    else if(r.bal){st='Balanced ✓';bg='#1b7339';}else if(r.atoms&&!r.qok){st='Not balanced: charge is '+qs(r.t.qR)+' vs '+qs(r.t.qP);bg='#b3261e';}else{const h=hint(r);st='Not balanced: '+h.k+' is '+r.t.R[h.k]+' vs '+r.t.P[h.k];bg='#b3261e';}
    const PH=13*k*1.7,PY=EY+F*0.62+a0*1.4+PH/2+5;if(st)pill(ctx,st,400,PY,bg,'#fff',13*k);
    // particle boxes
    const BY=PY+PH/2+8,BH=372-BY;v.lay={EY,BY,BH};[[8,'Reactants',e.r,r.c.slice(0,r.nr),r.mR],[408,'Products',e.p,r.c.slice(r.nr),r.mP]].forEach(([bx,name,list,cs,m])=>{
      ctx.fillStyle=PAL['cv-bg2'];rr(ctx,bx,BY,384,BH,10);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1.5;ctx.stroke();
      txt(ctx,name,bx+12,BY+20*Math.min(k,1.3),{s:13*k,w:700,c:PAL['cv-soft']});
      if(hon&&!hid)txt(ctx,m.toFixed(2)+' g',bx+372,BY+20*Math.min(k,1.3),{s:13*k,w:700,c:PAL['cv-soft'],a:'right'});
      drawSide(ctx,list,cs,{x:bx+10,y:BY+20*Math.min(k,1.3)+8,w:364,h:BH-20*Math.min(k,1.3)-12},k,t,200);});
    ctx.fillStyle=PAL['cv-soft'];ctx.beginPath();ctx.moveTo(392,BY+BH/2-14);ctx.lineTo(407,BY+BH/2);ctx.lineTo(392,BY+BH/2+14);ctx.closePath();ctx.fill();
    // mini scales, one per element (plus charge in redox mode)
    const cats=r.t.els.map(kk=>({k:kk,L:r.t.R[kk],R:r.t.P[kk]}));if(mode==='redox')cats.push({k:'charge',L:r.t.qR,R:r.t.qP,q:true});
    const n=cats.length,cw=784/n,SY=448;
    cats.forEach((c,i)=>{const cx=8+cw*(i+0.5),Lb=Math.min(cw*0.78,150);const diff=c.q?(c.L-c.R):(c.L-c.R),den=c.q?Math.max(Math.abs(c.L),Math.abs(c.R),1):Math.max(c.L,c.R,1);
      const target=hid?0:clamp(diff/den,-1,1)*0.22;const cur0=v.th[c.k]===undefined?target:v.th[c.k];const th=RM?target:cur0+(target-cur0)*Math.min(1,(vdt||0.05)*6);v.th[c.k]=th;
      const ok=!hid&&c.L===c.R,col=hid?PAL['cv-soft']:ok?PAL['s3']:PAL['s1'];
      // fulcrum
      ctx.fillStyle=PAL['cv-soft'];ctx.beginPath();ctx.moveTo(cx,SY-28);ctx.lineTo(cx-13,SY+12);ctx.lineTo(cx+13,SY+12);ctx.closePath();ctx.fill();ctx.fillRect(cx-26,SY+12,52,4);
      const dx=Math.cos(th)*Lb/2,dy=Math.sin(th)*Lb/2,lx=cx-dx,ly=SY-28+dy,rx2=cx+dx,ry=SY-28-dy;
      ctx.strokeStyle=col;ctx.lineWidth=4;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(lx,ly);ctx.lineTo(rx2,ry);ctx.stroke();
      const pw=Math.min(62,cw*0.32),ph=14+12*k;[[lx,ly,c.L],[rx2,ry,c.R]].forEach(([px,py,val])=>{ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px-pw/2,py+16);ctx.moveTo(px,py);ctx.lineTo(px+pw/2,py+16);ctx.stroke();
        ctx.fillStyle=PAL['card'];rr(ctx,px-pw/2,py+16,pw,ph,6);ctx.fill();ctx.strokeStyle=col;ctx.lineWidth=1.5;ctx.stroke();
        txt(ctx,hid?'?':(c.q?qs(val):String(val)),px,py+16+ph/2+1,{s:14*k,w:800,a:'center',b:'middle',c:PAL['cv-ink']});});
      const LY=SY-44-5*k;if(c.q)txt(ctx,'charge',cx,LY,{s:12*k,w:700,a:'center',b:'middle',c:PAL['cv-soft']});
      else{CL.drawAtom(ctx,cx,LY,9.5*Math.min(k,1.3),c.k,{label:''});txt(ctx,c.k,cx+11*Math.min(k,1.3)+4,LY,{s:13*k,w:800,b:'middle'});}
      if(!hid)txt(ctx,ok?'✓':'✗',cx,SY+32+6*k,{s:13*k,w:800,a:'center',c:col});});
  }
};
BioLab.register(BAL);
})();
