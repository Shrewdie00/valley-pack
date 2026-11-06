// Valley: wandering trader rules (spec 3.3). Pure math; the trader itself is server_scripts/valley_trader.js.

global.valleyTraderDefaults = { minGap: 2, maxGap: 4, minItems: 3, maxItems: 5, minMult: 1.5, maxMult: 2.0 };

const valleyRandInt = (rand, min, max) => min + Math.floor(rand() * (max - min + 1));

global.valleyTraderNextVisit = (day, rand, s) => day + valleyRandInt(rand, s.minGap, s.maxGap);

// Distinct items (all of the pool if it is smaller), each with a multiplier rounded to 2 decimals.
global.valleyTraderPick = (pool, rand, s) => {
  let left = pool.slice();
  let count = Math.min(left.length, valleyRandInt(rand, s.minItems, s.maxItems));
  let picks = [];
  for (let i = 0; i < count; i++) {
    let item = left.splice(Math.floor(rand() * left.length), 1)[0];
    picks.push({ item: item, mult: Math.round((s.minMult + rand() * (s.maxMult - s.minMult)) * 100) / 100 });
  }
  return picks;
};

// Base shipping value x multiplier, rounded per unit. Quality, season and market do not apply (spec: 1.5-2x base).
global.valleyTraderPayout = (baseValue, mult, count) => Math.round(baseValue * mult) * count;
