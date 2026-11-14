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
/* ---------- Electron configurations ---------- */
const EC_ORDER=['1s','2s','2p','3s','3p','4s','3d','4p','5s','4d','5p'];
function ecBox(lab,b){const i=EC_ORDER.indexOf(lab),l='spd'.indexOf(lab[1]),x=[70,150,284][l]+b*30,y=418-i*35;return [x,y-14,28,28];}
function ecRing(ctx,lab,bs){ctx.save();ctx.strokeStyle='#c8102e';ctx.lineWidth=3;bs.forEach(b=>{const r=ecBox(lab,b);H.rr(ctx,r[0]-4,r[1]-4,r[2]+8,r[3]+8,6);ctx.stroke();});ctx.restore();}
function ecIcon(ctx,kind,cx,cy){ctx.save();
  const flask=(fill)=>{ctx.strokeStyle='#777';ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(cx-4,cy-18);ctx.lineTo(cx-4,cy-8);ctx.lineTo(cx-14,cy+14);ctx.lineTo(cx+14,cy+14);ctx.lineTo(cx+4,cy-8);ctx.lineTo(cx+4,cy-18);ctx.stroke();
    if(fill){ctx.fillStyle=fill;ctx.beginPath();ctx.moveTo(cx-5,cy-7);ctx.lineTo(cx-13,cy+13);ctx.lineTo(cx+13,cy+13);ctx.lineTo(cx+5,cy-7);ctx.closePath();ctx.fill();}};
  const jar=(metal)=>{ctx.fillStyle='rgba(214,170,60,.45)';ctx.fillRect(cx-15,cy-10,30,24);ctx.strokeStyle='#888';ctx.lineWidth=1.5;ctx.strokeRect(cx-15,cy-14,30,28);ctx.fillStyle=metal;ctx.beginPath();ctx.moveTo(cx-9,cy+12);ctx.lineTo(cx-6,cy+2);ctx.lineTo(cx+7,cy+1);ctx.lineTo(cx+9,cy+12);ctx.closePath();ctx.fill();};
  const tube=(fill)=>{ctx.strokeStyle='#777';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(cx-6,cy-18);ctx.lineTo(cx-6,cy+10);ctx.arc(cx,cy+10,6,Math.PI,0,true);ctx.lineTo(cx+6,cy-18);ctx.stroke();ctx.fillStyle=fill;ctx.beginPath();ctx.moveTo(cx-5,cy-4);ctx.lineTo(cx-5,cy+10);ctx.arc(cx,cy+10,5,Math.PI,0,true);ctx.lineTo(cx+5,cy-4);ctx.closePath();ctx.fill();};
  if(kind==='flask')flask(null);
  else if(kind==='balloon'){ctx.fillStyle='#c0c6cc';ctx.beginPath();ctx.ellipse(cx,cy-6,12,14,0,0,6.29);ctx.fill();ctx.fillStyle='rgba(255,255,255,.7)';ctx.beginPath();ctx.ellipse(cx-4,cy-11,3,5,-0.4,0,6.29);ctx.fill();ctx.strokeStyle='#888';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(cx,cy+8);ctx.quadraticCurveTo(cx+5,cy+14,cx,cy+20);ctx.stroke();}
  else if(kind==='neon'){ctx.shadowColor='#ff5a2b';ctx.shadowBlur=10;ctx.strokeStyle='#ff6a3a';ctx.lineWidth=4;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(cx-16,cy+8);ctx.bezierCurveTo(cx-16,cy-18,cx,cy-18,cx,cy);ctx.bezierCurveTo(cx,cy+18,cx+16,cy+18,cx+16,cy-8);ctx.stroke();}
  else if(kind==='na')jar('#c9ccd0');
  else if(kind==='cl')flask('rgba(190,205,60,.75)');
  else if(kind==='fe'){ctx.fillStyle='#7d8288';ctx.fillRect(cx-16,cy+2,26,4);ctx.beginPath();ctx.moveTo(cx+10,cy+1);ctx.lineTo(cx+16,cy+4);ctx.lineTo(cx+10,cy+7);ctx.fill();ctx.fillRect(cx-18,cy-1,3,10);
    ctx.lineWidth=6;ctx.lineCap='butt';ctx.strokeStyle='#c8102e';ctx.beginPath();ctx.arc(cx-2,cy-8,8,Math.PI,0);ctx.stroke();ctx.strokeStyle='#bbb';ctx.beginPath();ctx.moveTo(cx-10,cy-8);ctx.lineTo(cx-10,cy-4);ctx.moveTo(cx+6,cy-8);ctx.lineTo(cx+6,cy-4);ctx.stroke();}
  else if(kind==='fe2')tube('rgba(150,200,140,.75)');
  else if(kind==='fe3')tube('rgba(200,140,40,.8)');
  else if(kind==='salt'){[[-9,4],[6,6],[-1,-7]].forEach(([dx,dy])=>{const s=10,X=cx+dx,Y=cy+dy;ctx.fillStyle='#f4f4f2';ctx.strokeStyle='#bbb';ctx.lineWidth=1;ctx.fillRect(X-s/2,Y-s/2,s,s);ctx.strokeRect(X-s/2,Y-s/2,s,s);});}
  else if(kind==='cr'){const g=ctx.createLinearGradient(cx-16,cy-10,cx+16,cy+10);g.addColorStop(0,'#f4f6f8');g.addColorStop(0.5,'#8d949b');g.addColorStop(1,'#e6e9ec');ctx.fillStyle=g;H.rr(ctx,cx-17,cy-8,34,16,8);ctx.fill();}
  ctx.restore();}
/* card over the empty upper rows (5p, 4d, 5s-right); x 160..450 */
function ecCard(ctx,k,kind,t1,t2,lines){const f=Math.min(k,1.3),kk=f,w=Math.min(345,290*Math.max(1,f/1.05)),x=452-w,y=40,lh=16.5*kk,h=46*kk+lines.length*lh+6;
  ctx.save();ctx.globalAlpha=0.97;H.rr(ctx,x,y,w,h,8);ctx.fillStyle=PAL['cv-sol'];ctx.fill();ctx.globalAlpha=1;ctx.lineWidth=1.4;ctx.strokeStyle=PAL['cv-soft'];ctx.stroke();ctx.restore();
  ecIcon(ctx,kind,x+26,y+23*kk);H.txt(ctx,t1,x+52,y+19*kk,{s:12.5*f,w:700,c:PAL['cv-ink']});H.txt(ctx,t2,x+52,y+36*kk,{s:11*f,w:500,c:PAL['cv-soft']});
  lines.forEach((l,j)=>{const o=typeof l==='string'?[l]:l;H.txt(ctx,o[0],x+10,y+46*kk+lh*0.9+j*lh,{s:(o[2]||12)*f,w:o[1]||500,c:o[3]||PAL['cv-ink']});});}
const ecFill=sim=>{const a=sim.def.actions.find(x=>x.id==='fill');if(a)a.run(sim);};
const ECB={Z:1,charge:0,view:'boxes'};

BioLab.addLearn({
econfig: {
  goals: {
    bio: ['How electrons fill an atom: lowest energy first, two to an orbital, spreading out before pairing', 'Why neon does nothing while sodium reacts with almost everything', 'How the periodic table shows where an atom’s last electron goes', 'Why iron is magnetic and what that means at an MRI'],
    honors: ['How to write full and noble-gas configurations', 'Why 4s fills before 3d', 'How ions form: transition metals lose 4s electrons first', 'Why main-group ions match a noble gas'],
    ap: ['How to write configurations and ions, including transition metals', 'Why chromium and copper are exceptions', 'How to count unpaired electrons to predict paramagnetism', 'How to give the quantum numbers of an electron']
  },
  matters: 'Which electrons sit on the outside of an atom decides almost everything it does: whether it reacts, what charge it takes, whether it sticks to a magnet. Batteries, magnets, welding gas and the salt on your food all come down to how electrons fill.',
  question: 'Sodium is stored under oil because it reacts with moisture in the air, while the neon in a sign reacts with nothing. They differ by one electron. Build neon (10) and sodium (11). Where does that extra electron go, and why does it matter?',
  startKey: 'boxes', startRun: true,
  startOverlay(sim,ctx,LH,k){ecCard(ctx,k,'flask','Each box is one orbital','It holds at most 2 electrons (↑↓)',['Rows are sublevels: 1s, 2s, 2p, 3s…','Higher rows = higher energy (arrow at left)','The mini periodic table is at the top right']);},
  steps: [
    { key: 'h', title: 'Hydrogen: start at the bottom', base: ECB, fresh: true, speed: 1, run: ecFill,
      see: 'Hydrogen’s one electron drops into the lowest box, 1s (outlined in red). The configuration reads 1s¹: sublevel 1s, holding 1 electron.',
      why: 'Electrons take the lowest-energy spot that is open, the way water fills a glass from the bottom. This is the <b>Aufbau</b> rule (German for “building up”).',
      overlay(sim,ctx,LH,k){ecRing(ctx,'1s',[0]);ecCard(ctx,k,'flask','Hydrogen (H), Z = 1','A colorless gas; most of the Sun',['1 electron → the lowest box, 1s',['Written 1s¹',700,12.5,'#c8102e']]);} },
    { key: 'he', title: 'Helium: two per orbital, opposite spins', base: ECB, set: { Z: 2 }, fresh: true, speed: 1, run: ecFill,
      see: 'Helium’s second electron joins the first in 1s, pointing the other way (↑↓). The 1s box is now full: 1s².',
      why: '<b>Pauli rule:</b> one orbital holds at most two electrons, and they must spin in opposite directions. A full 1s makes helium very stable, which is why it is safe in party balloons.',
      overlay(sim,ctx,LH,k){ecRing(ctx,'1s',[0]);ecCard(ctx,k,'balloon','Helium (He), Z = 2','The gas in floating party balloons',['2 electrons share 1s, spins ↑↓',['1s² : full, so helium reacts with nothing',700,12.5,'#c8102e']]);} },
    { key: 'n', title: 'Nitrogen: spread out before pairing', base: ECB, set: { Z: 7 }, fresh: true, speed: 0.8, run: ecFill,
      see: 'After 1s and 2s fill, nitrogen’s last three electrons go into the three 2p boxes, one each, all pointing up. None of them pair.',
      why: '<b>Hund’s rule:</b> in a sublevel, electrons take empty orbitals one at a time, with the same spin, before any pair up. Like passengers on a bus, they take empty seats before sharing.',
      overlay(sim,ctx,LH,k){ecRing(ctx,'2p',[0,1,2]);ecCard(ctx,k,'flask','Nitrogen (N), Z = 7','About 78% of the air you breathe',['1s² 2s² 2p³',['One per 2p box, all the same spin',700,12.5,'#c8102e']]);} },
    { key: 'ne', title: 'Neon: every sublevel full', base: ECB, set: { Z: 10 }, fresh: true, speed: 1, run: ecFill,
      see: 'Neon’s 10 electrons fill 1s, 2s and all three 2p boxes. Every box it uses holds a pair, and the next electron would have to start a new, higher level.',
      why: 'With 2s and 2p full, neon has nothing to gain by giving or taking an electron. That is why it doesn’t react: the glowing gas in a sign is just neon atoms excited by electricity, not burning.',
      overlay(sim,ctx,LH,k){ecRing(ctx,'2s',[0]);ecRing(ctx,'2p',[0,1,2]);ecCard(ctx,k,'neon','Neon (Ne), Z = 10','Red-orange glow in a neon sign',['1s² 2s² 2p⁶: the n = 2 level is full',['Nothing to give or take: unreactive',700,12.5,'#c8102e']]);} },
    { key: 'na', title: 'Sodium: one electron alone in a new level', base: ECB, set: { Z: 11 }, fresh: true, speed: 1, run: ecFill,
      see: 'Sodium has neon’s 10 electrons plus one more. The 11th can’t fit in 1s, 2s or 2p, so it goes alone into 3s, a new, higher level (outlined in red). In noble-gas shorthand: [Ne] 3s¹.',
      why: 'That lone 3s electron is farther from the nucleus and shielded by the 10 below it, so it is easy to pull off. Sodium gives it away to almost anything, even moisture in the air, which is why it is stored under oil. This answers the question: one extra electron in a new level turns a do-nothing gas into a very reactive metal.',
      overlay(sim,ctx,LH,k){ecRing(ctx,'3s',[0]);ecCard(ctx,k,'na','Sodium (Na), Z = 11','A soft silver metal, kept under oil',['[Ne] 3s¹: neon’s core + 1 electron in 3s',['That lone outer electron is easy to lose',700,12.5,'#c8102e']]);} },
    { key: 'cl', title: 'Chlorine: one electron short', base: ECB, set: { Z: 17 }, fresh: true, speed: 1, run: ecFill,
      see: 'Chlorine’s 17 electrons fill up to 3p, which ends with five electrons: two pairs and one single (outlined). There is room for exactly one more.',
      why: 'Chlorine is one electron short of argon’s full set (3p⁶), so it grabs an electron from almost anything, becoming Cl⁻. Sodium (one extra) and chlorine (one short) together make Na⁺Cl⁻: table salt.',
      overlay(sim,ctx,LH,k){ecRing(ctx,'3p',[2]);ecCard(ctx,k,'cl','Chlorine (Cl), Z = 17','A yellow-green, poisonous gas',['[Ne] 3s² 3p⁵: one short of a full 3p',['It grabs one electron to become Cl⁻',700,12.5,'#c8102e']]);} },
    { key: 'k', title: 'Potassium: 4s before 3d', base: ECB, set: { Z: 19 }, fresh: true, speed: 1, run: ecFill,
      see: 'After 3p fills, potassium’s 19th electron skips the 3d boxes and goes into 4s (outlined). On the mini periodic table, potassium starts row 4 in the s block.',
      why: 'For these atoms, 4s is lower in energy than 3d, so it fills first. That is why row 4 of the periodic table starts with two s-block metals (K, Ca) before the d block. Like sodium, potassium has one lone outer electron and reacts violently with water.',
      overlay(sim,ctx,LH,k){ecRing(ctx,'4s',[0]);ecCard(ctx,k,'na','Potassium (K), Z = 19','A soft metal, also stored under oil',['[Ar] 4s¹: 4s fills before 3d',['One lone outer electron, like sodium',700,12.5,'#c8102e']]);} },
    { key: 'fe', title: 'Iron: unpaired electrons make a magnet', base: ECB, set: { Z: 26 }, fresh: true, speed: 1.2, run: ecFill,
      see: 'Iron fills 4s, then puts 6 electrons into 3d. By Hund’s rule, one 3d box gets a pair and the other four hold single electrons, all pointing the same way (outlined).',
      why: 'Unpaired electrons act like tiny magnets. In iron, the spins of neighboring atoms line up, so the whole piece of metal becomes magnetic. Zinc, with every electron paired, is not attracted to a magnet at all.',
      overlay(sim,ctx,LH,k){ecRing(ctx,'3d',[1,2,3,4]);ecCard(ctx,k,'fe','Iron (Fe), Z = 26','A nail sticks to a magnet',['[Ar] 4s² 3d⁶',['4 unpaired 3d electrons, spins lined up',700,12.5,'#c8102e']]);} },
    { lvl: 'honors', key: 'fe2', title: 'Fe²⁺: the 4s electrons leave first', base: ECB, set: { Z: 26, charge: 2 }, fresh: true, speed: 1.2, run: ecFill,
      see: 'Now the target is the Fe²⁺ ion, with 24 electrons. The 4s box (outlined) stays empty, and all 6 d electrons are still in 3d: [Ar] 3d⁶.',
      why: 'Electrons fill 4s before 3d, but once 3d holds electrons, 4s (n = 4) is the outermost shell. Ions lose their outermost electrons first, so iron loses both 4s electrons, not two 3d electrons. Fe²⁺ is not the same as chromium’s 24 electrons.',
      overlay(sim,ctx,LH,k){ecRing(ctx,'4s',[0]);ecCard(ctx,k,'fe2','Fe²⁺ ion, 24 electrons','Pale green in water (iron(II) solutions)',['Fe [Ar] 4s² 3d⁶ → Fe²⁺ [Ar] 3d⁶',['Highest n (4s) leaves first',700,12.5,'#c8102e']]);} },
    { lvl: 'honors', key: 'clion', title: 'Cl⁻: the same electrons as argon', base: ECB, set: { Z: 17, charge: -1 }, fresh: true, speed: 1, run: ecFill,
      see: 'The Cl⁻ ion has 18 electrons. Its 3p sublevel is now full (outlined), and the noble-gas notation is simply [Ar].',
      why: 'Main-group ions gain or lose electrons until they match the nearest noble gas. Cl⁻ and Ar are <b>isoelectronic</b> (same configuration). So are Na⁺ and Ne, which is why Na⁺Cl⁻ in salt is so stable.',
      overlay(sim,ctx,LH,k){ecRing(ctx,'3p',[0,1,2]);ecCard(ctx,k,'salt','Cl⁻ ion, 18 electrons','In table salt, Na⁺Cl⁻',['[Ne] 3s² 3p⁶ = [Ar]',['Same configuration as argon',700,12.5,'#c8102e']]);} },
    { lvl: 'ap', key: 'cr', title: 'Exception: chromium', base: ECB, set: { Z: 24 }, fresh: true, speed: 1.2, run: ecFill,
      see: 'Chromium fills with one electron in 4s and five in 3d, one in each 3d box (outlined): [Ar] 4s¹ 3d⁵, not the 4s² 3d⁴ the simple rule predicts.',
      why: '4s and 3d are very close in energy. Six unpaired electrons, all the same spin, lower the repulsion between electrons and gain exchange energy, so a half-filled 3d is extra stable. Copper does the same to fill 3d: [Ar] 4s¹ 3d¹⁰.',
      overlay(sim,ctx,LH,k){ecRing(ctx,'4s',[0]);ecRing(ctx,'3d',[0,1,2,3,4]);ecCard(ctx,k,'cr','Chromium (Cr), Z = 24','The shiny coating on “chrome” parts',['Measured: [Ar] 4s¹ 3d⁵ (not 4s² 3d⁴)',['Half-filled 3d is extra stable',700,12.5,'#c8102e']]);} },
    { lvl: 'ap', key: 'fe3', title: 'Fe³⁺: five unpaired electrons', base: ECB, set: { Z: 26, charge: 3 }, fresh: true, speed: 1.2, run: ecFill,
      see: 'Fe³⁺ has 23 electrons: [Ar] 3d⁵. Each of the five 3d boxes holds one electron (outlined), and the readout says 5 unpaired, paramagnetic.',
      why: 'Fe³⁺ loses both 4s electrons and one 3d electron. Five d electrons spread into five orbitals by Hund’s rule, so all five are unpaired and the ion is pulled into a magnetic field. The last electron of a 3d box has n = 3, ℓ = 2.',
      overlay(sim,ctx,LH,k){ecRing(ctx,'3d',[0,1,2,3,4]);ecCard(ctx,k,'fe3','Fe³⁺ ion, 23 electrons','Yellow-brown in water (iron(III))',['[Ar] 3d⁵: one electron per 3d box',['5 unpaired → strongly paramagnetic',700,12.5,'#c8102e']]);} }
  ],
  useIt: [
    { do: 'Pack spare lithium batteries and power banks in your carry-on bag, never in a checked bag.',
      why: 'Lithium, like sodium, has one lone outer electron (1s² 2s¹) that it gives up easily. That is what lets a lithium-ion battery store so much energy, and why a damaged one can overheat and catch fire. The FAA requires spares in the cabin, where the crew can deal with a fire.' },
    { do: 'Before an MRI scan, tell the staff about any metal in or on your body, and leave keys, hairpins and phones outside the scanner room.',
      why: 'Iron and steel have unpaired electrons that line up in a strong magnetic field, so the scanner’s magnet can pull them in hard enough to become projectiles. The Pennsylvania Patient Safety Authority’s MRI advisory explains that screening exists to keep ferromagnetic objects out of the scanner room.' }
  ],
  tryIt: [
    { title: 'the magnet hunt (5 minutes)',
      steps: ['Take a fridge magnet around your kitchen. Test a steel spoon, a nail or paper clip, an aluminum can, a copper penny made before 1982 (or any copper wire), and aluminum foil.', 'Sort them into “sticks” and “doesn’t stick.”', 'Look up each metal on the periodic table and note where it sits.'],
      look: 'Only things with iron (steel), nickel or cobalt stick. Aluminum and copper don’t. Iron has 4 unpaired d electrons that line up together; in copper the 3d sublevel is full and paired.' }
  ]
}
});
BioLab.addReview({
econfig: {
  questions: [
  {id:'neon',kind:'test',lvl:'bio',
    q:'Neon (1s² 2s² 2p⁶) almost never reacts. Why?',
    choices:['Every sublevel it uses is full, so it has nothing to gain by giving or taking electrons','It has no electrons in its outer shell','It is too heavy to react','Its electrons all spin the same way'],correct:0,
    steps:['Neon’s 10 electrons fill 1s, 2s and 2p completely.','A full outer set is very stable, so losing an electron or gaining one would only cost energy.','That is why the noble gases (He, Ne, Ar…) are used where nothing should react.'],
    lab:{set:{Z:10,charge:0},act:'fill',look:'Neon fills 1s, 2s and 2p. Every box holds a pair.'}},
  {id:'sodium',kind:'test',lvl:'bio',
    q:'Where does sodium’s 11th electron go, and what does that do to the way sodium reacts?',
    choices:['Alone into 3s, a new higher level, where it is easy to remove, so sodium reacts readily','Into 2p, making a full set','Into 1s, next to the first two','Into 3p, paired with another electron'],correct:0,
    steps:['1s, 2s and 2p are full after 10 electrons, so the 11th starts the n = 3 level, in 3s.','It sits alone, farther from the nucleus and shielded by the 10 electrons below it.','Losing it is easy and leaves neon’s stable set, so sodium gives it away to almost anything.'],
    lab:{set:{Z:11,charge:0},act:'fill',look:'Watch the 11th electron go into 3s, by itself.'}},
  {id:'magnet',kind:'real',lvl:'bio',
    q:'A steel paper clip sticks to a fridge magnet, but an aluminum can doesn’t. What is different about iron?',
    choices:['Iron has unpaired 3d electrons whose spins can line up, making it magnetic','Iron is heavier than aluminum','Aluminum has no electrons in its outer shell','Iron has more protons, and protons are magnetic'],correct:0,
    steps:['Each unpaired electron acts like a tiny magnet.','Iron is [Ar] 4s² 3d⁶: by Hund’s rule, four of its 3d electrons are unpaired, and in iron metal their spins line up with their neighbors’.','Aluminum’s electrons don’t line up that way, so the can isn’t pulled by a fridge magnet.'],
    lab:{set:{Z:26,charge:0},act:'fill',look:'Iron’s 3d row: one pair and four single electrons.'}},
  {id:'battery',kind:'real',lvl:'bio',
    q:'Lithium is 1s² 2s¹. Why do lithium batteries store so much energy, and need careful handling?',
    choices:['Lithium gives up its lone outer electron very easily, so the reaction releases a lot of energy','Lithium has a full outer shell','Lithium is a noble gas','Lithium’s electrons are all paired'],correct:0,
    steps:['Lithium has one electron alone in 2s, outside a full 1s.','Like sodium, it loses that electron easily, and that reaction is what powers the battery.','The same eagerness to react is why a damaged battery can overheat and burn, and why the FAA keeps spare batteries in the cabin.'],
    lab:{set:{Z:3,charge:0},act:'fill',look:'Lithium: 1s² and one electron alone in 2s.'}},
  {id:'fe2ion',kind:'test',lvl:'honors',
    q:'Iron is [Ar] 4s² 3d⁶. What is the configuration of Fe²⁺?',
    choices:['[Ar] 3d⁶','[Ar] 4s² 3d⁴','[Ar] 4s¹ 3d⁵','[Ar] 4s² 3d⁶'],correct:0,
    steps:['Fe²⁺ has lost 2 electrons.','Ions lose electrons from the highest n first, and 4s (n = 4) is outside 3d (n = 3).','So both 4s electrons go: Fe²⁺ is [Ar] 3d⁶.'],
    lab:{set:{Z:26,charge:2},act:'fill',look:'The 4s box stays empty; 3d keeps all six.'}},
  {id:'isoel',kind:'test',lvl:'honors',
    q:'Which ion has the same electron configuration as argon?',
    choices:['Cl⁻','Na⁺','F⁻','Mg²⁺'],correct:0,
    steps:['Argon has 18 electrons: [Ne] 3s² 3p⁶.','Chlorine has 17; gaining one gives Cl⁻ 18 electrons and a full 3p.','Na⁺, F⁻ and Mg²⁺ all have 10 electrons, the same as neon.'],
    lab:{set:{Z:17,charge:-1},act:'fill',look:'Cl⁻ fills 3p completely: [Ar].'}},
  {id:'copper',kind:'ap',lvl:'ap',
    q:'Copper (Z = 29) is measured as [Ar] 4s¹ 3d¹⁰, not [Ar] 4s² 3d⁹. Which explanation is best?',
    choices:['4s and 3d are close in energy, and a completely filled 3d sublevel is extra stable, so one 4s electron moves to 3d','3d is always lower in energy than 4s','Copper has 30 electrons','The Pauli rule forbids two electrons in 4s'],correct:0,
    steps:['For transition metals, 4s and 3d are very close in energy.','Moving one 4s electron fills 3d completely, which lowers the overall energy.','Chromium does the same to reach a half-filled 3d: [Ar] 4s¹ 3d⁵.'],
    lab:{set:{Z:29,charge:0},act:'fill',look:'Copper: one electron in 4s and ten in 3d.'}}
  ]
}
});

