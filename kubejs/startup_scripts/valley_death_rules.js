// Valley: death and Skull Cavern fees, adjustable by the admin (spec 7). Defaults are the pack's own numbers.

global.valleyDeathDefaults = {
  enabled: 1, // 0 = no fees at all (events)
  deathRate: 10, // % of the balance
  deathMax: 4096,
  guideMax: 2048, // with the first aid guide
  deathMin: 512,
  skullRate: 15,
  skullMax: 8192,
  skullMin: 1024,
};

// The fee for one death. reason "death" or "skull_cavern"; cfg like valleyDeathDefaults.
// Same rules as the pack: a percentage between the minimum and the cap, and anyone who has entered the
// Skull Cavern pays the full cap while their balance is below it.
global.valleyDeathFee = (balance, reason, hasGuide, enteredSkull, cfg) => {
  if (!cfg.enabled) return 0;
  let skull = reason === "skull_cavern";
  let max = skull ? cfg.skullMax : hasGuide ? cfg.guideMax : cfg.deathMax;
  let min = skull ? cfg.skullMin : cfg.deathMin;
  let fee = Math.min(Math.round((balance * (skull ? cfg.skullRate : cfg.deathRate)) / 100), max);
  if (fee < min) fee = min;
  if (balance < max && enteredSkull) fee = max;
  return fee;
};
