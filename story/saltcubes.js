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

/* ---------- "Who is doing this" (Nov 24, 2026; rebuilt Nov 23 for cause and effect): Dr. David Cowie and iodized salt ----------
   Sources: Markel, "When it rains it pours" (Am J Public Health, 1987); University of Michigan Medicine history; UNICEF (about 89% of
   the world's households use iodized salt); NIH Office of Dietary Supplements (iodine and the thyroid). Cowie pushed iodized salt for the
   Great Lakes "goiter belt"; Dow chemist William Hale helped show a tiny amount of iodide could be added safely; Michigan stores sold it
   from 1924. Iodide is mixed onto the grains as KI or NaI; it does not replace chloride inside the crystal.
   What the student does and sees, with no numbers on screen: switch the family's salt (cause) → with iodized salt, purple I⁻ rides from
   the plate down to the neck → in the thyroid close-up, iodide snaps onto rings and the rings become hormone (transformation) → the
   hormone flows out, the brain's "make more" signals quiet down, the gland stops growing, and over months the swelling goes down on the
   child and across a classroom (effect). Plain salt reverses it. The real hormone (thyroxine) has two rings and four iodines; one ring
   with four is drawn. Drawings, not to scale; no real children are shown. */
const IO='#6b3fa0';
const IO_PICK=[{v:'k',x:600,y:30,draw(ctx,cx,cy){ion2(ctx,cx,cy+6,14,'#e08a2b','K⁺');}},{v:'i',x:740,y:30,draw(ctx,cx,cy){ion2(ctx,cx,cy+6,26,IO,'I⁻');}}];
function ion2(ctx,x,y,r,c,l){ctx.save();const g=ctx.createRadialGradient(x-r*.35,y-r*.35,r*.1,x,y,r);g.addColorStop(0,'#fff');g.addColorStop(.25,c);g.addColorStop(1,c);ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.fill();
  if(l)txt(ctx,l,x,y+r+20,{s:15,w:700,c:C.ink,a:'center'});ctx.restore();}
function kid(ctx,x,y,g){ctx.save();ctx.fillStyle='#4a7fc1';rr(ctx,x-18,y+22,36,40,10);ctx.fill();ctx.fillStyle='#e9c39b';ctx.fillRect(x-6,y+10,12,14);
  if(g>.02){ctx.fillStyle='#d9a77c';ctx.beginPath();ctx.ellipse(x,y+21,8+16*g,5+10*g,0,0,7);ctx.fill();ctx.fillStyle='#e9c39b';}ctx.beginPath();ctx.arc(x,y-4,16,0,7);ctx.fill();
  ctx.fillStyle=C.ink;ctx.beginPath();ctx.arc(x-5,y-6,1.8,0,7);ctx.arc(x+5,y-6,1.8,0,7);ctx.fill();ctx.restore();}
