/* ============================================================
   Part 2 of 2: the scenes, the 13 steps and the page controls.
   ============================================================ */
const SITE='ChemLab',PAGE='equilibrium-story',KEY='rjchemlab-eqstory-v1',EVB='equilibrium',EVT='Equilibrium story';
const NOWORLD=i=>i<4||i===12,PAUSEOK=i=>i>=4&&i<=11;
const LW=1000,LH=560;
const cv=$('#stage'),ctx=cv.getContext('2d');let PX=1;
const W=new World();
let S={guess:{},sketch:[],mixes:[],order:[],tries:0,text:'',name:'',seen:{}};
try{Object.assign(S,JSON.parse(localStorage.getItem(KEY)||'{}'))}catch(e){}
try{S.name=localStorage.getItem('raider-labs-name')||S.name||''}catch(e){}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}};
let cur=0,st={},paused=false,lastCap='';
const ROOM=TK(25),HOT=TK(60),ICE=TK(0);

/* ---------- layout ---------- */
const R_TUBE={x:14,y:14,w:178,h:532},R_BOXC={x:204,y:14,w:404,h:532},BOX={x:216,y:48,w:380,h:424},R_RATE={x:620,y:14,w:366,h:216},R_GRAPH={x:620,y:242,w:366,h:304};
function eqWorld(T,o={}){const e=eqSplit(T,o.V||1,60);return W.setup(Object.assign({n4:e.n4,n2:e.n2,T,box:BOX,sc:SCB},o))}
const SCB=6;
function fixCounts(){W.m4=eqSplit(W.T,W.V,60).n4;W.m2=2*(60-W.m4)}

/* ---------- story pictures ---------- */
function capsule(ctx,x,y,s,open){ctx.save();ctx.translate(x,y);ctx.scale(s,s);
  // cradle
  ctx.fillStyle=PAL.dark?'#565b66':'#5f6570';rr(ctx,-150,118,300,20,6);ctx.fill();ctx.fillRect(-120,136,16,34);ctx.fillRect(104,136,16,34);
  // body
  ctx.beginPath();ctx.moveTo(-128,118);ctx.bezierCurveTo(-120,20,-80,-96,-44,-128);ctx.quadraticCurveTo(0,-150,44,-128);ctx.bezierCurveTo(80,-96,120,20,128,118);ctx.closePath();
  const g=ctx.createLinearGradient(-128,0,128,0);g.addColorStop(0,shade('#ffffff',PAL.dark?-.3:-.12));g.addColorStop(.45,PAL.dark?'#dfe3e8':'#ffffff');g.addColorStop(1,shade('#ffffff',PAL.dark?-.42:-.2));ctx.fillStyle=g;ctx.fill();
  ctx.strokeStyle=PAL.dark?'#0e1014':'#7d8794';ctx.lineWidth=2.5;ctx.stroke();
  ctx.fillStyle='#2b2f36';rr(ctx,-130,100,260,20,8);ctx.fill();                                   // heat shield
  [[-58,-52],[58,-52]].forEach(([wx,wy])=>{ctx.fillStyle='#1d2530';rr(ctx,wx-17,wy-13,34,26,8);ctx.fill();ctx.strokeStyle='#8f99a6';ctx.lineWidth=2;ctx.stroke()});
  [[-96,56],[96,56]].forEach(([tx,ty])=>{ctx.fillStyle='#3a3f48';ctx.beginPath();ctx.ellipse(tx,ty,13,24,tx<0?-.2:.2,0,TAU);ctx.fill();ctx.fillStyle='#14171c';ctx.beginPath();ctx.arc(tx,ty-8,4,0,TAU);ctx.arc(tx,ty+8,4,0,TAU);ctx.fill()});
  // hatch
  if(open){ctx.fillStyle='#14171c';rr(ctx,-30,-18,60,84,12);ctx.fill();ctx.fillStyle=PAL.dark?'#c9ced6':'#e9edf1';ctx.strokeStyle='#7d8794';ctx.save();ctx.translate(34,-18);ctx.transform(.42,-.1,0,1,0,0);rr(ctx,0,0,60,84,12);ctx.fill();ctx.stroke();ctx.restore()}
  else{ctx.strokeStyle=PAL.dark?'#30343c':'#7d8794';ctx.lineWidth=3;rr(ctx,-30,-18,60,84,12);ctx.stroke();ctx.fillStyle=ctx.strokeStyle;ctx.beginPath();ctx.arc(18,26,4.5,0,TAU);ctx.fill()}
  ctx.restore()}
function person(ctx,x,y,s,col,arm){ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.fillStyle=col;ctx.strokeStyle=PAL.dark?'#0e1014':'#5b6470';ctx.lineWidth=2;
  rr(ctx,-13,-52,26,54,10);ctx.fill();ctx.stroke();ctx.fillRect(-11,0,9,34);ctx.fillRect(2,0,9,34);ctx.strokeRect(-11,0,9,34);ctx.strokeRect(2,0,9,34);
  ctx.beginPath();ctx.arc(0,-66,13,0,TAU);ctx.fill();ctx.stroke();
  ctx.lineWidth=8;ctx.lineCap='round';ctx.strokeStyle=col;ctx.beginPath();ctx.moveTo(10,-42);ctx.lineTo(10+Math.cos(arm)*30,-42+Math.sin(arm)*30);ctx.stroke();ctx.restore()}
function sceneDeck(open,t){const g=ctx.createLinearGradient(0,0,0,330);g.addColorStop(0,PAL.sky1);g.addColorStop(1,PAL.sky2);ctx.fillStyle=g;ctx.fillRect(0,0,LW,340);
  ctx.fillStyle=PAL.dark?'#f4d58a':'#fff3c4';ctx.beginPath();ctx.arc(820,150,34,0,TAU);ctx.fill();
  ctx.fillStyle=PAL.sea;ctx.fillRect(0,300,LW,120);ctx.strokeStyle='rgba(255,255,255,.35)';ctx.lineWidth=2;for(let i=0;i<7;i++){const y=312+i*13,ph=RM?0:t*.5;ctx.beginPath();for(let x=0;x<=LW;x+=20){const yy=y+Math.sin(x*.02+i*1.7+ph)*2.5;x?ctx.lineTo(x,yy):ctx.moveTo(x,yy)}ctx.stroke()}
  ctx.fillStyle=PAL.deck;ctx.fillRect(0,400,LW,160);ctx.fillStyle=PAL.dark?'#2c2f36':'#767b85';ctx.fillRect(0,400,LW,8);
  ctx.strokeStyle=PAL.dark?'#6a707c':'#e6e8ec';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,366);ctx.lineTo(LW,366);ctx.stroke();for(let x=30;x<LW;x+=90){ctx.beginPath();ctx.moveTo(x,366);ctx.lineTo(x,402);ctx.stroke()}
  capsule(ctx,470,310,1.02,open);
  pill(ctx,'Gulf of Mexico · August 2, 2020',20,30,PAL.dark?'rgba(0,0,0,.55)':'rgba(255,255,255,.9)',PAL.ink,15);
  // the technician with the gas sensor
  person(ctx,238,470,1.05,'#e8a23a',-.35);ctx.fillStyle='#22262d';rr(ctx,268,418,30,20,4);ctx.fill();
  const blink=open?1:(RM?1:.55+.45*Math.sin(t*5));
  const bx=40,by=196,bw=262,bh=open?86:108;rr(ctx,bx,by,bw,bh,12);ctx.fillStyle=PAL.card;ctx.fill();ctx.strokeStyle=open?PAL.good:PAL.bad;ctx.lineWidth=2.5;ctx.stroke();
  ctx.beginPath();ctx.moveTo(226,by+bh-2);ctx.lineTo(282,412);ctx.lineTo(270,by+bh-2);ctx.closePath();ctx.fillStyle=PAL.card;ctx.fill();ctx.strokeStyle=open?PAL.good:PAL.bad;ctx.beginPath();ctx.moveTo(226,by+bh);ctx.lineTo(282,412);ctx.lineTo(270,by+bh);ctx.stroke();
  txt(ctx,'GAS SENSOR',bx+16,by+26,{s:12.5,w:700,c:PAL.soft});
  if(open){ctx.fillStyle=PAL.good;ctx.beginPath();ctx.arc(bx+26,by+54,9,0,TAU);ctx.fill();txt(ctx,'Reads zero. All clear.',bx+44,by+60,{s:18,w:700})}
  else{ctx.globalAlpha=blink;ctx.fillStyle=PAL.bad;ctx.beginPath();ctx.arc(bx+26,by+54,9,0,TAU);ctx.fill();ctx.globalAlpha=1;txt(ctx,'Toxic gas found',bx+44,by+60,{s:18,w:700});txt(ctx,'near the thrusters',bx+44,by+86,{s:16,c:PAL.soft})}
  if(open){person(ctx,640,470,1.05,'#f4f6f8',-1.1+(RM?0:Math.sin(t*4)*.25));person(ctx,712,474,1.05,'#f4f6f8',-.5);pill(ctx,'Hatch open · both astronauts out safely',600,214,PAL.good,'#fff',16)}
  else{pill(ctx,'Hatch: closed',470,186,PAL.bad,'#fff',16,'center');txt(ctx,'thrusters',640,452,{s:15,c:'#fff',w:700});ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(634,446);ctx.lineTo(580,384);ctx.stroke()}}

