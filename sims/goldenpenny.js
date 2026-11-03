(function(){
'use strict';
const {clamp,lerp,rr,txt,pill,atLeast,PAL,FONT,axes,legend,serColor}=BioLab.h;
const CL=window.ChemLab;

/* ---------- the penny: real numbers ----------
   A penny made after 1982 is 2.500 g: 97.5% zinc core, 2.5% copper plating (US Mint). One made before 1982 is 3.11 g of 95% Cu, 5% Zn.
   Volumes come from the composition and the CRC densities, so the densities are computed, not typed in. */
const RHO={Au:19.3,Cu:8.96,Zn:7.14,brass:8.53};
const COIN={post:{m:2.500,cu:0.025},pre:{m:3.110,cu:0.95}};
COIN.post.V=COIN.post.m*(1-COIN.post.cu)/RHO.Zn+COIN.post.m*COIN.post.cu/RHO.Cu;   // 0.348 cm³
COIN.pre.V=COIN.pre.m*COIN.pre.cu/RHO.Cu+COIN.pre.m*(1-COIN.pre.cu)/RHO.Zn;        // 0.352 cm³
COIN.post.rho=COIN.post.m/COIN.post.V;COIN.pre.rho=COIN.pre.m/COIN.pre.V;
const AREA=6.61;                                  // cm², both faces and the rim of a 19.05 mm penny
const HCU=COIN.post.m*COIN.post.cu/RHO.Cu/AREA*1e4; // copper plating thickness, about 10.6 µm
const ZN_G_UM=AREA*1e-4*RHO.Zn;                   // g of zinc per µm of plating on one penny (0.0047 g)
const GOLD_SAME=COIN.post.V*RHO.Au;               // a penny-sized piece of gold, 6.7 g
const MCU=CL.el('Cu').mass,MZN=CL.el('Zn').mass;
const NZ=40,TMELT=419.5,R=8.314;
/* effective rates, tuned to classroom timing (see About): zinc deposition, interdiffusion, surface oxidation */
const rDep=T=>0.8*Math.exp(-50000/R*(1/(T+273.15)-1/348.15));           // µm/min with good contact
const Dz=T=>T<100?0:3.5*Math.exp(-110000/R*(1/(T+273.15)-1/673.15));    // µm²/s
const kTarn=T=>T<250?0:Math.exp(-90000/R*(1/(T+273.15)-1/733.15))/12;   // tarnish index per s
const atPct=x=>100*(x/MCU)/(x/MCU+(1-x)/MZN);                            // Cu mass fraction to atom %

function pNew(y,h){h=h||0;return {y,h,cov:h>0?1-Math.exp(-h/0.25):0,c:null,L:0,T:25,tarn:0,melt:0};}
const pBase=P=>P.y==='pre'?0.05:0;   // zinc fraction under the plating
function pProfile(P){if(P.c)return;const h=Math.max(0,P.h),L=h+HCU,dz=L/NZ,b=pBase(P),c=[];
  for(let i=0;i<NZ;i++){const f=clamp((h-i*dz)/dz,0,1);c.push(f+(1-f)*b);}P.c=c;P.L=L;}
const xsOf=P=>P.c?1-(0.65*P.c[0]+0.35*P.c[1]):(1-P.cov)*(1-pBase(P));   // copper mass fraction at the surface
function pDiff(P,dt){if(!P.c)return;const D=Dz(P.T);if(D*dt<1e-7)return;const dz=P.L/NZ,lam=D/(dz*dz),n=Math.max(1,Math.ceil(lam*dt/0.4)),h=dt/n,c=P.c,tmp=new Array(NZ);
  for(let s=0;s<n;s++){for(let i=0;i<NZ;i++){const l=c[i?i-1:0],r=c[i<NZ-1?i+1:i];tmp[i]=c[i]+lam*h*(l-2*c[i]+r);}for(let i=0;i<NZ;i++)c[i]=tmp[i];}}
/* heat toward Tss with time constant tau; a post-1982 core holds at 419.5 °C while it melts */
function pHeat(P,dt,Tss,tau){pProfile(P);let left=dt;while(left>1e-9){const h=Math.min(0.05,left);left-=h;let T=P.T+(Tss-P.T)*(1-Math.exp(-h/tau));
  if(P.y==='post'&&T>=TMELT&&P.melt<1&&Tss>TMELT){P.melt=Math.min(1,P.melt+(Tss-TMELT)/tau*0.0036*h);if(P.melt<1)T=TMELT;}
  P.T=T;pDiff(P,h);P.tarn+=kTarn(T)*h;}}
function pCool(P,dt,tau){let left=dt;while(left>1e-9&&P.T>26){const h=Math.min(0.1,left);left-=h;P.T=25+(P.T-25)*Math.exp(-h/(tau||12));pDiff(P,h);P.tarn+=kTarn(P.T)*h;}}
function pPlate(P,dtb,Tb,f){if(P.c||Tb<20)return;P.h+=rDep(Tb)*f*Math.exp(-P.h/2.5)/60*dtb;P.cov=1-Math.exp(-P.h/0.25);}
const pOver=P=>!!P.c&&(xsOf(P)>=0.86||P.tarn>=0.45||P.melt>=0.25);
/* color of the surface from its copper fraction, tarnish and dirt */
const CST=[[0,'#c3c7cc'],[0.22,'#c5c3bb'],[0.4,'#cec5a3'],[0.5,'#dbc078'],[0.6,'#e2b74e'],[0.7,'#ddaa3b'],[0.8,'#d39a39'],[0.88,'#c4823d'],[0.94,'#ba713f'],[1,'#b66a40']];
function hex2(h){h=h.replace('#','');return [0,2,4].map(i=>parseInt(h.slice(i,i+2),16));}
function mixHex(a,b,t){const A=hex2(a),B=hex2(b);return '#'+A.map((v,i)=>Math.round(lerp(v,B[i],clamp(t,0,1))).toString(16).padStart(2,'0')).join('');}
function cAt(x){x=clamp(x,0,1);for(let i=1;i<CST.length;i++)if(x<=CST[i][0]){const a=CST[i-1],b=CST[i];return mixHex(a[1],b[1],(x-a[0])/(b[0]-a[0]));}return CST[CST.length-1][1];}
function look(P,dirt){const xs=xsOf(P),d=clamp(P.tarn,0,1);dirt=dirt||0;let col=P.c?cAt(xs):mixHex(cAt(1-pBase(P)),cAt(0),P.cov);col=mixHex(col,'#5e4333',0.78*clamp((d-0.08)/0.92,0,1));if(dirt>0)col=mixHex(col,'#6b4a33',dirt);
  return {col,shine:clamp(1-0.9*d-1.1*dirt,0.05,1),blister:P.melt>=0.25,xs};}
function colorName(P,dirt){if(dirt>0.25)return 'dull brown';if(!P.c)return P.cov<0.05?'copper':P.cov<0.95?'copper with silver patches':'silver';const xs=xsOf(P);let n=xs<0.25?'silver':xs<0.45?'silvery gray':xs<0.6?'pale yellow':xs<=0.8?'gold':xs<0.9?'deep gold to bronze':'copper';
  if(P.tarn>0.7)n='dark, tarnished';else if(P.tarn>0.35)n='dull '+n;if(P.melt>=0.25)n+=', blistered';return n;}
/* approximate room-temperature phases of the Cu–Zn diagram, by mass fraction of copper */
const PHASES=[[0.97,'Copper','copper'],[0.62,'α brass','α'],[0.54,'α + β′ brass','α+β′'],[0.50,'β′ brass (CuZn)','β′'],[0.41,'β′ + γ','β′+γ'],[0.33,'γ brass (Cu₅Zn₈)','γ'],[0.22,'γ + ε','γ+ε'],[0.13,'ε (CuZn₄)','ε'],[0.03,'ε + η','ε+η'],[-1,'η (zinc)','η']];
const phaseOf=x=>PHASES.find(p=>x>=p[0]);

/* ---------- Full lab state ---------- */
let CARRY=null;
const SRC={plate:{T:300,tau:25,rate:5,name:'Hot plate, about 300 °C'},flame:{T:465,tau:3.2,rate:1,name:'Outer Bunsen flame'},dial:{T:450,tau:4,rate:1,name:'Set temperature'}};
function srcOf(sim){const v=sim.p.source;if(v==='dial'){if(atLeast('ap'))return {T:sim.p.heatT,tau:4,rate:sim.p.heatT<380?5:1,name:'Set temperature'};return SRC.flame;}return SRC[v]||SRC.flame;}
function fullInit(sim){const p=sim.p,y=p.year==='pre'?'pre':'post',st={kind:'full',view:p.view,y,clk:0,hist:[],heating:false,quenched:false,cool:false,steam:0};
  if(p.view==='bath'){st.P=pNew(y,0);st.P.T=p.bathT;}
  else if(p.view==='heat'){const h=CARRY!==null?CARRY:(atLeast('honors')?p.zinc:1.3);CARRY=null;st.P=pNew(y,h);pProfile(st.P);st.heating=true;}
  else{st.P=pNew(y,1.3);pProfile(st.P);for(let i=0;i<400&&xsOf(st.P)<0.7;i++)pHeat(st.P,0.05,465,3.2);st.P.T=25;st.quenched=true;}
  st.hist.push({t:0,xs:xsOf(st.P),T:st.P.T});CARRY=null;return st;}
function fullStep(sim,dt){const st=sim.st,p=sim.p,P=st.P;if(sim.t<-1e-9)return;
  if(st.view==='bath'){const d=dt*10;st.clk+=d;P.T=p.bathT;pPlate(P,d,p.bathT,atLeast('honors')&&!p.contact?0.02:1);}
  else if(st.view==='heat'){const S=srcOf(sim),d=dt*S.rate;st.clk+=d;if(st.heating)pHeat(P,d,S.T,S.tau);else if(!st.quenched)pCool(P,d,12);if(st.steam>0)st.steam-=dt;}
  else return;
  const last=st.hist[st.hist.length-1],gap=st.view==='bath'?2:0.2*srcOf(sim).rate;
  if(st.clk-last.t>=gap){st.hist.push({t:st.clk,xs:xsOf(P),T:P.T});if(st.hist.length>1500)st.hist.splice(0,500);}}
const massOf=P=>(P.y==='pre'?COIN.pre.m:COIN.post.m)+P.h*ZN_G_UM+P.tarn*0.0002;
const volOf=P=>(P.y==='pre'?COIN.pre.V:COIN.post.V)+P.h*AREA*1e-4;
function changeText(sim){const st=sim.st,P=st.P;if(st.view==='bath')return P.h>0.02?'Chemical: zinc dissolves and plates out':'Chemical (once zinc plates)';
  if(st.view==='heat'){if(!P.c||xsOf(P)<0.02)return '—';if(P.tarn>0.35)return 'Physical mixing, plus oxidation (chemical)';return 'Physical: atoms mix into an alloy';}
  return 'Density test: a physical property';}

/* ---------- drawing helpers ---------- */
const LCD='700 VSIZEpx "Consolas","Menlo","DejaVu Sans Mono","Courier New",monospace';
function lcd(ctx,x,y,w,h,label,value,vs,k){ctx.fillStyle='#2b2f36';rr(ctx,x,y,w,h,10);ctx.fill();const ls=Math.min(12*k,15);txt(ctx,label,x+10,y+ls+4,{s:ls,w:700,c:'#d7dbe0'});
  const top=y+ls+10;ctx.fillStyle='#cfe3c8';rr(ctx,x+8,top,w-16,y+h-8-top,6);ctx.fill();ctx.fillStyle='#1b2a1b';ctx.font=LCD.replace('VSIZE',String(vs));ctx.textAlign='right';ctx.textBaseline='middle';ctx.fillText(value,x+w-16,(top+y+h-8)/2+2);}
function drawPenny(ctx,x,y,r,L,o){o=o||{};ctx.save();ctx.translate(x,y);ctx.scale(1,o.sy||1);
  const g=ctx.createRadialGradient(-r*0.35,-r*0.4,r*0.08,0,0,r);g.addColorStop(0,CL.shade(L.col,0.5*L.shine));g.addColorStop(0.5,L.col);g.addColorStop(1,CL.shade(L.col,-0.32));
  ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,r,0,6.2832);ctx.fill();ctx.strokeStyle=CL.shade(L.col,-0.45);ctx.lineWidth=Math.max(1,r*0.07);ctx.stroke();
  if(r>12){ctx.strokeStyle=CL.shade(L.col,-0.22);ctx.lineWidth=Math.max(1,r*0.035);ctx.beginPath();ctx.arc(0,0,r*0.84,0,6.2832);ctx.stroke();}
  if(L.blister&&r>10){ctx.fillStyle=CL.shade(L.col,-0.25);[[0.3,-0.2],[-0.35,0.25],[0.1,0.45],[-0.1,-0.5],[0.5,0.3]].forEach(([a,b])=>{ctx.beginPath();ctx.arc(a*r,b*r,r*0.11,0,6.2832);ctx.fill();});}
  if(o.n!==undefined){const fs=o.fs||Math.max(12,r*0.8);txt(ctx,String(o.n),0,1,{s:fs,w:700,a:'center',b:'middle',c:CL.inkOn(L.col)});}
  ctx.restore();if(o.ring){ctx.strokeStyle=o.ring;ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(x,y,r+4,(r+4)*(o.sy||1),0,0,6.2832);ctx.stroke();}}
function drawFlame(ctx,x,base,t){const f=1+0.04*Math.sin(t*13)+0.03*Math.sin(t*7.3);
  ctx.save();ctx.globalAlpha=0.55;ctx.fillStyle='#8f86f0';ctx.beginPath();ctx.moveTo(x-17,base);ctx.bezierCurveTo(x-30,base-70,x-12,base-150*f,x,base-172*f);ctx.bezierCurveTo(x+12,base-150*f,x+30,base-70,x+17,base);ctx.closePath();ctx.fill();
  ctx.globalAlpha=0.9;ctx.fillStyle='#3b5bea';ctx.beginPath();ctx.moveTo(x-10,base);ctx.quadraticCurveTo(x-10,base-40,x,base-62);ctx.quadraticCurveTo(x+10,base-40,x+10,base);ctx.closePath();ctx.fill();ctx.restore();}
function drawHotPlate(ctx,x,y,w,on){ctx.fillStyle='#4a515b';rr(ctx,x,y,w,44,8);ctx.fill();ctx.fillStyle=on?'#c26a4a':'#9aa3ab';rr(ctx,x+6,y-6,w-12,8,3);ctx.fill();
  ctx.fillStyle='#d7dbe0';ctx.beginPath();ctx.arc(x+w-26,y+24,10,0,6.2832);ctx.fill();ctx.strokeStyle='#2b2f36';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+w-26,y+24);ctx.lineTo(x+w-26+7*Math.cos(on?-0.6:-2.4),y+24+7*Math.sin(on?-0.6:-2.4));ctx.stroke();}
