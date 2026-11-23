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
const {clamp,lerp,ease,rr,txt,pill}=Story.h,G=View3D.G,K=Chem3D;
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
Story.start({
  id:'soda',title:'Why does warm soda go flat faster?',W,H,labHref:'../index.html#solcurve',
  about:'<p><b>What is real.</b> Soda is water with CO₂ dissolved under pressure; a cold sealed can is at about 2 to 3 atmospheres. CO₂ is straight (O=C=O, 0.116 nm per bond) and water is bent. The solubility numbers are measured values for CO₂ in water at 1 atmosphere: about 2.8 g/L at 4 °C and 1.1 g/L at 35 °C.</p><p><b>What is simplified.</b> One CO₂ molecule drawn stands for a great many, and only a few water molecules are drawn. Time is sped up. The race in step 5 is a simple model (each soda loses its CO₂ at a rate set by how much the water can hold at that temperature); real cans also lose CO₂ to bubbles on the sides, so its minutes are a model, not a measurement.</p>',
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

  {rail:'Tell it',title:'Now you tell the story',tell:true}
  ]});
})();
