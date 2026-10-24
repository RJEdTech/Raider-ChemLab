(function(){
'use strict';
const {clamp,lerp,rng,rr,txt,pill,atLeast,PAL,FONT,RM,axes,legend,serColor}=BioLab.h;
const CL=window.ChemLab;

/* ---------- nuclide data for Z = 1–20 ----------
   Stable (or effectively stable) mass numbers, natural abundances not in ChemLab.isotopes,
   and measured half-lives and decay modes of the common radioactive isotopes (NUBASE/NNDC values). */
const STABLE={1:[1,2],2:[3,4],3:[6,7],4:[9],5:[10,11],6:[12,13],7:[14,15],8:[16,17,18],9:[19],10:[20,21,22],11:[23],12:[24,25,26],13:[27],14:[28,29,30],15:[31],16:[32,33,34,36],17:[35,37],18:[36,38,40],19:[39,41],20:[40,42,43,44,46,48]};
const ABUND_EXTRA={Be:{9:100},F:{19:100},Na:{23:100},Al:{27:100},P:{31:100},Ca:{40:96.94,42:0.647,43:0.135,44:2.09,46:0.004,48:0.187}};
const RAD={'1-3':['β⁻','12.3 years'],'2-6':['β⁻','0.81 s'],'2-8':['β⁻','0.12 s'],'3-8':['β⁻','0.84 s'],'3-9':['β⁻','0.18 s'],
  '4-7':['electron capture','53 days'],'4-8':['splits into two α particles','10⁻¹⁶ s'],'4-10':['β⁻','1.4 million years'],'4-11':['β⁻','13.8 s'],
  '5-8':['β⁺','0.77 s'],'5-12':['β⁻','0.020 s'],'5-13':['β⁻','0.017 s'],'6-10':['β⁺','19 s'],'6-11':['β⁺','20.4 min'],'6-14':['β⁻','5,730 years'],'6-15':['β⁻','2.4 s'],'6-16':['β⁻','0.75 s'],
  '7-12':['β⁺','0.011 s'],'7-13':['β⁺','10.0 min'],'7-16':['β⁻','7.1 s'],'7-17':['β⁻','4.2 s'],'8-14':['β⁺','71 s'],'8-15':['β⁺','122 s'],'8-19':['β⁻','27 s'],'8-20':['β⁻','13.5 s'],
  '9-17':['β⁺','65 s'],'9-18':['β⁺','110 min'],'9-20':['β⁻','11 s'],'9-21':['β⁻','4.2 s'],'10-18':['β⁺','1.7 s'],'10-19':['β⁺','17 s'],'10-23':['β⁻','37 s'],'10-24':['β⁻','3.4 min'],
  '11-21':['β⁺','22 s'],'11-22':['β⁺','2.6 years'],'11-24':['β⁻','15.0 h'],'11-25':['β⁻','59 s'],'12-23':['β⁺','11 s'],'12-27':['β⁻','9.5 min'],'12-28':['β⁻','20.9 h'],
  '13-25':['β⁺','7.2 s'],'13-26':['β⁺','717,000 years'],'13-28':['β⁻','2.2 min'],'13-29':['β⁻','6.6 min'],'14-27':['β⁺','4.2 s'],'14-31':['β⁻','2.6 h'],'14-32':['β⁻','153 years'],
  '15-29':['β⁺','4.1 s'],'15-30':['β⁺','2.5 min'],'15-32':['β⁻','14.3 days'],'15-33':['β⁻','25 days'],'16-31':['β⁺','2.6 s'],'16-35':['β⁻','87 days'],'16-37':['β⁻','5.1 min'],
  '17-34':['β⁺','1.5 s'],'17-36':['β⁻','301,000 years'],'17-38':['β⁻','37 min'],'17-39':['β⁻','56 min'],'18-37':['electron capture','35 days'],'18-39':['β⁻','269 years'],'18-41':['β⁻','110 min'],'18-42':['β⁻','33 years'],
  '19-38':['β⁺','7.6 min'],'19-40':['β⁻','1.25 billion years'],'19-42':['β⁻','12.4 h'],'19-43':['β⁻','22 h'],'20-39':['β⁺','0.86 s'],'20-41':['electron capture','99,000 years'],'20-45':['β⁻','163 days'],'20-47':['β⁻','4.5 days']};
const MP=1.007276,MN=1.008665,ME=0.000549;
function abundance(Z,A){const e=CL.el(Z);const t=(CL.isotopes[e.sym]||ABUND_EXTRA[e.sym]||{})[A];if(t===undefined)return null;return Array.isArray(t)?t[1]:t;}
function exactMass(Z,A){const e=CL.el(Z);const t=(CL.isotopes[e.sym]||{})[A];return Array.isArray(t)?t[0]:null;}
function naturalList(Z){const e=CL.el(Z),src=CL.isotopes[e.sym]||ABUND_EXTRA[e.sym]||{};return Object.keys(src).map(Number).sort((a,b)=>a-b).filter(A=>abundance(Z,A)>0);}
function mostCommonN(Z){const L=naturalList(Z);if(!L.length)return Math.round(CL.el(Z).mass)-Z;let best=L[0];L.forEach(A=>{if(abundance(Z,A)>abundance(Z,best))best=A;});return best-Z;}
/* stability: {kind:'stable'|'radioactive'|'unbound', mode, half, known} */
function stability(Z,N){const A=Z+N,st=STABLE[Z]||[];
  if(st.includes(A))return {kind:'stable',mode:'',half:'',known:true,note:(Z===20&&A===48)?'decays so slowly (10¹⁹ years) that it counts as stable':''};
  const r=RAD[Z+'-'+A];if(r)return {kind:r[0].startsWith('splits')?'unbound':'radioactive',mode:r[0],half:r[1],known:true};
  const nmin=Math.min(...st)-Z,nmax=Math.max(...st)-Z;
  if(N>nmax){if(N-nmax>(Z<=2?1:Z<=8?4:6))return {kind:'unbound',mode:'a neutron drips off at once',half:'',known:false};return {kind:'radioactive',mode:'β⁻',half:'',known:false};}
  if(N<nmin){if(nmin-N>(Z<=2?0:Z<=8?2:4)||N===0&&Z>1)return {kind:'unbound',mode:'a proton drips off at once',half:'',known:false};return {kind:'radioactive',mode:'β⁺ or electron capture',half:'',known:false};}
  return {kind:'radioactive',mode:N>(nmin+nmax)/2?'β⁻':'β⁺ or electron capture',half:'',known:false};}
const sup=CL.sup;
const chargeStr=q=>q===0?'0':Math.abs(q)+(q>0?'+':'−');
const chargeMark=q=>q===0?'':(Math.abs(q)===1?'':Math.abs(q))+(q>0?'+':'−');
const chargeSup=q=>q===0?'':sup((Math.abs(q)===1?'':Math.abs(q))+(q>0?'+':'-'));
const isoName=(Z,N)=>CL.el(Z).name+'-'+(Z+N);
const shellsOf=e=>{const cap=[2,8,8,32],out=[];let left=e;for(let i=0;i<4&&left>0;i++){const c=Math.min(cap[i],left);out.push(c);left-=c;}return out;};
function speciesWord(Z,e){const q=Z-e;if(q===0)return 'neutral atom';return (q>0?'cation':'anion')+' ('+chargeStr(q)+')';}
function ionNote(Z,e){const q=Z-e,s=CL.el(Z).sym,com=CL.monatomic[s]||[];if(q===0)return '';if(com.includes(q))return 'a common ion';
  if(CL.el(Z).cat==='noble')return 'noble gases do not form ions in nature';if(Math.abs(q)>3||e===0&&Z>2)return 'not found in nature';return 'possible, but not a common ion';}

/* ---------- canvas helpers ---------- */
function notation(ctx,A,Z,sym,q,x,y,S,col){ // isotope notation centered at x, baseline y; S = symbol size. Returns width.
  const s2=Math.max(12,S*0.36);ctx.font='700 '+S+'px '+FONT;const ws=ctx.measureText(sym).width;ctx.font='700 '+s2+'px '+FONT;
  const wa=ctx.measureText(String(A)).width,wz=ctx.measureText(String(Z)).width,wl=Math.max(wa,wz)+3,qs=q?chargeMark(q):'',wq=qs?ctx.measureText(qs).width+3:0;
  const W=wl+ws+wq,x0=x-W/2;
  txt(ctx,String(A),x0+wl-3,y-S*0.62,{s:s2,w:700,c:col,a:'right'});txt(ctx,String(Z),x0+wl-3,y+s2*0.32,{s:s2,w:700,c:col,a:'right'});
  txt(ctx,sym,x0+wl,y,{s:S,w:700,c:col});if(qs)txt(ctx,qs,x0+wl+ws+3,y-S*0.62,{s:s2,w:700,c:q>0?PAL['s1']:PAL['s2']});return W;}
const COL={p:CL.FILL.proton,n:CL.FILL.neutron,e:CL.FILL.electron};
function ball(ctx,x,y,r,type,alpha){const c=COL[type];ctx.save();if(alpha!==undefined)ctx.globalAlpha=alpha;const g=ctx.createRadialGradient(x-r*0.35,y-r*0.4,r*0.1,x,y,r);
  g.addColorStop(0,'#ffffff');g.addColorStop(0.3,c);g.addColorStop(1,CL.shade(c,-0.35));ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,6.2832);ctx.fill();
  ctx.lineWidth=1;ctx.strokeStyle=CL.shade(c,-0.5);ctx.stroke();
  if(r>=5&&type!=='n'){ctx.fillStyle=type==='e'?'#3a2c00':'#fff';ctx.font='800 '+(r*1.25)+'px '+FONT;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(type==='p'?'+':'−',x,y+0.5);}
  ctx.restore();}
const AX=248,AY=242,RING=[76,114,148,178];
const RNUC=A=>clamp(9-0.045*A,6.8,8.6);
function nucleusR(A){return A<=0?0:RNUC(A)*(1.05*Math.sqrt(A)+1);}
function nucleonLayout(Z,N){const A=Z+N,out=[];let pc=0;for(let i=0;i<A;i++){const isP=Math.floor((i+1)*Z/A)>Math.floor(i*Z/A);if(isP)pc++;
    const r=RNUC(A)*1.05*Math.sqrt(i+0.5),a=i*2.39996;out.push({x:AX+r*Math.cos(a),y:AY+r*Math.sin(a),t:isP?'p':'n'});}
  return out;}

/* ---------- game targets ---------- */
function targets(){const T=[];
  const add=(lvl,text,p,n,e,draw)=>T.push({lvl,text,p,n,e,draw});
  add('bio','a neutral atom of oxygen-16',8,8,8);add('bio','a neutral atom of lithium-7',3,4,3);add('bio','a neutral atom of carbon-13',6,7,6);
  add('bio','the ion Na⁺ (any isotope)',11,null,10);add('bio','the ion F⁻ (any isotope)',9,null,10);add('bio','a neutral atom of neon-22',10,12,10);
  add('bio','the ion Mg²⁺ (any isotope)',12,null,10);add('bio','a neutral atom of sulfur-32',16,16,16);
  add('honors','',17,20,18,true);add('honors','an ion with 18 electrons and a 2+ charge',20,null,18);add('honors','',1,2,1,true);add('honors','',13,14,10,true);
  add('honors','an isotope of carbon with 8 neutrons, neutral',6,8,6);add('honors','',16,18,18,true);add('honors','an ion with 10 electrons and a 3− charge',7,null,10);
  add('ap','the ion with 1s² 2s² 2p⁶ and a 3+ charge',13,null,10);add('ap','the anion isoelectronic with argon that has a 1− charge',17,null,18);
  add('ap','the cation isoelectronic with neon that has a 1+ charge',11,null,10);add('ap','the heaviest stable isotope of magnesium, neutral',12,14,12);
  add('ap','a neutral atom with configuration [Ne] 3s² 3p⁴, mass number 34',16,18,16);add('ap','the radioactive carbon isotope used in dating, neutral',6,8,6);
  return T;}
const TG=targets();
function pickTarget(sim){const lv=TG.filter(t=>atLeast(t.lvl));const st=sim.st;st.gi=(st.gi===undefined?Math.floor(Math.random()*lv.length):(st.gi+1+Math.floor(Math.random()*Math.max(1,lv.length-1))))%lv.length;
  st.target=lv[st.gi];st.matched=false;}
function matches(p,t){return !!t&&p.p===t.p&&(t.n===null||p.neu===t.n)&&(t.e===null||p.e===t.e);}

function syncMode(sim){if(!sim.ui||!sim.ui.sec)return;const btns=[...sim.ui.sec.querySelectorAll('.actions button')];
  sim.def.actions.forEach(a=>{const b=btns.find(x=>x.textContent===a.label);if(b&&a.modes)b.hidden=!atLeast(a.lvl)||!a.modes.includes(sim.p.mode);});
  if(sim.p.mode==='game'&&sim.st&&!sim.st.target)pickTarget(sim);}

/* ---------- pointer interaction (drag from bins, drag out to remove) ---------- */
function bindPointer(sim){const cv=sim.ui&&sim.ui.stage;if(!cv||cv._abBound)return;cv._abBound=true;cv.style.cursor='grab';
  const pos=e=>{const r=cv.getBoundingClientRect();return {x:(e.clientX-r.left)/r.width*800,y:(e.clientY-r.top)/r.height*450};};
  const hit=(x,y)=>{const L=sim.vis.L;if(!L)return null;for(const b of L.bins)if(x>=b.x-b.w/2&&x<=b.x+b.w/2&&y>=b.y-46&&y<=b.y+30)return {from:'bin',t:b.t};
    let best=null,bd=1e9;(L.els||[]).forEach(q=>{const d=Math.hypot(q.x-x,q.y-y);if(d<16&&d<bd){bd=d;best={from:'atom',t:'e'};}});if(best)return best;
    (L.nuc||[]).forEach(q=>{const d=Math.hypot(q.x-x,q.y-y);if(d<10&&d<bd){bd=d;best={from:'atom',t:q.t};}});return best;};
  cv.addEventListener('touchstart',e=>{const t=e.touches[0];if(!t)return;const P=pos(t);if(hit(P.x,P.y))e.preventDefault();},{passive:false});
  cv.addEventListener('pointerdown',e=>{const P=pos(e),h=hit(P.x,P.y);if(!h||sim.tour&&sim.tour.on)return;sim.vis.drag={from:h.from,t:h.t,x:P.x,y:P.y,x0:P.x,y0:P.y};try{cv.setPointerCapture(e.pointerId);}catch(err){}});
  cv.addEventListener('pointermove',e=>{const d=sim.vis.drag;if(!d)return;const P=pos(e);d.x=P.x;d.y=P.y;});
  const end=e=>{const d=sim.vis.drag;if(!d)return;sim.vis.drag=null;const moved=Math.hypot(d.x-d.x0,d.y-d.y0)>6,inAtom=Math.hypot(d.x-AX,d.y-AY)<RING[3]+24;
    if(d.from==='bin'&&(!moved||inAtom))addParticle(sim,d.t,d.x,d.y);
    else if(d.from==='atom'&&moved&&!inAtom)removeParticle(sim,d.t);};
  cv.addEventListener('pointerup',end);cv.addEventListener('pointercancel',()=>{sim.vis.drag=null;});}
const LIM={p:[1,20],neu:[0,30],e:[0,23]};
const KEY=t=>t==='n'?'neu':t;
function addParticle(sim,t,x,y){const K=KEY(t),v=sim.p[K];if(v>=LIM[K][1]){sim.vis.full={t,ttl:1.6};return;}BioLab.setValues(sim,{[K]:v+1});
  (sim.vis.fly=sim.vis.fly||[]).push({t,x,y,age:0});BioLab.refresh(sim);}
function removeParticle(sim,t){const K=KEY(t),v=sim.p[K];if(v<=LIM[K][0]){sim.vis.full={t,ttl:1.6,min:true};return;}BioLab.setValues(sim,{[K]:v-1});BioLab.refresh(sim);}

const AB={
  id:'atombuilder',hash:'atombuilder',apUnit:2,order:2,tab:'Build an atom',kind:'Simulation',prereq:['models'],next:['avgmass','nuclear','econfig'],
  card:'Drag protons, neutrons and electrons into an atom and watch the element, isotope symbol, charge and nuclear stability change.',
  title:'Build an atom: protons, neutrons, electrons and isotopes',
  lede:{bio:'Protons decide which element you have, neutrons change the mass, and electrons set the charge. Build atoms and ions and see all three at once.',
        honors:'Read and write isotope notation, compare isotopes of the same element, and check each nucleus against the band of stability.',
        ap:'Connect particle counts to electron configurations, isoelectronic species, the mass of the particles and the measured isotope mass.'},
  scale:{bio:'One atom, drawn far from scale: a real atom is about 0.1–0.4 nm across and its nucleus is about 100,000 times smaller.',
         ap:'One atom. Nuclear radius ≈ 1.2 fm × A^⅓; atomic radii are covalent radii in pm. The drawing enlarges the nucleus so you can see it.'},
  timeless:true,animated:true,chChange:1,chReveal:2.6,
  controls:[
    {id:'p',label:'Protons',type:'range',min:1,max:20,step:1,def:6,lvl:'bio',help:'Protons decide the element (atomic number Z).'},
    {id:'neu',label:'Neutrons',type:'range',min:0,max:30,step:1,def:6,lvl:'bio'},
    {id:'e',label:'Electrons',type:'range',min:0,max:23,step:1,def:6,lvl:'bio'},
    {id:'mode',label:'Activity',type:'seg',def:'build',lvl:'bio',options:[{v:'build',l:'Free build'},{v:'game',l:'Atom game'}],noTrial:true},
    {id:'view',label:'Electrons drawn as',type:'seg',def:'shells',lvl:'honors',options:[{v:'shells',l:'Shells (Bohr)'},{v:'cloud',l:'Cloud'}],noTrial:true},
    {id:'scale',label:'Show the nucleus to scale',type:'toggle',def:false,lvl:'bio',noTrial:true,help:'See how tiny the nucleus really is.'}
  ],
  actions:[
    {id:'neutral',label:'Make it neutral',lvl:'bio',modes:['build','game'],run(sim){BioLab.setValues(sim,{e:sim.p.p});}},
    {id:'common',label:'Most common isotope',lvl:'bio',modes:['build','game'],run(sim){BioLab.setValues(sim,{neu:clamp(mostCommonN(sim.p.p),0,30)});}},
    {id:'target',label:'New target',lvl:'bio',primary:true,modes:['game'],run(sim){pickTarget(sim);}}
  ],
  init(sim){return {score:0,target:null,matched:false,gi:undefined};},
  step(sim,dt){const st=sim.st;if(sim.p.mode==='game'){if(!st.target)pickTarget(sim);if(!st.matched&&matches(sim.p,st.target)){st.matched=true;st.score++;sim.vis.win=1.2;}}},
  metrics:[
    {id:'el',label:'Element',unit:'',lvl:'bio',text:true,get:s=>{const e=CL.el(s.p.p);return e.name+' ('+e.sym+'), Z = '+s.p.p;}},
    {id:'A',label:'Mass number A',unit:'',lvl:'bio',min:0,max:50,d:0,get:s=>s.p.p+s.p.neu},
    {id:'q',label:'Charge',unit:'',lvl:'bio',text:true,get:s=>{const q=s.p.p-s.p.e;return chargeStr(q)+(q===0?' (neutral atom)':q>0?' (cation)':' (anion)');}},
    {id:'stab',label:'Nucleus',unit:'',lvl:'bio',text:true,get:s=>{const k=stability(s.p.p,s.p.neu);return k.kind==='stable'?'Stable':k.kind==='unbound'?'Falls apart':'Radioactive ('+k.mode+')';}},
    {id:'nz',label:'Neutron : proton ratio',unit:'',lvl:'honors',min:0,max:2,d:2,get:s=>s.p.neu/s.p.p},
    {id:'val',label:'Outer-shell electrons',unit:'',lvl:'honors',min:0,max:8,d:0,get:s=>{const sh=shellsOf(s.p.e);return sh.length?sh[sh.length-1]:0;}},
    {id:'mparts',label:'Mass of the particles',unit:'amu',lvl:'ap',min:0,max:null,d:3,get:s=>s.p.p*MP+s.p.neu*MN+s.p.e*ME},
    {id:'cfg',label:'Electron configuration',unit:'',lvl:'ap',text:true,get:s=>s.p.e?CL.configText(s.p.e):'no electrons'}
  ],
  graphs:[{id:'band',label:'Neutrons vs protons (band of stability)',lvl:'bio',custom:true}],
  defaultGraph:'band',
  plot(sim,ctx,box){const p=sim.p;const ax=axes(ctx,box,{xmin:0,xmax:21,ymin:0,ymax:31,xl:'Protons (Z)',yl:'Neutrons (N)'});
    ctx.save();ctx.beginPath();ctx.rect(box.L,box.T,box.W,box.H);ctx.clip();
    ctx.setLineDash([5,4]);ctx.strokeStyle=PAL['muted'];ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(ax.X(0),ax.Y(0));ctx.lineTo(ax.X(21),ax.Y(21));ctx.stroke();ctx.setLineDash([]);
    for(let Z=1;Z<=20;Z++){Object.keys(RAD).forEach(k=>{const [z,a]=k.split('-').map(Number);if(z===Z&&!RAD[k][0].startsWith('splits')){ctx.fillStyle=PAL['s4'];ctx.globalAlpha=0.55;ctx.fillRect(ax.X(Z)-3,ax.Y(a-Z)-3,6,6);ctx.globalAlpha=1;}});
      STABLE[Z].forEach(A=>{ctx.fillStyle=PAL['cv-ink'];ctx.beginPath();ctx.arc(ax.X(Z),ax.Y(A-Z),3.6,0,6.29);ctx.fill();});}
    const k=stability(p.p,p.neu),c=k.kind==='stable'?PAL['s3']:k.kind==='unbound'?PAL['s1']:PAL['s4'];
    ctx.strokeStyle=c;ctx.lineWidth=3;ctx.beginPath();ctx.arc(ax.X(p.p),ax.Y(p.neu),9,0,6.29);ctx.stroke();ctx.restore();
    txt(ctx,'N = Z',ax.X(14),ax.Y(14)+22,{s:12,c:PAL['muted'],a:'left'});
    legend(ctx,box.L+12,box.T+10,[{label:'stable',color:PAL['cv-ink']},{label:'radioactive (known)',color:PAL['s4']},{label:'your nucleus',color:c}]);},
  infoPanel(sim){const p=sim.p,e=CL.el(p.p),ap=atLeast('ap'),hon=atLeast('honors');
    const list=[...new Set([...naturalList(p.p),...STABLE[p.p],...Object.keys(RAD).filter(k=>+k.split('-')[0]===p.p).map(k=>+k.split('-')[1])])].sort((a,b)=>a-b);
    const rows=list.map(A=>{const N=A-p.p,k=stability(p.p,N),ab=abundance(p.p,A),cur=N===p.neu;
      return `<tr${cur?' style="font-weight:700;color:var(--rj-ink)"':''}><td style="text-align:left">${e.name}-${A}${cur?' ◀':''}</td><td>${p.p}</td><td>${N}</td><td>${ab!==null?ab+'%':'—'}</td><td style="text-align:left">${k.kind==='stable'?'stable':k.mode+(k.half?', t½ '+k.half:'')}</td></tr>`;}).join('');
    let h=`<h3>Isotopes of ${e.name.toLowerCase()}</h3><p>Every ${e.name.toLowerCase()} atom has ${p.p} proton${p.p>1?'s':''}. The isotopes differ only in neutrons.${hon?' The periodic table mass, '+e.mass+' amu, is the weighted average of the natural isotopes.':''}</p>
      <div class="tbl-wrap"><table><thead><tr><th style="text-align:left">Isotope</th><th>p⁺</th><th>n⁰</th><th>In nature</th><th style="text-align:left">Nucleus</th></tr></thead><tbody>${rows}</tbody></table></div>`;
    if(ap){const cfg=CL.config(p.e),order=['1s','2s','2p','3s','3p','4s','3d'];
      const box=lab=>{const o=cfg.find(c=>c.label===lab),n=o?o.e:0,orbs=lab[1]==='s'?1:lab[1]==='p'?3:5;let cells='';
        for(let i=0;i<orbs;i++){const up=n>i?1:0,dn=n>orbs+i?1:0;cells+=`<span style="display:inline-block;width:26px;height:26px;border:1.5px solid var(--muted);margin-right:2px;text-align:center;line-height:24px;font-weight:700">${up?'↑':''}${dn?'↓':''}</span>`;}
        return `<div style="display:inline-block;margin:0 10px 8px 0;vertical-align:top"><div style="font-size:13px;color:var(--muted)">${lab}</div>${cells}</div>`;};
      const used=order.filter(l=>cfg.some(c=>c.label===l)||(['2p','3p'].includes(l)&&cfg.some(c=>c.label===l[0]+'s')));
      h=`<h3>Orbital diagram for ${p.e} electron${p.e===1?'':'s'}</h3>${p.e?`<p>${used.map(box).join('')}</p><p>${CL.configText(p.e)}${p.e>2?' = '+CL.configText(p.e,{noble:true}):''}. Hund’s rule: in a sublevel, electrons fill empty orbitals singly before they pair.</p>`:'<p>There are no electrons. This is a bare nucleus.</p>'}`+h;}
    return h;},
  narrate(sim){const p=sim.p,el=CL.el(p.p),q=p.p-p.e,k=stability(p.p,p.neu),hon=atLeast('honors'),A=p.p+p.neu;
    if(sim.p.mode==='game'&&sim.st.target){const t=sim.st.target;if(sim.st.matched)return '<b>Match!</b> You built '+(t.text||'the target')+'. Press <b>New target</b> for another.';
      const hints=[];if(p.p!==t.p)hints.push('the element is wrong, so change the <b>protons</b>');else{if(t.n!==null&&p.neu!==t.n)hints.push('the element is right, now fix the <b>neutrons</b> (mass number)');if(t.e!==null&&p.e!==t.e)hints.push('fix the <b>electrons</b> to get the charge');}
      return 'Game: '+hints.join('; ')+'.';}
    let s=p.p+' proton'+(p.p>1?'s':'')+' make this <b>'+el.name.toLowerCase()+'</b>. ';
    s+=p.neu+' neutron'+(p.neu===1?'':'s')+' give mass number '+p.p+' + '+p.neu+' = <b>'+A+'</b>. ';
    if(q===0)s+='The '+p.e+' electrons balance the protons, so it is a <b>neutral atom</b>.';
    else s+='It has '+Math.abs(q)+' '+(q>0?'fewer':'more')+' electron'+(Math.abs(q)>1?'s':'')+' than protons, so it is a <b>'+chargeStr(q)+' '+(q>0?'cation':'anion')+'</b>'+(ionNote(p.p,p.e)?' ('+ionNote(p.p,p.e)+')':'')+'.';
    if(k.kind==='radioactive')s+=' The nucleus has '+(k.mode==='β⁻'?'too many':'too few')+' neutrons to be stable, so it is <b>radioactive</b>'+(hon?' and decays by '+k.mode+(k.half?' (half-life '+k.half+')':'')+'.':'.');
    else if(k.kind==='unbound')s+=' This nucleus cannot hold together: '+k.mode+'.';
    return s;},
  tour:[
    {title:'Protons decide the element',text:'Every atom of carbon has exactly 6 protons. Change the number of protons and you change the element. The count of protons is the atomic number, Z.',focus:[[AX-60,AY-60,120,120],[500,206,290,110]],pause:true,setup(sim){BioLab.setValues(sim,{p:6,neu:6,e:6,mode:'build',scale:false});}},
    {title:'Neutrons add mass, not charge',text:'Neutrons sit in the nucleus with the protons. They have no charge. Protons + neutrons = mass number A. Add two neutrons to carbon-12 and you get carbon-14: still carbon.',focus:[[AX-60,AY-60,120,120],[506,14,284,186]],pause:true,setup(sim){BioLab.setValues(sim,{neu:8});}},
    {title:'Electrons set the charge',text:'Electrons are negative. When electrons equal protons, the charges cancel. Remove one electron from sodium and you get Na⁺, a cation with a 1+ charge.',focus:[[AX-180,AY-180,360,360],[506,14,284,186]],speed:0.5,setup(sim){BioLab.setValues(sim,{p:11,neu:12,e:10});}},
    {title:'Electrons fill shells',text:'In the Bohr model, electrons fill shells from the inside out: 2 in the first, 8 in the second, 8 in the third. The outer-shell electrons decide how the atom bonds.',focus:[AX-185,AY-185,370,370],speed:0.5,setup(sim){BioLab.setValues(sim,{p:11,neu:12,e:11});}},
    {title:'Isotope notation',text:'The mass number goes top left, the atomic number bottom left, and the charge top right. This symbol says 23 nucleons, 11 protons, neutral sodium.',focus:[506,14,284,124],pause:true},
    {lvl:'honors',title:'The band of stability',text:'Light nuclei are stable when neutrons ≈ protons. Too many or too few neutrons and the nucleus is radioactive. Carbon-14 has 8 neutrons for 6 protons, so it decays by β⁻. The graph below plots every stable nucleus.',focus:[[AX-60,AY-60,120,120],[506,14,284,186]],pause:true,setup(sim){BioLab.setValues(sim,{p:6,neu:8,e:6});}},
    {title:'The nucleus is tiny',text:'Drawn to scale, the nucleus disappears. If the nucleus were a marble, the atom would be hundreds of meters across. The atom is mostly empty space, yet almost all its mass is in the nucleus.',focus:[16,16,470,420],pause:true,setup(sim){BioLab.setValues(sim,{p:6,neu:6,e:6,scale:true});}},
    {lvl:'ap',title:'Orbitals and configuration',text:'Below the graph, the orbital diagram fills 1s, 2s, 2p, 3s, 3p, 4s in order. Mg²⁺ and Ne both have 1s² 2s² 2p⁶: they are isoelectronic.',focus:[16,16,470,420],pause:true,setup(sim){BioLab.setValues(sim,{p:12,neu:12,e:10,scale:false});}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{p:6,neu:6,e:6,scale:false,mode:'build'});},
  onChallenge(sim,ch,phase){if(ch&&ch.instant&&ch.set&&phase==='done')BioLab.setValues(sim,ch.set);},
  challenges:[
    {lvl:'bio',q:'You have carbon-12 (6 protons, 6 neutrons, 6 electrons). Add one neutron. What do you have now?',choices:['Nitrogen','Still carbon: the isotope carbon-13','A carbon ion with a 1− charge'],correct:1,
     baseline:{p:6,neu:6,e:6},change:{neu:7},changeText:'One neutron added',
     explain:{bio:'The element stays carbon because the protons did not change. Neutrons have no charge, so the atom is still neutral. Only the mass number went up, from 12 to 13: a different isotope.'}},
    {lvl:'bio',q:'Start with a neutral sodium atom. Remove one electron. What happens?',choices:['It becomes neon, which has one fewer electron','It becomes Na⁺, still sodium, with a 1+ charge','Its mass number drops by 1'],correct:1,
     baseline:{p:11,neu:12,e:11},change:{e:10},changeText:'One electron removed',
     explain:{bio:'Losing an electron leaves 11 protons and 10 electrons, so the charge is 1+. It is still sodium because it still has 11 protons. Electrons are so light that the mass number does not change.'}},
    {lvl:'bio',q:'Start with carbon-12. Add one proton but nothing else. What do you get?',choices:['Carbon-13','A nitrogen ion with a 1+ charge','A carbon ion with a 1+ charge'],correct:1,
     baseline:{p:6,neu:6,e:6},change:{p:7},changeText:'One proton added',
     explain:{bio:'7 protons means nitrogen. With only 6 electrons for 7 protons, it has a 1+ charge. Adding a proton changes the element itself.'}},
    {lvl:'honors',instant:true,set:{p:17,neu:20,e:18},q:'How many neutrons are in ³⁷Cl⁻?',choices:['17','18','20','37'],correct:2,
     explain:{honors:'Neutrons = mass number − atomic number = 37 − 17 = 20. The 1− charge changes the electron count (18), not the neutrons. The model now shows ³⁷Cl⁻.'}},
    {lvl:'honors',q:'Change carbon-12 into carbon-14 by adding two neutrons. What happens to the atom’s charge?',choices:['It becomes 2−','It stays 0: neutrons carry no charge','It becomes 2+'],correct:1,
     baseline:{p:6,neu:6,e:6},change:{neu:8},changeText:'Two neutrons added',
     explain:{honors:'Neutrons are neutral, so isotopes of an element have the same charge and the same electrons, and nearly the same chemistry. Carbon-14 is radioactive, though: 8 neutrons is too many for 6 protons.'}},
    {lvl:'honors',q:'Oxygen-16 is stable. Add four neutrons to make oxygen-20. What happens to the nucleus?',choices:['More neutrons make it even more stable','It becomes radioactive','Nothing: neutrons do not affect stability'],correct:1,
     baseline:{p:8,neu:8,e:8},change:{neu:12},changeText:'Four neutrons added',
     explain:{honors:'Light nuclei are stable only when neutrons ≈ protons. Oxygen-20 has 12 neutrons for 8 protons, far above the band of stability, so it decays by β⁻ with a half-life of 13.5 s.'}},
    {lvl:'ap',instant:true,set:{p:12,neu:12,e:10},q:'Which species is isoelectronic with a neutral neon atom?',choices:['Na','Mg²⁺','F','O'],correct:1,
     explain:{ap:'Neon has 10 electrons. Mg²⁺ has 12 protons and 10 electrons, so it has the same configuration, 1s² 2s² 2p⁶. The model now shows Mg²⁺ and its orbital diagram.'}},
    {lvl:'ap',instant:true,set:{p:20,neu:20,e:18},q:'What is the electron configuration of Ca²⁺?',choices:['[Ar] 4s²','1s² 2s² 2p⁶ 3s² 3p⁶','[Ar] 4s¹','1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d²'],correct:1,
     explain:{ap:'Ca has 20 electrons, [Ar] 4s². Losing 2 electrons removes the 4s pair, leaving 18 electrons: 1s² 2s² 2p⁶ 3s² 3p⁶, the same as argon.'}},
    {lvl:'ap',q:'Start with fluorine-19. Remove one neutron to make fluorine-18 (used in PET scans). How does it decay?',choices:['β⁻: a neutron turns into a proton','β⁺: a proton turns into a neutron','It stays stable'],correct:1,
     baseline:{p:9,neu:10,e:9},change:{neu:9},changeText:'One neutron removed',
     explain:{ap:'F-18 has 9 neutrons for 9 protons, fewer than the stable F-19. Neutron-poor nuclei convert a proton into a neutron by emitting a positron (β⁺), here with a 110-minute half-life. ¹⁸₉F → ¹⁸₈O + ⁰₊₁e.'}}
  ],
  lab:{bio:'<p><b>Question:</b> What decides an atom’s element, mass and charge?</p><ol><li>Build carbon-12 (6 p, 6 n, 6 e). Record a trial.</li><li>Change only the neutrons to 7, then 8. Record each.</li><li>Change only the electrons to 5, then 7. Record each.</li><li>Change only the protons to 7. Record it.</li></ol><p>Which particle changed the element? The mass number? The charge? Use your table as evidence.</p>',
       honors:'<p><b>Question:</b> Which isotopes of an element are stable?</p><ol><li>Pick an element from Z = 6 to Z = 17.</li><li>Step the neutrons from 2 below Z to 4 above Z. Record each trial with the N : P ratio and the Nucleus readout.</li><li>Plot neutrons (x) against the N : P ratio, and mark which trials are stable.</li></ol><p>Describe the range of neutron counts that is stable, and compare it with the band of stability graph.</p>',
       ap:'<p><b>Question:</b> How do ions of the same configuration compare?</p><ol><li>Build O²⁻, F⁻, Ne, Na⁺, Mg²⁺ and Al³⁺ (10 electrons each). Record a trial for each.</li><li>Note the protons and the electron configuration.</li></ol><p><b>Claim–evidence–reasoning:</b> All six are isoelectronic. Predict which one is smallest and explain using the number of protons pulling on the same 10 electrons (Coulomb’s law).</p>'},
  terms:[{t:'Proton',d:'A positive particle in the nucleus. Its count, the atomic number Z, decides the element.'},{t:'Neutron',d:'A neutral particle in the nucleus with about the same mass as a proton.'},{t:'Electron',d:'A negative particle outside the nucleus, about 1/1836 the mass of a proton.'},
    {t:'Mass number (A)',d:'Protons + neutrons.'},{t:'Isotopes',d:'Atoms of the same element with different numbers of neutrons, such as carbon-12 and carbon-14.'},{t:'Ion',d:'An atom with unequal protons and electrons. Cations are positive; anions are negative.'},
    {lvl:'honors',t:'Isotope notation',d:'ᴬ_Z X with the charge top right, such as ³⁷₁₇Cl⁻.'},{lvl:'honors',t:'Band of stability',d:'The region of the neutron vs proton plot where nuclei are stable. For light elements it follows N ≈ Z.'},{lvl:'honors',t:'Radioactive',d:'A nucleus that changes on its own by giving off radiation.'},
    {lvl:'ap',t:'Isoelectronic',d:'Having the same number of electrons and the same configuration, such as Na⁺, Ne and F⁻.'},{lvl:'ap',t:'Mass defect',d:'A nucleus weighs less than its separate protons and neutrons; the difference is the binding energy (E = mc²).'}],
  about:'<p>Element identity, mass number and charge are counted directly from the particles. Electron shells use the simple Bohr filling 2, 8, 8 that works for Z ≤ 20; the orbital diagram at Deep dive uses the Aufbau order 1s, 2s, 2p, 3s, 3p, 4s, 3d from ChemLab.config.</p><p>Stability comes from real data: the stable isotopes of H through Ca, and measured half-lives and decay modes of about 70 radioactive isotopes (NNDC/NUBASE values, rounded). Nuclei outside that list get a predicted mode: β⁻ when they have more neutrons than the stable isotopes, β⁺ or electron capture when they have fewer, and “falls apart” when they are past the drip lines (rough limits). Ca-48 decays with a half-life near 10¹⁹ years, so it is listed as stable. Natural abundances are from IUPAC via ChemLab.isotopes.</p><p>The particle drawing is not to scale. The to-scale view uses a nuclear radius of 1.2 fm × A^⅓ and the element’s covalent radius. Particle masses: proton 1.007276 amu, neutron 1.008665 amu, electron 0.000549 amu. The measured mass of a real isotope is a little less than the sum (the mass defect).</p>',
  initVis(sim){sim.vis.fly=[];sim.vis.win=0;bindPointer(sim);},
  onLevel(sim){syncMode(sim);if(sim.st)sim.st.target=null;if(sim.p.mode==='game'&&sim.st)pickTarget(sim);},
  draw(sim,ctx,vdt,k,t){const p=sim.p,st=sim.st,v=sim.vis,hon=atLeast('honors'),ap=atLeast('ap');
    ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
    const Z=p.p,N=p.neu,E=p.e,A=Z+N,el=CL.el(Z),q=Z-E,stb=stability(Z,N);
    // ---- right column: notation card, mini table, particle bins
    const RX=506,RW=284;rr(ctx,RX,14,RW,186,12);ctx.fillStyle=PAL['card'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
    notation(ctx,A,Z,el.sym,q,RX+RW/2,96,62,PAL['cv-ink']);
    let y=96+Math.max(28,22*k);txt(ctx,isoName(Z,N),RX+RW/2,y,{s:Math.min(17*k,26),w:700,a:'center'});
    y+=Math.max(20,15*k);txt(ctx,q===0?'neutral atom':(q>0?'cation, ':'anion, ')+chargeStr(q)+' charge',RX+RW/2,y,{s:13*k,a:'center',c:PAL['cv-soft']});
    y+=Math.max(22,16*k);const sc=stb.kind==='stable'?PAL['s3']:stb.kind==='unbound'?PAL['s1']:PAL['s4'];
    pill(ctx,stb.kind==='stable'?'Stable nucleus':stb.kind==='unbound'?'Falls apart':'Radioactive: '+stb.mode.replace('β⁺ or electron capture','β⁺ / EC'),RX+RW/2,Math.min(y,188),sc,'#fff',12*k);
    const showTable=k<1.45;
    if(showTable){const cols=[1,2,13,14,15,16,17,18],cw=34,ch=26,tx=RX+(RW-cols.length*(cw+1))/2,ty=210;
      CL.elements.slice(0,20).forEach(e=>{const ci=cols.indexOf(e.group),cx=tx+ci*(cw+1),cy=ty+(e.period-1)*(ch+1),cur=e.Z===Z;
        rr(ctx,cx,cy,cw,ch,4);ctx.fillStyle=cur?CL.CAT_FILL[e.cat]:PAL['card2'];ctx.fill();ctx.strokeStyle=cur?PAL['rj']:PAL['line'];ctx.lineWidth=cur?2.5:1;ctx.stroke();
        txt(ctx,e.sym,cx+cw/2,cy+ch/2+1,{s:12*k,w:cur?800:600,a:'center',b:'middle',c:cur?'#fff':PAL['cv-soft']});});}
    const by=showTable?400:388,bins=[{t:'p',x:RX+46,l:'Protons',s:'p⁺'},{t:'n',x:RX+RW/2,l:'Neutrons',s:'n⁰'},{t:'e',x:RX+RW-46,l:'Electrons',s:'e⁻'}];
    if(!showTable)txt(ctx,'Drag or tap to add',RX+RW/2,268,{s:12*k,a:'center',c:PAL['cv-soft']});
    bins.forEach(b=>{b.w=88;b.y=by;const full=p[KEY(b.t)]>=LIM[KEY(b.t)][1];
      ctx.fillStyle=PAL['cv-bench'];ctx.beginPath();ctx.moveTo(b.x-42,by-12);ctx.lineTo(b.x+42,by-12);ctx.quadraticCurveTo(b.x+40,by+14,b.x,by+14);ctx.quadraticCurveTo(b.x-40,by+14,b.x-42,by-12);ctx.fill();
      ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.5;ctx.stroke();
      const r=b.t==='e'?6:7;[[-18,-16],[0,-18],[18,-16],[-9,-26],[9,-26],[0,-34]].forEach((o,i)=>{if(!full||i<2)ball(ctx,b.x+o[0],by+o[1],r,b.t,full?0.35:1);});
      txt(ctx,k<1.4?b.l:b.s,b.x,by+34,{s:12*k,w:700,a:'center',c:PAL['cv-ink']});});
    v.L={bins,els:[],nuc:[]};
    // ---- the atom
    const sh=shellsOf(E),Rn=nucleusR(A);
    if(p.scale){const ratio=(el.radius*1000)/(1.2*Math.cbrt(A)),Rout=RING[Math.max(0,sh.length-1)]||RING[1];
      const g=ctx.createRadialGradient(AX,AY,0,AX,AY,Rout+20);g.addColorStop(0,'rgba(212,160,23,0.20)');g.addColorStop(1,'rgba(212,160,23,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(AX,AY,Rout+20,0,6.29);ctx.fill();
      ctx.strokeStyle=PAL['cv-soft'];ctx.setLineDash([4,5]);ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(AX,AY,Rout,0,6.29);ctx.stroke();ctx.setLineDash([]);
      ctx.fillStyle=PAL['cv-ink'];ctx.fillRect(AX-0.5,AY-0.5,1,1);ctx.strokeStyle=PAL['s1'];ctx.lineWidth=2;ctx.beginPath();ctx.arc(AX,AY,10,0,6.29);ctx.stroke();
      ctx.beginPath();ctx.moveTo(AX+8,AY-8);ctx.lineTo(AX+40,AY-40);ctx.stroke();
      const npx=Rout/ratio,fields=0.015*ratio/109.7;
      pill(ctx,'nucleus: '+(npx*2).toFixed(4)+' px wide',AX+40,AY-52,PAL['s1'],'#fff',12*k);
      txt(ctx,'Atom ≈ '+CL.roundSig(ratio,3).toLocaleString('en-US')+'× wider than its nucleus',AX,AY+Rout+42,{s:13*k,w:700,a:'center'});
      txt(ctx,'Nucleus = 1.5 cm marble → atom ≈ '+CL.roundSig(0.015*ratio,3)+' m, '+fields.toFixed(1)+' football fields',AX,AY+Rout+42+18*k,{s:12*k,a:'center',c:PAL['cv-soft']});
      if(hon){const mn=Z*MP+N*MN,mt=mn+E*ME;txt(ctx,'Yet '+(100*mn/mt).toFixed(2)+'% of the mass is in the nucleus',AX,AY-Rout-30,{s:13*k,w:700,a:'center'});}}
    else{
      if(p.view==='cloud'&&hon){sh.forEach((c,i)=>{const R=RING[i],g=ctx.createRadialGradient(AX,AY,Math.max(0,R-34),AX,AY,R+30);const a=clamp(0.05+0.035*c,0,0.42);
          g.addColorStop(0,'rgba(212,160,23,0)');g.addColorStop(0.5,'rgba(212,160,23,'+a+')');g.addColorStop(1,'rgba(212,160,23,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(AX,AY,R+30,0,6.29);ctx.fill();
          const R2=rng(Math.floor(t*12)+i*977);for(let j=0;j<c*7;j++){const a2=R2()*6.283,rr2=R+(R2()+R2()+R2()-1.5)*22;ctx.fillStyle=PAL['cv-e'];ctx.globalAlpha=0.65;ctx.fillRect(AX+Math.cos(a2)*rr2-1.2,AY+Math.sin(a2)*rr2-1.2,2.4,2.4);ctx.globalAlpha=1;}});}
      else{sh.forEach((c,i)=>{ctx.strokeStyle=PAL['cv-soft'];ctx.globalAlpha=0.45;ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(AX,AY,RING[i],0,6.29);ctx.stroke();ctx.globalAlpha=1;});
        if(!sh.length){ctx.strokeStyle=PAL['line'];ctx.setLineDash([4,5]);ctx.beginPath();ctx.arc(AX,AY,RING[0],0,6.29);ctx.stroke();ctx.setLineDash([]);}
        sh.forEach((c,i)=>{const w=RM?0:0.55/(i+1);for(let j=0;j<c;j++){const a=i*0.7+j*6.2832/c+t*w;const ex=AX+Math.cos(a)*RING[i],ey=AY+Math.sin(a)*RING[i];ball(ctx,ex,ey,7,'e');v.L.els.push({x:ex,y:ey});}});}
      // nucleus
      const nl=nucleonLayout(Z,N);if(A>1){const g=ctx.createRadialGradient(AX,AY,0,AX,AY,Rn+8);g.addColorStop(0,'rgba(192,57,43,0.18)');g.addColorStop(1,'rgba(192,57,43,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(AX,AY,Rn+8,0,6.29);ctx.fill();}
      const rn=RNUC(A);for(let i=nl.length-1;i>=0;i--){const o=nl[i];ball(ctx,o.x,o.y,rn,o.t);}v.L.nuc=nl;}
    // shell counts, bottom left
    if(sh.length&&!p.scale)txt(ctx,(hon?'Shells: ':'Electrons per shell: ')+sh.join(', '),18,438,{s:13*k,w:700,c:PAL['cv-ink']});
    if(hon&&!p.scale&&sh.length)txt(ctx,'outer shell: '+sh[sh.length-1]+' e⁻',18,438-18*k,{s:12*k,c:PAL['cv-soft']});
    // game banner, top left
    if(p.mode==='game'&&st.target){const T=st.target,ok=st.matched;rr(ctx,14,12,474,44,10);ctx.fillStyle=ok?PAL['s3']:PAL['card'];ctx.fill();ctx.strokeStyle=ok?PAL['s3']:PAL['rj'];ctx.lineWidth=2;ctx.stroke();
      const ink=ok?'#fff':PAL['cv-ink'];txt(ctx,ok?'Match!':'Build:',26,40,{s:15*k,w:800,c:ink});
      if(T.draw){notation(ctx,T.p+T.n,T.p,CL.el(T.p).sym,T.p-T.e,ok?200:150,44,26,ink);}else{ctx.save();ctx.font='600 '+(13*k)+'px '+FONT;let s=T.text;const maxW=474-(ok?120:90);while(ctx.measureText(s).width>maxW&&s.length>10)s=s.slice(0,-2);if(s!==T.text)s=s.trim()+'…';ctx.restore();txt(ctx,s,ok?96:86,39,{s:13*k,w:600,c:ink});}
      txt(ctx,'Score '+st.score,478,40,{s:13*k,w:700,a:'right',c:ink});}
    else if(!p.scale){ctx.font=(12*k)+'px '+FONT;const L1='Drag particles from the bins into the atom. Drag one out to remove it.';txt(ctx,ctx.measureText(L1).width<470?L1:'Drag particles in or out of the atom',18,30,{s:12*k,c:PAL['cv-soft']});}
    // flying particles and drag
    v.fly=(v.fly||[]).filter(f=>{f.age+=vdt||0.016;const u=clamp(f.age/0.35,0,1),tx=f.t==='e'?AX+RING[Math.max(0,sh.length-1)]:AX,ty=AY;ball(ctx,lerp(f.x,tx,u),lerp(f.y,ty,u)-Math.sin(u*Math.PI)*30,f.t==='e'?6:6.8,f.t,1-u*0.6);return u<1;});
    if(v.drag){ball(ctx,v.drag.x,v.drag.y,8,v.drag.t);}
    if(v.full&&v.full.ttl>0){v.full.ttl-=vdt||0.016;pill(ctx,v.full.min?'Can’t remove: at the minimum':'That bin is empty: maximum reached',AX,AY,PAL['s4'],'#fff',13*k);}
  },
  thumbSetup(sim){sim.p.p=8;sim.p.neu=8;sim.p.e=8;}
};
AB.controls.find(c=>c.id==='mode').onChange=syncMode;
['p','neu','e'].forEach(id=>{AB.controls.find(c=>c.id===id).onChange=sim=>{const v=clamp(Math.round(sim.p[id]),LIM[id][0],LIM[id][1]);if(v!==sim.p[id]){sim.p[id]=v;if(sim.ui&&sim.ui.ctl&&sim.ui.ctl[id])sim.ui.ctl[id].set(v);}};});
BioLab.register(AB);
})();