function bigTube(ctx,x,y,w,h,alpha){ctx.fillStyle=PAL.box;rr(ctx,x,y,w,h,w/2);ctx.fill();ctx.fillStyle=rgba(PAL.brown,alpha);rr(ctx,x+3,y+3,w-6,h-6,w/2-3);ctx.fill();ctx.strokeStyle=PAL.glass;ctx.lineWidth=3;rr(ctx,x,y,w,h,w/2);ctx.stroke();
  ctx.strokeStyle='rgba(255,255,255,.6)';ctx.lineWidth=3;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x+w*.24,y+h*.12);ctx.lineTo(x+w*.24,y+h*.82);ctx.stroke()}
function sceneTwo(t){const A={x:40,y:30,w:440,h:500},B={x:520,y:30,w:440,h:500};card(ctx,A);card(ctx,B);
  bigTube(ctx,A.x+50,A.y+70,70,330,0);bigTube(ctx,B.x+50,B.y+70,70,330,.86);
  drawMol(ctx,4,A.x+290,A.y+200,RM?0:Math.sin(t*.6)*.12,46,{bonds:true,label:true});drawMol(ctx,2,B.x+290,B.y+200,RM?0:Math.sin(t*.6+1)*.15,46,{bonds:true,label:true,halo:1});
  txt(ctx,'N₂O₄',A.x+290,A.y+330,{s:34,w:700,a:'center'});txt(ctx,'dinitrogen tetroxide',A.x+290,A.y+360,{s:16,c:PAL.soft,a:'center'});pill(ctx,'no color',A.x+290,A.y+396,PAL.card2,PAL.ink,17,'center');
  txt(ctx,'NO₂',B.x+290,B.y+330,{s:34,w:700,a:'center'});txt(ctx,'nitrogen dioxide',B.x+290,B.y+360,{s:16,c:PAL.soft,a:'center'});pill(ctx,'brown · burns lungs',B.x+290,B.y+396,rgba(PAL.brown,1),'#fff',17,'center');
  txt(ctx,'a tube of only N₂O₄',A.x+85,A.y+432,{s:15,c:PAL.soft,a:'center'});txt(ctx,'a tube of only NO₂',B.x+85,B.y+432,{s:15,c:PAL.soft,a:'center'});
  ctx.fillStyle=PAL.N;ctx.beginPath();ctx.arc(A.x+214,A.y+470,8,0,TAU);ctx.fill();txt(ctx,'nitrogen',A.x+228,A.y+475,{s:14,c:PAL.soft});ctx.fillStyle=PAL.O;ctx.beginPath();ctx.arc(A.x+304,A.y+470,8,0,TAU);ctx.fill();txt(ctx,'oxygen',A.x+318,A.y+475,{s:14,c:PAL.soft});
  rr(ctx,474,250,52,52,26);ctx.fillStyle=PAL.think;ctx.fill();txt(ctx,'?',500,277,{s:30,w:800,c:'#fff',a:'center',b:'middle'})}

/* ---------- one molecule: hit it, then let two meet ---------- */
function gauge(ctx,frac,note,good){const x=846,y=96,w=52,h=330,thr=.62;card(ctx,{x:770,y:30,w:204,h:500},'Energy of the hit');
  rr(ctx,x,y,w,h,8);ctx.fillStyle=PAL.card2;ctx.fill();const f=clamp(frac*thr,0,1);if(f>0){rr(ctx,x,y+h*(1-f),w,h*f,8);ctx.fillStyle=frac>=1?PAL.split:(PAL.dark?'#7b8290':'#9aa3ae');ctx.fill()}
  const ly=y+h*(1-thr);ctx.strokeStyle=PAL.think;ctx.lineWidth=3;ctx.setLineDash([7,5]);ctx.beginPath();ctx.moveTo(x-34,ly);ctx.lineTo(x+w+34,ly);ctx.stroke();ctx.setLineDash([]);
  rr(ctx,816,ly-40,112,34,6);ctx.fillStyle=PAL.card;ctx.globalAlpha=.9;ctx.fill();ctx.globalAlpha=1;txt(ctx,'needed to snap',872,ly-24,{s:14,c:PAL.think,w:700,a:'center'});txt(ctx,'the weak bond',872,ly-9,{s:14,c:PAL.think,w:700,a:'center'});
  if(note){const l=note.split('|');l.forEach((s,i)=>txt(ctx,s,872,462+i*20,{s:15.5,w:700,c:good?PAL.good:PAL.ink,a:'center',max:190}))}}
const CX=400,CY=250,BIG=60;
function sceneOne(t){const o=st,E=o.ph==='soft'?.38:o.ph==='hard'||o.ph==='split'?1.28:0;let stretch=0,snap=false,sep=0,bx=-200,gf=0,note='';
  if(o.ph==='idle'){bx=-200}
  else{const u=t-o.t0,fly=o.ph==='soft'?1.0:.42,hitX=CX-198;
    if(o.ph==='split'){snap=true;sep=1;gf=E;bx=-200}
    else if(u<fly){bx=lerp(-140,hitX,u/fly)}
    else{const v=u-fly;gf=E*ease(v/.25);bx=hitX-v*(o.ph==='soft'?70:150);
      if(o.ph==='soft'){stretch=.42*Math.sin(v*13)*Math.exp(-v*1.9);if(v>1.9&&!o.done){o.done=true;o.soft=true;cap(CAP.oneSoft)}}
      else{if(v<.5)stretch=1.5*ease(v/.5)+.2*Math.sin(v*30);else{snap=true;sep=ease((v-.5)/1.2);if(!o.done){o.done=true;o.hard=true;cap(CAP.oneHard);markDone();renderCtl()}if(v>2.2)o.ph='split'}}}}
  note=o.ph==='soft'&&gf>.3?'Too soft.|The bond holds.':snap?'Hard enough.|The bond snaps.':'';
  if(o.ph!=='idle'&&o.ph!=='split'&&bx>-190)drawMol(ctx,4,bx,CY+6,Math.PI/2,BIG*.9,{bonds:true});
  if(!snap){drawMol(ctx,4,CX,CY,0,BIG,{bonds:true,label:true,stretch,weak:o.ph==='idle'});
    if(o.ph==='idle'){ctx.strokeStyle=PAL.think;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(CX,CY-12);ctx.lineTo(CX,CY-124);ctx.stroke();pill(ctx,'the weak bond: long and thin',CX,CY-140,PAL.think,'#fff',15,'center')}
    txt(ctx,'N₂O₄',CX,CY+150,{s:30,w:700,a:'center'});txt(ctx,'no color',CX,CY+176,{s:16,c:PAL.soft,a:'center'})}
  else{const d=1.953*BIG+sep*105,rot=sep*.5;drawMol(ctx,2,CX-d,CY,Math.PI-rot,BIG,{bonds:true,label:true,halo:ease(sep*1.6)});drawMol(ctx,2,CX+d,CY,rot,BIG,{bonds:true,label:true,halo:ease(sep*1.6)});
    if(sep<.5&&!RM){ctx.strokeStyle=PAL.split;ctx.lineWidth=4;ctx.globalAlpha=1-sep*2;for(let i=0;i<8;i++){const a=i*TAU/8+.2;ctx.beginPath();ctx.moveTo(CX+Math.cos(a)*14,CY+Math.sin(a)*14);ctx.lineTo(CX+Math.cos(a)*(30+sep*90),CY+Math.sin(a)*(30+sep*90));ctx.stroke()}ctx.globalAlpha=1}
    if(sep>.6){ctx.globalAlpha=ease((sep-.6)/.4);txt(ctx,'NO₂',CX-d,CY+150,{s:30,w:700,a:'center'});txt(ctx,'NO₂',CX+d,CY+150,{s:30,w:700,a:'center'});txt(ctx,'brown',CX-d,CY+176,{s:16,c:rgba(PAL.brown,1),w:700,a:'center'});txt(ctx,'brown',CX+d,CY+176,{s:16,c:rgba(PAL.brown,1),w:700,a:'center'});
      eqLine(1,0);ctx.globalAlpha=1}}
  gauge(ctx,gf,note,snap)}
function eqLine(fw,bk){const y=500;txt(ctx,'N₂O₄',CX-128,y,{s:30,w:700,a:'center',b:'middle'});txt(ctx,'2 NO₂',CX+128,y,{s:30,w:700,a:'center',b:'middle'});
  if(fw)arrow(ctx,CX-52,y-(bk?9:0),CX+52,y-(bk?9:0),4,PAL.split);if(bk)arrow(ctx,CX+52,y+9,CX-52,y+9,4,PAL.join)}
