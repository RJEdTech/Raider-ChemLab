/* ============================================================
   Naming story pilot · Raider ChemLab · RJ Ed Tech
   "One letter apart": why some names count (dinitrogen monoxide)
   and others do not (magnesium chloride).
   One idea: a name only has to say what you could not work out.
   Ions are drawn to scale from ionic radii (pm): Na+ 102, Mg2+ 72,
   Al3+ 54, Ca2+ 100, Fe2+ 78, Fe3+ 65, Cl- 181, O2- 140.
   ============================================================ */
const SITE='ChemLab',PAGE='naming-story',KEY='rjchemlab-namestory-v1',EVB='naming',EVT='Naming story';
const LW=1000,LH=560;
const cv=$('#stage'),ctx=cv.getContext('2d');let PX=1;
const W=new World();
let S={guess:{},sketch:[],text:'',name:'',seen:{},named:[0,0,0,0],miss:0};
try{Object.assign(S,JSON.parse(localStorage.getItem(KEY)||'{}'))}catch(e){}
try{S.name=localStorage.getItem('raider-labs-name')||S.name||''}catch(e){}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}};
let cur=0,st={},paused=false,lastCap='';
const NOWORLD=()=>true,PAUSEOK=()=>false,settled=()=>true;

/* ---------- the pieces ---------- */
Object.assign(GEO,{NO3:{at:[['N',0,0],['O',0,-1.24],['O',1.074,.62],['O',-1.074,.62]],bd:[[0,1],[0,2],[0,3]]},
  SO4:{at:[['S',0,0],['O',-.86,-.86],['O',.86,-.86],['O',-.86,.86],['O',.86,.86]],bd:[[0,1],[0,2],[0,3],[0,4]]},
  OH:{at:[['O',-.3,0],['H',.66,0]],bd:[[0,1]]},
  N2O:{at:[['N',-1.16,0],['N',-.03,0],['O',1.16,0]],bd:[[0,1],[1,2]]},NO:{at:[['N',-.575,0],['O',.575,0]],bd:[[0,1]]},
  CO2:{at:[['C',0,0],['O',-1.16,0],['O',1.16,0]],bd:[[0,1],[0,2]]},
  N2O3:{at:[['N',-.93,0],['N',.93,0],['O',-1.6,-.98],['O',1.56,-1.03],['O',1.56,1.03]],bd:[[0,1],[0,2],[1,3],[1,4]]},
  N2O5:{at:[['O',0,-.4],['N',-1.2,.3],['N',1.2,.3],['O',-1.9,-.66],['O',-1.6,1.42],['O',1.9,-.66],['O',1.6,1.42]],bd:[[0,1],[0,2],[1,3],[1,4],[2,5],[2,6]]}});
const ION={Na:{sym:'Na',name:'sodium',q:1,r:102,col:'#8e5bd6'},Mg:{sym:'Mg',name:'magnesium',q:2,r:72,col:'#2f9e58'},Al:{sym:'Al',name:'aluminum',q:3,r:54,col:'#7d8794'},Ca:{sym:'Ca',name:'calcium',q:2,r:100,col:'#2a9d8f'},
  Fe2:{sym:'Fe',name:'iron',q:2,r:78,col:'#c7622b',rom:'II'},Fe3:{sym:'Fe',name:'iron',q:3,r:65,col:'#a8431c',rom:'III'},
  Cl:{sym:'Cl',name:'chloride',q:-1,r:181,col:'#3aa655'},O:{sym:'O',name:'oxide',q:-2,r:140,col:'#d92f45'},
  NO3:{sym:'NO₃',name:'nitrate',q:-1,geo:'NO3',poly:1},SO4:{sym:'SO₄',name:'sulfate',q:-2,geo:'SO4',poly:1},OH:{sym:'OH',name:'hydroxide',q:-1,geo:'OH',poly:1}};
const FACT={'NaCl':'Table salt.','MgCl₂':'Sprayed on Colorado roads to melt ice.','Al₂O₃':'The hard skin on a soda can. Also ruby and sapphire.','FeO':'A black powder.','Fe₂O₃':'Rust.','MgO':'Used in fireproof bricks.','Na₂O':'Used in making glass.',
  'Ca(NO₃)₂':'A fertilizer.','NaNO₃':'A fertilizer.','Al(NO₃)₃':'Used in tanning leather.','CaSO₄':'Drywall and plaster.','Na₂SO₄':'Used in laundry detergent.','Al₂(SO₄)₃':'Used to clean drinking water.','NaOH':'Lye: drain cleaner.','Ca(OH)₂':'Slaked lime, used in cement.','Al(OH)₃':'An antacid.','CaCl₂':'Ice melt for sidewalks.'};
