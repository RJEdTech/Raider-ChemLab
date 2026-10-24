(function(){
'use strict';
const {clamp,lerp,rr,txt,pill,atLeast,PAL,FONT,RM,axes,legend}=BioLab.h;
const CL=ChemLab;
/* Ionic bonding: a metal atom gives valence electrons to nonmetal atoms (Lewis dots), the ions form (sizes to scale), charges balance
   into a formula unit (crisscross and reduce), the ions pack into a lattice, and Coulomb's law sets the lattice energy. */
const S=0.28;                                    // px per pm in the transfer view
// Shannon ionic radii (pm, 6-coordinate) and thermochemical radii for polyatomic ions (Jenkins and Thakur, approximate)
const RION={Li:76,Na:102,K:138,Rb:152,Mg:72,Ca:100,Sr:118,Ba:135,Al:53.5,Zn:74,Ag:115,'Fe2':78,'Fe3':64.5,'Cu1':77,'Cu2':73,NH4:148,
  F:133,Cl:181,Br:196,I:220,O:140,S:184,N:146,P:212,OH:133,NO3:179,SO4:258,CO3:178,PO4:238,C2H3O2:162};
const METALS=[{v:'Li',f:'Li',q:1,lvl:'bio'},{v:'Na',f:'Na',q:1,lvl:'bio'},{v:'K',f:'K',q:1,lvl:'bio'},{v:'Mg',f:'Mg',q:2,lvl:'bio'},{v:'Ca',f:'Ca',q:2,lvl:'bio'},{v:'Ba',f:'Ba',q:2,lvl:'bio'},{v:'Al',f:'Al',q:3,lvl:'bio'},
  {v:'Rb',f:'Rb',q:1,lvl:'honors'},{v:'Sr',f:'Sr',q:2,lvl:'honors'},{v:'Zn',f:'Zn',q:2,lvl:'honors',tm:true},{v:'Ag',f:'Ag',q:1,lvl:'honors',tm:true},
  {v:'Fe2',f:'Fe',q:2,lvl:'honors',tm:true,roman:'II'},{v:'Fe3',f:'Fe',q:3,lvl:'honors',tm:true,roman:'III'},{v:'Cu1',f:'Cu',q:1,lvl:'honors',tm:true,roman:'I'},{v:'Cu2',f:'Cu',q:2,lvl:'honors',tm:true,roman:'II'},
  {v:'NH4',f:'NH4',q:1,lvl:'honors',poly:true,name:'ammonium'}];
const ANIONS=[{v:'F',f:'F',q:-1,lvl:'bio'},{v:'Cl',f:'Cl',q:-1,lvl:'bio'},{v:'Br',f:'Br',q:-1,lvl:'bio'},{v:'I',f:'I',q:-1,lvl:'bio'},{v:'O',f:'O',q:-2,lvl:'bio'},{v:'S',f:'S',q:-2,lvl:'bio'},{v:'N',f:'N',q:-3,lvl:'bio'},{v:'P',f:'P',q:-3,lvl:'bio'},
  {v:'OH',f:'OH',q:-1,lvl:'honors',poly:true,name:'hydroxide'},{v:'NO3',f:'NO3',q:-1,lvl:'honors',poly:true,name:'nitrate'},{v:'C2H3O2',f:'C2H3O2',q:-1,lvl:'honors',poly:true,name:'acetate'},
  {v:'SO4',f:'SO4',q:-2,lvl:'honors',poly:true,name:'sulfate'},{v:'CO3',f:'CO3',q:-2,lvl:'honors',poly:true,name:'carbonate'},{v:'PO4',f:'PO4',q:-3,lvl:'honors',poly:true,name:'phosphate'}];
const M=v=>METALS.find(m=>m.v===v),A=v=>ANIONS.find(a=>a.v===v);
// lattice energies (kJ/mol, Born–Haber values, CRC) and melting points (°C)
const LAT={LiF:[1036,845],LiCl:[853,605],LiBr:[807,552],LiI:[757,469],NaF:[923,993],NaCl:[786,801],NaBr:[747,747],NaI:[704,661],KF:[821,858],KCl:[715,770],KBr:[682,734],KI:[649,681],
  RbCl:[689,718],MgF2:[2957,1263],MgCl2:[2526,714],MgO:[3850,2852],MgS:[3406,2000],CaF2:[2630,1418],CaCl2:[2258,772],CaO:[3414,2613],CaS:[3119,2525],SrO:[3217,2531],BaO:[3054,1923],
  BaCl2:[2056,962],Li2O:[2799,1438],Na2O:[2481,1132],K2O:[2238,740],Na2S:[2203,1176],Al2O3:[15916,2072],AgCl:[916,455],ZnO:[4142,1975]};
const gcd=(a,b)=>b?gcd(b,a%b):a;
function cmpd(p){const m=M(p.metal),a=A(p.anion);const qa=Math.abs(a.q),d=gcd(m.q,qa);const nC=qa/d,nA=m.q/d;const f=CL.ionicFormula({f:m.f,q:m.q},{f:a.f,q:a.q});
  const rc=RION[m.v],ra=RION[a.v];const catName=m.poly?m.name:CL.el(m.f).name.toLowerCase()+(m.roman?'('+m.roman+')':'');const anName=a.poly?a.name:CL.anionName[a.f];
  return {m,a,nC,nA,f,rc,ra,d:rc+ra,qq:m.q*qa,cf:m.q*qa/((rc+ra)/100),name:catName+' '+anName,lat:LAT[f]||null,crossC:qa,crossA:m.q};}
const mainVal=m=>m.tm||m.poly?null:CL.valence(CL.el(m.f));
const fmtIon=(f,q)=>CL.fmt(f,q);
// Lewis dot slots: one per side first, then pairs
const SLOT=[[0,-1,-1],[1,0,-1],[0,1,1],[-1,0,1],[0,-1,1],[1,0,1],[0,1,-1],[-1,0,-1]];
function slotPos(x,y,r,i){const s=SLOT[i];const off=s[2]*7;return [x+s[0]*(r+9)+(s[0]?0:off),y+s[1]*(r+9)+(s[1]?0:off)];}
/* ---------- animation timeline ---------- */
const T_TR0=1.0,T_TR=2.6,T_ION=3.8,T_JOIN=5.0,T_END=6.4;
function layout(c){const pos=[];const nC=c.nC,nA=c.nA;const rC=(c.m.poly?c.rc:CL.el(c.m.f).radius)*S,rA=(c.a.poly?c.ra:Math.max(CL.el(c.a.f).radius,c.ra))*S;
  const ys=(n,r)=>{if(n===1)return [[0,200]];const sp=n===2?130:104,need=2*r+20,dx=sp>=need?0:Math.sqrt(need*need-sp*sp)/2;return n===2?[[-dx,200-sp/2],[dx,200+sp/2]]:[[-dx,200-sp],[dx,200],[-dx,200+sp]];};
  ys(nC,rC).forEach(([dx,y])=>pos.push({kind:'c',x:200+dx,y}));ys(nA,rA).forEach(([dx,y])=>pos.push({kind:'a',x:600-dx,y}));
  // joined formula unit: alternate along a row
  const seq=[];let ci=0,ai=0;const big=nC>=nA?'c':'a';while(ci<nC||ai<nA){if(big==='c'){if(ci<nC)seq.push('c'+ci++);if(ai<nA)seq.push('a'+ai++);}else{if(ai<nA)seq.push('a'+ai++);if(ci<nC)seq.push('c'+ci++);}}
  const rad=k=>(k[0]==='c'?c.rc:c.ra)*S;let w=seq.reduce((s,k)=>s+2*rad(k),0);let x=400-w/2;const tgt={};seq.forEach(k=>{const r=rad(k);tgt[k]=[x+r,205];x+=2*r;});
  pos.forEach((p,j)=>{p.key=p.kind+(p.kind==='c'?j:j-nC);p.tx=tgt[p.key][0];p.ty=tgt[p.key][1];});return pos;}
function transfers(c){const out=[];const mv=mainVal(c.m),noTr=c.a.poly;if(noTr)return out;const qa=Math.abs(c.a.q),tot=c.nC*c.m.q;const av=8-qa;
  for(let g=0;g<tot;g++){const ci=Math.floor(g/c.m.q),ki=g%c.m.q,aj=Math.floor(g/qa),kj=g%qa;out.push({ci,ki,aj,slot:av+kj,t0:T_TR0+g*(T_TR/Math.max(tot,1)),dur:Math.min(0.7,T_TR/Math.max(tot,1)+0.3)});}
  return out;}
const ease=x=>x<0?0:x>1?1:x*x*(3-2*x);

function syncView(sim){if(!sim.ui||!sim.ui.sec)return;const d=sim.def,v=sim.p.view;
  d.controls.forEach(c=>{if(!c.views)return;const cid=d.id+'-'+c.id,e=document.getElementById(cid)||document.getElementById(cid+'-l');if(!e)return;const w=e.closest('.ctl');if(w)w.hidden=!atLeast(c.lvl)||!c.views.includes(v);});
  const btns=[...sim.ui.sec.querySelectorAll('.actions button')];d.actions.forEach((a,i)=>{if(btns[i])btns[i].hidden=!atLeast(a.lvl)||!a.views.includes(v);});}
const replay=sim=>{if(sim.p.metal==='NH4'&&['O','N','P'].includes(sim.p.anion)){sim.p.anion='Cl';if(sim.ui&&sim.ui.ctl&&sim.ui.ctl.anion)sim.ui.ctl.anion.set('Cl');}if(sim.st)sim.st.at=0;};

const SIM={
  id:'ionic',hash:'ionic',apUnit:5,order:1,tab:'Ionic bonding',kind:'Simulation',
  card:'Watch a metal hand its electrons to a nonmetal, balance the charges into a formula, and build the crystal lattice.',
  title:'Ionic bonding: electron transfer to formula',
  lede:{bio:'Metals give away their valence electrons and nonmetals take them. The ions that form have opposite charges, so they stick together in a ratio that makes the total charge zero.',
        honors:'Add transition metals and polyatomic ions. Use the crisscross method, reduce the subscripts, and see how the ions pack into a crystal.',
        ap:'Compare lattice energies with Coulomb’s law: bigger charges and smaller ions hold the crystal together more strongly, which raises the melting point.'},
  scale:{bio:'Particle level: single atoms and ions, drawn to scale. A sodium atom is 0.33 nm across.',ap:'Particle level, to scale: radii are covalent radii for atoms and Shannon ionic radii for ions.'},
  timeless:true,animated:true,chChange:1,chReveal:8.2,
  prereq:['ptable','trends'],next:['naming','bondtypes','lewis'],
  controls:[
    {id:'view',label:'View',type:'seg',def:'transfer',lvl:'bio',noTrial:true,options:[{v:'transfer',l:'Electron transfer'},{v:'lattice',l:'Crystal lattice'},{v:'energy',l:'Lattice energy',lvl:'ap'}],onChange:sim=>{syncView(sim);replay(sim);}},
    {id:'metal',label:'Metal (positive ion)',type:'select',def:'Na',lvl:'bio',options:METALS.map(m=>({v:m.v,l:(m.poly?'NH₄⁺ ammonium':m.f+' · '+CL.el(m.f).name+(m.roman?' ('+m.roman+')':''))+' → '+fmtIon(m.f,m.q),lvl:m.lvl})),onChange:replay},
    {id:'anion',label:'Nonmetal (negative ion)',type:'select',def:'Cl',lvl:'bio',options:ANIONS.map(a=>({v:a.v,l:(a.poly?a.name:a.f+' · '+CL.el(a.f).name)+' → '+fmtIon(a.f,a.q),lvl:a.lvl})),onChange:replay},
    {id:'d3',label:'3D view',type:'toggle',def:false,lvl:'honors',noTrial:true,views:['lattice'],help:'Rock-salt crystals (1 : 1 compounds) only'}
  ],
  actions:[{id:'replay',label:'Replay the transfer',primary:true,views:['transfer'],run:replay}],
  init(){return {at:0,rot:0};},
  step(sim,dt){sim.st.at=Math.min(T_END+0.5,sim.st.at+dt);sim.st.rot+=dt*(RM?0:0.35);},
  initVis(sim){syncView(sim);},onLevel(sim){syncView(sim);},
  metrics:[
    {id:'formula',label:'Formula unit',unit:'',lvl:'bio',text:true,noTrial:false,get:s=>CL.fmt(cmpd(s.p).f)},
    {id:'name',label:'Name',unit:'',lvl:'honors',text:true,get:s=>cmpd(s.p).name},
    {id:'qc',label:'Cation charge',unit:'',lvl:'bio',min:0,max:3,d:0,get:s=>cmpd(s.p).m.q},
    {id:'qa',label:'Anion charge',unit:'',lvl:'bio',min:-3,max:0,d:0,get:s=>cmpd(s.p).a.q},
    {id:'ratio',label:'Cations : anions',unit:'',lvl:'bio',text:true,get:s=>{const c=cmpd(s.p);return c.nC+' : '+c.nA;}},
    {id:'etr',label:'Electrons moved per formula unit',unit:'e⁻',lvl:'bio',min:0,max:6,d:0,get:s=>{const c=cmpd(s.p);return c.nC*c.m.q;}},
    {id:'dist',label:'r₊ + r₋',unit:'pm',lvl:'ap',min:0,max:500,d:0,get:s=>cmpd(s.p).d},
    {id:'cf',label:'Coulomb factor |q₊q₋|/d',unit:'per 100 pm',lvl:'ap',min:0,max:null,d:2,get:s=>cmpd(s.p).cf},
    {id:'U',label:'Lattice energy (measured)',unit:'kJ/mol',lvl:'ap',min:0,max:null,d:0,get:s=>{const c=cmpd(s.p);return c.lat?c.lat[0]:NaN;}},
    {id:'mp',label:'Melting point',unit:'°C',lvl:'ap',min:0,max:3000,d:0,get:s=>{const c=cmpd(s.p);return c.lat?c.lat[1]:NaN;}}
  ],
  graphs:[{id:'bal',label:'Charge balance in one formula unit',lvl:'bio',custom:true},{id:'lat',label:'Lattice energy vs Coulomb factor',lvl:'ap',custom:true},{id:'mpg',label:'Melting point vs lattice energy',lvl:'ap',custom:true}],defaultGraph:'bal',
  plot(sim,ctx,box,id){const cur=cmpd(sim.p);
    if(id==='bal'){const pos=cur.nC*cur.m.q,neg=cur.nA*Math.abs(cur.a.q);const ax=axes(ctx,box,{xmin:0,xmax:2,ymin:0,ymax:Math.max(4,pos+1),xcats:['+ charge: '+cur.nC+' × '+cur.m.q+'+','− charge: '+cur.nA+' × '+Math.abs(cur.a.q)+'−'],yl:'Total charge (units of e)'});
      BioLab.h.bars(ctx,ax,[pos,neg],{colors:[PAL['s2'],PAL['s1']]});txt(ctx,CL.fmt(cur.f)+': '+pos+' positive = '+neg+' negative, net 0',box.L+box.W/2,box.T+14,{s:14,w:700,c:PAL['fg'],a:'center'});return;}const pts=Object.keys(LAT).map(f=>{const c=findCmpd(f);return c?{f,c,U:LAT[f][0],mp:LAT[f][1]}:null;}).filter(x=>x&&x.f!=='Al2O3');
    const X=id==='lat'?(p=>p.c.cf):(p=>p.U),Yv=id==='lat'?(p=>p.U):(p=>p.mp);const xmax=Math.max(...pts.map(X))*1.1,ymax=Math.max(...pts.map(Yv))*1.1;
    const ax=axes(ctx,box,{xmin:0,xmax,ymin:0,ymax,xl:id==='lat'?'|q₊q₋| / (r₊ + r₋)  (per 100 pm)':'Lattice energy (kJ/mol)',yl:id==='lat'?'Lattice energy (kJ/mol)':'Melting point (°C)'});
    pts.forEach(p=>{const one=p.c.nC===1&&p.c.nA===1;ctx.fillStyle=one?PAL['s2']:PAL['s3'];ctx.beginPath();ctx.arc(ax.X(X(p)),ax.Y(Yv(p)),5,0,6.29);ctx.fill();if(p.f===cur.f){ctx.strokeStyle=PAL['s4'];ctx.lineWidth=3;ctx.beginPath();ctx.arc(ax.X(X(p)),ax.Y(Yv(p)),10,0,6.29);ctx.stroke();}});
    legend(ctx,box.L+10,box.T+10,[{label:'1 : 1 salts',color:PAL['s2']},{label:'other ratios',color:PAL['s3']},{label:cur.lat&&cur.f!=='Al2O3'?CL.fmt(cur.f):'(no data for '+CL.fmt(cur.f)+')',color:PAL['s4']}]);},
  challengeTitle:'Predict, then test',
  challenges(){const mgcl=cmpd({metal:'Mg',anion:'Cl'}),alo=cmpd({metal:'Al',anion:'O'}),cao=cmpd({metal:'Ca',anion:'O'}),caoh=cmpd({metal:'Ca',anion:'OH'}),fecl=cmpd({metal:'Fe3',anion:'Cl'});
    const alC=['Al2O3','AlO','Al3O2','AlO3'];const caC=['Ca2O2','CaO','Ca2O','CaO2'];const ohC=['Ca(OH)2','CaOH2','CaOH','Ca2OH'];const feC=['FeCl3','FeCl','Fe3Cl','FeCl2'];
    const U=f=>LAT[f][0],mp=f=>LAT[f][1];
    return [
      {lvl:'bio',q:'Sodium needs one chlorine. Swap sodium for magnesium. How many chlorine atoms does one magnesium atom need?',choices:['1','2','3'],correct:mgcl.nA-1,
       baseline:{view:'transfer',metal:'Na',anion:'Cl'},change:{metal:'Mg'},changeText:'Metal changed to magnesium',
       explain:{bio:'Magnesium has 2 valence electrons to give, and each chlorine only takes 1, so it takes <b>2 chlorines</b>: MgCl₂. The total charge is (+2) + 2(−1) = 0.'}},
      {lvl:'bio',instant:true,q:'When a sodium atom gives its electron to chlorine, sodium becomes…',choices:['Na⁺, positive','Na⁻, negative','neutral, because it is still sodium'],correct:0,set:{view:'transfer',metal:'Na',anion:'Cl'},
       explain:'Sodium keeps its 11 protons but now has only 10 electrons, so it has one more + than −: <b>Na⁺</b>. Losing a negative electron leaves a positive ion. Chlorine gains it and becomes Cl⁻.'},
      {lvl:'bio',instant:true,q:'What is the formula of the compound aluminum and oxygen form?',choices:alC.map(x=>CL.fmt(x)),correct:alC.indexOf(alo.f),set:{view:'transfer',metal:'Al',anion:'O'},
       explain:'Al³⁺ and O²⁻: the smallest number of each that cancels is 2 Al³⁺ (+6) and 3 O²⁻ (−6), so <b>Al₂O₃</b>. Six electrons move from two aluminum atoms to three oxygen atoms.'},
      {lvl:'honors',instant:true,q:'Crisscrossing Ca²⁺ and O²⁻ gives Ca₂O₂. What is the correct formula?',choices:caC.map(x=>CL.fmt(x)),correct:caC.indexOf(cao.f),set:{view:'transfer',metal:'Ca',anion:'O'},
       explain:'Ionic formulas show the <b>smallest whole-number ratio</b>, so Ca₂O₂ reduces to <b>CaO</b>. One Ca²⁺ already cancels one O²⁻.'},
      {lvl:'honors',instant:true,q:'Calcium ions combine with hydroxide ions (OH⁻). What is the formula?',choices:ohC.map(x=>CL.fmt(x)),correct:ohC.indexOf(caoh.f),set:{view:'transfer',metal:'Ca',anion:'OH'},
       explain:'Ca²⁺ needs two OH⁻. Hydroxide is one unit, so the 2 goes outside parentheses: <b>Ca(OH)₂</b>. CaOH₂ would mean one oxygen and two hydrogens.'},
      {lvl:'honors',instant:true,q:'Iron(III) and chloride ions combine. What is the formula?',choices:feC.map(x=>CL.fmt(x)),correct:feC.indexOf(fecl.f),set:{view:'transfer',metal:'Fe3',anion:'Cl'},
       explain:'Iron(III) means Fe³⁺, so it takes three Cl⁻: <b>FeCl₃</b>. The Roman numeral is the charge of the iron ion.'},
      {lvl:'ap',instant:true,q:'Which has the larger lattice energy, NaCl or MgO?',choices:['NaCl','MgO','About the same'],correct:U('MgO')>U('NaCl')?1:0,set:{view:'energy',metal:'Mg',anion:'O'},
       explain:'MgO: '+U('MgO')+' kJ/mol vs NaCl: '+U('NaCl')+'. The charge product is 4 instead of 1, and the ions are also closer (212 pm vs 283 pm), so the Coulomb attraction is about 5× bigger. MgO melts at '+mp('MgO')+' °C; NaCl at '+mp('NaCl')+' °C.'},
      {lvl:'ap',instant:true,q:'Which melts at a higher temperature, NaF or NaI?',choices:['NaF','NaI','About the same'],correct:mp('NaF')>mp('NaI')?0:1,set:{view:'energy',metal:'Na',anion:'F'},
       explain:'Same charges, but F⁻ (133 pm) is much smaller than I⁻ (220 pm), so the ions sit closer and attract more strongly. NaF: '+U('NaF')+' kJ/mol, melts at '+mp('NaF')+' °C. NaI: '+U('NaI')+' kJ/mol, '+mp('NaI')+' °C.'},
      {lvl:'ap',instant:true,q:'Which has the larger lattice energy, KCl or NaCl?',choices:['KCl','NaCl','About the same'],correct:U('NaCl')>U('KCl')?1:0,set:{view:'energy',metal:'K',anion:'Cl'},
       explain:'K⁺ (138 pm) is bigger than Na⁺ (102 pm), so the distance d is larger and the attraction weaker: NaCl '+U('NaCl')+' vs KCl '+U('KCl')+' kJ/mol.'}
    ];},
  onChallenge(sim,ch,phase){if(ch&&phase==='done'&&ch.set){BioLab.setValues(sim,ch.set);syncView(sim);replay(sim);}},
  narrate(sim){const c=cmpd(sim.p),at=sim.st.at,v=sim.p.view,m=c.m,a=c.a;const mN=m.poly?'ammonium':CL.el(m.f).name.toLowerCase(),aN=a.poly?a.name:CL.el(a.f).name.toLowerCase();
    if(v==='lattice')return `<b>${CL.html(c.f)} has no separate molecules.</b> Each ion is surrounded by ions of the opposite charge, repeated in every direction. The formula only gives the ratio: ${c.nC} ${CL.html(m.f,m.q)} for every ${c.nA} ${CL.html(a.f,a.q)}.`;
    if(v==='energy')return `Coulomb’s law: attraction ∝ q₊q₋/d. Here q₊q₋ = ${c.m.q} × ${Math.abs(c.a.q)} = ${c.qq} and d = ${c.rc} + ${c.ra} = ${c.d} pm. ${c.lat?'Measured lattice energy: <b>'+c.lat[0]+' kJ/mol</b>, melting point '+c.lat[1]+' °C.':'No measured value is listed for this compound.'}`;
    if(a.poly||m.poly){if(at<T_JOIN)return `<b>Polyatomic ions arrive already charged.</b> ${CL.html(a.f,a.q)} is a group of atoms sharing ${Math.abs(a.q)===1?'one extra electron':Math.abs(a.q)+' extra electrons'}. Count ions until the charges cancel.`;
      return `${c.nC} × (+${m.q}) + ${c.nA} × (−${Math.abs(a.q)}) = 0, so the formula unit is <b>${CL.html(c.f)}</b>${c.nA>1&&a.poly||c.nC>1&&m.poly?', with parentheses around the polyatomic ion':''}.`;}
    if(at<T_TR0)return `${mN.replace(/^./,x=>x.toUpperCase())} is a metal with ${m.q} valence electron${m.q>1?'s':''} (${m.tm?'a transition metal, shown without dots':'the dots'}). ${aN.replace(/^./,x=>x.toUpperCase())} has ${8-Math.abs(a.q)} and needs ${Math.abs(a.q)} more to make 8.`;
    if(at<T_ION)return `<b>Electrons move from metal to nonmetal.</b> ${c.nC>1?c.nC+' '+mN+' atoms':'The '+mN+' atom'} give${c.nC>1?'':'s'} up ${c.nC*m.q} electron${c.nC*m.q>1?'s':''} in all, and ${c.nA>1?'each of the '+c.nA+' '+aN+' atoms':'the '+aN+' atom'} takes ${Math.abs(a.q)}.`;
    if(at<T_JOIN)return `<b>Ions form.</b> ${CL.html(m.f,m.q)} shrinks because it lost its outer shell. ${CL.html(a.f,a.q)} grows because its extra electrons repel each other. Both now have a full octet.`;
    return `<b>Opposite charges attract.</b> ${c.nC} × (+${m.q}) + ${c.nA} × (−${Math.abs(a.q)}) = 0, so the formula unit is ${CL.html(c.f)}.`;},
  tour:[
    {title:'Two kinds of atoms',text:'Sodium is a metal with 1 valence electron. Chlorine is a nonmetal with 7. Each dot is a valence electron.',focus:[100,60,600,280],speed:0.5,pause:true,setup(sim){BioLab.setValues(sim,{view:'transfer',metal:'Na',anion:'Cl'});syncView(sim);sim.st.at=0.3;}},
    {title:'The electron moves',text:'Sodium holds its one outer electron loosely, and chlorine pulls hard. The electron moves from sodium to chlorine.',focus:[100,60,600,280],speed:0.35,setup(sim){sim.st.at=T_TR0-0.2;}},
    {title:'Ions form',text:'Sodium now has 11 protons and 10 electrons: Na⁺. Chlorine has 17 protons and 18 electrons: Cl⁻ with a full octet. Notice the sizes: the cation shrinks and the anion grows.',focus:[100,60,600,280],pause:true,setup(sim){sim.st.at=T_JOIN-0.05;}},
    {title:'Opposite charges attract',text:'The + and − ions pull together. That electrostatic attraction is the ionic bond.',focus:[100,60,600,280],speed:0.5,setup(sim){sim.st.at=T_JOIN;}},
    {title:'Balancing the charges',text:'Magnesium gives away 2 electrons but each chlorine takes only 1, so one Mg needs two Cl: MgCl₂.',focus:[60,30,680,330],speed:0.6,setup(sim){BioLab.setValues(sim,{metal:'Mg',anion:'Cl'});sim.st.at=0.5;}},
    {title:'The crisscross shortcut',text:'Write each ion’s charge number as the other ion’s subscript, then reduce. Mg²⁺ and Cl⁻ give Mg₁Cl₂ → MgCl₂. Ca²⁺ and O²⁻ give Ca₂O₂, which reduces to CaO.',focus:[8,366,784,80],pause:true,setup(sim){sim.st.at=T_END;}},
    {title:'A crystal, not a molecule',text:'In a real sample, the ions pack into a lattice. Each Na⁺ is surrounded by Cl⁻ and each Cl⁻ by Na⁺. The formula is just the ratio.',focus:[0,0,800,450],pause:true,setup(sim){BioLab.setValues(sim,{view:'lattice',metal:'Na',anion:'Cl'});syncView(sim);}},
    {lvl:'ap',title:'Lattice energy',text:'Coulomb’s law sets how strongly the lattice holds together: larger charges and smaller ions mean a larger lattice energy and a higher melting point. MgO melts at 2852 °C; NaCl at 801 °C.',focus:[0,0,800,450],pause:true,setup(sim){BioLab.setValues(sim,{view:'energy',metal:'Mg',anion:'O'});syncView(sim);}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{view:'transfer',metal:'Na',anion:'Cl'});syncView(sim);replay(sim);},
  lab:{bio:'<p><b>Question:</b> How do you predict the ratio of ions in a compound?</p><ol><li>Keep chlorine as the nonmetal. Try Na, Mg and Al, and press <b>Record trial</b> after each animation.</li><li>Keep sodium as the metal. Try Cl, O and N, recording each.</li><li>Compare the cation charge, anion charge and the ratio in the table.</li></ol><p>Write a rule that predicts the formula from the two charges.</p>',
       honors:'<p><b>Question:</b> Does the crisscross method always give the right formula?</p><ol><li>Record trials for Na with O, Mg with O, Al with O, Ca with N and Fe(III) with S.</li><li>For each, write the crisscross result before reducing.</li><li>Add three polyatomic ions (OH⁻, SO₄²⁻, PO₄³⁻) with Ca²⁺ and Al³⁺.</li></ol><p>Explain when you must reduce the subscripts and when you need parentheses.</p>',
       ap:'<p><b>Question:</b> How well does Coulomb’s law predict lattice energy?</p><ol><li>Switch to Lattice energy. Record trials for every 1 : 1 alkali halide (Li, Na, K with F, Cl, Br, I).</li><li>Record MgO, CaO, BaO, MgCl₂, CaCl₂ and Na₂O.</li><li>Plot the Coulomb factor (x) against lattice energy (y), then lattice energy (x) against melting point (y).</li></ol><p><b>Claim–evidence–reasoning:</b> Is lattice energy proportional to |q₊q₋|/d? Explain why the 1 : 1 salts fall on one line while compounds with other ratios do not (hint: the Madelung constant and ions per formula unit).</p>'},
  terms:[{t:'Ion',d:'An atom or group of atoms with a charge because it has lost or gained electrons.'},{t:'Cation',d:'A positive ion. Metals form cations by losing electrons.'},{t:'Anion',d:'A negative ion. Nonmetals form anions by gaining electrons.'},
    {t:'Ionic bond',d:'The electrostatic attraction between oppositely charged ions.'},{t:'Octet rule',d:'Atoms tend to gain, lose or share electrons until they have 8 valence electrons.'},{t:'Formula unit',d:'The smallest whole-number ratio of ions in an ionic compound, like NaCl or MgCl₂.'},
    {lvl:'honors',t:'Crisscross method',d:'Use each ion’s charge number as the other ion’s subscript, then reduce to the smallest ratio.'},{lvl:'honors',t:'Polyatomic ion',d:'A group of covalently bonded atoms with an overall charge, like NO₃⁻ or SO₄²⁻.'},{lvl:'honors',t:'Crystal lattice',d:'The repeating 3D arrangement of ions in an ionic solid.'},
    {lvl:'ap',t:'Lattice energy',d:'The energy released when gaseous ions form one mole of the solid (or needed to separate it). It grows with ion charge and shrinks with ion size.'},{lvl:'ap',t:'Coulomb’s law',d:'F ∝ q₁q₂/r². For ions in contact, the potential energy ∝ q₊q₋/(r₊ + r₋).'}],
  about:'<p>Atoms are drawn with ChemLab covalent radii and ions with Shannon six-coordinate ionic radii, on the same scale, so the size changes are real. Polyatomic ions use approximate thermochemical radii (Jenkins and Thakur). Formulas come from ChemLab’s charge-balancing function. Lattice energies are Born–Haber values and melting points come from the CRC Handbook.</p><p>Simplifications: the animation shows electrons moving straight from metal atoms to nonmetal atoms. In a real reaction the elements start as a metal solid and diatomic gases (Cl₂, O₂), and forming the ions from the elements takes several energy steps (the Born–Haber cycle). Transition metals are shown without Lewis dots because their valence electrons include d electrons. Polyatomic ions are shown already formed. The 2D lattice is a flat sketch that keeps the right ratio and the right ion sizes; the 3D view shows the real rock-salt structure for 1 : 1 compounds. The Coulomb factor ignores the Madelung constant, so compounds with different structures do not fall on one line.</p>',
  draw(sim,ctx,vdt,k,t){ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);const v=sim.p.view;
    if(v==='lattice')drawLattice(sim,ctx,k);else if(v==='energy')drawEnergy(sim,ctx,k);else drawTransfer(sim,ctx,k,t);},
  thumbSetup(sim){sim.p.metal='Mg';sim.p.anion='Cl';sim.st.at=2.2;}
};
function findCmpd(f){for(const m of METALS)for(const a of ANIONS){const c=cmpd({metal:m.v,anion:a.v});if(c.f===f&&!m.roman)return c;}return null;}
function fitT(ctx,s,maxW,size,min,w){let z=size;ctx.font=(w||400)+' '+z+'px '+FONT;while(ctx.measureText(s).width>maxW&&z>min){z-=0.5;ctx.font=(w||400)+' '+z+'px '+FONT;}return z;}
function ionBall(ctx,x,y,r,sym,q,k,col,alpha){const lab=q===0?sym:CL.fmt(sym,q);CL.drawAtom(ctx,x,y,r,sym,{color:col,label:'',alpha});ctx.save();if(alpha!==undefined)ctx.globalAlpha=alpha;
  const fs=Math.max(12*k,Math.min(r*0.8,20));const w=(ctx.font=(700)+' '+fs+'px '+FONT,ctx.measureText(lab).width);
  if(w<r*1.8)txt(ctx,lab,x,y+1,{s:fs,w:800,c:CL.inkOn(col),a:'center',b:'middle'});else{pill(ctx,lab,x,y+r+12*k,PAL['card'],PAL['cv-ink'],12*k);}ctx.restore();}
const CATCOL='#5d7fb5',ANCOL='#3d9a62',POLYCOL='#b06a2f';
function colFor(c,kind){if(kind==='c')return c.m.poly?POLYCOL:CATCOL;return c.a.poly?POLYCOL:ANCOL;}
function drawTransfer(sim,ctx,k,t){const P=PAL,c=cmpd(sim.p),at=sim.st.at,pos=layout(c),trs=transfers(c);const mv=mainVal(c.m),qa=Math.abs(c.a.q),poly=c.a.poly||c.m.poly;
  const phase=poly?(at<T_JOIN?2:3):at<T_TR0?0:at<T_ION?1:at<T_JOIN?2:3;const titles=['1. Atoms and their valence electrons','2. Electrons move from metal to nonmetal','3. Ions form, each with a full octet','4. Opposite charges attract: '+CL.fmt(c.f)];
  const tt=poly&&phase<3?'Ions that arrive already charged':titles[phase];txt(ctx,tt,400,24,{s:fitT(ctx,tt,780,15*k,12*k,700),w:700,a:'center'});
  const fIon=poly?1:ease((at-T_ION+0.6)/0.8),fJoin=ease((at-T_JOIN)/1.0);
  const topC=Math.min(...pos.map(p=>p.y-((p.kind==='c'?CL.el(c.m.poly?'N':c.m.f).radius:120)*S)));
  if(fJoin<0.05&&k<1.4&&topC>72){txt(ctx,c.m.poly?'Cation':'Metal',200,52,{s:13*k,w:700,c:P['cv-soft'],a:'center'});txt(ctx,c.a.poly?'Polyatomic anion':'Nonmetal',600,52,{s:13*k,w:700,c:P['cv-soft'],a:'center'});}
  pos.forEach(p=>{const isC=p.kind==='c';const ra=isC?(c.m.poly?c.rc:CL.el(c.m.f).radius):(c.a.poly?c.ra:CL.el(c.a.f).radius),ri=isC?c.rc:c.ra;const r=lerp(ra,ri,fIon)*S;
    const x=lerp(p.x,p.tx,fJoin),y=lerp(p.y,p.ty,fJoin);p.cx=x;p.cy=y;p.r=r;
    const sym=isC?c.m.f:c.a.f,q=fIon>0.5?(isC?c.m.q:c.a.q):0;const col=colFor(c,p.kind);ionBall(ctx,x,y,r,sym,q,k,col);
    if(fIon>0.5&&fJoin<0.6){ctx.save();ctx.globalAlpha=1-fJoin/0.6;ctx.strokeStyle=P['cv-soft'];ctx.lineWidth=2;const b=r+12;ctx.beginPath();ctx.moveTo(x-b+6,y-b);ctx.lineTo(x-b,y-b);ctx.lineTo(x-b,y+b);ctx.lineTo(x-b+6,y+b);ctx.moveTo(x+b-6,y-b);ctx.lineTo(x+b,y-b);ctx.lineTo(x+b,y+b);ctx.lineTo(x+b-6,y+b);ctx.stroke();ctx.restore();}});
  // dots
  if(!poly&&fJoin<0.6){const alpha=1-fJoin/0.6;ctx.save();ctx.globalAlpha=alpha;
    pos.filter(p=>p.kind==='a').forEach((p,j)=>{for(let s=0;s<8-qa;s++){const [x,y]=slotPos(p.cx,p.cy,p.r,s);dot(ctx,x,y,P['cv-ink']);}
      trs.filter(tr=>tr.aj===j&&at>=tr.t0+tr.dur).forEach(tr=>{const [x,y]=slotPos(p.cx,p.cy,p.r,tr.slot);dot(ctx,x,y,P['s1'],true);});});
    pos.filter(p=>p.kind==='c').forEach((p,i)=>{if(mv===null){if(at<T_TR0){txt(ctx,c.m.q+' e⁻ to give',p.cx,p.cy+p.r+20,{s:12*k,w:700,c:P['s1'],a:'center'});}return;}
      trs.filter(tr=>tr.ci===i&&at<tr.t0).forEach(tr=>{const [x,y]=slotPos(p.cx,p.cy,p.r,tr.ki);dot(ctx,x,y,P['s1'],true);});});
    trs.forEach(tr=>{if(at<tr.t0||at>=tr.t0+tr.dur)return;const f=ease((at-tr.t0)/tr.dur);const pc=pos.filter(p=>p.kind==='c')[tr.ci],pa=pos.filter(p=>p.kind==='a')[tr.aj];
      const [x0,y0]=mv===null?[pc.cx+pc.r,pc.cy]:slotPos(pc.cx,pc.cy,pc.r,tr.ki),[x1,y1]=slotPos(pa.cx,pa.cy,pa.r,tr.slot);const x=lerp(x0,x1,f),y=lerp(y0,y1,f)-Math.sin(f*Math.PI)*40;
      dot(ctx,x,y,P['s1'],true,6);if(k<1.4)txt(ctx,'e⁻',x+9,y-8,{s:12*k,w:700,c:P['s1']});});
    ctx.restore();}
  if(phase===3){const s=c.nC+' × (+'+c.m.q+') + '+c.nA+' × (−'+Math.abs(c.a.q)+') = 0';txt(ctx,s,400,300,{s:fitT(ctx,s,760,14*k,12*k,700),w:700,a:'center',c:P['s3']});}
  drawCross(ctx,c,k);}
function dot(ctx,x,y,col,ring,r){ctx.beginPath();ctx.arc(x,y,r||4.2,0,6.29);ctx.fillStyle=col;ctx.fill();if(ring){ctx.strokeStyle=PAL['cv-bg'];ctx.lineWidth=1.2;ctx.stroke();}}
function drawCross(ctx,c,k){const P=PAL,y0=372;rr(ctx,8,y0-6,784,82,10);ctx.fillStyle=P['card'];ctx.fill();ctx.strokeStyle=P['line'];ctx.lineWidth=1;ctx.stroke();
  const big=18*Math.min(k,1.5),cy=y0+34;const m=c.m,a=c.a;
  // ions with their charge numbers
  const mt=m.poly?CL.fmt(m.f):m.f,atx=a.poly?CL.fmt(a.f):a.f;ctx.font='800 '+big+'px '+FONT;const wm=ctx.measureText(mt).width,wa=ctx.measureText(atx).width;const x1=30,x2=x1+wm+big*3;
  const sx1=x1+wm+big*0.3,sx2=x2+wa+big*0.3,sy=cy-big*0.55,by=cy+big*0.62;
  ctx.strokeStyle=P['s4'];ctx.lineWidth=2;ctx.setLineDash([4,3]);ctx.beginPath();ctx.moveTo(sx1+4,sy+6);ctx.lineTo(sx2-2,by-4);ctx.moveTo(sx2-4,sy+6);ctx.lineTo(sx1+2,by-4);ctx.stroke();ctx.setLineDash([]);
  const ko=(s,x,y,size,col)=>{ctx.font='800 '+size+'px '+FONT;ctx.textBaseline='middle';ctx.textAlign='left';ctx.lineWidth=6;ctx.strokeStyle=P['card'];ctx.lineJoin='round';ctx.strokeText(s,x,y);txt(ctx,s,x,y,{s:size,w:800,c:col||P['cv-ink'],b:'middle'});};
  ko(mt,x1,cy,big);ko(atx,x2,cy,big);ko(CL.sup(m.q+'+'),x1+wm+2,sy,big*0.75,P['s2']);ko(CL.sup(Math.abs(a.q)+'-'),x2+wa+2,sy,big*0.75,P['s1']);
  ko(String(Math.abs(a.q)),sx1-big*0.15,by,big*0.7,P['s4']);ko(String(m.q),sx2-big*0.15,by,big*0.7,P['s4']);
  const raw=(m.poly&&c.crossC>1?'('+m.f+')':m.f)+c.crossC+(a.poly&&c.crossA>1?'('+a.f+')':a.f)+c.crossA;const rawT=CL.fmt(raw);let x=x2+wa+46;
  const z=Math.min(big,fitT(ctx,'→ '+rawT+' → '+CL.fmt(c.f),790-x,big,12*k,800));const red=c.crossC!==c.nC;
  txt(ctx,'→ '+rawT,x,cy,{s:z,w:700,c:P['cv-soft'],b:'middle'});ctx.font='700 '+z+'px '+FONT;x+=ctx.measureText('→ '+rawT).width+14;
  txt(ctx,'→ '+CL.fmt(c.f),x,cy,{s:z,w:800,c:P['s3'],b:'middle'});
  const note=red?'Crisscross, then reduce '+c.crossC+':'+c.crossA+' to '+c.nC+':'+c.nA:'Crisscross the charge numbers; a subscript of 1 is not written';if(k<1.5)txt(ctx,note,400,y0+66,{s:12*k,c:P['cv-soft'],a:'center'});}
function drawLattice(sim,ctx,k){const P=PAL,c=cmpd(sim.p);const s=0.2;const rc=c.rc*s,ra=c.ra*s;const one=c.nC===c.nA;
  if(sim.p.d3&&atLeast('honors')){if(one){draw3D(sim,ctx,k,c);return;}txt(ctx,'The 3D view shows rock-salt (1 : 1) crystals. Showing the 2D sketch.',400,438,{s:12*k,c:P['s4'],a:'center'});}
  const T=50,B=360,L=20,R=780;const ions=[];
  if(one){const d=rc+ra;const cols=Math.floor((R-L)/d),rows=Math.floor((B-T)/d);const ox=L+((R-L)-(cols-1)*d)/2,oy=T+((B-T)-(rows-1)*d)/2;
    for(let i=0;i<cols;i++)for(let j=0;j<rows;j++)ions.push({x:ox+i*d,y:oy+j*d,c:(i+j)%2===0,i,j});}
  else{const gridC=c.nC>c.nA;const rg=gridC?rc:ra,ri=gridC?ra:rc;const f=(gridC?c.nA:c.nC)/(gridC?c.nC:c.nA);const a=Math.max(2*rg,Math.SQRT2*(rg+ri));
    const cols=Math.floor((R-L)/a)+1,rows=Math.floor((B-T)/a)+1;const ox=L+((R-L)-(cols-1)*a)/2,oy=T+((B-T)-(rows-1)*a)/2;
    for(let i=0;i<cols;i++)for(let j=0;j<rows;j++)ions.push({x:ox+i*a,y:oy+j*a,c:gridC,i,j});
    let idx=0;for(let j=0;j<rows-1;j++)for(let i=0;i<cols-1;i++){const fill=Math.floor((idx+1)*f+1e-9)>Math.floor(idx*f+1e-9);idx++;if(fill)ions.push({x:ox+(i+0.5)*a,y:oy+(j+0.5)*a,c:!gridC,i:i+0.5,j:j+0.5,inter:true});}}
  // formula unit: the cation nearest the middle plus nearest anions/cations to complete the ratio
  const mid={x:400,y:(T+B)/2};const byD=(p)=>(q)=>Math.hypot(q.x-p.x,q.y-p.y);const cs=ions.filter(q=>q.c).sort((u,v)=>byD(mid)(u)-byD(mid)(v));const c0=cs[0];
  const unit=new Set(cs.slice().sort((u,v)=>byD(c0)(u)-byD(c0)(v)).slice(0,c.nC));const as=ions.filter(q=>!q.c).sort((u,v)=>{const du=Math.min(...[...unit].map(w=>byD(w)(u))),dv=Math.min(...[...unit].map(w=>byD(w)(v)));return du-dv;});as.slice(0,c.nA).forEach(q=>unit.add(q));
  ions.sort((u,v)=>(u.inter?1:0)-(v.inter?1:0));
  ions.forEach(q=>{const r=q.c?rc:ra;const col=colFor(c,q.c?'c':'a');CL.drawAtom(ctx,q.x,q.y,r,q.c?c.m.f:c.a.f,{color:col,label:r>=12*k*0.9?(q.c?c.m.f:c.a.f):'',s:Math.max(12*k*0.9,r*0.7),alpha:unit.has(q)?1:0.8});});
  [...unit].forEach(q=>{const r=q.c?rc:ra;ctx.strokeStyle=P['s4'];ctx.lineWidth=3;ctx.beginPath();ctx.arc(q.x,q.y,r+3,0,6.29);ctx.stroke();});
  txt(ctx,(one?'Rock-salt layer':'Flat sketch')+' of '+CL.fmt(c.f)+': ions to scale',400,26,{s:fitT(ctx,'Flat sketch of '+CL.fmt(c.f)+': ions to scale',780,15*k,12*k,700),w:700,a:'center'});
  const lg=[{l:CL.fmt(c.m.f,c.m.q)+' '+c.rc+' pm',col:colFor(c,'c')},{l:CL.fmt(c.a.f,c.a.q)+' '+c.ra+' pm',col:colFor(c,'a')},{l:'one formula unit: '+CL.fmt(c.f),col:null}];
  let x=20;lg.forEach(it=>{const y=394;if(it.col){CL.drawAtom(ctx,x+10,y,10,'',{color:it.col,label:''});}else{ctx.strokeStyle=P['s4'];ctx.lineWidth=3;ctx.beginPath();ctx.arc(x+10,y,10,0,6.29);ctx.stroke();}
    const z=fitT(ctx,it.l,240,13*k,12*k,600);txt(ctx,it.l,x+26,y+1,{s:z,w:600,b:'middle'});ctx.font='600 '+z+'px '+FONT;x+=ctx.measureText(it.l).width+58;});
  if(k<1.4)txt(ctx,one?'Each ion touches four of the opposite charge in this layer (six in 3D).':'Ratio kept at '+c.nC+' : '+c.nA+'. Real crystals are 3D, so this is a sketch.',400,430,{s:12*k,c:P['cv-soft'],a:'center'});}
function draw3D(sim,ctx,k,c){const P=PAL,D=105,sc=D/(c.rc+c.ra),rc=c.rc*sc*0.55,ra=c.ra*sc*0.55;const a=sim.st.rot,b=0.5;const pts=[];
  for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++)for(let l=-1;l<=1;l++){const cat=((i+j+l)%2+2)%2===0;const x=i*D,y=j*D,z=l*D;const x1=x*Math.cos(a)+z*Math.sin(a),z1=-x*Math.sin(a)+z*Math.cos(a);const y1=y*Math.cos(b)-z1*Math.sin(b),z2=y*Math.sin(b)+z1*Math.cos(b);pts.push({x:400+x1,y:232+y1,z:z2,cat});}
  pts.sort((u,v)=>u.z-v.z);pts.forEach(p=>{const r=(p.cat?rc:ra)*(1+p.z/700);CL.drawAtom(ctx,p.x,p.y,r,p.cat?c.m.f:c.a.f,{color:colFor(c,p.cat?'c':'a'),label:r>=12*k*0.9?(p.cat?c.m.f:c.a.f):'',s:Math.max(12*k*0.9,r*0.6)});});
  const t1='Rock-salt structure of '+CL.fmt(c.f)+': each ion has 6 neighbors of the opposite charge';txt(ctx,t1,400,22,{s:fitT(ctx,t1,780,14*k,12*k,700),w:700,a:'center'});
  txt(ctx,'Ions drawn at 55% of their size so you can see inside',400,440,{s:12*k,c:P['cv-soft'],a:'center'});}
