/* Story: "Why does warm soda go flat faster?"  Gas solubility, told as one story: CO₂ squeezed into the water, a sealed can
   in balance, the pssst when you open it, and why warmth lets the CO₂ out faster. Written Nov 24, 2026.
   True to the real thing: soda is water with CO₂ dissolved under pressure (a cold sealed can is at about 2 to 3 atmospheres).
   In a sealed can CO₂ leaves the soda and returns to it at the same rate. Opening the can lets the gas above escape, so far more
   CO₂ leaves than returns until the soda is flat. Gases dissolve less in warm water: at 1 atmosphere, about 2.8 g of CO₂
   per liter at 4 °C but about 1.1 g at 35 °C (measured values below), so warm soda loses its CO₂ faster.
   Simplified: one CO₂ molecule drawn stands for very many; time is sped up; the race in step 5 uses a simple model (how fast the
   CO₂ leaves is set by how much the water can hold at that temperature), so its minutes are a model, not a measurement. */
(function(){
'use strict';
const {clamp,lerp,ease,rr,txt,pill,arrow}=Story.h,G=View3D.G,K=Chem3D;
const W=1200,H=600;
const C={ink:'#26262b',soft:'#62626a',rj:'#C11430',cold:'#2f7fd0',hot:'#d4542a',soda:'#7a3b16'};
/* CO₂ solubility in water at 1 atm, grams per liter (standard tables) */
const SOL=[[0,3.35],[5,2.77],[10,2.32],[15,1.97],[20,1.69],[25,1.45],[30,1.26],[35,1.10],[40,.97]];
const sol=T=>{for(let i=1;i<SOL.length;i++)if(T<=SOL[i][0]){const [a,b]=[SOL[i-1],SOL[i]],u=(T-a[0])/(b[0]-a[0]);return lerp(a[1],b[1],u);}return SOL[SOL.length-1][1];};
/* ---------- the 3D can ---------- */
const X=1.5,Y0=-1.45,SURF=.35,Y1=1.35,R=K.rng(9);
function newCan(T){const s={T,open:false,gone:0,co2:[],waters:[],evIn:0,evOut:0,outN:0,inN:0,start:0,t:0};
  for(let i=0;i<28;i++)s.waters.push({p:[lerp(-X,X,R()),lerp(Y0,SURF-.1,R()),lerp(-X,X,R())],d:G.norm([R()-.5,R()-.5,R()-.5])});
  const nD=Math.round(18*sol(T)/sol(4)),nG=Math.round(10*sol(4)/sol(T)*.55+5);   // more stays in when cold; more sits above when warm
  for(let i=0;i<nD;i++)s.co2.push(mol(true));for(let i=0;i<nG;i++)s.co2.push(mol(false));s.start=nD;return s;}
function mol(inSoda){return {p:[lerp(-X,X,R()),inSoda?lerp(Y0,SURF-.08,R()):lerp(SURF+.1,Y1,R()),lerp(-X,X,R())],ax:G.norm([R()-.5,R()-.5,R()-.5]),inSoda,move:null,gone:false};}
const kOut=T=>.16*sol(4)/sol(T);                                 // per molecule per second (sped up)
function stepCan(s,dt){s.t+=dt;const live=s.co2.filter(m=>!m.gone),D=live.filter(m=>m.inSoda&&!m.move),Gs=live.filter(m=>!m.inSoda&&!m.move);
  // leaving the soda: each dissolved molecule leaves at kOut(T); returning: each gas molecule above returns at a rate that keeps a sealed can in balance
  const kIn=s.open?0:kOut(s.T)*s.start/Math.max(1,Gs.length+.0001)*(D.length/Math.max(1,s.start));
  s.evOut+=D.length*kOut(s.T)*dt;s.evIn+=Gs.length*(s.open?.02:kIn)*dt;
  while(s.evOut>=1&&D.length){s.evOut-=1;const m=D.splice(Math.floor(R()*D.length),1)[0];m.move={from:m.p.slice(),to:[m.p[0],SURF+.25,m.p[2]],t:0,up:true};s.outN++;}
  while(s.evIn>=1&&Gs.length){s.evIn-=1;const m=Gs.splice(Math.floor(R()*Gs.length),1)[0];m.move={from:m.p.slice(),to:[m.p[0],SURF-.3,m.p[2]],t:0,up:false};s.inN++;}
  for(const m of live){if(m.move){m.move.t+=dt/.7;const u=ease(Math.min(1,m.move.t));m.p=m.move.from.map((v,i)=>lerp(v,m.move.to[i],u));if(m.move.t>=1){m.inSoda=!m.move.up;m.move=null;}continue;}
    for(let a=0;a<3;a++)m.p[a]+=(R()-.5)*dt*(1.4+.006*(s.T-4))*(m.inSoda?.7:1.6);
    m.ax=G.norm(G.add(m.ax,G.mul([R()-.5,R()-.5,R()-.5],dt*2)));
    m.p[0]=clamp(m.p[0],-X,X);m.p[2]=clamp(m.p[2],-X,X);
    if(m.inSoda)m.p[1]=clamp(m.p[1],Y0,SURF-.06);
    else{if(s.open){m.p[1]+=dt*.9;m.p[0]*=1-dt*.9;m.p[2]*=1-dt*.9;if(m.p[1]>Y1+.9){m.gone=true;s.gone++;}}else m.p[1]=clamp(m.p[1],SURF+.06,Y1);}}
  for(const w of s.waters)for(let a=0;a<3;a++){w.p[a]+=(R()-.5)*dt*.6;w.p[0]=clamp(w.p[0],-X,X);w.p[2]=clamp(w.p[2],-X,X);w.p[1]=clamp(w.p[1],Y0,SURF-.08);}}
function canItems(s){const it=[];
  // the soda's surface and the can's edges, so the two regions read clearly
  const sq=y=>[[-X-.15,y,-X-.15],[X+.15,y,-X-.15],[X+.15,y,X+.15],[-X-.15,y,X+.15]];
  it.push({t:'face',pts:sq(SURF),c:'#c9905f',op:.16},{t:'face',pts:sq(Y0-.12),c:'#8a8f98',op:.12});
  for(const [a,b] of [[0,1],[1,2],[2,3],[3,0]]){const q=sq(Y0-.12),u=sq(s.open?SURF+.4:Y1+.12);it.push({t:'bond',a:q[a],b:q[b],r:.012,c:'#9aa1ab',op:.5},{t:'bond',a:q[a],b:u[a],r:.012,c:'#9aa1ab',op:.35});if(!s.open)it.push({t:'bond',a:u[a],b:u[b],r:.012,c:'#9aa1ab',op:.5});}
  s.waters.forEach(w=>it.push(...K.waterItems(K.water(w.p,w.d),{op:.45})));
  s.co2.forEach(m=>{if(!m.gone)it.push(...K.co2Items(m.p,m.ax,{s:1.15}));});
  it.push({t:'tag',p:[0,Y1+.35,0],text:s.open?'open: the gas above escapes':'sealed: gas squeezed above the soda',c:C.ink},{t:'tag',p:[X+.1,SURF-.75,X+.1],text:'soda (water)',c:C.soda});
  return it;}
const inSoda=s=>s.co2.filter(m=>!m.gone&&m.inSoda&&!m.move).length;
/* ---------- 2D pictures ---------- */
function can(ctx,x,y,s,col,label,frost,fizz){ctx.save();ctx.translate(x,y);ctx.scale(s,s);rr(ctx,-60,-110,120,220,22);const g=ctx.createLinearGradient(-60,0,60,0);g.addColorStop(0,'#5e0f16');g.addColorStop(.45,col);g.addColorStop(1,'#5e0f16');ctx.fillStyle=g;ctx.fill();
  ctx.fillStyle='#c8ccd2';rr(ctx,-52,-124,104,18,8);ctx.fill();txt(ctx,'SODA',0,8,{s:30,w:800,c:'#fff',a:'center'});
  if(frost){ctx.fillStyle='rgba(255,255,255,.35)';for(let i=0;i<30;i++){ctx.beginPath();ctx.arc(-55+((i*37)%110),-100+((i*53)%200),2+(i%3),0,7);ctx.fill();}}
  if(fizz){ctx.strokeStyle='rgba(255,255,255,.85)';ctx.lineWidth=2.5;for(let i=0;i<fizz;i++){ctx.beginPath();ctx.arc(-20+((i*29)%40),-140-((i*41)%80),3+(i%3),0,7);ctx.stroke();}}
  ctx.restore();txt(ctx,label,x,y+130*s+28,{s:17,w:700,c:C.ink,a:'center'});}
function graph(ctx,x,y,w,h,curves,tmax,tNow){ctx.save();ctx.fillStyle='#fff';rr(ctx,x,y,w,h,10);ctx.fill();ctx.strokeStyle='#d5d9de';ctx.stroke();
  const L=x+60,B=y+h-46,Wd=w-90,Ht=h-80;ctx.strokeStyle='#62626a';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(L,y+24);ctx.lineTo(L,B);ctx.lineTo(L+Wd,B);ctx.stroke();
  for(let p=0;p<=100;p+=25){const yy=B-Ht*p/100;txt(ctx,p+'%',L-8,yy+5,{s:13,c:C.soft,a:'right'});}
  for(let t=0;t<=tmax;t+=30){txt(ctx,t+'',L+Wd*t/tmax,B+20,{s:13,c:C.soft,a:'center'});}
  txt(ctx,'minutes after opening (model)',L+Wd/2,B+40,{s:13.5,c:C.soft,a:'center'});txt(ctx,'CO₂ left',L-48,y+18,{s:13.5,w:700,c:C.ink});
  curves.forEach(([f,col,lab])=>{ctx.strokeStyle=col;ctx.lineWidth=3.5;ctx.beginPath();for(let t=0;t<=tNow;t+=1){const xx=L+Wd*t/tmax,yy=B-Ht*f(t);t?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy);}ctx.stroke();
    const yy=B-Ht*f(tNow);ctx.beginPath();ctx.arc(L+Wd*tNow/tmax,yy,6,0,7);ctx.fillStyle=col;ctx.fill();txt(ctx,lab,L+Wd*tNow/tmax+10,yy-8,{s:14,w:700,c:col});});ctx.restore();}
const left=T=>t=>Math.exp(-t*kOut(T)/.16/90*Math.LN2*1.0);   // model: half the CO₂ gone in about 90 min at 4 °C, faster in proportion as solubility falls
/* ---------- tell-it pictures ---------- */
const fr=fn=>ctx=>{ctx.save();ctx.beginPath();ctx.rect(0,0,300,193.3);ctx.clip();ctx.fillStyle='#f4f6f8';ctx.fillRect(0,0,300,194);fn(ctx);ctx.restore();};
const VT=View3D.make({yaw:.5,pitch:-.25,auto:0,hint:false});const SAMPLE=newCan(4),OPENED=(()=>{const s=newCan(4);s.open=true;s.co2.forEach(m=>{if(!m.inSoda)m.p[1]+=.6;});return s;})();
const FRAMES=[
 {label:'A soda goes flat faster when it is warm',draw:fr(ctx=>{can(ctx,95,88,.55,'#b3262f','cold',true,2);can(ctx,205,88,.55,'#b3262f','warm',false,8);})},
 {label:'In a sealed can, CO₂ is squeezed into the soda under pressure',draw:fr(ctx=>VT.render(ctx,{x:0,y:0,w:300,h:193,nm:44,items:canItems(SAMPLE),bg:'#f4f6f8'}))},
 {label:'Opening the can lets the gas above escape: pssst',draw:fr(ctx=>VT.render(ctx,{x:0,y:0,w:300,h:193,nm:40,items:canItems(OPENED),bg:'#f4f6f8'}))},
 {label:'Now more CO₂ leaves the soda than goes back in',draw:fr(ctx=>{ctx.fillStyle='#7a3b16';ctx.fillRect(60,90,180,90);for(let i=0;i<9;i++){const xx=80+i*18,yy=70-(i%3)*18;ctx.strokeStyle='#fff';ctx.fillStyle='rgba(255,255,255,.6)';ctx.beginPath();ctx.arc(xx,yy,5,0,7);ctx.fill();}txt(ctx,'↑ ↑ ↑',150,60,{s:22,w:700,c:C.ink,a:'center'});})},
 {label:'Warm water holds less CO₂, so it escapes faster',draw:fr(ctx=>{ctx.strokeStyle='#62626a';ctx.beginPath();ctx.moveTo(30,20);ctx.lineTo(30,170);ctx.lineTo(285,170);ctx.stroke();ctx.strokeStyle=C.rj;ctx.lineWidth=3;ctx.beginPath();SOL.forEach(([T,g],i)=>{const xx=30+T*6.2,yy=170-g*42;i?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy);});ctx.stroke();txt(ctx,'CO₂ the water can hold',40,22,{s:12,c:C.ink});txt(ctx,'temperature →',280,188,{s:12,c:C.soft,a:'right'});})},
 {label:'So the warm soda goes flat first',draw:fr(ctx=>graph(ctx,0,0,300,193,[[left(4),C.cold,''],[left(35),C.hot,'']],120,120))}];