const PM=.3,CH=q=>{const n=Math.abs(q);return (n>1?n:'')+(q>0?'+':'−')},SUP=q=>{const n=Math.abs(q);return (n>1?'²³⁴'[n-2]:'')+(q>0?'⁺':'⁻')},SUBS=n=>n>1?String(n).split('').map(d=>'₀₁₂₃₄₅₆₇₈₉'[d]).join(''):'',gcd=(a,b)=>b?gcd(b,a%b):a;
function compound(cat,an,c,a){const C=ION[cat],A=ION[an],pos=c*C.q,neg=-a*A.q,ok=c>0&&a>0&&pos===neg,g=ok?gcd(c,a):1,cf=c/g,af=a/g;
  return{C,A,pos,neg,ok,g,f:C.sym+SUBS(cf)+(A.poly&&af>1?'('+A.sym+')':A.sym)+SUBS(af),name:C.name+(C.rom?'('+C.rom+')':'')+' '+A.name}}
function drawIon(I,x,y,hide){const r=I.geo?54:I.r*PM;if(I.geo){drawMol(ctx,I.geo,x,y,0,30,{bonds:true});ctx.strokeStyle=PAL.soft;ctx.lineWidth=2;[-1,1].forEach(s=>{ctx.beginPath();ctx.moveTo(x+s*(r+2),y-r);ctx.lineTo(x+s*(r+8),y-r);ctx.lineTo(x+s*(r+8),y+r);ctx.lineTo(x+s*(r+2),y+r);ctx.stroke()})}
  else{ball(ctx,x,y,r,I.col);if(r>=17)txt(ctx,I.sym,x,y+1,{s:Math.min(24,r*.75),w:700,c:'#fff',a:'center',b:'middle'})}
  txt(ctx,hide?'?':CH(I.q),x+r+(I.geo?12:1),y-r+12,{s:20,w:800,c:hide?PAL.think:PAL.ink});if(!I.geo&&r<17)txt(ctx,I.sym,x,y+r+17,{s:14,w:700,a:'center'})}
const SPOT=[[],[[0,0]],[[-1,0],[1,0]],[[-1,-.9],[1,-.9],[0,.9]],[[-1,-.9],[1,-.9],[-1,.9],[1,.9]]];
function group(I,n,cx,cy,hide){const d=(I.geo?54:Math.max(I.r*PM,18))+17;SPOT[n].forEach(p=>drawIon(I,cx+p[0]*d,cy+p[1]*d,hide))}
const R_B={x:14,y:14,w:612,h:532},R_N={x:638,y:14,w:348,h:532};
/* o: {hideName, hideCat, bars:false, title} */
function sceneIons(o={}){const K=compound(st.cat,st.an,st.c,st.a),C=K.C,A=K.A;card(ctx,R_B,o.title||'Build it');
  txt(ctx,C.name+' ion',R_B.x+170,R_B.y+58,{s:16,w:700,a:'center'});txt(ctx,A.name+' ion',R_B.x+450,R_B.y+58,{s:16,w:700,a:'center'});
  if(st.c)group(C,st.c,R_B.x+170,R_B.y+190,o.hideCat);else txt(ctx,'none yet',R_B.x+170,R_B.y+190,{s:15,c:PAL.soft,a:'center'});
  if(st.a)group(A,st.a,R_B.x+450,R_B.y+190,false);else txt(ctx,'none yet',R_B.x+450,R_B.y+190,{s:15,c:PAL.soft,a:'center'});
  if(o.bars!==false){const U=26,x0=R_B.x+130,row=(y,lab,n,q,col,tot)=>{txt(ctx,lab,R_B.x+22,y+18,{s:15,w:700});let x=x0;for(let i=0;i<n;i++){const w=q*U;rr(ctx,x,y,w-3,U,6);ctx.fillStyle=col;ctx.fill();
        ctx.strokeStyle='rgba(255,255,255,.7)';ctx.lineWidth=2;for(let k=1;k<q;k++){ctx.beginPath();ctx.moveTo(x+k*U-1.5,y+4);ctx.lineTo(x+k*U-1.5,y+U-4);ctx.stroke()}x+=w}
      txt(ctx,tot?tot+(lab[0]==='+'?'+':'−'):'0',Math.max(x+10,x0+10),y+19,{s:19,w:700});return x};
    const y=R_B.y+352,xa=row(y,'+ charge',st.c,C.q,C.col||PAL.split,K.pos),xb=row(y+54,'− charge',st.a,-A.q,A.col||PAL.join,K.neg);
    if(K.ok){ctx.strokeStyle=PAL.good;ctx.lineWidth=3;ctx.setLineDash([6,5]);ctx.beginPath();ctx.moveTo(xa-1,y-10);ctx.lineTo(xa-1,y+92);ctx.stroke();ctx.setLineDash([]);txt(ctx,'Same length: the charges cancel. Neutral.',R_B.x+22,y+134,{s:16.5,w:700,c:PAL.good})}
    else if(st.c||st.a){const net=K.pos-K.neg;txt(ctx,'Not neutral yet: net charge '+Math.abs(net)+(net>0?'+':'−'),R_B.x+22,y+134,{s:16.5,w:700,c:PAL.ink})}}
  card(ctx,R_N,'Formula and name');const x=R_N.x+20,w=R_N.w-40;
  if(o.hideName){txt(ctx,o.f,x,R_N.y+118,{s:54,w:700,max:w});txt(ctx,'Name:',x,R_N.y+176,{s:15,c:PAL.soft});txt(ctx,o.built||'…',x,R_N.y+208,{s:25,w:700,c:o.right?PAL.good:PAL.ink,max:w});if(o.right)txt(ctx,'✓ '+(FACT[o.f]||''),x,R_N.y+244,{s:15.5,c:PAL.good,w:600,max:w});return}
  if(K.ok){txt(ctx,K.f,x,R_N.y+118,{s:54,w:700,max:w});txt(ctx,K.name,x,R_N.y+166,{s:25,w:700,max:w});if(FACT[K.f])txt(ctx,FACT[K.f],x,R_N.y+200,{s:15.5,c:PAL.soft,max:w});
    txt(ctx,(st.c/K.g)+' '+C.name+' for every '+(st.a/K.g)+' '+A.name,x,R_N.y+238,{s:16,w:600,max:w});
    if(K.g>1){txt(ctx,'You built '+st.c+' and '+st.a+'. A formula keeps',x,R_N.y+266,{s:14.5,c:PAL.soft,max:w});txt(ctx,'the simplest ratio.',x,R_N.y+286,{s:14.5,c:PAL.soft})}
    if(C.rom){ctx.fillStyle=C.rom==='II'?'#1f1f22':'#9b3b1e';rr(ctx,x,R_N.y+310,w,70,10);ctx.fill();ctx.strokeStyle=PAL.line;ctx.stroke();txt(ctx,'what it looks like',x,R_N.y+402,{s:13.5,c:PAL.soft});
      txt(ctx,'Fe'+SUP(C.q)+'  →  iron('+C.rom+')',x,R_N.y+450,{s:21,w:700,c:PAL.think})}}
  else{txt(ctx,'?',x,R_N.y+118,{s:54,w:700,c:PAL.soft});txt(ctx,st.c&&st.a?'Not a compound yet.':'Add ions on both sides.',x,R_N.y+166,{s:18,w:600,c:PAL.soft,max:w});txt(ctx,'A compound has no charge left over.',x,R_N.y+196,{s:15,c:PAL.soft,max:w})}}

