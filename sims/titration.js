(function(){
'use strict';
const {clamp,lerp,rng,randn,rr,txt,pill,atLeast,PAL,FONT,RM,axes,legend,serColor,lvText}=BioLab.h;
const CL=window.ChemLab;
const KW=CL.K.Kw;
const N0=20;                       // analyte particles in the zoom
const ZX=355,ZY=190,ZR=98;        // zoom circle
const BX=85,B0=44,BMM=4.6;         // burette center x, y of the 0.00 mL mark, px per mL
const VMAX=50;
const DROP=0.05;                   // mL per drop
const CV={L:548,T:44,W:232,H:200}; // on-stage titration curve

/* ---------- chemistry: exact pH from the charge balance ---------- */
function solvePH(sys,na,cl){
  const f=pH=>{const h=Math.pow(10,-pH);let q=h-KW/h+na-cl;
    for(const s of sys){if(!(s.C>0))continue;const n=s.ka.length,t=[1];let prod=1;for(let i=1;i<=n;i++){prod*=s.ka[i-1]/h;t.push(prod);}
      const sum=t.reduce((a,b)=>a+b,0);let z=0;for(let i=0;i<=n;i++)z+=t[i]/sum*(s.z0-i);q+=s.C*z;}
    return q;};
  let lo=-1.5,hi=15.5;for(let i=0;i<64;i++){const m=(lo+hi)/2;if(f(m)>0)lo=m;else hi=m;}return (lo+hi)/2;}
const kaOf=f=>{const a=CL.acids.find(x=>x.f===f);return a?a.Ka:NaN;};
const KA_NH4=kaOf('NH4+');
const ACIDS={HC2H3O2:{f:'HC₂H₃O₂',an:'C₂H₃O₂⁻',n:'acetic acid',Ka:kaOf('HC2H3O2')},HCHO2:{f:'HCHO₂',an:'CHO₂⁻',n:'formic acid',Ka:kaOf('HCHO2')},
  HC7H5O2:{f:'HC₇H₅O₂',an:'C₇H₅O₂⁻',n:'benzoic acid',Ka:kaOf('HC7H5O2')},HClO:{f:'HClO',an:'ClO⁻',n:'hypochlorous acid',Ka:kaOf('HClO')}};
const TYPES={
  ss:{n:'Strong acid + strong base',flask:'HCl',flaskN:'HCl (unknown)',tit:'NaOH',titN:'NaOH',eq:'H₃O⁺ + OH⁻ → 2 H₂O',full:'HCl + NaOH → NaCl + H₂O'},
  ws:{n:'Weak acid + strong base',flask:'HA',tit:'NaOH',titN:'NaOH'},
  wb:{n:'Weak base + strong acid',flask:'NH₃',flaskN:'NH₃ (unknown)',tit:'HCl',titN:'HCl',eq:'NH₃ + H₃O⁺ → NH₄⁺ + H₂O',full:'NH₃ + HCl → NH₄Cl'},
  redox:{n:'Redox: KMnO₄ + H₂O₂',flask:'H₂O₂',flaskN:'H₂O₂ (unknown, in H₂SO₄)',tit:'KMnO₄',titN:'KMnO₄',eq:'2 MnO₄⁻ + 5 H₂O₂ + 6 H⁺',eq2:'→ 2 Mn²⁺ + 5 O₂ + 8 H₂O'}};
/* The unknown concentration of each kind of sample. It stays put through resets; "New unknown" draws a fresh one. */
const UNK={ss:0.0862,ws:0.1040,wb:0.0915,redox:0.0476};
const MARKS=[];                    // endpoints the student has marked: {type,unk,va,cb,V}
const IND={
  phenol:{n:'Phenolphthalein',range:'8.2–10.0',st:[[8.2,'#e0218a',0],[10,'#e0218a',1]],names:['colorless','pink']},
  btb:{n:'Bromothymol blue',range:'6.0–7.6',st:[[6.0,'#e3c31a',1],[6.8,'#3f9e4d',1],[7.6,'#2f5fc4',1]],names:['yellow','blue']},
  morange:{n:'Methyl orange',range:'3.1–4.4',st:[[3.1,'#d7301f',1],[3.8,'#ef7a1a',1],[4.4,'#f2c31b',1]],names:['red','yellow']},
  mred:{n:'Methyl red',range:'4.4–6.2',st:[[4.4,'#d7301f',1],[5.3,'#ee8a2a',1],[6.2,'#f2c31b',1]],names:['red','yellow']},
  none:{n:'No indicator'}};
function hex2(h){h=h.replace('#','');if(h.length===3)h=h.split('').map(c=>c+c).join('');return [0,2,4].map(i=>parseInt(h.slice(i,i+2),16));}
function mix(a,b,t){const A=hex2(a),B=hex2(b);return '#'+A.map((v,i)=>Math.round(lerp(v,B[i],clamp(t,0,1))).toString(16).padStart(2,'0')).join('');}
/* indicator color at a pH: [hex, alpha, name] */
function indAt(ind,pH){const I=IND[ind];if(!I||!I.st||!Number.isFinite(pH))return [null,0,'colorless'];const s=I.st,lo=s[0],hi=s[s.length-1];
  if(pH<=lo[0])return [lo[1],lo[2],I.names[0]];if(pH>=hi[0])return [hi[1],hi[2],I.names[1]];
  for(let i=1;i<s.length;i++)if(pH<=s[i][0]){const t=(pH-s[i-1][0])/(s[i][0]-s[i-1][0]);const a=lerp(s[i-1][2],s[i][2],t);return [mix(s[i-1][1],s[i][1],t),ind==='phenol'?Math.max(0.12,a):a,ind==='phenol'?'faint pink':ind==='btb'?'green':'orange'];}
  return [hi[1],hi[2],I.names[1]];}

function cfg(p){const t=TYPES[p.type]||TYPES.ss,C=p.gC>0?+p.gC:UNK[p.type],va=+p.va,ct=p.type==='redox'?(+p.cb)/5:+p.cb;
  const nA=C*va;                                   // mmol of analyte
  const nE=p.type==='redox'?nA*2/5:nA;              // mmol of titrant needed
  const acid=ACIDS[p.acid]||ACIDS.HC2H3O2;return {t,C,va,ct,nA,nE,Ve:nE/ct,acid};}
function pHat(p,V,c){c=c||cfg(p);if(p.type==='redox')return NaN;const Vt=c.va+V,nT=c.ct*V;
  if(p.type==='ss')return solvePH([],nT/Vt,c.nA/Vt);
  if(p.type==='ws')return solvePH([{C:c.nA/Vt,ka:[c.acid.Ka],z0:0}],nT/Vt,0);
  return solvePH([{C:c.nA/Vt,ka:[KA_NH4],z0:1}],0,nT/Vt);}
/* excess permanganate in the flask (M) */
function mnO4(p,V,c){c=c||cfg(p);const x=c.ct*V-c.nE;return x>0?x/(c.va+V):0;}
function flaskColor(p,V,c){c=c||cfg(p);const base=PAL['cv-water'];
  if(p.type==='redox'){const m=mnO4(p,V,c);if(m<=0)return [base,'colorless'];const a=clamp(0.22+0.55*Math.log10(1+m/2e-5)/1.3,0.22,0.92);return [mix(base,'#8e2a9e',a),a<0.4?'faint pink-purple':'purple'];}
  const [col,a,name]=indAt(p.ind,pHat(p,V,c));return col?[mix(base,col,a*0.85),name]:[base,'colorless'];}
function region(p,V,c){c=c||cfg(p);const f=V/c.Ve;if(V<=0)return 'start';if(Math.abs(V-c.Ve)<=0.03)return 'eq';if(f<0.9)return 'before';if(f<1)return 'near';return 'after';}

/* ---------- mode-aware UI ---------- */
function syncMode(sim){if(!sim.ui||!sim.ui.sec)return;
  // the game just ended: put back the bench the student had before it (the game's sample and settings go away)
  if(!sim.game&&sim._gBak){const b=sim._gBak;sim._gBak=null;delete sim.p.gC;BioLab.setValues(sim,Object.assign({rate:'closed'},b));BioLab.reset(sim);if(sim.vis)sim.vis.key='';}
  const db=dropBtn(sim);if(db)db.classList.toggle('primary',!sim.game);
  const mode=sim.p.type,d=sim.def;if(sim.mode==='vlab'&&sim.vlab){sim.infoDirty=true;return;}   // the virtual lab shows only its own bench controls
  d.controls.forEach(c=>{if(!c.modes)return;const cid=d.id+'-'+c.id,e=document.getElementById(cid)||document.getElementById(cid+'-l');if(!e)return;const w=e.closest('.ctl');if(w)w.hidden=!atLeast(c.lvl)||!c.modes.includes(mode);});
  d.metrics.forEach(m=>{if(!m.modes)return;const t=sim.ui.tiles[m.id];if(!t)return;const w=t.num.closest('.tile');if(w)w.hidden=!atLeast(m.lvl)||!m.modes.includes(mode);});
  sim.infoDirty=true;}
function setV(sim,V){const st=sim.st,p=sim.p,c=cfg(p);st.V=clamp(V,0,VMAX);st.pts=[];
  for(let v=0;v<st.V;v+=0.25)st.pts.push([v,p.type==='redox'?1000*mnO4(p,v,c):pHat(p,v,c)]);st.pts.push([st.V,p.type==='redox'?1000*mnO4(p,st.V,c):pHat(p,st.V,c)]);st.lastV=st.V;}
function addPoint(sim){const st=sim.st,p=sim.p,y=p.type==='redox'?1000*mnO4(p,st.V):pHat(p,st.V);const L=st.pts[st.pts.length-1];
  if(!L||st.V-L[0]>=0.1||Math.abs(y-L[1])>=0.06)st.pts.push([st.V,y]);}
function addVol(sim,dv){const st=sim.st;const before=st.V;st.V=Math.min(VMAX,st.V+dv);if(st.V>before)addPoint(sim);
  if(st.V>=VMAX&&sim.p.rate!=='closed')BioLab.setValues(sim,{rate:'closed'});}

/* ---------- particles (visual, rebuilt from the model state) ---------- */
const TIT_T={ss:'OH',ws:'OH',wb:'H3O',redox:'MnO4'};
const SPEC_T={ss:'Na',ws:'Na',wb:'Cl',redox:'K'};
function unitsAt(p,V,c){return (p.type==='redox'?8:N0)*c.ct*V/c.nE;}
function rp(r){const a=r()*6.283,d=Math.sqrt(r())*(ZR-14);return [Math.cos(a)*d,Math.sin(a)*d];}
function P(t,x,y){return {t,x,y,vx:randn()*12,vy:randn()*12,a:Math.random()*6.28,life:0,need:0};}
function rebuild(sim){const p=sim.p,v=sim.vis,c=cfg(p),r=rng(5),S=Math.min(64,Math.floor(unitsAt(p,sim.st.V,c)+1e-9)),L=[];
  const add=(t,n)=>{for(let i=0;i<n;i++){const q=rp(r);L.push(P(t,q[0],q[1]));}};
  if(p.type==='redox'){const used=Math.min(N0,Math.floor(2.5*S+1e-9)),reacted=Math.min(S,8);add('H2O2',N0-used);add('Mn',reacted);add('MnO4',S-reacted);add('K',S);
    const left=S<8?S:0;// a partly used permanganate keeps its remaining "need"
    v.mnIndex=S;}
  else{const rx=Math.min(S,N0);
    if(p.type==='ss'){add('H3O',N0-rx);add('Cl',N0);add('OH',S-rx);add('Na',S);}
    else if(p.type==='ws'){add('HA',N0-rx);add('A',rx);add('OH',S-rx);add('Na',S);}
    else{add('B',N0-rx);add('BH',rx);add('H3O',S-rx);add('Cl',S);}}
  v.P=L;v.S=S;v.key=p.type+'|'+p.va+'|'+p.cb+'|'+c.C;v.Vb=sim.st.V;}
function spawn(sim,c){const p=sim.p,v=sim.vis,x=randn()*12,y=-ZR+12;const T=P(TIT_T[p.type],x,y);T.vy=55;T.fresh=1;
  if(p.type==='redox'){const k=v.S;T.need=Math.floor(2.5*(k+1)+1e-9)-Math.floor(2.5*k+1e-9);}
  v.P.push(T);const s=P(SPEC_T[p.type],x+10,y+4);s.vy=40;v.P.push(s);v.S++;}
const PARTNER={OH:['H3O','HA'],H3O:['B'],MnO4:['H2O2']};
function stepParticles(sim,dt){const v=sim.vis,p=sim.p,R=ZR-10;if(!v.P||dt<=0)return;const out=[];
  for(const q of v.P){
    if(q.t==='W'){q.life-=dt;q.y-=6*dt;if(q.life>0)out.push(q);continue;}
    if(q.t==='O2'){q.y-=50*dt;q.x+=Math.sin(q.y*0.1)*0.6;if(q.y>-ZR-12)out.push(q);continue;}
    let steer=false;
    if(PARTNER[q.t]&&(q.t!=='MnO4'||q.need>0)&&!(q.t==='H3O'&&p.type!=='wb')){let best=null,bd=1e9;
      for(const o of v.P){if(o.dead||!PARTNER[q.t].includes(o.t))continue;const d=Math.hypot(o.x-q.x,o.y-q.y);if(d<bd){bd=d;best=o;}}
      if(best){steer=true;const dx=best.x-q.x,dy=best.y-q.y,d=Math.max(1,bd);q.vx+=dx/d*160*dt;q.vy+=dy/d*160*dt;
        if(bd<13){react(sim,q,best);}}}
    if(q.dead)continue;
    q.vx+=randn()*60*dt;q.vy+=randn()*60*dt;q.vx*=0.98;q.vy*=0.98;const sp=Math.hypot(q.vx,q.vy),mx=steer?70:(q.fresh?60:28);if(sp>mx){q.vx*=mx/sp;q.vy*=mx/sp;}
    q.x+=q.vx*dt;q.y+=q.vy*dt;q.a+=dt;const d=Math.hypot(q.x,q.y);if(d>R){q.x*=R/d;q.y*=R/d;q.vx*=-0.6;q.vy*=-0.6;q.fresh=0;}
    out.push(q);}
  v.P=out.filter(q=>!q.dead).concat(v.newP||[]);v.newP=[];}
function react(sim,q,o){const v=sim.vis;v.newP=v.newP||[];const mk=(t,x,y,life)=>{const w=P(t,x,y);w.life=life||1.6;v.newP.push(w);};
  const mx=(q.x+o.x)/2,my=(q.y+o.y)/2;v.flashP={x:mx,y:my,t:0.5};
  if(q.t==='OH'&&o.t==='H3O'){q.dead=true;o.dead=true;mk('W',mx-6,my,1.8);mk('W',mx+6,my,1.8);}
  else if(q.t==='OH'&&o.t==='HA'){q.dead=true;o.t='A';mk('W',mx,my,1.8);}
  else if(q.t==='H3O'&&o.t==='B'){q.dead=true;o.t='BH';mk('W',mx,my,1.8);}
  else if(q.t==='MnO4'&&o.t==='H2O2'){o.t='O2';q.need--;if(q.need<=0)q.t='Mn';}}

/* ---------- drawing helpers ---------- */
function ball(ctx,x,y,r,c,a){if(a!==undefined)ctx.globalAlpha=a;const g=ctx.createRadialGradient(x-r*.35,y-r*.35,r*.15,x,y,r);g.addColorStop(0,'#ffffff');g.addColorStop(.3,c);g.addColorStop(1,CL.shade(c,-0.35));ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,6.29);ctx.fill();ctx.strokeStyle=CL.shade(c,-0.5);ctx.lineWidth=1;ctx.stroke();ctx.globalAlpha=1;}
function sign(ctx,x,y,s,a){ctx.globalAlpha=a===undefined?1:a;ctx.font='800 11px '+FONT;ctx.fillStyle='#fff';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(s,x,y+0.5);ctx.globalAlpha=1;}
const COL={O:'#d8443a',H:'#f4f4f4',H3O:'#d22d68',A:'#d9822b',N:'#3a62e0',Cl:'#3fa65a',Na:'#8a5ad6',K:'#8a5ad6',Mn:'#e7a6c8',MnO4:'#7b2a90'};
function drawP(ctx,q,x,y,typ){switch(q.t){
  case 'H3O':ball(ctx,x,y,6.5,COL.H3O);sign(ctx,x,y,'+');break;
  case 'OH':{const hx=x+Math.cos(q.a)*7,hy=y+Math.sin(q.a)*7;ball(ctx,hx,hy,3.6,COL.H);ball(ctx,x,y,6.5,COL.O);sign(ctx,x,y,'−');break;}
  case 'W':{const a=clamp(q.life/1.8,0,1);ball(ctx,x-5,y+3,3.2,COL.H,a);ball(ctx,x+5,y+3,3.2,COL.H,a);ball(ctx,x,y,5.5,COL.O,a);break;}
  case 'HA':{const hx=x+Math.cos(q.a)*9,hy=y+Math.sin(q.a)*9;ball(ctx,hx,hy,4.2,COL.H);ball(ctx,x,y,7.5,COL.A);break;}
  case 'A':ball(ctx,x,y,7.5,COL.A);sign(ctx,x,y,'−');break;
  case 'B':{for(let i=0;i<3;i++){const a=q.a+i*2.09;ball(ctx,x+Math.cos(a)*7.5,y+Math.sin(a)*7.5,3,COL.H);}ball(ctx,x,y,7,COL.N);break;}
  case 'BH':{for(let i=0;i<4;i++){const a=q.a+i*1.57;ball(ctx,x+Math.cos(a)*7.5,y+Math.sin(a)*7.5,3,COL.H);}ball(ctx,x,y,7,COL.N);sign(ctx,x,y,'+');break;}
  case 'Cl':ball(ctx,x,y,6,COL.Cl,0.5);sign(ctx,x,y,'−',0.7);break;
  case 'Na':case 'K':ball(ctx,x,y,5,COL.Na,0.5);sign(ctx,x,y,'+',0.7);break;
  case 'H2O2':{const c=Math.cos(q.a),s=Math.sin(q.a);ball(ctx,x+c*9+s*4,y+s*9-c*4,3,COL.H);ball(ctx,x-c*9-s*4,y-s*9+c*4,3,COL.H);ball(ctx,x+c*4,y+s*4,5,COL.O);ball(ctx,x-c*4,y-s*4,5,COL.O);break;}
  case 'MnO4':ball(ctx,x,y,8,COL.MnO4);sign(ctx,x,y,'−');break;
  case 'Mn':ball(ctx,x,y,6.5,COL.Mn);sign(ctx,x,y,'+');break;
  case 'O2':ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(x,y,9,0,6.29);ctx.stroke();ball(ctx,x-3.5,y,4,COL.O);ball(ctx,x+3.5,y,4,COL.O);break;}}
function legendItems(p,acid,big){const t=p.type,sp=big?'':', spectator';
  if(t==='ss')return [['H3O','H₃O⁺'],['OH','OH⁻'],['W','H₂O formed'],['Cl','Cl⁻'+sp],['Na','Na⁺'+sp]];
  if(t==='ws')return [['HA',acid.f],['A',acid.an],['OH','OH⁻'],['W','H₂O formed'],['Na','Na⁺'+sp]];
  if(t==='wb')return [['B','NH₃'],['BH','NH₄⁺'],['H3O','H₃O⁺'],['W','H₂O formed'],['Cl','Cl⁻'+sp]];
  return [['H2O2','H₂O₂'],['MnO4','MnO₄⁻'],['Mn','Mn²⁺'],['O2','O₂ gas'],['K','K⁺'+sp]];}

/* ---------- Challenge game: "Hit the endpoint" ----------
   Every round is a real burette run: the student works the stopcock and single drops, then presses Mark endpoint.
   "find" rounds hide the concentration and the student watches the indicator (or the pH meter).
   "calc" rounds give the numbers but take away the color cue (no indicator yet, or a covered flask), so the student
   calculates the volume and delivers exactly that much. The particle zoom, the canvas status line and any curve a
   real student could not see stay hidden until the endpoint is marked. */
const GTOL=0.10,GTOL_PH=0.02;      // mL either side of the target (two drops); pH units for the buffer round
const gRs=(a,b,st)=>Math.round((a+Math.random()*(b-a))/st)*st;
const gPick=a=>a[Math.floor(Math.random()*a.length)];
const f2=v=>v.toFixed(2);
const SUPD='⁰¹²³⁴⁵⁶⁷⁸⁹';
const kaTxt=k=>{const s=k.toExponential(1).split('e');return s[0]+' × 10'+s[1].replace('-','⁻').replace('+','').replace(/\d/g,d=>SUPD[d]);};
const IND_G={phenol:{n:'phenolphthalein',from:'colorless',goal:'the first pink that stays'},btb:{n:'bromothymol blue',from:'yellow',goal:'the first green or blue that stays'},
  mred:{n:'methyl red',from:'yellow',goal:'the first orange or red that stays'},none:{n:'',goal:'the middle of the steep jump in pH'}};
function dropBtn(sim){const i=(sim.def.actions||[]).findIndex(a=>a.id==='drop');return sim.ui&&sim.ui.ctrls?sim.ui.ctrls.querySelectorAll('.actions button')[i]:null;}
/* an unknown whose equivalence volume lands between lo and hi mL, inside the bench's unknown range */
function gConc(p,lo,hi,st){const red=p.type==='redox',ct=red?p.cb/5:p.cb,k=red?0.4:1,cmin=red?0.030:0.060,cmax=red?0.065:0.140;
  const a=Math.max(cmin,lo*ct/(k*p.va)),b=Math.min(cmax,hi*ct/(k*p.va));if(a>b)return null;
  let C=gRs(a,b,st);if(C<a-1e-12)C+=st;if(C>b+1e-12)C-=st;return C<a-1e-12||C>b+1e-12?null:+C.toFixed(4);}
/* the exact volume where a weak acid's pH reaches pHt (pH rises steadily before equivalence) */
function gVatPH(p,pHt){const c=cfg(p);let lo=0,hi=c.Ve;for(let i=0;i<60;i++){const m=(lo+hi)/2;if(pHat(p,m,c)<pHt)lo=m;else hi=m;}return (lo+hi)/2;}
function gTry(lv,i){const P=o=>Object.assign({type:'ss',va:25,cb:0.1,acid:'HC2H3O2',ind:'phenol',meter:false},o),WS=['HC2H3O2','HCHO2','HC7H5O2'];let s;
  if(lv==='bio')s=[{kind:'find',p:P({va:25}),lo:15,hi:24},{kind:'find',p:P({va:10,ind:'btb'}),lo:8,hi:14},
      {kind:'calc',p:P({ind:'none'}),post:{ind:'phenol'},lo:15,hi:24},{kind:'calc',p:P({va:10,ind:'none'}),post:{ind:'phenol'},lo:8,hi:14},
      {kind:'calc',two:true,p:P({ind:'none'}),post:{ind:'phenol'},lo:15,hi:24},{kind:'find',known:true,p:P({}),lo:15,hi:24}][i];
  else if(lv==='honors')s=[{kind:'find',p:P({}),lo:15,hi:24},{kind:'calc',p:P({cb:0.2,ind:'none'}),post:{ind:'phenol'},lo:8,hi:17},
      {kind:'find',p:P({type:'ws'}),lo:15,hi:24},{kind:'calc',p:P({type:'ws',va:gPick([10,25]),cb:gPick([0.1,0.2]),ind:'none'}),post:{ind:'phenol'},lo:8,hi:24},
      {kind:'find',p:P({type:'wb',ind:'mred'}),lo:15,hi:24},{kind:'calc',two:true,p:P({type:'wb',cb:0.2,ind:'none'}),post:{ind:'mred'},lo:10,hi:17.5}][i];
  else{const a2=gPick(Object.keys(ACIDS));
    s=[{kind:'find',p:P({type:'ws',acid:gPick(WS),cb:gPick([0.1,0.2]),ind:'none',meter:true}),lo:8,hi:24},
      {kind:'calc',ka:true,p:P({type:'ws',acid:a2,va:gPick([10,25]),cb:gPick([0.1,0.2]),ind:'none'}),post:a2==='HClO'?{meter:true}:{ind:'phenol',meter:true},lo:8,hi:24},
      {kind:'find',p:P({type:'redox',va:gPick([10,25]),cb:gPick([0.1,0.2]),ind:'none'}),lo:8,hi:20},
      {kind:'calc',cover:true,p:P({type:'redox',va:gPick([10,25]),cb:gPick([0.1,0.2]),ind:'none'}),lo:8,hi:24},
      {kind:'calc',goal:'half',p:P({type:'ws',acid:gPick(WS),cb:gPick([0.1,0.2]),ind:'none'}),post:{meter:true},lo:12,hi:40},
      {kind:'calc',goal:'ph',p:P({type:'ws',acid:gPick(['HC2H3O2','HC7H5O2']),cb:gPick([0.1,0.2]),ind:'none'}),post:{meter:true},lo:12,hi:30}][i];}
  s=Object.assign({goal:'eq'},s);s.p=Object.assign({},s.p);const p=s.p;
  if(s.two){// yesterday's 10.00 mL sample with 0.100 M titrant needed X mL; today's sample is p.va with p.cb
    const f=(p.va/10)*(0.1/p.cb),a=Math.max(6,s.lo/f),b=Math.min(14,s.hi/f);if(a>b)return null;s.X=+gRs(a,b,0.01).toFixed(2);p.gC=+(s.X/100).toFixed(4);}
  else p.gC=gConc(p,s.lo,s.hi,s.kind==='find'&&!s.known?0.0001:0.0005);
  if(!(p.gC>0))return null;
  const c=cfg(p),red=p.type==='redox',ct=red?p.cb/5:p.cb,k=red?0.4:1,Vc=s.two?s.X*(p.va/10)*(0.1/p.cb):p.gC*p.va*k/ct;
  s.Ve=c.Ve;s.target=s.goal==='half'?c.Ve/2:c.Ve;s.calc=s.goal==='half'?Vc/2:Vc;
  if(s.goal==='ph'){s.pKa=+(-Math.log10(c.acid.Ka)).toFixed(2);const dl=gPick([-0.6,-0.5,-0.4,-0.3,0.3,0.4,0.5,0.6]);s.phT=+(s.pKa+dl).toFixed(2);
    s.target=gVatPH(p,s.phT);const r=Math.pow(10,s.phT-s.pKa);s.calc=Vc*r/(1+r);}
  if(s.target<3||s.target>45)return null;
  s.an=p.type==='ws'?c.acid.f:c.t.flask;s.tn=c.t.titN;
  return s;}
function gMake(lv,i){for(let k=0;k<200;k++){const s=gTry(lv,i);if(s)return gWords(lv,i,s);}throw new Error('titration game: no round for '+lv+' '+i);}
/* prompt, tiles and the "check your math" line for one round */
function gWords(lv,i,s){const p=s.p,c=cfg(p),red=p.type==='redox',hint=lv==='bio',tn=s.tn,an=s.an,ctT=(red?c.ct.toFixed(4):c.ct.toFixed(3))+' M '+tn,
    vaT=p.va.toFixed(2)+' mL',CT=p.gC.toFixed(4)+' M',acidN=c.acid.n+', '+c.acid.f,ig=IND_G[p.ind]||IND_G.none,H=t=>hint?` <span class="gm-hint">Hint: ${t}</span>`:'';
  let A=Math.floor(s.target-0.3-Math.random()*1.2),B=A+2;if(B-s.target<0.3)B++;s.rough=[A,B];
  const rough=` A quick rough trial ${p.meter?'jumped':red?'stayed purple':'changed color'} between ${A} and ${B} mL.`;
  const nm={ss:'HCl',ws:c.acid.n,wb:'NH₃',redox:'H₂O₂'}[p.type],R=`<b>Round ${i+1}: `;
  s.metrics=p.meter&&s.kind==='find'?['vol','pH','mmol']:s.cover||(s.post&&s.post.meter&&!s.post.ind)?['vol','mmol']:['vol','color','mmol'];
  s.goalTxt=red?'the first faint purple that stays':ig.goal;s.indName=s.post&&s.post.ind?IND_G[s.post.ind].n:ig.n;
  s.check=red?'Check the mole ratio: 2 mol MnO₄⁻ react with 5 mol H₂O₂, so mol MnO₄⁻ = 2/5 × mol H₂O₂.':
    s.two?`Check: the moles of ${an} grow in proportion to the sample volume`+(p.cb!==0.1?`, and a more concentrated ${tn} needs less volume.`:'.'):
    s.goal==='half'?'':`Check: at the endpoint mol ${tn} = mol ${an}, so V(${tn}) = M(${an}) × V(${an}) ÷ M(${tn}).`;
  const nInd=' No indicator is in the flask yet, so the color will not warn you. Calculate the volume, deliver exactly that much, then press <b>Mark endpoint</b>'+(s.post&&s.post.ind?` and your partner adds ${s.indName} to check.`:' and the pH meter goes in to check.');
  let q;
  if(s.kind==='find'&&!s.known){
    if(red)q=`${R}Permanganate.</b> The flask holds ${vaT} of H₂O₂ of unknown concentration, in sulfuric acid. The burette holds ${ctT}, which is its own indicator: each purple drop loses its color while H₂O₂ is left. Stop at ${s.goalTxt}.`+rough;
    else if(p.meter)q=`${R}pH meter only.</b> The flask holds 25.00 mL of ${acidN}, unknown concentration, and no indicator. The burette holds ${ctT}. Watch the pH meter and stop at the equivalence point, in the middle of the steep jump in pH.`+rough;
    else if(i===0)q=`${R}Find the endpoint.</b> The flask holds ${vaT} of HCl of unknown concentration, with a few drops of phenolphthalein. The burette holds ${ctT}. Stop at ${s.goalTxt} and press <b>Mark endpoint</b>.`+rough+H(`open the stopcock to go fast until you are close to ${A} mL, then switch to Drip or Add one drop.`);
    else if(p.type==='ss')q=`${R}A new indicator.</b> Now ${vaT} of a different HCl with bromothymol blue, which is yellow in acid and blue in base. The burette holds ${ctT}. Stop at ${s.goalTxt}.`+rough+H('a smaller sample holds fewer moles of acid, so it needs less base.');
    else if(p.type==='ws')q=`${R}A weak acid.</b> The flask holds ${vaT} of ${acidN}, unknown concentration, with phenolphthalein. The burette holds ${ctT}. The jump at the end is smaller than with HCl, so watch for ${s.goalTxt}.`+rough;
    else q=`${R}A weak base.</b> The flask holds ${vaT} of ammonia, NH₃, unknown concentration, with methyl red, which is yellow in base and red in acid. The burette holds ${ctT}. Stop at ${s.goalTxt}.`+rough;}
  else if(s.kind==='find')q=`${R}Work like a chemist.</b> The flask holds ${vaT} of ${CT} HCl with phenolphthalein, and the burette holds ${ctT}. Calculate where the endpoint is, open the stopcock to about 1 mL before it, then finish drop by drop to ${s.goalTxt}.`+H('M(base) × V(base) = M(acid) × V(acid). Calculating first tells you when to slow down.');
  else if(s.goal==='half')q=`${R}Find the pKa.</b> The flask holds ${vaT} of ${CT} ${acidN}, and the burette holds ${ctT}. Stop at the <b>half-equivalence point</b>, where half the acid has become ${c.acid.an} and pH = pKa. The pH meter goes in when you press <b>Mark endpoint</b>.`;
  else if(s.goal==='ph')q=`${R}Make a buffer.</b> An enzyme lab needs a buffer at <b>pH ${s.phT.toFixed(2)}</b>. Start with ${vaT} of ${CT} ${acidN} (pKa ${s.pKa.toFixed(2)}) and add ${ctT} until the pH is ${s.phT.toFixed(2)}, within 0.02. Calculate the volume, deliver it, then press <b>Mark endpoint</b>.`+` <span class="gm-hint">pH = pKa + log(mol ${c.acid.an} ÷ mol ${an}). Each mol of OH⁻ turns one ${an} into ${c.acid.an}.</span>`;
  else if(s.cover)q=`${R}Use the mole ratio.</b> Blind test: the flask is covered, so you cannot watch for purple. It holds ${vaT} of ${CT} H₂O₂, and the burette holds ${ctT}. The equation is 2 MnO₄⁻ + 5 H₂O₂ + 6 H⁺ → 2 Mn²⁺ + 5 O₂ + 8 H₂O. Deliver exactly enough KMnO₄, then press <b>Mark endpoint</b> and the cover comes off.`;
  else if(s.two)q=`${R}${lv==='bio'?'Scale it up':'Two changes at once'}.</b> Yesterday a 10.00 mL sample of this ${nm} needed <b>${f2(s.X)} mL</b> of 0.100 M ${tn}. Today you titrate <b>${vaT}</b> of the same ${nm} with <b>${ctT}</b>. How much ${tn} reaches the endpoint?`+nInd+H('the concentration is the same, so the base needed grows in proportion to the sample volume.');
  else if(s.ka)q=`${R}Does Ka matter?</b> The flask holds ${vaT} of ${CT} ${acidN} (Ka = ${kaTxt(c.acid.Ka)}), and the burette holds ${ctT}.`+nInd;
  else if(p.type==='ws')q=`${R}Weak acid, by calculation.</b> The flask holds ${vaT} of ${CT} ${acidN}, and the burette holds ${ctT}. It is a weak acid: does that change how much base it needs?`+nInd;
  else q=`${R}${lv==='bio'?(p.va<25?'A smaller sample':'Calculate first'):'Double-strength base'}.</b> The flask holds ${vaT} of ${CT} HCl, and the burette holds ${ctT}.`+nInd+H('at the endpoint, moles of NaOH = moles of HCl, so M(base) × V(base) = M(acid) × V(acid). Solve for V(base).');
  s.prompt=q;return s;}
/* grade the volume the student marked */
function gJudge(p,r){const c=cfg(p),V=r.V,tn=r.tn,an=r.an,red=p.type==='redox',d=V-r.target,ad=f2(Math.abs(d)),pH=red?NaN:pHat(p,V,c),ph2=Number.isFinite(pH)?pH.toFixed(2):'',
    col=flaskColor(p,V,c)[1],Ve=f2(c.Ve),again=' Opening the stopcock again starts a fresh sample.';
  if(!(V>0))return {ok:false,msg:`Nothing has gone into the flask yet. Open the stopcock to add ${tn}.`};
  if(r.goal==='ph'){const dp=pH-r.phT;
    if(Math.abs(dp)<=GTOL_PH+1e-9)return {ok:true,msg:`Buffer made! The pH is ${ph2} at ${f2(V)} mL: ${Math.round(100*V/c.Ve)}% of the ${an} is now ${c.acid.an}.`};
    return {ok:false,over:dp>0,msg:`The pH is ${ph2}, not ${r.phT.toFixed(2)}: ${dp>0?'too much':'not enough'} ${tn}, by about ${ad} mL. Find mol ${c.acid.an} ÷ mol ${an} from the pH, then the mL of ${tn} that makes that ratio.`+(dp>0?again:' Add more, then mark again.')};}
  const ok=Math.abs(d)<=GTOL+1e-9;
  if(r.goal==='half'){const pk=-Math.log10(c.acid.Ka);
    if(ok)return {ok:true,msg:`Right on! At ${f2(V)} mL the pH is ${ph2}, so pKa ≈ ${ph2} and Ka ≈ ${kaTxt(Math.pow(10,-pH))}. The table value is ${kaTxt(c.acid.Ka)}.`};
    return {ok:false,over:d>0,msg:`The pH is ${ph2}, ${d>0?'above':'below'} the pKa of ${pk.toFixed(2)}: you are ${ad} mL ${d>0?'past':'short of'} half-equivalence. Half-equivalence takes half the ${tn} that equivalence does.`+(d>0?again:' Add more, then mark again.')};}
  const phP=ph2?` (pH ${ph2})`:'',fromE=d===0||ad==='0.00'?'right at equivalence':`${ad} mL from equivalence (${Ve} mL)`;
  // what the color shows at the marked volume: one drop short of the change still counts as a hit
  const ig=IND_G[(r.post&&r.post.ind)||p.ind],toCol={phenol:'pink',btb:'blue',mred:'red'}[(r.post&&r.post.ind)||p.ind];
  const colSay=red?(col==='colorless'?' The flask is still colorless; one more drop would stay purple.':` A ${col} color stays: that is the endpoint.`):
    ig&&ig.from&&r.indName?(col===ig.from?` The ${r.indName} is still ${col}${phP}; one more drop turns it ${toCol}.`:` The ${r.indName} is ${col}${phP}: that is the endpoint.`):'';
  if(ok){
    if(r.kind==='find'&&!r.known){const M=(red?c.ct*V*2.5:c.ct*V)/c.va;
      return {ok:true,msg:`Endpoint! You stopped at ${f2(V)} mL, and equivalence is at ${Ve} mL. Your result: [${an}] = ${red?c.ct.toFixed(4):c.ct.toFixed(3)} M × ${f2(V)} mL${red?' × 5/2':''} ÷ ${c.va.toFixed(2)} mL = <b>${M.toFixed(4)} M</b>.`};}
    if(r.kind==='find')return {ok:true,msg:`Endpoint! You stopped at ${f2(V)} mL, ${fromE}.${colSay} Calculating first told you when to slow down.`};
    if(r.cover)return {ok:true,msg:`Right on! The cover comes off. You stopped at ${f2(V)} mL, ${fromE}.${colSay}`};
    if(r.ka)return {ok:true,msg:`Right on! You stopped at ${f2(V)} mL, ${fromE}. The pH there is ${ph2}. Ka changes the shape of the curve, not the volume: OH⁻ reacts completely with any weak acid.`};
    return {ok:true,msg:`Right on! You stopped at ${f2(V)} mL, ${fromE}.${colSay}`};}
  if(r.kind==='find'){
    if(d<0)return {ok:false,msg:p.meter&&!red?`Not yet: the pH is ${ph2} and still rising slowly, so some ${an} is left. Keep adding drops; equivalence is in the middle of the steep jump.`:
      `Not yet: the flask is still ${col}, so some ${an} is left. Keep adding ${tn} drop by drop and stop at ${r.goalTxt}.`};
    return {ok:false,over:true,msg:`Too far: ${p.meter&&!red&&p.ind==='none'?'the pH is '+ph2:'the flask is '+col+phP}, ${ad} mL past the endpoint.${again} Go fast at first, then slow to single drops near the end.`};}
  const seen=r.cover?`the flask is ${col}`:r.indName?`the ${r.indName} ${d<0?'stays':'turns'} ${col}${phP}`:`the pH is ${ph2}`;
  return {ok:false,over:d>0,msg:`${d<0?'Short':'Over'} by ${ad} mL: ${seen}. ${r.check}`+(d>0?again:' Add more, then mark again.')};}
/* the student touched the stopcock or a drop after a miss: hide the reveal again, and start a fresh sample after an overshoot */
function gAct(sim){const G=sim.game,r=sim.gameRound;if(!G||!r||!sim.st||G.state==='flying'||G.state==='hit'||G.state==='over')return;
  if(sim.st.gOver){BioLab.reset(sim);if(sim.vis)sim.vis.key='';}
  sim.st.gShow=false;if(r.post)BioLab.setValues(sim,r.pre);}

/* ---------- Virtual lab: Hydrogen Peroxide Analysis by Redox Titration (Honors and AP Chemistry: Robertson, Jackson). Contract: VLAB.md ----------
   The source handout is a commercial Flinn kit: the lab follows its procedure, quantities and calculations, but every word here is our own.
   The bench is independent of the Challenge game. Everything on it lives in sim.vlab.bench (saved with the notebook), so a reload never
   changes recorded data. Trials 1 to 3 are slots 0 to 2; slot 3 is the optional Deep dive flask with too little acid.
   Model: real moles. MnO4- reacts first order in the unreacted MnO4-, faster once Mn2+ has formed (autocatalysis), slower as the last
   H2O2 runs out. With too little H+, part of the MnO4- goes to brown MnO2 (3 e-) instead of Mn2+ (5 e-). Color = absorbance of unreacted MnO4-. */
const RX={MW:CL.molarMass('H2O2'),eps:2400,path:4.5,stream:0.9,dropV:0.05,dropT:0.55,K1:5,KS:2e-6,MN:2e-5,top:51.5,
  base:'#eef2f5',pink:'#cf3f9c',deep:'#561268',brown:'#7a4a1d',tit:'#5d1670'};
function rxHr(seed,a,b){let h=(seed^Math.imul(a+1,0x9E3779B1)^Math.imul(b+7,0x85EBCA77))|0;h=Math.imul(h^h>>>16,0x7feb352d);h=Math.imul(h^h>>>15,0x846ca68b);h^=h>>>16;return (h>>>0)/4294967296;}
function rxHn(seed,a,b){const u=Math.max(1e-9,rxHr(seed,a,b)),w=rxHr(seed,a,b+100003);return Math.sqrt(-2*Math.log(u))*Math.cos(6.2831853*w);}
const rxRgba=(h,a)=>'rgba('+hex2(h).join(',')+','+clamp(a,0,1).toFixed(3)+')';
const rxNear=(x,y,tol)=>Number.isFinite(x)&&Number.isFinite(y)&&Math.abs(x-y)<=tol*Math.abs(y);
const rxB=sim=>sim.vlab&&sim.st&&sim.st.R?sim.vlab.bench:null;
const rxM=sim=>+(0.0240+0.0020*rxHr(sim.vlab.seed,1,0)).toFixed(4);   // printed on the KMnO4 bottle label (exact)
const rxPct=sim=>2.50+0.45*rxHr(sim.vlab.seed,2,0);                     // the opened drugstore bottle's true strength, % by mass
const RX_T=['Trial 1','Trial 2','Trial 3'];
function rxInit(sim){const b=sim.vlab.bench;
  const D={got:false,rinses:0,filled:false,level:null,bubble:false,bub:0,fills:0,under:'waste',fl:null,trials:[null,null,null,null],nd:0,pips:0,waste:0,slot:-1};
  for(const k in D)if(b[k]===undefined)b[k]=D[k];
  return {kind:'rx',acc:0,drops:[],bub:[],wasteSpot:0};}
/* one flask: moles of H2O2 left (nP), unreacted MnO4- (u), Mn2+ (mn), MnO2 (mno2), H+ (nH); volume V in mL */
function rxReact(fl,h){fl.o2r=0;if(!(fl.u>0)||!(fl.nP>0))return 0;const V=fl.V/1000,cH=fl.nH/V,fM=cH>=0.6?0:1/(1+Math.pow(cH/0.25,4));
  const kr=RX.K1*(0.07+Math.min(1,fl.mn/RX.MN))*fl.nP/(fl.nP+RX.KS),ratio=2.5*(1-fM)+1.5*fM;
  let du=fl.u*(1-Math.exp(-kr*h));if(du*ratio>fl.nP)du=fl.nP/ratio;
  fl.u-=du;fl.nP-=du*ratio;if(fl.nP<1e-12)fl.nP=0;if(fl.u<1e-14)fl.u=0;fl.mn+=du*(1-fM);fl.mno2+=du*fM;fl.nH=Math.max(0,fl.nH-du*(3*(1-fM)+fM));fl.o2r=du*ratio/h;return kr;}
function rxColor(fl){const V=Math.max(1e-3,fl.V/1000),A=RX.eps*RX.path*fl.u/V,fb=1-Math.exp(-(fl.mno2/V)/1.2e-3);
  let col=A<=1?mix(RX.base,RX.pink,0.85*(1-Math.pow(10,-A))/0.9):mix(mix(RX.base,RX.pink,0.85),RX.deep,clamp((A-1)/2.5,0,1));
  if(fb>0.02)col=mix(col,RX.brown,0.88*fb);
  const name=fb>0.25?(A>0.4?'brown, with some purple':'cloudy brown'):A<0.06?'colorless':A<0.75?'pale pink':A<1.6?'pink':A<3?'deep pink':'purple';
  return [col,name,A];}
/* the trial record keeps what the checks need: readings, how far past (xs) or short of (left) the endpoint, in mL of KMnO4 */
function rxRec(sim,fl){const b=rxB(sim),r=b&&b.trials[fl.slot];if(!r)return;const M=rxM(sim);r.deliv=fl.deliv;r.left=fl.nP*0.4/M*1000;r.xs=fl.nP>0?0:fl.u/M*1000;r.brown=fl.mno2>3e-6;}
function rxDeliver(sim,dv,mode){const b=rxB(sim);if(!b||!b.filled)return 0;dv=Math.min(dv,RX.top-b.level);
  if(dv<=1e-9){if(sim.p.rxCock!=='closed')BioLab.setValues(sim,{rxCock:'closed'});return 0;}
  b.level+=dv;let liq=dv;if(b.bubble&&mode==='stream'){const t=Math.min(liq,b.bub);b.bub-=t;liq-=t;if(b.bub<=1e-6){b.bubble=false;b.bub=0;}}
  const fl=b.fl;if(fl&&fl.placed&&b.under==='flask'){fl.u+=liq*rxM(sim)/1000;fl.V+=liq;fl.spot=(fl.spot||0)+liq;fl.deliv+=dv;const r=b.trials[fl.slot];if(r)r.fin=b.level;}
  else{b.waste+=liq;sim.st.R.wasteSpot+=liq;}
  return dv;}
function rxDrop(sim){const b=rxB(sim);if(!b)return;const v=RX.dropV*(1+0.06*rxHn(sim.vlab.seed,77,b.nd));b.nd++;if(rxDeliver(sim,v,'drop')>0)sim.st.R.drops.push({y:318});}
function rxStep(sim,dt){const b=rxB(sim),R=sim.st.R,p=sim.p;if(!b)return;
  while(dt>1e-9){const h=Math.min(dt,0.05);dt-=h;
    if(b.filled&&p.rxCock==='stream')rxDeliver(sim,RX.stream*h,'stream');
    else if(b.filled&&p.rxCock==='drops'){R.acc+=h;while(R.acc>=RX.dropT){R.acc-=RX.dropT;rxDrop(sim);}}
    else R.acc=0;
    const fl=b.fl;if(fl){const kr=rxReact(fl,h);fl.spot=(fl.spot||0)*Math.exp(-h*((p.rxSwirl?1.6:0.25)+(fl.nP>0?kr:0)));if(fl.spot<1e-4)fl.spot=0;if(fl.placed)rxRec(sim,fl);}
    R.wasteSpot*=Math.exp(-h*1.2);}}
/* ---------- checks: buret readings against the bench (±0.02 mL), calcs against the student's own entries; never the answer ---------- */
const rxDp=raw=>{const m=String(raw||'').trim().match(/\.(\d*)$/);return m?m[1].length:0;};
const RX_DP='Record buret readings to two decimal places (0.01 mL): estimate the last digit between the 0.1 mL lines.';
function rxRead(v,truth){const d=v-truth,ad=Math.abs(d);if(ad<=0.02+1e-9)return null;
  if(truth>2&&Math.abs(v-(50-truth))<=0.06)return 'A buret is numbered from the top down, with 0.00 mL at the top. Read the scale downward to the bottom of the meniscus.';
  if(Math.abs(ad-1)<=0.06)return 'Check which numbered mL line is just above the meniscus, then count the 0.1 mL lines down from it.';
  if(d<=-0.06&&d>=-0.14)return 'Read the bottom of the meniscus, the lowest point of the curve, not where the liquid meets the glass.';
  return d<0?'The bottom of the meniscus sits lower on the scale than that, at a larger number. Check your reading.':'The bottom of the meniscus sits higher on the scale than that, at a smaller number. Check your reading.';}
function rxInitCheck(sim,rv,v){const b=rxB(sim);if(!b)return null;const k=+rv-1,r=b.trials[k];let t=null;
  if(r&&r.init!==null&&r.init!==undefined)t=r.init;else if(b.slot===k&&b.filled)t=b.level;
  if(t===null)return b.filled?'Read the initial level for '+RX_T[k]+' on the bench when you reach that step.':'Fill the buret on the bench first, then read it.';
  if(t<0)return 'The level is above the 0.00 mL line, where the buret has no scale. Run a little KMnO₄ into the waste beaker, then read it.';
  return rxRead(v,t)||(rxDp(sim.vlab.raw('c:data:init:'+k))<2?RX_DP:null);}
function rxFinCheck(sim,rv,v){const b=rxB(sim);if(!b)return null;const k=+rv-1,r=b.trials[k];
  if(!r||!(r.deliv>0))return 'Titrate '+RX_T[k]+' on the bench first, then read the buret.';
  const m=rxRead(v,r.fin);if(m)return m;if(rxDp(sim.vlab.raw('c:data:fin:'+k))<2)return RX_DP;
  const live=!!(b.fl&&b.fl.placed&&b.fl.slot===k);
  if(r.xs>0.30)return 'The flask went past the first pale pink to a deeper color, so more KMnO₄ went in than the H₂O₂ needed. Empty it and run '+RX_T[k]+' again with a fresh 1.00 mL sample, going drop by drop near the end.';
  if(r.left>0.06)return live?'The flask has not kept a pale pink yet, so some H₂O₂ is left. Keep adding single drops, swirling, until a pale pink stays for 30 seconds.':'The flask had not kept a pale pink at this reading, so some H₂O₂ was left. Run '+RX_T[k]+' again and stop at the first pale pink that stays.';
  return null;}
function rxAddCheck(sim,rv,v){const V=sim.vlab,k=+rv-1,i=V.val('data','init',k),f=V.val('data','fin',k);
  if(!Number.isFinite(i)||!Number.isFinite(f))return 'Record the initial and final readings for '+RX_T[k]+' first.';
  return Math.abs(v-(f-i))<=0.011?null:'The volume added is the final reading minus the initial reading.';}
function rxParse(s){if(s===undefined||s===null)return NaN;const SUP={'⁰':'0','¹':'1','²':'2','³':'3','⁴':'4','⁵':'5','⁶':'6','⁷':'7','⁸':'8','⁹':'9','⁻':'-','⁺':'+'};
  let t=String(s).trim().toLowerCase().replace(/\s+/g,'').replace(/(mol|g)$/,'').replace(/[−–]/g,'-').replace(/[×x*·]/g,'x').replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺]/g,c=>SUP[c]);
  const m=t.match(/^([-+]?(?:\d+\.?\d*|\.\d+))(?:(?:x10\^?|e)([-+]?\d+))?$/);if(!m)return NaN;return parseFloat(m[1])*(m[2]!==undefined?Math.pow(10,+m[2]):1);}
