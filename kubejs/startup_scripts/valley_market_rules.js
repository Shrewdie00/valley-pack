// Valley: shipping bin market prices (spec 3.2). Pure math; storage and daily updates live in server_scripts/valley_market.js.
// level = an item's base multiplier (sales push it down, it recovers toward 1 each day).
// Today's multiplier = level x a daily wobble, never below the floor.

global.valleyMarketDefaults = { floor: 0.7, recovery: 0.2, wobble: 0.1, dropPerUnit: 0.002 };

const valleyRound6 = (x) => Math.round(x * 1e6) / 1e6;

// Within 0.001 of 1 counts as recovered, so the item's stored level can be dropped (recovery alone never reaches 1).
global.valleyMarketNextLevel = (level, sold, s) => {
  let next = Math.min(1, Math.max(s.floor, level + (1 - level) * s.recovery - sold * s.dropPerUnit));
  return next > 0.999 ? 1 : valleyRound6(next);
};

// Same (day, item) always gives the same wobble, so every sale that day gets the same price.
global.valleyMarketWobble = (day, itemId, wobble) => {
  let key = `${day}|${itemId}`;
  let h = 0x811c9dc5; // 32-bit FNV-1a; prime 0x01000193 = 2^24 + 403, written without Math.imul for Rhino
  for (let i = 0; i < key.length; i++) {
    h = (h ^ key.charCodeAt(i)) >>> 0;
    h = ((h << 24) + h * 403) >>> 0;
  }
  return valleyRound6(1 - wobble + 2 * wobble * (h / 4294967296));
};

global.valleyMarketMultiplier = (level, day, itemId, s) =>
  valleyRound6(Math.max(s.floor, level * global.valleyMarketWobble(day, itemId, s.wobble)));
