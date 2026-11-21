'use strict';
/* ============================================================
   Equilibrium story pilot · Raider ChemLab · RJ Ed Tech
   Part 1 of 2: the model, the molecule box and the drawing kit.
   Model (same data as the current ChemLab equilibrium tool):
     N2O4(g) <=> 2 NO2(g)   Kc = 4.6e-3 at 25 C   dH = +57.2 kJ/mol
     splits per second = kf(T) x N2O4      joins per second = kr x NO2^2 / room
     kr is held constant (joining needs no hard hit); kf = kr x Kc(T).
   ============================================================ */
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)), lerp=(a,b,t)=>a+(b-a)*t;
const ease=t=>{t=clamp(t,0,1);return t*t*(3-2*t)};
const RM=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
const TAU=Math.PI*2;
function gauss(){let u=0,v=0;while(!u)u=Math.random();while(!v)v=Math.random();return Math.sqrt(-2*Math.log(u))*Math.cos(TAU*v)}

/* ---------- chemistry ---------- */
const GAS_R=8.314, KREF=4.6e-3, TREF=298.15, DH=57200, KR=13, NB=1200; // NB = molecules in the box per (mol/L) at room 1
const TK=c=>c+273.15;
const Kc=T=>KREF*Math.exp(-DH/GAS_R*(1/T-1/TREF));
const kf=T=>KR*Kc(T);
// equilibrium for ntot "N2O4 if nothing had split" molecules in room V (1 = the tube)
function eqSplit(T,V,ntot){const c0=ntot/NB/V,K=Kc(T),a=(-K+Math.sqrt(K*K+16*c0*K))/(8*c0);return{a,n4:ntot*(1-a),n2:2*ntot*a}}
// equilibrium reached from any starting mixture (n4, n2 molecules)
function eqFrom(T,V,n4,n2){return eqSplit(T,V,n4+n2/2)}
const molar=n=>n/NB;                          // molecules in the box -> mol/L when the room is 1
const EPS=14.7;                               // Beer's law strength, set so the three baths look like the real demo
const brownAlpha=c=>1-Math.pow(10,-EPS*c);

/* ---------- colors (light and dark) ---------- */
const DARKQ=window.matchMedia?matchMedia('(prefers-color-scheme: dark)'):{matches:false};
let PAL={};
function setPal(){const d=DARKQ.matches;PAL=d?{dark:true,bg:'#191b20',card:'#1d1f24',card2:'#24272d',ink:'#ececef',soft:'#a2a2aa',line:'#353840',
    N:'#5b8cff',O:'#f0556a',brown:[214,140,62],split:'#f2a13c',join:'#4cc9c0',think:'#ec74da',good:'#5cc27f',bad:'#ff8a80',rj:'#ed516a',
    glass:'rgba(190,215,235,.55)',water:'rgba(92,155,255,.20)',box:'#14161a',sky1:'#16233a',sky2:'#2a3550',sea:'#12304a',deck:'#3a3d45',hull:'#e9ecef'}
  :{dark:false,bg:'#f7f8f6',card:'#ffffff',card2:'#f3f3f0',ink:'#1c1c1f',soft:'#5d5d63',line:'#d8d8d3',
    N:'#2f62d6',O:'#d92f45',brown:[150,82,24],split:'#c96a00',join:'#0f8b8d',think:'#a8178f',good:'#1b8a4a',bad:'#b3261e',rj:'#C11430',
    glass:'rgba(110,140,165,.55)',water:'rgba(45,107,210,.13)',box:'#fbfcfb',sky1:'#cfe4f5',sky2:'#f6e9d6',sea:'#3d7fa8',deck:'#8b8f98',hull:'#ffffff'};
  SPR.clear()}
const rgba=(c,a)=>`rgba(${c[0]},${c[1]},${c[2]},${a})`;

/* ---------- text and shapes ---------- */
const FONT='system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif';
function txt(ctx,s,x,y,o={}){ctx.font=`${o.w||500} ${o.s||16}px ${FONT}`;ctx.fillStyle=o.c||PAL.ink;ctx.textAlign=o.a||'left';ctx.textBaseline=o.b||'alphabetic';
  if(o.max&&ctx.measureText(s).width>o.max){ctx.font=`${o.w||500} ${Math.max(11,(o.s||16)*o.max/ctx.measureText(s).width)}px ${FONT}`}
  ctx.fillText(s,x,y);return ctx.measureText(s).width}
function rr(ctx,x,y,w,h,r){r=Math.min(r,w/2,h/2);ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath()}
function card(ctx,r,title){rr(ctx,r.x,r.y,r.w,r.h,12);ctx.fillStyle=PAL.card;ctx.fill();ctx.strokeStyle=PAL.line;ctx.lineWidth=1;ctx.stroke();
  if(title)txt(ctx,title.toUpperCase(),r.x+14,r.y+24,{s:12.5,w:700,c:PAL.soft})}
