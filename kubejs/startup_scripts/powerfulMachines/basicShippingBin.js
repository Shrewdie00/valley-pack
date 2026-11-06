// priority: 1
console.info("[SOCIETY] basicShippingBin.js loaded");

const debug = false;

const calculateSlotsNeeded = (coins) => {
  let slots = 0;
  coins.forEach((coinObj) => {
    let { count } = coinObj;
    for (let index = 0; index <= count; index += 64) {
      slots++;
    }
  });
  return slots;
};

StartupEvents.registry("block", (event) => {
  event
    .create("shippingbin:basic_shipping_bin", "cardinal")
    .tagBlock("minecraft:mineable/axe")
    .item((item) => {
      item.tooltip(Text.translatable("tooltip.society.shipping_bin").gray());
      item.modelJson({
        parent: "shippingbin:block/shipping_bin",
      });
    })
    .model("shippingbin:block/shipping_bin")
    .blockEntity((blockInfo) => {
      blockInfo.inventory(9, 4);
      blockInfo.initialData({ owner: "-1" });
      blockInfo.serverTick(10, 0, (entity) => {
        const { inventory, level, block } = entity;
        let dayTime = level.dayTime();
        let morningModulo = dayTime % 24000;
        if (rnd5()) global.cacheShippingBin(entity);
        if (morningModulo >= 5 && morningModulo < 15) {
          let slots = inventory.getSlots();
          let value = 0;
          let binPlayer = global.cacheShippingBin(entity);
          let blockData = block.getEntityData().data;
          let playerAttributes = blockData.attributes;
          let playerStages = blockData.stages;
          let removedSlots = [];
          let calculationResults;
          if (!playerStages || !playerAttributes) return;
          // Valley: always pay into the owner's bank account, never coins (decision 15, docs/patches.md).
          if (!global.valleyOwnerAccountOrCreate(blockData.owner)) return global.valleyOwnerlessBin(block);
          let valleyToAccount = true;

          calculationResults = global.processShippingBinInventory(
            inventory,
            slots,
            playerAttributes,
            playerStages,
            !valleyToAccount
          );
          value = Math.round(calculationResults.calculatedValue);
          removedSlots = calculationResults.removedItems;
          global.processValueOutput(
            value,
            slots,
            removedSlots,
            binPlayer,
            level.getServer(),
            block,
            inventory,
            valleyToAccount,
            blockData.owner
          );
        }
      }),
        blockInfo.rightClickOpensInventory();
      blockInfo.attachCapability(
        CapabilityBuilder.ITEM.blockEntity()
          .insertItem((blockEntity, slot, stack, simulate) =>
            blockEntity.inventory.insertItem(slot, stack, simulate)
          )
          .extractItem((blockEntity, slot, stack, simulate) =>
            blockEntity.inventory.extractItem(slot, stack, simulate)
          )
          .getSlotLimit((blockEntity, slot) => blockEntity.inventory.getSlotLimit(slot))
          .getSlots((blockEntity) => blockEntity.inventory.slots)
          .getStackInSlot((blockEntity, slot) => blockEntity.inventory.getStackInSlot(slot))
      );
    });
});
