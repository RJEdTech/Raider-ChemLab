(function(){
'use strict';
const {clamp,rr,txt,pill,atLeast,PAL,FONT,RM,axes,legend,serColor}=BioLab.h;
const CL=window.ChemLab;
/* Solutes as you would weigh them in the lab. sat: saturated molarity near 25 °C (from CRC solubilities).
   spec: absorption bands of the colored ion [center nm, molar absorptivity M⁻¹cm⁻¹, width nm]; the solution color is computed from them.
   rho: density rise per g/mL of anhydrous solute (solution density ≈ 0.997 + rho·c). */
const SOLS={
  CuSO4:{w:'CuSO4*5H2O',anh:'CuSO4',name:'copper(II) sulfate',sat:1.38,rho:0.95,spec:[[805,12.0,110]],
    cat:{l:'Cu²⁺',c:'#2f74c0',r:9,n:1},an:{l:'SO₄²⁻',c:'#d9b200',r:12,n:1},col:'Cu²⁺(aq)'},
  KMnO4:{w:'KMnO4',anh:'KMnO4',name:'potassium permanganate',sat:0.48,rho:0.65,spec:[[507,1040,11],[526,1335,12],[546,1395,12],[566,610,12],[530,495,35]],
    cat:{l:'K⁺',c:'#8a8c99',r:10,n:1},an:{l:'MnO₄⁻',c:'#7b2d8e',r:12,n:1},col:'MnO₄⁻(aq)'},
  NiCl2:{w:'NiCl2*6H2O',anh:'NiCl2',name:'nickel(II) chloride',sat:4.5,rho:0.85,spec:[[395,5.2,22],[656,1.9,25],[721,2.1,35]],
    cat:{l:'Ni²⁺',c:'#3d9a4a',r:8,n:1},an:{l:'Cl⁻',c:'#9aa58c',r:12,n:2},col:'Ni²⁺(aq)'},
  CoCl2:{w:'CoCl2*6H2O',anh:'CoCl2',name:'cobalt(II) chloride',sat:4.3,rho:0.85,spec:[[510,4.8,32],[470,2.0,18]],
    cat:{l:'Co²⁺',c:'#d0557a',r:8,n:1},an:{l:'Cl⁻',c:'#9aa58c',r:12,n:2},col:'Co²⁺(aq)'},
  K2Cr2O7:{w:'K2Cr2O7',anh:'K2Cr2O7',name:'potassium dichromate',sat:0.51,rho:0.70,spec:[[350,3150,32],[440,370,38]],
    cat:{l:'K⁺',c:'#8a8c99',r:10,n:2},an:{l:'Cr₂O₇²⁻',c:'#e07b1a',r:13,n:1},col:'Cr₂O₇²⁻(aq)'},
  NaCl:{w:'NaCl',anh:'NaCl',name:'sodium chloride',sat:5.4,rho:0.68,spec:[],cat:{l:'Na⁺',c:'#9b59d0',r:8,n:1},an:{l:'Cl⁻',c:'#2fae4e',r:12,n:1},col:'colorless'}};
Object.keys(SOLS).forEach(k=>{const s=SOLS[k];s.Mw=CL.molarMass(s.w);s.Ma=CL.molarMass(s.anh);s.lw=CL.fmt(s.w);s.la=CL.fmt(s.anh);s.colorCache={};});
const MW_H2O=18.015;
/* ---- color of a solution from its absorbance spectrum (CIE 1931 fit of Wyman, Sloan & Shirley 2013) ---- */
const gs=(x,m,s1,s2)=>{const t=(x-m)/(x<m?s1:s2);return Math.exp(-0.5*t*t);};
const xb=l=>1.056*gs(l,599.8,37.9,31.0)+0.362*gs(l,442.0,16.0,26.7)-0.065*gs(l,501.1,20.4,26.2);
const yb=l=>0.821*gs(l,568.8,46.9,40.5)+0.286*gs(l,530.9,16.3,31.1);
const zb=l=>1.217*gs(l,437.0,11.8,36.0)+0.681*gs(l,459.0,26.0,13.8);
const toLin=(X,Y,Z)=>[3.2406*X-1.5372*Y-0.4986*Z,-0.9689*X+1.8758*Y+0.0415*Z,0.0557*X-0.2040*Y+1.0570*Z];
const gam=v=>v<=0.0031308?12.92*v:1.055*Math.pow(v,1/2.4)-0.055;
const eps=(s,l)=>s.spec.reduce((a,b)=>a+b[1]*Math.exp(-0.5*Math.pow((l-b[0])/b[2],2)),0);
function solColor(s,c,b){const key=(c*b).toPrecision(3);if(s.colorCache[key])return s.colorCache[key];let X=0,Y=0,Z=0,X0=0,Y0=0,Z0=0;
  for(let l=380;l<=780;l+=5){const T=Math.pow(10,-eps(s,l)*c*b),x=xb(l),y=yb(l),z=zb(l);X+=x*T;Y+=y*T;Z+=z*T;X0+=x;Y0+=y;Z0+=z;}
  const w=toLin(X0,Y0,Z0),v=toLin(X,Y,Z),rgb=v.map((q,i)=>clamp(gam(clamp(q/w[i],0,1)),0,1));const a=clamp(2.2*(1-Math.min(...rgb)),0,1);
  const out={css:'rgb('+rgb.map(q=>Math.round(q*255)).join(',')+')',a};s.colorCache[key]=out;return out;}
function liquid(ctx,s,c,x,y,w,h,clip){ctx.save();if(clip)clip();ctx.fillStyle=PAL['cv-water'];ctx.fillRect(x,y,w,h);if(c>0&&s.spec.length){const col=solColor(s,c,1);ctx.globalAlpha=col.a;ctx.fillStyle=col.css;ctx.fillRect(x,y,w,h);}ctx.restore();}

const SOL=sim=>SOLS[sim.p.solute];
const f3=v=>Number.isFinite(v)?CL.toSig(v,3):'—';
/* the current solution in whatever mode: {n mol dissolved, V L, c M, solid g undissolved} */
function current(sim){const p=sim.p,s=SOL(sim),st=sim.st;
  if(p.mode==='beaker'){const nmax=s.sat*p.V,nd=Math.min(p.n,nmax);return {n:nd,nAdd:p.n,V:p.V,c:nd/p.V,solid:(p.n-nd)*s.Mw,ok:true};}
  if(p.mode==='flask'){const V=+p.fl/1000,nAdd=p.mg/s.Mw,step=st.step,Vnow=step>=3?V:step>=2?V*0.55:0;
    const nd=Vnow>0?Math.min(nAdd,s.sat*Vnow):0;return {n:nd,nAdd,V:Vnow,c:Vnow>0?nd/Vnow:NaN,solid:(nAdd-nd)*s.Mw,ok:step>=3};}
  const M1=Math.min(p.M1,s.sat),V1=+p.V1/1000,V2=+p.V2/1000,n=M1*V1;return {n,nAdd:n,V:V2,c:n/V2,M1,V1,V2,solid:0,ok:true};}
function extras(sim){const s=SOL(sim),cur=current(sim);if(!(cur.V>0))return {m:NaN,w:NaN,ppm:NaN,x:NaN};
  const anh=cur.n*s.Ma,massSol=cur.V*1000*(0.997+s.rho*anh/(cur.V*1000)),water=massSol-anh;
  return {m:cur.n/(water/1000),w:100*anh/massSol,ppm:1e6*anh/massSol,x:cur.n/(cur.n+water/MW_H2O),rho:massSol/(cur.V*1000)};}
const STEPS=['Weigh the solid','Transfer it to the flask','Add water halfway and swirl to dissolve','Fill to the mark','Stopper and invert to mix'];

function syncMode(sim){if(!sim.ui||!sim.ui.sec)return;const mode=sim.p.mode,d=sim.def;
  d.controls.forEach(c=>{if(!c.modes)return;const cid=d.id+'-'+c.id,e=document.getElementById(cid)||document.getElementById(cid+'-l');if(!e)return;const w=e.closest('.ctl');if(w)w.hidden=!atLeast(c.lvl)||!c.modes.includes(mode);});
  d.metrics.forEach(m=>{if(!m.modes)return;const t=sim.ui.tiles[m.id];if(!t)return;const w=t.num.closest('.tile');if(w)w.hidden=!atLeast(m.lvl)||!m.modes.includes(mode);});
  const btns=[...sim.ui.sec.querySelectorAll('.actions button')];
  d.actions.forEach(a=>{const b=btns.find(x=>x.textContent===a.label);if(b)b.hidden=!atLeast(a.lvl)||!a.modes.includes(mode);});}
const restart=sim=>{if(sim.st){sim.st.step=0;sim.st.anim=0;}};

const MO={
  id:'molarity',hash:'molarity',apUnit:10,order:2,kind:'Virtual lab',tab:'Molarity and dilution',
  prereq:['mole','dissolve'],next:['beerslaw','titration','stoich','colligative'],
  card:'Mix real colored solutions, prepare one in a volumetric flask step by step, and dilute it with a pipet: M = mol/L and M₁V₁ = M₂V₂.',
  title:'Molarity: making and diluting solutions',
  lede:{bio:'Molarity tells you how crowded the solute particles are: moles of solute per liter of solution. Add solute and the color deepens; add water and it fades, even though the particles are all still there.',
        honors:'Prepare a solution the way a chemist does, in a volumetric flask, and dilute a stock with a pipet. Watch for the hydrate: the blue crystals you weigh include water.',
        ap:'Convert between molarity, molality, mass percent, ppm and mole fraction, using the solution’s density.'},
  scale:{bio:'Beakers and flasks hold 0.1 to 1 L. The circle zooms into a tiny drop of the solution; more particles in the circle means a higher concentration.',
         ap:'The zoom shows a fixed tiny volume. Each drawn formula unit stands for a fixed concentration (shown under the circle), so the count is proportional to M.'},
  aspect:1.6,timeless:true,animated:true,chChange:1.2,chReveal:3.6,
  controls:[
    {id:'mode',label:'Lab setup',type:'seg',def:'beaker',lvl:'bio',options:[{v:'beaker',l:'Mix in a beaker'},{v:'flask',l:'Volumetric flask'},{v:'dilute',l:'Dilute a stock',lvl:'honors'}],onChange(sim){syncMode(sim);}},
    {id:'solute',label:'Solute',type:'select',def:'CuSO4',lvl:'bio',options:Object.keys(SOLS).map(k=>({v:k,l:SOLS[k].lw+' ('+SOLS[k].name+')'})),onChange:restart},
    {id:'n',label:'Solute amount',type:'range',min:0,max:1,step:0.005,def:0.5,unit:' mol',d:3,lvl:'bio',modes:['beaker']},
    {id:'V',label:'Solution volume',type:'range',min:0.2,max:1,step:0.005,def:0.5,unit:' L',d:3,lvl:'bio',modes:['beaker']},
    {id:'fl',label:'Volumetric flask',type:'seg',def:'250',lvl:'bio',modes:['flask'],options:[{v:'100',l:'100.00 mL'},{v:'250',l:'250.00 mL'},{v:'500',l:'500.00 mL'}],onChange:restart},
    {id:'mg',label:'Mass you weigh out',type:'range',min:0,max:40,step:0.01,def:6.24,unit:' g',d:2,lvl:'bio',modes:['flask'],onChange:restart,help:'The balance reads to 0.01 g.'},
    {id:'M1',label:'Stock concentration M₁',type:'range',min:0.05,max:1.5,step:0.01,def:1.0,unit:' M',d:2,lvl:'honors',modes:['dilute']},
    {id:'V1',label:'Volumetric pipet V₁',type:'seg',def:'10',lvl:'honors',modes:['dilute'],options:[{v:'5',l:'5.00 mL'},{v:'10',l:'10.00 mL'},{v:'25',l:'25.00 mL'},{v:'50',l:'50.00 mL'}],onChange(sim){sim.vis.pipT=1.6;}},
    {id:'V2',label:'Final flask V₂',type:'seg',def:'100',lvl:'honors',modes:['dilute'],options:[{v:'100',l:'100.00 mL'},{v:'250',l:'250.00 mL'},{v:'500',l:'500.00 mL'}],onChange(sim){sim.vis.pipT=1.6;}}
  ],
  actions:[
    {id:'next',label:'Next step',lvl:'bio',primary:true,modes:['flask'],run(sim){sim.st.step=Math.min(4,sim.st.step+1);sim.st.anim=1;}},
    {id:'skip',label:'Do every step',lvl:'bio',modes:['flask'],run(sim){sim.st.step=4;sim.st.anim=1;}},
    {id:'again',label:'Start over',lvl:'bio',modes:['flask'],run:restart}
  ],
  init(){return {step:0,anim:0};},
  step(sim,dt){sim.st.anim=Math.max(0,sim.st.anim-dt);},
  metrics:[
    {id:'M',label:'Concentration (molarity)',unit:'M (mol/L)',lvl:'bio',min:0,max:null,d:3,get:s=>{const c=current(s);return c.ok?c.c:NaN;}},
    {id:'g',label:'Mass of solute',unit:'g',lvl:'bio',min:0,max:null,d:2,modes:['beaker','flask'],get:s=>s.p.mode==='beaker'?s.p.n*SOL(s).Mw:s.p.mg},
    {id:'mol',label:'Moles of solute',unit:'mol',lvl:'bio',min:0,max:null,d:4,get:s=>current(s).nAdd},
    {id:'sat',label:'Saturated?',unit:'',lvl:'bio',text:true,modes:['beaker','flask'],get:s=>{const c=current(s);return c.solid>0.005?'Yes: '+c.solid.toFixed(1)+' g will not dissolve':'No';}},
    {id:'stepT',label:'Flask step',unit:'',lvl:'bio',text:true,modes:['flask'],get:s=>(s.st.step+1)+' of 5: '+STEPS[s.st.step]},
    {id:'M2',label:'Diluted concentration M₂',unit:'M',lvl:'honors',min:0,max:null,d:4,modes:['dilute'],get:s=>current(s).c},
    {id:'fac',label:'Dilution factor V₂/V₁',unit:'×',lvl:'honors',min:0,max:null,d:1,modes:['dilute'],get:s=>+s.p.V2/+s.p.V1},
    {id:'molal',label:'Molality',unit:'mol/kg water',lvl:'ap',min:0,max:null,d:3,get:s=>extras(s).m},
    {id:'wp',label:'Mass percent (anhydrous solute)',unit:'%',lvl:'ap',min:0,max:100,d:2,get:s=>extras(s).w},
    {id:'ppm',label:'Parts per million by mass',unit:'ppm',lvl:'ap',min:0,max:null,d:0,get:s=>extras(s).ppm},
    {id:'chi',label:'Mole fraction of solute',unit:'',lvl:'ap',min:0,max:null,d:4,get:s=>extras(s).x}
  ],
  graphs:[{id:'cn',label:'Concentration vs moles added',lvl:'bio',custom:true},{id:'cv',label:'Concentration vs volume',lvl:'bio',custom:true}],defaultGraph:'cn',
  plot(sim,ctx,box,id){const p=sim.p,s=SOL(sim),cur=current(sim);
    if(id==='cn'){const V=p.mode==='beaker'?p.V:p.mode==='flask'?(+p.fl/1000):(+p.V2/1000),nmax=p.mode==='beaker'?1:p.mode==='flask'?Math.max(0.05,cur.nAdd*1.6):Math.max(0.001,cur.n*2.5);
      const ymax=Math.min(s.sat,nmax/V)*1.15;const ax=axes(ctx,box,{xmin:0,xmax:nmax,ymin:0,ymax,xl:'Moles of solute (mol) in '+(V*1000).toFixed(0)+' mL',yl:'Molarity (M)'});
      ctx.strokeStyle=serColor(1);ctx.lineWidth=2.5;ctx.beginPath();for(let i=0;i<=200;i++){const n=nmax*i/200,c=Math.min(n/V,s.sat);i?ctx.lineTo(ax.X(n),ax.Y(c)):ctx.moveTo(ax.X(n),ax.Y(c));}ctx.stroke();
      if(s.sat<nmax/V){ctx.setLineDash([5,4]);ctx.strokeStyle=PAL['muted'];ctx.beginPath();ctx.moveTo(box.L,ax.Y(s.sat));ctx.lineTo(box.L+box.W,ax.Y(s.sat));ctx.stroke();ctx.setLineDash([]);txt(ctx,'saturated: '+s.sat+' M',box.L+box.W-4,ax.Y(s.sat)-6,{s:12,c:PAL['muted'],a:'right'});}
      if(cur.ok&&Number.isFinite(cur.c)){ctx.fillStyle=PAL['s1'];ctx.beginPath();ctx.arc(ax.X(clamp(cur.nAdd,0,nmax)),ax.Y(cur.c),6,0,6.29);ctx.fill();}
      legend(ctx,box.L+12,box.T+10,[{label:'M = n / V (slope = 1/V)',color:serColor(1)}]);return;}
    const n=cur.nAdd>0?cur.n:0.1,Vmax=p.mode==='beaker'?1:0.6;const ymax=Math.max(0.01,Math.min(s.sat,n/0.05))*1.1;
    const ax=axes(ctx,box,{xmin:0,xmax:Vmax,ymin:0,ymax,xl:'Volume of solution (L), same '+CL.toSig(n,3)+' mol of solute',yl:'Molarity (M)'});
    ctx.strokeStyle=serColor(2);ctx.lineWidth=2.5;ctx.beginPath();let first=true;for(let i=1;i<=300;i++){const V=Vmax*i/300,c=Math.min(n/V,s.sat);if(c>ymax*1.2)continue;first?ctx.moveTo(ax.X(V),ax.Y(c)):ctx.lineTo(ax.X(V),ax.Y(c));first=false;}ctx.stroke();
    if(cur.ok&&cur.V>0){ctx.fillStyle=PAL['s1'];ctx.beginPath();ctx.arc(ax.X(cur.V),ax.Y(cur.c),6,0,6.29);ctx.fill();}
    legend(ctx,box.L+12,box.T+10,[{label:'M = n / V: double V, half M',color:serColor(2)}]);},
  narrate(sim){const p=sim.p,s=SOL(sim),cur=current(sim),hon=atLeast('honors'),ap=atLeast('ap');
    if(p.mode==='beaker'){if(p.n<=0)return 'The beaker holds pure water: 0 mol of solute, so 0 M. <b>Add solute</b> to begin.';
      let r='<b>'+f3(cur.n)+' mol ÷ '+f3(p.V)+' L = '+f3(cur.c)+' M.</b> ';
      if(cur.solid>0.005)return r+'The water is <b>saturated</b> at '+s.sat+' M. The extra '+cur.solid.toFixed(1)+' g of solid sits on the bottom, so adding more solute no longer raises the concentration.';
      r+=s.spec.length?'The '+s.col+' ions absorb some colors of light, so the more crowded they are, the deeper the color. ':'NaCl absorbs no visible light, so its solution stays colorless at any concentration. ';
      if(hon)r+='To make it, weigh '+(p.n*s.Mw).toFixed(1)+' g of '+s.lw+' ('+s.Mw.toFixed(2)+' g/mol).';
      if(ap){const e=extras(sim);r+=' Its molality is '+e.m.toFixed(3)+' m, a little different from M because a liter of solution is not a kilogram of water.';}
      return r;}
    if(p.mode==='flask'){const st=sim.st,V=+p.fl;const need=0.1*V/1000*s.Mw;
      const tip=' (For 0.100 M you need '+need.toFixed(2)+' g.)';
      if(st.step===0)return '<b>Step 1: weigh the solid.</b> The balance reads '+p.mg.toFixed(2)+' g of '+s.lw+', which is '+(p.mg/s.Mw).toFixed(4)+' mol. Press Next step.'+(hon?tip:'');
      if(st.step===1)return '<b>Step 2: transfer it</b> into the '+V+'.00 mL volumetric flask through a funnel, and rinse the weighing boat into the flask so none is lost.';
      if(st.step===2)return '<b>Step 3: add water about halfway and swirl</b> until every crystal dissolves. Do not fill to the line yet: the solid must dissolve first.'+(cur.solid>0.01?' Some solid will not dissolve: this is more than the water can hold.':'');
      const r=(st.step===3?'<b>Step 4: fill to the mark.</b> Add the last water drop by drop until the bottom of the meniscus sits on the line. ':'<b>Done.</b> ')+'Now there is exactly '+V+'.00 mL of solution: '+(cur.nAdd).toFixed(4)+' mol ÷ '+(V/1000).toFixed(5)+' L = <b>'+f3(cur.c)+' M</b>.';
      return r+(st.step===3?' Stopper and invert it to mix.':'')+(p.solute==='CuSO4'&&hon?' Remember the formula you weighed is CuSO₄·5H₂O, 249.68 g/mol, not CuSO₄ (159.61 g/mol).':'');}
    const M1=Math.min(p.M1,s.sat);let r='<b>M₁V₁ = M₂V₂:</b> '+M1.toFixed(2)+' M × '+p.V1+'.00 mL = M₂ × '+p.V2+'.00 mL, so <b>M₂ = '+f3(cur.c)+' M</b>. The pipet moved '+CL.toSig(cur.n,3)+' mol of solute. Adding water spreads those same particles through '+(+p.V2/+p.V1).toFixed(0)+'× the volume.';
    if(p.M1>s.sat)r+=' (The stock cannot be more concentrated than saturated, '+s.sat+' M.)';return r;},
  tour:[
    {title:'Molarity means moles per liter',text:'0.500 mol of copper(II) sulfate in 0.500 L of solution: 0.500 ÷ 0.500 = 1.00 M. The zoom shows a tiny drop: count the Cu²⁺ ions.',focus:[[40,30,420,440],[480,40,310,400]],speed:1,setup(sim){BioLab.setValues(sim,{mode:'beaker',solute:'CuSO4',n:0.5,V:0.5});}},
    {title:'More solute, deeper color',text:'Double the solute to 1.00 mol in the same 0.500 L: 2.00 M. Twice as many ions crowd into each drop, so more light is absorbed and the blue deepens.',focus:[[40,30,420,440],[480,40,310,400]],speed:1,setup(sim){BioLab.setValues(sim,{n:1.0});}},
    {title:'Add water: same particles, more space',text:'Back to 0.500 mol, now in 1.000 L. Nothing left the beaker, but each drop holds half as many ions: 0.500 M, and the color fades.',focus:[[40,30,420,440],[480,40,310,400]],speed:1,setup(sim){BioLab.setValues(sim,{n:0.5,V:1.0});}},
    {title:'There is a limit',text:'Potassium permanganate saturates near 0.48 M. Try to make 0.80 M and the extra solid just sits on the bottom.',focus:[40,30,420,440],speed:1,setup(sim){BioLab.setValues(sim,{solute:'KMnO4',n:0.4,V:0.5});}},
    {title:'The volumetric flask',text:'To make an exact concentration, weigh the solid, dissolve it in part of the water, then fill to the etched mark. 6.24 g of CuSO₄·5H₂O in 250.00 mL gives 0.100 M.',focus:[30,30,740,440],speed:1,setup(sim){BioLab.setValues(sim,{mode:'flask',solute:'CuSO4',fl:'250',mg:6.24});sim.st.step=3;}},
    {lvl:'honors',title:'Dilution',text:'A 10.00 mL pipet of 1.00 M stock, filled to 100.00 mL, gives 0.100 M. The moles stay the same (M₁V₁ = M₂V₂); only the volume grows.',focus:[30,30,740,440],speed:1,setup(sim){BioLab.setValues(sim,{mode:'dilute',solute:'CuSO4',M1:1.0,V1:'10',V2:'100'});}},
    {lvl:'ap',title:'Other ways to say concentration',text:'Molality uses kilograms of water, not liters of solution, so it does not change with temperature. For dilute solutions in water, ppm by mass ≈ mg per liter.',focus:[30,30,740,440],speed:1,setup(sim){BioLab.setValues(sim,{mode:'beaker',solute:'NaCl',n:0.5,V:0.5});}}
  ],
  onTourExit(sim){const base={};MO.controls.forEach(c=>base[c.id]=c.def);BioLab.setValues(sim,base);restart(sim);},
  onChallenge(sim,ch,phase){if(ch&&ch.instant&&ch.set&&phase==='done'){BioLab.setValues(sim,ch.set);if(ch.setAction)MO.actions.find(a=>a.id===ch.setAction).run(sim);}},
  challenges:[
    {lvl:'bio',q:'A beaker holds 0.50 mol of CuSO₄ in 0.50 L (1.0 M). You add water until there is 1.00 L. What is the concentration now?',choices:['Still 1.0 M: the solute is all still there','0.50 M','2.0 M'],correct:1,
     baseline:{mode:'beaker',solute:'CuSO4',n:0.5,V:0.5},change:{V:1.0},changeText:'Water added up to 1.00 L',watch:'cv',
     explain:{bio:'The moles stayed at 0.50 mol, but now they are spread through 1.00 L: 0.50 ÷ 1.00 = 0.50 M. Concentration is about how crowded the particles are, not how many there are in total.'}},
    {lvl:'bio',q:'0.25 mol of CuSO₄ is dissolved in 0.50 L. You add another 0.25 mol to the same 0.50 L. The concentration…',choices:['doubles','stays the same','halves'],correct:0,
     baseline:{mode:'beaker',solute:'CuSO4',n:0.25,V:0.5},change:{n:0.5},changeText:'Solute raised to 0.50 mol',watch:'cn',
     explain:{bio:'0.25 ÷ 0.50 = 0.50 M becomes 0.50 ÷ 0.50 = 1.0 M. Twice as many particles in the same space. The blue gets deeper too.'}},
    {lvl:'bio',q:'You stir 0.40 mol of KMnO₄ into 0.50 L of water. What is the concentration?',choices:['0.80 M','About 0.48 M, with solid left on the bottom','0.40 M'],correct:1,
     baseline:{mode:'beaker',solute:'KMnO4',n:0.1,V:0.5},change:{n:0.4},changeText:'Solute raised to 0.40 mol',watch:'cn',
     explain:{bio:'0.40 ÷ 0.50 would be 0.80 M, but KMnO₄ saturates near 0.48 M at room temperature. Only 0.24 mol dissolves; the other 0.16 mol (25 g) stays solid. A solution cannot pass its saturation limit.'}},
    {lvl:'honors',q:'You weigh 3.99 g of the blue CuSO₄·5H₂O crystals into a 250.00 mL flask and fill to the mark, expecting 0.100 M (3.99 g is right for CuSO₄). What do you actually get?',choices:['0.100 M','About 0.064 M: the crystals are partly water','About 0.16 M'],correct:1,
     baseline:{mode:'flask',solute:'CuSO4',fl:'250',mg:3.99},baselineAction:'skip',changeText:'Watching the finished flask',watch:'cn',
     explain:{honors:'3.99 g is 0.0250 mol of anhydrous CuSO₄ (159.61 g/mol), but the crystals are CuSO₄·5H₂O (249.68 g/mol). 3.99 ÷ 249.68 = 0.0160 mol, and 0.0160 ÷ 0.250 L = 0.0639 M. Weigh 6.24 g of the hydrate instead.'}},
    {lvl:'honors',q:'You pipet 10.00 mL of 1.00 M stock into a 250.00 mL flask instead of a 100.00 mL flask, and fill to the mark. What is M₂?',choices:['0.0400 M','0.100 M','0.250 M'],correct:0,
     baseline:{mode:'dilute',solute:'CuSO4',M1:1.0,V1:'10',V2:'100'},change:{V2:'250'},changeText:'Diluted into the 250.00 mL flask',watch:'cv',
     explain:{honors:'M₂ = M₁V₁ / V₂ = (1.00 M)(10.00 mL) / 250.00 mL = 0.0400 M. Same 0.0100 mol of solute, 2.5 times the volume of the 100 mL flask.'}},
    {lvl:'ap',instant:true,set:{mode:'beaker',solute:'NaCl',n:0.5,V:0.5},q:'For 1.00 M NaCl(aq), is the molality more than, equal to, or less than 1.00 m?',choices:['A little more than 1.00 m','Exactly 1.00 m','A little less than 1.00 m'],correct:0,
     explain:{ap:'The model is now set to 1.00 M NaCl; check the Molality tile (about 1.02 m). One liter of this solution has a mass of about 1037 g, of which 58.4 g is NaCl, so it contains only about 978 g of water. 1.00 mol ÷ 0.978 kg = 1.02 m.'}},
    {lvl:'ap',instant:true,set:{mode:'beaker',solute:'KMnO4',n:0.005,V:1.0},q:'0.0050 mol of KMnO₄ (158.03 g/mol) is dissolved in 1.00 L of solution. About how many ppm by mass is that?',choices:['0.79 ppm','790 ppm','7900 ppm'],correct:1,
     explain:{ap:'0.0050 mol × 158.03 g/mol = 0.790 g in about 998 g of solution: 0.790 ÷ 998 × 10⁶ ≈ 790 ppm. For dilute water solutions, 1 ppm ≈ 1 mg/L. The model is now set to this solution; check the ppm tile.'}}
  ],
  lab:{bio:'<p><b>Question:</b> How do the amount of solute and the volume each affect molarity?</p><ol><li>Keep the volume at 0.500 L. Record trials at 0.100, 0.200, 0.300, 0.400 and 0.500 mol.</li><li>Keep 0.250 mol. Record trials at volumes of 0.250, 0.500, 0.750 and 1.000 L.</li><li>Plot each set on the Trials graph.</li></ol><p>Which graph is a straight line? Which one curves? Explain both using M = mol ÷ L.</p>',
       honors:'<p><b>Question:</b> Can you prepare exactly 250.00 mL of 0.150 M CuSO₄, then dilute it to 0.0150 M?</p><ol><li>Calculate the mass of CuSO₄·5H₂O you need. Choose the 250.00 mL flask, enter that mass, and step through the preparation.</li><li>Record the trial and compare the concentration with your target.</li><li>In Dilute a stock, find a pipet and flask that make 0.0150 M from 0.150 M stock.</li></ol><p>Write the procedure a classmate could follow, with the glassware named at each step.</p>',
       ap:'<p><b>Question:</b> How different are molarity and molality?</p><ol><li>For NaCl, record trials at 0.5, 1.0, 2.0 and 4.0 M (use 0.500 L).</li><li>Repeat with CuSO₄ up to its saturation limit.</li><li>Plot molality against molarity for both solutes.</li></ol><p><b>Claim–evidence–reasoning:</b> Explain why the two units drift apart at high concentration, and why molality is used for colligative properties.</p>'},
  terms:[{t:'Solute / solvent',d:'The substance dissolved / the substance doing the dissolving (here, water).'},{t:'Molarity (M)',d:'Moles of solute per liter of solution: M = mol ÷ L.'},{t:'Concentrated / dilute',d:'More / less solute per volume of solution.'},
    {t:'Saturated',d:'Holding the most solute that can dissolve. Extra solid stays undissolved.'},{t:'Volumetric flask',d:'A flask with one etched line that holds an exact volume (e.g. 250.00 mL) when filled to the mark.'},
    {lvl:'honors',t:'Dilution',d:'Adding solvent to lower the concentration. Moles of solute stay the same: M₁V₁ = M₂V₂.'},{lvl:'honors',t:'Stock solution',d:'A concentrated solution that is diluted to make other solutions.'},
    {lvl:'honors',t:'Volumetric pipet',d:'A pipet that delivers one exact volume (e.g. 10.00 mL).'},{lvl:'honors',t:'Hydrate',d:'A crystal that includes water in its formula, like CuSO₄·5H₂O. Use its full molar mass when weighing.'},
    {lvl:'ap',t:'Molality (m)',d:'Moles of solute per kilogram of solvent.'},{lvl:'ap',t:'Mass percent',d:'Mass of solute ÷ mass of solution × 100%.'},{lvl:'ap',t:'ppm',d:'Parts per million by mass: mass of solute ÷ mass of solution × 10⁶. In dilute water solutions, 1 ppm ≈ 1 mg/L.'},{lvl:'ap',t:'Mole fraction (χ)',d:'Moles of one component ÷ total moles.'}],
  about:'<p><b>Chemistry.</b> M = n/V with molar masses from ChemLab (CuSO₄·5H₂O 249.68, KMnO₄ 158.03, NiCl₂·6H₂O 237.69, CoCl₂·6H₂O 237.93, K₂Cr₂O₇ 294.18, NaCl 58.44 g/mol). Saturation limits near 25 °C: CuSO₄ 1.38 M, KMnO₄ 0.48 M, NiCl₂ 4.5 M, CoCl₂ 4.3 M, K₂Cr₂O₇ 0.51 M, NaCl 5.4 M. In the beaker, the volume you set is the volume of solution; dissolving the solid is assumed not to change it.</p><p><b>Color.</b> Each colored ion’s absorption bands (λ<sub>max</sub> and molar absorptivity: Cu²⁺ 805 nm, ε ≈ 12; MnO₄⁻ 526 nm, ε ≈ 2400; Ni²⁺ 395 and 721 nm; Co²⁺ 510 nm, ε ≈ 4.8; Cr₂O₇²⁻ 350 and 440 nm) gives a transmitted spectrum through 1 cm by Beer’s law, which is turned into an on-screen color with the CIE 1931 color-matching functions.</p><p><b>Deep dive units.</b> Density is estimated as 0.997 g/mL + (a solute-specific factor) × (g anhydrous solute per mL), which is within about 2% of handbook densities below 2 M. Hydrate water counts as solvent. The particle zoom shows formula units at a fixed scale per solute (stated under the circle), so it shows ratios, not real counts.</p>',
  initVis(sim){const v=sim.vis;v.parts=[];v.parts2=[];v.pipT=0;v.water=[];for(let i=0;i<14;i++)v.water.push({u:Math.random(),w:Math.random(),a:Math.random()*6.28,s:(Math.random()-0.5)*1.4});},
  draw(sim,ctx,vdt,k,t){const p=sim.p;ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,500);
    if(p.mode==='beaker')drawBeakerMode(sim,ctx,vdt,k,t);else if(p.mode==='flask')drawFlaskMode(sim,ctx,vdt,k,t);else drawDilute(sim,ctx,vdt,k,t);},
  thumbSetup(sim){sim.p.n=0.6;sim.p.V=0.6;}
};
/* ---------- particle zoom: formula units in a tiny fixed volume ---------- */
function zoom(sim,ctx,store,cx,cy,R,c,vdt,k,t,title){const s=SOL(sim),scale=s.sat/30;let units=c>0?Math.max(1,Math.round(c/scale)):0;units=Math.min(34,units);
  const per=s.cat.n+s.an.n;const want=units*per;
  while(store.length<want){const i=store.length,isCat=(i%per)<s.cat.n;store.push({cat:isCat,x:cx+(Math.random()-0.5)*R*1.5,y:cy+(Math.random()-0.5)*R*1.5,vx:0,vy:0});}
  while(store.length>want)store.pop();
  ctx.save();ctx.beginPath();ctx.arc(cx,cy,R,0,6.29);ctx.fillStyle=PAL['cv-water'];ctx.fill();
  if(c>0&&s.spec.length){const col=solColor(s,c,1);ctx.globalAlpha=col.a*0.35;ctx.fillStyle=col.css;ctx.fill();ctx.globalAlpha=1;}ctx.clip();
  sim.vis.water.forEach((w,i)=>{if(!RM)w.a+=w.s*vdt;const x=cx+(w.u-0.5)*R*1.8,y=cy+(w.w-0.5)*R*1.8;drawWater(ctx,x,y,w.a);});
  store.forEach(q=>{if(!RM&&vdt>0){q.vx+=(Math.random()-0.5)*900*vdt;q.vy+=(Math.random()-0.5)*900*vdt;const dm=Math.pow(0.2,vdt);q.vx*=dm;q.vy*=dm;q.x+=q.vx*vdt;q.y+=q.vy*vdt;}
    const dx=q.x-cx,dy=q.y-cy,d=Math.hypot(dx,dy),lim=R-12;if(d>lim){q.x=cx+dx/d*lim;q.y=cy+dy/d*lim;q.vx=-q.vx*0.5;q.vy=-q.vy*0.5;}
    const o=q.cat?s.cat:s.an;ball(ctx,q.x,q.y,o.c,o.r);});
  ctx.restore();ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=3;ctx.beginPath();ctx.arc(cx,cy,R,0,6.29);ctx.stroke();
  if(title)txt(ctx,title,cx,cy-R-12,{s:13*k,w:700,a:'center'});
  return scale;}
function zoomLegend(sim,ctx,cx,y,k,scale){const s=SOL(sim);ctx.font='700 '+(12*k)+'px '+FONT;const a=s.cat.l,b=s.an.l;const wa=ctx.measureText(a).width,wb=ctx.measureText(b).width;const tot=wa+wb+70;cx=Math.min(cx,796-tot/2);let x=cx-tot/2;
  ball(ctx,x+9,y,s.cat.c,Math.min(9,s.cat.r));txt(ctx,a,x+22,y,{s:12*k,w:700,b:'middle'});x+=wa+40;ball(ctx,x+9,y,s.an.c,Math.min(9,s.an.r));txt(ctx,b,x+22,y,{s:12*k,w:700,b:'middle'});
  if(atLeast('ap')){const st='1 drawn formula unit ≈ '+CL.toSig(scale,2)+' M';ctx.font='400 '+(12*k)+'px '+FONT;const w2=ctx.measureText(st).width;txt(ctx,st,Math.min(cx,796-w2/2),y+20*k,{s:12*k,c:PAL['cv-soft'],a:'center'});}}
function ball(ctx,x,y,c,r){ctx.fillStyle=c;ctx.beginPath();ctx.arc(x,y,r,0,6.29);ctx.fill();ctx.strokeStyle=CL.shade(c,-0.45);ctx.lineWidth=1.2;ctx.stroke();ctx.fillStyle='rgba(255,255,255,.4)';ctx.beginPath();ctx.arc(x-r*0.35,y-r*0.35,r*0.3,0,6.29);ctx.fill();}
function drawWater(ctx,x,y,a){ctx.globalAlpha=0.75;ctx.fillStyle='#fff';for(const d of [-0.91,0.91]){ctx.beginPath();ctx.arc(x+Math.cos(a+d)*6,y+Math.sin(a+d)*6,2.8,0,6.29);ctx.fill();}ctx.fillStyle='#e53935';ctx.beginPath();ctx.arc(x,y,4.6,0,6.29);ctx.fill();ctx.globalAlpha=1;}
function crystals(ctx,s,cx,y,w,g){const n=Math.round(clamp(Math.sqrt(g)*4,1,48));const col=s.spec.length?solColor(s,s.sat*0.6,1).css:'#f4f6f8';let row=0,inRow=0,cap=Math.min(Math.floor(w/9),Math.ceil(2*Math.sqrt(n)));
  for(let i=0;i<n;i++){if(inRow>=cap){row++;inRow=0;cap=Math.max(1,cap-2);}const x=cx+(inRow-(cap-1)/2)*9,yy=y-row*6;inRow++;ctx.fillStyle=col;ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,yy-5);ctx.lineTo(x+4,yy);ctx.lineTo(x,yy+3);ctx.lineTo(x-4,yy);ctx.closePath();ctx.fill();ctx.stroke();}}
