(function(){
'use strict';
const {clamp,rr,txt,pill,atLeast,PAL,FONT,RM,axes,legend,serColor}=BioLab.h;
const CL=window.ChemLab;
/* Absorbing species. spec: absorption bands [center nm, molar absorptivity M⁻¹cm⁻¹, width σ nm] (literature λmax and ε, band shapes simplified).
   cmax: top of the concentration slider; u/uf: display unit and its factor from mol/L. */
const SOLS={
  KMnO4:{name:'Potassium permanganate',sp:'MnO₄⁻',spec:[[507,1040,11],[526,1335,12],[546,1395,12],[566,610,12],[530,495,35]],cmax:1.0e-3,u:'mM',uf:1e3,dot:'#7b2d8e'},
  Cu:{name:'Copper(II) nitrate',sp:'Cu²⁺',spec:[[805,12.0,110]],cmax:0.40,u:'M',uf:1,dot:'#2f74c0'},
  CoCl2:{name:'Cobalt(II) chloride',sp:'Co²⁺',spec:[[510,4.8,32],[470,2.0,18]],cmax:0.50,u:'M',uf:1,dot:'#d0557a'},
  NiCl2:{name:'Nickel(II) chloride',sp:'Ni²⁺',spec:[[395,5.2,22],[656,1.9,25],[721,2.1,35]],cmax:0.50,u:'M',uf:1,dot:'#3d9a4a'},
  blue1:{name:'FD&C Blue 1 (sports-drink dye)',sp:'Blue 1',spec:[[630,1.30e5,30],[410,1.5e4,30]],cmax:20e-6,u:'µM',uf:1e6,dot:'#1f56c9'},
  red40:{name:'FD&C Red 40 (Allura Red)',sp:'Red 40',spec:[[504,2.59e4,45]],cmax:100e-6,u:'µM',uf:1e6,dot:'#c62828'},
  cv:{name:'Crystal violet',sp:'CV⁺',spec:[[590,7.9e4,33],[545,3.6e4,26]],cmax:30e-6,u:'µM',uf:1e6,dot:'#6a2c91'}};
Object.keys(SOLS).forEach(k=>{const s=SOLS[k];s.cache={};let best=380,bv=0;for(let l=380;l<=850;l++){const e=eps(s,l);if(e>bv){bv=e;best=l;}}s.lmax=best;s.emax=bv;});
const LMIN=380,LMAX=850,CU_M=63.546,BRASS_V=0.100;
function eps(s,l){return s.spec.reduce((a,b)=>a+b[1]*Math.exp(-0.5*Math.pow((l-b[0])/b[2],2)),0);}
/* ---- color of a solution from its absorbance spectrum (CIE 1931 fit of Wyman, Sloan & Shirley 2013) ---- */
const gs=(x,m,s1,s2)=>{const t=(x-m)/(x<m?s1:s2);return Math.exp(-0.5*t*t);};
const xb=l=>1.056*gs(l,599.8,37.9,31.0)+0.362*gs(l,442.0,16.0,26.7)-0.065*gs(l,501.1,20.4,26.2);
const yb=l=>0.821*gs(l,568.8,46.9,40.5)+0.286*gs(l,530.9,16.3,31.1);
const zb=l=>1.217*gs(l,437.0,11.8,36.0)+0.681*gs(l,459.0,26.0,13.8);
const toLin=(X,Y,Z)=>[3.2406*X-1.5372*Y-0.4986*Z,-0.9689*X+1.8758*Y+0.0415*Z,0.0557*X-0.2040*Y+1.0570*Z];
const gam=v=>v<=0.0031308?12.92*v:1.055*Math.pow(v,1/2.4)-0.055;
function solColor(s,c,b){const key=(c*b).toPrecision(3);if(s.cache[key])return s.cache[key];let X=0,Y=0,Z=0,X0=0,Y0=0,Z0=0;
  for(let l=380;l<=780;l+=5){const T=Math.pow(10,-eps(s,l)*c*b),x=xb(l),y=yb(l),z=zb(l);X+=x*T;Y+=y*T;Z+=z*T;X0+=x;Y0+=y;Z0+=z;}
  const w=toLin(X0,Y0,Z0),v=toLin(X,Y,Z),rgb=v.map((q,i)=>clamp(gam(clamp(q/w[i],0,1)),0,1));
  const out={rgb,css:'rgb('+rgb.map(q=>Math.round(q*255)).join(',')+')',a:clamp(2.2*(1-Math.min(...rgb)),0,1)};s.cache[key]=out;return out;}
function wl2rgb(l){let r=0,g=0,b=0;if(l<440){r=-(l-440)/60;b=1;}else if(l<490){g=(l-440)/50;b=1;}else if(l<510){g=1;b=-(l-510)/20;}else if(l<580){r=(l-510)/70;g=1;}else if(l<645){r=1;g=-(l-645)/65;}else r=1;
  const f=clamp(l<420?0.35+0.65*(l-380)/40:l>700?0.35+0.65*(780-l)/80:1,0.3,1);return 'rgb('+[r,g,b].map(q=>Math.round(255*Math.pow(clamp(q,0,1)*f,0.8))).join(',')+')';}
function wlName(l){return l<450?'violet':l<490?'blue':l<520?'blue-green':l<565?'green':l<590?'yellow':l<625?'orange':l<750?'red':'near infrared (invisible)';}
function hueName(rgb){const [r,g,b]=rgb,mx=Math.max(r,g,b),mn=Math.min(r,g,b);if(mx-mn<0.06)return mx<0.15?'nearly black':'colorless';if(mx<0.12)return 'nearly black';
  let h;if(mx===r)h=((g-b)/(mx-mn))%6;else if(mx===g)h=(b-r)/(mx-mn)+2;else h=(r-g)/(mx-mn)+4;h*=60;if(h<0)h+=360;
  return h<15||h>=345?'red':h<45?'orange':h<70?'yellow':h<160?'green':h<200?'blue-green':h<255?'blue':h<300?'violet':'pink-purple';}

const SOL=sim=>SOLS[sim.p.mode==='brass'?'Cu':sim.p.solute];
const bcm=sim=>+sim.p.path;
const cStd=sim=>SOL(sim).cmax*sim.p.conc/100;
function cSample(sim){const p=sim.p,st=sim.st;if(p.mode==='unknown'&&p.cuv==='unk')return st.unk[p.solute];if(p.mode==='brass'&&p.cuv==='unk')return p.bm*st.brassPct/100/CU_M/BRASS_V;return cStd(sim);}
const trueA=(sim,c,l)=>eps(SOL(sim),l===undefined?sim.p.lam:l)*bcm(sim)*(c===undefined?cSample(sim):c);
function measT(sim,c,l){const s=(sim.p.stray||0)/100,T=Math.pow(10,-trueA(sim,c,l));return (T+s)/(1+s);}
const measA=(sim,c,l)=>-Math.log10(measT(sim,c,l));
const fmtC=(s,c)=>{const v=c*s.uf;return (v>=100?v.toFixed(1):v>=10?v.toFixed(2):v.toFixed(3))+' '+s.u;};
function stdKey(sim){return SOL(sim).sp+'|'+sim.p.lam+'|'+sim.p.path+'|'+(sim.p.stray||0);}
function fit(pts){const n=pts.length;if(n<2)return null;let sx=0,sy=0,sxx=0,sxy=0,syy=0;pts.forEach(q=>{sx+=q.c;sy+=q.A;sxx+=q.c*q.c;sxy+=q.c*q.A;syy+=q.A*q.A;});
  const d=n*sxx-sx*sx;if(Math.abs(d)<1e-30)return null;const m=(n*sxy-sx*sy)/d,b=(sy-m*sx)/n;const ssr=pts.reduce((a,q)=>a+Math.pow(q.A-(m*q.c+b),2),0),sst=syy-sy*sy/n;return {m,b,r2:sst>0?1-ssr/sst:1};}
const myStds=sim=>sim.st.stds.filter(q=>q.key===stdKey(sim));
function fitUnknown(sim){const f=fit(myStds(sim));if(!f||f.m<=0)return NaN;const p=sim.p;if(!((p.mode==='unknown'||p.mode==='brass')&&p.cuv==='unk'))return NaN;return (measA(sim)-f.b)/f.m;}
function concOut(sim){const el=document.getElementById('beerslaw-conc-out');if(el)el.textContent=fmtC(SOL(sim),cStd(sim));
  const m=sim.def.metrics.find(x=>x.id==='c');const s=SOL(sim);m.unit=s.u;const t=sim.ui&&sim.ui.tiles&&sim.ui.tiles.c;if(t){const u=t.num.parentNode.querySelector('.u');if(u)u.textContent=s.u;}
  const m3=sim.def.metrics.find(x=>x.id==='slope');m3.unit='per '+s.u;const t3=sim.ui&&sim.ui.tiles&&sim.ui.tiles.slope;if(t3){const u=t3.num.parentNode.querySelector('.u');if(u)u.textContent=m3.unit;}
  const m2=sim.def.metrics.find(x=>x.id==='fitC');m2.unit=s.u;const t2=sim.ui&&sim.ui.tiles&&sim.ui.tiles.fitC;if(t2){const u=t2.num.parentNode.querySelector('.u');if(u)u.textContent=s.u;}}
function syncMode(sim){concOut(sim);if(!sim.ui||!sim.ui.sec)return;const mode=sim.p.mode,d=sim.def;
  d.controls.forEach(c=>{if(!c.modes)return;const cid=d.id+'-'+c.id,e=document.getElementById(cid)||document.getElementById(cid+'-l');if(!e)return;const w=e.closest('.ctl');if(w)w.hidden=!atLeast(c.lvl)||!c.modes.includes(mode);});
  d.metrics.forEach(m=>{if(!m.modes)return;const t=sim.ui.tiles[m.id];if(!t)return;const w=t.num.closest('.tile');if(w)w.hidden=!atLeast(m.lvl)||!m.modes.includes(mode);});
  const btns=[...sim.ui.sec.querySelectorAll('.actions button')];
  d.actions.forEach(a=>{const b=btns.find(x=>x.textContent===a.label);if(b)b.hidden=!atLeast(a.lvl)||!a.modes.includes(mode);});}
function newUnknowns(st){st.unk={};Object.keys(SOLS).forEach(k=>{st.unk[k]=SOLS[k].cmax*(0.18+0.6*Math.random());});}

const BL={
  id:'beerslaw',hash:'beerslaw',apUnit:10,order:5,kind:'Virtual lab',tab:'Beer’s law and spectrophotometry',
  prereq:['molarity','light'],next:['ratelaw','spectroscopy','spectra'],
  card:'Shine one color of light through a colored solution, measure how much gets through, and use a calibration curve to find an unknown, or the copper in brass.',
  title:'Beer’s law: measuring concentration with light',
  lede:{bio:'A colored solution absorbs some colors of light. The more crowded the colored particles, the less light makes it through. A spectrophotometer turns that into a number: absorbance.',
        honors:'Absorbance grows in step with concentration and with the width of the cuvette. Measure standards, draw a calibration line, and read an unknown off it.',
        ap:'A = εbc. Pick λmax for sensitivity, watch the calibration bend at high absorbance (stray light), and find the percent copper in a brass sample, the AP lab.'},
  scale:{bio:'A spectrophotometer on the bench. The cuvette is 1 cm wide; the dots inside stand for the light-absorbing ions or dye molecules, far fewer than are really there.',
         ap:'Bench instrument with a 1 nm wavelength selector. Dots in the cuvette are proportional to concentration × path length, so each photon’s chance of hitting one follows Beer’s law.'},
  aspect:1.6,timeless:true,animated:true,chChange:1.2,chReveal:3.6,
  controls:[
    {id:'mode',label:'Experiment',type:'seg',def:'meter',lvl:'bio',options:[{v:'meter',l:'Explore'},{v:'unknown',l:'Find an unknown',lvl:'honors'},{v:'brass',l:'Copper in brass',lvl:'ap'}],
     onChange(sim){if(sim.p.mode==='brass'&&sim.p.lam!==805&&sim.st&&!sim.st.brassInit){sim.st.brassInit=true;BioLab.setValues(sim,{lam:805});}syncMode(sim);}},
    {id:'solute',label:'Solution',type:'select',def:'KMnO4',lvl:'bio',modes:['meter','unknown'],options:Object.keys(SOLS).map(k=>({v:k,l:SOLS[k].name+' ('+SOLS[k].sp+')'})),onChange(sim){concOut(sim);}},
    {id:'conc',label:'Concentration',type:'range',min:0,max:100,step:1,def:25,unit:'%',lvl:'bio',noTrial:true,onChange(sim){concOut(sim);},help:'In Find an unknown and Copper in brass, this sets the standard you are measuring.'},
    {id:'lam',label:'Wavelength',type:'range',min:LMIN,max:LMAX,step:1,def:526,unit:' nm',lvl:'bio'},
    {id:'path',label:'Cuvette width (path length b)',type:'seg',def:'1.00',lvl:'honors',options:[{v:'0.50',l:'0.50 cm'},{v:'1.00',l:'1.00 cm'},{v:'2.00',l:'2.00 cm'}]},
    {id:'cuv',label:'In the cuvette',type:'seg',def:'std',lvl:'honors',modes:['unknown','brass'],options:[{v:'std',l:'Standard'},{v:'unk',l:'Unknown sample'}]},
    {id:'bm',label:'Mass of brass dissolved',type:'range',min:0.3,max:1.0,step:0.001,def:0.5,unit:' g',d:3,lvl:'ap',modes:['brass'],help:'Dissolved in nitric acid, then diluted to 100.00 mL in a volumetric flask.'},
    {id:'stray',label:'Stray light in the instrument',type:'range',min:0,max:2,step:0.1,def:0.3,unit:'%',lvl:'ap',help:'Light that reaches the detector without passing through the sample. It makes high absorbances read low.'}
  ],
  actions:[
    {id:'lmax',label:'Go to λmax',lvl:'bio',modes:['meter','unknown','brass'],run(sim){BioLab.setValues(sim,{lam:SOL(sim).lmax});}},
    {id:'save',label:'Save as a standard',lvl:'honors',primary:true,modes:['unknown','brass'],run(sim){const p=sim.p;if(p.cuv!=='std'){sim.vis.msg='Switch the cuvette to Standard first';sim.vis.msgT=2;return;}
      const c=cStd(sim),A=measA(sim);sim.st.stds=sim.st.stds.filter(q=>!(q.key===stdKey(sim)&&Math.abs(q.c-c)<1e-12));sim.st.stds.push({key:stdKey(sim),c,A});sim.vis.msg='Saved: '+fmtC(SOL(sim),c)+', A = '+A.toFixed(3);sim.vis.msgT=2;}},
    {id:'clr',label:'Clear standards',lvl:'honors',modes:['unknown','brass'],run(sim){sim.st.stds=[];}},
    {id:'newu',label:'New unknown',lvl:'honors',modes:['unknown'],run(sim){newUnknowns(sim.st);}},
    {id:'newb',label:'New brass sample',lvl:'ap',modes:['brass'],run(sim){sim.st.brassPct=60+Math.round(Math.random()*28*10)/10;}}
  ],
  init(sim){const st={stds:[],brassPct:70.0,brassInit:false};newUnknowns(st);return st;},
  step(){},
  metrics:[
    {id:'A',label:'Absorbance A',unit:'',lvl:'bio',min:0,max:3,d:3,get:s=>measA(s)},
    {id:'T',label:'Transmittance',unit:'%',lvl:'bio',min:0,max:100,d:1,get:s=>100*measT(s)},
    {id:'look',label:'The solution looks',unit:'',lvl:'bio',text:true,get:s=>{const c=cSample(s);return c>0?hueName(solColor(SOL(s),c,1).rgb):'colorless';}},
    {id:'c',label:'Concentration in the cuvette',unit:'mM',lvl:'bio',min:0,max:null,d:3,get:s=>{const p=s.p;if(p.cuv==='unk'&&p.mode!=='meter')return NaN;return cStd(s)*SOL(s).uf;}},
    {id:'fitC',label:'Unknown, from your calibration line',unit:'mM',lvl:'honors',min:0,max:null,d:3,modes:['unknown','brass'],get:s=>{const c=fitUnknown(s);return Number.isFinite(c)?c*SOL(s).uf:NaN;}},
    {id:'slope',label:'Calibration slope (εb)',unit:'per mM',lvl:'honors',min:0,max:null,d:3,modes:['unknown','brass'],get:s=>{const f=fit(myStds(s));return f?f.m/SOL(s).uf:NaN;}},
    {id:'r2',label:'R² of your line',unit:'',lvl:'honors',min:0,max:1,d:4,modes:['unknown','brass'],get:s=>{const f=fit(myStds(s));return f?f.r2:NaN;}},
    {id:'eps',label:'Molar absorptivity ε at this λ',unit:'M⁻¹cm⁻¹',lvl:'ap',min:0,max:null,d:1,modes:['meter'],get:s=>eps(SOL(s),s.p.lam)},
    {id:'pcu',label:'Percent copper in the brass',unit:'%',lvl:'ap',min:0,max:100,d:1,modes:['brass'],get:s=>{const c=fitUnknown(s);return Number.isFinite(c)?100*c*BRASS_V*CU_M/s.p.bm:NaN;}}
  ],
  graphs:[{id:'cal',label:'Absorbance vs concentration',lvl:'bio',custom:true},{id:'spec',label:'Absorbance spectrum',lvl:'bio',custom:true},{id:'tc',label:'%T vs concentration',lvl:'honors',custom:true}],
  defaultGraph:'cal',
  plot(sim,ctx,box,id){const p=sim.p,s=SOL(sim),cmax=s.cmax;
    if(id==='spec'){const c=cSample(sim);let ymax=0.2;for(let l=LMIN;l<=LMAX;l+=2)ymax=Math.max(ymax,measA(sim,c,l));ymax*=1.1;
      const ax=axes(ctx,box,{xmin:LMIN,xmax:LMAX,ymin:0,ymax,xl:'Wavelength (nm)',yl:'Absorbance'});
      for(let l=LMIN;l<LMAX;l+=2){ctx.fillStyle=wl2rgb(l);ctx.fillRect(ax.X(l),box.T+box.H-6,ax.X(l+2)-ax.X(l)+0.5,6);}
      ctx.strokeStyle=PAL['s1'];ctx.lineWidth=2.5;ctx.beginPath();for(let l=LMIN;l<=LMAX;l+=2){const y=measA(sim,c,l);l===LMIN?ctx.moveTo(ax.X(l),ax.Y(y)):ctx.lineTo(ax.X(l),ax.Y(y));}ctx.stroke();
      ctx.strokeStyle=PAL['fg'];ctx.setLineDash([4,4]);ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(ax.X(p.lam),box.T);ctx.lineTo(ax.X(p.lam),box.T+box.H);ctx.stroke();ctx.setLineDash([]);
      txt(ctx,p.lam+' nm',ax.X(p.lam)+5,box.T+12,{s:12,c:PAL['fg']});txt(ctx,'λmax = '+s.lmax+' nm',box.L+box.W-6,box.T+12,{s:12,c:PAL['muted'],a:'right'});return;}
    if(id==='tc'){const ax=axes(ctx,box,{xmin:0,xmax:cmax*s.uf,ymin:0,ymax:100,xl:'Concentration ('+s.u+')',yl:'Transmittance (%)'});
      ctx.strokeStyle=serColor(2);ctx.lineWidth=2.5;ctx.beginPath();for(let i=0;i<=120;i++){const c=cmax*i/120;const y=100*measT(sim,c);i?ctx.lineTo(ax.X(c*s.uf),ax.Y(y)):ctx.moveTo(ax.X(c*s.uf),ax.Y(y));}ctx.stroke();
      const c=cStd(sim);ctx.fillStyle=PAL['s1'];ctx.beginPath();ctx.arc(ax.X(c*s.uf),ax.Y(100*measT(sim,c)),6,0,6.29);ctx.fill();
      legend(ctx,box.L+12,box.T+10,[{label:'%T falls by the same fraction for each step in c',color:serColor(2)}]);return;}
    let ymax=Math.max(0.5,measA(sim,cmax)*1.08,trueA(sim,cmax)*0.6);const stds=myStds(sim);stds.forEach(q=>ymax=Math.max(ymax,q.A*1.1));
    const ax=axes(ctx,box,{xmin:0,xmax:cmax*s.uf,ymin:0,ymax,xl:'Concentration ('+s.u+') at '+p.lam+' nm, b = '+p.path+' cm',yl:'Absorbance'});
    ctx.save();ctx.beginPath();ctx.rect(box.L,box.T,box.W,box.H);ctx.clip();
    ctx.setLineDash([5,4]);ctx.strokeStyle=PAL['muted'];ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(ax.X(0),ax.Y(0));ctx.lineTo(ax.X(cmax*s.uf),ax.Y(trueA(sim,cmax)));ctx.stroke();ctx.setLineDash([]);
    if(p.mode==='meter'){ctx.strokeStyle=serColor(1);ctx.lineWidth=2.5;ctx.beginPath();for(let i=0;i<=100;i++){const c=cmax*i/100;i?ctx.lineTo(ax.X(c*s.uf),ax.Y(measA(sim,c))):ctx.moveTo(ax.X(0),ax.Y(0));}ctx.stroke();
      const c=cStd(sim);ctx.fillStyle=PAL['s1'];ctx.beginPath();ctx.arc(ax.X(c*s.uf),ax.Y(measA(sim,c)),6,0,6.29);ctx.fill();ctx.restore();
      legend(ctx,box.L+12,box.T+10,[{label:'what the meter reads',color:serColor(1)},{label:'A = εbc',color:PAL['muted'],dash:true}]);return;}
    const f=fit(stds);if(f){ctx.strokeStyle=serColor(1);ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(ax.X(0),ax.Y(f.b));ctx.lineTo(ax.X(cmax*s.uf),ax.Y(f.m*cmax+f.b));ctx.stroke();}
    stds.forEach(q=>{ctx.fillStyle=PAL['g-dot'];ctx.beginPath();ctx.arc(ax.X(q.c*s.uf),ax.Y(q.A),5.5,0,6.29);ctx.fill();ctx.strokeStyle=PAL['card'];ctx.lineWidth=1.5;ctx.stroke();});
    if(p.cuv==='unk'){const A=measA(sim);ctx.strokeStyle=PAL['s1'];ctx.lineWidth=1.5;ctx.setLineDash([3,3]);ctx.beginPath();ctx.moveTo(box.L,ax.Y(A));const cu=fitUnknown(sim);
      if(Number.isFinite(cu)){ctx.lineTo(ax.X(cu*s.uf),ax.Y(A));ctx.lineTo(ax.X(cu*s.uf),box.T+box.H);}else ctx.lineTo(box.L+box.W,ax.Y(A));ctx.stroke();ctx.setLineDash([]);}
    ctx.restore();
    const hidden=sim.st.stds.length-stds.length;
    legend(ctx,box.L+12,box.T+10,[{label:f?'best fit: A = '+(f.m/s.uf).toPrecision(3)+'c + '+f.b.toFixed(3):'save 2+ standards',color:serColor(1)},{label:'unknown',color:PAL['s1'],dash:true},{label:'ideal A = εbc',color:PAL['muted'],dash:true}]);
    if(hidden>0)txt(ctx,hidden+' standard'+(hidden>1?'s':'')+' at other settings hidden',box.L+box.W-6,box.T+box.H-10,{s:12,c:PAL['muted'],a:'right'});},
  narrate(sim){const p=sim.p,s=SOL(sim),c=cSample(sim),A=measA(sim),T=measT(sim),hon=atLeast('honors'),ap=atLeast('ap'),l=p.lam;
    const unk=p.cuv==='unk'&&p.mode!=='meter';
    if(c<=0)return 'The cuvette holds only water, so nothing absorbs: <b>A = 0, T = 100%</b>. Raise the concentration.';
    let r='';const e=eps(s,l),rel=e/s.emax;
    if(rel<0.05)r='At '+l+' nm ('+wlName(l)+') '+s.sp+' barely absorbs, so almost all the light gets through (A = '+A.toFixed(3)+'). <b>Choose a wavelength the solution absorbs</b>, near λmax = '+s.lmax+' nm.';
    else r=(unk?'The unknown':'This solution')+' absorbs <b>'+(100-100*T).toFixed(1)+'% of the '+wlName(l)+' light</b>, so A = −log(T) = '+A.toFixed(3)+'. '+(hon?'':'More particles in the beam means fewer photons reach the detector.');
    if(!unk&&rel>=0.05){const look=hueName(solColor(s,c,1).rgb);if(!hon)r+=' It looks '+look+' because it absorbs '+wlName(s.lmax)+' light and lets the rest through.';}
    if(hon&&!unk&&rel>=0.05)r+=' A = εbc = '+CL.sci(e,'',3)+' M⁻¹cm⁻¹ × '+p.path+' cm × '+CL.sci(c,'M',3)+' = '+trueA(sim).toFixed(3)+(ap&&Math.abs(trueA(sim)-A)>0.01?'; the meter reads '+A.toFixed(3)+' because of stray light.':'.');
    if(p.mode!=='meter'){const n=myStds(sim).length,cu=fitUnknown(sim);
      if(unk&&Number.isFinite(cu))r+=' Your line gives '+fmtC(s,cu)+(p.mode==='brass'?' of Cu²⁺, which means '+(100*cu*BRASS_V*CU_M/p.bm).toFixed(1)+'% copper.':'.');
      else if(n<2)r+=' Save at least two standards at this wavelength to draw a calibration line.';}
    if(ap&&A>1.8)r+=' Above A ≈ 1.5 so little light reaches the detector that stray light dominates, and the calibration curve bends.';
    return r.replace(/\s{2,}/g,' ');},
  tour:[
    {title:'White light in',text:'The lamp makes white light: every color at once. The grating spreads it into a rainbow, and a slit lets through just one wavelength.',focus:[10,60,250,200],speed:1,setup(sim){BioLab.setValues(sim,{mode:'meter',solute:'KMnO4',conc:25,lam:526,path:'1.00'});}},
    {title:'Photons meet the solution',text:'That one color crosses the cuvette. Each dot is a permanganate ion. A photon that hits one is absorbed; the rest make it through.',focus:[300,60,250,220],speed:0.4},
    {title:'The detector measures what gets through',text:'Transmittance T is the fraction of light that arrives. Absorbance A = −log T. Here T = 25%, so A = 0.60.',focus:[540,60,250,220],speed:0.6},
    {title:'More particles, more absorbed',text:'Double the concentration. Twice the dots stand in the light’s path, and the absorbance doubles to 1.2. T does not halve; it drops to about 6%.',focus:[300,40,490,250],speed:0.6,setup(sim){BioLab.setValues(sim,{conc:50});}},
    {title:'Choose the right color of light',text:'The spectrum below shows how much each wavelength is absorbed. Permanganate absorbs green best, at 526 nm (λmax). Red light at 650 nm passes almost untouched.',focus:[20,300,760,190],speed:0.6,setup(sim){BioLab.setValues(sim,{lam:650});}},
    {title:'What color you see',text:'A solution looks like the light it does not absorb. Permanganate absorbs green and lets red and blue through, so it looks purple.',focus:[300,60,250,220],speed:0.6,setup(sim){BioLab.setValues(sim,{lam:526});}},
    {lvl:'honors',title:'A wider cuvette',text:'Light that travels through 2.00 cm of solution meets twice as many particles as 1.00 cm, so A doubles. Path length b is the second variable in A = εbc.',focus:[300,40,490,250],speed:0.6,setup(sim){BioLab.setValues(sim,{conc:25,path:'2.00'});}},
    {lvl:'honors',title:'Calibration curve',text:'Measure several standards of known concentration and graph A against c. The straight line lets you read any unknown’s concentration from its absorbance.',focus:[300,40,490,250],speed:0.6,setup(sim){BioLab.setValues(sim,{mode:'unknown',path:'1.00',cuv:'std'});[10,30,50,70].forEach(v=>{BioLab.setValues(sim,{conc:v});BL.actions[1].run(sim);});BioLab.setValues(sim,{cuv:'unk'});}}
  ],
  onTourExit(sim){const base={};BL.controls.forEach(c=>base[c.id]=c.def);BioLab.setValues(sim,base);sim.st.stds=[];},
  onChallenge(sim,ch,phase){if(ch&&ch.instant&&ch.set&&phase==='done'){BioLab.setValues(sim,ch.set);if(ch.pct)sim.st.brassPct=ch.pct;}},
  challenges:[
    {lvl:'bio',q:'0.25 mM permanganate absorbs green light with A = 0.60. You double the concentration to 0.50 mM. The absorbance…',choices:['about doubles','about halves','stays the same'],correct:0,
     baseline:{mode:'meter',solute:'KMnO4',conc:25,lam:526,path:'1.00',stray:0},change:{conc:50},changeText:'Concentration doubled to 0.50 mM',watch:'cal',
     explain:{bio:'A goes from 0.60 to 1.20. Twice as many ions sit in the light’s path, so absorbance is proportional to concentration. That is Beer’s law, and it is why absorbance can measure concentration.'}},
    {lvl:'bio',q:'Purple permanganate is being measured with green light (526 nm). You switch to red light (650 nm). What happens to the absorbance?',choices:['It goes up','It drops to nearly zero','It stays the same'],correct:1,
     baseline:{mode:'meter',solute:'KMnO4',conc:25,lam:526},change:{lam:650},changeText:'Wavelength set to 650 nm (red)',watch:'spec',
     explain:{bio:'Permanganate looks purple because it lets red and blue light through and absorbs green. Red light passes almost untouched, so A ≈ 0. Always measure at a wavelength the solution absorbs strongly.'}},
    {lvl:'honors',q:'A solution has T = 25% (A = 0.60). You double its concentration. What is the new transmittance?',choices:['12.5% (half as much)','About 6%','0%'],correct:1,
     baseline:{mode:'meter',solute:'KMnO4',conc:25,lam:526,path:'1.00',stray:0},change:{conc:50},changeText:'Concentration doubled',watch:'tc',
     explain:{honors:'Absorbance doubles to 1.20, and T = 10⁻¹·²⁰ = 6.3%. Each layer of solution removes the same fraction of the light reaching it, so T falls exponentially. That is why we graph A, not T, against concentration.'}},
    {lvl:'honors',q:'You move the same solution from a 1.00 cm cuvette to a 2.00 cm cuvette. The absorbance…',choices:['doubles','halves','stays the same: same concentration'],correct:0,
     baseline:{mode:'meter',solute:'CoCl2',conc:40,lam:510,path:'1.00',stray:0},change:{path:'2.00'},changeText:'Switched to the 2.00 cm cuvette',watch:'cal',
     explain:{honors:'The light now crosses twice as much solution and meets twice as many Co²⁺ ions: 0.96 becomes 1.92. Beer’s law: A = εbc, with b the path length.'}},
    {lvl:'ap',q:'Your instrument has 0.3% stray light. You raise a permanganate standard from 0.25 mM (A ≈ 0.60) to 1.00 mM (4×). The measured absorbance rises…',choices:['exactly 4×','less than 4×','more than 4×'],correct:1,
     baseline:{mode:'meter',solute:'KMnO4',conc:25,lam:526,path:'1.00',stray:0.3},change:{conc:100},changeText:'Concentration raised to 1.00 mM',watch:'cal',
     explain:{ap:'εbc predicts 2.40, but only 0.4% of the light passes the sample and 0.3% leaks around it, so the meter reads about 2.16 (3.6×). Keep standards and unknowns below A ≈ 1.5, or dilute.'}},
    {lvl:'ap',q:'You measure a permanganate standard at 560 nm instead of at λmax (526 nm). Compared with λmax, the calibration slope will be…',choices:['the same, as long as you are consistent','smaller, so the method is less sensitive','larger'],correct:1,
     baseline:{mode:'meter',solute:'KMnO4',conc:25,lam:526,path:'1.00',stray:0},change:{lam:560},changeText:'Wavelength moved to 560 nm',watch:'cal',
     explain:{ap:'ε at 560 nm is smaller than at 526 nm, so every standard absorbs less and the slope εb drops. Away from λmax, a small wavelength error also changes ε a lot. At λmax the curve is flat-topped, so readings are both sensitive and stable.'}},
    {lvl:'ap',instant:true,set:{mode:'brass',bm:0.5,lam:805,path:'1.00',cuv:'unk',stray:0},pct:70,q:'0.500 g of brass is dissolved and diluted to 100.00 mL. Your calibration says [Cu²⁺] = 0.0551 M. What percent of the brass is copper?',choices:['55.1%','70.0%','35.0%'],correct:1,
     explain:{ap:'mol Cu = 0.0551 mol/L × 0.10000 L = 5.51 × 10⁻³ mol; mass = 5.51 × 10⁻³ × 63.55 g/mol = 0.350 g; 0.350 ÷ 0.500 = 70.0%. The model is now set to this sample; save standards at 805 nm to check it.'}}
  ],
  lab:{bio:'<p><b>Question:</b> How does concentration affect how much light a solution absorbs?</p><ol><li>Choose a solution and press Go to λmax.</li><li>Record trials at concentration settings 0, 20, 40, 60 and 80% of the slider.</li><li>Plot concentration (x) against absorbance (y), then against transmittance.</li></ol><p>Which graph is a straight line? Use it to predict the absorbance at 100%, then test it.</p>',
       honors:'<p><b>Question:</b> What is the concentration of the unknown?</p><ol><li>Choose Find an unknown and a solution. Set λmax and keep the 1.00 cm cuvette.</li><li>Measure and save at least five standards.</li><li>Switch the cuvette to Unknown sample and read its absorbance.</li><li>Use your line (slope and intercept) to calculate the unknown, then compare with the tile.</li></ol><p>What would happen to your answer if you measured the unknown in a 2.00 cm cuvette but the standards in 1.00 cm?</p>',
       ap:'<p><b>Question:</b> What percent of a brass sample is copper? (Safety: concentrated nitric acid in a fume hood, with goggles and gloves; it releases toxic NO₂.)</p><ol><li>Choose Copper in brass. Pick a wavelength from the Cu²⁺ spectrum and justify it.</li><li>Save Cu²⁺ standards from 0.04 to 0.20 M. Check R².</li><li>Measure the brass sample, find [Cu²⁺], then mol Cu, mass Cu and % Cu.</li><li>Repeat with a second sample mass.</li></ol><p><b>Claim–evidence–reasoning:</b> Report % Cu with an uncertainty, and explain how stray light would bias a sample with A > 2.</p>'},
  terms:[{t:'Absorbance (A)',d:'How much light a sample absorbs: A = −log T. No units.'},{t:'Transmittance (T)',d:'The fraction (or %) of light that passes through: T = I / I₀.'},{t:'Wavelength (λ)',d:'Sets the color of the light, in nanometers (nm). Visible light runs from about 400 to 700 nm.'},
    {t:'Spectrophotometer',d:'An instrument that shines one wavelength through a sample and measures how much gets through.'},{t:'Cuvette',d:'The small clear container that holds the sample in the light beam.'},
    {lvl:'honors',t:'Beer’s law',d:'A = εbc: absorbance is proportional to path length b (cm) and concentration c (M).'},{lvl:'honors',t:'Calibration curve',d:'A graph of absorbance against concentration for standards; used to find unknowns.'},
    {lvl:'honors',t:'λmax',d:'The wavelength the substance absorbs most strongly; gives the most sensitive measurement.'},{lvl:'honors',t:'Complementary color',d:'The color you see is made of the wavelengths the sample does not absorb.'},
    {lvl:'ap',t:'Molar absorptivity (ε)',d:'How strongly a substance absorbs at a given wavelength, in M⁻¹cm⁻¹.'},{lvl:'ap',t:'Stray light',d:'Light reaching the detector without passing through the sample; it makes high absorbances read too low.'}],
  about:'<p><b>Model.</b> A = εbc, where ε(λ) comes from each species’ absorption bands: MnO₄⁻ (λmax 526 nm, ε ≈ 2400 M⁻¹cm⁻¹, with its 507/546/566 nm shoulders), Cu²⁺(aq) (≈ 805 nm, ε ≈ 12), Co²⁺(aq) (510 nm, ε ≈ 4.8), Ni²⁺(aq) (395 and 721 nm), FD&C Blue 1 (630 nm, ε ≈ 1.3 × 10⁵), FD&C Red 40 (504 nm, ε ≈ 2.6 × 10⁴) and crystal violet (590 nm, ε ≈ 8.7 × 10⁴). Band shapes are Gaussian approximations of published spectra. The meter reads T = (10⁻ᴬ + s)/(1 + s) with stray light s, which is the main reason real calibration curves bend at high absorbance. The instrument is treated as perfectly blanked against water.</p><p><b>Picture.</b> Solution colors are computed from these spectra with the CIE 1931 color-matching functions. Photons are animated one by one: each is absorbed at a random depth drawn from Beer’s law, so the fraction that reaches the detector is T. The dots in the cuvette are scaled by c × b and are far fewer than the real ions.</p><p><b>Brass.</b> Each brass sample has a hidden copper content (60–88%; cartridge brass is 70%). Its Cu²⁺ is assumed to be in 100.00 mL; zinc ions are colorless and do not absorb.</p>',
  initVis(sim){sim.vis.ph=[];sim.vis.spawn=0;sim.vis.msgT=0;sim.vis.dots=[];for(let i=0;i<160;i++)sim.vis.dots.push({u:Math.random(),w:Math.random(),p:Math.random()*6.28});sim.vis.flash=[];},
  draw(sim,ctx,vdt,k,t){drawBench(sim,ctx,vdt,k,t);drawSpectrumStrip(sim,ctx,k);
    const v=sim.vis;v.msgT=Math.max(0,v.msgT-vdt);if(v.msgT>0)pill(ctx,v.msg,400,24,PAL['s5'],'#fff',13*k);
    const s=SOL(sim);if(sim.vis.unitSeen!==s.u){sim.vis.unitSeen=s.u;concOut(sim);}},
  thumbSetup(sim){sim.p.conc=35;}
};
const BY=180;          // beam height
function cuvRect(sim){const w=90*bcm(sim),x=430-w/2;return {x,y:BY-80,w,h:150};}
function drawBench(sim,ctx,vdt,k,t){const p=sim.p,s=SOL(sim),c=cSample(sim),v=sim.vis,A=measA(sim),Tm=measT(sim),Tt=Math.pow(10,-trueA(sim)),stray=(p.stray||0)/100;
  ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,500);
  // instrument housing
  rr(ctx,14,46,772,232,14);ctx.fillStyle=PAL['cv-bg2'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1.5;ctx.stroke();
  // lamp
  const lx=60;const gr=ctx.createRadialGradient(lx,BY,4,lx,BY,44);gr.addColorStop(0,'rgba(255,250,220,1)');gr.addColorStop(1,'rgba(255,250,220,0)');ctx.fillStyle=gr;ctx.beginPath();ctx.arc(lx,BY,44,0,6.29);ctx.fill();
  ctx.fillStyle='#fff6d8';ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(lx,BY,16,0,6.29);ctx.fill();ctx.stroke();
  txt(ctx,'white light',lx,BY-58,{s:12*k,w:600,c:PAL['cv-soft'],a:'center'});
  // white beam to grating
  ctx.strokeStyle='rgba(255,255,255,.85)';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(lx+16,BY);ctx.lineTo(150,BY);ctx.stroke();ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(lx+16,BY-4);ctx.lineTo(150,BY-4);ctx.moveTo(lx+16,BY+4);ctx.lineTo(150,BY+4);ctx.stroke();
  // grating and rainbow fan, slit selects λ
  ctx.fillStyle=PAL['cv-lamp'];ctx.fillRect(150,BY-34,8,68);
  for(let l=LMIN;l<=780;l+=8){const a=(l-580)/400*0.9;ctx.strokeStyle=wl2rgb(l);ctx.globalAlpha=0.55;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(158,BY);ctx.lineTo(158+70,BY+Math.tan(a)*70);ctx.stroke();}ctx.globalAlpha=1;
  const aSel=(clamp(p.lam,LMIN,780)-580)/400*0.9;ctx.fillStyle=PAL['cv-lamp'];ctx.fillRect(228,BY-50,8,100);ctx.clearRect(0,0,0,0);
  const slitY=BY+Math.tan(aSel)*70;ctx.fillStyle=PAL['cv-bg2'];ctx.fillRect(228,slitY-4,8,8);
  txt(ctx,'grating + slit',193,BY+64,{s:12*k,w:600,c:PAL['cv-soft'],a:'center',b:'top'});
  const col=wl2rgb(p.lam);
  // beam to cuvette, through it, to the detector
  const cr=cuvRect(sim),dx=650;
  ctx.globalAlpha=0.35;ctx.strokeStyle=col;ctx.lineWidth=12;ctx.beginPath();ctx.moveTo(236,slitY);ctx.lineTo(cr.x,BY);ctx.stroke();ctx.globalAlpha=0.35*clamp(Tm*1.3+0.05,0.05,1);ctx.beginPath();ctx.moveTo(cr.x+cr.w,BY);ctx.lineTo(dx,BY);ctx.stroke();ctx.globalAlpha=1;
  // cuvette with solution
  ctx.fillStyle=PAL['cv-water'];ctx.fillRect(cr.x,cr.y+14,cr.w,cr.h-14);if(c>0){const sc=solColor(s,c,bcm(sim));ctx.globalAlpha=sc.a;ctx.fillStyle=sc.css;ctx.fillRect(cr.x,cr.y+14,cr.w,cr.h-14);ctx.globalAlpha=1;}
  // absorbing particles: count ∝ c × b
  const nd=c>0?Math.max(1,Math.round(clamp(c/s.cmax*bcm(sim),0,4)*36)):0;const ndots=Math.min(nd,160);
  for(let i=0;i<ndots;i++){const d=v.dots[i];if(!RM)d.p+=vdt*(0.7+d.u);const x=cr.x+6+d.u*(cr.w-12)+Math.sin(d.p)*3,y=cr.y+20+d.w*(cr.h-28)+Math.cos(d.p*1.3)*3;ctx.fillStyle=s.dot;ctx.beginPath();ctx.arc(x,y,3.4,0,6.29);ctx.fill();ctx.strokeStyle='rgba(255,255,255,.7)';ctx.lineWidth=0.8;ctx.stroke();}
  ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=3;ctx.strokeRect(cr.x,cr.y,cr.w,cr.h);
  txt(ctx,'cuvette, b = '+p.path+' cm',430,cr.y-14,{s:12*k,w:600,c:PAL['cv-soft'],a:'center'});
  // photons
  if(!RM&&vdt>0){v.spawn+=vdt*36;while(v.spawn>=1){v.spawn--;const u=Math.random();let xa=Infinity;const bypass=Math.random()<stray/(1+stray);
    if(!bypass&&u<1-Tt){const At=trueA(sim);xa=cr.x+cr.w*(-Math.log10(1-u)/At);}v.ph.push({x:236,y0:slitY,yb:BY+(Math.random()-0.5)*10,xa});}}
  const sp=260;v.ph.forEach(q=>{q.x+=sp*vdt;});
  v.ph=v.ph.filter(q=>{if(q.x>=q.xa){v.flash.push({x:q.xa,y:q.yb,l:0.35});return false;}return q.x<dx+4;});
  v.ph.forEach(q=>{const y=q.x<cr.x?q.y0+(q.yb-q.y0)*clamp((q.x-236)/(cr.x-236),0,1):q.yb;ctx.fillStyle=col;ctx.beginPath();ctx.arc(q.x,y,3.6,0,6.29);ctx.fill();ctx.strokeStyle='rgba(0,0,0,.35)';ctx.lineWidth=0.8;ctx.stroke();});
  v.flash.forEach(f=>{f.l-=vdt;ctx.strokeStyle=PAL['s4'];ctx.globalAlpha=clamp(f.l/0.35,0,1);ctx.lineWidth=2;ctx.beginPath();ctx.arc(f.x,f.y,7,0,6.29);ctx.stroke();ctx.globalAlpha=1;});v.flash=v.flash.filter(f=>f.l>0);
  // detector and readout
  rr(ctx,dx,BY-34,22,68,4);ctx.fillStyle=PAL['cv-lamp'];ctx.fill();txt(ctx,'detector',dx+11,BY-58,{s:12*k,w:600,c:PAL['cv-soft'],a:'center'});
  rr(ctx,684,BY-50,92,100,8);ctx.fillStyle='#0f1a12';ctx.fill();
  txt(ctx,'A',696,BY-26,{s:13,w:700,c:'#7CFC9A',b:'middle'});txt(ctx,A.toFixed(3),768,BY-26,{s:18,w:700,c:'#7CFC9A',a:'right',b:'middle'});
  txt(ctx,'%T',696,BY+12,{s:13,w:700,c:'#7CFC9A',b:'middle'});txt(ctx,(100*Tm).toFixed(1),768,BY+12,{s:18,w:700,c:'#7CFC9A',a:'right',b:'middle'});
  txt(ctx,p.lam+' nm',730,BY+38,{s:12,c:'#7CFC9A',a:'center',b:'middle'});
  // sample label under the instrument
  const unk=p.cuv==='unk'&&p.mode!=='meter';const lab=unk?(p.mode==='brass'?'Brass sample: '+p.bm.toFixed(3)+' g in 100.00 mL':'Unknown '+s.sp+' sample'):s.sp+' standard: '+fmtC(s,c);
  pill(ctx,lab,430,296,unk?PAL['s1']:PAL['card2'],unk?'#fff':PAL['cv-ink'],13*k);
  if(p.mode==='brass'){const a1='Safety: dissolve brass in concentrated HNO₃ in a fume hood,',a2='with goggles and gloves. It gives off toxic NO₂ gas.';if(k<1.25)txt(ctx,a1+' '+a2,400,484,{s:12*k,c:PAL['cv-soft'],a:'center',b:'middle'});else{txt(ctx,a1,400,470,{s:12*k,c:PAL['cv-soft'],a:'center',b:'middle'});txt(ctx,a2,400,490,{s:12*k,c:PAL['cv-soft'],a:'center',b:'middle'});}}}
function drawSpectrumStrip(sim,ctx,k){const p=sim.p,s=SOL(sim),c=cSample(sim);const L=70,R=770,T=326,B=p.mode==='brass'?(k<1.25?452:438):470;const H=B-T;
  const X=l=>L+(l-LMIN)/(LMAX-LMIN)*(R-L);let ymax=0.2;for(let l=LMIN;l<=LMAX;l+=4)ymax=Math.max(ymax,measA(sim,c,l));ymax*=1.12;const Y=a=>B-a/ymax*(H-12);
  ctx.fillStyle=PAL['card'];ctx.fillRect(L,T,R-L,H);ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.strokeRect(L,T,R-L,H);
  for(let l=LMIN;l<LMAX;l+=2){ctx.fillStyle=wl2rgb(l);ctx.globalAlpha=0.9;ctx.fillRect(X(l),B-7,X(l+2)-X(l)+0.6,7);}ctx.globalAlpha=1;
  ctx.fillStyle=PAL['s1'];ctx.globalAlpha=0.14;ctx.beginPath();ctx.moveTo(X(LMIN),B-7);for(let l=LMIN;l<=LMAX;l+=2)ctx.lineTo(X(l),Math.min(B-7,Y(measA(sim,c,l))));ctx.lineTo(X(LMAX),B-7);ctx.closePath();ctx.fill();ctx.globalAlpha=1;
  ctx.strokeStyle=PAL['s1'];ctx.lineWidth=2.5;ctx.beginPath();for(let l=LMIN;l<=LMAX;l+=2){const y=Math.min(B-7,Y(measA(sim,c,l)));l===LMIN?ctx.moveTo(X(l),y):ctx.lineTo(X(l),y);}ctx.stroke();
  ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(X(p.lam),T);ctx.lineTo(X(p.lam),B);ctx.stroke();
  const title='Absorbance spectrum';ctx.font='400 '+(12*k)+'px '+FONT;const ttw=ctx.measureText(title).width;txt(ctx,title,L+6,T+14*k,{s:12*k,c:PAL['cv-soft']});
  const tag=p.lam+' nm: A = '+measA(sim).toFixed(2);ctx.font='700 '+(12*k)+'px '+FONT;const tw=ctx.measureText(tag).width;const right=X(p.lam)+8+tw<R-4;
  const tx=right?X(p.lam)+8:X(p.lam)-8,x0=right?tx:tx-tw,clash=x0<L+ttw+14;
  txt(ctx,tag,tx,T+(clash?30:14)*k,{s:12*k,w:700,a:right?'left':'right'});
  [400,500,600,700,800].forEach(l=>txt(ctx,String(l),X(l),B+4,{s:12*k,c:PAL['cv-soft'],a:'center',b:'top'}));
  ctx.save();ctx.translate(L-14,(T+B)/2);ctx.rotate(-Math.PI/2);txt(ctx,'A',0,0,{s:12*k,w:700,c:PAL['cv-soft'],a:'center',b:'middle'});ctx.restore();
  void s;}
BL.onLevel=syncMode;
BioLab.register(BL);
})();
