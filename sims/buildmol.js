(function(){
'use strict';
const {clamp,txt,pill,rr,atLeast,PAL,FONT,RM}=BioLab.h;
const CL=window.ChemLab;
/* Build a molecule atom by atom. Each atom has a bonding capacity (H 1, Cl 1, O 2, N 3, C 4).
   A molecule is complete when every atom uses all its bonds. Completed molecules are named by formula and,
   for isomers, by which atoms are joined. Kits limit the atoms, so building several copies shows coefficients. */
const VAL={H:1,Cl:1,O:2,N:3,C:4};
const RAD={H:15,C:22,N:21,O:20,Cl:25};
const BL=74;
/* known molecules: formula (Hill), name, test on structure, where you meet it, level */
const MOL=[
  {id:'h2',f:'H2',n:'Hydrogen gas',u:'Fuel for fuel-cell buses and rockets.'},
  {id:'o2',f:'O2',n:'Oxygen gas',u:'21% of the air you breathe.'},
  {id:'n2',f:'N2',n:'Nitrogen gas',u:'78% of the air; the triple bond is why it barely reacts.'},
  {id:'cl2',f:'Cl2',n:'Chlorine gas',u:'Used to disinfect drinking water and to make bleach.'},
  {id:'hcl',f:'ClH',n:'Hydrogen chloride',u:'Dissolved in water it is hydrochloric acid, the acid in your stomach.'},
  {id:'h2o',f:'H2O',n:'Water',u:'About 60% of your body.'},
  {id:'h2o2',f:'H2O2',n:'Hydrogen peroxide',u:'The 3% bottle in a first-aid kit.'},
  {id:'co2',f:'CO2',n:'Carbon dioxide',u:'You breathe it out; it is the fizz in soda.'},
  {id:'ch4',f:'CH4',n:'Methane',u:'Natural gas, burned in gas stoves and furnaces.'},
  {id:'nh3',f:'H3N',n:'Ammonia',u:'Farm fertilizer and some window cleaners.'},
  {id:'ch2o',f:'CH2O',n:'Formaldehyde',u:'Preserves biology specimens.'},
  {id:'c2h6',f:'C2H6',n:'Ethane',u:'Part of natural gas.'},
  {id:'c3h8',f:'C3H8',n:'Propane',u:'The fuel in gas-grill tanks.'},
  {id:'c2h4',f:'C2H4',n:'Ethylene',u:'Ripening fruit gives it off; it ripens other fruit nearby.',lvl:'honors'},
  {id:'c2h2',f:'C2H2',n:'Acetylene',u:'Burns in welding torches at over 3,000 °C.',lvl:'honors'},
  {id:'ch3oh',f:'CH4O',n:'Methanol',u:'In windshield-washer fluid.',lvl:'honors'},
  {id:'etoh',f:'C2H6O',n:'Ethanol',u:'The alcohol in hand sanitizer and in E10 gasoline.',lvl:'honors',test:s=>!ether(s)},
  {id:'dme',f:'C2H6O',n:'Dimethyl ether',u:'A propellant in some spray cans; a gas at room temperature.',lvl:'honors',test:s=>ether(s)}
];
const byId={};MOL.forEach(m=>byId[m.id]=m);
/* kits: atoms to use and the order to fill */
const KITS=[
  {id:'water',l:'Water: 4 H, 2 O',kit:{H:4,O:2},order:{h2o:2}},
  {id:'ammonia',l:'Ammonia: 6 H, 2 N',kit:{H:6,N:2},order:{nh3:2}},
  {id:'air',l:'Air: 2 N, 2 O',kit:{N:2,O:2},order:{n2:1,o2:1}},
  {id:'burn',l:'Burning methane: 1 C, 4 H, 4 O',kit:{C:1,H:4,O:4},order:{co2:1,h2o:2},lvl:'honors'},
  {id:'iso',l:'Two isomers: 4 C, 12 H, 2 O',kit:{C:4,H:12,O:2},order:{etoh:1,dme:1},lvl:'honors'}
];
const kitOf=sim=>KITS.find(k=>k.id===sim.p.kit)||KITS[0];
function ether(s){const o=s.atoms.findIndex(a=>a.el==='O');if(o<0)return false;return nbrs(s,o).filter(j=>s.atoms[j].el==='C').length===2;}
function nbrs(s,i){const out=[];s.bonds.forEach(b=>{if(b.a===i)out.push(b.b);else if(b.b===i)out.push(b.a);});return out;}
const used=(s,i)=>s.bonds.reduce((t,b)=>t+((b.a===i||b.b===i)?b.o:0),0);
const open=(s,i)=>VAL[s.atoms[i].el]-used(s,i);
const totalOpen=s=>s.atoms.reduce((t,a,i)=>t+open(s,i),0);
function counts(s){const c={};s.atoms.forEach(a=>c[a.el]=(c[a.el]||0)+1);return c;}
const hill=s=>CL.hill(counts(s));
function identify(s){if(!s.atoms.length||totalOpen(s)>0)return null;const f=hill(s);return MOL.find(m=>m.f===f&&(!m.test||m.test(s)))||null;}
const fHTML=f=>CL.html(f.replace(/^ClH$/,'HCl').replace(/^H3N$/,'NH3').replace(/^CH4O$/,'CH3OH'));
const fTXT=f=>CL.fmt(f.replace(/^ClH$/,'HCl').replace(/^H3N$/,'NH3').replace(/^CH4O$/,'CH3OH'));
const showF=m=>m.id==='etoh'?'C₂H₅OH':m.id==='dme'?'CH₃OCH₃':fTXT(m.f);

/* ---------- building ---------- */
const WX0=30,WX1=530,WY0=70,WY1=400,CX=270,CY=235;
function place(s,p){if(p<0)return [CX,CY];const P=s.atoms[p];let best=null,bs=-1;
  const pref=[0,180,90,270,60,120,240,300,30,150,210,330,45,135,225,315];
  pref.forEach((d,k)=>{const a=d*Math.PI/180,x=P.x+BL*Math.cos(a),y=P.y-BL*Math.sin(a);if(x<WX0||x>WX1||y<WY0||y>WY1)return;
    let m=1e9;s.atoms.forEach(q=>{m=Math.min(m,Math.hypot(q.x-x,q.y-y));});const sc=Math.min(m,BL*1.6)-k*0.5;if(sc>bs){bs=sc;best=[x,y];}});
  return best||[P.x+BL,P.y];}
function pickActive(s){if(s.act>=0&&s.act<s.atoms.length&&open(s,s.act)>0)return;let b=-1;for(let i=s.atoms.length-1;i>=0;i--)if(open(s,i)>0&&s.atoms[i].el!=='H'){b=i;break;}if(b<0)for(let i=s.atoms.length-1;i>=0;i--)if(open(s,i)>0){b=i;break;}s.act=b;}
function kitLeft(sim,el){if(sim.p.mode!=='kit')return 99;const K=kitOf(sim).kit,st=sim.st;const inUse=st.atoms.filter(a=>a.el===el).length+st.coll.reduce((t,c)=>t+(c.cnt[el]||0),0);return (K[el]||0)-inUse;}
function addAtom(sim,el){const s=sim.st;s.msg='';off3d(s);
  if(sim.p.mode==='kit'&&kitLeft(sim,el)<=0){s.msg='The kit has no '+el+' left.';return false;}
  if(s.atoms.length>=14){s.msg='That’s enough atoms for one molecule here.';return false;}
  if(s.atoms.length&&!(s.act>=0&&open(s,s.act)>0)){pickActive(s);if(s.act<0){s.msg='Every atom is already using all its bonds: this molecule is complete. '+(sim.p.mode==='kit'?'Collect it, or press Clear.':'Press Clear to start another.');return false;}}
  const p=s.atoms.length?s.act:-1,[x,y]=place(s,p);s.atoms.push({el,x,y});const i=s.atoms.length-1;if(p>=0)s.bonds.push({a:p,b:i,o:1});
  s.hist.push({t:'add'});if(p<0||!(open(s,p)>0))s.act=-1;pickActive(s);s.res=null;return true;}
function upgrade(sim){const s=sim.st;s.msg='';off3d(s);if(s.act<0||open(s,s.act)<1){s.msg='Pick an atom that still has an open bond, then press Double bond.';return false;}
  const nb=nbrs(s,s.act).filter(j=>open(s,j)>0).reverse();if(!nb.length){s.msg=s.atoms[s.act].el+' has no neighbor with an open bond to share.';return false;}
  const j=nb[0],b=s.bonds.find(b=>(b.a===s.act&&b.b===j)||(b.a===j&&b.b===s.act));if(b.o>=3){s.msg='A triple bond is the most two atoms can share.';return false;}b.o++;s.hist.push({t:'up',b});pickActive(s);return true;}
function undo(sim){const s=sim.st,h=s.hist.pop();off3d(s);if(!h)return;if(h.t==='add'){const i=s.atoms.length-1;s.atoms.pop();s.bonds=s.bonds.filter(b=>b.a!==i&&b.b!==i);}else h.b.o--;s.act=-1;pickActive(s);s.msg='';}
function clearW(sim){const s=sim.st;off3d(s);s.atoms=[];s.bonds=[];s.hist=[];s.act=-1;s.msg='';}
function collect(sim){const s=sim.st,m=identify(s);if(!m){s.msg=s.atoms.length?'Finish the molecule first: every atom needs all its bonds.':'Build a molecule first.';return;}
  off3d(s);s.coll.push({id:m.id,cnt:counts(s),atoms:s.atoms.map(a=>({...a})),bonds:s.bonds.map(b=>({...b}))});clearW(sim);s.msg='Collected one '+m.n.toLowerCase()+'.';}
function orderState(sim){const K=kitOf(sim),st=sim.st,have={};st.coll.forEach(c=>have[c.id]=(have[c.id]||0)+1);const rows=Object.entries(K.order).map(([id,n])=>({id,n,h:have[id]||0}));return {rows,done:rows.every(r=>r.h>=r.n),extra:st.coll.filter(c=>!K.order[c.id]).length};}
const tgtMol=sim=>sim.p.mode==='build'&&sim.p.tgt!=='free'?byId[sim.p.tgt]:null;

/* ---------- 3D shape of a finished molecule ----------
   Each atom's electron domains (bonded neighbors, with a double or triple bond counting once, plus lone pairs)
   spread apart on a sphere; lone pairs push harder than bonds, which narrows bond angles (water about 104.5°).
   Double bonds keep their neighbors in one plane. Solved once by gradient descent and cached. */
const LONE={H:0,Cl:3,O:2,N:1,C:0};
function shape3d(s){const n=s.atoms.length,P=[],lp=[];
  s.atoms.forEach((a,i)=>P.push([(a.x-CX)/BL,(a.y-CY)/BL,0.3*Math.sin(i*2.3+1)]));
  s.atoms.forEach((a,i)=>{for(let j=0;j<LONE[a.el];j++){const t=i*1.7+j*2.1;lp.push({c:i,v:[Math.cos(t),Math.sin(t),0.6*Math.cos(t*1.3+j)]});}});
  lp.forEach(l=>{const L=Math.hypot(...l.v);l.v=l.v.map(q=>q/L);});
  const LEN=b=>b.o===3?0.82:b.o===2?0.9:1;const sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],nrm=a=>{const L=Math.hypot(...a)||1;return a.map(q=>q/L);};
  const N=n*3+lp.length*3;let X=new Float64Array(N);P.forEach((p,i)=>X.set(p,i*3));lp.forEach((l,j)=>X.set(l.v,n*3+j*3));
  const nb=s.atoms.map((a,i)=>nbrs(s,i));
  function E(X){let e=0;const p=i=>[X[i*3],X[i*3+1],X[i*3+2]],L=j=>nrm([X[n*3+j*3],X[n*3+j*3+1],X[n*3+j*3+2]]);
    s.bonds.forEach(b=>{const d=Math.hypot(...sub(p(b.a),p(b.b)))-LEN(b);e+=20*d*d;});
    for(let i=0;i<n;i++){const dom=nb[i].map(j=>({u:nrm(sub(p(j),p(i))),w:1}));lp.forEach((l,j)=>{if(l.c===i)dom.push({u:L(j),w:1.27});});
      for(let a=0;a<dom.length;a++)for(let b=a+1;b<dom.length;b++){const d=Math.hypot(...sub(dom[a].u,dom[b].u))+0.05;e+=dom[a].w*dom[b].w/(d*d);}}
    for(let i=0;i<n;i++)for(let j=i+1;j<n;j++){if(nb[i].includes(j))continue;const d=Math.hypot(...sub(p(i),p(j)));if(d<1.5)e+=0.6*(1.5-d)*(1.5-d);}
    s.bonds.forEach(b=>{if(b.o<2)return;const A=b.a,B=b.b,oa=nb[A].filter(j=>j!==B),ob=nb[B].filter(j=>j!==A);if(oa.length<2)return;
      const nr=nrm(cross(sub(p(oa[0]),p(A)),sub(p(oa[1]),p(A))));ob.concat([B]).forEach(j=>{const q=dot(nr,sub(p(j),p(A)));e+=8*q*q;});});
    return e;}
  const sol={n,lp,done:false,it:0,step:0.02,get:null};const g=new Float64Array(N);
  sol.tick=function(ms){const t0=performance.now();while(!sol.done&&performance.now()-t0<ms){const e0=E(X);for(let q=0;q<N;q++){const o=X[q];X[q]=o+1e-4;g[q]=(E(X)-e0)/1e-4;X[q]=o;}
      let gm=0;for(let q=0;q<N;q++)gm=Math.max(gm,Math.abs(g[q]));const sc=Math.min(sol.step,0.15/(gm||1));const Y=X.slice();for(let q=0;q<N;q++)Y[q]-=sc*g[q];
      if(E(Y)<e0){X=Y;sol.step*=1.15;}else sol.step*=0.5;if(sol.step<1e-9||++sol.it>4000||gm<1e-5)sol.done=true;}
    return read();};
  sol.solve=()=>{while(!sol.done)sol.tick(1000);return read();};
  function read(){const pts=[];for(let i=0;i<n;i++)pts.push([X[i*3],X[i*3+1],X[i*3+2]]);
  const cm=[0,1,2].map(c=>pts.reduce((t,p)=>t+p[c],0)/n);pts.forEach(p=>{p[0]-=cm[0];p[1]-=cm[1];p[2]-=cm[2];});
  const lps=lp.map((l,j)=>({c:l.c,u:nrm([X[n*3+j*3],X[n*3+j*3+1],X[n*3+j*3+2]])}));
  return {pts,lps};}
  return sol;}
function cross(a,b){return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];}
function angleAt(g,s,i){const nb=nbrs(s,i);if(nb.length<2)return null;const v=j=>[g.pts[j][0]-g.pts[i][0],g.pts[j][1]-g.pts[i][1],g.pts[j][2]-g.pts[i][2]];
  const a=v(nb[0]),b=v(nb[1]);return Math.acos(Math.max(-1,Math.min(1,(a[0]*b[0]+a[1]*b[1]+a[2]*b[2])/Math.hypot(...a)/Math.hypot(...b))))*180/Math.PI;}

