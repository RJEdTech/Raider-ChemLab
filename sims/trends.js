(function(){
'use strict';
const {clamp,lerp,rr,txt,pill,atLeast,PAL,FONT,RM,axes,legend}=BioLab.h;
const CL=ChemLab;
/* Periodic trends: heat maps of radius, ionization energy, electronegativity and metallic character, the "why" inside the atom
   (protons, shielding core electrons, valence electrons, Zeff and Coulomb pull), ion sizes, and successive ionization energies. */
const C=42.6,X0=26,Y0=30,SC=0.68;                      // heat-map cell, atom drawing scale (px per pm)
const el=x=>CL.el(x);
const MAXZ=56;
const isMain=e=>e.group<=2||e.group>=13;
// Shannon ionic radii (pm, 6-coordinate; N³⁻ and P³⁻ are common textbook values)
const IONR={'Li+':76,'Na+':102,'K+':138,'Rb+':152,'Cs+':167,'Mg2+':72,'Ca2+':100,'Al3+':53.5,'N3-':146,'O2-':140,'F-':133,'P3-':212,'S2-':184,'Cl-':181,'Br-':196,'I-':220};
const SERIES={
  iso10:{l:'10 electrons: N³⁻ to Al³⁺',items:[['N',-3],['O',-2],['F',-1],['Na',1],['Mg',2],['Al',3]]},
  iso18:{l:'18 electrons: P³⁻ to Ca²⁺',items:[['P',-3],['S',-2],['Cl',-1],['K',1],['Ca',2]]},
  pairs:{l:'Atom vs its ion',items:[['Na',0],['Na',1],['Mg',0],['Mg',2],['Cl',0],['Cl',-1],['O',0],['O',-2]]},
  g1:{l:'Group 1 ions, down the group',items:[['Li',1],['Na',1],['K',1],['Rb',1],['Cs',1]]},
  g17:{l:'Group 17 ions, down the group',items:[['F',-1],['Cl',-1],['Br',-1],['I',-1]]}};
const ionKey=(s,q)=>s+(q===0?'':(Math.abs(q)>1?Math.abs(q):'')+(q>0?'+':'-'));
function ionR(s,q){return q===0?el(s).radius:IONR[ionKey(s,q)];}
// successive ionization energies (kJ/mol), NIST
const SIE={Na:[496,4562,6910,9543,13354,16613],Mg:[738,1451,7733,10543,13630,18020],Al:[578,1817,2745,11577,14842,18379],Si:[787,1577,3232,4356,16091,19805]};
const PROPS={radius:{l:'Atomic radius',p:'size of the atom',u:'pm',f:e=>e.radius,d:0},ie:{l:'First ionization energy',p:'energy to pull off an electron',u:'kJ/mol',f:e=>e.ie1,d:0},
  en:{l:'Electronegativity',p:'pull on shared electrons',u:'',f:e=>e.en,d:2},metal:{l:'Metallic character',p:'how easily it gives up an electron',u:'',f:e=>e.ie1?Math.round(1000*(2400-e.ie1)/2000)/10:null,d:1}};
const TREND={radius:['smaller','bigger'],ie:['higher','lower'],en:['higher','lower'],metal:['less metallic','more metallic']};
/* ---------- atom model ---------- */
function shells(Z){const out=[];CL.config(Z).forEach(o=>{out[o.n]=(out[o.n]||0)+o.e;});return out;}
function nmax(Z){return shells(Z).length-1;}
function coreE(Z){const sh=shells(Z),n=sh.length-1;let c=0;for(let i=1;i<n;i++)c+=sh[i]||0;return c;}
function valE(Z){const sh=shells(Z);return sh[sh.length-1];}
const zeff=Z=>Z-coreE(Z);
function slater(Z){const cfg=CL.config(Z),n=nmax(Z);let S=0;const same=cfg.filter(o=>o.n===n&&o.l<=1).reduce((a,o)=>a+o.e,0);
  S+=(same-1)*(n===1?0.30:0.35);cfg.forEach(o=>{if(o.n===n&&o.l<=1)return;if(o.n===n)S+=o.e*0.35;else if(o.n===n-1)S+=o.e*0.85;else S+=o.e*1.0;});return Z-S;}
const pull=Z=>{const e=el(Z);return e.radius?zeff(Z)/Math.pow(e.radius/100,2):NaN;};
function across(e,d){let z=e.Z;for(;;){z+=d;if(z<1||z>MAXZ)return null;const o=el(z);if(o.period!==e.period)return null;if(isMain(o)||!isMain(e))return o;}}
function vert(e,d){if(e.group<1)return null;const o=CL.elements.find(x=>x.group===e.group&&x.period===e.period+d&&x.Z<=MAXZ&&!(x.cat==='lanthanide'||x.cat==='actinide'));return o||null;}
function compareEl(sim){const e=el(sim.p.el);if(sim.p.cmp==='across')return across(e,1);if(sim.p.cmp==='down')return vert(e,1);return null;}
/* ---------- color scale ---------- */
const STOPS=['#fde725','#7ad151','#22a884','#2a788e','#414487','#440154'];
function ramp(t){t=clamp(t,0,1)*(STOPS.length-1);const i=Math.min(STOPS.length-2,Math.floor(t)),f=t-i;const p=h=>[1,3,5].map(j=>parseInt(h.slice(j,j+2),16));const a=p(STOPS[i]),b=p(STOPS[i+1]);return '#'+a.map((v,j)=>Math.round(lerp(v,b[j],f)).toString(16).padStart(2,'0')).join('');}
function range(prop){const vals=CL.elements.filter(e=>e.period<=7&&!(e.cat==='lanthanide'||e.cat==='actinide')).map(PROPS[prop].f).filter(v=>v!==null&&v!==undefined);return [Math.min(...vals),Math.max(...vals)];}
const RANGES={};Object.keys(PROPS).forEach(k=>RANGES[k]=range(k));
function cellXY(e){return {x:X0+(e.group-1)*C,y:Y0+(e.period-1)*C};}
function fitT(ctx,s,maxW,size,min,w){let z=size;ctx.font=(w||400)+' '+z+'px '+FONT;while(ctx.measureText(s).width>maxW&&z>min){z-=0.5;ctx.font=(w||400)+' '+z+'px '+FONT;}return z;}
function arrow(ctx,x1,y1,x2,y2,c,w){const a=Math.atan2(y2-y1,x2-x1),h=Math.max(9,w*2.8);ctx.strokeStyle=c;ctx.fillStyle=c;ctx.lineWidth=w;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2-Math.cos(a)*h*0.8,y2-Math.sin(a)*h*0.8);ctx.stroke();
  ctx.beginPath();ctx.moveTo(x2,y2);ctx.lineTo(x2-Math.cos(a-0.45)*h,y2-Math.sin(a-0.45)*h);ctx.lineTo(x2-Math.cos(a+0.45)*h,y2-Math.sin(a+0.45)*h);ctx.closePath();ctx.fill();ctx.lineCap='butt';}

function syncMode(sim){if(!sim.ui||!sim.ui.sec)return;const d=sim.def,v=sim.p.view;
  d.controls.forEach(c=>{if(!c.views)return;const cid=d.id+'-'+c.id,e=document.getElementById(cid)||document.getElementById(cid+'-l');if(!e)return;const w=e.closest('.ctl');if(w)w.hidden=!atLeast(c.lvl)||!c.views.includes(v);});
  const btns=[...sim.ui.sec.querySelectorAll('.actions button')];d.actions.forEach((a,i)=>{if(btns[i])btns[i].hidden=!atLeast(a.lvl)||!a.views.includes(v);});}
function walk(sim,f){const o=f(el(sim.p.el));if(o)BioLab.setValues(sim,{el:o.sym});else sim.st.bump=1.2;}

const SIM={
  id:'trends',hash:'trends',apUnit:4,order:2,tab:'Periodic trends',kind:'Simulation',
  card:'Walk across a period and down a group, see how protons and shielding set atom size, ionization energy and electronegativity, and explain why.',
  title:'Periodic trends: size, ionization energy and electronegativity',
  lede:{bio:'Atoms get smaller across a period and bigger down a group. Look inside the atom to see why: the pull of the nucleus on the outer electrons.',
        honors:'Inner electrons shield the outer ones, so the outer electrons feel an effective nuclear charge, Zeff. Compare atoms and ions and explain each trend with Zeff and distance.',
        ap:'Use Coulomb’s law (F ∝ q₁q₂/r²) and Slater’s Zeff to explain the trends, their exceptions, and the jumps in successive ionization energies.'},
  scale:'Atoms drawn to scale: covalent radii from 31 pm (H) to 244 pm (Cs). 100 pm is one ten-billionth of a meter.',
  timeless:true,animated:true,chChange:1,chReveal:3.2,
  prereq:['ptable'],next:['econfig','pes','ionic','polarity'],
  controls:[
    {id:'view',label:'View',type:'seg',def:'map',lvl:'bio',noTrial:true,options:[{v:'map',l:'Heat map'},{v:'atom',l:'Inside the atom'},{v:'ions',l:'Ion sizes',lvl:'honors'},{v:'sie',l:'Successive ionization',lvl:'ap'}],onChange:syncMode},
    {id:'prop',label:'Property',type:'select',def:'radius',lvl:'bio',noTrial:true,views:['map'],options:Object.keys(PROPS).map(k=>({v:k,l:PROPS[k].l+' ('+PROPS[k].p+')'}))},
    {id:'el',label:'Element',type:'select',def:'Na',lvl:'bio',views:['map','atom'],options:CL.elements.filter(e=>e.Z<=MAXZ).map(e=>({v:e.sym,l:e.Z+' '+e.sym+' · '+e.name})),help:'Or click a square on the heat map.'},
    {id:'cmp',label:'Compare with',type:'seg',def:'across',lvl:'bio',noTrial:true,views:['atom'],options:[{v:'across',l:'Next across'},{v:'down',l:'Next down'},{v:'none',l:'Nothing'}]},
    {id:'series',label:'Ions to compare',type:'select',def:'iso10',lvl:'honors',noTrial:true,views:['ions'],options:Object.keys(SERIES).map(k=>({v:k,l:SERIES[k].l}))},
    {id:'sie',label:'Element',type:'seg',def:'Mg',lvl:'ap',noTrial:true,views:['sie'],options:Object.keys(SIE).map(k=>({v:k,l:k})),onChange:sim=>{sim.st.removed=0;}}
  ],
  actions:[
    {id:'left',label:'← Across',views:['map','atom'],run(sim){walk(sim,e=>across(e,-1));}},
    {id:'right',label:'Across →',primary:true,views:['map','atom'],run(sim){walk(sim,e=>across(e,1));}},
    {id:'up',label:'↑ Up the group',views:['map','atom'],run(sim){walk(sim,e=>vert(e,-1));}},
    {id:'down',label:'Down the group ↓',views:['map','atom'],run(sim){walk(sim,e=>vert(e,1));}},
    {id:'remove',label:'Remove the next electron',primary:true,lvl:'ap',views:['sie'],run(sim){const n=SIE[sim.p.sie].length;sim.st.removed=sim.st.removed>=n?0:sim.st.removed+1;sim.st.fly=1;}},
    {id:'restore',label:'Put them all back',lvl:'ap',views:['sie'],run(sim){sim.st.removed=0;}}
  ],
  init(){return {removed:0,fly:0,bump:0};},
  step(sim,dt){const st=sim.st;st.fly=Math.max(0,st.fly-dt*0.9);st.bump=Math.max(0,st.bump-dt);},
  initVis(sim){syncMode(sim);},onLevel(sim){syncMode(sim);},
  onClick(sim,x,y){if(sim.p.view!=='map')return;const e=CL.elements.find(o=>{if(o.Z>MAXZ&&o.period>5)return false;if(o.cat==='lanthanide'||o.cat==='actinide')return false;const p=cellXY(o);return x>=p.x&&x<p.x+C&&y>=p.y&&y<p.y+C;});
    if(e&&e.Z<=MAXZ)BioLab.setValues(sim,{el:e.sym});},
  metrics:[
    {id:'name',label:'Element',unit:'',lvl:'bio',text:true,noTrial:true,get:s=>{const e=el(s.p.el);return e.name+' ('+e.sym+')';}},
    {id:'Z',label:'Protons (Z)',unit:'',lvl:'bio',min:0,max:56,d:0,get:s=>el(s.p.el).Z},
    {id:'r',label:'Atomic radius',unit:'pm',lvl:'bio',min:0,max:250,d:0,get:s=>{const v=el(s.p.el).radius;return v===null?NaN:v;}},
    {id:'ie',label:'1st ionization energy',unit:'kJ/mol',lvl:'bio',min:0,max:2400,d:0,get:s=>{const v=el(s.p.el).ie1;return v===null?NaN:v;}},
    {id:'en',label:'Electronegativity',unit:'',lvl:'bio',min:0,max:4,d:2,get:s=>{const v=el(s.p.el).en;return v===null?NaN:v;}},
    {id:'core',label:'Inner (core) electrons',unit:'',lvl:'honors',min:0,max:54,d:0,get:s=>coreE(el(s.p.el).Z)},
    {id:'zeff',label:'Zeff ≈ Z − core',unit:'',lvl:'honors',min:0,max:8,d:0,get:s=>zeff(el(s.p.el).Z)},
    {id:'slater',label:'Zeff (Slater’s rules)',unit:'',lvl:'ap',min:0,max:8,d:2,get:s=>slater(el(s.p.el).Z)},
    {id:'pull',label:'Pull ∝ Zeff/r²',unit:'per (100 pm)²',lvl:'ap',min:0,max:null,d:2,get:s=>pull(el(s.p.el).Z)}
  ],
  graphs:[{id:'pz',label:'Property vs atomic number',lvl:'bio',custom:true},{id:'per',label:'Across this period and down this group',lvl:'honors',custom:true}],defaultGraph:'pz',
  plot(sim,ctx,box,id){const prop=sim.p.view==='map'?sim.p.prop:'radius',P=PROPS[prop],e=el(sim.p.el);
    if(id==='pz'){const xs=CL.elements.filter(x=>x.Z<=56),vals=xs.map(P.f);const ymax=Math.max(...vals.filter(v=>v!==null))*1.1;
      const ax=axes(ctx,box,{xmin:0,xmax:57,ymin:0,ymax,xl:'Atomic number Z',yl:P.l+(P.u?' ('+P.u+')':'')});
      ctx.save();ctx.beginPath();ctx.rect(box.L,box.T,box.W,box.H);ctx.clip();ctx.strokeStyle=PAL['g-line'];ctx.lineWidth=2;ctx.beginPath();let on=false;
      xs.forEach((x,i)=>{const v=vals[i];if(v===null){on=false;return;}on?ctx.lineTo(ax.X(x.Z),ax.Y(v)):ctx.moveTo(ax.X(x.Z),ax.Y(v));on=true;});ctx.stroke();
      xs.forEach((x,i)=>{const v=vals[i];if(v===null||!(x.group===1||x.group===18))return;ctx.fillStyle=x.group===1?PAL['s1']:PAL['s5'];ctx.beginPath();ctx.arc(ax.X(x.Z),ax.Y(v),4,0,6.29);ctx.fill();});
      const v=P.f(e);if(v!==null){ctx.strokeStyle=PAL['s4'];ctx.lineWidth=3;ctx.beginPath();ctx.arc(ax.X(e.Z),ax.Y(v),8,0,6.29);ctx.stroke();}ctx.restore();
      legend(ctx,box.L+10,box.T+10,[{label:'Group 1',color:PAL['s1']},{label:'Group 18',color:PAL['s5']},{label:e.sym,color:PAL['s4']}]);return;}
    const row=CL.elements.filter(x=>x.period===e.period&&isMain(x)&&x.Z<=MAXZ),col=CL.elements.filter(x=>x.group===e.group&&x.Z<=MAXZ&&!(x.cat==='lanthanide'));
    const half=box.W/2-10;const sub=(list,L,title)=>{const vals=list.map(P.f);const ymax=Math.max(...[...RANGES[prop]].concat(vals.filter(v=>v!==null)))*1.05;
      const b2={L,T:box.T+16,W:half-40,H:box.H-16,cw:box.cw,ch:box.ch};const ax=axes(ctx,b2,{xmin:0,xmax:list.length,ymin:0,ymax,xcats:list.map(x=>x.sym),yl:L===box.L?P.l+(P.u?' ('+P.u+')':''):''});
      BioLab.h.bars(ctx,ax,vals.map(v=>v===null?NaN:v),{colors:list.map(x=>x===e?PAL['s4']:PAL['s2']),d:P.d});txt(ctx,title,L+(half-40)/2,box.T+6,{s:13,w:700,c:PAL['muted'],a:'center'});};
    sub(row,box.L,'Across period '+e.period);sub(col,box.L+half+30,'Down group '+e.group);},
  challengeTitle:'Predict, then test',
  challenges(){const Na=el('Na'),Cl=el('Cl'),Li=el('Li'),K=el('K');const ens=['O','F','Cl','N'];const top=ens.reduce((a,b)=>el(a).en>el(b).en?a:b);
    const iso=['O2-','F-','Na+','Mg2+'];const big=iso.reduce((a,b)=>IONR[a]>IONR[b]?a:b);const zc=zeff(17),zo=[17,7,1,10];
    const mg=SIE.Mg;let jump=0,best=0;for(let i=1;i<mg.length;i++){const r=mg[i]/mg[i-1];if(r>best){best=r;jump=i;}}
    return [
      {lvl:'bio',q:'Walk across period 3 from sodium to chlorine. Chlorine has 6 more electrons. Compared with sodium, the chlorine atom is…',choices:['bigger','smaller','about the same size'],correct:Cl.radius<Na.radius?1:0,
       baseline:{view:'atom',el:'Na',cmp:'none'},change:{el:'Cl'},changeText:'Switched from Na to Cl',explain:{bio:'Chlorine is smaller: 102 pm vs 166 pm. Its extra electrons go into the same third shell, but it also has 6 more protons pulling every electron closer.',honors:'Same shell, 6 more protons, same 10 core electrons: Zeff rises from +1 to +7, so the outer electrons are pulled in. 166 pm → 102 pm.'}},
      {lvl:'bio',q:'Go down group 1 from lithium to potassium. The energy needed to remove an outer electron…',choices:['goes up','goes down','stays the same'],correct:K.ie1<Li.ie1?1:0,
       baseline:{view:'map',prop:'ie',el:'Li'},change:{el:'K'},changeText:'Moved from Li down to K',explain:{bio:'It drops from 520 to 419 kJ/mol. Potassium’s outer electron is two shells farther from the nucleus, so it is held more loosely, which is why potassium reacts more violently with water.'}},
      {lvl:'bio',instant:true,q:'Which of these atoms pulls hardest on shared electrons (highest electronegativity)?',choices:ens.map(s=>el(s).name),correct:ens.indexOf(top),set:{view:'map',prop:'en',el:top},
       explain:'Fluorine, at 3.98, is the most electronegative element. It is small and its outer electrons feel a strong pull, so it pulls bonding electrons toward itself. The map now shows electronegativity: it rises toward the top right.'},
      {lvl:'honors',instant:true,q:'A sodium atom loses one electron to become Na⁺. The ion is…',choices:['smaller than the atom','larger than the atom','the same size'],correct:IONR['Na+']<Na.radius?0:1,set:{view:'ions',series:'pairs'},
       explain:'Na⁺ (102 pm) is much smaller than Na (166 pm). Losing its only 3s electron empties the third shell, and the same 11 protons now pull on just 10 electrons. Anions are the opposite: Cl⁻ is bigger than Cl.'},
      {lvl:'honors',instant:true,q:'O²⁻, F⁻, Na⁺ and Mg²⁺ all have 10 electrons. Which is largest?',choices:['O²⁻','F⁻','Na⁺','Mg²⁺'],correct:iso.indexOf(big),set:{view:'ions',series:'iso10'},
       explain:'In an isoelectronic series the electron count is fixed, so the ion with the <b>fewest protons</b> pulls least and is largest: O²⁻ (8 protons, 140 pm) > F⁻ > Na⁺ > Mg²⁺ (12 protons, 72 pm).'},
      {lvl:'honors',instant:true,q:'Chlorine has 17 protons and electrons in shells of 2, 8 and 7. About how much positive charge do its outer electrons feel (Zeff ≈ Z − core)?',choices:zo.map(v=>'+'+v),correct:zo.indexOf(zc),set:{view:'atom',el:'Cl',cmp:'none'},
       explain:'Zeff ≈ 17 − 10 = <b>+7</b>. The 10 core electrons (2 + 8) shield the outer electrons from 10 of the 17 protons. Sodium’s outer electron feels only 11 − 10 = +1, which is why sodium is so much bigger.'},
      {lvl:'ap',instant:true,q:'Magnesium’s successive ionization energies: between which two is the big jump?',choices:['IE₁ → IE₂','IE₂ → IE₃','IE₃ → IE₄'],correct:jump-1,set:{view:'sie',sie:'Mg'},
       explain:'IE₂ = 1451 and IE₃ = 7733 kJ/mol, a jump of about 5×. Mg has 2 valence electrons; the third electron must come from the 2p core, which is closer to the nucleus and barely shielded. That is why Mg forms Mg²⁺ and never Mg³⁺.'},
      {lvl:'ap',instant:true,q:'Nitrogen is left of oxygen in period 2. Which has the higher first ionization energy?',choices:['Nitrogen','Oxygen','They are equal'],correct:el('N').ie1>el('O').ie1?0:1,set:{view:'map',prop:'ie',el:'O'},
       explain:'Nitrogen (1402 kJ/mol) beats oxygen (1314). Oxygen’s fourth 2p electron must pair up in an orbital that already holds one, and the repulsion between the paired electrons makes it easier to remove. This is an exception to the across-a-period trend.'},
      {lvl:'ap',instant:true,q:'Which has the higher first ionization energy, magnesium or aluminum?',choices:['Magnesium','Aluminum','They are equal'],correct:el('Mg').ie1>el('Al').ie1?0:1,set:{view:'map',prop:'ie',el:'Al'},
       explain:'Magnesium (738) beats aluminum (578). Aluminum’s outer electron is in 3p, which is higher in energy and partly shielded by the 3s pair, so it is easier to remove even though Al has one more proton.'}
    ];},
  onChallenge(sim,ch,phase){if(ch&&phase==='done'&&ch.set){BioLab.setValues(sim,ch.set);syncMode(sim);}},
  narrate(sim){const p=sim.p,e=el(p.el),hon=atLeast('honors'),ap=atLeast('ap');
    if(p.view==='ions'){const S=SERIES[p.series];
      if(p.series==='pairs')return '<b>Cations are smaller than their atoms, and anions are bigger.</b> Losing electrons can empty a whole shell, and the protons now hold fewer electrons; gaining electrons adds repulsion that spreads the cloud out.';
      if(p.series==='iso10'||p.series==='iso18')return '<b>Same number of electrons, more protons each step</b>, so each ion pulls its electron cloud in tighter. The ion with the fewest protons is the biggest.';
      return '<b>Down a group, each ion has one more shell</b>, so the ions get bigger even though the charge stays the same.';}
    if(p.view==='sie'){const s=p.sie,v=valE(el(s).Z),n=sim.st.removed,ie=SIE[s];
      if(!n)return `${el(s).name} has <b>${v} valence electron${v>1?'s':''}</b>. Press <b>Remove the next electron</b>. Each one costs more, because the ion left behind is more positive.`;
      return n<=v?`Removed ${n}: it took ${ie[n-1].toLocaleString()} kJ/mol to remove electron ${n}. ${n<v?'Still a valence electron, so the cost rises gently.':'That was the last valence electron. The next one comes from the core.'}`:`<b>Electron ${n} came from the core</b> and cost ${ie[n-1].toLocaleString()} kJ/mol, about ${(ie[v]/ie[v-1]).toFixed(1)}× more than the last valence electron. Core electrons are closer and barely shielded.`;}
    if(p.view==='atom'){const o=compareEl(sim);const z=zeff(e.Z);
      if(!o)return hon?`${e.name}: ${e.Z} protons, ${coreE(e.Z)} core electrons, so the outer electrons feel <b>Zeff ≈ +${z}</b> at ${e.radius} pm. ${ap?'Coulomb’s law: pull ∝ Zeff/r² = '+pull(e.Z).toFixed(2)+'.':''}`:`${e.name} has ${e.Z} protons. Its ${coreE(e.Z)} inner electrons <b>shield</b> the ${valE(e.Z)} outer electron${valE(e.Z)>1?'s':''} from most of that pull.`;
      const acr=p.cmp==='across';const bigger=o.radius>e.radius;
      return acr?`Across: ${o.name} has <b>one more proton</b> but the same core, so Zeff goes from +${z} to +${zeff(o.Z)}. The outer electrons are pulled closer: ${e.radius} → ${o.radius} pm.`:`Down: ${o.name} adds <b>a whole new shell</b>. Zeff stays about +${zeff(o.Z)}, but the outer electrons are farther out, so the atom is ${bigger?'bigger':'smaller'}: ${e.radius} → ${o.radius} pm.`;}
    const P=PROPS[p.prop],v=P.f(e);const T=TREND[p.prop];
    return `<b>${P.l}</b> (${P.p}): across a period it gets ${T[0]}, and down a group it gets ${T[1]}. ${e.name}: ${v===null?'no value (noble gases rarely bond)':(P.d?v.toFixed(P.d):v)+(P.u?' '+P.u:'')}.`;},
  tour:[
    {title:'A map of atom size',text:'Each square is colored by atomic radius. Dark is big, light is small. The biggest atoms are at the bottom left, the smallest at the top right.',focus:[X0-4,Y0-4,18*C+8,7*C+8],pause:true,setup(sim){BioLab.setValues(sim,{view:'map',prop:'radius',el:'Na'});syncMode(sim);}},
    {title:'Inside a sodium atom',text:'The nucleus holds 11 protons. Two shells of inner (core) electrons surround it, and one valence electron sits in the third shell.',focus:[10,40,380,400],speed:1,setup(sim){BioLab.setValues(sim,{view:'atom',el:'Na',cmp:'none'});syncMode(sim);}},
    {title:'Shielding',text:{bio:'The 10 inner electrons sit between the nucleus and the outer electron and cancel most of the pull. The outer electron feels about +1, not +11.',honors:'Zeff ≈ Z − core electrons = 11 − 10 = +1. The core electrons shield the valence electron from 10 of the 11 protons.'},focus:[10,40,380,400],speed:1},
    {title:'Across a period: smaller',text:'Magnesium adds one proton and one electron in the same shell. The core is the same, so the outer electrons feel more pull (+2) and move in. The atom shrinks.',focus:[0,0,800,450],speed:1,setup(sim){BioLab.setValues(sim,{cmp:'across'});}},
    {title:'Down a group: bigger',text:'Potassium starts a new, fourth shell. The extra protons are shielded by the extra core electrons, so Zeff stays about +1, but the outer electron is much farther away.',focus:[0,0,800,450],speed:1,setup(sim){BioLab.setValues(sim,{cmp:'down'});}},
    {title:'Ionization energy follows the pull',text:'A stronger pull on the outer electrons means more energy to remove one. Ionization energy and electronegativity both rise across a period and fall down a group, the opposite of size.',focus:[X0-4,Y0-4,18*C+8,7*C+8],pause:true,setup(sim){BioLab.setValues(sim,{view:'map',prop:'ie',el:'Cl'});syncMode(sim);}},
    {lvl:'honors',title:'Ions change size',text:'Same 10 electrons, more protons: N³⁻ is the biggest and Al³⁺ the smallest in this series. Cations shrink, anions swell.',focus:[0,0,800,450],pause:true,setup(sim){BioLab.setValues(sim,{view:'ions',series:'iso10'});syncMode(sim);}},
    {lvl:'ap',title:'Successive ionization energies',text:'Remove magnesium’s electrons one at a time. The first two are valence electrons. The third comes from the core and costs about five times more: the jump tells you how many valence electrons an atom has.',focus:[0,0,800,450],pause:true,setup(sim){BioLab.setValues(sim,{view:'sie',sie:'Mg'});syncMode(sim);sim.st.removed=3;}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{view:'map',prop:'radius',el:'Na',cmp:'across'});syncMode(sim);},
  lab:{bio:'<p><b>Question:</b> How does atom size change across a period and down a group?</p><ol><li>Use the Heat map with Atomic radius. Select Li, then press <b>Across →</b> until Ne, recording a trial at each element.</li><li>Select H and press <b>Down the group ↓</b> to Cs, recording each.</li><li>Plot atomic number (x) against atomic radius (y) on the Trials graph.</li></ol><p>Describe both patterns, and use “Inside the atom” to explain one of them.</p>',
       honors:'<p><b>Question:</b> Does Zeff explain atomic radius across period 3?</p><ol><li>Record trials for Na through Cl.</li><li>Plot Zeff (x) against atomic radius (y).</li><li>Repeat for the alkali metals Li to Cs and plot Z against radius.</li></ol><p>Explain why radius tracks Zeff across a period but not down a group.</p>',
       ap:'<p><b>Question:</b> Does the Coulomb pull Zeff/r² predict first ionization energy?</p><ol><li>Record trials for every main-group element from Li to Ar.</li><li>Plot Pull ∝ Zeff/r² (x) against first ionization energy (y), then try Slater’s Zeff.</li><li>Identify the points that fall off the trend.</li></ol><p><b>Claim–evidence–reasoning:</b> Explain the general trend with Coulomb’s law, and explain the B/Be and O/N exceptions with subshells and electron pairing.</p>'},
  terms:[{t:'Atomic radius',d:'Half the distance between the nuclei of two bonded atoms of the same element (covalent radius).'},{t:'Ionization energy',d:'The energy needed to remove an electron from a gaseous atom.'},{t:'Electronegativity',d:'How strongly an atom attracts shared electrons in a bond.'},
    {t:'Metallic character',d:'How easily an atom gives up electrons. It increases down a group and toward the left.'},{t:'Valence electrons',d:'Electrons in the outermost shell.'},{t:'Shielding',d:'Inner electrons blocking outer electrons from the full pull of the nucleus.'},
    {lvl:'honors',t:'Effective nuclear charge (Zeff)',d:'The net positive charge an outer electron feels. Roughly Z minus the number of core electrons.'},{lvl:'honors',t:'Isoelectronic',d:'Having the same number of electrons, like O²⁻, F⁻, Ne, Na⁺ and Mg²⁺.'},
    {lvl:'ap',t:'Coulomb’s law',d:'F = kq₁q₂/r². The pull on an outer electron grows with Zeff and falls with the square of its distance from the nucleus.'},{lvl:'ap',t:'Slater’s rules',d:'A way to estimate shielding: same-shell electrons shield 0.35, the next shell in 0.85, deeper shells 1.00.'},{lvl:'ap',t:'Successive ionization energies',d:'IE₁, IE₂, IE₃…: the energies to remove the first, second, third electron. A big jump marks the start of the core.'}],
  about:'<p>Atomic radii (covalent), first ionization energies and Pauling electronegativities come from ChemLab’s shared element table. Ionic radii are Shannon’s six-coordinate values (N³⁻ and P³⁻ use common textbook values). Successive ionization energies are NIST values.</p><p>“Metallic character” has no single measured value, so the map shows it as how easily the atom loses an electron, scaled from the first ionization energy. Noble gases have no electronegativity on the Pauling scale and show as gray.</p><p>The simple Zeff is Z minus the electrons in inner shells. It ignores the partial shielding between electrons in the same shell, so it overstates the jump across a period; Slater’s rules at Deep dive are closer to real values. The atom drawing uses Bohr-style shells to show which electrons are inside which; real electrons are spread in orbitals, not circles. Shell circles are spaced evenly inside the real covalent radius.</p>',
  draw(sim,ctx,vdt,k,t){ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);const v=sim.p.view;
    if(v==='atom')drawAtoms(sim,ctx,k,t);else if(v==='ions')drawIons(sim,ctx,k);else if(v==='sie')drawSIE(sim,ctx,k,t);else drawMap(sim,ctx,k);
    if(sim.st.bump>0)pill(ctx,'No element that way inside this tool',400,436,PAL['s4'],'#fff',12*k);},
  thumbSetup(sim){sim.p.view='map';sim.p.prop='radius';}
};
function drawMap(sim,ctx,k){const P=PAL,prop=sim.p.prop,D=PROPS[prop],[lo,hi]=RANGES[prop],small=k>1.3,e=el(sim.p.el);
  CL.elements.forEach(o=>{if(o.period>7||o.cat==='lanthanide'&&o.Z!==57||o.cat==='actinide'&&o.Z!==89)return;const {x,y}=cellXY(o);const v=D.f(o);const f=v===null||v===undefined?'#8a8a8a':ramp((v-lo)/(hi-lo));
    rr(ctx,x+1.5,y+1.5,C-3,C-3,5);ctx.fillStyle=f;ctx.fill();const ink=CL.inkOn(f);
    if(small)txt(ctx,o.sym,x+C/2,y+C/2+1,{s:o.sym.length>2?11*k:12*k,w:700,c:ink,a:'center',b:'middle'});
    else{txt(ctx,o.sym,x+C/2,y+C/2-4,{s:15,w:700,c:ink,a:'center',b:'middle'});txt(ctx,v===null||v===undefined?'—':(prop==='en'?v.toFixed(2):prop==='metal'?v.toFixed(0):String(Math.round(v))),x+C/2,y+C-6,{s:12,w:600,c:ink,a:'center'});}});
  const p=cellXY(e);ctx.strokeStyle=P['cv-ink'];ctx.lineWidth=4;rr(ctx,p.x-1,p.y-1,C+2,C+2,7);ctx.stroke();ctx.strokeStyle=P['cv-bg'];ctx.lineWidth=1.5;ctx.stroke();
  // the card in the gap
  const cx=X0+2*C+6,cy=Y0+2,cw=10*C-12,ch=3*C-8;rr(ctx,cx,cy,cw,ch,10);ctx.fillStyle=P['card'];ctx.fill();ctx.strokeStyle=P['line'];ctx.lineWidth=1;ctx.stroke();
  const v=D.f(e);txt(ctx,D.l,cx+14,cy+22*Math.min(k,1.3),{s:13*k,w:700,c:P['cv-soft']});
  const big=e.sym+'  '+(v===null||v===undefined?'—':(D.d?v.toFixed(D.d):v)+(D.u?' '+D.u:''));const z=fitT(ctx,big,cw-28,30*Math.min(k,1.4),12*k,800);txt(ctx,big,cx+14,cy+ch/2+10,{s:z,w:800});
  const sub=e.name+(atLeast('honors')?' · Zeff ≈ +'+zeff(e.Z):'');const z2=fitT(ctx,sub,cw-28,13*k,12*k,600);txt(ctx,sub,cx+14,cy+ch-12,{s:z2,w:600,c:P['cv-soft']});
  // color bar and trend arrows
  const by=Y0+7*C+18;const bw=small?380:300;const g=ctx.createLinearGradient(20,0,20+bw,0);STOPS.forEach((s,i)=>g.addColorStop(i/(STOPS.length-1),s));rr(ctx,20,by,bw,18,5);ctx.fillStyle=g;ctx.fill();
  const fmt=x=>prop==='en'?x.toFixed(1):String(Math.round(x));txt(ctx,fmt(lo),20,by+40,{s:12*k,w:600,c:P['cv-soft']});txt(ctx,fmt(hi)+(D.u?' '+D.u:''),20+bw,by+40,{s:12*k,w:600,c:P['cv-soft'],a:'right'});
  const T=TREND[prop],ax=small?420:360;arrow(ctx,ax,by+8,ax+60,by+8,P['cv-ink'],3);txt(ctx,'Across a period: '+T[0],ax+70,by+8,{s:fitT(ctx,'Across a period: '+T[0],800-ax-80,14*k,12*k,700),w:700,b:'middle'});
  arrow(ctx,ax+30,by+24,ax+30,by+64,P['cv-ink'],3);txt(ctx,'Down a group: '+T[1],ax+70,by+48,{s:fitT(ctx,'Down a group: '+T[1],800-ax-80,14*k,12*k,700),w:700,b:'middle'});}
