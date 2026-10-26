(function(){
'use strict';
const {clamp,lerp,rr,txt,pill,atLeast,PAL,FONT,RM,axes,legend,serColor,lvText}=BioLab.h;
const CL=window.ChemLab,KC=CL.K;
const H=KC.h,C=KC.c,NA=KC.NA,QE=KC.e,ME=KC.me;
const HC_KJ=H*C*NA/1000;             // kJ·m/mol: E(kJ/mol) = HC_KJ / λ(m)
const L=m=>Math.log10(m);             // slider value for a wavelength in meters

/* ---------- data ---------- */
// Average bond enthalpies (kJ/mol), standard textbook values.
const BONDS={cl2:{l:'Cl–Cl (in Cl₂)',mol:'Cl₂',a:'Cl',b:'Cl',BE:242,ord:1},br2:{l:'Br–Br (in Br₂)',mol:'Br₂',a:'Br',b:'Br',BE:193,ord:1},
  i2:{l:'I–I (in I₂)',mol:'I₂',a:'I',b:'I',BE:151,ord:1},h2:{l:'H–H (in H₂)',mol:'H₂',a:'H',b:'H',BE:436,ord:1},
  ch:{l:'C–H (in CH₄)',mol:'CH₄',a:'C',b:'H',BE:413,ord:1},o2:{l:'O=O (in O₂)',mol:'O₂',a:'O',b:'O',BE:498,ord:2},n2:{l:'N≡N (in N₂)',mol:'N₂',a:'N',b:'N',BE:945,ord:3}};
// Work functions (eV), CRC Handbook polycrystalline values.
const METALS={cs:{n:'Cesium',phi:2.14},k:{n:'Potassium',phi:2.29},na:{n:'Sodium',phi:2.36},zn:{n:'Zinc',phi:4.33},cu:{n:'Copper',phi:4.70},pt:{n:'Platinum',phi:5.65}};
// Real-world sources to jump to.
const PRESETS={custom:{l:'(use the slider)'},fm:{l:'FM radio station (3.00 m)',m:3.0},mw:{l:'Microwave oven (12.2 cm)',m:0.122},ir:{l:'TV remote, infrared (940 nm)',m:940e-9},
  red:{l:'Red laser pointer (650 nm)',m:650e-9},na:{l:'Sodium street lamp (589 nm)',m:589e-9},grn:{l:'Green laser (532 nm)',m:532e-9},blu:{l:'Blue LED (450 nm)',m:450e-9},
  vio:{l:'Violet laser (405 nm)',m:405e-9},uvb:{l:'Sunburn UV-B (300 nm)',m:300e-9},uvc:{l:'Germicidal UV-C lamp (254 nm)',m:254e-9},
  xr:{l:'Medical X-ray (0.0300 nm)',m:3.0e-11},gam:{l:'Cobalt-60 gamma ray (1.06 pm)',m:1.06e-12}};
const REG=[{n:'Gamma',lo:-13,hi:-11},{n:'X-ray',lo:-11,hi:-8},{n:'UV',lo:-8,hi:L(380e-9)},{n:'Visible',lo:L(380e-9),hi:L(750e-9)},{n:'Infrared',lo:L(750e-9),hi:-3},{n:'Microwave',lo:-3,hi:0},{n:'Radio',lo:0,hi:2}];

/* ---------- physics ---------- */
const lam=p=>Math.pow(10,p.ll);
const nu=p=>C/lam(p);
const EJ=p=>H*nu(p);
const Ekj=p=>EJ(p)*NA/1000;
const EeV=p=>EJ(p)/QE;
const nmOf=p=>lam(p)*1e9;
function KEeV(p){return EeV(p)-METALS[p.metal].phi;}
function deBroglie(KE){if(!(KE>0))return NaN;return H/Math.sqrt(2*ME*KE*QE);}
function region(l){const g=L(l);if(g<-11)return 'Gamma ray';if(g<-8)return 'X-ray';if(l<380e-9){const nm=l*1e9;return 'Ultraviolet'+(nm>=315?' (UV-A)':nm>=280?' (UV-B)':nm>=100?' (UV-C)':' (extreme UV)');}
  if(l<=750e-9)return 'Visible: '+colorName(l*1e9);if(l<1e-3)return 'Infrared';if(l<1)return 'Microwave';return 'Radio wave';}
function colorName(nm){return nm<450?'violet':nm<485?'blue':nm<500?'cyan':nm<565?'green':nm<590?'yellow':nm<625?'orange':'red';}
function shortName(l){const g=L(l);if(g<-11)return 'gamma';if(g<-8)return 'X-ray';if(l<380e-9)return 'ultraviolet';if(l<=750e-9)return colorName(l*1e9);if(l<1e-3)return 'infrared';if(l<1)return 'microwave';return 'radio';}
function fmtLen(l){const u=l<1e-10?['pm',1e-12]:l<1e-6?['nm',1e-9]:l<1e-3?['µm',1e-6]:l<1e-2?['mm',1e-3]:l<1?['cm',1e-2]:['m',1];let v=l/u[1];return CL.toSig(v,3)+' '+u[0];}
const sci=(v,u,s)=>CL.sci(v,u,s||3);
function nmRGB(nm){let r=0,g=0,b=0;
  if(nm<440){r=(440-nm)/60;b=1;}else if(nm<490){g=(nm-440)/50;b=1;}else if(nm<510){g=1;b=(510-nm)/20;}else if(nm<580){r=(nm-510)/70;g=1;}else if(nm<645){r=1;g=(645-nm)/65;}else r=1;
  const f=nm<400?0.75+0.25*(nm-380)/20:nm>720?1-0.35*(nm-720)/30:1;const hx=v=>Math.round(255*Math.pow(clamp(v*f,0,1),0.8)).toString(16).padStart(2,'0');return '#'+hx(r)+hx(g)+hx(b);}
function waveColor(p){const l=lam(p);if(l>=380e-9&&l<=750e-9)return nmRGB(l*1e9);if(l<380e-9)return PAL['s5'];if(l<1e-3)return PAL['s1'];return PAL['cv-soft'];}
// on-screen wavelength: a compressed log scale so every region is visible (not to scale)
const pxL=p=>16*Math.pow(330/16,(p.ll+12)/13);

/* ---------- layout ---------- */
const BX0=40,BX1=760,BY=24,BH=30;                    // spectrum bar
const bx=g=>BX0+(g+12)/13*(BX1-BX0);
const WY=196,WX0=18,WX1=540;                          // wave axis
const TBX=560,TBY=96,TBW=228,TBH=206;                 // target box
const VS=150;                                         // speed of light on screen, px/s (same for every wave)
const MOLS=[[628,192],[714,234],[632,276]];
const PLATE=742;

/* ---------- show only what the current setup uses ---------- */
function sync(sim){const d=sim.def;if(!sim.ui||!sim.ui.sec)return;
  if(!atLeast('ap')&&sim.p.target==='metal')BioLab.setValues(sim,{target:'none'});
  d.controls.forEach(c=>{const cid=d.id+'-'+c.id,e=document.getElementById(cid)||document.getElementById(cid+'-l');if(!e)return;const w=e.closest('.ctl');if(w)w.hidden=!atLeast(c.lvl)||(c.show?!c.show(sim):false);});
  d.metrics.forEach(m=>{const t=sim.ui.tiles[m.id];if(!t)return;const w=t.num.closest('.tile');if(w)w.hidden=!!m.hideTile||!atLeast(m.lvl)||(m.show?!m.show(sim):false);});
  const btns=[...sim.ui.sec.querySelectorAll('.actions button')];d.actions.forEach((a,i)=>{const b=btns[i];if(b)b.hidden=!atLeast(a.lvl)||(a.show?!a.show(sim):false);});
  const o=document.getElementById(d.id+'-ll-out');if(o)o.textContent=fmtLen(lam(sim.p));}
let presetLock=false;
function onLL(sim){if(!presetLock&&sim.p.pre!=='custom'){const pr=PRESETS[sim.p.pre];if(!pr||!pr.m||Math.abs(L(pr.m)-sim.p.ll)>0.003){presetLock=true;BioLab.setValues(sim,{pre:'custom'});presetLock=false;}}sync(sim);}
function onPre(sim){const pr=PRESETS[sim.p.pre];if(pr&&pr.m&&!presetLock){presetLock=true;BioLab.setValues(sim,{ll:L(pr.m)});presetLock=false;}sync(sim);}
function resetTarget(sim){const st=sim.st;if(!st)return;st.pk=[];st.el=[];st.mol=MOLS.map(m=>({x:m[0],y:m[1],brk:0}));st.broken=0;st.ej=0;st.passed=0;st.flash=[];sync(sim);}

/* ---------- photons ---------- */
function photonsOn(p){return p.ph||p.target!=='none';}
function spawn(sim){const p=sim.p,st=sim.st;if(st.pk.length>24)return;const pk={x:WX0,y:WY+(Math.random()-0.5)*30,tx:null,ty:null,mol:-1};
  if(p.target==='bond'){const intact=st.mol.map((m,i)=>m.brk<=0?i:-1).filter(i=>i>=0);const i=intact.length?intact[Math.floor(Math.random()*intact.length)]:Math.floor(Math.random()*3);pk.mol=i;pk.tx=st.mol[i].x-16;pk.ty=st.mol[i].y;}
  else if(p.target==='metal'){pk.tx=PLATE;pk.ty=TBY+40+Math.random()*(TBH-80);}
  st.pk.push(pk);}
function pkY(pk){if(pk.tx===null||pk.x<=WX1)return pk.y;const f=clamp((pk.x-WX1)/(pk.tx-WX1),0,1);return lerp(pk.y,pk.ty,f);}

const ln=(a,b)=>Math.log10(a/b);
// Numbers used in challenge explanations (computed from the same model)
const ex={E700:HC_KJ/700e-9,E400:HC_KJ/400e-9,E450:HC_KJ/450e-9,nu600:C/600e-9,lmaxCl:HC_KJ/242,E300:HC_KJ/300e-9,E600:HC_KJ/600e-9,
  eV300:H*C/300e-9/QE,eV450:H*C/450e-9/QE};
ex.KE300=ex.eV300-METALS.na.phi;ex.KE450=ex.eV450-METALS.na.phi;ex.dB300=deBroglie(ex.KE300);

const SIM={
  id:'light',hash:'light',apUnit:3,order:1,tab:'Light and photons',kind:'Simulation',
  prereq:[],next:['spectra','pes','beerslaw'],
  card:'Slide from radio waves to gamma rays, see how wavelength sets frequency and photon energy, and find which light can break a bond.',
  title:'Light: waves, photons and energy',
  lede:{bio:'Light is a wave, and it comes in packets called photons. Change the wavelength and watch the color, the frequency and the energy of each photon change together.',
        honors:'Use c = λν and E = hν to connect wavelength, frequency and photon energy, then find the longest wavelength that can break a chemical bond.',
        ap:'Add the photoelectric effect: one photon frees one electron only if hν is larger than the metal’s work function. Then find the electron’s de Broglie wavelength.'},
  scale:{bio:'The spectrum bar is a log scale: each step is ten times longer. Visible light is a thin slice, 380 to 750 nanometers. 1 nm = 10⁻⁹ m.',
         honors:'The spectrum bar runs from 1 pm (10⁻¹² m) to 10 m on a log scale. The wave drawing is not to scale: real visible waves are about 1/100 the width of a hair.'},
  timeless:true,animated:true,chChange:1.2,chReveal:3.6,
  controls:[
    {id:'ll',label:'Wavelength',type:'range',min:-12,max:1,step:0.005,def:L(520e-9),lvl:'bio',noTrial:true,help:'Slide left for shorter waves (ultraviolet, X-rays), right for longer waves (infrared, radio).',onChange:onLL},
    {id:'pre',label:'Jump to a real source',type:'select',def:'custom',lvl:'bio',noTrial:true,options:Object.keys(PRESETS).map(k=>({v:k,l:PRESETS[k].l})),onChange:onPre},
    {id:'bright',label:'Brightness',type:'range',min:0,max:100,step:5,def:60,unit:'%',lvl:'bio',help:'Brighter light sends more photons each second. It does not change the energy of each photon.'},
    {id:'ph',label:'Show photons',type:'toggle',def:false,lvl:'bio',noTrial:true,help:'Draw the light as separate packets of energy.'},
    {id:'target',label:'Shine the light on',type:'seg',def:'none',lvl:'bio',options:[{v:'none',l:'Nothing'},{v:'bond',l:'Molecules'},{v:'metal',l:'A metal',lvl:'ap'}],onChange:resetTarget},
    {id:'bond',label:'Bond to break',type:'select',def:'cl2',lvl:'honors',noTrial:true,options:Object.keys(BONDS).map(k=>({v:k,l:BONDS[k].l+', '+BONDS[k].BE+' kJ/mol'})),show:s=>s.p.target==='bond',onChange:resetTarget},
    {id:'metal',label:'Metal surface',type:'select',def:'na',lvl:'ap',noTrial:true,options:Object.keys(METALS).map(k=>({v:k,l:METALS[k].n+', φ = '+METALS[k].phi.toFixed(2)+' eV'})),show:s=>s.p.target==='metal',onChange:resetTarget}
  ],
  actions:[{id:'clear',label:'Reset the molecules',lvl:'bio',show:s=>s.p.target==='bond',run(sim){resetTarget(sim);}},
           {id:'clearm',label:'Reset the electron count',lvl:'ap',show:s=>s.p.target==='metal',run(sim){resetTarget(sim);}}],
  init(){return {ph:0,acc:0,pk:[],el:[],mol:MOLS.map(m=>({x:m[0],y:m[1],brk:0})),broken:0,ej:0,passed:0,flash:[]};},
  step(sim,dt){const p=sim.p,st=sim.st;st.ph+=dt;
    if(photonsOn(p)&&p.bright>0){st.acc+=dt*p.bright/100*2.6;while(st.acc>=1){st.acc-=1;spawn(sim);}}
    const E=Ekj(p),eV=EeV(p);
    for(const pk of st.pk){pk.x+=VS*dt*1.6;
      if(p.target==='bond'&&pk.mol>=0&&pk.x>=pk.tx){const m=st.mol[pk.mol];if(E>=BONDS[p.bond].BE&&m.brk<=0){m.brk=2.6;st.broken++;st.flash.push({x:m.x,y:m.y,t:0.35});pk.dead=true;}else{pk.mol=-1;pk.tx=null;pk.y=pkY(pk);}}
      else if(p.target==='metal'&&pk.x>=PLATE-4){pk.dead=true;if(eV>METALS[p.metal].phi){const KE=eV-METALS[p.metal].phi;const v=45+70*Math.sqrt(KE);const a=Math.PI+(Math.random()-0.5)*1.3;st.el.push({x:PLATE-6,y:pk.ty,vx:Math.cos(a)*v,vy:Math.sin(a)*v,t:0});st.ej++;}else st.flash.push({x:PLATE-4,y:pk.ty,t:0.2});}
      else if(p.target==='none'&&pk.x>WX1+10)pk.dead=true;
      if(pk.x>812)pk.dead=true;}
    st.pk=st.pk.filter(k=>!k.dead);
    st.mol.forEach(m=>{if(m.brk>0)m.brk=Math.max(0,m.brk-dt);});
    st.el.forEach(e=>{e.x+=e.vx*dt;e.y+=e.vy*dt;e.t+=dt;});st.el=st.el.filter(e=>e.t<2.5&&e.x>TBX-10&&e.y>TBY-10&&e.y<TBY+TBH+10);
    st.flash.forEach(f=>f.t-=dt);st.flash=st.flash.filter(f=>f.t>0);},
  metrics:[
    {id:'lamt',label:'Wavelength λ',lvl:'bio',text:true,noTrial:true,get:s=>fmtLen(lam(s.p))},
    {id:'reg',label:'Type of light',lvl:'bio',text:true,get:s=>region(lam(s.p))},
    {id:'rel',label:'Energy per photon compared with red light (700 nm)',lvl:'bio',text:true,noTrial:true,get:s=>{const r=700e-9/lam(s.p);return (r>=0.01&&r<1000?CL.toSig(r,3):sci(r,'',3))+' ×';}},
    {id:'brk',label:'Cl₂ bonds broken',lvl:'bio',show:s=>s.p.target==='bond'&&!atLeast('honors'),get:s=>s.st.broken,min:0,max:null,d:0,noTrial:true},
    {id:'brk2',label:'Bonds broken',lvl:'honors',show:s=>s.p.target==='bond',get:s=>s.st.broken,min:0,max:null,d:0,noTrial:true},
    {id:'nut',label:'Frequency ν = c/λ',lvl:'honors',text:true,noTrial:true,get:s=>sci(nu(s.p),'Hz')},
    {id:'Ejt',label:'Energy per photon E = hν',lvl:'honors',text:true,noTrial:true,get:s=>sci(EJ(s.p),'J')},
    {id:'Emt',label:'Energy per mole of photons',lvl:'honors',text:true,noTrial:true,get:s=>sci(Ekj(s.p),'kJ/mol')},
    {id:'evt',label:'Energy per photon (electron-volts)',lvl:'ap',text:true,noTrial:true,get:s=>sci(EeV(s.p),'eV')},
    {id:'ket',label:'Fastest electron’s kinetic energy',lvl:'ap',text:true,noTrial:true,show:s=>s.p.target==='metal',get:s=>{const k=KEeV(s.p);return k>0?k.toFixed(2)+' eV':'0 (no electrons escape)';}},
    {id:'dbt',label:'That electron’s de Broglie wavelength',lvl:'ap',text:true,noTrial:true,show:s=>s.p.target==='metal',get:s=>{const d=deBroglie(KEeV(s.p));return Number.isFinite(d)?fmtLen(d):'no electron';}},
    {id:'ejn',label:'Electrons ejected',lvl:'ap',show:s=>s.p.target==='metal',get:s=>s.st.ej,min:0,max:null,d:0,noTrial:true},
    // numeric columns for the data table and Trials graph (tiles hidden)
    {id:'lnm',label:'Wavelength',unit:'nm',lvl:'bio',hideTile:true,d:1,min:0,max:null,get:s=>nmOf(s.p)},
    {id:'nu14',label:'Frequency',unit:'× 10¹⁴ Hz',lvl:'honors',hideTile:true,d:3,min:0,max:null,get:s=>nu(s.p)/1e14},
    {id:'ekj',label:'Energy',unit:'kJ/mol',lvl:'bio',hideTile:true,d:1,min:0,max:null,get:s=>Ekj(s.p)},
    {id:'kev',label:'KEmax',unit:'eV',lvl:'ap',hideTile:true,d:2,min:0,max:null,get:s=>s.p.target==='metal'?Math.max(0,KEeV(s.p)):0}
  ],
  graphs:[{id:'fwl',label:'Frequency vs wavelength (visible and UV)',lvl:'bio',custom:true},{id:'ewl',label:'Photon energy vs wavelength',lvl:'honors',custom:true},{id:'pe',label:'Electron energy vs frequency (photoelectric)',lvl:'ap',custom:true}],
  defaultGraph:'fwl',
  plot(sim,ctx,box,id){const p=sim.p,nm=nmOf(p);
    if(id==='fwl'||id==='ewl'){const isE=id==='ewl';const f=x=>isE?HC_KJ/(x*1e-9):C/(x*1e-9)/1e14;const ymax=isE?1250:15.5;
      const ax=axes(ctx,box,{xmin:100,xmax:1000,ymin:0,ymax,xl:'Wavelength λ (nm)',yl:isE?'Energy per mole of photons (kJ/mol)':'Frequency ν (× 10¹⁴ Hz)'});
      ctx.save();ctx.beginPath();ctx.rect(box.L,box.T,box.W,box.H);ctx.clip();
      for(let x=380;x<750;x+=4){ctx.fillStyle=nmRGB(x+2);ctx.globalAlpha=0.18;ctx.fillRect(ax.X(x),box.T,ax.X(x+4)-ax.X(x)+0.5,box.H);}ctx.globalAlpha=1;
      if(isE&&p.target==='bond'){const be=BONDS[p.bond].BE;ctx.setLineDash([6,4]);ctx.strokeStyle=PAL['s3'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(box.L,ax.Y(be));ctx.lineTo(box.L+box.W,ax.Y(be));ctx.stroke();ctx.setLineDash([]);
        txt(ctx,BONDS[p.bond].mol+' bond '+be+' kJ/mol: shorter λ breaks it',box.L+box.W-6,ax.Y(be)-7,{s:13,c:PAL['s3'],a:'right',w:700});}
      ctx.strokeStyle=serColor(0);ctx.lineWidth=2.5;ctx.beginPath();for(let x=100;x<=1000;x+=5){const y=f(x);x===100?ctx.moveTo(ax.X(x),ax.Y(y)):ctx.lineTo(ax.X(x),ax.Y(y));}ctx.stroke();
      if(nm>=100&&nm<=1000){ctx.fillStyle=serColor(1);ctx.beginPath();ctx.arc(ax.X(nm),ax.Y(f(nm)),7,0,6.29);ctx.fill();}
      ctx.restore();
      legend(ctx,box.L+12,box.T+10,[{label:isE?'E = hc/λ':'ν = c/λ',color:serColor(0)},{label:nm>=100&&nm<=1000?'your light':'your light is off this graph ('+fmtLen(lam(p))+')',color:serColor(1)}]);return;}
    // photoelectric: KEmax vs frequency
    const ax=axes(ctx,box,{xmin:0,xmax:20,ymin:0,ymax:5,xl:'Frequency ν (× 10¹⁴ Hz)',yl:'KEmax of electrons (eV)'});const hev=H/QE*1e14; // eV per 10¹⁴ Hz
    ctx.save();ctx.beginPath();ctx.rect(box.L,box.T,box.W,box.H);ctx.clip();
    const keys=Object.keys(METALS);keys.forEach((k,i)=>{const m=METALS[k],on=p.target==='metal'&&k===p.metal;const f0=m.phi/hev;ctx.strokeStyle=on?serColor(0):PAL['muted'];ctx.globalAlpha=on?1:0.35;ctx.lineWidth=on?2.8:1.5;
      ctx.beginPath();ctx.moveTo(ax.X(0),ax.Y(0));ctx.lineTo(ax.X(f0),ax.Y(0));ctx.lineTo(ax.X(20),ax.Y(hev*20-m.phi));ctx.stroke();});ctx.globalAlpha=1;
    const f=nu(p)/1e14;if(p.target==='metal'&&f<=20){ctx.fillStyle=serColor(1);ctx.beginPath();ctx.arc(ax.X(f),ax.Y(Math.max(0,KEeV(p))),7,0,6.29);ctx.fill();}
    ctx.restore();
    legend(ctx,box.L+12,box.T+10,[{label:p.target==='metal'?METALS[p.metal].n+': slope = h = 4.14 × 10⁻¹⁵ eV·s':'Shine the light on a metal to plot your point',color:serColor(0)},{label:'other metals',color:PAL['muted']}]);},
  infoPanel(sim){const p=sim.p,l=lam(p),hon=atLeast('honors'),ap=atLeast('ap');
    let h='<div class="p-head"><h3>Calculator steps</h3></div>';
    if(!hon){h+='<p>Your light: <b>'+region(l)+'</b>, λ = '+fmtLen(l)+'.</p><p>All light moves at the same speed, so <b>shorter waves pass by more often</b>. Each photon of this light carries '+(700e-9/l>=1?CL.toSig(700e-9/l,3)+' times':CL.toSig(700e-9/l,3)+' of')+' the energy of a red photon.</p><p>Choose <b>Closer look</b> to see the math.</p>';return h;}
    h+='<p><b>1. Convert to meters.</b> λ = '+fmtLen(l)+' = '+sci(l,'m')+'</p>';
    h+='<p><b>2. Frequency.</b> ν = c/λ = (3.00 × 10⁸ m/s) ÷ ('+sci(l,'m')+') = <b>'+sci(nu(p),'Hz')+'</b></p>';
    h+='<p><b>3. Energy of one photon.</b> E = hν = (6.626 × 10⁻³⁴ J·s)('+sci(nu(p),'s⁻¹')+') = <b>'+sci(EJ(p),'J')+'</b></p>';
    h+='<p><b>4. Per mole.</b> '+sci(EJ(p),'J')+' × 6.022 × 10²³ ÷ 1000 = <b>'+sci(Ekj(p),'kJ/mol')+'</b></p>';
    if(p.target==='bond'){const b=BONDS[p.bond];h+='<p><b>5. Compare.</b> The bond needs '+b.BE+' kJ/mol. '+(Ekj(p)>=b.BE?'This light has enough, so one photon breaks one bond.':'This light falls short. No brightness can fix that.')+' Longest wavelength that works: λ = hcN<sub>A</sub>/E = '+fmtLen(HC_KJ/b.BE)+'.</p>';}
    if(ap&&p.target==='metal'){const m=METALS[p.metal],k=KEeV(p);h+='<p><b>5. Photoelectric effect.</b> E = '+EeV(p).toFixed(2)+' eV; φ('+m.n.toLowerCase()+') = '+m.phi.toFixed(2)+' eV. KEmax = E − φ = <b>'+(k>0?k.toFixed(2)+' eV':'below zero, so no electrons')+'</b></p>';
      if(k>0){const KJ=k*QE,pm=Math.sqrt(2*ME*KJ);h+='<p><b>6. de Broglie.</b> p = √(2mKE) = '+sci(pm,'kg·m/s')+'; λ = h/p = <b>'+fmtLen(H/pm)+'</b></p>';}}
    return h;},
  narrate(sim){const p=sim.p,l=lam(p),nm=l*1e9,E=Ekj(p),hon=atLeast('honors');const nm3=fmtLen(l);
    if(p.target==='bond'){const b=BONDS[p.bond];const ok=E>=b.BE;
      if(p.bright<=0)return 'The light is off, so <b>no photons arrive</b> and every '+b.mol+' molecule stays whole.';
      if(ok)return 'Each '+nm3+' photon carries '+CL.toSig(E,3)+' kJ/mol, more than the '+b.BE+' kJ/mol '+(hon?b.l.split(' ')[0]:'')+' bond energy. <b>One photon splits one '+b.mol+' molecule</b> into two atoms, which later join back up.';
      return 'Each '+nm3+' photon carries only '+CL.toSig(E,3)+' kJ/mol, less than the '+b.BE+' kJ/mol the bond needs. Brighter light sends more photons, but <b>no single photon has enough energy</b>, so no bonds break.';}
    if(p.target==='metal'){const m=METALS[p.metal],k=KEeV(p);if(p.bright<=0)return 'The light is off, so no photons reach the '+m.n.toLowerCase()+'.';
      if(k>0)return 'Each photon brings '+EeV(p).toFixed(2)+' eV. Freeing an electron from '+m.n.toLowerCase()+' costs '+m.phi.toFixed(2)+' eV (the work function), so each electron leaves with <b>up to '+k.toFixed(2)+' eV</b> of kinetic energy. Brightness changes how many leave, not how fast.';
      return 'Each photon brings '+EeV(p).toFixed(2)+' eV, but '+m.n.toLowerCase()+' holds its electrons with '+m.phi.toFixed(2)+' eV. <b>No electron escapes</b>, however bright the light, until λ is shorter than '+fmtLen(H*C/(m.phi*QE))+'.';}
    const what=region(l).toLowerCase();
    let s='This is <b>'+(what.startsWith('visible')?shortName(l)+' light':what)+'</b> with a wavelength of '+nm3+'. ';
    if(nm<380)s+='It is too short for your eyes to see, but each photon packs more energy than visible light. ';
    else if(nm>750)s+='It is too long for your eyes to see, and each photon carries less energy than visible light. ';
    s+='Every kind of light travels at the same speed, so <b>shorter waves mean higher frequency and more energy per photon</b>.';
    if(p.ph)s+=' Brightness sets how many photons arrive, not how much energy each one has.';
    return s;},
  tour:[
    {title:'One spectrum, many names',text:{bio:'Radio waves, microwaves, infrared, visible light, ultraviolet, X-rays and gamma rays are all the same thing: light. They differ only in wavelength. The marker shows where your light sits.',honors:'Each region of the bar covers about a factor of ten or more in wavelength. Visible light is a thin slice between 380 nm and 750 nm.'},focus:[20,8,760,84],speed:1,setup(sim){BioLab.setValues(sim,{ll:L(520e-9),target:'none',ph:false,bright:60,pre:'custom'});}},
    {title:'Wavelength',text:'The wavelength λ is the distance from one crest to the next. This red light has longer waves than the green light you just saw. Watch the bracket.',focus:[WX0-6,96,WX1-WX0+12,180],speed:1,setup(sim){BioLab.setValues(sim,{ll:L(650e-9)});}},
    {title:'Same speed, higher frequency',text:{bio:'Now the light is violet, with shorter waves. The crests still move at the same speed, so more of them pass each second. That count is the frequency.',honors:'All light travels at c = 3.00 × 10⁸ m/s. Since c = λν, a shorter λ forces a larger ν. Check the frequency tile.'},focus:[WX0-6,96,WX1-WX0+12,180],speed:1,setup(sim){BioLab.setValues(sim,{ll:L(410e-9)});}},
    {title:'Shorter waves carry more energy',text:{bio:'Each photon of violet light carries almost twice the energy of a red photon. The ultraviolet shown now carries even more, which is why it can burn skin and visible light cannot.',honors:'E = hν, so energy rises with frequency. The bottom line shows the arithmetic for your wavelength.'},focus:[14,282,772,164],speed:1,setup(sim){BioLab.setValues(sim,{ll:L(300e-9)});}},
    {title:'Light comes in photons',text:'Turn on photons and light arrives as separate packets. Brightness sets how many packets arrive each second. The energy in each packet depends only on the wavelength.',focus:[WX0-6,96,WX1-WX0+12,180],speed:0.5,setup(sim){BioLab.setValues(sim,{ll:L(520e-9),ph:true,bright:80});}},
    {title:'Breaking a bond',text:'Shine blue light (450 nm) on chlorine molecules. Each photon has more energy than the Cl–Cl bond, so every photon that hits splits a Cl₂ molecule into two Cl atoms.',focus:[TBX-6,TBY-6,TBW+12,TBH+80],speed:0.5,setup(sim){BioLab.setValues(sim,{target:'bond',bond:'cl2',ll:L(450e-9),bright:70});}},
    {lvl:'honors',title:'Brighter is not stronger',text:'Switch to red light at full brightness. Many more photons arrive, but each carries only 171 kJ/mol, less than the 242 kJ/mol bond. Not one bond breaks.',focus:[TBX-6,TBY-6,TBW+12,TBH+80],speed:0.5,setup(sim){BioLab.setValues(sim,{ll:L(700e-9),bright:100});resetTarget(sim);}},
    {lvl:'ap',title:'The photoelectric effect',text:'Ultraviolet light (300 nm) on sodium. Each photon spends 2.36 eV freeing an electron and the electron keeps the rest, 1.77 eV, as kinetic energy. Einstein: KEmax = hν − φ.',focus:[TBX-6,TBY-6,TBW+12,TBH+80],speed:0.5,setup(sim){BioLab.setValues(sim,{target:'metal',metal:'na',ll:L(300e-9),bright:70});}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{ll:L(520e-9),target:'none',ph:false,bright:60,pre:'custom'});},
  onChallenge(sim,ch,phase){if(ch&&ch.instant&&ch.set&&phase==='done'){BioLab.setValues(sim,ch.set);sim.infoDirty=true;}},
  challenges:[
    {lvl:'bio',q:'You switch the light from red (700 nm) to blue (450 nm). How does the speed of the wave change?',choices:['Blue light travels faster','Red light travels faster','Both travel at the same speed'],correct:2,
     baseline:{ll:L(700e-9),target:'none',ph:false},change:{ll:L(450e-9)},changeText:'Wavelength changed from 700 nm to 450 nm',watch:'fwl',
     explain:{bio:'The crests cross the screen at the same rate before and after. All light travels at 3.00 × 10⁸ m/s. Blue light has shorter waves, so more of them pass each second: its frequency is higher.',honors:'c is the same for every color. c = λν, so ν rose from '+sci(C/700e-9,'Hz')+' to '+sci(C/450e-9,'Hz')+'.'}},
    {lvl:'bio',q:'Red light (700 nm) cannot break the bonds in Cl₂. What happens if you make the red light five times brighter?',choices:['The bonds start breaking','Still no bonds break','A few bonds break slowly'],correct:1,
     baseline:{ll:L(700e-9),target:'bond',bond:'cl2',bright:20},change:{bright:100},changeText:'Brightness raised from 20% to 100%',
     explain:{bio:'The count stays at zero. Each red photon carries '+CL.toSig(ex.E700,3)+' kJ/mol, but the Cl–Cl bond needs 242 kJ/mol. One photon breaks one bond, so more weak photons still break nothing.'}},
    {lvl:'bio',q:'Keep the same brightness but switch from red light to violet light (400 nm). What happens to the Cl₂ molecules?',choices:['They start splitting apart','Nothing; violet light is weaker','They split only if the light is brighter'],correct:0,
     baseline:{ll:L(700e-9),target:'bond',bond:'cl2',bright:60},change:{ll:L(400e-9)},changeText:'Switched to violet light, 400 nm',
     explain:{bio:'Violet photons carry '+CL.toSig(ex.E400,3)+' kJ/mol each, more than the 242 kJ/mol bond, so every photon that hits splits a molecule. The color of light sets the energy of each photon.'}},
    {lvl:'honors',instant:true,set:{ll:L(600e-9),target:'none'},q:'Orange light has λ = 600 nm. What is its frequency?',choices:['5.00 × 10¹⁴ Hz','1.80 × 10¹¹ Hz','2.00 × 10⁻¹⁵ Hz','5.00 × 10⁵ Hz'],correct:0,
     explain:{honors:'ν = c/λ = (3.00 × 10⁸ m/s) ÷ (6.00 × 10⁻⁷ m) = '+sci(ex.nu600,'Hz')+'. The model is now set to 600 nm; check the frequency tile. The most common mistake is forgetting to convert nm to m.'}},
    {lvl:'honors',instant:true,set:{target:'bond',bond:'cl2',ll:L(494e-9)},q:'Breaking one mole of Cl–Cl bonds takes 242 kJ. What is the longest wavelength of light that can break a Cl–Cl bond?',choices:['About 494 nm (blue-green)','About 700 nm (red), if it is bright enough','About 242 nm (ultraviolet)','Any wavelength, if the light is bright enough'],correct:0,
     explain:{honors:'Per photon: E = 242 000 J ÷ 6.022 × 10²³ = 4.02 × 10⁻¹⁹ J. λ = hc/E = '+fmtLen(ex.lmaxCl)+'. The model is set just below that wavelength: the bonds break. Slide a little longer and they stop.'}},
    {lvl:'honors',q:'You double the wavelength from 300 nm to 600 nm. The energy of each photon…',choices:['doubles','halves','stays the same','drops to one quarter'],correct:1,
     baseline:{ll:L(300e-9),target:'none'},change:{ll:L(600e-9)},changeText:'Wavelength doubled to 600 nm',watch:'ewl',
     explain:{honors:'E = hc/λ, so energy is inversely proportional to wavelength. It fell from '+CL.toSig(ex.E300,3)+' to '+CL.toSig(ex.E600,3)+' kJ/mol, exactly half.'}},
    {lvl:'ap',q:'Blue light (450 nm) frees electrons from sodium. What happens to the fastest electrons’ kinetic energy if you dim the light from 100% to 20%?',choices:['It drops to 20% of its value','It stays the same; fewer electrons come out','No electrons come out at all'],correct:1,
     baseline:{target:'metal',metal:'na',ll:L(450e-9),bright:100},change:{bright:20},changeText:'Brightness lowered to 20%',watch:'pe',
     explain:{ap:'KEmax = hν − φ = '+ex.eV450.toFixed(2)+' − 2.36 = '+ex.KE450.toFixed(2)+' eV before and after. Dimmer light means fewer photons per second, so the electron count grows more slowly, but each photon still delivers the same energy.'}},
    {lvl:'ap',instant:true,set:{target:'metal',metal:'na',ll:L(300e-9)},q:'Light of 300 nm hits sodium (φ = 2.36 eV). What is the maximum kinetic energy of the ejected electrons?',choices:['1.77 eV','4.13 eV','2.36 eV','6.49 eV'],correct:0,
     explain:{ap:'E = hc/λ = 1240 eV·nm ÷ 300 nm = '+ex.eV300.toFixed(2)+' eV. KEmax = E − φ = '+ex.eV300.toFixed(2)+' − 2.36 = '+ex.KE300.toFixed(2)+' eV. The model is set to this case; check the kinetic energy tile.'}},
    {lvl:'ap',instant:true,set:{target:'metal',metal:'na',ll:L(300e-9)},q:'Those 1.77 eV electrons also behave like waves. What is their de Broglie wavelength?',choices:['About 0.92 nm','About 300 nm, the same as the light','About 9.2 µm','About 0.0092 nm'],correct:0,
     explain:{ap:'KE = 1.77 eV = 2.84 × 10⁻¹⁹ J. p = √(2mKE) = 7.19 × 10⁻²⁵ kg·m/s, and λ = h/p = '+fmtLen(ex.dB300)+', about the size of a few atoms. That is why electron beams can image atoms.'}}
  ],
  lab:{bio:'<p><b>Question:</b> How does the color of light relate to the energy of its photons?</p><ol><li>Set the wavelength to 700, 650, 600, 550, 500, 450 and 400 nm (use the slider or the real sources).</li><li>Record a trial at each one.</li><li>On the Trials graph, plot Wavelength (x) against Energy (y).</li></ol><p>Which color carries the most energy per photon? Which carries the least? Use your graph to explain why ultraviolet light can damage skin when red light cannot.</p>',
       honors:'<p><b>Question:</b> Which light can break a chemical bond?</p><ol><li>Choose Molecules and a bond (Cl–Cl, Br–Br, I–I, O=O).</li><li>Slide the wavelength until the bonds just start to break. Record that trial.</li><li>Calculate the longest wavelength by hand from the bond energy: λ = hcN<sub>A</sub>/E. Compare with your trial.</li></ol><p>Explain why ozone (O₃) and O₂ in the upper atmosphere absorb UV, but visible light passes through the air.</p>',
       ap:'<p><b>Question:</b> Can you measure Planck’s constant and a work function?</p><ol><li>Shine the light on sodium. Record KEmax at six wavelengths shorter than 520 nm.</li><li>On the Trials graph, plot Frequency (x) against KEmax (y).</li><li>Find the slope (eV per 10¹⁴ Hz) and convert it to J·s. Extend the line to find the threshold frequency.</li></ol><p><b>Claim–evidence–reasoning:</b> Use your graph to argue that light energy comes in photons of E = hν, and calculate the work function of sodium.</p>'},
  terms:[{t:'Wavelength (λ)',d:'The distance from one crest of a wave to the next. Visible light is 380–750 nm.'},{t:'Electromagnetic spectrum',d:'All kinds of light in order of wavelength: gamma, X-ray, ultraviolet, visible, infrared, microwave, radio.'},
    {t:'Photon',d:'A single packet of light energy. Brighter light means more photons, not stronger ones.'},{t:'Frequency (ν)',d:'How many waves pass a point each second, in hertz (Hz = s⁻¹).'},
    {lvl:'honors',t:'Speed of light',d:'c = λν = 3.00 × 10⁸ m/s for all light in a vacuum.'},{lvl:'honors',t:'Planck’s equation',d:'E = hν, with h = 6.626 × 10⁻³⁴ J·s. Combined with c = λν: E = hc/λ.'},{lvl:'honors',t:'Bond energy',d:'The energy needed to break one mole of a bond, in kJ/mol.'},
    {lvl:'ap',t:'Work function (φ)',d:'The minimum energy needed to free an electron from a metal surface.'},{lvl:'ap',t:'Photoelectric effect',d:'Light ejects electrons from a metal only if hν > φ. KEmax = hν − φ.'},{lvl:'ap',t:'de Broglie wavelength',d:'λ = h/(mv). Moving particles such as electrons behave as waves.'}],
  about:'<p>Every number is computed from c = λν and E = hν, with h = 6.626 × 10⁻³⁴ J·s, c = 2.998 × 10⁸ m/s and N<sub>A</sub> = 6.022 × 10²³ mol⁻¹. Region boundaries are the usual approximate ones (visible 380–750 nm, microwave 1 mm–1 m). The wave drawing uses a compressed scale so every region fits on screen; real visible light waves are about 0.5 µm long.</p><p>Bond energies are average bond enthalpies (Cl–Cl 242, Br–Br 193, I–I 151, H–H 436, C–H 413, O=O 498, N≡N 945 kJ/mol). The model assumes the molecule absorbs any photon with enough energy; real molecules absorb only certain wavelengths, so actual photolysis thresholds differ somewhat. Work functions are polycrystalline values from the CRC Handbook (Cs 2.14, K 2.29, Na 2.36, Zn 4.33, Cu 4.70, Pt 5.65 eV). The de Broglie wavelength uses the nonrelativistic momentum p = √(2mKE), which is accurate for these slow electrons.</p>',
  initVis(sim){},
  draw(sim,ctx,vdt,k,t){const p=sim.p,st=sim.st,hon=atLeast('honors'),ap=atLeast('ap');const l=lam(p),g=p.ll,nm=l*1e9;
    ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
    // spectrum bar
    REG.forEach((r,i)=>{const a=bx(Math.max(r.lo,-12)),b=bx(Math.min(r.hi,1));ctx.fillStyle=i%2?PAL['card2']:PAL['cv-bg2'];ctx.fillRect(a,BY,b-a,BH);});
    for(let x=380;x<750;x+=2){const a=bx(L(x*1e-9)),b=bx(L((x+2)*1e-9));ctx.fillStyle=nmRGB(x+1);ctx.fillRect(a,BY,b-a+0.6,BH);}
    ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.strokeRect(BX0,BY,BX1-BX0,BH);
    ctx.beginPath();REG.forEach(r=>{if(r.lo>-12&&r.n!=='Infrared'&&r.n!=='Visible'){ctx.moveTo(bx(r.lo),BY);ctx.lineTo(bx(r.lo),BY+BH);}});ctx.stroke();
    const ly=BY+BH+4+12*k;ctx.font='700 '+(12*k)+'px '+FONT;const lab=REG.map(r=>{const a=Math.max(r.lo,-12),b=Math.min(r.hi,1),w=ctx.measureText(r.n).width;return {n:r.n,x:bx((a+b)/2),w};});
    const vi=3;for(let i=vi-1;i>=0;i--){const lim=lab[i+1].x-lab[i+1].w/2-6;if(lab[i].x+lab[i].w/2>lim)lab[i].x=lim-lab[i].w/2;}
    for(let i=vi+1;i<lab.length;i++){const lim=lab[i-1].x+lab[i-1].w/2+6;if(lab[i].x-lab[i].w/2<lim)lab[i].x=lim+lab[i].w/2;}
    lab.forEach(o=>txt(ctx,o.n,o.x,ly,{s:12*k,w:700,a:'center',c:o.n==='Visible'?PAL['cv-ink']:PAL['cv-soft']}));
    const mx=bx(g);ctx.fillStyle=PAL['cv-ink'];ctx.fillRect(mx-2,BY-6,4,BH+12);ctx.beginPath();ctx.moveTo(mx-8,BY-12);ctx.lineTo(mx+8,BY-12);ctx.lineTo(mx,BY-3);ctx.closePath();ctx.fill();
    // wave
    const pl=pxL(p),A=14+0.40*p.bright,col=waveColor(p),phot=photonsOn(p),xEnd=p.target==='none'?WX1:WX1;
    ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.setLineDash([4,5]);ctx.beginPath();ctx.moveTo(WX0,WY);ctx.lineTo(xEnd,WY);ctx.stroke();ctx.setLineDash([]);
    const off=st.ph*VS;const wy=x=>WY-A*Math.sin(2*Math.PI*(x-off-WX0)/pl);
    if(p.bright>0){ctx.save();ctx.globalAlpha=phot?0.3:1;ctx.lineJoin='round';
      [[PAL['cv-ink'],6.5,0.25],[col,3.5,1]].forEach(([c,w,a])=>{ctx.globalAlpha=(phot?0.3:1)*a;ctx.strokeStyle=c;ctx.lineWidth=w;ctx.beginPath();for(let x=WX0;x<=xEnd;x+=2){const y=wy(x);x===WX0?ctx.moveTo(x,y):ctx.lineTo(x,y);}ctx.stroke();});ctx.restore();}
    // wavelength bracket (fixed position; measures one wavelength of the drawing)
    const bxa=WX0+14,bxb=Math.min(bxa+pl,WX1-20),byk=WY-A-16;ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=1.8;ctx.beginPath();ctx.moveTo(bxa,byk+7);ctx.lineTo(bxa,byk);ctx.lineTo(bxb,byk);ctx.lineTo(bxb,byk+7);ctx.stroke();
    pill(ctx,'λ = '+fmtLen(l),Math.max(bxa+60*k,(bxa+bxb)/2),byk-12*k,PAL['card'],PAL['cv-ink'],13*k);
    if(p.bright<=0)txt(ctx,'Light off: brightness is 0%',(WX0+WX1)/2,WY+6,{s:15*k,w:700,a:'center',c:PAL['cv-soft']});
    // photons
    if(phot){st.pk.forEach(pk=>{const y0=pkY(pk),len=Math.min(3*pl,140),w=Math.max(len,24);ctx.save();ctx.lineWidth=3.2;ctx.strokeStyle=col;ctx.beginPath();
        for(let s=0;s<=w;s+=2){const env=Math.sin(Math.PI*s/w),x=pk.x-w+s,y=y0-env*12*Math.sin(2*Math.PI*s/Math.max(6,Math.min(pl,w/1.5)));s?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();
        ctx.fillStyle=col;ctx.beginPath();ctx.arc(pk.x,y0,4,0,6.29);ctx.fill();ctx.restore();});}
    // right panel
    rr(ctx,TBX,TBY,TBW,TBH,12);ctx.fillStyle=PAL['card'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
    const E=Ekj(p);let resY=TBY+TBH+24*k/1.2;
    if(p.target==='none'){const r=700e-9/l;txt(ctx,'One photon carries',TBX+TBW/2,TBY+18*k,{s:13*k,w:700,a:'center',c:PAL['cv-soft']});
      const rs=r>=0.01&&r<1000?CL.toSig(r,3):sci(r,'',2);txt(ctx,rs+' ×',TBX+TBW/2,TBY+TBH/2+6*k,{s:(rs.length>7?18:24)*k,w:800,a:'center'});
      txt(ctx,'the energy of a',TBX+TBW/2,TBY+TBH-30*k,{s:13*k,a:'center',c:PAL['cv-soft']});txt(ctx,'red (700 nm) photon',TBX+TBW/2,TBY+TBH-11*k,{s:13*k,a:'center',c:PAL['cv-soft']});}
    else if(p.target==='bond'){const b=BONDS[p.bond];txt(ctx,b.mol+' molecules',TBX+12,TBY+16*k,{s:13*k,w:700});txt(ctx,'bond: '+b.BE+' kJ/mol',TBX+12,TBY+32*k,{s:12*k,c:PAL['cv-soft']});
      st.mol.forEach(m=>{const sep=m.brk>0?(m.brk>2.2?(2.6-m.brk)/0.4:m.brk<0.4?m.brk/0.4:1):0;const d=(b.a==='H'&&b.b==='H')?8:13;const ra=b.a==='H'?9:b.a==='I'||b.a==='Br'?15:13,rb=b.b==='H'?9:b.b==='I'||b.b==='Br'?15:13;
        const dx=d+sep*16,jig=RM?0:Math.sin(t*9+m.x)*0.8;
        if(sep<0.3){ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=2;for(let o=0;o<b.ord;o++){const yo=(o-(b.ord-1)/2)*4;ctx.beginPath();ctx.moveTo(m.x-dx,m.y+yo);ctx.lineTo(m.x+dx,m.y+yo);ctx.stroke();}}
        CL.drawAtom(ctx,m.x-dx+jig,m.y,ra,b.a,{s:11*k});CL.drawAtom(ctx,m.x+dx-jig,m.y,rb,b.b,{s:11*k});});
      st.flash.forEach(f=>{ctx.strokeStyle=PAL['cv-e'];ctx.lineWidth=3;ctx.globalAlpha=clamp(f.t/0.35,0,1);ctx.beginPath();ctx.arc(f.x,f.y,30-f.t*40,0,6.29);ctx.stroke();ctx.globalAlpha=1;});
      const ok=E>=b.BE;pill(ctx,ok?'Bonds break':'Too weak',TBX+TBW/2,resY,ok?'#1b7339':'#b3261e','#fff',13*k);
      if(hon)txt(ctx,'Breaks if λ ≤ '+fmtLen(HC_KJ/b.BE),TBX+TBW/2,resY+26*k,{s:12*k,a:'center',c:PAL['cv-soft']});}
    else{const m=METALS[p.metal],kk=KEeV(p);txt(ctx,m.n+' metal',TBX+12,TBY+16*k,{s:13*k,w:700});txt(ctx,'φ = '+m.phi.toFixed(2)+' eV',TBX+12,TBY+32*k,{s:12*k,c:PAL['cv-soft']});
      const pg=ctx.createLinearGradient(PLATE,0,PLATE+30,0);pg.addColorStop(0,'#9aa3ad');pg.addColorStop(1,'#59616b');ctx.fillStyle=pg;ctx.fillRect(PLATE,TBY+38*k,34,TBH-38*k-10);
      st.el.forEach(e=>{ctx.fillStyle=PAL['cv-e'];ctx.strokeStyle=PAL['cv-estroke'];ctx.lineWidth=1.5;ctx.globalAlpha=clamp(2.5-e.t,0,1);ctx.beginPath();ctx.arc(e.x,e.y,5.5,0,6.29);ctx.fill();ctx.stroke();ctx.globalAlpha=1;});
      st.flash.forEach(f=>{ctx.fillStyle=PAL['s4'];ctx.globalAlpha=clamp(f.t/0.2,0,1);ctx.beginPath();ctx.arc(f.x,f.y,6,0,6.29);ctx.fill();ctx.globalAlpha=1;});
      pill(ctx,kk>0?'e⁻ escape':'No e⁻ escape',TBX+TBW/2,resY,kk>0?'#1b7339':'#b3261e','#fff',13*k);
      txt(ctx,kk>0?'KEmax = '+kk.toFixed(2)+' eV':'Needs λ < '+fmtLen(H*C/(m.phi*QE)),TBX+TBW/2,resY+26*k,{s:12*k,a:'center',c:PAL['cv-soft']});}
    // visible strip, zoomed in
    const SX0=40,SX1=520,SY=300,SH=22,sx=n=>SX0+(n-380)/(750-380)*(SX1-SX0);
    txt(ctx,'Visible light, zoomed in',SX0,SY-7,{s:12*k,w:700,c:PAL['cv-soft']});
    for(let n=380;n<750;n+=2){ctx.fillStyle=nmRGB(n+1);ctx.fillRect(sx(n),SY,sx(n+2)-sx(n)+0.6,SH);}ctx.strokeStyle=PAL['line'];ctx.strokeRect(SX0,SY,SX1-SX0,SH);
    [400,500,600,700].forEach(n=>{ctx.strokeStyle=PAL['cv-soft'];ctx.beginPath();ctx.moveTo(sx(n),SY+SH);ctx.lineTo(sx(n),SY+SH+5);ctx.stroke();txt(ctx,n+(n===700?' nm':''),sx(n),SY+SH+6+12*k,{s:12*k,a:'center',c:PAL['cv-soft']});});
    if(nm>=380&&nm<=750){const x=sx(nm);ctx.fillStyle=PAL['cv-ink'];ctx.fillRect(x-2,SY-5,4,SH+10);}
    else pill(ctx,nm<380?'◀ your light is shorter (UV side)':'your light is longer (IR side) ▶',(SX0+SX1)/2,SY+SH/2,PAL['card'],PAL['cv-ink'],12*k);
    // equations
    const EY1=SY+SH+30*k+16;
    const sm=k>1.15;
    if(!hon){txt(ctx,sm?'Shorter λ → more energy per photon':'Shorter λ → higher frequency → more energy per photon',20,EY1+8*k,{s:14*k,w:700});}
    else{txt(ctx,'ν = c/λ = '+(sm?'':'(3.00 × 10⁸ m/s) ÷ ('+sci(l,'m')+') = ')+sci(nu(p),'Hz'),20,EY1,{s:13*k,w:700});
      txt(ctx,'E = hν = '+sci(EJ(p),'J')+(sm?'':' per photon')+' = '+sci(E,'kJ/mol'),20,EY1+22*k,{s:13*k,w:600,c:PAL['cv-soft']});}
  },
  thumbSetup(sim){sim.p.ph=true;sim.p.target='bond';sim.p.ll=L(430e-9);sim.p.bright=80;},
  thumbFrames:40
};
SIM.onLevel=sync;
BioLab.register(SIM);
})();
