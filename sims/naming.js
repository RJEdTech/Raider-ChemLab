(function(){
'use strict';
const {clamp,rng,rr,txt,pill,atLeast,PAL,FONT,lvText}=BioLab.h;
const CL=ChemLab;
/* Naming trainer: RJ's nomenclature flowchart, both directions, with diagnosis of the step that went wrong.
   The naming model below (cations, anions, molecules, acids, hydrates, name and formula builders, answer checking)
   is plain data plus functions, so every name the page shows comes from the same rules students learn. */
const LV={bio:0,honors:1,ap:2};
const lvOK=l=>LV[l||'bio']<=LV[BioLab.level];
const ROMAN=['','I','II','III','IV','V','VI','VII'];
const PREF=['','mono','di','tri','tetra','penta','hexa','hepta','octa','nona','deca'];
const elName=s=>CL.el(s).name.toLowerCase();
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* ---------- ions ---------- */
// fixed-charge (Type I) cations
const CAT1=[['Li',1,'bio'],['Na',1,'bio'],['K',1,'bio'],['Rb',1,'honors'],['Cs',1,'honors'],['Mg',2,'bio'],['Ca',2,'bio'],['Sr',2,'bio'],['Ba',2,'bio'],
  ['Al',3,'bio'],['Zn',2,'bio'],['Ag',1,'bio'],['Cd',2,'honors']].map(([f,q,lvl])=>({f,q,lvl,name:elName(f),type:1}));
const NH4={f:'NH4',q:1,lvl:'bio',name:'ammonium',type:1,poly:true};
const HG2={f:'Hg2',q:2,lvl:'honors',name:'mercury(I)',type:2,poly:true,base:'mercury',roman:'I'};
// variable-charge (Type II) cations: [symbol, charge, allowed anions ('mono' = monatomic only, 'hal' = Cl/Br, 'ox' = oxide only), level]
const TMION=[['Fe',2,'','bio'],['Fe',3,'nofe3','bio'],['Cu',1,'mono','bio'],['Cu',2,'nocu2','bio'],['Co',2,'','bio'],['Co',3,'mono','honors'],['Ni',2,'','bio'],
  ['Cr',2,'mono','honors'],['Cr',3,'','bio'],['Pb',2,'','bio'],['Pb',4,'four','bio'],['Sn',2,'','bio'],['Sn',4,'four','bio'],['Mn',2,'','honors'],['Mn',4,'ox','honors'],
  ['Hg',2,'','honors'],['Au',1,'hal','honors'],['Au',3,'hal','honors'],['Ti',4,'ti','ap']];
const CAT2=TMION.map(([f,q,rule,lvl])=>({f,q,rule,lvl,name:elName(f),type:2,roman:ROMAN[q],base:elName(f)}));
CAT2.forEach(c=>c.name=c.base+'('+c.roman+')');
const VARMETALS=['Fe','Cu','Co','Ni','Cr','Pb','Sn','Mn','Hg','Au','Ti'];
const MONO=[['F',-1,'bio'],['Cl',-1,'bio'],['Br',-1,'bio'],['I',-1,'bio'],['O',-2,'bio'],['S',-2,'bio'],['N',-3,'bio'],['P',-3,'bio'],['Se',-2,'honors'],['H',-1,'honors']]
  .map(([f,q,lvl])=>({f,q,lvl,name:CL.anionName[f],root:CL.anionName[f].replace(/ide$/,''),poly:false}));
// polyatomic ions: name, formula, charge, level, oxyanion family, acid name
const PA=[
  ['hydroxide','OH',-1,'bio'],['nitrate','NO3',-1,'bio','N'],['nitrite','NO2',-1,'bio','N'],['acetate','C2H3O2',-1,'bio'],['hydrogen carbonate','HCO3',-1,'bio'],
  ['chlorate','ClO3',-1,'bio','Cl'],['cyanide','CN',-1,'bio'],['permanganate','MnO4',-1,'bio'],
  ['sulfate','SO4',-2,'bio','S'],['sulfite','SO3',-2,'bio','S'],['carbonate','CO3',-2,'bio'],['chromate','CrO4',-2,'bio','Cr'],['dichromate','Cr2O7',-2,'bio','Cr'],
  ['phosphate','PO4',-3,'bio','P'],
  ['hydrogen sulfate','HSO4',-1,'honors'],['dihydrogen phosphate','H2PO4',-1,'honors'],['perchlorate','ClO4',-1,'honors','Cl'],['chlorite','ClO2',-1,'honors','Cl'],
  ['hypochlorite','ClO',-1,'honors','Cl'],['thiocyanate','SCN',-1,'honors'],['hydrogen phosphate','HPO4',-2,'honors'],['oxalate','C2O4',-2,'honors'],['peroxide','O2',-2,'honors'],
  ['thiosulfate','S2O3',-2,'honors'],['phosphite','PO3',-3,'honors','P'],
  ['perbromate','BrO4',-1,'ap','Br'],['bromate','BrO3',-1,'ap','Br'],['bromite','BrO2',-1,'ap','Br'],['hypobromite','BrO',-1,'ap','Br'],
  ['periodate','IO4',-1,'ap','I'],['iodate','IO3',-1,'ap','I'],['iodite','IO2',-1,'ap','I'],['hypoiodite','IO',-1,'ap','I'],
  ['hydrogen sulfite','HSO3',-1,'ap'],['arsenate','AsO4',-3,'ap']
].map(([name,f,q,lvl,fam])=>({name,f,q,lvl,fam:fam||null,poly:true,ox:/O/.test(f)}));
const PAby={};PA.forEach(a=>PAby[a.f]=a);
/* plausible mix-ups for each ion, used for multiple-choice options */
const SIMILAR={OH:['oxide','hydride','peroxide'],CN:['cyanate','nitride','carbide'],C2H3O2:['carbonate','acetite','oxalate'],MnO4:['manganate','permanganite','manganese'],
  HCO3:['carbonate','hydrogen carbonite','hydroxide'],CO3:['carbonite','hydrogen carbonate','carbide'],SCN:['cyanide','thiocyanite','thiosulfate'],C2O4:['carbonate','acetate','oxalite'],
  O2:['oxide','dioxide','hydroxide'],S2O3:['sulfate','sulfite','thiosulfite'],CrO4:['dichromate','chromite','chromide'],Cr2O7:['chromate','dichromite','dichromide'],
  HSO4:['sulfate','hydrogen sulfite','hydrosulfate'],HSO3:['sulfite','hydrogen sulfate','hydrosulfite'],H2PO4:['hydrogen phosphate','phosphate','dihydrogen phosphite'],HPO4:['dihydrogen phosphate','phosphate','hydrogen phosphite'],
  PO4:['phosphite','phosphide','hydrogen phosphate'],PO3:['phosphate','phosphide','hypophosphite'],AsO4:['arsenite','arsenide','phosphate'],SO4:['sulfite','sulfide','thiosulfate'],SO3:['sulfate','sulfide','thiosulfate'],
  NO3:['nitrite','nitride','ammonium'],NO2:['nitrate','nitride','dioxide'],NH4:['ammonia','nitride','hydronium'],H3O:['hydroxide','ammonium','hydride'],Hg2:['mercury(II)','dimercury','mercury']};
const ALTNAME={'hydrogen carbonate':'bicarbonate','hydrogen sulfate':'bisulfate','hydrogen sulfite':'bisulfite'};
const POSIONS=[{name:'ammonium',f:'NH4',q:1,lvl:'bio',poly:true},{name:'hydronium',f:'H3O',q:1,lvl:'honors',poly:true},{name:'mercury(I)',f:'Hg2',q:2,lvl:'honors',poly:true}];
// oxyanion families: [element, [[name, O count]] from most O to least]
const FAMILY={Cl:['per','','','hypo'],Br:['per','','','hypo'],I:['per','','','hypo']};
function familyOf(an){if(!an||!an.fam)return null;const fam=an.fam;return PA.filter(a=>a.fam===fam&&!/^H/.test(a.f)).sort((a,b)=>CL.parse(b.f).O-CL.parse(a.f).O);}
// acid names from the anion
const ACIDROOT={sulfide:'sulfur',sulfate:'sulfur',sulfite:'sulfur',phosphate:'phosphor',phosphite:'phosphor',cyanide:'cyan'};
function acidName(an){const n=an.name;
  if(/ide$/.test(n)){const root=ACIDROOT[n]||n.replace(/ide$/,'');return 'hydro'+root+'ic acid';}
  if(/ate$/.test(n)){const root=ACIDROOT[n]||n.replace(/ate$/,'');return root+'ic acid';}
  if(/ite$/.test(n)){const root=ACIDROOT[n]||n.replace(/ite$/,'');return root+'ous acid';}
  return null;}
const ACIDS=[ // anion formula, level
  ['F','bio'],['Cl','bio'],['Br','bio'],['I','bio'],['S','bio'],['CN','honors'],['Se','ap'],
  ['NO3','bio'],['NO2','bio'],['SO4','bio'],['SO3','bio'],['PO4','bio'],['CO3','bio'],['C2H3O2','bio'],['ClO3','bio'],
  ['ClO4','honors'],['ClO2','honors'],['ClO','honors'],['PO3','honors'],['CrO4','honors'],['C2O4','honors'],
  ['MnO4','ap'],['Cr2O7','ap'],['BrO4','ap'],['BrO3','ap'],['BrO2','ap'],['BrO','ap'],['IO4','ap'],['IO3','ap'],['IO2','ap'],['IO','ap']]
  .map(([f,lvl])=>({an:anionByF(f),lvl}));
function anionByF(f){return PAby[f]||MONO.find(a=>a.f===f);}
/* ---------- molecules (real binary molecular compounds) ---------- */
const MOLS=[['C',1,'O',1,'bio'],['C',1,'O',2,'bio'],['C',1,'S',2,'bio'],['C',1,'Cl',4,'bio'],['Si',1,'O',2,'bio'],['Si',1,'Cl',4,'bio'],['N',1,'O',1,'bio'],['N',1,'O',2,'bio'],
  ['N',2,'O',1,'bio'],['N',2,'O',3,'bio'],['N',2,'O',4,'bio'],['N',2,'O',5,'bio'],['N',1,'Cl',3,'bio'],['P',1,'Cl',3,'bio'],['P',1,'Cl',5,'bio'],['P',2,'O',5,'bio'],
  ['P',4,'O',10,'bio'],['S',1,'O',2,'bio'],['S',1,'O',3,'bio'],['S',1,'F',6,'bio'],['B',1,'F',3,'bio'],['Cl',1,'F',3,'bio'],['I',1,'Cl',1,'bio'],['Xe',1,'F',4,'bio'],
  ['O',1,'F',2,'honors'],['P',4,'O',6,'honors'],['S',2,'Cl',2,'honors'],['Cl',2,'O',7,'honors'],['Br',1,'F',5,'honors'],['I',1,'F',7,'honors'],['S',1,'F',4,'honors'],
  ['P',4,'S',3,'honors'],['Cl',1,'O',2,'honors'],['Cl',2,'O',1,'honors'],['N',1,'F',3,'honors'],['C',1,'Br',4,'honors'],['Xe',1,'O',3,'ap'],['Xe',1,'F',6,'ap'],
  ['B',2,'H',6,'ap'],['Se',1,'O',2,'ap'],['As',2,'O',3,'ap'],['P',1,'Br',3,'honors'],['B',1,'Cl',3,'honors'],['Si',1,'F',4,'honors']]
  .map(([a,na,b,nb,lvl])=>({a,na,b,nb,lvl}));
const COMMON=[{formula:'H2O',name:'water',sys:'dihydrogen monoxide'},{formula:'NH3',name:'ammonia',sys:'nitrogen trihydride'},{formula:'CH4',name:'methane',sys:'carbon tetrahydride'},{formula:'H2O2',name:'hydrogen peroxide',sys:'dihydrogen dioxide'}];
/* ---------- hydrates (real ones) ---------- */
const HYD=[['Cu',2,'SO4',5,'bio'],['Mg',2,'SO4',7,'bio'],['Ca',2,'SO4',2,'bio'],['Ba',2,'Cl',2,'bio'],['Co',2,'Cl',6,'bio'],['Na',1,'CO3',10,'bio'],['Fe',3,'Cl',6,'bio'],
  ['Cu',2,'Cl',2,'bio'],['Mg',2,'Cl',6,'bio'],['Na',1,'SO4',10,'bio'],['Zn',2,'SO4',7,'bio'],['Ni',2,'Cl',6,'bio'],['Ba',2,'OH',8,'bio'],['Fe',2,'SO4',7,'bio'],
  ['Ca',2,'Cl',2,'bio'],['Li',1,'Cl',1,'bio'],['Na',1,'S2O3',5,'bio'],['Sr',2,'Cl',6,'bio'],['Na',1,'C2H3O2',3,'bio'],['Cu',2,'NO3',3,'bio']];
const HYDPRE=['','mono','di','tri','tetra','penta','hexa','hepta','octa','nona','deca'];

/* ---------- compound builders ---------- */
function prefixed(p,name){if(!p)return name;if(/^o/.test(name)&&/[ao]$/.test(p))return p.slice(0,-1)+name;return p+name;}
function ionicCounts(cat,an){const g=(a,b)=>b?g(b,a%b):a;const a=Math.abs(cat.q),b=Math.abs(an.q),d=g(a,b);return {nC:b/d,nA:a/d};}
function mkIonic(cat,an,hyd){const {nC,nA}=ionicCounts(cat,an);let f=CL.ionicFormula({f:cat.f,q:cat.q},{f:an.f,q:an.q});
  if(hyd)f+='*'+(hyd>1?hyd:'')+'H2O';
  let name=cat.name+' '+an.name;if(hyd)name+=' '+HYDPRE[hyd]+'hydrate';
  return {kind:'ionic',cat,an,hyd:hyd||0,nC,nA,formula:f,name,key:f};}
function mkMol(m){const name=(m.na>1?PREF[m.na]:'')+elName(m.a)+' '+prefixed(PREF[m.nb],CL.anionName[m.b]);
  const f=m.a+(m.na>1?m.na:'')+m.b+(m.nb>1?m.nb:'');return {kind:'mol',m,formula:f,name,key:f};}
function mkAcid(an){const n=Math.abs(an.q);const f='H'+(n>1?n:'')+an.f;return {kind:'acid',an,formula:f,name:acidName(an),binary:!an.poly,key:f};}
function mkCommon(c){return {kind:'common',c,formula:c.formula,name:c.name,key:c.formula};}
function catBySym(f,q){if(f==='NH4')return NH4;if(f==='Hg2')return HG2;return CAT1.find(c=>c.f===f)||CAT2.find(c=>c.f===f&&c.q===q);}
function hydrate(h){return mkIonic(catBySym(h[0],h[1]),anionByF(h[2]),h[3]);}
/* which anions a cation may pair with (keeps the generator to compounds that exist or are standard worksheet items) */
function allowed(cat,an){const f=an.f;
  if(an.f==='H')return ['Li','Na','K','Rb','Cs','Mg','Ca','Sr','Ba'].includes(cat.f);
  if(an.f==='O2')return ['Li','Na','K','Rb','Cs','Ca','Sr','Ba'].includes(cat.f);
  if(['N','P'].includes(f))return cat.type===1&&!cat.poly&&!['Ag','Cd'].includes(cat.f);
  if(f==='Se')return cat.type===1&&!cat.poly;
  if(cat.f==='NH4')return !['O','N','P','H','O2'].includes(f);
  if(cat.f==='Cr'&&['CrO4','Cr2O7'].includes(f))return false;if(cat.f==='Mn'&&f==='MnO4')return false;
  if(cat.f==='Al'&&['CO3','SO3','HCO3','CrO4','Cr2O7','SO4H'].includes(f))return false;
  if(cat.f==='Ag'&&['OH','HCO3','O2'].includes(f))return false;
  if(cat.type===2){const r=cat.rule;
    if(r==='mono'&&an.poly)return f==='CN'&&cat.f==='Cu';if(cat.f==='Co'&&cat.q===3&&['I','S','Br'].includes(f))return false;if(cat.f==='Cu'&&cat.q===1&&f==='F')return false;
    if(r==='four')return ['O','F','Cl','Br'].includes(f);
    if(r==='ox')return f==='O';if(r==='hal')return ['Cl','Br'].includes(f);if(r==='ti')return ['O','Cl'].includes(f);
    if(r==='nofe3'&&['I','CO3','SO3','HCO3','S','CN'].includes(f))return false;
    if(r==='nocu2'&&['I','CN','SCN'].includes(f))return false;
    if(['HCO3','HSO4','H2PO4','HPO4','HSO3','MnO4','O2','SCN','S2O3','C2O4','AsO4'].includes(f)&&!['Fe','Co','Ni','Cu','Mn','Pb','Sn','Hg'].includes(cat.f))return false;}
  if(cat.f==='Hg2')return ['Cl','Br','I','NO3','SO4','C2H3O2'].includes(f);
  return true;}

/* ---------- the flowchart ---------- */
const NODES={
  q1:{x:400,y:120,w:400,h:44,t:'Is the first part a metal, or the ammonium ion NH₄⁺?',s:'Metal or NH₄⁺ first?'},
  q3:{x:205,y:200,w:376,h:46,t:'Can this metal have more than one charge? (most transition metals, Sn, Pb)',s:'More than one charge?'},
  t1:{x:108,y:284,w:182,h:54,t:'No: write the metal’s name (sodium, zinc)',s:'Metal’s name'},
  t2:{x:302,y:284,w:182,h:54,t:'Yes: add its charge as a Roman numeral, iron(III)',s:'Roman numeral'},
  q4:{x:205,y:360,w:376,h:44,t:'Is the negative ion polyatomic (a group of atoms)?',s:'Polyatomic ion?'},
  mon:{x:108,y:440,w:182,h:54,t:'No: root of the nonmetal + -ide (oxide)',s:'-ide ending'},
  poly:{x:302,y:440,w:182,h:54,t:'Yes: use the ion’s name (sulfate, nitrate)',s:'Ion’s name'},
  bal:{x:205,y:508,w:376,h:40,t:'Writing the formula? Charges must add to zero',s:'Charges add to 0'},
  hyd:{x:205,y:558,w:376,h:40,t:'Hydrate (·xH₂O)? Add a prefix + hydrate',s:'+ prefix + hydrate',lvl:'honors'},
  q2:{x:600,y:200,w:376,h:46,t:'Does it start with H, dissolved in water (aq)?',s:'H first, in water?'},
  mol:{x:504,y:350,w:184,h:156,t:'No: molecular (two nonmetals). Prefixes give each count. Skip mono- on the first element. End with -ide.',s:'Molecular: use prefixes'},
  q5:{x:694,y:284,w:180,h:54,t:'Yes, an acid. Is there oxygen in the anion?',s:'Acid: any oxygen?'},
  bin:{x:680,y:368,w:150,h:54,t:'No: hydro- + root + -ic acid',s:'hydro-…-ic'},
  oxy:{x:694,y:454,w:180,h:58,t:'Yes: -ate becomes -ic acid, -ite becomes -ous acid',s:'-ate → -ic, -ite → -ous'}
};
const PREFBOX={x:412,y:492,w:376,h:86};
function fr(){const ids=[...arguments];let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;ids.forEach(id=>{const n=NODES[id];x0=Math.min(x0,n.x-n.w/2);y0=Math.min(y0,n.y-n.h/2);x1=Math.max(x1,n.x+n.w/2);y1=Math.max(y1,n.y+n.h/2);});return [x0-6,y0-6,x1-x0+12,y1-y0+12];}
const EDGES=[['q1','q3','yes: ionic'],['q1','q2','no'],['q3','t1','no'],['q3','t2','yes'],['t1','q4',''],['t2','q4',''],['q4','mon','no'],['q4','poly','yes'],
  ['mon','bal',''],['poly','bal',''],['bal','hyd',''],['q2','mol','no'],['q2','q5','yes'],['q5','bin','no'],['q5','oxy','yes']];
function pathFor(c,dir){const p=[];
  if(c.kind==='ionic'){p.push('q1','q3',c.cat.type===2?'t2':'t1','q4',c.an.poly?'poly':'mon');if(dir==='n2f')p.push('bal');if(c.hyd){if(dir!=='n2f')p.push('bal');p.push('hyd');}}
  else if(c.kind==='acid'){p.push('q1','q2','q5',c.binary?'bin':'oxy');}
  else{p.push('q1','q2','mol');}
  return p;}
function edgeOn(path,a,b){const i=path.indexOf(a),j=path.indexOf(b);return i>=0&&j===i+1||(a==='bal'&&b==='hyd'&&path.includes('hyd'))||((a==='mon'||a==='poly')&&b==='bal'&&path.includes('bal')&&path.includes(a));}

/* ---------- worked steps (the hint sequence) ---------- */
const H=s=>CL.html(s);
function chargeTxt(q){return Math.abs(q)+(q>0?'+':'−');}
function ionHtml(f,q){return CL.html(f,q);}
function steps(c,dir){const out=[];
  if(c.kind==='ionic'){const cat=c.cat,an=c.an;const cf=cat.poly?ionHtml(cat.f,cat.q):cat.f;
    out.push({n:'q1',h:cat.poly?`${cat.f==='NH4'?'NH<sub>4</sub><sup>+</sup> is the ammonium ion':'Hg<sub>2</sub><sup>2+</sup> is the mercury(I) ion'}, so this is ionic. Ionic names never use prefixes like di- or tri-.`:`${elName(cat.f).replace(/^./,m=>m.toUpperCase())} (${cat.f}) is a metal, so this is an <b>ionic</b> compound. Ionic names never use prefixes like di- or tri-.`});
    if(cat.type===2){if(dir==='n2f')out.push({n:'t2',h:`The Roman numeral (${cat.roman}) is the charge: ${cat.base} here is ${ionHtml(cat.f==='Hg2'?'Hg2':cat.f,cat.q)}.`});
      else{const tot=c.nA*Math.abs(an.q);out.push({n:'q3',h:`${cat.base.replace(/^./,m=>m.toUpperCase())} can form more than one ion (${cat.f==='Hg2'?'Hg<sub>2</sub><sup>2+</sup> or Hg<sup>2+</sup>':varCharges(cat.f)}), so the name needs a <b>Roman numeral</b>.`});
        out.push({n:'t2',h:cat.f==='Hg2'?'Hg<sub>2</sub><sup>2+</sup> is two mercury atoms sharing a 2+ charge, so each mercury is +1: mercury(I).':`Work out its charge from the anion: ${c.nA} × ${ionHtml(an.f,an.q)} = ${tot}−. ${c.nC===1?'One':c.nC} ${cat.f} must add up to ${tot}+, so each is ${cat.q}+ → <b>${cat.name}</b>.${c.nC>1||c.nA>1?' The Roman numeral is the charge, not a subscript.':''}`});}}
    else out.push({n:'q3',h:cat.poly?'Ammonium always has a 1+ charge, so there is no Roman numeral.':`${elName(cat.f).replace(/^./,m=>m.toUpperCase())} only ever forms ${ionHtml(cat.f,cat.q)}, so there is <b>no Roman numeral</b>: just “${cat.name}”.`});
    if(an.poly)out.push({n:'poly',h:`${ionHtml(an.f,an.q)} is a polyatomic ion: <b>${an.name}</b>. Memorize these; the name does not change.`});
    else out.push({n:'mon',h:`${ionHtml(an.f,an.q)} is a single atom, so take the root of ${elName(an.f)} and add -ide: <b>${an.name}</b>.`});
    if(dir==='n2f')out.push({n:'bal',h:`Balance the charges: ${c.nC} × ${ionHtml(cat.f,cat.q)} = ${c.nC*cat.q}+ and ${c.nA} × ${ionHtml(an.f,an.q)} = ${c.nA*Math.abs(an.q)}−. ${c.nC===1&&c.nA===1?'One of each.':'Crisscross the charge numbers and reduce if you can.'}${an.poly&&c.nA>1?' Put the polyatomic ion in parentheses before its subscript.':''}${cat.poly&&c.nC>1?' Ammonium goes in parentheses too: (NH<sub>4</sub>)<sub>'+c.nC+'</sub>.':''}`});
    if(c.hyd)out.push({n:'hyd',h:`${dir==='n2f'?'':'The ·'+(c.hyd>1?c.hyd:'')+'H<sub>2</sub>O part means a hydrate. '}${c.hyd} water${c.hyd>1?'s':''} → <b>${HYDPRE[c.hyd]}hydrate</b>, written after a dot: ·${c.hyd>1?c.hyd:''}H<sub>2</sub>O.`});}
  else if(c.kind==='acid'){const an=c.an;
    out.push({n:'q1',h:'H is not a metal, so this is not an ionic name.'});
    out.push({n:'q2',h:`It starts with H and is dissolved in water (aq), so it is an <b>acid</b>. Its anion is ${ionHtml(an.f,an.q)}, ${an.name}.`});
    out.push({n:'q5',h:an.poly&&an.ox?`${an.name.replace(/^./,m=>m.toUpperCase())} contains oxygen: an oxyacid, no hydro- prefix.`:`${an.name.replace(/^./,m=>m.toUpperCase())} has no oxygen: a binary acid (CN<sup>−</sup> counts as binary too).`});
    out.push({n:c.binary?'bin':'oxy',h:c.binary?`hydro- + ${(ACIDROOT[an.name]||an.name.replace(/ide$/,''))} + -ic acid → <b>${c.name}</b>.`:`${an.name} ends in ${/ate$/.test(an.name)?'-ate, so it becomes -ic':'-ite, so it becomes -ous'} → <b>${c.name}</b>.`+(dir==='n2f'?` It needs ${Math.abs(an.q)} H<sup>+</sup> to cancel the ${chargeTxt(an.q)} charge: ${H(c.formula)}.`:'')});}
  else if(c.kind==='mol'){const m=c.m;
    out.push({n:'q1',h:`${elName(m.a).replace(/^./,x=>x.toUpperCase())} is a nonmetal, so this is not ionic.`});
    out.push({n:'q2',h:m.a==='H'?'It starts with H but is not an acid in water here.':'It does not start with H, so it is not an acid.'});
    out.push({n:'mol',h:`Two nonmetals: a <b>molecular</b> compound. ${m.na>1?PREF[m.na]+'- for '+m.na+' '+elName(m.a):'One '+elName(m.a)+' gets no prefix'}; ${PREF[m.nb]}- for ${m.nb} ${elName(m.b)}, ending in -ide → <b>${c.name}</b>.${dir==='n2f'?' The prefixes are the subscripts. There are no charges to crisscross.':''}`});}
  else{out.push({n:'q1',h:'No metal, so not ionic.'});out.push({n:'q2',h:'Not an acid.'});out.push({n:'mol',h:`This one has a common name everyone uses: <b>${c.name}</b> (${H(c.formula)}). Memorize it.`});}
  return out;}
function varCharges(f){const q=TMION.filter(t=>t[0]===f).map(t=>t[1]);const extra={Fe:[2,3],Cu:[1,2],Co:[2,3],Ni:[2,3],Cr:[2,3],Pb:[2,4],Sn:[2,4],Mn:[2,3,4,7],Hg:[1,2],Au:[1,3],Ti:[2,3,4]}[f]||q;
  return extra.map(x=>f+'<sup>'+x+'+</sup>').join(' or ');}

/* ---------- answer checking ---------- */
const cap=s=>String(s).replace(/^./,m=>m.toUpperCase());
function normName(s){return String(s||'').toLowerCase().replace(/[‐-―−]/g,'-').replace(/aluminium/g,'aluminum').replace(/sulph/g,'sulf').replace(/caesium/g,'cesium')
  .replace(/\s*\(\s*/g,'(').replace(/\s*\)\s*/g,') ').replace(/\s+/g,' ').replace(/ ions?$/,'').trim();}
function nameAlts(c){const base=normName(c.name),out=[base];
  Object.keys(ALTNAME).forEach(k=>{if(base.includes(k))out.push(base.replace(k,ALTNAME[k]));});
  out.slice().forEach(n=>{['mono','tetra','penta','hexa','hepta','deca'].forEach(p=>{const short=p.slice(0,-1)+'oxide';if(n.includes(short)&&!n.includes(p+'oxide'))out.push(n.replace(short,p+'oxide'));});
    if(n.includes('hydroiodic'))out.push(n.replace('hydroiodic','hydriodic'));});
  if(c.kind==='mol'&&c.formula==='N2O')out.push('nitrous oxide');
    return out;}
const SUBS='₀₁₂₃₄₅₆₇₈₉',SUPS='⁰¹²³⁴⁵⁶⁷⁸⁹';
function normFormula(s){return String(s||'').replace(/[₀-₉]/g,c=>SUBS.indexOf(c)).replace(/\((aq|s|l|g)\)/gi,'').replace(/\s+/g,'').replace(/[·•∙*.]/g,'*');}
function formulaAlts(c){const f=c.formula,out=[f];if(/C2H3O2/.test(f))out.push(f.replace(/C2H3O2/g,'CH3COO'));if(f==='HC2H3O2')out.push('CH3COOH');return out;}
function validFormula(s){if(!/^([A-Z][a-z]?\d*|\(|\)\d*|\*\d*)+$/.test(s))return false;const syms=s.match(/[A-Z][a-z]?/g)||[];return syms.every(x=>CL.bySym[x]);}
function sameCounts(a,b){const ka=Object.keys(a).filter(k=>a[k]),kb=Object.keys(b).filter(k=>b[k]);return ka.length===kb.length&&ka.every(k=>a[k]===b[k]);}
function scaleOf(a,b){const ks=Object.keys(b);if(!ks.length||!sameKeys(a,b))return 0;const r=a[ks[0]]/b[ks[0]];return ks.every(k=>Math.abs(a[k]/b[k]-r)<1e-9)?r:0;}
function sameKeys(a,b){const ka=Object.keys(a).sort().join(),kb=Object.keys(b).sort().join();return ka===kb;}
const NODE_SHORT={q1:'ionic or not',q3:'one charge or more',t1:'no Roman numeral',t2:'the Roman numeral',q4:'polyatomic or not',mon:'the -ide ending',poly:'the polyatomic ion',bal:'balancing charges',hyd:'the hydrate prefix',q2:'acid or not',mol:'molecular prefixes',q5:'oxygen or not',bin:'hydro-…-ic acid',oxy:'-ic and -ous acids',sym:'element symbols',order:'cation first'};
/* Returns {ok, node, msg, note} */
function checkName(c,input){const s=normName(input);if(!s)return {empty:true,msg:'Type a name first.'};
  const alts=nameAlts(c);if(alts.includes(s)){const note=s!==normName(c.name)&&/aoxide|ooxide/.test(s)?'Most textbooks drop the extra vowel: '+c.name+'.':'';return {ok:true,note};}
  const has=w=>s.includes(w);
  if(c.kind==='ionic'){const cat=c.cat,an=c.an;
    if(/(^|\s)(mono|di|tri|tetra|penta|hexa)/.test(s.replace(normName(an.name),'').replace(/\s\S*hydrate$/,'')))return {node:'q1',msg:`${c.formula.replace(/\*.*/,'')} is ionic (it has a metal${cat.poly?' or ammonium':''}), so it does not use prefixes like di- or tri-. The charges set the ratio.`};
    if(/acid/.test(s))return {node:'q2',msg:'Acids start with H. This compound starts with a metal, so it is ionic.'};
    const base=cat.poly?cat.f==='NH4'?'ammonium':'mercury':cat.base||cat.name;
    if(!s.startsWith(base))return {node:cat.type===2?'t2':'t1',msg:`Start with the cation’s name: ${cat.poly?cat.name:base}.`};
    const rest=s.slice(base.length);const rm=rest.match(/^\(([^)]*)\)/);
    if(cat.type===2){if(!rm)return {node:'q3',msg:`${base.replace(/^./,m=>m.toUpperCase())} can have more than one charge, so the name needs a Roman numeral for its charge: ${cat.name}.`};
      const r=rm[1].toUpperCase();if(/^\d+\+?$/.test(r))return {node:'t2',msg:`Use a Roman numeral, not a number: (${cat.roman}).`};
      if(r!==cat.roman){const sub=c.nC>1?c.nC:c.nA;return {node:'t2',msg:`The Roman numeral is the charge on each ${base} ion. ${c.nA} × ${chargeTxt(an.q)} = ${c.nA*Math.abs(an.q)}−, shared by ${c.nC} ${cat.f}, so each is ${cat.q}+ → (${cat.roman}).${ROMAN.indexOf(r)===sub?' It is not the subscript.':''}`};}}
    else if(rm&&!cat.poly)return {node:'q3',msg:`${base.replace(/^./,m=>m.toUpperCase())} only forms one ion, ${CL.fmt(cat.f,cat.q)}, so it gets no Roman numeral.`};
    const after=rest.replace(/^\([^)]*\)/,'').trim();const anPart=after.replace(/\s*\S*hydrate$/,'').trim();
    if(anPart!==normName(an.name)&&anPart!==(ALTNAME[an.name]||'#')){
      if(an.poly){const other=PA.find(a=>a.name===anPart);
        if(/ide$/.test(anPart))return {node:'q4',msg:`${CL.fmt(an.f,an.q)} is polyatomic (a group of atoms), so it keeps its ion name: ${an.name}, not an -ide name.`};
        if(other&&other.fam&&other.fam===an.fam)return {node:'poly',msg:`Close: ${other.name} is ${CL.fmt(other.f,other.q)}. ${CL.fmt(an.f,an.q)} has ${CL.parse(an.f).O} oxygens, so it is ${an.name}. (-ate has one more O than -ite.)`};
        return {node:'poly',msg:`${CL.fmt(an.f,an.q)} is the ${an.name} ion. Check your polyatomic ion list.`};}
      if(anPart===elName(an.f))return {node:'mon',msg:`A single-atom anion changes its ending to -ide: ${elName(an.f)} → ${an.name}.`};
      if(/(ate|ite)$/.test(anPart))return {node:'q4',msg:`${CL.fmt(an.f,an.q)} is one atom, not a polyatomic ion, so it ends in -ide: ${an.name}.`};
      return {node:'mon',msg:`${CL.fmt(an.f,an.q)} is ${an.name}: the root of ${elName(an.f)} plus -ide.`};}
    if(c.hyd){const hm=after.match(/(\S*)hydrate$/);if(!hm)return {node:'hyd',msg:`The ·${c.hyd>1?c.hyd:''}H₂O means it is a hydrate: add ${HYDPRE[c.hyd]}hydrate.`};
      if(hm[1]!==HYDPRE[c.hyd])return {node:'hyd',msg:`${c.hyd} waters is ${HYDPRE[c.hyd]}hydrate.`};}
    else if(/hydrate/.test(after))return {node:'hyd',msg:'There is no ·xH₂O, so it is not a hydrate.'};
    return {node:'q1',msg:'Check spelling and spacing against the flowchart.'};}
  if(c.kind==='acid'){const an=c.an;
    if(!/acid$/.test(s)){if(s.startsWith('hydrogen'))return {node:'q2',msg:`Dissolved in water, ${CL.fmt(c.formula)}(aq) is named as an acid: ${c.name}. (“Hydrogen ${an.name}” is the name for the pure gas or compound, not the acid.)`};return {node:'q2',msg:`It starts with H and is in water, so the name ends in “acid”: ${c.name}.`};}
    if(c.binary&&!s.startsWith('hydro'))return {node:'q5',msg:`${an.name.replace(/^./,m=>m.toUpperCase())} has no oxygen, so the acid takes hydro-: ${c.name}.`};
    if(!c.binary&&s.startsWith('hydro'))return {node:'q5',msg:`${an.name.replace(/^./,m=>m.toUpperCase())} contains oxygen, so there is no hydro- prefix: ${c.name}.`};
    if(!c.binary){if(/ate$/.test(an.name)&&/ous acid$/.test(s))return {node:'oxy',msg:`${cap(an.name)} ends in -ate, so the acid ends in -ic: ${c.name}. (-ite → -ous.)`};
      if(/ite$/.test(an.name)&&/ic acid$/.test(s))return {node:'oxy',msg:`${cap(an.name)} ends in -ite, so the acid ends in -ous: ${c.name}. (-ate → -ic.)`};
      return {node:'oxy',msg:`The anion is ${an.name} (${CL.fmt(an.f,an.q)}), so the acid is ${c.name}.`};}
    return {node:'bin',msg:`hydro- + root + -ic acid: ${c.name}.`};}
  if(c.kind==='mol'){const m=c.m;const e2=CL.anionName[m.b];
    if(/\(/.test(s))return {node:'q1',msg:'Roman numerals are only for metal ions. Two nonmetals make a molecular compound, which uses prefixes.'};
    if(/acid/.test(s))return {node:'q2',msg:'It does not start with H, so it is not an acid.'};
    const parts=s.split(' ');if(parts.length<2)return {node:'mol',msg:`A molecular name has two words: ${c.name}.`};
    const p1=parts[0],p2=parts.slice(1).join(' ');
    if(m.na===1&&p1.startsWith('mono'))return {node:'mol',msg:`Skip mono- on the first element: ${c.name}.`};
    if(!p2.endsWith('ide'))return {node:'mol',msg:`The second element ends in -ide: ${e2}.`};
    if(p2===e2)return {node:'mol',msg:`Molecular names need a prefix on the second element too, even mono-: ${c.name}.`};
    if(p1===elName(m.a)&&m.na>1)return {node:'mol',msg:`There are ${m.na} ${elName(m.a)} atoms, so use ${PREF[m.na]}-: ${c.name}.`};
    return {node:'mol',msg:`Count the atoms: ${m.na} ${elName(m.a)} → ${m.na>1?PREF[m.na]+'-':'no prefix'}; ${m.nb} ${elName(m.b)} → ${PREF[m.nb]}-. So: ${c.name}.`};}
  if(s===normName(c.c.sys))return {node:'mol',msg:`That follows the prefix rules, but ${CL.fmt(c.formula)} has a common name that everyone uses: ${c.name}.`};
  return {node:'mol',msg:`${CL.fmt(c.formula)} has a common name: ${c.name}.`};}
function checkFormula(c,input){const raw=normFormula(input);if(!raw)return {empty:true,msg:'Type a formula first.'};
  if(formulaAlts(c).includes(raw))return {ok:true};
  if(!validFormula(raw))return {node:'sym',msg:'Check the symbols: each starts with a capital letter, and a second letter is lowercase (Cl, not CL or cl). Use * or · before the water in a hydrate.'};
  let got,want;try{got=CL.parse(raw.replace(/\*/g,'·'));want=CL.parse(c.formula.replace(/\*/g,'·'));}catch(e){return {node:'sym',msg:'That formula has a symbol that is not an element.'};}
  if(sameCounts(got,want)){
    if(c.kind==='ionic'){const cs=c.cat.f;if(!raw.startsWith(cs.replace(/\d/g,'').slice(0,1))||raw.indexOf(c.an.f.replace(/\d/g,''))===0)return {node:'order',msg:'Write the positive ion (the metal or ammonium) first.'};
      return {node:'poly',msg:`The atoms are right, but keep each polyatomic ion together as a unit: ${CL.fmt(c.formula)}.`};}
    return {node:c.kind==='mol'?'mol':'oxy',msg:`The atoms are right; write it in the standard order: ${CL.fmt(c.formula)}.`};}
  if(c.kind==='ionic'&&c.hyd&&!raw.includes('*'))return {node:'hyd',msg:`Put a dot (or *) between the salt and the water: ${CL.fmt(c.formula)}.`};
  if(c.kind==='ionic'){const cat=c.cat,an=c.an;
    const k=scaleOf(got,want);if(k>1&&Number.isInteger(k))return {node:'bal',msg:`Reduce the subscripts to the smallest whole-number ratio: ${CL.fmt(c.formula)}.`};
    if(cat.type===2){const alt=CAT2.filter(x=>x.f===cat.f&&x.q!==cat.q).map(x=>mkIonic(x,an,c.hyd)).find(x=>sameCounts(CL.parse(x.formula.replace(/\*/g,'·')),got));
      if(alt)return {node:'t2',msg:`That is the formula for ${alt.name}. (${cat.roman}) means ${CL.fmt(cat.f,cat.q)}: ${CL.fmt(c.formula)}.`};}
    const wrongAn=PA.filter(a=>a!==an&&a.fam&&a.fam===an.fam).map(a=>mkIonic(cat,a,c.hyd)).find(x=>sameCounts(CL.parse(x.formula.replace(/\*/g,'·')),got));
    if(wrongAn)return {node:'poly',msg:`That is ${wrongAn.name}. ${cap(an.name)} is ${CL.fmt(an.f,an.q)}.`};
    if(an.poly&&c.nA>1&&new RegExp(an.f.replace(/[()]/g,'\\$&')+'\\d').test(raw)&&!raw.includes('('+an.f+')'))return {node:'poly',msg:`More than one ${an.name} ion needs parentheses: (${CL.fmt(an.f)})${CL.sub(c.nA)}. Without them, the subscript only multiplies the last atom.`};
    if(cat.poly&&c.nC>1&&new RegExp(cat.f+'\\d').test(raw)&&!raw.includes('('+cat.f+')'))return {node:'poly',msg:`Two or more ammonium ions need parentheses: (NH₄)${CL.sub(c.nC)}.`};
    if(c.hyd){const gotW=got.O-(want.O-c.hyd);if(got.H!==want.H||gotW!==c.hyd){const dry=Object.assign({},want);dry.H-=2*c.hyd;dry.O-=c.hyd;const g2=Object.assign({},got);const w2=Math.round(((got.H||0)-(dry.H||0))/2);g2.H-=2*w2;g2.O-=w2;
      if(sameCounts(g2,dry))return {node:'hyd',msg:`${HYDPRE[c.hyd]}- means ${c.hyd} water${c.hyd>1?'s':''}: ·${c.hyd>1?c.hyd:''}H₂O.`};}}
    return {node:'bal',msg:`The charges must add to zero. ${c.nC} × ${chargeTxt(cat.q)} and ${c.nA} × ${chargeTxt(an.q)} balance: ${CL.fmt(c.formula)}.`};}
  if(c.kind==='acid'){const an=c.an,n=Math.abs(an.q);
    const dry=Object.assign({},got);dry.H=(dry.H||0)-0;const anC=CL.parse(an.f);const g2=Object.assign({},got);g2.H=(g2.H||0)-(anC.H||0);const a2=Object.assign({},anC);delete a2.H;const g3=Object.assign({},g2);delete g3.H;
    if(sameCounts(g3,a2))return {node:c.binary?'bin':'oxy',msg:`${an.name.replace(/^./,m=>m.toUpperCase())} is ${CL.fmt(an.f,an.q)}, so the acid needs ${n} H⁺: ${CL.fmt(c.formula)}.`};
    return {node:c.binary?'bin':'oxy',msg:`${cap(c.name)} comes from ${an.name}, ${CL.fmt(an.f,an.q)}${c.binary?'':' (-ic ↔ -ate, -ous ↔ -ite)'}: ${CL.fmt(c.formula)}.`};}
  if(c.kind==='mol'){const m=c.m;if(got[m.a]===m.nb&&got[m.b]===m.na&&m.na!==m.nb)return {node:'mol',msg:`The prefixes are swapped. ${m.na>1?PREF[m.na]+'-':'No prefix'} goes with ${elName(m.a)} and ${PREF[m.nb]}- with ${elName(m.b)}: ${CL.fmt(c.formula)}.`};
    return {node:'mol',msg:`In a molecular name the prefixes are the subscripts: ${m.na>1?PREF[m.na]+'-':'no prefix'} = ${m.na}, ${PREF[m.nb]}- = ${m.nb}. There are no charges to crisscross: ${CL.fmt(c.formula)}.`};}
  return {node:'mol',msg:`${c.name} is ${CL.fmt(c.formula)}.`};}

/* ---------- multiple-choice distractors (each one is a real, common mistake) ---------- */
function wrongNames(c){const w=[];
  if(c.kind==='ionic'){const cat=c.cat,an=c.an,hy=c.hyd?' '+HYDPRE[c.hyd]+'hydrate':'';const base=cat.base||cat.name;
    w.push((c.nC>1?PREF[c.nC]:'')+base+' '+prefixed(PREF[c.nA],an.name)+hy);
    if(cat.type===2&&!cat.poly){w.push(base+' '+an.name+hy);const sub=c.nC>1?c.nC:c.nA;if(ROMAN[sub]&&sub!==cat.q)w.push(base+'('+ROMAN[sub]+') '+an.name+hy);
      const other=TMION.find(t=>t[0]===cat.f&&t[1]!==cat.q);if(other)w.push(base+'('+ROMAN[other[1]]+') '+an.name+hy);}
    else if(!cat.poly)w.push(base+'('+ROMAN[cat.q]+') '+an.name+hy);
    if(an.poly){const fam=familyOf(an);if(fam){fam.filter(a=>a!==an).forEach(a=>w.push(cat.name+' '+a.name+hy));}(SIMILAR[an.f]||[]).forEach(x=>w.push(cat.name+' '+x+hy));
      const at=CL.parse(an.f),main=Object.keys(at).find(k=>k!=='O'&&k!=='H')||'O';if(CL.anionName[main])w.push(cat.name+' '+CL.anionName[main]+hy);}
    else{w.push(cat.name+' '+elName(an.f)+hy);const ate=PA.find(a=>a.fam===an.f||(an.f==='S'&&a.f==='SO4')||(an.f==='N'&&a.f==='NO3')||(an.f==='P'&&a.f==='PO4')||(an.f==='Cl'&&a.f==='ClO3'));if(ate)w.push(cat.name+' '+ate.name+hy);}
    if(c.hyd){w.push(cat.name+' '+an.name+' '+HYDPRE[clamp(c.hyd+1,1,10)]+'hydrate');w.push(cat.name+' '+an.name);}
    if(cat.poly)(SIMILAR[cat.f]||[]).forEach(x=>w.push(x+' '+an.name+hy));}
  else if(c.kind==='acid'){const an=c.an;w.push('hydrogen '+an.name);
    if(c.binary){w.push((ACIDROOT[an.name]||an.name.replace(/ide$/,''))+'ic acid');w.push('hydro'+(ACIDROOT[an.name]||an.name.replace(/ide$/,''))+'ous acid');}
    else{const r=c.name.replace(/(ic|ous) acid$/,'');w.push('hydro'+c.name);w.push(r+(/ic acid$/.test(c.name)?'ous':'ic')+' acid');}
    w.push(an.name+' acid');}
  else if(c.kind==='mol'){const m=c.m;w.push(elName(m.a)+' '+CL.anionName[m.b]);w.push('mono'+(m.na>1?'':'')+elName(m.a)+' '+prefixed(PREF[m.nb],CL.anionName[m.b]));
    w.push((m.nb>1?PREF[m.nb]:'')+elName(m.a)+' '+prefixed(PREF[m.na],CL.anionName[m.b]));w.push(elName(m.a)+'('+ROMAN[Math.min(7,m.nb*2)]+') '+CL.anionName[m.b]);
    if(m.na>1)w.push(elName(m.a)+' '+prefixed(PREF[m.nb],CL.anionName[m.b]));}
  else{w.push(c.c.sys);w.push('hydrogen '+(c.formula==='NH3'?'nitride':c.formula==='CH4'?'carbide':'oxide'));w.push(c.formula==='H2O'?'hydrogen hydroxide':c.formula==='NH3'?'ammonium':'methanol');}
  return w;}
function wrongFormulas(c){const w=[];
  if(c.kind==='ionic'){const cat=c.cat,an=c.an,hy=c.hyd?'*'+(c.hyd>1?c.hyd:'')+'H2O':'';
    w.push(cat.f+an.f+hy);
    if(an.poly&&c.nA>1)w.push(cat.f+(c.nC>1?c.nC:'')+an.f+c.nA+hy);
    if(!(c.nC===1&&c.nA===1)){if(c.nC===c.nA||cat.f==='Hg2'){}else{const sw=(cat.poly&&c.nA>1?'('+cat.f+')':cat.f)+(c.nA>1?c.nA:'')+(an.poly&&c.nC>1?'('+an.f+')':an.f)+(c.nC>1?c.nC:'');w.push(sw+hy);}}
    else{const a=Math.abs(cat.q),b=Math.abs(an.q);if(a>1||b>1)w.push((cat.poly&&b>1?'('+cat.f+')':cat.f)+(b>1?b:'')+(an.poly&&a>1?'('+an.f+')':an.f)+(a>1?a:'')+hy);}
    if(cat.type===2){CAT2.filter(x=>x.f===cat.f&&x.q!==cat.q).forEach(x=>w.push(mkIonic(x,an,c.hyd).formula));}
    const fam=familyOf(an);if(fam)fam.filter(a=>a!==an).forEach(a=>w.push(mkIonic(cat,a,c.hyd).formula));
    if(c.hyd)w.push(c.formula.replace(/\*.*/,'')+'*'+(c.hyd+1)+'H2O');
    if(cat.f==='Hg2')w.push('HgCl2'.replace('Cl',an.f),'Hg'+an.f);
    const C=cat.poly?'('+cat.f+')':cat.f,A=an.poly?'('+an.f+')':an.f;w.push(cat.f+(an.poly?A:an.f)+'2'+hy,C+'2'+an.f+hy,cat.f+'3'+(an.poly?A:an.f)+'2'+hy,(an.poly?an.f:an.f)+cat.f+hy);}
  else if(c.kind==='acid'){const an=c.an,n=Math.abs(an.q);w.push('H'+an.f);if(n===1)w.push('H2'+an.f);if(n<3)w.push('H3'+an.f);w.push('H'+(n>1?n:'')+an.f+(an.poly?'':'O3'));
    const fam=familyOf(an);if(fam)fam.filter(a=>a!==an).forEach(a=>w.push(mkAcid(a).formula));
    (SIMILAR[an.f]||[]).forEach(x=>{const a=PA.find(y=>y.name===x);if(a&&a.q<0)w.push(mkAcid(a).formula);});if(c.formula==='HCN')w.push('HCNO','H3N');
    if(c.binary)w.push('H'+(n>1?n:'')+an.f+'O3');else{const at=CL.parse(an.f);const main=Object.keys(at).find(k=>k!=='O'&&k!=='H');if(main&&main!=='C')w.push('H'+(n>1?n:'')+main);}}
  else if(c.kind==='mol'){const m=c.m;w.push(m.a+m.b);w.push(m.a+(m.nb>1?m.nb:'')+m.b+(m.na>1?m.na:''));w.push(m.a+(m.na>1?m.na:'')+m.b);w.push(m.a+'2'+m.b+(m.nb*2));w.push(m.a+(m.na>1?m.na:'')+m.b+(m.nb+1));w.push(m.a+(m.na+1)+m.b+(m.nb>1?m.nb:''));}
  else w.push(...{H2O:['H2O2','HO','H3O'],NH3:['NH4','N3H','NH2'],CH4:['CH3','C4H','CH2'],H2O2:['H2O','HO','HO2']}[c.formula]);
  return w;}
function choicesFor(c,dir,r){const right=dir==='f2n'?c.name:c.formula;const pool=(dir==='f2n'?wrongNames(c):wrongFormulas(c));const seen=new Set([dir==='f2n'?normName(right):right]);const out=[];
  pool.forEach(x=>{const k=dir==='f2n'?normName(x):x;if(!seen.has(k)&&x){seen.add(k);out.push(x);}});
  const ch=[right,...out.slice(0,3)];for(let i=ch.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[ch[i],ch[j]]=[ch[j],ch[i]];}
  return {list:ch,correct:ch.indexOf(right)};}

/* ---------- question generator ---------- */
function pick(arr,r){return arr[Math.floor(r()*arr.length)];}
function cationsFor(type){const tm=CAT2.filter(c=>lvOK(c.lvl));const t1=CAT1.filter(c=>lvOK(c.lvl));if(type==='tm')return tm.concat(lvOK('honors')?[HG2]:[]);if(type==='bin1')return t1;return t1.concat([NH4],tm);}
function genCompound(type,r){
  if(type==='auto'){const opts=['bin1','bin1','poly','tm','tm','mol','mol','acid'];if(lvOK('honors'))opts.push('hyd');if(lvOK('ap'))opts.push('oxy','oxy');type=pick(opts,r);}
  for(let tries=0;tries<200;tries++){
    if(type==='bin1'||type==='tm'){const cat=pick(cationsFor(type),r),an=pick(MONO.filter(a=>lvOK(a.lvl)),r);if(allowed(cat,an))return mkIonic(cat,an);}
    else if(type==='poly'){const cats=CAT1.filter(c=>lvOK(c.lvl)).concat([NH4,NH4],CAT2.filter(c=>lvOK(c.lvl)&&!/mono|four|ox|hal|ti/.test(c.rule)));const cat=pick(cats,r);
      const ans=PA.filter(a=>lvOK(a.lvl));let an=pick(ans,r);if(cat.f==='NH4'&&r()<0.4)an=pick(MONO.filter(a=>lvOK(a.lvl)&&allowed(cat,a)),r);if(allowed(cat,an))return mkIonic(cat,an);}
    else if(type==='mol'){if(r()<0.12)return mkCommon(pick(COMMON.filter((x,i)=>i<3||lvOK('honors')),r));return mkMol(pick(MOLS.filter(m=>lvOK(m.lvl)),r));}
    else if(type==='acid'){return mkAcid(pick(ACIDS.filter(a=>lvOK(a.lvl)),r).an);}
    else if(type==='hyd'){return hydrate(pick(HYD,r));}
    else if(type==='oxy'){if(r()<0.5)return mkAcid(pick(PA.filter(a=>a.fam&&lvOK(a.lvl)),r));const cat=pick(CAT1.filter(c=>lvOK(c.lvl)),r),an=pick(PA.filter(a=>a.fam&&lvOK(a.lvl)),r);if(allowed(cat,an))return mkIonic(cat,an);}
  }
  return mkIonic(CAT1[1],MONO[1]);}
function newQuestion(sim){const st=sim.st,p=sim.p;st.qn++;const r=rng(st.seed*7919+st.qn*104729);
  const dir=p.dir==='mix'?(r()<0.5?'f2n':'n2f'):p.dir;let c;for(let i=0;i<8;i++){c=genCompound(p.types,r);if(!st.recent.includes(c.key))break;}
  st.recent.push(c.key);if(st.recent.length>6)st.recent.shift();
  st.q={c,dir,path:pathFor(c,dir),steps:steps(c,dir),hint:0,done:false,res:null,choices:choicesFor(c,dir,r),picked:-1,input:''};
  if(st.answerEl)st.answerEl.value='';syncAnswer(sim);}
function setQuestion(sim,c,dir,reveal){const st=sim.st;const r=rng(7);st.q={c,dir,path:pathFor(c,dir),steps:steps(c,dir),hint:reveal?99:0,done:!!reveal,res:reveal?{ok:true,shown:true}:null,choices:choicesFor(c,dir,r),picked:-1,input:''};syncAnswer(sim);}

/* ---------- polyatomic ion drill ---------- */
function drillPool(p){let L=PA.filter(a=>lvOK(a.lvl)).concat(POSIONS.filter(a=>lvOK(a.lvl)));
  if(p.ionset==='1')L=L.filter(a=>a.q===-1);else if(p.ionset==='2')L=L.filter(a=>a.q===-2);else if(p.ionset==='3')L=L.filter(a=>a.q===-3);else if(p.ionset==='pos')L=L.filter(a=>a.q>0);
  return L;}
function ionFormulaNorm(s){s=String(s||'').trim().replace(/[₀-₉]/g,c=>SUBS.indexOf(c)).replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻]+/g,run=>'^'+run.replace(/./g,c=>{const i=SUPS.indexOf(c);return i>=0?String(i):c==='⁺'?'+':'-';}))
    .replace(/[−–—]/g,'-').replace(/\s+/g,' ');
  // every reasonable reading: "NO3-", "NO3^-", "SO4 2-", "SO4^2-", "SO4-2", "SO4(2-)", "SO42-" (tight: last digit may be the charge)
  const out=[];let m;const sg=x=>x==='+'?1:-1;
  if((m=s.match(/^([A-Za-z][A-Za-z0-9]*)\s*(?:\^|\s|\()\s*(\d*)\s*([+-])\s*\)?$/)))out.push({f:m[1],q:sg(m[3])*(m[2]?+m[2]:1)});
  if((m=s.match(/^([A-Za-z][A-Za-z0-9]*)\s*(?:\^|\s|\()?\s*([+-])\s*(\d+)\s*\)?$/)))out.push({f:m[1],q:sg(m[2])*(+m[3])});
  if((m=s.match(/^([A-Za-z][A-Za-z0-9]*)([+-])$/))){out.push({f:m[1],q:sg(m[2])});const t=m[1].match(/^(.*[A-Za-z].*?)(\d)$/);if(t)out.push({f:t[1],q:sg(m[2])*(+t[2])});}
  if(!out.length&&/^[A-Za-z][A-Za-z0-9]*$/.test(s))out.push({f:s,q:0,nocharge:true});
  return out;}