const RX_NUM='Write this as a number, such as 0.000123 or 1.23 × 10⁻⁴.';
function rxResCheck(col){return (sim,rv,v)=>{const V=sim.vlab,k=+rv-1,n=RX_T[k];
  if(col==='mn'){const x=rxParse(v);if(!Number.isFinite(x))return RX_NUM;const M=V.val('data','M',k),a=V.val('data','add',k);
    if(!Number.isFinite(M)||!Number.isFinite(a))return 'Fill in the molarity and the volume added for '+n+' in the data table first.';
    if(rxNear(x,M*a/1000,0.015))return null;if(rxNear(x,M*a,0.015))return 'Convert the volume added from mL to L before you multiply by the molarity.';
    return 'Check this against your molarity and volume added for '+n+'.';}
  if(col==='h'){const x=rxParse(v);if(!Number.isFinite(x))return RX_NUM;const mn=rxParse(V.raw('c:res:mn:'+k));if(!Number.isFinite(mn))return 'Work out the moles of MnO₄⁻ for '+n+' first.';
    if(rxNear(x,mn*2.5,0.015))return null;if(rxNear(x,mn*0.4,0.015))return 'Check the mole ratio: the balanced equation has 5 H₂O₂ for every 2 MnO₄⁻.';
    if(rxNear(x,mn,0.015))return 'H₂O₂ and MnO₄⁻ do not react 1 : 1. Use the coefficients in the balanced equation.';
    return 'Check this against your moles of MnO₄⁻ and the mole ratio in the balanced equation.';}
  if(col==='g'){const x=rxParse(v);if(!Number.isFinite(x))return RX_NUM;const h=rxParse(V.raw('c:res:h:'+k));if(!Number.isFinite(h))return 'Work out the moles of H₂O₂ for '+n+' first.';
    return rxNear(x,h*RX.MW,0.015)?null:'Multiply your moles of H₂O₂ by the molar mass of H₂O₂, '+RX.MW.toFixed(2)+' g/mol.';}
  const g=rxParse(V.raw('c:res:g:'+k));if(!Number.isFinite(g))return 'Work out the mass of H₂O₂ for '+n+' first.';
  if(rxNear(v,g*100,0.015))return null;if(rxNear(v,g,0.015))return 'Percent means parts per hundred: divide by the 1.00 g mass of the sample, then multiply by 100.';
  return 'Check this against your mass of H₂O₂ and the 1.00 g mass of the 1.00 mL sample.';};}
