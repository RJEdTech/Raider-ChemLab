(function(){
'use strict';
const {clamp,lerp,rng,rr,txt,pill,atLeast,PAL,FONT,RM,axes,legend,serColor,lvText}=BioLab.h;
const CL=window.ChemLab;

/* ---------- formatting ---------- */
const SUPD={'-':'⁻','0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹'};
const supE=e=>String(e).split('').map(c=>SUPD[c]||c).join('');
function sigStr(v,n){if(!Number.isFinite(v))return '—';if(v===0)return '0';const r=CL.roundSig(v,n),e=Math.floor(Math.log10(Math.abs(r)));
  if(e>=n){const m=r/Math.pow(10,e);return m.toFixed(n-1)+' × 10'+supE(e);}if(e===n-1){const s=r.toFixed(0);return /0$/.test(s)?s+'.':s;}return r.toFixed(Math.max(0,n-1-e));}

/* ---------- materials and samples (accepted densities near 20 °C, g/cm³) ---------- */
const TABLE=[{n:'Wood (pine)',d:0.60},{n:'Ice',d:0.917},{n:'PVC plastic',d:1.38},{n:'Magnesium',d:1.74},{n:'Aluminum',d:2.70},{n:'Zinc',d:7.13},{n:'Iron',d:7.87},{n:'Nickel',d:8.90},{n:'Copper',d:8.96},{n:'Lead',d:11.34}];
const OBJ={
  al:{n:'Aluminum block',mat:'Aluminum',d:2.70,reg:true,col:'#b9c0c8',atom:'Al',am:26.98,r:143},
  fe:{n:'Iron block',mat:'Iron',d:7.87,reg:true,col:'#7b8189',atom:'Fe',am:55.85,r:126},
  cu:{n:'Copper block',mat:'Copper',d:8.96,reg:true,col:'#c87533',atom:'Cu',am:63.55,r:128},
  pb:{n:'Lead block',mat:'Lead',d:11.34,reg:true,col:'#62676f',atom:'Pb',am:207.2,r:175},
  wood:{n:'Wood block',mat:'Wood (pine)',d:0.60,reg:true,col:'#c8a165',atom:'wood'},
  pvc:{n:'PVC block',mat:'PVC plastic',d:1.38,reg:true,col:'#e6e6dc',atom:'pvc'},
  A:{n:'Mystery sample A',mat:'Zinc',d:7.13,reg:false,col:'#9aa3ad',atom:'?',mys:true,vols:[3.4,7.6,12.2,20.5]},
  B:{n:'Mystery sample B',mat:'Aluminum',d:2.70,reg:false,col:'#c9ced4',atom:'?',mys:true,vols:[4.2,8.8,14.6,24.0]},
  C:{n:'Mystery sample C',mat:'Nickel',d:8.90,reg:false,col:'#aaa596',atom:'?',mys:true,vols:[2.50,5.3,9.6,16.2],lvl:'ap'}
};
const OKEYS=Object.keys(OBJ);
const DIMS=[[1.50,1.50,2.00],[2.00,2.00,2.50],[2.50,2.50,3.00],[3.00,3.00,4.00]];
const trueV=(o,s)=>o.reg?DIMS[s-1].reduce((a,b)=>a*b,1):o.vols[s-1];

/* water density vs temperature (g/cm³), CRC table */
const WT=[[0,0.99984],[4,0.99997],[10,0.99970],[20,0.99821],[25,0.99705],[30,0.99565],[40,0.99222],[50,0.98804],[60,0.98320],[70,0.97777],[80,0.97179],[90,0.96531],[100,0.95835]];
function rhoW(T){for(let i=1;i<WT.length;i++)if(T<=WT[i][0]){const a=WT[i-1],b=WT[i];return lerp(a[1],b[1],(T-a[0])/(b[0]-a[0]));}return WT[WT.length-1][1];}

/* ---------- measuring ---------- */
const SZ=p=>clamp(Math.round(p.size)||2,1,4);
function sampleSeed(p){return 1000+OKEYS.indexOf(p.obj)*37+SZ(p)*101;}
function readings(p){const o=OBJ[p.obj],r=rng(sampleSeed(p)),V=trueV(o,SZ(p)),m=o.d*V;const nz=()=>Math.round((r()-0.5)*2.4);
  const mass=Math.round((m+0.01*nz())*100)/100;const dims=o.reg?DIMS[SZ(p)-1].map(x=>Math.round((x+0.01*nz())*100)/100):null;
  const Vi=Math.round((46+r()*8)*10)/10;return {V,m,mass,dims,Vi,nz:nz()};}
function displaced(p,R,pushed){const o=OBJ[p.obj];const full=R.V;if(o.d<1&&!pushed)return R.m/1.00;return full;}
function weigh(sim){const s=sim.st;s.go='bal';s.goT=0;s.m=readings(sim.p).mass;}
function ruler(sim){const s=sim.st,o=OBJ[sim.p.obj];if(!o.reg){s.msg='irr';return;}s.go='home';s.dims=readings(sim.p).dims;const sf=3;s.V=s.dims.reduce((a,b)=>a*b,1);s.Vs=sigStr(s.V,sf);s.Vm='ruler';s.msg='';}
function drop(sim){const s=sim.st,p=sim.p,R=readings(p);s.go='cyl';s.goT=0;s.Vi=R.Vi;const dv=displaced(p,R,p.push);s.Vf=Math.round((R.Vi+dv+0.1*clamp(R.nz,-1,1))*10)/10;s.V=Math.round((s.Vf-s.Vi)*10)/10;s.Vs=s.V.toFixed(1);s.Vm='disp';s.msg='';}
function measureAll(sim){const p=sim.p,o=OBJ[p.obj];weigh(sim);if(o.reg&&p.vmethod==='ruler')ruler(sim);else drop(sim);}
function resetMeas(sim){const s=sim.st;s.m=null;s.dims=null;s.V=null;s.Vs='';s.Vm=null;s.Vi=null;s.Vf=null;s.go='home';s.msg='';s.y=null;}
function dens(st){if(st.m===null||st.V===null||!(st.V>0))return NaN;return st.m/st.V;}
function densStr(st){const D=dens(st);if(!Number.isFinite(D))return null;const sf=Math.min(CL.sigFigs(st.m.toFixed(2)),CL.sigFigs(st.Vs));return sigStr(D,sf);}
function closest(D){let b=TABLE[0];TABLE.forEach(t=>{if(Math.abs(t.d-D)<Math.abs(b.d-D))b=t;});return b;}

/* ---------- sink or float column ---------- */
const LIQ={oil:{n:'Vegetable oil',d:()=>0.91,col:'#e9c94f'},water:{n:'Water',d:T=>rhoW(T),col:'#5aa7dd'},salt:{n:'Salt water',d:T=>rhoW(T)+0.07,col:'#55b685'},syrup:{n:'Corn syrup',d:()=>1.33,col:'#d08a2e'}};
const COLOBJ=[{id:'wood',n:'Wood',d:0.60},{id:'ice',n:'Ice',d:0.917},{id:'egg',n:'Fresh egg',d:1.03},{id:'nylon',n:'Nylon bead',d:1.15},{id:'pvc',n:'PVC',d:1.38},{id:'al',n:'Aluminum',d:2.70}];
const CX0=150,CX1=470,CTOP=70,CBOT=410;
function layers(p){const T=p.temp;if(p.liq==='column'){const ids=['syrup','salt','water','oil'];const h=(CBOT-CTOP-40)/4;return ids.map((id,i)=>({id,n:LIQ[id].n,d:LIQ[id].d(T),col:LIQ[id].col,y1:CBOT-i*h,y0:CBOT-(i+1)*h}));}
  return [{id:p.liq,n:LIQ[p.liq].n,d:LIQ[p.liq].d(T),col:LIQ[p.liq].col,y1:CBOT,y0:CTOP+70}];}
const OH=30;
function restY(p,ob){/* bottom y of the object at rest */const L=layers(p);const top=L[L.length-1].y0;
  for(let i=L.length-1;i>=0;i--){if(L[i].d>ob.d){const up=i===L.length-1?0:L[i+1].d;const f=(ob.d-up)/(L[i].d-up);return L[i].y0+f*OH;}}return CBOT-2;}
function outcome(p,ob){const L=layers(p);for(let i=L.length-1;i>=0;i--){if(L[i].d>ob.d){if(i===L.length-1)return 'floats on the '+L[i].n.toLowerCase();return 'floats on the '+L[i].n.toLowerCase()+', under the '+L[i+1].n.toLowerCase();}}return 'sinks to the bottom';}

/* ---------- mode visibility ---------- */
function syncModes(sim){if(!atLeast('ap')&&sim.p.obj==='C')BioLab.setValues(sim,{obj:'al'});if(!sim.ui||!sim.ui.sec)return;const d=sim.def,m=sim.p.mode;
  d.controls.forEach(c=>{if(!c.modes)return;const cid=d.id+'-'+c.id,e=document.getElementById(cid)||document.getElementById(cid+'-l');const w=e&&e.closest('.ctl');if(w)w.hidden=!atLeast(c.lvl)||!c.modes.includes(m);});
  d.metrics.forEach(mm=>{if(!mm.modes)return;const t=sim.ui.tiles[mm.id];const w=t&&t.num.closest('.tile');if(w)w.hidden=!atLeast(mm.lvl)||!mm.modes.includes(m);});
  const btns=[...sim.ui.sec.querySelectorAll('.controls .actions button')];d.actions.forEach((a,i)=>{const b=btns[i];if(b)b.hidden=!atLeast(a.lvl)||!a.modes.includes(m);});}

/* ---------- challenges ---------- */
const CH=[
  {lvl:'bio',q:'You measure the density of a small aluminum block. Then you measure a block about 8 times bigger. Its density will…',choices:['be about 8 times larger','stay the same','be smaller'],correct:1,baseline:{mode:'measure',obj:'al',size:1,vmethod:'ruler'},baselineAction:'all',change:{size:4},changeAction:'all',changeText:'Switched to the biggest aluminum block and measured it',watch:'mv',
   explain:'Mass and volume both grew about 8 times, so their ratio stayed 2.70 g/cm³. Density is an intensive property: it depends on what the sample is made of, not how much of it there is.'},
  {lvl:'bio',q:'A fresh egg sinks in tap water. What happens when you drop it in salt water instead?',choices:['It still sinks','It floats','It dissolves'],correct:1,baseline:{mode:'column',liq:'water'},baselineAction:'dropc',change:{liq:'salt'},changeAction:'dropc',changeText:'The water was swapped for salt water',
   explain:'An egg (about 1.03 g/cm³) is denser than water (1.00) but less dense than this salt water (about 1.07), so it floats. Dissolved salt adds mass to the same volume of water.'},
  {lvl:'bio',q:'A small wood block floats in water. If you use a block about 8 times bigger, it will…',choices:['sink, because it is heavier','still float','float only if you push it'],correct:1,baseline:{mode:'measure',obj:'wood',size:1,push:false},baselineAction:'drop',change:{size:4},changeAction:'drop',changeText:'Swapped in the biggest wood block',
   explain:'Whether something floats depends on density, not mass. The big block is heavier, but its volume grew just as much, so its density is still about 0.60 g/cm³, less than water.'},
  {lvl:'honors',q:'An ice cube is dropped into a cylinder with vegetable oil floating on water. Where does it end up?',choices:['Floating on top of the oil','At the boundary, under the oil and on the water','On the bottom'],correct:1,baseline:{mode:'column',liq:'column'},baselineAction:'dropc',changeText:'Watch where the ice settles',
   explain:'Ice (0.917 g/cm³) is denser than this oil (0.91) but less dense than water (1.00). It sinks through the oil and floats at the top of the water layer.'},
  {lvl:'honors',q:'You find a wood block’s volume by water displacement, but you don’t push it under. Your calculated density will be…',choices:['too high','about right','too low'],correct:0,instant:true,show:{mode:'measure',obj:'wood',size:2,vmethod:'disp',push:false},all:true,
   explain:'A floating block only displaces water equal to its own mass, so the volume reading is too small and m ÷ V comes out near 1.00 g/cm³ instead of 0.60. The model now shows this measurement. Turn on “Push floating objects under” to fix it.'},
  {lvl:'honors',q:'You plot mass (y-axis) against volume (x-axis) for several copper samples. What does the slope of the line tell you?',choices:['The mass of one sample','The density of copper, about 8.96 g/cm³','Nothing: it is always 1'],correct:1,instant:true,show:{mode:'measure',obj:'cu',size:3,vmethod:'ruler'},all:true,
   explain:'Slope = rise ÷ run = Δmass ÷ Δvolume, which is density. Record trials for each copper size and the Mass vs volume graph fits a line through the origin with slope ≈ 8.96 g/cm³.'},
  {lvl:'ap',q:'Which is denser: water at 4 °C or water at 80 °C?',choices:['80 °C, because hot water holds more energy','4 °C','They are the same'],correct:1,instant:true,show:{mode:'column',liq:'water',temp:80},
   explain:'Water is densest near 4 °C (0.99997 g/cm³). At 80 °C, faster-moving molecules spread out and the density drops to 0.97179 g/cm³, about 2.8% less. The Water density readout now shows 80 °C.'},
  {lvl:'ap',q:'Mystery sample C has m = 22.25 g and a displaced volume of 2.5 mL, so D = 8.9 g/cm³. Is it nickel (8.90) or copper (8.96)?',choices:['Copper','Nickel','You can’t tell: the volume is too imprecise'],correct:2,instant:true,show:{mode:'measure',obj:'C',size:1},all:true,
   explain:'The cylinder reads to ±0.1 mL, so 2.5 mL is uncertain by about 4%, and D could be anywhere from about 8.6 to 9.3 g/cm³. Nickel and copper differ by less than 1%. You need a more precise volume (a bigger sample or a buret) to tell them apart.'}
];

const SIM={
  id:'density',hash:'density',apUnit:0,order:4,kind:'Virtual lab',tab:'Density lab',
  card:'Weigh real materials, find their volume with a ruler or by water displacement, calculate density, identify mystery samples, and build a sink-or-float density column.',
  title:'Density lab',
  prereq:['measure'],next:['units','classify'],
  lede:{bio:'Find the mass and volume of each sample, divide to get its density, and use density to identify mystery samples and predict what sinks or floats.',
        honors:'Graph mass against volume: the slope is the density. Calculate percent error against accepted values, and spot why floating objects fool water displacement.',
        ap:'Report density to the right number of significant figures, judge whether your precision can tell two metals apart, and see how temperature changes water’s density.'},
  scale:{bio:'Real samples a few centimeters across. 1 mL of water takes up exactly 1 cm³.',honors:'Real samples a few centimeters across; 1 mL = 1 cm³. The zoom circle shows the atoms inside, about 10⁸ times larger.'},
  timeless:true,animated:true,
  controls:[
    {id:'mode',label:'Activity',type:'seg',def:'measure',lvl:'bio',noTrial:true,options:[{v:'measure',l:'Measure density'},{v:'column',l:'Sink or float'}],onChange(sim){syncModes(sim);}},
    {id:'obj',label:'Sample',type:'select',def:'al',lvl:'bio',modes:['measure'],options:OKEYS.map(k=>({v:k,l:OBJ[k].n,lvl:OBJ[k].lvl})),onChange(sim){resetMeas(sim);}},
    {id:'size',label:'Sample size',type:'range',min:1,max:4,step:1,def:2,lvl:'bio',modes:['measure'],help:'Bigger samples of the same material.',onChange(sim){resetMeas(sim);}},
    {id:'vmethod',label:'Find the volume by',type:'seg',def:'ruler',lvl:'honors',noTrial:true,modes:['measure'],options:[{v:'ruler',l:'Ruler: l × w × h'},{v:'disp',l:'Water displacement'}],help:'Irregular samples can only use water displacement.'},
    {id:'push',label:'Push floating objects under',type:'toggle',def:false,lvl:'honors',noTrial:true,modes:['measure'],help:'A thin wire holds them just below the surface.',onChange(sim){if(sim.st.Vm==='disp')drop(sim);}},
    {id:'liq',label:'Liquid',type:'select',def:'column',lvl:'bio',noTrial:true,modes:['column'],options:[{v:'column',l:'Density column (all four layers)'},{v:'water',l:'Water'},{v:'oil',l:'Vegetable oil'},{v:'salt',l:'Salt water'},{v:'syrup',l:'Corn syrup'}],onChange(sim){sim.st.dropT=null;}},
    {id:'temp',label:'Water temperature',type:'range',min:0,max:100,step:1,def:20,unit:' °C',lvl:'ap',noTrial:true,modes:['column'],onChange(sim){}}
  ],
  actions:[
    {id:'weigh',label:'Weigh it',lvl:'bio',modes:['measure'],run(sim){weigh(sim);}},
    {id:'ruler',label:'Measure with a ruler',lvl:'bio',modes:['measure'],run(sim){ruler(sim);}},
    {id:'drop',label:'Drop it in the water',lvl:'bio',modes:['measure'],run(sim){drop(sim);}},
    {id:'all',label:'Measure everything',lvl:'bio',primary:true,modes:['measure'],run(sim){measureAll(sim);}},
    {id:'out',label:'Take it out and dry it',lvl:'bio',modes:['measure'],run(sim){resetMeas(sim);}},
    {id:'dropc',label:'Drop the objects',lvl:'bio',primary:true,modes:['column'],run(sim){sim.st.dropT=0;}}
  ],
  init(sim){const st={m:null,dims:null,V:null,Vs:'',Vm:null,Vi:null,Vf:null,go:'home',goT:0,msg:'',x:350,y:400,sub:0,dropT:null,yc:null};return st;},
  step(sim,dt){const st=sim.st;st.goT+=dt;if(st.dropT!==null)st.dropT+=dt;},
  metrics:[
    {id:'mass',label:'Mass',unit:'g',lvl:'bio',min:0,max:null,d:2,modes:['measure'],get:s=>s.st.m===null?NaN:s.st.m},
    {id:'vol',label:'Volume',unit:'cm³',lvl:'bio',min:0,max:null,d:2,modes:['measure'],get:s=>s.st.V===null?NaN:s.st.V},
    {id:'dens',label:'Density (m ÷ V)',unit:'g/cm³',lvl:'bio',min:0,max:12,d:2,modes:['measure'],get:s=>dens(s.st)},
    {id:'sink',label:'In water it',unit:'',lvl:'bio',text:true,modes:['measure'],get:s=>{const D=dens(s.st);return Number.isFinite(D)?(D>1?'sinks (denser than water)':'floats (less dense than water)'):'Measure it first';}},
    {id:'match',label:'Closest material',unit:'',lvl:'honors',text:true,modes:['measure'],get:s=>{const D=dens(s.st);if(!Number.isFinite(D))return '—';const b=closest(D);return b.n+' ('+b.d+')';}},
    {id:'err',label:'Percent error',unit:'%',lvl:'honors',min:0,max:20,d:1,modes:['measure'],get:s=>{const D=dens(s.st),o=OBJ[s.p.obj];return Number.isFinite(D)&&!o.mys?Math.abs(D-o.d)/o.d*100:NaN;}},
    {id:'sf',label:'Density with correct sig figs',unit:'',lvl:'ap',text:true,modes:['measure'],get:s=>{const d=densStr(s.st);return d?d+' g/cm³':'—';}},
    {id:'wd',label:'Water density',unit:'g/cm³',lvl:'ap',min:0.95,max:1,d:5,noTrial:true,modes:['column'],get:s=>rhoW(s.p.temp)},
    {id:'out',label:'What happens',unit:'',lvl:'bio',text:true,noTrial:true,modes:['column'],get:s=>{if(s.st.dropT===null)return 'Press Drop the objects';const f=COLOBJ.filter(o=>outcome(s.p,o)==='sinks to the bottom').map(o=>o.n);return f.length?'Sink: '+f.join(', '):'Everything floats';}}
  ],
  graphs:[{id:'mv',label:'Mass vs volume (your trials)',lvl:'bio',custom:true},{id:'wt',label:'Water density vs temperature',lvl:'ap',custom:true}],
  defaultGraph:'mv',
  plot(sim,ctx,box,id){if(id==='wt'){const ax=axes(ctx,box,{xmin:0,xmax:100,ymin:0.955,ymax:1.001,xl:'Temperature (°C)',yl:'Density (g/cm³)',yd:3});ctx.strokeStyle=serColor(0);ctx.lineWidth=2.5;ctx.beginPath();
      for(let T=0;T<=100;T+=1){const y=ax.Y(rhoW(T));T?ctx.lineTo(ax.X(T),y):ctx.moveTo(ax.X(T),y);}ctx.stroke();const T=sim.p.temp;ctx.fillStyle=serColor(1);ctx.beginPath();ctx.arc(ax.X(T),ax.Y(rhoW(T)),6,0,6.29);ctx.fill();
      legend(ctx,box.L+12,box.T+10,[{label:'densest at 4 °C; now '+T+' °C',color:serColor(1)}]);return;}
    const tr=sim.trials.filter(r=>Number.isFinite(+r.mass)&&Number.isFinite(+r.vol)&&+r.vol>0);const cur=sim.st;const pts=tr.map(r=>({x:+r.vol,y:+r.mass,o:r.obj}));
    const hasCur=cur.m!==null&&cur.V!==null;const xmax=Math.max(10,...pts.map(q=>q.x),hasCur?cur.V:0)*1.15,ymax=Math.max(20,...pts.map(q=>q.y),hasCur?cur.m:0)*1.15;
    const ax=axes(ctx,box,{xmin:0,xmax,ymin:0,ymax,xl:'Volume (cm³)',yl:'Mass (g)'});
    const groups={};pts.forEach(q=>{(groups[q.o]=groups[q.o]||[]).push(q);});const items=[];
    ctx.save();ctx.beginPath();ctx.rect(box.L,box.T,box.W,box.H);ctx.clip();
    Object.keys(groups).forEach(o=>{const g=groups[o],c=serColor(OKEYS.indexOf(o));const sl=g.reduce((a,q)=>a+q.x*q.y,0)/g.reduce((a,q)=>a+q.x*q.x,0);
      ctx.strokeStyle=c;ctx.lineWidth=1.5;ctx.setLineDash([5,4]);ctx.beginPath();ctx.moveTo(ax.X(0),ax.Y(0));ctx.lineTo(ax.X(xmax),ax.Y(sl*xmax));ctx.stroke();ctx.setLineDash([]);
      g.forEach(q=>{ctx.fillStyle=c;ctx.beginPath();ctx.arc(ax.X(q.x),ax.Y(q.y),5.5,0,6.29);ctx.fill();});items.push({label:(OBJ[o]?OBJ[o].n.replace(' block','').replace('Mystery sample','Mystery'):o)+(atLeast('honors')?': slope '+sl.toFixed(2):''),color:c});});
    if(hasCur){ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2;ctx.beginPath();ctx.arc(ax.X(cur.V),ax.Y(cur.m),8,0,6.29);ctx.stroke();}ctx.restore();
    if(!pts.length)txt(ctx,'Record trials to plot points',box.L+box.W/2,box.T+box.H/2,{s:14,c:PAL['muted'],a:'center',b:'middle'});
    else legend(ctx,box.L+12,box.T+10,items.slice(0,3));},
  infoPanel(sim){const p=sim.p,st=sim.st,hon=atLeast('honors');
    if(p.mode==='column'){const L=layers(p);let h='<div class="p-head"><h3>Densities</h3></div><div class="tbl-wrap"><table><thead><tr><th style="text-align:left">Substance</th><th>g/cm³</th><th style="text-align:left">Result</th></tr></thead><tbody>';
      L.slice().reverse().forEach(l=>{h+='<tr><td style="text-align:left">'+l.n+' (liquid)</td><td>'+l.d.toFixed(atLeast('ap')&&l.id==='water'?4:2)+'</td><td></td></tr>';});
      COLOBJ.forEach(o=>{h+='<tr><td style="text-align:left">'+o.n+'</td><td>'+(o.d===0.917?'0.917':o.d.toFixed(2))+'</td><td style="text-align:left;white-space:normal">'+(st.dropT===null?'?':outcome(p,o))+'</td></tr>';});
      return h+'</tbody></table></div><p>An object floats on any liquid that is denser than it, and sinks through any liquid that is less dense.</p>';}
    let h='<div class="p-head"><h3>Accepted densities</h3></div><div class="tbl-wrap"><table><thead><tr><th style="text-align:left">Material</th><th>g/cm³</th></tr></thead><tbody>'+TABLE.filter(t=>hon||t.n!=='Nickel').map(t=>'<tr><td style="text-align:left">'+t.n+'</td><td>'+(t.d===0.917?'0.917':t.d.toFixed(2))+'</td></tr>').join('')+'</tbody></table></div>';
    if(st.msg==='irr')h+='<p class="verdict no">You can’t use a ruler on an irregular shape.</p><p>Use water displacement instead.</p>';
    return h;},
  narrate(sim){const p=sim.p,st=sim.st,o=OBJ[p.obj];
    if(p.mode==='column'){if(st.dropT===null)return 'Each liquid has its own density, so they stack with the densest on the bottom. <b>Predict</b> where each object will end up, then press Drop the objects.';
      const L=layers(p);return 'Each object stops where the liquid below it is <b>denser than the object</b> and the liquid above is less dense. '+(p.liq==='column'?'Ice sinks through the oil but floats on the water; the egg sinks in water but floats on the salt water.':'In '+L[0].n.toLowerCase()+' ('+L[0].d.toFixed(2)+' g/cm³), objects denser than that sink.');}
    if(st.msg==='irr')return '<b>A ruler only works on regular shapes.</b> This sample is irregular, so drop it in the water and measure the volume it displaces.';
    const D=dens(st);
    if(st.m===null&&st.V===null)return 'Density = mass ÷ volume. Start by finding the <b>mass</b> on the balance, then find the <b>volume</b> with a ruler'+(o.reg?'':' (not for this irregular sample)')+' or by water displacement.';
    if(st.V===null)return 'Mass: <b>'+st.m.toFixed(2)+' g</b>. Now find the volume.'+(o.reg?' This block is a regular shape, so l × w × h works.':' This sample is irregular: use water displacement.');
    if(st.m===null)return 'Volume: <b>'+st.Vs+' cm³</b>. Now weigh it on the balance.';
    const floatTrick=o.d<1&&st.Vm==='disp'&&!p.push;
    return '<b>D = '+st.m.toFixed(2)+' g ÷ '+st.Vs+' cm³ = '+(densStr(st)||'')+' g/cm³.</b> '+(floatTrick?'But the block is floating, so it only pushed aside part of its volume. This density is too high.':(o.mys?'Compare it to the table to identify the sample.':'The accepted value for '+o.mat.toLowerCase()+' is '+o.d.toFixed(2)+' g/cm³.')+(D>1?' It is denser than water, so it sank.':' It is less dense than water, so it floats.'));},
  tour:[
    {title:'Mass on the balance',text:'The balance reads to 0.01 g. Mass tells you how much matter is in the sample.',focus:[20,180,230,240],speed:1,setup(sim){BioLab.setValues(sim,{mode:'measure',obj:'al',size:2,vmethod:'ruler'});resetMeas(sim);weigh(sim);}},
    {title:'Volume of a regular block',text:'Measure length, width and height to 0.01 cm and multiply: V = l × w × h, in cm³.',focus:[240,200,250,220],speed:1,setup(sim){ruler(sim);}},
    {title:'Volume by water displacement',text:'Read the water before and after the sample goes in. The rise is the sample’s volume. 1 mL = 1 cm³.',focus:[500,60,140,370],speed:1,setup(sim){drop(sim);}},
    {title:'Divide to get density',text:'D = m ÷ V. Aluminum comes out near 2.70 g/cm³ whatever the size of the block.',focus:[8,8,480,150],pause:true},
    {title:'Why materials differ',text:'Density depends on how heavy the atoms are and how tightly they pack. Lead atoms are almost 8 times heavier than aluminum atoms.',focus:[634,30,160,170],pause:true,setup(sim){BioLab.setValues(sim,{obj:'pb'});measureAll(sim);}},
    {title:'Sink or float',text:'Liquids stack by density, and each object settles where the liquid below it is denser than it is.',focus:[0,0,800,450],speed:1,setup(sim){BioLab.setValues(sim,{mode:'column',liq:'column'});sim.st.dropT=0;}},
    {lvl:'honors',title:'Floating objects fool displacement',text:'A floating block displaces only its own mass of water, so its volume reads too small. Push it under to measure the whole volume.',focus:[500,60,140,370],speed:1,setup(sim){BioLab.setValues(sim,{mode:'measure',obj:'wood',vmethod:'disp',push:false});resetMeas(sim);measureAll(sim);}},
    {lvl:'ap',title:'Temperature changes density',text:'Water is densest at 4 °C. Warm water expands, so its density drops: 0.97179 g/cm³ at 80 °C.',focus:[0,0,800,450],pause:true,setup(sim){BioLab.setValues(sim,{mode:'column',liq:'water',temp:80});sim.st.dropT=0;}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{mode:'measure',obj:'al',size:2,temp:20,push:false,vmethod:'ruler'});resetMeas(sim);syncModes(sim);},
  challenges:CH,chChange:1.2,chReveal:3.2,
  onChallenge(sim,ch,phase){if(!ch)return;if(phase==='done'&&ch.instant&&ch.show){BioLab.setValues(sim,ch.show);resetMeas(sim);if(ch.all)measureAll(sim);if(ch.show.mode==='column')sim.st.dropT=0;syncModes(sim);}},
  onLevel(sim){syncModes(sim);},
  lab:{bio:'<p><b>Question:</b> Can you identify a mystery sample by its density?</p><ol><li>Measure the mass and volume of the aluminum, iron and copper blocks. Press <b>Record trial</b> after each one.</li><li>Measure Mystery samples A and B by water displacement and record them.</li><li>Calculate each density and compare to the table.</li></ol><p>What are A and B made of? Use your density values as evidence.</p>',
       honors:'<p><b>Question:</b> Is density the same for every size of sample?</p><ol><li>Pick one material. Record a trial for each of the four sizes.</li><li>Open the Mass vs volume graph. The dashed line’s slope is your density.</li><li>Calculate percent error = |measured − accepted| ÷ accepted × 100.</li><li>Measure the wood block by displacement, with and without pushing it under.</li></ol><p>Explain why the slope of the mass vs volume graph is the density, and why the floating wood gave a wrong answer.</p>',
       ap:'<p><b>Question:</b> How precise must a density be to identify a metal?</p><ol><li>Measure Mystery sample C at all four sizes, recording each trial.</li><li>For each, estimate the uncertainty of V (±0.1 mL) and the range of possible densities.</li><li>Compare with nickel (8.90) and copper (8.96).</li></ol><p><b>Claim–evidence–reasoning:</b> Which sample size, if any, lets you tell nickel from copper? Support your claim with your uncertainty calculation.</p>'},
  terms:[{t:'Density',d:'Mass per unit volume, D = m ÷ V, in g/cm³ or g/mL.'},{t:'Mass',d:'The amount of matter in an object, measured on a balance in grams.'},{t:'Volume',d:'The space an object takes up, in cm³ or mL (1 mL = 1 cm³).'},{t:'Water displacement',d:'Finding an object’s volume from how much the water level rises when it is submerged.'},
    {lvl:'honors',t:'Intensive property',d:'A property that does not depend on the amount of sample, such as density or boiling point.'},{lvl:'honors',t:'Extensive property',d:'A property that depends on the amount, such as mass or volume.'},{lvl:'honors',t:'Percent error',d:'|measured − accepted| ÷ accepted × 100.'},
    {lvl:'ap',t:'Thermal expansion',d:'Most substances take up more volume when heated, so their density decreases.'}],
  about:'<p>Accepted densities are standard values near 20 °C (CRC Handbook): aluminum 2.70, zinc 7.13, iron 7.87, nickel 8.90, copper 8.96, lead 11.34, magnesium 1.74 g/cm³, PVC 1.38, ice 0.917, pine about 0.60 (wood varies). Water’s density vs temperature uses the CRC table. Vegetable oil (0.91), corn syrup (1.33), salt water (about 10% NaCl, 0.07 g/cm³ above pure water), egg (1.03) and nylon (1.15) are typical values; real samples vary.</p><p>Each sample has fixed small reading errors (a few hundredths of a gram or centimeter, ±0.1 mL on the cylinder), so your densities differ slightly from accepted values, as in a real lab. A floating object displaces only its own mass of water (Archimedes’ principle). In a real density column, water and salt water slowly mix; here the layers stay sharp. The zoom circle is a 2D cartoon of atoms drawn with relative sizes, not a crystal structure.</p>',
  initVis(sim){syncModes(sim);},
  thumbSetup(sim){measureAll(sim);sim.st.goT=5;},thumbFrames:4,
  draw(sim,ctx,vdt,k,t){ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);if(sim.p.mode==='column')return drawColumn(sim,ctx,k,t);drawMeasure(sim,ctx,k,t);}
};

/* ---------- sample drawing ---------- */
const PXCM=22;
function sampleSize(o,s){if(o.reg){const d=DIMS[s-1];return {w:d[0]*PXCM,h:d[2]*PXCM,dp:d[1]*PXCM*0.35};}const L=Math.cbrt(o.vols[s-1])*PXCM*1.05;return {w:L*1.1,h:L*0.9,dp:0};}
function drawSample(ctx,o,s,x,yb,seed){const S=sampleSize(o,s),c=o.col;
  if(o.reg){const w=S.w,h=S.h,dp=S.dp;ctx.fillStyle=CL.shade(c,0.25);ctx.beginPath();ctx.moveTo(x-w/2,yb-h);ctx.lineTo(x-w/2+dp,yb-h-dp*0.7);ctx.lineTo(x+w/2+dp,yb-h-dp*0.7);ctx.lineTo(x+w/2,yb-h);ctx.closePath();ctx.fill();
    ctx.fillStyle=CL.shade(c,-0.2);ctx.beginPath();ctx.moveTo(x+w/2,yb-h);ctx.lineTo(x+w/2+dp,yb-h-dp*0.7);ctx.lineTo(x+w/2+dp,yb-dp*0.7);ctx.lineTo(x+w/2,yb);ctx.closePath();ctx.fill();
    ctx.fillStyle=c;ctx.fillRect(x-w/2,yb-h,w,h);ctx.strokeStyle=CL.shade(c,-0.45);ctx.lineWidth=1.2;ctx.strokeRect(x-w/2,yb-h,w,h);
    if(o.atom==='wood'){ctx.strokeStyle='rgba(110,70,30,.5)';ctx.lineWidth=1.5;for(let i=1;i<5;i++){ctx.beginPath();ctx.moveTo(x-w/2,yb-h+i*h/5);ctx.quadraticCurveTo(x,yb-h+i*h/5+5,x+w/2,yb-h+i*h/5-2);ctx.stroke();}}}
  else{const r=rng(seed||7),n=11,pts=[];for(let i=0;i<n;i++){const a=i/n*6.283,f=0.78+r()*0.3;pts.push([x+Math.cos(a)*S.w/2*f,yb-S.h/2+Math.sin(a)*S.h/2*f]);}
    const g=ctx.createRadialGradient(x-S.w*0.15,yb-S.h*0.7,2,x,yb-S.h/2,S.w*0.6);g.addColorStop(0,CL.shade(c,0.35));g.addColorStop(1,CL.shade(c,-0.3));ctx.fillStyle=g;ctx.beginPath();pts.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]));ctx.closePath();ctx.fill();ctx.strokeStyle=CL.shade(c,-0.5);ctx.lineWidth=1.2;ctx.stroke();}
  return S;}