function checkIon(ion,dir,input){if(!String(input||'').trim())return {empty:true,msg:dir==='f2n'?'Type the ion’s name first.':'Type the formula with its charge first.'};
  if(dir==='f2n'){const s=normName(input);if(s===normName(ion.name)||s===ALTNAME[ion.name])return {ok:true};
    const other=PA.concat(POSIONS).find(a=>a.name===s);if(other){if(other.fam&&other.fam===ion.fam)return {msg:`That is ${CL.fmt(other.f,other.q)}. Count the oxygens: ${CL.fmt(ion.f,ion.q)} is ${ion.name}.`};return {msg:`${cap(other.name)} is ${CL.fmt(other.f,other.q)}. ${CL.fmt(ion.f,ion.q)} is ${ion.name}.`};}
    if(/ide$/.test(s)&&ion.ox)return {msg:`Ions with oxygen end in -ate or -ite, not -ide: ${ion.name}.`};
    return {msg:`${CL.fmt(ion.f,ion.q)} is ${ion.name}.`};}
  const cands=ionFormulaNorm(input);const alt=ion.f==='C2H3O2'?['C2H3O2','CH3COO']:[ion.f];
  for(const c of cands)if(alt.includes(c.f)&&c.q===ion.q)return {ok:true};
  if(!cands.length)return {msg:'Type the formula and charge, like NO3- or SO4 2- (or SO4^2-).'};const c=cands.find(x=>alt.includes(x.f))||cands[0];
  if(alt.includes(c.f)){if(c.nocharge)return {msg:`Right atoms. Now add the charge: ${CL.fmt(ion.f,ion.q)}.`};return {msg:`Right atoms, wrong charge: ${ion.name} is ${CL.fmt(ion.f,ion.q)}.`};}
  const other=PA.concat(POSIONS).find(a=>cands.some(x=>x.f===a.f&&x.q===a.q))||PA.concat(POSIONS).find(a=>cands.some(x=>x.f===a.f));if(other)return {msg:`${CL.fmt(other.f,other.q)} is ${other.name}. ${ion.name.replace(/^./,m=>m.toUpperCase())} is ${CL.fmt(ion.f,ion.q)}.`};
  return {msg:`${ion.name.replace(/^./,m=>m.toUpperCase())} is ${CL.fmt(ion.f,ion.q)}.`};}
