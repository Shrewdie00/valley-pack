console.info("[SOCIETY] addChunkroditeRecipes.js loaded");

ServerEvents.recipes((e) => {
  const addDrainRecipe = (item, amount) => {
    e.custom({
      type: "create:emptying",
      ingredients: [
        {
          item: item,
        },
      ],
      results: [
        {
          amount: amount,
          fluid: "society:milk",
        },
      ],
    });
  };
  [
    "society:large_milk",
    "society:large_goat_milk",
    "society:large_buffalo_milk",
    "society:large_sheep_milk",
    "society:large_warped_milk",
    "society:large_grain_milk",
    "society:large_amethyst_milk"
  ].forEach((milk) => {
    addDrainRecipe(milk, 1000);
  });
  [
    "society:goat_milk",
    "society:milk",
    "society:buffalo_milk",
    "society:warped_milk",
    "society:sheep_milk",
    "society:grain_milk",
    "society:amethyst_milk"

  ].forEach((milk) => {
    addDrainRecipe(milk, 250);
  });
});
