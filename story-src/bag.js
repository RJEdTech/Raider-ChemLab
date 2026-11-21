/* ============================================================
   Gas pressure story pilot · Raider ChemLab · RJ Ed Tech
   "The bag that swells": a sealed bag of chips on the drive from
   Denver (5,280 ft) to the Eisenhower Tunnel (11,158 ft).
   Model: ideal gas, P = P_Denver x (n/36) x (T/293 K) x (0.50 L / V).
   Outside air pressure from the standard atmosphere.
   ============================================================ */
const SITE='ChemLab',PAGE='pressure-story',KEY='rjchemlab-bagstory-v1',EVB='pressure',EVT='Gas pressure story';
const LW=1000,LH=560;
const cv=$('#stage'),ctx=cv.getContext('2d');let PX=1;
const W=new World(),WO=new World();
let S={guess:{},sketch:[],order:[],tries:0,text:'',name:'',seen:{},ans:'',miss:0};
try{Object.assign(S,JSON.parse(localStorage.getItem(KEY)||'{}'))}catch(e){}
try{S.name=localStorage.getItem('raider-labs-name')||S.name||''}catch(e){}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}};
let cur=0,st={},paused=false,lastCap='';
const NOWORLD=i=>!!STEPS[i].nw,PAUSEOK=i=>!STEPS[i].nw;

/* ---------- the physics ---------- */
const P_SEA=101.325,altP=ft=>P_SEA*Math.pow(1-2.25577e-5*ft*.3048,5.25588);     // standard atmosphere, kPa
const STOPS=[{ft:0,name:'Sea level',short:'Sea level'},{ft:5280,name:'Denver',short:'Denver · 5,280 ft'},{ft:11158,name:'Eisenhower Tunnel',short:'Eisenhower Tunnel · 11,158 ft'}];
STOPS.forEach(s=>s.p=altP(s.ft));
const P_DEN=STOPS[1].p,P_TUN=STOPS[2].p,VB=.5,T0=293.15,N0=36;
const pIn=(n,T,V)=>P_DEN*(n/N0)*(T/T0)*(VB/V);
const INC=()=>PAL.split,OUTC=()=>PAL.join;
function gasBox(w,n,box,o={}){w.setup(Object.assign({n4:0,n2:0,T:T0,box,sc:5,react:false},o));w.hitR=w.hitL=null;w.vk=1;for(let i=0;i<n;i++)w.add('N');return w}
function track(w,side,col){w.hits=[];w.kick=0;const f=p=>{w.hits.push(w.t);w.kick=1;w.fl.push({kind:'h',x:side==='R'?w.x1-3:w.box.x+3,y:p.y,t:w.t,col:col()})};if(side==='R')w.hitR=f;else w.hitL=f}
function hitRate(w,win=5){w.hits=w.hits.filter(t=>w.t-t<win);return w.hits.length/Math.min(win,Math.max(w.t,1))}
function foil(x,y,h,held){const g=ctx.createLinearGradient(x,0,x+9,0);g.addColorStop(0,'#9aa3ad');g.addColorStop(.5,'#e9edf1');g.addColorStop(1,'#8a939d');ctx.fillStyle=g;rr(ctx,x,y-6,9,h+12,4);ctx.fill();
  if(held){pill(ctx,'wall held still',x+4,y+20,PAL.think,'#fff',13,'center')}}

/* ---------- story pictures: the road and the bag ---------- */
function drawBag(cx,cy,w,h,puff){puff=clamp(puff,0,1);const b=w*(.03+.11*puff),x0=cx-w/2,x1=cx+w/2,y0=cy-h/2,y1=cy+h/2;
  ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x1,y0);ctx.bezierCurveTo(x1+b,y0+h*.25,x1+b,y1-h*.25,x1,y1);ctx.lineTo(x0,y1);ctx.bezierCurveTo(x0-b,y1-h*.25,x0-b,y0+h*.25,x0,y0);ctx.closePath();
  const g=ctx.createLinearGradient(x0-b,0,x1+b,0);g.addColorStop(0,'#c98a0c');g.addColorStop(.3+.15*puff,'#ffd65a');g.addColorStop(.62,'#f2b21d');g.addColorStop(1,'#b97706');ctx.fillStyle=g;ctx.fill();ctx.strokeStyle='#8a5a00';ctx.lineWidth=2;ctx.stroke();
  ctx.save();ctx.clip();ctx.fillStyle='#b3261e';ctx.fillRect(x0-b,cy-h*.16,w+2*b,h*.3);ctx.restore();
  txt(ctx,'CHIPS',cx,cy+1,{s:h*.15,w:800,c:'#fff',a:'center',b:'middle'});
  ctx.fillStyle='#d9a21a';ctx.strokeStyle='#8a5a00';[[y0-10,10],[y1,10]].forEach(([y,hh])=>{ctx.fillRect(x0,y,w,hh);ctx.strokeRect(x0,y,w,hh);ctx.lineWidth=1;for(let x=x0+6;x<x1;x+=7){ctx.beginPath();ctx.moveTo(x,y+1);ctx.lineTo(x,y+hh-1);ctx.stroke()}ctx.lineWidth=2});
  if(puff<.7){ctx.strokeStyle=`rgba(120,80,0,${.55*(1-puff/.7)})`;ctx.lineWidth=2;[[.2,.12,.34,.36],[.7,.1,.6,.3],[.24,.9,.4,.7],[.78,.86,.64,.66]].forEach(([a,b2,c,d])=>{ctx.beginPath();ctx.moveTo(x0+w*a,y0+h*b2);ctx.lineTo(x0+w*c,y0+h*d);ctx.stroke()})}
  ctx.strokeStyle=`rgba(255,255,255,${.25+.45*puff})`;ctx.lineWidth=4;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x0+w*.14,y0+h*.14);ctx.quadraticCurveTo(x0+w*.08-b*.4,cy,x0+w*.14,y1-h*.14);ctx.stroke()}
