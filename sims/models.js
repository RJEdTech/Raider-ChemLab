(function(){
'use strict';
const {clamp,lerp,rng,randn,rr,txt,pill,atLeast,PAL,FONT,RM,axes,legend,serColor}=BioLab.h;
const CL=window.ChemLab;

/* ---------- physics of alpha scattering ----------
   e²/4πε₀ = 1.44 MeV·fm. Head-on distance of closest approach d = 1.44·zZ/KE (fm).
   Single (Rutherford) scattering: fraction deflected past θ = π n t (d/2)² cot²(θ/2).
   Many tiny deflections from electrons and distant nuclei add up to a spread of about 1° (Geiger 1910). */
const METALS={Au:{name:'gold',Z:79,A:197,n:5.90e28},Ag:{name:'silver',Z:47,A:108,n:5.86e28},Cu:{name:'copper',Z:29,A:64,n:8.49e28},Al:{name:'aluminum',Z:13,A:27,n:6.03e28}};
const BINS=[0,2,5,10,30,60,90,120,150,180];
const D2R=Math.PI/180;
function phys(p){const m=METALS[p.metal]||METALS.Au,E=p.energy,t=p.thick*1e-6;const d=1.44*2*m.Z/E; // fm
  const C=Math.PI*m.n*t*Math.pow(d*1e-15/2,2);
  const sig=1.0*(m.Z/79)*Math.sqrt(m.n*t/(5.90e28*0.4e-6))*(5/E); // degrees
  const nuc=p.model==='nuclear',tmin=3*sig;
  const F=x=>Math.min(0.9,C/Math.pow(Math.tan(x*D2R/2),2));
  const Ft=nuc?F(tmin):0;
  const Pgt=x=>{if(x<=0)return 1;if(x>=180)return 0;const g=Math.exp(-x*x/(2*sig*sig));if(!nuc)return g;return x<tmin?Ft+(1-Ft)*g:F(x)+(1-Ft)*g;};
  return {m,E,d,C,sig,tmin,Ft,Pgt,nuc,rn:1.2*Math.cbrt(m.A),f90:nuc?C:0};}
function sampleTheta(P,r){r=r||Math.random;const u=r();if(P.nuc&&u<P.Ft){const v=Math.max(1e-12,u);return Math.min(180,2*Math.atan(Math.sqrt(P.C/v))/D2R);}
  return P.sig*Math.sqrt(-2*Math.log(Math.max(1e-12,r())));}
function poisson(L,r){r=r||Math.random;if(L<=0)return 0;if(L>40)return Math.max(0,Math.round(L+Math.sqrt(L)*randn(r)));let k=0,p=1;const e=Math.exp(-L);do{k++;p*=r();}while(p>e);return k-1;}
function fire(sim,N){const P=phys(sim.p),st=sim.st;for(let i=0;i<BINS.length-1;i++){const pr=P.Pgt(BINS[i])-P.Pgt(BINS[i+1]);st.hist[i]+=poisson(N*pr,st.r);}
  st.fired+=N;for(let i=0;i<14;i++)spawnLab(sim,P,i*0.035);st.burst=1;}
function spawnLab(sim,P,delay){const st=sim.st;if(st.lab.length>60)return;st.lab.push({th:sampleTheta(P,st.r),s:st.r()<0.5?-1:1,age:-(delay||0),y0:(st.r()-0.5)*16});}
function fmtOneIn(f){if(!(f>0))return 'none';const n=1/f;return '1 in '+(n<10?n.toFixed(1):CL.roundSig(n,3).toLocaleString('en-US'));}

/* ---------- timeline ---------- */
const ERAS=[
  {id:'dalton',year:'1803',who:'John Dalton',name:'Solid sphere model',idea:'Atoms are tiny solid spheres that cannot be divided.',
   ev:'Elements combine in fixed whole-number mass ratios (the laws of definite and multiple proportions). Dalton explained this with indivisible atoms, one kind per element.',
   right:'Each element has its own kind of atom, and compounds are atoms joined in fixed ratios.',wrong:'Atoms can be divided: they contain electrons, protons and neutrons.'},
  {id:'thomson',year:'1897',who:'J. J. Thomson',name:'Plum-pudding model',idea:'Negative electrons sit in a spread-out ball of positive charge.',
   ev:'Cathode rays bent toward a positive plate in electric and magnetic fields. Thomson found they were particles about 1/1800 the mass of a hydrogen atom: electrons, present in every element.',
   right:'Atoms contain electrons, so atoms are divisible.',wrong:'The positive charge is not spread out. The gold foil experiment showed it is packed into a tiny nucleus.'},
  {id:'rutherford',year:'1911',who:'Ernest Rutherford',name:'Nuclear model',idea:'A tiny, dense, positive nucleus; electrons around it in mostly empty space.',
   ev:'Geiger and Marsden fired alpha particles at thin gold foil. Most went straight through, but about 1 in 20,000 bounced back. Only a tiny, massive, positive center could do that.',
   right:'Almost all the mass and all the positive charge are in a nucleus about 100,000 times smaller than the atom.',wrong:'It cannot explain why the electrons do not spiral into the nucleus, or why atoms give off only certain colors of light.'},
  {id:'bohr',year:'1913',who:'Niels Bohr',name:'Planetary (Bohr) model',idea:'Electrons move in fixed orbits with fixed energies.',
   ev:'Hydrogen gives off light at only four visible wavelengths. Bohr matched them exactly with electrons jumping between energy levels.',
   right:'Electron energy is quantized: only certain energy levels are allowed.',wrong:'It only works for one-electron atoms, and electrons do not follow circular paths.'},
  {id:'quantum',year:'1926',who:'Erwin Schrödinger',name:'Quantum (electron cloud) model',idea:'Electrons occupy orbitals: regions where they are likely to be found.',
   ev:'Electrons behave like waves (de Broglie, 1924). Schrödinger’s wave equation gives orbitals (s, p, d, f) and their energies for every atom.',
   right:'This is the model chemists use today, for electron configurations, bonding and spectra.',wrong:'Nothing major so far. It is a probability model: you cannot know an electron’s exact path.'},
  {id:'chadwick',year:'1932',who:'James Chadwick',name:'The neutron',idea:'The nucleus holds neutral neutrons as well as protons.',
   ev:'Radiation from beryllium knocked protons out of paraffin wax. Chadwick showed it was a neutral particle with about the mass of a proton.',
   right:'Neutrons explain why atoms weigh more than their protons alone, and why isotopes exist.',wrong:'Protons and neutrons are themselves made of quarks (1960s).'}];
const CW=250,CH=196,CX0=17,CY0=20,GAP=12;
const cardRect=i=>({x:CX0+(i%3)*(CW+GAP),y:CY0+Math.floor(i/3)*(CH+GAP+4),w:CW,h:CH});

function syncMode(sim){if(!sim.ui||!sim.ui.sec)return;const mode=sim.p.view,d=sim.def;
  d.controls.forEach(c=>{if(!c.modes)return;const cid=d.id+'-'+c.id,e=document.getElementById(cid)||document.getElementById(cid+'-l');if(!e)return;const w=e.closest('.ctl');if(w)w.hidden=!atLeast(c.lvl)||!c.modes.includes(mode);});
  d.metrics.forEach(m=>{if(!m.modes)return;const t=sim.ui.tiles[m.id];if(!t)return;const w=t.num.closest('.tile');if(w)w.hidden=!atLeast(m.lvl)||!m.modes.includes(mode);});
  const btns=[...sim.ui.sec.querySelectorAll('.actions button')];d.actions.forEach(a=>{const b=btns.find(x=>x.textContent===a.label);if(b)b.hidden=!atLeast(a.lvl)||!a.modes.includes(mode);});}

/* lab geometry */
const SX=44,SY=228,FX=300,FY=228,RD=150;
/* close-up geometry: circle centered at ZX,ZY, radius ZR; FIELD fm across */
const ZX=640,ZY=222,ZR=142,FIELD=320;
function zoomPath(P,b){ // integrate an alpha past a point nucleus in fm units; returns points in px
  const s=2*ZR/FIELD,d=P.d,pts=[];let x=-FIELD/2-6,y=b,vx=1,vy=0;const K=d/2; // v0 = 1, KE = 1/2 → K/r = 1/2 at r = d
  for(let i=0;i<6000;i++){const r=Math.hypot(x,y);if(i%2===0)pts.push([ZX+x*s,ZY+y*s]);if(r>FIELD/2+8&&i>10&&x*vx+y*vy>0)break;
    const dt=Math.min(2,0.02*r);const a=K/(r*r*r);vx+=a*x*dt;vy+=a*y*dt;x+=vx*dt;y+=vy*dt;}
  return pts;}

const M={
  id:'models',hash:'models',apUnit:2,order:1,tab:'Atomic models and gold foil',kind:'Simulation',next:['atombuilder','spectra'],
  card:'Fire alpha particles at gold foil, compare what the plum-pudding and nuclear models predict, and walk the timeline from Dalton to Chadwick.',
  title:'Atomic models: Rutherford’s gold foil experiment',
  lede:{bio:'In 1909, alpha particles fired at gold foil did something nobody expected. Test both models of the atom and see which one explains the evidence.',
        honors:'Change the alpha energy and the foil thickness, and compare the measured back-scattering with Rutherford’s prediction.',
        ap:'Use Coulomb’s law to find the distance of closest approach, relate impact parameter to scattering angle, and estimate the size of the nucleus.'},
  scale:{bio:'Left: the lab, a few centimeters across. Right: a close-up of one gold atom or nucleus, a trillion times smaller.',
         ap:'Lab: 0.4 µm gold foil (about 1,400 atoms thick). Close-up: 320 fm across; a gold atom is 288,000 fm across and its nucleus about 14 fm.'},
  timeless:true,animated:true,chChange:0.6,chReveal:2.6,
  controls:[
    {id:'view',label:'Show',type:'seg',def:'foil',lvl:'bio',noTrial:true,options:[{v:'foil',l:'Gold foil experiment'},{v:'timeline',l:'Timeline of models'}]},
    {id:'model',label:'Model of the atom',type:'seg',def:'thomson',lvl:'bio',modes:['foil'],options:[{v:'thomson',l:'Plum pudding'},{v:'nuclear',l:'Nuclear'}],onChange(sim){if(sim.st)sim.st.zoom=[];}},
    {id:'energy',label:'Alpha particle energy',type:'range',min:2,max:10,step:0.5,def:5,unit:' MeV',lvl:'honors',modes:['foil'],onChange(sim){if(sim.st)sim.st.zoom=[];}},
    {id:'thick',label:'Foil thickness',type:'range',min:0.2,max:4,step:0.1,def:0.4,unit:' µm',lvl:'honors',modes:['foil']},
    {id:'metal',label:'Foil metal',type:'select',def:'Au',lvl:'ap',modes:['foil'],options:[{v:'Au',l:'Gold (Z = 79)'},{v:'Ag',l:'Silver (Z = 47)'},{v:'Cu',l:'Copper (Z = 29)'},{v:'Al',l:'Aluminum (Z = 13)'}],onChange(sim){if(sim.st)sim.st.zoom=[];}},
    {id:'era',label:'Model',type:'select',def:'dalton',lvl:'bio',modes:['timeline'],noTrial:true,options:ERAS.map(e=>({v:e.id,l:e.year+': '+e.who}))}
  ],
  actions:[
    {id:'fire1',label:'Fire 10,000 alphas',lvl:'bio',primary:true,modes:['foil'],run(sim){fire(sim,1e4);}},
    {id:'fire2',label:'Fire 1,000,000 alphas',lvl:'bio',modes:['foil'],run(sim){fire(sim,1e6);}},
    {id:'clear',label:'Clear the detector',lvl:'bio',modes:['foil'],run(sim){sim.st.hist=BINS.slice(1).map(()=>0);sim.st.fired=0;sim.st.flash=[];}},
    {id:'nextera',label:'Next model',lvl:'bio',primary:true,modes:['timeline'],run(sim){const i=ERAS.findIndex(e=>e.id===sim.p.era);BioLab.setValues(sim,{era:ERAS[(i+1)%ERAS.length].id});}}
  ],
  init(sim){return {hist:BINS.slice(1).map(()=>0),fired:0,lab:[],zoom:[],flash:[],r:rng(20261024),acc:0,zacc:0,burst:0};},
  step(sim,dt){const st=sim.st;if(sim.p.view!=='foil')return;const P=phys(sim.p);
    st.acc+=dt;while(st.acc>0.09){st.acc-=0.09;spawnLab(sim,P,0);const th=st.lab[st.lab.length-1];
      if(th){st.fired++;const b=BINS.findIndex((x,i)=>th.th>=x&&th.th<BINS[i+1]);if(b>=0)st.hist[b]++;}}
    st.lab.forEach(a=>a.age+=dt);st.lab=st.lab.filter(a=>{if(a.age>1.55&&!a.hit){a.hit=true;st.flash.push({th:a.th*a.s,age:0});}return a.age<1.6;});
    st.flash.forEach(f=>f.age+=dt);st.flash=st.flash.filter(f=>f.age<1.4);if(st.flash.length>80)st.flash.splice(0,st.flash.length-80);
    st.zacc+=dt;if(st.zacc>0.42){st.zacc=0;if(st.zoom.length<9){const u=st.r(),b=(st.r()<0.5?-1:1)*FIELD*0.42*Math.pow(u,1.4);st.zoom.push({b,pts:P.nuc?zoomPath(P,b):null,age:0});}}
    st.zoom.forEach(z=>z.age+=dt);st.zoom=st.zoom.filter(z=>z.age<3.4);},
  metrics:[
    {id:'fired',label:'Alphas fired',unit:'',lvl:'bio',min:0,max:null,d:0,modes:['foil'],get:s=>s.st.fired},
    {id:'back',label:'Bounced back past 90°',unit:'',lvl:'bio',min:0,max:null,d:0,modes:['foil'],get:s=>s.st.hist.slice(6).reduce((a,b)=>a+b,0)},
    {id:'frac',label:'Measured fraction past 90°',unit:'',lvl:'bio',text:true,modes:['foil'],get:s=>{const b=s.st.hist.slice(6).reduce((a,c)=>a+c,0);return s.st.fired?(b?fmtOneIn(b/s.st.fired):'none of '+s.st.fired.toLocaleString('en-US')):'fire some alphas';}},
    {id:'f90',label:'Predicted past 90° per million',unit:'',lvl:'honors',min:0,max:null,d:1,modes:['foil'],get:s=>phys(s.p).f90*1e6},
    {id:'sig',label:'Typical small deflection',unit:'°',lvl:'honors',min:0,max:null,d:1,modes:['foil'],get:s=>phys(s.p).sig},
    {id:'dmin',label:'Closest approach, head-on',unit:'fm',lvl:'ap',min:0,max:null,d:1,modes:['foil'],get:s=>phys(s.p).d},
    {id:'rn',label:'Nuclear radius (1.2 fm × A^⅓)',unit:'fm',lvl:'ap',min:0,max:null,d:1,modes:['foil'],get:s=>phys(s.p).rn},
    {id:'eraT',label:'Model shown',unit:'',lvl:'bio',text:true,modes:['timeline'],get:s=>{const e=ERAS.find(x=>x.id===s.p.era);return e.year+', '+e.name;}}
  ],
  graphs:[{id:'hist',label:'Detector counts by angle',lvl:'bio',custom:true},{id:'btheta',label:'Scattering angle vs impact parameter',lvl:'ap',custom:true}],
  defaultGraph:'hist',
  plot(sim,ctx,box,id){const P=phys(sim.p),st=sim.st;
    if(sim.p.view!=='foil'){txt(ctx,'Switch to the gold foil experiment to collect data.',box.cw/2,box.ch/2,{s:15,c:PAL['muted'],a:'center',b:'middle'});return;}
    if(id==='btheta'){const bmax=6*P.d;const ax=axes(ctx,box,{xmin:0,xmax:bmax,ymin:0,ymax:180,xl:'Impact parameter b (fm)',yl:'Scattering angle θ (°)'});
      ctx.strokeStyle=serColor(0);ctx.lineWidth=2.5;ctx.beginPath();for(let i=0;i<=200;i++){const b=bmax*i/200,th=2*Math.atan(P.d/(2*Math.max(b,1e-6)))/D2R;i?ctx.lineTo(ax.X(b),ax.Y(th)):ctx.moveTo(ax.X(b),ax.Y(th));}ctx.stroke();
      const b90=P.d/2;ctx.setLineDash([4,4]);ctx.strokeStyle=PAL['muted'];ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(ax.X(b90),ax.Y(0));ctx.lineTo(ax.X(b90),ax.Y(90));ctx.lineTo(ax.X(0),ax.Y(90));ctx.stroke();ctx.setLineDash([]);
      txt(ctx,'b = d/2 = '+b90.toFixed(1)+' fm gives 90°',ax.X(b90)+8,ax.Y(90)-8,{s:13,c:PAL['cv-ink'],w:600});
      legend(ctx,box.L+150,box.T+12,[{label:'tan(θ/2) = d / 2b',color:serColor(0)}]);return;}
    const n=BINS.length-1,ymax=Math.max(1,...st.hist,st.fired*(P.Pgt(0)-P.Pgt(2)));const top=Math.max(3,Math.ceil(Math.log10(ymax+1)+0.25));
    const ax=axes(ctx,box,{xmin:0,xmax:n,ymin:0,ymax:top,xcats:BINS.slice(0,-1).map((b,i)=>b+'–'+BINS[i+1]+'°'),yl:'log₁₀(count + 1)',yd:0});
    st.hist.forEach((c,i)=>{const v=Math.log10(c+1),x0=ax.X(i+0.2),x1=ax.X(i+0.8);ctx.fillStyle=i>=6?PAL['s1']:serColor(1);ctx.fillRect(x0,ax.Y(v),x1-x0,ax.Y(0)-ax.Y(v));
      txt(ctx,c>=1e5?CL.roundSig(c,3).toExponential(1).replace('e+',' × 10^'):String(c),(x0+x1)/2,ax.Y(v)-5,{s:12,c:PAL['cv-ink'],a:'center',w:600});});
    if(st.fired){ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2;ctx.setLineDash([4,3]);for(let i=0;i<n;i++){const e=st.fired*(P.Pgt(BINS[i])-P.Pgt(BINS[i+1])),v=Math.log10(e+1);ctx.beginPath();ctx.moveTo(ax.X(i+0.12),ax.Y(v));ctx.lineTo(ax.X(i+0.88),ax.Y(v));ctx.stroke();}ctx.setLineDash([]);}
    legend(ctx,box.L+12,box.T+10,[{label:'counted',color:serColor(1)},{label:'past 90°',color:PAL['s1']},{label:(P.nuc?'nuclear':'plum-pudding')+' model prediction',color:PAL['cv-ink'],dash:true}]);},
  infoPanel(sim){const p=sim.p,hon=atLeast('honors'),ap=atLeast('ap');
    if(p.view==='timeline'){const e=ERAS.find(x=>x.id===p.era);return `<h3>${e.year}: ${e.who}, ${e.name.toLowerCase()}</h3><p><b>The idea:</b> ${e.idea}</p><p><b>The evidence:</b> ${e.ev}</p><p><b>What it got right:</b> ${e.right}</p><p><b>What later evidence changed:</b> ${e.wrong}</p>`;}
    const P=phys(p);let h=`<h3>${P.nuc?'The nuclear model':'The plum-pudding model'}</h3>`;
    h+=P.nuc?'<p>All the positive charge and almost all the mass sit in a nucleus about 1/20,000 the width of the atom. An alpha that passes far from every nucleus barely bends. The rare alpha that heads almost straight at a nucleus is pushed back hard.</p>'
            :'<p>The positive charge is spread through the whole atom, so no spot is concentrated enough to stop a fast, heavy alpha particle. Every alpha should get through with only tiny deflections.</p>';
    if(hon)h+=`<p><b>Prediction for this foil:</b> ${P.nuc?fmtOneIn(P.C)+' alphas past 90°':'no alphas past 90°'}. Small deflections spread about ${P.sig.toFixed(1)}°.</p>`;
    if(ap)h+=`<p><b>Closest approach:</b> ½mv² = kq₁q₂/d, so d = (1.44 MeV·fm)(2)(${P.m.Z}) / ${P.E.toFixed(1)} MeV = <b>${P.d.toFixed(1)} fm</b>. The nucleus must be smaller than this, and a ${P.m.name} nucleus is about ${P.rn.toFixed(1)} fm in radius.</p><p><b>Rutherford’s formula:</b> fraction past θ = π n t (d/2)² cot²(θ/2), with n = ${CL.sci(P.m.n,'',3)} atoms/m³ and t = ${p.thick.toFixed(1)} µm. Counts per angle fall as 1/sin⁴(θ/2).</p>`;
    return h;},
  narrate(sim){const p=sim.p,st=sim.st,hon=atLeast('honors');
    if(p.view==='timeline'){const e=ERAS.find(x=>x.id===p.era);return '<b>'+e.year+', '+e.who+':</b> '+e.idea+' Each new model kept what fit the evidence and changed what did not.';}
    const P=phys(p),back=st.hist.slice(6).reduce((a,b)=>a+b,0);
    if(!P.nuc)return 'In the <b>plum-pudding</b> model the positive charge is spread thin, so every alpha passes through and bends less than a few degrees. '+(st.fired?back+' of '+st.fired.toLocaleString('en-US')+' alphas came back past 90°.':'')+' Switch to the nuclear model to see what Geiger and Marsden actually saw.';
    let s='In the <b>nuclear model</b> most alphas miss every nucleus and go straight through. ';
    s+=back?'<b>'+back+' of '+st.fired.toLocaleString('en-US')+'</b> bounced back past 90°, because they came very close to a tiny, dense, positive nucleus.':'Large deflections are rare: fire a million alphas to catch some bouncing back.';
    if(hon)s+=' Prediction: '+fmtOneIn(P.C)+' past 90°.';return s;},
  tour:[
    {title:'The alpha source',text:'A radioactive source shoots out alpha particles: helium nuclei, 2 protons and 2 neutrons, moving at about 5% of the speed of light. A lead box with a hole makes a narrow beam.',focus:[10,190,110,76],speed:0.5,setup(sim){BioLab.setValues(sim,{view:'foil',model:'thomson'});}},
    {title:'Gold foil',text:'The beam hits gold leaf only 0.4 µm thick, about 1,400 atoms. Gold can be hammered thinner than almost any other metal.',focus:[FX-24,FY-60,48,120],speed:0.5},
    {title:'The detector screen',text:'A zinc sulfide screen around the foil gives a tiny flash wherever an alpha lands. Geiger and Marsden counted the flashes by eye through a microscope.',focus:[FX-RD-14,FY-RD-14,2*RD+28,2*RD+28],speed:0.5},
    {title:'What the plum pudding predicts',text:'If the positive charge is spread through the whole atom, nothing in the foil can stop an alpha. Every flash lands within a few degrees of straight ahead. The close-up shows alphas passing through one atom.',focus:[[FX-RD-14,FY-RD-14,2*RD+28,2*RD+28],[ZX-ZR-6,ZY-ZR-6,2*ZR+12,2*ZR+12]],speed:0.5},
    {title:'What they really saw',text:'Most alphas went straight through, but about 1 in 20,000 bounced back. Rutherford said it was like firing a 15-inch shell at tissue paper and having it come back and hit you.',focus:[FX-RD-14,FY-RD-14,2*RD+28,2*RD+28],speed:0.5,setup(sim){BioLab.setValues(sim,{model:'nuclear'});fire(sim,1e6);}},
    {title:'Why: a tiny nucleus',text:'All the positive charge is packed into a nucleus 20,000 times narrower than the atom. An alpha aimed almost straight at it is pushed back by the electric repulsion. Alphas that miss by a little bend a little.',focus:[ZX-ZR-6,ZY-ZR-6,2*ZR+12,2*ZR+12],speed:0.4},
    {lvl:'ap',title:'Closest approach',text:'A head-on alpha stops where its kinetic energy has all become electric potential energy: d = kq₁q₂/KE ≈ 45 fm for 5 MeV on gold. The nucleus must be smaller than d.',focus:[ZX-ZR-6,ZY-ZR-6,2*ZR+12,2*ZR+12],speed:0.3},
    {title:'The timeline of models',text:'Each model of the atom answered the evidence of its time: Dalton’s solid spheres, Thomson’s electrons, Rutherford’s nucleus, Bohr’s energy levels, the quantum cloud and Chadwick’s neutron.',focus:[10,10,780,430],pause:true,setup(sim){BioLab.setValues(sim,{view:'timeline',era:'rutherford'});}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{view:'foil',model:'thomson'});},
  onChallenge(sim,ch,phase){if(ch&&ch.instant&&ch.set&&phase==='done')BioLab.setValues(sim,ch.set);},
  challenges:[
    {lvl:'bio',q:'Suppose Thomson’s plum-pudding model were right. Fire a million alphas at the gold foil. How many bounce back past 90°?',choices:['None, or almost none','About half of them','A few in every hundred'],correct:0,
     baseline:{view:'foil',model:'thomson'},changeAction:'fire2',changeText:'One million alphas fired at the foil',watch:'hist',
     explain:{bio:'With the positive charge spread thin, nothing can push a fast, heavy alpha backward. Every alpha passes through and bends only a degree or two. That is what Rutherford expected to see.'}},
    {lvl:'bio',q:'Now use the nuclear model and fire a million alphas. What happens?',choices:['They all pass straight through','Most pass straight through, but a few bounce back past 90°','Most bounce back'],correct:1,
     baseline:{view:'foil',model:'nuclear'},changeAction:'fire2',changeText:'One million alphas fired at the foil',watch:'hist',
     explain:{bio:'About 40 in a million bounce back. Most alphas miss every nucleus because the atom is mostly empty space. The few that come close to a tiny, dense, positive nucleus get pushed back hard.'}},
    {lvl:'bio',instant:true,set:{view:'foil',model:'nuclear'},q:'Most alpha particles went straight through the gold foil. What does that tell you about atoms?',choices:['Atoms are mostly empty space','Gold atoms are soft and squishy','Alpha particles are smaller than electrons'],correct:0,
     explain:{bio:'If alphas pass through 1,400 layers of atoms without hitting anything, there must be very little in their way. The mass is concentrated in a tiny nucleus, and the rest of the atom is mostly empty space.'}},
    {lvl:'bio',instant:true,set:{view:'timeline',era:'thomson'},q:'Which experiment showed that atoms contain small negative particles?',choices:['Thomson’s cathode ray tube','Rutherford’s gold foil','Chadwick’s beryllium experiment','Dalton’s mass ratios'],correct:0,
     explain:{bio:'Cathode rays bent toward a positive plate, so they were negative, and Thomson showed they were particles far lighter than any atom: electrons.'}},
    {lvl:'honors',q:'Double the foil thickness from 0.4 µm to 0.8 µm. The predicted fraction of alphas past 90°…',choices:['doubles','quadruples','stays the same'],correct:0,
     baseline:{view:'foil',model:'nuclear',thick:0.4},change:{thick:0.8},changeText:'Foil thickness doubled',
     explain:{honors:'Twice as many atoms lie in the path, so there are twice as many chances to pass close to a nucleus: 39 → 78 per million. Rutherford found the counts were proportional to thickness, evidence that each large bounce comes from a single nucleus.'}},
    {lvl:'honors',q:'Double the alpha energy from 5 MeV to 10 MeV. The fraction bounced back past 90°…',choices:['doubles','halves','drops to one quarter'],correct:2,
     baseline:{view:'foil',model:'nuclear',energy:5},change:{energy:10},changeText:'Alpha energy doubled',
     explain:{honors:'A faster alpha must come twice as close to be turned around (d = kq₁q₂/KE halves), and the target area goes as d², so the fraction drops to 1/4. Check the Predicted past 90° readout: 39 → 9.7 per million.'}},
    {lvl:'ap',instant:true,set:{view:'foil',model:'nuclear',energy:5,metal:'Au'},q:'A 5.0 MeV alpha heads straight at a gold nucleus (Z = 79). How close does it get before it stops? (kq₁q₂ = 1.44 MeV·fm × 2 × 79)',choices:['4.5 fm','45 fm','450 fm','0.45 pm'],correct:1,
     explain:{ap:'At the turning point all the kinetic energy is potential energy: d = (1.44 × 2 × 79)/5.0 = 45.5 fm. The gold nucleus (radius about 7 fm) must be smaller than this. The Closest approach readout confirms it.'}},
    {lvl:'ap',q:'Switch the foil from gold (Z = 79) to aluminum (Z = 13), same thickness. The predicted fraction past 90°…',choices:['drops to about 1/36','drops to about 1/6','stays the same'],correct:0,
     baseline:{view:'foil',model:'nuclear',metal:'Au'},change:{metal:'Al'},changeText:'Foil changed to aluminum',
     explain:{ap:'The fraction depends on Z² (through d²) times the atoms per volume: (13/79)² × (6.03/5.90) ≈ 1/36. The readout falls from 39 to 1.1 per million. Rutherford used this Z² dependence to measure nuclear charges.'}},
    {lvl:'ap',instant:true,set:{view:'foil',model:'nuclear',energy:5,metal:'Au'},q:'An alpha passes a gold nucleus with impact parameter b = d/2 (about 23 fm). What is its scattering angle?',choices:['30°','45°','90°','180°'],correct:2,
     explain:{ap:'For Coulomb scattering, tan(θ/2) = d/(2b) = 1, so θ/2 = 45° and θ = 90°. The b vs θ graph marks this point: only alphas aimed within 23 fm of a nucleus bounce back.'}}
  ],
  lab:{bio:'<p><b>Question:</b> Which model of the atom explains the gold foil results?</p><ol><li>Use the plum-pudding model. Clear the detector, fire 1,000,000 alphas and record a trial.</li><li>Switch to the nuclear model. Clear, fire 1,000,000 and record.</li><li>Compare “Bounced back past 90°”.</li></ol><p>Which model matches what Geiger and Marsden saw? Explain what the bounced-back alphas tell you about the nucleus.</p>',
       honors:'<p><b>Question:</b> How do foil thickness and alpha energy change the back-scattering?</p><ol><li>Nuclear model, 5 MeV. Record trials at foil thicknesses 0.4, 0.8, 1.6 and 3.2 µm (clear and fire 1,000,000 each time).</li><li>Back at 0.4 µm, record trials at 2.5, 5 and 10 MeV.</li><li>Plot thickness against bounced back, then energy against bounced back.</li></ol><p>Describe each relationship (linear? inverse square?) and explain it with the size of the target around each nucleus.</p>',
       ap:'<p><b>Question:</b> How small is the nucleus?</p><ol><li>Record the closest approach for gold at 2, 5 and 10 MeV, and for each metal at 5 MeV.</li><li>Compare each with the nuclear radius readout.</li></ol><p><b>Claim–evidence–reasoning:</b> Rutherford’s formula held for gold up to the highest energies he could reach. What does that say about the gold nucleus? Real experiments with aluminum broke the formula near 10 MeV: explain why, using your d values.</p>'},
  terms:[{t:'Alpha particle',d:'A helium nucleus (2 protons, 2 neutrons) given off by some radioactive atoms. Charge 2+.'},{t:'Nucleus',d:'The tiny, dense, positive center of an atom, holding protons and neutrons.'},{t:'Plum-pudding model',d:'Thomson’s model: electrons scattered through a spread-out ball of positive charge.'},{t:'Nuclear model',d:'Rutherford’s model: a tiny positive nucleus with electrons in mostly empty space around it.'},{t:'Cathode ray',d:'A beam of electrons in a vacuum tube, used by Thomson to discover the electron.'},
    {lvl:'honors',t:'Scattering angle',d:'How far an alpha’s path is turned from straight ahead.'},{lvl:'honors',t:'Neutron',d:'A neutral particle in the nucleus, discovered by Chadwick in 1932.'},
    {lvl:'ap',t:'Distance of closest approach',d:'d = kq₁q₂/KE, where a head-on alpha stops and turns around.'},{lvl:'ap',t:'Impact parameter',d:'b, how far an alpha’s straight-line path would miss the nucleus. tan(θ/2) = d/(2b).'},{lvl:'ap',t:'Femtometer (fm)',d:'10⁻¹⁵ m, the size scale of nuclei.'}],
  about:'<p>Detector counts come from real scattering physics. In the nuclear model, the fraction of alphas deflected past angle θ by one nucleus is π n t (d/2)² cot²(θ/2) (Rutherford, 1911), with d = 1.44 MeV·fm × 2Z / KE and n the atoms per cubic meter of the metal. Every alpha also picks up many tiny deflections from electrons and distant nuclei; this is modeled as a spread of about 1° for 5 MeV alphas on 0.4 µm gold (close to Geiger’s 1910 value), scaling with Z√(nt)/KE. The plum-pudding model gives only that small spread, which is what Thomson’s model predicts. Large counts are drawn from Poisson statistics, so repeated runs vary.</p><p>The close-up paths are computed step by step from Coulomb repulsion by a point nucleus, so they bend exactly as tan(θ/2) = d/(2b). The close-up only shows alphas that pass within about 130 fm of the nucleus; almost all real alphas miss by far more. Simplifications: the nucleus is a point charge (fine until alphas reach about 10 fm), the alpha does not lose energy in the foil, recoil of the nucleus is ignored, and the lab picture is not to scale. Historical details follow Geiger and Marsden (1909) and Rutherford (1911).</p>',
  initVis(sim){},
  onLevel(sim){syncMode(sim);},
  draw(sim,ctx,vdt,k,t){const p=sim.p,st=sim.st,hon=atLeast('honors'),ap=atLeast('ap');
    ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
    if(p.view==='timeline'){drawTimeline(sim,ctx,k,t);return;}
    const P=phys(p);
    // lab: detector ring
    ctx.strokeStyle=PAL['cv-soft'];ctx.globalAlpha=0.5;ctx.lineWidth=10;ctx.beginPath();ctx.arc(FX,FY,RD,Math.PI+0.11,Math.PI-0.11+2*Math.PI);ctx.stroke();ctx.globalAlpha=1;
    ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1;[0,30,60,90,120,150].forEach(a=>{[-1,1].forEach(sg=>{const r=a*D2R*sg;ctx.beginPath();ctx.moveTo(FX+Math.cos(r)*(RD-8),FY-Math.sin(r)*(RD-8));ctx.lineTo(FX+Math.cos(r)*(RD+8),FY-Math.sin(r)*(RD+8));ctx.stroke();});});
    txt(ctx,'0°',FX+RD+12,FY,{s:12*k,c:PAL['cv-soft'],b:'middle'});txt(ctx,'90°',FX,FY-RD-14,{s:12*k,c:PAL['cv-soft'],a:'center'});
    txt(ctx,'Detector screen (glows where an α lands)',FX,FY+RD+26,{s:12*k,c:PAL['cv-soft'],a:'center'});txt(ctx,'180°',FX-RD-8,FY-14,{s:12*k,c:PAL['cv-soft'],a:'right'});
    // flashes on the screen
    st.flash.forEach(f=>{const r=f.th*D2R,a=clamp(1-f.age/1.4,0,1);const x=FX+Math.cos(r)*RD,y=FY-Math.sin(r)*RD;ctx.fillStyle=PAL['s3'];ctx.globalAlpha=a;ctx.beginPath();ctx.arc(x,y,4+5*(1-a),0,6.29);ctx.fill();ctx.globalAlpha=1;});
    // source box
    ctx.fillStyle=PAL['cv-lamp'];rr(ctx,SX-30,SY-24,58,48,6);ctx.fill();ctx.fillStyle=PAL['s4'];ctx.beginPath();ctx.arc(SX-6,SY,8,0,6.29);ctx.fill();
    txt(ctx,'α source',12,SY+44,{s:12*k,w:700});txt(ctx,'in lead',12,SY+44+15*k,{s:12*k,c:PAL['cv-soft']});
    // foil
    ctx.fillStyle='#d4a017';ctx.fillRect(FX-2.5,FY-52,5,104);txt(ctx,P.m.name+' foil',FX,FY-64,{s:12*k,w:700,a:'center'});
    // beam and alphas
    ctx.strokeStyle=PAL['s4'];ctx.globalAlpha=0.18;ctx.lineWidth=10;ctx.beginPath();ctx.moveTo(SX+28,SY);ctx.lineTo(FX,FY);ctx.stroke();ctx.globalAlpha=1;
    const L1=FX-SX-28,v1=L1/0.95;st.lab.forEach(a=>{if(a.age<0)return;let x,y;if(a.age<0.95){x=SX+28+v1*a.age;y=SY+a.y0*(a.age/0.95)*0.3;}else{const u=clamp((a.age-0.95)/0.6,0,1),r=a.th*a.s*D2R;x=FX+Math.cos(r)*RD*u;y=FY-Math.sin(r)*RD*u;}
      ctx.fillStyle=a.th>90?PAL['s1']:PAL['s4'];ctx.beginPath();ctx.arc(x,y,a.th>90?4.5:3,0,6.29);ctx.fill();});
    // tally box
    const back=st.hist.slice(6).reduce((a,b)=>a+b,0);if(k<1.4){rr(ctx,12,12,270,hon?58:40,8);ctx.fillStyle=PAL['card'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
    txt(ctx,'Fired '+st.fired.toLocaleString('en-US')+'   Back past 90°: '+back,22,36,{s:13*k,w:700});
    if(hon)txt(ctx,'Predicted: '+(P.nuc?fmtOneIn(P.C):'none')+' past 90°',22,58,{s:12*k,c:PAL['cv-soft']});}
    // close-up circle
    ctx.save();ctx.beginPath();ctx.arc(ZX,ZY,ZR,0,6.29);ctx.fillStyle=PAL['cv-bg2'];ctx.fill();ctx.clip();
    if(P.nuc){const s=2*ZR/FIELD;
      // faint electron haze far out (atom is far bigger than this view)
      ctx.fillStyle=PAL['cv-e'];ctx.globalAlpha=0.35;const R2=rng(7);for(let i=0;i<4;i++){const a=R2()*6.28,r=ZR*(0.75+R2()*0.2);ctx.beginPath();ctx.arc(ZX+Math.cos(a)*r,ZY+Math.sin(a)*r,2,0,6.29);ctx.fill();}ctx.globalAlpha=1;
      st.zoom.forEach(z=>{if(!z.pts)return;const n=z.pts.length,head=Math.min(n-1,Math.floor(z.age/2.6*n));ctx.strokeStyle=PAL['s4'];ctx.lineWidth=2;ctx.globalAlpha=0.75;ctx.beginPath();for(let i=0;i<=head;i++){const q=z.pts[i];i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]);}ctx.stroke();ctx.globalAlpha=1;
        const q=z.pts[head];ctx.fillStyle=PAL['s4'];ctx.beginPath();ctx.arc(q[0],q[1],4.5,0,6.29);ctx.fill();});
      const rpx=Math.max(4,P.rn*s);const g=ctx.createRadialGradient(ZX-rpx*0.3,ZY-rpx*0.3,1,ZX,ZY,rpx);g.addColorStop(0,'#ff9a8a');g.addColorStop(1,'#a3201a');ctx.fillStyle=g;ctx.beginPath();ctx.arc(ZX,ZY,rpx,0,6.29);ctx.fill();
      if(ap){ctx.strokeStyle=PAL['s5'];ctx.setLineDash([4,4]);ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(ZX,ZY,P.d*s,0,6.29);ctx.stroke();ctx.setLineDash([]);
        txt(ctx,'d = '+P.d.toFixed(0)+' fm',ZX,ZY-P.d*s-8,{s:12*k,w:700,a:'center',c:PAL['s5']});}
      ctx.restore();
      txt(ctx,k<1.4?'Close-up near one '+P.m.name+' nucleus, 320 fm across':'Close-up: one nucleus',ZX,ZY+ZR+22,{s:12*k,w:700,a:'center'});
      txt(ctx,'+'+P.m.Z+' nucleus',ZX,ZY+(ap?P.d*2*ZR/FIELD:10)+20*k,{s:12*k,w:700,a:'center',c:PAL['s1']});}
    else{const R=ZR*0.8;const g=ctx.createRadialGradient(ZX,ZY,R*0.2,ZX,ZY,R);g.addColorStop(0,'rgba(232,120,140,0.40)');g.addColorStop(1,'rgba(232,120,140,0.18)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(ZX,ZY,R,0,6.29);ctx.fill();
      ctx.strokeStyle='rgba(200,80,100,0.6)';ctx.lineWidth=1.5;ctx.stroke();const R2=rng(11);
      for(let i=0;i<22;i++){const a=R2()*6.28,r=R*Math.sqrt(R2())*0.9;ctx.fillStyle=CL.FILL.electron;ctx.beginPath();ctx.arc(ZX+Math.cos(a)*r,ZY+Math.sin(a)*r,4,0,6.29);ctx.fill();}
      st.zoom.forEach(z=>{const y=ZY+z.b*0.8,x0=ZX-ZR,u=clamp(z.age/2.6,0,1),x=lerp(x0,ZX+ZR,u);ctx.strokeStyle=PAL['s4'];ctx.lineWidth=2;ctx.globalAlpha=0.75;ctx.beginPath();ctx.moveTo(x0,y);ctx.lineTo(x,y);ctx.stroke();ctx.globalAlpha=1;ctx.fillStyle=PAL['s4'];ctx.beginPath();ctx.arc(x,y,4.5,0,6.29);ctx.fill();});
      ctx.restore();
      txt(ctx,k<1.4?'Close-up of one atom, about 0.3 nm across':'Close-up: one atom',ZX,ZY+ZR+22,{s:12*k,w:700,a:'center'});
      if(k<1.4)txt(ctx,'spread-out + charge, electrons as “plums”',ZX,ZY-ZR-10,{s:12*k,a:'center',c:PAL['cv-soft']});}
    ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(ZX,ZY,ZR,0,6.29);ctx.stroke();
    ctx.setLineDash([3,4]);ctx.beginPath();ctx.moveTo(FX+3,FY-16);ctx.lineTo(ZX-ZR*0.92,ZY-ZR*0.4);ctx.moveTo(FX+3,FY+16);ctx.lineTo(ZX-ZR*0.92,ZY+ZR*0.4);ctx.stroke();ctx.setLineDash([]);
    if(P.nuc&&hon&&k<1.4)txt(ctx,'Each orange path is computed from Coulomb repulsion',ZX,ZY-ZR-10,{s:12*k,a:'center',c:PAL['cv-soft']});
  },
  thumbSetup(sim){sim.p.model='nuclear';sim.st.zacc=0.4;},
  thumbFrames:60
};
function drawTimeline(sim,ctx,k,t){const sel=ERAS.findIndex(e=>e.id===sim.p.era);sim.vis.cards=[];
  ctx.strokeStyle=PAL['line'];ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(20,CY0+CH+GAP/2+2);ctx.lineTo(780,CY0+CH+GAP/2+2);ctx.stroke();
  ERAS.forEach((e,i)=>{const R=cardRect(i),cur=i===sel;sim.vis.cards.push(R);rr(ctx,R.x,R.y,R.w,R.h,12);ctx.fillStyle=PAL['card'];ctx.fill();ctx.strokeStyle=cur?PAL['rj']:PAL['line'];ctx.lineWidth=cur?3:1;ctx.stroke();
    txt(ctx,e.year,R.x+14,R.y+28,{s:Math.min(20*k,30),w:800,c:cur?PAL['rj']:PAL['cv-ink']});txt(ctx,e.who,R.x+R.w-12,R.y+26,{s:12*k,w:700,a:'right',c:PAL['cv-soft']});
    drawModel(ctx,e.id,R.x+R.w/2,R.y+92,46,t,cur);
    const name=e.name;txt(ctx,name,R.x+R.w/2,R.y+R.h-30,{s:Math.min(14*k,20),w:700,a:'center'});
    if(k<1.4)txt(ctx,i===sel?'▲ details below the graph':'click for details',R.x+R.w/2,R.y+R.h-11,{s:12*k,a:'center',c:PAL['cv-soft']});});}
function drawModel(ctx,id,x,y,r,t,cur){const sp=RM?0:t;
  if(id==='dalton'){const g=ctx.createRadialGradient(x-r*0.35,y-r*0.35,4,x,y,r);g.addColorStop(0,'#c9ced6');g.addColorStop(1,'#4b5563');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r*0.85,0,6.29);ctx.fill();}
  else if(id==='thomson'){ctx.fillStyle='rgba(232,120,140,0.55)';ctx.beginPath();ctx.arc(x,y,r,0,6.29);ctx.fill();const R2=rng(3);for(let i=0;i<11;i++){const a=R2()*6.28,q=r*0.8*Math.sqrt(R2());ctx.fillStyle=CL.FILL.electron;ctx.beginPath();ctx.arc(x+Math.cos(a)*q,y+Math.sin(a)*q,4.5,0,6.29);ctx.fill();txt(ctx,'−',x+Math.cos(a)*q,y+Math.sin(a)*q,{s:9,w:800,a:'center',b:'middle',c:'#3a2c00'});}txt(ctx,'+',x+r*0.55,y-r*0.6,{s:16,w:800,c:'#a3201a'});}
  else if(id==='rutherford'){ctx.fillStyle='#c0392b';ctx.beginPath();ctx.arc(x,y,4,0,6.29);ctx.fill();const R2=rng(5);for(let i=0;i<8;i++){const a=R2()*6.28+sp*0.3,q=r*(0.45+R2()*0.5);ctx.fillStyle=CL.FILL.electron;ctx.beginPath();ctx.arc(x+Math.cos(a)*q,y+Math.sin(a)*q,4,0,6.29);ctx.fill();}
    ctx.strokeStyle=PAL['line'];ctx.setLineDash([3,4]);ctx.beginPath();ctx.arc(x,y,r,0,6.29);ctx.stroke();ctx.setLineDash([]);}
  else if(id==='bohr'){ctx.fillStyle='#c0392b';ctx.beginPath();ctx.arc(x,y,7,0,6.29);ctx.fill();[r*0.5,r*0.95].forEach((q,j)=>{ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(x,y,q,0,6.29);ctx.stroke();const n=j?3:2;for(let i=0;i<n;i++){const a=i*6.28/n+sp*(0.8-j*0.4);ctx.fillStyle=CL.FILL.electron;ctx.beginPath();ctx.arc(x+Math.cos(a)*q,y+Math.sin(a)*q,4.5,0,6.29);ctx.fill();}});}
  else if(id==='quantum'){const g=ctx.createRadialGradient(x,y,2,x,y,r);g.addColorStop(0,'rgba(212,160,23,0.75)');g.addColorStop(0.5,'rgba(212,160,23,0.28)');g.addColorStop(1,'rgba(212,160,23,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,6.29);ctx.fill();
    ctx.fillStyle='rgba(212,160,23,0.35)';ctx.beginPath();ctx.ellipse(x,y,r*0.95,r*0.32,0,0,6.29);ctx.fill();ctx.beginPath();ctx.ellipse(x,y,r*0.32,r*0.95,0,0,6.29);ctx.fill();ctx.fillStyle='#c0392b';ctx.beginPath();ctx.arc(x,y,3.5,0,6.29);ctx.fill();}
  else if(id==='chadwick'){const pos=[[0,0],[9,3],[-8,4],[3,-9],[-4,9],[8,-7],[-9,-5],[2,10]];pos.forEach((q,i)=>{const c=i%2?CL.FILL.neutron:CL.FILL.proton;const g=ctx.createRadialGradient(x+q[0]*1.6-3,y+q[1]*1.6-3,1,x+q[0]*1.6,y+q[1]*1.6,9);g.addColorStop(0,'#fff');g.addColorStop(0.35,c);g.addColorStop(1,CL.shade(c,-0.35));ctx.fillStyle=g;ctx.beginPath();ctx.arc(x+q[0]*1.6,y+q[1]*1.6,9,0,6.29);ctx.fill();});
    txt(ctx,'p⁺',x-r-6,y-r*0.6,{s:13,w:700,c:CL.FILL.proton,a:'center'});txt(ctx,'n⁰',x+r+6,y-r*0.6,{s:13,w:700,c:PAL['cv-soft'],a:'center'});}}
M.onClick=function(sim,x,y){if(sim.p.view!=='timeline'||!sim.vis.cards)return;const i=sim.vis.cards.findIndex(R=>x>=R.x&&x<=R.x+R.w&&y>=R.y&&y<=R.y+R.h);if(i>=0)BioLab.setValues(sim,{era:ERAS[i].id});};
M.controls[0].onChange=syncMode;
BioLab.register(M);
})();