function pill(ctx,s,x,y,bg,fg,size=14,align='left'){ctx.font=`700 ${size}px ${FONT}`;const w=ctx.measureText(s).width+size*1.3,h=size*1.75;
  const x0=align==='center'?x-w/2:align==='right'?x-w:x;rr(ctx,x0,y-h/2,w,h,h/2);ctx.fillStyle=bg;ctx.fill();
  ctx.fillStyle=fg;ctx.textAlign='left';ctx.textBaseline='middle';ctx.fillText(s,x0+size*.65,y+.5);return w}
function arrow(ctx,x0,y0,x1,y1,w,c){const a=Math.atan2(y1-y0,x1-x0),h=Math.max(7,w*2.6);ctx.strokeStyle=c;ctx.fillStyle=c;ctx.lineWidth=w;ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x1-Math.cos(a)*h*.8,y1-Math.sin(a)*h*.8);ctx.stroke();
  ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x1-Math.cos(a-.42)*h,y1-Math.sin(a-.42)*h);ctx.lineTo(x1-Math.cos(a+.42)*h,y1-Math.sin(a+.42)*h);ctx.closePath();ctx.fill()}

/* ---------- molecules, drawn to shape (positions in angstroms) ----------
   N2O4 is flat: N-N 1.78 A (long and weak), N-O 1.19 A, O-N-O 135 degrees.
   NO2 is bent: N-O 1.20 A, O-N-O 134 degrees. */
const GEO={4:{at:[['N',-.89,0],['N',.89,0],['O',-1.345,-1.10],['O',-1.345,1.10],['O',1.345,-1.10],['O',1.345,1.10]],bd:[[0,1,1],[0,2],[0,3],[1,4],[1,5]]},
           2:{at:[['N',-.313,0],['O',.157,-1.10],['O',.157,1.10]],bd:[[0,1],[0,2]]}};
const RAD={N:.60,O:.56,S:.72,H:.36,C:.62},ACOL=e=>e==='N'?PAL.N:e==='O'?PAL.O:e==='S'?'#c79a00':e==='H'?'#98a1ab':'#4f555e';
GEO.N={at:[['N',-.55,0],['N',.55,0]],bd:[[0,1]]};GEO.O={at:[['O',-.605,0],['O',.605,0]],bd:[[0,1]]};   // N2 (1.10 A) and O2 (1.21 A)
const SP={4:{r:1.95,m:92},2:{r:1.35,m:46},N:{r:1.2,m:28},O:{r:1.2,m:32}};
function ball(ctx,x,y,r,col){const g=ctx.createRadialGradient(x-r*.35,y-r*.4,r*.08,x,y,r);g.addColorStop(0,'#ffffff');g.addColorStop(.28,col);g.addColorStop(1,shade(col,-.38));
  ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill()}
function shade(hex,amt){const n=parseInt(hex.slice(1),16);let r=n>>16,g=n>>8&255,b=n&255;const f=v=>Math.round(clamp(amt<0?v*(1+amt):v+(255-v)*amt,0,255));return`rgb(${f(r)},${f(g)},${f(b)})`}
/* o: {halo:0..1 brown glow, stretch: extra N-N length in A (N2O4 only), tagN: index of the tagged N atom, bonds:true, weak:0..1 highlight on the N-N bond} */
function drawMol(ctx,type,x,y,ang,sc,o={}){const G=GEO[type];ctx.save();ctx.translate(x,y);ctx.rotate(ang);
  const st=(o.stretch||0)/2,px=a=>(a[1]+(type===4?Math.sign(a[1])*st:0))*sc,py=a=>a[2]*sc;
  if(o.halo){const R=2.5*sc,g=ctx.createRadialGradient(0,0,sc*.3,0,0,R);g.addColorStop(0,rgba(PAL.brown,.5*o.halo));g.addColorStop(1,rgba(PAL.brown,0));ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,R,0,TAU);ctx.fill()}
  if(o.bonds){ctx.lineCap='round';G.bd.forEach(b=>{const A=G.at[b[0]],B=G.at[b[1]];ctx.strokeStyle=b[2]?(o.weak?PAL.think:PAL.soft):PAL.soft;ctx.lineWidth=b[2]?sc*.13:sc*.2;
    if(b[2]&&o.snap)return;ctx.beginPath();ctx.moveTo(px(A),py(A));ctx.lineTo(px(B),py(B));ctx.stroke()})}
  G.at.forEach((a,i)=>{const col=a[0]==='N'&&o.tagN===i?PAL.think:ACOL(a[0]);ball(ctx,px(a),py(a),RAD[a[0]]*sc,col)});
  ctx.restore();
  if(o.label){const cs=Math.cos(ang),sn=Math.sin(ang);G.at.forEach(a=>{const ax=px(a),ay=py(a);txt(ctx,a[0],x+ax*cs-ay*sn,y+ax*sn+ay*cs+1,{s:sc*.5,w:700,c:'#fff',a:'center',b:'middle'})})}}