function sceneBack(t){const o=st;let d=230,joined=false,u=0;
  if(o.ph==='go'){u=(t-o.t0)/1.5;d=lerp(230,.89*BIG,ease(u));if(u>=1){joined=true;if(!o.done){o.done=true;cap(CAP.backDone);markDone();renderCtl()}}}
  if(o.ph==='done'){joined=true;u=9}
  if(!joined){const bob=RM?0:Math.sin(t*1.3)*8;drawMol(ctx,2,CX-d-.313*BIG,CY+bob*(1-ease(u)),Math.PI,BIG,{bonds:true,label:true,halo:1});drawMol(ctx,2,CX+d+.313*BIG,CY-bob*(1-ease(u)),0,BIG,{bonds:true,label:true,halo:1});
    txt(ctx,'NO₂',CX-d,CY+150,{s:30,w:700,a:'center'});txt(ctx,'NO₂',CX+d,CY+150,{s:30,w:700,a:'center'})}
  else{const v=(t-o.t0)-1.5,k=o.ph==='done'?1:ease(v/.9);
    if(k<1&&!RM){ctx.strokeStyle=PAL.dark?'#f4d58a':'#e0a500';ctx.lineWidth=4;ctx.globalAlpha=1-k;for(let i=0;i<10;i++){const a=i*TAU/10;ctx.beginPath();ctx.moveTo(CX+Math.cos(a)*(20+k*40),CY+Math.sin(a)*(20+k*40));ctx.lineTo(CX+Math.cos(a)*(44+k*110),CY+Math.sin(a)*(44+k*110));ctx.stroke()}ctx.globalAlpha=1;
      pill(ctx,'energy given off',CX,CY-150,PAL.dark?'#f4d58a':'#e0a500','#1c1c1f',15,'center')}
    drawMol(ctx,4,CX,CY,0,BIG,{bonds:true,label:true,halo:1-k});txt(ctx,'N₂O₄',CX,CY+150,{s:30,w:700,a:'center'});txt(ctx,'no color again',CX,CY+176,{s:16,c:PAL.soft,a:'center'});
    ctx.globalAlpha=k;eqLine(1,1);txt(ctx,'splits',CX,476,{s:13.5,c:PAL.split,w:700,a:'center'});txt(ctx,'joins',CX,534,{s:13.5,c:PAL.join,w:700,a:'center'});ctx.globalAlpha=1}
  gauge(ctx,joined?.1:0,joined?'No hard hit needed.|They only had to meet.':'',joined)}

/* ---------- the crowd: tube, box, rates, graph ---------- */
function countsRow(){const y=510,b=R_BOXC,s4=sprite(4,SCB),s2=sprite(2,SCB);ctx.drawImage(s4.c,b.x+40-s4.R,y-s4.R,s4.R*2,s4.R*2);txt(ctx,'N₂O₄',b.x+60,y+1,{s:16,c:PAL.soft,b:'middle'});txt(ctx,String(W.count(4)),b.x+116,y+1,{s:22,w:700,b:'middle'});
  ctx.drawImage(s2.c,b.x+228-s2.R,y-s2.R,s2.R*2,s2.R*2);txt(ctx,'NO₂',b.x+246,y+1,{s:16,c:PAL.soft,b:'middle'});txt(ctx,String(W.count(2)),b.x+290,y+1,{s:22,w:700,b:'middle'});
  if(W.speed>1)pill(ctx,W.speed+'× speed',b.x+b.w-12,b.y+19,PAL.card2,PAL.ink,13,'right');else if(W.speed<1)pill(ctx,'slow motion',b.x+b.w-12,b.y+19,PAL.think,'#fff',13,'right')}
function sceneCrowd(o){const r=W.rates(),c2=molar(W.m2)/W.V,tp=drawTube(ctx,R_TUBE,o.bath,c2,o.lift||0,st.t||0);
  card(ctx,R_BOXC,'Zoomed in: a sample of the gas');
  ctx.strokeStyle=PAL.line;ctx.lineWidth=1.5;ctx.setLineDash([4,5]);ctx.beginPath();ctx.moveTo(tp.tx,tp.ty-30);ctx.lineTo(BOX.x,BOX.y);ctx.moveTo(tp.tx,tp.ty+30);ctx.lineTo(BOX.x,BOX.y+BOX.h);ctx.stroke();ctx.setLineDash([]);
  W.draw(ctx);countsRow();
  if(!W.react&&cur===4)pill(ctx,'reactions not started',BOX.x+BOX.w/2,BOX.y+26,PAL.ink,PAL.card,14,'center');
  drawRates(ctx,R_RATE,W.react?r.S:0,W.react?r.J:0,o.rmax||4);
  if(o.tagStrip)tagStrip();else st.g=drawGraph(ctx,R_GRAPH,W,{ymax:o.ymax||40,span:o.span||12,sketch:o.sketch?S.sketch:null,sketching:o.sketching})}
function tagStrip(){const r=R_GRAPH;card(ctx,r,'The pink atom, moment by moment');const L=r.x+16,Wd=r.w-32,y=r.y+70,h=56,H=W.tagHist,n=300,cw=Wd/n;
  rr(ctx,L,y,Wd,h,8);ctx.fillStyle=PAL.card2;ctx.fill();ctx.save();rr(ctx,L,y,Wd,h,8);ctx.clip();const a=H.slice(-n);a.forEach((v,i)=>{ctx.fillStyle=v===2?rgba(PAL.brown,1):(PAL.dark?'#3d4250':'#cfd6de');ctx.fillRect(L+(n-a.length+i)*cw,y,cw+.6,h)});ctx.restore();
  txt(ctx,'now',L+Wd,y+h+18,{s:13,c:PAL.soft,a:'right'});txt(ctx,'earlier',L,y+h+18,{s:13,c:PAL.soft});
  const ly=y+h+56;ctx.fillStyle=PAL.dark?'#3d4250':'#cfd6de';rr(ctx,L,ly-12,22,16,4);ctx.fill();txt(ctx,'inside an N₂O₄',L+30,ly+1,{s:15.5});ctx.fillStyle=rgba(PAL.brown,1);rr(ctx,L,ly+16,22,16,4);ctx.fill();txt(ctx,'a free NO₂',L+30,ly+29,{s:15.5});
  let sw=0;for(let i=1;i<H.length;i++)if(H[i]!==H[i-1])sw++;txt(ctx,'Switched '+sw+' time'+(sw===1?'':'s')+' so far',L,ly+72,{s:17,w:700,c:PAL.think})}

/* ---------- the leak: same molecules, more room ---------- */
const R_BIG={x:14,y:14,w:972,h:336},BOX2={x:28,y:50,w:944,h:286},R_RATE2={x:14,y:360,w:480,h:186},R_SHARE={x:506,y:360,w:480,h:186};
function sceneRoom(){const r=W.rates();card(ctx,R_BIG,'Zoomed in: same molecules, more room');W.draw(ctx);
  const far=st.room>2;if(far){const b=BOX2;ctx.fillStyle=PAL.dark?'rgba(25,27,32,.82)':'rgba(255,255,255,.84)';rr(ctx,b.x+b.w*.25,b.y+b.h/2-44,b.w*.5,88,12);ctx.fill();ctx.strokeStyle=PAL.line;ctx.stroke();
    txt(ctx,st.room.toLocaleString()+'× the room is too big to draw.',b.x+b.w/2,b.y+b.h/2-8,{s:18,w:700,a:'center'});txt(ctx,'The bar below shows where the balance ends up.',b.x+b.w/2,b.y+b.h/2+20,{s:15.5,c:PAL.soft,a:'center'})}
  const pw=pill(ctx,'N₂O₄ '+W.count(4)+'  ·  NO₂ '+W.count(2),R_BIG.x+R_BIG.w-14,R_BIG.y+20,PAL.card2,PAL.ink,14,'right');if(W.speed<1)pill(ctx,'slow motion',R_BIG.x+R_BIG.w-22-pw,R_BIG.y+20,PAL.think,'#fff',13,'right');
  drawRates(ctx,R_RATE2,r.S,r.J,4,{title:far?'Each second, in the 2× box above':'Each second, in the whole box'});
  const sh=far?eqSplit(W.T,st.room,60).a:W.m2/(W.m2+2*W.m4),q=R_SHARE;card(ctx,q,'Of every 100 nitrogen atoms');const x=q.x+14,w=q.w-28,y=q.y+48,h=48;
  rr(ctx,x,y,w,h,8);ctx.fillStyle=PAL.dark?'#3d4250':'#cfd6de';ctx.fill();ctx.save();rr(ctx,x,y,w,h,8);ctx.clip();ctx.fillStyle=rgba(PAL.brown,1);ctx.fillRect(x,y,w*sh,h);ctx.restore();
  const n=Math.round(sh*100);txt(ctx,n+' in brown NO₂',x,y+h+24,{s:17,w:700,c:rgba(PAL.brown,1)});txt(ctx,(100-n)+' in N₂O₄',x+w,y+h+24,{s:17,w:700,c:PAL.soft,a:'right'});
  txt(ctx,'Room: '+(far?st.room.toLocaleString():(Math.round(W.V*10)/10))+'×'+(far?' (where it settles)':''),x,y+h+52,{s:15,c:PAL.soft})}

