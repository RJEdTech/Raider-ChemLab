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

function cfg(p){const t=TYPES[p.type]||TYPES.ss,C=UNK[p.type],va=+p.va,ct=p.type==='redox'?(+p.cb)/5:+p.cb;
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
function syncMode(sim){if(!sim.ui||!sim.ui.sec)return;const mode=sim.p.type,d=sim.def;
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
    {id:'rate',label:'Stopcock',type:'seg',def:'closed',lvl:'bio',noTrial:true,options:[{v:'closed',l:'Closed'},{v:'drip',l:'Drip'},{v:'open',l:'Open'}],help:'Drip is 2 drops per second. Open runs about 1 mL per second.'},
    {id:'ind',label:'Indicator',type:'select',def:'phenol',lvl:'bio',modes:['ss','ws','wb'],options:[{v:'phenol',l:'Phenolphthalein (8.2–10.0)'},{v:'btb',l:'Bromothymol blue (6.0–7.6)'},{v:'mred',l:'Methyl red (4.4–6.2)',lvl:'honors'},{v:'morange',l:'Methyl orange (3.1–4.4)',lvl:'honors'},{v:'none',l:'None (pH meter only)',lvl:'honors'}]},
    {id:'va',label:'Sample volume (pipet)',type:'seg',def:25,lvl:'bio',options:[{v:10,l:'10.00 mL'},{v:25,l:'25.00 mL'}],onChange(sim){BioLab.reset(sim);}},
    {id:'acid',label:'Weak acid',type:'select',def:'HC2H3O2',lvl:'ap',modes:['ws'],options:Object.keys(ACIDS).map(k=>({v:k,l:ACIDS[k].n[0].toUpperCase()+ACIDS[k].n.slice(1)+', Ka = '+ACIDS[k].Ka.toExponential(1).replace('e-',' × 10⁻').replace(/⁻(\d+)/,(m,d)=>'⁻'+d.split('').map(x=>'⁰¹²³⁴⁵⁶⁷⁸⁹'[x]).join(''))})),onChange(sim){BioLab.reset(sim);}},
    {id:'cb',label:'Titrant concentration',type:'seg',def:0.1,lvl:'honors',options:[{v:0.1,l:'0.100 M'},{v:0.2,l:'0.200 M'}],help:'For KMnO₄ these are 0.0200 M and 0.0400 M.',onChange(sim){BioLab.reset(sim);}},
    {id:'meter',label:'pH meter in the flask',type:'toggle',def:true,lvl:'bio',modes:['ss','ws','wb'],noTrial:true}
  ],
  actions:[
    {id:'drop',label:'Add one drop',lvl:'bio',primary:true,run(sim){addVol(sim,DROP);sim.vis.drops=(sim.vis.drops||[]);sim.vis.drops.push({y:330});}},
    {id:'mark',label:'Mark endpoint',lvl:'bio',run(sim){const p=sim.p;if(sim.st.V<=0)return;sim.st.mark=sim.st.V;MARKS.push({type:p.type,unk:UNK[p.type],va:+p.va,cb:+p.cb,V:+sim.st.V.toFixed(2),acid:p.acid});while(MARKS.length>12)MARKS.shift();sim.infoDirty=true;}},
    {id:'refill',label:'Rinse and refill',lvl:'bio',run(sim){BioLab.setValues(sim,{rate:'closed'});BioLab.reset(sim);}},
    {id:'unknown',label:'New unknown',lvl:'bio',run(sim){const p=sim.p,r=Math.random();UNK[p.type]=p.type==='redox'?+(0.030+0.035*r).toFixed(4):+(0.060+0.080*r).toFixed(4);BioLab.setValues(sim,{rate:'closed'});BioLab.reset(sim);}}
  ],
  init(sim){return {V:0,pts:[[0,sim.p.type==='redox'?0:pHat(sim.p,0)]],drip:0,mark:null,lastV:0};},
  step(sim,dt){const st=sim.st,p=sim.p;
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
  narrate(sim){const p=sim.p,st=sim.st,c=cfg(p),V=st.V,rg=region(p,V,c),hon=atLeast('honors'),pH=pHat(p,V,c),fc=flaskColor(p,V,c)[1];
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
  draw(sim,ctx,vdt,k,t){const p=sim.p,st=sim.st,v=sim.vis,c=cfg(p),hon=atLeast('honors'),ap=atLeast('ap'),red=p.type==='redox';
    ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
    // keep particles in step with the model
    const key=p.type+'|'+p.va+'|'+p.cb+'|'+c.C;if(!v.P||v.key!==key||st.V<v.Vb-1e-9)rebuild(sim);
    const target=Math.min(64,Math.floor(unitsAt(p,st.V,c)+1e-9));let guard=0;while(v.S<target&&guard++<6)spawn(sim,c);v.Vb=st.V;
    if(!RM)stepParticles(sim,vdt);
    // labels
    txt(ctx,'Flask: '+(p.type==='ws'?c.acid.f+' (unknown)':c.t.flaskN.replace(', in H₂SO₄','')),250,22,{s:12.5*k,w:700});
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
    const FY=322,lv=lerp(414,376,clamp((c.va+st.V-10)/65,0,1));const [fcol]=flaskColor(p,st.V,c);
    const flask=()=>{ctx.beginPath();ctx.moveTo(BX-13,FY);ctx.lineTo(BX-13,FY+28);ctx.lineTo(BX-66,438);ctx.lineTo(BX+66,438);ctx.lineTo(BX+13,FY+28);ctx.lineTo(BX+13,FY);};
    ctx.fillStyle=PAL['card'];rr(ctx,BX-80,438,160,8,3);ctx.fill();
    ctx.save();flask();ctx.closePath();ctx.clip();ctx.fillStyle=fcol;ctx.fillRect(0,lv,200,80);
    // local flash where the titrant lands, which fades as it mixes in
    const landing=p.rate==='open'?1.0:p.rate==='drip'||v.drops.length?0.5:0;
    if(landing>0){const fc=flaskColor(p,Math.min(VMAX,st.V+landing*1.2),c)[0];v.flashCol=fc;v.flash=Math.min(1,v.flash+(p.rate==='open'?2:0)*vdt);}
    if(v.flash>0.02&&v.flashCol){const g=ctx.createRadialGradient(BX,lv+12,2,BX,lv+12,40);g.addColorStop(0,v.flashCol);g.addColorStop(1,'rgba(0,0,0,0)');ctx.globalAlpha=v.flash*0.9;ctx.fillStyle=g;ctx.fillRect(BX-45,lv,90,60);ctx.globalAlpha=1;}
    v.flash=Math.max(0,v.flash-vdt*0.8);
    ctx.restore();
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
    ctx.save();ctx.beginPath();ctx.arc(ZX,ZY,ZR,0,6.29);ctx.fillStyle=mix(PAL['cv-water'],fcol,0.22);ctx.fill();ctx.clip();
    const order=['Cl','Na','K','W','O2','H2O2','HA','A','B','BH','Mn','H3O','OH','MnO4'];
    order.forEach(ty=>v.P.forEach(q=>{if(q.t===ty)drawP(ctx,q,ZX+q.x,ZY+q.y);}));
    if(v.flashP&&v.flashP.t>0){v.flashP.t-=vdt;ctx.strokeStyle=PAL['s4'];ctx.lineWidth=2;ctx.globalAlpha=clamp(v.flashP.t*2,0,1);ctx.beginPath();ctx.arc(ZX+v.flashP.x,ZY+v.flashP.y,10+(0.5-v.flashP.t)*30,0,6.29);ctx.stroke();ctx.globalAlpha=1;}
    ctx.restore();ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=3;ctx.beginPath();ctx.arc(ZX,ZY,ZR,0,6.29);ctx.stroke();
    // legend under the zoom
    const big=k>1.3,it=legendItems(p,c.acid,big).slice(0,big?4:5),rowH=Math.max(22,20*k),colW=108;
    it.forEach((e,i)=>{const col=big?0:i%2,row=big?i:Math.floor(i/2),x=250+col*colW,y=ZY+ZR+(big?20:24)+row*(big?34:rowH);drawP(ctx,{t:e[0],a:0.6,life:1.8},x+8,y);txt(ctx,e[1],x+22,y+1,{s:12*k,c:PAL['cv-soft'],b:'middle'});});
    // live curve
    const ymax=red?Math.max(1,...st.pts.map(q=>q[1]))*1.15:14,X=x=>CV.L+x/VMAX*CV.W,Y=y=>CV.T+CV.H-y/ymax*CV.H;
    ctx.fillStyle=PAL['card'];ctx.fillRect(CV.L,CV.T,CV.W,CV.H);ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;
    for(let x=0;x<=VMAX;x+=10){ctx.beginPath();ctx.moveTo(X(x),CV.T);ctx.lineTo(X(x),CV.T+CV.H);ctx.stroke();if(x%(k>1.3?25:10)===0)txt(ctx,String(x),X(x),CV.T+CV.H+16*k,{s:12*k,c:PAL['cv-soft'],a:'center'});}
    const yt=red?[0,ymax/2,ymax]:[0,7,14];yt.forEach(y=>{ctx.beginPath();ctx.moveTo(CV.L,Y(y));ctx.lineTo(CV.L+CV.W,Y(y));ctx.stroke();txt(ctx,red?y.toFixed(1):String(y),CV.L-6,Y(y),{s:12*k,c:PAL['cv-soft'],a:'right',b:'middle'});});
    ctx.strokeStyle=PAL['cv-soft'];ctx.strokeRect(CV.L,CV.T,CV.W,CV.H);
    txt(ctx,red?'excess MnO₄⁻ (mM)':'pH',k>1.3?CV.L+CV.W:CV.L,CV.T-8,{s:12*k,w:700,c:PAL['cv-ink'],a:k>1.3?'right':'left'});
    txt(ctx,'mL of '+c.t.titN+' added',CV.L+CV.W/2,CV.T+CV.H+38*k,{s:12*k,c:PAL['cv-soft'],a:'center'});
    if(st.mark!==null){ctx.strokeStyle=PAL['s4'];ctx.setLineDash([4,3]);ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(X(st.mark),CV.T);ctx.lineTo(X(st.mark),CV.T+CV.H);ctx.stroke();ctx.setLineDash([]);}
    ctx.save();ctx.beginPath();ctx.rect(CV.L,CV.T,CV.W,CV.H);ctx.clip();ctx.strokeStyle=PAL['s1'];ctx.lineWidth=2.5;ctx.beginPath();st.pts.forEach((q,i)=>i?ctx.lineTo(X(q[0]),Y(q[1])):ctx.moveTo(X(q[0]),Y(q[1])));ctx.stroke();
    const L=st.pts[st.pts.length-1];if(L){ctx.fillStyle=PAL['s2'];ctx.beginPath();ctx.arc(X(L[0]),Y(L[1]),5,0,6.29);ctx.fill();}ctx.restore();
    // equation and status
    const ex=490,ey=CV.T+CV.H+(k>1.3?92:66);
    const eq=red?[c.t.eq,c.t.eq2]:p.type==='ws'?(k>1.3?[c.acid.f+' + OH⁻','→ '+c.acid.an+' + H₂O']:[c.acid.f+' + OH⁻ → '+c.acid.an+' + H₂O']):[c.t.eq];
    eq.forEach((e,i)=>txt(ctx,e,ex,ey+i*18*k,{s:13*k,w:700}));
    const rg=region(p,st.V,c),line2=rg==='start'?'Nothing added yet':rg==='after'?(k>1.3?'Past equivalence':'Past equivalence: '+c.t.titN+' in excess'):rg==='eq'?'Equivalence point':rg==='near'?'Almost there: go drop by drop':(red?'H₂O₂ in excess':(p.type==='wb'?'NH₃':'Acid')+' in excess');
    txt(ctx,line2,ex,ey+eq.length*18*k+4,{s:12.5*k,c:PAL['cv-soft']});
    if(hon&&k<1.3)txt(ctx,(cfg(p).ct*st.V).toFixed(3)+' mmol '+c.t.titN+' added',ex,ey+eq.length*18*k+22,{s:12.5*k,c:PAL['cv-soft']});
  },
  thumbSetup(sim){setV(sim,cfg(sim.p).Ve+0.1);}
};
function species(p,V){const c=cfg(p),rg=region(p,V,c);
  if(p.type==='redox')return rg==='after'||rg==='eq'?'Mn²⁺, excess MnO₄⁻':'H₂O₂, Mn²⁺';
  if(p.type==='ss')return rg==='after'?'Na⁺, Cl⁻, OH⁻':rg==='eq'?'Na⁺, Cl⁻ (neutral)':'H₃O⁺, Cl⁻, Na⁺';
  if(p.type==='ws')return rg==='start'?c.acid.f+' (mostly intact)':rg==='after'?c.acid.an+', OH⁻, Na⁺':rg==='eq'?c.acid.an+', Na⁺':c.acid.f+' + '+c.acid.an+' (buffer)';
  return rg==='start'?'NH₃ (mostly intact)':rg==='after'?'NH₄⁺, H₃O⁺, Cl⁻':rg==='eq'?'NH₄⁺, Cl⁻':'NH₃ + NH₄⁺ (buffer)';}
TIT.onLevel=syncMode;
BioLab.register(TIT);
})();
