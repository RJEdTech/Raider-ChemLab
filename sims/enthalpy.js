(function(){
'use strict';
const {clamp,lerp,rr,txt,pill,atLeast,PAL,FONT,RM,axes,bars,legend}=BioLab.h;
const CL=window.ChemLab;
const hon=()=>atLeast('honors'),ap=()=>atLeast('ap');
const sgn=(v,d)=>(v<0?'−':v>0?'+':'')+Math.abs(v).toFixed(d===undefined?1:d);
const IN_COL='#c0392b',OUT_COL='#2d6bd2';

/* ---------- bond enthalpies (average, kJ/mol, gas phase; NO uses its own bond energy) ---------- */
const BE={'H–H':436,'Cl–Cl':242,'H–Cl':431,'C–H':413,'O=O':498,'C=O':799,'O–H':463,'N≡N':945,'N–H':391,'N=O':631};
/* molecule templates: atoms [el,dx,dy], bonds [a,b,order,name] */
const MOL={
  H2:{a:[['H',-16,0],['H',16,0]],b:[[0,1,1,'H–H']]},
  Cl2:{a:[['Cl',-21,0],['Cl',21,0]],b:[[0,1,1,'Cl–Cl']]},
  HCl:{a:[['H',-22,0],['Cl',12,0]],b:[[0,1,1,'H–Cl']]},
  CH4:{a:[['C',0,0],['H',0,-35],['H',35,0],['H',0,35],['H',-35,0]],b:[[0,1,1,'C–H'],[0,2,1,'C–H'],[0,3,1,'C–H'],[0,4,1,'C–H']]},
  O2:{a:[['O',-18,0],['O',18,0]],b:[[0,1,2,'O=O']]},
  CO2:{a:[['O',-38,0],['C',0,0],['O',38,0]],b:[[0,1,2,'C=O'],[1,2,2,'C=O']]},
  H2O:{a:[['O',0,-6],['H',-27,14],['H',27,14]],b:[[0,1,1,'O–H'],[0,2,1,'O–H']]},
  N2:{a:[['N',-17,0],['N',17,0]],b:[[0,1,3,'N≡N']]},
  NH3:{a:[['N',0,-4],['H',0,-39],['H',-31,17],['H',31,17]],b:[[0,1,1,'N–H'],[0,2,1,'N–H'],[0,3,1,'N–H']]},
  NO:{a:[['N',-18,0],['O',18,0]],b:[[0,1,2,'N=O']]}
};
/* reactions for the bond-enthalpy view; dH = accepted ΔH° (kJ, from ΔH°f data) */
const RXN={
  hcl:{eq:'H₂(g) + Cl₂(g) → 2HCl(g)',R:[['H2',150,258],['Cl2',345,258]],P:[['HCl',248,192],['HCl',248,322]],dH:-184.6},
  ch4:{eq:'CH₄(g) + 2O₂(g) → CO₂(g) + 2H₂O(g)',R:[['CH4',125,258],['O2',310,192],['O2',310,322]],P:[['CO2',165,258],['H2O',370,190],['H2O',370,328]],dH:-802.3},
  nh3:{eq:'N₂(g) + 3H₂(g) → 2NH₃(g)',R:[['N2',125,258],['H2',305,170],['H2',305,258],['H2',305,346]],P:[['NH3',190,262],['NH3',355,262]],dH:-91.8},
  h2o:{eq:'2H₂O(g) → 2H₂(g) + O₂(g)',R:[['H2O',165,200],['H2O',165,322]],P:[['H2',235,172],['O2',350,258],['H2',235,344]],dH:483.6},
  no:{eq:'N₂(g) + O₂(g) → 2NO(g)',R:[['N2',150,258],['O2',345,258]],P:[['NO',248,192],['NO',248,322]],dH:180.6}
};
const RAD={H:15.5,C:21.5,N:21.5,O:21.5,Cl:25};const MS=1.45;   // molecule template scale
const PH={R:2,B1:5.5,A:6.5,F1:10,END:13};    // animation clock (s): reactants, breaking, apart, forming, products
function build(key){const r=RXN[key];if(r.built)return r;const atoms=[],rb=[],pb=[];
  r.R.forEach(([m,x,y])=>{const M=MOL[m],base=atoms.length;M.a.forEach(([el,dx,dy])=>atoms.push({el,R:[x+dx*MS,y+dy*MS]}));M.b.forEach(([a,b,o,n])=>rb.push({a:base+a,b:base+b,o,n,E:BE[n]}));});
  const pa=[];r.P.forEach(([m,x,y])=>{const M=MOL[m],base=pa.length;M.a.forEach(([el,dx,dy])=>pa.push({el,P:[x+dx*MS,y+dy*MS]}));M.b.forEach(([a,b,o,n])=>pb.push({a:base+a,b:base+b,o,n,E:BE[n]}));});
  // map product atoms onto reactant atoms of the same element, in order
  const used=new Set(),map=[];pa.forEach((q,j)=>{const i=atoms.findIndex((a,i)=>a.el===q.el&&!used.has(i));used.add(i);map[j]=i;atoms[i].P=q.P;});
  pb.forEach(b=>{b.a=map[b.a];b.b=map[b.b];});
  const C=[265,258];atoms.forEach(a=>{const m=[(a.R[0]+a.P[0])/2,(a.R[1]+a.P[1])/2];a.A=[clamp(C[0]+(m[0]-C[0])*1.55,40,490),clamp(C[1]+(m[1]-C[1])*1.5,140,372)];});
  for(let it=0;it<80;it++)for(let i=0;i<atoms.length;i++)for(let j=i+1;j<atoms.length;j++){const A1=atoms[i].A,A2=atoms[j].A,dx=A2[0]-A1[0],dy=A2[1]-A1[1],d=Math.hypot(dx,dy)||1;if(d<66){const m=(66-d)/2,ux=dx/d,uy=dy/d;A1[0]=clamp(A1[0]-ux*m,40,490);A1[1]=clamp(A1[1]-uy*m,150,372);A2[0]=clamp(A2[0]+ux*m,40,490);A2[1]=clamp(A2[1]+uy*m,150,372);}}
  rb.forEach((b,i)=>b.t=PH.R+0.25+(PH.B1-PH.R-0.5)*(rb.length>1?i/(rb.length-1):0.5));
  pb.forEach((b,i)=>b.t=PH.A+0.25+(PH.F1-PH.A-0.5)*(pb.length>1?i/(pb.length-1):0.5));
  atoms.forEach((a,i)=>{const br=rb.filter(b=>b.a===i||b.b===i).map(b=>b.t),fm=pb.filter(b=>b.a===i||b.b===i).map(b=>b.t);a.tb=br.length?Math.max(...br):PH.R;a.tf=fm.length?Math.min(...fm):PH.F1;});
  r.atoms=atoms;r.rb=rb;r.pb=pb;r.inE=rb.reduce((s,b)=>s+b.E,0);r.outE=pb.reduce((s,b)=>s+b.E,0);r.est=r.inE-r.outE;r.built=true;return r;}
Object.keys(RXN).forEach(build);
function phase(c){return c<PH.R?'R':c<PH.B1?'B':c<PH.A?'A':c<PH.F1?'F':'P';}
const PHNAME={R:'Reactants',B:'Breaking bonds: energy in',A:'Atoms apart: highest energy',F:'Forming bonds: energy out',P:'Products'};
function energyNow(r,c){return r.rb.filter(b=>c>=b.t).reduce((s,b)=>s+b.E,0)-r.pb.filter(b=>c>=b.t).reduce((s,b)=>s+b.E,0);}

/* ---------- Hess's law puzzles ---------- */
const SP={C:'C(s)',O2:'O₂(g)',CO2:'CO₂(g)',CO:'CO(g)',N2:'N₂(g)',NO:'NO(g)',NO2:'NO₂(g)',H2:'H₂(g)',H2Ol:'H₂O(l)',C2H2:'C₂H₂(g)',CH4:'CH₄(g)'};
const PUZ={
  co:{n:'Make carbon monoxide',target:{C:-1,O2:-0.5,CO:1},dH:-110.5,eqs:[{s:{C:-1,O2:-1,CO2:1},dH:-393.5},{s:{CO:-1,O2:-0.5,CO2:1},dH:-283.0}],sol:[1,-1]},
  no2:{n:'Make nitrogen dioxide',target:{N2:-1,O2:-2,NO2:2},dH:66.4,eqs:[{s:{N2:-1,O2:-1,NO:2},dH:180.6},{s:{NO2:-2,NO:2,O2:1},dH:114.2}],sol:[1,-1]},
  c2h2:{n:'Make acetylene',target:{C:-2,H2:-1,C2H2:1},dH:226.7,eqs:[{s:{C2H2:-1,O2:-2.5,CO2:2,H2Ol:1},dH:-1299.5},{s:{C:-1,O2:-1,CO2:1},dH:-393.5},{s:{H2:-1,O2:-0.5,H2Ol:1},dH:-285.8}],sol:[-1,2,1],lvl:'honors'},
  ch4f:{n:'Make methane',target:{C:-1,H2:-2,CH4:1},dH:-74.8,eqs:[{s:{CH4:-1,O2:-2,CO2:1,H2Ol:2},dH:-890.3},{s:{C:-1,O2:-1,CO2:1},dH:-393.5},{s:{H2:-1,O2:-0.5,H2Ol:1},dH:-285.8}],sol:[-1,1,2],lvl:'ap'}
};
function puz(p){return PUZ[p.puz]||PUZ.co;}
function mults(p){return [p.m1,p.m2,p.m3].slice(0,puz(p).eqs.length);}
function hessSum(p){const P=puz(p),m=mults(p),net={};let dH=0;P.eqs.forEach((e,i)=>{dH+=m[i]*e.dH;for(const k in e.s)net[k]=(net[k]||0)+m[i]*e.s[k];});
  for(const k in net)if(Math.abs(net[k])<1e-9)delete net[k];
  const keys=new Set([...Object.keys(net),...Object.keys(P.target)]);let match=true;keys.forEach(k=>{if(Math.abs((net[k]||0)-(P.target[k]||0))>1e-9)match=false;});return {net,dH,match};}
const FR={0.25:'¼',0.5:'½',0.75:'¾'};
function coef(x){x=Math.abs(x);if(Math.abs(x-1)<1e-9)return '';if(Math.abs(x-Math.round(x))<1e-9)return String(Math.round(x));const f=x-Math.floor(x);
  if(Math.floor(x)===0&&FR[+f.toFixed(2)])return FR[+f.toFixed(2)];if(Math.abs(x*2-Math.round(x*2))<1e-9)return Math.round(x*2)+'/2';if(Math.abs(x*4-Math.round(x*4))<1e-9)return Math.round(x*4)+'/4';return x.toFixed(2);}
function sides(s){const L=[],R=[];Object.keys(s).forEach(k=>{if(s[k]<0)L.push([k,-s[k]]);else if(s[k]>0)R.push([k,s[k]]);});return [L,R];}
function eqText(s){const [L,R]=sides(s),f=a=>a.map(([k,c])=>coef(c)+SP[k]).join(' + ');return (f(L)||'nothing')+' → '+(f(R)||'nothing');}

/* ---------- formation data (ΔH°f, kJ/mol, 25 °C) ---------- */
const HF={'CH4(g)':-74.8,'O2(g)':0,'CO2(g)':-393.5,'H2O(l)':-285.8,'H2O(g)':-241.8,'C3H8(g)':-103.8,'C6H12O6(s)':-1273.3,'Fe2O3(s)':-824.2,'Al(s)':0,'Al2O3(s)':-1675.7,'Fe(s)':0,'CaCO3(s)':-1206.9,'CaO(s)':-635.1,'N2(g)':0,'H2(g)':0,'NH3(g)':-45.9,'H2O2(l)':-187.8};
const FRX={
  ch4:{n:'Burning methane',R:[[1,'CH4(g)'],[2,'O2(g)']],P:[[1,'CO2(g)'],[2,'H2O']],water:true},
  c3h8:{n:'Burning propane',R:[[1,'C3H8(g)'],[5,'O2(g)']],P:[[3,'CO2(g)'],[4,'H2O']],water:true},
  glu:{n:'Burning glucose (respiration)',R:[[1,'C6H12O6(s)'],[6,'O2(g)']],P:[[6,'CO2(g)'],[6,'H2O']],water:true},
  thermite:{n:'Thermite',R:[[1,'Fe2O3(s)'],[2,'Al(s)']],P:[[1,'Al2O3(s)'],[2,'Fe(s)']]},
  caco3:{n:'Decomposing limestone',R:[[1,'CaCO3(s)']],P:[[1,'CaO(s)'],[1,'CO2(g)']]},
  nh3:{n:'Haber process',R:[[1,'N2(g)'],[3,'H2(g)']],P:[[2,'NH3(g)']]},
  h2o2:{n:'Decomposing hydrogen peroxide',R:[[2,'H2O2(l)']],P:[[2,'H2O(l)'],[1,'O2(g)']]}
};
function fsp(sp,p){return sp==='H2O'?'H2O('+p.ws+')':sp;}
function form(p){const r=FRX[p.fr]||FRX.ch4,row=([n,sp])=>{const s=fsp(sp,p);return {n,s,hf:HF[s],v:n*HF[s]};};const R=r.R.map(row),P=r.P.map(row);
  const sR=R.reduce((a,b)=>a+b.v,0),sP=P.reduce((a,b)=>a+b.v,0);return {r,R,P,sR,sP,dH:sP-sR};}
const fspTxt=s=>CL.fmt(s.replace(/\((s|l|g|aq)\)$/,''))+s.match(/\((s|l|g|aq)\)$/)[0];
function formEq(F){const t=a=>a.map(x=>(x.n>1?x.n:'')+fspTxt(x.s)).join(' + ');return t(F.R)+' → '+t(F.P);}

/* ---------- mode syncing ---------- */
function syncMode(sim){const p=sim.p;if(!atLeast('honors')&&p.mode!=='bonds')BioLab.setValues(sim,{mode:'bonds'});if(!atLeast('ap')&&p.mode==='form')BioLab.setValues(sim,{mode:'bonds'});
  if(!sim.ui||!sim.ui.sec)return;const mode=p.mode,d=sim.def,n3=puz(p).eqs.length>2;
  d.controls.forEach(c=>{if(!c.modes)return;const cid=d.id+'-'+c.id,e=document.getElementById(cid)||document.getElementById(cid+'-l');if(!e)return;const w=e.closest('.ctl');
    let show=atLeast(c.lvl)&&c.modes.includes(mode);if(c.id==='m3'&&!n3)show=false;if(c.id==='ws'&&!(FRX[p.fr]||{}).water)show=false;if(w)w.hidden=!show;});
  d.metrics.forEach(m=>{if(!m.modes)return;const t=sim.ui.tiles[m.id];if(!t)return;const w=t.num.closest('.tile');if(w)w.hidden=!atLeast(m.lvl)||!m.modes.includes(mode);});
  const btns=[...sim.ui.sec.querySelectorAll('.actions button')];d.actions.forEach(a=>{const b=btns.find(x=>x.textContent===a.label);if(b)b.hidden=!atLeast(a.lvl)||!a.modes.includes(mode);});}

/* ---------- drawing ---------- */
function fitFont(ctx,s,size,w,maxW,k){let z=size;ctx.font=w+' '+z*k+'px '+FONT;while(z>12&&ctx.measureText(s).width>maxW){z-=0.5;ctx.font=w+' '+z*k+'px '+FONT;}return z*k;}
function panel(ctx,lines,k){let w=0;lines=lines.map(l=>Object.assign({},l,{px:fitFont(ctx,l.t,l.s,l.w||400,740,k)}));lines.forEach(l=>{ctx.font=(l.w||400)+' '+l.px+'px '+FONT;w=Math.max(w,ctx.measureText(l.t).width);});
  const lh=lines.map(l=>l.px*1.35),h=lh.reduce((a,b)=>a+b,0)+14;rr(ctx,12,10,Math.min(776,w+28),h,10);ctx.fillStyle=PAL['card'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
  let y=18;lines.forEach((l,i)=>{y+=lh[i];txt(ctx,l.t,26,y-lh[i]*0.28,{s:l.px,w:l.w||400,c:l.c||PAL['cv-ink']});});return 10+h;}
function arrowV(ctx,x,y1,y2,c,w){const dir=Math.sign(y2-y1)||1,h=11;if(Math.abs(y2-y1)<h+2)return;ctx.strokeStyle=c;ctx.fillStyle=c;ctx.lineWidth=w;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x,y1);ctx.lineTo(x,y2-dir*h*0.8);ctx.stroke();
  ctx.beginPath();ctx.moveTo(x,y2);ctx.lineTo(x-7,y2-dir*h);ctx.lineTo(x+7,y2-dir*h);ctx.closePath();ctx.fill();}
function level(ctx,x1,x2,y,c){ctx.strokeStyle=c||PAL['cv-ink'];ctx.lineWidth=4;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x1,y);ctx.lineTo(x2,y);ctx.stroke();}
function bondLine(ctx,a,b,o,alpha,col){const dx=b[0]-a[0],dy=b[1]-a[1],L=Math.hypot(dx,dy)||1,nx=-dy/L*4.5,ny=dx/L*4.5;ctx.globalAlpha=alpha;ctx.strokeStyle=col||PAL['cv-soft'];ctx.lineWidth=3.2;ctx.lineCap='round';
  const offs=o===1?[0]:o===2?[-1,1]:[-1.6,0,1.6];offs.forEach(f=>{ctx.beginPath();ctx.moveTo(a[0]+nx*f,a[1]+ny*f);ctx.lineTo(b[0]+nx*f,b[1]+ny*f);ctx.stroke();});ctx.globalAlpha=1;}
const ease=f=>f<0.5?2*f*f:1-2*(1-f)*(1-f);

function drawBonds(sim,ctx,k,t){const p=sim.p,st=sim.st,r=build(p.rxn),c=st.clk,ph=phase(c),hn=hon();
  const pos=r.atoms.map(a=>{const L=(P1,P2,f)=>{f=ease(clamp(f,0,1));return [lerp(P1[0],P2[0],f),lerp(P1[1],P2[1],f)];};
    if(c<PH.B1-0.3)return L(a.R,a.A,c<PH.R?0:0.12*clamp((c-PH.R)/(a.tb-PH.R+1e-6),0,1));   // bonds stretch a little, snap, then the loose atoms drift apart
    if(c<PH.A)return L(a.R,a.A,0.12+0.88*(c-PH.B1+0.3)/0.8);
    const t0=Math.max(PH.A,a.tf-1.1);if(c<t0)return a.A;return L(a.A,a.P,(c-t0)/(a.tf-t0+1e-6));});
  const jig=RM?0:1.2;const P=pos.map((q,i)=>[q[0]+Math.sin(t*6+i*1.7)*jig,q[1]+Math.cos(t*7+i*2.1)*jig]);
  // bonds: reactant bonds stretch and snap; product bonds appear as they form
  r.rb.forEach(b=>{if(c<b.t){const str=clamp((c-PH.R)/(b.t-PH.R+1e-6),0,1);bondLine(ctx,P[b.a],P[b.b],b.o,1-0.35*str);}
    else if(c<b.t+0.45){const m=[(P[b.a][0]+P[b.b][0])/2,(P[b.a][1]+P[b.b][1])/2],f=(c-b.t)/0.45;ctx.globalAlpha=1-f;ctx.fillStyle=IN_COL;ctx.beginPath();ctx.arc(m[0],m[1],6+f*16,0,6.29);ctx.fill();ctx.globalAlpha=1;}});
  r.pb.forEach(b=>{if(c>=b.t){bondLine(ctx,P[b.a],P[b.b],b.o,1);if(c<b.t+0.45){const m=[(P[b.a][0]+P[b.b][0])/2,(P[b.a][1]+P[b.b][1])/2],f=(c-b.t)/0.45;ctx.globalAlpha=1-f;ctx.strokeStyle=OUT_COL;ctx.lineWidth=3;ctx.beginPath();ctx.arc(m[0],m[1],6+f*16,0,6.29);ctx.stroke();ctx.globalAlpha=1;}}});
  r.atoms.forEach((a,i)=>CL.drawAtom(ctx,P[i][0],P[i][1],RAD[a.el],a.el,{s:Math.max(12,RAD[a.el]*0.9)}));
  pill(ctx,PHNAME[ph],265,118,ph==='B'||ph==='A'?IN_COL:ph==='F'?OUT_COL:PAL['card'],ph==='R'||ph==='P'?PAL['cv-ink']:'#fff',13*k);
  // energy bars along the bottom
  const eIn=r.rb.filter(b=>c>=b.t).reduce((s,b)=>s+b.E,0),eOut=r.pb.filter(b=>c>=b.t).reduce((s,b)=>s+b.E,0),mx=Math.max(r.inE,r.outE);
  const bx=150,bw=340;[[eIn,IN_COL,'Energy in',r.inE],[eOut,OUT_COL,'Energy out',r.outE]].forEach(([v,col,lab,full],i)=>{const y=398+i*26;
    txt(ctx,lab,bx-10,y+9,{s:12*k,w:700,a:'right',b:'middle',c:col===IN_COL?PAL['s1']:PAL['s2']});
    ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;rr(ctx,bx,y,bw*full/mx,18,5);ctx.stroke();
    if(v>0){ctx.fillStyle=col;rr(ctx,bx,y,Math.max(10,bw*v/mx),18,5);ctx.fill();if(hn&&bw*v/mx>70)txt(ctx,v.toFixed(0)+' kJ',bx+bw*v/mx-8,y+10,{s:12*k,w:700,c:'#fff',a:'right',b:'middle'});}});
  // energy diagram
  const x0=548,top=140,bot=330,lo=Math.min(0,r.est),span=r.inE-lo,S=(bot-top)/span,Y=e=>bot-(e-lo)*S;
  ctx.save();ctx.translate(x0-10,(top+bot)/2);ctx.rotate(-Math.PI/2);txt(ctx,'Energy',0,0,{s:13*k,w:700,a:'center',c:PAL['cv-soft']});ctx.restore();arrowV(ctx,x0,bot+40,top-14,PAL['cv-soft'],1.5);
  const yR=Y(0),yT=Y(r.inE),yP=Y(r.est);
  level(ctx,x0+14,x0+80,yR);level(ctx,x0+84,x0+168,yT);level(ctx,x0+172,x0+238,yP,r.est<0?PAL['s1']:PAL['s2']);
  arrowV(ctx,x0+82,yR,yT,IN_COL,3.5);arrowV(ctx,x0+170,yT,yP,OUT_COL,3.5);
  ctx.setLineDash([4,4]);ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x0+80,yR);ctx.lineTo(x0+238,yR);ctx.stroke();ctx.setLineDash([]);
  txt(ctx,'reactants',x0+47,yR+(r.est<0||yR-yP>-24*k?-10:20*k),{s:12*k,w:700,a:'center'});
  txt(ctx,'atoms',x0+126,yT-10,{s:12*k,w:700,a:'center'});
  txt(ctx,'products',x0+238,yP+(r.est<0?20*k:-10),{s:12*k,w:700,a:'right'});
  // where the system is right now
  const E=energyNow(r,c),mxp=c<PH.A?x0+82:c<PH.F1+0.3?x0+170:x0+205;ctx.fillStyle=PAL['s4'];ctx.beginPath();ctx.arc(mxp,Y(E),7,0,6.29);ctx.fill();ctx.strokeStyle=PAL['card'];ctx.lineWidth=2;ctx.stroke();
  pill(ctx,hn?'ΔH ≈ '+sgn(r.est,0)+' kJ':(r.est<0?'Exothermic':'Endothermic'),x0+126,bot+72,r.est<0?PAL['s1']:PAL['s2'],'#fff',13*k);
  const L=[{t:r.eq,s:15,w:700}];if(hn)L.push({t:'ΔH ≈ Σ(bonds broken) − Σ(bonds formed) = '+r.inE+' − '+r.outE+' = '+sgn(r.est,0)+' kJ',s:13,c:PAL['cv-soft']});panel(ctx,L,k);}

