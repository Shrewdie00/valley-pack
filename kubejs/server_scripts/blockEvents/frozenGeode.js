console.info("[SOCIETY] frozenGeode.js loaded");

BlockEvents.broken(["society:geode_node", "society:omni_geode_node"], (e) => {
  const { level, player, block } = e;
  const season = global.getSeasonFromLevel(level);
  if (season !== "winter") return;

  const roll = Math.random();

  if (roll <= 0.1) {
    let geode = level.createEntity("minecraft:item");
    geode.x = block.x;
    geode.y = block.y;
    geode.z = block.z;
    geode.item = Item.of("society:frozen_geode");
    geode.spawn();

    e.server.runCommandSilent(
      `playsound stardew_fishing:complete block @a ${player.x} ${player.y} ${player.z}`
    );
  }
});
