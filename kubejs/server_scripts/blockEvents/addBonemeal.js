console.info("[SOCIETY] addBonemeal.js loaded");

BlockEvents.rightClicked(["meadow:eriophorum_tall", "meadow:small_fir"], (e) => {
  const { player, item, server, block } = e;
  if (
    player.getHeldItem("main_hand") == "minecraft:bone_meal" &&
    !player.cooldowns.isOnCooldown(item)
  ) {
    block.canSeeSky;
    player.getHeldItem("main_hand").count--;
    let crop = block.level.createEntity("minecraft:item");
    crop.x = block.x + Math.floor(Math.random() * 1.5) + 0.5;
    crop.y = block.y + 0.5;
    crop.z = block.z + Math.floor(Math.random() * 1.5) + 0.5;
    crop.item = Item.of(block.id);
    crop.spawn();
    block.level.spawnParticles(
      "minecraft:happy_villager",
      true,
      block.x + 0.5,
      block.y + 0.1,
      block.z + 0.5,
      0.1 * rnd(1, 4),
      0.1 * rnd(1, 4),
      0.1 * rnd(1, 4),
      10,
      0.1
    );
    server.runCommandSilent(
      `playsound minecraft:item.bone_meal.use block @a ${player.x} ${player.y} ${player.z}`
    );
    global.addItemCooldown(player, item, 1);
  }
});