/* ---------- molecules: the name has to count ---------- */
const PRE=['','mono','di','tri','tetra','penta'],MKEY={'2,1':'N2O','1,1':'NO','1,2':2,'2,3':'N2O3','2,4':4,'2,5':'N2O5'};
const INFO={'2,1':['Laughing gas','The dentist’s gas. Also in whipped-cream cans.'],'1,1':['A signal in your body','Your blood vessels make it to relax and widen. Nobel Prize, 1998.'],'1,2':['Brown and toxic','The brown in smog. It burns lungs.'],
  '2,3':['Deep blue when very cold','A liquid only below about 3 °C.'],'2,4':['Rocket propellant','The one behind the hatch that stayed shut.'],'2,5':['White crystals','Makes nitric acid when it meets water.']};
function molName(n,o){const p=PRE[o],cut=/[ao]$/.test(p)&&p!=='di'&&p!=='tri';return{a:n>1?PRE[n]:'',b:cut?p.slice(0,-1):p,x:cut?p.slice(-1):'',full:(n>1?PRE[n]:'')+'nitrogen '+(cut?p.slice(0,-1):p)+'oxide'}}
function sceneMol(){const n=st.n,o=st.o,k=n+','+o,g=MKEY[k],M=molName(n,o),A={x:14,y:14,w:480,h:532},B={x:506,y:14,w:480,h:532};card(ctx,A,'The molecule, drawn to shape');
  if(g!==undefined){drawMol(ctx,g,A.x+A.w/2,A.y+230,0,g==='N2O5'||g===4?46:56,{bonds:true,label:true,halo:g===2?1:0});txt(ctx,INFO[k][0],A.x+A.w/2,A.y+410,{s:22,w:700,a:'center'});txt(ctx,INFO[k][1],A.x+A.w/2,A.y+440,{s:16,c:PAL.soft,a:'center',max:A.w-30});
    if(g==='N2O3'||g==='N2O5')txt(ctx,'bonds shown; angles approximate',A.x+A.w/2,A.y+500,{s:13,c:PAL.soft,a:'center'})}
  else{for(let i=0;i<n;i++)ball(ctx,A.x+150+i*70,A.y+200,30,PAL.N);for(let i=0;i<o;i++)ball(ctx,A.x+110+i*64,A.y+290,27,PAL.O);txt(ctx,'Not one of the six common nitrogen oxides.',A.x+A.w/2,A.y+410,{s:17,w:600,a:'center',max:A.w-30});txt(ctx,'Try another recipe.',A.x+A.w/2,A.y+438,{s:15.5,c:PAL.soft,a:'center'})}
  card(ctx,B,'The name counts the atoms');const x=B.x+26;txt(ctx,'N'+SUBS(n)+'O'+SUBS(o),x,B.y+112,{s:54,w:700});
  const line=(y,cnt,sym,pre,cutc,word,skip)=>{pill(ctx,cnt+' '+sym,x,y-46,PAL.think,'#fff',14);ctx.font=`700 36px ${FONT}`;let xx=x;
    if(skip){ctx.fillStyle=PAL.soft;ctx.fillText('mono',xx,y);const ww=ctx.measureText('mono').width;ctx.strokeStyle=PAL.soft;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(xx-2,y-12);ctx.lineTo(xx+ww+2,y-12);ctx.stroke();xx+=ww+6}
    ctx.textAlign='left';ctx.textBaseline='alphabetic';ctx.fillStyle=PAL.think;ctx.fillText(pre,xx,y);xx+=ctx.measureText(pre).width;
    if(cutc){ctx.fillStyle=PAL.soft;ctx.fillText(cutc,xx,y);const ww=ctx.measureText(cutc).width;ctx.strokeStyle=PAL.bad;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(xx-1,y-24);ctx.lineTo(xx+ww+1,y-2);ctx.stroke();xx+=ww}
    ctx.fillStyle=PAL.ink;ctx.fillText(word,xx,y)};
  line(B.y+228,n,n===1?'nitrogen':'nitrogens',M.a,'','nitrogen',n===1);line(B.y+338,o,o===1?'oxygen':'oxygens',M.b,M.x,'oxide',false);
  txt(ctx,'Say it: '+M.full,x,B.y+400,{s:19,w:700,c:g!==undefined?PAL.good:PAL.soft,max:B.w-50});
  txt(ctx,'1 mono · 2 di · 3 tri · 4 tetra · 5 penta',x,B.y+456,{s:15.5,c:PAL.soft});txt(ctx,'The first word skips “mono.” A prefix drops',x,B.y+486,{s:14,c:PAL.soft});txt(ctx,'its last a or o before “oxide.”',x,B.y+505,{s:14,c:PAL.soft})}
