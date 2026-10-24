(function(){
'use strict';
const {clamp,lerp,rng,rr,txt,pill,atLeast,PAL,FONT,RM}=BioLab.h;
const CL=window.ChemLab;
const CS=4.18;           // J/g·°C, solution treated like water
const DROP=1.5;          // s: the salt (or the base) goes in
const DH_NEUT=-57.1;     // kJ per mol of water formed, strong acid + strong base
/* ΔH_soln (kJ/mol, 25 °C, dilute, anhydrous salts) and solubility (g per 100 g water at 0, 20, 40, 60, 80, 100 °C) from CRC Handbook values.
   price = illustrative cost per 100 g of reagent-grade salt, for the design challenge. */
const SALTS={
  nh4no3:{f:'NH4NO3',n:'ammonium nitrate',M:80.04,dH:25.69,sol:[118,192,297,421,580,871],cat:['NH4',1],an:['NO3',-1],ratio:[1,1],price:2.5,lvl:'bio'},
  nh4cl:{f:'NH4Cl',n:'ammonium chloride',M:53.49,dH:14.78,sol:[29.4,37.2,45.8,55.3,65.6,77.3],cat:['NH4',1],an:['Cl',-1],ratio:[1,1],price:1.6,lvl:'bio'},
  cacl2:{f:'CaCl2',n:'calcium chloride',M:110.98,dH:-81.3,sol:[59.5,74.5,128,137,147,159],cat:['Ca',2],an:['Cl',-1],ratio:[1,2],price:0.8,lvl:'bio'},
  nacl:{f:'NaCl',n:'sodium chloride',M:58.44,dH:3.88,sol:[35.7,35.9,36.4,37.1,38.0,39.2],cat:['Na',1],an:['Cl',-1],ratio:[1,1],price:0.15,lvl:'bio'},
  kno3:{f:'KNO3',n:'potassium nitrate',M:101.10,dH:34.89,sol:[13.3,31.6,63.9,110,169,246],cat:['K',1],an:['NO3',-1],ratio:[1,1],price:2.2,lvl:'honors'},
  mgso4:{f:'MgSO4',n:'magnesium sulfate',M:120.37,dH:-91.2,sol:[22.0,33.7,44.5,54.6,55.8,50.4],cat:['Mg',2],an:['SO4',-2],ratio:[1,1],price:0.6,lvl:'honors'},
  licl:{f:'LiCl',n:'lithium chloride',M:42.39,dH:-37.0,sol:[69.2,83.5,89.8,98.4,112,128],cat:['Li',1],an:['Cl',-1],ratio:[1,1],price:7.0,lvl:'honors'},
  naac:{f:'NaC2H3O2',n:'sodium acetate',M:82.03,dH:-17.3,sol:[119,123.5,137,146,153,170],cat:['Na',1],an:['C2H3O2',-1],ratio:[1,1],price:1.8,lvl:'ap'},
  na2co3:{f:'Na2CO3',n:'sodium carbonate',M:105.99,dH:-26.7,sol:[7.0,21.5,48.8,46.4,45.1,44.7],cat:['Na',1],an:['CO3',-2],ratio:[2,1],price:0.7,lvl:'ap'}
};
const ORDER=['nh4no3','nh4cl','cacl2','nacl','kno3','mgso4','licl','naac','na2co3'];
const TARGET={cold:5,hot:45};
const sgn=(v,d)=>(v<0?'−':v>0?'+':'')+Math.abs(v).toFixed(d);
const hon=()=>atLeast('honors'),ap=()=>atLeast('ap');
const F=f=>CL.fmt(f);

/* ---------- model ---------- */
function salt(p){return SALTS[p.salt]||SALTS.nh4no3;}
function solAt(S,T){const tb=S.sol;if(T<=0)return Math.max(tb[0]*0.5,tb[0]+(tb[1]-tb[0])*T/20);if(T>=100)return tb[5];const i=Math.floor(T/20),f=(T-i*20)/20;return tb[i]+(tb[i+1]-tb[i])*f;}
function restart(sim){sim.st=sim.def.init(sim);sim.t=0;sim.hist=[];sim.lastSample=-1e9;sim.vis.P=null;sim.vis.N=null;sim.infoDirty=true;}
function packTemp(p,md){const S=salt(p),m=p.water+p.mass;return p.T0-(md/S.M)*S.dH*1000/(m*CS);}
function neutMoles(p){const nA=p.vA/1000*p.cA,nB=p.vB/1000*p.cB;return {nA,nB,n:Math.min(nA,nB)};}
function neutFinal(p){const {n}=neutMoles(p);return p.T0-n*DH_NEUT*1000/((p.vA+p.vB)*CS);}
function qSol(sim){const p=sim.p,st=sim.st;const m=p.mode==='neut'?(p.vA+p.vB):(p.water+p.mass);return m*CS*(st.T-p.T0);}

/* ---------- mode syncing ---------- */
function syncMode(sim){if(!atLeast('honors')&&sim.p.mode==='neut')BioLab.setValues(sim,{mode:'pack'});if(!sim.ui||!sim.ui.sec)return;const mode=sim.p.mode,d=sim.def;
  d.controls.forEach(c=>{if(!c.modes)return;const cid=d.id+'-'+c.id,e=document.getElementById(cid)||document.getElementById(cid+'-l');if(!e)return;const w=e.closest('.ctl');if(w)w.hidden=!atLeast(c.lvl)||!c.modes.includes(mode);});
  d.metrics.forEach(m=>{if(!m.modes)return;const t=sim.ui.tiles[m.id];if(!t)return;const w=t.num.closest('.tile');if(w)w.hidden=!atLeast(m.lvl)||!m.modes.includes(mode);});}

/* ---------- geometry ---------- */
const BENCH=400,CX=150,RIM=232,CBOT=396,HWT=92,HWB=68;
const ZX=395,ZY=240,ZR=100;
const DX=548,DW=240;            // energy diagram x range
function levelY(V){return CBOT-6-(CBOT-RIM-24)*clamp(V/260,0.1,1);}
function cupHW(y){return lerp(HWT,HWB,(y-RIM)/(CBOT-RIM));}

/* ---------- drawing helpers ---------- */
function panel(ctx,lines,k){let w=0;lines=lines.map(l=>{let s=l.s;ctx.font=(l.w||400)+' '+s*k+'px '+FONT;while(s>12&&ctx.measureText(l.t).width>740){s-=0.5;ctx.font=(l.w||400)+' '+s*k+'px '+FONT;}return Object.assign({},l,{s});});
  lines.forEach(l=>{ctx.font=(l.w||400)+' '+l.s*k+'px '+FONT;w=Math.max(w,ctx.measureText(l.t).width);});
  const lh=lines.map(l=>l.s*k*1.35),h=lh.reduce((a,b)=>a+b,0)+14;rr(ctx,12,10,Math.min(776,w+28),h,10);ctx.fillStyle=PAL['card'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
  let y=18;lines.forEach((l,i)=>{y+=lh[i];txt(ctx,l.t,26,y-lh[i]*0.28,{s:l.s*k,w:l.w||400,c:l.c||PAL['cv-ink']});});return 10+h;}
function arrowV(ctx,x,y1,y2,c,w,brk){const dir=Math.sign(y2-y1)||1,h=11;ctx.strokeStyle=c;ctx.fillStyle=c;ctx.lineWidth=w;ctx.lineCap='round';
  if(brk){const m=(y1+y2)/2;ctx.beginPath();ctx.moveTo(x,y1);ctx.lineTo(x,m-7*dir);ctx.stroke();ctx.beginPath();ctx.moveTo(x,m+7*dir);ctx.lineTo(x,y2-dir*h*0.8);ctx.stroke();
    ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x-8,m-9);ctx.lineTo(x+8,m-4);ctx.moveTo(x-8,m+4);ctx.lineTo(x+8,m+9);ctx.stroke();ctx.lineWidth=w;}
  else{ctx.beginPath();ctx.moveTo(x,y1);ctx.lineTo(x,y2-dir*h*0.8);ctx.stroke();}
  ctx.beginPath();ctx.moveTo(x,y2);ctx.lineTo(x-7,y2-dir*h);ctx.lineTo(x+7,y2-dir*h);ctx.closePath();ctx.fill();}
function drawCup(ctx,V,liquid){const ly=levelY(V);
  ctx.beginPath();ctx.moveTo(CX-cupHW(ly),ly);ctx.lineTo(CX+cupHW(ly),ly);ctx.lineTo(CX+HWB,CBOT);ctx.lineTo(CX-HWB,CBOT);ctx.closePath();ctx.fillStyle=liquid||PAL['cv-water'];ctx.fill();
  ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(CX-cupHW(ly),ly);ctx.lineTo(CX+cupHW(ly),ly);ctx.stroke();
  ['#eceae4','#dedbd2'].forEach((c,i)=>{const o=i*9;ctx.strokeStyle=c;ctx.lineWidth=7;ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(CX-HWT-o-3,RIM);ctx.lineTo(CX-HWB-o-1,CBOT);ctx.lineTo(CX+HWB+o+1,CBOT);ctx.lineTo(CX+HWT+o+3,RIM);ctx.stroke();});
  ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(CX-HWT-16,RIM-2);ctx.lineTo(CX-HWB-14,CBOT+3);ctx.lineTo(CX+HWB+14,CBOT+3);ctx.lineTo(CX+HWT+16,RIM-2);ctx.stroke();return ly;}
function drawProbe(ctx,x,yTop,yTip){ctx.strokeStyle='#5a6270';ctx.lineWidth=5;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x,yTop);ctx.lineTo(x,yTip);ctx.stroke();ctx.fillStyle='#c33';ctx.beginPath();ctx.arc(x,yTip,4,0,6.29);ctx.fill();
  ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,yTop);ctx.quadraticCurveTo(x,yTop-24,x+28,yTop-30);ctx.stroke();}
