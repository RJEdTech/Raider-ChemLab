/* Learn it for Raider ChemLab. See BioLab learn.js for the field reference. */
(function(){
'use strict';
const H=BioLab.h,PAL=H.PAL,clamp=H.clamp;
const ease=x=>x<=0?0:x>=1?1:x*x*(3-2*x);
const lerp=(a,b,f)=>a+(b-a)*f;
function dim(ctx,LH,a){ctx.save();ctx.globalAlpha=a||0.93;ctx.fillStyle=PAL['cv-sol'];ctx.fillRect(0,0,800,LH);ctx.restore();}
/* a label box; x,y = centre */
function tag(ctx,s,x,y,k,o){o=o||{};const sz=(o.s||15)*k;ctx.font=(o.w||600)+' '+sz+'px '+H.FONT;const w=ctx.measureText(s).width+sz*1.1,h=sz*1.9;
  ctx.save();ctx.globalAlpha=o.alpha==null?1:o.alpha;H.rr(ctx,x-w/2,y-h/2,w,h,7);ctx.fillStyle=o.bg||PAL['cv-sol'];ctx.fill();ctx.lineWidth=o.hi?2.5:1.2;ctx.strokeStyle=o.hi?'#c8102e':PAL['cv-soft'];ctx.stroke();
  H.txt(ctx,s,x,y+1,{s:sz,w:o.w||600,c:o.c||PAL['cv-ink'],a:'center',b:'middle'});ctx.restore();return {w,h};}
function line(ctx,x1,y1,x2,y2,col){ctx.save();ctx.strokeStyle=col||PAL['cv-soft'];ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();ctx.beginPath();ctx.arc(x2,y2,3,0,6.29);ctx.fillStyle=col||PAL['cv-soft'];ctx.fill();ctx.restore();}
function scaleBar(ctx,x,y,px,lab,k){ctx.save();ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y-6);ctx.lineTo(x,y);ctx.lineTo(x+px,y);ctx.lineTo(x+px,y-6);ctx.stroke();H.txt(ctx,lab,x+px/2,y-9,{s:12*k,w:700,a:'center'});ctx.restore();}
/* a fat molecule (triglyceride): glycerol backbone with three long fatty-acid tails, about 2 nm long; to scale with R px = 2.5 nm */
function fat(ctx,x,y,R,ang){const nm=R/2.5,tail=nm*2.1;ctx.save();ctx.translate(x,y);ctx.rotate(ang||0);ctx.strokeStyle='#c99a06';ctx.fillStyle='#c99a06';ctx.lineWidth=nm*0.13;ctx.lineJoin='round';
  for(let i=-1;i<=1;i++){const y0=i*nm*0.45;ctx.beginPath();ctx.moveTo(0,y0);for(let j=1;j<=14;j++)ctx.lineTo(j*tail/14,y0+(j%2?1:-1)*nm*0.09);ctx.stroke();ctx.beginPath();ctx.arc(0,y0,nm*0.17,0,6.29);ctx.fill();}
  ctx.beginPath();ctx.moveTo(0,-nm*0.45);ctx.lineTo(0,nm*0.45);ctx.stroke();ctx.restore();}
function brace(ctx,x1,y1,x2,y2,lab,k,side){ctx.save();ctx.strokeStyle='#c8102e';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();
  const an=Math.atan2(y2-y1,x2-x1);[[x1,y1,an],[x2,y2,an+Math.PI]].forEach(([x,y,a])=>{ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+Math.cos(a+0.45)*9,y+Math.sin(a+0.45)*9);ctx.moveTo(x,y);ctx.lineTo(x+Math.cos(a-0.45)*9,y+Math.sin(a-0.45)*9);ctx.stroke();});ctx.restore();
  tag(ctx,lab,(x1+x2)/2+(side||0),(y1+y2)/2-(side?0:20),k,{s:12});}

