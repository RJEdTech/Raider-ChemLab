(function(){
'use strict';
const {clamp,lerp,rng,rr,txt,pill,atLeast,PAL,FONT,RM,axes,legend,serColor,lvText}=BioLab.h;
const CL=window.ChemLab;
const NA=CL.K.NA,VSTP=22.4;

/* The mole road map. Every node shows the same sample in a different unit, all computed from the moles:
   g = n·M, particles = n·Nₐ, L of gas at STP = n·22.4 L/mol, L of solution = n ÷ molarity. Molar masses are summed
   from ChemLab's atomic masses. */
const SUBS={
  H2O:{n:'water',t:'mol',d:1.00},CO2:{n:'carbon dioxide',t:'mol',gas:1},O2:{n:'oxygen',t:'mol',gas:1},CH4:{n:'methane',t:'mol',gas:1},
  NH3:{n:'ammonia',t:'mol',gas:1,aq:1},He:{n:'helium',t:'atom',gas:1},NaCl:{n:'sodium chloride (table salt)',t:'ion',lat:['Na','Cl'],aq:1,d:2.16},
  C6H12O6:{n:'glucose',t:'mol',aq:1,d:1.54},C12H22O11:{n:'sucrose (table sugar)',t:'mol',aq:1,d:1.59},CaCO3:{n:'calcium carbonate (chalk)',t:'ion',lat:['Ca','C'],d:2.71},
  CuSO4:{n:'copper(II) sulfate',t:'ion',lat:['Cu','S'],aq:1,d:3.6},Fe:{n:'iron',t:'atom',lat:['Fe'],d:7.87},Cu:{n:'copper',t:'atom',lat:['Cu'],d:8.96},
  Au:{n:'gold',t:'atom',lat:['Au'],d:19.3},Al:{n:'aluminum',t:'atom',lat:['Al'],d:2.70},C:{n:'carbon (graphite)',t:'atom',lat:['C'],d:2.26},
  custom:{n:'your formula',t:'part',custom:true}
};
const SUBOPT=[['H2O'],['CO2'],['O2'],['CH4'],['NH3'],['He'],['NaCl'],['C6H12O6'],['C12H22O11'],['CaCO3','honors'],['CuSO4','honors'],['Fe'],['Cu'],['Au'],['Al'],['C'],['custom','honors']]
  .map(([f,l])=>({v:f,l:f==='custom'?'Your formula (type it in the calculator)':CL.fmt(f)+'  '+SUBS[f].n,lvl:l}));
const WORD={mol:'molecules',ion:'formula units',atom:'atoms',part:'particles'};
const NODES={g:{t:'Mass',u:'g'},mol:{t:'Moles',u:'mol'},n:{t:'Particles',u:''},L:{t:'Gas volume at STP',u:'L',lvl:'honors'},V:{t:'Volume of solution',u:'L',lvl:'ap'}};
const POS={g:[118,150],mol:[400,150],n:[682,150],L:[215,370],V:[585,370]};
const PANS=['C','H2O','NaCl','Au','C12H22O11'];
const PCOL={C:'#3b3b3b',H2O:'#5aa9e6',NaCl:'#f2f2ee',Au:'#d4a72c',C12H22O11:'#faf8f0'};
const BIG={
  water:{l:'Water molecules',one:['One H₂O molecule','about 0.28 nm across'],mole:['18.0 g of water','18.0 mL: about one big gulp','Tiny molecules make a small mole'],say:'it is only 18.0 g, about 18 mL, one big gulp. The number is huge, but each molecule is tiny.',icon:'water'},
  penny:{l:'Pennies',one:['One penny','2.50 g, 1.52 mm thick'],mole:['Stacked: 96,700 light-years tall,','about the width of the Milky Way','Mass: 1/4000 of Earth’s mass'],say:'stacked, they would reach 96,700 light-years, about the width of the Milky Way, and weigh 1/4000 as much as Earth.',icon:'penny'},
  sand:{l:'Grains of sand',one:['One grain of sand','about 0.5 mm across'],mole:['Would cover the whole','United States about 6 m deep','(two stories of sand)'],say:'they would cover the whole United States about 6 m deep.',icon:'sand'},
  sec:{l:'Seconds',one:['One second','one tick of a clock'],mole:['1.9 × 10¹⁶ years','1.4 million times the age','of the universe'],say:'that is 1.9 × 10¹⁶ years, about 1.4 million times the age of the universe.',icon:'clock'},
  dollar:{l:'Dollars',one:['One dollar','spend a billion every second'],mole:['Spending $1 billion per second,','a mole of dollars lasts','19 million years'],say:'spending a billion dollars every second, you would need 19 million years to spend them all.',icon:'dollar'}
};
const LADDER=[[12,'a dozen','12',1],[8.1e9,'people on Earth','8 × 10⁹',0],[2e11,'Milky Way stars','~10¹¹',1],[7.5e18,'beach sand grains','~10¹⁹',1],[NA,'1 mole','6.02 × 10²³',0]];

function sub(sim){const k=sim.p.sub;if(k!=='custom')return {f:k,...SUBS[k],M:CL.molarMass(k)};let f=sim.custom||'C8H10N4O2',M;try{M=CL.molarMass(f);}catch(e){f='C8H10N4O2';M=CL.molarMass(f);}return {f,...SUBS.custom,M};}
const word=s=>WORD[s.t];
function moles(sim){const p=sim.p,s=sub(sim),a=p.amt;switch(p.from){case 'g':return a/s.M;case 'mol':return a;case 'n':return a*1e23/NA;case 'L':return a/VSTP;case 'V':return a*p.molar;}return a;}
function val(sim,node,n){const s=sub(sim);if(n===undefined)n=moles(sim);switch(node){case 'g':return n*s.M;case 'mol':return n;case 'n':return n*NA;case 'L':return n*VSTP;case 'V':return n/sim.p.molar;}}
function okNode(sim,node){const s=sub(sim);if(node==='L')return !!s.gas;if(node==='V')return !!s.aq;return true;}
function vtxt(sim,node,v){if(!okNode(sim,node))return node==='L'?'not a gas at STP':'does not dissolve';if(node==='n')return CL.sci(v,'',3);return CL.toSig(v,3);}
function factor(sim,a,b){const s=sub(sim),M=s.M.toFixed(2),c=sim.p.molar.toFixed(2);const F={g_mol:['÷ '+M+' g/mol','1 mol',M+' g'],mol_g:['× '+M+' g/mol',M+' g','1 mol'],n_mol:['÷ 6.022 × 10²³','1 mol','6.022 × 10²³'],mol_n:['× 6.022 × 10²³','6.022 × 10²³','1 mol'],
  L_mol:['÷ 22.4 L/mol','1 mol','22.4 L'],mol_L:['× 22.4 L/mol','22.4 L','1 mol'],V_mol:['× '+c+' mol/L',c+' mol','1 L'],mol_V:['÷ '+c+' mol/L','1 L',c+' mol']};return F[a+'_'+b];}
function path(sim){const p=sim.p;const out=[];if(p.from!=='mol')out.push([p.from,'mol']);if(p.to!=='mol')out.push(['mol',p.to]);if(p.from===p.to)return [];return out;}
const UNITW=(sim,node)=>node==='g'?'g':node==='mol'?'mol':node==='n'?word(sub(sim)):node==='L'?'L':'L of solution';

/* show only the controls, tiles and buttons the current mode uses */
const MODE={map:{ctl:['sub','from','to','amt','molar'],met:['M','g','mol','n','L','V'],act:['practice','reveal']},scale:{ctl:['basis','nmol','gmass','pick'],met:['pm','pn','pM'],act:[]},big:{ctl:['obj'],met:['avo'],act:[]}};
function modeUI(sim){if(!sim.ui||!sim.ui.sec)return;const m=MODE[sim.p.mode],d=sim.def,sec=sim.ui.sec;
  d.controls.forEach(c=>{if(c.id==='mode')return;const e=sec.querySelector('#mole-'+c.id)||sec.querySelector('#mole-'+c.id+'-l');const w=e&&e.closest('.ctl');if(!w)return;
    let show=atLeast(c.lvl)&&m.ctl.includes(c.id);if(c.id==='nmol')show=show&&sim.p.basis==='mol';if(c.id==='gmass')show=show&&sim.p.basis==='g';if(c.id==='molar')show=show&&(sim.p.from==='V'||sim.p.to==='V');w.hidden=!show;});
  d.metrics.forEach(mm=>{const t=sim.ui.tiles[mm.id];const w=t&&t.num.closest('.tile');if(w)w.hidden=!atLeast(mm.lvl)||!m.met.includes(mm.id);});
  const btns=[...sec.querySelectorAll('.controls .actions button')];d.actions.forEach((a,i)=>{const b=btns[i];if(b)b.hidden=!atLeast(a.lvl)||!m.act.includes(a.id);});
  const lb=sec.querySelector('label[for=mole-amt]');if(lb){const u={g:'grams',mol:'moles',n:'× 10²³ particles',L:'liters of gas at STP',V:'liters of solution'}[sim.p.from];lb.textContent='Starting amount ('+u+')';}}
function changed(sim){if(sim.st)sim.st.hide=false;modeUI(sim);sim.infoDirty=true;}

function shape(f){const c=CL.parse(f),heavy=[],H=[];Object.keys(c).forEach(s=>{for(let i=0;i<c[s];i++)(s==='H'?H:heavy).push(s);});
  const out=[],nh=heavy.length,r0=nh<=1?0:nh<=3?8:4+nh*2.2,sc=nh>8?0.7:1;
  heavy.forEach((s,i)=>{const a=i/nh*6.283;out.push([s,Math.cos(a)*r0,Math.sin(a)*r0,(s==='C'||s==='N'||s==='O'?7:8)*sc]);});
  H.forEach((s,i)=>{const a=i/Math.max(1,H.length)*6.283+0.4,r=r0+9*sc;out.push(['H',Math.cos(a)*r,Math.sin(a)*r,4.2*sc]);});return out;}
function drawMolecule(ctx,f,x,y,sc,rot){const sh=shape(f);ctx.save();ctx.translate(x,y);ctx.rotate(rot||0);ctx.scale(sc,sc);sh.filter(a=>a[0]==='H').forEach(a=>CL.drawAtom(ctx,a[1],a[2],a[3],'H',{label:''}));sh.filter(a=>a[0]!=='H').forEach(a=>CL.drawAtom(ctx,a[1],a[2],a[3],a[0],{label:''}));ctx.restore();}
function drawZoom(ctx,s,cx,cy,R,t,k){ctx.save();ctx.fillStyle=PAL['card'];ctx.beginPath();ctx.arc(cx,cy,R,0,6.29);ctx.fill();ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=2;ctx.stroke();ctx.clip();
  if(s.lat){const g=17;for(let i=-5;i<=5;i++)for(let j=-5;j<=5;j++){const sym=s.lat[(i+j+20)%s.lat.length];const jx=RM?0:Math.sin(t*5+i*3+j)*0.8;CL.drawAtom(ctx,cx+i*g+jx,cy+j*g,sym==='Na'||sym==='Ca'||sym==='Cu'&&s.t==='ion'?6:7.5,sym,{label:''});}}
  else{const r=rng(5),big=s.f.length>6,g=big?58:s.gas?52:34,amp=s.gas?14:3;for(let i=-3;i<=3;i++)for(let j=-3;j<=3;j++){const x0=cx+i*g+(j%2)*g/2,y0=cy+j*g*0.87;if(Math.hypot(x0-cx,y0-cy)>R-10)continue;if(s.gas&&r()<0.35)continue;
    const ph=r()*6.28;drawMolecule(ctx,s.f,x0+(RM?0:Math.sin(t*(s.gas?1.3:2.5)+ph)*amp),y0+(RM?0:Math.cos(t*(s.gas?1.1:2.1)+ph)*amp),big?0.75:1,ph+(RM?0:t*0.4));}}
  ctx.restore();}

const SIM={
  id:'mole',hash:'mole',apUnit:8,order:1,tab:'The mole',kind:'Learning tool',prereq:['units','ptable'],next:['percentcomp','stoich','avgmass'],
  card:'Convert grams, moles, particles and liters on a live mole road map, weigh one mole of five substances, and see how big a mole really is.',
  title:'The mole: counting particles by weighing them',
  lede:{bio:'Atoms are far too small to count one by one, so chemists count them by weighing. A mole is 6.022 × 10²³ particles, and its mass in grams equals the formula mass.',
        honors:'Use the mole road map to convert between grams, moles, particles and liters of gas at STP, and build each molar mass from the periodic table.',
        ap:'Add moles in solution (mol = M × L), the mass of a single particle, and significant figures in every conversion.'},
  scale:{bio:'Atoms are about 0.1–0.3 nm across. One mole of water molecules fills only 18 mL, yet it holds 602,214,076,000,000,000,000,000 molecules.',
         honors:'STP means 0 °C and 1 atm, where one mole of any ideal gas takes up 22.4 L.'},
  aspect:1.6,timeless:true,animated:true,chChange:0.8,chReveal:3,
  controls:[
    {id:'mode',label:'View',type:'seg',def:'map',lvl:'bio',noTrial:true,options:[{v:'map',l:'Mole road map'},{v:'scale',l:'One mole on a balance'},{v:'big',l:'How big is a mole?'}],onChange:changed},
    {id:'sub',label:'Substance',type:'select',def:'H2O',lvl:'bio',options:SUBOPT,onChange:changed},
    {id:'from',label:'Start with',type:'seg',def:'g',lvl:'bio',options:[{v:'g',l:'Grams'},{v:'mol',l:'Moles'},{v:'n',l:'Particles'},{v:'L',l:'Liters of gas',lvl:'honors'},{v:'V',l:'Liters of solution',lvl:'ap'}],onChange:changed},
    {id:'to',label:'Convert to',type:'seg',def:'n',lvl:'bio',options:[{v:'g',l:'Grams'},{v:'mol',l:'Moles'},{v:'n',l:'Particles'},{v:'L',l:'Liters of gas',lvl:'honors'},{v:'V',l:'Liters of solution',lvl:'ap'}],onChange:changed},
    {id:'amt',label:'Starting amount',type:'range',min:0.1,max:100,step:0.1,def:36,lvl:'bio',onChange:changed},
    {id:'molar',label:'Solution concentration',type:'range',min:0.05,max:3,step:0.05,def:1,unit:' M',lvl:'ap',onChange:changed},
    {id:'basis',label:'Put on every pan',type:'seg',def:'mol',lvl:'bio',options:[{v:'mol',l:'The same moles'},{v:'g',l:'The same mass'}],onChange:changed},
    {id:'nmol',label:'Moles on each pan',type:'range',min:0.1,max:3,step:0.1,def:1,unit:' mol',lvl:'bio'},
    {id:'gmass',label:'Mass on each pan',type:'range',min:1,max:100,step:1,def:20,unit:' g',lvl:'bio'},
    {id:'pick',label:'Look closely at',type:'select',def:'Au',lvl:'bio',options:PANS.map(f=>({v:f,l:CL.fmt(f)+'  '+SUBS[f].n}))},
    {id:'obj',label:'A mole of…',type:'select',def:'water',lvl:'bio',options:Object.keys(BIG).map(k=>({v:k,l:BIG[k].l}))}
  ],
  actions:[
    {id:'practice',label:'New practice problem',lvl:'bio',primary:true,run(sim){const r=Math.random,lv=atLeast('ap')?5:atLeast('honors')?4:3;const nodes=['g','mol','n','L','V'].slice(0,lv);
      const subs=SUBOPT.filter(o=>!o.lvl||atLeast(o.lvl)).map(o=>o.v).filter(v=>v!=='custom');let s,a,b,tries=0;
      do{s=subs[Math.floor(r()*subs.length)];a=nodes[Math.floor(r()*nodes.length)];b=nodes[Math.floor(r()*nodes.length)];tries++;}while((a===b||(a==='L'||b==='L')&&!SUBS[s].gas||(a==='V'||b==='V')&&!SUBS[s].aq)&&tries<200);
      if(a===b){a='g';b='n';}BioLab.setValues(sim,{sub:s,from:a,to:b,amt:Math.round((0.5+r()*60)*10)/10});sim.st.hide=true;sim.infoDirty=true;}},
    {id:'reveal',label:'Show the answer',lvl:'bio',run(sim){sim.st.hide=false;sim.infoDirty=true;}}
  ],
  init(sim){return {hide:false};},
  step(sim,dt){},
  metrics:[
    {id:'M',label:'Molar mass',unit:'g/mol',lvl:'bio',min:0,max:null,d:2,get:s=>sub(s).M},
    {id:'g',label:'Mass',unit:'g',lvl:'bio',text:true,get:s=>s.st.hide&&s.p.from!=='g'?'?':vtxt(s,'g',val(s,'g'))+' g'},
    {id:'mol',label:'Moles',unit:'',lvl:'bio',text:true,get:s=>s.st.hide&&s.p.from!=='mol'?'?':vtxt(s,'mol',val(s,'mol'))+' mol'},
    {id:'n',label:'Particles',unit:'',lvl:'bio',text:true,get:s=>s.st.hide&&s.p.from!=='n'?'?':vtxt(s,'n',val(s,'n'))+' '+word(sub(s))},
    {id:'L',label:'Gas volume at STP',unit:'',lvl:'honors',text:true,get:s=>s.st.hide&&s.p.from!=='L'?'?':okNode(s,'L')?vtxt(s,'L',val(s,'L'))+' L':'not a gas at STP'},
    {id:'V',label:'Volume of solution',unit:'',lvl:'ap',text:true,get:s=>s.st.hide&&s.p.from!=='V'?'?':okNode(s,'V')?vtxt(s,'V',val(s,'V'))+' L at '+s.p.molar.toFixed(2)+' M':'does not dissolve'},
    {id:'pm',label:'Mass on the pan you picked',unit:'g',lvl:'bio',min:0,max:null,d:2,get:s=>panMass(s,s.p.pick)},
    {id:'pn',label:'Particles on that pan',unit:'',lvl:'bio',text:true,get:s=>CL.sci(panMol(s,s.p.pick)*NA,'',3)+' '+WORD[SUBS[s.p.pick].t]},
    {id:'pM',label:'Its molar mass',unit:'g/mol',lvl:'bio',min:0,max:null,d:2,get:s=>CL.molarMass(s.p.pick)},
    {id:'avo',label:'Avogadro’s number',unit:'',lvl:'bio',text:true,get:s=>'6.022 × 10²³ particles per mole'}
  ],
  graphs:[],
  infoPanel(sim){const p=sim.p,hon=atLeast('honors'),ap=atLeast('ap');
    if(p.mode==='scale'){const rows=PANS.map(f=>`<tr><td style="text-align:left">${CL.html(f)}</td><td>${CL.molarMass(f).toFixed(2)}</td><td>${panMass(sim,f).toFixed(2)}</td><td>${panMol(sim,f).toFixed(3)}</td><td>${CL.sci(panMol(sim,f)*NA,'',3)}</td></tr>`).join('');
      return `<h3>Every pan, measured</h3><div class="tbl-wrap"><table><thead><tr><th style="text-align:left">Substance</th><th>g/mol</th><th>Mass (g)</th><th>Moles</th><th>Particles</th></tr></thead><tbody>${rows}</tbody></table></div><p style="margin-top:8px" class="help">${p.basis==='mol'?'Same moles on every pan means the same number of particles, but different masses: each particle has a different mass.':'Same mass on every pan means fewer particles of the heavy substances and more of the light ones.'}</p>`;}
    if(p.mode==='big')return '<h3>Avogadro’s number</h3><p style="font-size:17px;font-weight:700;word-break:break-all">602,214,076,000,000,000,000,000</p><p>A dozen means 12 of anything. A mole means 6.022 × 10²³ of anything. The number is so large because it links the tiny atomic mass unit to the gram: 6.022 × 10²³ u = 1 g.</p>';
    const s=sub(sim),c=CL.parse(s.f);
    const rows=Object.keys(c).map(e=>`<tr><td style="text-align:left">${e}</td><td>${c[e]}</td><td>${CL.el(e).mass.toFixed(3)}</td><td>${(c[e]*CL.el(e).mass).toFixed(3)}</td></tr>`).join('');
    let h=`<h3>Molar mass of ${CL.html(s.f)}</h3><div class="tbl-wrap"><table><thead><tr><th style="text-align:left">Element</th><th>Atoms</th><th>g/mol each</th><th>Subtotal</th></tr></thead><tbody>${rows}<tr><td style="text-align:left"><b>Total</b></td><td></td><td></td><td><b>${s.M.toFixed(2)} g/mol</b></td></tr></tbody></table></div>`;
    const P=path(sim);
    if(P.length){if(sim.st.hide)h+='<p style="margin-top:10px"><b>Practice:</b> set up the conversion factors yourself, then press “Show the answer”.</p>';
      else{let chain=CL.toSig(p.amt,3)+' '+UNITW(sim,p.from);P.forEach(([a,b])=>{const f=factor(sim,a,b);chain+=' × <span style="white-space:nowrap">('+f[1]+' / '+f[2]+')</span>';});
        h+=`<p style="margin-top:10px"><b>Factor-label setup:</b><br>${chain} = <b>${vtxt(sim,p.to,val(sim,p.to))} ${UNITW(sim,p.to)}</b></p>`;}}
    if(hon&&!sim.st.hide){const n=moles(sim);h+='<p class="help">In this sample: '+Object.keys(c).map(e=>CL.sci(n*NA*c[e],'',3)+' '+e+' atoms').join(', ')+'.</p>';}
    if(ap)h+=`<p class="help">Mass of one ${s.t==='atom'?'atom':s.t==='ion'?'formula unit':'molecule'}: ${s.M.toFixed(2)} u = ${CL.sci(s.M/NA,'g',3)}.</p>`;
    if(hon)h+=`<p style="margin-top:8px"><label for="mole-calc"><b>Molar mass calculator:</b></label> <input id="mole-calc" class="sel" style="width:12em" value="${sim.custom||'C8H10N4O2'}" aria-describedby="mole-calc-out"> <span id="mole-calc-out"></span></p><p class="help">Type any formula, such as Ca(OH)2 or CuSO4*5H2O, then pick “Your formula” as the substance to use it on the map.</p>`;
    return h;},
  bindInfo(sim,el){const inp=el.querySelector('#mole-calc'),out=el.querySelector('#mole-calc-out');if(!inp)return;
    const upd=()=>{const f=inp.value.trim();try{const M=CL.molarMass(f);if(!f||!Number.isFinite(M)||M<=0)throw 0;sim.custom=f;out.innerHTML='= <b>'+M.toFixed(2)+' g/mol</b> ('+CL.html(f.replace(/\*/g,'·'))+')';}catch(e){out.textContent='Not a formula I can read yet';}};
    inp.addEventListener('input',upd);upd();},
  narrate(sim){const p=sim.p,s=sub(sim),hon=atLeast('honors');
    if(p.mode==='scale'){if(p.basis==='mol')return '<b>Every pan holds '+p.nmol.toFixed(1)+' mol: '+CL.sci(p.nmol*NA,'',3)+' particles each.</b> The masses differ because a gold atom (197 u) is much heavier than a carbon atom (12 u). Same count, different mass.';
      return '<b>Every pan holds '+p.gmass+' g, but not the same number of particles.</b> Carbon has the lightest particles (12.01 g/mol), so '+p.gmass+' g of it holds the most: '+CL.sci(p.gmass/12.011*NA,'',3)+' atoms.';}
    if(p.mode==='big'){const b=BIG[p.obj];return '<b>A mole of '+b.l.toLowerCase()+':</b> '+b.say+' A mole is a counting number, like a dozen, just far bigger.';}
    if(sim.st.hide)return '<b>Practice problem:</b> convert '+CL.toSig(p.amt,3)+' '+UNITW(sim,p.from)+' of '+CL.fmt(s.f)+' to '+NODES[p.to].t.toLowerCase()+'. Work it out on paper, then press “Show the answer”.';
    if(!okNode(sim,p.from)||!okNode(sim,p.to))return (p.from==='L'||p.to==='L')&&!s.gas?'<b>'+CL.fmt(s.f)+' is not a gas at STP</b>, so 22.4 L/mol does not apply. Molar volume works only for gases.':'<b>'+CL.fmt(s.f)+' does not dissolve in water</b>, so it cannot make a solution. Pick a soluble substance such as NaCl or sugar.';
    if(p.from===p.to)return 'Start and finish are the same unit, so there is nothing to convert. Pick a different “Convert to”.';
    const P=path(sim);const via=P.length===2?' Every route goes through moles: '+NODES[p.from].t.toLowerCase()+' → moles → '+NODES[p.to].t.toLowerCase()+'.':'';
    return '<b>'+CL.toSig(p.amt,3)+' '+UNITW(sim,p.from)+' of '+CL.fmt(s.f)+' = '+vtxt(sim,p.to,val(sim,p.to))+' '+UNITW(sim,p.to)+'.</b>'+via+(p.from==='g'||p.to==='g'?' The molar mass, '+s.M.toFixed(2)+' g/mol, links grams and moles.':'');},
  tour:[
    {title:'Moles are the hub',text:'A mole is a counting unit, like a dozen: 6.022 × 10²³ particles. Every conversion on the road map goes through moles in the middle.',focus:[POS.mol[0]-110,POS.mol[1]-60,220,120],pause:true,setup(sim){BioLab.setValues(sim,{mode:'map',sub:'H2O',from:'g',to:'n',amt:36});}},
    {title:'Grams to moles',text:'To go from grams to moles, divide by the molar mass. 36.0 g of water ÷ 18.02 g/mol = 2.00 mol.',focus:[10,40,500,170],pause:true},
    {title:'Where molar mass comes from',text:'Add up the atomic masses from the periodic table: H₂O = 2(1.008) + 16.00 = 18.02 g/mol. The table beside the graph shows every part.',focus:[POS.g[0]-110,POS.g[1]-60,220,120],pause:true},
    {title:'Moles to particles',text:'Multiply moles by Avogadro’s number. 2.00 mol × 6.022 × 10²³ = 1.20 × 10²⁴ water molecules.',focus:[290,40,500,170],pause:true},
    {title:'Same moles, different masses',text:'Each pan holds exactly 1 mol, so each holds 6.022 × 10²³ particles. The masses differ because the particles have different masses.',focus:[0,190,800,310],pause:true,setup(sim){BioLab.setValues(sim,{mode:'scale',basis:'mol',nmol:1});}},
    {title:'How big is a mole?',text:'A mole of water molecules is only 18 mL. A mole of pennies stacked up would cross the Milky Way. The number is huge; molecules are tiny.',focus:[0,40,800,200],pause:true,setup(sim){BioLab.setValues(sim,{mode:'big',obj:'water'});}},
    {lvl:'honors',title:'Liters of gas at STP',text:'At STP (0 °C, 1 atm) one mole of any gas fills 22.4 L, whatever the gas. Multiply moles by 22.4 L/mol.',focus:[POS.L[0]-110,POS.L[1]-60,220,120],pause:true,setup(sim){BioLab.setValues(sim,{mode:'map',sub:'CO2',from:'mol',to:'L',amt:2});}},
    {lvl:'ap',title:'Moles in solution',text:'Molarity is moles per liter. Moles = M × L, so 0.500 L of 1.00 M NaCl holds 0.500 mol.',focus:[POS.V[0]-110,POS.V[1]-60,220,120],pause:true,setup(sim){BioLab.setValues(sim,{mode:'map',sub:'NaCl',from:'V',to:'g',amt:0.5,molar:1});}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{mode:'map',sub:'H2O',from:'g',to:'n',amt:36});},
  onLevel(sim){modeUI(sim);},
  challenges:[
    {lvl:'bio',q:'Every pan holds 1 mol. Which pan holds the most particles?',choices:['Gold, because it is the heaviest','Sugar, because it is the biggest pile','They all hold the same number'],correct:2,
     baseline:{mode:'scale',basis:'mol',nmol:1},change:{nmol:1},changeText:'Look at the particle count under each pan',
     explain:{bio:'One mole of anything is 6.022 × 10²³ particles. The gold pan is heaviest because each gold atom has more mass, not because there are more of them.'}},
    {lvl:'bio',q:'Now every pan holds 20 g instead. Which pan holds the most particles?',choices:['Gold, the densest','Sugar, the biggest pile','Carbon, the lightest particles','They all hold the same number'],correct:2,
     baseline:{mode:'scale',basis:'mol',nmol:1},change:{basis:'g',gmass:20},changeText:'Every pan set to 20 g',
     explain:{bio:'20 g ÷ 12.01 g/mol = 1.67 mol of carbon, but only 20 g ÷ 197 g/mol = 0.10 mol of gold. Lighter particles means more of them fit in the same mass. Sugar molecules are the heaviest of all (342 g/mol), so the big pile has the fewest.'}},
    {lvl:'bio',instant:true,q:'How many water molecules are in 18.0 g of water?',choices:['18','6.02 × 10²³','18 × 6.02 × 10²³','6.02 × 10²³ ÷ 18'],correct:1,
     explain:{bio:'18.0 g ÷ 18.02 g/mol = 1.00 mol, and 1 mol = 6.02 × 10²³ molecules. Set the road map to 18 g of H₂O to check.'}},
    {lvl:'bio',instant:true,q:'About how much space does one mole of water molecules take up?',choices:['About 18 mL, one big gulp','About 1 liter','About a bathtub','About an Olympic swimming pool'],correct:0,
     explain:{bio:'18.0 g of liquid water at 1.00 g/mL is 18 mL. The number of molecules is enormous, but each molecule is tiny, about 0.28 nm across.'}},
    {lvl:'honors',instant:true,q:'What is the mass of 0.250 mol of CO₂?',choices:['176 g','11.0 g','0.00568 g','44.0 g'],correct:1,
     explain:{honors:'Moles → grams: multiply by the molar mass. 0.250 mol × 44.01 g/mol = 11.0 g. Dividing (0.250 ÷ 44.01) is the most common setup mistake; the units would not cancel.'}},
    {lvl:'honors',q:'1.00 mol of O₂ at STP fills 22.4 L. You switch the gas to 1.00 mol of CO₂, which is heavier. Its volume at STP is…',choices:['larger, because CO₂ molecules are bigger','smaller, because CO₂ is heavier','still 22.4 L'],correct:2,
     baseline:{mode:'map',sub:'O2',from:'mol',to:'L',amt:1},change:{sub:'CO2'},changeText:'Gas switched to CO₂',
     explain:{honors:'In a gas the molecules are far apart, so their own size barely matters. Equal moles of ideal gases at the same temperature and pressure fill equal volumes (Avogadro’s law): 22.4 L at STP.'}},
    {lvl:'honors',instant:true,q:'How many hydrogen atoms are in 1.00 mol of H₂O?',choices:['6.02 × 10²³','1.20 × 10²⁴','3.01 × 10²³','2'],correct:1,
     explain:{honors:'1.00 mol of H₂O is 6.02 × 10²³ molecules, and each has 2 H atoms: 2 × 6.02 × 10²³ = 1.20 × 10²⁴ H atoms. Watch whether a question asks for molecules or atoms.'}},
    {lvl:'ap',instant:true,q:'What is the mass of one water molecule?',choices:['18.0 g','2.99 × 10⁻²³ g','1.08 × 10²⁵ g','18.0 kg'],correct:1,
     explain:{ap:'18.02 g/mol ÷ 6.022 × 10²³ molecules/mol = 2.99 × 10⁻²³ g. One molecule has a mass of 18.02 u; a mole of them has a mass of 18.02 g.'}},
    {lvl:'ap',instant:true,q:'How many grams of NaCl are in 0.500 L of 0.200 M NaCl solution?',choices:['5.84 g','0.100 g','29.2 g','2.92 g'],correct:0,
     explain:{ap:'mol = M × L = 0.200 × 0.500 = 0.100 mol. 0.100 mol × 58.44 g/mol = 5.84 g.'}},
    {lvl:'ap',instant:true,q:'You convert 3.0 g of aluminum to moles (26.98 g/mol). How should you report the answer?',choices:['0.1112 mol','0.11 mol','0.111 mol','0.1 mol'],correct:1,
     explain:{ap:'3.0 g has two significant figures, and the molar mass has four. In multiplication and division the answer keeps the fewer: 3.0 ÷ 26.98 = 0.1112 → 0.11 mol.'}}
  ],
  lab:{bio:'<p><b>Question:</b> Does one mole of every substance have the same mass?</p><ol><li>Choose “One mole on a balance” and set every pan to 1.0 mol.</li><li>Pick each substance in “Look closely at” and record a trial.</li><li>Change to 2.0 mol and 0.5 mol for gold and record those too.</li><li>Plot moles (x) against mass (y) for gold on the Trials graph.</li></ol><p>What is the slope of your graph? Explain what it means.</p>',
       honors:'<p><b>Question:</b> How do you get from any amount to any other amount?</p><ol><li>On the road map, start with 50.0 g of CO₂ and convert to particles, then to liters at STP. Record each.</li><li>Do the same with 50.0 g of CH₄.</li><li>Press “New practice problem” five times. Solve each on paper before you press “Show the answer”.</li></ol><p>Explain why the same mass of two gases gives different volumes, but the same moles give the same volume.</p>',
       ap:'<p><b>Question:</b> How are the gram, the atomic mass unit and Avogadro’s number connected?</p><ol><li>Find the mass of one molecule of H₂O, CO₂ and C₁₂H₂₂O₁₁ (shown below the factor-label setup).</li><li>Make 0.250 L of 0.500 M CuSO₄ in “Liters of solution” and convert it to grams.</li></ol><p><b>Claim–evidence–reasoning:</b> Explain why the mass of one particle in u equals the mass of one mole in grams.</p>'},
  terms:[{t:'Mole (mol)',d:'6.022 × 10²³ particles: a counting unit, like a dozen.'},{t:'Avogadro’s number',d:'6.022 × 10²³, the number of particles in one mole.'},{t:'Molar mass',d:'The mass of one mole of a substance, in g/mol. Add up the atomic masses in the formula.'},
    {t:'Particle',d:'An atom, molecule or formula unit, depending on the substance.'},{lvl:'honors',t:'STP',d:'Standard temperature and pressure: 0 °C and 1 atm.'},{lvl:'honors',t:'Molar volume',d:'22.4 L: the volume of one mole of any ideal gas at STP.'},
    {lvl:'honors',t:'Formula unit',d:'The smallest repeating unit of an ionic compound, like one Na⁺ and one Cl⁻ in NaCl.'},{lvl:'ap',t:'Molarity (M)',d:'Moles of solute per liter of solution.'},{lvl:'ap',t:'Atomic mass unit (u)',d:'1/12 the mass of a carbon-12 atom; 6.022 × 10²³ u = 1 g.'}],
  about:'<p>Every value is computed from the moles: grams = mol × molar mass, particles = mol × 6.022 × 10²³, liters of gas at STP = mol × 22.4 L/mol, liters of solution = mol ÷ molarity. Molar masses add ChemLab’s atomic masses. Answers are shown to three significant figures.</p><p>Simplifications: gases are treated as ideal (real gases at STP differ from 22.4 L by under 1%). The balance samples are drawn as cubes with their real volume from their density (water as a liquid). The “how big” facts use a 2.50 g, 1.52 mm penny, 0.5 mm sand grains packed at 64% over the 9.8 million km² of the United States, and a 13.8 billion year old universe. The particle zoom shows the atoms in each formula, not their real arrangement.</p>',
  initVis(sim){},
  onClick(sim,x,y){if(sim.p.mode!=='map')return;for(const k of Object.keys(POS)){if(!atLeast(NODES[k].lvl))continue;const [cx,cy]=POS[k];if(Math.abs(x-cx)<110&&Math.abs(y-cy)<55){BioLab.setValues(sim,{to:k});return;}}},
  draw(sim,ctx,vdt,k,t){ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,500);const p=sim.p;
    if(p.mode==='scale')drawScale(sim,ctx,k,t);else if(p.mode==='big')drawBig(sim,ctx,k,t);else drawMap(sim,ctx,k,t);},
  thumbSetup(sim){}
};
function panMol(sim,f){return sim.p.basis==='mol'?sim.p.nmol:sim.p.gmass/CL.molarMass(f);}
function panMass(sim,f){return panMol(sim,f)*CL.molarMass(f);}
function arrow(ctx,x1,y1,x2,y2,c,w){const a=Math.atan2(y2-y1,x2-x1),h=Math.max(10,w*3);ctx.strokeStyle=c;ctx.fillStyle=c;ctx.lineWidth=w;ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2-Math.cos(a)*h*0.8,y2-Math.sin(a)*h*0.8);ctx.stroke();ctx.beginPath();ctx.moveTo(x2,y2);ctx.lineTo(x2-Math.cos(a-0.45)*h,y2-Math.sin(a-0.45)*h);ctx.lineTo(x2-Math.cos(a+0.45)*h,y2-Math.sin(a+0.45)*h);ctx.closePath();ctx.fill();}
function drawMap(sim,ctx,k,t){const p=sim.p,s=sub(sim),hon=atLeast('honors'),ap=atLeast('ap'),P=path(sim),n=moles(sim);
  const W=Math.min(212,150+48*(k-1)),Hh=58*Math.max(1,k*0.82);
  txt(ctx,CL.fmt(s.f)+' · '+s.n+' · '+s.M.toFixed(2)+' g/mol',16,30,{s:14*k,w:700});
  const edges=[['g','mol'],['mol','n']];if(hon)edges.push(['mol','L']);if(ap)edges.push(['mol','V']);
  edges.forEach(([a,b])=>{const A=POS[a],B=POS[b];const act=P.find(e=>e[0]===a&&e[1]===b||e[0]===b&&e[1]===a);const dir=act?act:[a,b];
    const S=POS[dir[0]],E=POS[dir[1]];const dx=E[0]-S[0],dy=E[1]-S[1],L=Math.hypot(dx,dy),ux=dx/L,uy=dy/L;
    const cut=(ux,uy)=>Math.min((W/2+6)/Math.max(1e-9,Math.abs(ux)),(Hh/2+6)/Math.max(1e-9,Math.abs(uy)));const c1=cut(ux,uy);
    const x1=S[0]+ux*c1,y1=S[1]+uy*c1,x2=E[0]-ux*c1,y2=E[1]-uy*c1;
    arrow(ctx,x1,y1,x2,y2,act?PAL['s1']:PAL['line'],act?5:3);
    const f=factor(sim,dir[0],dir[1]);if(!f)return;const mx=(x1+x2)/2,my=(y1+y2)/2;
    const label=act?(sim.st.hide?'× ( ? )':f[0]):({g:'molar mass',n:'6.022 × 10²³',L:'22.4 L/mol',V:'molarity'})[a==='mol'?b:a];
    if(Math.abs(uy)<0.2)txt(ctx,label,mx,my-Hh/2-8,{s:12.5*k,w:act?700:500,a:'center',c:act?PAL['s1']:PAL['cv-soft']});
    else txt(ctx,label,mx+(dx<0?-14:14),my,{s:12.5*k,w:act?700:500,a:dx<0?'right':'left',b:'middle',c:act?PAL['s1']:PAL['cv-soft']});});
  Object.keys(POS).forEach(key=>{if(!atLeast(NODES[key].lvl))return;const [cx,cy]=POS[key],isF=key===p.from,isT=key===p.to,ok=okNode(sim,key);
    rr(ctx,cx-W/2,cy-Hh/2,W,Hh,12);ctx.fillStyle=key==='mol'?PAL['card2']:PAL['card'];ctx.fill();ctx.lineWidth=isF||isT?3.5:1.5;ctx.strokeStyle=isF?PAL['s2']:isT?PAL['s1']:PAL['line'];ctx.stroke();
    const head=NODES[key].t+(isF?' (start)':isT?' (find)':'');txt(ctx,head,cx,cy-Hh/2+15*k,{s:12*k,w:700,a:'center',c:isF?PAL['s2']:isT?PAL['s1']:PAL['cv-soft']});
    let v=ok?vtxt(sim,key,val(sim,key,n)):(key==='L'?'not a gas':s.f==='H2O'?'the solvent':'insoluble');if(sim.st.hide&&!isF)v='?';
    const u=ok&&!(sim.st.hide&&!isF)?(key==='n'?word(s):key==='V'?'L of '+p.molar.toFixed(2)+' M':NODES[key].u):'';
    txt(ctx,v+(u&&key!=='n'&&key!=='V'?' '+u:''),cx,cy+(key==='n'||key==='V'?2:8)*Math.max(1,k*0.8),{s:(ok?16:13)*k,w:800,a:'center',b:'middle',c:ok?PAL['cv-ink']:PAL['cv-soft']});
    if((key==='n'||key==='V')&&u)txt(ctx,u,cx,cy+Hh/2-8,{s:12*k,a:'center',c:PAL['cv-soft']});});
  if(!hon){drawZoom(ctx,s,120,375,82,t,k);txt(ctx,'Zoom in on '+CL.fmt(s.f)+':',225,325,{s:13*k,w:700});txt(ctx,'one mole is',225,325+22*k,{s:13*k,c:PAL['cv-soft']});
    txt(ctx,'602,214,076,000,000,000,000,000',225,325+52*k,{s:Math.min(16*k,24),w:800,c:PAL['s1']});txt(ctx,word(s)+' of '+s.n.split(' (')[0],225,325+78*k,{s:13*k,c:PAL['cv-soft']});}
  if(sim.st.hide)pill(ctx,'Practice: work it out, then “Show the answer”',400,478,PAL['s4'],'#fff',13*k);
  else if(hon)txt(ctx,'Click a box to convert to it',784,486,{s:12*k,a:'right',c:PAL['cv-soft']});}