const IO_HEX=[0,1,2,3,4,5].map(i=>[Math.cos(i*Math.PI/3),Math.sin(i*Math.PI/3)]);
function newIo(){return {pick:null,k:0,salt:'plain',g:1,hor:.05,meal:1,bites:[],rings:[0,1,2].map(i=>({i,n:0,out:0})),ions:[],sig:[],hout:[],cells:14,healed:false,rev:false,page:0};}
function ioTick(S,dt){const M=S.io;if(!M||!M.pick)return;M.k=Math.min(1,M.k+dt*.5);if(M.pick!=='i')return;
  M.page+=dt;
  // a meal every few seconds: a bite goes plate → mouth → down to the neck; iodized salt carries I⁻
  M.meal-=dt;if(M.meal<=0){M.meal=1.2;for(let j=0;j<(M.salt==='iodized'?5:1);j++)M.bites.push({u:-j*.08,io:M.salt==='iodized'});}
  M.bites.forEach(b=>{b.u+=dt*.55;if(b.u>=1&&!b.done){b.done=true;if(b.io)M.ions.push({x:612,y:150+(Math.random()-.5)*60,r:null});}});M.bites=M.bites.filter(b=>!b.done);
  // in the thyroid: each I⁻ snaps onto a ring; a ring with four becomes hormone and leaves
  M.ions.forEach(o=>{if(o.r==null){const r=M.rings.find(r=>r.out===0&&r.n+M.ions.filter(q=>q.r===r).length<4);if(r)o.r=r;}
    if(o.r){const r=o.r,k=r.n+M.ions.filter(q=>q.r===r&&q.done).length,v=IO_HEX[[0,1,3,4][Math.min(3,k)]],cx=664+r.i*80,cy=140,tx=cx+v[0]*30,ty=cy+v[1]*30;o.x=lerp(o.x,tx,dt*7);o.y=lerp(o.y,ty,dt*7);if(Math.hypot(o.x-tx,o.y-ty)<3&&!o.done){o.done=true;r.n++;}}});
  M.ions=M.ions.filter(o=>!o.done);
  M.rings.forEach(r=>{if(r.n>=4&&r.out===0)r.out=.001;if(r.out>0){r.out+=dt*1.2;if(r.out>=1){r.out=0;r.n=0;M.lastH=0;M.hout.push({u:0});}}});
  M.hout.forEach(h=>h.u+=dt*.6);M.hout=M.hout.filter(h=>h.u<1);
  M.lastH=(M.lastH==null?99:M.lastH)+dt;M.hor+=((M.lastH<2.5?1:0)-M.hor)*dt*.5;
  // the brain's signal: louder when hormone is low; the gland grows while it is loud
  const sig=clamp(1-M.hor*1.6,0,1);if(Math.random()<dt*(.4+5*sig))M.sig.push({u:0});M.sig.forEach(q=>q.u+=dt*.9);M.sig=M.sig.filter(q=>q.u<1);
  M.g=clamp(M.g+(sig-.35)*dt*.5,0,1);if(M.salt==='iodized')M.ever=true;M.cells=lerp(M.cells,8+10*M.g,dt*2);
  if(M.ever&&M.g<.15)M.healed=true;if(M.healed&&M.salt==='plain'&&M.g>.55)M.rev=true;}