function rxAvgCheck(sim,v,V){const a=V.col('res','pct');if(!a.every(Number.isFinite))return 'Fill in % H₂O₂ for all three trials in the Results table first.';
  const m=(a[0]+a[1]+a[2])/3;return Math.abs(v-m)<=Math.max(0.011,0.004*m)?null:'Check your average: add your three % H₂O₂ values and divide by 3.';}
function rxDiffCheck(sim,v,V){const a=BioLab.vlab.num(V.raw('k:avg'));if(!Number.isFinite(a))return 'Work out your average % H₂O₂ first.';const e=(a-3)/3*100,tol=Math.max(0.2,0.02*Math.abs(e));
  return Math.abs(v-e)<=tol||Math.abs(v+e)<=tol?null:'Check this against your average and the 3.0% on the label.';}
/* ---------- bench actions (shown only in Virtual lab mode, and only on the steps that list them) ---------- */
const rxClosed=s=>s.p.rxCock==='closed';
function rxAct(id,label,en,fn,primary){return {id,label,vlab:true,primary:!!primary,enabled:s=>{const b=rxB(s);return !!b&&!!en(s,b);},run(s){const b=rxB(s);if(!b||!en(s,b))return;fn(s,b);s.infoDirty=true;}};}
const RX_ACTIONS=[
  rxAct('rx-get','Pour about 75 mL of KMnO₄ into a beaker',(s,b)=>!b.got,(s,b)=>{b.got=true;},true),
  rxAct('rx-rinse','Rinse the buret with 5 mL of KMnO₄',(s,b)=>b.got&&!b.filled&&b.rinses<3,(s,b)=>{b.rinses++;b.waste+=5;s.st.R.wasteSpot+=2;}),
  rxAct('rx-fill','Fill the buret above the 0.00 mL line',(s,b)=>b.got&&b.rinses>0&&rxClosed(s)&&!(b.fl&&b.fl.placed)&&(!b.filled||b.level>5),
    (s,b)=>{b.level=-(0.3+1.0*rxHr(s.vlab.seed,30,b.fills));if(!b.fills){b.bubble=true;b.bub=0.12+0.12*rxHr(s.vlab.seed,31,0);}b.filled=true;b.fills++;},true),
  rxAct('rx-drop','Add one drop',(s,b)=>b.filled&&b.level<RX.top-0.01&&rxClosed(s),s=>rxDrop(s)),
  rxAct('rx-pipet','Pipet 1.00 mL of H₂O₂ into the 125 mL flask',(s,b)=>b.got&&b.slot>=0&&!b.fl,(s,b)=>{const k=b.slot,pip=1+0.008*rxHn(s.vlab.seed,10+k,b.pips);b.pips++;
    b.fl={slot:k,pip,nP:pip*1.00*rxPct(s)/100/RX.MW,water:false,acid:0,nH:0,u:0,mn:0,mno2:0,V:pip,spot:0,deliv:0,placed:false,o2r:0};
    b.trials[k]={init:null,fin:null,deliv:0,left:0,xs:0,acid:0,brown:false,done:false};}),
  rxAct('rx-water','Add about 20 mL of distilled water',(s,b)=>!!b.fl&&!b.fl.water&&!b.fl.placed,(s,b)=>{b.fl.water=true;b.fl.V+=20+1.5*rxHn(s.vlab.seed,40+b.fl.slot,b.pips);}),
  rxAct('rx-acid','Add the 3 M H₂SO₄ and swirl',(s,b)=>!!b.fl&&b.fl.water&&!b.fl.acid&&!b.fl.placed,(s,b)=>{const a=b.fl.slot===3?(+s.p.rxAcid||10):10;b.fl.acid=a;b.fl.nH=a/1000*3*1.1;b.fl.V+=a;const r=b.trials[b.fl.slot];if(r)r.acid=a;}),
  rxAct('rx-place','Set the flask on the white paper under the buret',(s,b)=>!!b.fl&&b.fl.acid>0&&!b.fl.placed&&b.filled&&rxClosed(s),(s,b)=>{b.fl.placed=true;b.under='flask';const r=b.trials[b.fl.slot];if(r)r.init=b.level;},true),
  rxAct('rx-discard','Empty the flask into the waste beaker and rinse it',(s,b)=>!!b.fl&&rxClosed(s),(s,b)=>{const r=b.trials[b.fl.slot];if(r){if(b.fl.placed)rxRec(s,b.fl);r.done=true;}b.waste+=b.fl.V;b.fl=null;b.under='waste';})];