function granules(ctx,x0,x1,y){ctx.fillStyle='#8d949b';ctx.strokeStyle='#5f666d';ctx.lineWidth=1;for(let i=0;i<26;i++){const gx=x0+((i*37)%97)/97*(x1-x0),gy=y-((i*53)%7)-2;ctx.beginPath();ctx.ellipse(gx,gy,4+(i%3),3,i,0,6.2832);ctx.fill();ctx.stroke();}}
function bubbles(ctx,x0,x1,ybot,ytop,n,t){ctx.strokeStyle=PAL['cv-bstroke'];ctx.fillStyle=PAL['cv-bubble'];ctx.lineWidth=1;for(let i=0;i<n;i++){const sp=30+(i*17)%25,ph=((t*sp+i*41)%(ybot-ytop));const bx=x0+((i*61)%89)/89*(x1-x0)+2*Math.sin(t*3+i),by=ybot-ph;ctx.beginPath();ctx.arc(bx,by,1.5+(i%3)*0.7,0,6.2832);ctx.fill();ctx.stroke();}}
function fitTxt(ctx,s,x,y,size,maxW,o){ctx.font=(o&&o.w||700)+' '+size+'px '+FONT;const w=ctx.measureText(s).width;if(w>maxW)size*=maxW/w;txt(ctx,s,x,y,Object.assign({s:size,w:700},o||{}));}
/* the zoom on the surface: a slice through the top of the penny, colored by composition, with labels */
function drawStrip(sim,ctx,P,k,x0,y0,w,h){const L=P.c?P.L:Math.max(P.h,0)+HCU,ppu=h/L,ap=atLeast('ap'),hon=atLeast('honors');
  fitTxt(ctx,'Zoom: a slice through the surface',x0-18,y0-14,13*k,800-(x0-18)-4);
  const prof=z=>{if(P.c){const i=clamp(Math.floor(z/L*NZ),0,NZ-1);return 1-P.c[i];}return z<P.h?(P.cov>0.5?0:1):1-pBase(P);};
  for(let py=0;py<h;py+=2){const z=(py+1)/ppu;ctx.fillStyle=cAt(prof(z));ctx.fillRect(x0,y0+py,w,2.2);}
  if(!P.c&&P.h>0&&P.cov<0.999){ctx.fillStyle=cAt(1-pBase(P));const hz=P.h*ppu;for(let i=0;i<10;i++){if(((i*7)%10)/10>=P.cov)ctx.fillRect(x0+i*w/10,y0,w/10,hz+1);}}
  if(P.tarn>0.05){ctx.fillStyle='rgba(70,50,40,'+clamp(P.tarn,0,1).toFixed(2)+')';ctx.fillRect(x0,y0,w,Math.max(2,4*clamp(P.tarn,0,1)));}
  ctx.strokeStyle=PAL['line'];ctx.lineWidth=1.5;ctx.strokeRect(x0,y0,w,h);
  // break and the core below
  const cy=y0+h+10;ctx.fillStyle=P.y==='pre'?cAt(0.95):cAt(0);ctx.fillRect(x0,cy,w,22);ctx.strokeStyle=PAL['line'];ctx.strokeRect(x0,cy,w,22);
  ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=2;ctx.beginPath();for(let i=0;i<=6;i++){const xx=x0-4+i*(w+8)/6;ctx.lineTo(xx,y0+h+5+(i%2?3:-3));}ctx.stroke();
  // scale bar: 5 µm
  const sb=5*ppu,sy=y0+h-sb;ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x0-10,sy);ctx.lineTo(x0-10,y0+h);ctx.moveTo(x0-15,sy);ctx.lineTo(x0-5,sy);ctx.moveTo(x0-15,y0+h);ctx.lineTo(x0-5,y0+h);ctx.stroke();
  txt(ctx,'5 µm',x0-18,y0+h-sb/2,{s:12*k,a:'right',b:'middle',c:PAL['cv-soft']});
  // labels: regions found from the profile
  const regs=[];const N=120;let cur=null;for(let i=0;i<N;i++){const z=(i+0.5)/N*L,x=prof(z);let nm;
    if(ap)nm=phaseOf(x)[2];else nm=x<0.4?'zinc':x<0.95?'brass':'copper';
    if(!cur||cur.n!==nm){cur={n:nm,z0:z,z1:z};regs.push(cur);}else cur.z1=z;}
  const NAME=ap?(n=>{const f=PHASES.find(p=>p[2]===n);return f?f[1]:n;}):hon?{zinc:'Zinc layer',brass:'Brass (Cu + Zn mixed)',copper:'Copper plating'}:{zinc:'Zinc from the bath',brass:'Brass: copper and zinc mixed',copper:'Copper'};
  const show=regs.filter(r=>(r.z1-r.z0)*ppu>3).slice(0,6);const lab=show.map(r=>({t:typeof NAME==='function'?NAME(r.n):NAME[r.n],y:y0+(r.z0+r.z1)/2*ppu}));
  const gap=17*k;for(let i=1;i<lab.length;i++)if(lab[i].y<lab[i-1].y+gap)lab[i].y=lab[i-1].y+gap;
  for(let i=lab.length-1;i>=0;i--){const lim=(i===lab.length-1?y0+h-4:lab[i+1].y-gap);if(lab[i].y>lim)lab[i].y=lim;}
  lab.forEach((l,i)=>{const ry=y0+(show[i].z0+show[i].z1)/2*ppu;ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x0+w+2,ry);ctx.lineTo(x0+w+12,l.y);ctx.stroke();
    fitTxt(ctx,l.t,x0+w+16,l.y,13*k,800-(x0+w+20),{b:'middle',w:600});});
  const core=P.y==='pre'?'Same copper alloy below':'Zinc core, 1.5 mm thick';fitTxt(ctx,core,x0+w+16,cy+11,12*k,800-(x0+w+20),{b:'middle',w:400,c:PAL['cv-soft']});}
/* atoms near the surface: each row is one depth slice (not to scale) */
function drawAtoms(sim,ctx,P,k,x0,y0,w,h){const rows=7,cols=12,sp=Math.min(w/cols,h/rows),r=sp*0.44,ap=atLeast('ap'),L=P.c?P.L:Math.max(P.h,0)+HCU,zmax=Math.min(L,Math.max(3,(P.h||1.3)*2.5));
  fitTxt(ctx,'Zoom: atoms near the surface',x0,y0-14,13*k,800-x0-4);
  const hash=(a,b)=>{let x=Math.imul(a*73856093^b*19349663,0x9E3779B1);x^=x>>>15;x=Math.imul(x,0x85ebca6b);x^=x>>>13;return (x>>>0)/4294967296;};
  let ordered=false;
  for(let j=0;j<rows;j++){const z=(j+0.5)/rows*zmax,zn=P.c?P.c[clamp(Math.floor(z/L*NZ),0,NZ-1)]:(z<P.h&&P.cov>0.5?1:pBase(P)),cu=1-zn,ord=ap&&cu>=0.47&&cu<=0.56&&P.T<455;if(ord)ordered=true;
    for(let i=0;i<cols;i++){const isZn=ord?((i+j)%2===0):hash(i+1,j+1)<zn;CL.drawAtom(ctx,x0+sp*(i+0.5),y0+sp*(j+0.5),r,isZn?'Zn':'Cu',{label:r>=10?(isZn?'Zn':'Cu'):''});}}
  const ly=y0+rows*sp+18*k;CL.drawAtom(ctx,x0+10,ly-4*k,8,'Cu',{label:''});txt(ctx,'Cu',x0+22,ly,{s:13*k,w:700,b:'middle'});CL.drawAtom(ctx,x0+70*k,ly-4*k,8,'Zn',{label:''});txt(ctx,'Zn',x0+82*k,ly,{s:13*k,w:700,b:'middle'});
  txt(ctx,'Top row = surface',x0,ly+22*k,{s:12*k,b:'middle',c:PAL['cv-soft']});
  if(ap)fitTxt(ctx,ordered?'Checkerboard: ordered β′ (CuZn)':'Random mixing: solid solution',x0,ly+44*k,12*k,800-x0-4,{b:'middle',w:400,c:PAL['cv-soft']});}

function band(ctx,s,k){let fs=14*k;ctx.font='700 '+fs+'px '+FONT;const w=ctx.measureText(s).width;if(w>770)fs*=770/w;ctx.fillStyle=PAL['card'];rr(ctx,8,430-fs*0.95,784,fs*1.7,8);ctx.fill();txt(ctx,s,400,430-fs*0.1,{s:fs,w:700,a:'center',b:'middle'});}
function fullDraw(sim,ctx,vdt,k,t){const st=sim.st,P=st.P,p=sim.p,hon=atLeast('honors'),ap=atLeast('ap');
  ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
  if(st.view==='gold'){goldDraw(sim,ctx,k);return;}
  ctx.fillStyle=PAL['cv-bench'];ctx.fillRect(0,392,430,6);
  const L=look(P);
  if(st.view==='bath'){fitTxt(ctx,'Step 1: the zinc bath',16,28,15*k,280);
    drawHotPlate(ctx,80,348,260,true);const B=CL.drawBeaker(ctx,{x:110,y:196,w:200,h:150,fill:0.62,ticks:false});
    granules(ctx,hon&&!p.contact?205:130,295,340);const rate=rDep(p.bathT);bubbles(ctx,hon&&!p.contact?210:135,290,334,B.y+4,Math.round(clamp(rate*14,2,30)),t);
    if(hon&&!p.contact){ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(122,312);ctx.lineTo(196,312);ctx.stroke();drawPenny(ctx,158,306,26,L,{sy:0.25});}
    else drawPenny(ctx,210,330,30,L,{sy:0.25});
    lcd(ctx,16,46,150,72,'BATH','  '+p.bathT.toFixed(0)+' °C',26,k);
    lcd(ctx,16,124,150,72,'TIMER',Math.floor(st.clk/60)+':'+String(Math.floor(st.clk%60)).padStart(2,'0'),26,k);}
  else{const S=srcOf(sim),plate=p.source==='plate';fitTxt(ctx,'Step 2: heat the silver penny',16,28,15*k,290);
    if(plate){drawHotPlate(ctx,70,348,250,true);if(st.heating)drawPenny(ctx,190,340,40,L,{sy:0.22});}
    else{ctx.fillStyle='#59616b';rr(ctx,150,378,100,14,4);ctx.fill();ctx.fillStyle='#7d858e';rr(ctx,190,300,20,80,3);ctx.fill();drawFlame(ctx,200,300,t);
      txt(ctx,'Outer flame',158,180,{s:12*k,a:'right',c:PAL['cv-soft']});txt(ctx,'Blue inner cone',162,272,{s:12*k,a:'right',c:PAL['cv-soft']});
      if(st.heating){drawPenny(ctx,200,224,28,L,{sy:0.26});ctx.strokeStyle='#59616b';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(224,222);ctx.lineTo(318,196);ctx.moveTo(224,227);ctx.lineTo(318,206);ctx.stroke();}}
    // quench beaker
    const qb=CL.drawBeaker(ctx,{x:330,y:304,w:80,h:84,fill:0.6,ticks:false});if(!st.heating)drawPenny(ctx,370,384,22,L,{sy:0.25});
    if(st.steam>0){ctx.fillStyle='rgba(200,205,210,'+clamp(st.steam,0,0.8).toFixed(2)+')';for(let i=0;i<5;i++){ctx.beginPath();ctx.arc(352+i*9,qb.y-10-((t*30+i*13)%40),6+i%3,0,6.2832);ctx.fill();}}
    lcd(ctx,16,46,150,72,plate?'HEATING':'IN THE FLAME',(st.clk<60?st.clk.toFixed(1)+' s':Math.floor(st.clk/60)+':'+String(Math.floor(st.clk%60)).padStart(2,'0')),24,k);}
  // close-up of the penny face
  drawPenny(ctx,370,112,46,L);txt(ctx,'Penny surface',370,58,{s:12*k,a:'center',c:PAL['cv-soft']});
  if(L.blister)pill(ctx,'Core melting: blisters',370,176,'#a33b2b','#fff',12*k);
  // right panel
  const zx=470,zy=90,zw=90,zh=250;
  if(hon&&p.zoom==='atoms')drawAtoms(sim,ctx,P,k,452,zy,336,190);else drawStrip(sim,ctx,P,k,zx,zy,zw,zh);
  let s;if(st.view==='bath'){s=ap?'At the penny: Zn(OH)₄²⁻ + 2e⁻ → Zn(s) + 4OH⁻':hon?'Zinc dissolves as zincate, Zn(OH)₄²⁻, then plates out on the copper':'Zinc moves from the granules onto the penny';
    if(hon&&!p.contact)s='No contact with the zinc, so no zinc plates';}
  else{const x=xsOf(P);s=!P.c||P.T<150?'Heat lets the atoms move':x<0.45?'Zinc and copper atoms are mixing':x<0.6?'Zinc-rich brass: pale yellow':x<=0.8&&P.tarn<0.35?'Brass, '+Math.round(x*100)+'% copper: gold color':'Overheated: dull and oxidized';
    if(ap&&P.c)s+=' · '+phaseOf(x)[1];}
  band(ctx,s,k);}
function goldDraw(sim,ctx,k){const st=sim.st,y=st.y,hon=atLeast('honors');
  fitTxt(ctx,'Is it gold? Density decides',16,28,15*k,400);
  const items=[{t:'Penny made after 1982',sub:'2.50 g, zinc core',skin:cAt(1),core:cAt(0)},{t:'Penny made before 1982',sub:'3.11 g, 95% copper',skin:cAt(0.95),core:cAt(0.95)},
    {t:'Golden '+(y==='pre'?'pre-1982':'post-1982')+' penny',sub:(y==='pre'?'3.11':'2.51')+' g, brass skin',skin:cAt(0.7),core:y==='pre'?cAt(0.95):cAt(0)}];
  items.forEach((it,i)=>{const Y=62+i*104;txt(ctx,it.t,24,Y,{s:13*k,w:700});ctx.fillStyle=it.core;rr(ctx,24,Y+10,370,32,6);ctx.fill();ctx.fillStyle=it.skin;ctx.fillRect(28,Y+10,362,4);ctx.fillRect(28,Y+38,362,4);
    ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;rr(ctx,24,Y+10,370,32,6);ctx.stroke();fitTxt(ctx,it.sub,24,Y+60,12*k,390,{w:400,c:PAL['cv-soft']});});
  txt(ctx,'Skins drawn about 20× too thick to see',24,384,{s:12*k,c:PAL['cv-soft']});
  // density bars
  const P=st.P,mine=massOf(P)/volOf(P);
  const rows=[['Gold',RHO.Au,'#d9b23a'],['Copper',RHO.Cu,cAt(1)],['Penny made before 1982',COIN.pre.rho,cAt(0.95)],['Brass, 70% copper',RHO.brass,cAt(0.7)],['Zinc',RHO.Zn,cAt(0.05)],['Penny made after 1982',COIN.post.rho,cAt(0.3)],['Your golden penny',mine,PAL['s4']]];
  const x0=440,wmax=340,rh=Math.max(40,12*k+24);txt(ctx,'Density (g/cm³)',x0,52,{s:13*k,w:700});
  rows.forEach((r,i)=>{const Y=62+i*rh+12*k;txt(ctx,r[0]+': '+r[1].toFixed(2),x0,Y,{s:12*k,w:i===6?700:400});const bw=wmax*r[1]/20;ctx.fillStyle=r[2];rr(ctx,x0,Y+5,bw,12,3);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;rr(ctx,x0,Y+5,bw,12,3);ctx.stroke();});
  band(ctx,'Penny-sized gold: '+GOLD_SAME.toFixed(1)+' g. Your golden penny: '+massOf(P).toFixed(2)+' g',k);}

