(function(){
'use strict';
const {clamp,rr,txt,pill,atLeast,PAL,FONT,RM,axes,legend,serColor,lvText}=BioLab.h;
const CL=window.ChemLab;
const R=8.314;

/* ---------- 2D molecule sketches (px, before scaling) ---------- */
function alkane(n){const a=[],b=[];for(let i=0;i<n;i++){const up=i%2===0,x=(i-(n-1)/2)*22,y=up?-7:7;a.push(['C',x,y]);if(i)b.push([i-1,i]);}
  for(let i=0;i<n;i++){const up=i%2===0,x=a[i][1],y=a[i][2],s=up?-1:1;a.push(['H',x-7,y+s*19]);b.push([i,a.length-1]);a.push(['H',x+7,y+s*19]);b.push([i,a.length-1]);}
  a.push(['H',a[0][1]-19,a[0][2]+4]);b.push([0,a.length-1]);a.push(['H',a[n-1][1]+19,a[n-1][2]+(n%2?4:-4)]);b.push([n-1,a.length-1]);return {a,b};}
const M={
  He:{a:[['He',0,0]],b:[]},
  CH4:{a:[['C',0,0],['H',0,-20],['H',-18,9],['H',18,9],['H',0,20]],b:[[0,1],[0,2],[0,3],[0,4]]},
  HCl:{a:[['H',-17,0],['Cl',9,0]],b:[[0,1]],dip:[1,0],d:0,ac:1},
  F2:{a:[['F',-10,0],['F',10,0]],b:[[0,1]]},Cl2:{a:[['Cl',-12,0],['Cl',12,0]],b:[[0,1]]},Br2:{a:[['Br',-13,0],['Br',13,0]],b:[[0,1]]},I2:{a:[['I',-15,0],['I',15,0]],b:[[0,1]]},
  NH3:{a:[['N',0,0],['H',-18,10],['H',18,10],['H',0,21]],b:[[0,1],[0,2],[0,3]],dip:[0,-1],d:3,ac:0,lp:[[0,-1]]},
  H2O:{a:[['O',0,0],['H',-15,12],['H',15,12]],b:[[0,1],[0,2]],dip:[0,-1],d:1,ac:0,lp:[[-0.6,-0.8],[0.6,-0.8]]},
  CH3OH:{a:[['C',-20,4],['O',2,-6],['H',14,6],['H',-30,-10],['H',-32,14],['H',-14,20]],b:[[0,1],[1,2],[0,3],[0,4],[0,5]],dip:[-0.5,-0.85],d:2,ac:1,lp:[[0.1,-1]]},
  C2H5OH:{a:[['C',-40,4],['C',-18,-6],['O',4,4],['H',16,-6],['H',-52,-8],['H',-50,18],['H',-34,20],['H',-22,-24],['H',-8,-20]],b:[[0,1],[1,2],[2,3],[0,4],[0,5],[0,6],[1,7],[1,8]],dip:[-0.5,0.85],d:3,ac:2,lp:[[0.1,1]]},
  CH3OCH3:{a:[['C',-22,6],['O',0,-5],['C',22,6],['H',-36,-6],['H',-32,22],['H',-20,24],['H',36,-6],['H',32,22],['H',20,24]],b:[[0,1],[1,2],[0,3],[0,4],[0,5],[2,6],[2,7],[2,8]],dip:[0,-1],d:5,ac:1},
  acetone:{a:[['C',0,4],['O',0,-18],['C',-22,16],['C',22,16],['H',-36,4],['H',-30,32],['H',-16,32],['H',36,4],['H',30,32],['H',16,32]],b:[[0,1],[0,2],[0,3],[2,4],[2,5],[2,6],[3,7],[3,8],[3,9]],bo:{0:2},dip:[0,-1],d:6,ac:1},
  C3H8:alkane(3),C6H14:alkane(6),C8H18:alkane(8)};
/* ---------- substance data: CRC Handbook ---------- */
// bp °C, dH = ΔHvap at bp (kJ/mol), M g/mol, e = electrons, mu = dipole moment (D), imf = strongest IMF, rho = liquid density (g/mL), mp °C
const S=[
  {id:'He',f:'He',name:'helium',bp:-268.9,dH:0.0829,M:4.00,e:2,mu:0,imf:'ldf',mp:-272.2},
  {id:'CH4',f:'CH4',name:'methane',bp:-161.5,dH:8.19,M:16.04,e:10,mu:0,imf:'ldf',mp:-182.5},
  {id:'HCl',f:'HCl',name:'hydrogen chloride',bp:-85.1,dH:16.15,M:36.46,e:18,mu:1.08,imf:'dd',mp:-114.2},
  {id:'NH3',f:'NH3',name:'ammonia',bp:-33.3,dH:23.35,M:17.03,e:10,mu:1.47,imf:'hb',mp:-77.7},
  {id:'H2O',f:'H2O',name:'water',bp:100.0,dH:40.65,M:18.02,e:10,mu:1.85,imf:'hb',rho:0.997,mp:0},
  {id:'C2H5OH',f:'C2H5OH',name:'ethanol',bp:78.4,dH:38.56,M:46.07,e:26,mu:1.69,imf:'hb',rho:0.789,mp:-114.1},
  {id:'C8H18',f:'C8H18',name:'octane',bp:125.6,dH:34.41,M:114.23,e:66,mu:0,imf:'ldf',rho:0.703,mp:-56.8},
  {id:'I2',f:'I2',name:'iodine',bp:184.3,dH:41.57,M:253.8,e:106,mu:0,imf:'ldf',rho:4.93,mp:113.7,solid:true},
  {id:'CH3OH',f:'CH3OH',name:'methanol',bp:64.7,dH:35.21,M:32.04,e:18,mu:1.70,imf:'hb',rho:0.792,mp:-97.6,lvl:'honors'},
  {id:'acetone',f:'(CH3)2CO',name:'acetone',bp:56.1,dH:29.1,M:58.08,e:32,mu:2.88,imf:'dd',rho:0.784,mp:-94.7,lvl:'honors'},
  {id:'C6H14',f:'C6H14',name:'hexane',bp:68.7,dH:28.85,M:86.18,e:50,mu:0,imf:'ldf',rho:0.655,mp:-95.3,lvl:'honors'},
  {id:'F2',f:'F2',name:'fluorine',bp:-188.1,dH:6.62,M:38.00,e:18,mu:0,imf:'ldf',mp:-219.7,lvl:'honors'},
  {id:'Cl2',f:'Cl2',name:'chlorine',bp:-34.0,dH:20.41,M:70.90,e:34,mu:0,imf:'ldf',mp:-101.5,lvl:'honors'},
  {id:'Br2',f:'Br2',name:'bromine',bp:58.8,dH:29.96,M:159.8,e:70,mu:0,imf:'ldf',rho:3.10,mp:-7.2,lvl:'honors'},
  {id:'C3H8',f:'C3H8',name:'propane',bp:-42.1,dH:19.04,M:44.10,e:26,mu:0.08,imf:'ldf',mp:-187.7,lvl:'ap'},
  {id:'CH3OCH3',f:'CH3OCH3',name:'dimethyl ether',bp:-24.8,dH:21.51,M:46.07,e:26,mu:1.30,imf:'dd',mp:-141.5,lvl:'ap'}];
const SB={};S.forEach(s=>SB[s.id]=s);
const IMF={ldf:'London dispersion',dd:'Dipole–dipole',hb:'Hydrogen bonding'};
const IMFline={ldf:'London dispersion',dd:'dipole–dipole',hb:'hydrogen bond'};
const fmtF=s=>CL.fmt(s.f);
const fC=c=>(c<0?'−':'')+Math.abs(c).toFixed(c%1?1:0);
const TK=c=>c+273.15;
/* Clausius–Clapeyron anchored at the normal boiling point: ln P = −ΔHvap/R (1/T − 1/Tb), P in atm.
   Iodine below its melting point sublimes: P(25 °C) = 4.0 × 10⁻⁴ atm, ΔHsub = 62.4 kJ/mol. */
function vp(s,T){if(s.solid&&T<s.mp)return 4.0e-4*Math.exp(-62400/R*(1/TK(T)-1/298.15));return Math.exp(-s.dH*1000/R*(1/TK(T)-1/TK(s.bp)));}
const phase=(s,T)=>T>=s.bp?'gas':T<s.mp?'solid':'liquid';
/* evaporation from a shallow dish: rate ∝ P·√M (Hertz–Knudsen), converted to volume; c sets water at 25 °C to about 1 mL per hour */
const RATE_C=0.106;
function evapRate(s,T){if(phase(s,T)==='gas')return 40;const rho=s.rho||1;return RATE_C*vp(s,T)*Math.sqrt(s.M)/rho;}   // mL/min
const allIMF=s=>s.imf==='hb'?'London dispersion, dipole–dipole and hydrogen bonding':s.imf==='dd'?'London dispersion and dipole–dipole':'London dispersion only';

function sync(sim){if(!sim.ui||!sim.ui.sec)return;const mode=sim.p.mode,d=sim.def;
  d.controls.forEach(c=>{if(!c.modes)return;const cid=d.id+'-'+c.id,e=document.getElementById(cid)||document.getElementById(cid+'-l');if(!e)return;const w=e.closest('.ctl');if(w)w.hidden=!atLeast(c.lvl)||!c.modes.includes(mode);});
  d.metrics.forEach(m=>{if(!m.modes)return;const t=sim.ui.tiles[m.id];if(!t)return;const w=t.num.closest('.tile');if(w)w.hidden=!atLeast(m.lvl)||!m.modes.includes(mode);});}
function restart(sim){const st=sim.st;st.vA=1;st.vB=1;st.t0=sim.t;st.hist=[];st.doneA=null;st.doneB=null;}
const opts=S.map(s=>({v:s.id,l:fmtF(s)+'  '+s.name,lvl:s.lvl}));
const colA=()=>PAL['s2'],colB=()=>PAL['s4'];

const IM={
  id:'imf',hash:'imf',apUnit:6,order:3,tab:'Intermolecular forces',kind:'Simulation',prereq:['polarity','states'],next:['phasediagram','dissolve'],
  card:'Compare the forces between molecules, rank boiling points, race two liquids to evaporate, and plot vapor pressure.',
  title:'Intermolecular forces: what holds molecules together',
  lede:{bio:'Molecules attract each other. The stronger the attraction, the more energy it takes to pull them apart, so the higher the boiling point.',
        honors:'Identify the strongest force (London dispersion, dipole–dipole or hydrogen bonding) and explain boiling points and evaporation rates with it.',
        ap:'Use ΔHvap and the Clausius–Clapeyron equation to connect intermolecular forces to vapor pressure.'},
  scale:'Two molecules about 0.3 to 0.5 nm apart; in the race, 1.00 mL of liquid in a shallow dish at room scale.',
  timeScale:2,dtMax:0.05,unit:'min',window:60,sampleDt:0.5,chChange:0.1,chReveal:10,
  controls:[
    {id:'mode',label:'View',type:'seg',def:'pair',lvl:'bio',options:[{v:'pair',l:'Two molecules'},{v:'race',l:'Evaporation race'},{v:'vp',l:'Vapor pressure',lvl:'ap'}],onChange(sim){sync(sim);restart(sim);}},
    {id:'a',label:'Substance A',type:'select',def:'H2O',lvl:'bio',options:opts,onChange:restart},
    {id:'b',label:'Substance B',type:'select',def:'CH4',lvl:'bio',options:opts,onChange:restart},
    {id:'temp',label:'Temperature',type:'range',min:0,max:100,step:1,def:25,unit:' °C',lvl:'bio',modes:['race','vp']},
    {id:'all',label:'List every force present',type:'toggle',def:false,lvl:'honors',modes:['pair']}
  ],
  init(sim){return {vA:1,vB:1,t0:0,hist:[],doneA:null,doneB:null};},
  step(sim,dt){const st=sim.st,p=sim.p;if(p.mode!=='race')return;const A=SB[p.a],B=SB[p.b];
    st.vA=Math.max(0,st.vA-evapRate(A,p.temp)*dt);st.vB=Math.max(0,st.vB-evapRate(B,p.temp)*dt);const el=sim.t-st.t0;
    if(st.vA<=0&&st.doneA===null)st.doneA=el;if(st.vB<=0&&st.doneB===null)st.doneB=el;
    if(!st.hist.length||el-st.hist[st.hist.length-1].t>=0.25){st.hist.push({t:el,a:st.vA,b:st.vB});if(st.hist.length>800)st.hist.splice(0,200);}},
  metrics:[
    {id:'imfA',label:'A: strongest force',unit:'',lvl:'bio',text:true,get:s=>IMF[SB[s.p.a].imf]},
    {id:'imfB',label:'B: strongest force',unit:'',lvl:'bio',text:true,get:s=>IMF[SB[s.p.b].imf]},
    {id:'bpA',label:'A: boiling point',unit:'°C',lvl:'bio',d:1,min:-273,max:200,get:s=>SB[s.p.a].bp},
    {id:'bpB',label:'B: boiling point',unit:'°C',lvl:'bio',d:1,min:-273,max:200,get:s=>SB[s.p.b].bp},
    {id:'volA',label:'A: liquid left',unit:'mL',lvl:'bio',d:2,min:0,max:1,modes:['race'],get:s=>s.st.vA},
    {id:'volB',label:'B: liquid left',unit:'mL',lvl:'bio',d:2,min:0,max:1,modes:['race'],get:s=>s.st.vB},
    {id:'MA',label:'A: molar mass / electrons',unit:'',lvl:'honors',text:true,modes:['pair'],get:s=>{const x=SB[s.p.a];return x.M.toFixed(1)+' g/mol, '+x.e+' e⁻';}},
    {id:'MB',label:'B: molar mass / electrons',unit:'',lvl:'honors',text:true,modes:['pair'],get:s=>{const x=SB[s.p.b];return x.M.toFixed(1)+' g/mol, '+x.e+' e⁻';}},
    {id:'dHA',label:'A: ΔHvap',unit:'kJ/mol',lvl:'honors',d:1,min:0,max:45,get:s=>SB[s.p.a].dH},
    {id:'dHB',label:'B: ΔHvap',unit:'kJ/mol',lvl:'honors',d:1,min:0,max:45,get:s=>SB[s.p.b].dH},
    {id:'pA',label:'A: vapor pressure',unit:'',lvl:'ap',text:true,modes:['race','vp'],get:s=>vpText(SB[s.p.a],s.p.temp)},
    {id:'pB',label:'B: vapor pressure',unit:'',lvl:'ap',text:true,modes:['race','vp'],get:s=>vpText(SB[s.p.b],s.p.temp)},
    {id:'muA',label:'A: dipole moment',unit:'D',lvl:'ap',d:2,min:0,max:3,modes:['pair'],get:s=>SB[s.p.a].mu},
    {id:'muB',label:'B: dipole moment',unit:'D',lvl:'ap',d:2,min:0,max:3,modes:['pair'],get:s=>SB[s.p.b].mu}
  ],
  graphs:[{id:'main',label:'Boiling points, liquid left, or vapor pressure (matches the view)',lvl:'bio',custom:true},{id:'cc',label:'ln P vs 1/T (Clausius–Clapeyron)',lvl:'ap',custom:true}],
  defaultGraph:'main',
  plot(sim,ctx,box,id){const p=sim.p,A=SB[p.a],B=SB[p.b];
    if(id==='cc'){const xs=[1/TK(100),1/TK(0)],pts=s=>{const out=[];for(let T=0;T<=100;T+=2)out.push([1000/TK(T),Math.log(vp(s,T))]);return out;};const pa=pts(A),pb=pts(B);const ys=pa.concat(pb).map(q=>q[1]);
      const ax=axes(ctx,box,{xmin:1000*xs[0],xmax:1000*xs[1],ymin:Math.floor(Math.min(...ys)),ymax:Math.ceil(Math.max(...ys,0)),xl:'1000 / T (1/K)',yl:'ln (P / atm)',xd:2});
      [[pa,colA()],[pb,colB()]].forEach(([q,c])=>{ctx.strokeStyle=c;ctx.lineWidth=2.5;ctx.beginPath();q.forEach((r,i)=>i?ctx.lineTo(ax.X(r[0]),ax.Y(r[1])):ctx.moveTo(ax.X(r[0]),ax.Y(r[1])));ctx.stroke();});
      legend(ctx,box.L+10,box.T+10,[{label:'A: slope = −ΔHvap/R = '+(-A.dH*1000/R).toFixed(0)+' K',color:colA()},{label:'B: '+(-B.dH*1000/R).toFixed(0)+' K',color:colB()}]);return;}
    if(p.mode==='race'){const h=sim.st.hist,tmax=Math.max(10,h.length?h[h.length-1].t*1.1:10);const ax=axes(ctx,box,{xmin:0,xmax:tmax,ymin:0,ymax:1.05,xl:'Time (min)',yl:'Liquid left (mL)',yd:1});
      [['a',colA()],['b',colB()]].forEach(([k,c])=>{ctx.strokeStyle=c;ctx.lineWidth=2.5;ctx.beginPath();h.forEach((r,i)=>i?ctx.lineTo(ax.X(r.t),ax.Y(r[k])):ctx.moveTo(ax.X(r.t),ax.Y(r[k])));ctx.stroke();});
      legend(ctx,box.L+10,box.T+10,[{label:'A: '+fmtF(A),color:colA()},{label:'B: '+fmtF(B),color:colB()}]);return;}
    if(p.mode==='vp'){const ax=axes(ctx,box,{xmin:0,xmax:100,ymin:0,ymax:2,xl:'Temperature (°C)',yl:'Vapor pressure (atm)',yd:1});ctx.save();ctx.beginPath();ctx.rect(box.L,box.T,box.W,box.H);ctx.clip();
      ctx.setLineDash([5,4]);ctx.strokeStyle=PAL['muted'];ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(ax.X(0),ax.Y(1));ctx.lineTo(ax.X(100),ax.Y(1));ctx.stroke();ctx.setLineDash([]);
      [[A,colA()],[B,colB()]].forEach(([s,c])=>{ctx.strokeStyle=c;ctx.lineWidth=2.5;ctx.beginPath();for(let T=0;T<=100;T+=1){const y=Math.min(vp(s,T),3);T?ctx.lineTo(ax.X(T),ax.Y(y)):ctx.moveTo(ax.X(T),ax.Y(y));}ctx.stroke();
        const y=vp(s,p.temp);if(y<2){ctx.fillStyle=c;ctx.beginPath();ctx.arc(ax.X(p.temp),ax.Y(y),5,0,6.29);ctx.fill();}});ctx.restore();
      txt(ctx,'1 atm: normal boiling point',box.L+box.W-6,ax.Y(1)-6,{s:12,c:PAL['muted'],a:'right'});legend(ctx,box.L+10,box.T+10,[{label:'A: '+fmtF(A),color:colA()},{label:'B: '+fmtF(B),color:colB()}]);return;}
    // boiling points ranked
    const list=S.filter(s=>atLeast(s.lvl)).slice().sort((x,y)=>x.bp-y.bp);const ax=axes(ctx,box,{xmin:0,xmax:list.length,ymin:-300,ymax:200,xcats:list.map(s=>fmtF(s)),yl:'Boiling point (°C)'});
    list.forEach((s,i)=>{const x0=ax.X(i+0.2),x1=ax.X(i+0.8);ctx.fillStyle=s.id===p.a?colA():s.id===p.b?colB():PAL['line'];const y0=ax.Y(0),y1=ax.Y(s.bp);ctx.fillRect(x0,Math.min(y0,y1),x1-x0,Math.abs(y1-y0));});},
  narrate(sim){const p=sim.p,A=SB[p.a],B=SB[p.b],hon=atLeast('honors'),ap=atLeast('ap'),FA=CL.html(A.f),FB=CL.html(B.f);
    const hi=A.bp>=B.bp?A:B,lo=hi===A?B:A,Fh=CL.html(hi.f),Fl=CL.html(lo.f);
    if(p.mode==='race'){const T=p.temp,ga=phase(A,T),gb=phase(B,T);
      if(ga==='gas'&&gb==='gas')return 'At '+T+' °C both are above their boiling points, so both boil away at once. Pick liquids such as water, ethanol, octane or hexane.';
      if(ga==='gas'||gb==='gas'){const g=ga==='gas'?A:B;return CL.html(g.f)+' boils at '+fC(g.bp)+' °C, below '+T+' °C, so it boils away at once. Its molecules are held so weakly that room temperature is enough to separate them.';}
      const ra=evapRate(A,T),rb=evapRate(B,T),f=ra>=rb?A:B,s=f===A?B:A;
      let t='<b>'+CL.html(f.f)+' evaporates faster</b>. Its molecules escape the surface more easily, because '+(f.imf!==s.imf?'its strongest force ('+lc(f.imf)+') is weaker than '+CL.html(s.f)+'’s ('+lc(s.imf)+').':f.imf==='hb'?'each of its molecules forms fewer hydrogen bonds (water can form up to four).':'its London forces are weaker.');
      if(f.bp>s.bp&&hon)t+=' Surprise: '+CL.html(f.f)+' has the higher boiling point. A 1 mL sample of it contains far fewer, heavier molecules, so each escape removes more volume. Compare the vapor pressures to see which force is really stronger.';
      return t;}
    if(p.mode==='vp'){const pa=vp(A,p.temp),pb=vp(B,p.temp);return 'At '+p.temp+' °C, '+FA+'’s vapor pressure is '+vpText(A,p.temp)+' and '+FB+'’s is '+vpText(B,p.temp)+'. <b>Weaker intermolecular forces mean more molecules escape</b> into the vapor, so the pressure is higher. A liquid boils when its vapor pressure reaches the outside pressure (1 atm).';}
    if(A.id===B.id)return 'Both panels show '+FA+'. Its strongest force is <b>'+lc(A.imf)+'</b>; pick a different substance B to compare.';
    let t='<b>'+Fh+' boils higher</b> ('+fC(hi.bp)+' °C vs '+fC(lo.bp)+' °C) because '+(hi.imf!==lo.imf&&rank(hi.imf)>rank(lo.imf)?'its molecules are held by '+lc(hi.imf)+', stronger than '+Fl+'’s '+lc(lo.imf)+'.':
      rank(hi.imf)<rank(lo.imf)?'it has many more electrons ('+hi.e+' vs '+lo.e+'), so its London dispersion forces outweigh '+Fl+'’s '+lc(lo.imf)+'.':hi.imf==='dd'&&hi.mu>lo.mu?'it is more polar (dipole moment '+hi.mu.toFixed(2)+' D vs '+lo.mu.toFixed(2)+' D)'+(hi.e>lo.e?' and has more electrons.':'.'):hi.imf==='hb'?'it forms more or stronger hydrogen bonds per molecule'+(hi.e>lo.e?' and has more electrons.':'.'):'it has more electrons ('+hi.e+' vs '+lo.e+') and a bigger surface, so its London forces are stronger.');
    if(hon&&hi.dH>lo.dH)t+=' It takes '+hi.dH.toFixed(1)+' kJ/mol to boil it, vs '+lo.dH.toFixed(1)+' kJ/mol.';
    if(ap&&A.M>40&&B.M>40&&Math.abs(A.M-B.M)<3)t+=' Same molar mass, different forces: the structure decides.';
    return t;},
  tour:[
    {title:'Forces between molecules',text:'Inside each molecule, atoms are held by covalent bonds. Between molecules there are much weaker attractions: intermolecular forces. They decide whether a substance is a gas, a liquid or a solid at room temperature.',focus:[0,40,800,280],speed:1,setup(sim){BioLab.setValues(sim,{mode:'pair',a:'H2O',b:'CH4'});}},
    {title:'London dispersion forces',text:'Methane is nonpolar, but its electron cloud is always shifting. A brief δ− on one molecule pushes the neighbor’s electrons away, making a δ+ that attracts it. Every molecule has these forces.',focus:[400,40,400,280],speed:0.5},
    {title:'Hydrogen bonding',text:'In water, H is bonded to O, which pulls its electron away. The bare δ+ hydrogen is strongly attracted to a lone pair on the next O. Hydrogen bonds are the strongest of the three forces.',focus:[0,40,400,280],speed:1},
    {title:'Boiling point follows the force',text:'Water boils at 100 °C; methane at −161.5 °C. Boiling separates the molecules from each other, not the atoms inside them, so stronger forces mean a higher boiling point.',focus:[0,300,800,150],speed:1},
    {lvl:'honors',title:'Size matters for London forces',text:'I₂ is nonpolar, yet it boils at 184 °C, far above polar HCl (−85 °C). I₂ has 106 electrons; a big electron cloud is easy to distort, so its London forces are strong.',focus:[0,40,800,410],speed:1,setup(sim){BioLab.setValues(sim,{a:'I2',b:'HCl'});}},
    {title:'The evaporation race',text:'Put 1.00 mL of water and of ethanol in two dishes at 25 °C. Ethanol’s molecules escape faster, because water’s hydrogen bonds hold its small molecules more tightly.',focus:[0,0,800,450],speed:1,setup(sim){BioLab.setValues(sim,{mode:'race',a:'H2O',b:'C2H5OH',temp:25});restart(sim);}},
    {lvl:'ap',title:'Vapor pressure',text:'In a closed flask, molecules escape until the vapor pressure is reached. It rises steeply with temperature. Where it hits 1 atm, the liquid boils: the Clausius–Clapeyron equation ties the curve to ΔHvap.',focus:[0,0,800,450],speed:1,setup(sim){BioLab.setValues(sim,{mode:'vp',a:'H2O',b:'C2H5OH',temp:60});}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{mode:'pair',a:'H2O',b:'CH4',temp:25});restart(sim);},
  onChallenge(sim,ch,phase){if(ch&&ch.instant&&ch.set&&phase==='ask'){BioLab.setValues(sim,ch.set);BioLab.refresh(sim);}},
  challenges:[
    {lvl:'bio',instant:true,set:{mode:'pair',a:'CH4',b:'H2O'},q:'Methane (CH₄, 16 g/mol) and water (H₂O, 18 g/mol) have almost the same mass. Which has the higher boiling point?',choices:['Methane','Water','About the same'],correct:1,
     explain:{bio:'Water boils at 100 °C and methane at −161.5 °C. Water molecules hydrogen bond to each other; methane has only weak London forces. Similar mass, very different forces.'}},
    {lvl:'bio',instant:true,set:{mode:'pair',a:'H2O',b:'CH4'},q:'When water boils, what is inside the bubbles?',choices:['Hydrogen gas and oxygen gas','Water vapor: whole H₂O molecules','Air'],correct:1,
     explain:{bio:'Boiling overcomes the attractions between molecules. The covalent O–H bonds inside each molecule stay intact (breaking them takes about 460 kJ/mol, more than ten times ΔHvap).'}},
    {lvl:'bio',q:'1.00 mL of water and 1.00 mL of ethanol sit in open dishes at 25 °C. Which evaporates first?',choices:['Water','Ethanol','They finish together'],correct:1,
     baseline:{mode:'race',a:'H2O',b:'C2H5OH',temp:25},at:0,reveal:8,changeText:'The race is running',watch:'main',
     explain:{bio:'Ethanol is about 5 times faster here. Water’s small molecules each form several strong hydrogen bonds, so fewer of them have enough energy to escape.'}},
    {lvl:'honors',instant:true,set:{mode:'pair',a:'I2',b:'HCl'},q:'I₂ is nonpolar and HCl is polar. Which has the higher boiling point?',choices:['HCl, because dipole–dipole forces beat London forces','I₂, because its large electron cloud gives strong London forces'],correct:1,
     explain:{honors:'I₂ boils at 184 °C, HCl at −85 °C. With 106 electrons, I₂ is very polarizable. London forces grow with the number of electrons and can outweigh dipole–dipole forces.'}},
    {lvl:'honors',instant:true,set:{mode:'pair',a:'CH4',b:'NH3'},q:'Methane has four H atoms. Does it form hydrogen bonds?',choices:['Yes, it has hydrogen','No: H must be bonded to N, O or F'],correct:1,
     explain:{honors:'Hydrogen bonding needs H attached to a very electronegative atom (N, O or F) and a lone pair on a neighbor. C–H bonds are almost nonpolar (ΔEN 0.35), so CH₄ has only London forces. NH₃ does hydrogen bond.'}},
    {lvl:'honors',instant:true,set:{mode:'pair',a:'Cl2',b:'Br2'},q:'Boiling points rise from F₂ (−188 °C) to Cl₂ (−34 °C) to Br₂ (59 °C) to I₂ (184 °C). Why?',choices:['More electrons make the cloud easier to distort, so London forces get stronger','The covalent bonds get stronger','The molecules become polar'],correct:0,
     explain:{honors:'All four are nonpolar with only London forces. Electrons rise from 18 to 106, polarizability rises, and so does the attraction. (The F–F, Cl–Cl, Br–Br, I–I bonds inside the molecules actually get weaker going down the group.)'}},
    {lvl:'honors',q:'Race 1.00 mL of hexane against 1.00 mL of water at 25 °C. Which evaporates first?',choices:['Water, because hexane is heavier','Hexane'],correct:1,
     baseline:{mode:'race',a:'H2O',b:'C6H14',temp:25},at:0,reveal:6,changeText:'The race is running',watch:'main',
     explain:{honors:'Hexane (London forces only) is gone in about 3 minutes, long before water. Water’s hydrogen bonds hold even its small molecules tightly.'}},
    {lvl:'ap',instant:true,set:{mode:'pair',a:'C2H5OH',b:'CH3OCH3'},q:'Ethanol and dimethyl ether are both C₂H₆O (46 g/mol). Why does ethanol boil 103 °C higher?',choices:['Ethanol has an O–H group, so it hydrogen bonds; the ether can only use dipole–dipole forces','Ethanol has more electrons','Dimethyl ether is nonpolar'],correct:0,
     explain:{ap:'Same formula, same number of electrons, similar London forces. Ethanol’s O–H hydrogen can bond to a lone pair on a neighbor’s O; the ether’s H atoms are all on carbon. ΔHvap: 38.6 vs 21.5 kJ/mol.'}},
    {lvl:'ap',q:'Water’s vapor pressure at 20 °C is about 0.02 atm. If you warm it to 40 °C, the vapor pressure…',choices:['about doubles','nearly triples','stays the same'],correct:1,
     baseline:{mode:'vp',a:'H2O',b:'C2H5OH',temp:20},at:0.5,change:{temp:40},changeText:'Warmed from 20 °C to 40 °C',reveal:3,watch:'main',
     explain:{ap:'ln(P₂/P₁) = (ΔHvap/R)(1/T₁ − 1/T₂) = (40,650/8.314)(1/293.15 − 1/313.15) = 1.07, so P₂/P₁ ≈ 2.9. Vapor pressure grows exponentially with temperature.'}},
    {lvl:'ap',instant:true,set:{mode:'vp',a:'H2O',b:'C2H5OH',temp:100},q:'At water’s normal boiling point (100 °C), its vapor pressure is…',choices:['0 atm','1 atm','100 atm'],correct:1,
     explain:{ap:'The normal boiling point is defined as the temperature where vapor pressure equals 1 atm. The model anchors its Clausius–Clapeyron curve there.'}}
  ],
  lab:{bio:'<p><b>Question:</b> How do intermolecular forces affect boiling point and evaporation?</p><ol><li>In Two molecules, record the strongest force and boiling point for all eight substances.</li><li>In Evaporation race, race water against ethanol, then water against octane, at 25 °C. Record the time for each to disappear.</li></ol><p>Rank the forces from weakest to strongest and use your data as evidence.</p>',
       honors:'<p><b>Question:</b> When can London forces beat dipole–dipole forces?</p><ol><li>Compare F₂, Cl₂, Br₂ and I₂. Record electrons and boiling point.</li><li>Compare HCl with Cl₂ and I₂.</li><li>Plot electrons (x) against boiling point (y) for the nonpolar substances.</li></ol><p>Explain the trend with polarizability, then explain why HCl falls off the line.</p>',
       ap:'<p><b>Question:</b> Can you find ΔHvap from vapor-pressure data?</p><ol><li>In Vapor pressure, record P for water at 20, 40, 60, 80 and 100 °C.</li><li>Plot ln P against 1/T (or use the ln P vs 1/T graph).</li><li>Find the slope and calculate ΔHvap = −slope × R.</li></ol><p><b>Claim–evidence–reasoning:</b> Compare your ΔHvap for water and ethanol and explain the difference with hydrogen bonding.</p>'},
  terms:[{t:'Intermolecular force (IMF)',d:'An attraction between molecules. Much weaker than the covalent bonds inside a molecule.'},{t:'London dispersion force',d:'Attraction between temporary dipoles. Present in every substance; stronger with more electrons.'},{t:'Dipole–dipole force',d:'Attraction between the δ+ end of one polar molecule and the δ− end of another.'},{t:'Hydrogen bond',d:'A strong dipole–dipole attraction between H bonded to N, O or F and a lone pair on another N, O or F.'},{t:'Boiling point',d:'The temperature where a liquid’s vapor pressure equals the outside pressure.'},
    {lvl:'honors',t:'Polarizability',d:'How easily an electron cloud is distorted. Larger atoms and molecules are more polarizable.'},{lvl:'honors',t:'ΔHvap',d:'Enthalpy of vaporization: the energy needed to turn 1 mol of liquid into gas.'},
    {lvl:'ap',t:'Vapor pressure',d:'Pressure of the vapor above a liquid in a closed container at equilibrium.'},{lvl:'ap',t:'Clausius–Clapeyron equation',d:'ln(P₂/P₁) = (ΔHvap/R)(1/T₁ − 1/T₂).'}],
  about:'<p>Boiling points, ΔHvap (at the boiling point), dipole moments and densities are CRC Handbook values. Vapor pressure uses the Clausius–Clapeyron equation anchored at P = 1 atm at the normal boiling point, assuming ΔHvap stays constant, so values at 25 °C run 10–60% high (water 0.037 atm vs 0.031 measured). Iodine below its melting point uses its measured sublimation pressure (4 × 10⁻⁴ atm at 25 °C, ΔHsub 62.4 kJ/mol).</p><p>Evaporation rate from an open dish is modeled as proportional to P·√M (the Hertz–Knudsen form), converted to volume with the liquid density, and scaled so 1 mL of water takes about an hour at 25 °C. Real rates also depend on air flow and humidity, but the order matches measured relative evaporation rates: hexane and acetone fastest, then methanol, ethanol, octane, and water slowest.</p><p>The molecule pairs are flat sketches with partial charges; the dashed line marks the strongest attraction. London forces are drawn as a flickering electron cloud. Only the strongest force is labeled, though every substance also has London forces.</p>',
  initVis(sim){sim.vis.esc={a:[],b:[]};},
  draw(sim,ctx,vdt,k,t){const p=sim.p;ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
    if(p.mode==='race')drawRace(sim,ctx,vdt,k,t);else if(p.mode==='vp')drawVP(sim,ctx,vdt,k,t);else drawPairs(sim,ctx,vdt,k,t);},
  thumbSetup(sim){sim.p.a='H2O';sim.p.b='CH4';}
};
const lc=x=>x==='ldf'?'London dispersion':IMF[x].toLowerCase();
const rank=x=>({ldf:0,dd:1,hb:2})[x];
function vpText(s,T){if(phase(s,T)==='gas')return 'above 1 atm (past its boiling point)';const P=vp(s,T);return P>=0.01?(P*760).toFixed(P*760<10?1:0)+' torr ('+P.toFixed(P<0.1?3:2)+' atm)':(P*760).toFixed(2)+' torr';}

/* ---------- two molecules of each substance ---------- */
function placed(id,sc,role){const m=M[id],pts=m.a.map(a=>({s:a[0],x:a[1]*sc,y:a[2]*sc}));
  if(m.dip){const cx=pts.reduce((a,q)=>a+q.x,0)/pts.length,cy=pts.reduce((a,q)=>a+q.y,0)/pts.length;
    // donor (left molecule): its δ+ atom points right; acceptor (right molecule): its body points right, so the δ− atom faces left
    const v=role==='d'?[pts[m.d].x-cx,pts[m.d].y-cy]:[cx-pts[m.ac].x,cy-pts[m.ac].y];const th=-Math.atan2(v[1],v[0]),c=Math.cos(th),s=Math.sin(th);
    pts.forEach(q=>{const x=q.x*c-q.y*s,y=q.x*s+q.y*c;q.x=x;q.y=y;});pts.th=th;}
  return pts;}
function drawPairs(sim,ctx,vdt,k,t){const p=sim.p,hon=atLeast('honors');
  [[p.a,0,colA(),'A'],[p.b,400,colB(),'B']].forEach(([id,x0,col,L])=>{const s=SB[id],m=M[id],sc=1.55;
    ctx.fillStyle=PAL['cv-bg2'];rr(ctx,x0+8,8,384,300,12);ctx.fill();
    txt(ctx,L+': '+fmtF(s),x0+22,36,{s:18*Math.min(k,1.5),w:800,c:col});txt(ctx,s.name,x0+22,36+18*Math.min(k,1.5),{s:13*k,c:PAL['cv-soft']});
    const P1=placed(id,sc,'d'),P2=placed(id,sc,'a');const cx=x0+200,cy=176,wob=RM?0:Math.sin(t*5)*1.5;
    const bb=pts=>{let a=1e9,b=-1e9,c=1e9,d=-1e9;pts.forEach(q=>{a=Math.min(a,q.x);b=Math.max(b,q.x);c=Math.min(c,q.y);d=Math.max(d,q.y);});return {x0:a,x1:b,y0:c,y1:d};};
    let o1,o2,link=null;
    if(m.dip){const d=P1[m.d],a=P2[m.ac],gap=(s.imf==='hb'?58:66)+wob;o1={x:cx-gap/2-d.x,y:cy-d.y};o2={x:cx+gap/2-a.x,y:cy-a.y};link=[d,a];}
    else{const B=bb(P1),w=B.x1-B.x0,h=B.y1-B.y0;if(w>120){o1={x:cx-(B.x0+B.x1)/2,y:cy-h/2-14-(B.y1)+h/2-wob/2};o2={x:o1.x+12,y:cy+18+h/2-B.y0-h/2+wob/2};}else{const g=40+wob;o1={x:cx-g/2-B.x1,y:cy-(B.y0+B.y1)/2};o2={x:cx+g/2-B.x0,y:cy-(B.y0+B.y1)/2};}}
    const mols=[[P1,o1],[P2,o2]];
    // London: flickering electron clouds, the second one induced by the first
    const ph=RM?0.8:Math.sin(t*2.6+(x0?1.3:0));
    mols.forEach(([P,o],i)=>{const B=bb(P),ex=(B.x0+B.x1)/2+o.x,ey=(B.y0+B.y1)/2+o.y,rx=(B.x1-B.x0)/2+20,ry=(B.y1-B.y0)/2+20;const horiz=!(o2.y-o1.y>20);
      const sh=(s.imf==='ldf'?9:3)*ph,gx=horiz?sh:0,gy=horiz?0:sh;const g=ctx.createRadialGradient(ex+gx,ey+gy,4,ex,ey,Math.max(rx,ry));g.addColorStop(0,'rgba(120,140,255,0.32)');g.addColorStop(1,'rgba(120,140,255,0.04)');
      ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(ex+gx*0.6,ey+gy*0.6,rx,ry,0,0,6.29);ctx.fill();});
    if(link){const a=[link[0].x+o1.x,link[0].y+o1.y],b=[link[1].x+o2.x,link[1].y+o2.y];ctx.strokeStyle=col;ctx.lineWidth=3;ctx.setLineDash([5,5]);ctx.beginPath();ctx.moveTo(a[0]+5,a[1]);ctx.lineTo(b[0]-9,b[1]);ctx.stroke();ctx.setLineDash([]);}
    mols.forEach(([P,o])=>{m.b.forEach((bd,j)=>{const a=P[bd[0]],b=P[bd[1]];ctx.strokeStyle='#7d838e';ctx.lineWidth=(m.bo&&m.bo[j]===2)?7:4;ctx.beginPath();ctx.moveTo(a.x+o.x,a.y+o.y);ctx.lineTo(b.x+o.x,b.y+o.y);ctx.stroke();});
      P.forEach(q=>{const r=({H:6,C:10,N:10,O:10,F:9,Cl:13,Br:15,I:17,He:11})[q.s]*1.25;CL.drawAtom(ctx,q.x+o.x,q.y+o.y,r,q.s,{label:q.s==='H'?'':q.s,s:Math.max(11,r*0.9)});});
      if(m.lp)m.lp.forEach(l=>{const c=P[m.ac],th=P.th||0,lx=l[0]*Math.cos(th)-l[1]*Math.sin(th),ly=l[0]*Math.sin(th)+l[1]*Math.cos(th);const px=c.x+o.x+lx*22,py=c.y+o.y+ly*22,nx=-ly*4,ny=lx*4;
        ctx.fillStyle=PAL['cv-ink'];[1,-1].forEach(g=>{ctx.beginPath();ctx.arc(px+nx*g,py+ny*g,2.6,0,6.29);ctx.fill();});});});
    // partial charges
    if(m.dip){[[P1,o1],[P2,o2]].forEach(([P,o])=>{const d=P[m.d],a=P[m.ac];txt(ctx,'δ+',d.x+o.x,d.y+o.y-22,{s:14*k,w:800,a:'center',c:PAL['s2']});txt(ctx,'δ−',a.x+o.x,a.y+o.y+36,{s:14*k,w:800,a:'center',c:PAL['s1']});});}
    else if(Math.abs(ph)>0.55&&s.imf==='ldf'){const B1=bb(P1),B2=bb(P2),horiz=!(o2.y-o1.y>20),sg=ph>0?1:-1;
      if(horiz){txt(ctx,sg>0?'δ−':'δ+',B1.x1+o1.x+4,cy-34,{s:13*k,w:800,a:'center',c:sg>0?PAL['s1']:PAL['s2']});txt(ctx,sg>0?'δ+':'δ−',B2.x0+o2.x-4,cy-34,{s:13*k,w:800,a:'center',c:sg>0?PAL['s2']:PAL['s1']});}
      else{txt(ctx,sg>0?'δ−':'δ+',o1.x+B1.x1+18,B1.y1+o1.y,{s:13*k,w:800,c:sg>0?PAL['s1']:PAL['s2']});txt(ctx,sg>0?'δ+':'δ−',o2.x+B2.x1+18,B2.y0+o2.y+8,{s:13*k,w:800,c:sg>0?PAL['s2']:PAL['s1']});}}
    pill(ctx,IMFline[s.imf],cx,282,col,'#fff',14*k);
    if(hon&&sim.p.all)txt(ctx,allIMF(s),cx,262-12*k,{s:12*k,a:'center',c:PAL['cv-soft']});});
  drawScale(sim,ctx,k);}
function drawScale(sim,ctx,k){const p=sim.p,A=SB[p.a],B=SB[p.b],x0=50,x1=750,y=372,X=c=>x0+(x1-x0)*(c+273.15)/480;
  ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x0,y);ctx.lineTo(x1,y);ctx.stroke();
  [-273,-200,-100,0,100,200].forEach(c=>{ctx.beginPath();ctx.moveTo(X(c),y-5);ctx.lineTo(X(c),y+5);ctx.stroke();txt(ctx,c+'°',X(c),y+22,{s:12*k,a:'center',c:PAL['cv-soft']});});
  ctx.fillStyle=PAL['s3'];ctx.globalAlpha=0.25;ctx.fillRect(X(20),y-14,X(30)-X(20),28);ctx.globalAlpha=1;
  S.filter(s=>atLeast(s.lvl)&&s.id!==A.id&&s.id!==B.id).forEach(s=>{ctx.fillStyle=PAL['line'];ctx.beginPath();ctx.arc(X(s.bp),y,4,0,6.29);ctx.fill();});
  const mk=(s,col,up)=>{ctx.fillStyle=col;ctx.beginPath();ctx.arc(X(s.bp),y,7,0,6.29);ctx.fill();const ly=up?y-26:y+46,lab=fmtF(s)+' '+fC(s.bp)+' °C';
    ctx.font='700 '+(13*k)+'px '+FONT;const w=ctx.measureText(lab).width/2+8;const lx=clamp(X(s.bp),x0+w-40,x1-w+40);pill(ctx,lab,lx,ly,col,'#fff',13*k);};
  mk(A,colA(),true);if(B.id!==A.id)mk(B,colB(),false);
  txt(ctx,'Boiling point',x0-6,y-34,{s:12*k,w:700,c:PAL['cv-soft']});const far=(s,d)=>Math.abs(X(s.bp)-X(25))>d*k;if(far(A,110))txt(ctx,'room temp.',X(25),y-22,{s:12*k,a:'center',c:PAL['s3']});else if(far(B,110))txt(ctx,'room temp.',X(25),y+44,{s:12*k,a:'center',c:PAL['s3']});}

/* ---------- evaporation race ---------- */
function drawRace(sim,ctx,vdt,k,t){const p=sim.p,st=sim.st,v=sim.vis,T=p.temp;
  [[SB[p.a],st.vA,200,colA(),'a','A',st.doneA],[SB[p.b],st.vB,600,colB(),'b','B',st.doneB]].forEach(([s,vol,cx,col,key,L,done])=>{
    const ph=phase(s,T),rate=evapRate(s,T);
    txt(ctx,L+': '+fmtF(s),cx,40,{s:18*Math.min(k,1.5),w:800,a:'center',c:col});txt(ctx,s.name+(ph==='gas'?': a gas at '+T+' °C':ph==='solid'?': a solid at '+T+' °C':''),cx,40+18*Math.min(k,1.5),{s:13*k,a:'center',c:PAL['cv-soft']});
    // dish
    const dy=330,dw=150;ctx.fillStyle=PAL['cv-glass'];ctx.globalAlpha=0.35;ctx.beginPath();ctx.ellipse(cx,dy,dw,24,0,0,Math.PI);ctx.fill();ctx.globalAlpha=1;ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=2.5;ctx.beginPath();ctx.ellipse(cx,dy,dw,24,0,0,Math.PI);ctx.stroke();ctx.beginPath();ctx.ellipse(cx,dy,dw,7,0,0,6.29);ctx.stroke();
    if(vol>0.001){const f=Math.sqrt(vol);ctx.fillStyle=s.id==='Br2'?'rgba(150,40,20,0.85)':s.id==='I2'?'#3b2a4a':col;ctx.globalAlpha=s.id==='I2'||s.id==='Br2'?1:0.55;ctx.beginPath();ctx.ellipse(cx,dy+4,dw*0.85*f,(6+12*vol),0,0,6.29);ctx.fill();ctx.globalAlpha=1;}
    // escaping molecules
    const E=v.esc[key];const spawn=vol>0.001?clamp(Math.log10(rate*1000+1)*6,0,28):0;if(!RM&&vdt>0&&Math.random()<spawn*vdt)E.push({x:cx+(Math.random()-0.5)*dw*1.2*Math.sqrt(vol),y:dy-4,vx:(Math.random()-0.5)*30,vy:-40-Math.random()*40});
    E.forEach(e=>{e.x+=e.vx*vdt;e.y+=e.vy*vdt;});v.esc[key]=E.filter(e=>e.y>90);v.esc[key].forEach(e=>{ctx.fillStyle=col;ctx.globalAlpha=clamp((e.y-90)/150,0,1);ctx.beginPath();ctx.arc(e.x,e.y,4,0,6.29);ctx.fill();});ctx.globalAlpha=1;
    pill(ctx,vol>0.001?vol.toFixed(2)+' mL left':'evaporated'+(done!==null?' in '+fmtT(done):''),cx,384,vol>0.001?PAL['card']:col,vol>0.001?PAL['cv-ink']:'#fff',15*k);
    txt(ctx,ph==='gas'?'boils away at once':lc(s.imf)+', '+(rate<0.001?'< 0.001':rate.toFixed(3))+' mL/min',cx,416,{s:12*k,a:'center',c:PAL['cv-soft']});});
  ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(400,118);ctx.lineTo(400,400);ctx.stroke();
  pill(ctx,T+' °C · '+fmtT(sim.t-st.t0),400,96,PAL['card'],PAL['cv-ink'],13*k);}
const fmtT=m=>m<1?(m*60).toFixed(0)+' s':m<60?m.toFixed(1)+' min':(m/60).toFixed(1)+' h';

/* ---------- vapor pressure in closed flasks ---------- */
function drawVP(sim,ctx,vdt,k,t){const p=sim.p,T=p.temp;
  [[SB[p.a],200,colA(),'A'],[SB[p.b],600,colB(),'B']].forEach(([s,cx,col,L])=>{const P=vp(s,T),ph=phase(s,T);
    txt(ctx,L+': '+fmtF(s),cx,36,{s:18*Math.min(k,1.5),w:800,a:'center',c:col});
    // flask
    ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(cx-18,74);ctx.lineTo(cx-18,130);ctx.lineTo(cx-100,330);ctx.quadraticCurveTo(cx-104,350,cx-84,352);ctx.lineTo(cx+84,352);ctx.quadraticCurveTo(cx+104,350,cx+100,330);ctx.lineTo(cx+18,130);ctx.lineTo(cx+18,74);ctx.stroke();
    ctx.fillStyle=PAL['cv-soft'];rr(ctx,cx-24,62,48,16,4);ctx.fill();
    ctx.save();ctx.beginPath();ctx.moveTo(cx-100,330);ctx.lineTo(cx+100,330);ctx.lineTo(cx+84,352);ctx.lineTo(cx-84,352);ctx.closePath();ctx.fillStyle=col;ctx.globalAlpha=0.5;ctx.fill();ctx.restore();ctx.globalAlpha=1;
    // vapor molecules: count grows with P
    const n=ph==='gas'?60:Math.round(clamp(4+18*Math.log10(1+P*60),1,60));for(let i=0;i<n;i++){const u=(i*0.6180339)%1,w=(i*0.3710+0.13)%1;const yy=140+w*176+(RM?0:Math.sin(t*1.5+i)*6),half=(yy-130)/200*82+12;
      const xx=cx+(2*u-1)*half*0.88+(RM?0:Math.sin(t*2+i*1.3)*5);ctx.fillStyle=col;ctx.beginPath();ctx.arc(xx,yy,3.5,0,6.29);ctx.fill();}
        pill(ctx,ph==='gas'?'above 1 atm (past its bp)':(P*760).toFixed(P*760<10?1:0)+' torr',cx,384,col,'#fff',15*k);
    txt(ctx,'ΔHvap '+s.dH.toFixed(1)+' kJ/mol · bp '+fC(s.bp)+' °C',cx,414,{s:12*k,a:'center',c:PAL['cv-soft']});});
  pill(ctx,T+' °C',400,200,PAL['card'],PAL['cv-ink'],15*k);}

IM.onLevel=function(sim){sync(sim);};
BioLab.register(IM);
})();
