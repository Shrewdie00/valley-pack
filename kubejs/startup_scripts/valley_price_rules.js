// Valley: out-of-season crops sell for 70% (spec 2). Phase B price swings multiply this result.

global.valleyOffSeasonPriceMultiplier = 0.7;

global.valleySeasonPrice = (value, inSeason) =>
  inSeason ? value : Math.max(1, Math.round(value * global.valleyOffSeasonPriceMultiplier));

// Items without any sereneseasons:<season>_crops tag are not seasonal, so they count as in season.
global.valleyIsInSeason = (level, itemId) => {
  const item = Item.of(itemId);
  const seasons = ["spring", "summer", "autumn", "winter"].filter((s) => item.hasTag(`sereneseasons:${s}_crops`));
  return seasons.length === 0 || seasons.includes(global.getSeasonFromLevel(level));
};