/* ---------- chapters ---------- */
const PICK=['Warm soda has more sugar in it','Heat makes the can leak','In warm soda the CO₂ escapes from the water more easily','Cold soda has more water in it'];
const V2=View3D.make({yaw:.5,pitch:-.25,auto:.12}),V3=View3D.make({yaw:.5,pitch:-.25,auto:.1}),V4=View3D.make({yaw:.5,pitch:-.25,auto:.1});
const bg=ctx=>{ctx.fillStyle='#f4f6f8';ctx.fillRect(0,0,W,H);};
const KEY=[[G.C.C,'CO₂ molecule (gray C, red O)'],[G.C.O,'water molecule (faded)',.45]];

/* ---------- "Who is doing this" (Nov 24, 2026; rebuilt Nov 23 for cause and effect): Whiskey Creek oyster hatchery and ocean CO₂ ----------
   Sources: Barton et al., Limnology & Oceanography (2012); NOAA Ocean Acidification Program; Oregon State University. Whiskey Creek
   Shellfish Hatchery (Netarts Bay, Oregon; Sue Cudd and Alan Barton) lost most of its oyster larvae in 2007-2008. Oregon State chemists
   Burke Hales and George Waldbusser traced it to cold, CO₂-rich water that summer winds pull up from the deep (upwelling). Dissolved CO₂
   reacts with carbonate (CO₂ + CO₃²⁻ + H₂O → 2 HCO₃⁻), leaving less carbonate for baby oysters to build calcium carbonate shells. A CO₂
   monitor lets the hatchery pump in seawater at better times, and they add soda ash (sodium carbonate) to buffer it.
   What the student does and sees, with no numbers on screen: choose when the pump runs (cause) → upwelled water brings CO₂ into the
   tank → in the tank close-up, CO₂ grabs carbonate and both turn into bicarbonate, while carbonate + calcium join the shell as it grows
   (transformation) → shells grow or crumble, the larvae live or sink, and the oyster beds in the bay fill or empty (effect). Soda ash
   adds carbonate. Ocean CO₂ keeps rising, so the problem is managed, not solved. Rates are made up; drawings, not to scale. */