/* ---------- Naming compounds ---------- */
const NA=sim=>sim.def.art;
/* A small "what it really is" card in the question banner: real color and form of the compound. */
function sample(ctx,k,kind,l1,l2){const x=486,y=12,w=304,h=48;ctx.save();H.rr(ctx,x,y,w,h,8);ctx.fillStyle=PAL['cv-sol'];ctx.fill();ctx.lineWidth=2;ctx.strokeStyle='#c8102e';ctx.stroke();
  const cx=x+28,cy=y+h/2;
  if(kind==='salt'){[[-9,4],[6,6],[-1,-7]].forEach(([dx,dy])=>{const s=10,X=cx+dx,Y=cy+dy;ctx.fillStyle='#f4f4f2';ctx.fillRect(X-s/2,Y-s/2,s,s);ctx.fillStyle='#dcdcd8';ctx.beginPath();ctx.moveTo(X-s/2,Y-s/2);ctx.lineTo(X-s/2+4,Y-s/2-4);ctx.lineTo(X+s/2+4,Y-s/2-4);ctx.lineTo(X+s/2,Y-s/2);ctx.closePath();ctx.fill();ctx.strokeStyle='#9a9a96';ctx.lineWidth=1;ctx.strokeRect(X-s/2,Y-s/2,s,s);});}
  else if(kind==='rust'){ctx.fillStyle='#8b3a1a';ctx.beginPath();ctx.ellipse(cx,cy+4,18,10,0,0,6.29);ctx.fill();ctx.fillStyle='#b5562a';[[-7,0,5],[5,2,4],[0,7,3],[9,-2,3]].forEach(([dx,dy,r])=>{ctx.beginPath();ctx.arc(cx+dx,cy+dy,r,0,6.29);ctx.fill();});}
  else if(kind==='white'){ctx.fillStyle='#f2f2ef';ctx.strokeStyle='#b8b8b4';ctx.lineWidth=1;for(let i=0;i<9;i++){const a=i*2.4,r=3+(i%3)*5;ctx.beginPath();ctx.arc(cx+Math.cos(a)*r,cy+4+Math.sin(a)*r*0.5,3.4,0,6.29);ctx.fill();ctx.stroke();}}
  else if(kind==='ruby'){ctx.fillStyle='#b0102a';ctx.beginPath();for(let j=0;j<6;j++){const a=j/6*6.283;j?ctx.lineTo(cx+Math.cos(a)*15,cy+Math.sin(a)*13):ctx.moveTo(cx+15,cy);}ctx.closePath();ctx.fill();ctx.strokeStyle='rgba(255,255,255,.55)';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(cx-7,cy-11);ctx.lineTo(cx,cy);ctx.lineTo(cx+7,cy-11);ctx.moveTo(cx,cy);ctx.lineTo(cx,cy+13);ctx.stroke();}
  else if(kind==='gas'){ctx.strokeStyle='#777';ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(cx-4,cy-18);ctx.lineTo(cx-4,cy-8);ctx.lineTo(cx-14,cy+14);ctx.lineTo(cx+14,cy+14);ctx.lineTo(cx+4,cy-8);ctx.lineTo(cx+4,cy-18);ctx.stroke();ctx.fillStyle='rgba(190,120,60,.28)';ctx.beginPath();ctx.moveTo(cx-6,cy-6);ctx.lineTo(cx-13,cy+13);ctx.lineTo(cx+13,cy+13);ctx.lineTo(cx+6,cy-6);ctx.closePath();ctx.fill();}
  else if(kind==='battery'){ctx.fillStyle='#2b2b2b';H.rr(ctx,cx-17,cy-9,34,22,3);ctx.fill();ctx.fillStyle='#c8102e';ctx.fillRect(cx-12,cy-14,7,5);ctx.fillStyle='#555';ctx.fillRect(cx+5,cy-14,7,5);H.txt(ctx,'+  −',cx,cy+3,{s:10*k,w:700,c:'#fff',a:'center',b:'middle'});}
  else if(kind==='blue'){[[-8,3],[6,-3],[3,8]].forEach(([dx,dy],i)=>{const X=cx+dx,Y=cy+dy;ctx.fillStyle=i===1?'#2a7de1':'#1f62c4';ctx.beginPath();ctx.moveTo(X,Y-9);ctx.lineTo(X+7,Y);ctx.lineTo(X,Y+9);ctx.lineTo(X-7,Y);ctx.closePath();ctx.fill();});}
  H.txt(ctx,l1,x+60,y+19,{s:12.5*k,w:700,c:PAL['cv-ink']});H.txt(ctx,l2,x+60,y+36,{s:11*k,w:500,c:PAL['cv-soft']});ctx.restore();}
