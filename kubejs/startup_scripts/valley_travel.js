// Valley: travel rules (docs/decisions-travel.md). No waystones or trains; walk, vanilla boats and minecarts,
// and gacha mounts. A town return scroll takes you back to town.

// T5/T4/T6: who may ride what is decided in valley_travel_rules.js.
const ValleyLivingEntity = Java.loadClass("net.minecraft.world.entity.LivingEntity");

// Riding starts on the server only (the client follows), so checks run there.
ForgeEvents.onEvent("net.minecraftforge.event.entity.EntityMountEvent", (e) => {
  let rider = e.getEntityMounting();
  let vehicle = e.getEntityBeingMounted();
  if (rider.level.isClientSide()) return;
  // Gacha mounts (server_scripts/valley_mount.js): only the owner rides; getting off sends it back.
  if (vehicle.tags.contains("valley_mount")) {
    if (!e.isMounting()) {
      vehicle.server.scheduleInTicks(1, () => vehicle.discard());
      return;
    }
    if (String(vehicle.persistentData.getString("valleyOwner")) !== String(rider.uuid)) {
      e.setCanceled(true);
      if (rider.isPlayer()) rider.setStatusMessage(Text.red("다른 사람의 탈것이에요."));
    }
    return;
  }
  if (!e.isMounting()) return;
  if (!rider.isPlayer() || rider.isCreative()) return;
  if (global.valleyMountBlocked(vehicle.type, vehicle instanceof ValleyLivingEntity)) {
    e.setCanceled(true);
    rider.setStatusMessage(Text.red("이건 탈 수 없어요. 탈것은 마구간 뽑기로 얻어요."));
  }
});

// T8: town return scroll. The town point is set by /valley town set (server_scripts/valley_travel_admin.js).
global.valleyTownTeleport = (player) => {
  let town = player.server.persistentData.getCompound("valleyTown");
  if (!town.contains("x")) {
    player.tell(Text.red("마을 위치가 아직 정해지지 않았어요 (관리자: /valley town set)"));
    return false;
  }
  if (String(player.level.dimension) === "society:skull_cavern") {
    player.tell(Text.red("해골 동굴 안에서는 쓸 수 없어요."));
    return false;
  }
  player.server.runCommandSilent(
    `execute in ${town.getString("dim")} run tp ${player.username} ${town.getDouble("x")} ${town.getDouble("y")} ${town.getDouble("z")}`
  );
  return true;
};

StartupEvents.registry("item", (e) => {
  e.create("society:town_return_scroll")
    .texture("minecraft:item/paper")
    .maxStackSize(16)
    .useAnimation("bow")
    .useDuration(() => 32)
    .use(() => true)
    .finishUsing((stack, level, entity) => {
      if (!level.isClientSide() && entity.isPlayer() && global.valleyTownTeleport(entity) && !entity.isCreative()) stack.shrink(1);
      return stack;
    });
});