function sceneThree(t){const D=[['N2O','N₂O','The dentist’s gas','Calms you in the chair.'],['NO','NO','A signal in your body','Opens your blood vessels. Nobel Prize, 1998.'],[2,'NO₂','A brown poison','The brown in smog. Burns lungs.']];
  D.forEach((d,i)=>{const r={x:20+i*326,y:30,w:308,h:500};card(ctx,r);drawMol(ctx,d[0],r.x+r.w/2,r.y+170,RM?0:Math.sin(t*.7+i)*.12,50,{bonds:true,label:true,halo:d[0]===2?1:0});
    txt(ctx,d[1],r.x+r.w/2,r.y+330,{s:50,w:700,a:'center'});txt(ctx,d[2],r.x+r.w/2,r.y+384,{s:21,w:700,a:'center',max:r.w-24});txt(ctx,d[3],r.x+r.w/2,r.y+414,{s:15.5,c:PAL.soft,a:'center',max:r.w-24});
    pill(ctx,st.names?molName(i===0?2:1,i===2?2:1).full:'name: ?',r.x+r.w/2,r.y+462,st.names?PAL.good:PAL.think,'#fff',15,'center')})}

/* ---------- name it: tiles ---------- */
const ITEMS=[{f:'CaCl₂',ans:'calcium chloride',ion:['Ca','Cl',1,2],tiles:['calcium','chloride','chlorine','di-','mono-','(II)']},
 {f:'Fe₂O₃',ans:'iron(III) oxide',ion:['Fe3','O',2,3],tiles:['(II)','(III)','di-','iron','oxide','tri-']},
 {f:'CO₂',ans:'carbon dioxide',mol:'CO2',tiles:['(IV)','carbon','di-','mono-','oxide','oxygen']},
 {f:'Al(NO₃)₃',ans:'aluminum nitrate',ion:['Al','NO3',1,3],tiles:['(III)','aluminum','nitrate','nitride','nitrogen','tri-']}];
const joinT=a=>{let s='';a.forEach(t=>{if(t[0]==='(')s+=t;else if(s.slice(-1)==='-')s=s.slice(0,-1)+t;else s+=(s?' ':'')+t});return s.replace(/-$/,'')};
function hint(it,ch){const has=t=>ch.includes(t),pre=ch.some(t=>t.slice(-1)==='-'),rom=ch.find(t=>t[0]==='(');
  if(it.mol){if(rom)return 'There is no metal here, so there are no ion charges and no Roman numeral.';if(has('oxygen'))return 'The second part changes its ending: oxygen becomes oxide.';if(has('mono-')&&ch.indexOf('mono-')<ch.indexOf('carbon'))return 'The first word skips “mono.” Only count the oxygens.';
    if(!has('di-'))return 'Two nonmetals share electrons, so nothing forces the recipe. The name has to count the oxygens: two.';return 'Almost. Put the count right in front of the part it counts.'}
  const C=ION[it.ion[0]];if(pre)return 'A metal is in it, so it is made of ions. Their charges already force the recipe, so the name does not count.';
  if(has('chlorine'))return 'The second part changes its ending: chlorine becomes chloride.';if(has('nitride')||has('nitrogen'))return 'NO₃ is a team with its own name: nitrate.';
  if(C.rom){if(!rom)return 'Iron can be 2+ or 3+, so the name has to say which. Three O²⁻ make 6−. What must each of the two irons be?';if(rom!=='('+C.rom+')')return 'Check the charges. Three O²⁻ make 6−, shared by two irons: 3+ each.'}
  else if(rom)return C.name[0].toUpperCase()+C.name.slice(1)+' is always '+C.q+'+, so the name does not need a Roman numeral.';
  return 'Not yet. Name the metal first, then the other part.'}
