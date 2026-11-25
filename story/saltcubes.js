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

/* ---------- "Who is doing this" (Nov 24, 2026; rebuilt Nov 23 for cause and effect; redrawn Nov 25 as a textbook illustration): Dr. David Cowie and iodized salt ----------
   Sources: Markel, "When it rains it pours" (Am J Public Health, 1987); University of Michigan Medicine history; UNICEF (about 89% of
   the world's households use iodized salt); NIH Office of Dietary Supplements (iodine and the thyroid). Cowie pushed iodized salt for the
   Great Lakes "goiter belt"; Dow chemist William Hale helped show a tiny amount of iodide could be added safely; Michigan stores sold it
   from 1924. Iodide is mixed onto the grains as KI or NaI; it does not replace chloride inside the crystal.
   Biology drawn: iodide is absorbed in the gut and carried by the blood to the thyroid, which sits in front of the windpipe below the
   larynx. In each thyroid follicle, a ring of cells surrounds stored protein (colloid); iodine is attached two at a time to tyrosine rings,
   and two iodinated rings join through an oxygen bridge to make thyroxine (T4: two rings, four iodines), which leaves into the blood. With
   too little iodine, the pituitary keeps releasing TSH, the follicles enlarge, and the gland swells forward: a goiter.
   What the student does and sees: switch the family's salt (cause) → iodide travels gut → blood → thyroid → rings → T4 (transformation)
   → TSH quiets and the swelling at the front of the neck goes down, on one student and across a classroom (effect). Plain salt reverses
   it. Side-profile drawings, not to scale; no real people are shown. */
const IO='#7b3fb0',IO_SKIN=['#efcfb3','#d9a77f','#b47a52','#8a5a3c','#f3d7c2','#c58e65','#6e4630','#e2b896'],IO_HAIR=['#3b2a1e','#1f1a17','#5a3a22','#141210','#8a5a2e','#2a1d14','#141210','#4a321f'];
const IO_PICK=[{v:'k',x:600,y:30,draw(ctx,cx,cy){ion2(ctx,cx,cy+6,14,'#e08a2b','K⁺');}},{v:'i',x:740,y:30,draw(ctx,cx,cy){ion2(ctx,cx,cy+6,26,IO,'I⁻');}}];
function ion2(ctx,x,y,r,c,l){ctx.save();const g=ctx.createRadialGradient(x-r*.35,y-r*.35,r*.1,x,y,r);g.addColorStop(0,'#fff');g.addColorStop(.25,c);g.addColorStop(1,c);ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.fill();
  if(l)txt(ctx,l,x,y+r+20,{s:15,w:700,c:C.ink,a:'center'});ctx.restore();}
const IO_TH=[388,266],IO_PIT=[404,128];
const IO_RP=[[700,108],[784,108],[700,178],[784,178]];
/* a teenager in side profile, facing left; g = how swollen the front of the neck is */
function ioBody(ctx,g){ctx.beginPath();ctx.moveTo(402,38);ctx.bezierCurveTo(370,38,345,52,338,80);ctx.bezierCurveTo(334,95,334,104,336,108);
  ctx.bezierCurveTo(332,118,318,134,313,142);ctx.bezierCurveTo(311,147,320,150,329,150);ctx.bezierCurveTo(331,154,330,158,327,161);ctx.bezierCurveTo(323,165,326,168,329,169);
  ctx.bezierCurveTo(325,172,326,177,331,180);ctx.bezierCurveTo(329,186,330,194,336,200);ctx.bezierCurveTo(343,207,352,210,362,212);ctx.bezierCurveTo(366,220,364,228,368,234);
  ctx.bezierCurveTo(368-34*g,248,372-30*g,278,380,288);ctx.bezierCurveTo(365,300,350,330,345,430);ctx.lineTo(565,430);
  ctx.bezierCurveTo(560,360,548,312,520,292);ctx.bezierCurveTo(495,280,470,268,458,240);ctx.bezierCurveTo(452,220,452,205,458,190);
  ctx.bezierCurveTo(472,170,480,140,476,110);ctx.bezierCurveTo(470,60,440,38,402,38);ctx.closePath();}
