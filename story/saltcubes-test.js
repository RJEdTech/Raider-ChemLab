/* Test yourself questions for "Why are salt grains little cubes?" (ionic crystal story). Steps are 1-based story steps. */
TestYourself.mount({lab:'ChemLab',id:'saltcubes',title:'Raider ChemLab · Why are salt grains little cubes?',el:'#ty',scrollTo:'#story',go:i=>window.Story.go(i),
 questions:[
 {q:'What holds the sodium and chloride ions in salt together?',choices:['Opposite charges attract: Na⁺ is positive and Cl⁻ is negative','They share electrons evenly, like in wax','Water glues them together','They are magnetic metals'],answer:0,
  hint:'Look at the signs on the two kinds of ion.',step:2,stepName:'inside one grain',
  why:'Sodium has given an electron to chlorine, so sodium is Na⁺ and chloride is Cl⁻. Opposite charges attract, and that attraction (an ionic bond) holds the crystal together.'},
 {q:'How many chloride ions touch each sodium ion in a salt crystal?',answer:6,tol:0,unit:'ions',
  hint:'Count the neighbors of the center ion in step 3: up, down, and around.',step:3,stepName:'every ion has six neighbors',
  why:'Six: one in each direction, front, back, left, right, up and down, all at right angles and all 0.282 nm away.'},
 {q:'Why do two sodium ions never touch each other in the crystal?',choices:['Ions with the same charge push each other away','Sodium ions are too small to touch','The grid has no room for them','Chloride ions hold them apart with glue'],answer:0,
  hint:'Both sodium ions are positive. What do like charges do?',step:3,stepName:'every ion has six neighbors',
  why:'Like charges repel. The checkerboard grid keeps every ion next to opposite charges and away from its own kind.'},
 {q:'As a salt crystal grows in salty water, why does it stay a cube instead of becoming a ball?',choices:['New ions can only sit on the same right-angle grid, so the faces stay flat and square','The water presses it into a cube','Ions only land on the corners','It is a ball, but looks like a cube'],answer:0,
  hint:'Watch where the new layer goes each time you add one in step 4.',step:4,stepName:'grow a crystal',
  why:'Each new ion fits only where the grid puts it, so whole layers build up on the flat faces. Every layer follows the same right angles, so the crystal stays a cube at every size.'},
 {q:'Ions in salt are 0.282 nm apart. About how many ions line up along one edge of a 0.3 mm grain? (1 mm = 1,000,000 nm)',choices:['About a million','About a thousand','About 300','About a billion'],answer:0,
  hint:'0.3 mm is 300,000 nm. How many 0.282 nm steps fit in that?',step:5,stepName:'how many ions in one grain?',
  why:'300,000 nm ÷ 0.282 nm ≈ 1,060,000: about a million ions along each edge, and about 10¹⁸ in the whole grain.'}]});