const OC_PICK=[{v:'warm',x:600,y:30,draw(ctx,cx,cy){ctx.fillStyle='#f3b26b';rr(ctx,cx-40,cy-6,80,42,8);ctx.fill();txt(ctx,'☀️',cx,cy-16,{s:28,a:'center'});co2s(ctx,cx,cy+15,1,.9);}},
  {v:'cold',x:740,y:30,draw(ctx,cx,cy){ctx.fillStyle='#1f4f86';rr(ctx,cx-40,cy-6,80,42,8);ctx.fill();txt(ctx,'❄️',cx,cy-16,{s:28,a:'center'});co2s(ctx,cx-20,cy+8,1,.9);co2s(ctx,cx+18,cy+24,1,.9);co2s(ctx,cx-14,cy+26,1,.9);co2s(ctx,cx+20,cy+6,1,.9);}}];
function co2s(ctx,x,y,s,a){ctx.save();ctx.globalAlpha=a==null?1:a;ctx.strokeStyle='#cfd5dc';ctx.lineWidth=2.4*s;ctx.beginPath();ctx.moveTo(x-9*s,y);ctx.lineTo(x+9*s,y);ctx.stroke();
  [[x-9*s,'#e0473b',4.2],[x,'#5f6670',4.6],[x+9*s,'#e0473b',4.2]].forEach(([xx,c,r])=>{ctx.beginPath();ctx.arc(xx,y,r*s,0,7);ctx.fillStyle=c;ctx.fill();});ctx.restore();}
function co3(ctx,x,y,s,a,h){ctx.save();ctx.globalAlpha=a==null?1:a;for(let i=0;i<3;i++){const t=i*Math.PI*2/3-Math.PI/2,ox=x+Math.cos(t)*9*s,oy=y+Math.sin(t)*9*s;ctx.strokeStyle='#cfd5dc';ctx.lineWidth=2*s;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(ox,oy);ctx.stroke();ctx.beginPath();ctx.arc(ox,oy,4*s,0,7);ctx.fillStyle='#e0473b';ctx.fill();}
  ctx.beginPath();ctx.arc(x,y,4.4*s,0,7);ctx.fillStyle='#5f6670';ctx.fill();if(h){ctx.beginPath();ctx.arc(x+Math.cos(-Math.PI/2)*9*s+5*s,y-9*s-4*s,2.6*s,0,7);ctx.fillStyle='#f2f2f2';ctx.fill();ctx.strokeStyle='#aaa';ctx.lineWidth=1;ctx.stroke();}ctx.restore();}
