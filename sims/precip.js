(function(){
'use strict';
const {clamp,lerp,rr,txt,pill,atLeast,PAL,FONT,RM,axes,legend,serColor,randn}=BioLab.h;
const CL=window.ChemLab;

/* ---------- ions and solutions ---------- */
const ION={Ag:{q:1,col:'#9aa7b4',r:12,name:'silver'},Na:{q:1,col:'#8e44ad',r:11,name:'sodium'},Pb:{q:2,col:'#3d4a55',r:14,name:'lead(II)'},K:{q:1,col:'#c2185b',r:13,name:'potassium'},
  Ba:{q:2,col:'#00897b',r:14,name:'barium'},Cu:{q:2,col:'#1976d2',r:11,name:'copper(II)'},Fe:{q:3,col:'#a1561c',r:11,name:'iron(III)'},Fe2:{s:'Fe',q:2,col:'#689f38',r:11,name:'iron(II)'},
  NO3:{q:-1,col:'#7d8a2e',r:14,name:'nitrate'},Cl:{q:-1,col:'#2e9d4a',r:13,name:'chloride'},I:{q:-1,col:'#6a1b9a',r:15,name:'iodide'},SO4:{q:-2,col:'#b8860b',r:15,name:'sulfate'},
  OH:{q:-1,col:'#e65100',r:12,name:'hydroxide'},CO3:{q:-2,col:'#455a64',r:14,name:'carbonate'}};
Object.keys(ION).forEach(k=>{const o=ION[k];o.k=k;o.r+=1;o.s=o.s||k;o.txt=CL.fmt(o.s,o.q);o.html=CL.html(o.s,o.q);});
const SOL={AgNO3:{f:'AgNO3',name:'silver nitrate',cat:'Ag',an:'NO3'},NaCl:{f:'NaCl',name:'sodium chloride',cat:'Na',an:'Cl'},
  PbNO3:{f:'Pb(NO3)2',name:'lead(II) nitrate',cat:'Pb',an:'NO3'},KI:{f:'KI',name:'potassium iodide',cat:'K',an:'I'},BaCl2:{f:'BaCl2',name:'barium chloride',cat:'Ba',an:'Cl'},
  Na2SO4:{f:'Na2SO4',name:'sodium sulfate',cat:'Na',an:'SO4'},CuSO4:{f:'CuSO4',name:'copper(II) sulfate',cat:'Cu',an:'SO4',col:'#5aa9e6'},NaOH:{f:'NaOH',name:'sodium hydroxide',cat:'Na',an:'OH'},
  Na2CO3:{f:'Na2CO3',name:'sodium carbonate',cat:'Na',an:'CO3'},FeCl3:{f:'FeCl3',name:'iron(III) chloride',cat:'Fe',an:'Cl',col:'#e3a33b'}};
const gcd=(a,b)=>b?gcd(b,a%b):a;
function units(cat,an){const a=ION[cat].q,b=-ION[an].q,g=gcd(a,b);return {nc:b/g,na:a/g};}
Object.keys(SOL).forEach(k=>{const s=SOL[k];s.k=k;const u=units(s.cat,s.an);s.nc=u.nc;s.na=u.na;s.txt=CL.fmt(s.f);s.html=CL.html(s.f);s.M=CL.molarMass(s.f);});
const saltF=(cat,an)=>CL.ionicFormula({f:ION[cat].s,q:ION[cat].q},{f:ION[an].s,q:ION[an].q});
/* Precipitates: lattice ratio x cations : y anions per formula unit of the solid, Ksp at 25 °C (for Q), real color. */
const PPT={'Ag|Cl':{f:'AgCl',x:1,y:1,Ksp:1.8e-10,col:'#f4f4f2',cn:'white'},'Ag|I':{f:'AgI',x:1,y:1,Ksp:8.5e-17,col:'#efe38c',cn:'pale yellow'},
  'Ag|SO4':{f:'Ag2SO4',x:2,y:1,Ksp:1.2e-5,col:'#f4f4f2',cn:'white',slight:true},'Ag|CO3':{f:'Ag2CO3',x:2,y:1,Ksp:8.5e-12,col:'#efe2a2',cn:'pale yellow'},
  'Ag|OH':{f:'Ag2O',x:2,y:2,kx:1,ky:1,Ksp:2.0e-8,col:'#6b4a2b',cn:'brown',special:'ag2o'},
  'Pb|Cl':{f:'PbCl2',x:1,y:2,Ksp:1.7e-5,col:'#f4f4f2',cn:'white',slight:true},'Pb|I':{f:'PbI2',x:1,y:2,Ksp:9.8e-9,col:'#f6c700',cn:'bright yellow'},
  'Pb|SO4':{f:'PbSO4',x:1,y:1,Ksp:2.5e-8,col:'#f4f4f2',cn:'white'},'Pb|OH':{f:'Pb(OH)2',x:1,y:2,Ksp:1.2e-15,col:'#f4f4f2',cn:'white'},'Pb|CO3':{f:'PbCO3',x:1,y:1,Ksp:7.4e-14,col:'#f4f4f2',cn:'white'},
  'Ba|SO4':{f:'BaSO4',x:1,y:1,Ksp:1.1e-10,col:'#f4f4f2',cn:'white'},'Ba|CO3':{f:'BaCO3',x:1,y:1,Ksp:2.6e-9,col:'#f4f4f2',cn:'white'},
  'Cu|OH':{f:'Cu(OH)2',x:1,y:2,Ksp:2.2e-20,col:'#5b9bd5',cn:'light blue'},'Cu|CO3':{f:'CuCO3',x:1,y:1,Ksp:1.4e-10,col:'#5fae9e',cn:'blue-green'},
  'Fe|OH':{f:'Fe(OH)3',x:1,y:3,Ksp:2.8e-39,col:'#9c4a1a',cn:'rust brown'},'Fe|CO3':{f:'Fe(OH)3',x:2,y:3,Ksp:0,col:'#9c4a1a',cn:'rust brown',special:'feco3'}};
Object.values(PPT).forEach(p=>{p.M=CL.molarMass(p.f);p.txt=CL.fmt(p.f);p.html=CL.html(p.f);});
const REDOX={'Cu|I':{note:'Cu²⁺ takes an electron from I⁻. White CuI forms, but the I₂ made at the same time stains everything tan-brown.',col:'#d2b48c',liq:'#8a5a2b',ppt:'CuI'},
  'Fe|I':{note:'Fe³⁺ takes an electron from I⁻ and becomes Fe²⁺. The I₂ made turns the solution brown. No solid forms.',col:null,liq:'#8a5a2b',ppt:null}};

/* ---------- equations: solved by brute force over small whole numbers, so they are balanced by construction ---------- */
function solve(r,p){const all=r.concat(p),n=all.length,cs=all.map(s=>CL.parse(s.f)),els=[...new Set([].concat(...cs.map(Object.keys)))];
  const ok=c=>els.every(e=>{let t=0;cs.forEach((x,i)=>t+=(i<r.length?1:-1)*c[i]*(x[e]||0));return t===0;});
  for(let sum=n;sum<=8*n;sum++){const res=rec(n,sum,[]);if(res)return res;}return null;
  function rec(k,left,acc){if(k===1){if(left<1||left>8)return null;const c=acc.concat([left]);return ok(c)&&c.reduce(gcd)===1?c:null;}
    for(let v=1;v<=Math.min(8,left-(k-1));v++){const z=rec(k-1,left-v,acc.concat([v]));if(z)return z;}return null;}}
const S=(f,st,ions)=>({f,st,ions,txt:CL.fmt(f),html:CL.html(f)});
const aqSalt=(cat,an)=>{const u=units(cat,an);return S(saltF(cat,an),'aq',[[cat,u.nc],[an,u.na]]);};
const CACHE={};
function mixInfo(ka,kb){const key=ka+'+'+kb;if(CACHE[key])return CACHE[key];const A=SOL[ka],B=SOL[kb];let out;
  const rA=S(A.f,'aq',[[A.cat,A.nc],[A.an,A.na]]),rB=S(B.f,'aq',[[B.cat,B.nc],[B.an,B.na]]);
  if(ka===kb){out={same:true,pairs:[],react:false};return CACHE[key]=out;}
  const pairs=[[A.cat,B.an],[B.cat,A.an]].map(([c,a])=>({c,a,key:c+'|'+a,sol:CL.soluble(c,a),rule:ruleFor(c,a)}));
  const rx=pairs.find(q=>REDOX[q.key]);
  if(rx){const R=REDOX[rx.key];let rs=[rA,rB],ps;
    if(rx.key==='Cu|I')ps=[S('CuI','s',null),S('I2','aq',null),aqSalt('K','SO4')];else ps=[aqSalt('Fe2','Cl'),S('I2','aq',null),aqSalt('K','Cl')];
    out={redox:R,pairs,react:true,mol:{r:rs,p:ps}};}
  else{const pp=pairs.find(q=>!q.sol);
    if(!pp)out={pairs,react:false};
    else{const P=PPT[pp.key];if(!P)console.error('precip: no data for precipitate '+pp.key);const other=pairs.find(q=>q!==pp);let rs=[rA,rB],ps=[S(P.f,'s',null),aqSalt(other.c,other.a)];
      if(P.special==='ag2o')ps.push(S('H2O','l',null));if(P.special==='feco3'){rs.push(S('H2O','l',null));ps.push(S('CO2','g',null));}
      out={pairs,react:true,ppt:P,pp,other,mol:{r:rs,p:ps}};}}
  if(out.mol){const c=solve(out.mol.r,out.mol.p);if(!c)console.error('precip: could not balance '+key);out.mol.c=c;ionic(out);}
  return CACHE[key]=out;}
function ionic(o){const m=o.mol,nr=m.r.length;const L={},R={},Lm=[],Rm=[];
  m.r.concat(m.p).forEach((s,i)=>{const c=m.c[i],T=i<nr?L:R,M=i<nr?Lm:Rm;if(s.st==='aq'&&s.ions)s.ions.forEach(([ion,n])=>T[ion]=(T[ion]||0)+c*n);else M.push([s,c]);});
  o.full={L:Object.assign({},L),R:Object.assign({},R),Lm,Rm};const spec=[];
  Object.keys(L).forEach(k=>{if(R[k]){const d=Math.min(L[k],R[k]);if(L[k]===R[k])spec.push(k);L[k]-=d;R[k]-=d;}});
  const nums=[...Object.values(L),...Object.values(R),...Lm.map(x=>x[1]),...Rm.map(x=>x[1])].filter(x=>x>0),g=nums.reduce(gcd);
  o.net={L:Object.keys(L).filter(k=>L[k]>0).map(k=>[ION[k],L[k]/g]),R:Object.keys(R).filter(k=>R[k]>0).map(k=>[ION[k],R[k]/g]),Lm:Lm.map(x=>[x[0],x[1]/g]),Rm:Rm.map(x=>[x[0],x[1]/g])};o.spec=spec;}
const ST={aq:'(aq)',s:'(s)',l:'(l)',g:'(g)'};
const co=(c,s)=>(c>1?c:'')+s;
function fmtMol(o,html){const m=o.mol,nr=m.r.length;const t=(s,i)=>co(m.c[i],(html?s.html:s.txt)+ST[s.st]);return m.r.map(t).join(' + ')+' → '+m.p.map((s,i)=>t(s,i+nr)).join(' + ');}
function fmtIonSide(ions,mols,html){const a=Object.keys(ions).filter(k=>ions[k]>0).map(k=>co(ions[k],(html?ION[k].html:ION[k].txt)+'(aq)'));mols.forEach(([s,c])=>a.push(co(c,(html?s.html:s.txt)+ST[s.st])));return a.join(' + ');}
function fmtFull(o,html){return fmtIonSide(o.full.L,o.full.Lm,html)+' → '+fmtIonSide(o.full.R,o.full.Rm,html);}
function fmtNet(o,html){const n=o.net,side=(ions,mols)=>ions.map(([I,c])=>co(c,(html?I.html:I.txt)+'(aq)')).concat(mols.map(([s,c])=>co(c,(html?s.html:s.txt)+ST[s.st]))).join(' + ');return side(n.L,n.Lm)+' → '+side(n.R,n.Rm);}

/* ---------- solubility rules (the order RJ teaches) ---------- */
const RULES=['Compounds of Group 1 ions (Li⁺, Na⁺, K⁺) and NH₄⁺ are soluble.','Nitrates (NO₃⁻) and acetates (C₂H₃O₂⁻) are soluble.','Chlorides, bromides and iodides are soluble, except with Ag⁺, Pb²⁺ and Hg₂²⁺.',
  'Sulfates (SO₄²⁻) are soluble, except with Ba²⁺, Pb²⁺, Ca²⁺, Sr²⁺ and Ag⁺.','Hydroxides (OH⁻) are insoluble, except with Group 1 ions, Ba²⁺ and Sr²⁺.','Carbonates (CO₃²⁻) and phosphates are insoluble, except with Group 1 ions and NH₄⁺.'];
function ruleFor(c,a){if(['Na','K'].includes(c))return 0;if(a==='NO3')return 1;if(['Cl','I'].includes(a))return 2;if(a==='SO4')return 3;if(a==='OH')return 4;if(a==='CO3')return 5;return 0;}

/* ---------- amounts, Q vs Ksp, precipitate mass ---------- */
function amounts(sim){const p=sim.p,ap=atLeast('ap');const va=ap?p.va:25,vb=ap?p.vb:25,ca=ap?p.ca:0.1,cb=ap?p.cb:0.1;const A=SOL[p.a],B=SOL[p.b],V=va+vb;
  const mm={};const add=(k,v)=>mm[k]=(mm[k]||0)+v;add(A.cat,ca*va*A.nc);add(A.an,ca*va*A.na);add(B.cat,cb*vb*B.nc);add(B.an,cb*vb*B.na);
  const o=mixInfo(p.a,p.b);const r={va,vb,ca,cb,V,mm,o,forms:false,mass:0,mol:0,Q:NaN,lim:'—',excess:0};
  if(o.ppt){const P=o.ppt,c=o.pp.c,a=o.pp.a;const kx=P.kx||P.x,ky=P.ky||P.y;r.Q=Math.pow(mm[c]/V,kx)*Math.pow(mm[a]/V,ky);r.forms=P.special==='feco3'||r.Q>P.Ksp;
    const nc=mm[c]/P.x,na=mm[a]/P.y;if(r.forms){r.mol=Math.min(nc,na);r.mass=r.mol*P.M/1000;r.lim=Math.abs(nc-na)<1e-9?'neither (exact ratio)':nc<na?ION[c].txt:ION[a].txt;
      r.excess=nc<na?(na-nc)*P.y:(nc-na)*P.x;r.exIon=nc<na?ION[a].txt:ION[c].txt;}}
  else if(o.redox&&o.redox.ppt){r.forms=true;const nCu=mm.Cu,nI=mm.I;r.mol=Math.min(nCu,nI/2);r.mass=r.mol*CL.molarMass('CuI')/1000;r.lim=nCu<nI/2?'Cu²⁺':'I⁻';}
  return r;}

/* ---------- particles ---------- */
const ZX=598,ZY=196,ZR=152;
function rebuild(sim){const st=sim.st;if(!st)return;const r=amounts(sim),A=SOL[sim.p.a],B=SOL[sim.p.b];
  const per=Math.max(2.5/9,(r.ca*r.va*(A.nc+A.na)+r.cb*r.vb*(B.nc+B.na))/110);const fa=Math.max(1,Math.round(r.ca*r.va/per)),fb=Math.max(1,Math.round(r.cb*r.vb/per));
  st.per=per;st.fa=fa;st.fb=fb;st.mixed=false;st.mixT=0;st.parts=[];
  const mk=(ion,src,i)=>{const a=Math.random()*6.283,d=Math.sqrt(Math.random())*(ZR-22);const yb=ZY-ZR*0.82+Math.random()*ZR*0.45,xb=ZX+(Math.random()*2-1)*Math.sqrt(Math.max(0,ZR*ZR-(yb-ZY)*(yb-ZY)))*0.8;
    return {ion,src,x:src==='A'?ZX+Math.cos(a)*d:xb,y:src==='A'?ZY+Math.sin(a)*d:yb,vx:randn()*20,vy:src==='B'?50+Math.random()*40:randn()*20,lock:null,t0:0,al:1,gone:false};};
  for(let i=0;i<fa;i++){for(let j=0;j<A.nc;j++)st.parts.push(mk(A.cat,'A'));for(let j=0;j<A.na;j++)st.parts.push(mk(A.an,'A'));}
  for(let i=0;i<fb;i++){for(let j=0;j<B.nc;j++)st.parts.push(mk(B.cat,'B'));for(let j=0;j<B.na;j++)st.parts.push(mk(B.an,'B'));}
  st.res=r;sim.infoDirty=true;}
function startMix(sim){const st=sim.st;if(st.mixed)return;st.mixed=true;st.mixT=0;const r=st.res,o=r.o;if(o.same)return;
  // decide which particles lock into the solid
  if(o.ppt&&r.forms){const P=o.ppt,c=o.pp.c,a=o.pp.a;const cats=st.parts.filter(q=>q.ion===c),ans=st.parts.filter(q=>q.ion===a);
    const n=Math.min(Math.floor(cats.length/P.x),Math.floor(ans.length/P.y));const seq=[];
    for(let i=0;i<n;i++){const grp=[];for(let j=0;j<P.x;j++)grp.push(cats[i*P.x+j]);if(P.special==='feco3'){for(let j=0;j<P.y;j++){const q=ans[i*P.y+j];q.toGas=1.6+i*0.25+j*0.05;}}
      else for(let j=0;j<P.y;j++)grp.push(ans[i*P.y+j]);grp.forEach(q=>{q.t0=1.6+i*0.22;seq.push(q);});}
    const d=P.special==='feco3'?2*ION[c].r+6:ION[c].r+ION[a].r+3;const sites=lattice(seq.length,d);seq.forEach((q,i)=>q.lock=sites[i]);}
  sim.infoDirty=true;}
function lattice(n,d){const out=[],base=ZY+ZR-d*0.75;let row=0;
  while(out.length<n&&row<12){const y=base-row*d*0.88,half=Math.sqrt(Math.max(0,ZR*ZR-(y-ZY)*(y-ZY)))-18,cols=Math.max(1,Math.floor(2*half/d));
    const off=(row%2)*d/2;for(let i=0;i<cols&&out.length<n;i++){const k=i%2?Math.ceil(i/2):-Math.ceil(i/2);const x=ZX+k*d+off;if(Math.abs(x-ZX)<half)out.push({x,y});}row++;}
  while(out.length<n)out.push({x:ZX,y:base-row*d});return out;}
function stepParts(sim,dt){const st=sim.st;if(!st.parts)return;if(st.mixed)st.mixT+=dt;const T=st.mixT,mixed=st.mixed;
  st.parts.forEach(q=>{if(q.gone)return;if(q.src==='B'&&!mixed)return;
    if(q.lock&&T>q.t0){const f=Math.min(1,dt*3);q.x+=(q.lock.x-q.x)*f;q.y+=(q.lock.y-q.y)*f;return;}
    if(q.toGas&&T>q.toGas){q.gas=true;q.vy-=40*dt;q.y+=q.vy*dt;q.x+=Math.sin(T*3+q.x)*0.4;if(q.y<ZY-ZR-20)q.gone=true;return;}
    if(q.src==='B'&&T<0.6)return;
    q.vx+=randn()*320*dt;q.vy+=randn()*320*dt+(q.src==='B'&&T<2.4?70*dt:0);q.vx*=1-0.8*dt;q.vy*=1-0.8*dt;const sp=Math.hypot(q.vx,q.vy);if(sp>80){q.vx*=80/sp;q.vy*=80/sp;}
    q.x+=q.vx*dt;q.y+=q.vy*dt;const r=ION[q.ion].r,dx=q.x-ZX,dy=q.y-ZY,dd=Math.hypot(dx,dy),lim=ZR-r-4;
    if(dd>lim){q.x=ZX+dx/dd*lim;q.y=ZY+dy/dd*lim;const nx=dx/dd,ny=dy/dd,vn=q.vx*nx+q.vy*ny;if(vn>0){q.vx-=2*vn*nx;q.vy-=2*vn*ny;}}});}
function ionBall(ctx,x,y,I,al,ring){const r=I.r;ctx.save();ctx.globalAlpha=al;CL.drawAtom(ctx,x,y,r,I.s,{color:I.col,label:'',ring});ctx.font='700 '+Math.min(r*0.95,13)+'px '+FONT;
  const w=ctx.measureText(I.txt).width,fs=Math.min(r*0.95,13)*Math.min(1,(2*r-3)/w);txt(ctx,I.txt,x,y+1,{s:fs,w:700,a:'center',b:'middle',c:CL.inkOn(I.col)});ctx.restore();}
function mixHex(a,b,t){const p=h=>{h=h.replace('#','');if(h.length===3)h=h.split('').map(c=>c+c).join('');return [0,2,4].map(i=>parseInt(h.slice(i,i+2),16));};
  if(!/^#/.test(a)||!/^#/.test(b))return t>0.5?b:a;const A=p(a),B=p(b);return '#'+A.map((v,i)=>Math.round(lerp(v,B[i],t)).toString(16).padStart(2,'0')).join('');}

/* ---------- Virtual lab: gravimetric analysis of calcium and hard water (AP Chemistry, Jackson). Contract: VLAB.md ----------
   Everything on the bench lives in sim.vlab.bench, so it saves with the notebook and a reload never changes recorded data.
   Runs: 0 = introductory activity (weighed Na2CO3 + CaCl2), 1 = sample A, 2 = sample B (guided inquiry, 20.00 mL of a CaCl2 sample). */
const MW={CaCO3:CL.molarMass('CaCO3'),Na2CO3:CL.molarMass('Na2CO3'),CaCl2:CL.molarMass('CaCl2'),NaCl:CL.molarMass('NaCl'),CaCl2w:CL.molarMass('CaCl2*2H2O')};
const GS=[0.400,0.200,0.500,0.100,0.050,0.300];   // [CaCl2] of samples 1 to 6 (M), 100x concentrated
const GVS=20.00,GCM=0.500;                         // sample volume (mL), Na2CO3 solution (M)
function hr(seed,a,b){let h=(seed^Math.imul(a+1,0x9E3779B1)^Math.imul(b+7,0x85EBCA77))|0;h=Math.imul(h^h>>>16,0x7feb352d);h=Math.imul(h^h>>>15,0x846ca68b);h^=h>>>16;return (h>>>0)/4294967296;}
function hn(seed,a,b){const u=Math.max(1e-9,hr(seed,a,b)),w=hr(seed,a,b+100003);return Math.sqrt(-2*Math.log(u))*Math.cos(6.2831853*w);}
const r3=v=>Math.round(v*1000)/1000;
const LCD='700 VSIZEpx "Consolas","Menlo","DejaVu Sans Mono","Courier New",monospace';
const mmss=s=>{s=Math.max(0,Math.floor(s+1e-6));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');};
const AB=['Introductory activity','Sample A','Sample B'];
const gB=sim=>sim.vlab&&sim.st&&sim.st.G?sim.vlab.bench:null;
const gR=sim=>{const b=gB(sim);return b?b.runs[b.run]:null;};
const gU=(sim,a,c)=>hr(sim.vlab.seed,a,c),gN=(sim,a,c)=>hn(sim.vlab.seed,a,c);
function gRun(i){return {i,kind:i?'gi':'intro',na:{m:0,sc:0,water:false},ca:{m:0,sc:0,water:false},sample:0,vs:0,vC:0,mixed:false,pour:'',digest:false,
  setup:false,poured:false,rinses:0,moved:false,broken:false,cycles:0,d1:0,d2:0,reads:{na:[],ca:[],paper:[],glass:[]},dry:[]};}
function gInit(sim){const b=sim.vlab.bench;if(!Array.isArray(b.runs))b.runs=[gRun(0),gRun(1),gRun(2)];
  if(!b.bal)b.bal={on:null,tare:0,nz:0,disp:0};if(!Number.isFinite(b.run))b.run=0;if(!b.focus)b.focus='na';if(b.busy===undefined)b.busy=null;return {kind:'grav'};}
/* seeded glassware and reagents (fixed for a student's lab, different for each student) */
const gPaper=(sim,i)=>0.352+0.07*gU(sim,10+i,1);   // 7 cm filter paper as weighed at room humidity, g
const gGlass=(sim,i)=>21.6+13.5*gU(sim,10+i,2);    // watch glass, g
const gBeaker=(sim,i,w)=>61.5+9*gU(sim,10+i,w==='na'?3:4); // 150 mL beaker, g
const gCaWater=sim=>0.012+0.02*gU(sim,5,0);        // share of the "anhydrous" CaCl2 that is water it took up from the air
const SCOOP={big:[0.40,0.22],small:[0.075,0.05],pinch:[0.012,0.016]};
function gChem(sim,r){
  if(r.kind==='intro'){const nCa=r.ca.m*(1-gCaWater(sim))/MW.CaCl2,nC=r.na.m*0.998/MW.Na2CO3;return {nCa,nC,V:40};}
  if(!r.sample)return {nCa:0,nC:0,V:0};
  const c=GS[r.sample-1]*(1+0.004*gN(sim,20+r.i,r.sample)),vs=r.vs+0.01*gN(sim,21+r.i,r.sample),vc=Math.max(0,r.vC+0.08*gN(sim,22+r.i,Math.round(r.vC*10)));
  return {nCa:c*vs/1000,nC:GCM*(1+0.003*gN(sim,23,0))*vc/1000,V:vs+vc};}
/* what ends up on the watch glass: CaCO3 minus transfer losses and fines through the paper, plus salts left in the damp cake, plus water */
function gSolid(sim,r){const ch=gChem(sim,r),n=Math.min(ch.nCa,ch.nC),solid=n*MW.CaCO3,P=gPaper(sim,r.i);
  const left=solid*(0.02*Math.pow(0.3,Math.min(r.rinses,3))+0.0012*Math.abs(gN(sim,30+r.i,1)));
  const fines=solid*0.04*(r.pour==='slow'?0.18:1)*(r.digest?0.3:1)*Math.exp(0.15*gN(sim,31+r.i,1));
  const rec=Math.max(0,solid-left-fines);
  const salt=2*n*MW.NaCl+Math.max(0,ch.nC-n)*MW.Na2CO3+Math.max(0,ch.nCa-n)*MW.CaCl2;   // g of dissolved salts in the mixture
  const saltR=(0.5*rec+1.0*P)*(salt/Math.max(1,ch.V))*Math.pow(0.08,r.rinses);           // left in the liquid the cake and paper hold
  return {n,solid,left,fines,rec,saltR,W0:0.5*rec+1.05*P,ch};}
const gWater=(sim,r)=>{const s=gSolid(sim,r);return s.W0*(0.8*Math.exp(-(r.d1||0))+0.2*Math.exp(-(r.d2||0)));};
function gPan(sim){const b=gB(sim),on=b.bal.on;if(!on)return 0;const r=b.runs[on.run];
  if(on.item==='na'||on.item==='ca')return gBeaker(sim,on.run,on.item)+r[on.item].m;
  if(on.item==='paper')return gPaper(sim,on.run);if(on.item==='glass')return gGlass(sim,on.run);
  const s=gSolid(sim,r);return gGlass(sim,on.run)+0.99*gPaper(sim,on.run)+s.rec+s.saltR+gWater(sim,r);}
const gZ=(sim,nz)=>Math.max(-1,Math.min(1,Math.round(0.7*gN(sim,99,nz))));   // the last digit wanders by ±0.001 g
/* the pan changed: a new reading, logged with the run so the checks can compare the student's entry with it */
function gBal(sim){const b=gB(sim),B=b.bal;B.nz++;const d=r3(gPan(sim)-B.tare+0.001*gZ(sim,B.nz));B.disp=d;const on=B.on;if(!on)return d;const r=b.runs[on.run];
  const ok=on.item==='na'||on.item==='ca'?Math.abs(d-r[on.item].m)<0.01:Math.abs(B.tare)<0.0016;
  let L;if(on.item==='all'){r.dry[r.cycles-1]=r.dry[r.cycles-1]||[];L=r.dry[r.cycles-1];}else L=r.reads[on.item];L.push({v:d,ok});if(L.length>30)L.shift();return d;}
function gTare(sim){const b=gB(sim),B=b.bal;B.nz++;B.tare=gPan(sim)+0.001*gZ(sim,B.nz);B.disp=0;}
const gIs=(sim,item)=>{const b=gB(sim);return !!(b&&b.bal.on&&b.bal.on.run===b.run&&b.bal.on.item===item);};
const gIdle=sim=>{const b=gB(sim);return !!b&&!b.busy;};
const gLastOk=L=>{const g=(L||[]).filter(x=>x&&x.ok);return g.length?g[g.length-1].v:NaN;};
function gConst(r){const n=r.cycles;if(n<2)return false;const a=gLastOk(r.dry[n-1]),c=gLastOk(r.dry[n-2]);return Number.isFinite(a)&&Number.isFinite(c)&&Math.abs(a-c)<=0.0021;}
function gBusy(sim,w,T){const b=gB(sim);b.busy={w,run:b.run,t:0,T};BioLab.play(sim);}
function gStep(sim,dt){if(sim.t<-1e-9)return;const b=gB(sim);if(!b||!b.busy)return;const B=b.busy;B.t+=Math.min(dt,0.25);if(B.t<B.T)return;const r=b.runs[B.run];
  if(B.w==='digest')r.digest=true;
  else if(B.w==='oven'){r.cycles++;r.d1=(r.d1||0)+3.5;r.d2=(r.d2||0)+(r.broken?3.0:1.2);}
  b.busy=null;sim.infoDirty=true;}
/* ---------- checks: data cells against the bench, calcs against the student's own entries (hints only, never the answer) ---------- */
const near=(x,y,tol)=>Number.isFinite(x)&&Number.isFinite(y)&&Math.abs(x-y)<=tol*Math.abs(y);
const TARE='That reading includes whatever was tared, not just this item. Take everything off the balance, press Tare so it reads 0.000 g, and weigh it again.';
function gReadMsg(L,v,what){const hit=(L||[]).find(x=>x&&Math.abs(x.v-v)<0.0005);if(hit)return hit.ok?null:TARE;const g=gLastOk(L);
  return Number.isFinite(g)?'The balance read '+g.toFixed(3)+' g with '+what+' on it. Check your reading.':TARE;}
function gSolidMsg(sim,r,w,v){const R=r[w],nm=w==='na'?'Na₂CO₃':'CaCl₂',L=r.reads[w];if(!(R.m>0))return 'Weigh the '+nm+' on the bench first, then read the balance.';
  const hit=L.find(x=>Math.abs(x.v-v)<0.0005);if(hit)return hit.ok?null:'That reading includes the beaker. Put the empty beaker on the balance, press Tare, then add the solid.';
  const g=gLastOk(L);return Number.isFinite(g)?'The balance read '+g.toFixed(3)+' g with the '+nm+' in the tared beaker. Check your reading.':'Tare the balance with the empty beaker on it, then read the mass of the '+nm+'.';}
const T1=['Mass of Na₂CO₃','Mass of CaCl₂','Mass of filter paper','Mass of watch glass'];
function gT1Check(sim,rv,v){const b=gB(sim);if(!b)return null;const r=b.runs[0],i=T1.indexOf(rv);
  if(i<2)return gSolidMsg(sim,r,i?'ca':'na',v);const w=i===2?'paper':'glass',nm=i===2?'the filter paper':'the watch glass';
  if(!r.reads[w].length)return 'Weigh '+nm+' on the bench first.';return gReadMsg(r.reads[w],v,nm);}
const T2=['Sample number','Volume of sample (mL)','Volume of 0.5 M Na₂CO₃ added (mL)','Mass of filter paper (g)','Mass of watch glass (g)'];
function gT2Check(k){return (sim,rv,v)=>{const b=gB(sim);if(!b)return null;const r=b.runs[k],i=T2.indexOf(rv),nm=AB[k];
  if(i===0){if(!r.vs)return 'Pipet the '+nm+' water sample on the bench first.';return v===r.sample?null:'You pipetted sample '+r.sample+' for '+nm+'. Check this entry.';}
  if(i===1){if(!r.vs)return 'Pipet the '+nm+' water sample on the bench first.';return Math.abs(v-GVS)<=0.05?null:'The volumetric pipet delivers 20.00 mL. Check this entry.';}
  if(i===2){if(!r.vC)return 'Measure the Na₂CO₃ solution for '+nm+' on the bench first.';return Math.abs(v-r.vC)<=0.05?null:'You measured '+r.vC.toFixed(1)+' mL of 0.5 M Na₂CO₃ in the graduated cylinder for '+nm+'. Check this entry.';}
  const w=i===3?'paper':'glass',it=i===3?'the filter paper':'the watch glass';if(!r.reads[w].length)return 'Weigh '+it+' for '+nm+' on the bench first.';return gReadMsg(r.reads[w],v,it);};}
function gDryCheck(k){return (sim,rv,v)=>{const b=gB(sim);if(!b)return null;const r=b.runs[k],n=+rv,L=r.dry[n-1];
  if(!L||!L.length)return r.cycles<n?AB[k]+' has been in the oven '+(r.cycles===1?'once':r.cycles+' times')+' so far.':'Weigh the watch glass, paper and solid after drying '+n+' first.';
  return gReadMsg(L,v,'the watch glass, paper and solid');};}
function gPlanCheck(col){return (sim,rv,v)=>{const c=GS[(+rv)-1];if(!c)return null;const mol=c*GVS/1000,g=mol*MW.CaCO3,V=mol*1.2/GCM*1000,h=g/(GVS/1000)*1000/100;
  if(col==='mol'){if(near(v,mol,0.02))return null;if(near(v,c*GVS,0.03))return 'Check your volume units: molarity is moles per liter.';return 'Check this against the molarity and the 20.0 mL sample volume.';}
  if(col==='g'){if(near(v,g,0.015))return null;if(near(v,mol*MW.CaCl2,0.02))return 'Check which molar mass you used: the solid you collect is CaCO₃.';return 'Check your mole ratio and the molar mass of CaCO₃.';}
  if(col==='v'){const hi=Math.max(V*1.3,Math.ceil(V/5-1e-9)*5+0.6);if(v>=V*0.98&&v<=hi)return null;if(near(v,V/1.2,0.03))return 'Remember the 20% excess of Na₂CO₃.';return 'Check your mole ratio, the 20% excess and the molarity of the Na₂CO₃ solution.';}
  if(near(v,h,0.015))return null;if(near(v,h*100,0.03))return 'Remember that the samples were concentrated 100 times from the original water.';
  if(near(v,h/1000,0.03)||near(v,h*1000,0.03))return 'Check your units: hardness is in milligrams of CaCO₃ per liter.';return 'Check this against your theoretical mass of CaCO₃, the sample volume and the 100× concentration.';};}
const gNum=s=>BioLab.vlab.num(s);
const gLast=(V,t,c)=>{const a=V.col(t,c).filter(Number.isFinite);return a.length?a[a.length-1]:NaN;};
const CAT=[{v:'soft',l:'Soft (0 to 60 mg/L)'},{v:'moderate',l:'Moderately hard (61 to 120 mg/L)'},{v:'hard',l:'Hard (121 to 180 mg/L)'},{v:'very',l:'Very hard (more than 180 mg/L)'}];
const gCat=h=>h<=60.5?'soft':h<=120.5?'moderate':h<=180.5?'hard':'very';
function gResCheck(col){return (sim,rv,v)=>{const V=sim.vlab,ci=rv==='A'?'a':'b',row=rv==='A'?0:1,nm='Sample '+rv;
  if(col==='m'){const last=gLast(V,'dry',ci),p=V.val('t2',ci,3),g=V.val('t2',ci,4);if(![last,p,g].every(Number.isFinite))return 'Fill in Tables 4 and 5 for '+nm+' first.';
    return Math.abs(v-(last-p-g))<=0.0015?null:'Subtract the masses of the filter paper and the watch glass from your last (constant) mass in Table 5.';}
  if(col==='exp'){const m=V.val('res','m',row),vs=V.val('t2',ci,1);if(!Number.isFinite(m))return 'Fill in the mass of CaCO₃ for '+nm+' first.';const e=m/((Number.isFinite(vs)&&vs>0?vs:GVS)/1000)*1000/100;
    if(near(v,e,0.01))return null;if(near(v,e*100,0.03))return 'Remember that the samples were concentrated 100 times from the original water.';return 'Check this against your mass of CaCO₃, the sample volume and the 100× concentration.';}
  if(col==='theo'){const s=V.val('t2',ci,0);if(!(s>=1&&s<=6))return 'Record the sample number for '+nm+' in Table 4 first.';const pl=V.val('plan','h',s-1),tr=GS[s-1]*MW.CaCO3*10;
    return near(v,pl,0.01)||near(v,tr,0.015)?null:'Use the theoretical hardness for sample '+s+' from your planning table.';}
  if(col==='err'){const e=V.val('res','exp',row),t=V.val('res','theo',row);if(!Number.isFinite(e)||!Number.isFinite(t)||!t)return 'Fill in the experimental and theoretical hardness for '+nm+' first.';
    const p=Math.abs(e-t)/t*100;return Math.abs(Math.abs(v)-p)<=Math.max(0.15,0.03*p)?null:'Check your percent error: compare the difference between your experimental and theoretical hardness with the theoretical value.';}
  const e=V.val('res','exp',row);if(!Number.isFinite(e))return null;const ok=[gCat(e),gCat(e-1),gCat(e+1)];return ok.includes(v)?null:'Compare your experimental hardness with the hardness scale in the Background.';};}
function gCalcCheck(id){return (sim,v,V)=>{const mNa=V.val('t1','m',0),mCa=V.val('t1','m',1);const nNa=mNa/MW.Na2CO3,nCa=mCa/MW.CaCl2;
  if(id==='molNa'){if(!Number.isFinite(mNa))return 'Record the mass of Na₂CO₃ in Table 1 first.';return near(v,nNa,0.01)?null:'Check this against your Na₂CO₃ mass and the molar mass of Na₂CO₃.';}
  if(id==='molCa'){if(!Number.isFinite(mCa))return 'Record the mass of CaCl₂ in Table 1 first.';if(near(v,nCa,0.01))return null;
    if(near(v,mCa/MW.CaCl2w,0.01))return 'Check the molar mass: the bench uses anhydrous CaCl₂, not the dihydrate.';return 'Check this against your CaCl₂ mass and the molar mass of CaCl₂.';}
  if(id==='lim'){if(!Number.isFinite(nNa)||!Number.isFinite(nCa))return null;const t=String(v).toLowerCase().replace(/₂/g,'2').replace(/₃/g,'3').replace(/\s+/g,' ');
    const ca=/cacl|calcium chloride/.test(t),na=/na2co3|sodium carbonate/.test(t);if(ca===na)return null;const right=nCa<nNa?ca:na;return right?null:'Compare the moles of the two reactants. They react in a 1 : 1 ratio.';}
  if(id==='theo'){if(!Number.isFinite(nNa)||!Number.isFinite(nCa))return 'Record both reactant masses in Table 1 first.';const n=Math.min(nNa,nCa);if(near(v,n*MW.CaCO3,0.01))return null;
    if(near(v,Math.max(nNa,nCa)*MW.CaCO3,0.01))return 'Check which reactant is limiting.';if(near(v,n*MW.CaCl2,0.01)||near(v,n*MW.Na2CO3,0.01))return 'Check the molar mass: the product you collect is CaCO₃.';return 'Check your mole ratio and the molar mass of CaCO₃.';}
  if(id==='mppt'){const last=gLast(V,'dry','i'),p=V.val('t1','m',2),g=V.val('t1','m',3);if(![last,p,g].every(Number.isFinite))return 'Fill in Table 1 and the introductory column of Table 5 first.';
    return Math.abs(v-(last-p-g))<=0.0015?null:'Subtract the masses of the filter paper and the watch glass from your last (constant) mass in Table 5.';}
  const m=gNum(V.raw('k:mppt')),th=gNum(V.raw('k:theo'));if(!Number.isFinite(m)||!Number.isFinite(th)||!th)return 'Work out the theoretical yield and the mass you recovered first.';
  const p=m/th*100;return Math.abs(v-p)<=Math.max(0.2,0.005*p)?null:'Check this against your mass recovered and your theoretical yield.';};}
/* ---------- bench drawing ---------- */
function gLcd(ctx,x,y,w,h,label,value,k,vs){ctx.fillStyle='#2b2f36';rr(ctx,x,y,w,h,10);ctx.fill();txt(ctx,label,x+12,y+19,{s:Math.min(12*k,15),w:700,c:'#d7dbe0'});
  ctx.fillStyle='#cfe3c8';rr(ctx,x+10,y+28,w-20,h-38,6);ctx.fill();ctx.fillStyle='#1b2a1b';ctx.font=LCD.replace('VSIZE',String(vs));ctx.textAlign='right';ctx.textBaseline='middle';ctx.fillText(value,x+w-20,y+28+(h-38)/2+2);}
function gBeakerDraw(ctx,cx,bot,w,h,o){const x0=cx-w/2,x1=cx+w/2,top=bot-h,ih=h-8;
  const lv=o.liq>0?ih*Math.min(1,o.liq/150):0,ly=bot-lv;
  if(lv>0){ctx.fillStyle=PAL['cv-water'];ctx.fillRect(x0+2,ly,w-4,lv);
    if(o.cloud>0){ctx.fillStyle='rgba(226,228,222,'+(0.9*o.cloud).toFixed(3)+')';ctx.fillRect(x0+2,ly,w-4,lv);ctx.strokeStyle='rgba(0,0,0,.18)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x0+2,ly+.5);ctx.lineTo(x1-2,ly+.5);ctx.stroke();}
    const nf=o.flocs>0?22:o.cloud>0.3?40:0;if(nf){ctx.fillStyle='#ffffff';ctx.strokeStyle='rgba(0,0,0,.3)';ctx.lineWidth=0.7;
      for(let i=0;i<nf;i++){const fx=x0+5+((i*37)%97)/97*(w-10),fy=ly+3+((i*53)%89)/89*Math.max(1,lv-6)*(1-o.settle)+o.settle*Math.max(1,lv-6)*0.85;ctx.beginPath();ctx.arc(fx,fy,o.flocs>0?1.8+(i%3)*0.8:1,0,6.29);ctx.fill();if(o.flocs>0)ctx.stroke();}}}
  if(o.layer>0){ctx.fillStyle='#f6f6f2';ctx.fillRect(x0+2,bot-o.layer,w-4,o.layer);ctx.strokeStyle='rgba(0,0,0,.2)';ctx.lineWidth=1;ctx.strokeRect(x0+2,bot-o.layer,w-4,o.layer);}
  if(o.pile>0){ctx.fillStyle='#fbfbf7';ctx.strokeStyle='rgba(0,0,0,.25)';ctx.lineWidth=1;const ph=Math.min(14,3+o.pile*3.2),pw=Math.min(w*0.42,9+o.pile*7);ctx.beginPath();ctx.moveTo(cx-pw,bot);ctx.quadraticCurveTo(cx,bot-2*ph,cx+pw,bot);ctx.closePath();ctx.fill();ctx.stroke();}
  ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(x0-6,top-3);ctx.lineTo(x0,top+3);ctx.lineTo(x0,bot);ctx.lineTo(x1,bot);ctx.lineTo(x1,top);ctx.stroke();
  ctx.lineWidth=1;[50,100].forEach(ml=>{const y=bot-ih*ml/150;ctx.beginPath();ctx.moveTo(x0,y);ctx.lineTo(x0+10,y);ctx.stroke();});}
function gWatch(ctx,cx,y,w,o){
  if(o.paper){ctx.fillStyle='#f4f4ef';ctx.strokeStyle='rgba(0,0,0,.18)';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(cx,y-6,w*0.38,4,0,0,6.29);ctx.fill();ctx.stroke();}
  if(o.cake>0){const ch=3+o.cake*5;ctx.fillStyle=o.wet>0.05?'#e4e8e8':'#fdfdfb';ctx.strokeStyle='rgba(0,0,0,.25)';ctx.lineWidth=1;
    if(o.broken){for(let i=0;i<9;i++){const bx=cx-w*0.26+i*w*0.065,bh=ch*(0.5+0.5*((i*7)%5)/4);ctx.beginPath();ctx.ellipse(bx,y-8,w*0.04,bh/2+1,0,0,6.29);ctx.fill();ctx.stroke();}}
    else{ctx.beginPath();ctx.ellipse(cx,y-8,w*0.27,ch/2+1.5,0,0,6.29);ctx.fill();ctx.stroke();}}
  ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(cx-w/2,y-9);ctx.quadraticCurveTo(cx,y+5,cx+w/2,y-9);ctx.stroke();}
function gPaperFlat(ctx,cx,y,w){ctx.fillStyle='#f4f4ef';ctx.strokeStyle='rgba(0,0,0,.25)';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(cx,y-3,w/2,4,0,0,6.29);ctx.fill();ctx.stroke();}
function gFlask(ctx,cx,top,base,bw,nw,fill,cloud){const path=()=>{ctx.beginPath();ctx.moveTo(cx-nw/2,top);ctx.lineTo(cx-nw/2,top+28);ctx.lineTo(cx-bw/2,base);ctx.lineTo(cx+bw/2,base);ctx.lineTo(cx+nw/2,top+28);ctx.lineTo(cx+nw/2,top);};
  if(fill>0){ctx.save();path();ctx.closePath();ctx.clip();const y=base-fill;ctx.fillStyle=PAL['cv-water'];ctx.fillRect(cx-bw/2,y,bw,fill);if(cloud>0){ctx.fillStyle='rgba(248,248,244,'+cloud.toFixed(3)+')';ctx.fillRect(cx-bw/2,y,bw,fill);}ctx.restore();}
  ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=2.5;path();ctx.stroke();}
function gDraw(sim,ctx,vdt,k,t){const b=gB(sim),r=b.runs[b.run],B=b.busy&&b.busy.run===b.run?b.busy:null,on=b.bal.on,p=sim.p,F=x=>Math.min(x*k,x*1.6);
  ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);ctx.fillStyle=PAL['cv-bench'];ctx.fillRect(0,394,800,56);ctx.fillStyle=PAL['line'];ctx.fillRect(0,394,800,2);
  const head=r.kind==='intro'?'Introductory activity':AB[b.run]+(r.sample?': sample '+r.sample+' ('+GS[r.sample-1].toFixed(3)+' M CaCl₂)':': choose a sample');
  txt(ctx,head,16,30,{s:F(16),w:700});
  const ph=B?clamp(B.t/B.T,0,1):1;
  // ----- analytical balance -----
  ctx.fillStyle='rgba(150,190,210,0.10)';ctx.fillRect(40,152,184,138);ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=2;ctx.strokeRect(40,152,184,138);ctx.beginPath();ctx.moveTo(132,152);ctx.lineTo(132,290);ctx.stroke();
  ctx.fillStyle='#4a515b';rr(ctx,32,142,200,12,4);ctx.fill();rr(ctx,20,290,224,104,10);ctx.fill();
  ctx.fillStyle='#9aa3ab';ctx.fillRect(126,274,12,16);ctx.fillStyle='#c3cad0';rr(ctx,74,268,116,8,3);ctx.fill();
  if(on){const R=b.runs[on.run];
    if(on.item==='na'||on.item==='ca')gBeakerDraw(ctx,132,268,62,84,{liq:0,pile:R[on.item].m});
    else if(on.item==='paper')gPaperFlat(ctx,132,268,92);
    else if(on.item==='glass')gWatch(ctx,132,268,104,{});
    else{const s=gSolid(sim,R);gWatch(ctx,132,268,104,{paper:true,cake:clamp(s.rec/1.8,0.15,1),wet:gWater(sim,R),broken:R.broken});}}
  ctx.fillStyle='#2b2f36';rr(ctx,32,300,200,62,8);ctx.fill();ctx.fillStyle='#cfe3c8';rr(ctx,40,306,184,50,5);ctx.fill();
  ctx.fillStyle='#1b2a1b';ctx.font=LCD.replace('VSIZE','36');ctx.textAlign='right';ctx.textBaseline='middle';ctx.fillText(b.bal.disp.toFixed(3),196,332);
  ctx.font='700 18px '+FONT;ctx.fillText('g',216,334);
  ctx.fillStyle='#6b737d';rr(ctx,52,370,60,18,5);ctx.fill();rr(ctx,152,370,60,18,5);ctx.fill();txt(ctx,'ON/OFF',82,383,{s:12,w:700,c:'#eef0f2',a:'center'});txt(ctx,'TARE',182,383,{s:12,w:700,c:'#eef0f2',a:'center'});
  txt(ctx,'Analytical balance',132,416,{s:F(13),w:700,a:'center'});txt(ctx,'reads to 0.001 g',132,437,{s:F(12),c:PAL['cv-soft'],a:'center'});
  // ----- beakers -----
  const mixing=B&&B.w==='mix',pouring=B&&B.w==='pour',rinsing=B&&B.w==='rinse';
  const cloudOf=()=>{const fast=r.pour!=='slow',g=mixing?ph:1,settle=r.digest?1:(B&&B.w==='digest'?ph:0);
    return {cloud:(fast?0.75:0.35)*g*(1-0.8*settle),flocs:fast?0:g,settle,layer:settle*(fast?5:7)};};
  if(r.kind==='intro'){
    if(!(on&&on.run===b.run&&on.item==='na')){const lq=r.mixed?(mixing?20*(1-ph):0):r.na.water?20:0;gBeakerDraw(ctx,300,392,80,104,{liq:lq,pile:r.na.water?0:r.na.m});}
    if(!(on&&on.run===b.run&&on.item==='ca')){let o={liq:r.ca.water?20:0,pile:r.ca.water?0:r.ca.m};
      if(r.mixed){const c=cloudOf();o=Object.assign(o,c,{liq:mixing?20+20*ph:40});if(r.poured){const left=pouring?1-ph:0;o.liq=40*left+(rinsing?10*(1-ph):0);o.layer=c.layer*left;o.cloud=c.cloud*(left>0?1:0);o.flocs=left>0?c.flocs:0;
        if(!pouring&&r.rinses===0)o.layer=1.5;}}
      gBeakerDraw(ctx,404,392,80,104,o);}
    txt(ctx,'Na₂CO₃',300,416,{s:F(13),w:700,a:'center'});txt(ctx,'CaCl₂',404,416,{s:F(13),w:700,a:'center'});}
  else{let o={liq:r.vs?20:0,pile:0};
    if(r.mixed){const c=cloudOf(),tot=20+r.vC;o=Object.assign(o,c,{liq:mixing?20+r.vC*ph:tot});if(r.poured){const left=pouring?1-ph:0;o.liq=tot*left+(rinsing?10*(1-ph):0);o.layer=c.layer*left;o.cloud=left>0?c.cloud:0;o.flocs=left>0?c.flocs:0;if(!pouring&&r.rinses===0)o.layer=1.5;}}
    gBeakerDraw(ctx,300,392,80,104,o);
    // 50 mL graduated cylinder of 0.5 M Na2CO3
    const cx=404,cw=26,ctop=262,cb=388,ci=cb-ctop-6,vc=r.mixed?(mixing?r.vC*(1-ph):0):r.vC;
    if(vc>0){ctx.fillStyle=PAL['cv-water'];ctx.fillRect(cx-cw/2+2,cb-ci*vc/50,cw-4,ci*vc/50);}
    ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(cx-cw/2,ctop);ctx.lineTo(cx-cw/2,cb);ctx.lineTo(cx+cw/2,cb);ctx.lineTo(cx+cw/2,ctop);ctx.stroke();
    ctx.fillStyle=PAL['cv-glass'];rr(ctx,cx-24,cb,48,6,2);ctx.fill();ctx.lineWidth=1;for(let ml=10;ml<=50;ml+=10){const y=cb-ci*ml/50;ctx.beginPath();ctx.moveTo(cx+cw/2,y);ctx.lineTo(cx+cw/2-8,y);ctx.stroke();}
    txt(ctx,r.sample?'Sample '+r.sample:'Sample',300,416,{s:F(13),w:700,a:'center'});txt(ctx,'Na₂CO₃',404,416,{s:F(13),w:700,a:'center'});}
  // ----- watch glass on the bench -----
  const s=r.mixed?gSolid(sim,r):null,inOven=B&&B.w==='oven',glassOnBal=on&&on.run===b.run&&(on.item==='glass'||on.item==='all');
  if(!glassOnBal&&!inOven)gWatch(ctx,494,392,80,r.moved?{paper:true,cake:clamp(s.rec/1.8,0.15,1),wet:gWater(sim,r),broken:r.broken}:{});
  if(!glassOnBal&&!inOven)txt(ctx,'Watch glass',494,437,{s:F(12),c:PAL['cv-soft'],a:'center'});
  // ----- vacuum filtration: Büchner funnel, filter flask, trap, aspirator -----
  const fx=600,vac=r.setup&&!r.moved,filt=r.poured?(s.ch.V+10*r.rinses)*(pouring?ph:1)-(rinsing?10*(1-ph):0):0;
  const fineCloud=r.poured&&s?clamp(s.fines/Math.max(1e-6,s.solid)*12,0,0.6):0;
  gFlask(ctx,fx,262,392,104,26,Math.min(96,filt*0.55),fineCloud);
  ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(fx+13,282);ctx.lineTo(fx+36,278);ctx.stroke();
  ctx.fillStyle='#3a3e45';ctx.fillRect(fx-15,252,30,14);
  ctx.fillStyle='#efece4';ctx.strokeStyle='#9a958a';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(fx-42,198);ctx.lineTo(fx-42,236);ctx.lineTo(fx-8,252);ctx.lineTo(fx-5,274);ctx.lineTo(fx+5,274);ctx.lineTo(fx+8,252);ctx.lineTo(fx+42,236);ctx.lineTo(fx+42,198);ctx.closePath();ctx.fill();ctx.stroke();
  if(r.setup&&!r.moved){ctx.fillStyle='#ffffff';ctx.fillRect(fx-38,230,76,4);
    if(r.poured){const ck=(3+clamp(s.rec/1.8,0.1,1)*7)*(pouring?ph:1);ctx.fillStyle='#fbfbf8';ctx.fillRect(fx-38,230-ck,76,ck);ctx.strokeStyle='rgba(0,0,0,.2)';ctx.lineWidth=1;ctx.strokeRect(fx-38,230-ck,76,ck);
      if(pouring||rinsing){const lq=(pouring?1-ph:1-ph)*20;ctx.fillStyle=PAL['cv-water'];ctx.globalAlpha=0.9;ctx.fillRect(fx-38,230-ck-lq,76,lq);ctx.globalAlpha=1;}}}
  ctx.strokeStyle=PAL['cv-lamp'];ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(fx+36,278);ctx.bezierCurveTo(660,262,690,268,702,302);ctx.stroke();
  gFlask(ctx,705,316,392,62,18,0,0);ctx.fillStyle='#3a3e45';ctx.fillRect(696,306,18,12);
  ctx.strokeStyle=PAL['cv-lamp'];ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(710,306);ctx.bezierCurveTo(716,250,760,262,772,248);ctx.stroke();
  ctx.fillStyle='#8f979f';ctx.fillRect(764,210,36,10);ctx.fillRect(764,210,10,40);
  if(vac){ctx.strokeStyle='#5aa9e6';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(769,252);ctx.lineTo(769,300);ctx.stroke();pill(ctx,'Vacuum on',600,180,PAL['s3'],'#fff',F(12));}
  txt(ctx,'Aspirator',796,202,{s:F(12),c:PAL['cv-soft'],a:'right'});
  txt(ctx,'Filter flask',fx,416,{s:F(13),w:700,a:'center'});txt(ctx,'Trap',705,416,{s:F(13),w:700,a:'center'});
  // ----- oven -----
  ctx.fillStyle='#5b6470';rr(ctx,604,44,186,118,8);ctx.fill();ctx.fillStyle=inOven?'#4a2e1c':'#20252c';rr(ctx,614,56,118,94,6);ctx.fill();
  if(inOven){ctx.fillStyle='rgba(255,140,40,'+(0.18+0.08*Math.sin(t*3)).toFixed(3)+')';rr(ctx,614,56,118,94,6);ctx.fill();gWatch(ctx,673,140,84,{paper:true,cake:clamp(s.rec/1.8,0.15,1),wet:gWater(sim,r),broken:r.broken});}
  txt(ctx,'OVEN',761,72,{s:12,w:700,c:'#e6e9ec',a:'center'});txt(ctx,'100 °C',761,96,{s:14,w:700,c:inOven?'#ffb36b':'#c9ced3',a:'center'});
  // ----- lab timer -----
  if(B&&(B.w==='digest'||B.w==='oven'))gLcd(ctx,300,44,200,90,B.w==='oven'?'IN THE OVEN':'STANDING (DIGESTION)',mmss(ph*600),k,38);
  else if(r.cycles>0)txt(ctx,'Oven time so far: '+(r.cycles*10)+' min',402,70,{s:F(13),c:PAL['cv-soft'],a:'center'});}
function gNarr(sim){const b=gB(sim),r=b.runs[b.run],B=b.busy,on=b.bal.on,s=r.mixed?gSolid(sim,r):null,intro=r.kind==='intro';
  if(B&&B.w==='mix')return r.pour==='slow'?'<b>Ca²⁺ and CO₃²⁻ ions meet and lock into solid CaCO₃.</b> Adding the carbonate slowly while you stir keeps the ions from meeting all at once, so fewer, larger crystals grow.':'<b>Ca²⁺ and CO₃²⁻ ions meet and lock into solid CaCO₃.</b> Dumping the carbonate in at once starts a huge number of tiny crystals at the same moment, so the mixture turns milky.';
  if(B&&B.w==='digest')return '<b>The mixture is standing.</b> Small crystals slowly dissolve and the ions redeposit on larger ones, so the solid gets coarser and settles. This is called digestion.';
  if(B&&B.w==='pour')return 'The aspirator pulls air out of the flask, so the liquid is pushed through the paper and the CaCO₃ stays on top.';
  if(B&&B.w==='rinse')return 'The rinse carries solid left in the beaker onto the filter and washes dissolved NaCl out of the damp solid.';
  if(B&&B.w==='oven')return '<b>Water is evaporating from the solid and the paper.</b> CaCO₃ itself is stable at 100 °C, so only water leaves.';
  if(on&&(on.item==='na'||on.item==='ca')&&on.run===b.run){const nm=on.item==='na'?'Na₂CO₃':'CaCl₂';return Math.abs(b.bal.tare)<1?'The beaker is on the balance but the balance is not tared, so the reading includes the beaker. Press <b>Tare</b> before you add the '+nm+'.':'Add '+nm+' with the scoop until the display is near '+(on.item==='na'?'2.5':'2.0')+' g, then record the exact reading.';}
  if(on&&on.item==='all'&&on.run===b.run)return 'Record this mass. <b>When two weighings in a row agree within 0.002 g, the solid is dry</b>: the mass has stopped changing.';
  if(on&&on.run===b.run)return Math.abs(b.bal.tare)>0.0016?'<b>The balance was tared with something else on it</b>, so this reading is off by that mass. Take it off, press Tare with the pan empty, and weigh again.':'Record the reading exactly as the display shows it, to 0.001 g.';
  if(r.moved){if(!r.cycles)return 'The damp solid and paper hold water. Dry them in the 100 °C oven'+(r.broken?'.':', and break up the clumps first so the inside can dry.');
    return gConst(r)?'<b>Two weighings in a row agree within 0.002 g: the mass is constant.</b> The solid is dry.':'Weigh again after each drying. Water is still leaving if the mass keeps going down.';}
  if(r.poured){const cl=s.fines/Math.max(1e-6,s.solid)>0.02;return (cl?'<b>The filtrate in the flask looks cloudy.</b> Very fine particles of CaCO₃ are passing through the paper. ':'The filtrate in the flask is clear, so the solid is staying on the paper. ')+(r.rinses<2?'Rinse the beaker onto the filter so no solid is left behind.':'Turn off the vacuum and move the paper and solid to the watch glass.');}
  if(r.mixed)return '<b>White CaCO₃ has formed.</b> Ca²⁺(aq) + CO₃²⁻(aq) → CaCO₃(s). Na⁺ and Cl⁻ are spectator ions and stay in solution.'+(r.digest?' The solid has settled to the bottom.':'');
  if(intro){if(r.na.water&&r.ca.water)return 'Both solids have dissolved into clear, colorless solutions of ions. Combine them next.';return 'Weigh each solid in a tared beaker, then dissolve it in 20 mL of distilled water.';}
  if(!r.vs)return 'Each sample is a CaCl₂ solution made 100 times more concentrated than the original hard water. Pipet 20.00 mL of the one you choose.';
  return 'The beaker holds 20.00 mL of sample '+r.sample+'. Measure the 0.5 M Na₂CO₃ you planned in the graduated cylinder, then add it.';}
/* ---------- the lab: steps, tables, questions ---------- */
const gTxt=(sim,k)=>sim.vlab.raw(k).trim()!=='';
function gSetRun(i,focus){return sim=>{const b=gB(sim);if(!b)return;b.run=i;if(focus)b.focus=focus;};}
const W_CTL=['g-beaker','g-tare','scoop','g-scoop','g-dump','g-off','g-water'],M_CTL=['pour','g-mix'],PG_CTL=['g-tare','g-paper','g-glass','g-off'],
  F_CTL=['g-setup','g-pour','g-rinse','g-move'],D_CTL=['g-break','g-oven','g-weigh','g-off','g-tare'];
function gWeighStep(w){const nm=w==='na'?'Na₂CO₃':'CaCl₂',full=w==='na'?'sodium carbonate':'calcium chloride (anhydrous)',tg=w==='na'?2.5:2.0,lo=w==='na'?2.0:1.6,hi=w==='na'?3.0:2.4,row=w==='na'?0:1;
  return {title:'Weigh and dissolve the '+nm,setup:gSetRun(0,w),controls:W_CTL,
    text:'<p>Put an empty, clean, dry 150 mL beaker on the balance and press <b>Tare</b>. Add '+full+' with the scoop until the balance reads about '+tg.toFixed(1)+' g. You do not need exactly '+tg.toFixed(1)+' g, but record the exact reading in Table 1.</p><p>Take the beaker off the balance, add 20 mL of distilled water and stir until the solid dissolves.</p>',
    done:sim=>{const r=gB(sim)&&gB(sim).runs[0];return !!r&&r[w].water&&r[w].m>=lo&&r[w].m<=hi&&gTxt(sim,'c:t1:m:'+row);},
    doneHint:sim=>{const b=gB(sim);if(!b)return '';const R=b.runs[0][w];if(R.m>hi&&!R.water)return 'That is more than about '+tg.toFixed(1)+' g. Press <b>Empty the beaker and start over</b>, then add less.';if(R.m<lo)return 'Add '+nm+' until the balance reads about '+tg.toFixed(1)+' g. Use the large scoop first, then the small one or a pinch.';
      if(!gTxt(sim,'c:t1:m:'+row))return 'Record the mass of '+nm+' in Table 1.';if(!R.water)return 'Take the beaker off the balance, then press <b>Add 20 mL of distilled water</b>.';return '';}};}
function gRunSteps(k){const nm=AB[k],col=k===1?'a':'b',rr_=sim=>gB(sim)&&gB(sim).runs[k],set=gSetRun(k);
  return [
  {title:nm+': measure the sample and the Na₂CO₃',setup:set,controls:['gSample','g-pipet','gVol','g-carb'],
   text:'<p><b>'+nm+'.</b> '+(k===2?'Choose a different sample from Sample A. ':'Choose one of the six samples. ')+'Pipet 20.00 mL of it into a clean 150 mL beaker. Set the volume of 0.5 M Na₂CO₃ from your planning table and measure it in the graduated cylinder.</p><p>Record the sample number and both volumes in the '+nm+' column of Table 4.</p>',
   done:sim=>{const r=rr_(sim);if(!r||!r.vs||!r.vC)return false;if(k===2&&r.sample===gB(sim).runs[1].sample)return false;return [0,1,2].every(i=>gTxt(sim,'c:t2:'+col+':'+i));},
   doneHint:sim=>{const r=rr_(sim);if(!r)return '';if(!r.vs)return 'Choose a sample, then press <b>Pipet 20.00 mL</b>.';if(k===2&&r.sample===gB(sim).runs[1].sample)return 'You analyzed sample '+r.sample+' as Sample A. Choose a different sample and pipet it again.';
     if(!r.vC)return 'Set the volume of Na₂CO₃ and press <b>Measure it in the graduated cylinder</b>.';return 'Record the sample number and both volumes in Table 4.';}},
  {title:nm+': make the precipitate',setup:set,controls:M_CTL.concat(['g-digest']),
   text:'<p>Add the Na₂CO₃ solution to the sample in the beaker, using the technique your procedure calls for. If your procedure says to let the mixture stand, do it now. Describe what you see in the Observations box for '+nm+'.</p>',
   done:sim=>{const r=rr_(sim);return !!r&&r.mixed&&gIdle(sim);},doneHint:'Choose how to add it, then press <b>Add the Na₂CO₃ solution</b>.'},
  {title:nm+': weigh the filter paper and watch glass',setup:set,controls:PG_CTL,
   text:'<p>Take everything off the balance and press Tare so it reads 0.000 g. Weigh a new piece of filter paper and a clean, dry watch glass. Record both masses in Table 4.</p>',
   done:sim=>{const r=rr_(sim);return !!r&&r.reads.paper.length>0&&r.reads.glass.length>0&&gTxt(sim,'c:t2:'+col+':3')&&gTxt(sim,'c:t2:'+col+':4')&&!gB(sim).bal.on;},
   doneHint:sim=>{const r=rr_(sim);if(!r)return '';if(!r.reads.paper.length||!r.reads.glass.length)return 'Weigh the filter paper and the watch glass.';if(gB(sim).bal.on)return 'Take it off the balance.';return 'Record both masses in Table 4.';}},
  {title:nm+': filter and wash',setup:set,controls:F_CTL,
   text:'<p>Filter the mixture the same way as in the introductory activity. Rinse the beaker onto the filter and wash the solid, then move the paper and solid onto the watch glass.</p>',
   done:sim=>{const r=rr_(sim);return !!r&&r.moved;},doneHint:'Seat the paper, pour the mixture onto it, rinse, then move the paper and solid to the watch glass.'},
  {title:nm+': dry to constant mass',setup:set,controls:D_CTL,
   text:'<p>Dry and weigh as before, and record each mass in the '+nm+' column of Table 5. Keep going until two weighings in a row agree within 0.002 g.</p>',
   done:sim=>{const r=rr_(sim);return !!r&&gConst(r)&&V_COUNT(sim,col)>=2&&!gB(sim).bal.on;},
   doneHint:sim=>{const r=rr_(sim);if(!r)return '';if(!gConst(r))return 'Dry it again and reweigh until two weighings in a row agree within 0.002 g.';if(gB(sim).bal.on)return 'Take it off the balance.';return 'Record each weighing in Table 5.';}}];}
const V_COUNT=(sim,c)=>sim.vlab.col('dry',c).filter(Number.isFinite).length;
const LAB_GRAV={id:'gravimetric',title:'Gravimetric Analysis of Calcium and Hard Water',course:'AP Chemistry',teachers:'Jackson',
  source:{label:'P3 - Gravimetric Analysis (Lab)',href:'https://rjhs.instructure.com/courses/17215/pages/p3-gravimetric-analysis-lab'},level:'ap',
  purpose:'<p>Find out how much calcium is in a water sample by turning it into a solid you can weigh. First you make calcium carbonate from weighed reactants and find your percent yield. Then you plan an analysis, run it on two hard-water samples, and compare the hardness you measure with the expected value.</p>'+
    '<p><b>Objectives</b></p><ul><li><b>Knowledge:</b> explain what makes hard water “hard”.</li><li><b>Skill:</b> perform a gravimetric analysis to determine the calcium ion content in a water sample.</li><li><b>Review:</b> write the double replacement reaction between calcium chloride and sodium carbonate, and the net ionic equation.</li><li><b>Vocabulary:</b> gravimetric analysis, hard water, filter paper, precipitate, funnel, drying oven.</li><li><b>AP topics 1.3 and 1.4:</b> the law of definite proportions, and elemental analysis for purity.</li></ul>',
  background:'<p><b>What makes water hard.</b> As rain and groundwater move through rock such as limestone (CaCO₃) and dolomite (CaMg(CO₃)₂), they dissolve calcium and magnesium ions. Water with a lot of dissolved Ca²⁺ and Mg²⁺ is called <b>hard</b>. It leaves white scale inside kettles, pipes and water heaters, and it reacts with soap to form scum instead of lather. Hardness is reported as if all of those ions were present as calcium carbonate, in milligrams of CaCO₃ per liter of water (mg/L).</p>'+
    '<p>The U.S. Geological Survey scale: 0 to 60 mg/L is <b>soft</b>, 61 to 120 mg/L is <b>moderately hard</b>, 121 to 180 mg/L is <b>hard</b>, and more than 180 mg/L is <b>very hard</b>. Denver Water is soft, at about 40 to 60 mg/L.</p>'+
    '<p><b>The reaction.</b> When you mix solutions of calcium chloride and sodium carbonate, the ions trade partners in a double replacement reaction, and calcium carbonate comes out as a white precipitate:</p><p>CaCl₂(aq) + Na₂CO₃(aq) → CaCO₃(s) + 2NaCl(aq)</p><p>Na⁺ and Cl⁻ stay dissolved before and after, so they are spectator ions. The net ionic equation shows only the change:</p><p>Ca²⁺(aq) + CO₃²⁻(aq) → CaCO₃(s)</p>'+
    '<p><b>Gravimetric analysis</b> measures how much of a substance is present by turning it into a solid of known composition and weighing that solid. It works because of the law of definite proportions: pure CaCO₃ is always 40.04% calcium by mass, so the mass of dry CaCO₃ tells you the moles of Ca²⁺ that were in the water.</p>'+
    '<p><b>Why CaCO₃ is a good precipitate to weigh.</b> It is very insoluble (Ksp is about 5 × 10⁻⁹, so well under a milligram stays dissolved in your beaker). It has one known formula and molar mass, 100.09 g/mol. It is stable at 100 °C: drying removes water but does not change the solid, which only breaks down far above 600 °C. It does not pull water back out of the air. And when it forms under the right conditions, its particles are large enough to catch on filter paper.</p>'+
    '<p><b>Interfering ions.</b> Any other cation that forms an insoluble carbonate comes down with the CaCO₃ and adds to the mass, so the result reads too high. Examples are Mg²⁺ (MgCO₃ is only slightly soluble, so part of it precipitates), Ba²⁺, Sr²⁺, Pb²⁺, and iron ions, which come down as iron hydroxides. Real water labs use other methods, such as an EDTA titration, to count Ca²⁺ and Mg²⁺ together. The samples in this lab contain only CaCl₂.</p>'+
    '<p><b>Safety.</b> Wear goggles. Sodium carbonate and calcium chloride irritate the eyes and skin. Clamp the filter flask so it cannot tip over. The oven and the watch glass are hot: handle them with tongs. Dispose of the filtrate the way your teacher directs.</p>'+
    '<p><b>About the virtual bench.</b> The analytical balance reads to 0.001 g, and its last digit wanders by ±0.001 g. The CaCl₂ is labeled anhydrous, but it pulls some water from the air, so a little of the mass you weigh is water. Some solid stays behind in the beaker unless you rinse it onto the filter. Very fine particles can pass through the paper, and how you add the Na₂CO₃ and whether you let the mixture stand change how many do. The damp solid holds dissolved NaCl until you wash it. The solid and the paper keep losing water in the oven until the mass is constant. Every run is a little different, and so is every student’s bench. At 1× speed, 10 minutes pass in about 5 seconds. The model ignores the tiny amount of CaCO₃ that stays dissolved, and it treats each water sample as a pure CaCl₂ solution.</p>',
  materials:['Sodium carbonate, Na₂CO₃(s), and calcium chloride, CaCl₂(s), anhydrous','Six water samples with known CaCl₂ concentrations (concentrated 100× from the original water)','0.5 M sodium carbonate solution','Distilled water and a wash bottle','Analytical balance (reads to 0.001 g)','150 mL beakers, a scoop and a stirring rod','20.00 mL volumetric pipet and a 50 mL graduated cylinder','Filter paper and a watch glass','Büchner funnel with rubber adapter, filter flask, trap flask, vacuum tubing and an aspirator','Drying oven at 100 °C, tongs and a spatula'],
  hypothesis:{prompt:'<p>Predict whether your percent yield in the introductory activity will be above or below 100%, and name the step you expect to matter most. Explain your reasoning.</p>'},
  setup(sim){BioLab.refresh(sim);},
  controls:[],
  steps:[
    {title:'Get set up',setup:gSetRun(0,'na'),
     text:'<p>This lab has two parts. In the <b>introductory activity</b> you make CaCO₃ from weighed Na₂CO₃ and CaCl₂ and find your percent yield. In the <b>guided inquiry</b> you plan an analysis, then measure the hardness of two water samples.</p><p>The analytical balance reads to 0.001 g. <b>Tare</b> sets the display to zero with whatever is on the pan. Record every mass exactly as the display shows it. At 1× speed, 10 minutes on the bench pass in about 5 seconds; use Speed to change that.</p><p><b>Safety:</b> put on your goggles.</p>'},
    gWeighStep('na'),gWeighStep('ca'),
    {title:'Combine the solutions',setup:gSetRun(0),controls:M_CTL,
     text:'<p>Add the Na₂CO₃ solution to the CaCl₂ solution slowly, stirring as you pour. Choose how you add it, then watch the beaker. Describe what you see in the Observations box.</p>',
     done:sim=>{const b=gB(sim);return !!b&&b.runs[0].mixed&&gIdle(sim);},
     doneHint:sim=>{const b=gB(sim);if(!b)return '';const r=b.runs[0];if(!r.na.water||!r.ca.water)return 'Weigh and dissolve both solids first.';return 'Choose how to add it, then press <b>Add the Na₂CO₃ solution</b>.';}},
    {title:'Let it stand (your choice)',setup:gSetRun(0),controls:['g-digest'],
     text:'<p>You may let the mixture stand for 10 minutes before you filter it. Chemists call this <b>digestion</b>. It is your choice: press Next to filter right away.</p>',
     done:gIdle,doneHint:'Wait for the 10 minutes to finish.'},
    {title:'Weigh the filter paper and watch glass',setup:gSetRun(0),controls:PG_CTL,
     text:'<p>Take everything off the balance and press Tare so it reads 0.000 g. Weigh a piece of filter paper and record its mass in Table 1. Then weigh a clean, dry watch glass and record its mass.</p>',
     done:sim=>{const b=gB(sim);if(!b)return false;const r=b.runs[0];return r.reads.paper.length>0&&r.reads.glass.length>0&&gTxt(sim,'c:t1:m:2')&&gTxt(sim,'c:t1:m:3')&&!b.bal.on;},
     doneHint:sim=>{const b=gB(sim);if(!b)return '';const r=b.runs[0];if(!r.reads.paper.length||!r.reads.glass.length)return 'Weigh the filter paper and the watch glass.';if(b.bal.on)return 'Take it off the balance.';return 'Record both masses in Table 1.';}},
    {title:'Vacuum filtration',setup:gSetRun(0),controls:F_CTL,
     text:'<p>Seat the weighed filter paper flat in the Büchner funnel, wet it with a few drops of distilled water so it seals, and turn on the aspirator. The trap flask keeps water from the aspirator out of your filtrate.</p><p>Pour the mixture onto the center of the paper. Rinse the beaker with small portions of distilled water and pour each rinse over the solid, so all of the CaCO₃ reaches the filter and the solid is washed. Then turn off the vacuum and move the paper and solid onto the watch glass.</p>',
     done:sim=>{const b=gB(sim);return !!b&&b.runs[0].moved;},doneHint:'Seat the paper, pour the mixture onto it, rinse, then move the paper and solid to the watch glass.'},
    {title:'Dry to constant mass',setup:gSetRun(0),controls:D_CTL,
     text:'<p>Dry the paper and solid on the watch glass in the 100 °C oven for 10 minutes. Breaking up the solid with a spatula helps it dry. Let it cool, then weigh the watch glass, paper and solid together and record the mass in Table 5.</p><p>Dry for another 10 minutes and weigh again. The solid is dry when two weighings in a row agree within 0.002 g.</p>',
     done:sim=>{const b=gB(sim);return !!b&&gConst(b.runs[0])&&V_COUNT(sim,'i')>=2&&!b.bal.on;},
     doneHint:sim=>{const b=gB(sim);if(!b)return '';if(!gConst(b.runs[0]))return 'Dry it again and reweigh until two weighings in a row agree within 0.002 g.';if(b.bal.on)return 'Take it off the balance.';return 'Record each weighing in Table 5.';}},
    {title:'Introductory activity: calculations',setup:gSetRun(0),
     text:'<p>Use Table 1 and Table 5 to fill in the Calculations below the bench: the moles of each reactant, the limiting reactant, the theoretical yield of CaCO₃, the mass you recovered and your percent yield.</p>'},
    {title:'Guided inquiry: plan',setup:gSetRun(1),
     text:'<p>The six water samples were concentrated 100 times from the original water, so there is enough calcium to weigh. Each holds a known concentration of CaCl₂, and you will analyze 20.0 mL of each sample you choose.</p><p>Fill in Table 2 for all six samples: the moles of Ca²⁺ in 20.0 mL, the theoretical mass of CaCO₃, the volume of 0.5 M Na₂CO₃ that gives a 20% excess of carbonate, and the theoretical hardness of the <i>original</i> water in mg CaCO₃/L.</p><p><b>Worked example, sample 1 (0.400 M):</b> 0.008 mol Ca²⁺, 0.801 g CaCO₃, 19.2 mL of Na₂CO₃ (round up and use 20 mL), and 400 mg CaCO₃/L.</p>',
     done:sim=>[0,1,2,3,4,5].every(i=>['mol','g','v','h'].every(c=>gTxt(sim,'c:plan:'+c+':'+i))),doneHint:'Fill in every cell of the planning table (Table 2).'},
    {title:'Guided inquiry: write your procedure',setup:gSetRun(1),
     text:'<p>Write your own step-by-step procedure for analyzing one sample in Table 3. Build on the introductory activity, and include the techniques that give large, easily filtered particles and an accurate final mass. Then analyze two samples on the bench by following it.</p>',
     done:sim=>[0,1,2,3,4,5,6,7,8,9].filter(i=>gTxt(sim,'c:proc:s:'+i)).length>=4,doneHint:'Write at least four steps in Table 3.'}]
    .concat(gRunSteps(1),gRunSteps(2),[{title:'Analyze your results',setup:gSetRun(2),
     text:'<p>Fill in Table 6: the mass of dry CaCO₃ from each sample, the experimental hardness of the original water, the theoretical hardness from your planning table, the percent error and the hardness category. Your bar graph draws from Table 6. Then answer the questions and write your Lab Reflection.</p>'}]),
  tables:[
    {id:'t1',title:'Table 1. Introductory activity: balance readings',cols:[{id:'q',label:'',rows:T1},{id:'m',label:'Balance reading (g)',input:'number',dp:3,check:gT1Check}]},
    {id:'plan',title:'Table 2. Planning table: 20.0 mL of each sample',cols:[{id:'s',label:'Sample',rows:[1,2,3,4,5,6],rowLabels:GS.map((c,i)=>(i+1)+' ('+c.toFixed(3)+' M CaCl₂)')},
      {id:'mol',label:'Moles of Ca²⁺ in 20.0 mL (mol)',input:'number',check:gPlanCheck('mol')},{id:'g',label:'Theoretical mass of CaCO₃ (g)',input:'number',check:gPlanCheck('g')},
      {id:'v',label:'Volume of 0.5 M Na₂CO₃ for a 20% excess (mL)',input:'number',check:gPlanCheck('v')},{id:'h',label:'Theoretical hardness (mg CaCO₃/L)',input:'number',check:gPlanCheck('h')}]},
    {id:'proc',title:'Table 3. Your procedure for analyzing one sample',cols:[{id:'n',label:'Step',rows:[1,2,3,4,5,6,7,8,9,10]},{id:'s',label:'What you will do',input:'text'}]},
    {id:'t2',title:'Table 4. Guided inquiry: your two samples',cols:[{id:'q',label:'',rows:T2},{id:'a',label:'Sample A',input:'number',check:gT2Check(1)},{id:'b',label:'Sample B',input:'number',check:gT2Check(2)}]},
    {id:'dry',title:'Table 5. Drying to constant mass: watch glass + filter paper + CaCO₃ (g)',cols:[{id:'n',label:'Weighing',rows:[1,2,3,4,5,6,7,8],rowLabels:[1,2,3,4,5,6,7,8].map(n=>n+' (after '+n*10+' min)')},
      {id:'i',label:'Introductory activity',input:'number',dp:3,check:gDryCheck(0)},{id:'a',label:'Sample A',input:'number',dp:3,check:gDryCheck(1)},{id:'b',label:'Sample B',input:'number',dp:3,check:gDryCheck(2)}]},
    {id:'res',title:'Table 6. Guided inquiry results',cols:[{id:'s',label:'Sample',rows:['A','B'],rowLabels:['Sample A','Sample B']},
      {id:'m',label:'Mass of dry CaCO₃ (g)',input:'number',check:gResCheck('m')},{id:'exp',label:'Experimental hardness (mg CaCO₃/L)',input:'number',check:gResCheck('exp')},
      {id:'theo',label:'Theoretical hardness (mg CaCO₃/L)',input:'number',check:gResCheck('theo')},{id:'err',label:'Percent error (%)',input:'number',check:gResCheck('err')},
      {id:'cat',label:'Hardness category',input:'select',options:CAT,check:gResCheck('cat')}]}],
  observations:[{id:'o1',label:'Introductory activity: what you saw as the solutions combined'},{id:'o2',label:'Sample A: what the precipitate and the filtrate looked like'},{id:'o3',label:'Sample B: what the precipitate and the filtrate looked like'}],
  calcs:[{id:'molNa',label:'Moles of Na₂CO₃',unit:'mol',input:'number',check:gCalcCheck('molNa')},{id:'molCa',label:'Moles of CaCl₂',unit:'mol',input:'number',check:gCalcCheck('molCa')},
    {id:'lim',label:'Limiting reactant, and how you know',input:'text',check:gCalcCheck('lim')},{id:'theo',label:'Theoretical yield of CaCO₃',unit:'g',input:'number',check:gCalcCheck('theo')},
    {id:'mppt',label:'Mass of dry CaCO₃ recovered (constant mass − filter paper − watch glass)',unit:'g',input:'number',check:gCalcCheck('mppt')},{id:'pct',label:'Percent yield',unit:'%',input:'number',check:gCalcCheck('pct')}],
  graph:{type:'bar',title:'Theoretical and experimental water hardness',xl:'Water sample',yl:'Hardness (mg CaCO₃/L)',ymin:0,
    series:[{table:'res',x:'s',y:'theo',label:'Theoretical'},{table:'res',x:'s',y:'exp',label:'Experimental'}]},
  questions:[
    {id:'p1',n:'Pre 1',q:'<p>Name the two ions most responsible for water hardness, and describe one thing you might notice at home if your water were very hard.</p>'},
    {id:'p2',n:'Pre 2',q:'<p>In the net ionic equation for this lab, why do Na⁺ and Cl⁻ not appear? What is the mole ratio of Ca²⁺ to CaCO₃, and why does that ratio make the analysis simple?</p>'},
    {id:'p3',n:'Pre 3',q:'<p>List three properties that make a precipitate good for gravimetric analysis, and explain why each one matters for an accurate result.</p>'},
    {id:'p4',n:'Pre 4',q:'<p>Suppose a water sample also contained Mg²⁺ or Ba²⁺. Write the net ionic equation for one of them with CO₃²⁻, and predict whether your calculated calcium content would be too high or too low.</p>'},
    {id:'p5',n:'Pre 5',q:'<p>Describe two techniques that help a precipitate form large, easily filtered particles, and explain why each one helps.</p>'},
    {id:'p6',n:'Pre 6',q:'<p>Why does the plan call for a 20% excess of Na₂CO₃? What would happen to your result if you added less carbonate than the calcium needs?</p>'},
    {id:'a1',n:'A1',q:'<p>Compare your percent yield in the introductory activity with 100%. Using the choices you made on the bench, name the most likely causes of the difference and say which way each one pushes the yield.</p>'},
    {id:'a2',n:'A2',q:'<p>Why do you dry to constant mass instead of drying once for a set time? Use your Table 5 data to support your answer.</p>'},
    {id:'a3',n:'A3',q:'<p>The samples were 100 times more concentrated than the original water. Explain where that factor enters the hardness calculation, and why concentrating the water first makes the analysis more accurate.</p>'},
    {id:'a4',n:'A4',q:'<p>Which of your two samples had the larger percent error? Explain why a smaller mass of precipitate usually gives a larger percent error, even with the same technique.</p>'},
    {id:'a5',n:'A5',q:'<p>A student skips washing the solid on the filter. Predict the effect on the measured hardness, and explain what extra substance ends up on the watch glass.</p>'},
    {id:'a6',n:'A6',q:'<p>Denver Water has a hardness of about 50 mg CaCO₃/L. Estimate the mass of CaCO₃ you would collect from 20.0 mL of it without concentrating it first. Could this balance measure that mass well? Explain.</p>'},
    {id:'r1',n:'LR 1',q:'<p><b>Lab Reflection: Background.</b> In your own words, explain the chemistry this lab is built on: what makes water hard, the reaction you used, and why weighing a precipitate can measure an ion in solution.</p>'},
    {id:'r2',n:'LR 2',q:'<p><b>Lab Reflection: Procedure.</b> Summarize what you did in both parts of the lab, including the techniques you chose and why.</p>'},
    {id:'r3',n:'LR 3',q:'<p><b>Lab Reflection: Relevant calculations.</b> Show one complete calculation from start to finish: from the mass of CaCO₃ you collected for one sample to its experimental hardness and percent error. Include units at every step.</p>'},
    {id:'r4',n:'LR 4',q:'<p><b>Lab Reflection: Sources of error.</b> Name at least three specific sources of error in this lab. For each one, say whether it makes the measured mass of CaCO₃ too high or too low, and how you could reduce it.</p>'}],
  conclusion:{prompt:'<p><b>Lab Reflection: Conclusions.</b> State what you found: your percent yield, the hardness and category of each water sample you analyzed, and how close your results came to the expected values. Explain what your results show about how well gravimetric analysis measures calcium in water.</p>',cer:false}};
/* bench actions for the gravimetric lab (shown only in Virtual lab mode, and only on the steps that list them) */
function gAct(id,label,en,fn,primary){return {id,label,vlab:true,primary:!!primary,enabled:s=>{const b=gB(s);return !!b&&!!en(s,b,b.runs[b.run]);},run(s){const b=gB(s);if(!b)return;const r=b.runs[b.run];if(!en(s,b,r))return;fn(s,b,r);sim_dirty(s);}};}
const sim_dirty=s=>{s.infoDirty=true;};
const G_ACTIONS=[
  gAct('g-beaker','Put an empty 150 mL beaker on the balance',(s,b,r)=>!b.busy&&!b.bal.on&&r.kind==='intro'&&!r[b.focus].water,(s,b,r)=>{b.bal.on={run:b.run,item:b.focus};gBal(s);}),
  gAct('g-tare','Tare',(s,b)=>!b.busy,s=>gTare(s)),
  gAct('g-scoop','Add solid with the scoop',(s,b,r)=>!b.busy&&r.kind==='intro'&&gIs(s,b.focus)&&!r[b.focus].water,(s,b,r)=>{const w=b.focus,R=r[w],z=SCOOP[s.p.scoop]||SCOOP.big;R.sc++;
    R.m=Math.round((R.m+z[0]+z[1]*gU(s,400+r.i*7+(w==='na'?0:3),R.sc))*1e4)/1e4;r.reads[w]=[];gBal(s);},true),
  gAct('g-dump','Empty the beaker and start over',(s,b,r)=>!b.busy&&r.kind==='intro'&&r[b.focus].m>0&&!r[b.focus].water,(s,b,r)=>{r[b.focus].m=0;r.reads[b.focus]=[];if(gIs(s,b.focus))gBal(s);}),
  gAct('g-off','Take it off the balance',(s,b)=>!b.busy&&!!b.bal.on,(s,b)=>{b.bal.on=null;gBal(s);}),
  gAct('g-water','Add 20 mL of distilled water and stir',(s,b,r)=>!b.busy&&r.kind==='intro'&&r[b.focus].m>0&&!r[b.focus].water&&!gIs(s,b.focus),(s,b,r)=>{r[b.focus].water=true;}),
  gAct('g-pipet','Pipet 20.00 mL of the sample into a beaker',(s,b,r)=>!b.busy&&r.kind==='gi'&&!r.mixed,(s,b,r)=>{r.sample=+s.p.gSample||1;r.vs=GVS;}),
  gAct('g-carb','Measure it in the graduated cylinder',(s,b,r)=>!b.busy&&r.kind==='gi'&&!r.mixed,(s,b,r)=>{r.vC=s.p.gVol;}),
  gAct('g-mix','Add the Na₂CO₃ solution',(s,b,r)=>!b.busy&&!r.mixed&&(r.kind==='intro'?r.na.water&&r.ca.water:r.vs>0&&r.vC>0),(s,b,r)=>{r.mixed=true;r.pour=s.p.pour;gBusy(s,'mix',1.8);},true),
  gAct('g-digest','Let it stand for 10 minutes',(s,b,r)=>!b.busy&&r.mixed&&!r.poured&&!r.digest,s=>gBusy(s,'digest',5)),
  gAct('g-paper','Put a filter paper on the balance',(s,b,r)=>!b.busy&&!b.bal.on&&!r.setup,(s,b)=>{b.bal.on={run:b.run,item:'paper'};gBal(s);}),
  gAct('g-glass','Put the watch glass on the balance',(s,b,r)=>!b.busy&&!b.bal.on&&!r.moved,(s,b)=>{b.bal.on={run:b.run,item:'glass'};gBal(s);}),
  gAct('g-setup','Seat the filter paper in the funnel and turn on the vacuum',(s,b,r)=>!b.busy&&!r.setup&&r.reads.paper.length>0&&!gIs(s,'paper'),(s,b,r)=>{r.setup=true;}),
  gAct('g-pour','Pour the mixture onto the filter',(s,b,r)=>!b.busy&&r.setup&&r.mixed&&!r.poured,(s,b,r)=>{r.poured=true;gBusy(s,'pour',1.6);},true),
  gAct('g-rinse','Rinse the beaker onto the filter (10 mL)',(s,b,r)=>!b.busy&&r.poured&&!r.moved&&r.rinses<3,(s,b,r)=>{r.rinses++;gBusy(s,'rinse',1.0);}),
  gAct('g-move','Move the paper and solid to the watch glass',(s,b,r)=>!b.busy&&r.poured&&!r.moved&&r.reads.glass.length>0&&!gIs(s,'glass'),(s,b,r)=>{r.moved=true;}),
  gAct('g-break','Break up the solid with a spatula',(s,b,r)=>!b.busy&&r.moved&&!r.broken&&!gIs(s,'all'),(s,b,r)=>{r.broken=true;}),
  gAct('g-oven','Dry in the oven for 10 minutes',(s,b,r)=>!b.busy&&r.moved&&!gIs(s,'all')&&r.cycles<8,s=>gBusy(s,'oven',5),true),
  gAct('g-weigh','Put the watch glass, paper and solid on the balance',(s,b,r)=>!b.busy&&r.moved&&r.cycles>0&&!b.bal.on,(s,b)=>{b.bal.on={run:b.run,item:'all'};gBal(s);})];
/* ---------- definition ---------- */
const OPTS=Object.keys(SOL).map(k=>({v:k,l:SOL[k].txt+' ('+SOL[k].name+')'}));
function resultText(sim){const st=sim.st;if(!st.mixed)return 'Mix to find out';const r=st.res,o=r.o;if(o.same)return 'Same solution: no change';
  if(o.redox)return o.redox.ppt?'CuI (tan, with brown I₂)':'None (solution turns brown)';if(o.ppt&&r.forms)return o.ppt.txt+' ('+o.ppt.cn+')';if(o.ppt)return 'None: Q is below Ksp';return 'None';}
const PRE={
  id:'precip',hash:'precip',apUnit:7,order:4,tab:'Precipitation reactions',kind:'Virtual lab',prereq:['rxntypes'],next:['ksp','dissolve'],
  card:'Mix two solutions and zoom in: spectator ions keep swimming while the precipitate ions lock into a solid. Write the net ionic equation.',
  title:'Precipitation and net ionic equations',
  lede:{bio:'Two clear solutions can make a cloudy solid when you mix them. Pick two solutions, predict what happens, then mix and zoom in on the ions.',
        honors:'Find the spectator ions, write the molecular, complete ionic and net ionic equations, and use the solubility rules to explain each result.',
        ap:'Change volumes and molarities to find the limiting ion and the mass of precipitate, and compare Q with Ksp for the slightly soluble salts.'},
  scale:'The beaker holds about 50 mL. The zoom shows a tiny volume about 5 nm across; each ball is one hydrated ion. Water molecules are not drawn.',
  timeless:true,animated:true,chChange:0.8,chReveal:5.2,
  controls:[
    {id:'a',label:'Solution A (in the beaker)',type:'select',def:'AgNO3',lvl:'bio',options:OPTS,onChange:rebuild},
    {id:'b',label:'Solution B (in the test tube)',type:'select',def:'NaCl',lvl:'bio',options:OPTS,onChange:rebuild},
    {id:'hide',label:'Fade the spectator ions',type:'toggle',def:false,lvl:'honors',help:'Spectator ions are in the solution before and after. Fading them leaves only the net ionic equation.'},
    {id:'va',label:'Volume of A',type:'range',min:5,max:50,step:5,def:25,unit:' mL',lvl:'ap',onChange:rebuild},
    {id:'ca',label:'Molarity of A',type:'range',min:0.05,max:0.5,step:0.05,def:0.1,unit:' M',lvl:'ap',onChange:rebuild},
    {id:'vb',label:'Volume of B',type:'range',min:5,max:50,step:5,def:25,unit:' mL',lvl:'ap',onChange:rebuild},
    {id:'cb',label:'Molarity of B',type:'range',min:0.05,max:0.5,step:0.05,def:0.1,unit:' M',lvl:'ap',onChange:rebuild},
    // virtual lab bench only (hidden in the other views)
    {id:'scoop',label:'Scoop size',type:'seg',def:'big',vlab:true,noTrial:true,options:[{v:'big',l:'Large (about 0.5 g)'},{v:'small',l:'Small (about 0.1 g)'},{v:'pinch',l:'A pinch'}]},
    {id:'pour',label:'How you add the Na₂CO₃ solution',type:'seg',def:'fast',vlab:true,noTrial:true,options:[{v:'fast',l:'All at once'},{v:'slow',l:'Slowly, while stirring'}]},
    {id:'gSample',label:'Water sample',type:'select',def:1,vlab:true,noTrial:true,options:GS.map((c,i)=>({v:i+1,l:'Sample '+(i+1)+' ('+c.toFixed(3)+' M CaCl₂)'}))},
    {id:'gVol',label:'Volume of 0.5 M Na₂CO₃ to measure',type:'range',min:0.5,max:30,step:0.5,def:10,unit:' mL',vlab:true,noTrial:true}
  ],
  actions:[{id:'mix',label:'Pour B into A',lvl:'bio',primary:true,run(sim){startMix(sim);}},{id:'refill',label:'Fresh solutions',lvl:'bio',run(sim){rebuild(sim);}}].concat(G_ACTIONS),
  labs:[LAB_GRAV],
  /* what the bench instruments show right now (used by the virtual-lab tests) */
  benchRead(sim){const b=gB(sim);if(!b)return null;const r=b.runs[b.run];return {balance:b.bal.disp,on:b.bal.on?b.bal.on.item:null,busy:b.busy?b.busy.w:null,run:b.run,cycles:r.cycles,constant:gConst(r)};},
  init(sim){const st={parts:[],mixed:false,mixT:0};sim.st=st;rebuild(sim);if(sim.vlab&&sim.vlab.lab.id==='gravimetric')st.G=gInit(sim);return st;},
  step(sim,dt){if(sim.st.G){gStep(sim,dt);return;}stepParts(sim,Math.min(dt,0.05));if(sim.st.mixed&&Math.abs(sim.st.mixT-2.2)<dt)sim.infoDirty=true;},
  metrics:[
    {id:'res',label:'Precipitate',unit:'',lvl:'bio',text:true,get:s=>resultText(s)},
    {id:'spec',label:'Spectator ions',unit:'',lvl:'honors',text:true,get:s=>{const o=s.st.res.o;if(!s.st.mixed)return 'Mix to find out';if(o.same)return '—';if(!o.react)return 'All of them (no reaction)';return o.spec.map(k=>ION[k].txt).join(', ')||'none';}},
    {id:'mass',label:'Mass of precipitate',unit:'g',lvl:'ap',min:0,max:null,d:3,get:s=>s.st.mixed?s.st.res.mass:NaN},
    {id:'lim',label:'Limiting ion',unit:'',lvl:'ap',text:true,get:s=>s.st.mixed&&s.st.res.forms?s.st.res.lim:'—'},
    {id:'q',label:'Q compared with Ksp',unit:'',lvl:'ap',text:true,get:s=>{const r=s.st.res,o=r.o;if(!o.ppt||o.ppt.special==='feco3')return '—';return CL.sci(r.Q,'',2)+(r.Q>o.ppt.Ksp?' > ':' < ')+CL.sci(o.ppt.Ksp,'',2);}}
  ],
  graphs:[{id:'ions',label:'Ions before and after mixing (mmol)',lvl:'bio',custom:true}],defaultGraph:'ions',
  plot(sim,ctx,box,id){const r=sim.st.res,o=r.o,keys=Object.keys(r.mm);const after={};keys.forEach(k=>after[k]=r.mm[k]);
    if(o.ppt&&r.forms){after[o.pp.c]-=r.mol*o.ppt.x;after[o.pp.a]-=r.mol*o.ppt.y;}
    if(o.redox){after.I=Math.max(0,after.I-(o.redox.ppt?Math.min(r.mm.Cu*2,r.mm.I):Math.min(r.mm.Fe,r.mm.I)));if(o.redox.ppt)after.Cu=Math.max(0,after.Cu-Math.min(r.mm.Cu,r.mm.I/2));else{after.Fe2=Math.min(r.mm.Fe,r.mm.I);after.Fe-=after.Fe2;keys.push('Fe2');}}
    const ymax=Math.max(1,...keys.map(k=>r.mm[k]||0))*1.25,ax=axes(ctx,box,{xmin:0,xmax:keys.length,ymin:0,ymax,xcats:keys.map(k=>ION[k].txt),yl:'mmol'});
    keys.forEach((k,i)=>{[[r.mm[k]||0,0],[sim.st.mixed?Math.max(0,after[k]):(r.mm[k]||0),1]].forEach(([v,j])=>{const x0=ax.X(i+0.5+(j?0.03:-0.36)),x1=ax.X(i+0.5+(j?0.36:-0.03));ctx.fillStyle=j?serColor(3):serColor(1);ctx.fillRect(x0,ax.Y(v),x1-x0,ax.Y(0)-ax.Y(v));txt(ctx,v.toFixed(2),(x0+x1)/2,ax.Y(v)-4,{s:11,c:PAL.fg,a:'center'});});});
    legend(ctx,box.L+10,box.T+8,[{label:'before mixing',color:serColor(1)},{label:sim.st.mixed?'still dissolved after mixing':'after (mix first)',color:serColor(3)}]);},
  infoPanel(sim){const st=sim.st,r=st.res,o=r.o,hon=atLeast('honors'),ap=atLeast('ap');const A=SOL[sim.p.a],B=SOL[sim.p.b];
    let h=`<h3>${A.html}(aq) + ${B.html}(aq)</h3>`;
    if(!st.mixed){h+='<p>Predict first: which two new pairs of ions could form? Check each pair against the solubility rules, then press <b>Pour B into A</b>.</p>';}
    else if(o.same)h+='<p>Both test tubes hold the same solution, so mixing only makes more of it.</p>';
    else{if(o.react){h+=`<p><b>Molecular:</b> ${fmtMol(o,true)}</p>`;if(hon)h+=`<p><b>Complete ionic:</b> ${fmtFull(o,true)}</p>`;h+=`<p><b>Net ionic:</b> ${fmtNet(o,true)}</p>`;
        if(hon)h+=`<p><b>Spectator ions:</b> ${o.spec.map(k=>ION[k].html).join(', ')||'none'}</p>`;if(o.redox)h+=`<p class="help">${o.redox.note} This is a redox reaction, not a double replacement.</p>`;
        if(o.ppt&&o.ppt.special==='feco3')h+='<p class="help">Many textbooks write Fe₂(CO₃)₃(s). In water, iron(III) carbonate does not survive: you see rust-brown Fe(OH)₃ and fizzing CO₂.</p>';
        if(o.ppt&&o.ppt.special==='ag2o')h+='<p class="help">AgOH forms first and quickly loses water to become brown Ag₂O.</p>';
        if(o.ppt&&!r.forms)h+=`<p class="help">${o.ppt.html} is only slightly soluble. Here Q = ${CL.sci(r.Q,'',2)} is less than Ksp = ${CL.sci(o.ppt.Ksp,'',2)}, so the ions stay dissolved.</p>`;}
      else h+='<p><b>No reaction.</b> Both new combinations are soluble, so all four ions stay dissolved: NR.</p>';}
    if(st.mixed&&!o.same){const used=o.pairs.map(q=>q.rule);h+='<p style="margin-top:8px"><b>Solubility rules</b> (the ones that decide this mix are highlighted)</p><ol class="help" style="padding-left:20px">'+RULES.map((t,i)=>`<li${used.includes(i)?' style="background:var(--card2);font-weight:700;color:var(--fg)"':''}>${t}</li>`).join('')+'</ol>';
      h+='<p class="help">'+o.pairs.map(q=>saltF(q.c,q.a).replace(/(\d+)/g,'<sub>$1</sub>')+': '+(q.sol?'soluble':'insoluble')+' (rule '+(q.rule+1)+')').join(' · ')+'</p>';}
    if(ap){h+=`<p class="help"><b>Amounts:</b> ${Object.keys(r.mm).map(k=>ION[k].html+' '+r.mm[k].toFixed(2)+' mmol').join(', ')} in ${r.V.toFixed(0)} mL. In the zoom, one formula unit stands for about ${st.per.toFixed(2)} mmol.`;
      if(st.mixed&&r.forms&&o.ppt)h+=` ${(o.ppt.x>1?o.ppt.x+' ':'')}${ION[o.pp.c].html} : ${(o.ppt.y>1?o.ppt.y+' ':'')}${ION[o.pp.a].html} per ${o.ppt.html}. Limiting: ${r.lim}. ${r.mol.toFixed(3)} mmol × ${o.ppt.M.toFixed(2)} g/mol = ${(r.mass*1000).toFixed(1)} mg. Excess ${r.exIon||''}: ${r.excess.toFixed(2)} mmol left.`;
      h+='</p>';}
    return h;},
  narrate(sim){if(sim.st.G&&sim.vlab)return gNarr(sim);const st=sim.st,r=st.res,o=r.o,A=SOL[sim.p.a],B=SOL[sim.p.b];
    if(!st.mixed){if(o.same)return 'Both containers hold '+A.txt+'. Pick two different solutions.';return 'The beaker holds '+A.txt+': <b>'+ION[A.cat].txt+' and '+ION[A.an].txt+' ions</b> swim apart in the water. Before you pour, ask: could '+ION[A.cat].txt+' and '+ION[B.an].txt+', or '+ION[B.cat].txt+' and '+ION[A.an].txt+', form an insoluble solid?';}
    if(o.same)return 'Mixing two samples of the same solution changes nothing.';
    if(o.redox)return '<b>Something does happen, but it is not a precipitation swap.</b> '+o.redox.note;
    if(o.ppt&&r.forms&&o.ppt.special==='feco3')return '<b>Fe³⁺ ions lock into rust-brown Fe(OH)₃</b>, taking OH⁻ from water, while the CO₃²⁻ ions pick up H⁺ and leave as CO₂ bubbles. Na⁺ and Cl⁻ are spectator ions.';
    if(o.ppt&&r.forms){const sp=o.spec.map(k=>ION[k].txt).join(' and ');return '<b>'+ION[o.pp.c].txt+' and '+ION[o.pp.a].txt+' lock together into solid '+o.ppt.txt+'</b>, a '+o.ppt.cn+' precipitate. '+(sp?sp+' never change: they are spectator ions and stay dissolved.':'');}
    if(o.ppt)return '<b>No precipitate this time.</b> '+o.ppt.txt+' is only slightly soluble, and the ions are too dilute (Q < Ksp), so they stay dissolved.';
    return '<b>No reaction.</b> Every possible combination of these ions is soluble, so all of them keep swimming freely. The mixture just looks like two clear solutions poured together.';},
  tour:[
    {title:'Two clear solutions',text:'The beaker holds silver nitrate, AgNO₃(aq). The test tube holds sodium chloride, NaCl(aq). Both are clear and colorless.',focus:[[40,40,330,330]],pause:true,setup(sim){BioLab.setValues(sim,{a:'AgNO3',b:'NaCl',hide:false});rebuild(sim);}},
    {title:'Zoom in: ions in water',text:'An ionic compound dissolves by splitting into ions. The zoom shows Ag⁺ and NO₃⁻ ions spread through the water. Water molecules are not drawn.',focus:[ZX-ZR-6,ZY-ZR-6,2*ZR+12,2*ZR+12],speed:1},
    {title:'Pour B into A',text:'Now Na⁺ and Cl⁻ ions pour in from the top and mix with the Ag⁺ and NO₃⁻ ions.',focus:[[40,40,330,330],[ZX-ZR-6,ZY-ZR-6,2*ZR+12,2*ZR+12]],speed:0.5,setup(sim){startMix(sim);}},
    {title:'The precipitate forms',text:'Ag⁺ and Cl⁻ attract so strongly that they lock into a solid lattice: white AgCl. In the beaker you see the mixture turn cloudy.',focus:[ZX-ZR,ZY+20,2*ZR,ZR-10],speed:0.5},
    {title:'Spectator ions',text:'Na⁺ and NO₃⁻ are in solution before and after. They are spectator ions. Fading them leaves only the ions that react.',focus:[ZX-ZR-6,ZY-ZR-6,2*ZR+12,2*ZR+12],speed:0.5,setup(sim){BioLab.setValues(sim,{hide:true});}},
    {title:'The net ionic equation',text:'Write only what changes: Ag⁺(aq) + Cl⁻(aq) → AgCl(s). The same net ionic equation describes any soluble silver salt mixed with any soluble chloride.',focus:[8,408,784,40],pause:true},
    {lvl:'ap',title:'How much solid?',text:'Mix 25.0 mL of 0.100 M of each: 2.50 mmol Ag⁺ and 2.50 mmol Cl⁻ make 2.50 mmol AgCl, 0.358 g. Change a volume and the smaller amount, the limiting ion, sets the mass.',focus:[8,408,784,40],pause:true}
  ],
  onTourExit(sim){BioLab.setValues(sim,{a:'AgNO3',b:'NaCl',hide:false});rebuild(sim);},
  onChallenge(sim,ch,phase){if(ch&&ch.instant&&ch.set&&phase==='done'){BioLab.setValues(sim,ch.set);rebuild(sim);startMix(sim);}},
  challenges:[
    {lvl:'bio',q:'You pour sodium chloride into silver nitrate. Both are clear. What do you see?',choices:['A white solid forms and the mixture turns cloudy','Bubbles of gas','Nothing: both solutions stay clear'],correct:0,
     baseline:{a:'AgNO3',b:'NaCl'},changeAction:'mix',changeText:'Poured B into A',watch:'ions',
     explain:{bio:'Ag⁺ and Cl⁻ form AgCl, which does not dissolve in water. It comes out of solution as a white precipitate. Na⁺ and NO₃⁻ stay dissolved.'}},
    {lvl:'bio',q:'You pour potassium iodide into sodium chloride. What happens?',choices:['A yellow precipitate forms','Nothing visible: every possible product is soluble','A white precipitate forms'],correct:1,
     baseline:{a:'NaCl',b:'KI'},changeAction:'mix',changeText:'Poured B into A',watch:'ions',
     explain:{bio:'The possible new pairs are NaI and KCl. Compounds of Na⁺ and K⁺ are always soluble, so all four ions keep swimming. Mixing two solutions does not always cause a reaction.'}},
    {lvl:'bio',q:'Lead(II) nitrate + potassium iodide gives a bright yellow solid. Which substance is the yellow solid?',choices:['PbI₂','KNO₃','Both of them'],correct:0,
     baseline:{a:'PbNO3',b:'KI'},changeAction:'mix',changeText:'Poured B into A',watch:'ions',
     explain:{bio:'Pb²⁺ and I⁻ form PbI₂, one of the few iodides that does not dissolve. KNO₃ is soluble because every nitrate and every potassium compound dissolves.'}},
    {lvl:'honors',instant:true,set:{a:'AgNO3',b:'NaCl',hide:true},q:'In AgNO₃(aq) + NaCl(aq) → AgCl(s) + NaNO₃(aq), which ions are spectators?',choices:['Ag⁺ and Cl⁻','Na⁺ and NO₃⁻','All four ions'],correct:1,
     explain:{honors:'Na⁺ and NO₃⁻ are dissolved before and after, so they cancel from the complete ionic equation. The model now shows the mixture with spectators faded: only Ag⁺ and Cl⁻ end up in the solid.'}},
    {lvl:'honors',q:'You mix copper(II) sulfate and sodium hydroxide. Which is the net ionic equation?',choices:['Cu²⁺(aq) + 2OH⁻(aq) → Cu(OH)₂(s)','2Na⁺(aq) + SO₄²⁻(aq) → Na₂SO₄(s)','CuSO₄(aq) + 2NaOH(aq) → Cu(OH)₂(s) + Na₂SO₄(aq)'],correct:0,
     baseline:{a:'CuSO4',b:'NaOH'},changeAction:'mix',changeText:'Poured B into A',watch:'ions',
     explain:{honors:'Cu(OH)₂ is the light blue precipitate (hydroxides are insoluble except with Group 1, Ba²⁺, Sr²⁺). Na₂SO₄ is soluble, so Na⁺ and SO₄²⁻ are spectators. The third choice is the molecular equation, not the net ionic one.'}},
    {lvl:'honors',q:'You pour barium chloride into blue copper(II) sulfate. What do you see?',choices:['A white solid forms and the liquid above it stays blue','A blue solid forms and the liquid turns clear','Nothing happens'],correct:0,
     baseline:{a:'CuSO4',b:'BaCl2'},changeAction:'mix',changeText:'Poured B into A',watch:'ions',
     explain:{honors:'Ba²⁺ + SO₄²⁻ → BaSO₄(s), which is white. The blue Cu²⁺ ions are spectators here (CuCl₂ is soluble), so the solution keeps its blue color. Color comes from the ions that stay dissolved.'}},
    {lvl:'ap',q:'You mix 25.0 mL of 0.100 M AgNO₃ with 25.0 mL of 0.100 M NaCl. What mass of AgCl forms?',choices:['0.179 g','0.358 g','0.717 g','3.58 g'],correct:1,
     baseline:{a:'AgNO3',b:'NaCl',va:25,vb:25,ca:0.1,cb:0.1},changeAction:'mix',changeText:'Poured B into A',watch:'ions',
     explain:{ap:'n(Ag⁺) = n(Cl⁻) = 0.0250 L × 0.100 M = 2.50 mmol, so 2.50 mmol AgCl × 143.32 g/mol = 0.358 g. Check the Mass of precipitate readout.'}},
    {lvl:'ap',q:'You mix 25.0 mL of 0.100 M Pb(NO₃)₂ with 25.0 mL of 0.100 M KI. Which ion is limiting?',choices:['Pb²⁺','I⁻','Neither, because the moles are equal'],correct:1,
     baseline:{a:'PbNO3',b:'KI',va:25,vb:25,ca:0.1,cb:0.1},changeAction:'mix',changeText:'Poured B into A',watch:'ions',
     explain:{ap:'Both supply 2.50 mmol, but PbI₂ needs 2 I⁻ for every Pb²⁺. The 2.50 mmol I⁻ makes only 1.25 mmol PbI₂ (0.576 g) and leaves 1.25 mmol Pb²⁺ in solution. Equal moles do not mean neither is limiting.'}},
    {lvl:'ap',q:'You mix 5 mL of 0.05 M Pb(NO₃)₂ with 50 mL of 0.05 M NaCl. PbCl₂ has Ksp = 1.7 × 10⁻⁵. Does a precipitate form?',choices:['Yes: chlorides of Pb²⁺ are on the insoluble list, so it always forms','No: Q is about 9.4 × 10⁻⁶, which is less than Ksp'],correct:1,
     baseline:{a:'PbNO3',b:'NaCl',va:5,vb:50,ca:0.05,cb:0.05},changeAction:'mix',changeText:'Poured B into A',watch:'ions',
     explain:{ap:'[Pb²⁺] = 0.25 mmol / 55 mL = 0.0045 M and [Cl⁻] = 0.045 M. Q = [Pb²⁺][Cl⁻]² = 9.4 × 10⁻⁶ < Ksp, so the mixture stays clear. Solubility rules are a shortcut; Ksp decides for slightly soluble salts.'}}
  ],
  lab:{bio:'<p><b>Question:</b> Which pairs of solutions make a precipitate?</p><ol><li>Choose Solution A and Solution B. Predict: precipitate or no reaction?</li><li>Press Pour B into A and record a trial with what you saw (color of any solid).</li><li>Test at least eight different pairs. Use sodium nitrate-free pairs too, like NaCl + KI.</li></ol><p>Find a pattern: which ions show up in every precipitate you made?</p>',
       honors:'<p><b>Question:</b> How do the solubility rules predict a double-replacement reaction?</p><ol><li>For six pairs, write both possible new compounds and use the rules to predict which, if any, is insoluble.</li><li>Mix each pair and record a trial. Turn on “Fade the spectator ions”.</li><li>Write the molecular, complete ionic and net ionic equations, then check them against the panel.</li></ol><p>Explain why AgNO₃ + NaCl and AgNO₃ + BaCl₂ have the same net ionic equation.</p>',
       ap:'<p><b>Question:</b> How do the amounts mixed decide the mass of precipitate?</p><ol><li>Use Pb(NO₃)₂ + KI. Keep A at 25 mL of 0.10 M. Record the precipitate mass for B volumes of 5 to 50 mL.</li><li>Plot volume of B (x) against mass of precipitate (y) on the Trials graph.</li><li>Find where the graph levels off.</li></ol><p><b>Claim–evidence–reasoning:</b> Explain the break in the graph using the limiting ion and the 1 : 2 mole ratio.</p>'},
  terms:[{t:'Precipitate',d:'An insoluble solid that forms when two solutions are mixed.'},{t:'Aqueous (aq)',d:'Dissolved in water. Ionic compounds in solution are present as separate ions.'},{t:'Double replacement',d:'AB + CD → AD + CB: the cations swap partners.'},{t:'Solubility rules',d:'Guidelines that say which ionic compounds dissolve in water.'},
    {lvl:'honors',t:'Spectator ion',d:'An ion present before and after the reaction, unchanged. It cancels from the net ionic equation.'},{lvl:'honors',t:'Complete ionic equation',d:'Every dissolved strong electrolyte written as separate ions.'},{lvl:'honors',t:'Net ionic equation',d:'Only the species that change: the complete ionic equation with spectators removed.'},
    {lvl:'ap',t:'Limiting reactant (ion)',d:'The ion that runs out first. It sets the amount of precipitate.'},{lvl:'ap',t:'Ksp and Q',d:'Ksp is the solubility product at saturation. If the ion product Q is greater than Ksp, a precipitate forms.'}],
  about:'<p>The tool decides each mix with the standard solubility rules (from ChemLab, the same rules on every page). For a salt the rules call insoluble, it also compares the ion product Q (after mixing, before reacting) with the real Ksp at 25 °C, so very dilute mixtures of slightly soluble salts such as PbCl₂ and Ag₂SO₄ can stay clear. Equations are balanced by a search over small whole numbers, so every equation shown is balanced by code; complete and net ionic equations are built by splitting the soluble strong electrolytes into ions and cancelling spectators.</p>'+
    '<p>Precipitate mass assumes the reaction goes to completion and ignores the small amount that stays dissolved. Real precipitates: AgCl white, AgI pale yellow, PbI₂ bright yellow, Cu(OH)₂ light blue, Fe(OH)₃ rust brown; Ag₂O forms (brown) instead of AgOH, and Fe(OH)₃ plus CO₂ forms instead of Fe₂(CO₃)₃. Copper(II) carbonate is really a basic carbonate. CuSO₄ + KI and FeCl₃ + KI are redox reactions and are shown that way.</p>'+
    '<p>In the zoom, each ball stands for a fixed number of formula units (shown at the bottom of the zoom), so particle counts are in proportion to moles, rounded to whole particles. Ions are drawn the same size for clarity, not to scale. Safety: silver nitrate stains skin, and lead and barium compounds are toxic. Wear goggles and gloves, and dispose of heavy metals in the waste container, never the sink.</p>'+
    '<p><b>The virtual lab bench</b> (Gravimetric Analysis, AP Chemistry). The bench runs CaCl₂ + Na₂CO₃ → CaCO₃ + 2NaCl to completion with the limiting reactant, at 100.09 g/mol for CaCO₃. The analytical balance shows the true mass on the pan minus the tare, to 0.001 g, with a last digit that wanders by ±0.001 g. The “anhydrous” CaCl₂ holds 1 to 3% absorbed water. Losses: about 2% of the solid stays in the beaker, cut by 70% with each rinse; about 4% passes the paper as fine particles if the carbonate goes in all at once, much less if it goes in slowly with stirring and less again after 10 minutes of digestion. The damp cake holds solution with dissolved NaCl (and any excess reagent) until it is washed, and dried filter paper weighs about 1% less than paper weighed at room humidity. In the oven, water leaves the surface quickly and the inside of clumps more slowly unless you break them up. Dissolved CaCO₃ (well under 1 mg) is ignored. Each student’s bench has its own seeded glassware masses, scoop sizes and reagent variation.</p>',
  initVis(sim){sim.vis.dots=[];for(let i=0;i<70;i++)sim.vis.dots.push([Math.random(),Math.random(),Math.random()]);},
  thumbSetup(sim){sim.p.a='PbNO3';sim.p.b='KI';rebuild(sim);startMix(sim);for(let i=0;i<120;i++)stepParts(sim,0.05);},
  thumbFrames:4,
  draw(sim,ctx,vdt,k,t){if(sim.st.G&&sim.vlab){gDraw(sim,ctx,vdt,k,t);return;}const st=sim.st,r=st.res,o=r.o,p=sim.p,hon=atLeast('honors'),ap=atLeast('ap'),T=st.mixT,mixed=st.mixed;const A=SOL[p.a],B=SOL[p.b];
    ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);ctx.fillStyle=PAL['cv-bench'];ctx.fillRect(0,318,400,8);
    // ----- macroscopic: beaker with A, tube with B -----
    const bx=90,by=130,bw=190,bh=188;const water=PAL['cv-water'];
    const pourF=mixed?clamp(T/1.0,0,1):0,fillA=0.42+(mixed?0.4*pourF:0);
    let liq=A.col?mixHex(water,A.col,0.75):water;
    if(mixed&&!o.same){const mm=r.mm,V=r.V;let colIon=null,cc=0;
      ['Cu','Fe'].forEach(ci=>{if(mm[ci]){let left=mm[ci];if(o.ppt&&r.forms&&o.pp.c===ci)left-=r.mol*o.ppt.x;if(o.redox)left=0;cc=Math.max(cc,left/V/0.05);colIon=ci;}});
      const solCol=colIon==='Cu'?'#5aa9e6':'#e3a33b';const mixT=clamp((T-0.6)/1.5,0,1);liq=mixHex(liq,colIon?mixHex(water,solCol,clamp(cc,0,1)*0.75):water,mixT);
      if(o.redox)liq=mixHex(liq,o.redox.liq,clamp((T-1)/2,0,1)*0.85);}
    const L=CL.drawBeaker(ctx,{x:bx,y:by,w:bw,h:bh,fill:fillA,liquid:liq});
    // precipitate: cloud that settles
    const pc=o.ppt&&r.forms?o.ppt.col:o.redox&&o.redox.ppt?o.redox.col:null;
    if(mixed&&pc){const amt=clamp(r.mol/1.5,0.25,1),grow=clamp((T-1.2)/1.6,0,1),settle=clamp((T-4)/5,0,1);
      ctx.save();ctx.beginPath();ctx.rect(L.x+2,L.y,L.w-4,L.h-2);ctx.clip();ctx.globalAlpha=(0.62*grow*(1-0.7*settle)*amt+0.06)*grow;ctx.fillStyle=pc;ctx.fillRect(L.x,L.y,L.w,L.h);ctx.globalAlpha=1;
      sim.vis.dots.forEach(d=>{const yy=lerp(L.y+d[1]*L.h,L.y+L.h-6-d[2]*14*amt,settle),xx=L.x+6+d[0]*(L.w-12);ctx.globalAlpha=grow;ctx.fillStyle=pc;ctx.beginPath();ctx.arc(xx,yy,2.2,0,6.29);ctx.fill();ctx.strokeStyle='rgba(0,0,0,.4)';ctx.lineWidth=0.7;ctx.stroke();});
      ctx.globalAlpha=1;const lay=settle*amt*16;if(lay>0.5){ctx.fillStyle=pc;ctx.fillRect(L.x,L.y+L.h-lay,L.w,lay);ctx.strokeStyle='rgba(0,0,0,.25)';ctx.strokeRect(L.x,L.y+L.h-lay,L.w,lay);}ctx.restore();}
    if(mixed&&o.ppt&&o.ppt.special==='feco3'&&T>1.4&&T<7){ctx.strokeStyle=PAL['cv-bstroke'];ctx.lineWidth=1.2;for(let i=0;i<10;i++){const yy=L.y+L.h-((T*60+i*37)%L.h);ctx.beginPath();ctx.arc(L.x+20+((i*53)%(L.w-40)),yy,3,0,6.29);ctx.stroke();}}
    // test tube B: stands right of the beaker, tilts over it to pour
    const tp=mixed?Math.sin(Math.PI*clamp(T/1.0,0,1)):0,tx=lerp(330,bx+bw-30,tp),ty=lerp(170,80,tp),ang=lerp(0,-2.0,tp);
    ctx.save();ctx.translate(tx,ty);ctx.rotate(ang);const tw=30,th=120,bFill=mixed?Math.max(0,1-T/0.9):1;
    ctx.fillStyle=B.col?mixHex(water,B.col,0.75):water;if(bFill>0){ctx.save();ctx.beginPath();ctx.rect(-tw/2,-th/2+th*(1-0.7*bFill),tw,th);ctx.clip();rr(ctx,-tw/2,-th/2,tw,th,tw/2);ctx.fill();ctx.restore();}
    ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(-tw/2,-th/2);ctx.lineTo(-tw/2,th/2-tw/2);ctx.arc(0,th/2-tw/2,tw/2,Math.PI,0,true);ctx.lineTo(tw/2,-th/2);ctx.stroke();ctx.restore();
    if(mixed&&T>0.25&&T<0.95){ctx.strokeStyle=B.col?mixHex(water,B.col,0.75):PAL['cv-bstroke'];ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(tx-48,ty+8);ctx.quadraticCurveTo(tx-60,ty+40,tx-62,L.y);ctx.stroke();}
    // labels under the glassware
    txt(ctx,'A (beaker): '+A.txt+'(aq)',20,366,{s:13*k,w:700});txt(ctx,'B (test tube): '+B.txt+'(aq)',20,366+19*k,{s:13*k,w:700,c:PAL['cv-soft']});
    let res=resultText(sim);pill(ctx,mixed?(o.react&&(r.forms||o.redox)?res:'No precipitate'):'Not mixed yet',bx+bw/2,40,mixed&&(r.forms||o.redox&&o.redox.ppt)?'#1b5e9a':'#5d5d63','#fff',13*k);
    // ----- zoom -----
    const zsx=bx+bw*0.62,zsy=L.y+Math.min(40,L.h*0.4);ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=1.2;ctx.setLineDash([4,4]);ctx.beginPath();ctx.arc(zsx,zsy,9,0,6.29);ctx.moveTo(zsx+6,zsy-7);ctx.lineTo(ZX-ZR*0.72,ZY-ZR*0.7);ctx.moveTo(zsx+6,zsy+7);ctx.lineTo(ZX-ZR*0.72,ZY+ZR*0.7);ctx.stroke();ctx.setLineDash([]);
    ctx.save();ctx.beginPath();ctx.arc(ZX,ZY,ZR,0,6.29);ctx.fillStyle=PAL['cv-sol'];ctx.fill();ctx.clip();
    if(mixed&&pc){const sites=st.parts.filter(q=>q.lock&&T>q.t0+0.6).map(q=>q.lock);if(sites.length){ctx.fillStyle=pc;ctx.strokeStyle='rgba(0,0,0,.22)';ctx.lineWidth=1;sites.forEach(s=>{ctx.beginPath();ctx.arc(s.x,s.y,17,0,6.29);ctx.fill();ctx.stroke();});}}
    const spec=new Set(o.spec||[]);
    st.parts.forEach(q=>{if(q.gone)return;if(q.src==='B'&&(!mixed||T<0.6))return;const I=ION[q.ion];let al=1;if(p.hide&&hon&&mixed&&spec.has(q.ion))al=0.18;
      if(q.gas){CL.drawAtom(ctx,q.x-8,q.y,7,'O',{label:''});CL.drawAtom(ctx,q.x+8,q.y,7,'O',{label:''});CL.drawAtom(ctx,q.x,q.y,7.5,'C',{label:''});return;}
      ionBall(ctx,q.x,q.y,I,al);});
    if(mixed&&o.redox&&T>1.2)pill(ctx,'Redox, not a swap',ZX,ZY,'#6a1b9a','#fff',12*k);
    ctx.restore();ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=3;ctx.beginPath();ctx.arc(ZX,ZY,ZR,0,6.29);ctx.stroke();
    txt(ctx,'Zoom: ions in the beaker',ZX,ZY-ZR-12,{s:13*k,w:700,a:'center'});
    // legend (ions present)
    const ions=[...new Set(st.parts.filter(q=>q.src==='A'||mixed).map(q=>q.ion))];const ly=ZY+ZR+22*k;
    const colW=360/Math.min(ions.length,4);ions.slice(0,4).forEach((ik,i)=>{const I=ION[ik],lx=422+colW*i;ctx.save();ctx.beginPath();CL.drawAtom(ctx,lx+8,ly-4*k,8,I.s,{color:I.col,label:''});ctx.restore();
      txt(ctx,I.txt,lx+20,ly,{s:13*k,w:700,b:'middle',c:PAL['cv-ink']});});
    // net ionic band
    let eqs='';if(mixed&&T>1.4){if(o.same)eqs='Same solution: nothing to react';else if(!o.react)eqs='No reaction (NR): all ions stay dissolved';else if(o.ppt&&!r.forms)eqs='Q < Ksp: no precipitate forms';else eqs='Net ionic: '+fmtNet(o,false);}
    else eqs='Predict: will '+ION[A.cat].txt+' + '+ION[B.an].txt+' or '+ION[B.cat].txt+' + '+ION[A.an].txt+' form a solid?';
    let fs=15*k;ctx.font='700 '+fs+'px '+FONT;const w=ctx.measureText(eqs).width;if(w>780)fs*=780/w;
    ctx.fillStyle=PAL['card'];rr(ctx,8,428-fs*0.95,784,fs*1.7,8);ctx.fill();txt(ctx,eqs,400,428-fs*0.1,{s:fs,w:700,a:'center',b:'middle'});
  }
};
BioLab.register(PRE);
})();