/* ---------- beaker mode ---------- */
function drawBeakerMode(sim,ctx,vdt,k,t){const p=sim.p,s=SOL(sim),cur=current(sim),hon=atLeast('honors');
  const bx=110,by=110,bw=280,bh=330,Lmax=1.1;const ly=by+bh-(bh-10)*p.V/Lmax;
  const clip=()=>{ctx.beginPath();ctx.moveTo(bx,by);ctx.lineTo(bx,by+bh-10);ctx.quadraticCurveTo(bx,by+bh,bx+10,by+bh);ctx.lineTo(bx+bw-10,by+bh);ctx.quadraticCurveTo(bx+bw,by+bh,bx+bw,by+bh-10);ctx.lineTo(bx+bw,by);ctx.closePath();ctx.clip();};
  liquid(ctx,s,cur.c,bx,ly,bw,by+bh-ly,clip);
  if(cur.solid>0.005)crystals(ctx,s,bx+bw/2,by+bh-8,bw-30,cur.solid);
  ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(bx-8,by);ctx.lineTo(bx,by);ctx.lineTo(bx,by+bh-10);ctx.quadraticCurveTo(bx,by+bh,bx+10,by+bh);ctx.lineTo(bx+bw-10,by+bh);ctx.quadraticCurveTo(bx+bw,by+bh,bx+bw,by+bh-10);ctx.lineTo(bx+bw,by);ctx.stroke();
  for(let i=1;i<=10;i++){const L=i/10,y=by+bh-(bh-10)*L/Lmax;ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(bx+bw,y);ctx.lineTo(bx+bw-(i%2?10:20),y);ctx.stroke();if(i%2===0)txt(ctx,L.toFixed(1)+' L',bx+bw+8,y,{s:12*k,c:PAL['cv-soft'],b:'middle'});}
  // equation card
  rr(ctx,24,18,450,hon?78:56,10);ctx.fillStyle=PAL['card'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
  txt(ctx,'M = '+f3(cur.n)+' mol ÷ '+f3(p.V)+' L = '+f3(cur.c)+' M',38,46,{s:16*k,w:700});
  if(hon)txt(ctx,f3(p.n)+' mol × '+s.Mw.toFixed(2)+' g/mol = '+(p.n*s.Mw).toFixed(1)+' g of '+s.lw,38,72,{s:13*k,c:PAL['cv-soft']});
  else txt(ctx,s.name+(s.spec.length?', '+s.col:' (colorless)'),38,66,{s:12*k,c:PAL['cv-soft']});
  if(cur.solid>0.005)pill(ctx,'Saturated: '+cur.solid.toFixed(1)+' g stays solid',bx+bw/2,by+bh+28,PAL['s4'],'#fff',13*k);
  else txt(ctx,(p.V*1000).toFixed(0)+' mL of solution',bx+bw/2,by+bh+28,{s:13*k,w:600,c:PAL['cv-soft'],a:'center',b:'middle'});
  // zoom
  const zx=625,zy=250,zr=150;ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.2;ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(bx+bw*0.62,by+bh*0.72);ctx.lineTo(zx-zr*0.8,zy-zr*0.6);ctx.moveTo(bx+bw*0.62,by+bh*0.72);ctx.lineTo(zx-zr*0.8,zy+zr*0.6);ctx.stroke();ctx.setLineDash([]);
  ctx.beginPath();ctx.arc(bx+bw*0.62,by+bh*0.72,5,0,6.29);ctx.stroke();
  const sc=zoom(sim,ctx,sim.vis.parts,zx,zy,zr,cur.c,vdt,k,t,'One tiny drop');zoomLegend(sim,ctx,zx,zy+zr+20,k,sc);}
/* ---------- volumetric flask mode ---------- */
function flaskPath(ctx,x,y,sz){const nb=sz*0.11,neck=sz*0.62,R=sz*0.42;ctx.beginPath();ctx.moveTo(x-nb,y);ctx.lineTo(x-nb,y+neck);ctx.bezierCurveTo(x-nb,y+neck+R*0.3,x-R,y+neck+R*0.4,x-R,y+neck+R*1.1);ctx.quadraticCurveTo(x-R,y+neck+R*1.9,x,y+neck+R*1.95);
  ctx.quadraticCurveTo(x+R,y+neck+R*1.9,x+R,y+neck+R*1.1);ctx.bezierCurveTo(x+R,y+neck+R*0.4,x+nb,y+neck+R*0.3,x+nb,y+neck);ctx.lineTo(x+nb,y);return {nb,neck,R,bottom:y+neck+R*1.95,mark:y+neck*0.45};}
function drawFlask(ctx,s,x,y,sz,fillTo,c,label,k,solidG){ctx.save();const g=flaskPath(ctx,x,y,sz);ctx.closePath();ctx.clip();
  if(fillTo!==null){ctx.fillStyle=PAL['cv-water'];ctx.fillRect(x-sz,fillTo,sz*2,g.bottom-fillTo+2);if(c>0&&s.spec.length){const col=solColor(s,c,1);ctx.globalAlpha=col.a;ctx.fillStyle=col.css;ctx.fillRect(x-sz,fillTo,sz*2,g.bottom-fillTo+2);ctx.globalAlpha=1;}}
  if(solidG>0.005)crystals(ctx,s,x,g.bottom-6,g.R*1.2,solidG);ctx.restore();
  flaskPath(ctx,x,y,sz);ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=3;ctx.stroke();
  ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x-g.nb-6,g.mark);ctx.lineTo(x+g.nb+6,g.mark);ctx.stroke();
  if(label)txt(ctx,label,x,g.bottom+22,{s:13*k,w:700,a:'center'});return g;}