const off3d=s=>{s.v3d=false;s.sol=null;s.g=null;};
function shapeName(s,c){const nb=nbrs(s,c).length,lp=LONE[s.atoms[c].el],d=nb+lp;
  if(d===2)return 'Linear';if(d===3)return lp?'Bent':'Trigonal planar';if(d===4)return lp===0?'Tetrahedral':lp===1?'Trigonal pyramidal':'Bent';return '';}
function center(s){let c=-1,b=-1;s.atoms.forEach((a,i)=>{if(a.el==='H')return;const n=nbrs(s,i).length;if(n>b){b=n;c=i;}});return c;}
function toggle3d(sim){const s=sim.st;if(s.v3d){off3d(s);s.msg='';return;}const m=identify(s);if(!m){s.msg=s.atoms.length?'Finish the molecule first: every atom needs all its bonds.':'Build a molecule first.';return;}
  if(s.atoms.length<2){s.msg='One atom has no shape to show.';return;}s.v3d=true;s.msg='';s.sol=shape3d(s);s.g=s.sol.tick(0);s.rot=0.5;}

/* ---------- tool ---------- */
const BUILD={
  id:'buildmol',hash:'buildmol',apUnit:5,order:2,tab:'Build a molecule',kind:'Simulation',next:['lewis','vsepr'],
  card:'Snap atoms together to build water, carbon dioxide, methane and more. Learn how many bonds each atom makes, what a formula’s numbers mean, and why the same atoms can make two different molecules.',
  title:'Build a molecule',
  lede:{bio:'Atoms bond by sharing electrons, and each kind of atom makes a set number of bonds: hydrogen 1, oxygen 2, nitrogen 3, carbon 4. A molecule is finished when every atom has used all its bonds.',
        honors:'Sometimes two atoms share two or three pairs: double and triple bonds. And the same atoms can join in different orders to make different molecules, called isomers.',
        ap:'Each bond is a shared pair of electrons. Count shared and lone pairs to connect the model you build with its Lewis structure.'},
  scale:{bio:'Atoms are drawn in standard CPK colors (carbon gray, hydrogen white, oxygen red, nitrogen blue, chlorine green), sized roughly to scale. You build molecules flat so the bonds are easy to count; View in 3D shows a finished molecule’s real shape.'},
  timeless:true,animated:true,graph:false,
  controls:[
    {id:'mode',label:'Activity',type:'seg',def:'build',lvl:'bio',noTrial:true,options:[{v:'build',l:'Build a molecule'},{v:'kit',l:'Fill an order from a kit'}],onChange(sim){clearW(sim);sim.st.coll=[];sync(sim);}},
    {id:'tgt',label:'Molecule to build',type:'select',def:'h2o',lvl:'bio',modes:['build'],options:[{v:'free',l:'Free build'}].concat(MOL.map(m=>({v:m.id,l:m.n,lvl:m.lvl}))),onChange(sim){clearW(sim);}},
    {id:'kit',label:'Kit',type:'select',def:'water',lvl:'bio',modes:['kit'],options:KITS.map(k=>({v:k.id,l:k.l,lvl:k.lvl})),onChange(sim){clearW(sim);sim.st.coll=[];sync(sim);}}
  ],
  actions:[
    {id:'addC',label:'+ C',lvl:'bio',run(sim){addAtom(sim,'C');}},
    {id:'addH',label:'+ H',lvl:'bio',run(sim){addAtom(sim,'H');}},
    {id:'addO',label:'+ O',lvl:'bio',run(sim){addAtom(sim,'O');}},
    {id:'addN',label:'+ N',lvl:'bio',run(sim){addAtom(sim,'N');}},
    {id:'addCl',label:'+ Cl',lvl:'bio',run(sim){addAtom(sim,'Cl');}},
    {id:'dbl',label:'Double bond',lvl:'bio',run(sim){upgrade(sim);}},
    {id:'next',label:'Next atom',lvl:'bio',run(sim){const s=sim.st,n=s.atoms.length;for(let k=1;k<=n;k++){const i=(s.act+k+n)%n;if(open(s,i)>0){s.act=i;return;}}}},
    {id:'v3d',label:'View in 3D',lvl:'bio',run(sim){toggle3d(sim);}},
    {id:'undo',label:'Undo',lvl:'bio',run(sim){undo(sim);}},
    {id:'clear',label:'Clear',lvl:'bio',run(sim){clearW(sim);}},
    {id:'collect',label:'Collect it',lvl:'bio',primary:true,modes:['kit'],run(sim){collect(sim);}}
  ],
  init(sim){return {atoms:[],bonds:[],hist:[],act:-1,coll:[],msg:'',res:null,v3d:false,sol:null,g:null,rot:0.5};},
  step(){},
  metrics:[
    {id:'formula',label:'Formula',unit:'',lvl:'bio',text:true,get:s=>s.st.atoms.length?fTXT(hill(s.st)):'—'},
    {id:'open',label:'Open bonds left',unit:'',lvl:'bio',min:0,max:12,d:0,get:s=>totalOpen(s.st)},
    {id:'name',label:'You built',unit:'',lvl:'bio',text:true,get:s=>{const m=identify(s.st);return m?m.n:s.st.atoms.length?(totalOpen(s.st)>0?'not finished':'a molecule not in this kit'):'—';}},
    {id:'shape',label:'Shape (3D)',unit:'',lvl:'bio',text:true,get:s=>{const st=s.st;if(!identify(st)||st.atoms.length<2)return '—';const c=center(st);return st.atoms.length===2?'Linear':shapeName(st,c)+(nbrs(st,c).length+st.atoms.filter(a=>a.el!=='H').length>5?' (around '+st.atoms[c].el+')':'');}},
    {id:'natoms',label:'Atoms',unit:'',lvl:'bio',min:0,max:14,d:0,get:s=>s.st.atoms.length},
    {id:'pairs',label:'Shared electron pairs (bonds)',unit:'',lvl:'honors',min:0,max:16,d:0,get:s=>s.st.bonds.reduce((t,b)=>t+b.o,0)},
    {id:'lone',label:'Lone pairs',unit:'',lvl:'ap',min:0,max:16,d:0,get:s=>{const st=s.st;if(!st.atoms.length)return 0;let v=0;st.atoms.forEach(a=>v+=CL.valence(a.el));const sh=2*st.bonds.reduce((t,b)=>t+b.o,0);return Math.max(0,(v-sh)/2);}},
    {id:'velec',label:'Valence electrons in all',unit:'',lvl:'ap',min:0,max:60,d:0,get:s=>s.st.atoms.reduce((t,a)=>t+CL.valence(a.el),0)}
  ],
  challenges:[
    {lvl:'bio',instant:true,q:'How many hydrogen atoms are in 3 H₂O?',choices:['6','5','3','2'],correct:0,explain:'The coefficient 3 counts molecules; the subscript 2 counts hydrogens in each one. 3 molecules × 2 H = 6 hydrogen atoms, and 3 oxygen atoms.'},
    {lvl:'bio',instant:true,q:'How many bonds does a carbon atom make in a finished molecule?',choices:['4','2','1','It depends on the molecule, from 1 to 8'],correct:0,explain:'Carbon has 4 valence electrons and shares all 4, so it always makes 4 bonds in total, counting a double bond as 2. That is why methane is CH₄.'},
    {lvl:'bio',instant:true,q:'In carbon dioxide, O=C=O, why are there double bonds?',choices:['Carbon needs 4 bonds and each oxygen 2, so they share two each','Oxygen atoms always form double bonds with any partner atom','Double bonds are what make carbon dioxide a gas','Carbon has extra electrons it must give to each oxygen'],correct:0,explain:'With single bonds, carbon would have only 2 of its 4 bonds and each oxygen only 1 of 2. Sharing two bonds with each oxygen fills everyone: 2 + 2 = 4 for carbon, 2 for each oxygen.'},
    {lvl:'bio',instant:true,q:'What is the difference between 2H₂O and H₄O₂?',choices:['2H₂O is two water molecules; H₄O₂ would be one new molecule','They mean the same thing; H₄O₂ is a shorter way to write it','H₄O₂ has twice the hydrogen of 2H₂O, so it is heavier','Both describe two water molecules stuck together as one'],correct:0,explain:'The coefficient (2) counts whole molecules. Subscripts are part of the molecule itself. Changing them makes a different substance, so you never change subscripts to balance an equation.'},
    {lvl:'honors',instant:true,q:'Ethanol and dimethyl ether are both C₂H₆O. What makes them different?',choices:['Their atoms are connected in a different order','One has more hydrogen atoms than the other','One of them is ionic and the other covalent','Nothing; they are two names for one molecule'],correct:0,explain:'They are isomers. In ethanol, C–C–O–H: the oxygen is at the end with an H on it, so ethanol is a liquid that mixes with water. In dimethyl ether, C–O–C, the oxygen sits between the carbons, and it is a gas at room temperature.'},
    {lvl:'honors',instant:true,q:'Nitrogen gas is N₂. What kind of bond holds the two nitrogens together?',choices:['A triple bond','A single bond','A double bond','An ionic bond'],correct:0,explain:'Each nitrogen needs 3 bonds, and the only partner is the other nitrogen, so they share three pairs: N≡N. That strong triple bond is why the nitrogen in air hardly reacts.'},
    {lvl:'ap',instant:true,q:'CO₂ has 16 valence electrons. How many are in lone pairs?',choices:['8','4','12','0'],correct:0,explain:'Two double bonds share 4 pairs, which is 8 electrons. 16 − 8 = 8 electrons, in 4 lone pairs (two on each oxygen).'}
  ],
  onClick(sim,x,y){const s=sim.st;if(s.v3d)return;let b=-1,bd=1e9;s.atoms.forEach((a,i)=>{const d=Math.hypot(a.x-x,a.y-y);if(d<RAD[a.el]+10&&d<bd){bd=d;b=i;}});if(b>=0){s.act=b;s.msg=open(s,b)>0?'':s.atoms[b].el+' is already using all its bonds.';sim.infoDirty=true;}},
  initVis(sim){sync(sim);},onLevel(sim){sync(sim);},
  onTourExit(sim){BioLab.setValues(sim,{mode:'build',tgt:'h2o'});clearW(sim);sim.st.coll=[];},
  draw(sim,ctx,vdt,k,t){ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);const s=sim.st,p=sim.p;
    // workspace frame
    ctx.strokeStyle=PAL['line'];ctx.lineWidth=1.5;rr(ctx,14,44,532,392,12);ctx.stroke();
    const tm=tgtMol(sim);txt(ctx,p.mode==='kit'?'Kit: '+kitOf(sim).l.split(':')[0]:tm?'Build: '+tm.n+' ('+showF(tm)+')':'Free build',24,30,{s:15*k,w:700});
    if(s.v3d&&s.sol){s.g=s.sol.tick(RM?40:6);if(!RM)s.rot+=Math.min(vdt||0,0.05)*0.55;draw3d(ctx,s,k);}else drawMol(ctx,s.atoms,s.bonds,1,0,0,k,s.act,true,t);
    if(sim.ui&&sim.ui.actB&&sim.ui.actB.v3d){const L=s.v3d?'Back to flat':'View in 3D';if(sim.ui.actB.v3d.textContent!==L)sim.ui.actB.v3d.textContent=L;}
    if(!s.atoms.length)wrapTxt(ctx,'Press + C, + H, + O, + N or + Cl to add an atom',CX,CY,480,14*k,PAL['cv-soft']);
    const m=identify(s);
    if(m&&s.v3d){const c=center(s),a=s.g&&s.sol.done?angleAt(s.g,s,c):null,nb=nbrs(s,c);const ang=a&&nb.length>=2?'  ·  '+s.atoms[nb[0]].el+'–'+s.atoms[c].el+'–'+s.atoms[nb[1]].el+' '+(Math.abs(a-180)<1?'180':a.toFixed(1))+'°':'';pill(ctx,(s.atoms.length===2?'Linear':shapeName(s,c))+ang,CX,418,'#1f5fbf','#fff',13.5*k);}
    else if(m)pill(ctx,'✓ '+m.n+'  ·  '+showF(m),CX,418,'#1b7a3a','#fff',13.5*k);
    else if(s.atoms.length&&totalOpen(s)===0)pill(ctx,'Complete, but not one of this tool’s molecules',CX,418,'#555','#fff',12.5*k);
    else if(s.atoms.length)pill(ctx,totalOpen(s)+' open bond'+(totalOpen(s)===1?'':'s')+' left: the gray stubs',CX,418,'rgba(0,0,0,.6)','#fff',12.5*k);
    if(s.msg)wrapTxt(ctx,s.msg,CX,64,500,12.5*k,'#b3261e');
    // right panel
    const X0=560;
    if(p.mode==='kit')drawKit(sim,ctx,k,X0);else if(!sim.lnKey)drawLegend(sim,ctx,k,X0,m,tm);},
  infoPanel(sim){const s=sim.st,p=sim.p,m=identify(s),tm=tgtMol(sim);
    if(p.mode==='kit'){const o=orderState(sim);return '<div class="p-head"><h3>The order</h3></div><p>'+o.rows.map(r=>'<b>'+r.n+' '+showF(byId[r.id])+'</b> ('+byId[r.id].n.toLowerCase()+'): '+r.h+' collected').join('<br>')+'</p>'+(o.done?'<p class="verdict ok">Order filled.</p><p>Every atom in the kit ended up in a finished molecule. The big numbers (coefficients) count molecules; the small numbers (subscripts) count atoms inside each one.</p>':'<p>Build one molecule, press <b>Collect it</b>, then build the next.</p>');}
    if(!tm)return m?'<div class="p-head"><h3>'+m.n+'</h3></div><p>'+m.u+'</p>':'';
    if(m&&m.id===tm.id)return '<div class="p-head"><h3>You built '+m.n.toLowerCase()+'</h3></div><p class="verdict ok">Correct.</p><p>'+m.u+'</p>';
    if(m&&m.f===tm.f)return '<p class="verdict no">Same atoms, different molecule.</p><p>You built '+m.n.toLowerCase()+'. It has the same formula as '+tm.n.toLowerCase()+', but the atoms are joined in a different order: they are isomers.</p>';
    if(m)return '<p class="verdict no">That is '+m.n.toLowerCase()+', not '+tm.n.toLowerCase()+'.</p><p>Press <b>Clear</b> and try again. '+tm.n+' is '+showF(tm)+'.</p>';
    return '';},
  narrate(sim){const s=sim.st,p=sim.p,m=identify(s);
    if(p.mode==='kit'){const o=orderState(sim);if(o.done)return '<b>Order filled.</b> '+o.rows.map(r=>r.n+' '+showF(byId[r.id])).join(' + ')+' used every atom in the kit. The coefficient in front counts molecules; the subscripts count atoms in each molecule.';
      return 'Kit atoms left: '+Object.keys(kitOf(sim).kit).map(el=>el+' '+kitLeft(sim,el)).join(', ')+'. Build one molecule at a time and <b>collect</b> it.';}
    if(!s.atoms.length)return 'Each kind of atom makes a set number of bonds: <b>H 1, Cl 1, O 2, N 3, C 4</b>. Add an atom to start.';
    if(m)return 'Every atom is using all its bonds, so this is a finished molecule: <b>'+m.n.toLowerCase()+', '+showF(m)+'</b>. '+m.u;
    const a=s.act>=0?s.atoms[s.act]:null;
    return (a?'The highlighted '+a.el+' has <b>'+open(s,s.act)+' open bond'+(open(s,s.act)===1?'':'s')+'</b>. New atoms attach to it; click another atom (or press Next atom) to switch. ':'')+'If two neighbors both still have open bonds, <b>Double bond</b> lets them share another pair.';},
  tour:[
    {title:'Each atom makes a set number of bonds',text:'Hydrogen and chlorine make 1 bond, oxygen 2, nitrogen 3, carbon 4. The gray stubs on an atom are bonds it still needs.',pause:true,setup(sim){BioLab.setValues(sim,{mode:'build',tgt:'h2o'});clearW(sim);}},
    {title:'Water',text:'Oxygen needs 2 bonds, so it holds 2 hydrogens: H₂O. Every atom is filled, so the molecule is finished.',pause:true,setup(sim){clearW(sim);['O','H','H'].forEach(e=>addAtom(sim,e));}},
    {title:'Double bonds',text:'Carbon needs 4 bonds and each oxygen 2. With single bonds there are stubs left over, so carbon shares two bonds with each oxygen: O=C=O.',pause:true,setup(sim){BioLab.setValues(sim,{tgt:'co2'});clearW(sim);['C','O','O'].forEach(e=>addAtom(sim,e));sim.st.act=0;upgrade(sim);sim.st.act=0;upgrade(sim);}},
    {title:'Coefficients count molecules',text:'In the kit, 4 H and 2 O make 2 H₂O: two molecules, each with 2 H. The 2 in front is a coefficient; the small 2 is a subscript.',pause:true,setup(sim){BioLab.setValues(sim,{mode:'kit',kit:'water'});clearW(sim);sim.st.coll=[];['O','H','H'].forEach(e=>addAtom(sim,e));collect(sim);['O','H','H'].forEach(e=>addAtom(sim,e));collect(sim);}}
  ],
  lab:{bio:'<p><b>Question:</b> How many of each atom does each molecule need?</p><ol><li>Build water, ammonia, methane and carbon dioxide.</li><li>For each, record the formula and how many bonds the central atom makes.</li></ol><p>Explain how an atom’s number of bonds decides the formula.</p>',
       honors:'<p><b>Question:</b> When do molecules need double or triple bonds?</p><ol><li>Build O₂, N₂, CO₂, ethylene (C₂H₄) and acetylene (C₂H₂).</li><li>Record every multiple bond.</li><li>Use the two-isomer kit to build both C₂H₆O molecules.</li></ol><p>Explain why two different molecules can share one formula.</p>',
       ap:'<p><b>Question:</b> Does every molecule you build follow the octet rule?</p><ol><li>For six molecules, record valence electrons, shared pairs and lone pairs.</li><li>Check: 2 × (shared + lone pairs) = valence electrons.</li></ol><p>Draw the Lewis structure of each and compare it with the model.</p>'},
  terms:[{t:'Covalent bond',d:'A pair of electrons shared between two atoms.'},{t:'Bonding capacity',d:'How many bonds an atom makes: H 1, Cl 1, O 2, N 3, C 4.'},{t:'Molecular formula',d:'Which atoms are in one molecule and how many of each, like H₂O.'},
    {t:'Subscript',d:'The small number after a symbol: atoms of that element in one molecule.'},{t:'Coefficient',d:'The number in front of a formula: how many molecules.'},
    {lvl:'honors',t:'Double and triple bond',d:'Two atoms sharing two or three pairs of electrons.'},{lvl:'honors',t:'Isomers',d:'Molecules with the same formula but atoms joined in a different order.'},{lvl:'honors',t:'Structural formula',d:'A drawing or formula that shows which atoms are joined, like CH₃CH₂OH.'},
    {lvl:'ap',t:'Lone pair',d:'A pair of valence electrons on one atom that is not shared in a bond.'}],
  about:'<p>Each atom’s bonding capacity is its usual number of covalent bonds in neutral molecules (H 1, Cl 1, O 2, N 3, C 4). New atoms attach to the highlighted atom at the most open spot. A molecule counts as finished when every atom uses its full capacity, and it is named by its formula; the two C₂H₆O isomers are told apart by whether the oxygen is bonded to two carbons.</p><p>Molecules are built flat so every bond is easy to see and count. View in 3D finds each finished molecule’s shape by letting the electron domains around every atom (bonded atoms, with a double or triple bond counting once, plus lone pairs) push apart, with lone pairs pushing harder than bonds. That gives the textbook shapes and angles: CO₂ 180°, CH₂O about 120°, CH₄ 109.5°, NH₃ about 107° and H₂O about 104.5°. The Molecule shapes tool explains why. Ions, formal charges and expanded octets are left to the Lewis structures tool.</p>'
};

