(function(){
'use strict';
const {clamp,lerp,rng,randn,rr,txt,pill,atLeast,PAL,FONT,RM,axes,legend,serColor,lvText}=BioLab.h;
const CL=window.ChemLab;
const F=CL.K.F||96485,RT_F=8.314*298.15/96485;   // RT/F at 25 °C, in V
const RLOAD=50;                                   // ohms: small bulb plus the cell's own resistance
const RELEC=2;                                    // ohms in electrolysis mode
const VOL=0.050;                                  // L of solution in each beaker
const M0=5.000;                                   // g, starting mass of each electrode strip
/* ---------- data: standard reduction potentials from ChemLab.E0 ---------- */
const E0of=s=>{const e=CL.E0.find(x=>x.metal===s);return e?e:{E:NaN,q:2};};
const MET={};
[['Zn','zinc','Zn(NO₃)₂','#9aa6b2',null],['Cu','copper','CuSO₄','#c87a3c','#4a8fd6'],['Ag','silver','AgNO₃','#d5d9de',null],['Mg','magnesium','Mg(NO₃)₂','#c6cad0',null],
 ['Fe','iron','FeSO₄','#7d8086','#a9cf8f'],['Pb','lead','Pb(NO₃)₂','#6b7079',null],['Ni','nickel','NiSO₄','#a7a99c','#52b07e'],['Al','aluminum','Al(NO₃)₃','#c2c7cd',null]]
 .forEach(([s,n,salt,col,sol])=>{const e=E0of(s),el=CL.el(s);MET[s]={s,n,salt,col,sol,E:e.E,q:e.q,M:el.mass,ion:s+(e.q===1?'⁺':CL.sup(e.q)+'⁺'),anion:salt.includes('SO')?'SO₄²⁻':'NO₃⁻'};});
const MOPT=Object.keys(MET).map(s=>({v:s,l:MET[s].n[0].toUpperCase()+MET[s].n.slice(1)+' in '+MET[s].salt+' (E° = '+(MET[s].E>0?'+':'−')+Math.abs(MET[s].E).toFixed(2)+' V)'}));
const CONC=[1,0.1,0.01,0.001];
const SETS={A:['Cu','Zn','Pb','Mg'],B:['Cu','Zn','Fe','Ag'],C:['Cu','Ni','Al','Ag']};
const PAIRS=[[0,1],[0,2],[0,3],[1,2],[1,3],[2,3]];
const gcd=(a,b)=>b?gcd(b,a%b):a,lcm=(a,b)=>a*b/gcd(a,b);
const sgn=v=>(v>=0?'+':'−')+Math.abs(v).toFixed(2);
const noise=(set,i)=>{const h=(set.charCodeAt(0)*31+i*17)%9;return (h-4)*0.005;};

/* ---------- electrochemistry ---------- */
function eHalf(m,c){return m.E+(RT_F/m.q)*Math.log(Math.max(c,1e-9));}   // Nernst for Mⁿ⁺ + ne⁻ → M
function calc(sim){const p=sim.p,st=sim.st,L=MET[p.left],R=MET[p.right];
  const EL=eHalf(L,st.cL),ER=eHalf(R,st.cR),E0L=L.E,E0R=R.E;
  const electro=p.mode==='electro';
  // spontaneous direction: higher potential is reduced
  let oxRight=ER<EL||(ER===EL&&electro);if(electro)oxRight=!(ER<EL)||ER===EL; // electrolysis forces the reverse
  if(electro&&ER!==EL)oxRight=ER>EL;
  const an=oxRight?'R':'L',ca=oxRight?'L':'R',Mx=an==='L'?L:R,Mr=ca==='L'?L:R;
  const Ecell=Math.abs(ER-EL),E0=Math.abs(E0R-E0L),n=lcm(L.q,R.q);
  const closed=p.sw&&p.bridge;let I=0;
  if(p.mode==='cell')I=closed?Ecell/RLOAD:0;else if(electro)I=closed?+p.amps:0;
  const Vs=Ecell+I*RELEC;
  const volt=p.mode==='six'?NaN:!p.bridge?0:p.mode==='cell'?ER-EL:(closed?(an==='R'?Vs:-Vs):0);
  return {L,R,EL,ER,E0L,E0R,an,ca,Mx,Mr,Ecell,E0,n,I,Vs,volt,electro,closed};}
function sixReading(p){const S=SETS[p.set]||SETS.A,[i,j]=PAIRS[+p.pair]||PAIRS[0];return MET[S[i]].E-MET[S[j]].E+noise(p.set,+p.pair);}
function overall(c){const a=c.n/c.Mx.q,b=c.n/c.Mr.q,co=x=>x===1?'':x+' ';
  return co(a)+c.Mx.s+'(s) + '+co(b)+c.Mr.ion+'(aq) → '+co(a)+c.Mx.ion+'(aq) + '+co(b)+c.Mr.s+'(s)';}
function notation(c,short){const a=c.Mx,b=c.Mr;return short?a.s+' | '+a.ion+' ‖ '+b.ion+' | '+b.s:a.s+'(s) | '+a.ion+'(aq) ‖ '+b.ion+'(aq) | '+b.s+'(s)';}

/* ---------- mode-aware UI ---------- */
function syncMode(sim){if(!atLeast('ap')&&sim.p.mode==='electro')BioLab.setValues(sim,{mode:'cell'});if(!atLeast('honors')&&sim.p.mode==='six')BioLab.setValues(sim,{mode:'cell'});
  if(!sim.ui||!sim.ui.sec)return;const mode=sim.p.mode,d=sim.def;
  d.controls.forEach(c=>{if(!c.modes)return;const cid=d.id+'-'+c.id,e=document.getElementById(cid)||document.getElementById(cid+'-l');if(!e)return;const w=e.closest('.ctl');if(w)w.hidden=!atLeast(c.lvl)||!c.modes.includes(mode);});
  d.metrics.forEach(m=>{if(!m.modes)return;const t=sim.ui.tiles[m.id];if(!t)return;const w=t.num.closest('.tile');if(w)w.hidden=!atLeast(m.lvl)||!m.modes.includes(mode);});
  const btns=[...sim.ui.sec.querySelectorAll('.actions button')];d.actions.forEach(a=>{const b=btns.find(x=>x.textContent===a.label);if(b)b.hidden=!atLeast(a.lvl)||!a.modes.includes(mode);});
  sim.infoDirty=true;}
const resetConc=sim=>{BioLab.reset(sim);};

/* ---------- geometry ---------- */
const BK={L:{x:78,y:232,w:204,h:162,ex:150},R:{x:518,y:232,w:204,h:162,ex:622}};
const EW=28,ETOP=146,EBOT=372,WY=116,VY=46,ZR=52,ZL=[62,108],ZRc=[738,108];
function wirePath(c){const a=c.an==='L'?BK.L.ex+EW/2:BK.R.ex+EW/2,b=c.an==='L'?BK.R.ex+EW/2:BK.L.ex+EW/2;return [[a,ETOP],[a,WY],[b,WY],[b,ETOP]];}
function pathLen(P){let L=0;for(let i=1;i<P.length;i++)L+=Math.hypot(P[i][0]-P[i-1][0],P[i][1]-P[i-1][1]);return L;}
function at(P,d){for(let i=1;i<P.length;i++){const l=Math.hypot(P[i][0]-P[i-1][0],P[i][1]-P[i-1][1]);if(d<=l){const f=l?d/l:0;return [lerp(P[i-1][0],P[i][0],f),lerp(P[i-1][1],P[i][1],f)];}d-=l;}return P[P.length-1];}
const BRIDGE=[[246,318],[246,196],[554,196],[554,318]];
function ionBall(ctx,x,y,r,col,lab,a){ctx.globalAlpha=a===undefined?1:a;const g=ctx.createRadialGradient(x-r*.35,y-r*.35,r*.15,x,y,r);g.addColorStop(0,'#ffffff');g.addColorStop(.3,col);g.addColorStop(1,CL.shade(col,-0.4));ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,6.29);ctx.fill();ctx.strokeStyle=CL.shade(col,-0.55);ctx.lineWidth=1;ctx.stroke();
  if(lab){ctx.font='800 '+(lab.length>1?9:11)+'px '+FONT;ctx.fillStyle=CL.inkOn(col);ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(lab,x,y+0.5);}ctx.globalAlpha=1;}
const chg=q=>q===1?'+':q+'+';
function strip(ctx,x,m,massFrac){const w=EW*clamp(0.55+0.45*massFrac,0.4,1.3);const g=ctx.createLinearGradient(x-w/2,0,x+w/2,0);g.addColorStop(0,CL.shade(m.col,-0.25));g.addColorStop(0.5,CL.shade(m.col,0.25));g.addColorStop(1,CL.shade(m.col,-0.3));
  ctx.fillStyle=g;ctx.fillRect(x+EW/2-w/2,ETOP,w,EBOT-ETOP);ctx.strokeStyle=CL.shade(m.col,-0.5);ctx.lineWidth=1;ctx.strokeRect(x+EW/2-w/2,ETOP,w,EBOT-ETOP);
  txt(ctx,m.s,x+EW/2,ETOP+26,{s:14,w:800,c:CL.inkOn(m.col),a:'center',b:'middle'});}

const GAL={
  id:'galvanic',hash:'galvanic',apUnit:15,order:2,tab:'Galvanic cells',kind:'Virtual lab',
  prereq:['activity','gibbs'],next:['ph'],
  card:'Build a battery from two metals, watch electrons flow and electrodes gain and lose mass, and rank metals in the six-way cell lab.',
  title:'Galvanic cells: electricity from redox',
  lede:{bio:'Put two different metals in solutions of their own ions and connect them. One metal gives up electrons, the other takes them, and the voltmeter shows how hard the electrons are pushed.',
        honors:'Name the anode and cathode, follow electrons through the wire and ions through the salt bridge, write cell notation, and rank metals with the six-way cell.',
        ap:'Calculate E°cell from standard reduction potentials, change concentrations with the Nernst equation, connect E to ΔG° and K, and plate metal by electrolysis.'},
  scale:{bio:'Bench scale: two 50 mL beakers of 1.0 M solution, metal strips about 5 g each, and a small bulb. Time runs 5 minutes per second.',
         ap:'Bench scale: 50.0 mL of each solution, 5.000 g strips, 50 Ω load. Time runs 5 min per second, so mass changes of milligrams show up. 25 °C throughout.'},
  timeScale:5,dtMax:0.05,prewarm:0,sampleDt:0.5,window:120,unit:'min',chChange:2,chReveal:120,
  controls:[
    {id:'mode',label:'Setup',type:'seg',def:'cell',lvl:'bio',options:[{v:'cell',l:'Galvanic cell'},{v:'six',l:'Six-way lab',lvl:'honors'},{v:'electro',l:'Electrolysis',lvl:'ap'}],onChange(sim){syncMode(sim);BioLab.reset(sim);}},
    {id:'left',label:'Left half-cell',type:'select',def:'Zn',lvl:'bio',modes:['cell','electro'],options:MOPT,onChange:resetConc},
    {id:'right',label:'Right half-cell',type:'select',def:'Cu',lvl:'bio',modes:['cell','electro'],options:MOPT,onChange:resetConc},
    {id:'sw',label:'Close the switch',type:'toggle',def:true,lvl:'bio',modes:['cell','electro'],help:'Lets current flow through the bulb (or from the power supply).'},
    {id:'bridge',label:'Salt bridge in place',type:'toggle',def:true,lvl:'bio',modes:['cell','electro']},
    {id:'cL',label:'Left ion concentration',type:'select',def:1,lvl:'ap',modes:['cell','electro'],options:CONC.map(c=>({v:c,l:c>=1?'1.0 M':c+' M'})),onChange:resetConc},
    {id:'cR',label:'Right ion concentration',type:'select',def:1,lvl:'ap',modes:['cell','electro'],options:CONC.map(c=>({v:c,l:c>=1?'1.0 M':c+' M'})),onChange:resetConc},
    {id:'amps',label:'Current from the power supply',type:'range',min:0.1,max:2,step:0.1,def:0.5,unit:' A',lvl:'ap',modes:['electro']},
    {id:'set',label:'Metals in the well plate',type:'select',def:'A',lvl:'honors',modes:['six'],options:Object.keys(SETS).map(k=>({v:k,l:SETS[k].join(', ')})),onChange(sim){sim.st.meas={};sim.infoDirty=true;}},
    {id:'pair',label:'Voltmeter leads on',type:'select',def:0,lvl:'honors',modes:['six'],options:PAIRS.map((q,i)=>({v:i,l:'Well '+(q[0]+1)+' (red) and well '+(q[1]+1)+' (black)'}))}
  ],
  actions:[
    {id:'record',label:'Record this reading',lvl:'honors',primary:true,modes:['six'],run(sim){sim.st.meas[sim.p.set+'|'+sim.p.pair]=sixReading(sim.p);sim.infoDirty=true;}},
    {id:'allsix',label:'Measure all six pairs',lvl:'honors',modes:['six'],run(sim){PAIRS.forEach((q,i)=>{sim.st.meas[sim.p.set+'|'+i]=sixReading(Object.assign({},sim.p,{pair:i}));});sim.infoDirty=true;}},
    {id:'fresh',label:'New strips and solutions',lvl:'bio',modes:['cell','electro'],run(sim){BioLab.reset(sim);}}
  ],
  init(sim){const p=sim.p;return {cL:+p.cL,cR:+p.cR,mL:M0,mR:M0,Q:0,plated:0,meas:(sim.st&&sim.st.meas)||{}};},
  step(sim,dt){const st=sim.st,p=sim.p;if(p.mode==='six')return;const c=calc(sim);if(c.I<=0)return;
    const mol=c.I*dt*60/F;                           // mol of electrons in this step (dt in minutes)
    const ox=c.an,red=c.ca,Mx=c.Mx,Mr=c.Mr;
    const kx=ox==='L'?'L':'R',kr=red==='L'?'L':'R';
    const avail=st['c'+kr]*VOL*Mr.q;                  // mol e⁻ the cathode solution can still accept
    const m=Math.min(mol,Math.max(0,avail-1e-9));
    st['m'+kx]=Math.max(0,st['m'+kx]-m/Mx.q*Mx.M);st['m'+kr]+=m/Mr.q*Mr.M;
    st['c'+kx]+=m/Mx.q/VOL;st['c'+kr]=Math.max(1e-9,st['c'+kr]-m/Mr.q/VOL);
    st.Q+=m*F;st.plated+=m/Mr.q*Mr.M;},
  metrics:[
    {id:'volt',label:'Voltmeter reading',unit:'V',lvl:'bio',min:-3,max:3,d:2,get:s=>s.p.mode==='six'?sixReading(s.p):calc(s).volt},
    {id:'anode',label:'Anode (oxidation)',unit:'',lvl:'bio',text:true,modes:['cell','electro'],get:s=>{const c=calc(s);return c.Ecell<1e-6&&!c.electro?'None: same metal':c.Mx.n[0].toUpperCase()+c.Mx.n.slice(1)+(c.electro?' (+)':' (−)');}},
    {id:'flow',label:'Electrons flow',unit:'',lvl:'bio',text:true,modes:['cell','electro'],get:s=>{const c=calc(s);return c.I>0?c.Mx.s+' → '+c.Mr.s+' through the wire':'No current';}},
    {id:'mA',label:'Current',unit:'mA',lvl:'honors',min:0,max:null,d:1,modes:['cell','electro'],get:s=>1000*calc(s).I},
    {id:'mL',label:'Left electrode mass',unit:'g',lvl:'honors',min:0,max:null,d:3,modes:['cell','electro'],get:s=>s.st.mL},
    {id:'mR',label:'Right electrode mass',unit:'g',lvl:'honors',min:0,max:null,d:3,modes:['cell','electro'],get:s=>s.st.mR},
    {id:'E0',label:'E°cell (standard)',unit:'V',lvl:'ap',min:0,max:4,d:2,modes:['cell'],get:s=>calc(s).E0},
    {id:'E',label:'Ecell (Nernst, now)',unit:'V',lvl:'ap',min:0,max:4,d:3,modes:['cell','electro'],get:s=>calc(s).Ecell},
    {id:'dG',label:'ΔG° = −nFE°',unit:'kJ/mol',lvl:'ap',min:-1500,max:0,d:0,modes:['cell'],get:s=>{const c=calc(s);return -c.n*F*c.E0/1000;}},
    {id:'K',label:'Equilibrium constant K',unit:'',lvl:'ap',text:true,modes:['cell'],get:s=>{const c=calc(s),lk=c.n*c.E0/(RT_F*Math.LN10);if(lk<0.01)return '1';return lk>300?'> 10³⁰⁰':'10'+CL.sup(String(Math.round(lk)))+' (about)';}},
    {id:'plated',label:'Metal deposited on the cathode',unit:'g',lvl:'ap',min:0,max:null,d:3,modes:['electro','cell'],get:s=>s.st.plated}
  ],
  graphs:[{id:'mass',label:'Electrode masses',lvl:'honors',lines:['mL','mR']},{id:'volt',label:'Voltmeter reading',lvl:'bio',lines:['volt']},{id:'mA',label:'Current',lvl:'honors',lines:['mA']},{id:'E',label:'Ecell over time',lvl:'ap',lines:['E']}],
  defaultGraph:'volt',
  infoPanel(sim){const p=sim.p,st=sim.st,hon=atLeast('honors'),ap=atLeast('ap');
    if(p.mode==='six'){const S=SETS[p.set];let h='<h3>Six-way cell readings</h3><div class="tbl-wrap"><table><thead><tr><th>Red lead</th><th>Black lead</th><th>Reading (V)</th><th>Cathode</th></tr></thead><tbody>';
      const rel={};rel[S[0]]=0;let changed=true;
      PAIRS.forEach((q,i)=>{const r=st.meas[p.set+'|'+i];h+=`<tr${+p.pair===i?' style="font-weight:700"':''}><td>${q[0]+1}: ${S[q[0]]}</td><td>${q[1]+1}: ${S[q[1]]}</td><td>${r===undefined?'—':sgn(r)}</td><td>${r===undefined?'—':(r>0?S[q[0]]:S[q[1]])}</td></tr>`;});
      h+='</tbody></table></div>';
      while(changed){changed=false;PAIRS.forEach((q,i)=>{const r=st.meas[p.set+'|'+i];if(r===undefined)return;const a=S[q[0]],b=S[q[1]];if(rel[a]!==undefined&&rel[b]===undefined){rel[b]=rel[a]-r;changed=true;}else if(rel[b]!==undefined&&rel[a]===undefined){rel[a]=rel[b]+r;changed=true;}});}
      if(Object.keys(rel).length===4){const order=S.slice().sort((a,b)=>rel[b]-rel[a]);
        h+=`<p><b>Your ranking</b> (easiest to reduce first): ${order.map(m=>m+' ('+sgn(rel[m]-rel[S[0]])+' V vs Cu)').join(', ')}.</p>`;
        if(hon)h+=`<p class="help">Standard reduction potentials: ${order.map(m=>m+' '+sgn(MET[m].E)).join(', ')}. Your numbers are relative to copper, so add +0.34 V to compare. The most active metal, ${order[3]}, is the anode in every cell it is part of.</p>`;}
      else h+='<p class="help">Measure enough pairs to connect all four metals, and a ranking appears here.</p>';
      return h;}
    const c=calc(sim);if(c.Ecell<1e-6&&p.mode==='cell')return '<h3>Half-reactions</h3><p>Both half-cells are identical, so neither metal pushes electrons harder than the other. E = 0 V and nothing happens. Pick two different metals'+(ap?', or change one concentration to make a concentration cell.':'.')+'</p>';
    const ox=c.Mx,re=c.Mr;let h=`<h3>Half-reactions</h3><div class="tbl-wrap"><table><thead><tr><th></th><th>Half-reaction</th>${hon?'<th>E° (V)</th>':''}</tr></thead><tbody>
      <tr><td>Anode (oxidation)${c.electro?' +':' −'}</td><td>${ox.s}(s) → ${ox.ion}(aq) + ${ox.q===1?'':ox.q}e⁻</td>${hon?`<td>${sgn(ox.E)} (as a reduction)</td>`:''}</tr>
      <tr><td>Cathode (reduction)${c.electro?' −':' +'}</td><td>${re.ion}(aq) + ${re.q===1?'':re.q}e⁻ → ${re.s}(s)</td>${hon?`<td>${sgn(re.E)}</td>`:''}</tr></tbody></table></div>`;
    if(hon)h+=`<p><b>Overall:</b> ${overall(c)} (n = ${c.n} mol e⁻)</p><p><b>Cell notation:</b> ${notation(c)}</p>`;
    if(c.electro)h+=`<p>The power supply forces this non-spontaneous reaction. It must push at least ${c.Ecell.toFixed(2)} V; it is supplying ${c.Vs.toFixed(2)} V at ${(+p.amps).toFixed(1)} A.</p>`+(ap?`<p class="help">Mass plated = I·t·M / (nF) = ${(+p.amps).toFixed(2)} A × ${(sim.t*60).toFixed(0)} s × ${re.M.toFixed(2)} g/mol ÷ (${re.q} × 96,485) = ${st.plated.toFixed(3)} g of ${re.s}.</p>`:'');
    else if(ap){const a=c.n/ox.q,b=c.n/re.q,cx=c.an==='L'?st.cL:st.cR,cr=c.ca==='L'?st.cL:st.cR,Q=Math.pow(cx,a)/Math.pow(cr,b);
      h+=`<p><b>E°cell</b> = E°(cathode) − E°(anode) = ${sgn(re.E)} − (${sgn(ox.E)}) = ${c.E0.toFixed(2)} V.</p><p><b>Nernst:</b> E = E° − (0.0592/n) log Q = ${c.E0.toFixed(2)} − (0.0592/${c.n}) log(${Q.toPrecision(2)}) = ${c.Ecell.toFixed(3)} V, with Q = [${ox.ion}]${a>1?CL.sup(a):''}/[${re.ion}]${b>1?CL.sup(b):''}.</p><p class="help">ΔG° = −nFE° = −${c.n} × 96,485 × ${c.E0.toFixed(2)} = ${(-c.n*F*c.E0/1000).toFixed(0)} kJ/mol. A positive E° means a negative ΔG°: the cell reaction is spontaneous.</p>`;}
    return h;},
  narrate(sim){const p=sim.p,st=sim.st,hon=atLeast('honors');
    if(p.mode==='six'){const S=SETS[p.set],[i,j]=PAIRS[+p.pair],r=sixReading(p);return 'The voltmeter’s red lead is on '+MET[S[i]].n+' and the black lead on '+MET[S[j]].n+'. It reads <b>'+sgn(r)+' V</b>, so <b>'+(r>0?MET[S[i]].n:MET[S[j]].n)+' is the cathode</b> here'+(r<0?' (a negative reading means the red lead is on the anode)':'')+'. The KNO₃ paper in the middle is the salt bridge for every pair.';}
    const c=calc(sim);
    if(!p.bridge)return '<b>The salt bridge is out</b>, so the circuit is broken. Electrons cannot leave the anode, because positive charge would pile up in its beaker with no ions to balance it. The meter reads 0 V and the bulb is dark.';
    if(c.electro){if(!p.sw)return 'The power supply is off. Close the switch to force current backward through the cell.';
      return 'The power supply <b>forces electrons into the '+c.Mr.n+'</b>, so '+c.Mr.ion+' ions plate out as '+c.Mr.n+' metal ('+st.plated.toFixed(3)+' g so far), while the '+c.Mx.n+' dissolves. This is the reverse of the spontaneous reaction, so it needs at least '+c.Ecell.toFixed(2)+' V.';}
    if(c.Ecell<1e-6)return 'Both half-cells are the same, so neither metal pulls electrons harder. The meter reads 0 V.';
    let t='<b>'+c.Mx.n[0].toUpperCase()+c.Mx.n.slice(1)+' is the anode</b>: its atoms give up electrons and dissolve as '+c.Mx.ion+'. The electrons travel through the wire to the '+c.Mr.n+', where '+c.Mr.ion+' ions pick them up and plate out as metal. ';
    t+=p.sw?(hon?'The anode has lost '+(M0-(c.an==='L'?st.mL:st.mR)).toFixed(3)+' g so far.':'The anode slowly loses mass and the cathode gains it.'):'The switch is open, so no current flows yet, but the voltmeter still reads the push: '+Math.abs(c.volt).toFixed(2)+' V.';
    if(c.volt<0)t+=' The reading is negative because the red lead is on the anode.';
    return t;},
  tour:[
    {title:'Two half-cells',text:{bio:'Left: a zinc strip in zinc nitrate solution. Right: a copper strip in blue copper(II) sulfate. Each beaker is a half-cell.',honors:'Each half-cell holds a metal and its own ions: Zn | Zn²⁺ and Cu | Cu²⁺. They are joined by a wire on top and a salt bridge between the beakers.'},focus:[[BK.L.x-8,BK.L.y-90,BK.L.w+16,BK.L.h+120],[BK.R.x-8,BK.R.y-90,BK.R.w+16,BK.R.h+120]],pause:true,setup(sim){BioLab.setValues(sim,{mode:'cell',left:'Zn',right:'Cu',sw:true,bridge:true,cL:1,cR:1});BioLab.reset(sim);}},
    {title:'The anode: zinc is oxidized',text:'Zoom in on the zinc surface. Zinc atoms give up two electrons each and leave as Zn²⁺ ions: Zn → Zn²⁺ + 2e⁻. That is oxidation. The electrons stay in the metal and head for the wire.',focus:[[ZL[0]-ZR-6,ZL[1]-ZR-6,2*ZR+12,2*ZR+12],[BK.L.ex-10,ETOP-10,EW+20,EBOT-ETOP+20]],speed:0.5},
    {title:'Electrons flow through the wire',text:'The yellow dots are electrons. They flow from the zinc, through the bulb, to the copper. Zinc gives up electrons more easily than copper, so the electrons flow this way on their own.',focus:[BK.L.ex-20,WY-30,BK.R.ex-BK.L.ex+70,60],speed:0.5},
    {title:'The cathode: copper ions are reduced',text:'At the copper surface, Cu²⁺ ions from the solution pick up two electrons and become copper atoms: Cu²⁺ + 2e⁻ → Cu. That is reduction. The copper strip gains mass and the blue color slowly fades.',focus:[[ZRc[0]-ZR-6,ZRc[1]-ZR-6,2*ZR+12,2*ZR+12],[BK.R.ex-10,ETOP-10,EW+20,EBOT-ETOP+20]],speed:0.5},
    {title:'The salt bridge keeps the charges balanced',text:'Zn²⁺ builds up on the left and Cu²⁺ is used up on the right. Ions from the KNO₃ salt bridge fix that: NO₃⁻ moves toward the zinc side and K⁺ moves toward the copper side. No electrons go through the bridge.',focus:[230,176,340,150],speed:0.5},
    {title:'The voltmeter',text:{bio:'The voltmeter measures how hard the electrons are pushed: about 1.10 V for zinc and copper. Different pairs of metals give different voltages.',honors:'E°cell = E°(cathode) − E°(anode) = +0.34 − (−0.76) = 1.10 V. The farther apart two metals are in the table of reduction potentials, the bigger the voltage.'},focus:[320,14,160,74],pause:true},
    {lvl:'honors',title:'Cell notation',text:'Chemists write this cell as Zn(s) | Zn²⁺(aq) ‖ Cu²⁺(aq) | Cu(s). The anode goes on the left, a single line marks a phase boundary, and the double line is the salt bridge.',focus:[284,232,232,90],pause:true},
    {lvl:'ap',title:'Concentration matters: the Nernst equation',text:'Dilute the Zn²⁺ to 0.010 M. Q = [Zn²⁺]/[Cu²⁺] drops to 0.010, so E = 1.10 − (0.0592/2) log(0.010) = 1.16 V. Less product makes the forward reaction push harder.',focus:[320,14,160,74],pause:true,setup(sim){BioLab.setValues(sim,{cL:0.01});}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{mode:'cell',left:'Zn',right:'Cu',sw:true,bridge:true,cL:1,cR:1});BioLab.reset(sim);syncMode(sim);},
  onChallenge(sim,ch,phase){if(ch&&ch.instant&&ch.set&&phase==='done'){BioLab.setValues(sim,ch.set);BioLab.reset(sim);syncMode(sim);}},
  challenges(sim){
    const Zn=MET.Zn,Cu=MET.Cu,Ag=MET.Ag,Mg=MET.Mg;const ZC=Cu.E-Zn.E,ZA=Ag.E-Zn.E;
    const loss=(0.022*0)+(ZC/RLOAD)*118*60/F/2*Zn.M,dG=-2*F*ZC/1000,ner=ZC-(RT_F/2)*Math.log(0.01),plate=0.5*3600/F/2*Zn.M;
    return [
    {lvl:'bio',q:'In the zinc–copper cell, which electrode loses mass while the bulb is lit?',choices:['The zinc','The copper','Neither: only electrons move'],correct:0,
     baseline:{mode:'cell',left:'Zn',right:'Cu',sw:false},change:{sw:true},changeText:'Switch closed: the bulb lights',watch:'mass',
     explain:{bio:'The zinc strip lost about '+loss.toFixed(3)+' g in two hours while the copper gained mass. Zinc atoms give up electrons and dissolve as Zn²⁺ ions. Copper ions take those electrons and plate out as copper metal.',honors:'Zn → Zn²⁺ + 2e⁻ at the anode; Cu²⁺ + 2e⁻ → Cu at the cathode. Watch the Electrode masses graph: one line falls as the other rises.'}},
    {lvl:'bio',q:'You swap the copper half-cell for silver in silver nitrate. What happens to the voltmeter reading?',choices:['It goes up','It goes down','It stays at 1.10 V'],correct:0,
     baseline:{mode:'cell',left:'Zn',right:'Cu',sw:true},change:{right:'Ag'},changeText:'Copper half-cell replaced with silver',watch:'volt',
     explain:{bio:'The reading rose from '+ZC.toFixed(2)+' V to '+ZA.toFixed(2)+' V. Silver ions pull on electrons more strongly than copper ions do, so the electrons get a bigger push from zinc to silver.',honors:'E°cell = +0.80 − (−0.76) = 1.56 V, compared with +0.34 − (−0.76) = 1.10 V for copper.'}},
    {lvl:'bio',q:'What happens if you lift the salt bridge out of the beakers?',choices:['Nothing, because electrons never go through the bridge anyway','The voltage drops to 0 and the bulb goes out','The bulb gets brighter'],correct:1,
     baseline:{mode:'cell',left:'Zn',right:'Cu',sw:true,bridge:true},change:{bridge:false},changeText:'Salt bridge removed',watch:'volt',
     explain:{bio:'The meter fell to 0 V and the current stopped. Electrons really do not cross the bridge, but ions do. Without them, positive charge would build up in the zinc beaker and stop the reaction at once. The circuit needs both the wire and the bridge.'}},
    {lvl:'honors',instant:true,set:{mode:'cell',left:'Zn',right:'Cu'},q:'In the zinc–copper cell, which way do NO₃⁻ ions in the salt bridge move?',choices:['Toward the zinc (anode) beaker','Toward the copper (cathode) beaker','They do not move: they carry electrons from zinc to copper'],correct:0,
     explain:{honors:'Zn²⁺ ions pile up in the zinc beaker, so negative NO₃⁻ ions move in to balance them. K⁺ ions move toward the copper beaker to replace the Cu²⁺ that plated out. Watch the bridge: anions go to the anode, cations go to the cathode.'}},
    {lvl:'honors',instant:true,set:{mode:'cell',left:'Zn',right:'Ag'},q:'In a Zn | Ag cell, you double the silver half-reaction to 2Ag⁺ + 2e⁻ → 2Ag so the electrons balance. What is E°cell?',choices:['+0.80 − (−0.76) = 1.56 V','2(+0.80) − (−0.76) = 2.36 V','+0.80 + (−0.76) = 0.04 V'],correct:0,
     explain:{honors:'The model reads '+ZA.toFixed(2)+' V. E° measures the push per electron, so it does not change when you multiply a half-reaction. Multiply the moles to balance electrons, but never the voltages.'}},
    {lvl:'honors',instant:true,set:{mode:'six',set:'A'},q:'In the six-way lab with copper, zinc, lead and magnesium, which metal is the anode in every cell it is part of?',choices:['Copper','Lead','Magnesium','Zinc'],correct:2,
     explain:{honors:'Magnesium has the most negative reduction potential (−2.37 V), so it gives up electrons more easily than any of the others. Press Measure all six pairs: every reading with magnesium shows it as the anode, and the ranking puts it last.'}},
    {lvl:'ap',q:'The Zn | Cu cell is at standard conditions (1.0 M each). You dilute the Zn²⁺ to 0.010 M. What happens to Ecell?',choices:['It rises by about 0.06 V','It falls by about 0.06 V','It stays at 1.10 V, because E° does not change'],correct:0,
     baseline:{mode:'cell',left:'Zn',right:'Cu',sw:false,cL:1,cR:1},change:{cL:0.01},changeText:'Zn²⁺ diluted to 0.010 M',watch:'E',
     explain:{ap:'E = E° − (0.0592/2) log([Zn²⁺]/[Cu²⁺]) = 1.10 − 0.0296 × log(0.010) = '+ner.toFixed(3)+' V. Removing product (Zn²⁺) makes Q smaller, so the reaction is pushed harder forward, just as Le Châtelier predicts.'}},
    {lvl:'ap',instant:true,set:{mode:'cell',left:'Zn',right:'Cu'},q:'What is ΔG° for Zn(s) + Cu²⁺(aq) → Zn²⁺(aq) + Cu(s)?',choices:['−106 kJ/mol','−212 kJ/mol','+212 kJ/mol'],correct:1,
     explain:{ap:'ΔG° = −nFE° = −(2)(96,485 C/mol)(1.10 V) = '+dG.toFixed(0)+' kJ/mol. n = 2 because two electrons move per zinc atom; −106 kJ/mol forgets the 2. Negative ΔG° and positive E° both say the reaction is spontaneous.'}},
    {lvl:'ap',q:'In electrolysis mode the power supply pushes 0.50 A through the Zn | Cu cell for 60 minutes, forcing Zn²⁺ + 2e⁻ → Zn. About how much zinc plates out?',choices:['0.61 g','1.22 g','0.30 g'],correct:0,
     baseline:{mode:'electro',left:'Zn',right:'Cu',amps:0.5,sw:false},change:{sw:true},at:0,reveal:60,changeText:'Power supply on at 0.50 A',watch:'mass',
     explain:{ap:'Charge = It = 0.50 A × 3600 s = 1800 C = 0.01866 mol e⁻. Zinc needs 2 e⁻ per atom: 0.00933 mol × 65.38 g/mol = '+plate.toFixed(2)+' g. Check the "Metal deposited" readout. 1.22 g forgets that each Zn²⁺ needs two electrons.'}}
  ];},
  lab:{bio:'<p><b>Question:</b> Which pairs of metals make the biggest voltage?</p><ol><li>Keep zinc on the left. Try each metal on the right and record the voltmeter reading.</li><li>For each pair, record which electrode loses mass (let the time run).</li><li>Remove the salt bridge once and record what happens.</li></ol><p>Rank the metals from best electron-giver to worst. Safety in the real lab: goggles, and silver nitrate stains skin.</p>',
       honors:'<p><b>Question:</b> Can you rank four metals using only voltmeter readings? (RJ “Six Way Galvanic Cell” lab)</p><ol><li>Choose <b>Six-way lab</b>. Put the leads on each of the 6 pairs and press <b>Record this reading</b>.</li><li>For each pair, identify the anode and cathode from the sign of the reading.</li><li>Use the readings to place all four metals on one voltage scale relative to copper.</li></ol><p>Compare your ranking with the table of standard reduction potentials. Write the cell notation for the pair with the largest voltage.</p>',
       ap:'<p><b>Question:</b> How do concentration and current change a cell’s voltage and the mass it deposits?</p><ol><li>For Zn | Cu, set [Zn²⁺] to 1.0, 0.10, 0.010 and 0.0010 M and record Ecell with the switch open.</li><li>Plot Ecell against log([Zn²⁺]/[Cu²⁺]) and find the slope.</li><li>In electrolysis mode, run 0.50 A and 1.00 A for 60 min each and record the mass deposited.</li></ol><p><b>Claim–evidence–reasoning:</b> Compare your slope with −0.0592/n and your masses with It·M/(nF).</p>'},
  terms:[{t:'Oxidation',d:'Losing electrons. Zn → Zn²⁺ + 2e⁻.'},{t:'Reduction',d:'Gaining electrons. Cu²⁺ + 2e⁻ → Cu.'},{t:'Anode',d:'The electrode where oxidation happens. In a galvanic cell it is negative and loses mass.'},{t:'Cathode',d:'The electrode where reduction happens. In a galvanic cell it is positive and gains mass.'},{t:'Salt bridge',d:'A tube or strip of salt solution (here KNO₃) that lets ions move between the half-cells to keep charges balanced.'},{t:'Voltage',d:'How hard the cell pushes electrons through the wire, in volts (V).'},
    {lvl:'honors',t:'Half-cell',d:'A metal in a solution of its own ions.'},{lvl:'honors',t:'Standard reduction potential, E°',d:'How strongly a half-reaction pulls electrons, measured against hydrogen at 1 M, 1 atm and 25 °C.'},{lvl:'honors',t:'Cell notation',d:'Anode | anode solution ‖ cathode solution | cathode, e.g. Zn(s) | Zn²⁺(aq) ‖ Cu²⁺(aq) | Cu(s).'},
    {lvl:'ap',t:'Nernst equation',d:'E = E° − (RT/nF) ln Q = E° − (0.0592/n) log Q at 25 °C.'},{lvl:'ap',t:'ΔG° = −nFE°',d:'Links cell potential to free energy. F = 96,485 C per mole of electrons.'},{lvl:'ap',t:'Electrolysis',d:'Using an outside power source to drive a non-spontaneous redox reaction. Mass deposited = ItM/(nF).'}],
  about:'<p>Standard reduction potentials at 25 °C come from the ChemLab data table (Ag⁺ +0.80, Cu²⁺ +0.34, Pb²⁺ −0.13, Ni²⁺ −0.25, Fe²⁺ −0.44, Zn²⁺ −0.76, Al³⁺ −1.66, Mg²⁺ −2.37 V). Each electrode’s potential follows the Nernst equation, E = E° + (0.0592/n) log[Mⁿ⁺], and the voltmeter reads the difference with the red lead on the right electrode. The meter is treated as ideal and the cell’s internal resistance is lumped into a 50 Ω load, so the reading equals the cell potential even while current flows.</p><p>As current flows, the anode loses mass and the cathode gains it by Faraday’s law (mass = ItM/nF), and the ion concentrations in each 50.0 mL beaker change, so the voltage slowly drops. Time runs 5 minutes per second. Real lab cells differ: magnesium and aluminum carry oxide coatings and usually read several tenths of a volt lower, Mg also reacts slowly with water, and iron(II) solutions oxidize in air. The six-way readings include a small fixed measurement scatter (up to ±0.02 V). Electrolysis ignores side reactions such as H₂ or O₂ formation, and the salt-bridge ions and zoom particles are a picture of the process, not to scale.</p>',
  initVis(sim){const v=sim.vis;v.ph=0;v.ev={L:[],R:[]};v.evT={L:0,R:0};v.br=[];const r=rng(3);for(let i=0;i<10;i++)v.br.push({f:r(),k:i%2?'K':'N'});v.ions={L:[],R:[]};['L','R'].forEach(s=>{for(let i=0;i<9;i++)v.ions[s].push({x:0,d:12+r()*ZR,y:(r()-.5)*ZR*1.5,vx:0,vy:0,an:i>=6});});},
  draw(sim,ctx,vdt,k,t){const p=sim.p;ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);if(p.mode==='six'){drawSix(sim,ctx,k);return;}drawCell(sim,ctx,vdt,k,t);},
  thumbSetup(sim){}
};