/* ---------- bench drawing ---------- */
const RXF={top:300,neck:326,base:390,nw:11,bw:62};
const rxFlaskTop=fl=>RXF.base-64*Math.pow(clamp(fl.V/125,0,1),0.75);
const rxWasteTop=b=>390-80*clamp(b.waste/250,0,1);
function rxFlaskPath(ctx,cx){ctx.beginPath();ctx.moveTo(cx-RXF.nw,RXF.top);ctx.lineTo(cx-RXF.nw,RXF.neck);ctx.lineTo(cx-RXF.bw,RXF.base);ctx.lineTo(cx+RXF.bw,RXF.base);ctx.lineTo(cx+RXF.nw,RXF.neck);ctx.lineTo(cx+RXF.nw,RXF.top);}
function rxFlaskDraw(ctx,cx,fl,R,vdt,live){
  if(fl&&fl.V>0.4){const ly=rxFlaskTop(fl);ctx.save();rxFlaskPath(ctx,cx);ctx.closePath();ctx.clip();ctx.fillStyle=rxColor(fl)[0];ctx.fillRect(cx-RXF.bw-2,ly,2*RXF.bw+4,RXF.base-ly+2);
    if(fl.spot>0.002){const a=clamp(fl.spot*7,0,0.9),g=ctx.createRadialGradient(cx,ly+5,2,cx,ly+8,12+38*clamp(fl.spot*2.5,0,1));g.addColorStop(0,rxRgba(RX.tit,a));g.addColorStop(1,rxRgba(RX.tit,0));ctx.fillStyle=g;ctx.fillRect(cx-RXF.bw,ly,2*RXF.bw,RXF.base-ly);}
    if(live){if(vdt>0){let n=fl.o2r*2.5e5*vdt;while(n>0&&R.bub.length<60){if(Math.random()<n)R.bub.push({x:cx+(Math.random()-0.5)*80,y:RXF.base-3-Math.random()*6,r:1+Math.random()*1.8});n--;}
        R.bub.forEach(q=>{q.y-=36*vdt;q.x+=(Math.random()-0.5)*8*vdt;});R.bub=R.bub.filter(q=>q.y>ly+1);}
      ctx.strokeStyle='rgba(90,110,125,.75)';ctx.lineWidth=1;R.bub.forEach(q=>{ctx.beginPath();ctx.arc(q.x,q.y,q.r,0,6.29);ctx.stroke();});}
    ctx.restore();}
  ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=2.5;rxFlaskPath(ctx,cx);ctx.stroke();ctx.beginPath();ctx.moveTo(cx-RXF.nw-3,RXF.top);ctx.lineTo(cx+RXF.nw+3,RXF.top);ctx.stroke();}
function rxWasteDraw(ctx,cx,b,R){const x0=cx-38,x1=cx+38,top=304,ly=rxWasteTop(b);
  if(b.waste>0.2){ctx.fillStyle=PAL['cv-water'];ctx.fillRect(x0+2,ly,x1-x0-4,390-ly);ctx.fillStyle=rxRgba(RX.tit,0.28+0.3*clamp(R.wasteSpot,0,1));ctx.fillRect(x0+2,ly,x1-x0-4,390-ly);}
  ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(x0-6,top-3);ctx.lineTo(x0,top+3);ctx.lineTo(x0,390);ctx.lineTo(x1,390);ctx.lineTo(x1,top);ctx.stroke();
  ctx.lineWidth=1;[100,200].forEach(ml=>{const y=390-80*ml/250;ctx.beginPath();ctx.moveTo(x0,y);ctx.lineTo(x0+9,y);ctx.stroke();});}
function rxBottle(ctx,x,w,h,body,cap,l1,l2){const y=390-h;ctx.fillStyle=body;rr(ctx,x-w/2,y,w,h,8);ctx.fill();ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=1.2;ctx.stroke();ctx.fillStyle=cap;ctx.fillRect(x-w*0.22,y-13,w*0.44,15);
  ctx.fillStyle='#f7f5ef';ctx.fillRect(x-w/2+4,y+h*0.32,w-8,32);txt(ctx,l1,x,y+h*0.32+11,{s:11,w:700,c:'#222',a:'center',b:'middle'});txt(ctx,l2,x,y+h*0.32+24,{s:11,w:700,c:'#222',a:'center',b:'middle'});}
function rxLoupe(sim,ctx,k,b){const LX=556,LY=40,LW=236,LH=350,F=x=>Math.min(x*k,x*1.5);
  ctx.fillStyle=PAL['card'];rr(ctx,LX,LY,LW,LH,12);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1.5;rr(ctx,LX,LY,LW,LH,12);ctx.stroke();
  txt(ctx,'Buret, magnified',LX+LW/2,LY+20,{s:F(13),w:700,a:'center',b:'middle'});
  const wT=LY+40,wB=LY+LH-10,mid=(wT+wB)/2,PX=220,lev=b.filled?b.level:null,c=lev===null?0.5:Math.round(lev*2)/2,Y=m=>mid+(m-c)*PX,gx0=LX+90,gx1=LX+LW-26;
  ctx.save();ctx.beginPath();ctx.rect(LX+4,wT,LW-8,wB-wT);ctx.clip();
  ctx.fillStyle=PAL['cv-bg2'];ctx.fillRect(gx0,wT,gx1-gx0,wB-wT);
  const e=0.10*PX,liq=()=>{const ym=Y(lev);ctx.beginPath();ctx.moveTo(gx0,ym-e);ctx.quadraticCurveTo((gx0+gx1)/2,ym+e,gx1,ym-e);ctx.lineTo(gx1,wB+4);ctx.lineTo(gx0,wB+4);ctx.closePath();};
  if(lev!==null){liq();ctx.fillStyle=rxRgba(RX.tit,0.92);ctx.fill();const ym=Y(lev);ctx.strokeStyle='#26062f';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(gx0,ym-e);ctx.quadraticCurveTo((gx0+gx1)/2,ym+e,gx1,ym-e);ctx.stroke();}
  const lines=[];for(let i=Math.ceil((c-0.75)*10);i<=Math.floor((c+0.75)*10);i++){if(i<0||i>500)continue;lines.push(i);}
  const stroke=col=>{ctx.strokeStyle=col;lines.forEach(i=>{const y=Math.round(Y(i/10))+0.5,len=i%10===0?62:i%5===0?44:28;ctx.lineWidth=i%10===0?2:1.3;ctx.beginPath();ctx.moveTo(gx0,y);ctx.lineTo(gx0+len,y);ctx.stroke();});};
  stroke(PAL['cv-ink']);if(lev!==null){ctx.save();liq();ctx.clip();stroke('#f3e9f6');ctx.restore();}
  lines.forEach(i=>{if(i%10===0)txt(ctx,String(i/10),gx0-10,Math.round(Y(i/10)),{s:Math.min(15*k,22),w:700,a:'right',b:'middle'});});
  ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(gx0,wT);ctx.lineTo(gx0,wB);ctx.moveTo(gx1,wT);ctx.lineTo(gx1,wB);ctx.stroke();
  if(lev===null)txt(ctx,'The buret is empty.',(gx0+gx1)/2,mid,{s:F(13),c:PAL['cv-soft'],a:'center',b:'middle'});
  ctx.restore();txt(ctx,'mL',LX+16,wT+16,{s:12,c:PAL['cv-soft']});}
function rxDraw(sim,ctx,vdt,k,t){const b=rxB(sim),R=sim.st.R,p=sim.p,fl=b.fl,F=x=>Math.min(x*k,x*1.6),M=rxM(sim);
  ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);ctx.fillStyle=PAL['cv-bench'];ctx.fillRect(0,394,800,56);ctx.fillStyle=PAL['line'];ctx.fillRect(0,394,800,2);
  const slot=b.slot,all=[0,1,2].every(i=>b.trials[i]&&b.trials[i].done);txt(ctx,slot>=0&&slot<3?'Trial '+(slot+1)+' of 3':slot===3?'Deep dive: too little acid':all?'All three trials done':'Setting up',222,30,{s:F(16),w:700});
  txt(ctx,'2 MnO₄⁻ + 5 H₂O₂ + 6 H⁺',222,32+F(13)+8,{s:F(13),w:600,c:PAL['cv-soft']});txt(ctx,'→ 2 Mn²⁺ + 5 O₂ + 8 H₂O',222,32+2*F(13)+14,{s:F(13),w:600,c:PAL['cv-soft']});
  // ring stand and clamp
  ctx.fillStyle=PAL['cv-soft'];ctx.fillRect(52,12,6,376);rr(ctx,30,384,170,10,3);ctx.fill();ctx.fillRect(58,146,80,6);ctx.fillRect(136,140,6,18);ctx.fillRect(158,140,6,18);
  // buret: 0.00 mL at y 40, 4.4 px per mL, read top-down
  const BX=150,Y0=40,PM=4.4,tx=BX-9,tw=18,tT=24,tB=Y0+50*PM+8,tipY=316;
  ctx.fillStyle=PAL['card'];ctx.fillRect(tx,tT,tw,tB-tT);
  if(b.filled){const yl=Y0+Math.max(-3,b.level)*PM;if(b.level<RX.top-0.01){ctx.fillStyle=RX.tit;ctx.fillRect(tx+2,Math.min(yl,tB),tw-4,Math.max(0,tB-yl));ctx.fillRect(BX-3,tB,6,tipY-tB-2);}
    if(b.bubble){ctx.fillStyle='#ffffff';ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(BX,303,3.4,7,0,0,6.29);ctx.fill();ctx.stroke();txt(ctx,'air bubble',BX+12,306,{s:F(12),w:700,c:PAL['cv-ink'],b:'top'});}
    if(b.level>-3&&b.level<=50.5){ctx.strokeStyle=PAL['rj'];ctx.setLineDash([3,3]);ctx.lineWidth=1.5;rr(ctx,tx-6,yl-8,tw+12,16,4);ctx.stroke();ctx.setLineDash([]);}}
  ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=2;ctx.strokeRect(tx,tT,tw,tB-tT);ctx.beginPath();ctx.moveTo(BX-3,tB);ctx.lineTo(BX-2,tipY);ctx.lineTo(BX+2,tipY);ctx.lineTo(BX+3,tB);ctx.stroke();
  ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1;for(let m=0;m<=50;m++){const y=Y0+m*PM;ctx.beginPath();ctx.moveTo(tx-2,y);ctx.lineTo(tx-2-(m%10===0?9:m%5===0?6:3),y);ctx.stroke();}
  for(let m=0;m<=50;m+=10)txt(ctx,String(m),tx-14,Y0+m*PM,{s:12*k,c:PAL['cv-soft'],a:'right',b:'middle'});
  // stopcock
  const sy=283;ctx.fillStyle=PAL['cv-glass'];ctx.fillRect(BX-5,sy-7,10,14);ctx.fillStyle=rxClosed(sim)?PAL['cv-soft']:PAL['s3'];
  ctx.save();ctx.translate(BX,sy);ctx.rotate(p.rxCock==='stream'?Math.PI/2:p.rxCock==='drops'?Math.PI/5:0);ctx.fillRect(-17,-3.5,34,7);ctx.restore();
  txt(ctx,p.rxCock==='stream'?'Fast stream':p.rxCock==='drops'?'Drop by drop':'Closed',BX+24,sy,{s:F(12),c:PAL['cv-soft'],b:'middle'});
  // under the tip: the flask on white paper, or the waste beaker
  const under=b.under==='flask'&&fl&&fl.placed;
  if(under){ctx.fillStyle='#fbfbf8';ctx.strokeStyle='rgba(0,0,0,.22)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(BX-82,393);ctx.lineTo(BX+82,393);ctx.lineTo(BX+74,386);ctx.lineTo(BX-74,386);ctx.closePath();ctx.fill();ctx.stroke();
    rxFlaskDraw(ctx,BX,fl,R,vdt,true);rxWasteDraw(ctx,272,b,R);}
  else{rxWasteDraw(ctx,BX,b,R);R.bub=[];if(fl)rxFlaskDraw(ctx,272,fl,R,0,false);}
  const surf=under?rxFlaskTop(fl):rxWasteTop(b);
  if(b.filled&&p.rxCock==='stream'&&b.level<RX.top-0.01){ctx.strokeStyle=RX.tit;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(BX,tipY);ctx.lineTo(BX,surf);ctx.stroke();}
  R.drops=R.drops.filter(d=>{d.y+=300*vdt;if(d.y>=surf)return false;ctx.fillStyle=RX.tit;ctx.beginPath();ctx.ellipse(BX,d.y,2.6,4,0,0,6.29);ctx.fill();return true;});
  // supplies
  rxBottle(ctx,372,62,92,'#3b2a1f','#1e1e1e','KMnO₄',M.toFixed(4)+' M');
  rxBottle(ctx,436,44,84,'#5a3418','#e4e4e4','H₂O₂','3%');
  rxBottle(ctx,486,38,76,'#9aa7ae','#b8402f','H₂SO₄','3 M');
  if(b.got){const x0=510,x1=552,top=330;ctx.fillStyle=rxRgba(RX.tit,0.9);ctx.fillRect(x0+2,352,x1-x0-4,38);ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x0-4,top-2);ctx.lineTo(x0,top+2);ctx.lineTo(x0,390);ctx.lineTo(x1,390);ctx.lineTo(x1,top);ctx.stroke();}
  // labels on the bench edge
  txt(ctx,under?'Flask on white paper':'Waste beaker',BX,418,{s:F(13),w:700,a:'center'});
  txt(ctx,'KMnO₄ label: '+M.toFixed(4)+' M',432,418,{s:F(13),w:700,a:'center'});
  txt(ctx,'Bottom of the meniscus',674,418,{s:F(12),c:PAL['cv-soft'],a:'center'});
  if(k<1.3&&under)txt(ctx,'1.00 mL H₂O₂ + water + '+fl.acid+' mL H₂SO₄',BX,438,{s:12,c:PAL['cv-soft'],a:'center'});
  rxLoupe(sim,ctx,k,b);}
function rxNarr(sim){const b=rxB(sim),fl=b.fl,p=sim.p;
  if(!b.got)return 'The KMnO₄ bottle, the drugstore H₂O₂ and the 3 M H₂SO₄ are on the bench. Pour about 75 mL of KMnO₄ into a beaker and read its exact molarity on the label.';
  if(!b.filled)return b.rinses<2?'Rinse the buret with KMnO₄ before you fill it. <b>Water left inside would dilute the KMnO₄</b>, so each mL would carry fewer moles than the label says.':'The buret is rinsed with KMnO₄. Fill it to a little above the 0.00 mL line.';
  if(b.level>=RX.top-0.01)return '<b>The buret is empty.</b> Close the stopcock and refill it while no flask is under the tip.';
  if(b.bubble)return p.rxCock==='stream'?'The fast stream is pushing the air bubble out of the tip.':'<b>An air bubble is trapped in the buret tip.</b> If it came out during a titration, the buret reading would count that air as KMnO₄ delivered. A fast stream into the waste beaker pushes it out.'+(p.rxCock==='drops'?' Slow drops leave it in place.':'');
  if(!fl||!fl.placed){if(b.level<0)return 'The level is above the 0.00 mL line, where the buret has no scale. Run a little KMnO₄ into the waste beaker.';
    if(!rxClosed(sim))return 'KMnO₄ is running into the waste beaker. Close the stopcock when the level is where you want it.';
    if(fl){if(!fl.water)return 'The flask holds the 1.00 mL sample of H₂O₂. The water you add next only gives room to swirl: it does not change the moles of H₂O₂.';
      if(!fl.acid)return 'Add the sulfuric acid next. <b>The reduction of MnO₄⁻ uses up H⁺</b>, so the flask must be strongly acidic.';
      return 'The flask is ready. Set it on the white paper under the buret.';}
    return 'Read the buret at the bottom of the meniscus. In the magnified view, the numbers grow toward the bottom.';}
  const name=rxColor(fl)[1];
  if(fl.mno2>3e-6)return '<b>Brown MnO₂ is forming.</b> With too little acid, MnO₄⁻ gains only 3 electrons and becomes MnO₂ instead of Mn²⁺, so each one oxidizes fewer H₂O₂ molecules. The brown solid also hides the pale pink you are watching for.';
  if(fl.deliv<=0)return 'The flask holds colorless H₂O₂ in sulfuric acid, on white paper so the first pink is easy to see. Open the stopcock to start.';
  if(fl.mn<RX.MN*0.5&&fl.nP>0&&(fl.u>2e-7||fl.spot>0.01))return '<b>The first purple fades slowly.</b> The reaction speeds up once some Mn²⁺ has formed, because Mn²⁺ catalyzes it. Keep swirling.';
  if(p.rxCock==='stream')return 'KMnO₄ streams in. Each purple MnO₄⁻ oxidizes H₂O₂ to O₂ gas and becomes nearly colorless Mn²⁺, so the purple clears as you swirl.';
  if(fl.spot>0.006)return 'A purple swirl spreads where the KMnO₄ lands'+(p.rxSwirl?'. Watch whether it fades as you swirl.':'. Without swirling it mixes in slowly, so the color near the top can fool you.');
  if(name==='colorless')return 'The flask is colorless after swirling: the KMnO₄ you added has all reacted.';
  if(name==='pale pink')return 'The flask is pale pink after swirling. If the pink stays for 30 seconds, close the stopcock: that is the endpoint, and permanganate is its own indicator.';
  return 'The flask is '+name+'. Only the first pale pink marks the endpoint. Each drop after it adds KMnO₄ with no H₂O₂ left to react, so the volume added comes out too large.';}
