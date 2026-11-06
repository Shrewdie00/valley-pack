// Valley: growth items need a skill tree tier (spec 12, decision: any perk of that tier or deeper).
// Unlocking a perk adds a stage with the perk's name (see puffish_skills definitions), so a tier is reached when
// the player has any perk stage of that tier or a deeper one. Loaded on both sides (tooltips use it too).

// Perks of each tree by tier: 1 = 4th node, 2 = 6th-7th nodes, 3 = last nodes.
global.valleyPerkTiers = {
  farming: [
    ["tiller", "artisan"],
    ["soil_inspector", "sticky_crops", "aged_prize", "rancher", "tree_whisperer", "reaping_scythe"],
    ["crop_collector", "farmers_blessing", "artful_tycoon", "ancient_aging"],
  ],
  husbandry: [
    ["animal_whisperer", "bribery"],
    ["mana_hand", "biomancer", "shepherd", "coopmaster", "sacrificial_lamb", "transplanting"],
    ["bff", "triple_truffle", "clockwork", "heretic"],
  ],
  fishing: [
    ["fly_fisher", "caper_catcher"],
    ["mystical_ocean", "frozen_treasure", "wooden_pollution", "hot_hands", "caviar_catcher"],
    ["prismatic_bounty", "school_fisher", "scum_collector", "mitosis"],
  ],
  mining: [
    ["gem_seller", "excavator"],
    ["furniture_archaeologist", "blockchain", "mineralogist", "filthy_excavator", "gold_rush"],
    ["prismatic_prospector", "high_roller", "gem_tycoon", "star_blessing"],
  ],
};

global.valleyTreeNames = { farming: "농사", husbandry: "축산", fishing: "낚시", mining: "채광" };

// item -> [tree, tier]. Giving, dropping and picking up are free; placing, using and mining with it are not.
global.valleyRestricted = {
  "dew_drop_farmland_growth:gold_sprinkler": ["farming", 1],
  "dew_drop_watering_cans:gold_watering_can": ["farming", 1],
  "minecraft:golden_hoe": ["farming", 1],
  "society:crystalarium": ["farming", 1],
  "dew_drop_farmland_growth:diamond_sprinkler": ["farming", 2],
  "dew_drop_watering_cans:diamond_watering_can": ["farming", 2],
  "minecraft:diamond_hoe": ["farming", 2],
  "botania:manasteel_hoe": ["farming", 2],
  "society:artisan_hopper": ["farming", 2],
  "society:mini_artisan_hopper": ["farming", 2],
  "society:auto_tapper": ["farming", 2],
  "society:auto_grabber": ["farming", 2],
  "dew_drop_farmland_growth:netherite_sprinkler": ["farming", 3],
  "dew_drop_watering_cans:netherite_watering_can": ["farming", 3],
  "minecraft:netherite_hoe": ["farming", 3],
  "aquaculture:neptunium_hoe": ["farming", 3],
  "botania:elementium_hoe": ["farming", 3],
  "society:mana_sprinkler": ["farming", 3],
  "society:plot_deed_5": ["farming", 1],
  "society:plot_deed_7": ["farming", 2],
  "society:auto_petter": ["husbandry", 1],
  "society:feeding_trough": ["husbandry", 1],
  "society:mana_milker": ["husbandry", 2],
  "aquaculture:iron_fishing_rod": ["fishing", 1],
  "aquaculture:gold_fishing_rod": ["fishing", 1],
  "aquaculture:diamond_fishing_rod": ["fishing", 2],
  "netherdepthsupgrade:lava_fishing_rod": ["fishing", 2],
  "aquaculture:neptunium_fishing_rod": ["fishing", 3],
  "minecraft:golden_pickaxe": ["mining", 1],
  "minecraft:diamond_pickaxe": ["mining", 2],
  "botania:elementium_pickaxe": ["mining", 2],
  "minecraft:netherite_pickaxe": ["mining", 3],
  "aquaculture:neptunium_pickaxe": ["mining", 3],
};

// Whether a tree's tier is reached: any perk of that tier or deeper. hasStage(name) -> boolean.
global.valleyTierReached = (tree, tier, hasStage) => {
  let tiers = global.valleyPerkTiers[tree];
  for (let t = tier - 1; t < tiers.length; t++) {
    if (tiers[t].some((perk) => hasStage(perk))) return true;
  }
  return false;
};

// null when the item may be used, otherwise [tree, tier] it needs. hasStage(name) -> boolean.
global.valleyRestrictionFor = (itemId, hasStage) => {
  let rule = global.valleyRestricted[String(itemId)];
  if (!rule) return null;
  return global.valleyTierReached(rule[0], rule[1], hasStage) ? null : rule;
};

global.valleyRestrictionText = (rule) => `${global.valleyTreeNames[rule[0]]} ${rule[1]}단 특성이 필요해요`;