function sync(sim){const u=sim.ui;if(!u||!u.ctlW)return;const d=sim.def,m=sim.p.mode;
  d.controls.forEach(c=>{const w=u.ctlW[c.id];if(w&&c.modes)w.hidden=!atLeast(c.lvl)||!c.modes.includes(m);});
  d.actions.forEach(a=>{const b=u.actB&&u.actB[a.id];if(!b)return;if(a.modes)b.hidden=!atLeast(a.lvl)||!a.modes.includes(m);else if(a.id.startsWith('add'))b.hidden=!atLeast(a.lvl)||(m==='kit'&&!(kitOf(sim).kit[a.id.slice(3)]>0));});}

function wrapTxt(ctx,str,cx,y,w,sz,c){ctx.font='700 '+sz+'px '+FONT;const words=str.split(' '),lines=[];let cur='';words.forEach(wd=>{const t=cur?cur+' '+wd:wd;if(ctx.measureText(t).width>w&&cur){lines.push(cur);cur=wd;}else cur=t;});if(cur)lines.push(cur);
  lines.forEach((l,i)=>txt(ctx,l,cx,y+i*sz*1.3,{s:sz,w:700,a:'center',c}));}
function draw3d(ctx,s,k){const g=s.g;if(!g)return;const cy=Math.cos(s.rot),sy=Math.sin(s.rot),tx=0.38,cx=Math.cos(tx),sx=Math.sin(tx);
  const R=p=>{const x=p[0]*cy+p[2]*sy,z0=-p[0]*sy+p[2]*cy,y=p[1]*cx-z0*sx,z=p[1]*sx+z0*cx;return [x,y,z];};
  let ext=0;g.pts.forEach(p=>ext=Math.max(ext,Math.hypot(...p)));const S=Math.min(BL*1.5,165/Math.max(ext,0.6)),PJ=p=>{const f=1/(1+p[2]*0.09);return [CX+p[0]*S*f,CY+p[1]*S*f,f];};
  const items=[];const P=g.pts.map(R);
  s.bonds.forEach(b=>{items.push({z:(P[b.a][2]+P[b.b][2])/2,d(){const A=PJ(P[b.a]),B=PJ(P[b.b]),dx=B[0]-A[0],dy=B[1]-A[1],L=Math.hypot(dx,dy)||1,nx=-dy/L,ny=dx/L,gp=6;ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=5;
    (b.o===1?[0]:b.o===2?[-gp/2,gp/2]:[-gp,0,gp]).forEach(o=>{ctx.beginPath();ctx.moveTo(A[0]+nx*o,A[1]+ny*o);ctx.lineTo(B[0]+nx*o,B[1]+ny*o);ctx.stroke();});}});});
  g.lps.forEach(l=>{const a=g.pts[l.c],q=R([a[0]+l.u[0]*0.5,a[1]+l.u[1]*0.5,a[2]+l.u[2]*0.5]);items.push({z:q[2],d(){const Q=PJ(q),A=PJ(P[l.c]);ctx.save();ctx.globalAlpha=0.38;ctx.fillStyle='#8e5bd6';ctx.beginPath();const an=Math.atan2(Q[1]-A[1],Q[0]-A[0]),len=Math.hypot(Q[0]-A[0],Q[1]-A[1]);ctx.ellipse(Q[0],Q[1],Math.max(9,len*0.55+6)*Q[2],13*Q[2],an,0,Math.PI*2);ctx.fill();ctx.restore();}});});
  s.atoms.forEach((a,i)=>items.push({z:P[i][2]-0.01,d(){const Q=PJ(P[i]);CL.drawAtom(ctx,Q[0],Q[1],RAD[a.el]*Q[2]*1.05,a.el,{s:Math.max(10,RAD[a.el]*Q[2]*0.85)});}}));
  items.sort((a,b)=>b.z-a.z).forEach(it=>it.d());
  if(g.lps.length)wrapTxt(ctx,'Purple clouds: lone pairs (electron pairs that are not shared)',CX,96,480,11.5*k,'#6a3fa0');}