function zoomLink(ctx,sx,sy,sr){ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.5;ctx.setLineDash([4,4]);
  const dx=ZX-sx,dy=ZY-sy,d=Math.hypot(dx,dy),a=Math.atan2(dy,dx),b=Math.asin(clamp((ZR-sr)/d,-1,1));
  [1,-1].forEach(s=>{const ang=a+s*(Math.PI/2+b);ctx.beginPath();ctx.moveTo(sx+Math.cos(ang)*sr,sy+Math.sin(ang)*sr);ctx.lineTo(ZX+Math.cos(ang)*ZR,ZY+Math.sin(ang)*ZR);ctx.stroke();});
  ctx.setLineDash([]);ctx.beginPath();ctx.arc(sx,sy,sr,0,6.29);ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2;ctx.stroke();}
function water(ctx,x,y,a,toward){ // toward: +1 O points at angle a (to a cation), −1 an H points at angle a (to an anion)
  const ux=Math.cos(a),uy=Math.sin(a);if(toward>0){const bx=x-ux*6,by=y-uy*6;CL.drawAtom(ctx,bx-uy*5,by+ux*5,3.6,'H',{label:''});CL.drawAtom(ctx,bx+uy*5,by-ux*5,3.6,'H',{label:''});CL.drawAtom(ctx,x,y,6,'O',{label:''});}
  else if(toward<0){CL.drawAtom(ctx,x+ux*6,y+uy*6,3.6,'H',{label:''});const b=a+1.82;CL.drawAtom(ctx,x+Math.cos(b)*6,y+Math.sin(b)*6,3.6,'H',{label:''});CL.drawAtom(ctx,x,y,6,'O',{label:''});}
  else{CL.drawAtom(ctx,x+Math.cos(a)*6,y+Math.sin(a)*6,3.6,'H',{label:''});CL.drawAtom(ctx,x+Math.cos(a+1.82)*6,y+Math.sin(a+1.82)*6,3.6,'H',{label:''});CL.drawAtom(ctx,x,y,6,'O',{label:''});}}
const CAT_COL='#3f6fb0',AN_COL='#c0392b';

/* Pack particle view: a corner of the crystal; ions leave it and water molecules gather around them. */
function initPack(sim){const S=salt(sim.p),r=rng(11),P=[];const sp=25;
  for(let j=0;j<4;j++)for(let i=0;i<9;i++){const x=ZX-ZR+16+i*sp,y=ZY+12+j*sp;if(Math.hypot(x-ZX,y-ZY)>ZR-13)continue;
    const s=(i+j)%3,cat=S.ratio[0]===S.ratio[1]?(i+j)%2===0:S.ratio[1]>S.ratio[0]?s===0:s!==0;
    P.push({x0:x,y0:y,x,y,cat,a:r()*6.283,vx:0,vy:0,free:false,spin:r()*6.283});}
  P.sort((a,b)=>a.y0-b.y0||Math.abs(a.x0-ZX)-Math.abs(b.x0-ZX));
  const W=[];for(let i=0;i<9;i++){let x,y;do{x=ZX+(r()*2-1)*ZR;y=ZY-ZR+r()*(ZR+6);}while(Math.hypot(x-ZX,y-ZY)>ZR-12);const a=r()*6.283;W.push({x,y,dx:Math.cos(a),dy:Math.sin(a),rot:r()*6.283});}
  sim.vis.P=P;sim.vis.W=W;sim.vis.key=sim.p.salt;}
function drawPackZoom(sim,ctx,vdt,k,t){const p=sim.p,st=sim.st,S=salt(p);if(!sim.vis.P||sim.vis.key!==p.salt)initPack(sim);const P=sim.vis.P,W=sim.vis.W;
  const f=sim.t<DROP?0:clamp(st.md/Math.max(1e-9,p.mass),0,1),nFree=Math.round(P.length*f);
  ctx.save();ctx.beginPath();ctx.arc(ZX,ZY,ZR,0,6.29);ctx.fillStyle=PAL['cv-water'];ctx.fill();ctx.clip();
  const sp=RM?0:30*Math.pow((st.T+273.15)/295,3);
  W.forEach(m=>{if(vdt>0&&!RM){m.x+=m.dx*sp*vdt;m.y+=m.dy*sp*vdt;m.rot+=vdt*1.5;}const dx=m.x-ZX,dy=m.y-ZY,d=Math.hypot(dx,dy);if(d>ZR-12){const nx=dx/d,ny=dy/d,dot=m.dx*nx+m.dy*ny;if(dot>0){m.dx-=2*dot*nx;m.dy-=2*dot*ny;}m.x=ZX+nx*(ZR-12);m.y=ZY+ny*(ZR-12);}
    if(m.y>ZY+2&&nFree<P.length){m.y=ZY+2;if(m.dy>0)m.dy=-m.dy;}water(ctx,m.x,m.y,m.rot,0);});
  P.forEach((q,i)=>{const free=i<nFree;if(free&&!q.free){q.free=true;q.vx=(Math.random()-0.5)*30;q.vy=-20-Math.random()*20;}if(!free&&q.free){q.free=false;q.x=q.x0;q.y=q.y0;}
    if(q.free){if(vdt>0&&!RM){q.vx+=(Math.random()-0.5)*60*vdt;q.vy+=(Math.random()-0.5)*60*vdt;const v=Math.hypot(q.vx,q.vy),vm=24;if(v>vm){q.vx*=vm/v;q.vy*=vm/v;}q.x+=q.vx*vdt;q.y+=q.vy*vdt;q.spin+=vdt*0.8;}
      const dx=q.x-ZX,dy=q.y-ZY,d=Math.hypot(dx,dy);if(d>ZR-22){const nx=dx/d,ny=dy/d;q.x=ZX+nx*(ZR-22);q.y=ZY+ny*(ZR-22);q.vx-=nx*20;q.vy-=ny*20;}
      if(q.y>ZY-2&&nFree<P.length-2){q.y=ZY-2;q.vy=-Math.abs(q.vy);}
      // hydration shell
      for(let w=0;w<4;w++){const a=q.spin+w*1.571,R=(q.cat?10:12)+11;water(ctx,q.x+Math.cos(a)*R,q.y+Math.sin(a)*R,a+Math.PI,q.cat?1:-1);}}
    else{const A=RM?0:0.6+1.6*clamp((st.T+10)/60,0,1);q.x=q.x0+Math.sin(t*17+i)*A;q.y=q.y0+Math.cos(t*21+i*1.3)*A;}
    CL.drawAtom(ctx,q.x,q.y,q.cat?10:12,'',{color:q.cat?CAT_COL:AN_COL,label:q.cat?'+':'−',s:13});});
  ctx.restore();ctx.beginPath();ctx.arc(ZX,ZY,ZR,0,6.29);ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2.5;ctx.stroke();
  if(!st.limit)txt(ctx,'Particle view',ZX,ZY-ZR-12,{s:13*k,w:700,a:'center',c:PAL['cv-soft']});
  legend2(ctx,k,[[CAT_COL,CL.fmt(S.cat[0],S.cat[1])],[AN_COL,CL.fmt(S.an[0],S.an[1])]]);}
