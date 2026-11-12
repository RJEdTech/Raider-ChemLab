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
    { key: 'warm', title: 'Warmer means faster', base: IMB, set: { mode: 'race', a: 'H2O', b: 'C2H5OH', temp: 60 }, fresh: true, speed: 2,
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

})();