function drawBalance(ctx,x,y,w,read,k){ctx.fillStyle='#59616b';rr(ctx,x,y,w,60,10);ctx.fill();ctx.fillStyle='#b8bec6';ctx.fillRect(x+w/2-6,y-10,12,10);ctx.beginPath();ctx.ellipse(x+w/2,y-12,w*0.4,8,0,0,6.29);ctx.fill();
  ctx.fillStyle='#1d2b24';rr(ctx,x+22,y+18,w-44,30,5);ctx.fill();txt(ctx,read,x+w/2,y+34,{s:17*Math.min(k,1.4),w:700,c:'#8ff0a4',a:'center',b:'middle'});}

/* ---------- measure mode ---------- */
const BAL={x:30,y:340,w:190},HOME=350,CYL={x0:524,x1:600,top:96,bot:396,cap:100};
function drawMeasure(sim,ctx,k,t){const p=sim.p,st=sim.st,o=OBJ[p.obj],R=readings(p);
  ctx.fillStyle=PAL['cv-bench'];ctx.fillRect(0,400,800,50);ctx.fillStyle=PAL['line'];ctx.fillRect(0,400,800,2);
  // balance
  const onBal=st.go==='bal';drawBalance(ctx,BAL.x,BAL.y,BAL.w,onBal&&st.goT>0.6?st.m.toFixed(2)+' g':'0.00 g',k);
  // cylinder and water
  const S=sampleSize(o,SZ(p));const inCyl=st.go==='cyl';const Vi=inCyl?st.Vi:(st.Vi!==null?st.Vi:R.Vi);const ppm=(CYL.bot-CYL.top)/CYL.cap;
  let objBottom=null,dispNow=0;
  if(inCyl){const fall=clamp((st.goT-0.2)/0.9,0,1);const full=st.Vf-st.Vi;const floatTop=o.d<1&&!p.push;const wy=CYL.bot-(Vi+full)*ppm;
    const restB=floatTop?wy+S.h*o.d:(o.d<1?wy+S.h+4:CYL.bot-2);objBottom=lerp(CYL.top-30,restB,fall);const subFrac=clamp((objBottom-(CYL.bot-Vi*ppm))/S.h,0,1);dispNow=fall>=1?full:full*subFrac;}
  const level=Vi+dispNow,wy=CYL.bot-level*ppm;
  ctx.save();ctx.globalAlpha=0.55;ctx.fillStyle='#5aa7dd';ctx.fillRect(CYL.x0,wy,CYL.x1-CYL.x0,CYL.bot-wy);ctx.restore();
  if(inCyl){const xs=(CYL.x0+CYL.x1)/2;drawSample(ctx,o,SZ(p),xs,objBottom,sampleSeed(p));if(o.d<1&&p.push){ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(xs,objBottom-S.h);ctx.lineTo(xs,CYL.top-40);ctx.stroke();}
    ctx.save();ctx.globalAlpha=0.3;ctx.fillStyle='#5aa7dd';ctx.fillRect(CYL.x0,Math.max(wy,objBottom-S.h),CYL.x1-CYL.x0,Math.max(0,Math.min(objBottom,CYL.bot)-Math.max(wy,objBottom-S.h)));ctx.restore();}
  ctx.strokeStyle='#2c6db0';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(CYL.x0,wy);ctx.quadraticCurveTo((CYL.x0+CYL.x1)/2,wy+6,CYL.x1,wy);ctx.stroke();
  ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=2.6;ctx.beginPath();ctx.moveTo(CYL.x0,CYL.top-6);ctx.lineTo(CYL.x0,CYL.bot);ctx.lineTo(CYL.x1,CYL.bot);ctx.lineTo(CYL.x1,CYL.top-6);ctx.stroke();ctx.fillStyle=PAL['cv-glass'];ctx.fillRect(CYL.x0-14,CYL.bot,CYL.x1-CYL.x0+28,4);
  ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1;for(let v=0;v<=100;v+=2){const y=CYL.bot-v*ppm;ctx.beginPath();ctx.moveTo(CYL.x0,y);ctx.lineTo(CYL.x0+(v%10?6:14),y);ctx.stroke();if(v%20===0&&v)txt(ctx,String(v),CYL.x0-6,y,{s:12*Math.min(k,1.4),c:PAL['cv-soft'],a:'right',b:'middle'});}
  txt(ctx,'mL',CYL.x0-6,CYL.top-12,{s:12*k,c:PAL['cv-soft'],a:'right'});
  const shownV=inCyl&&st.goT>1.2?st.Vf:Vi;pill(ctx,shownV.toFixed(1)+' mL',CYL.x1+44,wy,PAL['s2'],'#fff',13*k);
  // sample at home or on balance
  if(!inCyl){let x=HOME,yb=400;if(onBal){const f=clamp(st.goT/0.5,0,1);x=lerp(HOME,BAL.x+BAL.w/2,f);yb=lerp(400,BAL.y-18,f)-Math.sin(f*Math.PI)*40;}
    drawSample(ctx,o,SZ(p),x,yb,sampleSeed(p));
    if(st.dims&&!onBal){const w=S.w,h=S.h,dp=S.dp;ctx.strokeStyle=PAL['s4'];ctx.fillStyle=PAL['s4'];ctx.lineWidth=2;const arrow=(x1,y1,x2,y2)=>{ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();[[x1,y1,x2,y2],[x2,y2,x1,y1]].forEach(([a,b,c,d])=>{const an=Math.atan2(d-b,c-a);ctx.beginPath();ctx.moveTo(a,b);ctx.lineTo(a+Math.cos(an+0.5)*8,b+Math.sin(an+0.5)*8);ctx.lineTo(a+Math.cos(an-0.5)*8,b+Math.sin(an-0.5)*8);ctx.closePath();ctx.fill();});};
      arrow(x-w/2,yb+0-14+20,x+w/2,yb-14+20);arrow(x-w/2-12,yb,x-w/2-12,yb-h);arrow(x+w/2+6,yb-h-6,x+w/2+dp+6,yb-h-dp*0.7-6);
      const fs=13*Math.min(k,1.5);pill(ctx,st.dims[0].toFixed(2)+' cm',x,yb+30,PAL['card'],PAL['cv-ink'],fs);ctx.font='700 '+fs+'px '+FONT;const hw=ctx.measureText(st.dims[2].toFixed(2)+' cm').width/2+10;
      pill(ctx,st.dims[2].toFixed(2)+' cm',x-w/2-18-hw,yb-h/2,PAL['card'],PAL['cv-ink'],fs);pill(ctx,st.dims[1].toFixed(2)+' cm',x+w/2+dp+hw+4,yb-h-dp*0.7-10,PAL['card'],PAL['cv-ink'],fs);}}
  // data panel
  const fs=14*k,lx=16;let y=30;const line=(s,c,w)=>{ctx.font=(w||600)+' '+fs+'px '+FONT;const words=s.split(' ');let cur='';words.forEach(wd=>{const tt=cur?cur+' '+wd:wd;if(ctx.measureText(tt).width>470&&cur){txt(ctx,cur,lx,y,{s:fs,w:w||600,c});y+=fs*1.3;cur=wd;}else cur=tt;});txt(ctx,cur,lx,y,{s:fs,w:w||600,c});y+=fs*1.45;};
  line(o.n+(o.reg?'':' (irregular)'),PAL['cv-ink'],800);
  line('m = '+(st.m===null?'?':st.m.toFixed(2)+' g'),PAL['cv-ink']);
  line('V = '+(st.V===null?'?':st.Vm==='ruler'?st.dims.map(d=>d.toFixed(2)).join(' × ')+' = '+st.Vs+' cm³':st.Vf.toFixed(1)+' − '+st.Vi.toFixed(1)+' = '+st.Vs+' mL'),PAL['cv-ink']);
  const ds=densStr(st);line('D = m ÷ V = '+(ds?ds+' g/cm³':'?'),ds?PAL['rj']:PAL['cv-soft'],800);
  if(st.msg==='irr')pill(ctx,'Irregular shape: use water displacement',HOME,300,PAL['s4'],'#fff',13*k);
  if(atLeast('honors'))drawZoom(ctx,o,k,t);}