function legend2(ctx,k,items){ctx.font='700 '+13*k+'px '+FONT;const gap=18*k;let w=0;items.forEach(it=>w+=ctx.measureText(it[1]).width+16*k);w+=gap*(items.length-1);let x=clamp(ZX-w/2,264,790-w);const y=ZY+ZR+20*k;
  items.forEach(it=>{ctx.fillStyle=it[0];ctx.beginPath();ctx.arc(x+6*k,y,6*k,0,6.29);ctx.fill();txt(ctx,it[1],x+16*k,y,{s:13*k,w:700,b:'middle'});x+=ctx.measureText(it[1]).width+16*k+gap;});}

/* Neutralization particle view: H₃O⁺ and OH⁻ meet and become water; Na⁺ and Cl⁻ just watch. */
function initNeut(sim){const p=sim.p,r=rng(5),{nA,nB}=neutMoles(p),mx=Math.max(nA,nB),nH=Math.max(1,Math.round(7*nA/mx)),nO=Math.max(1,Math.round(7*nB/mx));
  const spot=()=>{let x,y;do{x=ZX+(r()*2-1)*ZR;y=ZY+(r()*2-1)*ZR;}while(Math.hypot(x-ZX,y-ZY)>ZR-16);return [x,y];};
  const mk=(type,i)=>{const s=spot(),a=r()*6.283;return {type,x:s[0],y:s[1],dx:Math.cos(a),dy:Math.sin(a),i,rot:r()*6.283,gone:false};};
  const N=[];for(let i=0;i<nH;i++){N.push(mk('H',i));N.push(mk('Cl',i));}for(let i=0;i<nO;i++){N.push(mk('OH',i));N.push(mk('Na',i));}for(let i=0;i<5;i++)N.push(mk('w',i));
  sim.vis.N=N;sim.vis.nH=nH;sim.vis.nO=nO;sim.vis.done=0;sim.vis.fl=[];sim.vis.nkey=[p.vA,p.vB,p.cA,p.cB].join();}
function drawNeutZoom(sim,ctx,vdt,k,t){const p=sim.p,st=sim.st;if(!sim.vis.N||sim.vis.nkey!==[p.vA,p.vB,p.cA,p.cB].join())initNeut(sim);const v=sim.vis,N=v.N,mixed=sim.t>=DROP;
  const pairs=Math.min(v.nH,v.nO),want=mixed?Math.round(pairs*st.e):0;
  while(v.done<want){const h=N.find(q=>q.type==='H'&&!q.gone),o=N.find(q=>q.type==='OH'&&!q.gone);if(!h||!o)break;h.gone=o.gone=true;const mx=(h.x+o.x)/2,my=(h.y+o.y)/2;
    N.push({type:'w',x:mx-9,y:my,dx:-0.7,dy:0.7,rot:0,new:1});N.push({type:'w',x:mx+9,y:my,dx:0.7,dy:-0.7,rot:2,new:1});v.fl.push({x:mx,y:my,a:1});v.done++;}
  ctx.save();ctx.beginPath();ctx.arc(ZX,ZY,ZR,0,6.29);ctx.fillStyle=PAL['cv-water'];ctx.fill();ctx.clip();const sp=RM?0:26*Math.pow((st.T+273.15)/295,3);
  N.forEach(q=>{if(q.gone)return;if(!mixed&&(q.type==='OH'||q.type==='Na'))return;if(vdt>0&&!RM){q.x+=q.dx*sp*vdt;q.y+=q.dy*sp*vdt;q.rot+=vdt;}
    const dx=q.x-ZX,dy=q.y-ZY,d=Math.hypot(dx,dy);if(d>ZR-14){const nx=dx/d,ny=dy/d,dot=q.dx*nx+q.dy*ny;if(dot>0){q.dx-=2*dot*nx;q.dy-=2*dot*ny;}q.x=ZX+nx*(ZR-14);q.y=ZY+ny*(ZR-14);}
    if(q.type==='w'){water(ctx,q.x,q.y,q.rot,0);if(q.new&&q.new>0){q.new-=vdt*0.5;ctx.strokeStyle=PAL['s3'];ctx.lineWidth=2;ctx.globalAlpha=clamp(q.new,0,1);ctx.beginPath();ctx.arc(q.x,q.y,13,0,6.29);ctx.stroke();ctx.globalAlpha=1;}}
    else if(q.type==='H')CL.drawAtom(ctx,q.x,q.y,11,'',{color:'#c2185b',label:'+',s:13});
    else if(q.type==='OH')CL.drawAtom(ctx,q.x,q.y,11,'',{color:'#3949ab',label:'−',s:13});
    else CL.drawAtom(ctx,q.x,q.y,7,'',{color:'#8a8f98',label:''});});
  v.fl=v.fl.filter(f=>{f.a-=vdt*0.8;if(f.a<=0)return false;ctx.globalAlpha=f.a;ctx.fillStyle=PAL['s4'];ctx.beginPath();ctx.arc(f.x,f.y,8+(1-f.a)*20,0,6.29);ctx.fill();ctx.globalAlpha=1;return true;});
  ctx.restore();ctx.beginPath();ctx.arc(ZX,ZY,ZR,0,6.29);ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2.5;ctx.stroke();
  txt(ctx,'Particle view',ZX,ZY-ZR-12,{s:13*k,w:700,a:'center',c:PAL['cv-soft']});
  legend2(ctx,k,[['#c2185b','H₃O⁺'],['#3949ab','OH⁻'],['#8a8f98','Na⁺, Cl⁻']]);}

