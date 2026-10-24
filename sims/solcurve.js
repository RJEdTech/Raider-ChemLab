(function(){
'use strict';
const {clamp,rr,txt,pill,atLeast,PAL,FONT,RM,axes,legend,serColor}=BioLab.h;
const CL=window.ChemLab;
/* Solubility in g of solute per 100 g of water, every 10 °C from 0 to 100 °C.
   Salts: CRC Handbook / Perry values as printed on the standard textbook solubility-curve chart.
   NH₃: grams dissolved at 1 atm of NH₃. Ce₂(SO₄)₃: approximate (its hydrate changes with temperature). */
const TS=[0,10,20,30,40,50,60,70,80,90,100];
const SOL={
  KNO3:{f:'KNO3',name:'potassium nitrate',cat:['K',1],an:['NO3',-1],a:1,b:1,d:[13.3,20.9,31.6,45.8,63.9,85.5,110,138,169,202,246]},
  NaNO3:{f:'NaNO3',name:'sodium nitrate',cat:['Na',1],an:['NO3',-1],a:1,b:1,d:[73.0,80.8,87.6,94.9,102,114,124,136,148,163,180]},
  NH4Cl:{f:'NH4Cl',name:'ammonium chloride',cat:['NH4',1],an:['Cl',-1],a:1,b:1,d:[29.4,33.3,37.2,41.4,45.8,50.4,55.3,60.2,65.6,71.2,77.3]},
  KCl:{f:'KCl',name:'potassium chloride',cat:['K',1],an:['Cl',-1],a:1,b:1,d:[28.0,31.2,34.2,37.2,40.1,42.6,45.8,48.3,51.3,54.0,56.3]},
  NaCl:{f:'NaCl',name:'sodium chloride',cat:['Na',1],an:['Cl',-1],a:1,b:1,d:[35.7,35.8,36.0,36.3,36.6,37.0,37.3,37.8,38.4,39.0,39.8]},
  KClO3:{f:'KClO3',name:'potassium chlorate',cat:['K',1],an:['ClO3',-1],a:1,b:1,d:[3.3,5.2,7.3,10.1,13.9,19.3,23.8,30.2,37.6,46.0,56.3]},
  Ce2SO43:{f:'Ce2(SO4)3',name:'cerium(III) sulfate',cat:['Ce',3],an:['SO4',-2],a:2,b:3,d:[20.8,15.1,10.1,7.4,5.7,4.6,3.9,3.3,2.8,2.3,2.0]},
  NH3:{f:'NH3',name:'ammonia',gas:true,a:1,b:0,d:[88.5,70.0,56.0,44.0,34.0,27.0,20.0,15.0,11.0,8.0,7.4]}};
/* Dissolved O₂ in water in contact with air at 1 atm (mg/L), USGS/APHA tables; 0 at the boiling point. */
const O2=[14.6,11.3,9.1,7.6,6.4,5.6,4.8,3.9,2.9,1.6,0.0];
const KEYS=Object.keys(SOL);
Object.keys(SOL).forEach(k=>{const s=SOL[k];s.M=CL.molarMass(s.f);s.fn=mkCurve(TS,s.d);s.label=CL.fmt(s.f);});
const O2fn=mkCurve(TS,O2);
const PRES={sea:{P:1.00,l:'Sea level, 1.00 atm air'},denver:{P:0.83,l:'Denver, 0.83 atm air'},pure:{P:4.76,l:'Pure O₂ at 1 atm'}};
const Q=10;            // particle view: one formula unit drawn per 0.1 mol
const RATE=6;          // °C per second the hot plate / ice bath changes the solution temperature
/* monotone cubic interpolation on a uniform grid (no overshoot between table values) */
function mkCurve(xs,ys){const n=xs.length,d=[],m=new Array(n);for(let i=0;i<n-1;i++)d[i]=(ys[i+1]-ys[i])/(xs[i+1]-xs[i]);
  m[0]=d[0];m[n-1]=d[n-2];for(let i=1;i<n-1;i++)m[i]=d[i-1]*d[i]<=0?0:(d[i-1]+d[i])/2;
  for(let i=0;i<n-1;i++){if(d[i]===0){m[i]=m[i+1]=0;continue;}const a=m[i]/d[i],b=m[i+1]/d[i],s=a*a+b*b;if(s>9){const t=3/Math.sqrt(s);m[i]=t*a*d[i];m[i+1]=t*b*d[i];}}
  return x=>{x=clamp(x,xs[0],xs[n-1]);const h=xs[1]-xs[0];let i=Math.min(n-2,Math.floor((x-xs[0])/h));const t=(x-xs[i])/h,t2=t*t,t3=t2*t;
    return (2*t3-3*t2+1)*ys[i]+(t3-2*t2+t)*h*m[i]+(-2*t3+3*t2)*ys[i+1]+(t3-t2)*h*m[i+1];};}
const S=(sim,T)=>SOL[sim.p.solute].fn(T===undefined?sim.st.T:T);
const o2=(sim,T)=>O2fn(T===undefined?sim.st.T:T)*PRES[sim.p.P].P;
const impurity=sim=>sim.p.imp?(sim.p.solute==='NaCl'?'KNO3':'NaCl'):null;
const f1=v=>(Math.abs(v)<0.05?0:v).toFixed(1);
function stateOf(sim){const st=sim.st,s=S(sim),sol=SOL[sim.p.solute];if(sol.gas)return st.md>=s-0.05?'Saturated':'Unsaturated';
  if(st.md>s+0.3)return 'Supersaturated';if(st.mc>0.05||Math.abs(st.md-s)<0.3)return 'Saturated';return 'Unsaturated';}

/* ---------- show only what the current view uses ---------- */
function syncMode(sim){if(!sim.ui||!sim.ui.sec)return;const mode=sim.p.view,d=sim.def;
  d.controls.forEach(c=>{if(!c.modes)return;const cid=d.id+'-'+c.id,e=document.getElementById(cid)||document.getElementById(cid+'-l');if(!e)return;const w=e.closest('.ctl');if(w)w.hidden=!atLeast(c.lvl)||!c.modes.includes(mode);});
  d.metrics.forEach(m=>{if(!m.modes)return;const t=sim.ui.tiles[m.id];if(!t)return;const w=t.num.closest('.tile');if(w)w.hidden=!atLeast(m.lvl)||!m.modes.includes(mode);});
  const btns=[...sim.ui.sec.querySelectorAll('.actions button')];
  d.actions.forEach(a=>{const b=btns.find(x=>x.textContent===a.label);if(b)b.hidden=!atLeast(a.lvl)||!a.modes.includes(mode);});}

function equilibrate(sim){const st=sim.st,p=sim.p,sol=SOL[p.solute],m=Math.max(0,p.mass-st.removed),s=S(sim);
  if(sol.gas){st.md=Math.min(m,s);st.lost=m-st.md;st.mc=0;}else{st.md=Math.min(m,s);st.mc=m-st.md;}}

const SC={
  id:'solcurve',hash:'solcurve',apUnit:10,order:3,kind:'Simulation',tab:'Solubility curves',
  prereq:['dissolve'],next:['molarity','colligative','ksp'],
  card:'Heat and cool a beaker of salt water, watch crystals form, and read the real solubility curves to predict how many grams come out.',
  title:'Solubility curves: how much dissolves, and what comes back out',
  lede:{bio:'Each curve shows the most solute that 100 g of water can hold at each temperature. Put a mass in the beaker, heat or cool it, and watch the dot move on the graph.',
        honors:'Below the curve the solution is unsaturated; on it, saturated. Cool a solution carefully and it can hold more than the curve says: a supersaturated solution, until a seed crystal arrives.',
        ap:'Use the curves quantitatively: predict the mass of crystals, the percent recovery of a recrystallization, and how pressure and temperature set dissolved O₂ through Henry’s law.'},
  scale:{bio:'Beaker: 100 g (about 100 mL) of water. In the particle view, each ball is one ion or molecule and stands for about 0.1 mol.',
         ap:'Beaker: 100 g of water. Particle view: one drawn formula unit ≈ 0.1 mol (about 6 × 10²² real units).'},
  aspect:1.6,timeScale:1,dtMax:0.02,prewarm:0,sampleDt:0.2,window:30,unit:'s',chChange:1.2,chReveal:14,graph:true,
  controls:[
    {id:'view',label:'What dissolves',type:'seg',def:'solid',lvl:'bio',options:[{v:'solid',l:'Solids (and NH₃)'},{v:'gas',l:'Oxygen gas'}],onChange(sim){syncMode(sim);}},
    {id:'solute',label:'Solute',type:'select',def:'KNO3',lvl:'bio',modes:['solid'],options:KEYS.map(k=>({v:k,l:SOL[k].label+' ('+SOL[k].name+')'})),
     onChange(sim){if(sim.st){sim.st.removed=0;sim.st.yieldPct=NaN;sim.st.collected=NaN;sim.st.seeded=false;equilibrate(sim);sim.st.path=[];}}},
    {id:'mass',label:'Solute added to 100 g water',type:'range',min:0,max:250,step:0.5,def:80,unit:' g',lvl:'bio',modes:['solid'],
     onChange(sim){if(sim.st){sim.st.removed=0;sim.st.yieldPct=NaN;sim.st.collected=NaN;}}},
    {id:'T',label:'Temperature setting',type:'range',min:0,max:100,step:1,def:40,unit:' °C',lvl:'bio',help:'The hot plate or ice bath brings the solution to this temperature over a few seconds.'},
    {id:'undist',label:'Cool without disturbing',type:'toggle',def:false,lvl:'honors',modes:['solid'],help:'No dust, scratches or stirring, so new crystals have nowhere to start.'},
    {id:'imp',label:'Add 10 g impurity',type:'toggle',def:false,lvl:'ap',modes:['solid'],help:'10 g of NaCl mixed in (10 g of KNO₃ if the solute is NaCl). Recrystallization should leave it behind.'},
    {id:'P',label:'Gas above the water',type:'seg',def:'sea',lvl:'ap',modes:['gas'],options:[{v:'sea',l:'Air, sea level'},{v:'denver',l:'Air, Denver'},{v:'pure',l:'Pure O₂'}]}
  ],
  actions:[
    {id:'super',label:'Make it supersaturated',lvl:'honors',modes:['solid'],run(sim){const st=sim.st,p=sim.p,sol=SOL[p.solute];if(sol.gas)return;
      const m=Math.max(0,p.mass-st.removed);let smax=0;TS.forEach(T=>smax=Math.max(smax,sol.fn(T)));
      st.md=Math.min(m,smax);st.mc=m-st.md;st.T=p.T;st.seeded=false;if(!p.undist)BioLab.setValues(sim,{undist:true});sim.vis.flash=1.2;sim.vis.flashTxt='Heated until it all dissolved, then cooled undisturbed';}},
    {id:'seed',label:'Drop in a seed crystal',lvl:'honors',modes:['solid'],run(sim){const st=sim.st;if(SOL[sim.p.solute].gas)return;st.seeded=true;st.mc+=0.05;sim.vis.seedT=1.5;}},
    {id:'filter',label:'Filter and weigh the crystals',lvl:'honors',modes:['solid'],run(sim){const st=sim.st;if(SOL[sim.p.solute].gas)return;
      st.collected=st.mc;st.yieldPct=100*st.mc/sim.p.mass;st.removed+=st.mc;st.mc=0;st.seeded=false;sim.vis.flash=1.6;sim.vis.flashTxt='Collected '+f1(st.collected)+' g of crystals on the filter paper';}}
  ],
  init(sim){const st={T:sim.p.T,md:0,mc:0,lost:0,removed:0,seeded:false,collected:NaN,yieldPct:NaN,path:[]};sim.st=st;equilibrate(sim);return st;},
  step(sim,dt){const p=sim.p,st=sim.st,sol=SOL[p.solute];
    const dT=p.T-st.T;st.T+=clamp(dT,-RATE*dt,RATE*dt);
    const s=S(sim),mt=Math.max(0,p.mass-st.removed);
    if(sol.gas){const avail=Math.max(0,mt-st.lost);if(avail>s){st.lost+=avail-s;}st.md=Math.min(mt-st.lost,s);st.mc=0;}
    else{let diff=mt-(st.md+st.mc);if(diff>0)st.mc+=diff;else if(diff<0){const take=Math.min(st.mc,-diff);st.mc-=take;diff+=take;if(diff<0)st.md=Math.max(0,st.md+diff);}
      if(st.md<s&&st.mc>0){const d=Math.min(st.mc,(s-st.md)*(1-Math.exp(-dt/1.0)));st.md+=d;st.mc-=d;}
      else if(st.md>s){const canGrow=st.mc>0.001||st.seeded||!p.undist||st.md>2*s+1;
        if(canGrow){const d=(st.md-s)*(1-Math.exp(-dt/0.9));st.md-=d;st.mc+=d;}}
      if(st.mc<1e-4)st.mc=0;}
    const last=st.path[st.path.length-1];if(!last||Math.abs(last.T-st.T)>0.8||Math.abs(last.c-st.mc)>0.8){st.path.push({T:st.T,c:st.mc,d:st.md});if(st.path.length>400)st.path.shift();}},
  metrics:[
    {id:'state',label:'The solution is',unit:'',lvl:'bio',text:true,modes:['solid'],get:s=>stateOf(s)},
    {id:'S',label:'Solubility at this temperature',unit:'g per 100 g water',lvl:'bio',min:0,max:250,d:1,modes:['solid'],get:s=>S(s)},
    {id:'md',label:'Dissolved',unit:'g',lvl:'bio',min:0,max:250,d:1,modes:['solid'],get:s=>s.st.md},
    {id:'mc',label:'Undissolved (crystals, or gas that escaped)',unit:'g',lvl:'bio',min:0,max:250,d:1,modes:['solid'],get:s=>SOL[s.p.solute].gas?s.st.lost:s.st.mc},
    {id:'Tm',label:'Solution temperature',unit:'°C',lvl:'bio',min:0,max:100,d:0,get:s=>s.st.T},
    {id:'room',label:'Can still dissolve',unit:'g',lvl:'honors',min:0,max:250,d:1,modes:['solid'],get:s=>Math.max(0,S(s)-s.st.md)},
    {id:'rec',label:'Percent recovery (last filtering)',unit:'%',lvl:'ap',min:0,max:100,d:1,modes:['solid'],get:s=>s.st.yieldPct},
    {id:'wp',label:'Mass percent of solute',unit:'%',lvl:'ap',min:0,max:100,d:1,modes:['solid'],get:s=>100*s.st.md/(100+s.st.md)},
    {id:'molal',label:'Molality of the solution',unit:'mol/kg',lvl:'ap',min:0,max:30,d:2,modes:['solid'],get:s=>s.st.md/SOL[s.p.solute].M/0.100},
    {id:'o2',label:'Dissolved O₂',unit:'mg/L',lvl:'bio',min:0,max:16,d:1,modes:['gas'],get:s=>o2(s)},
    {id:'fish',label:'For fish this water is',unit:'',lvl:'bio',text:true,modes:['gas'],get:s=>fishText(o2(s))},
    {id:'kH',label:'Henry’s law constant kH',unit:'mol/(L·atm)',lvl:'ap',min:0,max:0.003,d:5,modes:['gas'],get:s=>{const P=s.p.P==='pure'?1:0.2095*PRES[s.p.P].P;return o2(s)/32000/P;}}
  ],
  graphs:[{id:'all',label:'All solubility curves',lvl:'bio',custom:true},{id:'path',label:'Crystals vs temperature (your path)',lvl:'bio',custom:true},{id:'gas',label:'Dissolved O₂ vs temperature',lvl:'bio',custom:true}],
  defaultGraph:'all',
  plot(sim,ctx,box,id){const p=sim.p,st=sim.st;
    if(id==='gas'){const ax=axes(ctx,box,{xmin:0,xmax:100,ymin:0,ymax:16,xl:'Temperature (°C)',yl:'Dissolved O₂ (mg/L), air at sea level'});
      ctx.strokeStyle=PAL['s2'];ctx.lineWidth=2.5;ctx.beginPath();for(let T=0;T<=100;T+=1){const y=O2fn(T);T?ctx.lineTo(ax.X(T),ax.Y(y)):ctx.moveTo(ax.X(T),ax.Y(y));}ctx.stroke();
      ctx.setLineDash([5,4]);ctx.strokeStyle=PAL['muted'];ctx.lineWidth=1.2;[[6,'trout need ≥ 6'],[4,'bass stressed < 4'],[2,'fish die < 2']].forEach(([v,l])=>{ctx.beginPath();ctx.moveTo(box.L,ax.Y(v));ctx.lineTo(box.L+box.W,ax.Y(v));ctx.stroke();txt(ctx,l,box.L+box.W-4,ax.Y(v)-5,{s:12,c:PAL['muted'],a:'right'});});ctx.setLineDash([]);
      const T=st.T;ctx.fillStyle=PAL['s1'];ctx.beginPath();ctx.arc(ax.X(T),ax.Y(O2fn(T)),6,0,6.29);ctx.fill();return;}
    if(id==='path'){const sol=SOL[p.solute];const ymax=Math.max(10,p.mass*1.05);const ax=axes(ctx,box,{xmin:0,xmax:100,ymin:0,ymax,xl:'Temperature (°C)',yl:sol.gas?'Gas escaped (g)':'Crystals on the bottom (g)'});
      ctx.setLineDash([5,4]);ctx.strokeStyle=PAL['muted'];ctx.lineWidth=1.5;ctx.beginPath();for(let T=0;T<=100;T+=1){const y=clamp(p.mass-sol.fn(T),0,ymax);T?ctx.lineTo(ax.X(T),ax.Y(y)):ctx.moveTo(ax.X(T),ax.Y(y));}ctx.stroke();ctx.setLineDash([]);
      st.path.forEach(q=>{ctx.fillStyle=serColor(1);ctx.beginPath();ctx.arc(ax.X(q.T),ax.Y(sol.gas?0:q.c),3.5,0,6.29);ctx.fill();});
      legend(ctx,box.L+12,box.T+10,[{label:'predicted: mass − solubility',color:PAL['muted'],dash:true},{label:'your beaker',color:serColor(1)}]);return;}
    box=Object.assign({},box,{W:box.W-54});const ax=axes(ctx,box,{xmin:0,xmax:100,ymin:0,ymax:250,xl:'Temperature (°C)',yl:'g solute / 100 g H₂O'});
    ctx.save();ctx.beginPath();ctx.rect(box.L,box.T,box.W,box.H);ctx.clip();
    const placed=[];
    KEYS.forEach((k,i)=>{const s=SOL[k],sel=k===p.solute&&p.view==='solid';ctx.strokeStyle=sel?PAL['s1']:serColor(i%5+1);ctx.lineWidth=sel?3.5:1.8;ctx.setLineDash(s.gas?[6,4]:[]);ctx.beginPath();
      for(let T=0;T<=100;T+=1){const y=s.fn(T);T?ctx.lineTo(ax.X(T),ax.Y(y)):ctx.moveTo(ax.X(T),ax.Y(y));}ctx.stroke();ctx.setLineDash([]);});
    ctx.restore();
    // labels: at the right end, or where the curve leaves the top of the box
    KEYS.forEach((k,i)=>{const s=SOL[k];let T=100;if(s.d[10]>250){for(let t=0;t<=100;t+=0.5)if(s.fn(t)>245){T=t;break;}}
      let x=ax.X(T),y=ax.Y(Math.min(245,s.fn(T)));let a='left';if(T<100){x-=4;a='right';y=box.T+12;}else x+=4;
      while(placed.some(q=>Math.abs(q-y)<13))y+=13;placed.push(y);
      txt(ctx,s.label,x,y,{s:12,w:k===p.solute?800:600,c:k===p.solute?PAL['s1']:serColor(i%5+1),a,b:'middle'});});
    if(p.view==='solid'){ctx.fillStyle=PAL['fg'];ctx.beginPath();ctx.arc(ax.X(st.T),ax.Y(Math.min(250,p.mass-st.removed)),5.5,0,6.29);ctx.fill();}},
  narrate(sim){const p=sim.p,st=sim.st,hon=atLeast('honors'),ap=atLeast('ap');
    if(p.view==='gas'){const v=o2(sim),c=o2(sim,Math.max(0,st.T-10));
      let s='At '+st.T.toFixed(0)+' °C the water holds <b>'+v.toFixed(1)+' mg/L of O₂</b>. '+(st.T>5?'Cool it 10 °C and it could hold '+c.toFixed(1)+' mg/L. ':'')+'Gases are the opposite of most solids: <b>warm water holds less gas</b>, because faster-moving gas molecules escape the liquid.';
      if(ap&&p.P!=='sea')s+=' Henry’s law: dissolved gas is proportional to its partial pressure, so '+(p.P==='denver'?'Denver air (0.83 atm) gives 17% less O₂ than sea level.':'pure O₂ (4.8× the O₂ pressure of air) gives 4.8× as much.');
      return s;}
    const sol=SOL[p.solute],s=S(sim),stt=stateOf(sim),nm=sol.label;
    if(sol.gas){if(st.lost>0.05)return 'Only '+f1(s)+' g of NH₃ fits in 100 g of water at '+st.T.toFixed(0)+' °C. The other <b>'+f1(st.lost)+' g bubbled out as gas</b>. Gases become less soluble as the water warms, and gas that escapes does not come back when you cool it.';
      return 'All '+f1(st.md)+' g of NH₃ is dissolved. The water could hold '+f1(s)+' g at '+st.T.toFixed(0)+' °C. Warm it and watch the curve fall: gas will bubble out.';}
    const moving=Math.abs(p.T-st.T)>0.5;
    if(stt==='Supersaturated')return '<b>Supersaturated:</b> '+f1(st.md)+' g of '+nm+' is dissolved, but the curve says only '+f1(s)+' g should be. With no crystal to build on, the extra stays dissolved. '+(hon?'Drop in a seed crystal and about '+f1(st.md-s)+' g will crystallize at once.':'');
    if(stt==='Saturated'){if(st.mc>0.05)return '<b>Saturated:</b> 100 g of water holds only '+f1(s)+' g of '+nm+' at '+st.T.toFixed(0)+' °C, so the other <b>'+f1(st.mc)+' g sits on the bottom as crystals</b> ('+f1(p.mass-st.removed)+' − '+f1(s)+' = '+f1(st.mc)+' g). '+(sol.d[10]>sol.d[0]?'Heat it to dissolve more.':'This one is unusual: heating makes even more come out.')+(moving?' The temperature is still changing.':'');
      return '<b>Exactly saturated:</b> the dot sits on the curve. Cool it even a little and crystals start to form.';}
    let r='<b>Unsaturated:</b> '+f1(st.md)+' g of '+nm+' is dissolved, and the water could hold '+f1(s)+' g at '+st.T.toFixed(0)+' °C. The dot sits <b>below the curve</b>, so '+f1(s-st.md)+' g more could still dissolve.';
    if(st.collected>=0&&ap)r+=' Last filtering: '+f1(st.collected)+' g of crystals, a '+st.yieldPct.toFixed(1)+'% recovery.';
    else if(!moving)r+=' Cool it until the dot reaches the curve to see crystals appear.';
    return r;},
  tour:[
    {title:'Reading a solubility curve',text:'Each line is one solute. The height of the line at a temperature is the most solute that 100 g of water can hold there. Red is potassium nitrate, KNO₃.',focus:[60,20,430,440],speed:1,setup(sim){BioLab.setValues(sim,{view:'solid',solute:'KNO3',mass:30,T:50});BioLab.reset(sim);}},
    {title:'Below the curve: unsaturated',text:'30 g of KNO₃ in 100 g of water at 50 °C. The curve says 85.5 g could dissolve, so all 30 g dissolves and the dot sits below the line.',focus:(sim)=>dotRect(sim),speed:1},
    {title:'Above the curve: crystals on the bottom',text:'Add 120 g. Only 85.5 g can dissolve at 50 °C, so the other 34.5 g stays as crystals. The solution is saturated.',focus:[480,20,315,460],speed:1,setup(sim){BioLab.setValues(sim,{mass:120});}},
    {title:'Cool it: more crystals form',text:'Cool to 20 °C. The curve drops to 31.6 g, so 120 − 31.6 = 88.4 g of crystals end up on the bottom. Watch the dot slide along the curve.',focus:[60,20,740,460],speed:1,setup(sim){BioLab.setValues(sim,{T:20});}},
    {title:'Not every curve climbs',text:'NaCl barely changes with temperature, and cerium(III) sulfate gets less soluble when you heat it. Read the curve; never assume.',focus:[60,20,430,440],speed:1,setup(sim){BioLab.setValues(sim,{solute:'Ce2SO43',mass:12,T:20});BioLab.reset(sim);BioLab.setValues(sim,{T:70});}},
    {title:'Gases do the opposite',text:'Warm water holds less dissolved gas. At 30 °C a lake holds about 7.6 mg/L of O₂, and trout need about 6. That is why warm water can suffocate fish.',focus:[60,20,740,460],speed:1,setup(sim){BioLab.setValues(sim,{view:'gas',T:30});BioLab.reset(sim);}},
    {lvl:'honors',title:'Supersaturated',text:'Dissolve 60 g of KNO₃ hot, then cool it to 30 °C without disturbing it. It holds 60 g even though the curve says 45.8 g. A seed crystal makes the extra 14.2 g crystallize at once.',focus:[60,20,740,460],speed:1,
     setup(sim){BioLab.setValues(sim,{view:'solid',solute:'KNO3',mass:60,T:30,undist:true});BioLab.reset(sim);SC.actions[0].run(sim);}},
    {lvl:'ap',title:'Recrystallization',text:'Dissolve 100 g of KNO₃ with 10 g of NaCl at 80 °C, then cool to 0 °C. 86.7 g of KNO₃ crystallizes. The NaCl stays dissolved because 10 g is far below its solubility, so the crystals are pure.',focus:[60,20,740,460],speed:1,
     setup(sim){BioLab.setValues(sim,{view:'solid',solute:'KNO3',mass:100,T:80,undist:false,imp:true});BioLab.reset(sim);BioLab.setValues(sim,{T:0});}}
  ],
  onTourExit(sim){const base={};SC.controls.forEach(c=>base[c.id]=c.def);BioLab.setValues(sim,base);BioLab.reset(sim);},
  challenges:[
    {lvl:'bio',q:'80 g of KNO₃ is fully dissolved in 100 g of water at 70 °C. You cool it to 30 °C. How much KNO₃ comes out as crystals?',choices:['None: once dissolved, it stays dissolved','About 34 g','About 46 g','All 80 g'],correct:1,
     baseline:{view:'solid',solute:'KNO3',mass:80,T:70},change:{T:30},changeText:'Cooled from 70 °C to 30 °C',watch:'path',reveal:12,
     explain:{bio:'At 30 °C the curve says 100 g of water holds only 45.8 g of KNO₃. The rest has to leave the solution: 80 − 45.8 = 34.2 g of crystals.',ap:'Crystals = mass present − solubility at the new temperature = 80 − 45.8 = 34.2 g. This works whenever crystals can form (here they do).'}},
    {lvl:'bio',q:'40 g of NaCl in 100 g of water leaves crystals on the bottom at 20 °C. You heat it to 90 °C. What happens to the crystals?',choices:['They all dissolve: hot water dissolves more','About 1 g of crystals is still there','About half of the salt is still solid'],correct:1,
     baseline:{view:'solid',solute:'NaCl',mass:40,T:20},change:{T:90},changeText:'Heated from 20 °C to 90 °C',watch:'path',reveal:16,
     explain:{bio:'NaCl’s curve is almost flat: 36.0 g at 20 °C and only 39.0 g at 90 °C. Heating dissolves 3 g more, so 1.0 g stays solid. Not every solid gets much more soluble when hot.'}},
    {lvl:'bio',q:'Lake water warms from 10 °C to 30 °C on a hot summer week. What happens to the dissolved oxygen?',choices:['It goes up','It goes down','It stays the same'],correct:1,
     baseline:{view:'gas',T:10},change:{T:30},changeText:'Water warmed from 10 °C to 30 °C',watch:'gas',reveal:9,
     explain:{bio:'Dissolved O₂ falls from 11.3 mg/L to 7.6 mg/L. Gases are less soluble in warm water, which is why fish crowd into cool, deep water in summer.'}},
    {lvl:'honors',q:'60 g of KNO₃ was dissolved hot and cooled undisturbed to 30 °C (supersaturated). You drop in one tiny seed crystal. What happens?',choices:['The seed crystal dissolves','Nothing: the solution is stable','About 14 g of crystals forms quickly'],correct:2,
     baseline:{view:'solid',solute:'KNO3',mass:60,T:30,undist:true},baselineAction:'super',changeAction:'seed',changeText:'Seed crystal dropped in',watch:'path',reveal:7,
     explain:{honors:'A supersaturated solution holds more than its solubility only because the extra has nowhere to start a crystal. The seed gives it one, and the excess (60 − 45.8 = 14.2 g) crystallizes until the solution is just saturated.'}},
    {lvl:'honors',q:'Cerium(III) sulfate is saturated at 20 °C with about 2 g of crystals on the bottom. You heat it to 60 °C. What happens?',choices:['The crystals dissolve','More crystals form','Nothing changes'],correct:1,
     baseline:{view:'solid',solute:'Ce2SO43',mass:12,T:20},change:{T:60},changeText:'Heated from 20 °C to 60 °C',watch:'path',reveal:12,
     explain:{honors:'Ce₂(SO₄)₃ becomes less soluble as it warms: 10.1 g at 20 °C but only 3.9 g at 60 °C. Crystals grow from 1.9 g to 8.1 g. Dissolving it releases heat, so (by Le Châtelier’s principle) heating pushes it back out.'}},
    {lvl:'ap',q:'100 g of KNO₃ and 10 g of NaCl are dissolved in 100 g of water at 80 °C. You cool to 0 °C and filter. What is on the filter paper?',choices:['86.7 g of nearly pure KNO₃','96.7 g: KNO₃ plus most of the NaCl','About 100 g of KNO₃'],correct:0,
     baseline:{view:'solid',solute:'KNO3',mass:100,T:80,imp:true},change:{T:0},changeText:'Cooled from 80 °C to 0 °C',watch:'path',reveal:20,
     explain:{ap:'KNO₃ crystals: 100 − 13.3 = 86.7 g (86.7% recovery). NaCl’s solubility at 0 °C is 35.7 g, far above 10 g, so it stays in the filtrate. The curves’ different shapes are what make recrystallization a purification.'}},
    {lvl:'ap',q:'A trout hatchery moves from sea level to Denver (air pressure 0.83 atm). At the same 20 °C, the dissolved O₂ in its tanks will be…',choices:['the same: only temperature matters','about 17% lower','about 17% higher'],correct:1,
     baseline:{view:'gas',T:20,P:'sea'},change:{P:'denver'},changeText:'Moved to Denver air (0.83 atm)',watch:'gas',reveal:5,
     explain:{ap:'Henry’s law: C = kH·P(O₂). Lower air pressure means lower O₂ partial pressure, so 9.1 mg/L becomes 0.83 × 9.1 = 7.6 mg/L. Colorado hatcheries aerate their water for this reason.'}}
  ],
  lab:{bio:'<p><b>Question:</b> How much KNO₃ crystallizes when a hot solution cools?</p><ol><li>Put 100 g of KNO₃ in the beaker and set 80 °C. Wait until no crystals remain.</li><li>Cool in steps: 70, 60, 50, 40, 30, 20 °C. At each step record a trial (crystals and dissolved).</li><li>Plot temperature (x) against crystals (y) on the Trials graph.</li></ol><p>Use the curve to predict the crystals at 10 °C before you test it. How close were you?</p>',
       honors:'<p><b>Question:</b> Can you build a solubility curve from data, the way the textbook chart was made?</p><ol><li>Pick a solute you have not used. Set the temperature to 10 °C.</li><li>Raise the mass until the first crystals stay on the bottom. Record that mass as the solubility.</li><li>Repeat every 10 °C up to 90 °C.</li><li>Plot your points and compare them with the All solubility curves graph.</li></ol><p>Which solute’s solubility changes the most per 10 °C? Which one goes down?</p>',
       ap:'<p><b>Question:</b> How pure and how complete is a recrystallization?</p><ol><li>Turn on the 10 g impurity. Dissolve 100 g of KNO₃ at 80 °C.</li><li>Cool to 40 °C, filter, and record the percent recovery. Repeat with fresh beakers cooled to 20 °C and 0 °C.</li><li>Predict each recovery from the curve before you filter.</li></ol><p><b>Claim–evidence–reasoning:</b> Explain why the crystals contain no NaCl, and find the highest impurity mass that would still stay dissolved at 0 °C.</p>'},
  terms:[{t:'Solubility',d:'The most solute that dissolves in a given amount of solvent at a given temperature (here, grams per 100 g of water).'},{t:'Solubility curve',d:'A graph of solubility against temperature for one solute.'},
    {t:'Unsaturated',d:'Holds less solute than it could. On the graph, the point is below the curve.'},{t:'Saturated',d:'Holds exactly as much solute as it can. Extra solute stays undissolved; the point is on the curve.'},
    {lvl:'honors',t:'Supersaturated',d:'Holds more dissolved solute than its solubility, made by cooling carefully. Unstable: a seed crystal makes the excess crystallize.'},{lvl:'honors',t:'Seed crystal',d:'A tiny crystal that gives dissolved particles a surface to build on.'},
    {lvl:'honors',t:'Crystallization',d:'Solute leaving a solution as a solid. Mass of crystals = mass present − solubility.'},
    {lvl:'ap',t:'Recrystallization',d:'Purifying a solid by dissolving it hot and cooling it; impurities below their own solubility stay in solution.'},{lvl:'ap',t:'Percent recovery',d:'Mass of crystals collected ÷ mass started with × 100%.'},
    {lvl:'ap',t:'Henry’s law',d:'The solubility of a gas is proportional to its partial pressure above the liquid: C = kH·P.'},{lvl:'ap',t:'Molality',d:'Moles of solute per kilogram of solvent (mol/kg).'}],
  about:'<p><b>Data.</b> Salt solubilities (g per 100 g water) are the CRC Handbook / Perry’s values printed on the standard textbook chart, every 10 °C, joined with a monotone cubic curve. NH₃ is the mass dissolved under 1 atm of NH₃. Ce₂(SO₄)₃ values are approximate, because the hydrate that crystallizes changes with temperature. Dissolved O₂ is for water in contact with air at 1 atm (USGS tables), scaled by pressure with Henry’s law (Denver air is 0.83 atm).</p><p><b>Simplifications.</b> The water mass stays at 100 g (no evaporation). Dissolving and crystallizing approach equilibrium within about a second; real crystals grow over minutes to hours. The temperature changes at 6 °C/s. A supersaturated solution only stays that way with “Cool without disturbing” on, and it crystallizes by itself if it holds more than twice its solubility. Gas that bubbles out is lost. In the particle view, one drawn formula unit stands for about 0.1 mol, and ions are not drawn to scale.</p>',
  initVis(sim){const v=sim.vis;v.free=[];v.lat=0;v.land=[];v.bub=[];v.flash=0;v.seedT=0;v.acc=0;
    v.water=[];for(let i=0;i<16;i++)v.water.push({a:Math.random()*6.28,r:Math.sqrt(Math.random()),ang:Math.random()*6.28,w:(Math.random()-0.5)*1.5});},
  draw(sim,ctx,vdt,k,t){const p=sim.p,st=sim.st,v=sim.vis,hon=atLeast('honors');
    ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,500);
    if(p.view==='gas')drawGasChart(sim,ctx,k);else drawChart(sim,ctx,k);
    drawBeakerSide(sim,ctx,vdt,k,t);
    v.flash=Math.max(0,v.flash-vdt);v.seedT=Math.max(0,v.seedT-vdt);
    if(v.flash>0)pill(ctx,v.flashTxt,400,486,PAL['s5'],'#fff',13*k);
    void hon;},
  thumbSetup(sim){sim.p.mass=120;sim.p.T=30;sim.st.T=30;equilibrate(sim);}
};
function fishText(v){return v>=6?'Enough O₂ even for trout':v>=4?'OK for warm-water fish only':v>=2?'Most fish are stressed':'Too little: fish suffocate';}
function dotRect(sim){const C=chartBox(sim);const x=C.X(sim.st.T),y=C.Y(Math.min(C.ymax,sim.p.mass-sim.st.removed));return [x-60,y-50,120,100];}
function chartBox(sim){const p=sim.p,sol=SOL[p.solute];let ymax=250;
  if(p.view==='gas')ymax=p.P==='pure'?80:16;
  else{let smax=0;TS.forEach(T=>smax=Math.max(smax,sol.fn(T)));if(smax<58&&p.mass<=58)ymax=60;}
  const L=86,T=28,W=380,H=392;return {L,T,W,H,ymax,X:x=>L+x/100*W,Y:y=>T+H-clamp(y,0,ymax*1.02)/ymax*H};}
function axesStage(ctx,C,k,yl,ystep,ygrid){const {L,T,W,H}=C;
  ctx.fillStyle=PAL['card'];ctx.fillRect(L,T,W,H);
  ctx.strokeStyle=PAL['g-grid'];ctx.lineWidth=1;ctx.beginPath();
  for(let x=0;x<=100;x+=5){const px=Math.round(C.X(x))+.5;ctx.moveTo(px,T);ctx.lineTo(px,T+H);}
  for(let y=0;y<=C.ymax+1e-9;y+=ygrid){const py=Math.round(C.Y(y))+.5;ctx.moveTo(L,py);ctx.lineTo(L+W,py);}ctx.stroke();
  ctx.strokeStyle=PAL['g-axis'];ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(L,T);ctx.lineTo(L,T+H);ctx.lineTo(L+W,T+H);ctx.stroke();
  const xs=k>1.3?20:10;for(let x=0;x<=100;x+=xs)txt(ctx,String(x),C.X(x),T+H+8,{s:12*k,c:PAL['cv-soft'],a:'center',b:'top'});
  txt(ctx,'Temperature (°C)',L+W/2,T+H+12+14*k,{s:12*k,w:600,c:PAL['cv-soft'],a:'center',b:'top'});
  for(let y=0;y<=C.ymax+1e-9;y+=ystep)txt(ctx,String(y),L-7,C.Y(y),{s:12*k,c:PAL['cv-soft'],a:'right',b:'middle'});
  ctx.save();ctx.translate(L-34-12*k,T+H/2);ctx.rotate(-Math.PI/2);txt(ctx,yl,0,0,{s:12*k,w:600,c:PAL['cv-soft'],a:'center',b:'middle'});ctx.restore();}
function drawChart(sim,ctx,k){const p=sim.p,st=sim.st,C=chartBox(sim),sol=SOL[p.solute],m=Math.max(0,p.mass-st.removed);
  axesStage(ctx,C,k,'Solubility (g per 100 g water)',C.ymax>100?50:10,C.ymax>100?10:2);
  ctx.save();ctx.beginPath();ctx.rect(C.L,C.T,C.W,C.H);ctx.clip();
  // unsaturated region under the selected curve
  ctx.beginPath();ctx.moveTo(C.X(0),C.Y(0));for(let T=0;T<=100;T+=1)ctx.lineTo(C.X(T),C.Y(sol.fn(T)));ctx.lineTo(C.X(100),C.Y(0));ctx.closePath();ctx.fillStyle=PAL['s3'];ctx.globalAlpha=0.10;ctx.fill();ctx.globalAlpha=1;
  KEYS.forEach(kk=>{if(kk===p.solute)return;const s=SOL[kk];ctx.strokeStyle=PAL['muted'];ctx.globalAlpha=0.45;ctx.lineWidth=1.5;ctx.setLineDash(s.gas?[6,4]:[]);ctx.beginPath();
    for(let T=0;T<=100;T+=1){const y=s.fn(T);T?ctx.lineTo(C.X(T),C.Y(y)):ctx.moveTo(C.X(T),C.Y(y));}ctx.stroke();});ctx.globalAlpha=1;ctx.setLineDash([]);
  ctx.strokeStyle=PAL['s1'];ctx.lineWidth=4;ctx.setLineDash(sol.gas?[8,5]:[]);ctx.beginPath();for(let T=0;T<=100;T+=1){const y=sol.fn(T);T?ctx.lineTo(C.X(T),C.Y(y)):ctx.moveTo(C.X(T),C.Y(y));}ctx.stroke();ctx.setLineDash([]);
  // the beaker's point and the solubility below/above it
  const x=C.X(st.T),s=sol.fn(st.T),ym=C.Y(Math.min(m,C.ymax*1.02)),ys=C.Y(s);const stt=stateOf(sim);
  const col=stt==='Unsaturated'?PAL['s3']:stt==='Saturated'?PAL['s4']:PAL['s5'];
  if(m>s+0.3&&!sol.gas){ctx.strokeStyle=PAL['s4'];ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x,ys);ctx.lineTo(x,ym);ctx.stroke();}
  else if(m<s-0.3){ctx.strokeStyle=PAL['s3'];ctx.setLineDash([4,4]);ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,ym);ctx.lineTo(x,ys);ctx.stroke();ctx.setLineDash([]);}
  ctx.fillStyle=PAL['s1'];ctx.beginPath();ctx.arc(x,ys,5,0,6.29);ctx.fill();
  ctx.restore();
  ctx.fillStyle=col;ctx.strokeStyle=PAL['card'];ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(x,ym,9,0,6.29);ctx.fill();ctx.stroke();
  // curve label at a clear spot
  let lt=sol.d[10]>sol.d[0]?Math.min(88,sol.d[10]>C.ymax?findT(sol,C.ymax*0.9):80):12;if(sol.d[10]<=sol.d[0])lt=8;
  const ly=C.Y(Math.min(C.ymax*0.93,sol.fn(lt)));const lx=C.X(lt);const up=sol.d[10]>sol.d[0];
  pill(ctx,sol.label,clamp(lx+(up?-38*k:34*k),C.L+30*k,C.L+C.W-30*k),clamp(ly-18*k,C.T+14*k,C.T+C.H-14*k),PAL['s1'],'#fff',13*k);
  // readout box in the open area
  const bx=C.L+10,by=C.T+10,bw=Math.min(C.W-20,226*k),hgt=(stt==='Unsaturated'?2:3)*17*k+12;
  const lbx=(sol.d[10]>sol.d[0])?bx:C.L+C.W-10-bw;
  rr(ctx,lbx,by,bw,hgt,8);ctx.fillStyle=PAL['card'];ctx.globalAlpha=0.92;ctx.fill();ctx.globalAlpha=1;ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
  txt(ctx,'At '+st.T.toFixed(0)+' °C the curve: '+f1(s)+' g',lbx+10,by+8+12*k,{s:12*k,w:700});
  txt(ctx,'In the beaker: '+f1(m)+' g',lbx+10,by+8+29*k,{s:12*k,c:PAL['cv-soft']});
  if(stt!=='Unsaturated')txt(ctx,sol.gas?'Escaped: '+f1(st.lost)+' g':stt==='Supersaturated'?'Extra still dissolved: '+f1(st.md-s)+' g':'Crystals: '+f1(m)+' − '+f1(s)+' = '+f1(st.mc)+' g',lbx+10,by+8+46*k,{s:12*k,w:700,c:col});}