/* ---------- shared card for ChemLab overlays (font capped so phones fit) ---------- */
function ckCard(ctx,k,lines,x,y,w,mx){// on phones (big k) each line grows up to mx (1.45) times but shrinks to fit the card width
  const L=lines.map(l=>{const o=typeof l==='string'?[l]:l;const base=o[2]||12.5,wt=o[1]||500;let sz=base*Math.min(k,mx||1.45);ctx.font=wt+' '+sz+'px '+H.FONT;const tw=ctx.measureText(o[0]).width;if(tw>w-18)sz=Math.max(base*Math.min(k,1.05),sz*(w-18)/tw);return {t:o[0],sz,wt,c:o[3]||PAL['cv-ink']};});
  const lh=Math.max(...L.map(o=>o.sz))*1.38,h=8+L.length*lh;
  ctx.save();ctx.globalAlpha=0.97;H.rr(ctx,x,y,w,h,8);ctx.fillStyle=PAL['cv-sol'];ctx.fill();ctx.globalAlpha=1;ctx.lineWidth=1.3;ctx.strokeStyle=PAL['cv-soft'];ctx.stroke();ctx.restore();
  L.forEach((o,j)=>H.txt(ctx,o.t,x+9,y+4+lh*0.78+j*lh,{s:o.sz,w:o.wt,c:o.c}));return h;}
const RED='#c8102e';

/* ---------- Photoelectron spectroscopy ---------- */
const peX=be=>780-(Math.log10(be)-Math.log10(0.3))/(Math.log10(500)-Math.log10(0.3))*720;
function peRing(ctx,k,be,lab){const x=peX(be),yT=262,yB=450-24*k-14;ctx.save();ctx.strokeStyle=RED;ctx.lineWidth=2.5;H.rr(ctx,x-22,yT,44,yB-yT+4,8);ctx.stroke();ctx.restore();if(lab)tag(ctx,lab,x,yT-2,k,{s:11.5,hi:true});}
const peCard=(ctx,k,lines)=>ckCard(ctx,k,lines,326,2,306);
const peSub=(sim,lab)=>(sim.st.sub&&sim.st.sub[lab])||0;
const PEB={el:11,src:'cu',cmp:0};

BioLab.addLearn({
pes: {
  goals: {
    bio: ['How a photon can knock one electron out of an atom', 'Why binding energy = photon energy − the electron’s kinetic energy', 'How to read a PES spectrum: one peak per sublevel, height = number of electrons', 'How to identify an element from its spectrum'],
    honors: ['How to find binding energy from hν and KE', 'How peak position and peak height relate to the configuration', 'Why more protons pull every electron in tighter', 'Why a UV lamp reaches only the outer electrons'],
    ap: ['How to justify peak positions with Coulomb’s law (charge and distance)', 'How to read configuration, Z and IE₁ off a spectrum', 'Why inner (core) electrons need hundreds of times more energy', 'How to write the evidence the way an AP free response asks for it']
  },
  matters: 'PES is the experiment that proves electron configurations are real. Chip makers, coatings labs and crime labs use the same method (XPS) to find out which elements are on a surface, and AP Chemistry free-response questions ask you to explain a spectrum in words.',
  question: 'A gas cylinder has lost its label, and it holds a single element. Its PES spectrum shows three peaks, at 84.0, 4.68 and 2.08 MJ/mol, with heights 2, 2 and 6. Which gas is it?',
  startKey: 'setup', startRun: false,
  startOverlay(sim,ctx,LH,k){peCard(ctx,k,[['Left: the X-ray source and one atom (sodium)',700],'Middle: the analyzer measures electron speed','Bottom: the spectrum builds, electron by electron']);},
  steps: [
    { key: 'shoot', title: 'Photon in, electron out', base: PEB, fresh: true, speed: 0.3,
      see: 'An X-ray photon hits a sodium atom (drawn far larger than life). One electron leaves its ring, an open circle marks the empty spot, and the electron flies into the curved analyzer.',
      why: 'The photon hands all its energy to one electron. Part of that energy pulls the electron free of the nucleus: that part is the <b>binding energy</b>. The rest stays with the electron as <b>kinetic energy</b>, its energy of motion.',
      overlay(sim,ctx,LH,k){peCard(ctx,k,[['Photon energy hν: 777 MJ/mol (hard X-ray)',700],'= binding energy (to free it) + kinetic energy','Each photon frees exactly one electron']);} },
    { key: 'subtract', title: 'Binding energy = hν − KE', base: PEB, fresh: true, speed: 0.6,
      see: 'Watch the card at the right (outlined). For each electron it shows the photon energy, subtracts the kinetic energy the analyzer measured, and gives the binding energy.',
      why: 'Think of paying with a $20 bill: bill − change = price. Here, photon energy − kinetic energy = binding energy. Fast electrons were loosely held; slow ones were held tightly.',
      overlay(sim,ctx,LH,k){ctx.save();ctx.strokeStyle=RED;ctx.lineWidth=3;H.rr(ctx,640,24,156,190,12);ctx.stroke();ctx.restore();const L=sim.st.last;
        peCard(ctx,k,[['BE = hν − KE',800,12.5,RED],L?'Last one: 777 − '+(777-L.pk.BE).toFixed(L.pk.BE<10?2:0)+' = '+(L.pk.BE<10?L.pk.BE.toFixed(2):L.pk.BE.toFixed(0))+' MJ/mol ('+L.pk.lab+')':'waiting for the first electron…','Tightly held electron → slow → big BE']);} },
    { key: 'peaks', title: 'One peak per sublevel', base: PEB, fresh: true, speed: 4,
      see: 'Thousands of electrons later, the spectrum has four peaks. Sodium is 1s² 2s² 2p⁶ 3s¹, and there is one peak for each sublevel: 1s at 104 MJ/mol on the far left, then 2s, 2p, and 3s at 0.50 on the right.',
      why: 'Electrons in the same sublevel are held equally tightly, so they all land at the same binding energy and pile into one peak. The axis runs high to low, left to right, as on AP exams, and it is logarithmic: 1s needs about 200 times the energy of 3s.',
      overlay(sim,ctx,LH,k){peRing(ctx,k,104,'1s: 104');peRing(ctx,k,0.496,'3s: 0.50');peCard(ctx,k,[['Na: 1s² 2s² 2p⁶ 3s¹ → 4 peaks',700],'Far left = held tightly (close to nucleus)','Far right = held loosely (outermost)']);} },
    { key: 'heights', title: 'Taller peak, more electrons', base: PEB, fresh: true, speed: 4,
      see: 'The 2p peak (outlined) is three times as tall as the 2s peak, and the 3s peak is half the height of 2s. The card counts the electrons that landed in each peak.',
      why: 'Every electron has the same chance of being hit, so a sublevel with more electrons sends more of them to the detector. Heights 2 : 2 : 6 : 1 match 1s², 2s², 2p⁶, 3s¹.',
      overlay(sim,ctx,LH,k){peRing(ctx,k,3.67,'2p: 6 e⁻');peRing(ctx,k,6.84,'2s: 2 e⁻');const a=peSub(sim,'2s'),b=peSub(sim,'2p'),c=peSub(sim,'3s');
        peCard(ctx,k,['Counted so far: 2s '+a+', 2p '+b+', 3s '+c,['2p ÷ 2s = '+(a?(b/a).toFixed(2):'…')+'   (6 ÷ 2 = 3)',700,12.5,RED],'3s ÷ 2s = '+(a?(c/a).toFixed(2):'…')+'   (1 ÷ 2 = 0.5)']);} },
    { key: 'neon', title: 'The mystery gas', base: PEB, set: { el: 10 }, fresh: true, speed: 4,
      see: 'Now the sample is the unlabeled gas. Three peaks appear, at 84.0, 4.68 and 2.08 MJ/mol, and the last is three times as tall as the other two: heights 2, 2 and 6.',
      why: 'Three peaks with heights 2, 2, 6 means 1s² 2s² 2p⁶: 10 electrons, so 10 protons. The gas is <b>neon</b>. This answers the question. Neon’s 1s peak is at 84.0 MJ/mol, far left of sodium’s 2s, because nothing sits between those electrons and the nucleus.',
      overlay(sim,ctx,LH,k){peRing(ctx,k,84,'84.0');peRing(ctx,k,2.081,'2.08');peCard(ctx,k,[['Heights 2 : 2 : 6 → 1s² 2s² 2p⁶',700],'2 + 2 + 6 = 10 electrons → Z = 10',['It is neon',800,12.5,RED]]);} },
    { key: 'fluorine', title: 'Fewer protons, looser grip', base: PEB, set: { el: 9 }, fresh: true, speed: 4,
      see: 'Fluorine, one proton fewer. Its three peaks have heights 2, 2 and 5, and every peak sits to the right of neon’s: the 1s peak is at 67.2 MJ/mol instead of 84.0.',
      why: 'With 9 protons instead of 10, the nucleus pulls every electron a little less hard, so each one takes less energy to remove. Peak positions alone can tell elements apart, even when their peak counts match.',
      overlay(sim,ctx,LH,k){peRing(ctx,k,67.2,'67.2');peCard(ctx,k,[['F: 9 protons, 1s² 2s² 2p⁵ (heights 2, 2, 5)',700],'1s: 67.2 MJ/mol (neon: 84.0)',['Fewer protons → every peak moves right',700,12.5,RED]]);} },
    { lvl: 'honors', key: 'uv', title: 'A UV lamp reaches only the outside', base: PEB, set: { src: 'uv' }, fresh: true, speed: 4,
      see: 'Back to sodium, but the source is now a UV lamp. Only the 3s peak (outlined) appears; the 1s, 2s and 2p peaks are gone.',
      why: 'A UV photon carries only 2.05 MJ/mol. That is more than sodium’s 3s binding energy (0.50) but less than 2p’s (3.67), so the inner electrons can’t be freed. Chemists use UV-PES for outer (bonding) electrons and X-ray PES for core electrons.',
      overlay(sim,ctx,LH,k){peRing(ctx,k,0.496,'3s only');peCard(ctx,k,[['UV photon: 2.05 MJ/mol',700],'3s needs 0.50 ✓   2p needs 3.67 ✗',['Inner electrons stay put',700,12.5,RED]]);} },
    { lvl: 'honors', key: 'cmp', title: 'Compare neon and fluorine', base: PEB, set: { el: 10, cmp: 9 }, fresh: true, speed: 4,
      see: 'Neon’s spectrum with fluorine’s drawn on top for comparison. Each fluorine peak sits a little to the right of the matching neon peak.',
      why: 'Same sublevels, same distance from the nucleus, but neon has one more proton. Coulomb’s law: attraction ∝ q₁q₂ ÷ r². A larger nuclear charge at about the same r means a larger force, so every neon electron is held more tightly.',
      overlay(sim,ctx,LH,k){peCard(ctx,k,[['Ne (10 p⁺) vs F (9 p⁺), same shells',700],'1s: 84.0 vs 67.2   2p: 2.08 vs 1.68',['More protons, same r → tighter grip',700,12.5,RED]]);} },
    { lvl: 'ap', key: 'coulomb', title: 'Distance wins: K vs Na', base: PEB, set: { el: 19, cmp: 11 }, fresh: true, speed: 4,
      see: 'Potassium (19 protons) with sodium (11) for comparison. Potassium’s outermost peak, 4s at 0.42 MJ/mol, is to the right of sodium’s 3s at 0.50, even though potassium has 8 more protons.',
      why: 'For the outermost electron, the core electrons shield most of the nuclear charge: both feel about +1 (19 − 18 and 11 − 10). The 4s electron is in shell n = 4, farther out than 3s, so by Coulomb’s law (∝ 1/r²) it is held less tightly. A good AP answer names both factors: effective charge and distance.',
      overlay(sim,ctx,LH,k){peRing(ctx,k,0.419,'K 4s');peCard(ctx,k,[['K 4s: 0.42   Na 3s: 0.50 MJ/mol',700],'Core shields both to about +1',['n = 4 is farther out → weaker attraction',700,12.5,RED]]);} }
  ],
  useIt: [
    { do: 'If a doctor or dentist orders an X-ray or CT scan, it is fine to ask whether you need it and to keep a list of the scans you have had.',
      why: 'X-ray photons carry so much energy that they knock electrons right out of atoms, exactly what happens in this spectrometer. In your body that can damage DNA, so the FDA advises patients to ask about the benefit of each exam and keep a record of their medical imaging. A scan you need is still worth the small risk.' },
    { do: 'If you ever see “XPS” or “surface analysis” on a product test report, a phone screen coating or a medical implant, it is this experiment.',
      why: 'X-ray photoelectron spectroscopy is how chip makers and materials labs check which elements sit on a surface, a few nanometers deep. Every element’s peaks sit at its own binding energies, and NIST keeps a public database of them so any lab can match its peaks to an element, the way you matched neon’s.' }
  ],
  tryIt: [
    { title: 'the coin-toss spectrum (10 minutes)',
      steps: ['Write the configuration of sodium on paper: 1s² 2s² 2p⁶ 3s¹. Put one small object per electron in a cup: 2 pennies (1s), 2 nickels (2s), 6 dimes (2p), 1 quarter (3s).', 'Without looking, draw one coin, tally it, and put it back. Do this 50 times.', 'Make a bar graph: one bar per coin type, in order from 1s to 3s.'],
      look: 'The dime bar comes out about three times as tall as the penny or nickel bars, and the quarter bar about half as tall: the same 2 : 2 : 6 : 1 pattern as the PES peak heights, because every electron is equally likely to be hit.' }
  ]
}
});

/* ---------- Periodic trends ---------- */
const TRB={view:'map',prop:'radius',el:'Na',cmp:'across',series:'iso10',sie:'Mg'};
function trCell(ctx,sym,lab,k,pos){const e=ChemLab.el(sym),x=26+(e.group-1)*42.6,y=30+(e.period-1)*42.6;ctx.save();ctx.strokeStyle=RED;ctx.lineWidth=3.5;H.rr(ctx,x-2,y-2,46.6,46.6,8);ctx.stroke();ctx.restore();
  if(lab){if(pos==='left')tag(ctx,lab,x-34,y+21,k,{s:11.5,hi:true});else tag(ctx,lab,x+21.3,pos==='above'?y-12:y+56,k,{s:11.5,hi:true});}}
const trMapCard=(ctx,k,lines)=>ckCard(ctx,k,lines,16,394,330,1.15);
const trMid=(ctx,k,lines)=>ckCard(ctx,k,lines,322,96,156,1.2);

