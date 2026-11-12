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

})();
