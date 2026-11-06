// Valley: admin toolbox, startup part (spec 13). The rest is server_scripts/valley_ops.js.

// Hidden-treasure event item: picking it up scores a point and it disappears.
StartupEvents.registry("item", (e) => {
  e.create("society:valley_treasure").texture("minecraft:item/gold_nugget").glow(true).maxStackSize(64);
});

// XP buff: vanilla experience orbs are multiplied while /valley buff xp runs (global.valleyBuffValue is set by the
// server script). Skill tree points are not vanilla XP and are not changed.
ForgeEvents.onEvent("net.minecraftforge.event.entity.player.PlayerXpEvent$XpChange", (e) => {
  if (e.getAmount() <= 0 || !global.valleyBuffValue) return;
  let m = global.valleyBuffValue("xp");
  if (m > 1) e.setAmount(Math.round(e.getAmount() * m));
});