function larva(ctx,x,y,r,good,a){ctx.save();ctx.globalAlpha=a==null?1:a;ctx.beginPath();ctx.moveTo(x-r,y);ctx.lineTo(x+r,y);ctx.arc(x,y,r,0,Math.PI,true);ctx.closePath();
  ctx.fillStyle=good>.5?'#e8d3a6':'rgba(232,211,166,.35)';ctx.fill();ctx.lineWidth=1+3*good;ctx.strokeStyle=good>.5?'#8a6a2e':'#C11430';ctx.setLineDash(good>.5?[]:[3,3]);ctx.stroke();ctx.restore();}
const OC_SH=[742,190],OC_R=52,OC_BOX=[606,30,273,224];
function ocRand(a,b){return a+Math.random()*(b-a);}
function newOc(){return {pick:null,k:0,pump:'always',cyc:0,flow:[],co3:[...Array(8)].map(()=>({x:ocRand(620,860),y:ocRand(50,140),vx:ocRand(-15,15),vy:ocRand(-10,10),go:null})),co2:[],hco3:[],shell:.55,chips:[],beds:.5,good:false,rev:false,add:0,ca:0};}
function ocBad(M){return (M.cyc%12)<8;}
function ocOpen(M){return M.pump==='always'||!ocBad(M);}
function ocTick(S,dt){const M=S.oc;if(!M||!M.pick)return;M.k=Math.min(1,M.k+dt*.5);if(M.pick!=='cold')return;
  M.cyc+=dt;const bad=ocBad(M),open=ocOpen(M);
  // the pump: parcels of bay water run up the pipe; bad water carries CO₂, good water carries carbonate
  if(open&&Math.random()<dt*2.4)M.flow.push({u:0,bad});M.flow.forEach(f=>f.u+=dt*.7);
  M.flow=M.flow.filter(f=>{if(f.u<1)return true;for(let j=0;j<2;j++){if(f.bad){if(M.co2.length<22)M.co2.push({x:612,y:ocRand(50,150),vx:40,vy:0});}else if(M.co3.length<14)M.co3.push({x:612,y:ocRand(50,150),vx:30,vy:ocRand(-8,8),go:null});}return false;});
  // CO₂ hunts carbonate: CO₂ + CO₃²⁻ → two HCO₃⁻
  M.co2.forEach(c=>{let best=null,bd=1e9;M.co3.forEach(q=>{if(q.go)return;const d=Math.hypot(q.x-c.x,q.y-c.y);if(d<bd){bd=d;best=q;}});
    if(best){const d=Math.max(1,bd);c.x+=(best.x-c.x)/d*80*dt;c.y+=(best.y-c.y)/d*80*dt;if(bd<12){c.dead=true;best.dead=true;M.hco3.push({x:c.x-8,y:c.y,vx:-20,vy:-14,a:1},{x:c.x+8,y:c.y,vx:20,vy:-10,a:1});}}
    else{// no free carbonate: the CO₂ goes for the shell itself and dissolves a piece of it
      if(c.a==null)c.a=Math.PI*ocRand(.1,.9);const tx=OC_SH[0]+Math.cos(c.a)*OC_R,ty=OC_SH[1]-Math.sin(c.a)*OC_R,d=Math.max(1,Math.hypot(tx-c.x,ty-c.y));
      if(M.shell<=0){c.x=clamp(c.x+c.vx*dt,612,870);c.vx*=.98;}else{c.x+=(tx-c.x)/d*70*dt;c.y+=(ty-c.y)/d*70*dt;
      if(d<6){c.dead=true;M.shell=Math.max(0,M.shell-.05);for(let j=0;j<3;j++)M.chips.push({x:tx+ocRand(-4,4),y:ty,vy:ocRand(5,20),a:1});M.hco3.push({x:tx-8,y:ty,vx:-18,vy:-12,a:1},{x:tx+8,y:ty,vx:18,vy:-12,a:1});}}}});
  M.co2=M.co2.filter(c=>!c.dead);M.co3=M.co3.filter(q=>!q.dead);
  M.hco3.forEach(h=>{h.x+=h.vx*dt;h.y+=h.vy*dt;h.a-=dt*.25;});M.hco3=M.hco3.filter(h=>h.a>0);
  // carbonate drifts; when the shell is ready for more, one goes to its edge with a calcium and becomes shell
  M.ca-=dt;M.co3.forEach(q=>{if(q.go){const a=q.go,tx=OC_SH[0]+Math.cos(a)*OC_R,ty=OC_SH[1]-Math.abs(Math.sin(a))*OC_R;q.x=lerp(q.x,tx,dt*5);q.y=lerp(q.y,ty,dt*5);if(Math.hypot(q.x-tx,q.y-ty)<3){q.dead=true;M.shell=Math.min(1,M.shell+.07);}return;}
    q.x+=q.vx*dt;q.y+=q.vy*dt;if(q.x<616||q.x>868)q.vx*=-1;if(q.y<44||q.y>150)q.vy*=-1;});
  if(M.ca<=0&&!M.co2.length){const q=M.co3.find(q=>!q.go);if(q){q.go=Math.PI*ocRand(.05,.95);M.ca=.4;}}
  M.co3=M.co3.filter(q=>!q.dead);
  // with CO₂ around and no carbonate to spare, the shell crumbles
  M.chips.forEach(c=>{c.y+=c.vy*dt;c.vy+=40*dt;c.a-=dt*.6;});M.chips=M.chips.filter(c=>c.a>0);
  M.beds=clamp(M.beds+(M.shell>.6?.12:M.shell<.35?-.12:0)*dt,0,1);
  if(M.pump==='smart'&&M.beds>.85)M.good=true;if(M.good&&M.pump==='always'&&M.beds<.45)M.rev=true;}