/* =================== Virtual lab: The Golden Penny (Chemistry, Glugoski). Contract: VLAB.md ===================
   Bench state lives in sim.vlab.bench so it saves with the notebook. Stations: clean, bal, bath, flame, cyl. */
function hr(seed,a,b){let h=(seed^Math.imul(a+1,0x9E3779B1)^Math.imul(b+7,0x85EBCA77))|0;h=Math.imul(h^h>>>16,0x7feb352d);h=Math.imul(h^h>>>15,0x846ca68b);h^=h>>>16;return (h>>>0)/4294967296;}
function hn(seed,a,b){const u=Math.max(1e-9,hr(seed,a,b)),w=hr(seed,a,b+100003);return Math.sqrt(-2*Math.log(u))*Math.cos(6.2831853*w);}
const r2=v=>Math.round(v*100)/100,r1=v=>Math.round(v*10)/10;
const NP=5;
const gB=sim=>sim.vlab&&sim.st&&sim.st.kind==='vlab'?sim.vlab.bench:null;
function vPen(seed,i){const u=a=>hr(seed,100+i,a),n=a=>hn(seed,100+i,a);
  return Object.assign(pNew('post',0),{i,m0:+(2.500+0.011*clamp(n(1),-2.4,2.4)).toFixed(4),dirt:0.42+0.3*u(2),f:0.88+0.24*u(3),tss:445+50*u(4),tau:2.6+1.2*u(5),tin:325+30*u(6),vf:1+0.006*clamp(n(7),-2,2),cl:0.0012+0.0016*u(8),
    st:'tray',heated:false,q:null,ft:0,wasOver:false});}
function vInit(sim){const V=sim.vlab,b=V.bench;if(!Array.isArray(b.pens)||b.pens.length!==NP)b.pens=Array.from({length:NP},(_,i)=>vPen(V.seed,i));
  const d={stn:'clean',gog:false,glo:false,clean:0,bal:{on:false,tare:0,off:0.01+0.03*hr(V.seed,7,1),nz:0,disp:0,log:[]},
    bath:{zn:false,naoh:false,T:21.5+1.5*hr(V.seed,8,1),disp:0,dsec:-1,in:false,place:'on',t:0,added:false,out:false,rinsed:false,boil:false},
    fl:{lit:false,held:-1,clk:0,steam:0},cyl:{filled:false,V0:0,n:0,levels:[],drop:0},cleanup:false};
  Object.keys(d).forEach(k=>{if(b[k]===undefined)b[k]=d[k];});if(!b.bal.disp)b.bal.disp=r2(b.bal.off);b.bath.disp=b.bath.disp||r1(b.bath.T);return {kind:'vlab'};}
const vMass=(b,P)=>P.m0-(b.clean>=1?P.cl:0)+P.h*ZN_G_UM+P.tarn*0.0002;
const vVol=P=>COIN.post.V*(P.m0/2.5)*P.vf+P.h*AREA*1e-4;
const DIAL={off:{T:21,tau:500,l:'Off'},low:{T:58,tau:150,l:'Low'},med:{T:80,tau:150,l:'Medium'},high:{T:108,tau:150,l:'High'}};
/* which stage the five pennies are at, for the balance log */
function vStage(b){const ps=b.pens;if(b.clean<2)return 'dirty';if(b.bath.in||ps.some(P=>P.st==='flame'||P.st==='hot'||P.st==='held'||P.st==='cooling'))return 'busy';
  if(b.bath.added&&!b.bath.rinsed)return 'wet';const plated=ps.some(P=>P.h>0.05);if(!plated)return 0;const nh=ps.filter(P=>P.heated).length;return nh===0?1:nh===NP?2:'part';}
function vBal(sim){const b=gB(sim),B=b.bal;B.nz++;const m=B.on?b.pens.reduce((s,P)=>s+vMass(b,P),0):0;const d=r2(m+B.off-B.tare+0.004*clamp(hn(sim.vlab.seed,99,B.nz),-1.2,1.2));B.disp=Math.abs(d)<0.005?0:d;
  if(B.on){B.log.push({v:B.disp,s:vStage(b),ok:Math.abs(B.tare-B.off)<0.0005});if(B.log.length>40)B.log.shift();}}
function vStep(sim,dt){if(sim.t<-1e-9)return;const b=gB(sim);if(!b)return;const V=sim.vlab,bt=b.bath;
  // the bath: heats toward the dial setting; the bath clock runs 10× faster than real time
  if(bt.naoh){const D=DIAL[sim.p.dial]||DIAL.off,d=dt*10;bt.T+=(Math.min(D.T,102.5)-bt.T)*(1-Math.exp(-d/D.tau));bt.boil=bt.T>=100.5;
    if(bt.in){bt.t+=d;b.pens.forEach(P=>pPlate(P,d,bt.T,(bt.place==='on'?1:0.02)*P.f));}
    bt.ck=(bt.ck||0)+d;const s=Math.floor(bt.ck);if(s!==bt.dsec){bt.dsec=s;bt.disp=r1(bt.T+0.05*clamp(hn(V.seed,90,s),-2,2));}}
  // the flame and cooling
  const fl=b.fl;if(fl.steam>0)fl.steam-=dt;
  b.pens.forEach((P,i)=>{if(P.st==='flame'){const sp=sim.p.spot==='inner';pHeat(P,dt,sp?P.tin:P.tss,sp?4:P.tau);P.ft+=dt;if(i===fl.held)fl.clk+=dt;if(pOver(P))P.wasOver=true;}
    else if(P.st==='hot'||P.st==='cooling'){pCool(P,dt,12);if(pOver(P))P.wasOver=true;if(P.st==='cooling'&&P.T<60)P.st='cooled';}});}
/* ---------- checks ---------- */
const STG=['with the five clean pennies on it','with the five silver pennies on it','with the five golden pennies on it'];
const STG_DO=['Clean and rinse the pennies, then weigh all five together.','Weigh the five pennies after the zinc bath, once they are rinsed and dry.','Weigh the five pennies after every one has been heated and cooled.'];
const TARE='That reading does not match the pennies alone. Take the pennies off, press Tare so the empty balance reads 0.00 g, and weigh them again.';
const MROWS=['After cleaning (copper)','After the zinc bath (silver)','After heating (gold)'];
function mCheck(sim,rv,v){const b=gB(sim);if(!b)return null;rv=MROWS.indexOf(rv);const L=b.bal.log.filter(l=>l.s===rv);if(!L.length)return STG_DO[rv];
  const hit=L.find(l=>Math.abs(l.v-v)<0.005);if(hit)return hit.ok?null:TARE;const g=L.filter(l=>l.ok);return g.length?'The balance read '+g[g.length-1].v.toFixed(2)+' g '+STG[rv]+'. Check your reading.':TARE;}
function aCheck(sim,rv,v){rv=MROWS.indexOf(rv);const m=sim.vlab.val('m','m',rv);if(!Number.isFinite(m))return 'Record the balance reading for the five pennies first.';return Math.abs(v-m/5)<=0.0055?null:'Divide your balance reading for the five pennies by 5.';}
function levCheck(sim,rv,v){const b=gB(sim);if(!b)return null;const C=b.cyl;if(!C.filled)return 'Pour the water into the cylinder first.';if(rv>C.n)return rv===1?'Add the first penny, then read the water level.':'Add penny '+rv+', then read the water level.';
  const L=C.levels[rv];if(!(Math.abs(v-L)<=0.151))return 'Check your reading: look at the bottom of the meniscus in the zoom, count the 1 mL marks, and estimate the tenths.';
  const raw=sim.vlab.raw('c:v:lev:'+rv).trim();if(!/\.\d/.test(raw))return 'Record one estimated digit. This cylinder is marked every 1 mL, so read it to the nearest 0.1 mL.';return null;}
const OBS=['Before cleaning','After cleaning','Zinc in the hot NaOH, before the pennies go in','Pennies in the zinc bath','After the zinc bath, rinsed and dried','A penny in the flame','A golden penny after cooling','The penny you overheated'];
function obsReach(b,r){const ps=b.pens;return [true,b.clean>=1,b.bath.naoh&&(b.bath.T>45||b.bath.added),b.bath.added,b.bath.rinsed,ps.some(P=>P.heated),ps.some(P=>P.heated&&P.st==='cooled'),ps.some(P=>P.wasOver)][r];}
function obsCheck(sim,rv,v){rv=OBS.indexOf(rv);const b=gB(sim);if(!b||!String(v).trim())return null;return obsReach(b,rv)?null:'Do this step on the bench first, then describe what you see.';}
const near=(x,y,tol)=>Number.isFinite(x)&&Number.isFinite(y)&&Math.abs(x-y)<=tol;
function cCheck(id){return (sim,v,V)=>{const m0=V.val('m','m',0),m1=V.val('m','m',1),m2=V.val('m','m',2),L0=V.val('v','lev',0),L5=V.val('v','lev',5);const num=k=>BioLab.vlab.num(V.raw('k:'+k));
  if(id==='dm1'){if(!Number.isFinite(m0)||!Number.isFinite(m1))return 'Fill in the first two rows of Table 2 first.';return near(v,m1-m0,0.0051)?null:(near(v,m0-m1,0.0051)?'Subtract in the other order: the mass after the bath minus the mass before it.':'Subtract the mass after cleaning from the mass after the zinc bath (Table 2).');}
  if(id==='zn1'){const d=num('dm1');if(!Number.isFinite(d))return 'Work out the change in mass of the five pennies first.';return near(v,d/5,0.0012)?null:'Divide the change in mass of the five pennies by 5.';}
  if(id==='dm2'){if(!Number.isFinite(m1)||!Number.isFinite(m2))return 'Fill in the last two rows of Table 2 first.';return near(v,m2-m1,0.0051)?null:(near(v,m1-m2,0.0051)?'Subtract in the other order: the mass after heating minus the mass before it.':'Subtract the mass after the zinc bath from the mass after heating (Table 2).');}
  if(id==='vol'){if(!Number.isFinite(L0)||!Number.isFinite(L5))return 'Fill in the water levels with 0 and 5 pennies in Table 3 first.';return near(v,L5-L0,0.011)?null:'Subtract the water level with no pennies from the level with all five pennies.';}
  if(id==='dens'){const vol=num('vol');if(!Number.isFinite(m2)||!Number.isFinite(vol)||vol<=0)return 'Work out the volume of the five pennies first, and record their mass after heating.';
    const d=m2/vol;if(Math.abs(v-d)<=0.015*d)return null;if(Number.isFinite(V.val('m','a',2))&&Math.abs(v-V.val('m','a',2)/vol)<=0.02*d/5)return 'Use the mass of all five pennies, because the volume you measured is for all five.';return 'Divide the mass of the five golden pennies (Table 2) by their volume.';}
  const vol=num('vol');if(!Number.isFinite(vol))return 'Work out the volume of the five pennies first.';return Math.abs(v-vol*RHO.Au)<=0.015*vol*RHO.Au?null:'Multiply the volume of your five pennies by the density of gold, 19.3 g/cm³.';};}
/* ---------- bench actions ---------- */
function vA(id,label,en,fn,primary){return {id,label,vlab:true,primary:!!primary,enabled:s=>{const b=gB(s);return !!b&&!!en(s,b);},run(s){const b=gB(s);if(!b||!en(s,b))return;fn(s,b);s.infoDirty=true;}};}
const pick=s=>clamp((+s.p.pen||1)-1,0,NP-1);
const allTray=b=>b.pens.every(P=>P.st==='tray'||P.st==='cooled');
const V_ACTIONS=[
  vA('s-gog','Put on safety goggles',(s,b)=>!b.gog,(s,b)=>{b.gog=true;}),
  vA('s-glo','Put on chemical-resistant gloves',(s,b)=>!b.glo,(s,b)=>{b.glo=true;}),
  vA('k-clean','Clean the pennies',(s,b)=>b.clean<1,(s,b)=>{b.clean=1;b.method=s.p.clean;},true),
  vA('k-rinse','Rinse the pennies with water and pat them dry',(s,b)=>b.clean===1,(s,b)=>{b.clean=2;}),
  vA('b-tare','Tare (zero) the balance',(s,b)=>true,(s,b)=>{const B=b.bal;B.nz++;const m=B.on?b.pens.reduce((t,P)=>t+vMass(b,P),0):0;B.tare=m+B.off;vBal(s);}),
  vA('b-on','Put the five pennies on the balance',(s,b)=>!b.bal.on&&allTray(b)&&!b.bath.in,(s,b)=>{b.bal.on=true;vBal(s);},true),
  vA('b-off','Take the pennies off the balance',(s,b)=>b.bal.on,(s,b)=>{b.bal.on=false;vBal(s);}),
  vA('z-zinc','Add zinc granules (about 2 g) to the beaker',(s,b)=>!b.bath.zn,(s,b)=>{b.bath.zn=true;}),
  vA('z-naoh','Pour in 25 mL of 3 M NaOH',(s,b)=>b.bath.zn&&!b.bath.naoh&&b.gog&&b.glo,(s,b)=>{b.bath.naoh=true;},true),
  vA('z-add','Add the pennies with tongs',(s,b)=>b.bath.naoh&&!b.bath.in&&b.clean===2&&!b.bal.on&&!b.pens.some(P=>P.heated),(s,b)=>{b.bath.in=true;b.bath.place=s.p.place;b.bath.added=true;b.bath.out=false;b.bath.rinsed=false;b.pens.forEach(P=>P.st='bath');},true),
  vA('z-out','Take the pennies out with tongs',(s,b)=>b.bath.in,(s,b)=>{b.bath.in=false;b.bath.out=true;b.pens.forEach(P=>P.st='tray');}),
  vA('z-rinse','Rinse the pennies well with water and pat them dry',(s,b)=>b.bath.out&&!b.bath.rinsed,(s,b)=>{b.bath.rinsed=true;}),
  vA('f-lite','Light the Bunsen burner',(s,b)=>!b.fl.lit&&b.gog,(s,b)=>{b.fl.lit=true;},true),
  vA('f-pick','Pick up the penny with crucible tongs',(s,b)=>b.fl.lit&&b.fl.held<0&&!b.bal.on&&b.bath.rinsed&&(b.pens[pick(s)].st==='tray'||b.pens[pick(s)].st==='cooled'),(s,b)=>{const i=pick(s);b.fl.held=i;b.pens[i].st='held';b.fl.clk=0;}),
  vA('f-in','Hold it in the flame',(s,b)=>b.fl.lit&&b.fl.held>=0&&['held','hot'].includes(b.pens[b.fl.held].st),(s,b)=>{const P=b.pens[b.fl.held];P.st='flame';P.heated=true;b.fl.clk=0;BioLab.play(s);},true),
  vA('f-out','Take it out of the flame',(s,b)=>b.fl.held>=0&&b.pens[b.fl.held].st==='flame',(s,b)=>{b.pens[b.fl.held].st='hot';}),
  vA('f-quench','Quench it in the beaker of water',(s,b)=>b.fl.held>=0&&b.pens[b.fl.held].st==='hot',(s,b)=>{const P=b.pens[b.fl.held];if(P.T>100)b.fl.steam=1.2;P.T=25;P.st='cooled';P.q=true;b.fl.held=-1;}),
  vA('f-pad','Set it on the heat-proof pad to cool',(s,b)=>b.fl.held>=0&&b.pens[b.fl.held].st==='hot',(s,b)=>{const P=b.pens[b.fl.held];P.st='cooling';P.q=false;b.fl.held=-1;}),
  vA('f-off','Turn off the burner',(s,b)=>b.fl.lit&&b.fl.held<0,(s,b)=>{b.fl.lit=false;}),
  vA('c-fill','Pour about 20 mL of water into the cylinder',(s,b)=>!b.cyl.filled,(s,b)=>{const C=b.cyl;C.filled=true;C.V0=+(18.7+2.6*hr(s.vlab.seed,70,1)).toFixed(3);C.n=0;C.levels=[C.V0];}),
  vA('c-add','Add one golden penny to the cylinder',(s,b)=>b.cyl.filled&&b.cyl.n<NP&&b.pens.every(P=>P.st==='cooled'||P.st==='tray'),(s,b)=>{const C=b.cyl,P=b.pens[C.n];C.n++;let L=C.levels[C.n-1]+vVol(P);
    if(s.p.addHow==='drop'){const lost=0.08+0.2*hr(s.vlab.seed,71,C.n);L-=lost;C.drop=1.0;}C.levels[C.n]=+L.toFixed(3);},true),
  vA('x-clean','Clean up the bench',(s,b)=>!b.cleanup,(s,b)=>{b.cleanup=true;b.fl.lit=false;})];