/* ---------- the balance as a picture: a strip and a square ---------- */
const R_AREA={x:14,y:14,w:606,h:532},R_MIX={x:632,y:14,w:354,h:532},BOX3={x:646,y:48,w:326,h:210};
function sceneArea(){const P=cur===10?5:3.3,n4=W.m4,n2=W.m2,Kh=Kc(W.T)*NB,r=W.rates(),A=R_AREA;card(ctx,A,'The two rates, drawn as areas');
  const base=A.y+336,x0=A.x+26,x2=A.x+372;st.kh=st.kh===undefined?Kh:lerp(st.kh,Kh,.12);const hh=Math.max(2,st.kh*P),len=n4*P,side=Math.min(n2*P,232);
  // strip = splits
  ctx.fillStyle=PAL.split;ctx.globalAlpha=.85;ctx.fillRect(x0,base-hh,len,hh);ctx.globalAlpha=1;ctx.strokeStyle=PAL.split;ctx.lineWidth=2;ctx.strokeRect(x0,base-hh,Math.max(len,1),hh);
  txt(ctx,'Splits: a strip',x0,A.y+52,{s:18,w:700,c:PAL.split});txt(ctx,'each N₂O₄ splits on its own',x0,A.y+72,{s:14.5,c:PAL.soft});
  ctx.strokeStyle=PAL.soft;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x0,base+10);ctx.lineTo(x0+len,base+10);ctx.moveTo(x0,base+5);ctx.lineTo(x0,base+15);ctx.moveTo(x0+len,base+5);ctx.lineTo(x0+len,base+15);ctx.stroke();
  txt(ctx,'length = N₂O₄: '+Math.round(n4),x0,base+33,{s:15,w:600});
  txt(ctx,'height = K, set by the temperature',x0,base-hh-9,{s:14.5,w:600,c:PAL.split});
  // square = joins
  ctx.fillStyle=PAL.join;ctx.globalAlpha=.85;ctx.fillRect(x2,base-side,side,side);ctx.globalAlpha=1;ctx.strokeStyle=PAL.join;ctx.lineWidth=2;ctx.strokeRect(x2,base-side,Math.max(side,1),Math.max(side,1));
  ctx.strokeStyle='rgba(255,255,255,.35)';ctx.lineWidth=1;for(let i=5;i<n2;i+=5){ctx.beginPath();ctx.moveTo(x2+i*P,base-side);ctx.lineTo(x2+i*P,base);ctx.moveTo(x2,base-i*P);ctx.lineTo(x2+side,base-i*P);ctx.stroke()}
  ctx.fillStyle=rgba(PAL.brown,1);for(let i=0;i<Math.round(n2)&&(i+.5)*P<side;i++){ctx.beginPath();ctx.arc(x2+(i+.5)*P,base-side-7,Math.min(2.2,P*.4),0,TAU);ctx.arc(x2-7,base-(i+.5)*P,Math.min(2.2,P*.4),0,TAU);ctx.fill()}
  txt(ctx,'Joins: a square',x2,A.y+52,{s:18,w:700,c:PAL.join});txt(ctx,'every NO₂ can meet every other',x2,A.y+72,{s:14.5,c:PAL.soft});
  ctx.strokeStyle=PAL.soft;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x2,base+10);ctx.lineTo(x2+side,base+10);ctx.moveTo(x2,base+5);ctx.lineTo(x2,base+15);ctx.moveTo(x2+side,base+5);ctx.lineTo(x2+side,base+15);ctx.stroke();
  txt(ctx,'side = NO₂: '+Math.round(n2),x2,base+33,{s:15,w:600});
  // the same thing in symbols, with a live sign between the two sides
  {const r0=W.rates(),bg=Math.max(r0.S,r0.J,.01),dd=(r0.S-r0.J)/bg,sg=Math.abs(dd)<.012?'=':dd>0?'>':'<';txt(ctx,'K × [N₂O₄]',x0,A.y+100,{s:21,w:700,c:PAL.split});txt(ctx,'[NO₂] × [NO₂]',x2,A.y+100,{s:21,w:700,c:PAL.join});
   txt(ctx,sg,x2-52,A.y+101,{s:30,w:800,c:sg==='='?PAL.good:PAL.ink,a:'center'})}
  // the scale
  const cx=A.x+A.w/2,by=A.y+432,big=Math.max(r.S,r.J,.01),d=clamp((r.S-r.J)/big,-1,1),ang=-d*.16,bal=Math.abs(d)<.012;
  ctx.fillStyle=PAL.soft;ctx.beginPath();ctx.moveTo(cx,by);ctx.lineTo(cx-14,by+30);ctx.lineTo(cx+14,by+30);ctx.closePath();ctx.fill();
  ctx.save();ctx.translate(cx,by);ctx.rotate(ang);ctx.strokeStyle=bal?PAL.good:PAL.ink;ctx.lineWidth=5;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-200,0);ctx.lineTo(200,0);ctx.stroke();
  ctx.fillStyle=PAL.split;rr(ctx,-216,-13,32,26,6);ctx.fill();ctx.fillStyle=PAL.join;rr(ctx,184,-13,32,26,6);ctx.fill();ctx.restore();
  txt(ctx,'splits '+r.S.toFixed(1)+' a second',cx-110,by+62,{s:16,w:700,c:PAL.split,a:'center'});txt(ctx,'joins '+r.J.toFixed(1)+' a second',cx+110,by+62,{s:16,w:700,c:PAL.join,a:'center'});
  txt(ctx,bal?'Areas match: balanced':d>0?'Strip is bigger: NO₂ will build up':'Square is bigger: NO₂ will run down',cx,by+90,{s:16,w:700,c:bal?PAL.good:PAL.ink,a:'center'});
  // right side: the sample and the number
  const M=R_MIX;card(ctx,M,'This mixture · '+Math.round(W.T-273.15)+' °C'+(W.speed>1?' · '+W.speed+'× speed':''));W.draw(ctx);
  const c4=molar(n4),c2=molar(n2),q=c4>1e-6?c2*c2/c4:0,y=M.y+292;
  txt(ctx,'square ÷ strip length',M.x+16,y,{s:14.5,c:PAL.soft});
  txt(ctx,'[NO₂]² ÷ [N₂O₄]',M.x+16,y+28,{s:19,w:700});
  txt(ctx,'('+c2.toFixed(4)+')² ÷ '+c4.toFixed(4),M.x+16,y+54,{s:15.5,c:PAL.soft});
  txt(ctx,'= '+(c4>1e-6?q.toPrecision(2):'—'),M.x+16,y+86,{s:26,w:700,c:bal?PAL.good:PAL.ink});
  if(bal)pill(ctx,'= K at '+Math.round(W.T-273.15)+' °C',M.x+150,y+78,PAL.good,'#fff',14);
  const list=S.mixes.slice(-3);if(st.log&&list.length){txt(ctx,'MIXTURES THAT SETTLED',M.x+16,y+126,{s:12.5,w:700,c:PAL.soft});
    list.forEach((m,i)=>txt(ctx,`${m.n4} N₂O₄ + ${m.n2} NO₂  →  ${m.q}`,M.x+16,y+150+i*24,{s:15.5,w:600,max:M.w-32}))}}

/* ---------- captions ---------- */
const CAP={
 oneIdle:'One N₂O₄, drawn to its real shape. The long bond in the middle is its weak spot. Other molecules bump it all the time. <b>Give it a soft hit, then a hard one.</b>',
 oneSoft:'A soft hit. The weak bond stretches, wobbles, and holds. Most hits are like this one. <b>Now hit it hard.</b>',
 oneHard:'A hard hit. The weak bond snaps. One N₂O₄ with no color is now two brown NO₂. Chemists write it N₂O₄ → 2 NO₂.',
 backIdle:'Two NO₂ drift near each other. <b>Let them meet.</b>',
 backDone:'No hard hit needed. Two NO₂ only have to meet, and they snap together. A reaction that runs both ways is <b>reversible</b>. The double arrow ⇌ means both directions.',
 runA:'Only splits so far. There is almost no NO₂ yet, so there is nothing to join. Watch the brown line and the tube.',
 runB:'More NO₂ now, so more of them meet. Joins are catching up with splits.',
 runC:'Splits and joins now match. While one N₂O₄ splits, two NO₂ join somewhere else. The amounts stop changing, and the tube holds its color.',
 stopQ:'The color has stopped changing. <b>Have the molecules stopped reacting?</b>',
 stopA:'Follow the pink nitrogen atom. It is inside an N₂O₄, then a free NO₂, then joined again. Nothing stopped. This is <b>dynamic equilibrium</b>: still moving, in equal balance.',
 heat0:'Now test your guess. <b>Move the tube into hot water.</b>',
 heatGap:'Hot water makes every hit harder. Splitting needs a hard hit, so <b>splits jump</b>. Joining only needs a meeting, so joins have not changed yet.',
 heatCatch:'The extra splits pile up NO₂. More NO₂ means more meetings, so joins climb.',
 heatBal:'Balanced again, with more NO₂ than before. The tube is <b>browner</b>.',
 cool0:'<b>Now move the tube into ice water.</b>',
 coolGap:'In ice, hard hits are rare, so splits almost stop. Joins keep going and use up the brown NO₂.',
 coolBal:'Balanced again, with very little NO₂. The tube is pale. Same tube, same atoms: each temperature has its own balance point.',
 roomBal:'Balanced at room temperature.',
 room0:'Back to the capsule. Leaked gas does not stay packed in a tank. It spreads into open air. Here the same molecules get <b>twice the room</b>. Guess first, then open it up.',
 roomGap:'Each N₂O₄ still gets hit as before, so <b>splits hold steady</b>. But the NO₂ are farther apart and meet half as often, so <b>joins drop</b>.',
 roomOpen:'The wall slides back. Same molecules, twice the room. Watch them spread out.',
 roomCatch:'Splits stay ahead, so NO₂ builds up. More NO₂ means more meetings, and joins climb back.',
 roomBack:'Squeezed together again, the NO₂ meet more often, so joins lead until it balances.',
 roomBal2:'Balanced again, with more of the nitrogen as NO₂. <b>Now try even more room.</b>',
 roomFar:'Spread thin in open air, nearly all of it becomes brown, toxic NO₂. That is the gas the sensor found beside a capsule whose propellant has no color.',
 area0:'Every NO₂ can meet every other NO₂, so joins grow like a <b>square</b>: NO₂ × NO₂. Each N₂O₄ splits on its own, so splits grow like a <b>strip</b>. <b>Build a mixture, then let it react.</b>',
 area1:'It stopped where the two areas match. <b>Build a different mixture and try again.</b>',
 area2:'Different mixtures, same ending: square ÷ strip length is the same number. That number is <b>K</b>, the equilibrium constant. In symbols, K = [NO₂]² / [N₂O₄]. Brackets mean moles in each liter.',
 temp0:'The strip’s height is K: how easily one N₂O₄ splits. <b>Change the temperature.</b>',
 temp1:'Hot makes the strip taller, so the square must grow to match it. Cold shrinks both. Adding gas or room never changes K. Only temperature does.',
};
const heatLine=()=>{const g=S.guess.heat;return g===undefined?'':` <span class="chip ${g===0?'ok':'no'}">Your guess: ${['browner','no change','paler'][g]} ${g===0?'✓':'✗'}</span>`};