const ROAD=[[40,500],[170,470],[300,455],[390,410],[330,360],[450,320],[590,330],[660,280],[600,235],[720,200],[840,205],[905,168]];
function roadPt(u){u=clamp(u,0,1)*(ROAD.length-1);const i=Math.min(ROAD.length-2,Math.floor(u)),f=u-i,a=ROAD[i],b=ROAD[i+1];return{x:lerp(a[0],b[0],f),y:lerp(a[1],b[1],f),ang:Math.atan2(b[1]-a[1],b[0]-a[0])}}
function sceneRoad(u){const g=ctx.createLinearGradient(0,0,0,400);g.addColorStop(0,PAL.sky1);g.addColorStop(1,PAL.sky2);ctx.fillStyle=g;ctx.fillRect(0,0,LW,LH);
  const peak=(pts,col)=>{ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(0,LH);pts.forEach(p=>ctx.lineTo(p[0],p[1]));ctx.lineTo(LW,LH);ctx.closePath();ctx.fill()};
  peak([[0,330],[140,250],[260,300],[420,170],[560,250],[700,110],[840,190],[1000,90]],PAL.dark?'#3a4660':'#aebfd3');
  ctx.fillStyle=PAL.dark?'#cfd8e6':'#ffffff';[[700,110,46],[420,170,34],[1000,90,50]].forEach(([x,y,s])=>{ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-s,y+s*.8);ctx.lineTo(x-s*.3,y+s*.55);ctx.lineTo(x+s*.2,y+s*.85);ctx.lineTo(x+s*.9,y+s*.7);ctx.closePath();ctx.fill()});
  peak([[0,420],[200,360],[380,400],[520,290],[700,300],[860,180],[1000,200]],PAL.dark?'#2c3a34':'#7fa08a');
  peak([[0,520],[180,480],[420,470],[640,430],[1000,400]],PAL.dark?'#22302a':'#5f8a6c');
  ctx.strokeStyle=PAL.dark?'#15171b':'#4a4f58';ctx.lineWidth=13;ctx.lineJoin='round';ctx.lineCap='round';ctx.beginPath();ROAD.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.stroke();
  ctx.strokeStyle='#f2d24a';ctx.lineWidth=1.5;ctx.setLineDash([9,9]);ctx.beginPath();ROAD.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.stroke();ctx.setLineDash([]);
  ctx.fillStyle='#1c1c1f';ctx.beginPath();ctx.arc(912,166,17,Math.PI,0);ctx.lineTo(929,180);ctx.lineTo(895,180);ctx.closePath();ctx.fill();   // tunnel mouth
  const c=roadPt(u);ctx.save();ctx.translate(c.x,c.y-9);ctx.rotate(c.ang);ctx.fillStyle=PAL.rj;rr(ctx,-17,-7,34,12,4);ctx.fill();rr(ctx,-9,-14,18,9,4);ctx.fill();ctx.fillStyle='#1c1c1f';ctx.beginPath();ctx.arc(-10,6,4.5,0,TAU);ctx.arc(10,6,4.5,0,TAU);ctx.fill();ctx.restore();
  pill(ctx,'Denver · 5,280 ft',30,528,PAL.card,PAL.ink,15);pill(ctx,'Eisenhower Tunnel · 11,158 ft',972,132,PAL.card,PAL.ink,15,'right');
  const ft=lerp(5280,11158,u),p=altP(ft),V=VB*P_DEN/p,bx=166,by=196;rr(ctx,bx-140,by-128,280,290,16);ctx.fillStyle=PAL.card;ctx.globalAlpha=.94;ctx.fill();ctx.globalAlpha=1;ctx.strokeStyle=PAL.line;ctx.stroke();
  txt(ctx,'ON THE SEAT BESIDE YOU',bx,by-104,{s:12.5,w:700,c:PAL.soft,a:'center'});drawBag(bx,by+8,118,150,(V-VB)/(VB*P_DEN/P_TUN-VB));
  txt(ctx,(u>.97?11158:u<.03?5280:Math.round(ft/10)*10).toLocaleString()+' ft',bx,by+132,{s:20,w:700,a:'center'});txt(ctx,u<.03?'soft':u>.97?'puffed up tight':'swelling',bx,by+152,{s:15,c:PAL.soft,a:'center'})}

/* ---------- one molecule, then a crowd, hitting the wall ---------- */
const R_L={x:14,y:14,w:640,h:532},R_M={x:666,y:14,w:320,h:532};
function sceneHits(o){card(ctx,R_L,o.title);const b=W.box;rr(ctx,b.x,b.y,b.w,b.h,8);ctx.fillStyle=PAL.box;ctx.fill();ctx.strokeStyle=PAL.dark?'#5d6370':'#8a94a0';ctx.lineWidth=2;ctx.stroke();
  if(o.trail){st.tr=st.tr||[];const p=W.ps[0];if(p&&!paused){st.tr.push([p.x,p.y]);if(st.tr.length>26)st.tr.shift()}st.tr.forEach((q,i)=>{ctx.fillStyle=PAL.N;ctx.globalAlpha=.05+.3*i/st.tr.length;ctx.beginPath();ctx.arc(q[0],q[1],4+8*i/st.tr.length,0,TAU);ctx.fill()});ctx.globalAlpha=1}
  W.draw(ctx,{noFrame:true});W.kick=(W.kick||0)*.86;foil(W.x1+W.kick*5,b.y,b.h);txt(ctx,'the bag wall',W.x1+4,b.y+b.h+30,{s:14.5,w:600,c:PAL.soft,a:'center'});
  txt(ctx,'nitrogen, N₂',b.x+8,b.y+b.h+30,{s:14.5,c:PAL.soft});drawMol(ctx,'N',b.x+122,b.y+b.h+25,0,9,{});
  card(ctx,R_M,o.mTitle);const x=R_M.x+18,w=R_M.w-36;let y=R_M.y+62;
  txt(ctx,'Hits on the wall',x,y,{s:15,c:PAL.soft});txt(ctx,hitRate(W).toFixed(hitRate(W)<3?1:0),x,y+40,{s:38,w:700});txt(ctx,'each second (counted)',x+78,y+38,{s:14.5,c:PAL.soft});y+=84;
  if(o.rect){const f=Math.sqrt(W.T/T0),u=92,ox=x+70,oy=y+226;st.f=st.f===undefined?f:lerp(st.f,f,.12);const ww=st.f*u,hh=st.f*u;
    txt(ctx,'The push on the wall',x,y,{s:15,c:PAL.soft});ctx.strokeStyle=PAL.soft;ctx.setLineDash([5,5]);ctx.lineWidth=1.5;ctx.strokeRect(ox,oy-u,u,u);ctx.setLineDash([]);
    ctx.fillStyle=INC();ctx.globalAlpha=.85;ctx.fillRect(ox,oy-hh,ww,hh);ctx.globalAlpha=1;
    txt(ctx,'how often it hits  ×'+f.toFixed(1),ox,oy+22,{s:14.5,w:600});ctx.save();ctx.translate(ox-12,oy);ctx.rotate(-Math.PI/2);txt(ctx,'how hard  ×'+f.toFixed(1),0,0,{s:14.5,w:600});ctx.restore();
    txt(ctx,'push = often × hard = ×'+(f*f).toFixed(1),x,oy+56,{s:16.5,w:700,c:INC(),max:w});txt(ctx,'dashed square: room temperature',x,oy+80,{s:13,c:PAL.soft})}
  else{const P=pIn(W.ps.length,W.T,VB);txt(ctx,'The steady push',x,y,{s:15,c:PAL.soft});rr(ctx,x,y+14,w,34,6);ctx.fillStyle=PAL.card2;ctx.fill();rr(ctx,x,y+14,Math.max(6,w*clamp(P/100,0,1)),34,6);ctx.fillStyle=INC();ctx.fill();
    if(o.kpa){txt(ctx,P.toFixed(0),x,y+98,{s:38,w:700});txt(ctx,'kPa (kilopascals)',x+78,y+96,{s:14.5,c:PAL.soft});txt(ctx,'Pressure: the push from all the hits',x,y+134,{s:14.5,w:600,max:w});txt(ctx,'on each bit of wall.',x,y+154,{s:14.5,w:600});
      txt(ctx,'Sea-level air pushes at 101 kPa.',x,y+190,{s:13.5,c:PAL.soft,max:w});txt(ctx,'Denver air pushes at 83 kPa.',x,y+210,{s:13.5,c:PAL.soft,max:w})}
    txt(ctx,W.ps.length+' molecule'+(W.ps.length===1?'':'s')+' in the box',x,R_M.y+R_M.h-22,{s:15,w:600})}}

