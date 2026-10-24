(function(){
'use strict';
const {clamp,lerp,rng,rr,txt,pill,atLeast,PAL,FONT,RM}=BioLab.h;
const CL=window.ChemLab;
/* Separating mixtures. Three mixtures, each separated by real techniques chosen in order.
   Sand/salt/iron: a mass-balance model. Each step moves grams between vessels by the property it uses
   (magnetism, solubility 36 g NaCl per 100 mL water, particle size, density, boiling point).
   Ethanol/water: Rayleigh distillation on the real 1 atm vapor–liquid equilibrium data (Perry’s), with
   N theoretical plates for a fractionating column. Ink: paper chromatography with Rf from dye polarity. */
const INIT={sand:10,salt:5,iron:3};
const HEAT={low:{f:0.6,evap:2.5,spat:0,vap:0.035,l:'low'},med:{f:1,evap:4,spat:0.01,vap:0.06,l:'medium'},high:{f:1.6,evap:6.5,spat:0.06,vap:0.1,l:'high'}};
const heatOf=sim=>HEAT[atLeast('honors')?sim.p.heat:'med'];
// ethanol–water VLE at 1 atm: liquid mole fraction x, vapor mole fraction y, boiling temperature (°C)
const VX=[0,0.019,0.0721,0.0966,0.1238,0.1661,0.2337,0.2608,0.3273,0.3965,0.5079,0.5198,0.5732,0.6763,0.7472,0.8943,1];
const VY=[0,0.17,0.3891,0.4375,0.4704,0.5089,0.5445,0.558,0.5826,0.6122,0.6564,0.6599,0.6841,0.7385,0.7815,0.8943,1];
const VT=[100,95.5,89.0,86.7,85.3,84.1,82.7,82.3,81.5,80.7,79.8,79.7,79.3,78.74,78.41,78.15,78.3];
function interp(xs,ys,x){x=clamp(x,0,1);for(let i=1;i<xs.length;i++){if(x<=xs[i]){const f=(x-xs[i-1])/(xs[i]-xs[i-1]);return ys[i-1]+(ys[i]-ys[i-1])*f;}}return ys[ys.length-1];}
const yEq=x=>interp(VX,VY,x),Tb=x=>interp(VX,VT,x);
function topLiquid(x,N){for(let i=1;i<N;i++)x=yEq(x);return x;}
const E0=50*0.789/46.07,W0=50*0.998/18.02;
const volOf=(E,W)=>E*46.07/0.789+W*18.02/0.998;
const volPct=(E,W)=>{const v=volOf(E,W);return v>0?100*E*46.07/0.789/v:0;};
const molToVol=y=>volPct(y,1-y);
const DYES=[{n:'yellow',c:'#d9a400',p:0.9},{n:'magenta',c:'#c2185b',p:0.55},{n:'blue',c:'#1e50c8',p:0.25}];
const rf=(d,s)=>s==='water'?0.15+0.8*d.p:0.15+0.75*(1-d.p);
const solvOf=sim=>atLeast('honors')?sim.p.solv:'water';
const front=st=>8*Math.sqrt(Math.min(st.tt,12)/12);

/* ---------- sand, salt, iron: mass-balance steps ---------- */
const vessel=o=>Object.assign({sand:0,salt:0,aq:0,iron:0,water:0},o||{});
const dryMass=v=>v.sand+v.salt+v.aq+v.iron;
function newState(mix){
  if(mix==='eth')return {mix,E:E0,W:W0,Tpot:22,Thead:22,on:false,boil:false,rec:[{E:0,W:0}],msg:'',msgT:0,zoom:'ethliq'};
  if(mix==='ink')return {mix,run:false,tt:0,msg:'',msgT:0,zoom:'chrom'};
  return {mix:'sss',main:vessel({sand:INIT.sand,salt:INIT.salt,iron:INIT.iron}),filt:null,prods:[],busy:null,T:22,log:[],msg:'',msgT:0,zoom:'mix',lost:0};}
function addProd(st,where,label,o){let p=st.prods.find(q=>q.where===where);if(!p){p=Object.assign(vessel(),{where,label});st.prods.push(p);}['sand','salt','aq','iron','water'].forEach(k=>{p[k]+=o[k]||0;});return p;}
function dissolve(v){const cap=0.36*v.water,d=Math.max(0,Math.min(v.salt,cap-v.aq));v.salt-=d;v.aq+=d;}
function heatTarget(st){return st.filt&&st.filt.water>0.01?'filt':st.main.water>0.01?'main':null;}
function heatTimes(w,h,dist){const th=78/(12*h.f),tb=w/(h.evap*(dist?0.8:1));return {th,tb,dur:th+tb+1};}
const STEP_L={magnet:'magnet',water:'add water',filter:'filter',decant:'decant',evap:'evaporate',distill:'distill'};
function check(st,kind){const m=st.main;
  if(kind==='magnet')return m.iron>0.01?'':'There is no iron left in the beaker to pick up.';
  if(kind==='water')return m.water>=150?'The beaker is full.':(dryMass(m)<0.01?'The beaker is empty. Water would have nothing to dissolve.':'');
  if(kind==='filter'||kind==='decant')return m.water>0.01?'':(dryMass(m)<0.01?'The beaker is empty.':'Add water first: '+(kind==='filter'?'filtering separates a solid from a liquid.':'decanting pours a liquid off a solid.'));
  if(kind==='evap'||kind==='distill')return heatTarget(st)?'':'There is no liquid to heat.';return '';}
function begin(sim,kind){const st=sim.st;if(st.mix!=='sss')return;if(st.busy){say(st,'Wait for the current step to finish.');return;}const why=check(st,kind);if(why){say(st,why);return;}
  const h=heatOf(sim);let dur={magnet:1,water:2,filter:4,decant:1}[kind]||0,tgt=null,ht=null;
  if(kind==='evap'||kind==='distill'){tgt=heatTarget(st);ht=heatTimes(st[tgt].water,h,kind==='distill');dur=ht.dur;}
  st.busy={kind,t:0,dur,tgt,ht,w0:tgt?st[tgt].water:0,h};st.zoom=kind;st.log.push(STEP_L[kind]);}
function finish(st,b){const m=st.main,kind=b.kind;
  if(kind==='magnet'){const wet=m.water>0;const got=m.iron*(wet?0.93:0.97),cs=Math.min(0.12,m.sand),cl=Math.min(0.04,m.salt);m.iron-=got;m.sand-=cs;m.salt-=cl;addProd(st,'magnet','On the magnet',{iron:got,sand:cs,salt:cl});}
  else if(kind==='water'){m.water+=50;dissolve(m);}
  else if(kind==='filter'){const keep=Math.min(3,m.water),fr=keep/m.water;addProd(st,'paper','Filter paper (dried)',{sand:m.sand,salt:m.salt+m.aq*fr,iron:m.iron});
    const f=vessel({water:m.water-keep,aq:m.aq*(1-fr)});if(st.filt){st.filt.water+=f.water;st.filt.aq+=f.aq;}else st.filt=f;st.main=vessel();}
  else if(kind==='decant'){const fs=Math.min(0.25,m.sand),f=vessel({water:m.water*0.85,aq:m.aq*0.85,sand:fs});m.water*=0.15;m.aq*=0.15;m.sand-=fs;
    if(st.filt){['water','aq','sand'].forEach(k=>st.filt[k]+=f[k]);}else st.filt=f;}
  else if(kind==='evap'||kind==='distill'){const v=st[b.tgt],sl=v.salt+v.aq,loss=kind==='evap'?b.h.spat:0;
    if(kind==='distill')addProd(st,'receiver','Receiver (distilled water)',{water:0.98*v.water});
    const wh=kind==='distill'?'flask':b.tgt==='main'?'dried':'dish';addProd(st,wh,wh==='flask'?'Distilling flask':wh==='dried'?'Dried in the beaker':'Evaporating dish',{sand:v.sand,salt:sl*(1-loss),iron:v.iron});st.lost+=sl*loss;
    if(b.tgt==='main')st.main=vessel();else st.filt=null;}}
function say(st,s){st.msg=s;st.msgT=3;}
function runNow(st,kind,h){const why=check(st,kind);if(why)return;let tgt=null,ht=null;if(kind==='evap'||kind==='distill'){tgt=heatTarget(st);}finish(st,{kind,tgt,h});st.log.push(STEP_L[kind]);st.zoom=kind;}
function fractions(st){const L=st.prods.slice();const m=st.main;if(dryMass(m)>0.01)L.push(Object.assign({},m,{where:'beaker',label:'Left in the beaker'}));if(st.filt&&dryMass(st.filt)+st.filt.water>0.01)L.push(Object.assign({},st.filt,{where:'filtrate',label:'Filtrate (flask)'}));return L;}
function majority(f){const a=[['sand',f.sand],['salt',f.salt+f.aq],['iron',f.iron]].sort((p,q)=>q[1]-p[1]);return a[0][1]>0.005?a[0][0]:null;}
const isDry=f=>f.where==='paper'||f.where==='magnet'||f.water<0.01;
function recovery(st,c){let s=0;st.prods.forEach(f=>{if(isDry(f)&&majority(f)===c)s+=c==='salt'?f.salt+f.aq:f[c];});return 100*s/INIT[c];}
function purity(st,c){let best=null;st.prods.forEach(f=>{if(isDry(f)&&majority(f)===c){const v=c==='salt'?f.salt+f.aq:f[c];if(!best||v>best.v)best={v,f};}});return best?100*best.v/dryMass(best.f):NaN;}
function simulate(seq,heat){const st=newState('sss');seq.forEach(k=>runNow(st,k,HEAT[heat||'med']));return st;}

/* ---------- mode visibility (controls and buttons that only apply to one mixture) ---------- */
function syncMode(sim){if(!sim.ui||!sim.ui.sec)return;const mode=sim.p.mix,d=sim.def;
  d.controls.forEach(c=>{if(!c.modes)return;const cid=d.id+'-'+c.id,e=document.getElementById(cid)||document.getElementById(cid+'-l');if(!e)return;const w=e.closest('.ctl');if(w)w.hidden=!atLeast(c.lvl)||!c.modes.includes(mode);});
  d.metrics.forEach(m=>{if(!m.modes)return;const t=sim.ui.tiles[m.id];if(!t)return;const w=t.num.closest('.tile');if(w)w.hidden=!atLeast(m.lvl)||!m.modes.includes(mode);});
  const btns=[...sim.ui.sec.querySelectorAll('.actions button')];d.actions.forEach(a=>{const b=btns.find(x=>x.textContent===a.label);if(b)b.hidden=!atLeast(a.lvl)||!a.modes.includes(mode);});}
const ALL=['sss','eth','ink'];

/* ---------- drawing helpers ---------- */
const COL={sand:'#c9a66b',salt:'#eef2f5',iron:'#5d636c',water:'#5aa0d8'};
function drawBeakerV(ctx,x,y,w,h,v,water,t){const fill=clamp(water/200,0,0.95);const L=CL.drawBeaker(ctx,{x,y,w,h,fill:fill<0.005?0:fill});
  let by=y+h-2;const sH=v.sand*2.4,iH=v.iron*1.6,cH=v.salt*1.8;
  if(sH>0.3){ctx.fillStyle=COL.sand;ctx.fillRect(x+3,by-sH,w-6,sH);ctx.fillStyle='#a8844d';for(let i=0;i<Math.round(v.sand*4);i++)ctx.fillRect(x+6+(i*37)%(w-14),by-sH+2+(i*13)%Math.max(2,sH-4),3,3);by-=sH;}
  if(iH>0.3){ctx.fillStyle=COL.iron;for(let i=0;i<Math.round(v.iron*18);i++)ctx.fillRect(x+6+(i*29)%(w-14),by-2-(i*7)%Math.max(3,iH*2),3,2);}
  if(cH>0.3){ctx.fillStyle=COL.salt;ctx.strokeStyle='#8a9aa6';ctx.lineWidth=1;for(let i=0;i<Math.round(v.salt*7);i++){const sx=x+8+(i*23)%(w-18),sy=by-5-(i*5)%Math.max(4,cH*2);ctx.fillRect(sx,sy,5,5);ctx.strokeRect(sx,sy,5,5);}}
  return L;}
function flame(ctx,x,y,s,t){const f=RM?1:1+0.08*Math.sin(t*25);ctx.fillStyle='rgba(60,120,240,.8)';ctx.beginPath();ctx.moveTo(x-8*s,y);ctx.quadraticCurveTo(x-10*s,y-24*s*f,x,y-40*s*f);ctx.quadraticCurveTo(x+10*s,y-24*s*f,x+8*s,y);ctx.fill();
  ctx.fillStyle='rgba(150,200,255,.9)';ctx.beginPath();ctx.moveTo(x-4*s,y);ctx.quadraticCurveTo(x-5*s,y-12*s,x,y-20*s);ctx.quadraticCurveTo(x+5*s,y-12*s,x+4*s,y);ctx.fill();}
function burner(ctx,x,y,on,s,t){const P=PAL;ctx.fillStyle=P['cv-soft'];ctx.fillRect(x-7,y-50,14,50);rr(ctx,x-24,y-6,48,8,3);ctx.fill();if(on)flame(ctx,x,y-50,s,t);}
function ringStand(ctx,x,y,h){const P=PAL;ctx.strokeStyle=P['cv-soft'];ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(x,410);ctx.lineTo(x,y-h);ctx.stroke();ctx.fillStyle=P['cv-soft'];rr(ctx,x-30,404,90,8,3);ctx.fill();}
function drawMagnet(ctx,x,y,iron){ctx.lineWidth=16;ctx.lineCap='butt';ctx.strokeStyle='#c62828';ctx.beginPath();ctx.moveTo(x-22,y);ctx.lineTo(x-22,y-40);ctx.arc(x,y-40,22,Math.PI,0);ctx.lineTo(x+22,y);ctx.stroke();
  ctx.fillStyle='#d9dde2';ctx.fillRect(x-30,y-2,16,12);ctx.fillRect(x+14,y-2,16,12);if(iron>0.01){ctx.fillStyle=COL.iron;for(let i=0;i<Math.round(iron*14);i++)ctx.fillRect(x-32+(i*11)%64,y+10+(i*5)%10,3,4);}}
function drawFlaskE(ctx,x,y,v,label){const P=PAL;ctx.strokeStyle=P['cv-glass'];ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(x-12,y);ctx.lineTo(x-12,y+40);ctx.lineTo(x-55,y+120);ctx.lineTo(x+55,y+120);ctx.lineTo(x+12,y+40);ctx.lineTo(x+12,y);ctx.stroke();
  if(v&&v.water>0.01){const f=clamp(v.water/150,0.05,0.9),ly=y+120-70*f;ctx.save();ctx.beginPath();ctx.moveTo(x-55,y+120);ctx.lineTo(x+55,y+120);ctx.lineTo(x+12+43*(ly-y-40)/80,ly);ctx.lineTo(x-12-43*(ly-y-40)/80,ly);ctx.closePath();ctx.fillStyle=P['cv-water'];ctx.fill();ctx.restore();}}
function drawFunnel(ctx,x,y,solids,drip,t){const P=PAL;ctx.fillStyle='rgba(235,225,200,.9)';ctx.beginPath();ctx.moveTo(x-46,y);ctx.lineTo(x+46,y);ctx.lineTo(x,y+60);ctx.closePath();ctx.fill();
  ctx.strokeStyle=P['cv-glass'];ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(x-52,y-4);ctx.lineTo(x-7,y+62);ctx.lineTo(x-7,y+100);ctx.moveTo(x+52,y-4);ctx.lineTo(x+7,y+62);ctx.lineTo(x+7,y+100);ctx.stroke();
  if(solids>0.01){ctx.fillStyle=COL.sand;ctx.beginPath();ctx.moveTo(x-24,y+26);ctx.lineTo(x+24,y+26);ctx.lineTo(x,y+56);ctx.closePath();ctx.fill();}
  if(drip){const ph=(t*1.5)%1;ctx.fillStyle=P['cv-water'];ctx.beginPath();ctx.arc(x,y+104+ph*30,3.5,0,6.283);ctx.fill();}}
function drawDistill(sim,ctx,o,t,k){const P=PAL;const fx=150,fy=318,fr=56,N=o.plates||1,colH=N>1?24+N*16:0,headY=fy-fr-70-colH;
  // heating mantle
  ctx.fillStyle=o.on?'#b5451b':P['cv-soft'];rr(ctx,fx-70,fy+16,140,56,14);ctx.fill();if(o.on){ctx.fillStyle='rgba(255,140,60,.35)';rr(ctx,fx-62,fy+18,124,10,5);ctx.fill();}
  // flask with liquid
  ctx.save();ctx.beginPath();ctx.arc(fx,fy,fr,0,6.283);ctx.clip();const lf=clamp(o.liq,0,1);ctx.fillStyle=o.liqCol||P['cv-water'];ctx.fillRect(fx-fr,fy+fr-2*fr*lf*0.85,2*fr,2*fr);
  if(o.boil){ctx.fillStyle=P['cv-bubble'];for(let i=0;i<9;i++){const ph=(t*0.9+i*0.17)%1;ctx.beginPath();ctx.arc(fx-40+(i*23)%80,fy+fr-ph*2*fr*lf*0.85,2.5+ph*2,0,6.283);ctx.fill();}}
  if(o.residue>0.01){ctx.fillStyle=COL.salt;ctx.fillRect(fx-30,fy+fr-8,60,8);}ctx.restore();
  ctx.strokeStyle=P['cv-glass'];ctx.lineWidth=3;ctx.beginPath();ctx.arc(fx,fy,fr,-1.35,4.49);ctx.stroke();
  ctx.beginPath();ctx.moveTo(fx-12,fy-fr+2);ctx.lineTo(fx-12,headY);ctx.moveTo(fx+12,fy-fr+2);ctx.lineTo(fx+12,headY+22);ctx.stroke();
  if(N>1){ctx.fillStyle=P['cv-bg2'];ctx.fillRect(fx-11,fy-fr-10-colH,22,colH);ctx.strokeStyle=P['cv-soft'];ctx.lineWidth=1.5;for(let i=1;i<=N;i++){const yy=fy-fr-10-colH+colH*i/(N+1);ctx.beginPath();ctx.moveTo(fx-10,yy);ctx.lineTo(fx+10,yy);ctx.stroke();}
    txt(ctx,N+' plates',fx-20,fy-fr-10-colH/2,{s:12*k,w:700,a:'right',b:'middle',c:P['cv-soft']});}
  // thermometer in the still head
  ctx.strokeStyle=P['cv-ink'];ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(fx,headY-50);ctx.lineTo(fx,headY+16);ctx.stroke();ctx.fillStyle='#c62828';ctx.beginPath();ctx.arc(fx,headY+18,5,0,6.283);ctx.fill();
  pill(ctx,o.T.toFixed(1)+' °C',fx,headY-64,P['card'],P['cv-ink'],15*k);
  // condenser to the receiver
  const cx1=fx+12,cy1=headY+10,cx2=372,cy2=fy-40;ctx.strokeStyle=P['cv-glass'];ctx.lineWidth=16;ctx.lineCap='round';ctx.globalAlpha=0.35;ctx.beginPath();ctx.moveTo(cx1+40,cy1+(cy2-cy1)*0.17);ctx.lineTo(cx2-30,cy2-(cy2-cy1)*0.12);ctx.stroke();ctx.globalAlpha=1;
  ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(cx1,cy1);ctx.lineTo(cx2,cy2);ctx.stroke();ctx.lineCap='butt';
  if(k<1.3)txt(ctx,'condenser (cold water)',(cx1+cx2)/2+16,(cy1+cy2)/2-18,{s:12,c:P['cv-soft'],a:'center'});
  if(o.drip){const ph=(t*1.6)%1;ctx.fillStyle=P['cv-water'];ctx.beginPath();ctx.arc(cx2,cy2+6+ph*30,3.5,0,6.283);ctx.fill();}
  // receiver
  const rx=cx2,ry=cy2+44;ctx.strokeStyle=P['cv-glass'];ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(rx-10,ry-8);ctx.lineTo(rx-10,ry+20);ctx.lineTo(rx-38,ry+76);ctx.lineTo(rx+38,ry+76);ctx.lineTo(rx+10,ry+20);ctx.lineTo(rx+10,ry-8);ctx.stroke();
  if(o.rec>0.01){const f=clamp(o.rec,0.04,0.85),ly=ry+76-50*f;ctx.fillStyle=o.recCol||P['cv-water'];ctx.beginPath();ctx.moveTo(rx-38,ry+76);ctx.lineTo(rx+38,ry+76);ctx.lineTo(rx+38-28*f*0.9,ly);ctx.lineTo(rx-38+28*f*0.9,ly);ctx.closePath();ctx.fill();}
  txt(ctx,'receiver',rx,ry+96,{s:12*k,a:'center',c:P['cv-soft']});}
function drawChrom(sim,ctx,st,k){const P=PAL,x=170,w=150,y=110,h=290,sx=x+w/2-22,sw=44,cm=27,base=y+h-14,orig=base-1.5*cm,d=front(st),solv=solvOf(sim);
  CL.drawBeaker(ctx,{x,y,w,h,fill:0.1,liquid:solv==='water'?P['cv-water']:'rgba(190,170,240,.45)'});
  ctx.fillStyle='#f4f1e8';ctx.fillRect(sx,y-30,sw,base-y+30);ctx.strokeStyle='#bdb5a0';ctx.lineWidth=1;ctx.strokeRect(sx,y-30,sw,base-y+30);
  ctx.fillStyle=P['cv-soft'];ctx.fillRect(sx-30,y-34,sw+60,6);
  if(d>0.05){ctx.fillStyle='rgba(120,160,220,.18)';ctx.fillRect(sx,orig-d*cm,sw,base-orig+d*cm);ctx.strokeStyle='#5c7fb6';ctx.setLineDash([4,3]);ctx.beginPath();ctx.moveTo(sx,orig-d*cm);ctx.lineTo(sx+sw,orig-d*cm);ctx.stroke();ctx.setLineDash([]);}
  ctx.strokeStyle='#888';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(sx+4,orig);ctx.lineTo(sx+sw-4,orig);ctx.stroke();
  if(d<0.3){ctx.fillStyle='#1d1d22';ctx.beginPath();ctx.ellipse(sx+sw/2,orig,9,6,0,0,6.283);ctx.fill();}
  else DYES.forEach(dy=>{const yy=orig-rf(dy,solv)*d*cm,sp=4+1.4*d;ctx.globalAlpha=0.75;ctx.fillStyle=dy.c;ctx.beginPath();ctx.ellipse(sx+sw/2,yy,12,sp,0,0,6.283);ctx.fill();ctx.globalAlpha=1;});
  txt(ctx,'origin',sx+sw+8,orig,{s:12*k,b:'middle',c:P['cv-soft']});if(d>0.05)txt(ctx,'solvent front',sx+sw+8,orig-d*cm,{s:12*k,b:'middle',c:P['cv-soft']});
  // centimeter scale
  ctx.strokeStyle=P['cv-soft'];ctx.lineWidth=1;for(let i=0;i<=9;i++){const yy=orig-i*cm;ctx.beginPath();ctx.moveTo(sx-14,yy);ctx.lineTo(sx-(i%5?6:2),yy);ctx.stroke();if(i%2===0)txt(ctx,String(i),sx-18,yy,{s:12*k,a:'right',b:'middle',c:P['cv-soft']});}
  txt(ctx,'cm',sx-18,orig-9.6*cm,{s:12*k,a:'right',b:'middle',c:P['cv-soft']});}
function sepCount(sim){const st=sim.st,d=front(st),s=solvOf(sim);if(d<0.3)return 1;const ys=DYES.map(dy=>rf(dy,s)*d).sort((a,b)=>a-b);let n=1;for(let i=1;i<ys.length;i++)if(ys[i]-ys[i-1]>0.55+0.05*d)n++;return n;}

/* ---------- zoom circle: what each technique uses ---------- */
const ZX=690,ZY=118,ZR=80;
const ZINFO={mix:['grains ×50','mixed, not bonded'],magnet:['grains ×50','uses magnetism'],water:['particles ×10⁸','uses solubility'],filter:['grains ×50','uses particle size'],
  decant:['grains ×50','uses density'],evap:['particles ×10⁸','uses boiling point'],distill:['particles ×10⁸','uses boiling point'],ethliq:['particles ×10⁸','uses boiling point'],chrom:['particles ×10⁸','uses polarity']};
function drawZoom(sim,ctx,t,k){const st=sim.st,P=PAL,z=st.zoom,info=ZINFO[z]||ZINFO.mix,r=rng(5);
  txt(ctx,'Zoom: '+info[0],ZX,ZY-ZR-12,{s:13*k,w:700,a:'center',c:P['cv-soft']});
  ctx.save();ctx.beginPath();ctx.arc(ZX,ZY,ZR,0,6.283);ctx.fillStyle=P['cv-bg2'];ctx.fill();ctx.clip();const T=RM?0:t;
  const grain=(x,y,s,c)=>{ctx.fillStyle=c;ctx.beginPath();for(let i=0;i<7;i++){const a=i/7*6.283,rr2=s*(0.75+0.25*Math.sin(i*2.3+s));i?ctx.lineTo(x+Math.cos(a)*rr2,y+Math.sin(a)*rr2):ctx.moveTo(x+Math.cos(a)*rr2,y+Math.sin(a)*rr2);}ctx.closePath();ctx.fill();ctx.strokeStyle='rgba(0,0,0,.25)';ctx.lineWidth=1;ctx.stroke();};
  const cube=(x,y,s)=>{ctx.fillStyle=COL.salt;ctx.strokeStyle='#8a9aa6';ctx.lineWidth=1.2;ctx.fillRect(x-s/2,y-s/2,s,s);ctx.strokeRect(x-s/2,y-s/2,s,s);};
  const ion=(x,y,s)=>CL.drawAtom(ctx,x,y,s==='Na'?6:9,s,{label:''});
  const h2o=(x,y,a)=>{CL.drawAtom(ctx,x,y,6,'O',{label:''});CL.drawAtom(ctx,x+Math.cos(a)*7,y+Math.sin(a)*7,3.5,'H',{label:''});CL.drawAtom(ctx,x+Math.cos(a+1.8)*7,y+Math.sin(a+1.8)*7,3.5,'H',{label:''});};
  const eth=(x,y,a)=>{CL.drawAtom(ctx,x,y,6,'C',{label:''});CL.drawAtom(ctx,x+Math.cos(a)*10,y+Math.sin(a)*10,6,'C',{label:''});CL.drawAtom(ctx,x+Math.cos(a)*18+3,y+Math.sin(a)*18,5.5,'O',{label:''});};
  if(z==='mix'||z==='magnet'){for(let i=0;i<24;i++){const x=ZX-64+r()*128,y=ZY-46+r()*112,ty=i%3;let yy=y;if(z==='magnet'&&ty===2&&st.busy)yy=y-((T*40+i*17)%80);
      if(ty===0)grain(x,yy,13,COL.sand);else if(ty===1)cube(x,yy,14);else grain(x,yy,8,COL.iron);}
    if(z==='magnet'){ctx.fillStyle='#c62828';ctx.fillRect(ZX-40,ZY-ZR,80,16);}}
  else if(z==='water'){ctx.fillStyle=P['cv-water'];ctx.globalAlpha=0.5;ctx.fillRect(ZX-ZR,ZY-ZR,2*ZR,2*ZR);ctx.globalAlpha=1;
    for(let j=0;j<3;j++)for(let i=0;i<4;i++)ion(ZX-46+i*17,ZY+28+j*17,(i+j)%2?'Na':'Cl');
    for(let i=0;i<4;i++){const ph=(T*0.3+i*0.25)%1;ion(ZX+10+ph*40,ZY+20-ph*70+i*6,i%2?'Na':'Cl');}
    for(let i=0;i<12;i++)h2o(ZX-60+r()*120,ZY-60+r()*70,T+i);}
  else if(z==='filter'){ctx.strokeStyle='#cdbb8f';ctx.lineWidth=5;for(let i=0;i<6;i++){ctx.beginPath();ctx.moveTo(ZX-ZR,ZY+i*12-10);ctx.lineTo(ZX+ZR,ZY+i*12-4+(i%2?6:-6));ctx.stroke();}
    for(let i=0;i<4;i++)grain(ZX-50+i*32,ZY-30,13,COL.sand);ctx.fillStyle=P['s2'];for(let i=0;i<16;i++){const ph=(T*0.5+i/16)%1;ctx.beginPath();ctx.arc(ZX-60+(i*37)%120,ZY-60+ph*130,2.2,0,6.283);ctx.fill();}}
  else if(z==='decant'){ctx.fillStyle=P['cv-water'];ctx.globalAlpha=0.5;ctx.fillRect(ZX-ZR,ZY-ZR,2*ZR,2*ZR);ctx.globalAlpha=1;for(let i=0;i<9;i++)grain(ZX-64+i*16,ZY+52-(i%2)*10,11,COL.sand);
    ctx.strokeStyle=P['s2'];ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(ZX-30,ZY-10);ctx.lineTo(ZX+30,ZY-40);ctx.stroke();ctx.beginPath();ctx.moveTo(ZX+30,ZY-40);ctx.lineTo(ZX+18,ZY-42);ctx.lineTo(ZX+25,ZY-30);ctx.closePath();ctx.fillStyle=P['s2'];ctx.fill();}
  else if(z==='evap'||z==='distill'){ctx.fillStyle=P['cv-water'];ctx.globalAlpha=0.5;ctx.fillRect(ZX-ZR,ZY+5,2*ZR,ZR);ctx.globalAlpha=1;
    for(let i=0;i<8;i++)h2o(ZX-60+(i*17)%120,ZY+20+(i*13)%40,T*0.5+i);for(let i=0;i<4;i++)ion(ZX-45+i*30,ZY+48,i%2?'Na':'Cl');
    if(st.busy)for(let i=0;i<5;i++){const ph=(T*0.4+i*0.2)%1;h2o(ZX-50+i*24,ZY+5-ph*80,T+i);}}
  else if(z==='ethliq'){const x=st.E/(st.E+st.W),y=st.boil?yEq(x):x;ctx.fillStyle=P['cv-water'];ctx.globalAlpha=0.5;ctx.fillRect(ZX-ZR,ZY+10,2*ZR,ZR);ctx.globalAlpha=1;
    const nl=10,ne=Math.round(nl*x);for(let i=0;i<nl;i++){const px=ZX-62+(i*13)%124,py=ZY+26+(i*7)%40;i<ne?eth(px,py,T*0.3+i):h2o(px,py,T*0.3+i);}
    if(st.boil){const nv=6,nve=Math.round(nv*y);for(let i=0;i<nv;i++){const ph=(T*0.35+i/nv)%1,px=ZX-55+i*22,py=ZY+4-ph*78;i<nve?eth(px,py,T+i):h2o(px,py,T+i);}}
}
  else if(z==='chrom'){ctx.strokeStyle='#d8ccab';ctx.lineWidth=6;for(let i=0;i<7;i++){ctx.beginPath();ctx.moveTo(ZX-ZR+i*26,ZY-ZR);ctx.lineTo(ZX-ZR+i*26+20,ZY+ZR);ctx.stroke();}
    const s=solvOf(sim);DYES.forEach((dy,j)=>{for(let i=0;i<3;i++){const sp=rf(dy,s);const ph=st.run?(T*0.25*sp+i/3)%1:0.1;ctx.fillStyle=dy.c;ctx.beginPath();ctx.arc(ZX-40+j*40+(i-1)*6,ZY+60-ph*120,5,0,6.283);ctx.fill();}});}
  ctx.restore();ctx.strokeStyle=P['cv-glass'];ctx.lineWidth=3;ctx.beginPath();ctx.arc(ZX,ZY,ZR,0,6.283);ctx.stroke();
  pill(ctx,info[1],ZX,ZY+ZR+20,P['card'],P['cv-ink'],13*k);}

/* ---------- definition ---------- */
const SIM={
  id:'separation',hash:'separation',apUnit:1,order:2,tab:'Separating mixtures',kind:'Virtual lab',
  prereq:['classify'],next:['chromatography','imf','states'],
  card:'Pull apart sand, salt and iron, distill ethanol from water, and run a paper chromatogram, choosing each technique in the right order.',
  title:'Separating mixtures',
  lede:{bio:'Each part of a mixture keeps its own properties. Pick techniques in the right order to separate sand, salt and iron filings, ethanol from water, or the dyes in black ink.',
        honors:'Plan the separation, then check your percent recovery and purity. Compare filtering with decanting, a gentle heater with a hot one, and water with isopropanol as the solvent.',
        ap:'Fractional distillation follows the real vapor–liquid equilibrium of ethanol–water, so you can watch the azeotrope limit purity. In chromatography, connect each dye’s Rf to its polarity.'},
  scale:'Benchtop scale: about 18 g of mixture in a 250 mL beaker. Wear goggles. Ethanol is flammable, so heat it with a heating mantle, never an open flame.',
  timeScale:2,dtMax:0.05,unit:'min',window:60,sampleDt:0.25,chChange:0.5,chReveal:10,
  controls:[
    {id:'mix',label:'Mixture',type:'select',def:'sss',lvl:'bio',options:[{v:'sss',l:'Sand, salt and iron filings'},{v:'eth',l:'Ethanol and water'},{v:'ink',l:'Black marker ink'}],onChange(sim){if(sim.st&&sim.st.mix!==sim.p.mix)sim.st=newState(sim.p.mix);syncMode(sim);}},
    {id:'heat',label:'Heater setting',type:'seg',def:'med',lvl:'honors',modes:['sss','eth'],options:[{v:'low',l:'Low'},{v:'med',l:'Medium'},{v:'high',l:'High'}],help:'Hotter is faster, but salt spatters out of an open dish.'},
    {id:'plates',label:'Fractionating column',type:'range',min:1,max:6,step:1,def:1,unit:' plates',lvl:'ap',modes:['eth'],help:'1 plate is simple distillation. Each extra plate is one more boil-and-condense step on the way up.'},
    {id:'solv',label:'Solvent',type:'seg',def:'water',lvl:'honors',modes:['ink'],options:[{v:'water',l:'Water (polar)'},{v:'iso',l:'Isopropanol (less polar)'}],onChange(sim){if(sim.st&&sim.st.mix==='ink'){sim.st.tt=0;sim.st.run=false;}}}
  ],
  actions:[
    {id:'magnet',label:'Use a magnet',lvl:'bio',modes:['sss'],run(sim){begin(sim,'magnet');}},
    {id:'water',label:'Add 50 mL water and stir',lvl:'bio',modes:['sss'],run(sim){begin(sim,'water');}},
    {id:'filter',label:'Filter',lvl:'bio',modes:['sss'],run(sim){begin(sim,'filter');}},
    {id:'decant',label:'Decant (pour off the liquid)',lvl:'honors',modes:['sss'],run(sim){begin(sim,'decant');}},
    {id:'evap',label:'Evaporate',lvl:'bio',modes:['sss'],run(sim){begin(sim,'evap');}},
    {id:'distill',label:'Distill',lvl:'honors',modes:['sss'],run(sim){begin(sim,'distill');}},
    {id:'heatOn',label:'Turn the heater on or off',lvl:'bio',primary:true,modes:['eth'],run(sim){const st=sim.st;if(st.mix!=='eth')return;if(!st.on&&st.E+st.W<0.3){say(st,'The flask is nearly dry. Start over to refill it.');return;}st.on=!st.on;}},
    {id:'swap',label:'Start a new receiver',lvl:'bio',modes:['eth'],run(sim){const st=sim.st;if(st.mix!=='eth')return;const c=st.rec[st.rec.length-1];if(c.E+c.W<0.01){say(st,'This receiver is still empty.');return;}st.rec.push({E:0,W:0});}},
    {id:'chrom',label:'Start the chromatography',lvl:'bio',primary:true,modes:['ink'],run(sim){const st=sim.st;if(st.mix!=='ink')return;st.tt=0;st.run=true;}},
    {id:'restart',label:'Start over',lvl:'bio',modes:ALL,run(sim){sim.st=newState(sim.p.mix);}},
    {id:'prep',label:'(prepared filtrate)',lvl:'bio',modes:[],run(sim){const st=sim.st;['magnet','water','filter'].forEach(k=>runNow(st,k,heatOf(sim)));}}
  ],
  init(sim){return newState(sim.p.mix);},
  step(sim,dt){let st=sim.st;if(st.mix!==sim.p.mix){sim.st=newState(sim.p.mix);st=sim.st;}st.msgT=Math.max(0,st.msgT-dt/2);
    if(st.mix==='sss'){const b=st.busy;if(b){b.t+=dt;if(b.ht){const el=b.t,{th,tb}=b.ht;st.T=el<th?22+78*el/th:el<th+tb?100:Math.min(115,100+15*(el-th-tb));}
        if(b.t>=b.dur){finish(st,b);st.busy=null;}}else st.T+=(22-st.T)*Math.min(1,dt*0.35);return;}
    if(st.mix==='eth'){const h=heatOf(sim),N=atLeast('ap')?sim.p.plates:1,n=st.E+st.W,x=n>0?st.E/n:0,tb=Tb(x);
      if(st.on){if(!st.boil){st.Tpot+=8*h.f*dt;if(st.Tpot>=tb){st.Tpot=tb;st.boil=true;}}
        if(st.boil){st.Tpot=tb;if(n<0.3){st.on=false;st.boil=false;say(st,'Heater off: never distill a flask to dryness.');}
          else{const xt=topLiquid(x,N),yt=yEq(xt),dn=h.vap*dt,dE=Math.min(st.E,dn*yt),dW=Math.min(st.W,dn-dE);st.E-=dE;st.W-=dW;const r=st.rec[st.rec.length-1];r.E+=dE;r.W+=dW;}}}
      else{st.Tpot+=(22-st.Tpot)*Math.min(1,dt*0.08);if(st.Tpot<tb-0.3)st.boil=false;}
      const target=st.boil&&st.on?Tb(topLiquid(st.E/Math.max(1e-9,st.E+st.W),N)):22;st.Thead+=(target-st.Thead)*Math.min(1,dt*(target>st.Thead?2:0.15));return;}
    if(st.mix==='ink'&&st.run){st.tt+=dt;if(st.tt>=12){st.tt=12;st.run=false;}}},
  metrics:[
    {id:'T',label:'Thermometer',unit:'°C',lvl:'bio',min:0,max:120,d:1,fixed:true,get:s=>s.st.mix==='sss'?s.st.T:s.st.mix==='eth'?s.st.Thead:22},
    {id:'rSand',label:'Sand recovered',unit:'%',lvl:'bio',min:0,max:100,d:1,modes:['sss'],get:s=>s.st.mix==='sss'?recovery(s.st,'sand'):NaN},
    {id:'rSalt',label:'Salt recovered',unit:'%',lvl:'bio',min:0,max:100,d:1,modes:['sss'],get:s=>s.st.mix==='sss'?recovery(s.st,'salt'):NaN},
    {id:'rIron',label:'Iron recovered',unit:'%',lvl:'bio',min:0,max:100,d:1,modes:['sss'],get:s=>s.st.mix==='sss'?recovery(s.st,'iron'):NaN},
    {id:'pur',label:'Purity of your best fractions',unit:'',lvl:'honors',text:true,modes:['sss'],get:s=>{if(s.st.mix!=='sss')return '—';const L=['sand','salt','iron'].map(c=>{const p=purity(s.st,c);return Number.isFinite(p)?c+' '+p.toFixed(1)+'%':null;}).filter(Boolean);return L.length?L.join(', '):'No dry fractions yet';}},
    {id:'bal',label:'Mass balance (solids in → out)',unit:'',lvl:'ap',text:true,modes:['sss'],get:s=>{const st=s.st;if(st.mix!=='sss')return '—';let o=0;fractions(st).forEach(f=>{o+=dryMass(f);});return '18.00 g → '+o.toFixed(2)+' g'+(st.lost>0.005?' ('+st.lost.toFixed(2)+' g spattered)':'');}},
    {id:'dist',label:'In this receiver',unit:'',lvl:'bio',text:true,modes:['eth'],get:s=>{const st=s.st;if(st.mix!=='eth')return '—';const r=st.rec[st.rec.length-1],v=volOf(r.E,r.W);return v<0.05?'Empty':v.toFixed(1)+' mL, '+volPct(r.E,r.W).toFixed(0)+'% ethanol';}},
    {id:'recE',label:'Ethanol collected',unit:'%',lvl:'bio',min:0,max:100,d:0,modes:['eth'],get:s=>{const st=s.st;if(st.mix!=='eth')return NaN;let e=0;st.rec.forEach(r=>e+=r.E);return 100*e/E0;}},
    {id:'pot',label:'Flask: ethanol by volume',unit:'%',lvl:'honors',min:0,max:100,d:0,modes:['eth'],get:s=>s.st.mix==='eth'?volPct(s.st.E,s.st.W):NaN},
    {id:'ytop',label:'Vapor leaving the top (mole fraction ethanol)',unit:'',lvl:'ap',min:0,max:1,d:3,modes:['eth'],get:s=>{const st=s.st;if(st.mix!=='eth')return NaN;const n=st.E+st.W;return n>0?yEq(topLiquid(st.E/n,s.p.plates)):0;}},
    {id:'front',label:'Solvent front',unit:'cm',lvl:'bio',min:0,max:8,d:1,modes:['ink'],get:s=>s.st.mix==='ink'?front(s.st):NaN},
    {id:'spots',label:'Separate spots',unit:'',lvl:'bio',min:0,max:3,d:0,modes:['ink'],get:s=>s.st.mix==='ink'?sepCount(s):NaN},
    {id:'rf',label:'Rf values',unit:'',lvl:'ap',text:true,modes:['ink'],get:s=>{if(s.st.mix!=='ink'||front(s.st)<0.3)return 'Run the paper first';const so=solvOf(s);return DYES.map(d=>d.n+' '+rf(d,so).toFixed(2)).join(', ');}}
  ],
  graphs:[{id:'T',label:'Thermometer reading vs time',lvl:'bio',lines:['T']}],defaultGraph:'T',
  narrate(sim){const st=sim.st,hon=atLeast('honors'),ap=atLeast('ap');
    if(st.msgT>0&&st.msg)return st.msg;
    if(st.mix==='sss'){const b=st.busy,m=st.main;
      if(b){if(b.kind==='magnet')return 'The magnet pulls on the iron filings only. Sand and salt are not magnetic, so they stay behind.';
        if(b.kind==='water')return 'Stirring dissolves the salt: water pulls the Na⁺ and Cl⁻ ions into solution. Sand does not dissolve, so it settles.';
        if(b.kind==='filter')return 'Dissolved ions are far smaller than the pores in the paper, so the salt water drips through. Sand grains are too big and stay on the paper.';
        if(b.kind==='decant')return 'Sand is denser than water and sinks, so you can pour the liquid off the top. Some salt water always stays behind with the sand.';
        const T=st.T;return T<99.5?'Heating the salt water toward 100 °C.':'Water boils off at 100 °C while the salt stays behind, because salt does not boil until 1413 °C.'+(b.kind==='distill'?' The condenser turns the steam back into pure water.':'')+(b.kind==='evap'&&hon&&b.h.spat>0.03?' On high, salt crystals spatter out of the dish.':'');}
      if(!st.log.length)return 'This dry mixture holds <b>10.00 g sand, 5.00 g salt and 3.00 g iron filings</b>. Each technique uses one property that only some parts have. Which step comes first?';
      const rs=recovery(st,'sand'),rl=recovery(st,'salt'),ri=recovery(st,'iron');
      if(rs>90&&rl>80&&ri>90)return '<b>All three are separated.</b> Sand '+rs.toFixed(0)+'%, salt '+rl.toFixed(0)+'%, iron '+ri.toFixed(0)+'% recovered. Some mass always stays behind on glassware and paper.'+(ap?' Check the mass balance: every gram is accounted for.':'');
      if(m.water>0.01&&m.iron>0.01&&!st.log.includes('magnet'))return 'The iron is now wet and mixed with sand. A magnet still works, but grabs less cleanly. Next, think about how to split the solids from the salt water.';
      if(st.filt&&st.filt.water>0.01)return 'The filtrate holds '+st.filt.aq.toFixed(2)+' g of dissolved salt in '+st.filt.water.toFixed(0)+' mL of water. Which property of water could you use to get the salt back?';
      if(m.water>0.01)return 'The beaker holds '+m.water.toFixed(0)+' mL of water with '+m.aq.toFixed(2)+' g of salt dissolved and '+m.sand.toFixed(1)+' g of sand settled at the bottom.';
      if(m.iron<0.05&&dryMass(m)>0.1)return 'The iron is out. Sand and salt are still mixed, and neither is magnetic. What does salt do in water that sand does not?';
      return 'Steps so far: '+st.log.join(' → ')+'. Check the recovery readouts.';}
    if(st.mix==='eth'){const n=st.E+st.W,x=n>0?st.E/n:0,r=st.rec[st.rec.length-1];
      if(!st.on&&!st.boil&&volOf(r.E,r.W)<0.05&&st.rec.length===1)return 'The flask holds 50 mL ethanol (boils at 78 °C) and 50 mL water (100 °C). Turn on the heater and watch the thermometer at the top.';
      if(st.on&&!st.boil)return 'The liquid is warming. The thermometer at the top still reads room temperature because no vapor has reached it yet.';
      if(st.boil){const yt=yEq(topLiquid(x,ap?sim.p.plates:1));let t='The mixture boils at <b>'+Tb(x).toFixed(1)+' °C</b>, between the two boiling points. Ethanol escapes more easily, so the vapor is '+molToVol(yt).toFixed(0)+'% ethanol while the flask is '+volPct(st.E,st.W).toFixed(0)+'%.';
        if(hon)t+=' As the flask loses ethanol, its boiling point creeps up toward 100 °C. Start a new receiver when the temperature climbs.';if(ap&&sim.p.plates>1)t+=' Each plate re-boils the vapor, so the top stays near 78 °C until the ethanol is nearly gone.';return t;}
      return 'Heater off. You collected '+st.rec.filter(q=>q.E+q.W>0.001).length+' fraction(s). Compare their % ethanol in the shelf on the right.';}
    const d=front(st),so=solvOf(sim);if(!st.run&&d<0.05)return 'A dot of black ink sits on the pencil line just above the solvent. Start the chromatography and watch the solvent climb the paper.';
    let t='The solvent has climbed '+d.toFixed(1)+' cm. Dyes that cling to the paper fall behind; dyes that dissolve well in the solvent ride along. ';
    if(d>2)t+=so==='water'?'In water, the most polar dye (yellow) travels farthest.':'In isopropanol, the order flips: the least polar dye (blue) travels farthest.';if(ap&&d>2)t+=' Rf = distance moved by the dye ÷ distance moved by the solvent.';return t;},
  tour:[
    {title:'One mixture, three solids',text:'The beaker holds sand, salt and iron filings. Each one has a property the others lack: iron is magnetic, salt dissolves in water, sand does neither.',focus:[100,180,260,240],speed:1,setup(sim){BioLab.setValues(sim,{mix:'sss'});sim.st=newState('sss');}},
    {title:'Magnetism pulls out the iron',text:'Use the magnet first, while the mixture is dry. Only iron is attracted, so the filings lift out of the sand and salt.',focus:[[100,60,260,360],[ZX-ZR-8,ZY-ZR-30,2*ZR+16,2*ZR+64]],speed:1,setup(sim){begin(sim,'magnet');}},
    {title:'Water dissolves the salt',text:'Add water and stir. Salt dissolves into ions; sand does not. Now the salt is hiding in the water.',focus:[[100,180,260,240],[ZX-ZR-8,ZY-ZR-30,2*ZR+16,2*ZR+64]],speed:1,setup(sim){const st=sim.st;st.busy=null;runNow(st,'magnet',heatOf(sim));begin(sim,'water');}},
    {title:'Filtration uses particle size',text:'Dissolved ions slip through the paper’s tiny pores. Sand grains are too big, so they stay on the filter.',focus:[[100,60,300,360],[ZX-ZR-8,ZY-ZR-30,2*ZR+16,2*ZR+64]],speed:1,setup(sim){const st=sim.st;st.busy=null;if(st.main.water<0.01)runNow(st,'water',heatOf(sim));begin(sim,'filter');}},
    {title:'Evaporation uses boiling point',text:'Heat the filtrate. Water boils away at 100 °C and the salt crystals stay in the dish. The thermometer holds at 100 °C while water is boiling.',focus:[[100,60,300,360],[ZX-ZR-8,ZY-ZR-30,2*ZR+16,2*ZR+64]],speed:2,setup(sim){const st=sim.st;st.busy=null;if(!st.filt)runNow(st,'filter',heatOf(sim));begin(sim,'evap');}},
    {title:'Percent recovery',text:'Each technique loses a little: sand clings to the magnet, salt water soaks into the filter paper. Percent recovery = mass recovered ÷ starting mass × 100.',focus:[480,248,316,160],speed:1,pause:true,setup(sim){const st=sim.st;st.busy=null;if(st.filt)runNow(st,'evap',heatOf(sim));}},
    {lvl:'honors',title:'Distillation of ethanol and water',text:'Ethanol boils at 78 °C and water at 100 °C, but the mixture boils in between. The vapor is richer in ethanol, so the first liquid you collect is about 80% ethanol.',focus:[60,40,400,370],speed:2,setup(sim){BioLab.setValues(sim,{mix:'eth'});sim.st=newState('eth');sim.st.on=true;}},
    {lvl:'ap',title:'Fractionating column',text:'Add plates. Each plate boils and condenses the vapor again, enriching it in ethanol, until it reaches the azeotrope: 95.6% ethanol by mass, where vapor and liquid have the same composition.',focus:[60,40,400,370],speed:2,setup(sim){BioLab.setValues(sim,{mix:'eth',plates:5});sim.st=newState('eth');sim.st.on=true;}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{mix:'sss',plates:1});sim.st=newState('sss');},
  challenges(sim){const f=simulate(['magnet','water','filter']),d=simulate(['magnet','water','decant','evap','evap']);
    const pf=purity(f,'sand'),pd=purity(d,'sand');const eM=simulate(['magnet','water','filter','evap'],'med'),eH=simulate(['magnet','water','filter','evap'],'high');
    const az=(()=>{let x=0.236;for(let i=0;i<40;i++)x=yEq(x);return x;})(),azm=100*az*46.07/(az*46.07+(1-az)*18.02);
    return [
    {lvl:'bio',q:'You pour the dry sand, salt and iron mixture into a filter without adding water. What passes through the filter paper?',choices:['The salt, because its grains are small','Nothing, because there is no liquid to carry anything through','The iron filings'],correct:1,
      baseline:{mix:'sss'},changeAction:'filter',changeText:'Poured into the filter',reveal:4,
      explain:'Filtration separates a solid from a liquid. Dry salt grains (about 0.3 mm) are far bigger than the paper’s pores (about 0.01 mm), so nothing goes through. Dissolve the salt first.'},
    {lvl:'bio',q:'Salt water with sand is poured through filter paper. Where does most of the salt end up?',choices:['On the paper with the sand','In the liquid that drips through (the filtrate)','It is destroyed by the filter'],correct:1,
      baseline:{mix:'sss'},baselineAction:'water',changeAction:'filter',at:2.5,reveal:8,changeText:'Filtering the salt water',
      explain:'Dissolved Na⁺ and Cl⁻ ions are about 0.2 nm across, so they pass through the pores with the water. The model puts '+(100*simulate(['water','filter']).filt.aq/5).toFixed(0)+'% of the salt in the filtrate; the rest is in the water soaked into the sand.'},
    {lvl:'bio',q:'Ethanol boils at 78 °C and water at 100 °C. When a 50/50 mixture first boils, what does the thermometer at the top read?',choices:['78 °C, the boiling point of ethanol','About 83 °C, between the two boiling points','100 °C, the boiling point of water'],correct:1,
      baseline:{mix:'eth'},baselineAction:'heatOn',reveal:13,changeText:'Heating the flask',
      explain:'Both liquids are present, so the mixture boils between the two pure boiling points: '+Tb(E0/(E0+W0)).toFixed(1)+' °C for this mixture (real data). The temperature then creeps up as the flask loses ethanol.'},
    {lvl:'honors',q:'You evaporate the filtrate with the heater on high instead of medium. The mass of salt you recover is…',choices:['about the same','lower, because hot salt spatters out of the dish','higher, because more water leaves'],correct:1,
      baseline:{mix:'sss',heat:'high'},baselineAction:'prep',changeAction:'evap',reveal:16,changeText:'Evaporating on high',
      explain:'Boiling to dryness on high makes the crust crack and spit. The model recovers '+recovery(eH,'salt').toFixed(1)+'% of the salt on high versus '+recovery(eM,'salt').toFixed(1)+'% on medium. Heat gently near the end.'},
    {lvl:'honors',instant:true,q:'Instead of filtering, you decant the salt water off the sand and then dry the sand. Compared with filtering, the dried sand is…',choices:['purer','less pure, because the salt water left behind dries onto it','exactly the same'],correct:1,
      explain:'Decanting leaves about 15% of the salt water with the sand. The model gives sand that is '+pd.toFixed(1)+'% pure after decanting, versus '+pf.toFixed(1)+'% after filtering. Filtering leaves much less liquid behind.'},
    {lvl:'ap',q:'Now the vapor passes through a 5-plate fractionating column before it condenses. The first distillate is about…',choices:['the same as simple distillation, about 80% ethanol','richer, about 93% ethanol','pure ethanol'],correct:1,
      baseline:{mix:'eth',plates:5},baselineAction:'heatOn',reveal:13,changeText:'Heating with the column',
      explain:'Each plate is another boil-and-condense step. From a flask at x = 0.24, one plate gives vapor at y = '+yEq(0.2337).toFixed(2)+'; five plates give y = '+yEq(topLiquid(0.2337,5)).toFixed(2)+', about '+molToVol(yEq(topLiquid(0.2337,5))).toFixed(0)+'% ethanol by volume.'},
    {lvl:'ap',q:'In water, a polar solvent, the yellow dye travels farthest up the paper. What does that tell you about the yellow dye?',choices:['It is the most polar dye, so it stays dissolved in the moving water','It is the least polar dye','It has the largest molecules'],correct:0,
      baseline:{mix:'ink',solv:'water'},changeAction:'chrom',reveal:13,changeText:'The solvent is rising',
      explain:'Like dissolves like. The yellow dye’s Rf in water is '+rf(DYES[0],'water').toFixed(2)+', the highest, because it is the most polar. Switch to isopropanol and the order flips: blue (least polar) has Rf '+rf(DYES[2],'iso').toFixed(2)+'.'},
    {lvl:'ap',instant:true,q:'Could a tall enough column give 100% ethanol from an ethanol–water mixture at 1 atm?',choices:['Yes, with enough plates','No, it stops near 95.6% ethanol by mass, the azeotrope','No, it stops at 50%'],correct:1,
      explain:'Iterating the real equilibrium data 40 times from x = 0.24 converges to x = '+az.toFixed(3)+' ('+azm.toFixed(1)+'% ethanol by mass). At that point the vapor has the same composition as the liquid (y = x), so more plates change nothing. Industry uses drying agents or a third solvent to go further.'}
  ];},
  lab:{bio:'<p><b>Question:</b> In what order should you use the techniques to separate sand, salt and iron?</p><ol><li>Write a plan before you start: list each step and the property it uses.</li><li>Run your plan. Watch the readouts after each step.</li><li>Press <b>Record trial</b> when you finish, then <b>Start over</b> and try a different order.</li></ol><p>Which order gave the highest percent recovery for all three? Explain why the first step matters.</p>',
       honors:'<p><b>Question:</b> How do technique choices affect recovery and purity?</p><ol><li>Separate the mixture with Filter, then again with Decant. Record recovery and purity each time.</li><li>Repeat the evaporation with the heater on Low, Medium and High.</li><li>Distill ethanol and water. Start a new receiver every time the thermometer rises 3 °C and record each fraction’s % ethanol.</li></ol><p>Explain your best and worst results using the particle zoom.</p>',
       ap:'<p><b>Question:</b> How does the number of plates change the purity of the distillate?</p><ol><li>Distill with 1, 2, 4 and 6 plates. Record the first receiver’s % ethanol and the head temperature.</li><li>Run the ink in water and in isopropanol. Record each dye’s Rf.</li></ol><p><b>Claim–evidence–reasoning:</b> Explain why purity levels off near 95.6% by mass, and rank the dyes by polarity using your Rf data.</p>'},
  terms:[{t:'Mixture',d:'Two or more substances physically combined. Each keeps its own properties, which is what lets you separate them.'},{t:'Filtration',d:'Separating a solid from a liquid by pouring through paper with tiny pores. The liquid that passes is the filtrate.'},
    {t:'Evaporation',d:'Heating a solution so the liquid leaves as a gas and the dissolved solid stays behind.'},{t:'Distillation',d:'Boiling a liquid and condensing the vapor in a condenser. It separates liquids with different boiling points, or a liquid from a dissolved solid.'},
    {t:'Chromatography',d:'Separating substances by how strongly they cling to a surface (paper) versus how well they dissolve in a moving solvent.'},{t:'Percent recovery',d:'Mass recovered ÷ starting mass × 100.'},
    {lvl:'honors',t:'Decanting',d:'Pouring a liquid off a settled solid. Quick, but it leaves some liquid behind.'},{lvl:'honors',t:'Purity',d:'Mass of the wanted substance ÷ total mass of the fraction × 100.'},{lvl:'honors',t:'Fraction',d:'One portion of distillate collected over a range of temperatures.'},
    {lvl:'ap',t:'Theoretical plate',d:'One ideal boil-and-condense step. A fractionating column acts like several plates stacked up.'},{lvl:'ap',t:'Azeotrope',d:'A mixture whose vapor has the same composition as the liquid, so distillation cannot separate it further. Ethanol–water: 95.6% ethanol by mass, 78.2 °C.'},
    {lvl:'ap',t:'Rf value',d:'Distance moved by a spot ÷ distance moved by the solvent front. Between 0 and 1.'}],
  about:'<p><b>Sand, salt and iron</b> is a mass-balance model: each step moves grams between containers. The magnet picks up 97% of the iron when dry (93% when wet) and drags 0.12 g of sand with it. Salt dissolves up to 36 g per 100 mL of water. Filter paper keeps 3 mL of solution in the sand, which dries to a salt crust; decanting leaves 15% of the liquid behind. Evaporating to dryness loses 0%, 1% or 6% of the salt to spattering on low, medium or high heat. Distillation collects 98% of the water.</p><p><b>Ethanol and water</b> uses the measured vapor–liquid equilibrium at 1 atm (Perry’s Chemical Engineers’ Handbook): liquid mole fraction, vapor mole fraction and boiling point, interpolated. Each theoretical plate applies the equilibrium once more, as if the column ran at total reflux, so real columns of the same size do a little worse. Volumes ignore the small contraction when ethanol and water mix.</p><p><b>Ink</b> is modeled as three dyes with assigned polarities. Rf rises with polarity in water and falls with polarity in isopropanol, and the solvent front rises as the square root of time (capillary flow). See the Chromatography tool for real forensic inks.</p>',
  initVis(){},
  draw(sim,ctx,vdt,k,t){const st=sim.st,P=PAL;ctx.fillStyle=P['cv-bg'];ctx.fillRect(0,0,800,450);ctx.fillStyle=P['cv-bench'];ctx.fillRect(0,410,800,40);
    if(st.mix==='sss')drawSSS(sim,ctx,t,k);else if(st.mix==='eth')drawEth(sim,ctx,t,k);else{drawChrom(sim,ctx,st,k);drawInkShelf(sim,ctx,k);}
    drawZoom(sim,ctx,t,k);
    if(st.msgT>0&&st.msg){ctx.save();ctx.globalAlpha=clamp(st.msgT,0,1);const fs=13*Math.min(k,1.4);ctx.font='700 '+fs+'px '+FONT;const words=st.msg.split(' '),lines=[];let ln='';
      words.forEach(w=>{const tt=ln?ln+' '+w:w;if(ctx.measureText(tt).width>420&&ln){lines.push(ln);ln=w;}else ln=tt;});lines.push(ln);
      rr(ctx,20,40,444,lines.length*fs*1.35+16,10);ctx.fillStyle=P['s4'];ctx.fill();lines.forEach((l,i)=>txt(ctx,l,32,48+fs*0.95+i*fs*1.35,{s:fs,w:700,c:'#fff'}));ctx.restore();}},
  thumbSetup(sim){const st=sim.st;runNow(st,'magnet',HEAT.med);runNow(st,'water',HEAT.med);begin(sim,'filter');st.busy.t=2;}
};
function drawSSS(sim,ctx,t,k){const st=sim.st,P=PAL,b=st.busy,m=st.main,kind=b?b.kind:null,pr=b?clamp(b.t/b.dur,0,1):0;
  if(st.log.length){const L=st.log.slice(-4);txt(ctx,(st.log.length>4?'… → ':'Steps: ')+L.join(' → '),20,26,{s:13*Math.min(k,1.4),w:700,c:P['cv-soft']});}
  if(kind==='filter'){drawFunnel(ctx,230,140,m.sand+m.iron,true,t);drawFlaskE(ctx,230,250,vessel({water:m.water*pr}));drawBeakerV(ctx,60,150,90,110,m,m.water*(1-pr),t);
    txt(ctx,'filter paper in a funnel',230,122,{s:12*k,a:'center',c:P['cv-soft']});}
  else if(kind==='evap'||kind==='distill'){const v=st[b.tgt],el=b.t,{th,tb}=b.ht,frac=clamp((el-th)/tb,0,1),w=b.w0*(1-frac);
    if(kind==='evap'){ringStand(ctx,110,250,200);burner(ctx,220,410,true,b.h.f,t);ctx.strokeStyle=P['cv-soft'];ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(110,300);ctx.lineTo(160,300);ctx.stroke();
      ctx.fillStyle=P['cv-soft'];ctx.fillRect(160,298,120,5);ctx.fillStyle='#f2efe9';ctx.strokeStyle='#a39e94';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(165,280);ctx.quadraticCurveTo(220,330,275,280);ctx.closePath();ctx.fill();ctx.stroke();
      if(w>0.2){ctx.fillStyle=P['cv-water'];ctx.beginPath();const d=Math.min(1,w/60);ctx.moveTo(220-50*Math.sqrt(d),284);ctx.quadraticCurveTo(220,284+22*d,220+50*Math.sqrt(d),284);ctx.closePath();ctx.fill();}
      if(frac>0.6){ctx.fillStyle=COL.salt;for(let i=0;i<14;i++)ctx.fillRect(196+(i*7)%48,293-(i%3)*2,4,4);}
      if(st.T>=99.5&&w>0.2){ctx.strokeStyle=P['cv-soft'];ctx.lineWidth=2;ctx.globalAlpha=0.5;for(let i=0;i<3;i++){const sx=200+i*20;ctx.beginPath();ctx.moveTo(sx,272);ctx.bezierCurveTo(sx-10,258,sx+10,246,sx,232);ctx.stroke();}ctx.globalAlpha=1;}
      if(b.h.spat>0.03&&frac>0.85){ctx.fillStyle=COL.salt;for(let i=0;i<6;i++){const ph=(t*2+i/6)%1;ctx.fillRect(220+Math.cos(i)*60*ph,276-ph*40+ph*ph*30,3,3);}}
      pill(ctx,st.T.toFixed(0)+' °C',300,250,P['card'],P['cv-ink'],14*k);}
    else drawDistill(sim,ctx,{on:true,liq:clamp(w/150,0,0.8),boil:st.T>=99.5&&w>0.2,residue:frac>0.9?1:0,T:st.T,drip:st.T>=99.5&&w>0.2,rec:clamp((b.w0-w)/150,0,0.85)},t,k);}
  else{const mag=kind==='magnet';drawBeakerV(ctx,110,196,220,210,m,m.water,t);
    if(mag){const dy=pr<0.5?pr*2:2-pr*2;drawMagnet(ctx,220,96+dy*150,pr>0.5?m.iron*0.97:0);}
    if(kind==='water'){ctx.strokeStyle=P['cv-soft'];ctx.lineWidth=4;const a=RM?0:Math.sin(t*6)*0.3;ctx.beginPath();ctx.moveTo(220+Math.sin(a)*70,150);ctx.lineTo(220+Math.sin(a)*20,396);ctx.stroke();}
    txt(ctx,'Beaker: '+(dryMass(m)>0.01?dryMass(m).toFixed(2)+' g solids':'empty')+(m.water>0.01?', '+m.water.toFixed(0)+' mL water':''),225,436,{s:13*Math.min(k,1.4),w:700,a:'center',c:P['cv-ink']});}
  drawShelf(sim,ctx,k);}
function drawShelf(sim,ctx,k){const st=sim.st,P=PAL,L=fractions(st).filter(f=>f.where!=='beaker'&&!(f.where==='filtrate'&&st.busy&&st.busy.tgt==='filt'));const x0=480,y0=286,cw=104;
  txt(ctx,L.length?'Collected':'Clues',x0,y0-12,{s:13*k,w:700,c:P['cv-soft']});
  if(!L.length){const fs=13*Math.min(k,1.45);[['iron','magnetic, insoluble'],['salt','dissolves in water'],['sand','not magnetic, insoluble']].forEach(([a,b],i)=>{txt(ctx,a+':',x0,y0+22+i*fs*1.8,{s:fs,w:800});txt(ctx,b,x0+fs*3.3,y0+22+i*fs*1.8,{s:fs,c:P['cv-soft']});});return;}
  L.slice(-6).forEach((f,i)=>{const cx=x0+cw/2+(i%3)*cw,cy=y0+28+Math.floor(i/3)*70,mj=f.where==='receiver'||f.where==='filtrate'?'water':majority(f)||'water';
    const col={sand:'#a8844d',salt:'#6f8796',iron:'#4d535c',water:'#3f7fb8'}[mj];ctx.fillStyle=P['cv-glass'];ctx.globalAlpha=0.35;ctx.beginPath();ctx.ellipse(cx,cy+8,40,12,0,0,6.283);ctx.fill();ctx.globalAlpha=1;
    const tag={sand:'sand',salt:'salt',iron:'iron',water:f.where==='filtrate'?'salt water':'water'}[mj];pill(ctx,tag,cx,cy,col,'#fff',13*Math.min(k,1.45));
    const amt=mj==='water'?f.water.toFixed(0)+' mL':dryMass(f).toFixed(2)+' g';txt(ctx,amt,cx,cy+34,{s:13*Math.min(k,1.45),w:700,a:'center'});});}
function drawEth(sim,ctx,t,k){const st=sim.st,P=PAL,n=st.E+st.W,N=atLeast('ap')?sim.p.plates:1,r=st.rec[st.rec.length-1];
  const fracCol=()=>PAL['cv-water'];
  drawDistill(sim,ctx,{on:st.on,liq:clamp(volOf(st.E,st.W)/200,0,0.8),liqCol:fracCol(volPct(st.E,st.W)),boil:st.boil&&st.on,T:st.Thead,drip:st.boil&&st.on,plates:N,rec:clamp(volOf(r.E,r.W)/80,0,0.85),recCol:fracCol(volPct(r.E,r.W))},t,k);
  const x0=480,y0=272,L=st.rec.filter(q=>q.E+q.W>0.0005);txt(ctx,'Receivers',x0,y0-12,{s:13*k,w:700,c:P['cv-soft']});
  if(!L.length)txt(ctx,'nothing collected yet',x0,y0+20,{s:13*k,c:P['cv-soft']});
  L.slice(-4).forEach((q,i)=>{const cx=x0+36+i*76,v=volOf(q.E,q.W),pc=volPct(q.E,q.W),h=clamp(v/40,0.08,1)*70;ctx.strokeStyle=P['cv-glass'];ctx.lineWidth=2;rr(ctx,cx-12,y0+6,24,86,10);ctx.stroke();
    ctx.fillStyle=fracCol(pc);rr(ctx,cx-10,y0+90-h,20,h,8);ctx.fill();txt(ctx,pc.toFixed(0)+'%',cx,y0+112,{s:13*Math.min(k,1.45),w:700,a:'center'});});}
function drawInkShelf(sim,ctx,k){const P=PAL,ap=atLeast('ap'),so=solvOf(sim),d=front(sim.st);txt(ctx,'Dyes in the ink',480,250,{s:13*k,w:700,c:P['cv-soft']});
  DYES.forEach((dy,i)=>{const y=280+i*36;ctx.fillStyle=dy.c;ctx.beginPath();ctx.arc(492,y,9,0,6.283);ctx.fill();txt(ctx,dy.n+(ap&&d>0.3?'  Rf '+rf(dy,so).toFixed(2):''),510,y+1,{s:14*Math.min(k,1.5),w:700,b:'middle'});});}
SIM.onLevel=syncMode;
BioLab.register(SIM);
})();