function drawHess(sim,ctx,k){const p=sim.p,P=puz(p),m=mults(p),H=hessSum(p);
  panel(ctx,[{t:'Target: '+eqText(P.target)+'    ΔH = ?',s:15,w:700}],k);
  // which species cancel: appear on both sides across the scaled equations
  const onL=new Set(),onR=new Set();P.eqs.forEach((e,i)=>{if(!m[i])return;for(const s in e.s){const v=e.s[s]*m[i];if(v<0)onL.add(s);if(v>0)onR.add(s);}});
  const rows=P.eqs.length,y0=104,dy=rows>2?52:62;
  P.eqs.forEach((e,i)=>{const y=y0+i*dy,mi=m[i],scaled={};for(const s in e.s)scaled[s]=e.s[s]*mi;
    const tag=mi===0?'not used':(mi<0?'flip':'')+(Math.abs(mi)!==1?(mi<0?', ':'')+'× '+coef(mi).replace(/^$/,'1'):'');
    txt(ctx,'('+(i+1)+')',22,y,{s:14*k,w:700,c:PAL['cv-soft'],b:'middle'});
    if(mi===0){txt(ctx,eqText(e.s),70,y,{s:13*k,c:PAL['muted'],b:'middle'});txt(ctx,'not used',778,y,{s:13*k,w:700,c:PAL['muted'],a:'right',b:'middle'});return;}
    // draw term by term so cancelled species can be struck through
    const [Ls,Rs]=sides(scaled),maxW=520;let size=14;const full=eqText(scaled);ctx.font='600 '+size*k+'px '+FONT;while(size>12&&ctx.measureText(full).width>maxW){size-=0.5;ctx.font='600 '+size*k+'px '+FONT;}
    let x=70;const put=(s,strike)=>{ctx.font='600 '+size*k+'px '+FONT;const w=ctx.measureText(s).width;txt(ctx,s,x,y,{s:size*k,w:600,b:'middle',c:strike?PAL['muted']:PAL['cv-ink']});
      if(strike){ctx.strokeStyle=PAL['s1'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x-1,y+1);ctx.lineTo(x+w+1,y-1);ctx.stroke();}x+=w;};
    Ls.forEach(([s,c],j)=>{if(j)put(' + ');put(coef(c)+SP[s],onL.has(s)&&onR.has(s));});put(' → ');Rs.forEach(([s,c],j)=>{if(j)put(' + ');put(coef(c)+SP[s],onL.has(s)&&onR.has(s));});
    txt(ctx,sgn(mi*e.dH,1)+' kJ',778,y,{s:14*k,w:700,a:'right',b:'middle',c:mi*e.dH<0?PAL['s1']:PAL['s2']});
    if(tag)txt(ctx,tag,778,y+17*k,{s:12*k,w:600,a:'right',b:'middle',c:PAL['cv-soft']});});
  const ys=y0+rows*dy-6;ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(22,ys);ctx.lineTo(778,ys);ctx.stroke();
  const sumT=eqText(H.net);txt(ctx,'Sum',22,ys+34,{s:14*k,w:700,c:PAL['cv-soft'],b:'middle'});txt(ctx,sumT,86,ys+34,{s:fitFont(ctx,sumT,15,700,540,k),w:700,b:'middle'});
  txt(ctx,sgn(H.dH,1)+' kJ',778,ys+34,{s:15*k,w:800,a:'right',b:'middle'});
  const lefts=[];if(!H.match){const keys=new Set([...Object.keys(H.net),...Object.keys(P.target)]);keys.forEach(s=>{const d=(H.net[s]||0)-(P.target[s]||0);if(Math.abs(d)>1e-9)lefts.push(SP[s]);});}
  pill(ctx,H.match?'Matches the target: ΔH = '+sgn(H.dH,1)+' kJ':'Not yet: '+lefts.slice(0,3).join(', ')+' still off',400,ys+86,H.match?PAL['s3']:PAL['s4'],'#fff',14*k);
  txt(ctx,'Flip an equation: change the sign of ΔH.  Multiply it: multiply ΔH too.',400,438,{s:12*k,a:'center',c:PAL['cv-soft']});}