function ocScene(ctx,S){const M=S.oc,t=S.t,on=M.pick==='cold',bad=on&&ocBad(M),open=on&&ocOpen(M);
  ctx.fillStyle='#e6f2fb';ctx.fillRect(0,0,590,430);
  const sea=ctx.createLinearGradient(0,110,0,430);sea.addColorStop(0,bad?'#4f8fbf':'#5fa8d8');sea.addColorStop(1,'#163d6b');ctx.fillStyle=sea;ctx.fillRect(0,110,420,320);
  ctx.fillStyle='#8a6a3e';ctx.beginPath();ctx.moveTo(420,110);ctx.lineTo(590,110);ctx.lineTo(590,430);ctx.lineTo(300,430);ctx.closePath();ctx.fill();
  if(bad||!on){txt(ctx,'💨',230,92,{s:30,a:'center'});arrow(ctx,200,82,110,82,'#62626a');}else txt(ctx,'☀️',120,70,{s:34,a:'center'});
  if(bad){ctx.save();ctx.globalAlpha=.85;ctx.strokeStyle='#bfe3ff';ctx.lineWidth=5;ctx.setLineDash([10,8]);ctx.lineDashOffset=-t*30;ctx.beginPath();ctx.moveTo(60,410);ctx.quadraticCurveTo(330,400,380,140);ctx.stroke();ctx.restore();}
  for(let i=0;i<16;i++){const u=((t*.12+i/16)%1),x=bad?lerp(60,370,u):40+((i*97)%340),y=bad?lerp(400,150,u*u)+((i*17)%30):150+((i*151)%250);co2s(ctx,x,y,1,bad?.95:(on?.2:.35));}
  if(on&&!bad){ctx.fillStyle='rgba(60,170,90,.8)';for(let i=0;i<22;i++){ctx.beginPath();ctx.arc(20+((i*71)%380),122+((i*13)%26),3,0,7);ctx.fill();}}
  // oyster beds on the bay floor: full when the hatchery's larvae live
  const n=on?Math.round(M.beds*14):7;for(let i=0;i<14;i++){const x=40+i*22,y=404+(i%2)*8;if(i<n){ctx.fillStyle='#c9b99a';ctx.beginPath();ctx.ellipse(x,y,10,6,.4,0,7);ctx.fill();ctx.strokeStyle='#6f6350';ctx.lineWidth=1.5;ctx.stroke();}else{ctx.fillStyle='rgba(255,255,255,.18)';ctx.beginPath();ctx.ellipse(x,y,9,3,0,0,7);ctx.fill();}}
  // the hatchery, its pipe, its monitor and its tank
  ctx.fillStyle='#f4efe6';ctx.fillRect(440,50,130,56);ctx.fillStyle='#7a4f22';ctx.beginPath();ctx.moveTo(432,50);ctx.lineTo(505,16);ctx.lineTo(578,50);ctx.closePath();ctx.fill();txt(ctx,'🦪',505,92,{s:22,a:'center'});
  ctx.strokeStyle='#8a8f98';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(380,170);ctx.lineTo(470,170);ctx.lineTo(470,212);ctx.stroke();
  M.flow.forEach(f=>{const u=f.u,x=u<.7?lerp(380,470,u/.7):470,y=u<.7?170:lerp(170,212,(u-.7)/.3);if(f.bad)co2s(ctx,x,y,.55);else co3(ctx,x,y,.5);});
  if(on&&M.pump==='smart'){ctx.fillStyle='#fff';rr(ctx,404,138,48,26,6);ctx.fill();ctx.strokeStyle='#26262b';ctx.lineWidth=1.5;ctx.stroke();ctx.fillStyle=bad?'#e0473b':'#3fbf6a';ctx.beginPath();ctx.arc(440,151,7,0,7);ctx.fill();txt(ctx,'📟',418,157,{s:14,a:'center'});}
  if(on){ctx.fillStyle=open?'#3fbf6a':'#e0473b';ctx.beginPath();ctx.arc(470,190,6,0,7);ctx.fill();}
  ctx.fillStyle='#cfe8f7';rr(ctx,440,214,140,120,12);ctx.fill();ctx.strokeStyle='#8a8f98';ctx.lineWidth=2;ctx.stroke();
  const sh=on?M.shell:.9;for(let i=0;i<9;i++){const sink=sh<.35?(.35-sh)*120:0;larva(ctx,462+(i%3)*44,248+Math.floor(i/3)*30+Math.min(sink,24),11,sh>.45?1:0,sh<.35?.5:1);}
  if(M.pick==='warm'&&M.k<1){ctx.save();ctx.globalAlpha=1-M.k;txt(ctx,'☀️ → fewer CO₂',210,250,{s:20,w:800,c:'#fff',a:'center'});ctx.restore();}}
function ocInside(ctx,S){const M=S.oc;
  ctx.save();ctx.strokeStyle='rgba(98,98,106,.7)';ctx.lineWidth=2;ctx.setLineDash([6,4]);ctx.beginPath();ctx.moveTo(580,230);ctx.lineTo(606,142);ctx.stroke();ctx.restore();
  ctx.fillStyle='#e3f1fa';rr(ctx,...OC_BOX,12);ctx.fill();ctx.strokeStyle='#8a8f98';ctx.lineWidth=2;ctx.stroke();
  // the shell: thicker as carbonate joins it, crumbling when it cannot
  ctx.save();rr(ctx,...OC_BOX,12);ctx.clip();
  const s=M.shell;ctx.save();ctx.beginPath();ctx.moveTo(OC_SH[0]-OC_R,OC_SH[1]);ctx.arc(OC_SH[0],OC_SH[1],OC_R,Math.PI,0);ctx.closePath();ctx.fillStyle=`rgba(232,211,166,${.25+.75*s})`;ctx.fill();
  ctx.lineWidth=2+12*s;ctx.strokeStyle=s>.35?'#8a6a2e':'#C11430';ctx.setLineDash(s>.35?[]:[6,5]);ctx.beginPath();ctx.arc(OC_SH[0],OC_SH[1],OC_R,Math.PI,0);ctx.stroke();ctx.restore();
  ctx.fillStyle='#8a6a2e';M.chips.forEach(c=>{ctx.globalAlpha=Math.max(0,c.a);ctx.fillRect(c.x-3,c.y-2,6,4);});ctx.globalAlpha=1;
  M.co3.forEach(q=>co3(ctx,q.x,q.y,1));M.co2.forEach(c=>co2s(ctx,c.x,c.y,1));M.hco3.forEach(h=>co3(ctx,h.x,h.y,.9,Math.max(0,h.a)*.7,true));ctx.restore();
  // the bay's oyster farm: the effect people see
  ctx.fillStyle='#fff';rr(ctx,606,266,273,154,12);ctx.fill();ctx.strokeStyle='#d5d9de';ctx.stroke();
  ctx.fillStyle='#7fb6dc';ctx.fillRect(612,276,261,80);ctx.fillStyle='#c9b48f';ctx.fillRect(612,356,261,58);
  const n=Math.round(M.beds*18);for(let i=0;i<18;i++){const x=628+(i%9)*29,y=372+Math.floor(i/9)*22;if(i<n){ctx.fillStyle='#d9ccb0';ctx.beginPath();ctx.ellipse(x,y,12,7,.3,0,7);ctx.fill();ctx.strokeStyle='#6f6350';ctx.lineWidth=1.5;ctx.stroke();}}
  if(M.beds>.7)txt(ctx,'🚣',840+Math.sin(S.t)*6,312,{s:26,a:'center'});if(M.beds<.3)txt(ctx,'🪧',640,334,{s:22,a:'center'});}
