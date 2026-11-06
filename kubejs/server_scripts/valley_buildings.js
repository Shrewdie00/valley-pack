// Valley: buildings (spec 8, docs/decisions-buildings.md). Where blueprints may be built is checked in the valley
// mod (land/BlueprintGuard: own plot only, town buildings admin only, big barn/coop need husbandry tier 1).
// Here: the carpenter's "village buildings" shop opens only for admins. The dialogs run /valleytownshop @p with raised
// permission (SVDialog), so the player's own permission is what counts.
ServerEvents.commandRegistry((e) => {
  const { commands: Commands, arguments: Arguments } = e;
  e.register(
    Commands.literal("valleytownshop")
      .requires((src) => src.hasPermission(2))
      .then(Commands.argument("who", Arguments.PLAYER.create(e)).executes((ctx) => {
        let player = null;
        try {
          player = Arguments.PLAYER.getResult(ctx, "who");
        } catch (err) {
          ctx.source.sendFailure(Text.of("그 플레이어가 없어요"));
          return 0;
        }
        if (!player.hasPermissions(2)) {
          player.tell(Text.yellow("마을 건물은 관리자가 지어요. 내 부지용 건물은 목수의 다른 메뉴에서 사세요."));
          return 0;
        }
        ctx.source.server.runCommandSilent(`openselector ${player.username} town_building_shop`);
        return 1;
      }))
  );
});