/* atoms and bonds; sc scales, ox/oy offsets (for the mini drawings) */
function drawMol(ctx,atoms,bonds,sc,ox,oy,k,act,stubs,t){const X=a=>ox+a.x*sc,Y=a=>oy+a.y*sc;
  bonds.forEach(b=>{const A=atoms[b.a],B=atoms[b.b],dx=X(B)-X(A),dy=Y(B)-Y(A),L=Math.hypot(dx,dy)||1,nx=-dy/L,ny=dx/L,g=6*sc;ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=Math.max(2,5*sc);
    const offs=b.o===1?[0]:b.o===2?[-g/2,g/2]:[-g,0,g];offs.forEach(o=>{ctx.beginPath();ctx.moveTo(X(A)+nx*o,Y(A)+ny*o);ctx.lineTo(X(B)+nx*o,Y(B)+ny*o);ctx.stroke();});});
  atoms.forEach((a,i)=>{const r=RAD[a.el]*sc;
    if(stubs){const s={atoms,bonds},n=VAL[a.el]-used(s,i);if(n>0){const taken=nbrs(s,i).map(j=>Math.atan2(-(atoms[j].y-a.y),atoms[j].x-a.x));const cand=[];for(let d=0;d<360;d+=30){const an=d*Math.PI/180;let ok=true;taken.forEach(tk=>{let dd=Math.abs(((an-tk)+3*Math.PI)%(2*Math.PI)-Math.PI);if(dd<0.9)ok=false;});if(ok)cand.push(an);}
        const pick=[];for(const c of cand){if(pick.length>=n)break;if(pick.every(q=>Math.abs(((c-q)+3*Math.PI)%(2*Math.PI)-Math.PI)>1.0))pick.push(c);}
        pick.forEach(an=>{ctx.strokeStyle='#9aa0a6';ctx.lineWidth=5;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(X(a)+Math.cos(an)*r,Y(a)-Math.sin(an)*r);ctx.lineTo(X(a)+Math.cos(an)*(r+14),Y(a)-Math.sin(an)*(r+14));ctx.stroke();ctx.lineCap='butt';});}}
    CL.drawAtom(ctx,X(a),Y(a),r,a.el,{ring:i===act?'#c8102e':null,s:Math.max(10,r*0.85)});});}