/* ---------- bench drawing ---------- */
function vTray(sim,ctx,b,k,ring){const r=15,x0=800-NP*38+2;b.pens.forEach((P,i)=>{const L=look(P,b.clean>=1?0:P.dirt);drawPenny(ctx,x0+i*38,28,r,L,{n:i+1,fs:Math.min(12*k,17),ring:ring===i?PAL['s2']:null});});}
function vHeader(ctx,s,k){fitTxt(ctx,s,16,30,15*k,800-NP*38-40);}
function vDraw(sim,ctx,vdt,k,t){const b=gB(sim),p=sim.p;ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);ctx.fillStyle=PAL['cv-bench'];ctx.fillRect(0,394,800,56);ctx.fillStyle=PAL['line'];ctx.fillRect(0,394,800,2);
  const S=b.stn;if(S==='clean')vClean(sim,ctx,b,k,t);else if(S==='bal')vBalance(sim,ctx,b,k);else if(S==='bath')vBath(sim,ctx,b,k,t);else if(S==='flame')vFlame(sim,ctx,b,k,t);else vCyl(sim,ctx,b,k,t);
  vTray(sim,ctx,b,k,S==='flame'?pick(sim):-1);}
function safety(ctx,b,k,y){const a=b.gog?['Goggles on',PAL['s3']]:['Goggles needed','#a33b2b'],c=b.glo?['Gloves on',PAL['s3']]:['Gloves needed','#a33b2b'];ctx.font='700 '+12*k+'px '+FONT;const w1=ctx.measureText(a[0]).width+14*k;
  pill(ctx,a[0],16+w1/2,y,a[1],'#fff',12*k);pill(ctx,c[0],16+w1+8+(ctx.measureText(c[0]).width+14*k)/2,y,c[1],'#fff',12*k);}
function vClean(sim,ctx,b,k,t){vHeader(ctx,b.clean<1?'Clean the five pennies':b.clean<2?'Rinse and dry the pennies':'Clean pennies',k);safety(ctx,b,k,58);
  ctx.fillStyle='#f1efe8';rr(ctx,70,200,430,90,8);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;rr(ctx,70,200,430,90,8);ctx.stroke();
  b.pens.forEach((P,i)=>drawPenny(ctx,120+i*82,245,34,look(P,b.clean>=1?0:P.dirt),{n:i+1,fs:16}));txt(ctx,'Paper towel',285,318,{s:12*k,a:'center',c:PAL['cv-soft']});
  if(sim.p.clean==='wool'){ctx.fillStyle='#9aa0a6';rr(ctx,600,220,120,60,14);ctx.fill();ctx.strokeStyle='#6f757b';ctx.lineWidth=1;for(let i=0;i<22;i++){ctx.beginPath();ctx.arc(610+((i*29)%100),230+((i*17)%40),6+(i%4),0,3.5);ctx.stroke();}txt(ctx,'Steel wool',660,310,{s:12*k,a:'center',c:PAL['cv-soft']});}
  else{ctx.fillStyle=PAL['cv-water'];ctx.beginPath();ctx.ellipse(660,262,80,22,0,0,6.2832);ctx.fill();ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=2.5;ctx.beginPath();ctx.ellipse(660,262,80,22,0,0,6.2832);ctx.stroke();txt(ctx,'Vinegar + salt',660,310,{s:12*k,a:'center',c:PAL['cv-soft']});}
  if(b.clean===1){ctx.fillStyle=PAL['cv-water'];for(let i=0;i<14;i++){ctx.beginPath();ctx.arc(90+((i*71)%400),210+((i*23)%70),2.5,0,6.2832);ctx.fill();}}}
function vBalance(sim,ctx,b,k){const B=b.bal;vHeader(ctx,'Weigh all five pennies together',k);
  ctx.fillStyle='#4a515b';rr(ctx,150,250,260,140,12);ctx.fill();ctx.fillStyle='#b8bec6';ctx.beginPath();ctx.ellipse(280,246,96,14,0,0,6.2832);ctx.fill();
  if(B.on)b.pens.forEach((P,i)=>drawPenny(ctx,280+(i%2?6:-6),238-i*5,30,look(P,0),{sy:0.28}));
  ctx.fillStyle='#1d2b24';rr(ctx,180,290,200,56,8);ctx.fill();ctx.font=LCD.replace('VSIZE','36');ctx.fillStyle='#8ff0a4';ctx.textAlign='right';ctx.textBaseline='middle';ctx.fillText(B.disp.toFixed(2),330,320);ctx.font='700 18px '+FONT;ctx.fillText('g',356,322);
  ctx.fillStyle='#6b737d';rr(ctx,196,356,64,22,6);ctx.fill();rr(ctx,300,356,64,22,6);ctx.fill();txt(ctx,'ON',228,371,{s:12,w:700,c:'#eef0f2',a:'center'});txt(ctx,'TARE',332,371,{s:12,w:700,c:'#eef0f2',a:'center'});
  txt(ctx,'Balance, reads to 0.01 g',280,420,{s:13*k,w:700,a:'center'});
  if(!B.on){b.pens.forEach((P,i)=>drawPenny(ctx,520+i*50,320,21,look(P,b.clean>=1?0:P.dirt),{n:i+1,fs:Math.min(12*k,15)}));txt(ctx,'Pennies on the paper towel',620,368,{s:12*k,a:'center',c:PAL['cv-soft']});}}
function vBath(sim,ctx,b,k,t){const bt=b.bath,D=DIAL[sim.p.dial]||DIAL.off;vHeader(ctx,'Zinc bath on the hot plate',k);safety(ctx,b,k,58);
  drawHotPlate(ctx,80,350,250,sim.p.dial!=='off');const B=CL.drawBeaker(ctx,{x:110,y:196,w:190,h:150,fill:bt.naoh?0.55:0.02,ticks:false});
  if(bt.zn)granules(ctx,bt.in&&bt.place==='off'?200:128,290,340);
  if(bt.naoh&&bt.zn){const n=Math.round(clamp(rDep(bt.T)*12,0,30));bubbles(ctx,bt.in&&bt.place==='off'?205:132,286,334,B.y+4,n,t);
    if(bt.boil){ctx.fillStyle='rgba(255,255,255,.75)';for(let i=0;i<10;i++){ctx.beginPath();ctx.arc(118+((i*41)%175),B.y-4-((t*60+i*19)%26),2.5,0,6.2832);ctx.fill();}}}
  if(bt.in){if(bt.place==='off'){ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(120,300);ctx.lineTo(190,300);ctx.stroke();b.pens.forEach((P,i)=>drawPenny(ctx,130+i*14,295-i*2,16,look(P,0),{sy:0.3}));}
    else b.pens.forEach((P,i)=>drawPenny(ctx,140+i*36,331,16,look(P,0),{sy:0.3}));}
  txt(ctx,'Hot plate: '+D.l,205,420,{s:13*k,w:700,a:'center'});
  ctx.strokeStyle='#59616b';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(360,200);ctx.quadraticCurveTo(300,190,286,226);ctx.lineTo(282,320);ctx.stroke();
  lcd(ctx,360,110,180,84,'THERMOMETER',(bt.naoh?bt.disp.toFixed(1):r1(bt.T).toFixed(1))+' °C',30,k);
  lcd(ctx,360,206,180,84,'BATH TIMER (10×)',Math.floor(bt.t/60)+':'+String(Math.floor(bt.t%60)).padStart(2,'0'),30,k);
  if(bt.boil)pill(ctx,'Boiling: the NaOH is spattering',205,176,'#a33b2b','#fff',12*k);
  const P=b.pens[0];drawPenny(ctx,672,226,64,look(P,b.clean>=1?0:P.dirt));txt(ctx,'Close-up of penny 1',672,316,{s:12*k,a:'center',c:PAL['cv-soft']});
  if(bt.naoh)txt(ctx,'3 M NaOH: corrosive',205,444,{s:12*k,a:'center',c:PAL['cv-soft']});}
function vFlame(sim,ctx,b,k,t){const fl=b.fl,hi=fl.held,inner=sim.p.spot==='inner';vHeader(ctx,'Turn the pennies gold',k);
  ctx.fillStyle='#59616b';rr(ctx,170,378,100,14,4);ctx.fill();ctx.fillStyle='#7d858e';rr(ctx,210,300,20,80,3);ctx.fill();if(fl.lit)drawFlame(ctx,220,300,t);
  txt(ctx,'Bunsen burner',220,420,{s:13*k,w:700,a:'center'});
  if(fl.lit){txt(ctx,'Outer flame',188,186,{s:12*k,a:'right',c:PAL['cv-soft']});txt(ctx,'Blue inner cone',196,282,{s:12*k,a:'right',c:PAL['cv-soft']});}
  if(hi>=0){const P=b.pens[hi],inF=P.st==='flame',py=inF?(inner?274:226):150,px=inF?220:300;drawPenny(ctx,px,py,26,look(P,0),{sy:0.26});
    ctx.strokeStyle='#59616b';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(px+24,py-2);ctx.lineTo(px+150,py-40);ctx.moveTo(px+24,py+3);ctx.lineTo(px+150,py-30);ctx.stroke();}
  const qb=CL.drawBeaker(ctx,{x:450,y:304,w:80,h:86,fill:0.6,ticks:false});txt(ctx,'Quench water',490,420,{s:12*k,a:'center',c:PAL['cv-soft']});
  if(fl.steam>0){ctx.fillStyle='rgba(200,205,210,'+clamp(fl.steam,0,0.8).toFixed(2)+')';for(let i=0;i<5;i++){ctx.beginPath();ctx.arc(472+i*9,qb.y-10-((t*30+i*13)%40),6+i%3,0,6.2832);ctx.fill();}}
  ctx.fillStyle='#8a8f96';ctx.fillRect(560,386,230,8);txt(ctx,'Heat-proof pad',675,420,{s:12*k,a:'center',c:PAL['cv-soft']});
  b.pens.forEach((P,i)=>{if(P.st==='cooled'||P.st==='cooling'||P.st==='tray')drawPenny(ctx,582+i*44,380,18,look(P,0),{sy:0.3});});
  lcd(ctx,16,50,170,74,'IN THE FLAME',(hi>=0?fl.clk:0).toFixed(1)+' s',30,k);
  const cp=hi>=0?hi:pick(sim),P=b.pens[cp];drawPenny(ctx,672,196,60,look(P,0));txt(ctx,'Close-up of penny '+(cp+1),672,282,{s:12*k,a:'center',c:PAL['cv-soft']});
  if(look(P,0).blister)pill(ctx,'Blistered',672,306,'#a33b2b','#fff',12*k);
  if(!fl.lit)txt(ctx,'The burner is off',220,250,{s:13*k,a:'center',c:PAL['cv-soft']});}