function ioNeck(ctx,S){const M=S.io,t=S.t,on=M.pick==='i',g=on?M.g:1;
  ctx.fillStyle='#fbf8f2';ctx.fillRect(0,0,590,430);
  // the table: plate and shaker
  ctx.fillStyle='#c8a77a';ctx.fillRect(20,318,210,14);ctx.fillStyle='#fff';ctx.beginPath();ctx.ellipse(110,312,60,13,0,0,7);ctx.fill();ctx.strokeStyle='#cfd5dc';ctx.stroke();
  ctx.fillStyle='#e0b560';ctx.beginPath();ctx.ellipse(110,306,34,9,0,0,7);ctx.fill();
  const iod=on&&M.salt==='iodized';ctx.save();ctx.translate(176,262);ctx.rotate(on?-2.3+Math.sin(t*6)*.15:-.2);ctx.fillStyle='#e9eef3';rr(ctx,-20,-36,40,62,9);ctx.fill();ctx.strokeStyle='#8a8f98';ctx.lineWidth=2;ctx.stroke();
  ctx.fillStyle='#b9c0c8';rr(ctx,-20,-46,40,14,6);ctx.fill();if(iod)txt(ctx,'I⁻',0,4,{s:17,w:800,c:IO,a:'center'});ctx.restore();
  if(on)for(let j=0;j<6;j++){const u=((t*1.1+j/6)%1);ctx.fillStyle=iod&&j%2?IO:'#fff';ctx.strokeStyle='#aaa';ctx.lineWidth=.5;ctx.beginPath();ctx.arc(150+((j*7)%14),282+u*24,2.6,0,7);ctx.fill();ctx.stroke();}
  // the child: the neck's outline bulges as the gland inside it grows
  const hx=360,hy=92,ny=214;ctx.fillStyle='#4a7fc1';rr(ctx,hx-92,272,184,170,40);ctx.fill();
  const bw=30+38*g;ctx.fillStyle='#e9c39b';ctx.beginPath();ctx.moveTo(hx-28,140);ctx.lineTo(hx-28,ny-30);ctx.bezierCurveTo(hx-bw-6,ny-26,hx-bw-6,ny+30,hx-30,ny+46);ctx.lineTo(hx-34,280);ctx.lineTo(hx+34,280);ctx.lineTo(hx+30,ny+46);ctx.bezierCurveTo(hx+bw+6,ny+30,hx+bw+6,ny-26,hx+28,ny-30);ctx.lineTo(hx+28,140);ctx.closePath();ctx.fill();
  ctx.strokeStyle='#c99a72';ctx.lineWidth=2;ctx.stroke();
  const s=.8+1.4*g;ctx.save();ctx.globalAlpha=.8;ctx.fillStyle='#cc4862';[-1,1].forEach(d=>{ctx.beginPath();ctx.ellipse(hx+d*12*s,ny,11*s,16*s,d*.25,0,7);ctx.fill();});ctx.fillRect(hx-8,ny-4,16,9);ctx.restore();
  ctx.fillStyle='#e9c39b';ctx.beginPath();ctx.arc(hx,hy,58,0,7);ctx.fill();ctx.fillStyle='#5a3a22';ctx.beginPath();ctx.arc(hx,hy-10,58,Math.PI*1.08,Math.PI*1.92);ctx.fill();
  ctx.fillStyle=C.ink;[[-20,-2],[20,-2]].forEach(([dx,dy])=>{ctx.beginPath();ctx.arc(hx+dx,hy+dy,4.5,0,7);ctx.fill();});ctx.strokeStyle='#a0584a';ctx.lineWidth=3;ctx.beginPath();ctx.arc(hx,hy+22,12,.3,Math.PI-.3);ctx.stroke();
  // the brain's signal: "!" pulses running down to the gland
  const pit=[hx+70,hy-40];txt(ctx,'🧠',pit[0],pit[1]+10,{s:30,a:'center'});
  if(on)M.sig.forEach(q=>{const x=lerp(pit[0],hx+bw*.6,q.u),y=lerp(pit[1]+16,ny-10,q.u);ctx.save();ctx.globalAlpha=1-q.u*.4;txt(ctx,'!',x,y,{s:20,w:900,c:'#e07a00',a:'center'});ctx.restore();});
  // bites from the plate to the mouth, down to the neck
  if(on)M.bites.forEach(b=>{if(b.u<0)return;const u=b.u,x=u<.5?lerp(110,hx,u*2):hx,y=u<.5?lerp(300,hy+30,u*2)-Math.sin(u*2*Math.PI)*40:lerp(hy+30,ny,(u-.5)*2);
    ctx.fillStyle='#d9a54a';ctx.beginPath();ctx.arc(x,y,6,0,7);ctx.fill();if(b.io){ctx.fillStyle=IO;ctx.beginPath();ctx.arc(x+4,y-3,4,0,7);ctx.fill();}});
  // hormone leaving the gland into the body
  if(on)M.hout.forEach(h=>{ctx.save();ctx.globalAlpha=1-h.u;ioRing(ctx,hx+30+h.u*50,ny+20+h.u*140,10,4,true);ctx.restore();});
  if(on){ctx.save();ctx.translate(46,46);const f=Math.floor(M.page*1.5)%3;txt(ctx,'📅',0,10,{s:30,a:'center'});ctx.globalAlpha=.6;txt(ctx,['·','··','···'][f],0,34,{s:18,w:900,c:C.soft,a:'center'});ctx.restore();}
  if(M.pick==='k'&&M.k<1){ctx.save();ctx.globalAlpha=1-M.k;ion2(ctx,470,60,18,'#e08a2b','K⁺');ion2(ctx,520,60,18,'#8e5ad6','Na⁺');ctx.restore();}}
function ioRing(ctx,x,y,r,n,filled){ctx.save();ctx.beginPath();IO_HEX.forEach((v,i)=>ctx[i?'lineTo':'moveTo'](x+v[0]*r,y+v[1]*r));ctx.closePath();ctx.fillStyle=filled?'#f2b45a':'rgba(255,255,255,.9)';ctx.fill();ctx.strokeStyle='#8a6a2e';ctx.lineWidth=2;ctx.stroke();
  [0,1,3,4].slice(0,n).forEach(i=>{ctx.beginPath();ctx.arc(x+IO_HEX[i][0]*r,y+IO_HEX[i][1]*r,r*.32,0,7);ctx.fillStyle=IO;ctx.fill();});ctx.restore();}