function sceneName(){const it=ITEMS[st.i],built=joinT((st.sel||[]).map(k=>it.tiles[k])),right=!!S.named[st.i];
  if(it.ion){[st.cat,st.an,st.c,st.a]=it.ion;sceneIons({hideName:true,hideCat:!!ION[it.ion[0]].rom,bars:false,title:'Compound '+(st.i+1)+' of 4',f:it.f,built:right?it.ans:built,right})}
  else{card(ctx,R_B,'Compound '+(st.i+1)+' of 4');drawMol(ctx,it.mol,R_B.x+R_B.w/2,R_B.y+230,0,58,{bonds:true,label:true});txt(ctx,'carbon and oxygen: two nonmetals, sharing electrons',R_B.x+R_B.w/2,R_B.y+400,{s:16,c:PAL.soft,a:'center',max:R_B.w-30});
    card(ctx,R_N,'Formula and name');const x=R_N.x+20,w=R_N.w-40;txt(ctx,it.f,x,R_N.y+118,{s:54,w:700});txt(ctx,'Name:',x,R_N.y+176,{s:15,c:PAL.soft});txt(ctx,right?it.ans:(built||'…'),x,R_N.y+208,{s:25,w:700,c:right?PAL.good:PAL.ink,max:w});if(right)txt(ctx,'✓ What you breathe out.',x,R_N.y+244,{s:15.5,c:PAL.good,w:600})}}

/* ---------- captions and steps ---------- */
const CAP={
 ion0:'Start with ions: atoms that lost or gained electrons, so they carry a charge. Opposite charges pull together until they cancel. <b>Add chloride ions until the charges cancel.</b>',
 ion1:'One sodium, one chloride: NaCl, sodium chloride. Table salt. <b>Now switch the metal to magnesium and balance it again.</b>',
 ion2:'Magnesium is 2+, so it takes two chlorides. Nobody chose the 2. The charges forced it. So the name is just magnesium chloride. No numbers needed.',
 al0:'Harder: aluminum is 3+ and oxide is 2−. <b>Add ions on both sides until the two bars are the same length.</b>',
 al1:'Two aluminums make 6+. Three oxides make 6−. Al₂O₃ is aluminum oxide: the hard skin on a soda can, and the crystal in a ruby. <b>One question about its name.</b>',
 al2:'Right. The charges force 2 and 3, so the name does not have to say them. Anyone who knows the charges can work out the recipe.',
 al2x:'The charges force 2 and 3, so the name does not have to say them. Anyone who knows the charges can work out the recipe.',
 fe0:'Some metals can form more than one ion. Iron can be 2+ or 3+. Then the charges alone cannot tell you the recipe, so the name must. <b>Build both iron oxides.</b>',
 fe1:'Iron(II) oxide is FeO, a black powder. Iron(III) oxide is Fe₂O₃: rust. The Roman numeral is the iron’s charge. It is the one thing you could not work out yourself.',
 team0:'Some ions are a team of atoms that travel together with one charge. Nitrate, NO₃⁻, is one. <b>Balance calcium with nitrate.</b>',
 team1:'Calcium is 2+, so it takes two nitrates. The parentheses mean two whole teams: Ca(NO₃)₂, calcium nitrate. The name still needs no numbers. <b>Try other pairs.</b>',
 mol0:'Nitrogen and oxygen are both nonmetals. They share electrons, so there are no charges to force a recipe. Many recipes are real, so the name has to <b>count</b>. <b>Build the dentist’s gas, N₂O.</b>',
 mol1:'Two nitrogens: <b>di</b>nitrogen. One oxygen: <b>mon</b>oxide. Dinitrogen monoxide. <b>Now build other recipes.</b>',
 mol2:'Each recipe is a different substance, so each count goes into the name. One oxygen more or less is the difference between a calming gas and a poison.',
 nm0:'Your turn. Four compounds. First decide: is a metal in it, so it is made of ions? Or is it two nonmetals sharing? Then <b>tap tiles to build its name.</b>',
 nm1:'All four. A metal in it: name the ions, and add a Roman numeral only if the metal has a choice. Two nonmetals: count with prefixes.'};
