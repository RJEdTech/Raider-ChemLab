(function(){
'use strict';
const {clamp,rng,randn,rr,txt,pill,atLeast,PAL,FONT,RM,lvText}=BioLab.h;
const CL=window.ChemLab;
const SUPD={'-':'⁻','0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹'};
const supE=e=>String(e).split('').map(c=>SUPD[c]||c).join('');
/* always scientific notation with n significant figures */
function sciA(v,n){if(!Number.isFinite(v))return '—';if(v===0)return '0';let e=Math.floor(Math.log10(Math.abs(v)));let m=v/Math.pow(10,e);if(Math.abs(+m.toFixed(n-1))>=10){e++;m=v/Math.pow(10,e);}return m.toFixed(Math.max(0,n-1))+' × 10'+supE(e);}
/* n significant figures, written so the digits show exactly n (trailing decimal point or scientific notation when needed) */
function sigStr(v,n){if(!Number.isFinite(v))return '—';if(v===0)return (0).toFixed(Math.max(0,n-1));const r=CL.roundSig(v,n),e=Math.floor(Math.log10(Math.abs(r)));
  if(e>=n||e<-3)return sciA(r,n);if(e===n-1){const s=r.toFixed(0);return /0$/.test(s)?s+'.':s;}return r.toFixed(n-1-e);}
const MONO='Consolas,"Courier New",ui-monospace,monospace';

/* ---------- instruments ---------- */
const INST={
  c10:{n:'10 mL graduated cylinder',kind:'cyl',olab:1,lo:0,hi:10,div:0.1,lab:1,mid:0.5,dp:2,unit:'mL',win:1.0,vlo:2,vhi:9.4,gran:0.01},
  c50:{n:'50 mL graduated cylinder',kind:'cyl',olab:5,lo:0,hi:50,div:1,lab:5,mid:5,dp:1,unit:'mL',win:8,vlo:12,vhi:46,gran:0.1},
  c100:{n:'100 mL graduated cylinder',kind:'cyl',olab:10,lo:0,hi:100,div:1,lab:10,mid:5,dp:1,unit:'mL',win:13,vlo:16,vhi:92,gran:0.1},
  buret:{n:'50 mL buret',kind:'buret',olab:5,lo:0,hi:50,div:0.1,lab:1,mid:0.5,dp:2,unit:'mL',win:1.1,vlo:1.2,vhi:47,gran:0.01},
  ruler:{n:'Centimeter ruler',kind:'ruler',lo:0,hi:15,div:0.1,lab:1,mid:0.5,dp:2,unit:'cm',win:1.3,vlo:3,vhi:13,gran:0.01},
  thermo:{n:'Thermometer',kind:'thermo',olab:10,lo:-10,hi:110,div:1,lab:10,mid:5,dp:1,unit:'°C',win:9,vlo:14,vhi:88,gran:0.1},
  balance:{n:'Electronic balance',kind:'balance',lo:0,hi:200,div:0.01,dp:2,unit:'g',vlo:5,vhi:160,gran:0.01}
};
const dpOf=s=>{const m=String(s).trim().match(/\.(\d*)$/)||String(s).trim().match(/\.(\d+)/);return m?m[1].length:0;};
function fixd(v,d){return d>=0?v.toFixed(d):String(Math.round(v));}
function newSample(sim){const st=sim.st,I=INST[sim.p.inst];const r=rng(st.seed=(st.seed*16807+11)%2147483647);let v=I.vlo+r()*(I.vhi-I.vlo);v=Math.round(v/I.gran)*I.gran;st.val=+v.toFixed(3);st.ans='';st.res=null;st.reveal=false;}
function gradeRead(sim){const st=sim.st,I=INST[sim.p.inst],s=String(st.ans||'').trim().replace(',','.');const v=parseFloat(s);
  if(!s||!Number.isFinite(v)||!/^[+-]?\d*\.?\d+$|^[+-]?\d+\.$/.test(s)){st.res={k:'bad',m:'Type a number, such as '+fixd(I.vlo+1.5,I.dp)+'.'};return;}
  const d=dpOf(s),tol=I.kind==='balance'?0.0005:I.div*0.2+1e-9,diff=Math.abs(v-st.val);const acc=fixd(st.val,I.dp);
  if(d===I.dp&&diff<=tol){st.res={k:'ok',m:'Right: '+s+' '+I.unit+'. '+(I.kind==='balance'?'A digital readout already includes its estimated digit, so you record every digit shown.':'The digits up to the '+placeName(I.dp-1)+' are certain (you can see the marks), and the '+placeName(I.dp)+' digit is your estimate.')};st.solved=(st.solved||0)+1;return;}
  if(d<I.dp&&Math.abs(v-st.val)<=I.div*1.2)st.res={k:'few',m:'Too few digits. The marks are every '+I.div+' '+I.unit+', so you can be certain to the '+placeName(I.dp-1)+' and must estimate one more digit, to the '+placeName(I.dp)+'.'};
  else if(d>I.dp)st.res={k:'many',m:'Too many digits. This instrument can only be estimated to the '+placeName(I.dp)+' ('+(1/Math.pow(10,I.dp))+' '+I.unit+'). Extra digits claim precision you don’t have.'};
  else if(diff<=I.div*1.5)st.res={k:'close',m:'The right number of digits, but the value is a little off. '+(I.kind==='cyl'||I.kind==='buret'?'Read the bottom of the meniscus, at eye level.':'Look again at where the reading falls between the marks.')};
  else st.res={k:'no',m:'Not quite. Find the two labeled marks on either side of the reading first, then count the small marks between them.'};}
function placeName(dp){return dp<=-1?'tens place':dp===0?'ones place':dp===1?'tenths place':dp===2?'hundredths place':'thousandths place';}

/* ---------- accuracy and precision ---------- */
const ACCEPT=25.00;
function shoot(sim,n){const st=sim.st,p=sim.p;const r=rng(st.seed=(st.seed*48271+7)%2147483647);
  for(let i=0;i<n;i++){const v=ACCEPT+p.bias+p.spread*randn(r);st.darts.push({v:Math.round(v*100)/100,y:p.spread*randn(r)});}if(st.darts.length>30)st.darts=st.darts.slice(-30);}
function stats(st){const n=st.darts.length;if(!n)return {n:0,mean:NaN,range:NaN,sd:NaN};const vs=st.darts.map(d=>d.v),mean=vs.reduce((a,b)=>a+b,0)/n;
  const sd=n>1?Math.sqrt(vs.reduce((a,b)=>a+(b-mean)*(b-mean),0)/(n-1)):NaN;return {n,mean,range:Math.max(...vs)-Math.min(...vs),sd};}
function verdict(st){const S=stats(st);if(S.n<2)return 'Take measurements';const acc=Math.abs(S.mean-ACCEPT)<=0.15,pre=S.sd<=0.15;
  return acc&&pre?'Accurate and precise':pre?'Precise, not accurate':acc?'Accurate on average, not precise':'Neither accurate nor precise';}

/* ---------- significant figures ---------- */
const NUMS=['0.00450','1200','1200.','120.0','405','30.040','0.0700','6.022e23','1.20e-3','100.00'];
function classify(str){str=String(str||'').trim().replace(/^[+−-]/,'').replace(/\s/g,'');let m=str.match(/^(\d*\.?\d*)(?:(?:e|E|×10\^?|x10\^?)([+−-]?\d+))?$/);if(!m||!m[1]||!/\d/.test(m[1]))return null;
  const man=m[1],ex=m[2]!==undefined?parseInt(m[2].replace('−','-'),10):null,hasDot=man.includes('.');const ch=man.split('');const dig=ch.map((c,i)=>c==='.'?null:i).filter(i=>i!==null);
  const nz=dig.filter(i=>ch[i]!=='0');if(!nz.length)return {chars:ch.map(c=>({c,t:c==='.'?'dot':'lead'})),n:hasDot?Math.max(1,(man.split('.')[1]||'').length):1,ex,man,allzero:true};
  const fi=nz[0],li=nz[nz.length-1];const chars=ch.map((c,i)=>({c,t:c==='.'?'dot':i<fi?'lead':c!=='0'?'nz':i<li?'cap':hasDot?'trail':'amb'}));
  const n=chars.filter(x=>x.t==='nz'||x.t==='cap'||x.t==='trail').length;return {chars,n,ex,man,hasDot};}
const RULES={nz:{l:'Nonzero digits always count',sig:true},cap:{l:'Zeros between nonzero digits count',sig:true},trail:{l:'Trailing zeros count when there is a decimal point',sig:true},lead:{l:'Leading zeros never count (they only place the decimal)',sig:false},amb:{l:'Trailing zeros with no decimal point do not count',sig:false}};
function numValue(c){if(!c)return NaN;return parseFloat(c.man)*(c.ex!==null?Math.pow(10,c.ex):1);}
function sciOf(c){const v=numValue(c);if(!Number.isFinite(v)||v===0)return '—';return sciA(v,Math.max(1,c.n));}
function shown(c){return c?(c.man+(c.ex!==null?' × 10'+CL.sup(String(c.ex).replace('-','−')):'')):'';}
function roundStr(v,n){if(!Number.isFinite(v)||v===0)return '—';return sigStr(v,n);}

/* ---------- sig-fig math ---------- */
const TPL={mul:{sym:'×',u:['cm','cm'],ru:'cm²',ctx:'Area of a rectangle: length × width'},div:{sym:'÷',u:['g','mL'],ru:'g/mL',ctx:'Density: mass ÷ volume'},
  add:{sym:'+',u:['cm','cm','cm'],ru:'cm',ctx:'Total length of three pieces'},sub:{sym:'−',u:['g','g'],ru:'g',ctx:'Mass of water: (beaker + water) − beaker'}};
function meas(r,sf,lo,hi){const v=lo+r()*(hi-lo);const e=Math.floor(Math.log10(v));return v.toFixed(Math.max(0,sf-1-e));}
function newProb(sim,op){const st=sim.st;op=op||sim.p.op;const r=rng(st.seed=(st.seed*69621+5)%2147483647);let vals;
  if(op==='mul'){const a=2+Math.floor(r()*3);let b=2+Math.floor(r()*3);if(b===a)b=a===2?3:2;vals=[meas(r,a,2,19),meas(r,b,1.1,9.5)];}
  else if(op==='div'){const a=3+Math.floor(r()*2),b=2+Math.floor(r()*2);vals=[meas(r,a,10,95),meas(r,b,1.2,9.8)];}
  else if(op==='add'){const ds=[2,1,3].sort(()=>r()-0.5);vals=ds.map(d=>(1+r()*30).toFixed(d));}
  else{vals=[(110+r()*40).toFixed(2),(60+r()*30).toFixed(1)];}
  st.prob={op,vals};st.ans='';st.res=null;st.showAns=false;}
function solve(prob){const v=prob.vals.map(parseFloat),op=prob.op;let raw;
  if(op==='mul')raw=v[0]*v[1];else if(op==='div')raw=v[0]/v[1];else if(op==='add')raw=v.reduce((a,b)=>a+b,0);else raw=v[0]-v[1];
  const sfs=prob.vals.map(s=>CL.sigFigs(s)),dps=prob.vals.map(dpOf);let ans,rule,lim;
  if(op==='mul'||op==='div'){lim=Math.min(...sfs);ans=sigStr(raw,lim);rule='× and ÷: keep the fewest significant figures ('+lim+')';}
  else{lim=Math.min(...dps);ans=raw.toFixed(lim);rule='+ and −: keep the fewest decimal places ('+lim+')';}
  const us=prob.vals.map(s=>Math.pow(10,-dpOf(s)));let unc,uncText;
  if(op==='mul'||op==='div'){const rel=us.reduce((a,u,i)=>a+u/v[i],0);unc=rel*Math.abs(raw);uncText='±'+(rel*100).toFixed(1)+'% (relative uncertainties add) = ±'+CL.toSig(unc,1)+' '+TPL[op].ru;}
  else{unc=us.reduce((a,b)=>a+b,0);uncText='±'+CL.toSig(unc,1)+' '+TPL[op].ru+' (absolute uncertainties add)';}
  return {raw,ans,rule,lim,sfs,dps,unc,uncText};}
function parseNum(s){s=String(s).trim().replace(/−/g,'-');const RS={'⁻':'-','⁰':'0','¹':'1','²':'2','³':'3','⁴':'4','⁵':'5','⁶':'6','⁷':'7','⁸':'8','⁹':'9'};s=s.replace(/[⁻⁰¹²³⁴⁵⁶⁷⁸⁹]/g,c=>RS[c]);
  s=s.replace(/\s*[×x\*]\s*10\^?\s*/,'e');return {v:parseFloat(s),man:s.split(/[eE]/)[0]};}
function gradeMath(sim){const st=sim.st,S=solve(st.prob),P0=parseNum(st.ans||''),s=P0.man;const v=P0.v;
  if(!s||!Number.isFinite(v)){st.res={k:'bad',m:'Type your rounded answer, such as '+S.ans.replace(/\d/g,'#')+'.'};return;}
  const A=parseNum(S.ans).v;const same=Math.abs(v-A)<=Math.abs(A)*1e-9+1e-12;const mul=st.prob.op==='mul'||st.prob.op==='div';
  const okDigits=mul?CL.sigFigs(s)===S.lim:dpOf(s)===S.lim;
  if(same&&okDigits){st.res={k:'ok',m:'Right: '+S.ans+' '+TPL[st.prob.op].ru+'. '+S.rule+'.'};st.showAns=true;}
  else if(Math.abs(v-S.raw)<Math.abs(S.raw)*0.02)st.res={k:'few',m:'The value is right, but the digits are not. '+S.rule+'.'};
  else st.res={k:'no',m:'Check the arithmetic first, then round. '+S.rule+'.'};}

/* ---------- mode visibility ---------- */
function syncModes(sim){if(!atLeast('honors')&&sim.p.mode==='math')BioLab.setValues(sim,{mode:'read'});if(!sim.ui||!sim.ui.sec)return;const d=sim.def,m=sim.p.mode;
  d.controls.forEach(c=>{if(!c.modes)return;const cid=d.id+'-'+c.id,e=document.getElementById(cid)||document.getElementById(cid+'-l');const w=e&&e.closest('.ctl');if(w)w.hidden=!atLeast(c.lvl)||!c.modes.includes(m);});
  d.metrics.forEach(mm=>{if(!mm.modes)return;const t=sim.ui.tiles[mm.id];const w=t&&t.num.closest('.tile');if(w)w.hidden=!atLeast(mm.lvl)||!mm.modes.includes(m);});
  const btns=[...sim.ui.sec.querySelectorAll('.controls .actions button')];d.actions.forEach((a,i)=>{const b=btns[i];if(b)b.hidden=!atLeast(a.lvl)||!a.modes.includes(m);});}

/* ---------- challenges ---------- */
const CH=[
  {lvl:'bio',q:'A 50 mL graduated cylinder is marked every 1 mL. The bottom of the meniscus sits halfway between 36 and 37 mL. How do you record it?',choices:['36 mL','36.5 mL','36.50 mL'],correct:1,instant:true,show:{mode:'read',inst:'c50'},val:36.5,
   explain:'Record every certain digit plus one estimated digit. The marks are every 1 mL, so 36 is certain and the tenths (.5) is your estimate. 36.50 mL would claim you can see hundredths, which you cannot. The model now shows this reading.'},
  {lvl:'bio',q:'How many significant figures are in 0.00450?',choices:['6','5','3'],correct:2,instant:true,show:{mode:'sig',num:'0.00450'},
   explain:'The leading zeros only place the decimal point, so they never count. The 4 and 5 count, and the trailing 0 after a decimal point counts: 3 significant figures. In scientific notation it is 4.50 × 10⁻³.'},
  {lvl:'bio',q:'Ten measurements of a 25.00 g mass land in a tight cluster, but far from 25.00 g. The measurements are…',choices:['accurate but not precise','precise but not accurate','accurate and precise'],correct:1,instant:true,show:{mode:'acc',bias:0.6,spread:0.04},shoot:true,
   explain:'Precision is how close the measurements are to each other; accuracy is how close they are to the true value. A tight cluster off-center is precise but not accurate, often a sign of a systematic error such as a balance that was not zeroed.'},
  {lvl:'bio',q:'Where do you read the volume in a graduated cylinder?',choices:['At the top edge of the curved surface','At the bottom of the meniscus, with your eye level with it','Anywhere on the curve'],correct:1,instant:true,show:{mode:'read',inst:'c10'},
   explain:'Water curves up the glass, making a meniscus. Read the bottom of the curve with your eye at the same height. Looking from above or below (parallax) makes the reading wrong.'},
  {lvl:'honors',q:'12.11 cm + 18.0 cm + 1.013 cm = 31.123 cm on a calculator. How do you report it?',choices:['31.123 cm','31.12 cm','31.1 cm'],correct:2,instant:true,show:{mode:'math',op:'add'},prob:{op:'add',vals:['12.11','18.0','1.013']},
   explain:'For addition and subtraction, round to the fewest decimal places. 18.0 cm is known only to the tenths, so the sum is too: 31.1 cm. The model now shows the columns lined up.'},
  {lvl:'honors',q:'A sample has a mass of 4.56 g and a volume of 1.4 mL. 4.56 ÷ 1.4 = 3.2571… How do you report the density?',choices:['3.26 g/mL','3.3 g/mL','3 g/mL'],correct:1,instant:true,show:{mode:'math',op:'div'},prob:{op:'div',vals:['4.56','1.4']},
   explain:'For multiplication and division, keep the fewest significant figures. 1.4 mL has 2, so the answer has 2: 3.3 g/mL.'},
  {lvl:'honors',q:'How many significant figures are in 1200 (written with no decimal point)?',choices:['2','3','4'],correct:0,instant:true,show:{mode:'sig',num:'1200'},
   explain:'Trailing zeros with no decimal point only hold places, so 1200 has 2 significant figures. Write 1200. or 1.200 × 10³ to show 4.'},
  {lvl:'ap',q:'Your measurements of a 25.00 g standard average 25.40 g. What is the percent error?',choices:['0.40%','1.6%','16%'],correct:1,instant:true,show:{mode:'acc',bias:0.4,spread:0.03},shoot:true,
   explain:'Percent error = |measured − accepted| ÷ accepted × 100 = 0.40 ÷ 25.00 × 100 = 1.6%. The model now shows a set like this; its % error tile is computed from the actual mean.'},
  {lvl:'ap',q:'A rectangle measures (10.0 ± 0.1) cm by (5.0 ± 0.1) cm. About how big is the relative uncertainty of its area?',choices:['about 0.2%','about 1%','about 3%'],correct:2,instant:true,show:{mode:'math',op:'mul'},prob:{op:'mul',vals:['10.0','5.0']},
   explain:'For multiplication, relative uncertainties add: 0.1/10.0 = 1% and 0.1/5.0 = 2%, so about 3%. The area is 50. cm² ± 1.5 cm². The smallest measurement controls the uncertainty.'},
  {lvl:'ap',q:'Round 0.0004655 to 2 significant figures.',choices:['0.00','0.00047','0.0005'],correct:1,instant:true,show:{mode:'sig',num:'0.0700'},
   explain:'Skip the leading zeros: the first two significant digits are 4 and 6, and the next digit (5) rounds up: 0.00047, or 4.7 × 10⁻⁴.'}
];

const SIM={
  id:'measure',hash:'measure',apUnit:0,order:2,kind:'Lab skills',tab:'Measurement and sig figs',
  card:'Read graduated cylinders, a buret, a ruler and a thermometer to the right digit, then practice accuracy, precision and significant figures.',
  title:'Measurement, uncertainty and significant figures',
  prereq:['labbench'],next:['units','density'],
  lede:{bio:'Read real lab instruments to the right number of digits: every digit you are sure of, plus one estimated digit. Then see the difference between accuracy and precision.',
        honors:'Count significant figures and carry them through calculations: fewest sig figs for × and ÷, fewest decimal places for + and −.',
        ap:'Quantify uncertainty: standard deviation of repeated trials, percent error, and how uncertainty propagates through a calculation.'},
  scale:{bio:'Real instrument scales: a 10 mL cylinder is about 15 cm tall and marked every 0.1 mL; the zoom circle magnifies the scale near the liquid level.',
         ap:'Rule of thumb used here: each reading is uncertain by ±1 in its last (estimated) digit.'},
  timeless:true,animated:true,graph:false,
  controls:[
    {id:'mode',label:'Activity',type:'seg',def:'read',lvl:'bio',noTrial:true,options:[{v:'read',l:'Read an instrument'},{v:'acc',l:'Accuracy and precision'},{v:'sig',l:'Sig fig counter'},{v:'math',l:'Sig fig math',lvl:'honors'}],onChange(sim){sim.st.res=null;sim.st.ans='';syncModes(sim);}},
    {id:'inst',label:'Instrument',type:'select',def:'c10',lvl:'bio',modes:['read'],options:[{v:'c10',l:'10 mL graduated cylinder'},{v:'c50',l:'50 mL graduated cylinder'},{v:'c100',l:'100 mL graduated cylinder'},{v:'buret',l:'50 mL buret',lvl:'honors'},{v:'ruler',l:'Centimeter ruler'},{v:'thermo',l:'Thermometer'},{v:'balance',l:'Electronic balance'}],onChange(sim){newSample(sim);}},
    {id:'bias',label:'Systematic error (bias)',type:'range',min:-1.5,max:1.5,step:0.05,def:0,unit:' g',lvl:'bio',modes:['acc'],help:'Shifts every measurement the same way, like a balance that was not zeroed.',onChange(sim){sim.st.darts=[];shoot(sim,10);}},
    {id:'spread',label:'Random error (spread)',type:'range',min:0.02,max:0.8,step:0.02,def:0.06,unit:' g',lvl:'bio',modes:['acc'],help:'Scatters measurements, like drafts or a shaky hand.',onChange(sim){sim.st.darts=[];shoot(sim,10);}},
    {id:'num',label:'Number',type:'select',def:'0.00450',lvl:'bio',noTrial:true,modes:['sig'],options:NUMS.map(n=>({v:n,l:n.replace(/e(-?\d+)/,(a,e)=>' × 10^'+e)})),help:'Or type your own number in the box below the picture.',onChange(sim){sim.st.custom='';}},
    {id:'round',label:'Round to',type:'range',min:1,max:5,step:1,def:2,unit:' sig figs',lvl:'honors',noTrial:true,modes:['sig']},
    {id:'op',label:'Operation',type:'seg',def:'div',lvl:'honors',noTrial:true,modes:['math'],options:[{v:'mul',l:'×'},{v:'div',l:'÷'},{v:'add',l:'+'},{v:'sub',l:'−'}],onChange(sim){newProb(sim);}}
  ],
  actions:[
    {id:'new',label:'New sample',lvl:'bio',primary:true,modes:['read'],run(sim){newSample(sim);}},
    {id:'show',label:'Show the answer',lvl:'bio',modes:['read','math'],run(sim){if(sim.p.mode==='math')sim.st.showAns=true;else sim.st.reveal=true;}},
    {id:'ten',label:'Take 10 measurements',lvl:'bio',primary:true,modes:['acc'],run(sim){sim.st.darts=[];shoot(sim,10);}},
    {id:'one',label:'Measure once more',lvl:'bio',modes:['acc'],run(sim){shoot(sim,1);}},
    {id:'prob',label:'New problem',lvl:'honors',primary:true,modes:['math'],run(sim){newProb(sim);}}
  ],
  init(sim){const st={seed:20261024,val:0,ans:'',res:null,reveal:false,darts:[],custom:'',prob:null,showAns:false,solved:0};sim.st=st;newSample(sim);shoot(sim,10);newProb(sim,sim.p.op);return st;},
  step(){},
  metrics:[
    {id:'marks',label:'Smallest marks',unit:'',lvl:'bio',text:true,modes:['read'],get:s=>{const I=INST[s.p.inst];return I.kind==='balance'?'Digital, 0.01 g':'every '+I.div+' '+I.unit;}},
    {id:'recto',label:'Record to the nearest',unit:'',lvl:'bio',text:true,modes:['read'],get:s=>{const I=INST[s.p.inst];return (1/Math.pow(10,I.dp)).toFixed(I.dp)+' '+I.unit;}},
    {id:'yours',label:'Your reading',unit:'',lvl:'bio',text:true,modes:['read'],get:s=>s.st.ans?s.st.ans+' '+INST[s.p.inst].unit:'Type it in the box'},
    {id:'acc',label:'Accepted reading',unit:'',lvl:'bio',text:true,modes:['read'],get:s=>(s.st.reveal||(s.st.res&&s.st.res.k==='ok'))?fixd(s.st.val,INST[s.p.inst].dp)+' '+INST[s.p.inst].unit:'Hidden until you check'},
    {id:'n',label:'Measurements',unit:'',lvl:'bio',min:0,max:30,d:0,modes:['acc'],get:s=>s.st.darts.length},
    {id:'mean',label:'Mean',unit:'g',lvl:'bio',min:0,max:null,d:2,modes:['acc'],get:s=>stats(s.st).mean},
    {id:'pct',label:'Percent error',unit:'%',lvl:'bio',min:0,max:6,d:2,modes:['acc'],get:s=>{const m=stats(s.st).mean;return Number.isFinite(m)?Math.abs(m-ACCEPT)/ACCEPT*100:NaN;}},
    {id:'range',label:'Range (max − min)',unit:'g',lvl:'honors',min:0,max:null,d:2,modes:['acc'],get:s=>stats(s.st).range},
    {id:'sd',label:'Standard deviation s',unit:'g',lvl:'ap',min:0,max:null,d:3,modes:['acc'],get:s=>stats(s.st).sd},
    {id:'verdict',label:'These measurements are',unit:'',lvl:'bio',text:true,modes:['acc'],get:s=>verdict(s.st)},
    {id:'sf',label:'Significant figures',unit:'',lvl:'bio',min:0,max:8,d:0,noTrial:true,modes:['sig'],get:s=>{const c=classify(s.st.custom||s.p.num);return c?c.n:NaN;}},
    {id:'sci',label:'In scientific notation',unit:'',lvl:'bio',text:true,noTrial:true,modes:['sig'],get:s=>{const c=classify(s.st.custom||s.p.num);return c?sciOf(c):'Not a number';}},
    {id:'rounded',label:'Rounded',unit:'',lvl:'honors',text:true,noTrial:true,modes:['sig'],get:s=>{const c=classify(s.st.custom||s.p.num);return c?roundStr(numValue(c),s.p.round):'—';}},
    {id:'rule',label:'Rule that applies',unit:'',lvl:'honors',text:true,noTrial:true,modes:['math'],get:s=>solve(s.st.prob).rule},
    {id:'ansm',label:'Reported answer',unit:'',lvl:'honors',text:true,noTrial:true,modes:['math'],get:s=>s.st.showAns?solve(s.st.prob).ans+' '+TPL[s.st.prob.op].ru:'Hidden: type yours first'},
    {id:'unc',label:'Propagated uncertainty',unit:'',lvl:'ap',text:true,noTrial:true,modes:['math'],get:s=>solve(s.st.prob).uncText}
  ],
  infoPanel(sim){const p=sim.p,st=sim.st,hon=atLeast('honors'),ap=atLeast('ap');
    const box=(lab,ph,btn)=>'<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:6px 0 10px"><label for="measure-ans" style="font-weight:600">'+lab+'</label><input id="measure-ans" class="sel" inputmode="decimal" autocomplete="off" style="flex:1 1 120px;min-width:0;max-width:220px;font-size:17px;padding:6px 10px" placeholder="'+ph+'" value="'+String(st.ans||st.custom||'').replace(/"/g,'')+'"><button type="button" class="btn primary" id="measure-check">'+btn+'</button></div>';
    const fb=()=>st.res?'<p class="verdict '+(st.res.k==='ok'?'ok':'no')+'">'+(st.res.k==='ok'?'Correct.':st.res.k==='bad'?'Not a number.':'Not yet.')+'</p><p>'+st.res.m+'</p>':'';
    if(p.mode==='read'){const I=INST[p.inst];let h='<div class="p-head"><h3>Record your reading</h3></div><p>'+(I.kind==='balance'?'Write down the balance reading.':'Look at the zoom circle. Write every digit you are sure of, then estimate one more.')+'</p>'+box('Reading ('+I.unit+')',fixd(0,I.dp).replace(/0/g,'#'),'Check')+fb();
      if(hon&&I.kind!=='balance')h+='<p><b>Certain digits</b> come from the marks you can see. The <b>estimated digit</b> is your best guess between two marks, so it can differ by ±'+(I.div/5)+' '+I.unit+' from someone else’s.</p>';
      return h;}
    if(p.mode==='sig'){let h='<div class="p-head"><h3>Try any number</h3></div>'+box('Number','e.g. 0.0250 or 3.0e8','Count');const c=st.custom?classify(st.custom):null;
      if(st.custom&&!c)h+='<p class="verdict no">That doesn’t look like a number.</p><p>Use digits, one decimal point, and e for powers of ten (6.02e23).</p>';
      else if(c)h+='<p><b>'+shown(c)+'</b> has <b>'+c.n+'</b> significant figure'+(c.n===1?'':'s')+'.</p>';
      h+='<p>The rules: nonzero digits count; zeros between them count; leading zeros never count; trailing zeros count only when there is a decimal point.</p>';return h;}
    if(p.mode==='math'){const S=solve(st.prob);let h='<div class="p-head"><h3>Round the answer</h3></div><p>'+TPL[st.prob.op].ctx+'. The calculator says '+S.raw.toPrecision(10).replace(/\.?0+$/,'')+'. What do you report?</p>'+box('Answer ('+TPL[st.prob.op].ru+')','','Check')+fb();
      if(ap)h+='<p><b>Uncertainty:</b> each measurement is ±1 in its last digit. '+S.uncText+'.</p>';return h;}
    const S=stats(st);let h='<div class="p-head"><h3>Accuracy versus precision</h3></div><p><b>Accuracy:</b> how close the mean is to the accepted value (25.00 g). <b>Precision:</b> how close the measurements are to each other.</p>';
    if(S.n)h+='<p>Percent error = |'+S.mean.toFixed(2)+' − 25.00| ÷ 25.00 × 100 = <b>'+(Math.abs(S.mean-ACCEPT)/ACCEPT*100).toFixed(2)+'%</b></p>';
    if(ap&&S.n>1)h+='<p>Standard deviation s = √(Σ(x − x̄)² ÷ (n − 1)) = <b>'+S.sd.toFixed(3)+' g</b>. About 68% of measurements fall within x̄ ± s.</p>';return h;},
  bindInfo(sim,el){const inp=el.querySelector('#measure-ans'),btn=el.querySelector('#measure-check');if(!inp)return;
    const go=()=>{const st=sim.st,m=sim.p.mode;if(m==='read'){st.ans=inp.value;gradeRead(sim);}else if(m==='math'){st.ans=inp.value;gradeMath(sim);}else{st.custom=inp.value.trim();}sim.vis.refocus=true;BioLab.refresh(sim);};
    inp.addEventListener('input',()=>{if(sim.p.mode==='sig')return;sim.st.ans=inp.value;});inp.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();go();}});btn.addEventListener('click',go);
    if(sim.vis.refocus){sim.vis.refocus=false;inp.focus();}},
  narrate(sim){const p=sim.p,st=sim.st;
    if(p.mode==='read'){const I=INST[p.inst];if(st.res)return '<b>'+(st.res.k==='ok'?'Correct.':'Not yet.')+'</b> '+st.res.m;if(st.reveal)return 'The accepted reading is <b>'+fixd(st.val,I.dp)+' '+I.unit+'</b>. Press New sample to try another.';
      if(I.kind==='balance')return 'A digital balance does the estimating for you: its last digit is the estimated one. <b>Record every digit shown</b>, including trailing zeros.';
      return 'This '+I.n.charAt(0).toLowerCase()+I.n.slice(1)+' is marked every <b>'+I.div+' '+I.unit+'</b>, so you can be certain to the '+placeName(I.dp-1)+' and estimate the <b>'+placeName(I.dp)+'</b>. '+(I.kind==='cyl'||I.kind==='buret'?'Read the bottom of the meniscus at eye level.':'')+(I.kind==='buret'?' A buret reads from the top down.':'');}
    if(p.mode==='acc'){const S=stats(st),v=verdict(st);if(S.n<2)return 'Press <b>Take 10 measurements</b> to weigh the 25.00 g standard mass ten times.';
      return '<b>'+v+'.</b> The mean is '+S.mean.toFixed(2)+' g ('+(Math.abs(S.mean-ACCEPT)/ACCEPT*100).toFixed(1)+'% error). '+(Math.abs(p.bias)>0.15?'The bias shifts every measurement the same way: a <b>systematic error</b>. Averaging more trials does not remove it.':p.spread>0.15?'The spread is <b>random error</b>: more trials make the mean more reliable.':'Small bias and small spread: good technique on a calibrated balance.');}
    if(p.mode==='sig'){const c=classify(st.custom||p.num);if(!c)return 'Type a number to count its significant figures.';const has=t=>c.chars.some(x=>x.t===t);
      return '<b>'+shown(c)+'</b> has <b>'+c.n+' significant figure'+(c.n===1?'':'s')+'</b>. '+(has('lead')?'Its leading zeros only show where the decimal point goes. ':'')+(has('amb')?'Its trailing zeros have no decimal point, so they don’t count. ':'')+(has('trail')?'Its trailing zeros after the decimal point were measured, so they count. ':'')+(c.ex!==null?'The power of ten never adds significant figures.':'');}
    const S=solve(st.prob),T=TPL[st.prob.op];return T.ctx+'. '+(st.prob.op==='mul'||st.prob.op==='div'?'Your answer can’t be more precise than your <b>least precise measurement</b>, so keep '+S.lim+' significant figure'+(S.lim===1?'':'s')+'.':'Line up the decimal points: the answer stops at the <b>least precise column</b>, '+S.lim+' decimal place'+(S.lim===1?'':'s')+'.');},
  tour:[
    {title:'Read the marks you can see',text:'This 10 mL cylinder is marked every 0.1 mL, with numbers every 1 mL. The zoom circle magnifies the scale right at the liquid surface.',focus:[[20,40,300,400],[372,36,386,388]],pause:true,setup(sim){BioLab.setValues(sim,{mode:'read',inst:'c10'});sim.st.val=6.43;sim.st.res=null;sim.st.reveal=false;}},
    {title:'The bottom of the meniscus',text:'Water curves up the glass. Read the bottom of the curve with your eye at the same level; the dashed line shows eye level.',focus:[372,150,386,160],pause:true},
    {title:'Certain digits plus one estimate',text:'The bottom sits between 6.4 and 6.5 mL, a little less than halfway: record <b>6.43 mL</b>. 6.4 is certain; the 3 is your estimate.',focus:[372,36,386,388],pause:true,setup(sim){sim.st.reveal=true;}},
    {title:'Digital instruments',text:'A digital balance shows its estimated digit for you. Record every digit shown, even a trailing zero.',focus:[0,0,800,450],pause:true,setup(sim){BioLab.setValues(sim,{inst:'balance'});sim.st.val=36.40;sim.st.reveal=true;}},
    {title:'Accuracy and precision',text:'Now weigh a 25.00 g standard ten times. Systematic error (bias) moves the whole cluster; random error spreads it out.',focus:[0,0,800,450],pause:true,setup(sim){BioLab.setValues(sim,{mode:'acc',bias:0.6,spread:0.05});}},
    {title:'Counting significant figures',text:'In 0.00450 the leading zeros don’t count, but the trailing zero after the decimal point does: 3 significant figures.',focus:[0,0,800,450],pause:true,setup(sim){BioLab.setValues(sim,{mode:'sig',num:'0.00450'});}},
    {lvl:'honors',title:'Sig figs in calculations',text:'For × and ÷ keep the fewest significant figures. For + and − line up the decimals and keep the fewest decimal places.',focus:[0,0,800,450],pause:true,setup(sim){BioLab.setValues(sim,{mode:'math',op:'add'});sim.st.prob={op:'add',vals:['12.11','18.0','1.013']};sim.st.showAns=true;}},
    {lvl:'ap',title:'Uncertainty propagates',text:'Each measurement is ±1 in its last digit. Absolute uncertainties add for + and −; relative (percent) uncertainties add for × and ÷.',focus:[0,0,800,450],pause:true,setup(sim){BioLab.setValues(sim,{mode:'math',op:'mul'});sim.st.prob={op:'mul',vals:['10.0','5.0']};sim.st.showAns=true;}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{mode:'read',inst:'c10'});newSample(sim);syncModes(sim);},
  challenges:CH,
  onChallenge(sim,ch,phase){if(!ch||phase!=='done'||!ch.show)return;BioLab.setValues(sim,ch.show);const st=sim.st;
    if(ch.val!==undefined){st.val=ch.val;st.reveal=true;st.res=null;st.ans='';}if(ch.prob){st.prob={op:ch.prob.op,vals:ch.prob.vals.slice()};st.showAns=true;st.res=null;st.ans='';}
    if(ch.shoot){st.darts=[];shoot(sim,10);}if(ch.show.mode==='sig')st.custom='';syncModes(sim);},
  onLevel(sim){syncModes(sim);},
  lab:{bio:'<p><b>Question:</b> How precisely can you read each instrument?</p><ol><li>In <b>Read an instrument</b>, read three samples on each instrument. Type your reading and press Check.</li><li>Press <b>Record trial</b> after each one so your reading and the accepted reading go in the table.</li><li>In <b>Accuracy and precision</b>, make one set that is precise but not accurate, and one that is accurate but not precise. Record both.</li></ol><p>Which instrument gave you the most digits? Explain why a 10 mL cylinder is more precise than a 100 mL cylinder.</p>',
       honors:'<p><b>Question:</b> How do significant figures carry through a calculation?</p><ol><li>In <b>Sig fig math</b>, solve two problems for each operation. Type your answer before you look.</li><li>Write which measurement limited each answer.</li><li>Use the <b>Sig fig counter</b> to check five numbers from your notes.</li></ol><p>Explain why the rules for + and − are different from the rules for × and ÷.</p>',
       ap:'<p><b>Question:</b> How do random and systematic error affect a result?</p><ol><li>Set bias 0 and spread 0.30 g. Take 10 measurements three times and record the mean, s and % error each time.</li><li>Repeat with bias +0.50 g and spread 0.05 g.</li><li>In <b>Sig fig math</b>, compare the propagated uncertainty for × and + problems.</li></ol><p><b>Claim–evidence–reasoning:</b> Which kind of error does repeating trials reduce, and which does it not? Use your s and % error values.</p>'},
  terms:[{t:'Estimated digit',d:'The last digit of a reading, estimated between the smallest marks.'},{t:'Meniscus',d:'The curved surface of a liquid in a narrow tube. Read the bottom of it at eye level.'},{t:'Accuracy',d:'How close a measurement is to the accepted (true) value.'},{t:'Precision',d:'How close repeated measurements are to each other.'},{t:'Significant figures',d:'All the certain digits in a measurement plus the one estimated digit.'},{t:'Percent error',d:'|measured − accepted| ÷ accepted × 100.'},
    {lvl:'honors',t:'Systematic error',d:'An error that shifts every measurement the same way, such as an unzeroed balance. It hurts accuracy.'},{lvl:'honors',t:'Random error',d:'Unpredictable scatter from reading to reading. It hurts precision and averages out over many trials.'},{lvl:'honors',t:'Scientific notation',d:'A number written as a coefficient between 1 and 10 times a power of ten, such as 4.50 × 10⁻³.'},
    {lvl:'ap',t:'Standard deviation',d:'s = √(Σ(x − x̄)² ÷ (n − 1)), a measure of the spread of repeated measurements.'},{lvl:'ap',t:'Propagation of uncertainty',d:'How the uncertainties of measurements combine in a calculated result.'}],
  about:'<p>Instrument scales follow common lab equipment: 10 mL cylinders marked every 0.1 mL, 50 and 100 mL cylinders every 1 mL, a 50 mL buret every 0.1 mL (reading downward), a ruler in millimeters, and a thermometer every 1 °C. A reading is graded correct when it has exactly one estimated digit and is within ±0.2 of the smallest division of the true level, because estimates legitimately differ that much between careful people.</p><p>Accuracy and precision: each “measurement” of the 25.00 g standard is the true mass plus the bias plus normally distributed random error with the chosen spread, rounded to 0.01 g. Verdicts use ±0.15 g for both the mean and s.</p><p>Significant figure rules are the standard textbook rules; a number like 1200 is treated as having 2 significant figures. Uncertainty propagation uses the simple worst-case rule (add absolute uncertainties for + and −, add relative uncertainties for × and ÷); a statistics course would add them in quadrature, which gives slightly smaller values.</p>',
  initVis(sim){syncModes(sim);},
  thumbSetup(sim){sim.st.val=6.43;},thumbFrames:2,
  draw(sim,ctx,vdt,k,t){ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);const m=sim.p.mode;
    if(m==='acc')return drawAcc(sim,ctx,k);if(m==='sig')return drawSig(sim,ctx,k);if(m==='math')return drawMath(sim,ctx,k);drawRead(sim,ctx,k,t);}
};