function ioProfile(ctx,g,o){o=o||{};const skin=o.skin||'#e3b896',hair=o.hair||'#3b2a1e';ctx.save();
  // skin, lit from the front
  const sg=ctx.createLinearGradient(310,0,480,0);sg.addColorStop(0,shadeC(skin,.12));sg.addColorStop(1,shadeC(skin,-.18));ioBody(ctx,g);ctx.fillStyle=sg;ctx.fill();
  if(!o.small){ctx.save();ioBody(ctx,g);ctx.clip();const jg=ctx.createRadialGradient(360,214,4,360,214,40);jg.addColorStop(0,'rgba(90,50,30,.22)');jg.addColorStop(1,'rgba(90,50,30,0)');ctx.fillStyle=jg;ctx.fillRect(310,180,90,80);
    if(g>.05){const bg=ctx.createRadialGradient(370-24*g,262,2,370-24*g,262,30);bg.addColorStop(0,'rgba(255,255,255,'+.18*g+')');bg.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=bg;ctx.fillRect(320,230,90,70);}ctx.restore();}
  // hair
  ctx.beginPath();ctx.moveTo(340,74);ctx.bezierCurveTo(352,44,384,32,408,33);ctx.bezierCurveTo(452,35,482,62,482,112);ctx.bezierCurveTo(483,150,474,178,458,196);
  ctx.bezierCurveTo(452,175,448,160,445,150);ctx.bezierCurveTo(440,128,430,104,418,96);ctx.bezierCurveTo(400,86,372,80,352,82);ctx.bezierCurveTo(346,80,342,78,340,74);ctx.closePath();
  const hg=ctx.createLinearGradient(340,30,480,190);hg.addColorStop(0,shadeC(hair,.18));hg.addColorStop(1,shadeC(hair,-.2));ctx.fillStyle=hg;ctx.fill();
  // ear, eye, brow, mouth line
  const eg=ctx.createRadialGradient(428,126,2,432,132,18);eg.addColorStop(0,shadeC(skin,.05));eg.addColorStop(1,shadeC(skin,-.2));ctx.fillStyle=eg;ctx.beginPath();ctx.ellipse(434,132,11,19,.15,0,7);ctx.fill();ctx.strokeStyle=shadeC(skin,-.35);ctx.lineWidth=o.small?3:1.6;ctx.beginPath();ctx.arc(436,131,7,-1.3,1.7);ctx.stroke();
  ctx.strokeStyle=shadeC(hair,-.1);ctx.lineWidth=o.small?3:2.5;ctx.beginPath();ctx.moveTo(337,99);ctx.quadraticCurveTo(346,95,356,98);ctx.stroke();
  ctx.fillStyle='#2b2320';ctx.beginPath();ctx.moveTo(339,111);ctx.quadraticCurveTo(346,106,352,110);ctx.quadraticCurveTo(346,113,339,111);ctx.fill();
  if(!o.small){ctx.strokeStyle=shadeC(skin,-.32);ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(327,169);ctx.lineTo(336,170);ctx.stroke();}
  // shirt
  ctx.beginPath();ctx.moveTo(374,292);ctx.bezierCurveTo(400,298,440,290,466,268);ctx.bezierCurveTo(490,282,530,296,548,330);ctx.lineTo(568,430);ctx.lineTo(343,430);ctx.bezierCurveTo(348,360,356,320,374,292);ctx.closePath();
  const tg=ctx.createLinearGradient(340,280,560,430);tg.addColorStop(0,o.shirt||'#3c5a80');tg.addColorStop(1,shadeC(o.shirt||'#3c5a80',-.35));ctx.fillStyle=tg;ctx.fill();
  ctx.restore();}
