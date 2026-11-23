/* Test yourself questions for "Why does warm soda go flat faster?" (gas solubility story). Steps are 1-based story steps. */
TestYourself.mount({lab:'ChemLab',id:'soda',title:'Raider ChemLab · Why does warm soda go flat faster?',el:'#ty',scrollTo:'#story',go:i=>window.Story.go(i),
 questions:[
 {q:'In a sealed can of soda, why doesn’t the fizz change over time?',choices:['CO₂ leaves the soda and goes back in at the same rate','No CO₂ moves at all while the can is closed','The can absorbs the extra CO₂','The sugar holds the CO₂ in place'],answer:0,
  hint:'Watch both counts in step 2. Are they far apart?',step:2,stepName:'inside a sealed can',
  why:'Molecules keep crossing both ways. In a sealed can the squeezed gas above pushes CO₂ back in as fast as it leaves, so the amount dissolved stays the same.'},
 {q:'What happens right after you open the can?',choices:['The squeezed gas escapes, so much more CO₂ leaves the soda than goes back in','CO₂ rushes into the soda from the air','The soda gets colder and holds more CO₂','Nothing changes until you drink it'],answer:0,
  hint:'After the pssst, what is left to push CO₂ back into the soda?',step:3,stepName:'open the can',
  why:'Opening lets the high-pressure gas out. With almost no CO₂ above the soda to push back in, CO₂ keeps leaving: the soda goes flat.'},
 {q:'About how much CO₂ can water hold at 35 °C compared with 4 °C (at the same pressure)?',choices:['About 2.5 times less','About the same','About 2.5 times more','About 100 times less'],answer:0,
  hint:'Read the graph in step 4: about 2.8 g/L at 4 °C. What is it at 35 °C?',step:4,stepName:'fridge or hot car?',
  why:'About 2.8 g/L at 4 °C and 1.1 g/L at 35 °C: warm water holds about 2.5 times less CO₂, so CO₂ escapes warm soda more easily.'},
 {q:'Why do gases like CO₂ escape warm water more easily than cold water?',choices:['Warm molecules jiggle harder, so CO₂ shakes free from the water more easily','Warm water has fewer molecules in it','Heat turns CO₂ into a liquid','Cold water is too thick for gas to move'],answer:0,
  hint:'What does temperature measure about the molecules?',step:4,stepName:'fridge or hot car?',
  why:'Temperature is how hard the molecules jiggle. In warm water a dissolved CO₂ molecule is shaken free more easily, so less gas stays dissolved.'},
 {q:'Two sodas are opened at the same time, one at 4 °C and one at 35 °C. Which goes flat first, and why?',choices:['The 35 °C soda, because warm water holds less CO₂ so it leaves faster','The 4 °C soda, because cold makes CO₂ escape','Both at the same time, because they started the same','The 4 °C soda, because it has more CO₂ to lose'],answer:0,
  hint:'Run the race in step 5. Which line drops faster?',step:5,stepName:'two open cans, side by side',
  why:'Both lose CO₂ once open, but the warm soda can hold much less, so its CO₂ leaves faster and it goes flat first.'}]});
