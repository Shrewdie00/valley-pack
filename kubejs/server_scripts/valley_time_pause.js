// Valley: time rules (spec 1).
// - Night skipping by sleep is disabled (playersSleepingPercentage 101).
// - When the server is empty, the day/night cycle stops so nothing advances while nobody plays.

// persistentData is NBT: booleans come back as bytes, so use the typed accessors.
const valleyPauseEnabled = (server) =>
  !server.persistentData.contains("valleyPauseWhenEmpty") || server.persistentData.getBoolean("valleyPauseWhenEmpty");

const valleyApplyTimePause = (server, onlinePlayers) => {
  const freeze = valleyPauseEnabled(server) && onlinePlayers <= 0;
  server.runCommandSilent(`gamerule doDaylightCycle ${!freeze}`);
};

ServerEvents.loaded((e) => {
  e.server.runCommandSilent("gamerule playersSleepingPercentage 101");
  valleyApplyTimePause(e.server, e.server.players.size());
});

PlayerEvents.loggedIn((e) => {
  valleyApplyTimePause(e.server, e.server.players.size());
});

PlayerEvents.loggedOut((e) => {
  // The leaving player is still in the list while this event runs.
  valleyApplyTimePause(e.server, e.server.players.size() - 1);
});

ServerEvents.commandRegistry((e) => {
  const { commands: Commands } = e;
  const setPause = (enabled) => (ctx) => {
    const server = ctx.source.server;
    server.persistentData.putBoolean("valleyPauseWhenEmpty", enabled);
    valleyApplyTimePause(server, server.players.size());
    ctx.source.sendSuccess(Text.of(`Pause when empty: ${enabled ? "on" : "off"}`), true);
    return 1;
  };
  e.register(
    Commands.literal("valley")
      .requires((src) => src.hasPermission(2))
      .then(
        Commands.literal("time").then(
          Commands.literal("pause")
            .then(Commands.literal("on").executes(setPause(true)))
            .then(Commands.literal("off").executes(setPause(false)))
            .then(
              Commands.literal("status").executes((ctx) => {
                const server = ctx.source.server;
                ctx.source.sendSuccess(
                  Text.of(`Pause when empty: ${valleyPauseEnabled(server) ? "on" : "off"}, players online: ${server.players.size()}`),
                  false
                );
                return 1;
              })
            )
        )
      )
  );
});