function shadeC(hex,k){const n=parseInt(hex.slice(1),16),f=v=>Math.round(k>0?v+(255-v)*k:v*(1+k));return 'rgb('+f(n>>16)+','+f(n>>8&255)+','+f(n&255)+')';}
/* the see-through view: windpipe, thyroid in front of it, pituitary, and the blood paths */
function ioInner(ctx,M,g){ctx.save();ioBody(ctx,g);ctx.clip();ctx.beginPath();ctx.moveTo(300,0);ctx.lineTo(600,0);ctx.lineTo(600,262);ctx.bezierCurveTo(500,270,440,292,374,296);ctx.lineTo(300,296);ctx.closePath();ctx.clip();
  ctx.globalAlpha=.32;ctx.fillStyle='#dfe7ee';rr(ctx,390,218,20,212,8);ctx.fill();ctx.strokeStyle='#9fb1c2';ctx.lineWidth=1.5;for(let y=226;y<430;y+=9){ctx.beginPath();ctx.moveTo(390,y);ctx.lineTo(410,y);ctx.stroke();}
  ctx.globalAlpha=.42;ctx.strokeStyle='#b0303d';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(426,430);ctx.bezierCurveTo(420,350,414,300,398,272);ctx.stroke();
  ctx.globalAlpha=.75;const s=1+.9*g,tx=IO_TH[0]-6*g;const tgr=ctx.createRadialGradient(tx-4,IO_TH[1]-6,2,tx,IO_TH[1],22*s);tgr.addColorStop(0,'#d6707f');tgr.addColorStop(1,'#a3374a');ctx.fillStyle=tgr;
  ctx.beginPath();ctx.ellipse(tx,IO_TH[1],11*s,19*s,-.15,0,7);ctx.fill();
  ctx.globalAlpha=.85;ctx.fillStyle='#d99a45';ctx.beginPath();ctx.arc(IO_PIT[0],IO_PIT[1],5,0,7);ctx.fill();ctx.globalAlpha=.25;ctx.strokeStyle='#d99a45';ctx.lineWidth=2;ctx.setLineDash([3,4]);ctx.beginPath();ctx.moveTo(IO_PIT[0],IO_PIT[1]);ctx.bezierCurveTo(416,190,414,236,IO_TH[0]+4,IO_TH[1]-8);ctx.stroke();ctx.setLineDash([]);
  ctx.restore();
  // labels, small and plain, like a textbook figure
  ctx.save();ctx.strokeStyle='rgba(60,60,70,.55)';ctx.lineWidth=1;[[IO_TH[0]-14,IO_TH[1]+4,300,290,'thyroid'],[IO_PIT[0]+4,IO_PIT[1]-2,500,52,'pituitary'],[398,236,300,236,'windpipe']].forEach(([x1,y1,x2,y2,l])=>{ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();txt(ctx,l,x2+(x2<x1?-4:4),y2+5,{s:13,w:600,c:'#4a4a55',a:x2<x1?'right':'left'});});ctx.restore();}
function ioShaker(ctx,x,y,tilt,iod){ctx.save();ctx.translate(x,y);ctx.rotate(tilt);
  const gg=ctx.createLinearGradient(-20,0,20,0);gg.addColorStop(0,'rgba(220,230,238,.95)');gg.addColorStop(.35,'rgba(255,255,255,.98)');gg.addColorStop(1,'rgba(190,202,212,.95)');ctx.fillStyle=gg;rr(ctx,-19,-34,38,62,7);ctx.fill();ctx.strokeStyle='rgba(120,135,150,.8)';ctx.lineWidth=1.2;ctx.stroke();
  ctx.fillStyle='#f6f6f4';ctx.fillRect(-16,-6,32,32);if(iod){ctx.fillStyle='rgba(123,63,176,.35)';for(let i=0;i<14;i++)ctx.fillRect(-14+(i*7)%28,-2+(i*5)%26,2,2);}
  const cg=ctx.createLinearGradient(-20,0,20,0);cg.addColorStop(0,'#8c949c');cg.addColorStop(.4,'#e6eaee');cg.addColorStop(1,'#7a828a');ctx.fillStyle=cg;rr(ctx,-20,-48,40,15,5);ctx.fill();
  ctx.fillStyle='#4b5259';[-8,0,8].forEach(d=>{ctx.beginPath();ctx.arc(d,-43,1.6,0,7);ctx.fill();});ctx.restore();}