/* ---------- both sides of the bag wall ---------- */
const R_SEE={x:14,y:14,w:206,h:532},R_Z={x:232,y:14,w:508,h:532},R_P={x:752,y:14,w:234,h:262},R_A={x:752,y:288,w:234,h:258},IX=246,BY=58,BH=404,WPX=230,OX1=726,WALL=11;
function bagWorlds(){gasBox(W,N0,{x:IX,y:BY,w:WPX*2.2,h:BH},{V:1,Vmax:2.2});track(W,'R',INC);gasBox(WO,0,{x:IX+WPX+WALL,y:BY,w:OX1-IX-WPX-WALL,h:BH});track(WO,'L',OUTC);
  const n=Math.round(N0*WO.box.w/WPX);for(let i=0;i<n;i++)WO.add(Math.random()<.21?'O':'N');st.V=VB;st.pout=P_DEN;st.ptar=P_DEN;st.stop=1;st.held=false}
function bagTick(dt){st.pout+=clamp(st.ptar-st.pout,-6*dt,6*dt);const Pin=pIn(N0,T0,st.V);if(!st.held)st.V=clamp(st.V+1.0*(Pin-st.pout)/P_DEN*VB*dt,.3,.8);
  W.V=W.Vt=st.V/VB;const wx=W.x1;WO.box.x=wx+WALL;WO.box.w=OX1-WO.box.x;
  const target=Math.round(N0/WPX*(st.pout/P_DEN)*WO.box.w),live=WO.ps.filter(p=>!p.leave);
  if(live.length>target){const p=live[Math.floor(Math.random()*live.length)];p.leave=true;p.vx=Math.abs(p.vx)+70}
  else if(live.length<target)WO.add(Math.random()<.21?'O':'N',WO.x1-8,BY+12+Math.random()*(BH-24),-WO.vth('N')*(.5+Math.random()*.5),gauss()*40);
  WO.step(dt)}
function settled(){return Math.abs(pIn(N0,T0,st.V||VB)-(st.pout||P_DEN))<.6&&Math.abs((st.pout||0)-(st.ptar||0))<.1}
function sceneBag(){const Pin=pIn(N0,T0,st.V),wx=W.x1,puff=(st.V-VB*P_DEN/P_SEA)/(VB*P_DEN/P_TUN-VB*P_DEN/P_SEA);
  card(ctx,R_SEE,'What you see');drawBag(R_SEE.x+R_SEE.w/2,230,104,150,puff);const ft=altFt(st.pout);
  const sp=STOPS.find(q=>Math.abs(q.ft-ft)<120);txt(ctx,(sp?sp.ft:Math.round(ft/10)*10).toLocaleString()+' ft',R_SEE.x+R_SEE.w/2,372,{s:22,w:700,a:'center'});txt(ctx,nearStop(ft),R_SEE.x+R_SEE.w/2,396,{s:15,c:PAL.soft,a:'center',max:R_SEE.w-16});
  txt(ctx,'Bag: '+st.V.toFixed(2)+' L',R_SEE.x+R_SEE.w/2,446,{s:18,w:700,a:'center'});txt(ctx,puff<.3?'limp':puff<.5?'soft':puff>.92?'puffed up tight':'firmer',R_SEE.x+R_SEE.w/2,470,{s:15,c:PAL.soft,a:'center'});
  card(ctx,R_Z,'Zoomed in: the bag wall, from both sides');
  ctx.fillStyle=PAL.dark?'rgba(242,161,60,.07)':'rgba(201,106,0,.06)';rr(ctx,IX,BY,wx-IX,BH,8);ctx.fill();ctx.fillStyle=PAL.dark?'rgba(76,201,192,.07)':'rgba(15,139,141,.06)';rr(ctx,wx+WALL,BY,OX1-wx-WALL,BH,8);ctx.fill();
  W.draw(ctx,{noFrame:true});WO.draw(ctx,{noFrame:true});W.kick=(W.kick||0)*.86;WO.kick=(WO.kick||0)*.86;foil(wx+1+(W.kick-WO.kick)*3,BY,BH,st.held);
  txt(ctx,'inside the bag: nitrogen',IX+4,BY+BH+28,{s:14.5,w:600,c:INC()});txt(ctx,'outside: air',OX1-4,BY+BH+28,{s:14.5,w:600,c:OUTC(),a:'right'});
  txt(ctx,W.ps.length+' molecules',IX+4,BY+BH+50,{s:14,c:PAL.soft});txt(ctx,WO.ps.filter(p=>!p.leave).length+' in view',OX1-4,BY+BH+50,{s:14,c:PAL.soft,a:'right'});
  drawPair(ctx,R_P,[{name:'Push from inside',v:Pin,col:INC()},{name:'Push from outside',v:st.pout,col:OUTC()}],{title:'On the bag wall',max:110,unit:'kPa',status:{more0:'Inside wins: wall moves out',more1:'Outside wins: wall moves in',bal:'Balanced: wall stays put'}});
  card(ctx,R_A,'Where you are');const ax=R_A.x+22,aw=R_A.w-44,ay=R_A.y+226,ah=138,pts=STOPS.map((s,i)=>({x:ax+aw*[0,.42,1][i],y:ay-ah*s.ft/11158,s}));
  ctx.fillStyle=PAL.dark?'#2c3a34':'#cfdccf';ctx.beginPath();ctx.moveTo(ax-8,ay+8);pts.forEach(p=>ctx.lineTo(p.x,p.y));ctx.lineTo(ax+aw+8,ay-ah-4);ctx.lineTo(ax+aw+8,ay+8);ctx.closePath();ctx.fill();
  pts.forEach((p,i)=>{ctx.fillStyle=PAL.soft;ctx.beginPath();ctx.arc(p.x,p.y,4,0,TAU);ctx.fill();txt(ctx,p.s.name==='Eisenhower Tunnel'?'Tunnel':p.s.name,i===2?p.x+4:p.x,p.y+(i===2?-12:22),{s:12.5,c:PAL.ink,w:600,a:i===0?'left':i===2?'right':'center'})});
  const u=ft<=5280?ft/5280*.42:.42+(ft-5280)/(11158-5280)*.58,cx=ax+aw*u,cy=ay-ah*ft/11158;ctx.fillStyle=PAL.rj;ctx.beginPath();ctx.arc(cx,cy,8,0,TAU);ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.stroke();
  txt(ctx,'Outside air: '+st.pout.toFixed(0)+' kPa',R_A.x+14,R_A.y+48,{s:15,w:700,c:OUTC()})}