const CYL={x:170,w:40,top:70,bot:372,max:50};const cY=v=>CYL.bot-6-(v/CYL.max)*(CYL.bot-6-CYL.top-16);
function vCyl(sim,ctx,b,k,t){const C=b.cyl,lev=C.filled?C.levels[C.n]:0;vHeader(ctx,'Volume by water displacement',k);
  const x0=CYL.x-CYL.w/2,x1=CYL.x+CYL.w/2;
  if(C.filled){ctx.fillStyle=PAL['cv-water'];ctx.fillRect(x0+2,cY(lev),CYL.w-4,CYL.bot-cY(lev));}
  for(let i=0;i<C.n;i++)drawPenny(ctx,CYL.x,CYL.bot-5-i*3,17,look(b.pens[i],0),{sy:0.25});
  ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(x0-5,CYL.top-4);ctx.lineTo(x0,CYL.top);ctx.lineTo(x0,CYL.bot);ctx.lineTo(x1,CYL.bot);ctx.lineTo(x1,CYL.top);ctx.stroke();ctx.fillStyle=PAL['cv-glass'];rr(ctx,x0-24,CYL.bot,CYL.w+48,7,2);ctx.fill();
  ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1;for(let v=0;v<=50;v++){const y=cY(v);ctx.beginPath();ctx.moveTo(x0,y);ctx.lineTo(x0+(v%10===0?14:v%5===0?10:5),y);ctx.stroke();if(v%10===0&&v>0)txt(ctx,String(v),x0-6,y,{s:12*k,a:'right',b:'middle',c:PAL['cv-soft']});}
  txt(ctx,'50 mL graduated cylinder',CYL.x,420,{s:13*k,w:700,a:'center'});txt(ctx,'marked every 1 mL',CYL.x,440,{s:12*k,a:'center',c:PAL['cv-soft']});
  if(C.drop>0){C.drop-=0.016;ctx.fillStyle=PAL['cv-water'];for(let i=0;i<6;i++){ctx.beginPath();ctx.arc(CYL.x-30+i*12,CYL.top-12-(i%3)*6,2.5,0,6.2832);ctx.fill();}}
  // zoom on the meniscus
  const ZX=540,ZY=226,ZR=148,vv=C.filled?lev:20,ppu=ZR*1.8/6,Yz=u=>ZY-(u-vv)*ppu;const zy0=cY(vv+3),zy1=cY(vv-3);
  ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.5;rr(ctx,x0-6,zy0,CYL.w+12,zy1-zy0,4);ctx.stroke();ctx.beginPath();ctx.moveTo(x1+6,zy0);ctx.lineTo(ZX-ZR*0.5,ZY-ZR*0.866);ctx.moveTo(x1+6,zy1);ctx.lineTo(ZX-ZR*0.5,ZY+ZR*0.866);ctx.stroke();
  ctx.save();ctx.beginPath();ctx.arc(ZX,ZY,ZR,0,6.2832);ctx.fillStyle=PAL['card'];ctx.fill();ctx.clip();const wl=ZX-120,wr=ZX+120;ctx.fillStyle=PAL['cv-bg2'];ctx.fillRect(wl,ZY-ZR,wr-wl,2*ZR);
  if(C.filled){const yv=Yz(lev),cu=22;ctx.beginPath();ctx.moveTo(wl,yv-cu);ctx.quadraticCurveTo(wl+20,yv,ZX,yv);ctx.quadraticCurveTo(wr-20,yv,wr,yv-cu);ctx.lineTo(wr,ZY+ZR);ctx.lineTo(wl,ZY+ZR);ctx.closePath();ctx.save();ctx.globalAlpha=0.55;ctx.fillStyle='#5aa7dd';ctx.fill();ctx.restore();
    ctx.strokeStyle='#2c6db0';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(wl,yv-cu);ctx.quadraticCurveTo(wl+20,yv,ZX,yv);ctx.quadraticCurveTo(wr-20,yv,wr,yv-cu);ctx.stroke();}
  ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(wl,ZY-ZR);ctx.lineTo(wl,ZY+ZR);ctx.moveTo(wr,ZY-ZR);ctx.lineTo(wr,ZY+ZR);ctx.stroke();
  ctx.strokeStyle=PAL['cv-ink'];for(let u=Math.floor(vv-4);u<=Math.ceil(vv+4);u++){if(u<0||u>50)continue;const y=Yz(u),five=u%5===0;ctx.lineWidth=five?3:2;ctx.beginPath();ctx.moveTo(wl,y);ctx.lineTo(wl+(five?110:80),y);ctx.stroke();txt(ctx,String(u),wl+(five?118:88),y,{s:(five?18:15)*Math.min(k,1.4),w:five?700:400,b:'middle'});}
  if(C.filled){const yv=Yz(lev);ctx.setLineDash([7,6]);ctx.strokeStyle=PAL['s4'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(ZX-ZR,yv);ctx.lineTo(wl-4,yv);ctx.stroke();ctx.setLineDash([]);}
  ctx.restore();ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=3;ctx.beginPath();ctx.arc(ZX,ZY,ZR,0,6.2832);ctx.stroke();
  pill(ctx,'Zoom: dashed line = your eye level',ZX,ZY+ZR+16,PAL['card2'],PAL['cv-ink'],12*k);
  {const s=C.n+' of 5 pennies in',fs=12*k;ctx.font='700 '+fs+'px '+FONT;const w=ctx.measureText(s).width+fs*1.1;pill(ctx,s,794-w/2,66,PAL['card2'],PAL['cv-ink'],fs);}
  if(!C.filled)txt(ctx,'The cylinder is empty',ZX,ZY,{s:14*k,a:'center',b:'middle',c:PAL['cv-soft']});}
function vNarr(sim){const b=gB(sim),S=b.stn,bt=b.bath,fl=b.fl;
  if(S==='clean'){if(!b.gog||!b.glo)return '<b>Safety first.</b> 3 M sodium hydroxide is corrosive to skin and eyes, and you will work with a hot plate and a flame. Put on goggles and gloves.';
    if(b.clean<1)return 'The pennies look dull because the copper surface has reacted with air to form a thin layer of copper oxide. Clean it off so the zinc can stick to bare copper.';
    if(b.clean<2)return 'Rinse off the cleaner. Anything left on the pennies would add mass and get into the zinc bath.';return 'Bare copper is shiny. Describe the pennies before and after cleaning in Table 1.';}
  if(S==='bal'){const B=b.bal;if(Math.abs(B.tare-B.off)>0.0005&&!B.on)return 'The empty balance does not read 0.00 g. Press <b>Tare</b> before you put the pennies on.';
    if(B.on&&Math.abs(B.tare-B.off)>0.0005)return '<b>The balance was not tared with the pan empty</b>, so this reading is off. Take the pennies off, press Tare, and weigh again.';
    if(B.on)return 'Record every digit the balance shows. Weighing all five together makes a small change in mass easier to see on a balance that reads to 0.01 g.';return 'Tare the empty balance, then put all five pennies on it.';}
  if(S==='bath'){if(!bt.zn)return 'Put the zinc granules in the beaker first.';if(!bt.naoh)return b.gog&&b.glo?'Pour the NaOH over the zinc.':'Put on goggles and gloves before you pour the NaOH.';
    if(bt.boil)return '<b>The NaOH is boiling and spattering.</b> Hot, concentrated NaOH is dangerous. Turn the hot plate down.';
    if(bt.in&&bt.place==='off')return 'The pennies are in the hot NaOH but <b>not touching the zinc</b>. Watch the timer and the pennies.';
    if(bt.in)return 'Zinc dissolves from the granules as zincate ions, Zn(OH)₄²⁻, and plates back out as zinc metal on the copper where the pennies touch the zinc. Watch the color and the timer.';
    if(bt.out&&!bt.rinsed)return 'Rinse the pennies well. NaOH left on them is corrosive, and it would add mass.';
    if(bt.T>40)return 'The zinc fizzes in the hot NaOH: it reacts to form zincate ions and hydrogen gas. Heat the bath to about 70 to 80 °C. Do not let it boil.';return 'Turn on the hot plate and watch the thermometer.';}
  if(S==='flame'){if(!fl.lit)return 'Light the burner. Hold each penny in the hot outer part of the flame, just above the tip of the blue inner cone.';const P=fl.held>=0?b.pens[fl.held]:null;
    if(P&&P.st==='flame')return (sim.p.spot==='inner'?'Inside the blue cone the gas has not fully burned yet, so it is cooler there. ':'')+'In the hot metal, zinc atoms spread into the copper and copper atoms spread into the zinc. Watch the color closely and decide when to take the penny out.';
    if(P&&P.st==='hot')return 'The penny is still hot, so its atoms keep moving. Quench it in water to stop the change quickly, or set it on the pad to cool slowly.';
    return 'Choose a penny, pick it up with the crucible tongs and hold it in the flame. Heat every penny, and record what you see in Table 1.';}
  const C=b.cyl;if(!C.filled)return 'Pour about 20 mL of water into the 50 mL graduated cylinder.';if(C.n<NP)return 'Read the bottom of the meniscus at eye level and estimate one digit between the 1 mL marks. Then tilt the cylinder and slide in the next penny.';
  return 'All five pennies are in. The water rose by the volume of the pennies.';}
/* ---------- the lab ---------- */
const vTxt=(sim,k)=>sim.vlab.raw(k).trim()!=='';
const setStn=s=>sim=>{const b=gB(sim);if(b)b.stn=s;};
const minCov=b=>Math.min(...b.pens.map(P=>P.cov));
const W_CTL=['b-tare','b-on','b-off'];
function weighStep(r,title,text){return {title,setup:setStn('bal'),controls:W_CTL,text,
  done:sim=>{const b=gB(sim);return !!b&&b.bal.log.some(l=>l.s===r&&l.ok)&&vTxt(sim,'c:m:m:'+r)&&vTxt(sim,'c:m:a:'+r)&&!b.bal.on;},
  doneHint:sim=>{const b=gB(sim);if(!b)return '';if(!b.bal.log.some(l=>l.s===r&&l.ok))return Math.abs(b.bal.tare-b.bal.off)>0.0005?'Take the pennies off and press <b>Tare</b> so the empty balance reads 0.00 g, then weigh them.':'Put all five pennies on the balance and read it.';
    if(!vTxt(sim,'c:m:m:'+r)||!vTxt(sim,'c:m:a:'+r))return 'Record the reading and the average mass of one penny in Table 2.';return 'Take the pennies off the balance.';}};}
const LAB={id:'golden-penny',title:'Lab 2: The Golden Penny',course:'Chemistry',teachers:'Glugoski',
  source:{label:'Lab 2: The Golden Penny (paper handout)',href:'https://rjhs.instructure.com/courses/16512/assignments/612379'},level:'honors',
  purpose:'<p>Turn a copper-colored penny silver and then gold, and decide what you really made. Along the way you classify each change as physical or chemical, find out what an alloy is, and use mass and density as evidence for whether your penny is gold.</p>',
  background:'<p><b>What a penny is made of.</b> A penny made after 1982 has a mass of about 2.50 g. It is 97.5% zinc: a zinc core with a thin plating of copper, about 10 µm thick, on the outside. A penny made before 1982 has a mass of about 3.11 g and is 95% copper and 5% zinc all the way through. (Pennies made in 1982 come in both kinds.)</p>'+
    '<p><b>The silver step.</b> Zinc metal dissolves in hot, concentrated sodium hydroxide. Zinc is amphoteric, so in a strong base it forms zincate ions and hydrogen gas:</p><p>Zn(s) + 2OH⁻(aq) + 2H₂O(l) → Zn(OH)₄²⁻(aq) + H₂(g)</p><p>When a copper penny touches the zinc granules, electrons from the dissolving zinc flow into the penny, and zincate ions pick them up at the copper surface: Zn(OH)₄²⁻(aq) + 2e⁻ → Zn(s) + 4OH⁻(aq). A thin layer of zinc metal plates onto the copper, and the penny looks silver.</p>'+
    '<p><b>The gold step.</b> Heating the silver penny makes its atoms move. Zinc atoms spread into the copper and copper atoms spread into the zinc, so the surface becomes <b>brass</b>, an <b>alloy</b> of copper and zinc. An alloy is a mixture of metals, and its composition can vary. Brass that is about 60% to 80% copper has a gold color. If you keep heating, the zinc spreads deeper, the surface reacts with oxygen in the air, and the color turns dull. In a post-1982 penny the zinc core melts at 420 °C, so a penny held in the flame too long can blister.</p>'+
    '<p><b>Is it gold?</b> Color is not a reliable test. Density is: gold is 19.3 g/cm³, copper is 8.96 g/cm³, brass is about 8.5 g/cm³ and zinc is 7.14 g/cm³. You will find the density of your golden pennies from their mass and their volume by water displacement.</p>'+
    '<p><b>Safety.</b> Wear goggles and gloves. 3 M NaOH is corrosive to skin and eyes, and it is worse when hot. Do not let it boil. The hot plate, the flame and a heated penny can burn you: handle hot pennies only with tongs. Tie back long hair near the flame. Dispose of the NaOH and zinc the way your teacher directs. It is fine to change coins for a science lab, but never spend them or try to pass them off as gold.</p>'+
    '<p><b>About the virtual bench.</b> Every penny is a little different in mass, in how well it plates and in how hot it gets in the flame, so watch your own pennies instead of timing them. The balance reads to 0.01 g and its last digit can wander by 0.01 g. The bath clock runs 10 times faster than real time at 1× speed; the flame runs in real time. Pennies do not fit in a 10 mL graduated cylinder, so you use a 50 mL cylinder and several pennies.</p>',
  materials:['Five pennies made after 1982','Steel wool, or vinegar with a pinch of salt, for cleaning','Paper towels','Balance that reads to 0.01 g','150 mL beaker, zinc granules (about 2 g) and 25 mL of 3 M sodium hydroxide, NaOH','Hot plate and a thermometer','Tongs and crucible tongs','Bunsen burner, a beaker of cold water and a heat-proof pad','50 mL graduated cylinder and water','Goggles and chemical-resistant gloves'],
  hypothesis:{prompt:'<p>Predict what will happen to the mass and to the density of the pennies when they turn silver, and again when they turn gold. Will the golden penny be gold? Explain your reasoning.</p>'},
  setup(sim){BioLab.refresh(sim);},
  controls:[],
  steps:[
    {title:'Get set up',setup:setStn('clean'),controls:['s-gog','s-glo'],text:'<p>You will turn five pennies silver in a zinc bath, then gold in a flame, and then test whether they are gold. Record what you see at each stage in <b>Table 1</b>, the observations table.</p><p><b>Safety:</b> 3 M NaOH is corrosive. Put on your goggles and gloves now, and keep them on.</p>',
     done:sim=>{const b=gB(sim);return !!b&&b.gog&&b.glo;},doneHint:'Put on your goggles and gloves.'},
    {title:'Clean the pennies',setup:setStn('clean'),controls:['clean','k-clean','k-rinse'],text:'<p>Look closely at the pennies and describe them in Table 1 (before cleaning). Then clean them: rub them with steel wool, or soak them in vinegar with a pinch of salt. Rinse them with water, pat them dry and describe them again.</p>',
     done:sim=>{const b=gB(sim);return !!b&&b.clean>=2;},doneHint:sim=>{const b=gB(sim);return b&&b.clean<1?'Choose a method and press <b>Clean the pennies</b>.':'Rinse the pennies and pat them dry.';}},
    weighStep(0,'Weigh the clean pennies','<p>Press <b>Tare</b> with the balance empty so it reads 0.00 g. Put all five pennies on the balance and record the reading in Table 2, then work out the average mass of one penny.</p>'),
    {title:'Heat the zinc bath',setup:setStn('bath'),controls:['z-zinc','z-naoh','dial'],text:'<p>Put about 2 g of zinc granules in a 150 mL beaker on the hot plate and pour 25 mL of 3 M NaOH over them. Turn on the hot plate and watch the thermometer. Heat the bath to <b>70 to 80 °C</b>. Do not let it boil. Describe the zinc in the hot NaOH in Table 1.</p>',
     done:sim=>{const b=gB(sim);return !!b&&b.bath.naoh&&b.bath.T>=65&&b.bath.T<=85&&!b.bath.boil;},
     doneHint:sim=>{const b=gB(sim);if(!b)return '';const bt=b.bath;if(!bt.zn)return 'Add the zinc granules.';if(!bt.naoh)return 'Pour in the NaOH.';if(bt.T>85)return 'The bath is too hot. Turn the hot plate down and let it cool to 70 to 80 °C.';return 'Heat the bath until the thermometer reads 70 to 80 °C.';}},
    {title:'Plate the pennies with zinc',setup:setStn('bath'),controls:['place','z-add','z-out','dial'],text:'<p>Use tongs to lay the pennies in the bath so that each one <b>touches the zinc</b>. Keep the bath at 70 to 80 °C. Watch the pennies and the timer. When the pennies are completely silver, take them out with tongs. Describe what you see in Table 1.</p>',
     done:sim=>{const b=gB(sim);return !!b&&b.bath.out&&minCov(b)>=0.9;},
     doneHint:sim=>{const b=gB(sim);if(!b)return '';if(!b.bath.added)return 'Add the pennies with tongs.';if(b.bath.in)return 'When the pennies are completely silver, take them out with tongs.';return 'Some copper still shows. Put the pennies back in, touching the zinc.';}},
    {title:'Rinse and dry',setup:setStn('bath'),controls:['z-rinse','dial'],text:'<p>Rinse the silver pennies well with water and pat them dry. Turn off the hot plate and describe the pennies in Table 1.</p>',
     done:sim=>{const b=gB(sim);return !!b&&b.bath.rinsed&&sim.p.dial==='off';},doneHint:sim=>{const b=gB(sim);return b&&!b.bath.rinsed?'Rinse and dry the pennies.':'Turn the hot plate off.';}},
    weighStep(1,'Weigh the silver pennies','<p>Tare the empty balance, weigh all five silver pennies together and record the reading in Table 2. Work out the average mass of one penny.</p>'),
    {title:'Light the burner',setup:setStn('flame'),controls:['f-lite'],text:'<p>Tie back long hair. Light the Bunsen burner and adjust it to a blue flame with a clear inner cone. Set a beaker of cold water next to it for quenching.</p>',
     done:sim=>{const b=gB(sim);return !!b&&b.fl.lit;},doneHint:'Light the burner.'},
    {title:'Turn the pennies gold',setup:setStn('flame'),controls:['pen','spot','f-pick','f-in','f-out','f-quench','f-pad'],text:'<p>Pick up one penny with crucible tongs and hold it in the <b>outer part of the flame</b>, just above the tip of the blue inner cone. Watch the color closely. Take it out as soon as it turns gold, and quench it in the cold water. Do this for all five pennies.</p><p>Every penny heats a little differently, so watch the penny, not the clock. You can put a penny back in the flame if it is not gold yet. Describe a penny in the flame and after cooling in Table 1.</p>',
     done:sim=>{const b=gB(sim);return !!b&&b.fl.held<0&&b.pens.every(P=>P.heated&&P.st==='cooled'&&xsOf(P)>=0.5);},
     doneHint:sim=>{const b=gB(sim);if(!b)return '';if(b.fl.held>=0)return 'Quench the penny or set it on the pad.';const bad=b.pens.find(P=>!P.heated||xsOf(P)<0.5);if(bad)return 'Penny '+(bad.i+1)+(bad.heated?' still looks silver. Heat it again.':' has not been heated yet.');return 'Wait for the pennies on the pad to cool.';}},
    {title:'Overheat one penny',setup:setStn('flame'),controls:['pen','spot','f-pick','f-in','f-out','f-quench','f-pad'],text:'<p>Choose one golden penny and hold it in the flame again, this time well past gold, for about 20 seconds. Watch what happens to its color and surface, then quench it. Describe it in Table 1.</p>',
     done:sim=>{const b=gB(sim);return !!b&&b.fl.held<0&&b.pens.some(P=>P.wasOver)&&b.pens.every(P=>P.st==='cooled');},
     doneHint:sim=>{const b=gB(sim);if(!b)return '';if(b.fl.held>=0)return b.pens[b.fl.held].wasOver?'Quench the penny.':'Keep it in the flame longer.';return b.pens.some(P=>P.wasOver)?'Wait for the pennies to cool.':'Hold one penny in the flame well past gold.';}},
    Object.assign(weighStep(2,'Weigh the golden pennies','<p>Turn off the burner. Tare the empty balance, weigh all five golden pennies together and record the reading in Table 2. Work out the average mass of one penny.</p>'),{controls:W_CTL.concat(['f-off'])}),
    {title:'Find the volume by water displacement',setup:setStn('cyl'),controls:['c-fill','addHow','c-add'],text:'<p>One penny raises the water by less than half a milliliter, which is hard to read. Use all five. Pour about 20 mL of water into a 50 mL graduated cylinder and read the bottom of the meniscus to the nearest 0.1 mL. Tilt the cylinder and slide the pennies in one at a time so the water does not splash. Read the level after each penny and record it in Table 3.</p>',
     done:sim=>{const b=gB(sim);return !!b&&b.cyl.n===NP&&[0,1,2,3,4,5].every(i=>vTxt(sim,'c:v:lev:'+i));},
     doneHint:sim=>{const b=gB(sim);if(!b)return '';if(!b.cyl.filled)return 'Pour the water into the cylinder.';if(b.cyl.n<NP)return 'Read the level, then add the next penny.';return 'Record every water level in Table 3.';}},
    {title:'Clean up and analyze',setup:setStn('cyl'),controls:['x-clean'],text:'<p>Pour the water off the pennies and dry them. Let the zinc bath cool, and dispose of the NaOH and zinc the way your teacher directs. Wash your hands.</p><p>Then do the calculations, answer the questions and write your conclusion. Your graph draws from Table 3.</p>'}],
  tables:[
    {id:'obs',title:'Table 1. Observations',cols:[{id:'s',label:'Stage',rows:OBS},{id:'o',label:'What you see: color, shine, bubbles, other changes',input:'text',check:obsCheck}]},
    {id:'m',title:'Table 2. Mass of the five pennies at each stage',cols:[{id:'s',label:'Stage',rows:MROWS},
      {id:'m',label:'Balance reading, 5 pennies (g)',input:'number',dp:2,check:mCheck},{id:'a',label:'Average mass of one penny (g)',input:'number',dp:3,check:aCheck}]},
    {id:'v',title:'Table 3. Water displacement in a 50 mL graduated cylinder',cols:[{id:'n',label:'Golden pennies in the cylinder',rows:[0,1,2,3,4,5],rowLabels:['0 (water only)','1','2','3','4','5']},{id:'lev',label:'Water level (mL)',input:'number',dp:1,check:levCheck}]}],
  calcs:[{id:'dm1',label:'Change in mass of the five pennies in the zinc bath',unit:'g',input:'number',check:cCheck('dm1')},{id:'zn1',label:'Mass of zinc added to one penny',unit:'g',input:'number',check:cCheck('zn1')},
    {id:'dm2',label:'Change in mass of the five pennies during heating',unit:'g',input:'number',check:cCheck('dm2')},{id:'vol',label:'Volume of the five golden pennies (1 mL = 1 cm³)',unit:'cm³',input:'number',check:cCheck('vol')},
    {id:'dens',label:'Density of the golden pennies',unit:'g/cm³',input:'number',check:cCheck('dens')},{id:'gold',label:'Mass these five pennies would have if they were solid gold (19.3 g/cm³)',unit:'g',input:'number',check:cCheck('gold')}],
  graph:{type:'line',title:'Water level as you add golden pennies',xl:'Golden pennies in the cylinder',yl:'Water level (mL)',xmin:0,xmax:5,series:[{table:'v',x:'n',y:'lev',label:'Water level'}]},
  questions:[
    {id:'q1',q:'<p>Was each step a physical change or a chemical change? For each one, write which, and the evidence from your observations.</p>',fields:[{id:'clean',label:'Cleaning'},{id:'zinc',label:'The zinc bath'},{id:'heat',label:'Heating in the flame'}]},
    {id:'q2',q:'<p>What is an alloy? Is brass a compound or a mixture? Use the fact that brass can be anywhere from about 60% to 80% copper in your answer.</p>'},
    {id:'q3',q:'<p>Is your golden penny gold? Use your density and the mass your pennies would have if they were solid gold as evidence. Name one more test that could tell brass from gold.</p>'},
    {id:'q4',q:'<p>Your pennies gained a little mass in the zinc bath and almost none when they turned gold. Where did the added mass come from? What does the heating result tell you about whether any new matter was added to make the gold color?</p>'},
    {id:'q5',q:'<p>Why did you put five pennies in the cylinder instead of one? Use your graph to say how much one penny raises the water, and how that compares with what you can read on the cylinder.</p>'},
    {id:'q6',q:'<p>For centuries, alchemists tried to turn cheap metals into gold. Why could a result like your golden penny fool them? What did they not yet understand about elements and mixtures?</p>'},
    {id:'q7',q:'<p>Brass is used in trumpets and trombones, plumbing valves and fittings, and ammunition casings. A zinc coating protects steel in galvanized nails, guardrails and fences. Pick one use of brass and one of zinc plating, and explain which property makes the metal a good choice.</p>'},
    {id:'q8',q:'<p>Would this lab work with a penny made before 1982? Would its density be the same as your golden pennies? Explain using what each kind of penny is made of.</p>'}],
  conclusion:{prompt:'<p>Write a conclusion of one or two paragraphs. Did you make gold? State your answer, support it with your mass and density data, and explain in terms of atoms what happened to the penny in the zinc bath and in the flame. Describe one source of error and how it affected your density.</p>',cer:false}};

/* ---------- definition ---------- */
function pMain(sim){return sim.st&&sim.st.P?sim.st.P:pNew('post',0);}
const GP={
  id:'goldenpenny',hash:'goldenpenny',apUnit:1,order:3,tab:'The golden penny',kind:'Virtual lab',prereq:['classify','density'],
  card:'Plate a penny with zinc, heat it into brass and watch it turn gold. Then use density to prove it is not gold.',
  title:'The golden penny: plating and alloys',
  lede:{bio:'Turn a penny silver in a zinc bath, then gold in a flame. Watch the copper and zinc atoms mix, and test whether you made gold.',
        honors:'Follow the zinc layer and the brass that forms when you heat it. Change the bath, the heat and the penny, and use mass and density to classify each change.',
        ap:'Add the zincate chemistry, an Arrhenius model for diffusion, and the brass phases: the α solid solution and the ordered β′ intermetallic.'},
  scale:{bio:'A penny is 19.05 mm across and 1.52 mm thick. The zoom shows only the top 12 µm of its surface. The copper plating is about 10 µm thick, about a tenth of the width of a hair.',
         honors:'A penny is 19.05 mm across and 1.52 mm thick. The zoom shows the top 12 µm: a zinc layer of about 1 µm from the bath on about 10.6 µm of copper, over a zinc core about 1.5 mm thick.'},
  timeScale:1,dtMax:0.02,prewarm:0,sampleDt:0.25,window:60,unit:'s',chChange:0.5,chReveal:10,
  clock(sim){const st=sim.st;if(!st||st.kind!=='full')return '';if(st.view==='bath')return 'Bath time '+Math.floor(st.clk/60)+':'+String(Math.floor(st.clk%60)).padStart(2,'0')+' (10× speed)';if(st.view==='heat')return 'Heating '+st.clk.toFixed(1)+' s'+(sim.p.source==='plate'?' (5× speed)':'');return '';},
  controls:[
    {id:'view',label:'Step',type:'seg',def:'bath',lvl:'bio',options:[{v:'bath',l:'1. Zinc bath'},{v:'heat',l:'2. Heat it'},{v:'gold',l:'3. Is it gold?'}],onChange(s){if(!s.vlab)BioLab.reset(s);}},
    {id:'year',label:'Penny',type:'seg',def:'post',lvl:'bio',options:[{v:'post',l:'Made after 1982'},{v:'pre',l:'Made before 1982'}],onChange(s){if(!s.vlab)BioLab.reset(s);}},
    {id:'source',label:'Heat source',type:'seg',def:'flame',lvl:'bio',options:[{v:'flame',l:'Outer Bunsen flame'},{v:'plate',l:'Hot plate, 300 °C'},{v:'dial',l:'Set the temperature',lvl:'ap'}],help:'Used in step 2.'},
    {id:'bathT',label:'Bath temperature',type:'range',min:30,max:95,step:5,def:75,unit:' °C',lvl:'honors',help:'Hotter NaOH plates zinc faster, but boiling NaOH spatters.'},
    {id:'contact',label:'Penny touches the zinc',type:'toggle',def:true,lvl:'honors'},
    {id:'zinc',label:'Zinc layer to start step 2',type:'range',min:0.5,max:3,step:0.1,def:1.3,unit:' µm',lvl:'honors',onChange(s){if(!s.vlab&&s.st&&s.st.view==='heat')BioLab.reset(s);}},
    {id:'heatT',label:'Heater temperature',type:'range',min:250,max:550,step:10,def:450,unit:' °C',lvl:'ap',help:'Used when the heat source is Set the temperature.'},
    {id:'zoom',label:'Zoom',type:'seg',def:'layers',lvl:'honors',options:[{v:'layers',l:'Layers'},{v:'atoms',l:'Atoms'}]},
    // virtual lab bench only
    {id:'clean',label:'How you clean the pennies',type:'seg',def:'wool',vlab:true,noTrial:true,options:[{v:'wool',l:'Steel wool'},{v:'vinegar',l:'Vinegar and salt'}]},
    {id:'dial',label:'Hot plate',type:'seg',def:'off',vlab:true,noTrial:true,options:[{v:'off',l:'Off'},{v:'low',l:'Low'},{v:'med',l:'Medium'},{v:'high',l:'High'}]},
    {id:'place',label:'Where the pennies go',type:'seg',def:'on',vlab:true,noTrial:true,options:[{v:'on',l:'Touching the zinc'},{v:'off',l:'Not touching the zinc'}]},
    {id:'pen',label:'Penny',type:'seg',def:1,vlab:true,noTrial:true,options:[1,2,3,4,5].map(v=>({v,l:String(v)}))},
    {id:'spot',label:'Where in the flame',type:'seg',def:'outer',vlab:true,noTrial:true,options:[{v:'outer',l:'Outer flame'},{v:'inner',l:'Inside the blue cone'}]},
    {id:'addHow',label:'How you add each penny',type:'seg',def:'slide',vlab:true,noTrial:true,options:[{v:'slide',l:'Tilt and slide it in'},{v:'drop',l:'Drop it straight in'}]}
  ],
  actions:[
    {id:'heatit',label:'Heat this penny',lvl:'bio',primary:true,enabled:s=>!s.vlab&&s.st&&s.st.view==='bath',run(s){if(s.vlab||!s.st||s.st.view!=='bath')return;CARRY=s.st.P.h;BioLab.setValues(s,{view:'heat'});}},
    {id:'quench',label:'Quench in water',lvl:'bio',primary:true,enabled:s=>!s.vlab&&s.st&&s.st.view==='heat'&&s.st.heating,run(s){const st=s.st;if(s.vlab||!st||st.view!=='heat'||!st.heating)return;st.heating=false;st.quenched=true;if(st.P.T>100)st.steam=1.2;st.P.T=25;}},
    {id:'aircool',label:'Take it out and let it cool in air',lvl:'honors',enabled:s=>!s.vlab&&s.st&&s.st.view==='heat'&&s.st.heating,run(s){const st=s.st;if(s.vlab||!st||st.view!=='heat'||!st.heating)return;st.heating=false;st.quenched=false;}},
    {id:'fresh',label:'Start over',lvl:'bio',enabled:s=>!s.vlab,run(s){if(!s.vlab)BioLab.reset(s);}}
  ].concat(V_ACTIONS),
  labs:[LAB],
  benchRead(sim){const b=gB(sim);if(!b)return null;return {stn:b.stn,balance:b.bal.disp,on:b.bal.on,bathT:b.bath.disp,boil:b.bath.boil,timer:b.bath.t,cov:b.pens.map(P=>P.cov),
    held:b.fl.held,heldXs:b.fl.held>=0?xsOf(b.pens[b.fl.held]):null,heldOver:b.fl.held>=0?pOver(b.pens[b.fl.held]):null,pens:b.pens.map(P=>({xs:xsOf(P),st:P.st,over:P.wasOver,heated:P.heated})),
    level:b.cyl.filled?b.cyl.levels[b.cyl.n]:null,n:b.cyl.n};},
  init(sim){if(sim.vlab&&sim.vlab.lab.id==='golden-penny')return vInit(sim);return fullInit(sim);},
  step(sim,dt){if(sim.st.kind==='vlab'){vStep(sim,dt);return;}fullStep(sim,dt);},
  metrics:[
    {id:'xs',label:'Copper at the surface',unit:'%',lvl:'bio',min:0,max:100,d:0,get:s=>100*xsOf(pMain(s))},
    {id:'col',label:'Color',unit:'',lvl:'bio',text:true,get:s=>colorName(pMain(s))},
    {id:'T',label:'Penny temperature',unit:'°C',lvl:'bio',min:0,max:600,d:0,get:s=>pMain(s).T},
    {id:'chg',label:'Type of change',unit:'',lvl:'bio',text:true,get:s=>s.st&&s.st.kind==='full'?changeText(s):'—'},
    {id:'zn',label:'Zinc plated on',unit:'µm',lvl:'honors',min:0,max:3,d:2,get:s=>pMain(s).h},
    {id:'mass',label:'Penny mass',unit:'g',lvl:'honors',min:2,max:3.5,d:3,get:s=>massOf(pMain(s))},
    {id:'rho',label:'Penny density',unit:'g/cm³',lvl:'bio',min:0,max:20,d:2,get:s=>massOf(pMain(s))/volOf(pMain(s))},
    {id:'ph',label:'Surface phase',unit:'',lvl:'ap',text:true,get:s=>{const P=pMain(s);return P.c?phaseOf(xsOf(P))[1]:P.cov>0.95?'zinc layer on copper':P.h>0.01?'copper with zinc patches':'copper (no zinc yet)';}},
    {id:'at',label:'Surface copper, atom %',unit:'%',lvl:'ap',min:0,max:100,d:0,get:s=>atPct(xsOf(pMain(s)))}
  ],
  graphs:[{id:'surf',label:'Copper at the surface vs time',lvl:'bio',custom:true},{id:'depth',label:'Copper vs depth below the surface',lvl:'honors',custom:true},{id:'dens',label:'Density comparison',lvl:'bio',custom:true}],defaultGraph:'surf',
  plot(sim,ctx,box,id){const st=sim.st;if(!st||st.kind!=='full')return;const P=st.P;
    if(id==='surf'){const bath=st.view==='bath',H=st.hist,sc=bath?60:1,plate=sim.p.source==='plate';const xmax=Math.max(bath?3:(plate?180:20),(st.clk/sc)*1.1);
      const ax=axes(ctx,box,{xmin:0,xmax,ymin:0,ymax:100,xl:bath?'Time in the zinc bath (min)':'Time heating (s)',yl:'Copper at the surface (%)'});
      ctx.fillStyle=PAL['s4'];ctx.globalAlpha=0.16;ctx.fillRect(ax.X(0),ax.Y(80),ax.X(xmax)-ax.X(0),ax.Y(60)-ax.Y(80));ctx.globalAlpha=1;txt(ctx,'gold color',ax.X(xmax)-6,ax.Y(70),{s:12,a:'right',b:'middle',c:PAL['muted']});
      ctx.strokeStyle=serColor(0);ctx.lineWidth=2.5;ctx.beginPath();H.forEach((h,i)=>{const x=ax.X(h.t/sc),y=ax.Y(h.xs*100);if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y);});ctx.stroke();
      if(st.view==='gold')txt(ctx,'Choose step 1 or 2 to see this graph',box.L+box.W/2,box.T+box.H/2,{s:13,a:'center',c:PAL['muted']});return;}
    if(id==='depth'){if(!P.c&&P.h<=0){const ax=axes(ctx,box,{xmin:0,xmax:12,ymin:0,ymax:100,xl:'Depth below the surface (µm)',yl:'Copper (%)'});ctx.strokeStyle=serColor(0);ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(ax.X(0),ax.Y(100*(1-pBase(P))));ctx.lineTo(ax.X(12),ax.Y(100*(1-pBase(P))));ctx.stroke();return;}
      pProfileView(sim,ctx,box,P);return;}
    // density bars
    const rows=[['Gold',RHO.Au],['Copper',RHO.Cu],['Pre-1982',COIN.pre.rho],['Brass',RHO.brass],['Zinc',RHO.Zn],['Post-1982',COIN.post.rho],['Yours',massOf(P)/volOf(P)]];
    const ax=axes(ctx,box,{xmin:0,xmax:rows.length,ymin:0,ymax:20,xcats:rows.map(r=>r[0]),yl:'Density (g/cm³)'});
    rows.forEach((r,i)=>{const x0=ax.X(i+0.18),x1=ax.X(i+0.82);ctx.fillStyle=i===6?PAL['s4']:serColor(1);ctx.fillRect(x0,ax.Y(r[1]),x1-x0,ax.Y(0)-ax.Y(r[1]));txt(ctx,r[1].toFixed(1),(x0+x1)/2,ax.Y(r[1])-4,{s:12,c:PAL.fg,a:'center'});});},
  infoPanel(sim){const st=sim.st;if(!st||st.kind!=='full')return '';const hon=atLeast('honors'),ap=atLeast('ap'),P=st.P;let h='<h3>Physical or chemical change?</h3>';
    h+='<p><b>Zinc bath: chemical.</b> Zinc atoms in the granules become zincate ions, Zn(OH)₄²⁻, and hydrogen gas bubbles off. At the penny, zincate ions turn back into zinc metal. New substances form along the way.</p>';
    h+='<p><b>Heating: physical.</b> Zinc and copper atoms mix into brass, an alloy. An alloy is a mixture of metals, so no new compound forms and the mass stays the same. <b>Overheating</b> adds a chemical change: the hot surface reacts with oxygen.</p>';
    if(hon)h+='<p class="help"><b>Equations.</b> At the zinc: Zn(s) + 4OH⁻(aq) → Zn(OH)₄²⁻(aq) + 2e⁻, and 2H₂O(l) + 2e⁻ → H₂(g) + 2OH⁻(aq). At the copper surface: Zn(OH)₄²⁻(aq) + 2e⁻ → Zn(s) + 4OH⁻(aq). The penny must touch the zinc so electrons can flow between them.</p>';
    if(ap)h+='<p class="help"><b>Why zinc plates at all.</b> The same couple, Zn(OH)₄²⁻/Zn (E° = −1.20 V), runs at both metals, so pure zinc on pure zinc would gain nothing. Zinc that lands on copper dissolves into it as a Cu–Zn alloy, where its activity is lower than in the granules. That small difference drives the plating, so it slows once the copper is covered.</p>'+
      '<p class="help"><b>Brass phases</b> (approximate, room temperature, % copper by mass): <b>α</b> above about 62%: a substitutional solid solution, with zinc atoms on random sites of the copper fcc lattice. <b>β′</b> about 50 to 54%: the ordered intermetallic CuZn, where Cu and Zn alternate on a CsCl-type lattice; it disorders to β above about 460 °C. <b>γ</b> about 33 to 41%: Cu₅Zn₈, brittle and silvery. <b>ε</b> and <b>η</b>: zinc-rich. Gold color belongs to α and α + β′ brass.</p>';
    if(ap&&P.c){const x=xsOf(P);h+=`<p class="help">Now: surface ${Math.round(100*x)}% Cu by mass (${Math.round(atPct(x))} atom %), ${phaseOf(x)[1]}. D = ${Dz(P.T).toFixed(Dz(P.T)<0.1?3:2)} µm²/s at ${Math.round(P.T)} °C.</p>`;}
    return h;},
  narrate(sim){if(sim.st.kind==='vlab'&&sim.vlab)return vNarr(sim);const st=sim.st,P=st.P,p=sim.p,hon=atLeast('honors'),y=st.y;
    if(st.view==='bath'){if(hon&&!p.contact)return 'The penny sits in the hot NaOH but <b>does not touch the zinc</b>. The zinc still dissolves and fizzes, but its electrons cannot reach the penny, so no zinc plates onto it.';
      if(p.bathT<50&&P.cov<0.9)return 'The bath is only '+p.bathT+' °C, so the zinc dissolves slowly and the plating takes a long time. Classroom labs heat the NaOH to about 70 to 80 °C.';
      if(P.cov<0.3)return '<b>Zinc is starting to coat the copper.</b> Zinc dissolves from the granules in the hot NaOH and comes back out as zinc metal on the copper the penny touches.';
      if(P.cov<0.97)return 'Silver patches spread across the copper as the zinc layer grows to about '+P.h.toFixed(1)+' µm.';
      return '<b>The penny is silver now</b>: about '+P.h.toFixed(1)+' µm of zinc covers the copper. It is still a '+(y==='pre'?'copper':'zinc and copper')+' penny underneath. Press <b>Heat this penny</b>.';}
    if(st.view==='heat'){const x=xsOf(P),pc=Math.round(x*100);
      if(!st.heating&&st.quenched)return 'Quenching cooled the penny in an instant, so the atoms stopped moving and the color is locked in: <b>'+colorName(P)+'</b>, with '+pc+'% copper at the surface.';
      if(!st.heating)return 'Out of the flame, the penny is still '+Math.round(P.T)+' °C, so the atoms keep mixing as it cools. That is why you quench it.';
      if(P.T<150)return 'The penny is warming up ('+Math.round(P.T)+' °C). Atoms in a solid only jiggle in place until they are hot enough to hop between sites.';
      if(P.melt>=0.25)return '<b>The zinc core is melting</b> at 420 °C, and the penny blisters. The surface has gone '+colorName(P)+'.';
      if(x<0.45)return '<b>Zinc atoms are moving into the copper</b>, and copper atoms into the zinc. The surface is still mostly zinc ('+(100-pc)+'%), so it looks '+colorName(P)+'.';
      if(x<0.6)return 'The surface is brass now, but zinc-rich: '+pc+'% copper. It looks pale yellow.';
      if(x<=0.8&&P.tarn<0.35)return '<b>Gold!</b> The surface is brass with '+pc+'% copper and '+(100-pc)+'% zinc. It has the color of gold, but it is a mixture of copper and zinc. Quench it now to keep the color.';
      return 'Too long in the heat: the zinc spreads deeper, so the surface drifts back toward copper ('+pc+'%), and the hot metal reacts with oxygen. The gold turns '+colorName(P)+'.';}
    return 'A golden penny has the same mass and volume it had before, so its density is '+(massOf(P)/volOf(P)).toFixed(2)+' g/cm³. Gold is 19.3 g/cm³. <b>The color changed, but the penny is not gold.</b>';},
  tour:[
    {title:'A modern penny',text:'A penny made after 1982 is mostly zinc. A copper skin about 10 µm thick covers a zinc core. The zoom on the right shows a slice through that skin.',focus:[430,60,370,330],pause:true,setup(sim){BioLab.setValues(sim,{view:'bath',year:'post',zoom:'layers'});}},
    {title:'The zinc bath',text:'The penny lies on zinc granules in hot sodium hydroxide. Zinc dissolves from the granules, and zinc metal plates back out onto the copper where the penny touches the zinc.',focus:[100,180,230,170],speed:0.5},
    {title:'A silver penny',text:'In about a minute a zinc layer about 1 µm thick covers the copper, and the penny looks silver. Underneath, it is still the same penny.',focus:[[320,50,100,110],[430,60,370,330]],speed:1},
    {title:'Into the flame',text:'Hold the silver penny in the hot outer flame, just above the blue cone. Heat lets the atoms move: zinc atoms slip into the copper, and copper atoms into the zinc.',focus:[[130,110,200,280],[320,50,100,110]],speed:0.25,setup(sim){BioLab.setValues(sim,{view:'heat',source:'flame'});}},
    {title:'Brass forms',text:'Copper and zinc mix into brass, an alloy. In the zoom, the silver zinc layer turns into a gold brass layer that grows down into the copper.',focus:[430,60,370,330],speed:0.25},
    {title:'Gold color',text:'When the surface is about 60 to 80% copper, the brass looks gold. Quenching the penny in water now stops the atoms and keeps the color.',focus:[[320,50,100,110],[8,400,784,46]],speed:0.25},
    {title:'Too much heat',text:'Keep heating and the zinc spreads deeper, the hot surface reacts with oxygen, and the gold dulls toward bronze. The zinc core can even melt at 420 °C.',focus:[[320,50,100,140],[430,60,370,330]],speed:1},
    {title:'Is it gold?',text:'Density settles it. Gold is 19.3 g/cm³, but the golden penny is still about 7.2 g/cm³, the same as before. You made brass, not gold.',focus:[430,30,370,370],pause:true,setup(sim){BioLab.setValues(sim,{view:'gold'});}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{view:'bath',year:'post',source:'flame',zoom:'layers'});BioLab.reset(sim);},
  onChallenge(sim,ch,phase){if(ch&&ch.instant&&ch.set&&phase==='done'){BioLab.setValues(sim,ch.set);}},
  challenges:[
    {lvl:'bio',q:'You lay a copper penny on zinc granules in hot NaOH. What color does the penny turn?',choices:['Silver','Gold','It stays copper-colored'],correct:0,baseline:{view:'bath'},reveal:12,watch:'surf',
     explain:{bio:'Zinc from the granules plates onto the copper, and a zinc layer about 1 µm thick looks silver. The copper is still there underneath, so the graph of copper at the surface drops toward zero.'}},
    {lvl:'bio',q:'You heat the silver penny in a Bunsen flame and it turns gold. What is the gold-colored layer?',choices:['A thin layer of real gold','Brass: copper and zinc atoms mixed together','Copper, after the zinc burns away'],correct:1,baseline:{view:'heat',source:'flame'},reveal:8,watch:'surf',
     explain:{bio:'Nothing in the bath or the flame contains gold. Heat lets the zinc and copper atoms mix into brass, which is gold-colored when it is about 60 to 80% copper. Watch the zoom: the silver layer becomes a gold brass layer.'}},
    {lvl:'bio',q:'You leave the gold penny in the flame for 30 more seconds. What happens to its color?',choices:['It turns a deeper, shinier gold','It turns dull and bronze-brown','It turns silver again'],correct:1,baseline:{view:'heat',source:'flame'},reveal:32,watch:'surf',
     explain:{bio:'The zinc keeps spreading deeper into the copper, so the surface drifts back toward copper, and the hot metal reacts with oxygen and dulls. Gold color only lasts while the surface is about 60 to 80% copper.'}},
    {lvl:'bio',instant:true,set:{view:'gold'},q:'Is the golden penny made of gold?',choices:['Yes: it is the color of gold','No: its density is about 7.2 g/cm³, and gold is 19.3 g/cm³'],correct:1,
     explain:{bio:'Color can fool you; density cannot. A penny-sized piece of gold would weigh 6.7 g, but the golden penny weighs about 2.5 g, the same as before it was heated. The bars now show the densities.'}},
    {lvl:'honors',q:'The penny sits in the hot NaOH but does not touch the zinc. What happens?',choices:['It turns silver just as fast','It stays copper-colored','The penny dissolves'],correct:1,baseline:{view:'bath',contact:false},reveal:12,watch:'surf',
     explain:{honors:'The zinc granules still dissolve, but the electrons they release can only reach the penny through contact. Without contact, zincate ions are not reduced on the copper, so almost no zinc plates.'}},
    {lvl:'honors',q:'You weigh a silver penny before and after it turns gold. How does its mass change?',choices:['It gains a few tenths of a gram as it turns gold','It stays about the same: no atoms are added, they only mix','It loses about half its mass as the zinc burns off'],correct:1,baseline:{view:'heat',source:'flame'},reveal:8,watch:'surf',
     explain:{honors:'Brass forms when atoms already in the penny rearrange, so the mass stays the same to within about 0.001 g. Check the Penny mass readout. The mass only went up in the zinc bath, when zinc atoms moved onto the penny.'}},
    {lvl:'honors',q:'Compared with the outer Bunsen flame, how long does a 300 °C hot plate take to turn the penny gold?',choices:['About the same time','Over ten times longer','It never turns gold'],correct:1,baseline:{view:'heat',source:'plate'},reveal:24,watch:'surf',
     explain:{honors:'The flame heats the penny to about 400 °C in a few seconds, and it turns gold in about 6 s. On a 300 °C hot plate the atoms move far more slowly, so it takes about a minute and a half. Diffusion speeds up steeply with temperature.'}},
    {lvl:'honors',instant:true,set:{view:'gold',year:'pre'},q:'A penny from 1975 and one from 2005 are the same size. Which is denser?',choices:['The 1975 penny: it is 95% copper, about 8.8 g/cm³','The 2005 penny: zinc is denser than copper','They have the same density because they are the same size'],correct:0,
     explain:{honors:'Copper (8.96 g/cm³) is denser than zinc (7.14 g/cm³). The older penny is 3.11 g of mostly copper; the newer one is 2.50 g of mostly zinc in the same volume, about 0.35 cm³.'}},
    {lvl:'ap',instant:true,q:'Which equation describes what happens to the zinc granules in the hot NaOH?',choices:['Zn(s) + 2OH⁻(aq) + 2H₂O(l) → Zn(OH)₄²⁻(aq) + H₂(g)','Zn(s) + 2Na⁺(aq) → Zn²⁺(aq) + 2Na(s)','Cu(s) + Zn²⁺(aq) → Cu²⁺(aq) + Zn(s)'],correct:0,
     explain:{ap:'Zinc is amphoteric: in strong base it dissolves as the zincate ion and water is reduced to H₂, which is the fizzing you see. Zinc cannot reduce Na⁺, and copper cannot reduce zinc ions (E° of Cu²⁺/Cu is +0.34 V, Zn²⁺/Zn is −0.76 V).'}},
    {lvl:'ap',q:'The surface reaches about 70% copper and looks gold. What kind of solid is it?',choices:['α brass: a solid solution, with zinc atoms on random copper sites','β′ brass: Cu and Zn atoms alternating in an ordered pattern','A compound with the fixed formula Cu₇Zn₃'],correct:0,baseline:{view:'heat',source:'flame',zoom:'atoms'},reveal:8,watch:'depth',
     explain:{ap:'Above about 62% copper, brass is the α phase: zinc atoms substitute for copper at random sites in the fcc lattice. Its composition can vary continuously, which is why it is a solution, not a compound. The atom zoom shows the random mixing.'}},
    {lvl:'ap',instant:true,q:'Early in heating, part of the layer passes through about 50% copper. Which phase is that?',choices:['α brass, a random solid solution','β′ brass, CuZn: an ordered intermetallic with Cu and Zn alternating','Pure zinc'],correct:1,
     explain:{ap:'Near 50% copper, brass orders into β′ (CuZn, CsCl-type structure): Cu and Zn alternate, like a checkerboard in the atom zoom. A fixed 1 : 1 ratio and its own structure make an intermetallic closer to a compound, which is why the line between alloy and compound is not sharp.'}},
    {lvl:'ap',instant:true,q:'In this model, D = D₀e^(−Ea/RT) with Ea = 110 kJ/mol. About how much faster does brass form at 420 °C than at 300 °C?',choices:['About 2 times','About 50 times','About 500 times'],correct:1,
     explain:{ap:'D(693 K)/D(573 K) = exp[(110 000/8.314)(1/573 − 1/693)] ≈ e⁴ ≈ 54. The real activation energy depends on the phases and on grain-boundary diffusion; this value is tuned to classroom timing (see About this model).'}}
  ],
  lab:{bio:'<p><b>Question:</b> What makes a penny turn silver, and then gold?</p><ol><li>In step 1, press Play and watch the copper at the surface drop. Record a trial when the penny is silver.</li><li>Press <b>Heat this penny</b>. Quench it when it looks gold and record a trial. Note the copper at the surface and the density.</li><li>Start over, and this time let it heat for 30 s before you quench it.</li><li>Open step 3 and compare the densities.</li></ol><p>Write which steps were physical changes and which were chemical, and explain why the golden penny is not gold.</p>',
       honors:'<p><b>Question:</b> How do the bath and the heat control the brass you make?</p><ol><li>In step 1, change the bath temperature (50, 65, 80 and 95 °C). Record the time it takes to turn fully silver.</li><li>Turn off <b>Penny touches the zinc</b> and explain the result.</li><li>In step 2, start with zinc layers of 0.6, 1.3 and 2.5 µm. Record when the surface first reaches 60% copper and when it passes 80%.</li><li>Compare the flame with the hot plate.</li></ol><p>Use the Penny mass readout to argue whether heating is a physical change, and switch the Zoom to Atoms to describe brass at the particle level.</p>',
       ap:'<p><b>Question:</b> How does temperature control interdiffusion, and which phases form on the way to gold?</p><ol><li>Choose <b>Set the temperature</b>. For 300, 350, 400 and 450 °C, record the time for the surface to reach 70% copper.</li><li>Plot ln(1/t) against 1/T and find Ea from the slope. Compare it with the model value.</li><li>Use the depth graph and the Surface phase readout to list the phases the surface passes through.</li></ol><p><b>Claim–evidence–reasoning:</b> Explain why the gold color appears in a narrow window of time, using diffusion and the Cu–Zn phases.</p>'},
  terms:[{t:'Alloy',d:'A mixture of metals, or of a metal with another element. Brass is an alloy of copper and zinc.'},{t:'Brass',d:'An alloy of copper and zinc. Brass with about 60% to 80% copper is gold-colored.'},
    {t:'Plating',d:'Coating an object with a thin layer of metal, such as zinc on copper.'},{t:'Physical change',d:'A change in form or arrangement that makes no new substance, such as melting or mixing metals.'},
    {t:'Chemical change',d:'A change that makes new substances, with evidence such as gas bubbles, a color change or heat.'},{t:'Density',d:'Mass divided by volume. It identifies a material no matter how big the sample is.'},
    {lvl:'honors',t:'Zincate ion',d:'Zn(OH)₄²⁻, the ion zinc forms when it dissolves in a strong base such as NaOH.'},{lvl:'honors',t:'Diffusion',d:'The spreading of atoms or molecules from where they are concentrated. In a hot solid, atoms hop between sites.'},
    {lvl:'honors',t:'Quench',d:'Cool something fast, for example by plunging a hot penny into water, to stop a change.'},
    {lvl:'ap',t:'Solid solution',d:'A solid in which one kind of atom takes the place of another at random lattice sites, like zinc in α brass.'},{lvl:'ap',t:'Intermetallic compound',d:'An ordered solid of two metals with a nearly fixed ratio and its own structure, like β′ brass, CuZn.'},
    {lvl:'ap',t:'Amphoteric',d:'Able to react as an acid or as a base. Zinc dissolves in acids as Zn²⁺ and in strong bases as zincate.'}],
  about:'<p><b>The pennies.</b> Composition and masses are US Mint values: since 1982, 2.500 g with 97.5% zinc and 2.5% copper plating; before 1982, 3.11 g of 95% copper and 5% zinc. Densities are CRC values (gold 19.3, copper 8.96, zinc 7.14, 70/30 brass 8.53 g/cm³). The penny volume, 0.348 cm³, and the plating thickness, about 10.6 µm, are computed from the composition and a surface area of 6.61 cm² (two faces and the rim), so the penny densities, 7.18 and 8.85 g/cm³, are calculated.</p>'+
    '<p><b>The zinc bath.</b> Zinc plates at a rate that rises with temperature (Arrhenius form, 50 kJ/mol, about 0.8 µm per minute at 75 °C with good contact) and slows as the layer thickens, because the driving force comes from zinc alloying with copper. Without contact the rate is cut to 2%. The layer looks fully silver at about 1 µm. Mass gain uses zinc at 7.14 g/cm³ over 6.61 cm².</p>'+
    '<p><b>Heating.</b> The model solves one-dimensional diffusion through the zinc layer and the copper plating (40 slices) with one effective interdiffusion coefficient, D = 3.5 µm²/s × exp[−(110 kJ/mol)/R × (1/T − 1/673 K)]. Real Cu–Zn interdiffusion depends strongly on composition and phase, and thin films mix faster through grain boundaries and, near 420 °C, through melting zinc. The effective values here are tuned so the penny turns gold in about 5 to 8 s in the outer flame and in about 1 to 2 minutes on a 300 °C hot plate, as in classroom labs. The penny warms toward the flame temperature with a time constant of about 3 s; a post-1982 core holds at 419.5 °C while it melts (latent heat 112 J/g). Surface oxidation is a single tarnish index that grows above 250 °C. The model ignores zinc diffusing up from the core and zinc evaporating, and treats mass and volume fractions as equal.</p>'+
    '<p><b>Color and phases.</b> Colors are drawn from the surface copper fraction: silver below about 25%, pale yellow near 50%, gold from 60% to 80%, then bronze and copper. Phase ranges come from the Cu–Zn phase diagram at room temperature and are approximate. The atom zoom is a 2D cartoon of each depth slice, not a crystal structure to scale.</p>'+
    '<p><b>The virtual lab bench.</b> Each penny has its own seeded mass (2.500 ± 0.011 g), dirt, plating rate, flame temperature (445 to 495 °C) and heating time constant, so the time to gold differs between pennies and between students. Cleaning removes 1 to 3 mg of oxide. The balance shows the true mass to 0.01 g, with a last digit that can wander by 0.01 g, and reads a little above zero until it is tared. The bath heats with a time constant of 150 s of bench time; the bath clock runs 10× faster than real time. Dropping a penny straight into the cylinder splashes out 0.1 to 0.3 mL. A 50 mL cylinder replaces the 10 mL one because a 19 mm penny does not fit in a 10 mL cylinder.</p>',
  initVis(sim){},
  thumbSetup(sim){BioLab.setValues(sim,{view:'heat',source:'flame'});for(let i=0;i<300&&xsOf(sim.st.P)<0.68;i++)fullStep(sim,0.02);sim.st.heating=false;sim.st.quenched=true;sim.st.P.T=25;},
  thumbFrames:2,
  draw(sim,ctx,vdt,k,t){if(sim.st.kind==='vlab'&&sim.vlab){vDraw(sim,ctx,vdt,k,t);return;}fullDraw(sim,ctx,vdt,k,t);}
};
function pProfileView(sim,ctx,box,P){const L=P.c?P.L:P.h+HCU,ap=atLeast('ap');const ax=axes(ctx,box,{xmin:0,xmax:Math.ceil(L),ymin:0,ymax:100,xl:'Depth below the surface (µm)',yl:'Copper (%)'});
  if(ap){[[62,100,'α'],[50,54,'β′'],[33,41,'γ'],[13,22,'ε']].forEach(([a,b,n],i)=>{ctx.fillStyle=serColor(i+1);ctx.globalAlpha=0.12;ctx.fillRect(ax.X(0),ax.Y(b),ax.X(Math.ceil(L))-ax.X(0),ax.Y(a)-ax.Y(b));ctx.globalAlpha=1;txt(ctx,n,ax.X(Math.ceil(L))-6,ax.Y((a+b)/2),{s:12,a:'right',b:'middle',c:PAL['muted']});});}
  else{ctx.fillStyle=PAL['s4'];ctx.globalAlpha=0.16;ctx.fillRect(ax.X(0),ax.Y(80),ax.X(Math.ceil(L))-ax.X(0),ax.Y(60)-ax.Y(80));ctx.globalAlpha=1;txt(ctx,'gold color',ax.X(Math.ceil(L))-6,ax.Y(70),{s:12,a:'right',b:'middle',c:PAL['muted']});}
  ctx.strokeStyle=serColor(0);ctx.lineWidth=2.5;ctx.beginPath();
  if(P.c)P.c.forEach((c,i)=>{const x=ax.X((i+0.5)*P.L/NZ),y=ax.Y(100*(1-c));if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y);});
  else{const top=100*(1-P.cov)*(1-pBase(P));ctx.moveTo(ax.X(0),ax.Y(top));ctx.lineTo(ax.X(P.h),ax.Y(top));ctx.lineTo(ax.X(P.h),ax.Y(100*(1-pBase(P))));ctx.lineTo(ax.X(L),ax.Y(100*(1-pBase(P))));}
  ctx.stroke();}