function ioPlate(ctx){const pg=ctx.createRadialGradient(118,306,10,118,310,70);pg.addColorStop(0,'#ffffff');pg.addColorStop(1,'#d9dde2');ctx.fillStyle=pg;ctx.beginPath();ctx.ellipse(118,312,66,15,0,0,7);ctx.fill();
  ctx.strokeStyle='#b9c0c8';ctx.lineWidth=1;ctx.stroke();[[96,304],[118,300],[140,305],[108,309],[130,309]].forEach(([x,y],i)=>{const fg=ctx.createRadialGradient(x-3,y-4,1,x,y,11);fg.addColorStop(0,'#f2cf8a');fg.addColorStop(1,'#b97d34');ctx.fillStyle=fg;ctx.beginPath();ctx.ellipse(x,y,12,7,i*.4,0,7);ctx.fill();});}
function ioNeck(ctx,S){const M=S.io,t=S.t,on=M.pick==='i',g=on?M.g:1;
  const bg=ctx.createLinearGradient(0,0,0,430);bg.addColorStop(0,'#f7f4ef');bg.addColorStop(1,'#e9e3da');ctx.fillStyle=bg;ctx.fillRect(0,0,590,430);
  const tb=ctx.createLinearGradient(0,320,0,340);tb.addColorStop(0,'#b88c5c');tb.addColorStop(1,'#8f6740');ctx.fillStyle=tb;ctx.fillRect(10,322,250,12);ctx.fillStyle='rgba(0,0,0,.08)';ctx.fillRect(10,334,250,6);
  ioPlate(ctx);const iod=on&&M.salt==='iodized';ioShaker(ctx,186,262,on?-2.25+Math.sin(t*6)*.12:-.15,iod);
  if(on)for(let j=0;j<7;j++){const u=((t*1.1+j/7)%1);ctx.fillStyle=iod&&j%2?IO:'#fbfbfb';ctx.strokeStyle='rgba(0,0,0,.25)';ctx.lineWidth=.6;const x=158+((j*5)%12),y=284+u*22;ctx.fillRect(x,y,3,3);ctx.strokeRect(x,y,3,3);}
  ioProfile(ctx,g,{});ioInner(ctx,M,g);
  if(!on)return;
  // food: plate → mouth → down; iodide: absorbed, then up the artery in the blood to the thyroid (inside the body: shown only above the shirt)
  const vis=(x,y)=>y<290||x<340;
  M.bites.forEach(b=>{if(b.u<0)return;const u=b.u;let x,y;if(u<.45){const k=u/.45;x=lerp(118,328,k);y=lerp(304,168,k)-Math.sin(k*Math.PI)*46;}else{const k=(u-.45)/.55;x=lerp(372,416,k);y=lerp(200,430,k);if(k<.15){x=lerp(328,372,k/.15);y=lerp(168,200,k/.15);}}
    if(!vis(x,y))return;const fg=ctx.createRadialGradient(x-1,y-1,1,x,y,5);fg.addColorStop(0,'#f2cf8a');fg.addColorStop(1,'#b97d34');ctx.fillStyle=fg;ctx.beginPath();ctx.arc(x,y,4.5,0,7);ctx.fill();if(b.io){ctx.fillStyle=IO;ctx.beginPath();ctx.arc(x+3,y-2,2.4,0,7);ctx.fill();}});
  M.blood.forEach(q=>{const u=q.u,x=Math.pow(1-u,3)*426+3*Math.pow(1-u,2)*u*420+3*(1-u)*u*u*414+u*u*u*398,y=Math.pow(1-u,3)*430+3*Math.pow(1-u,2)*u*350+3*(1-u)*u*u*300+u*u*u*272;if(vis(x,y))ion2(ctx,x,y,5,IO);});
  M.sig.forEach(q=>{const u=q.u,x=Math.pow(1-u,3)*IO_PIT[0]+3*Math.pow(1-u,2)*u*416+3*(1-u)*u*u*414+u*u*u*(IO_TH[0]+4),y=Math.pow(1-u,3)*IO_PIT[1]+3*Math.pow(1-u,2)*u*190+3*(1-u)*u*u*236+u*u*u*(IO_TH[1]-8);ctx.fillStyle='#e08a1e';ctx.globalAlpha=.9;ctx.beginPath();ctx.arc(x,y,3.2,0,7);ctx.fill();ctx.globalAlpha=1;});
  M.hout.forEach(h=>{const x=lerp(IO_TH[0]+10,440,h.u),y=lerp(IO_TH[1]+6,300,h.u);ctx.save();ctx.globalAlpha=Math.max(0,1-h.u*1.2);ioT4(ctx,x,y,.32);ctx.restore();});
  if(M.pick==='k'&&M.k<1){ctx.save();ctx.globalAlpha=1-M.k;ion2(ctx,470,60,18,'#e08a2b','K⁺');ion2(ctx,520,60,18,'#8e5ad6','Na⁺');ctx.restore();}}