BioLab.addLearn({
trends: {
  goals: {
    bio: ['Which atoms are big and which are small, and the pattern on the periodic table', 'Why: protons pull, inner electrons shield, and distance weakens the pull', 'Why potassium reacts more violently than sodium', 'Why ionization energy and electronegativity run opposite to size'],
    honors: ['How to explain size with Zeff ≈ Z − core electrons and the number of shells', 'Why ionization energy and electronegativity rise across a period and fall down a group', 'Why cations are smaller and anions bigger than their atoms', 'How to compare isoelectronic ions'],
    ap: ['How to justify a trend with Coulomb’s law (Zeff and distance) in a free-response answer', 'How to compare isoelectronic ions by nuclear charge', 'How successive ionization energies reveal the number of valence electrons', 'How to name the exceptions without hand-waving']
  },
  matters: 'Where an element sits on the periodic table predicts how big its atoms are, how hard it holds its electrons and how violently it reacts. That is why cesium is sealed in glass, why fluorine is never found free, and why your toothpaste and nonstick pan work.',
  question: 'Drop a small piece of sodium in water and it fizzes and skates around. Potassium bursts into flame. Both have one valence electron. Why does potassium give its electron up more easily?',
  startKey: 'map', startRun: true,
  startOverlay(sim,ctx,LH,k){trMapCard(ctx,k,[['Each square: one element, colored by atomic radius',700],'Light = small atom, dark = big atom']);},
  steps: [
    { key: 'size', title: 'Big atoms and small atoms', base: TRB, set: { el: 'Cs' }, fresh: true, speed: 1,
      see: 'The heat map colors each element by atomic radius. The darkest square, cesium (outlined, bottom left), is 244 pm across in radius; the lightest, helium (top right), is 28 pm.',
      why: 'Atoms get bigger going <b>down</b> a group and smaller going <b>across</b> a period, left to right. Even cesium is tiny: 244 pm is about a quarter of a nanometer, and a million cesium atoms in a row would be half a millimeter long.',
      overlay(sim,ctx,LH,k){trCell(ctx,'Cs');trCell(ctx,'He','smallest',k,'left');trMapCard(ctx,k,[['Biggest: Cs (bottom left, outlined)',700],['Down: bigger   Across: smaller',700,12.5,RED]]);} },
    { key: 'inside', title: 'Inside sodium', base: TRB, set: { view: 'atom', el: 'Na', cmp: 'none' }, fresh: true, speed: 1,
      see: 'Sodium, drawn to scale (scale bar at the bottom left). In the middle is the nucleus with 11 protons. Ten gray inner electrons surround it, and one yellow outer electron sits alone in the third shell. The red arrow is the pull on that outer electron.',
      why: 'The 10 inner electrons sit between the nucleus and the outer electron and cancel most of the nucleus’s pull. This is <b>shielding</b>. The outer electron feels a pull of about +1 (11 − 10), not +11.',
      overlay(sim,ctx,LH,k){ckCard(ctx,k,[['11 protons − 10 inner electrons',700],['Outer electron feels about +1',700,12.5,RED],'(shielding)'],480,22,300,1.2);} },
    { key: 'across', title: 'Across: one more proton, smaller atom', base: TRB, set: { view: 'atom', el: 'Na', cmp: 'across' }, fresh: true, speed: 1,
      see: 'Sodium (left) next to magnesium (right). Magnesium has one more proton and one more outer electron, in the same third shell. Its atom is smaller: 141 pm versus 166 pm.',
      why: 'The core of 10 inner electrons stays the same, so magnesium’s outer electrons feel about +2 instead of +1. A stronger pull at the same shell draws them in closer, so the atom shrinks even though it has more electrons.',
      overlay(sim,ctx,LH,k){trMid(ctx,k,[['Same shells',700],'pull +1 → +2',['166 → 141 pm',800,12.5,RED]]);} },
    { key: 'down', title: 'Down: sodium vs potassium', base: TRB, set: { view: 'atom', el: 'Na', cmp: 'down' }, fresh: true, speed: 1,
      see: 'Sodium (left) next to potassium (right). Potassium has a fourth shell, so it is clearly bigger: 203 pm versus 166 pm. Each still has one yellow outer electron.',
      why: 'Potassium’s 8 extra protons are shielded by 8 extra inner electrons, so its outer electron still feels about +1. But it sits a whole shell farther out, and attraction weakens with distance. Removing it takes 419 kJ/mol instead of 496, about 16% less, so potassium gives it up faster and reacts more violently. This answers the question.',
      overlay(sim,ctx,LH,k){trMid(ctx,k,[['Both feel about +1',700],'K is farther out',['IE: 496 → 419',800,12.5,RED],'kJ/mol']);} },
    { key: 'ie', title: 'Ionization energy: the opposite of size', base: TRB, set: { prop: 'ie', el: 'He' }, fresh: true, speed: 1,
      see: 'The map now shows first ionization energy, the energy to pull off one electron. The pattern flips: the highest values are at the top right (helium, 2372 kJ/mol, outlined) and the lowest at the bottom left (cesium, 376, also outlined).',
      why: 'Small atoms hold their outer electrons close, under a strong pull, so removing one costs a lot of energy. Big atoms hold them far away and loosely. That is why the most reactive metals (Cs, Rb, K) are at the bottom left.',
      overlay(sim,ctx,LH,k){trCell(ctx,'He','2372',k,'left');trCell(ctx,'Cs');trMapCard(ctx,k,[['Small atom, close pull → hard to remove',700],['Across: higher   Down: lower',700,12.5,RED]]);} },
    { key: 'en', title: 'Electronegativity: who grabs electrons', base: TRB, set: { prop: 'en', el: 'F' }, fresh: true, speed: 1,
      see: 'Now the map shows electronegativity, how hard an atom pulls on electrons it shares. Fluorine (outlined) is the highest of all, 3.98. Cesium is among the lowest, 0.79.',
      why: 'Fluorine is small with a strong pull (+7 on its outer electrons), so it pulls shared electrons toward itself harder than any other atom. That is why it is never found free in nature, only in compounds like the sodium fluoride in toothpaste.',
      overlay(sim,ctx,LH,k){trCell(ctx,'F','3.98',k,'above');trMapCard(ctx,k,[['Fluorine: small, strong pull → 3.98',700],['Top right grabs, bottom left gives',700,12.5,RED]]);} },
    { lvl: 'honors', key: 'ions', title: 'Same electrons, different protons', base: TRB, set: { view: 'ions', series: 'iso10' }, fresh: true, speed: 1,
      see: 'Six ions, all with 10 electrons, drawn to scale: N³⁻, O²⁻, F⁻ (red, anions) then Na⁺, Mg²⁺, Al³⁺ (blue, cations). They shrink steadily from 146 pm to 53.5 pm.',
      why: 'These ions are <b>isoelectronic</b>: same 10 electrons, same 1s² 2s² 2p⁶ arrangement. The only difference is the nucleus: 7 protons for N³⁻ up to 13 for Al³⁺. More protons pulling on the same electrons draws them in tighter.',
      overlay(sim,ctx,LH,k){ckCard(ctx,k,[['All have 10 electrons',700],'Protons: 7 → 13',['More protons → smaller ion',700,12.5,RED]],440,368,330,1.2);} },
    { lvl: 'honors', key: 'pairs', title: 'Atoms vs their ions', base: TRB, set: { view: 'ions', series: 'pairs' }, fresh: true, speed: 1,
      see: 'Each atom next to its ion: Na and Na⁺, Mg and Mg²⁺, Cl and Cl⁻, O and O²⁻. The cations (blue) are much smaller than their atoms; the anions (red) are bigger.',
      why: 'Na → Na⁺ loses its whole outer shell, so the ion is far smaller (166 → 102 pm). Cl → Cl⁻ adds an electron to the same shell; the extra electron–electron repulsion spreads the cloud out (102 → 181 pm) with no extra protons to hold it in.',
      overlay(sim,ctx,LH,k){ckCard(ctx,k,[['Cation: loses a shell → smaller',700],['Anion: extra repulsion → bigger',700,12.5,RED]],440,368,330,1.2);} },
    { lvl: 'ap', key: 'sie', title: 'Successive ionization: count the valence electrons', base: TRB, set: { view: 'sie', sie: 'Mg' }, fresh: true, speed: 1,
      run(sim){sim.st.removed=3;sim.st.fly=0;},
      see: 'Magnesium with three electrons removed. On the bar chart (log scale), IE₁ = 738 and IE₂ = 1451 kJ/mol are short blue bars, then IE₃ jumps to 7733, a red bar past the dashed valence | core line.',
      why: 'The first two electrons come from the 3s valence shell. The third must come from the n = 2 core, which is much closer to the nucleus and barely shielded (Zeff about +10). A jump of more than five times marks the end of the valence electrons, so magnesium has 2 and forms Mg²⁺.',
      overlay(sim,ctx,LH,k){ckCard(ctx,k,[['IE₂ → IE₃: 1451 → 7733 kJ/mol',700],['The jump = 2 valence electrons',700,12.5,RED]],392,68,250,1.15);} }
  ],
  useIt: [
    { do: 'If you ever handle a metal like sodium or potassium in a lab, keep it under mineral oil, cut it on a dry surface, and never let it touch water.',
      why: 'Group 1 metals lose their lone outer electron so easily that they react with the water in the air, and potassium reacts with water violently enough to ignite the hydrogen it makes. Lab safety guides (and the OSHA-required Safety Data Sheets for these metals) call for storage under oil and no contact with water.' },
    { do: 'Use fluoride toothpaste, and don’t swallow it: a pea-sized amount for kids 3 to 6, the American Dental Association says.',
      why: 'Fluorine is the most electronegative element, so it is never free in nature; in toothpaste it is the fluoride ion, F⁻. Fluoride helps rebuild tooth enamel into a harder, more acid-resistant mineral, which is why the ADA recommends brushing with it twice a day.' }
  ],
  tryIt: [
    { title: 'the magnet-distance test (5 minutes)',
      steps: ['Put a paper clip on a table. Hold a fridge magnet just above it and slowly raise the magnet until the clip stops jumping up.', 'Now slip a few sheets of paper between them, then a thin book. Note how close the magnet has to be.', 'Stack two magnets together and try again.'],
      look: 'The pull drops fast with distance and with things in between, and two magnets pull harder. That is the atom: distance (more shells) and shielding (inner electrons) weaken the pull; more protons strengthen it.' }
  ]
}
});

BioLab.addReview({
pes: {
  questions: [
  {id:'peakcount',kind:'test',lvl:'bio',
    q:'Magnesium is 1s² 2s² 2p⁶ 3s². How many peaks does its PES spectrum have, and which is tallest?',
    choices:['4 peaks; 2p is tallest','12 peaks, one per electron','3 peaks; 1s is tallest','4 peaks, all the same height'],correct:0,
    steps:['Each sublevel gives one peak: 1s, 2s, 2p and 3s make 4.','Height counts the electrons in the sublevel.','2p holds 6 electrons; the others hold 2, so 2p is three times as tall.'],
    lab:{set:{el:12,src:'cu',cmp:0},look:'Magnesium’s spectrum: count the peaks and compare their heights.'}},
  {id:'height',kind:'test',lvl:'bio',
    q:'In sodium’s spectrum, why is the 2p peak about three times as tall as the 2s peak?',
    choices:['2p holds 6 electrons and 2s holds 2, and each electron is equally likely to be knocked out','2p electrons are held more tightly','2p electrons move faster','The X-rays aim at 2p'],correct:0,
    steps:['The photons hit electrons at random.','A sublevel with more electrons sends more electrons to the detector.','6 ÷ 2 = 3, so the 2p peak is three times taller.'],
    lab:{set:{el:11,src:'cu',cmp:0},look:'Watch the 2s and 2p peaks grow; compare their heights.'}},
  {id:'xray',kind:'real',lvl:'bio',
    q:'Why are medical X-rays called “ionizing” radiation, and why does the FDA suggest asking whether each scan is needed?',
    choices:['X-ray photons carry enough energy to knock electrons out of atoms, which can damage DNA','X-rays make the body magnetic','X-rays heat the body like a microwave','X-rays only pass through and never interact'],correct:0,
    steps:['An ion forms when an atom loses an electron.','X-ray photons carry so much energy (777 MJ/mol in this tool) that they can free even inner electrons, just as in PES.','In living cells that can break bonds in DNA, so each scan should be worth its small risk.'],
    lab:{set:{el:11,src:'cu',cmp:0},look:'A hard X-ray photon can free even the 1s electrons, the most tightly held.'}},
  {id:'leftmost',kind:'test',lvl:'honors',
    q:'Neon’s 1s peak is at 84.0 MJ/mol, but its 2p peak is at only 2.08. Which explanation is best?',
    choices:['1s electrons are much closer to the nucleus and are not shielded, so they feel almost the full +10','1s holds more electrons than 2p','2p electrons have more protons','The 2p electrons are moving faster'],correct:0,
    steps:['Attraction depends on charge and distance (Coulomb’s law).','1s electrons sit in shell n = 1, close to the nucleus, with nothing between.','2p electrons sit in n = 2, farther out and shielded by the 1s pair, so they need about 40 times less energy.'],
    lab:{set:{el:10,src:'cu',cmp:0},look:'Neon: compare the 1s peak (far left) with the 2p peak.'}},
  {id:'kna',kind:'ap',lvl:'ap',
    q:'Potassium’s outermost peak (0.42 MJ/mol) is at a lower binding energy than sodium’s (0.50), even though potassium has 8 more protons. Explain using Coulomb’s law.',
    choices:['Both outer electrons feel about +1 after shielding, but potassium’s 4s electron is farther from the nucleus, so the attraction is weaker','Potassium has fewer protons than sodium','Sodium’s electron is in a higher shell','Potassium’s outer electron is not shielded at all'],correct:0,
    steps:['Effective charge: K has 18 core electrons (19 − 18 ≈ +1); Na has 10 (11 − 10 ≈ +1).','Distance: K’s outer electron is in n = 4, Na’s in n = 3, so K’s is farther out.','Same charge, larger r → weaker attraction (∝ 1/r²) → lower binding energy.'],
    lab:{set:{el:19,src:'cu',cmp:11},look:'Potassium with sodium dashed: compare the rightmost peaks.'}}
  ]
},
trends: {
  questions: [
  {id:'kreact',kind:'test',lvl:'bio',
    q:'Sodium and potassium each have one outer electron. Why does potassium react more violently with water?',
    choices:['Its outer electron is a shell farther from the nucleus, so it is held more loosely and lost more easily','It has fewer protons','Its outer electron is not shielded','It has more outer electrons'],correct:0,
    steps:['Inner electrons shield both outer electrons to a pull of about +1.','Potassium’s outer electron is in the fourth shell, farther out than sodium’s third.','Farther away means a weaker pull: 419 kJ/mol to remove versus 496, so potassium gives it up faster.'],
    lab:{set:{view:'atom',el:'Na',cmp:'down'},look:'Sodium next to potassium: compare their sizes.'}},
  {id:'across',kind:'test',lvl:'bio',
    q:'Magnesium has one more electron than sodium, yet its atom is smaller. Why?',
    choices:['It also has one more proton pulling on electrons in the same shell, so they are pulled in closer','Its extra electron goes into a new, smaller shell','Magnesium has fewer inner electrons','Electrons repel and shrink the atom'],correct:0,
    steps:['Sodium and magnesium both have 10 inner electrons.','Magnesium’s 12 protons give its outer electrons a pull of about +2, versus +1 for sodium.','A stronger pull at the same shell draws the electrons in: 166 pm → 141 pm.'],
    lab:{set:{view:'atom',el:'Na',cmp:'across'},look:'Sodium next to magnesium: compare their sizes and pulls.'}},
  {id:'cesium',kind:'real',lvl:'bio',
    q:'Chemical suppliers ship cesium sealed in glass ampoules, with no air. Why?',
    choices:['Cesium, at the bottom left, loses its outer electron so easily that it reacts with air and water','Cesium is radioactive','Cesium is a gas','Cesium is the most electronegative element'],correct:0,
    steps:['Cesium is large: its outer electron is in the sixth shell.','That electron is held very loosely (376 kJ/mol), the lowest in this tool.','So cesium reacts with oxygen and water vapor on contact, and must be sealed away from both.'],
    lab:{set:{view:'map',prop:'ie',el:'Cs'},look:'Find cesium’s ionization energy on the map.'}},
  {id:'isoel',kind:'test',lvl:'honors',
    q:'O²⁻, F⁻, Na⁺ and Mg²⁺ all have 10 electrons. Which is largest?',
    choices:['O²⁻','F⁻','Na⁺','Mg²⁺'],correct:0,
    steps:['Isoelectronic ions have the same electrons in the same shells.','The only difference is the number of protons: O 8, F 9, Na 11, Mg 12.','Fewest protons means the weakest pull, so O²⁻ is largest (140 pm).'],
    lab:{set:{view:'ions',series:'iso10'},look:'Compare the 10-electron ions from N³⁻ to Al³⁺.'}},
  {id:'clion',kind:'test',lvl:'honors',
    q:'Why is the chloride ion, Cl⁻ (181 pm), bigger than a chlorine atom (102 pm)?',
    choices:['The extra electron adds repulsion in the same shell, with no extra proton to hold it in','Cl⁻ has an extra shell','Cl⁻ has fewer protons','Chloride loses an electron'],correct:0,
    steps:['Cl⁻ has the same 17 protons as Cl, but 18 electrons instead of 17.','The extra electron goes into the same third shell.','More electron–electron repulsion with the same pull spreads the cloud out.'],
    lab:{set:{view:'ions',series:'pairs'},look:'Compare Cl and Cl⁻.'}},
  {id:'alsie',kind:'ap',lvl:'ap',
    q:'Aluminum’s successive ionization energies are 578, 1817, 2745 and 11577 kJ/mol. How many valence electrons does it have, and why?',
    choices:['3, because the huge jump after IE₃ means the fourth electron comes from the core','4, because there are four values','1, because IE₂ is much bigger than IE₁','2, because IE₃ is bigger than IE₂'],correct:0,
    steps:['Each IE rises a little, because the ion is more positive.','IE₄ is more than four times IE₃: that electron comes from the n = 2 core, much closer and barely shielded.','So aluminum has 3 valence electrons and forms Al³⁺.'],
    lab:{set:{view:'sie',sie:'Al'},look:'Remove aluminum’s electrons one at a time and watch for the jump.'}}
  ]
}
});

/* ---------- Intermolecular forces ---------- */
const IMB={mode:'pair',a:'H2O',b:'CH4',temp:25,all:false};
const imA=(ctx,k,lines)=>ckCard(ctx,k,lines,206,12,190,1.2);
const imB=(ctx,k,lines)=>ckCard(ctx,k,lines,600,12,190,1.2);
const imMin=v=>v==null?'still drying…':'dry at '+v.toFixed(1)+' min';

BioLab.addLearn({
imf: {
  goals: {
    bio: ['What intermolecular forces are: the “stickiness” between neighboring molecules', 'The three kinds: London dispersion, dipole–dipole and hydrogen bonding', 'Why stronger forces mean a higher boiling point and slower evaporation', 'Why hand sanitizer feels cold and why water is a liquid at all'],
    honors: ['How to identify the strongest force in a substance', 'Why London forces grow with the number of electrons', 'Why a polar molecule boils higher than a nonpolar one of the same size', 'How temperature changes evaporation rate'],
    ap: ['How to rank boiling points and justify them in an AP free response', 'How vapor pressure rises with temperature (Clausius–Clapeyron)', 'Why the boiling point is where vapor pressure reaches 1 atm', 'Why isomers with the same formula can boil 100 °C apart']
  },
  matters: 'Intermolecular forces decide whether something is a gas, a liquid or a solid at room temperature, how fast it evaporates and how high it boils. That is why water covers Earth, propane comes out of a grill tank as a gas, and hand sanitizer chills your skin.',
  question: 'You pour 1 mL of water and 1 mL of ethanol, the alcohol in most hand sanitizers, into two small dishes at 25 °C. Both liquids form hydrogen bonds. Which dish is dry first, and about how many times faster?',
  startKey: 'pair', startRun: true,
  startOverlay(sim,ctx,LH,k){imA(ctx,k,[['Two water molecules',700],'Dashed line: the attraction']);imB(ctx,k,[['Two methane molecules',700],'Clouds: their electrons']);},
  steps: [
    { key: 'hb', title: 'Water vs methane: same size, different stickiness', base: IMB, fresh: true, speed: 1,
      see: 'Left: two water molecules, joined by a dashed hydrogen bond between an H (δ+) and the O (δ−) of its neighbor. Right: two methane molecules with no partial charges. On the boiling-point line, water sits at 100 °C and methane at −161.5 °C.',
      why: 'Both molecules have 10 electrons and almost the same mass (18 and 16 g/mol). The difference is the attraction <b>between</b> molecules. Water’s H attached to O makes a strong hydrogen bond; methane has only weak London forces. Pulling water molecules apart into a gas takes far more energy, so water boils 260 °C higher.',
      overlay(sim,ctx,LH,k){imA(ctx,k,[['Water: hydrogen bond',700],['boils at 100 °C',700,12.5,RED]]);imB(ctx,k,[['Methane: London only',700],['boils at −161.5 °C',700,12.5,RED]]);} },
    { key: 'ldf', title: 'London forces grow with electrons', base: IMB, set: { a: 'He', b: 'I2' }, fresh: true, speed: 1,
      see: 'Helium (2 electrons) on the left and iodine, I₂ (106 electrons), on the right. Both are nonpolar, with only London dispersion forces. Helium boils at −268.9 °C; iodine is a purple-black solid that boils at 184 °C.',
      why: 'London forces come from electrons sloshing to one side for an instant, making a brief dipole that tugs on the neighbor. A big electron cloud sloshes more, so the attraction is stronger. More electrons, stronger London forces, higher boiling point.',
      overlay(sim,ctx,LH,k){imA(ctx,k,[['He: 2 electrons',700],['boils at −268.9 °C',700,12.5,RED]]);imB(ctx,k,[['I₂: 106 electrons',700],['solid; boils at 184 °C',700,12.5,RED]]);} },
    { key: 'race', title: 'The evaporation race', base: IMB, set: { mode: 'race', a: 'H2O', b: 'C2H5OH' }, fresh: true, speed: 2,
      see: 'Two dishes with 1.00 mL each at 25 °C: water (A) and ethanol (B). The ethanol level drops much faster, and its dish is dry in about 12 minutes of model time. The water takes about an hour.',
      why: 'Both form hydrogen bonds, but each water molecule can make up to four, holding its small neighbors very tightly. Ethanol’s hydrogen bonding is weaker per molecule, so more of its molecules escape each second. This answers the question: ethanol is dry first, roughly 5 times faster.',
      overlay(sim,ctx,LH,k){const st=sim.st;ckCard(ctx,k,[['Water: '+imMin(st.doneA),700,12.5,PAL['s2']],['Ethanol: '+imMin(st.doneB),700,12.5,PAL['s4']],(st.doneA&&st.doneB)?['About '+(st.doneA/st.doneB).toFixed(1)+' times faster',800,12.5,RED]:'…'],290,118,220,1.2);} },
    { key: 'warm', cause: { from: { temp: 25 } }, title: 'Warmer means faster', base: IMB, set: { mode: 'race', a: 'H2O', b: 'C2H5OH', temp: 60 }, fresh: true, speed: 2,
      see: 'The same race at 60 °C. Both dishes dry much faster than at 25 °C, and ethanol still wins.',
      why: 'At a higher temperature more molecules have enough energy to break free of their neighbors, so both evaporate faster. The forces themselves don’t change, so the order stays the same. Wet clothes dry faster on a hot day for the same reason.',
      overlay(sim,ctx,LH,k){const st=sim.st;ckCard(ctx,k,[['At 60 °C',700],['Water: '+imMin(st.doneA),600,12.5,PAL['s2']],['Ethanol: '+imMin(st.doneB),600,12.5,PAL['s4']]],290,118,220,1.2);} },
    { lvl: 'honors', key: 'dd', title: 'Dipole–dipole: polar vs nonpolar', base: IMB, set: { a: 'HCl', b: 'F2' }, fresh: true, speed: 1,
      see: 'HCl (left) and F₂ (right) each have 18 electrons, so their London forces are about the same. HCl is polar (δ+ H, δ− Cl) and boils at −85.1 °C; F₂ is nonpolar and boils at −188.1 °C.',
      why: 'With the electron count matched, the extra 103 °C comes from dipole–dipole attraction: the δ+ end of one HCl lines up with the δ− end of the next. Polar molecules boil higher than nonpolar molecules of the same size.',
      overlay(sim,ctx,LH,k){imA(ctx,k,[['HCl: 18 e⁻, polar',700],['boils at −85.1 °C',700,12.5,RED]]);imB(ctx,k,[['F₂: 18 e⁻, nonpolar',700],['boils at −188.1 °C',700,12.5,RED]]);} },
    { lvl: 'honors', key: 'all', title: 'Every molecule has London forces', base: IMB, set: { all: true }, fresh: true, speed: 1,
      see: 'With “List every force present” on, water’s label lists London dispersion, dipole–dipole and hydrogen bonding; methane’s lists London dispersion only.',
      why: 'London forces act between all molecules, because all have electrons. Polar molecules add dipole–dipole, and molecules with H on N, O or F add hydrogen bonding, the strongest of the three. On a test, name the strongest force, but know they all add up.',
      overlay(sim,ctx,LH,k){imA(ctx,k,[['Water: all three',700],['strongest: H-bonding',700,12.5,RED]]);imB(ctx,k,[['Methane: London only',700]]);} },
    { lvl: 'ap', key: 'isomers', title: 'Same formula, 100 °C apart', base: IMB, set: { a: 'C2H5OH', b: 'CH3OCH3' }, fresh: true, speed: 1,
      see: 'Ethanol (left) and dimethyl ether (right) are both C₂H₆O, 46.07 g/mol, 26 electrons. Ethanol boils at 78.4 °C; dimethyl ether at −24.8 °C.',
      why: 'Same London forces, but ethanol has an O–H, so it hydrogen bonds. In dimethyl ether every H is on a carbon, so it has only dipole–dipole forces. Hydrogen bonding adds about 100 °C. A strong AP answer names the force each has and why: “ethanol has H bonded to O.”',
      overlay(sim,ctx,LH,k){imA(ctx,k,[['Ethanol: O–H → H-bonds',700],['78.4 °C',700,12.5,RED]]);imB(ctx,k,[['Ether: no O–H',700],['−24.8 °C',700,12.5,RED]]);} },
    { lvl: 'ap', key: 'vp', title: 'Vapor pressure and the boiling point', base: IMB, set: { mode: 'vp', a: 'H2O', b: 'C2H5OH', temp: 78 }, fresh: true, speed: 1,
      see: 'Two sealed flasks at 78 °C, each with some liquid and its vapor above it. The label under each gives the vapor pressure: ethanol’s has reached about 750 torr, almost exactly 1 atm (760 torr), while water’s is only about 330 torr.',
      why: 'Vapor pressure is the push of molecules escaping the liquid, and it rises steeply with temperature (Clausius–Clapeyron: ln P = −ΔH_vap/R · (1/T − 1/T_b)). Stronger forces mean a larger ΔH_vap (water 40.65 kJ/mol, ethanol 38.56) and a lower vapor pressure at the same temperature. A liquid boils when its vapor pressure equals the air pressure, so ethanol boils at 78.4 °C. In Denver, at about 0.83 atm, water boils near 95 °C.',
      overlay(sim,ctx,LH,k){ckCard(ctx,k,[['At 78 °C',700],['Ethanol ≈ 750 torr ≈ 1 atm',700,12.5,PAL['s4']],'→ it is boiling','Water ≈ 330 torr: not yet'],290,60,220,1.2);} }
  ],
  useIt: [
    { do: 'Rub hand sanitizer until your hands are completely dry before you touch food or anything else.',
      why: 'The ethanol has to stay on your skin long enough to work, and it evaporates fast because its intermolecular forces are weaker than water’s. The CDC says to rub until your hands feel dry, about 20 seconds, and that sanitizer works best on hands that aren’t visibly dirty or greasy.' },
    { do: 'Store propane tanks upright and outdoors, never in a garage, basement or car.',
      why: 'Propane has only weak London forces and boils at −42 °C, so any leak turns straight into gas, and propane gas is heavier than air and pools low. Fire-safety agencies such as the NFPA tell people to keep grill tanks outside and upright, away from buildings.' }
  ],
  tryIt: [
    { title: 'the evaporation race (10 minutes)',
      steps: ['On a dark plate or a mirror, put one drop of water and one drop of rubbing alcohol (70% isopropyl), side by side.', 'Start a timer and watch which drop disappears first.', 'Then put a drop of each on the back of your hand and notice which feels colder.'],
      look: 'The rubbing alcohol vanishes first and feels colder: its weaker intermolecular forces let molecules escape faster, and each escaping molecule carries heat away from your skin.' }
  ]
}
});

