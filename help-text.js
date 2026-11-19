/* Written help for "This confused me" (Nov 19, 2026). student-help.js shows it first, before asking why.
   RL_HELP[tool hash][Learn it step key] = {ask, another, start}. Any field may be {bio|chem, honors, ap}. */
(function(){
const H=window.RL_HELP=window.RL_HELP||{};
H.naming={
 cast:{ask:'Nothing to answer yet. This walkthrough shows how to name a compound by answering a few questions in order.',start:'Press Next and follow the path on the flowchart.'},
 metal:{ask:'Is the first part a metal?',another:'Like sorting mail: the first question sends it down the right path. A metal first (or NH₄⁺) means ionic. Two nonmetals means molecular.',start:'Find Na on the periodic table. Is it on the metal side?'},
 onecharge:{ask:'Why is it just “sodium chloride,” with no number?',another:'Sodium only ever makes one kind of ion (Na⁺), so there is nothing to tell apart. The nonmetal’s name ends in -ide.',start:'Name the metal, then change the nonmetal’s ending to -ide.'},
 roman:{ask:'What does the Roman numeral mean?',another:'Iron can be 2+ or 3+, like a player who can play two positions. The numeral says which one it is here. Three O²⁻ make 6−, so the two irons must make 6+: each is 3+.',start:'Add up the negative charges, then split them over the metal atoms.'},
 poly:{ask:'Why does NO₃ keep its own name?',another:'A polyatomic ion is a group of atoms that travels together, like a band that keeps its name on tour. NO₃⁻ is always “nitrate.”',start:'Spot the group in parentheses and look up its name.'},
 formula:{ask:'How do you write the formula from the name?',another:'The charges must cancel, like balancing a scale: +3 +3 = 6 and −2 −2 −2 = −6. Two Al and three O.',start:'Write each ion’s charge, then find the smallest numbers that make them add to zero.'},
 molecular:{ask:'Why do two nonmetals get prefixes?',another:'Nonmetals share electrons, so there are no charges to set the ratio. NO, NO₂ and N₂O₄ all exist, so the prefixes count the atoms to tell them apart.',start:'Count each atom and use the prefix: di = 2, tetra = 4.'},
 acid:{ask:'How is an acid named?',another:'Start from the negative ion’s name and change the ending: -ate becomes -ic, -ite becomes -ous, -ide becomes hydro-…-ic. Sulfate → sulfuric acid.',start:'Find the negative ion (sulfate), then change its ending.'},
 hydrate:{ask:'What does the dot and 5H₂O mean?',another:'Water is locked inside the crystal, like water inside a sponge. “Penta” counts 5 waters for each CuSO₄.',start:'Name the salt first, then add the prefix + “hydrate.”'}};
})();
