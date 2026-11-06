// Valley: shipping bin market (spec 3.2). Math is in startup_scripts/valley_market_rules.js.
// Sales are counted during the day and lower an item's level at the next day's start, so everyone
// selling the same day gets the same price. Stored in server.persistentData.valleyMarket:
//   levels: item -> level (absent = 1), sold: item -> units sold today, settings: floor/recovery/wobble/dropPerUnit.

const VALLEY_MARKET_KEYS = ["floor", "recovery", "wobble", "dropPerUnit"];
let valleyMarketLastDay = -1;

const valleyMarketTag = (parent, key) => {
  // getCompound returns a fresh, detached tag when missing, so attach it once.
  if (!parent.contains(key)) parent.put(key, parent.getCompound(key));
  return parent.getCompound(key);
};

const valleyMarketData = () => valleyMarketTag(Utils.server.persistentData, "valleyMarket");

const valleyMarketSettings = () => {
  let stored = valleyMarketTag(valleyMarketData(), "settings");
  let s = {};
  VALLEY_MARKET_KEYS.forEach((k) => {
    s[k] = stored.contains(k) ? Number(stored.getDouble(k)) : global.valleyMarketDefaults[k];
  });
  return s;
};

const valleyMarketDay = () => Math.floor(Number(Utils.server.overworld().getDayTime()) / 24000);

const valleyMarketLevel = (itemId) => {
  let levels = valleyMarketTag(valleyMarketData(), "levels");
  return levels.contains(itemId) ? Number(levels.getDouble(itemId)) : 1;
};

const valleyMarketToday = (itemId) =>
  global.valleyMarketMultiplier(valleyMarketLevel(itemId), valleyMarketDay(), itemId, valleyMarketSettings());

// Called from globalShippingBinHandlers.js for every sellable stack.
global.valleyMarketPrice = (itemId, value) => {
  if (!Utils.server) return value;
  let buff = global.valleyBuffValue ? global.valleyBuffValue("sell") : 1; // /valley buff sell (valley_ops.js)
  return Math.max(1, Math.round(value * valleyMarketToday(itemId) * buff));
};

global.valleyMarketRecordSale = (itemId, count) => {
  if (!Utils.server) return;
  let sold = valleyMarketTag(valleyMarketData(), "sold");
  sold.putInt(itemId, (sold.contains(itemId) ? sold.getInt(itemId) : 0) + Number(count));
};

const valleyMarketNewDay = () => {
  let data = valleyMarketData();
  let levels = valleyMarketTag(data, "levels");
  let sold = valleyMarketTag(data, "sold");
  let s = valleyMarketSettings();
  let items = {};
  levels.getAllKeys().forEach((k) => (items[String(k)] = true));
  sold.getAllKeys().forEach((k) => (items[String(k)] = true));
  Object.keys(items).forEach((item) => {
    let level = global.valleyMarketNextLevel(valleyMarketLevel(item), sold.contains(item) ? sold.getInt(item) : 0, s);
    if (level >= 1) levels.remove(item);
    else levels.putDouble(item, level);
  });
  data.remove("sold");
};

ServerEvents.tick((e) => {
  let day = valleyMarketDay();
  if (valleyMarketLastDay >= 0 && day > valleyMarketLastDay) valleyMarketNewDay();
  valleyMarketLastDay = day;
});

ServerEvents.commandRegistry((e) => {
  const { commands: Commands, arguments: Arguments } = e;
  const reply = (ctx, text) => {
    ctx.source.sendSuccess(Text.of(text), false);
    return 1;
  };
  let set = Commands.literal("set");
  VALLEY_MARKET_KEYS.forEach((key) => {
    set = set.then(
      Commands.literal(key).then(
        Commands.argument("value", Arguments.GREEDY_STRING.create(e)).executes((ctx) => {
          let value = Number(Arguments.GREEDY_STRING.getResult(ctx, "value"));
          if (!(value >= 0)) return reply(ctx, `Not a number >= 0`);
          valleyMarketTag(valleyMarketData(), "settings").putDouble(key, value);
          return reply(ctx, `Market ${key} = ${value}`);
        })
      )
    );
  });
  e.register(
    // Every valley_*.js registers this root; Brigadier keeps the first .requires, so keep them all at 2.
    Commands.literal("valley")
      .requires((src) => src.hasPermission(2))
      .then(
        Commands.literal("market")
          .then(
            Commands.literal("get").then(
              Commands.argument("item", Arguments.GREEDY_STRING.create(e)).executes((ctx) => {
                let item = Arguments.GREEDY_STRING.getResult(ctx, "item");
                return reply(ctx, `Market ${item}: level=${valleyMarketLevel(item).toFixed(3)} today=${valleyMarketToday(item).toFixed(3)}`);
              })
            )
          )
          .then(set)
          .then(
            Commands.literal("reset").executes((ctx) => {
              let data = valleyMarketData();
              data.remove("levels");
              data.remove("sold");
              return reply(ctx, "Market reset");
            })
          )
      )
  );
});