/* ---------- the lab ---------- */
const rxSlot=k=>sim=>{const b=rxB(sim);if(b)b.slot=k;};
const rxRaw=(sim,k)=>sim.vlab.raw(k).trim()!=='';
const RX_SRC2='https://rjhs.instructure.com/courses/17215/pages/p6-redox-titration';
function rxTrialSteps(k){const n=k+1,T='Trial '+n,rec=sim=>{const b=rxB(sim);return b?b.trials[k]:null;},set=rxSlot(k);
  return [
  {title:T+': initial reading',setup:set,controls:k?['rx-fill','rxCock']:[],
   text:'<p>Read the buret at the bottom of the meniscus, with your eye level with it. The scale is numbered from the top down. Estimate the last digit between the 0.1 mL lines, so the reading has two decimal places, and record it as the '+T+' initial reading.</p><p>The magnified view on the right of the bench shows the scale around the meniscus.</p>'+
     (k?'<p>The final reading of the last trial is usually this trial’s initial reading. If the level is below the 30 mL line, refill the buret above 0.00 mL and run a little into the waste beaker first, so you do not run out partway through.</p>':''),
   done:sim=>{const b=rxB(sim);return !!b&&b.filled&&b.level>=0&&!b.bubble&&rxClosed(sim)&&rxRaw(sim,'c:data:init:'+k);},
   doneHint:sim=>{const b=rxB(sim);if(!b)return '';if(!rxClosed(sim))return 'Close the stopcock.';if(b.level<0)return 'Run a little KMnO₄ into the waste beaker until the level is on the scale.';return 'Record the '+T+' initial reading in the data table.';}},
  {title:T+': prepare the flask',setup:set,controls:['rx-pipet','rx-water','rx-acid','rx-place'],
   text:'<p>With the serological pipet, deliver exactly 1.00 mL of the drugstore H₂O₂ into a clean 125 mL Erlenmeyer flask. Add about 20 mL of distilled water, then 10 mL of 3 M H₂SO₄, and swirl.</p><p>Set the flask on a sheet of white paper under the buret, with the tip inside the neck and at least 2 cm above the liquid. The white paper makes the first pink easy to see.</p>',
   done:sim=>{const b=rxB(sim);return !!b&&!!b.fl&&b.fl.placed&&b.fl.slot===k;},
   doneHint:sim=>{const b=rxB(sim);if(!b)return '';const f=b.fl;if(f&&f.slot!==k)return 'Empty the flask from the last run first.';if(!f)return 'Press <b>Pipet 1.00 mL of H₂O₂</b>.';if(!f.water)return 'Add about 20 mL of distilled water.';if(!f.acid)return 'Add the 3 M H₂SO₄.';return 'Set the flask on the white paper under the buret.';}},
  {title:T+': titrate',setup:set,controls:['rxCock','rx-drop','rxSwirl'],
   text:(k?'<p>Your first trial tells you about how much KMnO₄ this sample needs. Run a fast stream, swirling, to about 1 mL short of that.</p>':'<p>Set the stopcock to <b>Fast stream</b> for the first 5 to 8 mL, swirling the flask the whole time. The purple clears as it reacts.</p>')+
     '<p>Then switch to <b>Drop by drop</b>, or close the stopcock and use <b>Add one drop</b>, swirling after each drop. Near the end, each drop leaves a pink swirl that takes longer to fade. In the real lab, rinse the inside wall of the flask with a little distilled water so every drop reaches the solution.</p><p>Stop at the <b>first pale pink that stays for 30 seconds</b>, and close the stopcock.</p>',
   done:sim=>{const r=rec(sim);return !!r&&r.deliv>=1&&rxClosed(sim);},
   doneHint:sim=>{const r=rec(sim);if(!r||!(r.deliv>0))return 'Open the stopcock to add KMnO₄ to the flask.';if(!rxClosed(sim))return 'Close the stopcock when you reach the endpoint.';return 'Keep going until a pale pink stays.';}},
  {title:T+': final reading',setup:set,controls:[],
   text:'<p>Read the buret at the bottom of the meniscus to 0.01 mL and record it as the '+T+' final reading. Then work out the volume of KMnO₄ added: final reading minus initial reading.</p><p>Describe what you saw in the '+T+' observation box below the data table.</p>',
   done:sim=>rxRaw(sim,'c:data:fin:'+k)&&rxRaw(sim,'c:data:add:'+k),doneHint:'Record the final reading and the volume added in the data table.'},
  {title:T+': empty the flask',setup:set,controls:['rx-discard'],
   text:'<p>Empty the flask into the waste beaker and rinse it with distilled water.</p>'+(k<2?'<p>Leave the buret as it is for the next trial.</p>':''),
   done:sim=>{const b=rxB(sim);return !!b&&!b.fl;},doneHint:'Press <b>Empty the flask into the waste beaker</b>.'}];}
const LAB_RX={id:'h2o2-redox',title:'Hydrogen Peroxide Analysis by Redox Titration',course:'Honors and AP Chemistry',teachers:'Robertson, Jackson',
  source:{label:'Hydrogen Peroxide Lab (Robertson)',href:'https://rjhs.instructure.com/courses/17210/assignments/588608'},level:'honors',
  purpose:'<p>Find out how much hydrogen peroxide is really in a drugstore bottle labeled 3%. You titrate 1.00 mL samples with potassium permanganate of known molarity, calculate the percent H₂O₂ by mass, and compare it with the label.</p>'+
    `<p>Handouts on Canvas: <a href="https://rjhs.instructure.com/courses/17210/assignments/588608" target="_blank" rel="noopener" style="color:var(--rj-ink)">Robertson</a> and <a href="${RX_SRC2}" target="_blank" rel="noopener" style="color:var(--rj-ink)">Jackson (P6 Redox Titration)</a>.</p>`,
  background:'<p><b>Why test a bottle of peroxide?</b> Hydrogen peroxide is a common disinfectant, and water treatment plants can use it in place of chlorine because it breaks down into only water and oxygen. That same breakdown, 2H₂O₂ → 2H₂O + O₂, means a bottle does not keep its strength forever. Heat, light and traces of metals or other catalysts speed it up, so a bottle labeled 3% that has been open for a while may hold less. In this lab you measure what is in the bottle.</p>'+
    '<p><b>A redox titration.</b> In a titration you add a solution of known concentration, the titrant, from a buret until it has reacted with all of the sample. Here the titrant is potassium permanganate, KMnO₄, and the reaction transfers electrons. Hydrogen peroxide is oxidized to oxygen gas:</p><p>H₂O₂ → O₂ + 2H⁺ + 2e⁻</p><p>and the permanganate ion is reduced to the manganese(II) ion:</p><p>MnO₄⁻ + 8H⁺ + 5e⁻ → Mn²⁺ + 4H₂O</p><p>Balancing the electrons gives the overall equation:</p><p><b>2MnO₄⁻ + 5H₂O₂ + 6H⁺ → 2Mn²⁺ + 5O₂ + 8H₂O</b></p><p>so 5 mol of H₂O₂ react for every 2 mol of MnO₄⁻. The reduction uses up H⁺, which is why the flask is acidified with sulfuric acid.</p>'+
    '<p><b>Permanganate is its own indicator.</b> MnO₄⁻ is deep purple and Mn²⁺ is nearly colorless. While H₂O₂ remains, each drop of KMnO₄ loses its color as it reacts. Once all of the H₂O₂ is gone, the next drop has nothing to react with, and the flask keeps a pale pink color. That first pink that lasts is the endpoint.</p>'+
    '<p><b>From volume to percent.</b> The volume and molarity of KMnO₄ give the moles of MnO₄⁻. The 5 : 2 mole ratio gives the moles of H₂O₂, and the molar mass of H₂O₂ (34.01 g/mol) gives grams. Take the density of the dilute peroxide as 1.00 g/mL, so the 1.00 mL sample has a mass of 1.00 g, and % H₂O₂ = (g H₂O₂ ÷ 1.00 g) × 100.</p>'+
    '<p><b>Reading a buret.</b> A buret is numbered from the top down, with 0.00 mL at the top. Read it at the bottom of the curved surface, the meniscus, with your eye level with it. The lines are 0.1 mL apart, so estimate one more digit and record every reading to 0.01 mL.</p>'+
    '<p><b>Safety.</b> Wear goggles, gloves and an apron. 3 M sulfuric acid is corrosive; when you mix acid and water, add the acid to the water. KMnO₄ irritates skin and leaves brown stains. Dispose of the solutions the way your teacher directs.</p>'+
    '<p><b>About the virtual bench.</b> The bench runs a model of the real reaction, with real moles. The H₂O₂ bottle on your bench has its own true strength, the same for all three trials and different for each student. The KMnO₄ molarity on the label is exact. The pipet delivers 1.00 mL to within about 0.01 mL, as a real serological pipet does. A fast stream runs about 0.9 mL per second, and one drop is about 0.05 mL. The reaction starts slowly and speeds up once some Mn²⁺ has formed, then slows again as the last H₂O₂ is used up. The color comes from the unreacted MnO₄⁻ in the flask, so one drop past the endpoint gives a pale pink and more drops give a deeper color. With too little acid, part of the MnO₄⁻ turns into brown MnO₂. The model ignores the slow fading of a pink endpoint over several minutes and any H₂O₂ that breaks down during the lab. At 1× speed the bench runs in real time.</p>',
  materials:['Drugstore hydrogen peroxide, labeled 3% (about 3 mL)','Potassium permanganate solution, about 0.025 M, with the exact molarity on the label (about 75 mL)','3 M sulfuric acid (about 30 mL)','Distilled water and a wash bottle','100 mL or 150 mL beaker for the KMnO₄','50 mL buret, buret clamp and ring stand','125 mL Erlenmeyer flask and a sheet of white paper','10 mL or 25 mL graduated cylinder','1 mL serological pipet and pipet bulb','250 mL beaker for waste','Goggles, gloves and an apron'],
  hypothesis:{prompt:'<p>Before you titrate, predict whether this opened drugstore bottle will test at, above or below the 3% on its label. Explain your reasoning.</p>'},
  setup(sim){BioLab.refresh(sim);},
  controls:[],
  steps:[
    {title:'Get set up',setup:rxSlot(-1),
     text:'<p>You will titrate three 1.00 mL samples of drugstore hydrogen peroxide with KMnO₄ of known molarity. The buret delivers the KMnO₄, and the flask holds the H₂O₂.</p><p><b>Safety:</b> put on your goggles, gloves and apron.</p><p>At 1× speed the bench runs in real time. Use Speed to change that.</p>'},
    {title:'Get the KMnO₄',setup:rxSlot(-1),controls:['rx-get'],
     text:'<p>Pour about 75 mL of the KMnO₄ solution into a clean, dry beaker. Read the exact molarity on the bottle label, and record it for all three trials in the data table.</p>',
     done:sim=>{const b=rxB(sim);return !!b&&b.got&&[0,1,2].every(i=>rxRaw(sim,'c:data:M:'+i));},
     doneHint:sim=>{const b=rxB(sim);return b&&!b.got?'Press <b>Pour about 75 mL of KMnO₄</b>.':'Record the molarity from the label in all three rows of the data table.';}},
    {title:'Rinse the buret',setup:rxSlot(-1),controls:['rx-rinse'],
     text:'<p>Rinse the inside of the buret with about 5 mL of the KMnO₄, tilting and turning it so the solution wets the whole inside, then drain it into the waste beaker. Do this twice.</p><p>Rinsing with the titrant removes water left in the buret, which would dilute the KMnO₄.</p>',
     done:sim=>{const b=rxB(sim);return !!b&&b.rinses>=2;},doneHint:'Rinse the buret twice.'},
    {title:'Fill the buret',setup:rxSlot(-1),controls:['rx-fill'],
     text:'<p>Clamp the buret to the ring stand with the waste beaker under the tip. With the stopcock closed, fill the buret with KMnO₄ to a little above the 0.00 mL line.</p>',
     done:sim=>{const b=rxB(sim);return !!b&&b.filled;},doneHint:'Press <b>Fill the buret</b>.'},
    {title:'Clear the tip',setup:rxSlot(-1),controls:['rxCock','rx-fill'],
     text:'<p>Look at the buret tip: an air bubble is trapped in it. Set the stopcock to <b>Fast stream</b> over the waste beaker to push the bubble out, then close it once the level is between 0.00 and 5.00 mL.</p><p>You do not need to start at exactly 0.00 mL, because you will subtract the initial reading.</p>',
     done:sim=>{const b=rxB(sim);return !!b&&b.filled&&!b.bubble&&b.level>=0&&b.level<=5&&rxClosed(sim);},
     doneHint:sim=>{const b=rxB(sim);if(!b)return '';if(b.bubble)return 'Run a fast stream into the waste beaker until the bubble is gone.';if(b.level<0)return 'Keep running KMnO₄ into the waste beaker until the level is below the 0.00 mL line.';
       if(b.level>5)return 'The level is past the 5.00 mL line. Refill the buret and try again.';return 'Close the stopcock.';}}]
    .concat(rxTrialSteps(0),rxTrialSteps(1),rxTrialSteps(2),[
    {title:'Deep dive (optional): too little acid',setup:rxSlot(3),controls:['rxAcid','rx-pipet','rx-water','rx-acid','rx-place','rxCock','rx-drop','rxSwirl','rx-discard','rx-fill'],
     text:'<p>This step is optional, and it is not one of your three trials. It shows what goes wrong when the flask is not acidic enough.</p><p>Set <b>3 M H₂SO₄ to add</b> to 1 mL. Prepare a flask as before, then titrate it the same way and watch the color. Write what you see in the Deep dive observation box, and use it for post-lab question 6.</p><p>Empty the flask when you finish. If the buret runs low, refill it while no flask is under the tip.</p>'},
    {title:'Analyze your results',setup:rxSlot(-1),
     text:'<p>All three trials are done. Below the bench, fill in the Results table from your own data: the moles of MnO₄⁻, the moles of H₂O₂ from the 5 : 2 ratio, the grams of H₂O₂ and the % H₂O₂. Then work out your average, compare it with the 3% on the label, answer the questions and write your Lab Reflection.</p>'}]),
  tables:[
    {id:'data',title:'Data table: titration of 1.00 mL samples of drugstore H₂O₂',cols:[{id:'n',label:'Trial',rows:[1,2,3],rowLabels:RX_T},
      {id:'M',label:'Molarity of KMnO₄ (M)',input:'number',dp:4,check:(sim,rv,v)=>{if(!rxB(sim))return null;return Math.abs(v-rxM(sim))<0.00005?null:'Copy the molarity exactly as it is printed on the KMnO₄ bottle label.';}},
      {id:'init',label:'Initial buret reading (mL)',input:'number',dp:2,check:rxInitCheck},
      {id:'fin',label:'Final buret reading (mL)',input:'number',dp:2,check:rxFinCheck},
      {id:'add',label:'Volume of KMnO₄ added (mL)',input:'number',dp:2,check:rxAddCheck}]},
    {id:'res',title:'Results table: from your data',cols:[{id:'n',label:'Trial',rows:[1,2,3],rowLabels:RX_T},
      {id:'mn',label:'Moles of MnO₄⁻ added (mol)',input:'text',check:rxResCheck('mn')},
      {id:'h',label:'Moles of H₂O₂ in the sample (mol)',input:'text',check:rxResCheck('h')},
      {id:'g',label:'Mass of H₂O₂ (g)',input:'text',check:rxResCheck('g')},
      {id:'pct',label:'H₂O₂ (% by mass)',input:'number',check:rxResCheck('pct')}]}],
  observations:[{id:'o1',label:'Trial 1: what you saw as the KMnO₄ went in, and at the endpoint'},{id:'o2',label:'Trial 2: what you saw'},{id:'o3',label:'Trial 3: what you saw'},
    {id:'odd',label:'Deep dive (optional): what you saw with too little acid'}],
  calcs:[{id:'avg',label:'Average % H₂O₂ of your three trials',unit:'%',input:'number',check:rxAvgCheck},
    {id:'diff',label:'Percent difference from the label: (your average − 3.0%) ÷ 3.0% × 100',unit:'%',input:'number',check:rxDiffCheck}],
  graph:{type:'bar',title:'Percent H₂O₂ in each trial',xl:'Trial',yl:'H₂O₂ (% by mass)',ymin:0,ymax:3.5,series:[{table:'res',x:'n',y:'pct',label:'% H₂O₂'}]},
  questions:[
    {id:'p1',n:'Pre 1',q:'<p>Show how the two half-reactions in the Background combine into the overall equation. What do you multiply each one by, how many electrons cancel, and how many H⁺ are left over?</p>'},
    {id:'p2',n:'Pre 2',q:'<p>Give the oxidation number of Mn in MnO₄⁻ and in Mn²⁺, and of O in H₂O₂ and in O₂. Which substance is the oxidizing agent, and how can you tell?</p>'},
    {id:'p3',n:'Pre 3',q:'<p>A flask reaches the endpoint after 3.60 × 10⁻⁴ mol of MnO₄⁻ has been added. How many moles of H₂O₂ were in the flask? Show the mole ratio you used.</p>'},
    {id:'p4',n:'Pre 4',q:'<p>Your partner adds 25 mL of distilled water to the flask instead of about 20 mL. Does that change the volume of KMnO₄ you need? Would it matter if they pipetted 1.20 mL of H₂O₂ instead of 1.00 mL? Explain both answers.</p>'},
    {id:'p5',n:'Pre 5',q:'<p>Why does this titration need no separate indicator? Describe the color you expect in the flask just before and just after the endpoint.</p>'},
    {id:'p6',n:'Pre 6',q:'<p>Name two things that make hydrogen peroxide break down faster. Why might a bottle that has been open for months test below the strength on its label?</p>'},
    {id:'a1',n:'Post 1',q:'<p>Compare your average % H₂O₂ with the 3% on the label. Is the difference larger than the spread between your three trials? What does that tell you about this bottle?</p>'},
    {id:'a2',n:'Post 2',q:'<p>Why do you rinse the buret with KMnO₄, not water, just before you fill it? If you rinsed it only with water, would your calculated % H₂O₂ come out too high or too low? Explain.</p>'},
    {id:'a3',n:'Post 3',q:'<p>Suppose an air bubble stays in the buret tip during the initial reading and comes out while you titrate. Does your volume added read too high or too low, and how does that change your calculated % H₂O₂?</p>'},
    {id:'a4',n:'Post 4',q:'<p>A student stops at a deep pink instead of the first pale pink. Which way does that push the calculated % H₂O₂, and why?</p>'},
    {id:'a5',n:'Post 5',q:'<p>The first drops of KMnO₄ lose their color slowly, but drops in the middle of the titration clear almost at once. What forms in the flask that could explain this?</p>'},
    {id:'a6',n:'Post 6',q:'<p>With too little acid in the flask, some MnO₄⁻ is reduced to brown MnO₂ (Mn is +4) instead of Mn²⁺. Answer each part, and use the Deep dive if you ran it.</p>',
     fields:[{id:'a',label:'(a) Electrons gained per MnO₄⁻, and the new H₂O₂ : MnO₄⁻ mole ratio'},{id:'b',label:'(b) More or less KMnO₄ needed for the same H₂O₂?'},{id:'c',label:'(c) Calculated % H₂O₂ too high or too low?'}]},
    {id:'r1',n:'LR 1',q:'<p><b>Lab Reflection: Lab Title.</b> Give your report a title that says what you measured and how.</p>',fields:[{id:'t',label:'Lab title'}]},
    {id:'r2',n:'LR 2',q:'<p><b>Lab Reflection: Background.</b> In your own words, explain the chemistry behind this lab: what is oxidized, what is reduced, and why permanganate can show its own endpoint.</p>'},
    {id:'r3',n:'LR 3',q:'<p><b>Lab Reflection: Procedure.</b> Summarize what you did, from rinsing the buret to the last trial, and why each careful step matters.</p>'},
    {id:'r4',n:'LR 4',q:'<p><b>Lab Reflection: Relevant Calculations.</b> Show one trial’s calculation from start to finish: from the volume of KMnO₄ added to the % H₂O₂. Include units at every step.</p>'},
    {id:'r5',n:'LR 5',q:'<p><b>Lab Reflection: Sources of Error.</b> Name at least three specific sources of error in this lab. For each one, say whether it makes your calculated % H₂O₂ too high or too low, and how you could reduce it.</p>'}],
  conclusion:{prompt:'<p><b>Lab Reflection: Conclusions.</b> State the average % H₂O₂ you found and how it compares with the 3% on the label. Say how closely your three trials agreed, and what your result tells you about this bottle of peroxide.</p>',cer:false}};

