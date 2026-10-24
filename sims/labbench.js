(function(){
'use strict';
const {clamp,rr,txt,pill,atLeast,PAL,FONT,RM,lvText}=BioLab.h;

/* ---------- small drawing helpers ---------- */
const GL=()=>PAL['cv-glass'];
function wrap(ctx,s,maxW,size,w){ctx.font=(w||400)+' '+size+'px '+FONT;const words=String(s).split(' ');const lines=[];let cur='';
  words.forEach(wd=>{const t=cur?cur+' '+wd:wd;if(ctx.measureText(t).width>maxW&&cur){lines.push(cur);cur=wd;}else cur=t;});if(cur)lines.push(cur);return lines;}
function glassStroke(ctx,lw){ctx.strokeStyle=GL();ctx.lineWidth=lw||2.4;ctx.lineJoin='round';ctx.lineCap='round';ctx.stroke();}
function glassFill(ctx){ctx.save();ctx.globalAlpha=0.35;ctx.fillStyle=PAL['cv-bg2'];ctx.fill();ctx.restore();}
function liquidIn(ctx,pathFn,level,y0,y1,col,alpha){ctx.save();pathFn();ctx.clip();ctx.globalAlpha=alpha===undefined?0.6:alpha;ctx.fillStyle=col;const ly=y1-(y1-y0)*level;ctx.fillRect(0,ly,800,y1-ly+2);ctx.restore();}
const METAL='#8b929b',METAL_D='#5f666f',PORC='#efece4',PORC_D='#a39d90',WOOD='#a8794a',WOOD_D='#7a5530';
function rod(ctx,x,y1,y2,w){const g=ctx.createLinearGradient(x-w/2,0,x+w/2,0);g.addColorStop(0,METAL_D);g.addColorStop(0.5,'#c9ced5');g.addColorStop(1,METAL_D);ctx.fillStyle=g;ctx.fillRect(x-w/2,y1,w,y2-y1);}

/* ---------- equipment drawings: each gets its rect [x,y,w,h] ---------- */
const DRAW={
  goggles(ctx,[x,y,w,h]){ctx.strokeStyle='#3d4650';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(x+2,y+h*0.45);ctx.quadraticCurveTo(x+w/2,y-4,x+w-2,y+h*0.45);ctx.stroke();
    [[x+w*0.28],[x+w*0.72]].forEach(([cx])=>{ctx.beginPath();ctx.ellipse(cx,y+h*0.6,w*0.22,h*0.36,0,0,6.29);ctx.fillStyle='rgba(120,190,235,.55)';ctx.fill();ctx.lineWidth=4;ctx.strokeStyle='#2f5f86';ctx.stroke();});
    ctx.fillStyle='#2f5f86';ctx.fillRect(x+w*0.46,y+h*0.5,w*0.08,h*0.14);},
  watch(ctx,[x,y,w,h]){ctx.beginPath();ctx.moveTo(x,y+2);ctx.quadraticCurveTo(x+w/2,y+h*1.6,x+w,y+2);ctx.quadraticCurveTo(x+w/2,y+h*0.9,x,y+2);ctx.closePath();glassFill(ctx);glassStroke(ctx,2.2);},
  evap(ctx,[x,y,w,h]){ctx.beginPath();ctx.moveTo(x,y+4);ctx.lineTo(x+w,y+4);ctx.quadraticCurveTo(x+w-4,y+h,x+w/2,y+h);ctx.quadraticCurveTo(x+4,y+h,x,y+4);ctx.closePath();ctx.fillStyle=PORC;ctx.fill();ctx.strokeStyle=PORC_D;ctx.lineWidth=2;ctx.stroke();
    ctx.beginPath();ctx.ellipse(x+w/2,y+4,w/2,4,0,0,6.29);ctx.fillStyle='#d9d4c8';ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(x-4,y+2);ctx.lineTo(x+6,y+5);ctx.stroke();},
  crucible(ctx,[x,y,w,h]){const top=y+12,bw=w*0.6;ctx.beginPath();ctx.moveTo(x,top);ctx.lineTo(x+w,top);ctx.lineTo(x+w/2+bw/2,y+h);ctx.lineTo(x+w/2-bw/2,y+h);ctx.closePath();ctx.fillStyle=PORC;ctx.fill();ctx.strokeStyle=PORC_D;ctx.lineWidth=2;ctx.stroke();
    ctx.save();ctx.translate(x+w/2,top-3);ctx.rotate(-0.12);ctx.beginPath();ctx.ellipse(0,0,w/2+3,5,0,0,6.29);ctx.fillStyle='#e2ded3';ctx.fill();ctx.stroke();rr(ctx,-5,-11,10,7,3);ctx.fillStyle=PORC;ctx.fill();ctx.stroke();ctx.restore();},
  tongs(ctx,[x,y,w,h]){ctx.strokeStyle=METAL_D;ctx.lineWidth=4;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x+2,y+h-4);ctx.quadraticCurveTo(x+w*0.55,y+h*0.35,x+w-4,y+4);ctx.moveTo(x+2,y+h-12);ctx.quadraticCurveTo(x+w*0.5,y+h*0.6,x+w-6,y+h*0.5);ctx.stroke();
    ctx.fillStyle=METAL;ctx.beginPath();ctx.arc(x+w*0.42,y+h*0.6,4,0,6.29);ctx.fill();ctx.lineWidth=3;ctx.strokeStyle=METAL;ctx.beginPath();ctx.arc(x+w-6,y+h*0.3,8,-1.2,1.4);ctx.stroke();},
  funnel(ctx,[x,y,w,h]){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+w,y);ctx.lineTo(x+w/2+5,y+h*0.55);ctx.lineTo(x+w/2+4,y+h);ctx.lineTo(x+w/2-4,y+h);ctx.lineTo(x+w/2-5,y+h*0.55);ctx.closePath();glassFill(ctx);glassStroke(ctx);
    ctx.beginPath();ctx.ellipse(x+w/2,y,w/2,4,0,0,6.29);glassStroke(ctx,1.8);},
  holder(ctx,[x,y,w,h]){ctx.fillStyle=WOOD;rr(ctx,x,y+h*0.45,w*0.62,h*0.3,4);ctx.fill();ctx.strokeStyle=WOOD_D;ctx.lineWidth=1.5;ctx.stroke();
    ctx.strokeStyle=METAL_D;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x+w*0.6,y+h*0.5);ctx.lineTo(x+w-4,y+h*0.25);ctx.moveTo(x+w*0.6,y+h*0.7);ctx.lineTo(x+w-4,y+h*0.9);ctx.stroke();
    ctx.beginPath();ctx.arc(x+w-6,y+h*0.57,h*0.33,-1.4,1.4);ctx.stroke();},
  stand(ctx,[x,y,w,h]){ctx.fillStyle='#4b525b';rr(ctx,x-8,y+h-10,96,12,3);ctx.fill();rod(ctx,x+20,y,y+h-8,8);},
  stand2(ctx,[x,y,w,h]){ctx.fillStyle='#4b525b';rr(ctx,x-10,y+h-10,108,12,3);ctx.fill();rod(ctx,x+20,y,y+h-8,8);},
  ring(ctx,[x,y,w,h]){ctx.fillStyle=METAL_D;rr(ctx,x-6,y+h/2-6,14,12,2);ctx.fill();ctx.strokeStyle=METAL_D;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(x+6,y+h/2);ctx.lineTo(x+18,y+h/2);ctx.stroke();
    ctx.lineWidth=4;ctx.strokeStyle=METAL;ctx.beginPath();ctx.ellipse(x+18+(w-18)/2,y+h/2,(w-18)/2,h*0.32,0,0,6.29);ctx.stroke();},
  gauze(ctx,[x,y,w,h]){ctx.beginPath();ctx.moveTo(x+10,y);ctx.lineTo(x+w,y);ctx.lineTo(x+w-10,y+h);ctx.lineTo(x,y+h);ctx.closePath();ctx.fillStyle='rgba(130,138,146,.55)';ctx.fill();ctx.strokeStyle=METAL_D;ctx.lineWidth=1.5;ctx.stroke();
    ctx.save();ctx.clip();ctx.strokeStyle='rgba(70,76,84,.6)';ctx.lineWidth=1;for(let i=0;i<w;i+=6){ctx.beginPath();ctx.moveTo(x+i,y);ctx.lineTo(x+i-10,y+h);ctx.stroke();}ctx.restore();
    ctx.beginPath();ctx.ellipse(x+w/2,y+h/2,w*0.22,h*0.38,0,0,6.29);ctx.fillStyle='#e8e4dc';ctx.fill();},
  burner(ctx,[x,y,w,h],t){const cx=x+w/2,base=y+h;ctx.fillStyle='#4b525b';rr(ctx,x+4,base-12,w-8,12,4);ctx.fill();
    const g=ctx.createLinearGradient(cx-7,0,cx+7,0);g.addColorStop(0,'#7a6a3a');g.addColorStop(0.5,'#d9c27a');g.addColorStop(1,'#7a6a3a');ctx.fillStyle=g;ctx.fillRect(cx-7,y+40,14,h-52);
    ctx.fillStyle='#8c7a44';ctx.fillRect(cx-9,base-34,18,8);ctx.strokeStyle='#5e6a3a';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(cx+8,base-8);ctx.quadraticCurveTo(cx+30,base-4,x+w+8,base-2);ctx.stroke();
    const fl=RM?0:Math.sin(t*9)*2;ctx.beginPath();ctx.moveTo(cx-7,y+40);ctx.quadraticCurveTo(cx-9,y+18,cx,y+2+fl);ctx.quadraticCurveTo(cx+9,y+18,cx+7,y+40);ctx.closePath();ctx.fillStyle='rgba(90,150,255,.45)';ctx.fill();
    ctx.beginPath();ctx.moveTo(cx-5,y+40);ctx.quadraticCurveTo(cx-5,y+28,cx,y+20+fl*0.5);ctx.quadraticCurveTo(cx+5,y+28,cx+5,y+40);ctx.closePath();ctx.fillStyle='rgba(40,90,230,.75)';ctx.fill();},
  beaker(ctx,[x,y,w,h]){const p=()=>{ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+2,y+h-6);ctx.quadraticCurveTo(x+2,y+h,x+8,y+h);ctx.lineTo(x+w-8,y+h);ctx.quadraticCurveTo(x+w-2,y+h,x+w-2,y+h-6);ctx.lineTo(x+w,y);};
    p();ctx.closePath();glassFill(ctx);liquidIn(ctx,()=>{p();ctx.closePath();},0.45,y,y+h,'#3d86d6',0.5);p();glassStroke(ctx);ctx.beginPath();ctx.moveTo(x-6,y-3);ctx.lineTo(x,y);glassStroke(ctx);
    ctx.lineWidth=1.5;for(let i=1;i<=3;i++){const ty=y+h-h*0.24*i;ctx.beginPath();ctx.moveTo(x+6,ty);ctx.lineTo(x+16,ty);ctx.stroke();}},
  erlen(ctx,[x,y,w,h]){const nw=w*0.28,nh=h*0.28,cx=x+w/2;const p=()=>{ctx.beginPath();ctx.moveTo(cx-nw/2,y);ctx.lineTo(cx-nw/2,y+nh);ctx.lineTo(x,y+h-5);ctx.quadraticCurveTo(x,y+h,x+6,y+h);ctx.lineTo(x+w-6,y+h);ctx.quadraticCurveTo(x+w,y+h,x+w,y+h-5);ctx.lineTo(cx+nw/2,y+nh);ctx.lineTo(cx+nw/2,y);};
    p();ctx.closePath();glassFill(ctx);liquidIn(ctx,()=>{p();ctx.closePath();},0.35,y,y+h,'#e0679a',0.55);p();glassStroke(ctx);ctx.beginPath();ctx.ellipse(cx,y,nw/2+2,3,0,0,6.29);glassStroke(ctx,1.8);},
  gradcyl(ctx,[x,y,w,h]){const by=y+h-8;ctx.beginPath();ctx.moveTo(x-8,y+h);ctx.lineTo(x+w+8,y+h);ctx.lineTo(x+w+2,by);ctx.lineTo(x-2,by);ctx.closePath();ctx.fillStyle=GL();ctx.globalAlpha=0.7;ctx.fill();ctx.globalAlpha=1;
    const p=()=>{ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,by);ctx.lineTo(x+w,by);ctx.lineTo(x+w,y);};p();ctx.closePath();glassFill(ctx);liquidIn(ctx,()=>{p();ctx.closePath();},0.62,y+8,by,PAL['cv-water'],0.9);
    p();glassStroke(ctx);ctx.beginPath();ctx.moveTo(x-5,y-3);ctx.lineTo(x,y);glassStroke(ctx);ctx.strokeStyle=GL();ctx.lineWidth=1;
    for(let i=0;i<=20;i++){const ty=by-6-(by-y-18)*i/20;ctx.beginPath();ctx.moveTo(x+w-(i%5?7:14),ty);ctx.lineTo(x+w,ty);ctx.stroke();}},
  volflask(ctx,[x,y,w,h]){const cx=x+w/2,R=w/2,bulbY=y+h-R,nw=10;const p=()=>{ctx.beginPath();ctx.moveTo(cx-nw/2,y+10);ctx.lineTo(cx-nw/2,bulbY-R*0.86);ctx.arc(cx,bulbY,R,-Math.PI/2-0.32,Math.PI*1.5+0.32,true);ctx.lineTo(cx+nw/2,y+10);};
    p();glassFill(ctx);liquidIn(ctx,()=>{p();},0.66,y+10,y+h,'#5bbf7a',0.45);p();glassStroke(ctx);ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=1.5;const ly=y+h*0.3;ctx.beginPath();ctx.ellipse(cx,ly,nw/2+1,2,0,0,6.29);ctx.stroke();
    ctx.fillStyle='#d8dde3';rr(ctx,cx-7,y,14,12,3);ctx.fill();ctx.strokeStyle=METAL_D;ctx.lineWidth=1;ctx.stroke();},
  tuberack(ctx,[x,y,w,h]){const cols=['#f0b429','#3d86d6','#e0679a',null];ctx.fillStyle=WOOD;ctx.fillRect(x,y+h*0.32,w,8);ctx.fillRect(x,y+h-8,w,8);ctx.fillRect(x+2,y+h*0.32,6,h*0.68);ctx.fillRect(x+w-8,y+h*0.32,6,h*0.68);
    for(let i=0;i<4;i++){const tx=x+12+i*((w-24)/3.3),tw=11;const p=()=>{ctx.beginPath();ctx.moveTo(tx,y);ctx.lineTo(tx,y+h-16);ctx.arc(tx+tw/2,y+h-16,tw/2,Math.PI,0,true);ctx.lineTo(tx+tw,y);};
      p();glassFill(ctx);if(cols[i])liquidIn(ctx,()=>{p();},0.32,y,y+h-10,cols[i],0.7);p();glassStroke(ctx,1.8);}
    ctx.fillStyle=WOOD_D;ctx.fillRect(x,y+h*0.32,w,3);},
  buret(ctx,[x,y,w,h]){const cx=x+w/2,tw=12,sy=y+h-44;const p=()=>{ctx.beginPath();ctx.moveTo(cx-tw/2,y);ctx.lineTo(cx-tw/2,sy);ctx.lineTo(cx+tw/2,sy);ctx.lineTo(cx+tw/2,y);};
    p();glassFill(ctx);liquidIn(ctx,()=>{p();ctx.closePath();},0.86,y,sy,PAL['cv-water'],0.9);p();glassStroke(ctx,2);ctx.strokeStyle=GL();ctx.lineWidth=1;
    for(let i=0;i<=25;i++){const ty=y+8+(sy-y-14)*i/25;ctx.beginPath();ctx.moveTo(cx-tw/2,ty);ctx.lineTo(cx-tw/2+(i%5?4:8),ty);ctx.stroke();}
    ctx.fillStyle=GL();ctx.fillRect(cx-4,sy,8,14);ctx.fillStyle='#2c6db0';rr(ctx,cx-15,sy+4,30,7,3);ctx.fill();ctx.beginPath();ctx.moveTo(cx-3,sy+14);ctx.lineTo(cx-1,y+h);ctx.lineTo(cx+1,y+h);ctx.lineTo(cx+3,sy+14);ctx.closePath();ctx.fillStyle=GL();ctx.fill();},
  clamp(ctx,[x,y,w,h]){ctx.fillStyle=METAL_D;rr(ctx,x,y+h/2-7,16,14,3);ctx.fill();ctx.strokeStyle=METAL;ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(x+14,y+h/2);ctx.lineTo(x+w-22,y+h/2);ctx.stroke();
    ctx.lineWidth=3;ctx.beginPath();ctx.arc(x+w-12,y+h/2,11,0,6.29);ctx.stroke();ctx.fillStyle='#c0392b';ctx.beginPath();ctx.arc(x+w-27,y+h/2,4,0,6.29);ctx.fill();},
  balance(ctx,[x,y,w,h],t,sim){ctx.fillStyle='#59616b';rr(ctx,x,y+h*0.35,w,h*0.65,7);ctx.fill();ctx.fillStyle='#3c434b';rr(ctx,x+4,y+h*0.35,w-8,8,3);ctx.fill();
    ctx.fillStyle='#b8bec6';ctx.beginPath();ctx.ellipse(x+w/2,y+h*0.3,w*0.42,7,0,0,6.29);ctx.fill();ctx.fillStyle='#9aa1a9';ctx.fillRect(x+w/2-4,y+h*0.3,8,h*0.08);
    ctx.fillStyle='#1d2b24';rr(ctx,x+8,y+h*0.55,w-16,h*0.3,3);ctx.fill();txt(ctx,'0.00 g',x+w/2,y+h*0.71,{s:13,w:700,c:'#8ff0a4',a:'center',b:'middle'});},
  wash(ctx,[x,y,w,h]){const by=y+h*0.32;ctx.fillStyle='#eef2f4';rr(ctx,x,by,w,h-h*0.32,10);ctx.fill();ctx.strokeStyle='#8d99a3';ctx.lineWidth=1.5;ctx.stroke();
    ctx.fillStyle='#e9eef1';rr(ctx,x+w*0.3,by-10,w*0.4,12,3);ctx.fill();ctx.stroke();ctx.strokeStyle='#8d99a3';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x+w/2,by-10);ctx.lineTo(x+w/2,y+6);ctx.lineTo(x+w*0.05,y);ctx.stroke();
    txt(ctx,'H₂O',x+w/2,by+(h-h*0.32)/2,{s:12,w:700,c:'#2c6db0',a:'center',b:'middle'});},
  pipet(ctx,[x,y,w,h]){const cy=y+h/2;ctx.beginPath();ctx.moveTo(x,cy-2);ctx.lineTo(x+w*0.4,cy-2);ctx.quadraticCurveTo(x+w*0.47,cy-h/2,x+w*0.54,cy-h/2+1);ctx.quadraticCurveTo(x+w*0.61,cy-h/2,x+w*0.66,cy-2);ctx.lineTo(x+w,cy-1);
    ctx.lineTo(x+w,cy+1);ctx.lineTo(x+w*0.66,cy+2);ctx.quadraticCurveTo(x+w*0.61,cy+h/2,x+w*0.54,cy+h/2-1);ctx.quadraticCurveTo(x+w*0.47,cy+h/2,x+w*0.4,cy+2);ctx.lineTo(x,cy+2);ctx.closePath();glassFill(ctx);glassStroke(ctx,1.8);
    ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x+w*0.2,cy-4);ctx.lineTo(x+w*0.2,cy+4);ctx.stroke();},
  thermo(ctx,[x,y,w,h]){const cy=y+h/2;rr(ctx,x+8,cy-4,w-8,8,4);glassFill(ctx);glassStroke(ctx,1.6);ctx.fillStyle='#d23a3a';ctx.beginPath();ctx.arc(x+8,cy,6,0,6.29);ctx.fill();ctx.fillRect(x+8,cy-1.5,w*0.45,3);
    ctx.strokeStyle=GL();ctx.lineWidth=1;for(let i=0;i<=12;i++){const tx=x+22+(w-34)*i/12;ctx.beginPath();ctx.moveTo(tx,cy-4);ctx.lineTo(tx,cy-(i%4?1:0)-0);ctx.stroke();}}
};