/* ---------- read-an-instrument drawing ---------- */
const ZX=565,ZY=230,ZR=188;
function drawRead(sim,ctx,k,t){const p=sim.p,st=sim.st,I=INST[p.inst],v=st.val;
  const lines=[I.n,I.kind==='balance'?'Digital readout, 0.01 g':'Marks every '+I.div+' '+I.unit];txt(ctx,lines[0],24,30,{s:15*k,w:700});txt(ctx,lines[1],24,30+20*k,{s:13*k,c:PAL['cv-soft']});
  let zoomRect=null;
  if(I.kind==='cyl'||I.kind==='buret'||I.kind==='thermo'){const x=I.kind==='cyl'?150:150,top=50+30*k,bot=420;const w=I.kind==='cyl'?(p.inst==='c10'?26:p.inst==='c50'?40:52):I.kind==='buret'?16:12;
    const y0=top+16,y1=bot-14;const frac=(I.kind==='buret')?(v-I.lo)/(I.hi-I.lo):(v-I.lo)/(I.hi-I.lo);const Y=u=>I.kind==='buret'?y0+(u-I.lo)/(I.hi-I.lo)*(y1-y0):y1-(u-I.lo)/(I.hi-I.lo)*(y1-y0);
    if(I.kind==='thermo'){rr(ctx,x-w/2,top,w,bot-top,w/2);ctx.save();ctx.globalAlpha=0.35;ctx.fillStyle=PAL['cv-bg2'];ctx.fill();ctx.restore();ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=2;ctx.stroke();
      ctx.fillStyle='#d23a3a';ctx.beginPath();ctx.arc(x,bot,13,0,6.29);ctx.fill();ctx.fillRect(x-2.5,Y(v),5,bot-Y(v));}
    else{ctx.beginPath();ctx.moveTo(x-w/2,top);ctx.lineTo(x-w/2,bot);ctx.lineTo(x+w/2,bot);ctx.lineTo(x+w/2,top);ctx.save();ctx.globalAlpha=0.35;ctx.fillStyle=PAL['cv-bg2'];ctx.fill();ctx.restore();
      ctx.save();ctx.globalAlpha=0.6;ctx.fillStyle='#5aa7dd';if(I.kind==='buret')ctx.fillRect(x-w/2,Y(v),w,bot-Y(v));else ctx.fillRect(x-w/2,Y(v),w,bot-Y(v));ctx.restore();ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=2.4;ctx.stroke();
      if(I.kind==='cyl'){ctx.fillStyle=PAL['cv-glass'];ctx.fillRect(x-w/2-14,bot,w+28,8);}else{ctx.fillStyle='#2c6db0';rr(ctx,x-14,bot+2,28,7,3);ctx.fill();}}
    ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1;const step=I.olab;for(let u=I.lo;u<=I.hi+1e-9;u+=step){const y=Y(u);ctx.beginPath();ctx.moveTo(x+w/2,y);ctx.lineTo(x+w/2+8,y);ctx.stroke();
      if(k<1.3||(Math.round(u/step)%2===0))txt(ctx,String(+u.toFixed(1)),x+w/2+12,y,{s:12*k,c:PAL['cv-soft'],b:'middle'});}
    const zw=I.win,zy0=Y(v-zw/2),zy1=Y(v+zw/2);zoomRect=[x-w/2-6,Math.min(zy0,zy1),w+12,Math.abs(zy1-zy0)];}
  else if(I.kind==='ruler'){const x0=34,pxcm=17.5,ry=250;ctx.fillStyle=PAL['cv-ruler'];ctx.fillRect(x0-8,ry,15*pxcm+16,34);ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1;ctx.strokeRect(x0-8,ry,15*pxcm+16,34);
    for(let i=0;i<=150;i++){const xx=x0+i*pxcm/10;ctx.beginPath();ctx.moveTo(xx,ry);ctx.lineTo(xx,ry+(i%10===0?12:i%5===0?8:4));ctx.stroke();}
    for(let c=0;c<=15;c+=k<1.3?1:3)txt(ctx,String(c),x0+c*pxcm,ry+27,{s:12*k,c:PAL['cv-soft'],a:'center'});
    const g=ctx.createLinearGradient(0,ry-30,0,ry);g.addColorStop(0,'#c9ced5');g.addColorStop(1,'#7d848d');ctx.fillStyle=g;ctx.fillRect(x0,ry-28,v*pxcm,26);
    zoomRect=[x0+(v-I.win/2)*pxcm,ry-34,I.win*pxcm,72];}
  else{drawBalance(ctx,40,170,250,180,fixd(v,2),k);zoomRect=[70,268,190,52];}
  // zoom connector
  if(zoomRect){ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.5;rr(ctx,zoomRect[0],zoomRect[1],zoomRect[2],zoomRect[3],4);ctx.stroke();ctx.beginPath();ctx.moveTo(zoomRect[0]+zoomRect[2],zoomRect[1]);ctx.lineTo(ZX-ZR*0.5,ZY-ZR*0.866);
    ctx.moveTo(zoomRect[0]+zoomRect[2],zoomRect[1]+zoomRect[3]);ctx.lineTo(ZX-ZR*0.5,ZY+ZR*0.866);ctx.stroke();}
  ctx.save();ctx.beginPath();ctx.arc(ZX,ZY,ZR,0,6.29);ctx.fillStyle=PAL['card'];ctx.fill();ctx.clip();
  if(I.kind==='balance'){drawBalanceZoom(ctx,v,k);}else if(I.kind==='ruler')zoomRuler(ctx,I,v,k);else zoomVertical(ctx,I,v,k,t,st);
  ctx.restore();ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=3;ctx.beginPath();ctx.arc(ZX,ZY,ZR,0,6.29);ctx.stroke();
  pill(ctx,I.kind==='cyl'||I.kind==='buret'?'Zoom: dashed line = your eye level':'Zoom: what you see up close',ZX,ZY+ZR+2,PAL['card2'],PAL['cv-ink'],12*k);
  if(st.reveal||(st.res&&st.res.k==='ok'))pill(ctx,'Reading: '+fixd(v,I.dp)+' '+I.unit,ZX,ZY-ZR+4,PAL['s3'],'#fff',14*k);}