function drawZoom(ctx,o,k,t){const cx=716,cy=128+8*(k-1),R=76;ctx.save();ctx.beginPath();ctx.arc(cx,cy,R,0,6.29);ctx.fillStyle=PAL['card'];ctx.fill();ctx.clip();
  if(o.atom==='wood'){ctx.strokeStyle='#a87a3d';ctx.lineWidth=5;for(let i=-3;i<=3;i++){ctx.beginPath();for(let x=-R;x<=R;x+=6){const y=cy+i*20+Math.sin((x+i*13)/9)*3;x===-R?ctx.moveTo(cx+x,y):ctx.lineTo(cx+x,y);}ctx.stroke();}
    ctx.fillStyle=PAL['card'];[[-30,-8],[18,10],[-6,32],[34,-28],[-40,30]].forEach(([dx,dy])=>{ctx.beginPath();ctx.ellipse(cx+dx,cy+dy,13,8,0,0,6.29);ctx.fill();});}
  else if(o.atom==='pvc'){ctx.strokeStyle='#7f8f9f';ctx.lineWidth=4;for(let i=0;i<6;i++){ctx.beginPath();for(let s=0;s<=1;s+=0.05){const x=cx-R+s*2*R,y=cy-R+20+i*24+Math.sin(s*12+i)*10;s?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();}
    for(let i=0;i<14;i++)CL.drawAtom(ctx,cx-R+15+(i*37)%(2*R-20),cy-R+18+((i*53)%(2*R-30)),6,'Cl',{label:''});}
  else{const r=o.atom==='?'?12:o.r/10.5,sp=r*2.05,sym=o.atom==='?'?null:o.atom;for(let j=-6;j<=6;j++)for(let i=-6;i<=6;i++){const x=cx+i*sp+(j%2?sp/2:0),y=cy+j*sp*0.87;if(Math.hypot(x-cx,y-cy)>R+r)continue;
      const jig=RM?0:Math.sin(t*6+i*1.7+j*2.3)*0.8;if(sym)CL.drawAtom(ctx,x+jig,y,r,sym,{label:sym,s:Math.max(10,r*0.9)});else{ctx.beginPath();ctx.arc(x+jig,y,r,0,6.29);ctx.fillStyle='#8d949c';ctx.fill();}}}
  ctx.restore();ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(cx,cy,R,0,6.29);ctx.stroke();
  const lab=o.atom==='wood'?'Cellulose fibers + air':o.atom==='pvc'?'Tangled PVC chains':o.atom==='?'?'Atoms: unknown':o.atom+' atoms, '+o.am+' u each';
  ctx.font='700 '+12*k+'px '+FONT;const hw=ctx.measureText(lab).width/2+8;pill(ctx,lab,Math.min(cx,792-hw),cy-R-14,PAL['card2'],PAL['cv-ink'],12*k);}

/* ---------- sink or float ---------- */
function drawObjIcon(ctx,id,x,yb,s){const h=OH*s,w=OH*s;
  if(id==='wood'){ctx.fillStyle='#c8a165';ctx.fillRect(x-w*0.6,yb-h,w*1.2,h);ctx.strokeStyle='#7a5530';ctx.lineWidth=1.2;ctx.strokeRect(x-w*0.6,yb-h,w*1.2,h);}
  else if(id==='ice'){ctx.fillStyle='rgba(215,240,255,.85)';rr(ctx,x-w/2,yb-h,w,h,5);ctx.fill();ctx.strokeStyle='#7fb3d5';ctx.lineWidth=1.5;ctx.stroke();}
  else if(id==='egg'){ctx.fillStyle='#f3e9d8';ctx.beginPath();ctx.ellipse(x,yb-h/2,w*0.38,h/2,0,0,6.29);ctx.fill();ctx.strokeStyle='#b9a886';ctx.lineWidth=1.2;ctx.stroke();}
  else if(id==='nylon'){const g=ctx.createRadialGradient(x-5*s,yb-h*0.65,2,x,yb-h/2,h/2);g.addColorStop(0,'#d7b8ff');g.addColorStop(1,'#6a3fb5');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,yb-h/2,h/2,0,6.29);ctx.fill();}
  else if(id==='pvc'){ctx.fillStyle='#e6e6dc';ctx.fillRect(x-w/2,yb-h,w,h);ctx.strokeStyle='#8d8d80';ctx.lineWidth=1.2;ctx.strokeRect(x-w/2,yb-h,w,h);}
  else{const g=ctx.createLinearGradient(0,yb-h,0,yb);g.addColorStop(0,'#dfe3e8');g.addColorStop(1,'#8b929b');ctx.fillStyle=g;ctx.fillRect(x-w/2,yb-h,w,h);ctx.strokeStyle='#5f666f';ctx.lineWidth=1.2;ctx.strokeRect(x-w/2,yb-h,w,h);}}