/* ---------- the equipment list ---------- */
const ITEMS=[
  {id:'goggles',n:'Safety goggles',cat:'safe',r:[14,114,86,42],d:'goggles',use:'Protect your eyes from splashes and broken glass. Wear them for the whole lab, including cleanup.',tip:'Regular glasses are not enough: goggles seal around the eyes.',prec:'Not a measuring tool.'},
  {id:'watch',n:'Watch glass',cat:'hold',r:[112,140,66,16],d:'watch',use:'A curved glass disk that covers a beaker or holds a small solid while it dries or is weighed.',tip:'It also works as a lid that lets steam escape around the edge.',prec:'Not a measuring tool.'},
  {id:'evap',n:'Evaporating dish',cat:'heat',r:[190,126,66,30],d:'evap',use:'A shallow porcelain dish for heating a solution until the liquid evaporates and the solid stays behind.',tip:'Heat it gently on wire gauze; a big flame makes the solid spatter.',prec:'Not a measuring tool.'},
  {id:'crucible',n:'Crucible and lid',cat:'heat',r:[268,104,46,52],d:'crucible',use:'A porcelain cup that survives very high heat. Use it to heat a solid strongly, such as driving the water out of a hydrate.',tip:'Rest it on a clay triangle on the iron ring, and weigh it only after it has cooled.',prec:'Not a measuring tool. You weigh it on the balance.'},
  {id:'tongs',n:'Crucible tongs',cat:'hold',r:[322,116,84,40],d:'tongs',use:'Pick up hot crucibles, lids and evaporating dishes. Hot porcelain looks exactly like cold porcelain.',tip:'Use tongs, not a test tube holder, for anything heated in a flame.',prec:'Not a measuring tool.'},
  {id:'funnel',n:'Funnel',cat:'hold',r:[414,86,50,70],d:'funnel',use:'Guides liquid into a narrow opening. With folded filter paper it separates a solid from a liquid (filtration).',tip:'Lift it slightly while pouring so air can escape from the flask.',prec:'Not a measuring tool.'},
  {id:'holder',n:'Test tube holder',cat:'hold',r:[470,118,56,38],d:'holder',use:'Grips a test tube so you can heat it in a flame or handle it while it is hot.',tip:'Hold the tube at an angle, pointed away from everyone, and keep it moving in the flame.',prec:'Not a measuring tool.'},
  {id:'stand',n:'Ring stand',cat:'hold',r:[16,180,40,222],d:'stand',use:'A heavy base and an upright rod that hold rings and clamps at any height.',tip:'Put the heavy base under the thing you are holding so the stand cannot tip.',prec:'Not a measuring tool.'},
  {id:'ring',n:'Iron ring',cat:'heat',r:[40,276,94,22],d:'ring',use:'Clamps onto the ring stand to hold glassware on wire gauze, or a crucible on a clay triangle, over a burner.',tip:'Set its height so the hottest part of the flame reaches the bottom of the container.',prec:'Not a measuring tool.'},
  {id:'gauze',n:'Wire gauze',cat:'heat',r:[56,280,80,10],d:'gauze',use:'A wire mesh with a ceramic center that spreads the heat of the flame evenly under glassware.',tip:'Without it, a flame touching one spot on a beaker can crack the glass.',prec:'Not a measuring tool.'},
  {id:'burner',n:'Bunsen burner',cat:'heat',lp:['below','mid'],r:[66,300,52,102],d:'burner',use:'Burns natural gas to make a hot flame. Open the air collar for a blue flame with an inner cone; the hottest spot is just above the tip of that cone.',tip:'Tie back long hair, light it with a striker, and never leave it burning unattended.',prec:'Not a measuring tool.'},
  {id:'beaker',n:'Beaker',cat:'hold',rd:'about ±5% (rough)',r:[150,322,74,80],d:'beaker',use:'Holds, mixes and heats liquids. Its volume marks are rough (about ±5%), so do not use them to measure.',tip:'The spout makes pouring easier. Heat a beaker on wire gauze, never straight in the flame.',prec:'Marks every 50 mL, about ±5%. Record a reading like “about 150 mL”.',meas:true},
  {id:'erlen',n:'Erlenmeyer flask',cat:'hold',rd:'about ±5% (rough)',r:[236,310,74,92],d:'erlen',use:'Holds and mixes liquids. Sloped sides and a narrow neck let you swirl it without splashing, so it is the flask for titrations.',tip:'You can stopper it to store a solution. Its marks are rough, like a beaker’s.',prec:'Marks every 25 mL, about ±5%: not for measuring.',meas:true},
  {id:'gradcyl',n:'Graduated cylinder',cat:'meas',rd:'0.1 mL (100 mL size)',r:[324,196,34,206],d:'gradcyl',use:'Measures the volume of a liquid. Read the bottom of the curved surface (the meniscus) at eye level.',tip:'Pick the smallest cylinder that holds the volume: a 10 mL cylinder is far more precise than a 100 mL one.',prec:'100 mL cylinder: marks every 1 mL, record to 0.1 mL (about ±0.5 mL). 10 mL cylinder: marks every 0.1 mL, record to 0.01 mL.',meas:true},
  {id:'volflask',n:'Volumetric flask',cat:'meas',rd:'100.00 mL, one volume only',r:[376,236,70,166],d:'volflask',use:'Holds one exact volume when filled so the meniscus sits on the line on its neck. Use it to make a solution with an exact concentration.',tip:'Dissolve the solid in some water first, then fill to the line and mix by inverting.',prec:'100 mL flask: 100.00 mL, ±0.08 mL (class A). It measures only that one volume.',meas:true},
  {id:'tuberack',n:'Test tubes and rack',cat:'hold',r:[458,330,74,72],d:'tuberack',use:'Test tubes hold small amounts for quick reactions and tests; the rack keeps them upright.',tip:'Never point a test tube, especially a heated one, at anyone.',prec:'Not a measuring tool.'},
  {id:'stand2',n:'Ring stand',cat:'hold',r:[556,26,40,376],d:'stand2',alias:'stand',use:'A heavy base and an upright rod that hold rings and clamps at any height.',tip:'Put the heavy base under the thing you are holding so the stand cannot tip.',prec:'Not a measuring tool.',hideList:true},
  {id:'clamp',n:'Buret clamp',cat:'hold',r:[570,106,86,28],d:'clamp',use:'Holds a buret straight up on a ring stand, so you can read it and work the stopcock.',tip:'A buret must hang vertically or every reading is off.',prec:'Not a measuring tool.'},
  {id:'buret',n:'Buret',cat:'meas',rd:'0.01 mL',r:[628,30,26,300],d:'buret',use:'A long tube with a stopcock that delivers a measured volume, drop by drop. It is the measuring tool in a titration.',tip:'It reads from the top down: 0.00 mL is near the top. Volume delivered = final reading − initial reading.',prec:'Marks every 0.1 mL; record to 0.01 mL (about ±0.05 mL).',meas:true},
  {id:'wash',n:'Wash bottle',cat:'hold',r:[676,316,44,86],d:'wash',use:'Squirts distilled water to rinse glassware, or to wash every last bit of a solid into a flask.',tip:'Fill it only with distilled water, and label it.',prec:'Not a measuring tool.'},
  {id:'balance',n:'Electronic balance',cat:'meas',rd:'0.01 g',r:[726,334,70,68],d:'balance',use:'Measures mass. Tare (zero) it with the empty container on it, close the draft shield, and never weigh a hot object.',tip:'Hot objects make rising air currents that make the reading too low.',prec:'Reads to 0.01 g (±0.01 g). An analytical balance reads to 0.0001 g.',meas:true},
  {id:'thermo',n:'Thermometer',cat:'meas',lp:['right','mid'],rd:'0.1 °C',r:[14,416,176,16],d:'thermo',use:'Measures temperature. Let the reading settle before you record it, and never use it to stir.',tip:'Keep the bulb in the liquid, not touching the bottom of the hot container.',prec:'Marks every 1 °C; record to 0.1 °C (about ±0.2 °C).',meas:true},
  {id:'pipet',n:'Volumetric pipet',cat:'meas',lp:['mid','above'],rd:'25.00 mL, one volume only',r:[204,416,250,18],d:'pipet',use:'Transfers one exact volume, such as 25.00 mL. Fill it with a pipet bulb, never by mouth.',tip:'Let it drain on its own and touch the tip to the glass; don’t blow out the last drop.',prec:'25 mL pipet: 25.00 mL, ±0.03 mL (class A).',meas:true}
];
const IT={};ITEMS.forEach(i=>IT[i.id]=i);
const LIST=ITEMS.filter(i=>!i.hideList);
const canon=id=>(IT[id]&&IT[id].alias)||id;
const CATS={hold:'Holding, mixing and supporting',meas:'Measuring',heat:'Heating',safe:'Safety'};
const DRAW_ORDER=['stand','stand2','ring','gauze','burner','clamp','buret','goggles','watch','evap','crucible','tongs','funnel','holder','beaker','erlen','gradcyl','volflask','tuberack','wash','balance','thermo','pipet'];
const HIT=ITEMS.slice().sort((a,b)=>a.r[2]*a.r[3]-b.r[2]*b.r[3]);

