/* ============================================================
   Average atomic mass story pilot · Raider ChemLab · RJ Ed Tech
   "The number no atom has": neon, 1913. The table says 20.18,
   but neon atoms land at 20 and 22 in a mass spectrometer.
   Isotope data (mass in u, natural share):
     Ne-20 19.992 90.48%   Ne-21 20.994 0.27%   Ne-22 21.991 9.25%  -> 20.180
     Cl-35 34.969 75.76%   Cl-37 36.966 24.24%                      -> 35.453
     B-10  10.013 19.9%    B-11  11.009 80.1%                       -> 10.811
   ============================================================ */
const SITE='ChemLab',PAGE='atomic-mass-story',KEY='rjchemlab-massstory-v1',EVB='avgmass',EVT='Average atomic mass story';
const LW=1000,LH=560;
const cv=$('#stage'),ctx=cv.getContext('2d');let PX=1;
const W=new World();
let S={guess:{},sketch:[],text:'',name:'',seen:{},cl:'',miss:0,sort:{}};
try{Object.assign(S,JSON.parse(localStorage.getItem(KEY)||'{}'))}catch(e){}
try{S.name=localStorage.getItem('raider-labs-name')||S.name||''}catch(e){}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}};
let cur=0,st={},paused=false,lastCap='';
const NOWORLD=()=>true,PAUSEOK=()=>false,settled=()=>true;
const ISO={Ne:[{A:20,m:19.992,f:.9048,p:10},{A:21,m:20.994,f:.0027,p:10},{A:22,m:21.991,f:.0925,p:10}],Cl:[{A:35,m:34.969,f:.7576,p:17},{A:37,m:36.966,f:.2424,p:17}],B:[{A:10,m:10.013,f:.199,p:5},{A:11,m:11.009,f:.801,p:5}]};
const mean=(iso,w)=>{let a=0,b=0;iso.forEach((q,i)=>{a+=q.m*w[i];b+=w[i]});return b?a/b:0};
const AVG={Ne:mean(ISO.Ne,ISO.Ne.map(q=>q.f)),Cl:mean(ISO.Cl,ISO.Cl.map(q=>q.f)),B:mean(ISO.B,ISO.B.map(q=>q.f))};
const NEON='#ff6a3d',PROT='#d92f45',NEUT='#8b95a1';

/* ---------- pictures ---------- */
function nucleus(x,y,p,n,sc){const N=p+n,c=sc||5.2,pts=[];for(let i=0;i<N;i++){const r=c*Math.sqrt(i+.5),a=i*2.39996;pts.push([x+r*Math.cos(a),y+r*Math.sin(a),(i*7)%N<p?1:0])}
  let np=pts.filter(q=>q[2]).length;for(let i=0;i<N&&np!==p;i++){if(np<p&&!pts[i][2]){pts[i][2]=1;np++}else if(np>p&&pts[i][2]){pts[i][2]=0;np--}}
  pts.forEach(q=>ball(ctx,q[0],q[1],c*.82,q[2]?PROT:NEUT))}
function tableSquare(x,y,s,sym,num,mass,hide){rr(ctx,x,y,s,s*1.12,12);ctx.fillStyle=PAL.card;ctx.fill();ctx.strokeStyle=PAL.ink;ctx.lineWidth=3;ctx.stroke();txt(ctx,String(num),x+14,y+30,{s:s*.14,w:700,c:PAL.soft});txt(ctx,sym,x+s/2,y+s*.62,{s:s*.42,w:700,a:'center'});
  txt(ctx,hide?'?':mass,x+s/2,y+s*.95,{s:s*.2,w:700,a:'center',c:PAL.think})}
