console.info("[SOCIETY] addMailboxRecipes.js loaded");

ServerEvents.recipes((e) => {
  [
    { block: "minecraft:oak_planks", rail: "oak" },
    { block: "minecraft:acacia_planks", rail: "acacia" },
    { block: "minecraft:dark_oak_planks", rail: "dark_oak" },
    { block: "minecraft:birch_planks", rail: "birch" },
    { block: "minecraft:jungle_planks", rail: "jungle" },
    { block: "minecraft:spruce_planks", rail: "spruce" },
    { block: "minecraft:mangrove_planks", rail: "mangrove" },
    { block: "minecraft:cherry_planks", rail: "cherry" },
    { block: "minecraft:warped_planks", rail: "warped" },
    { block: "minecraft:crimson_planks", rail: "crimson" },
    { block: "minecraft:stripped_bamboo_block", rail: "stripped_bamboo" },
    { block: "minecraft:bamboo_block", rail: "bamboo" },
    { block: "quark:ancient_planks", rail: "quark_ancient" },
    { block: "quark:azalea_planks", rail: "quark_azalea" },
    { block: "quark:blossom_planks", rail: "quark_blossom" },
    { block: "minecraft:end_stone", rail: "ender" },
    { block: "minecraft:blackstone", rail: "blackstone" },
  ].forEach((recipe) => {
    const { block, rail } = recipe;
    e.shapeless(`railways:track_${rail}`, ["#create:tracks", block]);
    e.shapeless(`railways:track_${rail}_wide`, [`4x railways:track_${rail}_narrow`]);
    e.shapeless(`railways:track_${rail}`, [`2x railways:track_${rail}_narrow`]);
    e.shapeless(`2x railways:track_${rail}_narrow`, [`railways:track_${rail}`]);
    e.shapeless(`2x railways:track_${rail}`, [`railways:track_${rail}_wide`]);
    e.shapeless(`railways:track_${rail}_wide`, [`2x railways:track_${rail}`]);
  });
  e.shaped("32x railways:track_oak", ["fif", "f f", "fif"], {
    i: "minecraft:iron_ingot",
    f: "meadow:fire_log",
  });
  e.shaped("32x railways:track_oak", ["fif", "f f", "fif"], {
    i: "create:zinc_ingot",
    f: "meadow:fire_log",
  });
});