/* ---------- "pick the right tool" tasks ---------- */
const TASKS=[
  {q:'Measure out exactly 25.00 mL of a solution to transfer to a flask.',best:'pipet',ok:{buret:'A buret also reads to 0.01 mL, but a volumetric pipet is made to deliver one exact volume in one step.'},why:'A volumetric pipet delivers 25.00 mL (±0.03 mL). A graduated cylinder only reads to 0.1 mL, and a beaker is ±5%.'},
  {q:'Heat a solid strongly, until it glows red.',best:'crucible',ok:{evap:'An evaporating dish is porcelain too, but it is made for gentle heating of solutions. Strong heating of a solid needs a crucible.'},why:'Porcelain crucibles survive the full heat of the burner. Glass would soften or crack.'},
  {q:'Add a base drop by drop and know exactly how much you added.',best:'buret',why:'A buret delivers liquid through a stopcock, one drop at a time, and you read the volume before and after to 0.01 mL.'},
  {q:'Make 100.00 mL of a solution with an exact concentration.',best:'volflask',why:'A volumetric flask holds exactly 100.00 mL when filled to the line, so you know the final volume precisely.'},
  {q:'Swirl a reacting mixture during a titration without splashing.',best:'erlen',ok:{beaker:'A beaker would work, but its straight sides let liquid slosh out when you swirl it.'},why:'The Erlenmeyer flask’s sloped sides and narrow neck keep the liquid in while you swirl.'},
  {q:'Measure about 35 mL of water to the nearest 0.1 mL.',best:'gradcyl',ok:{buret:'A buret could do it, but filling and draining a buret is overkill when 0.1 mL is good enough.'},why:'A graduated cylinder reads to 0.1 mL, which is exactly what the task asks for.'},
  {q:'Find the mass of a sample of copper.',best:'balance',why:'Only the balance measures mass. Glassware measures volume.'},
  {q:'Pick up a crucible that just came out of the flame.',best:'tongs',ok:{holder:'A test tube holder can slip off a crucible and may be wooden. Crucible tongs are made for this.'},why:'Crucible tongs grip hot porcelain safely.'},
  {q:'Hold a test tube while you heat it in a flame.',best:'holder',ok:{tongs:'Tongs can crush a thin test tube. A test tube holder is shaped to grip it.'},why:'A test tube holder keeps your hand away from the flame and the hot glass.'},
  {q:'Evaporate the water from salt water to recover the salt.',best:'evap',ok:{watch:'A watch glass works for a few drops, but an evaporating dish holds more and can sit over a flame.'},why:'An evaporating dish is wide and shallow, so water evaporates quickly while the salt stays behind.'},
  {q:'Spread the heat of the flame evenly under a beaker.',best:'gauze',why:'Wire gauze on the iron ring spreads the heat so the glass doesn’t crack.'},
  {q:'Separate sand from water by filtration.',best:'funnel',why:'A funnel holds the folded filter paper: water passes through and the sand stays behind.'},
  {q:'Measure how much the temperature rises during a reaction.',best:'thermo',why:'A thermometer measures temperature; record it to 0.1 °C before and after.'},
  {q:'Rinse the last bit of solid from a beaker into a flask.',best:'wash',why:'A wash bottle aims a thin stream of distilled water exactly where you need it.'},
  {q:'Protect your eyes while you heat a solution.',best:'goggles',why:'Goggles go on before any chemical or flame comes out, and stay on until cleanup is done.'}
];