function zoomVertical(ctx,I,v,k,t,st){const span=ZR*1.7,ppu=span/I.win,down=I.kind==='buret';const Y=u=>ZY+(down?1:-1)*(u-v)*ppu;
  const thermo=I.kind==='thermo';const wl=thermo?ZX-34:ZX-128,wr=thermo?ZX+34:ZX+128;
  // glass
  ctx.fillStyle=PAL['cv-bg2'];ctx.fillRect(wl,ZY-ZR,wr-wl,2*ZR);
  if(thermo){ctx.fillStyle='#d23a3a';ctx.fillRect(ZX-7,Y(v),14,ZY+ZR-Y(v));ctx.beginPath();ctx.arc(ZX,Y(v),7,Math.PI,0);ctx.fill();}
  else{const yv=Y(v),cu=Math.min(26,ppu*I.div*0.9);ctx.beginPath();ctx.moveTo(wl,yv-cu);ctx.quadraticCurveTo(wl+20,yv,ZX,yv);ctx.quadraticCurveTo(wr-20,yv,wr,yv-cu);ctx.lineTo(wr,ZY+ZR);ctx.lineTo(wl,ZY+ZR);ctx.closePath();
    ctx.save();ctx.globalAlpha=0.55;ctx.fillStyle='#5aa7dd';ctx.fill();ctx.restore();ctx.strokeStyle='#2c6db0';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(wl,yv-cu);ctx.quadraticCurveTo(wl+20,yv,ZX,yv);ctx.quadraticCurveTo(wr-20,yv,wr,yv-cu);ctx.stroke();}
  ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(wl,ZY-ZR);ctx.lineTo(wl,ZY+ZR);ctx.moveTo(wr,ZY-ZR);ctx.lineTo(wr,ZY+ZR);ctx.stroke();
  // scale
  const n0=Math.floor((v-I.win)/I.div),n1=Math.ceil((v+I.win)/I.div);ctx.strokeStyle=PAL['cv-ink'];
  for(let i=n0;i<=n1;i++){const u=+(i*I.div).toFixed(4);if(u<I.lo-1e-9||u>I.hi+1e-9)continue;const y=Y(u);const isLab=Math.abs(u/I.lab-Math.round(u/I.lab))<1e-6,isMid=Math.abs(u/I.mid-Math.round(u/I.mid))<1e-6;
    const L=isLab?(thermo?60:110):isMid?(thermo?44:72):(thermo?30:44);ctx.lineWidth=isLab?2.5:1.6;const x0=thermo?ZX+36:wl;ctx.beginPath();ctx.moveTo(x0,y);ctx.lineTo(x0+L,y);ctx.stroke();
    if(isLab)txt(ctx,String(+u.toFixed(2)),x0+L+8,y,{s:18*k,w:700,b:'middle'});}
  if(!thermo){ctx.setLineDash([7,6]);ctx.strokeStyle=PAL['s4'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(ZX-ZR,Y(v));ctx.lineTo(wl-4,Y(v));ctx.stroke();ctx.setLineDash([]);
    const ex=ZX-Math.sqrt(Math.max(0,ZR*ZR-Math.pow(Y(v)-ZY,2)))+22,ey=Y(v);ctx.strokeStyle=PAL['s4'];ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(ex-13,ey);ctx.quadraticCurveTo(ex,ey-10,ex+13,ey);ctx.quadraticCurveTo(ex,ey+10,ex-13,ey);ctx.stroke();ctx.fillStyle=PAL['s4'];ctx.beginPath();ctx.arc(ex,ey,4,0,6.29);ctx.fill();}
  if(st.reveal||(st.res&&st.res.k==='ok')){ctx.strokeStyle=PAL['s3'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(ZX-40,Y(v));ctx.lineTo(ZX+40,Y(v));ctx.stroke();}}
function zoomRuler(ctx,I,v,k){const ppu=ZR*1.7/I.win,X=u=>ZX+(u-v)*ppu,ry=ZY+6;
  ctx.fillStyle=PAL['cv-ruler'];ctx.fillRect(ZX-ZR,ry,2*ZR,110);ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(ZX-ZR,ry);ctx.lineTo(ZX+ZR,ry);ctx.stroke();
  const g=ctx.createLinearGradient(0,ry-70,0,ry);g.addColorStop(0,'#c9ced5');g.addColorStop(1,'#7d848d');ctx.fillStyle=g;ctx.fillRect(ZX-ZR,ry-64,X(v)-(ZX-ZR),60);ctx.strokeStyle='#59616b';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(X(v),ry-64);ctx.lineTo(X(v),ry-4);ctx.stroke();
  const n0=Math.floor((v-I.win)/I.div),n1=Math.ceil((v+I.win)/I.div);ctx.strokeStyle=PAL['cv-ink'];
  for(let i=n0;i<=n1;i++){const u=+(i*I.div).toFixed(3);if(u<0)continue;const x=X(u),isLab=Math.abs(u-Math.round(u))<1e-6,isMid=Math.abs(u*2-Math.round(u*2))<1e-6;ctx.lineWidth=isLab?2.5:1.5;ctx.beginPath();ctx.moveTo(x,ry);ctx.lineTo(x,ry+(isLab?52:isMid?36:22));ctx.stroke();
    if(isLab)txt(ctx,String(Math.round(u)),x,ry+76,{s:18*k,w:700,a:'center'});}
  txt(ctx,'cm',ZX+ZR*0.55,ry+100,{s:13*k,c:PAL['cv-soft'],a:'center'});}
function drawBalance(ctx,x,y,w,h,read,k){ctx.fillStyle='#59616b';rr(ctx,x,y+h*0.3,w,h*0.7,12);ctx.fill();ctx.fillStyle='#b8bec6';ctx.beginPath();ctx.ellipse(x+w/2,y+h*0.26,w*0.4,12,0,0,6.29);ctx.fill();
  ctx.fillStyle='#d6a24a';ctx.beginPath();ctx.ellipse(x+w/2,y+h*0.2,w*0.16,14,0,0,6.29);ctx.fill();
  ctx.fillStyle='#1d2b24';rr(ctx,x+30,y+h*0.55,w-60,h*0.3,5);ctx.fill();txt(ctx,read+' g',x+w/2,y+h*0.7,{s:22*k,w:700,c:'#8ff0a4',a:'center',b:'middle'});}
function drawBalanceZoom(ctx,v,k){ctx.fillStyle='#1d2b24';rr(ctx,ZX-160,ZY-60,320,110,12);ctx.fill();txt(ctx,v.toFixed(2)+' g',ZX,ZY-2,{s:52*Math.min(k,1.3),w:700,c:'#8ff0a4',a:'center',b:'middle',});
  txt(ctx,'Record every digit shown',ZX,ZY+86,{s:15*k,w:700,a:'center'});}

/* ---------- accuracy and precision drawing ---------- */
function drawAcc(sim,ctx,k){const st=sim.st,S=stats(st),cx=190,cy=232,R=160;
  txt(ctx,'Weighing a 25.00 g standard mass',24,30,{s:15*k,w:700});
  for(let i=5;i>=1;i--){ctx.beginPath();ctx.arc(cx,cy,R*i/5,0,6.29);ctx.fillStyle=i%2?PAL['card']:PAL['cv-bg2'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1.5;ctx.stroke();}
  ctx.beginPath();ctx.arc(cx,cy,R/5*0.55,0,6.29);ctx.fillStyle=PAL['s1'];ctx.fill();
  const sc=R/1.5;st.darts.forEach((d,i)=>{const x=cx+clamp((d.v-ACCEPT)*sc,-R-14,R+14),y=cy+clamp(d.y*sc,-R-14,R+14);ctx.beginPath();ctx.arc(x,y,6,0,6.29);ctx.fillStyle=PAL['s2'];ctx.fill();ctx.strokeStyle=PAL['card'];ctx.lineWidth=2;ctx.stroke();});
  txt(ctx,'Target: center = 25.00 g',cx,cy+R+26,{s:12*k,c:PAL['cv-soft'],a:'center'});
  // dot plot
  const x0=420,x1=780,lo=23.4,hi=26.6,ay=330,X=v=>x0+(clamp(v,lo,hi)-lo)/(hi-lo)*(x1-x0);
  ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x0,ay);ctx.lineTo(x1,ay);ctx.stroke();
  for(let v=23.5;v<=26.5+1e-9;v+=0.5){const x=X(v);ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x,ay);ctx.lineTo(x,ay+8);ctx.stroke();if(k<1.3||Math.abs(v-Math.round(v))<1e-9)txt(ctx,v.toFixed(1),x,ay+24,{s:12*k,c:PAL['cv-soft'],a:'center'});}
  txt(ctx,'Mass (g)',(x0+x1)/2,ay+46,{s:12*k,c:PAL['cv-soft'],a:'center'});
  const bins={};st.darts.forEach(d=>{const b=Math.round((X(d.v)-x0)/12);bins[b]=(bins[b]||0)+1;const yy=ay-8-(bins[b]-1)*12;ctx.beginPath();ctx.arc(x0+b*12,Math.max(yy,90),5.5,0,6.29);ctx.fillStyle=PAL['s2'];ctx.fill();});
  ctx.strokeStyle=PAL['s3'];ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(X(ACCEPT),110);ctx.lineTo(X(ACCEPT),ay);ctx.stroke();pill(ctx,'accepted 25.00 g',X(ACCEPT),96,PAL['s3'],'#fff',12*k);
  if(S.n){ctx.setLineDash([6,5]);ctx.strokeStyle=PAL['s1'];ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(X(S.mean),130);ctx.lineTo(X(S.mean),ay);ctx.stroke();ctx.setLineDash([]);
    const ml='mean '+S.mean.toFixed(2)+' g';ctx.font='700 '+12*k+'px '+FONT;const mw=ctx.measureText(ml).width/2+10;let mx=X(S.mean);const aw=ctx.measureText('accepted 25.00 g').width/2+10;
    pill(ctx,ml,clamp(mx,x0-20+mw,x1+10-mw),Math.abs(mx-X(ACCEPT))<mw+aw?130:110,PAL['s1'],'#fff',12*k);}
  pill(ctx,verdict(st),600,ay+80,PAL['card2'],PAL['cv-ink'],14*k);}

/* ---------- sig fig counter drawing ---------- */
const COL={nz:'s3',cap:'s6',trail:'s2',lead:'muted',amb:'s4'};
function drawSig(sim,ctx,k){const st=sim.st,c=classify(st.custom||sim.p.num);
  if(!c){txt(ctx,'Type a number in the box below to count its significant figures.',400,225,{s:16*k,c:PAL['cv-soft'],a:'center',b:'middle'});return;}
  txt(ctx,shown(c)+'  →  '+c.n+' significant figure'+(c.n===1?'':'s'),400,40,{s:20*k,w:700,a:'center'});
  const chars=c.chars,ex=c.ex!==null,nb=chars.length+(ex?2.4:0);const bw=Math.min(78,700/nb),bh=bw*1.25,x0=400-nb*bw/2,y0=86;
  chars.forEach((ch,i)=>{const x=x0+i*bw;if(ch.t==='dot'){txt(ctx,'.',x+bw/2,y0+bh*0.72,{s:bw*0.9,w:800,a:'center'});return;}
    const sig=RULES[ch.t].sig,col=PAL[COL[ch.t]];rr(ctx,x+3,y0,bw-6,bh,8);if(sig){ctx.fillStyle=col;ctx.fill();}else{ctx.fillStyle=PAL['card'];ctx.fill();ctx.setLineDash([5,4]);ctx.strokeStyle=col;ctx.lineWidth=2;ctx.stroke();ctx.setLineDash([]);}
    txt(ctx,ch.c,x+bw/2,y0+bh/2+2,{s:bw*0.62,w:800,a:'center',b:'middle',c:sig?'#fff':PAL['cv-soft']});});
  if(ex){const x=x0+chars.length*bw;txt(ctx,'× 10'+CL.sup(String(c.ex).replace('-','−')),x+10,y0+bh/2+2,{s:bw*0.5,w:700,b:'middle',c:PAL['cv-soft']});}
  // rules used
  const used=['nz','cap','trail','lead','amb'].filter(t=>chars.some(x=>x.t===t));let y=y0+bh+46;const fs=14*k;
  used.forEach(t=>{const n=chars.filter(x=>x.t===t).length,col=PAL[COL[t]];rr(ctx,60,y-fs*0.8,fs*1.2,fs*1.2,4);if(RULES[t].sig){ctx.fillStyle=col;ctx.fill();}else{ctx.strokeStyle=col;ctx.lineWidth=2;ctx.setLineDash([4,3]);ctx.stroke();ctx.setLineDash([]);}
    txt(ctx,RULES[t].l+'  ('+n+')',60+fs*1.7,y,{s:fs,w:RULES[t].sig?700:400,c:RULES[t].sig?PAL['cv-ink']:PAL['cv-soft'],b:'middle'});y+=fs*1.9;});
  txt(ctx,'Scientific notation: '+sciOf(c),400,Math.min(436,Math.max(y+14,392)),{s:15*k,w:700,a:'center'});}

/* ---------- sig fig math drawing ---------- */
function drawMath(sim,ctx,k){const st=sim.st,pr=st.prob,T=TPL[pr.op],S=solve(pr),ap=atLeast('ap');
  txt(ctx,T.ctx,24,32,{s:15*k,w:700});const fs=26*Math.min(k,1.35),mono='700 '+fs+'px '+MONO;
  if(pr.op==='add'||pr.op==='sub'){ctx.font=mono;const cw=ctx.measureText('0').width;const intLen=Math.max(...pr.vals.map(s=>s.split('.')[0].length),String(Math.floor(Math.abs(S.raw))).length);
    const maxDp=Math.max(...S.dps,4);const xDot=300;const yy=i=>96+i*fs*1.5;const colX=j=>xDot+(j>0?(j-0.5)*cw+cw*0.5:j*cw)-cw/2;
    // highlight the limiting column
    const limX=xDot+(S.lim>0?S.lim*cw:-cw);ctx.fillStyle=PAL['s4'];ctx.globalAlpha=0.22;ctx.fillRect(limX-cw*0.5+(S.lim>0?cw*0.25:0),yy(0)-fs,cw,yy(pr.vals.length+1)-yy(0)+fs*0.6);ctx.globalAlpha=1;
    const put=(s,i,col,lbl)=>{const [a,b]=s.split('.');const y=yy(i);txt(ctx,a,xDot-cw*0.25,y,{s:fs,w:700,c:col,a:'right'});txt(ctx,'.',xDot,y,{s:fs,w:700,c:col,a:'center'});if(b!==undefined)txt(ctx,b,xDot+cw*0.25,y,{s:fs,w:700,c:col});if(lbl)txt(ctx,lbl,xDot+cw*(maxDp+1),y-fs*0.3,{s:13*k,c:PAL['cv-soft']});};
    pr.vals.forEach((s,i)=>{put(s,i,PAL['cv-ink'],(i===0?'':pr.op==='sub'?'− ':'+ ')+T.u[i]+', '+S.dps[i]+' decimal place'+(S.dps[i]===1?'':'s'));if(i>0)txt(ctx,pr.op==='sub'?'−':'+',xDot-cw*(intLen+1.2),yy(i),{s:fs,w:700});});
    const ly=yy(pr.vals.length)-fs*0.75;ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(xDot-cw*(intLen+1.5),ly);ctx.lineTo(xDot+cw*(maxDp+0.6),ly);ctx.stroke();
    const rawS=S.raw.toFixed(Math.max(...S.dps));put(rawS,pr.vals.length,PAL['cv-soft'],'calculator');
    if(st.showAns)put(S.ans,pr.vals.length+1,PAL['rj'],'report: '+S.ans+' '+T.ru);else txt(ctx,'Report: ?',xDot,yy(pr.vals.length+1),{s:fs,w:700,c:PAL['rj'],a:'center'});
    txt(ctx,'Shaded column: the last digit everyone is sure of',24,436,{s:13*k,c:PAL['cv-soft']});}
  else{const y0=110,lh=fs*1.6;const rowsX=380;
    pr.vals.forEach((s,i)=>{const y=y0+i*lh;txt(ctx,(i?T.sym+' ':'')+s+' '+T.u[i],rowsX,y,{s:fs,w:700,a:'right'});pill(ctx,S.sfs[i]+' sig figs',rowsX+90*Math.min(k,1.35),y-fs*0.32,S.sfs[i]===S.lim?PAL['s4']:PAL['card2'],S.sfs[i]===S.lim?'#fff':PAL['cv-ink'],13*k);});
    const ly=y0+pr.vals.length*lh-lh*0.55;ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(140,ly);ctx.lineTo(560,ly);ctx.stroke();
    txt(ctx,'Calculator: '+S.raw.toPrecision(10).replace(/\.?0+$/,'')+' '+T.ru,rowsX,ly+lh*0.75,{s:fs*0.8,c:PAL['cv-soft'],a:'right'});
    txt(ctx,st.showAns?'Report: '+S.ans+' '+T.ru:'Report: ?',rowsX,ly+lh*1.75,{s:fs,w:800,c:PAL['rj'],a:'right'});
    txt(ctx,S.rule,400,ly+lh*2.8,{s:14*k,w:700,a:'center'});}
  if(ap)txt(ctx,'Uncertainty: '+S.uncText,776,pr.op==='add'||pr.op==='sub'?408:436,{s:13*k,c:PAL['cv-soft'],a:'right'});}

BioLab.register(SIM);
})();