function findT(sol,y){for(let t=0;t<=100;t+=0.5)if(sol.fn(t)>=y)return t;return 90;}
function drawGasChart(sim,ctx,k){const p=sim.p,st=sim.st,C=chartBox(sim),f=PRES[p.P].P;
  axesStage(ctx,C,k,'Dissolved O₂ (mg/L)',p.P==='pure'?10:2,p.P==='pure'?5:1);
  ctx.save();ctx.beginPath();ctx.rect(C.L,C.T,C.W,C.H);ctx.clip();
  const bands=[[0,2,PAL['s1'],'fish die'],[2,4,PAL['s4'],'stressed'],[4,6,PAL['s6'],'warm-water fish'],[6,99,PAL['s3'],'trout OK']];
  bands.forEach(b=>{ctx.fillStyle=b[2];ctx.globalAlpha=0.10;ctx.fillRect(C.L,C.Y(b[1]),C.W,C.Y(b[0])-C.Y(b[1]));});ctx.globalAlpha=1;
  if(p.P!=='sea'){ctx.strokeStyle=PAL['muted'];ctx.setLineDash([6,4]);ctx.lineWidth=1.5;ctx.beginPath();for(let T=0;T<=100;T++){const y=O2fn(T);T?ctx.lineTo(C.X(T),C.Y(y)):ctx.moveTo(C.X(T),C.Y(y));}ctx.stroke();ctx.setLineDash([]);}
  ctx.strokeStyle=PAL['s2'];ctx.lineWidth=4;ctx.beginPath();for(let T=0;T<=100;T++){const y=O2fn(T)*f;T?ctx.lineTo(C.X(T),C.Y(y)):ctx.moveTo(C.X(T),C.Y(y));}ctx.stroke();ctx.restore();
  if(p.P!=='pure')[[1,'fish die below 2'],[3,'most fish stressed'],[5,'warm-water fish only'],[7,'trout OK above 6']].forEach(([y,l])=>{txt(ctx,l,C.L+8,C.Y(y),{s:12*k,w:600,c:PAL['cv-soft'],a:'left',b:'middle'});});
  const x=C.X(st.T),y=C.Y(o2(sim));ctx.fillStyle=PAL['s1'];ctx.strokeStyle=PAL['card'];ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(x,y,9,0,6.29);ctx.fill();ctx.stroke();
  pill(ctx,o2(sim).toFixed(1)+' mg/L at '+st.T.toFixed(0)+' °C',clamp(x,C.L+80*k,C.L+C.W-80*k),Math.max(C.T+16*k,y-26*k),PAL['s2'],'#fff',13*k);
  if(p.P!=='sea')txt(ctx,'dashed: air at sea level',C.L+10,C.T+C.H-12,{s:12*k,c:PAL['cv-soft']});}