function drawCell(sim,ctx,vdt,k,t){const p=sim.p,st=sim.st,v=sim.vis,c=calc(sim),hon=atLeast('honors'),ap=atLeast('ap');
  const sides={L:{m:c.L,bk:BK.L,conc:st.cL,mass:st.mL,z:ZL},R:{m:c.R,bk:BK.R,conc:st.cR,mass:st.mR,z:ZRc}};
  // beakers and solutions
  ['L','R'].forEach(s=>{const o=sides[s],b=o.bk,ion=o.m.sol;const tint=ion?clamp(0.25+0.6*Math.pow(Math.min(o.conc,1),0.35),0,0.85):0;
    const liq=ion?mixHex(PAL['cv-water'],ion,tint):PAL['cv-water'];CL.drawBeaker(ctx,{x:b.x,y:b.y,w:b.w,h:b.h,fill:0.82,liquid:liq,ticks:false});});
  // salt bridge
  ctx.lineCap='round';ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=26;ctx.beginPath();BRIDGE.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]));ctx.stroke();
  ctx.strokeStyle=p.bridge?PAL['cv-water']:PAL['cv-bg'];ctx.lineWidth=20;ctx.beginPath();BRIDGE.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]));ctx.stroke();ctx.lineCap='butt';
  if(!p.bridge){ctx.save();ctx.translate(0,-70);ctx.globalAlpha=0.5;ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=22;ctx.lineCap='round';ctx.beginPath();BRIDGE.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]));ctx.stroke();ctx.restore();ctx.globalAlpha=1;}
  // bridge ions: anions drift toward the anode beaker, cations toward the cathode
  const BL=pathLen(BRIDGE),flow=c.I>0?1:0,dirA=c.an==='L'?-1:1;
  if(p.bridge)v.br.forEach(o=>{if(!RM)o.f=(o.f+(o.k==='N'?dirA:-dirA)*flow*vdt*0.05+1)%1;const q=at(BRIDGE,clamp(0.08+o.f*0.84,0,1)*BL);
    ionBall(ctx,q[0],q[1],6,o.k==='N'?'#c0392b':'#7a52c7',o.k==='N'?'−':'+');});
  if(hon||k<1.3)txt(ctx,p.bridge?'salt bridge (KNO₃)':'salt bridge removed',400,p.bridge?176:110,{s:12*k,c:PAL['cv-soft'],a:'center'});
  // electrodes
  strip(ctx,BK.L.ex,c.L,st.mL/M0);strip(ctx,BK.R.ex,c.R,st.mR/M0);
  // wires: voltmeter on top, bulb or supply below
  const xl=BK.L.ex+EW/2,xr=BK.R.ex+EW/2;ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=4;
  ctx.beginPath();ctx.moveTo(xl,ETOP);ctx.lineTo(xl,VY);ctx.lineTo(336,VY);ctx.moveTo(464,VY);ctx.lineTo(xr,VY);ctx.lineTo(xr,ETOP);ctx.stroke();
  ctx.beginPath();ctx.moveTo(xl,WY);ctx.lineTo(p.sw?xr:560,WY);ctx.stroke();if(!p.sw){ctx.beginPath();ctx.moveTo(560,WY);ctx.lineTo(584,WY-18);ctx.stroke();ctx.beginPath();ctx.moveTo(596,WY);ctx.lineTo(xr,WY);ctx.stroke();}
  ctx.fillStyle=PAL['cv-ink'];[560,596].forEach(x=>{ctx.beginPath();ctx.arc(x,WY,4,0,6.29);ctx.fill();});
  // voltmeter
  rr(ctx,336,18,128,58,10);ctx.fillStyle='#1d2a2c';ctx.fill();ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.5;ctx.stroke();
  txt(ctx,(c.volt>=0?'+':'−')+Math.abs(c.volt).toFixed(2)+' V',400,47,{s:20*Math.min(k,1.3),w:800,c:'#7CFC9A',a:'center',b:'middle'});
  ctx.fillStyle='#c62828';ctx.beginPath();ctx.arc(464,VY,5,0,6.29);ctx.fill();ctx.fillStyle='#222';ctx.beginPath();ctx.arc(336,VY,5,0,6.29);ctx.fill();
  if(k<1.3){txt(ctx,'COM',330,30,{s:11,c:PAL['cv-soft'],a:'right'});txt(ctx,'V+',470,30,{s:11,c:PAL['s1']});}
  // bulb or power supply
  if(c.electro){rr(ctx,362,WY-22,76,44,6);ctx.fillStyle='#2b2f36';ctx.fill();txt(ctx,'DC '+c.Vs.toFixed(2)+' V',400,WY+1,{s:12*Math.min(k,1.3),w:700,c:'#ffd166',a:'center',b:'middle'});
    const plusRight=c.an==='R';txt(ctx,'+',plusRight?446:354,WY-26,{s:16*k,w:800,c:PAL['s1'],a:'center'});txt(ctx,'−',plusRight?354:446,WY-26,{s:16*k,w:800,c:PAL['s2'],a:'center'});}
  else{const g=clamp(c.I/(1.1/RLOAD),0,1.6);if(g>0.02){const gr=ctx.createRadialGradient(400,WY,4,400,WY,30+24*Math.min(1,g));gr.addColorStop(0,'rgba(255,226,120,'+(0.75*Math.min(1,g))+')');gr.addColorStop(1,'rgba(255,226,120,0)');ctx.fillStyle=gr;ctx.beginPath();ctx.arc(400,WY,54,0,6.29);ctx.fill();}
    ctx.fillStyle=g>0.02?'rgba(255,240,180,'+(0.4+0.4*Math.min(1,g))+')':PAL['card'];ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2;ctx.beginPath();ctx.arc(400,WY,15,0,6.29);ctx.fill();ctx.stroke();
    ctx.strokeStyle=g>0.02?'#c77700':PAL['cv-soft'];ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(392,WY+5);for(let i=0;i<5;i++)ctx.lineTo(394+i*3,WY+(i%2?-5:2));ctx.lineTo(408,WY+5);ctx.stroke();}
  // electrons along the lower wire
  if(c.I>0){const P=wirePath(c),L=pathLen(P),sp=c.electro?60+40*Math.min(2,c.I):30+50*Math.min(1,c.I/0.03);if(!RM)v.ph=(v.ph+sp*vdt)%34;
    ctx.fillStyle='#e6b800';for(let d=v.ph;d<L;d+=34){const q=at(P,d);if(Math.abs(q[0]-400)<20&&Math.abs(q[1]-WY)<20)continue;ctx.beginPath();ctx.arc(q[0],q[1],4.2,0,6.29);ctx.fill();}
    const mid=(xl+xr)/2,dir=c.an==='L'?1:-1;pill(ctx,'e⁻ '+(dir>0?'→':'←'),mid+dir*-110,WY-24,'#a07800','#fff',12*k);}
  // zoom circles at each electrode surface
  ['L','R'].forEach(s=>{const o=sides[s],isAn=c.an===s&&c.I>0,isCa=c.ca===s&&c.I>0;zoom(sim,ctx,s,o,isAn,isCa,vdt,k,c);});
  // labels under beakers
  ['L','R'].forEach(s=>{const o=sides[s],cx=o.bk.x+o.bk.w/2,role=c.Ecell<1e-6&&!c.electro?'':c.an===s?'Anode ('+(c.electro?'+':'−')+'): oxidation':'Cathode ('+(c.electro?'−':'+')+'): reduction';
    txt(ctx,o.m.s+' | '+o.m.ion+' ('+(o.conc>=0.995?'1.0':o.conc>=0.0995?o.conc.toFixed(2):o.conc.toPrecision(2))+' M)',cx,o.bk.y+o.bk.h+20,{s:13*k,w:700,a:'center'});
    if(role)txt(ctx,role,cx,o.bk.y+o.bk.h+20+17*k,{s:12*k,c:c.an===s?PAL['s1']:PAL['s2'],a:'center',w:600});});
  // cell notation between the beakers
  if(hon&&c.Ecell>1e-6||hon&&c.electro){txt(ctx,notation(c,true),400,262,{s:12.5*k,w:700,a:'center'});
    if(ap&&k<1.3&&!c.electro)txt(ctx,'E°cell = '+sgn(c.Mr.E)+' − ('+sgn(c.Mx.E)+') = '+c.E0.toFixed(2)+' V',400,284,{s:12*k,c:PAL['cv-soft'],a:'center'});}
}
function mixHex(a,b,t){const h=x=>{x=x.replace('#','');if(x.length===3)x=x.split('').map(c=>c+c).join('');return [0,2,4].map(i=>parseInt(x.slice(i,i+2),16));};const A=h(a),B=h(b);return '#'+A.map((v,i)=>Math.round(lerp(v,B[i],clamp(t,0,1))).toString(16).padStart(2,'0')).join('');}
function zoom(sim,ctx,s,o,isAn,isCa,vdt,k,c){const v=sim.vis,[cx,cy]=o.z,m=o.m,surfX=s==='L'?cx+ZR*0.35:cx-ZR*0.35,metalSide=s==='L'?1:-1;
  // connector to the electrode surface
  const ex=s==='L'?BK.L.ex:BK.R.ex+EW;ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=1.5;ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(cx+(s==='L'?ZR*0.5:-ZR*0.5),cy+ZR*0.85);ctx.lineTo(ex,300);ctx.stroke();ctx.setLineDash([]);
  ctx.save();ctx.beginPath();ctx.arc(cx,cy,ZR,0,6.29);ctx.fillStyle=m.sol?mixHex(PAL['cv-water'],m.sol,0.35):PAL['cv-water'];ctx.fill();ctx.clip();
  // metal lattice
  for(let i=0;i<4;i++)for(let j=-5;j<=5;j++){const x=surfX+metalSide*(7+i*13),y=cy+j*12+(i%2)*6;ionBall(ctx,x,y,6.5,m.col,'');}
  // ions in solution drift around
  v.ions[s].forEach(q=>{if(!RM&&vdt>0){q.vx+=randn()*30*vdt;q.vy+=randn()*30*vdt;q.vx*=0.97;q.vy*=0.97;q.x+=q.vx*vdt;q.y+=q.vy*vdt;}
    if(q.d===undefined)q.d=10+Math.abs(q.x)%(ZR*1.1);q.d=clamp(q.d+(RM?0:q.vx*vdt),10,ZR*1.25);q.y=clamp(q.y,-ZR*0.85,ZR*0.85);
    const x=surfX-metalSide*(6+q.d),y=cy+q.y;
    if(q.an)ionBall(ctx,x,y,5,'#9aa3ad',m.anion==='NO₃⁻'?'−':'2−',0.55);else ionBall(ctx,x,y,6.5,m.sol||'#8fa9c9',chg(m.q));});
  // events: an atom leaves as an ion (anode) or an ion plates out (cathode)
  const rate=c.I>0?(c.electro?2.2:1.3):0;v.evT[s]-=vdt;
  if((isAn||isCa)&&v.evT[s]<=0&&!RM){v.evT[s]=1/rate;v.ev[s].push({t:0,y:(Math.random()-.5)*ZR*1.1,an:isAn});}
  v.ev[s]=v.ev[s].filter(e=>{e.t+=vdt;const f=clamp(e.t/1.6,0,1);let x,lab='',col;
    if(e.an){x=surfX-metalSide*(f*44);lab=f>0.15?chg(m.q):'';col=f>0.15?(m.sol||'#8fa9c9'):m.col;}
    else{x=surfX-metalSide*((1-f)*44+2);lab=f<0.85?chg(m.q):'';col=f<0.85?(m.sol||'#8fa9c9'):m.col;}
    ionBall(ctx,x,cy+e.y,6.5,col,lab);
    // electrons leaving into (anode) or arriving from (cathode) the metal
    const ef=e.an?f:1-f;for(let i=0;i<Math.min(3,m.q);i++){const exx=surfX+metalSide*(6+ef*40+i*6),eyy=cy+e.y+(i-1)*7;ctx.fillStyle='#e6b800';ctx.beginPath();ctx.arc(exx,eyy,3.2,0,6.29);ctx.fill();}
    return e.t<1.6;});
  ctx.restore();ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=3;ctx.beginPath();ctx.arc(cx,cy,ZR,0,6.29);ctx.stroke();
  const lab=isAn?m.s+' → '+m.ion+' + '+(m.q===1?'':m.q)+'e⁻':isCa?m.ion+' + '+(m.q===1?'':m.q)+'e⁻ → '+m.s:m.n+' surface';
  if(k>1.3)return;  ctx.font='700 '+(12*k)+'px '+FONT;const w=ctx.measureText(lab).width;const lx=s==='L'?Math.max(w/2+4,cx):Math.min(800-w/2-4,cx);
  txt(ctx,lab,lx,cy+ZR+18*k,{s:12*k,w:700,a:'center',c:isAn?PAL['s1']:isCa?PAL['s2']:PAL['cv-soft']});}
