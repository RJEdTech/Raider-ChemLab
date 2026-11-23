/* Story: "Why are salt grains little cubes?"  Ionic crystals, told as one story: opposite charges, a grid at right angles,
   six neighbors each, and a crystal that grows layer by layer. Written Nov 24, 2026.
   True to the real thing: table salt is sodium chloride; sodium ions (Na⁺, radius 0.102 nm) and chloride ions (Cl⁻, radius
   0.181 nm) alternate on a cubic grid, 0.282 nm center to center; every ion touches six ions of the other kind, at right angles.
   A crystal grows by adding ions to its faces, so its faces stay flat and meet at right angles: a cube. A grain of table salt is
   about 0.3 mm on an edge, which is about a million ions along each edge.
   Simplified: crystals of 2 to 6 ions per edge stand in for the real thing; ions are drawn at their real sizes in "space filling". */
(function(){
'use strict';
const {clamp,lerp,ease,rr,txt,pill}=Story.h,G=View3D.G,K=Chem3D;
const W=1200,H=600,A=.282,NA='#8e5ad6',CL='#2fae4f';
const C={ink:'#26262b',soft:'#62626a',rj:'#C11430'};
/* ions of an n×n×n crystal centered on 0; odd = which kind sits at the corner */
function lattice(n,odd){const o=[],h=(n-1)/2;for(let i=0;i<n;i++)for(let j=0;j<n;j++)for(let k=0;k<n;k++){const na=((i+j+k+(odd?1:0))%2)===0;o.push({p:[(i-h)*A,(j-h)*A,(k-h)*A],na,ijk:[i,j,k]});}return o;}
function ionItems(L,o){o=o||{};const it=[],fill=o.fill!==false,s=fill?1:.42;
  L.forEach(q=>{const dim=o.focus&&!o.focus(q);it.push({t:'atom',p:q.p,r:(q.na?.102:.181)*s,c:q.na?NA:CL,op:dim?.12:q.op});});
  if(!fill){for(let a=0;a<L.length;a++)for(let b=a+1;b<L.length;b++){const d=G.len(G.sub(L[a].p,L[b].p));if(Math.abs(d-A)<.01){const dim=o.focus&&!(o.focus(L[a])&&o.focus(L[b]));it.push({t:'bond',a:L[a].p,b:L[b].p,r:.012,c:'#b7bcc4',op:dim?.1:.8});}}}
  return it;}
/* ---------- 2D pictures ---------- */
function grain(ctx,x,y,s,shade){// a little cube of salt in a simple 3/4 view
  const d=s*.45;ctx.save();ctx.lineJoin='round';
  ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+s,y);ctx.lineTo(x+s,y+s);ctx.lineTo(x,y+s);ctx.closePath();ctx.fillStyle=`rgba(255,255,255,${.85*shade})`;ctx.fill();
  ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+d,y-d*.7);ctx.lineTo(x+s+d,y-d*.7);ctx.lineTo(x+s,y);ctx.closePath();ctx.fillStyle=`rgba(255,255,255,${.97*shade})`;ctx.fill();
  ctx.beginPath();ctx.moveTo(x+s,y);ctx.lineTo(x+s+d,y-d*.7);ctx.lineTo(x+s+d,y+s-d*.7);ctx.lineTo(x+s,y+s);ctx.closePath();ctx.fillStyle=`rgba(205,214,222,${.9*shade})`;ctx.fill();
  ctx.strokeStyle='rgba(120,135,150,.6)';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+s,y);ctx.lineTo(x+s,y+s);ctx.lineTo(x,y+s);ctx.closePath();ctx.moveTo(x,y);ctx.lineTo(x+d,y-d*.7);ctx.lineTo(x+s+d,y-d*.7);ctx.lineTo(x+s,y);ctx.moveTo(x+s+d,y-d*.7);ctx.lineTo(x+s+d,y+s-d*.7);ctx.lineTo(x+s,y+s);ctx.stroke();ctx.restore();}
function magnifier(ctx,cx,cy,r){ctx.save();ctx.beginPath();ctx.arc(cx,cy,r,0,7);ctx.fillStyle='#2b3440';ctx.fill();ctx.clip();const R=K.rng(7);
  for(let i=0;i<34;i++){const s=r*(.12+R()*.1);grain(ctx,cx-r+R()*r*1.7,cy-r+R()*r*1.7,s,.8+R()*.2);}ctx.restore();
  ctx.lineWidth=14;ctx.strokeStyle='#5b616b';ctx.beginPath();ctx.arc(cx,cy,r,0,7);ctx.stroke();ctx.lineWidth=22;ctx.lineCap='round';ctx.strokeStyle='#3a3f46';ctx.beginPath();ctx.moveTo(cx+r*.72,cy+r*.72);ctx.lineTo(cx+r*1.25,cy+r*1.25);ctx.stroke();}