/* right side: beaker, thermometer, particle zoom */
function drawBeakerSide(sim,ctx,vdt,k,t){const p=sim.p,st=sim.st,v=sim.vis,gas=p.view==='gas',sol=SOL[p.solute];
  const bx=548,bw=170,by=318,bh=132,zx=640,zy=150,zr=104;
  // hot plate / ice bath under the beaker
  const heat=clamp((st.T-25)/75,0,1),cold=clamp((25-st.T)/25,0,1);
  rr(ctx,bx-14,by+bh+4,bw+28,18,5);ctx.fillStyle=PAL['cv-lamp'];ctx.fill();
  if(heat>0.02){ctx.fillStyle='#e8541c';ctx.globalAlpha=0.25+0.6*heat;rr(ctx,bx+10,by+bh+7,bw-20,6,3);ctx.fill();ctx.globalAlpha=1;}
  if(cold>0.05){ctx.strokeStyle=PAL['s2'];ctx.globalAlpha=0.5*cold+0.2;ctx.lineWidth=3;rr(ctx,bx-10,by+bh*0.45,bw+20,bh*0.55+6,10);ctx.stroke();ctx.globalAlpha=1;}
  const liquid=CL.drawBeaker(ctx,{x:bx,y:by,w:bw,h:bh,fill:0.78,liquid:PAL['cv-water']});
  // undissolved crystals (or gas bubbles)
  if(!gas&&!sol.gas){const mc=st.mc,n=Math.round(clamp(Math.sqrt(mc)*5,0,60));const R=CL.FILL.metal;
    let row=0,inRow=0,cap=14;for(let i=0;i<n;i++){if(inRow>=cap){row++;inRow=0;cap=Math.max(3,cap-3);}const sx=bx+bw/2+(inRow-(cap-1)/2)*9+((i*7)%3),sy=by+bh-8-row*6;inRow++;ctx.fillStyle='#f3f6f8';ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(sx,sy-5);ctx.lineTo(sx+5,sy);ctx.lineTo(sx,sy+3);ctx.lineTo(sx-5,sy);ctx.closePath();ctx.fill();ctx.stroke();}void R;}
  const bubbling=(gas&&st.T>p.T+0.3)||(gas&&Math.abs(p.T-st.T)>0.3&&p.T>st.T)||(!gas&&sol.gas&&(Math.abs(p.T-st.T)>0.3&&p.T>st.T||st.lost>0&&v.bubT>0));
  if(!RM&&((gas&&p.T>st.T+0.3)||(sol.gas&&p.T>st.T+0.3)))v.bubT=1;
  v.bubT=Math.max(0,(v.bubT||0)-vdt);
  if(v.bubT>0&&Math.random()<0.5&&v.bub.length<30)v.bub.push({x:bx+20+Math.random()*(bw-40),y:by+bh-10,r:2+Math.random()*3});
  v.bub.forEach(b=>{b.y-=60*vdt;});v.bub=v.bub.filter(b=>b.y>liquid.y+2);
  ctx.strokeStyle=PAL['cv-bstroke'];ctx.lineWidth=1.5;v.bub.forEach(b=>{ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,6.29);ctx.stroke();});void bubbling;
  if(gas)drawFish(ctx,bx+bw/2,by+bh*0.62,o2(sim),t);
  // thermometer
  const tx=bx+bw+34,ty0=by-40,ty1=by+bh-6;ctx.fillStyle=PAL['card'];ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.5;rr(ctx,tx-7,ty0,14,ty1-ty0,7);ctx.fill();ctx.stroke();
  ctx.beginPath();ctx.arc(tx,ty1+6,11,0,6.29);ctx.fillStyle='#d32f2f';ctx.fill();const hy=ty1-(ty1-ty0-10)*clamp(st.T/100,0,1);ctx.fillRect(tx-3.5,hy,7,ty1-hy+2);
  txt(ctx,st.T.toFixed(0)+' °C',tx,ty0-10,{s:13*k,w:700,a:'center'});
  // label under the beaker
  const lab=gas?'Lake water sample, '+PRES[p.P].l.toLowerCase():'100 g water + '+f1(Math.max(0,p.mass-st.removed))+' g '+sol.label+(p.imp?' + 10 g '+CL.fmt(impurity(sim)):'');
  txt(ctx,lab,bx+bw/2+10,by+bh+40,{s:12*k,w:600,a:'center',c:PAL['cv-soft']});
  // zoom circle and its link to the beaker
  ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.2;ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(zx-zr*0.6,zy+zr*0.8);ctx.lineTo(bx+bw*0.3,liquid.y+20);ctx.moveTo(zx+zr*0.6,zy+zr*0.8);ctx.lineTo(bx+bw*0.7,liquid.y+20);ctx.stroke();ctx.setLineDash([]);
  ctx.strokeRect(bx+bw*0.3,liquid.y+20,bw*0.4,30);
  ctx.save();ctx.beginPath();ctx.arc(zx,zy,zr,0,6.29);ctx.fillStyle=PAL['cv-water'];ctx.fill();ctx.clip();
  // a few water molecules for context
  v.water.forEach(w=>{if(!RM)w.ang+=w.w*vdt;const x=zx+Math.cos(w.a)*w.r*(zr-12),y=zy+Math.sin(w.a)*w.r*(zr-12);drawWater(ctx,x,y,w.ang,0.8);});
  if(gas)drawO2Zoom(sim,ctx,zx,zy,zr,vdt);else drawIons(sim,ctx,zx,zy,zr,vdt,t);
  ctx.restore();ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=3;ctx.beginPath();ctx.arc(zx,zy,zr,0,6.29);ctx.stroke();
  // legend under the zoom
  if(gas){CL.drawAtom(ctx,zx-46*k,zy+zr+16,6,'O',{label:''});CL.drawAtom(ctx,zx-46*k+9,zy+zr+16,6,'O',{label:''});txt(ctx,'O₂',zx-46*k+20,zy+zr+16,{s:12*k,w:700,b:'middle'});drawWater(ctx,zx+28*k,zy+zr+16,0,0.8);txt(ctx,'H₂O',zx+28*k+12,zy+zr+16,{s:12*k,w:700,b:'middle'});}
  else if(sol.gas){CL.drawAtom(ctx,zx-18*k,zy+zr+16,8,'N',{label:''});txt(ctx,'NH₃',zx-18*k+12,zy+zr+16,{s:12*k,w:700,b:'middle'});}
  else{const cl=CL.fmt(sol.cat[0],sol.cat[1]),al=CL.fmt(sol.an[0],sol.an[1]);ionBall(ctx,zx-64*k,zy+zr+16,'cat',7);txt(ctx,cl,zx-64*k+11,zy+zr+16,{s:12*k,w:700,b:'middle'});
    ionBall(ctx,zx+16*k,zy+zr+16,'an',8);txt(ctx,al,zx+16*k+12,zy+zr+16,{s:12*k,w:700,b:'middle'});}
  const stt=gas?fishText(o2(sim)):stateOf(sim);const scol=gas?(o2(sim)>=6?PAL['s3']:o2(sim)>=4?PAL['s6']:o2(sim)>=2?PAL['s4']:PAL['s1']):stt==='Unsaturated'?PAL['s3']:stt==='Saturated'?PAL['s4']:PAL['s5'];
  pill(ctx,stt,zx,24,scol,'#fff',14*k);}