function drawAtom(ctx,e,cx,cy,k,t,hon,label){const P=PAL,R=e.radius*SC,sh=shells(e.Z),n=sh.length-1;const core=coreE(e.Z);
  // electron cloud boundary
  ctx.fillStyle=P['cv-sol'];ctx.beginPath();ctx.arc(cx,cy,R,0,6.29);ctx.fill();ctx.setLineDash([5,4]);ctx.strokeStyle=P['cv-soft'];ctx.lineWidth=1.5;ctx.stroke();ctx.setLineDash([]);
  if(n>1){ctx.fillStyle='rgba(120,130,150,.22)';ctx.beginPath();ctx.arc(cx,cy,R*(n-1)/n+3,0,6.29);ctx.fill();}
  for(let i=1;i<=n;i++){const r=R*i/n;ctx.strokeStyle=i===n?P['s2']:P['cv-soft'];ctx.lineWidth=i===n?2:1;ctx.beginPath();ctx.arc(cx,cy,r,0,6.29);ctx.stroke();
    const ne=sh[i]||0;for(let j=0;j<ne;j++){const a=j/ne*6.283+(RM?0:t*(0.6/i))+i;const x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r;ctx.beginPath();ctx.arc(x,y,i===n?5:3.6,0,6.29);ctx.fillStyle=i===n?P['cv-e']:P['cv-soft'];ctx.fill();if(i===n){ctx.strokeStyle=P['cv-estroke'];ctx.lineWidth=1;ctx.stroke();}}}
  const nr=clamp(R*0.22,8,18);const g=ctx.createRadialGradient(cx-nr*0.3,cy-nr*0.3,2,cx,cy,nr);g.addColorStop(0,'#f6a3a3');g.addColorStop(1,'#b71c1c');ctx.fillStyle=g;ctx.beginPath();ctx.arc(cx,cy,nr,0,6.29);ctx.fill();
  // pull arrow from a valence electron toward the nucleus
  const z=zeff(e.Z),w=clamp(1.5+z*0.7,2,8);arrow(ctx,cx+R*0.98,cy,cx+nr+6,cy,P['s1'],w);}
