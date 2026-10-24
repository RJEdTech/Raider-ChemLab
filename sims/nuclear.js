(function(){
'use strict';
const {clamp,lerp,rng,randn,rr,txt,pill,atLeast,PAL,FONT,RM,axes,legend,serColor}=BioLab.h;
const CL=window.ChemLab;

/* ---------- data ----------
   Half-lives and decay modes: NNDC / NUBASE (rounded). Atomic masses (u): AME2020. */
const NUC=[
  {id:'C14',Z:6,A:14,mode:'b-',half:'5,730 years',use:'carbon dating of once-living things'},
  {id:'H3',Z:1,A:3,mode:'b-',half:'12.3 years',use:'glowing exit signs (tritium)'},
  {id:'P32',Z:15,A:32,mode:'b-',half:'14.3 days',use:'tracing DNA in biology labs'},
  {id:'Co60',Z:27,A:60,mode:'b-',half:'5.27 years',use:'cancer radiation therapy (its gamma rays)',g:true},
  {id:'Sr90',Z:38,A:90,mode:'b-',half:'28.8 years',use:'fallout from nuclear tests',dUnst:'Y-90 is radioactive too (β⁻, 64 h)'},
  {id:'I131',Z:53,A:131,mode:'b-',half:'8.02 days',use:'treating thyroid disease',g:true},
  {id:'Cs137',Z:55,A:137,mode:'b-',half:'30.1 years',use:'Chernobyl and Fukushima fallout',g:true},
  {id:'K40',Z:19,A:40,mode:'b-',half:'1.25 billion years',use:'natural radiation in bananas and in you'},
  {id:'F18',Z:9,A:18,mode:'b+',half:'110 minutes',use:'PET scans'},
  {id:'C11',Z:6,A:11,mode:'b+',half:'20.4 minutes',use:'PET scans'},
  {id:'Na22',Z:11,A:22,mode:'b+',half:'2.60 years',use:'positron sources for research'},
  {id:'Be7',Z:4,A:7,mode:'ec',half:'53.2 days',use:'made by cosmic rays in the upper air'},
  {id:'Tc99m',Z:43,A:99,mode:'g',half:'6.01 hours',use:'the most common medical imaging isotope',meta:true,dUnst:'Tc-99 is radioactive too, but with a 211,000-year half-life'},
  {id:'U238',Z:92,A:238,mode:'a',half:'4.47 billion years',use:'dating rocks and the age of Earth',dUnst:'Th-234 is radioactive (see the decay chain)'},
  {id:'U235',Z:92,A:235,mode:'a',half:'704 million years',use:'nuclear reactor fuel (by fission)',dUnst:'Th-231 is radioactive'},
  {id:'Ra226',Z:88,A:226,mode:'a',half:'1,600 years',use:'studied by Marie Curie',dUnst:'Rn-222 is radioactive'},
  {id:'Rn222',Z:86,A:222,mode:'a',half:'3.82 days',use:'radon gas that collects in basements',dUnst:'Po-218 is radioactive'},
  {id:'Po210',Z:84,A:210,mode:'a',half:'138 days',use:'the last radioactive step of the uranium chain'},
  {id:'Am241',Z:95,A:241,mode:'a',half:'432 years',use:'home smoke detectors',dUnst:'Np-237 is radioactive'},
  {id:'Pu239',Z:94,A:239,mode:'a',half:'24,100 years',use:'reactor fuel and nuclear weapons',dUnst:'U-235 is radioactive'}];
const MODE_NAME={'a':'alpha (α)','b-':'beta minus (β⁻)','b+':'positron (β⁺)','ec':'electron capture','g':'gamma (γ)'};
const PART={'a':{A:4,Z:2,sym:'He',name:'α particle'},'b-':{A:0,Z:-1,sym:'e',name:'electron (β⁻)'},'b+':{A:0,Z:1,sym:'e',name:'positron (β⁺)'},'ec':{A:0,Z:-1,sym:'e',name:'electron captured'},'g':{A:0,Z:0,sym:'γ',name:'gamma ray'}};
function daughter(n){const m=n.mode;return m==='a'?{Z:n.Z-2,A:n.A-4}:m==='b-'?{Z:n.Z+1,A:n.A}:(m==='b+'||m==='ec')?{Z:n.Z-1,A:n.A}:{Z:n.Z,A:n.A};}
const CHAINS={
  U238:{name:'Uranium-238 series',steps:[['U',238,'a','4.47 billion years'],['Th',234,'b-','24.1 days'],['Pa',234,'b-','1.17 min'],['U',234,'a','245,500 years'],['Th',230,'a','75,400 years'],['Ra',226,'a','1,600 years'],['Rn',222,'a','3.82 days'],['Po',218,'a','3.10 min'],['Pb',214,'b-','26.8 min'],['Bi',214,'b-','19.9 min'],['Po',214,'a','164 µs'],['Pb',210,'b-','22.2 years'],['Bi',210,'b-','5.01 days'],['Po',210,'a','138 days'],['Pb',206,'',' stable']]},
  Th232:{name:'Thorium-232 series',steps:[['Th',232,'a','14.0 billion years'],['Ra',228,'b-','5.75 years'],['Ac',228,'b-','6.15 h'],['Th',228,'a','1.91 years'],['Ra',224,'a','3.63 days'],['Rn',220,'a','55.6 s'],['Po',216,'a','0.145 s'],['Pb',212,'b-','10.6 h'],['Bi',212,'b-','60.6 min'],['Po',212,'a','0.30 µs'],['Pb',208,'',' stable']]}};
const SYMZ=s=>CL.el(s).Z;
/* stable isotopes for Z ≤ 20 (exact) and an empirical band above that */
const STABLE={1:[1,2],2:[3,4],3:[6,7],4:[9],5:[10,11],6:[12,13],7:[14,15],8:[16,17,18],9:[19],10:[20,21,22],11:[23],12:[24,25,26],13:[27],14:[28,29,30],15:[31],16:[32,33,34,36],17:[35,37],18:[36,38,40],19:[39,41],20:[40,42,43,44,46,48]};
function Nline(Z){let A=2*Z;for(let i=0;i<8;i++)A=Z*(1.98+0.0155*Math.pow(A,2/3));return A-Z;}
function stableish(Z,N){if(Z<1)return false;if(Z<=20)return (STABLE[Z]||[]).includes(Z+N);if(Z>83||Z===43||Z===61)return false;return Math.abs(N-Nline(Z))<=0.8+0.05*Z;}
/* masses (u) for the energy view */
const MASS={n:1.008665,H2:2.014102,H3:3.016049,He4:4.002602,U235:235.043930,Ba141:140.914411,Kr92:91.926156};
const MeV_u=931.494,J_MeV=1.602177e-13,kg_u=1.660539e-27;
const RXN={fusion:{name:'Fusion of deuterium and tritium',L:[['H',2,1,'H2'],['H',3,1,'H3']],R:[['He',4,2,'He4'],['n',1,0,'n']]},
  fission:{name:'Fission of uranium-235',L:[['n',1,0,'n'],['U',235,92,'U235']],R:[['Ba',141,56,'Ba141'],['Kr',92,36,'Kr92'],['n',1,0,'n',3]]}};
function rxnCalc(r){const R=RXN[r],sum=side=>side.reduce((a,t)=>a+MASS[t[3]]*(t[4]||1),0);const mL=sum(R.L),mR=sum(R.R),dm=mL-mR,Q=dm*MeV_u;return {mL,mR,dm,Q,perkg:Q*J_MeV/(mL*kg_u)};}
const BEA=[['²H',2,1.112],['³He',3,2.573],['⁴He',4,7.074],['⁶Li',6,5.332],['¹²C',12,7.680],['¹⁶O',16,7.976],['⁵⁶Fe',56,8.790],['⁹²Kr',92,8.513],['¹⁴¹Ba',141,8.326],['²⁰⁸Pb',208,7.867],['²³⁵U',235,7.591],['²³⁸U',238,7.570]];
function semf(A){const Z=A/(1.98+0.0155*Math.pow(A,2/3));const B=15.8*A-18.3*Math.pow(A,2/3)-0.714*Z*(Z-1)/Math.cbrt(A)-23.2*Math.pow(A-2*Z,2)/A;return B/A;}
/* shielding: transmission through paper, 3 mm aluminum, lead (μ for 1.25 MeV γ) */
const MU_PB=0.667;
function trans(p,which){const r=p.rad;if(which==='paper')return r==='alpha'?0:r==='beta'?0.92:1;if(which==='al')return r==='alpha'?0:r==='beta'?0.02:0.957;if(which==='lead')return r==='gamma'?Math.exp(-MU_PB*p.pbx):0;return 1;}
function through(p){let T=1;['paper','al','lead'].forEach(w=>{if(p[w])T*=trans(p,w);});return T;}

/* ---------- drawing helpers ---------- */
function notation(ctx,A,Z,sym,x,y,S,col,opts){opts=opts||{};const s2=Math.max(12,S*0.4);ctx.font='700 '+S+'px '+FONT;const ws=ctx.measureText(sym).width;ctx.font='700 '+s2+'px '+FONT;
  const zs=Z<0?'−'+(-Z):(opts.plusZ&&Z>0?'+'+Z:String(Z));const wl=Math.max(ctx.measureText(String(A)).width,ctx.measureText(zs).width)+2;const W=wl+ws;const x0=opts.left?x:x-W/2;
  if(!opts.measure){txt(ctx,String(A),x0+wl-2,y-S*0.6,{s:s2,w:700,c:col,a:'right'});txt(ctx,zs,x0+wl-2,y+s2*0.3,{s:s2,w:700,c:col,a:'right'});txt(ctx,sym,x0+wl,y,{s:S,w:700,c:col});}return W;}
function equation(ctx,terms,cx,y,S,col,hiFrom){ctx.save();const gap=S*0.45;const ws=terms.map(t=>t.op?(ctx.font='700 '+S+'px '+FONT,ctx.measureText(t.op).width):notation(ctx,t.A,t.Z,t.sym,0,0,S,col,{measure:true,plusZ:t.plusZ})+(t.k?(ctx.font='700 '+S+'px '+FONT,ctx.measureText(t.k+' ').width):0));
  const W=ws.reduce((a,b)=>a+b,0)+gap*(terms.length-1);let x=cx-W/2;terms.forEach((t,i)=>{const c=hiFrom!==undefined&&i>=hiFrom?PAL['rj']:col;
    if(t.op)txt(ctx,t.op,x,y,{s:S,w:700,c:PAL['cv-soft']});else{let xx=x;if(t.k){txt(ctx,t.k+' ',x,y,{s:S,w:700,c});ctx.font='700 '+S+'px '+FONT;xx+=ctx.measureText(t.k+' ').width;}notation(ctx,t.A,t.Z,t.sym,xx,y,S,c,{left:true,plusZ:t.plusZ});}
    x+=ws[i]+gap;});ctx.restore();return W;}
function eqTerms(n){const d=daughter(n),P=PART[n.mode],ps=CL.el(n.Z).sym,ds=CL.el(d.Z).sym;
  const par={A:n.A,Z:n.Z,sym:ps+(n.meta?'ᵐ':'')},dau={A:d.A,Z:d.Z,sym:ds},pt={A:P.A,Z:P.Z,sym:P.sym,plusZ:n.mode==='b+'};
  if(n.mode==='ec')return {t:[par,{op:'+'},{A:0,Z:-1,sym:'e'},{op:'→'},dau],hi:4,sumA:[n.A+' + 0',String(d.A)],sumZ:[n.Z+' + (−1)',String(d.Z)]};
  return {t:[par,{op:'→'},dau,{op:'+'},pt],hi:2,sumA:[String(n.A),d.A+' + '+P.A],sumZ:[String(n.Z),d.Z+' + '+(P.Z<0?'(−1)':P.Z)]};}
function nucleonPts(Z,A,cx,cy,r){const out=[];for(let i=0;i<A;i++){const isP=Math.floor((i+1)*Z/A)>Math.floor(i*Z/A);const q=r*1.05*Math.sqrt(i+0.5),a=i*2.39996;out.push({x:cx+q*Math.cos(a),y:cy+q*Math.sin(a),p:isP});}return out;}
function drawNucleus(ctx,Z,A,cx,cy,glow){const r=A>100?3.7:A>40?5:7;const pts=nucleonPts(Z,A,cx,cy,r),simple=A>100;
  if(glow){const R=r*1.05*Math.sqrt(A)+r+14;const g=ctx.createRadialGradient(cx,cy,0,cx,cy,R);g.addColorStop(0,'rgba(167,125,255,'+(0.5*glow)+')');g.addColorStop(1,'rgba(167,125,255,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(cx,cy,R,0,6.29);ctx.fill();}
  for(let i=pts.length-1;i>=0;i--){const o=pts[i],c=o.p?CL.FILL.proton:CL.FILL.neutron;if(simple){ctx.fillStyle=c;ctx.beginPath();ctx.arc(o.x,o.y,r,0,6.29);ctx.fill();ctx.strokeStyle=CL.shade(c,-0.45);ctx.lineWidth=0.8;ctx.stroke();}
    else{const g=ctx.createRadialGradient(o.x-r*0.35,o.y-r*0.4,r*0.1,o.x,o.y,r);g.addColorStop(0,'#fff');g.addColorStop(0.3,c);g.addColorStop(1,CL.shade(c,-0.35));ctx.fillStyle=g;ctx.beginPath();ctx.arc(o.x,o.y,r,0,6.29);ctx.fill();}}
  return r*1.05*Math.sqrt(A)+r;}
function ball(ctx,x,y,r,c){const g=ctx.createRadialGradient(x-r*0.35,y-r*0.4,r*0.1,x,y,r);g.addColorStop(0,'#fff');g.addColorStop(0.3,c);g.addColorStop(1,CL.shade(c,-0.35));ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,6.29);ctx.fill();}
function wave(ctx,x0,x1,y,col,amp,ph){ctx.strokeStyle=col;ctx.lineWidth=2.5;ctx.beginPath();for(let x=x0;x<=x1;x+=2){const yy=y+Math.sin((x-x0)/6+ph)*amp;x===x0?ctx.moveTo(x,yy):ctx.lineTo(x,yy);}ctx.stroke();}

function syncMode(sim){if(!sim.ui||!sim.ui.sec)return;if(!atLeast('ap')&&sim.p.mode==='energy')BioLab.setValues(sim,{mode:'decay'});const mode=sim.p.mode,d=sim.def;
  d.controls.forEach(c=>{if(!c.modes)return;const cid=d.id+'-'+c.id,e=document.getElementById(cid)||document.getElementById(cid+'-l');if(!e)return;const w=e.closest('.ctl');if(w)w.hidden=!atLeast(c.lvl)||!c.modes.includes(mode);});
  d.metrics.forEach(m=>{if(!m.modes)return;const t=sim.ui.tiles[m.id];if(!t)return;const w=t.num.closest('.tile');if(w)w.hidden=!atLeast(m.lvl)||!m.modes.includes(mode);});
  const btns=[...sim.ui.sec.querySelectorAll('.actions button')];d.actions.forEach(a=>{const b=btns.find(x=>x.textContent===a.label);if(b)b.hidden=!atLeast(a.lvl)||!a.modes.includes(mode);});}
const nucOf=p=>NUC.find(n=>n.id===p.nuc)||NUC[0];
function doDecay(sim){const st=sim.st;if(st.dstate==='done'){st.dstate='parent';}st.dstate='anim';st.dt=0;}
function chainNext(sim){const st=sim.st,C=CHAINS[sim.p.chain];if(st.ci<C.steps.length-1){st.ci++;st.cAnim=0;}}

const NU={
  id:'nuclear',hash:'nuclear',apUnit:2,order:4,tab:'Nuclear decay',kind:'Simulation',prereq:['atombuilder'],next:['halflife'],
  card:'Pick a radioactive nucleus, watch it decay with a balanced nuclear equation, follow uranium down to lead, and test what stops each kind of radiation.',
  title:'Nuclear decay: alpha, beta and gamma',
  lede:{bio:'An unstable nucleus changes itself by giving off radiation. See what comes out, what the nucleus becomes, and what it takes to stop each kind of radiation.',
        honors:'Balance nuclear equations by mass number and atomic number, predict the decay mode from the band of stability, and follow a natural decay chain.',
        ap:'Connect stability to binding energy: find the mass defect, use E = mc², and see why both fission and fusion release energy.'},
  scale:{bio:'One nucleus, about 10⁻¹⁴ m across, drawn about a trillion times larger than life.',ap:'One nucleus (2–15 fm across). Energies are in MeV per nucleus; 1 u of mass is worth 931.5 MeV.'},
  timeless:true,animated:true,chChange:0.5,chReveal:2.6,
  controls:[
    {id:'mode',label:'Show',type:'seg',def:'decay',lvl:'bio',noTrial:true,options:[{v:'decay',l:'One decay'},{v:'chain',l:'Decay chain'},{v:'shield',l:'Shielding'},{v:'energy',l:'Binding energy',lvl:'ap'}]},
    {id:'nuc',label:'Nucleus',type:'select',def:'C14',lvl:'bio',modes:['decay'],options:NUC.map(n=>({v:n.id,l:CL.el(n.Z).name+'-'+n.A+(n.meta?'m':'')+' ('+MODE_NAME[n.mode].split(' (')[0]+')'})),onChange(sim){if(sim.st){sim.st.dstate='parent';sim.st.dt=0;}}},
    {id:'chain',label:'Chain',type:'seg',def:'U238',lvl:'bio',modes:['chain'],options:[{v:'U238',l:'Uranium-238'},{v:'Th232',l:'Thorium-232'}],onChange(sim){if(sim.st){sim.st.ci=0;sim.st.cAnim=1;}}},
    {id:'rad',label:'Radiation',type:'seg',def:'alpha',lvl:'bio',modes:['shield'],options:[{v:'alpha',l:'Alpha (Am-241)'},{v:'beta',l:'Beta (Sr-90)'},{v:'gamma',l:'Gamma (Co-60)'}]},
    {id:'paper',label:'Sheet of paper',type:'toggle',def:false,lvl:'bio',modes:['shield']},
    {id:'al',label:'Aluminum, 3 mm',type:'toggle',def:false,lvl:'bio',modes:['shield']},
    {id:'lead',label:'Lead block',type:'toggle',def:false,lvl:'bio',modes:['shield']},
    {id:'pbx',label:'Lead thickness',type:'range',min:0.5,max:10,step:0.5,def:5,unit:' cm',lvl:'honors',modes:['shield']},
    {id:'rxn',label:'Reaction',type:'seg',def:'fusion',lvl:'ap',modes:['energy'],options:[{v:'fusion',l:'Fusion (D + T)'},{v:'fission',l:'Fission (U-235)'}]}
  ],
  actions:[
    {id:'decay',label:'Decay it',lvl:'bio',primary:true,modes:['decay'],run(sim){doDecay(sim);}},
    {id:'next',label:'Next decay',lvl:'bio',primary:true,modes:['chain'],run(sim){chainNext(sim);}},
    {id:'all',label:'Run the whole chain',lvl:'bio',modes:['chain'],run(sim){const C=CHAINS[sim.p.chain];sim.st.ci=C.steps.length-1;sim.st.cAnim=1;}},
    {id:'restart',label:'Restart chain',lvl:'bio',modes:['chain'],run(sim){sim.st.ci=0;sim.st.cAnim=1;}}
  ],
  init(sim){return {dstate:'parent',dt:0,ci:0,cAnim:1,parts:[],acc:0,r:rng(42),clicks:0,flash:0};},
  step(sim,dt){const st=sim.st,p=sim.p;
    if(st.dstate==='anim'){st.dt+=dt;if(st.dt>1.6){st.dstate='done';sim.infoDirty=true;}}
    st.cAnim=Math.min(1,st.cAnim+dt/0.9);
    if(p.mode==='shield'){st.acc+=dt;const rate=p.rad==='alpha'?9:14;while(st.acc>1/rate){st.acc-=1/rate;let stop=null;for(const w of ['paper','al','lead']){if(p[w]&&st.r()>trans(p,w)){stop=w;break;}}st.parts.push({x:96,y:224+(st.r()-0.5)*60,stop,age:0,ph:st.r()*6});}
      const v=p.rad==='alpha'?170:p.rad==='beta'?380:520;st.parts.forEach(q=>{q.age+=dt;const bx=BARX[q.stop];if(q.stop&&q.x>=bx-6){q.x=bx-6;q.dead=(q.dead||0)+dt;}else q.x+=v*dt;if(q.x>660&&!q.hit){q.hit=true;st.flash=1;}});
      st.parts=st.parts.filter(q=>q.x<720&&(q.dead||0)<0.5);st.flash=Math.max(0,st.flash-dt*4);}},
  metrics:[
    {id:'par',label:'Parent nucleus',unit:'',lvl:'bio',text:true,modes:['decay'],get:s=>{const n=nucOf(s.p);return CL.el(n.Z).name+'-'+n.A+(n.meta?'m':'')+': '+n.Z+' p, '+(n.A-n.Z)+' n';}},
    {id:'dm',label:'Decay mode',unit:'',lvl:'bio',text:true,modes:['decay'],get:s=>MODE_NAME[nucOf(s.p).mode]},
    {id:'dau',label:'Daughter nucleus',unit:'',lvl:'bio',text:true,modes:['decay'],get:s=>{const n=nucOf(s.p),d=daughter(n);return CL.el(d.Z).name+'-'+d.A+': '+d.Z+' p, '+(d.A-d.Z)+' n';}},
    {id:'hl',label:'Half-life',unit:'',lvl:'bio',text:true,modes:['decay'],get:s=>nucOf(s.p).half},
    {id:'nz',label:'Parent N : Z ratio',unit:'',lvl:'honors',min:0,max:2,d:2,modes:['decay'],get:s=>{const n=nucOf(s.p);return (n.A-n.Z)/n.Z;}},
    {id:'cstep',label:'Now at',unit:'',lvl:'bio',text:true,modes:['chain'],get:s=>{const C=CHAINS[s.p.chain],q=C.steps[Math.min(s.st.ci,C.steps.length-1)];return CL.el(q[0]).name+'-'+q[1]+' (step '+(s.st.ci+1)+' of '+C.steps.length+')';}},
    {id:'na',label:'Alpha decays so far',unit:'',lvl:'bio',min:0,max:8,d:0,modes:['chain'],get:s=>CHAINS[s.p.chain].steps.slice(0,s.st.ci).filter(q=>q[2]==='a').length},
    {id:'nb',label:'Beta decays so far',unit:'',lvl:'bio',min:0,max:6,d:0,modes:['chain'],get:s=>CHAINS[s.p.chain].steps.slice(0,s.st.ci).filter(q=>q[2]==='b-').length},
    {id:'cps',label:'Geiger counter',unit:'counts/s',lvl:'bio',min:0,max:1000,d:0,modes:['shield'],get:s=>1000*through(s.p)+0.5},
    {id:'pct',label:'Radiation that gets through',unit:'%',lvl:'bio',min:0,max:100,d:1,modes:['shield'],get:s=>100*through(s.p)},
    {id:'hvl',label:'Half-value layer of lead (γ)',unit:'cm',lvl:'ap',min:0,max:null,d:2,modes:['shield'],get:s=>Math.LN2/MU_PB},
    {id:'q',label:'Energy released',unit:'MeV',lvl:'ap',min:0,max:null,d:1,modes:['energy'],get:s=>rxnCalc(s.p.rxn).Q},
    {id:'dmass',label:'Mass defect',unit:'u',lvl:'ap',min:0,max:null,d:5,modes:['energy'],get:s=>rxnCalc(s.p.rxn).dm},
    {id:'perkg',label:'Energy per kg of fuel',unit:'J/kg',lvl:'ap',text:true,modes:['energy'],get:s=>CL.sci(rxnCalc(s.p.rxn).perkg,'',3)}
  ],
  graphs:[{id:'band',label:'Band of stability (N vs Z)',lvl:'bio',custom:true},{id:'atten',label:'Gamma rays through lead',lvl:'honors',custom:true},{id:'bea',label:'Binding energy per nucleon',lvl:'ap',custom:true}],
  defaultGraph:'band',
  plot(sim,ctx,box,id){const p=sim.p;
    if(id==='atten'){const ax=axes(ctx,box,{xmin:0,xmax:10,ymin:0,ymax:100,xl:'Lead thickness (cm)',yl:'Gamma rays through (%)'});ctx.strokeStyle=serColor(0);ctx.lineWidth=2.5;ctx.beginPath();for(let x=0;x<=10;x+=0.05){const y=100*Math.exp(-MU_PB*x);x?ctx.lineTo(ax.X(x),ax.Y(y)):ctx.moveTo(ax.X(x),ax.Y(y));}ctx.stroke();
      const h=Math.LN2/MU_PB;for(let i=1;i<=3;i++){ctx.setLineDash([4,4]);ctx.strokeStyle=PAL['muted'];ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(ax.X(h*i),ax.Y(0));ctx.lineTo(ax.X(h*i),ax.Y(100/Math.pow(2,i)));ctx.lineTo(ax.X(0),ax.Y(100/Math.pow(2,i)));ctx.stroke();ctx.setLineDash([]);}
      const y=100*Math.exp(-MU_PB*p.pbx);ctx.fillStyle=serColor(1);ctx.beginPath();ctx.arc(ax.X(p.pbx),ax.Y(y),6,0,6.29);ctx.fill();
      legend(ctx,box.L+150,box.T+12,[{label:'I = I₀e^(−μx), half-value layer '+h.toFixed(2)+' cm',color:serColor(0)}]);return;}
    if(id==='bea'){const ax=axes(ctx,box,{xmin:0,xmax:250,ymin:0,ymax:9.5,xl:'Mass number A',yl:'Binding energy per nucleon (MeV)',yd:0});ctx.strokeStyle=serColor(0);ctx.lineWidth=2.5;ctx.beginPath();for(let A=12;A<=250;A+=2){const y=semf(A);A===12?ctx.moveTo(ax.X(A),ax.Y(y)):ctx.lineTo(ax.X(A),ax.Y(y));}ctx.stroke();
      BEA.forEach(b=>{ctx.fillStyle=PAL['cv-ink'];ctx.beginPath();ctx.arc(ax.X(b[1]),ax.Y(b[2]),4,0,6.29);ctx.fill();txt(ctx,b[0],ax.X(b[1])+6,ax.Y(b[2])+(b[1]<10?14:-8),{s:12,c:PAL['cv-ink']});});
      legend(ctx,box.L+170,box.T+box.H-16,[{label:'liquid-drop model',color:serColor(0)},{label:'measured',color:PAL['cv-ink']}]);return;}
    // band of stability
    const ax=axes(ctx,box,{xmin:0,xmax:100,ymin:0,ymax:155,xl:'Protons (Z)',yl:'Neutrons (N)'});ctx.save();ctx.beginPath();ctx.rect(box.L,box.T,box.W,box.H);ctx.clip();
    for(let Z=1;Z<=83;Z++){for(let N=0;N<=150;N++)if(stableish(Z,N)){ctx.fillStyle=PAL['cv-ink'];ctx.fillRect(ax.X(Z)-1.5,ax.Y(N)-1.5,3,3);}}
    ctx.setLineDash([5,4]);ctx.strokeStyle=PAL['muted'];ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(ax.X(0),ax.Y(0));ctx.lineTo(ax.X(100),ax.Y(100));ctx.stroke();ctx.setLineDash([]);
    let pts=[];if(p.mode==='chain'){const C=CHAINS[p.chain];pts=C.steps.slice(0,sim.st.ci+1).map(q=>[SYMZ(q[0]),q[1]-SYMZ(q[0])]);}else{const n=nucOf(p),d=daughter(n);pts=[[n.Z,n.A-n.Z],[d.Z,d.A-d.Z]];}
    ctx.strokeStyle=PAL['s1'];ctx.lineWidth=2;ctx.beginPath();pts.forEach((q,i)=>i?ctx.lineTo(ax.X(q[0]),ax.Y(q[1])):ctx.moveTo(ax.X(q[0]),ax.Y(q[1])));ctx.stroke();
    pts.forEach((q,i)=>{ctx.fillStyle=i===pts.length-1?PAL['s3']:PAL['s1'];ctx.beginPath();ctx.arc(ax.X(q[0]),ax.Y(q[1]),5,0,6.29);ctx.fill();});ctx.restore();
    txt(ctx,'N = Z',ax.X(60),ax.Y(60)+18,{s:12,c:PAL['muted']});
    legend(ctx,box.L+12,box.T+10,[{label:'stable nuclei',color:PAL['cv-ink']},{label:'parent',color:PAL['s1']},{label:p.mode==='chain'?'now':'daughter',color:PAL['s3']}]);},
  infoPanel(sim){const p=sim.p,st=sim.st,hon=atLeast('honors'),ap=atLeast('ap');
    if(p.mode==='decay'){const n=nucOf(p),d=daughter(n),N=n.A-n.Z,e=eqTerms(n),nl=n.Z<=83?Nline(n.Z):null;
      let why=n.mode==='a'?'It is too big: no nucleus with more than 83 protons is stable. Alpha decay removes 2 protons and 2 neutrons at once.':n.mode==='b-'?'It has too many neutrons for its protons (above the band of stability). In β⁻ decay a neutron turns into a proton and an electron, and the electron shoots out.':(n.mode==='b+'||n.mode==='ec')?'It has too few neutrons (below the band of stability). A proton turns into a neutron, by '+(n.mode==='ec'?'capturing one of the atom’s own inner electrons.':'giving off a positron, the electron’s antimatter twin.'):'The nucleus was left in an excited state. It drops to its ground state by giving off a high-energy photon, so A and Z do not change.';
      let h=`<h3>${CL.el(n.Z).name}-${n.A}${n.meta?'m':''}</h3><p><b>Why it decays:</b> ${why}</p><p><b>Balance it:</b> mass numbers ${e.sumA[0]} = ${e.sumA[1]}; atomic numbers ${e.sumZ[0]} = ${e.sumZ[1]}.</p><p><b>Used for:</b> ${n.use}. Half-life ${n.half}.</p>`;
      if(hon&&nl!==null&&n.mode!=='g'&&n.mode!=='a')h+=`<p>It has ${N} neutrons; stable nuclei with ${n.Z} protons have about ${Math.round(nl)}. The daughter ${CL.el(d.Z).sym}-${d.A} ${n.dUnst?'is not the end: '+n.dUnst:'is stable'}.</p>`;else if(n.dUnst)h+=`<p>${n.dUnst}.</p>`;
      if(n.g)h+='<p>After the β⁻ decay, the daughter nucleus also gives off gamma rays.</p>';return h;}
    if(p.mode==='chain'){const C=CHAINS[p.chain];const rows=C.steps.map((q,i)=>`<tr${i===st.ci?' style="font-weight:700;color:var(--rj-ink)"':''}${i>st.ci?' style="opacity:.5"':''}><td style="text-align:left">${q[0]}-${q[1]}</td><td style="text-align:left">${q[2]?MODE_NAME[q[2]].split(' (')[1].replace(')',''):'stable'}</td><td style="text-align:left">${q[2]?q[3]:'—'}</td></tr>`).join('');
      const first=C.steps[0],last=C.steps[C.steps.length-1],na=C.steps.filter(q=>q[2]==='a').length,nb=C.steps.filter(q=>q[2]==='b-').length;
      return `<h3>${C.name}</h3><div class="tbl-wrap"><table><thead><tr><th style="text-align:left">Nucleus</th><th style="text-align:left">Decay</th><th style="text-align:left">Half-life</th></tr></thead><tbody>${rows}</tbody></table></div>${hon?`<p style="margin-top:8px">Mass number drops ${first[1]} → ${last[1]} = ${first[1]-last[1]}, and only α decay changes A, so there are (${first[1]-last[1]})/4 = ${na} α decays. They remove ${2*na} protons, but Z only falls ${SYMZ(first[0])-SYMZ(last[0])}, so ${nb} β⁻ decays add protons back.</p>`:''}${p.chain==='Th232'?'<p>Bi-212 also decays by α (36%) through Tl-208. Both branches end at stable Pb-208.</p>':''}`;}
    if(p.mode==='shield'){const T=through(p);let h=`<h3>${p.rad==='alpha'?'Alpha particles':p.rad==='beta'?'Beta particles':'Gamma rays'}</h3>`;
      h+=p.rad==='alpha'?'<p>Alpha particles are big (2 protons + 2 neutrons) and carry a 2+ charge, so they collide with atoms constantly and stop within a few centimeters of air or one sheet of paper. Outside the body they are harmless; inhaled or swallowed (like radon or polonium), they do the most damage.</p>':p.rad==='beta'?'<p>Beta particles are fast electrons: light, with a 1− charge. They pass through paper and skin but a few millimeters of aluminum or plastic stops them.</p>':'<p>Gamma rays are high-energy photons with no mass and no charge. Nothing stops them completely: each thickness of dense material like lead removes the same fraction.</p>';
      h+=`<p><b>Getting through:</b> ${(100*T).toFixed(T<0.01?3:1)}%. The Geiger counter also picks up about 0.5 counts/s of natural background radiation.</p>`;
      if(hon&&p.rad==='gamma')h+=`<p>For 1.25 MeV gamma rays, every ${(Math.LN2/MU_PB).toFixed(2)} cm of lead cuts the intensity in half (the half-value layer). ${p.lead?p.pbx.toFixed(1)+' cm is '+(p.pbx*MU_PB/Math.LN2).toFixed(1)+' half-value layers.':''}</p>`;return h;}
    const c=rxnCalc(p.rxn),R=RXN[p.rxn];const side=s=>s.map(t=>(t[4]?t[4]+' × ':'')+t[0]+'-'+t[1]+' ('+MASS[t[3]].toFixed(6)+' u)').join(' + ');
    return `<h3>${R.name}</h3><p><b>Mass before:</b> ${side(R.L)} = ${c.mL.toFixed(6)} u</p><p><b>Mass after:</b> ${side(R.R)} = ${c.mR.toFixed(6)} u</p><p><b>Mass defect:</b> Δm = ${c.dm.toFixed(6)} u. <b>E = Δm c²</b> = ${c.dm.toFixed(6)} u × 931.5 MeV/u = <b>${c.Q.toFixed(1)} MeV</b>.</p><p>Per kilogram of fuel that is ${CL.sci(c.perkg,'J',3)}, about ${CL.roundSig(c.perkg/4.6e7,2).toLocaleString('en-US')} times the energy from burning a kilogram of gasoline (4.6 × 10⁷ J).</p>`;},
  narrate(sim){const p=sim.p,st=sim.st,hon=atLeast('honors');
    if(p.mode==='decay'){const n=nucOf(p),d=daughter(n),P=PART[n.mode],pn=CL.el(n.Z).name+'-'+n.A+(n.meta?'m':''),dn=CL.el(d.Z).name+'-'+d.A;
      if(st.dstate==='parent')return '<b>'+pn+'</b> is radioactive. Press <b>Decay it</b> to watch it give off '+(n.mode==='a'?'an alpha particle':n.mode==='b-'?'a beta particle':n.mode==='b+'?'a positron':n.mode==='ec'?'nothing at first: it pulls in one of its own electrons':'a gamma ray')+'.';
      const ch=n.mode==='a'?'It lost 2 protons and 2 neutrons, so A fell by 4 and Z fell by 2.':n.mode==='b-'?'A neutron became a proton: A stayed '+n.A+' and Z rose by 1, so it is a new element.':(n.mode==='b+'||n.mode==='ec')?'A proton became a neutron: A stayed '+n.A+' and Z fell by 1, so it is a new element.':'Only energy left. A and Z did not change, so it is still technetium-99.';
      return '<b>'+pn+' → '+dn+'</b>. '+ch+(hon?' Both sides of the equation have the same total mass number and atomic number.':'');}
    if(p.mode==='chain'){const C=CHAINS[p.chain],q=C.steps[st.ci],prev=st.ci>0?C.steps[st.ci-1]:null;
      if(!prev)return 'Start: <b>'+CL.el(q[0]).name+'-'+q[1]+'</b>, half-life '+q[3]+'. Press <b>Next decay</b> to follow it step by step down to stable lead.';
      if(!q[2])return '<b>Stable '+CL.el(q[0]).name.toLowerCase()+'-'+q[1]+'</b> at last, after '+C.steps.filter(x=>x[2]==='a').length+' alpha and '+C.steps.filter(x=>x[2]==='b-').length+' beta decays. Every uranium or thorium atom in a rock ends up as lead, which is how geologists date rocks.';
      return CL.el(prev[0]).name+'-'+prev[1]+' gave off '+(prev[2]==='a'?'an <b>alpha particle</b>, moving 2 down in Z and 4 down in A':'a <b>beta particle</b>, moving 1 up in Z with the same A')+'. Now: <b>'+CL.el(q[0]).name+'-'+q[1]+'</b>, half-life '+q[3]+'.';}
    if(p.mode==='shield'){const T=through(p),nm=p.rad==='alpha'?'Alpha particles':p.rad==='beta'?'Beta particles':'Gamma rays',bars=['paper','al','lead'].filter(w=>p[w]);
      if(!bars.length)return nm+' fly straight to the Geiger counter: about <b>1,000 counts per second</b>. Add barriers to see what stops them.';
      const stopper=['paper','al','lead'].find(w=>p[w]&&trans(p,w)<0.05),names={paper:'the paper',al:'the aluminum',lead:'the lead'};
      if(stopper&&T<0.001)return '<b>'+names[stopper].replace(/^the /,'The ')+' stops '+nm.toLowerCase()+'.</b> The counter only reads natural background, about 0.5 counts/s.';
      return '<b>'+(100*T).toFixed(T<0.1?1:0)+'%</b> of the '+nm.toLowerCase()+' get through '+bars.map(w=>names[w]).join(' and ')+'.'+(p.rad==='gamma'&&p.lead&&hon?' Each '+(Math.LN2/MU_PB).toFixed(2)+' cm of lead halves the gamma rays.':'');}
    const c=rxnCalc(p.rxn);return (p.rxn==='fusion'?'Light nuclei fuse into helium-4, which is held together much more tightly.':'Uranium-235 splits into two middle-sized nuclei that are held together more tightly.')+' The products weigh <b>'+c.dm.toFixed(5)+' u less</b>, and that missing mass is released as <b>'+c.Q.toFixed(1)+' MeV</b> (E = mc²).';},
  tour:[
    {title:'An unstable nucleus',text:'Carbon-14 has 6 protons (red) and 8 neutrons (gray). That is too many neutrons for 6 protons, so the nucleus is unstable: radioactive.',focus:[30,60,240,250],pause:true,setup(sim){BioLab.setValues(sim,{mode:'decay',nuc:'C14'});sim.st.dstate='parent';}},
    {title:'Beta decay',text:'A neutron turns into a proton and an electron. The electron shoots out as a beta particle. The nucleus now has 7 protons: it has become nitrogen-14.',focus:[30,60,450,250],speed:0.3,setup(sim){doDecay(sim);}},
    {title:'Balance the equation',text:'Mass numbers (top) and atomic numbers (bottom) must add up the same on both sides. 14 = 14 + 0 and 6 = 7 + (−1). The electron counts as ⁰₋₁e.',focus:[10,318,470,122],pause:true},
    {title:'Alpha decay',text:'Uranium-238 is too big to be stable. It throws out an alpha particle, 2 protons and 2 neutrons (a helium-4 nucleus). It becomes thorium-234: A drops by 4 and Z drops by 2.',focus:[10,40,470,400],speed:0.3,setup(sim){BioLab.setValues(sim,{nuc:'U238'});doDecay(sim);}},
    {title:'Gamma decay',text:'Technetium-99m is an excited nucleus. It drops to a lower energy by giving off a gamma ray, pure energy. Doctors use it for medical scans because the gamma rays leave the body.',focus:[10,40,470,400],speed:0.3,setup(sim){BioLab.setValues(sim,{nuc:'Tc99m'});doDecay(sim);}},
    {title:'Down the chain to lead',text:'Thorium-234 is radioactive too. Uranium-238 decays 14 times, through radium and radon, before it reaches stable lead-206.',focus:[10,10,780,430],speed:0.5,setup(sim){BioLab.setValues(sim,{mode:'chain',chain:'U238'});sim.st.ci=5;sim.st.cAnim=1;}},
    {title:'What stops radiation',text:'Alpha particles are stopped by paper. Beta particles pass paper but stop in a few millimeters of aluminum. Gamma rays need thick lead or concrete, and even then a few get through.',focus:[10,40,780,380],speed:1,setup(sim){BioLab.setValues(sim,{mode:'shield',rad:'beta',paper:true,al:true,lead:false});}},
    {lvl:'ap',title:'Mass becomes energy',text:'When deuterium and tritium fuse, the products weigh 0.0189 u less. E = Δmc² turns that into 17.6 MeV. Fusion and fission both move toward iron-56, the most tightly bound nucleus.',focus:[10,10,780,430],pause:true,setup(sim){BioLab.setValues(sim,{mode:'energy',rxn:'fusion'});}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{mode:'decay',nuc:'C14',paper:false,al:false,lead:false});sim.st.dstate='parent';},
  onChallenge(sim,ch,phase){if(!ch||!ch.instant||phase!=='done')return;if(ch.set)BioLab.setValues(sim,ch.set);if(ch.run)ch.run(sim);},
  challenges:[
    {lvl:'bio',instant:true,set:{mode:'decay',nuc:'U238'},run(sim){doDecay(sim);},q:'Uranium-238 gives off an alpha particle. What is the mass number of the new nucleus?',choices:['238','236','234','237'],correct:2,
     explain:{bio:'An alpha particle is ⁴₂He: 2 protons and 2 neutrons, mass number 4. 238 − 4 = 234. The new nucleus has 92 − 2 = 90 protons: thorium-234. Watch the model decay it.'}},
    {lvl:'bio',q:'Carbon-14 undergoes beta decay. What does it become?',choices:['Carbon-13','Nitrogen-14','Boron-14'],correct:1,
     baseline:{mode:'decay',nuc:'C14'},changeAction:'decay',changeText:'The carbon-14 nucleus decays',
     explain:{bio:'In beta decay a neutron turns into a proton. The mass number stays 14, but now there are 7 protons, so it is nitrogen-14. ¹⁴₆C → ¹⁴₇N + ⁰₋₁e.'}},
    {lvl:'bio',q:'Beta particles are passing through a sheet of paper. Now add the 3 mm aluminum sheet. What happens to the Geiger count?',choices:['It drops to almost nothing','It stays the same','It goes up'],correct:0,
     baseline:{mode:'shield',rad:'beta',paper:true,al:false,lead:false},change:{al:true},changeText:'Aluminum sheet added',
     explain:{bio:'Beta particles are light electrons that get through paper, but a few millimeters of aluminum stops them. The count falls from about 920 to about 19 counts per second.'}},
    {lvl:'honors',q:'Technetium-99m gives off a gamma ray. What happens to its mass number and atomic number?',choices:['Both stay the same','A drops by 4 and Z drops by 2','Z rises by 1'],correct:0,
     baseline:{mode:'decay',nuc:'Tc99m'},changeAction:'decay',changeText:'The Tc-99m nucleus decays',
     explain:{honors:'A gamma ray is a photon, ⁰₀γ, with no mass number and no charge. ⁹⁹ᵐ₄₃Tc → ⁹⁹₄₃Tc + ⁰₀γ. The nucleus only loses energy.'}},
    {lvl:'honors',instant:true,set:{mode:'decay',nuc:'I131'},q:'Iodine-131 has 53 protons and 78 neutrons. Stable iodine (I-127) has 74. Which decay should I-131 undergo?',choices:['β⁻: a neutron becomes a proton','β⁺: a proton becomes a neutron','α: it loses 2 protons and 2 neutrons'],correct:0,
     explain:{honors:'I-131 sits above the band of stability: too many neutrons. β⁻ decay turns a neutron into a proton and moves it toward the band, making xenon-131. The model now shows I-131 and its daughter on the graph.'}},
    {lvl:'honors',instant:true,set:{mode:'chain',chain:'U238'},run(sim){sim.st.ci=CHAINS.U238.steps.length-1;sim.st.cAnim=1;},q:'Uranium-238 decays in a chain to lead-206. How many alpha decays happen along the way?',choices:['4','6','8','32'],correct:2,
     explain:{honors:'Only alpha decay changes the mass number, by 4 each time: (238 − 206)/4 = 8. Eight alphas remove 16 protons, but Z only drops from 92 to 82, so 6 beta decays add protons back. The chain readouts show 8 and 6.'}},
    {lvl:'ap',instant:true,set:{mode:'energy',rxn:'fusion'},q:'Deuterium (2.014102 u) fuses with tritium (3.016049 u) to give helium-4 (4.002602 u) and a neutron (1.008665 u). How much energy is released? (1 u = 931.5 MeV)',choices:['17.6 MeV','4.0 MeV','931 MeV','0.019 MeV'],correct:0,
     explain:{ap:'Δm = 5.030151 − 5.011267 = 0.018884 u. E = 0.018884 × 931.5 = 17.6 MeV. The Energy released readout confirms it.'}},
    {lvl:'ap',instant:true,set:{mode:'energy',rxn:'fission'},q:'Why do both splitting uranium (fission) and joining hydrogen (fusion) release energy?',choices:['The products have more binding energy per nucleon','The products have more protons','Neutrons are converted into energy'],correct:0,
     explain:{ap:'Binding energy per nucleon peaks near iron-56 (8.8 MeV). Moving toward the peak from either side makes a more tightly bound nucleus, so the products weigh less and the difference is released. Nucleons are conserved: 236 before and after fission.'}},
    {lvl:'ap',q:'Gamma rays pass through 1 cm of lead. Double it to 2 cm. The fraction getting through…',choices:['is cut in half again','drops to zero','stays the same'],correct:0,
     baseline:{mode:'shield',rad:'gamma',lead:true,paper:false,al:false,pbx:1},change:{pbx:2},changeText:'Lead thickness doubled to 2 cm',
     explain:{ap:'Attenuation is exponential, I = I₀e^(−μx) with μ = 0.667 cm⁻¹. 1 cm lets 51% through; 2 cm lets 26% through. Each half-value layer (1.04 cm) halves it again, but never reaches zero.'}}
  ],
  lab:{bio:'<p><b>Question:</b> What does each kind of radiation do to a nucleus?</p><ol><li>Decay carbon-14, uranium-238 and technetium-99m. Record a trial for each.</li><li>Write the parent, the particle given off and the daughter.</li><li>In Shielding, record the Geiger count for each radiation with no barrier, paper, aluminum and lead.</li></ol><p>Make a table: what each radiation is, how it changes A and Z, and what stops it.</p>',
       honors:'<p><b>Question:</b> Can you predict the decay mode from the band of stability?</p><ol><li>For each nucleus in the list, record N, Z and the N : Z ratio before you decay it.</li><li>Predict the mode (too many neutrons, too few, or too big), then decay it to check.</li><li>Follow the uranium-238 chain and write all 14 equations.</li></ol><p>Explain how the position of a nucleus above, below or beyond the band decides its decay.</p>',
       ap:'<p><b>Question:</b> Where does nuclear energy come from?</p><ol><li>Record the mass defect and energy for fusion and fission.</li><li>Compare energy per kilogram with gasoline.</li><li>Read the binding energy per nucleon graph for ⁴He, ⁵⁶Fe and ²³⁵U.</li></ol><p><b>Claim–evidence–reasoning:</b> Explain why fusing iron or splitting iron cannot release energy, using the binding energy graph.</p>'},
  terms:[{t:'Radioactive decay',d:'An unstable nucleus changing on its own by giving off radiation.'},{t:'Alpha particle (α)',d:'⁴₂He: 2 protons and 2 neutrons. Stopped by paper.'},{t:'Beta particle (β⁻)',d:'⁰₋₁e: a fast electron made when a neutron turns into a proton. Stopped by aluminum.'},{t:'Gamma ray (γ)',d:'⁰₀γ: a high-energy photon. Reduced, never fully stopped, by lead.'},{t:'Parent / daughter',d:'The nucleus before and after a decay.'},
    {lvl:'honors',t:'Positron (β⁺)',d:'⁰₊₁e: the antimatter electron, given off when a proton turns into a neutron.'},{lvl:'honors',t:'Electron capture',d:'The nucleus pulls in an inner electron, turning a proton into a neutron.'},{lvl:'honors',t:'Band of stability',d:'The region of the N vs Z graph where stable nuclei lie.'},{lvl:'honors',t:'Decay series',d:'A chain of decays from a heavy parent to a stable end product, such as U-238 to Pb-206.'},
    {lvl:'ap',t:'Mass defect',d:'The mass lost when nucleons bind or when a nuclear reaction occurs; E = Δmc².'},{lvl:'ap',t:'Binding energy per nucleon',d:'The energy to pull a nucleus apart, divided by its nucleons. It peaks near ⁵⁶Fe.'},{lvl:'ap',t:'Half-value layer',d:'The thickness of a material that cuts gamma intensity in half.'}],
  about:'<p>Decay modes, half-lives and decay chains are real (NNDC/NUBASE values, rounded). The uranium chain shows the main branch; tiny side branches (below 0.1%) are left out. Nuclear equations are generated from the mode: α changes A by −4 and Z by −2, β⁻ changes Z by +1, β⁺ and electron capture change Z by −1, and γ changes neither. Neutrinos and antineutrinos from beta decay are not shown.</p><p>Stable nuclei for Z ≤ 20 are the real stable isotopes. Above that, the band is drawn from the empirical line of stability, Z = A/(1.98 + 0.0155 A^⅔), with a width chosen to match the real stable isotopes roughly; there are no stable nuclei above Z = 83 or for Tc and Pm.</p><p>Shielding uses typical values: 5 MeV alphas stop in paper; Sr-90/Y-90 betas pass paper (92%) but only about 2% get through 3 mm of aluminum; Co-60 gamma rays (1.25 MeV) follow I = I₀e^(−μx) with μ = 0.667 cm⁻¹ in lead and lose about 4% in the aluminum. Masses are atomic masses from AME2020. The binding-energy curve is the liquid-drop (semi-empirical) formula, with measured values as points.</p>',
  initVis(sim){},
  onLevel(sim){syncMode(sim);},
  draw(sim,ctx,vdt,k,t){const p=sim.p;ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
    if(p.mode==='chain')drawChain(sim,ctx,k,t);else if(p.mode==='shield')drawShield(sim,ctx,k,t);else if(p.mode==='energy')drawEnergy(sim,ctx,k,t);else drawDecay(sim,ctx,k,t);},
  thumbSetup(sim){sim.p.nuc='U238';doDecay(sim);sim.st.dt=0.9;},
  thumbFrames:4
};
const NX=150,NY=196;
function drawDecay(sim,ctx,k,t){const p=sim.p,st=sim.st,n=nucOf(p),d=daughter(n),hon=atLeast('honors'),P=PART[n.mode];
  const anim=st.dstate==='anim',done=st.dstate==='done',u=anim?clamp(st.dt/1.4,0,1):done?1:0;const showD=anim?st.dt>0.25:done;
  const cur=showD?d:{Z:n.Z,A:n.A};let R=drawNucleus(ctx,cur.Z,cur.A,NX,NY,n.mode==='g'&&anim?Math.max(0,1-st.dt):0);
  // label above
  const sym=CL.el(cur.Z).sym+(n.meta&&!showD?'ᵐ':'');notation(ctx,cur.A,cur.Z,sym,NX,NY-R-30,30,showD?PAL['s3']:PAL['cv-ink']);
  txt(ctx,showD?'daughter':'parent',NX,NY+R+24,{s:12*k,w:700,a:'center',c:PAL['cv-soft']});
  // emitted particle
  if(anim||done){const x=lerp(NX+R+10,450,u),y=NY;
    if(n.mode==='a'){[[0,0,1],[9,4,0],[-2,9,1],[7,-6,0]].forEach(q=>ball(ctx,x+q[0]-4,y+q[1]-2,7,q[2]?CL.FILL.proton:CL.FILL.neutron));}
    else if(n.mode==='b-'||n.mode==='b+'){ball(ctx,x,y,6,n.mode==='b-'?CL.FILL.electron:'#3fa7d6');txt(ctx,n.mode==='b-'?'−':'+',x,y+1,{s:11,w:800,a:'center',b:'middle',c:'#222'});}
    else if(n.mode==='g'){wave(ctx,Math.max(NX+R,x-80),x,y,PAL['s5'],7,-t*12);}
    else if(n.mode==='ec'){const ex=lerp(NX+R+60,NX+R*0.3,clamp(st.dt/0.4,0,1));if(st.dt<0.4)ball(ctx,ex,NY-R-10,6,CL.FILL.electron);ctx.fillStyle=PAL['s6'];ctx.globalAlpha=clamp(st.dt-0.4,0,1);ctx.beginPath();ctx.arc(x,y,4,0,6.29);ctx.fill();ctx.globalAlpha=1;}
    if(u>0.15||done){const lab=n.mode==='ec'?'neutrino (ν) escapes':P.name;pill(ctx,lab,clamp(x,80,400),y-34,n.mode==='a'?CL.FILL.proton:n.mode==='g'?'#6c3fc4':n.mode==='ec'?'#0f8b8d':'#8a6a00','#fff',12*k);}}
  if(st.dstate==='parent')pill(ctx,'Press “Decay it”',330,NY,PAL['card2'],PAL['cv-soft'],13*k);
  // equation
  rr(ctx,12,322,466,116,10);ctx.fillStyle=PAL['card'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
  const e=eqTerms(n);equation(ctx,e.t,245,378,Math.min(30,22*k),PAL['cv-ink'],done||anim&&showD?e.hi:undefined);
  if(k<1.4){txt(ctx,'mass numbers: '+e.sumA[0]+' = '+e.sumA[1]+' ✓',245-10,412,{s:12*k,a:'right',c:PAL['cv-soft']});txt(ctx,'atomic numbers: '+e.sumZ[0]+' = '+e.sumZ[1]+' ✓',245+10,412,{s:12*k,c:PAL['cv-soft']});}
  else txt(ctx,'A: '+e.sumA[0]+' = '+e.sumA[1]+'   Z: '+e.sumZ[0]+' = '+e.sumZ[1],245,420,{s:12*k,a:'center',c:PAL['cv-soft']});
  // mini N-Z chart
  const X=494,Y=14,W=294,H=300;rr(ctx,X,Y,W,H,12);ctx.fillStyle=PAL['card'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.stroke();
  const N=n.A-n.Z,z0=n.Z-6,n0=N-8,cw=18,chh=13,gx=X+44,gy=Y+40;txt(ctx,'Where it sits on the N vs Z chart',X+14,Y+24,{s:Math.min(13*k,19),w:700});
  for(let i=0;i<13;i++)for(let j=0;j<17;j++){const Z=z0+i,NN=n0+j;if(Z<1||NN<0)continue;const x=gx+i*cw,y=gy+(16-j)*chh;ctx.fillStyle=stableish(Z,NN)?PAL['cv-ink']:PAL['card2'];ctx.globalAlpha=stableish(Z,NN)?0.8:1;ctx.fillRect(x+1,y+1,cw-2,chh-2);ctx.globalAlpha=1;}
  const cell=(Z,NN)=>[gx+(Z-z0)*cw+cw/2,gy+(16-(NN-n0))*chh+chh/2];const a=cell(n.Z,N),b=cell(d.Z,d.A-d.Z);
  ctx.strokeStyle=PAL['s1'];ctx.lineWidth=3;ctx.strokeRect(a[0]-cw/2,a[1]-chh/2,cw,chh);if(n.mode!=='g'){ctx.strokeStyle=PAL['s3'];ctx.strokeRect(b[0]-cw/2,b[1]-chh/2,cw,chh);
    ctx.strokeStyle=PAL['s1'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.stroke();const ang=Math.atan2(b[1]-a[1],b[0]-a[0]);ctx.fillStyle=PAL['s1'];ctx.beginPath();ctx.moveTo(b[0],b[1]);ctx.lineTo(b[0]-9*Math.cos(ang-0.5),b[1]-9*Math.sin(ang-0.5));ctx.lineTo(b[0]-9*Math.cos(ang+0.5),b[1]-9*Math.sin(ang+0.5));ctx.fill();}
  for(let i=0;i<13;i+=3)txt(ctx,String(z0+i),gx+i*cw+cw/2,gy+17*chh+14,{s:12,a:'center',c:PAL['cv-soft']});for(let j=0;j<17;j+=4)txt(ctx,String(n0+j),gx-6,gy+(16-j)*chh+chh/2,{s:12,a:'right',b:'middle',c:PAL['cv-soft']});
  txt(ctx,'Z (protons) →',gx+13*cw,gy+17*chh+30,{s:12,a:'right',c:PAL['cv-soft']});txt(ctx,'N ↑',X+12,gy-2,{s:12,c:PAL['cv-soft']});
  if(n.Z>83)txt(ctx,'No stable nuclei above Z = 83',X+W/2,gy+8*chh,{s:12*k,w:700,a:'center',c:PAL['s1']});
  // info lines
  let y=Y+H+26;const lh=Math.max(19,16*k);txt(ctx,'Half-life: '+n.half,X+4,y,{s:13*k,w:700});y+=lh;txt(ctx,MODE_NAME[n.mode],X+4,y,{s:13*k,c:PAL['cv-soft']});
  if(k<1.4){y+=lh;const u2=n.use.length>40?n.use.slice(0,38).replace(/\s\S*$/,'')+'…':n.use;txt(ctx,'Used for: '+u2,X+4,y,{s:12*k,c:PAL['cv-soft']});}}
const BARX={paper:270,al:390,lead:500};
function drawShield(sim,ctx,k,t){const p=sim.p,st=sim.st,hon=atLeast('honors');
  ctx.fillStyle=PAL['cv-bench'];ctx.fillRect(0,330,800,120);
  // source
  ctx.fillStyle=PAL['cv-lamp'];rr(ctx,30,186,70,76,8);ctx.fill();ctx.fillStyle=p.rad==='alpha'?CL.FILL.proton:p.rad==='beta'?CL.FILL.electron:'#7b3fe4';ctx.beginPath();ctx.arc(80,224,9,0,6.29);ctx.fill();
  txt(ctx,{alpha:'Am-241',beta:'Sr-90',gamma:'Co-60'}[p.rad],65,284,{s:13*k,w:700,a:'center'});txt(ctx,'source',65,284+16*k,{s:12*k,a:'center',c:PAL['cv-soft']});
  // barriers
  const lw=p.lead?clamp(10+p.pbx*7,14,80):40;
  [['paper','Paper',4],['al','Aluminum 3 mm',10],['lead',hon?'Lead '+p.pbx.toFixed(1)+' cm':'Lead',lw]].forEach(([w,l,th])=>{const x=BARX[w],on=p[w];
    if(on){ctx.fillStyle=w==='paper'?'#f3efe2':w==='al'?'#b9c0c8':'#5f6670';ctx.fillRect(x-2,150,th,170);ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1;ctx.strokeRect(x-2,150,th,170);}
    else{ctx.strokeStyle=PAL['line'];ctx.setLineDash([4,4]);ctx.strokeRect(x-2,150,th,170);ctx.setLineDash([]);}
    txt(ctx,l,x+th/2,140,{s:12*k,w:on?700:400,a:'center',c:on?PAL['cv-ink']:PAL['cv-soft']});});
  // particles
  st.parts.forEach(q=>{const a=q.dead?clamp(1-q.dead/0.5,0,1):1;ctx.globalAlpha=a;if(p.rad==='alpha'){ball(ctx,q.x,q.y,7,CL.FILL.proton);ball(ctx,q.x+5,q.y+4,6,CL.FILL.neutron);}else if(p.rad==='beta'){ball(ctx,q.x,q.y,4.5,CL.FILL.electron);}else wave(ctx,q.x-26,q.x,q.y,PAL['s5'],5,q.ph);ctx.globalAlpha=1;});
  // Geiger counter
  ctx.fillStyle=PAL['cv-lamp'];rr(ctx,662,176,50,96,10);ctx.fill();ctx.fillStyle=st.flash>0?PAL['s3']:'#26302a';ctx.beginPath();ctx.arc(687,198,8,0,6.29);ctx.fill();
  rr(ctx,604,286,180,58,10);ctx.fillStyle=PAL['card'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.stroke();
  const cps=1000*through(p)+0.5;txt(ctx,(cps<10?cps.toFixed(1):Math.round(cps).toLocaleString('en-US'))+' counts/s',694,314,{s:Math.min(16*k,24),w:800,a:'center'});txt(ctx,'Geiger counter',694,334,{s:12*k,a:'center',c:PAL['cv-soft']});
  txt(ctx,p.rad==='alpha'?'α: 2 p⁺ + 2 n⁰, charge 2+':p.rad==='beta'?'β⁻: a fast electron, charge 1−':'γ: a photon, no mass, no charge',18,32,{s:14*k,w:700});
  if(k<1.4)txt(ctx,'Turn barriers on and off with the switches. Watch where the radiation stops.',18,54,{s:12*k,c:PAL['cv-soft']});}
function drawChain(sim,ctx,k,t){const p=sim.p,st=sim.st,C=CHAINS[p.chain],hon=atLeast('honors');
  const z0=80,z1=93,a0=204,a1=240,gx=62,gw=480,gy=34,gh=380,X=Z=>gx+(Z-z0)/(z1-z0)*gw,Y=A=>gy+(a1-A)/(a1-a0)*gh;
  ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;for(let Z=z0;Z<=z1;Z++){ctx.beginPath();ctx.moveTo(X(Z),gy);ctx.lineTo(X(Z),gy+gh);ctx.stroke();if(Z<z1&&(k<1.4||Z%2===0))txt(ctx,CL.el(Z).sym,X(Z),gy+gh+16,{s:12*k,w:700,a:'center',c:PAL['cv-soft']});}
  for(let A=a0;A<=a1;A+=4){ctx.beginPath();ctx.moveTo(gx,Y(A));ctx.lineTo(gx+gw,Y(A));ctx.stroke();txt(ctx,String(A),gx-8,Y(A),{s:12,a:'right',b:'middle',c:PAL['cv-soft']});}
  txt(ctx,'A',gx-30,gy+6,{s:12*k,w:700,c:PAL['cv-soft']});
  const pts=C.steps.map(q=>[X(SYMZ(q[0])),Y(q[1])]);
  for(let i=1;i<C.steps.length;i++){const a=pts[i-1],b=pts[i],done=i<=st.ci,isA=C.steps[i-1][2]==='a';const f=i===st.ci?st.cAnim:1;if(!done)continue;
    const ex=lerp(a[0],b[0],f),ey=lerp(a[1],b[1],f);ctx.strokeStyle=isA?PAL['s1']:PAL['s4'];ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(ex,ey);ctx.stroke();}
  C.steps.forEach((q,i)=>{const [x,y]=pts[i],seen=i<=st.ci,cur=i===st.ci;ctx.globalAlpha=seen?1:0.3;ctx.fillStyle=cur?PAL['rj']:!q[2]?PAL['s3']:PAL['card'];ctx.beginPath();ctx.arc(x,y,15,0,6.29);ctx.fill();ctx.strokeStyle=cur?PAL['rj']:PAL['cv-soft'];ctx.lineWidth=1.5;ctx.stroke();
    txt(ctx,q[0],x,y+1,{s:12,w:800,a:'center',b:'middle',c:cur||!q[2]?'#fff':PAL['cv-ink']});ctx.globalAlpha=1;});
  legend(ctx,gx+8,gy+gh-14,[{label:'α (A − 4, Z − 2)',color:PAL['s1']},{label:'β⁻ (Z + 1)',color:PAL['s4']}]);
  // right panel
  const RX=560,RW=228;rr(ctx,RX,14,RW,422,12);ctx.fillStyle=PAL['card'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.stroke();
  const q=C.steps[st.ci];txt(ctx,C.name,RX+14,40,{s:Math.min(13*k,18),w:700});txt(ctx,'Step '+(st.ci+1)+' of '+C.steps.length,RX+14,40+20*k,{s:12*k,c:PAL['cv-soft']});
  notation(ctx,q[1],SYMZ(q[0]),q[0],RX+RW/2,150,44,PAL['cv-ink']);txt(ctx,q[2]?'half-life '+q[3]:'stable',RX+RW/2,186,{s:13*k,w:700,a:'center',c:q[2]?PAL['cv-soft']:PAL['s3']});
  if(st.ci>0){const pr=C.steps[st.ci-1],m=pr[2];const n={Z:SYMZ(pr[0]),A:pr[1],mode:m};const e=eqTerms(n);txt(ctx,'Last decay',RX+14,236,{s:12*k,w:700,c:PAL['cv-soft']});equation(ctx,e.t,RX+RW/2,282,Math.min(20,15*k),PAL['cv-ink'],e.hi);}
  const na=C.steps.slice(0,st.ci).filter(x=>x[2]==='a').length,nb=C.steps.slice(0,st.ci).filter(x=>x[2]==='b-').length;
  txt(ctx,'α so far: '+na,RX+14,350,{s:14*k,w:700,c:PAL['s1']});txt(ctx,'β⁻ so far: '+nb,RX+14,350+22*k,{s:14*k,w:700,c:PAL['s4']});}
function drawEnergy(sim,ctx,k,t){const p=sim.p,c=rxnCalc(p.rxn),R=RXN[p.rxn];
  // B/A chart
  const gx=60,gy=30,gw=390,gh=330,X=A=>gx+A/250*gw,Y=b=>gy+gh-b/9.5*gh;ctx.strokeStyle=PAL['g-axis'];ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(gx,gy);ctx.lineTo(gx,gy+gh);ctx.lineTo(gx+gw,gy+gh);ctx.stroke();
  [0,2,4,6,8].forEach(b=>txt(ctx,String(b),gx-6,Y(b),{s:12,a:'right',b:'middle',c:PAL['g-axis']}));[0,50,100,150,200,250].forEach(A=>txt(ctx,String(A),X(A),gy+gh+16,{s:12,a:'center',c:PAL['g-axis']}));
  txt(ctx,'Mass number A',gx+gw/2,gy+gh+36,{s:12*k,a:'center',c:PAL['cv-soft']});txt(ctx,'Binding energy per nucleon (MeV)',gx,gy-12,{s:12*k,c:PAL['cv-soft']});
  ctx.strokeStyle=PAL['s2'];ctx.lineWidth=2.5;ctx.beginPath();for(let A=12;A<=250;A+=2){const y=Y(semf(A));A===12?ctx.moveTo(X(A),y):ctx.lineTo(X(A),y);}ctx.stroke();
  BEA.forEach(b=>{ctx.fillStyle=PAL['cv-ink'];ctx.beginPath();ctx.arc(X(b[1]),Y(b[2]),3.5,0,6.29);ctx.fill();});
  const lab=(s,A,dx,dy)=>{const b=BEA.find(x=>x[0]===s);txt(ctx,s,X(A)+dx,Y(b[2])+dy,{s:12*k,w:700,c:PAL['cv-ink'],a:dx<0?'right':'left'});};lab('⁵⁶Fe',56,0,-12);lab('⁴He',4,8,-6);lab('²³⁵U',235,-6,-12);
  const arr=(A1,b1,A2,b2,col)=>{const x1=X(A1),y1=Y(b1),x2=X(A2),y2=Y(b2);ctx.strokeStyle=col;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();const a=Math.atan2(y2-y1,x2-x1);ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(x2,y2);ctx.lineTo(x2-11*Math.cos(a-0.45),y2-11*Math.sin(a-0.45));ctx.lineTo(x2-11*Math.cos(a+0.45),y2-11*Math.sin(a+0.45));ctx.fill();};
  if(p.rxn==='fusion'){arr(2.5,1.9,4,7.0,PAL['s1']);txt(ctx,'fusion',X(10),Y(4.2),{s:13*k,w:800,c:PAL['s1']});}else{arr(235,7.55,145,8.28,PAL['s1']);arr(235,7.55,96,8.48,PAL['s1']);txt(ctx,'fission',X(170),Y(6.9),{s:13*k,w:800,c:PAL['s1']});}
  // right panel
  const RX=472,RW=316;rr(ctx,RX,14,RW,422,12);ctx.fillStyle=PAL['card'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.stroke();txt(ctx,R.name,RX+14,40,{s:Math.min(14*k,19),w:700});
  const term=x=>({A:x[1],Z:x[2],sym:x[0],k:x[4]?String(x[4]):''});const terms=[];R.L.forEach((x,i)=>{if(i)terms.push({op:'+'});terms.push(term(x));});terms.push({op:'→'});R.R.forEach((x,i)=>{if(i)terms.push({op:'+'});terms.push(term(x));});
  equation(ctx,terms,RX+RW/2,100,Math.min(p.rxn==='fission'?17:22,(p.rxn==='fission'?13:16)*k),PAL['cv-ink']);
  let y=148;const lh=Math.max(22,17*k);[['mass before',c.mL.toFixed(6)+' u'],['mass after',c.mR.toFixed(6)+' u'],['mass defect Δm',c.dm.toFixed(6)+' u']].forEach(([a,b],i)=>{txt(ctx,a,RX+16,y,{s:13*k,c:PAL['cv-soft']});txt(ctx,b,RX+RW-16,y,{s:13*k,w:700,a:'right',c:i===2?PAL['rj']:PAL['cv-ink']});y+=lh;});
  y+=10;txt(ctx,'E = Δm c²',RX+16,y,{s:15*k,w:800});y+=lh;txt(ctx,c.dm.toFixed(6)+' u × 931.5 MeV/u',RX+16,y,{s:13*k,c:PAL['cv-soft']});y+=lh+6;
  txt(ctx,'= '+c.Q.toFixed(1)+' MeV',RX+16,y,{s:Math.min(24*k,30),w:800,c:PAL['rj']});y+=lh+14;txt(ctx,CL.sci(c.perkg,'J',3)+' per kg of fuel',RX+16,y,{s:13*k,w:700});
  if(k<1.4)txt(ctx,'gasoline: 4.6 × 10⁷ J per kg',RX+16,y+lh,{s:12*k,c:PAL['cv-soft']});}
NU.controls[0].onChange=syncMode;
BioLab.register(NU);
})();
