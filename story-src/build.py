import re
repo='..'   # run from story-src/: python3 build.py
mark=re.search(r'class="rj-mark" src="([^"]+)"',open(repo+'/index.html').read()).group(1)
eq=open('scenes.js').read(); shell=eq[eq.index('/* ---------- page controls ---------- */'):]
PAGES={'equilibrium-story':dict(TITLE='Equilibrium: the hatch that stayed shut · Raider ChemLab',H1='The hatch that stayed shut',TOPIC='Equilibrium',TOOL='equilibrium',
  DESC='Equilibrium as one story: why a propellant with no color shows up as a brown, toxic gas. A story version of the Raider ChemLab equilibrium tool. RJ Ed Tech.',more='eq.more.html',js=eq),
 'pressure-story':dict(TITLE='Gas pressure: the bag that swells · Raider ChemLab',H1='The bag that swells',TOPIC='Gas pressure',TOOL='kmt',
  DESC='Gas pressure as one story: why a sealed bag of chips puffs up on the drive from Denver to the Eisenhower Tunnel. A story version of the Raider ChemLab gas tools. RJ Ed Tech.',more='bag.more.html',js=open('bag.js').read()+'\n'+shell),
 'naming-story':dict(TITLE='Naming compounds: one letter apart · Raider ChemLab',H1='One letter apart',TOPIC='Naming compounds',TOOL='naming',
  DESC='Naming compounds as one story: why dinitrogen monoxide counts its atoms and magnesium chloride does not. A story version of the Raider ChemLab naming trainer. RJ Ed Tech.',more='naming.more.html',js=open('naming.js').read()+'\n'+shell)}
PAGES['atomic-mass-story']=dict(TITLE='Average atomic mass: the number no atom has · Raider ChemLab',H1='The number no atom has',TOPIC='Average atomic mass',TOOL='avgmass',
  DESC='Average atomic mass as one story: the table says neon is 20.18, but neon atoms land at 20 and 22. A story version of the Raider ChemLab average atomic mass tool. RJ Ed Tech.',more='mass.more.html',js=open('mass.js').read()+'\n'+shell)
for name,p in PAGES.items():
    out=open('template.html').read().replace('/*STYLE*/',open('style.css').read()).replace('/*RJMARK*/',mark).replace('/*CORE*/',open('core.js').read()).replace('/*SCENES*/',p['js']).replace('/*MORE*/',open(p['more']).read())
    for k in ('TITLE','H1','TOPIC','TOOL','DESC'): out=out.replace('/*'+k+'*/',p[k])
    open(repo+'/'+name+'.html','w').write(out); print(name,len(out.encode()),'bytes')
