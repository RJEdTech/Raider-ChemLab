(function(){
'use strict';
const {clamp,lerp,rng,randn,rr,txt,pill,atLeast,PAL,FONT,RM,axes,legend,serColor,lvText}=BioLab.h;
const CL=window.ChemLab;
const KW=CL.K.Kw;
const V0=100;                      // mL in each beaker
const UNIT=0.5;                    // mmol per particle in the zooms
const ZR=100,ZC=[[250,192],[650,192]];
const VADD=20;                     // most acid or base you can add (mL)

/* ---------- chemistry: exact pH from the charge balance ---------- */
function solvePH(sys,na,cl){
  const f=pH=>{const h=Math.pow(10,-pH);let q=h-KW/h+na-cl;
    for(const s of sys){if(!(s.C>0))continue;const n=s.ka.length,t=[1];let prod=1;for(let i=1;i<=n;i++){prod*=s.ka[i-1]/h;t.push(prod);}
      const sum=t.reduce((a,b)=>a+b,0);let z=0;for(let i=0;i<=n;i++)z+=t[i]/sum*(s.z0-i);q+=s.C*z;}
    return q;};
  let lo=-1.5,hi=15.5;for(let i=0;i<64;i++){const m=(lo+hi)/2;if(f(m)>0)lo=m;else hi=m;}return (lo+hi)/2;}
const kaOf=f=>{const a=CL.acids.find(x=>x.f===f);return a?a.Ka:NaN;};
/* Each buffer: the conjugate pair (acid form ⇌ base form + H⁺) with the full Ka list of the parent acid.
   step = which Ka belongs to the pair; z0 = charge of the fully protonated parent; salt = Na⁺ (or Cl⁻) that comes with each form. */
const SYS={
  acetate:{n:'Acetic acid / acetate',ha:'HC₂H₃O₂',a:'C₂H₃O₂⁻',ka:[kaOf('HC2H3O2')],step:0,z0:0,sHA:{na:0},sA:{na:1},col:'#d9822b',gHA:'',gA:'−',made:'acetic acid + sodium acetate'},
  ammonia:{n:'Ammonium / ammonia',ha:'NH₄⁺',a:'NH₃',ka:[kaOf('NH4+')],step:0,z0:1,sHA:{cl:1},sA:{},col:'#3a62e0',gHA:'+',gA:'',made:'NH₄Cl + NH₃'},
  phos:{n:'Phosphate (H₂PO₄⁻ / HPO₄²⁻)',ha:'H₂PO₄⁻',a:'HPO₄²⁻',ka:[7.5e-3,6.2e-8,4.2e-13],step:1,z0:0,sHA:{na:1},sA:{na:2},col:'#e08a2e',gHA:'−',gA:'2−',made:'NaH₂PO₄ + Na₂HPO₄'},
  blood:{n:'Blood: carbonic acid / bicarbonate',ha:'H₂CO₃',a:'HCO₃⁻',ka:[7.9e-7,4.7e-11],step:0,z0:0,sHA:{},sA:{na:1},col:'#8e6bd6',gHA:'',gA:'−',made:'CO₂ (as H₂CO₃) + HCO₃⁻',fixed:{HA:1.2e-3,A:2.4e-2}}};
const pKa=s=>-Math.log10(s.ka[s.step]);
/* starting mmol of each form in the 100 mL buffer */
function forms(p){const s=SYS[p.sys]||SYS.acetate;if(s.fixed)return {s,HA:s.fixed.HA*V0,A:s.fixed.A*V0};const tot=(+p.conc)*V0,r=+p.ratio;return {s,HA:tot/(1+r),A:tot*r/(1+r)};}
function bufferPH(p,acid,base){const f=forms(p),s=f.s,V=V0+acid+base;   // acid, base: mmol (= mL of 1.0 M) added
  const na=(f.HA*(s.sHA.na||0)+f.A*(s.sA.na||0)+base)/V,cl=(f.HA*(s.sHA.cl||0)+f.A*(s.sA.cl||0)+acid)/V;
  return solvePH([{C:(f.HA+f.A)/V,ka:s.ka,z0:s.z0}],na,cl);}
const waterPH=(acid,base)=>solvePH([],base/(V0+acid+base),acid/(V0+acid+base));
/* mmol of each form after an addition (stoichiometric picture, as in an ICE/BCA table) */
function afterAdd(p,acid,base){const f=forms(p),x=acid-base;let HA=f.HA,A=f.A;if(x>0){const u=Math.min(x,A);A-=u;HA+=u;}else{const u=Math.min(-x,HA);HA-=u;A+=u;}return {HA,A,freeH:Math.max(0,x-f.A),freeOH:Math.max(0,-x-f.HA)};}
function calc(sim){const p=sim.p,st=sim.st;return {pw:waterPH(st.acid,st.base),pb:bufferPH(p,st.acid,st.base),pw0:7.0,pb0:bufferPH(p,0,0),f:forms(p),af:afterAdd(p,st.acid,st.base)};}

function add(sim,kind){const st=sim.st,d=+sim.p.dose;if(st.acid+st.base+d>VADD+1e-9){sim.vis.full=2;return;}
  if(kind==='acid')st.acid+=d;else st.base+=d;st.last=kind;
  const c=calc(sim);st.hist.push({x:st.acid-st.base,pw:c.pw,pb:c.pb});sim.infoDirty=true;}

/* ---------- mode-aware UI ---------- */
function syncMode(sim){if(!sim.ui||!sim.ui.sec)return;const mode=sim.p.sys==='blood'?'blood':'lab',d=sim.def;
  d.controls.forEach(c=>{if(!c.modes)return;const cid=d.id+'-'+c.id,e=document.getElementById(cid)||document.getElementById(cid+'-l');if(!e)return;const w=e.closest('.ctl');if(w)w.hidden=!atLeast(c.lvl)||!c.modes.includes(mode);});
  sim.infoDirty=true;}

/* ---------- particles ---------- */
function P(t,x,y){return {t,x,y,vx:randn()*12,vy:randn()*12,a:Math.random()*6.28,life:0};}
function rp(r){const a=r()*6.283,d=Math.sqrt(r())*(ZR-14);return [Math.cos(a)*d,Math.sin(a)*d];}
function rebuild(sim){const p=sim.p,st=sim.st,v=sim.vis,f=forms(p),r=rng(9);
  const nH=Math.floor(st.acid/UNIT+1e-9),nOH=Math.floor(st.base/UNIT+1e-9),x=nH-nOH;
  const HA0=Math.round(f.HA/UNIT),A0=Math.round(f.A/UNIT);let HA=HA0,A=A0,fh=0,fo=0;
  if(x>0){const u=Math.min(x,A);A-=u;HA+=u;fh=x-u;}else{const u=Math.min(-x,HA);HA-=u;A+=u;fo=-x-u;}
  const mk=(L,t,n)=>{for(let i=0;i<n;i++){const q=rp(r);L.push(P(t,q[0],q[1]));}};
  const W=[],B=[];mk(W,'H3O',Math.max(0,x));mk(W,'OH',Math.max(0,-x));mk(B,'HA',HA);mk(B,'A',A);mk(B,'H3O',fh);mk(B,'OH',fo);
  v.P=[W,B];v.nH=nH;v.nOH=nOH;v.key=p.sys+'|'+p.conc+'|'+p.ratio;}
const PARTNER={H3O:['OH','A'],OH:['H3O','HA']};
function stepP(L,dt,newP){const R=ZR-10;
  for(const q of L){if(q.dead)continue;
    if(q.t==='W'){q.life-=dt;q.y-=6*dt;if(q.life<=0)q.dead=true;continue;}
    let steer=false;
    if(q.hunt&&PARTNER[q.t]){let best=null,bd=1e9;for(const o of L){if(o.dead||o===q||!PARTNER[q.t].includes(o.t))continue;const d=Math.hypot(o.x-q.x,o.y-q.y);if(d<bd){bd=d;best=o;}}
      if(best){steer=true;q.vx+=(best.x-q.x)/Math.max(1,bd)*170*dt;q.vy+=(best.y-q.y)/Math.max(1,bd)*170*dt;
        if(bd<13){const mx=(q.x+best.x)/2,my=(q.y+best.y)/2;
          if(best.t==='OH'||best.t==='H3O'){q.dead=true;best.dead=true;newP.push(Object.assign(P('W',mx-6,my),{life:1.8}),Object.assign(P('W',mx+6,my),{life:1.8}));}
          else{q.dead=true;best.t=best.t==='A'?'HA':'A';best.flash=0.6;newP.push(Object.assign(P('W',mx,my),{life:1.8}));}}}
      else q.hunt=false;}
    q.vx+=randn()*60*dt;q.vy+=randn()*60*dt;q.vx*=0.98;q.vy*=0.98;const sp=Math.hypot(q.vx,q.vy),mx=steer?75:(q.fresh?60:28);if(sp>mx){q.vx*=mx/sp;q.vy*=mx/sp;}
    q.x+=q.vx*dt;q.y+=q.vy*dt;q.a+=dt;if(q.flash)q.flash=Math.max(0,q.flash-dt);const d=Math.hypot(q.x,q.y);if(d>R){q.x*=R/d;q.y*=R/d;q.vx*=-0.6;q.vy*=-0.6;q.fresh=0;}}}
function syncParticles(sim,vdt){const st=sim.st,v=sim.vis,p=sim.p;
  const key=p.sys+'|'+p.conc+'|'+p.ratio,nH=Math.floor(st.acid/UNIT+1e-9),nOH=Math.floor(st.base/UNIT+1e-9);
  if(!v.P||v.key!==key||nH<v.nH||nOH<v.nOH){rebuild(sim);return;}
  let g=0;while((v.nH<nH||v.nOH<nOH)&&g++<20){const t=v.nH<nH?'H3O':'OH';if(t==='H3O')v.nH++;else v.nOH++;
    v.P.forEach((L,i)=>{const q=P(t,randn()*14+(i?0:0),-ZR+12);q.vy=55;q.fresh=1;q.hunt=true;L.push(q);});}
  if(!RM&&vdt>0)v.P.forEach((L,i)=>{const n=[];stepP(L,vdt,n);v.P[i]=L.filter(q=>!q.dead).concat(n);});}
function ball(ctx,x,y,r,c,a){if(a!==undefined)ctx.globalAlpha=a;const g=ctx.createRadialGradient(x-r*.35,y-r*.35,r*.15,x,y,r);g.addColorStop(0,'#ffffff');g.addColorStop(.3,c);g.addColorStop(1,CL.shade(c,-0.35));ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,6.29);ctx.fill();ctx.strokeStyle=CL.shade(c,-0.5);ctx.lineWidth=1;ctx.stroke();ctx.globalAlpha=1;}
function sign(ctx,x,y,s){if(!s)return;ctx.font='800 '+(s.length>1?10:11)+'px '+FONT;ctx.fillStyle='#fff';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(s,x,y+0.5);}
function drawP(ctx,q,x,y,S){switch(q.t){
  case 'H3O':ball(ctx,x,y,6.5,'#d22d68');sign(ctx,x,y,'+');break;
  case 'OH':{ball(ctx,x+Math.cos(q.a)*7,y+Math.sin(q.a)*7,3.6,'#f4f4f4');ball(ctx,x,y,6.5,'#d8443a');sign(ctx,x,y,'−');break;}
  case 'W':{const a=clamp(q.life/1.8,0,1);ball(ctx,x-5,y+3,3.2,'#f4f4f4',a);ball(ctx,x+5,y+3,3.2,'#f4f4f4',a);ball(ctx,x,y,5.5,'#d8443a',a);break;}
  case 'HA':{ball(ctx,x+Math.cos(q.a)*9,y+Math.sin(q.a)*9,4.2,'#f4f4f4');ball(ctx,x,y,7.5,S.col);sign(ctx,x,y,S.gHA);break;}
  case 'A':ball(ctx,x,y,7.5,S.col);sign(ctx,x,y,S.gA);break;}
  if(q.flash){ctx.strokeStyle=PAL['s4'];ctx.lineWidth=2;ctx.globalAlpha=clamp(q.flash*2,0,1);ctx.beginPath();ctx.arc(x,y,12+(0.6-q.flash)*18,0,6.29);ctx.stroke();ctx.globalAlpha=1;}}
const UNI=[[0,'#c4161c'],[2,'#e2421e'],[3,'#ec6a1f'],[4,'#f39a1f'],[5,'#f2c61c'],[6,'#cfd120'],[7,'#45a447'],[8,'#2a9a86'],[9,'#2f78c2'],[10,'#3554b3'],[12,'#433aa3'],[14,'#5b2a8c']];
function hex2(h){h=h.replace('#','');if(h.length===3)h=h.split('').map(c=>c+c).join('');return [0,2,4].map(i=>parseInt(h.slice(i,i+2),16));}
function mix(a,b,t){const A=hex2(a),B=hex2(b);return '#'+A.map((v,i)=>Math.round(lerp(v,B[i],clamp(t,0,1))).toString(16).padStart(2,'0')).join('');}
function uni(pH){for(let i=1;i<UNI.length;i++)if(pH<=UNI[i][0])return mix(UNI[i-1][1],UNI[i][1],(pH-UNI[i-1][0])/(UNI[i][0]-UNI[i-1][0]));return UNI[UNI.length-1][1];}
const fmm=x=>(x<0.05&&x>0?x.toFixed(3):x.toFixed(1));

const BUF={
  id:'buffers',hash:'buffers',apUnit:14,order:3,tab:'Buffers',kind:'Simulation',
  prereq:['ph','titration'],next:['equilibrium'],
  card:'Drip acid and base into plain water and into a buffer side by side, and see which one holds its pH, and when it gives out.',
  title:'Buffers: why some solutions resist pH change',
  lede:{bio:'Add the same acid or base to plain water and to a buffer. Watch the pH meters, then zoom in to see what the buffer does with the H₃O⁺ and OH⁻.',
        honors:'A buffer is a weak acid and its conjugate base together. Compare buffer systems and concentrations, and find out how much acid a buffer can take before it breaks.',
        ap:'Set the base : acid ratio and predict pH with Henderson–Hasselbalch, pick a buffer for a target pH, and see why the blood’s bicarbonate buffer needs your lungs.'},
  scale:{bio:'Two beakers of 100 mL each. Every addition is 1.0 M HCl or 1.0 M NaOH from a dropper. In the zooms, one particle stands for 0.5 mmol.',
         ap:'Two 100.0 mL beakers; additions of 1.0 M HCl or NaOH (1 mL = 1.0 mmol). Zoom particles: 1 = 0.5 mmol (about 3 × 10²⁰ ions). Spectator Na⁺ and Cl⁻ are not drawn.'},
  timeless:true,animated:true,chChange:0.8,chReveal:3.5,
  controls:[
    {id:'dose',label:'Amount per addition (1.0 M)',type:'seg',def:1,lvl:'bio',options:[{v:0.2,l:'4 drops (0.2 mL)'},{v:1,l:'1.0 mL'},{v:5,l:'5.0 mL'}]},
    {id:'sys',label:'Buffer system',type:'select',def:'acetate',lvl:'honors',options:[{v:'acetate',l:'Acetic acid / acetate (pKa 4.74)'},{v:'phos',l:'Phosphate, H₂PO₄⁻ / HPO₄²⁻ (pKa 7.21)'},{v:'ammonia',l:'Ammonium / ammonia (pKa 9.25)'},{v:'blood',l:'Blood: H₂CO₃ / HCO₃⁻ (pKa 6.1 at 37 °C)',lvl:'ap'}],onChange(sim){BioLab.reset(sim);syncMode(sim);}},
    {id:'conc',label:'Buffer concentration (acid + base)',type:'seg',def:0.1,lvl:'honors',modes:['lab'],options:[{v:0.02,l:'0.020 M'},{v:0.1,l:'0.10 M'},{v:0.5,l:'0.50 M'}],onChange(sim){BioLab.reset(sim);},help:'More concentrated buffers can absorb more acid or base.'},
    {id:'ratio',label:'Ratio of base form to acid form',type:'select',def:1,lvl:'ap',modes:['lab'],options:[0.1,0.25,0.5,1,2,4,10,20].map(r=>({v:r,l:(r<1?'1 : '+(1/r):r+' : 1')+(r===1?' (equal amounts)':'')})),onChange(sim){BioLab.reset(sim);}}
  ],
  actions:[
    {id:'acid',label:'Add HCl to both',lvl:'bio',primary:true,run(sim){add(sim,'acid');}},
    {id:'base',label:'Add NaOH to both',lvl:'bio',primary:true,run(sim){add(sim,'base');}},
    {id:'fresh',label:'Fresh beakers',lvl:'bio',run(sim){BioLab.reset(sim);}}
  ],
  init(sim){const pb=bufferPH(sim.p,0,0);return {acid:0,base:0,last:null,hist:[{x:0,pw:7,pb}]};},
  step(sim,dt){},
  metrics:[
    {id:'pw',label:'pH of water',unit:'',lvl:'bio',min:0,max:14,d:2,fixed:true,get:s=>calc(s).pw},
    {id:'pb',label:'pH of buffer',unit:'',lvl:'bio',min:0,max:14,d:2,fixed:true,get:s=>calc(s).pb},
    {id:'dw',label:'Change in water’s pH',unit:'',lvl:'bio',min:-7,max:7,d:2,get:s=>{const c=calc(s);return c.pw-7;}},
    {id:'db',label:'Change in buffer’s pH',unit:'',lvl:'bio',min:-7,max:7,d:2,get:s=>{const c=calc(s);return c.pb-c.pb0;}},
    {id:'nA',label:'Base form left',unit:'mmol',lvl:'honors',min:0,max:null,d:2,get:s=>calc(s).af.A},
    {id:'nHA',label:'Acid form left',unit:'mmol',lvl:'honors',min:0,max:null,d:2,get:s=>calc(s).af.HA},
    {id:'hh',label:'Henderson–Hasselbalch pH',unit:'',lvl:'ap',min:0,max:14,d:2,fixed:true,get:s=>{const c=calc(s),a=c.af;return a.A>1e-9&&a.HA>1e-9?pKa(c.f.s)+Math.log10(a.A/a.HA):NaN;}},
    {id:'cap',label:'HCl it can still absorb',unit:'mmol',lvl:'ap',min:0,max:null,d:2,get:s=>calc(s).af.A}
  ],
  graphs:[{id:'curve',label:'pH vs acid or base added',lvl:'bio',custom:true},{id:'forms',label:'Acid form and base form (mmol)',lvl:'honors',custom:true}],
  defaultGraph:'curve',
  plot(sim,ctx,box,id){const p=sim.p,st=sim.st,c=calc(sim);
    if(id==='forms'){const a=c.af,mx=Math.max(1,c.f.HA+c.f.A)*1.05;const ax=axes(ctx,box,{xmin:0,xmax:2,ymin:0,ymax:mx,xcats:[c.f.s.ha+' (acid form)',c.f.s.a+' (base form)'],yl:'mmol in the buffer'});
      const w=0.5;[[a.HA,serColor(1)],[a.A,serColor(3)]].forEach(([v,col],i)=>{ctx.fillStyle=col;const x0=ax.X(i+0.5-w/2),x1=ax.X(i+0.5+w/2);ctx.fillRect(x0,ax.Y(v),x1-x0,ax.Y(0)-ax.Y(v));txt(ctx,v.toFixed(2)+' mmol',(x0+x1)/2,ax.Y(v)-6,{s:13,w:600,c:PAL['fg'],a:'center'});});
      ctx.strokeStyle=PAL['muted'];ctx.setLineDash([5,4]);[c.f.HA,c.f.A].forEach((v,i)=>{ctx.beginPath();ctx.moveTo(ax.X(i+0.5-w/2-0.05),ax.Y(v));ctx.lineTo(ax.X(i+0.5+w/2+0.05),ax.Y(v));ctx.stroke();});ctx.setLineDash([]);
      legend(ctx,box.L+12,box.T+10,[{label:'at the start',color:PAL['muted'],dash:true}]);return;}
    const lim=Math.min(VADD,Math.max(4,Math.ceil((c.f.HA+c.f.A)*1.3)));
    const ax=axes(ctx,box,{xmin:-lim,xmax:lim,ymin:0,ymax:14,xl:'mmol of NaOH added  ←   0   →  mmol of HCl added',yl:'pH'});
    // the x axis here runs base (left) to acid (right); draw full model curves dashed, then your additions as dots
    const X=x=>ax.X(-x);// x = acid − base, plotted with acid to the right
    ctx.save();ctx.beginPath();ctx.rect(box.L,box.T,box.W,box.H);ctx.clip();ctx.setLineDash([5,4]);ctx.lineWidth=2;
    [[n=>n>=0?waterPH(n,0):waterPH(0,-n),serColor(0)],[n=>n>=0?bufferPH(p,n,0):bufferPH(p,0,-n),serColor(1)]].forEach(([fn,col])=>{ctx.strokeStyle=col;ctx.beginPath();for(let n=-lim;n<=lim+1e-9;n+=lim/120){const y=fn(n);n<=-lim?ctx.moveTo(ax.X(n),ax.Y(y)):ctx.lineTo(ax.X(n),ax.Y(y));}ctx.stroke();});
    ctx.setLineDash([]);st.hist.forEach(h=>{[[h.pw,serColor(0)],[h.pb,serColor(1)]].forEach(([y,col])=>{ctx.fillStyle=col;ctx.beginPath();ctx.arc(ax.X(h.x),ax.Y(y),5,0,6.29);ctx.fill();ctx.strokeStyle=PAL['card'];ctx.lineWidth=1.5;ctx.stroke();});});
    ctx.restore();legend(ctx,box.L+12,box.T+10,[{label:'water',color:serColor(0)},{label:'buffer',color:serColor(1)},{label:'model (dashed), your additions (dots)',color:PAL['muted'],dash:true}]);},
  infoPanel(sim){const p=sim.p,st=sim.st,c=calc(sim),s=c.f.s,hon=atLeast('honors'),ap=atLeast('ap'),a=c.af,x=st.acid-st.base;
    let h=`<h3>Inside the buffer</h3><p>This buffer is ${s.made}: ${fmm(c.f.HA)} mmol of ${s.ha} and ${fmm(c.f.A)} mmol of ${s.a} in ${V0} mL.</p>`;
    if(hon){h+=`<div class="tbl-wrap"><table><thead><tr><th></th><th>${x>=0?'H₃O⁺ added':'OH⁻ added'}</th><th>${s.ha}</th><th>${s.a}</th></tr></thead><tbody>
      <tr><td>Before</td><td>${Math.abs(x).toFixed(2)} mmol</td><td>${fmm(c.f.HA)}</td><td>${fmm(c.f.A)}</td></tr>
      <tr><td>Change</td><td>−${Math.min(Math.abs(x),x>=0?c.f.A:c.f.HA).toFixed(2)}</td><td>${x>=0?'+':'−'}${Math.min(Math.abs(x),x>=0?c.f.A:c.f.HA).toFixed(2)}</td><td>${x>=0?'−':'+'}${Math.min(Math.abs(x),x>=0?c.f.A:c.f.HA).toFixed(2)}</td></tr>
      <tr><td>After</td><td>${(x>=0?a.freeH:a.freeOH).toFixed(2)} mmol left over</td><td>${fmm(a.HA)}</td><td>${fmm(a.A)}</td></tr></tbody></table></div>`;
      h+=`<p class="help">${x>=0?s.a+' + H₃O⁺ → '+s.ha+' + H₂O':s.ha+' + OH⁻ → '+s.a+' + H₂O'}. ${(x>=0?a.freeH:a.freeOH)>0?'<b>The buffer has broken:</b> its '+(x>=0?s.a:s.ha)+' is used up, so the extra '+(x>=0?'H₃O⁺':'OH⁻')+' stays in solution.':'The buffer still has '+fmm(x>=0?a.A:a.HA)+' mmol of '+(x>=0?s.a:s.ha)+' to absorb more '+(x>=0?'acid':'base')+'.'}</p>`;}
    if(ap){const ok=a.A>1e-9&&a.HA>1e-9;h+=`<p><b>Henderson–Hasselbalch:</b> pH = pKa + log([${s.a}]/[${s.ha}]) = ${pKa(s).toFixed(2)} + log(${fmm(a.A)} / ${fmm(a.HA)}) = ${ok?(pKa(s)+Math.log10(a.A/a.HA)).toFixed(2):'undefined'}. Exact pH from the full equilibrium: ${c.pb.toFixed(2)}.</p>`;
      if(p.sys==='blood')h+=`<p class="help">In your body, extra H₂CO₃ breaks down to CO₂ that you breathe out, and your kidneys adjust HCO₃⁻. That keeps blood near pH 7.40 far better than this closed beaker can.</p>`;}
    return h;},
  narrate(sim){const p=sim.p,st=sim.st,c=calc(sim),s=c.f.s,hon=atLeast('honors'),a=c.af;
    if(sim.vis.full>0)return 'Each beaker can take at most '+VADD+' mL. Press <b>Fresh beakers</b> to start over.';
    if(!st.last)return 'Both beakers have a pH meter. The water reads 7.00 and the buffer reads '+c.pb0.toFixed(2)+'. <b>Add HCl or NaOH to both</b> and compare how far each pH moves.';
    const x=st.acid-st.base,acid=st.last==='acid',broke=acid?a.freeH>0:a.freeOH>0;
    let t='Water went from 7.00 to <b>'+c.pw.toFixed(2)+'</b>, because nothing in it can take up the '+(acid?'H₃O⁺':'OH⁻')+'. ';
    if(broke)t+='The buffer went from '+c.pb0.toFixed(2)+' to <b>'+c.pb.toFixed(2)+'</b>: it has <b>run out of '+(acid?s.a:s.ha)+'</b>, so the extra '+(acid?'H₃O⁺':'OH⁻')+' stays free. Its capacity is used up.';
    else t+='The buffer only moved from '+c.pb0.toFixed(2)+' to <b>'+c.pb.toFixed(2)+'</b>: '+(acid?'its '+s.a+' grabs each H₃O⁺ and becomes '+s.ha:'its '+s.ha+' hands H⁺ to each OH⁻, making water and '+s.a)+'.'+(hon?' Left: '+fmm(a.A)+' mmol '+s.a+', '+fmm(a.HA)+' mmol '+s.ha+'.':'');
    return t;},
  tour:[
    {title:'Two beakers, two pH meters',text:{bio:'On the left is pure water. On the right is a buffer made of acetic acid and sodium acetate. We will add exactly the same acid and base to both.',honors:'The buffer holds a weak acid (HC₂H₃O₂) and its conjugate base (C₂H₃O₂⁻) in equal amounts: 5.0 mmol of each.'},focus:[0,0,800,450],pause:true,setup(sim){BioLab.setValues(sim,{sys:'acetate',conc:0.1,ratio:1,dose:1});BioLab.reset(sim);}},
    {title:'Acid into water',text:'1 mL of 1.0 M HCl goes into the water. The pink H₃O⁺ ions have nothing to react with, so they stay, and the pH crashes from 7 to 2.',focus:[[ZC[0][0]-ZR-6,ZC[0][1]-ZR-6,2*ZR+12,2*ZR+12],[100,310,200,70]],speed:0.4,setup(sim){add(sim,'acid');}},
    {title:'Acid into the buffer',text:'The same H₃O⁺ goes into the buffer. Each one finds an acetate ion (orange, −) and gives it its H⁺: C₂H₃O₂⁻ + H₃O⁺ → HC₂H₃O₂ + H₂O. The H₃O⁺ is gone, so the pH barely moves.',focus:[[ZC[1][0]-ZR-6,ZC[1][1]-ZR-6,2*ZR+12,2*ZR+12],[500,310,200,70]],speed:0.4},
    {title:'Base into the buffer',text:'Now add NaOH twice. Each OH⁻ (red with a white H) takes an H⁺ from an acetic acid molecule: HC₂H₃O₂ + OH⁻ → C₂H₃O₂⁻ + H₂O. The buffer works in both directions.',focus:[[ZC[1][0]-ZR-6,ZC[1][1]-ZR-6,2*ZR+12,2*ZR+12],[500,310,200,70]],speed:0.4,setup(sim){add(sim,'base');add(sim,'base');}},
    {title:'Every buffer has a limit',text:'Add 5 mL of HCl, twice. Partway through, the last of the acetate is used up. After that, extra H₃O⁺ stays free and the buffer’s pH drops sharply. That limit is the buffer capacity.',focus:[[ZC[1][0]-ZR-6,ZC[1][1]-ZR-6,2*ZR+12,2*ZR+12],[500,310,200,70]],speed:0.4,setup(sim){BioLab.setValues(sim,{dose:5});add(sim,'acid');add(sim,'acid');}},
    {lvl:'honors',title:'More buffer, more capacity',text:{honors:'A 0.50 M buffer holds five times as much acid and base, so it can absorb five times as much before it breaks. Its starting pH is the same, because the ratio is the same.',ap:'Henderson–Hasselbalch: pH = pKa + log([A⁻]/[HA]). Concentration sets the capacity; the ratio sets the pH. A buffer works best within about ±1 pH unit of its pKa.'},focus:[0,300,800,150],pause:true,setup(sim){BioLab.setValues(sim,{dose:1,conc:0.5});add(sim,'acid');}},
    {lvl:'ap',title:'The blood buffer',text:'Blood uses H₂CO₃ / HCO₃⁻ at a ratio of about 1 : 20, so pH = 6.1 + log 20 = 7.4. That ratio is far from 1 : 1, so in a closed beaker a little acid moves the pH a lot. In your body, the lungs breathe out the extra CO₂, which keeps the ratio and the pH steady.',focus:[0,0,800,450],pause:true,setup(sim){BioLab.setValues(sim,{sys:'blood',dose:0.2});add(sim,'acid');}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{sys:'acetate',conc:0.1,ratio:1,dose:1});BioLab.reset(sim);syncMode(sim);},
  onChallenge(sim,ch,phase){if(ch&&ch.instant&&ch.set&&phase==='done'){BioLab.setValues(sim,ch.set);BioLab.reset(sim);syncMode(sim);}},
  challenges(sim){
    const P0={sys:'acetate',conc:0.1,ratio:1,dose:1};const Q=o=>Object.assign({},P0,o);
    const b0=bufferPH(Q({}),0,0),b1=bufferPH(Q({}),1,0),bB=bufferPH(Q({}),0,1),w1=waterPH(1,0),wB=waterPH(0,1),b5=bufferPH(Q({}),5,0),w5=waterPH(5,0);
    const d0=bufferPH(Q({conc:0.02}),0,0),r10=bufferPH(Q({ratio:10}),0,0),bl0=bufferPH(Q({sys:'blood'}),0,0),bl1=bufferPH(Q({sys:'blood'}),0.2,0);
    return [
    {lvl:'bio',q:'You add 1 mL of 1.0 M HCl to both beakers. Which pH changes more?',choices:['The water','The buffer','They change the same amount, because they got the same acid'],correct:0,
     baseline:{},changeAction:'acid',changeText:'1 mL of 1.0 M HCl added to each beaker',watch:'curve',
     explain:{bio:'Water fell from 7.00 to '+w1.toFixed(2)+', a drop of '+(7-w1).toFixed(1)+' pH units. The buffer only went from '+b0.toFixed(2)+' to '+b1.toFixed(2)+'. In the zoom, acetate ions caught the H₃O⁺ and turned into acetic acid, so the H₃O⁺ did not pile up.'}},
    {lvl:'bio',q:'Now add 1 mL of 1.0 M NaOH to both beakers. What happens to the buffer’s pH?',choices:['It rises a little','It rises a lot, to about 12','It falls'],correct:0,
     baseline:{},changeAction:'base',changeText:'1 mL of 1.0 M NaOH added to each beaker',watch:'curve',
     explain:{bio:'The buffer rose only from '+b0.toFixed(2)+' to '+bB.toFixed(2)+', while the water jumped to '+wB.toFixed(2)+'. The acetic acid in the buffer gives H⁺ to each OH⁻, making water. A buffer has a part that reacts with acid and a part that reacts with base.'}},
    {lvl:'honors',q:'The buffer holds 5.0 mmol of acetate. You add 5 mL of 1.0 M HCl (5.0 mmol) at once. What happens to its pH?',choices:['It barely moves: buffers always hold their pH','The acetate is used up and the pH falls sharply','It rises'],correct:1,
     baseline:{dose:5},changeAction:'acid',changeText:'5 mL of 1.0 M HCl added to each beaker',watch:'curve',
     explain:{honors:'The buffer fell from '+b0.toFixed(2)+' to '+b5.toFixed(2)+' (the water fell to '+w5.toFixed(2)+'). All 5.0 mmol of acetate became acetic acid, so the solution is now just a weak acid. A buffer’s capacity is set by how many moles of each part it holds.'}},
    {lvl:'honors',q:'You make the buffer 5× more dilute (0.10 M → 0.020 M) but keep equal amounts of acid and base. What happens to its starting pH?',choices:['It stays about the same','It rises by about 0.7','It falls by about 0.7'],correct:0,
     baseline:{conc:0.1},change:{conc:0.02},changeText:'Buffer diluted to 0.020 M',
     explain:{honors:'The pH went from '+b0.toFixed(2)+' to '+d0.toFixed(2)+'. A buffer’s pH depends on the ratio of base to acid, which did not change. What did change is its capacity: it now holds only 1.0 mmol of acetate, so a single mL of 1.0 M HCl would break it.'}},
    {lvl:'ap',instant:true,set:{sys:'acetate',conc:0.1,ratio:10},q:'An acetate buffer has 10 times as much acetate as acetic acid (pKa 4.74). What is its pH?',choices:['3.74','4.74','5.74','14.0'],correct:2,
     explain:{ap:'pH = pKa + log([A⁻]/[HA]) = 4.74 + log 10 = 5.74. The model is now set to a 10 : 1 ratio; the exact equilibrium gives '+r10.toFixed(2)+'. Every 10× change in the ratio moves the pH by 1.'}},
    {lvl:'ap',instant:true,set:{sys:'phos',conc:0.1,ratio:1},q:'You need a buffer that holds pH 7.2. Which system should you choose?',choices:['Acetic acid / acetate (pKa 4.74)','Phosphate, H₂PO₄⁻ / HPO₄²⁻ (pKa 7.21)','Ammonium / ammonia (pKa 9.25)'],correct:1,
     explain:{ap:'Pick the pair whose pKa is closest to the target, so you can use a ratio near 1 : 1, where the buffer resists acid and base equally well. The model is now set to the phosphate buffer at 1 : 1: pH '+bufferPH(Q({sys:'phos'}),0,0).toFixed(2)+'. This is why phosphate buffers are used in biology labs.'}},
    {lvl:'ap',q:'Blood’s buffer is H₂CO₃ / HCO₃⁻ at about 1 : 20 (pH 7.40). In a closed beaker of blood buffer, you add 4 drops of 1.0 M acid. What happens?',choices:['The pH barely changes, because blood is a strong buffer','The pH falls noticeably, because H₂CO₃ is the small part and builds up fast','The pH rises'],correct:1,
     baseline:{sys:'blood',dose:0.2},changeAction:'acid',changeText:'4 drops of 1.0 M HCl added',watch:'curve',
     explain:{ap:'The pH fell from '+bl0.toFixed(2)+' to '+bl1.toFixed(2)+'. Only 0.12 mmol of H₂CO₃ was there, and 0.20 mmol more formed, so the ratio fell from 20 : 1 to about 6 : 1. In the body this does not happen, because the lungs remove the extra H₂CO₃ as CO₂ (an open system), and blood proteins add more buffering.'}}
  ];},
  lab:{bio:'<p><b>Question:</b> Does a buffer resist pH change better than water?</p><ol><li>Record a trial before adding anything.</li><li>Press <b>Add HCl to both</b> and record a trial. Repeat 3 times.</li><li>Press <b>Fresh beakers</b> and repeat with NaOH.</li></ol><p>Make a table of the pH of water and of the buffer after each addition. Describe what the buffer’s particles do with the acid and the base.</p>',
       honors:'<p><b>Question:</b> How much acid can a buffer absorb, and what controls that amount?</p><ol><li>Set the dose to 1.0 mL. Add HCl one mL at a time to the 0.10 M acetate buffer until its pH drops below 3.5. Record each step.</li><li>Repeat with 0.020 M and 0.50 M buffers.</li><li>Repeat with the phosphate and ammonia buffers.</li></ol><p>Graph pH against mmol of HCl added for each. Explain capacity in terms of moles of the base form.</p>',
       ap:'<p><b>Question:</b> Can you design a buffer for a target pH, and predict its pH with Henderson–Hasselbalch? (Mirrors “Buffers Two Ways”.)</p><ol><li>Choose a system for pH 5.0, 7.0 and 9.5. Pick the ratio that gets closest, and record the exact pH.</li><li>Compare each with the Henderson–Hasselbalch readout.</li><li>Add 1.0 mmol HCl and 1.0 mmol NaOH to each and record ΔpH.</li></ol><p><b>Claim–evidence–reasoning:</b> Explain why a 1 : 1 buffer resists acid and base equally, and why the blood buffer depends on breathing.</p>'},
  terms:[{t:'Buffer',d:'A solution that resists changes in pH when small amounts of acid or base are added.'},{t:'Weak acid',d:'An acid that only partly gives up H⁺, such as acetic acid.'},{t:'Conjugate base',d:'What is left after an acid gives up H⁺. Acetate, C₂H₃O₂⁻, is the conjugate base of acetic acid.'},{t:'Neutralize',d:'React an acid with a base so that H₃O⁺ and OH⁻ become water.'},
    {lvl:'honors',t:'Conjugate acid–base pair',d:'Two species that differ by one H⁺, like HC₂H₃O₂ / C₂H₃O₂⁻ or NH₄⁺ / NH₃.'},{lvl:'honors',t:'Buffer capacity',d:'How much acid or base a buffer can absorb before its pH changes sharply. It depends on the moles of each part.'},
    {lvl:'ap',t:'Henderson–Hasselbalch equation',d:'pH = pKa + log([A⁻]/[HA]).'},{lvl:'ap',t:'Buffer range',d:'About pKa ± 1, where the ratio [A⁻]/[HA] is between 1 : 10 and 10 : 1.'},{lvl:'ap',t:'Open system',d:'A system that trades matter with its surroundings. Blood is open to CO₂ through the lungs.'}],
  about:'<p>Both pH meters read the exact equilibrium pH, solved from the charge balance with every species of the parent acid (for example, all four phosphate species), Kw = 1.0 × 10⁻¹⁴, and the added Na⁺ and Cl⁻. Volumes add. Ka values (25 °C): acetic acid 1.8 × 10⁻⁵, NH₄⁺ 5.6 × 10⁻¹⁰, phosphoric acid 7.5 × 10⁻³, 6.2 × 10⁻⁸, 4.2 × 10⁻¹³. The blood buffer uses the apparent pKa of 6.1 at 37 °C (which lumps dissolved CO₂ in with H₂CO₃), 24 mM HCO₃⁻ and 1.2 mM H₂CO₃, in a closed beaker with no lungs, kidneys or blood proteins.</p><p>The Henderson–Hasselbalch readout uses the mole amounts after each addition reacts completely; it matches the exact pH closely inside the buffer range and fails when one part runs out. Concentrations stand in for activities. In the zooms, one particle stands for 0.5 mmol, so a 4-drop dose may not add a visible particle; water molecules formed by the reactions fade out, and spectator ions are left out.</p>',
  initVis(sim){sim.vis.P=null;sim.vis.full=0;},
  draw(sim,ctx,vdt,k,t){const p=sim.p,st=sim.st,v=sim.vis,c=calc(sim),s=c.f.s,hon=atLeast('honors'),ap=atLeast('ap');
    ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
    syncParticles(sim,vdt);if(v.full>0)v.full-=vdt;
    // legend
    const items=[['H3O','H₃O⁺'],['OH','OH⁻'],['HA',s.ha+' (acid form)'],['A',s.a+' (base form)']];
    ctx.font='400 '+(12*k)+'px '+FONT;let tw=0;items.forEach(it=>tw+=ctx.measureText(it[1]).width+34);let lx=400-tw/2;
    items.forEach(it=>{drawP(ctx,{t:it[0],a:-0.8},lx+8,20,s);txt(ctx,it[1],lx+22,21,{s:12*k,c:PAL['cv-soft'],b:'middle'});lx+=ctx.measureText(it[1]).width+34;});
    const halves=[{n:'Beaker A: pure water',pH:c.pw,p0:7,L:v.P?v.P[0]:[]},{n:'Beaker B: '+(k>1.3?s.ha+' / '+s.a+' buffer':s.n+' buffer'),pH:c.pb,p0:c.pb0,L:v.P?v.P[1]:[]}];
    halves.forEach((h,i)=>{const x0=i*400,[cx,cy]=ZC[i];
      txt(ctx,h.n,x0+200,56,{s:13.5*k,w:700,a:'center'});
      const vol=V0+st.acid+st.base;const B=CL.drawBeaker(ctx,{x:x0+20,y:206,w:84,h:84,fill:0.45+0.25*vol/120,liquid:mix(PAL['cv-water'],uni(h.pH),0.75),ticks:false});
      if(k<1.3)txt(ctx,vol.toFixed(1)+' mL',x0+62,306,{s:12*k,c:PAL['cv-soft'],a:'center'});
      ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=1.5;ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(x0+62,B.y+8);ctx.lineTo(cx-ZR*0.9,cy-ZR*0.4);ctx.moveTo(x0+62,B.y+8);ctx.lineTo(cx-ZR*0.6,cy+ZR*0.8);ctx.stroke();ctx.setLineDash([]);
      ctx.save();ctx.beginPath();ctx.arc(cx,cy,ZR,0,6.29);ctx.fillStyle=PAL['cv-water'];ctx.fill();ctx.clip();
      ['W','HA','A','OH','H3O'].forEach(ty=>h.L.forEach(q=>{if(q.t===ty)drawP(ctx,q,cx+q.x,cy+q.y,s);}));ctx.restore();
      ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=3;ctx.beginPath();ctx.arc(cx,cy,ZR,0,6.29);ctx.stroke();
      if(i===0&&!h.L.length)txt(ctx,'only water molecules',cx,cy,{s:12*k,c:PAL['cv-soft'],a:'center',b:'middle'});
      const d=h.pH-h.p0;pill(ctx,'pH '+h.pH.toFixed(2),x0+200,330,i?'#2f6fd0':'#c2185b','#fff',16*k);
      txt(ctx,'change: '+(d>=0?'+':'−')+Math.abs(d).toFixed(2),x0+200,330+26*k,{s:13*k,w:700,a:'center',c:Math.abs(d)>1?PAL['s1']:PAL['cv-soft']});});
    // what is happening, symbolically
    const a=c.af,acid=st.last!=='base',ey=k>1.3?420:398;
    txt(ctx,st.last?(acid?'H₃O⁺ stays in solution':'OH⁻ stays in solution'):'H₂O ⇌ H₃O⁺ + OH⁻ (tiny)',200,ey,{s:13*k,w:700,a:'center'});
    const broke=acid?a.freeH>0:a.freeOH>0;
    txt(ctx,!st.last?s.ha+' ⇌ H⁺ + '+s.a:broke?'Buffer broken: '+(acid?s.a:s.ha)+' used up':acid?s.a+' + H₃O⁺ → '+s.ha+' + H₂O':s.ha+' + OH⁻ → '+s.a+' + H₂O',600,ey,{s:13*k,w:700,a:'center',c:broke?PAL['s1']:PAL['cv-ink']});
    if(k<1.3&&hon){txt(ctx,'left: '+fmm(a.A)+' mmol '+s.a+' · '+fmm(a.HA)+' mmol '+s.ha,600,ey+22,{s:12*k,c:PAL['cv-soft'],a:'center'});
      if(ap&&a.A>1e-9&&a.HA>1e-9)txt(ctx,'pH ≈ '+pKa(s).toFixed(2)+' + log('+fmm(a.A)+'/'+fmm(a.HA)+') = '+(pKa(s)+Math.log10(a.A/a.HA)).toFixed(2),600,ey+40,{s:12*k,c:PAL['cv-soft'],a:'center'});
      txt(ctx,'added: '+st.acid.toFixed(1)+' mmol HCl, '+st.base.toFixed(1)+' mmol NaOH',200,ey+22,{s:12*k,c:PAL['cv-soft'],a:'center'});}
    ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(400,40);ctx.lineTo(400,446);ctx.stroke();
    if(v.full>0)pill(ctx,'Beakers are full: press Fresh beakers',400,250,PAL['s4'],'#fff',14*k);
  },
  thumbSetup(sim){add(sim,'acid');}
};
BUF.onLevel=syncMode;
BioLab.register(BUF);
})();
