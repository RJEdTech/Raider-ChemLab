(function(){
'use strict';
const {clamp,lerp,rr,txt,pill,atLeast,PAL,FONT,RM,axes,legend,serColor}=BioLab.h;
const CL=window.ChemLab;
const LH=500,ASP=800/500;

/* ---------- the eight lab stations ----------
   Each station: word / skeleton / balanced equations, type, evidence (item, progress at which you can see it, what you see),
   ΔH° (kJ per mole of reaction as written, from standard enthalpies of formation), the limiting amount used at the bench (mol of
   reaction at 1×), the liquid volume that absorbs the heat (mL, null for open flames), duration, and the particle-zoom recipe for
   one "unit" of the balanced (net) equation: [formula, charge, count, zone] with zone solid / free / out (a gas that escapes). */
const TYPES={syn:'Synthesis',dec:'Decomposition',sr:'Single replacement',dr:'Double replacement',comb:'Combustion'};
const PATTERN={syn:'A + B → AB: two or more substances combine into one.',dec:'AB → A + B: one substance breaks into two or more.',sr:'A + BC → AC + B: an element replaces another element in a compound.',
  dr:'AB + CD → AD + CB: the cations swap partners.',comb:'Fuel + O₂ → CO₂ + H₂O: a hydrocarbon burns in oxygen, releasing energy.'};
const R={
 mg:{name:'Burning magnesium',type:'syn',word:'magnesium + oxygen → magnesium oxide',skel:'Mg + O2 > MgO',bal:'2Mg(s) + O2(g) > 2MgO(s)',dH:-1203,n:0.002057,vol:null,D:5,redox:true,
   on:'Mg: 0 → +2 (oxidized) · O: 0 → −2 (reduced)',ev:[['light',0.03,'blinding white light'],['temp',0.03,'very hot flame'],['solid',0.3,'white powdery magnesium oxide'],['color',0.3,'shiny gray metal turns to white ash']],
   amt:'0.10 g Mg ribbon',prod:['MgO',2],zoom:{U:3,r:[['Mg',0,2,'solid'],['O2',0,1,'free']],p:[['Mg',2,2,'solid'],['O',-2,2,'solid']]},
   pp:['MgO','MgO₂','Mg + O (no change)'],ppWhy:'Mg²⁺ and O²⁻ combine 1 : 1, so the product is MgO.'},
 h2o2:{name:'Hydrogen peroxide with a MnO₂ catalyst',type:'dec',word:'hydrogen peroxide → water + oxygen',skel:'H2O2 > H2O + O2',bal:'2H2O2(aq) > 2H2O(l) + O2(g)',dH:-196,n:0.00882,vol:20,D:7,redox:true,
   on:'O: −1 → −2 (reduced) and −1 → 0 (oxidized): the same element does both',ev:[['gas',0.04,'fast bubbling; a glowing splint bursts into flame (O₂)'],['temp',0.25,'the flask gets warm']],
   amt:'20 mL of 3% H₂O₂',prod:['O2',1],zoom:{U:3,r:[['H2O2',0,2,'free']],p:[['H2O',0,2,'free'],['O2',0,1,'out']]},cat:true,
   pp:['H₂O + O₂','H₂ + O₂','H₂O + MnO₂'],ppWhy:'H₂O₂ breaks down into water and oxygen gas. MnO₂ is a catalyst: it speeds the reaction but is not used up.'},
 cuco3:{name:'Heating copper(II) carbonate',type:'dec',word:'copper(II) carbonate → copper(II) oxide + carbon dioxide',skel:'CuCO3 > CuO + CO2',bal:'CuCO3(s) > CuO(s) + CO2(g)',dH:46,n:0.00809,vol:null,D:8,redox:false,
   on:'Cu stays +2, C stays +4, O stays −2: not a redox reaction',ev:[['color',0.12,'green powder turns black'],['gas',0.08,'bubbles in the limewater, which turns milky (CO₂)']],
   amt:'1.00 g CuCO₃',prod:['CuO',1],zoom:{U:3,r:[['Cu',2,1,'solid'],['CO3',-2,1,'solid']],p:[['Cu',2,1,'solid'],['O',-2,1,'solid'],['CO2',0,1,'out']]},
   pp:['CuO + CO₂','Cu + CO₃','CuC + O₃'],ppWhy:'Metal carbonates decompose into the metal oxide and carbon dioxide.'},
 alcu:{name:'Aluminum in copper(II) chloride',type:'sr',word:'aluminum + copper(II) chloride → aluminum chloride + copper',skel:'Al + CuCl2 > AlCl3 + Cu',bal:'2Al(s) + 3CuCl2(aq) > 2AlCl3(aq) + 3Cu(s)',dH:-1256,n:0.008333,vol:50,D:8,redox:true,
   on:'Al: 0 → +3 (oxidized) · Cu: +2 → 0 (reduced)',ev:[['color',0.1,'blue fades; red-brown copper forms on the foil'],['solid',0.18,'red-brown copper solid'],['temp',0.12,'the beaker gets hot'],['gas',0.2,'a few bubbles of H₂ (the solution is slightly acidic)']],
   amt:'50 mL of 0.50 M CuCl₂ with 1.0 g Al foil',prod:['Cu',3],zoom:{U:2,r:[['Al',0,2,'solid'],['Cu',2,3,'free'],['Cl',-1,6,'free']],p:[['Al',3,2,'free'],['Cu',0,3,'solid'],['Cl',-1,6,'free']]},
   pp:['AlCl₃ + Cu','AlCl₂ + Cu','Al₃Cl + Cu'],ppWhy:'Aluminum forms Al³⁺, so it needs three Cl⁻: AlCl₃. Copper comes out as the element.'},
 znhcl:{name:'Zinc in hydrochloric acid',type:'sr',word:'zinc + hydrochloric acid → zinc chloride + hydrogen',skel:'Zn + HCl > ZnCl2 + H2',bal:'Zn(s) + 2HCl(aq) > ZnCl2(aq) + H2(g)',dH:-153.9,n:0.010,vol:20,D:7,redox:true,
   on:'Zn: 0 → +2 (oxidized) · H: +1 → 0 (reduced)',ev:[['gas',0.04,'steady bubbling; a burning splint gives a squeaky pop (H₂)'],['temp',0.3,'the test tube warms up']],
   amt:'20 mL of 1.0 M HCl with excess zinc',prod:['H2',1],zoom:{U:3,r:[['Zn',0,1,'solid'],['H',1,2,'free'],['Cl',-1,2,'free']],p:[['Zn',2,1,'free'],['H2',0,1,'out'],['Cl',-1,2,'free']]},
   pp:['ZnCl₂ + H₂','ZnH + Cl₂','ZnCl + H'],ppWhy:'Zinc replaces hydrogen. Zn²⁺ pairs with two Cl⁻, and hydrogen leaves as the diatomic gas H₂.'},
 agcl:{name:'Silver nitrate and sodium chloride',type:'dr',word:'silver nitrate + sodium chloride → silver chloride + sodium nitrate',skel:'AgNO3 + NaCl > AgCl + NaNO3',bal:'AgNO3(aq) + NaCl(aq) > AgCl(s) + NaNO3(aq)',dH:-65.5,n:0.0010,vol:20,D:5,redox:false,
   on:'No oxidation numbers change: not a redox reaction',ev:[['solid',0.12,'a white precipitate (AgCl) clouds the liquid']],
   amt:'10 mL each of 0.10 M AgNO₃ and NaCl',prod:['AgCl',1],zoom:{U:5,r:[['Ag',1,1,'free'],['NO3',-1,1,'free'],['Na',1,1,'free'],['Cl',-1,1,'free']],p:[['Ag',1,1,'solid'],['Cl',-1,1,'solid'],['Na',1,1,'free'],['NO3',-1,1,'free']]},
   pp:['AgCl + NaNO₃','AgNa + ClNO₃','No reaction'],ppWhy:'The cations swap partners. AgCl is insoluble, so it forms the white precipitate; NaNO₃ stays dissolved.'},
 ch4:{name:'Burning methane (Bunsen burner)',type:'comb',word:'methane + oxygen → carbon dioxide + water',skel:'CH4 + O2 > CO2 + H2O',bal:'CH4(g) + 2O2(g) > CO2(g) + 2H2O(g)',dH:-802,n:0.010,vol:null,D:7,redox:true,
   on:'C: −4 → +4 (oxidized) · O: 0 → −2 (reduced)',ev:[['light',0.03,'blue flame'],['temp',0.03,'hot flame'],['color',0.25,'water droplets fog the cold beaker held above']],
   amt:'0.24 L of natural gas',prod:['H2O',2],zoom:{U:3,r:[['CH4',0,1,'free'],['O2',0,2,'free']],p:[['CO2',0,1,'free'],['H2O',0,2,'free']]},
   pp:['CO₂ + H₂O','C + H₂O₂','CO + H₂'],ppWhy:'Complete combustion of any hydrocarbon gives carbon dioxide and water.'},
 neut:{name:'Hydrochloric acid and sodium hydroxide',type:'dr',word:'hydrochloric acid + sodium hydroxide → sodium chloride + water',skel:'HCl + NaOH > NaCl + H2O',bal:'HCl(aq) + NaOH(aq) > NaCl(aq) + H2O(l)',dH:-55.8,n:0.025,vol:50,D:6,redox:false,
   on:'No oxidation numbers change: an acid–base reaction',ev:[['temp',0.1,'the beaker warms by several degrees'],['color',0.92,'pink phenolphthalein turns colorless when the base is used up']],
   amt:'25 mL each of 1.0 M HCl and NaOH',prod:['H2O',1],zoom:{U:5,r:[['H',1,1,'free'],['Cl',-1,1,'free'],['Na',1,1,'free'],['OH',-1,1,'free']],p:[['H2O',0,1,'free'],['Na',1,1,'free'],['Cl',-1,1,'free']]},
   pp:['NaCl + H₂O','NaH + ClOH','NaOCl + H₂'],ppWhy:'An acid plus a hydroxide base makes a salt and water. It is a double replacement: H⁺ and Na⁺ swap partners.'}
};
const ORDER=['mg','h2o2','cuco3','alcu','znhcl','agcl','ch4','neut'];
const EV=[['color','Color'],['gas','Gas'],['solid','Solid'],['temp','Temperature'],['light','Light']];
const T0=22.0;
// equations in pretty text
const fmtEq=(s,html)=>{const f=html?CL.html:CL.fmt;return s.split(' > ').map(side=>side.split(' + ').map(t=>{const m=t.match(/^(\d*)([^(]+)(\(\w+\))?$/);return (m[1]||'')+f(m[2])+(m[3]||'');}).join(' + ')).join(' → ');};
function eqText(key,view,html){const r=R[key];return view==='word'?r.word:view==='skel'?fmtEq(r.skel,html):fmtEq(r.bal,html);}
/* verify every balanced equation by atom counts at load */
ORDER.forEach(key=>{const [L,Rt]=R[key].bal.split(' > ');const cnt=side=>{const c={};side.split(' + ').forEach(t=>{const m=t.replace(/\(\w+\)$/,'').match(/^(\d*)(.+)$/),k=m[1]?+m[1]:1,f=CL.parse(m[2]);for(const e in f)c[e]=(c[e]||0)+k*f[e];});return c;};
  const a=cnt(L),b=cnt(Rt);if(!Object.keys(Object.assign({},a,b)).every(e=>a[e]===b[e]))console.error('rxntypes: '+key+' is not balanced');});

/* ---------- molecule geometry (same convention as the balancing tool) ---------- */
const GEOM={H2:[['H',-0.55,0],['H',0.55,0]],O2:[['O',-0.8,0],['O',0.8,0]],H2O:[['O',0,-0.15],['H',-0.95,0.55],['H',0.95,0.55]],CO2:[['O',-1.6,0],['C',0,0],['O',1.6,0]],
  CH4:[['C',0,0],['H',-1.05,-0.75],['H',1.05,-0.75],['H',-1.05,0.75],['H',1.05,0.75]],H2O2:[['O',-0.8,0],['O',0.8,0],['H',-1.55,0.75],['H',1.55,-0.75]],
  CO3:[['C',0,0],['O',0,-1.55],['O',-1.35,0.8],['O',1.35,0.8]],NO3:[['N',0,0],['O',0,-1.5],['O',-1.3,0.75],['O',1.3,0.75]],OH:[['O',-0.3,0],['H',0.75,0]]};
const RAD=el=>el==='H'?0.62:1;
function geom(f){const g=(GEOM[f]||[[f,0,0]]).map(a=>({el:a[0],x:a[1],y:a[2],r:RAD(a[0])}));let R=0;g.forEach(a=>R=Math.max(R,Math.hypot(a.x,a.y)+a.r));g.R=R;return g;}
const ICOL={Cu2:'#1976d2',Al3:'#9e8f8f',Zn2:'#6c7a89'};
const ZX=636,ZY=236,ZR=134,AR=13;

/* ---------- build the particle zoom for one station ---------- */
function buildZoom(key){const z=R[key].zoom;let seed=key.length*97+key.charCodeAt(0);const rnd=()=>{seed=(seed*9301+49297)%233280;return seed/233280;};
  const sp=Math.max(2*AR+1,...z.r.concat(z.p).filter(s=>s[3]==='solid').map(s=>geom(s[0]).R*AR*1.7));
  const solidRows=(n)=>{const out=[];let row=0;while(out.length<n&&row<8){const y=ZY+ZR-sp*0.5-14-row*sp*0.88,half=Math.sqrt(Math.max(0,ZR*ZR-(y-ZY)*(y-ZY)))-sp*0.5-8,off=(row%2)*sp/2;
      for(let x=ZX-half+off;x<=ZX+half&&out.length<n;x+=sp)out.push({x,y});row++;}return out;};
  const mk=(spec,u,side)=>{const [f,q,n,zone]=spec,arr=[];for(let i=0;i<n;i++){const g=geom(f);arr.push({f,q,zone,u,side,g,atoms:g.map(a=>({el:a.el,dx:a.x*AR,dy:a.y*AR,r:a.r*AR})),ph:rnd()*6.28});}return arr;};
  const rp=[],pp=[];for(let u=0;u<z.U;u++){z.r.forEach(s=>rp.push(...mk(s,u,'r')));z.p.forEach(s=>pp.push(...mk(s,u,'p')));}
  // reactant homes
  const rs=rp.filter(q=>q.zone==='solid'),sitesR=solidRows(rs.length);rs.forEach((q,i)=>{q.x=sitesR[i].x;q.y=sitesR[i].y;});
  const solidTop=rs.length?Math.min(...sitesR.map(s=>s.y))-AR*2.2:ZY+ZR-10;
  const placed=rs.slice();const freeSpot=(R0)=>{for(let t=0;t<80;t++){const a=rnd()*6.283,d=Math.sqrt(rnd())*(ZR-R0-8),x=ZX+Math.cos(a)*d,y=ZY+Math.sin(a)*d;if(y+R0>solidTop)continue;
      if(placed.every(o=>Math.hypot(o.x-x,o.y-y)>(o.g.R*AR+R0+4)))return {x,y};}return {x:ZX+(rnd()-0.5)*ZR,y:ZY-ZR*0.4+(rnd()-0.5)*40};};
  rp.filter(q=>q.zone!=='solid').forEach(q=>{const s=freeSpot(q.g.R*AR);q.x=s.x;q.y=s.y;placed.push(q);});
  // map atoms unit by unit: spectators keep their atoms; the rest match element by element
  for(let u=0;u<z.U;u++){const R1=rp.filter(q=>q.u===u),P1=pp.filter(q=>q.u===u);const usedR=new Set();
    P1.forEach(p=>{const m=R1.find(r=>!usedR.has(r)&&r.f===p.f&&r.q===p.q&&p.zone!=='solid'&&r.zone!=='solid');if(m){usedR.add(m);p.spec=m;p.atoms.forEach((a,i)=>a.src={q:m,i});}});
    const queue={};R1.filter(r=>!usedR.has(r)).forEach(r=>r.atoms.forEach((a,i)=>{(queue[a.el]=queue[a.el]||[]).push({q:r,i});}));
    P1.filter(p=>!p.spec).forEach(p=>p.atoms.forEach(a=>{const s=(queue[a.el]||[]).shift();if(!s)console.error('rxntypes zoom: atoms not conserved in '+key);a.src=s;}));}
  // product homes near their source atoms
  const ps=pp.filter(q=>q.zone==='solid'),sitesP=solidRows(ps.length).sort((a,b)=>a.x-b.x||b.y-a.y);
  pp.forEach(p=>{let cx=0,cy=0;p.atoms.forEach(a=>{cx+=a.src.q.x+a.src.q.atoms[a.src.i].dx;cy+=a.src.q.y+a.src.q.atoms[a.src.i].dy;});p.cx=cx/p.atoms.length;p.cy=cy/p.atoms.length;});
  ps.slice().sort((a,b)=>a.cx-b.cx).forEach((p,i)=>{p.x=sitesP[i].x;p.y=sitesP[i].y;});
  const pTop=ps.length?Math.min(...sitesP.map(s=>s.y))-AR*2.2:solidTop;
  pp.forEach(p=>{if(p.zone==='solid')return;if(p.spec){p.x=p.spec.x;p.y=Math.min(p.spec.y,pTop-p.g.R*AR);return;}
    p.x=clamp(p.cx,ZX-ZR+34,ZX+ZR-34);p.y=Math.min(p.cy,pTop-p.g.R*AR);if(p.y<ZY-ZR+34)p.y=ZY-ZR+34;});
  return {rp,pp,U:z.U,key};}
const sm=x=>{x=clamp(x,0,1);return x*x*(3-2*x);};
function wob(q,tt){if(RM)return [0,0];const A=q.zone==='solid'?0.8:7;return [Math.sin(tt*0.9+q.ph)*A,Math.cos(tt*0.75+q.ph*1.3)*A];}
function ionCol(q,el){if(q.q&&q.atoms.length===1){const c=ICOL[el+q.q];if(c)return c;}return null;}
function drawParticle(ctx,q,x,y,al){ctx.save();ctx.globalAlpha=al===undefined?1:al;const a=q.atoms;a.slice().sort((m,n)=>m.r-n.r).forEach(t=>CL.drawAtom(ctx,x+t.dx,y+t.dy,t.r,t.el,{color:ionCol(q,t.el)||undefined,label:t.r>=8?t.el:''}));
  if(q.q&&q.zone!=='solid'){const R0=q.g.R*AR;txt(ctx,(Math.abs(q.q)>1?Math.abs(q.q):'')+(q.q>0?'+':'−'),x+R0*0.72,y-R0*0.72,{s:11,w:800,c:PAL['cv-ink'],a:'left',b:'middle'});}ctx.restore();}

/* ---------- run state ---------- */
const prog=sim=>{const st=sim.st;if(!st.run)return 0;return clamp((sim.t-st.t0)/R[sim.p.rxn].D,0,1);};
const scale=sim=>atLeast('honors')?sim.p.amt:1;
function dT(sim){const r=R[sim.p.rxn];if(!r.vol)return NaN;return -r.dH*1000*r.n*scale(sim)/(r.vol*CL.K.cWater);}
function seen(sim){const r=R[sim.p.rxn],p=prog(sim);return r.ev.filter(e=>p>=e[1]);}
function runIt(sim){const st=sim.st;st.run=true;st.t0=sim.t;sim.infoDirty=true;}
function resetStation(sim){const st=sim.st;st.run=false;st.t0=0;st.pick=null;st.zoom=buildZoom(sim.p.rxn);sim.infoDirty=true;}

/* ---------- bench drawing ---------- */
const BENCH=414;
function burner(ctx,x,on,t,big){ctx.fillStyle='#4a4f57';rr(ctx,x-26,BENCH-10,52,10,3);ctx.fill();ctx.fillStyle='#6b717a';ctx.fillRect(x-7,BENCH-74,14,64);ctx.fillStyle='#565b63';ctx.fillRect(x-10,BENCH-34,20,9);
  if(!on)return;const fl=RM?1:1+Math.sin(t*23)*0.05+Math.sin(t*37)*0.04,h=(big||62)*fl;
  ctx.fillStyle='rgba(90,140,255,.55)';ctx.beginPath();ctx.moveTo(x-9,BENCH-74);ctx.quadraticCurveTo(x-13,BENCH-74-h*0.55,x,BENCH-74-h);ctx.quadraticCurveTo(x+13,BENCH-74-h*0.55,x+9,BENCH-74);ctx.closePath();ctx.fill();
  ctx.fillStyle='rgba(140,200,255,.9)';ctx.beginPath();ctx.moveTo(x-5,BENCH-74);ctx.quadraticCurveTo(x-6,BENCH-74-h*0.3,x,BENCH-74-h*0.45);ctx.quadraticCurveTo(x+6,BENCH-74-h*0.3,x+5,BENCH-74);ctx.closePath();ctx.fill();}
function thermo(ctx,x,y,h,T,k){ctx.fillStyle=PAL['card'];rr(ctx,x-5,y,10,h,5);ctx.fill();ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=1.5;ctx.stroke();const f=clamp(T/100,0,1);ctx.fillStyle='#d32f2f';ctx.fillRect(x-2,y+h-6-(h-12)*f,4,(h-12)*f+6);
  ctx.beginPath();ctx.arc(x,y+h,7,0,6.29);ctx.fill();}
function bubbles(ctx,x0,x1,yTop,yBot,n,t,speed){ctx.strokeStyle=PAL['cv-bstroke'];ctx.lineWidth=1.3;for(let i=0;i<n;i++){const ph=((t*speed+i*0.618)%1),x=x0+((i*0.381)%1)*(x1-x0)+(RM?0:Math.sin(t*3+i)*3),y=lerp(yBot,yTop,ph);ctx.beginPath();ctx.arc(x,y,2+ph*2.2,0,6.29);ctx.stroke();}}
function tube(ctx,x,y,w,h,ang,liq,fill,inner){ctx.save();ctx.translate(x,y);ctx.rotate(ang);if(fill>0){ctx.save();ctx.beginPath();ctx.rect(-w/2,h*(1-fill),w,h);ctx.clip();ctx.fillStyle=liq;rr(ctx,-w/2,0,w,h,w/2);ctx.fill();if(inner)inner();ctx.restore();}
  ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(-w/2,0);ctx.lineTo(-w/2,h-w/2);ctx.arc(0,h-w/2,w/2,Math.PI,0,true);ctx.lineTo(w/2,0);ctx.stroke();ctx.restore();}
function mixHex(a,b,t){const p=h=>{h=h.replace('#','');if(h.length===3)h=h.split('').map(c=>c+c).join('');return [0,2,4].map(i=>parseInt(h.slice(i,i+2),16));};if(!/^#[0-9a-f]{3,6}$/i.test(a)||!/^#[0-9a-f]{3,6}$/i.test(b))return t>0.5?b:a;
  const A=p(a),B=p(b);return '#'+A.map((v,i)=>Math.round(lerp(v,B[i],clamp(t,0,1))).toString(16).padStart(2,'0')).join('');}
function flask(ctx,x,y,w,h,liq,fill){const neck=w*0.26;ctx.save();ctx.beginPath();ctx.moveTo(x-neck/2,y);ctx.lineTo(x-neck/2,y+h*0.32);ctx.lineTo(x-w/2,y+h);ctx.lineTo(x+w/2,y+h);ctx.lineTo(x+neck/2,y+h*0.32);ctx.lineTo(x+neck/2,y);
  ctx.save();ctx.clip();ctx.fillStyle=liq;ctx.fillRect(x-w/2,y+h*(1-fill),w,h*fill);ctx.restore();ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=2.5;ctx.stroke();ctx.restore();}
function drawBench(ctx,sim,k,t){const key=sim.p.rxn,p=prog(sim),run=sim.st.run,water=PAL['cv-water'];const live=run&&p<1;
  ctx.fillStyle=PAL['cv-bench'];ctx.fillRect(0,BENCH,480,10);
  const Tnow=T0+(Number.isFinite(dT(sim))?dT(sim)*p:0);
  if(key==='mg'){burner(ctx,90,run&&p<0.08,t);const L=110,x0=150+L*p;ctx.strokeStyle='#8a8f98';ctx.lineWidth=4;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(380,236);ctx.lineTo(268,282);ctx.stroke();
    if(p<1){ctx.strokeStyle='#c9ccd1';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(x0,290);ctx.lineTo(262,284);ctx.stroke();}
    ctx.fillStyle='#d7d2c8';rr(ctx,130,BENCH-14,170,14,4);ctx.fill();const ash=clamp(p*1.1,0,1);if(ash>0){ctx.fillStyle='#f6f6f4';ctx.beginPath();ctx.ellipse(205,BENCH-14,62*ash,10*ash,0,Math.PI,0);ctx.fill();ctx.strokeStyle='rgba(0,0,0,.2)';ctx.stroke();}
    if(live&&p>0.02){const gr=70+(RM?0:Math.sin(t*31)*8),g=ctx.createRadialGradient(x0,290,2,x0,290,gr);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(0.3,'rgba(255,255,240,.85)');g.addColorStop(1,'rgba(255,255,230,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x0,290,gr,0,6.29);ctx.fill();
      pill(ctx,'Very bright: do not stare at it',240,120,'#5d5d63','#fff',12*k);}
    txt(ctx,'tongs',388,232,{s:12*k,c:PAL['cv-soft']});txt(ctx,'ceramic pad',215,BENCH+20,{s:12*k,c:PAL['cv-soft'],a:'center'});}
  else if(key==='h2o2'){flask(ctx,200,214,150,200,water,0.42);const ly=214+200*0.58;
    if(run){ctx.fillStyle='#2b2b2b';for(let i=0;i<14;i++){ctx.beginPath();ctx.arc(150+((i*37)%100),BENCH-6-((i*13)%8),2.4,0,6.29);ctx.fill();}
      const rate=Math.max(0,1-p*0.9);bubbles(ctx,140,260,ly+6,BENCH-8,Math.round(26*rate),t,1.1);if(p<0.9){ctx.fillStyle='rgba(255,255,255,.65)';ctx.beginPath();ctx.ellipse(200,ly+2,64*rate,7,0,0,6.29);ctx.fill();}}
    ctx.strokeStyle='#b5874f';ctx.lineWidth=5;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(330,120);ctx.lineTo(214,198);ctx.stroke();
    const lit=run&&p>0.12;if(lit){const fh=18+(RM?0:Math.sin(t*20)*3);ctx.fillStyle='rgba(255,170,40,.9)';ctx.beginPath();ctx.ellipse(212,192-fh/2,7,fh/2,-0.6,0,6.29);ctx.fill();}else{ctx.fillStyle='#ff6d00';ctx.beginPath();ctx.arc(214,198,4.5,0,6.29);ctx.fill();}
    txt(ctx,lit?'splint bursts into flame: O₂':'glowing splint',338,116,{s:12*k,w:lit?700:400,c:lit?PAL['s4']:PAL['cv-soft']});if(run)txt(ctx,'black MnO₂ (catalyst)',200,BENCH+0-24,{s:12*k,c:PAL['cv-soft'],a:'center'});}
  else if(key==='cuco3'){burner(ctx,150,run&&p<1,t,48);ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(40,BENCH);ctx.lineTo(40,150);ctx.lineTo(236,212);ctx.stroke();
    const pg=clamp(p*1.15,0,1),pc=mixHex('#3f9b6b','#232323',pg);tube(ctx,252,212,30,116,1.107,pc,0.3);
    ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(252,212);ctx.lineTo(262,168);ctx.lineTo(370,168);ctx.lineTo(370,350);ctx.stroke();
    const milk=clamp((p-0.08)*1.4,0,0.85);tube(ctx,370,258,36,140,0,mixHex(water,'#efefea',milk),0.75);if(run&&p>0.05&&p<0.97)bubbles(ctx,360,380,300,390,8,t,0.9);
    txt(ctx,'limewater',370,250,{s:12*k,c:PAL['cv-soft'],a:'center'});txt(ctx,pg>0.5?'black CuO':'green CuCO₃',120,238,{s:12*k,w:700,c:PAL['cv-soft'],a:'center'});}
  else if(key==='alcu'){const blue='#3f8fd6',liq=mixHex(mixHex(water,blue,0.85),water,clamp(p*1.1,0,1)*0.85);const L=CL.drawBeaker(ctx,{x:90,y:214,w:200,h:200,fill:0.72,liquid:liq});
    ctx.fillStyle='#b9bec6';ctx.beginPath();ctx.moveTo(150,BENCH-8);ctx.lineTo(165,BENCH-40);ctx.lineTo(195,BENCH-48);ctx.lineTo(228,BENCH-30);ctx.lineTo(232,BENCH-8);ctx.closePath();ctx.fill();
    if(run){ctx.globalAlpha=clamp(p*1.4,0,1);ctx.fillStyle='#8a3b12';ctx.fill();for(let i=0;i<Math.round(16*p);i++){ctx.beginPath();ctx.arc(155+((i*29)%75),BENCH-10-((i*17)%34),3,0,6.29);ctx.fill();}ctx.globalAlpha=1;if(p<0.95)bubbles(ctx,160,225,L.y+6,BENCH-44,6,t,0.7);}
    thermo(ctx,262,170,200,Tnow,k);txt(ctx,Tnow.toFixed(1)+' °C',262,160,{s:13*k,w:700,a:'center'});txt(ctx,'aluminum foil',190,BENCH+20,{s:12*k,c:PAL['cv-soft'],a:'center'});}
  else if(key==='znhcl'){ctx.fillStyle=PAL['cv-soft'];ctx.fillRect(110,330,180,8);tube(ctx,200,190,40,220,0,water,0.62,null);ctx.fillStyle='#8b939e';for(let i=0;i<6;i++){ctx.beginPath();ctx.arc(190+(i%3)*9,398-Math.floor(i/3)*8,5,0,6.29);ctx.fill();}
    if(run&&p<0.97)bubbles(ctx,188,212,276,398,Math.round(14*(1-p*0.6)),t,1.0);
    ctx.strokeStyle='#b5874f';ctx.lineWidth=5;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(320,112);ctx.lineTo(214,178);ctx.stroke();const pop=run&&p>0.22&&p<0.36;
    if(!pop){const fh=16+(RM?0:Math.sin(t*20)*3);ctx.fillStyle='rgba(255,170,40,.9)';ctx.beginPath();ctx.ellipse(212,172-fh/2,6,fh/2,-0.6,0,6.29);ctx.fill();}
    else{pill(ctx,'POP!',212,150,'#c62828','#fff',16*k);}txt(ctx,'burning splint',328,108,{s:12*k,c:PAL['cv-soft']});txt(ctx,Tnow.toFixed(1)+' °C',250,262,{s:13*k,w:700});}
  else if(key==='agcl'){const pour=run?clamp(p/0.15,0,1):0;const L=CL.drawBeaker(ctx,{x:90,y:230,w:190,h:184,fill:0.35+0.3*pour,liquid:water});
    const cl=run?clamp((p-0.1)*2,0,1):0,settle=run?clamp((p-0.5)*2,0,1):0;if(cl>0){ctx.save();ctx.beginPath();ctx.rect(L.x,L.y,L.w,L.h);ctx.clip();ctx.globalAlpha=0.7*cl*(1-0.6*settle);ctx.fillStyle='#f4f4f2';ctx.fillRect(L.x,L.y,L.w,L.h);ctx.globalAlpha=1;
      ctx.fillStyle='#f4f4f2';ctx.fillRect(L.x,L.y+L.h-22*settle,L.w,22*settle);ctx.strokeStyle='rgba(0,0,0,.35)';ctx.lineWidth=1;ctx.strokeRect(L.x,L.y+L.h-22*settle,L.w,22*settle);
      ctx.fillStyle='#ffffff';for(let i=0;i<40;i++){ctx.beginPath();ctx.arc(L.x+8+((i*41)%(L.w-16)),lerp(L.y+((i*67)%L.h),L.y+L.h-8,settle),1.8,0,6.29);ctx.fill();ctx.strokeStyle='rgba(0,0,0,.3)';ctx.lineWidth=0.6;ctx.stroke();}ctx.restore();}
    const tp=run?Math.sin(Math.PI*pour):0;tube(ctx,lerp(340,262,tp),lerp(220,120,tp),30,120,lerp(0,-2.1,tp),water,run?1-pour:0.7);
    txt(ctx,'NaCl(aq)',185,BENCH+20,{s:12*k,c:PAL['cv-soft'],a:'center'});txt(ctx,'AgNO₃(aq)',355,196,{s:12*k,c:PAL['cv-soft'],a:'center'});}
  else if(key==='ch4'){burner(ctx,200,run&&p<1,t,70);ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(380,BENCH);ctx.lineTo(380,120);ctx.lineTo(300,120);ctx.stroke();
    ctx.save();ctx.translate(200,170);ctx.scale(1,-1);CL.drawBeaker(ctx,{x:-70,y:-70,w:140,h:120,fill:0,liquid:water,ticks:false});ctx.restore();
    const fog=clamp((p-0.15)*1.5,0,1);if(fog>0){ctx.fillStyle=PAL['cv-bstroke'];ctx.globalAlpha=0.8*fog;for(let i=0;i<34;i++){ctx.beginPath();ctx.arc(136+((i*37)%128),132+((i*23)%100),1.6+(i%3)*0.7,0,6.29);ctx.fill();}ctx.globalAlpha=1;}
    txt(ctx,'cold, dry beaker',300,108,{s:12*k,c:PAL['cv-soft'],a:'center'});txt(ctx,'gas valve',60,BENCH+0-8,{s:12*k,c:PAL['cv-soft']});ctx.strokeStyle='#e0a030';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(60,BENCH-20);ctx.quadraticCurveTo(120,BENCH-10,180,BENCH-30);ctx.stroke();}
  else if(key==='neut'){const pink='#e255a8',f=run?clamp((p-0.86)/0.1,0,1):0,liq=mixHex(mixHex(water,pink,0.75),water,f);CL.drawBeaker(ctx,{x:90,y:230,w:190,h:184,fill:0.4+0.32*(run?p:0),liquid:liq});
    ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=2.5;ctx.strokeRect(175,100,20,110);ctx.fillStyle=water;ctx.fillRect(177,102+100*(run?p:0)*0.6,16,106-100*(run?p:0)*0.6);ctx.fillStyle=PAL['cv-soft'];ctx.fillRect(170,210,30,6);
    if(run&&p<0.99&&!RM){const dy=((t*2.2)%1)*80;ctx.fillStyle=PAL['cv-bstroke'];ctx.beginPath();ctx.arc(185,222+dy,3,0,6.29);ctx.fill();}
    thermo(ctx,256,190,190,Tnow,k);txt(ctx,Tnow.toFixed(1)+' °C',256,180,{s:13*k,w:700,a:'center'});txt(ctx,'HCl in a buret',205,118,{s:12*k,c:PAL['cv-soft']});}}

/* ---------- definition ---------- */
const RXT={
  id:'rxntypes',hash:'rxntypes',apUnit:7,order:2,tab:'Types of reactions',kind:'Virtual lab',prereq:['balance'],next:['activity','precip'],
  card:'Run eight bench reactions, check off the evidence, zoom in on the atoms rearranging, and classify each one.',
  title:'Types of chemical reactions',
  lede:{bio:'Run each reaction at the bench, look for evidence of a chemical change, and decide which of the five types it is.',
        honors:'Predict the products before you run each reaction, and translate between the word equation, the skeleton equation and the balanced equation with states.',
        ap:'Measure the heat released and the temperature change from ΔH°, find the limiting amount, and identify which reactions are redox using oxidation numbers.'},
  scale:'Bench scale: test tubes and beakers of 10–50 mL. The zoom is a few nanometers across and shows a few formula units of the balanced equation. Water molecules in solutions are not drawn.',
  aspect:ASP,timeless:true,animated:true,chChange:0.8,chReveal:6,
  controls:[
    {id:'rxn',label:'Lab station',type:'select',def:'alcu',lvl:'bio',options:ORDER.map((k,i)=>({v:k,l:(i+1)+'. '+R[k].name})),onChange:resetStation},
    {id:'view',label:'Write the equation as',type:'seg',def:'word',lvl:'bio',noTrial:true,options:[{v:'word',l:'Words'},{v:'skel',l:'Skeleton'},{v:'bal',l:'Balanced'}]},
    {id:'guess',label:'Your classification',type:'select',def:'none',lvl:'bio',options:[{v:'none',l:'Choose a type…'}].concat(Object.keys(TYPES).map(k=>({v:k,l:TYPES[k]}))),help:'Decide from the pattern of the equation, then check your answer in the panel below the stage.'},
    {id:'amt',label:'Amount of reactant',type:'range',min:0.5,max:2,step:0.25,def:1,unit:'×',lvl:'honors',onChange:resetStation,help:'For solutions this changes the concentration (same volume).'}
  ],
  actions:[{id:'run',label:'Start the reaction',lvl:'bio',primary:true,run(sim){runIt(sim);}},{id:'again',label:'Reset this station',lvl:'bio',run(sim){resetStation(sim);}}],
  init(sim){return {run:false,t0:0,pick:null,zoom:buildZoom(sim.p.rxn)};},
  step(sim,dt){const st=sim.st;if(st.run){const p=prog(sim);const n=seen(sim).length;if(n!==st.nSeen){st.nSeen=n;sim.infoDirty=true;}if(p>=1&&!st.doneFlag){st.doneFlag=true;sim.infoDirty=true;}if(p<1)st.doneFlag=false;}},
  metrics:[
    {id:'type',label:'Reaction type',unit:'',lvl:'bio',text:true,get:s=>{const g=s.p.guess,r=R[s.p.rxn];if(g==='none'&&prog(s)<1)return 'Make your call';return TYPES[r.type]+(g!=='none'?(g===r.type?' ✓ (you got it)':' (you said '+TYPES[g].toLowerCase()+')'):'');}},
    {id:'evid',label:'Evidence seen',unit:'',lvl:'bio',text:true,get:s=>{const e=seen(s);return e.length?e.map(x=>EV.find(v=>v[0]===x[0])[1]).join(', '):s.st.run?'Watching…':'Not started';}},
    {id:'T',label:'Temperature',unit:'°C',lvl:'bio',min:0,max:100,d:1,get:s=>{const d=dT(s);return Number.isFinite(d)?T0+d*prog(s):NaN;}},
    {id:'dT',label:'Temperature change',unit:'°C',lvl:'honors',min:-10,max:80,d:1,get:s=>{const d=dT(s);return Number.isFinite(d)?d*prog(s):NaN;}},
    {id:'dH',label:'ΔH° of the reaction as written',unit:'kJ',lvl:'ap',min:-1300,max:100,d:0,get:s=>R[s.p.rxn].dH},
    {id:'q',label:'Heat released so far',unit:'kJ',lvl:'ap',min:0,max:null,d:2,get:s=>-R[s.p.rxn].dH*R[s.p.rxn].n*scale(s)*prog(s)},
    {id:'prod',label:'Product made',unit:'',lvl:'ap',text:true,get:s=>{const r=R[s.p.rxn],[f,c]=r.prod,mol=r.n*scale(s)*c*prog(s);return (mol*CL.molarMass(f)).toFixed(3)+' g '+CL.fmt(f)+' ('+(mol*1000).toFixed(2)+' mmol)';}}
  ],
  graphs:[{id:'temp',label:'Temperature change by station',lvl:'bio',custom:true},{id:'heat',label:'ΔH° by station',lvl:'ap',custom:true}],defaultGraph:'temp',
  plot(sim,ctx,box,id){if(id==='temp'){const ks=ORDER.filter(k=>R[k].vol),vals=ks.map(k=>-R[k].dH*1000*R[k].n/(R[k].vol*CL.K.cWater));const ax=axes(ctx,box,{xmin:0,xmax:ks.length,ymin:0,ymax:60,xcats:ks.map(k=>({h2o2:'H₂O₂',alcu:'Al + CuCl₂',znhcl:'Zn + HCl',agcl:'AgNO₃ + NaCl',neut:'HCl + NaOH'})[k]),yl:'ΔT (°C)'});
      vals.forEach((v,i)=>{const x0=ax.X(i+0.22),x1=ax.X(i+0.78);ctx.fillStyle=ks[i]===sim.p.rxn?serColor(1):serColor(0);ctx.fillRect(x0,ax.Y(v),x1-x0,ax.Y(0)-ax.Y(v));txt(ctx,'+'+v.toFixed(1),(x0+x1)/2,ax.Y(v)-5,{s:12,w:700,c:PAL.fg,a:'center'});});}
    else{const vals=ORDER.map(k=>R[k].dH);const ax=axes(ctx,box,{xmin:0,xmax:ORDER.length,ymin:-1300,ymax:200,xcats:ORDER.map((k,i)=>String(i+1)),yl:'ΔH° (kJ)'});
      vals.forEach((v,i)=>{const x0=ax.X(i+0.22),x1=ax.X(i+0.78);ctx.fillStyle=v<0?serColor(1):serColor(0);ctx.fillRect(x0,Math.min(ax.Y(v),ax.Y(0)),x1-x0,Math.abs(ax.Y(v)-ax.Y(0)));txt(ctx,v.toFixed(0),(x0+x1)/2,v<0?ax.Y(v)+14:ax.Y(v)-5,{s:11,c:PAL.fg,a:'center'});});
      txt(ctx,'Station number · negative = exothermic',box.L+box.W/2,box.T+12,{s:12,c:PAL.muted,a:'center'});}},
  infoPanel(sim){const key=sim.p.rxn,r=R[key],st=sim.st,p=prog(sim),hon=atLeast('honors'),ap=atLeast('ap'),g=sim.p.guess;
    let h=`<h3>${r.name}</h3><p><b>Words:</b> ${r.word}</p><p><b>Skeleton:</b> ${fmtEq(r.skel,true)}</p><p><b>Balanced:</b> ${fmtEq(r.bal,true)}</p>`;
    if(hon){h+='<p style="margin-top:6px"><b>Predict the products</b> of '+r.word.split(' → ')[0]+':</p><div class="row" style="gap:6px;flex-wrap:wrap">'+r.pp.map((c,i)=>`<button type="button" class="btn${st.pick===i?' primary':''}" data-pp="${i}">${c}</button>`).join('')+'</div>';
      if(st.pick!==null)h+=`<p class="help">${st.pick===0?'<b>Right.</b> ':'<b>Not quite.</b> '}${r.ppWhy}</p>`;}
    h+='<p style="margin-top:6px"><b>Evidence checklist</b></p><ul class="help" style="padding-left:18px">'+EV.map(([id,l])=>{const e=r.ev.find(x=>x[0]===id),s=e&&p>=e[1];return `<li>${s?'✓':'☐'} ${l}${s?': '+e[2]:''}</li>`;}).join('')+'</ul>';
    if(g!=='none'||p>=1)h+=`<p><b>Type:</b> ${TYPES[r.type]}${g!=='none'?(g===r.type?' ✓ your classification is right.':' (you chose '+TYPES[g].toLowerCase()+')'):''} <span class="help">${PATTERN[r.type]}</span></p>`;
    if(key==='neut')h+='<p class="help">An acid–base neutralization is a special double replacement: H⁺ and Na⁺ swap partners, making a salt and water.</p>';
    if(hon)h+=`<p class="help">At the bench: ${r.amt}${scale(sim)!==1?' × '+scale(sim):''}. ΔH° = ${r.dH>0?'+':''}${r.dH} kJ for the reaction as written (${r.dH<0?'exothermic: heat is released':'endothermic: the burner keeps supplying heat'}).</p>`;
    if(ap)h+=`<p class="help"><b>Redox?</b> ${r.redox?'Yes.':'No.'} ${r.on}.${r.vol?' ΔT = q / (m·c) with '+r.vol+' g of solution and c = 4.184 J/g·°C.':''}</p>`;
    return h;},
  bindInfo(sim,el){el.querySelectorAll('[data-pp]').forEach(b=>b.addEventListener('click',()=>{sim.st.pick=+b.dataset.pp;sim.infoDirty=true;}));},
  narrate(sim){const key=sim.p.rxn,r=R[key],st=sim.st,p=prog(sim),e=seen(sim),g=sim.p.guess,hon=atLeast('honors');
    if(!st.run)return 'Station '+(ORDER.indexOf(key)+1)+': <b>'+r.name.charAt(0).toLowerCase()+r.name.slice(1)+'</b>. Read the equation, predict what you will see, then press Start the reaction.';
    if(p<1){const last=e[e.length-1];return last?'<b>Evidence:</b> '+last[2]+'. '+(r.vol&&hon?'The temperature is '+(T0+dT(sim)*p).toFixed(1)+' °C and rising.':'Keep watching the zoom: atoms are trading partners.'):'The reaction is starting. Watch the bench and the zoom.';}
    let s='<b>Done.</b> You saw '+e.map(x=>x[2]).join('; ')+'. ';
    if(g==='none')s+='Now classify it: does the equation fit A + B → AB, AB → A + B, A + BC → AC + B, AB + CD → AD + CB, or fuel + O₂?';
    else if(g===r.type)s+='Your classification, '+TYPES[g].toLowerCase()+', is right: '+PATTERN[r.type];
    else s+='It is not '+TYPES[g].toLowerCase()+'. Look at the pattern again: '+PATTERN[r.type];
    return s;},
  tour:[
    {title:'Pick a station',text:'Station 4 is the RJ aluminum and copper(II) chloride lab: a ball of aluminum foil in blue CuCl₂ solution.',focus:[8,64,470,360],pause:true,setup(sim){BioLab.setValues(sim,{rxn:'alcu',view:'word',guess:'none'});resetStation(sim);}},
    {title:'Run it and watch',text:'The blue color fades, red-brown copper builds up on the foil, and the thermometer climbs. Each of those is evidence of a chemical change.',focus:[8,64,470,360],speed:1,setup(sim){runIt(sim);}},
    {title:'The evidence checklist',text:'A color change, a gas, a new solid, a temperature change or light all suggest new substances formed. Here three appear: color, solid and temperature.',focus:[8,450,784,46],speed:1},
    {title:'Zoom in on the atoms',text:'Aluminum atoms leave the foil as Al³⁺ ions. Cu²⁺ ions become copper atoms on the surface. The Cl⁻ ions never change. Every atom is still there, just rearranged.',focus:[ZX-ZR-6,ZY-ZR-6,2*ZR+12,2*ZR+12],speed:1},
    {title:'Three ways to write it',text:'Words: aluminum + copper(II) chloride → aluminum chloride + copper. Skeleton: Al + CuCl₂ → AlCl₃ + Cu. Balanced, with states: 2Al(s) + 3CuCl₂(aq) → 2AlCl₃(aq) + 3Cu(s).',focus:[8,6,784,52],pause:true,setup(sim){BioLab.setValues(sim,{view:'bal'});}},
    {title:'Classify it',text:'An element (Al) replaces another element (Cu) in a compound: A + BC → AC + B. That is single replacement.',focus:[8,6,784,52],pause:true,setup(sim){BioLab.setValues(sim,{guess:'sr'});}},
    {lvl:'honors',title:'How hot does it get?',text:'The reaction releases about 1256 kJ per 2 mol Al. With 0.025 mol Cu²⁺ in 50 mL of solution, that is about 10.5 kJ, enough to warm the beaker by roughly 50 °C if no heat escapes.',focus:[230,140,90,260],pause:true},
    {lvl:'ap',title:'Is it redox?',text:'Al goes from 0 to +3 (oxidized) and Cu from +2 to 0 (reduced), so this single replacement is a redox reaction. Every single replacement and combustion is redox; the double replacements here are not.',focus:[ZX-ZR-6,ZY-ZR-6,2*ZR+12,2*ZR+12],pause:true}
  ],
  onTourExit(sim){BioLab.setValues(sim,{rxn:'alcu',view:'word',guess:'none'});resetStation(sim);},
  onChallenge(sim,ch,phase){if(ch&&ch.instant&&ch.set&&phase==='done'){BioLab.setValues(sim,ch.set);resetStation(sim);runIt(sim);sim.st.t0=sim.t-60;}},
  challenges:[
    {lvl:'bio',q:'Aluminum foil goes into blue copper(II) chloride solution. What happens to the blue color?',choices:['It gets darker as the aluminum dissolves','It fades as copper metal forms on the foil','It stays the same because aluminum does not react'],correct:1,
     baseline:{rxn:'alcu'},changeAction:'run',changeText:'Foil added to CuCl₂',watch:'temp',
     explain:{bio:'The blue color comes from Cu²⁺ ions. Aluminum turns them into red-brown copper metal, so the blue fades. The beaker also gets hot. That is a single replacement.'}},
    {lvl:'bio',instant:true,set:{rxn:'h2o2'},q:'2H₂O₂ → 2H₂O + O₂ is which type of reaction?',choices:['Synthesis','Decomposition','Single replacement','Combustion'],correct:1,
     explain:{bio:'One reactant breaks apart into two products: AB → A + B. The MnO₂ is a catalyst. It is not in the equation because it is not used up. The model now shows the finished reaction.'}},
    {lvl:'bio',q:'Zinc is dropped into hydrochloric acid and bubbles form. How can you test the gas?',choices:['A burning splint makes a squeaky pop: hydrogen','A glowing splint bursts into flame: oxygen','Limewater turns milky: carbon dioxide'],correct:0,
     baseline:{rxn:'znhcl'},changeAction:'run',changeText:'Zinc added to HCl',watch:'temp',
     explain:{bio:'Zinc replaces hydrogen in HCl, so the gas is H₂. Hydrogen burns with a squeaky pop. A glowing splint is the test for O₂, and limewater is the test for CO₂.'}},
    {lvl:'bio',instant:true,q:'Which of these is NOT evidence of a chemical reaction?',choices:['Bubbles of a new gas forming','A solid appearing when two clear solutions mix','Ice melting into water','An unexpected temperature change'],correct:2,
     explain:{bio:'Melting is a physical change: water is still H₂O. Gas, a precipitate, a color change, light and a temperature change all suggest new substances, so check them off in each station.'}},
    {lvl:'honors',instant:true,set:{rxn:'alcu'},q:'Al + CuCl₂ → ? Predict the products.',choices:['AlCl₃ + Cu','AlCl₂ + Cu','Al₃Cl + Cu'],correct:0,
     explain:{honors:'Aluminum always forms Al³⁺, so its chloride is AlCl₃. Copper comes out as the free element. Balanced: 2Al + 3CuCl₂ → 2AlCl₃ + 3Cu. The model now shows the finished reaction.'}},
    {lvl:'honors',q:'25 mL of 1.0 M HCl is mixed with 25 mL of 1.0 M NaOH. What does the thermometer do?',choices:['Rises about 7 °C','Falls about 7 °C','Stays the same, because no solid or gas forms'],correct:0,
     baseline:{rxn:'neut',amt:1},changeAction:'run',changeText:'Acid added to base',watch:'temp',
     explain:{honors:'Neutralization releases 55.8 kJ per mole of water made. 0.025 mol × 55.8 kJ = 1.40 kJ, which warms 50 g of solution by about 6.7 °C. A temperature change is evidence even when you see nothing else.'}},
    {lvl:'honors',q:'Green copper(II) carbonate is heated strongly. What do you observe?',choices:['It turns black and gives off CO₂ that turns limewater milky','It melts into a green liquid','It turns black because it combines with oxygen from the flame'],correct:0,
     baseline:{rxn:'cuco3'},changeAction:'run',changeText:'Burner lit',watch:'temp',
     explain:{honors:'CuCO₃ → CuO + CO₂ is a decomposition: one reactant, two products. The black solid is copper(II) oxide, and the CO₂ is detected by limewater.'}},
    {lvl:'ap',instant:true,q:'Which of the eight stations are redox reactions?',choices:['Only the two single replacements','All except AgNO₃ + NaCl, HCl + NaOH and the CuCO₃ decomposition','All eight','None, because no electricity is involved'],correct:1,
     explain:{ap:'Burning Mg, H₂O₂ (O goes from −1 to 0 and −2), both single replacements and methane combustion all change oxidation numbers. The precipitation, the neutralization and CuCO₃ → CuO + CO₂ do not.'}},
    {lvl:'ap',q:'You double the concentration of both the HCl and the NaOH (2.0 M, still 25 mL each). The temperature rise will be about…',choices:['the same, 6.7 °C','13 °C, twice as much','27 °C, four times as much'],correct:1,
     baseline:{rxn:'neut',amt:2},changeAction:'run',changeText:'Acid added to base (2.0 M each)',watch:'temp',
     explain:{ap:'Twice the moles react (0.050 mol) and release twice the heat (2.79 kJ), but the mass of solution is the same 50 g, so ΔT doubles to about 13.3 °C. If you doubled the volumes instead, ΔT would not change.'}},
    {lvl:'ap',instant:true,set:{rxn:'cuco3'},q:'CuCO₃(s) → CuO(s) + CO₂(g) has ΔH° ≈ +46 kJ. What does that mean in the lab?',choices:['The burner must keep supplying heat: it is endothermic','It gives off heat once it starts','It needs a catalyst to go'],correct:0,
     explain:{ap:'A positive ΔH means the products have more enthalpy than the reactants. Heat must keep flowing in, so the decomposition stops when you turn off the burner. The large positive ΔS from making a gas is why heating helps.'}}
  ],
  lab:{bio:'<p><b>Question:</b> How can you tell a chemical reaction happened, and what type it is?</p><ol><li>Run each of the eight stations. Record a trial at the end of each one.</li><li>For each, list the evidence you saw.</li><li>Choose a classification before you check it.</li></ol><p>Which kind of evidence showed up most often? Which reactions gave off a gas?</p>',
       honors:'<p><b>Question:</b> Can you predict products from the reaction type?</p><ol><li>For each station, predict the products using the buttons in the panel before you run it.</li><li>Write the skeleton equation, then balance it. Check with the Balanced view.</li><li>For the solution stations, record the temperature change at 1× and 2× amounts.</li></ol><p>Explain how the reaction type helped you predict the products.</p>',
       ap:'<p><b>Question:</b> Which reactions are redox, and how much heat does each release?</p><ol><li>Assign oxidation numbers in every station and decide which are redox.</li><li>For the solution stations, compare the measured ΔT with q = n(−ΔH°) and q = mcΔT.</li><li>Change the amount and record ΔT and heat released.</li></ol><p><b>Claim–evidence–reasoning:</b> Explain why doubling concentration doubles ΔT but doubling both volumes does not.</p>'},
  terms:[{t:'Synthesis',d:'A + B → AB. Two or more substances combine.'},{t:'Decomposition',d:'AB → A + B. One substance breaks down.'},{t:'Single replacement',d:'A + BC → AC + B. An element replaces another in a compound.'},{t:'Double replacement',d:'AB + CD → AD + CB. Ions swap partners, often making a precipitate, water or a gas.'},
    {t:'Combustion',d:'A fuel reacts with O₂, releasing energy. Hydrocarbons make CO₂ and H₂O.'},{t:'Evidence of a chemical change',d:'Color change, gas, a new solid, a temperature change, or light.'},
    {lvl:'honors',t:'Word, skeleton and balanced equations',d:'The same reaction in words, in formulas, and with coefficients and states (s), (l), (g), (aq).'},{lvl:'honors',t:'Catalyst',d:'A substance that speeds up a reaction without being used up, such as MnO₂ with H₂O₂.'},{lvl:'honors',t:'Exothermic / endothermic',d:'Releases heat (ΔH < 0) or absorbs heat (ΔH > 0).'},
    {lvl:'ap',t:'Redox reaction',d:'A reaction in which oxidation numbers change: one species is oxidized and another reduced.'},{lvl:'ap',t:'q = mcΔT',d:'Heat absorbed by the solution: mass × specific heat × temperature change.'}],
  about:'<p>Each station uses real chemistry: balanced equations (checked by atom counts when the page loads), standard enthalpies of reaction from enthalpies of formation, and typical school-lab amounts. Temperature changes come from ΔT = n(−ΔH°)/(m·c), assuming no heat escapes and the solution has the density and specific heat of water, so they are upper limits; a real beaker reads somewhat lower.</p><p>Simplifications: rates are shown at a fixed speed for each station. The aluminum station ignores the oxide layer on the foil and the small amount of H₂ from the acidic solution. Methane is shown making water vapor (ΔH° = −802 kJ). The zoom shows a few formula units of the balanced (net) equation; its atoms are matched one-to-one between reactants and products, so nothing appears or vanishes. Spectator ions are drawn but water molecules are not.</p><p>Safety: wear goggles. Never look straight at burning magnesium. HCl and NaOH are corrosive; silver nitrate stains skin. Point test tubes away from people when heating.</p>',
  initVis(sim){},
  thumbSetup(sim){sim.p.rxn='alcu';sim.st.zoom=buildZoom('alcu');sim.st.run=true;sim.st.t0=-3.5;},
  draw(sim,ctx,vdt,k,t){const st=sim.st,key=sim.p.rxn,r=R[key],p=prog(sim);if(!st.zoom||st.zoom.key!==key)st.zoom=buildZoom(key);
    ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,LH);
    // equation band
    const eq=eqText(key,sim.p.view,false);let fs=16*k;ctx.font='700 '+fs+'px '+FONT;const w=ctx.measureText(eq).width;if(w>770)fs*=770/w;
    ctx.fillStyle=PAL['card'];rr(ctx,8,8,784,48,10);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();txt(ctx,eq,400,33,{s:fs,w:700,a:'center',b:'middle'});
    // bench
    drawBench(ctx,sim,k,t);
    txt(ctx,'Station '+(ORDER.indexOf(key)+1)+(k<1.3?': '+r.name:''),16,80,{s:13*k,w:700,c:PAL['cv-soft']});
    // zoom
    const z=st.zoom,tt=sim.t,el=st.run?sim.t-st.t0:-1,D=r.D;
    ctx.save();ctx.beginPath();ctx.arc(ZX,ZY,ZR,0,6.29);ctx.fillStyle=PAL['cv-sol'];ctx.fill();ctx.clip();
    if(r.cat){ctx.fillStyle='#3b3b3b';for(let i=0;i<9;i++){const x=ZX-ZR*0.62+i*ZR*0.155,y=ZY+ZR-16-(i%2)*6;ctx.beginPath();ctx.arc(x,y,9,0,6.29);ctx.fill();}txt(ctx,'MnO₂ surface (catalyst)',ZX,ZY+ZR-34,{s:12,w:700,a:'center',c:PAL['cv-soft']});}
    const uT=u=>0.6+u*(D*0.85-0.6)/Math.max(1,z.U-1)*(z.U>1?1:0);
    for(let u=0;u<z.U;u++){const tu=uT(u),f=el<0?-1:(el-tu)/0.9;
      if(f<0){z.rp.filter(q=>q.u===u).forEach(q=>{const [dx,dy]=wob(q,tt);drawParticle(ctx,q,q.x+dx,q.y+dy);});}
      else if(f<1){const g=sm(f);z.pp.filter(q=>q.u===u).forEach(q=>{const [px,py]=wob(q,tt);q.atoms.forEach(a=>{const s=a.src.q,sa=s.atoms[a.src.i],[sx,sy]=wob(s,tt);
          const x=lerp(s.x+sx+sa.dx,q.x+px+a.dx,g),y=lerp(s.y+sy+sa.dy,q.y+py+a.dy,g);CL.drawAtom(ctx,x,y,a.r,a.el,{color:(f<0.5?ionCol(s,a.el):ionCol(q,a.el))||undefined,label:a.r>=8?a.el:''});});});}
      else z.pp.filter(q=>q.u===u).forEach(q=>{let [dx,dy]=wob(q,tt);let y=q.y+dy;if(q.zone==='out'){y-=(el-tu-0.9)*38;if(y<ZY-ZR-30)return;}drawParticle(ctx,q,q.x+dx,y);});}
    ctx.restore();ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=3;ctx.beginPath();ctx.arc(ZX,ZY,ZR,0,6.29);ctx.stroke();
    txt(ctx,'Zoom: atoms rearranging',ZX,ZY-ZR-12,{s:13*k,w:700,a:'center'});
    txt(ctx,st.run?(p<1?'Reacting…':'Same atoms, new partners'):'Before the reaction',ZX,ZY+ZR+20*k,{s:12*k,w:700,a:'center',c:PAL['cv-soft']});
    // evidence chips
    const ev=seen(sim);ctx.font='700 '+12*k+'px '+FONT;const items=EV.map(([id,l])=>({l:(ev.some(e=>e[0]===id)?'✓ ':'')+l,on:ev.some(e=>e[0]===id)}));const ws=items.map(it=>ctx.measureText(it.l).width+16*k),gap=8;
    const tot=ws.reduce((a,b)=>a+b,0)+gap*(ws.length-1);let x=Math.max(8,400-tot/2);const cy=LH-24*Math.min(k,1.4);
    items.forEach((it,i)=>{pill(ctx,it.l,x+ws[i]/2,cy,it.on?'#1b7339':PAL['card2'],it.on?'#fff':PAL['cv-soft'],12*k);x+=ws[i]+gap;});
  }
};
BioLab.register(RXT);
})();