BioLab.addReview({
imf: {
  questions: [
  {id:'mass',kind:'test',lvl:'bio',
    q:'Water (18 g/mol) and methane (16 g/mol) are almost the same size, yet water boils at 100 °C and methane at −161.5 °C. Why?',
    choices:['Water molecules attract each other with hydrogen bonds; methane has only weak London forces','Water molecules are much heavier','Methane has stronger covalent bonds','Water has more electrons'],correct:0,
    steps:['Boiling separates molecules from each other; it doesn’t break the bonds inside them.','Water has H attached to O, so its molecules hydrogen bond to their neighbors.','Methane is nonpolar, with only London forces, so far less energy pulls its molecules apart.'],
    lab:{set:{mode:'pair',a:'H2O',b:'CH4'},look:'Compare the forces and the boiling points of water and methane.'}},
  {id:'sanitizer',kind:'real',lvl:'bio',
    q:'Why does hand sanitizer feel cold as it dries on your skin?',
    choices:['Ethanol evaporates fast, and each escaping molecule carries heat away from your skin','Ethanol is stored in the fridge','Ethanol reacts with skin and absorbs heat chemically','Sanitizer contains ice crystals'],correct:0,
    steps:['Ethanol’s intermolecular forces are weaker than water’s, so it evaporates quickly.','The molecules that escape are the fastest, most energetic ones.','Losing them lowers the average energy of what is left, and your skin, so it feels cold.'],
    lab:{set:{mode:'race',a:'H2O',b:'C2H5OH',temp:25},look:'Race water against ethanol and compare their drying times.'}},
  {id:'propane',kind:'real',lvl:'bio',
    q:'Propane (C₃H₈) is sold as a liquid in grill tanks, but it comes out as a gas. What does that tell you about its intermolecular forces?',
    choices:['They are weak: propane is nonpolar with only London forces, so it boils at −42 °C','They are strong hydrogen bonds','Propane has no intermolecular forces at all','Propane is ionic'],correct:0,
    steps:['Propane is nonpolar, so its only attractions are London forces.','With 26 electrons those forces are weak, and propane boils at −42 °C.','It stays liquid in the tank only because it is under pressure; open the valve and it boils.'],
    lab:{set:{mode:'pair',a:'C3H8',b:'H2O'},look:'Compare propane’s boiling point with water’s.'}},
  {id:'halogens',kind:'test',lvl:'honors',
    q:'F₂ is a gas, Br₂ is a liquid and I₂ is a solid at room temperature. Why?',
    choices:['All are nonpolar, but more electrons give stronger London forces','Br₂ and I₂ form hydrogen bonds','F₂ is polar','Heavier molecules have stronger covalent bonds'],correct:0,
    steps:['All three are nonpolar diatomic molecules, so London forces are their only attraction.','The electron count rises: 18, 70 and 106.','Bigger electron clouds are more easily distorted, so the London forces and boiling points rise: −188, 59 and 184 °C.'],
    lab:{set:{mode:'pair',a:'F2',b:'Br2'},look:'Compare fluorine and bromine.'}},
  {id:'isomer',kind:'ap',lvl:'ap',
    q:'Ethanol (CH₃CH₂OH) boils at 78.4 °C and dimethyl ether (CH₃OCH₃) at −24.8 °C. Both are C₂H₆O. Which justification earns full credit?',
    choices:['Ethanol has an H bonded to O, so it forms hydrogen bonds between molecules; in dimethyl ether every H is bonded to C, so it has only dipole–dipole and London forces, which are weaker','Ethanol is heavier than dimethyl ether','Dimethyl ether has stronger covalent bonds','Ethanol has more electrons'],correct:0,
    steps:['Same formula, so same mass and electrons: the London forces are about equal.','Only ethanol has an O–H, needed for hydrogen bonding.','A complete answer names the force in each substance and says which part of the structure causes it.'],
    lab:{set:{mode:'pair',a:'C2H5OH',b:'CH3OCH3'},look:'Compare the forces of the two isomers.'}}
  ]
}
});


/* ---------- Lewis structures, VSEPR shapes, polarity (AP Chem Unit 2, Nov 12, 2026) ----------
   Layout: lewis draws one molecule around (280, 252) with the electron budget at the top right (548–792, 10–200);
   vsepr spins one molecule around (400, 246); polarity's bond view puts the two atoms near y 170 with the ΔEN bar
   below, its molecule view centres on (400, 232), and its stream view leaves the top left empty. */
const chAct=(sim,id)=>{const a=sim.def.actions.find(x=>x.id===id);if(a)a.run(sim);};
const chMet=(sim,id)=>{const m=sim.def.metrics.find(x=>x.id===id);return m?m.get(sim):null;};
/* cycle a control through values while a step is showing */
function chCycle(sim,key,id,list,ms){clearInterval(sim._chC);let i=0;sim._chC=setInterval(()=>{if(sim.lnKey!==key||!sim.tour||!sim.tour.on){clearInterval(sim._chC);return;}i=(i+1)%list.length;const v={};v[id]=list[i];BioLab.setValues(sim,v);if(sim.def.id==='lewis')chAct(sim,'answer');},ms||2600);}
const LW=[218,342];   // the two atoms of a diatomic in lewis (CX ± BL/2)
/* lewis cards sit at the bottom right, under the electron budget, whatever its height */
function lwCard(ctx,k,lines,LH){const h=8+lines.length*12.5*Math.min(k,1.45)*1.38;return ckCard(ctx,k,lines,548,(LH||450)-h-10,244);}

BioLab.addLearn({
lewis: {
  goals: {
    bio: ['How to count the valence electrons a molecule has to work with', 'Why atoms share pairs of electrons until each has 8 (hydrogen: 2)', 'When atoms need double or triple bonds', 'Why N₂, with its triple bond, barely reacts'],
    honors: ['How to count valence electrons, including for ions', 'When atoms need double or triple bonds', 'How formal charge picks the best structure', 'What resonance means: one real structure, drawn several ways'],
    ap: ['How to draw any Lewis structure step by step', 'How formal charge picks the best structure', 'Resonance and bond order', 'Why atoms in period 3 and below can hold more than 8']
  },
  matters: 'A Lewis structure is a map of where a molecule’s electrons are. It predicts the molecule’s shape, whether it is polar, how strong its bonds are and how easily it reacts. Every other Unit 2 idea starts from it.',
  startKey: 'start', startRun: false,
  startOverlay(sim,ctx,LH,k){if(sim.p.mol!=='N2'){BioLab.setValues(sim,{mol:'N2'});}tag(ctx,'N: 5 valence e⁻',LW[0],190,k,{s:12,hi:true});tag(ctx,'N: 5 valence e⁻',LW[1],320,k,{s:12,hi:true});
    lwCard(ctx,k,[['The goal',700],'Every atom ends with 8 electrons','around it: its ring turns green.'],LH);},
  steps: [
    { key: 'count', title: 'Count the electrons', set: { mol: 'N2' }, fresh: true, pause: true,
      see: 'Two nitrogen atoms joined by one line. The electron budget at the top right counts what you have to place: 2 × 5 = 10 valence electrons. The single bond already uses 2.',
      why: 'Valence electrons are the outer electrons, the ones that bond. Nitrogen is in group 15, so it brings 5. Every Lewis structure starts with this total. You can’t create or lose any.',
      overlay(sim,ctx,LH,k){tag(ctx,'1 bond = 1 shared pair = 2 e⁻',280,300,k,{s:12,hi:true});lwCard(ctx,k,[['Budget',700],'N: 5 + N: 5 = 10 electrons',['8 still to place',700,12.5,'#c8102e']],LH);} },
    { key: 'single', title: 'Try a single bond', set: { mol: 'N2' }, fresh: true, pause: true, run(sim){chAct(sim,'outer');},
      see: 'Lone pairs added until each N has 8 around it. Both rings turn green, but the budget turns red: this uses 14 electrons, and N₂ only has 10.',
      why: 'With only one shared pair, each N needs 3 lone pairs (6 electrons) of its own. That is 2 + 6 + 6 = 14. Four electrons too many, so a single bond can’t work.',
      overlay(sim,ctx,LH,k){lwCard(ctx,k,[['Single bond needs',700],'2 shared + 6 + 6 lone = 14',['Only 10 exist ✗',800,12.5,'#c8102e']],LH);} },
    { key: 'triple', title: 'Share more: a triple bond', set: { mol: 'N2' }, fresh: true, pause: true, run(sim){chAct(sim,'answer');},
      see: 'N≡N: three shared pairs between the atoms and one lone pair on each. Both rings are green and the budget is exactly 10.',
      why: 'Shared electrons count for <b>both</b> atoms. Each N has 6 shared + 2 lone = 8, using only 6 + 2 + 2 = 10 electrons. Three pairs between two atoms make one of the strongest bonds known, which is why the nitrogen in air hardly reacts.',
      overlay(sim,ctx,LH,k){tag(ctx,'3 shared pairs = 6 e⁻',280,300,k,{s:12,hi:true});lwCard(ctx,k,[['Each N counts',700],'6 shared + 2 lone = 8 ✓','Total used: 6 + 2 + 2 = 10 ✓'],LH);} },
    { key: 'water', title: 'Water: lone pairs and hydrogen', set: { mol: 'H2O' }, fresh: true, pause: true, run(sim){chAct(sim,'answer');},
      see: 'H₂O: 1 + 1 + 6 = 8 valence electrons. Oxygen shares one pair with each H and keeps two lone pairs.',
      why: 'Hydrogen is full with just 2 electrons, so it only ever makes one bond. Oxygen ends with 4 shared + 4 lone = 8. Those two lone pairs will matter next: they push water into a bent shape.',
      overlay(sim,ctx,LH,k){lwCard(ctx,k,[['H₂O',700],'Budget: 1 + 1 + 6 = 8','H is full at 2 (one bond)','O: 4 shared + 4 lone = 8'],LH);} },
    { key: 'co2', title: 'Carbon dioxide: two double bonds', set: { mol: 'CO2' }, fresh: true, pause: true, run(sim){chAct(sim,'answer');},
      see: 'CO₂: 4 + 6 + 6 = 16 electrons. Carbon sits in the middle with a double bond to each oxygen and no lone pairs.',
      why: 'With single bonds, carbon would have only 4. Moving one lone pair from each O into its bond gives carbon 8 and keeps each O at 8. No lone pairs on carbon, so (next tool) CO₂ comes out straight.',
      overlay(sim,ctx,LH,k){lwCard(ctx,k,[['CO₂',700],'Budget: 4 + 6 + 6 = 16','C: 4 shared pairs = 8','Each O: 4 shared + 4 lone = 8'],LH);} },
    { lvl: 'honors', key: 'resonance', title: 'Resonance: the nitrate ion', set: { mol: 'NO3' }, fresh: true, pause: true, run(sim){chAct(sim,'answer');clearInterval(sim._chR);sim._chR=setInterval(()=>{if(sim.lnKey!=='resonance'||!sim.tour||!sim.tour.on){clearInterval(sim._chR);return;}chAct(sim,'res');},2200);},
      see: 'NO₃⁻ has 5 + 18 + 1 = 24 electrons. Watch the double bond jump between the three oxygens: three resonance structures.',
      why: 'No single drawing is right. The real ion is a blend: each N–O bond is the same length, about one and a third bonds. The extra electron (the − charge) is shared over all three oxygens, which makes the ion more stable.',
      overlay(sim,ctx,LH,k){lwCard(ctx,k,[['NO₃⁻: 24 electrons',700],'3 equivalent structures','Real bonds: all the same length','Bond order 4 ÷ 3 ≈ 1.33'],LH);} },
    { lvl: 'ap', key: 'expanded', title: 'More than 8: SF₄', set: { mol: 'SF4' }, fresh: true, pause: true, run(sim){chAct(sim,'answer');},
      see: 'SF₄ has 6 + 4 × 7 = 34 electrons. After four S–F bonds and full shells on each F, one lone pair is left over, and it goes on sulfur.',
      why: 'Sulfur is in period 3, so it has room for more than 8 around it: here 8 shared + 2 lone = 10. Atoms in period 2 (C, N, O, F) never exceed 8. Check formal charges: all are zero.',
      overlay(sim,ctx,LH,k){lwCard(ctx,k,[['SF₄: 34 electrons',700],'4 bonds + 3 lone pairs × 4 F = 32','2 left → one lone pair on S',['S holds 10: period 3 can',700,12.5,'#c8102e']],LH);} }
  ],
  useIt: [
    { do: 'On hot summer afternoons when Denver posts an ozone alert, move hard runs and practices to the morning.',
      why: 'Ground-level ozone, O₃, forms when exhaust gases react in sunlight. Its resonance structure leaves an oxygen ready to react, and it irritates your lungs. Ozone is worst in the afternoon and early evening, so the EPA’s AirNow says to plan outdoor activity for the morning (EPA AirNow).' },
    { do: 'Reseal an opened bag of chips tightly, or move them to an airtight container.',
      why: 'Sealed bags are filled with nitrogen gas, N₂. Its triple bond makes it so unreactive that it leaves the oils in the chips alone. Once you open the bag, oxygen from the air gets in and slowly reacts with those oils, and the chips go stale.' }
  ],
  tryIt: [
    { title: 'electron budget with candy (10 minutes)',
      steps: ['Use small candies or coins as electrons and paper circles as atoms.', 'Build N₂ with 10 pieces: try a single bond first, then a double, then a triple.', 'Count around each atom, and remember that pieces between two atoms count for both.'],
      look: 'Only the triple bond lets both nitrogens count 8 with exactly 10 pieces. Then try H₂O with 8 pieces and CO₂ with 16.' }
  ]
},

vsepr: {
  goals: {
    bio: ['Why electron groups around an atom spread as far apart as they can', 'How lone pairs bend a molecule', 'Why water is bent and carbon dioxide is straight', 'How to name a shape from its count of atoms and lone pairs'],
    honors: ['How to name a shape from its count of atoms and lone pairs', 'The difference between electron-domain geometry and molecular shape', 'Why lone pairs squeeze bond angles below 109.5°', 'Why a double bond counts as one electron domain'],
    ap: ['How to predict shapes with 5 and 6 electron domains', 'Why lone pairs go in equatorial positions', 'How bond angles change with lone pairs, using real data']
  },
  matters: 'A molecule’s shape decides almost everything about it: whether it is polar, whether it dissolves in water, how it smells and how a drug fits into the protein it acts on. Water’s bend is why it dissolves salt and heats in a microwave.',
  startKey: 'start', startRun: true,
  startOverlay(sim,ctx,LH,k){if(sim.p.mode!=='real'||sim.p.mol!=='H2O')BioLab.setValues(sim,{mode:'real',mol:'H2O'});ckCard(ctx,k,[['Electron domains',700],'Each bond (single, double or triple)','and each lone pair is one domain.','Domains push each other apart.'],20,320,260);},
  steps: [
    { key: 'tetra', title: 'Four domains: as far apart as possible', set: { mode: 'model', nb: 4, nl: 0 }, fresh: true, speed: 1,
      see: 'Four bonds around a central atom, spinning so you see it from every side. Each angle is 109.5°, not 90°.',
      why: 'Electron domains are all negative, so they repel. Flat on paper they could only be 90° apart, but in 3D they reach 109.5° by pointing to the corners of a tetrahedron. That is methane, CH₄.',
      overlay(sim,ctx,LH,k){ckCard(ctx,k,[['4 bonds, 0 lone pairs',700],'Tetrahedral, 109.5°','Example: CH₄, methane'],20,320,240);} },
    { key: 'pyramid', title: 'Swap one bond for a lone pair', set: { mode: 'model', nb: 3, nl: 1 }, fresh: true, speed: 1,
      see: 'One of the four domains is now a lone pair (the yellow lobe). You still have 4 domains, but only 3 atoms: a trigonal pyramid, like ammonia, NH₃.',
      why: 'The shape is named by where the atoms are, not the lone pair. The lone pair is held by only one nucleus, so it spreads out more and pushes the three bonds a little closer together: 107° instead of 109.5°.',
      overlay(sim,ctx,LH,k){ckCard(ctx,k,[['3 bonds, 1 lone pair',700],'Trigonal pyramidal, about 107°','Example: NH₃, ammonia'],20,320,240);} },
    { key: 'bent', title: 'Two lone pairs: bent', set: { mode: 'model', nb: 2, nl: 2 }, fresh: true, speed: 1,
      see: 'Two bonds and two lone pairs. The two atoms sit at an angle: bent, like water.',
      why: 'Water’s oxygen has 4 domains (2 bonds, 2 lone pairs from its Lewis structure), so they spread like a tetrahedron. You only see the 2 hydrogens, so the molecule looks bent. Two lone pairs squeeze harder: 104.5°.',
      overlay(sim,ctx,LH,k){ckCard(ctx,k,[['2 bonds, 2 lone pairs',700],['Bent, 104.5°',700,12.5,'#c8102e'],'Example: H₂O, water'],20,320,240);} },
    { key: 'linear', title: 'Carbon dioxide: straight', set: { mode: 'model', nb: 2, nl: 0, btype: 2 }, fresh: true, speed: 1,
      see: 'Two double bonds and no lone pairs on the central atom: the atoms point opposite ways, 180° apart. A straight line, like CO₂.',
      why: 'A double bond holds 4 electrons, but they sit in the same region between the two atoms, so it counts as one domain. Two domains get as far apart as possible by pointing in opposite directions. That answers the question: CO₂ is straight, water is bent.',
      overlay(sim,ctx,LH,k){ckCard(ctx,k,[['2 double bonds, 0 lone pairs',700],['Linear, 180°',700,12.5,'#c8102e'],'Example: CO₂'],20,320,240);} },
    { key: 'real', title: 'Real molecules: each lone pair squeezes more', set: { mode: 'real', mol: 'CH4' }, fresh: true, speed: 1, run(sim){chCycle(sim,'real','mol',['CH4','NH3','H2O'],2800);},
      see: 'Real molecules, one after another: methane, ammonia, water. Watch the angle label.',
      why: 'All three have 4 electron domains around the central atom. Each lone pair added takes more room and squeezes the bonds closer: 109.5°, then 106.7°, then 104.5°.',
      overlay(sim,ctx,LH,k){const m=sim.p.mol;ckCard(ctx,k,[['4 domains each',700],['CH₄: 0 lone pairs, 109.5°',m==='CH4'?700:500,12.5,m==='CH4'?'#c8102e':null],['NH₃: 1 lone pair, 106.7°',m==='NH3'?700:500,12.5,m==='NH3'?'#c8102e':null],['H₂O: 2 lone pairs, 104.5°',m==='H2O'?700:500,12.5,m==='H2O'?'#c8102e':null]],20,300,250);} },
    { lvl: 'honors', key: 'ghost', title: 'Domain geometry vs shape', set: { mode: 'model', nb: 2, nl: 2, ghost: true }, fresh: true, speed: 1,
      see: 'Water again, with faint sticks showing where ideal 109.5° bonds would be.',
      why: 'Electron-domain geometry counts all 4 domains: tetrahedral. Molecular geometry counts only atoms: bent. On a test, name both. The real bonds sit inside the faint ones because the lone pairs push them together.',
      overlay(sim,ctx,LH,k){ckCard(ctx,k,[['Water',700],'Domain geometry: tetrahedral','Molecular shape: bent','Faint sticks: ideal 109.5°'],20,320,250);} },
    { lvl: 'ap', key: 'seesaw', title: 'Five domains: lone pairs go equatorial', set: { mode: 'model', nb: 4, nl: 1 }, fresh: true, speed: 1,
      see: 'Four bonds and one lone pair: 5 domains in a trigonal bipyramid. The lone pair sits on the equator, giving a seesaw shape, like SF₄.',
      why: 'A lone pair on the equator has only two neighbors at 90°; on the axis it would have three. Fewer 90° repulsions means lower energy, so lone pairs always take equatorial spots first.',
      overlay(sim,ctx,LH,k){ckCard(ctx,k,[['4 bonds, 1 lone pair',700],'Seesaw (5 domains)','Lone pair: equatorial','Example: SF₄'],20,320,240);} }
  ],
  useIt: [
    { do: 'Stir microwaved food halfway through and let it stand a few minutes before you eat it.',
      why: 'A microwave heats food by twisting bent, polar water molecules back and forth. Water isn’t spread evenly through food, so it heats unevenly and leaves cold spots where bacteria can survive. The USDA says to stir or turn the food midway and to observe the standing time, when cooking continues (USDA FSIS).' },
    { do: 'Don’t heat plain water in a clean cup in the microwave for a long time. Put a wooden stir stick in it, or heat it on the stove.',
      why: 'Water heated without anything to start bubbles can go past its boiling point without boiling. A small bump, like picking up the cup or adding instant coffee, can make it erupt. The FDA has reports of serious burns to people’s hands and faces from this (FDA).' }
  ],
  tryIt: [
    { title: 'balloon shapes (5 minutes)',
      steps: ['Blow up four balloons the same size and twist their knots together.', 'Let go: they settle on their own. Look at the shape they make.', 'Try two balloons, then three, then make one balloon bigger to act as a lone pair.'],
      look: 'Four balloons point to the corners of a tetrahedron, not a flat cross; two point opposite ways; three make a flat triangle. A bigger balloon squeezes the others together, just like a lone pair.' }
  ]
},

polarity: {
  goals: {
    bio: ['What electronegativity is: how hard an atom pulls on shared electrons', 'Why unequal sharing makes partial charges, δ+ and δ−', 'How a molecule’s shape decides whether it is polar overall', 'Why a charged balloon bends water but not hexane'],
    honors: ['How ΔEN sorts bonds into nonpolar, polar and ionic', 'How bond dipoles add like arrows', 'Why polar bonds can make a nonpolar molecule', 'Why a stream bends toward both + and − charges'],
    ap: ['How to justify polarity from shape in an AP free response', 'How measured dipole moments compare with the ΔEN picture']
  },
  matters: 'Polarity decides what dissolves in what (“like dissolves like”), why oil and water separate, how soap cleans and why water has such a high boiling point. It comes straight from shape and electronegativity.',
  startKey: 'start', startRun: true,
  startOverlay(sim,ctx,LH,k){if(sim.p.mode!=='stream'){BioLab.setValues(sim,{mode:'stream',liquid:'water',rod:'neg',dist:3});}ckCard(ctx,k,[['A charged rod 3 cm away',700],'Water: does the stream bend?','Hexane: does it bend?','+ rod or − rod: does it matter?'],20,60,280);},
  steps: [
    { key: 'equal', title: 'Equal sharing', set: { mode: 'bond', a: 'H', b: 'H' }, fresh: true, speed: 1,
      see: 'Two hydrogen atoms share a pair of electrons (the yellow dots). The electron cloud is the same on both sides.',
      why: 'Both atoms pull on the shared pair equally hard: their electronegativity is the same (2.20). Equal sharing means no charged ends. The bond is nonpolar.',
      overlay(sim,ctx,LH,k){ckCard(ctx,k,[['H–H',700],'EN 2.20 vs 2.20','ΔEN = 0: nonpolar'],575,34,215);} },
    { key: 'unequal', title: 'Unequal sharing', set: { mode: 'bond', a: 'H', b: 'Cl' }, fresh: true, speed: 1,
      see: 'Hydrogen and chlorine. The shared pair sits closer to Cl, and the cloud is red (negative) on the Cl side. Cl is δ−; H is δ+.',
      why: 'Chlorine’s electronegativity (3.16) is higher than hydrogen’s (2.20), so it pulls the shared electrons toward itself. Each end gets a <b>partial</b> charge, written δ. The purple arrow, a bond dipole, points toward the negative end.',
      overlay(sim,ctx,LH,k){ckCard(ctx,k,[['H–Cl',700],'EN 2.20 vs 3.16','ΔEN = 0.96: polar covalent'],575,34,215);} },
    { key: 'ionic', title: 'Too unequal: ionic', set: { mode: 'bond', a: 'Na', b: 'Cl' }, fresh: true, speed: 1,
      see: 'Sodium and chlorine. The marker on the ΔEN bar jumps into the ionic zone.',
      why: 'Na (0.93) and Cl (3.16) differ by 2.23. Chlorine pulls so much harder that it takes the electron outright: Na⁺ and Cl⁻ ions, not a shared pair. Below 0.4 bonds are nonpolar, up to about 1.8 polar, above that ionic.',
      overlay(sim,ctx,LH,k){ckCard(ctx,k,[['Na–Cl',700],'EN 0.93 vs 3.16',['ΔEN = 2.23: ionic',700,12.5,'#c8102e']],575,34,215);} },
    { key: 'water', title: 'Water: the dipoles add up', set: { mode: 'mol', mol: 'H2O', field: false }, fresh: true, speed: 1,
      see: 'A water molecule turning in 3D. Each O–H bond has a blue dipole arrow pointing toward O. The big purple arrow is their sum: the molecule’s net dipole.',
      why: 'Because water is bent (the last tool), its two bond dipoles both point partly “up” toward O. They add instead of cancelling, so the O side is negative and the H side positive. Water is polar.',
      overlay(sim,ctx,LH,k){ckCard(ctx,k,[['H₂O',700],'Polar bonds + bent shape',['→ polar molecule',700,12.5,'#c8102e']],560,120,228);} },
    { key: 'co2', title: 'Carbon dioxide: they cancel', set: { mode: 'mol', mol: 'CO2', field: false }, fresh: true, speed: 1,
      see: 'CO₂: two C=O bonds, each very polar. Look for the net dipole arrow.',
      why: 'The two bond dipoles are equal and point in exactly opposite directions, because CO₂ is straight. They cancel, so there is no net dipole. Polar bonds, nonpolar molecule: shape decides.',
      overlay(sim,ctx,LH,k){ckCard(ctx,k,[['CO₂',700],'Polar bonds + straight shape',['→ cancel: nonpolar',700,12.5,'#c8102e']],560,120,228);} },
    { key: 'field', cause: { from: { field: false } }, title: 'Line them up', set: { mode: 'mol', mol: 'H2O', field: true }, fresh: true, speed: 1,
      see: 'Charged plates switched on, + on one side and − on the other. The water molecule swings its δ− oxygen toward the + plate and stops tumbling.',
      why: 'A polar molecule has a negative end and a positive end, so an electric field can grab it and turn it. A microwave oven does this billions of times a second, twisting water molecules back and forth, and that motion heats your food.',
      overlay(sim,ctx,LH,k){ckCard(ctx,k,[['Field on',700],'Polar water turns to line up'],540,120,200);} },
    { key: 'stream', title: 'Bend a stream of water', set: { mode: 'stream', liquid: 'water', rod: 'neg', dist: 3 }, fresh: true, speed: 1,
      see: 'A thin stream of water falls past a negatively charged rod 3 cm away. The stream bends toward the rod: 1.5 cm at the bottom. The circle zooms in on the molecules.',
      why: 'Water molecules in the stream turn their δ+ hydrogen ends toward the − rod, and the near end gets pulled harder than the far end is pushed. The whole stream leans toward the rod.',
      overlay(sim,ctx,LH,k){ckCard(ctx,k,[['Water, − rod, 3 cm',700],['Bends 1.5 cm toward the rod',700,12.5,'#c8102e']],20,60,280);} },
    { key: 'hexane', cause: { from: { liquid: "water" } }, title: 'Now hexane', set: { mode: 'stream', liquid: 'hexane', rod: 'neg', dist: 3 }, fresh: true, speed: 1,
      see: 'Same rod, same distance, but the buret holds hexane, a gasoline ingredient. The stream falls almost straight.',
      why: 'Hexane is made only of C and H, whose electronegativities are close, and its shape is balanced. It has no charged ends for the rod to pull on, so it bends only about 0.1 cm.',
      overlay(sim,ctx,LH,k){ckCard(ctx,k,[['Hexane, − rod, 3 cm',700],'Bends about 0.1 cm','Nonpolar: nothing to grab'],20,60,280);} },
    { lvl: 'honors', key: 'pos', title: 'A + rod works too', set: { mode: 'stream', liquid: 'water', rod: 'pos', dist: 3 }, fresh: true, speed: 1,
      see: 'Water again, with a positively charged rod. It still bends toward the rod, by the same 1.5 cm.',
      why: 'The molecules simply turn the other way: now their δ− oxygen ends face the + rod. Whichever charge the rod has, the nearer end is the opposite charge, so the attraction always wins.',
      overlay(sim,ctx,LH,k){ckCard(ctx,k,[['Water, + rod, 3 cm',700],['Still bends 1.5 cm toward it',700,12.5,'#c8102e'],'δ− ends now face the rod'],20,60,280);} },
    { lvl: 'ap', key: 'debye', title: 'Measured dipole moments', set: { mode: 'mol', mol: 'NH3', field: false }, fresh: true, speed: 1,
      see: 'Ammonia, NH₃: three polar N–H bonds in a pyramid, so they add to a net dipole toward N.',
      why: 'The arrow model uses ΔEN only. Real dipole moments, measured in debye (D), also depend on bond length and lone pairs: H₂O 1.85 D, NH₃ 1.47 D, HCl 1.08 D. For an FRQ, justify polarity with both the bond dipoles and the shape.',
      overlay(sim,ctx,LH,k){ckCard(ctx,k,[['Measured dipoles',700],'H₂O 1.85 D · NH₃ 1.47 D','HCl 1.08 D · CO₂ 0 D'],560,120,228);} }
  ],
  useIt: [
    { do: 'After swimming or toweling off, put sunscreen back on, even if the bottle says “water resistant”.',
      why: 'Sunscreen’s filters are mostly oily, nonpolar compounds, so they don’t dissolve in water, which is why they stay on at all. But water and towels still wear them off. U.S. rules only allow “water resistant (40 minutes)” or “(80 minutes)” on a label, and dermatologists say to reapply after that time and after toweling (AAD, FDA labeling).' },
    { do: 'Wash greasy pans and oily hands with soap, not just water.',
      why: 'Grease is nonpolar, so polar water slides right past it. Soap molecules have a polar end that holds water and a long nonpolar tail that dissolves into the grease, so the rinse water can carry the grease away.' },
    { do: 'To get sticker goo or tar off something, rub it with a little cooking oil first, then wash.',
      why: 'Like dissolves like. The sticky stuff is nonpolar, so a nonpolar oil softens and dissolves it, where water does nothing. Soap then removes the oil.' }
  ],
  tryIt: [
    { title: 'bend a stream (5 minutes)',
      steps: ['Turn a faucet on to a very thin, steady stream.', 'Rub a balloon or a plastic comb on your hair for 10 seconds.', 'Bring it close to the stream, without touching it. Then try it with the other end of the comb or with a different charged object.'],
      look: 'The stream bends toward the balloon every time. You are pulling on the charged ends of polar water molecules, exactly like this lab.' }
  ]
}
});

