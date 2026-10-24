(function(){
'use strict';
const {clamp,lerp,rng,randn,rr,txt,pill,atLeast,PAL,FONT,RM,axes,legend,serColor}=BioLab.h;
const CL=window.ChemLab;

/* ---------- lab "elements" ---------- */
const LABEL={
  pennium:{name:'pennium',unit:'penny',plural:'pennies',types:[{id:'pre',l:'pre-1982 (copper)',s:'pre-1982',m:3.11,c:'#94461c'},{id:'post',l:'1982 and later (zinc)',s:'post-1982',m:2.50,c:'#e3a25c'}]},
  snackium:{name:'snackium',unit:'candy',plural:'candies',types:[{id:'mm',l:'plain M&M',s:'M&M',m:0.86,c:'#2d6bd2'},{id:'sk',l:'Skittle',s:'Skittle',m:1.10,c:'#c0392b'},{id:'pm',l:'peanut M&M',s:'peanut M&M',m:2.55,c:'#c27a00'}]}};
const SPEC_EL=['Cl','Br','Mg','B','Li','Ne','Si','S','Cu','Zn','Ag','Rb','Sr','N','O'];
const DIATOMIC=['Cl','Br','N','O'];
const ISOCOL=['#2d6bd2','#c0392b','#1b8a4a','#c27a00','#7b3fe4','#0f8b8d','#6d7a88'];
function isoList(sym){const t=CL.isotopes[sym];return Object.keys(t).map(Number).sort((a,b)=>a-b).map(A=>({A,m:t[A][0],f:t[A][1]/100}));}
function species(p){const iso=isoList(p.el),dia=p.dia&&DIATOMIC.includes(p.el);if(!dia)return iso.map((o,i)=>({A:o.A,m:o.m,f:o.f,c:ISOCOL[i%7],lab:o.A+p.el}));
  const map={};iso.forEach((a,i)=>iso.forEach((b,j)=>{if(j<i)return;const A=a.A+b.A,f=a.f*b.f*(i===j?1:2);if(!map[A])map[A]={A,m:0,f:0,lab:''};map[A].m=(map[A].m*map[A].f+(a.m+b.m)*f)/(map[A].f+f);map[A].f+=f;}));
  return Object.values(map).sort((a,b)=>a.A-b.A).filter(o=>o.f>1e-4).map((o,i)=>Object.assign(o,{c:ISOCOL[i%7],lab:'m/z '+o.A}));}
const trueAvg=p=>species(p).reduce((a,o)=>a+o.f*o.m,0)/species(p).reduce((a,o)=>a+o.f,0);

/* ---------- bag ---------- */
function newBag(sim,force){const p=sim.p,st=sim.st,L=LABEL[p.mode]||LABEL.pennium,r=st.r,N=Math.round(p.size);let fr;
  if(force)fr=force;else if(L.types.length===2){const a=0.25+0.4*r();fr=[a,1-a];}else{const a=0.2+0.3*r(),b=0.2+0.3*r();fr=[a,b,Math.max(0.1,1-a-b)];const s=fr[0]+fr[1]+fr[2];fr=fr.map(x=>x/s);}
  const counts=fr.map(x=>Math.round(x*N));let d=N-counts.reduce((a,b)=>a+b,0);counts[counts.indexOf(Math.max(...counts))]+=d;
  const items=[];counts.forEach((c,ti)=>{for(let i=0;i<c;i++)items.push({t:ti,m:L.types[ti].m+0.02*randn(r)});});
  for(let i=items.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[items[i],items[j]]=[items[j],items[i]];}
  items.forEach((it,i)=>{it.x0=36+r()*420;it.y0=278+r()*140;it.a=r()*6.28;});
  st.bag={kind:LABEL[p.mode]?p.mode:'pennium',items,phase:0,anim:0};layoutPiles(sim);st.conv=[];let s=0;items.forEach((it,i)=>{s+=it.m;if(i%1===0)st.conv.push([i+1,s/(i+1)]);});}
function layoutPiles(sim){const b=sim.st.bag,L=LABEL[b.kind],nT=L.types.length,colW=460/nT;const idx=L.types.map(()=>0);
  b.items.forEach(it=>{const k=idx[it.t]++,per=8,cx=20+colW*it.t+colW/2,col=k%per,row=Math.floor(k/per);it.x1=cx+(col-(per-1)/2)*15;it.y1=420-row*13;});}
const bagStats=b=>{const L=LABEL[b.kind];return L.types.map((T,i)=>{const its=b.items.filter(x=>x.t===i),mass=its.reduce((a,x)=>a+x.m,0);return {T,n:its.length,mass:Math.round(mass*100)/100,avg:its.length?Math.round(mass*100)/100/its.length:NaN};});};
function weighted(b){const S=bagStats(b),N=b.items.length;return S.reduce((a,s)=>a+(s.n/N)*(s.n?s.avg:0),0);}

/* ---------- spectrometer ---------- */
const SRC={x:70,y:118},EN=196;
function radius(p,o,avg){const B=p.B||0.40;return clamp(112*(0.40/B)*(1+10*(Math.sqrt(o.m/avg)-1)),40,150);}
function fireIons(sim,N){const st=sim.st,sp=species(sim.p);for(let i=0;i<N;i++){const u=st.r();let acc=0,k=0;for(;k<sp.length-1;k++){acc+=sp[k].f;if(u<acc)break;}addCount(sim,sp[k].A);}
  for(let i=0;i<10;i++)spawnIon(sim,i*0.06,true);}
function addCount(sim,A){const st=sim.st;st.cnt[A]=(st.cnt[A]||0)+1;st.tot++;const sp=species(sim.p);
  const avg=sp.reduce((a,o)=>a+(st.cnt[o.A]||0)*o.m,0)/st.tot;if(st.tot<50||st.tot%Math.ceil(st.tot/60)===0)st.conv.push([st.tot,avg]);if(st.conv.length>500)st.conv=st.conv.filter((x,i)=>i%2===0);}
function spawnIon(sim,delay,cosmetic){const st=sim.st,sp=species(sim.p),u=st.r();let acc=0,k=0;for(;k<sp.length-1;k++){acc+=sp[k].f;if(u<acc)break;}
  if(st.ions.length<40)st.ions.push({k,A:sp[k].A,age:-(delay||0),cos:!!cosmetic});}
function measured(sim){const st=sim.st,sp=species(sim.p);if(!st.tot)return NaN;return sp.reduce((a,o)=>a+(st.cnt[o.A]||0)*o.m,0)/st.tot;}

function syncMode(sim){if(!sim.ui||!sim.ui.sec)return;const mode=sim.p.mode==='spec'?'spec':'lab',d=sim.def;
  d.controls.forEach(c=>{if(!c.modes)return;const cid=d.id+'-'+c.id,e=document.getElementById(cid)||document.getElementById(cid+'-l');if(!e)return;const w=e.closest('.ctl');if(w)w.hidden=!atLeast(c.lvl)||!c.modes.includes(mode);});
  d.metrics.forEach(m=>{if(!m.modes)return;const t=sim.ui.tiles[m.id];if(!t)return;const w=t.num.closest('.tile');if(w)w.hidden=!atLeast(m.lvl)||!m.modes.includes(mode);});
  const btns=[...sim.ui.sec.querySelectorAll('.actions button')];d.actions.forEach(a=>{const b=btns.find(x=>x.textContent===a.label);if(b)b.hidden=!atLeast(a.lvl)||!a.modes.includes(mode);});}
function modeChange(sim){syncMode(sim);if(!sim.st)return;if(sim.p.mode!=='spec')newBag(sim);else{sim.st.cnt={};sim.st.tot=0;sim.st.conv=[];sim.st.ions=[];}sim.infoDirty=true;}
function specChange(sim){if(!sim.st)return;sim.st.cnt={};sim.st.tot=0;sim.st.conv=[];sim.st.ions=[];sim.infoDirty=true;}

const AVG={
  id:'avgmass',hash:'avgmass',apUnit:2,order:3,tab:'Average atomic mass',kind:'Virtual lab',prereq:['atombuilder'],next:['mole','nuclear'],
  card:'Sort and weigh a bag of pennium, then fire real isotopes through a mass spectrometer and build the weighted average yourself.',
  title:'Average atomic mass: isotopes, pennium and mass spectrometry',
  lede:{bio:'The mass on the periodic table is an average of every isotope, weighted by how common each one is. Sort a bag of pennies to see why, then measure real elements.',
        honors:'Calculate weighted averages from abundance data, and see how a mass spectrometer separates isotopes by mass.',
        ap:'Read mass spectra like the AP exam, work backward from an average to the abundances, and predict the peaks of diatomic molecules such as Cl₂.'},
  scale:{bio:'Lab mode: a bag of real pennies or candies on a lab bench. Spectrometer mode: single atoms, about 10⁻²³ g each.',
         honors:'Pennies weigh 2.50 g (zinc core, 1982 on) or 3.11 g (copper). A ³⁵Cl atom has a mass of 34.969 amu = 5.81 × 10⁻²³ g.'},
  timeless:true,animated:true,chChange:0.5,chReveal:2.2,
  controls:[
    {id:'mode',label:'Experiment',type:'seg',def:'pennium',lvl:'bio',noTrial:true,options:[{v:'pennium',l:'Pennium bag'},{v:'snackium',l:'Snackium bag'},{v:'spec',l:'Mass spectrometer'}]},
    {id:'size',label:'Items in the bag',type:'range',min:20,max:100,step:5,def:50,lvl:'bio',modes:['lab'],onChange(sim){if(sim.st&&sim.p.mode!=='spec')newBag(sim);}},
    {id:'el',label:'Element',type:'select',def:'Cl',lvl:'bio',modes:['spec'],options:SPEC_EL.map(s=>({v:s,l:CL.el(s).name+' ('+s+')'}))},
    {id:'B',label:'Magnetic field',type:'range',min:0.30,max:0.55,step:0.01,def:0.40,unit:' T',lvl:'honors',modes:['spec'],help:'A stronger field bends every ion into a tighter curve.'},
    {id:'dia',label:'Diatomic molecules (X₂⁺)',type:'toggle',def:false,lvl:'ap',modes:['spec'],help:'For Cl₂, Br₂, N₂ and O₂: each ion holds two atoms.'}
  ],
  actions:[
    {id:'bag',label:'New bag',lvl:'bio',modes:['lab'],run(sim){newBag(sim);}},
    {id:'sort',label:'Sort by type',lvl:'bio',primary:true,modes:['lab'],run(sim){const b=sim.st.bag;if(b.phase===0){b.phase=1;b.anim=0;}}},
    {id:'weigh',label:'Weigh each group',lvl:'bio',modes:['lab'],run(sim){const b=sim.st.bag;if(b.phase===0){b.phase=1;b.anim=0.8;}b.phase=2;}},
    {id:'f100',label:'Fire 100 atoms',lvl:'bio',primary:true,modes:['spec'],run(sim){fireIons(sim,100);}},
    {id:'f10k',label:'Fire 10,000 atoms',lvl:'bio',modes:['spec'],run(sim){fireIons(sim,10000);}},
    {id:'clr',label:'Clear the spectrum',lvl:'bio',modes:['spec'],run(sim){specChange(sim);}}
  ],
  init(sim){const st={r:rng(1982),cnt:{},tot:0,conv:[],ions:[],acc:0,bag:null};sim.st=st;newBag(sim);return st;},
  step(sim,dt){const st=sim.st;if(sim.p.mode==='spec'){st.acc+=dt;if(st.acc>0.3){st.acc=0;spawnIon(sim,0,false);}
      st.ions.forEach(o=>o.age+=dt);st.ions=st.ions.filter(o=>{if(o.age>1.25&&!o.done){o.done=true;if(!o.cos)addCount(sim,o.A);sim.infoDirty=true;}return o.age<1.45;});}
    else if(st.bag){if(st.bag.kind!==sim.p.mode&&LABEL[sim.p.mode])newBag(sim);if(st.bag.phase>=1)st.bag.anim=Math.min(0.8,st.bag.anim+dt);}},
  metrics:[
    {id:'n',label:'Items in the bag',unit:'',lvl:'bio',min:0,max:100,d:0,modes:['lab'],get:s=>s.st.bag?s.st.bag.items.length:0},
    {id:'ab',label:'Abundance of each type',unit:'',lvl:'bio',text:true,modes:['lab'],get:s=>{const b=s.st.bag;if(!b||b.phase<1)return 'sort the bag first';return bagStats(b).map(x=>x.T.s+' '+(100*x.n/b.items.length).toFixed(0)+'%').join(', ');}},
    {id:'wavg',label:'Weighted average mass',unit:'g',lvl:'bio',min:0,max:null,d:3,modes:['lab'],get:s=>{const b=s.st.bag;return b&&b.phase>=2?weighted(b):NaN;}},
    {id:'chk',label:'Whole bag mass ÷ count',unit:'g',lvl:'bio',min:0,max:null,d:3,modes:['lab'],get:s=>{const b=s.st.bag;if(!b||b.phase<2)return NaN;return bagStats(b).reduce((a,x)=>a+x.mass,0)/b.items.length;}},
    {id:'simple',label:'Simple average of the type masses',unit:'g',lvl:'honors',min:0,max:null,d:3,modes:['lab'],get:s=>{const b=s.st.bag;if(!b||b.phase<2)return NaN;const S=bagStats(b).filter(x=>x.n);return S.reduce((a,x)=>a+x.avg,0)/S.length;}},
    {id:'ions',label:'Atoms detected',unit:'',lvl:'bio',min:0,max:null,d:0,modes:['spec'],get:s=>s.st.tot},
    {id:'mavg',label:'Average from your spectrum',unit:'amu',lvl:'bio',min:0,max:null,d:3,modes:['spec'],get:s=>measured(s)},
    {id:'ptab',label:'Periodic table value',unit:'amu',lvl:'bio',min:0,max:null,d:3,modes:['spec'],get:s=>CL.el(s.p.el).mass*((s.p.dia&&DIATOMIC.includes(s.p.el))?2:1)},
    {id:'err',label:'Percent difference',unit:'%',lvl:'honors',min:0,max:null,d:3,modes:['spec'],get:s=>{const m=measured(s),t=trueAvg(s.p);return Number.isFinite(m)?100*Math.abs(m-t)/t:NaN;}}
  ],
  graphs:[{id:'conv',label:'Your average vs number counted',lvl:'bio',custom:true},{id:'bars',label:'Abundance of each isotope',lvl:'bio',custom:true}],
  defaultGraph:'bars',
  plot(sim,ctx,box,id){const st=sim.st,p=sim.p,spec=p.mode==='spec';
    if(id==='conv'){const pts=spec?st.conv:(st.bag&&st.bag.phase>=2?st.conv:[]);if(!pts.length){txt(ctx,spec?'Fire some atoms to see the running average.':'Sort and weigh the bag to see the running average.',box.cw/2,box.ch/2,{s:15,c:PAL['muted'],a:'center',b:'middle'});return;}
      const target=spec?trueAvg(p):weighted(st.bag),ys=pts.map(q=>q[1]),span=Math.max(0.02*target,...ys.map(y=>Math.abs(y-target)))*1.15;
      const ax=axes(ctx,box,{xmin:0,xmax:pts[pts.length-1][0]*1.02,ymin:target-span,ymax:target+span,xl:spec?'Atoms counted':'Items counted, in the order they came out',yl:spec?'Average mass (amu)':'Average mass (g)',yd:span<0.05?3:2});
      ctx.setLineDash([5,4]);ctx.strokeStyle=PAL['muted'];ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(ax.X(0),ax.Y(target));ctx.lineTo(box.L+box.W,ax.Y(target));ctx.stroke();ctx.setLineDash([]);
      ctx.strokeStyle=serColor(0);ctx.lineWidth=2.5;ctx.beginPath();pts.forEach((q,i)=>i?ctx.lineTo(ax.X(q[0]),ax.Y(q[1])):ctx.moveTo(ax.X(q[0]),ax.Y(q[1])));ctx.stroke();
      legend(ctx,box.L+12,box.T+10,[{label:'running average',color:serColor(0)},{label:spec?'true weighted average':'whole bag average',color:PAL['muted'],dash:true}]);return;}
    if(spec){const sp=species(p),tot=st.tot;const ax=axes(ctx,box,{xmin:0,xmax:sp.length,ymin:0,ymax:100,xcats:sp.map(o=>o.lab),yl:'Abundance (%)'});
      sp.forEach((o,i)=>{const v=tot?100*(st.cnt[o.A]||0)/tot:0,x0=ax.X(i+0.25),x1=ax.X(i+0.75);ctx.fillStyle=o.c;ctx.fillRect(x0,ax.Y(v),x1-x0,ax.Y(0)-ax.Y(v));
        ctx.strokeStyle=PAL['cv-ink'];ctx.setLineDash([4,3]);ctx.lineWidth=1.5;ctx.strokeRect(x0-3,ax.Y(o.f*100),x1-x0+6,ax.Y(0)-ax.Y(o.f*100));ctx.setLineDash([]);
        txt(ctx,(tot?v.toFixed(1):'0')+'% (true '+(o.f*100).toFixed(o.f<0.1?2:1)+'%)',(x0+x1)/2,Math.min(ax.Y(v),ax.Y(o.f*100))-6,{s:12,c:PAL['cv-ink'],a:'center',w:600});});
      legend(ctx,box.L+12,box.T+10,[{label:'your spectrum',color:serColor(1)},{label:'natural abundance',color:PAL['cv-ink'],dash:true}]);return;}
    const b=st.bag;if(!b||b.phase<1){txt(ctx,'Sort the bag by type to count each kind.',box.cw/2,box.ch/2,{s:15,c:PAL['muted'],a:'center',b:'middle'});return;}
    const S=bagStats(b),N=b.items.length;const ax=axes(ctx,box,{xmin:0,xmax:S.length,ymin:0,ymax:100,xcats:S.map(x=>x.T.s),yl:'Abundance (%)'});
    S.forEach((x,i)=>{const v=100*x.n/N,x0=ax.X(i+0.25),x1=ax.X(i+0.75);ctx.fillStyle=x.T.c;ctx.fillRect(x0,ax.Y(v),x1-x0,ax.Y(0)-ax.Y(v));txt(ctx,x.n+' of '+N+' = '+v.toFixed(0)+'%',(x0+x1)/2,ax.Y(v)-6,{s:12,c:PAL['cv-ink'],a:'center',w:600});});},
  infoPanel(sim){const p=sim.p,st=sim.st,hon=atLeast('honors'),ap=atLeast('ap');
    if(p.mode!=='spec'){const b=st.bag,L=LABEL[p.mode];if(!b)return '';
      if(b.phase<2)return `<h3>Your bag of ${L.name}</h3><p>The bag holds ${b.items.length} ${L.plural} of ${L.types.length} “isotopes”: ${L.types.map(T=>T.l+' (about '+T.m.toFixed(2)+' g)').join(', ')}. ${b.phase<1?'Sort them by type first.':'Now weigh each group.'}</p><p>Like isotopes, every ${L.unit} is the same “element” but the types have different masses.</p>`;
      const S=bagStats(b),N=b.items.length,rows=S.map(x=>`<tr><td style="text-align:left">${x.T.s}</td><td>${x.n}</td><td>${x.mass.toFixed(2)}</td><td>${x.avg.toFixed(3)}</td><td>${(x.n/N).toFixed(3)}</td><td>${((x.n/N)*x.avg).toFixed(3)}</td></tr>`).join('');
      const w=weighted(b),tot=S.reduce((a,x)=>a+x.mass,0);
      return `<h3>Average mass of ${L.name}</h3><div class="tbl-wrap"><table><thead><tr><th style="text-align:left">Type</th><th>Count</th><th>Mass (g)</th><th>Avg (g)</th><th>Fraction</th><th>Fraction × avg</th></tr></thead><tbody>${rows}</tbody></table></div>
        <p style="margin-top:8px"><b>Weighted average</b> = ${S.map(x=>'('+(x.n/N).toFixed(3)+')('+x.avg.toFixed(3)+' g)').join(' + ')} = <b>${w.toFixed(3)} g</b></p>
        <p><b>Check:</b> whole bag ${tot.toFixed(2)} g ÷ ${N} = ${(tot/N).toFixed(3)} g. Both methods give the average mass of one ${L.unit}.</p>${hon?`<p>The simple average of the type masses would be ${(S.filter(x=>x.n).reduce((a,x)=>a+x.avg,0)/S.filter(x=>x.n).length).toFixed(3)} g. It ignores how many of each you have, so it is wrong unless the types are equally common.</p>`:''}`;}
    const sp=species(p),tv=trueAvg(p),e=CL.el(p.el),dia=p.dia&&DIATOMIC.includes(p.el),mm=measured(sim);
    let h=`<h3>${dia?CL.fmt(p.el+'2')+' molecules':'Isotopes of '+e.name.toLowerCase()}</h3><p><b>True weighted average</b> = ${sp.map(o=>'('+o.m.toFixed(3)+' amu)('+o.f.toFixed(4)+')').join(' + ')} = <b>${tv.toFixed(3)} amu</b></p>`;
    if(st.tot)h+=`<p><b>From your ${st.tot.toLocaleString('en-US')} atoms:</b> ${sp.map(o=>'('+o.m.toFixed(3)+')('+((st.cnt[o.A]||0)/st.tot).toFixed(4)+')').join(' + ')} = <b>${mm.toFixed(3)} amu</b>. More atoms counted brings your average closer to the true value.</p>`;
    else h+='<p>Fire atoms through the spectrometer to measure the abundances yourself.</p>';
    if(dia)h+=`<p>Two atoms pair at random, so the peak heights follow (a + b)²: for chlorine 0.758² : 2(0.758)(0.242) : 0.242² ≈ 9 : 6 : 1.</p>`;
    if(ap&&!dia&&sp.length===2){const [a,b]=sp;const x=(e.mass-b.m)/(a.m-b.m);h+=`<p><b>Working backward:</b> if the average is ${e.mass} amu, then x(${a.m.toFixed(3)}) + (1 − x)(${b.m.toFixed(3)}) = ${e.mass}, so x = ${x.toFixed(3)}: ${(100*x).toFixed(1)}% ${a.A}${p.el} and ${(100-100*x).toFixed(1)}% ${b.A}${p.el}.</p>`;}
    return h;},
  narrate(sim){const p=sim.p,st=sim.st,hon=atLeast('honors');
    if(p.mode!=='spec'){const b=st.bag,L=LABEL[p.mode];if(!b)return '';
      if(b.phase===0)return 'The bag of '+L.name+' is spilled on the bench: '+b.items.length+' '+L.plural+' of '+L.types.length+' types that look alike but weigh different amounts. <b>Sort them by type</b> to count each “isotope”.';
      const S=bagStats(b),N=b.items.length;
      if(b.phase===1)return 'Sorted: '+S.map(x=>x.n+' '+x.T.s).join(', ')+'. Each group’s share of the bag is its <b>percent abundance</b>. Now weigh each group.';
      const w=weighted(b),big=S.reduce((a,x)=>x.n>a.n?x:a,S[0]);return 'The weighted average is <b>'+w.toFixed(3)+' g</b>. It sits closest to the '+big.T.s+' mass ('+big.avg.toFixed(2)+' g) because that type is the most common, '+(100*big.n/N).toFixed(0)+'% of the bag.';}
    const sp=species(p),tv=trueAvg(p),e=CL.el(p.el),big=sp.reduce((a,o)=>o.f>a.f?o:a,sp[0]),dia=p.dia&&DIATOMIC.includes(p.el);
    let s='Each '+(dia?'molecule':'atom')+' loses an electron, is accelerated, and the magnet bends it: <b>lighter ions bend more</b> and land closer to the entrance. ';
    s+=dia?'Peaks for '+CL.fmt(p.el+'2')+' come from every pair of isotopes. ':'Natural '+e.name.toLowerCase()+' is '+sp.map(o=>(100*o.f).toFixed(o.f<0.01?2:1)+'% '+CL.sup(o.A)+p.el).join(', ')+', so the average ('+tv.toFixed(2)+' amu) is pulled toward '+CL.sup(big.A)+p.el+'. ';
    if(st.tot&&hon)s+='Your '+st.tot.toLocaleString('en-US')+' atoms give '+measured(sim).toFixed(3)+' amu.';
    if(p.dia&&!dia)s+=' '+e.name+' is not a diatomic element, so the molecule switch has no effect.';
    return s;},
  tour:[
    {title:'A bag of pennium',text:'Pennies made before 1982 are mostly copper (3.11 g). Pennies from 1982 on have a zinc core (2.50 g). They look alike, just as isotopes of an element behave alike.',focus:[16,262,460,180],pause:true,setup(sim){BioLab.setValues(sim,{mode:'pennium'});}},
    {title:'Sort by type',text:'Sorting gives the count of each type. Each count divided by the total is the percent abundance, like the abundance of each isotope in nature.',focus:[16,262,460,180],speed:0.5,setup(sim){sim.def.actions.find(a=>a.id==='sort').run(sim);}},
    {title:'Weigh and average',text:'Multiply each type’s mass by its fraction of the bag, then add. That weighted average equals the whole bag’s mass divided by the count.',focus:[488,16,300,420],pause:true,setup(sim){sim.def.actions.find(a=>a.id==='weigh').run(sim);}},
    {title:'Step 1: ionize',text:'In a mass spectrometer, a beam of electrons knocks one electron off each atom, making a positive ion such as ³⁵Cl⁺.',focus:[10,70,140,100],speed:0.3,setup(sim){BioLab.setValues(sim,{mode:'spec',el:'Cl'});}},
    {title:'Step 2: accelerate',text:'Charged plates speed every ion up to the same kinetic energy, so heavier ions move a little more slowly.',focus:[140,80,70,80],speed:0.3},
    {title:'Step 3: deflect',text:'In the magnetic field each ion follows a curve. Heavier ions have more momentum and bend less, so ³⁷Cl⁺ lands farther from the entrance than ³⁵Cl⁺.',focus:[EN-4,60,300,370],speed:0.3},
    {title:'Step 4: detect and average',text:'The detector counts the ions at each position. Peak heights give the abundances: 75.8% chlorine-35 and 24.2% chlorine-37, so the average is 35.45 amu.',focus:[488,16,300,420],speed:1,setup(sim){fireIons(sim,10000);}},
    {lvl:'ap',title:'Diatomic molecules',text:'Fire Cl₂ instead. Two atoms pair at random, so you see three peaks at m/z 70, 72 and 74 in a 9 : 6 : 1 ratio.',focus:[488,16,300,420],speed:1,setup(sim){BioLab.setValues(sim,{dia:true});fireIons(sim,10000);}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{mode:'pennium',dia:false});},
  onChallenge(sim,ch,phase){if(!ch||!ch.instant||phase!=='done')return;if(ch.set)BioLab.setValues(sim,ch.set);
    if(ch.bag){newBag(sim,ch.bag);sim.st.bag.phase=2;sim.st.bag.anim=0.8;}if(ch.fire)fireIons(sim,ch.fire);BioLab.refresh(sim);},
  challenges:[
    {lvl:'bio',instant:true,set:{mode:'pennium',size:100},bag:[0.25,0.75],q:'A bag is 25% pre-1982 pennies (3.11 g) and 75% newer pennies (2.50 g). What is the average mass of one penny?',choices:['2.81 g, halfway between','2.65 g','2.96 g'],correct:1,
     explain:{bio:'0.25 × 3.11 + 0.75 × 2.50 = 0.78 + 1.88 = 2.65 g. The average sits closer to 2.50 g because most of the pennies are the lighter kind. The model now shows that bag, sorted and weighed.'}},
    {lvl:'bio',instant:true,set:{mode:'spec',el:'Cl',dia:false},fire:10000,q:'Chlorine’s average atomic mass is 35.45 amu. How many chlorine atoms have a mass of 35.45 amu?',choices:['Most of them','None: each atom is ³⁵Cl (34.97 amu) or ³⁷Cl (36.97 amu)','About half of them'],correct:1,
     explain:{bio:'The spectrum has two peaks and nothing at 35.45. The average describes a large group of atoms, just as no family has the average 2.5 children. 75.8% are ³⁵Cl and 24.2% are ³⁷Cl.'}},
    {lvl:'bio',q:'Bromine has two isotopes, ⁷⁹Br and ⁸¹Br. Fire 10,000 atoms. Where does the average land?',choices:['Almost halfway, near 79.9','Close to 79','Close to 81'],correct:0,
     baseline:{mode:'spec',el:'Br'},changeAction:'f10k',changeText:'10,000 bromine atoms fired',watch:'bars',
     explain:{bio:'The two peaks are almost the same height (50.7% and 49.3%), so the weighted average, 79.90 amu, is almost exactly halfway. A weighted average only equals the simple average when the isotopes are equally common.'}},
    {lvl:'honors',instant:true,set:{mode:'spec',el:'Cl',B:0.40},q:'In the magnetic field, which ion bends into the tighter curve: ³⁵Cl⁺ or ³⁷Cl⁺?',choices:['³⁵Cl⁺, the lighter ion','³⁷Cl⁺, the heavier ion','They bend the same: both have a 1+ charge'],correct:0,
     explain:{honors:'Both ions get the same charge and kinetic energy, but the lighter ion has less momentum, so the magnetic force turns it more sharply (r ∝ √m). Watch the stage: blue ³⁵Cl⁺ lands closer to the entrance.'}},
    {lvl:'honors',q:'Raise the magnetic field from 0.40 T to 0.52 T. What happens to the ion paths?',choices:['Every path curves more tightly','Every path curves less','Nothing: only the mass matters'],correct:0,
     baseline:{mode:'spec',el:'Cl',B:0.40},change:{B:0.52},changeText:'Magnetic field raised to 0.52 T',
     explain:{honors:'The radius is r = mv/(qB), so a stronger field gives smaller circles for every ion. Real spectrometers sweep B to bring each mass onto the detector in turn.'}},
    {lvl:'honors',instant:true,set:{mode:'spec',el:'Mg'},fire:10000,q:'Magnesium is 79.0% ²⁴Mg (23.985 amu), 10.0% ²⁵Mg (24.986 amu) and 11.0% ²⁶Mg (25.983 amu). Its average atomic mass is…',choices:['25.00 amu','24.31 amu','24.00 amu','24.98 amu'],correct:1,
     explain:{honors:'(0.790)(23.985) + (0.100)(24.986) + (0.110)(25.983) = 18.948 + 2.499 + 2.858 = 24.31 amu. Only ²⁴Mg pulls the average far from the middle.'}},
    {lvl:'ap',instant:true,set:{mode:'spec',el:'B'},fire:10000,q:'Boron’s average atomic mass is 10.81 amu. Its isotopes are ¹⁰B (10.013 amu) and ¹¹B (11.009 amu). What percent is ¹¹B?',choices:['20%','50%','80%','92%'],correct:2,
     explain:{ap:'Let x be the fraction of ¹¹B: 11.009x + 10.013(1 − x) = 10.81, so x = (10.81 − 10.013)/0.996 = 0.80. The spectrum shows 80.1% ¹¹B and 19.9% ¹⁰B.'}},
    {lvl:'ap',instant:true,set:{mode:'spec',el:'Cl',dia:true},fire:10000,q:'Chlorine gas is Cl₂. In its mass spectrum, the peaks at m/z 70, 72 and 74 have heights in the ratio…',choices:['3 : 1 : 0','1 : 2 : 1','9 : 6 : 1','3 : 2 : 1'],correct:2,
     explain:{ap:'Each molecule pairs two atoms at random: P(35,35) = 0.758² = 0.574, P(35,37) = 2(0.758)(0.242) = 0.367, P(37,37) = 0.242² = 0.059. That is about 9 : 6 : 1. The model now shows the Cl₂⁺ spectrum.'}}
  ],
  lab:{bio:'<p><b>Question:</b> How do you find the average mass of a “pennium” atom?</p><ol><li>Sort the bag and weigh each group. Record a trial.</li><li>Write the percent abundance and average mass of each type.</li><li>Calculate the weighted average and compare it with “Whole bag mass ÷ count”.</li><li>Press New bag and repeat twice.</li></ol><p>Why does the average change from bag to bag, while chlorine’s average is the same in every sample on Earth?</p>',
       honors:'<p><b>Question:</b> How well does a mass spectrometer measure average atomic mass?</p><ol><li>Choose an element. Clear, fire 100 atoms and record a trial.</li><li>Fire more and record at about 1,000 and 10,000 atoms.</li><li>Use the Average vs number counted graph.</li></ol><p>Compare your percent difference at each count. Explain why more counts give a better average.</p>',
       ap:'<p><b>Question:</b> What can a mass spectrum tell you?</p><ol><li>Record spectra for Cl, Br and Mg. Calculate each average from your peak heights.</li><li>Turn on Diatomic molecules for Cl and Br and record the peaks.</li></ol><p><b>Claim–evidence–reasoning:</b> Predict the Br₂ peak ratio before you fire, then explain the result with probabilities. Then explain how you would find the abundances of a two-isotope element from its average alone.</p>'},
  terms:[{t:'Isotopes',d:'Atoms of the same element with different numbers of neutrons, and so different masses.'},{t:'Percent abundance',d:'The percentage of an element’s atoms that are a given isotope.'},{t:'Average atomic mass',d:'The weighted average of the isotope masses: Σ(fraction × mass). It is the mass on the periodic table.'},{t:'Atomic mass unit (amu)',d:'1/12 the mass of a carbon-12 atom, 1.6605 × 10⁻²⁴ g.'},
    {lvl:'honors',t:'Weighted average',d:'An average where each value counts in proportion to how common it is.'},{lvl:'honors',t:'Mass spectrometer',d:'An instrument that ionizes atoms, accelerates them and sorts them by mass in a magnetic field.'},
    {lvl:'ap',t:'Mass spectrum',d:'A graph of relative abundance against mass-to-charge ratio (m/z).'},{lvl:'ap',t:'m/z',d:'Mass-to-charge ratio. For 1+ ions it equals the ion’s mass in amu.'}],
  about:'<p>Isotope masses and natural abundances are IUPAC values from ChemLab.isotopes. Averages in the spectrometer are Σ(count × exact mass) ÷ total count, so your average approaches the true weighted average as you count more atoms (random sampling, so every run differs).</p><p>Pennies: pre-1982 cents are 95% copper and weigh 3.11 g; cents from 1982 on are copper-plated zinc and weigh 2.50 g. Each penny varies by about 0.02 g, and group masses are rounded to 0.01 g like a centigram balance. 1982 itself made both kinds; here they are sorted by mass. Snackium masses are typical values (plain M&M 0.86 g, Skittle 1.10 g, peanut M&M 2.55 g); weigh your own candy, because brands vary.</p><p>The spectrometer is a simplified 180° magnetic sector: ions are singly charged, the radius follows r = √(2mV/q)/B, and the differences between isotopes are drawn 10 times larger than real so you can see them. Diatomic peaks assume atoms pair at random.</p>',
  initVis(sim){},
  onLevel(sim){syncMode(sim);},
  draw(sim,ctx,vdt,k,t){const p=sim.p,st=sim.st;ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
    if(p.mode==='spec')drawSpec(sim,ctx,k,t);else drawLab(sim,ctx,k,t);},
  thumbSetup(sim){sim.p.mode='spec';specChange(sim);fireIons(sim,3000);},
  thumbFrames:30
};
function coin(ctx,x,y,r,T,kind,a){if(kind==='pennium'){const g=ctx.createRadialGradient(x-r*0.3,y-r*0.3,1,x,y,r);g.addColorStop(0,CL.shade(T.c,0.35));g.addColorStop(1,CL.shade(T.c,-0.25));ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,6.29);ctx.fill();ctx.strokeStyle=CL.shade(T.c,-0.45);ctx.lineWidth=1;ctx.stroke();ctx.beginPath();ctx.arc(x,y,r*0.62,0,6.29);ctx.stroke();}
  else{const peanut=T.id==='pm';ctx.save();ctx.translate(x,y);ctx.rotate(a||0);const g=ctx.createRadialGradient(-r*0.3,-r*0.3,1,0,0,r*1.2);g.addColorStop(0,CL.shade(T.c,0.4));g.addColorStop(1,CL.shade(T.c,-0.2));ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(0,0,peanut?r*1.3:r,peanut?r*0.95:r*0.82,0,0,6.29);ctx.fill();
    ctx.fillStyle='rgba(255,255,255,.85)';ctx.font='700 '+(r*0.9)+'px '+FONT;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(T.id==='sk'?'s':'m',0,1);ctx.restore();}}
function drawLab(sim,ctx,k,t){const st=sim.st,b=st.bag;if(!b)return;const L=LABEL[b.kind],u=b.phase>=1?clamp(b.anim/0.8,0,1):0,e=u*u*(3-2*u);
  ctx.fillStyle=PAL['cv-bench'];ctx.fillRect(0,262,480,188);
  txt(ctx,b.phase===0?'A bag of '+L.name+', spilled on the bench':'Sorted by type',18,30,{s:15*k,w:700});
  if(k<1.4)txt(ctx,L.types.map(T=>T.s+' ≈ '+T.m.toFixed(2)+' g').join('   '),18,30+20*k,{s:12*k,c:PAL['cv-soft']});
  // the paper bag
  ctx.fillStyle='#c8a36a';ctx.beginPath();ctx.moveTo(330,240);ctx.lineTo(450,240);ctx.lineTo(440,120);ctx.lineTo(340,120);ctx.closePath();ctx.fill();ctx.fillStyle='#a8844e';ctx.fillRect(340,112,100,12);
  txt(ctx,L.name.toUpperCase(),390,186,{s:13,w:800,a:'center',c:'#3b2a1a'});
  const r=b.kind==='pennium'?7.5:7;b.items.forEach(it=>{const x=lerp(it.x0,it.x1,e),y=lerp(it.y0,it.y1,e);coin(ctx,x,y,r,L.types[it.t],b.kind,it.a*(1-e));});
  if(b.phase>=1){const S=bagStats(b),colW=460/S.length;S.forEach((x,i)=>{const cx=20+colW*i+colW/2,rows=Math.ceil(x.n/8),top=420-rows*13-14;
      pill(ctx,k<1.4?x.n+' '+x.T.s+(b.phase>=2?', '+x.mass.toFixed(2)+' g':''):(b.phase>=2?x.mass.toFixed(1)+' g':x.n+''),cx,Math.min(top,392)-8,PAL['card'],PAL['cv-ink'],12*k);});}
  // balance and calculation panel
  const X=492,W=294;rr(ctx,X,14,W,422,12);ctx.fillStyle=PAL['card'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
  // balance drawing
  ctx.fillStyle=PAL['cv-lamp'];rr(ctx,X+40,96,W-80,60,8);ctx.fill();ctx.fillStyle=PAL['cv-soft'];ctx.fillRect(X+70,82,W-140,14);
  rr(ctx,X+W/2-64,114,128,30,4);ctx.fillStyle='#10261a';ctx.fill();
  const S=bagStats(b),tot=S.reduce((a,x)=>a+x.mass,0);txt(ctx,b.phase>=2?tot.toFixed(2)+' g':'0.00 g',X+W/2+54,136,{s:20,w:700,a:'right',c:'#5cff9a'});
  txt(ctx,'Balance (±0.01 g)',X+W/2,176,{s:12*k,a:'center',c:PAL['cv-soft']});
  let y=206;const lh=Math.max(19,15*k);
  if(b.phase<2){txt(ctx,b.phase<1?'1. Sort by type':'2. Weigh each group',X+16,y,{s:13*k,w:700});y+=lh;if(k<1.4){txt(ctx,'Then the weighted average is',X+16,y,{s:12*k,c:PAL['cv-soft']});y+=lh;}txt(ctx,'avg = Σ (fraction × mass)',X+16,y,{s:12*k,w:700,c:PAL['cv-soft']});return;}
  txt(ctx,k<1.4?'Weighted average':'Weighted avg',X+16,y,{s:13*k,w:700});y+=lh+2;const N=b.items.length;
  const g=k<1.4?' g':'';S.forEach(x=>{txt(ctx,(x.n/N).toFixed(2)+' × '+x.avg.toFixed(3)+g+' = '+((x.n/N)*x.avg).toFixed(3)+g,X+16,y,{s:(k<1.4?13:12)*k,c:PAL['cv-ink']});y+=lh;});
  ctx.strokeStyle=PAL['line'];ctx.beginPath();ctx.moveTo(X+16,y-lh*0.55);ctx.lineTo(X+W-16,y-lh*0.55);ctx.stroke();
  txt(ctx,'average = '+weighted(b).toFixed(3)+' g',X+16,y+4,{s:15*k,w:800,c:PAL['rj']});y+=lh+10;
  txt(ctx,k<1.4?'Check: '+tot.toFixed(2)+' g ÷ '+N+' = '+(tot/N).toFixed(3)+' g':'check: '+(tot/N).toFixed(3)+' g',X+16,y,{s:12*k,c:PAL['cv-soft']});}
function drawSpec(sim,ctx,k,t){const p=sim.p,st=sim.st,sp=species(p),avg=trueAvg(p),hon=atLeast('honors');
  // magnet region
  ctx.fillStyle=PAL['s2'];ctx.globalAlpha=0.08;ctx.fillRect(EN,58,276,384);ctx.globalAlpha=1;ctx.strokeStyle=PAL['s2'];ctx.globalAlpha=0.5;ctx.setLineDash([5,4]);ctx.strokeRect(EN,58,276,384);ctx.setLineDash([]);ctx.globalAlpha=1;
  for(let i=0;i<5;i++)for(let j=0;j<7;j++){const x=EN+40+i*52,y=92+j*50;ctx.strokeStyle=PAL['s2'];ctx.globalAlpha=0.35;ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(x-4,y-4);ctx.lineTo(x+4,y+4);ctx.moveTo(x+4,y-4);ctx.lineTo(x-4,y+4);ctx.stroke();ctx.globalAlpha=1;}
  txt(ctx,'3  Magnet'+(hon?' (B = '+p.B.toFixed(2)+' T)':' bends the ions'),EN+10,52,{s:12*k,w:700,c:PAL['s2']});
  // source and plates
  ctx.fillStyle=PAL['card2'];rr(ctx,14,88,96,60,8);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.stroke();txt(ctx,'1  Ionize',14,82,{s:12*k,w:700});
  ctx.fillStyle=PAL['s4'];for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(34+i*12,118+Math.sin(t*3+i)*6,3,0,6.29);ctx.fill();}
  txt(ctx,'e⁻ beam',62,140,{s:12,c:PAL['cv-soft'],a:'center'});
  ctx.fillStyle=PAL['cv-soft'];ctx.fillRect(132,92,6,20);ctx.fillRect(132,124,6,20);ctx.fillRect(166,92,6,20);ctx.fillRect(166,124,6,20);if(k<1.4)txt(ctx,'2  Accelerate',112,66,{s:12*k,w:700});else txt(ctx,'2  Accelerate',EN-14,180,{s:12*k,w:700,a:'right'});
  txt(ctx,'+',135,86,{s:14,w:800,c:PAL['s1'],a:'center'});txt(ctx,'−',169,86,{s:14,w:800,c:PAL['s2'],a:'center'});
  // detector strip
  ctx.fillStyle=PAL['cv-lamp'];ctx.fillRect(EN-10,150,10,292);txt(ctx,'4  Detector',EN-16,446,{s:12*k,w:700,a:'right'});
  // ideal paths and landing marks
  sp.forEach((o,i)=>{const R=radius(p,o,avg),cy=SRC.y+R;ctx.strokeStyle=o.c;ctx.globalAlpha=0.3;ctx.lineWidth=2;ctx.beginPath();ctx.arc(EN,cy,R,-Math.PI/2,Math.PI/2);ctx.stroke();ctx.globalAlpha=1;
    const ly=SRC.y+2*R,c=st.cnt[o.A]||0,len=st.tot?clamp(70*c/st.tot,0,70):0;ctx.fillStyle=o.c;ctx.fillRect(EN-10-len,ly-3,len,6);
    if(o.f>0.004)txt(ctx,o.lab.replace(/^(\d+)/,m=>CL.sup(m))+(p.dia&&DIATOMIC.includes(p.el)?'':'⁺'),EN-14-len,ly,{s:12*k,w:700,a:'right',b:'middle',c:o.c});});
  // moving ions
  st.ions.forEach(o=>{if(o.age<0)return;const sp2=sp[o.k];if(!sp2)return;const R=radius(p,sp2,avg);let x,y;
    if(o.age<0.35){x=lerp(40,EN,o.age/0.35);y=SRC.y;}else{const a=-Math.PI/2+Math.PI*clamp((o.age-0.35)/0.9,0,1);x=EN+Math.cos(a)*R;y=SRC.y+R+Math.sin(a)*R;}
    ctx.fillStyle=sp2.c;ctx.beginPath();ctx.arc(x,y,5,0,6.29);ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=1;ctx.stroke();});
  // spectrum panel
  const X=500,Y=14,W=288,H=422;rr(ctx,X,Y,W,H,12);ctx.fillStyle=PAL['card'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
  txt(ctx,(k<1.4?'Mass spectrum of ':'Spectrum: ')+(p.dia&&DIATOMIC.includes(p.el)?CL.fmt(p.el+'2'):(k<1.4?CL.el(p.el).name.toLowerCase():p.el)),X+14,Y+26,{s:Math.min(14*k,22),w:700});
  const bx=X+42,bw=W-56,by0=Y+H-56,bh=H-150;ctx.strokeStyle=PAL['g-axis'];ctx.beginPath();ctx.moveTo(bx,Y+80);ctx.lineTo(bx,by0);ctx.lineTo(bx+bw,by0);ctx.stroke();
  [0,50,100].forEach(v=>{const yy=by0-bh*v/100;txt(ctx,v+'%',bx-6,yy,{s:12,a:'right',b:'middle',c:PAL['g-axis']});});
  const n=sp.length,slot=bw/n;sp.forEach((o,i)=>{const v=st.tot?(st.cnt[o.A]||0)/st.tot:0,cx=bx+slot*(i+0.5),w=Math.min(34,slot*0.6);ctx.fillStyle=o.c;ctx.fillRect(cx-w/2,by0-bh*v,w,bh*v);
    ctx.strokeStyle=PAL['cv-ink'];ctx.setLineDash([3,3]);ctx.strokeRect(cx-w/2-2,by0-bh*o.f,w+4,bh*o.f);ctx.setLineDash([]);
    txt(ctx,String(o.A),cx,by0+16,{s:12*k,w:700,a:'center'});if(st.tot&&v>0.002&&(n<=5||k<1.4))txt(ctx,(100*v).toFixed(v<0.1?1:0)+'%',cx,by0-bh*v-6,{s:12,a:'center',w:600,c:PAL['cv-ink']});});
  txt(ctx,'m/z',bx+bw,by0+34,{s:12,a:'right',c:PAL['cv-soft']});
  const mm=measured(sim);txt(ctx,st.tot?(k<1.4?'Your average: ':'avg ')+mm.toFixed(3)+' amu':(k<1.4?'Fire atoms to build the spectrum':'Fire some atoms'),X+14,Y+50,{s:13*k,w:700,c:st.tot?PAL['rj']:PAL['cv-soft']});
  if(st.tot&&k<1.4)txt(ctx,st.tot.toLocaleString('en-US')+' counted · true '+avg.toFixed(3)+' amu',X+14,Y+50+17*k,{s:12*k,c:PAL['cv-soft']});
  if(k<1.4)txt(ctx,'Path differences drawn 10× larger than real',14,26,{s:12,c:PAL['cv-soft']});}
AVG.controls.find(c=>c.id==='mode').onChange=modeChange;
['el','dia'].forEach(id=>{AVG.controls.find(c=>c.id===id).onChange=specChange;});
BioLab.register(AVG);
})();