/* ---------- safety scene ---------- */
const SPOTS=[
  {id:'nogog',l:'Left student’s eyes',hz:true,r:[92,96,62,48],t:'No goggles.',x:'Splashes and flying glass can hit unprotected eyes. Goggles stay on for the whole lab, even during cleanup.'},
  {id:'food',l:'Snacks on the bench',hz:true,r:[288,226,84,66],t:'Food and drink in the lab.',x:'Chemicals get on hands, cans and snacks. Never eat, drink or chew gum in a lab.'},
  {id:'water',l:'Left student’s beaker',hz:true,r:[196,180,86,112],t:'Pouring water into acid.',x:'Mixing water and concentrated acid releases a lot of heat. Water poured into acid can boil and spatter acid. Always add acid to water, slowly.'},
  {id:'closed',l:'Flask on the hot plate',hz:true,r:[392,176,82,118],t:'Heating a closed container.',x:'Gas expands as it heats. With the stopper in, pressure builds until the flask can burst. Never heat a stoppered container.'},
  {id:'tube',l:'Right student’s test tube',hz:true,r:[504,168,90,60],t:'Test tube pointed at a person.',x:'A heated liquid can suddenly boil (bump) and shoot out. Point the open end toward the wall, away from everyone.'},
  {id:'hair',l:'Right student’s hair',hz:true,r:[662,104,74,108],t:'Long hair hanging loose near a flame.',x:'Loose hair can catch fire or dip into chemicals. Tie it back.'},
  {id:'shoes',l:'Right student’s feet',hz:true,r:[656,408,82,40],t:'Open-toed shoes.',x:'Spills and dropped glass land on bare toes. Wear closed-toe shoes in the lab.'},
  {id:'eyewash',l:'Station on the wall',hz:false,r:[350,22,84,60],t:'Eyewash station: safe.',x:'If anything gets in your eyes, rinse them here for 15 minutes and tell your teacher.'},
  {id:'ext',l:'Red cylinder on the wall',hz:false,r:[20,226,40,92],t:'Fire extinguisher: safe.',x:'Know where it is before you light a burner.'},
  {id:'rgog',l:'Right student’s eyes',hz:false,r:[666,96,62,40],t:'Goggles on: safe.',x:'This student is wearing goggles correctly.'},
  {id:'bottle',l:'Bottle at the right end',hz:false,r:[600,236,38,58],t:'Capped, labeled bottle: safe.',x:'A labeled bottle with its cap on is stored correctly.'}
];
const SP={};SPOTS.forEach(s=>SP[s.id]=s);const NHZ=SPOTS.filter(s=>s.hz).length;

/* ---------- precision ladder ---------- */
const PREC=[
  {id:'beaker',n:'Beaker (50 mL)',rec:'≈ 25 mL',u:1.25,ut:'±1 mL (±5%)'},
  {id:'erlen',n:'Erlenmeyer flask',rec:'≈ 25 mL',u:1.25,ut:'±1 mL (±5%)'},
  {id:'gradcyl',n:'Graduated cylinder (50 mL)',rec:'25.0 mL',u:0.25,ut:'±0.25 mL (±1%)'},
  {id:'buret',n:'Buret (50 mL)',rec:'25.00 mL',u:0.05,ut:'±0.05 mL (±0.2%)'},
  {id:'pipet',n:'Volumetric pipet (25 mL)',rec:'25.00 mL',u:0.03,ut:'±0.03 mL (±0.12%)'},
  {id:'volflask',n:'Volumetric flask (25 mL)',rec:'25.00 mL',u:0.03,ut:'±0.03 mL (±0.12%)'}
];

/* ---------- mode visibility ---------- */
function syncModes(sim){if(!atLeast('ap')&&sim.p.mode==='prec')BioLab.setValues(sim,{mode:'identify'});if(!sim.ui||!sim.ui.sec)return;const d=sim.def,m=sim.p.mode;
  d.controls.forEach(c=>{if(!c.modes)return;const cid=d.id+'-'+c.id,e=document.getElementById(cid)||document.getElementById(cid+'-l');const w=e&&e.closest('.ctl');if(w)w.hidden=!atLeast(c.lvl)||!c.modes.includes(m);});
  d.metrics.forEach(mm=>{if(!mm.modes)return;const t=sim.ui.tiles[mm.id];const w=t&&t.num.closest('.tile');if(w)w.hidden=!atLeast(mm.lvl)||!mm.modes.includes(m);});
  const btns=[...sim.ui.sec.querySelectorAll('.controls .actions button')];d.actions.forEach((a,i)=>{const b=btns[i];if(b)b.hidden=!atLeast(a.lvl)||!a.modes.includes(m);});}

/* ---------- interaction ---------- */
function choose(sim,id){const st=sim.st,m=sim.p.mode;id=canon(id);
  if(m==='identify'){if(id!=='none')st.seen[id]=1;return;}
  if(m==='pick'){if(id==='none'){st.res=null;return;}const T=TASKS[st.task];let res;
    if(id===T.best)res={k:'ok',id};else if(T.ok&&T.ok[id])res={k:'meh',id,x:T.ok[id]};else res={k:'no',id};
    if(!st.done[st.task]){st.done[st.task]=res.k;st.tried++;if(res.k==='ok')st.right++;}st.res=res;}}
function spot(sim,id){const st=sim.st;if(id==='none'||!SP[id])return;const s=SP[id];st.last=id;if(s.hz){if(!st.found.includes(id))st.found.push(id);}else if(!st.safe.includes(id)){st.safe.push(id);st.fa++;}}
function nextTask(sim){const st=sim.st;st.task=(st.task+1)%TASKS.length;st.res=null;if(sim.p.item!=='none')BioLab.setValues(sim,{item:'none'});}

/* ---------- label placement (greedy, avoids overlaps) ---------- */
function placeLabels(ctx,list,size){const placed=[];ctx.font='700 '+size+'px '+FONT;const H=size*1.7;
  return list.map(({text,r,pref})=>{const w=ctx.measureText(text).width+size*1.1;const cx=r[0]+r[2]/2;
    const cands=(pref||['above','below','right','left','mid']).map(p=>p==='above'?[cx,r[1]-H/2-4]:p==='below'?[cx,r[1]+r[3]+H/2+4]:p==='right'?[r[0]+r[2]+w/2+4,r[1]+r[3]*0.3]:p==='left'?[r[0]-w/2-4,r[1]+r[3]*0.3]:[cx,r[1]+r[3]/2]);
    for(const [x0,y0] of cands){const x=clamp(x0,w/2+2,798-w/2),y=clamp(y0,H/2+2,448-H/2),b=[x-w/2,y-H/2,w,H];
      if(!placed.some(q=>b[0]<q[0]+q[2]+3&&q[0]<b[0]+b[2]+3&&b[1]<q[1]+q[3]+2&&q[1]<b[1]+b[3]+2)){placed.push(b);return {text,x,y,ok:true};}}
    return {text,x:cx,y:r[1]+r[3]/2,ok:false};});}