function ionChoices(ion,dir,r){const pool=PA.concat(POSIONS);let w=[];const fam=ion.fam?pool.filter(a=>a.fam===ion.fam&&a!==ion):[];
  if(dir==='f2n'){w=fam.map(a=>a.name);const at=CL.parse(ion.f),main=Object.keys(at).find(k=>k!=='O'&&k!=='H');if(main&&CL.anionName[main])w.push(CL.anionName[main]);
    (SIMILAR[ion.f]||[]).forEach(x=>w.push(x));pool.filter(a=>a.q===ion.q&&a!==ion).forEach(a=>w.push(a.name));}
  else{fam.forEach(a=>w.push(CL.fmt(a.f,a.q)));({NH4:['NH₃','NH₄⁻'],H3O:['OH⁻','H₂O⁺'],Hg2:['Hg⁺','Hg²⁺','Hg₂⁺']}[ion.f]||[]).forEach(x=>w.push(x));w.push(CL.fmt(ion.f,ion.q>0?ion.q+1:ion.q===-1?-2:-1));pool.filter(a=>a.q===ion.q&&a!==ion).forEach(a=>w.push(CL.fmt(a.f,a.q)));}
  const right=dir==='f2n'?ion.name:CL.fmt(ion.f,ion.q);const seen=new Set([right]),out=[];w.forEach(x=>{if(!seen.has(x)){seen.add(x);out.push(x);}});
  const ch=[right,...out.slice(0,3)];for(let i=ch.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[ch[i],ch[j]]=[ch[j],ch[i]];}return {list:ch,correct:ch.indexOf(right)};}
