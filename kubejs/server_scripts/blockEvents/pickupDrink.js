console.info("[SOCIETY] pickupDrink.js loaded");

BlockEvents.leftClicked(
  [
    "society:starcardi",
    "society:star_coquito",
    "society:good_catawba",
    "society:nutty_basil",
    "society:forks_of_blue",
    "society:ancient_cider",
    "society:ancient_vespertine",
    "society:dewy_star",
    "society:beer_london",
    "society:beer_attunecore",
    "society:espresso",
    "society:steamed_milk",
    "society:mocha",
    "society:latte",
    "society:dirty_chai",
    "society:bowl_of_soul",
    "society:truffle_tea",
  ],
  (e) => {
    const { player, block, server } = e;

    player.give(block.id);
    block.set("minecraft:air")    
    server.runCommandSilent(
      `playsound minecraft:item.bottle.fill block @a ${player.x} ${player.y} ${player.z}`
    );
  }
);