/* ---------- the steps ---------- */
const PARTS=['The hatch','One molecule','A crowd','Heat','Room','The rule','Your turn'];
function picks(key,q,opts,right,after){const g=S.guess[key];if(after&&g!==undefined)return `<p class="note">Your guess: <b>${opts[g].toLowerCase()}</b> <span class="chip ${g===right?'ok':'no'}">${g===right?'✓ matched':'✗ not this time'}</span></p>`;return `<div class="pick" data-key="${key}"><p class="q">${q}</p><div class="row">${opts.map((o,i)=>`<button type="button" class="btn opt${g===i?' on':''}${g!==undefined&&after&&i===right?' right':''}" data-i="${i}" aria-pressed="${g===i}">${o}</button>`).join('')}</div></div>`}
function bindPicks(root,fn){$$('.pick .opt',root).forEach(b=>b.addEventListener('click',()=>{const k=b.closest('.pick').dataset.key;S.guess[k]=+b.dataset.i;save();ev('guess-'+k+'-'+b.dataset.i);fn&&fn(k,+b.dataset.i);renderCtl()}))}
function settled(){const r=W.rates(),big=Math.max(r.S,r.J);return big>0&&Math.abs(r.S-r.J)/big<.05}
function gapUp(){const r=W.rates(),big=Math.max(r.S,r.J);return big>0?(r.S-r.J)/big:0}
function bathBtns(){return `<div class="row baths"><span class="lab">Move the tube into:</span>${[[0,'Ice water · 0 °C'],[25,'Room · 25 °C'],[60,'Hot water · 60 °C']].map(([c,l])=>`<button type="button" class="btn bath b${c}${st.bath===c?' on':''}" data-c="${c}" aria-pressed="${st.bath===c}">${l}</button>`).join('')}</div>`}
function bindBaths(root){bindBeat(root);$$('.bath',root).forEach(b=>b.addEventListener('click',()=>{const c=+b.dataset.c;if(c===st.bath)return;st.bath=c;st.moveT=st.t;st.moved=(st.moved||0)+1;st.pendC=c;st.phase='';renderCtl()}))}
function heatTick(){ // lift the tube, swap the bath, hold the first moment in slow motion, then narrate by what the rates are doing
  if(st.pendC!==undefined){const u=(st.t-st.moveT)/.9;st.lift=u<.5?ease(u*2):ease((1-u)*2);if(u>=.5&&st.shown!==st.pendC){st.shown=st.pendC;W.setT(TK(st.pendC),st.pendC===0?'ice':st.pendC===60?'hot water':'room');
      st.beat=st.pendC===60?1:0;st.beatT=st.t;W.speed=st.beat?.035:1;renderCtl()}
    if(u>=1){st.lift=0;st.pendC=undefined}return}
  if(!st.moved)return;const c=st.shown,g=gapUp(),ok=settled()&&st.t-st.beatT>2.2;
  if(st.beat===1){cap(CAP.heatGap);if(st.t-st.beatT>16)beatGo();return}
  W.speed=ok?1:c===60?.3:c===0&&st.t-st.beatT>3?2:1;
  if(c===60)cap(ok?CAP.heatBal+heatLine():CAP.heatCatch);
  else if(c===0)cap(ok?CAP.coolBal:CAP.coolGap);else cap(ok?CAP.roomBal:(g>0?CAP.heatCatch:CAP.coolGap));
  if(ok&&(cur===7?c===60:c===0))markDone()}
function beatGo(){st.beat=2;renderCtl()}
const beatBtn=()=>st.beat===1?'<div class="row"><button type="button" class="btn primary act pulse" data-beat="1">See what happens next ▶</button></div>':'';
function bindBeat(r){const b=$('[data-beat]',r);b&&b.addEventListener('click',beatGo)}