function newIon(sim){const st=sim.st,p=sim.p;st.qn++;const r=rng(st.seed*31+st.qn*7177);const pool=drillPool(p);
  // prefer ions you missed, then ones not seen yet
  const w=pool.map(a=>{const k=st.known[a.f]||0;return (k<0?4:k===0?2.5:k===1?1.2:0.5)*(st.lastIon===a.f?0.05:1);});let tot=w.reduce((a,b)=>a+b,0),x=r()*tot,ion=pool[0];
  for(let i=0;i<pool.length;i++){x-=w[i];if(x<=0){ion=pool[i];break;}}
  const dir=p.dir==='mix'?(r()<0.5?'f2n':'n2f'):p.dir;st.lastIon=ion.f;
  st.d={ion,dir,done:false,res:null,choices:ionChoices(ion,dir,r),picked:-1};if(st.answerEl)st.answerEl.value='';syncAnswer(sim);}

/* ---------- answering ---------- */
function grade(sim,input,pickIdx){const st=sim.st,drill=sim.p.mode==='drill';
  if(drill){const d=st.d;if(!d||d.done)return;let res;
    if(pickIdx!==undefined){d.picked=pickIdx;res=pickIdx===d.choices.correct?{ok:true}:checkIon(d.ion,d.dir,d.dir==='f2n'?d.choices.list[pickIdx]:d.choices.list[pickIdx].replace(/[⁰-⁹⁺⁻]+$/,m=>' '+m));}
    else res=checkIon(d.ion,d.dir,input);
    if(res.empty){d.res=res;syncAnswer(sim);return;}
    d.done=true;d.res=res;tally(st,res.ok,null);const k=st.known[d.ion.f]||0;st.known[d.ion.f]=res.ok?Math.max(1,k+1):-1;}
  else{const q=st.q;if(!q||q.done)return;let res;
    if(pickIdx!==undefined){q.picked=pickIdx;const val=q.choices.list[pickIdx];res=pickIdx===q.choices.correct?{ok:true}:(q.dir==='f2n'?checkName(q.c,val):checkFormula(q.c,val));if(!res.ok&&res.empty)res={node:'q1',msg:'Not quite.'};}
    else res=q.dir==='f2n'?checkName(q.c,input):checkFormula(q.c,input);
    if(res.empty){q.res=res;syncAnswer(sim);return;}
    q.done=true;q.res=res;q.hint=99;tally(st,res.ok,res.node);}
  sim.infoDirty=true;syncAnswer(sim);}