function hl(ctx,r,col,dash,t){ctx.save();ctx.strokeStyle=col;ctx.lineWidth=3;if(dash){ctx.setLineDash([6,5]);ctx.lineDashOffset=RM?0:-t*20;}rr(ctx,r[0]-6,r[1]-6,r[2]+12,r[3]+12,8);ctx.stroke();ctx.restore();}

/* ---------- challenges ---------- */
const CH=[
  {lvl:'bio',q:'The outlined beaker has volume marks on its side. Can you use them to measure 40.0 mL of water?',choices:['Yes, the marks are made to be exact','No, beaker marks are only about ±5%; use a graduated cylinder'],correct:1,instant:true,target:'beaker',show:{mode:'identify',item:'beaker'},
   explain:'Beaker and flask marks are rough guides, good to about ±5%. To measure 40.0 mL (to the nearest 0.1 mL), use a graduated cylinder. The info panel now shows the beaker’s precision.'},
  {lvl:'bio',q:'You need to heat a solid strongly, until it glows. Which container do you use?',choices:['A beaker','A crucible','A watch glass'],correct:1,instant:true,show:{mode:'identify',item:'crucible'},
   explain:'A porcelain crucible handles the full heat of a Bunsen burner. Glass beakers and watch glasses can soften or crack. The crucible is now highlighted on the bench.'},
  {lvl:'bio',q:'You are diluting a concentrated acid. Which way do you mix?',choices:['Pour water into the acid','Pour the acid slowly into the water','Either order is fine'],correct:1,instant:true,show:{mode:'safety'},
   explain:'Mixing releases a lot of heat. Pouring water into acid can make the first bit of water boil and spatter acid. Add acid to water: “Do as you oughta, add acid to water.” Find this hazard in the safety scene.'},
  {lvl:'bio',q:'Acid splashes onto your hand. What do you do first?',choices:['Wipe it off with a paper towel','Rinse with lots of running water and tell your teacher','Neutralize it with a base such as baking soda'],correct:1,instant:true,show:{mode:'safety'},
   explain:'Water dilutes the acid and carries it away. Rinse for several minutes and tell your teacher. Neutralizing on skin releases heat, and wiping spreads the acid.'},
  {lvl:'bio',q:'How do you pick up a crucible that just came out of the flame?',choices:['Quickly, with your fingers','With crucible tongs','With a test tube holder'],correct:1,instant:true,show:{mode:'identify',item:'tongs'},
   explain:'Crucible tongs are made to grip hot porcelain. Hot porcelain looks exactly like cold porcelain, so always assume it is hot.'},
  {lvl:'honors',q:'You are heating a liquid in a test tube. Where should its open end point?',choices:['At yourself, so you can watch','Toward the wall, away from everyone','Straight up'],correct:1,instant:true,show:{mode:'safety'},
   explain:'A heated liquid can bump: a bubble of vapor forms suddenly and shoots liquid out. Point the tube away from everyone, at an angle, and keep it moving in the flame.'},
  {lvl:'honors',q:'Why must you never heat a stoppered flask?',choices:['The stopper melts','Gas inside expands, pressure builds, and the flask can burst','It is fine if the flask is small'],correct:1,instant:true,show:{mode:'safety'},
   explain:'Gas pressure rises with temperature at constant volume. A sealed flask has nowhere to vent, so it can shatter. Heat only open containers.'},
  {lvl:'honors',q:'Which piece do you use to make 250.00 mL of a solution with an exact concentration?',choices:['Erlenmeyer flask','Volumetric flask','Beaker'],correct:1,instant:true,show:{mode:'identify',item:'volflask'},
   explain:'A volumetric flask holds one exact volume when the meniscus sits on the line on its neck. Erlenmeyer flasks and beakers are only ±5%.'},
  {lvl:'ap',q:'You measure the same liquid three ways. Which reading is the most precise?',choices:['About 25 mL in a beaker','25.0 mL in a graduated cylinder','25.00 mL from a buret'],correct:2,instant:true,show:{mode:'prec',item:'buret'},
   explain:'The buret reading has the most significant figures and the smallest uncertainty (±0.05 mL, about 0.2%). The precision ladder now shows all three.'},
  {lvl:'ap',q:'The liquid in a buret sits exactly on the 18.4 mL line. How do you record it?',choices:['18 mL','18.4 mL','18.40 mL'],correct:2,instant:true,show:{mode:'prec',item:'buret'},
   explain:'A buret is marked every 0.1 mL, so you estimate one more digit: the hundredths. “Exactly on the line” means that estimated digit is 0, and you must write it: 18.40 mL.'},
  {lvl:'ap',q:'You need 10.00 mL. A 10 mL graduated cylinder or a 10 mL volumetric pipet?',choices:['The cylinder: it reads to 0.01 mL so it is just as good','The pipet: its tolerance (±0.02 mL) is several times smaller','Either, because both say 10 mL'],correct:1,instant:true,show:{mode:'prec',item:'pipet'},
   explain:'Reading a cylinder to 0.01 mL does not make it accurate to 0.01 mL. A class A 10 mL cylinder is about ±0.10 mL; a 10 mL volumetric pipet is about ±0.02 mL.'}
];
function curQ(sim){const l=CH.filter(c=>atLeast(c.lvl));return l[sim.ch.idx];}