function drawScale(sim,ctx,k,t){const p=sim.p,n=PANS.length,cw=800/n;
  txt(ctx,p.basis==='mol'?'Each pan: '+p.nmol.toFixed(1)+' mol = '+CL.sci(p.nmol*NA,'',3)+' particles':'Each pan: '+p.gmass+' g',400,34,{s:16*k,w:800,a:'center'});
  txt(ctx,p.basis==='mol'?'Same number of particles, different masses':'Same mass, different numbers of particles',400,34+24*k,{s:13*k,a:'center',c:PAL['cv-soft']});
  ctx.fillStyle=PAL['cv-bench'];ctx.fillRect(0,330,800,170);
  PANS.forEach((f,i)=>{const cx=cw*(i+0.5),s=SUBS[f],mol=panMol(sim,f),mass=mol*CL.molarMass(f),sel=p.pick===f;
    ctx.fillStyle='#59616b';rr(ctx,cx-62,300,124,40,8);ctx.fill();ctx.fillStyle='#8b939c';ctx.fillRect(cx-5,286,10,16);ctx.fillStyle='#b8bec6';ctx.beginPath();ctx.ellipse(cx,286,56,6,0,0,6.29);ctx.fill();
    const str=mass>=100?mass.toFixed(1)+' g':mass.toFixed(2)+' g';const fs=Math.min(13*k,19);ctx.font='700 '+fs+'px '+FONT;const lw=Math.min(116,ctx.measureText(str).width+12);ctx.fillStyle='#16241b';rr(ctx,cx-lw/2,322-fs/2-3,lw,fs+8,4);ctx.fill();
    txt(ctx,str,cx,323,{s:fs,w:700,c:'#9cf59c',a:'center',b:'middle'});
    const V=mass/(s.d||1);if(f==='H2O'){const side=clamp(15*Math.cbrt(V*1.6),14,120);const bw=side*0.9,bh=side*1.25;
      ctx.fillStyle=PAL['cv-water'];ctx.globalAlpha=0.5;ctx.fillRect(cx-bw/2,282-bh,bw,bh);ctx.globalAlpha=1;ctx.fillStyle='#5aa9e6';ctx.fillRect(cx-bw/2,282-bh*0.62,bw,bh*0.62);ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(cx-bw/2,282-bh);ctx.lineTo(cx-bw/2,282);ctx.lineTo(cx+bw/2,282);ctx.lineTo(cx+bw/2,282-bh);ctx.stroke();}
    else{const side=clamp(15*Math.cbrt(V),6,140);const col=PCOL[f];ctx.fillStyle=col;ctx.strokeStyle=CL.shade(col,-0.45);ctx.lineWidth=1.5;ctx.fillRect(cx-side/2,282-side,side,side);ctx.strokeRect(cx-side/2,282-side,side,side);
      ctx.fillStyle=CL.shade(col,0.25);ctx.beginPath();ctx.moveTo(cx-side/2,282-side);ctx.lineTo(cx-side/2+side*0.25,282-side*1.2);ctx.lineTo(cx+side/2+side*0.25,282-side*1.2);ctx.lineTo(cx+side/2,282-side);ctx.closePath();ctx.fill();ctx.stroke();}
    if(sel){ctx.strokeStyle=PAL['s1'];ctx.lineWidth=3;rr(ctx,cx-cw/2+5,96+12*k,cw-10,392-12*k,12);ctx.stroke();}
    const y0=362;txt(ctx,CL.fmt(f),cx,y0,{s:14*k,w:800,a:'center',c:PAL['cv-ink']});
    txt(ctx,CL.molarMass(f).toFixed(1)+' g/mol',cx,y0+22*k,{s:12*k,a:'center',c:PAL['cv-ink']});
    txt(ctx,CL.sci(mol*NA,'',3),cx,y0+44*k,{s:12*k,w:700,a:'center',c:PAL['cv-ink']});
    txt(ctx,WORD[s.t],cx,y0+64*k,{s:12*k,a:'center',c:PAL['cv-ink']});});}