function drawFlaskMode(sim,ctx,vdt,k,t){const p=sim.p,s=SOL(sim),st=sim.st,cur=current(sim);const V=+p.fl;
  // step list
  const compact=k>1.25;
  STEPS.forEach((l,i)=>{const y=compact?40:40+i*30*k*0.85,x=compact?34+i*30:34;const done=i<st.step,now=i===st.step;ctx.fillStyle=now?PAL['s1']:done?PAL['s3']:PAL['card2'];ctx.beginPath();ctx.arc(x,y,11,0,6.29);ctx.fill();
    txt(ctx,done?'✓':String(i+1),x,y+1,{s:12,w:800,c:now||done?'#fff':PAL['cv-soft'],a:'center',b:'middle'});if(!compact)txt(ctx,l,52,y,{s:13*k,w:now?800:500,c:now?PAL['cv-ink']:PAL['cv-soft'],b:'middle'});});
  if(compact){const l=STEPS[st.step];txt(ctx,l,22,72+4*k,{s:13*k,w:800,c:PAL['cv-ink'],b:'middle'});}
  // balance
  const bx=60,by=330;rr(ctx,bx,by,170,70,8);ctx.fillStyle=PAL['cv-lamp'];ctx.fill();rr(ctx,bx+30,by+30,110,30,4);ctx.fillStyle='#0f1a12';ctx.fill();
  const shown=st.step===0?p.mg:0;txt(ctx,shown.toFixed(2)+' g',bx+132,by+46,{s:18,w:700,c:'#7CFC9A',a:'right',b:'middle'});
  ctx.fillStyle=PAL['cv-soft'];ctx.fillRect(bx+40,by-6,90,6);
  if(st.step===0&&p.mg>0){ctx.fillStyle=PAL['card'];ctx.beginPath();ctx.moveTo(bx+50,by-6);ctx.lineTo(bx+120,by-6);ctx.lineTo(bx+110,by-22);ctx.lineTo(bx+60,by-22);ctx.closePath();ctx.fill();ctx.strokeStyle=PAL['cv-soft'];ctx.stroke();crystals(ctx,s,bx+85,by-12,50,p.mg);}
  txt(ctx,'balance (±0.01 g)',bx+85,by+88,{s:12*k,c:PAL['cv-soft'],a:'center'});
  // flask
  const sz=V===100?190:V===250?230:270,fx=430,fy=470-(sz*0.62+sz*0.42*1.95)-30;
  const g0=flaskPath(ctx,fx,fy,sz);let fillTo=null;
  if(st.step>=2){const half=g0.bottom-(g0.bottom-(fy+g0.neck+g0.R*0.35))*0.75;fillTo=st.step>=3?g0.mark:half;}
  const solidG=st.step===1?p.mg:cur.solid;
  drawFlask(ctx,s,fx,fy,sz,fillTo,cur.ok?cur.c:(st.step>=2?cur.c:0),V+'.00 mL volumetric flask',k,st.step>=1?solidG:0);
  if(st.step===3){ctx.strokeStyle=PAL['s1'];ctx.lineWidth=2;ctx.beginPath();ctx.arc(fx,g0.mark-2,g0.nb*0.9,0.15*Math.PI,0.85*Math.PI);ctx.stroke();txt(ctx,'meniscus on the mark',fx+g0.nb+12,g0.mark,{s:12*k,w:600,c:PAL['s1'],b:'middle'});}
  if(st.step>=4){ctx.fillStyle=PAL['cv-soft'];rr(ctx,fx-g0.nb-3,fy-16,g0.nb*2+6,18,4);ctx.fill();}
  // result card
  const l1=p.mg.toFixed(2)+' g '+s.lw,l2='÷ '+s.Mw.toFixed(2)+' g/mol = '+(p.mg/s.Mw).toFixed(4)+' mol',l3=st.step>=3?'÷ '+(V/1000).toFixed(5)+' L = '+f3(cur.c)+' M':'Fill to the mark to know M';
  const mw=(t,sz,w)=>{ctx.font=w+' '+sz+'px '+FONT;return ctx.measureText(t).width;};const cw=Math.max(mw(l1,13*k,700),mw(l2,12*k,400),mw(l3,14*k,800))+28,cx0=Math.max(compact?250:520,792-cw),lh=22*k;
  rr(ctx,cx0,26,cw,lh*3+18,10);ctx.fillStyle=PAL['card'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
  txt(ctx,l1,cx0+14,26+9+lh*0.6,{s:13*k,w:700,b:'middle'});txt(ctx,l2,cx0+14,26+9+lh*1.6,{s:12*k,c:PAL['cv-soft'],b:'middle'});txt(ctx,l3,cx0+14,26+9+lh*2.6,{s:st.step>=3?14*k:12*k,w:st.step>=3?800:400,c:st.step>=3?PAL['s1']:PAL['cv-soft'],b:'middle'});
  // zoom on the flask contents
  if(st.step>=2){const zx=692,zy=compact?250:240,zr=compact?78:88;const sc=zoom(sim,ctx,sim.vis.parts,zx,zy,zr,cur.c,vdt,k,t,'');zoomLegend(sim,ctx,zx,zy+zr+18,k,sc);}
  if(st.anim>0&&st.step>=1&&st.step<=2){ctx.globalAlpha=st.anim;pill(ctx,st.step===1?'Transferred: rinse the boat into the flask':'Swirling…',fx,fy-34,PAL['s5'],'#fff',13*k);ctx.globalAlpha=1;}}
/* ---------- dilution mode ---------- */
function drawDilute(sim,ctx,vdt,k,t){const p=sim.p,s=SOL(sim),cur=current(sim),v=sim.vis;v.pipT=Math.max(0,v.pipT-vdt);
  const M1=cur.M1;
  // stock beaker
  const bx=40,by=230,bw=150,bh=190;const ly=by+bh*0.3;const clip=()=>{ctx.beginPath();ctx.rect(bx,by,bw,bh);ctx.clip();};
  liquid(ctx,s,M1,bx,ly,bw,by+bh-ly,clip);ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=3;ctx.strokeRect(bx,by,bw,bh);
  txt(ctx,'Stock: '+M1.toFixed(2)+' M',bx+bw/2,by+bh+22,{s:13*k,w:700,a:'center'});
  // pipet moving from beaker to flask
  const fx=420,sz=+p.V2===100?190:+p.V2===250?230:270,fy=470-(sz*0.62+sz*0.42*1.95)-30;
  const ph=v.pipT>0?1-v.pipT/1.6:1;const px=bx+bw/2+(fx-bx-bw/2)*clamp(ph*1.6-0.2,0,1),py=by-120+Math.sin(clamp(ph*1.6-0.2,0,1)*Math.PI)*-30;
  const pl=Math.min(1,+p.V1/50);ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(px,py-40);ctx.lineTo(px,py+130);ctx.stroke();
  ctx.beginPath();ctx.ellipse(px,py+50,8+12*pl,24,0,0,6.29);ctx.stroke();
  if(ph<0.9){ctx.save();ctx.beginPath();ctx.ellipse(px,py+50,8+12*pl,24,0,0,6.29);ctx.clip();liquid(ctx,s,M1,px-30,py+20,60,60);ctx.restore();}
  txt(ctx,p.V1+'.00 mL pipet',px+14,py-30,{s:12*k,w:600,c:PAL['cv-soft'],a:'left'});
  // flask
  drawFlask(ctx,s,fx,fy,sz,flaskPath(ctx,fx,fy,sz).mark,ph>=0.95?cur.c:0,p.V2+'.00 mL flask: '+f3(cur.c)+' M',k,0);
  // equation and two zooms
  ctx.font='400 '+(13*k)+'px '+FONT;const eqs=M1.toFixed(2)+' M × '+p.V1+' mL = '+f3(cur.c)+' M × '+p.V2+' mL',ew=ctx.measureText(eqs).width+28;
  rr(ctx,18,18,ew,58,10);ctx.fillStyle=PAL['card'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
  txt(ctx,'M₁V₁ = M₂V₂',32,42,{s:14*k,w:800});txt(ctx,eqs,32,64,{s:13*k,c:PAL['cv-soft']});
  const z1=zoom(sim,ctx,sim.vis.parts,675,130,78,M1,vdt,k,t,'A drop of stock');zoom(sim,ctx,sim.vis.parts2,675,345,78,ph>=0.95?cur.c:0,vdt,k,t,'A drop after dilution');
  zoomLegend(sim,ctx,675,445,k,z1);}
MO.onLevel=syncMode;
BioLab.register(MO);
})();
