(function(){
'use strict';
const {clamp,rr,txt,pill,atLeast,PAL,FONT,lvText}=BioLab.h;
const CL=window.ChemLab;

/* ---------- molecule library ----------
   Single-center molecules list the central atom then the outer atoms (c, t).
   Multi-center molecules give atoms [sym, x, y] in bond lengths and bonds [i, j]. */
const LIB=[
  {id:'H2',f:'H2',name:'hydrogen',xy:[['H',-.5,0],['H',.5,0]],b:[[0,1]]},
  {id:'Cl2',f:'Cl2',name:'chlorine',xy:[['Cl',-.5,0],['Cl',.5,0]],b:[[0,1]]},
  {id:'HCl',f:'HCl',name:'hydrogen chloride',xy:[['H',-.5,0],['Cl',.5,0]],b:[[0,1]]},
  {id:'O2',f:'O2',name:'oxygen',xy:[['O',-.5,0],['O',.5,0]],b:[[0,1]]},
  {id:'N2',f:'N2',name:'nitrogen',xy:[['N',-.5,0],['N',.5,0]],b:[[0,1]]},
  {id:'H2O',f:'H2O',name:'water',c:'O',t:['H','H']},
  {id:'NH3',f:'NH3',name:'ammonia',c:'N',t:['H','H','H']},
  {id:'CH4',f:'CH4',name:'methane',c:'C',t:['H','H','H','H']},
  {id:'CO2',f:'CO2',name:'carbon dioxide',c:'C',t:['O','O']},
  {id:'HCN',f:'HCN',name:'hydrogen cyanide',c:'C',t:['H','N']},
  {id:'CCl4',f:'CCl4',name:'carbon tetrachloride',c:'C',t:['Cl','Cl','Cl','Cl']},
  {id:'PCl3',f:'PCl3',name:'phosphorus trichloride',c:'P',t:['Cl','Cl','Cl']},
  {id:'CH2O',f:'CH2O',name:'formaldehyde',c:'C',t:['O','H','H'],lvl:'honors'},
  {id:'C2H4',f:'C2H4',name:'ethene',xy:[['C',-.5,0],['C',.5,0],['H',-1,-.8],['H',-1,.8],['H',1,-.8],['H',1,.8]],b:[[0,1],[0,2],[0,3],[1,4],[1,5]],lvl:'honors'},
  {id:'C2H2',f:'C2H2',name:'ethyne (acetylene)',xy:[['H',-1.5,0],['C',-.5,0],['C',.5,0],['H',1.5,0]],b:[[0,1],[1,2],[2,3]],lvl:'honors'},
  {id:'CH3OH',f:'CH3OH',name:'methanol',xy:[['C',-.5,0],['O',.5,0],['H',-.5,-1],['H',-1.5,0],['H',-.5,1],['H',1.15,.75]],b:[[0,1],[0,2],[0,3],[0,4],[1,5]],lvl:'honors'},
  {id:'H2O2',f:'H2O2',name:'hydrogen peroxide',xy:[['O',-.5,0],['O',.5,0],['H',-1.05,.85],['H',1.05,-.85]],b:[[0,1],[0,2],[1,3]],lvl:'honors'},
  {id:'CO',f:'CO',name:'carbon monoxide',xy:[['C',-.5,0],['O',.5,0]],b:[[0,1]],lvl:'honors'},
  {id:'OH',f:'OH',q:-1,name:'hydroxide ion',xy:[['O',-.5,0],['H',.5,0]],b:[[0,1]],lvl:'honors'},
  {id:'CN',f:'CN',q:-1,name:'cyanide ion',xy:[['C',-.5,0],['N',.5,0]],b:[[0,1]],lvl:'honors'},
  {id:'NH4',f:'NH4',q:1,name:'ammonium ion',c:'N',t:['H','H','H','H'],lvl:'honors'},
  {id:'H3O',f:'H3O',q:1,name:'hydronium ion',c:'O',t:['H','H','H'],lvl:'honors'},
  {id:'BF3',f:'BF3',name:'boron trifluoride',c:'B',t:['F','F','F'],lvl:'honors'},
  {id:'SO2',f:'SO2',name:'sulfur dioxide',c:'S',t:['O','O'],lvl:'honors'},
  {id:'O3',f:'O3',name:'ozone',c:'O',t:['O','O'],lvl:'honors'},
  {id:'NO2',f:'NO2',q:-1,name:'nitrite ion',c:'N',t:['O','O'],lvl:'honors'},
  {id:'NO3',f:'NO3',q:-1,name:'nitrate ion',c:'N',t:['O','O','O'],lvl:'honors'},
  {id:'CO3',f:'CO3',q:-2,name:'carbonate ion',c:'C',t:['O','O','O'],lvl:'honors'},
  {id:'BeCl2',f:'BeCl2',name:'beryllium chloride',c:'Be',t:['Cl','Cl'],lvl:'ap'},
  {id:'SCN',f:'SCN',q:-1,name:'thiocyanate ion',c:'C',t:['S','N'],lvl:'ap'},
  {id:'PCl5',f:'PCl5',name:'phosphorus pentachloride',c:'P',t:['Cl','Cl','Cl','Cl','Cl'],lvl:'ap'},
  {id:'SF4',f:'SF4',name:'sulfur tetrafluoride',c:'S',t:['F','F','F','F'],lvl:'ap'},
  {id:'ClF3',f:'ClF3',name:'chlorine trifluoride',c:'Cl',t:['F','F','F'],lvl:'ap'},
  {id:'XeF2',f:'XeF2',name:'xenon difluoride',c:'Xe',t:['F','F'],lvl:'ap'},
  {id:'I3',f:'I3',q:-1,name:'triiodide ion',c:'I',t:['I','I'],lvl:'ap'},
  {id:'BrF5',f:'BrF5',name:'bromine pentafluoride',c:'Br',t:['F','F','F','F','F'],lvl:'ap'},
  {id:'XeF4',f:'XeF4',name:'xenon tetrafluoride',c:'Xe',t:['F','F','F','F'],lvl:'ap'},
  {id:'SF6',f:'SF6',name:'sulfur hexafluoride',c:'S',t:['F','F','F','F','F','F'],lvl:'ap'}
];
const BYID={};LIB.forEach(m=>{m.q=m.q||0;BYID[m.id]=m;
  if(m.c){m.atoms=[{s:m.c}].concat(m.t.map(s=>({s})));m.bonds=m.t.map((s,i)=>[0,i+1]);m.center=0;}
  else{m.atoms=m.xy.map(a=>({s:a[0],x:a[1],y:a[2]}));m.bonds=m.b;m.center=m.atoms.length>2?-1:-1;}});
const fmtF=m=>CL.fmt(m.f,m.q);
const htmlF=m=>CL.html(m.f,m.q);
const el=s=>CL.el(s);
const VAL=s=>CL.valence(el(s));
const DEFIC=['B','Be','Al'];

/* ---------- the best structure, found by search ----------
   Try every bond order (1-3) on every bond. Give each atom the lone pairs it needs for an octet (H: none),
   then fix the electron count: missing pairs come off B/Be/Al (incomplete octets), and extra pairs go on the
   period-3+ atom with the most bonds (expanded octets, second pass only). Keep the structures with the smallest
   total |formal charge|, breaking ties by putting negative charge on the more electronegative atom. */
function solve(m){if(m._sol)return m._sol;const A=m.atoms,B=m.bonds,n=A.length,nb=B.length;
  const V=A.map(a=>VAL(a.s)),total=V.reduce((x,y)=>x+y,0)-m.q,per=A.map(a=>el(a.s).period),en=A.map(a=>el(a.s).en||2.6);
  const deg=A.map((a,i)=>B.filter(b=>b[0]===i||b[1]===i).length);
  const run=pass=>{const found=[],bo=new Array(nb).fill(1);
    const evalBO=()=>{const bs=new Array(n).fill(0);B.forEach((b,i)=>{bs[b[0]]+=bo[i];bs[b[1]]+=bo[i];});const lp=new Array(n).fill(0);
      for(let i=0;i<n;i++){if(A[i].s==='H'){if(bs[i]!==1)return;continue;}if(bs[i]>4&&(pass==='octet'||per[i]<3))return;lp[i]=Math.max(0,4-bs[i]);}
      let left=total-2*bo.reduce((x,y)=>x+y,0)-2*lp.reduce((x,y)=>x+y,0);if(left%2)return;left/=2;
      if(left<0){for(let i=0;i<n&&left<0;i++)if(DEFIC.includes(A[i].s)){const r=Math.min(lp[i],-left);lp[i]-=r;left+=r;}if(left<0)return;}
      if(left>0){if(pass==='octet')return;const c=[...Array(n).keys()].filter(i=>per[i]>=3&&A[i].s!=='H').sort((a,b)=>deg[b]-deg[a]);if(!c.length)return;lp[c[0]]+=left;}
      const fc=A.map((a,i)=>V[i]-2*lp[i]-bs[i]);found.push({bo:bo.slice(),lp,fc,s1:fc.reduce((x,y)=>x+Math.abs(y),0),s2:fc.reduce((x,y,i)=>x+y*en[i],0)});};
    const rec=k=>{if(k===nb){evalBO();return;}for(let o=1;o<=3;o++){bo[k]=o;rec(k+1);}};rec(0);
    if(!found.length)return [];const m1=Math.min(...found.map(f=>f.s1));let f2=found.filter(f=>f.s1===m1);const m2=Math.min(...f2.map(f=>f.s2));return f2.filter(f=>f.s2<m2+1e-6);};
  const oct=run('octet'),exp=run('expanded');
  let best=oct.length?oct:exp,alt=[];if(oct.length&&exp.length&&exp[0].s1<oct[0].s1)alt=exp;
  const sig=fc=>A.map((a,i)=>a.s+deg[i]+':'+fc[i]).sort().join(',');
  m._sol={total,V,deg,per,best,alt,sigs:new Set(best.map(b=>sig(b.fc))),altSigs:new Set(alt.map(b=>sig(b.fc))),sig};
  if(m.center===-1&&n>2){let c=0;deg.forEach((d,i)=>{if(d>deg[c])c=i;});m.center=deg[c]>1?c:-1;}
  return m._sol;}
LIB.forEach(solve);

/* ---------- evaluate what the student has drawn ---------- */
function evaluate(st){const m=st.m,s=solve(m),A=m.atoms,n=A.length;const bs=new Array(n).fill(0);m.bonds.forEach((b,i)=>{bs[b[0]]+=st.bo[i];bs[b[1]]+=st.bo[i];});
  const e=A.map((a,i)=>2*(bs[i]+st.lp[i])),fc=A.map((a,i)=>s.V[i]-2*st.lp[i]-bs[i]);
  const placed=2*st.bo.reduce((x,y)=>x+y,0)+2*st.lp.reduce((x,y)=>x+y,0);
  const shell=A.map((a,i)=>{const need=a.s==='H'?2:8;if(e[i]===need)return 'full';if(e[i]<need)return DEFIC.includes(a.s)&&e[i]>=2*s.deg[i]?'exc':'short';return a.s!=='H'&&s.per[i]>=3?'exp':'over';});
  const shellsOK=shell.every(x=>x==='full'||x==='exc'||x==='exp');const sg=s.sig(fc);
  const best=s.sigs.has(sg),alt=s.altSigs.has(sg);const correct=placed===s.total&&shellsOK&&(best||alt);
  return {bs,e,fc,placed,total:s.total,left:s.total-placed,shell,shellsOK,best,alt,correct,fcAbs:fc.reduce((x,y)=>x+Math.abs(y),0),
    bestAbs:s.best.length?s.best[0].fc.reduce((x,y)=>x+Math.abs(y),0):0};}

/* ---------- layout ---------- */
const BL=124,CX=280,CY=252;
const ANG={1:[0],2:[180,0],3:[270,30,150],4:[270,0,90,180],5:[270,342,54,126,198],6:[270,330,30,90,150,210]};
function layout(m){if(m._xy)return m._xy;let pts;
  if(m.c){const nt=m.t.length,s=solve(m),lp0=s.best.length?s.best[0].lp[0]:0;const ang=(nt===3&&lp0>0)?[180,0,90]:ANG[nt];
    pts=[[0,0]].concat(ang.map(a=>[Math.cos(a*Math.PI/180)*BL,Math.sin(a*Math.PI/180)*BL]));}
  else{pts=m.atoms.map(a=>[a.x*BL,a.y*BL]);}
  m._xy=pts.map(p=>[CX+p[0],CY+p[1]]);return m._xy;}
// lone pair directions for each atom: spread into the largest gaps between bonds
function lpDirs(m,i,count){const xy=layout(m),occ=[];m.bonds.forEach(b=>{if(b[0]===i||b[1]===i){const j=b[0]===i?b[1]:b[0];occ.push(Math.atan2(xy[j][1]-xy[i][1],xy[j][0]-xy[i][0]));}});
  const out=[];const dist=(a,b)=>{let d=Math.abs(a-b)%(2*Math.PI);return d>Math.PI?2*Math.PI-d:d;};
  for(let k=0;k<count;k++){let best=-Math.PI/2,bd=-1;for(let c=0;c<72;c++){const a=-Math.PI/2+c*Math.PI/36;const all=occ.concat(out);const d=all.length?Math.min(...all.map(o=>dist(a,o))):9;if(d>bd+1e-6){bd=d;best=a;}}out.push(best);}
  return out;}
function freeDir(m,i,lpc){const xy=layout(m),occ=lpDirs(m,i,lpc);m.bonds.forEach(b=>{if(b[0]===i||b[1]===i){const j=b[0]===i?b[1]:b[0];occ.push(Math.atan2(xy[j][1]-xy[i][1],xy[j][0]-xy[i][0]));}});
  const dist=(a,b)=>{let d=Math.abs(a-b)%(2*Math.PI);return d>Math.PI?2*Math.PI-d:d;};let best=-Math.PI/4,bd=-1;
  for(let c=0;c<24;c++){const a=-Math.PI/4+c*Math.PI/12;const d=occ.length?Math.min(...occ.map(o=>dist(a,o))):9;if(d>bd+1e-6){bd=d;best=a;}}return best;}

function newState(m){return {m,bo:m.bonds.map(()=>1),lp:m.atoms.map(()=>0),sel:-1,res:0};}
function setAnswer(st,k){const s=solve(st.m);const list=s.best.length?s.best:s.alt;if(!list.length)return;const b=list[((k||0)%list.length+list.length)%list.length];st.bo=b.bo.slice();st.lp=b.lp.slice();}
function fillOuter(st){const m=st.m,ev=evaluate(st),deg=solve(m).deg;m.atoms.forEach((a,i)=>{if(a.s==='H'||deg[i]!==1)return;st.lp[i]=Math.max(0,4-ev.bs[i]);});}
const nParts=st=>st.m.atoms.length+st.m.bonds.length;
function bump(st,d){const m=st.m;if(st.sel<0)st.sel=0;const n=m.atoms.length;
  if(st.sel<n){const i=st.sel;if(m.atoms[i].s==='H'){st.lp[i]=0;return;}st.lp[i]=((st.lp[i]+d)%5+5)%5;}
  else{const j=st.sel-n;st.bo[j]=clamp(st.bo[j]+d,1,3);}}
function atomName(m,i){const s=m.atoms[i].s;if(i===m.center)return s+' (central)';const same=m.atoms.map((a,k)=>k).filter(k=>m.atoms[k].s===s&&k!==m.center);
  return same.length>1?s+' '+(same.indexOf(i)+1):s;}

const LEWIS={
  id:'lewis',hash:'lewis',apUnit:5,order:3,tab:'Lewis structures',kind:'Learning tool',prereq:['ionic','econfig'],next:['vsepr','polarity'],
  card:'Count valence electrons, click to add bonds and lone pairs, and check octets, formal charges and resonance for 38 molecules and ions.',
  title:'Lewis structures: where the valence electrons go',
  lede:{bio:'Count the valence electrons, then share them out as bonds and lone pairs until every atom has a full shell.',
        honors:'Build the structure, then use formal charge to pick the best one. Some molecules and ions need resonance structures.',
        ap:'Handle the exceptions: incomplete octets (B, Be), expanded octets (S, P, Cl, Xe, I) and formal-charge choices like SCN⁻.'},
  scale:'One molecule. The atoms sit about 0.1 nm apart: a C=O bond is 0.116 nm long, about 1/500,000 of a hair’s width.',
  timeless:true,graph:false,
  controls:[
    {id:'mol',label:'Molecule or ion',type:'select',def:'CO2',lvl:'bio',options:LIB.map(m=>({v:m.id,l:fmtF(m)+'  '+m.name,lvl:m.lvl})),onChange(sim){sim.st=newState(BYID[sim.p.mol]);}},
    {id:'ring',label:'Show electron rings',type:'toggle',def:true,lvl:'bio',help:'A ring around each atom turns green when its shell is full.'},
    {id:'fc',label:'Show formal charges',type:'toggle',def:true,lvl:'honors'}
  ],
  actions:[
    {id:'sel',label:'Select next part',lvl:'bio',run(sim){const st=sim.st;st.sel=(st.sel+1)%nParts(st);}},
    {id:'plus',label:'Add (+)',lvl:'bio',primary:true,run(sim){bump(sim.st,1);}},
    {id:'minus',label:'Remove (−)',lvl:'bio',run(sim){bump(sim.st,-1);}},
    {id:'outer',label:'Fill outer atoms',lvl:'bio',run(sim){fillOuter(sim.st);}},
    {id:'clear',label:'Start over',lvl:'bio',run(sim){const sel=sim.st.sel;sim.st=newState(sim.st.m);sim.st.sel=sel;}},
    {id:'answer',label:'Show the answer',lvl:'bio',run(sim){sim.st.res=0;setAnswer(sim.st,0);}},
    {id:'res',label:'Next resonance structure',lvl:'honors',run(sim){const st=sim.st;st.res++;setAnswer(st,st.res);}}
  ],
  init(sim){return newState(BYID[sim.p.mol]||BYID.CO2);},
  onClick(sim,x,y){const st=sim.st,m=st.m,xy=layout(m),k=sim.vis.k||1,rA=atomR(k)+6;
    for(let i=0;i<xy.length;i++){if(Math.hypot(x-xy[i][0],y-xy[i][1])<rA){st.sel=i;bump(st,1);return;}}
    for(let j=0;j<m.bonds.length;j++){const b=m.bonds[j],a=xy[b[0]],c=xy[b[1]],dx=c[0]-a[0],dy=c[1]-a[1],L2=dx*dx+dy*dy,t=clamp(((x-a[0])*dx+(y-a[1])*dy)/L2,0,1);
      if(t>0.15&&t<0.85&&Math.hypot(x-(a[0]+t*dx),y-(a[1]+t*dy))<16){st.sel=m.atoms.length+j;st.bo[j]=st.bo[j]%3+1;return;}}},
  metrics:[
    {id:'tot',label:'Valence electrons to place',unit:'e⁻',lvl:'bio',d:0,get:s=>evaluate(s.st).total},
    {id:'placed',label:'Electrons placed',unit:'e⁻',lvl:'bio',d:0,get:s=>evaluate(s.st).placed},
    {id:'status',label:'Check',unit:'',lvl:'bio',text:true,get:s=>{const v=evaluate(s.st);if(v.correct)return v.alt&&!v.best?'Correct (expanded octet)':'Correct structure';
      if(v.left>0)return v.left+' e⁻ left to place';if(v.left<0)return (-v.left)+' e⁻ too many';if(!v.shellsOK)return 'A shell is not full';return atLeast('honors')?'Formal charges too big':'Try a different bond pattern';}},
    {id:'bp',label:'Bonding pairs',unit:'',lvl:'honors',d:0,get:s=>s.st.bo.reduce((x,y)=>x+y,0)},
    {id:'lpc',label:'Lone pairs on the central atom',unit:'',lvl:'honors',d:0,get:s=>s.st.m.center>=0?s.st.lp[s.st.m.center]:null},
    {id:'dom',label:'Electron domains on the central atom',unit:'',lvl:'ap',d:0,get:s=>{const m=s.st.m;if(m.center<0)return null;return solve(m).deg[m.center]+s.st.lp[m.center];}},
    {id:'fcs',label:'Sum of formal charges',unit:'',lvl:'ap',d:0,get:s=>{const v=evaluate(s.st);return v.left===0?v.fc.reduce((x,y)=>x+y,0):null;}}
  ],
  infoPanel(sim){const st=sim.st,m=st.m,v=evaluate(st),s=solve(m),hon=atLeast('honors'),ap=atLeast('ap');
    const SH={full:'full',short:'needs more',over:'too many',exc:'incomplete octet (allowed for '+m.atoms.map(a=>a.s).filter(x=>DEFIC.includes(x))[0]+')',exp:'expanded octet'};
    const rows=m.atoms.map((a,i)=>`<tr${st.sel===i?' style="outline:2px solid var(--rj)"':''}><td>${atomName(m,i)}</td><td>${s.V[i]}</td><td>${v.bs[i]}</td><td>${st.lp[i]}</td><td>${v.e[i]} (${SH[v.shell[i]]})</td>${hon?`<td>${v.left===0?fcTxt(v.fc[i]):'—'}</td>`:''}</tr>`).join('');
    let h=`<h3>${htmlF(m)}: atom by atom</h3><div class="tbl-wrap"><table><thead><tr><th>Atom</th><th>Valence e⁻</th><th>Bonds</th><th>Lone pairs</th><th>Electrons around it</th>${hon?'<th>Formal charge</th>':''}</tr></thead><tbody>${rows}</tbody></table></div>`;
    if(hon)h+=`<p style="margin-top:8px"><b>Formal charge</b> = valence e⁻ − lone-pair e⁻ − bonds${v.left===0?'':' (shown once every electron is placed)'}. ${v.correct?'':'The best structure has formal charges that add to '+(m.q?'the ion’s charge ('+fcTxt(m.q)+')':'zero')+' and are as close to zero as possible.'}</p>`;
    if(hon&&s.best.length>1)h+=`<p><b>Resonance:</b> ${htmlF(m)} has ${s.best.length} equally good structures. The real ${m.q?'ion':'molecule'} is a blend of them: every ${bondKind(m,s)} bond is identical, partway between a single and a double bond. Press <b>Next resonance structure</b> to see each one.</p>`;
    if(ap&&s.alt.length)h+=`<p class="help">An expanded-octet structure for ${htmlF(m)} has smaller formal charges. Both are accepted on the AP exam; many textbooks show the octet structures with resonance.</p>`;
    h+=`<p class="help">Click an atom to add a lone pair (it cycles back to zero). Click a bond to change it from single to double to triple. Or use Select next part, then Add and Remove.</p>`;
    return h;},
  narrate(sim){const st=sim.st,m=st.m,v=evaluate(st),s=solve(m),hon=atLeast('honors'),F=htmlF(m);
    if(v.correct){let t='<b>Correct Lewis structure.</b> All '+v.total+' valence electrons are placed and '+(v.shell.includes('exc')?'every atom is as full as it can be (boron and beryllium are stable with fewer than 8).':v.shell.includes('exp')?'the central atom holds more than 8, which period 3 and heavier atoms can do.':'every atom has a full shell.');
      if(hon)t+=v.fcAbs?' The formal charges are as small as they can be.':' Every formal charge is zero.';
      if(hon&&s.best.length>1)t+=' This is one of '+s.best.length+' resonance structures.';return t;}
    if(v.left>0){const short=m.atoms.map((a,i)=>i).filter(i=>v.shell[i]==='short');return '<b>'+v.left+' electrons are still unplaced.</b> '+(short.length?'Give lone pairs to atoms whose shell is not full, outer atoms first'+(short.length===1?' ('+m.atoms[short[0]].s+' has '+v.e[short[0]]+').':'.'):'Every atom already looks full, so the leftovers go on the central atom.');}
    if(v.left<0)return '<b>Too many electrons:</b> your structure uses '+v.placed+', but '+F+' has only '+v.total+'. Remove lone pairs. If an atom then falls short, turn a single bond into a double bond so two atoms share the same pair.';
    if(!v.shellsOK){const i=v.shell.findIndex(x=>x==='short'||x==='over');const a=m.atoms[i].s;
      if(v.shell[i]==='over')return '<b>'+a+' has '+v.e[i]+' electrons.</b> '+(a==='H'?'Hydrogen holds only 2: one bond and no lone pairs.':'Period 2 atoms like '+a+' can hold at most 8. Remove a lone pair or lower a bond order.');
      return 'All '+v.total+' electrons are placed, but <b>'+a+' has only '+v.e[i]+'</b>. Move a lone pair from a neighbor into the bond to make a double bond, so both atoms count those electrons.';}
    return hon?'Every atom has a full shell, but the formal charges ('+v.fc.filter(x=>x).map(fcTxt).join(', ')+') are bigger than they need to be. <b>Move a double bond</b> so the charges get closer to zero'+(m.q?', with any negative charge on the most electronegative atom.':'.'):'Every atom has a full shell, but chemists prefer a more even arrangement. <b>Try moving a double bond</b> to a different pair of atoms.';},
  tour:[
    {title:'1. Count the valence electrons',text:'Carbon brings 4 valence electrons and each oxygen brings 6, so CO₂ has 4 + 6 + 6 = <b>16 electrons</b> to place. The panel on the right keeps this budget.',focus:[548,10,244,200],pause:true,setup(sim){BioLab.setValues(sim,{mol:'CO2'});}},
    {title:'2. Connect the atoms with single bonds',text:'Put the least electronegative atom (C) in the middle. Each single bond is one shared pair, so the two bonds use 4 of the 16 electrons.',focus:[CX-170,CY-70,340,140],pause:true},
    {title:'3. Fill the outer atoms',text:'Give each oxygen three lone pairs so it has 8. That uses all 16 electrons, but look at carbon: its ring is not green. Carbon has only 4.',focus:[CX-170,CY-80,340,160],pause:true,setup(sim){fillOuter(sim.st);}},
    {title:'4. Share more: make double bonds',text:'Carbon is short, and no electrons are left. Move one lone pair from each oxygen into its bond. Now each C=O double bond is shared by both atoms, and <b>every atom has 8</b>.',focus:[CX-170,CY-80,340,160],pause:true,setup(sim){setAnswer(sim.st,0);}},
    {lvl:'honors',title:'5. Check the formal charges',text:'Formal charge = valence e⁻ − lone-pair e⁻ − bonds. For each O: 6 − 4 − 2 = 0. For C: 4 − 0 − 4 = 0. All zero, so this is the best structure.',focus:[CX-170,CY-80,340,160],pause:true},
    {lvl:'honors',title:'6. Resonance in the nitrate ion',text:'NO₃⁻ has 24 electrons. The double bond could go to any of the three oxygens, so there are three resonance structures. The real ion is a blend: all three N–O bonds are the same length.',focus:[CX-170,CY-150,340,300],pause:true,setup(sim){BioLab.setValues(sim,{mol:'NO3'});setAnswer(sim.st,0);}},
    {lvl:'ap',title:'7. Expanded octet',text:'SF₄ has 34 electrons. After four S–F bonds and full shells on each F, one lone pair is left, and it goes on sulfur. Sulfur is in period 3, so it can hold 10 electrons.',focus:[CX-170,CY-150,340,300],pause:true,setup(sim){BioLab.setValues(sim,{mol:'SF4'});setAnswer(sim.st,0);}},
    {title:'Your turn',text:'Pick a molecule from the list and build it. Click atoms to add lone pairs and click bonds to make them double or triple. The rings and the check tile tell you when it is right.',focus:[0,0,800,450],pause:true,setup(sim){BioLab.setValues(sim,{mol:'NH3'});}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{mol:'CO2'});},
  onChallenge(sim,ch,phase){if(!ch||phase!=='ask'||!ch.set)return;BioLab.setValues(sim,{mol:ch.set});const st=sim.st;if(ch.draw)ch.draw(st);BioLab.refresh(sim);},
  challenges(){return [
    mkCh('bio','CO2','How many valence electrons do you have to place when you draw CO₂?',['12','16','18','24'],m=>String(solve(m).total),
      'C has 4 and each O has 6: 4 + 2 × 6 = 16. The budget panel shows the same count.'),
    mkCh('bio','H2O','In the Lewis structure of water, how many lone pairs sit on the oxygen atom?',['0','1','2','3'],m=>String(solve(m).best[0].lp[0]),
      'Water has 8 valence electrons. Two O–H bonds use 4, and the other 4 make two lone pairs on oxygen. Press Show the answer to see it.'),
    mkCh('bio','CO2','A student draws CO₂ with two single bonds and gives every atom 8 electrons, as shown. What is wrong?',['Nothing, it is correct','It uses 20 electrons, but CO₂ has only 16, so it needs double bonds','Carbon should have lone pairs instead of bonds'],
      m=>'It uses 20 electrons, but CO₂ has only 16, so it needs double bonds','The structure on the stage now shows that drawing: 20 electrons placed against a budget of 16. Sharing more (two C=O double bonds) gives every atom 8 using only 16 electrons.',
      st=>{st.lp=[2,3,3];}),
    mkCh('bio','CH4','Does each hydrogen in CH₄ need 8 electrons around it?',['Yes, every atom needs 8','No, hydrogen is full with 2 (one bond)'],m=>'No, hydrogen is full with 2 (one bond)',
      'Hydrogen only has a 1s orbital, which holds 2 electrons. One bond fills it, so H never gets lone pairs and never forms two bonds.'),
    mkCh('honors','NO3','In the nitrate ion, NO₃⁻, how do the three N–O bonds compare?',['One is double and two are single, and they stay that way','All three are identical, partway between single and double','All three are double bonds'],
      m=>solve(m).best.length===3?'All three are identical, partway between single and double':'x','The model finds 3 equally good structures, one for each oxygen that could hold the double bond. The real ion is a blend of all three (resonance), so every N–O bond is the same length.'),
    mkCh('honors','NH4','What is the formal charge on nitrogen in the ammonium ion, NH₄⁺?',['−1','0','+1','+4'],m=>fcTxt(solve(m).best[0].fc[0]),
      'N brings 5 valence electrons, has no lone pairs and 4 bonds: 5 − 0 − 4 = +1. The +1 formal charge matches the ion’s overall charge.'),
    mkCh('honors','CO','In carbon monoxide, C≡O, which atom carries the negative formal charge?',['Oxygen, because it is more electronegative','Carbon','Neither: both are zero'],m=>solve(m).best[0].fc[0]<0?'Carbon':'x',
      'C: 4 − 2 − 3 = −1, O: 6 − 2 − 3 = +1. The triple bond is the only way to give both atoms an octet with 10 electrons, so the negative charge lands on carbon even though oxygen is more electronegative.'),
    mkCh('ap','SF4','How many electrons surround the sulfur atom in SF₄?',['8','10','12'],m=>{const b=solve(m).best[0];return String(2*(b.lp[0]+4));},
      'Four S–F bonds (8 e⁻) plus one lone pair (2 e⁻) = 10. Sulfur is in period 3, so it can expand its octet.'),
    mkCh('ap','BF3','The model’s best structure gives boron in BF₃ only 6 electrons. Why is that preferred to a B=F double bond?',['With single bonds every formal charge is 0; a B=F bond would put +1 on fluorine, the most electronegative element','Boron can never form a double bond','It is a mistake: boron always needs 8'],
      m=>solve(m).best[0].fc.every(x=>x===0)?'With single bonds every formal charge is 0; a B=F bond would put +1 on fluorine, the most electronegative element':'x','The formal-charge search compares both: single bonds give 0 on every atom; one B=F double bond gives B −1 and F +1. Boron is one of the elements that is stable with an incomplete octet.'),
    mkCh('ap','SCN','Which Lewis structure is best for the thiocyanate ion, SCN⁻?',['[S=C=N]⁻ with the −1 formal charge on N','[S–C≡N]⁻ with the −1 formal charge on S','[S≡C–N]⁻ with +1 on S and −2 on N'],
      m=>{const b=solve(m).best[0];return b.fc[2]===-1?'[S=C=N]⁻ with the −1 formal charge on N':'x';},'The first two both have only one nonzero formal charge. The tie goes to the structure that puts the negative charge on the more electronegative atom: N (3.04) beats S (2.58).')
  ];},
  lab:{bio:'<p><b>Question:</b> How do you know when a Lewis structure is finished?</p><ol><li>For each of H₂O, NH₃, CH₄, CO₂, N₂ and HCN: count the valence electrons, then build the structure.</li><li>When the check tile says correct, record a trial.</li><li>Compare valence electrons with electrons placed.</li></ol><p>Write the rule: what two things must be true of every finished structure?</p>',
       honors:'<p><b>Question:</b> When do molecules need double bonds, and when do they need resonance?</p><ol><li>Build CO₂, CH₂O, O₃, SO₂, NO₃⁻ and CO₃²⁻. Record a trial for each.</li><li>For each, note the bonding pairs and the lone pairs on the central atom.</li><li>Press Next resonance structure and count the forms.</li></ol><p>Explain why O₃ has two resonance structures but CO₂ has one. Use formal charge in your answer.</p>',
       ap:'<p><b>Question:</b> When does formal charge override the octet rule?</p><ol><li>Build BF₃, BeCl₂, SF₄, XeF₄, I₃⁻ and SCN⁻. Record the electron domains on the central atom.</li><li>For SCN⁻, compare the formal charges of the three possible structures.</li></ol><p><b>Claim–evidence–reasoning:</b> State a rule for choosing the best structure and support it with two of your molecules.</p>'},
  terms:[{t:'Valence electrons',d:'Electrons in an atom’s outer shell. For main-group elements, the last digit of the group number.'},{t:'Lone pair',d:'Two valence electrons that belong to one atom and are not shared.'},{t:'Bonding pair',d:'Two electrons shared between two atoms: a single bond. A double bond shares 2 pairs, a triple bond 3.'},{t:'Octet rule',d:'Atoms tend to share electrons until they have 8 around them. Hydrogen is full with 2.'},
    {lvl:'honors',t:'Formal charge',d:'Valence e⁻ − lone-pair e⁻ − number of bonds. The best structure keeps formal charges near zero.'},{lvl:'honors',t:'Resonance',d:'Two or more valid structures that differ only in where the electrons are. The real species is a blend.'},
    {lvl:'ap',t:'Incomplete octet',d:'B and Be are stable with fewer than 8 electrons (BF₃, BeCl₂).'},{lvl:'ap',t:'Expanded octet',d:'Atoms in period 3 and below can hold more than 8 electrons around them (SF₆, PCl₅, XeF₄).'}],
  about:'<p>The tool checks your structure in three steps: the electrons you placed must equal the valence electrons (from the group number, adjusted for the ion’s charge); every atom must have a full shell (H: 2, others: 8, with incomplete octets allowed for B, Be and Al and expanded octets for period 3 and heavier atoms); and the formal charges must match the best structure.</p><p>The best structure is not typed in by hand. The model tries every combination of single, double and triple bonds, fills octets, and keeps the structures with the smallest total formal charge, breaking ties by putting negative charge on the more electronegative atom (Pauling values). It only expands an octet when no octet structure exists. All structures that tie are shown as resonance structures.</p><p>Simplifications: the skeleton (which atom bonds to which) is given, odd-electron species such as NO and NO₂ are left out, and the drawing is flat. Lewis structures do not show shape: use Molecule shapes for that.</p>',
  initVis(sim){sim.vis.k=1;},
  draw(sim,ctx,vdt,k,t){sim.vis.k=k;const st=sim.st,m=st.m,v=evaluate(st),s=solve(m),xy=layout(m),hon=atLeast('honors');
    ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
    // heading
    txt(ctx,fmtF(m),20,44,{s:30*Math.min(k,1.4),w:800});txt(ctx,m.name,20,44+20*Math.min(k,1.4),{s:13*k,c:PAL['cv-soft']});
    const R=atomR(k),fs=symS(k),rL=R;
    // ion brackets
    if(m.q&&hon){let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;xy.forEach(p=>{x0=Math.min(x0,p[0]);x1=Math.max(x1,p[0]);y0=Math.min(y0,p[1]);y1=Math.max(y1,p[1]);});x0-=R+16;x1+=R+16;y0-=R+14;y1+=R+14;
      ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(x0+10,y0);ctx.lineTo(x0,y0);ctx.lineTo(x0,y1);ctx.lineTo(x0+10,y1);ctx.moveTo(x1-10,y0);ctx.lineTo(x1,y0);ctx.lineTo(x1,y1);ctx.lineTo(x1-10,y1);ctx.stroke();
      txt(ctx,CL.sup((Math.abs(m.q)>1?Math.abs(m.q):'')+(m.q>0?'+':'−')),x1+4,y0+6,{s:22*Math.min(k,1.4),w:700});}
    // selection highlight
    const nA=m.atoms.length;
    if(st.sel>=nA){const b=m.bonds[st.sel-nA],a=xy[b[0]],c=xy[b[1]];ctx.strokeStyle=PAL['rj'];ctx.globalAlpha=0.25;ctx.lineWidth=22;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(c[0],c[1]);ctx.stroke();ctx.globalAlpha=1;}
    // bonds
    m.bonds.forEach((b,j)=>{const a=xy[b[0]],c=xy[b[1]],dx=c[0]-a[0],dy=c[1]-a[1],L=Math.hypot(dx,dy),ux=dx/L,uy=dy/L,nx=-uy,ny=ux,tr=fs*0.62,o=st.bo[j];
      const offs=o===1?[0]:o===2?[-4.5,4.5]:[-8,0,8];ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=3;ctx.lineCap='round';
      offs.forEach(d=>{ctx.beginPath();ctx.moveTo(a[0]+ux*tr+nx*d,a[1]+uy*tr+ny*d);ctx.lineTo(c[0]-ux*tr+nx*d,c[1]-uy*tr+ny*d);ctx.stroke();});});
    // atoms, rings, lone pairs
    m.atoms.forEach((a,i)=>{const p=xy[i],sh=v.shell[i];
      if(sim.p.ring){const col=sh==='full'?PAL['s3']:sh==='exc'||sh==='exp'?PAL['s5']:sh==='short'?PAL['s4']:PAL['s1'];ctx.strokeStyle=col;ctx.lineWidth=2.5;ctx.setLineDash(sh==='full'||sh==='exc'||sh==='exp'?[]:[5,4]);
        ctx.beginPath();ctx.arc(p[0],p[1],rL+9,0,6.29);ctx.stroke();ctx.setLineDash([]);}
      if(st.sel===i){ctx.fillStyle=PAL['rj'];ctx.globalAlpha=0.18;ctx.beginPath();ctx.arc(p[0],p[1],rL+8,0,6.29);ctx.fill();ctx.globalAlpha=1;}
      txt(ctx,a.s,p[0],p[1]+1,{s:fs,w:800,a:'center',b:'middle'});
      const dirs=lpDirs(m,i,st.lp[i]);dirs.forEach(d=>{const cx=p[0]+Math.cos(d)*rL,cy=p[1]+Math.sin(d)*rL,nx=-Math.sin(d)*5.5,ny=Math.cos(d)*5.5;ctx.fillStyle=PAL['cv-ink'];
        [1,-1].forEach(sg=>{ctx.beginPath();ctx.arc(cx+nx*sg,cy+ny*sg,3.4,0,6.29);ctx.fill();});});
      if(hon&&sim.p.fc&&v.left===0){const d=freeDir(m,i,st.lp[i]),fx=p[0]+Math.cos(d)*(rL+22*Math.min(k,1.3)),fy=p[1]+Math.sin(d)*(rL+22*Math.min(k,1.3)),f=v.fc[i];
        if(f!==0||m.atoms.length<=6){ctx.fillStyle=f>0?PAL['s1']:f<0?PAL['s2']:PAL['card'];ctx.beginPath();ctx.arc(fx,fy,11*Math.min(k,1.4),0,6.29);ctx.fill();if(!f){ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();}
          txt(ctx,fcTxt(f),fx,fy+1,{s:12*Math.min(k,1.4),w:800,a:'center',b:'middle',c:f?'#fff':PAL['cv-soft']});}}});
    // budget panel
    drawBudget(ctx,sim,v,s,k);
  },
  thumbSetup(sim){sim.p.mol='NO3';sim.st=newState(BYID.NO3);setAnswer(sim.st,0);}
};
const atomR=k=>symS(k)*0.62+8;
const symS=k=>30*Math.min(k,1.3);
function fcTxt(f){return f>0?'+'+f:f<0?'−'+(-f):'0';}
function bondKind(m,s){const t=m.atoms.filter((a,i)=>i!==m.center).map(a=>a.s);return m.atoms[m.center>=0?m.center:0].s+'–'+t[0];}
function mkCh(lvl,mol,q,choices,ans,explain,draw){const m=BYID[mol];const a=ans(m);const correct=choices.indexOf(a);
  return {lvl,q,choices,correct,instant:true,set:mol,draw,explain:{[lvl]:explain}};}
function drawBudget(ctx,sim,v,s,k){const m=sim.st.m,hon=atLeast('honors');const x0=552,W=240,ks=Math.min(k,1.75),lh=21*ks;let y=18;
  const counts={};m.atoms.forEach(a=>counts[a.s]=(counts[a.s]||0)+1);const rows=Object.keys(counts);
  const nDots=v.total,per=Math.max(6,Math.floor((W-24)/(8.6*ks))),dotRows=Math.ceil(nDots/per);
  const H=lh*(rows.length+(m.q?1:0)+2.2)+dotRows*8.6*ks+lh*(hon?4.6:3.6)+14;
  rr(ctx,x0,y,W,Math.min(H,432),12);ctx.fillStyle=PAL['card'];ctx.fill();ctx.strokeStyle=v.correct?PAL['s3']:PAL['line'];ctx.lineWidth=v.correct?3:1;ctx.stroke();
  y+=lh+4;txt(ctx,v.correct?'Correct structure':'Electron budget',x0+12,y,{s:14*k,w:800,c:v.correct?PAL['s3']:PAL['cv-soft']});
  rows.forEach(sym=>{y+=lh;txt(ctx,sym,x0+12,y,{s:15*k,w:700});txt(ctx,counts[sym]+' × '+VAL(sym)+' = '+counts[sym]*VAL(sym),x0+W-12,y,{s:15*k,a:'right'});});
  if(m.q){y+=lh;txt(ctx,'charge '+fcTxt(m.q),x0+12,y,{s:15*k,c:PAL['cv-soft']});txt(ctx,(m.q<0?'+':'−')+Math.abs(m.q),x0+W-12,y,{s:15*k,a:'right'});}
  y+=lh*1.1;ctx.strokeStyle=PAL['line'];ctx.beginPath();ctx.moveTo(x0+12,y-lh*0.72);ctx.lineTo(x0+W-12,y-lh*0.72);ctx.stroke();
  txt(ctx,'Total',x0+12,y,{s:16*k,w:800});txt(ctx,v.total+' e⁻',x0+W-12,y,{s:16*k,w:800,a:'right'});
  y+=lh*0.6;const ds=8.6*ks;for(let i=0;i<nDots;i++){const cx=x0+16+(i%per)*ds,cy=y+Math.floor(i/per)*ds+4;ctx.beginPath();ctx.arc(cx,cy,3*ks,0,6.29);
    if(i<v.placed){ctx.fillStyle=PAL['cv-ink'];ctx.fill();}else{ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.2;ctx.stroke();}}
  y+=dotRows*ds+lh*0.7;
  const over=v.placed>v.total;txt(ctx,'Placed '+v.placed+(over?' (too many)':'  ·  left '+Math.max(0,v.left)),x0+12,y,{s:14*k,w:700,c:over?PAL['s1']:PAL['cv-ink']});
  const items=[[v.left===0,'Electrons used'],[v.shellsOK,'Full shells']];if(hon)items.push([v.best||v.alt,'Formal charges']);
  items.forEach(([ok,l])=>{y+=lh*1.05;ctx.fillStyle=ok?PAL['s3']:PAL['card2'];ctx.strokeStyle=ok?PAL['s3']:PAL['cv-soft'];ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(x0+20,y-5*ks,7*ks,0,6.29);ctx.fill();ctx.stroke();
    if(ok)txt(ctx,'✓',x0+20,y-4*ks,{s:11*ks,w:800,c:'#fff',a:'center',b:'middle'});txt(ctx,l,x0+34,y,{s:14*k,c:ok?PAL['cv-ink']:PAL['cv-soft'],w:ok?700:400});});
}
BioLab.register(LEWIS);
})();
