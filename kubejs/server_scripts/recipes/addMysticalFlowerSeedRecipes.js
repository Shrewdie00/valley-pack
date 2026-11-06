console.info("[SOCIETY] addMysticalFlowerSeedRecipes.js loaded");

ServerEvents.recipes((e) => {
  const seedMap = new Map([
    ["green", "vintagedelight:cucumber"],
    ["cyan", "supplementaries:flax"],
    ["light_blue", "society:ancient_fruit"],
    ["blue", "society:blueberry"],
    ["purple", "society:eggplant"],
    ["magenta", "vintagedelight:gearo_berry"],
    ["pink", "farm_and_charm:strawberry"],
    ["white", "veggiesdelight:cauliflower"],
    ["light_gray", "veggiesdelight:garlic"],
    ["gray", "atmospheric:currant"],
    ["black", "vintagedelight:ghost_charcoal"],
    ["brown", "snowyspirit:ginger"],
    ["red", "minecraft:beetroot"],
    ["orange", 'veggiesdelight:bellpepper'],
    ["yellow", "farm_and_charm:corn"],
    ["lime", "farmersdelight:cabbage"],
  ]);
  const addSeedRecipe = (crop, color) => {
    const seed = `botania_seeds:${color}_mystical_flower_seed`;
    e.remove({ output: seed });
    e.custom({
      type: "botania:petal_apothecary",
      ingredients: [
        {
          item: crop,
        },
        {
          item: crop,
        },
        {
          item: crop,
        },
        {
          item: crop,
        },
      ],
      output: {
        item: seed,
        count: 4
      },
      reagent: {
        tag: "botania:seed_apothecary_reagent",
      },
    });
  };
  seedMap.forEach((value, key) => {
    addSeedRecipe(value, key);
  });
});