function drawAtoms(sim,ctx,k,t){const P=PAL,e=el(sim.p.el),o=compareEl(sim),hon=atLeast('honors'),ap=atLeast('ap');
  const pairs=o?[[e,200],[o,600]]:[[e,250]];const cy=258;
  pairs.forEach(([a,cx],i)=>{drawAtom(ctx,a,cx,cy,k,t,hon);const head=a.name+' · Z = '+a.Z;txt(ctx,head,cx,24,{s:fitT(ctx,head,380,15*k,12*k,800),w:800,a:'center'});
    const l2=hon?'Zeff ≈ '+a.Z+' − '+coreE(a.Z)+' = +'+zeff(a.Z)+' · r = '+a.radius+' pm':valE(a.Z)+' outer e⁻ · '+coreE(a.Z)+' inner e⁻ · '+a.radius+' pm';txt(ctx,l2,cx,48+(k-1)*14,{s:fitT(ctx,l2,380,13*k,12*k,600),w:600,c:P['cv-soft'],a:'center'});
    if(ap){const l3='Slater Zeff '+slater(a.Z).toFixed(2)+' · pull ∝ Zeff/r² = '+pull(a.Z).toFixed(2);txt(ctx,l3,cx,70+(k-1)*26,{s:fitT(ctx,l3,380,12*k,12*k,500),c:P['cv-soft'],a:'center'});}
    if(!o&&i===0){const bx=500,lines=[['+'+a.Z,'protons in the nucleus',P['s1']],[String(coreE(a.Z)),'inner electrons (gray) shield',P['cv-soft']],[String(valE(a.Z)),'outer electrons (yellow)',P['cv-estroke']],['red arrow','pull on an outer electron',P['s1']]];
      lines.forEach((l,j)=>{const y=150+j*42*Math.min(k,1.2);txt(ctx,l[0],bx,y,{s:16*k,w:800,c:l[2]===P['cv-estroke']?P['cv-ink']:l[2]});txt(ctx,l[1],bx,y+18*k*0.9,{s:fitT(ctx,l[1],290,12*k,12*k,500),c:P['cv-soft']});});}});
  if(o){const s=sim.p.cmp==='across'?'Across →':'Down ↓';pill(ctx,s+'  '+e.radius+' → '+o.radius+' pm',400,432,o.radius<e.radius?PAL['s3']:PAL['s2'],'#fff',13*k);}
  else if(sim.p.cmp!=='none')pill(ctx,sim.p.cmp==='across'?'End of the period: nothing to the right':'Bottom of this tool’s range (Z ≤ 56)',400,432,PAL['s4'],'#fff',12*k);
  // scale bar
  const sb=100*SC;ctx.strokeStyle=P['cv-soft'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(20,440);ctx.lineTo(20+sb,440);ctx.moveTo(20,434);ctx.lineTo(20,446);ctx.moveTo(20+sb,434);ctx.lineTo(20+sb,446);ctx.stroke();if(k<1.3)txt(ctx,'100 pm',20+sb+8,444,{s:12*k,c:P['cv-soft']});}
function drawIons(sim,ctx,k){const P=PAL,S=SERIES[sim.p.series];const items=S.items.map(([s,q])=>({s,q,r:ionR(s,q),e:el(s)}));
  const tot=items.reduce((a,b)=>a+2*b.r,0);const sc=Math.min(0.62,(720-items.length*12)/tot);let x=40+((720-items.length*12)-tot*sc)/2;const cy=230;
  txt(ctx,S.l,400,26,{s:fitT(ctx,S.l,760,16*k,12*k,800),w:800,a:'center'});
  items.forEach(it=>{const R=it.r*sc;const cx=x+R;x+=2*R+12;const elec=it.e.Z-it.q;const col=it.q>0?'#2f6fbf':it.q<0?'#c0392b':'#6d7a88';
    const g=ctx.createRadialGradient(cx-R*0.35,cy-R*0.35,R*0.1,cx,cy,R);g.addColorStop(0,'#ffffff');g.addColorStop(0.3,col);g.addColorStop(1,CL.shade(col,-0.35));ctx.fillStyle=g;ctx.beginPath();ctx.arc(cx,cy,R,0,6.29);ctx.fill();
    const lab=it.q===0?it.s:CL.fmt(it.s,it.q);txt(ctx,lab,cx,cy-Math.max(R,40)-14,{s:fitT(ctx,lab,2*R+40,16*k,12*k,800),w:800,a:'center'});
    txt(ctx,it.e.Z+' p⁺',cx,cy+Math.max(R,30)+22*Math.min(k,1.3),{s:12*k,w:600,c:P['cv-ink'],a:'center'});txt(ctx,elec+' e⁻',cx,cy+Math.max(R,30)+22*Math.min(k,1.3)+15*k,{s:12*k,w:600,c:P['cv-soft'],a:'center'});
    if(k<1.3)txt(ctx,it.r+' pm',cx,cy+4,{s:12,w:700,c:'#fff',a:'center',b:'middle'});});
  const sb=100*sc;ctx.strokeStyle=P['cv-soft'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(20,440);ctx.lineTo(20+sb,440);ctx.moveTo(20,434);ctx.lineTo(20,446);ctx.moveTo(20+sb,434);ctx.lineTo(20+sb,446);ctx.stroke();txt(ctx,'100 pm',20+sb+8,444,{s:12*k,c:P['cv-soft']});
  if(k<1.3)txt(ctx,'Blue: cation · red: anion · gray: neutral atom',780,444,{s:12,c:P['cv-soft'],a:'right'});}
function drawSIE(sim,ctx,k,t){const P=PAL,s=sim.p.sie,e=el(s),ie=SIE[s],v=valE(e.Z),n=sim.st.removed,small=k>1.3;
  // atom on the left with electrons removed from the outside in
  const sh=shells(e.Z).slice();let left=n;for(let i=sh.length-1;i>=1&&left>0;i--){const take=Math.min(left,sh[i]);sh[i]-=take;left-=take;}
  const cx=small?190:180,cy=250,R=150,nn=shells(e.Z).length-1;
  ctx.fillStyle=P['cv-sol'];ctx.beginPath();ctx.arc(cx,cy,R,0,6.29);ctx.fill();
  for(let i=1;i<=nn;i++){const r=R*i/nn;ctx.strokeStyle=i===nn?P['s2']:P['cv-soft'];ctx.lineWidth=i===nn?2:1;ctx.beginPath();ctx.arc(cx,cy,r,0,6.29);ctx.stroke();
    const full=shells(e.Z)[i]||0,have=sh[i]||0;for(let j=0;j<full;j++){const a=j/full*6.283+(RM?0:t*0.4/i);const x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r;ctx.beginPath();ctx.arc(x,y,5,0,6.29);
      if(j<have){ctx.fillStyle=i===nn?P['cv-e']:P['cv-soft'];ctx.fill();}else{ctx.strokeStyle=P['cv-soft'];ctx.lineWidth=1.2;ctx.setLineDash([2,2]);ctx.stroke();ctx.setLineDash([]);}}}
  ctx.fillStyle='#b71c1c';ctx.beginPath();ctx.arc(cx,cy,16,0,6.29);ctx.fill();txt(ctx,'+'+e.Z,cx,cy+1,{s:12*k,w:800,c:'#fff',a:'center',b:'middle'});
  if(sim.st.fly>0&&n>0){const f=1-sim.st.fly;const x=cx+R*0.8+f*160,y=cy-f*120;ctx.beginPath();ctx.arc(x,y,6,0,6.29);ctx.fillStyle=n<=v?P['cv-e']:P['s1'];ctx.fill();}
  const ionLab=e.sym+(n?CL.sup((n>1?n:'')+'+'):'');txt(ctx,ionLab,cx,40,{s:24*Math.min(k,1.4),w:800,a:'center'});txt(ctx,(e.Z-n)+' electrons left',cx,66+(k-1)*12,{s:12*k,c:P['cv-soft'],a:'center'});
  // bar chart, log scale
  const L=small?400:380,T=60,W=small?380:390,H=320;const lo=Math.log10(300),hi=Math.log10(30000);const Y=val=>T+H-(Math.log10(val)-lo)/(hi-lo)*H;
  ctx.strokeStyle=P['g-grid'];ctx.lineWidth=1;[300,1000,3000,10000,30000].forEach(g=>{ctx.beginPath();ctx.moveTo(L,Y(g));ctx.lineTo(L+W,Y(g));ctx.stroke();if(!small||g!==3000)txt(ctx,g>=1000?g/1000+'k':String(g),L-6,Y(g)+1,{s:12*k,c:P['cv-soft'],a:'right',b:'middle'});});
  const bw=W/ie.length;ie.forEach((val,i)=>{const x=L+i*bw+bw*0.15,w=bw*0.7,y=Y(val);const core=i>=v;ctx.fillStyle=core?'#b3261e':'#2f6fbf';ctx.globalAlpha=i<n?1:0.35;ctx.fillRect(x,y,w,T+H-y);ctx.globalAlpha=1;
    txt(ctx,'IE'+CL.sub(i+1),x+w/2,T+H+18*Math.min(k,1.3),{s:12*k,w:700,c:P['cv-ink'],a:'center'});if(!small&&i<n)txt(ctx,val.toLocaleString(),x+w/2,y-6,{s:12,w:600,c:P['cv-ink'],a:'center'});});
  const jx=L+v*bw;ctx.setLineDash([5,4]);ctx.strokeStyle=P['cv-ink'];ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(jx,T-10);ctx.lineTo(jx,T+H);ctx.stroke();ctx.setLineDash([]);
  txt(ctx,'valence | core',jx,T-16,{s:12*k,w:700,c:P['cv-soft'],a:'center'});txt(ctx,'kJ/mol (log scale)',L,T-36,{s:12*k,c:P['cv-soft']});}
BioLab.register(SIM);
})();