const STEPS=[
 {part:0,title:'The hatch stays shut',
  cap:'<b>August 2, 2020.</b> Bob Behnken and Doug Hurley are back from two months in space. Their capsule is lifted onto the recovery ship. But nobody opens the hatch. A sensor has found a toxic gas outside.',
  alt:'Nothing is wrong with the crew. The team outside tests the air first, the way firefighters check for gas before they open a door. This time the test found something.',
  aria:'A space capsule sits on the deck of a recovery ship with its hatch closed. A technician holds a gas sensor that reads: toxic gas found near the thrusters.',
  draw(){sceneDeck(false,st.t)}},
 {part:0,title:'Two gases, the same atoms',
  cap:'The thrusters use dinitrogen tetroxide, <b>N₂O₄</b>. It has no color. The gas that burns lungs is <b>NO₂</b>, and it is brown. Both are made of only nitrogen and oxygen. So where does the brown gas come from?',
  alt:'Look at the two molecules. N₂O₄ looks like two NO₂ stuck together. Keep that picture in mind for the next step.',
  aria:'Two sealed tubes. The tube of N2O4 has no color. The tube of NO2 is brown. Beside each is its molecule: N2O4 looks like two NO2 joined together.',
  draw(){sceneTwo(st.t)},
  ctl(){return picks('heat','Guess now, test it later: a sealed tube of this gas goes from ice water into hot water. Nothing gets in or out. The color will…',['get browner','stay the same','get paler'])+(S.guess.heat!==undefined?'<p class="note">Locked in. You will test it in Part 4.</p>':'')},bind(r){bindPicks(r)}},
 {part:1,title:'Follow one molecule',cap:CAP.oneIdle,
  alt:'Picture two magnets stuck together. A light tap does nothing. A hard knock pulls them apart. The bond between the two nitrogen atoms is the place where the magnets touch.',
  aria:'One large N2O4 molecule with its long, weak nitrogen to nitrogen bond marked. A gauge shows the energy of each hit against the energy needed to snap that bond.',
  enter(){st.ph='idle'},draw(){sceneOne(st.t)},
  ctl(){return `<div class="row"><button type="button" class="btn act" data-h="soft">Soft hit</button><button type="button" class="btn act primary" data-h="hard">Hard hit</button>${st.hard?'<button type="button" class="btn" data-h="idle">Put it back together</button>':''}</div>`},
  bind(r){$$('[data-h]',r).forEach(b=>b.addEventListener('click',()=>{st.ph=b.dataset.h;st.t0=st.t;st.done=false;if(st.ph==='idle'){st.hard=false;cap(CAP.oneIdle)}renderCtl()}))}},
 {part:1,title:'Can it go back?',cap:CAP.backIdle,
  alt:'The same magnets: pulling them apart takes a hard knock, but bring them close and they snap together on their own. Joining gives energy off. Splitting takes energy in.',
  aria:'Two brown NO2 molecules drift toward each other and join into one N2O4 with no color. The equation shows a double arrow: N2O4 splits into 2 NO2, and 2 NO2 join into N2O4.',
  enter(){st.ph='wait'},draw(){sceneBack(st.t)},
  ctl(){return `<div class="row"><button type="button" class="btn act primary" data-m="go">Let them meet</button>${st.done?'<button type="button" class="btn" data-m="wait">Pull them apart again</button>':''}</div>`},
  bind(r){$$('[data-m]',r).forEach(b=>b.addEventListener('click',()=>{st.ph=b.dataset.m;st.t0=st.t;st.done=false;if(st.ph==='wait')cap(CAP.backIdle);renderCtl()}))}},
 {part:2,title:'Now a crowd',
  cap:'Sixty N₂O₄ at room temperature: a tiny sample of the gas in the sealed tube. When the reactions start, some will split. <b>First, draw the line you think the brown NO₂ will follow.</b>',
  alt:'You are guessing how the number of brown NO₂ changes as time goes by. Does it keep climbing? Level off? Come back down? Any guess is fine. You will see the real line next.',
  aria:'A sealed tube with no color sits at room temperature. A zoomed in box shows sixty N2O4 molecules. An empty graph waits for your prediction of how the amount of NO2 will change.',
  enter(){W.setup({n4:60,n2:0,T:ROOM,box:BOX,sc:SCB,react:false});st.sketching=true},
  draw(){sceneCrowd({bath:25,sketching:true,sketch:true})},
  ctl(){return `<div class="row"><span class="lab">Draw on the graph, or pick a shape:</span><button type="button" class="btn" data-sk="up">keeps climbing</button><button type="button" class="btn" data-sk="flat">climbs, then levels off</button><button type="button" class="btn" data-sk="hump">climbs, then falls back</button><button type="button" class="btn" data-sk="clear">Clear</button></div><div class="row"><button type="button" class="btn primary act" data-go="1">Start the reactions</button></div>`},
  bind(r){$$('[data-sk]',r).forEach(b=>b.addEventListener('click',()=>{const k=b.dataset.sk,f={up:t=>3.2*t,flat:t=>24*(1-Math.exp(-t/2.2)),hump:t=>30*Math.exp(-((t-4.5)**2)/7)*(t<4.5?1:1)+0}[k];S.sketch=[];if(f)for(let t=0;t<=12;t+=.5)S.sketch.push({t,v:clamp(f(t),0,40)});S.guess.shape=k;save()}));
    $('[data-go]',r).addEventListener('click',()=>go(cur+1))}},
 {part:2,title:'Watch both directions',cap:CAP.runA,
  alt:'Orange rings are splits. Teal rings are joins. Early on you see only orange, so brown NO₂ builds up. Later you see both about equally often, so the amount stays put.',
  aria:'The reactions run. Orange rings mark N2O4 molecules splitting and teal rings mark NO2 molecules joining. Two bars compare splits and joins each second, and a brown line shows the amount of NO2 rising and then leveling off as the tube turns light brown.',
  enter(from){if(from!==4||W.react||W.t>60)W.setup({n4:60,n2:0,T:ROOM,box:BOX,sc:SCB});else{W.react=true;W.t=0;W.hist=[];W.hT=0;W.push()}},
  tick(){const r=W.rates(),f=r.S>0?r.J/r.S:0;const ph=f<.3?'A':(f<.93||W.t<5)?'B':'C';if(ph!==st.phase){st.phase=ph;cap(CAP['run'+ph]);if(ph==='C')markDone()}},
  draw(){sceneCrowd({bath:25,sketch:true})},
  ctl(){return `<div class="row"><button type="button" class="btn" data-re="1">↻ Run it again</button></div>`},bind(r){$('[data-re]',r).addEventListener('click',()=>{W.setup({n4:60,n2:0,T:ROOM,box:BOX,sc:SCB});st.phase=''})}},
 {part:2,title:'Did it stop?',cap:CAP.stopQ,
  alt:'Think of a store where one person walks in for every person who walks out. The number inside stays the same, but the people keep changing. The tube is like that.',
  aria:'The tube has stopped changing color. In the zoomed in box, one nitrogen atom is tagged pink. A strip shows the tagged atom switching between being inside an N2O4 and being a free NO2.',
  enter(from){if(!(from===5&&W.react&&settled()))eqWorld(ROOM);st.reveal=false;if(S.guess.stop!==undefined)this.reveal()},
  reveal(){st.reveal=true;W.speed=4;const p=W.ps.find(q=>q.type===2)||W.ps[0];W.tag=p.ns[0];W.tagHist=[];cap(CAP.stopA);markDone()},
  draw(){sceneCrowd({bath:25,tagStrip:st.reveal})},
  ctl(){return picks('stop','Your guess:',['Yes, they have stopped','No, they keep going'],1,st.reveal)},bind(r){bindPicks(r,()=>{STEPS[6].reveal()})}},
 {part:3,title:'Into hot water',cap:CAP.heat0,
  alt:'Heat does not push the reaction anywhere. It makes hard hits common, and only splitting needs a hard hit. So splitting gets ahead until joining catches up.',
  aria:'The sealed tube moves from room temperature into hot water. In the box, splits jump far ahead of joins, the amount of NO2 climbs, joins catch up, and the tube settles at a darker brown.',
  enter(){eqWorld(ROOM);st.bath=25;st.shown=25;st.lift=0;cap(CAP.heat0+(S.guess.heat===undefined?'':` <span class="chip">Your guess: ${['browner','no change','paler'][S.guess.heat]}</span>`))},
  tick:heatTick,draw(){sceneCrowd({bath:st.shown,lift:st.lift,rmax:40,ymax:60,span:14})},ctl(){return bathBtns()+beatBtn()},bind:bindBaths},
 {part:3,title:'Back into ice',cap:CAP.cool0,
  alt:'Cold is hot in reverse. Fewer hard hits means fewer splits. Joining does not need a hard hit, so it carries on and uses up the brown NO₂.',
  aria:'The tube moves into ice water. Splits almost stop while joins continue, the amount of NO2 falls, and the tube turns pale.',
  enter(from){if(!(from===7&&st0.shown===60&&st0.pendC===undefined))eqWorld(HOT);st.bath=60;st.shown=60;st.lift=0},
  tick:heatTick,draw(){sceneCrowd({bath:st.shown,lift:st.lift,rmax:40,ymax:60,span:14})},
  ctl(){return bathBtns()+beatBtn()+(st.moved?`<div class="term"><b>Le Châtelier’s principle</b> (say “luh SHAH-tuh-lyay”): disturb a balanced reaction and it shifts to partly undo the change. A French chemist described the pattern in 1884. You just saw why it happens. Nothing decides to shift. The two rates do it.</div>`:'')},bind:bindBaths},
 {part:4,title:'The leak spreads out',cap:CAP.room0,
  alt:'Splitting is a solo act. Joining needs a partner. Spread a crowd across a bigger field and solo acts go on as before, but partners find each other less often.',
  aria:'A box of gas with a sliding wall. When the wall opens to give twice the room, splits stay the same and joins drop to half, so more NO2 builds up. A bar shows the share of nitrogen atoms in brown NO2 growing as the room grows.',
  enter(){const e=eqSplit(ROOM,1,60);W.setup({n4:e.n4,n2:e.n2,T:ROOM,V:1,Vmax:2,box:BOX2,sc:5.6});st.room=1},
  tick(){if(st.room>2){W.react=true;W.speed=1;cap(CAP.roomFar);markDone();return}
    if(st.room===1){W.react=true;W.speed=1;if(st.opened)cap(settled()&&W.V===1?CAP.roomBal:CAP.roomBack);return}
    if(st.beat===0){W.react=false;W.speed=1;if(W.V===2&&st.t-st.moveT>1.3){st.beat=1;st.beatT=st.t;W.react=true;W.speed=.05;renderCtl()}return}
    if(st.beat===1){cap(CAP.roomGap);if(st.t-st.beatT>16)beatGo();return}
    const ok=settled();W.speed=ok?1:.5;cap(ok?CAP.roomBal2:CAP.roomCatch)},
  draw(){sceneRoom()},
  ctl(){return picks('room','Twice the room, same molecules. Which will drop?',['Splits each second','Joins each second','Neither'],1,st.opened)+`<div class="row"><span class="lab">Room:</span>${[1,2,10,100,1000].map(v=>`<button type="button" class="btn rm${st.room===v?' on':''}" data-v="${v}" aria-pressed="${st.room===v}" ${v>2&&!st.opened?'disabled':''}>${v.toLocaleString()}×</button>`).join('')}</div>`+beatBtn()},
  bind(r){bindPicks(r);bindBeat(r);$$('.rm',r).forEach(b=>b.addEventListener('click',()=>{const v=+b.dataset.v;if(v===2&&st.room!==2&&W.V!==2){st.beat=0;cap(CAP.roomOpen)}else if(v!==2)st.beat=2;st.room=v;st.moveT=st.t;if(v>=2)st.opened=true;W.setV(v<=2?v:2);renderCtl()}))}},
 {part:5,title:'The balance as a picture',cap:CAP.area0,
  alt:'Double the NO₂ and each one has twice as many partners, and twice as many are looking. That is four times the meetings. A square does the same: double the side, four times the area. That is the small ² in the formula.',
  aria:'An orange strip stands for splits and a teal square stands for joins. A scale tips toward the bigger area. When the mixture reacts, the strip shortens and the square grows until the two areas match.',
  enter(){st.a4=40;st.a2=4;st.log=true;this.build()},
  build(){W.setup({n4:st.a4,n2:st.a2,T:ROOM,box:BOX3,sc:4.6,react:false});st.run=false;st.logged=false},
  tick(){const rr0=W.rates(),bg=Math.max(rr0.S,rr0.J,1e-6);if(st.run&&!st.logged&&Math.abs(rr0.S-rr0.J)/bg<.008&&W.t>1.5){st.logged=true;const c4=molar(W.m4),c2=molar(W.m2);S.mixes.push({n4:st.a4,n2:st.a2,q:(c2*c2/c4).toPrecision(2)});save();st.n=(st.n||0)+1;cap(st.n>=2?CAP.area2:CAP.area1);if(st.n>=2)markDone();renderCtl()}},
  draw(){sceneArea()},
  ctl(){const dis=st.run&&!st.logged?'disabled':'';return `<div class="row sl"><label>N₂O₄ to start <input type="range" min="0" max="60" step="1" value="${st.a4}" data-s="a4" ${dis}><output>${st.a4}</output></label><label>NO₂ to start <input type="range" min="0" max="40" step="1" value="${st.a2}" data-s="a2" ${dis}><output>${st.a2}</output></label><button type="button" class="btn primary act" data-run="1" ${st.run?'disabled':''}>Let it react</button>${st.logged?'<button type="button" class="btn" data-new="1">Build another</button>':''}</div>`},
  bind(r){$$('input[type=range]',r).forEach(i=>i.addEventListener('input',()=>{st[i.dataset.s]=+i.value;i.nextElementSibling.textContent=i.value;if(st.a4+st.a2<2){st.a4=Math.max(st.a4,2)}STEPS[10].build();const b=$('[data-run]',r);if(b)b.disabled=false}));
    const b=$('[data-run]',r);b&&b.addEventListener('click',()=>{W.react=true;W.t=0;W.speed=2;st.run=true;st.logged=false;renderCtl()});const n=$('[data-new]',r);n&&n.addEventListener('click',()=>{st.a4=10+Math.floor(Math.random()*20);st.a2=20+Math.floor(Math.random()*18);STEPS[10].build();renderCtl()})}},
 {part:5,title:'Heat changes the rule',cap:CAP.temp0,
  alt:'Adding gas or giving it more room changes the amounts, and the mixture slides back to the same K. Changing the temperature changes K itself. That is why the hot tube and the cold tube settle at different colors.',
  aria:'The same strip and square. Choosing hot water makes the strip much taller, and the square grows to match it. Choosing ice water shrinks both. The value of K changes with temperature.',
  enter(){eqWorld(ROOM,{box:BOX3,sc:4.6});st.tc=25;st.log=false},
  tick(){if(st.changed&&settled())markDone()},draw(){sceneArea()},
  ctl(){return `<div class="row baths"><span class="lab">Temperature:</span>${[[0,'Ice water · 0 °C'],[25,'Room · 25 °C'],[60,'Hot water · 60 °C']].map(([c,l])=>`<button type="button" class="btn bath b${c}${st.tc===c?' on':''}" data-c="${c}" aria-pressed="${st.tc===c}">${l}</button>`).join('')}</div>`},
  bind(r){$$('.bath',r).forEach(b=>b.addEventListener('click',()=>{st.tc=+b.dataset.c;st.changed=true;W.setT(TK(st.tc));W.speed=st.tc===0?2:1;cap(CAP.temp1);renderCtl()}))}},
 {part:6,title:'The hatch opens. Now tell it back.',
  cap:'The team kept clearing the leftover vapor until the sensors read zero. About half an hour later the hatch opened, and both astronauts climbed out. <b>Now you explain what happened.</b>',
  alt:'Start with what the propellant is (N₂O₄, no color). Then say what happens to it when it warms up and spreads out. Use the words split, join and balance.',
  aria:'The capsule on the ship deck with its hatch open. Two astronauts stand beside it and the gas sensor reads zero.',
  draw(){sceneDeck(true,st.t)},wide:true,ctl:tellHTML,bind:tellBind},
];

