/* Shared pieces for the ChemLab story pages in 3D (Nov 24, 2026). Real geometry throughout:
   water O–H 0.0958 nm at 104.5°; carbon dioxide straight, C=O 0.116 nm; a hydrogen bond O–H···O about 0.18 nm from H to O
   (oxygens about 0.28 nm apart). Positions are in nanometers. Needs view3d.js and the story kit. */
(function(){
'use strict';
const G=View3D.G,{rr,txt}=Story.h;
const HALF=104.5/2*Math.PI/180,OH=.0958;
function rng(a){return ()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
/* a water with its oxygen at o, one O–H pointing along d (toward a neighbor), the other in the plane set by d and up */
function water(o,d,up){d=G.norm(d);let n=G.cross(d,up||[0,1,0]);if(G.len(n)<1e-3)n=G.cross(d,[1,0,0]);n=G.norm(n);const t=G.norm(G.cross(n,d));
  const a=2*HALF,h2=G.add(G.mul(d,Math.cos(a)),G.mul(t,Math.sin(a)));return {o,h:[G.add(o,G.mul(d,OH)),G.add(o,G.mul(h2,OH))]};}
/* items for a water: ball-and-stick, or space filling (o.fill) */
function waterItems(w,o){o=o||{};const f=o.fill,s=o.s||1,op=o.op;
  const it=[{t:'atom',p:w.o,r:(f?.152:.07)*s,c:G.C.O,op},{t:'atom',p:w.h[0],r:(f?.11:.042)*s,c:'#f2f2f2',op},{t:'atom',p:w.h[1],r:(f?.11:.042)*s,c:'#f2f2f2',op}];
  if(!f)it.push({t:'bond',a:w.o,b:w.h[0],r:.02*s,c:'#c9ced5',op},{t:'bond',a:w.o,b:w.h[1],r:.02*s,c:'#c9ced5',op});
  if(o.charges){it.push({t:'atom',p:w.o,r:.115*s,c:'#e0453a',op:.3},{t:'atom',p:w.h[0],r:.075*s,c:'#3b6fd8',op:.32},{t:'atom',p:w.h[1],r:.075*s,c:'#3b6fd8',op:.32});}
  return it;}
function co2Items(c,ax,o){o=o||{};ax=G.norm(ax);const a=G.add(c,G.mul(ax,.116)),b=G.add(c,G.mul(ax,-.116)),op=o.op,s=o.s||1;
  return [{t:'bond',a,b,r:.024*s,c:'#c9ced5',op},{t:'atom',p:c,r:.07*s,c:G.C.C,op},{t:'atom',p:a,r:.068*s,c:G.C.O,op},{t:'atom',p:b,r:.068*s,c:G.C.O,op}];}
/* the white side panel used on every 3D step */
function panel(ctx,title,rows,extra){const x=900;ctx.fillStyle='#fff';ctx.strokeStyle='#d5d9de';ctx.lineWidth=1;rr(ctx,x,24,280,552,12);ctx.fill();ctx.stroke();
  txt(ctx,title,x+18,58,{s:17,w:700,c:'#26262b'});(rows||[]).forEach(([c,t,op],k)=>{const y=94+k*28;ctx.beginPath();ctx.arc(x+28,y-5,8,0,7);ctx.globalAlpha=op||1;ctx.fillStyle=c;ctx.fill();ctx.globalAlpha=1;txt(ctx,t,x+44,y,{s:14.5,c:'#26262b'});});
  if(extra)extra(x,94+(rows||[]).length*28+20);}
function stat(ctx,x,y,label,val,col){txt(ctx,label,x+18,y,{s:15,c:'#62626a'});txt(ctx,String(val),x+262,y+2,{s:24,w:700,a:'right',c:col||'#26262b'});}
window.Chem3D={rng,water,waterItems,co2Items,panel,stat};
})();