BioLab.addReview({
lewis: {
  questions: [
  {id:'n2count',kind:'test',lvl:'bio',
    q:'How many valence electrons do you have to place in a Lewis structure of N₂?',
    num:{ans:10,tol:0,unit:'electrons'},
    steps:['Nitrogen is in group 15, so each atom brings 5 valence electrons.','2 × 5 = 10.','Every structure you draw must use exactly 10, no more and no less.'],
    lab:{set:{mol:'N2'},look:'Read the electron budget at the top right.'}},
  {id:'triple',kind:'test',lvl:'bio',
    q:'Why does N₂ need a triple bond instead of a single bond?',
    choices:['With a single bond, giving both atoms 8 would take 14 electrons, but N₂ only has 10; sharing three pairs lets both count 8 with just 10','Nitrogen atoms are very large','Triple bonds are always the most stable choice','A single bond would leave too many electrons over'],correct:0,
    steps:['A single bond plus 3 lone pairs on each N uses 2 + 6 + 6 = 14.','Shared electrons count for both atoms, so sharing more saves electrons.','Triple bond: 6 shared + 1 lone pair each = 10 electrons, and each N counts 8.'],
    lab:{set:{mol:'N2'},act:'answer',look:'Compare the budget with the single-bond version.'}},
  {id:'hydrogen',kind:'test',lvl:'bio',
    q:'In H₂O, why does each hydrogen have only one bond and no lone pairs?',
    choices:['Hydrogen’s shell is full with just 2 electrons','Hydrogen has no valence electrons','Hydrogen is too small to share','Oxygen takes all of hydrogen’s electrons'],correct:0,
    steps:['Hydrogen only has a first shell, which holds 2 electrons.','One shared pair gives it 2: full.','So hydrogen always makes exactly one bond, and is always on the outside of a structure.'],
    lab:{set:{mol:'H2O'},act:'answer',look:'Look at the rings around each H.'}},
  {id:'chips',kind:'real',lvl:'bio',
    q:'Chip bags are filled with nitrogen gas before they are sealed. Why nitrogen?',
    choices:['N₂’s triple bond is very hard to break, so it doesn’t react with the oils the way oxygen does','Nitrogen makes the chips crunchier','Nitrogen is lighter than air, so the bag floats','Nitrogen adds flavor'],correct:0,
    steps:['Oxygen in air reacts slowly with the oils in chips, making them taste stale.','N₂ has a triple bond, one of the strongest bonds known, so it hardly reacts with anything.','Filling the bag with N₂ pushes the oxygen out and protects the chips until you open it.']},
  {id:'fcharge',kind:'test',lvl:'honors',
    q:'In CO₂ drawn with two C=O double bonds, what is the formal charge on carbon?',
    choices:['0','+2','−2','+4'],correct:0,
    steps:['Formal charge = valence electrons − lone-pair electrons − number of bonds.','Carbon: 4 − 0 − 4 = 0.','Each oxygen: 6 − 4 − 2 = 0. All zeros, so this is the best structure.'],
    lab:{set:{mol:'CO2',fc:true},act:'answer',look:'Read the small formal-charge labels under each atom.'}},
  {id:'resonance',kind:'test',lvl:'honors',
    q:'Nitrate, NO₃⁻, can be drawn three ways, with the double bond to a different O each time. What is the real ion like?',
    choices:['A blend: all three N–O bonds are the same length, between a single and a double bond','It flips between the three structures many times a second','Only one of the three really exists','It has three double bonds'],correct:0,
    steps:['Resonance structures differ only in where the electrons are drawn.','The real ion is the average of them, not a switch between them.','All three N–O bonds are identical, with a bond order of 4 ÷ 3 ≈ 1.33.'],
    lab:{set:{mol:'NO3'},act:'res',look:'Step through the three resonance structures.'}},
  {id:'expand',kind:'ap',lvl:'ap',
    q:'Why can sulfur in SF₄ have 10 electrons around it, while oxygen never has more than 8?',
    choices:['Sulfur is in period 3, so it has room for more electrons around it; period 2 atoms like oxygen are limited to 8','Sulfur has more protons','Fluorine gives sulfur extra electrons','Oxygen is more electronegative'],correct:0,
    steps:['Period 2 atoms (C, N, O, F) have only s and p orbitals in their valence shell: room for 8.','Period 3 and below can hold more electrons around them.','In SF₄, sulfur has 4 bonds and 1 lone pair: 10 electrons. On an FRQ, state the period as the reason.'],
    lab:{set:{mol:'SF4'},act:'answer',look:'Count the electrons around S.'}}
  ]
},
vsepr: {
  questions: [
  {id:'bentwhy',kind:'test',lvl:'bio',
    q:'Water (H₂O) is bent, but carbon dioxide (CO₂) is straight. Why?',
    choices:['Water’s O has 2 lone pairs, so it has 4 electron domains; CO₂’s C has 2 double bonds and no lone pairs, so just 2 domains','Oxygen atoms are bigger than carbon atoms','Hydrogen atoms repel each other','Double bonds are always straight'],correct:0,
    steps:['Count domains on the central atom: bonds and lone pairs.','Water: 2 bonds + 2 lone pairs = 4 domains, which spread like a tetrahedron. Only 2 are atoms, so it looks bent (104.5°).','CO₂: 2 double bonds = 2 domains, which point opposite ways (180°).'],
    lab:{set:{mode:'real',mol:'H2O'},look:'Compare water with CO₂ in Real molecules.'}},
  {id:'tetra',kind:'test',lvl:'bio',
    q:'Methane, CH₄, has four bonds around carbon. Why are the bond angles 109.5° and not 90°?',
    choices:['In 3D, four domains get farther apart by pointing to the corners of a tetrahedron','Carbon atoms are square','Hydrogen atoms attract each other','90° only happens in rings'],correct:0,
    steps:['Electron domains repel each other.','Flat, the best four can do is 90° apart.','In 3D they can reach 109.5° by pointing to the corners of a tetrahedron, which is farther apart.'],
    lab:{set:{mode:'model',nb:4,nl:0},look:'Drag the molecule to see all four angles.'}},
  {id:'microwave',kind:'real',lvl:'bio',
    q:'A microwave oven heats food by twisting water molecules back and forth. Why would this not work on CO₂?',
    choices:['CO₂ is straight, so its bond dipoles cancel; it has no charged ends for the oven’s field to twist','CO₂ is a gas','CO₂ molecules are too big','CO₂ has no electrons'],correct:0,
    steps:['The oven’s changing electric field grabs molecules with a positive end and a negative end.','Water is bent, so it has a net dipole.','CO₂ is linear, so its two dipoles cancel and the field has nothing to grab.']},
  {id:'angle',kind:'test',lvl:'honors',
    q:'CH₄, NH₃ and H₂O all have 4 electron domains on the central atom. Rank their bond angles from largest to smallest.',
    choices:['CH₄ > NH₃ > H₂O','H₂O > NH₃ > CH₄','All 109.5°','NH₃ > CH₄ > H₂O'],correct:0,
    steps:['All three start from a tetrahedral 109.5°.','Lone pairs spread out more than bonds and squeeze the bonds together.','0, 1 and 2 lone pairs: 109.5°, 106.7°, 104.5°.'],
    lab:{set:{mode:'real',mol:'NH3'},look:'Compare the angle labels for CH₄, NH₃ and H₂O.'}},
  {id:'seesaw',kind:'ap',lvl:'ap',
    q:'In SF₄ (5 electron domains, 1 lone pair), the lone pair is equatorial. Which justification earns credit?',
    choices:['An equatorial lone pair has only two 90° interactions with bonds; an axial one would have three, so equatorial minimizes repulsion','Equatorial positions are bigger','The lone pair is attracted to the fluorine atoms','Axial positions are reserved for single bonds'],correct:0,
    steps:['Repulsions at 90° are much stronger than at 120°.','Equatorial: 2 neighbors at 90°. Axial: 3 neighbors at 90°.','Fewer 90° repulsions means lower energy, so the lone pair goes equatorial: a seesaw shape.'],
    lab:{set:{mode:'model',nb:4,nl:1},look:'Turn the model to see where the lone pair sits.'}}
  ]
},
polarity: {
  questions: [
  {id:'stream',kind:'test',lvl:'bio',
    q:'A charged balloon bends a stream of water but not a stream of hexane. Why?',
    choices:['Water molecules are polar, with charged ends the balloon can pull; hexane molecules are nonpolar','Hexane is heavier','Water conducts electricity','Hexane is charged the same way as the balloon'],correct:0,
    steps:['Water is bent with polar O–H bonds, so it has a δ− end and a δ+ end.','The molecules turn their opposite end toward the balloon and get pulled.','Hexane has only C and H, with nearly equal electronegativity, so there is nothing to grab.'],
    lab:{set:{mode:'stream',liquid:'hexane',rod:'neg',dist:3},look:'Compare the deflection for water and hexane.'}},
  {id:'hcl',kind:'test',lvl:'bio',
    q:'In H–Cl, which atom gets the partial negative charge (δ−), and why?',
    choices:['Cl, because it has the higher electronegativity and pulls the shared pair closer','H, because it is smaller','Cl, because it has more protons than all other atoms','Neither; the electrons are shared equally'],correct:0,
    steps:['Electronegativity: H 2.20, Cl 3.16.','The more electronegative atom pulls the shared electrons toward itself.','So Cl is δ− and H is δ+. ΔEN = 0.96: polar covalent.'],
    lab:{set:{mode:'bond',a:'H',b:'Cl'},look:'Look at where the shared pair sits.'}},
  {id:'co2',kind:'test',lvl:'bio',
    q:'CO₂ has two very polar C=O bonds. Is the molecule polar?',
    choices:['No: it is straight, so the two bond dipoles point in opposite directions and cancel','Yes: polar bonds always make a polar molecule','Yes: oxygen is more electronegative','No: carbon dioxide has no bonds'],correct:0,
    steps:['Each C=O bond dipole points toward O.','CO₂ is linear, so the two point in exactly opposite directions.','Equal and opposite arrows cancel: no net dipole, nonpolar.'],
    lab:{set:{mode:'mol',mol:'CO2'},look:'Look for the net dipole arrow.'}},
  {id:'soap',kind:'real',lvl:'bio',
    q:'Why does dish soap remove grease when water alone doesn’t?',
    choices:['Soap has a polar end that mixes with water and a nonpolar tail that dissolves in the grease, linking the two','Soap is hotter than water','Soap is acidic and burns the grease away','Water is nonpolar'],correct:0,
    steps:['Grease is nonpolar, and water is polar: they don’t mix (“like dissolves like”).','A soap molecule has one end of each kind.','The tails grab the grease and the heads stay in the water, so rinsing carries the grease off.']},
  {id:'positive',kind:'test',lvl:'honors',
    q:'A negatively charged rod bends a water stream toward it. What does a positively charged rod do?',
    choices:['Also bends it toward the rod: the molecules turn their δ− ends to face it','Pushes it away','Nothing','Freezes it'],correct:0,
    steps:['Polar molecules can rotate.','Near a + rod they turn their δ− oxygen end toward it.','The nearer opposite charge is pulled harder than the far end is pushed, so the stream bends toward either rod.'],
    lab:{set:{mode:'stream',liquid:'water',rod:'pos',dist:3},look:'Compare the deflection with a + rod and a − rod.'}},
  {id:'bf3',kind:'ap',lvl:'ap',
    q:'BF₃ (trigonal planar) has polar B–F bonds but no net dipole, while NH₃ (trigonal pyramidal) is polar. Which justification is best?',
    choices:['In BF₃ the three bond dipoles are 120° apart in a plane and cancel; in NH₃ the pyramid shape (from N’s lone pair) leaves a net dipole toward N','B–F bonds are nonpolar','NH₃ has more atoms','Fluorine is less electronegative than nitrogen'],correct:0,
    steps:['Both have 3 polar bonds to the central atom.','BF₃ has no lone pair: flat, symmetric, and the dipoles cancel.','NH₃’s lone pair makes a pyramid: the dipoles all point partly toward N and add. Name both the bond dipoles and the shape.'],
    lab:{set:{mode:'mol',mol:'BF3'},look:'Compare BF₃ with NH₃.'}}
  ]
}
});