function drawColumn(sim,ctx,k,t){const p=sim.p,st=sim.st,L=layers(p);
  // liquids
  L.forEach(l=>{ctx.save();ctx.globalAlpha=0.5;ctx.fillStyle=l.col;ctx.fillRect(CX0,l.y0,CX1-CX0,l.y1-l.y0);ctx.restore();ctx.strokeStyle=l.col;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(CX0,l.y0);ctx.lineTo(CX1,l.y0);ctx.stroke();
    const fs=13*Math.min(k,1.6),cyL=(l.y0+l.y1)/2;txt(ctx,l.n,CX0-10,cyL-fs*0.55,{s:fs,w:700,a:'right',b:'middle'});txt(ctx,l.d.toFixed(atLeast('ap')&&l.id==='water'?4:2)+' g/mL',CX0-10,cyL+fs*0.65,{s:fs*0.95,c:PAL['cv-soft'],a:'right',b:'middle'});});
  ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(CX0,CTOP-10);ctx.lineTo(CX0,CBOT);ctx.lineTo(CX1,CBOT);ctx.lineTo(CX1,CTOP-10);ctx.stroke();ctx.fillStyle=PAL['cv-glass'];ctx.fillRect(CX0-14,CBOT,CX1-CX0+28,5);
  // objects
  const dx=(CX1-CX0)/(COLOBJ.length+1);
  COLOBJ.forEach((ob,i)=>{const x=CX0+dx*(i+1);let yb=CTOP-14;if(st.dropT!==null){const target=restY(p,ob),tt=Math.max(0,st.dropT-i*0.12),f=clamp(tt/1.4,0,1);yb=lerp(CTOP-14,target,1-Math.pow(1-f,3));
      if(!RM&&f>=1&&target<CBOT-3)yb+=Math.sin(t*2+i)*1.2;}
    drawObjIcon(ctx,ob.id,x,yb,1);});
  // legend with outcomes
  const lx=500,fs=13*Math.min(k,1.6);let y=CTOP;txt(ctx,st.dropT===null?'Predict first':'What happened',lx,y-22,{s:fs*1.1,w:800});
  COLOBJ.forEach(ob=>{drawObjIcon(ctx,ob.id,lx+14,y+OH*0.6,0.6);txt(ctx,ob.n+'  '+(ob.d===0.917?'0.917':ob.d.toFixed(2))+' g/cm³',lx+34,y+4,{s:fs,w:700,b:'middle'});
    txt(ctx,st.dropT===null?'?':outcome(p,ob),lx+34,y+4+fs*1.25,{s:fs*0.9,c:PAL['cv-soft'],b:'middle'});y+=Math.max(52,fs*3);});}

BioLab.register(SIM);
})();