function drawSix(sim,ctx,k){const p=sim.p,st=sim.st,S=SETS[p.set],[pi,pj]=PAIRS[+p.pair],r=sixReading(p),hon=atLeast('honors');
  const C=[400,222],pos=[[400,92],[598,222],[400,352],[202,222]];
  // filter paper salt bridge
  ctx.fillStyle=PAL['cv-ruler'];ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1;
  [[C[0]-14,pos[0][1],28,pos[2][1]-pos[0][1]],[pos[3][0],C[1]-14,pos[1][0]-pos[3][0],28]].forEach(a=>{ctx.fillRect(a[0],a[1],a[2],a[3]);ctx.strokeRect(a[0],a[1],a[2],a[3]);});
  txt(ctx,'KNO₃ paper',C[0]+20,C[1]-22,{s:12*k,c:PAL['cv-soft']});
  pos.forEach((q,i)=>{const m=MET[S[i]],on=i===pi||i===pj;ctx.beginPath();ctx.arc(q[0],q[1],56,0,6.29);ctx.fillStyle=m.sol?mixHex(PAL['cv-water'],m.sol,0.6):PAL['cv-water'];ctx.fill();ctx.lineWidth=on?4:2;ctx.strokeStyle=on?(i===pi?'#c62828':PAL['cv-ink']):PAL['cv-glass'];ctx.stroke();
    ctx.save();ctx.translate(q[0],q[1]);ctx.rotate(-0.5);const g=ctx.createLinearGradient(-30,0,30,0);g.addColorStop(0,CL.shade(m.col,-0.25));g.addColorStop(.5,CL.shade(m.col,0.25));g.addColorStop(1,CL.shade(m.col,-0.3));ctx.fillStyle=g;ctx.fillRect(-30,-10,60,20);ctx.restore();
    txt(ctx,m.s,q[0],q[1]+1,{s:16*k,w:800,a:'center',b:'middle',c:CL.inkOn(m.col)});
    const tx=i===1||i===2?q[0]+62:i===3?q[0]-62:q[0],ty=i===0?q[1]-66:q[1]+4,al=i===1||i===2?'left':i===3?'right':'center';
    txt(ctx,(i+1)+': '+m.n,tx,ty,{s:13*k,w:700,a:al});});
  // voltmeter with leads
  rr(ctx,630,18,150,58,10);ctx.fillStyle='#1d2a2c';ctx.fill();ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.5;ctx.stroke();
  txt(ctx,sgn(r)+' V',705,47,{s:20*Math.min(k,1.3),w:800,c:'#7CFC9A',a:'center',b:'middle'});
  const lead=(i,col,x0)=>{const q=pos[i];ctx.strokeStyle=col;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x0,76);ctx.quadraticCurveTo(x0,q[1]-30,q[0]+(i===3?20:i===1?-20:12),q[1]-(i===2?-4:8));ctx.stroke();ctx.fillStyle=col;ctx.beginPath();ctx.arc(q[0]+(i===3?20:i===1?-20:12),q[1]-(i===2?-4:8),5,0,6.29);ctx.fill();};
  lead(pi,'#c62828',740);lead(pj,PAL['cv-ink'],670);
  const meas=Object.keys(st.meas).filter(key=>key.startsWith(p.set+'|')).length;
  txt(ctx,'Pairs recorded: '+meas+' of 6',20,30,{s:13*k,w:700});
  txt(ctx,(r>0?MET[S[pi]].s:MET[S[pj]].s)+' is the cathode in this pair',20,30+20*k,{s:12*k,c:PAL['cv-soft']});
}
GAL.onLevel=syncMode;
BioLab.register(GAL);
})();