/* ---------- The mole, percent composition and hydrates (Nov 13, 2026): Honors Chemistry Unit 5 ---------- */
const MOC=(ctx,k,L)=>ckCard(ctx,k,L,250,282,300);
const PIEC=(ctx,k,L)=>ckCard(ctx,k,L,485,190,300);
const LABC=(ctx,k,L)=>ckCard(ctx,k,L,272,224,256);
const EMPC=(ctx,k,L)=>ckCard(ctx,k,L,420,238,360);
const run1=(sim,ids)=>ids.forEach(id=>chAct(sim,id));
const n2=v=>(+v).toFixed(2),n3=v=>(+v).toFixed(3),ok=v=>v!==null&&v!==''&&isFinite(+v)&&+v>0;
const hyDone=sim=>/^Yes/.test(String(chMet(sim,'const')||''));

BioLab.addLearn({
mole: {
  goals: {
    bio: ['What a mole is: a counting number, like a dozen', 'How to go from grams to moles to particles, and back', 'Why equal moles weigh different amounts'],
    honors: ['Grams ↔ moles ↔ particles with molar mass and Avogadro’s number', 'Why equal moles have different masses, and equal masses have different counts', 'Moles of gas at STP (22.4 L/mol)'],
    ap: ['Molar mass, Avogadro’s number and dimensional analysis', 'Gas volume at STP and moles in solution (M × L)', 'Moving between every box on the road map']
  },
  matters: 'Atoms are far too small to count, so chemists count them by weighing. Every recipe in a chemistry lab, every medicine dose and every reaction you balance runs through this one idea.',
  question: 'A one-ounce gold coin is 31.1 g of gold. How many gold atoms is that, and how many grams of water would hold the same number of molecules?',
  startKey: 'hub', startRun: false,
  startOverlay(sim,ctx,LH,k){tag(ctx,'Start here: grams',118,215,k,{s:12});tag(ctx,'Moles: the hub',400,215,k,{s:12});tag(ctx,'Particles',680,215,k,{s:12});},
  steps: [
    { key: 'hub', title: 'A mole is a counting number', set: { mode: 'map', sub: 'H2O', from: 'g', to: 'n', amt: 36 }, fresh: true, pause: true, focus: [290,90,220,120],
      see: 'The road map, set to 36.0 g of water. The Moles box sits in the middle with arrows to every other box.',
      why: 'A mole is 6.022 × 10²³ things, the way a dozen is 12. Chemists picked that number so that 1 mole of atoms weighs its atomic mass in grams. Every conversion passes through moles.',
      overlay(sim,ctx,LH,k){MOC(ctx,k,[['1 mole = 6.022 × 10²³ particles',700,14],['like 1 dozen = 12 eggs'],['Avogadro’s number']]);} },
    { key: 'gtomol', title: 'Grams → moles: divide by molar mass', set: { mode: 'map', sub: 'H2O', from: 'g', to: 'n', amt: 36 }, pause: true, focus: [10,40,500,170],
      see: 'The arrow from Mass to Moles is labeled ÷ 18.02 g/mol. 36.0 g of water becomes 2.00 mol.',
      why: 'Molar mass is grams per mole. Dividing grams by grams-per-mole leaves moles: 36.0 g ÷ 18.02 g/mol = 2.00 mol.',
      overlay(sim,ctx,LH,k){MOC(ctx,k,[['36.0 g ÷ 18.02 g/mol',700,14],['= '+chMet(sim,'mol'),700,14,RED],['units: g ÷ (g/mol) = mol']]);} },
    { key: 'molar', title: 'Where 18.02 g/mol comes from', set: { mode: 'map', sub: 'H2O', from: 'g', to: 'n', amt: 36 }, pause: true, focus: [8,90,220,120],
      see: 'Look at the Mass box and the 18.02 g/mol on its arrow. The card adds it up from the periodic table.',
      why: 'Add the atomic masses: H₂O has 2 H (1.008 each) and 1 O (16.00). 2(1.008) + 16.00 = 18.02 g/mol.',
      overlay(sim,ctx,LH,k){MOC(ctx,k,[['Molar mass of H₂O',700,14],['2 × 1.008 (H) + 16.00 (O)'],['= 18.02 g/mol',700,14,RED]]);} },
    { key: 'tonum', title: 'Moles → particles: × Avogadro’s number', set: { mode: 'map', sub: 'H2O', from: 'g', to: 'n', amt: 36 }, pause: true, focus: [290,40,500,170],
      see: 'The arrow from Moles to Particles is × 6.022 × 10²³. 2.00 mol of water is 1.20 × 10²⁴ molecules.',
      why: 'Each mole is 6.022 × 10²³ particles, so multiply: 2.00 × 6.022 × 10²³ = 1.20 × 10²⁴.',
      overlay(sim,ctx,LH,k){MOC(ctx,k,[['2.00 mol × 6.022 × 10²³',700,14],['= '+chMet(sim,'n'),700,14,RED]]);} },
    { key: 'gold', title: 'The gold coin', set: { mode: 'map', sub: 'Au', from: 'g', to: 'n', amt: 31.1 }, fresh: true, pause: true,
      see: 'The map now holds the 31.1 g gold coin: 0.158 mol, or 9.51 × 10²² gold atoms.',
      why: 'Gold’s molar mass is 196.97 g/mol, so 31.1 ÷ 196.97 = 0.158 mol. The same 0.158 mol of water weighs only 0.158 × 18.02 = 2.84 g, about half a teaspoon: each gold atom is about 11 times heavier than a water molecule.',
      overlay(sim,ctx,LH,k){MOC(ctx,k,[['Gold: '+chMet(sim,'mol')+' = '+chMet(sim,'n'),700,13],['Same count of water molecules:'],['0.158 mol × 18.02 g/mol = 2.84 g',700,14,RED]]);} },
    { key: 'samemol', title: 'Same moles, different masses', set: { mode: 'scale', basis: 'mol', nmol: 1 }, fresh: true, pause: true,
      see: 'Five pans each hold exactly 1 mol: carbon, water, salt, gold and sugar. Each has 6.02 × 10²³ particles, but the balances read 12.01 g up to 342.3 g.',
      why: 'Same count, different particle masses. A sugar molecule (C₁₂H₂₂O₁₁) is far heavier than a carbon atom, so a mole of sugar is a far bigger pile.',
      overlay(sim,ctx,LH,k){ckCard(ctx,k,[['Every pan: 1 mol = 6.02 × 10²³ particles',700,14],['Heavier particles → heavier pan']],20,70,400);} },
    { key: 'samemass', title: 'Same mass, different counts', set: { mode: 'scale', basis: 'g', gmass: 20 }, fresh: true, pause: true,
      see: 'Now every pan holds 20 g. The particle counts under the pans are no longer equal: carbon has the most and sugar the fewest.',
      why: 'Lighter particles means more of them fit in the same mass: 20 g of carbon is 1.67 mol, but 20 g of gold is only 0.10 mol. That is why reactions are planned in moles, not grams.',
      overlay(sim,ctx,LH,k){ckCard(ctx,k,[['Every pan: 20 g',700,14],['Carbon: 20 ÷ 12.01 = 1.67 mol (most particles)'],['Gold: 20 ÷ 196.97 = 0.10 mol']],20,70,400);} },
    { key: 'big', title: 'How big is a mole?', set: { mode: 'big', obj: 'water' }, fresh: true, pause: true,
      see: 'A power-of-ten ladder puts a mole (6.02 × 10²³) far past the stars in the Milky Way and the grains of sand on Earth’s beaches. Below, a mole of water is only 18 mL, about one big gulp.',
      why: 'The number is enormous because molecules are tiny: one water molecule is about 0.28 nm across. A huge count of tiny things still makes a small amount.' },
    { key: 'stp', lvl: 'honors', title: 'Gas at STP: 22.4 L per mole', set: { mode: 'map', sub: 'CO2', from: 'mol', to: 'L', amt: 2 }, fresh: true, pause: true,
      see: 'The map starts from 2.00 mol of CO₂ and converts to gas volume: 44.8 L.',
      why: 'At STP (0 °C and 1 atm) one mole of any gas fills about 22.4 L, whatever the gas, because gas particles are far apart and their own size hardly matters.',
      overlay(sim,ctx,LH,k){MOC(ctx,k,[['2.00 mol × 22.4 L/mol',700,14],['= 44.8 L at STP',700,14,RED]]);} },
    { key: 'soln', lvl: 'ap', title: 'Moles in solution: M × L', set: { mode: 'map', sub: 'NaCl', from: 'V', to: 'g', amt: 0.5, molar: 1 }, fresh: true, pause: true,
      see: 'Start from 0.500 L of 1.00 M salt water and convert to grams of NaCl: 29.2 g.',
      why: 'Molarity is moles per liter, so moles = M × L = 1.00 × 0.500 = 0.500 mol, and 0.500 mol × 58.44 g/mol = 29.2 g.',
      overlay(sim,ctx,LH,k){MOC(ctx,k,[['0.500 L × 1.00 mol/L = 0.500 mol',700,13],['0.500 mol × 58.44 g/mol = 29.2 g',700,13,RED]]);} }
  ],
  useIt: [
    { do: 'In lab, weigh out reactants using molar mass instead of trying to measure “equal amounts”.',
      why: 'Reactions combine particles in fixed ratios. 20 g of carbon and 20 g of gold are very different numbers of atoms, as the balances showed.' },
    { do: 'When you scale a recipe or a lab up or down, scale every ingredient by the same factor.',
      why: 'The ratio of particles is what matters. Doubling one ingredient alone leaves the extra unused, like an excess reactant.' },
    { do: 'Before a calculation, estimate: is my answer a sip, a spoonful or a bucket?',
      why: 'A mole of a small molecule is a handful: 18 mL of water, 58 g of salt. If your answer says 10²⁴ grams, you multiplied where you should have divided.' }
  ],
  tryIt: [
    { title: 'count rice by weighing (10 minutes)',
      steps: ['Count out exactly 100 grains of rice and weigh them on a kitchen scale (in grams).', 'Weigh a full cup of the same rice.', 'Divide: cup mass ÷ (mass of 100 grains ÷ 100) = grains in the cup.'],
      look: 'You counted thousands of grains without counting them, just by knowing the mass of one. Chemists do the same with atoms, using molar mass.' }
  ]
},

percentcomp: {
  goals: {
    bio: ['What percent composition means: each element’s share of the mass', 'Why the lightest atoms can be most of the atoms but little of the mass', 'How the magnesium oxide lab finds a formula by weighing'],
    honors: ['Percent composition from a formula', 'Empirical formula from percents or masses', 'Molecular formula from the empirical formula and molar mass'],
    ap: ['Mass data to mole ratios', 'Empirical and molecular formulas', 'Combustion analysis and oxygen by difference']
  },
  matters: 'Nutrition labels, fertilizer bags and supplement bottles all list elements by their share of the mass. The same math lets a chemist name an unknown compound from a few weighings.',
  question: 'Nutrition labels list sodium, not salt. If a recipe uses 10 g of table salt, NaCl, how many grams of sodium is that? Would 10 g of baking soda, NaHCO₃, add more sodium or less?',
  startKey: 'water', startRun: false,
  steps: [
    { key: 'water', title: 'Most of the atoms, little of the mass', set: { mode: 'pie', cmp: 'H2O', smass: 10 }, fresh: true, pause: true, focus: [150,70,330,330],
      see: 'Water’s pie: oxygen takes 88.8% of the mass and hydrogen only 11.2%, even though 2 of the 3 atoms are hydrogen. Compare the two bars on the right.',
      why: 'An oxygen atom (16.00) outweighs two hydrogen atoms (2 × 1.008 = 2.016) about 8 to 1. Percent composition is about mass, not about counting atoms.',
      overlay(sim,ctx,LH,k){PIEC(ctx,k,[['H₂O = 18.02 g/mol',700,14],['O: 16.00 ÷ 18.02 = 88.8%'],['H: 2.016 ÷ 18.02 = 11.2%']]);} },
    { key: 'salt', title: 'How much sodium is in salt?', set: { mode: 'pie', cmp: 'NaCl', smass: 10 }, fresh: true, pause: true,
      see: 'Table salt’s pie: sodium is 39.3% of the mass, so the 10 g sample holds 3.93 g of sodium.',
      why: 'Na is 22.99 and Cl is 35.45, so NaCl is 58.44 g/mol and sodium’s share is 22.99 ÷ 58.44 = 39.3%. Multiply by the sample: 10 g × 0.393 = 3.93 g.',
      overlay(sim,ctx,LH,k){PIEC(ctx,k,[['Na: 22.99 ÷ 58.44 = 39.3%',700,14],['10 g of salt × 0.393 = 3.93 g sodium',700,13,RED]]);} },
    { key: 'soda', title: 'Baking soda has less sodium', set: { mode: 'pie', cmp: 'NaHCO3', smass: 10 }, fresh: true, pause: true,
      see: 'Baking soda’s pie: sodium is only 27.4%, so 10 g holds 2.74 g of sodium.',
      why: 'Same one sodium per formula, but the rest (HCO₃ = 61.0) is heavier than chlorine (35.45), so sodium gets a smaller share of the mass.',
      overlay(sim,ctx,LH,k){PIEC(ctx,k,[['NaHCO₃ = 84.01 g/mol',700,14],['Na: 22.99 ÷ 84.01 = 27.4%'],['10 g → 2.74 g sodium (less than salt)',700,13,RED]]);} },
    { key: 'mgadd', title: 'The magnesium oxide lab: weigh', set: { mode: 'mgo' }, fresh: true, speed: 1, focus: [540,240,240,200], run(sim){run1(sim,['empty','add']);},
      see: 'An empty crucible and lid are weighed, then a coil of magnesium ribbon is added and weighed again.',
      why: 'The difference between the two readings is the exact mass of magnesium, about 0.3 g. Everything later is found by subtraction.',
      overlay(sim,ctx,LH,k){LABC(ctx,k,[['Step 1: mass of Mg',700,14],['(crucible + Mg) − (empty crucible)']]);} },
    { key: 'burn', title: 'Burn it: oxygen joins the magnesium', set: { mode: 'mgo' }, speed: 0.5, focus: [[90,190,190,250],[300,50,220,220]], run(sim){run1(sim,['heat']);},
      see: 'The crucible heats with its lid slightly open. In the circle, red oxygen joins the green magnesium.',
      why: 'Magnesium combines with oxygen from the air: 2Mg + O₂ → 2MgO. The lid lets air in but keeps the white MgO smoke from escaping.',
      overlay(sim,ctx,LH,k){LABC(ctx,k,[['2Mg + O₂ → 2MgO',700,14],['Oxygen comes from the air.']]);} },
    { key: 'mgweigh', title: 'Weigh the product: the extra mass is oxygen', set: { mode: 'mgo' }, speed: 3, focus: [540,240,240,200], run(sim){run1(sim,['heat']);if(sim.p.water)chAct(sim,'waterA');chAct(sim,'weigh');},
      see: 'After cooling, the crucible is heavier than before heating. The card turns the masses into moles.',
      why: 'The gain is the mass of oxygen that joined. Change both masses to moles and divide: about 1 mol O per mol Mg, so the formula is MgO.',
      overlay(sim,ctx,LH,k){const r=chMet(sim,'ratio'),a=chMet(sim,'mMg'),o=chMet(sim,'mO');LABC(ctx,k,ok(r)&&ok(o)?[['Mg '+n3(a)+' g, O gained '+n3(o)+' g',700,12.5],['mol O ÷ mol Mg = '+n2(r),700,14,RED],['≈ 1 : 1 → MgO']]:[['Heating, cooling, weighing…',700,14],['The ratio appears after the last weighing.']]);} },
    { key: 'emp', title: 'Percents → moles', set: { mode: 'emp', unk: 'glucose', given: 'pct' }, fresh: true, pause: true, focus: [0,40,800,300], run(sim){sim.st.step=3;},
      see: 'Mystery compound A is 40.00% C, 6.71% H and 53.29% O. The table turns those percents into moles, then divides each by the smallest.',
      why: 'Assume 100 g, so the percents become grams. Divide each by its atomic mass to get moles, then divide by the smallest to get the simplest ratio.',
      overlay(sim,ctx,LH,k){EMPC(ctx,k,[['Assume 100 g: 40.00 g C, 6.71 g H, 53.29 g O',700,12.5],['÷ atomic mass → moles; ÷ smallest → ratio']]);} },
    { key: 'ratio', title: 'The simplest ratio: CH₂O', set: { mode: 'emp', unk: 'glucose', given: 'pct' }, pause: true, focus: [0,40,800,420], run(sim){sim.st.step=4;},
      see: 'The ratio row reads 1 : 2 : 1, and the empirical formula CH₂O appears.',
      why: 'An empirical formula is the smallest whole-number ratio of atoms. It doesn’t yet say how many of each are in one molecule.',
      overlay(sim,ctx,LH,k){EMPC(ctx,k,[['C 1 : H 2 : O 1',700,14],['Empirical formula: CH₂O',700,14,RED]]);} },
    { key: 'molec', lvl: 'honors', title: 'The molecular formula: C₆H₁₂O₆', set: { mode: 'emp', unk: 'glucose', given: 'pct' }, pause: true, focus: [0,40,800,420], run(sim){sim.st.step=5;},
      see: 'Using the molar mass, 180.2 g/mol, the molecular formula C₆H₁₂O₆ appears beside the empirical one.',
      why: 'CH₂O weighs 30.03 g/mol. 180.2 ÷ 30.03 = 6, so multiply every subscript by 6: glucose.',
      overlay(sim,ctx,LH,k){EMPC(ctx,k,[['180.2 ÷ 30.03 = 6',700,14],['CH₂O × 6 = C₆H₁₂O₆',700,14,RED]]);} },
    { key: 'comb', lvl: 'ap', title: 'Combustion analysis', set: { mode: 'comb' }, fresh: true, speed: 0.6, focus: [0,40,800,420], run(sim){sim.st.burnT=0;},
      see: 'A 0.50 g sample burns in oxygen. The water and CO₂ absorbers gain mass as the products flow through.',
      why: 'All of the sample’s carbon ends up in CO₂ and all its hydrogen in H₂O. Oxygen is found by difference, because some oxygen in the products came from the O₂ used to burn it.',
      overlay(sim,ctx,LH,k){EMPC(ctx,k,[['C from CO₂, H from H₂O, O by difference',700,13]]);} }
  ],
  useIt: [
    { do: 'Count sodium, not salt, on food labels: 1 teaspoon of salt is about 2,300 mg of sodium.',
      why: 'Salt is only 39% sodium by mass. The FDA’s Daily Value for sodium, 2,300 mg, is about the sodium in one teaspoon of table salt.' },
    { do: 'Compare calcium supplements by the calcium they contain, not the tablet’s mass.',
      why: 'Calcium carbonate is 40% calcium by mass and calcium citrate only 21%, so the same size tablet gives very different amounts. The NIH Office of Dietary Supplements lists both figures.' },
    { do: 'Read the three numbers on a fertilizer bag as percents by mass.',
      why: 'The first number is percent nitrogen. Ammonium nitrate, NH₄NO₃, is 35% nitrogen, so it is sold as 34-0-0.' }
  ],
  tryIt: [
    { title: 'the sodium hunt (5 minutes)',
      steps: ['Find two packaged foods at home and read the sodium (mg) per serving.', 'Divide by 2,300 mg to get the percent of a day’s limit.', 'Divide the sodium by 0.393 to find how many grams of salt that would be.'],
      look: 'A serving of soup or chips can be a quarter of a day’s sodium. Dividing by 0.393 undoes salt’s 39.3% sodium share.' }
  ]
},

hydrate: {
  goals: {
    bio: ['What a hydrate is: water built into a crystal', 'How to find the percent water by heating and weighing', 'Why you heat to constant mass'],
    honors: ['Percent water from lab data', 'The formula of a hydrate: x = mol H₂O ÷ mol salt', 'Which lab mistakes push x up or down'],
    ap: ['Mass data to mole ratios', 'Error analysis for each technique choice', 'Reading the mass vs. temperature curve']
  },
  matters: 'Drywall, Epsom salt and the humidity cards packed with electronics all hold water inside their crystals. The lab you do in class finds exactly how much, using only a balance and a burner.',
  question: 'Epsom salt from the drugstore is MgSO₄·7H₂O: water is built right into the crystals. If you heat 2.00 g of it until the mass stops changing, how much of it leaves as water?',
  startKey: 'crystal', startRun: false,
  steps: [
    { key: 'crystal', title: 'Water inside a crystal', set: { hyd: 'cu' }, fresh: true, pause: true, focus: [325,60,195,195],
      see: 'The circle zooms into blue copper(II) sulfate pentahydrate. Each Cu²⁺ (blue) and SO₄²⁻ pair has small water molecules (red and white) built into the crystal around it.',
      why: 'A hydrate is an ionic solid with a fixed number of water molecules per formula unit. CuSO₄·5H₂O has 5, and they make up 36.1% of its mass.',
      overlay(sim,ctx,LH,k){LABC(ctx,k,[['CuSO₄·5H₂O',700,14],['5 H₂O per CuSO₄ = 36.1% water by mass']]);} },
    { key: 'empty', title: 'Weigh the empty crucible', speed: 1, focus: [560,300,220,160], run(sim){run1(sim,['weighEmpty']);},
      see: 'The clean, dry crucible goes on the balance and its mass is recorded.',
      why: 'Every later reading includes the crucible, so you will subtract this number from each one.',
      overlay(sim,ctx,LH,k){LABC(ctx,k,[['Reading 1: empty crucible',700,14],['Subtract it from every later reading.']]);} },
    { key: 'add', title: 'Add the hydrate and weigh', speed: 1, focus: [560,300,220,160], run(sim){run1(sim,['add']);},
      see: 'About 2 g of blue crystals go into the crucible, and the balance reads higher.',
      why: 'The difference between the two readings is the exact mass of hydrate.',
      overlay(sim,ctx,LH,k){const m=chMet(sim,'mh');LABC(ctx,k,[['Mass of hydrate',700,14],[(ok(m)?n3(m)+' g':'(crucible + crystals) − empty'),700,14,RED]]);} },
    { key: 'heat', title: 'Heat: the water leaves', speed: 0.5, focus: [[90,230,200,230],[325,60,195,195]], run(sim){run1(sim,['heat']);},
      see: 'The crucible heats over the burner. In the circle, water molecules break away from the ions and drift off as vapor. The ions stay.',
      why: 'Heat breaks the attractions holding water in the crystal. Only the water leaves; the copper and sulfate ions stay behind as anhydrous CuSO₄.',
      overlay(sim,ctx,LH,k){LABC(ctx,k,[['CuSO₄·5H₂O → CuSO₄ + 5H₂O(g)',700,13],['Water leaves; the salt stays.']]);} },
    { key: 'cool', title: 'Cool in a desiccator, then weigh', speed: 0.7, focus: [[340,320,160,140],[560,300,220,160]], run(sim){run1(sim,['cool']);},
      see: 'Tongs move the crucible into the desiccator to cool, then onto the balance. It weighs less than before heating.',
      why: 'The desiccator keeps the dry salt from pulling water back out of the air while it cools. The mass lost is water.',
      overlay(sim,ctx,LH,k){LABC(ctx,k,[['Lighter = water lost',700,14],['Cool dry, or it re-absorbs water.']]);} },
    { key: 'constant', title: 'Repeat until constant mass', speed: 3, focus: [0,0,800,500], run(sim){run1(sim,['auto']);},
      see: 'Heat, cool and weigh, again and again. The mass drops a lot at first, then levels off.',
      why: 'When two weighings in a row agree within 0.005 g, all the water is gone. Stopping after one heating would leave water behind and make your percent too low.',
      overlay(sim,ctx,LH,k){LABC(ctx,k,[['Heatings: '+chMet(sim,'heats'),700,14],['Constant mass? '+chMet(sim,'const')]]);} },
    { key: 'pct', title: 'Percent water', speed: 3,
      see: 'The card divides the water lost by the hydrate’s mass. It comes out close to the accepted 36.1%.',
      why: '% water = mass of water lost ÷ mass of hydrate × 100.',
      overlay(sim,ctx,LH,k){LABC(ctx,k,hyDone(sim)?[['Water lost: '+n3(chMet(sim,'mw'))+' g of '+n3(chMet(sim,'mh'))+' g',700,12.5],['% water = '+n2(chMet(sim,'pct'))+'%',700,14,RED],['accepted: 36.1%']]:[['Heating to constant mass…',700,14],['% water appears when the mass stops changing.']]);} },
    { key: 'epsom', title: 'Epsom salt: about half is water', set: { hyd: 'mg' }, fresh: true, speed: 6, run(sim){run1(sim,['weighEmpty','add','auto']);},
      see: 'Now the same lab with Epsom salt, MgSO₄·7H₂O. About half of the mass leaves as water: 51.2%.',
      why: 'Seven waters (7 × 18.02 = 126.1 g) out of 246.47 g/mol is 51.2%. So 2.00 g of Epsom salt loses about 1.02 g of water.',
      overlay(sim,ctx,LH,k){LABC(ctx,k,[['MgSO₄·7H₂O',700,14],hyDone(sim)?['% water = '+n2(chMet(sim,'pct'))+'%   (accepted 51.2%)',700,13,RED]:['Heating to constant mass…',500,12.5]]);} },
    { key: 'x', lvl: 'honors', title: 'Find x', set: { hyd: 'cu' }, fresh: true, speed: 6, run(sim){run1(sim,['weighEmpty','add','auto']);},
      see: 'Back to copper sulfate. The card turns both masses into moles and divides.',
      why: 'x = mol H₂O ÷ mol anhydrous salt, rounded to a whole number. For copper(II) sulfate it comes out at 5.',
      overlay(sim,ctx,LH,k){const d=hyDone(sim);LABC(ctx,k,[['mol H₂O ÷ mol CuSO₄',700,14],d?[(+chMet(sim,'molw')).toFixed(4)+' ÷ '+(+chMet(sim,'mola')).toFixed(4),500,12]:['Heating to constant mass…',500,12],['x = '+(d?n2(chMet(sim,'x'))+' ≈ '+Math.round(chMet(sim,'x')):'…'),700,14,RED]]);} },
    { key: 'airx', lvl: 'honors', title: 'A mistake: cooling in open air', set: { hyd: 'cu', cool: 'air' }, fresh: true, speed: 6, run(sim){run1(sim,['weighEmpty','add','auto']);},
      see: 'The same lab, but the crucible cools on the open bench. x comes out below 5.',
      why: 'Dry CuSO₄ pulls water vapor back from the air while it cools, so each weighing is too heavy. The water you calculate is too small, so % water and x come out low.',
      overlay(sim,ctx,LH,k){LABC(ctx,k,[['Cooled in open air',700,14],hyDone(sim)?['x = '+n2(chMet(sim,'x'))+'  (should be 5)',700,14,RED]:['Heating to constant mass…',500,12.5]]);} }
  ],
  useIt: [
    { do: 'Keep the humidity cards and silica gel packets that come with electronics, and check them.',
      why: 'Many humidity cards use cobalt(II) chloride, which is blue when dry and pink as a hydrate. Pink means the air in the box is damp. (Keep the packets away from small children and pets.)' },
    { do: 'Store Epsom salt, baking soda and other powders sealed and dry.',
      why: 'Many salts pull water from the air to form hydrates, which makes them cake into lumps and changes how much of the real compound is in each spoonful.' },
    { do: 'Leave the drywall between a garage and a house in place.',
      why: 'Gypsum, CaSO₄·2H₂O, is about 21% water by mass. In a fire that water must boil off before the wall fails, which slows the fire. Building codes require gypsum board between attached garages and homes for that reason.' }
  ],
  tryIt: [
    { title: 'Epsom salt crystals (overnight)',
      steps: ['Stir Epsom salt into half a cup of hot tap water until no more dissolves.', 'Brush a thin layer onto a dark plate or piece of black paper.', 'Leave it overnight in a warm, dry place.'],
      look: 'Long, needle-shaped crystals grow. Water molecules are part of each crystal, which is why the label says MgSO₄·7H₂O, not just MgSO₄.' }
  ]
}
});

