(function(){
'use strict';
const {clamp,lerp,rr,txt,pill,atLeast,PAL,FONT,RM,axes,legend,serColor,lvText,rng}=BioLab.h;
const CL=window.ChemLab;
const A0=52.918;                     // Bohr radius, pm

/* ---------- orbitals (real, hydrogen-like) ---------- */
const ANG={s:{ml:'0',f:(x,y,z)=>1},pz:{ml:'0',f:(x,y,z)=>z},px:{ml:'±1 (px mixes mℓ = +1 and −1)',f:(x,y,z)=>x},py:{ml:'±1 (py mixes mℓ = +1 and −1)',f:(x,y,z)=>y},
  dz2:{ml:'0',f:(x,y,z)=>(3*z*z-1)/2},dxz:{ml:'±1 (a mix of +1 and −1)',f:(x,y,z)=>2*x*z},dyz:{ml:'±1 (a mix of +1 and −1)',f:(x,y,z)=>2*y*z},
  dxy:{ml:'±2 (a mix of +2 and −2)',f:(x,y,z)=>2*x*y},dx2y2:{ml:'±2 (a mix of +2 and −2)',f:(x,y,z)=>x*x-y*y}};
const SHAPE={s:'s',pz:'pz',px:'px',py:'py',dz2:'dz²',dxz:'dxz',dyz:'dyz',dxy:'dxy',dx2y2:'dx²−y²'};
const ORBS=[];[[1,['s']],[2,['s','pz','px','py']],[3,['s','pz','px','py','dz2','dxz','dyz','dxy','dx2y2']],[4,['s','pz','px','py','dz2','dxz','dyz','dxy','dx2y2']]].forEach(([n,list])=>list.forEach(a=>{const l=a==='s'?0:a[0]==='p'?1:2;ORBS.push({id:n+a,n,l,a,name:n+SHAPE[a]});}));
const OB={};ORBS.forEach(o=>OB[o.id]=o);
const LET='spdf';
function lag(k,a,x){if(k===0)return 1;let L0=1,L1=1+a-x;for(let j=1;j<k;j++){const L2=((2*j+1+a-x)*L1-(j+a)*L0)/(j+1);L0=L1;L1=L2;}return L1;}
function Rnl(n,l,Z,r){const rho=2*Z*r/n;return Math.pow(rho,l)*Math.exp(-rho/2)*lag(n-l-1,2*l+1,rho);}   // unnormalized, r in a0
const GRID=700;
function radial(n,l,Z){const rmax=(2.5*n*n+6*n+5)/Z,dr=rmax/GRID;const P=new Float64Array(GRID+1),Rv=new Float64Array(GRID+1);let s=0;
  for(let i=0;i<=GRID;i++){const r=i*dr,R=Rnl(n,l,Z,r);Rv[i]=R;P[i]=r*r*R*R;s+=P[i]*dr;}
  for(let i=0;i<=GRID;i++){P[i]/=s;}const nr=Math.sqrt(s);for(let i=0;i<=GRID;i++)Rv[i]/=nr;   // R normalized so ∫r²R² dr = 1 (a0 units)
  const cdf=new Float64Array(GRID+1);for(let i=1;i<=GRID;i++)cdf[i]=cdf[i-1]+(P[i]+P[i-1])/2*dr;
  let imax=0;for(let i=1;i<=GRID;i++)if(P[i]>P[imax])imax=i;
  const nodes=[];for(let i=2;i<=GRID;i++){if(Rv[i-1]!==0&&Math.sign(Rv[i])!==Math.sign(Rv[i-1])&&Math.abs(Rv[i])+Math.abs(Rv[i-1])>1e-12)nodes.push((i-0.5)*dr);}
  const inv=u=>{let lo=0,hi=GRID;while(hi-lo>1){const m=(lo+hi)>>1;if(cdf[m]<u)lo=m;else hi=m;}const f=(u-cdf[lo])/Math.max(1e-12,cdf[hi]-cdf[lo]);return (lo+f)*dr;};
  const r90=inv(0.9);let rmp=imax*dr;if(imax>0&&imax<GRID){const d=P[imax-1]-2*P[imax]+P[imax+1];if(d<0)rmp=(imax+0.5*(P[imax-1]-P[imax+1])/d)*dr;}return {P,Rv,dr,rmax,rmp,nodes,inv,r90};}
const avgR=(n,l,Z)=>(3*n*n-l*(l+1))/(2*Z);           // ⟨r⟩ in a0
const NPTS=1700;

function build(sim){const p=sim.p,o=OB[p.orb]||OB['1s'],st=sim.st;const key=o.id+'|'+p.Z;if(st.key===key)return;st.key=key;
  const rad=radial(o.n,o.l,p.Z);st.rad=rad;st.o=o;const f=ANG[o.a].f;const rand=rng(1234+o.n*97+o.l*13+o.a.length*7+p.Z*1009);const pts=[];let guard=0;
  while(pts.length<NPTS&&guard++<400000){const u=2*rand()-1,ph=rand()*6.283185,s=Math.sqrt(1-u*u);const x=s*Math.cos(ph),y=s*Math.sin(ph),z=u;const A=f(x,y,z);
    if(rand()>A*A)continue;const r=rad.inv(rand());const sg=Math.sign(A)*Math.sign(Rnl(o.n,o.l,p.Z,r))||1;pts.push([x*r,y*r,z*r,sg]);}
  st.pts=pts;st.sliceKey='';}
function viewHalf(sim){const st=sim.st;if(sim.p.fix)return radial(4,0,1).r90*1.08;return st.rad.r90*1.12;}   // a0 shown from center to edge
function plane(o){return o.a==='py'||o.a==='dyz'?'yz':o.a==='dxy'||o.a==='dx2y2'?'xy':'xz';}

/* ---------- layout ---------- */
const CX=240,CY=232,VR=196;           // 3D view
const SLX=508,SLY=26,SLW=280,SLH=232;  // slice panel
const SQ=Math.min(SLW-20,SLH-44);

function proj(sim,x,y,z){const a=sim.st.yaw,b=sim.st.pitch,S=VR/viewHalf(sim);const x1=x*Math.cos(a)-y*Math.sin(a),y1=x*Math.sin(a)+y*Math.cos(a);const z2=z*Math.cos(b)+y1*Math.sin(b),d=-z*Math.sin(b)+y1*Math.cos(b);return [CX+x1*S,CY-z2*S,d];}
function hexRGB(h){h=(h||'#888888').trim();if(h[0]!=='#')return [128,128,128];if(h.length===4)h='#'+h[1]+h[1]+h[2]+h[2]+h[3]+h[3];return [parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];}
let sliceCv=null;
function slice(sim){const st=sim.st,p=sim.p,o=st.o;const key=st.key+'|'+p.phase+'|'+p.fix+'|'+atLeast('honors')+'|'+PAL['s2']+PAL['s4'];if(st.sliceKey===key&&sliceCv)return sliceCv;st.sliceKey=key;
  const G=96;if(!sliceCv){sliceCv=document.createElement('canvas');}sliceCv.width=G;sliceCv.height=G;const c=sliceCv.getContext('2d'),img=c.createImageData(G,G);const L=viewHalf(sim),f=ANG[o.a].f,pl=plane(o);
  const vals=new Float64Array(G*G);let mx=0;for(let j=0;j<G;j++)for(let i=0;i<G;i++){const u=(i+0.5)/G*2-1,v=1-(j+0.5)/G*2;let x=0,y=0,z=0;if(pl==='xz'){x=u*L;z=v*L;}else if(pl==='yz'){y=u*L;z=v*L;}else{x=u*L;y=v*L;}
    const r=Math.hypot(x,y,z)||1e-9;const psi=Rnl(o.n,o.l,p.Z,r)*f(x/r,y/r,z/r);vals[j*G+i]=psi;mx=Math.max(mx,psi*psi);}
  const cp=hexRGB(PAL['s2']),cn=hexRGB(p.phase&&atLeast('honors')?PAL['s4']:PAL['s2']);
  for(let q=0;q<G*G;q++){const v=vals[q],a=Math.pow(v*v/(mx||1),0.42);const col=v>=0?cp:cn;img.data[q*4]=col[0];img.data[q*4+1]=col[1];img.data[q*4+2]=col[2];img.data[q*4+3]=Math.round(255*a);}
  c.putImageData(img,0,0);return sliceCv;}

function sync(sim){if(!sim.ui||!sim.ui.sec)return;const st=sim.st;if(st&&!st._drag){st._drag=true;const cv=sim.ui.stage;let down=null;
    cv.addEventListener('pointerdown',e=>{const r=cv.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*800;if(x>490)return;down={x:e.clientX,y:e.clientY};try{cv.setPointerCapture(e.pointerId);}catch(_){}});
    cv.addEventListener('pointermove',e=>{if(!down)return;const s=sim.st;s.yaw+=(e.clientX-down.x)*0.012;s.pitch=clamp(s.pitch+(e.clientY-down.y)*0.012,-1.5,1.5);down={x:e.clientX,y:e.clientY};s.held=1.2;});
    const up=()=>{down=null;};cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);cv.style.touchAction='pan-y';}}
function onOrb(sim){sim.p.Z=clamp(Math.round(sim.p.Z)||1,1,6);if(sim.st)build(sim);}

const X1=radial(1,0,1),X2=radial(2,0,1),XHe=radial(1,0,2);

const SIM={
  id:'orbitals',hash:'orbitals',apUnit:17,order:1,tab:'Orbital shapes',kind:'Go further',
  prereq:['econfig'],next:['pes','vsepr'],
  card:'Spin 3D probability clouds for s, p and d orbitals computed from the hydrogen wavefunctions, and find their nodes.',
  title:'Atomic orbitals in 3D',
  lede:{bio:'An orbital is not a path. It is a cloud showing where an electron is likely to be. Pick an orbital and spin it to see its shape: s orbitals are spheres, p orbitals are dumbbells, and d orbitals are mostly four-leaf clovers.',
        honors:'Connect each shape to its quantum numbers. n sets the size, ℓ sets the shape, and mℓ sets the direction. Count the nodes, the places where the electron is never found.',
        ap:'The clouds are sampled from |ψ|² of the hydrogen-like wavefunctions ψ = R(r)·Y(θ,φ). Color shows the sign of ψ, and the graph shows the radial probability r²R².'},
  scale:{bio:'The cloud is a hydrogen atom’s electron. The 1s cloud is about 0.1 nm (100 pm) across; the scale bar shows the real size for each orbital.',
         honors:'Each view zooms to fit the orbital unless you lock the zoom. 1 a₀ (the Bohr radius) = 52.9 pm.'},
  timeless:true,animated:true,chChange:0.5,chReveal:1.5,
  controls:[
    {id:'orb',label:'Orbital',type:'select',def:'2pz',lvl:'bio',noTrial:true,options:ORBS.map(o=>({v:o.id,l:o.name+(o.l===0?' (sphere)':'')})),onChange:onOrb},
    {id:'spin',label:'Spin the view',type:'toggle',def:true,lvl:'bio',noTrial:true,help:'Or drag the cloud to turn it yourself.'},
    {id:'phase',label:'Color by sign of ψ',type:'toggle',def:true,lvl:'honors',noTrial:true,help:'Blue where the wavefunction is positive, orange where it is negative. Nodes sit between colors.'},
    {id:'nodes',label:'Show nodes',type:'toggle',def:false,lvl:'honors',noTrial:true,help:'Dashed circles are spherical (radial) nodes; flat sheets and cones are angular nodes.'},
    {id:'fix',label:'Same zoom for every orbital',type:'toggle',def:false,lvl:'honors',noTrial:true,help:'Lock the zoom to compare real sizes. Small orbitals look tiny.',onChange:s=>{if(s.st)s.st.sliceKey='';}},
    {id:'Z',label:'Nuclear charge Z (hydrogen-like ion)',type:'range',min:1,max:6,step:1,def:1,lvl:'ap',help:'Z = 2 is He⁺, Z = 3 is Li²⁺: one electron, more protons.',onChange:onOrb}
  ],
  actions:[
    {id:'left',label:'◀ Turn',lvl:'bio',run(sim){sim.st.yaw-=0.35;sim.st.held=1.5;}},
    {id:'right',label:'Turn ▶',lvl:'bio',run(sim){sim.st.yaw+=0.35;sim.st.held=1.5;}},
    {id:'up',label:'Tilt ▲',lvl:'bio',run(sim){sim.st.pitch=clamp(sim.st.pitch+0.3,-1.5,1.5);sim.st.held=1.5;}},
    {id:'down',label:'Tilt ▼',lvl:'bio',run(sim){sim.st.pitch=clamp(sim.st.pitch-0.3,-1.5,1.5);sim.st.held=1.5;}},
    {id:'home',label:'Reset view',lvl:'bio',run(sim){sim.st.yaw=0.55;sim.st.pitch=0.32;}}
  ],
  init(sim){const st={yaw:0.55,pitch:0.32,held:0,key:'',_drag:sim.st?sim.st._drag:false};sim.st=st;build(sim);return st;},
  step(sim,dt){const st=sim.st;build(sim);if(st.held>0)st.held-=dt;else if(sim.p.spin&&!RM)st.yaw+=dt*0.45;},
  metrics:[
    {id:'name',label:'Orbital',lvl:'bio',text:true,get:s=>{const o=OB[s.p.orb];return o.name+': '+(o.l===0?'sphere':o.l===1?'dumbbell (two lobes)':o.a==='dz2'?'dumbbell with a ring':'four lobes (clover)');}},
    {id:'n',label:'Principal quantum number n',lvl:'bio',min:1,max:4,d:0,get:s=>OB[s.p.orb].n},
    {id:'l',label:'Angular momentum ℓ',lvl:'honors',min:0,max:3,d:0,get:s=>OB[s.p.orb].l},
    {id:'ml',label:'Magnetic quantum number mℓ',lvl:'honors',text:true,noTrial:true,get:s=>ANG[OB[s.p.orb].a].ml},
    {id:'rmp',label:'Most probable distance from nucleus',unit:'pm',lvl:'bio',min:0,max:null,d:0,get:s=>s.st.rad.rmp*A0},
    {id:'rn',label:'Radial (spherical) nodes',lvl:'honors',min:0,max:3,d:0,get:s=>{const o=OB[s.p.orb];return o.n-o.l-1;}},
    {id:'an',label:'Angular nodes',lvl:'honors',min:0,max:2,d:0,get:s=>OB[s.p.orb].l},
    {id:'ravg',label:'Average distance ⟨r⟩',unit:'pm',lvl:'ap',min:0,max:null,d:0,get:s=>{const o=OB[s.p.orb];return avgR(o.n,o.l,s.p.Z)*A0;}},
    {id:'E',label:'Energy of this level, Eₙ = −2.178 × 10⁻¹⁸ J · Z²/n²',lvl:'ap',text:true,noTrial:true,get:s=>{const o=OB[s.p.orb];return CL.sci(-2.178e-18*s.p.Z*s.p.Z/(o.n*o.n),'J');}}
  ],
  graphs:[{id:'P',label:'Radial probability r²R²',lvl:'bio',custom:true},{id:'cmp',label:'Compare 1s to 4s',lvl:'honors',custom:true},{id:'R',label:'Wavefunction R(r)',lvl:'ap',custom:true}],
  defaultGraph:'P',
  plot(sim,ctx,box,id){const p=sim.p,o=OB[p.orb],rad=sim.st.rad;
    if(id==='cmp'){const curves=[1,2,3,4].map(n=>radial(n,0,p.Z));const xmax=curves[3].rmax*A0*0.75;let ymax=0;curves.forEach(c=>{for(let i=0;i<=GRID;i++)ymax=Math.max(ymax,c.P[i]/A0*1000);});
      const ax=axes(ctx,box,{xmin:0,xmax,ymin:0,ymax:ymax*1.08,xl:'Distance from nucleus r (pm)',yl:'Radial probability (per nm)',yd:1});
      ctx.save();ctx.beginPath();ctx.rect(box.L,box.T,box.W,box.H);ctx.clip();curves.forEach((c,i)=>{ctx.strokeStyle=serColor(i);ctx.lineWidth=o.n===i+1&&o.l===0?3.5:2;ctx.beginPath();for(let j=0;j<=GRID;j++){const x=j*c.dr*A0,y=c.P[j]/A0*1000;j?ctx.lineTo(ax.X(x),ax.Y(y)):ctx.moveTo(ax.X(x),ax.Y(y));}ctx.stroke();});ctx.restore();
      legend(ctx,box.L+12,box.T+10,[1,2,3,4].map((n,i)=>({label:n+'s',color:serColor(i)})));return;}
    const xmax=rad.rmax*A0;
    if(id==='P'){let ymax=0;for(let i=0;i<=GRID;i++)ymax=Math.max(ymax,rad.P[i]/A0*1000);const ax=axes(ctx,box,{xmin:0,xmax,ymin:0,ymax:ymax*1.12,xl:'Distance from nucleus r (pm)',yl:'Radial probability (per nm)',yd:1});
      ctx.save();ctx.beginPath();ctx.rect(box.L,box.T,box.W,box.H);ctx.clip();ctx.beginPath();for(let i=0;i<=GRID;i++){const x=ax.X(i*rad.dr*A0),y=ax.Y(rad.P[i]/A0*1000);i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.lineTo(ax.X(xmax),ax.Y(0));ctx.lineTo(ax.X(0),ax.Y(0));ctx.closePath();ctx.fillStyle=PAL['g-fill'];ctx.fill();
      ctx.beginPath();for(let i=0;i<=GRID;i++){const x=ax.X(i*rad.dr*A0),y=ax.Y(rad.P[i]/A0*1000);i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.strokeStyle=serColor(0);ctx.lineWidth=2.5;ctx.stroke();
      rad.nodes.forEach(r=>{ctx.strokeStyle=PAL['s5'];ctx.setLineDash([4,4]);ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(ax.X(r*A0),box.T);ctx.lineTo(ax.X(r*A0),box.T+box.H);ctx.stroke();ctx.setLineDash([]);});
      ctx.fillStyle=serColor(1);ctx.beginPath();ctx.arc(ax.X(rad.rmp*A0),ax.Y(rad.P[Math.round(rad.rmp/rad.dr)]/A0*1000),6,0,6.29);ctx.fill();ctx.restore();
      legend(ctx,box.L+12,box.T+10,[{label:o.name+' r²R²',color:serColor(0)},{label:'most probable r = '+Math.round(rad.rmp*A0)+' pm',color:serColor(1)}].concat(rad.nodes.length?[{label:'radial node',color:PAL['s5'],dash:true}]:[]));return;}
    let ymn=0,ymx=0;for(let i=0;i<=GRID;i++){ymn=Math.min(ymn,rad.Rv[i]);ymx=Math.max(ymx,rad.Rv[i]);}const pad=(ymx-ymn)*0.1||0.1;
    const ax=axes(ctx,box,{xmin:0,xmax,ymin:ymn-pad,ymax:ymx+pad,xl:'Distance from nucleus r (pm)',yl:'R(r) (a₀^−3/2)',yd:2});
    ctx.save();ctx.beginPath();ctx.rect(box.L,box.T,box.W,box.H);ctx.clip();ctx.beginPath();for(let i=0;i<=GRID;i++){const x=ax.X(i*rad.dr*A0),y=ax.Y(rad.Rv[i]);i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.strokeStyle=serColor(0);ctx.lineWidth=2.5;ctx.stroke();
    rad.nodes.forEach(r=>{ctx.fillStyle=PAL['s5'];ctx.beginPath();ctx.arc(ax.X(r*A0),ax.Y(0),5,0,6.29);ctx.fill();});ctx.restore();
    legend(ctx,box.L+12,box.T+10,[{label:'R(r) for '+o.name+': '+rad.nodes.length+' sign change'+(rad.nodes.length===1?'':'s'),color:serColor(0)}]);},
  narrate(sim){const p=sim.p,o=OB[p.orb],rad=sim.st.rad,hon=atLeast('honors');const rn=o.n-o.l-1,an=o.l;
    let s='Each dot is one possible spot for the electron. Where dots crowd together, the electron is most likely to be. ';
    if(o.l===0)s+='The <b>'+o.name+' orbital is a sphere</b>, the same in every direction'+(rn?', with '+rn+' empty spherical shell'+(rn>1?'s':'')+' inside (radial node'+(rn>1?'s':'')+').':'.');
    else if(o.l===1)s+='The <b>'+o.name+' orbital has two lobes</b> along the '+o.a[1]+' axis. The electron is never found on the flat plane between them (an angular node).';
    else s+='The <b>'+o.name+' orbital</b> '+(o.a==='dz2'?'has two lobes along z and a ring around the middle, separated by two cone-shaped nodes.':'has four lobes, separated by two planes where the electron is never found.');
    if(hon)s+=' Nodes: '+rn+' radial + '+an+' angular = '+(o.n-1)+' (always n − 1).';
    if(p.Z>1)s+=' With Z = '+p.Z+', the nucleus pulls '+p.Z+' times harder, so the cloud shrinks to 1/'+p.Z+' the size.';
    return s;},
  tour:[
    {title:'A cloud, not an orbit',text:'This is hydrogen’s 1s orbital. Each dot marks a place the electron could be found if you measured it. The electron has no path; the cloud shows probability.',focus:[CX-200,CY-205,400,410],speed:1,setup(sim){BioLab.setValues(sim,{orb:'1s',Z:1,fix:false,nodes:false,spin:true});}},
    {title:'Higher n, bigger orbital',text:{bio:'The 2s orbital is also a sphere, but much bigger. Inside it is an empty shell where the electron is never found, a node.',honors:'2s has n − ℓ − 1 = 1 radial node: a sphere where ψ changes sign (blue inside, orange outside).'},focus:[CX-200,CY-205,400,410],speed:1,setup(sim){BioLab.setValues(sim,{orb:'2s'});}},
    {title:'p orbitals: two lobes',text:'The 2pz orbital has two lobes along the z axis. Between them is a flat plane through the nucleus where the electron is never found.',focus:[CX-200,CY-205,400,410],speed:1,setup(sim){BioLab.setValues(sim,{orb:'2pz'});}},
    {title:'Three directions',text:'Every p sublevel has three orbitals pointing along x, y and z. That is why a p sublevel holds 3 × 2 = 6 electrons. This is 2px.',focus:[CX-200,CY-205,400,410],speed:1,setup(sim){BioLab.setValues(sim,{orb:'2px'});}},
    {title:'d orbitals: four lobes',text:'Most d orbitals look like four-leaf clovers. There are five of them, so a d sublevel holds 10 electrons. This is 3dxy, with lobes between the x and y axes.',focus:[CX-200,CY-205,400,410],speed:1,setup(sim){BioLab.setValues(sim,{orb:'3dxy'});}},
    {title:'A slice through the middle',text:'The panel on the right cuts the cloud in half. Bright areas are where the electron is most likely; dark gaps are nodes.',focus:[SLX-6,SLY-6,SLW+12,SLH+12],speed:1},
    {lvl:'honors',title:'Quantum numbers set the shape',text:'n = 3 sets the size and energy, ℓ = 2 makes it a d orbital, and mℓ picks its direction. A 3d orbital has 3 − 2 − 1 = 0 radial nodes and 2 angular nodes.',focus:[SLX-6,SLY+SLH,SLW+12,450-SLY-SLH-6],speed:1,setup(sim){BioLab.setValues(sim,{nodes:true});}},
    {lvl:'ap',title:'More protons, smaller orbitals',text:'He⁺ has one electron, like hydrogen, but Z = 2. Its 1s cloud is half the size: the most probable distance drops from 52.9 pm to 26.5 pm.',focus:[CX-200,CY-205,400,410],speed:1,setup(sim){BioLab.setValues(sim,{orb:'1s',Z:2,fix:true,nodes:false});}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{orb:'2pz',Z:1,fix:false,nodes:false,spin:true});},
  onChallenge(sim,ch,phase){if(ch&&ch.set&&phase==='done'){BioLab.setValues(sim,ch.set);sim.infoDirty=true;}},
  challenges:[
    {lvl:'bio',instant:true,set:{orb:'1s',Z:1},q:'What do the dots in an orbital picture show?',choices:['The path the electron travels around the nucleus','Places where the electron is likely to be found','Many different electrons at once'],correct:1,
     explain:{bio:'An orbital is a probability cloud for one electron. Dense regions are where it is most likely to be found. Electrons do not follow planet-like orbits.'}},
    {lvl:'bio',instant:true,set:{orb:'2s',Z:1,fix:true},q:'Which orbital is bigger, 1s or 2s?',choices:['1s','2s','They are the same size'],correct:1,
     explain:{bio:'Higher n means a bigger orbital. The most probable distance is '+Math.round(X1.rmp*A0)+' pm for 1s and '+Math.round(X2.rmp*A0)+' pm for 2s. The zoom is now locked so you can compare.'}},
    {lvl:'bio',instant:true,set:{orb:'2pz',Z:1,fix:false},q:'Where is an electron in a 2pz orbital never found?',choices:['In the flat plane through the nucleus between the two lobes','At the far ends of the lobes','Anywhere along the z axis'],correct:0,
     explain:{bio:'The two lobes meet only at the nucleus. The flat xy-plane between them is a node, where the probability is exactly zero. Look at the dark band in the slice.'}},
    {lvl:'honors',instant:true,set:{orb:'3s',Z:1,nodes:true},q:'How many radial (spherical) nodes does a 3s orbital have?',choices:['0','1','2','3'],correct:2,
     explain:{honors:'Radial nodes = n − ℓ − 1 = 3 − 0 − 1 = 2. They show up as two dashed circles in the cloud and two dark rings in the slice.'}},
    {lvl:'honors',instant:true,set:{orb:'3dxz',Z:1,nodes:true},q:'Which orbitals have exactly 2 angular nodes?',choices:['Every d orbital','Every p orbital','Only s orbitals'],correct:0,
     explain:{honors:'The number of angular nodes equals ℓ. d orbitals have ℓ = 2, so two angular nodes: two planes for dxz, dyz, dxy and dx²−y², and two cones for dz².'}},
    {lvl:'honors',instant:true,set:{orb:'4pz',Z:1,nodes:true},q:'How many nodes does a 4p orbital have in total?',choices:['1','2','3','4'],correct:2,
     explain:{honors:'Total nodes = n − 1 = 3: two radial nodes (4 − 1 − 1) and one angular node (ℓ = 1).'}},
    {lvl:'ap',instant:true,set:{orb:'3dz2',Z:1},q:'Which set of quantum numbers can describe a 3d electron?',choices:['n = 3, ℓ = 2, mℓ = −1, mₛ = +½','n = 3, ℓ = 3, mℓ = 0, mₛ = +½','n = 2, ℓ = 2, mℓ = 1, mₛ = −½','n = 3, ℓ = 1, mℓ = −2, mₛ = −½'],correct:0,
     explain:{ap:'d means ℓ = 2, and ℓ must be less than n, so n = 3 works. mℓ can run from −ℓ to +ℓ, so −1 is allowed. ℓ = 3 needs n ≥ 4, and |mℓ| can never exceed ℓ.'}},
    {lvl:'ap',instant:true,set:{orb:'1s',Z:2,fix:true},q:'He⁺ has one electron in a 1s orbital, like hydrogen, but Z = 2. How does its most probable distance compare?',choices:['Half as far: about 26 pm','Twice as far: about 106 pm','The same: 53 pm'],correct:0,
     explain:{ap:'Every distance in the hydrogen-like wavefunction scales as a₀/Z. The model gives '+Math.round(XHe.rmp*A0)+' pm for He⁺ against '+Math.round(X1.rmp*A0)+' pm for H. The energy grows as Z², four times as negative.'}},
    {lvl:'ap',instant:true,set:{orb:'2s',Z:1},q:'In hydrogen, ⟨r⟩ is 6 a₀ for 2s and 5 a₀ for 2p. Yet in many-electron atoms, 2s electrons are held more tightly than 2p. Why?',choices:['A small inner lobe of 2s penetrates close to the nucleus, inside the 1s shielding','2s has more nodes, and nodes pull electrons inward','2s electrons spin faster than 2p electrons'],correct:0,
     explain:{ap:'Look at the Radial probability graph for 2s: a small hump sits close to the nucleus. That inner lobe slips inside the 1s electrons, so a 2s electron feels a larger effective nuclear charge. PES shows it: carbon’s 2s peak is at 1.72 MJ/mol, its 2p at 1.09.'}}
  ],
  lab:{bio:'<p><b>Question:</b> How do orbitals change as n gets bigger?</p><ol><li>Look at 1s, 2s, 3s and 4s. Record a trial for each.</li><li>Record the most probable distance from the nucleus.</li><li>On the Trials graph, plot n (x) against Most probable distance (y).</li></ol><p>Describe the pattern. Why do electrons in higher levels have more energy and sit farther from the nucleus?</p>',
       honors:'<p><b>Question:</b> How do quantum numbers predict an orbital’s nodes?</p><ol><li>Turn on Show nodes. For 2s, 2p, 3s, 3p, 3d, 4s, 4p and 4d, record a trial.</li><li>Count the radial nodes (dashed spheres) and angular nodes (planes or cones) yourself, then check the tiles.</li><li>Find a rule for each in terms of n and ℓ.</li></ol><p>Write your rules and explain why a 2d orbital cannot exist.</p>',
       ap:'<p><b>Question:</b> How does nuclear charge change an orbital?</p><ol><li>Choose 1s and lock the zoom.</li><li>Record trials for Z = 1 to 6 (H, He⁺, Li²⁺, …).</li><li>Plot Z against Most probable distance, then against ⟨r⟩.</li></ol><p><b>Claim–evidence–reasoning:</b> Find the mathematical relationship and connect it to why core electrons have huge binding energies in PES.</p>'},
  terms:[{t:'Orbital',d:'A region where an electron is likely to be found; it holds up to two electrons.'},{t:'Probability cloud',d:'A picture of an orbital where dot density shows how likely the electron is to be there.'},{t:'Node',d:'A surface where the probability of finding the electron is zero.'},
    {t:'s, p, d',d:'Orbital shapes: s is a sphere, p has two lobes, d mostly has four lobes.'},{lvl:'honors',t:'Quantum numbers',d:'n (size and energy), ℓ (shape), mℓ (orientation), mₛ (spin).'},{lvl:'honors',t:'Radial node',d:'A spherical node; there are n − ℓ − 1 of them.'},{lvl:'honors',t:'Angular node',d:'A flat plane or cone through the nucleus; there are ℓ of them.'},
    {lvl:'ap',t:'Wavefunction ψ',d:'The solution of the Schrödinger equation. |ψ|² gives the probability density; ψ itself can be positive or negative.'},{lvl:'ap',t:'Radial probability',d:'P(r) = r²R(r)², the chance of finding the electron at distance r from the nucleus, summed over all directions.'},{lvl:'ap',t:'Bohr radius a₀',d:'52.9 pm, the most probable distance for hydrogen’s 1s electron.'}],
  about:'<p>The dots are random samples from |ψ|² of the exact one-electron (hydrogen-like) wavefunctions, ψ = R<sub>nℓ</sub>(r)·Y(θ,φ). R uses the associated Laguerre polynomials, R ∝ ρ<sup>ℓ</sup>e<sup>−ρ/2</sup>L<sub>n−ℓ−1</sub><sup>2ℓ+1</sup>(ρ) with ρ = 2Zr/(na₀), normalized numerically. The angular parts are the real combinations chemists draw (px, py, dxy, dx²−y² and so on); px and py are mixtures of mℓ = +1 and −1, so they have no single mℓ value. Each picture uses 1700 samples, so faint outer regions look sparse. Orbitals in many-electron atoms have the same shapes and node counts but different sizes and energies, because other electrons shield the nucleus. The f orbitals (ℓ = 3) are not shown.</p>',
  initVis(sim){},
  draw(sim,ctx,vdt,k,t){const p=sim.p,st=sim.st,o=st.o,rad=st.rad,hon=atLeast('honors'),ap=atLeast('ap');build(sim);
    ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
    const L=viewHalf(sim),S=VR/L;
    // axes (back halves faint)
    const ax3=[[1,0,0,'x'],[0,1,0,'y'],[0,0,1,'z']];
    ax3.forEach(a=>{const q1=proj(sim,-a[0]*L*0.95,-a[1]*L*0.95,-a[2]*L*0.95),q2=proj(sim,a[0]*L*0.95,a[1]*L*0.95,a[2]*L*0.95);ctx.strokeStyle=PAL['line'];ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(q1[0],q1[1]);ctx.lineTo(q2[0],q2[1]);ctx.stroke();});
    // nodes
    if(p.nodes&&hon){ctx.save();ctx.setLineDash([5,4]);ctx.strokeStyle=PAL['s5'];ctx.lineWidth=1.6;
      rad.nodes.forEach(r=>{if(r*S<VR*1.05){ctx.beginPath();ctx.arc(CX,CY,r*S,0,6.29);ctx.stroke();}});
      const R=L*0.8;const quad=(c)=>{const q=c.map(v=>proj(sim,v[0]*R,v[1]*R,v[2]*R));ctx.beginPath();q.forEach((v,i)=>i?ctx.lineTo(v[0],v[1]):ctx.moveTo(v[0],v[1]));ctx.closePath();ctx.fillStyle=PAL['s5'];ctx.globalAlpha=0.1;ctx.fill();ctx.globalAlpha=1;ctx.stroke();};
      const PLN={xy:[[1,1,0],[-1,1,0],[-1,-1,0],[1,-1,0]],xz:[[1,0,1],[-1,0,1],[-1,0,-1],[1,0,-1]],yz:[[0,1,1],[0,-1,1],[0,-1,-1],[0,1,-1]],d1:[[0.707,0.707,1],[-0.707,-0.707,1],[-0.707,-0.707,-1],[0.707,0.707,-1]],d2:[[0.707,-0.707,1],[-0.707,0.707,1],[-0.707,0.707,-1],[0.707,-0.707,-1]]};
      const planes={pz:['xy'],px:['yz'],py:['xz'],dxz:['yz','xy'],dyz:['xz','xy'],dxy:['yz','xz'],dx2y2:['d1','d2']}[o.a]||[];planes.forEach(k2=>quad(PLN[k2]));
      if(o.a==='dz2'){const th=Math.acos(1/Math.sqrt(3));[1,-1].forEach(sg=>{ctx.beginPath();for(let i=0;i<=40;i++){const ph=i/40*6.283;const q=proj(sim,R*Math.sin(th)*Math.cos(ph),R*Math.sin(th)*Math.sin(ph),sg*R*Math.cos(th));i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]);}ctx.stroke();
        [0,Math.PI/2,Math.PI,3*Math.PI/2].forEach(ph=>{const q=proj(sim,R*Math.sin(th)*Math.cos(ph),R*Math.sin(th)*Math.sin(ph),sg*R*Math.cos(th));ctx.beginPath();ctx.moveTo(CX,CY);ctx.lineTo(q[0],q[1]);ctx.stroke();});});}
      ctx.restore();}
    // dots, batched by color and depth
    const pos=PAL['s2'],neg=p.phase&&hon?PAL['s4']:PAL['s2'];const buckets=[[],[],[],[],[],[]];
    for(const q of st.pts){const v=proj(sim,q[0],q[1],q[2]);if(v[0]<4||v[0]>494||v[1]<4||v[1]>446)continue;const dn=clamp(Math.floor((v[2]/L+1)*1.5),0,2);buckets[(q[3]>0?0:3)+dn].push(v);}
    buckets.forEach((b,i)=>{ctx.fillStyle=i<3?pos:neg;ctx.globalAlpha=[0.95,0.7,0.42][i%3];ctx.beginPath();b.forEach(v=>{ctx.rect(v[0]-1.4,v[1]-1.4,2.8,2.8);});ctx.fill();});ctx.globalAlpha=1;
    // nucleus
    ctx.fillStyle='#c0392b';ctx.beginPath();ctx.arc(CX,CY,3.5,0,6.29);ctx.fill();
    ax3.forEach(a=>{const q=proj(sim,a[0]*L*0.95,a[1]*L*0.95,a[2]*L*0.95);if(q[0]<14||q[0]>486||q[1]<14||q[1]>440)return;txt(ctx,a[3],q[0]+(q[0]>=CX?8:-8),q[1]-6,{s:13*k,w:800,a:q[0]>=CX?'left':'right',c:PAL['cv-soft']});});
    // title + scale bar
    txt(ctx,o.name,14,16+14*k,{s:22*k,w:800});
    const nice=[10,20,25,50,100,200,250,500,1000,2000];const want=L*A0*0.4;let bar=nice[0];nice.forEach(v=>{if(v<=want)bar=v;});const bpx=bar/A0*S;
    const by=440;ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(14,by-6);ctx.lineTo(14,by);ctx.lineTo(14+bpx,by);ctx.lineTo(14+bpx,by-6);ctx.stroke();txt(ctx,bar+' pm',20+bpx,by-2,{s:12*k,w:700});
    // slice panel
    rr(ctx,SLX,SLY,SLW,SLH,10);ctx.fillStyle=PAL['card'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
    const pl=plane(o);txt(ctx,'Slice: '+pl+'-plane',SLX+12,SLY+16*k,{s:12*k,w:700,c:PAL['cv-soft']});
    const sq=Math.min(SLW-24,SLH-26*k-10),sx=SLX+(SLW-sq)/2,sy=SLY+SLH-sq-8;ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(sx,sy,sq,sq);ctx.imageSmoothingEnabled=true;ctx.drawImage(slice(sim),sx,sy,sq,sq);
    ctx.strokeStyle=PAL['line'];ctx.beginPath();ctx.moveTo(sx+sq/2,sy);ctx.lineTo(sx+sq/2,sy+sq);ctx.moveTo(sx,sy+sq/2);ctx.lineTo(sx+sq,sy+sq/2);ctx.stroke();
    txt(ctx,pl[0],sx+sq-4,sy+sq/2-5,{s:12*k,w:800,a:'right',c:PAL['cv-soft']});txt(ctx,pl[1],sx+sq/2+5,sy+3+12*k,{s:12*k,w:800,c:PAL['cv-soft']});
    // quantum number card
    const qy=SLY+SLH+12;const lh=21*k;const line=(s,i,o2)=>txt(ctx,s,SLX+4,qy+lh*(i+0.8),Object.assign({s:13*k,w:700},o2||{}));
    if(hon){line('n = '+o.n+', ℓ = '+o.l+' ('+LET[o.l]+')',0);line('radial nodes: '+(o.n-o.l-1),1,{w:600,c:PAL['cv-soft']});line('angular nodes: '+o.l,2,{w:600,c:PAL['cv-soft']});}
    else{line('n = '+o.n+'  (size, energy)',0);}if(!hon)line(o.l===0?'s: sphere':o.l===1?'p: two lobes':'d: four lobes',1,{w:600,c:PAL['cv-soft']});
    if(ap&&p.Z>1)line('Z = '+p.Z+': cloud is 1/'+p.Z+' the size',3,{w:600,c:PAL['cv-soft']});
  },
  thumbSetup(sim){sim.p.orb='3dxy';sim.p.phase=true;build(sim);},thumbFrames:2
};
SIM.onLevel=sync;
BioLab.register(SIM);
})();
