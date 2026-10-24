(function(){
'use strict';
const {clamp,rr,txt,pill,atLeast,PAL,FONT,RM,lvText}=BioLab.h;
const CL=window.ChemLab;
const D2R=Math.PI/180;

/* ---------- vectors and rotations ---------- */
const nrm=v=>{const l=Math.hypot(v[0],v[1],v[2])||1;return [v[0]/l,v[1]/l,v[2]/l];};
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const mul=(M,v)=>[M[0]*v[0]+M[1]*v[1]+M[2]*v[2],M[3]*v[0]+M[4]*v[1]+M[5]*v[2],M[6]*v[0]+M[7]*v[1]+M[8]*v[2]];
const mm=(A,B)=>{const C=new Array(9);for(let i=0;i<3;i++)for(let j=0;j<3;j++)C[i*3+j]=A[i*3]*B[j]+A[i*3+1]*B[3+j]+A[i*3+2]*B[6+j];return C;};
function axisRot(a,th){const [x,y,z]=nrm(a),c=Math.cos(th),s=Math.sin(th),t=1-c;return [t*x*x+c,t*x*y-s*z,t*x*z+s*y,t*x*y+s*z,t*y*y+c,t*y*z-s*x,t*x*z-s*y,t*y*z+s*x,t*z*z+c];}
function ortho(M){let a=nrm([M[0],M[1],M[2]]),b=[M[3],M[4],M[5]];const d=dot(a,b);b=nrm([b[0]-d*a[0],b[1]-d*a[1],b[2]-d*a[2]]);return [...a,...b,...cross(a,b)];}
const eqv=phi=>[Math.cos(phi*D2R),0,Math.sin(phi*D2R)];

/* ---------- VSEPR geometry with measured bond angles (same construction as Molecule shapes) ---------- */
const TET=109.47;
function construct(nb,nl,P){P=P||{};const n=nb+nl;let B=[];if(nb===1)return [[1,0,0]];
  const tet=[[0,1,0]].concat([90,210,330].map(f=>[Math.sin(TET*D2R)*Math.cos(f*D2R),Math.cos(TET*D2R),Math.sin(TET*D2R)*Math.sin(f*D2R)]));
  if(n===1)B=[[1,0,0]];
  else if(n===2)B=nb===2?[[1,0,0],[-1,0,0]]:[[1,0,0]];
  else if(n===3){const t=(P.a||120)*D2R/2;B=nb===3?[[0,1,0],[Math.sin(t),-Math.cos(t),0],[-Math.sin(t),-Math.cos(t),0]]:[[Math.sin(t),-Math.cos(t),0],[-Math.sin(t),-Math.cos(t),0]];}
  else if(n===4){if(nb===4)B=tet;else if(nb===3){const c=Math.cos((P.a||TET)*D2R),ca=Math.sqrt((2*c+1)/3),sa=Math.sqrt(1-ca*ca);B=[90,210,330].map(f=>[sa*Math.cos(f*D2R),-ca,sa*Math.sin(f*D2R)]);}
    else{const t=(P.a||TET)*D2R/2;B=[[Math.sin(t),-Math.cos(t),0],[-Math.sin(t),-Math.cos(t),0]];}}
  else if(n===5){const ax=[[0,1,0],[0,-1,0]],E=[90,210,330].map(eqv);
    if(nb===5)B=ax.concat(E);
    else if(nb===4){const te=(P.e||120)/2,d=(180-(P.x||180))/2*D2R,c=eqv(30);B=[[Math.sin(d)*c[0],Math.cos(d),Math.sin(d)*c[2]],[Math.sin(d)*c[0],-Math.cos(d),Math.sin(d)*c[2]],eqv(30+te),eqv(30-te)];}
    else if(nb===3){const e=(90-(P.a||90))*D2R;B=[eqv(90),[0,Math.cos(e),Math.sin(e)],[0,-Math.cos(e),Math.sin(e)]];}
    else B=ax;}
  else{if(nb===6)B=[[0,1,0],[0,-1,0],[1,0,0],[-1,0,0],[0,0,1],[0,0,-1]];
    else if(nb===5){const t=(P.a||90)*D2R;B=[[0,-1,0]].concat([[1,0],[0,1],[-1,0],[0,-1]].map(([x,z])=>[Math.sin(t)*x,-Math.cos(t),Math.sin(t)*z]));}
    else B=[[1,0,0],[-1,0,0],[0,0,1],[0,0,-1]];}
  return B.map(nrm);}

/* ---------- molecules: measured dipole moments in debye (CRC Handbook) ---------- */
const MOLS=[
  {id:'H2',f:'H2',name:'hydrogen',c:'H',L:['H'],lp:0,mu:0},
  {id:'HCl',f:'HCl',name:'hydrogen chloride',c:'Cl',L:['H'],lp:3,mu:1.08},
  {id:'HF',f:'HF',name:'hydrogen fluoride',c:'F',L:['H'],lp:3,mu:1.82},
  {id:'CO2',f:'CO2',name:'carbon dioxide',c:'C',L:['O','O'],lp:0,bo:[2,2],mu:0},
  {id:'H2O',f:'H2O',name:'water',c:'O',L:['H','H'],lp:2,P:{a:104.5},mu:1.85},
  {id:'CH4',f:'CH4',name:'methane',c:'C',L:['H','H','H','H'],lp:0,mu:0},
  {id:'NH3',f:'NH3',name:'ammonia',c:'N',L:['H','H','H'],lp:1,P:{a:106.7},mu:1.47},
  {id:'CCl4',f:'CCl4',name:'carbon tetrachloride',c:'C',L:['Cl','Cl','Cl','Cl'],lp:0,mu:0},
  {id:'CHCl3',f:'CHCl3',name:'chloroform',c:'C',L:['H','Cl','Cl','Cl'],lp:0,mu:1.04},
  {id:'CH2Cl2',f:'CH2Cl2',name:'dichloromethane',c:'C',L:['H','H','Cl','Cl'],lp:0,mu:1.60,lvl:'honors'},
  {id:'CH3Cl',f:'CH3Cl',name:'chloromethane',c:'C',L:['Cl','H','H','H'],lp:0,mu:1.87,lvl:'honors'},
  {id:'BF3',f:'BF3',name:'boron trifluoride',c:'B',L:['F','F','F'],lp:0,mu:0,lvl:'honors'},
  {id:'SO2',f:'SO2',name:'sulfur dioxide',c:'S',L:['O','O'],lp:1,bo:[2,1],P:{a:119.5},mu:1.63,lvl:'honors'},
  {id:'CH2O',f:'CH2O',name:'formaldehyde',c:'C',L:['O','H','H'],lp:0,bo:[2,1,1],P:{a:116.5},mu:2.33,lvl:'honors'},
  {id:'HCN',f:'HCN',name:'hydrogen cyanide',c:'C',L:['H','N'],lp:0,bo:[1,3],mu:2.98,lvl:'honors'},
  {id:'H2S',f:'H2S',name:'hydrogen sulfide',c:'S',L:['H','H'],lp:2,P:{a:92.1},mu:0.97,lvl:'honors'},
  {id:'PCl3',f:'PCl3',name:'phosphorus trichloride',c:'P',L:['Cl','Cl','Cl'],lp:1,P:{a:100.3},mu:0.56,lvl:'honors'},
  {id:'SF4',f:'SF4',name:'sulfur tetrafluoride',c:'S',L:['F','F','F','F'],lp:1,P:{e:101.6,x:173.1},mu:0.63,lvl:'ap'},
  {id:'ClF3',f:'ClF3',name:'chlorine trifluoride',c:'Cl',L:['F','F','F'],lp:2,P:{a:87.5},mu:0.6,lvl:'ap'},
  {id:'BrF5',f:'BrF5',name:'bromine pentafluoride',c:'Br',L:['F','F','F','F','F'],lp:1,P:{a:84.8},mu:1.51,lvl:'ap'},
  {id:'PCl5',f:'PCl5',name:'phosphorus pentachloride',c:'P',L:['Cl','Cl','Cl','Cl','Cl'],lp:0,mu:0,lvl:'ap'},
  {id:'XeF4',f:'XeF4',name:'xenon tetrafluoride',c:'Xe',L:['F','F','F','F'],lp:2,mu:0,lvl:'ap'},
  {id:'SF6',f:'SF6',name:'sulfur hexafluoride',c:'S',L:['F','F','F','F','F','F'],lp:0,mu:0,lvl:'ap'}];
const MB={};MOLS.forEach(m=>{MB[m.id]=m;m.bo=m.bo||m.L.map(()=>1);});
const SHAPE={'1,0':'Linear','1,3':'Linear','2,0':'Linear','2,1':'Bent','2,2':'Bent','3,0':'Trigonal planar','3,1':'Trigonal pyramidal','3,2':'T-shaped','4,0':'Tetrahedral','4,1':'Seesaw','4,2':'Square planar','5,0':'Trigonal bipyramidal','5,1':'Square pyramidal','6,0':'Octahedral'};
const EN=s=>CL.el(s).en;
const ELEMS=['H','Li','Na','K','Mg','Ca','B','Al','C','Si','N','P','O','S','F','Cl','Br','I'];

/* geometry + bond dipoles for the selected molecule */
function molData(m){if(m._d)return m._d;const B=construct(m.L.length,m.lp,m.P||{}),c=EN(m.c);
  // bond dipole points toward the more electronegative atom (chemists' convention), size = ΔEN
  const bd=B.map((u,i)=>{const d=EN(m.L[i])-c;return [u[0]*d,u[1]*d,u[2]*d];});
  const net=bd.reduce((a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]],[0,0,0]);
  const q=[0].concat(m.L.map(()=>0));m.L.forEach((s,i)=>{const d=(EN(s)-c)*0.5;q[0]+=d;q[i+1]-=d;});
  const cen=B.reduce((a,u)=>[a[0]+u[0]/(B.length+1),a[1]+u[1]/(B.length+1),a[2]+u[2]/(B.length+1)],[0,0,0]);
  m._d={B,bd,net,mag:Math.hypot(...net),q,cen:m.L.length===1?cen:[0,0,0]};return m._d;}
const isPolar=m=>molData(m).mag>0.05;

function bondInfo(p){const a=CL.el(p.a),b=CL.el(p.b),d=Math.abs(a.en-b.en);
  const type=d<0.4?'Nonpolar covalent':d<=1.8?'Polar covalent':'Ionic';return {a,b,d,type,ion:100*(1-Math.exp(-d*d/4))};}
function deflection(p){if(p.rod==='none')return 0;const mu=p.liquid==='water'?1.85:0.08;return Math.min(6*(mu/1.85)/Math.pow(p.dist+1,2)*4,2*p.dist);}

function sync(sim){if(!sim.ui||!sim.ui.sec)return;const mode=sim.p.mode,d=sim.def;
  d.controls.forEach(c=>{if(!c.modes)return;const cid=d.id+'-'+c.id,e=document.getElementById(cid)||document.getElementById(cid+'-l');if(!e)return;const w=e.closest('.ctl');if(w)w.hidden=!atLeast(c.lvl)||!c.modes.includes(mode);});
  d.metrics.forEach(m=>{if(!m.modes)return;const t=sim.ui.tiles[m.id];if(!t)return;const w=t.num.closest('.tile');if(w)w.hidden=!atLeast(m.lvl)||!m.modes.includes(mode);});}
const CX=400,CY=232;

const POL={
  id:'polarity',hash:'polarity',apUnit:5,order:5,tab:'Bond and molecule polarity',kind:'Simulation',prereq:['vsepr','trends'],next:['imf'],
  card:'Pull electrons with electronegativity, add bond dipoles as vectors, watch polar molecules line up in a field, and bend a water stream.',
  title:'Polarity: uneven sharing, from bonds to molecules',
  lede:{bio:'A more electronegative atom pulls shared electrons toward itself. Find out when that makes a whole molecule polar.',
        honors:'Bond polarity comes from the electronegativity difference. Molecule polarity comes from adding the bond dipoles as vectors, so shape decides.',
        ap:'Compare the vector-sum model with measured dipole moments (debye) and estimate percent ionic character from ΔEN.'},
  scale:'Single bonds and molecules, about 0.1 to 0.3 nm across. The water stream is a real-size lab demo: a few millimeters wide.',
  timeless:true,graph:false,chChange:0.6,chReveal:3.2,
  controls:[
    {id:'mode',label:'View',type:'seg',def:'bond',lvl:'bio',options:[{v:'bond',l:'One bond'},{v:'mol',l:'Molecules'},{v:'stream',l:'Water stream'}],onChange:sync},
    {id:'a',label:'Atom A',type:'select',def:'H',lvl:'bio',modes:['bond'],options:ELEMS.map(s=>({v:s,l:s+'  '+CL.el(s).name+' (EN '+CL.el(s).en.toFixed(2)+')'}))},
    {id:'b',label:'Atom B',type:'select',def:'Cl',lvl:'bio',modes:['bond'],options:ELEMS.map(s=>({v:s,l:s+'  '+CL.el(s).name+' (EN '+CL.el(s).en.toFixed(2)+')'}))},
    {id:'mol',label:'Molecule',type:'select',def:'H2O',lvl:'bio',modes:['mol'],options:MOLS.map(m=>({v:m.id,l:CL.fmt(m.f)+'  '+m.name,lvl:m.lvl})),onChange(sim){sim.vis.w=[0,0,0];}},
    {id:'field',label:'Electric field on',type:'toggle',def:false,lvl:'bio',modes:['mol'],help:'Charged plates on each side. Polar molecules turn to line up; nonpolar ones keep tumbling.'},
    {id:'bdip',label:'Show bond dipoles',type:'toggle',def:true,lvl:'bio',modes:['mol']},
    {id:'charges',label:'Show partial charges (δ+ and δ−)',type:'toggle',def:true,lvl:'bio',modes:['bond','mol']},
    {id:'liquid',label:'Liquid in the buret',type:'seg',def:'water',lvl:'bio',modes:['stream'],options:[{v:'water',l:'Water'},{v:'hexane',l:'Hexane'}]},
    {id:'rod',label:'Charge on the rod',type:'seg',def:'neg',lvl:'bio',modes:['stream'],options:[{v:'neg',l:'Negative (−)'},{v:'none',l:'Uncharged'},{v:'pos',l:'Positive (+)'}]},
    {id:'dist',label:'Rod distance from the stream',type:'range',min:1,max:8,step:0.5,def:3,unit:' cm',lvl:'bio',modes:['stream']}
  ],
  init(){return {};},
  metrics:[
    {id:'dEN',label:'Electronegativity difference, ΔEN',unit:'',lvl:'bio',d:2,min:0,max:3.3,modes:['bond'],get:s=>bondInfo(s.p).d},
    {id:'btype',label:'Bond type',unit:'',lvl:'bio',text:true,modes:['bond'],get:s=>bondInfo(s.p).type},
    {id:'ion',label:'Ionic character (Pauling)',unit:'%',lvl:'ap',d:0,min:0,max:100,modes:['bond'],get:s=>bondInfo(s.p).ion},
    {id:'polar',label:'The molecule is',unit:'',lvl:'bio',text:true,modes:['mol'],get:s=>isPolar(MB[s.p.mol])?'Polar':'Nonpolar'},
    {id:'shape',label:'Shape',unit:'',lvl:'honors',text:true,modes:['mol'],get:s=>{const m=MB[s.p.mol];return SHAPE[m.L.length+','+m.lp];}},
    {id:'net',label:'Sum of bond dipoles (model)',unit:'ΔEN units',lvl:'honors',d:2,min:0,max:3,modes:['mol'],get:s=>molData(MB[s.p.mol]).mag},
    {id:'mu',label:'Measured dipole moment',unit:'D',lvl:'ap',d:2,min:0,max:3,modes:['mol'],get:s=>MB[s.p.mol].mu},
    {id:'defl',label:'Stream deflection at the bottom',unit:'cm',lvl:'bio',d:1,min:0,max:6,modes:['stream'],get:s=>deflection(s.p)}
  ],
  narrate(sim){const p=sim.p,hon=atLeast('honors'),ap=atLeast('ap');
    if(p.mode==='bond'){const b=bondInfo(p),hi=b.a.en>b.b.en?b.a:b.b,lo=hi===b.a?b.b:b.a;
      if(p.a===p.b)return 'Two identical '+b.a.name+' atoms pull equally, so the electrons are shared <b>evenly</b>. ΔEN = 0: a nonpolar covalent bond.';
      if(b.d<0.4)return hi.sym+' pulls only slightly harder than '+lo.sym+' (ΔEN = '+b.d.toFixed(2)+'). The sharing is almost even, so chemists call this bond <b>nonpolar covalent</b>.';
      if(b.d<=1.8)return '<b>'+hi.sym+' pulls the shared electrons toward itself</b> (EN '+hi.en.toFixed(2)+' vs '+lo.en.toFixed(2)+'). '+hi.sym+' becomes partly negative (δ−) and '+lo.sym+' partly positive (δ+): a polar covalent bond.'+(ap?' About '+b.ion.toFixed(0)+'% ionic character.':'');
      return 'ΔEN = '+b.d.toFixed(2)+': '+hi.sym+' pulls so hard that it effectively <b>takes</b> the electron. The atoms become ions, '+lo.sym+'⁺ and '+hi.sym+'⁻, held by ionic attraction.'+(hon?' The 1.8 cutoff is a guide: real bonds run on a continuum.':'');}
    if(p.mode==='mol'){const m=MB[p.mol],d=molData(m),F=CL.html(m.f),pol=isPolar(m),sh=SHAPE[m.L.length+','+m.lp].toLowerCase();
      const allSame=m.L.every(s=>s===m.L[0]),bondsPolar=Math.abs(EN(m.L[0])-EN(m.c))>=0.4||m.L.some(s=>Math.abs(EN(s)-EN(m.c))>=0.4);
      let s;if(m.L.length===1)s=pol?F+' has one polar bond, so the molecule is <b>polar</b>: the electrons sit closer to '+(EN(m.c)>EN(m.L[0])?m.c:m.L[0])+'.':F+' has two identical atoms, so it is <b>nonpolar</b>.';
      else if(!pol)s=F+' has '+(bondsPolar?'polar bonds, but its '+sh+' shape is symmetric, so the bond dipoles <b>cancel</b>':'bonds that are barely polar, so there is almost nothing to add up')+'. The molecule is <b>nonpolar</b>.';
      else s=F+' is <b>polar</b>: its bond dipoles add up to a net dipole (purple arrow) because '+(allSame?'the '+sh+' shape is not symmetric.':'its outer atoms are not all the same.');
      if(p.field)s+=pol?' In the field, the δ− end turns toward the + plate.':' The field cannot line it up, so it keeps tumbling.';
      if(ap)s+=' Measured: '+m.mu.toFixed(2)+' D.';return s;}
    const D=deflection(p);if(p.rod==='none')return 'The rod is uncharged, so the stream falls straight down. Charge the rod to see whether the liquid responds.';
    if(p.liquid==='hexane')return '<b>Hexane barely bends.</b> Its molecules are nonpolar (C–H bonds have ΔEN 0.35), so they have no ends to turn toward the rod.';
    return 'The stream bends <b>toward</b> the '+(p.rod==='neg'?'negative':'positive')+' rod by '+D.toFixed(1)+' cm. Water molecules turn so their '+(p.rod==='neg'?'δ+ hydrogen':'δ− oxygen')+' end faces the rod, and the closer end feels the stronger pull.';},
  tour:[
    {title:'Equal sharing',text:'Two hydrogen atoms pull on the shared pair (yellow dots) equally. The electron cloud is even, so the bond is nonpolar.',focus:[100,40,600,260],speed:1,setup(sim){BioLab.setValues(sim,{mode:'bond',a:'H',b:'H'});}},
    {title:'Unequal sharing',text:'Chlorine has a higher electronegativity (3.16) than hydrogen (2.20). It pulls the shared electrons closer: Cl gets a partial negative charge (δ−) and H a partial positive charge (δ+).',focus:[100,40,600,260],speed:1,setup(sim){BioLab.setValues(sim,{b:'Cl'});}},
    {title:'The ΔEN scale',text:'The difference in electronegativity decides the bond type: below 0.4 nonpolar covalent, up to about 1.8 polar covalent, above that ionic. Na and Cl differ by 2.23, so Cl takes the electron.',focus:[40,320,720,110],speed:1,setup(sim){BioLab.setValues(sim,{a:'Na',b:'Cl'});}},
    {title:'Bond dipoles add like vectors',text:'Each O–H bond in water has a dipole arrow pointing toward O. Because water is bent, the two arrows add up to a net dipole (purple). Water is polar.',focus:[CX-200,30,400,380],speed:1,setup(sim){BioLab.setValues(sim,{mode:'mol',mol:'H2O',field:false});}},
    {title:'Polar bonds, nonpolar molecule',text:'CO₂ has two very polar C=O bonds, but they point in exactly opposite directions. They cancel, so CO₂ is nonpolar. Shape decides.',focus:[CX-200,30,400,380],speed:1,setup(sim){BioLab.setValues(sim,{mol:'CO2'});}},
    {title:'Line them up with a field',text:'Turn on the electric field. Polar water turns its δ− oxygen toward the + plate. Try CO₂ again: it keeps tumbling because it has no net dipole.',focus:[0,0,800,450],speed:1,setup(sim){BioLab.setValues(sim,{mol:'H2O',field:true});}},
    {title:'Bend a stream of water',text:'A charged rod pulls a thin stream of water toward it, whether the rod is + or −: the molecules turn to face it. Nonpolar hexane barely moves.',focus:[0,0,800,450],speed:1,setup(sim){BioLab.setValues(sim,{mode:'stream',liquid:'water',rod:'neg',dist:2});}},
    {lvl:'ap',title:'Measured dipole moments',text:'The arrow model uses ΔEN only. Real dipole moments (in debye) also depend on bond length and lone pairs: H₂O 1.85 D, NH₃ 1.47 D, HCl 1.08 D. Compare them in Molecules.',focus:[0,0,800,450],speed:1,setup(sim){BioLab.setValues(sim,{mode:'mol',mol:'NH3',field:false});}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{mode:'bond',a:'H',b:'Cl',field:false});},
  onChallenge(sim,ch,phase){if(ch&&ch.instant&&ch.set&&phase==='ask'){BioLab.setValues(sim,ch.set);BioLab.refresh(sim);}},
  challenges:[
    {lvl:'bio',q:'CO₂ has two polar C=O bonds. If you switch on the electric field, what will the molecule do?',choices:['Turn and line up with the field','Keep tumbling: its bond dipoles cancel, so it is nonpolar'],correct:1,
     baseline:{mode:'mol',mol:'CO2',field:false},change:{field:true},changeText:'Electric field switched on',
     explain:{bio:'The two C=O dipoles point in opposite directions and cancel. With no net dipole, the field has nothing to grab, so CO₂ keeps tumbling. Polar bonds do not always make a polar molecule.'}},
    {lvl:'bio',q:'Water is in the field. Which end of the molecule turns toward the positive (+) plate?',choices:['The oxygen end','The hydrogen end','Neither: water does not line up'],correct:0,
     baseline:{mode:'mol',mol:'H2O',field:false},change:{field:true},changeText:'Electric field switched on',
     explain:{bio:'Oxygen is more electronegative, so it carries the δ− charge. Opposite charges attract: the oxygen end swings toward the + plate.'}},
    {lvl:'bio',q:'The water stream bends toward the negative rod. If you make the rod positive, the stream…',choices:['bends away from the rod','still bends toward the rod','stops bending'],correct:1,
     baseline:{mode:'stream',liquid:'water',rod:'neg',dist:3},change:{rod:'pos'},changeText:'Rod changed to positive',
     explain:{bio:'Water molecules simply turn around: now the δ− oxygen ends face the + rod. The nearer end is always the opposite charge, so the stream is pulled toward either rod.'}},
    {lvl:'honors',q:'CCl₄ is nonpolar. If you replace one Cl with H to make CHCl₃, the molecule…',choices:['stays nonpolar: it is still tetrahedral','becomes polar and lines up in the field'],correct:1,
     baseline:{mode:'mol',mol:'CCl4',field:true},change:{mol:'CHCl3'},changeText:'Switched to CHCl₃',
     explain:{honors:'The shape is still tetrahedral, but the C–H bond dipole is small and points the other way, so the four arrows no longer cancel. CHCl₃ has a net dipole (1.04 D) and lines up in the field.'}},
    {lvl:'honors',q:'The water stream bends toward the rod. Switch the liquid to hexane, C₆H₁₄. The stream…',choices:['bends just as much','barely bends at all','bends away from the rod'],correct:1,
     baseline:{mode:'stream',liquid:'water',rod:'neg',dist:2},change:{liquid:'hexane'},changeText:'Liquid changed to hexane',
     explain:{honors:'Hexane’s C–H and C–C bonds are nonpolar (ΔEN 0.35 and 0), so its molecules have no δ+ and δ− ends to turn toward the rod.'}},
    {lvl:'honors',instant:true,set:{mode:'bond',a:'O',b:'H'},q:'Which of these bonds is the most polar: C–H, N–H or O–H?',choices:['C–H','N–H','O–H'],correct:2,
     explain:{honors:'ΔEN: C–H 0.35, N–H 0.84, O–H 1.24. The model is now showing O–H. The biggest difference in electronegativity gives the most polar bond.'}},
    {lvl:'ap',instant:true,set:{mode:'mol',mol:'SF4'},q:'Is SF₄ polar?',choices:['No: all four S–F bonds are identical, so they cancel','Yes: the seesaw shape leaves a net dipole'],correct:1,
     explain:{ap:'The lone pair makes SF₄ a seesaw. The axial dipoles nearly cancel (173°), but the two equatorial dipoles at 101.6° add up. The measured dipole moment is 0.63 D.'}},
    {lvl:'ap',instant:true,set:{mode:'mol',mol:'CH2Cl2'},q:'Which has the larger dipole moment, CH₂Cl₂ or CCl₄?',choices:['CCl₄, because it has more polar C–Cl bonds','CH₂Cl₂','They are equal'],correct:1,
     explain:{ap:'More polar bonds do not mean a bigger dipole. CCl₄’s four dipoles cancel exactly (0 D). In CH₂Cl₂ the two C–Cl dipoles point to the same side, giving 1.60 D.'}},
    {lvl:'ap',instant:true,set:{mode:'bond',a:'H',b:'F'},q:'Use Pauling’s estimate, ionic character = 1 − e^(−ΔEN²/4). About how ionic is the H–F bond?',choices:['about 18%','about 55%','100%'],correct:1,
     explain:{ap:'ΔEN = 3.98 − 2.20 = 1.78, so 1 − e^(−0.79) ≈ 0.55. The Ionic character tile shows 55%. Even the most polar covalent bonds are only partly ionic.'}}
  ],
  lab:{bio:'<p><b>Question:</b> Which bonds are polar, and which molecules are polar?</p><ol><li>In One bond, test H–H, C–H, N–H, O–H, H–F and Na–Cl. Record ΔEN and the bond type for each.</li><li>In Molecules, turn on the field and test CO₂, H₂O, CH₄ and NH₃. Record which ones line up.</li></ol><p>Can a molecule with polar bonds be nonpolar? Use one example as evidence.</p>',
       honors:'<p><b>Question:</b> How does shape decide whether a molecule is polar?</p><ol><li>Record CH₄, CH₃Cl, CH₂Cl₂, CHCl₃ and CCl₄ with the field on.</li><li>Note the sum of bond dipoles for each.</li><li>In Water stream, record the deflection at 1, 2, 4 and 8 cm, for water and for hexane.</li></ol><p>Explain why CH₄ and CCl₄ are nonpolar but the three in between are polar.</p>',
       ap:'<p><b>Question:</b> How well does the bond-dipole model predict real dipole moments?</p><ol><li>Record the model sum and the measured dipole moment for at least eight molecules.</li><li>Plot model sum (x) against measured dipole (y) on the Trials graph.</li></ol><p><b>Claim–evidence–reasoning:</b> Which molecules fall off the trend? Explain with lone pairs and bond length.</p>'},
  terms:[{t:'Electronegativity',d:'How strongly an atom pulls shared electrons toward itself (Pauling scale, F = 3.98 is highest).'},{t:'Polar covalent bond',d:'Electrons shared unequally: ΔEN from about 0.4 to 1.8.'},{t:'Nonpolar covalent bond',d:'Electrons shared equally or almost equally: ΔEN below 0.4.'},{t:'Partial charge (δ+, δ−)',d:'A small charge on an atom in a polar bond, less than a full ion’s charge.'},{t:'Polar molecule',d:'A molecule with a positive end and a negative end: its bond dipoles do not cancel.'},
    {lvl:'honors',t:'Bond dipole',d:'An arrow from δ+ to δ− along a bond. Its length grows with ΔEN.'},{lvl:'honors',t:'Net dipole',d:'The vector sum of all the bond dipoles in a molecule.'},
    {lvl:'ap',t:'Dipole moment (μ)',d:'Charge × separation, measured in debye (D). 1 D = 3.34 × 10⁻³⁰ C·m.'},{lvl:'ap',t:'Ionic character',d:'Pauling’s estimate of how ionic a bond is: 1 − e^(−ΔEN²/4).'}],
  about:'<p>Electronegativities are Pauling values. Bond types use the common classroom cutoffs (0.4 and 1.8); real bonds form a continuum. Each bond dipole points toward the more electronegative atom (the chemistry convention, with a + at the tail) and its length equals ΔEN. The net dipole is the 3D vector sum, using the measured bond angles. Partial charges shown are half the ΔEN on each bond, for display only.</p><p>The model sum ignores lone pairs and bond lengths, so it ranks molecules but does not predict debye values. Measured dipole moments are gas-phase values from the CRC Handbook. In the field, the molecule feels a torque μ × E and random thermal kicks.</p><p>The water stream uses the classroom explanation: polar molecules turn to face the rod and are pulled into the stronger field. Careful experiments show that charge induced in the stream as it leaves the buret also matters a lot, and that is part of why nonpolar liquids bend a little in real life. Deflections are illustrative.</p>',
  initVis(sim){sim.vis.w=[0,0,0];if(!sim.R)sim.R=mm(axisRot([1,0,0],0.3),axisRot([0,1,0],-0.4));sim.vis.drops=[];sim.vis.rng=1;},
  draw(sim,ctx,vdt,k,t){const p=sim.p;ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
    if(p.mode==='bond')drawBond(sim,ctx,k,t);else if(p.mode==='mol')drawMol(sim,ctx,vdt,k,t);else drawStream(sim,ctx,vdt,k,t);},
  thumbSetup(sim){sim.p.mode='mol';sim.p.mol='H2O';}
};

/* ---------- one bond ---------- */
function drawBond(sim,ctx,k,t){const p=sim.p,b=bondInfo(p),A=b.a,B=b.b,ap=atLeast('ap');const sgn=Math.sign(B.en-A.en),d=b.d,ionic=d>1.8;
  const rA=clamp(A.radius*0.45,26,70),rB=clamp(B.radius*0.45,26,70),xA=270,xB=530,y=170;
  // electron density cloud: shifted toward the more electronegative atom
  const shift=sgn*Math.tanh(d/1.4)*0.5;const ex=xA+(xB-xA)*(0.5+shift*0.9);
  if(!ionic){const g=ctx.createRadialGradient(ex,y,8,ex,y,190);const a=0.18+0.25*Math.tanh(d);
    g.addColorStop(0,'rgba(214,48,72,'+(d<0.4?0.18:a).toFixed(2)+')');g.addColorStop(0.55,'rgba(150,90,170,0.12)');g.addColorStop(1,'rgba(40,90,220,0.10)');
    ctx.fillStyle=g;ctx.beginPath();ctx.ellipse((xA+xB)/2,y,(xB-xA)/2+Math.max(rA,rB)+10,Math.max(rA,rB)+18,0,0,6.29);ctx.fill();}
  else{const neg=sgn>0?[xB,rB]:[xA,rA],pos=sgn>0?[xA,rA]:[xB,rB];ctx.fillStyle='rgba(214,48,72,0.28)';ctx.beginPath();ctx.arc(neg[0],y,neg[1]+20,0,6.29);ctx.fill();ctx.fillStyle='rgba(40,90,220,0.22)';ctx.beginPath();ctx.arc(pos[0],y,pos[1]+12,0,6.29);ctx.fill();}
  if(!ionic){ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(xA+rA*0.8,y);ctx.lineTo(xB-rB*0.8,y);ctx.stroke();}
  CL.drawAtom(ctx,xA,y,rA,A.sym,{s:Math.max(14*k,rA*0.6)});CL.drawAtom(ctx,xB,y,rB,B.sym,{s:Math.max(14*k,rB*0.6)});
  // the shared pair
  const jig=RM?0:Math.sin(t*3)*4;const px=ionic?(sgn>0?xB+rB*0.4:xA-rA*0.4):ex+jig;const py=ionic?y-(sgn>0?rB:rA)-4:y-6;
  ctx.fillStyle=PAL['cv-e'];ctx.strokeStyle=PAL['cv-estroke'];ctx.lineWidth=1.5;[-7,7].forEach(o=>{ctx.beginPath();ctx.arc(px+o,py,6,0,6.29);ctx.fill();ctx.stroke();});
  if(p.charges&&d>0.05){const lab=ionic?['+','−']:['δ+','δ−'];const hiX=sgn>0?xB:xA,loX=sgn>0?xA:xB,rHi=sgn>0?rB:rA,rLo=sgn>0?rA:rB;
    txt(ctx,lab[1],hiX,y+rHi+34,{s:20*k,w:800,a:'center',c:PAL['s1']});txt(ctx,lab[0],loX,y+rLo+34,{s:20*k,w:800,a:'center',c:PAL['s2']});
    if(ionic){txt(ctx,(sgn>0?B:A).sym+'⁻',hiX,y-rHi-32,{s:15*k,w:700,a:'center'});txt(ctx,(sgn>0?A:B).sym+'⁺',loX,y-rLo-32,{s:15*k,w:700,a:'center'});}}
  // dipole arrow (crossed tail at δ+)
  if(d>=0.05&&!ionic){const L=40+60*Math.min(d,1.8),y2=y-Math.max(rA,rB)-38,cx=(xA+xB)/2,x1=cx-sgn*L/2,x2=cx+sgn*L/2;dipArrow(ctx,x1,y2,x2,y2,PAL['s5'],4);
    txt(ctx,'bond dipole',cx,y2-16,{s:12*k,c:PAL['cv-soft'],a:'center'});}
  txt(ctx,'EN '+A.en.toFixed(2),xA,y+(Math.max(rA,rB))+62*Math.min(k,1.3),{s:13*k,a:'center',c:PAL['cv-soft'],w:600});txt(ctx,'EN '+B.en.toFixed(2),xB,y+(Math.max(rA,rB))+62*Math.min(k,1.3),{s:13*k,a:'center',c:PAL['cv-soft'],w:600});
  // ΔEN scale
  const x0=70,x1=730,yb=362,X=v=>x0+(x1-x0)*v/3.3;
  [[0,0.4,'s3'],[0.4,1.8,'s4'],[1.8,3.3,'s5']].forEach(([a,c,col])=>{ctx.fillStyle=PAL[col];ctx.globalAlpha=0.3;ctx.fillRect(X(a),yb,X(c)-X(a),18);ctx.globalAlpha=1;});
  ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1;ctx.strokeRect(x0,yb,x1-x0,18);
  txt(ctx,'nonpolar',x0,yb+40,{s:12*k,c:PAL['cv-soft']});txt(ctx,'polar covalent',(X(0.4)+X(1.8))/2,yb+40,{s:12*k,c:PAL['cv-soft'],a:'center'});txt(ctx,'ionic',(X(1.8)+X(3.3))/2,yb+40,{s:12*k,c:PAL['cv-soft'],a:'center'});
  [0.4,1.8].forEach(v=>txt(ctx,v.toFixed(1),X(v),yb+58,{s:12*k,c:PAL['cv-soft'],a:'center'}));
  const xp=X(Math.min(d,3.3));ctx.fillStyle=PAL['cv-ink'];ctx.beginPath();ctx.moveTo(xp,yb+2);ctx.lineTo(xp-8,yb-10);ctx.lineTo(xp+8,yb-10);ctx.closePath();ctx.fill();
  pill(ctx,'ΔEN = '+d.toFixed(2),clamp(xp,70,730),yb-26,PAL['card'],PAL['cv-ink'],14*k);
  txt(ctx,b.type+' bond',20,36,{s:20*Math.min(k,1.5),w:800});}
function dipArrow(ctx,x1,y1,x2,y2,c,w){const a=Math.atan2(y2-y1,x2-x1),L=Math.hypot(x2-x1,y2-y1);if(L<4)return;const h=Math.min(16,L*0.45);ctx.strokeStyle=c;ctx.fillStyle=c;ctx.lineWidth=w;ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2-Math.cos(a)*h*0.8,y2-Math.sin(a)*h*0.8);ctx.stroke();ctx.beginPath();ctx.moveTo(x2,y2);ctx.lineTo(x2-Math.cos(a-0.45)*h,y2-Math.sin(a-0.45)*h);ctx.lineTo(x2-Math.cos(a+0.45)*h,y2-Math.sin(a+0.45)*h);ctx.closePath();ctx.fill();
  const cx=x1+Math.cos(a)*Math.min(12,L*0.2),cy=y1+Math.sin(a)*Math.min(12,L*0.2),nx=-Math.sin(a)*8,ny=Math.cos(a)*8;ctx.beginPath();ctx.moveTo(cx+nx,cy+ny);ctx.lineTo(cx-nx,cy-ny);ctx.stroke();}

