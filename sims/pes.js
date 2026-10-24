(function(){
'use strict';
const {clamp,lerp,rr,txt,pill,atLeast,PAL,FONT,RM,axes,legend,serColor,lvText}=BioLab.h;
const CL=window.ChemLab;

/* ---------- data: approximate binding energies (MJ/mol) from photoelectron spectra, H–Ca ----------
   Core values are the standard AP Chemistry PES table; the outermost value is replaced by ChemLab’s
   first ionization energy so every ChemLab tool agrees. */
const RAWBE={H:[1.31],He:[2.37],Li:[6.26,0.52],Be:[11.5,0.90],B:[19.3,1.36,0.80],C:[28.6,1.72,1.09],N:[39.6,2.45,1.40],O:[52.6,3.04,1.31],F:[67.2,3.88,1.68],Ne:[84.0,4.68,2.08],
  Na:[104,6.84,3.67,0.50],Mg:[126,9.07,5.31,0.74],Al:[151,12.1,7.19,1.09,0.58],Si:[178,15.1,10.3,1.46,0.79],P:[208,18.7,13.5,1.95,1.01],S:[239,22.7,16.5,2.05,1.00],
  Cl:[273,26.8,20.2,2.44,1.25],Ar:[309,31.5,24.1,2.82,1.52],K:[347,37.1,29.1,3.93,2.38,0.42],Ca:[390,42.7,34.0,4.65,2.90,0.59]};
const MAXZ=20;
function peaksOf(Z){const e=CL.el(Z),cfg=CL.config(Z),be=RAWBE[e.sym].slice();be[be.length-1]=e.ie1/1000;
  return cfg.map((o,i)=>({lab:o.label,n:o.n,l:o.l,e:o.e,BE:be[i]}));}
const PEAKS={};for(let z=1;z<=MAXZ;z++)PEAKS[z]=peaksOf(z);
const SRC={uv:{l:'UV lamp (He, 21.2 eV)',s:'UV lamp',E:21.22*0.096485},al:{l:'Soft X-ray (Al Kα, 1487 eV)',s:'X-ray',E:1486.6*0.096485},cu:{l:'Hard X-ray (Cu Kα, 8048 eV)',s:'Hard X-ray',E:8048*0.096485}};
const hv=p=>SRC[p.src].E;
const reach=p=>PEAKS[p.el].filter(k=>k.BE<hv(p));
const subCol=l=>l===0?PAL['s2']:PAL['s4'];
const f3=v=>v>=100?v.toFixed(0):v>=10?v.toFixed(1):v.toFixed(2);

/* ---------- layout ---------- */
const SRCX=8,SRCY=82,SRCW=114,AX=236,AY=114,RN=[0,22,42,62,80];
const ACX=528,ACY=206,RIN=48,ROUT=112;          // hemispherical analyzer
const CARDX=644,CARDW=148;
const BEmin=0.3,BEmax=500,PL=60,PR=780;
const xBE=be=>PR-(Math.log10(be)-Math.log10(BEmin))/(Math.log10(BEmax)-Math.log10(BEmin))*(PR-PL);
const plotT=268;const plotB=k=>450-24*k-14;
const SIG=0.024,BINW=0.01,NB=Math.ceil((Math.log10(BEmax)-Math.log10(BEmin))/BINW);
const RofKE=ke=>RIN+8+(ROUT-RIN-16)*clamp((Math.log10(ke+0.5)-Math.log10(0.5))/(Math.log10(800)-Math.log10(0.5)),0,1);

function sync(sim){const d=sim.def;if(!sim.ui||!sim.ui.sec)return;
  d.controls.forEach(c=>{const cid=d.id+'-'+c.id,e=document.getElementById(cid)||document.getElementById(cid+'-l');if(!e)return;const w=e.closest('.ctl');if(w)w.hidden=!atLeast(c.lvl)||(c.show?!c.show(sim):false);});
  d.metrics.forEach(m=>{const t=sim.ui.tiles[m.id];if(!t)return;const w=t.num.closest('.tile');if(w)w.hidden=!!m.hideTile||!atLeast(m.lvl);});
  const btns=[...sim.ui.sec.querySelectorAll('.actions button')];d.actions.forEach((a,i)=>{const b=btns[i];if(b)b.hidden=!atLeast(a.lvl)||(a.show?!a.show(sim):false);});}
let mystLock=false;
function clearSpec(sim){const st=sim.st;if(!st)return;st.bins=new Float32Array(NB);st.sub={};st.C=0;st.acc=0;st.fly=null;st.last=null;}
function onEl(sim){if(sim.st){if(!mystLock){sim.st.myst=false;}clearSpec(sim);}sync(sim);}

/* ---------- detection ---------- */
function detect(sim,n){const p=sim.p,st=sim.st,R=reach(p);if(!R.length)return;const tot=R.reduce((a,k)=>a+k.e,0);
  for(let i=0;i<n;i++){let r=Math.random()*tot,pk=R[0];for(const k of R){r-=k.e;if(r<=0){pk=k;break;}}
    const lg=Math.log10(pk.BE)+BioLab.h.randn()*SIG;const b=Math.floor((lg-Math.log10(BEmin))/BINW);if(b>=0&&b<NB)st.bins[b]++;st.sub[pk.lab]=(st.sub[pk.lab]||0)+1;st.C++;}}
function launch(sim){const p=sim.p,st=sim.st,R=reach(p);if(!R.length){st.fly=null;return;}const tot=R.reduce((a,k)=>a+k.e,0);let r=Math.random()*tot,pk=R[0];for(const k of R){r-=k.e;if(r<=0){pk=k;break;}}
  const idx=Math.floor(Math.random()*pk.e);st.fly={pk,idx,t:0,KE:hv(p)-pk.BE};}
const T1=0.4,T2=0.45,T3=0.6,T4=0.35;

// numbers for the explanations
const pk=(z,lab)=>PEAKS[z].find(k=>k.lab===lab);

const SIM={
  id:'pes',hash:'pes',apUnit:3,order:4,tab:'Photoelectron spectroscopy',kind:'Simulation',
  prereq:['econfig','light'],next:['trends'],
  card:'Blast atoms with X-rays, measure the speed of the electrons that fly out, and watch a photoelectron spectrum build peak by peak.',
  title:'Photoelectron spectroscopy (PES)',
  lede:{bio:'A high-energy photon knocks one electron out of an atom. Measure how much energy it took, for thousands of electrons, and the peaks reveal how the electrons are arranged.',
        honors:'Each peak is one sublevel. Its position is the binding energy (how tightly the nucleus holds those electrons) and its height is the number of electrons in it.',
        ap:'Explain peak positions with Coulomb’s law: more protons and smaller distance mean higher binding energy. Compare elements, and see why 2s and 2p split.'},
  scale:{bio:'One atom of the sample, about 0.1–0.4 nm across, drawn far larger than life. Binding energies are in megajoules per mole (1 MJ/mol = 1000 kJ/mol).',
         honors:'The binding energy axis is logarithmic and runs high to low from left to right, the convention on AP Chemistry PES graphs. The 1s peak of calcium (390 MJ/mol) is about 660 times the 4s peak (0.59 MJ/mol).'},
  timeless:true,animated:true,chChange:0.6,chReveal:4.5,
  controls:[
    {id:'el',label:'Element',type:'select',def:11,lvl:'bio',options:Array.from({length:MAXZ},(_,i)=>({v:i+1,l:(i+1)+' · '+CL.el(i+1).name+' ('+CL.el(i+1).sym+')'})),onChange:onEl},
    {id:'src',label:'Photon source',type:'seg',def:'cu',lvl:'honors',noTrial:true,options:[{v:'uv',l:'UV lamp'},{v:'al',l:'Soft X-ray'},{v:'cu',l:'Hard X-ray'}],help:'UV photons (2.05 MJ/mol) free only loosely held electrons. Al Kα X-rays carry 143 MJ/mol; Cu Kα carry 777 MJ/mol.',onChange:s=>{clearSpec(s.st?s:s);}},
    {id:'cmp',label:'Compare with',type:'select',def:0,lvl:'honors',noTrial:true,options:[{v:0,l:'(nothing)'}].concat(Array.from({length:MAXZ},(_,i)=>({v:i+1,l:CL.el(i+1).name+' ('+CL.el(i+1).sym+')'})))}
  ],
  actions:[
    {id:'clear',label:'Clear the spectrum',lvl:'bio',run(sim){clearSpec(sim);}},
    {id:'myst',label:'Mystery element',lvl:'bio',primary:true,run(sim){let z;do{z=1+Math.floor(Math.random()*MAXZ);}while(z===sim.p.el);mystLock=true;BioLab.setValues(sim,{el:z,cmp:0});mystLock=false;sim.st.myst=true;clearSpec(sim);}},
    {id:'reveal',label:'Reveal the element',lvl:'bio',run(sim){sim.st.myst=false;}}
  ],
  init(sim){const st={myst:false,ph:0};st.bins=new Float32Array(NB);st.sub={};st.C=0;st.acc=0;st.fly=null;st.last=null;st.wait=0.3;return st;},
  step(sim,dt){const st=sim.st;st.ph+=dt;st.acc+=dt*160;const n=Math.floor(st.acc);st.acc-=n;if(st.C<20000)detect(sim,n);
    if(st.fly){st.fly.t+=dt;if(st.fly.t>=T1+T2+T3+T4){st.last=st.fly;st.fly=null;st.wait=0.15;}}
    else{st.wait-=dt;if(st.wait<=0)launch(sim);}},
  metrics:[
    {id:'elm',label:'Sample',lvl:'bio',text:true,get:s=>s.st.myst?'Mystery element':CL.el(s.p.el).name+' ('+CL.el(s.p.el).sym+'), Z = '+s.p.el},
    {id:'cnt',label:'Electrons counted',lvl:'bio',min:0,max:null,d:0,noTrial:true,get:s=>s.st.C},
    {id:'npk',label:'Peaks this source can reach',lvl:'bio',min:0,max:6,d:0,get:s=>reach(s.p).length},
    {id:'hvt',label:'Photon energy hν',lvl:'honors',text:true,noTrial:true,get:s=>f3(hv(s.p))+' MJ/mol'},
    {id:'lst',label:'Last electron: KE measured → binding energy',lvl:'honors',text:true,noTrial:true,get:s=>{const L=s.st.last;return L?f3(L.KE)+' → '+f3(L.pk.BE)+' MJ/mol ('+L.pk.lab+')':'waiting for the first electron';}},
    {id:'outer',label:'Outermost peak vs. first ionization energy',lvl:'ap',text:true,noTrial:true,get:s=>{const P=PEAKS[s.p.el],o=P[P.length-1];return o.BE.toFixed(2)+' MJ/mol = '+Math.round(o.BE*1000)+' kJ/mol = IE₁';}},
    {id:'be1',label:'1s binding energy',unit:'MJ/mol',lvl:'bio',hideTile:true,d:2,min:0,max:null,get:s=>PEAKS[s.p.el][0].BE},
    {id:'beo',label:'Outermost binding energy',unit:'MJ/mol',lvl:'bio',hideTile:true,d:2,min:0,max:null,get:s=>{const P=PEAKS[s.p.el];return P[P.length-1].BE;}},
    {id:'zz',label:'Atomic number',lvl:'bio',hideTile:true,d:0,min:0,max:null,get:s=>s.p.el}
  ],
  graphs:[{id:'ie',label:'Outermost binding energy vs Z (periodicity)',lvl:'bio',custom:true},{id:'bez',label:'1s binding energy vs Z (nuclear charge)',lvl:'honors',custom:true}],
  defaultGraph:'ie',
  plot(sim,ctx,box,id){const p=sim.p,hide=sim.st.myst;const isIE=id==='ie';const ymax=isIE?2.6:420;
    const ax=axes(ctx,box,{xmin:0.5,xmax:20.5,ymin:0,ymax,xl:'Atomic number Z',yl:isIE?'Outermost binding energy (MJ/mol)':'1s binding energy (MJ/mol)',xd:0});
    ctx.save();ctx.beginPath();ctx.rect(box.L,box.T,box.W,box.H);ctx.clip();
    const v=z=>isIE?PEAKS[z][PEAKS[z].length-1].BE:PEAKS[z][0].BE;
    ctx.strokeStyle=serColor(0);ctx.lineWidth=2;ctx.beginPath();for(let z=1;z<=MAXZ;z++){z===1?ctx.moveTo(ax.X(z),ax.Y(v(z))):ctx.lineTo(ax.X(z),ax.Y(v(z)));}ctx.stroke();
    for(let z=1;z<=MAXZ;z++){const on=z===p.el&&!hide;ctx.fillStyle=on?serColor(1):serColor(0);ctx.beginPath();ctx.arc(ax.X(z),ax.Y(v(z)),on?7:3.5,0,6.29);ctx.fill();
      if(isIE&&[2,10,18].includes(z))txt(ctx,CL.el(z).sym,ax.X(z),ax.Y(v(z))-10,{s:12,a:'center',c:PAL['muted'],w:700});
      if(isIE&&[3,11,19].includes(z))txt(ctx,CL.el(z).sym,ax.X(z),ax.Y(v(z))-10,{s:12,a:'center',c:PAL['muted'],w:700});}
    ctx.restore();
    legend(ctx,box.L+12,box.T+10,[{label:isIE?'peaks at noble gases, drops at alkali metals':'grows roughly as Z²: more protons, tighter grip',color:serColor(0)}]);},
  infoPanel(sim){const p=sim.p,hon=atLeast('honors'),ap=atLeast('ap'),hide=sim.st.myst;const P=PEAKS[p.el],R=reach(p);
    let h='<div class="p-head"><h3>'+(hide?'Mystery spectrum':'Peaks for '+CL.el(p.el).name)+'</h3></div>';
    if(hide){h+='<p>Read the spectrum: count the peaks, compare their heights, and note how far left the biggest binding energy sits. Then press <b>Reveal the element</b>.</p>';return h;}
    h+='<p>'+P.map(k=>'<b>'+k.lab+'</b>: '+f3(k.BE)+' MJ/mol, '+k.e+' e⁻'+(k.BE>hv(p)?' (out of reach)':'')).join(' · ')+'</p>';
    h+='<p>Configuration: '+CL.configText(p.el)+'. Each peak is one sublevel; the height counts its electrons.</p>';
    if(hon){const L=sim.st.last;if(L)h+='<p><b>Last electron:</b> BE = hν − KE = '+f3(hv(p))+' − '+f3(L.KE)+' = <b>'+f3(L.pk.BE)+' MJ/mol</b> ('+L.pk.lab+').</p>';}
    if(ap&&p.el>1){const o=P[P.length-1];const core=P.filter(k=>k.n<o.n).reduce((a,k)=>a+k.e,0);h+='<p><b>Coulomb’s law:</b> F ∝ q₁q₂/r². The '+o.lab+' electron feels about Z − core = '+p.el+' − '+core+' = <b>'+(p.el-core)+'+</b> of attraction at the radius of shell '+o.n+'. The 1s electrons feel nearly the full '+p.el+'+ up close, so they sit far to the left.</p>';}
    if(p.cmp&&hon){const Q=PEAKS[p.cmp];h+='<p><b>Compare '+CL.el(p.cmp).name+':</b> '+Q.map(k=>k.lab+' '+f3(k.BE)).join(', ')+' MJ/mol.</p>';}
    return h;},
  narrate(sim){const p=sim.p,st=sim.st,P=PEAKS[p.el],R=reach(p),hide=st.myst,name=hide?'the mystery element':CL.el(p.el).name.toLowerCase();
    if(!R.length)return 'Each photon from the '+SRC[p.src].s+' carries only '+f3(hv(p))+' MJ/mol, less than any binding energy in '+name+'. <b>No electrons escape</b>, so no peaks appear.';
    let s='Photons knock electrons out of '+name+'. Measuring each electron’s kinetic energy tells you its <b>binding energy = hν − KE</b>. ';
    if(R.length<P.length)s+='This source reaches only '+R.length+' of the '+P.length+' sublevels; the inner electrons are held too tightly. ';
    else s+='The spectrum shows <b>'+P.length+' peak'+(P.length>1?'s':'')+'</b>, one per sublevel'+(hide?'':' ('+P.map(k=>k.lab).join(', ')+')')+'. ';
    if(st.C<300)s+='Keep collecting: the peaks sharpen as more electrons arrive.';else s+='Taller peaks mean more electrons in that sublevel.';
    return s;},
  tour:[
    {title:'A photoelectron spectrometer',text:'A beam of high-energy photons hits a sample of atoms. Each photon that hits can knock out one electron, which flies into an energy analyzer.',focus:[8,24,628,214],speed:0.4,setup(sim){BioLab.setValues(sim,{el:11,src:'cu',cmp:0});clearSpec(sim);}},
    {title:'Photon in, electron out',text:'The photon gives all of its energy to one electron. Part of that energy pulls the electron free of the nucleus (the binding energy). The rest becomes the electron’s kinetic energy.',focus:[SRCX-6,24,AX+92-SRCX,184],speed:0.3},
    {title:'Measure the kinetic energy',text:'The curved analyzer bends slow electrons into tight paths and fast electrons into wide ones, so where each electron lands tells you its kinetic energy.',focus:[ACX-ROUT-14,ACY-ROUT-26,2*ROUT+28,ROUT+48],speed:0.3},
    {title:'Binding energy = hν − KE',text:{bio:'You know the photon’s energy and you measured the electron’s, so subtract to find how tightly that electron was held.',honors:'BE = hν − KE. Tightly held electrons (small KE) have large binding energies and land on the left of the spectrum.'},focus:[CARDX-6,24,CARDW+10,190],speed:0.4},
    {title:'One peak per sublevel',text:'Sodium is 1s² 2s² 2p⁶ 3s¹, and its spectrum has four peaks. The 1s peak is far left: those electrons sit closest to the nucleus and need the most energy to remove.',focus:[PL-50,plotT-30,PR-PL+60,190],speed:1},
    {title:'Taller peak, more electrons',text:'The 2p peak is three times taller than the 2s peak because 2p holds 6 electrons and 2s holds 2. The 3s peak is half the height of 2s: one electron.',focus:[PL-50,plotT-30,PR-PL+60,190],speed:1},
    {lvl:'honors',title:'More protons, tighter grip',text:{honors:'Compare sodium (11 protons) with magnesium (12). Every magnesium peak sits to the left: the extra proton pulls every electron in harder.',ap:'Coulomb’s law: F ∝ q₁q₂/r². Raising the nuclear charge by one raises every binding energy; magnesium’s 1s is 126 MJ/mol vs sodium’s 104.'},focus:[PL-50,plotT-30,PR-PL+60,190],speed:1,setup(sim){BioLab.setValues(sim,{el:12,cmp:11});}},
    {lvl:'ap',title:'X-rays vs ultraviolet',text:'A UV lamp gives photons of only 2.05 MJ/mol, enough for valence electrons alone. Chemists use UV-PES for bonding electrons and X-ray PES for core electrons.',focus:[[SRCX-6,SRCY-10,SRCW+12,80],[PL-50,plotT-30,PR-PL+60,190]],speed:1,setup(sim){BioLab.setValues(sim,{el:18,cmp:0,src:'uv'});}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{el:11,src:'cu',cmp:0});clearSpec(sim);},
  onChallenge(sim,ch,phase){if(ch&&ch.instant&&ch.set&&phase==='done'){BioLab.setValues(sim,ch.set);sim.st.myst=false;sim.infoDirty=true;}},
  challenges:[
    {lvl:'bio',q:'Neon (1s² 2s² 2p⁶) is in the spectrometer. When the spectrum fills in, how tall will the 2p peak be compared with the 2s peak?',choices:['The same height','Three times as tall','Half as tall'],correct:1,
     baseline:{el:10,src:'cu',cmp:0},change:{},changeText:'Collecting electrons from neon',
     explain:{bio:'2p holds 6 electrons and 2s holds 2, so the 2p peak grows three times as tall. The height of a peak counts the electrons in that sublevel.'}},
    {lvl:'bio',instant:true,set:{el:11,src:'cu',cmp:0},q:'Which peak in sodium’s spectrum sits farthest to the left (the largest binding energy)?',choices:['1s, the electrons closest to the nucleus','3s, the single valence electron','2p, the biggest peak'],correct:0,
     explain:{bio:'Sodium’s 1s electrons need '+pk(11,'1s').BE+' MJ/mol to remove, the 3s electron only '+pk(11,'3s').BE.toFixed(2)+'. Electrons close to the nucleus are held much more tightly.'}},
    {lvl:'bio',instant:true,set:{el:3,src:'cu',cmp:0},q:'A spectrum has two peaks: height 2 at 6.26 MJ/mol and height 1 at 0.52 MJ/mol. Which element is it?',choices:['Helium','Lithium','Beryllium','Hydrogen'],correct:1,
     explain:{bio:'Two peaks means two sublevels; heights 2 and 1 mean 1s² 2s¹, three electrons in all. That is lithium. The model now shows lithium’s spectrum.'}},
    {lvl:'honors',instant:true,set:{el:12,cmp:11,src:'cu'},q:'Compare magnesium (Z = 12) with sodium (Z = 11). Where is magnesium’s 1s peak?',choices:['At a higher binding energy (farther left)','At a lower binding energy (farther right)','In the same place, since both are 1s'],correct:0,
     explain:{honors:'Mg 1s: '+pk(12,'1s').BE+' MJ/mol; Na 1s: '+pk(11,'1s').BE+' MJ/mol. One more proton pulls every electron harder, so all of magnesium’s peaks shift left. The dashed peaks show sodium.'}},
    {lvl:'honors',q:'Argon is in the spectrometer with hard X-rays. You switch to a UV lamp (2.05 MJ/mol photons). Which peaks still appear?',choices:['All five','Only the 3p peak','None of them'],correct:1,
     baseline:{el:18,src:'cu',cmp:0},change:{src:'uv'},changeText:'Photon source switched to the UV lamp',
     explain:{honors:'A photon can only remove an electron whose binding energy is less than hν. Only 3p ('+pk(18,'3p').BE.toFixed(2)+' MJ/mol) is below 2.05 MJ/mol; 3s needs '+pk(18,'3s').BE+' MJ/mol.'}},
    {lvl:'honors',instant:true,set:{el:7,src:'cu',cmp:0},q:'A spectrum has three peaks with relative heights 2 : 2 : 3. Which element is it?',choices:['Boron','Carbon','Nitrogen','Oxygen'],correct:2,
     explain:{honors:'Heights 2, 2, 3 mean 1s² 2s² 2p³: seven electrons, so nitrogen. Boron is 2 : 2 : 1, carbon 2 : 2 : 2, oxygen 2 : 2 : 4.'}},
    {lvl:'ap',instant:true,set:{el:8,cmp:7,src:'cu'},q:'Oxygen has one more proton than nitrogen, yet its 2p peak is at lower binding energy (1.31 vs 1.40 MJ/mol). Why?',choices:['Oxygen’s 2p electrons are in a higher shell','In oxygen one 2p orbital holds a pair, and the paired electrons repel each other','Oxygen has more core electrons shielding the 2p electrons'],correct:1,
     explain:{ap:'Oxygen is 2p⁴, so one 2p orbital holds two electrons. Their extra repulsion makes one of them easier to remove, outweighing the extra proton. Both have the same 2 core electrons, and 2p is n = 2 in both.'}},
    {lvl:'ap',instant:true,set:{el:6,src:'cu',cmp:0},q:'In carbon, why is the 2s peak (1.72 MJ/mol) at a higher binding energy than the 2p peak (1.09 MJ/mol)?',choices:['2s electrons penetrate closer to the nucleus, so they are less shielded','2s holds more electrons than 2p','2p electrons are in a higher shell'],correct:0,
     explain:{ap:'Both are n = 2, but an s orbital has more electron density near the nucleus. 2s electrons slip inside the 1s shielding more often and feel a larger effective nuclear charge.'}},
    {lvl:'ap',instant:true,set:{el:14,src:'cu',cmp:0},q:'Silicon has five peaks. Reading left to right (highest to lowest binding energy), what are their relative heights?',choices:['2 : 2 : 6 : 2 : 2','2 : 8 : 4','2 : 2 : 6 : 2 : 4','1 : 1 : 3 : 1 : 1'],correct:0,
     explain:{ap:'Silicon is 1s² 2s² 2p⁶ 3s² 3p²: 1s (178), 2s (15.1), 2p (10.3), 3s (1.46), 3p (0.79 MJ/mol), with heights 2, 2, 6, 2, 2.'}}
  ],
  lab:{bio:'<p><b>Question:</b> What does a photoelectron spectrum tell you about an atom?</p><ol><li>Collect spectra for H, He, Li, Be, B, C, N and O. Record a trial for each.</li><li>For each, count the peaks and write the height of each peak.</li><li>Write the electron configuration next to each spectrum.</li></ol><p>Explain how the number of peaks and their heights match the configuration.</p>',
       honors:'<p><b>Question:</b> How does nuclear charge affect binding energy?</p><ol><li>Collect spectra for Li through Ne. Record a trial for each.</li><li>On the Trials graph, plot Atomic number (x) against 1s binding energy (y).</li><li>Use Mystery element three times and identify each one from its spectrum.</li></ol><p>Describe the trend in the 1s peak and explain it with the number of protons.</p>',
       ap:'<p><b>Question:</b> Can PES explain the trend in first ionization energy?</p><ol><li>Record trials for Z = 1 to 20.</li><li>Plot Atomic number (x) against Outermost binding energy (y).</li><li>Compare Be and B, and N and O, using Compare with.</li></ol><p><b>Claim–evidence–reasoning:</b> Use the peaks (sublevel energies, pairing) and Coulomb’s law to explain both dips in the ionization energy trend.</p>'},
  terms:[{t:'Photoelectron spectroscopy (PES)',d:'Measuring the energies of electrons knocked out of atoms by high-energy photons.'},{t:'Binding energy',d:'The energy needed to remove an electron from its sublevel, in MJ/mol here.'},{t:'Peak height',d:'Proportional to the number of electrons in that sublevel.'},
    {lvl:'honors',t:'BE = hν − KE',d:'Binding energy equals the photon energy minus the measured kinetic energy of the ejected electron.'},{lvl:'honors',t:'Core electrons',d:'Electrons in inner shells; they shield valence electrons from the nucleus.'},{lvl:'honors',t:'Valence electrons',d:'Outermost electrons; the rightmost peak, whose binding energy equals the first ionization energy.'},
    {lvl:'ap',t:'Coulomb’s law',d:'F ∝ q₁q₂/r²: more nuclear charge or a smaller distance means a stronger attraction and a higher binding energy.'},{lvl:'ap',t:'Penetration',d:'s electrons spend more time near the nucleus than p electrons of the same shell, so they are less shielded.'}],
  about:'<p>Binding energies (MJ/mol) are the approximate values from the standard AP Chemistry PES table, with each outermost value set to ChemLab’s first ionization energy so the tools agree. Photon energies: He I UV lamp 21.2 eV, Al Kα 1487 eV, Cu Kα 8048 eV (1 eV = 0.0965 MJ/mol). The model treats every reachable electron as equally likely to be ejected; in real spectra, the chance depends on the photon energy and the sublevel, so real peak heights are not exactly proportional to electron count. Peaks are broadened with a fixed instrument resolution. Spin–orbit splitting of p peaks (for example 2p₁/₂ and 2p₃/₂) is left out, as on AP Chemistry spectra. The detector counts 160 electrons per second; the drawing shows one at a time.</p>',
  initVis(sim){},
  draw(sim,ctx,vdt,k,t){const p=sim.p,st=sim.st,hon=atLeast('honors'),ap=atLeast('ap'),hide=st.myst;const P=PEAKS[p.el];
    ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
    // source
    rr(ctx,SRCX,SRCY,SRCW,58,8);ctx.fillStyle='#3f6fb0';ctx.fill();txt(ctx,SRC[p.src].s,SRCX+SRCW/2,SRCY+29,{s:12*k,w:700,a:'center',b:'middle',c:'#fff'});
    // atom
    const f=st.fly;
    if(hide){ctx.fillStyle=PAL['cv-bg2'];ctx.beginPath();ctx.arc(AX,AY,72,0,6.29);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.stroke();txt(ctx,'?',AX,AY+2,{s:44*k,w:800,a:'center',b:'middle',c:PAL['cv-soft']});}
    else{const maxn=P[P.length-1].n;for(let n=1;n<=maxn;n++){ctx.strokeStyle=PAL['line'];ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(AX,AY,RN[n],0,6.29);ctx.stroke();}
      CL.drawAtom(ctx,AX,AY,10,'',{color:'#c0392b',label:''});
      const rot=RM?0:t*0.35;
      for(let n=1;n<=maxn;n++){const subs=P.filter(k=>k.n===n);const tot=subs.reduce((a,k)=>a+k.e,0);let j=0;subs.forEach(sk=>{for(let i=0;i<sk.e;i++,j++){const a=rot*(1/n)+j/tot*6.283+n;const x=AX+Math.cos(a)*RN[n],y=AY+Math.sin(a)*RN[n];
            const gone=f&&f.pk.lab===sk.lab&&f.idx===i&&f.t>T1;ctx.fillStyle=gone?'transparent':subCol(sk.l);if(gone){ctx.strokeStyle=subCol(sk.l);ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(x,y,4.5,0,6.29);ctx.stroke();}else{ctx.beginPath();ctx.arc(x,y,4.5,0,6.29);ctx.fill();}}});}
      txt(ctx,'+'+p.el,AX,AY+1,{s:10,w:800,a:'center',b:'middle',c:'#fff'});}
    // analyzer
    ctx.save();ctx.beginPath();ctx.arc(ACX,ACY,ROUT,Math.PI,0);ctx.arc(ACX,ACY,RIN,0,Math.PI,true);ctx.closePath();ctx.fillStyle=PAL['cv-bg2'];ctx.fill();ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=2;ctx.stroke();ctx.restore();
    txt(ctx,'energy analyzer',ACX,ACY-ROUT-8,{s:12*k,w:700,a:'center',c:PAL['cv-soft']});
    ctx.fillStyle='#59616b';ctx.fillRect(ACX+RIN+4,ACY,ROUT-RIN-8,9);txt(ctx,'detector',ACX+(RIN+ROUT)/2,ACY+12+12*k,{s:12*k,a:'center',c:PAL['cv-soft']});
    // flying photon / electron
    if(f&&!hide||f&&hide){const pkk=f.pk;const n=pkk.n,tot=P.filter(k=>k.n===n).reduce((a,k)=>a+k.e,0);let j=0;for(const sk of P.filter(k=>k.n===n)){if(sk.lab===pkk.lab){j+=f.idx;break;}j+=sk.e;}
      const a=(RM?0:t*0.35)*(1/n)+j/tot*6.283+n;const ex=hide?AX:AX+Math.cos(a)*RN[n],ey=hide?AY:AY+Math.sin(a)*RN[n];const R=RofKE(f.KE);
      if(f.t<T1){const u=f.t/T1,x=lerp(SRCX+SRCW,ex,u),y=lerp(SRCY+29,ey,u);squig(ctx,SRCX+SRCW,SRCY+29,x,y,PAL['s5']);}
      else{let x,y;const c=subCol(pkk.l);
        if(f.t<T1+T2){const u=(f.t-T1)/T2;x=lerp(ex,ACX-R,u);y=lerp(ey,ACY,u);}
        else if(f.t<T1+T2+T3){const u=(f.t-T1-T2)/T3;const ang=Math.PI+u*Math.PI;x=ACX+Math.cos(ang)*R;y=ACY+Math.sin(ang)*R;}
        else{x=ACX+R;y=ACY+3;}
        ctx.fillStyle=c;ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=1;ctx.beginPath();ctx.arc(x,y,6,0,6.29);ctx.fill();ctx.stroke();}}
    // card
    rr(ctx,CARDX,28,CARDW,182,10);ctx.fillStyle=PAL['card'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
    const L=f&&f.t>T1+T2+T3?f:st.last;const cx=CARDX+12,rx=CARDX+CARDW-12;
    txt(ctx,'MJ/mol',CARDX+CARDW/2,28+18*k,{s:12*k,w:700,a:'center',c:PAL['cv-soft']});
    const rows=[['hν',f3(hv(p))],['− KE',L?f3(L.KE):'…'],['= BE',L?f3(L.pk.BE):'…']];
    rows.forEach((r,i)=>{const y=28+18*k+12+(i+1)*30*k*0.95;txt(ctx,r[0],cx,y,{s:14*k,w:700,c:i===2?PAL['cv-ink']:PAL['cv-soft']});txt(ctx,r[1],rx,y,{s:14*k,w:800,a:'right',c:i===2&&L?subCol(L.pk.l):PAL['cv-ink']});});
    // spectrum
    const yB=plotB(k),yT=plotT,ymax=Math.max(...P.map(k2=>k2.e),p.cmp?Math.max(...PEAKS[p.cmp].map(k2=>k2.e)):0)+0.8;const Y=v=>yB-v/ymax*(yB-yT);
    ctx.strokeStyle=PAL['g-grid'];ctx.lineWidth=1;for(let v=0;v<=ymax;v+=ymax>4?2:1){ctx.beginPath();ctx.moveTo(PL,Y(v));ctx.lineTo(PR,Y(v));ctx.stroke();if(v>0)txt(ctx,String(v),PL-6,Y(v),{s:12*k,a:'right',b:'middle',c:PAL['g-axis']});}
    ctx.strokeStyle=PAL['g-axis'];ctx.beginPath();ctx.moveTo(PL,yT-4);ctx.lineTo(PL,yB);ctx.lineTo(PR,yB);ctx.stroke();
    [500,200,100,50,20,10,5,2,1,0.5].forEach(v=>{const x=xBE(v);ctx.beginPath();ctx.moveTo(x,yB);ctx.lineTo(x,yB+4);ctx.stroke();txt(ctx,String(v),x,yB+4+12*k,{s:12*k,a:'center',c:PAL['g-axis']});});
    txt(ctx,'← higher binding energy (MJ/mol, log scale)',(PL+PR)/2,yB+8+24*k,{s:12*k,a:'center',c:PAL['muted']});
    ctx.save();ctx.translate(14,(yT+yB)/2);ctx.rotate(-Math.PI/2);txt(ctx,'electrons',0,0,{s:12*k,a:'center',b:'middle',c:PAL['muted']});ctx.restore();
    // UV/X-ray reach line
    const xh=xBE(hv(p));if(xh>PL&&xh<PR){ctx.strokeStyle=PAL['s5'];ctx.setLineDash([5,4]);ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(xh,yT);ctx.lineTo(xh,yB);ctx.stroke();ctx.setLineDash([]);txt(ctx,'hν',xh+4,yT+12*k,{s:12*k,w:700,c:PAL['s5']});}
    ctx.save();ctx.beginPath();ctx.rect(PL,yT-40,PR-PL,yB-yT+40);ctx.clip();
    // compare (dashed ideal peaks)
    if(p.cmp&&hon){ctx.strokeStyle=PAL['s6'];ctx.lineWidth=2;ctx.setLineDash([5,4]);PEAKS[p.cmp].forEach(k2=>{ctx.beginPath();for(let dx=-0.06;dx<=0.06;dx+=0.004){const lg=Math.log10(k2.BE)+dx,h=k2.e*Math.exp(-dx*dx/(2*SIG*SIG));const x=xBE(Math.pow(10,lg));dx<=-0.06?ctx.moveTo(x,Y(h)):ctx.lineTo(x,Y(h));}ctx.stroke();});ctx.setLineDash([]);}
    // measured histogram
    const R=reach(p),Na=R.reduce((a,k2)=>a+k2.e,0);if(st.C>0){const sc=Na/st.C*(SIG*Math.sqrt(2*Math.PI)/BINW);const wpx=Math.abs(xBE(Math.pow(10,Math.log10(BEmin)+BINW))-xBE(BEmin));
      for(let b=0;b<NB;b++){if(!st.bins[b])continue;const be=Math.pow(10,Math.log10(BEmin)+(b+0.5)*BINW);const near=R.reduce((a,k2)=>Math.abs(Math.log10(k2.BE)-Math.log10(be))<Math.abs(Math.log10(a.BE)-Math.log10(be))?k2:a,R[0]);
        const v=st.bins[b]*sc;ctx.fillStyle=subCol(near.l);ctx.fillRect(xBE(be)-wpx/2,Y(v),wpx+0.5,yB-Y(v));}}
    ctx.restore();
    // peak labels (avoid overlaps by stacking)
    ctx.font='700 '+(12*k)+'px '+FONT;const placed=[];
    R.slice().sort((a,b)=>b.BE-a.BE).forEach(k2=>{const est=st.C?(st.sub[k2.lab]||0)/st.C*Na:0;if(est<0.3)return;const lab=hide&&!hon?'?':k2.lab;const w=ctx.measureText(lab).width;const x=xBE(k2.BE);let top=0;if(st.C){const sc=Na/st.C*(SIG*Math.sqrt(2*Math.PI)/BINW);const c0=Math.floor((Math.log10(k2.BE)-Math.log10(BEmin))/BINW);for(let b=c0-6;b<=c0+6;b++)if(b>=0&&b<NB)top=Math.max(top,st.bins[b]*sc);}
      let y=Math.max(yT+4,Y(Math.max(top,est))-7);
      for(const q of placed){if(Math.abs(q.x-x)<(q.w+w)/2+4&&Math.abs(q.y-y)<14*k)y=q.y-15*k;}placed.push({x,y,w});txt(ctx,lab,x,y,{s:12*k,w:700,a:'center',c:subCol(k2.l)});});
    if(p.cmp&&hon)txt(ctx,'dashed: '+CL.el(p.cmp).name,PR-4,yT-8,{s:12*k,w:700,a:'right',c:PAL['s6']});
    if(!R.length)txt(ctx,'No electrons escape: photons have too little energy',(PL+PR)/2,(yT+yB)/2,{s:14*k,w:700,a:'center',c:PAL['cv-soft']});
    txt(ctx,'s',PL+8,yT-8,{s:12*k,w:800,c:PAL['s2']});txt(ctx,'sublevels',PL+8+10*k,yT-8,{s:12*k,c:PAL['cv-soft']});txt(ctx,'p',PL+8+80*k,yT-8,{s:12*k,w:800,c:PAL['s4']});txt(ctx,'sublevels',PL+8+90*k,yT-8,{s:12*k,c:PAL['cv-soft']});
  },
  thumbSetup(sim){sim.p.el=11;detect(sim,4000);},thumbFrames:30
};
function squig(ctx,x1,y1,x2,y2,c){const L=Math.hypot(x2-x1,y2-y1);if(L<2)return;const a=Math.atan2(y2-y1,x2-x1);ctx.save();ctx.translate(x1,y1);ctx.rotate(a);ctx.strokeStyle=c;ctx.lineWidth=2.5;ctx.beginPath();
  for(let s=0;s<=L;s+=2){const y=Math.sin(s/4)*5;s?ctx.lineTo(s,y):ctx.moveTo(s,y);}ctx.stroke();ctx.restore();}
SIM.onLevel=sync;
BioLab.register(SIM);
})();