/* Energy diagram on the right */
function drawDiagram(sim,ctx,k){const p=sim.p,hn=hon(),SC=1.6;
  ctx.save();ctx.translate(DX-4,262);ctx.rotate(-Math.PI/2);txt(ctx,'Energy',0,0,{s:13*k,w:700,a:'center',c:PAL['cv-soft']});ctx.restore();arrowV(ctx,DX+10,384,128,PAL['cv-soft'],1.5,false);
  const lev=(x1,x2,y,c)=>{ctx.strokeStyle=c||PAL['cv-ink'];ctx.lineWidth=4;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x1,y);ctx.lineTo(x2,y);ctx.stroke();};
  if(p.mode==='neut'){const y0=190,y1=y0-DH_NEUT*SC;lev(DX+30,DX+130,y0);lev(DX+140,DX+236,y1);arrowV(ctx,DX+135,y0,y1,PAL['s2'],4,false);
    txt(ctx,'H₃O⁺ + OH⁻',DX+80,y0-14,{s:13*k,w:700,a:'center'});txt(ctx,'2 H₂O',DX+188,y1+22*k,{s:13*k,w:700,a:'center'});
    txt(ctx,'heat out',DX+142,(y0+y1)/2,{s:12*k,w:700,c:PAL['s2'],b:'middle'});
    if(hn)pill(ctx,'ΔH = '+sgn(DH_NEUT,1)+' kJ/mol',DX+DW/2,88,PAL['s1'],'#fff',12.5*k);return;}
  const S=salt(p),endo=S.dH>0,yT=152,yB=endo?336:214,yF=yB-S.dH*SC,xs=DX+22,xa=DX+96,xd=DX+170;
  lev(xs,xa-4,yB);lev(xa+2,xd-2,yT);lev(xd+4,DX+238,yF,endo?PAL['s2']:PAL['s1']);
  arrowV(ctx,xa,yB,yT,PAL['s1'],4,true);arrowV(ctx,xd,yT,yF,PAL['s2'],4,true);
  ctx.setLineDash([4,4]);ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(xa,yB);ctx.lineTo(DX+238,yB);ctx.stroke();ctx.setLineDash([]);
  txt(ctx,'solid',(xs+xa)/2,yB+20*k,{s:12*k,w:700,a:'center'});txt(ctx,'ions apart',(xa+xd)/2,yT-12,{s:12*k,w:700,a:'center'});
  txt(ctx,'dissolved',DX+238,yF+20*k,{s:12*k,w:700,a:'right'});
  txt(ctx,'in',xa-10,(yB+yT)/2+18,{s:12*k,w:700,c:PAL['s1'],a:'right',b:'middle'});txt(ctx,'out',xd+10,(yT+Math.min(yF,yB))/2+18,{s:12*k,w:700,c:PAL['s2'],b:'middle'});
  const lab=hn?'ΔH_soln = '+sgn(S.dH,1)+' kJ/mol':(endo?'Endothermic: net energy in':'Exothermic: net energy out');
  pill(ctx,lab,DX+DW/2,88,endo?PAL['s2']:PAL['s1'],'#fff',12.5*k);}

function drawPack(sim,ctx,vdt,k,t){const p=sim.p,st=sim.st,S=salt(p),hn=hon(),n=p.mass/S.M;
  const L=[{t:p.mass.toFixed(1)+' g '+F(S.f)+' into '+p.water.toFixed(0)+' mL water at '+p.T0.toFixed(1)+' °C',s:14,w:700}];
  const q=qSol(sim);
  if(!hn)L.push({t:sim.t<DROP?'Watch the thermometer when the salt goes in.':'The solution is now '+st.T.toFixed(1)+' °C: it got '+(st.T<p.T0-0.05?'colder.':st.T>p.T0+0.05?'warmer.':'no warmer or colder.'),s:13,c:PAL['cv-soft']});
  else{L.push({t:'q_solution = '+(p.water+p.mass).toFixed(1)+' g × 4.18 J/g·°C × '+sgn(st.T-p.T0,1)+' °C = '+sgn(q,0)+' J',s:13,c:PAL['cv-soft']});
    const nd=st.md/S.M;L.push({t:nd>1e-4?'ΔH_soln = −q / n = '+sgn(-q,0)+' J / '+nd.toFixed(4)+' mol = '+sgn(-q/nd/1000,1)+' kJ/mol':'ΔH_soln = −q_solution / moles dissolved',s:13,c:PAL['cv-soft']});}
  const ly=drawCup(ctx,p.water+p.mass*0.5);
  // salt: falls from a weighing boat, then sits as a pile that shrinks
  const solid=p.mass-st.md;
  if(sim.t<DROP){const f=clamp((sim.t-(DROP-0.8))/0.8,0,1);ctx.save();ctx.translate(CX-20,170);ctx.rotate(-f*0.9);ctx.fillStyle='#c9ced6';ctx.beginPath();ctx.moveTo(-34,0);ctx.lineTo(34,0);ctx.lineTo(22,14);ctx.lineTo(-22,14);ctx.closePath();ctx.fill();
    ctx.fillStyle='#f4f4f2';ctx.beginPath();ctx.ellipse(0,0,24,6+Math.cbrt(p.mass)*1.5,0,Math.PI,0);ctx.fill();ctx.restore();
    if(f>0.3){const r=rng(3);ctx.fillStyle='#f4f4f2';ctx.strokeStyle='#9aa1aa';for(let i=0;i<12;i++){const yy=180+((t*260+i*37)%(CBOT-190));ctx.fillRect(CX-30+r()*24,yy,4,4);}}}
  else if(solid>0.005){const w=12+20*Math.cbrt(solid),h=4+6*Math.cbrt(solid);ctx.fillStyle='#f4f4f2';ctx.strokeStyle='#9aa1aa';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(CX-w,CBOT-4);ctx.quadraticCurveTo(CX,CBOT-4-h*2,CX+w,CBOT-4);ctx.closePath();ctx.fill();ctx.stroke();
    const r=rng(9);ctx.fillStyle='#ffffff';for(let i=0;i<Math.min(14,4+solid*2);i++){ctx.fillRect(CX-w*0.7+r()*w*1.4,CBOT-6-r()*h,3,3);}}
  // stirring rod
  if(p.stir){const a=RM?0:Math.sin(t*4)*10;ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=4;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(CX+30+a,RIM-40);ctx.lineTo(CX+10+a*0.4,CBOT-14);ctx.stroke();}
  drawProbe(ctx,CX-44,RIM-16,CBOT-30);
  ctx.fillStyle=PAL['cv-bench'];ctx.fillRect(0,BENCH,800,50);
  pill(ctx,'Solution '+st.T.toFixed(1)+' °C',CX,BENCH+25,PAL['card'],PAL['cv-ink'],13*k);
  pill(ctx,'Solid left '+Math.max(0,solid).toFixed(1)+' g',ZX,BENCH+25,PAL['card'],PAL['cv-ink'],13*k);
  zoomLink(ctx,CX,CBOT-22,15);
  drawPackZoom(sim,ctx,vdt,k,t);drawDiagram(sim,ctx,k);
  if(st.limit)pill(ctx,st.limit.split(':')[0],ZX,ZY-ZR-42,PAL['s4'],'#fff',12*k);
  panel(ctx,L.slice(0,1),k);}