/* ---------- tell-it pictures ---------- */
const fr=fn=>ctx=>{ctx.save();ctx.beginPath();ctx.rect(0,0,300,193.3);ctx.clip();ctx.fillStyle='#f4f6f8';ctx.fillRect(0,0,300,194);fn(ctx);ctx.restore();};
const VT=View3D.make({yaw:.6,pitch:-.45,auto:0,hint:false});
const r3=(items,nm)=>ctx=>VT.render(ctx,{x:0,y:0,w:300,h:193,nm,items,bg:'#f4f6f8'});
const PAIR=[{p:[-A/2,0,0],na:true},{p:[A/2,0,0],na:false}];
const FRAMES=[
 {label:'Under a magnifier, every grain of salt is a tiny cube',draw:fr(ctx=>magnifier(ctx,140,92,74))},
 {label:'Salt is made of Na⁺ and Cl⁻ ions: opposite charges attract',draw:fr(r3(ionItems(PAIR),420))},
 {label:'The ions stack in a grid where every line meets at a right angle',draw:fr(r3(ionItems(lattice(3,0),{fill:false}),210))},
 {label:'Each ion touches six of the other kind',draw:fr(r3(ionItems(lattice(3,0),{fill:false,focus:q=>{const [i,j,k]=q.ijk;return (i===1&&j===1&&k===1)||Math.abs(i-1)+Math.abs(j-1)+Math.abs(k-1)===1;}}),210))},
 {label:'New ions add on to the flat faces, so the crystal grows as a cube',draw:fr(r3(ionItems(lattice(5,1)),110))},
 {label:'A million ions along each edge make a cube you can see',draw:fr(ctx=>{grain(ctx,95,70,90,1);txt(ctx,'0.3 mm',140,186,{s:14,w:700,c:C.ink,a:'center'});})}];
/* ---------- chapters ---------- */
const PICK=['Salt is cut into cubes at the factory','The grains rub against each other until they are cubes','Cubes pack best into a salt shaker, so only cubes are sold','Its ions stack in a grid at right angles, so the crystal grows as a cube'];
const V2=View3D.make({yaw:.6,pitch:-.45,auto:.18}),V3=View3D.make({yaw:.6,pitch:-.4,auto:.15}),V4=View3D.make({yaw:.6,pitch:-.45,auto:.12});
const bg=ctx=>{ctx.fillStyle='#f4f6f8';ctx.fillRect(0,0,W,H);};
const KEY=[[NA,'sodium ion, Na⁺ (positive)'],[CL,'chloride ion, Cl⁻ (negative)']];
function newGrow(){return {n:2,fly:[],L:lattice(2,0)};}
function grow(S){const g=S.grow;if(g.n>=6||g.fly.length)return;const n=g.n+1,odd=n%2===0?0:1,L=lattice(n,0),have=new Set();
  // keep the old ions where they are (re-centered), and fly in the new outer layer from the surrounding water
  const sh=A/2;g.L=g.L.map(q=>({p:G.add(q.p,[-sh,-sh,-sh]),na:q.na,ijk:q.ijk.map(v=>v)}));
  g.L.forEach(q=>have.add(q.ijk.join(',')));const R=K.rng(n*13);
  L.forEach(q=>{if(q.ijk.every(v=>v<n-1)&&have.has(q.ijk.join(',')))return;const from=G.add(q.p,G.mul(G.norm(q.p[0]||q.p[1]||q.p[2]?q.p:[1,1,1]),1.2+R()*.6));g.fly.push({q,from,t:-R()*.5});});
  g.n=n;g.L=g.L.map(q=>q);g.L.forEach(q=>{q.na=((q.ijk[0]+q.ijk[1]+q.ijk[2])%2)===0;});}
