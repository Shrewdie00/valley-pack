console.info("[SOCIETY] cancelEntityInteraction.js loaded");

ItemEvents.entityInteracted((e) => {
    const { item, player, target } = e;
    if (!target.type.includes("item_frame")) {
        return;
    }
    if (item.hasTag('forge:tools/fishing_rods') && item.nbt.toString().includes("bobber")) {
        player.tell(Text.translatable("society.item_frame.rod").red());
        e.cancel()
    }
});
