// Valley: /valley town set (the town return scroll's destination = where the admin stands) and /valley town show.
// Also removes recipes for things that are not used here (docs/decisions-travel.md T1, T6).
ServerEvents.commandRegistry((e) => {
  const { commands: Commands } = e;
  e.register(
    Commands.literal("valley")
      .requires((src) => src.hasPermission(2))
      .then(
        Commands.literal("town")
          .then(Commands.literal("set").executes((ctx) => {
            let player = ctx.source.player;
            if (!player) return 0;
            let town = ctx.source.server.persistentData.getCompound("valleyTown");
            town.putDouble("x", player.x);
            town.putDouble("y", player.y);
            town.putDouble("z", player.z);
            town.putString("dim", String(player.level.dimension));
            ctx.source.server.persistentData.put("valleyTown", town);
            ctx.source.sendSuccess(Text.of(`마을 위치: ${Math.floor(player.x)} ${Math.floor(player.y)} ${Math.floor(player.z)}`), true);
            return 1;
          }))
          .then(Commands.literal("show").executes((ctx) => {
            let town = ctx.source.server.persistentData.getCompound("valleyTown");
            ctx.source.sendSuccess(Text.of(town.contains("x")
              ? `마을 위치: ${town.getString("dim")} ${Math.floor(town.getDouble("x"))} ${Math.floor(town.getDouble("y"))} ${Math.floor(town.getDouble("z"))}`
              : "마을 위치가 아직 없어요"), false);
            return 1;
          }))
      )
  );
});

ServerEvents.recipes((e) => {
  ["paraglider:paraglider", "paraglider:deku_leaf", "society:car_key"].forEach((item) => e.remove({ output: item }));
  ["automobility", "smallships"].forEach((mod) => e.remove({ mod: mod }));
});