function ioInside(ctx,S){const M=S.io;
  ctx.save();ctx.strokeStyle='rgba(98,98,106,.7)';ctx.lineWidth=2;ctx.setLineDash([6,4]);ctx.beginPath();ctx.moveTo(400,214);ctx.lineTo(600,150);ctx.stroke();ctx.restore();
  ctx.fillStyle='#fde9ee';rr(ctx,600,24,285,236,12);ctx.fill();ctx.strokeStyle='#cc4862';ctx.lineWidth=2;ctx.stroke();
  // gland cells around the edge: more of them while the signal is loud
  const n=Math.round(M.cells);ctx.fillStyle='rgba(204,72,98,.35)';for(let i=0;i<n;i++){const a=i/n*Math.PI*2,x=742+Math.cos(a)*118,y=142+Math.sin(a)*92;ctx.beginPath();ctx.arc(x,y,12,0,7);ctx.fill();}
  M.rings.forEach(r=>{const x=664+r.i*80+r.out*60,y=140+r.out*90;ctx.save();ctx.globalAlpha=1-r.out;ioRing(ctx,x,y,30,r.n,r.n>=4);ctx.restore();});
  M.ions.forEach(o=>ion2(ctx,o.x,o.y,10,IO));
  if(M.salt==='plain'){ctx.save();ctx.globalAlpha=.5+.5*Math.sin(S.t*6);txt(ctx,'!',742,72,{s:26,w:900,c:'#e07a00',a:'center'});ctx.restore();}
  // a classroom: the same change, child after child
  ctx.fillStyle='#fff';rr(ctx,600,272,285,150,12);ctx.fill();ctx.strokeStyle='#d5d9de';ctx.stroke();
  const base=[1,.3,.85,.15,.6,.95,.4,.75];for(let i=0;i<8;i++){const x=636+(i%4)*68,y=304+Math.floor(i/4)*62;kid(ctx,x,y,clamp(M.g*base[i]*1.1,0,1));}}
function ioRhyme(ctx){Who.rhyme(ctx,20,440,560,140,(c,x,y,w,h)=>{for(let r=0;r<3;r++)for(let q=0;q<5;q++){const cl=(r+q)%2;ion2(c,x+26+q*44,y+30+r*40,cl?16:10,cl?CL:NA);}},
  (c,x,y,w,h)=>{ion2(c,x+60,y+h/2,18,CL,'Cl⁻');txt(c,'≈',x+112,y+h/2+10,{s:28,w:700,c:C.ink,a:'center'});ion2(c,x+170,y+h/2,24,IO,'I⁻');});}
