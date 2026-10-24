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
    {id:'cb',label:'Molarity of B',type:'range',min:0.05,max:0.5,step:0.05,def:0.1,unit:' M',lvl:'ap',onChange:rebuild}
  ],
  actions:[{id:'mix',label:'Pour B into A',lvl:'bio',primary:true,run(sim){startMix(sim);}},{id:'refill',label:'Fresh solutions',lvl:'bio',run(sim){rebuild(sim);}}],
  init(sim){const st={parts:[],mixed:false,mixT:0};sim.st=st;rebuild(sim);return st;},
  step(sim,dt){stepParts(sim,Math.min(dt,0.05));if(sim.st.mixed&&Math.abs(sim.st.mixT-2.2)<dt)sim.infoDirty=true;},
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
  narrate(sim){const st=sim.st,r=st.res,o=r.o,A=SOL[sim.p.a],B=SOL[sim.p.b];
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
    '<p>In the zoom, each ball stands for a fixed number of formula units (shown at the bottom of the zoom), so particle counts are in proportion to moles, rounded to whole particles. Ions are drawn the same size for clarity, not to scale. Safety: silver nitrate stains skin, and lead and barium compounds are toxic. Wear goggles and gloves, and dispose of heavy metals in the waste container, never the sink.</p>',
  initVis(sim){sim.vis.dots=[];for(let i=0;i<70;i++)sim.vis.dots.push([Math.random(),Math.random(),Math.random()]);},
  thumbSetup(sim){sim.p.a='PbNO3';sim.p.b='KI';rebuild(sim);startMix(sim);for(let i=0;i<120;i++)stepParts(sim,0.05);},
  thumbFrames:4,
  draw(sim,ctx,vdt,k,t){const st=sim.st,r=st.res,o=r.o,p=sim.p,hon=atLeast('honors'),ap=atLeast('ap'),T=st.mixT,mixed=st.mixed;const A=SOL[p.a],B=SOL[p.b];
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