function drawLegend(sim,ctx,k,X0,m,tm){txt(ctx,'Bonds each atom makes',X0,64,{s:13*k,w:700});
  [['H',1],['Cl',1],['O',2],['N',3],['C',4]].forEach(([el,n],i)=>{const y=96+i*44;CL.drawAtom(ctx,X0+18,y,RAD[el]*0.8,el,{s:12});for(let j=0;j<n;j++){const an=(90-j*360/Math.max(n,1))*Math.PI/180;ctx.strokeStyle='#9aa0a6';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(X0+18+Math.cos(an)*RAD[el]*0.8,y-Math.sin(an)*RAD[el]*0.8);ctx.lineTo(X0+18+Math.cos(an)*(RAD[el]*0.8+9),y-Math.sin(an)*(RAD[el]*0.8+9));ctx.stroke();}
    txt(ctx,(el==='Cl'?'Chlorine':el==='H'?'Hydrogen':el==='O'?'Oxygen':el==='N'?'Nitrogen':'Carbon')+': '+n,X0+56,y+4,{s:12.5*k,w:600});});
  const y0=330;if(tm){ctx.strokeStyle=PAL['line'];rr(ctx,X0-6,y0-22,236,104,10);ctx.stroke();txt(ctx,'Goal',X0+4,y0-4,{s:12*k,w:700,c:PAL['cv-soft']});txt(ctx,tm.n,X0+4,y0+18,{s:15*k,w:700});txt(ctx,showF(tm),X0+4,y0+42,{s:20*k,w:700});
    if(m&&m.id===tm.id)pill(ctx,'Done!',X0+190,y0+30,'#1b7a3a','#fff',13*k);}}