function ioPick(S,v){const M=S.io;if(!M||M.pick==='i')return;M.pick=v;M.k=0;}
Story.start({
  id:'saltcubes',title:'Why are salt grains little cubes?',W,H,labHref:'../index.html#ionic',
  about:'<p><b>What is real.</b> Table salt is sodium chloride. Sodium ions (Na⁺, radius 0.102 nm) and chloride ions (Cl⁻, radius 0.181 nm) alternate on a cubic grid, 0.282 nm apart center to center; every ion touches six of the other kind. A grain of table salt is about 0.3 mm on an edge: about a million ions along each edge.</p><p><b>What is simplified.</b> Crystals 2 to 6 ions on an edge stand in for real grains. The new ions in step 4 fly straight in; in real salt water they arrive one by one from all directions, wrapped in water molecules, and many land and leave before one sticks. Ions have no color; purple and green are labels.</p><p><b>Iodized salt (step 6).</b> Dr. David Cowie of the University of Michigan pushed to add iodine to salt for the Great Lakes "goiter belt," where many children had goiters from too little iodine. Dow chemist William Hale helped show a tiny amount could be added safely; Michigan stores sold iodized salt from 1924. Iodide (as potassium or sodium iodide, about 20 to 40 mg of iodine per kg) is mixed onto the grains; it does not replace the chloride inside the crystal. The thyroid gland in the neck uses iodine to build its hormone (thyroxine: two rings and four iodines; the picture draws one ring). With too little iodine, the brain keeps signaling for more hormone and the gland grows: that swelling is a goiter. Glaciers and rain left the soils around the Great Lakes low in iodine, so food grown there carried little. Today about 89% of the world’s households use iodized salt. Sources: H. Markel, American Journal of Public Health (1987); University of Michigan Medicine; UNICEF. The children are drawings.</p>',
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

  {rail:'Who did it',title:'Dr. David Cowie, Michigan',live:true,views:false,
   text(S){const M=S.io;if(!M||!M.pick)return 'Michigan, 1920s. Many kids have a swollen neck, a goiter. <b>Tap the ion that can bring iodine.</b>';
     if(M.pick==='k')return 'K⁺ is positive, like Na⁺, and it carries no iodine. Try the other.';
     if(M.rev)return 'No iodine, no hormone: the gland swells again. In 1924, iodized salt reached Michigan stores, and goiters faded.';
     if(M.healed&&M.salt==='iodized')return 'Now <b>switch back to plain salt</b> and watch the neck.';
     if(M.salt==='iodized')return 'Each I⁻ snaps onto a ring and makes hormone. The brain\'s "!" signal quiets, and over months the swelling goes down.';
     if(M.healed)return 'Plain salt again. Watch the signal and the gland.';
     return 'Plain salt: no iodine reaches the neck. The brain keeps signaling "make more!" and the gland grows. <b>Switch to iodized salt.</b>';},
   alt:'Look at the two pictures at the bottom. Salt is Na⁺ and Cl⁻. Iodide, I⁻, has the same −1 charge as chloride, so a tiny bit can be mixed onto salt grains. The thyroid needs iodine to make its hormone; without it, the brain keeps asking for more and the gland grows.',
   ui:[{type:'seg',key:'ip',val:'',label:'Which ion can bring iodine?',opts:[{v:'k',l:'K⁺'},{v:'i',l:'I⁻'}],on(S,v){ioPick(S,v);},show:S=>S.io&&S.io.pick!=='i'},
     {type:'seg',key:'salt',val:'plain',label:'The family\'s salt',opts:[{v:'plain',l:'🧂 Plain salt'},{v:'iodized',l:'🧂 Iodized salt'}],on(S,v){S.io.salt=v;},show:S=>S.io&&S.io.pick==='i'}],
   todo:[{t:'Tap the ion that can bring iodine',ok:S=>S.io&&S.io.pick==='i'},{t:'Switch to iodized salt and watch the neck',ok:S=>S.io&&S.io.healed},{t:'Switch back to plain salt',ok:S=>S.io&&S.io.rev}],
   enter(S){S.io=newIo();S.v.ip='';S.v.salt='plain';},tick(S,dt){ioTick(S,dt);},
   click(S,x,y){const v=Who.hit(IO_PICK,x,y);if(v&&S.io.pick!=='i'){ioPick(S,v);S.v.ip=v;}},
   draw(ctx,S){const M=S.io||(S.io=newIo());ctx.fillStyle='#f4f6f8';ctx.fillRect(0,0,W,H);ioNeck(ctx,S);
     if(M.pick!=='i')Who.cards(ctx,S,IO_PICK,M.pick);else ioInside(ctx,S);ioRhyme(ctx);
     Who.panel(ctx,'Dr. David Cowie',[['🗺️','Great Lakes "goiter belt"'],['🩺','children\'s doctor, U of Michigan'],['🧪','Dow chemist William Hale'],['🧂','1924: iodized salt in stores'],['✋','hard part: doctors doubted'],['🌍','today: ~89% of homes']],['Sources: Markel, Am J Public','Health 1987; U-M Medicine; UNICEF.']);}},

  {rail:'Tell it',title:'Now you tell the story',tell:true}
  ]});
function fmtBig(n){if(n<1e6)return Math.round(n).toLocaleString('en-US');const e=Math.floor(Math.log10(n)),m=n/Math.pow(10,e);
  const words={6:'million',9:'billion',12:'trillion',15:'quadrillion',18:'quintillion'};const e3=Math.floor(e/3)*3;if(words[e3])return (n/Math.pow(10,e3)).toFixed(n/Math.pow(10,e3)<10?1:0)+' '+words[e3];return m.toFixed(1)+' × 10^'+e;}
})();