/* a tyrosine ring drawn as a chemist would: a benzene ring with alternating double bonds; iodines attach at the two top positions */
function ioRing6(ctx,x,y,r,n){ctx.save();ctx.strokeStyle='#33363b';ctx.lineWidth=2;const P=[0,1,2,3,4,5].map(i=>[x+r*Math.cos(Math.PI/6+i*Math.PI/3),y+r*Math.sin(Math.PI/6+i*Math.PI/3)]);
  ctx.beginPath();P.forEach((p,i)=>ctx[i?'lineTo':'moveTo'](p[0],p[1]));ctx.closePath();ctx.stroke();
  [[0,1],[2,3],[4,5]].forEach(([a,b])=>{const m=[(P[a][0]+P[b][0])/2,(P[a][1]+P[b][1])/2],k=.78;ctx.beginPath();ctx.moveTo(x+(P[a][0]-x)*k+(m[0]-x)*0,y+(P[a][1]-y)*k);ctx.lineTo(x+(P[b][0]-x)*k,y+(P[b][1]-y)*k);ctx.stroke();});
  [4,5].slice(0,n).forEach(i=>{const d=[P[i][0]-x,P[i][1]-y],L=Math.hypot(...d),e=[P[i][0]+d[0]/L*12,P[i][1]+d[1]/L*12];ctx.beginPath();ctx.moveTo(P[i][0],P[i][1]);ctx.lineTo(e[0],e[1]);ctx.stroke();ion2(ctx,e[0]+d[0]/L*3,e[1]+d[1]/L*3,8,IO);});ctx.restore();}