function tally(st,ok,node){st.tries++;if(ok){st.right++;st.streak++;st.best=Math.max(st.best,st.streak);}else{st.streak=0;if(node)st.miss[node]=(st.miss[node]||0)+1;}}

/* ---------- the answer box beside the stage (injected into the controls panel) ---------- */
function buildAnswer(sim){if(!sim.ui||!sim.ui.ctrls||sim.ui.ansBox)return;const box=document.createElement('div');box.className='ctl';box.id='naming-answer';
  box.innerHTML=`<div class="ctl-top"><label for="naming-in" id="naming-prompt">Your answer</label></div>
    <div class="nm-mc" role="group" aria-labelledby="naming-prompt" style="display:flex;flex-direction:column;gap:6px"></div>
    <div class="nm-ty" style="display:flex;gap:6px;align-items:stretch"><input id="naming-in" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" style="flex:1;min-width:0;font-size:16px;padding:7px 9px;border:1px solid var(--line);border-radius:8px;background:var(--card2);color:var(--fg)"><button type="button" class="btn primary" data-nm="check">Check</button></div>
    <p class="help nm-tip" style="margin:4px 0 0"></p><p class="nm-fb" aria-live="polite" style="margin:6px 0 0;font-size:15px;line-height:1.4"></p>`;
  const h3=sim.ui.ctrls.querySelector('h3');h3.after(box);sim.ui.ansBox=box;const inp=box.querySelector('input');sim.st.answerEl=inp;
  inp.addEventListener('input',()=>{const o=sim.p.mode==='drill'?sim.st.d:sim.st.q;if(o)o.input=inp.value;});
  inp.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();grade(sim,inp.value);BioLab.refresh(sim);}});
  box.querySelector('[data-nm=check]').addEventListener('click',()=>{grade(sim,inp.value);BioLab.refresh(sim);});
  syncAnswer(sim);}
function syncAnswer(sim){const box=sim.ui&&sim.ui.ansBox;if(!box||!sim.st)return;sim.st.answerEl=box.querySelector('input');const st=sim.st,drill=sim.p.mode==='drill',o=drill?st.d:st.q;if(!o)return;
  const mc=sim.p.style==='mc',dir=o.dir;const inp=box.querySelector('input');
  box.querySelector('#naming-prompt').textContent=drill?(dir==='f2n'?'Name this ion':'Formula and charge of this ion'):(dir==='f2n'?'Name this compound':'Write the formula');
  inp.placeholder=drill?(dir==='f2n'?'e.g. nitrate':'e.g. NO3- or SO4 2-'):(dir==='f2n'?'e.g. iron(III) oxide':'e.g. Fe2O3, CuSO4*5H2O');
  if(inp.value!==(o.input||''))inp.value=o.input||'';inp.disabled=o.done;box.querySelector('[data-nm=check]').disabled=o.done;
  box.querySelector('.nm-ty').style.display=mc?'none':'flex';const mcd=box.querySelector('.nm-mc');mcd.style.display=mc?'flex':'none';
  const prompt=drill?(dir==='f2n'?CL.html(o.ion.f,o.ion.q):o.ion.name+(ALTNAME[o.ion.name]?' ('+ALTNAME[o.ion.name]+')':'')):(dir==='f2n'?CL.html(o.c.formula)+(o.c.kind==='acid'?'(aq)':''):esc(o.c.name)+(o.c.kind==='ionic'&&ALTNAME[o.c.an.name]?' ('+o.c.cat.name+' '+ALTNAME[o.c.an.name]+')':''));
  box.querySelector('.nm-tip').innerHTML=`<b style="font-size:17px">${prompt}</b>`+(mc?'':(drill?' · type the charge after a space, or use ^':(dir==='n2f'?' · subscripts as plain numbers':'')));
  if(mc){const ch=o.choices;mcd.innerHTML=ch.list.map((t,i)=>{const lab=drill?(dir==='f2n'?esc(t):esc(t)):(dir==='f2n'?esc(t):CL.html(t)+(o.c.kind==='acid'?'(aq)':''));
      const cls=o.done?(i===ch.correct?' style="border-color:var(--good);box-shadow:inset 0 0 0 1px var(--good)"':(i===o.picked?' style="border-color:var(--bad);box-shadow:inset 0 0 0 1px var(--bad)"':'')):'';
      return `<button type="button" class="choice" data-nmc="${i}"${o.done?' disabled':''}${cls}>${lab}</button>`;}).join('');
    mcd.querySelectorAll('[data-nmc]').forEach(b=>b.addEventListener('click',()=>{grade(sim,null,+b.dataset.nmc);BioLab.refresh(sim);}));}
  const fb=box.querySelector('.nm-fb');const res=o.res;
  if(!res)fb.innerHTML='';else if(res.empty)fb.innerHTML=`<span style="color:var(--muted)">${res.msg}</span>`;
  else if(res.shown)fb.innerHTML=`<b>Answer:</b> ${drill?(dir==='f2n'?esc(o.ion.name):CL.html(o.ion.f,o.ion.q)):(dir==='f2n'?esc(o.c.name):CL.html(o.c.formula))}`;
  else if(res.ok)fb.innerHTML=`<b style="color:var(--good)">Correct.</b> ${drill?'':(dir==='f2n'?esc(o.c.name):CL.html(o.c.formula))}${res.note?' <span style="color:var(--muted)">'+res.note+'</span>':''}`;
  else fb.innerHTML=`<b style="color:var(--bad)">Not quite.</b> ${drill?'':'<span style="color:var(--muted)">Check step: '+(NODE_SHORT[res.node]||'')+'.</span> '}${res.msg}`;}

/* ---------- canvas drawing helpers ---------- */
function wrapLines(ctx,s,maxW,size,w){ctx.font=(w||400)+' '+size+'px '+FONT;const words=s.split(' '),lines=[];let cur='';
  words.forEach(wd=>{const t=cur?cur+' '+wd:wd;if(ctx.measureText(t).width>maxW&&cur){lines.push(cur);cur=wd;}else cur=t;});if(cur)lines.push(cur);return lines;}
function fitText(ctx,s,maxW,size,min,w){let z=size;ctx.font=(w||700)+' '+z+'px '+FONT;while(ctx.measureText(s).width>maxW&&z>min){z-=1;ctx.font=(w||700)+' '+z+'px '+FONT;}return z;}
function arrowTo(ctx,x1,y1,x2,y2,col,lw){const a=Math.atan2(y2-y1,x2-x1),h=7+lw;ctx.strokeStyle=col;ctx.fillStyle=col;ctx.lineWidth=lw;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2-Math.cos(a)*h*0.7,y2-Math.sin(a)*h*0.7);ctx.stroke();
  ctx.beginPath();ctx.moveTo(x2,y2);ctx.lineTo(x2-Math.cos(a-0.5)*h,y2-Math.sin(a-0.5)*h);ctx.lineTo(x2-Math.cos(a+0.5)*h,y2-Math.sin(a+0.5)*h);ctx.closePath();ctx.fill();}
function edgePts(a,b){const A=NODES[a],B=NODES[b];
  if(a==='q1'&&b==='q3')return [[A.x-120,A.y+A.h/2],[B.x,B.y-B.h/2]];
  if(a==='q1'&&b==='q2')return [[A.x+120,A.y+A.h/2],[B.x,B.y-B.h/2]];
  if(a==='q5'&&b==='oxy')return [[A.x+A.w/2-12,A.y+A.h/2],[A.x+A.w/2-12,B.y-B.h/2]];
  if(a==='q2'&&b==='mol')return [[A.x-90,A.y+A.h/2],[B.x,B.y-B.h/2]];
  if(a==='q2'&&b==='q5')return [[A.x+90,A.y+A.h/2],[B.x,B.y-B.h/2]];
  if(a==='q5'&&b==='bin')return [[B.x-10,A.y+A.h/2],[B.x-10,B.y-B.h/2]];
  const ax=a==='q3'||a==='q4'?(B.x<A.x?A.x-96:A.x+96):A.x,bx=(b==='q4'||b==='bal')?(A.x<B.x?B.x-96:B.x+96):B.x;
  return [[ax,A.y+A.h/2],[bx,B.y-B.h/2]];}
const EDGE_LBL={'q1>q3':[-1,'yes: ionic'],'q1>q2':[1,'no'],'q3>t1':[-1,'no'],'q3>t2':[1,'yes'],'q4>mon':[-1,'no'],'q4>poly':[1,'yes'],'q2>mol':[-1,'no'],'q2>q5':[1,'yes'],'q5>bin':[-1,'no'],'q5>oxy':[1,'yes']};