function drawNeut(sim,ctx,vdt,k,t){const p=sim.p,st=sim.st,{nA,nB,n}=neutMoles(p),hn=hon();
  const L=[{t:p.vA.toFixed(0)+' mL '+p.cA.toFixed(2)+' M HCl + '+p.vB.toFixed(0)+' mL '+p.cB.toFixed(2)+' M NaOH at '+p.T0.toFixed(1)+' °C',s:14,w:700},
    {t:'H₃O⁺(aq) + OH⁻(aq) → 2 H₂O(l)    water formed: '+(n*st.e).toFixed(4)+' mol',s:13,c:PAL['cv-soft']}];
  const q=qSol(sim);if(hn)L.push({t:'q = '+(p.vA+p.vB).toFixed(1)+' g × 4.18 J/g·°C × '+sgn(st.T-p.T0,1)+' °C = '+sgn(q,0)+' J   ΔH_neut = −q / n = '+(st.e>0.02?sgn(-q/(n*st.e)/1000,1):'—')+' kJ/mol',s:13,c:PAL['cv-soft']});
  const mixed=sim.t>=DROP,V=mixed?p.vA+p.vB:p.vA;drawCup(ctx,V);
  // NaOH beaker pours in
  if(!mixed){const f=clamp((sim.t-(DROP-1.1))/1.1,0,1);ctx.save();ctx.translate(CX+70,150);ctx.rotate(-f*1.5);CL.drawBeaker(ctx,{x:-28,y:-50,w:56,h:62,fill:0.75*(1-f*0.6),ticks:false});ctx.restore();
    if(f>0.5){ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(CX+30,140);ctx.quadraticCurveTo(CX+20,200,CX+18,levelY(V));ctx.stroke();}
    txt(ctx,'NaOH',CX+70,195,{s:13*k,w:700,a:'center',c:PAL['cv-soft']});}
  if(p.stir){const a=RM?0:Math.sin(t*4)*10;ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=4;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(CX+30+a,RIM-40);ctx.lineTo(CX+10+a*0.4,CBOT-14);ctx.stroke();}
  drawProbe(ctx,CX-44,RIM-16,CBOT-30);
  ctx.fillStyle=PAL['cv-bench'];ctx.fillRect(0,BENCH,800,50);
  pill(ctx,'Solution '+st.T.toFixed(1)+' °C',CX,BENCH+25,PAL['card'],PAL['cv-ink'],13*k);
  pill(ctx,(nA<nB-1e-9?'HCl':nB<nA-1e-9?'NaOH':'Neither')+' is limiting',ZX,BENCH+25,PAL['card'],PAL['cv-ink'],13*k);
  zoomLink(ctx,CX,CBOT-30,15);drawNeutZoom(sim,ctx,vdt,k,t);drawDiagram(sim,ctx,k);panel(ctx,L.slice(0,1),k);}


const MU='<span style="color:var(--muted);font-size:14px">';
function calcHTML(sim){const p=sim.p,st=sim.st,hn=hon(),row=(a,b)=>'<p>'+a+(b?'<br>'+MU+b+'</span>':'')+'</p>';let h='<h3>Your calculation</h3>';
  if(p.mode==='neut'){const {nA,nB,n}=neutMoles(p),m=p.vA+p.vB,dT=st.T-p.T0,q=qSol(sim),nf=n*st.e;
    h+=row('<b>Moles</b>: HCl = '+(p.vA/1000).toFixed(4)+' L × '+p.cA.toFixed(2)+' M = '+nA.toFixed(4)+' mol; NaOH = '+(p.vB/1000).toFixed(4)+' L × '+p.cB.toFixed(2)+' M = '+nB.toFixed(4)+' mol',
      'H₃O⁺ + OH⁻ → 2H₂O reacts 1 : 1, so '+(nA<nB-1e-9?'HCl':nB<nA-1e-9?'NaOH':'neither')+' is limiting and '+n.toFixed(4)+' mol of water can form.');
    h+=row('<b>q<sub>solution</sub></b> = m·c·ΔT = '+m.toFixed(1)+' g × 4.18 J/g·°C × '+sgn(dT,1)+' °C = <b>'+sgn(q,0)+' J</b>','Mass of solution = total volume × 1.00 g/mL.');
    h+=row('<b>ΔH<sub>neut</sub></b> = −q ÷ n = '+sgn(-q,0)+' J ÷ '+nf.toFixed(4)+' mol = <b>'+(nf>1e-5?sgn(-q/nf/1000,1):'—')+' kJ/mol</b>','Accepted value about −57 kJ/mol for a strong acid with a strong base.');return h;}
  const S=salt(p),m=p.water+p.mass,dT=st.T-p.T0,q=qSol(sim),nd=st.md/S.M;
  if(sim.t<DROP)return h+row('The water starts at '+p.T0.toFixed(1)+' °C. Watch the thermometer as the salt dissolves.');
  if(!hn)return h+row('<b>Temperature change</b> = '+st.T.toFixed(1)+' °C − '+p.T0.toFixed(1)+' °C = <b>'+sgn(dT,1)+' °C</b>',dT<-0.05?'Negative: the water lost heat to the dissolving salt (endothermic).':dT>0.05?'Positive: the dissolving salt gave heat to the water (exothermic).':'');
  h+=row('<b>Moles dissolved</b> = '+st.md.toFixed(2)+' g ÷ '+S.M.toFixed(2)+' g/mol = <b>'+nd.toFixed(4)+' mol</b>',st.md<p.mass-0.01?(p.mass-st.md).toFixed(2)+' g is still solid and does not count.':'All of the salt has dissolved.');
  h+=row('<b>q<sub>solution</sub></b> = m·c·ΔT = '+m.toFixed(1)+' g × 4.18 J/g·°C × '+sgn(dT,1)+' °C = <b>'+sgn(q,0)+' J</b>','Mass of solution = water + salt.');
  h+=row('<b>ΔH<sub>soln</sub></b> = −q ÷ n = '+sgn(-q,0)+' J ÷ '+nd.toFixed(4)+' mol = <b>'+(nd>1e-4?sgn(-q/nd/1000,1):'—')+' kJ/mol</b>','Accepted value: '+sgn(S.dH,1)+' kJ/mol.');
  return h;}