function ionBall(ctx,x,y,kind,r){const c=kind==='cat'?CL.FILL.cation:CL.FILL.anion;ctx.fillStyle=c;ctx.beginPath();ctx.arc(x,y,r,0,6.29);ctx.fill();ctx.strokeStyle=CL.shade(c,-0.4);ctx.lineWidth=1;ctx.stroke();}
function drawWater(ctx,x,y,a,al){ctx.globalAlpha=al;const c=Math.cos(a),s=Math.sin(a);ctx.fillStyle='#ffffff';ctx.strokeStyle='#9aa4ab';ctx.lineWidth=0.8;[-0.91,0.91].forEach(d=>{const hx=x+Math.cos(a+d)*6,hy=y+Math.sin(a+d)*6;ctx.beginPath();ctx.arc(hx,hy,2.6,0,6.29);ctx.fill();ctx.stroke();});
  ctx.fillStyle='#e53935';ctx.beginPath();ctx.arc(x,y,4.4,0,6.29);ctx.fill();ctx.globalAlpha=1;void c;void s;}
/* dissolved ions drift; the crystal sits at the bottom; units move between them as the model dissolves or crystallizes */
function drawIons(sim,ctx,zx,zy,zr,vdt,t){const p=sim.p,st=sim.st,v=sim.vis,sol=SOL[p.solute],per=sol.a+sol.b;
  const key=p.solute+(p.imp?'i':'');if(v.key!==key){v.key=key;v.free=[];v.lat=0;v.land=[];}
  const maxUnits=Math.max(1,Math.floor(44/per)),latCap=Math.floor(30/per);
  let tD=Math.round(st.md/sol.M*Q);if(st.md>0.05)tD=Math.max(1,tD);tD=Math.min(maxUnits,tD);
  let tC=Math.round(st.mc/sol.M*Q);if(st.mc>0.05)tC=Math.max(1,tC);tC=Math.min(latCap,tC);
  const curD=v.free.length/Math.max(1,per),landU=v.land.length/Math.max(1,per);
  const sites=latticeSites(zx,zy,zr);
  v.acc+=vdt;const tick=v.acc>0.06||vdt===0;if(tick)v.acc=0;
  if(sol.gas){tC=0;v.lat=0;}
  const jump=Math.abs(curD-tD)>2;
  if(jump&&curD<tD){while(v.free.length/per<tD){const a=Math.random()*6.28,r=Math.sqrt(Math.random())*(zr-20);spawnUnit(v,sol,zx+Math.cos(a)*r,zy-10+Math.sin(a)*r*0.8,per,true);}}
  else if(jump&&curD>tD){while(v.free.length/per>tD)takeUnit(v,sol);}
  else if(tick){
    if(curD<tD){if(v.lat>0){v.lat--;const s0=sites[Math.min(sites.length-1,v.lat*per)];spawnUnit(v,sol,s0.x,s0.y-6,per);}else{const a=Math.random()*6.28,r=Math.sqrt(Math.random())*(zr-20);spawnUnit(v,sol,zx+Math.cos(a)*r,zy-10+Math.sin(a)*r*0.8,per,true);}}
    else if(curD>tD){if(v.lat+landU<tC){const unit=takeUnit(v,sol);unit.forEach((q,i)=>{const s=sites[Math.min(sites.length-1,(v.lat+landU)*per+i)];q.tx=s.x;q.ty=s.y;q.tl=0;v.land.push(q);});}
      else takeUnit(v,sol);}
    else if(v.lat+landU<tC&&!v.land.length)v.lat++;
    else if(v.lat+landU>tC&&v.lat>0)v.lat--;}
  // landing units
  v.land.forEach(q=>{q.tl+=vdt;q.x+=(q.tx-q.x)*Math.min(1,vdt*6);q.y+=(q.ty-q.y)*Math.min(1,vdt*6);});
  const done=v.land.filter(q=>q.tl>0.5);if(done.length>=per){v.land.splice(0,per);v.lat++;}
  // lattice
  for(let i=0;i<v.lat*per&&i<sites.length;i++){const s=sites[i];const isCat=(i%per)<sol.a;ionBall(ctx,s.x,s.y,isCat?'cat':'an',isCat?7:9);}
  // impurity ions stay dissolved
  if(p.imp){const n=2;for(let i=0;i<n;i++){const a=t*0.3+i*3.1,x=zx+Math.cos(a)*zr*0.45,y=zy-20+Math.sin(a*1.3)*zr*0.3;ctx.fillStyle=PAL['cv-soft'];[[0,0,6],[13,4,8]].forEach(d=>{ctx.beginPath();ctx.arc(x+d[0],y+d[1],d[2],0,6.29);ctx.fill();});}}
  // free particles: random walk inside the circle, above the lattice
  const floor=sites.length?sites[0].y-12:zy+zr;
  const top=v.lat>0?floor-Math.ceil(v.lat*per/6)*17:zy+zr;
  v.free.forEach(q=>{if(!RM&&vdt>0){q.vx+=(Math.random()-0.5)*1800*vdt;q.vy+=(Math.random()-0.5)*1800*vdt;const dm=Math.pow(0.15,vdt);q.vx*=dm;q.vy*=dm;q.x+=q.vx*vdt;q.y+=q.vy*vdt;}
    const dx=q.x-zx,dy=q.y-zy,d=Math.hypot(dx,dy);if(d>zr-12){q.x=zx+dx/d*(zr-12);q.y=zy+dy/d*(zr-12);q.vx=-dx/d*Math.abs(q.vx);q.vy=-dy/d*Math.abs(q.vy);}
    if(q.y>top){q.y=top;q.vy=-Math.abs(q.vy);}});
  [...v.free,...v.land].forEach(q=>{if(sol.gas){CL.drawAtom(ctx,q.x,q.y,7,'N',{label:''});[[-7,6],[7,6],[0,-8]].forEach(h=>{ctx.fillStyle='#f2f2f2';ctx.beginPath();ctx.arc(q.x+h[0],q.y+h[1],3,0,6.29);ctx.fill();});}
    else ionBall(ctx,q.x,q.y,q.c?'cat':'an',q.c?7:9);});}