// cached pictures of the small molecules in the box
const SPR=new Map();
function sprite(type,sc){const key=type+'|'+sc;let s=SPR.get(key);if(s)return s;const R=Math.ceil(2.7*sc)+2,c=document.createElement('canvas'),d=2;c.width=c.height=R*2*d;
  const x=c.getContext('2d');x.scale(d,d);drawMol(x,type,R,R,0,sc,{halo:type===2?1:0});s={c,R};SPR.set(key,s);return s}

/* ---------- the molecule box ---------- */
const V0=62;                                   // typical N2O4 speed at 25 C, px per second
class World{
  constructor(){this.ps=[];this.fl=[];this.hist=[];this.marks=[];this.nid=1;this.t=0}
  /* o: {n4,n2,T(kelvin),V,Vmax,box:{x,y,w,h},sc,react,speed} ; box.w is the width when room = Vmax */
  setup(o){Object.assign(this,{T:o.T,V:o.V||1,Vt:o.V||1,Vmax:o.Vmax||1,box:o.box,sc:o.sc||5,react:o.react!==false,speed:o.speed||1,
      m4:o.n4,m2:o.n2,accS:0,accJ:0,thrS:1,thrJ:1,pendS:0,pendJ:0,waitS:0,waitJ:0,t:0,hT:0,sync:0,nS:0,nJ:0,tag:null,tagHist:[]});
    this.ps=[];this.fl=[];this.hist=[];this.marks=[];
    const p4=Math.round(o.n4),p2=Math.max(0,Math.round(2*o.n4+o.n2-2*p4));   // whole molecules, same number of atoms
    for(let i=0;i<p4;i++)this.add(4);for(let i=0;i<p2;i++)this.add(2);this.push();return this}
  get x1(){return this.box.x+this.box.w*this.V/this.Vmax}
  get r4(){return this.sc*1.95} get r2(){return this.sc*1.35}
  rad(t){return this.sc*SP[t].r}
  vth(type){return V0*Math.sqrt(this.T/TREF)*Math.sqrt(92/SP[type].m)*(this.vk||1)}
  add(type,x,y,vx,vy,ang,ns){const b=this.box,r=this.rad(type),s=this.vth(type)/1.25;
    const p={id:this.nid++,type,x:x!==undefined?x:b.x+r+Math.random()*(this.x1-b.x-2*r),y:y!==undefined?y:b.y+r+Math.random()*(b.h-2*r),
      vx:vx!==undefined?vx:gauss()*s,vy:vy!==undefined?vy:gauss()*s,ang:ang!==undefined?ang:Math.random()*TAU,spin:(Math.random()-.5)*3,
      ns:ns||(type===2?[this.nid++]:[this.nid++,this.nid++]),born:this.t,home:0};this.ps.push(p);return p}
  count(type){let n=0;for(const p of this.ps)if(p.type===type)n++;return n}
  rates(){return{S:kf(this.T)*this.m4,J:KR/NB*this.m2*this.m2/this.V}}
  setT(T,label){if(T===this.T)return;const f=Math.sqrt(T/this.T);for(const p of this.ps){p.vx*=f;p.vy*=f}this.T=T;if(label)this.marks.push({t:this.t,label})}
  setV(V,label){this.Vt=V;if(label)this.marks.push({t:this.t,label})}
  push(){const r=this.rates();this.hist.push({t:this.t,m2:this.m2,m4:this.m4,S:r.S,J:r.J});if(this.hist.length>900)this.hist.shift();
    if(this.tag){const p=this.ps.find(q=>q.ns.includes(this.tag));this.tagHist.push(p?p.type:4);if(this.tagHist.length>400)this.tagHist.shift()}}
  flash(kind,x,y){this.fl.push({kind,x,y,t:this.t});if(kind==='s')this.nS++;else if(kind==='j')this.nJ++}
  split(p,hx,hy){const i=this.ps.indexOf(p);if(i<0)return;this.ps.splice(i,1);const c=Math.cos(p.ang),s=Math.sin(p.ang),d=.9*this.sc,u=this.vth(2)*.6;
    const a=this.add(2,p.x-c*d,p.y-s*d,p.vx-c*u,p.vy-s*u,p.ang+Math.PI,[p.ns[0]]),b=this.add(2,p.x+c*d,p.y+s*d,p.vx+c*u,p.vy+s*u,p.ang,[p.ns[1]]);
    a.spin=p.spin;b.spin=p.spin;this.flash('s',hx!==undefined?hx:p.x,hy!==undefined?hy:p.y);this.pendS--;this.waitS=0}
  join(a,b){const i=this.ps.indexOf(a);if(i>=0)this.ps.splice(i,1);const j=this.ps.indexOf(b);if(j>=0)this.ps.splice(j,1);
    const x=(a.x+b.x)/2,y=(a.y+b.y)/2;let vx=(a.vx+b.vx)/2,vy=(a.vy+b.vy)/2;const sp=Math.hypot(vx,vy)||1,want=this.vth(4)*(.6+Math.random()*.8);vx*=want/sp;vy*=want/sp;
    this.add(4,x,y,vx,vy,Math.atan2(b.y-a.y,b.x-a.x),[a.ns[0],b.ns[0]]);this.flash('j',x,y)}
  step(dtReal){let dt=Math.min(dtReal,.05)*this.speed;if(dt<=0)return;
    // room (the wall slides)
    if(this.V!==this.Vt){const dv=1.1*Math.min(dtReal,.05);const V1=Math.abs(this.Vt-this.V)<=dv?this.Vt:this.V+Math.sign(this.Vt-this.V)*dv,f=V1/this.V;for(const p of this.ps)p.x=this.box.x+(p.x-this.box.x)*f;this.V=V1}   // the gas spreads with the wall
    // amounts, by the rate laws
    if(this.react){const n=Math.ceil(dt/.004),h=dt/n,k=kf(this.T),q=KR/NB/this.V;for(let i=0;i<n;i++){const S=k*this.m4,J=q*this.m2*this.m2;
        this.m4+=(J-S)*h;this.m2+=2*(S-J)*h;if(this.m4<0)this.m4=0;if(this.m2<0)this.m2=0;this.accS+=S*h;this.accJ+=J*h}
      this.fast=k*this.m4+q*this.m2*this.m2>10;                                              // busy: do due events at once
      while(this.accS>=this.thrS){this.accS-=1;this.thrS=.55+Math.random()*.9;this.pendS++}
      while(this.accJ>=this.thrJ){this.accJ-=1;this.thrJ=.55+Math.random()*.9;this.pendJ++}
      this.sync+=dt;if(this.sync>.35){this.sync=0;const hom=this.ps.filter(p=>p.home).length/2,err=this.count(4)+hom+this.pendJ-this.pendS-this.m4;
        if(err>1.2)this.pendS++;else if(err<-1.2)this.pendJ++}}
    // molecules move, bounce, and react when they collide
    const m=Math.ceil(dt/.03),h=dt/m;for(let i=0;i<m;i++)this.move(h);
    this.t+=dt;this.hT+=dt;if(this.hT>=.1){this.hT=0;this.push()}
    this.fl=this.fl.filter(f=>this.t-f.t<.6)}
  move(h){const b=this.box,x1=this.x1,ps=this.ps,young=.22;
    for(const p of ps){if(p.home){const q=ps.find(z=>z.id===p.home);if(!q){p.home=0}else{const dx=q.x-p.x,dy=q.y-p.y,d=Math.hypot(dx,dy)||1,v=this.vth(2)*2.4;p.vx=lerp(p.vx,dx/d*v,.3);p.vy=lerp(p.vy,dy/d*v,.3)}}
      p.x+=p.vx*h;p.y+=p.vy*h;p.ang+=p.spin*h;const r=this.rad(p.type);
      if(p.x<b.x+r){p.x=b.x+r;p.vx=Math.abs(p.vx);this.hitL&&this.hitL(p)}
      if(p.x>x1-r){if(p.leave){if(p.x>x1+24)p.dead=true}else{p.x=x1-r;p.vx=-Math.abs(p.vx);this.hitR&&this.hitR(p)}}
      if(p.y<b.y+r){p.y=b.y+r;p.vy=Math.abs(p.vy)}if(p.y>b.y+b.h-r){p.y=b.y+b.h-r;p.vy=-Math.abs(p.vy)}
      const sp=Math.hypot(p.vx,p.vy),vt=this.vth(p.type);if(sp>2.6*vt){p.vx*=.9;p.vy*=.9}else if(sp<.25*vt){p.vx=p.vx*1.1+gauss()*2;p.vy=p.vy*1.1+gauss()*2}}
    for(let i=0;i<ps.length;i++){const a=ps[i];for(let j=i+1;j<ps.length;j++){const c=ps[j],dx=c.x-a.x,dy=c.y-a.y,R=this.rad(a.type)+this.rad(c.type);
        if(dx*dx+dy*dy>R*R)continue;const d=Math.hypot(dx,dy)||.01,nx=dx/d,ny=dy/d,rv=(c.vx-a.vx)*nx+(c.vy-a.vy)*ny;
        if(a.home&&a.home===c.id){this.join(a,c);i--;break}
        if(rv>0)continue;
        if(this.react&&this.pendJ>0&&a.type===2&&c.type===2&&!a.home&&!c.home&&this.t-a.born>young&&this.t-c.born>young){this.pendJ--;this.waitJ=0;this.join(a,c);i--;break}
        if(this.react&&this.pendS>0&&(a.type===4||c.type===4)){const p=a.type===4&&this.t-a.born>young?a:(c.type===4&&this.t-c.born>young?c:null);
          if(p){this.flash('h',a.x+nx*this.rad(a.type),a.y+ny*this.rad(a.type));this.split(p);i--;break}}
        const ma=SP[a.type].m,mc=SP[c.type].m,imp=2*rv/(ma+mc);a.vx+=imp*mc*nx;a.vy+=imp*mc*ny;c.vx-=imp*ma*nx;c.vy-=imp*ma*ny;
        const ov=(R-d)/2;a.x-=nx*ov;a.y-=ny*ov;c.x+=nx*ov;c.y+=ny*ov}}
    if(ps.some(p=>p.dead))this.ps=ps.filter(p=>!p.dead);
    if(!this.react)return;
    // events that are due but found no collision yet
    if(this.pendS>0){this.waitS+=h;let guard=8;while(this.pendS>0&&(this.fast||this.waitS>.18||this.pendS>2)&&guard--){const c=ps.filter(p=>p.type===4);if(!c.length){this.pendS=0;break}
        this.split(c[Math.floor(Math.random()*c.length)])}}
    if(this.pendJ>0){this.waitJ+=h;let guard=8;while(this.pendJ>0&&(this.fast||this.waitJ>.12||this.pendJ>2)&&guard--){const f=ps.filter(p=>p.type===2&&!p.home&&this.t-p.born>young*.5);
        if(f.length<2){if(ps.filter(p=>p.type===2).length<2)this.pendJ=0;break}
        let best=1e9,A=null,B=null;for(let i=0;i<f.length;i++)for(let j=i+1;j<f.length;j++){const d=(f[i].x-f[j].x)**2+(f[i].y-f[j].y)**2;if(d<best){best=d;A=f[i];B=f[j]}}
        this.pendJ--;this.waitJ=0;if(this.fast||this.pendJ>1||best<(this.r2*4)**2)this.join(A,B);else{A.home=B.id;B.home=A.id}}}
  }
  /* draw the box. o: {tagRing:true, dim:0..1, frozen:true} */
  draw(ctx,o={}){const b=this.box,x1=this.x1,full=b.x+b.w;
    if(!o.noFrame){rr(ctx,b.x,b.y,b.w,b.h,8);ctx.fillStyle=PAL.card2;ctx.fill()}
    ctx.save();rr(ctx,b.x,b.y,x1-b.x+(o.noFrame?30:0),b.h,8);if(!o.noFrame){ctx.fillStyle=PAL.box;ctx.fill()}ctx.clip();
    const rt=this.rates(),busy=clamp((rt.S+rt.J)/16,0,1),fk=(1-.55*busy)*this.sc/6;                // smaller rings when a lot is happening
    for(const f of this.fl){const u=(this.t-f.t)/(.6-.25*busy);if(u<0||u>1)continue;ctx.lineWidth=2.5;
      if(f.kind==='s'){ctx.strokeStyle=PAL.split;ctx.globalAlpha=1-u;ctx.beginPath();ctx.arc(f.x,f.y,(RM?14:6+26*u)*fk,0,TAU);ctx.stroke()}
      else if(f.kind==='j'){ctx.strokeStyle=PAL.join;ctx.globalAlpha=1-u;ctx.beginPath();ctx.arc(f.x,f.y,(RM?14:30-22*u)*fk,0,TAU);ctx.stroke()}
      else{ctx.strokeStyle=f.col||PAL.split;ctx.globalAlpha=1-u;const n=6;for(let i=0;i<n;i++){const a=i*TAU/n+.3;ctx.beginPath();ctx.moveTo(f.x+Math.cos(a)*4,f.y+Math.sin(a)*4);ctx.lineTo(f.x+Math.cos(a)*(8+10*u),f.y+Math.sin(a)*(8+10*u));ctx.stroke()}}
      ctx.globalAlpha=1}
    for(const p of this.ps){const s=sprite(p.type,this.sc),pop=RM?1:Math.min(1,.55+(this.t-p.born)*3);ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.ang);if(pop<1)ctx.scale(pop,pop);ctx.drawImage(s.c,-s.R,-s.R,s.R*2,s.R*2);ctx.restore()}
    if(this.tag){const p=this.ps.find(q=>q.ns.includes(this.tag));if(p){const i=p.ns.indexOf(this.tag);drawMol(ctx,p.type,p.x,p.y,p.ang,this.sc,{tagN:p.type===4?i:0,halo:p.type===2?1:0});
        ctx.strokeStyle=PAL.think;ctx.lineWidth=3;ctx.setLineDash([6,4]);ctx.beginPath();ctx.arc(p.x,p.y,this.rad(p.type)+9,0,TAU);ctx.stroke();ctx.setLineDash([])}}
    ctx.restore();if(o.noFrame)return;
    rr(ctx,b.x,b.y,x1-b.x,b.h,8);ctx.strokeStyle=PAL.dark?'#5d6370':'#8a94a0';ctx.lineWidth=2;ctx.stroke();
    if(this.Vmax>1){ // the sliding wall, with its handle
      ctx.fillStyle=PAL.dark?'#7b8290':'#6f7783';rr(ctx,x1-3,b.y-6,8,b.h+12,3);ctx.fill();
      if(x1<full-12){ctx.setLineDash([5,5]);ctx.strokeStyle=PAL.line;ctx.lineWidth=1.5;rr(ctx,x1+6,b.y,full-x1-6,b.h,8);ctx.stroke();ctx.setLineDash([]);
        if(full-x1>120)txt(ctx,'empty room',(x1+full)/2+3,b.y+b.h/2,{s:15,c:PAL.soft,a:'center',b:'middle'})}}
  }
}