function ioT4(ctx,x,y,s){ctx.save();ctx.translate(x,y);ctx.scale(s,s);ioRing6(ctx,-30,0,20,2);ioRing6(ctx,30,0,20,2);ctx.strokeStyle='#33363b';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-12,8);ctx.lineTo(0,14);ctx.lineTo(12,8);ctx.stroke();ctx.fillStyle='#d9362b';ctx.beginPath();ctx.arc(0,14,4.5,0,7);ctx.fill();ctx.restore();}
function ioInside(ctx,S){const M=S.io,g=M.g;
  ctx.save();ctx.strokeStyle='rgba(60,60,70,.45)';ctx.lineWidth=1.2;ctx.setLineDash([5,4]);ctx.beginPath();ctx.arc(IO_TH[0]-6*g,IO_TH[1],26,0,7);ctx.stroke();ctx.beginPath();ctx.moveTo(IO_TH[0]+18,IO_TH[1]-14);ctx.lineTo(600,120);ctx.stroke();ctx.restore();
  ctx.save();rr(ctx,600,24,285,236,12);ctx.clip();
  // tissue around one follicle; a capillary along the bottom
  ctx.fillStyle='#f1d3d9';ctx.fillRect(600,24,285,236);ctx.fillStyle='rgba(190,110,130,.18)';for(let i=0;i<60;i++){ctx.beginPath();ctx.arc(600+((i*53)%285),24+((i*37)%236),6,0,7);ctx.fill();}
  const cap=ctx.createLinearGradient(0,228,0,262);cap.addColorStop(0,'#c94a4a');cap.addColorStop(1,'#8f2430');ctx.fillStyle=cap;ctx.fillRect(600,232,285,30);
  for(let i=0;i<7;i++){const x=600+((S.t*40+i*44)%300);ctx.fillStyle='#e05a5a';ctx.beginPath();ctx.ellipse(x,247,10,6,0,0,7);ctx.fill();}
  // the follicle: a ring of cells around stored protein; it grows while TSH keeps pushing
  const R=78+14*g,cx=742,cy=142,ch=12+7*g,n=Math.round(2*Math.PI*R/17);
  const cg=ctx.createRadialGradient(cx,cy,10,cx,cy,R);cg.addColorStop(0,'#f8dbe6');cg.addColorStop(1,'#eec0d2');ctx.fillStyle=cg;ctx.beginPath();ctx.ellipse(cx,cy,R,R*.82,0,0,7);ctx.fill();
  for(let i=0;i<n;i++){const a=i/n*Math.PI*2;ctx.save();ctx.translate(cx+Math.cos(a)*(R+ch/2),cy+Math.sin(a)*(R+ch/2)*.82);ctx.rotate(a);ctx.fillStyle='#d27a92';ctx.strokeStyle='#b35c76';ctx.lineWidth=1;ctx.beginPath();ctx.rect(-ch/2,-7.5,ch,15);ctx.fill();ctx.stroke();ctx.fillStyle='#5b2d6e';ctx.beginPath();ctx.arc(ch*.15,0,3.2,0,7);ctx.fill();ctx.restore();}
  // TSH arriving from the blood while hormone is low
  M.sig.forEach(q=>{const x=640+((q.u*400+q.u*97)%200),y=lerp(240,cy+R*.82+ch,q.u);ctx.fillStyle='#e08a1e';ctx.globalAlpha=.8;ctx.beginPath();ctx.arc(x,y,3,0,7);ctx.fill();ctx.globalAlpha=1;});
  // tyrosine rings in the colloid; iodide comes in and attaches; two finished rings join into T4 and leave
  M.pairs.forEach(pr=>{const A=IO_RP[pr.a],B=IO_RP[pr.b],o=pr.out?ease(Math.min(1,pr.out)):0;
    if(o>0){const x=lerp((A[0]+B[0])/2,cx,o),y=lerp(A[1],250,o);ctx.save();ctx.globalAlpha=1-o*.6;ioT4(ctx,x,y,lerp(1,.6,o));ctx.restore();}
    else[pr.a,pr.b].forEach(i=>ioRing6(ctx,IO_RP[i][0],IO_RP[i][1],20,M.rings[i].n));});
  M.ions.forEach(o=>ion2(ctx,o.x,o.y,8,IO));
  ctx.restore();ctx.strokeStyle='#b35c76';ctx.lineWidth=2;rr(ctx,600,24,285,236,12);ctx.stroke();
  // a class: the same change across eight students
  ctx.fillStyle='#fff';rr(ctx,600,272,285,150,12);ctx.fill();ctx.strokeStyle='#d5d9de';ctx.stroke();
  const base=[1,.3,.85,.15,.6,.95,.4,.75];for(let i=0;i<8;i++){const x=604+(i%4)*70,y=276+Math.floor(i/4)*72;ctx.save();rr(ctx,x,y,66,68,6);ctx.clip();ctx.fillStyle='#f4f1ec';ctx.fillRect(x,y,66,68);ctx.translate(x+33,y+2);ctx.scale(.22,.22);ctx.translate(-405,-60);
    ioProfile(ctx,clamp(M.g*base[i]*1.3,0,1.2),{small:true,skin:IO_SKIN[i],hair:IO_HAIR[i],shirt:['#3c5a80','#7a3b3b','#3b6b4f','#5a4a7a','#806a3c','#3c5a80','#6b3b5a','#2f5f6f'][i]});ctx.restore();}}
