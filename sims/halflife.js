(function(){
'use strict';
const {clamp,lerp,rng,randn,rr,txt,pill,atLeast,PAL,FONT,RM,axes,legend,serColor}=BioLab.h;
const CL=window.ChemLab;

/* Half-lives (NNDC, rounded) with the time unit used on screen */
const ISO=[
  {id:'C14',name:'Carbon-14',d:'Nitrogen-14',t:5730,u:'years',mode:'β⁻',use:'radiocarbon dating'},
  {id:'I131',name:'Iodine-131',d:'Xenon-131',t:8.02,u:'days',mode:'β⁻',use:'thyroid treatment'},
  {id:'Tc99m',name:'Technetium-99m',d:'Technetium-99',t:6.01,u:'hours',mode:'γ',use:'medical imaging'},
  {id:'F18',name:'Fluorine-18',d:'Oxygen-18',t:109.8,u:'minutes',mode:'β⁺',use:'PET scans'},
  {id:'P32',name:'Phosphorus-32',d:'Sulfur-32',t:14.3,u:'days',mode:'β⁻',use:'DNA labeling'},
  {id:'Rn222',name:'Radon-222',d:'Polonium-218',t:3.82,u:'days',mode:'α',use:'radon testing in homes'},
  {id:'Co60',name:'Cobalt-60',d:'Nickel-60',t:5.27,u:'years',mode:'β⁻',use:'cancer therapy'},
  {id:'U238',name:'Uranium-238',d:'Thorium-234',t:4.47e9,u:'years',mode:'α',use:'dating rocks and Earth'}];
const isoOf=p=>ISO.find(i=>i.id===p.iso)||ISO[0];
const T14=5730;
const SAMPLES=[{n:'Dead Sea Scrolls',pct:78},{n:'Ötzi the Iceman',pct:53},{n:'Lascaux cave charcoal',pct:14},{n:'Woolly mammoth bone',pct:4}];
const MMC=['#c0392b','#2d6bd2','#1b8a4a','#d4a017','#d35400','#6d4c41'];
const fmtT=(v,u)=>{if(!Number.isFinite(v))return '—';const s=v>=1e6?CL.sci(v,'',3):v>=100?Math.round(v).toLocaleString('en-US'):v>=10?v.toFixed(1):v.toFixed(2);return s+' '+u;};
const pDecay=p=>p.mode==='iso'?1-Math.pow(2,-p.step):+p.prob;

/* ---------- model ---------- */
function newRun(sim){const st=sim.st,p=sim.p,N=p.mode==='iso'?200:Math.round(p.N);st.items=[];const R=st.r;
  const cols=p.mode==='iso'?20:Math.ceil(Math.sqrt(N*1.25)),rows=Math.ceil(N/cols);
  for(let i=0;i<N;i++){const c=i%cols,r=Math.floor(i/cols);let x,y;if(p.mode==='iso'){x=40+c*21;y=120+r*21;}else{x=78+(c+0.5)*(204/cols)+(R()-0.5)*4;y=150+(r+0.5)*(232/rows)+(R()-0.5)*4;}
    st.items.push({x,y,hx:x,hy:y,alive:true,col:MMC[Math.floor(R()*6)],out:0,a:R()*6.28});}
  st.N0=N;st.n=N;st.k=0;st.run=[[0,N]];st.shakeT=0;st.outCount=0;}
function shake(sim){const st=sim.st,p=sim.p;if(st.n<=0)return;const pd=pDecay(p);let left=0;
  st.items.forEach(it=>{if(!it.alive)return;if(st.r()<pd){it.alive=false;it.out=0.001;it.slot=st.outCount++;}else left++;});
  st.n=left;st.k++;st.run.push([st.k,left]);st.shakeT=0.5;if(st.n===0||st.k>=40){st.runs.push(st.run);if(st.runs.length>30)st.runs.shift();st.done=true;}}
function finishRun(sim){let g=0;while(sim.st.n>0&&sim.st.k<40&&g++<60)shake(sim);}
function manyTrials(sim,n){for(let i=0;i<n;i++){newRun(sim);finishRun(sim);}sim.st.avgShown=true;}
function avgRuns(st){const R=st.runs.filter(r=>r[0][1]===st.N0);if(!R.length)return null;const L=Math.max(...R.map(r=>r.length));const out=[];
  for(let k=0;k<L;k++){let s=0;R.forEach(r=>{s+=k<r.length?r[k][1]:0;});out.push([k,s/R.length]);}return {pts:out,n:R.length};}
function halfFromRun(run,N0){for(let i=1;i<run.length;i++){if(run[i][1]<=N0/2){const a=run[i-1],b=run[i];return a[0]+(a[1]-N0/2)/(a[1]-b[1]);}}return NaN;}
const age=pct=>T14*Math.log2(100/pct);

function syncMode(sim){if(!sim.ui||!sim.ui.sec)return;const mode=sim.p.mode,d=sim.def;
  d.controls.forEach(c=>{if(!c.modes)return;const cid=d.id+'-'+c.id,e=document.getElementById(cid)||document.getElementById(cid+'-l');if(!e)return;const w=e.closest('.ctl');if(w)w.hidden=!atLeast(c.lvl)||!c.modes.includes(mode);});
  d.metrics.forEach(m=>{if(!m.modes)return;const t=sim.ui.tiles[m.id];if(!t)return;const w=t.num.closest('.tile');if(w)w.hidden=!atLeast(m.lvl)||!m.modes.includes(mode);});
  const btns=[...sim.ui.sec.querySelectorAll('.actions button')];d.actions.forEach(a=>{const b=btns.find(x=>x.textContent===a.label);if(b)b.hidden=!atLeast(a.lvl)||!a.modes.includes(mode);});}
function restart(sim){if(!sim.st)return;sim.st.runs=[];sim.st.done=false;sim.st.avgShown=false;newRun(sim);sim.infoDirty=true;}
function modeChange(sim){syncMode(sim);restart(sim);}

const HL={
  id:'halflife',hash:'halflife',apUnit:2,order:5,tab:'Half-life',kind:'Virtual lab',prereq:['nuclear'],next:['ratelaw'],
  card:'Shake a cup of candy “atoms”, pull out the ones that decayed, and watch the half-life curve appear. Then date an ancient sample with carbon-14.',
  title:'Half-life: radioactive decay by chance',
  lede:{bio:'No one can predict when one atom will decay, but a large group always loses half in the same amount of time. Shake the cup and see it happen.',
        honors:'Collect decay data, compare it with N = N₀(½)ⁿ, and use real half-lives to predict how much of an isotope is left.',
        ap:'Model decay as first-order kinetics: N = N₀e^(−kt), k = ln 2 / t½, and a straight-line plot of ln N vs t. Then date a sample by carbon-14.'},
  scale:{bio:'Candy lab: each candy stands for one radioactive atom. Real samples hold about 10²⁰ atoms, so their decay curves are perfectly smooth.',
         honors:'Each candy or dot stands for one atom. One gram of carbon from a living thing holds about 6 × 10¹⁰ carbon-14 atoms, so real decay curves are smooth.'},
  timeless:true,animated:true,chChange:0.5,chReveal:2.6,
  controls:[
    {id:'mode',label:'Lab',type:'seg',def:'candy',lvl:'bio',noTrial:true,options:[{v:'candy',l:'Candy decay'},{v:'iso',l:'Real isotopes'},{v:'date',l:'Carbon dating'}]},
    {id:'N',label:'Candies in the cup',type:'range',min:20,max:200,step:10,def:100,lvl:'bio',modes:['candy'],onChange:restart},
    {id:'prob',label:'Chance to decay each shake',type:'seg',def:0.5,lvl:'bio',modes:['candy'],onChange:restart,options:[{v:0.5,l:'1 in 2 (candy)'},{v:0.25,l:'1 in 4 (4-sided die)',lvl:'honors'},{v:1/6,l:'1 in 6 (die)',lvl:'honors'}]},
    {id:'iso',label:'Isotope',type:'select',def:'C14',lvl:'bio',modes:['iso'],onChange:restart,options:ISO.map(i=>({v:i.id,l:i.name+' (t½ '+fmtT(i.t,i.u)+')'}))},
    {id:'step',label:'Time step',type:'range',min:0.25,max:2,step:0.25,def:1,unit:' half-lives',lvl:'bio',modes:['iso'],onChange:restart},
    {id:'pct',label:'Carbon-14 left in the sample',type:'range',min:1,max:100,step:1,def:25,unit:'%',lvl:'bio',modes:['date']},
    {id:'auto',label:'Keep going automatically',type:'toggle',def:false,lvl:'bio',modes:['candy','iso'],noTrial:true}
  ],
  actions:[
    {id:'shake',label:'Shake and pour',lvl:'bio',primary:true,modes:['candy'],run(sim){if(sim.st.done)newRun(sim),sim.st.done=false;shake(sim);}},
    {id:'stepT',label:'Advance one time step',lvl:'bio',primary:true,modes:['iso'],run(sim){if(sim.st.done)newRun(sim),sim.st.done=false;shake(sim);}},
    {id:'refill',label:'New cup',lvl:'bio',modes:['candy','iso'],run(sim){sim.st.done=false;newRun(sim);}},
    {id:'trials',label:'Run 20 more trials',lvl:'bio',modes:['candy','iso'],run(sim){if(sim.st.k>0&&!sim.st.done)finishRun(sim);manyTrials(sim,20);}}
  ],
  init(sim){const st={r:rng(314159),runs:[],items:[],n:0,N0:0,k:0,run:[],acc:0,shakeT:0,done:false,avgShown:false};sim.st=st;newRun(sim);return st;},
  step(sim,dt){const st=sim.st,p=sim.p;st.shakeT=Math.max(0,st.shakeT-dt);st.items.forEach(it=>{if(it.out>0&&it.out<1)it.out=Math.min(1,it.out+dt/0.6);});
    if(p.auto&&p.mode!=='date'&&!st.done){st.acc+=dt;if(st.acc>0.9){st.acc=0;shake(sim);sim.infoDirty=true;}}},
  metrics:[
    {id:'rem',label:'Undecayed candies',unit:'',lvl:'bio',min:0,max:200,d:0,modes:['candy'],get:s=>s.st.n},
    {id:'shk',label:'Shakes so far',unit:'',lvl:'bio',min:0,max:null,d:0,modes:['candy'],get:s=>s.st.k},
    {id:'th',label:'Half-life from your data',unit:'shakes',lvl:'bio',min:0,max:null,d:2,modes:['candy'],get:s=>halfFromRun(s.st.run,s.st.N0)},
    {id:'tth',label:'Predicted half-life',unit:'shakes',lvl:'honors',min:0,max:null,d:2,modes:['candy'],get:s=>Math.LN2/-Math.log(1-s.p.prob)},
    {id:'kc',label:'Decay constant k',unit:'per shake',lvl:'ap',min:0,max:null,d:3,modes:['candy'],get:s=>-Math.log(1-s.p.prob)},
    {id:'remI',label:'Parent atoms left',unit:'of 200',lvl:'bio',min:0,max:200,d:0,modes:['iso'],get:s=>s.st.n},
    {id:'el',label:'Time elapsed',unit:'',lvl:'bio',text:true,modes:['iso'],get:s=>{const I=isoOf(s.p),h=s.st.k*s.p.step;return fmtT(h*I.t,I.u)+' ('+h.toFixed(2)+' half-lives)';}},
    {id:'expP',label:'Expected percent left',unit:'%',lvl:'honors',min:0,max:100,d:1,modes:['iso'],get:s=>100*Math.pow(0.5,s.st.k*s.p.step)},
    {id:'kI',label:'Decay constant k = ln 2 / t½',unit:'',lvl:'ap',text:true,modes:['iso'],get:s=>{const I=isoOf(s.p);return CL.sci(Math.LN2/I.t,'',3)+' per '+I.u.replace(/s$/,'');}},
    {id:'age',label:'Age of the sample',unit:'years',lvl:'bio',min:0,max:null,d:0,modes:['date'],get:s=>age(s.p.pct)},
    {id:'hls',label:'Half-lives that have passed',unit:'',lvl:'bio',min:0,max:null,d:2,modes:['date'],get:s=>Math.log2(100/s.p.pct)},
    {id:'kd',label:'k for carbon-14',unit:'per year',lvl:'ap',text:true,modes:['date'],get:s=>CL.sci(Math.LN2/T14,'',3)}
  ],
  graphs:[{id:'curve',label:'Amount left vs time',lvl:'bio',custom:true},{id:'ln',label:'ln(amount left) vs time',lvl:'ap',custom:true}],
  defaultGraph:'curve',
  plot(sim,ctx,box,id){const st=sim.st,p=sim.p,ap=atLeast('ap');
    if(p.mode==='date'){const xmax=50000;const ax=axes(ctx,box,{xmin:0,xmax,ymin:id==='ln'?0:0,ymax:id==='ln'?Math.log(100)*1.05:100,xl:'Years since death',yl:id==='ln'?'ln(% carbon-14)':'% carbon-14 left'});
      const f=t=>100*Math.pow(0.5,t/T14),g=t=>id==='ln'?Math.log(f(t)):f(t);ctx.strokeStyle=serColor(0);ctx.lineWidth=2.5;ctx.beginPath();for(let t=0;t<=xmax;t+=250){t?ctx.lineTo(ax.X(t),ax.Y(g(t))):ctx.moveTo(ax.X(t),ax.Y(g(t)));}ctx.stroke();
      const a=age(p.pct),y=id==='ln'?Math.log(p.pct):p.pct;if(a<=xmax){ctx.setLineDash([4,4]);ctx.strokeStyle=PAL['muted'];ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(ax.X(0),ax.Y(y));ctx.lineTo(ax.X(a),ax.Y(y));ctx.lineTo(ax.X(a),ax.Y(0));ctx.stroke();ctx.setLineDash([]);ctx.fillStyle=serColor(1);ctx.beginPath();ctx.arc(ax.X(a),ax.Y(y),6,0,6.29);ctx.fill();}
      legend(ctx,box.L+150,box.T+12,[{label:id==='ln'?'slope = −k = −1.21 × 10⁻⁴ per year':'N = N₀(½)^(t / 5,730 y)',color:serColor(0)}]);return;}
    const iso=p.mode==='iso',I=isoOf(p),sx=iso?p.step:1;const runs=st.runs.slice(-30),A=avgRuns(st),cur=st.run;
    const xmax=Math.max(iso?8:Math.max(8,Math.ceil(3*Math.LN2/-Math.log(1-p.prob)*2)),...cur.map(q=>q[0]*sx))*1.02;const N0=st.N0,pd=pDecay(p);
    const T=v=>id==='ln'?(v>0?Math.log(v):NaN):v;const ymax=id==='ln'?Math.log(N0)*1.08:N0*1.05;
    const ax=axes(ctx,box,{xmin:0,xmax,ymin:0,ymax,xl:iso?'Time (half-lives of '+I.name.toLowerCase()+')':'Shakes',yl:id==='ln'?'ln(atoms left)':(iso?'Parent atoms left':'Undecayed candies')});
    ctx.save();ctx.beginPath();ctx.rect(box.L,box.T,box.W,box.H);ctx.clip();
    const line=(pts,col,w,dash)=>{ctx.strokeStyle=col;ctx.lineWidth=w;ctx.setLineDash(dash||[]);ctx.beginPath();let on=false;pts.forEach(q=>{const y=T(q[1]);if(!Number.isFinite(y)){on=false;return;}const X=ax.X(q[0]*sx),Y=ax.Y(y);on?ctx.lineTo(X,Y):ctx.moveTo(X,Y);on=true;});ctx.stroke();ctx.setLineDash([]);};
    runs.forEach(r=>{if(r[0][1]===N0){ctx.globalAlpha=0.25;line(r,serColor(2),1.2);ctx.globalAlpha=1;}});
    const ideal=[];for(let k=0;k<=xmax/sx;k+=0.05)ideal.push([k,N0*Math.pow(1-pd,k)]);line(ideal,PAL['muted'],1.8,[5,4]);
    if(A&&A.n>1)line(A.pts,serColor(1),3);
    line(cur,serColor(0),2.5);cur.forEach(q=>{const y=T(q[1]);if(!Number.isFinite(y))return;ctx.fillStyle=serColor(0);ctx.beginPath();ctx.arc(ax.X(q[0]*sx),ax.Y(y),4.5,0,6.29);ctx.fill();});
    if(id!=='ln'){ctx.strokeStyle=PAL['muted'];ctx.lineWidth=1;ctx.setLineDash([2,4]);[0.5,0.25].forEach(f=>{ctx.beginPath();ctx.moveTo(ax.X(0),ax.Y(N0*f));ctx.lineTo(box.L+box.W,ax.Y(N0*f));ctx.stroke();});ctx.setLineDash([]);}
    ctx.restore();
    const items=[{label:'this run',color:serColor(0)},{label:id==='ln'?'ln N = ln N₀ − kt':'N = N₀(1 − p)ⁿ',color:PAL['muted'],dash:true}];if(A&&A.n>1)items.splice(1,0,{label:'average of '+A.n+' runs',color:serColor(1)});
    legend(ctx,box.L+12,box.T+10,items);},
  infoPanel(sim){const st=sim.st,p=sim.p,hon=atLeast('honors'),ap=atLeast('ap');
    if(p.mode==='date'){const a=age(p.pct),n=Math.log2(100/p.pct);return `<h3>Dating a sample with ${p.pct}% carbon-14 left</h3><p>Living things keep the same carbon-14 level as the air. After death, no new carbon comes in, and the carbon-14 decays with a half-life of 5,730 years.</p>
      <p><b>Half-lives passed:</b> 100% → ${p.pct}% means (½)ⁿ = ${(p.pct/100).toFixed(2)}, so n = log₂(${(100/p.pct).toFixed(2)}) = ${n.toFixed(2)}.</p><p><b>Age</b> = ${n.toFixed(2)} × 5,730 years = <b>${Math.round(a).toLocaleString('en-US')} years</b>.</p>
      ${ap?`<p><b>First-order form:</b> t = ln(N₀/N) / k = ln(${(100/p.pct).toFixed(2)}) / (1.21 × 10⁻⁴ yr⁻¹) = ${Math.round(a).toLocaleString('en-US')} years.</p>`:''}${p.pct<3?'<p>Below about 2% left (over 30,000 years), so little carbon-14 remains that small errors matter a lot. Labs can date to about 50,000 years.</p>':''}`;}
    const rows=st.run.slice(-12).map(q=>`<tr><td>${p.mode==='iso'?(q[0]*p.step).toFixed(2):q[0]}</td><td>${q[1]}</td><td>${(100*q[1]/st.N0).toFixed(1)}%</td>${hon?`<td>${(100*Math.pow(1-pDecay(p),q[0])).toFixed(1)}%</td>`:''}</tr>`).join('');
    const I=isoOf(p);let h=`<h3>${p.mode==='iso'?I.name+' → '+I.d:'Your cup of '+st.N0+' candies'}</h3>`;
    if(p.mode==='iso')h+=`<p>${I.name} decays by ${I.mode} with a half-life of ${fmtT(I.t,I.u)}. Used for ${I.use}. Each time step is ${p.step} half-li${p.step===1?'fe':'ves'} = ${fmtT(p.step*I.t,I.u)}, so each atom has a ${(100*pDecay(p)).toFixed(1)}% chance to decay per step.</p>`;
    else h+=`<p>Each shake, every candy has a ${p.prob===0.5?'1 in 2':p.prob===0.25?'1 in 4':'1 in 6'} chance to “decay”. Candies never wear out: the chance is the same every shake.</p>`;
    h+=`<div class="tbl-wrap"><table><thead><tr><th>${p.mode==='iso'?'Half-lives':'Shake'}</th><th>Left</th><th>Percent</th>${hon?'<th>Predicted</th>':''}</tr></thead><tbody>${rows}</tbody></table></div>`;
    if(ap)h+=`<p style="margin-top:8px">Decay is first order: rate = kN, so N = N₀e^(−kt) with k = ${(-Math.log(1-pDecay(p))).toFixed(3)} per ${p.mode==='iso'?'step':'shake'}. A plot of ln N vs time is a straight line with slope −k.</p>`;
    return h;},
  narrate(sim){const st=sim.st,p=sim.p,hon=atLeast('honors');
    if(p.mode==='date'){const a=age(p.pct),n=Math.log2(100/p.pct);return 'A sample with <b>'+p.pct+'%</b> of its carbon-14 left has been dead for '+n.toFixed(2)+' half-lives: <b>'+Math.round(a).toLocaleString('en-US')+' years</b>.'+(p.pct<3?' That is near the limit of carbon dating.':'');}
    const iso=p.mode==='iso',I=isoOf(p),word=iso?'atoms':'candies';
    if(st.k===0)return iso?'200 '+I.name.toLowerCase()+' atoms. Each time step is '+fmtT(p.step*I.t,I.u)+'. Press <b>Advance one time step</b>: each atom decays at random, but about '+(100*pDecay(p)).toFixed(0)+'% go each step.':'A cup of '+st.N0+' candies, all with the mark facing up (undecayed). Press <b>Shake and pour</b>: any candy that lands blank side up has “decayed” and comes out.';
    const lost=st.run[st.run.length-2][1]-st.n,pct=100*st.n/st.N0;
    let s='That '+(iso?'step':'shake')+' removed <b>'+lost+'</b> '+word+'; <b>'+st.n+'</b> are left ('+pct.toFixed(0)+'% of the start). ';
    if(st.n===0)s+='All gone after '+st.k+' '+(iso?'steps':'shakes')+'. With so few left, chance decides when the last one goes. Run more trials to see the average.';
    else s+=iso?'Expected: '+(100*Math.pow(0.5,st.k*p.step)).toFixed(1)+'%.':(hon?'Prediction: '+(100*Math.pow(1-p.prob,st.k)).toFixed(1)+'%. ':'')+'Each shake removes about the same <b>fraction</b>, not the same number.';
    return s;},
  tour:[
    {title:'A cup of candy atoms',text:'Each candy is one radioactive atom. Mark side up means it has not decayed yet.',focus:[60,110,250,300],pause:true,setup(sim){BioLab.setValues(sim,{mode:'candy',N:100,prob:0.5,auto:false});restart(sim);}},
    {title:'Shake: decay by chance',text:'Shake and pour. Each candy has a 1 in 2 chance of landing blank side up. Those have “decayed”, so they come out of the cup.',focus:[60,110,420,300],speed:0.5,setup(sim){shake(sim);}},
    {title:'Half each time',text:'Shake again. About half of what is left decays each time: 100 → 50 → 25 → 12. The time for half to decay is the half-life: here, 1 shake.',focus:[480,14,310,420],speed:0.5,setup(sim){shake(sim);shake(sim);}},
    {title:'Chance evens out',text:'One run is bumpy. Twenty runs averaged together lie right on the curve N = N₀(½)ⁿ. Real samples hold trillions of atoms, so their decay is perfectly smooth.',focus:[480,14,310,420],speed:1,setup(sim){manyTrials(sim,20);}},
    {title:'Real isotopes',text:'Iodine-131 has a half-life of 8.02 days. Each step here is one half-life, so the atoms left fall 200 → 100 → 50 → 25.',focus:[20,90,440,240],speed:0.5,setup(sim){BioLab.setValues(sim,{mode:'iso',iso:'I131',step:1});restart(sim);shake(sim);shake(sim);}},
    {title:'Carbon dating',text:'A living thing has the same carbon-14 level as the air. After it dies the carbon-14 decays. A sample with 25% left has passed 2 half-lives: 11,460 years.',focus:[10,10,780,430],pause:true,setup(sim){BioLab.setValues(sim,{mode:'date',pct:25});}},
    {lvl:'ap',title:'First-order decay',text:'Decay rate is proportional to the atoms present, so N = N₀e^(−kt). Choose the ln graph below: ln N vs t is a straight line with slope −k = −ln 2 / t½.',focus:[10,10,780,430],pause:true}
  ],
  onTourExit(sim){BioLab.setValues(sim,{mode:'candy',auto:false});restart(sim);},
  onChallenge(sim,ch,phase){if(!ch||!ch.instant||phase!=='done')return;if(ch.set){BioLab.setValues(sim,ch.set);restart(sim);}if(ch.run)ch.run(sim);BioLab.refresh(sim);},
  challenges:[
    {lvl:'bio',instant:true,set:{mode:'candy',N:100,prob:0.5,auto:false},run(sim){manyTrials(sim,20);newRun(sim);shake(sim);shake(sim);},q:'You start with 100 candies. Each shake, half decay on average. About how many are left after 2 shakes?',choices:['About 50','About 25','None'],correct:1,
     explain:{bio:'Half decay in the first shake (about 50 left), then half of those in the second (about 25 left). Two half-lives leave ¼, not zero. The graph shows your run and the average of 20 runs.'}},
    {lvl:'bio',instant:true,set:{mode:'candy',N:200,prob:0.5,auto:false},run(sim){manyTrials(sim,20);},q:'Start with 200 candies instead of 100. How many shakes does it take to lose half of them?',choices:['About 1 shake, the same as before','About 2 shakes, because there are twice as many','Less than 1 shake'],correct:0,
     explain:{bio:'Each candy has the same 1 in 2 chance no matter how many others are in the cup, so half are gone after about 1 shake either way. Half-life does not depend on how much you start with.'}},
    {lvl:'bio',instant:true,set:{mode:'iso',iso:'C14',step:1,auto:false},run(sim){shake(sim);shake(sim);},q:'Carbon-14 has a half-life of 5,730 years. What fraction of a sample is left after 11,460 years?',choices:['½','¼','0','⅛'],correct:1,
     explain:{bio:'11,460 years is 2 half-lives: 1 → ½ → ¼. The model has advanced 2 steps of 5,730 years each; the atoms left are close to 50 of 200.'}},
    {lvl:'honors',instant:true,set:{mode:'candy',N:200,prob:1/6,auto:false},run(sim){manyTrials(sim,20);},q:'Now use dice: an atom decays when it rolls a 6 (1 in 6). What is the half-life?',choices:['6 shakes','About 3.8 shakes','3 shakes','1 shake'],correct:1,
     explain:{honors:'Each shake keeps 5/6. Solve (5/6)ⁿ = ½: n = ln 2 / ln(6/5) = 3.8 shakes. It is not 3, because the survivors shrink by a fraction, not a fixed number. The 20-run average crosses half near 3.8.'}},
    {lvl:'honors',instant:true,set:{mode:'iso',iso:'I131',step:1,auto:false},run(sim){shake(sim);shake(sim);shake(sim);},q:'A patient gets iodine-131 (half-life 8.02 days). What percent is left after about 24 days?',choices:['33%','12.5%','25%','0%'],correct:1,
     explain:{honors:'24 days ≈ 3 half-lives: (½)³ = ⅛ = 12.5%. The model advanced 3 steps of 8.02 days; the Expected percent left readout shows 12.5%.'}},
    {lvl:'honors',instant:true,set:{mode:'candy',N:100,prob:0.5,auto:false},q:'Can you predict which candy in the cup will decay on the next shake?',choices:['No: each one has the same chance, and only the total is predictable','Yes: the ones that have been in the cup longest','Yes: the ones on top'],correct:0,
     explain:{honors:'Decay is random for each atom and has no memory: an old atom is as likely to decay as a new one. Only large numbers behave predictably, which is why half-life describes a sample, not one atom.'}},
    {lvl:'ap',instant:true,set:{mode:'date',pct:25},q:'A bone has 25% of the carbon-14 of living tissue. How old is it? (t½ = 5,730 years)',choices:['4,300 years','11,460 years','17,190 years','22,920 years'],correct:1,
     explain:{ap:'25% = (½)², so 2 half-lives: 2 × 5,730 = 11,460 years. Or t = ln(100/25)/k = 1.386 / 1.21 × 10⁻⁴ yr⁻¹ = 11,460 years. The Age readout agrees.'}},
    {lvl:'ap',instant:true,set:{mode:'date',pct:50},q:'What is the first-order rate constant k for carbon-14 decay?',choices:['1.21 × 10⁻⁴ per year','5,730 per year','8.27 × 10³ per year','1.75 × 10⁻⁴ per year'],correct:0,
     explain:{ap:'k = ln 2 / t½ = 0.693 / 5,730 years = 1.21 × 10⁻⁴ per year. (1.75 × 10⁻⁴ is 1/5,730, which forgets the ln 2.)'}},
    {lvl:'ap',instant:true,set:{mode:'candy',N:200,prob:0.25,auto:false},run(sim){manyTrials(sim,20);},q:'You plot ln(candies left) against shakes for many averaged trials. What do you get?',choices:['A straight line with slope −k','An exponential curve','A straight line with slope −½'],correct:0,
     explain:{ap:'ln N = ln N₀ − kt, so ln N vs t is linear with slope −k = ln(1 − p) = ln(3/4) = −0.288 per shake. Switch the graph to ln(amount left) to see it.'}}
  ],
  lab:{bio:'<p><b>Question:</b> How many shakes does it take for half the candies to decay?</p><ol><li>Start with 100 candies, 1 in 2 chance. Shake and pour, and record a trial after each shake until none are left.</li><li>Plot shakes (x) against undecayed candies (y).</li><li>Press Run 20 more trials and compare your run with the average.</li></ol><p>What is the half-life in shakes? Why is one run bumpier than the average?</p>',
       honors:'<p><b>Question:</b> How does the chance of decay set the half-life?</p><ol><li>Run 20 trials with a 1 in 2, 1 in 4 and 1 in 6 chance. Record the half-life from your data each time.</li><li>Compare with the predicted half-life, ln 2 / −ln(1 − p).</li><li>In Real isotopes, predict the percent of I-131 left after 4 half-lives, then check.</li></ol><p>Explain why a smaller chance per shake gives a longer half-life.</p>',
       ap:'<p><b>Question:</b> Is radioactive decay first order?</p><ol><li>Run 20 trials with a 1 in 4 chance.</li><li>Switch to the ln(amount left) graph. Find the slope.</li><li>Compare the slope with ln(3/4) and calculate t½ = ln 2 / k.</li></ol><p><b>Claim–evidence–reasoning:</b> Show that the decay follows N = N₀e^(−kt). Then use k for carbon-14 to date a sample with 40% of its carbon-14 left.</p>'},
  terms:[{t:'Half-life (t½)',d:'The time for half of the radioactive atoms in a sample to decay.'},{t:'Parent / daughter',d:'The isotope that decays and the one it turns into.'},{t:'Random decay',d:'No one can predict when a single atom will decay; only the average of many is predictable.'},{t:'Carbon dating',d:'Finding the age of once-living material from the fraction of carbon-14 left.'},
    {lvl:'honors',t:'N = N₀(½)ⁿ',d:'Amount left after n half-lives.'},{lvl:'honors',t:'Probability of decay',d:'The chance that one atom decays in a given time step.'},
    {lvl:'ap',t:'First-order decay',d:'Rate = kN, so N = N₀e^(−kt).'},{lvl:'ap',t:'Decay constant (k)',d:'k = ln 2 / t½. Its unit is 1/time.'}],
  about:'<p>Each candy or atom decays independently with probability p per step, using a random number, so every run differs, just as real class data do. In the candy lab, p is 1/2 (two-sided candy), 1/4 or 1/6 (dice). In Real isotopes, a step of s half-lives gives p = 1 − (½)ˢ. The ideal curves are N₀(1 − p)ⁿ and N₀e^(−kt) with k = −ln(1 − p) per step.</p><p>Half-lives are NNDC values, rounded. Carbon dating assumes the carbon-14 level in the air was constant; real labs correct with calibration curves from tree rings, which shift some ages by several hundred years. With only 20–200 “atoms”, chance matters far more than in a real sample, which holds trillions of atoms.</p>',
  initVis(sim){},
  onLevel(sim){syncMode(sim);},
  draw(sim,ctx,vdt,k,t){const p=sim.p,st=sim.st;ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
    if(p.mode==='date')drawDate(sim,ctx,k,t);else if(p.mode==='iso')drawIso(sim,ctx,k,t);else drawCandy(sim,ctx,k,t);
    if(p.mode!=='date')drawSide(sim,ctx,k);},
  thumbSetup(sim){shake(sim);shake(sim);}
};
function candy(ctx,x,y,r,col,mark,a){ctx.save();ctx.translate(x,y);ctx.rotate(a);const g=ctx.createRadialGradient(-r*0.35,-r*0.35,1,0,0,r);g.addColorStop(0,CL.shade(col,0.45));g.addColorStop(1,CL.shade(col,-0.15));ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,r,0,6.29);ctx.fill();
  if(mark){ctx.fillStyle='#fff';ctx.font='700 '+(r*1.1)+'px '+FONT;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('m',0,0.5);}ctx.restore();}
function drawCandy(sim,ctx,k,t){const st=sim.st;const jig=st.shakeT>0&&!RM?Math.sin(t*60)*4*st.shakeT/0.5:0;
  // cup
  ctx.save();ctx.translate(jig,0);ctx.fillStyle=PAL['cv-glass'];ctx.globalAlpha=0.16;ctx.beginPath();ctx.moveTo(66,128);ctx.lineTo(294,128);ctx.lineTo(280,400);ctx.lineTo(80,400);ctx.closePath();ctx.fill();ctx.globalAlpha=1;
  ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(62,124);ctx.lineTo(80,402);ctx.lineTo(280,402);ctx.lineTo(298,124);ctx.stroke();ctx.restore();
  ctx.fillStyle=PAL['cv-bench'];ctx.fillRect(0,402,480,48);
  const r=st.N0>140?7.5:st.N0>80?9:11;const cols=st.N0>100?9:7,dx=st.N0>100?16:19,dy=st.N0>100?13.5:17;
  st.items.forEach(it=>{if(it.alive){candy(ctx,it.x+jig+(st.shakeT>0&&!RM?Math.sin(t*40+it.a*5)*2:0),it.y,r,it.col,true,it.a*0.3);}
    else{const u=clamp(it.out,0,1),e=u*u*(3-2*u),px=330+(it.slot%cols)*dx,py=388-Math.floor(it.slot/cols)*dy;if(py<60)return;candy(ctx,lerp(it.x,px,e),lerp(it.y,py,e)-Math.sin(e*Math.PI)*60,r*0.85,'#9a9aa2',false,0);}});
  txt(ctx,'Cup: '+st.n+' undecayed',180,112,{s:13*k,w:700,a:'center'});
  txt(ctx,'Decayed: '+(st.N0-st.n),400,48,{s:12*k,w:700,a:'center',c:PAL['cv-soft']});if(k<1.4)txt(ctx,'(blank side up)',400,64,{s:12,a:'center',c:PAL['cv-soft']});
  txt(ctx,'Shake '+st.k,18,32,{s:15*k,w:800});}
function drawIso(sim,ctx,k,t){const st=sim.st,p=sim.p,I=isoOf(p);
  txt(ctx,I.name+' → '+I.d,18,32,{s:15*k,w:800});txt(ctx,'Time: '+fmtT(st.k*p.step*I.t,I.u),18,32+22*k,{s:13*k,w:700,c:PAL['rj']});
  const cP='#2d6bd2',cD='#c27a00';st.items.forEach(it=>{const alive=it.alive,u=it.out>0?clamp(it.out,0,1):0;ctx.fillStyle=alive?cP:cD;ctx.beginPath();ctx.arc(it.x,it.y,8,0,6.29);ctx.fill();
    if(!alive&&u<1){ctx.strokeStyle=PAL['s5'];ctx.globalAlpha=1-u;ctx.lineWidth=2;ctx.beginPath();ctx.arc(it.x,it.y,8+u*14,0,6.29);ctx.stroke();ctx.globalAlpha=1;}});
  const ly=346;ctx.fillStyle=cP;ctx.beginPath();ctx.arc(30,ly,8,0,6.29);ctx.fill();txt(ctx,I.name+': '+st.n,44,ly,{s:13*k,w:700,b:'middle'});
  ctx.fillStyle=cD;ctx.beginPath();ctx.arc(30,ly+26*k,8,0,6.29);ctx.fill();txt(ctx,I.d+': '+(200-st.n),44,ly+26*k,{s:13*k,w:700,b:'middle'});
  if(k<1.4)txt(ctx,'1 step = '+fmtT(p.step*I.t,I.u)+' ('+p.step+' half-li'+(p.step===1?'fe':'ves')+'), '+I.mode+' decay',18,428,{s:12*k,c:PAL['cv-soft']});}
function drawSide(sim,ctx,k){const st=sim.st,p=sim.p,iso=p.mode==='iso';const X=486,W=302;rr(ctx,X,14,W,422,12);ctx.fillStyle=PAL['card'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
  // mini bar chart of the run
  const L=X+40,B=376,H=300,run=st.run,n=Math.max(8,run.length),bw=Math.min(26,(W-56)/n);txt(ctx,iso?'Parent atoms left':'Candies left after each shake',X+14,36,{s:Math.min(13*k,19),w:700});
  ctx.strokeStyle=PAL['g-axis'];ctx.beginPath();ctx.moveTo(L,B-H);ctx.lineTo(L,B);ctx.lineTo(X+W-12,B);ctx.stroke();
  [1,0.5,0.25].forEach(f=>{const y=B-H*f;ctx.strokeStyle=PAL['line'];ctx.setLineDash([3,4]);ctx.beginPath();ctx.moveTo(L,y);ctx.lineTo(X+W-12,y);ctx.stroke();ctx.setLineDash([]);txt(ctx,f===1?String(st.N0):f===0.5?'½':'¼',L-6,y,{s:12,a:'right',b:'middle',c:PAL['cv-soft']});});
  const pd=pDecay(p);run.forEach((q,i)=>{const x=L+4+i*bw,h=H*q[1]/st.N0;ctx.fillStyle=serColor(0);ctx.fillRect(x,B-h,bw-3,h);const e=H*Math.pow(1-pd,q[0]);ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x-1,B-e);ctx.lineTo(x+bw-2,B-e);ctx.stroke();
    if(bw>=20&&(k<1.4||i%2===0))txt(ctx,String(q[0]),x+(bw-3)/2,B+15,{s:12,a:'center',c:PAL['cv-soft']});});
  txt(ctx,iso?'time steps →':'shakes →',X+W-14,B+34,{s:12,a:'right',c:PAL['cv-soft']});
  if(k<1.4)legend(ctx,L+4,B+34,[{label:'predicted',color:PAL['cv-ink']}]);}
function drawDate(sim,ctx,k,t){const p=sim.p,a=age(p.pct),ap=atLeast('ap');
  const gx=70,gy=40,gw=400,gh=330,xmax=45000,X=v=>gx+v/xmax*gw,Y=v=>gy+gh-v/100*gh;
  ctx.strokeStyle=PAL['g-axis'];ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(gx,gy);ctx.lineTo(gx,gy+gh);ctx.lineTo(gx+gw,gy+gh);ctx.stroke();
  [0,25,50,75,100].forEach(v=>txt(ctx,v+'%',gx-6,Y(v),{s:12,a:'right',b:'middle',c:PAL['g-axis']}));for(let h=0;h<=7;h++){const v=h*T14;if(v>xmax)break;txt(ctx,(v/1000).toFixed(v%1000?1:0)+'k',X(v),gy+gh+16,{s:12,a:'center',c:PAL['g-axis']});ctx.strokeStyle=PAL['line'];ctx.setLineDash([2,4]);ctx.beginPath();ctx.moveTo(X(v),gy);ctx.lineTo(X(v),gy+gh);ctx.stroke();ctx.setLineDash([]);}
  txt(ctx,'Years since death (dotted lines every half-life)',gx+gw/2,gy+gh+36,{s:12*k,a:'center',c:PAL['cv-soft']});txt(ctx,'Carbon-14 left',gx,gy-14,{s:12*k,w:700,c:PAL['cv-soft']});
  ctx.strokeStyle=PAL['s2'];ctx.lineWidth=3;ctx.beginPath();for(let v=0;v<=xmax;v+=300){const y=Y(100*Math.pow(0.5,v/T14));v?ctx.lineTo(X(v),y):ctx.moveTo(X(v),y);}ctx.stroke();
  if(k<1.4)SAMPLES.forEach(s=>{const v=age(s.pct);ctx.fillStyle=PAL['cv-soft'];ctx.beginPath();ctx.arc(X(v),Y(s.pct),4,0,6.29);ctx.fill();txt(ctx,s.n,X(v)+8,Y(s.pct)-8,{s:12,c:PAL['cv-soft']});});
  if(a<=xmax){ctx.strokeStyle=PAL['rj'];ctx.setLineDash([5,4]);ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(gx,Y(p.pct));ctx.lineTo(X(a),Y(p.pct));ctx.lineTo(X(a),gy+gh);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle=PAL['rj'];ctx.beginPath();ctx.arc(X(a),Y(p.pct),7,0,6.29);ctx.fill();}
  else txt(ctx,'off the chart: older than 45,000 years',gx+gw,gy+gh-14,{s:12*k,w:700,a:'right',c:PAL['rj']});
  const RX=494,RW=294;rr(ctx,RX,14,RW,422,12);ctx.fillStyle=PAL['card'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
  let y=44;const lh=Math.max(22,17*k);txt(ctx,'Your sample',RX+16,y,{s:Math.min(14*k,20),w:700});y+=lh+6;
  txt(ctx,p.pct+'% carbon-14 left',RX+16,y,{s:Math.min(18*k,26),w:800,c:PAL['s2']});y+=lh+8;
  const n=Math.log2(100/p.pct);txt(ctx,'(½)ⁿ = '+(p.pct/100).toFixed(2),RX+16,y,{s:13*k});y+=lh;txt(ctx,'n = '+n.toFixed(2)+' half-lives',RX+16,y,{s:13*k});y+=lh;
  txt(ctx,'age = '+n.toFixed(2)+' × 5,730 y',RX+16,y,{s:13*k});y+=lh+10;txt(ctx,'≈ '+CL.roundSig(a,3).toLocaleString('en-US')+' years',RX+16,y,{s:Math.min(22*k,30),w:800,c:PAL['rj']});y+=lh+14;
  if(ap&&k<1.4){txt(ctx,'t = ln(N₀/N) / k',RX+16,y,{s:13*k,w:700});y+=lh;txt(ctx,'k = ln 2 / 5,730 y = 1.21 × 10⁻⁴ y⁻¹',RX+16,y,{s:12*k,c:PAL['cv-soft']});y+=lh;}
  if(k<1.4){txt(ctx,'Living things: 100% (1 C-14 atom',RX+16,y,{s:12,c:PAL['cv-soft']});txt(ctx,'per 10¹² carbon atoms)',RX+16,y+16,{s:12,c:PAL['cv-soft']});}}
HL.controls[0].onChange=modeChange;
BioLab.register(HL);
})();