/* ---------- your turn: order the story, write it, copy it ---------- */
const CARDS=[['Hot water: every hit gets harder','<circle cx="20" cy="20" r="9" fill="currentColor"/><path d="M36 20h18M45 11l9 9-9 9" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>'],
 ['Splits jump ahead of joins','<rect x="6" y="8" width="48" height="10" rx="3" fill="#c96a00"/><rect x="6" y="24" width="14" height="10" rx="3" fill="#0f8b8d"/>'],
 ['NO₂ piles up, so joins climb','<rect x="6" y="8" width="48" height="10" rx="3" fill="#c96a00"/><rect x="6" y="24" width="34" height="10" rx="3" fill="#0f8b8d"/>'],
 ['Splits = joins again: a browner tube','<rect x="6" y="8" width="48" height="10" rx="3" fill="#c96a00"/><rect x="6" y="24" width="48" height="10" rx="3" fill="#0f8b8d"/>']];
const SHUF=[2,0,3,1];
function tellHTML(){const o=S.order,done=o.length===4,right=done&&o.every((v,i)=>v===i);
  return `<div class="tell"><h3>1. Build the story</h3><p class="q">The tube goes into hot water. Tap the four cards in the order things happen.</p>
  <div class="slots">${[0,1,2,3].map(i=>`<button type="button" class="slot${o[i]!==undefined?' full':''}" data-slot="${i}" ${o[i]===undefined?'disabled':''} aria-label="Spot ${i+1}${o[i]!==undefined?': '+CARDS[o[i]][0]+'. Tap to remove.':', empty'}"><span class="n">${i+1}</span>${o[i]!==undefined?`<svg viewBox="0 0 60 42" aria-hidden="true">${CARDS[o[i]][1]}</svg><span>${CARDS[o[i]][0]}</span>`:''}</button>`).join('')}</div>
  <div class="cards">${SHUF.filter(c=>!o.includes(c)).map(c=>`<button type="button" class="cardb" data-card="${c}"><svg viewBox="0 0 60 42" aria-hidden="true">${CARDS[c][1]}</svg><span>${CARDS[c][0]}</span></button>`).join('')}</div>
  <p class="fb ${right?'ok':done?'no':''}" role="status">${right?'That is the chain: a cause, a gap, a catch-up, a new balance.':done?'Not quite. Ask what has to happen first: what does heat change directly? Tap a card to take it back.':''}</p>
  <h3>2. Say it in your own words</h3><p class="q">Why did a propellant with no color show up as a brown, toxic gas? Use the words <b>split</b>, <b>join</b> and <b>balance</b>.</p>
  <textarea id="tx" rows="4" placeholder="Type your explanation here.">${esc(S.text)}</textarea>
  <h3>3. Turn it in</h3><p class="q">If your teacher assigned this, copy your work and paste it into the Canvas text box.</p>
  <div class="row"><label class="nm">Name <input id="nm" type="text" value="${esc(S.name)}" autocomplete="name"></label><button type="button" class="btn primary" id="copy">Copy for Canvas</button><span id="cmsg" role="status"></span></div>
  <div class="world"><h3>Why crews wait</h3><p>In 1975 an Apollo crew breathed this same gas while landing and spent days in the hospital. All three recovered. Today a recovery boat tests the air around the capsule before anyone opens the hatch. Knowing the chemistry is what keeps the next crew safe.</p>
  <p class="src">Sources: NASA Commercial Crew blog and SpaceNews, Aug. 2, 2020; NASA, “45 Years Ago: Apollo Returns Home to End ASTP.”</p>
  <p><a href="https://rjedtech.github.io/Raider-ChemLab/index.html#equilibrium">Try other reactions in the full equilibrium lab</a>, including the one that makes fertilizer for half the world’s food. More stories: <a href="https://rjedtech.github.io/Raider-ChemLab/pressure-story.html">The bag that swells</a> (gas pressure) and <a href="https://rjedtech.github.io/Raider-ChemLab/naming-story.html">One letter apart</a> (how N₂O₄ gets its name).</p></div></div>`}