function sceneHook(t){const A={x:14,y:14,w:480,h:532},B={x:506,y:14,w:480,h:532};card(ctx,A,'On every periodic table');tableSquare(A.x+140,A.y+90,200,'Ne',10,'20.18');txt(ctx,'neon',A.x+240,A.y+356,{s:24,w:700,a:'center'});
  txt(ctx,'The number in pink is the mass of a neon atom,',A.x+240,A.y+400,{s:16,c:PAL.soft,a:'center',max:A.w-30});txt(ctx,'in atomic mass units. Or is it?',A.x+240,A.y+424,{s:16,c:PAL.soft,a:'center'});
  card(ctx,B,'Cambridge, 1913');const gl=RM?1:.75+.25*Math.sin(t*3);ctx.save();ctx.shadowColor=NEON;ctx.shadowBlur=30*gl;ctx.strokeStyle=NEON;ctx.lineWidth=9;ctx.lineCap='round';ctx.lineJoin='round';
  ctx.beginPath();ctx.moveTo(B.x+110,B.y+250);ctx.lineTo(B.x+110,B.y+130);ctx.lineTo(B.x+190,B.y+250);ctx.lineTo(B.x+190,B.y+130);ctx.moveTo(B.x+320,B.y+130);ctx.lineTo(B.x+250,B.y+130);ctx.lineTo(B.x+250,B.y+250);ctx.lineTo(B.x+320,B.y+250);ctx.moveTo(B.x+250,B.y+190);ctx.lineTo(B.x+305,B.y+190);ctx.stroke();ctx.restore();
  txt(ctx,'J. J. Thomson fires glowing neon atoms',B.x+240,B.y+330,{s:17,w:600,a:'center',max:B.w-30});txt(ctx,'past a magnet to weigh them.',B.x+240,B.y+354,{s:17,w:600,a:'center'});
  txt(ctx,'If every neon atom weighs 20.2,',B.x+240,B.y+410,{s:16,c:PAL.soft,a:'center'});txt(ctx,'they should all land in one spot.',B.x+240,B.y+434,{s:16,c:PAL.soft,a:'center'})}

