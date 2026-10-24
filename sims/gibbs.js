(function(){
'use strict';
const {clamp,lerp,rng,rr,txt,pill,atLeast,PAL,FONT,RM,axes,legend}=BioLab.h;
const CL=window.ChemLab;
const R=8.314;
const hon=()=>atLeast('honors'),ap=()=>atLeast('ap');
const sgn=(v,d)=>(v<0?'−':v>0?'+':'')+Math.abs(v).toFixed(d===undefined?1:d);

/* ---------- counting arrangements ---------- */
const LF=[0];for(let i=1;i<=200;i++)LF[i]=LF[i-1]+Math.log(i);
const lnC=(N,n)=>LF[N]-LF[n]-LF[N-n];
function sciE(lnv,sig){const l10=lnv/Math.LN10;if(l10<6)return Math.round(Math.exp(lnv)).toLocaleString('en-US');const e=Math.floor(l10),m=Math.pow(10,l10-e);return m.toFixed(sig||2)+' × 10'+CL.sup(String(e));}

/* ---------- processes and reactions: ΔH° (kJ), ΔS° (J/K), 25 °C unless noted ---------- */
const H2O='#3f7fd0',H2='#9aa3ad',O2='#d9534f',N2='#5b6bd6',NH3='#7b5ea7',CO2='#5f6b76',SALTA='#3f6fb0',SALTC='#c0392b',CC='#4a4a4a',OZ='#6aa6c8',CAO='#c8b89a',CACO3='#e3d9c6',H2O2='#2fa39a';
const PROC={
  melt:{n:'Ice melting',eq:'H₂O(s) → H₂O(l)',dH:6.01,dS:22.0,note:'at 0 °C',B:[{f:'H₂O',n:16,c:H2O,ph:'s'}],A:[{f:'H₂O',n:16,c:H2O,ph:'l'}],gas:[0,0]},
  freeze:{n:'Water freezing',eq:'H₂O(l) → H₂O(s)',dH:-6.01,dS:-22.0,note:'at 0 °C',B:[{f:'H₂O',n:16,c:H2O,ph:'l'}],A:[{f:'H₂O',n:16,c:H2O,ph:'s'}],gas:[0,0]},
  boil:{n:'Water boiling',eq:'H₂O(l) → H₂O(g)',dH:44.0,dS:118.9,B:[{f:'H₂O',n:16,c:H2O,ph:'l'}],A:[{f:'H₂O',n:16,c:H2O,ph:'g'}],gas:[0,1]},
  nacl:{n:'Dissolving table salt',eq:'NaCl(s) → Na⁺(aq) + Cl⁻(aq)',dH:3.9,dS:43.4,B:[{f:'Na⁺',n:8,c:SALTA,ph:'s'},{f:'Cl⁻',n:8,c:SALTC,ph:'s'}],A:[{f:'Na⁺',n:8,c:SALTA,ph:'aq'},{f:'Cl⁻',n:8,c:SALTC,ph:'aq'}],water:true,gas:[0,0]},
  nh4no3:{n:'Dissolving ammonium nitrate (cold pack)',eq:'NH₄NO₃(s) → NH₄⁺(aq) + NO₃⁻(aq)',dH:25.7,dS:108.7,B:[{f:'NH₄⁺',n:8,c:SALTA,ph:'s'},{f:'NO₃⁻',n:8,c:SALTC,ph:'s'}],A:[{f:'NH₄⁺',n:8,c:SALTA,ph:'aq'},{f:'NO₃⁻',n:8,c:SALTC,ph:'aq'}],water:true,gas:[0,0]},
  h2:{n:'Burning hydrogen',eq:'2H₂(g) + O₂(g) → 2H₂O(l)',dH:-571.6,dS:-326.8,B:[{f:'H₂',n:10,c:H2,ph:'g'},{f:'O₂',n:5,c:O2,ph:'g'}],A:[{f:'H₂O',n:10,c:H2O,ph:'l'}],gas:[3,0]},
  caco3:{n:'Decomposing limestone',eq:'CaCO₃(s) → CaO(s) + CO₂(g)',dH:178.3,dS:160.2,B:[{f:'CaCO₃',n:9,c:CACO3,ph:'s'}],A:[{f:'CaO',n:9,c:CAO,ph:'s'},{f:'CO₂',n:9,c:CO2,ph:'g'}],gas:[0,1]},
  haber:{n:'Making ammonia (Haber)',eq:'N₂(g) + 3H₂(g) → 2NH₃(g)',dH:-91.8,dS:-198.1,B:[{f:'N₂',n:4,c:N2,ph:'g'},{f:'H₂',n:12,c:H2,ph:'g'}],A:[{f:'NH₃',n:8,c:NH3,ph:'g'}],gas:[4,2]},
  h2o2:{n:'Decomposing hydrogen peroxide',eq:'2H₂O₂(l) → 2H₂O(l) + O₂(g)',dH:-196.0,dS:125.8,B:[{f:'H₂O₂',n:10,c:H2O2,ph:'l'}],A:[{f:'H₂O',n:10,c:H2O,ph:'l'},{f:'O₂',n:5,c:O2,ph:'g'}],gas:[0,1]},
  ozone:{n:'Making ozone',eq:'3O₂(g) → 2O₃(g)',dH:285.4,dS:-137.8,B:[{f:'O₂',n:12,c:O2,ph:'g'}],A:[{f:'O₃',n:8,c:OZ,ph:'g'}],gas:[3,2]},
  diamond:{n:'Diamond turning into graphite',eq:'C(diamond) → C(graphite)',dH:-1.9,dS:3.4,B:[{f:'C',n:16,c:CC,ph:'s'}],A:[{f:'C',n:16,c:CC,ph:'s',layers:true}],gas:[0,0],slow:true}
};
const PORDER=['melt','freeze','boil','nacl','nh4no3','h2','caco3','haber','h2o2','ozone','diamond'];
const GORDER=['boil','melt','nh4no3','h2','caco3','haber','h2o2','ozone','diamond'];
function proc(p,key){return PROC[key||(p.mode==='gibbs'?p.rx:p.proc)]||PROC.boil;}
function dG(P,T){return P.dH-T*P.dS/1000;}                         // kJ
function Tcross(P){if(P.dH*P.dS<=0)return NaN;return P.dH*1000/P.dS;} // K
function caseOf(P){return P.dH<0&&P.dS>0?'always':P.dH>0&&P.dS<0?'never':P.dH<0?'low':'high';}
const CASE={always:'Spontaneous at every temperature',never:'Never spontaneous on its own',low:'Spontaneous only at low temperature',high:'Spontaneous only at high temperature'};
function lnK(P,T){return -dG(P,T)*1000/(R*T);}
function kText(P,T){const l=lnK(P,T),l10=l/Math.LN10;if(Math.abs(l10)<3)return Math.exp(l).toPrecision(3);const e=Math.floor(l10);return Math.pow(10,l10-e).toFixed(1)+' × 10'+CL.sup(String(e).replace('-','−'));}

/* ---------- spreading box ---------- */
const BX=40,BY=100,BW=460,BH=250,MID=BX+BW/2,PR=6;
function seedGas(N,seed){const r=rng(seed||17),G=[];for(let i=0;i<N;i++){const a=r()*6.283,v=110+70*r();G.push({x:BX+PR+2+r()*(BW/2-2*PR-4),y:BY+PR+2+r()*(BH-2*PR-4),vx:Math.cos(a)*v,vy:Math.sin(a)*v});}return G;}
function nLeft(st){let n=0;st.G.forEach(g=>{if(g.x<MID)n++;});return n;}

/* ---------- mode syncing ---------- */
function syncMode(sim){const p=sim.p;if(!atLeast('honors')&&p.mode==='gibbs')BioLab.setValues(sim,{mode:'spread'});if(!sim.ui||!sim.ui.sec)return;const mode=p.mode,d=sim.def;
  d.controls.forEach(c=>{if(!c.modes)return;const cid=d.id+'-'+c.id,e=document.getElementById(cid)||document.getElementById(cid+'-l');if(!e)return;const w=e.closest('.ctl');if(w)w.hidden=!atLeast(c.lvl)||!c.modes.includes(mode);});
  d.metrics.forEach(m=>{if(!m.modes)return;const t=sim.ui.tiles[m.id];if(!t)return;const w=t.num.closest('.tile');if(w)w.hidden=!atLeast(m.lvl)||!m.modes.includes(mode);});
  const btns=[...sim.ui.sec.querySelectorAll('.actions button')];d.actions.forEach(a=>{const b=btns.find(x=>x.textContent===a.label);if(b)b.hidden=!atLeast(a.lvl)||!a.modes.includes(mode);});
  const want=mode==='spread'?'nL':'dg';if(sim.ui.gm&&[...sim.ui.gm.options].some(o=>o.value===want)){sim.gMetric=want;sim.ui.gm.value=want;}}

/* ---------- drawing helpers ---------- */
function panel(ctx,t,k,sz){let s=sz||15;ctx.font='700 '+s*k+'px '+FONT;while(s>12&&ctx.measureText(t).width>740){s-=0.5;ctx.font='700 '+s*k+'px '+FONT;}const w=ctx.measureText(t).width,h=s*k*1.35+14;
  rr(ctx,12,10,w+28,h,10);ctx.fillStyle=PAL['card'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();txt(ctx,t,26,10+h/2,{s:s*k,w:700,b:'middle'});return 10+h;}
function ball(ctx,x,y,r,c){CL.drawAtom(ctx,x,y,r,'',{color:c,label:''});}
function arrowH(ctx,x1,x2,y,c,w){ctx.strokeStyle=c;ctx.fillStyle=c;ctx.lineWidth=w;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x1,y);ctx.lineTo(x2-10,y);ctx.stroke();ctx.beginPath();ctx.moveTo(x2,y);ctx.lineTo(x2-14,y-8);ctx.lineTo(x2-14,y+8);ctx.closePath();ctx.fill();}

function drawSpread(sim,ctx,vdt,k,t){const p=sim.p,st=sim.st,N=st.G.length,nL=nLeft(st),hn=hon(),A=ap();
  panel(ctx,p.wall?N+' gas particles, all held on the left by a divider':'Divider removed: '+N+' particles free to go anywhere',k);
  ctx.fillStyle=PAL['cv-bg2'];rr(ctx,BX,BY,BW,BH,8);ctx.fill();ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=3;rr(ctx,BX,BY,BW,BH,8);ctx.stroke();
  ctx.setLineDash([5,5]);ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(MID,BY+4);ctx.lineTo(MID,BY+BH-4);ctx.stroke();ctx.setLineDash([]);
  if(p.wall){ctx.fillStyle=PAL['cv-glass'];ctx.fillRect(MID-4,BY,8,BH);}
  st.G.forEach((g,i)=>ball(ctx,g.x,g.y,PR,g.x<MID?'#3f6fb0':'#c27a00'));
  pill(ctx,'Left: '+nL,BX+BW/4,BY-4-10*k,PAL['card'],PAL['cv-ink'],13*k);pill(ctx,'Right: '+(N-nL),BX+3*BW/4,BY-4-10*k,PAL['card'],PAL['cv-ink'],13*k);
  // arrangements chart
  const cx=528,cw=260,cy=124,ch=212,max=lnC(N,Math.floor(N/2));
  txt(ctx,'Ways to arrange them',cx+cw/2,cy-12,{s:13*k,w:700,a:'center',c:PAL['cv-soft']});
  ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx,cy+ch);ctx.lineTo(cx+cw,cy+ch);ctx.stroke();
  const bw=cw/(N+1);for(let n=0;n<=N;n++){const h=ch*Math.exp(lnC(N,n)-max);if(h<0.4&&n!==nL)continue;ctx.fillStyle=n===nL?PAL['s4']:PAL['s2'];ctx.globalAlpha=n===nL?1:0.55;ctx.fillRect(cx+n*bw+bw*0.1,cy+ch-Math.max(h,n===nL?3:0),Math.max(1,bw*0.8),Math.max(h,n===nL?3:0));}ctx.globalAlpha=1;
  if(st.obsT>0.5){ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2;ctx.beginPath();let first=true;const mo=Math.max(...st.obs);for(let n=0;n<=N;n++){const v=st.obs[n]/mo*ch;const x=cx+(n+0.5)*bw,y=cy+ch-v;first?ctx.moveTo(x,y):ctx.lineTo(x,y);first=false;}ctx.stroke();}
  txt(ctx,'0',cx,cy+ch+16*k,{s:12*k,a:'center',c:PAL['cv-soft']});txt(ctx,String(N),cx+cw,cy+ch+16*k,{s:12*k,a:'center',c:PAL['cv-soft']});txt(ctx,'on the left',cx+cw/2,cy+ch+16*k,{s:12*k,a:'center',c:PAL['cv-soft']});
  // the two key counts, under the box
  txt(ctx,'All '+N+' on the left: 1 way out of '+sciE(N*Math.LN2),BX,BY+BH+22*k,{s:13*k,w:600});const wn=lnC(N,nL);
  txt(ctx,'Right now ('+nL+' left): '+sciE(wn)+(wn<0.01?' way':' ways'),BX,BY+BH+43*k,{s:13*k,w:600,c:PAL['cv-soft']});}

/* predict cartoons */
function initBox(key,side,P,x0,y0,w,h){const r=rng(key.length*31+(side==='A'?7:3)),list=[];const groups=P[side];
  const solids=groups.filter(g=>g.ph==='s'),tot=solids.reduce((a,b)=>a+b.n,0),cols=Math.max(1,Math.ceil(Math.sqrt(tot*1.6))),lay=solids.some(g=>g.layers),sp=lay?24:21;
  const cells=[];for(let j=0;j<tot;j++){const cc=j%cols,rw=Math.floor(j/cols);cells.push({x:x0+w/2-(cols-1)*sp/2+cc*sp+(lay?(rw%2)*10:0),y:y0+h-18-rw*(lay?18:21),par:(cc+rw)%2});}
  const take=(par)=>{let i=cells.findIndex(c=>!c.used&&(par===null||c.par===par));if(i<0)i=cells.findIndex(c=>!c.used);cells[i].used=true;return cells[i];};
  groups.forEach((g,gi)=>{const si=solids.indexOf(g);for(let i=0;i<g.n;i++){let x,y,home=null;
    if(g.ph==='s'){const c=take(solids.length===2?si:null);x=c.x;y=c.y;home=[x,y];}
    else if(g.ph==='l'){x=x0+16+r()*(w-32);y=y0+h*0.62+r()*(h*0.38-14);}
    else{x=x0+16+r()*(w-32);y=y0+16+r()*(h-32);}
    const a=r()*6.283;list.push({g,x,y,home,vx:Math.cos(a),vy:Math.sin(a),ph:r()*6.283});}});return list;}
function drawBox(sim,ctx,vdt,k,t,side,x0,y0,w,h){const P=proc(sim.p),key=sim.p.proc+side,v=sim.vis;v.box=v.box||{};if(!v.box[key])v.box[key]=initBox(key,side,P,x0,y0,w,h);
  ctx.fillStyle=P.water?PAL['cv-water']:PAL['cv-bg2'];rr(ctx,x0,y0,w,h,8);ctx.fill();ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2.5;rr(ctx,x0,y0,w,h,8);ctx.stroke();
  const L=v.box[key];if(L.some(q=>q.g.ph==='l')){ctx.fillStyle=PAL['cv-water'];ctx.globalAlpha=0.6;rr(ctx,x0+3,y0+h*0.56,w-6,h*0.44-3,6);ctx.fill();ctx.globalAlpha=1;}
  L.forEach(q=>{const sp=q.g.ph==='g'?120:q.g.ph==='aq'?30:q.g.ph==='l'?18:0;
    if(vdt>0&&!RM&&sp){q.x+=q.vx*sp*vdt;q.y+=q.vy*sp*vdt;if(q.g.ph!=='g'){q.vx+=(Math.random()-0.5)*3*vdt*10;q.vy+=(Math.random()-0.5)*3*vdt*10;const m=Math.hypot(q.vx,q.vy)||1;q.vx/=m;q.vy/=m;}
      const top=q.g.ph==='l'?y0+h*0.62:y0+12;if(q.x<x0+12){q.x=x0+12;q.vx=Math.abs(q.vx);}if(q.x>x0+w-12){q.x=x0+w-12;q.vx=-Math.abs(q.vx);}if(q.y<top){q.y=top;q.vy=Math.abs(q.vy);}if(q.y>y0+h-12){q.y=y0+h-12;q.vy=-Math.abs(q.vy);}}
    let x=q.x,y=q.y;if(q.home){const A=RM?0:1.3;x=q.home[0]+Math.sin(t*15+q.ph)*A;y=q.home[1]+Math.cos(t*13+q.ph)*A;}
    ball(ctx,x,y,q.g.ph==='g'?7:10,q.g.c);});}
function drawPredict(sim,ctx,vdt,k,t){const p=sim.p,P=proc(p),hn=hon();
  panel(ctx,P.n+':  '+P.eq,k);
  const y0=96,h=210,w=290;drawBox(sim,ctx,vdt,k,t,'B',30,y0,w,h);drawBox(sim,ctx,vdt,k,t,'A',480,y0,w,h);arrowH(ctx,340,460,y0+h/2,PAL['cv-ink'],4);
  txt(ctx,'Before',175,y0+h+22*k,{s:13*k,w:700,a:'center',c:PAL['cv-soft']});txt(ctx,'After',625,y0+h+22*k,{s:13*k,w:700,a:'center',c:PAL['cv-soft']});
  const leg=(groups,cx)=>{ctx.font='700 '+12*k+'px '+FONT;const items=groups.map(g=>g.f+'('+g.ph+')');let wt=0;items.forEach(s=>wt+=ctx.measureText(s).width+18*k);let x=cx-wt/2+6*k;const y=y0+h+44*k;
    groups.forEach((g,i)=>{ctx.fillStyle=g.c;ctx.beginPath();ctx.arc(x,y,6*k,0,6.29);ctx.fill();txt(ctx,items[i],x+9*k,y,{s:12*k,w:700,b:'middle'});x+=ctx.measureText(items[i]).width+18*k;});};
  leg(P.B,175);leg(P.A,625);
  const lab=p.reveal?(P.dS>0?'ΔS > 0: more spread out':'ΔS < 0: less spread out')+(hn?'  ('+sgn(P.dS,1)+' J/K)':''):'Predict: does entropy go up or down?';
  pill(ctx,lab,400,428,p.reveal?(P.dS>0?PAL['s3']:PAL['s1']):PAL['card'],p.reveal?'#fff':PAL['cv-ink'],13*k);}

function drawGibbs(sim,ctx,k){const p=sim.p,P=proc(p),T=p.T,G=dG(P,T),Tc=Tcross(P),hn=hon(),A=ap();
  panel(ctx,P.eq+'   ΔH° = '+sgn(P.dH,1)+' kJ,  ΔS° = '+sgn(P.dS,1)+' J/K',k,14);
  // ΔG vs T plot
  const L=88,Tp=88,W=410,H=232,T0=0,T1=1600,g0=dG(P,T0),g1=dG(P,T1),gmax=Math.max(10,g0,g1,0)*1.08,gmin=Math.min(-10,g0,g1,0)*1.08;
  const X=v=>L+(v-T0)/(T1-T0)*W,Y=v=>Tp+(gmax-v)/(gmax-gmin)*H;
  ctx.fillStyle=PAL['cv-bg2'];ctx.fillRect(L,Tp,W,H);
  ctx.fillStyle=PAL['s3'];ctx.globalAlpha=0.12;ctx.fillRect(L,Y(0),W,Tp+H-Y(0));ctx.globalAlpha=1;
  txt(ctx,'spontaneous (ΔG < 0)',L+W-8,Tp+H-10,{s:12*k,w:700,a:'right',c:PAL['s3']});txt(ctx,'not spontaneous',L+W-8,Tp+14*k,{s:12*k,w:700,a:'right',c:PAL['cv-soft']});
  ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(L,Y(0));ctx.lineTo(L+W,Y(0));ctx.stroke();
  ctx.strokeStyle=PAL['cv-soft'];ctx.beginPath();ctx.moveTo(L,Tp);ctx.lineTo(L,Tp+H);ctx.lineTo(L+W,Tp+H);ctx.stroke();
  for(let v=0;v<=1600;v+=400){txt(ctx,String(v),X(v),Tp+H+16*k,{s:12*k,a:'center',c:PAL['cv-soft']});}
  [gmax/1.08,0,gmin/1.08].forEach(v=>{if(Math.abs(v)<1&&v!==0)return;txt(ctx,v===0?'0':sgn(Math.round(v),0),L-4,Y(v),{s:12*k,a:'right',b:'middle',c:PAL['cv-soft']});});
  txt(ctx,'Temperature (K)',L+W/2,Tp+H+34*k,{s:12*k,a:'center',c:PAL['cv-soft']});
  ctx.save();ctx.translate(18,Tp+H/2);ctx.rotate(-Math.PI/2);txt(ctx,'ΔG (kJ)',0,0,{s:12*k,a:'center',c:PAL['cv-soft']});ctx.restore();
  ctx.save();ctx.beginPath();ctx.rect(L,Tp,W,H);ctx.clip();ctx.strokeStyle=PAL['s5'];ctx.lineWidth=3.5;ctx.beginPath();ctx.moveTo(X(T0),Y(g0));ctx.lineTo(X(T1),Y(g1));ctx.stroke();ctx.restore();
  if(Number.isFinite(Tc)&&Tc<T1){ctx.setLineDash([4,4]);ctx.strokeStyle=PAL['s4'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(X(Tc),Tp);ctx.lineTo(X(Tc),Tp+H);ctx.stroke();ctx.setLineDash([]);
    if(A)pill(ctx,'T = '+Tc.toFixed(0)+' K',clamp(X(Tc),L+60,L+W-60),Y(0)-22*k,PAL['s4'],'#fff',12*k);}
  ctx.fillStyle=PAL['s4'];ctx.beginPath();ctx.arc(X(T),Y(G),8,0,6.29);ctx.fill();ctx.strokeStyle=PAL['card'];ctx.lineWidth=2;ctx.stroke();
  // four sign cases
  const qx=604,cw=92,qy=96,chh=16*k+10,cs=caseOf(P);
  txt(ctx,'ΔS > 0',qx+cw*0.5,qy,{s:12*k,w:700,a:'center',c:PAL['cv-soft']});txt(ctx,'ΔS < 0',qx+cw*1.5,qy,{s:12*k,w:700,a:'center',c:PAL['cv-soft']});
  [['ΔH < 0','always','low'],['ΔH > 0','high','never']].forEach(([lab,a,b],ri)=>{const y=qy+8+ri*(chh+4);[a,b].forEach((c,ci)=>{const x=qx+ci*cw;rr(ctx,x+2,y,cw-4,chh,7);
    ctx.fillStyle=c===cs?PAL['s5']:PAL['card'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
    const word={always:'always',never:'never',low:'low T',high:'high T'}[c];txt(ctx,word,x+cw/2,y+chh/2+1,{s:13*k,w:700,a:'center',b:'middle',c:c===cs?'#fff':PAL['cv-ink']});});
    txt(ctx,lab,qx-6,y+chh/2+1,{s:12*k,w:700,a:'right',b:'middle',c:PAL['cv-soft']});});
  // tug of war bars: ΔH and −TΔS add up to ΔG
  const by=qy+8+2*(chh+4)+16,bx=610,bwid=178,bh=12*k+4,gap=bh+8,vals=[['ΔH',P.dH],['−TΔS',-T*P.dS/1000],['ΔG',G]],sc=bwid/2/Math.max(20,...vals.map(v=>Math.abs(v[1])));
  ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(bx+bwid/2,by-6);ctx.lineTo(bx+bwid/2,by+3*gap-2);ctx.stroke();
  vals.forEach(([lab,v],i)=>{const y=by+i*gap,x0=bx+bwid/2,w=v*sc;ctx.fillStyle=i===2?(v<0?PAL['s3']:PAL['s1']):(v<0?'#2d6bd2':'#c0392b');rr(ctx,Math.min(x0,x0+w),y,Math.max(2,Math.abs(w)),bh,5);ctx.fill();
    txt(ctx,lab,bx-8,y+bh/2+1,{s:13*k,w:700,a:'right',b:'middle'});if(hn)txt(ctx,sgn(v,1),v<0?x0+6:x0-6,y+bh/2+1,{s:12*k,w:700,a:v<0?'left':'right',b:'middle',c:PAL['cv-soft']});});
  const lab=G<0?'Spontaneous at '+T.toFixed(0)+' K'+(hn?': ΔG = '+sgn(G,1)+' kJ':''):'Not spontaneous at '+T.toFixed(0)+' K'+(hn?': ΔG = '+sgn(G,1)+' kJ':'');
  pill(ctx,lab,L+W/2,428,G<0?PAL['s3']:PAL['s1'],'#fff',13*k);
  if(A)pill(ctx,'K = '+kText(P,T),bx+bwid/2-10,428,PAL['card'],PAL['cv-ink'],13*k);}

/* ---------- the sim ---------- */
const SPR=['spread'],PRE=['predict'],GIB=['gibbs'];
const GB={
  id:'gibbs',hash:'gibbs',apUnit:15,order:1,tab:'Entropy and free energy',kind:'Simulation',
  prereq:['enthalpy','kmt'],next:['equilibrium','galvanic','coldpack'],
  card:'Remove a divider and count the ways gas particles can spread, predict the sign of ΔS, then find the temperature where a reaction turns spontaneous.',
  title:'Entropy and Gibbs free energy',
  lede:{bio:'Things spread out because there are far more ways to be spread out than to be bunched up. Remove the divider and watch it happen.',
        honors:'Predict the sign of ΔS for phase changes, dissolving and reactions, then see how ΔH and TΔS decide whether a process is spontaneous.',
        ap:'Use ΔG° = ΔH° − TΔS° with real data to find crossover temperatures, connect ΔG° to K with ΔG° = −RT ln K, and tell thermodynamic control from kinetic control.'},
  scale:{bio:'Particle scale: each ball is one gas molecule. A real box would hold about 10²² molecules, so the patterns you see here are overwhelming in real life.',honors:'Each ball is one molecule. Energies are per mole of reaction as written, at 1 bar.'},
  timeScale:1,dtMax:0.02,sampleDt:0.1,window:20,unit:'s',chChange:1,chReveal:12,
  controls:[
    {id:'mode',label:'View',type:'seg',def:'spread',lvl:'bio',options:[{v:'spread',l:'Spreading out'},{v:'predict',l:'Predict ΔS'},{v:'gibbs',l:'ΔG and temperature',lvl:'honors'}],onChange(sim){syncMode(sim);}},
    {id:'N',label:'Number of particles',type:'range',min:4,max:100,step:2,def:40,lvl:'bio',modes:SPR,onChange(sim){sim.st=sim.def.init(sim);}},
    {id:'wall',label:'Divider in place',type:'toggle',def:true,lvl:'bio',modes:SPR,help:'Turn it off to let the particles go anywhere in the box.'},
    {id:'proc',label:'Process',type:'select',def:'boil',lvl:'bio',modes:PRE,options:PORDER.map(k=>({v:k,l:PROC[k].n})),onChange(sim){BioLab.setValues(sim,{reveal:false});}},
    {id:'reveal',label:'Show the answer',type:'toggle',def:false,lvl:'bio',modes:PRE},
    {id:'rx',label:'Reaction',type:'select',def:'caco3',lvl:'honors',modes:GIB,options:GORDER.map(k=>({v:k,l:PROC[k].n}))},
    {id:'T',label:'Temperature',type:'range',min:100,max:1500,step:1,def:298,unit:' K',lvl:'honors',modes:GIB,help:'298 K = 25 °C. Add 273 to a Celsius temperature to get kelvins.'}
  ],
  actions:[
    {id:'back',label:'Put them all back on the left',lvl:'bio',modes:SPR,run(sim){BioLab.setValues(sim,{wall:true});sim.st=sim.def.init(sim);}},
    {id:'open',label:'Remove the divider',lvl:'bio',modes:SPR,primary:true,run(sim){BioLab.setValues(sim,{wall:false});}},
    {id:'cross',label:'Jump to the crossover temperature',lvl:'ap',modes:GIB,run(sim){const Tc=Tcross(proc(sim.p));if(Number.isFinite(Tc))BioLab.setValues(sim,{T:clamp(Math.round(Tc),100,1500)});}}
  ],
  init(sim){const N=sim.p.N;return {G:seedGas(N,N*13+5),obs:new Array(N+1).fill(0),obsT:0};},
  step(sim,dt){const p=sim.p,st=sim.st;if(p.mode!=='spread')return;const lo=BX+PR,hi=BX+BW-PR,top=BY+PR,bot=BY+BH-PR;
    st.G.forEach(g=>{const wasL=g.x<MID;g.x+=g.vx*dt;g.y+=g.vy*dt;if(g.y<top){g.y=top;g.vy=Math.abs(g.vy);}if(g.y>bot){g.y=bot;g.vy=-Math.abs(g.vy);}if(g.x<lo){g.x=lo;g.vx=Math.abs(g.vx);}if(g.x>hi){g.x=hi;g.vx=-Math.abs(g.vx);}
      if(p.wall){if(wasL&&g.x>MID-4-PR){g.x=MID-4-PR;g.vx=-Math.abs(g.vx);}else if(!wasL&&g.x<MID+4+PR){g.x=MID+4+PR;g.vx=Math.abs(g.vx);}}});
    if(!p.wall){const n=nLeft(st);if(st.obs.length===st.G.length+1){st.obs[n]+=dt;st.obsT+=dt;}}},
  metrics:[
    {id:'nL',label:'Particles on the left',unit:'',lvl:'bio',min:0,max:100,d:0,modes:SPR,get:s=>s.p.mode==='spread'?nLeft(s.st):NaN},
    {id:'fL',label:'Share on the left',unit:'%',lvl:'bio',min:0,max:100,d:0,modes:SPR,get:s=>s.p.mode==='spread'?100*nLeft(s.st)/s.st.G.length:NaN},
    {id:'W',label:'Arrangements with this split, W',unit:'',lvl:'honors',text:true,modes:SPR,get:s=>s.p.mode!=='spread'?'':sciE(lnC(s.st.G.length,nLeft(s.st)))},
    {id:'Pall',label:'Chance of finding all on the left',unit:'',lvl:'honors',text:true,modes:SPR,get:s=>{if(s.p.mode!=='spread')return '';const N=s.st.G.length,l10=-N*Math.log10(2);return N<=20?'1 in '+Math.pow(2,N).toLocaleString('en-US'):'1 in '+sciE(N*Math.LN2);}},
    {id:'S',label:'S = k ln W for this split',unit:'J/K',lvl:'ap',text:true,modes:SPR,get:s=>s.p.mode!=='spread'?'':CL.sci(1.380649e-23*lnC(s.st.G.length,nLeft(s.st)),'',3)},
    {id:'dSm',label:'ΔS for 1 mol doubling its volume, R ln 2',unit:'J/mol·K',lvl:'ap',min:0,max:10,d:2,modes:SPR,get:s=>s.p.mode==='spread'?R*Math.LN2:NaN},
    {id:'sign',label:'Entropy change',unit:'',lvl:'bio',text:true,modes:PRE,get:s=>s.p.mode!=='predict'?'':!s.p.reveal?'Make a prediction, then show the answer':proc(s.p).dS>0?'Increases (ΔS > 0)':'Decreases (ΔS < 0)'},
    {id:'dSv',label:'ΔS°',unit:'J/K',lvl:'honors',min:-400,max:200,d:1,modes:PRE,get:s=>s.p.mode==='predict'&&s.p.reveal?proc(s.p).dS:NaN},
    {id:'gas',label:'Moles of gas, before → after',unit:'',lvl:'honors',text:true,modes:PRE,get:s=>{if(s.p.mode!=='predict')return '';const g=proc(s.p).gas;return g[0]+' → '+g[1];}},
    {id:'dH',label:'ΔH°',unit:'kJ',lvl:'honors',min:-600,max:300,d:1,modes:GIB,get:s=>s.p.mode==='gibbs'?proc(s.p).dH:NaN},
    {id:'dS',label:'ΔS°',unit:'J/K',lvl:'honors',min:-400,max:200,d:1,modes:GIB,get:s=>s.p.mode==='gibbs'?proc(s.p).dS:NaN},
    {id:'TdS',label:'TΔS',unit:'kJ',lvl:'honors',min:-500,max:300,d:1,modes:GIB,get:s=>s.p.mode==='gibbs'?s.p.T*proc(s.p).dS/1000:NaN},
    {id:'dG',label:'ΔG = ΔH − TΔS',unit:'kJ',lvl:'honors',min:-600,max:300,d:1,modes:GIB,get:s=>s.p.mode==='gibbs'?dG(proc(s.p),s.p.T):NaN},
    {id:'spont',label:'At this temperature',unit:'',lvl:'honors',text:true,modes:GIB,get:s=>s.p.mode!=='gibbs'?'':dG(proc(s.p),s.p.T)<0?'Spontaneous (ΔG < 0)':'Not spontaneous (ΔG > 0)'},
    {id:'case',label:'Sign case',unit:'',lvl:'honors',text:true,modes:GIB,get:s=>s.p.mode!=='gibbs'?'':CASE[caseOf(proc(s.p))]},
    {id:'Tc',label:'Crossover temperature, ΔH ÷ ΔS',unit:'',lvl:'ap',text:true,modes:GIB,get:s=>{if(s.p.mode!=='gibbs')return '';const t=Tcross(proc(s.p));return Number.isFinite(t)?t.toFixed(0)+' K ('+(t-273.15).toFixed(0)+' °C)':'None: ΔH and ΔS have opposite signs';}},
    {id:'K',label:'K = e^(−ΔG°/RT)',unit:'',lvl:'ap',text:true,modes:GIB,get:s=>s.p.mode!=='gibbs'?'':kText(proc(s.p),s.p.T)}
  ],
  graphs:[{id:'nL',label:'Particles on the left vs time',lvl:'bio',lines:['nL']},{id:'hist',label:'How often each split happened',lvl:'honors',custom:true},{id:'dg',label:'ΔG vs temperature, every reaction',lvl:'honors',custom:true}],
  defaultGraph:'nL',
  plot(sim,ctx,box,id){const p=sim.p;
    if(id==='hist'){const st=sim.st,N=st.G.length;if(st.obsT<0.5){txt(ctx,'Remove the divider and let it run to build up the counts.',box.cw/2,box.ch/2,{s:15,c:PAL['muted'],a:'center',b:'middle'});return;}
      const max=lnC(N,Math.floor(N/2)),tot=Math.exp(N*Math.LN2),pr=n=>Math.exp(lnC(N,n))/tot,ob=n=>st.obs[n]/st.obsT;const ymax=Math.max(pr(Math.floor(N/2)),...st.obs.map((v,i)=>ob(i)))*1.15;
      const ax=axes(ctx,box,{xmin:0,xmax:N,ymin:0,ymax,xl:'Particles on the left',yl:'Fraction of the time'});
      for(let n=0;n<=N;n++){const x=ax.X(n),w=Math.max(2,(ax.X(1)-ax.X(0))*0.7);ctx.fillStyle=PAL['g-dot'];ctx.fillRect(x-w/2,ax.Y(ob(n)),w,ax.Y(0)-ax.Y(ob(n)));}
      ctx.strokeStyle=PAL['muted'];ctx.setLineDash([5,4]);ctx.lineWidth=2;ctx.beginPath();for(let n=0;n<=N;n++){n?ctx.lineTo(ax.X(n),ax.Y(pr(n))):ctx.moveTo(ax.X(n),ax.Y(pr(n)));}ctx.stroke();ctx.setLineDash([]);
      legend(ctx,box.L+12,box.T+10,[{label:'observed',color:PAL['g-dot']},{label:'W ÷ 2ᴺ (counting)',color:PAL['muted'],dash:true}]);return;}
    const keys=GORDER,lines=keys.map(k=>PROC[k]),ymin=-650,ymax=350;const ax=axes(ctx,box,{xmin:0,xmax:1500,ymin,ymax,xl:'Temperature (K)',yl:'ΔG (kJ)'});
    ctx.save();ctx.beginPath();ctx.rect(box.L,box.T,box.W,box.H);ctx.clip();keys.forEach((k,i)=>{const P=PROC[k],on=k===p.rx;ctx.strokeStyle=on?PAL['s5']:PAL['muted'];ctx.globalAlpha=on?1:0.35;ctx.lineWidth=on?3.5:1.5;ctx.beginPath();ctx.moveTo(ax.X(0),ax.Y(dG(P,0)));ctx.lineTo(ax.X(1500),ax.Y(dG(P,1500)));ctx.stroke();ctx.globalAlpha=1;});
    ctx.fillStyle=PAL['s4'];ctx.beginPath();ctx.arc(ax.X(p.T),ax.Y(dG(proc(p),p.T)),5,0,6.29);ctx.fill();ctx.restore();
    legend(ctx,box.L+12,box.T+10,[{label:proc(p).n,color:PAL['s5']},{label:'other reactions',color:PAL['muted']}]);},
  narrate(sim){const p=sim.p,hn=hon();
    if(p.mode==='spread'){const st=sim.st,N=st.G.length,nL=nLeft(st);
      if(p.wall&&nL===N)return 'All '+N+' particles are trapped on the left. There is only <b>1 way</b> to have every particle on the left. Remove the divider and see what happens.';
      if(p.wall)return 'The divider is back, so particles stay on whichever side they were on: '+nL+' left and '+(N-nL)+' right.';
      return 'Each particle moves at random, yet they <b>spread out and stay spread out</b>. There are '+sciE(lnC(N,Math.floor(N/2)))+' ways to split them half and half but only 1 way to have them all on the left, so spreading out is overwhelmingly likely. That is entropy.';}
    if(p.mode==='predict'){const P=proc(p);if(!p.reveal)return 'Compare the particles before and after. Ask: does the matter get more spread out (more ways to arrange it) or less? Then turn on <b>Show the answer</b>.';
      return (P.dS>0?'<b>Entropy increases</b>':'<b>Entropy decreases</b>')+': '+({melt:'the rigid crystal becomes a liquid that can flow.',freeze:'the moving liquid locks into a crystal.',boil:'a liquid becomes a gas that fills the whole space.',nacl:'ions leave the crystal and spread through the water.',nh4no3:'ions leave the crystal and spread through the water.',h2:'3 moles of gas become 2 moles of liquid.',caco3:'a solid releases a gas.',haber:'4 moles of gas become 2 moles of gas.',h2o2:'a liquid releases a gas.',ozone:'3 moles of gas become 2 moles of gas.',diamond:'graphite’s layers are a little less ordered than diamond’s rigid network.'}[p.proc])+(hn?' ΔS° = '+sgn(P.dS,1)+' J/K.':'');}
    const P=proc(p),G=dG(P,p.T),Tc=Tcross(P);let s=G<0?'<b>Spontaneous at '+p.T.toFixed(0)+' K</b>: ΔG = '+sgn(G,1)+' kJ.':'<b>Not spontaneous at '+p.T.toFixed(0)+' K</b>: ΔG = '+sgn(G,1)+' kJ.';
    s+=' '+CASE[caseOf(P)]+'.';if(Number.isFinite(Tc))s+=' It switches at T = ΔH ÷ ΔS = '+Tc.toFixed(0)+' K.';
    if(P.slow&&G<0)s+=' But it is so slow that diamonds last for billions of years: <b>kinetic control</b>.';else if(p.rx==='h2'&&G<0&&p.T<700)s+=' A hydrogen–oxygen mix can sit for years until a spark gets it over its activation energy.';return s;},
  tour:[
    {title:'Particles held on one side',text:'Forty gas particles are trapped in the left half of the box by a divider. There is exactly one way to have all forty on the left.',focus:[BX-8,BY-34,BW+16,BH+42],speed:0.5,setup(sim){BioLab.setValues(sim,{mode:'spread',N:40,wall:true});sim.st=sim.def.init(sim);}},
    {title:'Remove the divider',text:'Each particle moves at random. Nothing pushes them to the right, yet within seconds about half are on each side.',focus:[BX-8,BY-34,BW+16,BH+42],speed:0.5,setup(sim){BioLab.setValues(sim,{wall:false});}},
    {title:'Count the arrangements',text:{bio:'The bars show how many ways there are to have each number of particles on the left. Half and half has by far the most ways, so that is what you almost always see.',honors:'W = N! ÷ (n_left! × n_right!). For 40 particles, a 20–20 split has 1.4 × 10¹¹ arrangements; all on the left has 1. Entropy measures this: S = k ln W.'},focus:[516,96,280,300],speed:1},
    {title:'Fewer particles',text:'With only 4 particles, all 4 land on the left now and then (1 time in 16). With a mole of particles, that never happens in the lifetime of the universe.',focus:[BX-8,BY-34,BW+16,BH+42],speed:1,setup(sim){BioLab.setValues(sim,{N:4,wall:false});sim.st=sim.def.init(sim);BioLab.setValues(sim,{wall:false});}},
    {title:'Predict ΔS',text:'In Predict ΔS, compare before and after. Gases are far more spread out than liquids, and liquids more than solids. More moles of gas usually means more entropy.',focus:[20,86,760,300],speed:1,setup(sim){BioLab.setValues(sim,{mode:'predict',proc:'boil',reveal:true});}},
    {lvl:'honors',title:'Enthalpy and entropy compete',text:'ΔG = ΔH − TΔS. A process is spontaneous when ΔG < 0. Limestone decomposing absorbs heat (ΔH > 0) but releases a gas (ΔS > 0), so it only goes at high temperature.',focus:[40,80,470,330],speed:1,setup(sim){BioLab.setValues(sim,{mode:'gibbs',rx:'caco3',T:298});}},
    {lvl:'honors',title:'Raise the temperature',text:'At 1300 K the −TΔS term outweighs ΔH, so ΔG turns negative. Lime kilns run near 1100–1200 K for exactly this reason.',focus:[[40,80,470,330],[528,210,262,170]],speed:1,setup(sim){BioLab.setValues(sim,{T:1300});}},
    {lvl:'ap',title:'ΔG° and K',text:'ΔG° = −RT ln K. A negative ΔG° means K > 1 (products favored); a positive one means K < 1. At the crossover temperature ΔG° = 0 and K = 1.',focus:[528,400,262,50],speed:1,setup(sim){BioLab.setValues(sim,{rx:'haber',T:298});}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{mode:'spread',N:40,wall:true,rx:'caco3',T:298});sim.st=sim.def.init(sim);},
  onChallenge(sim,ch,phase){if(ch&&ch.instant&&ch.set&&phase==='done'){BioLab.setValues(sim,ch.set);if(ch.set.N)sim.st=sim.def.init(sim);if(ch.set.wall===false)BioLab.setValues(sim,{wall:false});}},
  challenges:[
    {lvl:'bio',q:'40 particles start on the left. When you remove the divider, what will you see after a while?',choices:['They spread out and stay roughly half on each side','They spread out, then all drift back to the left','They pile up on the right side'],correct:0,
     baseline:{mode:'spread',N:40,wall:true},change:{wall:false},changeText:'Divider removed',reveal:14,watch:'nL',
     explain:{bio:'About 20 stay on each side, give or take a few. There are about 138 billion ways to split 40 particles evenly but only 1 way to put them all on the left, so the spread-out state is what you see.',honors:'The count wanders around 20 ± 3. W(20 left) = 40!/(20!·20!) ≈ 1.4 × 10¹¹, while W(all left) = 1. The chance of all 40 on the left at any moment is 1 in 1.1 × 10¹².'}},
    {lvl:'bio',instant:true,set:{mode:'spread',N:4,wall:false},q:'Now there are only 4 particles. After the divider is removed, will you ever see all 4 on the left again?',choices:['Never','Yes, now and then: about 1 time in 16','Yes, most of the time'],correct:1,
     explain:{bio:'The model now runs with 4 particles. Each one is on the left half the time, so all 4 are on the left (½)⁴ = 1/16 of the time. Watch the Left counter. With trillions of particles this chance becomes zero for all practical purposes.'}},
    {lvl:'bio',instant:true,set:{mode:'predict',proc:'boil',reveal:true},q:'Water boils into steam. What happens to the entropy of the water?',choices:['It increases','It decreases','It stays the same'],correct:0,
     explain:{bio:'Steam molecules fly through the whole space instead of sliding past each other in a liquid. There are many more ways to arrange them, so entropy increases.',honors:'ΔS° = +118.9 J/K per mole: gases have much higher entropy than liquids.'}},
    {lvl:'honors',instant:true,set:{mode:'predict',proc:'h2',reveal:true},q:'2H₂(g) + O₂(g) → 2H₂O(l). What is the sign of ΔS?',choices:['Positive','Negative','Zero'],correct:1,
     explain:{honors:'Three moles of gas become two moles of liquid, so the matter is much less spread out. ΔS° = −326.8 J/K. The reaction is still spontaneous at room temperature because ΔH = −571.6 kJ is so negative.'}},
    {lvl:'honors',instant:true,set:{mode:'gibbs',rx:'nh4no3',T:298},q:'Dissolving NH₄NO₃ is endothermic (ΔH = +25.7 kJ), yet it happens on its own at 25 °C. Why?',choices:['ΔS is positive, and TΔS (+32.4 kJ) is larger than ΔH, so ΔG < 0','Endothermic processes are always spontaneous','ΔH is actually negative'],correct:0,
     explain:{honors:'ΔS° = +108.7 J/K, so at 298 K TΔS = 32.4 kJ. ΔG = 25.7 − 32.4 = −6.7 kJ, negative: spontaneous. Entropy pays the energy cost. That is how an instant cold pack works.'}},
    {lvl:'honors',instant:true,set:{mode:'gibbs',rx:'caco3',T:298},q:'Will limestone (CaCO₃) decompose into CaO and CO₂ on its own at 25 °C?',choices:['Yes, because ΔS is positive','No, ΔG is positive at 25 °C','Yes, because every decomposition is spontaneous'],correct:1,
     explain:{honors:'ΔG = 178.3 − 298(0.1602) = +130.6 kJ at 298 K. ΔS is positive, but at room temperature TΔS (47.7 kJ) is far smaller than ΔH. Raise T to see ΔG turn negative.'}},
    {lvl:'ap',instant:true,set:{mode:'gibbs',rx:'caco3',T:1113},q:'For CaCO₃ → CaO + CO₂, ΔH° = +178.3 kJ and ΔS° = +160.2 J/K. Above what temperature is it spontaneous?',choices:['1113 K (about 840 °C)','1.11 K','298 K','840 K'],correct:0,
     explain:{ap:'Set ΔG = 0: T = ΔH ÷ ΔS = 178 300 J ÷ 160.2 J/K = 1113 K. Above that, ΔG < 0. Forgetting to change kJ to J gives 1.11 K. The model is now at 1113 K, where ΔG ≈ 0 and K ≈ 1. (Assumes ΔH and ΔS stay constant with temperature.)'}},
    {lvl:'ap',instant:true,set:{mode:'gibbs',rx:'haber',T:298},q:'For N₂ + 3H₂ → 2NH₃ at 298 K, ΔG° = −32.8 kJ. What does that say about K?',choices:['K > 1: products are favored at equilibrium','K < 1: reactants are favored','K = 0: no ammonia forms'],correct:0,
     explain:{ap:'ln K = −ΔG°/RT = 32 770 ÷ (8.314 × 298) = 13.2, so K ≈ 5.6 × 10⁵. Negative ΔG° means K > 1. Industry still runs the reaction hot (about 700 K) with a catalyst, because at 298 K it is far too slow, even though K is smaller at high T.'}},
    {lvl:'ap',instant:true,set:{mode:'gibbs',rx:'diamond',T:298},q:'Diamond → graphite has ΔG° = −2.9 kJ/mol at 25 °C. Why do diamonds last for billions of years?',choices:['The reaction has a huge activation energy, so it is too slow to observe','ΔG is really positive at room temperature','Diamond and graphite are at equilibrium'],correct:0,
     explain:{ap:'ΔG° < 0 says the change is thermodynamically favorable, but it says nothing about rate. Rearranging diamond’s carbon network needs an enormous activation energy, so the reaction is under kinetic control.'}}
  ],
  lab:{bio:'<p><b>Question:</b> Why do gases spread out?</p><ol><li>Start with 40 particles. Press <b>Remove the divider</b> and record a trial every few seconds.</li><li>Press <b>Put them all back on the left</b> and repeat with 10 and 4 particles.</li><li>For each number, watch for 30 seconds: does every particle ever end up on the left again?</li></ol><p>Use the “Ways to arrange them” chart to explain why spread out is what you almost always see.</p>',
       honors:'<p><b>Question:</b> How do ΔH and ΔS decide whether a process happens on its own?</p><ol><li>In Predict ΔS, predict the sign of ΔS for every process before you show the answer. Record your prediction and the real ΔS°.</li><li>In ΔG and temperature, pick limestone decomposition. Find ΔG at 298 K, 800 K and 1300 K.</li><li>Pick one reaction from each sign case and record whether it is spontaneous at 298 K and at 1300 K.</li></ol><p>Explain each sign case using the tug of war between ΔH and −TΔS.</p>',
       ap:'<p><b>Question:</b> How are ΔG°, temperature and K connected?</p><ol><li>For CaCO₃, the Haber process and ice melting, calculate the crossover temperature T = ΔH° ÷ ΔS° by hand, then check it with <b>Jump to the crossover temperature</b>.</li><li>Record K at 298 K and at 800 K for the Haber process.</li><li>Compare diamond → graphite with burning hydrogen.</li></ol><p><b>Claim–evidence–reasoning:</b> Explain why a negative ΔG° does not guarantee that a reaction happens at a noticeable rate, using thermodynamic and kinetic control.</p>'},
  terms:[{t:'Entropy (S)',d:'A measure of how spread out matter and energy are: the number of ways the particles can be arranged.'},{t:'Spontaneous',d:'Happens on its own without continuous outside help. It does not mean fast.'},{t:'Microstate',d:'One specific arrangement of all the particles. More microstates means higher entropy.'},
    {lvl:'honors',t:'ΔS',d:'Entropy change. Positive for melting, boiling, dissolving and reactions that make more moles of gas.'},{lvl:'honors',t:'Gibbs free energy (ΔG)',d:'ΔG = ΔH − TΔS. Negative ΔG means spontaneous at that temperature.'},{lvl:'honors',t:'Crossover temperature',d:'The temperature where ΔG = 0, T = ΔH ÷ ΔS. The process switches between spontaneous and not.'},
    {lvl:'ap',t:'S = k ln W',d:'Boltzmann’s equation linking entropy to the number of microstates W. k = 1.381 × 10⁻²³ J/K.'},{lvl:'ap',t:'ΔG° = −RT ln K',d:'Links standard free energy to the equilibrium constant. ΔG° < 0 means K > 1.'},{lvl:'ap',t:'Kinetic control',d:'When a thermodynamically favored reaction is too slow to happen because its activation energy is too high.'}],
  about:'<p><b>Spreading out.</b> Particles move in straight lines and bounce off the walls without hitting each other (an ideal gas). The divider blocks them; removing it lets each particle wander freely. The arrangement count is W = N! ÷ (n_L! n_R!), and the chance of a given split is W ÷ 2ᴺ. The “observed” histogram is the share of time the box spent at each split.</p>'+
    '<p><b>Thermodynamic data.</b> ΔH° and ΔS° at 25 °C and 1 bar from standard tables (NIST/CRC); ice melting and water freezing use values at 0 °C (6.01 kJ, 22.0 J/K). ΔG = ΔH − TΔS treats ΔH and ΔS as constant with temperature, which is a good approximation over a few hundred kelvins but not exact; real crossover temperatures can differ somewhat (CaCO₃ decomposes noticeably near 1100–1200 K at 1 bar of CO₂). K uses ΔG° at that temperature with the same approximation. The before/after particle pictures are sketches, not to scale.</p>',
  initVis(sim){sim.vis.box={};},
  draw(sim,ctx,vdt,k,t){ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);const m=sim.p.mode;if(m==='predict')drawPredict(sim,ctx,vdt,k,t);else if(m==='gibbs')drawGibbs(sim,ctx,k);else drawSpread(sim,ctx,vdt,k,t);},
  thumbSetup(sim){sim.p.wall=false;}
};
GB.onLevel=syncMode;
BioLab.register(GB);
})();
