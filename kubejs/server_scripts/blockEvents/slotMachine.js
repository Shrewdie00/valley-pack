console.info("[SOCIETY] slotMachine.js loaded");

BlockEvents.rightClicked("tanukidecor:slot_machine", (e) => {
  const { block, player, hand, item, server } = e;
  if (player.isFake()) return;
  // Valley: bets come from the bank account, never coins (decision 14, docs/patches.md).
  if (!item.empty) return;
  if (hand == "OFF_HAND") return;
  const bet = global.valleyBetOrAsk(player, "slot");
  if (bet === null) e.cancel(); // the bet window opened instead of a spin
  const facing = block.getProperties().facing;
  const half = block.getProperties().half;
  const entityHalf = half === "upper" ? block : block.up;

  if (entityHalf.getEntityData().StartTime !== 0.0) {
    e.cancel();
    return;
  }

  if (block.properties.get("working") === "true") return;
  block.set(block.id, {
    facing: block.properties.get("facing"),
    half: block.properties.get("half"),
    waterlogged: block.properties.get("waterlogged"),
    working: true,
  });

  {
    if (!global.valleyPay(player, bet)) {
      block.set(block.id, {
        facing: block.properties.get("facing"),
        half: block.properties.get("half"),
        waterlogged: block.properties.get("waterlogged"),
        working: false,
      });
      return;
    }

    server.scheduleInTicks(115, () => {
      const { x, y, z } = entityHalf.getEntityData().SlotRotations;
      if (x === y && y === z) {
        const itemAddition = player.stages.has("the_red_and_the_black") ? 1 : 0;
        global.valleyDeposit(player, (3 + itemAddition) * bet);
        player.setStatusMessage(Text.gold(`+${global.formatPrice((3 + itemAddition) * bet)}`));
        let prize = global.valleySlotPrize(bet);
        server.runCommandSilent(
          `playsound stardew_fishing:complete block @a ${player.x} ${player.y} ${player.z}`
        );
        if (
          player.stages.has("adventuring_mastery") &&
          !player.stages.has("the_red_and_the_black") &&
          Math.random() < prize.redBlack
        ) {
          block.popItemFromFace(`1x society:the_red_and_the_black`, facing);
          server.tell(
            Text.translatable(
              "society.slot_machine.win_big",
              Text.red(`${player.username}`)
            ).black()
          );
        }
        if (
          Math.random() < prize.shard
        ) {
          block.popItemFromFace(
            `${1 + itemAddition}x society:prismatic_shard`,
            facing
          );
          server.tell(
            Text.translatable(
              "society.slot_machine.win_big",
              Text.gold(`${player.username}`)
            ).gray()
          );
        }
      } else {
        server.runCommandSilent(
          `playsound stardew_fishing:fish_escape block @a ${player.x} ${player.y} ${player.z}`
        );
      }
      block.set(block.id, {
        facing: block.properties.get("facing"),
        half: block.properties.get("half"),
        waterlogged: block.properties.get("waterlogged"),
        working: false,
      });
    });
  }
});
