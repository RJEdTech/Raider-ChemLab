(function(){
'use strict';
const {clamp,rr,txt,pill,atLeast,PAL,FONT,RM,lvText}=BioLab.h;
const CL=window.ChemLab;
const D2R=Math.PI/180;

/* ---------- vector helpers ---------- */
const nrm=v=>{const l=Math.hypot(v[0],v[1],v[2])||1;return [v[0]/l,v[1]/l,v[2]/l];};
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const angDeg=(a,b)=>Math.acos(clamp(dot(nrm(a),nrm(b)),-1,1))/D2R;
const mul=(M,v)=>[M[0]*v[0]+M[1]*v[1]+M[2]*v[2],M[3]*v[0]+M[4]*v[1]+M[5]*v[2],M[6]*v[0]+M[7]*v[1]+M[8]*v[2]];
const mm=(A,B)=>{const C=new Array(9);for(let i=0;i<3;i++)for(let j=0;j<3;j++)C[i*3+j]=A[i*3]*B[j]+A[i*3+1]*B[3+j]+A[i*3+2]*B[6+j];return C;};
const rotY=a=>[Math.cos(a),0,Math.sin(a),0,1,0,-Math.sin(a),0,Math.cos(a)];
const rotX=a=>[1,0,0,0,Math.cos(a),-Math.sin(a),0,Math.sin(a),Math.cos(a)];
function ortho(M){let a=nrm([M[0],M[1],M[2]]),b=[M[3],M[4],M[5]];const d=dot(a,b);b=nrm([b[0]-d*a[0],b[1]-d*a[1],b[2]-d*a[2]]);const c=[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];return [...a,...b,...c];}
const eqv=phi=>[Math.cos(phi*D2R),0,Math.sin(phi*D2R)];

/* ---------- VSEPR geometry ----------
   Domains start at the ideal positions for the number of electron domains (linear, trigonal planar, tetrahedral,
   trigonal bipyramidal, octahedral). Lone pairs take the slots that keep them farthest from other domains
   (equatorial in a trigonal bipyramid, opposite each other in an octahedron). Then the bond angles close by the
   amount measured in real molecules (P), because lone pairs spread out more than bonding pairs. */
const TET=109.47;
function construct(nb,nl,P,ideal){P=ideal?{}:(P||{});const n=nb+nl;let B=[],L=[];
  const tet=[[0,1,0]].concat([90,210,330].map(f=>[Math.sin(TET*D2R)*Math.cos(f*D2R),Math.cos(TET*D2R),Math.sin(TET*D2R)*Math.sin(f*D2R)]));
  if(n===1)B=[[1,0,0]];
  else if(n===2){if(nb===2)B=[[1,0,0],[-1,0,0]];else{B=[[1,0,0]];L=[[-1,0,0]];}}
  else if(n===3){if(nb===3){const t=(P.a||120)*D2R/2;B=[[0,1,0],[Math.sin(t),-Math.cos(t),0],[-Math.sin(t),-Math.cos(t),0]];}
    else if(nb===2){const t=(P.a||120)*D2R/2;L=[[0,1,0]];B=[[Math.sin(t),-Math.cos(t),0],[-Math.sin(t),-Math.cos(t),0]];}
    else{const t=60*D2R;L=[[0,1,0],[-Math.sin(t),-Math.cos(t),0]];B=[[Math.sin(t),-Math.cos(t),0]];}}
  else if(n===4){if(nb===4)B=tet;
    else if(nb===3){const c=Math.cos((P.a||TET)*D2R),ca=Math.sqrt((2*c+1)/3),sa=Math.sqrt(1-ca*ca);L=[[0,1,0]];B=[90,210,330].map(f=>[sa*Math.cos(f*D2R),-ca,sa*Math.sin(f*D2R)]);}
    else if(nb===2){const t=(P.a||TET)*D2R/2,u=(ideal?TET:115)*D2R/2;B=[[Math.sin(t),-Math.cos(t),0],[-Math.sin(t),-Math.cos(t),0]];L=[[0,Math.cos(u),Math.sin(u)],[0,Math.cos(u),-Math.sin(u)]];}
    else{B=[tet[1]];L=[tet[0],tet[2],tet[3]];}}
  else if(n===5){const ax=[[0,1,0],[0,-1,0]],E=[90,210,330].map(eqv);
    if(nb===5)B=ax.concat(E);
    else if(nb===4){const te=(P.e||120)/2,d=(180-(P.x||180))/2*D2R,c=eqv(30);L=[eqv(210)];B=[[Math.sin(d)*c[0],Math.cos(d),Math.sin(d)*c[2]],[Math.sin(d)*c[0],-Math.cos(d),Math.sin(d)*c[2]],eqv(30+te),eqv(30-te)];}
    else if(nb===3){const e=(90-(P.a||90))*D2R;L=[eqv(210),eqv(330)];B=[eqv(90),[0,Math.cos(e),Math.sin(e)],[0,-Math.cos(e),Math.sin(e)]];}
    else{B=ax;L=E;}}
  else{const oct=[[0,1,0],[0,-1,0],[1,0,0],[-1,0,0],[0,0,1],[0,0,-1]];
    if(nb===6)B=oct;
    else if(nb===5){const t=(P.a||90)*D2R;L=[[0,1,0]];B=[[0,-1,0]].concat([[1,0],[0,1],[-1,0],[0,-1]].map(([x,z])=>[Math.sin(t)*x,-Math.cos(t),Math.sin(t)*z]));}
    else if(nb===4){L=[[0,1,0],[0,-1,0]];B=[[1,0,0],[-1,0,0],[0,0,1],[0,0,-1]];}
    else{L=[[1,0,0],[-1,0,0],[0,0,-1]];B=[[0,1,0],[0,-1,0],[0,0,1]];}}
  return {B:B.map(nrm),L:L.map(nrm)};}
const TYP={'3,1':{a:107},'2,2':{a:104.5},'2,1':{a:119},'4,1':{e:101.6,x:173.1},'3,2':{a:87.5},'5,1':{a:84.8}};
const SHAPE={'1,0':'Linear','1,1':'Linear','1,2':'Linear','1,3':'Linear','2,0':'Linear','2,1':'Bent','2,2':'Bent','2,3':'Linear','3,0':'Trigonal planar','3,1':'Trigonal pyramidal','3,2':'T-shaped','3,3':'T-shaped',
  '4,0':'Tetrahedral','4,1':'Seesaw','4,2':'Square planar','5,0':'Trigonal bipyramidal','5,1':'Square pyramidal','6,0':'Octahedral'};
const EDG={1:'Linear (two atoms)',2:'Linear',3:'Trigonal planar',4:'Tetrahedral',5:'Trigonal bipyramidal',6:'Octahedral'};
const HYB={2:'sp',3:'sp²',4:'sp³',5:'sp³d',6:'sp³d²'};
const IDEAL={2:'180°',3:'120°',4:'109.5°',5:'90° and 120°',6:'90°'};

/* ---------- real molecules (measured gas-phase bond angles) ---------- */
const MOLS=[
  {id:'CH4',f:'CH4',name:'methane',c:'C',L:['H','H','H','H'],lp:0},
  {id:'NH3',f:'NH3',name:'ammonia',c:'N',L:['H','H','H'],lp:1,P:{a:106.7}},
  {id:'H2O',f:'H2O',name:'water',c:'O',L:['H','H'],lp:2,P:{a:104.5}},
  {id:'CO2',f:'CO2',name:'carbon dioxide',c:'C',L:['O','O'],lp:0,bo:[2,2]},
  {id:'BF3',f:'BF3',name:'boron trifluoride',c:'B',L:['F','F','F'],lp:0},
  {id:'HCN',f:'HCN',name:'hydrogen cyanide',c:'C',L:['H','N'],lp:0,bo:[1,3]},
  {id:'CH2O',f:'CH2O',name:'formaldehyde',c:'C',L:['O','H','H'],lp:0,bo:[2,1,1],P:{a:116.5},lvl:'honors'},
  {id:'H2S',f:'H2S',name:'hydrogen sulfide',c:'S',L:['H','H'],lp:2,P:{a:92.1},lvl:'honors'},
  {id:'SO2',f:'SO2',name:'sulfur dioxide',c:'S',L:['O','O'],lp:1,bo:[2,1],res:true,P:{a:119.5},lvl:'honors'},
  {id:'O3',f:'O3',name:'ozone',c:'O',L:['O','O'],lp:1,bo:[2,1],res:true,P:{a:116.8},lvl:'honors'},
  {id:'PCl3',f:'PCl3',name:'phosphorus trichloride',c:'P',L:['Cl','Cl','Cl'],lp:1,P:{a:100.3},lvl:'honors'},
  {id:'CCl4',f:'CCl4',name:'carbon tetrachloride',c:'C',L:['Cl','Cl','Cl','Cl'],lp:0,lvl:'honors'},
  {id:'NH4',f:'NH4',q:1,name:'ammonium ion',c:'N',L:['H','H','H','H'],lp:0,lvl:'honors'},
  {id:'NO3',f:'NO3',q:-1,name:'nitrate ion',c:'N',L:['O','O','O'],lp:0,bo:[2,1,1],res:true,lvl:'honors'},
  {id:'CO3',f:'CO3',q:-2,name:'carbonate ion',c:'C',L:['O','O','O'],lp:0,bo:[2,1,1],res:true,lvl:'honors'},
  {id:'BeCl2',f:'BeCl2',name:'beryllium chloride (gas)',c:'Be',L:['Cl','Cl'],lp:0,lvl:'honors'},
  {id:'PCl5',f:'PCl5',name:'phosphorus pentachloride',c:'P',L:['Cl','Cl','Cl','Cl','Cl'],lp:0,lvl:'ap'},
  {id:'SF4',f:'SF4',name:'sulfur tetrafluoride',c:'S',L:['F','F','F','F'],lp:1,P:{e:101.6,x:173.1},lvl:'ap'},
  {id:'ClF3',f:'ClF3',name:'chlorine trifluoride',c:'Cl',L:['F','F','F'],lp:2,P:{a:87.5},lvl:'ap'},
  {id:'XeF2',f:'XeF2',name:'xenon difluoride',c:'Xe',L:['F','F'],lp:3,lvl:'ap'},
  {id:'I3',f:'I3',q:-1,name:'triiodide ion',c:'I',L:['I','I'],lp:3,lvl:'ap'},
  {id:'SF6',f:'SF6',name:'sulfur hexafluoride',c:'S',L:['F','F','F','F','F','F'],lp:0,lvl:'ap'},
  {id:'BrF5',f:'BrF5',name:'bromine pentafluoride',c:'Br',L:['F','F','F','F','F'],lp:1,P:{a:84.8},lvl:'ap'},
  {id:'XeF4',f:'XeF4',name:'xenon tetrafluoride',c:'Xe',L:['F','F','F','F'],lp:2,lvl:'ap'}];
const MB={};MOLS.forEach(m=>{MB[m.id]=m;m.q=m.q||0;m.bo=m.bo||m.L.map(()=>1);});
const fmtF=m=>CL.fmt(m.f,m.q);

/* ---------- current configuration ---------- */
const maxDom=()=>atLeast('ap')?6:4;
function config(sim){const p=sim.p;
  if(p.mode==='real'){const m=MB[p.mol]||MB.CH4;return {nb:m.L.length,nl:m.lp,P:m.P||{},lig:m.L,bo:m.bo,c:m.c,m,key:'r'+m.id};}
  const nb=+p.nb,nl=+p.nl,bt=atLeast('honors')?+p.btype:1;return {nb,nl,P:TYP[nb+','+nl]||{},lig:null,bo:new Array(nb).fill(bt),c:null,m:null,key:'m'+nb+','+nl+','+bt};}
function targets(cf){const g=construct(cf.nb,cf.nl,cf.P);return g.B.map((u,i)=>({u,t:'B',s:cf.lig?cf.lig[i]:'X',bo:cf.bo[i]||1})).concat(g.L.map(u=>({u,t:'L'})));}
// match the domains on screen to the new targets so they glide into place instead of jumping
function retarget(sim){const cf=config(sim),T=targets(cf),v=sim.vis;v.key=cf.key;v.cf=cf;
  if(!v.D){v.D=T.map(d=>Object.assign({},d,{tu:d.u,g:1,tg:1}));return;}
  const used=new Array(T.length).fill(false),keep=[];
  v.D.forEach(d=>{if(d.tg===0)return;let bi=-1,bd=-2;T.forEach((t,j)=>{if(used[j]||t.t!==d.t)return;const q=dot(d.u,t.u);if(q>bd){bd=q;bi=j;}});
    if(bi>=0){used[bi]=true;const t=T[bi];d.tu=t.u;d.s=t.s;d.bo=t.bo;d.tg=1;if(bd<-0.95)d.u=nrm([d.u[0]+0.2,d.u[1]+0.15,d.u[2]+0.1]);}else{d.tg=0;}keep.push(d);});
  T.forEach((t,j)=>{if(!used[j])keep.push(Object.assign({},t,{tu:t.u,g:0,tg:1}));});v.D=keep;}
function settle(sim,dt){const v=sim.vis;if(!v.D||v.key!==config(sim).key)retarget(sim);const f=RM?1:1-Math.exp(-7*dt);
  v.D.forEach(d=>{d.u=nrm([d.u[0]+(d.tu[0]-d.u[0])*f,d.u[1]+(d.tu[1]-d.u[1])*f,d.u[2]+(d.tu[2]-d.u[2])*f]);d.g+=(d.tg-d.g)*f;});
  v.D=v.D.filter(d=>d.tg>0||d.g>0.02);}
function bondAngles(sim){const D=(sim.vis.D||[]).filter(d=>d.t==='B'&&d.tg>0),out=[];for(let i=0;i<D.length;i++)for(let j=i+1;j<D.length;j++)out.push({i,j,a:angDeg(D[i].u,D[j].u)});return {D,out};}
function angleClasses(sim){const {D,out}=bondAngles(sim);const cls=[];out.forEach(o=>{const c=cls.find(c=>Math.abs(c.a-o.a)<1.2);if(c)c.list.push(o);else cls.push({a:o.a,list:[o]});});cls.sort((a,b)=>a.a-b.a);return {D,cls};}
function angleText(sim){const {cls}=angleClasses(sim);if(!cls.length)return 'none (one bond)';const shown=cls.length>1?cls.filter(c=>c.a<179.4):cls;return shown.map(c=>c.a.toFixed(1)+'°').join(', ');}
function minAngle(sim){const {cls}=angleClasses(sim);return cls.length?cls[0].a:null;}

/* ---------- view rotation (kept across resets) ---------- */
function view(sim){if(!sim.R)sim.R=mm(rotX(0.32),rotY(-0.55));return sim.R;}
function turn(sim,ax,ay){sim.R=ortho(mm(mm(rotY(ax),rotX(ay)),view(sim)));}
function bindDrag(sim){const cv=sim.ui&&sim.ui.stage;if(!cv||cv._vsepr)return;cv._vsepr=true;cv.style.touchAction='none';cv.style.cursor='grab';let drag=null;
  cv.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,t:performance.now()};sim.dragging=true;sim.inertia=null;try{cv.setPointerCapture(e.pointerId);}catch(er){}cv.style.cursor='grabbing';});
  cv.addEventListener('pointermove',e=>{if(!drag)return;const r=cv.getBoundingClientRect(),s=800/r.width,dx=(e.clientX-drag.x)*s,dy=(e.clientY-drag.y)*s,now=performance.now(),dt=Math.max(1,now-drag.t)/1000;
    turn(sim,dx*0.0105,dy*0.0105);sim.inertia={x:dx*0.0105/dt,y:dy*0.0105/dt};drag={x:e.clientX,y:e.clientY,t:now};});
  const up=()=>{if(drag&&sim.inertia&&performance.now()-drag.t>90)sim.inertia=null;drag=null;sim.dragging=false;cv.style.cursor='grab';};
  cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);}