const q=(sim,c,dir,n)=>NA(sim).tourQ(sim,c,dir,n);
BioLab.addLearn({
naming: {
  goals: {
    bio: ['Why chemical names follow rules, and how the flowchart decides each part of a name', 'How to go from a formula to a name and back, with charges that add to zero', 'How to read the chemical names on labels at home, and which ones are dangerous to mix'],
    honors: ['Why chemical names follow rules, and how the flowchart decides each part of a name', 'How to go from a formula to a name and back, including Roman numerals, polyatomic ions and hydrates', 'How to read the chemical names on labels at home, and which ones are dangerous to mix']
  },
  matters: 'A chemical name tells anyone, anywhere, exactly what is in the bottle. One syllable can be the difference between the gas you breathe out (carbon dioxide) and a poison (carbon monoxide).',
  question: 'A bottle of bleach lists sodium hypochlorite, and a carbon monoxide detector warns about CO. What do those names tell you, and why does one use a prefix and the other doesn’t?',
  startKey: 'cast', startRun: false,
  startOverlay(sim,ctx,LH,k){tag(ctx,'Read it like a map: start at the top box and follow the arrows',400,LH-18,k,{s:12,hi:true});},
  steps: [
    { key: 'metal', title: 'First question: a metal?', pause: true, focus: s=>NA(s).fr('q1'),
      run(sim){const A=NA(sim);q(sim,A.mkIonic(A.catBySym('Na',1),A.anionByF('Cl')),'f2n',1);},
      see: 'The compound is NaCl. The first box asks: is the first part a metal, or the ammonium ion (NH₄⁺)? Na is sodium, a metal, so the path goes left, to <b>ionic</b>.',
      why: 'Metals give up electrons and become positive ions; nonmetals gain electrons and become negative ions. Opposite charges stick together into an ionic compound, and its name is built from the names of its two ions.',
      overlay(sim,ctx,LH,k){sample(ctx,k,'salt','NaCl is table salt','Real look: clear-white cubic crystals');} },
    { key: 'onecharge', title: 'One charge: just the name', pause: true, focus: s=>{const A=NA(s);return [A.fr('q3','t1'),A.fr('mon')];},
      run(sim){const A=NA(sim);q(sim,A.mkIonic(A.catBySym('Na',1),A.anionByF('Cl')),'f2n',5);},
      see: 'Sodium only ever forms Na⁺, so its name is just “sodium.” A one-atom negative ion ends in <b>-ide</b>: chlorine becomes chloride. Sodium chloride.',
      why: 'A name has to tell a reader exactly what is in the bottle. Sodium has only one possible charge, so the name needs nothing extra. Ionic names never use prefixes like di- or tri-: the charges already set the ratio.',
      overlay(sim,ctx,LH,k){sample(ctx,k,'salt','Sodium chloride = table salt','One compound, an everyday and a chemical name');} },
    { key: 'roman', title: 'More than one charge: a Roman numeral', pause: true, focus: s=>{const A=NA(s);return [A.fr('q3'),A.fr('t2')];},
      run(sim){const A=NA(sim);q(sim,A.mkIonic(A.catBySym('Fe',3),A.anionByF('O')),'f2n',3);},
      see: 'Fe₂O₃. Iron can be Fe²⁺ or Fe³⁺, so the path goes to the Roman numeral box. Three O²⁻ make 6−, so the two irons share 6+: each is 3+. Iron(III) oxide.',
      why: 'Iron can lose two or three electrons, so “iron oxide” could mean FeO or Fe₂O₃, two different substances. The Roman numeral is the metal’s charge, worked out backward from the negative ion.',
      so: 'Rust is mostly iron(III) oxide. That red-brown color is Fe₂O₃.',
      overlay(sim,ctx,LH,k){sample(ctx,k,'rust','Fe₂O₃ is most of rust','Real look: red-brown flakes and powder');} },
    { key: 'poly', title: 'Polyatomic ions keep their names', pause: true, focus: s=>{const A=NA(s);return [A.fr('q4'),A.fr('poly')];},
      run(sim){const A=NA(sim);q(sim,A.mkIonic(A.catBySym('Ca',2),A.anionByF('NO3')),'f2n',5);},
      see: 'Ca(NO₃)₂. NO₃ is nitrate, a <b>polyatomic ion</b>: a group of atoms with one charge. It keeps its own name, and the parentheses mean “two whole nitrate groups.” Calcium nitrate.',
      why: 'The atoms in a polyatomic ion are held together tightly and travel as one unit, so they get one name. You need two nitrates (1− each) to balance one Ca²⁺, and the parentheses keep each group together.',
      overlay(sim,ctx,LH,k){sample(ctx,k,'white','Calcium nitrate: a garden fertilizer','Real look: white granules');} },
    { key: 'formula', title: 'Writing a formula: charges add to zero', pause: true, focus: s=>NA(s).fr('bal'),
      run(sim){const A=NA(sim);q(sim,A.mkIonic(A.catBySym('Al',3),A.anionByF('O')),'n2f',6);},
      see: 'Now backward, from the name aluminum oxide to the formula. Al³⁺ and O²⁻: two aluminums make 6+, three oxides make 6−. So the formula is Al₂O₃.',
      why: 'A compound has no overall charge, so the positive and negative charges must add to zero. Crossing the charge numbers over is a shortcut to the smallest ratio that balances.',
      so: 'Aluminum oxide is the thin, clear layer that keeps aluminum foil from corroding. A trace of chromium in it makes a ruby red.',
      overlay(sim,ctx,LH,k){sample(ctx,k,'ruby','Al₂O₃ + a trace of chromium = ruby','Pure Al₂O₃ is clear');} },
    { key: 'molecular', title: 'Two nonmetals: prefixes count atoms', pause: true, focus: s=>{const A=NA(s),P=A.PREFBOX;return [A.fr('mol'),[P.x-6,P.y-6,P.w+12,P.h+12]];},
      run(sim){const A=NA(sim);q(sim,A.mkMol(A.mol('N',2,'O',4)),'f2n',3);},
      see: 'N₂O₄. No metal and no acid, so the path goes to <b>molecular</b>. Prefixes count the atoms: dinitrogen tetroxide. Skip mono- on the first element, and drop the extra vowel before “oxide.”',
      why: 'Nonmetals share electrons instead of forming ions, so there are no charges to set the ratio. The same two elements can join in many ratios (NO, NO₂, N₂O₄), so prefixes are the only way to tell them apart.',
      so: 'That is why carbon monoxide (CO) and carbon dioxide (CO₂) are different: one prefix separates a poison from the gas you breathe out.',
      overlay(sim,ctx,LH,k){sample(ctx,k,'gas','N₂O₄: a rocket-fuel oxidizer','Colorless gas; partly turns brown (NO₂)');} },
    { key: 'acid', title: 'Acids: H first, in water', pause: true, focus: s=>{const A=NA(s);return [A.fr('q2'),A.fr('q5','bin','oxy')];},
      run(sim){const A=NA(sim);q(sim,A.mkAcid(A.anionByF('SO4')),'f2n',4);},
      see: 'H₂SO₄(aq). It starts with H and is dissolved in water, so it is an <b>acid</b>. Its anion is sulfate, which has oxygen: -ate becomes -ic. Sulfuric acid.',
      why: 'In water, acids release H⁺ ions, and chemists name them from the negative ion left behind. -ide anions give hydro-…-ic acids, -ate gives -ic, and -ite gives -ous.',
      overlay(sim,ctx,LH,k){sample(ctx,k,'battery','Sulfuric acid fills car batteries','Real look: a colorless, oily liquid');} },
    { lvl: 'honors', key: 'hydrate', title: 'Hydrates', pause: true, focus: s=>NA(s).fr('hyd'),
      run(sim){const A=NA(sim);q(sim,A.hydrate(A.HYD()[0]),'f2n',99);},
      see: 'CuSO₄·5H₂O. The dot and water at the end mean a <b>hydrate</b>: water locked inside the crystal. Name the salt, then add a prefix + hydrate: copper(II) sulfate pentahydrate.',
      why: 'The five water molecules sit in fixed places in the crystal. Heating drives them off, which is how the hydrate lab finds the formula.',
      overlay(sim,ctx,LH,k){sample(ctx,k,'blue','CuSO₄·5H₂O: hydrate-lab crystals','Bright blue; white once the water is gone');} }
  ],
  useIt: [
    { do: 'Never mix bleach with ammonia, vinegar or other cleaners.',
      why: 'Bleach contains sodium hypochlorite (NaClO). With ammonia (NH₃) it makes toxic chloramine gas; with acids like vinegar it makes chlorine gas (Washington State Department of Health).' },
    { do: 'Keep a carbon monoxide detector where you sleep.',
      why: 'Carbon monoxide (CO) is colorless and odorless, so you can’t sense it. One prefix matters: carbon dioxide (CO₂) is what you breathe out; carbon monoxide comes from burning fuel and is poisonous (CDC).' },
    { do: 'Read the active ingredients, not just the brand.',
      why: 'Zinc oxide (ZnO) is one of the two sunscreen ingredients the FDA recognizes as safe and effective. Many antacids are calcium carbonate (CaCO₃), which neutralizes stomach acid, hydrochloric acid (HCl).' }
  ],
  tryIt: [
    { title: 'the label hunt (10 minutes)',
      steps: ['Find five chemical names on labels in your kitchen and bathroom: salt, baking soda (sodium hydrogen carbonate), toothpaste (often sodium fluoride), antacids (calcium carbonate), sunscreen (zinc oxide).', 'For each one, decide: ionic or molecular? Then write its formula with the flowchart.', 'Check yourself in Full lab with <b>Name → formula</b>.'],
      look: 'The names on real labels follow the same rules you just learned, so you can work out what is in the bottle from the name alone.' }
  ]
}
});
BioLab.addReview({
naming: {
  questions: [
  {id:'prefix',kind:'test',lvl:'bio',
    q:'Why is CO called carbon <b>mon</b>oxide, while NaCl is just sodium chloride, not monosodium monochloride?',
    choices:['CO is two nonmetals (molecular), so prefixes count atoms; NaCl is ionic, named from its ions with no prefixes','Prefixes are only used for gases','Sodium is too common to need a prefix','Chloride already means one'],correct:0,
    steps:['Carbon and oxygen are both nonmetals, so CO is molecular.','Molecular compounds can join in different ratios (CO, CO₂), so prefixes count the atoms.','NaCl is a metal plus a nonmetal, so it is ionic. The ions’ charges set the ratio, so ionic names never use prefixes.']},
  {id:'roman',kind:'test',lvl:'bio',
    q:'Rust is Fe₂O₃, named iron(III) oxide. Why does Al₂O₃ not need a Roman numeral?',
    choices:['Aluminum only ever forms Al³⁺, but iron can be Fe²⁺ or Fe³⁺','Aluminum is not a metal','The numeral is only for compounds with rust','Al₂O₃ is molecular'],correct:0,
    steps:['A Roman numeral tells a reader which charge a metal has.','Iron can be 2+ or 3+, so “iron oxide” alone could mean two different compounds.','Aluminum has only one charge, 3+, so its name is never ambiguous.']},
  {id:'antacid',kind:'real',lvl:'bio',
    q:'An antacid label lists calcium carbonate. What is its formula?',
    choices:['CaCO₃','Ca(CO₃)₂','Ca₂CO₃','CaC'],correct:0,
    steps:['Calcium is Ca²⁺. Carbonate is the polyatomic ion CO₃²⁻.','One 2+ and one 2− already add to zero.','So the formula is CaCO₃, with no parentheses needed.']},
  {id:'bleachmix',kind:'real',lvl:'bio',
    q:'Why should you never mix bleach (sodium hypochlorite) with an ammonia glass cleaner?',
    choices:['They react to make toxic chloramine gas','The mixture just stops cleaning','Ammonia turns bleach into salt water','It only matters in hot water'],correct:0,
    steps:['Bleach’s active ingredient is sodium hypochlorite, NaClO.','Hypochlorite reacts with ammonia (NH₃) to make chloramine gases.','Chloramine fumes damage the lungs, which is why health departments say never to mix bleach with other cleaners.']},
  {id:'bleachf',kind:'real',lvl:'honors',
    q:'Bleach’s active ingredient is sodium hypochlorite. What is its formula?',
    choices:['NaClO','NaCl','NaClO₄','Na(ClO)₂'],correct:0,
    steps:['Sodium is Na⁺.','Hypochlorite is ClO⁻, the chlorine oxyanion with the fewest oxygens.','One 1+ and one 1− balance, so the formula is NaClO.']}
  ]
}
});
})();