function drawEnergy(sim,ctx,k){const P=PAL,c=cmpd(sim.p);const s=0.55;const rc=c.rc*s,ra=c.ra*s;const cx=60+rc,ax=cx+rc+ra,cy=170;
  ionBall(ctx,cx,cy,rc,c.m.f,c.m.q,k,colFor(c,'c'));ionBall(ctx,ax,cy,ra,c.a.f,c.a.q,k,colFor(c,'a'));
  const yb=cy+Math.max(rc,ra)+24;ctx.strokeStyle=P['cv-ink'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(cx,yb-6);ctx.lineTo(cx,yb+6);ctx.moveTo(ax,yb-6);ctx.lineTo(ax,yb+6);ctx.moveTo(cx,yb);ctx.lineTo(ax,yb);ctx.stroke();
  txt(ctx,'d = '+c.rc+' + '+c.ra+' = '+c.d+' pm',(cx+ax)/2,yb+22,{s:fitT(ctx,'d = '+c.rc+' + '+c.ra+' = '+c.d+' pm',360,13*k,12*k,700),w:700,a:'center'});
  const eq='|q₊q₋| / d = '+c.qq+' / '+(c.d/100).toFixed(2)+' = '+c.cf.toFixed(2);txt(ctx,eq,(cx+ax)/2,yb+48+(k-1)*12,{s:fitT(ctx,eq,380,13*k,12*k,600),c:P['cv-soft'],a:'center'});
  txt(ctx,'Coulomb’s law for two ions in contact',20,28,{s:fitT(ctx,'Coulomb’s law for two ions in contact',380,14*k,12*k,700),w:700});
  // bars: measured lattice energies
  const refs=['KCl','NaCl','NaF','LiF','CaO','MgO'];if(!refs.includes(c.f))refs.push(c.f);const L=430,W=350,top=56,rh=Math.min(46,330/refs.length);const max=4200;
  txt(ctx,'Lattice energy (kJ/mol)',L,32,{s:fitT(ctx,'Lattice energy (kJ/mol)',350,14*k,12*k,700),w:700});
  refs.forEach((f,i)=>{const y=top+i*rh;const U=LAT[f]?LAT[f][0]:null;const me=f===c.f;const lw=k>1.3?92:70;
    txt(ctx,CL.fmt(f),L,y+rh/2,{s:Math.min(13*k,rh*0.8),w:me?800:600,b:'middle',c:me?P['s4']:P['cv-ink']});
    if(U===null){txt(ctx,'no data',L+lw,y+rh/2,{s:12*k,c:P['cv-soft'],b:'middle'});return;}const w=(W-lw)*Math.min(1,U/max);rr(ctx,L+lw,y+4,w,rh-8,4);ctx.fillStyle=me?'#c27a00':'#2f6fbf';ctx.fill();
    const lab=U>max?U+' →':String(U);const z=Math.min(12*k,rh*0.7);ctx.font='700 '+z+'px '+FONT;const tw=ctx.measureText(lab).width;
    if(w>tw+10)txt(ctx,lab,L+lw+w-6,y+rh/2+1,{s:z,w:700,c:'#fff',a:'right',b:'middle'});else txt(ctx,lab,L+lw+w+6,y+rh/2+1,{s:z,w:700,b:'middle'});});
  const mpT=c.lat?'Melting point of '+CL.fmt(c.f)+': '+c.lat[1]+' °C':'No measured lattice energy listed for '+CL.fmt(c.f);txt(ctx,mpT,400,432,{s:fitT(ctx,mpT,760,13*k,12*k,700),w:700,a:'center',c:P['cv-soft']});}
BioLab.register(SIM);
})();