/* ---------- ion pictures for the drill ---------- */
function ionAtoms(f){const c=CL.parse(f);const S=[];
  const ring=(cx,cy,n,R,sym,start)=>{for(let i=0;i<n;i++){const a=(start||-Math.PI/2)+i*2*Math.PI/n;S.push({s:sym,x:cx+Math.cos(a)*R,y:cy+Math.sin(a)*R,b:[cx,cy]});}};
  const special={OH:[{s:'O',x:-14,y:0},{s:'H',x:22,y:-8,b:[-14,0]}],CN:[{s:'C',x:-16,y:0},{s:'N',x:18,y:0,b:[-16,0]}],SCN:[{s:'S',x:-38,y:0},{s:'C',x:0,y:0,b:[-38,0]},{s:'N',x:34,y:0,b:[0,0]}],
    O2:[{s:'O',x:-17,y:0},{s:'O',x:17,y:0,b:[-17,0]}],Hg2:[{s:'Hg',x:-22,y:0},{s:'Hg',x:22,y:0,b:[-22,0]}],
    C2H3O2:[{s:'C',x:-22,y:0},{s:'C',x:18,y:0,b:[-22,0]},{s:'H',x:-42,y:-26,b:[-22,0]},{s:'H',x:-50,y:10,b:[-22,0]},{s:'H',x:-28,y:32,b:[-22,0]},{s:'O',x:40,y:-28,b:[18,0]},{s:'O',x:40,y:28,b:[18,0]}],
    C2O4:[{s:'C',x:-20,y:0},{s:'C',x:20,y:0,b:[-20,0]},{s:'O',x:-40,y:-28,b:[-20,0]},{s:'O',x:-40,y:28,b:[-20,0]},{s:'O',x:40,y:-28,b:[20,0]},{s:'O',x:40,y:28,b:[20,0]}],
    Cr2O7:[{s:'O',x:0,y:-6},{s:'Cr',x:-42,y:6,b:[0,-6]},{s:'Cr',x:42,y:6,b:[0,-6]},{s:'O',x:-58,y:-28,b:[-42,6]},{s:'O',x:-70,y:26,b:[-42,6]},{s:'O',x:-34,y:44,b:[-42,6]},{s:'O',x:58,y:-28,b:[42,6]},{s:'O',x:70,y:26,b:[42,6]},{s:'O',x:34,y:44,b:[42,6]}],
    S2O3:[{s:'S',x:0,y:0},{s:'S',x:0,y:-40,b:[0,0]},{s:'O',x:-34,y:20,b:[0,0]},{s:'O',x:34,y:20,b:[0,0]},{s:'O',x:0,y:40,b:[0,0]}],
    NH4:[{s:'N',x:0,y:0},{s:'H',x:-28,y:-24,b:[0,0]},{s:'H',x:28,y:-24,b:[0,0]},{s:'H',x:-28,y:24,b:[0,0]},{s:'H',x:28,y:24,b:[0,0]}],
    H3O:[{s:'O',x:0,y:0},{s:'H',x:0,y:-34,b:[0,0]},{s:'H',x:-30,y:18,b:[0,0]},{s:'H',x:30,y:18,b:[0,0]}]};
  if(special[f])return special[f];
  // central atom XOn with optional H on the oxygens (HCO3, HSO4, H2PO4, HPO4, HSO3)
  const ctr=Object.keys(c).find(k=>k!=='O'&&k!=='H');const nO=c.O||0,nH=c.H||0;S.push({s:ctr,x:0,y:0});
  const R=nO>3?40:38;ring(0,0,nO,R,'O',nO===3?-Math.PI/2:nO===2?-Math.PI*0.85:nO===1?0:-Math.PI/4);
  for(let i=0;i<nH;i++){const o=S[1+i];const a=Math.atan2(o.y,o.x);S.push({s:'H',x:o.x+Math.cos(a+0.6)*26,y:o.y+Math.sin(a+0.6)*26,b:[o.x,o.y]});}
  return S;}
function drawIon(ctx,f,q,cx,cy,sc,k){const atoms=ionAtoms(f);ctx.save();ctx.lineWidth=5*sc;ctx.strokeStyle=PAL['cv-soft'];
  atoms.forEach(a=>{if(a.b){ctx.beginPath();ctx.moveTo(cx+a.b[0]*sc,cy+a.b[1]*sc);ctx.lineTo(cx+a.x*sc,cy+a.y*sc);ctx.stroke();}});
  const order=atoms.slice().sort((a,b)=>(a.s==='H')-(b.s==='H'));
  order.forEach(a=>{const r=(a.s==='H'?11:a.s==='Hg'?20:a.s==='O'?15:a.s==='Cr'||a.s==='Mn'?18:17)*sc;CL.drawAtom(ctx,cx+a.x*sc,cy+a.y*sc,r,a.s,{s:Math.max(12*k*0.85,r*0.9)});});
  let maxx=0,miny=0;atoms.forEach(a=>{maxx=Math.max(maxx,a.x);miny=Math.min(miny,a.y);});
  // bracket and charge
  const bx0=cx-(maxx+30)*sc,bx1=cx+(maxx+30)*sc,by0=cy+(miny-30)*sc,by1=cy+(-miny+30)*sc;ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2.5;
  ctx.beginPath();ctx.moveTo(bx0+10,by0);ctx.lineTo(bx0,by0);ctx.lineTo(bx0,by1);ctx.lineTo(bx0+10,by1);ctx.moveTo(bx1-10,by0);ctx.lineTo(bx1,by0);ctx.lineTo(bx1,by1);ctx.lineTo(bx1-10,by1);ctx.stroke();
  txt(ctx,CL.sup((Math.abs(q)===1?'':Math.abs(q))+(q>0?'+':'-')),bx1+4,by0+10*k,{s:22*k,w:800,c:q>0?PAL['s2']:PAL['s1']});
  ctx.restore();return {x0:bx0,x1:bx1+30*k,y0:by0,y1:by1};}

