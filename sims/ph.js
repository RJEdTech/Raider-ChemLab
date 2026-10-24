(function(){
'use strict';
const {clamp,lerp,rng,randn,rr,txt,pill,atLeast,PAL,FONT,RM,axes,legend,serColor,lvText}=BioLab.h;
const CL=window.ChemLab;
const KW=CL.K.Kw;               // 1.0e-14 at 25 °C
const NP=40;                    // acid particles shown in each zoom
const ZR=104;                   // zoom radius (logical px)
const ZC=[[250,196],[650,196]]; // zoom centers: strong (left), weak (right)

/* ---------- chemistry ---------- */
/* Exact pH from the charge balance. sys: [{C, ka:[Ka1,Ka2,...], z0}] (z0 = charge of the fully protonated form);
   na = strong cations (Na⁺) and cl = strong anions (Cl⁻), in mol/L. Bisection on pH: f decreases as pH rises. */
function solvePH(sys,na,cl){
  const f=pH=>{const h=Math.pow(10,-pH);let q=h-KW/h+na-cl;
    for(const s of sys){if(!(s.C>0))continue;const n=s.ka.length,t=[1];let prod=1;
      for(let i=1;i<=n;i++){prod*=s.ka[i-1]/h;t.push(prod);}const sum=t.reduce((a,b)=>a+b,0);
      let z=0;for(let i=0;i<=n;i++)z+=t[i]/sum*(s.z0-i);q+=s.C*z;}
    return q;};
  let lo=-1.5,hi=15.5;for(let i=0;i<70;i++){const m=(lo+hi)/2;if(f(m)>0)lo=m;else hi=m;}return (lo+hi)/2;}
const kaOf=f=>{const a=CL.acids.find(x=>x.f===f);return a?a.Ka:NaN;};
const WEAK={
  HC2H3O2:{f:'HC₂H₃O₂',an:'C₂H₃O₂⁻',name:'acetic acid',Ka:kaOf('HC2H3O2'),col:'#d9822b'},
  HCHO2:{f:'HCHO₂',an:'CHO₂⁻',name:'formic acid',Ka:kaOf('HCHO2'),col:'#c46a9a'},
  HF:{f:'HF',an:'F⁻',name:'hydrofluoric acid',Ka:kaOf('HF'),col:'#5aa36a'},
  HNO2:{f:'HNO₂',an:'NO₂⁻',name:'nitrous acid',Ka:kaOf('HNO2'),col:'#4f86c6'},
  HClO:{f:'HClO',an:'ClO⁻',name:'hypochlorous acid',Ka:kaOf('HClO'),col:'#8d7bd0'},
  HCN:{f:'HCN',an:'CN⁻',name:'hydrocyanic acid',Ka:kaOf('HCN'),col:'#7c8a99'}};
const CL_COL='#3fa65a';
/* Typical values for household solutions (25 °C). Vinegar: 5% acetic acid ≈ 0.83 M, computed pH 2.4. */
const SOL=[
  {id:'lemon',n:'Lemon juice',pH:2.0,col:'#efe08a',k:'acid',note:'citric acid'},
  {id:'vinegar',n:'Vinegar',pH:2.4,col:null,k:'acid',note:'about 5% acetic acid'},
  {id:'cola',n:'Cola',pH:2.5,col:'#5b3216',k:'acid',note:'phosphoric and carbonic acids'},
  {id:'oj',n:'Orange juice',pH:3.5,col:'#f2a33a',k:'acid',note:'citric and ascorbic acids'},
  {id:'coffee',n:'Black coffee',pH:5.0,col:'#4a2c17',k:'acid',note:'chlorogenic and other acids'},
  {id:'milk',n:'Milk',pH:6.7,col:'#f3efe4',k:'acid',note:'lactic acid and proteins'},
  {id:'water',n:'Pure water',pH:7.0,col:null,k:'neutral',note:'only water’s own self-ionization'},
  {id:'blood',n:'Blood',pH:7.4,col:'#8e1b1b',k:'base',note:'held steady by the bicarbonate buffer'},
  {id:'soda',n:'Baking soda',pH:8.3,col:null,k:'base',note:'NaHCO₃ dissolved in water'},
  {id:'mom',n:'Milk of magnesia',pH:10.5,col:'#f1f1ef',k:'base',note:'Mg(OH)₂ suspension'},
  {id:'ammonia',n:'Ammonia cleaner',pH:11.6,col:null,k:'base',note:'NH₃ dissolved in water'},
  {id:'bleach',n:'Bleach',pH:12.6,col:'#f1f0cf',k:'base',note:'NaClO with some NaOH'},
  {id:'drain',n:'Drain cleaner',pH:14.0,col:null,k:'base',note:'about 1 M NaOH (lye)'}];
const SOLB={};SOL.forEach(s=>SOLB[s.id]=s);
const CONCS=[1,0.1,0.01,0.001,0.0001];
const cLabel=c=>({1:'1.0 M',0.1:'0.10 M',0.01:'0.010 M',0.001:'0.0010 M',0.0001:'0.00010 M'})[c]||c+' M';
const SUPC={'-':'⁻','0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹'};
const sup=n=>String(n).split('').map(c=>SUPC[c]||c).join('');
/* Always scientific notation: 2.5 × 10⁻¹³ */
function sx(v,sig){if(!Number.isFinite(v)||v<=0)return '—';sig=sig||2;let e=Math.floor(Math.log10(v)+1e-9),m=v/Math.pow(10,e);if(+m.toFixed(sig-1)>=10){m/=10;e++;}return e===0?m.toFixed(sig-1):m.toFixed(sig-1)+' × 10'+sup(e);}
function calc(p){
  const s=SOLB[p.sol]||SOLB.lemon,pH=s.pH,h=Math.pow(10,-pH);
  const C=+p.conc,wa=WEAK[p.weak]||WEAK.HC2H3O2;
  const pHs=solvePH([],0,C),pHw=solvePH([{C,ka:[wa.Ka],z0:0}],0,0),hw=Math.pow(10,-pHw);
  return {s,pH,h,oh:KW/h,pOH:14-pH,C,wa,pHs,pHw,hs:Math.pow(10,-pHs),hw,alpha:wa.Ka/(hw+wa.Ka)};}
const weakPH=(f,C)=>solvePH([{C,ka:[WEAK[f].Ka],z0:0}],0,0);

/* ---------- indicators ---------- */
const UNI=[[0,'#c4161c'],[2,'#e2421e'],[3,'#ec6a1f'],[4,'#f39a1f'],[5,'#f2c61c'],[6,'#cfd120'],[7,'#45a447'],[8,'#2a9a86'],[9,'#2f78c2'],[10,'#3554b3'],[12,'#433aa3'],[14,'#5b2a8c']];
function hex2(h){h=h.replace('#','');if(h.length===3)h=h.split('').map(c=>c+c).join('');return [0,2,4].map(i=>parseInt(h.slice(i,i+2),16));}
function mix(a,b,t){const A=hex2(a),B=hex2(b);return '#'+A.map((v,i)=>Math.round(lerp(v,B[i],clamp(t,0,1))).toString(16).padStart(2,'0')).join('');}
function ramp(stops,x){if(x<=stops[0][0])return stops[0][1];for(let i=1;i<stops.length;i++)if(x<=stops[i][0]){const t=(x-stops[i-1][0])/(stops[i][0]-stops[i-1][0]);return mix(stops[i-1][1],stops[i][1],t);}return stops[stops.length-1][1];}
const IND={
  none:{n:'No indicator'},
  litmus:{n:'Litmus',range:'4.5–8.3',c:pH=>pH<4.5?['#c9302c',1,'red']:pH>8.3?['#2f56b8',1,'blue']:[ramp([[4.5,'#c9302c'],[6.4,'#7b3f9e'],[8.3,'#2f56b8']],pH),1,'purple']},
  phenol:{n:'Phenolphthalein',range:'8.2–10.0',c:pH=>pH<8.2?['#e0218a',0,'colorless']:[ '#e0218a',clamp((pH-8.2)/1.8,0.15,1),pH<9?'pale pink':'pink']},
  btb:{n:'Bromothymol blue',range:'6.0–7.6',c:pH=>pH<6.0?['#e3c31a',1,'yellow']:pH>7.6?['#2f5fc4',1,'blue']:[ramp([[6.0,'#e3c31a'],[6.8,'#3f9e4d'],[7.6,'#2f5fc4']],pH),1,'green']},
  uni:{n:'Universal indicator',range:'0–14',c:pH=>[ramp(UNI,pH),1,pH<3?'red':pH<4.5?'orange':pH<6.3?'yellow':pH<7.5?'green':pH<9.5?'blue':pH<11.5?'indigo':'violet']}};
/* Liquid color: the solution's own color, tinted by the indicator. Returns [hex, name]. */
function liquid(ind,pH,natural){const base=natural||PAL['cv-water'];if(ind==='none'||!IND[ind])return [base,natural?'its own color':'colorless'];
  const [c,a,name]=IND[ind].c(pH);const dark=natural&&hex2(natural).reduce((s,v)=>s+v,0)<300;return [mix(base,c,a*(dark?0.35:0.85)),dark?name+' (hard to see)':name];}

/* ---------- mode-aware UI ---------- */
function syncMode(sim){if(!sim.ui||!sim.ui.sec)return;const mode=sim.p.mode,d=sim.def;
  d.controls.forEach(c=>{if(!c.modes)return;const cid=d.id+'-'+c.id,e=document.getElementById(cid)||document.getElementById(cid+'-l');if(!e)return;const w=e.closest('.ctl');if(w)w.hidden=!atLeast(c.lvl)||!c.modes.includes(mode);});
  d.metrics.forEach(m=>{if(!m.modes)return;const t=sim.ui.tiles[m.id];if(!t)return;const w=t.num.closest('.tile');if(w)w.hidden=!atLeast(m.lvl)||!m.modes.includes(mode);});
  const btns=[...sim.ui.sec.querySelectorAll('.actions button')];
  d.actions.forEach(a=>{const b=btns.find(x=>x.textContent===a.label);if(b)b.hidden=!atLeast(a.lvl)||!a.modes.includes(mode);});
  const want=mode==='scale'?'conc':'dil';if(sim.ui.gm&&(mode==='scale')!==(sim.gMetric==='conc')){if([...sim.ui.gm.options].some(o=>o.value===want)){sim.gMetric=want;sim.ui.gm.value=want;}}
  sim.infoDirty=true;}

/* ---------- particles ---------- */
function mkUnits(seed){const r=rng(seed),U=[];for(let i=0;i<NP;i++){const a=r()*6.283,d=Math.sqrt(r())*(ZR-16);U.push({x:Math.cos(a)*d,y:Math.sin(a)*d,vx:(r()-.5)*24,vy:(r()-.5)*24,s:0,hx:0,hy:0,hvx:0,hvy:0,ang:r()*6.28});}return U;}
function setStates(U,alpha){U.forEach(u=>{if(Math.random()<alpha){u.s=1;const a=Math.random()*6.28;u.hx=clamp(u.x+Math.cos(a)*30,-ZR+12,ZR-12);u.hy=clamp(u.y+Math.sin(a)*30,-ZR+12,ZR-12);u.hvx=Math.cos(a)*20;u.hvy=Math.sin(a)*20;}else u.s=0;});}
function walk(o,kx,ky,kvx,kvy,dt,R){o[kvx]+=randn()*70*dt;o[kvy]+=randn()*70*dt;o[kvx]*=0.985;o[kvy]*=0.985;const sp=Math.hypot(o[kvx],o[kvy]);if(sp>40){o[kvx]*=40/sp;o[kvy]*=40/sp;}
  o[kx]+=o[kvx]*dt;o[ky]+=o[kvy]*dt;const d=Math.hypot(o[kx],o[ky]);if(d>R){const nx=o[kx]/d,ny=o[ky]/d;o[kx]=nx*R;o[ky]=ny*R;const dot=o[kvx]*nx+o[kvy]*ny;o[kvx]-=2*dot*nx;o[kvy]-=2*dot*ny;}}
function stepUnits(U,alpha,dt){if(dt<=0)return;const k=0.9,R=ZR-12;
  U.forEach(u=>{walk(u,'x','y','vx','vy',dt,R);u.ang+=dt*0.8;
    if(u.s===0){if(Math.random()<k*alpha*dt){u.s=1;const a=Math.random()*6.28;u.hx=u.x+Math.cos(a)*14;u.hy=u.y+Math.sin(a)*14;u.hvx=Math.cos(a)*34;u.hvy=Math.sin(a)*34;}}
    else if(u.s===1){walk(u,'hx','hy','hvx','hvy',dt,R);if(alpha<0.999&&Math.random()<k*(1-alpha)*dt*1.25)u.s=2;}
    else{const dx=u.x-u.hx,dy=u.y-u.hy,d=Math.hypot(dx,dy);if(d<11){u.s=0;}else{u.hx+=dx/d*Math.min(d,90*dt);u.hy+=dy/d*Math.min(d,90*dt);}}});}
const nIon=U=>U.filter(u=>u.s>0).length;
function drawZoom(ctx,cx,cy,U,anCol,k,t,water){
  ctx.save();ctx.beginPath();ctx.arc(cx,cy,ZR,0,6.29);ctx.fillStyle=PAL['cv-water'];ctx.fill();ctx.clip();
  // background water molecules (faint, for context only)
  ctx.globalAlpha=0.35;ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=1.5;water.forEach(w=>{const x=cx+w[0]+Math.sin(t*0.5+w[2])*3,y=cy+w[1]+Math.cos(t*0.4+w[2])*3;ctx.beginPath();ctx.moveTo(x-4,y+3);ctx.lineTo(x,y);ctx.lineTo(x+4,y+3);ctx.stroke();});ctx.globalAlpha=1;
  U.forEach(u=>{const x=cx+u.x,y=cy+u.y;
    if(u.s===0){const hx=x+Math.cos(u.ang)*9,hy=y+Math.sin(u.ang)*9;ball(ctx,hx,hy,4.6,'#f4f4f4');ball(ctx,x,y,7.5,anCol);}
    else{ball(ctx,x,y,7.5,anCol);sign(ctx,x,y,'−');}});
  U.forEach(u=>{if(u.s>0){const x=cx+u.hx,y=cy+u.hy;ball(ctx,x,y,6.5,'#d22d68');sign(ctx,x,y,'+');}});
  ctx.restore();ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=3;ctx.beginPath();ctx.arc(cx,cy,ZR,0,6.29);ctx.stroke();}
function ball(ctx,x,y,r,c){const g=ctx.createRadialGradient(x-r*.35,y-r*.35,r*.15,x,y,r);g.addColorStop(0,'#ffffff');g.addColorStop(.3,c);g.addColorStop(1,CL.shade(c,-0.35));ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,6.29);ctx.fill();ctx.strokeStyle=CL.shade(c,-0.5);ctx.lineWidth=1;ctx.stroke();}
function sign(ctx,x,y,s){ctx.font='800 11px '+FONT;ctx.fillStyle='#fff';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(s,x,y+0.5);}
function meter(ctx,x,y,w,val,k,label){rr(ctx,x,y,w,44*Math.min(k,1.3),8);ctx.fillStyle='#1d2a2c';ctx.fill();ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.5;ctx.stroke();
  txt(ctx,label,x+10,y+22*Math.min(k,1.3),{s:12*k,w:700,c:'#9fd8b0',b:'middle'});txt(ctx,val,x+w-10,y+23*Math.min(k,1.3),{s:20*Math.min(k,1.3),w:800,c:'#7CFC9A',a:'right',b:'middle'});}

const PH={
  id:'ph',hash:'ph',apUnit:14,order:1,tab:'pH and acid strength',kind:'Simulation',
  prereq:['molarity','equilibrium'],next:['titration','buffers'],
  card:'Test lemon juice, coffee, blood and bleach on the pH scale, then watch strong and weak acids ionize side by side.',
  title:'pH: the scale, strong acids and weak acids',
  lede:{bio:'pH tells you how acidic or basic a solution is. Test household solutions, then compare a strong acid and a weak acid at the same concentration.',
        honors:'Each pH unit is a 10× change in [H₃O⁺]. Connect pH, pOH and [OH⁻], read indicator colors, and see why a weak acid ionizes only a little.',
        ap:'Find Ka from pH, solve weak-acid equilibria with an ICE table, and see why percent ionization rises when a weak acid is diluted.'},
  scale:{bio:'Beaker scale: about 100 mL of solution. The zoom circles show 40 acid particles each, so you can compare what fraction ionized.',
         ap:'Beaker scale: about 100 mL. Each zoom shows 40 acid particles out of roughly 10²¹ in the beaker; water molecules are drawn faintly and water’s own ions are left out.'},
  timeless:true,animated:true,chChange:1,chReveal:3,
  controls:[
    {id:'mode',label:'View',type:'seg',def:'scale',lvl:'bio',options:[{v:'scale',l:'pH scale'},{v:'compare',l:'Strong vs weak acid'}]},
    {id:'sol',label:'Solution to test',type:'select',def:'lemon',lvl:'bio',modes:['scale'],options:SOL.map(s=>({v:s.id,l:s.n+' (pH '+s.pH.toFixed(1)+')'}))},
    {id:'conc',label:'Acid concentration (both beakers)',type:'select',def:0.1,lvl:'bio',modes:['compare'],options:CONCS.map(c=>({v:c,l:cLabel(c)})),help:'Each step down is a 10× dilution.'},
    {id:'weak',label:'Weak acid in beaker B',type:'select',def:'HC2H3O2',lvl:'honors',modes:['compare'],options:[{v:'HC2H3O2',l:'Acetic acid, HC₂H₃O₂'},{v:'HCHO2',l:'Formic acid, HCHO₂'},{v:'HF',l:'Hydrofluoric acid, HF'},{v:'HNO2',l:'Nitrous acid, HNO₂',lvl:'ap'},{v:'HClO',l:'Hypochlorous acid, HClO',lvl:'ap'},{v:'HCN',l:'Hydrocyanic acid, HCN',lvl:'ap'}]},
    {id:'ind',label:'Indicator',type:'select',def:'none',lvl:'bio',options:[{v:'none',l:'None (natural color)'},{v:'uni',l:'Universal indicator'},{v:'litmus',l:'Litmus'},{v:'phenol',l:'Phenolphthalein',lvl:'honors'},{v:'btb',l:'Bromothymol blue',lvl:'honors'}],help:'A few drops of a dye whose color depends on pH.'}
  ],
  actions:[
    {id:'dilute',label:'Dilute 10×',lvl:'bio',primary:true,modes:['compare'],run(sim){const i=CONCS.indexOf(+sim.p.conc);BioLab.setValues(sim,{conc:i>=0&&i<CONCS.length-1?CONCS[i+1]:CONCS[0]});}},
    {id:'nexts',label:'Next solution',lvl:'bio',primary:true,modes:['scale'],run(sim){const i=SOL.findIndex(s=>s.id===sim.p.sol);BioLab.setValues(sim,{sol:SOL[(i+1)%SOL.length].id});}}
  ],
  init(){return {key:''};},
  step(sim,dt){const v=sim.vis;if(!v.U)return;const r=calc(sim.p),key=sim.p.weak+'|'+sim.p.conc;
    if(v.key!==key){v.key=key;setStates(v.U[0],1);setStates(v.U[1],r.alpha);}
    if(!RM){stepUnits(v.U[0],1,dt);stepUnits(v.U[1],r.alpha,dt);}},
  initVis(sim){const r=rng(7);sim.vis.U=[mkUnits(11),mkUnits(23)];sim.vis.key='';sim.vis.water=[];for(let i=0;i<34;i++){const a=r()*6.28,d=Math.sqrt(r())*(ZR-6);sim.vis.water.push([Math.cos(a)*d,Math.sin(a)*d,r()*6]);}},
  metrics:[
    {id:'pH',label:'pH',unit:'',lvl:'bio',min:0,max:14,d:2,fixed:true,modes:['scale'],get:s=>calc(s.p).pH},
    {id:'h',label:'[H₃O⁺]',unit:'M',lvl:'bio',text:true,modes:['scale'],get:s=>sx(calc(s.p).h,2)},
    {id:'kind',label:'This solution is',unit:'',lvl:'bio',text:true,modes:['scale'],get:s=>{const p=calc(s.p).pH;return p<6.95?'Acidic':p>7.05?'Basic':'Neutral';}},
    {id:'pOH',label:'pOH',unit:'',lvl:'honors',min:0,max:14,d:2,fixed:true,modes:['scale'],get:s=>calc(s.p).pOH},
    {id:'oh',label:'[OH⁻]',unit:'M',lvl:'honors',text:true,modes:['scale'],get:s=>sx(calc(s.p).oh,2)},
    {id:'kw',label:'[H₃O⁺][OH⁻] = Kw',unit:'',lvl:'ap',text:true,modes:['scale'],get:s=>{const r=calc(s.p);return sx(r.h*r.oh,2);}},
    {id:'pHs',label:'pH of HCl (strong)',unit:'',lvl:'bio',min:0,max:14,d:2,fixed:true,modes:['compare'],get:s=>calc(s.p).pHs},
    {id:'pHw',label:'pH of weak acid',unit:'',lvl:'bio',min:0,max:14,d:2,fixed:true,modes:['compare'],get:s=>calc(s.p).pHw},
    {id:'ion',label:'Weak acid ionized',unit:'%',lvl:'honors',min:0,max:100,d:2,modes:['compare'],get:s=>100*calc(s.p).alpha},
    {id:'hw',label:'[H₃O⁺] in weak acid',unit:'M',lvl:'ap',text:true,modes:['compare'],get:s=>sx(calc(s.p).hw,2)},
    {id:'ka',label:'Ka of weak acid',unit:'',lvl:'ap',text:true,modes:['compare'],get:s=>sx(calc(s.p).wa.Ka,2)}
  ],
  graphs:[{id:'conc',label:'[H₃O⁺] and [OH⁻] across the pH scale',lvl:'bio',custom:true},{id:'dil',label:'pH vs concentration: strong vs weak',lvl:'bio',custom:true},{id:'alpha',label:'Percent ionized vs concentration',lvl:'honors',custom:true}],
  defaultGraph:'conc',
  plot(sim,ctx,box,id){const r=calc(sim.p);
    if(id==='conc'){const ax=axes(ctx,box,{xmin:0,xmax:14,ymin:-14,ymax:0,xl:'pH',yl:'log₁₀ of concentration (M)'});
      ctx.save();ctx.beginPath();ctx.rect(box.L,box.T,box.W,box.H);ctx.clip();ctx.lineWidth=2.5;
      ctx.strokeStyle=serColor(0);ctx.beginPath();ctx.moveTo(ax.X(0),ax.Y(0));ctx.lineTo(ax.X(14),ax.Y(-14));ctx.stroke();
      ctx.strokeStyle=serColor(1);ctx.beginPath();ctx.moveTo(ax.X(0),ax.Y(-14));ctx.lineTo(ax.X(14),ax.Y(0));ctx.stroke();
      SOL.forEach(s=>{const on=s.id===sim.p.sol&&sim.p.mode==='scale';ctx.fillStyle=on?serColor(0):PAL['g-grid'];ctx.beginPath();ctx.arc(ax.X(s.pH),ax.Y(-s.pH),on?6:3.5,0,6.29);ctx.fill();
        ctx.fillStyle=on?serColor(1):PAL['g-grid'];ctx.beginPath();ctx.arc(ax.X(s.pH),ax.Y(s.pH-14),on?6:3.5,0,6.29);ctx.fill();});
      ctx.restore();legend(ctx,box.L+box.W*0.3,box.T+12,[{label:'log [H₃O⁺]',color:serColor(0)},{label:'log [OH⁻]',color:serColor(1)}]);
      if(sim.p.mode==='scale')txt(ctx,r.s.n+': exponents '+(-r.pH).toFixed(1)+' + '+(r.pH-14).toFixed(1)+' = −14',box.L+box.W-6,box.T+box.H-10,{s:13,c:PAL['muted'],a:'right'});return;}
    const ax=id==='dil'?axes(ctx,box,{xmin:-4,xmax:0,ymin:0,ymax:7,xl:'log₁₀ of acid concentration (M):  −1 means 0.10 M',yl:'pH'}):axes(ctx,box,{xmin:-4,xmax:0,ymin:0,ymax:100,xl:'log₁₀ of acid concentration (M)',yl:'Percent ionized'});
    ctx.save();ctx.beginPath();ctx.rect(box.L,box.T,box.W,box.H);ctx.clip();ctx.lineWidth=2.5;
    const lines=id==='dil'?[[c=>solvePH([],0,c),serColor(0)],[c=>weakPH(sim.p.weak,c),serColor(1)]]:[[()=>100,serColor(0)],[c=>{const h=Math.pow(10,-weakPH(sim.p.weak,c));return 100*r.wa.Ka/(h+r.wa.Ka);},serColor(1)]];
    lines.forEach(([fn,col])=>{ctx.strokeStyle=col;ctx.beginPath();for(let lc=-4;lc<=0.001;lc+=0.05){const y=fn(Math.pow(10,lc));lc<=-4?ctx.moveTo(ax.X(lc),ax.Y(y)):ctx.lineTo(ax.X(lc),ax.Y(y));}ctx.stroke();});
    const lc=Math.log10(r.C),ys=id==='dil'?[r.pHs,r.pHw]:[100,100*r.alpha];[0,1].forEach(i=>{ctx.fillStyle=serColor(i);ctx.beginPath();ctx.arc(ax.X(lc),ax.Y(ys[i]),6.5,0,6.29);ctx.fill();ctx.strokeStyle=PAL['card'];ctx.lineWidth=2;ctx.stroke();});
    ctx.restore();legend(ctx,box.L+12,box.T+12,[{label:'HCl (strong)',color:serColor(0)},{label:r.wa.f+' (weak)',color:serColor(1)}]);
    if(id==='dil'&&box.W>520)txt(ctx,'Strong: slope 1 pH unit per 10×.  Weak: about ½.',box.L+box.W-6,box.T+box.H-10,{s:13,c:PAL['muted'],a:'right'});},
  infoPanel(sim){const p=sim.p,r=calc(p),hon=atLeast('honors'),ap=atLeast('ap');
    if(p.mode==='scale'){const ind=p.ind!=='none'?IND[p.ind]:null;
      const rows=SOL.map(s=>{const L=liquid(p.ind,s.pH,s.col)[1];const on=s.id===p.sol?' style="font-weight:700"':'';
        return `<tr${on}><td>${s.n}</td><td>${s.pH.toFixed(1)}</td>${hon?`<td>${sx(Math.pow(10,-s.pH),2)}</td>`:''}<td>${s.pH<6.95?'acidic':s.pH>7.05?'basic':'neutral'}</td>${ind?`<td>${L}</td>`:''}</tr>`;}).join('');
      return `<h3>Household solutions</h3><div class="tbl-wrap"><table><thead><tr><th>Solution</th><th>pH</th>${hon?'<th>[H₃O⁺] (M)</th>':''}<th>Type</th>${ind?`<th>${ind.n}</th>`:''}</tr></thead><tbody>${rows}</tbody></table></div>`+
        (ind?`<p class="help">${ind.n} changes color across pH ${ind.range}.</p>`:'<p class="help">Choose an indicator to see the color each solution would turn.</p>');}
    const wa=r.wa,C=r.C,x=r.hw;let h=`<h3>Same concentration, different strength</h3><p>HCl gives up every H⁺, so [H₃O⁺] = ${sx(r.hs,2)} M and pH = ${r.pHs.toFixed(2)}. ${wa.name[0].toUpperCase()+wa.name.slice(1)} gives up only ${(100*r.alpha).toPrecision(2)}% of its H⁺, so pH = ${r.pHw.toFixed(2)}.</p>`;
    if(ap){const approx=Math.sqrt(wa.Ka*C),ok=approx/C<0.05;
      h+=`<h3 style="margin-top:10px">ICE table for ${CL.html(p.weak)}</h3><div class="tbl-wrap"><table><thead><tr><th></th><th>${wa.f}</th><th>H₃O⁺</th><th>${wa.an}</th></tr></thead><tbody>
        <tr><td>I</td><td>${C}</td><td>0</td><td>0</td></tr><tr><td>C</td><td>−x</td><td>+x</td><td>+x</td></tr><tr><td>E</td><td>${C} − x</td><td>x</td><td>x</td></tr></tbody></table></div>
        <p>Ka = x² / (${C} − x) = ${sx(wa.Ka,2)} → x = [H₃O⁺] = ${sx(x,3)} M, pH = ${r.pHw.toFixed(2)}.</p>
        <p class="help">Shortcut x ≈ √(Ka·C) = ${sx(approx,3)} M is ${(100*approx/C).toFixed(1)}% of C, so the 5% rule ${ok?'holds and the shortcut is fine':'fails: solve the quadratic'}. Percent ionized = x / C × 100 = ${(100*r.alpha).toPrecision(3)}%.</p>`;}
    else if(hon)h+=`<p class="help">Weak acids reach an equilibrium: ${wa.f} + H₂O ⇌ H₃O⁺ + ${wa.an}. Most molecules stay intact at any moment.</p>`;
    return h;},
  narrate(sim){const p=sim.p,r=calc(p),hon=atLeast('honors');
    if(p.mode==='scale'){const s=r.s,L=liquid(p.ind,s.pH,s.col);let t;
      if(s.id==='water')t='Pure water sits at <b>pH 7.00, neutral</b>: water makes equal amounts of H₃O⁺ and OH⁻, '+sx(1e-7,2)+' M each.';
      else if(s.pH<7){const f=Math.pow(10,7-s.pH);t=s.n+' (pH '+s.pH.toFixed(1)+') is <b>acidic</b>: it has about '+(f>=1000?Math.round(f).toLocaleString('en-US'):f.toPrecision(2))+' times more H₃O⁺ than pure water'+(hon?', from '+s.note+'.':'.');}
      else{const f=Math.pow(10,s.pH-7);t=s.n+' (pH '+s.pH.toFixed(1)+') is <b>basic</b>: it has about '+(f>=1000?Math.round(f).toLocaleString('en-US'):f.toPrecision(2))+' times more OH⁻ than pure water'+(hon?', from '+s.note+'.':'.');}
      if(p.ind!=='none')t+=' '+IND[p.ind].n+' turns it '+L[1]+'.';
      if(s.pH>=11.5||s.pH<=2.0)t+=' In a real lab: goggles and gloves, and never mix bleach with ammonia.';
      return t;}
    const n0=nIon(sim.vis.U?sim.vis.U[1]:[]);
    let t='<b>HCl ionizes completely</b>: every HCl in the zoom became H₃O⁺ and Cl⁻, so pH = '+r.pHs.toFixed(2)+'. '+r.wa.f+' at the same '+cLabel(r.C)+' <b>ionizes only '+(100*r.alpha).toPrecision(2)+'%</b>, so it has far fewer H₃O⁺ and a higher pH, '+r.pHw.toFixed(2)+'.';
    if(hon)t+=' The weak acid is at equilibrium: molecules keep ionizing and re-forming ('+n0+' of 40 are ionized right now).';
    return t;},
  tour:[
    {title:'The pH scale',text:'pH runs from about 0 to 14. Below 7 is acidic, exactly 7 is neutral, and above 7 is basic. The colors on the bar are the colors of universal indicator.',focus:[518,20,280,400],pause:true,setup(sim){BioLab.setValues(sim,{mode:'scale',sol:'lemon',ind:'none'});}},
    {title:'Each step is 10×',text:{bio:'Lemon juice is pH 2 and coffee is pH 5. Three pH steps means 10 × 10 × 10 = 1,000 times more H₃O⁺ in the lemon juice. The bars use a log scale so both fit.',honors:'pH = −log[H₃O⁺]. Lemon juice: [H₃O⁺] = 1 × 10⁻² M. Coffee: 1 × 10⁻⁵ M. The exponents differ by 3, so the concentrations differ by 10³.'},focus:[178,18,340,428],pause:true,setup(sim){BioLab.setValues(sim,{sol:'coffee'});}},
    {title:'Both ions are always there',text:{bio:'Even bleach has a few H₃O⁺ ions, and even lemon juice has a few OH⁻. When one goes up, the other goes down.',honors:'[H₃O⁺][OH⁻] = Kw = 1.0 × 10⁻¹⁴ at 25 °C, so pH + pOH = 14. The two bars always add up to the same total height.'},focus:[178,18,340,428],pause:true,setup(sim){BioLab.setValues(sim,{sol:'bleach'});}},
    {title:'Indicators show pH by color',text:'An indicator is a dye that changes color at a certain pH. Universal indicator is a mix of dyes, so it shows a different color across the whole scale. Dark drinks like cola hide the color, which is why labs also use pH meters.',focus:[4,50,170,384],pause:true,setup(sim){BioLab.setValues(sim,{sol:'vinegar',ind:'uni'});}},
    {title:'A strong acid ionizes completely',text:'Now two beakers at the same concentration, 0.10 M. In HCl, every molecule has given its H⁺ to water: 40 H₃O⁺ (pink) and 40 Cl⁻ (green) in view, and no HCl molecules left.',focus:[[ZC[0][0]-ZR-6,ZC[0][1]-ZR-6,2*ZR+12,2*ZR+12]],speed:0.5,setup(sim){BioLab.setValues(sim,{mode:'compare',conc:0.1,weak:'HC2H3O2',ind:'none'});}},
    {title:'A weak acid mostly stays intact',text:{bio:'In acetic acid, almost every molecule is still whole (an orange ball with its small white H). Only about 1 in 75 gives up its H⁺ at any moment, so the pH is higher: 2.87 instead of 1.00.',honors:'HC₂H₃O₂ + H₂O ⇌ H₃O⁺ + C₂H₃O₂⁻ sits far to the left. Watch: a molecule ionizes, and an ion pair finds each other and re-forms. That is dynamic equilibrium.'},focus:[[ZC[1][0]-ZR-6,ZC[1][1]-ZR-6,2*ZR+12,2*ZR+12]],speed:0.5},
    {title:'Dilute both 10×',text:{bio:'At 0.010 M, HCl goes from pH 1 to pH 2: one step per 10× dilution. The weak acid’s pH rises by only about half a step.',ap:'Strong acid: pH rises 1.00 per 10× dilution. Weak acid: [H₃O⁺] ≈ √(Ka·C), so pH rises about 0.5, and the percent ionized goes up from 1.3% to 4.2%.'},focus:[0,300,800,150],pause:true,setup(sim){BioLab.setValues(sim,{conc:0.01});}},
    {lvl:'ap',title:'Finding Ka',text:'Ka = [H₃O⁺][A⁻]/[HA]. Measure the pH, take [H₃O⁺] = 10⁻ᵖᴴ, and the ICE table gives [A⁻] = [H₃O⁺] and [HA] = C − [H₃O⁺]. The table under the graph does it for the current acid.',focus:[[ZC[1][0]-ZR-6,ZC[1][1]-ZR-6,2*ZR+12,2*ZR+12],[400,300,400,80]],pause:true,setup(sim){BioLab.setValues(sim,{conc:0.1});}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{mode:'scale',sol:'lemon',conc:0.1,weak:'HC2H3O2',ind:'none'});},
  onChallenge(sim,ch,phase){if(ch&&ch.instant&&ch.set&&phase==='done')BioLab.setValues(sim,ch.set);},
  challenges(sim){
    const aW=f=>{const h=Math.pow(10,-weakPH(f,0.1));return WEAK[f].Ka/(h+WEAK[f].Ka);};
    const pa1=weakPH('HC2H3O2',0.1),pa2=weakPH('HC2H3O2',0.01),hf=weakPH('HF',0.1);
    const ion2=(()=>{const h=Math.pow(10,-pa2);return 100*WEAK.HC2H3O2.Ka/(h+WEAK.HC2H3O2.Ka);})();
    return [
    {lvl:'bio',q:'The HCl beaker is 0.10 M. You dilute it 10× to 0.010 M. What happens to its pH?',choices:['It rises by 1, from 1.00 to 2.00','It drops by 1, to 0.00','It jumps to 10','It stays the same, because it is still HCl'],correct:0,
     baseline:{mode:'compare',conc:0.1},change:{conc:0.01},changeText:'Diluted 10× to 0.010 M',watch:'dil',
     explain:{bio:'pH went from 1.00 to 2.00. Diluting 10× leaves one tenth as much H₃O⁺ per liter, and each pH unit is a factor of 10. The solution is less acidic, so the pH number goes up.'}},
    {lvl:'bio',instant:true,set:{mode:'compare',conc:0.1,weak:'HC2H3O2'},q:'Beaker A holds 0.10 M HCl and beaker B holds 0.10 M acetic acid. Which one has the lower pH?',choices:['Neither: same concentration means same pH','HCl','Acetic acid'],correct:1,
     explain:{bio:'The model is now set up this way. HCl reads pH 1.00 and acetic acid reads pH '+pa1.toFixed(2)+'. HCl is a strong acid: every molecule gives its H⁺ to water. Acetic acid is weak: only about '+(100*aW('HC2H3O2')).toFixed(1)+'% of its molecules do. Strength is not the same thing as concentration.'}},
    {lvl:'bio',instant:true,set:{mode:'scale',sol:'lemon'},q:'Lemon juice is pH 2 and black coffee is pH 5. How many times more H₃O⁺ does lemon juice have?',choices:['2.5 times','3 times','1,000 times'],correct:2,
     explain:{bio:'Each pH step is a factor of 10. From pH 5 to pH 2 is three steps: 10 × 10 × 10 = 1,000. Look at the H₃O⁺ bar: 1 × 10⁻² M for lemon juice and 1 × 10⁻⁵ M for coffee.'}},
    {lvl:'honors',instant:true,set:{mode:'scale',sol:'bleach'},q:'Bleach is strongly basic (pH 12.6). Does it contain any H₃O⁺ ions?',choices:['No, bases contain no H₃O⁺','Yes, a few: [H₃O⁺] is about 2.5 × 10⁻¹³ M','Yes, just as much as OH⁻'],correct:1,
     explain:{honors:'Water always self-ionizes, so both ions are present. [H₃O⁺] = 10⁻¹²·⁶ = 2.5 × 10⁻¹³ M and [OH⁻] = Kw/[H₃O⁺] = 4.0 × 10⁻² M. "Basic" means OH⁻ outnumbers H₃O⁺, here by about 160 billion to one.'}},
    {lvl:'honors',instant:true,set:{mode:'scale',sol:'vinegar',ind:'phenol'},q:'You add phenolphthalein to an unknown solution and it stays colorless. What can you conclude?',choices:['The solution is neutral','The solution is acidic','Only that its pH is below about 8.2, so it could be acidic, neutral or even slightly basic'],correct:2,
     explain:{honors:'Phenolphthalein is colorless everywhere below about pH 8.2 and turns pink above it. Vinegar (pH 2.4), pure water (7.0) and blood (7.4) all stay colorless. Switch the solution to see it. To tell them apart you need an indicator that changes lower, like bromothymol blue, or a pH meter.'}},
    {lvl:'honors',q:'Beaker B holds 0.10 M acetic acid. You swap it for 0.10 M HF, a stronger weak acid (Ka = 6.8 × 10⁻⁴). What happens to beaker B’s pH?',choices:['It drops, but stays above HCl’s pH of 1.00','It drops all the way to 1.00, like HCl','It rises'],correct:0,
     baseline:{mode:'compare',conc:0.1,weak:'HC2H3O2'},change:{weak:'HF'},changeText:'Beaker B now holds 0.10 M HF',watch:'dil',
     explain:{honors:'pH fell from '+pa1.toFixed(2)+' to '+hf.toFixed(2)+'. HF has a larger Ka, so more of it ionizes ('+(100*aW('HF')).toFixed(1)+'% instead of '+(100*aW('HC2H3O2')).toFixed(1)+'%). It is still a weak acid: most HF molecules stay intact, so it never reaches the strong acid’s pH.'}},
    {lvl:'ap',q:'Dilute 0.10 M acetic acid 10× to 0.010 M. How much does its pH change?',choices:['It rises by 1.00, just like HCl','It rises by only about 0.5','It does not change, because Ka stays the same'],correct:1,
     baseline:{mode:'compare',conc:0.1,weak:'HC2H3O2'},change:{conc:0.01},changeText:'Both beakers diluted 10×',watch:'dil',
     explain:{ap:'pH went from '+pa1.toFixed(2)+' to '+pa2.toFixed(2)+', a change of '+(pa2-pa1).toFixed(2)+'. Since [H₃O⁺] ≈ √(Ka·C), dividing C by 10 divides [H₃O⁺] by √10 ≈ 3.2. Le Châtelier explains it: dilution shifts HA ⇌ H⁺ + A⁻ toward more particles, so the percent ionized rises from '+(100*aW('HC2H3O2')).toFixed(1)+'% to '+ion2.toFixed(1)+'%.'}},
    {lvl:'ap',instant:true,set:{mode:'compare',conc:0.1,weak:'HF'},q:'Use an ICE table. What percent of 0.10 M HF (Ka = 6.8 × 10⁻⁴) is ionized?',choices:['0.68%','About 7.9%','About 26%','100%'],correct:1,
     explain:{ap:'x²/(0.10 − x) = 6.8 × 10⁻⁴. The shortcut gives x ≈ √(6.8 × 10⁻⁵) = 8.2 × 10⁻³ M, which is 8.2% of 0.10 M, so the 5% rule fails. The quadratic gives x = 7.9 × 10⁻³ M: '+(100*aW('HF')).toFixed(1)+'% ionized and pH '+hf.toFixed(2)+'. The ICE table under the graph shows the same numbers.'}}
  ];},
  lab:{bio:'<p><b>Question:</b> How does diluting an acid change its pH, and does a weak acid behave the same way?</p><ol><li>Choose <b>Strong vs weak acid</b> and start at 1.0 M.</li><li>Record a trial, then press <b>Dilute 10×</b> and record again. Repeat down to 0.00010 M.</li><li>Plot concentration step (x) against the pH of each acid (y) on the Trials graph.</li></ol><p>How much did each pH change per 10× dilution? Which acid is “stronger” at the same concentration, and how can you tell from the zoom?</p>',
       honors:'<p><b>Question:</b> Can indicators tell you the pH of a household solution?</p><ol><li>In <b>pH scale</b> view, test all 13 solutions with litmus, phenolphthalein, bromothymol blue and universal indicator.</li><li>Record the color each one gives (the table under the graph fills in for the indicator you choose).</li><li>For each solution, record pH, pOH, [H₃O⁺] and [OH⁻].</li></ol><p>Which indicator would you use to tell blood from pure water? Which solutions can no single one-color-change indicator tell apart, and why?</p>',
       ap:'<p><b>Question:</b> How do Ka and concentration control the percent ionization of a weak acid?</p><ol><li>For each weak acid, record the pH at 0.10, 0.010 and 0.0010 M.</li><li>Use each pH to calculate Ka with an ICE table, and check it against the readout.</li><li>Plot log C against percent ionized (the Percent ionized graph shows the full curve).</li></ol><p><b>Claim–evidence–reasoning:</b> Explain, with Le Châtelier’s principle and the Ka expression, why percent ionization rises as a weak acid is diluted, and when the 5% rule fails.</p>'},
  terms:[{t:'pH',d:'A measure of acidity: pH = −log[H₃O⁺]. Below 7 is acidic, 7 is neutral, above 7 is basic (at 25 °C).'},{t:'Acid',d:'A substance that gives H⁺ to water, making H₃O⁺ (hydronium).'},{t:'Base',d:'A substance that takes H⁺ or adds OH⁻ (hydroxide) to water.'},{t:'Strong acid',d:'An acid that ionizes completely in water, such as HCl, HBr, HI, HNO₃, H₂SO₄ and HClO₄.'},{t:'Weak acid',d:'An acid that ionizes only partly. Most of its molecules stay intact.'},{t:'Indicator',d:'A dye that changes color over a certain pH range.'},
    {lvl:'honors',t:'Hydronium ion, H₃O⁺',d:'H⁺ bonded to a water molecule. Chemists often write it as H⁺.'},{lvl:'honors',t:'pOH',d:'pOH = −log[OH⁻]. At 25 °C, pH + pOH = 14.'},{lvl:'honors',t:'Kw',d:'The ion-product of water: [H₃O⁺][OH⁻] = 1.0 × 10⁻¹⁴ at 25 °C.'},{lvl:'honors',t:'Conjugate base',d:'What remains after an acid gives up H⁺: Cl⁻ from HCl, C₂H₃O₂⁻ from HC₂H₃O₂.'},
    {lvl:'ap',t:'Ka',d:'The acid ionization constant: Ka = [H₃O⁺][A⁻]/[HA]. Larger Ka means a stronger weak acid. pKa = −log Ka.'},{lvl:'ap',t:'Percent ionization',d:'[A⁻] at equilibrium ÷ initial [HA] × 100. It rises as a weak acid is diluted.'},{lvl:'ap',t:'5% rule',d:'If x is less than 5% of C, you may drop x from C − x in the ICE table.'}],
  about:'<p>pH values for household solutions are typical reference values at 25 °C; real samples vary (lemon juice 2.0–2.6, coffee 4.8–5.2, bleach 11–13). Vinegar’s pH is computed for 5% acetic acid (0.83 M).</p><p>In the strong vs weak view, every pH is solved exactly from the charge balance [H₃O⁺] = [OH⁻] + [A⁻] (or [Cl⁻]), using Kw = 1.0 × 10⁻¹⁴ and Ka values at 25 °C from the ChemLab data table (acetic 1.8 × 10⁻⁵, formic 1.8 × 10⁻⁴, HF 6.8 × 10⁻⁴, HNO₂ 4.5 × 10⁻⁴, HClO 3.0 × 10⁻⁸, HCN 4.9 × 10⁻¹⁰). Concentrations are used in place of activities, which is fine below about 0.1 M and less accurate at 1.0 M.</p><p>Each zoom shows 40 acid particles. The weak acid’s particles ionize and re-form at random so that, on average, the fraction ionized matches the calculated percent. With only 40 particles you will see that number flicker, the same way a real equilibrium fluctuates. Water’s own H₃O⁺ and OH⁻ (10⁻⁷ M) are too few to draw. Indicator colors are approximate. Phenolphthalein slowly fades again above about pH 13, which is not shown.</p>',
  draw(sim,ctx,vdt,k,t){const p=sim.p,r=calc(p),hon=atLeast('honors'),ap=atLeast('ap');
    ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
    if(p.mode==='scale')drawScale(sim,ctx,r,k,hon,ap);else drawCompare(sim,ctx,r,k,t,hon,ap);},
  thumbSetup(sim){sim.p.mode='compare';sim.p.ind='uni';}
};

function drawScale(sim,ctx,r,k,hon,ap){const p=sim.p,s=r.s;
  // beaker with the solution and a pH meter probe
  const bx=20,by=176,bw=132,bh=180,[col,cname]=liquid(p.ind,s.pH,s.col);
  CL.drawBeaker(ctx,{x:bx,y:by,w:bw,h:bh,fill:0.72,liquid:col});
  ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(122,124);ctx.lineTo(122,316);ctx.stroke();
  ctx.fillStyle=PAL['cv-glass'];rr(ctx,116,300,12,40,5);ctx.fill();
  meter(ctx,12,62,150,s.pH.toFixed(2),k,'pH');
  txt(ctx,s.n,bx+bw/2,by+bh+26,{s:15*k,w:700,a:'center'});
  if(p.ind!=='none')txt(ctx,cname,bx+bw/2,by+bh+26+19*k,{s:12*k,c:PAL['cv-soft'],a:'center'});
  // log-scale ladder of [H3O+] and [OH-]
  const T=66,B=350,X0=352,Y=e=>T+(-e)/14*(B-T); // e = exponent 0..-14
  txt(ctx,'Concentration (mol/L), log scale',X0,34,{s:13*k,w:700,a:'center'});
  const step=k>1.3?4:2;ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;
  for(let e=0;e>=-14;e-=1){const y=Y(e);ctx.beginPath();ctx.moveTo(X0-52,y);ctx.lineTo(X0+52,y);ctx.globalAlpha=e%2?0.35:0.8;ctx.stroke();ctx.globalAlpha=1;
    if((-e)%step===0)txt(ctx,'10'+sup(e),X0-60,y,{s:12*k,c:PAL['cv-soft'],a:'right',b:'middle'});}
  const bar=(x,e,c)=>{const y=Y(e);ctx.fillStyle=c;rr(ctx,x,y,32,Math.max(2,B-y),4);ctx.fill();};
  bar(X0-42,-s.pH,'#d22d68');bar(X0+10,s.pH-14,'#2f6fd0');
  txt(ctx,'H₃O⁺',X0-26,B+20,{s:14*k,w:700,a:'center',c:PAL['cv-h']});txt(ctx,'OH⁻',X0+26,B+20,{s:14*k,w:700,a:'center',c:PAL['cv-sub']});
  drawValue(ctx,sx(r.h,2),X0-6,B+22+19*k,'right',k);drawValue(ctx,sx(r.oh,2),X0+6,B+22+19*k,'left',k);
  if(k<1.3){if(ap)txt(ctx,'[H₃O⁺][OH⁻] = 1.0 × 10⁻¹⁴',X0,B+86,{s:12*k,c:PAL['cv-soft'],a:'center'});
    else if(hon)txt(ctx,'pH + pOH = '+s.pH.toFixed(1)+' + '+(14-s.pH).toFixed(1)+' = 14',X0,B+86,{s:12*k,c:PAL['cv-soft'],a:'center'});}
  // vertical pH scale with household solutions
  const SX=562,SW=26,PT=66,PB=400,PY=v=>PT+v/14*(PB-PT);
  const g=ctx.createLinearGradient(0,PY(0),0,PY(14));UNI.forEach(u=>g.addColorStop(u[0]/14,u[1]));ctx.fillStyle=g;rr(ctx,SX,PY(0),SW,PY(14)-PY(0),6);ctx.fill();
  txt(ctx,'pH',SX+SW/2,34,{s:13*k,w:700,a:'center'});
  for(let v=0;v<=14;v+=(k>1.3?2:1))txt(ctx,String(v),SX-8,PY(v),{s:12*k,c:PAL['cv-soft'],a:'right',b:'middle'});
  ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=1.5;ctx.setLineDash([4,3]);ctx.beginPath();ctx.moveTo(SX-2,PY(7));ctx.lineTo(SX+SW+2,PY(7));ctx.stroke();ctx.setLineDash([]);
  const few=k>1.25,LX=SX+SW+30;
  const list=few?[s]:SOL;const slot=(PB-PT)/(SOL.length-1);
  list.forEach(it=>{const yv=PY(it.pH),ly=few?clamp(yv,PT+8,PB-8):PT+SOL.indexOf(it)*slot,on=it.id===s.id;
    ctx.strokeStyle=on?PAL['cv-ink']:PAL['cv-soft'];ctx.lineWidth=on?2:1;ctx.beginPath();ctx.moveTo(SX+SW,yv);ctx.lineTo(SX+SW+10,yv);ctx.lineTo(LX-4,ly);ctx.stroke();
    ctx.fillStyle=on?PAL['cv-ink']:PAL['cv-soft'];ctx.beginPath();ctx.arc(SX+SW,yv,on?4.5:3,0,6.29);ctx.fill();
    txt(ctx,it.n,LX,ly,{s:(few?12:on?13:12)*k,w:on?800:400,c:on?PAL['cv-ink']:PAL['cv-soft'],b:'middle'});});
  if(few){txt(ctx,'acidic',SX+SW+12,PY(0.6),{s:12*k,c:PAL['cv-soft'],b:'middle'});txt(ctx,'basic',SX+SW+12,PY(13.4),{s:12*k,c:PAL['cv-soft'],b:'middle'});}
}
function drawValue(ctx,s,x,y,align,k){ctx.font='700 '+(12*k)+'px '+FONT;const w=ctx.measureText(s).width+12,h=20*k;const x0=align==='right'?x-w:x;rr(ctx,x0,y-h/2,w,h,h/2);ctx.fillStyle=PAL['card'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();txt(ctx,s,x0+w/2,y+1,{s:12*k,w:700,a:'center',b:'middle'});}

function drawCompare(sim,ctx,r,k,t,hon,ap){const p=sim.p,v=sim.vis;if(!v.U)return;
  // legend
  const items=[['#d22d68','H₃O⁺','ion'],[PAL['cv-soft'],'anion (Cl⁻ or A⁻)','an'],[PAL['cv-soft'],'intact acid molecule','mol']];
  ctx.font='400 '+(12*k)+'px '+FONT;let tw=0;items.forEach(it=>tw+=ctx.measureText(it[1]).width+34);let lx=400-tw/2;
  items.forEach(it=>{const y=20;if(it[2]==='ion'){ball(ctx,lx+8,y,6.5,it[0]);sign(ctx,lx+8,y,'+');}else if(it[2]==='an'){ball(ctx,lx+8,y,7,'#8c8c96');sign(ctx,lx+8,y,'−');}else{ball(ctx,lx+14,y-4,4,'#f4f4f4');ball(ctx,lx+7,y,7,'#8c8c96');}
    txt(ctx,it[1],lx+22,y+1,{s:12*k,c:PAL['cv-soft'],b:'middle'});lx+=ctx.measureText(it[1]).width+34;});
  const halves=[{name:'HCl',sub:'strong acid',an:'Cl⁻',col:CL_COL,pH:r.pHs,U:v.U[0],eq:['HCl + H₂O → H₃O⁺ + Cl⁻'],tag:'A'},
                {name:r.wa.f,sub:'weak acid',an:r.wa.an,col:r.wa.col,pH:r.pHw,U:v.U[1],eq:[r.wa.f+' + H₂O','⇌ H₃O⁺ + '+r.wa.an],tag:'B'}];
  halves.forEach((h,i)=>{const x0=i*400,[cx,cy]=ZC[i];
    txt(ctx,'Beaker '+h.tag+': '+h.name+', '+h.sub,x0+200,58,{s:14*k,w:700,a:'center'});
    // small beaker with indicator color
    const [col]=liquid(p.ind,h.pH,null);const B=CL.drawBeaker(ctx,{x:x0+22,y:220,w:84,h:84,fill:0.7,liquid:col,ticks:false});
    ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=1.5;ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(x0+64,B.y+10);ctx.lineTo(cx-ZR*0.9,cy-ZR*0.4);ctx.moveTo(x0+64,B.y+10);ctx.lineTo(cx-ZR*0.6,cy+ZR*0.8);ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle=PAL['cv-glass'];ctx.beginPath();ctx.arc(x0+64,B.y+10,3.5,0,6.29);ctx.fill();
    txt(ctx,cLabel(r.C),x0+64,320,{s:12*k,c:PAL['cv-soft'],a:'center'});
    drawZoom(ctx,cx,cy,h.U,h.col,k,t,v.water);
    const n=nIon(h.U);
    pill(ctx,'pH '+h.pH.toFixed(2),x0+200,338,i?'#2f6fd0':'#c2185b','#fff',16*k);
    txt(ctx,n+' of 40 ionized'+(hon?' ('+(i?(100*r.alpha).toPrecision(2):'100')+'% on average)':''),x0+200,338+26*k,{s:12.5*k,c:PAL['cv-soft'],a:'center'});
    const ey=440-(h.eq.length-1)*17*k;h.eq.forEach((e,j)=>txt(ctx,e,x0+200,ey+j*17*k,{s:13*k,w:700,a:'center'}));});
  ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(400,44);ctx.lineTo(400,446);ctx.stroke();
}
PH.controls[0].onChange=syncMode;
PH.onLevel=syncMode;
BioLab.register(PH);
})();