const PACK=['pack'],NEUT=['neut'];
const CP={
  id:'coldpack',hash:'coldpack',apUnit:11,order:2,tab:'Cold packs and hot packs',kind:'Virtual lab',
  prereq:['calorimetry'],next:['enthalpy','dissolve','gibbs'],
  card:'Dissolve salts in water to design a cold pack or a hand warmer, then mix an acid and a base to measure the heat of neutralization.',
  title:'Cold packs, hot packs and heats of solution',
  lede:{bio:'Some salts make water colder when they dissolve and some make it warmer. Pick a salt, add it to water, and design a pack that gets cold enough or hot enough.',
        honors:'Measure q for the solution, find ΔH_soln in kJ/mol, and explain it with the energy to break the solid apart and the energy released when water surrounds the ions.',
        ap:'Use solubility limits, cost and ΔH_soln to design the best pack, and measure ΔH_neut from an acid–base reaction with a limiting reactant.'},
  scale:'Bench scale: a foam cup with about 100 mL of water. In the particle view each ion is about 0.1–0.3 nm across; only a tiny corner of one crystal is shown.',
  timeScale:3,dtMax:0.05,sampleDt:0.5,window:150,unit:'s',chChange:0,chReveal:110,
  controls:[
    {id:'mode',label:'Experiment',type:'seg',def:'pack',lvl:'bio',options:[{v:'pack',l:'Dissolve a salt'},{v:'neut',l:'Acid + base',lvl:'honors'}],onChange(sim){syncMode(sim);restart(sim);}},
    {id:'salt',label:'Salt',type:'select',def:'nh4no3',lvl:'bio',modes:PACK,options:ORDER.map(k=>({v:k,l:CL.fmt(SALTS[k].f)+' ('+SALTS[k].n+')',lvl:SALTS[k].lvl})),onChange:restart},
    {id:'mass',label:'Mass of salt',type:'range',min:1,max:40,step:0.5,def:10,unit:' g',lvl:'bio',modes:PACK,onChange:restart},
    {id:'water',label:'Volume of water',type:'range',min:50,max:250,step:5,def:100,unit:' mL',lvl:'bio',modes:PACK,onChange:restart,help:'1 mL of water has a mass of 1.00 g.'},
    {id:'T0',label:'Starting temperature',type:'range',min:10,max:30,step:0.5,def:22,unit:' °C',lvl:'honors',onChange:restart},
    {id:'stir',label:'Stir',type:'toggle',def:true,lvl:'honors',onChange:restart,help:'Stirring speeds up dissolving. It does not change how much heat is released or absorbed.'},
    {id:'target',label:'Design goal',type:'seg',def:'none',lvl:'honors',modes:PACK,options:[{v:'none',l:'None'},{v:'cold',l:'Cold pack: 5 °C or colder'},{v:'hot',l:'Hand warmer: 45 °C or hotter'}]},
    {id:'vA',label:'Volume of HCl',type:'range',min:25,max:100,step:5,def:50,unit:' mL',lvl:'honors',modes:NEUT,onChange:restart},
    {id:'cA',label:'Concentration of HCl',type:'range',min:0.5,max:2,step:0.1,def:1,unit:' M',d:2,lvl:'honors',modes:NEUT,onChange:restart},
    {id:'vB',label:'Volume of NaOH',type:'range',min:25,max:100,step:5,def:50,unit:' mL',lvl:'honors',modes:NEUT,onChange:restart},
    {id:'cB',label:'Concentration of NaOH',type:'range',min:0.5,max:2,step:0.1,def:1,unit:' M',d:2,lvl:'honors',modes:NEUT,onChange:restart}
  ],
  actions:[{id:'again',label:'Run the trial again',lvl:'bio',primary:true,run(sim){restart(sim);}}],
  init(sim){const p=sim.p;return {T:p.T0,md:0,e:0,Tx:p.T0,limit:'',rate:0};},
  step(sim,dt){const p=sim.p,st=sim.st;sim.infoDirty=true;if(sim.t<DROP){st.T=p.T0;st.Tx=p.T0;return;}
    if(p.mode==='neut'){st.e+=(1-st.e)*dt/(p.stir?2.5:9);const {n}=neutMoles(p);st.T=p.T0-n*st.e*DH_NEUT*1000/((p.vA+p.vB)*CS);st.Tx=Math.max(st.Tx,st.T);return;}
    const S=salt(p),solid=p.mass-st.md;if(solid<=1e-9){st.rate=0;return;}
    const conc=st.md/p.water*100,sat=solAt(S,st.T),room=1-conc/sat;
    let r=0.13*Math.pow(solid,2/3)*(p.stir?1:0.3)*Math.max(0,room);if(conc>=sat)r=0;
    const dm=Math.min(r*dt,solid);st.md+=dm;st.rate=r;let T=packTemp(p,st.md);
    st.limit='';if(T>99.5){T=99.5;st.limit='Boiling: use less salt or more water';}if(T<-15){T=-15;st.limit='Near the freezing point';}
    if(solid-dm>0.05&&room<0.02)st.limit='Saturated: the rest will not dissolve';
    st.T=T;st.Tx=S.dH>0?Math.min(st.Tx,T):Math.max(st.Tx,T);},
  metrics:[
    {id:'T',label:'Solution temperature',unit:'°C',lvl:'bio',min:-10,max:60,d:1,get:s=>s.st.T},
    {id:'dT',label:'Temperature change, ΔT',unit:'°C',lvl:'bio',min:-40,max:40,d:1,get:s=>s.st.T-s.p.T0},
    {id:'solid',label:'Salt still solid',unit:'g',lvl:'bio',min:0,max:40,d:1,modes:PACK,get:s=>s.p.mode==='pack'?Math.max(0,s.p.mass-s.st.md):NaN},
    {id:'kind',label:'This process is',unit:'',lvl:'bio',text:true,get:s=>{if(s.p.mode==='neut')return 'Exothermic: heat released';const d=salt(s.p).dH;return Math.abs(d)<5?'Barely '+(d>0?'endothermic':'exothermic'):d>0?'Endothermic: heat absorbed':'Exothermic: heat released';}},
    {id:'q',label:'q for the solution = mcΔT',unit:'J',lvl:'honors',min:-8000,max:8000,d:0,get:s=>qSol(s)},
    {id:'nd',label:'Salt dissolved',unit:'mol',lvl:'honors',min:0,max:1,d:4,modes:PACK,get:s=>s.p.mode==='pack'?s.st.md/salt(s.p).M:NaN},
    {id:'dH',label:'ΔH_soln from your data',unit:'kJ/mol',lvl:'honors',min:-100,max:40,d:1,modes:PACK,get:s=>{if(s.p.mode!=='pack')return NaN;const nd=s.st.md/salt(s.p).M;return nd>1e-4?-qSol(s)/nd/1000:NaN;}},
    {id:'cost',label:'Cost of the salt',unit:'$',lvl:'honors',min:0,max:3,d:2,modes:PACK,get:s=>s.p.mode==='pack'?s.p.mass*salt(s.p).price/100:NaN},
    {id:'goal',label:'Design check',unit:'',lvl:'honors',text:true,modes:PACK,get:s=>{const p=s.p,st=s.st;if(p.target==='none')return 'Choose a design goal';const lim=TARGET[p.target],ok=p.target==='cold'?st.Tx<=lim:st.Tx>=lim;
      return (p.target==='cold'?'Coldest ':'Hottest ')+st.Tx.toFixed(1)+' °C: '+(ok?'meets':'misses')+' the '+lim+' °C goal for $'+(p.mass*salt(p).price/100).toFixed(2);}},
    {id:'sat',label:'Solubility at this temperature',unit:'g / 100 g water',lvl:'ap',min:0,max:300,d:1,modes:PACK,get:s=>s.p.mode==='pack'?solAt(salt(s.p),s.st.T):NaN},
    {id:'nw',label:'Water formed',unit:'mol',lvl:'honors',min:0,max:0.2,d:4,modes:NEUT,get:s=>s.p.mode==='neut'?neutMoles(s.p).n*s.st.e:NaN},
    {id:'lim',label:'Limiting reactant',unit:'',lvl:'honors',text:true,modes:NEUT,get:s=>{const {nA,nB}=neutMoles(s.p);return nA<nB-1e-9?'HCl ('+nA.toFixed(4)+' mol)':nB<nA-1e-9?'NaOH ('+nB.toFixed(4)+' mol)':'Neither: '+nA.toFixed(4)+' mol each';}},
    {id:'dHn',label:'ΔH_neut from your data',unit:'kJ/mol',lvl:'honors',min:-70,max:0,d:1,modes:NEUT,get:s=>{if(s.p.mode!=='neut')return NaN;const n=neutMoles(s.p).n*s.st.e;return n>1e-5?-qSol(s)/n/1000:NaN;}}
  ],
  graphs:[{id:'T',label:'Solution temperature',lvl:'bio',lines:['T']},{id:'solid',label:'Salt still solid',lvl:'bio',lines:['solid']}],
  defaultGraph:'T',
  infoPanel:calcHTML,
  narrate(sim){const p=sim.p,st=sim.st,hn=hon();
    if(p.mode==='neut'){const {nA,nB}=neutMoles(p);if(sim.t<DROP)return 'The cup holds hydrochloric acid. Sodium hydroxide is about to be poured in.';
      return '<b>H₃O⁺ and OH⁻ ions combine to form water and release heat</b>, so the solution warms to '+st.T.toFixed(1)+' °C. Na⁺ and Cl⁻ are spectator ions and do nothing.'+(Math.abs(nA-nB)>1e-9?' '+(nA<nB?'HCl':'NaOH')+' runs out first, so the extra '+(nA<nB?'NaOH':'HCl')+' adds no heat.':'');}
    const S=salt(p),nm=F(S.f);if(sim.t<DROP)return 'You are about to add '+p.mass.toFixed(1)+' g of '+nm+' to the water. Predict: will the thermometer go up or down?';
    if(st.limit&&st.limit.startsWith('Saturated'))return '<b>The solution is saturated.</b> '+(S.dH>0?'As it cools, '+nm+' becomes less soluble, so':'The water can hold no more, so')+' '+(p.mass-st.md).toFixed(1)+' g stays solid. Only the salt that dissolves changes the temperature.';
    const endo=S.dH>0;let s=endo?'<b>Pulling the ions out of the solid takes more energy than water gives back when it surrounds them.</b> That energy comes from the water, so the solution gets colder.':'<b>Water surrounding the ions releases more energy than it takes to pull them out of the solid.</b> The extra energy warms the solution.';
    if(Math.abs(S.dH)<5)s='The energy to break up the solid and the energy released by hydration nearly cancel for '+nm+', so the temperature barely changes.';
    if(p.mass-st.md<0.01)s+=' All '+p.mass.toFixed(1)+' g has dissolved.';else if(hn)s+=' '+(p.mass-st.md).toFixed(1)+' g is still dissolving.';return s;},
  tour:[
    {title:'A salt and some water',text:'The foam cup holds 100 mL of water at room temperature. A weighing boat of ammonium nitrate, the salt inside many instant cold packs, is about to go in.',focus:[CX-HWT-30,140,2*HWT+60,BENCH-140+50],speed:0.3,setup(sim){BioLab.setValues(sim,{mode:'pack',salt:'nh4no3',mass:10,water:100});restart(sim);}},
    {title:'Ions leave the crystal',text:'In the particle view, water molecules tug ions off the surface of the crystal one at a time. Breaking the ions apart takes energy.',focus:[ZX-ZR-10,ZY-ZR-30,2*ZR+20,2*ZR+60],speed:0.5},
    {title:'Water surrounds each ion',text:'Each loose ion gets a shell of water molecules. The partly negative oxygen ends face the + ions, and the partly positive hydrogen ends face the − ions. Forming these attractions releases energy.',focus:[ZX-ZR-10,ZY-ZR-30,2*ZR+20,2*ZR+60],speed:0.5},
    {title:'Which energy is bigger?',text:{bio:'For ammonium nitrate, breaking the solid apart takes more energy than hydration gives back. The difference comes out of the water, so it gets colder: endothermic.',honors:'Both steps are hundreds of kJ/mol, so the diagram breaks the axis. For NH₄NO₃ the difference is +25.7 kJ/mol: endothermic. The energy comes from the water’s motion, so the temperature falls.'},focus:[DX-4,118,DW+8,280],speed:1},
    {title:'A hand warmer instead',text:'Switch to calcium chloride. Now hydration releases more energy than breaking the solid takes, so the extra energy heats the water: exothermic.',focus:[[DX-4,118,DW+8,280],[CX-HWT-30,200,2*HWT+60,BENCH-200+50]],speed:1,setup(sim){BioLab.setValues(sim,{salt:'cacl2'});restart(sim);}},
    {lvl:'honors',title:'From temperature to ΔH',text:'Your calculation panel below the graph shows the math: q_solution = m·c·ΔT uses the mass of the whole solution. The salt’s enthalpy change is the opposite: ΔH_soln = −q_solution ÷ moles dissolved.',focus:[DX-4,118,DW+8,280],speed:1},
    {lvl:'honors',title:'Acid meets base',text:'In the Acid + base experiment, H₃O⁺ and OH⁻ combine to make water. Every mole of water formed releases about 57 kJ, so the limiting reactant sets the heat.',focus:[ZX-ZR-10,ZY-ZR-30,2*ZR+20,2*ZR+60],speed:0.5,setup(sim){BioLab.setValues(sim,{mode:'neut'});restart(sim);}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{mode:'pack',salt:'nh4no3',mass:10,water:100});restart(sim);},
  onChallenge(sim,ch,phase){if(ch&&ch.instant&&ch.set&&phase==='done'){BioLab.setValues(sim,ch.set);restart(sim);}},
  challenges:[
    {lvl:'bio',q:'You stir 10 g of ammonium nitrate into 100 mL of water at 22 °C. What will the thermometer do?',choices:['Go up','Go down','Stay the same'],correct:1,
     baseline:{mode:'pack',salt:'nh4no3',mass:10,water:100},watch:'T',
     explain:{bio:'The temperature falls about 7 °C, to 15.0 °C. Breaking the solid apart takes energy, and that energy comes out of the water. The salt does not add “cold”; it takes heat away.'}},
    {lvl:'bio',q:'10 g of calcium chloride warms 100 mL of water by about 16 °C. What happens if you dissolve the same 10 g in 200 mL of water?',choices:['It warms by about 32 °C','It warms by about 8 °C','It warms by about 16 °C again'],correct:1,
     baseline:{mode:'pack',salt:'cacl2',mass:10,water:100},change:{water:200},changeText:'Water changed to 200 mL',watch:'T',
     explain:{bio:'The same amount of salt releases the same amount of heat. Spread over twice as much water, it raises the temperature only about half as much: about 8 °C.'}},
    {lvl:'bio',q:'Table salt is a salt too. What happens when you dissolve 10 g of NaCl in 100 mL of water?',choices:['It gets very cold, like a cold pack','It gets very hot, like a hand warmer','The temperature barely changes'],correct:2,
     baseline:{mode:'pack',salt:'nacl',mass:10,water:100},watch:'T',
     explain:{bio:'The temperature drops only about 1.4 °C. For NaCl the energy needed to break the solid apart and the energy released when water surrounds the ions almost cancel.'}},
    {lvl:'honors',instant:true,set:{mode:'pack',salt:'cacl2',mass:10,water:100},q:'Calcium chloride dissolving is exothermic. Which is larger for CaCl₂?',choices:['The energy needed to break the solid apart','The energy released when water surrounds the ions','They are exactly equal'],correct:1,
     explain:{honors:'The model is now set to CaCl₂. On the energy diagram, the “out” arrow (hydration) is longer than the “in” arrow, so the dissolved ions end up lower in energy: ΔH_soln = −81.3 kJ/mol. Small, highly charged Ca²⁺ attracts water strongly.'}},
    {lvl:'honors',q:'You add 40 g of potassium nitrate to 100 mL of water at 22 °C. KNO₃ dissolves up to 34 g per 100 g of water at 22 °C. Does it all dissolve?',choices:['Yes, all 40 g dissolves','No, but about 34 g dissolves','No, and only about half of it dissolves'],correct:2,
     baseline:{mode:'pack',salt:'kno3',mass:40,water:100},reveal:150,watch:'solid',
     explain:{honors:'Dissolving KNO₃ is endothermic, so the solution cools as it dissolves. KNO₃ is much less soluble in cold water (13 g per 100 g at 0 °C), so the solution saturates near 9 °C with only about 22 g dissolved. The rest stays solid.'}},
    {lvl:'honors',q:'50 mL of 1.0 M HCl and 50 mL of 1.0 M NaOH warm by about 6.8 °C. What if you use 100 mL of each instead?',choices:['ΔT doubles to about 13.7 °C','ΔT stays about 6.8 °C','ΔT halves'],correct:1,
     baseline:{mode:'neut',vA:50,vB:50,cA:1,cB:1},change:{vA:100,vB:100},changeText:'Both volumes doubled to 100 mL',watch:'T',
     explain:{honors:'Twice as much water forms, so twice the heat is released (5.71 kJ instead of 2.86 kJ). But it heats twice the mass of solution, so ΔT stays about 6.8 °C. Concentration, not volume, sets ΔT here.'}},
    {lvl:'ap',q:'You mix 50 mL of 1.0 M HCl with 50 mL of 2.0 M NaOH instead of 1.0 M NaOH. What happens to ΔT?',choices:['It doubles','It stays about the same','It drops to half'],correct:1,
     baseline:{mode:'neut',vA:50,vB:50,cA:1,cB:1},change:{cB:2},changeText:'NaOH changed to 2.0 M',watch:'T',
     explain:{ap:'HCl is limiting: only 0.0500 mol of H₃O⁺ is available, so only 0.0500 mol of water can form no matter how much OH⁻ is present. The heat (2.86 kJ) and the solution mass are unchanged, so ΔT stays 6.8 °C.'}},
    {lvl:'ap',instant:true,set:{mode:'pack',salt:'nh4no3',mass:8,water:100},q:'8.00 g of NH₄NO₃ (80.04 g/mol) dissolves in 100.0 g of water. The temperature falls from 22.0 °C to 16.3 °C. What is ΔH_soln? (c = 4.18 J/g·°C, mass of solution 108.0 g)',choices:['+25.7 kJ/mol','−25.7 kJ/mol','+2.57 kJ/mol','+321 kJ/mol'],correct:0,
     explain:{ap:'q_solution = 108.0 g × 4.18 × (−5.69 °C) = −2570 J. The salt absorbed that heat, so q_rxn = +2570 J. n = 8.00 ÷ 80.04 = 0.0999 mol, so ΔH_soln = +2570 J ÷ 0.0999 mol = +25.7 kJ/mol. Run the model to check: the ΔH_soln readout matches. The positive sign means endothermic.'}},
    {lvl:'ap',instant:true,set:{mode:'pack',salt:'nh4no3',mass:10,water:100},q:'Dissolving NH₄NO₃ absorbs energy, yet it dissolves on its own. Why?',choices:['The ions spread out among the water, so entropy increases enough to make ΔG negative','The water releases more energy than the salt absorbs, so it is really exothermic','It only dissolves because you stir it'],correct:0,
     explain:{ap:'ΔH_soln = +25.7 kJ/mol, but ΔS_soln = +108.7 J/mol·K. At 298 K, TΔS = 32.4 kJ/mol, so ΔG = 25.7 − 32.4 = −6.7 kJ/mol: spontaneous. The Gibbs free energy tool explores this.'}}
  ],
  lab:{bio:'<p><b>Question:</b> Which salt makes the best instant cold pack?</p><ol><li>Use 10 g of salt and 100 mL of water.</li><li>Dissolve each salt in turn: NH₄NO₃, NH₄Cl, CaCl₂ and NaCl. Record a trial when the salt has all dissolved.</li><li>Sort the salts into “gets colder” (endothermic) and “gets warmer” (exothermic).</li></ol><p>Which salt would you put in a cold pack? Which in a hand warmer? Use your temperature data to explain.</p><p style="color:var(--muted);font-size:14px">Safety: in a real lab wear goggles and gloves, and never taste chemicals. Ammonium nitrate is an oxidizer: keep it away from heat and fuels.</p>',
       honors:'<p><b>Question:</b> What is ΔH_soln for each salt, and what is the cheapest pack that meets the goal?</p><ol><li>Dissolve 10.0 g of each salt in 100 mL of water. Record q and ΔH_soln.</li><li>Set the design goal to <b>Cold pack</b>. Find the cheapest salt and mass that reach 5 °C in 100 mL of water.</li><li>Repeat for the <b>Hand warmer</b> goal (45 °C).</li><li>Switch to <b>Acid + base</b>. Mix 50 mL of 1.0 M HCl and 50 mL of 1.0 M NaOH and find ΔH_neut.</li></ol><p>Draw an energy diagram for one cold-pack salt and one hand-warmer salt. Explain the sign of ΔH_soln using lattice breaking and hydration.</p>',
       ap:'<p><b>Question:</b> How do solubility and limiting reactants cap the heat you can get? (Hot Pack Inquiry)</p><ol><li>Dissolve 10, 20, 30 and 40 g of KNO₃ in 100 mL. Record the coldest temperature and the mass left undissolved.</li><li>Repeat with NH₄NO₃. Plot ΔT against mass for both salts.</li><li>In Acid + base, hold HCl at 50 mL of 1.0 M and vary NaOH from 0.5 to 2.0 M. Plot ΔT against [NaOH].</li></ol><p><b>Claim–evidence–reasoning:</b> Explain why each graph levels off. Use the solubility readout and the limiting-reactant readout as evidence.</p>'},
  terms:[{t:'Endothermic',d:'A process that absorbs heat from its surroundings, so the surroundings (the water) get colder.'},{t:'Exothermic',d:'A process that releases heat to its surroundings, so the surroundings get warmer.'},{t:'Dissolving',d:'Ions or molecules separate from a solid and spread through the water.'},{t:'System and surroundings',d:'The system is the salt dissolving; the surroundings are the water and the cup that you measure with the thermometer.'},
    {lvl:'honors',t:'Hydration',d:'Water molecules surrounding a dissolved ion: oxygen ends face cations, hydrogen ends face anions. Forming these attractions releases energy.'},{lvl:'honors',t:'Lattice energy',d:'The energy needed to pull the ions of one mole of an ionic solid completely apart.'},{lvl:'honors',t:'Heat of solution (ΔH_soln)',d:'The enthalpy change when one mole of solute dissolves. ΔH_soln = −q_solution ÷ moles.'},{lvl:'honors',t:'Neutralization',d:'H₃O⁺(aq) + OH⁻(aq) → 2H₂O(l). For strong acids and bases ΔH ≈ −57 kJ per mole of water.'},{lvl:'honors',t:'Limiting reactant',d:'The reactant that runs out first and so sets how much product (and heat) forms.'},
    {lvl:'ap',t:'Saturated solution',d:'A solution holding as much solute as it can at that temperature. Extra solid stays undissolved.'},{lvl:'ap',t:'Spectator ions',d:'Ions such as Na⁺ and Cl⁻ that are present but do not take part in the reaction.'}],
  about:'<p><b>Dissolving.</b> The temperature comes from energy conservation: T = T₀ − n_dissolved·ΔH_soln ÷ (m_solution·4.18 J/g·°C), with m_solution = water + all the salt. The foam cup is treated as perfectly insulated, and the solution’s specific heat is taken as water’s. ΔH_soln values are standard values for the anhydrous salts at infinite dilution (NH₄NO₃ +25.7, NH₄Cl +14.8, KNO₃ +34.9, NaCl +3.9, CaCl₂ −81.3, MgSO₄ −91.2, LiCl −37.0, NaC₂H₃O₂ −17.3, Na₂CO₃ −26.7 kJ/mol). Concentrated solutions differ by a few percent. Salt dissolves at a rate that grows with the solid’s surface area and with how far the solution is from saturation; solubilities (g per 100 g water from 0 to 100 °C) follow CRC Handbook tables, so a cooling KNO₃ solution can saturate before all the salt dissolves. Costs are illustrative reagent prices per 100 g, for the design challenge only.</p>'+
    '<p><b>Energy diagram.</b> Lattice breaking and hydration are each hundreds to thousands of kJ/mol, so the diagram breaks the axis and draws only the net ΔH_soln to scale.</p>'+
    '<p><b>Neutralization.</b> Both solutions start at the same temperature, have density 1.00 g/mL and c = 4.18 J/g·°C. ΔH_neut = −57.1 kJ per mole of water formed (accepted values range from −55.8 to −57.3 kJ/mol). Mixing takes a few seconds; heat loss to the room is ignored.</p>',
  initVis(sim){sim.vis.P=null;sim.vis.N=null;},
  draw(sim,ctx,vdt,k,t){ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);if(sim.p.mode==='neut')drawNeut(sim,ctx,vdt,k,t);else drawPack(sim,ctx,vdt,k,t);},
  thumbSetup(sim){}
};
CP.onLevel=syncMode;
BioLab.register(CP);
})();