function spawnUnit(v,sol,x,y,per,spread){for(let i=0;i<per;i++){const c=sol.gas?true:i<sol.a;v.free.push({c,x:x+(i-per/2)*(spread?26:10)+(spread?(Math.random()-0.5)*20:0),y:y+(spread?(Math.random()-0.5)*30:0),vx:(Math.random()-0.5)*40,vy:-40-Math.random()*30});}}
function takeUnit(v,sol){const out=[];if(sol.gas){const q=v.free.shift();if(q)out.push(q);return out;}
  for(let i=0;i<sol.a;i++){const j=v.free.findIndex(q=>q.c);if(j>=0)out.push(v.free.splice(j,1)[0]);}
  for(let i=0;i<sol.b;i++){const j=v.free.findIndex(q=>!q.c);if(j>=0)out.push(v.free.splice(j,1)[0]);}return out;}
function latticeSites(zx,zy,zr){const out=[];for(let r=0;r<6;r++){const y=zy+zr-20-r*17,half=Math.sqrt(Math.max(0,(zr-12)*(zr-12)-(y-zy)*(y-zy)));const n=Math.min(6,Math.floor(half*2/18));
    for(let c=0;c<n;c++){const x=zx+(c-(n-1)/2)*18;out.push({x,y});}}
  // fill from the bottom-center outward
  return out;}
