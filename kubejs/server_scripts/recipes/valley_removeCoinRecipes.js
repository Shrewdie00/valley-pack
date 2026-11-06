// Valley: recipes that used coins and are gone (docs/coin-inventory.md 16-17, 22, 24). The pack overrode these ids
// with coin versions; those files are deleted, so the mods' own recipes would come back without this removal.
// The items come from NPC crafting (docs/npc-crafting.md) or are admin-placed town facilities.
ServerEvents.recipes((e) => {
  [
    "botania:conjuration_catalyst",
    "botania:flighttiara_0",
    "botania:petal_apothecary/entropinnyum",
    "botania:runic_altar/greed",
    "bountiful:crafting/bountyboard",
    "bountiful:crafting/decree",
    "create:crafting/kinetics/mechanical_crafter",
    "createutilities:shaped/void_motor",
    "createutilities:shaped/void_tank",
    "farmingforblockheads:market",
    "functionalstorage:ender_drawer",
    "gag:escape_rope",
    "refinedstorage:range_upgrade",
    "rehooked:diamond_chain",
    "rehooked:ender_hook",
    "rehooked:iron_hook",
    "rsinfinitybooster:infinity_card",
    "simplemagnets:advancedmagnet",
    "sophisticatedbackpacks:copper_backpack",
    "species:wicked_swapper",
    "splendid_slimes:corral_block",
    "toolbelt:pouch_via_sewing",
    "functionalstorage:custom_compacting/ancient_coin",
    "functionalstorage:custom_compacting/bevel",
    "functionalstorage:custom_compacting/cog",
    "functionalstorage:custom_compacting/crown",
    "functionalstorage:custom_compacting/iridium_coin",
    "functionalstorage:custom_compacting/prismatic_coin",
    "functionalstorage:custom_compacting/sprocket",
    "functionalstorage:custom_compacting/sun",
  ].forEach((id) => e.remove({ id: id }));
});