Story.start({
  id:'saltcubes',title:'Why are salt grains little cubes?',W,H,labHref:'../index.html#ionic',
  about:'<p><b>What is real.</b> Table salt is sodium chloride. Sodium ions (Na⁺, radius 0.102 nm) and chloride ions (Cl⁻, radius 0.181 nm) alternate on a cubic grid, 0.282 nm apart center to center; every ion touches six of the other kind. A grain of table salt is about 0.3 mm on an edge: about a million ions along each edge.</p><p><b>What is simplified.</b> Crystals 2 to 6 ions on an edge stand in for real grains. The new ions in step 4 fly straight in; in real salt water they arrive one by one from all directions, wrapped in water molecules, and many land and leave before one sticks. Ions have no color; purple and green are labels.</p>',
  tell:{frames:FRAMES,terms:['ion','Na⁺|sodium','Cl⁻|chloride','attract|opposite','grid|lattice','right angle','six|6','cube'],
    nudge:'For each picture ask: what had to be true first for this to happen?',
    done:'<b>That is the story.</b> Now tell it in your own words.',
    prompt:'Why is every grain of table salt a tiny cube? Tell the story from the ions up. Use “because” and “so”.',placeholder:'Salt is made of ions… because… so…'},
  chapters:[
  {rail:'The question',title:'Look closely at table salt',
   predict:{key:'why',q:'Pour some table salt under a magnifier. Almost every grain is a tiny cube. Why cubes?',opts:PICK,right:3,after:'<b>Locked in.</b> Steps 2 to 4 will show you.'},
   text:'<p class="why">Take your best guess.</p>',alt:'Sugar grains and sand grains are not cubes. So whatever makes salt square must be about what salt is made of, deep inside.',
   draw(ctx,S){ctx.fillStyle='#f4f1ea';ctx.fillRect(0,0,W,H);magnifier(ctx,420,290,220);txt(ctx,'Table salt under a magnifier (each grain is about 0.3 mm)',420,570,{s:17,w:700,c:C.ink,a:'center'});}},

  {rail:'Zoom in',title:'Inside one grain',live:true,
   text(S){return S.v.vw==='stick'?'Pulled apart so you can see the pattern: the ions sit on a grid, like a 3D checkerboard. Every line of ions meets every other line at a <b>right angle</b>.':
     'Salt is sodium chloride: <b style="color:'+NA+'">sodium ions (Na⁺)</b>, which carry a positive charge, and bigger <b style="color:'+CL+'">chloride ions (Cl⁻)</b>, which carry a negative one. Opposite charges attract, so every sodium sits pressed against chlorides. Shown at their real sizes. <b>Drag to turn it</b>, then pull it apart.';},
   alt:'Think of a 3D checkerboard made of two sizes of marbles: small purple ones and big green ones. No two of the same color ever touch. That pattern runs all the way through the grain.',
   ui:[{type:'seg',key:'vw',val:'fill',label:'Show',opts:[{v:'fill',l:'Real size'},{v:'stick',l:'Pulled apart'}]}],
   todo:[{t:'Drag the crystal to turn it',ok:()=>V2.touched},{t:'Pull it apart',ok:S=>S.v.vw==='stick'}],
   enter(S){S.v.vw='fill';},
   draw(ctx,S){bg(ctx);V2.render(ctx,{x:0,y:0,w:880,h:600,nm:300,items:ionItems(lattice(4,0),{fill:S.v.vw!=='stick'}),bg:'#f4f6f8'});
     K.panel(ctx,'What you are looking at',KEY,(x,y)=>{txt(ctx,'Na⁺ radius: 0.102 nm',x+18,y,{s:13.5,c:C.soft});txt(ctx,'Cl⁻ radius: 0.181 nm',x+18,y+20,{s:13.5,c:C.soft});txt(ctx,'Center to center: 0.282 nm',x+18,y+40,{s:13.5,c:C.soft});K.stat(ctx,x,y+90,'Ions shown',64);});}},

  {rail:'Neighbors',title:'Every ion has six neighbors',live:true,
   text(S){const cl=S.v.ctr==='cl';return (cl?'This chloride ion':'This sodium ion')+' touches exactly <b>six</b> ions of the other kind: one above, one below, and four around, all at right angles and all the same distance away. '+
     'Ions with the same charge never touch. That is the arrangement that packs the most opposite charges together and keeps like charges apart. '+(cl?'':'Now check a <b>chloride</b>.');},
   alt:'Stand in the middle of a room. You can reach out in six directions: front, back, left, right, up, down. Each ion in salt has a neighbor of the opposite charge in each of those six directions, and nothing in between.',
   ui:[{type:'seg',key:'ctr',val:'na',label:'Center ion',opts:[{v:'na',l:'Sodium'},{v:'cl',l:'Chloride'}]}],
   todo:[{t:'Check a chloride too',ok:S=>S.v.ctr==='cl'}],
   enter(S){S.v.ctr='na';},
   draw(ctx,S){bg(ctx);const L=lattice(3,S.v.ctr==='cl'?1:0);V3.render(ctx,{x:0,y:0,w:880,h:600,nm:520,items:ionItems(L,{fill:false,focus:q=>{const [i,j,k]=q.ijk;return Math.abs(i-1)+Math.abs(j-1)+Math.abs(k-1)<=1;}}),bg:'#f4f6f8'});
     K.panel(ctx,'What you are looking at',KEY,(x,y)=>{K.stat(ctx,x,y+10,'Neighbors touching it',6,C.rj);K.stat(ctx,x,y+52,'Angle between them','90°');txt(ctx,'Faded: the rest of the grid.',x+18,y+96,{s:13.5,c:C.soft});});}},

  {rail:'Grow it',title:'Grow a crystal',live:true,
   text(S){const n=S.grow.n;return n<6?'In salty water, ions keep landing on a crystal. Each one fits only where the grid says it goes, so whole new layers build up on the flat faces. <b>Add a layer</b> and watch the shape.':
     'Six ions on each edge, '+6*6*6+' ions in all, and still a perfect cube. However big it grows, every new layer follows the same right angles, so the faces stay flat and square. That is why every grain of salt is a cube.';},
   alt:'Stacking sugar cubes on a table: however many you add, if you follow the grid you always end up with a box shape, never a ball. Salt ions follow their grid the same way.',
   ui:[{type:'button',label:'Add a layer',pulse:true,act(S){grow(S);},show:S=>S.grow&&S.grow.n<6},{type:'button',label:'Start over',act(S){S.grow=newGrow();},show:S=>S.grow&&S.grow.n>2}],
   todo:[{t:'Grow it to 6 ions on each edge',ok:S=>S.grow&&S.grow.n>=6&&!S.grow.fly.length}],
   enter(S){S.grow=newGrow();},
   tick(S,dt){const g=S.grow;if(!g)return;g.fly.forEach(f=>f.t+=dt*1.4);const done=g.fly.filter(f=>f.t>=1);done.forEach(f=>g.L.push(f.q));g.fly=g.fly.filter(f=>f.t<1);},
   draw(ctx,S){bg(ctx);const g=S.grow,it=ionItems(g.L);g.fly.forEach(f=>{const u=ease(clamp(f.t,0,1));it.push({t:'atom',p:G.add(f.from,G.mul(G.sub(f.q.p,f.from),u)),r:f.q.na?.102:.181,c:f.q.na?NA:CL,op:f.t<0?0:.4+.6*u});});
     V4.render(ctx,{x:0,y:0,w:880,h:600,nm:lerp(330,150,(g.n-2)/4),items:it,bg:'#f4f6f8'});
     K.panel(ctx,'What you are looking at',KEY,(x,y)=>{K.stat(ctx,x,y+10,'Ions on each edge',g.n,C.rj);K.stat(ctx,x,y+52,'Ions in the crystal',g.L.length+g.fly.length);txt(ctx,'Shape: '+(g.fly.length?'growing…':'a cube'),x+18,y+100,{s:15,w:700,c:C.ink});});}},

  {rail:'Real size',title:'How many ions in one grain?',live:true,
   text(S){const e=S.v.mm,n=e*1e-3/(A*1e-9);return 'A grain '+e.toFixed(1)+' mm on an edge has about <b>'+fmtBig(n)+' ions along each edge</b>, and about <b>'+fmtBig(n*n*n)+' ions</b> in all. '+
     'Every one of them sits on the same grid you built, so the whole grain comes out a cube. Move the slider to try other grain sizes.';},
   alt:'If each ion were the size of a grain of sand, one grain of table salt would be a cube about 300 meters on each side: taller than most skyscrapers. And it would still have flat, square faces.',
   ui:[{type:'range',key:'mm',min:.1,max:1,step:.05,val:.3,label:'Grain edge',fmt:v=>v.toFixed(2)+' mm',stops:[{v:.3,l:'table salt'},{v:1,l:'coarse salt'}]}],
   todo:[{t:'Try another grain size',ok:S=>Math.abs(S.v.mm-.3)>.04}],
   enter(S){S.v.mm=.3;},
   draw(ctx,S){bg(ctx);const e=S.v.mm,n=e*1e-3/(A*1e-9);grain(ctx,220,170,180+e*200,1);txt(ctx,e.toFixed(2)+' mm',330+e*100,560,{s:20,w:700,c:C.ink,a:'center'});
     K.panel(ctx,'Counting ions',[],(x,y)=>{txt(ctx,'Ions along an edge',x+18,y,{s:15,c:C.soft});txt(ctx,fmtBig(n),x+18,y+34,{s:26,w:700,c:C.rj});txt(ctx,'Ions in the grain',x+18,y+76,{s:15,c:C.soft});txt(ctx,fmtBig(n*n*n),x+18,y+110,{s:26,w:700,c:C.ink});y+=60;txt(ctx,'Each ion step: 0.282 nm',x+18,y+96,{s:13.5,c:C.soft});txt(ctx,'1 mm = 1,000,000 nm',x+18,y+116,{s:13.5,c:C.soft});});}},

  {rail:'Tell it',title:'Now you tell the story',tell:true}
  ]});
function fmtBig(n){if(n<1e6)return Math.round(n).toLocaleString('en-US');const e=Math.floor(Math.log10(n)),m=n/Math.pow(10,e);
  const words={6:'million',9:'billion',12:'trillion',15:'quadrillion',18:'quintillion'};const e3=Math.floor(e/3)*3;if(words[e3])return (n/Math.pow(10,e3)).toFixed(n/Math.pow(10,e3)<10?1:0)+' '+words[e3];return m.toFixed(1)+' × 10^'+e;}
})();