const PARTS=['Three gases','Ions','A choice','Teams','Counting','Name it','Your turn'];
const esc=s=>String(s||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function picks(key,q,opts,right,after){const g=S.guess[key];if(after&&g!==undefined)return `<p class="note">Your guess: <b>${opts[g].toLowerCase()}</b> <span class="chip ${g===right?'ok':'no'}">${g===right?'✓ matched':'✗ not this time'}</span></p>`;
  return `<div class="pick" data-key="${key}"><p class="q">${q}</p><div class="row">${opts.map((o,i)=>`<button type="button" class="btn opt${g===i?' on':''}" data-i="${i}" aria-pressed="${g===i}">${o}</button>`).join('')}</div></div>`}
function bindPicks(root,fn){$$('.pick .opt',root).forEach(b=>b.addEventListener('click',()=>{const k=b.closest('.pick').dataset.key;S.guess[k]=+b.dataset.i;save();ev('guess-'+k+'-'+b.dataset.i);fn&&fn(k,+b.dataset.i);renderCtl()}))}
const chips=(lab,attr,list,curv)=>`<div class="row"><span class="lab">${lab}</span>${list.map(([v,l])=>`<button type="button" class="btn${curv===v?' on':''}" data-${attr}="${v}" aria-pressed="${curv===v}">${l}</button>`).join('')}</div>`;
const lab=k=>ION[k].sym+SUP(ION[k].q);
const pm=(key,k,val)=>`<div class="row pm"><button type="button" class="btn" data-pm="${key}" data-d="-1" aria-label="Remove one ${ION[k].name} ion">−</button><b>${val} × ${lab(k)}</b><button type="button" class="btn" data-pm="${key}" data-d="1" aria-label="Add one ${ION[k].name} ion">+</button><span class="lab">${ION[k].name}</span></div>`;
const builder=()=>pm('c',st.cat,st.c)+pm('a',st.an,st.a);
function bindBuilder(r,after){$$('[data-pm]',r).forEach(b=>b.addEventListener('click',()=>{const k=b.dataset.pm;st[k]=clamp(st[k]+(+b.dataset.d),0,4);after&&after();renderCtl()}))}
const NAMES=['nitrogen oxide','dinitrogen monoxide','nitrogen dioxide'];

const STEPS=[
 {part:0,title:'One letter apart',
  cap:'Three gases, each made of only nitrogen and oxygen. One is the dentist’s gas. One is a signal your own blood vessels make. One is brown and burns your lungs. The name has to tell them apart.',
  alt:'Think of three medicine bottles with nearly the same label. The name is the only thing that tells you which one you are holding.',
  aria:'Three molecules side by side: N2O, the dentist’s gas; NO, a signal in the body; and NO2, a brown poison. Each is labeled name: question mark.',
  draw(){sceneThree(st.t)},ctl(){return picks('n2o','The dentist’s gas is N₂O. Guess its name.',NAMES)+(S.guess.n2o!==undefined?'<p class="note">Locked in. You will test it in Part 5.</p>':'')},bind(r){bindPicks(r,()=>markDone())}},
 {part:1,title:'Charges that cancel',cap:CAP.ion0,
  alt:'Each + needs one − to cancel it, like owing and paying back. A 2+ ion owes two, so it needs two 1− ions.',
  aria:'A sodium ion with a 1 plus charge and chloride ions with a 1 minus charge, drawn to scale. Two bars compare the total plus charge with the total minus charge. When the bars are the same length the formula and name appear.',
  enter(){st.cat='Na';st.an='Cl';st.c=1;st.a=0},
  tick(){const K=compound(st.cat,st.an,st.c,st.a);if(st.cat==='Na'&&K.ok&&!st.s1){st.s1=true;cap(CAP.ion1);renderCtl()}if(st.cat==='Mg'&&K.ok&&!st.s2){st.s2=true;cap(CAP.ion2);markDone()}},
  draw(){sceneIons()},ctl(){return (st.s1?chips('Metal:','cat',[['Na','Na⁺ sodium'],['Mg','Mg²⁺ magnesium']],st.cat):'')+builder()},
  bind(r){bindBuilder(r);$$('[data-cat]',r).forEach(b=>b.addEventListener('click',()=>{st.cat=b.dataset.cat;st.c=1;st.a=0;renderCtl()}))}},
 {part:1,title:'Build aluminum oxide',cap:CAP.al0,
  alt:'Find a number that both 3 and 2 go into: 6. Two 3s make 6. Three 2s make 6. So two aluminums and three oxides.',
  aria:'Aluminum ions with a 3 plus charge and oxide ions with a 2 minus charge. The plus bar and the minus bar match at 6 when there are two aluminum ions and three oxide ions, giving Al2O3, aluminum oxide.',
  enter(){st.cat='Al';st.an='O';st.c=1;st.a=1},
  tick(){const K=compound(st.cat,st.an,st.c,st.a);if(K.ok&&!st.s1){st.s1=true;cap(S.guess.why===undefined?CAP.al1:CAP.al2x);if(S.guess.why!==undefined)markDone();renderCtl()}},
  draw(){sceneIons()},ctl(){return builder()+(st.s1?picks('why','Why is it not called “dialuminum trioxide”?',['The charges already force 2 and 3','Aluminum is a special case','It is. Both names are used'],0,S.guess.why!==undefined):'')},
  bind(r){bindBuilder(r);bindPicks(r,(k,i)=>{cap(i===0?CAP.al2:CAP.al2x);markDone()})}},
 {part:2,title:'When the metal has a choice',cap:CAP.fe0,
  alt:'Sodium is always 1+, so the word “sodium” says everything. Iron has two settings, so its name carries a label: (II) or (III).',
  aria:'Iron ions, either 2 plus or 3 plus, with oxide ions. Iron 2 plus makes FeO, iron(II) oxide, shown as a black swatch. Iron 3 plus makes Fe2O3, iron(III) oxide, shown as a rust-red swatch.',
  enter(){st.cat='Fe2';st.an='O';st.c=1;st.a=0;st.made={}},
  tick(){const K=compound(st.cat,st.an,st.c,st.a);if(K.ok)st.made[st.cat]=1;if(st.made.Fe2&&st.made.Fe3&&!st.s1){st.s1=true;cap(CAP.fe1);markDone()}},
  draw(){sceneIons()},ctl(){return chips('Iron as:','cat',[['Fe2','Fe²⁺'],['Fe3','Fe³⁺']],st.cat)+builder()},
  bind(r){bindBuilder(r);$$('[data-cat]',r).forEach(b=>b.addEventListener('click',()=>{st.cat=b.dataset.cat;st.c=1;st.a=0;renderCtl()}))}},
 {part:3,title:'Ions that travel as a team',cap:CAP.team0,
  alt:'Treat the team as one piece. NO₃ with its 1− charge acts just like a chloride ion. Parentheses are only a way to write “two of this whole piece.”',
  aria:'A calcium ion with a 2 plus charge and nitrate ions, each a nitrogen with three oxygens carrying a 1 minus charge. Two nitrates balance one calcium: Ca(NO3)2, calcium nitrate.',
  enter(){st.cat='Ca';st.an='NO3';st.c=1;st.a=0},
  tick(){const K=compound(st.cat,st.an,st.c,st.a);if(K.ok&&st.cat==='Ca'&&st.an==='NO3'&&!st.s1){st.s1=true;cap(CAP.team1);markDone();renderCtl()}},
  draw(){sceneIons()},ctl(){return (st.s1?chips('Metal:','cat',[['Na','Na⁺'],['Ca','Ca²⁺'],['Al','Al³⁺']],st.cat)+chips('Team:','an',[['NO3','nitrate'],['SO4','sulfate'],['OH','hydroxide']],st.an):'')+builder()},
  bind(r){bindBuilder(r);$$('[data-cat]',r).forEach(b=>b.addEventListener('click',()=>{st.cat=b.dataset.cat;st.c=1;st.a=0;renderCtl()}));$$('[data-an]',r).forEach(b=>b.addEventListener('click',()=>{st.an=b.dataset.an;st.c=1;st.a=0;renderCtl()}))}},
 {part:4,title:'No charges, so the name must count',cap:CAP.mol0,
  alt:'Ions come with a charge that fixes the recipe. Compounds that share electrons do not, so the name works like a parts list: how many of each.',
  aria:'A nitrogen and oxygen molecule drawn to shape, with its name built from prefixes that count the atoms: for example two nitrogens and four oxygens give dinitrogen tetroxide.',
  enter(){st.n=1;st.o=1;st.seen={}},
  tick(){const k=st.n+','+st.o;if(MKEY[k]!==undefined&&st.touched)st.seen[k]=1;if(k==='2,1'&&!st.s1){st.s1=true;cap(CAP.mol1);renderCtl()}if(st.s1&&Object.keys(st.seen).length>=3&&!st.s2){st.s2=true;cap(CAP.mol2);markDone()}},
  draw(){sceneMol()},
  ctl(){const g=S.guess.n2o;return (st.s1&&g!==undefined?`<p class="note">Your guess: <b>${NAMES[g]}</b> <span class="chip ${g===1?'ok':'no'}">${g===1?'✓ matched':'✗ not this time'}</span></p>`:'')+chips('Nitrogens:','n',[[1,'1'],[2,'2']],st.n)+chips('Oxygens:','o',[[1,'1'],[2,'2'],[3,'3'],[4,'4'],[5,'5']],st.o)},
  bind(r){$$('[data-n]',r).forEach(b=>b.addEventListener('click',()=>{st.n=+b.dataset.n;st.touched=true;renderCtl()}));$$('[data-o]',r).forEach(b=>b.addEventListener('click',()=>{st.o=+b.dataset.o;st.touched=true;renderCtl()}))}},
 {part:5,title:'Name it',cap:CAP.nm0,
  alt:'Look for a metal first. If there is one, the charges do the counting for you. If there is none, you have to count in the name.',
  aria:'A compound to name, shown as its ions or its molecule beside its formula. You build the name from word tiles.',
  enter(){st.i=Math.max(0,S.named.findIndex(v=>!v));if(S.named.every(v=>v)){st.i=3;cap(CAP.nm1)}st.sel=[]},
  draw(){sceneName()},
  ctl(){const it=ITEMS[st.i],done=S.named.every(v=>v),solved=S.named[st.i];
    return `<div class="row">${ITEMS.map((q,i)=>`<button type="button" class="btn sm${i===st.i?' on':''}" data-item="${i}">${S.named[i]?'✓ ':''}${q.f}</button>`).join('')}</div>`+
    (solved?`<p class="fb ok" role="status">${it.ans} ✓</p>`:`<div class="row tiles">${it.tiles.map((t,k)=>`<button type="button" class="btn tile" data-tile="${k}" ${st.sel.includes(k)?'disabled':''}>${t}</button>`).join('')}</div><div class="row"><button type="button" class="btn" data-undo="1" ${st.sel.length?'':'disabled'}>Undo</button><button type="button" class="btn primary" data-check="1" ${st.sel.length?'':'disabled'}>Check</button></div><p class="fb no" role="status">${st.fb||''}</p>`)+(done?'':'')},
  bind(r){$$('[data-item]',r).forEach(b=>b.addEventListener('click',()=>{st.i=+b.dataset.item;st.sel=[];st.fb='';renderCtl()}));$$('[data-tile]',r).forEach(b=>b.addEventListener('click',()=>{st.sel.push(+b.dataset.tile);st.fb='';renderCtl()}));
    const u=$('[data-undo]',r);u&&u.addEventListener('click',()=>{st.sel.pop();st.fb='';renderCtl()});const c=$('[data-check]',r);c&&c.addEventListener('click',()=>{const it=ITEMS[st.i],ch=st.sel.map(k=>it.tiles[k]);
      if(joinT(ch)===it.ans){S.named[st.i]=1;save();ev('name-right-'+(st.i+1));st.sel=[];st.fb='';const nx=S.named.findIndex(v=>!v);if(nx<0){cap(CAP.nm1);markDone()}else setTimeout(()=>{if(cur===6){st.i=nx;st.sel=[];renderCtl()}},1400)}
      else{S.miss++;save();ev('name-wrong-'+(st.i+1));st.fb=hint(it,ch);st.sel=[]}renderCtl()})}},
 {part:6,wide:true,title:'Now tell it back',
  cap:'Back to the three gases: dinitrogen monoxide, nitrogen monoxide, nitrogen dioxide. You can now read each recipe off its name. <b>Explain the rule in your own words.</b>',
  alt:'Start with table salt and why its name has no numbers. Then say what is different when two nonmetals share electrons.',
  aria:'The three gases again, now labeled with their names: dinitrogen monoxide, nitrogen monoxide and nitrogen dioxide.',
  enter(){st.names=true},draw(){sceneThree(st.t)},
  ctl(){return `<div class="tell"><h3>1. Say it in your own words</h3><p class="q">Why does CO₂ need “di” in its name when MgCl₂ does not? Use the words <b>ions</b>, <b>charge</b> and <b>count</b>.</p>
  <textarea id="tx" rows="4" placeholder="Type your explanation here.">${esc(S.text)}</textarea>
  <h3>2. Turn it in</h3><p class="q">If your teacher assigned this, copy your work and paste it into the Canvas text box.</p>
  <div class="row"><label class="nm">Name <input id="nm" type="text" value="${esc(S.name)}" autocomplete="name"></label><button type="button" class="btn primary" id="copy">Copy for Canvas</button><span id="cmsg" role="status"></span></div>
  <div class="world"><h3>Why one letter matters</h3><p>In 1998 three scientists won the Nobel Prize for showing that NO, nitrogen monoxide, is a signal your body uses to relax blood vessels. Heart medicines work by releasing it. Add one oxygen and you have NO₂, a poison. The name is how a chemist, a pharmacist or a firefighter knows which one is in the tank.</p>
  <p><a href="https://rjedtech.github.io/Raider-ChemLab/index.html#naming">Practice more names in the naming trainer.</a> More stories: <a href="https://rjedtech.github.io/Raider-ChemLab/equilibrium-story.html">The hatch that stayed shut</a> (what N₂O₄ does in a rocket) and <a href="https://rjedtech.github.io/Raider-ChemLab/pressure-story.html">The bag that swells</a> (gas pressure).</p></div></div>`},
  bind(r){const tx=$('#tx',r),nm=$('#nm',r);tx.addEventListener('input',()=>{S.text=tx.value;save()});nm.addEventListener('input',()=>{S.name=nm.value;try{localStorage.setItem('raider-labs-name',nm.value)}catch(e){}save()});
    $('#copy',r).addEventListener('click',()=>{const g=S.guess,L=['Raider ChemLab · Naming story: One letter apart','Name: '+(S.name||'(not given)'),'',
      'Guess 1, the name of N2O: '+(g.n2o===undefined?'no guess':NAMES[g.n2o]+(g.n2o===1?' (matched)':' (it is dinitrogen monoxide)')),
      'Why not "dialuminum trioxide": '+(g.why===undefined?'no answer':['the charges already force 2 and 3 (correct)','aluminum is a special case (not the reason)','both names are used (not so)'][g.why]),
      'Named correctly: '+ITEMS.filter((q,i)=>S.named[i]).map(q=>q.ans).join(', ')+(S.named.some(v=>v)?'':'none yet')+' ('+S.named.filter(v=>v).length+' of 4, '+S.miss+' miss'+(S.miss===1?'':'es')+')','','In my own words:',S.text||'(nothing written)'].join('\n');
    const ok=()=>{$('#cmsg').textContent='Copied. Paste it into Canvas.'},fb=()=>{const t=document.createElement('textarea');t.value=L;document.body.appendChild(t);t.select();try{document.execCommand('copy');ok()}catch(e){$('#cmsg').textContent='Could not copy. Select your text and copy it by hand.'}t.remove()};
    if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(L).then(ok,fb);else fb();ev('copy')})}},
];