/* ---------- shared pictures ---------- */
// two rate bars; each bar is one half of the equation
function drawRates(ctx,r,S,J,max,o={}){card(ctx,r,o.title||'Each second, in the box');
  const x=r.x+14,w=r.w-28,rowH=(r.h-78)/2,row=(y,name,eq,v,col,ic)=>{
    txt(ctx,name,x+26,y+17,{s:17,w:700});txt(ctx,eq,x+w,y+17,{s:14.5,c:PAL.soft,a:'right'});
    // icon: one dot becomes two, or two become one
    ctx.fillStyle=col;if(ic==='s'){ctx.beginPath();ctx.arc(x+9,y+11,6,0,TAU);ctx.fill()}else{ctx.beginPath();ctx.arc(x+5,y+11,4.4,0,TAU);ctx.arc(x+15,y+11,4.4,0,TAU);ctx.fill()}
    const bw=w-64,by=y+27,bh=Math.max(14,rowH-40);rr(ctx,x,by,bw,bh,5);ctx.fillStyle=PAL.card2;ctx.fill();
    const f=clamp(v/max,0,1);if(f>.004){rr(ctx,x,by,Math.max(5,bw*f),bh,5);ctx.fillStyle=col;ctx.fill()}
    txt(ctx,v>=9.95?v.toFixed(0):v.toFixed(1),x+w,by+bh/2+1,{s:19,w:700,a:'right',b:'middle'});return{by,bh,bw,f}};
  const a=row(r.y+36,'Splits','N₂O₄ → 2 NO₂',S,PAL.split,'s'),b=row(r.y+36+rowH,'Joins','2 NO₂ → N₂O₄',J,PAL.join,'j');
  const big=Math.max(S,J),d=big>0?(S-J)/big:0,yy=r.y+r.h-17;
  if(o.status!==false){if(big<.05)txt(ctx,'Nothing is reacting yet',x,yy,{s:15,c:PAL.soft,w:600,max:w});
    else if(d>.07){txt(ctx,'More splits than joins: NO₂ builds up',x,yy,{s:15,c:PAL.split,w:700,max:w})}
    else if(d<-.07){txt(ctx,'More joins than splits: NO₂ runs down',x,yy,{s:15,c:PAL.join,w:700,max:w})}
    else txt(ctx,'Balanced: splits = joins',x,yy,{s:15,c:PAL.good,w:700,max:w})}
  if(Math.abs(d)>.07&&big>.05){ // hatch the part of the longer bar that is ahead: the gap
    const A=S>J?a:b,lo=x+a.bw*Math.min(a.f,b.f),hi=x+a.bw*Math.max(a.f,b.f);if(hi-lo>8){ctx.save();rr(ctx,lo,A.by,hi-lo,A.bh,5);ctx.clip();ctx.strokeStyle='rgba(255,255,255,.5)';ctx.lineWidth=3;
      for(let xx=lo-A.bh;xx<hi;xx+=10){ctx.beginPath();ctx.moveTo(xx,A.by+A.bh);ctx.lineTo(xx+A.bh,A.by);ctx.stroke()}ctx.restore();
      if(hi-lo>70){ctx.font=`700 13px ${FONT}`;const tw=ctx.measureText('ahead').width+14;rr(ctx,(lo+hi)/2-tw/2,A.by+A.bh/2-10,tw,20,10);ctx.fillStyle=PAL.card;ctx.fill();txt(ctx,'ahead',(lo+hi)/2,A.by+A.bh/2+1,{s:13,w:700,a:'center',b:'middle'})}}}}