BioLab.register(GP);
BioLab.addPractical({goldenpenny:{
  hook:'Heat a 2.5-gram penny for a few seconds and it turns as gold as a wedding ring. A penny-sized piece of real gold would weigh 6.7 g. Did the flame make gold?',
  answer:'No. The golden penny still weighs about 2.5 g and still has a volume of about 0.35 cm³, so its density stays near 7.2 g/cm³. Gold is 19.3 g/cm³. The flame only mixed the zinc layer into the copper skin, making brass with about 60 to 80% copper at the surface, which happens to be gold-colored.',
  uses:['Trumpets, trombones and tubas are made of brass because it is easy to shape, resists corrosion and has a warm, bright tone.','Plumbing valves and faucet fittings are brass because it is easy to machine and does not rust in water.','Galvanized nails, guardrails and fence posts are steel coated with zinc. The zinc corrodes first, so the steel underneath stays protected.'],
  takeaway:'Color can change without making a new element: mixing copper and zinc into brass makes a gold color, but density shows it is still copper and zinc.',
  lede:'Turn a penny silver in a zinc bath, then gold in a flame. Watch the copper and zinc atoms mix into brass, and use density to test whether you made gold.',
  tour:['A penny made since 1982 is mostly zinc inside, with a copper skin thinner than a hair. The zoom on the right shows a slice through that skin.',
    'The penny sits on bits of zinc in a hot, strong base. Zinc dissolves, then comes back out as a coat of zinc metal on the penny, like paint that sticks only where the penny touches the zinc.',
    'In about a minute the zinc coat covers the copper, and the penny looks silver, like a dime. The copper is still underneath.',
    'Heat makes atoms move. In the flame, zinc atoms slip into the copper and copper atoms slip into the zinc, the way cream swirls into coffee.',
    'Copper and zinc mixed together make brass, the metal in a trumpet. The zoom shows the silver layer turning into a gold layer.',
    'When the surface is about 60 to 80% copper, it looks gold. Dunk the penny in water right away to lock the color in.',
    'Heat it too long and it goes dull and brown, like a pan left on the stove.',
    'Gold is 19.3 g/cm³, but the golden penny is still about 7.2 g/cm³. It is the same penny with a brass skin, not gold.']}});
})();