function ocRhyme(ctx){Who.rhyme(ctx,20,440,560,140,(c,x,y,w,h)=>{const cx=x+w/2;c.fillStyle='#2f7fd0';rr(c,cx-34,y+14,68,112,12);c.fill();txt(c,'❄️',cx,y+40,{s:22,a:'center'});[[-14,64],[12,78],[-8,96],[14,104],[0,116]].forEach(([dx,dy])=>co2s(c,cx+dx,y+dy,.9));},
  (c,x,y,w,h)=>{const cx=x+w/2;c.fillStyle='#163d6b';rr(c,cx-90,y+14,180,112,12);c.fill();txt(c,'❄️',cx-60,y+40,{s:22,a:'center'});[[-30,64],[0,78],[-50,96],[24,104],[-10,116]].forEach(([dx,dy])=>co2s(c,cx+dx,y+dy,.9));c.fillStyle='#fff';c.beginPath();c.arc(cx+60,y+74,20,0,7);c.fill();larva(c,cx+60,y+80,14,0);});}
function ocPick(S,v){const M=S.oc;if(!M||M.pick==='cold')return;M.pick=v;M.k=0;}
Story.start({
  id:'soda',title:'Why does warm soda go flat faster?',W,H,labHref:'../index.html#solcurve',
  about:'<p><b>What is real.</b> Soda is water with CO₂ dissolved under pressure; a cold sealed can is at about 2 to 3 atmospheres. CO₂ is straight (O=C=O, 0.116 nm per bond) and water is bent. The solubility numbers are measured values for CO₂ in water at 1 atmosphere: about 2.8 g/L at 4 °C and 1.1 g/L at 35 °C.</p><p><b>What is simplified.</b> One CO₂ molecule drawn stands for a great many, and only a few water molecules are drawn. Time is sped up. The race in step 5 is a simple model (each soda loses its CO₂ at a rate set by how much the water can hold at that temperature); real cans also lose CO₂ to bubbles on the sides, so its minutes are a model, not a measurement.</p><p><b>Oysters and ocean CO₂ (step 6).</b> In 2007 and 2008 the Whiskey Creek Shellfish Hatchery on Netarts Bay, Oregon (Sue Cudd and Alan Barton) lost most of its oyster larvae. Oregon State University chemists Burke Hales and George Waldbusser traced it to cold, CO₂-rich water that summer winds pull up from the deep. Like cold soda, cold water holds more CO₂. In seawater, CO₂ reacts with carbonate ions (CO₂ + CO₃²⁻ + H₂O → 2 HCO₃⁻), leaving less carbonate for baby oysters to build their calcium carbonate shells. A CO₂ monitor now lets the hatchery pump in seawater at safer times and buffer it with soda ash (sodium carbonate), which adds carbonate back. Ocean CO₂ keeps rising, so the problem is managed, not solved. Sources: Barton et al., Limnology &amp; Oceanography (2012); NOAA Ocean Acidification Program; Oregon State University.</p>',
  tell:{frames:FRAMES,terms:['CO₂|carbon dioxide','dissolve|dissolved','pressure','escape|leave','temperature|warm','solubility|hold'],
    nudge:'For each picture ask: what had to happen just before this could happen?',
    done:'<b>That is the story.</b> Now tell it in your own words.',
    prompt:'Why does a soda left in a hot car go flat faster than one from the fridge? Tell the story. Use “because” and “so”.',placeholder:'Soda is water with CO₂ squeezed into it… because… so…'},
  chapters:[
  {rail:'The question',title:'Fridge soda or hot-car soda?',
   predict:{key:'why',q:'You open a soda from the fridge and one that sat in a hot car. The warm one fizzes up and goes flat much sooner. Why?',opts:PICK,right:2,after:'<b>Locked in.</b> Steps 3 and 4 will show you.'},
   text:'<p class="why">Take your best guess.</p>',alt:'Both cans hold the same drink with the same amount of fizz when they are sealed. The only difference is temperature. So what could temperature change about the fizz?',
   draw(ctx,S){ctx.fillStyle='#f4f1ea';ctx.fillRect(0,0,W,H);can(ctx,280,290,1.4,'#b3262f','From the fridge: 4 °C',true,3);can(ctx,620,290,1.4,'#b3262f','From a hot car: 35 °C',false,14);}},

  {rail:'Zoom in',title:'Inside a sealed can',live:true,
   text(S){return 'Soda is water with <b>carbon dioxide (CO₂)</b> squeezed into it. In a sealed can the gas above the soda is under pressure (about 2 to 3 times normal air pressure). '+
     'CO₂ molecules keep leaving the soda and going back in, at the <b>same rate</b>, so the fizz stays put. Watch the counts. <b>Drag to turn the can.</b>';},
   alt:'Think of a crowded room with a doorway to a hall that is just as crowded. People wander out and wander back in all the time, but the number in the room stays about the same.',
   todo:[{t:'Drag the can to turn it',ok:()=>V2.touched}],
   enter(S){S.can=newCan(4);},tick(S,dt){if(S.can)stepCan(S.can,dt);},
   draw(ctx,S){bg(ctx);V2.render(ctx,{x:0,y:0,w:880,h:600,nm:150,items:canItems(S.can),bg:'#f4f6f8'});
     K.panel(ctx,'What you are looking at',KEY,(x,y)=>{K.stat(ctx,x,y+10,'CO₂ that left the soda',S.can.outN);K.stat(ctx,x,y+52,'CO₂ that went back in',S.can.inN);K.stat(ctx,x,y+94,'CO₂ in the soda now',inSoda(S.can),C.soda);});}},

  {rail:'Open it',title:'Open the can',live:true,
   text(S){const s=S.can;if(!s.open)return 'Now <b>open the can</b>.';return 'Pssst: the squeezed gas above the soda rushes out. Nothing is pushing CO₂ back into the soda now, so far more leaves than goes back in. '+
     (inSoda(s)<s.start*.6?'The soda is going <b>flat</b>: that is what “flat” means, the CO₂ has left.':'Watch the CO₂ in the soda drop.');},
   alt:'Open the doorway onto an empty street. People still wander out of the room, but almost nobody wanders back in. The room empties.',
   ui:[{type:'button',label:'Open the can',pulse:true,act(S){S.can.open=true;},show:S=>S.can&&!S.can.open}],
   todo:[{t:'Open the can',ok:S=>S.can&&S.can.open},{t:'Watch the soda lose 40% of its CO₂',ok:S=>S.can&&S.can.open&&inSoda(S.can)<=S.can.start*.6}],
   enter(S){S.can=newCan(4);},tick(S,dt){if(S.can)stepCan(S.can,dt);},
   draw(ctx,S){bg(ctx);V3.render(ctx,{x:0,y:0,w:880,h:600,nm:150,items:canItems(S.can),bg:'#f4f6f8'});
     K.panel(ctx,'What you are looking at',KEY,(x,y)=>{K.stat(ctx,x,y+10,'Left the soda',S.can.outN);K.stat(ctx,x,y+52,'Went back in',S.can.inN);
       const f=inSoda(S.can)/S.can.start;txt(ctx,'CO₂ left in the soda',x+18,y+104,{s:15,c:C.soft});ctx.fillStyle='#eee';ctx.fillRect(x+18,y+116,244,18);ctx.fillStyle=C.soda;ctx.fillRect(x+18,y+116,244*Math.min(1,f),18);txt(ctx,Math.round(f*100)+'%',x+262,y+108,{s:15,w:700,a:'right',c:C.soda});});}},

  {rail:'Warm it',title:'Fridge or hot car?',live:true,
   text(S){const T=S.v.T;return 'Gases dissolve <b>less</b> in warm water. At '+T+' °C water can hold about <b>'+sol(T).toFixed(1)+' g</b> of CO₂ per liter (at normal air pressure), compared with '+sol(4).toFixed(1)+' g at 4 °C. '+
     (T<20?'Turn it up to a hot car.':'So in warm soda each CO₂ molecule escapes the water about <b>'+(sol(4)/sol(T)).toFixed(1)+' times</b> as easily. Open both and the warm one empties faster.');},
   alt:'Warm molecules jiggle harder. A CO₂ molecule held loosely among water molecules is easier to shake free when everything is jiggling hard, like a loose button on a shirt in a washing machine on a fast spin.',
   ui:[{type:'range',key:'T',min:4,max:35,step:1,val:4,label:'Temperature',fmt:v=>v+' °C',stops:[{v:4,l:'fridge'},{v:22,l:'room'},{v:35,l:'hot car'}],on(S,v){if(S.can){S.can.T=v;}}},
       {type:'button',label:'Open it',act(S){S.can.open=true;},show:S=>S.can&&!S.can.open},{type:'button',label:'Close a fresh can',ghost:true,act(S){S.can=newCan(S.v.T);},show:S=>S.can&&S.can.open}],
   todo:[{t:'Warm it to 35 °C',ok:S=>S.v.T>=35},{t:'Open the warm can',ok:S=>S.can&&S.can.open&&S.can.T>=30}],
   enter(S){S.v.T=4;S.can=newCan(4);},tick(S,dt){if(S.can)stepCan(S.can,dt);},
   draw(ctx,S){bg(ctx);V4.render(ctx,{x:0,y:0,w:880,h:600,nm:150,items:canItems(S.can),bg:'#f4f6f8'});
     K.panel(ctx,'CO₂ the water can hold',[],(x,y)=>{const L=x+30,B=y+190,Wd=230,Ht=170;ctx.strokeStyle='#62626a';ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(L,y);ctx.lineTo(L,B);ctx.lineTo(L+Wd,B);ctx.stroke();
       ctx.strokeStyle=C.rj;ctx.lineWidth=3;ctx.beginPath();SOL.forEach(([T,g],i)=>{const xx=L+Wd*T/40,yy=B-Ht*g/3.5;i?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy);});ctx.stroke();
       const T=S.v.T,xx=L+Wd*T/40,yy=B-Ht*sol(T)/3.5;ctx.beginPath();ctx.arc(xx,yy,7,0,7);ctx.fillStyle=T<20?C.cold:C.hot;ctx.fill();
       txt(ctx,'0 °C',L,B+18,{s:12,c:C.soft,a:'center'});txt(ctx,'40 °C',L+Wd,B+18,{s:12,c:C.soft,a:'center'});txt(ctx,'g/L',L-6,y+8,{s:12,c:C.soft,a:'right'});
       K.stat(ctx,x,B+60,'At '+T+' °C',sol(T).toFixed(2)+' g/L',T<20?C.cold:C.hot);txt(ctx,'Measured, at 1 atm of CO₂',x+18,B+96,{s:13,c:C.soft});});}},

  {rail:'Race',title:'Two open cans, side by side',live:true,
   text(S){const t=S.v.rt||0;return t<1?'Open a fridge-cold soda and a hot-car soda at the same moment. <b>Start the race</b> and watch how much CO₂ each one has left.':
     'At 4 °C the soda keeps its fizz much longer. At 35 °C it loses its CO₂ about '+(sol(4)/sol(35)).toFixed(1)+' times as fast, so it goes flat first. That is why a warm soda foams up when you open it, and why it tastes flat sooner.';},
   alt:'Two leaky buckets: the warm one has a bigger hole. Both empty in the end, but the warm one empties first.',
   ui:[{type:'button',label:'Start the race',pulse:true,act(S){S.v.run=1;S.v.rt=0;},show:S=>!S.v.run}],
   todo:[{t:'Run the race',ok:S=>(S.v.rt||0)>=120}],
   enter(S){S.v.run=0;S.v.rt=0;},tick(S,dt){if(S.v.run)S.v.rt=Math.min(120,(S.v.rt||0)+dt*24);},
   draw(ctx,S){bg(ctx);graph(ctx,40,40,820,520,[[left(4),C.cold,'4 °C'],[left(35),C.hot,'35 °C']],120,S.v.rt||0);
     K.panel(ctx,'CO₂ left in each can',[],(x,y)=>{const t=S.v.rt||0;K.stat(ctx,x,y,'Fridge, 4 °C',Math.round(left(4)(t)*100)+'%',C.cold);K.stat(ctx,x,y+42,'Hot car, 35 °C',Math.round(left(35)(t)*100)+'%',C.hot);
       txt(ctx,'Time: '+Math.round(t)+' min (model)',x+18,y+90,{s:14,c:C.soft});});}},

  {rail:'Who did it',title:'Oyster hatchery, Oregon',live:true,views:false,
   text(S){const M=S.oc;if(!M||!M.pick)return 'Oregon, 2007: baby oysters at a hatchery start dying. <b>Tap the water that holds more CO₂.</b>';
     if(M.pick==='warm')return 'Like the hot-car soda, warm water holds less CO₂. Try the other.';
     if(M.rev)return 'Red water in: CO₂ eats the carbonate again. Oregon State chemists built that monitor, and ocean CO₂ is still rising.';
     if(M.good&&M.pump==='always')return 'Pumping any time again. Watch the shell and the beds.';
     if(M.good)return 'Carbonate builds the shells, the larvae live, and the oyster beds fill. <b>Now switch back.</b>';
     if(M.pump==='smart'&&M.co2.length)return 'The pump waits for green water, but leftover CO₂ still grabs carbonate. <b>Add soda ash</b> to give the shells more.';
     if(M.pump==='smart')return 'Only green water comes in now. Watch the shell and the oyster beds.';
     return 'Wind pulls cold, CO₂-rich water up, and the pump brings it in. CO₂ grabs the carbonate, then eats the shell. <b>Pump only on green.</b>';},
   alt:'Look at the two pictures at the bottom. A cold soda holds more CO₂ than a warm one; cold deep ocean water does too. In the tank, each CO₂ grabs a carbonate ion, and both become bicarbonate, which a shell cannot use. Less carbonate, thinner shells. Pumping only when the water is better, or adding carbonate (soda ash), lets the shells grow.',
   ui:[{type:'seg',key:'op',val:'',label:'Which water holds more CO₂?',opts:[{v:'warm',l:'☀️ Warm surface'},{v:'cold',l:'❄️ Cold deep'}],on(S,v){ocPick(S,v);},show:S=>S.oc&&S.oc.pick!=='cold'},
     {type:'seg',key:'pump',val:'always',label:'Run the pump',opts:[{v:'always',l:'🚰 Any time'},{v:'smart',l:'📟 Only when the monitor is green'}],on(S,v){S.oc.pump=v;},show:S=>S.oc&&S.oc.pick==='cold'},
     {type:'button',label:'🧪 Add soda ash',act(S){const M=S.oc;for(let i=0;i<6&&M.co3.length<14;i++)M.co3.push({x:ocRand(620,860),y:44,vx:ocRand(-15,15),vy:ocRand(5,15),go:null});},show:S=>S.oc&&S.oc.pick==='cold'}],
   todo:[{t:'Tap the water that holds more CO₂',ok:S=>S.oc&&S.oc.pick==='cold'},{t:'Pump only on green and watch the oyster beds',ok:S=>S.oc&&S.oc.good},{t:'Switch back to any time',ok:S=>S.oc&&S.oc.rev}],
   enter(S){S.oc=newOc();S.v.op='';S.v.pump='always';},tick(S,dt){ocTick(S,dt);},
   click(S,x,y){const v=Who.hit(OC_PICK,x,y);if(v&&S.oc.pick!=='cold'){ocPick(S,v);S.v.op=v;}},
   draw(ctx,S){const M=S.oc||(S.oc=newOc());ctx.fillStyle='#f4f6f8';ctx.fillRect(0,0,W,H);ocScene(ctx,S);
     if(M.pick!=='cold')Who.cards(ctx,S,OC_PICK,M.pick);else ocInside(ctx,S);ocRhyme(ctx);
     Who.panel(ctx,'Whiskey Creek Hatchery',[['🦪','oyster hatchery, Oregon'],['📉','2007–08: most larvae die'],['🔬','Oregon State chemists'],['🌊','cause: cold CO₂-rich water'],['📟','a CO₂ monitor in the bay'],['⏱️','pump at safer times'],['⚠️','hard part: ocean CO₂ rising']],['Sources: Barton et al. 2012; NOAA;','Oregon State University.']);}},

  {rail:'Tell it',title:'Now you tell the story',tell:true}
  ]});
})();