const TIT={
  id:'titration',hash:'titration',apUnit:14,order:2,tab:'Titration lab',kind:'Virtual lab',
  prereq:['molarity','ph'],next:['buffers','stoich'],
  card:'Run a real titration: open the stopcock, watch the indicator and the pH curve, and calculate the molarity of an unknown.',
  title:'Titration lab: find the concentration of an unknown',
  lede:{bio:'Add a base of known concentration to an acid of unknown concentration until the indicator changes color. That volume tells you how much acid was in the flask.',
        honors:'Find the equivalence point from the color change and the pH curve, compare strong and weak acids, and choose an indicator that changes at the right pH.',
        ap:'Read pKa from the half-equivalence point, use the derivative to locate equivalence, and run a redox titration where permanganate is its own indicator.'},
  scale:{bio:'Bench scale: a 50 mL burette over a 125 mL Erlenmeyer flask. One drop is about 0.05 mL. The zoom shows 20 acid particles standing in for about 10²¹.',
         ap:'Bench scale: 50 mL burette (read to ±0.01 mL), 25.00 mL sample from a volumetric pipet. The zoom’s 20 analyte particles stand in for about 10²¹; water is not drawn.'},
  timeScale:1,dtMax:0.05,prewarm:0,sampleDt:0.25,window:60,unit:'s',chChange:1,chReveal:30,
  controls:[
    {id:'type',label:'Titration',type:'select',def:'ss',lvl:'bio',options:[{v:'ss',l:'HCl (unknown) with NaOH'},{v:'ws',l:'Weak acid (unknown) with NaOH',lvl:'honors'},{v:'wb',l:'NH₃ (unknown) with HCl',lvl:'honors'},{v:'redox',l:'H₂O₂ (unknown) with KMnO₄',lvl:'ap'}],onChange(sim){BioLab.reset(sim);syncMode(sim);}},
    {id:'rate',label:'Stopcock',type:'seg',def:'closed',lvl:'bio',noTrial:true,options:[{v:'closed',l:'Closed'},{v:'drip',l:'Drip'},{v:'open',l:'Open'}],help:'Drip is 2 drops per second. Open runs about 1 mL per second.',onChange(sim){if(sim.p.rate!=='closed')gAct(sim);}},
    {id:'ind',label:'Indicator',type:'select',def:'phenol',lvl:'bio',modes:['ss','ws','wb'],options:[{v:'phenol',l:'Phenolphthalein (8.2–10.0)'},{v:'btb',l:'Bromothymol blue (6.0–7.6)'},{v:'mred',l:'Methyl red (4.4–6.2)',lvl:'honors'},{v:'morange',l:'Methyl orange (3.1–4.4)',lvl:'honors'},{v:'none',l:'None (pH meter only)',lvl:'honors'}]},
    {id:'va',label:'Sample volume (pipet)',type:'seg',def:25,lvl:'bio',options:[{v:10,l:'10.00 mL'},{v:25,l:'25.00 mL'}],onChange(sim){BioLab.reset(sim);}},
    {id:'acid',label:'Weak acid',type:'select',def:'HC2H3O2',lvl:'ap',modes:['ws'],options:Object.keys(ACIDS).map(k=>({v:k,l:ACIDS[k].n[0].toUpperCase()+ACIDS[k].n.slice(1)+', Ka = '+ACIDS[k].Ka.toExponential(1).replace('e-',' × 10⁻').replace(/⁻(\d+)/,(m,d)=>'⁻'+d.split('').map(x=>'⁰¹²³⁴⁵⁶⁷⁸⁹'[x]).join(''))})),onChange(sim){BioLab.reset(sim);}},
    {id:'cb',label:'Titrant concentration',type:'seg',def:0.1,lvl:'honors',options:[{v:0.1,l:'0.100 M'},{v:0.2,l:'0.200 M'}],help:'For KMnO₄ these are 0.0200 M and 0.0400 M.',onChange(sim){BioLab.reset(sim);}},
    {id:'meter',label:'pH meter in the flask',type:'toggle',def:true,lvl:'bio',modes:['ss','ws','wb'],noTrial:true},
    // virtual lab bench only (hidden in the other views)
    {id:'rxCock',label:'Stopcock',type:'seg',def:'closed',vlab:true,noTrial:true,options:[{v:'closed',l:'Closed'},{v:'drops',l:'Drop by drop'},{v:'stream',l:'Fast stream'}],help:'A fast stream runs about 0.9 mL per second. Drop by drop is about 0.05 mL a drop, nearly 2 drops a second.'},
    {id:'rxSwirl',label:'Swirl the flask as you add',type:'toggle',def:true,vlab:true,noTrial:true,help:'Swirling mixes each drop through the whole flask.'},
    {id:'rxAcid',label:'3 M H₂SO₄ to add',type:'seg',def:10,vlab:true,noTrial:true,options:[{v:10,l:'10 mL (as written)'},{v:1,l:'1 mL (too little)'}]}
  ],
  actions:[
    {id:'drop',label:'Add one drop',lvl:'bio',primary:true,run(sim){gAct(sim);addVol(sim,DROP);sim.vis.drops=(sim.vis.drops||[]);sim.vis.drops.push({y:330});}},
    {id:'mark',label:'Mark endpoint',lvl:'bio',run(sim){const p=sim.p;if(sim.st.V<=0)return;sim.st.mark=sim.st.V;MARKS.push({type:p.type,unk:UNK[p.type],va:+p.va,cb:+p.cb,V:+sim.st.V.toFixed(2),acid:p.acid});while(MARKS.length>12)MARKS.shift();sim.infoDirty=true;}},
    {id:'refill',label:'Rinse and refill',lvl:'bio',run(sim){BioLab.setValues(sim,{rate:'closed'});BioLab.reset(sim);}},
    {id:'unknown',label:'New unknown',lvl:'bio',run(sim){const p=sim.p,r=Math.random();UNK[p.type]=p.type==='redox'?+(0.030+0.035*r).toFixed(4):+(0.060+0.080*r).toFixed(4);BioLab.setValues(sim,{rate:'closed'});BioLab.reset(sim);}}
  ].concat(RX_ACTIONS),
  labs:[LAB_RX],
  /* what the bench instruments show right now (used by the virtual-lab tests) */
  benchRead(sim){const b=rxB(sim);if(!b)return null;const fl=b.fl,c=fl?rxColor(fl):null;
    return {buret:b.filled?Math.round(b.level*100)/100:null,bubble:!!b.bubble,cock:sim.p.rxCock,under:b.under,label:rxM(sim),flask:c?c[1]:null,spot:fl?fl.spot:0,placed:!!(fl&&fl.placed),slot:b.slot};},
  /* Challenge game: six titrations. Find rounds: watch the indicator (or the pH meter) and stop at the endpoint.
     Calc rounds: no color cue, so calculate the volume (M₁V₁ = M₂V₂, the 2 : 5 ratio, half-equivalence, Henderson–Hasselbalch)
     and deliver exactly that much. Within 0.10 mL (two drops) of the target scores. */
  game:{label:'Hit the endpoint',title:'Hit the endpoint',rounds:6,fireLabel:'Mark endpoint',par:420,controls:['rate'],metrics:['vol'],
    intro:{bio:'Six titrations. Use the stopcock to add base: Open to go fast, then Drip or Add one drop near the end. Press Mark endpoint when you think you are there. Within 0.10 mL (two drops) of the endpoint scores, and a first-try hit scores 3 points.',
           honors:'Six titrations: a strong acid, a weak acid and a weak base. Find the endpoint by color, or calculate it and deliver exactly that volume. Within 0.10 mL (two drops) scores; a first-try hit scores 3.',
           ap:'Six titrations: weak acids with a pH meter, permanganate with its 2 : 5 mole ratio, and the buffer region. Stop within 0.10 mL (two drops) of the target, then press Mark endpoint. A first-try hit scores 3.'},
    start(sim){const p=sim.p;if(!sim._gBak)sim._gBak={type:p.type,va:p.va,cb:p.cb,acid:p.acid,ind:p.ind,meter:p.meter};},
    newRound(sim,i){const s=gMake(BioLab.level,i);
      BioLab.setValues(sim,Object.assign({gC:s.p.gC},s.p,{rate:'closed'}));BioLab.reset(sim);sim.vis.key='';
      const r=Object.assign(s,{controls:['rate'],pre:{ind:s.p.ind,meter:s.p.meter}});
      // the engine hides every action button in a game; single drops are part of this one, so show that button again
      Promise.resolve().then(()=>{if(sim.gameRound===r){const b=dropBtn(sim);if(b)b.hidden=false;}});
      return r;},
    fire(sim,r){r.V=+sim.st.V;BioLab.setValues(sim,{rate:'closed'});if(r.post)BioLab.setValues(sim,r.post);sim.st.gShow=true;sim.st.gOver=false;r.ft=performance.now();},
    poll(sim,r){if(performance.now()-r.ft<650)return null;const j=gJudge(sim.p,r);if(!j.ok&&j.over)sim.st.gOver=true;return {ok:j.ok,msg:j.msg};},
    retry(sim,r){sim.st.gShow=false;},
    solve(sim,r){BioLab.setValues(sim,{rate:'closed'});const v=Math.round((r.kind==='find'&&!r.known?r.target:r.calc)/DROP)*DROP;setV(sim,+v.toFixed(2));sim.vis.key='';}},
  init(sim){if(!sim.game){delete sim.p.gC;sim._gBak=null;}const s={V:0,pts:[[0,sim.p.type==='redox'?0:pHat(sim.p,0)]],drip:0,mark:null,lastV:0};
    if(sim.vlab&&sim.vlab.lab.id==='h2o2-redox')s.R=rxInit(sim);return s;},
  step(sim,dt){const st=sim.st,p=sim.p;if(st.R){if(sim.t>=-1e-9)rxStep(sim,dt);return;}
    if(p.rate==='drip'){st.drip+=dt;while(st.drip>=0.5){st.drip-=0.5;addVol(sim,DROP);if(sim.vis)(sim.vis.drops=sim.vis.drops||[]).push({y:330});}}
    else if(p.rate==='open'){addVol(sim,1.0*dt);st.drip=0;}else st.drip=0;},
  metrics:[
    {id:'vol',label:'Titrant added (burette reading)',unit:'mL',lvl:'bio',min:0,max:50,d:2,get:s=>s.st.V},
    {id:'pH',label:'pH',unit:'',lvl:'bio',min:0,max:14,d:2,fixed:true,modes:['ss','ws','wb'],get:s=>pHat(s.p,s.st.V)},
    {id:'color',label:'Flask color',unit:'',lvl:'bio',text:true,get:s=>{const c=flaskColor(s.p,s.st.V)[1];return c[0].toUpperCase()+c.slice(1);}},
    {id:'mmol',label:'Titrant added',unit:'mmol',lvl:'honors',min:0,max:null,d:3,get:s=>cfg(s.p).ct*s.st.V},
    {id:'mno4',label:'Excess MnO₄⁻',unit:'mM',lvl:'ap',min:0,max:null,d:3,modes:['redox'],get:s=>1000*mnO4(s.p,s.st.V)},
    {id:'left',label:'Analyte left in flask',unit:'mmol',lvl:'ap',min:0,max:null,d:3,get:s=>{const c=cfg(s.p);return Math.max(0,c.nA*(1-s.st.V/c.Ve));}},
    {id:'species',label:'Main species in the flask',unit:'',lvl:'ap',text:true,get:s=>species(s.p,s.st.V)}
  ],
  graphs:[{id:'curve',label:'Titration curve',lvl:'bio',custom:true},{id:'deriv',label:'Slope of the curve, ΔpH/ΔV',lvl:'ap',custom:true},{id:'pHt',label:'pH vs time',lvl:'bio',lines:['pH']}],
  defaultGraph:'curve',
  plot(sim,ctx,box,id){const p=sim.p,st=sim.st,c=cfg(p),red=p.type==='redox';
    if(id==='curve'){const ymax=red?Math.max(1,...st.pts.map(q=>q[1]))*1.15:14;
      const ax=axes(ctx,box,{xmin:0,xmax:VMAX,ymin:0,ymax,xl:c.t.titN+' added (mL)',yl:red?'Excess MnO₄⁻ (mM)':'pH'});
      ctx.save();ctx.beginPath();ctx.rect(box.L,box.T,box.W,box.H);ctx.clip();
      if(st.mark!==null){ctx.strokeStyle=PAL['s4'];ctx.setLineDash([5,4]);ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(ax.X(st.mark),box.T);ctx.lineTo(ax.X(st.mark),box.T+box.H);ctx.stroke();
        if(atLeast('honors')&&p.type!=='redox'){ctx.strokeStyle=PAL['s3'];ctx.beginPath();ctx.moveTo(ax.X(st.mark/2),box.T);ctx.lineTo(ax.X(st.mark/2),box.T+box.H);ctx.stroke();}ctx.setLineDash([]);}
      ctx.strokeStyle=serColor(0);ctx.lineWidth=2.5;ctx.beginPath();st.pts.forEach((q,i)=>i?ctx.lineTo(ax.X(q[0]),ax.Y(q[1])):ctx.moveTo(ax.X(q[0]),ax.Y(q[1])));ctx.stroke();
      ctx.fillStyle=serColor(1);const L=st.pts[st.pts.length-1];if(L){ctx.beginPath();ctx.arc(ax.X(L[0]),ax.Y(L[1]),5,0,6.29);ctx.fill();}ctx.restore();
      const it=[{label:'your data',color:serColor(0)}];if(st.mark!==null){it.push({label:'your endpoint',color:PAL['s4'],dash:true});if(atLeast('honors')&&!red)it.push({label:'half of it',color:PAL['s3'],dash:true});}
      legend(ctx,box.L+12,box.T+10,it);return;}
    if(red){txt(ctx,'The redox titration has no pH curve. Use the titration curve view.',box.cw/2,box.ch/2,{s:15,c:PAL['muted'],a:'center',b:'middle'});return;}
    const d=[];for(let i=1;i<st.pts.length;i++){const a=st.pts[i-1],b=st.pts[i],dv=b[0]-a[0];if(dv>0.02)d.push([(a[0]+b[0])/2,(b[1]-a[1])/dv]);}
    const ymax=Math.max(1,...d.map(q=>q[1]))*1.1;const ax=axes(ctx,box,{xmin:0,xmax:VMAX,ymin:0,ymax,xl:c.t.titN+' added (mL)',yl:'ΔpH / ΔV (per mL)'});
    ctx.save();ctx.beginPath();ctx.rect(box.L,box.T,box.W,box.H);ctx.clip();ctx.strokeStyle=serColor(4);ctx.lineWidth=2.5;ctx.beginPath();d.forEach((q,i)=>i?ctx.lineTo(ax.X(q[0]),ax.Y(q[1])):ctx.moveTo(ax.X(q[0]),ax.Y(q[1])));ctx.stroke();ctx.restore();
    if(d.length){const pk=d.reduce((a,b)=>b[1]>a[1]?b:a);txt(ctx,'steepest at '+pk[0].toFixed(2)+' mL',ax.X(pk[0])+8,box.T+16,{s:13,c:PAL['muted']});}},
  infoPanel(sim){const p=sim.p,st=sim.st,c=cfg(p),hon=atLeast('honors'),ap=atLeast('ap');
    const mine=MARKS.filter(m=>m.type===p.type&&m.unk===c.C&&m.va===c.va&&m.cb===+p.cb);
    const tn=c.t.titN,an=p.type==='ws'?c.acid.f:c.t.flask,ratio=p.type==='redox'?'5 mol H₂O₂ : 2 mol MnO₄⁻':'1 : 1';
    let h=`<h3>Your results</h3>`;
    if(!mine.length)return h+`<p>Add ${tn} until the flask ${p.type==='redox'?'keeps a faint purple color':'just changes color and stays changed'}, then press <b>Mark endpoint</b>. Go fast at first, then switch to <b>Drip</b> or single drops as the color starts to flash.</p><p class="help">Sample: ${c.va.toFixed(2)} mL of ${an}. Titrant: ${c.ct.toFixed(p.type==='redox'?4:3)} M ${tn}. Mole ratio ${ratio}.</p>`;
    const rows=mine.slice(-3).map((m,i)=>{const nT=c.ct*m.V/1000,nA=p.type==='redox'?nT*5/2:nT,M=nA/(c.va/1000);return {V:m.V,nT,nA,M};});
    h+=`<div class="tbl-wrap"><table><thead><tr><th>Trial</th><th>Initial (mL)</th><th>Final (mL)</th><th>${tn} used (mL)</th>${hon?'<th>mol '+tn+'</th>':''}<th>[${an}] (M)</th></tr></thead><tbody>${rows.map((r,i)=>`<tr><td>${i+1}</td><td>0.00</td><td>${r.V.toFixed(2)}</td><td>${r.V.toFixed(2)}</td>${hon?'<td>'+r.nT.toExponential(3)+'</td>':''}<td>${r.M.toFixed(4)}</td></tr>`).join('')}</tbody></table></div>`;
    const last=rows[rows.length-1],avg=rows.reduce((a,r)=>a+r.M,0)/rows.length;
    h+=`<p><b>Calculation:</b> ${c.ct.toFixed(p.type==='redox'?4:3)} mol/L × ${(last.V/1000).toFixed(5)} L = ${last.nT.toExponential(3)} mol ${tn}${p.type==='redox'?' × 5/2 = '+last.nA.toExponential(3)+' mol H₂O₂':' = mol '+an}. ÷ ${(c.va/1000).toFixed(5)} L = <b>${last.M.toFixed(4)} M</b>.</p>`;
    const err=100*(avg-c.C)/c.C;
    h+=`<p>Average of ${rows.length} trial${rows.length>1?'s':''}: ${avg.toFixed(4)} M. True value: <b>${c.C.toFixed(4)} M</b>. Percent error: ${err>=0?'+':''}${err.toFixed(1)}%.</p>`;
    if(hon&&p.type!=='redox'){const half=last.V/2,ph=pHat(p,half,c);h+=`<p class="help">${Math.abs(err)>2?'A large error usually means the indicator changed away from the equivalence point, or you overshot. ':''}At half your endpoint volume (${half.toFixed(2)} mL) the pH is ${ph.toFixed(2)}.${p.type==='ws'?' For a weak acid that is the pKa: Ka ≈ '+Math.pow(10,-ph).toExponential(1)+' (true '+c.acid.Ka.toExponential(1)+').':''}</p>`;}
    if(ap)h+=`<p class="help">Equivalence point from the model: ${c.Ve.toFixed(2)} mL${p.type!=='redox'?', pH '+pHat(p,c.Ve,c).toFixed(2):''}.</p>`;
    return h;},
  narrate(sim){if(sim.st.R&&sim.vlab)return rxNarr(sim);const p=sim.p,st=sim.st,c=cfg(p),V=st.V,rg=region(p,V,c),hon=atLeast('honors'),pH=pHat(p,V,c),fc=flaskColor(p,V,c)[1];
    const an=p.type==='ws'?c.acid.f:c.t.flask;
    if(V>=VMAX)return 'The burette is empty. Press <b>Rinse and refill</b> to start a new trial.';
    if(p.type==='redox'){
      if(rg==='start')return 'The flask holds colorless H₂O₂ in sulfuric acid. Open the stopcock: each purple MnO₄⁻ that drips in oxidizes H₂O₂ to O₂ gas and turns into nearly colorless Mn²⁺.';
      if(rg==='after'||rg==='eq')return '<b>A purple color stays.</b> Every H₂O₂ is used up, so the next MnO₄⁻ has nothing to react with and its color remains. That first lasting pink-purple is the endpoint: permanganate is its own indicator.';
      return 'The purple MnO₄⁻ <b>loses its color as soon as it mixes in</b>, because H₂O₂ is still there to reduce it to Mn²⁺. '+(hon?Math.round(100*V/c.Ve)+'% of the H₂O₂ has reacted. ':'')+'Watch for O₂ bubbles.';}
    const s=(rg==='start'?'The flask holds '+c.va.toFixed(2)+' mL of '+an+' (pH '+pH.toFixed(2)+'). Open the stopcock to add '+c.t.titN+'.':
      rg==='before'?(p.type==='ss'?'Each OH⁻ that drips in meets an H₃O⁺ and they make water. <b>Plenty of acid is left</b>, so the pH has only crept up to '+pH.toFixed(2)+'.':
                     p.type==='ws'?'Each OH⁻ pulls H⁺ off an '+c.acid.f+' molecule, making '+c.acid.an+'. Now both '+c.acid.f+' and '+c.acid.an+' are in the flask: a <b>buffer</b>, so the pH rises slowly ('+pH.toFixed(2)+').':
                     'Each H₃O⁺ from the HCl gives its H⁺ to an NH₃, making NH₄⁺. NH₃ and NH₄⁺ together are a <b>buffer</b>, so the pH falls slowly ('+pH.toFixed(2)+').'):
      rg==='near'?'<b>Slow down.</b> Almost all the '+an+' is used up, so each drop now changes the pH a lot (pH '+pH.toFixed(2)+'). Switch to Drip or single drops.':
      rg==='eq'?'<b>Equivalence point:</b> the moles of '+c.t.titN+' added equal the moles of '+an+' you started with. pH = '+pH.toFixed(2)+(p.type==='ss'?', neutral, because Na⁺ and Cl⁻ do not react with water.':p.type==='ws'?', above 7, because '+c.acid.an+' is a weak base.':', below 7, because NH₄⁺ is a weak acid.'):
      'You are past the equivalence point. Extra '+c.t.titN+' has nothing left to react with, so the pH is now set by the excess: '+pH.toFixed(2)+'.');
    return s+(p.ind!=='none'?' The flask is '+fc+'.':'');},
  tour:[
    {title:'The burette',text:{bio:'The burette holds the titrant, a solution whose concentration you know: 0.100 M NaOH. You read the volume at the bottom of the meniscus. It starts at 0.00 mL.',ap:'The burette is read to two decimal places (±0.01 mL): the last digit is estimated between the 0.1 mL lines. Reading = final − initial.'},focus:[20,14,190,312],pause:true,setup(sim){BioLab.setValues(sim,{type:'ss',va:25,ind:'phenol',rate:'closed'});BioLab.reset(sim);}},
    {title:'The flask',text:'The Erlenmeyer flask holds exactly 25.00 mL of HCl from a pipet, plus a few drops of phenolphthalein. Phenolphthalein is colorless in acid and turns pink above pH 8.2. The pH meter reads the pH as you go.',focus:[12,300,232,148],pause:true},
    {title:'Open the stopcock',text:'NaOH streams in. In the zoom, each OH⁻ (red O with a white H) finds an H₃O⁺ (pink) and they make two water molecules: H₃O⁺ + OH⁻ → 2 H₂O. Na⁺ and Cl⁻ (pale) just watch: they are spectator ions.',focus:[ZX-ZR-8,ZY-ZR-8,2*ZR+16,2*ZR+16],speed:0.5,setup(sim){BioLab.setValues(sim,{rate:'open'});}},
    {title:'The curve stays flat at first',text:'While lots of acid is left, each mL of base removes only a small fraction of the H₃O⁺, so the pH barely moves.',focus:[496,20,300,300],speed:1,setup(sim){setV(sim,cfg(sim.p).Ve*0.75);sim.vis.key='';BioLab.setValues(sim,{rate:'drip'});}},
    {title:'Slow down near the endpoint',text:'Close to the end, each drop flashes pink where it lands, then the color fades as you swirl. Add single drops now.',focus:[12,300,232,148],speed:1,setup(sim){setV(sim,cfg(sim.p).Ve-0.4);sim.vis.key='';BioLab.setValues(sim,{rate:'drip'});}},
    {title:'Equivalence and endpoint',text:{bio:'One drop past equivalence the pH jumps and the pink stays. That is the endpoint. Moles of NaOH added = moles of HCl in the flask, so M(acid) = M(base) × V(base) ÷ V(acid).',honors:'The equivalence point is where moles of base = moles of acid. The endpoint is where the indicator changes. A good indicator makes them nearly the same volume.'},focus:[496,20,300,300],pause:true,setup(sim){setV(sim,cfg(sim.p).Ve+0.05);sim.vis.key='';BioLab.setValues(sim,{rate:'closed'});}},
    {lvl:'honors',title:'A weak acid has a buffer region',text:{honors:'With acetic acid the curve starts higher, rises gently through a buffer region, and the equivalence point is above pH 7.',ap:'Halfway to equivalence, [HA] = [A⁻], so pH = pKa (4.74 for acetic acid). The equivalence pH is about 8.7 because acetate is a weak base.'},focus:[496,20,300,300],pause:true,setup(sim){BioLab.setValues(sim,{type:'ws',acid:'HC2H3O2',rate:'closed'});setV(sim,cfg(sim.p).Ve*0.5);sim.vis.key='';}},
    {lvl:'ap',title:'Redox: permanganate is its own indicator',text:'Purple MnO₄⁻ oxidizes H₂O₂ to O₂ and becomes nearly colorless Mn²⁺. Once the H₂O₂ is gone, the next drop stays purple. The 2 : 5 mole ratio comes from the balanced redox equation.',focus:[[12,14,232,434],[ZX-ZR-8,ZY-ZR-8,2*ZR+16,2*ZR+16]],speed:0.5,setup(sim){BioLab.setValues(sim,{type:'redox',rate:'drip'});setV(sim,cfg(sim.p).Ve-0.6);sim.vis.key='';}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{type:'ss',rate:'closed',ind:'phenol',va:25});BioLab.reset(sim);syncMode(sim);},
  onChallenge(sim,ch,phase){if(ch&&ch.instant&&ch.set&&phase==='done'){BioLab.setValues(sim,ch.set);BioLab.reset(sim);if(ch.vol)setV(sim,ch.vol(cfg(sim.p)));sim.vis.key='';syncMode(sim);sim.infoDirty=true;}},
  challenges(sim){
    const P0={type:'ss',va:25,cb:0.1,ind:'phenol',acid:'HC2H3O2',meter:true,rate:'closed'};
    const C=(o)=>cfg(Object.assign({},P0,o));
    const ss=C({}),ws=C({type:'ws'}),wb=C({type:'wb'}),rx=C({type:'redox'});
    const ph=(o,V)=>pHat(Object.assign({},P0,o),V);
    const wsEq=ph({type:'ws'},ws.Ve),wbEq=ph({type:'wb'},wb.Ve),half=ph({type:'ws'},ws.Ve/2);
    // where methyl orange finishes changing (pH 4.4) for acetic acid
    let vMO=0;for(let v=0;v<ws.Ve;v+=0.05)if(ph({type:'ws'},v)>=4.4){vMO=v;break;}
    return [
    {lvl:'bio',q:'You open the stopcock and let NaOH stream into the HCl. How does the pH change?',choices:['It rises steadily, the same amount for every mL','It barely changes, then jumps sharply near the equivalence point, then levels off','It jumps up right away and then stays high'],correct:1,
     baseline:{type:'ss',va:25,rate:'closed'},change:{rate:'open'},changeText:'Stopcock opened',watch:'curve',reveal:Math.min(49,ss.Ve+12),
     explain:{bio:'The pH stayed below 3 for most of the titration, then shot from about 4 to 10 within a fraction of a mL near '+ss.Ve.toFixed(1)+' mL, then leveled off. While acid is in excess, each OH⁻ is used up at once, so [H₃O⁺] falls only slowly. Near the end, one drop removes the last acid.',honors:'pH is a log scale. Going from pH 1 to pH 2 needs 90% of the acid neutralized; pH 2 to 3 needs 99%. The last 1% of the acid disappears in a single drop, which is the jump.'}},
    {lvl:'bio',instant:true,set:{type:'ss',va:25},vol:c=>c.Ve,q:'At the equivalence point of HCl with NaOH, what is the pH?',choices:['7.00, neutral','Above 7','Below 7'],correct:0,
     explain:{bio:'The model is now at the equivalence point and the meter reads '+ph({},ss.Ve).toFixed(2)+'. HCl + NaOH → NaCl + H₂O. Na⁺ and Cl⁻ do not react with water, so the solution is neutral. Only strong acid with strong base gives exactly 7.'}},
    {lvl:'bio',instant:true,set:{type:'ss',va:10},vol:c=>c.Ve,q:'You needed about '+ss.Ve.toFixed(1)+' mL of NaOH for a 25.00 mL sample. How much would a 10.00 mL sample of the same HCl need?',choices:['The same, because the concentration is the same','About '+(ss.Ve*0.4).toFixed(1)+' mL, because there are fewer moles of acid','More, because the sample is more concentrated'],correct:1,
     explain:{bio:'The model now holds a 10.00 mL sample at its equivalence point: '+(ss.Ve*0.4).toFixed(2)+' mL. The base reacts with moles of acid, not concentration. 10/25 of the volume holds 10/25 of the moles, so it needs 10/25 of the base. The calculated molarity comes out the same.'}},
    {lvl:'honors',instant:true,set:{type:'ws',va:25,acid:'HC2H3O2'},vol:c=>c.Ve,q:'You titrate acetic acid (a weak acid) with NaOH. What is the pH at the equivalence point?',choices:['7.00','Above 7, about '+wsEq.toFixed(1),'Below 7'],correct:1,
     explain:{honors:'The model is at the equivalence point: pH '+wsEq.toFixed(2)+'. All the acid has become acetate, C₂H₃O₂⁻, which is a weak base: C₂H₃O₂⁻ + H₂O ⇌ HC₂H₃O₂ + OH⁻. "Equivalence" means equal moles, not neutral pH.'}},
    {lvl:'honors',q:'You titrate acetic acid using methyl orange, which changes from red to yellow between pH 3.1 and 4.4. When does the flask turn yellow?',choices:['Right at the equivalence point','Far too early, well before the equivalence point','It never changes'],correct:1,
     baseline:{type:'ws',va:25,acid:'HC2H3O2',ind:'morange',rate:'closed'},change:{rate:'open'},changeText:'Stopcock opened',watch:'curve',reveal:1+Math.max(vMO+3,ws.Ve*0.55),
     explain:{honors:'Methyl orange finished turning yellow at about '+vMO.toFixed(1)+' mL, but equivalence is at '+ws.Ve.toFixed(1)+' mL. The acetic acid curve passes pH 4.4 early in the buffer region. Choose an indicator that changes near the equivalence pH ('+wsEq.toFixed(1)+'): phenolphthalein.'}},
    {lvl:'honors',instant:true,set:{type:'wb',va:25},vol:c=>c.Ve,q:'You titrate ammonia, NH₃ (a weak base), with HCl. What is the pH at the equivalence point?',choices:['Above 7','Exactly 7','Below 7, about '+wbEq.toFixed(1)],correct:2,
     explain:{honors:'The model is at the equivalence point: pH '+wbEq.toFixed(2)+'. All the NH₃ has become NH₄⁺, a weak acid: NH₄⁺ + H₂O ⇌ NH₃ + H₃O⁺. Methyl red (4.4–6.2) suits this titration; phenolphthalein would change far too early.'}},
    {lvl:'ap',instant:true,set:{type:'ws',va:25,acid:'HC2H3O2'},vol:c=>c.Ve/2,q:'At the half-equivalence point of the acetic acid titration, what is the pH?',choices:['pKa, about 4.74','7.00','Half of the starting pH'],correct:0,
     explain:{ap:'The model is at half-equivalence: pH '+half.toFixed(2)+'. Half the HA has become A⁻, so [HA] = [A⁻] and Henderson–Hasselbalch gives pH = pKa + log(1) = pKa = '+(-Math.log10(ACIDS.HC2H3O2.Ka)).toFixed(2)+'. This is how the RJ weak-acid lab finds Ka.'}},
    {lvl:'ap',instant:true,set:{type:'ws',va:25,acid:'HClO'},vol:c=>c.Ve,q:'You swap acetic acid for the same concentration of HClO, a much weaker acid (Ka = 3.0 × 10⁻⁸). How does the equivalence volume change?',choices:['It is larger','It is the same','It is smaller'],correct:1,
     explain:{ap:'The model now titrates HClO at the same concentration: equivalence is still '+ws.Ve.toFixed(2)+' mL. OH⁻ reacts completely with any weak acid, so the volume depends only on moles. What changes is the curve: it starts higher (pH '+ph({type:'ws',acid:'HClO'},0).toFixed(1)+'), the jump is much smaller, and the equivalence pH is '+ph({type:'ws',acid:'HClO'},ws.Ve).toFixed(1)+'.'}},
    {lvl:'ap',q:'In the KMnO₄ + H₂O₂ titration, how do you know when to stop?',choices:['A pH meter reads 7','The first purple color that stays, because no H₂O₂ is left to remove it','The solution turns clear'],correct:1,
     baseline:{type:'redox',va:25,rate:'closed'},change:{rate:'open'},changeText:'Stopcock opened',reveal:Math.min(49,rx.Ve+8),watch:'curve',
     explain:{ap:'Before '+rx.Ve.toFixed(1)+' mL every MnO₄⁻ was reduced to nearly colorless Mn²⁺. After that the excess MnO₄⁻ stays purple. Moles: n(H₂O₂) = (5/2) × M(KMnO₄) × V. The solution is acidified with H₂SO₄ because the half-reaction needs H⁺: MnO₄⁻ + 8H⁺ + 5e⁻ → Mn²⁺ + 4H₂O.'}}
  ];},
  lab:{bio:'<p><b>Question:</b> What is the molarity of the unknown HCl?</p><ol><li>Open the stopcock and watch the flask. When pink starts to flash, close it and add single drops.</li><li>Stop at the first pink that stays for 30 seconds and press <b>Mark endpoint</b>.</li><li>Press <b>Rinse and refill</b> and repeat for 3 trials. Your results appear next to the graph.</li></ol><p>Calculate M(acid) = M(base) × V(base) ÷ V(acid) for each trial and average them. Safety in the real lab: goggles on, and acids and bases are corrosive.</p>',
       honors:'<p><b>Question:</b> How do the curves for strong and weak acids differ, and which indicator should you use?</p><ol><li>Titrate the HCl and the weak acid to well past the equivalence point. Use Record trial at 0, 5, 10, … mL and near the jump.</li><li>Repeat the weak acid titration with methyl orange, methyl red and phenolphthalein, and mark the endpoint each time.</li><li>Compare each endpoint with the equivalence volume.</li></ol><p>Sketch both curves. Explain why the weak acid’s equivalence pH is above 7 and which indicator gives the smallest error.</p>',
       ap:'<p><b>Question:</b> What are the concentration and the Ka of the unknown weak acid?</p><ol><li>Titrate with the pH meter, adding single drops near the jump.</li><li>Use the ΔpH/ΔV graph to find the equivalence volume.</li><li>Read the pH at half that volume and calculate Ka. Repeat for another weak acid.</li><li>Run the KMnO₄ titration of H₂O₂ and find [H₂O₂].</li></ol><p><b>Claim–evidence–reasoning:</b> Justify pH = pKa at half-equivalence with Henderson–Hasselbalch, and explain why the equivalence volume does not depend on Ka.</p>'},
  terms:[{t:'Titration',d:'Adding a solution of known concentration to a sample until the reaction is complete, to find the sample’s concentration.'},{t:'Titrant',d:'The solution in the burette, with a known concentration.'},{t:'Analyte',d:'The solution in the flask whose concentration you want to find.'},{t:'Burette',d:'A long graduated tube with a stopcock that delivers measured volumes, read to ±0.01 mL.'},{t:'Indicator',d:'A dye that changes color at a certain pH.'},{t:'Endpoint',d:'The point where the indicator changes color and you stop.'},{t:'Equivalence point',d:'The point where moles of titrant exactly match moles of analyte (by the mole ratio).'},
    {lvl:'honors',t:'Neutralization',d:'Acid + base → salt + water. The net ionic equation for strong acid + strong base is H₃O⁺ + OH⁻ → 2 H₂O.'},{lvl:'honors',t:'Spectator ion',d:'An ion present in the solution that does not take part in the reaction, such as Na⁺ and Cl⁻.'},{lvl:'honors',t:'Buffer region',d:'The flat part of a weak acid’s curve, where both HA and A⁻ are present.'},
    {lvl:'ap',t:'Half-equivalence point',d:'Halfway to equivalence, [HA] = [A⁻] and pH = pKa.'},{lvl:'ap',t:'Self-indicating titration',d:'A titration where the titrant’s own color shows the endpoint, like purple MnO₄⁻ becoming colorless Mn²⁺.'}],
  about:'<p>Every pH point is solved exactly from the charge balance of the mixture (H₃O⁺, OH⁻, Na⁺ or Cl⁻, and the weak acid or base species), using Kw = 1.0 × 10⁻¹⁴ and Ka values at 25 °C from the ChemLab data table (acetic acid 1.8 × 10⁻⁵, formic 1.8 × 10⁻⁴, benzoic 6.3 × 10⁻⁵, HClO 3.0 × 10⁻⁸, NH₄⁺ 5.6 × 10⁻¹⁰). Volumes add, concentrations stand in for activities, and the indicator’s own tiny acid content is ignored. The curve is drawn from those calculated readings as you add titrant, never from a stored shape.</p><p>Indicator color ranges are standard values. The pink “flash” near the endpoint models the local excess of base where a drop lands before it mixes. The redox titration uses 2 MnO₄⁻ + 5 H₂O₂ + 6 H⁺ → 2 Mn²⁺ + 5 O₂ + 8 H₂O in excess sulfuric acid; its pH is not modeled.</p><p>The zoom shows 20 analyte particles; titrant particles are added in proportion to the moles delivered, and every one that reacts is accounted for (water molecules fade out to keep the view clear). Unknown concentrations are drawn between 0.060 and 0.140 M (H₂O₂: 0.030 to 0.065 M).</p>',
  initVis(sim){sim.vis.P=null;sim.vis.drops=[];sim.vis.flash=0;sim.vis.key='';},
  draw(sim,ctx,vdt,k,t){if(sim.st.R&&sim.vlab){rxDraw(sim,ctx,vdt,k,t);return;}const p=sim.p,st=sim.st,v=sim.vis,c=cfg(p),hon=atLeast('honors'),ap=atLeast('ap'),red=p.type==='redox';
    // in the game, hide what a real student could not see until the endpoint is marked
    const G=sim.game,gr=G&&sim.gameRound,gShow=!gr||st.gShow||G.state==='over',cover=!!(gr&&gr.cover&&!gShow);
    ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
    // keep particles in step with the model
    const key=p.type+'|'+p.va+'|'+p.cb+'|'+c.C;if(!v.P||v.key!==key||st.V<v.Vb-1e-9)rebuild(sim);
    const target=Math.min(64,Math.floor(unitsAt(p,st.V,c)+1e-9));let guard=0;while(v.S<target&&guard++<6)spawn(sim,c);v.Vb=st.V;
    if(!RM)stepParticles(sim,vdt);
    // labels
    txt(ctx,'Flask: '+(gr&&(gr.known||gr.kind==='calc'&&!gr.two)?(p.type==='ws'?c.acid.f:c.t.flask)+', '+c.C.toFixed(4)+' M':p.type==='ws'?c.acid.f+' (unknown)':c.t.flaskN.replace(', in H₂SO₄','')),250,22,{s:12.5*k,w:700});
    if(k<1.3)txt(ctx,'Burette: '+c.ct.toFixed(red?4:3)+' M '+c.t.titN,250,22+17*k,{s:12.5*k,c:PAL['cv-soft']});
    // ring stand + burette
    ctx.fillStyle=PAL['cv-soft'];ctx.fillRect(28,10,5,428);ctx.fillRect(28,120,60,5);
    const tube=[BX-9,B0-14,18,VMAX*BMM+24];ctx.fillStyle=PAL['card'];ctx.fillRect(tube[0],tube[1],tube[2],tube[3]);
    const titCol=red?'#7b2a90':PAL['cv-water'],my=B0+st.V*BMM;ctx.fillStyle=titCol;ctx.fillRect(tube[0]+2,my,tube[2]-4,B0+VMAX*BMM+10-my);
    ctx.fillStyle=titCol;ctx.fillRect(BX-3,B0+VMAX*BMM+10,6,20);
    ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=2;ctx.strokeRect(tube[0],tube[1],tube[2],tube[3]);
    ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1;for(let m=0;m<=VMAX;m++){const y=B0+m*BMM;ctx.beginPath();ctx.moveTo(BX+9,y);ctx.lineTo(BX+9-(m%10===0?9:m%5===0?6:3),y);ctx.stroke();}
    for(let m=0;m<=VMAX;m+=10)txt(ctx,String(m),BX-14,B0+m*BMM,{s:12*k,c:PAL['cv-soft'],a:'right',b:'middle'});
    ctx.strokeStyle=red?'#4a1557':PAL['cv-glass'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(BX-7,my+3);ctx.quadraticCurveTo(BX,my+7,BX+7,my+3);ctx.stroke();
    // stopcock and tip
    const sy=B0+VMAX*BMM+16;ctx.fillStyle=PAL['cv-glass'];ctx.fillRect(BX-3,sy-4,6,30);ctx.fillStyle=p.rate==='closed'?PAL['cv-soft']:PAL['s3'];
    if(p.rate==='closed')ctx.fillRect(BX-16,sy,32,7);else{ctx.save();ctx.translate(BX,sy+3);ctx.rotate(p.rate==='open'?Math.PI/2:Math.PI/4);ctx.fillRect(-16,-3.5,32,7);ctx.restore();}
    {ctx.font='700 '+(12*k)+'px '+FONT;const w=ctx.measureText(st.V.toFixed(2)+' mL').width+13*k;pill(ctx,st.V.toFixed(2)+' mL',BX+14+w/2,clamp(my+4,B0,B0+VMAX*BMM),PAL['card'],PAL['cv-ink'],12*k);}
    // flask
    const FY=322,lv=lerp(414,376,clamp((c.va+st.V-10)/65,0,1));const fcol=cover?PAL['cv-water']:flaskColor(p,st.V,c)[0];
    const flask=()=>{ctx.beginPath();ctx.moveTo(BX-13,FY);ctx.lineTo(BX-13,FY+28);ctx.lineTo(BX-66,438);ctx.lineTo(BX+66,438);ctx.lineTo(BX+13,FY+28);ctx.lineTo(BX+13,FY);};
    ctx.fillStyle=PAL['card'];rr(ctx,BX-80,438,160,8,3);ctx.fill();
    ctx.save();flask();ctx.closePath();ctx.clip();ctx.fillStyle=fcol;ctx.fillRect(0,lv,200,80);
    // local flash where the titrant lands, which fades as it mixes in
    const landing=p.rate==='open'?1.0:p.rate==='drip'||v.drops.length?0.5:0;
    if(landing>0){const fc=flaskColor(p,Math.min(VMAX,st.V+landing*1.2),c)[0];v.flashCol=fc;v.flash=Math.min(1,v.flash+(p.rate==='open'?2:0)*vdt);}
    if(v.flash>0.02&&v.flashCol&&!cover){const g=ctx.createRadialGradient(BX,lv+12,2,BX,lv+12,40);g.addColorStop(0,v.flashCol);g.addColorStop(1,'rgba(0,0,0,0)');ctx.globalAlpha=v.flash*0.9;ctx.fillStyle=g;ctx.fillRect(BX-45,lv,90,60);ctx.globalAlpha=1;}
    v.flash=Math.max(0,v.flash-vdt*0.8);
    ctx.restore();
    if(cover){ctx.fillStyle=PAL['card2'];flask();ctx.closePath();ctx.fill();txt(ctx,'Covered',BX,412,{s:12*k,w:700,c:PAL['cv-soft'],a:'center',b:'middle'});}
    ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=2.5;flask();ctx.stroke();
    // drops and stream
    if(p.rate==='open'){ctx.strokeStyle=titCol===PAL['cv-water']?PAL['cv-glass']:titCol;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(BX,sy+26);ctx.lineTo(BX,lv);ctx.stroke();}
    v.drops=(v.drops||[]).filter(d=>{d.y+=260*vdt;if(d.y>=lv){v.flash=Math.min(1,v.flash+0.7);v.flashCol=flaskColor(p,Math.min(VMAX,st.V+0.6),c)[0];return false;}
      ctx.fillStyle=red?'#7b2a90':PAL['cv-glass'];ctx.beginPath();ctx.ellipse(BX,d.y,3,4.5,0,0,6.29);ctx.fill();return true;});
    // pH meter
    if(!red&&p.meter){ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(130,346);ctx.quadraticCurveTo(110,346,BX+8,FY+6);ctx.lineTo(BX+8,lv+30);ctx.stroke();ctx.fillStyle=PAL['cv-glass'];rr(ctx,BX+4,lv+10,8,24,4);ctx.fill();
      const mh=44*Math.min(k,1.3);rr(ctx,128,322,108,mh,8);ctx.fillStyle='#1d2a2c';ctx.fill();ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.5;ctx.stroke();
      txt(ctx,'pH',138,322+mh/2,{s:12*k,w:700,c:'#9fd8b0',b:'middle'});txt(ctx,pHat(p,st.V,c).toFixed(2),228,322+mh/2+1,{s:20*Math.min(k,1.3),w:800,c:'#7CFC9A',a:'right',b:'middle'});}
    // zoom
    ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=1.5;ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(BX+20,lv+8);ctx.lineTo(ZX-ZR*0.95,ZY+ZR*0.3);ctx.moveTo(BX+10,FY+6);ctx.lineTo(ZX-ZR*0.7,ZY-ZR*0.7);ctx.stroke();ctx.setLineDash([]);
    ctx.save();ctx.beginPath();ctx.arc(ZX,ZY,ZR,0,6.29);ctx.fillStyle=gShow?mix(PAL['cv-water'],fcol,0.22):PAL['card'];ctx.fill();ctx.clip();
    const order=['Cl','Na','K','W','O2','H2O2','HA','A','B','BH','Mn','H3O','OH','MnO4'];
    if(gShow)order.forEach(ty=>v.P.forEach(q=>{if(q.t===ty)drawP(ctx,q,ZX+q.x,ZY+q.y);}));
    else (k>1.3?['Particle view','after you mark']:['Particle view','opens when you','mark the endpoint']).forEach((s,i,A)=>txt(ctx,s,ZX,ZY+(i-(A.length-1)/2)*20*k,{s:(i?13:14)*k,w:i?400:700,c:i?PAL['cv-soft']:PAL['cv-ink'],a:'center',b:'middle'}));
    if(gShow&&v.flashP&&v.flashP.t>0){v.flashP.t-=vdt;ctx.strokeStyle=PAL['s4'];ctx.lineWidth=2;ctx.globalAlpha=clamp(v.flashP.t*2,0,1);ctx.beginPath();ctx.arc(ZX+v.flashP.x,ZY+v.flashP.y,10+(0.5-v.flashP.t)*30,0,6.29);ctx.stroke();ctx.globalAlpha=1;}
    ctx.restore();ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=3;ctx.beginPath();ctx.arc(ZX,ZY,ZR,0,6.29);ctx.stroke();
    // legend under the zoom
    const big=k>1.3,it=legendItems(p,c.acid,big).slice(0,big?4:5),rowH=Math.max(22,20*k),colW=108;
    it.forEach((e,i)=>{const col=big?0:i%2,row=big?i:Math.floor(i/2),x=250+col*colW,y=ZY+ZR+(big?20:24)+row*(big?34:rowH);drawP(ctx,{t:e[0],a:0.6,life:1.8},x+8,y);txt(ctx,e[1],x+22,y+1,{s:12*k,c:PAL['cv-soft'],b:'middle'});});
    // live curve (in the game, only when a pH meter is in the flask)
    if(gr&&!(p.meter&&!red)){ctx.fillStyle=PAL['card'];ctx.fillRect(CV.L,CV.T,CV.W,CV.H);ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.strokeRect(CV.L,CV.T,CV.W,CV.H);
      (gr.cover?(k>1.3?['Flask covered:','calculate it']:['The flask is covered:','trust your calculation']):red?(k>1.3?['No pH curve:','watch for purple']:['No pH curve here:','watch the flask','for purple that stays']):(k>1.3?['No pH meter','this round']:['No pH meter','in the flask this round'])).forEach((s,i,A)=>txt(ctx,s,CV.L+CV.W/2,CV.T+CV.H/2+(i-(A.length-1)/2)*20*k,{s:(i?13:14)*k,w:i?400:700,c:i?PAL['cv-soft']:PAL['cv-ink'],a:'center',b:'middle'}));}
    else{const ymax=red?Math.max(1,...st.pts.map(q=>q[1]))*1.15:14,X=x=>CV.L+x/VMAX*CV.W,Y=y=>CV.T+CV.H-y/ymax*CV.H;
    ctx.fillStyle=PAL['card'];ctx.fillRect(CV.L,CV.T,CV.W,CV.H);ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;
    for(let x=0;x<=VMAX;x+=10){ctx.beginPath();ctx.moveTo(X(x),CV.T);ctx.lineTo(X(x),CV.T+CV.H);ctx.stroke();if(x%(k>1.3?25:10)===0)txt(ctx,String(x),X(x),CV.T+CV.H+16*k,{s:12*k,c:PAL['cv-soft'],a:'center'});}
    const yt=red?[0,ymax/2,ymax]:[0,7,14];yt.forEach(y=>{ctx.beginPath();ctx.moveTo(CV.L,Y(y));ctx.lineTo(CV.L+CV.W,Y(y));ctx.stroke();txt(ctx,red?y.toFixed(1):String(y),CV.L-6,Y(y),{s:12*k,c:PAL['cv-soft'],a:'right',b:'middle'});});
    ctx.strokeStyle=PAL['cv-soft'];ctx.strokeRect(CV.L,CV.T,CV.W,CV.H);
    txt(ctx,red?'excess MnO₄⁻ (mM)':'pH',k>1.3?CV.L+CV.W:CV.L,CV.T-8,{s:12*k,w:700,c:PAL['cv-ink'],a:k>1.3?'right':'left'});
    txt(ctx,'mL of '+c.t.titN+' added',CV.L+CV.W/2,CV.T+CV.H+38*k,{s:12*k,c:PAL['cv-soft'],a:'center'});
    if(st.mark!==null){ctx.strokeStyle=PAL['s4'];ctx.setLineDash([4,3]);ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(X(st.mark),CV.T);ctx.lineTo(X(st.mark),CV.T+CV.H);ctx.stroke();ctx.setLineDash([]);}
    ctx.save();ctx.beginPath();ctx.rect(CV.L,CV.T,CV.W,CV.H);ctx.clip();ctx.strokeStyle=PAL['s1'];ctx.lineWidth=2.5;ctx.beginPath();st.pts.forEach((q,i)=>i?ctx.lineTo(X(q[0]),Y(q[1])):ctx.moveTo(X(q[0]),Y(q[1])));ctx.stroke();
    const L=st.pts[st.pts.length-1];if(L){ctx.fillStyle=PAL['s2'];ctx.beginPath();ctx.arc(X(L[0]),Y(L[1]),5,0,6.29);ctx.fill();}ctx.restore();}
    // equation and status
    const ex=490,ey=CV.T+CV.H+(k>1.3?92:66);
    const eq=red?[c.t.eq,c.t.eq2]:p.type==='ws'?(k>1.3?[c.acid.f+' + OH⁻','→ '+c.acid.an+' + H₂O']:[c.acid.f+' + OH⁻ → '+c.acid.an+' + H₂O']):[c.t.eq];
    eq.forEach((e,i)=>txt(ctx,e,ex,ey+i*18*k,{s:13*k,w:700}));
    const rg=region(p,st.V,c),line2=rg==='start'?'Nothing added yet':rg==='after'?(k>1.3?'Past equivalence':'Past equivalence: '+c.t.titN+' in excess'):rg==='eq'?'Equivalence point':rg==='near'?'Almost there: go drop by drop':(red?'H₂O₂ in excess':(p.type==='wb'?'NH₃':'Acid')+' in excess');
    if(!gr)txt(ctx,line2,ex,ey+eq.length*18*k+4,{s:12.5*k,c:PAL['cv-soft']});
    if(!gr&&hon&&k<1.3)txt(ctx,(cfg(p).ct*st.V).toFixed(3)+' mmol '+c.t.titN+' added',ex,ey+eq.length*18*k+22,{s:12.5*k,c:PAL['cv-soft']});
  },
  thumbSetup(sim){setV(sim,cfg(sim.p).Ve+0.1);}
};
function species(p,V){const c=cfg(p),rg=region(p,V,c);
  if(p.type==='redox')return rg==='after'||rg==='eq'?'Mn²⁺, excess MnO₄⁻':'H₂O₂, Mn²⁺';
  if(p.type==='ss')return rg==='after'?'Na⁺, Cl⁻, OH⁻':rg==='eq'?'Na⁺, Cl⁻ (neutral)':'H₃O⁺, Cl⁻, Na⁺';
  if(p.type==='ws')return rg==='start'?c.acid.f+' (mostly intact)':rg==='after'?c.acid.an+', OH⁻, Na⁺':rg==='eq'?c.acid.an+', Na⁺':c.acid.f+' + '+c.acid.an+' (buffer)';
  return rg==='start'?'NH₃ (mostly intact)':rg==='after'?'NH₄⁺, H₃O⁺, Cl⁻':rg==='eq'?'NH₄⁺, Cl⁻':'NH₃ + NH₄⁺ (buffer)';}
TIT.onLevel=syncMode;
delete TIT.game; /* the Hit the endpoint game is held back until it is approved for students */
BioLab.register(TIT);
})();