const SIM={
  id:'labbench',hash:'labbench',apUnit:0,order:1,kind:'Lab skills',tab:'Lab equipment and safety',
  card:'Click around a chemistry lab bench to learn every piece of equipment, pick the right tool for a job, and spot the hazards in a lab scene.',
  title:'Lab equipment and lab safety',
  next:['measure','density'],
  lede:{bio:'Learn the name and job of every piece of equipment on the bench. Then choose the right tool for each task and find the safety hazards in a lab.',
        honors:'Learn why each tool is shaped the way it is, and which tools measure precisely versus just hold liquid.',
        ap:'Compare the precision of every volumetric tool, and record each reading with the right number of digits.'},
  scale:'A standard high school chemistry bench, about 2 m long. The tall buret is 50 mL; the beaker is 250 mL.',
  timeless:true,animated:true,graph:false,
  controls:[
    {id:'mode',label:'Activity',type:'seg',def:'identify',lvl:'bio',noTrial:true,options:[{v:'identify',l:'Identify'},{v:'pick',l:'Pick the right tool'},{v:'safety',l:'Safety scene'},{v:'prec',l:'Precision',lvl:'ap'}],onChange(sim){sim.st.res=null;syncModes(sim);}},
    {id:'item',label:'Piece of equipment',type:'select',def:'none',lvl:'bio',noTrial:true,modes:['identify','pick','prec'],options:[{v:'none',l:'Choose a piece…'}].concat(LIST.map(i=>({v:i.id,l:i.n}))),help:'Or click it on the bench.',onChange(sim){choose(sim,sim.p.item);}},
    {id:'labels',label:'Show labels',type:'toggle',def:false,lvl:'bio',noTrial:true,modes:['identify'],help:'Turn off to quiz yourself.'},
    {id:'spot',label:'Check a spot',type:'select',def:'none',lvl:'bio',noTrial:true,modes:['safety'],options:[{v:'none',l:'Choose a spot…'}].concat(SPOTS.map(s=>({v:s.id,l:s.l}))),help:'Or click it in the scene.',onChange(sim){spot(sim,sim.p.spot);}}
  ],
  actions:[
    {id:'next',label:'Next task',lvl:'bio',primary:true,modes:['pick'],run(sim){nextTask(sim);}},
    {id:'restart',label:'Start over',lvl:'bio',modes:['pick','safety'],run(sim){const st=sim.st;st.task=0;st.res=null;st.done={};st.right=0;st.tried=0;st.found=[];st.safe=[];st.fa=0;st.last=null;st.reveal=false;if(sim.p.item!=='none')BioLab.setValues(sim,{item:'none'});}},
    {id:'reveal',label:'Show all hazards',lvl:'bio',modes:['safety'],run(sim){sim.st.reveal=true;}}
  ],
  init(){return {seen:{},task:0,res:null,done:{},right:0,tried:0,found:[],safe:[],fa:0,last:null,reveal:false};},
  step(){},
  metrics:[
    {id:'seen',label:'Pieces explored',unit:'',lvl:'bio',text:true,modes:['identify'],get:s=>Object.keys(s.st.seen).length+' of '+LIST.length},
    {id:'cat',label:'Type of tool',unit:'',lvl:'honors',text:true,modes:['identify','prec'],get:s=>{const i=IT[s.p.item];return i?CATS[i.cat]:'Choose a piece';}},
    {id:'taskn',label:'Task',unit:'',lvl:'bio',text:true,modes:['pick'],get:s=>(s.st.task+1)+' of '+TASKS.length},
    {id:'score',label:'Best tool on the first try',unit:'',lvl:'bio',text:true,modes:['pick'],get:s=>s.st.right+' of '+s.st.tried+' tried'},
    {id:'found',label:'Hazards found',unit:'',lvl:'bio',text:true,modes:['safety'],get:s=>s.st.found.length+' of '+NHZ},
    {id:'fa',label:'Safe things checked',unit:'',lvl:'bio',text:true,modes:['safety'],get:s=>String(s.st.fa)},
    {id:'reads',label:'Reads to',unit:'',lvl:'ap',text:true,modes:['identify','prec'],get:s=>{const i=IT[s.p.item];return i?(i.rd||'Not a measuring tool'):'Choose a piece';}}
  ],
  onClick(sim,x,y){const m=sim.p.mode;
    if(m==='safety'){const s=SPOTS.find(s=>x>=s.r[0]&&x<=s.r[0]+s.r[2]&&y>=s.r[1]&&y<=s.r[1]+s.r[3]);if(s)BioLab.setValues(sim,{spot:s.id});return;}
    if(m==='prec'){const row=PREC.findIndex((r,i)=>y>=PY(i)-22&&y<=PY(i)+22);if(row>=0)BioLab.setValues(sim,{item:PREC[row].id});return;}
    const it=HIT.find(i=>x>=i.r[0]-4&&x<=i.r[0]+i.r[2]+4&&y>=i.r[1]-4&&y<=i.r[1]+i.r[3]+4);BioLab.setValues(sim,{item:it?canon(it.id):'none'});},
  infoPanel(sim){const p=sim.p,st=sim.st,hon=atLeast('honors'),ap=atLeast('ap');
    if(p.mode==='safety'){let h='<div class="p-head"><h3>Safety scene</h3></div>';const s=st.last&&SP[st.last];
      if(s)h+='<p><b>'+s.t+'</b> '+s.x+'</p>';else h+='<p>Two students are doing a lab. Find every unsafe action. Click a spot in the picture or choose it from <b>Check a spot</b>.</p>';
      if(st.found.length)h+='<p><b>Found so far:</b></p><ul>'+st.found.map(id=>'<li>'+SP[id].t+'</li>').join('')+'</ul>';
      if(hon)h+='<p>Every hazard breaks one rule from your safety contract. For each one, write the rule it breaks.</p>';return h;}
    if(p.mode==='prec'){let h='<div class="p-head"><h3>Precision of volume tools</h3></div><p>Each tool measures the same 25 mL. The more digits you can trust, the smaller the uncertainty.</p>';
      h+='<div class="tbl-wrap"><table><thead><tr><th>Tool</th><th>Record</th><th>Uncertainty</th></tr></thead><tbody>'+PREC.map(r=>'<tr><td>'+r.n+'</td><td>'+r.rec+'</td><td>'+r.ut+'</td></tr>').join('')+'<tr><td>Electronic balance</td><td>12.47 g</td><td>±0.01 g</td></tr><tr><td>Thermometer (1 °C marks)</td><td>21.4 °C</td><td>±0.2 °C</td></tr></tbody></table></div>';return h;}
    const i=IT[p.item];
    if(p.mode==='pick'){const T=TASKS[st.task];let h='<div class="p-head"><h3>Task '+(st.task+1)+' of '+TASKS.length+'</h3></div><p class="q"><b>'+T.q+'</b></p>';
      if(!st.res)h+='<p>Click the tool you would use, or choose it from <b>Piece of equipment</b>.</p>';
      else{const r=st.res,n=IT[r.id].n;if(r.k==='ok')h+='<p class="verdict ok">Right: '+n+'.</p><p>'+T.why+'</p>';
        else if(r.k==='meh')h+='<p class="verdict no">'+n+' works, but it is not the best choice.</p><p>'+r.x+'</p>';
        else h+='<p class="verdict no">Not the '+n.toLowerCase()+'.</p><p>'+IT[r.id].use+'</p><p>Try again, or press <b>Next task</b>.</p>';}
      return h;}
    if(!i){let h='<div class="p-head"><h3>Explore the bench</h3></div><p>Click any piece of equipment, or choose one from the list, to learn its name and its job. Turn on <b>Show labels</b> to see every name.</p>';
      if(p.labels&&sim.vis.badges)h+='<ol>'+LIST.map(x=>'<li>'+x.n+'</li>').join('')+'</ol>';
      if(hon){h+='<div class="tbl-wrap"><table><thead><tr><th>Type</th><th>Equipment</th></tr></thead><tbody>'+Object.keys(CATS).map(c=>'<tr><td>'+CATS[c]+'</td><td style="white-space:normal;text-align:left">'+LIST.filter(x=>x.cat===c).map(x=>x.n).join(', ')+'</td></tr>').join('')+'</tbody></table></div>';}
      return h;}
    let h='<div class="p-head"><h3>'+i.n+'</h3></div><p>'+i.use+'</p>';if(hon)h+='<p><b>Tip:</b> '+i.tip+'</p>';if(ap)h+='<p><b>Precision:</b> '+i.prec+'</p>';return h;},
  narrate(sim){const p=sim.p,st=sim.st;
    if(p.mode==='safety'){const n=st.found.length;if(st.reveal)return 'All '+NHZ+' hazards are circled in red. Read each one in the info panel by clicking it.';
      const s=st.last&&SP[st.last];if(s)return (s.hz?'<b>Hazard: '+s.t+'</b> ':'<b>'+s.t+'</b> ')+s.x+(s.hz?' ('+n+' of '+NHZ+' found.)':'');
      return 'Look closely at both students, the bench and the walls. There are <b>'+NHZ+' hazards</b> hidden in this scene, plus some things that are done right.';}
    if(p.mode==='prec'){const r=PREC.find(r=>r.id===p.item);if(r)return '<b>'+r.n+':</b> record '+r.rec+', '+r.ut+'. '+(r.u>=1?'The marks are only rough guides.':r.u>=0.2?'One estimated digit past the 1 mL marks.':'The best volume precision in a high school lab.');
      return 'All six tools hold about 25 mL, but the uncertainty ranges from about 1 mL down to 0.03 mL: <b>a 40-fold difference in precision</b>. The bars use a log scale.';}
    if(p.mode==='pick'){const T=TASKS[st.task],r=st.res;if(!r)return '<b>Task:</b> '+T.q+' Click the best tool.';
      if(r.k==='ok')return '<b>Right.</b> '+T.why;if(r.k==='meh')return '<b>Close.</b> '+r.x;return '<b>Not that one.</b> The '+IT[r.id].n.toLowerCase()+' is for something else: '+IT[r.id].use.split('.')[0].toLowerCase()+'.';}
    const i=IT[p.item];if(i)return '<b>'+i.n+':</b> '+i.use;
    return 'A chemistry bench with '+LIST.length+' pieces of equipment. <b>Click any piece</b> to learn what it does. Glassware either <b>holds</b> liquid or <b>measures</b> it, and only some of it measures precisely.';},
  tour:[
    {title:'Containers that hold and mix',text:'The beaker and the Erlenmeyer flask hold, mix and heat liquids. Their volume marks are rough, about ±5%, so they are not measuring tools.',focus:[[144,300,86,108],[230,300,86,108]],pause:true,setup(sim){BioLab.setValues(sim,{mode:'identify',item:'beaker',labels:false});}},
    {title:'Tools that measure volume',text:'The graduated cylinder, volumetric flask, buret and volumetric pipet measure volume. A cylinder reads to 0.1 mL; the buret and pipet read to 0.01 mL.',focus:[[318,190,46,216],[370,230,82,176],[622,24,38,312],[198,408,262,32]],pause:true,setup(sim){BioLab.setValues(sim,{item:'gradcyl'});}},
    {title:'Heating with a Bunsen burner',text:'The burner sits under an iron ring clamped to the ring stand. Wire gauze on the ring spreads the flame’s heat so glassware doesn’t crack.',focus:[8,172,136,236],speed:1,setup(sim){BioLab.setValues(sim,{item:'burner'});}},
    {title:'Heating solids strongly',text:'Porcelain survives the full flame. Heat a solid in a crucible, evaporate a solution in an evaporating dish, and move hot porcelain with crucible tongs.',focus:[184,96,228,66],pause:true,setup(sim){BioLab.setValues(sim,{item:'crucible'});}},
    {title:'Mass and temperature',text:'The electronic balance measures mass to 0.01 g. The thermometer is marked every 1 °C, so you record it to 0.1 °C.',focus:[[720,328,82,80],[8,408,188,30]],pause:true,setup(sim){BioLab.setValues(sim,{item:'balance'});}},
    {title:'Spot the hazards',text:'Now find what is unsafe in this lab scene. Here, a student pours water into concentrated acid. Click each hazard you can find.',focus:[0,0,800,450],pause:true,setup(sim){BioLab.setValues(sim,{mode:'safety',spot:'water'});}},
    {lvl:'honors',title:'Pick the right tool',text:'Each task needs one best tool. Some tools work but are a worse choice, such as a beaker to swirl a titration.',focus:[0,0,800,450],pause:true,setup(sim){BioLab.setValues(sim,{mode:'pick',item:'none'});}},
    {lvl:'ap',title:'The precision ladder',text:'For the same 25 mL, the uncertainty drops from about ±1 mL (beaker) to ±0.03 mL (volumetric pipet). Record every digit you can trust, and one estimated digit.',focus:[0,0,800,450],pause:true,setup(sim){BioLab.setValues(sim,{mode:'prec',item:'buret'});}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{mode:'identify',item:'none',spot:'none'});sim.st.last=null;syncModes(sim);},
  challenges:CH,
  onChallenge(sim,ch,phase){if(!ch)return;if(phase==='ask'&&ch.target){if(sim.p.mode!=='identify')BioLab.setValues(sim,{mode:'identify'});if(sim.p.item!=='none')BioLab.setValues(sim,{item:'none'});}
    if(phase==='done'&&ch.show){BioLab.setValues(sim,ch.show);syncModes(sim);}},
  onLevel(sim){syncModes(sim);},
  lab:{bio:'<p><b>Question:</b> Can you name every piece of lab equipment and say what it is for?</p><ol><li>In <b>Identify</b>, turn labels off. Click each piece, say its name out loud first, then check.</li><li>In <b>Pick the right tool</b>, do all 15 tasks. Press <b>Record trial</b> to save your score.</li><li>In <b>Safety scene</b>, find all 7 hazards without using Show all hazards. Record your result.</li></ol><p>Which two pieces of equipment are easiest to mix up? Write one way to tell them apart.</p>',
       honors:'<p><b>Question:</b> Why is each tool shaped the way it is?</p><ol><li>Sort the equipment into holding, measuring, heating and safety (the info panel shows the groups).</li><li>For each measuring tool, write what it measures and how precisely.</li><li>Find all 7 hazards in the safety scene and write the safety rule each one breaks.</li></ol><p>Explain why a titration uses an Erlenmeyer flask and a buret instead of a beaker and a graduated cylinder.</p>',
       ap:'<p><b>Question:</b> Which glassware gives the most precise volume?</p><ol><li>Open <b>Precision</b> and record the reading and uncertainty for each tool measuring 25 mL.</li><li>Calculate each relative uncertainty (uncertainty ÷ 25 mL × 100).</li><li>Choose the glassware for: making a standard solution, delivering titrant, and measuring 35 mL of rinse water.</li></ol><p><b>Claim–evidence–reasoning:</b> Explain why a calculated molarity can only be as precise as its least precise volume measurement.</p>'},
  terms:[{t:'Beaker',d:'A wide container for holding, mixing and heating liquids; its marks are only about ±5%.'},{t:'Graduated cylinder',d:'A tall cylinder for measuring liquid volume.'},{t:'Meniscus',d:'The curved surface of a liquid in a narrow tube. Read the bottom of it at eye level.'},{t:'Crucible',d:'A porcelain cup for heating solids strongly.'},{t:'Bunsen burner',d:'A gas burner that makes a hot flame for heating.'},
    {lvl:'honors',t:'Buret',d:'A long, marked tube with a stopcock that delivers measured volumes, used in titrations.'},{lvl:'honors',t:'Volumetric glassware',d:'Glassware made to hold or deliver one exact volume, such as a volumetric flask or pipet.'},{lvl:'honors',t:'Tare',d:'Zeroing a balance with the container on it, so it reads only the mass of the sample.'},
    {lvl:'ap',t:'Precision',d:'How finely an instrument can measure; shown by how many digits you can record and the size of the uncertainty.'},{lvl:'ap',t:'Tolerance',d:'The maximum error a manufacturer allows for glassware, such as ±0.03 mL for a class A 25 mL pipet.'},{lvl:'ap',t:'Estimated digit',d:'The last digit of a reading, estimated between the smallest marks.'}],
  about:'<p>The bench drawings are simplified but in proportion within each group. Precision values are typical class A tolerances (ASTM E287, E288 and E969) and common reading rules: a 50 mL buret is marked every 0.1 mL and read to 0.01 mL; a 100 mL graduated cylinder is marked every 1 mL and read to 0.1 mL; beakers and Erlenmeyer flasks are good to about ±5%. Real glassware is labeled with its own tolerance, and class B glassware allows about twice the error.</p><p>The safety scene shows common rules from high school lab safety contracts (such as the Flinn contract). It is not a complete list of lab rules: always follow your teacher’s instructions and your school’s contract.</p>',
  initVis(sim){syncModes(sim);},
  thumbSetup(sim){sim.p.item='buret';},thumbFrames:2,
  draw(sim,ctx,vdt,k,t){const p=sim.p;ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
    if(p.mode==='safety')return drawSafety(sim,ctx,k,t);if(p.mode==='prec')return drawPrec(sim,ctx,k,t);drawBench(sim,ctx,k,t);}
};