const ATOMC={X:'#d7dbe2'};
const ballR=s=>s==='X'?22:clamp(0.36*CL.el(s).radius,15,38);
const CX=400,CY=246;

const VS={
  id:'vsepr',hash:'vsepr',apUnit:5,order:4,tab:'Molecule shapes',kind:'Simulation',prereq:['lewis'],next:['polarity','imf'],
  card:'Add bonds and lone pairs to a central atom, spin the 3D molecule, and measure how lone pairs squeeze the bond angles.',
  title:'Molecule shapes: VSEPR in 3D',
  lede:{bio:'Electron groups around a central atom push each other as far apart as they can. Add bonded atoms and lone pairs and watch the shape change.',
        honors:'Separate the electron-domain geometry from the molecular geometry, and measure how lone pairs squeeze bond angles below the ideal values.',
        ap:'Go to five and six electron domains, see why lone pairs sit equatorial, and read hybridization and σ/π counts for real molecules.'},
  scale:'One molecule, magnified about 300 million times. Real bonds are 0.1 to 0.2 nm long.',
  timeless:true,graph:false,chChange:0.8,chReveal:2.6,
  controls:[
    {id:'mode',label:'Molecule',type:'seg',def:'model',lvl:'bio',options:[{v:'model',l:'Build a shape'},{v:'real',l:'Real molecules'}],onChange:sync},
    {id:'nb',label:'Bonded atoms',type:'seg',def:4,lvl:'bio',modes:['model'],options:[1,2,3,4,5,6].map(v=>({v,l:String(v),lvl:v>4?'ap':'bio'})),onChange(sim){fitDomains(sim,'nb');}},
    {id:'nl',label:'Lone pairs on the central atom',type:'seg',def:0,lvl:'bio',modes:['model'],options:[0,1,2,3].map(v=>({v,l:String(v)})),onChange(sim){fitDomains(sim,'nl');}},
    {id:'btype',label:'Bond type',type:'seg',def:1,lvl:'honors',modes:['model'],options:[{v:1,l:'Single'},{v:2,l:'Double'},{v:3,l:'Triple'}],help:'A double or triple bond still counts as one electron domain.'},
    {id:'mol',label:'Real molecule',type:'select',def:'NH3',lvl:'bio',modes:['real'],options:MOLS.map(m=>({v:m.id,l:fmtF(m)+'  '+m.name,lvl:m.lvl}))},
    {id:'spin',label:'Spin slowly',type:'toggle',def:true,lvl:'bio',help:'Or drag the molecule to turn it yourself.'},
    {id:'angles',label:'Show bond angles',type:'toggle',def:true,lvl:'bio'},
    {id:'lps',label:'Show lone pairs',type:'toggle',def:true,lvl:'honors',help:'Turn off to see only the molecular geometry.'},
    {id:'ghost',label:'Compare with ideal angles',type:'toggle',def:false,lvl:'honors',help:'Faint sticks show where the bonds would be with no lone-pair squeeze.'}
  ],
  actions:[
    {id:'left',label:'◀ Turn',lvl:'bio',run(sim){sim.queue={x:-Math.PI/6,y:0,left:0.35};}},
    {id:'right',label:'Turn ▶',lvl:'bio',run(sim){sim.queue={x:Math.PI/6,y:0,left:0.35};}},
    {id:'up',label:'▲ Tilt',lvl:'bio',run(sim){sim.queue={x:0,y:-Math.PI/6,left:0.35};}},
    {id:'down',label:'Tilt ▼',lvl:'bio',run(sim){sim.queue={x:0,y:Math.PI/6,left:0.35};}},
    {id:'home',label:'Reset view',lvl:'bio',run(sim){sim.R=null;sim.inertia=null;}}
  ],
  init(){return {};},
  metrics:[
    {id:'shape',label:'Molecular geometry (shape)',unit:'',lvl:'bio',text:true,get:s=>{const c=config(s);return SHAPE[c.nb+','+c.nl]||'—';}},
    {id:'ang',label:'Bond angles, measured',unit:'',lvl:'bio',text:true,get:s=>angleText(s)},
    {id:'ndom',label:'Electron domains',unit:'',lvl:'bio',d:0,get:s=>{const c=config(s);return c.nb+c.nl;}},
    {id:'edg',label:'Electron-domain geometry',unit:'',lvl:'honors',text:true,get:s=>{const c=config(s);return EDG[c.nb+c.nl];}},
    {id:'axe',label:'VSEPR notation',unit:'',lvl:'honors',text:true,get:s=>{const c=config(s);return 'AX'+(c.nb>1?CL.sub(c.nb):'')+(c.nl?'E'+(c.nl>1?CL.sub(c.nl):''):'');}},
    {id:'minang',label:'Smallest bond angle',unit:'°',lvl:'honors',d:1,get:s=>minAngle(s)},
    {id:'hyb',label:'Hybridization of the central atom',unit:'',lvl:'ap',text:true,get:s=>{const c=config(s);return c.nb+c.nl>1?HYB[c.nb+c.nl]:'none (single bond)';}},
    {id:'sp',label:'σ and π bonds',unit:'',lvl:'ap',text:true,get:s=>{const c=config(s),pi=c.bo.reduce((x,y)=>x+y-1,0);return c.nb+' σ, '+pi+' π'+(c.m&&c.m.res?' (one resonance structure)':'');}}
  ],
  infoPanel(sim){const c=config(sim),n=c.nb+c.nl,hon=atLeast('honors'),ap=atLeast('ap'),sh=SHAPE[c.nb+','+c.nl];
    let h='<h3>'+(c.m?CL.html(c.m.f,c.m.q)+': '+c.m.name:'Your model: '+c.nb+' bonded atom'+(c.nb>1?'s':'')+', '+c.nl+' lone pair'+(c.nl===1?'':'s'))+'</h3>';
    h+='<p><b>'+n+' electron domain'+(n>1?'s':'')+'</b> around the central atom'+(n>1?' spread into a <b>'+EDG[n].toLowerCase()+'</b> arrangement':'')+'. Counting only the atoms, the shape is <b>'+sh.toLowerCase()+'</b>.</p>';
    if(n>1)h+='<p>Ideal angle'+(n===5?'s':'')+' for '+n+' domains: '+IDEAL[n]+'. Measured here: '+angleText(sim)+'.'+(c.nl&&c.nb>1&&hon?' Lone pairs take up more room than bonding pairs, so they squeeze the bonds together.':'')+'</p>';
    if(ap&&n>1)h+='<p>Hybridization: <b>'+HYB[n]+'</b> ('+n+' domains need '+n+' hybrid orbitals). '+(c.nl?'The lone pairs sit in hybrid orbitals too. ':'')+'Each bond has one σ bond; each extra bond in a double or triple bond is a π bond.</p>';
    if(c.m&&c.m.res&&hon)h+='<p class="help">'+CL.html(c.m.f,c.m.q)+' has resonance. One structure is drawn, but the real bonds are all the same length.</p>';
    return h;},
  narrate(sim){const c=config(sim),n=c.nb+c.nl,hon=atLeast('honors'),sh=SHAPE[c.nb+','+c.nl],a=angleText(sim);
    if(sim.vis.note>0&&sim.vis.noteT)return sim.vis.noteT;
    if(c.nb===1)return 'With only one bonded atom, the molecule is a straight line no matter how many lone pairs the central atom has. Two points always make a line.';
    const nm=c.m?CL.html(c.m.f,c.m.q)+' has ':'This central atom has ';
    let s=nm+c.nb+' bonded atom'+(c.nb>1?'s':'')+' and '+c.nl+' lone pair'+(c.nl===1?'':'s')+', so <b>'+n+' electron domains</b> push apart'+(n===4?' in 3D, not flat: 109.5°, not 90°.':'.')+' The shape is <b>'+sh.toLowerCase()+'</b>'+(c.nl?' because you see only the atoms, not the lone pairs.':'.');
    if(hon&&c.nl&&c.nb>1)s+=' Lone pairs spread out more than bonds, so the bond angles shrink to '+a+'.';
    else if(c.nb>1&&!c.nl)s+=' Bond angle'+(n>=5?'s':'')+': '+a+'.';
    if(c.m&&c.m.P&&c.m.id==='H2S'&&hon)s+=' H₂S closes all the way to 92°, much more than the model predicts: VSEPR gives the shape, not exact angles.';
    return s;},
  tour:[
    {title:'Electron domains',text:'Each stick is a bond to an outer atom. Bonds are electron domains: regions of negative charge around the central atom. Drag the molecule, or use the Turn buttons, to look at it from every side.',focus:[CX-190,CY-190,380,380],speed:1,setup(sim){BioLab.setValues(sim,{mode:'model',nb:4,nl:0,spin:true,angles:true});}},
    {title:'Push as far apart as possible',text:'Four domains do not lie flat at 90°. They point to the corners of a tetrahedron, 109.5° apart, because that puts them as far from each other as they can get in 3D.',focus:[CX-190,CY-190,380,380],speed:1},
    {title:'Swap a bond for a lone pair',text:'Now one domain is a lone pair (the yellow lobe). There are still 4 domains, but you only see 3 atoms: a <b>trigonal pyramid</b>, like NH₃.',focus:[CX-190,CY-190,380,380],speed:1,setup(sim){BioLab.setValues(sim,{nb:3,nl:1});}},
    {title:'Two lone pairs',text:'With 2 lone pairs and 2 bonds, the atoms form a <b>bent</b> shape, like H₂O. The lone pairs take up more room, so the bond angle shrinks to 104.5°.',focus:[CX-190,CY-190,380,380],speed:1,setup(sim){BioLab.setValues(sim,{nb:2,nl:2});}},
    {lvl:'honors',title:'Domain geometry vs shape',text:'The <b>electron-domain geometry</b> counts lone pairs: water’s is tetrahedral. The <b>molecular geometry</b> counts only atoms: water is bent. The faint sticks show the ideal 109.5°.',focus:[CX-190,CY-190,380,380],speed:1,setup(sim){BioLab.setValues(sim,{ghost:true});}},
    {lvl:'honors',title:'Double bonds are one domain',text:'Two double bonds, no lone pairs: CO₂ is linear. A double or triple bond holds more electrons, but they sit in the same region, so it counts as one domain.',focus:[CX-190,CY-190,380,380],speed:1,setup(sim){BioLab.setValues(sim,{ghost:false,nb:2,nl:0,btype:2});}},
    {lvl:'ap',title:'Five domains: lone pairs go equatorial',text:'In a trigonal bipyramid, an equatorial lone pair has only two neighbors at 90°; an axial one would have three. So SF₄’s lone pair sits equatorial and the shape is a <b>seesaw</b>.',focus:[CX-190,CY-190,380,380],speed:1,setup(sim){BioLab.setValues(sim,{btype:1,nb:4,nl:1});}},
    {title:'Real molecules',text:'Real molecules follow the same rules. Switch to Real molecules and compare: CH₄ 109.5°, NH₃ 106.7°, H₂O 104.5°. Each added lone pair squeezes the bonds a little more.',focus:[CX-190,CY-190,380,380],speed:1,setup(sim){BioLab.setValues(sim,{mode:'real',mol:'H2O',ghost:false});}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{mode:'model',nb:4,nl:0,btype:1,ghost:false});},
  onChallenge(sim,ch,phase){if(ch&&ch.instant&&ch.set&&phase==='ask'){BioLab.setValues(sim,ch.set);BioLab.refresh(sim);}},
  challenges:[
    {lvl:'bio',q:'CH₄ has 4 bonded atoms 109.5° apart. If one bonded atom is replaced by a lone pair (like NH₃), the bond angle becomes…',choices:['larger than 109.5°','exactly 109.5°','smaller than 109.5°'],correct:2,
     baseline:{mode:'model',nb:4,nl:0},change:{nb:3,nl:1},changeText:'One bonded atom swapped for a lone pair',
     explain:{bio:'The angle closed to 107°. The lone pair is held by only one nucleus, so it spreads out and pushes the three bonds closer together.'}},
    {lvl:'bio',q:'Two bonded atoms and no lone pairs make a straight line (like CO₂). Add two lone pairs to the central atom (like H₂O). The shape becomes…',choices:['still linear','bent','tetrahedral'],correct:1,
     baseline:{mode:'model',nb:2,nl:0},change:{nl:2},changeText:'Two lone pairs added',
     explain:{bio:'Four domains now spread out in 3D. You only see the two atoms and the central atom, so the molecule is bent (104.5°), not straight. That is why water is bent.'}},
    {lvl:'bio',q:'BF₃ and NH₃ both have three atoms bonded to the central atom. Do they have the same shape?',choices:['Yes, both are flat triangles','No: NH₃ has a lone pair, so it is a pyramid'],correct:1,
     baseline:{mode:'real',mol:'BF3'},change:{mol:'NH3'},changeText:'Switched from BF₃ to NH₃',
     explain:{bio:'BF₃ has 3 domains (trigonal planar, 120°). NH₃ has 3 bonds plus a lone pair, 4 domains, so the atoms form a trigonal pyramid at 106.7°.'}},
    {lvl:'honors',instant:true,set:{mode:'real',mol:'H2O'},q:'What is the electron-domain geometry of water?',choices:['Bent','Tetrahedral','Linear'],correct:1,
     explain:{honors:'Water has 4 electron domains (2 bonds, 2 lone pairs), so the domains are tetrahedral. Bent is its molecular geometry, the shape of the atoms only. The Electron-domain geometry tile shows both.'}},
    {lvl:'honors',q:'A central atom has two single bonds and no lone pairs. If both become double bonds (like CO₂), the shape…',choices:['stays linear','becomes bent','becomes trigonal planar'],correct:0,
     baseline:{mode:'model',nb:2,nl:0,btype:1},change:{btype:2},changeText:'Both bonds made double',
     explain:{honors:'A double bond is still one electron domain: both pairs sit between the same two atoms. Two domains stay 180° apart.'}},
    {lvl:'honors',q:'Going from NH₃ (one lone pair) to H₂O (two lone pairs), the H–X–H bond angle…',choices:['gets smaller','gets larger','stays at 107°'],correct:0,
     baseline:{mode:'real',mol:'NH3'},change:{mol:'H2O'},changeText:'Switched from NH₃ to H₂O',
     explain:{honors:'106.7° → 104.5°. Lone-pair/lone-pair repulsion is the strongest, then lone pair/bond, then bond/bond. A second lone pair squeezes the bonds further.'}},
    {lvl:'ap',q:'Start with 5 bonded atoms (trigonal bipyramidal). Swap one for a lone pair (like SF₄). Where does the lone pair go, and what is the shape?',choices:['Axial: trigonal pyramidal','Equatorial: seesaw','It does not matter: square planar'],correct:1,
     baseline:{mode:'model',nb:5,nl:0},change:{nb:4,nl:1},changeText:'One bonded atom swapped for a lone pair',
     explain:{ap:'An equatorial lone pair has 2 neighbors at 90°; an axial one would have 3. Fewer 90° repulsions wins, so the lone pair is equatorial and the shape is a seesaw. The axial bonds bend away from it (173°).'}},
    {lvl:'ap',instant:true,set:{mode:'real',mol:'XeF4'},q:'XeF₄ has 4 bonded atoms and 2 lone pairs. What is its shape?',choices:['Tetrahedral','Seesaw','Square planar'],correct:2,
     explain:{ap:'6 domains are octahedral. The two lone pairs sit opposite each other (180°) to stay far apart, leaving the four F atoms in a square plane at 90°.'}},
    {lvl:'ap',instant:true,set:{mode:'real',mol:'HCN'},q:'How many σ and π bonds are in H–C≡N, and what is carbon’s hybridization?',choices:['2 σ, 2 π, sp','4 σ, 0 π, sp³','2 σ, 1 π, sp²'],correct:0,
     explain:{ap:'C has 2 domains (the C–H bond and the C≡N bond), so it is sp and linear. Every bond has one σ bond; the triple bond adds 2 π bonds. The σ and π tile shows 2 σ, 2 π.'}}
  ],
  lab:{bio:'<p><b>Question:</b> How does the number of lone pairs change a molecule’s shape?</p><ol><li>Set 4 bonded atoms, 0 lone pairs. Record a trial.</li><li>Change to 3 bonded + 1 lone pair, then 2 + 2. Record each.</li><li>Write down the shape name for each.</li></ol><p>All three have 4 electron domains. Why do they have different shapes?</p>',
       honors:'<p><b>Question:</b> How much does each lone pair squeeze the bond angle?</p><ol><li>In Build a shape, keep 4 electron domains. Record 4+0, 3+1 and 2+2.</li><li>Plot lone pairs (x) against smallest bond angle (y) on the Trials graph.</li><li>Switch to Real molecules: record CH₄, NH₃, H₂O, then H₂S and PCl₃.</li></ol><p>Compare the real angles with the model. Which real molecules break the pattern, and why might a bigger central atom matter?</p>',
       ap:'<p><b>Question:</b> Can you predict shape, angles and hybridization from a Lewis structure?</p><ol><li>For PCl₅, SF₄, ClF₃, XeF₂, SF₆, BrF₅ and XeF₄, predict the shape and hybridization before you select each one.</li><li>Record each trial and check your predictions.</li></ol><p><b>Claim–evidence–reasoning:</b> Explain why lone pairs choose equatorial positions in trigonal bipyramids, using the number of 90° interactions as evidence.</p>'},
  terms:[{t:'Electron domain',d:'A region of electrons around the central atom: a bond (single, double or triple) or a lone pair.'},{t:'VSEPR',d:'Valence shell electron pair repulsion: electron domains push as far apart as possible.'},{t:'Bond angle',d:'The angle between two bonds that share the central atom.'},{t:'Lone pair',d:'A pair of valence electrons on the central atom that is not shared.'},
    {lvl:'honors',t:'Electron-domain geometry',d:'The arrangement of all electron domains, lone pairs included.'},{lvl:'honors',t:'Molecular geometry',d:'The shape made by the atoms only. It matches the domain geometry only when there are no lone pairs.'},{lvl:'honors',t:'AXₘEₙ',d:'A = central atom, X = bonded atoms, E = lone pairs.'},
    {lvl:'ap',t:'Hybridization',d:'Mixing of atomic orbitals into equivalent hybrid orbitals: 2 domains sp, 3 sp², 4 sp³, 5 sp³d, 6 sp³d².'},{lvl:'ap',t:'σ and π bonds',d:'Every bond contains one σ bond (head-on overlap). A double bond adds one π bond and a triple bond adds two.'},{lvl:'ap',t:'Axial / equatorial',d:'In a trigonal bipyramid, the two axial positions are 90° from the three equatorial ones.'}],
  about:'<p>Domains start at the ideal positions for their number: 180°, 120°, 109.5°, 90°/120° and 90°. Lone pairs take the positions that minimize 90° contacts with other domains (equatorial in a trigonal bipyramid, opposite each other in an octahedron).</p><p>In Build a shape, the bond angles then close by the typical amount measured in real molecules of the same type (AX₃E 107°, AX₂E₂ 104.5°, AX₂E 119°, AX₄E 101.6° and 173°, AX₃E₂ 87.5°, AX₄E 84.8°). In Real molecules, each angle is the measured gas-phase value (for example NH₃ 106.7°, H₂S 92.1°, PCl₃ 100.3°, CH₂O H–C–H 116.5°). Every angle you see is measured from the 3D vectors on the screen.</p><p>Simplifications: VSEPR predicts shapes, not exact angles; a pure repulsion model does not reproduce angles like H₂S’s 92°. Bond lengths are drawn from the sum of covalent radii, and model-mode atoms are generic. Lone pairs are drawn as lobes to show the space they take up.</p>',
  initVis(sim){sim.vis.D=null;retarget(sim);sim.vis.arc={};bindDrag(sim);},
  draw(sim,ctx,vdt,k,t){const p=sim.p,v=sim.vis,hon=atLeast('honors');
    settle(sim,vdt);
    // rotation: queued turns, inertia, slow spin
    if(sim.queue&&sim.queue.left>0){const f=Math.min(1,vdt/sim.queue.left);turn(sim,sim.queue.x*f,sim.queue.y*f);sim.queue.x*=(1-f);sim.queue.y*=(1-f);sim.queue.left-=vdt;if(sim.queue.left<=0)sim.queue=null;}
    else if(sim.inertia&&!sim.dragging){turn(sim,sim.inertia.x*vdt,sim.inertia.y*vdt);const d=Math.exp(-3*vdt);sim.inertia.x*=d;sim.inertia.y*=d;if(Math.hypot(sim.inertia.x,sim.inertia.y)<0.05)sim.inertia=null;}
    else if(p.spin&&!sim.dragging&&!RM)turn(sim,0.32*vdt,0);
    const R=view(sim);
    ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
    const g=ctx.createRadialGradient(CX,CY,20,CX,CY,260);g.addColorStop(0,PAL['cv-bg2']);g.addColorStop(1,PAL['cv-bg']);ctx.fillStyle=g;ctx.fillRect(0,0,800,450);
    const cf=v.cf||config(sim),real=p.mode==='real';
    const Lb=162/(1+(k-1)*0.12);let maxSum=1;const cR=real?ballR(cf.c):30;
    if(real)maxSum=Math.max(...cf.lig.map(s=>CL.el(s).radius+CL.el(cf.c).radius));
    const blen=d=>real&&d.s!=='X'?Lb*(CL.el(d.s).radius+CL.el(cf.c).radius)/maxSum:Lb;
    const P3=(u,L)=>{const w=mul(R,u),f=900/(900-w[2]*L);return {x:CX+w[0]*L*f,y:CY-w[1]*L*f,z:w[2],f};};
    const items=[];
    // ghost ideal bonds
    if(hon&&p.ghost&&cf.nl&&cf.nb>1){const gI=construct(cf.nb,cf.nl,{},true);gI.B.forEach(u=>{const a=P3(u,cR*0.9),b=P3(u,Lb);items.push({z:-2,f(){ctx.strokeStyle=PAL['cv-soft'];ctx.globalAlpha=0.55;ctx.setLineDash([6,5]);ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1;}});});}
    (v.D||[]).forEach(d=>{const gr=clamp(d.g,0,1);if(gr<0.02)return;
      if(d.t==='B'){const L=blen(d)*gr,a=P3(d.u,cR*0.85),b=P3(d.u,L),mid=P3(d.u,L*0.55),rb=(real?ballR(d.s):22)*b.f*(0.4+0.6*gr);
        items.push({z:mid.z-0.01,f(){bondStick(ctx,a,b,d.bo||1,d.u,R);}});
        items.push({z:b.z,f(){const col=real?CL.cpk(d.s):ATOMC.X;CL.drawAtom(ctx,b.x,b.y,rb,real?d.s:'',{color:col,label:real?d.s:'',s:Math.max(12*k,Math.min(rb*0.9,24)),alpha:gr<1?gr:undefined});}});}
      else if(hon?p.lps:true){const L=Lb*0.62*gr,c=P3(d.u,L*0.55),tip=P3(d.u,L),dx=tip.x-c.x,dy=tip.y-c.y,len=Math.hypot(dx,dy),ang=Math.atan2(dy,dx);
        items.push({z:c.z,f(){const maj=Math.max(L*0.3,len*1.05+L*0.12),mn=L*0.3;ctx.save();ctx.translate(c.x,c.y);ctx.rotate(ang);
          ctx.globalAlpha=0.42*gr;ctx.fillStyle=PAL['cv-e'];ctx.beginPath();ctx.ellipse(0,0,maj,mn,0,0,6.29);ctx.fill();ctx.globalAlpha=0.9*gr;ctx.strokeStyle=PAL['cv-estroke'];ctx.lineWidth=1.5;ctx.stroke();
          ctx.globalAlpha=gr;ctx.fillStyle=PAL['cv-estroke'];const ex=Math.min(maj*0.45,len*0.6+4);[-1,1].forEach(sg=>{ctx.beginPath();ctx.arc(ex,sg*5.5,3.6,0,6.29);ctx.fill();});ctx.restore();}});}});
    items.push({z:0,f(){CL.drawAtom(ctx,CX,CY,cR,real?cf.c:'',{color:real?CL.cpk(cf.c):'#7d8494',label:real?cf.c:'',s:Math.max(12*k,Math.min(cR*0.9,26))});}});
    items.sort((a,b)=>a.z-b.z).forEach(it=>it.f());
    // bond-angle arcs
    if(p.angles){const {D,cls}=angleClasses(sim);const shown=cls.length>1?cls.filter(c=>c.a<179.4):cls;const used=[];
      shown.slice(0,3).forEach((c,ci)=>{let best=null,bz=-9;c.list.forEach(o=>{const A=mul(R,D[o.i].u),B2=mul(R,D[o.j].u);const vis=Math.hypot(A[0]-B2[0],A[1]-B2[1])+0.35*(A[2]+B2[2])+(v.arc[ci]===o.i+'-'+o.j?0.3:0);if(vis>bz){bz=vis;best=o;}});
        if(!best)return;v.arc[ci]=best.i+'-'+best.j;const a=D[best.i].u,b=D[best.j].u,ra=Lb*(0.4+0.08*ci);const pts=[];
        let perp=null;if(c.a>179){perp=nrm(mul([R[0],R[3],R[6],R[1],R[4],R[7],R[2],R[5],R[8]],[0,0,1]));}
        for(let s=0;s<=24;s++){const tt=s/24;let w;if(perp){const th=tt*Math.PI;const q=[perp[1]*a[2]-perp[2]*a[1],perp[2]*a[0]-perp[0]*a[2],perp[0]*a[1]-perp[1]*a[0]];let qq=nrm(q);w=[a[0]*Math.cos(th)+qq[0]*Math.sin(th),a[1]*Math.cos(th)+qq[1]*Math.sin(th),a[2]*Math.cos(th)+qq[2]*Math.sin(th)];}
          else{const th=c.a*D2R,s1=Math.sin((1-tt)*th)/Math.sin(th),s2=Math.sin(tt*th)/Math.sin(th);w=[a[0]*s1+b[0]*s2,a[1]*s1+b[1]*s2,a[2]*s1+b[2]*s2];}pts.push(P3(w,ra));}
        ctx.strokeStyle=PAL['s4'];ctx.lineWidth=2.5;ctx.beginPath();pts.forEach((q,i)=>i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y));ctx.stroke();
        const m=pts[12];const dm=Math.hypot(m.x-CX,m.y-CY);let lx,ly;if(dm<10){lx=m.x+34*k;ly=m.y-30*k;}else{const off=ra*0.32+20*k;lx=m.x+(m.x-CX)/dm*off;ly=m.y+(m.y-CY)/dm*off;}
        used.forEach(u=>{if(Math.abs(u[0]-lx)<64*k&&Math.abs(u[1]-ly)<22*k)ly+=(ly>u[1]?1:-1)*24*k;});used.push([lx,ly]);
        pill(ctx,c.a.toFixed(1)+'°',lx,ly,PAL['s4'],'#fff',13*k);});}
    // labels
    const sh=SHAPE[cf.nb+','+cf.nl];txt(ctx,sh,18,36,{s:22*Math.min(k,1.6),w:800});
    if(real&&cf.m)txt(ctx,fmtF(cf.m)+'  '+cf.m.name,18,36+24*Math.min(k,1.6),{s:14*k,c:PAL['cv-soft'],w:600});
    const n=cf.nb+cf.nl;txt(ctx,n+' electron domain'+(n>1?'s':''),782,30,{s:14*k,w:700,a:'right'});
    if(hon)txt(ctx,'AX'+(cf.nb>1?CL.sub(cf.nb):'')+(cf.nl?'E'+(cf.nl>1?CL.sub(cf.nl):''):''),782,30+20*k,{s:14*k,w:700,a:'right',c:PAL['cv-soft']});
    txt(ctx,'Drag to rotate',782,440,{s:12*k,a:'right',c:PAL['cv-soft']});
    if(v.note>0){v.note-=vdt;pill(ctx,v.noteT.replace(/<[^>]+>/g,''),400,420,PAL['s4'],'#fff',13*k);}
  },
  thumbSetup(sim){sim.p.nb=3;sim.p.nl=1;sim.vis.D=null;retarget(sim);}
};
function bondStick(ctx,a,b,bo,u,R){const dx=b.x-a.x,dy=b.y-a.y,L=Math.hypot(dx,dy)||1,nx=-dy/L,ny=dx/L;const offs=bo===1?[0]:bo===2?[-4.5,4.5]:[-7,0,7];const w=bo===1?9:bo===2?5.5:4.2;
  offs.forEach(o=>{ctx.lineCap='round';ctx.strokeStyle='#5d6470';ctx.lineWidth=w+2;ctx.beginPath();ctx.moveTo(a.x+nx*o,a.y+ny*o);ctx.lineTo(b.x+nx*o,b.y+ny*o);ctx.stroke();
    ctx.strokeStyle='#b9bec8';ctx.lineWidth=w*0.45;ctx.beginPath();ctx.moveTo(a.x+nx*o-nx*w*0.18,a.y+ny*o-ny*w*0.18);ctx.lineTo(b.x+nx*o-nx*w*0.18,b.y+ny*o-ny*w*0.18);ctx.stroke();});}