BioLab.addReview({
mole:{questions:[
  {id:'whymole',kind:'test',lvl:'bio',q:'Why do chemists count atoms in moles instead of one by one?',choices:['Atoms are too small and too many to count, so they are counted by weighing a known number at once','A mole is a unit of mass','Moles are easier to spell','Atoms can only be counted in groups of 12'],correct:0,
    steps:['Even a drop of water holds over 10²¹ molecules.','A mole is a fixed count, 6.022 × 10²³, chosen so 1 mol of atoms weighs its atomic mass in grams.','So weighing out the molar mass in grams counts out a mole of particles.']},
  {id:'divide',kind:'test',lvl:'bio',q:'To change 36.0 g of water to moles, why do you divide by 18.02 g/mol instead of multiplying?',choices:['Dividing makes the number smaller','You always divide in chemistry','Molar mass is grams per mole, so grams ÷ (grams per mole) leaves moles','Multiplying would give particles'],correct:2,
    steps:['Write the units: g ÷ (g/mol) = g × (mol/g) = mol.','36.0 g ÷ 18.02 g/mol = 2.00 mol.','If you multiplied, the units would be g²/mol, a sign the setup is wrong.']},
  {id:'samemass',kind:'test',lvl:'bio',q:'20 g of carbon and 20 g of gold sit on two pans. Which holds more atoms, and why?',choices:['Gold, because it is denser','The same, because the masses are equal','Gold, because its atoms are bigger','Carbon, because each carbon atom is much lighter, so more of them fit in 20 g'],correct:3,
    steps:['Carbon: 20 ÷ 12.01 = 1.67 mol. Gold: 20 ÷ 196.97 = 0.10 mol.','Moles count particles, so carbon has about 16 times as many atoms.','Equal masses are not equal numbers of particles.']},
  {id:'gulp',kind:'real',lvl:'bio',q:'About how much water is one mole of water molecules?',choices:['About a gallon','About 18 mL, a big gulp','About a swimming pool','About a single drop'],correct:1,
    steps:['One mole of water is 18.02 g.','Water is 1.00 g/mL, so 18 g is 18 mL.','The count (6.02 × 10²³) is huge, but each molecule is tiny.']},
  {id:'hatoms',kind:'test',lvl:'honors',q:'How many hydrogen atoms are in 1.00 mol of H₂O?',choices:['6.02 × 10²³','3.01 × 10²³','1.20 × 10²⁴','2'],correct:2,
    steps:['1.00 mol of H₂O is 6.02 × 10²³ molecules.','Each molecule has 2 H atoms.','2 × 6.02 × 10²³ = 1.20 × 10²⁴ H atoms.']},
  {id:'stp',kind:'test',lvl:'honors',q:'Why does 1 mol of CO₂ fill the same 22.4 L at STP as 1 mol of He, even though CO₂ molecules are much bigger?',choices:['Gas particles are so far apart that their own size barely matters to the volume','CO₂ shrinks at 0 °C','Helium expands more','It doesn’t: CO₂ fills more'],correct:0,
    steps:['In a gas, almost all the volume is empty space between particles.','Equal numbers of particles at the same temperature and pressure take up equal volumes (Avogadro’s law).','So 1 mol of any ideal gas fills about 22.4 L at 0 °C and 1 atm.']},
  {id:'molarity',kind:'test',lvl:'ap',q:'How many grams of NaCl are in 250. mL of 2.00 M NaCl? (NaCl = 58.44 g/mol)',choices:['117 g','0.500 g','14.6 g','29.2 g'],correct:3,
    steps:['Moles = M × L = 2.00 mol/L × 0.250 L = 0.500 mol.','Grams = 0.500 mol × 58.44 g/mol = 29.2 g.','Convert mL to L first: 250. mL = 0.250 L.']}
]},
percentcomp:{questions:[
  {id:'mostmass',kind:'test',lvl:'bio',q:'Two of water’s three atoms are hydrogen. Why is water 88.8% oxygen by mass?',choices:['Percent composition counts atoms','One oxygen atom (16.00) is about 8 times heavier than two hydrogen atoms together (2.016)','Oxygen atoms are larger','Hydrogen has no mass'],correct:1,
    steps:['Percent composition is about each element’s share of the mass.','O: 16.00 g/mol; 2 H: 2.016 g/mol; total 18.02 g/mol.','16.00 ÷ 18.02 = 88.8% oxygen.']},
  {id:'samepct',kind:'test',lvl:'bio',q:'You analyze 100 g of water instead of 10 g. Why does the percent oxygen stay 88.8%?',choices:['Because the balance is the same','Because percent always equals 88.8','It doesn’t; it rises to 100%','Every sample of a pure compound has the same composition (law of definite proportions)'],correct:3,
    steps:['The mass of oxygen grows with the sample: 8.88 g to 88.8 g.','But the whole sample grows by the same factor.','So the ratio, and the percent, never change for a pure compound.']},
  {id:'sodiumlabel',kind:'real',lvl:'bio',q:'A recipe calls for 5.0 g of table salt (NaCl, 39.3% sodium). About how much sodium is that?',choices:['5.0 g','12.7 g','2.0 g','0.39 g'],correct:2,
    steps:['Sodium is 39.3% of salt’s mass.','5.0 g × 0.393 = 1.97 g, about 2.0 g, or almost 2,000 mg.','That is close to a whole day’s 2,300 mg limit.']},
  {id:'calcium',kind:'real',lvl:'bio',q:'Why can two calcium tablets of the same mass give different amounts of calcium?',choices:['Different calcium compounds have different percents of calcium by mass (carbonate 40%, citrate 21%)','One is fake','Calcium changes in the bottle','The body absorbs every compound the same'],correct:0,
    steps:['The tablet is a compound, not pure calcium.','Calcium carbonate is 40% Ca by mass; calcium citrate is about 21%.','So 1,000 mg of carbonate holds about 400 mg of calcium, but 1,000 mg of citrate only about 210 mg.']},
  {id:'lidoff',kind:'test',lvl:'honors',q:'In the MgO lab, white smoke escapes because the lid was off. Why does your O : Mg ratio come out too low?',choices:['Smoke adds oxygen','The smoke is MgO; losing it makes the product too light, so the oxygen gained looks too small','The Mg reacts faster','The ratio isn’t affected'],correct:1,
    steps:['The white smoke is the product, MgO.','Less product on the balance means a smaller mass gain.','Less “oxygen” per magnesium gives a ratio below 1.']},
  {id:'fe2o3',kind:'test',lvl:'honors',q:'An iron oxide gives 1.00 Fe : 1.50 O. Why is its empirical formula Fe₂O₃ and not FeO₂?',choices:['Iron always comes in pairs','Oxygen must be odd','1.50 is not close to a whole number, so multiply both by 2 to get 2 : 3','You round 1.50 to 2'],correct:2,
    steps:['Only round when a value is within about 0.1 of a whole number.','1.50 is halfway, so find the smallest multiplier that makes it whole: × 2.','2 Fe : 3 O → Fe₂O₃. Rounding to FeO₂ is the most common mistake.']},
  {id:'diff',kind:'test',lvl:'ap',q:'In combustion analysis, why is the sample’s oxygen found by difference rather than from the products?',choices:['Oxygen escapes as a gas','The absorbers hold oxygen','The sample contains no oxygen','Some of the oxygen in the CO₂ and H₂O came from the O₂ used to burn the sample'],correct:3,
    steps:['Every C in the CO₂ and every H in the H₂O came from the sample.','But oxygen in those products came partly from the burning O₂.','So subtract the C and H masses from the sample mass to find O.']}
]},
hydrate:{questions:[
  {id:'whatis',kind:'test',lvl:'bio',q:'What makes CuSO₄·5H₂O a hydrate?',choices:['Water molecules are built into its crystal in a fixed ratio: 5 per CuSO₄','It dissolves in water','It is wet on the outside','It is made in water'],correct:0,
    steps:['A hydrate is an ionic solid with water inside its crystal structure.','The ·5H₂O tells you there are 5 water molecules per formula unit.','Heating drives that water off and leaves the anhydrous salt.']},
  {id:'constant',kind:'test',lvl:'bio',q:'Why do you heat the hydrate again and again until two weighings agree?',choices:['To make the crucible clean','To make sure all the water has left; stopping early leaves water in and makes % water too low','To warm the balance','Because the rules say three times'],correct:1,
    steps:['Most water leaves in the first heating, but not all of it.','When the mass stops changing, no water is left to lose.','Stopping early undercounts the water lost, so % water and x come out low.']},
  {id:'white',kind:'test',lvl:'bio',q:'Blue copper(II) sulfate turns almost white when heated. Why?',choices:['The copper burns away','The crucible paints it white','It turns into salt','The blue color comes from water bonded to the Cu²⁺ ions; without it, anhydrous CuSO₄ is nearly white'],correct:3,
    steps:['In the hydrate, water molecules surround each Cu²⁺.','That arrangement absorbs red-orange light, so it looks blue.','Remove the water and the color goes; add water back and it turns blue again.']},
  {id:'drywall',kind:'real',lvl:'bio',q:'Why does drywall (gypsum, CaSO₄·2H₂O) slow down a house fire?',choices:['About 21% of its mass is water that must boil off before the wall heats through','Gypsum is fireproof paint','It reflects heat','It contains a fire extinguisher'],correct:0,
    steps:['Gypsum is a hydrate with water in its crystals.','In a fire, heat goes into driving that water off first.','While the water boils away, the wall stays near 100 °C, slowing the fire’s spread.']},
  {id:'aircool',kind:'test',lvl:'honors',q:'A student cools the crucible on the open bench. Why do % water and x come out too low?',choices:['The crucible loses mass in air','Cooling makes the balance read low','Dry salt pulls water vapor back from the air, so it weighs too much and the calculated water lost is too small','Air adds oxygen'],correct:2,
    steps:['Anhydrous salts are hygroscopic: they absorb water vapor.','A heavier “dry” sample means less apparent water lost.','Less water lost → lower % water and a smaller x.']},
  {id:'spatter',kind:'test',lvl:'honors',q:'A student uses a strong flame from the start and hears popping. Why does % water come out too high?',choices:['The flame adds water','Boiling water spatters solid out of the crucible, and that lost solid is counted as water','The salt gets heavier','It doesn’t change % water'],correct:1,
    steps:['Water boiling inside crystals can burst them and throw solid out.','You calculate water lost from the mass lost.','Lost solid adds to the mass lost, so % water and x come out too high.']},
  {id:'xcalc',kind:'test',lvl:'ap',q:'A 2.000 g sample of MgSO₄·xH₂O leaves 0.977 g of MgSO₄ (120.36 g/mol). What is x?',choices:['7','5','6','8'],correct:0,
    steps:['Water lost = 2.000 − 0.977 = 1.023 g ÷ 18.02 = 0.05677 mol.','MgSO₄ = 0.977 ÷ 120.36 = 0.008117 mol.','x = 0.05677 ÷ 0.008117 = 6.99 ≈ 7: MgSO₄·7H₂O, Epsom salt.']}
]}
});


/* ===== Kinetics: rates (collision theory) and ratelaw ===== */
const rtSync=sim=>{if(sim.def.sync)sim.def.sync(sim);};
const rtM=(sim,id)=>{const v=chMet(sim,id);return typeof v==='number'?v:NaN;};
const rtF=(v,d)=>isNaN(v)?'…':v.toFixed(d==null?1:d);
function rtTw(sim,tau,spec,t0,dur){const f=ease(clamp((tau-t0)/dur,0,1)),o={};for(const id in spec){const [a,b,st]=spec[id];let v=a+(b-a)*f;if(st)v=Math.round(v/st)*st;if(Math.abs(sim.p[id]-v)>1e-6)o[id]=v;}if(Object.keys(o).length)BioLab.setValues(sim,o);return f;}
const rtH=sim=>{const v=rtM(sim,'half');return isNaN(v)?'Halfway: still reacting…':'Halfway in '+v.toFixed(1)+' s';};
const RC=(ctx,k,L)=>ckCard(ctx,k,L,24,66,300);
const KR='#c8102e',KG='#1b7a3a',KB='#1f5fbf',KP='#6a3fa0';
function rlCard(ctx,k,L,LH){const s=Math.max(...L.map(l=>typeof l==='string'?12.5:(l[2]||12.5)));const h=8+L.length*s*Math.min(k,1.45)*1.38;return ckCard(ctx,k,L,14,(LH||500)-h-10,288);}
const rlTX=sim=>{const v=chMet(sim,'tX');return typeof v==='number'&&!isNaN(v)?v.toFixed(1)+' s':'not yet…';};