const altFt=p=>(1-Math.pow(p/P_SEA,1/5.25588))/2.25577e-5/.3048;
const nearStop=ft=>{const s=STOPS.find(s=>Math.abs(s.ft-ft)<120);return s?s.name:ft>5280?'on I-70, climbing':'heading down'};

/* ---------- the rule as a picture: pressure x volume ---------- */
const R_G={x:14,y:14,w:472,h:532},R_R={x:498,y:14,w:488,h:532},BR={x:36,y:64,w:420,h:286},RX=566,RY=474,SX=345,SY=2;
function rectWorld(n,T,V){gasBox(W,Math.round(n),BR,{V:V/VB,Vmax:2,T,sc:4.4});track(W,'R',INC);st.n=n;st.T=T;st.V=V;st.trace=[]}
function sceneRect(o={}){const n=st.n,T=st.T,V=st.V,P=o.unknown?P_TUN:pIn(n,T,V);W.V=W.Vt=V/VB;card(ctx,R_G,'The gas');const b=W.box;
  rr(ctx,b.x,b.y,b.w,b.h,8);ctx.fillStyle=PAL.card2;ctx.fill();rr(ctx,b.x,b.y,W.x1-b.x,b.h,8);ctx.fillStyle=PAL.box;ctx.fill();W.draw(ctx,{noFrame:true});W.kick=(W.kick||0)*.86;foil(W.x1+W.kick*4,b.y,b.h);
  if(o.drag){ctx.fillStyle=PAL.think;ctx.beginPath();const hx=W.x1+4,hy=b.y+b.h/2;ctx.arc(hx,hy,15,0,TAU);ctx.fill();txt(ctx,'↔',hx,hy+1,{s:18,w:800,c:'#fff',a:'center',b:'middle'})}
  const y=b.y+b.h+44,x=R_G.x+22;[['Room (volume)',o.unknown?'? L':V.toFixed(2)+' L'],[o.unknown?'Pressure at the tunnel':'Pressure',P.toFixed(1)+' kPa'],['Molecules in the box',String(W.ps.length)],['Temperature',Math.round(T-273.15)+' °C  ('+Math.round(T)+' K)']].forEach((q,i)=>{txt(ctx,q[0],x,y+i*30,{s:15.5,c:PAL.soft});txt(ctx,q[1],x+418,y+i*30,{s:17,w:700,a:'right'})});
  card(ctx,R_R,'The gas as a rectangle');
  ctx.strokeStyle=PAL.line;ctx.lineWidth=1;for(let k=0;k<=4;k++){const yy=RY-k*50*SY;ctx.beginPath();ctx.moveTo(RX,yy);ctx.lineTo(RX+1.1*SX,yy);ctx.stroke();txt(ctx,String(k*50),RX-8,yy,{s:13,c:PAL.soft,a:'right',b:'middle'})}
  for(let k=1;k<=4;k++){const xx=RX+k*.25*SX;ctx.beginPath();ctx.moveTo(xx,RY);ctx.lineTo(xx,RY+6);ctx.stroke();txt(ctx,(k*.25).toFixed(2),xx,RY+22,{s:13,c:PAL.soft,a:'center'})}
  ctx.strokeStyle=PAL.soft;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(RX,RY-205*SY);ctx.lineTo(RX,RY);ctx.lineTo(RX+1.1*SX+6,RY);ctx.stroke();
  txt(ctx,'room (volume), liters →',RX+1.1*SX,RY+46,{s:14,c:PAL.soft,a:'right'});ctx.save();ctx.translate(RX-44,RY-205*SY);ctx.rotate(-Math.PI/2);txt(ctx,'pressure, kPa →',0,0,{s:14,c:PAL.soft,a:'right'});ctx.restore();
  if(o.ghost){ctx.setLineDash([6,5]);ctx.strokeStyle=PAL.soft;ctx.lineWidth=2;ctx.strokeRect(RX,RY-o.ghost.P*SY,o.ghost.V*SX,o.ghost.P*SY);ctx.setLineDash([]);txt(ctx,o.ghost.label,RX+o.ghost.V*SX+6,RY-o.ghost.P*SY+4,{s:13,c:PAL.soft})}
  if(st.trace&&st.trace.length>1){ctx.fillStyle=PAL.think;st.trace.forEach(q=>{ctx.beginPath();ctx.arc(RX+q[0]*SX,RY-q[1]*SY,2.6,0,TAU);ctx.fill()})}
  const rw=(o.unknown?1.05:V)*SX,rh=Math.min(P,204)*SY;ctx.fillStyle=INC();ctx.globalAlpha=o.unknown?.25:.8;ctx.fillRect(RX,RY-rh,rw,rh);ctx.globalAlpha=1;ctx.strokeStyle=INC();ctx.lineWidth=2.5;if(o.unknown)ctx.setLineDash([8,6]);ctx.strokeRect(RX,RY-rh,rw,rh);ctx.setLineDash([]);
  if(o.unknown){txt(ctx,'? liters wide',RX+rw/2,RY-rh/2,{s:22,w:800,c:PAL.think,a:'center',b:'middle'});txt(ctx,'area must stay '+(pIn(N0,T0,VB)*VB).toFixed(1),RX+rw/2,RY-rh/2+28,{s:15,w:600,a:'center'})}
  else{const big=rw>150&&rh>52;txt(ctx,'area = '+(P*V).toFixed(1),big?RX+rw/2:RX+rw+10,big?RY-rh/2:RY-rh/2,{s:20,w:800,c:big?'#fff':PAL.ink,a:big?'center':'left',b:'middle'});
    ctx.fillStyle=PAL.think;ctx.beginPath();ctx.arc(RX+rw,RY-rh,6,0,TAU);ctx.fill()}
  txt(ctx,o.unknown?'P × V = 66.6 × ? = 41.7':'P × V = '+P.toFixed(1)+' × '+V.toFixed(2)+' = '+(P*V).toFixed(1),R_R.x+R_R.w-16,R_R.y+26,{s:16,w:700,a:'right'});
  if(!paused&&!o.unknown&&o.traceOn){const t=st.trace,l=t[t.length-1];if(!l||Math.abs(l[0]-V)>.012)t.push([V,P])}}