// keep the total number of domains within the level's limit by trimming the other control
function fitDomains(sim,changed){const p=sim.p,mx=maxDom();let nb=+p.nb,nl=+p.nl;
  if(nb+nl>mx){if(changed==='nb')nl=Math.max(0,mx-nb);else nb=Math.max(1,mx-nl);if(nb+nl>mx)nl=mx-nb;
    sim.vis.note=2.5;sim.vis.noteT=(atLeast('ap')?'Six domains is the most':'Four domains is the most at this level')+', so the '+(changed==='nb'?'lone pairs were':'bonded atoms were')+' reduced.';
    p.nb=nb;p.nl=nl;if(sim.ui&&sim.ui.ctl){sim.ui.ctl.nb.set(nb);sim.ui.ctl.nl.set(nl);}}}
function sync(sim){if(!sim.ui||!sim.ui.sec)return;const mode=sim.p.mode,d=sim.def;
  d.controls.forEach(c=>{if(!c.modes)return;const cid=d.id+'-'+c.id,e=document.getElementById(cid)||document.getElementById(cid+'-l');if(!e)return;const w=e.closest('.ctl');if(w)w.hidden=!atLeast(c.lvl)||!c.modes.includes(mode);});}
VS.onLevel=function(sim){fitDomains(sim,'nb');sync(sim);};
BioLab.register(VS);
})();