function drawBench(sim,ctx,k,t){const p=sim.p,st=sim.st,touring=sim.tour&&sim.tour.on;
  // wall shelf and bench
  ctx.fillStyle=PAL['cv-bg2'];ctx.fillRect(0,0,536,158);ctx.fillStyle=PAL['cv-bench'];ctx.fillRect(0,158,536,10);ctx.fillStyle=PAL['line'];ctx.fillRect(0,168,536,2);
  ctx.fillStyle=PAL['cv-bench'];ctx.fillRect(0,402,800,48);ctx.fillStyle=PAL['line'];ctx.fillRect(0,402,800,2);
  DRAW_ORDER.forEach(id=>{const i=IT[id];DRAW[i.d](ctx,i.r,t,sim);});
  // quiz target
  const q=curQ(sim);if(!touring&&q&&q.target&&sim.ch.phase==='ask'&&p.mode==='identify')hl(ctx,IT[q.target].r,PAL['s4'],true,t);
  // pick-mode task banner
  if(p.mode==='pick'){const T=TASKS[st.task];const fs=15*k,lines=wrap(ctx,T.q,500,fs,700);const bh=lines.length*fs*1.25+16;
    ctx.fillStyle=PAL['card'];rr(ctx,8,8,520,bh,8);ctx.fill();ctx.strokeStyle=PAL['rj'];ctx.lineWidth=2;ctx.stroke();lines.forEach((l,j)=>txt(ctx,l,18,8+8+fs*0.95+j*fs*1.25,{s:fs,w:700}));
    if(st.res){const i=IT[st.res.id];const col=st.res.k==='ok'?PAL['s3']:st.res.k==='meh'?PAL['s4']:PAL['s1'];hl(ctx,i.r,col,false,t);
      const L=placeLabels(ctx,[{text:(st.res.k==='ok'?'✓ ':st.res.k==='meh'?'~ ':'✗ ')+i.n,r:i.r,pref:['below','above','mid']}],13*k)[0];pill(ctx,L.text,L.x,L.y,col,'#fff',13*k);}
    return;}
  // labels
  const sel=IT[p.item];
  const badges=k>=1.25;if(sim.vis.badges!==badges){sim.vis.badges=badges;sim.infoDirty=true;}
  if(p.labels&&!touring){const ls=LIST.filter(i=>i!==sel).sort((a,b)=>(b.lp?1:0)-(a.lp?1:0));
    if(badges)ls.forEach(i=>{const r=i.r;pill(ctx,String(LIST.indexOf(i)+1),r[0]+r[2]/2,r[1]+r[3]/2,PAL['card'],PAL['cv-ink'],12*k);});
    else{const lab=placeLabels(ctx,ls.map(i=>({text:i.n,r:i.r,pref:i.lp})),12);
      lab.forEach((L,j)=>{if(L.ok)pill(ctx,L.text,L.x,L.y,PAL['card'],PAL['cv-ink'],12);else{const i=ls[j];pill(ctx,String(LIST.indexOf(i)+1),i.r[0]+i.r[2]/2,i.r[1]+i.r[3]/2,PAL['card'],PAL['cv-ink'],12);}});}}
  if(sel){const r=sel.id==='stand'?[16,180,104,222]:sel.r;hl(ctx,r,PAL['rj'],false,t);if(sel.id==='stand')hl(ctx,IT.stand2.r,PAL['rj'],false,t);
    const L=placeLabels(ctx,[{text:sel.n,r,pref:r[1]>200?['above','below','mid']:['below','above','mid']}],14*k)[0];pill(ctx,L.text,L.x,L.y,PAL['rj'],'#fff',14*k);}
  else if(!p.labels&&!touring&&!(q&&q.target&&sim.ch.phase==='ask'))txt(ctx,'Click any piece of equipment',788,26,{s:13*k,c:PAL['cv-soft'],a:'right'});
}

/* ---------- safety scene ---------- */
function person(ctx,x,o){const skin=o.skin,top=96;
  // legs and shoes
  ctx.fillStyle='#34495e';ctx.fillRect(x-22,300,18,112);ctx.fillRect(x+4,300,18,112);
  if(o.sandals){ctx.fillStyle=skin;ctx.fillRect(x-26,410,24,14);ctx.fillRect(x+2,410,24,14);ctx.fillStyle='#8e5a2a';ctx.fillRect(x-28,422,28,6);ctx.fillRect(x,422,28,6);ctx.fillRect(x-20,412,4,12);ctx.fillRect(x+8,412,4,12);
    ctx.fillStyle=skin;[-24,-18,-12,4,10,16].forEach(dx=>{ctx.beginPath();ctx.arc(x+dx+4,422,3,0,6.29);ctx.fill();});}
  else{ctx.fillStyle='#222831';rr(ctx,x-30,412,30,16,6);ctx.fill();rr(ctx,x,412,30,16,6);ctx.fill();}
  // lab coat
  ctx.fillStyle='#eef1f4';rr(ctx,x-34,top+62,68,170,14);ctx.fill();ctx.strokeStyle='#a9b3bd';ctx.lineWidth=1.5;ctx.stroke();ctx.beginPath();ctx.moveTo(x,top+70);ctx.lineTo(x,top+230);ctx.stroke();
  // head and hair
  if(o.long){ctx.fillStyle=o.hair;rr(ctx,x-30,top+4,60,104,18);ctx.fill();}
  ctx.fillStyle=skin;ctx.beginPath();ctx.arc(x,top+28,26,0,6.29);ctx.fill();ctx.fillRect(x-8,top+50,16,14);
  ctx.fillStyle=o.hair;ctx.beginPath();ctx.arc(x,top+22,27,Math.PI*1.05,Math.PI*1.95);ctx.fill();
  ctx.fillStyle='#2b2b2b';ctx.beginPath();ctx.arc(x-9+o.face*4,top+30,3,0,6.29);ctx.arc(x+9+o.face*4,top+30,3,0,6.29);ctx.fill();
  if(o.goggles){ctx.fillStyle='rgba(120,190,235,.6)';ctx.strokeStyle='#2f5f86';ctx.lineWidth=3;rr(ctx,x-24,top+20,48,20,8);ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(x-24,top+28);ctx.lineTo(x-28,top+26);ctx.moveTo(x+24,top+28);ctx.lineTo(x+28,top+26);ctx.stroke();}}
