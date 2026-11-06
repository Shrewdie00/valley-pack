// Valley: land (spec 4, docs/decisions-land.md). Rules are in valley_land_rules.js, commands and protection in
// server_scripts/valley_land.js.

// Expansion deeds (sold by the carpenter, need a farming tier: valley_restrict_rules.js).
StartupEvents.registry("item", (e) => {
  e.create("society:plot_deed_5").texture("minecraft:item/map").maxStackSize(1);
  e.create("society:plot_deed_7").texture("minecraft:item/map").maxStackSize(1);
});

// Players can't claim or unclaim chunks themselves: done in the valley mod (land/ClaimGuard.java).

// The wild world resets now and then, so nobody keeps a respawn point there (beds still sleep).
ForgeEvents.onEvent("net.minecraftforge.event.entity.player.PlayerSetSpawnEvent", (e) => {
  if (e.getNewSpawn() == null || String(e.getSpawnLevel().location()) !== "valley:wild") return;
  e.setCanceled(true);
  e.getEntity().setStatusMessage(Text.yellow("야생에서는 부활 지점을 정할 수 없어요."));
});
