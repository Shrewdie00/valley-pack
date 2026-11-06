console.info("[SOCIETY] neptuniumHoe.js loaded");

BlockEvents.rightClicked(
  [
    "dew_drop_farmland_growth:weak_fertilized_farmland",
    "dew_drop_farmland_growth:strong_fertilized_farmland",
    "dew_drop_farmland_growth:hyper_fertilized_farmland",
    "dew_drop_farmland_growth:bountiful_fertilized_farmland",
    "dew_drop_farmland_growth:low_quality_fertilized_farmland",
    "dew_drop_farmland_growth:high_quality_fertilized_farmland",
    "dew_drop_farmland_growth:pristine_quality_fertilized_farmland",
  ],
  (e) => {
    const { item, player, server, block } = e;
    if (item.id === "farm_and_charm:pitchfork") {
      const blockId = String(block.getId());
      if (0.5 < Math.random()) {
        block.popItemFromFace(
          blockId.substring(0, blockId.length - 10) + "r",
          "up"
        );
      }
      server.runCommandSilent(
        `playsound minecraft:item.armor.equip_leather block @a ${player.x} ${player.y} ${player.z}`
      );
      server.runCommandSilent(
        `playsound minecraft:item.hoe.till block @a ${player.x} ${player.y} ${player.z}`
      );
      player.swing();
      block.set("minecraft:dirt");
      e.cancel();
    }
  }
);