/* ---------- molecules in 3D ---------- */
function drawMol(sim,ctx,vdt,k,t){const p=sim.p,m=MB[p.mol],D=molData(m),v=sim.vis,hon=atLeast('honors');
  // rotational dynamics: torque from the field on the net dipole, plus thermal kicks and drag
  const dt=Math.min(vdt,0.05);if(!v.w)v.w=[0,0,0];
  if(dt>0){const muW=mul(sim.R,D.net),Ed=[-1,0,0];let tq=[0,0,0];if(p.field&&D.mag>0.05)tq=cross(muW,Ed).map(x=>x*14);
    v.rng=(v.rng*16807)%2147483647;const r1=(v.rng%1000)/1000-0.5;v.rng=(v.rng*16807)%2147483647;const r2=(v.rng%1000)/1000-0.5;v.rng=(v.rng*16807)%2147483647;const r3=(v.rng%1000)/1000-0.5;
    const kick=RM?0:2.2;tq=[tq[0]+r1*kick,tq[1]+r2*kick,tq[2]+r3*kick];const drag=p.field&&D.mag>0.05?4.2:0.9;
    v.w=v.w.map((w,i)=>w+(tq[i]-drag*w)*dt);const wm=Math.hypot(...v.w);if(!p.field||D.mag<=0.05){const cap=0.9;if(wm>cap)v.w=v.w.map(x=>x*cap/wm);}
    if(wm>1e-6)sim.R=ortho(mm(axisRot(v.w,wm*dt),sim.R));}
  const R=sim.R,Lb=118/(1+(k-1)*0.35),cen=D.cen;
  const P3=u=>{const w=mul(R,[u[0]-cen[0],u[1]-cen[1],u[2]-cen[2]]),f=900/(900-w[2]*Lb);return {x:CX+w[0]*Lb*f,y:CY-w[1]*Lb*f,z:w[2],f};};
  // field plates
  if(p.field){ctx.fillStyle=PAL['s1'];rr(ctx,24,50,18,330,6);ctx.fill();ctx.fillStyle=PAL['s2'];rr(ctx,758,50,18,330,6);ctx.fill();
    for(let i=0;i<5;i++){const y=80+i*66;ctx.strokeStyle=PAL['line'];ctx.lineWidth=1.5;ctx.setLineDash([6,8]);ctx.beginPath();ctx.moveTo(60,y);ctx.lineTo(730,y);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle=PAL['line'];ctx.beginPath();ctx.moveTo(740,y);ctx.lineTo(730,y-5);ctx.lineTo(730,y+5);ctx.closePath();ctx.fill();
      txt(ctx,'+',33,y,{s:18*k,w:800,c:'#fff',a:'center',b:'middle'});txt(ctx,'−',767,y,{s:18*k,w:800,c:'#fff',a:'center',b:'middle'});}}
  const items=[],atoms=[{s:m.c,u:[0,0,0],q:D.q[0]}].concat(m.L.map((s,i)=>({s,u:D.B[i].map(x=>x*rl(m,s)),q:D.q[i+1]})));
  const rad=s=>clamp(0.34*CL.el(s).radius,14,36);
  atoms.forEach((a,i)=>{const P=P3(a.u);a.P=P;});
  m.L.forEach((s,i)=>{const a=atoms[0].P,b=atoms[i+1].P;items.push({z:(a.z+b.z)/2-0.01,f(){stick(ctx,a,b,m.bo[i]);}});});
  atoms.forEach(a=>{const r=rad(a.s)*a.P.f;items.push({z:a.P.z,f(){if(p.charges&&Math.abs(a.q)>0.04){const al=clamp(Math.abs(a.q)*0.7,0.12,0.42);ctx.fillStyle=a.q<0?'rgba(214,48,72,'+al+')':'rgba(40,90,220,'+al+')';ctx.beginPath();ctx.arc(a.P.x,a.P.y,r+14,0,6.29);ctx.fill();}
    CL.drawAtom(ctx,a.P.x,a.P.y,r,a.s,{s:Math.max(12*k,Math.min(r*0.85,24))});}});});
  items.sort((a,b)=>a.z-b.z).forEach(it=>it.f());
  // bond dipoles (offset to the side of each bond) and the net dipole
  if(p.bdip&&m.L.length>1)m.L.forEach((s,i)=>{const dEN=EN(s)-EN(m.c);if(Math.abs(dEN)<0.05)return;const a=atoms[0].P,b=atoms[i+1].P,dx=b.x-a.x,dy=b.y-a.y,L=Math.hypot(dx,dy);if(L<30)return;
    const nx=-dy/L*16,ny=dx/L*16,s1=0.28,s2=0.78;let x1=a.x+dx*s1+nx,y1=a.y+dy*s1+ny,x2=a.x+dx*s2+nx,y2=a.y+dy*s2+ny;if(dEN<0){[x1,x2]=[x2,x1];[y1,y2]=[y2,y1];}dipArrow(ctx,x1,y1,x2,y2,PAL['s2'],2.5);});
  if(D.mag>0.05){const n=mul(R,D.net),L=40+50*Math.min(D.mag,2.2),pr=Math.hypot(n[0],n[1])/D.mag,sc=Math.max(pr,0.3)/(pr||1);const ux=n[0]/D.mag*sc,uy=-n[1]/D.mag*sc;
    dipArrow(ctx,CX-ux*L*0.4,CY-uy*L*0.4,CX+ux*L,CY+uy*L,PAL['s5'],6);}
  if(p.charges)atoms.forEach((a,i)=>{if(Math.abs(a.q)<0.08)return;if(a.P.z<-0.35&&atoms.length>3)return;const r=rad(a.s)*a.P.f;let dx=a.P.x-CX,dy=a.P.y-CY;const l=Math.hypot(dx,dy);if(l<5){dx=0.7;dy=-0.7;}else{dx/=l;dy/=l;}
    if(i===0){dx=0.75;dy=-0.66;}txt(ctx,a.q<0?'δ−':'δ+',a.P.x+dx*(r+20),a.P.y+dy*(r+20),{s:15*k,w:800,a:'center',b:'middle',c:a.q<0?PAL['s1']:PAL['s2']});});
  // labels
  txt(ctx,CL.fmt(m.f),56,40,{s:24*Math.min(k,1.5),w:800});txt(ctx,m.name,56,40+20*Math.min(k,1.5),{s:13*k,c:PAL['cv-soft']});
  pill(ctx,isPolar(m)?'Polar':'Nonpolar',700,36,isPolar(m)?PAL['s5']:PAL['cv-soft'],'#fff',15*k);
  if(hon)txt(ctx,'purple arrow = net dipole',744,428,{s:12*k,c:PAL['cv-soft'],a:'right'});}