function drawSafety(sim,ctx,k,t){const st=sim.st;
  ctx.fillStyle=PAL['cv-bg2'];ctx.fillRect(0,0,800,300);ctx.fillStyle=PAL['line'];ctx.fillRect(0,438,800,12);
  // wall items: eyewash and extinguisher
  ctx.fillStyle='#1b8a4a';rr(ctx,356,28,72,48,6);ctx.fill();txt(ctx,'EYEWASH',392,46,{s:12,w:800,c:'#fff',a:'center',b:'middle'});ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(382,62,7,4,0,0,6.29);ctx.ellipse(402,62,7,4,0,0,6.29);ctx.stroke();
  ctx.fillStyle='#c62828';rr(ctx,28,240,24,72,8);ctx.fill();ctx.fillStyle='#222';ctx.fillRect(34,230,12,12);ctx.strokeStyle='#222';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(46,234);ctx.quadraticCurveTo(62,240,56,262);ctx.stroke();
  // bench
  ctx.fillStyle=PAL['cv-bench'];ctx.fillRect(170,292,470,16);ctx.fillStyle=PAL['cv-soft'];ctx.fillRect(184,308,10,130);ctx.fillRect(616,308,10,130);
  // left student pouring water into acid
  person(ctx,124,{skin:'#c68e63',hair:'#2b1d12',face:1,goggles:false});
  ctx.strokeStyle='#c68e63';ctx.lineWidth=11;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(146,176);ctx.lineTo(196,192);ctx.lineTo(222,186);ctx.stroke();
  ctx.fillStyle='rgba(150,205,240,.7)';ctx.save();ctx.translate(232,186);ctx.rotate(0.9);rr(ctx,-12,-26,24,46,6);ctx.fill();ctx.strokeStyle='#5b8db0';ctx.lineWidth=1.5;ctx.stroke();ctx.restore();
  txt(ctx,'H₂O',236,166,{s:12,w:800,c:PAL['cv-ink'],a:'center'});
  const sw=RM?0:Math.sin(t*6)*1.5;ctx.strokeStyle='rgba(120,180,230,.9)';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(250,200);ctx.quadraticCurveTo(254+sw,214,252,232);ctx.stroke();
  ctx.beginPath();ctx.moveTo(220,232);ctx.lineTo(222,290);ctx.lineTo(268,290);ctx.lineTo(270,232);ctx.save();ctx.globalAlpha=0.6;ctx.fillStyle='#f3e7a0';ctx.fillRect(221,256,48,34);ctx.restore();ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=2.4;ctx.stroke();
  ctx.fillStyle='#c62828';rr(ctx,226,262,38,16,3);ctx.fill();txt(ctx,'ACID',245,270,{s:12,w:800,c:'#fff',a:'center',b:'middle'});
  if(!RM)for(let i=0;i<3;i++){const ph=(t*1.4+i/3)%1;ctx.fillStyle='rgba(240,240,240,'+(0.6*(1-ph))+')';ctx.beginPath();ctx.arc(236+i*10,250-ph*26,4,0,6.29);ctx.fill();}
  // snacks
  ctx.fillStyle='#e53935';rr(ctx,300,250,24,40,4);ctx.fill();ctx.fillStyle='#bbb';ctx.fillRect(300,250,24,5);ctx.fillStyle='#f0b429';ctx.beginPath();ctx.moveTo(328,290);ctx.lineTo(331,238);ctx.lineTo(374,234);ctx.lineTo(372,290);ctx.closePath();ctx.fill();txt(ctx,'CHIPS',351,266,{s:12,w:800,c:'#5a3a00',a:'center',b:'middle'});
  // hot plate with stoppered flask
  ctx.fillStyle='#59616b';rr(ctx,396,274,74,18,4);ctx.fill();ctx.fillStyle='#e85b2a';ctx.fillRect(404,270,58,5);
  ctx.beginPath();ctx.moveTo(426,186);ctx.lineTo(426,214);ctx.lineTo(402,268);ctx.lineTo(464,268);ctx.lineTo(440,214);ctx.lineTo(440,186);ctx.save();ctx.globalAlpha=0.55;ctx.fillStyle='#7cc2e8';ctx.fillRect(400,240,68,28);ctx.restore();ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=2.4;ctx.stroke();
  ctx.fillStyle='#8d5a3a';rr(ctx,422,176,22,14,3);ctx.fill();
  if(!RM)for(let i=0;i<4;i++){const ph=(t*1.2+i/4)%1;ctx.fillStyle='rgba(255,255,255,'+(0.7*(1-ph))+')';ctx.beginPath();ctx.arc(420+i*9,262-ph*20,2.5,0,6.29);ctx.fill();}
  // right student heating a test tube aimed at the left student
  ctx.fillStyle='#4b525b';rr(ctx,560,280,30,12,3);ctx.fill();ctx.fillStyle='#b9a46a';ctx.fillRect(570,236,10,46);const fl=RM?0:Math.sin(t*10)*2;
  ctx.beginPath();ctx.moveTo(569,236);ctx.quadraticCurveTo(566,214,575,200+fl);ctx.quadraticCurveTo(584,214,581,236);ctx.closePath();ctx.fillStyle='rgba(60,110,240,.65)';ctx.fill();
  ctx.save();ctx.translate(578,212);ctx.rotate(0.405);rr(ctx,-64,-6,70,12,6);ctx.save();ctx.globalAlpha=0.4;ctx.fillStyle=PAL['cv-bg'];ctx.fill();ctx.restore();ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=2;ctx.stroke();ctx.fillStyle='rgba(76,175,80,.8)';ctx.fillRect(-18,-5,22,10);ctx.restore();
  ctx.strokeStyle=WOOD;ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(546,200);ctx.lineTo(640,178);ctx.stroke();ctx.strokeStyle=METAL_D;ctx.lineWidth=3;ctx.beginPath();ctx.arc(546,200,9,0,6.29);ctx.stroke();
  ctx.setLineDash([5,6]);ctx.strokeStyle=PAL['s1'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(512,186);ctx.lineTo(430,151);ctx.stroke();ctx.setLineDash([]);
  person(ctx,696,{skin:'#f1c9a5',hair:'#8a4b1f',long:true,face:-1,goggles:true,sandals:true});
  ctx.strokeStyle='#f1c9a5';ctx.lineWidth=11;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(672,178);ctx.lineTo(642,178);ctx.stroke();
  // reagent bottle
  ctx.fillStyle='#7a4a1e';rr(ctx,604,246,30,46,5);ctx.fill();ctx.fillStyle='#333';ctx.fillRect(610,236,18,11);ctx.fillStyle='#f5f5f0';ctx.fillRect(607,258,24,16);txt(ctx,'NaCl',619,266,{s:12,w:700,c:'#222',a:'center',b:'middle'});
  // marks
  const touring=sim.tour&&sim.tour.on;
  SPOTS.forEach(s=>{const found=st.found.includes(s.id),safe=st.safe.includes(s.id),show=found||(st.reveal&&s.hz)||safe||(touring&&s.id===st.last);if(!show)return;
    const col=found?PAL['s3']:safe?PAL['s2']:PAL['s1'];ctx.strokeStyle=col;ctx.lineWidth=3.5;ctx.beginPath();ctx.ellipse(s.r[0]+s.r[2]/2,s.r[1]+s.r[3]/2,s.r[2]/2+8,s.r[3]/2+8,0,0,6.29);ctx.stroke();});
  const fs=14*k;pill(ctx,'Hazards found: '+st.found.length+' of '+NHZ,560,30,PAL['card'],PAL['cv-ink'],fs);
  const s=st.last&&SP[st.last];if(s&&!touring){ctx.font='700 '+13*k+'px '+FONT;pill(ctx,(s.hz?'✓ ':'')+s.t,clamp(s.r[0]+s.r[2]/2,ctx.measureText(s.t).width/2+30,770-ctx.measureText(s.t).width/2),s.r[1]>380?s.r[1]-22:Math.min(440,s.r[1]+s.r[3]+22),s.hz?PAL['s3']:PAL['s2'],'#fff',13*k);}
}

/* ---------- precision ladder ---------- */
const PY=i=>112+i*52;
function drawPrec(sim,ctx,k,t){const p=sim.p;txt(ctx,'Measuring 25 mL: how precise is each tool?',24,36,{s:17*k,w:700});
  const bx0=470,bx1=780,lg=v=>bx0+(Math.log10(v)-Math.log10(0.01))/(Math.log10(2)-Math.log10(0.01))*(bx1-bx0);
  txt(ctx,'Uncertainty (mL, log scale)',(bx0+bx1)/2,76,{s:12*k,c:PAL['cv-soft'],a:'center'});
  [0.01,0.1,1].forEach(v=>{const x=lg(v);ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,88);ctx.lineTo(x,PY(PREC.length-1)+26);ctx.stroke();txt(ctx,String(v),x,PY(PREC.length-1)+44,{s:12*k,c:PAL['cv-soft'],a:'center'});});
  PREC.forEach((r,i)=>{const y=PY(i),sel=p.item===r.id;if(sel){ctx.fillStyle=PAL['card'];rr(ctx,14,y-23,772,46,8);ctx.fill();ctx.strokeStyle=PAL['rj'];ctx.lineWidth=2;ctx.stroke();}
    txt(ctx,r.n,24,y-3,{s:14*k,w:700});txt(ctx,r.ut,24,y+16,{s:12*k,c:PAL['cv-soft']});txt(ctx,r.rec,450,y+6,{s:18*k,w:800,a:'right',c:sel?PAL['rj']:PAL['cv-ink']});
    const x=lg(r.u);ctx.fillStyle=r.u>=1?PAL['s1']:r.u>=0.2?PAL['s4']:PAL['s3'];rr(ctx,bx0,y-9,Math.max(6,x-bx0),18,5);ctx.fill();});
  txt(ctx,'Shorter bar = more precise',bx1,PY(PREC.length-1)+62,{s:12*k,c:PAL['cv-soft'],a:'right'});}

SIM.controls[0].onChange=function(sim){sim.st.res=null;syncModes(sim);};
BioLab.register(SIM);
})();
