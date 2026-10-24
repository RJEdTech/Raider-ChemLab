(function(){
'use strict';
const {clamp,lerp,rng,rr,txt,pill,atLeast,PAL,FONT,RM,axes,legend,serColor,lvText}=BioLab.h;
const CL=window.ChemLab;

/* Stoichiometry air bag. NaHCO₃(s) + HC₂H₃O₂(aq) → NaC₂H₃O₂(aq) + H₂O(l) + CO₂(g), 1:1:1.
   Moles of CO₂ = the smaller of mol NaHCO₃ and mol acetic acid. Gas volume from PV = nRT at the room's T and P.
   The bag holds the liquid and the gas, so fullness = (V_gas + V_liquid) ÷ bag volume. */
const R=CL.K.Ratm,M_S=CL.molarMass('NaHCO3'),M_A=CL.molarMass('HC2H3O2'),M_AZ=CL.molarMass('NaN3');
const VIN_D=1.005,VIN_PCT=0.05,MOL_PER_ML=VIN_D*VIN_PCT/M_A; // vinegar: 5.0% acetic acid by mass, 1.005 g/mL
const BAGS={pint:{l:'Pint bag (0.473 L)',V:0.473,w:240,h:200},quart:{l:'Quart bag (0.946 L)',V:0.946,w:300,h:250},gallon:{l:'Gallon bag (3.785 L)',V:3.785,w:380,h:310}};
const PLACES={rj:{l:'RJ classroom, Aurora CO (0.83 atm)',P:0.83},sea:{l:'Sea level (1.00 atm)',P:1.0}};
const TAU=1.1,BURST=1.3;
const BX=245,BY=262; // bag center

function cond(p){const P=PLACES[p.place].P,T=p.temp+273.15;return {P,T,Vm:R*T/P};}
function plan(p){const c=cond(p),b=BAGS[p.bag],nS=p.soda/M_S,nA=p.vin*MOL_PER_ML,n=Math.min(nS,nA),liq=p.vin/1000;
  return {...c,b,nS,nA,n,liq,lim:nS<nA-1e-9?'s':nA<nS-1e-9?'a':'both',Vg:n*c.Vm,F:(n*c.Vm+liq)/b.V};}
function nowN(sim){const st=sim.st,pl=st.pl;if(!st.mixed)return 0;return pl.n*(1-Math.exp(-Math.max(0,sim.t-st.t0)/TAU));}
function fullness(sim){const st=sim.st,pl=st.pl;if(st.burst)return pl.liq/pl.b.V;return (nowN(sim)*pl.Vm+pl.liq)/pl.b.V;}
function outcome(F,burst){if(burst)return 'Burst: the zipper popped open';if(F<0.85)return 'Underinflated: floppy';if(F<=1.05)return 'Just right: full and firm';return 'Overinflated: seams straining';}
function need(p){const c=cond(p),b=BAGS[p.bag];// solve n·Vm + n/MOL_PER_ML/1000 = V
  const n=b.V/(c.Vm+1/(MOL_PER_ML*1000));return {n,g:n*M_S,mL:n/MOL_PER_ML,Vm:c.Vm};}
function car(p){const P=PLACES[p.place].P,T=p.carT+273.15,nN=P*p.carV/(R*T),nAz=nN*2/3;return {P,T,nN,nAz,g:nAz*M_AZ};}

const MODE={bag:{ctl:['bag','soda','vin','place','temp'],met:['vm','vgas','full','out','nco2','lim'],act:['mix','new']},car:{ctl:['carV','carT','place'],met:['nN2','mAz','vmc'],act:[]}};
function modeUI(sim){if(!sim.ui||!sim.ui.sec)return;const m=MODE[sim.p.mode],d=sim.def,sec=sim.ui.sec;
  d.controls.forEach(c=>{if(c.id==='mode')return;const e=sec.querySelector('#airbag-'+c.id)||sec.querySelector('#airbag-'+c.id+'-l');const w=e&&e.closest('.ctl');if(w)w.hidden=!atLeast(c.lvl)||!m.ctl.includes(c.id);});
  d.metrics.forEach(mm=>{const t=sim.ui.tiles[mm.id];const w=t&&t.num.closest('.tile');if(w)w.hidden=!atLeast(mm.lvl)||!m.met.includes(mm.id);});
  const btns=[...sec.querySelectorAll('.controls .actions button')];d.actions.forEach((a,i)=>{const b=btns[i];if(b)b.hidden=!atLeast(a.lvl)||!m.act.includes(a.id);});}
function changed(sim){if(sim.st)BioLab.reset(sim);modeUI(sim);}

const SIM={
  id:'airbag',hash:'airbag',apUnit:8,order:5,tab:'Stoichiometry air bags',kind:'Virtual lab',prereq:['stoich','mole'],next:['gasstoich','gaslaws'],
  card:'Calculate the baking soda and vinegar that exactly fill a zip bag with CO₂, then seal it and see if it sags, fills or bursts.',
  title:'Stoichiometry air bags: fill the bag exactly',
  lede:{bio:'Baking soda and vinegar make carbon dioxide gas. Your job: calculate how much of each to use so the gas fills a zip bag exactly, without sagging or bursting.',
        honors:'Use PV = nRT with the real temperature and pressure in the room. At RJ’s altitude the air pressure is only about 0.83 atm, so every mole of gas takes up more space than at sea level.',
        ap:'Account for the liquid’s volume, find the limiting reactant from mismatched amounts, and run the same calculation for a real car air bag.'},
  scale:{bio:'A real zip bag on a lab bench. One quart is 0.946 L. Vinegar is 5% acetic acid by mass.',honors:'At 22 °C and 0.83 atm, one mole of gas fills about 29.2 L, not the 22.4 L it fills at STP.'},
  timeScale:1,dtMax:0.05,prewarm:0,sampleDt:0.1,window:10,unit:'s',chChange:0.6,chReveal:6,
  controls:[
    {id:'mode',label:'Activity',type:'seg',def:'bag',lvl:'bio',noTrial:true,options:[{v:'bag',l:'Zip bag lab'},{v:'car',l:'Car air bag (calculation)',lvl:'ap'}],onChange:changed},
    {id:'bag',label:'Bag size',type:'select',def:'quart',lvl:'bio',options:Object.keys(BAGS).map(k=>({v:k,l:BAGS[k].l})),onChange:changed},
    {id:'soda',label:'Baking soda (NaHCO₃)',type:'range',min:0,max:12,step:0.05,def:2.6,unit:' g',d:2,lvl:'bio',onChange:changed},
    {id:'vin',label:'Vinegar (5% acetic acid)',type:'range',min:0,max:250,step:1,def:37,unit:' mL',lvl:'bio',onChange:changed},
    {id:'place',label:'Where you run it',type:'seg',def:'rj',lvl:'honors',options:Object.keys(PLACES).map(k=>({v:k,l:PLACES[k].l})),onChange:changed},
    {id:'temp',label:'Room temperature',type:'range',min:5,max:40,step:1,def:22,unit:' °C',lvl:'honors',onChange:changed},
    {id:'carV',label:'Air bag volume',type:'range',min:30,max:150,step:5,def:60,unit:' L',lvl:'ap',help:'A driver’s bag is about 60 L; a passenger bag about 120 L.',onChange:changed},
    {id:'carT',label:'Gas temperature',type:'range',min:25,max:150,step:5,def:25,unit:' °C',lvl:'ap',onChange:changed}
  ],
  actions:[
    {id:'mix',label:'Seal the bag and mix',lvl:'bio',primary:true,run(sim){const st=sim.st;if(st.mixed||sim.p.mode!=='bag')return;st.mixed=true;st.t0=sim.t;}},
    {id:'new',label:'New bag',lvl:'bio',run(sim){BioLab.reset(sim);}}
  ],
  init(sim){return {pl:plan(sim.p),mixed:false,t0:0,burst:false,bub:[],hist:[],ht:-1,popT:0};},
  step(sim,dt){const st=sim.st;if(st.mixed&&!st.burst&&fullness(sim)>BURST){st.burst=true;st.popT=1.2;sim.infoDirty=true;}
    if(st.popT>0)st.popT-=dt;
    const rate=st.mixed&&!st.burst?st.pl.n*Math.exp(-Math.max(0,sim.t-st.t0)/TAU)/TAU/Math.max(1e-6,st.pl.n):0;
    if(rate>0.02&&st.bub.length<90&&Math.random()<rate*dt*60)st.bub.push({x:(Math.random()-0.5)*0.9,y:0,v:40+Math.random()*50,r:2+Math.random()*3});
    st.bub=st.bub.filter(b=>{b.y+=b.v*dt;return b.y<160;});
    if(sim.t-st.ht>=0.099){st.ht=sim.t;st.hist.push([sim.t,st.burst?0:nowN(sim)*st.pl.Vm]);if(st.hist.length>300)st.hist.shift();}},
  metrics:[
    {id:'vm',label:'Molar volume in this room',unit:'L/mol',lvl:'bio',min:0,max:null,d:1,get:s=>cond(s.p).Vm},
    {id:'vgas',label:'CO₂ in the bag',unit:'L',lvl:'bio',min:0,max:null,d:3,get:s=>s.st.burst?0:nowN(s)*s.st.pl.Vm},
    {id:'full',label:'How full the bag is',unit:'%',lvl:'bio',min:0,max:130,d:0,get:s=>100*fullness(s)},
    {id:'out',label:'Result',unit:'',lvl:'bio',text:true,get:s=>!s.st.mixed?'Not sealed and mixed yet':outcome(fullness(s),s.st.burst)},
    {id:'nco2',label:'Moles of CO₂ made',unit:'mol',lvl:'honors',min:0,max:null,d:4,get:s=>nowN(s)},
    {id:'lim',label:'Limiting reactant',unit:'',lvl:'honors',text:true,get:s=>{const pl=s.st.pl;if(pl.n<=0)return 'One reactant is missing';return pl.lim==='s'?'Baking soda (vinegar left over)':pl.lim==='a'?'Acetic acid (baking soda left over)':'Neither: exact 1 : 1';}},
    {id:'nN2',label:'Moles of N₂ needed',unit:'mol',lvl:'ap',min:0,max:null,d:3,get:s=>car(s.p).nN},
    {id:'mAz',label:'Mass of Na‌N₃ needed',unit:'g',lvl:'ap',min:0,max:null,d:1,get:s=>car(s.p).g},
    {id:'vmc',label:'Molar volume of the hot gas',unit:'L/mol',lvl:'ap',min:0,max:null,d:1,get:s=>{const c=car(s.p);return R*c.T/c.P;}}
  ],
  graphs:[{id:'vol',label:'Gas volume in the bag',lvl:'bio',custom:true}],
  defaultGraph:'vol',
  plot(sim,ctx,box,id){const st=sim.st,pl=st.pl;if(sim.p.mode==='car'){txt(ctx,'The car air bag inflates in about 0.03 s; see the calculation on the stage.',box.cw/2,box.ch/2,{s:15,c:PAL['muted'],a:'center',b:'middle'});return;}
    const cap=pl.b.V-pl.liq,ymax=Math.max(pl.Vg,cap*BURST+pl.b.V*0.05)*1.1,tmax=Math.max(10,sim.t);
    const ax=axes(ctx,box,{xmin:0,xmax:tmax,ymin:0,ymax,xl:'Time (s)',yl:'CO₂ volume (L)'});
    [[cap,'bag full',PAL['s3']],[(BURST*pl.b.V-pl.liq),'bursts',PAL['s1']]].forEach(([v,l,c])=>{ctx.setLineDash([6,4]);ctx.strokeStyle=c;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(box.L,ax.Y(v));ctx.lineTo(box.L+box.W,ax.Y(v));ctx.stroke();ctx.setLineDash([]);txt(ctx,l,box.L+box.W-6,ax.Y(v)-6,{s:12,c,a:'right',w:600});});
    ctx.save();ctx.beginPath();ctx.rect(box.L,box.T,box.W,box.H);ctx.clip();ctx.strokeStyle=serColor(1);ctx.lineWidth=2.5;ctx.beginPath();st.hist.forEach((h,i)=>{i?ctx.lineTo(ax.X(h[0]),ax.Y(h[1])):ctx.moveTo(ax.X(h[0]),ax.Y(h[1]));});ctx.stroke();ctx.restore();},
  infoPanel(sim){const p=sim.p,pl=plan(p),hon=atLeast('honors'),ap=atLeast('ap');
    if(p.mode==='car'){const c=car(p);return `<h3>Car air bag: the calculation</h3><p>2Na&zwnj;N<sub>3</sub>(s) → 2Na(s) + 3N<sub>2</sub>(g)</p><p>n(N<sub>2</sub>) = PV/RT = (${c.P.toFixed(2)} atm)(${p.carV} L) ÷ [(0.08206)(${c.T.toFixed(0)} K)] = <b>${c.nN.toFixed(3)} mol</b></p><p>n(Na&zwnj;N<sub>3</sub>) = ${c.nN.toFixed(3)} mol N<sub>2</sub> × (2 mol Na&zwnj;N<sub>3</sub> / 3 mol N<sub>2</sub>) = ${c.nAz.toFixed(3)} mol</p><p>mass = ${c.nAz.toFixed(3)} mol × ${M_AZ.toFixed(2)} g/mol = <b>${c.g.toFixed(1)} g</b></p><p class="help">Sodium azide is highly toxic. Real inflators also contain KNO₃ and SiO₂, which turn the reactive sodium metal into a harmless glass. This mode is a calculation only.</p>`;}
    const nd=need(p);
    let h=`<h3>Your plan</h3><p>${p.soda.toFixed(2)} g NaHCO<sub>3</sub> ÷ ${M_S.toFixed(2)} g/mol = <b>${pl.nS.toFixed(4)} mol</b><br>${p.vin} mL vinegar × ${VIN_D} g/mL × 0.050 ÷ ${M_A.toFixed(2)} g/mol = <b>${pl.nA.toFixed(4)} mol</b> HC<sub>2</sub>H<sub>3</sub>O<sub>2</sub></p>
      <p>The mole ratio is 1 : 1, so you make <b>${pl.n.toFixed(4)} mol CO<sub>2</sub></b>${pl.n>0?' (limited by '+(pl.lim==='s'?'baking soda':pl.lim==='a'?'acetic acid':'both equally')+')':''}.</p>
      <p>Volume = ${pl.n.toFixed(4)} mol × ${pl.Vm.toFixed(1)} L/mol = <b>${pl.Vg.toFixed(3)} L</b> of gas, plus ${(pl.liq).toFixed(3)} L of liquid, in a ${pl.b.V} L bag: <b>${(100*pl.F).toFixed(0)}% full</b>.</p>`;
    if(hon)h+=`<p class="help">Molar volume here: V/n = RT/P = (0.08206)(${pl.T.toFixed(2)} K) ÷ ${pl.P.toFixed(2)} atm = ${pl.Vm.toFixed(1)} L/mol.</p>`;
    h+=`<details><summary>Check: the amounts that fill this bag exactly</summary><p>${nd.n.toFixed(4)} mol CO<sub>2</sub>: <b>${nd.g.toFixed(2)} g</b> baking soda and <b>${nd.mL.toFixed(0)} mL</b> vinegar${ap?' (the gas gets the bag volume minus the liquid’s volume)':''}.</p></details>`;
    return h;},
  narrate(sim){const p=sim.p,st=sim.st,pl=st.pl,hon=atLeast('honors');
    if(p.mode==='car'){const c=car(p);return '<b>'+c.g.toFixed(0)+' g of sodium azide</b> makes '+c.nN.toFixed(2)+' mol of N₂, enough to fill a '+p.carV+' L bag at '+p.carT+' °C. The reaction is over in about 30 milliseconds. Calculation only: Na‌N₃ is highly toxic.';}
    if(pl.n<=0)return 'You need both reactants. With '+(p.soda<=0?'no baking soda':'no vinegar')+', nothing reacts and no gas forms.';
    if(!st.mixed)return 'The baking soda sits in a folded tissue so it does not touch the vinegar yet. Squeeze out the air, seal the bag, then press <b>Seal the bag and mix</b>. Goggles on: vinegar stings eyes, and a bursting bag sprays it.';
    const F=fullness(sim);
    if(st.burst)return '<b>Pop!</b> You made '+pl.Vg.toFixed(2)+' L of CO₂ for a '+pl.b.V+' L bag. Too much gas pushed the zipper open. Use less of the limiting reactant.';
    if(nowN(sim)<pl.n*0.97)return 'The acid gives an H⁺ to each HCO₃⁻ ion, which breaks apart into H₂O and CO₂ gas. Each mole of baking soda that reacts makes one mole of CO₂, which takes up '+pl.Vm.toFixed(1)+' L here.';
    const lim=pl.lim==='s'?'Baking soda ran out first, so extra vinegar is left.':pl.lim==='a'?'The acetic acid ran out first, so white baking soda is left at the bottom.':'Both reactants ran out together.';
    if(F<0.85)return '<b>Underinflated.</b> Only '+pl.Vg.toFixed(2)+' L of CO₂ formed for a '+pl.b.V+' L bag. '+lim+(hon?'':' Use more of both reactants in a 1 : 1 mole ratio.');
    if(F<=1.05)return '<b>Just right.</b> '+pl.Vg.toFixed(2)+' L of CO₂ plus the liquid fill the '+pl.b.V+' L bag. '+lim;
    return '<b>Overinflated.</b> '+pl.Vg.toFixed(2)+' L of CO₂ is squeezed into the bag, so the pressure inside rises and the seams strain. '+lim;},
  tour:[
    {title:'The goal',text:'Fill this quart bag (0.946 L) with carbon dioxide, exactly. Too little gas and it sags; too much and it bursts.',focus:[30,60,430,370],pause:true},
    {title:'The reaction',text:'NaHCO₃ + HC₂H₃O₂ → NaC₂H₃O₂ + H₂O + CO₂. Every coefficient is 1, so 1 mol of baking soda makes 1 mol of CO₂.',focus:[0,6,800,48],pause:true},
    {title:'How much space a mole takes',text:'In our classroom (22 °C, 0.83 atm), one mole of gas fills about 29.2 L. So the bag needs about 0.946 ÷ 29.2 = 0.031 mol of CO₂.',focus:[490,270,300,170],pause:true},
    {title:'Grams of baking soda',text:'0.031 mol × 84.01 g/mol = about 2.6 g of NaHCO₃.',focus:[30,60,430,370],pause:true},
    {title:'Milliliters of vinegar',text:'Vinegar is 5% acetic acid. Each mL holds about 0.00084 mol, so 0.031 mol needs about 37 mL.',focus:[30,60,430,370],pause:true},
    {title:'Seal and mix',text:'Seal the bag and tip the baking soda into the vinegar. CO₂ bubbles out of the liquid and the bag fills.',focus:[30,60,430,370],speed:0.5,setup(sim){SIM.actions[0].run(sim);}},
    {title:'Check the result',text:'The readouts show how full the bag is. Change one amount and try again: the limiting reactant decides how much gas you get.',focus:[490,270,300,170],speed:1},
    {lvl:'ap',title:'A real car air bag',text:'Car bags use 2Na‌N₃ → 2Na + 3N₂. The same steps, PV = nRT then the mole ratio, give the mass of sodium azide. Calculation only: it is highly toxic.',focus:[0,0,800,450],pause:true,setup(sim){BioLab.setValues(sim,{mode:'car'});}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{mode:'bag'});BioLab.reset(sim);},
  onLevel(sim){modeUI(sim);},
  challenges:[
    {lvl:'bio',q:'2.60 g of baking soda and 37 mL of vinegar fill the quart bag. You double the baking soda to 5.20 g but keep 37 mL of vinegar. The bag will…',choices:['inflate twice as much and burst','fill the same; the extra baking soda is left over','fill halfway'],correct:1,
     baseline:{soda:2.6,vin:37},change:{soda:5.2},changeAction:'mix',changeText:'Baking soda doubled, bag sealed and mixed',watch:'vol',
     explain:{bio:'The vinegar has only 0.031 mol of acetic acid, and each mole of acid makes one mole of CO₂. Once the acid is used up, the extra baking soda has nothing to react with. Vinegar is the limiting reactant.'}},
    {lvl:'bio',instant:true,q:'The sealed bag and everything in it has a mass of 50.00 g before mixing. After the reaction, with the bag still sealed, its mass is…',choices:['less, because gas weighs nothing','still 50.00 g','more, because a new substance formed'],correct:1,
     explain:{bio:'No atoms enter or leave a sealed bag, so the mass stays 50.00 g. Gas has mass: the CO₂ here is about 1.4 g. (A very sensitive balance reads a tiny bit less because the bigger bag is buoyed up by the air, like a balloon.)'}},
    {lvl:'bio',instant:true,q:'A gallon bag holds 4 times as much as a quart bag. To fill it, you need…',choices:['4 times the baking soda but the same vinegar','4 times the baking soda and 4 times the vinegar','twice as much of each'],correct:1,
     explain:{bio:'Gas volume is proportional to moles of CO₂, and both reactants are used 1 : 1. Four times the volume needs four times the moles of each reactant. Switch the bag to a gallon to test it.'}},
    {lvl:'honors',q:'You use 2.60 g of baking soda and 37 mL of vinegar, first at sea level (1.00 atm) and then at RJ (0.83 atm). Compared with sea level, the bag at RJ will be…',choices:['less full, because thin air holds less gas','fuller, because gas expands at lower pressure','the same, because the moles are the same'],correct:1,
     baseline:{place:'sea'},change:{place:'rj'},changeAction:'mix',changeText:'Moved to RJ (0.83 atm), sealed and mixed',watch:'vol',
     explain:{honors:'The moles of CO₂ are the same, but V = nRT/P. At 0.83 atm the same gas takes up 1.00 ÷ 0.83 = 1.2 times the volume. This mix fills the quart bag only about 83% at sea level but about 99% at RJ.'}},
    {lvl:'honors',q:'Same amounts, but the room is 5 °C instead of 22 °C. The gas volume will be…',choices:['about 6% smaller','about 77% smaller, since 5 is much less than 22','the same'],correct:0,
     baseline:{temp:22},change:{temp:5},changeAction:'mix',changeText:'Room cooled to 5 °C, sealed and mixed',
     explain:{honors:'Volume is proportional to absolute temperature. 278 K ÷ 295 K = 0.94, so the gas is about 6% smaller. Celsius numbers can’t be used as ratios because 0 °C is not zero energy.'}},
    {lvl:'honors',instant:true,q:'Your bag needs 0.0400 mol of CO₂. How many grams of NaHCO₃ should you use?',choices:['3.36 g','0.000476 g','84.0 g','2.40 g'],correct:0,
     explain:{honors:'The mole ratio NaHCO₃ : CO₂ is 1 : 1, so you need 0.0400 mol NaHCO₃ × 84.01 g/mol = 3.36 g.'}},
    {lvl:'ap',instant:true,q:'Vinegar is 5.0% acetic acid by mass (density 1.005 g/mL). What volume of vinegar supplies 0.0400 mol of HC₂H₃O₂?',choices:['47.8 mL','2.40 mL','4.78 mL','24.0 mL'],correct:0,
     explain:{ap:'0.0400 mol × 60.05 g/mol = 2.402 g acid. 2.402 g ÷ 0.050 = 48.04 g vinegar. 48.04 g ÷ 1.005 g/mL = 47.8 mL. Forgetting the 5% gives 2.40 mL.'}},
    {lvl:'ap',instant:true,q:'A car air bag needs 60.0 L of N₂ at 1.00 atm and 25 °C (2Na‌N₃ → 2Na + 3N₂). What mass of Na‌N₃ is needed?',choices:['106 g','159 g','71 g','3.9 g'],correct:0,
     explain:{ap:'n(N₂) = PV/RT = (1.00)(60.0) ÷ (0.08206 × 298.15) = 2.45 mol. n(Na‌N₃) = 2.45 × 2/3 = 1.64 mol. 1.64 mol × 65.01 g/mol = 106 g. 159 g uses 1 : 1 instead of 2 : 3. Check it in the Car air bag mode.'}}
  ],
  lab:{bio:'<p><b>Question:</b> How much baking soda and vinegar exactly fill a zip bag?</p><ol><li>Read the molar volume in this room. Calculate the moles of CO₂ that fill a quart bag (0.946 L).</li><li>Convert to grams of baking soda (84.01 g/mol) and mL of vinegar (0.00084 mol acetic acid per mL).</li><li>Set your amounts, press Seal the bag and mix, and record a trial.</li><li>Adjust and try again until the bag is just right.</li></ol><p>Explain what happened when one reactant was in excess.</p>',
       honors:'<p><b>Question:</b> How do temperature and pressure change the amounts you need?</p><ol><li>Find the amounts that fill a gallon bag at RJ (0.83 atm, 22 °C). Record the trial.</li><li>Without changing amounts, switch to sea level, and record. Then try 5 °C and 35 °C.</li></ol><p>Use PV = nRT to predict each fullness before you run it, and compare with your data.</p>',
       ap:'<p><b>Question:</b> How precisely can you hit the target volume?</p><ol><li>Calculate amounts for a pint bag, accounting for the liquid’s volume. Record the trial.</li><li>Make the acetic acid limiting on purpose with 20% extra baking soda, and record.</li><li>Use the Car air bag mode to find the Na‌N₃ for a 120 L passenger bag at 100 °C.</li></ol><p><b>Claim–evidence–reasoning:</b> Explain why a real bag usually comes out slightly under-filled (hint: CO₂ dissolves in water).</p>'},
  terms:[{t:'Limiting reactant',d:'The reactant that runs out first and sets how much CO₂ forms.'},{t:'Excess reactant',d:'The reactant left over when the reaction stops.'},
    {t:'Mole ratio',d:'Here 1 mol NaHCO₃ : 1 mol HC₂H₃O₂ : 1 mol CO₂.'},{t:'Molar volume',d:'The volume one mole of gas fills at a given temperature and pressure (22.4 L at STP).'},
    {lvl:'honors',t:'Ideal gas law',d:'PV = nRT, with R = 0.08206 L·atm/(mol·K).'},{lvl:'honors',t:'Absolute temperature',d:'Kelvin = °C + 273.15. Gas volume is proportional to kelvins, not degrees Celsius.'},
    {lvl:'ap',t:'Percent by mass',d:'Grams of solute per 100 g of solution, like 5% acetic acid in vinegar.'},{lvl:'ap',t:'Sodium azide',d:'Na‌N₃, the toxic solid that decomposes to N₂ in car air bags.'}],
  about:'<p>Moles of CO₂ = the smaller of mol NaHCO₃ (84.01 g/mol) and mol acetic acid (60.05 g/mol, 5.0% by mass in vinegar of density 1.005 g/mL). The gas volume is nRT/P at the room’s temperature and pressure; RJ’s pressure is taken as 0.83 atm (about 1,700 m elevation). The bag holds liquid and gas together. It is “just right” from 85% to 105% full and bursts at 130%.</p><p>Simplifications: the reaction is drawn finishing in a few seconds; real bags take longer and need shaking. Some CO₂ stays dissolved in the liquid (about 1.5 g/L at 1 atm), which this model ignores, so real bags come out a little under-filled. The pressure in an overinflated bag is treated as the room’s pressure when computing gas volume. The car air bag mode is only a calculation from the balanced equation.</p>',
  initVis(sim){},
  draw(sim,ctx,vdt,k,t){const p=sim.p,st=sim.st;ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
    if(p.mode==='car'){drawCar(sim,ctx,k,t);return;}
    const pl=st.pl,b=pl.b,F=fullness(sim),nn=nowN(sim),frac=pl.n>0?nn/pl.n:0;
    fitText(ctx,'NaHCO₃(s) + HC₂H₃O₂(aq) → NaC₂H₃O₂(aq) + H₂O(l) + CO₂(g)',400,28,15*k,780);
    ctx.fillStyle=PAL['cv-bench'];ctx.fillRect(0,410,800,40);
    // bag
    const w=b.w,h0=b.h,inf=clamp(st.burst?0.15:F,0,BURST),bul=clamp(inf,0,1)*w*0.12+Math.max(0,inf-1)*w*0.18,hh=h0*(0.55+0.45*clamp(inf,0,1))+Math.max(0,inf-1)*40;
    const bot=408,topY=bot-hh,L=BX-w/2,Rr=BX+w/2;
    ctx.beginPath();ctx.moveTo(L,topY+8);ctx.quadraticCurveTo(L-bul,(topY+bot)/2,L+6,bot);ctx.lineTo(Rr-6,bot);ctx.quadraticCurveTo(Rr+bul,(topY+bot)/2,Rr,topY+8);
    ctx.quadraticCurveTo(BX,topY-bul*0.6,L,topY+8);ctx.closePath();
    ctx.fillStyle=PAL['cv-water'];ctx.globalAlpha=0.35;ctx.fill();ctx.globalAlpha=1;ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=2.5;ctx.stroke();
    ctx.save();ctx.clip();
    // liquid and powder
    const liqH=clamp(p.vin/1000/b.V*hh*1.6,0,hh*0.6);ctx.fillStyle='#d9e7ef';ctx.globalAlpha=0.8;ctx.fillRect(L-bul,bot-liqH,w+2*bul,liqH);ctx.globalAlpha=1;
    if(p.vin>0){ctx.fillStyle=PAL['cv-glass'];ctx.globalAlpha=0.5;ctx.fillRect(L-bul,bot-liqH,w+2*bul,2);ctx.globalAlpha=1;}
    const leftS=st.mixed?Math.max(0,pl.nS-nn):pl.nS,pw=clamp(Math.sqrt(leftS*M_S)*26,0,w*0.45);
    if(leftS>1e-6){const px=st.mixed?BX:L+pw/2+16,py=bot-(st.mixed?2:liqH+2);ctx.fillStyle='#fbfbf7';ctx.strokeStyle='#9a9a92';ctx.lineWidth=1.2;ctx.beginPath();ctx.ellipse(px,py,pw/2,Math.max(3,pw*0.22),0,Math.PI,0);ctx.closePath();ctx.fill();ctx.stroke();
      if(!st.mixed){ctx.strokeStyle='#c8c8c0';ctx.setLineDash([3,3]);ctx.strokeRect(px-pw/2-6,py-pw*0.3-8,pw+12,pw*0.3+10);ctx.setLineDash([]);}}
    st.bub.forEach(q=>{ctx.strokeStyle='#ffffff';ctx.globalAlpha=0.8;ctx.lineWidth=1.3;ctx.beginPath();ctx.arc(BX+q.x*w,bot-6-q.y*(liqH/160+0.4),q.r,0,6.29);ctx.stroke();});ctx.globalAlpha=1;
    ctx.restore();
    // zipper
    ctx.strokeStyle=st.burst?PAL['s1']:'#3f6fb0';ctx.lineWidth=5;ctx.beginPath();if(st.burst){ctx.moveTo(L+4,topY+10);ctx.lineTo(BX-14,topY+2);ctx.moveTo(BX+14,topY-6);ctx.lineTo(Rr-4,topY+10);}else{ctx.moveTo(L+4,topY+10);ctx.quadraticCurveTo(BX,topY-bul*0.6+4,Rr-4,topY+10);}ctx.stroke();
    if(st.popT>0){pill(ctx,'POP!',BX,topY-30,PAL['s1'],'#fff',22*k);for(let i=0;i<8;i++){const a=-Math.PI*(0.15+0.7*i/7);ctx.strokeStyle=PAL['s4'];ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(BX+Math.cos(a)*40,topY+Math.sin(a)*40);ctx.lineTo(BX+Math.cos(a)*70,topY+Math.sin(a)*70);ctx.stroke();}}
    txt(ctx,b.l,BX,bot+26*Math.max(1,k*0.75),{s:12.5*k,a:'center',w:600});
    // zoom on the gas
    const zx=640,zy=148,zr=88;ctx.save();ctx.fillStyle=PAL['card'];ctx.beginPath();ctx.arc(zx,zy,zr,0,6.29);ctx.fill();ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=2;ctx.stroke();ctx.clip();
    const nC=st.burst?2:Math.round(clamp(nn/Math.max(1e-6,need(p).n),0,2.5)*14),r=rng(11);
    for(let i=0;i<nC;i++){const a=r()*6.28,rad=Math.sqrt(r())*zr*0.82,ph=r()*6.28,x=zx+Math.cos(a)*rad+(RM?0:Math.sin(t*1.3+ph)*8),y=zy+Math.sin(a)*rad+(RM?0:Math.cos(t*1.1+ph)*8),ro=ph+(RM?0:t*0.6);
      ctx.save();ctx.translate(x,y);ctx.rotate(ro);CL.drawAtom(ctx,-11,0,6.5,'O',{label:''});CL.drawAtom(ctx,11,0,6.5,'O',{label:''});CL.drawAtom(ctx,0,0,7.5,'C',{label:''});ctx.restore();}
    if(nC===0)txt(ctx,'No gas yet',zx,zy,{s:14*k,a:'center',b:'middle',c:PAL['cv-soft']});
    ctx.restore();txt(ctx,'CO₂ gas inside the bag',zx,zy+zr+18*k,{s:12.5*k,a:'center',c:PAL['cv-soft']});
    ctx.setLineDash([4,4]);ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(zx-zr,zy+10);ctx.lineTo(BX+40,topY+30);ctx.stroke();ctx.setLineDash([]);
    // readout
    let y=zy+zr+50*Math.max(1,k*0.8);const lh=24*Math.max(1,k*0.85);
    txt(ctx,st.burst?'Gas escaped':(nn*pl.Vm).toFixed(2)+' L of CO₂',500,y,{s:15*k,w:800});y+=lh;
    txt(ctx,'in a '+b.V+' L bag: '+(100*F).toFixed(0)+'% full',500,y,{s:13*k});y+=lh;
    if(st.mixed&&frac>0.97){const oc=outcome(F,st.burst).split(':')[0];pill(ctx,oc,500+oc.length*4.2*k+10,y+6,st.burst?PAL['s1']:F<0.85?PAL['s4']:F<=1.05?PAL['s3']:PAL['s4'],'#fff',13*k);}
    else if(!st.mixed)txt(ctx,'Not mixed yet',500,y+6,{s:13*k,c:PAL['cv-soft']});},
  thumbSetup(sim){sim.st.mixed=true;sim.st.t0=-5;}
};
function fitText(ctx,s,x,y,size,maxW){ctx.font='700 '+size+'px '+FONT;const w=ctx.measureText(s).width;if(w>maxW)size*=maxW/w;txt(ctx,s,x,y,{s:size,w:700,a:'center',b:'middle'});}
function drawCar(sim,ctx,k,t){const p=sim.p,c=car(p);
  fitText(ctx,'2Na‌N₃(s) → 2Na(s) + 3N₂(g)',400,28,17*k,760);
  const cx=210,cy=250,ab=clamp(Math.cbrt(p.carV/60),0.6,1.5);
  ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=14;ctx.beginPath();ctx.arc(cx,cy,92,0,6.29);ctx.stroke();ctx.lineWidth=10;ctx.beginPath();ctx.moveTo(cx-90,cy);ctx.lineTo(cx+90,cy);ctx.moveTo(cx,cy);ctx.lineTo(cx,cy+90);ctx.stroke();
  ctx.fillStyle='#f1efe8';ctx.strokeStyle='#a8a396';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(cx,cy-6,120*ab,100*ab,0,0,6.29);ctx.fill();ctx.stroke();
  ctx.strokeStyle='#cfcabd';ctx.lineWidth=1.2;for(let i=1;i<4;i++){ctx.beginPath();ctx.ellipse(cx,cy-6,120*ab*i/4,100*ab*i/4,0,0,6.29);ctx.stroke();}
  txt(ctx,p.carV+' L of N₂',cx,cy-6,{s:15*k,w:800,a:'center',b:'middle',c:'#3a362e'});
  const x=410;let y=96;const lh=34*Math.max(1,k*0.8);
  [['n(N₂) = PV ÷ RT',c.nN.toFixed(3)+' mol'],['n(Na‌N₃) = n(N₂) × 2/3',c.nAz.toFixed(3)+' mol'],['mass Na‌N₃ = n × 65.01 g/mol',c.g.toFixed(1)+' g']].forEach(([a,b2],i)=>{
    txt(ctx,a,x,y,{s:13*k,c:PAL['cv-soft']});txt(ctx,b2,x,y+lh*0.7,{s:16*k,w:800,c:i===2?PAL['s1']:PAL['cv-ink']});y+=lh*1.75;});
  txt(ctx,'P = '+c.P.toFixed(2)+' atm, T = '+c.T.toFixed(0)+' K',x,y,{s:12.5*k,c:PAL['cv-soft']});
  pill(ctx,'Calculation only: Na‌N₃ is highly toxic',400,430,PAL['s4'],'#fff',12.5*k);}
BioLab.register(SIM);
})();