// NO2 count against time. o: {ymax,span,sketch:[{t,v}],sketching,title}
function drawGraph(ctx,r,w,o={}){card(ctx,r,o.title||'NO₂ in the box');
  const L=r.x+44,T=r.y+38,W=r.w-60,H=r.h-72,ymax=o.ymax||40,span=o.span||12,t1=Math.max(span,w.t),t0=t1-span,X=t=>L+(t-t0)/span*W,Y=v=>T+H-clamp(v/ymax,0,1.04)*H;
  ctx.strokeStyle=PAL.line;ctx.lineWidth=1;for(let i=0;i<=4;i++){const y=T+H-i*H/4;ctx.beginPath();ctx.moveTo(L,y);ctx.lineTo(L+W,y);ctx.stroke();txt(ctx,String(Math.round(ymax*i/4)),L-7,y,{s:13,c:PAL.soft,a:'right',b:'middle'})}
  txt(ctx,'time →',L+W,T+H+21,{s:13,c:PAL.soft,a:'right'});
  ctx.save();ctx.beginPath();ctx.rect(L-1,T-6,W+2,H+12);ctx.clip();
  for(const m of w.marks){if(m.t<t0)continue;const x=X(m.t);ctx.strokeStyle=PAL.soft;ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(x,T);ctx.lineTo(x,T+H);ctx.stroke();ctx.setLineDash([]);
    txt(ctx,m.label,Math.min(x+5,L+W-80),T+13,{s:12.5,c:PAL.soft,w:600})}
  if(o.sketch&&o.sketch.length>1){ctx.strokeStyle=PAL.think;ctx.lineWidth=3;ctx.setLineDash([7,6]);ctx.lineJoin='round';ctx.beginPath();o.sketch.forEach((p,i)=>{const x=X(p.t),y=Y(p.v);i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.stroke();ctx.setLineDash([])}
  if(w.hist.length>1){ctx.strokeStyle=rgba(PAL.brown,1);ctx.lineWidth=3.5;ctx.lineJoin='round';ctx.beginPath();let st=false;for(const p of w.hist){if(p.t<t0-.2)continue;const x=X(p.t),y=Y(p.m2);st?ctx.lineTo(x,y):ctx.moveTo(x,y);st=true}ctx.stroke();
    const p=w.hist[w.hist.length-1];ctx.fillStyle=rgba(PAL.brown,1);ctx.beginPath();ctx.arc(X(p.t),Y(p.m2),5,0,TAU);ctx.fill()}
  ctx.restore();
  if(o.sketching){ctx.strokeStyle=PAL.think;ctx.lineWidth=2;ctx.setLineDash([6,5]);rr(ctx,L-2,T-4,W+4,H+8,6);ctx.stroke();ctx.setLineDash([]);
    if(!(o.sketch&&o.sketch.length>1))txt(ctx,'Draw your line here',L+W/2,T+H/2,{s:17,w:700,c:PAL.think,a:'center',b:'middle'})}
  if(o.sketch&&o.sketch.length>1&&!o.sketching){ctx.strokeStyle=PAL.think;ctx.lineWidth=3;ctx.setLineDash([7,6]);ctx.beginPath();ctx.moveTo(r.x+r.w-150,r.y+19);ctx.lineTo(r.x+r.w-122,r.y+19);ctx.stroke();ctx.setLineDash([]);txt(ctx,'your guess',r.x+r.w-116,r.y+24,{s:13,c:PAL.think,w:700})}
  return{L,T,W,H,ymax,span,t0}}

// the sealed tube in its bath. bathC: 0, 25 or 60; cNO2 in mol/L; lift: 0..1 (tube raised while it changes bath)
function drawTube(ctx,r,bathC,cNO2,lift,t){card(ctx,r,'What you see');
  const cx=r.x+r.w/2,bw=r.w-44,bx=cx-bw/2,btop=r.y+r.h*.50,bbot=r.y+r.h-66,wl=btop+26;
  // beaker
  const hot=bathC>=45,ice=bathC<=5;ctx.fillStyle=hot?(PAL.dark?'rgba(255,150,110,.16)':'rgba(240,120,80,.14)'):PAL.water;rr(ctx,bx+3,wl,bw-6,bbot-wl-3,6);ctx.fill();
  if(ice){ctx.fillStyle=PAL.dark?'rgba(210,235,255,.5)':'rgba(255,255,255,.95)';ctx.strokeStyle=PAL.dark?'rgba(210,235,255,.7)':'rgba(120,160,200,.8)';ctx.lineWidth=1.2;
    [[.14,10,.2],[.52,4,-.3],[.74,14,.5],[.3,40,-.15],[.66,46,.25],[.1,66,.1]].forEach(([fx,dy,a])=>{ctx.save();ctx.translate(bx+10+fx*(bw-40)+10,wl+dy+8);ctx.rotate(a);rr(ctx,-10,-9,21,18,4);ctx.fill();ctx.stroke();ctx.restore()})}
  if(hot&&!RM){ctx.strokeStyle=PAL.dark?'rgba(255,255,255,.28)':'rgba(120,120,130,.4)';ctx.lineWidth=2;ctx.lineCap='round';for(let i=0;i<3;i++){const x=bx+bw*.2+i*bw*.28,ph=(t*.7+i*.37)%1;ctx.globalAlpha=1-ph;ctx.beginPath();
      for(let s=0;s<=10;s++){const y=wl-4-ph*26-s*3.2,xx=x+Math.sin(s*.8+t*2+i)*4;s?ctx.lineTo(xx,y):ctx.moveTo(xx,y)}ctx.stroke()}ctx.globalAlpha=1}
  // tube
  const tw=44,th=r.h*.56,ty=wl-th*.52-lift*46,tx=cx-tw/2-10;
  ctx.fillStyle=PAL.box;rr(ctx,tx,ty,tw,th,tw/2);ctx.fill();const al=brownAlpha(cNO2);ctx.fillStyle=rgba(PAL.brown,clamp(al*1.05,0,.96));rr(ctx,tx+2,ty+2,tw-4,th-4,tw/2-2);ctx.fill();
  ctx.strokeStyle=PAL.glass;ctx.lineWidth=2.5;rr(ctx,tx,ty,tw,th,tw/2);ctx.stroke();ctx.strokeStyle='rgba(255,255,255,.55)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(tx+10,ty+24);ctx.lineTo(tx+10,ty+th-28);ctx.stroke();
  txt(ctx,'sealed',tx+tw/2,ty-8,{s:12.5,c:PAL.soft,a:'center'});
  // beaker glass on top, thermometer
  ctx.strokeStyle=PAL.glass;ctx.lineWidth=3;ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(bx,btop);ctx.lineTo(bx,bbot-8);ctx.quadraticCurveTo(bx,bbot,bx+8,bbot);ctx.lineTo(bx+bw-8,bbot);ctx.quadraticCurveTo(bx+bw,bbot,bx+bw,bbot-8);ctx.lineTo(bx+bw,btop);ctx.stroke();
  const mx=bx+bw-24,my0=btop-52,my1=bbot-22;ctx.strokeStyle=PAL.glass;ctx.lineWidth=7;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(mx,my0);ctx.lineTo(mx,my1);ctx.stroke();
  const lv=lerp(my1-10,my0+6,clamp(bathC/100,0,1));ctx.strokeStyle='#d92f45';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(mx,my1);ctx.lineTo(mx,lv);ctx.stroke();ctx.fillStyle='#d92f45';ctx.beginPath();ctx.arc(mx,my1+2,6,0,TAU);ctx.fill();
  const name=ice?'Ice water':hot?'Hot water':'Room';pill(ctx,`${name} · ${bathC} °C`,cx,bbot+24,ice?'#2d6bd2':hot?'#c5471f':PAL.soft,'#fff',14,'center');
  const shade=al<.05?'none':al<.25?'very pale':al<.5?'light brown':al<.68?'brown':'dark brown';txt(ctx,'Gas color: '+shade,cx,bbot+52,{s:14.5,w:600,a:'center',max:r.w-16});
  return{tx:tx+tw,ty:ty+th*.3}}

/* two bars that compete. rows: [{name,sub,v,col},{...}] ; o: {title,max,unit,dec,status:{more0,more1,bal}} */
function drawPair(ctx,r,rows,o={}){card(ctx,r,o.title);const x=r.x+14,w=r.w-28,rowH=(r.h-80)/2,max=o.max||100,out=[];
  rows.forEach((q,i)=>{const y=r.y+36+i*rowH;ctx.fillStyle=q.col;ctx.beginPath();ctx.arc(x+8,y+11,6,0,TAU);ctx.fill();txt(ctx,q.name,x+22,y+17,{s:16.5,w:700,max:w-22});
    const bw=w-66,by=y+27,bh=Math.max(14,Math.min(34,rowH-42));rr(ctx,x,by,bw,bh,5);ctx.fillStyle=PAL.card2;ctx.fill();const f=clamp(q.v/max,0,1);if(f>.004){rr(ctx,x,by,Math.max(5,bw*f),bh,5);ctx.fillStyle=q.col;ctx.fill()}
    txt(ctx,q.v.toFixed(o.dec===undefined?0:o.dec),x+w,by+bh/2+1,{s:19,w:700,a:'right',b:'middle'});if(q.sub)txt(ctx,q.sub,x,by+bh+16,{s:13,c:PAL.soft,max:w});out.push({by,bh,bw,f})});
  const a=rows[0].v,b=rows[1].v,big=Math.max(a,b,1e-9),d=(a-b)/big,yy=r.y+r.h-16,s=o.status||{};
  if(Math.abs(d)>.03){const A=a>b?out[0]:out[1],lo=x+A.bw*Math.min(out[0].f,out[1].f),hi=x+A.bw*Math.max(out[0].f,out[1].f);if(hi-lo>6){ctx.save();rr(ctx,lo,A.by,hi-lo,A.bh,5);ctx.clip();ctx.strokeStyle='rgba(255,255,255,.5)';ctx.lineWidth=3;
      for(let xx=lo-A.bh;xx<hi;xx+=10){ctx.beginPath();ctx.moveTo(xx,A.by+A.bh);ctx.lineTo(xx+A.bh,A.by);ctx.stroke()}ctx.restore()}
    txt(ctx,d>0?s.more0:s.more1,x,yy,{s:14.5,w:700,c:d>0?rows[0].col:rows[1].col,max:w})}
  else if(s.bal)txt(ctx,s.bal,x,yy,{s:14.5,w:700,c:PAL.good,max:w});
  if(o.unit)txt(ctx,o.unit,r.x+r.w-14,r.y+24,{s:12.5,c:PAL.soft,a:'right'})}