function drawKit(sim,ctx,k,X0){const K=kitOf(sim),o=orderState(sim),s=sim.st;txt(ctx,'Kit atoms left',X0,64,{s:13*k,w:700});
  Object.keys(K.kit).forEach((el,i)=>{const y=96+i*40,n=kitLeft(sim,el);CL.drawAtom(ctx,X0+16,y,RAD[el]*0.75,el,{s:11,alpha:n>0?1:0.3});txt(ctx,'× '+n,X0+40,y+5,{s:15*k,w:700,c:n>0?PAL['cv-ink']:PAL['cv-soft']});});
  const y0=110+Object.keys(K.kit).length*40;txt(ctx,'Order',X0,y0,{s:13*k,w:700});
  o.rows.forEach((r,i)=>{const y=y0+24+i*26;txt(ctx,r.n+' '+showF(byId[r.id]),X0,y,{s:15*k,w:700});txt(ctx,r.h+' of '+r.n,X0+150,y,{s:12.5*k,c:r.h>=r.n?'#1b7a3a':PAL['cv-soft'],w:700});});
  // collected molecules
  const cy=y0+40+o.rows.length*26;txt(ctx,'Collected',X0,cy,{s:13*k,w:700});
  s.coll.slice(-6).forEach((c,i)=>{const bx=X0+(i%3)*76,by=cy+14+Math.floor(i/3)*64;ctx.strokeStyle=PAL['line'];rr(ctx,bx,by,70,58,8);ctx.stroke();
    const xs=c.atoms.map(a=>a.x),ys=c.atoms.map(a=>a.y),mx=(Math.min(...xs)+Math.max(...xs))/2,my=(Math.min(...ys)+Math.max(...ys))/2,w=Math.max(60,Math.max(...xs)-Math.min(...xs)+40),h=Math.max(50,Math.max(...ys)-Math.min(...ys)+40),sc=Math.min(60/w,46/h);
    drawMol(ctx,c.atoms,c.bonds,sc,bx+35-mx*sc,by+29-my*sc,k,-1,false,0);});
  if(o.done)pill(ctx,'Order filled!',X0+110,436,'#1b7a3a','#fff',13*k);}

BioLab.register(BUILD);
})();