/* ---------- the simulation definition ---------- */
const SIM={
  id:'naming',hash:'naming',apUnit:5,order:2,tab:'Naming compounds',kind:'Learning tool',
  card:'Walk the naming flowchart for ionic compounds, transition metals, polyatomic ions, molecules, acids and hydrates, in both directions.',
  title:'Naming compounds: the flowchart trainer',
  lede:{bio:'Every chemical name follows a few rules. Answer, and the flowchart lights up the path. Get one wrong and it shows the step you missed.',
        honors:'Practice the whole unit: Type I and Type II ionic compounds, polyatomic ions, molecular prefixes, acids and hydrates, from formula to name and back.',
        ap:'Add the full oxyanion families (per-ate, -ate, -ite, hypo-ite for Cl, Br and I) and the acids built from them.'},
  scale:'Symbolic level: names and formulas on paper. Each formula unit or molecule is a few hundred picometers across.',
  aspect:5/4,timeless:true,graph:false,controlsTitle:'Practice',
  prereq:['ionic'],next:['balance','hydrate','ptable'],
  controls:[
    {id:'mode',label:'Practice',type:'seg',def:'flow',lvl:'bio',noTrial:true,options:[{v:'flow',l:'Name compounds'},{v:'drill',l:'Polyatomic ion drill'}],onChange:sim=>{syncMode(sim);if(sim.p.mode==='drill')newIon(sim);else newQuestion(sim);}},
    {id:'types',label:'Compound types',type:'select',def:'auto',lvl:'bio',options:[{v:'auto',l:'Mixed: everything at this level'},{v:'bin1',l:'Binary ionic, one charge (NaCl)'},{v:'tm',l:'Transition metals, Roman numerals'},{v:'poly',l:'Polyatomic ions (ternary)'},
      {v:'mol',l:'Molecular, with prefixes'},{v:'acid',l:'Acids'},{v:'hyd',l:'Hydrates',lvl:'honors'},{v:'oxy',l:'Oxyanion families and their acids',lvl:'ap'}],onChange:sim=>{if(sim.p.mode==='flow')newQuestion(sim);},modes:['flow']},
    {id:'ionset',label:'Ions to drill',type:'seg',def:'all',lvl:'bio',modes:['drill'],options:[{v:'1',l:'1− ions'},{v:'2',l:'2− ions'},{v:'3',l:'3− ions'},{v:'pos',l:'Positive'},{v:'all',l:'All'}],onChange:sim=>{if(sim.p.mode==='drill')newIon(sim);}},
    {id:'dir',label:'Direction',type:'seg',def:'f2n',lvl:'bio',options:[{v:'f2n',l:'Formula → name'},{v:'n2f',l:'Name → formula'},{v:'mix',l:'Mix'}],onChange:sim=>{if(sim.p.mode==='drill')newIon(sim);else newQuestion(sim);}},
    {id:'style',label:'Answer by',type:'seg',def:'type',lvl:'bio',noTrial:true,options:[{v:'type',l:'Typing'},{v:'mc',l:'Choosing'}],onChange:sim=>syncAnswer(sim)}
  ],
  actions:[
    {id:'new',label:'Next compound',primary:true,modes:['flow'],run(sim){newQuestion(sim);}},
    {id:'hint',label:'Hint: next step',modes:['flow'],run(sim){const q=sim.st.q;if(q&&!q.done)q.hint=Math.min(q.steps.length,q.hint+1);}},
    {id:'show',label:'Show the answer',modes:['flow'],run(sim){const q=sim.st.q;if(q&&!q.done){q.done=true;q.hint=99;q.res={shown:true};sim.st.tries++;sim.st.streak=0;syncAnswer(sim);}}},
    {id:'newion',label:'Next ion',primary:true,modes:['drill'],run(sim){newIon(sim);}},
    {id:'showion',label:'Show the answer',modes:['drill'],run(sim){const d=sim.st.d;if(d&&!d.done){d.done=true;d.res={shown:true};sim.st.tries++;sim.st.streak=0;sim.st.known[d.ion.f]=-1;syncAnswer(sim);}}},
    {id:'reset',label:'Reset score',modes:['flow','drill'],run(sim){const st=sim.st;st.right=0;st.tries=0;st.streak=0;st.miss={};st.known={};}}
  ],
  init(sim){const st={seed:1+Math.floor(Math.random()*1e6),qn:0,right:0,tries:0,streak:0,best:0,miss:{},known:{},recent:[],q:null,d:null,lastIon:null};sim.st=st;
    if(sim.p.mode==='drill')newIon(sim);else newQuestion(sim);if(!st.d){const save=sim.p.mode;newIonSilent(sim);}if(!st.q)newQuestion(sim);return st;},
  initVis(sim){buildAnswer(sim);syncAnswer(sim);},
  onLevel(sim){syncMode(sim);if(sim.st){if(sim.p.mode==='drill')newIon(sim);else newQuestion(sim);}},
  step(){},
  metrics:[
    {id:'right',label:'Correct',unit:'',lvl:'bio',min:0,max:null,d:0,get:s=>s.st.right},
    {id:'tries',label:'Answered',unit:'',lvl:'bio',min:0,max:null,d:0,get:s=>s.st.tries},
    {id:'streak',label:'Streak',unit:'in a row',lvl:'bio',min:0,max:null,d:0,get:s=>s.st.streak},
    {id:'acc',label:'Accuracy',unit:'%',lvl:'honors',min:0,max:100,d:0,get:s=>s.st.tries?100*s.st.right/s.st.tries:0},
    {id:'weak',label:'Step you miss most',unit:'',lvl:'ap',text:true,noTrial:false,get:s=>{const m=s.st.miss,ks=Object.keys(m);if(!ks.length)return 'None yet';ks.sort((a,b)=>m[b]-m[a]);return NODE_SHORT[ks[0]]+' ('+m[ks[0]]+')';}}
  ],
  challengeTitle:'Check your understanding',
  challenges(sim){const fe=mkIonic(catBySym('Fe',3),anionByF('Cl')),cu=mkIonic(catBySym('Cu',1),anionByF('O')),pb=mkIonic(catBySym('Pb',4),anionByF('O')),mg=mkIonic(catBySym('Mg',2),anionByF('Cl'));
    const co=mkMol(MOLS[0]),caoh=mkIonic(catBySym('Ca',2),anionByF('OH')),cuh=hydrate(HYD[0]),hcl2=mkAcid(anionByF('ClO2')),h2so3=mkAcid(anionByF('SO3')),nh4=mkIonic(NH4,anionByF('SO4'));
    const mcq=(c,dir,lvl,q,explain,seed)=>{const ch=choicesFor(c,dir,rng(seed));return {lvl,instant:true,q,choices:dir==='f2n'?ch.list.map(esc):ch.list.map(x=>CL.html(x)),correct:ch.correct,explain,show:c,dir};};
    return [
      mcq(mg,'f2n','bio','MgCl₂ has two chlorines. What is its name?','Magnesium is a metal, so MgCl₂ is ionic, and ionic names never use prefixes. Mg only forms Mg²⁺, and each Cl⁻ is 1−, so it takes two chlorides to balance. The charges already tell you the ratio: <b>magnesium chloride</b>.',11),
      mcq(co,'f2n','bio','CO is a poisonous gas from car exhaust. What is its name?','Carbon and oxygen are both nonmetals, so CO is molecular and uses prefixes. Skip mono- on the first element, keep it on the second, and drop the extra vowel: <b>carbon monoxide</b>.',12),
      mcq(caoh,'n2f','bio','What is the formula for calcium hydroxide?','Ca²⁺ needs two OH⁻ to balance. Hydroxide is polyatomic, so it goes in parentheses: <b>Ca(OH)₂</b>. CaOH₂ would mean one O and two H, which is a different thing.',13),
      {lvl:'bio',instant:true,q:'Which ion is sulfate?',choices:['SO₄²⁻','SO₃²⁻','S²⁻','S₂O₃²⁻'],correct:0,explain:'Sulfate is SO₄²⁻. Sulfite has one less oxygen (SO₃²⁻), sulfide is the single atom S²⁻, and thiosulfate is S₂O₃²⁻. The -ate ion has one more oxygen than the -ite ion.',dion:'SO4'},
      mcq(fe,'f2n','honors','What is the name of FeCl₃?','Iron can be 2+ or 3+, so it needs a Roman numeral. Three Cl⁻ add to 3−, so the one iron is 3+: <b>iron(III) chloride</b>. The Roman numeral is the charge, and ionic names never use tri-.',21),
      mcq(cu,'f2n','honors','What is the name of Cu₂O?','O²⁻ is 2−, shared by two copper ions, so each copper is 1+: <b>copper(I) oxide</b>. The subscript 2 is not the charge.',22),
      mcq(pb,'f2n','honors','What is the name of PbO₂?','Two O²⁻ add to 4−, so the one lead ion is 4+: <b>lead(IV) oxide</b>. Work backward from the anion; do not just copy a subscript.',23),
      mcq(cuh,'f2n','honors','The blue crystals in the hydrate lab are CuSO₄·5H₂O. What is the name?','Copper needs a Roman numeral: SO₄²⁻ is 2−, so copper is 2+. The ·5H₂O adds pentahydrate: <b>copper(II) sulfate pentahydrate</b>.',24),
      mcq(hcl2,'f2n','ap','What is the name of HClO₂(aq)?','ClO₂⁻ is chlorite. It has oxygen, so no hydro-, and -ite becomes -ous: <b>chlorous acid</b>. (HClO₃ is chloric acid, from chlorate.)',31),
      {lvl:'ap',instant:true,q:'Chlorine’s oxyanions are ClO₄⁻, ClO₃⁻, ClO₂⁻ and ClO⁻. What is the formula of hypobromite?',choices:['BrO⁻','BrO₂⁻','BrO₃⁻','Br⁻'],correct:0,explain:'Bromine and iodine follow the same pattern as chlorine. Hypo-…-ite has the fewest oxygens: hypochlorite ClO⁻, so <b>hypobromite is BrO⁻</b>. Perbromate is BrO₄⁻, bromate BrO₃⁻, bromite BrO₂⁻.',dion:'BrO'},
      mcq(h2so3,'f2n','ap','What is the name of H₂SO₃(aq)?','SO₃²⁻ is sulfite. -ite becomes -ous, and sulfur keeps its full root in acid names: <b>sulfurous acid</b>. (H₂SO₄ is sulfuric acid.)',32),
      mcq(nh4,'n2f','ap','What is the formula of ammonium sulfate, a common fertilizer?','NH₄⁺ is 1+ and SO₄²⁻ is 2−, so it takes two ammonium ions. Both are polyatomic, and the one with a subscript needs parentheses: <b>(NH₄)₂SO₄</b>.',33)
    ];},
  onChallenge(sim,ch,phase){if(phase!=='done'||!ch)return;if(ch.show){if(sim.p.mode!=='flow')BioLab.setValues(sim,{mode:'flow'});setQuestion(sim,ch.show,ch.dir,true);}
    else if(ch.dion){if(sim.p.mode!=='drill')BioLab.setValues(sim,{mode:'drill'});const ion=PA.find(a=>a.f===ch.dion);if(ion){sim.st.d={ion,dir:'n2f',done:true,res:{shown:true},choices:ionChoices(ion,'n2f',rng(3)),picked:-1};syncAnswer(sim);}}},
  infoPanel(sim){const st=sim.st;
    if(sim.p.mode==='drill'){const d=st.d;if(!d)return '';const ion=d.ion;const fam=familyOf(ion);let h=`<h3>${d.done?esc(ion.name)+' · '+CL.html(ion.f,ion.q):'Polyatomic ion drill'}</h3>`;
      if(!d.done)h+=`<p>${d.dir==='f2n'?'Name the ion on the stage.':'Write the formula, with its charge, for <b>'+esc(ion.name)+'</b>.'} The drill comes back to ions you miss and skips the ones you know.</p>`;
      else{h+=`<p>${ion.q>0?'A positive polyatomic ion.':'A group of atoms with '+(Math.abs(ion.q)===1?'one extra electron':Math.abs(ion.q)+' extra electrons')+' shared over the whole group, so the charge belongs to the ion as a unit.'}</p>`;
        if(fam&&fam.length>1)h+=`<p><b>Family:</b> ${fam.map(a=>CL.html(a.f,a.q)+' '+esc(a.name)).join(' · ')}. -ate has one more O than -ite${fam.length>2?'; per- adds one more, hypo- takes one away':''}.</p>`;
        if(ion.q<0&&acidName(ion)&&ion.ox&&!/^H/.test(ion.f)&&ion.f!=='O2')h+=`<p>${atLeast('honors')?'As an acid: '+CL.html(mkAcid(ion).formula)+'(aq), <b>'+esc(acidName(ion))+'</b>.':''}</p>`;}
      const pool=drillPool(sim.p),known=pool.filter(a=>(st.known[a.f]||0)>=1).length;h+=`<p class="help">${known} of ${pool.length} ions in this set answered correctly at least once.</p>`;return h;}
    const q=st.q;if(!q)return '';const c=q.c,shown=Math.min(q.hint,q.steps.length);
    let h=`<h3>${q.done?'Worked solution':'Work it out with the flowchart'}</h3>`;
    if(!shown&&!q.done)h+=`<p>${q.dir==='f2n'?'Start at the top of the flowchart. First question: is the first part a metal (or NH₄⁺)?':'Find what kind of compound the name describes. A metal or ammonium first means ionic: you will need charges.'} Press <b>Hint: next step</b> to light up one step at a time.</p>`;
    h+='<ol style="margin:0 0 8px;padding-left:22px">'+q.steps.slice(0,q.done?99:shown).map((s,i)=>`<li style="margin:3px 0${q.res&&!q.res.ok&&!q.res.shown&&q.res.node===s.n?';color:var(--bad)':''}">${s.h}</li>`).join('')+'</ol>';
    if(q.done)h+=`<p><b>${q.dir==='f2n'?'Name':'Formula'}:</b> ${q.dir==='f2n'?esc(c.name):CL.html(c.formula)} &nbsp;·&nbsp; <b>${q.dir==='f2n'?'Formula':'Name'}:</b> ${q.dir==='f2n'?CL.html(c.formula)+(c.kind==='acid'?'(aq)':''):esc(c.name)}</p>`;
    if(q.done&&atLeast('ap')&&c.kind==='ionic'&&c.an.fam){const fam=familyOf(c.an);if(fam&&fam.length>1)h+=`<p class="help">Oxyanion family: ${fam.map(a=>CL.html(a.f,a.q)+' '+esc(a.name)).join(' · ')}</p>`;}
    if(q.done&&atLeast('ap')&&c.kind==='acid'&&c.an.fam){const fam=familyOf(c.an);if(fam&&fam.length>1)h+=`<p class="help">Acid family: ${fam.map(a=>CL.html(mkAcid(a).formula)+' '+esc(acidName(a))).join(' · ')}</p>`;}
    return h;},
  narrate(sim){const st=sim.st;
    if(sim.p.mode==='drill'){const d=st.d;if(!d)return '';const ion=d.ion;
      if(!d.done)return d.dir==='f2n'?`This ion is a group of atoms that carries a charge as one unit. <b>What is it called?</b>`:`Build the formula for <b>${esc(ion.name)}</b>, then give the charge of the whole group.`;
      const fam=familyOf(ion);return fam&&fam.length>1?`<b>${esc(ion.name)} is ${CL.html(ion.f,ion.q)}.</b> In a family, the name tracks the oxygen count while the charge stays ${chargeTxt(ion.q)}: ${fam.map(a=>esc(a.name)+' has '+CL.parse(a.f).O+' O').join(', ')}.`:`<b>${esc(ion.name)} is ${CL.html(ion.f,ion.q)}.</b> The charge belongs to the whole group, so it never splits up when it forms a compound.`;}
    const q=st.q;if(!q)return '';const c=q.c;
    if(q.done&&q.res&&!q.res.ok&&!q.res.shown)return `<b>The red box is the step to fix: ${NODE_SHORT[q.res.node]||'check the rules'}.</b> ${q.res.msg}`;
    if(q.done)return `<b>${q.dir==='f2n'?esc(c.name):CL.html(c.formula)}.</b> The green path shows every decision: ${q.path.filter(n=>NODES[n]).map(n=>NODE_SHORT[n]).join(' → ')}.`;
    const s=q.steps[Math.min(q.hint,q.steps.length)-1];if(s)return s.h;
    return c.kind==='ionic'?(q.dir==='f2n'?`The first question decides everything: a metal (or NH₄⁺) at the front means <b>ionic</b>, named from its ions. Two nonmetals mean <b>molecular</b>, named with prefixes.`:`The name starts with a metal or ammonium, so this is <b>ionic</b>: find each ion’s charge and balance them to zero.`):
      c.kind==='acid'?`Acids are named for the anion they contain. Ask whether that anion has <b>oxygen</b>.`:`Look at the first element: is it a metal? If not, ask whether it is an <b>acid</b> in water.`;},
  tour:[
    {title:'Start at the top',text:'Every name starts with one question: is the first part a metal, or the ammonium ion? If yes, the compound is ionic and is named from its ions. Here, Na is a metal.',focus:()=>fr('q1'),pause:true,setup(sim){BioLab.setValues(sim,{mode:'flow',dir:'f2n'});tourQ(sim,mkIonic(catBySym('Na',1),anionByF('Cl')),'f2n',1);}},
    {title:'One charge, or more than one?',text:'Sodium only forms Na⁺, so its name is just “sodium.” The anion Cl⁻ is one atom, so it becomes chloride: sodium chloride.',focus:()=>[fr('q3','t1'),fr('mon')],pause:true,setup(sim){tourQ(sim,mkIonic(catBySym('Na',1),anionByF('Cl')),'f2n',5);}},
    {title:'Transition metals get a Roman numeral',text:'Iron can be Fe²⁺ or Fe³⁺, so the name says which. In Fe₂O₃, three O²⁻ make 6−. Two irons share 6+, so each is 3+: iron(III) oxide.',focus:()=>[fr('q3'),fr('t2')],pause:true,setup(sim){tourQ(sim,mkIonic(catBySym('Fe',3),anionByF('O')),'f2n',3);}},
    {title:'Polyatomic ions keep their names',text:'A group of atoms with one charge, like nitrate NO₃⁻, keeps its name. More than one of them needs parentheses: Ca(NO₃)₂ is calcium nitrate.',focus:()=>[fr('q4'),fr('poly')],pause:true,setup(sim){tourQ(sim,mkIonic(catBySym('Ca',2),anionByF('NO3')),'f2n',5);}},
    {title:'Writing a formula: charges add to zero',text:'Going from a name to a formula, find each ion’s charge, then use enough of each ion that the charges cancel. Crisscross the charge numbers and reduce: Al³⁺ and O²⁻ give Al₂O₃.',focus:()=>fr('bal'),pause:true,setup(sim){tourQ(sim,mkIonic(catBySym('Al',3),anionByF('O')),'n2f',6);}},
    {title:'Two nonmetals: prefixes',text:'No metal and no acid means a molecular compound. Prefixes count the atoms: N₂O₄ is dinitrogen tetroxide. Skip mono- on the first element, and drop a vowel before “oxide.”',focus:()=>[fr('mol'),[PREFBOX.x-6,PREFBOX.y-6,PREFBOX.w+12,PREFBOX.h+12]],pause:true,setup(sim){tourQ(sim,mkMol(MOLS.find(m=>m.a==='N'&&m.na===2&&m.nb===4)),'f2n',3);}},
    {title:'Acids: H first, in water',text:'HCl(aq) has no oxygen, so it is hydro- + chlor + -ic acid. H₂SO₄(aq) comes from sulfate: -ate becomes -ic, so sulfuric acid. Sulfite would give sulfurous acid.',focus:()=>[fr('q2'),fr('q5','bin','oxy')],pause:true,setup(sim){tourQ(sim,mkAcid(anionByF('SO4')),'f2n',4);}},
    {lvl:'honors',title:'Hydrates',text:'A dot and water at the end means a hydrate. Name the salt, then add a prefix + hydrate: CuSO₄·5H₂O is copper(II) sulfate pentahydrate, the blue crystals from the hydrate lab.',focus:()=>fr('hyd'),pause:true,setup(sim){tourQ(sim,hydrate(HYD[0]),'f2n',99);}}
  ],
  onTourExit(sim){newQuestion(sim);},
  lab:{bio:'<p><b>Question:</b> Which kind of compound is hardest for you to name?</p><ol><li>Choose <b>Binary ionic, one charge</b>. Answer 10 compounds without hints, then press <b>Record trial</b>.</li><li>Press <b>Reset score</b>, then do the same for <b>Transition metals</b>, <b>Polyatomic ions</b>, <b>Molecular</b> and <b>Acids</b>.</li><li>Compare your accuracy for each type in the table.</li></ol><p>Which flowchart step caused most of your mistakes? Write the rule for that step in your own words.</p>',
       honors:'<p><b>Question:</b> Is naming harder in one direction than the other?</p><ol><li>Pick one compound type. Do 10 with <b>Formula → name</b>, record a trial, then reset.</li><li>Do 10 of the same type with <b>Name → formula</b> and record again.</li><li>Repeat for a second type, including <b>Hydrates</b>.</li></ol><p>Explain which direction is harder for you and which flowchart box causes the difference.</p>',
       ap:'<p><b>Question:</b> Can you predict names and formulas for ions you have never memorized?</p><ol><li>Choose <b>Oxyanion families and their acids</b> and answer 15 questions. Record a trial.</li><li>Check <b>Step you miss most</b>.</li><li>Use the drill on 1− ions to compare the chlorine, bromine and iodine families.</li></ol><p><b>Claim–evidence–reasoning:</b> State the rule that links per-ate, -ate, -ite and hypo-ite ions to their acids, and use your data as evidence that you can apply it to bromine and iodine.</p>'},
  terms:[{t:'Ionic compound',d:'Made of positive and negative ions, usually a metal with a nonmetal. Named from the ions, with no prefixes.'},{t:'Molecular compound',d:'Two or more nonmetals sharing electrons. Named with prefixes: mono-, di-, tri-, tetra-, penta-, hexa-, hepta-, octa-, nona-, deca-.'},
    {t:'Polyatomic ion',d:'A group of atoms that carries one charge as a unit, such as SO₄²⁻ (sulfate) or NH₄⁺ (ammonium).'},{t:'Binary compound',d:'A compound of exactly two elements, such as NaCl or CO₂.'},{t:'Ternary compound',d:'A compound of three elements, usually because it contains a polyatomic ion, such as Ca(NO₃)₂.'},
    {t:'Stock system',d:'Writing a metal’s charge as a Roman numeral in parentheses: iron(III) means Fe³⁺.'},{t:'Acid',d:'A compound that releases H⁺ in water. Its name comes from its anion: -ide → hydro-…-ic, -ate → -ic, -ite → -ous.'},
    {lvl:'honors',t:'Type I and Type II metals',d:'Type I metals form one ion (Na⁺, Ca²⁺, Al³⁺, Zn²⁺, Ag⁺). Type II metals form more than one (Fe²⁺/Fe³⁺, Cu⁺/Cu²⁺) and need a Roman numeral.'},{lvl:'honors',t:'Hydrate',d:'A crystal with water molecules locked in it, written with a dot: CuSO₄·5H₂O. Named with a prefix + hydrate.'},{lvl:'honors',t:'Anhydrous',d:'The compound left after a hydrate’s water is driven off by heating.'},
    {lvl:'ap',t:'Oxyanion',d:'A polyatomic anion containing oxygen. For one element: per-…-ate (most O), -ate, -ite, hypo-…-ite (fewest O), all with the same charge.'},{lvl:'ap',t:'Oxyacid',d:'An acid made from an oxyanion, such as HClO₄ (perchloric acid) or HClO (hypochlorous acid).'}],
  about:'<p>The tool runs the same rules taught in RJ’s nomenclature unit and on its naming flowchart. Every name and formula on the page is built by those rules from a list of ions (charges from the standard tables), real molecular compounds, real acids and real hydrates. Formulas come from ChemLab’s charge-balancing function, so they match the rest of the site.</p><p>When an answer is wrong, the tool compares it with the correct one, piece by piece (cation, Roman numeral, anion, hydrate prefix, acid ending, prefixes), and names the first flowchart step that differs. It accepts common alternatives: bicarbonate and bisulfate, “tetraoxide” for tetroxide, CH₃COO⁻ for acetate, and “aluminium.”</p><p>Simplifications: the ionic generator pairs ions by the naming rules and skips most combinations that are not stable compounds, but a few worksheet-style combinations remain. Nickel is treated as needing a Roman numeral, which most textbooks do. Hg₂²⁺ is named mercury(I). Organic compounds and complex ions are not included. Element names use American spelling.</p>',
  draw(sim,ctx,vdt,k,t){ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,640);if(sim.p.mode==='drill'){drawDrill(sim,ctx,k);return;}drawFlow(sim,ctx,k);},
  thumbSetup(sim){setQuestion(sim,mkIonic(catBySym('Fe',3),anionByF('O')),'f2n',true);}
};
function newIonSilent(sim){const save=sim.st.qn;newIon(sim);sim.st.qn=save;}
function tourQ(sim,c,dir,hints){setQuestion(sim,c,dir,false);sim.st.q.hint=hints;if(hints>=99){sim.st.q.done=true;sim.st.q.res={shown:true};}syncAnswer(sim);sim.infoDirty=true;}
function syncMode(sim){if(!sim.ui||!sim.ui.sec)return;const mode=sim.p.mode,d=sim.def;
  d.controls.forEach(c=>{if(!c.modes)return;const cid=d.id+'-'+c.id,e=document.getElementById(cid)||document.getElementById(cid+'-l');if(!e)return;const w=e.closest('.ctl');if(w)w.hidden=!atLeast(c.lvl)||!c.modes.includes(mode);});
  const btns=[...sim.ui.sec.querySelectorAll('.actions button')];d.actions.forEach((a,i)=>{if(btns[i])btns[i].hidden=!atLeast(a.lvl)||!a.modes.includes(mode);});
  syncAnswer(sim);}