BioLab.addLearn({
rates: {
  goals: {
    bio: ['Why particles must collide to react, and why most collisions just bounce', 'What the energy hill (activation energy) is', 'Why heat, concentration, surface area and catalysts speed reactions up'],
    honors: ['Collision theory: how often, how hard, and which way particles hit', 'Activation energy and the Maxwell–Boltzmann curve', 'Why heating raises the rate far more than it raises collisions', 'How a catalyst lowers Eₐ without changing ΔH'],
    ap: ['Rate = collision frequency × fraction with E ≥ Eₐ × orientation factor', 'Maxwell–Boltzmann tails and why k depends so strongly on T', 'Why rate ∝ [A][B] for this one-step reaction', 'Catalysts and surface area in collision terms']
  },
  matters: 'Fridges, kindling, the enzymes in your body and the catalytic converter in a car all work by controlling one thing: how often particles collide hard enough to react.',
  startKey: 'box', startRun: true, startSpeed: 0.5,
  startOverlay(sim,ctx,LH,k){tag(ctx,'Zoomed in on a tiny drop of solution',242,462,k,{s:12,hi:true});},
  steps: [
    { key: 'bounce', title: 'Most collisions just bounce', fresh: true, speed: 0.15, run: rtSync,
      see: { bio: 'Slowed way down. Rings mark collisions. A gray ring was too gentle and the particles just bounced. A yellow flash worked: A and B stuck together as AB.', honors: 'Slowed way down. A gray ring was too gentle. A purple ring had enough energy but hit the wrong side of B. A yellow flash reacted.' },
      why: 'Particles have to hit each other to react, but a hit only works if it is hard enough and lined up right. At room temperature only about 2 collisions in 100 make AB.',
      overlay(sim,ctx,LH,k){RC(ctx,k,[['300 K (room temperature)',700,14],'Collisions per second: '+rtF(rtM(sim,'Z'),0),['Ones that react: '+rtF(rtM(sim,'succ'),1)+'%',700,12.5,KG]]);} },
    { key: 'hill', title: 'The energy hill', fresh: true, speed: 0.5, run: rtSync, focus: [488,286,300,196],
      see: 'The energy diagram shows A + B climbing a hill before dropping down to AB. The height of the hill is the activation energy, Eₐ: 10 kJ/mol here.',
      why: 'Old bonds have to start breaking before new ones can form, and that costs energy up front. A collision with less than Eₐ rolls back down and the particles bounce apart.',
      so: { honors: 'AB ends up 30 kJ/mol lower than A + B, so the reaction releases heat (ΔH = −30 kJ/mol). Eₐ and ΔH are separate: a reaction can release lots of energy and still be slow.' },
      overlay(sim,ctx,LH,k){RC(ctx,k,[['The energy hill',700,14],['Eₐ = 10 kJ/mol to get over the top',600,12.5,KR],'ΔH = −30 kJ/mol: energy given off']);} },
    { key: 'tail', title: 'Who has enough energy?', fresh: true, speed: 0.5, run: rtSync, focus: [488,58,300,172],
      see: 'The curve shows how many particles have each amount of energy. Only the shaded tail past the red Eₐ line can get over the hill: about 5% at 300 K.',
      why: 'Particles in a gas or liquid don’t all move at the same speed. Most are near the average, and only a few are moving fast enough at any moment.',
      overlay(sim,ctx,LH,k){RC(ctx,k,[['300 K',700,14],['Past Eₐ: '+rtF(rtM(sim,'fE'),1)+'% of particles',700,12.5,KR],'The rest can’t react, however often they hit']);} },
    { key: 'heat', title: 'Heat it up', fresh: true, speed: 0.5, run: rtSync, focus: [[488,58,300,172],[16,58,452,424]],
      see: 'Watch the temperature climb from 300 K to 450 K. The particles speed up, the energy curve stretches right, and the shaded tail past Eₐ grows from about 5% to about 15%. AB now forms about 4 times as fast.',
      why: { bio: 'Hotter particles hit more often, but the big change is that many more hits are hard enough. That is why food spoils fast on a warm counter and slowly in the fridge.', honors: 'Collisions per second rise only about 9% (speed ∝ √T), but the fraction past Eₐ triples. The tail of the curve is what makes rate so sensitive to temperature.' },
      overlay(sim,ctx,LH,k,tau){const f=rtTw(sim,tau,{T:[300,450,5]},1,3);RC(ctx,k,[[(f<1?'Heating… ':'')+Math.round(sim.p.T)+' K (started at 300 K)',700,14],['Past Eₐ: '+rtF(rtM(sim,'fE'),1)+'% (started at 4.6%)',700,12.5,KR],'Ones that react: '+rtF(rtM(sim,'succ'),1)+'% of collisions']);} },
    { key: 'conc', title: 'More particles, more collisions', set: { cA: 1 }, fresh: true, speed: 0.5, run: rtSync,
      see: 'A fresh batch with twice as much A: 1.0 M instead of 0.5 M. The box is more crowded and collisions per second about double.',
      why: { bio: 'More A in the same space means more A–B hits every second. The share that work stays the same, so the rate about doubles.', ap: 'Collisions per second scale with [A][B], so rate = k[A][B]. Doubling [A] doubles Z and the rate while k, which depends on f and p, stays fixed.' },
      overlay(sim,ctx,LH,k){RC(ctx,k,[['[A] = 1.0 M (was 0.5 M)',700,14],'Collisions per second at the start: about 2×','Share that react: '+rtF(rtM(sim,'succ'),1)+'% (same)',['Starting rate: 0.039 M/s (was 0.020)',700,12.5,KG]]);} },
    { key: 'orient', lvl: 'honors', title: 'Orientation matters', set: { T: 600 }, fresh: true, speed: 0.15, run: rtSync,
      see: 'At 600 K most hits have enough energy, yet many still fail (purple rings). Only the dark half of each B can react.',
      why: 'Bonds can only form where the reacting atoms meet. A collision on the wrong side of B bounces off however hard it is. Here the orientation factor p = 0.5.',
      overlay(sim,ctx,LH,k){RC(ctx,k,[['600 K',700,14],'Past Eₐ: '+rtF(rtM(sim,'fE'),1)+'%',['Ones that react: '+rtF(rtM(sim,'succ'),1)+'% (about half)',700,12.5,KP],'Purple ring = energy enough, wrong side']);} },
    { key: 'math', lvl: 'ap', title: 'Rate = Z × f × p', fresh: true, speed: 0.5, run: rtSync,
      see: 'Back to 300 K. The readouts give the three pieces of collision theory.',
      why: 'Reactions per second = collisions per second (Z) × fraction with E ≥ Eₐ (f) × fraction with the right orientation (p). The Arrhenius equation k = A·e^(−Eₐ/RT) packs Z and p into A and f into the exponential.',
      overlay(sim,ctx,LH,k){const Z=rtM(sim,'Z'),f=rtM(sim,'fE')/100,p=rtM(sim,'p');RC(ctx,k,[['Collision theory',700,14],'Z = '+rtF(Z,0)+' collisions/s','f = '+rtF(100*f,1)+'%   p = '+rtF(p,2),['Z × f × p ≈ '+rtF(Z*f*p,1)+' reactions/s',700,12.5,KG]]);} },
    { key: 'cat', title: 'A catalyst lowers the hill', fresh: true, speed: 0.5, run: rtSync, focus: [[488,58,300,172],[488,286,300,196]],
      see: 'Still 300 K. Watch what happens when the catalyst goes in: a lower, dashed green path appears on the energy diagram, the green Eₐ line jumps left on the energy curve, and the shaded tail grows from about 5% to about 22%. Yellow flashes come much more often.',
      why: { bio: 'A catalyst gives the reaction an easier path. The particles have the same energy as before; there is just a lower hill to climb. The catalyst itself is not used up.', honors: 'The catalyst lowers Eₐ but doesn’t change ΔH or the particles’ energy distribution. It speeds the forward and reverse reactions alike and is not used up.' },
      overlay(sim,ctx,LH,k,tau){if(tau>1.5&&!sim.p.cat)BioLab.setValues(sim,{cat:true});RC(ctx,k,[[sim.p.cat?'Catalyst added, still 300 K':'No catalyst yet…',700,14],['Past Eₐ: '+rtF(rtM(sim,'fE'),1)+'% (without catalyst: 4.6%)',700,12.5,KG],'Ones that react: '+rtF(rtM(sim,'succ'),1)+'% of collisions']);} },
    { key: 'mg', title: 'Solids react only at the surface', set: { rxn: 'mg' }, fresh: true, speed: 0.5, run: rtSync,
      see: 'Now a chunk of magnesium in 1 M hydrochloric acid. H⁺ ions (pink) hit the metal and H₂ bubbles rise. Only the outside atoms can be hit.',
      why: 'Acid can’t reach the atoms buried inside the chunk. Of the 12 Mg atoms, only 10 faces are touching acid at first, so the bubbles come slowly: about 0.2 per second.',
      overlay(sim,ctx,LH,k){RC(ctx,k,[['One chunk, 1 M HCl',700,14],'Faces touching acid: '+rtF(rtM(sim,'surfA'),0),['H₂ bubbles: '+rtF(rtM(sim,'bub'),2)+' per second',700,12.5,KG]]);} },
    { key: 'powder', title: 'Powder: same metal, more surface', set: { rxn: 'mg', surf: 'powder' }, fresh: true, speed: 0.5, run: rtSync,
      see: 'The same 12 Mg atoms as a powder. Now 24 faces touch the acid, and bubbles come about 2.4 times as fast.',
      why: 'Breaking a solid into small pieces exposes more atoms, so more H⁺ ions hit Mg every second. Doubling the acid instead gives about 0.40 bubbles per second; doing both gives about 0.97.',
      so: 'That is why you start a fire with kindling, not a log, and why fine flour or sawdust in the air can explode.',
      overlay(sim,ctx,LH,k){RC(ctx,k,[['Powder, 1 M HCl',700,14],'Faces touching acid: '+rtF(rtM(sim,'surfA'),0)+' (chunk: 10)',['H₂ bubbles: '+rtF(rtM(sim,'bub'),2)+' per second (chunk: 0.20)',700,12.5,KG]]);} }
  ],
  useIt: [
    { do: 'Get leftovers into the fridge within 2 hours, and keep it at 40 °F (4 °C) or colder.',
      why: 'Cold slows the reactions that bacteria use to grow. The USDA’s “danger zone” is 40–140 °F, where bacteria can double in as little as 20 minutes.' },
    { do: 'Start a campfire with kindling and small sticks, then add logs.',
      why: 'Small pieces have far more surface touching the air, so oxygen can react with more of the wood at once, just like the powdered magnesium.' },
    { do: 'Soak burnt-on pans in hot water, not cold.', lvl: 'honors',
      why: 'Heating raises the share of molecules with enough energy to react, and dish soap and dissolving go faster too. A 10 °C rise often doubles or triples a reaction rate.' }
  ],
  tryIt: [
    { title: 'the fizzing tablet race (10 minutes)',
      steps: ['Fill three clear cups with the same amount of water: one cold from the fridge, one at room temperature, one hot from the tap.', 'Drop a whole effervescent antacid tablet into each at the same moment and time how long until the fizzing stops.', 'Now use two room-temperature cups: one whole tablet, and one tablet crushed into powder in a folded paper first.'],
      look: 'The hot cup finishes first and the cold one last. The powder finishes much faster than the whole tablet, even though it is the same amount.' }
  ]
},
ratelaw: {
  goals: {
    bio: ['How to measure how fast a reaction goes, with a stopwatch', 'Why doubling one reactant can double the rate while doubling another does nothing', 'What a half-life is and why it stays the same for some reactions'],
    honors: ['Finding the order of each reactant by changing one at a time', 'Writing a rate law, rate = k[A]ᵐ[B]ⁿ, from data', 'Initial rate as the slope at t = 0', 'Telling zero, first and second order apart from graphs'],
    ap: ['Method of initial rates and rate-law units', 'Integrated rate laws and half-lives', 'How k changes with temperature (Arrhenius)', 'How a mechanism’s slow step sets the rate law']
  },
  matters: 'Rate laws tell you how long things last: how fast a medicine leaves your blood, how long food dye takes to fade, how quickly pollution breaks down. They also reveal what molecules are actually doing, step by step.',
  startKey: 'clock', startRun: true, startSpeed: 1,
  startOverlay(sim,ctx,LH,k){tag(ctx,'Looking down into the flask at an X',158,72,k,{s:12,hi:true});tag(ctx,'Sulfur builds up until the X is hidden',555,158,k,{s:12,hi:true});},
  steps: [
    { key: 'clock', title: 'The sulfur clock', fresh: true, speed: 1.5, run: rtSync,
      see: 'Thiosulfate (0.100 M) and hydrochloric acid (1.0 M) make tiny grains of solid sulfur. The flask clouds over until the X underneath disappears, at about 30 s.',
      why: 'The X vanishes when the same amount of sulfur has formed, about 2 mM. So a faster reaction hides it sooner, and 1 ÷ time works as a measure of the rate.',
      overlay(sim,ctx,LH,k){rlCard(ctx,k,[['Trial 1',700,14],'[S₂O₃²⁻] = 0.100 M, [HCl] = 1.0 M',['X hidden at: '+rlTX(sim),700,12.5,KG]],LH);} },
    { key: 'half', cause: { from: { cS: 0.1 } }, title: 'Half the thiosulfate', set: { cS: 0.05 }, fresh: true, speed: 3, run: rtSync,
      see: 'Same acid, half the thiosulfate: 0.050 M. The X now takes about 61 s to disappear, twice as long.',
      why: { bio: 'Half as many thiosulfate ions means half as many reactions each second, so it takes twice as long to make the same amount of sulfur.', honors: 'Halving [S₂O₃²⁻] halves the rate, so rate ∝ [S₂O₃²⁻]¹: first order in thiosulfate.' },
      overlay(sim,ctx,LH,k){rlCard(ctx,k,[['Trial 2',700,14],'[S₂O₃²⁻] = 0.050 M (half), [HCl] = 1.0 M',['X hidden at: '+rlTX(sim)+' (trial 1: 30 s)',700,12.5,KG]],LH);} },
    { key: 'acid', cause: { from: { cHs: 1 } }, title: 'Double the acid', set: { cHs: 2 }, fresh: true, speed: 1.5, run: rtSync,
      see: 'Thiosulfate back at 0.100 M, acid doubled to 2.0 M. The X disappears at about 30 s, the same as trial 1.',
      why: { bio: 'Adding more of a reactant doesn’t always speed things up. Here the slow part of the reaction doesn’t use H⁺, so extra acid changes nothing you can time.', honors: 'Doubling [H⁺] leaves the rate unchanged: zero order in H⁺, even though the equation has 2H⁺. Orders come from experiments, not from coefficients.' },
      overlay(sim,ctx,LH,k){rlCard(ctx,k,[['Trial 3',700,14],'[S₂O₃²⁻] = 0.100 M, [HCl] = 2.0 M (double)',['X hidden at: '+rlTX(sim)+' (trial 1: 30 s)',700,12.5,KG]],LH);} },
    { key: 'law', lvl: 'honors', title: 'Write the rate law', set: { gm: 1, gn: 0, check: true }, fresh: true, speed: 1.5, run: rtSync,
      see: 'Put the trials together: halving thiosulfate halved the rate; doubling acid did nothing. The orders are set to m = 1 and n = 0, and the check confirms the rate law.',
      why: 'rate = k[S₂O₃²⁻]¹[H⁺]⁰ = k[S₂O₃²⁻]. With an order known, one trial gives k: k = rate ÷ [S₂O₃²⁻].',
      so: { ap: 'The overall order is m + n = 1, so k has units of s⁻¹ in a first-order law; check how units change for other orders.' },
      overlay(sim,ctx,LH,k){rlCard(ctx,k,[['Three trials',700,14],'0.100 M, 1.0 M → 30 s','0.050 M, 1.0 M → 61 s (rate ÷ 2)','0.100 M, 2.0 M → 30 s (no change)',['rate = k[S₂O₃²⁻]¹[H⁺]⁰',700,12.5,KP]],LH);} },
    { key: 'initial', lvl: 'honors', title: 'Initial rate is a slope', set: { rxnI: 'cv' }, fresh: true, speed: 1, run: rtSync,
      see: 'Crystal violet, a purple dye, fading in base. A colorimeter tracks the color. The dashed tangent at the start is the initial rate.',
      why: 'Right at t = 0 you know exactly what concentrations you mixed, before products build up or reactants run low. Comparing initial rates across trials gives each order.',
      overlay(sim,ctx,LH,k){rlCard(ctx,k,[['Crystal violet + OH⁻',700,14],['Initial rate: '+String(chMet(sim,'r0'))+' M/s',700,12.5,KG],'= steepness of the dashed line at t = 0'],LH);} },
    { key: 'decay', title: 'Half, then half again', set: { mode: 'integrated', rxnG: 'cv' }, fresh: true, speed: 1, run: rtSync,
      see: 'Now follow one batch of crystal violet over time. The color drops fast at first, then slower. It loses half in about 69 s, then half of what is left in the next 69 s.',
      why: 'The fewer dye ions are left, the fewer react each second. For this reaction each half-life is the same length, no matter how much dye you start with.',
      so: 'After 3 half-lives, about 208 s, only 1/8 is left. The same math tells doctors how long a medicine stays in your blood.',
      overlay(sim,ctx,LH,k){rlCard(ctx,k,[['Crystal violet fading',700,14],['Half-life: '+String(chMet(sim,'half')),700,12.5,KG],'Now: '+String(chMet(sim,'cnow'))+' (started at 10 µM)'],LH);} },
    { key: 'linear', lvl: 'honors', title: 'Which graph is straight?', set: { mode: 'integrated', rxnG: 'cv' }, fresh: true, speed: 1, run: rtSync,
      see: 'The three graphs plot the same data as [A], ln[A] and 1/[A] against time. Only ln[A] is a straight line (R² = 1.000).',
      why: 'Each order has its own straight-line graph: [A] for zero order, ln[A] for first order, 1/[A] for second order. The straight one tells you the order; its slope gives k.',
      overlay(sim,ctx,LH,k){const r=id=>rtF(rtM(sim,id),3);rlCard(ctx,k,[['R² (1.000 = straight)',700,14],'[A] vs t: '+r('R2a'),['ln[A] vs t: '+r('R2b')+'  → first order',700,12.5,KG],'1/[A] vs t: '+r('R2c')],LH);} },
    { key: 'second', lvl: 'honors', title: 'Second order: half-lives grow', set: { mode: 'integrated', rxnG: 'second' }, fresh: true, speed: 1, run: rtSync,
      see: '2NO₂ → 2NO + O₂ starting at 20 mM. Now 1/[A] is the straight line, and the first half-life (92 s) is followed by one twice as long.',
      why: 'For second order, rate = k[A]², so as [A] drops the rate drops even faster. Each half-life is double the one before: t½ = 1 / (k[A]₀).',
      overlay(sim,ctx,LH,k){const r=id=>rtF(rtM(sim,id),3);rlCard(ctx,k,[['NO₂, second order',700,14],'First half-life: '+String(chMet(sim,'half')),['1/[A] vs t: R² = '+r('R2c'),700,12.5,KG],'ln[A] vs t: R² = '+r('R2b')],LH);} },
    { key: 'arr', lvl: 'ap', title: 'Temperature changes k', set: { mode: 'integrated', rxnG: 'first', T: 45 }, fresh: true, speed: 1, run: rtSync,
      see: 'N₂O₅ breaking down at 45 °C. At 25 °C its half-life is 5.6 hours; at 45 °C it is about 25 minutes.',
      why: 'k = A·e^(−Eₐ/RT). With Eₐ = 103 kJ/mol, each 10 °C raises k about 3.5 to 4 times. A plot of ln k against 1/T is a straight line with slope −Eₐ/R.',
      overlay(sim,ctx,LH,k){rlCard(ctx,k,[['N₂O₅ at 45 °C',700,14],['k = '+String(chMet(sim,'kint')),700,12.5,KR],'At 25 °C: k = 3.46 × 10⁻⁵ s⁻¹','Half-life: '+String(chMet(sim,'half'))+' (25 °C: 5.56 h)'],LH);} },
    { key: 'mech', lvl: 'ap', title: 'The slow step sets the rate', set: { mode: 'mech', mech: 'b' }, fresh: true, pause: true, run: rtSync,
      see: '2NO₂ + F₂ → 2NO₂F has the experimental rate law rate = k[NO₂][F₂]. This proposed mechanism starts with a slow step and ends with a fast one.',
      why: 'The slow step is the bottleneck, so its reactants (one NO₂ and one F₂) give the rate law. The steps add up to the overall equation, and F is an intermediate. The data support this mechanism, though they can never prove it.' }
  ],
  useIt: [
    { do: 'Take medicine on the schedule on the label, not whenever you remember.',
      why: 'Your body removes most drugs at a rate proportional to how much is in your blood, so each half-life removes half. Dosing intervals are set from that half-life to keep the level in a safe, working range.' },
    { do: 'Test one change at a time when you troubleshoot anything.',
      why: 'That is the method of initial rates: the sulfur clock only revealed which reactant mattered because each trial changed one concentration. Change two at once and you can’t tell which one did it.' },
    { do: 'Store opened medicines and vitamins somewhere cool and dry, not in a hot car or a steamy bathroom.', lvl: 'ap',
      why: 'Their breakdown reactions follow rate laws with k that rises steeply with temperature, so heat shortens their shelf life. The FDA advises against bathroom-cabinet storage for this reason.' }
  ],
  tryIt: [
    { title: 'the fading food dye (15 minutes)',
      steps: ['Add 3 drops of blue food coloring to a clear glass of water and stir.', 'Add about 1 tablespoon of household bleach (an adult should handle the bleach; open a window).', 'Stand the glass on white paper and note the time every time the color looks about half as strong as before.'],
      look: 'The color fades quickly at first, then more slowly. If each “half as blue” takes about the same time, the fading is close to first order. Try a second glass with more bleach and compare.' }
  ]
}
});

})();