function ioRhyme(ctx){Who.rhyme(ctx,20,440,560,140,(c,x,y,w,h)=>{for(let r=0;r<3;r++)for(let q=0;q<5;q++){const cl=(r+q)%2;ion2(c,x+26+q*44,y+30+r*40,cl?16:10,cl?CL:NA);}},
  (c,x,y,w,h)=>{ion2(c,x+60,y+h/2,18,CL,'Cl⁻');txt(c,'≈',x+112,y+h/2+10,{s:28,w:700,c:C.ink,a:'center'});ion2(c,x+170,y+h/2,24,IO,'I⁻');});}
function newIo(){return {pick:null,k:0,salt:'plain',g:1,hor:.05,meal:1,bites:[],blood:[],rings:[0,1,2,3].map(i=>({i,n:0})),pairs:[{a:0,b:1,out:0},{a:2,b:3,out:0}],ions:[],sig:[],hout:[],healed:false,rev:false,lastH:99};}
function ioTick(S,dt){const M=S.io;if(!M||!M.pick)return;M.k=Math.min(1,M.k+dt*.5);if(M.pick!=='i')return;
  M.meal-=dt;if(M.meal<=0){M.meal=1.2;for(let j=0;j<(M.salt==='iodized'?4:1);j++)M.bites.push({u:-j*.08,io:M.salt==='iodized'});}
  M.bites.forEach(b=>{b.u+=dt*.55;if(b.u>=1&&!b.done){b.done=true;if(b.io)M.blood.push({u:0});}});M.bites=M.bites.filter(b=>!b.done);
  M.blood.forEach(q=>{q.u+=dt*.8;if(q.u>=1&&!q.done){q.done=true;M.ions.push({x:620+Math.random()*40,y:238,r:null});}});M.blood=M.blood.filter(q=>!q.done);
  const busy=i=>M.pairs.some(p=>p.out&&(p.a===i||p.b===i));
  M.ions.forEach(o=>{if(o.r==null){const r=M.rings.find(r=>!busy(r.i)&&r.n+M.ions.filter(q=>q.r===r&&!q.done).length<2);if(r)o.r=r;}
    if(o.r){const r=o.r,k=r.n,P=IO_RP[r.i],a=Math.PI/6+(4+Math.min(1,k))*Math.PI/3,tx=P[0]+Math.cos(a)*35,ty=P[1]+Math.sin(a)*35;o.x=lerp(o.x,tx,dt*6);o.y=lerp(o.y,ty,dt*6);if(Math.hypot(o.x-tx,o.y-ty)<3&&!o.done){o.done=true;r.n++;}}
    else{o.y=lerp(o.y,200,dt*2);}});
  M.ions=M.ions.filter(o=>!o.done);
  M.pairs.forEach(p=>{if(!p.out&&M.rings[p.a].n>=2&&M.rings[p.b].n>=2)p.out=.001;if(p.out){p.out+=dt*.9;if(p.out>=1){p.out=0;M.rings[p.a].n=0;M.rings[p.b].n=0;M.lastH=0;M.hout.push({u:0});}}});
  M.hout.forEach(h=>h.u+=dt*.5);M.hout=M.hout.filter(h=>h.u<1);
  M.lastH+=dt;M.hor+=((M.lastH<2.5?1:0)-M.hor)*dt*.5;
  const sig=clamp(1-M.hor*1.6,0,1);if(Math.random()<dt*(.3+4*sig))M.sig.push({u:0});M.sig.forEach(q=>q.u+=dt*.7);M.sig=M.sig.filter(q=>q.u<1);
  M.g=clamp(M.g+(sig-.35)*dt*.5,0,1);if(M.salt==='iodized')M.ever=true;
  if(M.ever&&M.g<.15)M.healed=true;if(M.healed&&M.salt==='plain'&&M.g>.55)M.rev=true;}