function drawBanner(ctx,k,lead,main,sub){const P=PAL;rr(ctx,12,10,776,70,12);ctx.fillStyle=P['card'];ctx.fill();ctx.strokeStyle=P['line'];ctx.lineWidth=1;ctx.stroke();
  const ls=13*k;txt(ctx,lead,28,30+ls*0.35,{s:ls,w:700,c:P['cv-soft']});ctx.font='700 '+ls+'px '+FONT;const lw=ctx.measureText(lead).width;
  const avail=776-32-lw-24;const z=fitText(ctx,main,avail,30*Math.min(k,1.35),12*k,700);txt(ctx,main,28+lw+18,47,{s:z,w:700,b:'middle'});
  if(sub)txt(ctx,sub,772,47,{s:12*k,c:P['cv-soft'],a:'right',b:'middle'});}
function drawFlow(sim,ctx,k){const st=sim.st,q=st.q,P=PAL;if(!q)return;const c=q.c,small=k>1.3;
  const prompt=q.dir==='f2n'?CL.fmt(c.formula)+(c.kind==='acid'?'(aq)':''):c.name;
  drawBanner(ctx,k,q.dir==='f2n'?'Name it:':'Formula?',q.done?prompt+'  →  '+(q.dir==='f2n'?c.name:CL.fmt(c.formula)):prompt,small?'':(st.tries?st.right+' of '+st.tries+' correct':''));
  const shown=q.done?q.path.length:Math.min(q.hint,q.steps.length);let li=-1;q.steps.slice(0,shown).forEach(s=>{li=Math.max(li,q.path.indexOf(s.n));});const lit=new Set(q.path.slice(0,li+1));if(q.done)q.path.forEach(n=>lit.add(n));
  const bad=q.done&&q.res&&!q.res.ok&&!q.res.shown?q.res.node:null;const okAll=q.done&&q.res&&q.res.ok;
  const showHyd=atLeast('honors');
  // edges
  EDGES.forEach(([a,b])=>{if((a==='bal'&&b==='hyd'&&!showHyd))return;const pts=edgePts(a,b),on=lit.has(a)&&lit.has(b)&&edgeOn(q.path,a,b);
    const col=on?(okAll||!bad?P['s3']:P['s3']):P['line'];arrowTo(ctx,pts[0][0],pts[0][1],pts[1][0],pts[1][1],on?P['s3']:P['cv-soft'],on?3.5:1.6);
    const L=EDGE_LBL[a+'>'+b];if(L){const mx=(pts[0][0]+pts[1][0])/2,my=(pts[0][1]+pts[1][1])/2;const lab=small&&L[1]==='yes: ionic'?'yes':L[1];
      ctx.font='700 '+12*k+'px '+FONT;const w=ctx.measureText(lab).width+8;const lx=a==='q5'&&b==='oxy'?mx-w/2-6:mx+L[0]*(w/2+4);const ly=a==='q5'&&b==='oxy'?NODES.bin.y+NODES.bin.h/2+(NODES.oxy.y-NODES.oxy.h/2-NODES.bin.y-NODES.bin.h/2)/2:my;
      rr(ctx,lx-w/2,ly-8*k,w,16*k,5);ctx.fillStyle=P['cv-bg'];ctx.fill();txt(ctx,lab,lx,ly+1,{s:12*k,w:700,c:on?P['s3']:P['cv-soft'],a:'center',b:'middle'});}});
  // nodes
  Object.keys(NODES).forEach(id=>{const n=NODES[id];if(n.lvl&&!atLeast(n.lvl))return;const x=n.x-n.w/2,y=n.y-n.h/2,on=lit.has(id),isBad=bad===id,next=!q.done&&q.steps[shown]&&q.steps[shown].n===id&&shown>0;
    rr(ctx,x,y,n.w,n.h,9);ctx.fillStyle=isBad?'#b3261e':on?'#1b7339':P['card'];ctx.fill();ctx.lineWidth=isBad||on?2.5:1.2;ctx.strokeStyle=isBad?'#b3261e':on?'#1b7339':P['line'];ctx.stroke();
    if(next){ctx.setLineDash([5,4]);ctx.strokeStyle=P['s4'];ctx.lineWidth=2.5;rr(ctx,x-4,y-4,n.w+8,n.h+8,11);ctx.stroke();ctx.setLineDash([]);}
    const ink=isBad||on?'#ffffff':P['cv-ink'];const label=small?n.s:n.t;let fs=small?12*k:13*k;let lines=wrapLines(ctx,label,n.w-14,fs,small?700:500);
    while(lines.length*fs*1.18>n.h-6&&fs>12*k*0.999&&!small){fs-=0.5;lines=wrapLines(ctx,label,n.w-14,fs,500);}
    if(small&&lines.length*fs*1.15>n.h-4){lines=wrapLines(ctx,label,n.w-8,fs,700);}
    const lh=fs*1.16,y0=n.y-(lines.length-1)*lh/2;lines.forEach((ln,i)=>txt(ctx,ln,n.x,y0+i*lh+1,{s:fs,w:small?700:(on||isBad?600:500),c:ink,a:'center',b:'middle'}));});
  // column tags
  if(!small){txt(ctx,'IONIC',18,163,{s:12*k,w:800,c:P['cv-soft']});txt(ctx,'NOT IONIC',782,163,{s:12*k,w:800,c:P['cv-soft'],a:'right'});}
  // prefix reference
  {const B=PREFBOX;rr(ctx,B.x,B.y,B.w,B.h,10);ctx.fillStyle=P['card2'];ctx.fill();ctx.strokeStyle=P['line'];ctx.lineWidth=1;ctx.stroke();
    const fs=small?12*k:13*k;const list=PREF.slice(1).map((p,i)=>(i+1)+' '+p).join(' · ');const lines=wrapLines(ctx,'Prefixes: '+list,B.w-20,fs,600);
    const lh=fs*1.2,y0=B.y+B.h/2-(lines.length-1)*lh/2;lines.slice(0,4).forEach((ln,i)=>txt(ctx,ln,B.x+10,y0+i*lh+1,{s:fs,w:600,c:P['cv-ink'],b:'middle'}));}
  // status strip
  let msg='',col=P['cv-soft'];
  if(q.done&&q.res){if(q.res.ok){msg='Correct. The green path is the route you took.';col=P['s3'];}else if(q.res.shown){msg='Answer shown. Follow the green path.';}else{msg='Not quite. Red box: '+(NODE_SHORT[q.res.node]||'check the rules');col=P['s1'];}}
  else if(shown)msg='Hint '+shown+' of '+q.steps.length+'. The dashed box is the next step.';else msg=small?'Answer below the stage, or press Hint.':'Answer at the right, or press Hint to light up one step at a time.';
  rr(ctx,12,596,776,36,10);ctx.fillStyle=P['card'];ctx.fill();const z=fitText(ctx,msg,760,14*k,12*k,700);txt(ctx,msg,400,615,{s:z,w:700,c:col,a:'center',b:'middle'});}
function drawDrill(sim,ctx,k){const st=sim.st,d=st.d,P=PAL;if(!d)return;const ion=d.ion,small=k>1.3;
  const prompt=d.dir==='f2n'?CL.fmt(ion.f,ion.q):ion.name;drawBanner(ctx,k,d.dir==='f2n'?'Name this ion:':'Formula and charge:',d.done?prompt+'  =  '+(d.dir==='f2n'?ion.name:CL.fmt(ion.f,ion.q)):prompt,small?'':(st.tries?st.right+' of '+st.tries+' correct':''));
  // ion picture (always for formula→name; after answering for name→formula)
  const showPic=d.dir==='f2n'||d.done;const cx=small?400:250,cy=small?205:230;
  rr(ctx,12,92,small?776:476,small?232:290,12);ctx.fillStyle=P['card2'];ctx.fill();
  if(showPic){const sc=small?1.6:1.75;drawIon(ctx,ion.f,ion.q,cx,cy,sc,k);txt(ctx,'Ball model: '+Object.entries(CL.parse(ion.f)).map(([s,n])=>n+' '+s).join(', '),cx,small?312:368,{s:12*k,c:P['cv-soft'],a:'center'});}
  else{txt(ctx,'?',cx,cy,{s:80,w:800,c:P['cv-soft'],a:'center',b:'middle'});txt(ctx,'The picture appears after you answer.',cx,small?300:350,{s:12*k,c:P['cv-soft'],a:'center'});}
  // family ladder
  const fam=familyOf(ion);const fx=small?12:500,fy=small?336:92,fw=small?776:288,fh=small?110:290;
  rr(ctx,fx,fy,fw,fh,12);ctx.fillStyle=P['card'];ctx.fill();ctx.strokeStyle=P['line'];ctx.lineWidth=1;ctx.stroke();
  if(fam&&fam.length>1&&d.done){txt(ctx,'Oxyanion family',fx+14,fy+20*Math.min(k,1.2),{s:13*k,w:700,c:P['cv-soft']});
    const rows=fam.length,rh=small?(fh-34)/rows:(fh-50)/rows;fam.forEach((a,i)=>{const y=fy+(small?30:44)+i*rh+rh/2,me=a===ion;
      if(me){rr(ctx,fx+8,y-rh/2+2,fw-16,rh-4,8);ctx.fillStyle='#1b7339';ctx.fill();}
      const ink=me?'#fff':P['cv-ink'];txt(ctx,CL.fmt(a.f,a.q),fx+20,y+1,{s:Math.min(16*k,rh*0.7),w:700,c:ink,b:'middle'});txt(ctx,a.name,fx+fw-16,y+1,{s:Math.min(14*k,rh*0.62),w:me?700:500,c:ink,a:'right',b:'middle'});});}
  else{const lines=wrapLines(ctx,d.done?(ion.q>0?'One of the few positive polyatomic ions. It pairs with anions just like a metal ion does.':'This ion has no -ate/-ite family partner in the drill. Memorize it on its own.'):'Answer to see where this ion fits in its family.',fw-28,13*k,500);
    lines.forEach((ln,i)=>txt(ctx,ln,fx+14,fy+28+i*16*k,{s:13*k,c:P['cv-soft']}));}
  // progress: chips on wide screens, a bar on phones
  const pool=drillPool(sim.p),top=small?470:408;const nk=pool.filter(a=>(st.known[a.f]||0)>=1).length,nm=pool.filter(a=>(st.known[a.f]||0)<0).length;
  txt(ctx,'Your progress in this set: '+nk+' of '+pool.length+' answered right',14,top-10,{s:12*k,w:700,c:P['cv-soft']});
  if(small){const bw=776,by=top+6;rr(ctx,12,by,bw,40,10);ctx.fillStyle=P['card'];ctx.fill();ctx.strokeStyle=P['line'];ctx.stroke();
    const seg=bw/pool.length;pool.forEach((a,i)=>{const kn=st.known[a.f]||0;if(!kn)return;ctx.fillStyle=kn>=1?'#1b7339':'#b3261e';ctx.fillRect(12+i*seg+1,by+3,seg-2,34);});
    txt(ctx,nm?nm+' to review (red)':'Red marks an ion to review.',14,by+70,{s:12*k,c:P['cv-soft']});
    const i=pool.indexOf(ion);if(i>=0){ctx.strokeStyle=P['s4'];ctx.lineWidth=3;ctx.strokeRect(12+i*seg,by,seg,40);}return;}
  const cols=10,cw=776/cols,rows=Math.ceil(pool.length/cols),chh=Math.min(40,(636-top)/rows-6);
  pool.forEach((a,i)=>{const r=Math.floor(i/cols),cI=i%cols,x=12+cI*cw,y=top+r*(chh+6);const kn=st.known[a.f]||0;
    rr(ctx,x+3,y,cw-6,chh,8);ctx.fillStyle=kn>=1?'#1b7339':kn<0?'#b3261e':P['card'];ctx.fill();ctx.strokeStyle=a===ion?P['s4']:P['line'];ctx.lineWidth=a===ion?3:1;ctx.stroke();
    const lab=kn!==0?CL.fmt(a.f,a.q):'?';const z=fitText(ctx,lab,cw-12,14*k,12*k,700);txt(ctx,lab,x+cw/2,y+chh/2+1,{s:z,w:700,c:kn!==0?'#fff':P['cv-soft'],a:'center',b:'middle'});});}

BioLab.register(SIM);
/* expose the model for testing in Node */
if(typeof window!=='undefined')window.__namingModel={mkIonic,mkMol,mkAcid,hydrate,catBySym,anionByF,checkName,checkFormula,choicesFor,genCompound,CAT1,CAT2,MONO,PA,MOLS,HYD,ACIDS,steps,pathFor,checkIon,ionFormulaNorm,allowed,NH4,HG2,COMMON,mkCommon,ionChoices,POSIONS,familyOf,acidName};
})();
