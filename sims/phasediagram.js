(function(){
'use strict';
const {clamp,lerp,rng,randn,rr,txt,pill,atLeast,PAL,FONT,RM}=BioLab.h;
const CL=window.ChemLab;
/* Phase diagrams of water and carbon dioxide on a log-pressure axis, drawn from real data.
   Water: Antoine vapor pressure (scaled smoothly to the 217.7 atm critical point), Clausius–Clapeyron sublimation
   with ΔH_sub = 51.06 kJ/mol, and the ice I melting curve (−0.0074 °C/atm). CO₂: Clausius–Clapeyron lines through
   the triple point (−56.6 °C, 5.11 atm), the sublimation point (−78.5 °C, 1 atm) and the critical point (31.0 °C, 72.8 atm). */
const RG=8.314;
function antoine(T){return Math.pow(10,T<=99?8.07131-1730.63/(233.426+T):8.14019-1810.94/(244.485+T))/760;}
const W={id:'water',l:'Water',f:'H₂O',Ttp:0.01,Tc:373.95,Pc:217.7,Tmin:-60,Tmax:420,lpMin:-4,lpMax:4,dHsub:51.06,dHvap:40.7,dHfus:6.01,dV:-1.63,Ttick:100,
  Tnm:0,Tnb:100};
W.Ptp=antoine(W.Ttp);const WfC=W.Pc/antoine(W.Tc)-1;
W.pvap=T=>{const a=antoine(T);if(T<=100)return a;const u=(T-100)/(W.Tc-100);return a*(1+WfC*u*u);};
W.psub=T=>W.Ptp*Math.exp(-(W.dHsub*1000/RG)*(1/(T+273.15)-1/(W.Ttp+273.15)));
W.tm=P=>{const d=Math.max(0,P-W.Ptp);return W.Ttp-0.0074*d-1.75e-6*d*d;};
const C={id:'co2',l:'Carbon dioxide',f:'CO₂',Ttp:-56.56,Ptp:5.11,Tc:31.04,Pc:72.8,Tmin:-120,Tmax:60,lpMin:-2,lpMax:4,dHsub:26.1,dHvap:16.6,dHfus:9.02,dV:9.1,Ttick:40,Tnm:null,Tnb:null};
const Bv=Math.log(C.Pc/C.Ptp)/(1/(C.Ttp+273.15)-1/(C.Tc+273.15)),Bs=Math.log(C.Ptp/1)/(1/194.65-1/(C.Ttp+273.15));
C.pvap=T=>C.Ptp*Math.exp(-Bv*(1/(T+273.15)-1/(C.Ttp+273.15)));
C.psub=T=>C.Ptp*Math.exp(-Bs*(1/(T+273.15)-1/(C.Ttp+273.15)));
C.tm=P=>C.Ttp+Math.max(0,P-C.Ptp)/45;
const SUB={water:W,co2:C};
const sb=sim=>SUB[sim.p.sub];
const tKey=s=>s.id==='water'?'Tw':'Tc2',pKey=s=>s.id==='water'?'lpw':'lpc';
const getT=sim=>sim.p[tKey(sb(sim))],getLP=sim=>sim.p[pKey(sb(sim))],getP=sim=>Math.pow(10,getLP(sim));
// boiling and melting temperatures at a pressure (bisection on the curves)
function invert(f,P,a,b){let lo=a,hi=b;for(let i=0;i<60;i++){const m=(lo+hi)/2;if(f(m)<P)lo=m;else hi=m;}return (lo+hi)/2;}
const tBoil=(s,P)=>P>s.Ptp&&P<s.Pc?invert(s.pvap,P,s.Ttp,s.Tc):NaN;
const tSub=(s,P)=>P<s.Ptp?invert(s.psub,P,-273,s.Ttp):NaN;
function phase(s,T,P){if(T>=s.Tc&&P>=s.Pc)return 'sc';if(P<s.Ptp)return T<tSub(s,P)?'s':'g';if(T<s.tm(P))return 's';if(T>=s.Tc)return 'g';return P>s.pvap(T)?'l':'g';}
const PH_L={s:'Solid',l:'Liquid',g:'Gas',sc:'Supercritical fluid'};

/* ---------- diagram geometry ---------- */
const DL=86,DT=28,DW=396,DH=356;
const XT=(s,T)=>DL+(T-s.Tmin)/(s.Tmax-s.Tmin)*DW,YP=(s,lp)=>DT+DH-(lp-s.lpMin)/(s.lpMax-s.lpMin)*DH;
const TX=(s,x)=>s.Tmin+(x-DL)/DW*(s.Tmax-s.Tmin),LPY=(s,y)=>s.lpMin+(DT+DH-y)/DH*(s.lpMax-s.lpMin);
function onLine(s,T,P){const x=XT(s,T),y=YP(s,Math.log10(P)),tx=XT(s,s.Ttp),ty=YP(s,Math.log10(s.Ptp));
  if(Math.hypot(x-tx,y-ty)<7)return 'tp';
  if(P>=s.Ptp&&Math.abs(x-XT(s,s.tm(P)))<4)return 'sl';
  if(T>=s.Ttp&&T<=s.Tc&&Math.abs(y-YP(s,Math.log10(s.pvap(T))))<4)return 'lg';
  if(T<=s.Ttp&&Math.abs(y-YP(s,Math.log10(s.psub(T))))<4)return 'sg';return null;}
const LINE_L={tp:'Triple point: solid + liquid + gas',sl:'On the melting line: solid + liquid',lg:'On the boiling line: liquid + gas',sg:'On the sublimation line: solid + gas'};
function phaseNow(sim){const s=sb(sim),T=getT(sim),P=getP(sim),ln=onLine(s,T,P);return ln||phase(s,T,P);}
const TRANS={'s>l':'Melting','l>s':'Freezing','l>g':'Boiling (vaporization)','g>l':'Condensation','s>g':'Sublimation','g>s':'Deposition',
  'l>sc':'Becomes a supercritical fluid','g>sc':'Becomes a supercritical fluid','sc>l':'Supercritical fluid becomes a liquid','sc>g':'Supercritical fluid becomes a gas'};
const fmtP=P=>(P>=1000?Math.round(P).toLocaleString('en-US'):CL.toSig(P,3))+' atm';
const fmtT=T=>T.toFixed(Math.abs(T)<10?2:1)+' °C';

/* ---------- paths ---------- */
const SCENES={
  denver:{l:'Boil water in Aurora or Denver (0.83 atm)',sub:'water',T:20,P:0.83,run:'heat'},
  cooker:{l:'Pressure cooker (2.0 atm)',sub:'water',T:20,P:2,run:'heat'},
  dryice:{l:'Dry ice warming at 1 atm',sub:'co2',T:-110,P:1,run:'heat'},
  skate:{l:'Ice under a skate blade (−5 °C)',sub:'water',T:-5,P:1,run:'comp'},
  freeze:{l:'Freeze-drying food (ice at −20 °C)',sub:'water',T:-20,P:0.01,run:'decomp'},
  tank:{lvl:'ap',l:'Opening a CO₂ tank at 20 °C',sub:'co2',T:20,P:60,run:'decomp'},
  scf:{lvl:'ap',l:'Supercritical CO₂ (decaf coffee) at 100 atm',sub:'co2',T:0,P:100,run:'heat'}
};
function startPath(sim,kind){const st=sim.st;st.path={kind};st.hold=0;st.events=[];st.last=phaseNow(sim);st.lastBulk=phase(sb(sim),getT(sim),getP(sim));sim.infoDirty=true;}
function setTP(sim,T,lp){const s=sb(sim),o={};o[tKey(s)]=Math.round(clamp(T,s.Tmin,s.Tmax)*2)/2;o[pKey(s)]=Math.round(clamp(lp,s.lpMin,s.lpMax)*100)/100;BioLab.setValues(sim,o);}
function applyScene(sim,key){const sc=SCENES[key];BioLab.setValues(sim,{sub:sc.sub});const s=SUB[sc.sub],o={};o[tKey(s)]=sc.T;o[pKey(s)]=Math.round(Math.log10(sc.P)*100)/100;BioLab.setValues(sim,o);startPath(sim,sc.run);}
function stepPath(sim,dt){const st=sim.st,s=sb(sim);if(!st.path)return;if(st.hold>0){st.hold-=dt;return;}
  const T=getT(sim),lp=getLP(sim),k=st.path.kind,rT=(s.Tmax-s.Tmin)/9,rP=(s.lpMax-s.lpMin)/9;
  let T2=T,lp2=lp;if(k==='heat')T2=T+rT*dt;else if(k==='cool')T2=T-rT*dt;else if(k==='comp')lp2=lp+rP*dt;else lp2=lp-rP*dt;
  const done=T2>=s.Tmax||T2<=s.Tmin||lp2>=s.lpMax||lp2<=s.lpMin;T2=clamp(T2,s.Tmin,s.Tmax);lp2=clamp(lp2,s.lpMin,s.lpMax);
  const a=phase(s,T,Math.pow(10,lp)),b=phase(s,T2,Math.pow(10,lp2));
  if(a!==b){// find the crossing by bisection and record it
    let lo=0,hi=1;for(let i=0;i<40;i++){const m=(lo+hi)/2;if(phase(s,lerp(T,T2,m),Math.pow(10,lerp(lp,lp2,m)))===a)lo=m;else hi=m;}
    const Tx=lerp(T,T2,hi),lpx=lerp(lp,lp2,hi);const key=a+'>'+b;
    st.events.push({name:TRANS[key]||(PH_L[a]+' → '+PH_L[b]),T:Tx,P:Math.pow(10,lpx),sharp:!(a==='sc'||b==='sc')});sim.infoDirty=true;
    const o={};o[tKey(s)]=Tx;o[pKey(s)]=lpx;BioLab.setValues(sim,o);if(!(a==='sc'||b==='sc'))st.hold=1.3;return;}
  const o={};o[tKey(s)]=T2;o[pKey(s)]=lp2;BioLab.setValues(sim,o);if(done){st.path=null;sim.infoDirty=true;}}

/* ---------- particle view ---------- */
const BX0=528,BX1=784,BY0=58,BY1=300,NP=36;
function sitesPD(){const pts=[],sp=27,nc=7;const x0=(BX0+BX1)/2-(nc-1)*sp/2;for(let j=0;j<6;j++)for(let i=0;i<nc;i++){if(pts.length>=NP)break;pts.push([x0+i*sp+(j%2?sp/2:0)-sp/4,BY1-16-j*sp*0.87]);}return pts;}
const SITES=sitesPD();
function targets(sim){const s=sb(sim),ph=phaseNow(sim),lp=getLP(sim),ng=Math.round(clamp(5+3.4*(lp-s.lpMin),4,24));
  if(ph==='s')return {s:NP,l:0,g:0,sc:0};if(ph==='l')return {s:0,l:NP,g:0,sc:0};if(ph==='g')return {s:0,l:0,g:ng,sc:0};if(ph==='sc')return {s:0,l:0,g:0,sc:30};
  if(ph==='sl')return {s:20,l:16,g:0,sc:0};if(ph==='lg')return {s:0,l:22,g:Math.min(ng,12),sc:0};if(ph==='sg')return {s:22,l:0,g:Math.min(ng,10),sc:0};return {s:14,l:12,g:6,sc:0};}
function ensureParts(sim){const v=sim.vis;if(v.P)return;const r=rng(9);v.P=[];for(let i=0;i<NP;i++)v.P.push({x:lerp(BX0+20,BX1-20,r()),y:lerp(BY0+20,BY1-20,r()),vx:0,vy:0,a:r()*6.283,va:0,role:'h',site:-1,ph:r()*6.283});}
function assign(sim){const v=sim.vis,P=v.P,tg=targets(sim);const cnt=ro=>P.filter(p=>p.role===ro).length;let g=0;
  // remove extras
  ['s','l','g','sc'].forEach(ro=>{while(cnt(ro)>tg[ro]&&g++<500){let best=null;P.forEach(p=>{if(p.role!==ro)return;const sc=ro==='s'?p.site:ro==='l'?-p.y:ro==='g'?p.y:Math.random();if(!best||sc>best.sc2){best=p;best.sc2=sc;}});best.role='h';best.site=-1;}});
  ['s','l','sc','g'].forEach(ro=>{while(cnt(ro)<tg[ro]&&g++<900){let pick=P.find(p=>p.role==='h');if(!pick)break;pick.role=ro;
    if(ro==='s'){const used=new Set(P.filter(p=>p.role==='s'&&p!==pick).map(p=>p.site));let i=0;while(used.has(i))i++;pick.site=i;}
    if(ro==='g'||ro==='sc'){const a=Math.random()*6.283;pick.vx=Math.cos(a)*90;pick.vy=Math.sin(a)*90;pick.va=(Math.random()-0.5)*5;}}});}
function moveParts(sim,dt){const s=sb(sim),v=sim.vis,P=v.P,T=getT(sim),d0=21;const u=clamp((T-s.Tmin)/(s.Tmax-s.Tmin),0,1),vg=60+110*u,vl=18+30*u;
  let left=Math.min(dt,0.1);while(left>1e-6){const h=Math.min(left,1/60);left-=h;
    P.forEach(p=>{if(p.role==='h')return;if(p.role==='s'){const st=SITES[p.site]||[p.x,p.y],A=RM?0:0.6+1.8*u;p.x+=(st[0]+A*Math.sin(sim.vt*13+p.ph)-p.x)*Math.min(1,h*8);p.y+=(st[1]+A*Math.cos(sim.vt*11+p.ph)-p.y)*Math.min(1,h*8);p.a+=(0-p.a)*Math.min(1,h*5);return;}
      if(p.role==='l'){p.vx+=randn()*vl*6*h;p.vy+=randn()*vl*6*h+150*h;const sp=Math.hypot(p.vx,p.vy);if(sp>vl){p.vx*=vl/sp;p.vy*=vl/sp;}p.va=clamp(p.va+randn()*4*h,-2,2);}
      else if(p.role==='sc'){p.vx+=randn()*80*h;p.vy+=randn()*80*h;const sp=Math.hypot(p.vx,p.vy)||1,f=lerp(1,70/sp,Math.min(1,h*3));p.vx*=f;p.vy*=f;}
      else{p.vy+=20*h;const sp=Math.hypot(p.vx,p.vy)||1,f=lerp(1,vg/sp,Math.min(1,h*2));p.vx*=f;p.vy*=f;}
      p.x+=p.vx*h;p.y+=p.vy*h;p.a+=p.va*h;const m=11;
      if(p.x<BX0+m){p.x=BX0+m;p.vx=Math.abs(p.vx);}if(p.x>BX1-m){p.x=BX1-m;p.vx=-Math.abs(p.vx);}if(p.y<BY0+m){p.y=BY0+m;p.vy=Math.abs(p.vy);}if(p.y>BY1-m){p.y=BY1-m;p.vy=-Math.abs(p.vy)*(p.role==='l'?0.3:1);}});
    for(let i=0;i<P.length;i++){const a=P[i];if(a.role==='h')continue;for(let j=i+1;j<P.length;j++){const b=P[j];if(b.role==='h')continue;if(a.role==='s'&&b.role==='s')continue;if(a.role==='g'&&b.role==='g')continue;
      const dx=b.x-a.x,dy=b.y-a.y,dd=dx*dx+dy*dy;if(dd>2.4*d0*d0)continue;const d=Math.sqrt(dd)||0.01,ux=dx/d,uy=dy/d;
      if(d<d0){const push=d0-d;if(a.role==='g'||b.role==='g'){const gp=a.role==='g'?a:b,sg=a.role==='g'?-1:1;gp.x+=sg*ux*push;gp.y+=sg*uy*push;const vn=(gp.vx*ux+gp.vy*uy)*sg;if(vn<0){gp.vx-=2*vn*ux*sg;gp.vy-=2*vn*uy*sg;}continue;}
        const wa=a.role==='s'?0:b.role==='s'?1:0.5;a.x-=ux*push*wa;a.y-=uy*push*wa;b.x+=ux*push*(1-wa);b.y+=uy*push*(1-wa);}
      else if((a.role==='l'||a.role==='s')&&(b.role==='l'||b.role==='s')){const pull=(d-d0)*27*h;if(a.role==='l'){a.vx+=ux*pull;a.vy+=uy*pull;}if(b.role==='l'){b.vx-=ux*pull;b.vy-=uy*pull;}}}}}}
function drawMol(ctx,s,p){if(s.id==='water'){CL.drawAtom(ctx,p.x,p.y,7.5,'O',{label:''});[0.95,-0.95].forEach(o=>CL.drawAtom(ctx,p.x+Math.cos(p.a-1.57+o)*8.5,p.y+Math.sin(p.a-1.57+o)*8.5,4.5,'H',{label:''}));}
  else{const dx=Math.cos(p.a)*10,dy=Math.sin(p.a)*10;CL.drawAtom(ctx,p.x-dx,p.y-dy,6.5,'O',{label:''});CL.drawAtom(ctx,p.x+dx,p.y+dy,6.5,'O',{label:''});CL.drawAtom(ctx,p.x,p.y,6.5,'C',{label:''});}}

/* ---------- diagram drawing ---------- */
function hexA(hex,a){const h=(hex||'#888').replace('#','');const f=h.length===3?h.split('').map(c=>c+c).join(''):h;return 'rgba('+parseInt(f.slice(0,2),16)+','+parseInt(f.slice(2,4),16)+','+parseInt(f.slice(4,6),16)+','+a+')';}
function curvePts(s,f,a,b,n){const pts=[];for(let i=0;i<=n;i++){const T=lerp(a,b,i/n),P=f(T);pts.push([XT(s,T),YP(s,clamp(Math.log10(P),s.lpMin-1,s.lpMax+1))]);}return pts;}
function meltPts(s){const pts=[];for(let i=0;i<=60;i++){const lp=lerp(Math.log10(s.Ptp),s.lpMax+0.2,i/60),P=Math.pow(10,lp);pts.push([XT(s,s.tm(P)),YP(s,lp)]);}return pts;}
function drawDiagram(sim,ctx,k){const s=sb(sim),P=PAL,hon=atLeast('honors'),ap=atLeast('ap');
  const tpx=XT(s,s.Ttp),tpy=YP(s,Math.log10(s.Ptp)),cpx=XT(s,s.Tc),cpy=YP(s,Math.log10(s.Pc));
  const vap=curvePts(s,s.pvap,s.Ttp,s.Tc,80),subl=curvePts(s,s.psub,s.Tmin-5,s.Ttp,80),melt=meltPts(s);
  ctx.save();ctx.beginPath();ctx.rect(DL,DT,DW,DH);ctx.clip();
  ctx.fillStyle=hexA(P['s4'],0.13);ctx.fillRect(DL,DT,DW,DH);// gas everywhere first
  // solid: left of melting line and above sublimation line
  ctx.beginPath();ctx.moveTo(DL-5,DT-20);melt.slice().reverse().forEach(p=>ctx.lineTo(p[0],p[1]));subl.slice().reverse().forEach(p=>ctx.lineTo(p[0],p[1]));ctx.lineTo(DL-5,DT+DH+20);ctx.closePath();ctx.fillStyle=hexA(P['s6'],0.26);ctx.fill();
  // liquid: right of melting line, above vapor curve, left of the critical temperature
  ctx.beginPath();melt.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.lineTo(cpx,DT-20);ctx.lineTo(cpx,cpy);vap.slice().reverse().forEach(p=>ctx.lineTo(p[0],p[1]));ctx.closePath();ctx.fillStyle=hexA(P['s2'],0.24);ctx.fill();
  // supercritical
  ctx.fillStyle=hexA(P['s5'],0.2);ctx.fillRect(cpx,DT-20,DL+DW-cpx+10,cpy-DT+20);
  // 1 atm line
  const y1=YP(s,0);ctx.strokeStyle=P['cv-soft'];ctx.lineWidth=1.2;ctx.setLineDash([5,5]);ctx.beginPath();ctx.moveTo(DL,y1);ctx.lineTo(DL+DW,y1);ctx.stroke();ctx.setLineDash([]);
  if(ap){ctx.strokeStyle=hexA(P['s5'],0.7);ctx.setLineDash([3,4]);ctx.beginPath();ctx.moveTo(cpx,cpy);ctx.lineTo(cpx,DT);ctx.moveTo(cpx,cpy);ctx.lineTo(DL+DW,cpy);ctx.stroke();ctx.setLineDash([]);}
  // the three lines
  ctx.strokeStyle=P['cv-ink'];ctx.lineWidth=2.6;[subl,vap,melt].forEach(L=>{ctx.beginPath();L.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.stroke();});
  // path trail
  const st=sim.st;if(st.trail&&st.trail.length>1){ctx.strokeStyle=P['s1'];ctx.lineWidth=2;ctx.setLineDash([2,3]);ctx.beginPath();st.trail.forEach((q,i)=>{const x=XT(s,q[0]),y=YP(s,q[1]);i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.stroke();ctx.setLineDash([]);}
  (st.events||[]).forEach(e=>{if(!e.sharp)return;const x=XT(s,e.T),y=YP(s,Math.log10(e.P));ctx.fillStyle=P['s1'];ctx.beginPath();ctx.arc(x,y,4,0,6.283);ctx.fill();});
  ctx.restore();
  // region labels
  const lab=(t,x,y,c)=>txt(ctx,t,x,y,{s:15*Math.min(k,1.5),w:800,a:'center',c:c||P['cv-ink']});
  if(s.id==='water'){lab('SOLID',DL+44,DT+70);lab('LIQUID',XT(s,170),DT+70);lab('GAS',XT(s,250),DT+DH-60);}
  else{lab('SOLID',XT(s,-95),DT+70);lab('LIQUID',XT(s,-15),DT+70);lab('GAS',XT(s,-10),DT+DH-50);}
  if(ap){const sx=(cpx+DL+DW)/2;txt(ctx,'SUPER-',sx,DT+22,{s:12*k,w:800,a:'center',c:P['s5']});txt(ctx,'CRITICAL',sx,DT+22+13*k,{s:12*k,w:800,a:'center',c:P['s5']});}
  // special points
  ctx.fillStyle=P['cv-ink'];ctx.beginPath();ctx.arc(tpx,tpy,5,0,6.283);ctx.fill();ctx.beginPath();ctx.arc(cpx,cpy,5,0,6.283);ctx.fill();
  if(hon){txt(ctx,'triple point',tpx+8,tpy+16*Math.min(k,1.3),{s:12*k,w:700,c:P['cv-soft']});txt(ctx,'critical point',cpx-8,cpy-10,{s:12*k,w:700,a:'right',c:P['cv-soft']});}
  // axes
  ctx.strokeStyle=P['g-axis'];ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(DL,DT);ctx.lineTo(DL,DT+DH);ctx.lineTo(DL+DW,DT+DH);ctx.stroke();
  for(let e=s.lpMin;e<=s.lpMax;e++){const y=YP(s,e);ctx.beginPath();ctx.moveTo(DL-5,y);ctx.lineTo(DL,y);ctx.stroke();if((e-s.lpMin)%(k>1.3?2:1)===0||e===0)txt(ctx,e<0?(e>=-3?String(Math.pow(10,e)):'10'+CL.sup(String(e).replace('-','−'))):e===0?'1':e<4?String(Math.pow(10,e)):'10'+CL.sup(e),DL-8,y,{s:12*k,a:'right',b:'middle',c:P['g-axis']});}
  for(let T=Math.ceil(s.Tmin/s.Ttick)*s.Ttick;T<=s.Tmax;T+=s.Ttick){const x=XT(s,T);ctx.beginPath();ctx.moveTo(x,DT+DH);ctx.lineTo(x,DT+DH+5);ctx.stroke();txt(ctx,String(T),x,DT+DH+18*Math.min(k,1.3),{s:12*k,a:'center',c:P['g-axis']});}
  txt(ctx,'Temperature (°C)',DL+DW/2,DT+DH+38*Math.min(k,1.2),{s:13*k,a:'center',c:P['muted']});
  ctx.save();ctx.translate(18,DT+DH/2);ctx.rotate(-Math.PI/2);txt(ctx,'Pressure (atm, log scale)',0,0,{s:13*k,a:'center',b:'middle',c:P['muted']});ctx.restore();
  txt(ctx,'1 atm',DL+DW-4,y1-6,{s:12*k,w:700,a:'right',c:P['cv-soft']});
  // current point
  const T=getT(sim),lp=getLP(sim),x=XT(s,T),y=YP(s,lp);ctx.strokeStyle=P['card'];ctx.lineWidth=3;ctx.fillStyle=P['s1'];ctx.beginPath();ctx.arc(x,y,9,0,6.283);ctx.fill();ctx.stroke();}

function updOut(sim){if(!sim.ui||!sim.ui.sec)return;['lpw','lpc'].forEach(id=>{const e=document.getElementById('phasediagram-'+id+'-out');if(e){const t=fmtP(Math.pow(10,sim.p[id]));if(e.textContent!==t)e.textContent=t;}});}
function syncMode(sim){if(!sim.ui||!sim.ui.sec)return;const mode=sim.p.sub,d=sim.def;
  d.controls.forEach(c=>{if(!c.modes)return;const cid=d.id+'-'+c.id,e=document.getElementById(cid)||document.getElementById(cid+'-l');if(!e)return;const w=e.closest('.ctl');if(w)w.hidden=!atLeast(c.lvl)||!c.modes.includes(mode);});updOut(sim);}

/* ---------- definition ---------- */
const SIM={
  id:'phasediagram',hash:'phasediagram',apUnit:6,order:2,tab:'Phase diagrams',kind:'Simulation',
  prereq:['states'],next:['imf','gaslaws'],
  card:'Drag a point around the real phase diagrams of water and CO₂ and watch the particles melt, boil, sublime or turn supercritical.',
  title:'Phase diagrams: water and carbon dioxide',
  lede:{bio:'A phase diagram is a map: every temperature and pressure has a phase. Drag the red point, or heat and squeeze the sample, and watch the particles change.',
        honors:'Read the triple point and critical point, follow a path and name each transition, and explain pressure cookers, mountain cooking, dry ice and freeze-drying.',
        ap:'Explore the supercritical fluid, and use the Clapeyron equation to explain why water’s melting line tilts left while CO₂’s tilts right.'},
  scale:'The diagram covers 0.0001 to 10,000 atm on a log scale. The particle window is about 3 nm across; gases are drawn denser than real so you can see them.',
  timeless:true,animated:true,graph:false,chChange:0.3,chReveal:8,
  controls:[
    {id:'sub',label:'Substance',type:'seg',def:'water',lvl:'bio',options:[{v:'water',l:'Water (H₂O)'},{v:'co2',l:'Carbon dioxide (CO₂)'}],onChange(sim){if(sim.st){sim.st.path=null;sim.st.events=[];sim.st.trail=[];}syncMode(sim);}},
    {id:'Tw',label:'Temperature',type:'range',min:-60,max:420,step:0.5,def:25,unit:' °C',lvl:'bio',modes:['water']},
    {id:'lpw',label:'Pressure',type:'range',min:-4,max:4,step:0.01,def:0,unit:'',lvl:'bio',modes:['water'],noTrial:true,help:'The slider moves on a log scale: each step of the axis is 10× the pressure.'},
    {id:'Tc2',label:'Temperature',type:'range',min:-120,max:60,step:0.5,def:25,unit:' °C',lvl:'bio',modes:['co2']},
    {id:'lpc',label:'Pressure',type:'range',min:-2,max:4,step:0.01,def:0,unit:'',lvl:'bio',modes:['co2'],noTrial:true,help:'Log scale: each step of the axis is 10× the pressure.'},
    {id:'scene',label:'Real-world scenario',type:'select',def:'denver',lvl:'honors',noTrial:true,options:Object.keys(SCENES).map(k=>({v:k,l:SCENES[k].l,lvl:SCENES[k].lvl}))}
  ],
  actions:[
    {id:'heat',label:'Heat (pressure stays the same)',lvl:'bio',primary:true,run(sim){startPath(sim,'heat');}},
    {id:'cool',label:'Cool',lvl:'bio',run(sim){startPath(sim,'cool');}},
    {id:'comp',label:'Squeeze (raise the pressure)',lvl:'bio',run(sim){startPath(sim,'comp');}},
    {id:'decomp',label:'Lower the pressure',lvl:'bio',run(sim){startPath(sim,'decomp');}},
    {id:'stop',label:'Stop',lvl:'bio',run(sim){sim.st.path=null;sim.st.hold=0;sim.infoDirty=true;}},
    {id:'go',label:'Run the scenario',lvl:'honors',run(sim){applyScene(sim,sim.p.scene);}}
  ],
  init(){return {path:null,hold:0,events:[],trail:[],last:null};},
  step(sim,dt){const st=sim.st;stepPath(sim,dt);const T=getT(sim),lp=getLP(sim),L=st.trail;if(st.path){const q=L[L.length-1];if(!q||q[0]!==T||q[1]!==lp)L.push([T,lp]);if(L.length>600)L.shift();}},
  metrics:[
    {id:'ph',label:'Phase',unit:'',lvl:'bio',text:true,get:s=>{const p=phaseNow(s);return LINE_L[p]||PH_L[p];}},
    {id:'T',label:'Temperature',unit:'°C',lvl:'bio',d:1,min:-120,max:420,get:s=>getT(s)},
    {id:'P',label:'Pressure',unit:'atm',lvl:'bio',text:true,get:s=>fmtP(getP(s)).replace(' atm','')},
    {id:'kPa',label:'Pressure in kPa',unit:'kPa',lvl:'honors',text:true,get:s=>CL.toSig(getP(s)*101.325,3)},
    {id:'bp',label:'Boiling point at this pressure',unit:'',lvl:'honors',text:true,get:s=>{const v=sb(s),P=getP(s);if(P<=v.Ptp)return 'none: below the triple point it sublimes at '+fmtT(tSub(v,P));if(P>=v.Pc)return 'none: above the critical pressure';return fmtT(tBoil(v,P));}},
    {id:'mp',label:'Melting point at this pressure',unit:'',lvl:'honors',text:true,get:s=>{const v=sb(s),P=getP(s);return P<=v.Ptp?'none: no liquid below '+fmtP(v.Ptp):fmtT(v.tm(P));}},
    {id:'tpc',label:'Triple and critical points',unit:'',lvl:'honors',text:true,noTrial:true,get:s=>{const v=sb(s);return 'triple '+fmtT(v.Ttp)+', '+fmtP(v.Ptp)+'; critical '+fmtT(v.Tc)+', '+fmtP(v.Pc);}},
    {id:'slope',label:'Solid–liquid line slope (Clapeyron)',unit:'atm/°C',lvl:'ap',d:0,get:s=>{const v=sb(s);return v.dHfus*1000/((v.Ttp+273.15)*v.dV*1e-6)/101325;}}
  ],
  infoPanel(sim){const st=sim.st,s=sb(sim);let h='<div class="p-head"><h3>Transitions on this path</h3></div>';
    if(!st.events.length)return h+'<p class="status">'+(st.path?'Moving… no line crossed yet.':'Use Heat, Cool, Squeeze or Lower the pressure, or run a scenario. Each line you cross is listed here.')+'</p>';
    return h+'<ol style="margin:8px 0 0;padding-left:20px">'+st.events.map(e=>'<li><b>'+e.name+'</b> at '+fmtT(e.T)+' and '+fmtP(e.P)+(e.sharp?'':' (no sharp change: no surface, no boiling)')+'</li>').join('')+'</ol>';},
  narrate(sim){const s=sb(sim),T=getT(sim),P=getP(sim),ph=phaseNow(sim),hon=atLeast('honors'),ap=atLeast('ap'),st=sim.st;
    const last=st.events[st.events.length-1];let t='';
    if(st.hold>0&&last)return '<b>'+last.name+'</b> at '+fmtT(last.T)+' and '+fmtP(last.P)+'. On a line two phases coexist, so the point waits here while the change finishes.';
    if(ph==='tp')return 'At the <b>triple point</b> ('+fmtT(s.Ttp)+', '+fmtP(s.Ptp)+') solid, liquid and gas all exist together.';
    if(ph==='sl'||ph==='lg'||ph==='sg')return 'You are <b>on a line</b>: '+LINE_L[ph].split(': ')[1]+' exist together. Move off the line in either direction and only one phase remains.';
    if(ph==='s')t='At '+fmtT(T)+' and '+fmtP(P)+', '+s.f+' is a <b>solid</b>: particles locked in a lattice.';
    else if(ph==='l')t='At '+fmtT(T)+' and '+fmtP(P)+', '+s.f+' is a <b>liquid</b>: particles touch but flow.';
    else if(ph==='g')t='At '+fmtT(T)+' and '+fmtP(P)+', '+s.f+' is a <b>gas</b>: particles fly apart'+(P<0.01?', and there are very few of them at this low pressure':'')+'.';
    else t='Above '+fmtT(s.Tc)+' and '+fmtP(s.Pc)+', '+s.f+' is a <b>supercritical fluid</b>: dense like a liquid but with no surface, filling the container like a gas.';
    if(s.id==='co2'&&P<s.Ptp&&ph==='s')t+=' At 1 atm, CO₂ never melts: it sublimes at −78.5 °C, which is why it is called dry ice.';
    if(s.id==='water'&&ph==='l'&&hon&&P>s.Ptp&&P<s.Pc)t+=' It would boil at '+fmtT(tBoil(s,P))+' at this pressure.';
    if(ap&&s.id==='water'&&ph==='s'&&P>10)t+=' Squeezing ice lowers its melting point, because liquid water takes up less space than ice.';
    return t;},
  tour:[
    {title:'A map of phases',text:'The horizontal axis is temperature and the vertical axis is pressure (each grid step is 10 times more). Each region of the map is one phase.',focus:[DL-70,DT-8,DW+80,DH+60],speed:1,setup(sim){BioLab.setValues(sim,{sub:'water',Tw:25,lpw:0});sim.st.events=[];sim.st.trail=[];}},
    {title:'You are here',text:'The red point is 25 °C and 1 atm, a normal room. Water is a liquid, so the particle window shows molecules touching and flowing.',focus:[[XT(W,25)-24,YP(W,0)-24,48,48],[BX0-8,BY0-8,BX1-BX0+16,BY1-BY0+16]],speed:1},
    {title:'Heat at 1 atm',text:'Follow the dashed 1 atm line to the right. The point crosses the boiling line at 100 °C, the normal boiling point, and the liquid turns into gas.',focus:[DL-8,DT-8,DW+16,DH+16],speed:1,setup(sim){BioLab.setValues(sim,{Tw:-30,lpw:0});startPath(sim,'heat');}},
    {title:'Lines mean two phases',text:'Each line is where two phases coexist: solid–liquid (melting), liquid–gas (boiling) and solid–gas (sublimation). Crossing a line is a phase change.',focus:[DL-8,DT-8,DW+16,DH+16],speed:1,pause:true,setup(sim){sim.st.path=null;BioLab.setValues(sim,{Tw:100,lpw:0});}},
    {title:'The triple point',text:'All three lines meet at the triple point, 0.01 °C and 0.006 atm for water. Below that pressure, liquid water cannot exist: ice turns straight into vapor.',focus:[XT(W,0)-40,YP(W,Math.log10(W.Ptp))-40,80,80],speed:1,setup(sim){BioLab.setValues(sim,{Tw:0,lpw:Math.round(Math.log10(W.Ptp)*100)/100});}},
    {title:'Dry ice',text:'CO₂’s triple point is at 5.1 atm, above room pressure. At 1 atm, solid CO₂ skips the liquid and sublimes at −78.5 °C.',focus:[DL-8,DT-8,DW+16,DH+16],speed:1,setup(sim){BioLab.setValues(sim,{sub:'co2',Tc2:-110,lpc:0});startPath(sim,'heat');}},
    {lvl:'honors',title:'The critical point',text:'The boiling line ends at the critical point (31.0 °C, 72.8 atm for CO₂). Past it, liquid and gas can no longer be told apart.',focus:[XT(C,31)-50,YP(C,Math.log10(72.8))-50,100,100],speed:1,setup(sim){sim.st.path=null;BioLab.setValues(sim,{Tc2:31,lpc:1.86});}},
    {lvl:'ap',title:'Water’s backward slope',text:'Water’s melting line tilts left: squeeze ice and it melts at a lower temperature. Liquid water is denser than ice, so by the Clapeyron equation dP/dT = ΔH/(TΔV) the slope is negative, about −135 atm/°C.',focus:[XT(W,0)-50,DT-8,100,DH+16],speed:1,setup(sim){BioLab.setValues(sim,{sub:'water',Tw:-5,lpw:0});startPath(sim,'comp');}}
  ],
  onTourExit(sim){sim.st.path=null;BioLab.setValues(sim,{sub:'water',Tw:25,lpw:0});sim.st.events=[];sim.st.trail=[];},
  challenges(sim){const pBoil25=W.pvap(25),tD=tBoil(W,0.83),tC=tBoil(W,2),p100=1+(-0.8+0.01)/-0.0074,tm100=W.tm(100),pSk=invert(P=>-W.tm(P),5,1,5000);return [
    {lvl:'bio',q:'Dry ice (solid CO₂) at 1 atm warms up from −110 °C. What happens?',choices:['It melts into liquid CO₂, then boils','It turns straight into a gas','It stays solid until room temperature'],correct:1,
      baseline:{sub:'co2',Tc2:-110,lpc:0},changeAction:'heat',changeText:'Warming at 1 atm',reveal:6,
      explain:'At 1 atm the point crosses only the sublimation line, at −78.5 °C. Liquid CO₂ exists only above 5.1 atm (its triple point), so dry ice never melts in an open room.'},
    {lvl:'bio',q:'Water sits at 25 °C. You pump the air away and lower the pressure to 0.01 atm without heating. What happens?',choices:['Nothing, because it was not heated','It boils at room temperature','It freezes'],correct:1,
      baseline:{sub:'water',Tw:25,lpw:0},changeAction:'decomp',changeText:'Pumping the pressure down',reveal:6,
      explain:'Water’s vapor pressure at 25 °C is '+CL.toSig(pBoil25,2)+' atm. Once the pressure falls below that, the point crosses the boiling line and the water boils, even though it is only 25 °C.'},
    {lvl:'honors',q:'In Aurora or Denver the air pressure is about 0.83 atm. Water there boils at…',choices:['100 °C, like everywhere','a little below 100 °C (about '+tD.toFixed(0)+' °C)','above 100 °C'],correct:1,
      baseline:{sub:'water',Tw:20,lpw:-0.08},changeAction:'heat',changeText:'Heating at 0.83 atm',reveal:7,
      explain:'At 0.83 atm the point crosses the boiling line at '+tD.toFixed(1)+' °C. Lower pressure on the surface lets molecules escape at a lower temperature, so pasta takes longer to cook at altitude.'},
    {lvl:'honors',q:'A pressure cooker holds the steam in until the pressure is about 2.0 atm. The water inside boils at…',choices:['100 °C','about '+tC.toFixed(0)+' °C','about 200 °C'],correct:1,
      baseline:{sub:'water',Tw:20,lpw:0.3},changeAction:'heat',changeText:'Heating at 2.0 atm',reveal:7,
      explain:'Higher pressure pushes the boiling point up to '+tC.toFixed(1)+' °C, so food cooks faster. The boiling line shows that every pressure has its own boiling point.'},
    {lvl:'honors',q:'Ice at −5 °C is squeezed harder and harder. What happens eventually?',choices:['It melts','It stays solid however hard you squeeze','It turns into a gas'],correct:0,
      baseline:{sub:'water',Tw:-5,lpw:0},changeAction:'comp',changeText:'Squeezing the ice',reveal:8,
      explain:'Water’s melting line tilts left, so higher pressure means a lower melting point. At −5 °C the point crosses into the liquid at about '+Math.round(pSk/10)*10+' atm. Water is one of very few substances that do this.'},
    {lvl:'ap',q:'CO₂ at 100 atm is heated from 0 °C to 60 °C, past its critical temperature of 31 °C. What do you see when it crosses 31 °C?',choices:['It boils','No sharp change: it becomes a supercritical fluid with no surface','It freezes'],correct:1,
      baseline:{sub:'co2',Tc2:0,lpc:2},changeAction:'heat',changeText:'Heating at 100 atm',reveal:7,
      explain:'Above the critical pressure, the path never crosses the boiling line. The liquid smoothly becomes a supercritical fluid; the transitions panel lists it with no sharp change. Supercritical CO₂ dissolves caffeine out of coffee beans.'},
    {lvl:'ap',instant:true,q:'A skater’s blade presses on ice at −10 °C with roughly 100 atm. Does pressure melting explain why skates glide?',choices:['Yes, 100 atm melts the ice','No, 100 atm only lowers the melting point to about '+tm100.toFixed(1)+' °C','No, pressure raises the melting point'],correct:1,
      explain:'On the melting line, T = 0.01 − 0.0074(P − 0.006) °C, so 100 atm gives '+tm100.toFixed(2)+' °C, far above −10 °C. Melting ice at −10 °C would take about '+Math.round(invert(P=>-W.tm(P),10,1,5000)/10)*10+' atm. Skates glide mostly because of a thin liquid-like layer on the ice surface and friction heating.'},
    {lvl:'ap',instant:true,q:'Solid CO₂ is denser than liquid CO₂ (ΔV of melting is +9.1 cm³/mol). Which way does its solid–liquid line tilt?',choices:['To the right (positive slope), like most substances','To the left (negative slope), like water','Straight up'],correct:0,
      explain:'Clapeyron: dP/dT = ΔH_fus/(TΔV) = 9020 J/mol ÷ (216.6 K × 9.1 × 10⁻⁶ m³/mol) = 4.6 × 10⁶ Pa/K, about +45 atm/°C. Positive ΔV gives a positive slope; water’s ΔV is negative (−1.63 cm³/mol), so its slope is about −135 atm/°C.'}
  ];},
  lab:{bio:'<p><b>Question:</b> What phase is water at different temperatures and pressures?</p><ol><li>Set the pressure to 1 atm. Heat from −60 °C and write down where the phase changes.</li><li>Repeat at 0.01 atm and at 100 atm. Press <b>Record trial</b> at each change.</li><li>Switch to CO₂ and heat at 1 atm.</li></ol><p>Why does dry ice never make a puddle?</p>',
       honors:'<p><b>Question:</b> How does pressure change the boiling and melting points?</p><ol><li>Record water’s boiling point at 0.1, 0.5, 0.83, 1, 2 and 10 atm using the readout.</li><li>Record water’s melting point at 1, 100 and 1000 atm, then CO₂’s at 10, 100 and 1000 atm.</li><li>Run each scenario and name every transition.</li></ol><p>Explain the pressure cooker and mountain cooking using your boiling-point data.</p>',
       ap:'<p><b>Question:</b> What sets the slope of each line on a phase diagram?</p><ol><li>Record water’s vapor pressure at five temperatures from the boiling line (set T, lower P until it boils).</li><li>Plot ln P against 1/T and find ΔH_vap from the slope.</li><li>Compare the solid–liquid slope readouts for water and CO₂.</li></ol><p><b>Claim–evidence–reasoning:</b> Use the Clapeyron equation to explain why the two melting lines tilt in opposite directions.</p>'},
  terms:[{t:'Phase diagram',d:'A map of which phase is stable at each temperature and pressure.'},{t:'Sublimation',d:'Solid turning straight into gas. The reverse is deposition.'},
    {t:'Normal boiling point',d:'The boiling point at exactly 1 atm (100 °C for water).'},{t:'Normal melting point',d:'The melting point at 1 atm (0 °C for water).'},
    {lvl:'honors',t:'Triple point',d:'The one temperature and pressure where solid, liquid and gas coexist.'},{lvl:'honors',t:'Critical point',d:'The end of the boiling line. Above it, liquid and gas become one phase.'},
    {lvl:'honors',t:'Vapor pressure',d:'The pressure of a vapor in balance with its liquid. A liquid boils when its vapor pressure equals the outside pressure.'},
    {lvl:'ap',t:'Supercritical fluid',d:'Matter above its critical temperature and pressure: dense like a liquid, fills space like a gas, no surface.'},{lvl:'ap',t:'Clapeyron equation',d:'dP/dT = ΔH/(TΔV) gives the slope of any phase boundary.'}],
  about:'<p>The lines come from real data on a log-pressure scale. Water’s boiling line uses the Antoine equation (1–374 °C), adjusted smoothly above 100 °C so it ends at the true critical point (373.95 °C, 217.7 atm). Its sublimation line uses the Clausius–Clapeyron equation with ΔH_sub = 51.06 kJ/mol, and its melting line follows ice I: −0.0074 °C per atm, curving slightly (−22 °C at 2000 atm). Above about 2100 atm other forms of ice appear; they are left out. CO₂’s lines are Clausius–Clapeyron fits through its triple point (−56.6 °C, 5.11 atm), its sublimation point at 1 atm (−78.5 °C) and its critical point (31.0 °C, 72.8 atm); its melting line uses the Clapeyron slope of about +45 atm/°C.</p><p>The particle window shows the phase the diagram predicts. Gas is drawn with more particles at higher pressure, but far denser than real at low pressure. On a line, the window shows both phases. A real sample sitting on a line stays there until the whole sample has changed, which is why the point pauses at each crossing.</p>',
  initVis(sim){sim.vis.P=null;},
  draw(sim,ctx,vdt,k,t){const P=PAL,s=sb(sim);ctx.fillStyle=P['cv-bg'];ctx.fillRect(0,0,800,450);
    drawDiagram(sim,ctx,k);ensureParts(sim);assign(sim);moveParts(sim,vdt);updOut(sim);
    ctx.fillStyle=P['cv-bg2'];ctx.fillRect(BX0,BY0,BX1-BX0,BY1-BY0);ctx.strokeStyle=P['cv-glass'];ctx.lineWidth=3;ctx.strokeRect(BX0,BY0,BX1-BX0,BY1-BY0);
    ctx.save();ctx.beginPath();ctx.rect(BX0,BY0,BX1-BX0,BY1-BY0);ctx.clip();const ph=phaseNow(sim);if(ph==='l'||ph==='sl'||ph==='lg'||ph==='tp'){}
    sim.vis.P.forEach(p=>{if(p.role!=='h')drawMol(ctx,s,p);});ctx.restore();
    txt(ctx,'Particle view',(BX0+BX1)/2,BY0-14,{s:13*k,w:700,a:'center',c:P['cv-soft']});
    const lbl=LINE_L[ph]?(ph==='tp'?'solid + liquid + gas':LINE_L[ph].split(': ')[1]):PH_L[ph];
    pill(ctx,lbl,(BX0+BX1)/2,BY1+26,ph==='sc'?'#6a3fb5':ph==='s'?'#0f6f73':ph==='l'?'#1f5fae':ph==='g'?'#8a5a00':'#a33a12','#fff',15*Math.min(k,1.45));
    txt(ctx,fmtT(getT(sim))+',  '+fmtP(getP(sim)),(BX0+BX1)/2,BY1+64*Math.min(k,1.25),{s:15*Math.min(k,1.5),w:700,a:'center'});
    if(sim.st.path)txt(ctx,{heat:'Heating →',cool:'← Cooling',comp:'Squeezing ↑',decomp:'Lowering pressure ↓'}[sim.st.path.kind],(BX0+BX1)/2,BY1+96*Math.min(k,1.2),{s:13*k,w:700,a:'center',c:P['s1']});
    bindDrag(sim);},
  thumbSetup(sim){sim.p.Tw=100;sim.p.lpw=0;}
};
function bindDrag(sim){const cv=sim.ui&&sim.ui.stage;if(!cv||cv._pdDrag)return;cv._pdDrag=true;cv.style.touchAction='pinch-zoom';
  const toLogical=e=>{const r=cv.getBoundingClientRect();return [(e.clientX-r.left)/r.width*800,(e.clientY-r.top)/r.height*450];};
  let drag=false;const move=e=>{const [x,y]=toLogical(e),s=sb(sim);if(x<DL||x>DL+DW||y<DT||y>DT+DH)return;sim.st.path=null;setTP(sim,TX(s,x),LPY(s,y));sim.infoDirty=true;};
  cv.addEventListener('pointerdown',e=>{const [x,y]=toLogical(e);if(x>=DL&&x<=DL+DW&&y>=DT&&y<=DT+DH){drag=true;cv.setPointerCapture(e.pointerId);move(e);e.preventDefault();}});
  cv.addEventListener('pointermove',e=>{if(drag)move(e);});cv.addEventListener('pointerup',()=>{drag=false;});cv.addEventListener('pointercancel',()=>{drag=false;});}
SIM.onLevel=syncMode;
BioLab.register(SIM);
})();
