(function(){
'use strict';
const {clamp,lerp,rng,rr,txt,pill,polyline,atLeast,PAL,FONT,RM,lvText}=BioLab.h;
const CL=window.ChemLab;
const CW=4.184;                 // J/g·°C, liquid water
const J_PER_CAL=4184;           // 1 food Calorie = 1 kcal = 4184 J
const DROP=2;                   // s: the metal enters the water (or the snack is lit)
const MOVE=1.4;                 // s of travel from the bath to the cup
const BOMB_C=10.00;             // kJ/°C: whole bomb calorimeter (steel bomb + 2.000 kg water + bucket), calibrated with benzoic acid

/* Specific heats (J/g·°C, 25 °C) and densities (g/cm³) */
const METALS={
  al:{n:'Aluminum',sym:'Al',c:0.897,rho:2.70,col:'#c4cad3'},
  fe:{n:'Iron',sym:'Fe',c:0.449,rho:7.87,col:'#7d828b'},
  cu:{n:'Copper',sym:'Cu',c:0.385,rho:8.96,col:'#c27840'},
  pb:{n:'Lead',sym:'Pb',c:0.129,rho:11.34,col:'#646a74'},
  ua:{n:'Unknown metal A',sym:'?',c:0.449,rho:7.87,col:'#8f949c',unk:true},
  ub:{n:'Unknown metal B',sym:'?',c:0.129,rho:11.34,col:'#8f949c',unk:true}
};
const KNOWN=['al','fe','cu','pb'];
/* Snack energy from Nutrition Facts / USDA FoodData Central (Calories per gram as sold).
   burn = fraction of the sample that burns in an open flame (the rest is char and ash).
   rate = grams burned per second for a 1 g sample. */
const SNACKS={
  puff:{n:'Cheese puff',cal:5.71,burn:0.85,rate:0.018,col:'#e8892b',src:'160 Cal per 28 g serving'},
  peanut:{n:'Peanut',cal:5.85,burn:0.86,rate:0.011,col:'#c9a06a',src:'USDA dry-roasted, 585 Cal per 100 g'},
  cashew:{n:'Cashew',cal:5.53,burn:0.85,rate:0.011,col:'#e2c597',src:'USDA raw, 553 Cal per 100 g'},
  walnut:{n:'Walnut',cal:6.54,burn:0.88,rate:0.012,col:'#a8794a',src:'USDA English walnut, 654 Cal per 100 g'},
  marsh:{n:'Marshmallow',cal:3.18,burn:0.62,rate:0.016,col:'#f1ece4',src:'USDA, 318 Cal per 100 g'},
  popcorn:{n:'Popcorn (air-popped)',cal:3.87,burn:0.80,rate:0.020,col:'#f3e3a6',src:'USDA, 387 Cal per 100 g'}
};
const EFF={open:0.28,shield:0.45};   // share of the flame's heat that ends up in the water

const sgn=(v,d)=>(v<0?'−':'')+Math.abs(v).toFixed(d);
const T1=v=>Number.isFinite(v)?v.toFixed(1):'—';
const ap=()=>atLeast('ap'),hon=()=>atLeast('honors');

/* ---------- model ---------- */
function metalOf(p){return METALS[p.metal]||METALS.cu;}
function snackOf(p){return SNACKS[p.snack]||SNACKS.puff;}
function cupC(p){return p.mode==='metal'?p.Ccal:0;}
function eqTemp(p){const M=metalOf(p),Cm=p.mMetal*M.c,Cw=p.mWater*CW+cupC(p);return (Cm*p.tHot+Cw*p.T0)/(Cm+Cw);}
function restart(sim){sim.st=sim.def.init(sim);sim.t=0;sim.hist=[];sim.lastSample=-1e9;sim.infoDirty=true;}
function dropped(sim){return sim.t>=DROP;}
function burnable(p){return p.mode==='bomb'?p.mSnack:p.mSnack*snackOf(p).burn;}

/* ---------- readout helpers ---------- */
function qWater(sim){const p=sim.p,st=sim.st;
  if(p.mode==='bomb')return BOMB_C*1000*(st.Tmax-p.T0);
  return p.mWater*CW*((p.mode==='food'?st.Tmax:st.Tw)-p.T0);}
function cFromData(sim,withCup){const p=sim.p,st=sim.st;if(p.mode!=='metal'||sim.t<DROP+0.5)return NaN;const dTm=p.tHot-st.Tw;if(dTm<0.05)return NaN;
  const q=p.mWater*CW*(st.Tw-p.T0)+(withCup?p.Ccal*(st.Tw-p.T0):0);return q/(p.mMetal*dTm);}
function closestMetal(c){if(!Number.isFinite(c))return null;let best=null,bd=1e9;KNOWN.forEach(k=>{const d=Math.abs(METALS[k].c-c)/METALS[k].c;if(d<bd){bd=d;best=k;}});return {k:best,err:bd};}
function burned(sim){return sim.p.mSnack-sim.st.mNow;}
function calPerG(sim){const b=burned(sim);if(b<0.02)return NaN;return qWater(sim)/J_PER_CAL/b;}

/* ---------- show only what the current mode uses ---------- */
function syncMode(sim){if(!atLeast('ap')&&sim.p.mode==='bomb')BioLab.setValues(sim,{mode:'metal'});if(!sim.ui||!sim.ui.sec)return;const mode=sim.p.mode,d=sim.def;
  d.controls.forEach(c=>{if(!c.modes)return;const cid=d.id+'-'+c.id,e=document.getElementById(cid)||document.getElementById(cid+'-l');if(!e)return;const w=e.closest('.ctl');if(w)w.hidden=!atLeast(c.lvl)||!c.modes.includes(mode);});
  d.metrics.forEach(m=>{if(!m.modes)return;const t=sim.ui.tiles[m.id];if(!t)return;const w=t.num.closest('.tile');if(w)w.hidden=!atLeast(m.lvl)||!m.modes.includes(mode);});
  const want=mode==='metal'?'temps':mode==='bomb'?'twb':'tw';if(sim.ui.gm&&[...sim.ui.gm.options].some(o=>o.value===want)){sim.gMetric=want;sim.ui.gm.value=want;}}

/* ---------- geometry ---------- */
const BENCH=400;
const CX=455,RIM=262,CBOT=396,HWT=84,HWB=62,WL=292;       // coffee cup
const BX=70,BY=238,BW=160,BH=134;                          // hot-water bath beaker
const ZX=680,ZY=258,ZR=102;                                // zoom circle
const CANX=318,CANT=150,CANB=288,CANW=92;                  // soda can (food lab)
const SNX=318,SNY=332;                                     // snack on its holder
const BKX=250,BKW=224,BKT=178,BKB=396;                     // bomb bucket

function blockSize(p){const M=metalOf(p),V=p.mMetal/M.rho;return 16*Math.cbrt(V);}  // 16 px per cm
function metalPos(sim){const s=blockSize(sim.p),home=[BX+BW/2,BY+BH-s/2-10],land=[CX-18,CBOT-10-s/2];
  const t=sim.t,t0=DROP-MOVE;if(t<t0)return home;if(t>=DROP)return land;
  const path=polyline([home,[home[0],188],[land[0],188],land]);const f=(t-t0)/MOVE,e=f<0.5?2*f*f:1-2*(1-f)*(1-f);return path.at(e*path.L);}

/* ---------- drawing pieces ---------- */
function panel(ctx,lines,k){let w=0;lines=lines.map(l=>{let s=l.s;ctx.font=(l.w||400)+' '+s*k+'px '+FONT;while(s>12&&ctx.measureText(l.t).width>740){s-=0.5;ctx.font=(l.w||400)+' '+s*k+'px '+FONT;}return Object.assign({},l,{s});});
  lines.forEach(l=>{ctx.font=(l.w||400)+' '+l.s*k+'px '+FONT;w=Math.max(w,ctx.measureText(l.t).width);});
  const lh=lines.map(l=>l.s*k*1.35),h=lh.reduce((a,b)=>a+b,0)+14;rr(ctx,12,10,Math.min(776,w+28),h,10);ctx.fillStyle=PAL['card'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
  let y=10+8;lines.forEach((l,i)=>{y+=lh[i];txt(ctx,l.t,26,y-lh[i]*0.28,{s:l.s*k,w:l.w||400,c:l.c||PAL['cv-ink']});});return 10+h;}
function arrow(ctx,x1,y1,x2,y2,c,w){const a=Math.atan2(y2-y1,x2-x1),h=Math.max(9,w*2.6);ctx.strokeStyle=c;ctx.fillStyle=c;ctx.lineWidth=w;ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2-Math.cos(a)*h*0.8,y2-Math.sin(a)*h*0.8);ctx.stroke();ctx.beginPath();ctx.moveTo(x2,y2);ctx.lineTo(x2-Math.cos(a-0.45)*h,y2-Math.sin(a-0.45)*h);ctx.lineTo(x2-Math.cos(a+0.45)*h,y2-Math.sin(a+0.45)*h);ctx.closePath();ctx.fill();}
function wavy(ctx,x1,y1,x2,y2,c,t,w){const L=Math.hypot(x2-x1,y2-y1),ux=(x2-x1)/L,uy=(y2-y1)/L,nx=-uy,ny=ux;ctx.strokeStyle=c;ctx.lineWidth=w||3;ctx.lineCap='round';ctx.beginPath();
  for(let s=0;s<=L-10;s+=3){const o=Math.sin(s*0.22-t*7)*4;const x=x1+ux*s+nx*o,y=y1+uy*s+ny*o;s?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();
  const hx=x1+ux*L,hy=y1+uy*L;ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(hx,hy);ctx.lineTo(hx-ux*11+nx*6,hy-uy*11+ny*6);ctx.lineTo(hx-ux*11-nx*6,hy-uy*11-ny*6);ctx.closePath();ctx.fill();}
function drawBlock(ctx,x,y,s,col){const w=s*1.05,h=s,ex=w/2,ey=Math.max(3,s*0.16);const g=ctx.createLinearGradient(x-ex,0,x+ex,0);g.addColorStop(0,CL.shade(col,-0.35));g.addColorStop(0.45,CL.shade(col,0.35));g.addColorStop(1,CL.shade(col,-0.3));
  ctx.fillStyle=g;ctx.fillRect(x-ex,y-h/2,w,h);ctx.beginPath();ctx.ellipse(x,y+h/2,ex,ey,0,0,Math.PI);ctx.fill();
  ctx.fillStyle=CL.shade(col,0.2);ctx.beginPath();ctx.ellipse(x,y-h/2,ex,ey,0,0,6.29);ctx.fill();ctx.strokeStyle=CL.shade(col,-0.5);ctx.lineWidth=1;ctx.stroke();}
function flame(ctx,x,y,h,t,a){if(h<2)return;ctx.save();ctx.globalAlpha=a===undefined?1:a;const f=RM?1:1+0.12*Math.sin(t*23)+0.08*Math.sin(t*37);const H=h*f,W=h*0.32;
  const g=ctx.createLinearGradient(0,y,0,y-H);g.addColorStop(0,'#ffd34d');g.addColorStop(0.45,'#ff8a1f');g.addColorStop(1,'rgba(230,60,20,0)');ctx.fillStyle=g;
  ctx.beginPath();ctx.moveTo(x-W,y);ctx.quadraticCurveTo(x-W*1.1,y-H*0.45,x+(RM?0:Math.sin(t*9)*3),y-H);ctx.quadraticCurveTo(x+W*1.1,y-H*0.45,x+W,y);ctx.closePath();ctx.fill();
  ctx.fillStyle='rgba(255,247,200,.9)';ctx.beginPath();ctx.ellipse(x,y-H*0.18,W*0.35,H*0.22,0,0,6.29);ctx.fill();ctx.restore();}
function bench(ctx){ctx.fillStyle=PAL['cv-bench'];ctx.fillRect(0,BENCH,800,450-BENCH);}
function zoomLink(ctx,sx,sy,sr){ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.5;ctx.setLineDash([4,4]);
  const dx=ZX-sx,dy=ZY-sy,d=Math.hypot(dx,dy),a=Math.atan2(dy,dx),b=Math.asin(clamp((ZR-sr)/d,-1,1));
  [1,-1].forEach(s=>{const ang=a+s*(Math.PI/2+b);ctx.beginPath();ctx.moveTo(sx+Math.cos(ang)*sr,sy+Math.sin(ang)*sr);ctx.lineTo(ZX+Math.cos(ang)*ZR,ZY+Math.sin(ang)*ZR);ctx.stroke();});
  ctx.setLineDash([]);ctx.beginPath();ctx.arc(sx,sy,sr,0,6.29);ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2;ctx.stroke();}

/* Particle view: water molecules bounce around; a metal lattice vibrates on the left once the metal is in the water. */
function initParticles(sim){const r=rng(7),W=[];for(let i=0;i<24;i++){let x,y;do{x=ZX+(r()*2-1)*ZR;y=ZY+(r()*2-1)*ZR;}while(Math.hypot(x-ZX,y-ZY)>ZR-14);const a=r()*6.283;W.push({x,y,a,dx:Math.cos(a),dy:Math.sin(a),rot:r()*6.283,w:(r()-0.5)*4});}
  const L=[];for(let c=0;c<4;c++)for(let j=0;j<8;j++){const y=ZY-ZR+18+j*24+(c%2?12:0);L.push({x0:ZX-ZR+16+c*21,y0:y,ph:r()*6.283,ph2:r()*6.283});}
  sim.vis.W=W;sim.vis.L=L;}
const speedOf=T=>34*Math.pow((T+273.15)/293.15,4);   // exaggerated so a few degrees show (see About)
function drawZoom(sim,ctx,vdt,k,t,Tw,Tm,metalCol,label){const v=sim.vis;if(!v.W)initParticles(sim);
  ctx.save();ctx.beginPath();ctx.arc(ZX,ZY,ZR,0,6.29);ctx.fillStyle=PAL['cv-water'];ctx.fill();ctx.clip();
  const wall=Tm!==null?ZX-ZR+16+3*21+16:-1e9;
  if(Tm!==null){const A=0.8+5.5*Math.pow(clamp(Tm,0,100)/100,1.4);v.L.forEach(a=>{const x=a.x0+(RM?0:Math.sin(t*19+a.ph)*A),y=a.y0+(RM?0:Math.cos(t*23+a.ph2)*A);CL.drawAtom(ctx,x,y,10,'',{color:metalCol,label:''});});
    if(Tm-Tw>1.5&&!RM){ctx.strokeStyle=PAL['s4'];ctx.lineWidth=2.5;for(let j=0;j<4;j++){const y=ZY-60+j*40+Math.sin(t*3+j)*8,ph=(t*1.6+j*0.37)%1;ctx.globalAlpha=1-ph;ctx.beginPath();ctx.arc(wall+4+ph*26,y,6+ph*6,-1,1);ctx.stroke();}ctx.globalAlpha=1;}}
  const sp=speedOf(Tw);v.W.forEach(m=>{if(vdt>0&&!RM){m.x+=m.dx*sp*vdt;m.y+=m.dy*sp*vdt;m.rot+=m.w*vdt;}
    const dx=m.x-ZX,dy=m.y-ZY,d=Math.hypot(dx,dy);if(d>ZR-12){const nx=dx/d,ny=dy/d,dot=m.dx*nx+m.dy*ny;if(dot>0){m.dx-=2*dot*nx;m.dy-=2*dot*ny;}m.x=ZX+nx*(ZR-12);m.y=ZY+ny*(ZR-12);}
    if(m.x<wall+10){m.x=wall+10;if(m.dx<0)m.dx=-m.dx;}
    const c=Math.cos(m.rot),s=Math.sin(m.rot);CL.drawAtom(ctx,m.x+c*8-s*5,m.y+s*8+c*5,4.6,'H',{label:''});CL.drawAtom(ctx,m.x-c*8-s*5,m.y-s*8+c*5,4.6,'H',{label:''});CL.drawAtom(ctx,m.x,m.y,8,'O',{label:''});});
  ctx.restore();ctx.beginPath();ctx.arc(ZX,ZY,ZR,0,6.29);ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2.5;ctx.stroke();
  txt(ctx,label,ZX,ZY-ZR-12,{s:13*k,w:700,a:'center',c:PAL['cv-soft']});}

function drawCup(ctx,sim,k){ // two nested foam cups, cut away so you can see the water
  const top=RIM,bot=CBOT,yAt=y=>lerp(HWT,HWB,(y-top)/(bot-top));
  ctx.beginPath();ctx.moveTo(CX-yAt(WL),WL);ctx.lineTo(CX+yAt(WL),WL);ctx.lineTo(CX+HWB,bot);ctx.lineTo(CX-HWB,bot);ctx.closePath();ctx.fillStyle=PAL['cv-water'];ctx.fill();
  ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(CX-yAt(WL),WL);ctx.lineTo(CX+yAt(WL),WL);ctx.stroke();
  ['#eceae4','#dedbd2'].forEach((c,i)=>{const o=i*9;ctx.strokeStyle=c;ctx.lineWidth=7;ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(CX-HWT-o-3,top-o*0.2);ctx.lineTo(CX-HWB-o-1,bot);ctx.lineTo(CX+HWB+o+1,bot);ctx.lineTo(CX+HWT+o+3,top-o*0.2);ctx.stroke();});
  ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(CX-HWT-16,top-2);ctx.lineTo(CX-HWB-14,bot+3);ctx.lineTo(CX+HWB+14,bot+3);ctx.lineTo(CX+HWT+16,top-2);ctx.stroke();}
function drawLid(ctx){ctx.fillStyle='#e4e1d9';rr(ctx,CX-HWT-20,RIM-12,2*HWT+40,12,4);ctx.fill();ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=1.2;ctx.stroke();}
function drawProbe(ctx,x,yTop,yTip){ctx.strokeStyle='#5a6270';ctx.lineWidth=5;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x,yTop);ctx.lineTo(x,yTip);ctx.stroke();ctx.fillStyle='#c33';ctx.beginPath();ctx.arc(x,yTip,4,0,6.29);ctx.fill();
  ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,yTop);ctx.quadraticCurveTo(x,yTop-26,x+30,yTop-34);ctx.stroke();}

function drawMetalLab(sim,ctx,vdt,k,t){const p=sim.p,st=sim.st,M=metalOf(p),hn=hon();
  // panel
  const dT=st.Tw-p.T0,dTm=st.Tw-p.tHot;const L=[];
  L.push({t:p.mMetal.toFixed(0)+' g '+(M.unk?M.n.replace('Unknown metal','metal'):M.n.toLowerCase())+' at '+p.tHot.toFixed(0)+' °C  →  '+p.mWater.toFixed(0)+' g water at '+p.T0.toFixed(1)+' °C',s:14,w:700});
  if(!hn)L.push({t:dropped(sim)?'Heat flows from the hot metal into the cooler water.':'The metal heats in boiling water, then goes in the cup.',s:13,c:PAL['cv-soft']});
  else{L.push({t:'q_water = '+p.mWater.toFixed(1)+' g × 4.184 J/g·°C × '+sgn(dT,1)+' °C = '+sgn(p.mWater*CW*dT,0)+' J',s:13,c:PAL['cv-soft']});
    if(M.unk||ap())L.push({t:dropped(sim)?'c_metal = q_water / (m × ΔT_metal) = '+sgn(p.mWater*CW*dT,0)+' J / ('+p.mMetal.toFixed(1)+' g × '+sgn(-dTm,1)+' °C) = '+(Number.isFinite(cFromData(sim,false))?cFromData(sim,false).toFixed(3):'—')+' J/g·°C':'c_metal = q_water / (m_metal × ΔT_metal)',s:13,c:PAL['cv-soft']});
    else L.push({t:'q_metal = '+p.mMetal.toFixed(1)+' g × '+M.c.toFixed(3)+' J/g·°C × '+sgn(st.Tm-p.tHot,1)+' °C = '+sgn(p.mMetal*M.c*(st.Tm-p.tHot),0)+' J',s:13,c:PAL['cv-soft']});}
  // hot plate and bath
  ctx.fillStyle='#4d525b';rr(ctx,BX-12,BY+BH,BW+24,BENCH-BY-BH,4);ctx.fill();ctx.fillStyle=p.tHot>=60?'#e53935':'#9e9e9e';ctx.beginPath();ctx.arc(BX+12,BY+BH+14,4,0,6.29);ctx.fill();
  const liq=CL.drawBeaker(ctx,{x:BX,y:BY,w:BW,h:BH,fill:0.8});
  if(p.tHot>=98&&!RM){ctx.fillStyle=PAL['cv-bubble'];ctx.strokeStyle=PAL['cv-bstroke'];ctx.lineWidth=1;for(let i=0;i<9;i++){const ph=(t*0.9+i*0.137)%1,x=BX+14+((i*53)%(BW-28)),y=BY+BH-6-ph*(BH*0.78-10);ctx.beginPath();ctx.arc(x+Math.sin(t*5+i)*2,y,2.5+ph*3,0,6.29);ctx.fill();ctx.stroke();}}
  // cup
  drawCup(ctx,sim,k);
  // metal block on its string
  const s=blockSize(p),mp=metalPos(sim);ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(mp[0],mp[1]-s/2);ctx.lineTo(mp[0],0);ctx.stroke();
  drawBlock(ctx,mp[0],mp[1],s,M.col);
  if(sim.t>=DROP){drawLid(ctx);}
  drawProbe(ctx,CX+40,RIM-14,CBOT-26);
  // stirrer
  ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(CX+8,RIM-34);ctx.lineTo(CX+8,CBOT-30);ctx.stroke();ctx.beginPath();ctx.moveTo(CX-4,CBOT-30);ctx.lineTo(CX+20,CBOT-30);ctx.stroke();
  bench(ctx);
  pill(ctx,'Bath '+p.tHot.toFixed(1)+' °C',BX+BW/2,BENCH+25,PAL['card'],PAL['cv-ink'],13*k);
  pill(ctx,'Cup '+st.Tw.toFixed(1)+' °C',CX,BENCH+25,PAL['card'],PAL['cv-ink'],13*k);
  zoomLink(ctx,CX-30,CBOT-40,16);
  drawZoom(sim,ctx,vdt,k,t,st.Tw,sim.t>=DROP?st.Tm:null,M.col,sim.t>=DROP?'Metal meets water':'Water in the cup');
  panel(ctx,L.slice(0,1),k);}

function drawSnack(ctx,x,y,S,frac,char,t){const w=17*Math.cbrt(Math.max(0.05,frac)),h=w*0.62;const col=S.col;
  ctx.fillStyle=col;ctx.beginPath();ctx.ellipse(x,y,w,h,0.15,0,6.29);ctx.fill();
  if(char>0){ctx.globalAlpha=clamp(char,0,1)*0.85;ctx.fillStyle='#2a2522';ctx.beginPath();ctx.ellipse(x,y,w,h,0.15,0,6.29);ctx.fill();ctx.globalAlpha=1;}
  ctx.strokeStyle=CL.shade(col,-0.45);ctx.lineWidth=1.2;ctx.beginPath();ctx.ellipse(x,y,w,h,0.15,0,6.29);ctx.stroke();return h;}
function drawFoodLab(sim,ctx,vdt,k,t){const p=sim.p,st=sim.st,S=snackOf(p),hn=hon(),lit=sim.t>=DROP&&st.burning;
  const b=burned(sim),dT=st.Tmax-p.T0,q=p.mWater*CW*dT;
  const L=[{t:S.n+': '+p.mSnack.toFixed(2)+' g before, '+st.mNow.toFixed(2)+' g now',s:14,w:700}];
  if(!hn)L.push({t:'Highest water temperature: '+st.Tmax.toFixed(1)+' °C (ΔT = '+dT.toFixed(1)+' °C)',s:13,c:PAL['cv-soft']});
  else{L.push({t:'q = '+p.mWater.toFixed(1)+' g × 4.184 J/g·°C × '+dT.toFixed(1)+' °C = '+q.toFixed(0)+' J = '+(q/J_PER_CAL).toFixed(2)+' Cal',s:13,c:PAL['cv-soft']});
    L.push({t:'Energy per gram = '+(q/J_PER_CAL).toFixed(2)+' Cal / '+b.toFixed(2)+' g = '+(Number.isFinite(calPerG(sim))?calPerG(sim).toFixed(2):'—')+' Cal/g   (label '+S.cal.toFixed(2)+')',s:13,c:PAL['cv-soft']});}
  // ring stand
  ctx.fillStyle='#5a5f68';rr(ctx,46,BENCH-10,150,10,3);ctx.fill();ctx.fillStyle='#7a808a';ctx.fillRect(84,118,7,BENCH-128);
  ctx.fillRect(87,CANT+48,CANX-CANW/2-87,6);
  // can (aluminum)
  const g=ctx.createLinearGradient(CANX-CANW/2,0,CANX+CANW/2,0);g.addColorStop(0,'#8e959e');g.addColorStop(0.4,'#e3e6ea');g.addColorStop(1,'#80878f');ctx.fillStyle=g;
  rr(ctx,CANX-CANW/2,CANT,CANW,CANB-CANT,8);ctx.fill();ctx.strokeStyle='#5d636b';ctx.lineWidth=1.2;ctx.stroke();
  ctx.fillStyle='#5d636b';ctx.fillRect(CANX-CANW/2-3,CANT+44,CANW+6,14);
  // thermometer down into the can
  drawProbe(ctx,CANX+22,CANT-6,CANB-28);
  // soot on the bottom of the can
  if(b>0.02){ctx.globalAlpha=clamp(b/0.8,0,0.75);ctx.fillStyle='#2b2826';rr(ctx,CANX-CANW/2+4,CANB-14,CANW-8,14,6);ctx.fill();ctx.globalAlpha=1;}
  // holder: paper clip in a cork
  ctx.fillStyle='#b98a5a';rr(ctx,SNX-16,BENCH-24,32,24,4);ctx.fill();ctx.strokeStyle='#8a8f98';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(SNX,BENCH-24);ctx.lineTo(SNX,SNY+4);ctx.stroke();
  const frac=st.mNow/Math.max(0.01,p.mSnack),char=b/Math.max(0.01,burnable(p));drawSnack(ctx,SNX,SNY,S,p.mSnack*frac,char,t);
  if(lit){const fh=46*clamp(Math.sqrt(st.rate/0.018),0.6,1.4);flame(ctx,SNX,SNY-6,fh,t);
    // heat into the can and heat escaping
    arrow(ctx,SNX-30,SNY-24,SNX-30,CANB+6,PAL['s4'],4);arrow(ctx,SNX+30,SNY-24,SNX+30,CANB+6,PAL['s4'],4);
    const lc=PAL['cv-soft'];wavy(ctx,SNX-40,SNY-6,SNX-122,SNY-30,lc,t,2.5);wavy(ctx,SNX+40,SNY-6,SNX+122,SNY-30,lc,t,2.5);
    if(p.setup==='shield'){}
    txt(ctx,'heat lost to the air',SNX+56,SNY+28,{s:12*k,c:PAL['cv-soft'],w:600});}
  if(p.setup==='shield'){ctx.strokeStyle='#a9b0b9';ctx.lineWidth=3;ctx.setLineDash([]);ctx.beginPath();ctx.moveTo(CANX-CANW/2-14,CANT+70);ctx.lineTo(CANX-CANW/2-18,BENCH-28);ctx.moveTo(CANX+CANW/2+14,CANT+70);ctx.lineTo(CANX+CANW/2+18,BENCH-28);ctx.stroke();}
  if(st.boiled)pill(ctx,'Water is boiling: heat leaves as steam',CANX,CANT-30,PAL['s1'],'#fff',12*k);
  bench(ctx);
  pill(ctx,'Water '+st.Tw.toFixed(1)+' °C',CANX,BENCH+25,PAL['card'],PAL['cv-ink'],13*k);
  zoomLink(ctx,CANX-14,CANT+100,16);
  drawZoom(sim,ctx,vdt,k,t,st.Tw,null,null,'Water in the can');
  panel(ctx,L.slice(0,1),k);}

function drawBombLab(sim,ctx,vdt,k,t){const p=sim.p,st=sim.st,S=snackOf(p),dT=st.Tmax-p.T0,q=BOMB_C*dT;
  const L=[{t:p.mSnack.toFixed(3)+' g '+S.n.toLowerCase()+', C_cal = '+BOMB_C.toFixed(2)+' kJ/°C',s:14,w:700},
    {t:'q = C_cal × ΔT = '+BOMB_C.toFixed(2)+' kJ/°C × '+dT.toFixed(3)+' °C = '+q.toFixed(2)+' kJ  →  '+(q/p.mSnack).toFixed(2)+' kJ/g',s:13,c:PAL['cv-soft']}];
  // insulated jacket and bucket
  ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=2;ctx.setLineDash([6,4]);rr(ctx,BKX-18,BKT-22,BKW+36,BKB-BKT+22,12);ctx.stroke();ctx.setLineDash([]);
  ctx.fillStyle=PAL['cv-water'];ctx.fillRect(BKX,BKT+16,BKW,BKB-BKT-16);ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(BKX,BKT);ctx.lineTo(BKX,BKB);ctx.lineTo(BKX+BKW,BKB);ctx.lineTo(BKX+BKW,BKT);ctx.stroke();
  // steel bomb
  const bx=BKX+BKW/2-20,bw=96,bt=BKT+70,bb=BKB-14;const g=ctx.createLinearGradient(bx-bw/2,0,bx+bw/2,0);g.addColorStop(0,'#4a5059');g.addColorStop(0.45,'#9aa1ab');g.addColorStop(1,'#454b53');
  ctx.fillStyle=g;rr(ctx,bx-bw/2,bt,bw,bb-bt,12);ctx.fill();ctx.fillStyle='#3b4047';rr(ctx,bx-bw/2-6,bt-10,bw+12,16,5);ctx.fill();
  // window into the bomb: sample cup and flash
  ctx.fillStyle='#1e2228';rr(ctx,bx-26,bt+34,52,46,6);ctx.fill();ctx.fillStyle='#b7bcc4';ctx.fillRect(bx-14,bt+66,28,8);
  if(st.mNow>0.001){drawSnack(ctx,bx,bt+62,S,st.mNow,0,t);}
  if(st.burning&&sim.t>=DROP)flame(ctx,bx,bt+66,28,t);
  // fuse wires to the ignition unit
  ctx.strokeStyle='#c0392b';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(bx-8,bt-10);ctx.quadraticCurveTo(bx-30,BKT-50,BKX-70,BKT-38);ctx.lineTo(BKX-70,BENCH-34);ctx.stroke();
  ctx.fillStyle='#4d525b';rr(ctx,BKX-120,BENCH-34,96,34,5);ctx.fill();txt(ctx,'Ignition',BKX-72,BENCH-12,{s:12*k,w:700,c:'#fff',a:'center'});
  // stirrer and thermometer
  ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(BKX+BKW-24,BKT-30);ctx.lineTo(BKX+BKW-24,BKB-40);ctx.stroke();
  const ang=RM?0:t*12;ctx.beginPath();ctx.moveTo(BKX+BKW-24-14*Math.cos(ang),BKB-40);ctx.lineTo(BKX+BKW-24+14*Math.cos(ang),BKB-40);ctx.stroke();
  drawProbe(ctx,BKX+BKW-52,BKT-14,BKB-60);
  bench(ctx);
  pill(ctx,'Water '+st.Tw.toFixed(3)+' °C',BKX+BKW/2,BENCH+25,PAL['card'],PAL['cv-ink'],13*k);
  zoomLink(ctx,BKX+BKW-40,BKT+50,16);
  drawZoom(sim,ctx,vdt,k,t,st.Tw,null,null,'Water in the bucket');
  panel(ctx,L.slice(0,1),k);}


function calcHTML(sim){const p=sim.p,st=sim.st,hn=hon(),A=ap();const f1=v=>sgn(v,1),row=(a,b)=>'<p>'+a+(b?'<br><span style="color:var(--muted);font-size:14px">'+b+'</span>':'')+'</p>';let h='<h3>Your calculation</h3>';
  if(p.mode==='metal'){const M=metalOf(p),dT=st.Tw-p.T0,dTm=st.Tw-p.tHot,q=p.mWater*CW*dT;
    if(sim.t<DROP)return h+row('The metal starts at the bath temperature, '+p.tHot.toFixed(1)+' °C. The water starts at '+p.T0.toFixed(1)+' °C.','Watch the cup thermometer after the metal goes in.');
    if(!hn)return h+row('<b>Heat gained by the water</b> = mass × 4.184 × temperature change = '+p.mWater.toFixed(0)+' g × 4.184 × '+dT.toFixed(1)+' °C = <b>'+q.toFixed(0)+' J</b>')+row('The metal lost the same '+q.toFixed(0)+' J. Its temperature dropped '+(p.tHot-st.Tw).toFixed(1)+' °C, much more than the water rose.');
    h+=row('<b>q<sub>water</sub></b> = m·c·ΔT = '+p.mWater.toFixed(1)+' g × 4.184 J/g·°C × '+f1(dT)+' °C = <b>'+sgn(q,0)+' J</b>');
    if(A&&p.Ccal>0)h+=row('<b>q<sub>cup</sub></b> = C<sub>cal</sub>·ΔT = '+p.Ccal.toFixed(0)+' J/°C × '+f1(dT)+' °C = <b>'+sgn(p.Ccal*dT,0)+' J</b>');
    const qt=q+(A?p.Ccal*dT:0);h+=row('<b>q<sub>metal</sub></b> = −q<sub>'+(A&&p.Ccal>0?'water + cup':'water')+'</sub> = <b>'+sgn(-qt,0)+' J</b>, and ΔT<sub>metal</sub> = '+st.Tw.toFixed(1)+' − '+p.tHot.toFixed(1)+' = '+f1(dTm)+' °C');
    const c=dTm<-0.05?-qt/(p.mMetal*dTm):NaN;h+=row('<b>c<sub>metal</sub></b> = q<sub>metal</sub> ÷ (m·ΔT) = '+sgn(-qt,0)+' J ÷ ('+p.mMetal.toFixed(1)+' g × '+f1(dTm)+' °C) = <b>'+(Number.isFinite(c)?c.toFixed(3):'—')+' J/g·°C</b>',st.Tm-st.Tw>0.5?'The water is still warming. Wait for the highest steady temperature before you calculate.':(M.unk?'Compare with the table: Al 0.897, Fe 0.449, Cu 0.385, Pb 0.129 J/g·°C.':'Accepted value for '+M.n.toLowerCase()+': '+M.c.toFixed(3)+' J/g·°C ('+(100*Math.abs(c-M.c)/M.c).toFixed(1)+'% error).'));
    return h;}
  const S=snackOf(p),b=burned(sim);
  if(p.mode==='food'){const dT=st.Tmax-p.T0,q=p.mWater*CW*dT,Cal=q/J_PER_CAL,cpg=calPerG(sim);
    h+=row('<b>Mass burned</b> = '+p.mSnack.toFixed(2)+' g − '+st.mNow.toFixed(2)+' g = <b>'+b.toFixed(2)+' g</b>');
    h+=row('<b>Temperature rise</b> = '+st.Tmax.toFixed(1)+' °C (highest) − '+p.T0.toFixed(1)+' °C = <b>'+dT.toFixed(1)+' °C</b>');
    h+=row('<b>q</b> = m·c·ΔT = '+p.mWater.toFixed(1)+' g × 4.184 J/g·°C × '+dT.toFixed(1)+' °C = <b>'+q.toFixed(0)+' J</b> = '+(q/1000).toFixed(2)+' kJ = <b>'+Cal.toFixed(2)+' Cal</b>','1 Cal (food Calorie) = 1 kcal = 4184 J');
    h+=row('<b>Energy per gram</b> = '+Cal.toFixed(2)+' Cal ÷ '+b.toFixed(2)+' g = <b>'+(Number.isFinite(cpg)?cpg.toFixed(2):'—')+' Cal/g</b>'+(hn&&Number.isFinite(cpg)?' = '+(cpg*4.184).toFixed(2)+' kJ/g':''),'Label: '+S.cal.toFixed(2)+' Cal/g ('+S.src+')'+(hn&&Number.isFinite(cpg)?'. Percent error: '+(100*Math.abs(cpg-S.cal)/S.cal).toFixed(0)+'%':''));
    if(A&&Number.isFinite(cpg))h+=row('<b>ΔH<sub>comb</sub></b> = −q ÷ mass = <b>'+sgn(-cpg*4.184,2)+' kJ/g</b>','Negative: the reaction released the heat the water gained.');
    return h;}
  const dT=st.Tmax-p.T0,q=BOMB_C*dT;
  h+=row('<b>ΔT</b> = '+st.Tmax.toFixed(3)+' − '+p.T0.toFixed(3)+' = <b>'+dT.toFixed(3)+' °C</b>');
  h+=row('<b>q<sub>cal</sub></b> = C<sub>cal</sub>·ΔT = '+BOMB_C.toFixed(2)+' kJ/°C × '+dT.toFixed(3)+' °C = <b>'+q.toFixed(2)+' kJ</b>','C_cal was found by burning benzoic acid, 26.43 kJ/g.');
  h+=row('<b>ΔH<sub>comb</sub></b> ≈ −q ÷ mass = −'+q.toFixed(2)+' kJ ÷ '+p.mSnack.toFixed(3)+' g = <b>'+sgn(-q/p.mSnack,2)+' kJ/g</b> = '+sgn(-q/p.mSnack/4.184,2)+' Cal/g','Label: '+S.cal.toFixed(2)+' Cal/g = '+(S.cal*4.184).toFixed(2)+' kJ/g');
  return h;}

/* ---------- the sim ---------- */
const MOD=['metal'],FOOD=['food'],BOMB=['bomb'],FB=['food','bomb'],ALL=['metal','food','bomb'];
const CAL={
  id:'calorimetry',hash:'calorimetry',apUnit:11,order:1,tab:'Calorimetry lab',kind:'Virtual lab',
  prereq:['measure'],next:['coldpack','enthalpy','states'],
  card:'Drop hot metal into a coffee-cup calorimeter, then burn a cheese puff under a can of water and find its Calories per gram.',
  title:'Calorimetry: specific heat and energy in food',
  lede:{bio:'Heat always flows from hot to cold until the temperatures match. Use that to measure how much energy a metal holds and how much energy is stored in a snack.',
        honors:'Use q = mcΔT and q_lost = −q_gained to find the specific heat of an unknown metal, then measure Calories per gram in a snack and explain your percent error.',
        ap:'Account for the calorimeter’s own heat capacity, compare an open-can measurement with a bomb calorimeter, and report ΔH_comb with the right sign.'},
  scale:{bio:'Bench scale: a foam coffee cup holds 100 mL of water. In the particle view each ball is one atom, about 0.1–0.3 nm across, shown about 50 million times larger.',
         ap:'Bench scale: a foam coffee cup holds 100 mL of water; the bomb sits in 2.000 kg of water. In the particle view each ball is one atom, about 0.1–0.3 nm across.'},
  timeScale:3,dtMax:0.05,sampleDt:0.5,window:180,unit:'s',chChange:0,chReveal:150,
  controls:[
    {id:'mode',label:'Lab',type:'seg',def:'metal',lvl:'bio',options:[{v:'metal',l:'Hot metal in a cup'},{v:'food',l:'Burn a snack'},{v:'bomb',l:'Bomb calorimeter',lvl:'ap'}],onChange(sim){syncMode(sim);restart(sim);}},
    {id:'metal',label:'Metal',type:'select',def:'cu',lvl:'bio',modes:MOD,options:[{v:'al',l:'Aluminum (Al)'},{v:'fe',l:'Iron (Fe)'},{v:'cu',l:'Copper (Cu)'},{v:'pb',l:'Lead (Pb)'},{v:'ua',l:'Unknown metal A',lvl:'honors'},{v:'ub',l:'Unknown metal B',lvl:'honors'}],onChange:restart},
    {id:'mMetal',label:'Mass of metal',type:'range',min:10,max:100,step:1,def:50,unit:' g',lvl:'bio',modes:MOD,onChange:restart},
    {id:'tHot',label:'Starting metal temperature (bath)',type:'range',min:50,max:100,step:1,def:100,unit:' °C',lvl:'honors',modes:MOD,onChange:restart,help:'The metal sits in the water bath long enough to reach the bath temperature.'},
    {id:'snack',label:'Snack',type:'select',def:'puff',lvl:'bio',modes:FB,options:Object.keys(SNACKS).map(k=>({v:k,l:SNACKS[k].n})),onChange:restart},
    {id:'mSnack',label:'Mass of snack',type:'range',min:0.3,max:2,step:0.05,def:1.2,unit:' g',d:2,lvl:'bio',modes:FB,onChange:restart},
    {id:'setup',label:'Can setup',type:'seg',def:'open',lvl:'honors',modes:FOOD,options:[{v:'open',l:'Open can'},{v:'shield',l:'With a foil draft shield'}],onChange:restart},
    {id:'mWater',label:'Mass of water',type:'range',min:50,max:200,step:5,def:100,unit:' g',d:1,lvl:'honors',modes:['metal','food'],onChange:restart,help:'1 mL of water has a mass of 1.00 g.'},
    {id:'T0',label:'Starting water temperature',type:'range',min:10,max:30,step:0.5,def:20,unit:' °C',lvl:'honors',onChange:restart},
    {id:'Ccal',label:'Heat capacity of the cup',type:'range',min:0,max:50,step:1,def:0,unit:' J/°C',lvl:'ap',modes:MOD,onChange:restart,help:'0 is a perfect cup. A real foam cup, stirrer and probe absorb about 10–40 J for each °C.'}
  ],
  actions:[{id:'again',label:'Run the trial again',lvl:'bio',primary:true,run(sim){restart(sim);}}],
  init(sim){const p=sim.p;return {Tw:p.T0,Tm:p.tHot,Tmax:p.T0,mNow:p.mSnack,burning:false,rate:0,boiled:false,E:0};},
  step(sim,dt){const p=sim.p,st=sim.st,t=sim.t;sim.infoDirty=true;
    if(p.mode==='metal'){if(t<DROP){st.Tm=p.tHot;st.Tw=p.T0;st.Tmax=p.T0;return;}
      const M=metalOf(p),Cm=p.mMetal*M.c,Cw=p.mWater*CW+cupC(p),kh=2.0*Math.pow(p.mMetal/50,2/3),P=kh*(st.Tm-st.Tw);
      st.Tm-=P*dt/Cm;st.Tw+=P*dt/Cw;st.Tmax=Math.max(st.Tmax,st.Tw);return;}
    if(p.mode==='food'){const S=snackOf(p),left=burnable(p)-(p.mSnack-st.mNow);st.burning=t>=DROP&&left>1e-6;st.rate=0;
      if(st.burning){const r=S.rate*Math.pow(p.mSnack,2/3)*(left<0.08?Math.max(0.25,left/0.08):1),dm=Math.min(r*dt,left);st.rate=r;st.mNow-=dm;
        st.Tw+=dm*S.cal*J_PER_CAL*EFF[p.setup]/(p.mWater*CW);}
      st.Tw-=(st.Tw-p.T0)*dt/1800;   // the can slowly loses heat to the room
      if(st.Tw>=100){st.Tw=100;st.boiled=true;}st.Tmax=Math.max(st.Tmax,st.Tw);return;}
    // bomb: complete combustion in pure O₂, all heat captured; the water lags the bomb by a few seconds
    const S=snackOf(p);st.burning=t>=DROP&&st.mNow>1e-6;if(st.burning){const dm=Math.min(0.25*dt,st.mNow);st.mNow-=dm;st.E+=dm*S.cal*J_PER_CAL;}
    const target=p.T0+st.E/(BOMB_C*1000);st.Tw+=(target-st.Tw)*dt/6;st.Tmax=Math.max(st.Tmax,st.Tw);},
  metrics:[
    {id:'Tw',label:'Water temperature',unit:'°C',lvl:'bio',min:0,max:100,d:1,modes:['metal','food'],get:s=>s.st.Tw},
    {id:'TwB',label:'Water temperature',unit:'°C',lvl:'ap',min:0,max:40,d:3,modes:BOMB,get:s=>s.p.mode==='bomb'?s.st.Tw:NaN},
    {id:'dTB',label:'Temperature rise, ΔT',unit:'°C',lvl:'ap',min:0,max:null,d:3,modes:BOMB,get:s=>s.p.mode==='bomb'?s.st.Tmax-s.p.T0:NaN},
    {id:'Tm',label:'Metal temperature (model)',unit:'°C',lvl:'bio',min:0,max:100,d:1,modes:MOD,get:s=>s.p.mode==='metal'?s.st.Tm:NaN},
    {id:'dTw',label:'Change in water temperature, ΔT',unit:'°C',lvl:'bio',min:0,max:null,d:1,modes:['metal','food'],get:s=>(s.p.mode==='food'?s.st.Tmax:s.st.Tw)-s.p.T0},
    {id:'dTm',label:'Change in metal temperature',unit:'°C',lvl:'honors',min:-100,max:0,d:1,modes:MOD,get:s=>s.p.mode==='metal'?s.st.Tw-s.p.tHot:NaN},
    {id:'qw',label:'Heat gained by water, q = mcΔT',unit:'J',lvl:'honors',min:0,max:null,d:0,modes:['metal','food'],get:s=>s.p.mode==='bomb'?NaN:qWater(s)},
    {id:'qcup',label:'Heat gained by the cup',unit:'J',lvl:'ap',min:0,max:null,d:0,modes:MOD,get:s=>s.p.mode==='metal'?s.p.Ccal*(s.st.Tw-s.p.T0):NaN},
    {id:'cData',label:'Specific heat from your data',unit:'J/g·°C',lvl:'honors',min:0,max:1,d:3,modes:MOD,get:s=>cFromData(s,false)},
    {id:'cCup',label:'Specific heat, cup included',unit:'J/g·°C',lvl:'ap',min:0,max:1,d:3,modes:MOD,get:s=>cFromData(s,true)},
    {id:'match',label:'Closest metal in the table',unit:'',lvl:'honors',text:true,modes:MOD,get:s=>{if(s.p.mode!=='metal'||s.t<DROP)return 'Waiting for data';if(s.st.Tm-s.st.Tw>0.5)return 'Wait for equilibrium';const m=closestMetal(cFromData(s,atLeast('ap')));if(!m)return 'Waiting for data';return METALS[m.k].n+' ('+METALS[m.k].c.toFixed(3)+')';}},
    {id:'Tf',label:'Predicted final temperature',unit:'°C',lvl:'ap',min:0,max:100,d:1,modes:MOD,get:s=>s.p.mode==='metal'?eqTemp(s.p):NaN},
    {id:'mBurn',label:'Mass of snack burned',unit:'g',lvl:'bio',min:0,max:2,d:2,modes:FB,get:s=>s.p.mode==='metal'?NaN:burned(s)},
    {id:'mNow',label:'Snack mass now',unit:'g',lvl:'bio',min:0,max:2,d:2,modes:FB,noTrial:true,get:s=>s.p.mode==='metal'?NaN:s.st.mNow},
    {id:'qCal',label:'Heat absorbed by water',unit:'Cal',lvl:'bio',min:0,max:null,d:2,modes:FOOD,get:s=>s.p.mode==='food'?qWater(s)/J_PER_CAL:NaN},
    {id:'cpg',label:'Your result',unit:'Cal/g',lvl:'bio',min:0,max:7,d:2,modes:FB,get:s=>s.p.mode==='metal'?NaN:calPerG(s)},
    {id:'lbl',label:'Nutrition label value',unit:'Cal/g',lvl:'bio',min:0,max:7,d:2,modes:FB,get:s=>s.p.mode==='metal'?NaN:snackOf(s.p).cal},
    {id:'pct',label:'Your result as a percent of the label',unit:'%',lvl:'honors',min:0,max:100,d:0,modes:FB,get:s=>{const v=calPerG(s);return s.p.mode==='metal'||!Number.isFinite(v)?NaN:100*v/snackOf(s.p).cal;}},
    {id:'kJg',label:'Energy per gram',unit:'kJ/g',lvl:'honors',min:0,max:30,d:2,modes:FB,get:s=>{const v=calPerG(s);return s.p.mode==='metal'?NaN:v*J_PER_CAL/1000;}},
    {id:'qB',label:'q = C_cal × ΔT',unit:'kJ',lvl:'ap',min:0,max:null,d:2,modes:BOMB,get:s=>s.p.mode==='bomb'?qWater(s)/1000:NaN},
    {id:'dHc',label:'ΔH_comb per gram (your data)',unit:'kJ/g',lvl:'ap',min:-30,max:0,d:2,modes:FB,get:s=>{const v=calPerG(s);return s.p.mode==='metal'?NaN:-v*J_PER_CAL/1000;}}
  ],
  graphs:[{id:'temps',label:'Water and metal temperature',lvl:'bio',lines:['Tw','Tm']},{id:'tw',label:'Water temperature',lvl:'bio',lines:['Tw']},{id:'mass',label:'Snack mass',lvl:'bio',lines:['mNow']},{id:'twb',label:'Bomb water temperature',lvl:'ap',lines:['TwB']}],
  defaultGraph:'temps',
  infoPanel:calcHTML,
  narrate(sim){const p=sim.p,st=sim.st,hn=hon();
    if(p.mode==='metal'){const M=metalOf(p),nm=M.unk?'The unknown metal':M.n;
      if(sim.t<DROP)return nm+' is heating in the bath at '+p.tHot.toFixed(0)+' °C. In a moment it goes into the cup of '+p.T0.toFixed(1)+' °C water.';
      const gap=st.Tm-st.Tw;
      if(gap>0.3)return '<b>Heat flows from the hot metal into the cooler water.</b> The metal atoms vibrate hard and bump the water molecules, passing them energy. The metal has cooled by '+(p.tHot-st.Tm).toFixed(1)+' °C, but the water has warmed only '+(st.Tw-p.T0).toFixed(1)+' °C'+(hn?', because its heat capacity (m·c) is much larger.':'.');
      return '<b>Thermal equilibrium:</b> metal and water are both at '+st.Tw.toFixed(1)+' °C, so heat stops flowing. '+(hn?'The water gained '+(p.mWater*CW*(st.Tw-p.T0)).toFixed(0)+' J, so the metal lost the same amount.':'The water gained exactly the energy the metal lost.');}
    if(p.mode==='food'){const S=snackOf(p),cpg=calPerG(sim);
      if(sim.t<DROP)return 'The '+S.n.toLowerCase()+' is about to be lit. Its energy will heat the water in the can above it.';
      if(st.boiled)return '<b>The water reached 100 °C</b>, so extra heat now boils water away instead of raising the temperature. Use more water or a smaller sample.';
      if(st.burning)return '<b>The burning snack releases stored chemical energy as heat.</b> Some heats the can and water, but '+(p.setup==='shield'?'a good share':'most')+' escapes into the air around the can.';
      return 'The flame went out with '+st.mNow.toFixed(2)+' g of char left. Using the <b>mass burned ('+burned(sim).toFixed(2)+' g)</b> and the highest temperature, you get '+(Number.isFinite(cpg)?cpg.toFixed(2):'—')+' Cal/g, '+(Number.isFinite(cpg)?(100*cpg/S.cal).toFixed(0):'—')+'% of the label value. The rest of the heat went into the air.';}
    const S=snackOf(p);if(sim.t<DROP)return 'The sample sits inside a sealed steel bomb filled with pure oxygen. A spark will ignite it.';
    if(st.burning)return 'The sample burns completely in pure oxygen. The heat spreads through the steel into the 2 kg of water around it.';
    return '<b>The bomb captures nearly all the heat</b>, so q = C_cal × ΔT gives '+(qWater(sim)/1000/p.mSnack).toFixed(2)+' kJ/g, close to the '+(S.cal*4.184).toFixed(2)+' kJ/g on the label. The rise is small because the calorimeter’s heat capacity is large.';},
  tour:[
    {title:'Heat the metal',text:{bio:'The metal block hangs in a bath of boiling water. After a few minutes it is at 100 °C, the same as the water around it.',honors:'Leave the metal in the boiling-water bath until it reaches the bath temperature. That gives you its starting temperature without measuring the metal directly.'},focus:[BX-20,BY-10,BW+40,BENCH-BY+50],speed:0.4,setup(sim){BioLab.setValues(sim,{mode:'metal',metal:'cu',mMetal:50});restart(sim);}},
    {title:'Into the cup',text:'Move the hot metal into the foam cup of cool water and put the lid on. The foam keeps heat from leaking out, so all the heat the metal loses goes into the water.',focus:[CX-HWT-30,170,2*HWT+60,BENCH-170+50],speed:0.4},
    {title:'Watch the particles',text:'The metal atoms vibrate hard because they are hot. When they bump the slower water molecules, they pass energy along. The metal’s vibrations calm down while the water molecules speed up.',focus:[ZX-ZR-10,ZY-ZR-30,2*ZR+20,2*ZR+40],speed:1},
    {title:'Thermal equilibrium',text:{bio:'Heat flows until the metal and water reach the same temperature. Then it stops. The metal cools a lot, but the water warms only a little.',honors:'At equilibrium T_metal = T_water. The copper cooled about 76 °C and the water warmed about 3.5 °C because the water’s heat capacity (100 g × 4.184) is far larger than the copper’s (50 g × 0.385).'},focus:[CX-HWT-30,170,2*HWT+60,BENCH-170+50],speed:2},
    {lvl:'honors',title:'Heat lost = heat gained',text:'Your calculation panel below the graph works it out: q_water = m·c·ΔT for the water. The metal lost the same amount of heat, so c_metal = −q_water ÷ (m_metal × ΔT_metal). Compare it with the table to identify the metal.',focus:[8,6,784,60],pause:true},
    {title:'Burn a snack',text:{bio:'Now the energy-in-food lab. A cheese puff burns under a can of water. The energy stored in its chemical bonds becomes heat, and the water warms up.',honors:'Weigh the snack before and after. Use the mass that actually burned, because the char left behind did not release its energy.'},focus:[CANX-CANW/2-40,CANT-20,CANW+80,BENCH-CANT+20],speed:0.5,setup(sim){BioLab.setValues(sim,{mode:'food',snack:'puff',mSnack:1.2});restart(sim);sim.t=8;}},
    {title:'Where the heat goes',text:{bio:'Only part of the heat reaches the water. The rest warms the air around the can. That is why your Calories per gram come out lower than the label.',honors:'In an open can only about 25–30% of the heat reaches the water. A foil draft shield helps, but the result still falls short of the label.'},focus:[SNX-140,CANB-20,280,BENCH-CANB+30],speed:0.5},
    {lvl:'ap',title:'The bomb calorimeter',text:'A bomb calorimeter burns the sample in pure oxygen inside a sealed steel bomb sunk in 2 kg of water. Almost no heat escapes, so q = C_cal × ΔT gives a value close to the label. ΔH_comb = −q / mass.',focus:[BKX-30,BKT-40,BKW+60,BENCH-BKT+40],speed:2,setup(sim){BioLab.setValues(sim,{mode:'bomb',snack:'puff',mSnack:1.2});restart(sim);}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{mode:'metal',metal:'cu',mMetal:50,snack:'puff',mSnack:1.2});restart(sim);},
  onChallenge(sim,ch,phase){if(ch&&ch.instant&&ch.set&&phase==='done'){BioLab.setValues(sim,ch.set);restart(sim);}},
  challenges:[
    {lvl:'bio',q:'You drop 50 g of lead at 100 °C into 100 g of water at 20 °C. Where does the final temperature end up?',choices:['About halfway, near 60 °C','Close to 20 °C','Close to 100 °C'],correct:1,
     baseline:{mode:'metal',metal:'pb',mMetal:50},reveal:90,watch:'temps',
     explain:{bio:'The final temperature is only about 21 °C. Lead has a very low specific heat (0.129 J/g·°C), so 50 g of it holds little heat. Water has a high specific heat, so it barely warms. The final temperature is not the average of the two.',honors:'Final T = 21.2 °C. The lead’s heat capacity is 50 × 0.129 = 6.45 J/°C and the water’s is 100 × 4.184 = 418 J/°C, so the water barely moves while the lead drops 79 °C.'}},
    {lvl:'bio',q:'You burn a cheese puff under a can of water. How will your Calories per gram compare with the nutrition label?',choices:['About the same as the label','Much lower than the label','Higher than the label'],correct:1,
     baseline:{mode:'food',snack:'puff',mSnack:1.2},watch:'tw',
     explain:{bio:'Your result is about 1.6 Cal/g, while the label says 5.7 Cal/g. Most of the flame’s heat warms the air around the can, not the water, so q = mcΔT misses it.',honors:'About 28% of the energy reached the water in this open-can setup. Heat lost to the air, heating the can itself, and incomplete burning all make the measured value low, never high.'}},
    {lvl:'bio',q:'You burn a 2.0 g piece of cheese puff instead of a 1.0 g piece. What happens to your Calories per gram?',choices:['It doubles','It stays about the same','It halves'],correct:1,
     baseline:{mode:'food',snack:'puff',mSnack:1.0},change:{mSnack:2.0},changeText:'Snack mass changed to 2.0 g',watch:'tw',
     explain:{bio:'The temperature rise about doubles, but so does the mass burned, so Calories per gram stays about the same (1.6 Cal/g). Energy per gram is a property of the food, not of how much you burn.'}},
    {lvl:'honors',q:'Copper (50 g, 100 °C) goes into 100 g of water at 20 °C. Which changes temperature by more?',choices:['The water','The copper','They change by the same amount'],correct:1,
     baseline:{mode:'metal',metal:'cu',mMetal:50},reveal:100,watch:'temps',
     explain:{honors:'The copper drops about 76.5 °C while the water rises only about 3.5 °C. The heat is the same size for both (q_lost = −q_gained, about 1470 J), but the copper’s heat capacity (19.3 J/°C) is far smaller than the water’s (418 J/°C), so the same heat changes its temperature far more.'}},
    {lvl:'honors',q:'Unknown metal A (50.0 g, 100.0 °C) is dropped into 100.0 g of water at 20.0 °C. Which metal is it?',choices:['Aluminum (0.897 J/g·°C)','Iron (0.449 J/g·°C)','Copper (0.385 J/g·°C)','Lead (0.129 J/g·°C)'],correct:1,
     baseline:{mode:'metal',metal:'ua',mMetal:50},reveal:110,watch:'temps',
     explain:{honors:'The water ends near 24.1 °C. q_water = 100.0 × 4.184 × 4.1 ≈ 1700 J, and the metal changed by −75.9 °C, so c = 1700 ÷ (50.0 × 75.9) ≈ 0.449 J/g·°C: iron. Copper (0.385) is the near miss, so careful temperature reading matters.'}},
    {lvl:'honors',q:'You burn the same 1.2 g cheese puff under 50 g of water instead of 100 g. What happens to the temperature rise?',choices:['It stays the same','It about doubles','It halves'],correct:1,
     baseline:{mode:'food',snack:'puff',mSnack:1.2,mWater:100},change:{mWater:50},changeText:'Water changed to 50 g',watch:'tw',
     explain:{honors:'The same heat goes into half as much water, so ΔT about doubles (about 16 °C → about 32 °C). q = mcΔT comes out the same, so the Calories per gram do not change.'}},
    {lvl:'ap',q:'The cup absorbs heat (C_cal = 40 J/°C) but you leave it out of your calculation. Your specific heat for aluminum comes out…',choices:['too high','too low','correct anyway'],correct:1,
     baseline:{mode:'metal',metal:'al',mMetal:50,Ccal:40},reveal:150,watch:'temps',
     explain:{ap:'The metal’s heat went into the water and the cup, but you counted only the water, so q looks smaller than it really was. c from the water alone is about 0.82 J/g·°C instead of 0.897. Adding C_cal·ΔT (the “cup included” readout) recovers 0.897.'}},
    {lvl:'ap',q:'The water in the can warms from 20.0 °C to 36.0 °C while a snack burns. What is the sign of ΔH_comb for the snack?',choices:['Positive, because the water gained heat','Negative, because the reaction released heat','Zero, because energy is conserved'],correct:1,
     baseline:{mode:'food',snack:'puff',mSnack:1.2},watch:'tw',
     explain:{ap:'q_water is positive, so q_reaction = −q_water is negative: combustion is exothermic. The readout ΔH_comb per gram shows about −6.6 kJ/g from this open-can data (the bomb gives about −23.9 kJ/g).'}},
    {lvl:'ap',q:'You burn 1.20 g of cheese puff in the bomb calorimeter instead of the open can. Your kJ per gram will be…',choices:['about the same as the open can','close to the label value','higher than the label value'],correct:1,
     baseline:{mode:'bomb',snack:'puff',mSnack:1.2},reveal:80,watch:'twb',
     explain:{ap:'The water warms about 2.87 °C, so q = 10.00 kJ/°C × 2.87 °C = 28.7 kJ, or 23.9 kJ/g, which matches the label (5.71 Cal/g × 4.184). The sealed bomb burns the sample completely in O₂ and keeps the heat in. The model uses the label value as the true energy; real bomb values run about 5–10% higher than labels.'}}
  ],
  lab:{bio:'<p><b>Question:</b> How many Calories per gram are in a cheese puff? (This is the “Burn a Cheeto” lab.)</p><ol><li>Choose <b>Burn a snack</b> and leave the snack at 1.20 g.</li><li>Let it burn out. Record the snack mass before and after, and the starting and highest water temperatures.</li><li>Calculate q = mcΔT in joules, change it to Calories (1 Cal = 4184 J), and divide by the mass burned.</li><li>Repeat with a peanut and a marshmallow.</li></ol><p>Compare each result with the label. Explain why every result is lower than the label.</p><p style="color:var(--muted);font-size:14px">Safety: in a real lab wear goggles, tie back hair, keep the burning food over the bench, and check for nut allergies.</p>',
       honors:'<p><b>Question:</b> What is unknown metal A, and how good is a soda-can calorimeter?</p><ol><li>Choose <b>Hot metal in a cup</b> and <b>Unknown metal A</b>. Let the temperatures reach equilibrium, then record a trial.</li><li>Calculate q_water, then c_metal = q_water ÷ (m_metal × ΔT_metal). Identify the metal. Repeat for metal B.</li><li>Switch to <b>Burn a snack</b>. Burn a cheese puff with the open can, then with the foil draft shield. Record both.</li></ol><p>Calculate percent error against the label for both setups and name two places the missing heat went.</p>',
       ap:'<p><b>Question:</b> How do calorimeter heat capacity and heat loss change your answers?</p><ol><li>Drop 50 g of aluminum with the cup heat capacity at 0, 20 and 40 J/°C. Record c from the water alone and with the cup included.</li><li>Burn 1.20 g of cheese puff in the open can and in the bomb calorimeter. Record ΔT and kJ/g for each.</li><li>Report ΔH_comb (kJ/g) from the bomb with the correct sign and significant figures.</li></ol><p><b>Claim–evidence–reasoning:</b> Explain which systematic errors make each method read low, and why the bomb result is closer to the accepted value.</p>'},
  terms:[{t:'Heat (q)',d:'Energy that moves from a hotter object to a cooler one because of a temperature difference. Measured in joules (J).'},{t:'Temperature',d:'A measure of the average kinetic energy of the particles in a substance.'},{t:'Thermal equilibrium',d:'The point when two objects in contact reach the same temperature, so no more heat flows between them.'},{t:'Calorie (Cal)',d:'The food Calorie on a nutrition label. 1 Cal = 1 kcal = 1000 cal = 4184 J.'},{t:'Calorimeter',d:'An insulated container used to measure heat from a temperature change of water.'},
    {lvl:'honors',t:'Specific heat (c)',d:'The heat needed to raise 1 g of a substance by 1 °C. Water: 4.184 J/g·°C. Metals are much lower.'},{lvl:'honors',t:'q = mcΔT',d:'Heat equals mass × specific heat × change in temperature (ΔT = T_final − T_initial).'},{lvl:'honors',t:'q_lost = −q_gained',d:'In an insulated calorimeter, the heat the hot object loses equals the heat the cold water gains.'},{lvl:'honors',t:'Percent error',d:'|measured − accepted| ÷ accepted × 100%.'},
    {lvl:'ap',t:'Heat capacity of the calorimeter (C_cal)',d:'Heat absorbed by the cup, stirrer and probe per °C. q_total = m·c·ΔT + C_cal·ΔT.'},{lvl:'ap',t:'Bomb calorimeter',d:'A sealed steel vessel where a sample burns in pure O₂ at constant volume, sunk in a measured mass of water. Calibrated with benzoic acid.'},{lvl:'ap',t:'Enthalpy of combustion (ΔH_comb)',d:'The heat released when a substance burns completely. Negative for every combustion: q_rxn = −q_calorimeter.'}],
  about:'<p><b>Hot metal.</b> The metal and water exchange heat at a rate P = h·(T_metal − T_water), with h ≈ 2 W/°C for 50 g of metal (scaled with surface area). Each step, T_metal falls by P·Δt / (m·c) and T_water rises by P·Δt / (m_water·4.184 + C_cal), so energy is conserved exactly and the final temperature equals (m_m c_m T_m + C_w T_w) / (m_m c_m + C_w). The cup loses no heat to the room. Specific heats: Al 0.897, Fe 0.449, Cu 0.385, Pb 0.129 J/g·°C (25 °C values). Block sizes use real densities, so 50 g of aluminum is much bigger than 50 g of lead.</p>'+
    '<p><b>Burning food.</b> Energy densities come from Nutrition Facts labels and USDA FoodData Central (cheese puff 160 Cal per 28 g; peanut 585, cashew 553, walnut 654, marshmallow 318, air-popped popcorn 387 Cal per 100 g). The model treats the label value as the energy released per gram burned. Real labels use Atwater factors, so bomb calorimeter values are usually 5–10% higher. About 85% of a snack burns (the rest stays as char), and a fixed share of the heat reaches the water: 28% for an open can, 45% with a draft shield. Real classroom results scatter widely around these. The water also cools slowly toward room temperature, so record the highest temperature.</p>'+
    '<p><b>Bomb calorimeter.</b> C_cal = 10.00 kJ/°C for the steel bomb, bucket and 2.000 kg of water, as found by burning benzoic acid (26.43 kJ/g). Combustion is complete and no heat escapes. Strictly, a bomb measures ΔU at constant volume; for foods the difference from ΔH is under 1%.</p>'+
    '<p><b>Particle view.</b> Speeds and vibration sizes are exaggerated: real average molecular speeds differ by only about 13% between 20 °C and 100 °C.</p>',
  initVis(sim){initParticles(sim);},
  draw(sim,ctx,vdt,k,t){ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);const m=sim.p.mode;
    if(m==='food')drawFoodLab(sim,ctx,vdt,k,t);else if(m==='bomb')drawBombLab(sim,ctx,vdt,k,t);else drawMetalLab(sim,ctx,vdt,k,t);},
  thumbSetup(sim){sim.p.metal='cu';}
};
CAL.onLevel=syncMode;
BioLab.register(CAL);
})();