function rl(m,s){const c=CL.el(m.c).radius,mx=Math.max(...m.L.map(x=>CL.el(x).radius))+c;return (CL.el(s).radius+c)/mx;}
function stick(ctx,a,b,bo){const dx=b.x-a.x,dy=b.y-a.y,L=Math.hypot(dx,dy)||1,nx=-dy/L,ny=dx/L,offs=bo===1?[0]:bo===2?[-4.5,4.5]:[-7,0,7],w=bo===1?9:bo===2?5.5:4.2;
  offs.forEach(o=>{ctx.lineCap='round';ctx.strokeStyle='#5d6470';ctx.lineWidth=w+2;ctx.beginPath();ctx.moveTo(a.x+nx*o,a.y+ny*o);ctx.lineTo(b.x+nx*o,b.y+ny*o);ctx.stroke();ctx.strokeStyle='#b9bec8';ctx.lineWidth=w*0.45;ctx.beginPath();ctx.moveTo(a.x+nx*o,a.y+ny*o);ctx.lineTo(b.x+nx*o,b.y+ny*o);ctx.stroke();});}

/* ---------- water stream demo ---------- */
function drawStream(sim,ctx,vdt,k,t){const p=sim.p,v=sim.vis,Dcm=deflection(p),S=30,x0=300,yT=78,yB=392,Dpx=Dcm*S;
  const sx=y=>x0+Dpx*Math.pow((y-yT)/(yB-yT),2);
  // buret
  ctx.fillStyle=PAL['cv-glass'];ctx.globalAlpha=0.35;ctx.fillRect(x0-14,0,28,56);ctx.globalAlpha=1;ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=2;ctx.strokeRect(x0-14,0,28,56);
  ctx.fillStyle=PAL['cv-soft'];ctx.fillRect(x0-22,56,44,9);ctx.fillRect(x0-4,65,8,13);
  txt(ctx,p.liquid==='water'?'water, H₂O (polar)':'hexane, C₆H₁₄ (nonpolar)',x0-30,30,{s:14*k,w:700,a:'right'});
  // stream
  const col=p.liquid==='water'?PAL['s2']:PAL['s6'];ctx.strokeStyle=col;ctx.lineCap='round';
  for(let y=yT;y<yB-40;y+=6){const w=clamp(6-(y-yT)/90,2.5,6);ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(sx(y),y);ctx.lineTo(sx(y+6),y+6);ctx.stroke();}
  if(!v.drops)v.drops=[];if(!RM&&vdt>0&&Math.random()<vdt*30)v.drops.push({y:yB-40,vy:200});v.drops.forEach(d=>{d.vy+=600*vdt;d.y+=d.vy*vdt;});v.drops=v.drops.filter(d=>d.y<yB+30);
  ctx.fillStyle=col;v.drops.forEach(d=>{ctx.beginPath();ctx.arc(sx(Math.min(d.y,yB)),d.y,3,0,6.29);ctx.fill();});
  CL.drawBeaker(ctx,{x:x0-60+Dpx*0.9,y:yB+10,w:120+0,h:50,fill:0.4,liquid:p.liquid==='water'?PAL['cv-water']:PAL['cv-bg2'],ticks:false});
  // rod
  const xr=x0+p.dist*S+8;ctx.fillStyle=p.rod==='none'?PAL['cv-soft']:p.rod==='neg'?'#2b5fb4':'#b3261e';rr(ctx,xr,150,26,190,10);ctx.fill();
  if(p.rod!=='none')for(let i=0;i<6;i++)txt(ctx,p.rod==='neg'?'−':'+',xr+13,170+i*30,{s:18*k,w:800,c:'#fff',a:'center',b:'middle'});
  txt(ctx,p.rod==='none'?'uncharged rod':p.rod==='neg'?'negative rod':'positive rod',xr+13,140,{s:13*k,w:700,a:'center'});
  // distance bracket at the rod's middle
  const ym=245;ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.5;ctx.setLineDash([3,3]);ctx.beginPath();ctx.moveTo(x0,ym+40);ctx.lineTo(xr,ym+40);ctx.stroke();ctx.setLineDash([]);
  pill(ctx,p.dist.toFixed(1)+' cm',(x0+xr)/2,ym+60,PAL['card'],PAL['cv-ink'],13*k);
  // zoom circle: how molecules near the rod are oriented
  const zx=140,zy=250,zr=92;ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.5;ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(zx+zr,zy-20);ctx.lineTo(sx(220)-4,220);ctx.stroke();ctx.setLineDash([]);
  ctx.save();ctx.beginPath();ctx.arc(zx,zy,zr,0,6.29);ctx.fillStyle=PAL['card'];ctx.fill();ctx.clip();
  const toward=p.rod==='neg'?Math.PI:0;
  for(let i=0;i<9;i++){const gx=zx-56+(i%3)*56,gy=zy-56+Math.floor(i/3)*56;const jit=RM?0:Math.sin(t*2+i*1.7)*0.5;
    let ang=p.liquid==='water'&&p.rod!=='none'?toward+jit*0.7:i*2.1+t*0.8*(RM?0:1);
    if(p.liquid==='water'){// O toward +x of the local frame when ang=0; H atoms trail behind at ±52°
      const ox=gx+Math.cos(ang)*6,oy=gy+Math.sin(ang)*6;[0.91,-0.91].forEach(h=>{const hx=ox-Math.cos(ang+h)*17,hy=oy-Math.sin(ang+h)*17;CL.drawAtom(ctx,hx,hy,7,'H',{label:''});});
      CL.drawAtom(ctx,ox,oy,11,'O',{label:''});}
    else{ctx.fillStyle='#5a5a5a';ctx.save();ctx.translate(gx,gy);ctx.rotate(ang);for(let j=-2;j<=2;j++){ctx.beginPath();ctx.arc(j*7,(j%2)*4,5,0,6.29);ctx.fill();}ctx.restore();}}
  ctx.restore();ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=2;ctx.beginPath();ctx.arc(zx,zy,zr,0,6.29);ctx.stroke();
  txt(ctx,'inside the stream',zx,zy+zr+20,{s:13*k,w:700,a:'center',c:PAL['cv-soft']});
  if(p.liquid==='water'&&p.rod!=='none')txt(ctx,(p.rod==='neg'?'H (δ+)':'O (δ−)')+' ends face the rod →',zx,zy-zr-12,{s:12*k,a:'center',c:PAL['cv-soft']});
  pill(ctx,'deflection '+Dcm.toFixed(1)+' cm',x0+Math.max(Dpx,0)/2+10,yB-14,PAL['card'],PAL['cv-ink'],13*k);}

POL.onLevel=sync;
BioLab.register(POL);
})();
