console.info("[SOCIETY] disableDispenser.js loaded");

const DispenserBlock = Java.loadClass(
  "net.minecraft.world.level.block.DispenserBlock"
);
DispenserBlock.registerBehavior(Item.of("minecraft:bone_meal").item, () => {});
DispenserBlock.registerBehavior(Item.of("minecraft:carrot").item, () => {});
DispenserBlock.registerBehavior(Item.of("minecraft:potato").item, () => {});
DispenserBlock.registerBehavior(Item.of("farm_and_charm:onion").item, () => {});
DispenserBlock.registerBehavior(
  Item.of("veggiesdelight:sweet_potato").item,
  () => {}
);
