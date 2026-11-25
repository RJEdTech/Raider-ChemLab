/* Story: "Why does water bead up on a waxed car?"  Polarity and hydrogen bonds, told as one story: a lopsided molecule,
   water that sticks to water, a surface it cannot stick to, and the round drop that results. Written Nov 24, 2026.
   True to the real thing: water is bent (O–H 0.0958 nm, 104.5°); oxygen pulls the shared electrons toward itself, so the O end
   is slightly negative (δ−) and the H ends slightly positive (δ+); an H of one water is drawn to the O of another, a hydrogen
   bond (about 0.18 nm, H to O). Car wax is long carbon–hydrogen chains with no δ+ or δ− ends, so water cannot hold on to it;
   clean glass is covered in O–H groups, so water holds on and spreads. Contact angles: wax about 105°, clean glass under 20°.
   Simplified: about 34 water molecules stand in for a drop (a real bead holds about 10²¹); wax chains are drawn 4 carbons deep. */
(function(){
'use strict';
const {clamp,lerp,ease,rr,txt,pill}=Story.h,G=View3D.G,K=Chem3D;
const W=1200,H=600;
const C={ink:'#26262b',soft:'#62626a',rj:'#C11430',neg:'#e0453a',pos:'#3b6fd8',wax:'#a7adb5',si:'#d9b38c',car:'#b3262f',glass:'#cfe6f2'};
/* ---------- water drop: the same molecules arranged as a bead or as a flat puddle ---------- */
const N=34;
function sample(seed,inside,box){const r=K.rng(seed),P=[];let tries=0;while(P.length<N&&tries<20000){tries++;const p=[lerp(box[0],box[1],r()),lerp(box[2],box[3],r()),lerp(box[4],box[5],r())];
  if(!inside(p))continue;if(P.every(q=>G.len(G.sub(p,q))>.27))P.push(p);}return P;}
const BEAD=sample(3,p=>Math.hypot(p[0],p[1]-.78,p[2])<.62,[-.62,.62,.16,1.4,-.62,.62]);
const FLAT=sample(4,p=>Math.hypot(p[0]/1.75,p[2]/1.05)<1&&p[1]<.13+.3*(1-Math.hypot(p[0]/1.75,p[2]/1.05)),[-1.75,1.75,.12,.45,-1.05,1.05]);
BEAD.sort((a,b)=>a[0]-b[0]);FLAT.sort((a,b)=>a[0]-b[0]);
const FREE=BEAD.map(p=>[p[0],p[1]-.78,p[2]]);     // the same bead floating on its own
function waters(P){return P.map((p,i)=>{let j=-1,d=9;P.forEach((q,k)=>{if(k===i)return;const e=G.len(G.sub(p,q));if(e<d){d=e;j=k;}});const w=K.water(p,G.sub(P[j],p),[Math.sin(i),1,Math.cos(i)]);w.j=j;w.d=d;return w;});}
function hbonds(W){const out=[];W.forEach((w,i)=>{if(w.d<.36)out.push([w.h[0],W[w.j].o]);});return out;}
/* ---------- surfaces ---------- */
const WAX=[],GLASS=[];
for(let gx=0;gx<6;gx++)for(let gz=0;gz<4;gz++){const x=(gx-2.5)*.46,z=(gz-1.5)*.5;
  const cs=[];for(let k=0;k<4;k++)cs.push([x+(k%2?.044:-.044),-.1-k*.126,z]);
  WAX.push({cs,hs:[G.add(cs[0],[0,.1,0]),...cs.flatMap((c,k)=>[G.add(c,[k%2?.05:-.05,.02,.085]),G.add(c,[k%2?.05:-.05,.02,-.085])])]});
  const si=[x,-.32,z],o=[x,-.17,z],h=[x+.06,-.09,z+.02];GLASS.push({si,o,h,br:[[x+.23,-.38,z],[x,-.38,z+.25]]});}
function surfItems(kind){const it=[];
  if(kind==='wax')WAX.forEach(ch=>{ch.cs.forEach((c,k)=>{it.push({t:'atom',p:c,r:.07,c:G.C.C});if(k)it.push({t:'bond',a:ch.cs[k-1],b:c,r:.022,c:'#a3aab4'});});
    ch.hs.forEach((h,k)=>{const c=ch.cs[k?Math.floor((k-1)/2):0];it.push({t:'atom',p:h,r:.042,c:'#f2f2f2'},{t:'bond',a:c,b:h,r:.015,c:'#c9ced5'});});});
  else GLASS.forEach(g=>{it.push({t:'atom',p:g.si,r:.08,c:C.si},{t:'atom',p:g.o,r:.068,c:G.C.O},{t:'atom',p:g.h,r:.042,c:'#f2f2f2'},{t:'bond',a:g.si,b:g.o,r:.022,c:'#a3aab4'},{t:'bond',a:g.o,b:g.h,r:.018,c:'#c9ced5'});
    g.br.forEach(b=>it.push({t:'atom',p:b,r:.062,c:G.C.O,op:.85},{t:'bond',a:g.si,b,r:.02,c:'#a3aab4',op:.85}));});
  return it;}
function surfBonds(Wt){const out=[];GLASS.forEach(g=>{let best=null,d=.36;Wt.forEach(w=>{const e=G.len(G.sub(w.o,g.h));if(e<d){d=e;best=w;}});if(best)out.push([g.h,best.o]);});return out;}
/* ---------- 2D pictures ---------- */
function drop(ctx,cx,base,a,theta,fill){// a side view of a drop with contact angle theta (degrees) and base half-width a
  const t=theta*Math.PI/180,R=a/Math.sin(t),cy=base+R*Math.cos(t);ctx.beginPath();const s=-Math.PI/2-t,e=-Math.PI/2+t;ctx.arc(cx,cy,R,s,e);ctx.closePath();
  ctx.fillStyle=fill||'rgba(120,175,225,.75)';ctx.fill();ctx.strokeStyle='#3f7fb8';ctx.lineWidth=2;ctx.stroke();
  ctx.beginPath();ctx.ellipse(cx-a*.35,cy-R*.62+(R>a*1.2?R*.2:0),Math.max(3,a*.12),Math.max(2,a*.06),-.5,0,7);ctx.fillStyle='rgba(255,255,255,.7)';ctx.fill();}
function angleMark(ctx,cx,base,a,theta){const t=theta*Math.PI/180,x0=cx+a;ctx.save();ctx.strokeStyle=C.rj;ctx.lineWidth=2;ctx.beginPath();ctx.arc(x0,base,34,Math.PI,Math.PI+t,false);ctx.stroke();
  txt(ctx,Math.round(theta)+'°',x0-46,base-38,{s:17,w:700,c:C.rj,a:'center'});ctx.restore();}
function hood(ctx,x,y,w,h){ctx.save();rr(ctx,x,y,w,h,18);const g=ctx.createLinearGradient(x,y,x,y+h);g.addColorStop(0,'#d03a43');g.addColorStop(1,'#8e1d25');ctx.fillStyle=g;ctx.fill();
  const r=K.rng(2);for(let i=0;i<22;i++){const cx=x+30+r()*(w-60),cy=y+30+r()*(h-60),s=6+r()*16;ctx.beginPath();ctx.ellipse(cx,cy,s,s*.9,0,0,7);const gg=ctx.createRadialGradient(cx-s*.3,cy-s*.35,1,cx,cy,s);gg.addColorStop(0,'rgba(255,255,255,.95)');gg.addColorStop(.4,'rgba(230,170,175,.55)');gg.addColorStop(1,'rgba(90,10,15,.55)');ctx.fillStyle=gg;ctx.fill();}
  ctx.restore();}
function glassPane(ctx,x,y,w,h){ctx.save();rr(ctx,x,y,w,h,18);ctx.fillStyle='#d6ebf5';ctx.fill();ctx.strokeStyle='#9cc3d6';ctx.lineWidth=2;ctx.stroke();ctx.clip();
  ctx.beginPath();for(let i=0;i<=60;i++){const a=i/60*6.283,r=120+18*Math.sin(a*4)+10*Math.cos(a*7);ctx[i?'lineTo':'moveTo'](x+w/2+Math.cos(a)*r*1.3,y+h/2+Math.sin(a)*r*.8);}ctx.closePath();
  ctx.fillStyle='rgba(120,175,225,.35)';ctx.fill();ctx.strokeStyle='rgba(63,127,184,.6)';ctx.stroke();ctx.restore();}
/* ---------- tell-it pictures ---------- */
const fr=fn=>ctx=>{ctx.save();ctx.beginPath();ctx.rect(0,0,300,193.3);ctx.clip();ctx.fillStyle='#f4f6f8';ctx.fillRect(0,0,300,194);fn(ctx);ctx.restore();};
const VT=View3D.make({yaw:.5,pitch:-.25,auto:0,hint:false});
const ONE=K.water([0,0,0],[Math.cos(-.4),Math.sin(-.4),0],[0,1,0]);
const FRAMES=[
 {label:'On a waxed car, water sits in round beads',draw:fr(ctx=>hood(ctx,15,15,270,163))},
 {label:'A water molecule is lopsided: δ− at the O, δ+ at the Hs',draw:fr(ctx=>VT.render(ctx,{x:0,y:0,w:300,h:193,nm:560,items:K.waterItems(ONE,{charges:true}),bg:'#f4f6f8'}))},
 {label:'The δ+ H of one water grabs the δ− O of the next: water sticks to water',draw:fr(ctx=>{const Wt=waters(FREE);VT.render(ctx,{x:0,y:0,w:300,h:193,nm:110,items:[...Wt.flatMap(w=>K.waterItems(w)),...hbonds(Wt).map(([a,b])=>({t:'bond',a,b,r:.02,c:'#2f7fd0',dash:true}))],bg:'#f4f6f8'});})},
 {label:'Wax has no δ+ or δ− ends, so water has nothing to hold on to',draw:fr(ctx=>VT.render(ctx,{x:0,y:0,w:300,h:193,nm:62,items:[...surfItems('wax'),...waters(BEAD).flatMap(w=>K.waterItems(w))],bg:'#f4f6f8'}))},
 {label:'So the water pulls itself into a round bead',draw:fr(ctx=>{ctx.fillStyle='#8e1d25';ctx.fillRect(0,140,300,54);drop(ctx,150,140,70,105);angleMark(ctx,150,140,70,105);})},
 {label:'On clean glass, water holds on to O–H groups and spreads flat',draw:fr(ctx=>{ctx.fillStyle='#9cc3d6';ctx.fillRect(0,140,300,54);drop(ctx,150,140,125,18);})}];

/* ---------- "Who's doing it" (Nov 24, 2026): Gitanjali Rao's lead sensor, Tethys ----------
   Facts: Wikipedia (Gitanjali Rao, inventor): Lone Tree, Colorado; STEM School Highlands Ranch; carbon nanotubes whose resistance
   changes with lead; Bluetooth; worked with a 3M research scientist and in the Denver Water Quality Research Lab; 2017 Discovery
   Education 3M Young Scientist Challenge; TIME's first Kid of the Year (2020); studying biological engineering at MIT as of 2025.
   CPR / Texas Public Radio (2019): 'America's Top Young Scientist' at 11. The Analytical Scientist: three months with 3M mentor
   Kathleen Shafer. WaterWorld: family test strips gave hazy results; lead sticks and raises resistance; data to a phone app.
   Science Blog: nanotubes treated with chloride; first version in a cardboard box; not on store shelves. Gadget Review: flags lead
   above 15 parts per billion. EPA (Oct 2024): lead action level lowered from 15 to 10 µg/L (ppb).
   Picture: one carbon nanotube at real geometry (C–C 0.142 nm, about 1.25 nm across). The real sensor is a film of many tubes
   between two electrodes; the number of lead ions shown is far smaller than in any real sample. */
const TUBE=(()=>{const a=.246,m=16,Cc=m*a,R=Cc/(2*Math.PI),L=1.9,pts=[];
  for(let i=-2;i<m+2;i++)for(let j=-1;j<Math.ceil(L/(a*Math.sqrt(3)/2))+2;j++)for(const b of [0,a/Math.sqrt(3)]){let u=i*a+j*a/2,v=j*a*Math.sqrt(3)/2+b;u=((u%Cc)+Cc)%Cc;if(v<0||v>L)continue;
    if(!pts.some(q=>Math.abs(q[0]-u)<1e-6&&Math.abs(q[1]-v)<1e-6))pts.push([u,v]);}
  const P=pts.map(([u,v])=>{const th=u/R;return [v-L/2,R*Math.cos(th),R*Math.sin(th)];}),B=[];
  for(let i=0;i<P.length;i++)for(let j=i+1;j<P.length;j++){const d=G.len(G.sub(P[i],P[j]));if(d>.12&&d<.16)B.push([i,j]);}
  const CL=[];const r=K.rng(21);for(let k=0;k<12;k++){const th=r()*6.283,x=(r()-.5)*(L-.3);CL.push([x,(R+.17)*Math.cos(th),(R+.17)*Math.sin(th)]);}
  return {P,B,CL,R,L};})();
function newLead(){return {pb:[],stuck:0,adds:0,pick:null,w:Array.from({length:10},(_,i)=>{const r=K.rng(40+i);return {p:[(r()-.5)*2.6,(r()-.5)*2.2,(r()-.5)*2.2],d:[r()-.5,r()-.5,r()-.5]};})};}
function addLead(L){const r=K.rng(70+L.adds);L.adds++;for(let k=0;k<3;k++){const th=r()*6.283,rad=1.25+r()*.4;L.pb.push({p:[(r()-.5)*1.6,rad*Math.cos(th),rad*Math.sin(th)],to:null,t:0});}}
/* the student's guess: the first lead ion goes to what they picked; a carbon does not hold it, so it bounces on to a chlorine */
function firstLead(L,pick){L.pick=pick;const q={p:[0,1.5,.3],to:null,t:0};if(pick==='c'){const c=TUBE.P.reduce((m,p)=>p[1]>m[1]?p:m,TUBE.P[0]);q.via=G.add(c,[0,.2,0]);q.vt=0;}L.pb.push(q);}
function stepLead(L,dt){const used=new Set(L.pb.filter(q=>q.to!=null).map(q=>q.to));
  for(const q of L.pb){if(q.via){q.vt+=dt*.8;q.p=q.p.map((v,i)=>v+(q.via[i]-v)*Math.min(1,dt*2.4));if(q.vt>1.1){q.p=G.add(q.p,[0,.5,0]);delete q.via;}continue;}
    if(q.to==null){let best=-1,d=9;TUBE.CL.forEach((c,i)=>{if(used.has(i))return;const e=G.len(G.sub(q.p,c));if(e<d){d=e;best=i;}});if(best>=0){q.to=best;used.add(best);}}
    if(q.to!=null&&q.t<1){q.t=Math.min(1,q.t+dt*.55);const c=TUBE.CL[q.to],out=G.norm([0,c[1],c[2]]),tgt=G.add(c,G.mul(out,.27));q.p=q.p.map((v,i)=>v+(tgt[i]-v)*Math.min(1,dt*1.6));}}
  L.stuck=L.pb.filter(q=>q.t>=.95).length;}
const NEG='#e0453a',POS='#3b6fd8';
function leadItems(L){const it=[];TUBE.B.forEach(([i,j])=>it.push({t:'bond',a:TUBE.P[i],b:TUBE.P[j],r:.018,c:'#7d838c'}));TUBE.P.forEach(p=>it.push({t:'atom',p,r:.035,c:G.C.C}));
  TUBE.CL.forEach((c,i)=>{const near=G.mul(G.norm([0,c[1],c[2]]),TUBE.R);it.push({t:'bond',a:[c[0],near[1],near[2]],b:c,r:.015,c:'#9aa1ab'},{t:'atom',p:c,r:.1,c:'#2fae4f'},{t:'atom',p:c,r:.2,c:NEG,op:.22});});
  L.w.forEach(w=>it.push(...K.waterItems(K.water(w.p,w.d),{op:.35})));
  L.pb.forEach(q=>{it.push({t:'atom',p:q.p,r:.119*1.1,c:'#4a5568'},{t:'atom',p:q.p,r:.24,c:POS,op:.22});if(q.via)it.push({t:'atom',p:q.via,r:.3,c:'#8a8f98',op:.18});});
  return it;}
/* same pull, two places: δ+ H of one water grabs the δ− O of the next (step 3) = Pb²⁺ grabs δ− chlorine */
const VR=View3D.make({yaw:.2,pitch:-.15,auto:0,hint:false});
const PAIR_W=(()=>{const a=K.water([-.16,0,0],[1,0,0],[0,1,0]),bO=G.add(a.h[0],[.18,0,0]),b=K.water(bO,[.6,.8,0],[0,0,1]);return [a,b];})();
function rhymeW(ctx,x,y,w,h){ctx.save();rr(ctx,x,y,w,h,12);ctx.fillStyle='rgba(255,255,255,.95)';ctx.fill();ctx.strokeStyle='#d5d9de';ctx.stroke();
  const [a,b]=PAIR_W,hw=(w-60)/2;
  VR.render(ctx,{x:x,y:y,w:hw,h,nm:330,center:[.05,0,0],items:[...K.waterItems(a,{charges:true}),...K.waterItems(b,{charges:true}),{t:'bond',a:a.h[0],b:b.o,r:.012,c:'#2f7fd0',dash:true}],bg:'#ffffff'});
  txt(ctx,'=',x+w/2,y+h/2+14,{s:40,w:700,c:C.ink,a:'center'});
  const cl=[.12,0,0],pb=[-.18,0,0];VR.render(ctx,{x:x+w-hw,y:y,w:hw,h,nm:250,center:[-.03,0,0],items:[{t:'atom',p:cl,r:.1,c:'#2fae4f'},{t:'atom',p:cl,r:.2,c:NEG,op:.25},{t:'atom',p:pb,r:.13,c:'#4a5568'},{t:'atom',p:pb,r:.24,c:POS,op:.25},{t:'bond',a:pb,b:cl,r:.012,c:'#2f7fd0',dash:true}],bg:'#ffffff'});
  ctx.restore();}
/* the two pictures the student taps to predict */
const PICKS=[{v:'c',x:600,y:36},{v:'cl',x:740,y:36}];
function pickCards(ctx,S){const L=S.lead;PICKS.forEach(c=>{rr(ctx,c.x,c.y,120,120,14);ctx.fillStyle='#fff';ctx.fill();ctx.lineWidth=2;ctx.strokeStyle='#26262b';ctx.stroke();
  const cx=c.x+60,cy=c.y+60;if(c.v==='cl'){ctx.beginPath();ctx.arc(cx,cy,40,0,7);ctx.fillStyle='rgba(224,69,58,.25)';ctx.fill();}
  const g=ctx.createRadialGradient(cx-8,cy-9,3,cx,cy,c.v==='cl'?24:20);g.addColorStop(0,'#fff');g.addColorStop(.4,c.v==='cl'?'#2fae4f':'#5f6670');g.addColorStop(1,c.v==='cl'?'#17602b':'#2a2e33');ctx.beginPath();ctx.arc(cx,cy,c.v==='cl'?24:20,0,7);ctx.fillStyle=g;ctx.fill();});
  // the lead ion waiting, with its + glow and a question mark
  const lx=730,ly=222;ctx.beginPath();ctx.arc(lx,ly,34,0,7);ctx.fillStyle='rgba(59,111,216,.25)';ctx.fill();ctx.beginPath();ctx.arc(lx,ly,20,0,7);ctx.fillStyle='#4a5568';ctx.fill();
  txt(ctx,'?',lx+44,ly+12,{s:34,w:800,c:C.ink});ctx.save();ctx.globalAlpha=.55+.45*Math.sin(S.t*4);txt(ctx,'👆',800,190,{s:30,a:'center'});ctx.restore();}
/* ---------- chapters ---------- */
const PICK=['Wax makes water lighter, so it floats up into balls','A thin layer of air under the water holds it up','Wax is so slippery that water slides into balls','Water sticks to itself more strongly than it sticks to wax'];
const V5=View3D.make({yaw:.35,pitch:-.3,auto:.12}),V2=View3D.make({yaw:.2,pitch:-.2,auto:.25}),V3=View3D.make({yaw:.4,pitch:-.25,auto:.15}),V4=View3D.make({yaw:.45,pitch:-.32,auto:.1});
const bg=(ctx,c)=>{ctx.fillStyle=c||'#f4f6f8';ctx.fillRect(0,0,W,H);};
const legendRow=(ctx,x,y,rows)=>{let xx=x;rows.forEach(([c,t])=>{ctx.beginPath();ctx.arc(xx+7,y-5,7,0,7);ctx.fillStyle=c;ctx.fill();xx+=18;xx+=txt(ctx,t,xx,y,{s:13,c:C.ink})+14;});};
/* ---------- "Who is doing this" (Nov 25, 2026): Dar Si Hmad's fog nets, Mount Boutmezguida, Morocco ----------
   Sources: UN Climate Change, Momentum for Change entry "Women-led Fog Harvesting" (Dar Si Hmad, a women-led NGO; Ait Baamrane villages
   on the edge of the Sahara; 600 m² of nets capture an average of 6,300 liters a day, more than enough for 400 residents); Stanford Social
   Innovation Review (cofounded 2010 by Aissa Derhem and anthropologist Jamila Bargach; water collection used to take nearly four hours a day,
   done by women); World Economic Forum / Thomson Reuters Foundation (the first nets tore in high winds; the German WaterFoundation helped
   build stronger CloudFisher nets); PBS SoCal Earth Focus (freeing girls and young women to go to school); fog-collector physics (US patent
   10,882,054: a solid plate deflects the airflow and the droplets with it; on a mesh, droplets hit the threads, stick, join, and drip into a
   gutter once big enough). What the student does and sees, with no numbers on screen: put up a mesh or a solid sheet, thick or light fog
   (cause) → droplets stick to the threads and join into drops that run down (transformation) → the village tank fills, the tap runs, and a
   girl walks to school instead of a woman walking to the far well (effect). Rates are made up; drawings, not to scale. */
const FG_PICK=[{v:'sheet',x:600,y:30,draw(ctx,cx,cy){ctx.fillStyle='#8d97a3';ctx.fillRect(cx-30,cy-14,60,40);ctx.strokeStyle='#5a626c';ctx.lineWidth=2;ctx.strokeRect(cx-30,cy-14,60,40);txt(ctx,'solid sheet',cx,cy-24,{s:13,w:700,c:C.ink,a:'center'});}},
  {v:'mesh',x:740,y:30,draw(ctx,cx,cy){ctx.strokeStyle='#5a626c';ctx.lineWidth=2;ctx.strokeRect(cx-30,cy-14,60,40);ctx.lineWidth=.8;ctx.strokeStyle='#7d8794';for(let k=-26;k<30;k+=5){ctx.beginPath();ctx.moveTo(cx+k,cy-14);ctx.lineTo(cx+k,cy+26);ctx.stroke();}for(let k=-10;k<26;k+=5){ctx.beginPath();ctx.moveTo(cx-30,cy+k);ctx.lineTo(cx+30,cy+k);ctx.stroke();}txt(ctx,'mesh net',cx,cy-24,{s:13,w:700,c:C.ink,a:'center'});}}];
const FG_FIB=[0,1,2,3,4,5,6,7].map(i=>652+i*28),FG_BOX=[600,24,285,236];
function newFg(){return {pick:null,k:0,net:'mesh',fog:'thick',d:[],st:[],slide:[],tank:.15,full:false,rev:false,flow:[],walk:0};}
function fgTick(S,dt){const M=S.fg;if(!M||!M.pick)return;M.k=Math.min(1,M.k+dt*.5);if(M.pick!=='mesh'&&!M.mesh)return;
  const mesh=M.net==='mesh';
  // fog droplets drift in from the ocean side
  if(Math.random()<dt*(M.fog==='thick'?32:5))M.d.push({x:604,y:40+Math.random()*190,vy:0});
  M.d.forEach(q=>{q.x+=62*dt;q.y+=Math.sin(q.x*.05)*.3;
    if(!mesh){// a solid sheet turns the air aside, and the droplets with it
      const cy=140;if(q.x>655&&q.x<700){q.vy+=(q.y<cy?-1:1)*160*dt;}q.y+=q.vy*dt;if(q.x>=700&&!q.hit){q.hit=true;if(q.y>40&&q.y<240&&Math.random()<.02){q.done=true;M.st.push({x:700,y:q.y,v:1});}else q.y=q.y<cy?Math.min(q.y,34):Math.max(q.y,246);}}
    else{for(let fi=0;fi<FG_FIB.length;fi++){const fx=FG_FIB[fi];if(q.x>=fx&&(q.f==null||q.f<fi)){q.f=fi;if(Math.random()>.22)continue;q.done=true;// it sticks; drops close together join (water sticks to water)
        const near=M.st.find(s=>Math.abs(s.x-fx)<1&&Math.abs(s.y-q.y)<22);if(near)near.v+=1;else M.st.push({x:fx,y:q.y,v:1});break;}}}
    if(q.x>885||q.y<26||q.y>256)q.done=true;});
  M.d=M.d.filter(q=>!q.done);
  M.st.forEach(s=>{const r=1.6+Math.sqrt(s.v)*1.5;if(r>4.4){s.done=true;M.slide.push({x:s.x,y:s.y,r});}});M.st=M.st.filter(s=>!s.done);
  M.slide.forEach(s=>{s.y+=90*dt;// sliding drops sweep up the small ones below them
    M.st.forEach(o=>{if(!o.done&&Math.abs(o.x-s.x)<1&&o.y>s.y-2&&o.y<s.y+8){o.done=true;s.r=Math.min(8,s.r+.3);}});
    if(s.y>238){s.done=true;M.tank=Math.min(1,M.tank+.06);M.flow.push({u:0});}});
  M.st=M.st.filter(s=>!s.done);M.slide=M.slide.filter(s=>!s.done);
  M.flow.forEach(f=>f.u+=dt*.6);M.flow=M.flow.filter(f=>f.u<1);
  M.tank=Math.max(0,M.tank-dt*.045);if(M.tank>.9&&mesh)M.full=true;if(M.full&&!mesh&&M.tank<.5)M.rev=true;
  M.walk+=dt;}
function fgNet(ctx,x,y,mesh){// a CloudFisher-style panel: steel frame on posts, fine mesh, a gutter along the bottom
  ctx.fillStyle='#6b7178';ctx.fillRect(x-2,y,3,46);ctx.fillRect(x+55,y,3,46);
  if(mesh){ctx.fillStyle='rgba(60,70,80,.18)';ctx.fillRect(x,y,56,30);ctx.strokeStyle='rgba(60,70,80,.45)';ctx.lineWidth=.5;for(let k=2;k<56;k+=3){ctx.beginPath();ctx.moveTo(x+k,y);ctx.lineTo(x+k,y+30);ctx.stroke();}for(let k=2;k<30;k+=3){ctx.beginPath();ctx.moveTo(x,y+k);ctx.lineTo(x+56,y+k);ctx.stroke();}}
  else{ctx.fillStyle='#8d97a3';ctx.fillRect(x,y,56,30);}
  ctx.strokeStyle='#4b525b';ctx.lineWidth=2;ctx.strokeRect(x,y,56,30);ctx.fillStyle='#4b525b';ctx.fillRect(x-1,y+30,58,4);}
function fgScene(ctx,S){const M=S.fg,t=S.t,on=!!M.pick,mesh=M.net==='mesh',thick=M.fog==='thick';
  const sky=ctx.createLinearGradient(0,0,0,240);sky.addColorStop(0,'#c9d6df');sky.addColorStop(1,'#eef0ea');ctx.fillStyle=sky;ctx.fillRect(0,0,590,430);
  ctx.fillStyle='#7fa3c0';ctx.fillRect(0,196,120,8);// the Atlantic, far off
  // the mountain: dry, rocky, a few argan trees
  const mg=ctx.createLinearGradient(0,110,0,430);mg.addColorStop(0,'#b38a5a');mg.addColorStop(1,'#8a6a45');const ridge=[];for(let x=60;x<=590;x+=10){const base=x<180?lerp(430,154,Math.pow((x-60)/120,.8)):x<=400?146+Math.pow((x-290)/110,2)*8:lerp(154,300,Math.pow((x-400)/190,1.1));const top=x>=180&&x<=400;ridge.push([x,base+(top?Math.sin(x*.3)*1.5:Math.sin(x*.21)*5+Math.sin(x*.07+1)*6)]);}
  ctx.fillStyle=mg;ctx.beginPath();ctx.moveTo(60,430);ridge.forEach(([x,y])=>ctx.lineTo(x,y));ctx.lineTo(590,430);ctx.closePath();ctx.fill();
  ctx.save();ctx.clip();const sh=ctx.createLinearGradient(290,0,590,0);sh.addColorStop(0,'rgba(60,40,25,0)');sh.addColorStop(1,'rgba(60,40,25,.35)');ctx.fillStyle=sh;ctx.fillRect(290,120,300,310);
  ctx.strokeStyle='rgba(80,55,35,.35)';ctx.lineWidth=1.5;for(let k=0;k<7;k++){const y0=180+k*34;ctx.beginPath();for(let x=60;x<=590;x+=12){const y=y0+Math.sin(x*.05+k)*6+(x-290)*.08;ctx[x===60?'moveTo':'lineTo'](x,y);}ctx.stroke();}
  ctx.fillStyle='rgba(215,190,150,.35)';[[220,250,40,14],[360,230,34,12],[300,330,50,16]].forEach(([x,y,w,h])=>{ctx.beginPath();ctx.ellipse(x,y,w,h,.3,0,7);ctx.fill();});ctx.restore();
  ctx.fillStyle='rgba(90,65,40,.35)';for(let i=0;i<40;i++){const x=120+((i*61)%440),y=170+((i*37)%240);if(y>140+Math.abs(x-290)*.5)ctx.fillRect(x,y,4,2);}
  [[150,262],[205,218],[420,232],[500,300],[110,330]].forEach(([x,y])=>{ctx.fillStyle='#4a3424';ctx.fillRect(x-1.5,y-8,3,8);ctx.fillStyle='#4f6a3a';[[-6,-11],[0,-14],[6,-11]].forEach(([dx,dy])=>{ctx.beginPath();ctx.arc(x+dx,y+dy,5,0,7);ctx.fill();});});
  // the nets along the ridge
  [[200,108],[262,100],[324,104]].forEach(([x,y])=>fgNet(ctx,x,y,mesh));
  // the fog: rolling in from the ocean; around a solid sheet it streams away
  const fa=thick?.7:.32;for(let i=0;i<9;i++){const fx=((t*22+i*80)%700)-120,fy=110+((i*29)%60),r=46+((i*13)%30);const g=ctx.createRadialGradient(fx,fy,4,fx,fy,r);g.addColorStop(0,`rgba(255,255,255,${fa})`);g.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(fx,fy,r*1.6,r*.7,0,0,7);ctx.fill();}
  if(on&&!mesh){ctx.strokeStyle='rgba(255,255,255,.85)';ctx.lineWidth=2;for(let k=0;k<3;k++){const yy=96+k*8;ctx.beginPath();ctx.moveTo(150,yy+10);ctx.bezierCurveTo(190,yy+10,190,yy-30,240,yy-34);ctx.lineTo(360,yy-34);ctx.stroke();}}
  // pipe down to the reservoir; water moves in it after each drop
  const P=[[290,138],[330,200],[420,262],[470,300]];ctx.strokeStyle='#5a626c';ctx.lineWidth=4;ctx.beginPath();P.forEach((p,i)=>ctx[i?'lineTo':'moveTo'](p[0],p[1]));ctx.stroke();
  M.flow.forEach(f=>{const u=f.u*3,i=Math.min(2,Math.floor(u)),k=u-i,x=lerp(P[i][0],P[i+1][0],k),y=lerp(P[i][1],P[i+1][1],k);ctx.fillStyle='#4f9ad6';ctx.beginPath();ctx.arc(x,y,3,0,7);ctx.fill();});
  // the reservoir, seen in cutaway, and the village of flat-roofed houses
  const tx=462,ty=292;ctx.fillStyle='#c9c2b4';ctx.fillRect(tx,ty,64,46);ctx.fillStyle='#e9eef2';ctx.fillRect(tx+6,ty+6,52,34);const wl=M.tank*34;ctx.fillStyle='#4f9ad6';ctx.fillRect(tx+6,ty+40-wl,52,wl);ctx.strokeStyle='#8a8378';ctx.lineWidth=2;ctx.strokeRect(tx,ty,64,46);
  [[480,368,46,28],[532,360,40,34],[430,380,40,26],[550,392,36,24]].forEach(([x,y,w,h])=>{ctx.fillStyle='#c79b6a';ctx.fillRect(x,y,w,h);ctx.fillStyle='#b0855a';ctx.fillRect(x,y,w,4);ctx.fillStyle='#4a3424';ctx.fillRect(x+w*.4,y+h*.45,7,h*.55);ctx.fillRect(x+6,y+8,6,6);});
  // the far well and the school: who walks where
  ctx.fillStyle='#9a8a74';ctx.beginPath();ctx.ellipse(40,404,16,6,0,0,7);ctx.fill();ctx.strokeStyle='#6b5a44';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(30,404);ctx.lineTo(30,386);ctx.lineTo(50,386);ctx.lineTo(50,404);ctx.stroke();
  ctx.strokeStyle='rgba(120,90,55,.6)';ctx.setLineDash([5,5]);ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(60,404);ctx.quadraticCurveTo(250,420,430,396);ctx.stroke();ctx.setLineDash([]);
  ctx.fillStyle='#e9e2d2';ctx.fillRect(250,382,46,28);ctx.fillStyle='#b0855a';ctx.beginPath();ctx.moveTo(246,382);ctx.lineTo(273,368);ctx.lineTo(300,382);ctx.closePath();ctx.fill();ctx.fillStyle='#4a3424';ctx.fillRect(268,396,9,14);ctx.strokeStyle='#4b525b';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(296,368);ctx.lineTo(296,346);ctx.stroke();ctx.fillStyle='#c1272d';ctx.fillRect(296,346,12,8);ctx.fillStyle='#006233';ctx.fillRect(300,348,4,4);
  const water=M.tank>.35&&on,u=(M.walk*.06)%1;
  if(!water){// a woman carrying water from the far well
    const x=lerp(70,420,u),y=405+Math.sin(u*Math.PI)*10;fgPerson(ctx,x,y,'#8a3b5a',true,t);}
  else{// a girl with a school bag, headed to school
    const x=lerp(430,300,u),y=402+Math.sin(u*Math.PI)*6;fgPerson(ctx,x,y,'#2f6fb0',false,t,true);}
  if(M.pick==='sheet'&&M.k<1&&!M.mesh){ctx.save();ctx.globalAlpha=1-M.k;ctx.fillStyle='rgba(255,255,255,.9)';rr(ctx,170,40,240,34,8);ctx.fill();txt(ctx,'the fog goes around it',290,62,{s:15,w:700,c:'#4b525b',a:'center'});ctx.restore();}}
function fgPerson(ctx,x,y,col,cans,t,bag){const s=Math.sin(t*8)*2.5;ctx.save();ctx.translate(x,y);ctx.fillStyle='#5a3a26';ctx.fillRect(-2-s*.3,-10,2.2,10);ctx.fillRect(1+s*.3,-10,2.2,10);ctx.fillStyle=col;rr(ctx,-5,-26,11,17,4);ctx.fill();
  if(!bag){ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(-6,-25);ctx.lineTo(0,-33);ctx.lineTo(7,-25);ctx.closePath();ctx.fill();}
  ctx.fillStyle='#8a5a3c';ctx.beginPath();ctx.arc(.5,-30,4.5,0,7);ctx.fill();
  if(cans){ctx.fillStyle='#e8c43a';ctx.fillRect(-12,-16,6,9);ctx.fillRect(7,-16,6,9);}
  if(bag){ctx.fillStyle='#c1272d';rr(ctx,4,-25,6,10,2);ctx.fill();}ctx.restore();}
function fgInside(ctx,S){const M=S.fg,mesh=M.net==='mesh';
  ctx.save();ctx.strokeStyle='rgba(60,60,70,.45)';ctx.lineWidth=1.2;ctx.setLineDash([5,4]);ctx.beginPath();ctx.rect(262,96,62,40);ctx.stroke();ctx.beginPath();ctx.moveTo(324,100);ctx.lineTo(600,40);ctx.stroke();ctx.restore();
  ctx.save();rr(ctx,...FG_BOX,12);ctx.clip();const bg=ctx.createLinearGradient(600,0,885,0);bg.addColorStop(0,'#e6ecf0');bg.addColorStop(1,'#f3f5f6');ctx.fillStyle=bg;ctx.fillRect(...FG_BOX);
  if(mesh){ctx.strokeStyle='#7d8794';ctx.lineWidth=2;FG_FIB.forEach(x=>{ctx.beginPath();ctx.moveTo(x,24);ctx.lineTo(x,240);ctx.stroke();});ctx.lineWidth=1;ctx.strokeStyle='rgba(125,135,148,.5)';for(let y=40;y<240;y+=28){ctx.beginPath();ctx.moveTo(640,y);ctx.lineTo(860,y);ctx.stroke();}}
  else{const g=ctx.createLinearGradient(700,0,810,0);g.addColorStop(0,'#9aa3ad');g.addColorStop(1,'#7d8794');ctx.fillStyle=g;ctx.fillRect(700,36,110,204);}
  ctx.fillStyle='#4b525b';ctx.fillRect(630,240,240,8);
  M.d.forEach(q=>{ctx.fillStyle='rgba(120,170,215,.75)';ctx.beginPath();ctx.arc(q.x,q.y,1.6,0,7);ctx.fill();});
  const drop=(x,y,r)=>{const g=ctx.createRadialGradient(x-r*.35,y-r*.35,.5,x,y,r);g.addColorStop(0,'#ffffff');g.addColorStop(.35,'#9fd0f2');g.addColorStop(1,'#3d86c6');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.fill();};
  M.st.forEach(s=>drop(s.x,s.y,1.6+Math.sqrt(s.v)*1.5));M.slide.forEach(s=>drop(s.x,s.y,s.r));
  ctx.restore();ctx.strokeStyle='#8a8f98';ctx.lineWidth=2;rr(ctx,...FG_BOX,12);ctx.stroke();
  // the village tap
  ctx.save();rr(ctx,600,272,285,150,12);ctx.clip();ctx.fillStyle='#efe6d6';ctx.fillRect(600,272,285,150);ctx.fillStyle='#c79b6a';ctx.fillRect(600,272,285,70);
  ctx.fillStyle='#9aa1a9';ctx.fillRect(724,300,30,8);ctx.fillRect(748,300,8,22);ctx.fillStyle='#b9b2a6';rr(ctx,690,360,120,36,6);ctx.fill();ctx.fillStyle='#8f887c';ctx.fillRect(690,360,120,6);
  const on=M.tank>.08;if(on){ctx.fillStyle='rgba(79,154,214,.85)';ctx.fillRect(749,322,6,40);ctx.fillStyle='#4f9ad6';ctx.fillRect(696,366,108,10+M.tank*14);}
  ctx.fillStyle='#e8c43a';rr(ctx,826,352,30,38,4);ctx.fill();ctx.fillStyle='#c9a52a';ctx.fillRect(834,346,12,8);
  ctx.restore();ctx.strokeStyle='#d5d9de';ctx.lineWidth=1.5;rr(ctx,600,272,285,150,12);ctx.stroke();}
function fgRhyme(ctx){Who.rhyme(ctx,20,440,560,140,(c,x,y,w,h)=>{const wtr=(ox,oy,a)=>{c.fillStyle='#e0453a';c.beginPath();c.arc(ox,oy,11,0,7);c.fill();[[-1,1],[1,1]].forEach(([dx])=>{const hx=ox+Math.cos(a+dx*.9)*16,hy=oy+Math.sin(a+dx*.9)*16;c.fillStyle='#f2f2f2';c.beginPath();c.arc(hx,hy,6.5,0,7);c.fill();c.strokeStyle='#bbb';c.lineWidth=1;c.stroke();});};
    wtr(x+60,y+h/2,0);wtr(x+150,y+h/2,Math.PI);c.save();c.strokeStyle='#2f7fd0';c.lineWidth=2.5;c.setLineDash([4,4]);c.beginPath();c.moveTo(x+82,y+h/2);c.lineTo(x+136,y+h/2);c.stroke();c.restore();},
  (c,x,y,w,h)=>{c.strokeStyle='#7d8794';c.lineWidth=3;c.beginPath();c.moveTo(x+w/2,y+10);c.lineTo(x+w/2,y+h-10);c.stroke();const d=(dx,dy,r)=>{const g=c.createRadialGradient(dx-r*.35,dy-r*.35,.5,dx,dy,r);g.addColorStop(0,'#fff');g.addColorStop(.35,'#9fd0f2');g.addColorStop(1,'#3d86c6');c.fillStyle=g;c.beginPath();c.arc(dx,dy,r,0,7);c.fill();};
    d(x+w/2,y+h/2-16,9);d(x+w/2,y+h/2+10,12);c.save();c.strokeStyle='#2f7fd0';c.lineWidth=2;c.setLineDash([3,3]);c.beginPath();c.moveTo(x+w/2+14,y+h/2-14);c.quadraticCurveTo(x+w/2+26,y+h/2-2,x+w/2+16,y+h/2+8);c.stroke();c.restore();});}
function fgPick(S,v){const M=S.fg;if(!M)return;if(!M.mesh){M.pick=v;M.k=0;if(v==='mesh'){M.mesh=true;M.net='mesh';S.v.fn='mesh';}else M.net='sheet';}}

Story.start({
  id:'waterbeads',title:'Why does water bead up on a waxed car?',W,H,labHref:'../index.html#polarity',
  about:'<p><b>What is real.</b> Water is bent: O–H bonds 0.096 nm long at 104.5°. Oxygen pulls the shared electrons toward itself, so its end is slightly negative and the hydrogen ends slightly positive. Hydrogen bonds (dashed) are drawn at their real length. Wax is chains of carbon and hydrogen; clean glass is covered in O–H groups. Contact angles: about 105° on wax, under 20° on clean glass.</p><p><b>What is simplified.</b> About 34 water molecules stand in for a drop; a real bead holds about 10²¹. The wax chains are drawn only 4 carbons deep. The glow around each atom marks its partial charge; real molecules have no color.</p><p><b>Who is doing this (step 6).</b> Gitanjali Rao’s story is from Wikipedia, Colorado Public Radio (2019), The Analytical Scientist, WaterWorld and Science Blog. Her real sensor is a film of many carbon nanotubes between two electrodes; the picture shows one tube and far fewer lead ions than a real sample. The EPA lowered its lead action level from 15 to 10 parts per billion in October 2024.</p><p><b>Fog nets (step 7).</b> Dar Si Hmad, a women-led nonprofit co-founded in 2010 by anthropologist Jamila Bargach and Aissa Derhem, collects drinking water from fog on Mount Boutmezguida in southwest Morocco, on the edge of the Sahara. About 600 square meters of nets catch an average of 6,300 liters a day, more than enough for about 400 people in five villages; before, women spent close to four hours a day fetching water. The first nets tore in high winds; stronger CloudFisher nets came from a partnership with the German WaterFoundation. Why a mesh and not a solid sheet: air pushes around a solid sheet and carries the droplets with it, but it passes through a mesh, so droplets hit the threads, stick, join into bigger drops (water sticks to water), and run down into a gutter. Sources: UN Climate Change (Momentum for Change); Stanford Social Innovation Review; World Economic Forum; PBS SoCal Earth Focus; US patent 10,882,054. Rates in the picture are made up.</p>',
  tell:{frames:FRAMES,terms:['polar|lopsided','δ+|δ−|partial charge','hydrogen bond','nonpolar|no charges','wax','bead|round'],
    nudge:'For each picture ask: what had to be true first for this to happen?',
    done:'<b>That is the story.</b> Now tell it in your own words.',
    prompt:'Why does water bead up on a waxed car but spread out on a clean window? Tell the story. Use “because” and “so”.',placeholder:'A water molecule is lopsided… because… so…'},
  chapters:[
  {rail:'The question',title:'Beads on the car, a sheet on the glass',
   predict:{key:'why',q:'After a rain, water sits in round beads on a freshly waxed car, but spreads out flat on a clean window. Why the beads?',opts:PICK,right:3,after:'<b>Locked in.</b> Steps 2 to 4 will show you.'},
   text:'<p class="why">Take your best guess.</p>',alt:'Both surfaces got the same rain. So the difference must be in how water gets along with each surface, and how water gets along with itself.',
   draw(ctx,S){bg(ctx,'#f4f1ea');hood(ctx,40,60,520,420);glassPane(ctx,640,60,520,420);
     pill(ctx,'Waxed car hood',300,520,{bg:'#fff',c:C.ink,bd:C.ink,s:17,w:700,r:9});pill(ctx,'Clean window glass',900,520,{bg:'#fff',c:C.ink,bd:C.ink,s:17,w:700,r:9});}},

  {rail:'One water',title:'A water molecule is lopsided',live:true,
   text(S){return S.v.ch?'Oxygen pulls the shared electrons toward itself. So the oxygen end is slightly <b style="color:'+C.neg+'">negative (δ−)</b> and the two hydrogen ends are slightly <b style="color:'+C.pos+'">positive (δ+)</b>. A molecule with charged ends like this is called <b class="term">polar</b>.':
     'This is one water molecule, H₂O, at its real shape: bent, not straight, with the two hydrogens 104.5° apart. <b>Drag to turn it</b>, then <b>show the charges</b>.';},
   alt:'Think of a tug of war over the electrons that hold the molecule together. Oxygen is the stronger puller, so the electrons spend more time near it. That makes the oxygen side a little negative and leaves the hydrogen sides a little positive, like the two ends of a magnet.',
   ui:[{type:'seg',key:'ch',val:0,label:'Charges',opts:[{v:0,l:'Hide'},{v:1,l:'Show the charges'}]}],
   todo:[{t:'Drag the molecule to turn it',ok:()=>V2.touched},{t:'Show the charges',ok:S=>S.v.ch===1}],
   enter(S){S.v.ch=0;},
   draw(ctx,S){bg(ctx);const w=ONE;V2.render(ctx,{x:0,y:0,w:880,h:600,nm:1100,items:[...K.waterItems(w,{charges:!!S.v.ch,s:1}),...(S.v.ch?[{t:'tag',p:G.add(w.o,[0,-.1,0]),text:'δ−',c:C.neg,s:20,w:700},{t:'tag',p:G.add(w.h[0],[0,.07,0]),text:'δ+',c:C.pos,s:20,w:700},{t:'tag',p:G.add(w.h[1],[0,.07,0]),text:'δ+',c:C.pos,s:20,w:700}]:[])],bg:'#f4f6f8'});
     K.panel(ctx,'What you are looking at',[[G.C.O,'oxygen atom'],['#e9e9e9','hydrogen atom'],...(S.v.ch?[[C.neg,'slightly negative (δ−)',.45],[C.pos,'slightly positive (δ+)',.45]]:[])],(x,y)=>{
       txt(ctx,'O–H bond: 0.096 nm long',x+18,y+10,{s:13.5,c:C.soft});txt(ctx,'Angle between the Hs: 104.5°',x+18,y+30,{s:13.5,c:C.soft});});}},

  {rail:'Sticky',title:'Water sticks to water',live:true,
   text(S){return 'Put many waters together. The <b style="color:'+C.pos+'">δ+</b> hydrogen of one water is pulled toward the <b style="color:'+C.neg+'">δ−</b> oxygen of the next. Each dashed blue line is one of these pulls, a <b class="term">hydrogen bond</b>. '+
     'Every water is held by its neighbors, so water sticks to itself, hard. <b>Drag to turn it</b> and find the dashed lines.';},
   alt:'Picture a crowd where everyone is holding the hands of the people next to them. Nobody can wander off alone; the whole crowd moves as one clump. Hydrogen bonds are those held hands.',
   todo:[{t:'Drag the water to turn it',ok:()=>V3.touched}],
   draw(ctx,S){bg(ctx);const Wt=waters(FREE);V3.render(ctx,{x:0,y:0,w:880,h:600,nm:310,items:[...Wt.flatMap(w=>K.waterItems(w)),...hbonds(Wt).map(([a,b])=>({t:'bond',a,b,r:.012,c:'#2f7fd0',dash:true}))],bg:'#f4f6f8'});
     K.panel(ctx,'What you are looking at',[[G.C.O,'oxygen (δ−)'],['#e9e9e9','hydrogen (δ+)'],['#2f7fd0','hydrogen bond (dashed)']],(x,y)=>{K.stat(ctx,x,y+20,'Waters drawn',Wt.length);K.stat(ctx,x,y+62,'Hydrogen bonds',hbonds(Wt).length,'#2f7fd0');
       txt(ctx,'H to O in a hydrogen bond: 0.18 nm',x+18,y+104,{s:13.5,c:C.soft});});}},

  {rail:'Wax or glass',title:'Wax gives water nothing to hold',live:true,
   text(S){const g=S.v.sf==='glass';return g?'Clean glass is covered in <b>O–H groups</b> with δ+ hydrogens. Water forms hydrogen bonds to the glass (dashed lines) and spreads out to touch as much of it as it can: a flat sheet.':
     'Car wax is long chains of <b>carbon and hydrogen</b>. Carbon and hydrogen share electrons almost evenly, so wax has <b>no δ+ or δ− ends</b>: it is <b class="term">nonpolar</b>. Water has nothing to grab, so it holds on to itself instead and pulls into a ball. Now try <b>glass</b>.';},
   alt:'If the people in that hand-holding crowd walk onto a floor with no handles to grab, they huddle together. Put handles in the floor and they spread out to grab them. Wax has no handles; glass is covered in them.',
   ui:[{type:'seg',key:'sf',val:'wax',label:'Surface',opts:[{v:'wax',l:'Car wax'},{v:'glass',l:'Clean glass'}]}],
   todo:[{t:'Try clean glass',ok:S=>S.v.sf==='glass'},{t:'Drag to look from the side',ok:()=>V4.touched}],
   enter(S){S.v.sf='wax';S.v.m=0;},tick(S,dt){const tg=S.v.sf==='glass'?1:0;S.v.m+=(tg-S.v.m)*Math.min(1,dt*1.8);},
   draw(ctx,S){bg(ctx);const m=ease(S.v.m),P=BEAD.map((p,i)=>[lerp(p[0],FLAT[i][0],m),lerp(p[1],FLAT[i][1],m),lerp(p[2],FLAT[i][2],m)]),Wt=waters(P),g=S.v.sf==='glass';
     const sb=g&&m>.85?surfBonds(Wt):[];
     V4.render(ctx,{x:0,y:0,w:880,h:600,nm:205,center:[0,.3,0],items:[...surfItems(g?'glass':'wax'),...Wt.flatMap(w=>K.waterItems(w)),...hbonds(Wt).map(([a,b])=>({t:'bond',a,b,r:.012,c:'#2f7fd0',dash:true,op:.6})),...sb.map(([a,b])=>({t:'bond',a,b,r:.016,c:C.rj,dash:true}))],bg:'#f4f6f8'});
     K.panel(ctx,'What you are looking at',g?[[C.si,'silicon (in glass)'],[G.C.O,'oxygen'],['#e9e9e9','hydrogen'],[C.rj,'water holding the glass']]:[[G.C.C,'carbon (in wax)'],['#e9e9e9','hydrogen'],[G.C.O,'oxygen (in water)'],['#2f7fd0','water holding water']],(x,y)=>{
       K.stat(ctx,x,y+20,'Water holding the surface',sb.length,C.rj);txt(ctx,g?'Water spreads into a thin sheet.':'Water huddles into a bead.',x+18,y+62,{s:14.5,w:700,c:C.ink});});}},

  {rail:'The bead',title:'From molecules to a drop you can see',live:true,
   text(S){const g=S.v.sf==='glass';return g?'On clean glass the drop spreads until its edge meets the glass at under 20°: almost flat. Water pulled outward by the glass beats water pulling on itself.':
     'On wax the edge of the drop meets the surface at about <b>105°</b>: more than a right angle, so the drop is a round bead. A bead this size holds about 10²¹ water molecules, all holding on to each other. Switch to glass to compare.';},
   alt:'The angle where a drop meets a surface is a score for a tug of war. Water pulling on itself pulls the drop into a ball. The surface pulling on the water flattens it out. On wax, water wins; on glass, the glass wins.',
   ui:[{type:'seg',key:'sf',val:'wax',label:'Surface',opts:[{v:'wax',l:'Car wax'},{v:'glass',l:'Clean glass'}]}],
   todo:[{t:'Compare wax and glass',ok:S=>S.v.sf==='glass'}],
   enter(S){S.v.sf='wax';S.v.m=0;},tick(S,dt){const tg=S.v.sf==='glass'?1:0;S.v.m+=(tg-S.v.m)*Math.min(1,dt*2.2);},
   draw(ctx,S){bg(ctx);const m=ease(S.v.m),th=lerp(105,18,m),a=lerp(120,290,m);ctx.fillStyle=m<.5?'#8e1d25':'#9cc3d6';ctx.fillRect(40,420,820,120);
     drop(ctx,450,420,a,th);angleMark(ctx,450,420,a,th);txt(ctx,'side view, about 50 times life size',450,575,{s:14,c:C.soft,a:'center'});
     K.panel(ctx,'The contact angle',[],(x,y)=>{K.stat(ctx,x,y+10,'Car wax',(m<.5?'▶ ':'')+'105°',C.ink);K.stat(ctx,x,y+52,'Clean glass',(m>=.5?'▶ ':'')+'under 20°',C.ink);
       txt(ctx,'More than 90°: the drop is a bead.',x+18,y+100,{s:14,c:C.soft});txt(ctx,'Under 90°: it spreads.',x+18,y+120,{s:14,c:C.soft});});}},

  {rail:'Who did it',title:'Gitanjali Rao, Lone Tree, Colorado',links:[{t:"One girl's commitment",u:"https://www.uspto.gov/learning-and-resources/journeys-innovation/field-stories/one-girls-commitment",d:"U.S. Patent and Trademark Office: how she invents"},{t:"TIME names its first Kid of the Year",u:"https://www.npr.org/2020/12/03/942034617/time-names-its-kid-of-the-year-water-testing-scientist-gitanjali-rao",d:"NPR"}],live:true,
   text(S){const L=S.lead,n=L?L.stuck:0;
     if(!L||!L.pick)return 'Lead in water is <b style="color:'+POS+'">positive</b>. Her sensor is a carbon tube with chlorine on it. <b>Tap the atom</b> that will grab the lead.';
     if(!L.adds)return (L.pick==='cl'?'Yes: ':'Not the carbon: ')+'<b style="color:'+NEG+'">negative</b> chlorine grabs <b style="color:'+POS+'">positive</b> lead. Same pull as water on water. <b>Add tap water with lead.</b>';
     return n<6?'Each lead ion it catches makes it harder for electricity to flow. Watch the meter.':'<b>Lead found.</b> Her sensor, Tethys, sends this to a phone. She built the first one in a cardboard box at age 11.';},
   alt:'Look at the two pictures at the bottom. A slightly positive hydrogen grabs a slightly negative oxygen. A positive lead ion grabs a negative chlorine. Opposite charges pull together in both.',
   ui:[{type:'seg',key:'pk',val:'',label:'Which atom grabs lead?',opts:[{v:'c',l:'Carbon'},{v:'cl',l:'Chlorine'}],on(S,v){if(S.lead&&!S.lead.pick)firstLead(S.lead,v);},show:S=>S.lead&&!S.lead.pick},
       {type:'button',label:'Add tap water with lead',pulse:true,act(S){addLead(S.lead);},show:S=>S.lead&&S.lead.pick&&S.lead.stuck<9&&S.lead.adds<4},{type:'button',label:'Start over',ghost:true,act(S){S.lead=newLead();S.v.pk='';},show:S=>S.lead&&S.lead.adds>0}],
   todo:[{t:'Tap the atom that grabs lead',ok:S=>S.lead&&S.lead.pick},{t:'Add lead until the sensor flags it',ok:S=>S.lead&&S.lead.stuck>=6}],
   enter(S){S.lead=newLead();S.v.pk='';},tick(S,dt){if(S.lead)stepLead(S.lead,dt);},
   click(S,x,y){const L=S.lead;if(!L||L.pick)return;for(const c of PICKS)if(x>c.x&&x<c.x+120&&y>c.y&&y<c.y+120){firstLead(L,c.v);S.v.pk=c.v;}},
   draw(ctx,S){bg(ctx);const L=S.lead||(S.lead=newLead());V5.render(ctx,{x:0,y:0,w:880,h:600,nm:205,center:[.3,-.22,0],items:leadItems(L),bg:'#f4f6f8'});
     if(!L.pick)pickCards(ctx,S);rhymeW(ctx,20,462,520,126);
     const x=900;ctx.fillStyle='#fff';ctx.strokeStyle='#d5d9de';ctx.lineWidth=1;rr(ctx,x,24,280,552,12);ctx.fill();ctx.stroke();
     const f=Math.min(1,.12+L.stuck/9),hit=L.stuck>=6;txt(ctx,'⚡ resistance',x+18,58,{s:16,w:700,c:C.ink});ctx.fillStyle='#eee';rr(ctx,x+18,70,244,22,6);ctx.fill();ctx.fillStyle=hit?C.rj:'#2f7fd0';rr(ctx,x+18,70,244*f,22,6);ctx.fill();
     txt(ctx,hit?'📱 Lead found':'📱 …',x+18,122,{s:17,w:700,c:hit?C.rj:C.soft});
     txt(ctx,'Gitanjali Rao',x+18,168,{s:17,w:700,c:C.ink});
     [['📺','age 11: Flint water'],['📦','cardboard prototype'],['🧑‍🔬','a 3M scientist mentor'],['🏆','2017: top young scientist'],['📰','2020: TIME Kid of the Year'],['🎓','MIT'],['🏪','not in stores yet']]
       .forEach(([i,t],k)=>{const y=206+k*42;txt(ctx,i,x+36,y,{s:24,a:'center'});txt(ctx,t,x+66,y-4,{s:14.5,w:600,c:C.ink});});
     txt(ctx,'Flags lead above 15 ppb. EPA action',x+18,520,{s:12,c:C.soft});txt(ctx,'level since 2024: 10 ppb.',x+18,536,{s:12,c:C.soft});}},

  {rail:'Who did it',title:'Fog nets, Mount Boutmezguida, Morocco',links:[{t:"Turning fog into water transforms women's lives in Morocco",u:"https://pbssocal.org/shows/earth-focus/turning-fog-into-water-transforms-womens-lives-in-morocco",d:"PBS SoCal Earth Focus"},{t:"These Moroccans are turning foggy days into a solution to their water crisis",u:"https://theworld.org/stories/2018/03/29/fog-nets-pkg",d:"The World: meet the fog technician"},{t:"A device that collects water from clouds",u:"https://www.smithsonianmag.com/innovation/device-collects-water-clouds-180962705/",d:"Smithsonian: how the CloudFisher net works"}],live:true,views:false,
   text(S){const M=S.fg;if(!M||!M.pick)return 'Southwest Morocco, on the edge of the Sahara: almost no rain, but fog rolls in from the Atlantic. <b>Tap what catches more of it.</b>';
     if(!M.mesh)return 'A solid sheet: the wind goes around it and carries the fog with it. Try the other.';
     if(M.rev)return 'Solid sheet: the fog slips past, and the tank runs low. Dar Si Hmad\'s nets catch about 6,300 liters a day for over 400 people.';
     if(M.full&&M.net==='mesh')return 'The tank is full and the tap runs: no long walk to the well, so a girl can walk to school. <b>Now put up a solid sheet.</b>';
     if(M.net==='sheet')return 'Watch the tank.';
     return 'Air flows through the mesh. Fog droplets hit the threads, stick, and join, because <b>water sticks to water</b>. Big drops run down to the pipe.';},
   alt:'Look at the two pictures at the bottom. Two water molecules hold on to each other. On a net, a fog droplet that lands next to another one joins it, and the drop grows until it is heavy enough to run down. Same pull, bigger scale.',
   ui:[{type:'seg',key:'fp',val:'',label:'What catches more fog?',opts:[{v:'sheet',l:'A solid sheet'},{v:'mesh',l:'A mesh net'}],on(S,v){fgPick(S,v);},show:S=>S.fg&&!S.fg.mesh},
     {type:'seg',key:'fn',val:'mesh',label:'Put up',opts:[{v:'mesh',l:'Mesh net'},{v:'sheet',l:'Solid sheet'}],on(S,v){S.fg.net=v;},show:S=>S.fg&&S.fg.mesh},
     {type:'seg',key:'ff',val:'thick',label:'Fog',opts:[{v:'light',l:'Light'},{v:'thick',l:'Thick'}],on(S,v){S.fg.fog=v;},show:S=>S.fg&&S.fg.mesh}],
   todo:[{t:'Tap what catches more fog',ok:S=>S.fg&&S.fg.mesh},{t:'Fill the village tank',ok:S=>S.fg&&S.fg.full},{t:'Put up a solid sheet and watch',ok:S=>S.fg&&S.fg.rev}],
   enter(S){S.fg=newFg();S.v.fp='';S.v.fn='mesh';S.v.ff='thick';},tick(S,dt){fgTick(S,dt);},
   click(S,x,y){const v=Who.hit(FG_PICK,x,y);if(v&&!S.fg.mesh){fgPick(S,v);S.v.fp=v;}},
   draw(ctx,S){const M=S.fg||(S.fg=newFg());ctx.fillStyle='#f4f6f8';ctx.fillRect(0,0,W,H);fgScene(ctx,S);
     if(!M.mesh)Who.cards(ctx,S,FG_PICK,M.pick);else fgInside(ctx,S);fgRhyme(ctx);
     Who.panel(ctx,'Dar Si Hmad',[['🏜️','Sahara edge, little rain'],['🌫️','fog from the Atlantic'],['👩','2010: Jamila Bargach co-founds'],['🕸️','stronger nets from Germany'],['💧','about 6,300 liters a day'],['🏘️','400+ people, 5 villages'],['🌬️','hard part: winds tore nets']],['Sources: UN Climate Change; SSIR;','WEF; PBS SoCal Earth Focus.']);}},

  {rail:'Tell it',title:'Now you tell the story',tell:true}
  ]});
})();
