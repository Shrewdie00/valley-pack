console.info("[SOCIETY] addPlankRecipes.js loaded");

ServerEvents.recipes((e) => {
  [
    { plank: "autumnity:maple_planks", slab: "autumnity:maple_slab" },
    { plank: "atmospheric:kousa_planks", slab: "atmospheric:kousa_slab" },
    { plank: "meadow:pine_planks", slab: "meadow:pine_slab" },
    { plank: "atmospheric:aspen_planks", slab: "atmospheric:aspen_slab" },
    { plank: "atmospheric:yucca_planks", slab: "atmospheric:yucca_slab" },
    { plank: "atmospheric:rosewood_planks", slab: "atmospheric:rosewood_slab" },
    { plank: "atmospheric:morado_planks", slab: "atmospheric:morado_slab" },
    { plank: "beachparty:palm_planks", slab: "beachparty:palm_slab" },
    { plank: "atmospheric:grimwood_planks", slab: "atmospheric:grimwood_slab" },
    { plank: "atmospheric:laurel_planks", slab: "atmospheric:laurel_slab" },
    { plank: "vinery:dark_cherry_planks", slab: "vinery:dark_cherry_slab" },
    { plank: "minecraft:pale_oak_planks", slab: "minecraft:pale_oak_slab" },
  ].forEach((recipe) => {
    const { plank, slab } = recipe;
    e.shaped(`6x ${slab}`, ["   ", "ppp", "   "], {
      p: plank,
    });
  });

  [
    "atmospheric:kousa_planks",
    "atmospheric:laurel_planks",
    "atmospheric:morado_planks",
    "atmospheric:yucca_planks",
    "autumnity:maple_planks",
    "atmospheric:rosewood_planks",
    "atmospheric:grimwood_planks",
    "betterarcheology:rotten_planks",
    "meadow:pine_planks",
    "beachparty:palm_planks",
    "minecraft:pale_oak_planks"
  ].forEach((plank) => {
    e.shaped("minecraft:chest", ["ppp", "p p", "ppp"], {
      p: plank,
    });
  });
});
