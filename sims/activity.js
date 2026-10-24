(function(){
'use strict';
const {clamp,lerp,rr,txt,pill,atLeast,PAL,FONT,RM,axes,legend,serColor}=BioLab.h;
const CL=window.ChemLab;
const LH=560,ASP=800/560;

/* ---------- metals and solutions ----------
   Whether a metal replaces an ion comes from the standard reduction potentials in ChemLab.E0:
   E°cell = E°(ion being reduced) − E°(metal being oxidized). Positive means the reaction goes. */
const E0=sym=>{const e=CL.E0.find(x=>x.metal===sym);return e?e.E:NaN;};
const MET={Mg:{q:2,col:'#c9ccd1',dep:'#9aa0a6',lvl:'bio'},Zn:{q:2,col:'#9ea7b3',dep:'#4f5761',lvl:'bio'},Fe:{q:2,col:'#6d6e73',dep:'#262628',lvl:'honors'},
  Pb:{q:2,col:'#7a8290',dep:'#3d424a',lvl:'honors'},Cu:{q:2,col:'#c46a37',dep:'#8a3b12',lvl:'bio'},Ag:{q:1,col:'#dfe3e8',dep:'#3a3a3c',lvl:'bio'}};
const ICOL={Mg:'#7f8a96',Zn:'#5f7186',Fe:'#689f38',Pb:'#4f5b66',Cu:'#1976d2',Ag:'#8d99a6'};
Object.keys(MET).forEach(k=>{const m=MET[k];m.k=k;m.icol=ICOL[k];m.name=CL.el(k).name.toLowerCase();m.E=E0(k);m.ion=CL.fmt(k,m.q);m.ionH=CL.html(k,m.q);});
const ROMAN=['','I','II','III'];
const SOLS={Mg:{f:'Mg(NO3)2',ion:'Mg',q:2,col:null,lvl:'bio'},Zn:{f:'Zn(NO3)2',ion:'Zn',q:2,col:null,lvl:'bio'},Fe:{f:'Fe(NO3)2',ion:'Fe',q:2,col:'#b9d88a',lvl:'honors'},
  Pb:{f:'Pb(NO3)2',ion:'Pb',q:2,col:null,lvl:'honors'},Cu:{f:'Cu(NO3)2',ion:'Cu',q:2,col:'#4a9fe0',lvl:'bio'},Ag:{f:'AgNO3',ion:'Ag',q:1,col:null,lvl:'bio'},H:{f:'HCl',ion:'H',q:1,col:null,lvl:'bio'}};
Object.keys(SOLS).forEach(k=>{const s=SOLS[k];s.k=k;s.E=E0(s.ion);s.ionT=CL.fmt(s.ion,s.q);s.ionH=CL.html(s.ion,s.q);s.txt=CL.fmt(s.f);s.html=CL.html(s.f);});
const MORD=['Mg','Zn','Fe','Pb','Cu','Ag'],SORD=['Mg','Zn','Fe','Pb','Cu','Ag','H'];
const gcd=(a,b)=>b?gcd(b,a%b):a;
function rxn(mk,sk){const M=MET[mk],S=SOLS[sk];if(mk===S.ion)return {same:true,go:false,E:0};const E=S.E-M.E,L=M.q*S.q/gcd(M.q,S.q),k=L/M.q,j=L/S.q;
  // H⁺ is reduced in pairs to H₂, so make j even
  let kk=k,jj=j,LL=L;if(sk==='H'&&jj%2){kk*=2;jj*=2;LL*=2;}
  return {E,go:E>0.02,k:kk,j:jj,n:LL,rate:clamp(0.22+E*0.9,0.22,2.4),M,S};}
const co=(c,s)=>(c>1?c:'')+s;
function eqs(mk,sk,html){const r=rxn(mk,sk);if(!r.go)return null;const M=r.M,S=r.S,f=html?CL.html:CL.fmt,fi=html?CL.html:CL.fmt;
  const net=co(r.k,M.k)+'(s) + '+co(r.j,fi(S.ion,S.q))+'(aq) → '+co(r.k,fi(M.k,M.q))+'(aq) + '+(sk==='H'?co(r.j/2,f('H2'))+'(g)':co(r.j,S.ion)+'(s)');
  const msalt=sk==='H'?CL.ionicFormula({f:M.k,q:M.q},{f:'Cl',q:-1}):CL.ionicFormula({f:M.k,q:M.q},{f:'NO3',q:-1});
  const mol=co(r.k,M.k)+'(s) + '+co(r.j,f(S.f))+'(aq) → '+co(r.k,f(msalt))+'(aq) + '+(sk==='H'?co(r.j/2,f('H2'))+'(g)':co(r.j,S.ion)+'(s)');
  const ox=M.k+' → '+fi(M.k,M.q)+' + '+co(M.q,'e⁻'),red=sk==='H'?'2'+fi('H',1)+' + 2e⁻ → '+f('H2'):fi(S.ion,S.q)+' + '+co(S.q,'e⁻')+' → '+S.ion;
  return {net,mol,ox,red,r};}

/* ---------- plate layout ---------- */
function rowsCols(){const hon=atLeast('honors');return {rows:MORD.filter(m=>hon||MET[m].lvl==='bio'),cols:SORD.filter(s=>hon||SOLS[s].lvl==='bio')};}
function plateGeom(){const {rows,cols}=rowsCols();const X0=64,Y0=92,W=376,H=348;const cw=Math.min(58,W/cols.length),ch=Math.min(58,H/rows.length);return {rows,cols,X0,Y0,cw,ch,r:Math.min(cw,ch)*0.38};}
const wkey=(m,s)=>m+'|'+s;
function progress(sim,w){if(!w)return 0;const r=rxn(w.m,w.s);if(!r.go)return clamp((sim.t-w.t0)/2,0,1);return clamp((sim.t-w.t0)*r.rate/6,0,1);}
function testWell(sim,m,s,done){const st=sim.st;st.wells[wkey(m,s)]={m,s,t0:done?sim.t-60:sim.t,pred:sim.p.pred};st.last=wkey(m,s);st.zoom=null;sim.infoDirty=true;}

/* ---------- the activity series students build from their own wells ---------- */
function series(sim){const {rows,cols}=rowsCols(),st=sim.st;const metalCols=cols.filter(c=>c!=='H');
  // a metal joins the ranking once its whole row of metal-ion wells has been tested
  const score={},done=rows.filter(m=>metalCols.every(c=>c===m||st.wells[wkey(m,c)]));done.forEach(m=>{score[m]=metalCols.filter(c=>c!==m&&rxn(m,c).go).length;});
  const order=done.slice().sort((a,b)=>score[b]-score[a]);const hKnown=order.length>0&&order.every(m=>st.wells[wkey(m,'H')]);
  const out=order.slice();if(hKnown){let hAfter=-1;order.forEach((m,i)=>{if(rxn(m,'H').go)hAfter=i;});out.splice(hAfter+1,0,'H');}
  const n=Object.keys(st.wells).length;return {order:out,complete:done.length===rows.length&&hKnown,n,any:order.length>0,partial:done.length};}

/* ---------- zoom: electrons moving from metal atoms to ions ---------- */
const ZX=612,ZY=182,ZR=136,AR=13;
function buildZoom(sim){const st=sim.st,m=sim.p.metal,s=sim.p.sol,key=wkey(m,s),w=st.wells[key];const R=rxn(m,s),M=MET[m],S=SOLS[s];
  const z={key,w,t0:w?w.t0:null,atoms:[],ions:[],ev:[]};
  // two rows of metal atoms along the bottom of the zoom
  [ZY+ZR-30,ZY+ZR-30-2*AR*0.88].forEach((y,ri)=>{const half=Math.sqrt(ZR*ZR-(y-ZY)*(y-ZY))-AR-4;for(let x=ZX-half+(ri?AR:0);x<=ZX+half;x+=2*AR)z.atoms.push({x,y,top:ri===1});});
  const nCat=s==='H'?8:6,nAn=s==='H'?8:6*S.q;let seed=(m.charCodeAt(0)*31+s.charCodeAt(0)*7)%997;const rnd=()=>{seed=(seed*9301+49297)%233280;return seed/233280;};
  const place=()=>{for(let tries=0;tries<30;tries++){const a=rnd()*6.283,d=Math.sqrt(rnd())*(ZR-24),x=ZX+Math.cos(a)*d,y=ZY+Math.sin(a)*d;if(y<ZY+ZR-30-2*AR*1.8-14)return [x,y];}return [ZX,ZY-40];};
  for(let i=0;i<nCat;i++){const [x,y]=place();z.ions.push({hx:x,hy:y,ph:rnd()*6.28,kind:'cat',sym:S.ion,q:S.q,col:s==='H'?'#d22d68':MET[S.ion].icol,r:s==='H'?9:13});}
  for(let i=0;i<nAn;i++){const [x,y]=place();z.ions.push({hx:x,hy:y,ph:rnd()*6.28,kind:'an',sym:s==='H'?'Cl':'NO3',q:-1,col:s==='H'?'#2e9d4a':'#7d8a2e',r:s==='H'?14:14});}
  if(R.go){const tops=z.atoms.filter(a=>a.top).sort((a,b)=>Math.abs(a.x-ZX)-Math.abs(b.x-ZX));const cats=z.ions.filter(q=>q.kind==='cat');const nE=Math.min(4,Math.floor(cats.length/R.j),tops.length);
    const dt=clamp(2.2/R.rate,1.2,5);
    for(let i=0;i<nE;i++){const at=tops[i*2%tops.length]||tops[i];const e={t:1.2+i*dt,atom:at,ions:cats.slice(i*R.j,i*R.j+R.j),k:R.k};at.ev=e;
      e.ions.forEach((q,j)=>{q.ev=e;q.slot=j;q.ap={x:at.x+(j-(R.j-1)/2)*2.4*AR,y:at.y-2*AR-14};q.dep={x:at.x+(j-(R.j-1)/2)*2.05*AR,y:at.y-(R.j===1?0:1.75*AR)};});
      at.rel={x:ZX+((i%2)?1:-1)*(30+i*18),y:ZY-ZR*0.45+i*12};z.ev.push(e);}}
  st.zoom=z;}
const sm=x=>{x=clamp(x,0,1);return x*x*(3-2*x);};
function wander(q,tt){return RM?[q.hx,q.hy]:[q.hx+Math.sin(tt*0.9+q.ph)*9,q.hy+Math.cos(tt*0.7+q.ph*1.3)*7];}

/* ---------- definition ---------- */
const MOPT=MORD.map(m=>({v:m,l:CL.el(m).name+' ('+m+')',lvl:MET[m].lvl==='bio'?undefined:'honors'}));
const SOPT=SORD.map(s=>({v:s,l:SOLS[s].txt+(s==='H'?' (hydrochloric acid)':' ('+SOLS[s].ionT+' ions)'),lvl:SOLS[s].lvl==='bio'?undefined:'honors'}));
const ACT={
  id:'activity',hash:'activity',apUnit:7,order:3,tab:'Activity series',kind:'Virtual lab',prereq:['rxntypes'],next:['galvanic','balance'],
  card:'Drop metals into a well plate of metal-ion solutions and acid, zoom in on the electrons jumping, and build the activity series from your own results.',
  title:'Activity series: which metal wins?',
  lede:{bio:'A more active metal pushes a less active metal out of solution. Drop each metal into each solution, look for a coating or bubbles, and rank the metals from your results.',
        honors:'In every single-replacement reaction one metal is oxidized (loses electrons) and the other is reduced (gains them). Name both, and write the net ionic equation for each well that reacts.',
        ap:'Connect your activity series to standard reduction potentials: E°cell = E°(reduced) − E°(oxidized) is positive for every well that reacts, and ΔG° = −nFE°.'},
  scale:'Each well holds about 1 mL of 0.1 M solution and a small piece of metal. The zoom shows the metal surface about 3 nm across, with water molecules left out.',
  aspect:ASP,timeless:true,animated:true,chChange:0.8,chReveal:6.5,
  controls:[
    {id:'metal',label:'Metal',type:'select',def:'Cu',lvl:'bio',options:MOPT,onChange(sim){sim.st.zoom=null;}},
    {id:'sol',label:'Solution',type:'select',def:'Ag',lvl:'bio',options:SOPT,onChange(sim){sim.st.zoom=null;}},
    {id:'pred',label:'My prediction for this well',type:'seg',def:'none',lvl:'bio',options:[{v:'none',l:'None yet'},{v:'yes',l:'Reaction'},{v:'no',l:'No reaction'}],help:'Predict before you add the metal. The data table records it.'}
  ],
  actions:[
    {id:'test',label:'Add the metal to this well',lvl:'bio',primary:true,run(sim){testWell(sim,sim.p.metal,sim.p.sol);}},
    {id:'row',label:'Test this metal in every solution',lvl:'honors',run(sim){const {cols}=rowsCols();cols.forEach(s=>testWell(sim,sim.p.metal,s));sim.st.last=wkey(sim.p.metal,sim.p.sol);}},
    {id:'all',label:'Fill the whole plate',lvl:'bio',run(sim){const {rows,cols}=rowsCols();rows.forEach(m=>cols.forEach(s=>{if(!sim.st.wells[wkey(m,s)])testWell(sim,m,s,true);}));}},
    {id:'clear',label:'Clean the plate',lvl:'bio',run(sim){sim.st.wells={};sim.st.zoom=null;}}
  ],
  init(){return {wells:{},zoom:null,last:null};},
  step(sim,dt){},
  metrics:[
    {id:'react',label:'This well',unit:'',lvl:'bio',text:true,get:s=>{const w=s.st.wells[wkey(s.p.metal,s.p.sol)],r=rxn(s.p.metal,s.p.sol);if(!w)return 'Not tested yet';if(r.same)return 'Same metal: no change';return r.go?(progress(s,w)<0.15?'Watch…':'Reaction'):'No reaction';}},
    {id:'n',label:'Wells tested',unit:'',lvl:'bio',min:0,max:42,d:0,get:s=>Object.keys(s.st.wells).length},
    {id:'ser',label:'Your activity series (most active first)',unit:'',lvl:'bio',text:true,get:s=>{const r=series(s);return r.any?r.order.join(' > ')+(r.complete?'':' (so far)'):'Finish a full row of wells';}},
    {id:'ox',label:'Oxidized (loses e⁻)',unit:'',lvl:'honors',text:true,get:s=>{const r=rxn(s.p.metal,s.p.sol);return r.go?MET[s.p.metal].k+' → '+MET[s.p.metal].ion:'—';}},
    {id:'red',label:'Reduced (gains e⁻)',unit:'',lvl:'honors',text:true,get:s=>{const r=rxn(s.p.metal,s.p.sol),S=SOLS[s.p.sol];return r.go?(s.p.sol==='H'?'H⁺ → H₂':S.ionT+' → '+S.ion):'—';}},
    {id:'E',label:'E°cell',unit:'V',lvl:'ap',min:-3,max:3,d:2,get:s=>{const r=rxn(s.p.metal,s.p.sol);return r.same?0:r.E;}},
    {id:'G',label:'ΔG°',unit:'kJ',lvl:'ap',min:-500,max:500,d:0,get:s=>{const r=rxn(s.p.metal,s.p.sol);return r.same?0:-(r.n||1)*CL.K.F*r.E/1000;}}
  ],
  graphs:[{id:'ecell',label:'E°cell for this metal in each solution',lvl:'honors',custom:true},{id:'count',label:'Reactions per metal (your wells)',lvl:'bio',custom:true}],defaultGraph:'count',
  plot(sim,ctx,box,id){const {rows,cols}=rowsCols(),st=sim.st;
    if(id==='count'){const vals=rows.map(m=>cols.filter(c=>c!=='H'&&c!==m&&st.wells[wkey(m,c)]&&rxn(m,c).go).length);const ax=axes(ctx,box,{xmin:0,xmax:rows.length,ymin:0,ymax:Math.max(3,cols.length-1),xcats:rows,yl:'metal ions it replaced'});
      vals.forEach((v,i)=>{const x0=ax.X(i+0.2),x1=ax.X(i+0.8);ctx.fillStyle=MET[rows[i]].col;ctx.fillRect(x0,ax.Y(v),x1-x0,ax.Y(0)-ax.Y(v));ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=1;ctx.strokeRect(x0,ax.Y(v),x1-x0,ax.Y(0)-ax.Y(v));txt(ctx,String(v),(x0+x1)/2,ax.Y(v)-5,{s:12,w:700,c:PAL.fg,a:'center'});});
      if(!Object.keys(st.wells).length)txt(ctx,'Test wells to fill this graph.',box.L+box.W/2,box.T+20,{s:13,c:PAL.muted,a:'center'});}
    else{const m=sim.p.metal,cs=cols.filter(c=>c!==m),vals=cs.map(c=>rxn(m,c).E);const ax=axes(ctx,box,{xmin:0,xmax:cs.length,ymin:-3.5,ymax:3.5,xcats:cs.map(c=>SOLS[c].ionT),yl:'E°cell (V)',yd:1});
      vals.forEach((v,i)=>{const x0=ax.X(i+0.22),x1=ax.X(i+0.78);ctx.fillStyle=v>0?serColor(2):serColor(0);ctx.fillRect(x0,Math.min(ax.Y(v),ax.Y(0)),x1-x0,Math.abs(ax.Y(v)-ax.Y(0)));txt(ctx,v.toFixed(2),(x0+x1)/2,v>0?ax.Y(v)-5:ax.Y(v)+14,{s:12,w:700,c:PAL.fg,a:'center'});});
      txt(ctx,MET[m].k+' metal: positive bars react',box.L+box.W/2,box.T+12,{s:13,w:700,c:PAL.muted,a:'center'});}},
  infoPanel(sim){const m=sim.p.metal,s=sim.p.sol,M=MET[m],S=SOLS[s],r=rxn(m,s),w=sim.st.wells[wkey(m,s)],hon=atLeast('honors'),ap=atLeast('ap');
    let h=`<h3>${CL.el(m).name} in ${S.html}</h3>`;
    if(!w)h+='<p>Predict first, then press <b>Add the metal to this well</b>. Look for a coating on the metal, a color change, or bubbles.</p>';
    else{if(w.pred&&w.pred!=='none'){const ok=(w.pred==='yes')===r.go;h+=`<p><b>Your prediction (${w.pred==='yes'?'reaction':'no reaction'}) ${ok?'matched':'did not match'} what happened.</b></p>`;}
      if(r.same)h+='<p>A metal cannot replace its own ion. Nothing changes.</p>';
      else if(r.go){const E=eqs(m,s,true);h+=`<p><b>Observed:</b> ${obs(m,s)}</p><p><b>Net ionic:</b> ${E.net}</p>`;if(hon)h+=`<p><b>Molecular:</b> ${E.mol}</p><p><b>Oxidation:</b> ${E.ox} &nbsp; <b>Reduction:</b> ${E.red}</p><p class="help">The nitrate (or chloride) ions are spectators.</p>`;
        if(ap)h+=`<p class="help">Oxidation numbers: ${m} 0 → +${M.q}; ${s==='H'?'H +1 → 0':S.ion+' +'+S.q+' → 0'}. E°cell = ${S.E.toFixed(2)} − (${M.E.toFixed(2)}) = +${r.E.toFixed(2)} V. ΔG° = −nFE° = −${r.n}(96 485)(${r.E.toFixed(2)}) = ${(-r.n*CL.K.F*r.E/1000).toFixed(0)} kJ.</p>`;}
      else{h+=`<p><b>Observed:</b> no change. ${s==='H'?CL.el(m).name+' is below hydrogen, so it cannot push H⁺ out of the acid.':CL.el(m).name+' is less active than '+CL.el(S.ion).name.toLowerCase()+', so it cannot give its electrons to '+S.ionH+'.'}</p>`;
        if(ap)h+=`<p class="help">E°cell = ${S.E.toFixed(2)} − (${M.E.toFixed(2)}) = ${r.E.toFixed(2)} V. Negative, so the reverse reaction is the spontaneous one.</p>`;}}
    const sr=series(sim);if(sr.any)h+=`<p style="margin-top:8px"><b>Your series so far:</b> ${sr.order.join(' &gt; ')}${sr.complete?' ✓ complete':'. Test more wells to finish it.'}</p>`;
    if(ap)h+='<p class="help">Standard reduction potentials (V): '+SORD.map(k=>(k==='H'?'H⁺/H₂':SOLS[k].ionH+'/'+k)+' '+SOLS[k].E.toFixed(2)).join(', ')+'.</p>';
    return h;},
  narrate(sim){const m=sim.p.metal,s=sim.p.sol,M=MET[m],S=SOLS[s],r=rxn(m,s),w=sim.st.wells[wkey(m,s)],hon=atLeast('honors');const mn=CL.el(m).name,sn=s==='H'?'hydrochloric acid':S.ionT;
    if(r.same)return 'A metal cannot replace its own ions: '+mn.toLowerCase()+' in '+S.ionT+' just sits there.';
    if(!w)return 'Will <b>'+mn.toLowerCase()+'</b> react with '+sn+'? Make a prediction, then add the metal and watch both the well and the zoom.';
    if(!r.go)return '<b>No reaction.</b> '+mn+(s==='H'?' sits below hydrogen in the activity series, so it does not give electrons to H⁺.':' is less active than '+CL.el(S.ion).name.toLowerCase()+', so its atoms hold on to their electrons and the '+S.ionT+' ions stay in solution.');
    if(s==='H')return '<b>'+mn+' is above hydrogen:</b> each '+m+' atom gives 2 electrons to two H⁺ ions, which pair up as H₂ gas bubbles'+(hon?'. '+m+' is oxidized and H⁺ is reduced.':'.');
    return '<b>'+mn+' is more active than '+CL.el(S.ion).name.toLowerCase()+'.</b> '+(r.k>1?r.k+' '+m+' atoms':'Each '+m+' atom')+' gives '+r.n+' electron'+(r.n>1?'s':'')+' to '+(r.j>1?r.j+' '+S.ionT+' ions':'one '+S.ionT+' ion')+', which become '+S.ion+' metal on the surface'+(hon?'. '+m+' is oxidized; '+S.ionT+' is reduced.':'. The '+m+' atoms leave as '+M.ion+' ions.');},
  tour:[
    {title:'A well plate',text:'Each row is one metal. Each column is one solution: metal ions in water, plus hydrochloric acid on the right. Every well is one test.',focus:()=>{const g=plateGeom();return [g.X0-56,g.Y0-48,g.cols.length*g.cw+64,g.rows.length*g.ch+54];},pause:true,setup(sim){sim.st.wells={};BioLab.setValues(sim,{metal:'Cu',sol:'Ag'});}},
    {title:'Copper in silver nitrate',text:'Drop copper into AgNO₃. Gray, fuzzy silver crystals grow on the copper and the liquid slowly turns blue.',focus:()=>{const g=plateGeom(),i=g.rows.indexOf('Cu'),j=g.cols.indexOf('Ag');return [g.X0+j*g.cw-4,g.Y0+i*g.ch-4,g.cw+8,g.ch+8];},speed:1,setup(sim){testWell(sim,'Cu','Ag');}},
    {title:'Zoom in: electrons move',text:'Each copper atom gives 2 electrons (yellow) to 2 silver ions. The silver ions become silver atoms on the surface, and the copper atom leaves as a blue Cu²⁺ ion.',focus:[ZX-ZR-6,ZY-ZR-6,2*ZR+12,2*ZR+12],speed:1},
    {title:'A metal that loses',text:'Now copper in zinc nitrate. Zn²⁺ ions bump into the copper, but nothing happens: copper is less active than zinc.',focus:[ZX-ZR-6,ZY-ZR-6,2*ZR+12,2*ZR+12],speed:1,setup(sim){BioLab.setValues(sim,{metal:'Cu',sol:'Zn'});testWell(sim,'Cu','Zn');}},
    {title:'Metals in acid',text:'Zinc in hydrochloric acid fizzes. Zinc gives electrons to H⁺ ions, which pair up as H₂ gas. Metals above hydrogen do this; copper and silver do not.',focus:[ZX-ZR-6,ZY-ZR-6,2*ZR+12,2*ZR+12],speed:1,setup(sim){BioLab.setValues(sim,{metal:'Zn',sol:'H'});testWell(sim,'Zn','H');}},
    {title:'Build the series',text:'Fill the plate and count how many ions each metal replaces. The metal that wins the most is the most active. Your ranking appears under the zoom.',focus:[8,8,784,484],pause:true,setup(sim){const {rows,cols}=rowsCols();rows.forEach(m=>cols.forEach(s=>{if(!sim.st.wells[wkey(m,s)])testWell(sim,m,s,true);}));}},
    {lvl:'honors',title:'Oxidized and reduced',text:'In every reacting well the metal atom is oxidized (loses electrons, oxidation number goes up) and the metal ion is reduced (gains electrons). Remember: LEO the lion says GER.',focus:[ZX-ZR-6,ZY+ZR+4,2*ZR+12,70],pause:true,setup(sim){BioLab.setValues(sim,{metal:'Zn',sol:'Cu'});testWell(sim,'Zn','Cu');}},
    {lvl:'ap',title:'The series is E°',text:'The activity series is the list of standard reduction potentials turned upside down. Zn in Cu²⁺: E°cell = 0.34 − (−0.76) = +1.10 V, the same voltage as a zinc–copper galvanic cell.',focus:[ZX-ZR-6,ZY+ZR+4,2*ZR+12,70],pause:true}
  ],
  onTourExit(sim){sim.st.wells={};sim.st.zoom=null;BioLab.setValues(sim,{metal:'Cu',sol:'Ag'});},
  onChallenge(sim,ch,phase){if(ch&&ch.instant&&ch.set&&phase==='done'){BioLab.setValues(sim,ch.set);if(ch.fill){const {rows,cols}=rowsCols();rows.forEach(m=>cols.forEach(s=>testWell(sim,m,s,true)));}else testWell(sim,ch.set.metal,ch.set.sol,true);}},
  challenges:[
    {lvl:'bio',q:'You drop copper wire into silver nitrate solution. What do you see?',choices:['Gray silver crystals grow on the copper and the liquid turns blue','The copper dissolves completely and nothing else happens','Nothing: metals do not react with solutions'],correct:0,
     baseline:{metal:'Cu',sol:'Ag'},changeAction:'test',changeText:'Copper added to AgNO₃',watch:'count',
     explain:{bio:'Copper is more active than silver, so copper atoms give electrons to Ag⁺ ions. Silver metal coats the wire and the new Cu²⁺ ions turn the solution blue.'}},
    {lvl:'bio',q:'You drop a strip of silver into copper(II) nitrate. What happens?',choices:['Copper coats the silver','The blue color fades','Nothing happens'],correct:2,
     baseline:{metal:'Ag',sol:'Cu'},changeAction:'test',changeText:'Silver added to Cu(NO₃)₂',watch:'count',
     explain:{bio:'Silver is less active than copper, so it cannot push copper out of solution. A reaction that works one way (Cu + Ag⁺) does not work in reverse.'}},
    {lvl:'bio',q:'Which metal fizzes in hydrochloric acid?',choices:['Copper','Silver','Zinc'],correct:2,
     baseline:{metal:'Zn',sol:'H'},changeAction:'test',changeText:'Zinc added to HCl',watch:'count',
     explain:{bio:'Zinc is above hydrogen in the activity series. It gives electrons to H⁺ ions, which bubble off as hydrogen gas. Copper and silver are below hydrogen and stay shiny.'}},
    {lvl:'honors',instant:true,set:{metal:'Zn',sol:'Cu'},q:'Zinc metal goes into Cu²⁺ solution and turns red-brown. Which is oxidized?',choices:['Cu²⁺, because it changes','Zn, because it loses electrons','The nitrate ion'],correct:1,
     explain:{honors:'Zn → Zn²⁺ + 2e⁻ is oxidation (loss of electrons, oxidation number 0 → +2). Cu²⁺ + 2e⁻ → Cu is reduction. The model now shows that well; check the Oxidized and Reduced readouts.'}},
    {lvl:'honors',q:'Iron is placed in lead(II) nitrate. Does iron replace lead?',choices:['Yes: dark lead forms on the iron','No: lead is more active'],correct:0,
     baseline:{metal:'Fe',sol:'Pb'},changeAction:'test',changeText:'Iron added to Pb(NO₃)₂',watch:'count',
     explain:{honors:'Iron sits above lead in the activity series: Fe(s) + Pb²⁺(aq) → Fe²⁺(aq) + Pb(s). The reaction is slow because the two metals are close together in the series.'}},
    {lvl:'honors',instant:true,set:{metal:'Mg',sol:'Ag'},fill:true,q:'Your full plate is filled. Which metal reacted in the most wells?',choices:['Silver','Copper','Magnesium','Lead'],correct:2,
     explain:{honors:'Magnesium replaced every other metal ion and fizzed in acid, so it is the most active metal on the plate. The model has filled the plate: check the Reactions per metal graph and your series readout.'}},
    {lvl:'ap',instant:true,set:{metal:'Cu',sol:'Ag'},q:'For Cu(s) + 2Ag⁺(aq) → Cu²⁺(aq) + 2Ag(s), E°(Ag⁺/Ag) = +0.80 V and E°(Cu²⁺/Cu) = +0.34 V. What is E°cell?',choices:['+1.14 V','+0.46 V','−0.46 V','+1.26 V (0.80 × 2 − 0.34)'],correct:1,
     explain:{ap:'E°cell = E°(cathode, reduced) − E°(anode, oxidized) = 0.80 − 0.34 = +0.46 V. Do not multiply E° by the coefficient 2: potential is an intensive property. ΔG° = −nFE° = −2(96 485)(0.46) ≈ −89 kJ.'}},
    {lvl:'ap',q:'Lead is just below iron in the series and just above hydrogen. In 1 M HCl, what does lead do?',choices:['Fizzes as fast as zinc','Reacts very slowly: E°cell is only +0.13 V','Nothing, because lead is below hydrogen'],correct:1,
     baseline:{metal:'Pb',sol:'H'},changeAction:'test',changeText:'Lead added to HCl',watch:'ecell',
     explain:{ap:'E°cell = 0 − (−0.13) = +0.13 V, so the reaction is spontaneous but has little driving force. In real labs it is slower still, because insoluble PbCl₂ coats the lead. Spontaneous does not mean fast.'}}
  ],
  lab:{bio:'<p><b>Question:</b> Which metal is the most active?</p><ol><li>Choose a metal and a solution. Set your prediction, then add the metal.</li><li>Record a trial for each well: reaction or no reaction, and what you saw.</li><li>Test every metal in every solution.</li></ol><p>Rank the metals from most to least active and explain how your data supports the order.</p>',
       honors:'<p><b>Question:</b> How can you predict a single-replacement reaction?</p><ol><li>Fill the plate one row at a time. Record a trial for each reacting well.</li><li>For each reaction, write the net ionic equation and label what is oxidized and what is reduced.</li><li>Compare your series with the one in your textbook.</li></ol><p>Predict whether nickel would react with Cu²⁺ and with Zn²⁺, and justify your answer.</p>',
       ap:'<p><b>Question:</b> How does the activity series follow from standard reduction potentials?</p><ol><li>For one metal, record E°cell and ΔG° in every solution.</li><li>Plot E°cell for each well and mark which wells reacted.</li><li>Find the sign rule that separates reacting from non-reacting wells.</li></ol><p><b>Claim–evidence–reasoning:</b> Explain why lead reacts with HCl so slowly even though E°cell is positive.</p>'},
  terms:[{t:'Single replacement',d:'A + BC → AC + B: a more active element replaces a less active one in a compound.'},{t:'Activity series',d:'A list of metals from most to least reactive. A metal can replace the ions of any metal below it.'},{t:'Evidence of reaction',d:'A coating forms, the solution changes color, or gas bubbles appear.'},
    {lvl:'honors',t:'Oxidation',d:'Loss of electrons. The metal atom becomes a positive ion.'},{lvl:'honors',t:'Reduction',d:'Gain of electrons. The metal ion becomes a neutral atom.'},{lvl:'honors',t:'Spectator ion',d:'An ion that does not change, such as NO₃⁻ here.'},
    {lvl:'ap',t:'Standard reduction potential (E°)',d:'The tendency of a species to gain electrons, in volts, measured against hydrogen (0.00 V).'},{lvl:'ap',t:'E°cell',d:'E°(reduced) − E°(oxidized). Positive E°cell means a spontaneous reaction.'},{lvl:'ap',t:'ΔG° = −nFE°',d:'Links cell potential to free energy. n is moles of electrons and F = 96 485 C/mol.'}],
  about:'<p>Every result comes from the standard reduction potentials in ChemLab (25 °C): a well reacts when E°cell = E°(ion) − E°(metal) is positive, and the reaction speed in the animation grows with E°cell. This reproduces the textbook activity series Mg > Zn > Fe > Pb > H > Cu > Ag.</p><p>Simplifications: real rates also depend on surface area, oxide coatings and concentration, and lead reacts with HCl even more slowly than shown because PbCl₂ coats it. Iron is shown forming Fe²⁺. The zoom shows a few events; a real well has about 10²⁰ ions. Colors: Cu²⁺ blue, Fe²⁺ pale green, copper deposits red-brown, silver deposits gray-black crystals.</p><p>Safety: silver nitrate stains skin and HCl is corrosive. Wear goggles and gloves and put the metal waste in the labeled container.</p>',
  initVis(sim){sim.vis={};},
  onClick(sim,x,y){const g=plateGeom();const j=Math.floor((x-g.X0)/g.cw),i=Math.floor((y-g.Y0)/g.ch);if(i<0||j<0||i>=g.rows.length||j>=g.cols.length)return;
    BioLab.setValues(sim,{metal:g.rows[i],sol:g.cols[j]});if(!sim.st.wells[wkey(g.rows[i],g.cols[j])])testWell(sim,g.rows[i],g.cols[j]);},
  thumbSetup(sim){const {rows,cols}=rowsCols();rows.forEach(m=>cols.forEach(s=>testWell(sim,m,s,true)));testWell(sim,'Cu','Ag');sim.t=3;},
  draw(sim,ctx,vdt,k,t){const st=sim.st,p=sim.p,hon=atLeast('honors'),ap=atLeast('ap'),g=plateGeom();
    ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,LH);
    // plate
    txt(ctx,'Well plate',16,26,{s:14*k,w:700});if(k<1.3)txt(ctx,'Click a well to test it',g.X0+g.cols.length*g.cw,26,{s:12*k,c:PAL['cv-soft'],a:'right'});
    ctx.fillStyle=PAL['cv-bg2'];rr(ctx,g.X0-8,g.Y0-8,g.cols.length*g.cw+16,g.rows.length*g.ch+16,14);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1.5;ctx.stroke();
    ctx.font='700 '+12.5*k+'px '+FONT;const stag=g.cols.some(s=>ctx.measureText(s==='H'?'HCl':SOLS[s].ionT).width>g.cw-6);
    g.cols.forEach((s,j)=>txt(ctx,s==='H'?'HCl':SOLS[s].ionT,g.X0+(j+0.5)*g.cw,g.Y0-14-(stag&&j%2?15*k:0),{s:12.5*k,w:700,a:'center',c:s==='H'?PAL['cv-h']:PAL['cv-ink']}));
    g.rows.forEach((m,i)=>txt(ctx,m,g.X0-14,g.Y0+(i+0.5)*g.ch,{s:14*k,w:800,a:'right',b:'middle'}));
    g.rows.forEach((m,i)=>g.cols.forEach((s,j)=>{const cx=g.X0+(j+0.5)*g.cw,cy=g.Y0+(i+0.5)*g.ch,w=st.wells[wkey(m,s)];drawWell(ctx,sim,cx,cy,g.r,m,s,w,t);
      if(m===p.metal&&s===p.sol){ctx.strokeStyle=PAL['s2'];ctx.lineWidth=3;ctx.beginPath();ctx.arc(cx,cy,g.r+5,0,6.29);ctx.stroke();}}));
    // zoom
    const key=wkey(p.metal,p.sol),w=st.wells[key];if(!st.zoom||st.zoom.key!==key||st.zoom.w!==w)buildZoom(sim);const z=st.zoom;
    const i0=g.rows.indexOf(p.metal),j0=g.cols.indexOf(p.sol);
    if(i0>=0&&j0>=0){const sx=g.X0+(j0+0.5)*g.cw,sy=g.Y0+(i0+0.5)*g.ch;ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=1.2;ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(sx+g.r*0.7,sy-g.r*0.7);ctx.lineTo(ZX-ZR*0.7,ZY-ZR*0.71);ctx.moveTo(sx+g.r*0.7,sy+g.r*0.7);ctx.lineTo(ZX-ZR*0.7,ZY+ZR*0.71);ctx.stroke();ctx.setLineDash([]);}
    txt(ctx,'Zoom: '+p.metal+' surface in '+(p.sol==='H'?'HCl':SOLS[p.sol].ionT),ZX,ZY-ZR-12,{s:13*k,w:700,a:'center'});
    drawZoom(ctx,sim,z,k);
    // captions under the zoom
    const r=rxn(p.metal,p.sol),M=MET[p.metal],S=SOLS[p.sol],cy0=ZY+ZR+24*k;
    if(r.same)txt(ctx,'Same metal as the ion: no change',ZX,cy0,{s:13*k,w:700,a:'center',c:PAL['cv-soft']});
    else if(!w)txt(ctx,'Not tested yet',ZX,cy0,{s:13*k,w:700,a:'center',c:PAL['cv-soft']});
    else if(r.go){if(hon){txt(ctx,'Oxidized: '+M.k+' → '+M.ion+' + '+co(M.q,'e⁻'),ZX,cy0,{s:13*k,w:700,a:'center',c:PAL['s1']});
        txt(ctx,'Reduced: '+(p.sol==='H'?'2H⁺ + 2e⁻ → H₂':S.ionT+' + '+co(S.q,'e⁻')+' → '+S.ion),ZX,cy0+18*k,{s:13*k,w:700,a:'center',c:PAL['s2']});}
      else{txt(ctx,M.k+' atoms give electrons to '+(p.sol==='H'?'H⁺':S.ionT),ZX,cy0,{s:13*k,w:700,a:'center',c:PAL['s3']});txt(ctx,'Reaction: '+M.k+' is more active',ZX,cy0+18*k,{s:13*k,w:700,a:'center',c:PAL['cv-soft']});}}
    else txt(ctx,'No reaction: '+M.k+' is less active than '+(p.sol==='H'?'H':S.ion),ZX,cy0,{s:13*k,w:700,a:'center',c:PAL['cv-soft']});
    // series chips
    const sr=series(sim),sy=LH-24-14*k*1.7-24*k;{const lab=sr.any?(sr.complete?'Your activity series:':'Your series so far:'):'Your activity series: finish a full row of wells to start it';txt(ctx,lab,16,sy+2,{s:13*k,w:700,b:'middle',c:PAL['cv-soft']});}
    if(sr.any){ctx.font='700 '+13*k+'px '+FONT;const lw=ctx.measureText(sr.complete?'Your activity series:':'Your series so far:').width+16+16*k;
      ctx.font='800 '+13*k+'px '+FONT;const ws=sr.order.map(s=>ctx.measureText(s).width+12*k),gap=12*k,tot=ws.reduce((a,b)=>a+b,0)+gap*(ws.length-1);let x=lw;
      sr.order.forEach((s,i)=>{const fill=s==='H'?'#c2185b':MET[s].col;pill(ctx,s,x+ws[i]/2,sy+2,fill,CL.inkOn(fill),13*k);x+=ws[i];if(i<ws.length-1){txt(ctx,'›',x+gap/2,sy+3,{s:14*k,w:800,a:'center',b:'middle',c:PAL['cv-soft']});x+=gap;}});}
    // equation band
    let eq='';if(w&&r.go&&progress(sim,w)>0.12){const E=eqs(p.metal,p.sol,false);eq=(hon?'Net ionic: ':'')+E.net;}else if(w&&!r.same&&!r.go)eq=M.k+'(s) + '+(p.sol==='H'?'H⁺':S.ionT)+'(aq) → no reaction (NR)';else if(!w)eq='Predict: will '+CL.el(p.metal).name.toLowerCase()+' replace '+(p.sol==='H'?'hydrogen':CL.el(S.ion).name.toLowerCase())+'?';
    if(eq){let fs=14*k;ctx.font='700 '+fs+'px '+FONT;const ww=ctx.measureText(eq).width;if(ww>770)fs*=770/ww;ctx.fillStyle=PAL['card'];rr(ctx,8,LH-12-fs*1.7,784,fs*1.7,8);ctx.fill();txt(ctx,eq,400,LH-12-fs*0.85,{s:fs,w:700,a:'center',b:'middle'});}
  }
};
function obs(m,s){const M=MET[m],S=SOLS[s],r=rxn(m,s);if(!r.go)return 'no change';if(s==='H')return r.E>0.5?'fast bubbling as H₂ gas forms':r.E>0.3?'steady bubbles of H₂ gas':'very slow, a few tiny bubbles';
  const dep={Cu:'red-brown copper',Ag:'gray-black silver crystals',Pb:'dark gray lead',Fe:'black iron',Zn:'dark gray zinc'}[S.ion]||'a dark coating';
  let c=dep+' coat the '+CL.el(m).name.toLowerCase();if(S.ion==='Cu')c+=' and the blue color fades';if(m==='Cu')c+=' and the solution turns blue';if(m==='Fe')c+=' and the solution turns pale green';return c+(r.E<0.35?' (slowly)':'');}
function drawWell(ctx,sim,cx,cy,r,m,s,w,t){const S=SOLS[s],M=MET[m],R=rxn(m,s),pr=progress(sim,w);
  let liq=S.col||PAL['cv-water'];
  ctx.fillStyle=PAL['card'];ctx.beginPath();ctx.arc(cx,cy,r+2,0,6.29);ctx.fill();
  ctx.fillStyle=liq;ctx.beginPath();ctx.arc(cx,cy,r,0,6.29);ctx.fill();
  if(w&&R.go){const add=m==='Cu'?'#4a9fe0':m==='Fe'?'#b9d88a':null;if(S.col){ctx.globalAlpha=pr*0.75;ctx.fillStyle=PAL['cv-water'];ctx.beginPath();ctx.arc(cx,cy,r,0,6.29);ctx.fill();}
    if(add){ctx.globalAlpha=pr*0.7;ctx.fillStyle=add;ctx.beginPath();ctx.arc(cx,cy,r,0,6.29);ctx.fill();}ctx.globalAlpha=1;}
  ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(cx,cy,r,0,6.29);ctx.stroke();
  if(!w)return;
  // metal piece
  ctx.save();ctx.translate(cx,cy+r*0.15);ctx.rotate(-0.35);const pw=r*1.15,ph=r*0.42;ctx.fillStyle=M.col;rr(ctx,-pw/2,-ph/2,pw,ph,2);ctx.fill();ctx.strokeStyle='rgba(0,0,0,.35)';ctx.lineWidth=1;ctx.stroke();
  if(R.go&&s!=='H'){const D=MET[S.ion].dep;ctx.globalAlpha=clamp(pr*1.3,0,1);ctx.fillStyle=D;rr(ctx,-pw/2,-ph/2,pw,ph,2);ctx.fill();
    const n=Math.round(pr*10);for(let i=0;i<n;i++){const a=i*2.4,dx=Math.cos(a)*pw*0.42,dy=Math.sin(a*1.7)*ph*0.9;ctx.beginPath();ctx.arc(dx,dy+(i%2?-ph*0.5:ph*0.5),S.ion==='Ag'?2.6:1.8,0,6.29);ctx.fill();}ctx.globalAlpha=1;}
  ctx.restore();
  if(R.go&&s==='H'&&pr<1&&!RM){const n=Math.round(2+R.rate*4);ctx.strokeStyle=PAL['cv-bstroke'];ctx.lineWidth=1;for(let i=0;i<n;i++){const ph2=((t*R.rate*0.8+i/n)%1);ctx.beginPath();ctx.arc(cx-r*0.4+((i*7)%10)/10*r*0.8,cy+r*0.1-ph2*r*0.9,1.6+ph2,0,6.29);ctx.stroke();}}
  if(R.go&&s==='H'&&pr>=1){ctx.strokeStyle=PAL['cv-bstroke'];ctx.lineWidth=1;ctx.beginPath();ctx.arc(cx+r*0.35,cy-r*0.35,2,0,6.29);ctx.stroke();}}
function ionLabel(ctx,x,y,r,col,lab){CL.drawAtom(ctx,x,y,r,'X',{color:col,label:''});ctx.font='700 '+Math.min(r*0.9,12)+'px '+FONT;const w=ctx.measureText(lab).width,fs=Math.min(r*0.9,12)*Math.min(1,(2*r-3)/w);txt(ctx,lab,x,y+1,{s:fs,w:700,a:'center',b:'middle',c:CL.inkOn(col)});}
function drawZoom(ctx,sim,z,k){const M=MET[sim.p.metal],S=SOLS[sim.p.sol],R=rxn(sim.p.metal,sim.p.sol);const T=z.t0===null?-1:sim.t-z.t0,tt=sim.t;
  ctx.save();ctx.beginPath();ctx.arc(ZX,ZY,ZR,0,6.29);ctx.fillStyle=S.col?S.col:PAL['cv-sol'];ctx.globalAlpha=S.col?0.35:1;ctx.fill();ctx.globalAlpha=1;ctx.clip();
  if(!S.col){}else{ctx.fillStyle=PAL['cv-sol'];ctx.globalAlpha=0.55;ctx.fillRect(ZX-ZR,ZY-ZR,2*ZR,2*ZR);ctx.globalAlpha=1;}
  const ME=M.k,ion=(x,y,c,l,r)=>ionLabel(ctx,x,y,r,c,l);
  // metal surface
  if(z.t0!==null)z.atoms.forEach(a=>{const e=a.ev;if(e&&T>e.t+0.6){const f=sm((T-e.t-0.6)/1.6);const x=lerp(a.x,a.rel.x,f),y=lerp(a.y,a.rel.y,f);const wob=RM?0:Math.sin(tt*0.8+a.x)*6*f;
      ion(x+wob,y,M.icol,M.ion,11);return;}CL.drawAtom(ctx,a.x,a.y,AR,ME,{color:M.col,label:ME,s:11});});
  else z.atoms.forEach(a=>CL.drawAtom(ctx,a.x,a.y,AR,ME,{color:M.col,label:ME,s:11}));
  // ions
  z.ions.forEach(q=>{let [x,y]=wander(q,tt);const e=q.ev;
    if(e&&z.t0!==null&&T>e.t-1.0){const f=sm((T-e.t+1.0)/1.0);x=lerp(x,q.ap.x,f);y=lerp(y,q.ap.y,f);
      if(T>e.t+0.6){const g2=sm((T-e.t-0.6)/0.9);
        if(sim.p.sol==='H'){const mx=(e.ions[0].ap.x+e.ions[e.ions.length-1].ap.x)/2,rise=Math.max(0,T-e.t-1.5)*45;x=lerp(q.ap.x,mx+(q.slot%2?6:-6),g2);y=q.ap.y-rise;if(y<ZY-ZR-20)return;CL.drawAtom(ctx,x,y,8,'H',{label:'H'});return;}
        x=lerp(q.ap.x,q.dep.x,g2);y=lerp(q.ap.y,q.dep.y,g2);CL.drawAtom(ctx,x,y,AR,S.ion,{color:MET[S.ion].col,label:S.ion,s:11});return;}}
    ion(x,y,q.col,CL.fmt(q.sym,q.q),q.r);});
  // electrons in flight
  if(z.t0!==null)z.ev.forEach(e=>{if(T<e.t||T>e.t+0.6)return;const f=(T-e.t)/0.6;let idx=0;const per=R.n/e.ions.length;
    e.ions.forEach(q=>{for(let c=0;c<per;c++){const x=lerp(e.atom.x,q.ap.x,f)+(c-(per-1)/2)*7,y=lerp(e.atom.y-AR,q.ap.y,f);ctx.fillStyle=PAL['cv-e'];ctx.beginPath();ctx.arc(x,y,4.2,0,6.29);ctx.fill();ctx.strokeStyle=PAL['cv-estroke'];ctx.lineWidth=1;ctx.stroke();idx++;}});});
  ctx.restore();ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=3;ctx.beginPath();ctx.arc(ZX,ZY,ZR,0,6.29);ctx.stroke();
  // e⁻ legend dot inside the rim
  ctx.fillStyle=PAL['cv-e'];ctx.beginPath();ctx.arc(ZX+ZR-6,ZY-ZR+10,4.5,0,6.29);ctx.fill();txt(ctx,'e⁻',ZX+ZR+2,ZY-ZR+12,{s:12*k,w:700,b:'middle',c:PAL['cv-soft']});}
BioLab.register(ACT);
})();