function ioPick(S,v){const M=S.io;if(!M||M.pick==='i')return;M.pick=v;M.k=0;}
Story.start({
  id:'saltcubes',title:'Why are salt grains little cubes?',W,H,labHref:'../index.html#ionic',
  about:'<p><b>What is real.</b> Table salt is sodium chloride. Sodium ions (Na⁺, radius 0.102 nm) and chloride ions (Cl⁻, radius 0.181 nm) alternate on a cubic grid, 0.282 nm apart center to center; every ion touches six of the other kind. A grain of table salt is about 0.3 mm on an edge: about a million ions along each edge.</p><p><b>What is simplified.</b> Crystals 2 to 6 ions on an edge stand in for real grains. The new ions in step 4 fly straight in; in real salt water they arrive one by one from all directions, wrapped in water molecules, and many land and leave before one sticks. Ions have no color; purple and green are labels.</p><p><b>Iodized salt (step 6).</b> Dr. David Cowie of the University of Michigan pushed to add iodine to salt for the Great Lakes "goiter belt," where many children had goiters from too little iodine. Dow chemist William Hale helped show a tiny amount could be added safely; Michigan stores sold iodized salt from 1924. Iodide (as potassium or sodium iodide, about 20 to 40 mg of iodine per kg) is mixed onto the grains; it does not replace the chloride inside the crystal. The thyroid gland, in front of the windpipe, uses iodine to build its hormone, thyroxine (T4): two iodines attach to each of two rings, and the rings join. With too little iodine, the pituitary keeps sending its signal (TSH), the follicles enlarge, and the gland swells forward: that swelling is a goiter. Glaciers and rain left the soils around the Great Lakes low in iodine, so food grown there carried little. Today about 89% of the world’s households use iodized salt. Sources: H. Markel, American Journal of Public Health (1987); University of Michigan Medicine; UNICEF. The children are drawings.</p>',
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

  {rail:'Who did it',title:'Dr. David Cowie, Michigan',links:[{t:"Iodine: what it does and where to get it",u:"https://ods.od.nih.gov/factsheets/Iodine-Consumer/",d:"National Institutes of Health"},{t:"Iodine in your diet",u:"https://medlineplus.gov/ency/article/002421.htm",d:"MedlinePlus: iodine-poor soil, iodized salt and goiter"},{t:"Iodine Global Network",u:"https://www.ign.org/",d:"the group still working to end iodine deficiency worldwide"}],live:true,views:false,
   text(S){const M=S.io;if(!M||!M.pick)return 'Michigan, 1920s. Many kids have a swollen neck, a goiter. <b>Tap the ion that can bring iodine.</b>';
     if(M.pick==='k')return 'K⁺ is positive, like Na⁺, and it carries no iodine. Try the other.';
     if(M.rev)return 'No iodine, no hormone: the gland swells again. In 1924, iodized salt reached Michigan stores, and goiters faded.';
     if(M.healed&&M.salt==='iodized')return 'Now <b>switch back to plain salt</b> and watch the neck.';
     if(M.salt==='iodized')return 'Iodide rides the blood to the thyroid. Two iodines join each ring, and two rings make the hormone T4. The pituitary\'s signal (orange) quiets, and over months the swelling goes down.';
     if(M.healed)return 'Plain salt again. Watch the orange signal and the front of the neck.';
     return 'Plain salt: no iodine reaches the thyroid, so no hormone. The pituitary keeps sending its signal (orange), and the gland swells forward. <b>Switch to iodized salt.</b>';},
   alt:'Look at the two pictures at the bottom. Salt is Na⁺ and Cl⁻. Iodide, I⁻, has the same −1 charge as chloride, so a tiny bit can be mixed onto salt grains. The thyroid needs iodine to make its hormone; without it, the pituitary keeps asking for more and the gland grows.',
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