function drawForm(sim,ctx,k){const p=sim.p,F=form(p);panel(ctx,[{t:formEq(F),s:15,w:700},{t:'ΔH°rxn = ('+sgn(F.sP,1)+') − ('+sgn(F.sR,1)+') = '+sgn(F.dH,1)+' kJ',s:13,c:PAL['cv-soft']}],k);
  // staircase: elements at 0, reactants and products below (or above)
  const top=150,bot=360,lo=Math.min(F.sR,F.sP,0),hi=Math.max(F.sR,F.sP,0),S=(bot-top)/Math.max(1,hi-lo),Y=e=>top+(hi-e)*S,yE=Y(0),yR=Y(F.sR),yP=Y(F.sP);
  ctx.setLineDash([6,4]);ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(30,yE);ctx.lineTo(500,yE);ctx.stroke();ctx.setLineDash([]);
  txt(ctx,'elements (ΔH°f = 0)',30,yE-10,{s:12*k,w:700,c:PAL['cv-soft']});
  level(ctx,50,190,yR);level(ctx,340,480,yP,F.dH<0?PAL['s1']:PAL['s2']);
  arrowV(ctx,120,yE,yR,PAL['s5'],3);arrowV(ctx,410,yE,yP,PAL['s5'],3);arrowV(ctx,265,yR,yP,F.dH<0?PAL['s1']:PAL['s2'],4.5);
  ctx.setLineDash([3,4]);ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(190,yR);ctx.lineTo(265,yR);ctx.moveTo(265,yP);ctx.lineTo(340,yP);ctx.stroke();ctx.setLineDash([]);
  const below=(y,o)=>y+(y>bot-30?-12:o);
  const lbY=y=>y+22*k;txt(ctx,'reactants '+sgn(F.sR,1),120,lbY(yR),{s:12*k,w:700,a:'center'});txt(ctx,'products '+sgn(F.sP,1),410,lbY(yP),{s:12*k,w:700,a:'center'});
  pill(ctx,'ΔH°rxn = '+sgn(F.dH,1)+' kJ',385,yE-36,F.dH<0?PAL['s1']:PAL['s2'],'#fff',14*k);
  // data table
  const tx=528,tr=788;let y=152;const lh=22*k;rr(ctx,tx-12,y-24*k,tr-tx+20,Math.min(440-y+24*k,(F.R.length+F.P.length+2)*lh+20),10);ctx.fillStyle=PAL['card'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
  const head=(s)=>{txt(ctx,s,tx,y,{s:12*k,w:700,c:PAL['cv-soft'],b:'middle'});y+=lh;};
  const row=x=>{txt(ctx,(x.n>1?x.n+' ':'')+fspTxt(x.s),tx,y,{s:13*k,w:600,b:'middle'});txt(ctx,(x.n>1?x.n+'×':'')+(x.hf===0?'0':sgn(x.hf,1)),tr,y,{s:13*k,a:'right',b:'middle',c:x.hf===0?PAL['muted']:PAL['cv-ink']});y+=lh;};
  head('Reactants (kJ)');F.R.forEach(row);head('Products (kJ)');F.P.forEach(row);}

/* ---------- the sim ---------- */
const BONDS=['bonds'],HESS=['hess'],FORM=['form'];
const MOPT=[{v:-2,l:'−2'},{v:-1,l:'−1'},{v:-0.5,l:'−½'},{v:0,l:'0'},{v:0.5,l:'½'},{v:1,l:'1'},{v:2,l:'2'}];
const EN={
  id:'enthalpy',hash:'enthalpy',apUnit:11,order:3,tab:'Bond energy and Hess’s law',kind:'Simulation',
  prereq:['calorimetry','lewis'],next:['gibbs','rates'],
  card:'Break bonds to put energy in, form new bonds to get energy out, then flip and scale equations to solve Hess’s law puzzles.',
  title:'Enthalpy: bond energies, Hess’s law and heats of formation',
  lede:{bio:'Every reaction breaks old bonds and makes new ones. Breaking bonds takes energy and making bonds releases it. Watch which one wins.',
        honors:'Estimate ΔH from bond enthalpies, then use Hess’s law: flip and scale known equations so they add up to a target reaction.',
        ap:'Calculate ΔH°rxn = ΣnΔH°f(products) − ΣnΔH°f(reactants) from real data and see why it is the same path-independent answer as Hess’s law.'},
  scale:'Molecular scale: each ball is one atom, about 0.1 nm across. The energies are for one mole of reaction as written (6.02 × 10²³ times).',
  timeless:true,animated:true,
  controls:[
    {id:'mode',label:'Method',type:'seg',def:'bonds',lvl:'bio',options:[{v:'bonds',l:'Bond energies'},{v:'hess',l:'Hess’s law puzzle',lvl:'honors'},{v:'form',l:'Heats of formation',lvl:'ap'}],onChange(sim){syncMode(sim);sim.st.clk=0;}},
    {id:'rxn',label:'Reaction',type:'select',def:'ch4',lvl:'bio',modes:BONDS,options:[{v:'ch4',l:'Burning methane'},{v:'hcl',l:'Hydrogen + chlorine'},{v:'nh3',l:'Making ammonia'},{v:'h2o',l:'Splitting water'},{v:'no',l:'Nitrogen + oxygen'}],onChange(sim){sim.st.clk=0;}},
    {id:'puz',label:'Puzzle',type:'select',def:'co',lvl:'honors',modes:HESS,options:Object.keys(PUZ).map(k=>({v:k,l:PUZ[k].n,lvl:PUZ[k].lvl})),onChange(sim){BioLab.setValues(sim,{m1:1,m2:1,m3:1});syncMode(sim);}},
    {id:'m1',label:'Multiply equation 1 by',type:'seg',def:1,lvl:'honors',modes:HESS,options:MOPT,help:'A negative number flips the equation (reactants and products swap).'},
    {id:'m2',label:'Multiply equation 2 by',type:'seg',def:1,lvl:'honors',modes:HESS,options:MOPT},
    {id:'m3',label:'Multiply equation 3 by',type:'seg',def:1,lvl:'honors',modes:HESS,options:MOPT},
    {id:'fr',label:'Reaction',type:'select',def:'ch4',lvl:'ap',modes:FORM,options:Object.keys(FRX).map(k=>({v:k,l:FRX[k].n})),onChange:syncMode},
    {id:'ws',label:'Water forms as',type:'seg',def:'g',lvl:'ap',modes:FORM,options:[{v:'g',l:'Gas, H₂O(g)'},{v:'l',l:'Liquid, H₂O(l)'}]}
  ],
  actions:[
    {id:'r',label:'Show reactants',lvl:'bio',modes:BONDS,run(sim){sim.st.clk=0.01;}},
    {id:'b',label:'Break the bonds',lvl:'bio',modes:BONDS,primary:true,run(sim){sim.st.clk=PH.R;}},
    {id:'f',label:'Form new bonds',lvl:'bio',modes:BONDS,run(sim){sim.st.clk=PH.A;}},
    {id:'solve',label:'Show a solution',lvl:'honors',modes:HESS,run(sim){const s=puz(sim.p).sol;BioLab.setValues(sim,{m1:s[0],m2:s[1],m3:s[2]===undefined?1:s[2]});}}
  ],
  init(){return {clk:0};},
  step(sim,dt){const st=sim.st;st.clk+=dt;if(st.clk>=PH.END)st.clk=0;},
  metrics:[
    {id:'kind',label:'This reaction is',unit:'',lvl:'bio',text:true,modes:BONDS,get:s=>s.p.mode!=='bonds'?'':build(s.p.rxn).est<0?'Exothermic: more energy out than in':'Endothermic: more energy in than out'},
    {id:'step',label:'Right now',unit:'',lvl:'bio',text:true,modes:BONDS,noTrial:true,get:s=>s.p.mode!=='bonds'?'':PHNAME[phase(s.st.clk)]},
    {id:'ein',label:'Energy in: bonds broken',unit:'kJ',lvl:'honors',min:0,max:3000,d:0,modes:BONDS,get:s=>s.p.mode==='bonds'?build(s.p.rxn).inE:NaN},
    {id:'eout',label:'Energy out: bonds formed',unit:'kJ',lvl:'honors',min:0,max:3500,d:0,modes:BONDS,get:s=>s.p.mode==='bonds'?build(s.p.rxn).outE:NaN},
    {id:'est',label:'ΔH estimate from bond energies',unit:'kJ',lvl:'honors',min:-900,max:600,d:0,modes:BONDS,get:s=>s.p.mode==='bonds'?build(s.p.rxn).est:NaN},
    {id:'real',label:'Accepted ΔH° (from ΔH°f data)',unit:'kJ',lvl:'ap',min:-900,max:600,d:1,modes:BONDS,get:s=>s.p.mode==='bonds'?build(s.p.rxn).dH:NaN},
    {id:'hsum',label:'ΔH of your sum',unit:'kJ',lvl:'honors',min:-2000,max:2000,d:1,modes:HESS,get:s=>s.p.mode==='hess'?hessSum(s.p).dH:NaN},
    {id:'hok',label:'Does the sum match the target?',unit:'',lvl:'honors',text:true,modes:HESS,get:s=>s.p.mode!=='hess'?'':hessSum(s.p).match?'Yes: ΔH = '+sgn(hessSum(s.p).dH,1)+' kJ':'Not yet'},
    {id:'sP',label:'ΣnΔH°f of products',unit:'kJ',lvl:'ap',min:-5000,max:0,d:1,modes:FORM,get:s=>s.p.mode==='form'?form(s.p).sP:NaN},
    {id:'sR',label:'ΣnΔH°f of reactants',unit:'kJ',lvl:'ap',min:-5000,max:0,d:1,modes:FORM,get:s=>s.p.mode==='form'?form(s.p).sR:NaN},
    {id:'dHr',label:'ΔH°rxn',unit:'kJ',lvl:'ap',min:-3000,max:500,d:1,modes:FORM,get:s=>s.p.mode==='form'?form(s.p).dH:NaN}
  ],
  graphs:[{id:'bk',label:'Energy bookkeeping',lvl:'bio',custom:true}],defaultGraph:'bk',
  plot(sim,ctx,box){const p=sim.p,hn=hon();let vals,labs,cols,yl;
    if(p.mode==='bonds'){const r=build(p.rxn);vals=[r.inE,-r.outE,r.est];labs=['in (broken)','out (formed)','net ΔH'];cols=[IN_COL,OUT_COL,PAL['s5']];yl='Energy (kJ)';}
    else if(p.mode==='hess'){const P=puz(p),m=mults(p);vals=P.eqs.map((e,i)=>m[i]*e.dH);labs=P.eqs.map((e,i)=>'eq. '+(i+1));vals.push(hessSum(p).dH);labs.push('sum');vals.push(P.dH);labs.push('target');cols=vals.map((v,i)=>i===vals.length-1?PAL['muted']:v<0?PAL['s1']:PAL['s2']);yl='ΔH (kJ)';}
    else{const F=form(p);vals=[...F.R.map(x=>-x.v),...F.P.map(x=>x.v),F.dH];labs=[...F.R.map(x=>'−'+(x.n>1?x.n:'')+fspTxt(x.s)),...F.P.map(x=>(x.n>1?x.n:'')+fspTxt(x.s)),'ΔH°rxn'];cols=vals.map((v,i)=>i===vals.length-1?PAL['s5']:v<0?PAL['s1']:PAL['s2']);yl='kJ';}
    const lo=Math.min(0,...vals),hi=Math.max(0,...vals),pad=(hi-lo)*0.12||10;const ax=axes(ctx,box,{xmin:0,xmax:vals.length,ymin:lo-pad,ymax:hi+pad,xcats:labs,yl});
    vals.forEach((v,i)=>{const x0=ax.X(i+0.2),x1=ax.X(i+0.8),y0=ax.Y(0),y1=ax.Y(v);ctx.fillStyle=cols[i];ctx.fillRect(x0,Math.min(y0,y1),x1-x0,Math.abs(y1-y0));
      if(hn||p.mode!=='bonds')txt(ctx,sgn(v,0),(x0+x1)/2,v>=0?y1-6:y1+14,{s:12,w:700,a:'center',c:PAL['fg']});});},
  narrate(sim){const p=sim.p,hn=hon();
    if(p.mode==='hess'){const P=puz(p),H=hessSum(p);if(H.match)return '<b>Your equations add up to the target</b>, so their ΔH values add up too: ΔH = '+sgn(H.dH,1)+' kJ. Enthalpy is a state function, so the path you take does not matter.';
      return 'Flip or scale each equation so that, when you add them, everything except the target cancels. Species on both sides cross out. '+(hn?'Each flip changes the sign of ΔH; each multiplier scales ΔH.':'');}
    if(p.mode==='form'){const F=form(p);return 'Imagine taking the reactants apart into their elements ('+sgn(-F.sR,1)+' kJ), then building the products from those elements ('+sgn(F.sP,1)+' kJ). <b>The total is ΔH°rxn = '+sgn(F.dH,1)+' kJ.</b> Elements in their standard states, like O₂(g), count as zero.';}
    const r=build(p.rxn),ph=phase(sim.st.clk),ex=r.est<0;
    if(ph==='R')return 'The reactant molecules are held together by bonds. To rearrange the atoms, those bonds must break first.';
    if(ph==='B')return '<b>Breaking a bond always takes energy.</b> The red bar grows as each bond snaps'+(hn?': '+r.rb.length+' bonds, '+r.inE+' kJ in total.':'.');
    if(ph==='A')return 'All the atoms are apart. This is the highest energy point on the path, because every bond has been broken.';
    if(ph==='F')return '<b>Forming a bond always releases energy.</b> The blue bar grows as each new bond forms'+(hn?': '+r.pb.length+' bonds, '+r.outE+' kJ in total.':'.');
    return ex?'<b>Exothermic:</b> forming the new bonds released more energy than breaking the old ones took, so the extra energy leaves as heat'+(hn?' (ΔH ≈ '+sgn(r.est,0)+' kJ).':'.'):'<b>Endothermic:</b> breaking the old bonds took more energy than forming the new ones gave back, so the reaction must absorb energy from its surroundings'+(hn?' (ΔH ≈ '+sgn(r.est,0)+' kJ).':'.');},
  tour:[
    {title:'Reactant molecules',text:'Methane (CH₄) and oxygen (O₂) are about to react. Each line between atoms is a bond. A double line is a double bond.',focus:[20,96,490,290],speed:0.3,setup(sim){BioLab.setValues(sim,{mode:'bonds',rxn:'ch4'});sim.st.clk=0;},pause:true},
    {title:'Breaking bonds takes energy',text:{bio:'Every bond that breaks needs energy put in. Watch the red “Energy in” bar grow and the dot climb on the energy diagram.',honors:'Four C–H bonds (413 kJ each) and two O=O bonds (498 kJ each) break: 2648 kJ in.'},focus:[[20,96,490,354],[536,96,256,300]],speed:0.5,setup(sim){sim.st.clk=PH.R;}},
    {title:'Atoms apart',text:'Now every bond is broken. The loose atoms sit at the top of the energy diagram, the highest energy on the path.',focus:[536,96,256,300],speed:0.15,setup(sim){sim.st.clk=PH.B1+0.1;}},
    {title:'Forming bonds releases energy',text:{bio:'New bonds form to make carbon dioxide and water. Every bond that forms releases energy, so the blue “Energy out” bar grows.',honors:'Two C=O bonds (799 kJ each) and four O–H bonds (463 kJ each) form: 3450 kJ out.'},focus:[[20,96,490,354],[536,96,256,300]],speed:0.5,setup(sim){sim.st.clk=PH.A;}},
    {title:'Which one wins?',text:{bio:'More energy came out than went in, so the reaction gives off heat. That is why burning methane (natural gas) heats a house: exothermic.',honors:'ΔH ≈ 2648 − 3450 = −802 kJ. The accepted value is −802.3 kJ, so the estimate is very close here.'},focus:[536,96,256,354],speed:0.2,setup(sim){sim.st.clk=PH.F1+0.5;},pause:true},
    {lvl:'honors',title:'Hess’s law',text:'You often cannot measure a reaction directly. Instead, flip and scale known equations so they add up to the one you want. Crossed-out species cancel, and the ΔH values add the same way.',focus:[10,80,780,370],speed:1,setup(sim){BioLab.setValues(sim,{mode:'hess',puz:'co',m1:1,m2:-1});}},
    {lvl:'ap',title:'Heats of formation',text:'ΔH°f is the enthalpy change to make one mole of a compound from its elements. Go from reactants down to elements and back up to products: ΔH°rxn = ΣnΔH°f(products) − ΣnΔH°f(reactants).',focus:[10,96,780,350],speed:1,setup(sim){BioLab.setValues(sim,{mode:'form',fr:'ch4',ws:'g'});}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{mode:'bonds',rxn:'ch4',m1:1,m2:1,m3:1});sim.st.clk=0;},
  onChallenge(sim,ch,phase){if(ch&&ch.instant&&ch.set&&phase==='done'){BioLab.setValues(sim,ch.set);if(ch.clk!==undefined)sim.st.clk=ch.clk;}},
  challenges:[
    {lvl:'bio',instant:true,set:{mode:'bonds',rxn:'hcl'},clk:PH.R,q:'H₂ and Cl₂ react to make HCl. When the H–H and Cl–Cl bonds break, energy is…',choices:['released','absorbed','neither released nor absorbed'],correct:1,
     explain:{bio:'Breaking a bond always takes energy, like pulling two magnets apart. The model is now breaking those bonds: the red “Energy in” bar grows. Energy comes out only when new bonds form.',honors:'Breaking 1 H–H (436 kJ) and 1 Cl–Cl (242 kJ) absorbs 678 kJ. Energy is released only when the two H–Cl bonds form (862 kJ).'}},
    {lvl:'bio',instant:true,set:{mode:'bonds',rxn:'h2o'},clk:PH.F1+0.5,q:'Splitting water: 2H₂O → 2H₂ + O₂. Is this reaction endothermic or exothermic?',choices:['Exothermic: it releases energy','Endothermic: it absorbs energy'],correct:1,
     explain:{bio:'The model now shows splitting water. Breaking the four O–H bonds takes more energy than forming the H–H and O=O bonds gives back, so the products sit higher on the energy diagram. That is why splitting water needs electricity or another energy source.',honors:'In: 4 × 463 = 1852 kJ. Out: 2 × 436 + 498 = 1370 kJ. ΔH ≈ +482 kJ (accepted +483.6 kJ). It is the reverse of burning hydrogen.'}},
    {lvl:'bio',instant:true,set:{mode:'bonds',rxn:'ch4'},clk:PH.F1+0.5,q:'Burning methane releases heat. Where does that energy come from?',choices:['Breaking the bonds in CH₄ and O₂ releases it','Forming the bonds in CO₂ and H₂O releases more energy than breaking the old bonds took','The match or spark supplies all of it'],correct:1,
     explain:{bio:'Breaking bonds never releases energy. The new bonds in CO₂ and H₂O are stronger, so forming them releases more energy (blue bar) than breaking the old ones took (red bar). The spark only starts the reaction.'}},
    {lvl:'honors',instant:true,set:{mode:'bonds',rxn:'hcl'},clk:PH.F1+0.5,q:'Use bond enthalpies to estimate ΔH for H₂ + Cl₂ → 2HCl. (H–H 436, Cl–Cl 242, H–Cl 431 kJ/mol)',choices:['+184 kJ','−184 kJ','−1540 kJ','+678 kJ'],correct:1,
     explain:{honors:'ΔH ≈ Σ(broken) − Σ(formed) = (436 + 242) − 2(431) = 678 − 862 = −184 kJ. Remember there are two H–Cl bonds. The accepted value is −184.6 kJ. Adding all the bond energies together (−1540) is a common mistake.'}},
    {lvl:'honors',instant:true,set:{mode:'hess',puz:'co',m1:1,m2:-1},q:'Target: C(s) + ½O₂(g) → CO(g). You know (1) C + O₂ → CO₂ and (2) CO + ½O₂ → CO₂. What do you do?',choices:['Add (1) and (2) as written','Keep (1) and flip (2)','Flip (1) and keep (2)','Double (2)'],correct:1,
     explain:{honors:'The model now shows (1) as written plus (2) flipped. CO₂ and ½O₂ cancel, leaving C + ½O₂ → CO. ΔH = −393.5 + 283.0 = −110.5 kJ.'}},
    {lvl:'honors',instant:true,set:{mode:'hess',puz:'co',m1:1,m2:-2},q:'CO(g) + ½O₂(g) → CO₂(g) has ΔH = −283.0 kJ. What is ΔH for 2CO₂(g) → 2CO(g) + O₂(g)?',choices:['+566.0 kJ','−566.0 kJ','+283.0 kJ','−141.5 kJ'],correct:0,
     explain:{honors:'Flipping changes the sign (+283.0 kJ) and doubling doubles it (+566.0 kJ). The model shows equation 2 multiplied by −2 with ΔH = +566.0 kJ.'}},
    {lvl:'ap',instant:true,set:{mode:'form',fr:'ch4',ws:'l'},q:'CH₄ combustion has ΔH° = −802.3 kJ when water forms as a gas. If liquid water forms instead, ΔH° is…',choices:['more negative: −890.3 kJ','less negative: −714.3 kJ','the same, −802.3 kJ'],correct:0,
     explain:{ap:'ΔH°f of H₂O(l) is −285.8 kJ/mol, 44.0 kJ lower than H₂O(g) at −241.8, because condensing releases heat. Two moles of water make the reaction 88.0 kJ more exothermic: −890.3 kJ. Switch “Water forms as” to compare.'}},
    {lvl:'ap',instant:true,set:{mode:'form',fr:'c3h8',ws:'l'},q:'In the propane combustion table, O₂(g) adds 0 kJ to the reactant sum. Why?',choices:['An element in its standard state has ΔH°f = 0 by definition','O₂ is not used up in the reaction','Gases have no enthalpy'],correct:0,
     explain:{ap:'ΔH°f measures the enthalpy to make a substance from its elements in their standard states. Making O₂(g) from O₂(g) is no change, so ΔH°f = 0. The same is true of N₂(g), H₂(g), Fe(s) and C(graphite). ΔH°rxn for propane is −2219.9 kJ.'}},
    {lvl:'ap',instant:true,set:{mode:'hess',puz:'c2h2',m1:-1,m2:2,m3:1},q:'Use the three equations to find ΔH for 2C(s) + H₂(g) → C₂H₂(g).',choices:['+226.7 kJ','−226.7 kJ','−1978.8 kJ','+1299.5 kJ'],correct:0,
     explain:{ap:'Flip (1): +1299.5. Double (2): −787.0. Keep (3): −285.8. Sum: +226.7 kJ, which is ΔH°f of acetylene. The model now shows this solution. Simply adding the equations as written (−1978.8 kJ) does not cancel CO₂, O₂ and H₂O.'}}
  ],
  lab:{bio:'<p><b>Question:</b> Why do some reactions give off heat while others absorb it?</p><ol><li>Choose each reaction in turn and press <b>Break the bonds</b>, then <b>Form new bonds</b>.</li><li>For each one, record whether the red “Energy in” bar or the blue “Energy out” bar is longer.</li><li>Sort the reactions into exothermic and endothermic.</li></ol><p>Write one sentence that explains exothermic and endothermic using the words “breaking bonds” and “forming bonds.”</p>',
       honors:'<p><b>Question:</b> How close are bond-energy estimates, and can you solve Hess’s law puzzles?</p><ol><li>For every reaction in Bond energies, record energy in, energy out and the ΔH estimate. Write the arithmetic for one of them.</li><li>Switch to Hess’s law puzzle. Solve “Make carbon monoxide” and “Make nitrogen dioxide.” Record the multiplier you used for each equation and the final ΔH.</li><li>Try “Make acetylene” without pressing Show a solution.</li></ol><p>Explain why flipping an equation changes the sign of ΔH and why multiplying it scales ΔH.</p>',
       ap:'<p><b>Question:</b> Do bond enthalpies, Hess’s law and heats of formation agree?</p><ol><li>In Heats of formation, record ΣnΔH°f for products and reactants and ΔH°rxn for every reaction. Compare CH₄ with water as a gas and as a liquid.</li><li>Compare the bond-energy estimate for CH₄ combustion with your ΔH°f result.</li><li>Solve “Make methane” in Hess’s law puzzle and compare its answer with ΔH°f of CH₄(g).</li></ol><p><b>Claim–evidence–reasoning:</b> Explain why all three methods agree for gas-phase reactions, and why average bond enthalpies give only an estimate for reactions with liquids or solids.</p>'},
  terms:[{t:'Chemical bond',d:'An attraction that holds atoms together. Breaking one always takes energy; forming one always releases energy.'},{t:'Exothermic',d:'More energy is released by forming bonds than is used to break bonds. The surroundings warm up. ΔH < 0.'},{t:'Endothermic',d:'More energy is used to break bonds than is released by forming them. The surroundings cool. ΔH > 0.'},{t:'Enthalpy change (ΔH)',d:'The heat absorbed or released by a reaction at constant pressure, in kJ for the reaction as written.'},
    {lvl:'honors',t:'Bond enthalpy',d:'The energy needed to break one mole of a bond in the gas phase, e.g. H–H 436 kJ/mol. Values are averages over many compounds.'},{lvl:'honors',t:'Hess’s law',d:'If equations add up to a target equation, their ΔH values add up to the target’s ΔH.'},{lvl:'honors',t:'State function',d:'A quantity that depends only on the start and end, not the path. Enthalpy is one.'},
    {lvl:'ap',t:'Standard enthalpy of formation (ΔH°f)',d:'ΔH to form 1 mol of a compound from its elements in their standard states at 1 bar and 25 °C. Zero for elements in their standard states.'},{lvl:'ap',t:'ΔH°rxn',d:'ΣnΔH°f(products) − ΣnΔH°f(reactants).'}],
  about:'<p><b>Bond energies.</b> Average bond enthalpies (kJ/mol): H–H 436, Cl–Cl 242, H–Cl 431, C–H 413, O=O 498, C=O (in CO₂) 799, O–H 463, N≡N 945, N–H 391, and the bond in NO 631. The path shown (break every bond, then form every new bond) is an accounting path, not the real mechanism: real reactions break and form bonds at the same time through an activation-energy barrier. The energy diagram is scaled to fit each reaction. Estimates come within a few kJ of accepted ΔH° values for these small gas-phase molecules; for other reactions average bond enthalpies can be off by tens of kJ.</p>'+
    '<p><b>Hess’s law and formation data.</b> Standard values at 25 °C and 1 bar from NIST/CRC tables (kJ/mol): CH₄(g) −74.8, CO₂(g) −393.5, H₂O(l) −285.8, H₂O(g) −241.8, C₃H₈(g) −103.8, C₆H₁₂O₆(s) −1273.3, Fe₂O₃(s) −824.2, Al₂O₃(s) −1675.7, CaCO₃(s) −1206.9, CaO(s) −635.1, NH₃(g) −45.9, H₂O₂(l) −187.8, NO(g) +90.3, NO₂(g) +33.2, CO(g) −110.5, C₂H₂(g) +226.7. Combustion of C₂H₂ uses −1299.5 kJ/mol so the puzzle sums are exact; tables list −1299 to −1301.</p>',
  initVis(){},
  draw(sim,ctx,vdt,k,t){ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);const m=sim.p.mode;if(m==='hess')drawHess(sim,ctx,k);else if(m==='form')drawForm(sim,ctx,k);else drawBonds(sim,ctx,k,t);},
  thumbSetup(sim){sim.st.clk=7.6;}
};
EN.onLevel=syncMode;
BioLab.register(EN);
})();
