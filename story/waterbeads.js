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
/* ---------- chapters ---------- */
const PICK=['Wax makes water lighter, so it floats up into balls','A thin layer of air under the water holds it up','Wax is so slippery that water slides into balls','Water sticks to itself more strongly than it sticks to wax'];
const V2=View3D.make({yaw:.2,pitch:-.2,auto:.25}),V3=View3D.make({yaw:.4,pitch:-.25,auto:.15}),V4=View3D.make({yaw:.45,pitch:-.32,auto:.1});
const bg=(ctx,c)=>{ctx.fillStyle=c||'#f4f6f8';ctx.fillRect(0,0,W,H);};
Story.start({
  id:'waterbeads',title:'Why does water bead up on a waxed car?',W,H,labHref:'../index.html#polarity',
  about:'<p><b>What is real.</b> Water is bent: O–H bonds 0.096 nm long at 104.5°. Oxygen pulls the shared electrons toward itself, so its end is slightly negative and the hydrogen ends slightly positive. Hydrogen bonds (dashed) are drawn at their real length. Wax is chains of carbon and hydrogen; clean glass is covered in O–H groups. Contact angles: about 105° on wax, under 20° on clean glass.</p><p><b>What is simplified.</b> About 34 water molecules stand in for a drop; a real bead holds about 10²¹. The wax chains are drawn only 4 carbons deep. The glow around each atom marks its partial charge; real molecules have no color.</p>',
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

  {rail:'Tell it',title:'Now you tell the story',tell:true}
  ]});
})();