const esc=s=>String(s||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function tellBind(r){$$('[data-card]',r).forEach(b=>b.addEventListener('click',()=>{S.order.push(+b.dataset.card);if(S.order.length===4){S.tries++;ev('order-'+(S.order.every((v,i)=>v===i)?'right':'wrong'))}save();renderCtl()}));
  $$('[data-slot]',r).forEach(b=>b.addEventListener('click',()=>{S.order.splice(+b.dataset.slot,1);save();renderCtl()}));
  const tx=$('#tx',r),nm=$('#nm',r);tx.addEventListener('input',()=>{S.text=tx.value;save()});nm.addEventListener('input',()=>{S.name=nm.value;try{localStorage.setItem('raider-labs-name',nm.value)}catch(e){}save()});
  $('#copy',r).addEventListener('click',()=>{const g=S.guess,L=['Raider ChemLab · Equilibrium story: The hatch that stayed shut','Name: '+(S.name||'(not given)'),'',
      'Guess 1, tube into hot water: '+(g.heat===undefined?'no guess':['browner','no change','paler'][g.heat]+(g.heat===0?' (matched)':' (the tube got browner)')),
      'Guess 2, did the molecules stop: '+(g.stop===undefined?'no guess':['yes, stopped','no, they keep going'][g.stop]+(g.stop===1?' (matched)':' (they keep going)')),
      'Guess 3, twice the room: '+(g.room===undefined?'no guess':['splits drop','joins drop','neither'][g.room]+(g.room===1?' (matched)':' (joins dropped)')),
      'Mixtures I built: '+(S.mixes.length?S.mixes.slice(-4).map(m=>`${m.n4} N2O4 + ${m.n2} NO2 settled at [NO2]^2/[N2O4] = ${m.q}`).join('; '):'none'),
      'Story order: '+(S.order.length===4?(S.order.every((v,i)=>v===i)?'correct':'not yet correct')+' after '+S.tries+' tr'+(S.tries===1?'y':'ies'):'not finished'),'','In my own words:',S.text||'(nothing written)'].join('\n');
    const ok=()=>{$('#cmsg').textContent='Copied. Paste it into Canvas.'},fb=()=>{const t=document.createElement('textarea');t.value=L;document.body.appendChild(t);t.select();try{document.execCommand('copy');ok()}catch(e){$('#cmsg').textContent='Could not copy. Select your text and copy it by hand.'}t.remove()};
    if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(L).then(ok,fb);else fb();ev('copy')})}

/* ---------- page controls ---------- */
let st0={};
function ev(name){try{const g=window.goatcounter;if(g&&g.count)g.count({path:`story/${SITE}/${EVB}/${name}`,title:EVT,event:true})}catch(e){}}
function cap(html){if(html===lastCap)return;lastCap=html;$('#cap').innerHTML=html;speak()}
function markDone(){$('#next').classList.add('pulse')}
function renderCtl(){const s=STEPS[cur],c=$(s.wide?'#ctlw':'#ctl'),o=$(s.wide?'#ctl':'#ctlw');o.innerHTML='';c.innerHTML=s.ctl?s.ctl.call(s):'';if(s.bind)s.bind.call(s,c)}
function go(i,quiet){i=clamp(i,0,STEPS.length-1);const from=cur;st0=st;st={t:0};cur=i;const s=STEPS[i];lastCap='';paused=false;W.speed=1;
  if(NOWORLD(i)){W.ps=[];W.fl=[]}
  $('#stepno').textContent=`Part ${s.part+1} of ${PARTS.length} · Step ${i+1} of ${STEPS.length}`;$('#ttl').textContent=s.title;cv.setAttribute('aria-label',s.aria||'');
  $('#alt').hidden=true;$('#alt').textContent='';$('#next').classList.remove('pulse');$('#back').disabled=i===0;$('#next').hidden=i===STEPS.length-1;
  $('#pause').textContent='Pause';$('#pause').hidden=!PAUSEOK(i);
  if(s.enter)s.enter.call(s,from);if(s.cap&&!lastCap)cap(s.cap);renderCtl();
  $$('#parts button').forEach((b,k)=>{b.classList.toggle('on',k===s.part);b.setAttribute('aria-current',k===s.part?'step':'false')});
  if(!quiet){try{history.replaceState(null,'','#s'+(i+1))}catch(e){}}
  if(!S.seen[i]){S.seen[i]=1;save();ev('step-'+String(i+1).padStart(2,'0'))}
  document.body.classList.toggle('tellmode',!!s.wide);fit();
  if(!s.ctl)markDone()}
function fit(){const w=cv.clientWidth||LW,d=Math.min(2,window.devicePixelRatio||1);cv.width=Math.round(w*d);cv.height=Math.round(w*LH/LW*d);PX=cv.width/LW}
let lastT=0;
function frame(ts){const dt=Math.min(.05,(ts-lastT)/1000||0);lastT=ts;const s=STEPS[cur];
  if(!paused){st.t+=dt;if(W.ps.length)W.step(dt);if(s.tick)s.tick.call(s,dt)}
  ctx.setTransform(PX,0,0,PX,0,0);ctx.fillStyle=PAL.bg;ctx.fillRect(0,0,LW,LH);s.draw.call(s);requestAnimationFrame(frame)}

// draw a prediction on the graph (step 5)
function pt(e){const r=cv.getBoundingClientRect();return{x:(e.clientX-r.left)/r.width*LW,y:(e.clientY-r.top)/r.height*LH}}
let drawing=false;
cv.addEventListener('pointerdown',e=>{if(cur!==4||!st.g)return;const p=pt(e),g=st.g;if(p.x<g.L-10||p.x>g.L+g.W+10||p.y<g.T-10||p.y>g.T+g.H+10)return;drawing=true;S.sketch=[];S.guess.shape='drawn';cv.setPointerCapture(e.pointerId);addPt(p);e.preventDefault()});
cv.addEventListener('pointermove',e=>{if(drawing)addPt(pt(e))});
['pointerup','pointercancel'].forEach(n=>cv.addEventListener(n,()=>{if(drawing){drawing=false;save()}}));
function addPt(p){const g=st.g,t=clamp((p.x-g.L)/g.W,0,1)*g.span,v=clamp((g.T+g.H-p.y)/g.H,0,1)*g.ymax,a=S.sketch;if(a.length&&t<=a[a.length-1].t+.05)return;a.push({t,v})}

// reading supports (shared across Raider Labs)
const SS=window.speechSynthesis,CAN=!!(SS&&typeof SpeechSynthesisUtterance!=='undefined');
const gk=k=>{try{return localStorage.getItem(k)==='on'}catch(e){return false}},pk=(k,v)=>{try{localStorage.setItem(k,v?'on':'off')}catch(e){}};
let raOn=CAN&&gk('raider-labs-readaloud'),easy=gk('raider-labs-easyread');
/* Read aloud uses only a natural-sounding voice (Raider Labs rule, Nov 18, 2026: robotic voices put students off).
   With no natural voice in this browser, the button shows how to use Microsoft Edge's own Read aloud instead. */
const RLV={v:null,
 pick(){try{const vs=speechSynthesis.getVoices()||[],en=vs.filter(x=>/^en(-|_)?US/i.test(x.lang)),pool=en.length?en:vs.filter(x=>/^en/i.test(x.lang));
   this.v=pool.find(x=>/natural|online|neural|premium|enhanced/i.test(x.name))||null;}catch(e){this.v=null;}return this.v;},
 get(){return this.v||this.pick();},
 how(){let d=document.getElementById('rlv-how');if(!d){d=document.createElement('dialog');d.id='rlv-how';d.setAttribute('aria-labelledby','rlv-h');
   d.style.cssText='max-width:min(540px,92vw);border:0;border-radius:14px;padding:20px 24px;font:16px/1.55 "Segoe UI",system-ui,sans-serif;color:#1c1c1f;background:#fff';
   const edge=/Edg\//.test(navigator.userAgent);
   const steps=[[!edge,'Open this page in Microsoft Edge','Edge has natural-sounding voices built in. Copy the link from the address bar and paste it into Edge.'],
    [1,'Select the words you want to hear','Drag across the text, then right-click it and choose <b>Read aloud selection</b>. To hear the whole page, press <b>Ctrl + Shift + U</b>.'],
    [1,'Pick a natural voice','In the Read aloud bar at the top, click <b>Voice options</b> and choose a voice with <b>Natural</b> in its name.'],
    [1,'Want fewer distractions? Use Immersive Reader','Select the text, right-click, and choose <b>Open in Immersive Reader</b>.']].filter(s=>s[0]);
   d.innerHTML='<h2 id="rlv-h" style="margin:0 0 6px;font-size:20px">Hear it read aloud in Microsoft Edge</h2><p style="margin:0 0 8px">'+(edge?'Edge’s natural voices haven’t loaded yet. Wait a few seconds and try again, or use Edge’s own Read aloud:':'This browser doesn’t have a natural-sounding voice, so use Edge’s Read aloud.')+'</p><ol style="padding-left:22px;margin:8px 0 14px">'+
    steps.map(s=>'<li style="margin:0 0 10px"><b>'+s[1]+'</b><br>'+s[2]+'</li>').join('')+'</ol><button type="button" style="font:inherit;padding:8px 16px;border-radius:9px;border:1px solid #ccc;background:#f3f3f1;cursor:pointer">Got it</button>';
   d.querySelector('button').addEventListener('click',()=>d.close());d.addEventListener('click',e=>{if(e.target===d)d.close();});document.body.appendChild(d);}
  if(d.showModal)d.showModal();else d.setAttribute('open','');}};
if('speechSynthesis' in window){RLV.pick();try{speechSynthesis.addEventListener('voiceschanged',()=>RLV.pick());}catch(e){}}
function speak(){if(!raOn||!CAN)return;const v=RLV.get();if(!v)return;try{SS.cancel();const u=new SpeechSynthesisUtterance($('#ttl').textContent+'. '+$('#cap').textContent.replace(/₂/g,'2').replace(/₄/g,'4').replace(/⇌/g,' both ways ').replace(/→/g,' makes '));u.voice=v;u.lang=v.lang;u.rate=.95;SS.speak(u)}catch(e){}}
function syncSup(){const a=$('#ra'),b=$('#er');a.textContent=raOn?'🔊 Read aloud: on':'🔊 Read aloud';a.setAttribute('aria-pressed',raOn);a.hidden=!CAN;b.textContent=easy?'Aa Easier reading: on':'Aa Easier reading';b.setAttribute('aria-pressed',easy);document.body.classList.toggle('easy',easy)}

function boot(){setPal();if(DARKQ.addEventListener)DARKQ.addEventListener('change',setPal);
  $('#parts').innerHTML=PARTS.map((p,i)=>`<button type="button" data-p="${i}"><span>${i+1}</span>${p}</button>`).join('');
  $$('#parts button').forEach(b=>b.addEventListener('click',()=>go(STEPS.findIndex(s=>s.part===+b.dataset.p))));
  $('#back').addEventListener('click',()=>go(cur-1));$('#next').addEventListener('click',()=>go(cur+1));
  $('#pause').addEventListener('click',()=>{paused=!paused;$('#pause').textContent=paused?'Play':'Pause'});
  $('#conf').addEventListener('click',()=>{const a=$('#alt');a.hidden=false;a.innerHTML='<b>Another way to see it.</b> '+STEPS[cur].alt;ev('confused-step-'+String(cur+1).padStart(2,'0'));try{const g=window.goatcounter;g&&g.count&&g.count({path:`confused/${SITE}/${PAGE}/step-${String(cur+1).padStart(2,'0')}`,event:true})}catch(e){}});
  $('#ra').addEventListener('click',()=>{if(!raOn&&!(CAN&&RLV.get())){RLV.how();return;}raOn=!raOn;pk('raider-labs-readaloud',raOn);syncSup();if(raOn)speak();else if(CAN)SS.cancel()});
  $('#er').addEventListener('click',()=>{easy=!easy;pk('raider-labs-easyread',easy);syncSup()});syncSup();
  document.addEventListener('keydown',e=>{if(/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;if(e.key==='ArrowRight')go(cur+1);else if(e.key==='ArrowLeft')go(cur-1)});
  window.addEventListener('resize',fit);if(window.ResizeObserver)new ResizeObserver(fit).observe(cv);fit();
  const m=/^#s(\d+)/.exec(location.hash);go(m?+m[1]-1:0,true);requestAnimationFrame(frame)}
window.EQ={go,W,get st(){return st},get cur(){return cur},S,STEPS,settled,Kc,kf,eqSplit,molar};
boot();
