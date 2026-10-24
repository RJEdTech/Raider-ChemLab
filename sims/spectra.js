(function(){
'use strict';
const {clamp,lerp,rr,txt,pill,atLeast,PAL,FONT,RM,axes,legend,serColor,lvText}=BioLab.h;
const CL=window.ChemLab,KC=CL.K;
const H=KC.h,C=KC.c,NA=KC.NA,RH=2.17869e-18;   // hcR for hydrogen (R_H = 1.09678 × 10⁷ m⁻¹), quoted as 2.178 × 10⁻¹⁸ J
const sci=(v,u,s)=>CL.sci(v,u,s||3);

/* ---------- hydrogen model ---------- */
const dE=(u,l)=>RH*(1/(l*l)-1/(u*u));                 // J
const lamNm=(u,l)=>H*C/dE(u,l)*1e9;                    // nm
// Average transition probabilities A(u→l) in s⁻¹ (NIST/Wiese, summed over sublevels). Used only as branching ratios.
const A={'2-1':4.699e8,'3-1':5.575e7,'3-2':4.410e7,'4-1':1.278e7,'4-2':8.419e6,'4-3':8.986e6,'5-1':4.125e6,'5-2':2.530e6,'5-3':2.201e6,'5-4':2.699e6,
  '6-1':1.644e6,'6-2':9.732e5,'6-3':7.783e5,'6-4':7.711e5,'6-5':1.010e6};
function dropFrom(u){let tot=0;for(let l=1;l<u;l++)tot+=A[u+'-'+l];let r=Math.random()*tot;for(let l=1;l<u;l++){r-=A[u+'-'+l];if(r<=0)return l;}return 1;}
const SERIES=l=>l===1?'Lyman (ultraviolet)':l===2?'Balmer (visible)':l===3?'Paschen (infrared)':l===4?'Brackett (infrared)':'Pfund (infrared)';
function colorName(nm){return nm<380?'ultraviolet':nm>750?'infrared':nm<450?'violet':nm<485?'blue':nm<500?'blue-green':nm<565?'green':nm<590?'yellow':nm<625?'orange':'red';}
function nmRGB(nm){let r=0,g=0,b=0;
  if(nm<440){r=(440-nm)/60;b=1;}else if(nm<490){g=(nm-440)/50;b=1;}else if(nm<510){g=1;b=(510-nm)/20;}else if(nm<580){r=(nm-510)/70;g=1;}else if(nm<645){r=1;g=(645-nm)/65;}else r=1;
  const f=nm<400?0.75+0.25*(nm-380)/20:nm>720?1-0.35*(nm-720)/30:1;const hx=v=>Math.round(255*Math.pow(clamp(v*f,0,1),0.8)).toString(16).padStart(2,'0');return '#'+hx(r)+hx(g)+hx(b);}
const lineCol=nm=>nm<380?'#b9a6ff':nm>750?'#ff9a76':nmRGB(nm);
const hexRGB=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];

/* ---------- flame tests ----------
   Strongest visible emission (nm, relative intensity). Li, Na, K lines are atomic lines; Ca, Sr, Ba and Cu flames are
   dominated by molecular bands (CaOH, SrOH, BaO/BaOH, CuCl), shown here as their band heads. */
const SALTS={
  li:{n:'Lithium chloride',f:'LiCl',m:'Li',flame:'crimson red',col:'#e0193f',lines:[[670.8,1],[610.4,0.25],[460.3,0.12]]},
  na:{n:'Sodium chloride',f:'NaCl',m:'Na',flame:'bright yellow-orange',col:'#ffb000',lines:[[589.0,1],[589.6,0.6]]},
  k:{n:'Potassium chloride',f:'KCl',m:'K',flame:'lilac (pale violet)',col:'#c39bd3',lines:[[766.5,1],[769.9,0.7],[404.4,0.35]]},
  ca:{n:'Calcium chloride',f:'CaCl2',m:'Ca',flame:'orange-red',col:'#ff5a1f',lines:[[622,1],[554,0.55],[422.7,0.45]]},
  sr:{n:'Strontium chloride',f:'SrCl2',m:'Sr',flame:'deep red',col:'#ff1f2a',lines:[[681,0.85],[662,0.9],[640,0.6],[606,0.55],[460.7,0.35]]},
  ba:{n:'Barium chloride',f:'BaCl2',m:'Ba',flame:'pale yellow-green',col:'#a8d43a',lines:[[553.5,1],[534.7,0.5],[524,0.6],[513.7,0.6],[455.4,0.3]]},
  cu:{n:'Copper(II) chloride',f:'CuCl2',m:'Cu',flame:'blue-green',col:'#22b8a5',lines:[[521.8,1],[515.3,0.6],[510.5,0.8],[488,0.4],[452,0.5],[435,0.6]]}};
const SK=Object.keys(SALTS);
const saltOf=sim=>sim.p.salt==='unk'?SALTS[sim.st.secret]:SALTS[sim.p.salt];
const brightest=s=>s.lines.reduce((a,b)=>b[1]>a[1]?b:a);

/* ---------- layout ---------- */
const AX=160,AY=190,rn=n=>14+22*(n-1);                // Bohr atom (not to scale)
const LX0=360,LX1=560,yN=n=>n===Infinity?78:60+270/Math.pow(n,0.8);   // energy diagram (spaced for readability)
const TX=630,TY=56,TW=160,TH=250;                      // discharge tube panel
const SX0=40,SX1=770,SY=370,SH=32;                     // spectroscope strip
const RX0=360;const sx0=sim=>sim.p.mode==='flame'?RX0:SX0;
function sxOf(sim,nm){const x0=sx0(sim);if(sim.p.mode==='hydrogen'&&sim.p.range==='wide'){const a=Math.log10(90),b=Math.log10(2000);return x0+(Math.log10(nm)-a)/(b-a)*(SX1-x0);}return x0+(nm-380)/(780-380)*(SX1-x0);}
const inStrip=(sim,nm)=>sim.p.mode==='hydrogen'&&sim.p.range==='wide'?nm>=90&&nm<=2000:nm>=380&&nm<=780;

function sync(sim){const d=sim.def;if(!sim.ui||!sim.ui.sec)return;
  d.controls.forEach(c=>{const cid=d.id+'-'+c.id,e=document.getElementById(cid)||document.getElementById(cid+'-l');if(!e)return;const w=e.closest('.ctl');if(w)w.hidden=!atLeast(c.lvl)||(c.show?!c.show(sim):false);});
  d.metrics.forEach(m=>{const t=sim.ui.tiles[m.id];if(!t)return;const w=t.num.closest('.tile');if(w)w.hidden=!!m.hideTile||!atLeast(m.lvl)||(m.show?!m.show(sim):false);});
  const btns=[...sim.ui.sec.querySelectorAll('.actions button')];d.actions.forEach((a,i)=>{const b=btns[i];if(b)b.hidden=!atLeast(a.lvl)||(a.show?!a.show(sim):false);});}
const isH=s=>s.p.mode==='hydrogen',isF=s=>s.p.mode==='flame';
function clearSpec(sim){const st=sim.st;if(!st)return;st.cnt={};st.acc=0;st.a=freshAtom(sim);st.ph=[];st.last=null;}
function freshAtom(sim){const base=sim.p.spec==='absorption'?2:1;return {n:base,from:base,to:base,phase:'rest',t:0.2,top:base};}
function onMode(sim){clearSpec(sim);if(sim.st){sim.st.fin=0;}sync(sim);}
function newUnknown(sim){const st=sim.st;let s;do{s=SK[Math.floor(Math.random()*SK.length)];}while(s===st.secret&&SK.length>1);st.secret=s;st.revealed=false;st.fin=0;}

/* ---------- one atom, animated ---------- */
const T_REST=0.7,T_UP=0.5,T_HOLD=0.4,T_DOWN=0.45;
function atomStep(sim,dt){const p=sim.p,st=sim.st,a=st.a;a.t-=dt;
  const base=p.spec==='absorption'?2:1;
  if(a.phase==='rest'&&a.t<=0){let top;if(p.spec==='absorption'){if(p.nhi<3){a.t=T_REST;return;}top=3+Math.floor(Math.random()*(p.nhi-2));}else top=p.nhi;
    a.phase='up';a.from=a.n;a.to=top;a.t=T_UP;a.top=top;
    if(p.spec==='absorption')st.ph.push({x:AX-170,y:AY,dx:1,dy:0,nm:lamNm(top,2),t:0,inc:true});else st.zap=0.5;}
  else if(a.phase==='up'&&a.t<=0){a.n=a.to;a.phase='hold';a.t=T_HOLD;}
  else if(a.phase==='hold'&&a.t<=0){if(a.n<=base){a.phase='rest';a.t=T_REST;return;}
    const l=p.spec==='absorption'?2:dropFrom(a.n);a.phase='down';a.from=a.n;a.to=l;a.t=T_DOWN;st.last={u:a.n,l};
    const ang=p.spec==='absorption'?Math.random()*6.283:1.25+Math.random()*0.7;st.ph.push({x:AX,y:AY,dx:Math.cos(ang),dy:Math.sin(ang),nm:lamNm(a.n,l),t:0});}
  else if(a.phase==='down'&&a.t<=0){a.n=a.to;a.phase='hold';a.t=a.n<=base?0.15:T_HOLD;}}
function atomR(sim){const a=sim.st.a;if(a.phase==='up'){const f=1-a.t/T_UP;return lerp(rn(a.from),rn(a.to),f*f*(3-2*f));}if(a.phase==='down'){const f=1-a.t/T_DOWN;return lerp(rn(a.from),rn(a.to),f*f*(3-2*f));}return rn(a.n);}
function atomLevelY(sim){const a=sim.st.a;const f=a.phase==='up'?1-a.t/T_UP:a.phase==='down'?1-a.t/T_DOWN:1;const from=a.phase==='up'||a.phase==='down'?a.from:a.n,to=a.phase==='up'||a.phase==='down'?a.to:a.n;const e=f*f*(3-2*f);return lerp(yN(from),yN(to),e);}

/* ---------- many atoms: the spectrum ---------- */
function tubeStep(sim,dt){const p=sim.p,st=sim.st;st.acc+=dt*110;let guard=0;
  while(st.acc>=1&&guard++<400){st.acc-=1;
    if(p.spec==='absorption'){if(p.nhi<3)continue;const u=3+Math.floor(Math.random()*(p.nhi-2));st.cnt[u+'-2']=(st.cnt[u+'-2']||0)+1;}
    else{let u=2+Math.floor(Math.random()*(p.nhi-1));while(u>1){const l=dropFrom(u);st.cnt[u+'-'+l]=(st.cnt[u+'-'+l]||0)+1;u=l;}}}}
function linesNow(sim){const st=sim.st,out=[];let mx=0;for(const k in st.cnt){const [u,l]=k.split('-').map(Number);const c=st.cnt[k];out.push({u,l,nm:lamNm(u,l),c});}
  out.forEach(o=>{if(inStrip(sim,o.nm))mx=Math.max(mx,o.c);});out.forEach(o=>o.b=mx?Math.sqrt(o.c/mx):0);return out;}
const visLines=sim=>linesNow(sim).filter(o=>o.nm>=380&&o.nm<=750&&o.c>0);

/* numbers for explanations */
const X={l42:lamNm(4,2),l32:lamNm(3,2),E42:dE(4,2),E32:dE(3,2),l52:lamNm(5,2),E52:dE(5,2),l31:lamNm(3,1),ion:RH*NA/1000};

const SIM={
  id:'spectra',hash:'spectra',apUnit:3,order:2,tab:'Emission spectra and flame tests',kind:'Virtual lab',
  prereq:['light'],next:['econfig','spectroscopy'],
  card:'Excite a hydrogen atom and catch its light in a spectroscope, then run flame tests to identify an unknown metal salt.',
  title:'Emission spectra and flame tests',
  lede:{bio:'Give an atom energy and its electron jumps to a higher level. When it falls back, it gives off light of one exact color. Each element makes its own pattern of colors, like a barcode.',
        honors:'Connect each bright line to one electron drop between energy levels, calculate the photon energy, and compare emission with absorption spectra.',
        ap:'Use ΔE = 2.178 × 10⁻¹⁸ J (1/n₁² − 1/n₂²) to predict every hydrogen line, from the ultraviolet Lyman series to the infrared Paschen series.'},
  scale:{bio:'One hydrogen atom is about 0.1 nm across. The drawing follows one atom; the spectroscope collects light from billions of atoms in the tube.',
         honors:'Orbits and level spacing are drawn for readability, not to scale. Real Bohr orbits grow as n², and real energy gaps shrink as 1/n².'},
  timeless:true,animated:true,chChange:1.2,chReveal:4.2,
  controls:[
    {id:'mode',label:'Experiment',type:'seg',def:'hydrogen',lvl:'bio',options:[{v:'hydrogen',l:'Hydrogen atom'},{v:'flame',l:'Flame tests'}],onChange:onMode},
    {id:'nhi',label:'Excite electrons up to level',type:'range',min:2,max:6,step:1,def:3,lvl:'bio',show:isH,help:'More energy from the power supply lets electrons reach higher levels.'},
    {id:'spec',label:'Spectrum type',type:'seg',def:'emission',lvl:'honors',show:isH,options:[{v:'emission',l:'Emission (glowing gas)'},{v:'absorption',l:'Absorption (white light through gas)'}],onChange:onMode},
    {id:'range',label:'Spectroscope range',type:'seg',def:'vis',lvl:'ap',show:isH,options:[{v:'vis',l:'Visible only'},{v:'wide',l:'UV to infrared'}]},
    {id:'salt',label:'Salt on the wire loop',type:'select',def:'li',lvl:'bio',show:isF,options:SK.map(k=>({v:k,l:SALTS[k].n+' ('+CL.fmt(SALTS[k].f)+')'})).concat([{v:'unk',l:'Unknown sample'}]),onChange:s=>{s.st.fin=0;}}
  ],
  actions:[
    {id:'clear',label:'Clear the spectrum',lvl:'bio',show:isH,run(sim){clearSpec(sim);}},
    {id:'unk',label:'New unknown sample',lvl:'bio',primary:true,show:isF,run(sim){newUnknown(sim);BioLab.setValues(sim,{salt:'unk'});}},
    {id:'reveal',label:'Reveal the unknown',lvl:'bio',show:isF,run(sim){sim.st.revealed=true;}}
  ],
  init(sim){const st={cnt:{},acc:0,ph:[],last:null,zap:0,fin:0,secret:'k',revealed:false};st.a={n:1,from:1,to:1,phase:'rest',t:0.2,top:1};newUnknown({st});return st;},
  step(sim,dt){const p=sim.p,st=sim.st;
    if(p.mode==='hydrogen'){atomStep(sim,dt);tubeStep(sim,dt);st.zap=Math.max(0,st.zap-dt);
      st.ph.forEach(o=>{o.t+=dt;o.x+=o.dx*dt*230;o.y+=o.dy*dt*230;});
      st.ph=st.ph.filter(o=>{if(o.inc&&o.x>=AX-atomR(sim)-4)return false;return o.t<2&&o.x>-20&&o.x<330&&o.y>-20&&o.y<318;});}
    else st.fin=Math.min(1,st.fin+dt/0.7);},
  metrics:[
    {id:'last',label:'Last electron drop (one atom)',lvl:'bio',text:true,show:isH,noTrial:true,get:s=>{const L=s.st.last;if(!L)return 'waiting for the first drop';const nm=lamNm(L.u,L.l);return 'n = '+L.u+' → n = '+L.l+': '+Math.round(nm)+' nm ('+colorName(nm)+')';}},
    {id:'nvis',label:'Visible lines in the spectrum',lvl:'bio',show:isH,min:0,max:4,d:0,get:s=>visLines(s).length},
    {id:'ser',label:'Series of the last drop',lvl:'honors',text:true,show:isH,noTrial:true,get:s=>s.st.last?SERIES(s.st.last.l):'none yet'},
    {id:'elast',label:'Energy of that photon, ΔE',lvl:'honors',text:true,show:isH,noTrial:true,get:s=>{const L=s.st.last;return L?sci(dE(L.u,L.l),'J'):'none yet';}},
    {id:'ekj',label:'Per mole of photons',lvl:'ap',text:true,show:isH,noTrial:true,get:s=>{const L=s.st.last;return L?sci(dE(L.u,L.l)*NA/1000,'kJ/mol'):'none yet';}},
    {id:'fsalt',label:'Sample',lvl:'bio',text:true,show:isF,get:s=>s.p.salt==='unk'?(s.st.revealed?'Unknown = '+SALTS[s.st.secret].n:'Unknown sample'):SALTS[s.p.salt].n+', '+CL.fmt(SALTS[s.p.salt].f)},
    {id:'fcol',label:'Flame color',lvl:'bio',text:true,show:isF,get:s=>saltOf(s).flame},
    {id:'fline',label:'Brightest line',lvl:'bio',text:true,show:isF,get:s=>{const b=brightest(saltOf(s));return Math.round(b[0])+' nm ('+colorName(b[0])+')';}},
    {id:'fE',label:'Energy of one photon at that line',lvl:'honors',text:true,show:isF,get:s=>sci(H*C/(brightest(saltOf(s))[0]*1e-9),'J')},
    {id:'fkj',label:'Energy gap per mole',lvl:'ap',text:true,show:isF,get:s=>sci(H*C/(brightest(saltOf(s))[0]*1e-9)*NA/1000,'kJ/mol')},
    {id:'lnm',label:'Last line λ',unit:'nm',lvl:'bio',hideTile:true,d:1,min:0,max:null,get:s=>s.p.mode==='flame'?brightest(saltOf(s))[0]:(s.st.last?lamNm(s.st.last.u,s.st.last.l):0)},
    {id:'nup',label:'Upper level',lvl:'honors',hideTile:true,d:0,min:0,max:6,get:s=>s.p.mode==='hydrogen'&&s.st.last?s.st.last.u:0},
    {id:'nlo',label:'Lower level',lvl:'honors',hideTile:true,d:0,min:0,max:6,get:s=>s.p.mode==='hydrogen'&&s.st.last?s.st.last.l:0},
    {id:'e19',label:'ΔE',unit:'× 10⁻¹⁹ J',lvl:'honors',hideTile:true,d:3,min:0,max:null,get:s=>s.p.mode==='flame'?H*C/(brightest(saltOf(s))[0]*1e-9)/1e-19:(s.st.last?dE(s.st.last.u,s.st.last.l)/1e-19:0)}
  ],
  graphs:[{id:'lev',label:'Energy levels of hydrogen (to scale)',lvl:'bio',custom:true},{id:'ryd',label:'1/λ vs 1/n₂² for the Balmer series',lvl:'ap',custom:true}],
  defaultGraph:'lev',
  plot(sim,ctx,box,id){if(id==='lev'){const ax=axes(ctx,box,{xmin:0,xmax:1,ymin:-22,ymax:1,xticks:false,yl:'Energy (× 10⁻¹⁹ J)',yd:0});
      for(let n=1;n<=6;n++){const y=ax.Y(-RH/(n*n)/1e-19);ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(box.L+40,y);ctx.lineTo(box.L+box.W*0.55,y);ctx.stroke();if(n<=3)txt(ctx,'n = '+n+'   '+(-RH/(n*n)/1e-19).toFixed(2),box.L+box.W*0.55+8,y,{s:13,b:'middle',c:PAL['muted']});}
      txt(ctx,'n = 4, 5, 6 … crowd toward 0',box.L+box.W*0.55+8,ax.Y(-0.9),{s:13,b:'middle',c:PAL['muted']});
      const L=sim.st.last;if(L&&sim.p.mode==='hydrogen'){const x=box.L+box.W*0.3,y1=ax.Y(-RH/(L.u*L.u)/1e-19),y2=ax.Y(-RH/(L.l*L.l)/1e-19);ctx.strokeStyle=lineCol(lamNm(L.u,L.l));ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(x,y1);ctx.lineTo(x,y2-8);ctx.stroke();
        ctx.fillStyle=ctx.strokeStyle;ctx.beginPath();ctx.moveTo(x-8,y2-10);ctx.lineTo(x+8,y2-10);ctx.lineTo(x,y2);ctx.closePath();ctx.fill();txt(ctx,'last drop: ΔE = '+(dE(L.u,L.l)/1e-19).toFixed(2)+' × 10⁻¹⁹ J',x+14,(y1+y2)/2,{s:13,b:'middle',w:700,c:PAL['fg']});}
      return;}
    const ax=axes(ctx,box,{xmin:0,xmax:0.15,ymin:0,ymax:3,xl:'1/n₂² (upper level)',yl:'1/λ (× 10⁶ m⁻¹)',xd:2});
    const pts=[3,4,5,6].map(u=>({x:1/(u*u),y:1/(lamNm(u,2)*1e-9)/1e6,u}));
    ctx.strokeStyle=PAL['muted'];ctx.setLineDash([5,4]);ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(ax.X(0),ax.Y(RH/(H*C)/4/1e6));ctx.lineTo(ax.X(0.15),ax.Y(RH/(H*C)*(0.25-0.15)/1e6));ctx.stroke();ctx.setLineDash([]);
    const seen=new Set(visLines(sim).filter(o=>o.l===2||sim.p.spec==='absorption').map(o=>o.u));
    pts.forEach(q=>{ctx.fillStyle=seen.has(q.u)?nmRGB(lamNm(q.u,2)):PAL['line'];ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=1;ctx.beginPath();ctx.arc(ax.X(q.x),ax.Y(q.y),6,0,6.29);ctx.fill();ctx.stroke();});
    legend(ctx,box.L+12,box.T+10,[{label:'slope = −R/hc = −1.097 × 10⁷ m⁻¹ (filled dots = lines you have seen)',color:PAL['muted'],dash:true}]);},
  infoPanel(sim){const p=sim.p,hon=atLeast('honors'),ap=atLeast('ap');
    if(p.mode==='flame'){const s=saltOf(sim),unk=p.salt==='unk'&&!sim.st.revealed;let h='<div class="p-head"><h3>Flame test notes</h3></div>';
      h+='<p><b>'+(unk?'Unknown sample':s.n)+':</b> the flame turns '+s.flame+'. Its spectroscope lines: '+s.lines.slice().sort((a,b)=>a[0]-b[0]).map(l=>Math.round(l[0])+' nm').join(', ')+'.</p>';
      h+='<p>The flame’s heat bumps electrons in the metal ions up to higher levels. When they fall back they give off light at the wavelengths above. <b>The chloride is the same in every salt, so the color comes from the metal.</b></p>';
      if(hon){const b=brightest(s);h+='<p>Brightest line: E = hc/λ = (6.626 × 10⁻³⁴)(3.00 × 10⁸) ÷ ('+(b[0]*1e-9).toExponential(3).replace('e-7',' × 10⁻⁷')+' m) = <b>'+sci(H*C/(b[0]*1e-9),'J')+'</b></p>';}
      h+='<p class="help">Safety: in the real lab, wear goggles, tie back hair, and keep the loop pointed away from people. Some of these salts (barium, strontium, copper) are toxic; never taste.</p>';return h;}
    const L=sim.st.last;let h='<div class="p-head"><h3>'+(hon?'The Bohr model, by the numbers':'What the atom just did')+'</h3></div>';
    if(!L)return h+'<p>Wait for the electron’s first drop.</p>';
    const nm=lamNm(L.u,L.l),E=dE(L.u,L.l);
    h+='<p>The electron fell from <b>n = '+L.u+'</b> to <b>n = '+L.l+'</b> and gave off one photon of '+(nm>=380&&nm<=750?colorName(nm)+' light':colorName(nm)+' light you cannot see')+', λ = '+(nm<1000?nm.toFixed(1):Math.round(nm))+' nm.</p>';
    if(hon)h+='<p>ΔE = 2.178 × 10⁻¹⁸ J × (1/'+L.l+'² − 1/'+L.u+'²) = 2.178 × 10⁻¹⁸ × '+(1/(L.l*L.l)-1/(L.u*L.u)).toFixed(4)+' = <b>'+sci(E,'J')+'</b></p><p>λ = hc/ΔE = (6.626 × 10⁻³⁴ J·s)(3.00 × 10⁸ m/s) ÷ '+sci(E,'J')+' = <b>'+(nm<1000?nm.toFixed(1):Math.round(nm))+' nm</b></p>';
    if(ap)h+='<p>Removing the electron from n = 1 entirely (n = ∞) takes 2.178 × 10⁻¹⁸ J, or '+Math.round(X.ion)+' kJ/mol: the first ionization energy of hydrogen.</p>';
    return h;},
  narrate(sim){const p=sim.p,st=sim.st,hon=atLeast('honors');
    if(p.mode==='flame'){const s=saltOf(sim),unk=p.salt==='unk'&&!st.revealed;
      return (unk?'The <b>unknown sample</b>':'<b>'+s.n+'</b>')+' turns the flame '+s.flame+'. Heat excites electrons in the '+(unk?'metal':s.m)+' ions; as they fall back they give off light at <b>'+s.lines.length+' wavelengths</b> unique to that metal. '+(unk?'Match the lines in your sample strip to one of the reference strips.':'Compare its lines with the reference strips.');}
    const vl=visLines(sim);
    if(p.spec==='absorption'){if(p.nhi<3)return 'Atoms in level 2 absorb visible light only by jumping to level 3 or higher. Raise the level to see <b>dark absorption lines</b>.';
      return 'White light passes through hydrogen gas. Atoms in level 2 absorb only photons that match a jump exactly, then re-emit them in every direction. Those colors go missing, leaving <b>'+vl.length+' dark line'+(vl.length===1?'':'s')+'</b> at the same wavelengths as the bright emission lines.';}
    if(p.nhi===2)return 'Electrons only reach level 2. Falling from 2 to 1 gives off <b>ultraviolet light (122 nm)</b>, which your eyes cannot see, so the visible spectroscope stays dark.';
    const a=st.a,L=st.last;let s='';
    if(a.phase==='up')s='The power supply hits the atom and the electron <b>jumps up to level '+a.to+'</b>. ';
    else if(L)s='The electron fell from level '+L.u+' to level '+L.l+' and gave off a photon of '+Math.round(lamNm(L.u,L.l))+' nm ('+colorName(lamNm(L.u,L.l))+'). ';
    s+='Only drops that end on level 2 make visible light. With electrons reaching level '+p.nhi+', the spectrum shows <b>'+vl.length+' visible line'+(vl.length===1?'':'s')+'</b>'+(hon?', each one a single exact energy gap.':'.');
    return s;},
  tour:[
    {title:'A hydrogen atom',text:{bio:'One proton in the middle, one electron outside. In the Bohr model the electron can only sit on certain levels, n = 1, 2, 3 and so on. It cannot sit in between.',honors:'Each level has a fixed energy, Eₙ = −2.178 × 10⁻¹⁸ J / n². Level 1 is the ground state, the lowest energy.'},focus:[AX-140,AY-140,280,280],speed:0.3,setup(sim){BioLab.setValues(sim,{mode:'hydrogen',spec:'emission',range:'vis',nhi:3});clearSpec(sim);}},
    {title:'Energy in: the electron jumps up',text:'Electricity in the tube slams into the atom. The electron absorbs that energy and jumps to a higher level. This is an excited state, and it does not last.',focus:[[AX-140,AY-140,280,280],[LX0-60,50,LX1-LX0+120,300]],speed:0.25},
    {title:'Energy out: a photon of light',text:'The electron falls back down. The energy it loses leaves as one photon. A bigger drop gives a photon with more energy, which means a shorter wavelength.',focus:[[AX-140,AY-140,280,280],[LX0-60,50,LX1-LX0+120,300]],speed:0.25},
    {title:'The spectroscope',text:'A spectroscope spreads light out by wavelength. Hydrogen does not make a rainbow. It makes a few sharp lines, because only certain drops are possible.',focus:[SX0-10,SY-30,SX1-SX0+20,80],speed:1},
    {title:'Higher levels, more lines',text:{bio:'Give the electrons enough energy to reach level 6. New drops become possible, and new lines appear at the blue and violet end.',honors:'The visible lines are the Balmer series: 6→2 (410 nm), 5→2 (434 nm), 4→2 (486 nm) and 3→2 (656 nm).'},focus:[SX0-10,SY-30,SX1-SX0+20,80],speed:1,setup(sim){BioLab.setValues(sim,{nhi:6});}},
    {lvl:'honors',title:'Each line is one energy gap',text:{honors:'The arrow on the energy diagram is the drop that made the last photon. ΔE = hc/λ, so you can read the gap between levels straight off the spectrum.',ap:'The Rydberg equation, ΔE = 2.178 × 10⁻¹⁸ J (1/n₁² − 1/n₂²), predicts every line. Drops to n = 1 are ultraviolet (Lyman); drops to n = 3 are infrared (Paschen).'},focus:[LX0-60,50,LX1-LX0+120,300],speed:0.3},
    {lvl:'honors',title:'Absorption: the same lines, dark',text:'Shine white light through cool hydrogen gas. Atoms absorb only the photons that match a jump, so those exact colors go missing. Astronomers use these dark lines to find hydrogen in stars.',focus:[SX0-10,SY-30,SX1-SX0+20,80],speed:1,setup(sim){BioLab.setValues(sim,{spec:'absorption',nhi:6});}},
    {title:'Flame tests',text:'Heat does the same job as electricity. Each metal ion makes its own colors in a flame. Compare the sample’s lines with the reference strips to identify the metal.',focus:[10,30,780,400],speed:1,setup(sim){BioLab.setValues(sim,{mode:'flame',salt:'li'});}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{mode:'hydrogen',spec:'emission',range:'vis',nhi:3});clearSpec(sim);},
  onChallenge(sim,ch,phase){if(ch&&ch.instant&&ch.set&&phase==='done'){BioLab.setValues(sim,ch.set);sim.infoDirty=true;}},
  challenges:[
    {lvl:'bio',q:'You raise the voltage so electrons reach level 5 instead of level 3. Where do the new visible lines appear?',choices:['At the red end','At the blue and violet end','Nowhere; the same line just gets brighter'],correct:1,
     baseline:{mode:'hydrogen',spec:'emission',range:'vis',nhi:3},change:{nhi:5},changeText:'Electrons can now reach level 5',
     explain:{bio:'New lines appeared at 486 nm (blue-green) and 434 nm (violet). Drops from higher levels release more energy, and more energy means shorter, bluer light.',honors:'5→2 gives '+X.l52.toFixed(0)+' nm and 4→2 gives '+X.l42.toFixed(0)+' nm. Both gaps are larger than the 3→2 gap that makes the red 656 nm line.'}},
    {lvl:'bio',instant:true,set:{mode:'flame',salt:'sr'},q:'Lithium and strontium both turn a flame red. How can you tell them apart?',choices:['You cannot; red is red','Compare their lines in a spectroscope','Lithium flames are always brighter'],correct:1,
     explain:{bio:'The model now shows strontium. Its sample strip has several lines from 606 to 681 nm plus one at 461 nm. Lithium has one strong line at 671 nm. The patterns differ even when the flame colors look alike.'}},
    {lvl:'bio',instant:true,set:{mode:'flame',salt:'na'},q:'What does sodium’s yellow-orange flame look like through a spectroscope?',choices:['A full rainbow from red to violet','One bright yellow line (really a close pair at 589 nm)','Many lines spread evenly across the colors'],correct:1,
     explain:{bio:'Check the sample strip: almost all of sodium’s visible light is at 589.0 and 589.6 nm. That single yellow line is why sodium street lamps look so orange-yellow.'}},
    {lvl:'honors',instant:true,set:{mode:'hydrogen',spec:'emission',range:'vis',nhi:4},q:'Which photon carries more energy: the one from a 4 → 2 drop or the one from a 3 → 2 drop?',choices:['4 → 2 (486 nm, blue-green)','3 → 2 (656 nm, red)','They are equal, since both end on level 2'],correct:0,
     explain:{honors:'ΔE(4→2) = '+sci(X.E42,'J')+' and ΔE(3→2) = '+sci(X.E32,'J')+'. The 4→2 drop is bigger, so its photon has more energy and a shorter wavelength.'}},
    {lvl:'honors',q:'Now white light shines through hydrogen gas instead. Where do the dark absorption lines appear?',choices:['At exactly the same wavelengths as the bright emission lines','At random wavelengths','Halfway between the emission lines'],correct:0,
     baseline:{mode:'hydrogen',spec:'emission',range:'vis',nhi:6},change:{spec:'absorption'},changeText:'Switched to an absorption spectrum',
     explain:{honors:'The dark lines sit at 656, 486, 434 and 410 nm, the same as the bright lines. Absorbing a photon needs exactly the same energy gap as emitting one, just in the other direction.'}},
    {lvl:'ap',instant:true,set:{mode:'hydrogen',spec:'emission',range:'vis',nhi:5},q:'Use ΔE = 2.178 × 10⁻¹⁸ J (1/n₁² − 1/n₂²). What wavelength does an electron emit falling from n = 5 to n = 2?',choices:['434 nm','486 nm','410 nm','1282 nm'],correct:0,
     explain:{ap:'ΔE = 2.178 × 10⁻¹⁸ (1/4 − 1/25) = '+sci(X.E52,'J')+'. λ = hc/ΔE = '+X.l52.toFixed(0)+' nm, the violet Balmer line. Measured in air it is 434.0 nm.'}},
    {lvl:'ap',q:'Switch the spectroscope to see UV and infrared. Electrons in n = 3 can also fall straight to n = 1. Where is that line?',choices:['Ultraviolet, near 103 nm','Infrared, near 1875 nm','Violet, at 410 nm'],correct:0,
     baseline:{mode:'hydrogen',spec:'emission',range:'vis',nhi:3},change:{range:'wide'},changeText:'Spectroscope range widened to UV–infrared',
     explain:{ap:'3→1 is a big drop: ΔE = 2.178 × 10⁻¹⁸ (1 − 1/9) = 1.94 × 10⁻¹⁸ J, so λ = '+X.l31.toFixed(1)+' nm in the Lyman series. Every drop to n = 1 is ultraviolet.'}},
    {lvl:'ap',instant:true,set:{mode:'hydrogen',spec:'emission',range:'wide',nhi:6},q:'How much energy does it take to remove the electron from one mole of ground-state hydrogen atoms (n = 1 → ∞)?',choices:['1312 kJ/mol','2.18 × 10⁻¹⁸ kJ/mol','328 kJ/mol','13.6 kJ/mol'],correct:0,
     explain:{ap:'ΔE = 2.178 × 10⁻¹⁸ J (1/1² − 0) per atom. × 6.022 × 10²³ ÷ 1000 = '+Math.round(X.ion)+' kJ/mol, which matches hydrogen’s measured first ionization energy. 328 kJ/mol is the n = 2 value.'}}
  ],
  lab:{bio:'<p><b>Question:</b> Can you identify a metal from the color of its flame?</p><ol><li>Choose Flame tests. Test each known salt and record a trial for each (flame color and brightest line).</li><li>Press New unknown sample and test it.</li><li>Compare the unknown’s lines with each reference strip.</li></ol><p>Which metal is in your unknown? What evidence convinced you? Why is the spectrum better evidence than the flame color alone?</p>',
       honors:'<p><b>Question:</b> How do hydrogen’s lines relate to its energy levels?</p><ol><li>Set the level to 6 and let the spectrum fill in.</li><li>Record a trial each time a different visible line appears in the last-drop tile (upper level, lower level, wavelength, ΔE).</li><li>Calculate ΔE = hc/λ for each line yourself and compare.</li></ol><p>Explain why hydrogen makes only four visible lines and why the lines get closer together toward the violet end.</p>',
       ap:'<p><b>Question:</b> Does the Rydberg equation predict every hydrogen line?</p><ol><li>Use UV to infrared and level 6. Record trials for drops to n = 1, 2 and 3.</li><li>Use the 1/λ vs 1/n₂² graph for the Balmer series: find the slope and intercept.</li><li>Compare the slope with R/hc = 1.097 × 10⁷ m⁻¹.</li></ol><p><b>Claim–evidence–reasoning:</b> Argue from your data that hydrogen’s energy levels are quantized, and calculate the ionization energy from the intercept.</p>'},
  terms:[{t:'Ground state',d:'The lowest energy level an electron can occupy (n = 1 for hydrogen).'},{t:'Excited state',d:'Any level above the ground state. The electron falls back quickly, giving off light.'},
    {t:'Emission spectrum',d:'The set of bright lines given off by an excited element. Each element has its own pattern.'},{t:'Flame test',d:'Heating a metal salt in a flame to identify the metal by the color it gives off.'},{t:'Spectroscope',d:'An instrument that spreads light out by wavelength so you can see the separate lines.'},
    {lvl:'honors',t:'Quantized',d:'Allowed only in certain fixed amounts. Electron energies in an atom are quantized.'},{lvl:'honors',t:'Absorption spectrum',d:'Dark lines in a continuous spectrum where atoms absorbed exactly the photons that match their energy gaps.'},{lvl:'honors',t:'Balmer series',d:'Hydrogen lines from drops ending on n = 2: 656, 486, 434 and 410 nm.'},
    {lvl:'ap',t:'Rydberg equation',d:'ΔE = 2.178 × 10⁻¹⁸ J (1/n₁² − 1/n₂²) for hydrogen.'},{lvl:'ap',t:'Lyman and Paschen series',d:'Drops ending on n = 1 (ultraviolet) and on n = 3 (infrared).'}],
  about:'<p><b>Hydrogen.</b> Level energies follow the Bohr model, Eₙ = −2.178 × 10⁻¹⁸ J / n², and each line uses λ = hc/ΔE, which reproduces the measured lines to within 0.1 nm (656.5, 486.2, 434.1, 410.2 nm in vacuum). When an electron in level n falls, the model picks the lower level using NIST average transition probabilities for hydrogen, so the brightness ratios are realistic for a gas in which each level is equally likely to be excited. Line brightness on the strip is scaled by the square root of the photon count so faint lines stay visible. Orbit sizes and level spacing are drawn for readability; the graph panel shows the energies to scale. The absorption mode assumes some atoms already sit in n = 2, as in a hot star’s atmosphere; at room temperature nearly all hydrogen is in n = 1 and absorbs only in the ultraviolet.</p><p><b>Flame tests.</b> Lithium, sodium and potassium lines are atomic lines (Li 670.8 nm, Na 589.0/589.6 nm, K 766.5/769.9 and 404.4 nm). Calcium, strontium, barium and copper flames are dominated by molecular bands from CaOH, SrOH, BaO/BaOH and CuCl, shown here as single lines at their band heads. Real flames also show a faint yellow sodium line from contamination, which this model leaves out.</p>',
  initVis(sim){},
  draw(sim,ctx,vdt,k,t){const p=sim.p,st=sim.st,hon=atLeast('honors'),ap=atLeast('ap');
    ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
    if(p.mode==='flame'){drawFlame(sim,ctx,k,t);return;}
    // Bohr atom
    for(let n=1;n<=6;n++){const r=rn(n);ctx.strokeStyle=n<=p.nhi?PAL['cv-soft']:PAL['line'];ctx.lineWidth=n<=p.nhi?1.6:1;ctx.setLineDash(n<=p.nhi?[]:[3,4]);ctx.beginPath();ctx.arc(AX,AY,r,0,6.29);ctx.stroke();}ctx.setLineDash([]);
    const lang=-0.62;for(let n=2;n<=6;n++){const r=rn(n);const lab=n===6&&k<1.25?'n = 6':String(n);ctx.font='700 '+(12*k)+'px '+FONT;const w=ctx.measureText(lab).width+6;const x=AX+Math.cos(lang)*r+(n===6?w/2-6:0),y=AY+Math.sin(lang)*r;
      ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(x-w/2,y-7*k,w,14*k);txt(ctx,lab,x,y,{s:12*k,w:700,a:'center',b:'middle',c:PAL['cv-soft']});}
    CL.drawAtom(ctx,AX,AY,10,'',{color:'#c0392b',label:'+'});
    if(st.zap>0&&!RM){const f=1-st.zap/0.5;ctx.fillStyle=PAL['cv-sub'];ctx.beginPath();ctx.arc(lerp(AX-150,AX-atomR(sim),f),AY+lerp(40,0,f),5,0,6.29);ctx.fill();}
    const ar=atomR(sim),aa=t*(2.2/Math.sqrt(ar/14));const ex=AX+Math.cos(aa)*ar,ey=AY+Math.sin(aa)*ar;
    ctx.fillStyle=PAL['cv-e'];ctx.strokeStyle=PAL['cv-estroke'];ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(ex,ey,7,0,6.29);ctx.fill();ctx.stroke();
    // photons in flight
    st.ph.forEach(o=>{const col=lineCol(o.nm);const ang=Math.atan2(o.dy,o.dx);ctx.save();ctx.translate(o.x,o.y);ctx.rotate(ang);ctx.strokeStyle=col;ctx.lineWidth=3;ctx.globalAlpha=o.inc?1:clamp(1.6-o.t,0,1);ctx.beginPath();
      const w=46,wl=clamp(o.nm/40,5,16);for(let s=0;s<=w;s+=2){const y=Math.sin(Math.PI*s/w)*7*Math.sin(2*Math.PI*s/wl);s?ctx.lineTo(-w+s,y):ctx.moveTo(-w,y);}ctx.stroke();ctx.restore();});
    // energy diagram
    txt(ctx,'Energy levels',(LX0+LX1)/2,yN(Infinity)-26*k+12,{s:13*k,w:700,a:'center'});
    if(hon){ctx.setLineDash([4,4]);ctx.strokeStyle=PAL['line'];ctx.beginPath();ctx.moveTo(LX0,yN(Infinity));ctx.lineTo(LX1,yN(Infinity));ctx.stroke();ctx.setLineDash([]);}
    for(let n=1;n<=6;n++){const y=yN(n);ctx.strokeStyle=n<=p.nhi?PAL['cv-ink']:PAL['line'];ctx.lineWidth=n===1?3:2;ctx.beginPath();ctx.moveTo(LX0,y);ctx.lineTo(LX1,y);ctx.stroke();
      const odd=n%2===1;txt(ctx,'n = '+n,odd?LX0-6:LX1+6,y,{s:12*k,w:600,a:odd?'right':'left',b:'middle',c:n<=p.nhi?PAL['cv-ink']:PAL['cv-soft']});}
    const L=st.last;
    if(L){const nm=lamNm(L.u,L.l),x=LX0+22+((L.u+L.l)%4)*22,y1=yN(L.u),y2=yN(L.l);const col=lineCol(nm);const fade=st.a.phase==='rest'?0.55:1;
      ctx.globalAlpha=fade;ctx.strokeStyle=col;ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(x,y1);ctx.lineTo(x,y2-9);ctx.stroke();ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(x-8,y2-11);ctx.lineTo(x+8,y2-11);ctx.lineTo(x,y2);ctx.closePath();ctx.fill();
      ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x-8,y2-11);ctx.lineTo(x+8,y2-11);ctx.lineTo(x,y2);ctx.closePath();ctx.stroke();ctx.globalAlpha=1;
      const lab=Math.round(nm)+' nm';pill(ctx,lab,LX0+150,(yN(1)+yN(2))/2,col,CL.inkOn(col),12*k);}
    if(st.a.phase==='up'){const x=LX0+18,y1=yN(st.a.from),y2=yN(st.a.to);ctx.strokeStyle=PAL['cv-soft'];ctx.setLineDash([4,3]);ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y1);ctx.lineTo(x,y2);ctx.stroke();ctx.setLineDash([]);}
    const ely=atomLevelY(sim);ctx.fillStyle=PAL['cv-e'];ctx.strokeStyle=PAL['cv-estroke'];ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(LX1-16,ely-7,6,0,6.29);ctx.fill();ctx.stroke();
    // discharge tube or lamp + gas cell
    const lines=linesNow(sim);drawTube(sim,ctx,k,t,lines);
    // spectroscope strip
    drawStrip(sim,ctx,k,lines);
  },
  thumbSetup(sim){sim.p.nhi=6;},thumbFrames:120
};
function drawTube(sim,ctx,k,t,lines){const p=sim.p;rr(ctx,TX,TY,TW,TH,12);ctx.fillStyle=PAL['card'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
  const cx=TX+TW/2,t0=TY+38*k,t1=TY+TH-16;
  txt(ctx,p.spec==='absorption'?'Lamp + H₂ gas':'Hydrogen tube',cx,TY+18*k,{s:13*k,w:700,a:'center'});
  // glow color from visible emission
  let rgb=[0,0,0],tot=0;lines.forEach(o=>{if(o.nm>=380&&o.nm<=750){const c=hexRGB(nmRGB(o.nm));const w=o.c;rgb=rgb.map((v,i)=>v+c[i]*w);tot+=w;}});
  const glow=tot&&p.spec!=='absorption'?'rgb('+rgb.map(v=>Math.round(Math.min(255,v/tot*1.25))).join(',')+')':null;
  ctx.fillStyle='#6d7a88';ctx.fillRect(cx-9,t0-8,18,10);ctx.fillRect(cx-9,t1-2,18,10);
  if(p.spec==='absorption'){ctx.fillStyle='#fff7d6';ctx.beginPath();ctx.arc(cx,t0+20,14,0,6.29);ctx.fill();ctx.strokeStyle=PAL['cv-soft'];ctx.stroke();ctx.fillStyle=PAL['cv-water'];ctx.globalAlpha=0.6;rr(ctx,cx-26,t0+50,52,t1-t0-70,8);ctx.fill();ctx.globalAlpha=1;ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=2;rr(ctx,cx-26,t0+50,52,t1-t0-70,8);ctx.stroke();
    txt(ctx,'H₂ gas',cx,(t0+t1)/2+20,{s:12*k,w:700,a:'center'});}
  else{if(glow){ctx.save();ctx.shadowColor=glow;ctx.shadowBlur=22;ctx.fillStyle=glow;rr(ctx,cx-9,t0+4,18,t1-t0-8,9);ctx.fill();ctx.restore();}
    ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=2.5;rr(ctx,cx-13,t0,26,t1-t0,13);ctx.stroke();
    if(!glow){txt(ctx,'UV only:',cx,(t0+t1)/2-10*k,{s:12*k,w:700,a:'center',c:PAL['cv-soft']});txt(ctx,'no visible glow',cx,(t0+t1)/2+8*k,{s:12*k,a:'center',c:PAL['cv-soft']});}}}
function drawStrip(sim,ctx,k,lines){const p=sim.p,wide=p.mode==='hydrogen'&&p.range==='wide',abs=p.mode==='hydrogen'&&p.spec==='absorption';
  const SX0=sx0(sim);txt(ctx,p.mode==='flame'?'Your sample':'Spectroscope',SX0,SY-12-16*k,{s:12*k,w:700,c:PAL['cv-soft']});
  ctx.fillStyle='#0b0b10';ctx.fillRect(SX0,SY,SX1-SX0,SH);
  if(abs){if(!wide){for(let n=380;n<780;n+=2){ctx.fillStyle=nmRGB(n+1);ctx.fillRect(sxOf(sim,n),SY,sxOf(sim,n+2)-sxOf(sim,n)+0.6,SH);}}
    else{ctx.fillStyle='#6b6b78';ctx.fillRect(SX0,SY,SX1-SX0,SH);for(let n=380;n<750;n+=2){ctx.fillStyle=nmRGB(n+1);ctx.fillRect(sxOf(sim,n),SY,sxOf(sim,n+2)-sxOf(sim,n)+0.6,SH);}}}
  else if(wide){ctx.strokeStyle='#555';ctx.setLineDash([3,3]);ctx.strokeRect(sxOf(sim,380),SY+1,sxOf(sim,750)-sxOf(sim,380),SH-2);ctx.setLineDash([]);}
  const hon=atLeast('honors');const labs=[];
  lines.forEach(o=>{if(!inStrip(sim,o.nm)||o.b<=0)return;const x=sxOf(sim,o.nm);
    if(abs){ctx.fillStyle='rgba(0,0,0,'+(0.35+0.65*o.b).toFixed(2)+')';ctx.fillRect(x-2,SY,4,SH);}
    else{ctx.save();ctx.globalAlpha=clamp(o.b,0.15,1);ctx.fillStyle=lineCol(o.nm);ctx.shadowColor=lineCol(o.nm);ctx.shadowBlur=8;ctx.fillRect(x-2,SY,4,SH);ctx.restore();}
    if(hon&&o.b>0.1&&!wide)labs.push({x,s:String(Math.round(o.nm))});});
  ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.strokeRect(SX0,SY,SX1-SX0,SH);
  // line labels above (visible range only), skipping any that would collide
  ctx.font='700 '+(12*k)+'px '+FONT;labs.sort((a,b)=>a.x-b.x);let lastR=-1e9;labs.forEach(l=>{const w=ctx.measureText(l.s).width;if(l.x-w/2<lastR+4)return;lastR=l.x+w/2;txt(ctx,l.s,l.x,SY-8,{s:12*k,w:700,a:'center',c:PAL['cv-ink']});});
  // ticks
  const ticks=wide?[100,200,1000,2000]:k>1.3?[400,500,600,700]:[400,450,500,550,600,650,700,750];const ty=SY+SH+6+12*k;
  ticks.forEach((n,i)=>{const x=sxOf(sim,n);ctx.strokeStyle=PAL['cv-soft'];ctx.beginPath();ctx.moveTo(x,SY+SH);ctx.lineTo(x,SY+SH+5);ctx.stroke();txt(ctx,n+(i===ticks.length-1?' nm':''),x,ty,{s:12*k,a:i===ticks.length-1&&wide?'right':'center',c:PAL['cv-soft']});});
  if(wide){txt(ctx,'UV',sxOf(sim,150),SY+SH/2,{s:12*k,w:700,a:'center',b:'middle',c:'#d8d0ff'});txt(ctx,'visible',(sxOf(sim,380)+sxOf(sim,750))/2,SY+SH+6+12*k,{s:12*k,w:700,a:'center',c:PAL['cv-soft']});txt(ctx,'infrared',sxOf(sim,1350),SY+SH/2,{s:12*k,w:700,a:'center',b:'middle',c:'#ffd0c0'});}}
function drawFlame(sim,ctx,k,t){const p=sim.p,st=sim.st,s=saltOf(sim),unk=p.salt==='unk'&&!st.revealed,hon=atLeast('honors');
  // burner
  const bx=150,base=330;ctx.fillStyle=PAL['cv-bench'];ctx.fillRect(0,base+14,320,10);
  ctx.fillStyle='#59616b';rr(ctx,bx-44,base,88,16,4);ctx.fill();ctx.fillStyle='#7d8791';ctx.fillRect(bx-11,230,22,base-230);ctx.fillStyle='#4a5159';ctx.fillRect(bx-14,286,28,12);
  const fin=st.fin,fl=RM?0:Math.sin(t*13)*3+Math.sin(t*7.3)*2;
  // outer flame tinted by the salt
  const outer=fin>0?s.col:'#8fb4ff';ctx.save();ctx.globalAlpha=0.35+0.5*fin;const g=ctx.createLinearGradient(0,90,0,230);g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(0.25,outer);g.addColorStop(1,outer);ctx.fillStyle=g;
  ctx.beginPath();ctx.moveTo(bx-16,230);ctx.bezierCurveTo(bx-40,180,bx-14+fl,130,bx+fl*1.5,88);ctx.bezierCurveTo(bx+14+fl,130,bx+40,180,bx+16,230);ctx.closePath();ctx.fill();ctx.restore();
  ctx.save();ctx.globalAlpha=0.85;ctx.fillStyle='#5f86ff';ctx.beginPath();ctx.moveTo(bx-9,230);ctx.quadraticCurveTo(bx-6,190,bx,180);ctx.quadraticCurveTo(bx+6,190,bx+9,230);ctx.closePath();ctx.fill();ctx.restore();
  // wire loop with sample
  const lx=lerp(60,bx+4,Math.min(1,fin*1.5)),ly=170;ctx.strokeStyle='#8a8f98';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(8,ly+40);ctx.lineTo(lx-8,ly);ctx.stroke();ctx.beginPath();ctx.arc(lx,ly,7,0,6.29);ctx.stroke();ctx.fillStyle='#f2f2f2';ctx.beginPath();ctx.arc(lx,ly,4,0,6.29);ctx.fill();
  ctx.fillStyle='#6d5a43';rr(ctx,0,ly+34,26,14,4);ctx.fill();
  txt(ctx,unk?'Unknown sample':CL.fmt(s.f)+' in the flame',bx,base+44+12*k,{s:13*k,w:700,a:'center'});
  // reference strips
  const RX1=SX1,ry=i=>44+i*34;const rx=nm=>RX0+(nm-380)/(780-380)*(RX1-RX0);
  txt(ctx,'Reference spectra',RX0,30,{s:12*k,w:700,c:PAL['cv-soft']});
  SK.forEach((key,i)=>{const r=SALTS[key],y=ry(i);ctx.fillStyle='#0b0b10';ctx.fillRect(RX0,y,RX1-RX0,20);
    r.lines.forEach(l=>{ctx.globalAlpha=clamp(l[1],0.3,1);ctx.fillStyle=nmRGB(l[0]);ctx.fillRect(rx(l[0])-1.5,y,3,20);ctx.globalAlpha=1;});
    const match=p.salt!=='unk'&&p.salt===key||(p.salt==='unk'&&st.revealed&&st.secret===key);
    txt(ctx,r.m,RX0-8,y+11,{s:12*k,w:match?800:600,a:'right',b:'middle',c:match?PAL['rj']:PAL['cv-soft']});if(match){ctx.strokeStyle=PAL['rj'];ctx.lineWidth=2;ctx.strokeRect(RX0-1,y-1,RX1-RX0+2,22);}});
  // sample strip
  const lines=s.lines.map(l=>({nm:l[0],b:l[1]*fin,c:1}));drawStrip(sim,ctx,k,lines);
}
SIM.onLevel=sync;
BioLab.register(SIM);
})();