function drawBig(sim,ctx,k,t){const b=BIG[sim.p.obj];const X=e=>60+e/24*680,y=120;
  txt(ctx,'Counting numbers on a power-of-ten ladder',400,30,{s:14*k,w:700,a:'center'});
  ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(X(0),y);ctx.lineTo(X(24),y);ctx.stroke();
  for(let e=0;e<=24;e+=3){ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(X(e),y-6);ctx.lineTo(X(e),y+6);ctx.stroke();}
  txt(ctx,'10⁰',X(0),y+24*k,{s:12*k,a:'center',c:PAL['cv-soft']});txt(ctx,'10¹²',X(12),y+24*k,{s:12*k,a:'center',c:PAL['cv-soft']});
  LADDER.forEach(([v,l,num,up],i)=>{const x=X(Math.log10(v)),mole=i===LADDER.length-1;ctx.fillStyle=mole?PAL['s1']:PAL['s2'];ctx.beginPath();ctx.arc(x,y,mole?9:6,0,6.29);ctx.fill();
    const a=mole?'right':i===0?'left':'center',xx=mole?x+8:i===0?x-6:x;
    if(up){txt(ctx,l,xx,y-38*Math.max(1,k*0.8),{s:12*k,w:600,a});txt(ctx,num,xx,y-18,{s:12*k,a,c:PAL['cv-soft']});}
    else{txt(ctx,l,xx,y+48*Math.max(1,k*0.8),{s:(mole?14:12)*k,w:mole?800:600,a,c:mole?PAL['s1']:PAL['cv-ink']});txt(ctx,num,xx,y+48*Math.max(1,k*0.8)+18*k,{s:12*k,a,c:PAL['cv-soft']});}});
  const top=250;rr(ctx,16,top,240,230,12);ctx.fillStyle=PAL['card'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1.5;ctx.stroke();
  rr(ctx,272,top,512,230,12);ctx.fillStyle=PAL['card'];ctx.fill();ctx.strokeStyle=PAL['s1'];ctx.lineWidth=2.5;ctx.stroke();
  drawIcon(ctx,b.icon,136,top+80,t);txt(ctx,b.one[0],136,top+165,{s:14*k,w:700,a:'center'});txt(ctx,b.one[1],136,top+165+20*k,{s:12*k,a:'center',c:PAL['cv-soft']});
  txt(ctx,'× 6.022 × 10²³ =',290,top+34,{s:15*k,w:800,c:PAL['s1']});
  b.mole.forEach((l,i)=>txt(ctx,l,290,top+80+i*30*Math.max(1,k*0.85),{s:(i===0?17:14)*k,w:i===0?800:500}));
  if(b.icon==='water'&&k<1.3){const vx=700,vy=top+200,side=11*Math.cbrt(18);ctx.fillStyle='#5aa9e6';ctx.fillRect(vx-side/2,vy-side,side,side);ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=2;ctx.strokeRect(vx-side/2,vy-side*1.3,side,side*1.3);
    if(k<1.3)txt(ctx,'18 mL, to scale with the balance view',vx-side/2-8,vy-6,{s:12*k,a:'right',c:PAL['cv-soft']});}}
function drawIcon(ctx,ic,x,y,t){if(ic==='water'){CL.drawAtom(ctx,x,y,30,'O',{label:''});CL.drawAtom(ctx,x-30,y+24,18,'H',{label:''});CL.drawAtom(ctx,x+30,y+24,18,'H',{label:''});CL.drawAtom(ctx,x,y,30,'O',{label:''});return;}
  if(ic==='penny'){const g=ctx.createRadialGradient(x-12,y-12,6,x,y,44);g.addColorStop(0,'#f1b27a');g.addColorStop(1,'#a85a2a');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,44,0,6.29);ctx.fill();ctx.strokeStyle='#7a3f1c';ctx.lineWidth=3;ctx.stroke();txt(ctx,'1¢',x,y+2,{s:26,w:800,a:'center',b:'middle',c:'#5a2c10'});return;}
  if(ic==='sand'){const r=rng(3);for(let i=0;i<26;i++){ctx.fillStyle=['#d9b26a','#c9a05a','#e6c88a','#b98d4a'][i%4];ctx.beginPath();ctx.ellipse(x-40+r()*80,y-30+r()*60,4+r()*4,3+r()*3,r()*3,0,6.29);ctx.fill();}return;}
  if(ic==='clock'){ctx.fillStyle='#f4f4f0';ctx.strokeStyle='#3d4148';ctx.lineWidth=4;ctx.beginPath();ctx.arc(x,y,44,0,6.29);ctx.fill();ctx.stroke();ctx.strokeStyle='#3d4148';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y-30);ctx.moveTo(x,y);ctx.lineTo(x+20,y+8);ctx.stroke();
    const a=(t%60)/60*6.283;ctx.strokeStyle='#c62828';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+Math.sin(a)*38,y-Math.cos(a)*38);ctx.stroke();return;}
  ctx.fillStyle='#7fae7a';rr(ctx,x-60,y-28,120,56,6);ctx.fill();ctx.strokeStyle='#3f6b3a';ctx.lineWidth=2;ctx.stroke();ctx.fillStyle='#cfe3c8';ctx.beginPath();ctx.ellipse(x,y,18,22,0,0,6.29);ctx.fill();txt(ctx,'$1',x,y+2,{s:20,w:800,a:'center',b:'middle',c:'#2f5a2a'});}
BioLab.register(SIM);
})();