function drawO2Zoom(sim,ctx,zx,zy,zr,vdt){const v=sim.vis,n=Math.round(clamp(o2(sim)*1.4,0,40));
  if(!v.o2)v.o2=[];while(v.o2.length<n)v.o2.push({x:zx+(Math.random()-0.5)*zr*1.4,y:zy+(Math.random()-0.5)*zr*1.4,a:Math.random()*6.28,vx:0,vy:0});
  while(v.o2.length>n){const q=v.o2.pop();if(!v.esc)v.esc=[];v.esc.push({x:q.x,y:q.y,l:1});}
  v.o2.forEach(q=>{if(!RM&&vdt>0){q.vx+=(Math.random()-0.5)*1800*vdt;q.vy+=(Math.random()-0.5)*1800*vdt;const dm=Math.pow(0.15,vdt);q.vx*=dm;q.vy*=dm;q.x+=q.vx*vdt;q.y+=q.vy*vdt;q.a+=vdt;}
    const dx=q.x-zx,dy=q.y-zy,d=Math.hypot(dx,dy);if(d>zr-10){q.x=zx+dx/d*(zr-10);q.y=zy+dy/d*(zr-10);q.vx*=-0.5;q.vy*=-0.5;}
    const c=Math.cos(q.a)*5,s=Math.sin(q.a)*5;CL.drawAtom(ctx,q.x-c,q.y-s,6,'O',{label:''});CL.drawAtom(ctx,q.x+c,q.y+s,6,'O',{label:''});});
  (v.esc||[]).forEach(e=>{e.y-=90*vdt;e.l-=vdt;ctx.globalAlpha=clamp(e.l,0,1);CL.drawAtom(ctx,e.x-5,e.y,6,'O',{label:''});CL.drawAtom(ctx,e.x+5,e.y,6,'O',{label:''});ctx.globalAlpha=1;});
  if(v.esc)v.esc=v.esc.filter(e=>e.l>0);}
function drawFish(ctx,x,y,o,t){const ok=o>=4,wig=RM?0:Math.sin(t*(ok?6:2))*4;ctx.save();ctx.translate(x,y);
  ctx.fillStyle=ok?'#e07b39':'#9a8f86';ctx.beginPath();ctx.ellipse(0,0,26,13,0,0,6.29);ctx.fill();
  ctx.beginPath();ctx.moveTo(22,0);ctx.lineTo(40,-12+wig);ctx.lineTo(40,12+wig);ctx.closePath();ctx.fill();
  ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(-14,-3,4,0,6.29);ctx.fill();ctx.fillStyle='#222';ctx.beginPath();ctx.arc(-15,-3,2,0,6.29);ctx.fill();
  if(!ok){ctx.strokeStyle='#222';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(-19,-7);ctx.lineTo(-11,1);ctx.moveTo(-11,-7);ctx.lineTo(-19,1);ctx.stroke();}
  ctx.restore();}
SC.onLevel=syncMode;
BioLab.register(SC);
})();
