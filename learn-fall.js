/* Learn it for five ChemLab tools that still had only the older walkthrough (Nov 18, 2026, evening build):
   labbench, units, classify, separation, models. One BioLab.addLearn block, plus Test yourself why questions for separation (it had none).
   Steps reuse each tool's own walkthrough setups where they fit (captured below before Learn it replaces the tour),
   and every number on a card is read live from the tool's own metrics. Rules: ENGINE.md, "Writing Learn it steps". */
(function(){
'use strict';
const H=BioLab.h,PAL=H.PAL;
const RED='#b3261e',GREEN='#1b7a3a',BLUE='#1f5fbf',HI='#c8102e',GRAY='#8a8f98';
const DEF=id=>BioLab.defs.find(d=>d.id===id);
const TOUR={};BioLab.defs.forEach(d=>{TOUR[d.id]=(d.tour||[]).slice();});
const TS=(id,title)=>{const s=(TOUR[id]||[]).find(x=>{const t=typeof x.title==='object'?Object.values(x.title).join('|'):String(x.title||'');return t.indexOf(title)>=0;});return s&&s.setup?s.setup:null;};
const tour=(id,title)=>sim=>{const f=TS(id,title);if(f)f(sim);};
const act=(...ids)=>sim=>{ids.forEach(a=>{const x=(sim.def.actions||[]).find(q=>q.id===a);if(x)x.run(sim);});};
const met=(sim,id)=>(sim.def.metrics||[]).find(m=>m.id===id);
const M=(sim,id)=>{const m=met(sim,id);if(!m)return NaN;try{return m.get(sim);}catch(e){return NaN;}};
const pick=(v)=>{if(v&&typeof v==='object'){const L=H.level||'bio';return v[L]||(L==='ap'&&v.honors)||v.bio||Object.values(v)[0];}return v;};
const F=(sim,id,d)=>{const m=met(sim,id);if(!m)return '…';let v;try{v=m.get(sim);}catch(e){return '…';}
  if(v==null)return '…';if(typeof v==='string')return v;if(!isFinite(v))return '…';
  const dd=d!=null?d:(m.d!=null?m.d:1);let s=Math.abs(v)>=1e4&&dd===0?Math.round(v).toLocaleString('en-US'):v.toFixed(dd);
  const u=pick(m.unit);return s+(u&&!/^\(|^of |^\(/.test(u)&&u.length<14?(u==='%'?'%':' '+u):'');};
const FL=(sim,id,d,lab)=>{const m=met(sim,id);return (lab||(m?pick(m.label):id))+': '+F(sim,id,d);};
/* card: word-wrapped rows. x,y top-left (o.up: y is the bottom edge) */
function card(ctx,k,x,y,w,L,o){o=o||{};const kk=Math.min(k,o.kmax||1.7),pad=10*kk,rows=[];
  L.filter(r=>r!==''&&r!=null).forEach(r=>{const t=Array.isArray(r)?r:[r,{}],op=t[1]||{},sz=(op.s||13)*kk;ctx.font=(op.w||600)+' '+sz+'px '+H.FONT;
    const words=String(t[0]).split(' ');let cur='';words.forEach(wd=>{const tr=cur?cur+' '+wd:wd;if(cur&&ctx.measureText(tr).width>w-2*pad){rows.push([cur,op,sz]);cur=wd;}else cur=tr;});if(cur)rows.push([cur,op,sz]);});
  let h=pad*1.6;rows.forEach(r=>h+=r[2]*1.35);if(o.up)y-=h;
  ctx.save();H.rr(ctx,x,y,w,h,9);ctx.fillStyle=PAL['cv-sol']||PAL['card'];ctx.globalAlpha=0.96;ctx.fill();ctx.globalAlpha=1;ctx.lineWidth=o.hi===false?1.2:2.5;ctx.strokeStyle=o.hi===false?PAL['cv-soft']:HI;ctx.stroke();
  let yy=y+pad*0.8;rows.forEach(([s,op,sz])=>{yy+=sz*1.1;H.txt(ctx,s,x+pad,yy,{s:sz,w:op.w||600,c:op.c||PAL['cv-ink']});yy+=sz*0.25;});ctx.restore();return h;}
function ring(ctx,k,r,tau){if(!r)return;const L=Array.isArray(r[0])?r:[r];const a=0.55+0.45*Math.sin((tau||0)*4);ctx.save();ctx.globalAlpha=a;ctx.lineWidth=3;ctx.strokeStyle=HI;ctx.setLineDash([7,5]);L.forEach(q=>{H.rr(ctx,q[0],q[1],q[2],q[3],10);ctx.stroke();});ctx.restore();}
const atT=(sim,tau,t,key,fn)=>{sim._at=sim._at||{};const kk=(sim.lnKey||'')+':'+key+':'+(sim._atRun||0);if(tau>=t&&!sim._at[kk]){sim._at[kk]=1;fn(sim);}};
const fresh=sim=>{sim._atRun=(sim._atRun||0)+1;};
const L={},R={};

/* =====================================================================================
   labbench: Lab equipment and lab safety
   ===================================================================================== */
const lbCard=(ctx,k,rows,w)=>card(ctx,k,12,8,w||400,rows);
/* precision for the same 25 mL, from the tool's own PREC table (labbench.js) */
const LB_PREC=[['Beaker',1.25,'±1.25 mL'],['Graduated cylinder',0.25,'±0.25 mL'],['Buret',0.05,'±0.05 mL'],['Volumetric pipet',0.03,'±0.03 mL']];
function lbPrecChart(ctx,k,LH,tau){const K=BioLab.lg,kk=Math.min(k,1.6);K.dim(ctx,LH);
  H.txt(ctx,'Measuring 25 mL: how far off can each tool be?',400,36*kk,{s:16*kk,w:800,a:'center',b:'middle'});
  const x0=230,x1=640,y0=90,rowH=74,f=K.ease(Math.min(1,tau/2.5));
  LB_PREC.forEach(([n,u,s],i)=>{const y=y0+i*rowH,w=(x1-x0)*u/1.25*f,c=i===3?GREEN:i===0?RED:BLUE;
    H.txt(ctx,n,x0-14,y+16,{s:14*kk,w:700,a:'right',b:'middle'});
    ctx.fillStyle=c;H.rr(ctx,x0,y,Math.max(4,w),32,6);ctx.fill();
    H.txt(ctx,s,x0+Math.max(4,w)+10,y+16,{s:14*kk,w:800,c,b:'middle'});});
  H.txt(ctx,'Bar length = possible error (mL)',x0,y0+4*rowH+8,{s:12.5*kk,c:PAL['cv-soft'],b:'middle'});}
/* magnified meniscus: the water surface curves down; read the bottom of the curve at eye level */
function lbMeniscus(ctx,k,tau){const kk=Math.min(k,1.25),x=440,y=10,w=210,h=172;ctx.save();
  H.rr(ctx,x,y,w,h,10);ctx.fillStyle=PAL['cv-sol']||'#fff';ctx.fill();ctx.lineWidth=2.5;ctx.strokeStyle=HI;ctx.stroke();
  ctx.beginPath();H.rr(ctx,x,y,w,h,10);ctx.clip();
  const gx0=x+60,gx1=x+140,ym=y+80;/* glass walls */
  ctx.fillStyle='rgba(120,170,230,.35)';ctx.beginPath();ctx.moveTo(gx0,ym-12);ctx.quadraticCurveTo((gx0+gx1)/2,ym+14,gx1,ym-12);ctx.lineTo(gx1,y+h-34);ctx.lineTo(gx0,y+h-34);ctx.closePath();ctx.fill();
  ctx.strokeStyle='#3b6fb6';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(gx0,ym-12);ctx.quadraticCurveTo((gx0+gx1)/2,ym+14,gx1,ym-12);ctx.stroke();
  ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(gx0,y);ctx.lineTo(gx0,y+h-34);ctx.moveTo(gx1,y);ctx.lineTo(gx1,y+h-34);ctx.stroke();
  for(let i=-3;i<=2;i++){const yy=ym+1+i*14;ctx.beginPath();ctx.moveTo(gx0,yy);ctx.lineTo(gx0+(i===0?24:14),yy);ctx.stroke();}
  H.txt(ctx,'25',gx0-6,ym+1,{s:11*kk,w:700,a:'right',b:'middle'});H.txt(ctx,'24',gx0-6,ym+15,{s:10*kk,a:'right',b:'middle',c:PAL['cv-soft']});
  const a=0.5+0.5*Math.sin(tau*3);ctx.globalAlpha=0.5+0.5*a;ctx.strokeStyle=HI;ctx.setLineDash([5,4]);ctx.beginPath();ctx.moveTo(gx0,ym+1);ctx.lineTo(x+w-40,ym+1);ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1;
  H.txt(ctx,'👁',x+w-26,ym+1,{s:18*kk,a:'center',b:'middle'});
  H.txt(ctx,'Reads 25.0 mL',x+w/2,y+h-16,{s:12*kk,w:800,a:'center',b:'middle',c:GREEN});ctx.restore();}
L.labbench={
  goals:{
    bio:['What each common piece of lab equipment is for','Which glassware holds liquids and which measures them','How to read a graduated cylinder','How to spot hazards in a lab and fix them'],
    honors:['How to choose the best tool for a task, not just one that works','How to record a reading with one estimated digit'],
    ap:['How the uncertainty of each tool compares for the same volume','Why the digits you write must match the tool you used']},
  matters:'Every number in chemistry starts at the bench. The right tool decides whether “25 mL” means 25.00 mL or anything from 24 to 26, and a few safety habits keep a spill from becoming an injury.',
  steps:[
    {key:'hold',title:'Containers that hold and mix',set:{item:'beaker'},pause:true,focus:[[144,300,86,108],[230,300,86,108]],
     see:'The beaker and the Erlenmeyer flask light up.',
     why:'They hold, mix and heat liquids, like a mixing bowl. Their volume marks are rough, about ±5%: “100 mL” could really be 95 to 105 mL.',
     so:'Never use them to measure an exact volume.',
     overlay(sim,ctx,LH,k,tau){ring(ctx,k,[[144,300,86,108],[230,300,86,108]],tau);lbCard(ctx,k,[['Holding glassware',{w:800}],['Volume marks: about ±5%',{w:700,c:RED}]],300);}},
    {key:'meas',title:'Tools that measure volume',set:{item:'gradcyl'},pause:true,focus:[[318,190,46,216],[370,230,82,176],[622,24,38,312],[198,408,262,32]],
     see:'Four measuring tools light up: the graduated cylinder, volumetric flask, buret and volumetric pipet.',
     why:'These are made to measure. A graduated cylinder reads to 0.1 mL. The buret and pipet read to 0.01 mL, a small part of one drop.',
     overlay(sim,ctx,LH,k,tau){ring(ctx,k,[[318,190,46,216],[370,230,82,176],[622,24,38,312],[198,408,262,32]],tau);lbCard(ctx,k,[['Measuring glassware',{w:800}],['Cylinder: 0.1 mL',{w:700,c:GREEN}],['Buret and pipet: 0.01 mL',{w:700,c:GREEN}]],300);}},
    {key:'men',title:'Read the meniscus',set:{item:'gradcyl'},pause:true,focus:[318,190,46,216],
     see:'The magnified view shows water in a cylinder. Its surface curves down in the middle: the <b>meniscus</b>.',
     why:'Read the bottom of the curve with your eye level with it. From above or below, the reading shifts.',
     so:'Record one digit past the marks: 25.0 mL.',
     overlay(sim,ctx,LH,k,tau){ring(ctx,k,[318,190,46,216],tau);lbMeniscus(ctx,k,tau);}},
    {key:'burn',title:'Heating with a Bunsen burner',set:{item:'burner'},speed:1,focus:[8,172,136,236],
     see:'The Bunsen burner sits under an iron ring on the ring stand. Wire gauze rests on the ring.',
     why:'The gauze spreads the flame’s heat across the bottom of a beaker. A single hot spot can crack the glass.',
     overlay(sim,ctx,LH,k,tau){ring(ctx,k,[8,172,136,236],tau);lbCard(ctx,k,[['Burner + ring + gauze',{w:800}],['Gauze spreads the heat',{w:700,c:GREEN}]],300);}},
    {key:'porc',title:'Heating solids strongly',set:{item:'crucible'},pause:true,focus:[184,96,228,66],
     see:'The evaporating dish, crucible and crucible tongs light up on the shelf.',
     why:'Porcelain survives a full, hot flame. Heat a solid in a crucible, boil a solution dry in an evaporating dish, and move hot porcelain with tongs, never fingers.',
     overlay(sim,ctx,LH,k,tau){ring(ctx,k,[184,96,228,66],tau);}},
    {key:'mass',title:'Mass and temperature',set:{item:'balance'},pause:true,focus:[[720,328,82,80],[8,408,188,30]],
     see:'The electronic balance and the thermometer light up.',
     why:'The balance reads to 0.01 g. The thermometer is marked every 1 °C, so you estimate one more digit and record to 0.1 °C.',
     so:'Always record one estimated digit past the smallest mark.',
     overlay(sim,ctx,LH,k,tau){ring(ctx,k,[[720,328,82,80],[8,408,188,30]],tau);lbCard(ctx,k,[['Balance: 0.01 g',{w:800}],['Thermometer: record to 0.1 °C',{w:800}]],300);}},
    {key:'hook',title:'Your question: exactly 25.00 mL',set:{item:'pipet'},pause:false,speed:1,
     see:'A chart of how far off each tool can be when you measure 25 mL.',
     why:'Beaker: about ±1.25 mL. Cylinder: ±0.25 mL. Buret: ±0.05 mL. Volumetric pipet: ±0.03 mL, about 40 times better than the beaker. Grab the pipet.',
     overlay(sim,ctx,LH,k,tau){lbPrecChart(ctx,k,LH,tau);}},
    {key:'acid',title:'A hazard: water into acid',set:{mode:'safety',spot:'water'},pause:true,focus:[196,180,86,112],
     see:'A lab scene. The left student pours water into a beaker of concentrated acid.',
     why:'Mixing them releases a lot of heat. Water poured into acid can boil and spatter acid. Always add acid to water, slowly.',
     overlay(sim,ctx,LH,k,tau){ring(ctx,k,[196,180,86,112],tau);lbCard(ctx,k,[['Add acid to water,',{w:800}],['never water to acid',{w:800,c:RED}]],250);}},
    {key:'closed',title:'A hazard: a stoppered flask',set:{mode:'safety',spot:'closed'},pause:true,focus:[392,176,82,118],
     see:'The flask heating on the hot plate has a stopper in it.',
     why:'Gas expands as it heats. With no way out, pressure builds until the flask can burst. Never heat a closed container.',
     so:'Seven hazards hide here. Find them all in Full lab.',
     overlay(sim,ctx,LH,k,tau){ring(ctx,k,[392,176,82,118],tau);lbCard(ctx,k,[['Never heat a',{w:800}],['closed container',{w:800,c:RED}]],250);}},
    {key:'pick',lvl:'honors',title:'The best tool, not just one that works',set:{mode:'pick',item:'none'},pause:true,
     see:'The task: move exactly 25.00 mL into a flask. After a moment, the volumetric pipet is picked.',
     why:'A buret also reads to 0.01 mL, but a pipet delivers one exact volume in one step. Some tools work but are worse choices.',
     overlay(sim,ctx,LH,k,tau){if(tau<0.05)fresh(sim);atT(sim,tau,3,'pip',s=>BioLab.setValues(s,{item:'pipet'}));}},
    {key:'prec',lvl:'ap',title:'The precision ladder',set:{mode:'prec',item:'buret'},pause:true,
     see:'The ladder lists each tool’s reading for the same 25 mL, from “≈ 25 mL” (beaker) to “25.00 mL” (buret, pipet).',
     why:'Write every digit you can trust plus one estimated digit. A buret reads 25.00 mL (±0.05). Writing “25 mL” throws away two digits of real precision.'}
  ],
  useIt:[
    {do:'Read a liquid measuring cup at eye level, at the bottom of the curve.',why:'It works like a graduated cylinder. Reading from above makes the level look higher, so you pour too little.'},
    {do:'When you dilute a strong cleaner, add it to the water, and never mix two cleaners.',why:'Like acid in the lab, a little concentrate into lots of water keeps heat and splashes down. Bleach mixed with ammonia or acids makes toxic gas.'},
    {do:'Weigh flour on a kitchen scale instead of scooping a cup.',why:'A scooped cup changes with how tightly it’s packed, like a beaker’s rough marks. A scale is the precise tool.'}],
  tryIt:[{title:'how precise is your measuring cup? (10 minutes)',steps:['Put a measuring cup on a kitchen scale and zero it (tare).','Fill it with water to the 1-cup line and weigh it. 1 mL of water has a mass of 1 g, so 1 cup should be about 237 g.','Empty it and repeat twice: once reading at eye level, once looking down from above.'],look:'The masses spread by several grams, and the reading from above usually comes out low. That spread is your cup’s precision, much like a beaker’s ±5%.'}]};

/* =====================================================================================
   units: Dimensional analysis and metric units
   ===================================================================================== */
const unCard=(ctx,k,rows)=>card(ctx,k,598,326,192,rows,{up:true,kmax:1.35});
const unCardT=(ctx,k,rows)=>card(ctx,k,536,8,254,rows,{kmax:1.35});
const unSolve=sim=>{for(let i=0;i<5;i++)act('hint')(sim);};
L.units={
  goals:{
    bio:['How a conversion factor changes the unit but not the amount','How to set up a factor so the unwanted unit cancels','How to chain factors for conversions with more than one step','How to move between metric prefixes on the ladder'],
    honors:['Why exact factors don’t limit significant figures','How density and molar mass work as conversion factors'],
    ap:['How to convert derived units like mi/h to m/s','How to convert squared and cubed units']},
  matters:'Nurses convert doses, cooks scale recipes, and in 1999 NASA lost a Mars orbiter because one team used pound-seconds and another used newton-seconds. Writing units and canceling them catches mistakes before they cost anything.',
  steps:[
    {key:'start',title:'Start with what you know',pause:true,focus:[10,80,780,150],
     see:'The problem: convert 2.50 km to meters, half of a 5K race. The middle shows 2.50 km.',
     why:'Always start with what you know, written with its unit. The goal unit, meters, tells you which factor you need.',
     overlay(sim,ctx,LH,k,tau){ring(ctx,k,[10,80,780,150],tau);}},
    {key:'one',title:'A factor that equals 1',pause:true,focus:[10,330,780,115],
     see:'The tray at the bottom holds conversion factors, such as 1000 m over 1 km.',
     why:'1 km = 1000 m, so 1000 m / 1 km equals 1. Multiplying by it changes the unit you write, not the distance, like 4 quarters and $1.',
     overlay(sim,ctx,LH,k,tau){ring(ctx,k,[10,330,780,115],tau);unCardT(ctx,k,[['1000 m ÷ 1 km = 1',{w:800,c:GREEN}]]);}},
    {key:'cancel',title:'Put the unwanted unit on the bottom',run:tour('units','Put the unwanted'),speed:1,focus:[10,80,780,150],
     see:'The factor 1000 m / 1 km joins the chain. The two km cross out, leaving 2.50 × 10³ m.',
     why:'km is on top in 2.50 km, so the factor needs km on the bottom. Units cancel like numbers on the top and bottom of a fraction.',
     overlay(sim,ctx,LH,k,tau){ring(ctx,k,[10,80,780,150],tau);unCard(ctx,k,[[FL(sim,'now',null,'Units now'),{w:800}],[FL(sim,'goal',null,'Goal'),{w:700,c:GREEN}]]);}},
    {key:'sig',title:'Multiply and keep the sig figs',run:sim=>{if(!sim.st.chain.length)tour('units','Put the unwanted')(sim);},pause:true,focus:[10,220,780,110],
     see:'The calculator shows 2500, but the answer is written 2.50 × 10³ m.',
     why:'The 1000 is exact by definition, so it doesn’t limit sig figs. 2.50 has 3, so the answer keeps 3. Plain “2500 m” looks like only 2.',
     overlay(sim,ctx,LH,k,tau){ring(ctx,k,[10,220,780,110],tau);unCard(ctx,k,[[FL(sim,'ans',null,'Answer'),{w:800,c:GREEN}]]);}},
    {key:'flip',title:'Upside down? The units tell you',run:tour('units','Upside down'),speed:1,focus:[10,80,780,250],
     see:'Now the factor is flipped: 1 km over 1000 m. Nothing cancels, and the units read km²/m.',
     why:'km²/m makes no sense for a distance. Wrong units tell you the setup is wrong before you even look at the number.',
     overlay(sim,ctx,LH,k,tau){ring(ctx,k,[10,80,780,250],tau);unCard(ctx,k,[[FL(sim,'now',null,'Units now'),{w:800,c:RED}],['Goal: m',{w:700}]]);}},
    {key:'chain',title:'Chains of factors',run:tour('units','Chains of factors'),speed:1,focus:[10,80,780,250],
     see:'3.0 hours to seconds takes two factors: 60 min / 1 h, then 60 s / 1 min. The answer is 1.1 × 10⁴ s.',
     why:'Each factor cancels the unit the last one left. The calculator says 10800, but 3.0 has only 2 sig figs.',
     overlay(sim,ctx,LH,k,tau){ring(ctx,k,[10,80,780,250],tau);unCard(ctx,k,[[FL(sim,'nf',0,'Factors used'),{w:700}],[FL(sim,'ans',null,'Answer'),{w:800,c:GREEN}]]);}},
    {key:'hook',title:'Your question: a 455 mL bottle',set:{prob:'mlL'},run:unSolve,speed:1,focus:[10,80,780,250],
     see:'455 mL × 1 L / 1000 mL = 0.455 L. The mL cancels, leaving liters.',
     why:'For 2.0 L you need 2.0 ÷ 0.455 = 4.4 bottles. You can’t fill 0.4 of a trip, so fill it 5 times. Four would leave you 0.18 L short.',
     overlay(sim,ctx,LH,k,tau){ring(ctx,k,[10,80,780,250],tau);unCard(ctx,k,[[FL(sim,'ans',null,'One bottle'),{w:800,c:GREEN}],['2.0 L ÷ 0.455 L = 4.4',{w:700}],['→ fill it 5 times',{w:800,c:GREEN}]]);}},
    {key:'ladder',title:'The prefix ladder',run:tour('units','The prefix ladder'),speed:1,
     see:'4.75 km hops down the ladder 3 steps to meters, and the decimal point moves 3 places right: 4750 m.',
     why:'Each step is a factor of 10. To a smaller unit, the number gets bigger; to a bigger unit, smaller.',
     overlay(sim,ctx,LH,k,tau){unCardT(ctx,k,[[FL(sim,'steps',0,'Steps'),{w:700}],[FL(sim,'dir',null,'Decimal point moves'),{w:800,c:GREEN}]]);}},
    {key:'dens',lvl:'honors',title:'Density is a conversion factor',set:{prob:'eth'},run:unSolve,speed:1,focus:[10,80,780,250],
     see:'25.0 mL of ethanol × 0.789 g / 1 mL = 19.7 g.',
     why:'Density says 1 mL of ethanol has a mass of 0.789 g, so it can be written as a factor. Unlike 1000 m / 1 km, it is measured, so its sig figs count.',
     overlay(sim,ctx,LH,k,tau){ring(ctx,k,[10,80,780,250],tau);unCard(ctx,k,[[FL(sim,'ans',null,'Answer'),{w:800,c:GREEN}],[FL(sim,'sf',0,'Sig figs'),{w:700}]]);}},
    {key:'molw',lvl:'honors',title:'Molar mass is a factor too',set:{prob:'molw'},run:unSolve,speed:1,focus:[10,80,780,250],
     see:'36.0 g of water × 1 mol / 18.02 g = 2.00 mol.',
     why:'One mole of water has a mass of 18.02 g. Grams are on top in 36.0 g, so the factor goes in with grams on the bottom.',
     overlay(sim,ctx,LH,k,tau){ring(ctx,k,[10,80,780,250],tau);unCard(ctx,k,[[FL(sim,'ans',null,'Answer'),{w:800,c:GREEN}]]);}},
    {key:'mph',lvl:'ap',title:'Derived units: mi/h to m/s',run:tour('units','Derived units'),speed:1,
     see:'65 mi/h becomes 29 m/s with three factors: miles to kilometers, kilometers to meters, and hours to seconds.',
     why:'Convert the top and the bottom. Hours are on the bottom of mi/h, so the time factor puts h on top: 1 h / 3600 s.',
     overlay(sim,ctx,LH,k,tau){unCard(ctx,k,[[FL(sim,'ans',null,'Answer'),{w:800,c:GREEN}]]);}},
    {key:'cube',lvl:'ap',title:'Cubed units',set:{prob:'m3cm3'},run:unSolve,speed:1,focus:[10,80,780,250],
     see:'0.0450 m³ × 10⁶ cm³ / 1 m³ = 4.50 × 10⁴ cm³.',
     why:'1 m = 100 cm, so 1 m³ = 100³ = 10⁶ cm³. Cube the number in the factor, not just the unit, or you’ll be off by 10,000.',
     overlay(sim,ctx,LH,k,tau){ring(ctx,k,[10,80,780,250],tau);unCard(ctx,k,[[FL(sim,'ans',null,'Answer'),{w:800,c:GREEN}]]);}}
  ],
  useIt:[
    {do:'Check a medicine dose by writing the units out.',why:'mg per kg × kg gives mg. If the units don’t cancel to mg, the setup is wrong before any number matters.'},
    {do:'Convert a recipe from cups to grams with a factor.',why:'1 cup of water is about 237 g, so 2.5 cups × 237 g / 1 cup ≈ 590 g. It is the same chain as km to m.'},
    {do:'Turn a speed limit into meters per second.',why:'65 mi/h is about 29 m/s, so at that speed you cover a football field in about 3 seconds.'}],
  tryIt:[{title:'your walking speed in m/s (10 minutes)',steps:['Mark out 10 m with a tape measure (about 13 big steps).','Time yourself walking it at a normal pace.','Divide meters by seconds. Then convert to km/h with factors: 1 km = 1000 m and 1 h = 3600 s.'],look:'A normal walk is about 1.3 to 1.5 m/s, about 5 km/h. If your units cancel cleanly to km/h, your answer lands near that.'}]};

/* =====================================================================================
   classify: Classifying matter
   ===================================================================================== */
const clCard=(ctx,k,LH,rows)=>card(ctx,k,8,8,168,rows,{kmax:1.35});
const CL_ZOOM=[174,74,332,332];
L.classify={
  goals:{
    bio:['How to tell a pure substance from a mixture by its particles','How to tell an element from a compound','How to tell a homogeneous mixture from a heterogeneous one','How to tell a physical change from a chemical change'],
    honors:['Why O₂ and N₂ are elements, not compounds','Why atoms are conserved in every change'],
    ap:['Why a compound has a fixed composition and a mixture doesn’t','How conservation of atoms means conservation of mass']},
  matters:'Is tap water pure? Is salt water still water? Can you get the salt back out? Sorting matter tells you what can be separated by physical means and what takes a chemical reaction, from purifying water to recycling metals.',
  steps:[
    {key:'views',title:'Two views of one sample',set:{sample:'h2o'},speed:1,focus:[[24,130,140,230],CL_ZOOM],
     see:'Left: a beaker of pure water. The big circle zooms in about 100 million times. Every particle is the same H₂O molecule.',
     why:'One kind of particle means one substance: a <b>pure substance</b>. Water always has the same recipe, two H atoms and one O atom.',
     overlay(sim,ctx,LH,k,tau){ring(ctx,k,[[24,130,140,230],CL_ZOOM],tau);}},
    {key:'mix',title:'Pure substance or mixture?',set:{sample:'salt'},speed:1,focus:CL_ZOOM,
     see:'Salt water looks just like pure water. The zoom shows H₂O molecules plus Na⁺ and Cl⁻ ions.',
     why:'Two substances mixed but not bonded make a <b>mixture</b>, even when you can’t see them apart. Salt water is a mixture.',
     overlay(sim,ctx,LH,k,tau){ring(ctx,k,CL_ZOOM,tau);clCard(ctx,k,LH,[['2 substances:',{w:700}],['H₂O + NaCl',{w:800}],['→ mixture',{w:800,c:GREEN}]]);}},
    {key:'el',title:'Molecules can be elements',set:{sample:'o2'},speed:1,focus:CL_ZOOM,
     see:'Oxygen gas: every particle is an O₂ molecule, two oxygen atoms bonded together.',
     why:'Only one kind of atom, so oxygen gas is an <b>element</b>, even as molecules. A <b>compound</b> needs two or more different elements bonded, like H₂O.',
     overlay(sim,ctx,LH,k,tau){ring(ctx,k,CL_ZOOM,tau);clCard(ctx,k,LH,[['1 kind of atom: O',{w:800}],['→ element',{w:800,c:GREEN}]]);}},
    {key:'fes',title:'Same elements: mixture or compound?',set:{sample:'fesc'},cause:{from:{sample:'fes'},delay:3.5,dur:0.6},speed:1,focus:CL_ZOOM,
     see:'First iron filings and sulfur powder, side by side. Then iron(II) sulfide: each iron atom bonded to a sulfur atom.',
     why:'Mixed, each keeps its own properties: a magnet still pulls out the iron. Bonded, they form a new compound with new properties.',
     overlay(sim,ctx,LH,k,tau){ring(ctx,k,CL_ZOOM,tau);const c=sim.p.sample==='fesc';clCard(ctx,k,LH,[[c?'Fe bonded to S':'Fe and S, not bonded',{w:800}],[c?'→ compound':'→ mixture',{w:800,c:GREEN}]]);}},
    {key:'het',title:'Even or not even?',set:{sample:'sand'},speed:1,focus:CL_ZOOM,
     see:'Sand in water: the grains settle into a layer you can see.',
     why:'A mixture whose parts you can tell apart is <b>heterogeneous</b>. Salt water and air are the same all the way through, so they are <b>homogeneous</b>.',
     overlay(sim,ctx,LH,k,tau){ring(ctx,k,CL_ZOOM,tau);clCard(ctx,k,LH,[['Parts you can see',{w:700}],['→ heterogeneous',{w:800,c:GREEN}]]);}},
    {key:'flow',title:'The flowchart',set:{sample:'sand'},run:tour('classify','The flowchart'),pause:true,focus:[528,30,266,390],
     see:'The flowchart on the right lights up the path for sand in water: Matter → Mixture → Heterogeneous.',
     why:'Two questions sort any sample. One substance? Then: one kind of atom (element) or more (compound)? A mixture? Then: the same throughout or not?',
     overlay(sim,ctx,LH,k,tau){ring(ctx,k,[528,30,266,390],tau);}},
    {key:'phys',title:'Physical change',run:tour('classify','Physical change'),speed:1,focus:[[24,130,140,230],CL_ZOOM],
     see:'Melting ice: the H₂O molecules leave their fixed spots and slide around. Every molecule stays whole.',
     why:'No new substance forms, so it is a <b>physical change</b>. Melting, boiling and dissolving change how particles are arranged, not what they are.',
     overlay(sim,ctx,LH,k,tau){ring(ctx,k,CL_ZOOM,tau);}},
    {key:'chem',title:'Chemical change',run:tour('classify','Chemical change'),speed:1,focus:CL_ZOOM,
     see:'Burning methane: bonds break, and the same atoms regroup into CO₂ and H₂O.',
     why:'New substances form, so it is a <b>chemical change</b>. Signs you might notice: heat or light, a new gas, a color change.',
     overlay(sim,ctx,LH,k,tau){ring(ctx,k,CL_ZOOM,tau);}},
    {key:'hook',title:'Your question: boiling the pasta water',set:{mode:'change',proc:'boil'},run:act('run'),speed:1,focus:CL_ZOOM,
     see:'Boiling water: H₂O molecules leave the liquid as steam. Each one is still a whole H₂O molecule.',
     why:'Salt water is a homogeneous mixture; boiling is a physical change. Water leaves as H₂O, and the crust is the salt that was dissolved all along.',
     overlay(sim,ctx,LH,k,tau){ring(ctx,k,CL_ZOOM,tau);clCard(ctx,k,LH,[['Still H₂O',{w:800}],['→ physical',{w:800,c:GREEN}]]);}},
    {key:'atoms',lvl:'honors',title:'Atoms are conserved',run:tour('classify','Atoms are conserved'),speed:1,
     see:'The burn is finished. The card counts atoms before and after: 3 C, 12 H and 12 O on both sides.',
     why:'Atoms are rearranged, never created or destroyed. That is why a chemical equation must balance.',
     overlay(sim,ctx,LH,k,tau){clCard(ctx,k,LH,[['Atoms in = atoms out',{w:800}],[F(sim,'atoms'),{w:700,c:GREEN,s:12}]]);}},
    {key:'fixed',lvl:'ap',title:'Mixtures vary; compounds don’t',set:{sample:'salt',amt:80},cause:{from:{amt:20},delay:1.5,dur:3},speed:1,focus:CL_ZOOM,
     see:'The recipe slider adds more salt. Salt water goes from about 15% to 31% NaCl by mass.',
     why:'A mixture can have any ratio. A compound can’t: iron(II) sulfide is always 63.5% Fe and 36.5% S, however you make it. That is the law of definite proportions.',
     overlay(sim,ctx,LH,k,tau){ring(ctx,k,CL_ZOOM,tau);clCard(ctx,k,LH,[['By mass:',{w:700}],[F(sim,'pct'),{w:800,c:GREEN,s:12}]]);}}
  ],
  useIt:[
    {do:'Read “pure” on a label as “nothing added,” not “one substance.”',why:'Pure orange juice is still a mixture of water, sugars and acids. Only one kind of particle makes a pure substance.'},
    {do:'Use a magnet to sort steel cans from aluminum ones.',why:'Recycling separates a mixture by a physical property: steel contains iron, which is magnetic, and aluminum isn’t.'},
    {do:'Ask whether a kitchen change can be undone.',why:'Melted butter can firm up again (physical). Toast can’t turn back into bread: new substances formed (chemical).'}],
  tryIt:[{title:'physical or chemical? (15 minutes, plus a day to dry)',steps:['Stir a spoonful of salt into a glass of warm water until it disappears. Pour a little into a saucer and leave it on a sunny windowsill for a day or two.','Drop a pinch of baking soda into a spoonful of vinegar.','For each, write what you saw and whether a new substance formed.'],look:'The saucer leaves salt crystals: dissolving was a physical change, and the salt came back. The fizzing is CO₂ gas, a new substance: a chemical change.'}]};

/* =====================================================================================
   separation: Separating mixtures
   ===================================================================================== */
const spCard=(ctx,k,rows)=>card(ctx,k,410,40,185,rows);
const spCardE=(ctx,k,rows)=>card(ctx,k,590,262,200,rows);
const spCardI=(ctx,k,rows)=>card(ctx,k,8,8,230,rows,{kmax:1.35});
/* finish whatever step is animating, instantly */
const spFF=sim=>{const b=sim.st&&sim.st.busy;if(b){b.t=b.dur;sim.def.step(sim,0);}};
/* start over and replay earlier steps instantly, so each Learn it step stands on its own */
const spPrep=list=>sim=>{act('restart')(sim);list.forEach(k=>{act(k)(sim);spFF(sim);});};
const spThen=(list,k)=>sim=>{spPrep(list)(sim);act(k)(sim);sim._hist0=sim.t;};
/* thermometer reading vs time, drawn from the tool's own history */
function spGraph(ctx,k,LH,sim,tau){const K=BioLab.lg,kk=Math.min(k,1.25);K.dim(ctx,LH);
  H.txt(ctx,'Thermometer reading while the dish heats',400,30*kk,{s:16*kk,w:800,a:'center',b:'middle'});
  const B={x0:110,x1:740,y0:70,y1:370},t0=sim._hist0||0,rows=(sim.hist||[]).filter(r=>r.t>=t0&&r.v&&isFinite(r.v.T)),tmax=Math.max(20,rows.length?rows[rows.length-1].t-t0:20);
  const yr=v=>(v-0)/120;K.axes(ctx,B,k,{xr:[0,tmax],xt:[[0,'0'],[tmax/2,Math.round(tmax/2)+''],[tmax,Math.round(tmax)+'']],yt:[[yr(20),'20'],[yr(60),'60'],[yr(100),'100']],xl:'Time (s)',yl:'Temperature (°C)'});
  ctx.save();ctx.strokeStyle=PAL['cv-soft'];ctx.setLineDash([5,5]);ctx.lineWidth=1.5;const yb=B.y1-yr(100)*(B.y1-B.y0);ctx.beginPath();ctx.moveTo(B.x0,yb);ctx.lineTo(B.x1,yb);ctx.stroke();ctx.restore();
  if(rows.length>1){ctx.save();ctx.strokeStyle=RED;ctx.lineWidth=3.5;ctx.lineJoin='round';ctx.beginPath();rows.forEach((r,i)=>{const x=K.X(B,[0,tmax],r.t-t0),y=B.y1-yr(r.v.T)*(B.y1-B.y0);i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.stroke();ctx.restore();
    const last=rows[rows.length-1];K.dot(ctx,K.X(B,[0,tmax],last.t-t0),B.y1-yr(last.v.T)*(B.y1-B.y0),RED);
    K.tagA(ctx,'Now: '+last.v.T.toFixed(0)+' °C',B.x1,B.y0-4,k,{s:13,w:800,c:RED},'r');}
  K.tagA(ctx,'Flat while water boils: 100 °C',B.x0+12,yb-22,k,{s:13,w:700},'l');}
L.separation={
  goals:{
    bio:['How to match each separation method to the property it uses','How to plan the order of steps for a mixture','How to read a thermometer plateau as a boiling point','How to calculate percent recovery'],
    honors:['Why one distillation can’t give pure ethanol','How chromatography separates dyes, and why the solvent matters'],
    ap:['How a fractionating column enriches the vapor','Why 95.6% ethanol is the limit (the azeotrope)']},
  matters:'Water treatment plants, oil refineries, coffee filters and crime labs all separate mixtures. Each method works because the parts differ in one property: magnetism, dissolving, particle size, boiling point, or how well they stick to paper.',
  steps:[
    {key:'three',title:'One mixture, three solids',run:spPrep([]),pause:true,focus:[100,180,260,240],
     see:'A beaker holds 18 g of sand, salt and iron filings, all mixed together.',
     why:'Each one has a property the others lack: iron is magnetic, salt dissolves in water, and sand does neither. Each difference is a handle for pulling one out.',
     overlay(sim,ctx,LH,k,tau){ring(ctx,k,[100,180,260,240],tau);}},
    {key:'magnet',title:'A magnet pulls out the iron',run:spThen([],'magnet'),speed:1,focus:[[100,60,260,360],[602,8,176,224]],
     see:'A magnet sweeps over the dry mixture and lifts the iron filings out.',
     why:'Only iron is attracted to a magnet. Do it first, while the mixture is dry: once it is wet, filings cling to the sand and the magnet gets less.',
     overlay(sim,ctx,LH,k,tau){ring(ctx,k,[100,60,260,360],tau);spCard(ctx,k,[['Uses: magnetism',{w:800}],[FL(sim,'rIron',0,'Iron back'),{w:700,c:GREEN}]]);}},
    {key:'water',title:'Water dissolves the salt',run:spThen(['magnet'],'water'),speed:1,focus:[[100,180,260,240],[602,8,176,224]],
     see:'Water is added and stirred. The salt disappears; the sand stays at the bottom.',
     why:'Salt dissolves into ions far too small to see. Sand doesn’t dissolve. Now the salt is hiding in the water.',
     overlay(sim,ctx,LH,k,tau){ring(ctx,k,[100,180,260,240],tau);spCard(ctx,k,[['Uses: dissolving',{w:800}],['Salt → ions in water',{w:700,c:GREEN}]]);}},
    {key:'filter',title:'Filtering sorts by size',run:spThen(['magnet','water'],'filter'),speed:1,focus:[[100,60,300,360],[602,8,176,224]],
     see:'The mixture pours through filter paper. Sand stays on the paper, and clear salt water drips through.',
     why:'Filtration sorts by particle size. Dissolved ions slip through the paper’s tiny pores; sand grains are too big.',
     overlay(sim,ctx,LH,k,tau){ring(ctx,k,[100,60,300,360],tau);spCard(ctx,k,[['Uses: particle size',{w:800}],[FL(sim,'rSand',1,'Sand back'),{w:700,c:GREEN}]]);}},
    {key:'evap',title:'Evaporation uses boiling point',run:spThen(['magnet','water','filter'],'evap'),speed:2,focus:[[100,60,300,360],[602,8,176,224]],
     see:'The salt water heats in a dish. The thermometer climbs to 100 °C and holds there while the water boils away.',
     why:'Water leaves as steam at 100 °C, and salt stays behind as crystals. The temperature holds steady until the water is gone.',
     overlay(sim,ctx,LH,k,tau){ring(ctx,k,[100,60,300,360],tau);spCard(ctx,k,[['Uses: boiling point',{w:800}],[FL(sim,'T',0,'Thermometer'),{w:700,c:RED}]]);}},
    {key:'graph',title:'The thermometer graph',run:spThen(['magnet','water','filter'],'evap'),speed:2,
     see:'The thermometer graph: a climb, a flat stretch at 100 °C, then another climb once the dish is dry.',
     why:'While water boils, heat turns liquid into gas instead of raising the temperature. The flat part is the boiling point; when it ends, the water is gone.',
     overlay(sim,ctx,LH,k,tau){spGraph(ctx,k,LH,sim,tau);}},
    {key:'hook',title:'Your question: how much comes back?',run:spPrep(['magnet','water','filter','evap']),pause:true,focus:[480,248,316,160],
     see:'All three are back. The card shows each one’s percent recovery.',
     why:'Recovery = mass recovered ÷ starting mass × 100. Iron 97%, sand 98.8%, salt about 92%. Sand rides on the magnet, and salt water soaks into the filter paper.',
     overlay(sim,ctx,LH,k,tau){ring(ctx,k,[480,248,316,160],tau);spCard(ctx,k,[['Percent recovery',{w:800}],[FL(sim,'rIron',0,'Iron'),{w:700}],[FL(sim,'rSand',1,'Sand'),{w:700}],[FL(sim,'rSalt',0,'Salt'),{w:700}]]);}},
    {key:'ink',title:'Chromatography: how well dyes stick',set:{mix:'ink'},run:act('chrom'),speed:1,
     see:'A dot of black ink sits above water on a paper strip. As the water climbs, the ink splits into yellow, magenta and blue.',
     why:'Water carries each dye up, but each sticks to the paper differently. Dyes that dissolve best and stick least travel farthest.',
     overlay(sim,ctx,LH,k,tau){spCardI(ctx,k,[['Black ink is a mixture',{w:800}],[FL(sim,'spots',0,'Separate spots'),{w:700,c:GREEN}]]);}},
    {key:'solv',lvl:'honors',title:'Change the solvent, change the order',set:{mix:'ink',solv:'iso'},run:act('chrom'),speed:1,
     see:'Same ink, but the solvent is isopropanol. Now blue travels farthest and yellow barely moves.',
     why:'Isopropanol is less polar than water, so different dyes dissolve best in it and the order flips. Rf = distance the dye moves ÷ distance the solvent moves.',
     overlay(sim,ctx,LH,k,tau){spCardI(ctx,k,[['Rf values',{w:800}],[F(sim,'rf'),{w:700,c:GREEN,s:12}]]);}},
    {key:'distill',lvl:'honors',title:'Distilling ethanol and water',set:{mix:'eth'},run:act('restart','heatOn'),speed:1.5,focus:[60,40,400,370],
     see:'Ethanol and water heat in a flask. Vapor rises, cools in the condenser and drips into the receiver.',
     why:'Ethanol boils at 78 °C and water at 100 °C. The vapor is richer in ethanol, so the first liquid collected is about 80% ethanol, not pure.',
     overlay(sim,ctx,LH,k,tau){ring(ctx,k,[60,40,400,370],tau);spCardE(ctx,k,[[FL(sim,'T',1,'Thermometer'),{w:700}],[FL(sim,'dist',null,'Receiver'),{w:800,c:GREEN}]]);}},
    {key:'column',lvl:'ap',title:'A fractionating column',set:{mix:'eth',plates:5},run:act('restart','heatOn'),speed:1.5,focus:[60,40,400,370],
     see:'A column with 5 plates sits on the flask. The first liquid collected comes out about 93% ethanol.',
     why:'Each plate boils and condenses the vapor again, enriching it. No column can pass 95.6% ethanol: the <b>azeotrope</b>, where vapor and liquid have the same makeup.',
     overlay(sim,ctx,LH,k,tau){ring(ctx,k,[60,40,400,370],tau);spCardE(ctx,k,[[FL(sim,'T',1,'Thermometer'),{w:700}],[FL(sim,'dist',null,'Receiver'),{w:800,c:GREEN}]]);}}
  ],
  useIt:[
    {do:'Use a coffee filter or a fine strainer the way a lab uses filter paper.',why:'Coffee dissolves and passes through; the grounds are too big. Filtering sorts by particle size.'},
    {do:'Recycle cans by sorting with a magnet.',why:'Steel cans contain iron and stick; aluminum cans don’t. Recycling plants use the same property on a conveyor belt.'},
    {do:'Expect salt to stay behind when water evaporates.',why:'Dried-on water spots on a car or glasses are minerals left as the water boiled or evaporated off, the same as the salt crust in the dish.'}],
  tryIt:[{title:'marker chromatography (15 minutes)',steps:['Cut a strip from a coffee filter. Draw a thick dot of washable black marker 2 cm from the bottom.','Stand the strip in a glass with 1 cm of water, keeping the dot above the water.','Wait 10 minutes as the water climbs. Try a second strip in rubbing alcohol (with an adult).'],look:'The black dot splits into colors that travel different distances. In rubbing alcohol the colors may move in a different order: the solvent changes which dye travels farthest.'}]};
R.separation={questions:[
  {id:'order',kind:'test',lvl:'bio',q:'You have a mixture of sand and salt. Which order of steps gets both back?',choices:['Add water, filter, then evaporate the liquid','Filter first, then add water and evaporate','Use a magnet, then filter the dry mixture','Heat it until the salt boils away from the sand'],correct:0,
   steps:['Salt dissolves in water; sand doesn’t.','Filtering catches the sand while the salt passes through in the water.','Evaporating the water leaves the salt.']},
  {id:'filter',kind:'test',lvl:'bio',q:'Why does filter paper separate sand from salt water?',choices:['Sand grains are too big to pass through the paper','Salt is pulled into the paper by electric charge','Sand dissolves in the paper but salt doesn’t','Water carries sand faster than it carries salt'],correct:0,
   steps:['Filtration sorts by particle size.','Dissolved salt is split into ions far smaller than the pores.','Sand grains are much bigger than the pores, so they stay on the paper.']},
  {id:'recov',kind:'test',lvl:'bio',q:'You start with 5.00 g of salt and recover 4.60 g. What is your percent recovery?',num:{ans:92,tol:0.5,unit:'%'},
   steps:['Percent recovery = mass recovered ÷ starting mass × 100.','4.60 ÷ 5.00 = 0.920.','0.920 × 100 = 92.0%.']},
  {id:'plateau',kind:'test',lvl:'bio',q:'While a dish of salt water boils, the thermometer stays at 100 °C for a while. Why?',choices:['The heat is turning liquid water into steam','The salt soaks up the extra heat as it forms','The burner is too weak to heat it any higher','The steam cools the thermometer back down each time'],correct:0,
   steps:['While water boils, the energy goes into changing liquid to gas.','So the temperature holds at the boiling point.','It rises again only once the water is gone.']},
  {id:'eth80',kind:'test',lvl:'honors',q:'The first liquid distilled from an ethanol–water mixture is about 80% ethanol. Why not 100%?',choices:['Water evaporates too, so some rides along in the vapor','The thermometer reads low, so the water starts boiling too early','Ethanol slowly breaks down into water as the flask is heated','The cold condenser adds some of its own water as it cools the vapor'],correct:0,
   steps:['Both liquids have vapor above the mixture, not just the one with the lower boiling point.','The vapor is richer in ethanol, but it still contains water.','So one distillation enriches ethanol but can’t purify it.']},
  {id:'rf',kind:'test',lvl:'honors',q:'In paper chromatography the solvent travels 8.0 cm. A yellow dye travels 7.0 cm. What is its Rf value?',num:{ans:0.88,tol:0.01,unit:''},
   steps:['Rf = distance the dye moves ÷ distance the solvent moves.','7.0 ÷ 8.0 = 0.875.','Rounded to 2 sig figs: 0.88.']},
  {id:'azeo',kind:'test',lvl:'ap',q:'A fractionating column with many plates still can’t make ethanol purer than 95.6% by mass. Why?',choices:['There, vapor and liquid have the same makeup','The column gets too hot and lets the water through','Ethanol starts to boil away faster than it can condense','More plates are needed than any real column can hold'],correct:0,
   steps:['Each plate enriches the vapor by boiling and condensing it again.','At 95.6% ethanol the vapor has the same composition as the liquid: the azeotrope.','Another plate can’t change it, so distillation stops there.']}
]};

/* =====================================================================================
   models: Atomic models and gold foil
   ===================================================================================== */
const moCard=(ctx,k,LH,rows)=>card(ctx,k,4,LH-50,156,rows,{up:true,kmax:1.35});
const moFire=sim=>{act('clear','fire2')(sim);};
const MO_BINS=['0–2°','2–5°','5–10°','10–30°','30–60°','60–90°','90–120°','120–150°','150–180°'];
/* counts per angle for a million alphas, plum pudding (gray) vs nuclear (red), on a log scale */
function moGraph(ctx,k,LH,sim,tau){const K=BioLab.lg,kk=Math.min(k,1.25);K.dim(ctx,LH);
  H.txt(ctx,'A million alphas: how many land at each angle?',400,28*kk,{s:16*kk,w:800,a:'center',b:'middle'});
  const B={x0:110,x1:770,y0:70,y1:360},th=sim._th||[],nu=(sim.st&&sim.st.hist)||[],n=MO_BINS.length,gw=(B.x1-B.x0)/n,f=K.ease(Math.min(1,tau/2));
  const ly=v=>v>0?Math.log10(v)/6:0;
  K.axes(ctx,B,k,{xr:[0,n],yt:[[0,'1'],[2/6,'100'],[4/6,'10,000'],[1,'1,000,000']],yl:'Alphas (log scale)',ylOff:72});
  for(let i=0;i<n;i++){const x=B.x0+gw*i;[[th[i],GRAY,0.14],[nu[i],RED,0.52]].forEach(([v,c,o])=>{const h=(B.y1-B.y0)*ly(v||0)*f;if(h>0){ctx.fillStyle=c;H.rr(ctx,x+gw*o,B.y1-h,gw*0.32,h,3);ctx.fill();}});
    H.txt(ctx,MO_BINS[i],x+gw/2,B.y1+16*kk,{s:11*kk,a:'center',b:'middle',c:PAL['cv-soft']});}
  const x90=B.x0+gw*6;ctx.save();ctx.strokeStyle=HI;ctx.setLineDash([6,5]);ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x90,B.y0-10);ctx.lineTo(x90,B.y1);ctx.stroke();ctx.restore();
  K.tagA(ctx,'Past 90°: bounced back',B.x1,B.y0+20,k,{s:12.5,w:700,c:HI},'r');
  H.txt(ctx,'Angle from straight ahead',(B.x0+B.x1)/2,B.y1+38*kk,{s:13*kk,w:700,a:'center',b:'middle'});
  const lg=[[GRAY,'Plum pudding'],[RED,'Nuclear model']];lg.forEach(([c,s],i)=>{const y=B.y0+100+i*24*kk;ctx.fillStyle=c;ctx.fillRect(B.x1-180,y-7,16,14);H.txt(ctx,s,B.x1-158,y,{s:13*kk,w:700,b:'middle'});});}
L.models={
  goals:{
    bio:['How Rutherford’s gold foil experiment works','What the plum-pudding model predicts, and why it failed','Why rare back-bounces mean a tiny, dense, positive nucleus','How each model of the atom answered the evidence of its time'],
    honors:['How alpha energy and foil thickness change the count','Why most alphas pass almost straight through'],
    ap:['How the closest approach sets an upper limit on the size of the nucleus','Why back-scattering grows with the square of the nuclear charge']},
  matters:'Nobody can see an atom, so every model of one came from indirect evidence, like rolling marbles into a dark box. Rutherford’s experiment is still the pattern for studying anything too small or too far away to see.',
  steps:[
    {key:'src',title:'The alpha source',set:{view:'foil',model:'thomson'},speed:0.5,focus:[10,190,110,76],
     see:'A lead box on the left shoots a narrow beam of alpha particles toward a thin gold foil.',
     why:'An alpha particle is a helium nucleus: 2 protons and 2 neutrons, moving at about 5% of the speed of light. It is positive and heavy.',
     overlay(sim,ctx,LH,k,tau){ring(ctx,k,[10,190,110,76],tau);}},
    {key:'foil',title:'The foil and the screen',set:{view:'foil',model:'thomson'},speed:0.5,focus:[[276,168,48,120],[136,64,328,328]],
     see:'The foil is gold leaf 0.4 µm thick, about 1,400 atoms. A ring-shaped screen around it flashes wherever an alpha lands.',
     why:'Counting flashes at each angle shows how the atoms bent the beam. It is a way to look inside atoms without seeing them.',
     overlay(sim,ctx,LH,k,tau){ring(ctx,k,[[276,168,48,120],[136,64,328,328]],tau);}},
    {key:'plum',title:'What the plum pudding predicts',set:{view:'foil',model:'thomson'},run:moFire,speed:0.5,focus:[[136,64,328,328],[492,74,296,296]],
     see:'The plum-pudding model spreads positive charge through the whole atom. In the close-up, every alpha passes nearly straight through.',
     why:'Spread-out charge is too weak to turn back a heavy, fast alpha. A million are fired, and none bounce back past 90°.',
     overlay(sim,ctx,LH,k,tau){ring(ctx,k,[[136,64,328,328],[492,74,296,296]],tau);moCard(ctx,k,LH,[['Plum pudding',{w:800,s:12}],[F(sim,'back',0)+' bounced back',{w:700,c:RED,s:12}]]);}},
    {key:'hook',title:'Your question: what they really saw',set:{view:'foil',model:'nuclear'},run:moFire,speed:0.5,focus:[136,64,328,328],
     see:'Now the nuclear model. Almost all pass straight through, but about 38 of a million bounce back past 90°: about 1 in 26,000.',
     why:'Geiger and Marsden saw these rare bounces. Rutherford compared it to a shell bouncing back off tissue paper.',
     overlay(sim,ctx,LH,k,tau){ring(ctx,k,[136,64,328,328],tau);moCard(ctx,k,LH,[['Nuclear model',{w:800,s:12}],[F(sim,'back',0)+' bounced back',{w:700,c:GREEN,s:12}]]);}},
    {key:'why',title:'Why: a tiny nucleus',set:{view:'foil',model:'nuclear'},speed:0.4,focus:[492,74,296,296],
     see:'The close-up of one gold nucleus: alphas aimed almost straight at it swing back; near misses bend a little.',
     why:'The positive charge sits in a nucleus 20,000 times narrower than the atom, a marble in a stadium. Only a near hit gets a strong push.',
     overlay(sim,ctx,LH,k,tau){ring(ctx,k,[492,74,296,296],tau);}},
    {key:'graph',title:'The detector graph',set:{view:'foil',model:'nuclear'},run:sim=>{BioLab.setValues(sim,{model:'thomson'});moFire(sim);sim._th=sim.st.hist.slice();BioLab.setValues(sim,{model:'nuclear'});moFire(sim);},speed:0.5,
     see:'Counts at each angle for a million alphas. Gray, plum pudding: all within a few degrees. Red, nuclear: a long tail past 90°.',
     why:'Only a tiny, concentrated charge can make that tail. The graph of counts, not any picture, is the evidence for the nucleus.',
     overlay(sim,ctx,LH,k,tau){moGraph(ctx,k,LH,sim,tau);}},
    {key:'energy',lvl:'honors',title:'Faster alphas bounce back less',set:{view:'foil',model:'nuclear',energy:10},cause:{from:{energy:5},delay:1.5,dur:2.5},speed:0.5,focus:[136,64,328,328],
     see:'The alpha energy doubles, 5 to 10 MeV. Predicted back-bounces drop from about 38 to about 10 per million.',
     why:'A faster alpha needs a closer hit to turn around. Back-bounces fall as 1 ÷ energy²: double the energy, a quarter of the count.',
     overlay(sim,ctx,LH,k,tau){ring(ctx,k,[136,64,328,328],tau);moCard(ctx,k,LH,[[F(sim,'f90',1)+' per million',{w:800,c:GREEN,s:12}]]);}},
    {key:'thick',lvl:'honors',title:'Thicker foil, more bounces',set:{view:'foil',model:'nuclear',thick:0.8},cause:{from:{thick:0.4},delay:1.5,dur:2.5},speed:0.5,focus:[276,168,48,120],
     see:'The foil doubles in thickness, 0.4 to 0.8 µm. Predicted back-bounces double too, to about 77 per million.',
     why:'Each atom is a separate chance for a near hit, so twice the atoms gives twice the hits. Each bounce comes from one nucleus.',
     overlay(sim,ctx,LH,k,tau){ring(ctx,k,[276,168,48,120],tau);moCard(ctx,k,LH,[[F(sim,'f90',1)+' per million',{w:800,c:GREEN,s:12}]]);}},
    {key:'dmin',lvl:'ap',title:'Closest approach',set:{view:'foil',model:'nuclear'},speed:0.3,focus:[492,74,296,296],
     see:'In the close-up, a head-on alpha slows, stops and turns back. The dashed circle marks how close it gets: about 45 fm for 5 MeV on gold.',
     why:'It stops where all its kinetic energy has become electric potential energy: d = kq₁q₂ ÷ KE. The nucleus must be smaller than d, thousands of times smaller than the atom.',
     overlay(sim,ctx,LH,k,tau){ring(ctx,k,[492,74,296,296],tau);moCard(ctx,k,LH,[[FL(sim,'dmin',0,'Closest'),{w:800,c:GREEN,s:12}],[FL(sim,'rn',1,'Nucleus'),{w:700,s:12}]]);}},
    {key:'Z',lvl:'ap',title:'Charge matters: gold vs silver',set:{view:'foil',model:'nuclear',metal:'Ag'},cause:{from:{metal:'Au'},delay:1.5,dur:0.6},speed:0.5,focus:[276,168,48,120],
     see:'Gold (Z = 79) is swapped for silver (Z = 47). The predicted back-bounces drop from about 38 to about 13 per million.',
     why:'The push grows with the nucleus’s charge, so back-scattering grows as Z². (47 ÷ 79)² ≈ 0.35. Experiments like this first measured the charge of a nucleus.',
     overlay(sim,ctx,LH,k,tau){ring(ctx,k,[276,168,48,120],tau);moCard(ctx,k,LH,[[F(sim,'f90',1)+' per million',{w:800,c:GREEN,s:12}]]);}},
    {key:'time',title:'The timeline of models',set:{view:'timeline',era:'rutherford'},pause:true,focus:[10,10,780,430],
     see:'The timeline: Dalton’s solid spheres, Thomson’s plum pudding, Rutherford’s nucleus, Bohr’s orbits, the quantum cloud and Chadwick’s neutron.',
     why:'Each model explained the evidence of its time, and was changed when new evidence didn’t fit. That is how science is supposed to work.'}
  ],
  useIt:[
    {do:'Check a smoke detector’s label for americium-241.',why:'Many smoke detectors hold a tiny alpha source, like Rutherford’s. The alphas let a small current flow through the air; smoke blocks it and sets off the alarm.'},
    {do:'Test a “black box” the way Rutherford did.',why:'When you can’t look inside something, send something in and watch what comes out. Doctors do this with X-rays and ultrasound.'},
    {do:'Treat a surprising result as a clue, not a mistake.',why:'Geiger and Marsden could have ignored a bounce in every few thousand. Taking it seriously revealed the nucleus.'}],
  tryIt:[{title:'the mystery shape (15 minutes, with a partner)',steps:['Your partner tapes a shape (circle, triangle or square, about 10 cm across) under a large piece of cardboard propped up on books, without you seeing it.','Roll marbles under the cardboard from many directions and watch where they come out.','Sketch where the marbles bounced and guess the shape before you lift the cardboard.'],look:'Sharp bounces show flat edges; marbles that roll straight through show empty space. You figured out a shape you never saw, the way Rutherford found the nucleus.'}]};

BioLab.addLearn(L);
Object.keys(R).forEach(id=>{const d=DEF(id);if(d&&d.review&&d.review.questions&&d.review.questions.length)delete R[id];});
BioLab.addReview(R);
})();