/* ---------- the mass spectrometer ---------- */
const X0=110,BASE=350,KPX=27,landX=m=>X0+KPX*m;
function pickIso(){const r=Math.random();let a=0;for(const q of ISO.Ne){a+=q.f;if(r<a)return q.A}return 20}
function fire(n){st.cnt=st.cnt||{20:0,21:0,22:0};st.fly=st.fly||[];if(n<=20){for(let i=0;i<n;i++)st.fly.push({A:pickIso(),t0:st.t+i*.14})}else{for(let i=0;i<n;i++)st.cnt[pickIso()]++;st.burst=st.t}st.fired=(st.fired||0)+n}
const total=()=>st.cnt?st.cnt[20]+st.cnt[21]+st.cnt[22]:0;
function sceneSpec(o={}){const R={x:14,y:14,w:772,h:532},Q={x:798,y:14,w:188,h:532};card(ctx,R,'A mass spectrometer: weighing atoms with a magnet');st.cnt=st.cnt||{20:0,21:0,22:0};st.fly=st.fly||[];
  ctx.fillStyle=PAL.dark?'rgba(92,140,255,.07)':'rgba(47,98,214,.05)';rr(ctx,R.x+16,R.y+38,R.w-32,BASE-R.y-38,10);ctx.fill();ctx.fillStyle=PAL.dark?'rgba(140,170,255,.3)':'rgba(47,98,214,.22)';
  for(let x=R.x+50;x<R.x+R.w-30;x+=62)for(let y=R.y+66;y<BASE-16;y+=58){ctx.fillRect(x-4,y-.75,8,1.5);ctx.fillRect(x-.75,y-4,1.5,8)}
  txt(ctx,'magnet (its pull turns the moving atoms)',R.x+30,R.y+60,{s:13.5,c:PAL.soft});
  [20,22].forEach(A=>{if(st.cnt[A]||o.paths){const d=KPX*A;ctx.strokeStyle=PAL.line;ctx.setLineDash([4,6]);ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(X0+d/2,BASE,d/2,Math.PI,0);ctx.stroke();ctx.setLineDash([])}});
  ctx.fillStyle=PAL.dark?'#565b66':'#5f6570';rr(ctx,X0-26,BASE,52,54,6);ctx.fill();txt(ctx,'neon',X0,BASE+24,{s:13,w:700,c:'#fff',a:'center'});txt(ctx,'in',X0,BASE+42,{s:13,w:700,c:'#fff',a:'center'});
  ctx.fillStyle=PAL.ink;ctx.fillRect(landX(19)-10,BASE,KPX*4+20,5);txt(ctx,'detector',landX(19)-18,BASE+4,{s:13,c:PAL.soft,a:'right',b:'middle'});txt(ctx,'mass:',landX(19)-18,BASE+24,{s:13,c:PAL.soft,a:'right'});
  [20,21,22].forEach(A=>{const x=landX(A);txt(ctx,String(A),x,BASE+24,{s:16,w:700,a:'center'});const n=st.cnt[A],tot=total();
    if(tot<=140){for(let i=0;i<n;i++){ctx.fillStyle=NEON;ctx.beginPath();ctx.arc(x-7.5+(i%4)*5,BASE+36+Math.floor(i/4)*5,2.2,0,TAU);ctx.fill()}}
    else{const h=150*n/tot;ctx.fillStyle=NEON;rr(ctx,x-10,BASE+32,20,Math.max(n?2:0,h),3);ctx.fill()}});
  st.fly=st.fly.filter(q=>{const u=(st.t-q.t0)/.9;if(u<0)return true;if(u>=1){st.cnt[q.A]++;return false}const d=KPX*q.A,a=Math.PI*u,x=X0+d/2-d/2*Math.cos(a),y=BASE-d/2*Math.sin(a);
    const g=ctx.createRadialGradient(x,y,1,x,y,11);g.addColorStop(0,NEON);g.addColorStop(1,'rgba(255,106,61,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,11,0,TAU);ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(x,y,2.5,0,TAU);ctx.fill();return true});
  if(o.nuclei){const y=BASE-120;[[20,10,10,270],[22,10,12,500]].forEach(([A,p,n,x])=>{nucleus(x,y,p,n,6);txt(ctx,'neon-'+A,x,y+52,{s:17,w:700,a:'center'});txt(ctx,p+' protons + '+n+' neutrons',x,y+74,{s:14,c:PAL.soft,a:'center'})});
    ctx.fillStyle=PROT;ctx.beginPath();ctx.arc(330,BASE-206,6,0,TAU);ctx.fill();txt(ctx,'proton',342,BASE-201,{s:13.5,c:PAL.soft});ctx.fillStyle=NEUT;ctx.beginPath();ctx.arc(420,BASE-206,6,0,TAU);ctx.fill();txt(ctx,'neutron',432,BASE-201,{s:13.5,c:PAL.soft})}
  card(ctx,Q,'Counted');const tot=total();[20,21,22].forEach((A,i)=>{const y=Q.y+70+i*62;txt(ctx,'mass '+A,Q.x+16,y,{s:15,c:PAL.soft});txt(ctx,st.cnt[A].toLocaleString(),Q.x+Q.w-16,y+4,{s:26,w:700,a:'right'});if(tot)txt(ctx,(100*st.cnt[A]/tot).toFixed(tot>=200?1:0)+'%',Q.x+Q.w-16,y+26,{s:14,c:PAL.soft,a:'right'})});
  txt(ctx,'atoms fired',Q.x+16,Q.y+270,{s:15,c:PAL.soft});txt(ctx,tot.toLocaleString(),Q.x+Q.w-16,Q.y+274,{s:26,w:700,a:'right'});
  txt(ctx,'landed at 20.2',Q.x+16,Q.y+330,{s:15,c:PAL.soft});txt(ctx,'0',Q.x+Q.w-16,Q.y+334,{s:26,w:700,a:'right',c:PAL.think})}

/* ---------- the balance point ---------- */
const BX0=110,BWP=780,BY=352;
/* o: {iso, w:[weights], lo, hi, f, locked, label:[...], calc} ; returns {mean, level} */
function sceneBeam(o){const R={x:14,y:14,w:972,h:532};card(ctx,R,o.title||'The whole crowd on a beam');const X=m=>BX0+(m-o.lo)/(o.hi-o.lo)*BWP,mu=mean(o.iso,o.w),tol=(o.hi-o.lo)*.004,level=Math.abs(mu-o.f)<=tol;
  st.ang=lerp(st.ang||0,level?0:clamp((mu-o.f)/(o.hi-o.lo)*1.4,-.2,.2),.14);const px=X(o.f),sum=o.w.reduce((a,b)=>a+b,0)||1,hmax=200;
  ctx.save();ctx.translate(px,BY);ctx.rotate(st.ang);ctx.fillStyle=level?PAL.good:(PAL.dark?'#aab2bd':'#4a4f58');rr(ctx,X(o.lo)-px-10,-7,BWP+20,14,7);ctx.fill();
  for(let m=Math.ceil(o.lo);m<=Math.floor(o.hi);m++){const x=X(m)-px;ctx.fillStyle=PAL.card;ctx.fillRect(x-1,-7,2,14);txt(ctx,String(m),x,30,{s:15,w:600,a:'center',c:PAL.soft})}
  o.iso.forEach((q,i)=>{const x=X(q.m)-px,h=hmax*o.w[i]/sum;if(h>.4){ctx.fillStyle=o.col||NEON;rr(ctx,x-22,-7-Math.max(h,3),44,Math.max(h,3),4);ctx.fill()}
    txt(ctx,(o.sym||'')+'-'+q.A,x,-7-h-30,{s:16,w:700,a:'center'});txt(ctx,(100*o.w[i]/sum).toFixed(o.dec===undefined?1:o.dec)+'%',x,-7-h-10,{s:14.5,c:PAL.soft,a:'center'})});ctx.restore();
  ctx.fillStyle=o.locked?PAL.soft:PAL.think;ctx.beginPath();ctx.moveTo(px,BY+9);ctx.lineTo(px-26,BY+58);ctx.lineTo(px+26,BY+58);ctx.closePath();ctx.fill();
  pill(ctx,o.locked?'the table says '+o.f.toFixed(2):(level?mu:o.f).toFixed(2),px,BY+78,o.locked?PAL.soft:level?PAL.good:PAL.think,'#fff',17,'center');
  if(!o.locked&&!level)txt(ctx,'↔ drag the balance point',px,BY+106,{s:13.5,c:PAL.think,w:700,a:'center'});
  txt(ctx,level?'Balanced.':mu>o.f?'The right side is heavier. It tips right.':'The left side is heavier. It tips left.',R.x+22,R.y+62,{s:18,w:700,c:level?PAL.good:PAL.ink});
  if(o.calc&&(level||o.calc===2)){const parts=o.iso.map((q,i)=>(o.w[i]/sum).toFixed(3)+' × '+q.m.toFixed(2)).join('  +  ');txt(ctx,'share × mass, added up:',R.x+22,R.y+478,{s:14.5,c:PAL.soft});txt(ctx,parts+'  =  '+mu.toFixed(2),R.x+22,R.y+506,{s:19,w:700,max:R.w-44})}
  return{mu,level,X}}

/* ---------- captions ---------- */
const CAP={
 one0:'A magnet turns a moving charged atom. A heavier atom is harder to turn, so it swings wider and lands farther along the detector. Where it lands tells you its mass. <b>Fire atoms one at a time.</b>',
 one1:'Most land at 20. Now and then one lands at 22. None lands at 20.2. <b>Fire a bigger crowd.</b>',
 crowd0:'<b>Fire 100, then 1,000.</b> Watch the piles grow under the detector.',
 crowd1:'About 90 of every 100 land at 20, and about 9 at 22. Same element, different masses: these are <b>isotopes</b>. A neon atom always has 10 protons. The heavier one carries 2 extra neutrons.',
 beam0:'Here is that crowd standing on a beam at their masses. <b>Drag the balance point until the beam is level.</b>',
 beam1:'The beam balances at 20.18, the number on the periodic table. It is the balance point of the whole crowd: the <b>average atomic mass</b>. No single neon atom weighs that.',
 cl0:'Now chlorine. About 76 of every 100 atoms are chlorine-35 and 24 are chlorine-37. <b>First drag the balance point to where you think it sits. Then type the average atomic mass.</b>',
 cl1:'Yes: 35.45. The balance point sits closer to 35 because three of every four atoms are there. Each isotope pulls with its mass times its share.',
 b0:'Run it backward. The table says boron is 10.81, and boron has two isotopes, 10 and 11. <b>Slide the share of boron-11 until the beam is level at 10.81.</b>',
 b1:'About 80% boron-11 and 20% boron-10. The average tells you the mix. Chemists work out how common each isotope is this way.',
 sort0:'Two numbers that are easy to mix up. <b>Send each statement to the number it describes.</b>',
 sort1:'Mass number: one atom, counted, always whole. Average atomic mass: the whole crowd, balanced, almost never whole.'};
const PARTS=['The table','The magnet','A crowd','The balance','Use it','Two numbers','Your turn'];
const esc=s=>String(s||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function picks(key,q,opts,right,after){const g=S.guess[key];if(after&&g!==undefined)return `<p class="note">Your guess: <b>${opts[g].toLowerCase()}</b> <span class="chip ${g===right?'ok':'no'}">${g===right?'✓ matched':'✗ not this time'}</span></p>`;
  return `<div class="pick" data-key="${key}"><p class="q">${q}</p><div class="row">${opts.map((o,i)=>`<button type="button" class="btn opt${g===i?' on':''}" data-i="${i}" aria-pressed="${g===i}">${o}</button>`).join('')}</div></div>`}
function bindPicks(root,fn){$$('.pick .opt',root).forEach(b=>b.addEventListener('click',()=>{const k=b.closest('.pick').dataset.key;S.guess[k]=+b.dataset.i;save();ev('guess-'+k+'-'+b.dataset.i);fn&&fn(k,+b.dataset.i);renderCtl()}))}
const SAW=['One spot, at 20.2','Two spots, at 20 and 22','A smear from 20 to 22'];
const fireBtns=l=>`<div class="row">${l.map(n=>`<button type="button" class="btn${n===l[0]?' primary':''}" data-fire="${n}">Fire ${n.toLocaleString()}</button>`).join('')}<button type="button" class="btn" data-clear="1">Clear</button></div>`;
function bindFire(r){$$('[data-fire]',r).forEach(b=>b.addEventListener('click',()=>fire(+b.dataset.fire)));const c=$('[data-clear]',r);c&&c.addEventListener('click',()=>{st.cnt={20:0,21:0,22:0};st.fly=[]})}
const fSlider=(lo,hi)=>`<div class="row sl"><label>Balance point <input type="range" min="${lo}" max="${hi}" step="0.01" value="${st.f}" data-f="1" aria-label="Balance point, in atomic mass units"><output>${(+st.f).toFixed(2)}</output></label></div>`;
function bindF(r){const i=$('[data-f]',r);i&&i.addEventListener('input',()=>{st.f=+i.value;st.moved=true;i.nextElementSibling.textContent=st.f.toFixed(2)})}
const STATE=[['Always a whole number',0],['The decimal number on the periodic table',1],['Protons plus neutrons in one atom',0],['Depends on how common each isotope is',1]];

const STEPS=[
 {part:0,title:'The number no atom has',
  cap:'The periodic table says a neon atom has a mass of 20.18. In 1913 a physicist set out to weigh neon atoms with a magnet. What he saw did not match the table. <b>Guess what he saw.</b>',
  alt:'If every atom of neon were identical, weighing them would give the same answer every time, and they would all land in one place.',
  aria:'The periodic table square for neon, showing the mass 20.18, beside a glowing neon sign and a note that in 1913 J. J. Thomson fired neon atoms past a magnet to weigh them.',
  draw(){sceneHook(st.t)},ctl(){return picks('saw','Where did the neon atoms land?',SAW)+(S.guess.saw!==undefined?'<p class="note">Locked in. You will fire the atoms yourself next.</p>':'')},bind(r){bindPicks(r,()=>markDone())}},
 {part:1,title:'Weigh one atom',cap:CAP.one0,
  alt:'Roll a bowling ball and a tennis ball past a fan. The light one is pushed off course more. Here the magnet is the fan, and the atoms are sorted by how far they swing.',
  aria:'A mass spectrometer. Neon atoms leave a source, curve through a magnet in a half circle, and land on a detector marked 20, 21 and 22. Heavier atoms land farther along.',
  enter(){st.cnt={20:0,21:0,22:0};st.fly=[]},tick(){if(!st.s1&&total()>=8){st.s1=true;cap(CAP.one1);markDone()}},
  draw(){sceneSpec()},ctl(){return fireBtns([1,10])},bind:bindFire},
 {part:2,title:'Weigh a crowd',cap:CAP.crowd0,
  alt:'Think of two sizes of the same coin: every one is a nickel, but some were minted a little heavier. Sorting them by weight makes two piles, a big one and a small one.',
  aria:'The mass spectrometer after a thousand atoms. A tall pile sits at mass 20 and a short pile at mass 22. Drawings show neon-20 with ten protons and ten neutrons and neon-22 with ten protons and twelve neutrons.',
  enter(from){if(from!==1||!st0.cnt)st.cnt={20:0,21:0,22:0};else st.cnt=st0.cnt;st.fly=[]},
  tick(){if(!st.s1&&total()>=500){st.s1=true;cap(CAP.crowd1+(S.guess.saw===undefined?'':` <span class="chip ${S.guess.saw===1?'ok':'no'}">You guessed: ${SAW[S.guess.saw].toLowerCase()} ${S.guess.saw===1?'✓':'✗'}</span>`));markDone()}},
  draw(){sceneSpec({nuclei:st.s1,paths:true})},ctl(){return fireBtns([100,1000])},bind:bindFire},
 {part:3,title:'Find the balance point',cap:CAP.beam0,
  alt:'A seesaw with nine kids on one seat and one kid on the other does not balance in the middle. You have to slide the pivot toward the crowded seat. The average works the same way.',
  aria:'A beam marked from 19.5 to 22.5 with a tall block at 20 and a short block at 22. A pivot under the beam can be dragged. The beam is level when the pivot is at 20.18.',
  enter(){st.f=21;st.w=ISO.Ne.map(q=>q.f)},
  tick(){const mu=AVG.Ne;if(!st.s1&&st.moved&&Math.abs(st.f-mu)<=.012){st.s1=true;st.f=mu;cap(CAP.beam1);markDone();renderCtl()}},
  draw(){st.B=sceneBeam({iso:ISO.Ne,w:st.w,lo:19.5,hi:22.5,f:st.f,sym:'Ne',calc:1,dec:1})},ctl(){return fSlider(19.5,22.5)},bind:bindF},
 {part:4,title:'Use it: chlorine',cap:CAP.cl0,
  alt:'Halfway between 35 and 37 is 36. But the crowd is not split evenly: most of it stands at 35. So the balance point has to be nearer 35 than 37.',
  aria:'A beam with a tall block at chlorine-35 and a shorter block at chlorine-37. Drag the pivot to predict the balance point, then type the average atomic mass.',
  enter(){st.f=36.5;st.w=ISO.Cl.map(q=>q.f);st.ok=S.cl==='ok';if(st.ok){st.f=AVG.Cl;cap(CAP.cl1);markDone()}},
  draw(){st.B=sceneBeam({iso:ISO.Cl,w:st.w,lo:34.5,hi:37.5,f:st.f,sym:'Cl',col:'#3aa655',calc:st.ok?2:0,dec:0,title:'Chlorine: 76 of every 100 at 35, 24 at 37'})},
  ctl(){return st.ok?'':fSlider(34.5,37.5)+`<div class="row"><label class="nm">Average atomic mass <input id="ans" type="text" inputmode="decimal" size="6" autocomplete="off" aria-label="Average atomic mass of chlorine"></label><button type="button" class="btn primary" id="chk">Check</button>${S.miss>=2?'<button type="button" class="btn" id="show">Show me</button>':''}</div><p class="fb no" id="afb" role="status">${st.fb||''}</p>`},
  bind(r){bindF(r);const chk=$('#chk',r);if(!chk)return;const go1=()=>{const v=parseFloat($('#ans',r).value.replace(',','.'));if(isNaN(v)){st.fb='Type a number, like 35.9.';renderCtl();return}
      if(Math.abs(v-AVG.Cl)<=.06){S.cl='ok';save();ev('answer-right');st.ok=true;st.f=AVG.Cl;st.fb='';cap(CAP.cl1);markDone();renderCtl();return}
      S.miss++;save();ev('answer-wrong');st.fb=Math.abs(v-36)<.06?'That is halfway between 35 and 37. But three of every four atoms are at 35, so the balance point sits closer to 35.':(Math.abs(v-35)<.1||Math.abs(v-37)<.1)?'That is the mass of one isotope. The average has to sit between the two, pulled toward the bigger crowd.':v<35||v>37?'An average of 35s and 37s has to land between 35 and 37.':'Close. Multiply each mass by its share and add: 0.76 × 34.97 + 0.24 × 36.97.';renderCtl()};
    chk.addEventListener('click',go1);$('#ans',r).addEventListener('keydown',e=>{if(e.key==='Enter')go1()});const sh=$('#show',r);sh&&sh.addEventListener('click',()=>{st.fb='0.7576 × 34.97 + 0.2424 × 36.97 = 35.45. Type 35.45.';renderCtl()})}},
 {part:4,title:'Run it backward: boron',cap:CAP.b0,
  alt:'The pivot is stuck at 10.81, close to 11. So most of the crowd must be standing at 11. Keep moving atoms from 10 to 11 until the beam stops tipping left.',
  aria:'A beam with its pivot fixed at 10.81 and blocks at boron-10 and boron-11. A slider changes how much of the boron is boron-11. The beam is level at about 80 percent.',
  enter(){st.share=.5},tick(){const mu=mean(ISO.B,[1-st.share,st.share]);if(!st.s1&&st.moved&&Math.abs(mu-AVG.B)<=.008){st.s1=true;cap(CAP.b1);markDone()}},
  draw(){st.B=sceneBeam({iso:ISO.B,w:[1-st.share,st.share],lo:9.5,hi:11.5,f:AVG.B,locked:true,sym:'B',col:'#8e5bd6',dec:0,calc:1,title:'Boron: what mix balances at 10.81?'})},
  ctl(){return `<div class="row sl"><label>Share that is boron-11 <input type="range" min="0" max="100" step="1" value="${Math.round(st.share*100)}" data-share="1" aria-label="Percent of boron that is boron-11"><output>${Math.round(st.share*100)}%</output></label></div>`},
  bind(r){const i=$('[data-share]',r);i.addEventListener('input',()=>{st.share=+i.value/100;st.moved=true;i.nextElementSibling.textContent=i.value+'%'})}},
 {part:5,title:'Mass number or average atomic mass?',cap:CAP.sort0,
  alt:'Mass number belongs to one atom: you get it by counting the particles in its nucleus. Average atomic mass belongs to the element as a whole: you get it by balancing the crowd.',
  aria:'Neon-20 and neon-22 nuclei beside the neon square from the periodic table. One atom has a mass number, a whole number. The element has an average atomic mass, a decimal.',
  draw(){const A={x:14,y:14,w:480,h:532},B={x:506,y:14,w:480,h:532};card(ctx,A,'One atom: mass number');nucleus(A.x+150,A.y+200,10,10,6.4);nucleus(A.x+340,A.y+200,10,12,6.4);txt(ctx,'20',A.x+150,A.y+310,{s:44,w:700,a:'center'});txt(ctx,'22',A.x+340,A.y+310,{s:44,w:700,a:'center'});
    txt(ctx,'count the protons and neutrons',A.x+240,A.y+360,{s:16,c:PAL.soft,a:'center'});txt(ctx,'in that one nucleus',A.x+240,A.y+382,{s:16,c:PAL.soft,a:'center'});
    card(ctx,B,'The whole element: average atomic mass');tableSquare(B.x+150,B.y+80,180,'Ne',10,'20.18');txt(ctx,'the balance point of all the',B.x+240,B.y+360,{s:16,c:PAL.soft,a:'center'});txt(ctx,'neon atoms there are',B.x+240,B.y+382,{s:16,c:PAL.soft,a:'center'})},
  ctl(){const done=STATE.every((q,i)=>S.sort[i]===q[1]);return STATE.map((q,i)=>{const v=S.sort[i],ok=v===q[1];return `<div class="sortrow"><p>${q[0]}${v!==undefined?(ok?' <span class="chip ok">✓</span>':' <span class="chip no">try the other one</span>'):''}</p><div class="row"><button type="button" class="btn sm${v===0?' on':''}" data-s="${i}" data-v="0">mass number</button><button type="button" class="btn sm${v===1?' on':''}" data-s="${i}" data-v="1">average atomic mass</button></div></div>`}).join('')+(done?'':'')},
  bind(r){$$('[data-s]',r).forEach(b=>b.addEventListener('click',()=>{S.sort[+b.dataset.s]=+b.dataset.v;save();if(STATE.every((q,i)=>S.sort[i]===q[1])){cap(CAP.sort1);markDone();ev('sort-done')}renderCtl()}))}},
 {part:6,wide:true,title:'Now tell it back',
  cap:'Thomson’s assistant Francis Aston built a better machine, found isotopes in element after element, and won the Nobel Prize in 1922. <b>Now you explain the number on the table.</b>',
  alt:'Start with what Thomson expected and what he saw. Then say what the decimal on the periodic table really is.',
  aria:'The periodic table square for neon beside the glowing neon sign.',
  draw(){sceneHook(st.t)},
  ctl(){return `<div class="tell"><h3>1. Say it in your own words</h3><p class="q">The table says neon is 20.18, but no neon atom has that mass. Explain why. Use the words <b>isotope</b>, <b>share</b> and <b>average</b>.</p>
  <textarea id="tx" rows="4" placeholder="Type your explanation here.">${esc(S.text)}</textarea>
  <h3>2. Turn it in</h3><p class="q">If your teacher assigned this, copy your work and paste it into the Canvas text box.</p>
  <div class="row"><label class="nm">Name <input id="nm" type="text" value="${esc(S.name)}" autocomplete="name"></label><button type="button" class="btn primary" id="copy">Copy for Canvas</button><span id="cmsg" role="status"></span></div>
  <div class="world"><h3>Where this machine works today</h3><p>Mass spectrometers now check athletes for banned drugs, test newborn babies for rare diseases from a few drops of blood, and ride on Mars rovers looking for the chemistry of life. They all sort atoms and molecules by mass, the way you just did.</p>
  <p><a href="https://rjedtech.github.io/Raider-ChemLab/index.html#avgmass">Practice more in the average atomic mass tool.</a> More stories: <a href="https://rjedtech.github.io/Raider-ChemLab/naming-story.html">One letter apart</a>, <a href="https://rjedtech.github.io/Raider-ChemLab/pressure-story.html">The bag that swells</a>, <a href="https://rjedtech.github.io/Raider-ChemLab/equilibrium-story.html">The hatch that stayed shut</a>.</p></div></div>`},
  bind(r){const tx=$('#tx',r),nm=$('#nm',r);tx.addEventListener('input',()=>{S.text=tx.value;save()});nm.addEventListener('input',()=>{S.name=nm.value;try{localStorage.setItem('raider-labs-name',nm.value)}catch(e){}save()});
    $('#copy',r).addEventListener('click',()=>{const g=S.guess,L=['Raider ChemLab · Average atomic mass story: The number no atom has','Name: '+(S.name||'(not given)'),'',
      'Guess, where the neon atoms land: '+(g.saw===undefined?'no guess':SAW[g.saw].toLowerCase()+(g.saw===1?' (matched)':' (they landed in two spots, at 20 and 22)')),
      'Average atomic mass of chlorine: '+(S.cl==='ok'?'35.45, correct after '+S.miss+' miss'+(S.miss===1?'':'es'):'not answered yet'),
      'Mass number vs average atomic mass: '+STATE.filter((q,i)=>S.sort[i]===q[1]).length+' of 4 sorted correctly','','In my own words:',S.text||'(nothing written)'].join('\n');
    const ok=()=>{$('#cmsg').textContent='Copied. Paste it into Canvas.'},fb=()=>{const t=document.createElement('textarea');t.value=L;document.body.appendChild(t);t.select();try{document.execCommand('copy');ok()}catch(e){$('#cmsg').textContent='Could not copy. Select your text and copy it by hand.'}t.remove()};
    if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(L).then(ok,fb);else fb();ev('copy')})}},
];
// drag the balance point on the picture
let fDrag=false;
cv.addEventListener('pointerdown',e=>{if((cur!==3&&cur!==4)||!st.B||st.ok)return;const p=pt(e);if(p.y>BY-20&&p.y<BY+120&&Math.abs(p.x-st.B.X(st.f))<46){fDrag=true;cv.setPointerCapture(e.pointerId);e.preventDefault()}});
cv.addEventListener('pointermove',e=>{if(!fDrag)return;const lo=cur===3?19.5:34.5,hi=lo+3;st.f=clamp(lo+(pt(e).x-BX0)/BWP*3,lo,hi);st.moved=true;const i=$('#ctl [data-f]');if(i){i.value=st.f;i.nextElementSibling.textContent=st.f.toFixed(2)}});
['pointerup','pointercancel'].forEach(n=>cv.addEventListener(n,()=>{fDrag=false}));