/* ---------- captions ---------- */
const CAP={
 one0:'Chip bags are filled with nitrogen, N₂. Here is one molecule of it. Each time it hits the bag wall, it gives the wall a tiny push. <b>Change its speed and watch the wall.</b>',
 one1:'Hotter means faster. A faster molecule hits <b>more often</b>, and each hit is <b>harder</b>. So the push grows twice over: often × hard.',
 many0:'One molecule gives the wall a tap now and then. A crowd gives so many taps that they blur into one steady push. <b>Guess first, then add molecules.</b>',
 many1:'Twice the molecules, twice the hits, twice the push. That steady push on each bit of wall is <b>pressure</b>. It is measured in kilopascals, kPa.',
 both:'Now the real bag wall, seen from both sides. Nitrogen pushes on it from inside. Denver’s air pushes on it from outside. The two pushes match, 83 kPa each, so the wall stays put and the bag is soft.',
 up0:'<b>Drive up to the Eisenhower Tunnel</b> and watch the air outside the bag.',
 upGap:'Higher up, the air is thinner: fewer molecules outside, so fewer hits from outside. Inside, nothing has changed yet. The wall is held still for a moment so you can see the gap.',
 upCatch:'The bigger push wins and moves the wall outward. Now the gas inside has more room, so its molecules reach the wall less often.',
 upBal:'The pushes match again at 67 kPa, with the bag about a quarter bigger. Nothing was added. The outside just stopped pushing back as hard.',
 live:'Try the other stops. The wall always moves toward the weaker push until the two match.',
 rect0:'Draw the gas as a rectangle. Its height is the <b>pressure</b>. Its width is the <b>room</b> it has, its volume. <b>Drag the wall back and forth.</b> What stays the same?',
 rect1:'Squeeze it and the rectangle gets taller. Give it room and it gets wider. The area never changes: pressure × volume stays the same. This is <b>Boyle’s law</b>. The pink dots trace its curve.',
 area0:'What sets the area? Two things. <b>Change the number of molecules, then the temperature.</b>',
 area1:'More molecules, more area. Hotter, more area. Chemists write it P × V = n × R × T. Here n counts the molecules, T is the temperature in kelvin, and R is the number that makes the units agree.',
 use0:'Denver: 83.4 kPa and 0.50 L, so the area is 41.7. At the tunnel the outside air pushes at only 66.6 kPa. Same molecules, same temperature. <b>How many liters is the bag now?</b>',
 use1:'Yes. 41.7 ÷ 66.6 = 0.63 L. Less pressure, so more room, and the area holds at 41.7. <b>One more guess, going the other way.</b>',
 use2:'It crushes inward. Denver’s thicker air pushes harder than the thin tunnel air sealed inside. The bottle shrinks about a fifth, until the squeezed gas pushes back just as hard.',
};
const PARTS=['The bag','One molecule','A crowd','Both sides','The rule','Use it','Your turn'];
const esc=s=>String(s||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function picks(key,q,opts,right,after){const g=S.guess[key];if(after&&g!==undefined)return `<p class="note">Your guess: <b>${opts[g].toLowerCase()}</b> <span class="chip ${g===right?'ok':'no'}">${g===right?'✓ matched':'✗ not this time'}</span></p>`;
  return `<div class="pick" data-key="${key}"><p class="q">${q}</p><div class="row">${opts.map((o,i)=>`<button type="button" class="btn opt${g===i?' on':''}" data-i="${i}" aria-pressed="${g===i}">${o}</button>`).join('')}</div></div>`}
function bindPicks(root,fn){$$('.pick .opt',root).forEach(b=>b.addEventListener('click',()=>{const k=b.closest('.pick').dataset.key;S.guess[k]=+b.dataset.i;save();ev('guess-'+k+'-'+b.dataset.i);fn&&fn(k,+b.dataset.i);renderCtl()}))}
const chips=(lab,attr,list,curv)=>`<div class="row"><span class="lab">${lab}</span>${list.map(([v,l])=>`<button type="button" class="btn${curv===v?' on':''}" data-${attr}="${v}" aria-pressed="${curv===v}">${l}</button>`).join('')}</div>`;
const WHY=['The gas inside got warmer','The air outside pushes less','Extra air leaked in'];

const STEPS=[
 {part:0,nw:1,title:'The bag that swells',
  cap:'You leave Denver with a soft bag of chips on the seat. An hour up I-70, at the Eisenhower Tunnel, the same bag is puffed up tight. Nobody opened it. What made it swell?',
  alt:'The bag is sealed, so nothing gets in or out. Whatever changed has to be about pushing: something pushing the bag out more, or something pushing it in less.',
  aria:'A car climbs a mountain road from Denver at 5,280 feet to the Eisenhower Tunnel at 11,158 feet. A sealed bag of chips on the seat swells as the car climbs.',
  draw(){const u=RM?1:clamp(((st.t%11)-1)/7,0,1);sceneRoad(ease(u))},
  ctl(){return picks('why','Your guess:',WHY)+(S.guess.why!==undefined?'<p class="note">Locked in. You will test it in Part 4.</p>':'')},bind(r){bindPicks(r,()=>markDone())}},
 {part:1,title:'One molecule, one push',cap:CAP.one0,
  alt:'Think of a machine throwing tennis balls at a door. Turn up the speed and the balls arrive more often, and each one shoves the door harder.',
  aria:'One nitrogen molecule bounces around a box. Each time it hits the right-hand wall, the wall flashes and jolts. A square shows the push as how often it hits times how hard it hits.',
  enter(){gasBox(W,0,{x:150,y:110,w:340,h:290},{sc:17});W.vk=2.6;const v=W.vth('N');W.add('N',290,240,v*.86,v*.5);track(W,'R',INC);st.tc=20},
  draw(){sceneHits({title:'Zoomed in: one molecule of the gas in the bag',mTitle:'What the wall feels',trail:true,rect:true})},
  ctl(){return chips('Temperature:','tc',[[-100,'Cold · −100 °C'],[20,'Room · 20 °C'],[300,'Hot · 300 °C']],st.tc)},
  bind(r){$$('[data-tc]',r).forEach(b=>b.addEventListener('click',()=>{st.tc=+b.dataset.tc;W.setT(st.tc+273.15);W.hits=[];W.t=0;st.did=true;cap(CAP.one1);markDone();renderCtl()}))}},
 {part:2,title:'A crowd makes a steady push',cap:CAP.many0,
  alt:'One raindrop on a roof is a tap. A downpour is a steady weight. Pressure is the downpour: so many small hits that you feel one push.',
  aria:'A box of nitrogen molecules. More molecules give more hits on the wall each second and a bigger steady push, shown in kilopascals.',
  enter(){st.n=9;this.fill()},fill(){gasBox(W,st.n,{x:40,y:56,w:560,h:420},{sc:4.6});W.vk=1.5;W.ps.forEach(p=>{p.vx*=1.5;p.vy*=1.5});track(W,'R',INC)},
  draw(){sceneHits({title:'Zoomed in: more of the gas',mTitle:'What the wall feels',kpa:st.did})},
  ctl(){return picks('dbl','Twice as many molecules in the same box. The push on the wall will…',['stay the same','double','be four times as big'],1,st.did)+chips('Molecules:','n',[[9,'9'],[18,'18'],[36,'36']],st.n)},
  bind(r){bindPicks(r);$$('[data-n]',r).forEach(b=>b.addEventListener('click',()=>{st.n=+b.dataset.n;STEPS[2].fill();if(st.n>9){st.did=true;cap(CAP.many1);markDone()}renderCtl()}))}},
 {part:3,title:'Both sides of the bag',cap:CAP.both,
  alt:'Picture a door with a crowd leaning on each side. If both crowds lean equally hard, the door does not move, however hard they push.',
  aria:'The bag wall seen from both sides. Nitrogen molecules hit it from inside the bag and air molecules hit it from outside. Two bars show the push from each side: 83 kilopascals each, balanced.',
  enter(){bagWorlds()},tick:bagTick,draw:sceneBag},
 {part:3,title:'Drive up to the tunnel',cap:CAP.up0,
  alt:'Two crowds lean on a door. One crowd thins out. The door swings toward the thin side, until the big crowd has spread out enough to lean just as lightly.',
  aria:'As the car climbs, air molecules outside the bag thin out and the push from outside drops to 67 kilopascals. The wall moves outward, the gas inside spreads out, and the two pushes match again with a bigger bag.',
  enter(from){if(from!==3||!W.ps.length)bagWorlds();else{st.V=st0.V;st.pout=st0.pout;st.ptar=st0.ptar;st.stop=1;st.held=false}st.beat=0},
  tick(dt){bagTick(dt);if(st.beat===0)return;const there=Math.abs(st.pout-st.ptar)<.1;
    if(st.beat===1){cap(CAP.upGap);if(there&&!st.btn){st.btn=true;renderCtl()}return}
    if(st.beat===2){const ok=settled();cap(ok?CAP.upBal:CAP.upCatch);if(ok){st.beat=3;st.tested=true;markDone();renderCtl()}return}
    if(st.beat===3&&st.moved)cap(CAP.live)},
  draw:sceneBag,
  ctl(){const g=S.guess.why;return (st.tested&&g!==undefined?`<p class="note">Your guess: <b>${WHY[g].toLowerCase()}</b> <span class="chip ${g===1?'ok':'no'}">${g===1?'✓ matched':'✗ not this time'}</span></p>`:'')+
    `<div class="row"><span class="lab">Go to:</span>${STOPS.map((s,i)=>`<button type="button" class="btn${st.stop===i?' on':''}" data-stop="${i}" aria-pressed="${st.stop===i}" ${st.beat<3&&i!==2?'disabled':''}>${s.short}</button>`).join('')}</div>`+(st.beat===1&&st.btn?'<div class="row"><button type="button" class="btn primary act pulse" data-beat="1">Let the wall move ▶</button></div>':'')},
  bind(r){$$('[data-stop]',r).forEach(b=>b.addEventListener('click',()=>{const i=+b.dataset.stop;if(i===st.stop)return;st.stop=i;st.ptar=STOPS[i].p;if(st.beat===0){st.beat=1;st.held=true}else st.moved=true;renderCtl()}));
    const b=$('[data-beat]',r);b&&b.addEventListener('click',()=>{st.held=false;st.beat=2;renderCtl()})}},
 {part:4,title:'The rule as a picture',cap:CAP.rect0,
  alt:'Same molecules, same speed. In half the room each one reaches the wall twice as often, so the push doubles. Half as wide, twice as tall: the same area.',
  aria:'A box of gas with a wall you can drag. Beside it a rectangle whose height is the pressure and whose width is the volume. As the wall moves the rectangle changes shape but its area stays 41.7.',
  enter(){rectWorld(N0,T0,VB);st.lo=st.hi=VB},
  tick(){if(!st.did&&st.hi-st.lo>.3){st.did=true;cap(CAP.rect1);markDone()}},
  draw(){sceneRect({drag:true,traceOn:true})},
  ctl(){return `<div class="row sl"><label>Room <input type="range" min="0.25" max="1" step="0.01" value="${st.V}" data-v="1" aria-label="Room, in liters"><output>${st.V.toFixed(2)} L</output></label></div>`},
  bind(r){$('[data-v]',r).addEventListener('input',e=>setV(+e.target.value))}},
 {part:4,title:'What sets the area?',cap:CAP.area0,
  alt:'The area is how many molecules there are times how fast they move. Room and pressure can trade against each other, but together they cannot change that total.',
  aria:'The same rectangle with the room held at half a liter. Doubling the molecules doubles its area. Heating the gas makes the area larger. A dashed outline shows the starting rectangle.',
  enter(){rectWorld(N0,T0,VB);st.nn=36;st.tc=20;st.tried={}},
  draw(){sceneRect({ghost:{P:P_DEN,V:VB,label:'36 molecules, 20 °C'}})},
  ctl(){return chips('Molecules:','nn',[[18,'18'],[36,'36'],[72,'72']],st.nn)+chips('Temperature:','tc',[[-20,'Winter night · −20 °C'],[20,'Car · 20 °C'],[60,'Hot dashboard · 60 °C']],st.tc)},
  bind(r){const done=()=>{if(st.tried.n&&st.tried.t){cap(CAP.area1);markDone()}renderCtl()};
    $$('[data-nn]',r).forEach(b=>b.addEventListener('click',()=>{const k=st.tried,tc=st.tc;st.nn=+b.dataset.nn;rectWorld(st.nn,tc+273.15,VB);st.nn=+b.dataset.nn;st.tc=tc;st.tried=k;if(st.nn!==36)k.n=1;done()}));
    $$('[data-tc]',r).forEach(b=>b.addEventListener('click',()=>{st.tc=+b.dataset.tc;st.T=st.tc+273.15;W.setT(st.T);if(st.tc!==20)st.tried.t=1;done()}))}},
 {part:5,title:'Use it: how big is the bag?',cap:CAP.use0,
  alt:'The rectangle’s area cannot change, so height × width must still be 41.7. The height is now 66.6. Divide 41.7 by 66.6 to get the width.',
  aria:'The rectangle for the gas at the tunnel: its height is 66.6 kilopascals and its width is unknown. The area must stay 41.7.',
  enter(){rectWorld(N0,T0,VB);st.mode=S.ans==='ok'?1:0;if(st.mode){st.V=VB*P_DEN/P_TUN;cap(CAP.use1)}},
  tick(dt){if(st.mode===1){const tg=VB*P_DEN/P_TUN;st.V+=clamp(tg-st.V,-.12*dt,.12*dt)}if(st.mode===2){const tg=VB*P_TUN/P_DEN;st.V+=clamp(tg-st.V,-.08*dt,.08*dt);if(Math.abs(st.V-tg)<.002)markDone()}},
  draw(){if(st.mode===0)sceneRect({unknown:true,ghost:{P:P_DEN,V:VB,label:'Denver'}});else sceneRect({ghost:st.mode===2?{P:P_TUN,V:VB,label:'sealed at the tunnel'}:{P:P_DEN,V:VB,label:'Denver'}})},
  ctl(){if(st.mode===0)return `<div class="row"><label class="nm">Liters <input id="ans" type="text" inputmode="decimal" size="6" autocomplete="off" aria-label="Your answer, in liters"></label><button type="button" class="btn primary" id="chk">Check</button>${S.miss>=2?'<button type="button" class="btn" id="show">Show me</button>':''}</div><p class="fb no" id="afb" role="status">${st.fb||''}</p>`;
    return picks('bottle','You finish a water bottle at the tunnel, cap it tight, and drive back down to Denver. The bottle will…',['swell','crush inward','stay the same'],1,st.mode===2)},
  bind(r){const chk=$('#chk',r);if(chk){const go1=()=>{const v=parseFloat($('#ans',r).value.replace(',','.'));if(isNaN(v)){st.fb='Type a number, like 0.55.';renderCtl();return}
      if(Math.abs(v-.626)<=.02){S.ans='ok';save();ev('answer-right');st.mode=1;st.fb='';cap(CAP.use1);renderCtl();return}
      S.miss++;save();ev('answer-wrong');st.fb=Math.abs(v-.4)<.03?'That is smaller than Denver. The outside pressure dropped, so the bag gets more room: divide 41.7 by 66.6.':v>30?'That looks like the area. Divide the area, 41.7, by the new pressure.':v<.5?'The outside pushes less at the tunnel, so the bag has to be bigger than 0.50 L.':'Not yet. Height × width must still be 41.7, and the height is now 66.6.';renderCtl()};
      chk.addEventListener('click',go1);$('#ans',r).addEventListener('keydown',e=>{if(e.key==='Enter')go1()});const sh=$('#show',r);sh&&sh.addEventListener('click',()=>{st.fb='41.7 ÷ 66.6 = 0.63. Type 0.63.';renderCtl()})}
    bindPicks(r,()=>{st.mode=2;rectWorld(N0*P_TUN/P_DEN,T0,VB);st.mode=2;cap(CAP.use2)})}},
 {part:6,nw:1,wide:true,title:'Now tell it back',
  cap:'You are at the tunnel with a bag as tight as a drum. <b>Now you explain why.</b>',
  alt:'Start outside the bag: what happens to the air as you climb? Then say what that does to the two pushes on the wall, and what the wall does next.',
  aria:'The car at the Eisenhower Tunnel with the bag of chips puffed up tight.',
  draw(){sceneRoad(1)},ctl:tellHTML,bind:tellBind},
];
function setV(v){st.V=clamp(v,.25,1);st.lo=Math.min(st.lo,st.V);st.hi=Math.max(st.hi,st.V);const o=$('#ctl output');if(o)o.textContent=st.V.toFixed(2)+' L';const i=$('#ctl [data-v]');if(i&&document.activeElement!==i)i.value=st.V}
let wallDrag=false;
cv.addEventListener('pointerdown',e=>{if(cur!==5)return;const p=pt(e);if(Math.abs(p.x-W.x1)<34&&p.y>BR.y-10&&p.y<BR.y+BR.h+10){wallDrag=true;cv.setPointerCapture(e.pointerId);e.preventDefault()}});
cv.addEventListener('pointermove',e=>{if(wallDrag)setV((pt(e).x-BR.x)/BR.w)});
['pointerup','pointercancel'].forEach(n=>cv.addEventListener(n,()=>{wallDrag=false}));

/* ---------- your turn ---------- */
const CARDS=[['Higher up: thinner air outside','<path d="M4 38L22 10l10 14 8-10 16 24z" fill="currentColor" opacity=".55"/><circle cx="46" cy="8" r="3" fill="#0f8b8d"/><circle cx="14" cy="6" r="3" fill="#0f8b8d"/>'],
 ['Fewer hits from outside, same from inside','<rect x="6" y="8" width="48" height="10" rx="3" fill="#c96a00"/><rect x="6" y="24" width="30" height="10" rx="3" fill="#0f8b8d"/>'],
 ['The wall moves out: more room inside','<rect x="26" y="4" width="7" height="34" rx="3" fill="#8a939d"/><path d="M38 21h16M47 13l8 8-8 8" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><circle cx="12" cy="14" r="4" fill="#c96a00"/><circle cx="16" cy="28" r="4" fill="#c96a00"/>'],
 ['Inside hits drop until the pushes match: a fatter bag','<rect x="6" y="8" width="30" height="10" rx="3" fill="#c96a00"/><rect x="6" y="24" width="30" height="10" rx="3" fill="#0f8b8d"/>']];
const SHUF=[2,0,3,1];
function tellHTML(){const o=S.order,done=o.length===4,right=done&&o.every((v,i)=>v===i);
  return `<div class="tell"><h3>1. Build the story</h3><p class="q">You drive from Denver up to the tunnel. Tap the four cards in the order things happen.</p>
  <div class="slots">${[0,1,2,3].map(i=>`<button type="button" class="slot${o[i]!==undefined?' full':''}" data-slot="${i}" ${o[i]===undefined?'disabled':''} aria-label="Spot ${i+1}${o[i]!==undefined?': '+CARDS[o[i]][0]+'. Tap to remove.':', empty'}"><span class="n">${i+1}</span>${o[i]!==undefined?`<svg viewBox="0 0 60 42" aria-hidden="true">${CARDS[o[i]][1]}</svg><span>${CARDS[o[i]][0]}</span>`:''}</button>`).join('')}</div>
  <div class="cards">${SHUF.filter(c=>!o.includes(c)).map(c=>`<button type="button" class="cardb" data-card="${c}"><svg viewBox="0 0 60 42" aria-hidden="true">${CARDS[c][1]}</svg><span>${CARDS[c][0]}</span></button>`).join('')}</div>
  <p class="fb ${right?'ok':done?'no':''}" role="status">${right?'That is the chain: a cause, a gap, the wall moves, a new balance.':done?'Not quite. Start outside the bag: what changes first as you climb? Tap a card to take it back.':''}</p>
  <h3>2. Say it in your own words</h3><p class="q">Why does the bag swell on the way up? Use the words <b>hits</b>, <b>pressure</b> and <b>volume</b>.</p>
  <textarea id="tx" rows="4" placeholder="Type your explanation here.">${esc(S.text)}</textarea>
  <h3>3. Turn it in</h3><p class="q">If your teacher assigned this, copy your work and paste it into the Canvas text box.</p>
  <div class="row"><label class="nm">Name <input id="nm" type="text" value="${esc(S.name)}" autocomplete="name"></label><button type="button" class="btn primary" id="copy">Copy for Canvas</button><span id="cmsg" role="status"></span></div>
  <div class="world"><h3>Where else you feel it</h3><p>Your ears pop on the same drive: air trapped behind your eardrum pushes out as the outside air thins. An airplane cabin is pumped up for the same reason. And a weather balloon swells as it rises until it bursts.</p>
  <p><a href="https://rjedtech.github.io/Raider-ChemLab/index.html#gaslaws">Try the gas laws in the full lab</a>, with real numbers for pressure, volume and temperature. More stories: <a href="https://rjedtech.github.io/Raider-ChemLab/equilibrium-story.html">The hatch that stayed shut</a> (equilibrium) and <a href="https://rjedtech.github.io/Raider-ChemLab/naming-story.html">One letter apart</a> (naming compounds).</p></div></div>`}
function tellBind(r){$$('[data-card]',r).forEach(b=>b.addEventListener('click',()=>{S.order.push(+b.dataset.card);if(S.order.length===4){S.tries++;ev('order-'+(S.order.every((v,i)=>v===i)?'right':'wrong'))}save();renderCtl()}));
  $$('[data-slot]',r).forEach(b=>b.addEventListener('click',()=>{S.order.splice(+b.dataset.slot,1);save();renderCtl()}));
  const tx=$('#tx',r),nm=$('#nm',r);tx.addEventListener('input',()=>{S.text=tx.value;save()});nm.addEventListener('input',()=>{S.name=nm.value;try{localStorage.setItem('raider-labs-name',nm.value)}catch(e){}save()});
  $('#copy',r).addEventListener('click',()=>{const g=S.guess,L=['Raider ChemLab · Gas pressure story: The bag that swells','Name: '+(S.name||'(not given)'),'',
      'Guess 1, why the bag swells: '+(g.why===undefined?'no guess':WHY[g.why].toLowerCase()+(g.why===1?' (matched)':' (it was: the air outside pushes less)')),
      'Guess 2, twice the molecules: '+(g.dbl===undefined?'no guess':['same push','double','four times'][g.dbl]+(g.dbl===1?' (matched)':' (the push doubled)')),
      'Bag size at the tunnel: '+(S.ans==='ok'?'0.63 L, correct after '+S.miss+' miss'+(S.miss===1?'':'es'):'not answered yet'),
      'Guess 3, water bottle going down: '+(g.bottle===undefined?'no guess':['swell','crush inward','stay the same'][g.bottle]+(g.bottle===1?' (matched)':' (it crushes inward)')),
      'Story order: '+(S.order.length===4?(S.order.every((v,i)=>v===i)?'correct':'not yet correct')+' after '+S.tries+' tr'+(S.tries===1?'y':'ies'):'not finished'),'','In my own words:',S.text||'(nothing written)'].join('\n');
    const ok=()=>{$('#cmsg').textContent='Copied. Paste it into Canvas.'},fb=()=>{const t=document.createElement('textarea');t.value=L;document.body.appendChild(t);t.select();try{document.execCommand('copy');ok()}catch(e){$('#cmsg').textContent='Could not copy. Select your text and copy it by hand.'}t.remove()};
    if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(L).then(ok,fb);else fb();ev('copy')})}
