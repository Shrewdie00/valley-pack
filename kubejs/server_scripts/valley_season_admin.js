// Valley: admin season commands (spec 13, used by tests).
// /valley season get            -> current season
// /valley season set <season>   -> jump to the same day-of-season in <season>, keeping time of day
// /valley season tags <item>    -> seasons the item is a crop in
// Serene Seasons keeps its own cycle counter (advanced only while players are online),
// so we move that counter instead of the clock.

const VALLEY_SEASONS = ["spring", "summer", "autumn", "winter"];
const VALLEY_SEASON_TICKS = 3 * 10 * 24000; // 3 sub-seasons x sub_season_duration 10 days
const ValleySeasonHandler = Java.loadClass("sereneseasons.season.SeasonHandler");

ServerEvents.commandRegistry((e) => {
  const { commands: Commands, arguments: Arguments } = e;
  const reply = (ctx, text) => {
    ctx.source.sendSuccess(Text.of(text), false);
    return 1;
  };
  const seasonSet = (season) => (ctx) => {
    const level = ctx.source.server.overworld();
    const data = ValleySeasonHandler.getSeasonSavedData(level);
    const within = Number(data.seasonCycleTicks) % VALLEY_SEASON_TICKS;
    data.seasonCycleTicks = VALLEY_SEASONS.indexOf(season) * VALLEY_SEASON_TICKS + within;
    data.setDirty();
    return reply(ctx, `Season set to ${season} (cycle ticks ${data.seasonCycleTicks})`);
  };
  let set = Commands.literal("set");
  VALLEY_SEASONS.forEach((s) => {
    set = set.then(Commands.literal(s).executes(seasonSet(s)));
  });
  e.register(
    Commands.literal("valley")
      .requires((src) => src.hasPermission(2))
      .then(
        Commands.literal("season")
          .then(Commands.literal("get").executes((ctx) => reply(ctx, `Season: ${global.getSeasonFromLevel(ctx.source.server.overworld())}`)))
          .then(set)
          .then(
            Commands.literal("tags").then(
              Commands.argument("item", Arguments.GREEDY_STRING.create(e)).executes((ctx) => {
                const id = Arguments.GREEDY_STRING.getResult(ctx, "item");
                const seasons = VALLEY_SEASONS.filter((s) => Item.of(id).hasTag(`sereneseasons:${s}_crops`));
                return reply(ctx, `Crop seasons for ${id}: ${seasons.join(",") || "none"}`);
              })
            )
          )
      )
  );
});
